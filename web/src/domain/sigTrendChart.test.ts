import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { dims, seed } from "../data/fixtures/seed.ts";
import { isoFromVn } from "../data/projectSigTrend.ts";
import { sigCut } from "./sigCut.ts";
import { buildBuckets, sigTrendChart } from "./sigTrendChart.ts";
import type { RangeKey } from "../store/timeframe.ts";

/* Canh ba thứ MÁY TỰ CHỌN (ADR-001 §2, §4, §5) và một thứ dễ mất nhất khi gộp lên hạt: biên giữa
   *đo được, không bắn* và *chưa đo*. Mọi số suy từ fixture. */

const AS_OF = isoFromVn(seed.asOf)!;
const RANGES: RangeKey[] = ["7d", "14d", "4w", "3m", "6m", "12m", "default", "custom"];

describe("buildBuckets — hạt và số kỳ suy từ mốc, không cho chọn tay", () => {
  it("mọi mốc đều dựng được kỳ, kỳ cuối chứa mốc số liệu, các kỳ liền nhau không hở không chồng", () => {
    for (const r of RANGES) {
      const { buckets } = buildBuckets(AS_OF, r);
      expect(buckets.length).toBeGreaterThan(0);
      const last = buckets[buckets.length - 1];
      expect(last.from <= AS_OF && AS_OF <= last.to).toBe(true);
      for (let i = 1; i < buckets.length; i++) {
        expect(buckets[i - 1].to < buckets[i].from).toBe(true);
      }
    }
  });

  it("hạt tháng: kỳ ĐẦU bắt đầu đúng mốc lịch, kỳ CUỐI mới là kỳ bị cắt", () => {
    /* §5: cắt thô ở 27/01 làm kỳ đầu chỉ có 4 ngày và vẽ ra một điểm tụt giả. Nên kỳ đầu phải trọn,
       kỳ cuối mới `partial` — và chỉ khi mốc số liệu chưa chạm mép phải của nó. */
    const { buckets } = buildBuckets(AS_OF, "6m");
    expect(buckets[0].from.slice(8)).toBe("01");
    expect(buckets.slice(0, -1).every((b) => !b.partial)).toBe(true);
    const last = buckets[buckets.length - 1];
    expect(last.partial).toBe(last.to > AS_OF);
  });

  it("hạt ngày: không kỳ nào partial — mốc số liệu là ngày đã chốt", () => {
    for (const r of ["7d", "14d", "4w"] as RangeKey[]) {
      expect(buildBuckets(AS_OF, r).buckets.every((b) => !b.partial)).toBe(true);
    }
  });
});

