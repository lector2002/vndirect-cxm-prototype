import { describe, it, expect } from "vitest";
import { cfgDefault } from "../data/fixtures/seed.ts";
import type { Cfg, CfgSignalBand, SigFire, Signal } from "../data/schema/index.ts";
import {
  signalEval,
  signalEvalAll,
  signalEvalWhyText,
  signalTraffic,
  signalTrafficAll,
  signalTrafficText,
  SIGNAL_WINDOW_DAYS_DEFAULT,
} from "./signalEval.ts";

/* asOf của test: 27/07/2026 (cùng seed.asOf) ⇒ cửa sổ mặc định 7 ngày = 21/07..27/07. */
const AS_OF = "27/07/2026";
const IN_WIN = "2026-07-25";
const OUT_WIN = "2026-07-10";

function sig(over: Partial<Signal> = {}): Signal {
  return {
    id: "sx",
    tpId: "tp1",
    name: "test_signal",
    st: "live",
    pf: ["web"],
    es: "client",
    vol: 10,
    seen: null,
    srcId: null,
    metrics: [],
    desc: "",
    instAt: "2026-01-01",
    values: ["success", "fail"],
    ...over,
  };
}

function fire(val: string, at: string, sigId = "sx"): SigFire {
  return { sigId, val, custKey: null, pf: "web", at };
}

function cfgWith(band: CfgSignalBand | null, id = "sx"): Cfg {
  return { ...cfgDefault, signal: band ? { [id]: band } : {} };
}

describe("signalEval — unknown không rơi về ok, mỗi lý do một tên", () => {
  it("chưa có entry → unset", () => {
    expect(signalEval(sig(), [], cfgWith(null), AS_OF)).toEqual({ state: "unknown", why: "unset" });
  });

  it("st gap/designed → lifecycle, kể cả khi đã đặt ngưỡng", () => {
    const cfg = cfgWith({ kind: "floor", warn: 5, crit: 1 });
    expect(signalEval(sig({ st: "gap" }), [], cfg, AS_OF)).toEqual({ state: "unknown", why: "lifecycle" });
    expect(signalEval(sig({ st: "designed" }), [], cfg, AS_OF)).toEqual({ state: "unknown", why: "lifecycle" });
  });

  it("asOf sai khuôn → bad-asof", () => {
    const cfg = cfgWith({ kind: "floor", warn: 5, crit: 1 });
    expect(signalEval(sig(), [], cfg, "2026-07-27")).toEqual({ state: "unknown", why: "bad-asof" });
  });

  it("rate với bad rỗng → no-values (entry khai dở, không phải mâu thuẫn)", () => {
    const cfg = cfgWith({ kind: "badRate", bad: [], warn: 10, crit: 20 });
    expect(signalEval(sig(), [fire("fail", IN_WIN)], cfg, AS_OF)).toEqual({ state: "unknown", why: "no-values" });
  });

  it("rate không có lượt bắn trong cửa sổ → no-fires (lượt ngoài cửa sổ không cứu)", () => {
    const cfg = cfgWith({ kind: "badRate", bad: ["fail"], warn: 10, crit: 20 });
    expect(signalEval(sig(), [fire("fail", OUT_WIN)], cfg, AS_OF)).toEqual({ state: "unknown", why: "no-fires" });
  });

  it("rate n < minN → small-sample kèm n và minN (2 lượt toàn fail KHÔNG thành crit)", () => {
    const cfg = cfgWith({ kind: "badRate", bad: ["fail"], minN: 20, warn: 10, crit: 20 });
    const fires = [fire("fail", IN_WIN), fire("fail", IN_WIN)];
    expect(signalEval(sig(), fires, cfg, AS_OF)).toEqual({ state: "unknown", why: "small-sample", n: 2, minN: 20 });
  });

  it("floor/ceiling khi instAt null → no-instAt (0 lượt mơ hồ giữa im và chưa đo)", () => {
    const cfg = cfgWith({ kind: "floor", warn: 5, crit: 1 });
    expect(signalEval(sig({ instAt: null }), [], cfg, AS_OF)).toEqual({ state: "unknown", why: "no-instAt" });
  });

  it("floor/ceiling khi cắm đo giữa cửa sổ → partial-window", () => {
    const cfg = cfgWith({ kind: "ceiling", warn: 1, crit: 3 });
    expect(signalEval(sig({ instAt: "2026-07-24" }), [fire("fail", IN_WIN)], cfg, AS_OF)).toEqual({
      state: "unknown",
      why: "partial-window",
    });
  });
});

