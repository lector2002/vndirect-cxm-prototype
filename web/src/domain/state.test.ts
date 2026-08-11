import { describe, it, expect } from "vitest";
import type { Cfg, Source } from "../data/schema/index.ts";
import { seed, cfgDefault } from "../data/fixtures/seed.ts";
import { demoData } from "../data/fixtures/demo.ts";
import { stepState, stepWhy, metricState, sourceHealth, sourceDaysMissing, laneOf } from "./state.ts";

describe("stepState", () => {
  it("6 bước pilot (s1..s6) → ok watch crit ok watch ok", () => {
    const result = ["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => {
      const o = seed.obs.find((x) => x.stepId === id);
      return stepState(o, cfgDefault);
    });
    expect(result).toEqual(["ok", "watch", "crit", "ok", "watch", "ok"]);
  });

  it("đổi cfg.step.failCrit 15→10 → bước 02 (s2) chuyển crit", () => {
    const cfg = { ...cfgDefault, step: { ...cfgDefault.step, failCrit: 10 } };
    const o = seed.obs.find((x) => x.stepId === "s2");
    expect(stepState(o, cfg)).toBe("crit");
    // cfgDefault gốc không bị mutate
    expect(cfgDefault.step.failCrit).toBe(15);
  });

  it("bước không có obs → unknown", () => {
    expect(stepState(undefined, cfgDefault)).toBe("unknown");
  });
});

/* F9 (module-i-signal-registry-charter.md D4) — trường `cov` của Obs đã mất quyền đẩy trạng
   thái/lý do bước. Quét TOÀN BỘ data.obs (không bốc một bước): state.ts:20 (cũ) chỉ cho `cov` đẩy
   trạng thái khi bước đang 'ok' theo tỷ lệ thất bại — bốc một bước vốn đã watch/crit sẽ cho test
   xanh trong khi logic cũ còn nguyên (test rỗng). stepWhy() kiểm RIÊNG vì dòng lý do coverage cũ
   không phụ thuộc nhánh 'ok' — người dùng vẫn đọc thấy nó dù trạng thái không đổi. */
describe("F9 — trường cov của Obs không còn quyền quyết định", () => {
  it("mọi obs trong seed (30 bản ghi): stepState() và stepWhy() cho CÙNG kết quả ở cov=0 và cov=100", () => {
    /* Chặn vòng lặp rỗng, KHÔNG ghim 30 — fixture thêm bước thì test phải vẫn xanh (§7). */
    expect(seed.obs.length).toBeGreaterThan(0);
    for (const o of seed.obs) {
      const lo = { ...o, cov: 0 };
      const hi = { ...o, cov: 100 };
      expect(stepState(lo, cfgDefault)).toBe(stepState(hi, cfgDefault));
      expect(stepWhy(lo, cfgDefault)).toBe(stepWhy(hi, cfgDefault));
    }
  });
});

describe("metricState", () => {
  it("m-liveness (83,3% / target ≥90%, band watch:90 crit:85) → crit", () => {
    const m = seed.metrics.find((x) => x.id === "m-liveness")!;
    expect(metricState(m, cfgDefault)).toBe("crit");
  });

  it("m-ocr (71,0% / target ≥90%, band watch:90 crit:60) → watch", () => {
    const m = seed.metrics.find((x) => x.id === "m-ocr")!;
    expect(metricState(m, cfgDefault)).toBe("watch");
  });
});

/* 07/08 (module-i-signal-registry-charter.md §0 mục A, I3 Việc 1-2) — chấm sức khoẻ nguồn đổi từ
   "chậm hơn BÂY GIỜ mấy tiếng" (đọc `lagH` so SLA `cfg.source[id]`) sang "đã giao đủ dữ liệu của
   ngày cần chưa" (đọc `Source.last` so `CxmData.asOf`, theo NGÀY). Factory dựng Source tối giản —
   test nào cần `last` khác mặc định thì override tường minh, không dựa vào `lagH`. */
const src = (over: Partial<Source> & Pick<Source, "id">): Source => ({
  name: over.id,
  kind: "chat",
  vol: 0,
  lagH: 0,
  last: "01/01 · 00:00",
  metrics: [],
  pf: [],
  voice: false,
  note: "",
  ...over,
});

