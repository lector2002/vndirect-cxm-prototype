import { describe, it, expect } from "vitest";
import { seed, cfgDefault } from "../data/fixtures/seed.ts";
import { stepState, metricState, sourceHealth, laneOf } from "./state.ts";

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

describe("sourceHealth", () => {
  it("src-ga (lagH 4h, SLA 6h) → ok", () => {
    const s = seed.sources.find((x) => x.id === "src-ga")!;
    expect(sourceHealth(s, cfgDefault)).toBe("ok");
  });

  it("src-survey (lagH 12h, SLA 6h) → stale", () => {
    const s = seed.sources.find((x) => x.id === "src-survey")!;
    expect(sourceHealth(s, cfgDefault)).toBe("stale");
  });

  it("src-zalo (lagH 192h ≥ deadDays 2 ngày) → down", () => {
    const s = seed.sources.find((x) => x.id === "src-zalo")!;
    expect(sourceHealth(s, cfgDefault)).toBe("down");
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
