import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import {
  BASE_LABEL,
  BASE_RANGE,
  DEFAULT_RANGE,
  RANGE_MONTHS,
  SEC,
  SUB_LABEL,
  effectiveMonths,
  maxRealMonths,
  scopeSources,
  scopeTotal,
} from "./sec.ts";

function snapshot() {
  const repo = new MockRepository();
  return { data: repo.getSnapshot(), cfg: repo.getCfg() };
}

describe("sec.ts — hằng số kỳ/nhãn", () => {
  it("BASE_LABEL/BASE_RANGE giữ đúng baseline 6 tháng cố định", () => {
    expect(BASE_LABEL).toBe("6 tháng gần nhất");
    expect(BASE_RANGE).toBe("28/01/2026 – 27/07/2026");
  });

  it("SUB_LABEL ánh xạ đúng 4 tần suất", () => {
    expect(SUB_LABEL.off).toBe("");
    expect(SUB_LABEL.daily).toBe("hằng ngày");
    expect(SUB_LABEL.weekly).toBe("hằng tuần");
    expect(SUB_LABEL.monthly).toBe("hằng tháng");
  });
});

describe("scopeSources/scopeTotal — VOC_SCOPE='all'", () => {
  it("scopeSources trả về mọi nguồn (scope='all')", () => {
    const { data } = snapshot();
    expect(scopeSources(data)).toEqual(data.sources);
  });

  it("scopeTotal = tổng vol của mọi nguồn trong scope", () => {
    const { data } = snapshot();
    const expected = data.sources.reduce((a, s) => a + s.vol, 0);
    expect(scopeTotal(data)).toBe(expected);
  });
});

describe("SEC — label tồn tại cho cả 2 phần (hero/lead/intro đã cắt 01/08)", () => {
  it("voc/cxm đều có label, KHÔNG còn field lead/intro", () => {
    expect(SEC.voc.label).toBe("Voice of Customer");
    expect(SEC.cxm.label).toContain("CXM");
    expect("lead" in SEC.voc).toBe(false);
    expect("intro" in SEC.voc).toBe(false);
  });
});

describe("RANGE_MONTHS/DEFAULT_RANGE — bộ lọc thời gian GLOBAL Enterpret-style (8 mốc, owner 01/08 mở rộng 02/08)", () => {
  it("đúng 8 mốc: default/3m/6m/12m tra thẳng số tháng; 7d/14d/4w best-effort=1; custom=default(6)", () => {
    expect(RANGE_MONTHS).toEqual({
      default: 6,
      "7d": 1,
      "14d": 1,
      "4w": 1,
      "3m": 3,
      "6m": 6,
      "12m": 12,
      custom: 6,
    });
  });

  it("mặc định là '6m' (giữ nguyên baseline cũ, KHÔNG đổi thành 'default')", () => {
    expect(DEFAULT_RANGE).toBe("6m");
  });
});

describe("effectiveMonths — clamp runtime theo maxRealMonths(data)", () => {
  it("3m/6m/12m/default/custom: khi requested <= maxReal, giữ nguyên RANGE_MONTHS[range]", () => {
    expect(effectiveMonths("3m", 12)).toBe(3);
    expect(effectiveMonths("6m", 12)).toBe(6);
    expect(effectiveMonths("12m", 12)).toBe(12);
    expect(effectiveMonths("default", 12)).toBe(6);
  });

  it("12m > maxReal (vd data chỉ có 6 điểm) → clamp xuống =maxReal (KHÔNG hiện quá số điểm thật có)", () => {
    expect(effectiveMonths("12m", 6)).toBe(6);
  });

  it("7d/14d/4w: best-effort=1 sẽ ra sparkline 1 điểm gãy → clamp LÊN tối thiểu 3 điểm khi data đủ", () => {
    expect(effectiveMonths("7d", 12)).toBe(3);
    expect(effectiveMonths("14d", 12)).toBe(3);
    expect(effectiveMonths("4w", 12)).toBe(3);
  });

  it("7d/14d/4w nhưng maxReal < 3 → clamp trên (=maxReal) thắng, không vẽ vượt quá dữ liệu thật đang có", () => {
    expect(effectiveMonths("7d", 2)).toBe(2);
    expect(effectiveMonths("4w", 0)).toBe(0);
  });
});

describe("maxRealMonths — suy từ chính data, không hardcode", () => {
  it("khớp độ dài lớn nhất trong mọi chuỗi series/theme thật của seed (hiện là 12 điểm/chuỗi, S2.7/D8a)", () => {
    const { data } = snapshot();
    const seriesLens = data.qt.flatMap((q) => (q.kind === "series" ? q.t.map((s) => s.p.length) : []));
    const themeLens = data.tax.filter((t) => t.lv === "theme" && t.pts).map((t) => t.pts!.length);
    const expected = Math.max(0, ...seriesLens, ...themeLens);
    expect(maxRealMonths(data)).toBe(expected);
    // Bất biến hiện tại của fixture (không phải quy tắc cứng của hàm): S2.7 mở rộng seed 6→12
    // điểm/chuỗi (D8a) đúng để chọn '12M' (12 tháng) KHÔNG còn là no-op của '6M' nữa — đây là
    // defect D8 đã sửa. TimeframeBar không cần báo "chuỗi thật ngắn hơn" ở mốc 12M với fixture này
    // (xem TimeframeBar.test.tsx cho ca capped nhân tạo maxReal<12).
    expect(expected).toBe(12);
  });
});