describe("sourceHealth — chấm theo MỐC SỐ LIỆU (asOf), không theo now/SLA giờ", () => {
  it("thiếu 0 ngày (Source.last = asOf) → 'ok', dù cfg.source không khai gì cho id đó", () => {
    const s = src({ id: "s1", last: "10/08 · 09:00" });
    expect(sourceHealth(s, cfgDefault, "10/08/2026")).toBe("ok");
  });

  it("thiếu 1 ngày, vol > 0 → 'stale' (đang trễ)", () => {
    const s = src({ id: "s1", last: "09/08 · 09:00", vol: 500 });
    expect(sourceHealth(s, cfgDefault, "10/08/2026")).toBe("stale");
  });

  it("thiếu ≥ deadDays ngày → 'down', bất kể vol/kind", () => {
    const s = src({ id: "s1", last: "05/08 · 09:00", vol: 900, kind: "event" });
    expect(sourceHealth(s, { ...cfgDefault, data: { ...cfgDefault.data, deadDays: 2 } }, "10/08/2026")).toBe(
      "down",
    );
  });

  /* Trạng thái THỨ TƯ (charter §0 mục A, Việc 2) — "im lặng, chưa phân định". Bật khi vol=0, thiếu
     ≥1 ngày nhưng < deadDays, VÀ nguồn do người chủ động gửi (không phải `kind:'event'`). Trên
     fixture hôm nay KHÔNG nguồn nào rơi vào ca này (xem test "7 nhãn" dưới) — phải dựng riêng. */
  it("vol=0, kind do người gửi (survey), thiếu 1 ngày < deadDays 2 → 'silent'", () => {
    const s = src({ id: "s1", kind: "survey", vol: 0, last: "09/08 · 09:00" });
    expect(sourceHealth(s, cfgDefault, "10/08/2026")).toBe("silent");
  });

  it("CÙNG dữ liệu, chỉ đổi kind → 'event' ⇒ 'stale', không phải 'silent' (im lặng đáng ngờ)", () => {
    const s = src({ id: "s1", kind: "event", vol: 0, last: "09/08 · 09:00" });
    expect(sourceHealth(s, cfgDefault, "10/08/2026")).toBe("stale");
  });

  it("cfg.source[id] KHÔNG còn được đọc — đổi sang giá trị bất kỳ, hạng nguồn không đổi", () => {
    const s = src({ id: "s1", last: "09/08 · 09:00", vol: 500 });
    const before = sourceHealth(s, cfgDefault, "10/08/2026");
    const changed: Cfg = { ...cfgDefault, source: { ...cfgDefault.source, s1: 999_999 } };
    expect(sourceHealth(s, changed, "10/08/2026")).toBe(before);
  });

  /* §12.1/§0 mục A — điều kiện chốt của cả module: cách chấm MỚI phải cho ĐÚNG BẢY nhãn như cách
     chấm CŨ (`lagH >= deadDays*24 → down`; `lagH > (cfg.source[id] ?? 6) → stale`; else 'ok') trên
     fixture hôm nay, CẢ HAI fixture. Đếm lại bằng công thức cũ tại chỗ — không ghim số 5/1/1. */
  it("bảy nhãn nguồn KHÔNG ĐỔI trên cả hai fixture — đối chiếu công thức cũ, đếm lại từ data", () => {
    const legacyHealth = (s: Source, cfg: Cfg): "ok" | "stale" | "down" => {
      if (s.lagH >= cfg.data.deadDays * 24) return "down";
      const sla = cfg.source[s.id] ?? 6;
      return s.lagH > sla ? "stale" : "ok";
    };
    for (const data of [seed, demoData]) {
      for (const s of data.sources) {
        expect(sourceHealth(s, cfgDefault, data.asOf)).toBe(legacyHealth(s, cfgDefault));
      }
    }
  });
});

describe("sourceDaysMissing", () => {
  it("cùng ngày với asOf → 0", () => {
    expect(sourceDaysMissing(src({ id: "s1", last: "10/08 · 09:00" }), "10/08/2026")).toBe(0);
  });

  it("lệch N ngày trong cùng năm, bắc qua ranh tháng → đúng N", () => {
    expect(sourceDaysMissing(src({ id: "s1", last: "31/07 · 09:00" }), "10/08/2026")).toBe(10);
  });

  it("khớp đúng nguồn thật của seed: src-zalo (19/07) so asOf (27/07/2026) → 8 ngày", () => {
    const zalo = seed.sources.find((x) => x.id === "src-zalo")!;
    expect(sourceDaysMissing(zalo, seed.asOf)).toBe(8);
  });
});

describe("laneOf", () => {
  it("suy đúng làn cho toàn bộ action trong seed", () => {
    /* CXA-013 = "off": laneOf trả 'off' khi iv==='validated', và CXA-013 đã lên validated cùng lúc
       với lc:'closed' (02/08/2026). Đây là action duy nhất ra khỏi 4 làn — trước đó nó ở 'verify'.
       LƯU Ý cho người đọc sau: 'off' hiện gộp HAI nhóm khác nhau — đã khép vòng thật (lc:'closed')
       và đã validated nhưng còn chờ khép vòng với khách. laneOf giữ nguyên 4 làn theo prototype nên
       không phân biệt; ai cần "chờ khép vòng" phải suy từ `lc`/bảng Loop, KHÔNG từ laneOf. */
    const expected: Record<string, string> = {
      "CXA-021": "approve",
      "CXA-017": "verify",
      "CXA-013": "off",
      "CXA-024": "confirm",
      "CXA-026": "approve",
      "CXA-028": "fix",
    };
    for (const a of seed.act) {
      expect(laneOf(a)).toBe(expected[a.id]);
    }
  });

  /* Phép kiểm chứng module A3: đổi chặng 1 'assign'→'confirm' (đọc a.cf thay vì a.owner) KHÔNG
     được dịch một đơn vị nào trong số đếm theo làn — seed đã gán cf theo luật owner==='Chưa gán'
     → 'pending' (A1), cố ý bảo toàn phân làn cũ. Đếm trực tiếp từ seed thật, không chép tay số cũ,
     để nếu luật gán cf ở A1 hoặc laneOf ở đây sai thì test này tự đỏ. */
  it("phân bố làn không dịch so với trước: confirm=1 approve=2 fix=1 verify=1 off=1 (tổng = seed.act.length)", () => {
    const counts: Record<string, number> = {};
    for (const a of seed.act) {
      const k = laneOf(a);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(counts).toEqual({ confirm: 1, approve: 2, fix: 1, verify: 1, off: 1 });
    expect(Object.values(counts).reduce((x, y) => x + y, 0)).toBe(seed.act.length);
  });
});
