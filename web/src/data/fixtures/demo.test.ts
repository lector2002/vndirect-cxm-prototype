import { describe, it, expect } from "vitest";
import { generateCustomers, generateEvidence, demoData } from "./demo.ts";
import { dims, seedNav, seedTour, cfgDefault, seed } from "./seed.ts";
import { validateFixture, ANON_CK } from "../validate.ts";
import { UNKNOWN_YET, MISSING } from "../segment.ts";
import type { Customer, AgeBand, NavBand, TenureBand, AcqChannel, TaxNode } from "../schema/index.ts";

/* Đếm known/chưa-biết/thiếu cho MỘT trục — dùng isSegUnknown/UNKNOWN_YET/MISSING của segment.ts,
   không tự so chuỗi sentinel. */
function counts(values: readonly string[]): { known: number; unknown: number; missing: number } {
  let known = 0, unknown = 0, missing = 0;
  for (const v of values) {
    if (v === UNKNOWN_YET) unknown++;
    else if (v === MISSING) missing++;
    else known++;
  }
  return { known, unknown, missing };
}

describe("demoData — fixture demo 300 khách (Module C, section C4)", () => {
  it("sinh đúng 300 khách, key không trùng, seed thật không bị đụng (vẫn 7 khách)", () => {
    expect(demoData.cust.length).toBe(300);
    const keys = new Set(demoData.cust.map((c) => c.key));
    expect(keys.size).toBe(300);
    expect(seed.cust.length).toBe(7);
  });

  it("sinh TẤT ĐỊNH — gọi generateCustomers(293) hai lần cho kết quả giống hệt nhau", () => {
    // 293 vì demoData = 7 khách thật (seed) + 293 khách sinh = 300 (xem comment tại demoData).
    const a = generateCustomers(293);
    const b = generateCustomers(293);
    expect(a).toEqual(b);
  });

  it("validateFixture(demoData, dims, nav, tour, cfg) trả về RỖNG", () => {
    const errors = validateFixture(demoData, dims, seedNav, seedTour, cfgDefault);
    expect(errors).toEqual([]);
  });

  it("mỗi trục age/nav/tenure/acq: known + chưa-biết + thiếu === 300", () => {
    for (const axis of ["age", "nav", "tenure", "acq"] as const) {
      const values = demoData.cust.map((c) => c[axis] as string);
      const { known, unknown, missing } = counts(values);
      expect(known + unknown + missing).toBe(300);
    }
  });

  /* acq là trục DUY NHẤT còn đủ cả hai loại "không biết" sau 04/08 — trước đó nav cũng có, nhưng owner
     chốt NAV lấy trực tiếp từ tài sản hiện tại nên không còn đường nào để "chưa biết" hay "bị rớt". */
  it("acq: cả ba nhóm known/chưa-biết/thiếu đều > 0 (còn giữ được cả hai loại 'không biết')", () => {
    const values = demoData.cust.map((c) => c.acq as string);
    const { known, unknown, missing } = counts(values);
    expect(known, "acq.known").toBeGreaterThan(0);
    expect(unknown, "acq.unknown").toBeGreaterThan(0);
    expect(missing, "acq.missing").toBeGreaterThan(0);
  });

  it("nav: KHÔNG có sentinel nào — mọi khách đều có dải (chưa có tài sản ⇒ '<50tr')", () => {
    const values = demoData.cust.map((c) => c.nav as string);
    const { known, unknown, missing } = counts(values);
    expect(known).toBe(300);
    expect(unknown).toBe(0);
    expect(missing).toBe(0);
  });

  it("age/tenure: không có ổ 'thiếu' cố ý (chỉ known/chưa-biết) — chỉ acq mới có bug thu thập", () => {
    for (const axis of ["age", "tenure"] as const) {
      const values = demoData.cust.map((c) => c[axis] as string);
      const { missing } = counts(values);
      expect(missing, `${axis}.missing`).toBe(0);
    }
  });

  it("mọi AgeBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: AgeBand[] = ["18-24", "25-34", "35-49", "50+"];
    const present = new Set(demoData.cust.map((c) => c.age));
    for (const b of bands) expect(present.has(b), `age band ${b}`).toBe(true);
  });

  it("mọi NavBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: NavBand[] = ["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", ">5tỷ"];
    const present = new Set(demoData.cust.map((c) => c.nav));
    for (const b of bands) expect(present.has(b), `nav band ${b}`).toBe(true);
  });

  it("mọi TenureBand khai trong schema đều xuất hiện ít nhất một lần", () => {
    const bands: TenureBand[] = ["<6 tháng", "6-24 tháng", "2-5 năm", ">5 năm"];
    const present = new Set(demoData.cust.map((c) => c.tenure));
    for (const b of bands) expect(present.has(b), `tenure band ${b}`).toBe(true);
  });

  it("mọi AcqChannel khai trong schema đều xuất hiện ít nhất một lần", () => {
    const channels: AcqChannel[] = ["banner", "giới thiệu", "chi nhánh", "tự tìm", "đối tác"];
    const present = new Set(demoData.cust.map((c) => c.acq));
    for (const ch of channels) expect(present.has(ch), `acq channel ${ch}`).toBe(true);
  });

  it("đủ 3 giá trị tier và các seg thật dùng trong seed, đủ pf", () => {
    const tiers = new Set(demoData.cust.map((c) => c.tier));
    expect(tiers.has("new")).toBe(true);
    expect(tiers.has("standard")).toBe(true);
    expect(tiers.has("high-value")).toBe(true);

    const segs = new Set(demoData.cust.map((c) => c.seg));
    expect(segs.has("Mới mở TK")).toBe(true);
    expect(segs.has("Khách chuyển từ CTCK khác")).toBe(true);
    expect(segs.has("Khách 50+")).toBe(true);

    const pfs = new Set(demoData.cust.map((c) => c.pf));
    expect(pfs.has("android")).toBe(true);
    expect(pfs.has("ios")).toBe(true);
  });

  it("bất biến: seg 'Khách 50+' luôn kèm age '50+'", () => {
    for (const c of demoData.cust) {
      if (c.seg === "Khách 50+") expect(c.age).toBe("50+");
    }
  });

  /* Bất biến C1 cũ ("high-value ⟹ nav không sentinel", chống survivorship bias) nay là tập con của test
     "nav: KHÔNG có sentinel nào" ở trên nên bỏ. Thay bằng điều kiện MẠNH HƠN còn ý nghĩa: high-value
     phải nằm ở dải NAV cao thật (hoặc là khách chuyển từ CTCK khác) — chặn cảnh gán tier tuỳ ý. */
  it("bất biến: tier 'high-value' luôn ở dải NAV cao, hoặc là khách chuyển từ CTCK khác", () => {
    for (const c of demoData.cust) {
      if (c.tier !== "high-value") continue;
      const ok = c.nav === "1-5tỷ" || c.nav === ">5tỷ" || c.seg === "Khách chuyển từ CTCK khác";
      expect(ok, `${c.key}: tier high-value nhưng nav="${c.nav}" seg="${c.seg}"`).toBe(true);
    }
  });

  it("dùng Customer[] không any — khớp type khi ép vào readonly Customer", () => {
    const sample: Customer = demoData.cust[0];
    expect(typeof sample.key).toBe("string");
  });
});