describe("signalEval — bốn dụng cụ, bốn chiều xấu", () => {
  it("badRate: vượt lên là xấu — dưới warn ok, chạm warn watch, chạm crit crit", () => {
    const cfg = cfgWith({ kind: "badRate", bad: ["fail"], warn: 10, crit: 20 });
    const mk = (nFail: number, nOk: number) => [
      ...Array.from({ length: nFail }, () => fire("fail", IN_WIN)),
      ...Array.from({ length: nOk }, () => fire("success", IN_WIN)),
    ];
    expect(signalEval(sig(), mk(1, 19), cfg, AS_OF)).toEqual({ state: "ok", n: 20, value: 5 });
    expect(signalEval(sig(), mk(3, 17), cfg, AS_OF)).toEqual({ state: "watch", n: 20, value: 15 });
    expect(signalEval(sig(), mk(4, 16), cfg, AS_OF)).toEqual({ state: "crit", n: 20, value: 20 });
  });

  it("goodRate: tụt xuống là xấu — trên warn ok, chạm warn watch, chạm crit crit", () => {
    const cfg = cfgWith({ kind: "goodRate", good: ["immediate"], warn: 80, crit: 60 });
    const mk = (nGood: number, nRest: number) => [
      ...Array.from({ length: nGood }, () => fire("immediate", IN_WIN)),
      ...Array.from({ length: nRest }, () => fire("end_of_day", IN_WIN)),
    ];
    expect(signalEval(sig({ values: ["immediate", "end_of_day"] }), mk(9, 1), cfg, AS_OF)).toEqual({ state: "ok", n: 10, value: 90 });
    expect(signalEval(sig({ values: ["immediate", "end_of_day"] }), mk(8, 2), cfg, AS_OF)).toEqual({ state: "watch", n: 10, value: 80 });
    expect(signalEval(sig({ values: ["immediate", "end_of_day"] }), mk(5, 5), cfg, AS_OF)).toEqual({ state: "crit", n: 10, value: 50 });
  });

  it("goodRate fail-safe: giá trị MỚI chưa khai pha loãng phần tốt → chuông reo", () => {
    const cfg = cfgWith({ kind: "goodRate", good: ["immediate"], warn: 80, crit: 60 });
    const fires = [
      ...Array.from({ length: 5 }, () => fire("immediate", IN_WIN)),
      ...Array.from({ length: 5 }, () => fire("gia_tri_moi_chua_khai", IN_WIN)),
    ];
    expect(signalEval(sig(), fires, cfg, AS_OF)).toEqual({ state: "crit", n: 10, value: 50 });
  });

  it("floor: tụt xuống là xấu — trên warn ok, chạm warn watch, chạm crit crit", () => {
    const cfg = cfgWith({ kind: "floor", warn: 5, crit: 2 });
    const mk = (n: number) => Array.from({ length: n }, () => fire("tapped", IN_WIN));
    expect(signalEval(sig(), mk(6), cfg, AS_OF)).toEqual({ state: "ok", n: 6, value: 6 });
    expect(signalEval(sig(), mk(5), cfg, AS_OF)).toEqual({ state: "watch", n: 5, value: 5 });
    expect(signalEval(sig(), mk(2), cfg, AS_OF)).toEqual({ state: "crit", n: 2, value: 2 });
  });

  it("ceiling đếm tất: vượt lên là xấu", () => {
    const cfg = cfgWith({ kind: "ceiling", warn: 2, crit: 4 });
    const mk = (n: number) => Array.from({ length: n }, () => fire("blur", IN_WIN));
    expect(signalEval(sig(), mk(1), cfg, AS_OF)).toEqual({ state: "ok", n: 1, value: 1 });
    expect(signalEval(sig(), mk(2), cfg, AS_OF)).toEqual({ state: "watch", n: 2, value: 2 });
    expect(signalEval(sig(), mk(4), cfg, AS_OF)).toEqual({ state: "crit", n: 4, value: 4 });
  });

  it("ceiling + bad: chỉ đếm lượt mang giá trị xấu — ca hiếm-mà-nghiêm-trọng, 2 lượt fail/30 ngày là crit", () => {
    const cfg = cfgWith({ kind: "ceiling", bad: ["fail"], winDays: 30, warn: 1, crit: 2 });
    const fires = [
      fire("fail", "2026-07-05"),
      fire("fail", "2026-07-20"),
      ...Array.from({ length: 8 }, () => fire("success", IN_WIN)),
    ];
    expect(signalEval(sig(), fires, cfg, AS_OF)).toEqual({ state: "crit", n: 2, value: 2 });
  });

  it("winDays cắt đúng biên: lượt đúng ngày đầu cửa sổ tính vào, trước đó một ngày thì không", () => {
    const cfg = cfgWith({ kind: "ceiling", warn: 1, crit: 2, winDays: 7 });
    // 27/07 - 6 ngày = 21/07 là ngày đầu cửa sổ
    expect(signalEval(sig(), [fire("fail", "2026-07-21")], cfg, AS_OF)).toEqual({ state: "watch", n: 1, value: 1 });
    expect(signalEval(sig(), [fire("fail", "2026-07-20")], cfg, AS_OF)).toEqual({ state: "ok", n: 0, value: 0 });
  });

  it("thiếu winDays → mặc định SIGNAL_WINDOW_DAYS_DEFAULT", () => {
    expect(SIGNAL_WINDOW_DAYS_DEFAULT).toBe(7);
    const cfg = cfgWith({ kind: "ceiling", warn: 1, crit: 2 });
    expect(signalEval(sig(), [fire("fail", "2026-07-21")], cfg, AS_OF)).toEqual({ state: "watch", n: 1, value: 1 });
  });
});