describe("sigTrendChart — đơn vị do máy chọn", () => {
  const sigOf = (id: string) => demoData.signals.find((s) => s.id === id)!;

  it("điểm đo MỘT giá trị ⇒ đường ĐẾM, không phải tỉ lệ 100% cả trục", () => {
    const one = demoData.signals.find((s) => s.values.length === 1 && s.vol > 0);
    expect(one).toBeDefined(); // fixture có 6 điểm đo một giá trị — mất là mất luôn nhánh này
    const c = sigTrendChart(demoData.sigFires, one!, AS_OF, "6m");
    if (c.kind !== "draw") throw new Error("phải vẽ được");
    expect(c.unit).toBe("count");
  });

  /* Owner 14/08: *"nhiều đường nhưng cần lồng vào nhau đứng chung 1 chart"*. Số giá trị KHÔNG còn
     chia nhánh hình vẽ nào nữa — mọi điểm đo nhiều giá trị đều là một chart, mọi đường chồng lên
     nhau trên cùng một trục dọc. Cái còn do máy chọn chỉ còn ĐƠN VỊ. */
  it("nhiều giá trị ⇒ vẫn MỘT chart, mọi giá trị một đường, đơn vị là tỉ lệ", () => {
    const many = demoData.signals.find((s) => s.values.length >= 5 && s.vol > 0);
    expect(many).toBeDefined();
    const c = sigTrendChart(demoData.sigFires, many!, AS_OF, "6m");
    if (c.kind !== "draw") throw new Error("phải vẽ được");
    expect(c.lines.length).toBeGreaterThanOrEqual(many!.values.length);
    expect(c.unit).toBe("ratio");
  });

  it("tỉ lệ của một kỳ cộng lại bằng 1 — mẫu số là lượt bắn của CHÍNH điểm đo trong kỳ", () => {
    const c = sigTrendChart(demoData.sigFires, sigOf("sg4"), AS_OF, "6m");
    if (c.kind !== "draw" || c.unit !== "ratio") throw new Error("sg4 phải là chart tỉ lệ");
    c.buckets.forEach((_b, i) => {
      const pts = c.lines.map((l) => l.pts[i]);
      if (pts.some((p) => p.k !== "v")) return; // kỳ chưa đo / đứt thì không có tổng để so
      const s = pts.reduce((a, p) => a + (p.k === "v" ? p.v : 0), 0);
      expect(s).toBeCloseTo(1, 10);
    });
  });

  it("điểm đo cắm giữa cửa sổ ⇒ kỳ trước mốc cắm là `unmeasured`, và dải khối lượng để TRỐNG", () => {
    const mid = demoData.signals.find(
      (s) => s.instAt !== null && s.instAt > "2025-08-01" && s.vol > 0 && s.values.length > 0,
    );
    expect(mid).toBeDefined();
    const c = sigTrendChart(demoData.sigFires, mid!, AS_OF, "12m");
    if (c.kind !== "draw") throw new Error("phải vẽ được phần sau mốc cắm");

    expect(c.startsMidWindow).toBe(true);
    expect(c.firstMeasured).toBeGreaterThan(0);
    for (let i = 0; i < c.firstMeasured; i++) {
      expect(c.vol[i]).toBeNull(); // cột rỗng, KHÔNG phải cột 0
      expect(c.lines.every((l) => l.pts[i].k === "unmeasured")).toBe(true);
    }
    // Và từ kỳ đầu đo được trở đi thì không còn `unmeasured` nào — biên phải sạch, không lỗ chỗ.
    expect(c.vol.slice(c.firstMeasured).every((v) => v !== null)).toBe(true);
  });

  it("chưa khai mốc cắm (fixture thật) ⇒ từ chối vẽ, không vẽ một đường trống trông như đã đo", () => {
    const sig = seed.signals.find((s) => s.vol > 0)!;
    expect(sigTrendChart([], sig, AS_OF, "6m").kind).toBe("refuse");
  });

  it("token chưa khai được đánh dấu trên chính đường của nó", () => {
    const sig = demoData.signals.find((s) =>
      demoData.sigFires.some((f) => f.sigId === s.id && !s.values.includes(f.val)),
    )!;
    const c = sigTrendChart(demoData.sigFires, sig, AS_OF, "12m");
    if (c.kind !== "draw") throw new Error("phải vẽ được");
    const marked = c.lines.filter((l) => l.undeclared).map((l) => l.val);
    expect(marked).toEqual(c.undeclared);
    expect(marked.length).toBeGreaterThan(0);
  });
});

describe("sigCut — một cửa cho lát cắt, cắt được theo kỳ", () => {
  it("cắt theo kỳ cho tổng NHỎ HƠN cả đời, và mẫu số đi theo kỳ chứ không giữ Signal.vol", () => {
    const sig = demoData.signals.find((s) => s.instAt === "2025-01-15" && s.vol > 200)!;
    const all = sigCut(demoData, dims, [sig.id], "nav");
    const win = sigCut(demoData, dims, [sig.id], "nav", { from: "2026-07-01", to: AS_OF });
    if (all.kind !== "draw" || win.kind !== "draw") throw new Error("cả hai phải vẽ được");

    const volAll = all.chart.groups[0].vol;
    const volWin = win.chart.groups[0].vol;
    expect(volAll).toBe(sig.vol);
    expect(volWin).toBeLessThan(volAll);
    expect(volWin).toBeGreaterThan(0);
    // Mẫu số đi theo kỳ ⇒ mọi chiều vẫn đọc là "full", không tụt thành partial chỉ vì cửa sổ ngắn.
    expect(win.chart.dimStates.every((d) => d.state !== "partial")).toBe(true);
  });

  it("chỉ có bảng đếm sẵn mà đòi cắt theo kỳ ⇒ NÓI KHÔNG LÀM ĐƯỢC, không trả cả đời điểm đo", () => {
    const noFires = { ...demoData, sigFires: [] };
    const r = sigCut(noFires, dims, [demoData.signals[0].id], "nav", { from: "2026-07-01", to: AS_OF });
    expect(r.kind).toBe("refuse");
  });
});