/* Module F, section F2 — bằng chứng demo có khối lượng + ck hợp lệ. seed.ev (17 dòng, giữ nguyên
   không sửa) vẫn còn 7 dòng có ck không tra ra khách (đo lại 04/08: 15 giá trị ck khác nhau, 7
   khớp cust.key, 2 dòng 'Ẩn danh', 7 dòng khoá mồ côi) — đó là luật
   ĐỊNH DẠNG của validateFixture nhóm 21 chấp nhận được (xem validate.test.ts nhóm 21), KHÔNG phải
   thứ nhóm test này kiểm. Test "tra ra được" dưới đây CHỈ áp cho bằng chứng MỚI SINH (id bắt đầu
   'EV-DEMO-') — đây là điểm tôi phải tự quyết vì mô tả gốc nói "mọi ck trong demoData", mà áp
   nguyên văn lên CẢ demoData.ev sẽ luôn đỏ với 8 giá trị mồ côi cũ của seed dù không đụng gì tới
   phần mới sinh (xem "Điểm nghi vấn" trong báo cáo section). */
describe("demoData.ev — bằng chứng demo sinh thêm cho theme (Module F, section F2)", () => {
  const seedEvIds = new Set(seed.ev.map((e) => e.id));
  const generatedEv = demoData.ev.filter((e) => !seedEvIds.has(e.id));

  it("sinh TẤT ĐỊNH — gọi generateEvidence hai lần với cùng input ra cùng kết quả", () => {
    const themes = seed.tax.filter((t): t is TaxNode => t.lv === "theme");
    const custKeys = demoData.cust.map((c) => c.key);
    const a = generateEvidence(themes, custKeys);
    const b = generateEvidence(themes, custKeys);
    expect(a).toEqual(b);
  });

  it("mọi ck của bằng chứng MỚI SINH không phải 'Ẩn danh' đều tra ra một cust.key thật trong demoData", () => {
    const custKeys = new Set(demoData.cust.map((c) => c.key));
    const unresolved = generatedEv.filter((e) => e.ck !== ANON_CK && !custKeys.has(e.ck));
    expect(unresolved.map((e) => `${e.id}:${e.ck}`)).toEqual([]);
  });

  /* Số bằng chứng/theme KHÔNG còn là một hằng số chung — mẫu số là `theme.n` (bề rộng thanh
     ThemeStackBlock, lệch 210-412 giữa theme), nên luật là COVERAGE=0.7 × theme.n, không phải
     một số tuyệt đối. Ghim ĐÚNG kết quả của luật (không tính nhẩm một số cố định) để test kiểm
     được chính công thức — nếu ai đổi COVERAGE hay cách tính, test này bắt được ngay. */
  it("mỗi theme có ĐÚNG round(theme.n × 0.7) bằng chứng mới sinh — kiểm luật coverage theo theme.n, không phải một số tuyệt đối", () => {
    const themes = seed.tax.filter((t): t is TaxNode => t.lv === "theme");
    for (const theme of themes) {
      const expected = Math.round(theme.n * 0.7);
      const count = generatedEv.filter((e) => e.tax.includes(theme.id)).length;
      expect(count, `theme ${theme.id} (n=${theme.n})`).toBe(expected);
    }
  });

  it("có ít nhất vài bằng chứng 'Ẩn danh' trong phần mới sinh — đủ để đoạn Ẩn danh của chart hiện ra", () => {
    const anonCount = generatedEv.filter((e) => e.ck === ANON_CK).length;
    expect(anonCount).toBeGreaterThan(5);
  });

  it("validateFixture(demoData, dims, nav, tour, cfg) vẫn RỖNG sau khi thêm bằng chứng demo", () => {
    const errors = validateFixture(demoData, dims, seedNav, seedTour, cfgDefault);
    expect(errors).toEqual([]);
  });
});