describe("signalEvalAll — một lượt cho cả danh sách, khớp từng con số với bản chạy lẻ", () => {
  it("trả đúng kết quả của signalEval cho từng điểm đo, kể cả điểm chưa đặt", () => {
    const a = sig({ id: "sa" });
    const b = sig({ id: "sb" });
    const cfg: Cfg = {
      ...cfgDefault,
      signal: { sa: { kind: "badRate", bad: ["fail"], warn: 10, crit: 20 } },
    };
    const fires = [fire("fail", IN_WIN, "sa"), fire("success", IN_WIN, "sa"), fire("fail", IN_WIN, "sb")];
    const all = signalEvalAll([a, b], fires, cfg, AS_OF);
    expect(all.get("sa")).toEqual(signalEval(a, fires, cfg, AS_OF));
    expect(all.get("sb")).toEqual({ state: "unknown", why: "unset" });
  });
});

describe("signalEvalWhyText — chỉ unknown mới có câu, small-sample nói ra n và minN", () => {
  it("trạng thái đo được trả null", () => {
    expect(signalEvalWhyText({ state: "ok", n: 5, value: 5 })).toBeNull();
  });
  it("small-sample", () => {
    expect(signalEvalWhyText({ state: "unknown", why: "small-sample", n: 2, minN: 20 })).toBe("chưa đủ mẫu (n=2 < 20)");
  });
});

/* "Traffic per day" (19/08): per-day phải đếm từ hạt thô trong cửa sổ, KHÔNG đọc Signal.vol
   (tổng cả đời). Bốn thứ đáng canh: cổng unknown kế thừa đúng signalEval (lifecycle/no-instAt/
   partial-window, không prorate); 0 lượt cửa sổ đủ ngày là ĐO ĐƯỢC 0 chứ không unknown; lượt
   ngoài cửa sổ không cộng; bản chạy cả danh sách khớp bản chạy lẻ. */
describe("signalTraffic — lưu lượng theo ngày đếm từ hạt thô, không đọc Signal.vol", () => {
  it("gap/designed → lifecycle; instAt null → no-instAt; cắm giữa cửa sổ → partial-window", () => {
    expect(signalTraffic(sig({ st: "gap" }), [], AS_OF)).toEqual({ state: "unknown", why: "lifecycle" });
    expect(signalTraffic(sig({ instAt: null }), [], AS_OF)).toEqual({ state: "unknown", why: "no-instAt" });
    expect(signalTraffic(sig({ instAt: "2026-07-24" }), [], AS_OF)).toEqual({ state: "unknown", why: "partial-window" });
  });

  it("asOf sai khuôn → bad-asof", () => {
    expect(signalTraffic(sig(), [], "2026-07-27")).toEqual({ state: "unknown", why: "bad-asof" });
  });

  it("đếm ĐÚNG lượt trong cửa sổ (biên trái lấy cả), lượt ngoài không cộng, vol không tham gia", () => {
    const winStart = "2026-07-21"; // asOf 27/07, cửa sổ 7 ngày
    const fires = [fire("success", winStart), fire("fail", IN_WIN), fire("success", OUT_WIN)];
    const t = signalTraffic(sig({ vol: 9999 }), fires, AS_OF);
    expect(t).toEqual({ state: "measured", n: 2, winDays: SIGNAL_WINDOW_DAYS_DEFAULT, perDay: 2 / 7 });
  });

  it("0 lượt trong cửa sổ phủ đủ ngày là ĐO ĐƯỢC 0/ngày, không phải unknown", () => {
    expect(signalTraffic(sig(), [], AS_OF)).toEqual({ state: "measured", n: 0, winDays: 7, perDay: 0 });
  });

  it("signalTrafficAll khớp từng kết quả của signalTraffic, kể cả dòng unknown", () => {
    const a = sig({ id: "sa" });
    const b = sig({ id: "sb", instAt: null });
    const fires = [fire("success", IN_WIN, "sa"), fire("fail", OUT_WIN, "sa")];
    const all = signalTrafficAll([a, b], fires, AS_OF);
    expect(all.get("sa")).toEqual(signalTraffic(a, fires, AS_OF));
    expect(all.get("sb")).toEqual(signalTraffic(b, fires, AS_OF));
  });
});

describe("signalTrafficText — một phép viết cho cả ba tầng", () => {
  it("dưới 10 giữ một chữ số lẻ phẩy Việt, tròn chục làm tròn nguyên, unknown trả null", () => {
    expect(signalTrafficText({ state: "measured", n: 2, winDays: 7, perDay: 2 / 7 })).toBe("0,3");
    expect(signalTrafficText({ state: "measured", n: 21, winDays: 7, perDay: 3 })).toBe("3");
    expect(signalTrafficText({ state: "measured", n: 115, winDays: 7, perDay: 115 / 7 })).toBe("16");
    expect(signalTrafficText({ state: "unknown", why: "no-instAt" })).toBeNull();
  });
});
