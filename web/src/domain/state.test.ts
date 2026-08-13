import { describe, it, expect } from "vitest";
import type { Cfg, Source } from "../data/schema/index.ts";
import { seed, cfgDefault } from "../data/fixtures/seed.ts";
import { demoData } from "../data/fixtures/demo.ts";
import { stepState, stepWhy, metricState, sourceHealth, sourceDaysMissing, signalFeedHealth, signalFeedLast, laneOf } from "./state.ts";
import type { SourceHealth } from "./state.ts";

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
   test nào cần `last` khác mặc định thì override tường minh, không dựa vào `lagH`.

   11/08 (owner, giải C5): `cfg.source[id]` đổi đơn vị GIỜ → NGÀY và được đọc lại làm NHỊP GIAO riêng
   từng nguồn. Factory để `id` không nằm trong `cfgDefault.source`, nên nhịp mặc định
   (`SOURCE_ALLOW_DAYS_DEFAULT` = 0) áp cho mọi test không khai nhịp tường minh. */
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

describe("sourceHealth — chấm theo MỐC SỐ LIỆU (asOf) và nhịp giao tính bằng NGÀY, không theo now", () => {
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

  /* 11/08 (owner, giải C5) — ĐÂY LÀ ĐIỀU KHOẢN OWNER MUA. Từ 07/08 đến 11/08 test này khẳng định
     điều NGƯỢC LẠI ("cfg.source[id] KHÔNG còn được đọc") vì ô nhập nhóm 3 ở #/rules là control mồ
     côi. Owner chọn đổi đơn vị sang NGÀY thay vì bỏ nhóm, nên nhịp giao riêng lấy lại thẩm quyền —
     cùng một nguồn thiếu đúng 1 ngày, nhịp 0 thì "đang trễ", nhịp 1 thì "đang nhận". Không có phép
     kiểm nào khác chứng minh được ô đó còn cầm quyền hay không. */
  it("nhịp giao riêng CẦM QUYỀN chấm: cùng nguồn thiếu 1 ngày, nhịp 0 ⇒ stale, nhịp 1 ⇒ ok", () => {
    const s = src({ id: "s1", last: "09/08 · 09:00", vol: 500 });
    const withAllow = (d: number): Cfg => ({ ...cfgDefault, source: { ...cfgDefault.source, s1: d } });
    expect(sourceHealth(s, withAllow(0), "10/08/2026")).toBe("stale");
    expect(sourceHealth(s, withAllow(1), "10/08/2026")).toBe("ok");
  });

  /* Nới nhịp giao KHÔNG được biến nguồn đứt hẳn thành nguồn khoẻ mà bỏ qua bậc "đang trễ": mốc chết
     là `nhịp + deadDays`, nên nhịp nới thêm 1 ngày thì mốc chết cũng đẩy đúng 1 ngày, không mất bậc.
     Đếm lại từ chính công thức, không ghim ngày nào. */
  it("mốc chết đi THEO nhịp giao — nới nhịp 1 ngày thì đẩy mốc chết đúng 1 ngày, không nhảy bậc", () => {
    const deadDays = cfgDefault.data.deadDays;
    // Nguồn im hẳn (vol 0, kind survey) để bậc giữa là "silent" — phân biệt được với "down"/"ok".
    const at = (missingDays: number, allow: number) =>
      sourceHealth(
        src({ id: "s1", kind: "survey", vol: 0, last: `${String(10 - missingDays).padStart(2, "0")}/08 · 09:00` }),
        { ...cfgDefault, source: { ...cfgDefault.source, s1: allow } },
        "10/08/2026",
      );
    for (const allow of [0, 1]) {
      expect(at(allow, allow)).toBe("ok");
      expect(at(allow + 1, allow)).toBe("silent");
      expect(at(allow + deadDays, allow)).toBe("down");
    }
  });

  /* §12.1/§0 mục A — điều kiện chốt của cả module: BẢY nhãn không được đổi. Bậc thang 11/08 đối
     chiếu với bậc thang 07/08 (bản ngay trước khi nhịp giao lấy lại thẩm quyền) viết tại chỗ. Vì sao
     KHÔNG đối chiếu với công thức GIỜ nguyên bản nữa: `cfg.source` đã đổi đơn vị, nên công thức giờ
     không còn cfg nào hợp lệ để chạy — muốn giữ nó phải đóng băng bộ giờ cũ vào test, tức một hoá
     thạch mà người sau sẽ "sửa cho đúng". Chuỗi nghiệm thu giờ là: giờ→ngày đã chứng ở git history
     (07/08), ngày→ngày-có-nhịp chứng ở đây. Cả hai công thức đều tính lại từ `data.sources`. */
  it("bảy nhãn nguồn KHÔNG ĐỔI trên cả hai fixture — đối chiếu bậc thang 07/08, đếm lại từ data", () => {
    const health0708 = (s: Source, cfg: Cfg, asOf: string): SourceHealth => {
      const missing = sourceDaysMissing(s, asOf);
      if (missing >= cfg.data.deadDays) return "down";
      if (missing < 1) return "ok";
      if (s.vol > 0) return "stale";
      return s.kind === "event" ? "stale" : "silent";
    };
    for (const data of [seed, demoData]) {
      for (const s of data.sources) {
        expect(sourceHealth(s, cfgDefault, data.asOf)).toBe(health0708(s, cfgDefault, data.asOf));
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

/* signalFeedHealth — độ tươi điểm đo tính bằng máy (owner chốt 12/08, lối (i) của handoff §10c).
   Không ghim con số nào: mọi kỳ vọng suy lại từ chính `data.signals` và `sourceHealth()`. */
describe("signalFeedHealth", () => {
  it("chưa nối nguồn (srcId null) trả 'unknown', KHÔNG rơi về 'ok'", () => {
    const unlinked = seed.signals.filter((s) => s.srcId === null);
    expect(unlinked.length).toBeGreaterThan(0);
    for (const sg of unlinked) {
      expect(signalFeedHealth(sg, seed.sources, cfgDefault, seed.asOf)).toBe("unknown");
    }
  });

  it("đã nối nguồn thì trả ĐÚNG bậc thang của nguồn đó, không dựng bậc thang thứ hai", () => {
    const linked = seed.signals.filter((s) => s.srcId !== null);
    expect(linked.length).toBeGreaterThan(0);
    for (const sg of linked) {
      const src = seed.sources.find((s) => s.id === sg.srcId);
      expect(src).toBeDefined();
      expect(signalFeedHealth(sg, seed.sources, cfgDefault, seed.asOf)).toBe(
        sourceHealth(src as Source, cfgDefault, seed.asOf),
      );
    }
  });

  it("srcId trỏ vào nguồn không có thật vẫn là 'unknown' chứ không phải 'ok'", () => {
    const sg = { ...seed.signals[0], srcId: "src-khong-ton-tai" };
    expect(signalFeedHealth(sg, seed.sources, cfgDefault, seed.asOf)).toBe("unknown");
  });

  /* Dựng tay một nguồn ĐANG TRỄ rồi nối một điểm đo vào nó — fixture hôm nay không có sẵn ca đó
     (nguồn duy nhất không "ok" lại chưa điểm đo nào nối vào). KHÔNG viết dạng `if (…) return` để
     test tự bỏ qua: một test xanh mà không đo gì là đúng cái bẫy `[].every()` đã ghi ở
     SignalValueChart. Điều cần đo là quyền chấm nằm ở cfg NGUỒN, không phải ở điểm đo. */
  it("siết/nới nhịp giao của nguồn ở cfg thì điểm đo nối vào nó đổi theo — một luật, hai màn", () => {
    const src: Source = { ...seed.sources[0], id: "src-test-tre", last: "01/01", vol: 10 };
    const sg = { ...seed.signals[0], srcId: src.id };
    const sources = [...seed.sources, src];

    const strict: Cfg = { ...cfgDefault, source: { ...cfgDefault.source, [src.id]: 0 } };
    expect(signalFeedHealth(sg, sources, strict, seed.asOf)).not.toBe("ok");
    expect(signalFeedHealth(sg, sources, strict, seed.asOf)).toBe(sourceHealth(src, strict, seed.asOf));

    const loose: Cfg = { ...cfgDefault, source: { ...cfgDefault.source, [src.id]: 3650 } };
    expect(signalFeedHealth(sg, sources, loose, seed.asOf)).toBe("ok");
  });

  it("demoData cho cùng kết quả với seed — demo chỉ thay bảng khách, không đụng điểm đo", () => {
    for (const sg of demoData.signals) {
      expect(signalFeedHealth(sg, demoData.sources, cfgDefault, demoData.asOf)).toBe(
        signalFeedHealth(sg, seed.sources, cfgDefault, seed.asOf),
      );
    }
  });
});

describe("signalFeedLast", () => {
  it("chưa nối nguồn trả null — chỗ đọc phải quay về Signal.seen và nói rõ là mốc người khai", () => {
    for (const sg of seed.signals.filter((s) => s.srcId === null)) {
      expect(signalFeedLast(sg, seed.sources)).toBeNull();
    }
  });

  it("đã nối nguồn trả ĐÚNG mốc giao của nguồn, không phải mốc seen gõ tay của điểm đo", () => {
    for (const sg of seed.signals.filter((s) => s.srcId !== null)) {
      const src = seed.sources.find((s) => s.id === sg.srcId);
      expect(signalFeedLast(sg, seed.sources)).toBe(src?.last);
    }
  });
});
