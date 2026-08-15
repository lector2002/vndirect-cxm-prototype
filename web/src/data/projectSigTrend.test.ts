import { describe, expect, it } from "vitest";
import { demoData } from "./fixtures/demo.ts";
import { seed } from "./fixtures/seed.ts";
import { isoFromVn, nextDay, projectSigTrend } from "./projectSigTrend.ts";

/* Bộ này canh ĐÚNG MỘT thứ mà không tầng nào phía trên canh hộ được: BA TRẠNG THÁI của `n`
   (ADR-001 §6). Hai trong ba trạng thái đọc giống hệt nhau nếu nhìn ẩu — "ngày này không có lượt
   bắn nào" — nhưng một cái nghĩa là *đo được, không bắn* và cái kia là *chưa đo*. Tầng vẽ phân biệt
   chúng bằng CÓ MẶT / VẮNG MẶT trong mảng trả về, nên phép cộng ở đây là chỗ duy nhất giữ được biên
   đó. Trộn hai cái = tái phạm luật không-trộn-chưa-biết-với-thiếu.

   Mọi số suy lại từ fixture, không ghim: đổi `SIG_INST_AT` hay `vol` trong demo thì bộ này vẫn đúng.  */

const AS_OF = isoFromVn(seed.asOf)!;
/** Cửa sổ 12 tháng — mốc dài nhất của thanh timeframe chung (ADR-001 §5). */
const WIN = { from: "2025-07-27", to: AS_OF };

function daysInclusive(from: string, to: string): number {
  let n = 0;
  for (let d = from; d <= to; d = nextDay(d)) n++;
  return n;
}

describe("projectSigTrend — chuỗi theo ngày của một điểm đo", () => {
  it("chưa khai mốc cắm đo ⇒ TỪ CHỐI vẽ, không trả mảng rỗng", () => {
    /* `seed` (Demo Mode TẮT) khai `instAt: null` cả 30 vì Bảng D còn treo. Mảng rỗng ở đây sẽ đọc
       thành "đo được, cả cửa sổ không có lượt nào" — một câu khẳng định không ai kiểm được. */
    const sig = seed.signals.find((s) => s.vol > 0)!;
    const r = projectSigTrend([], sig, WIN);
    expect(r.kind).toBe("refuse");
  });

  it("giá trị ĐÃ KHAI có mặt ở MỌI ngày đo được, kể cả ngày không bắn lần nào (trạng thái 2)", () => {
    const sig = demoData.signals.find((s) => s.vol > 0 && s.values.length > 0)!;
    const r = projectSigTrend(demoData.sigFires, sig, WIN);
    if (r.kind !== "draw") throw new Error("fixture demo phải dựng được chuỗi");

    const expected = daysInclusive(r.from, WIN.to);
    for (const val of sig.values) {
      const days = r.rows.filter((row) => row.val === val).map((row) => row.period);
      expect(days.length).toBe(expected);
      expect(new Set(days).size).toBe(expected); // không ngày nào lặp
    }
    // Và phải CÓ ít nhất một ngày n=0, nếu không ca "đo được, không bắn" chưa từng chạy qua đây.
    expect(r.rows.some((row) => row.n === 0)).toBe(true);
  });

  it("điểm đo cắm GIỮA cửa sổ ⇒ ngày trước mốc cắm VẮNG MẶT, không phải n=0 (trạng thái 3)", () => {
    const sig = demoData.signals.find(
      (s) => s.instAt !== null && s.instAt > WIN.from && s.vol > 0 && s.values.length > 0,
    );
    expect(sig).toBeDefined(); // fixture demo cố ý có nhóm cắm giữa cửa sổ — mất là mất luôn ca này
    const r = projectSigTrend(demoData.sigFires, sig!, WIN);
    if (r.kind !== "draw") throw new Error("điểm đo cắm giữa cửa sổ vẫn phải vẽ được phần sau mốc");

    expect(r.startsMidWindow).toBe(true);
    expect(r.from).toBe(sig!.instAt);
    expect(r.rows.every((row) => row.period >= sig!.instAt!)).toBe(true);
  });

  it("token CHƯA KHAI là một đường thật, bắt đầu ở ngày đầu nó xuất hiện — không kéo ngược về 0", () => {
    const sig = demoData.signals.find((s) =>
      demoData.sigFires.some((f) => f.sigId === s.id && !s.values.includes(f.val)),
    );
    expect(sig).toBeDefined(); // §10 phải có ca chạy được, xem SIG_UNDECLARED trong demo.ts
    const r = projectSigTrend(demoData.sigFires, sig!, WIN);
    if (r.kind !== "draw") throw new Error("phải vẽ được");

    expect(r.undeclared.length).toBeGreaterThan(0);
    for (const tok of r.undeclared) {
      const days = r.rows.filter((row) => row.val === tok).map((row) => row.period).sort();
      const firstFire = demoData.sigFires
        .filter((f) => f.sigId === sig!.id && f.val === tok && f.at >= r.from && f.at <= WIN.to)
        .map((f) => f.at)
        .sort()[0];
      expect(days[0]).toBe(firstFire);
      // Kéo ngược về đầu cửa sổ sẽ làm đường này dài BẰNG đường đã khai — đó đúng là lỗi cần chặn.
      expect(days.length).toBeLessThan(daysInclusive(r.from, WIN.to));
    }
  });

  it("tổng n của một giá trị bằng đúng số lượt bắn của giá trị đó trong cửa sổ", () => {
    const sig = demoData.signals.find((s) => s.vol > 0 && s.values.length > 0)!;
    const r = projectSigTrend(demoData.sigFires, sig, WIN);
    if (r.kind !== "draw") throw new Error("phải vẽ được");

    const byVal = new Map<string, number>();
    for (const row of r.rows) byVal.set(row.val, (byVal.get(row.val) ?? 0) + row.n);
    for (const [val, total] of byVal) {
      const fired = demoData.sigFires.filter(
        (f) => f.sigId === sig.id && f.val === val && f.at >= r.from && f.at <= WIN.to,
      ).length;
      expect(total).toBe(fired);
    }
  });

  it("cửa sổ hẹp chỉ trả ngày trong cửa sổ — phép cắt nằm ở đây, không ở tầng vẽ", () => {
    const sig = demoData.signals.find((s) => s.instAt === "2025-01-15" && s.vol > 0)!;
    const win = { from: "2026-07-01", to: AS_OF };
    const r = projectSigTrend(demoData.sigFires, sig, win);
    if (r.kind !== "draw") throw new Error("phải vẽ được");

    expect(r.from).toBe(win.from);
    expect(r.startsMidWindow).toBe(false);
    expect(r.rows.every((row) => row.period >= win.from && row.period <= win.to)).toBe(true);
  });
});
