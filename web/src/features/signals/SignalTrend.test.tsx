import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, dims, seed } from "../../data/fixtures/seed.ts";
import { demoData } from "../../data/fixtures/demo.ts";
import { isoFromVn, vnFromIso } from "../../data/projectSigTrend.ts";
import { sigTrendChart } from "../../domain/sigTrendChart.ts";
import { useTimeframeStore } from "../../store/timeframe.ts";
import { SignalProfile } from "./SignalProfile.tsx";

/* Mặt 4 sau ADR-001 + ADR-003: hai tầng nối nhau trên MỘT trang — đường theo thời gian ở trên, lát
   cắt theo nhóm khách ở dưới, bấm một kỳ thì lát cắt nhảy về kỳ đó.

   Bộ này canh phần KHÔNG suy ra được từ test tầng dưới: hai tầng có thật sự nối vào nhau không, và
   ba trạng thái có sống sót qua tầng vẽ không. Mọi điểm đo lấy bằng vị từ trên fixture, không ghim
   id — đổi seed thì test đi theo. */

const noop = () => {};
const AS_OF = isoFromVn(seed.asOf)!;

function open(signal: (typeof demoData.signals)[number]) {
  return render(<SignalProfile data={demoData} signal={signal} onBack={noop} dims={dims} cfg={cfgDefault} />);
}

/** Điểm đo cắm từ đầu, ít giá trị — ca đọc dễ nhất, dùng cho các phép kiểm về trục và lát cắt. */
const lineSignal = demoData.signals.find(
  (s) => s.vol > 0 && s.values.length >= 2 && s.values.length < 5 && s.instAt === "2025-01-15",
)!;

describe("Mặt 4 — đường theo thời gian nối vào lát cắt", () => {
  it("Demo Mode BẬT: có chart trục thời gian — KHÔNG còn chú thích cách đọc dưới trục (owner 18/08 tối ghi đè §4)", () => {
    open(lineSignal);
    expect(screen.getByTestId("sigtrend-chart")).toBeInTheDocument();
    /* Owner 18/08 tối ghi đè §4 ADR-001: bỏ câu "Đường:.../Dải dưới:..." — người dùng không đọc.
       Chỉ còn dòng lệch bản khai (sigtrend-undeclared) khi có giá trị ngoài bản khai. */
    expect(screen.queryByText(/tổng lượt bắn của chính điểm đo trong kỳ/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Đường:/)).not.toBeInTheDocument();
  });

  /* Owner 14/08 nhìn bản dựng đầu: *"chart đang ko hiển thị số lượng của cột hoặc trục dọc để biết
     đang nhìn số liệu bao nhiêu"*. Hình không có thang thì đọc được HƯỚNG mà không đọc được ĐỘ LỚN
     — mà độ lớn mới là thứ quyết định có mở việc hay không. */
  it("đường đơn: có thang DỌC ghi số, và dải khối lượng ghi mẫu số lớn nhất", () => {
    useTimeframeStore.getState().setRange("6m");
    open(lineSignal);

    const ticks = screen.getByTestId("sigtrend-yaxis").querySelectorAll("text");
    expect(ticks.length).toBe(4);
    /* Đơn vị của thang phải khớp đơn vị của đường — tỉ lệ thì mốc ghi `%`, đếm thì ghi số lượt. */
    const c = sigTrendChart(demoData.sigFires, lineSignal, AS_OF, "6m");
    if (c.kind !== "draw") throw new Error("fixture phải vẽ được");
    const wantPct = c.unit === "ratio";
    for (const t of ticks) expect(t.textContent!.includes("%")).toBe(wantPct);
    // Mốc đáy luôn là 0 — thang không được cắt gốc, cắt gốc là phóng đại mọi thay đổi.
    expect(ticks[3].textContent).toMatch(/^0(,0)?%?$/);

    const volMax = Number(screen.getByTestId("sigtrend-volmax").textContent!.replace(/\D/g, ""));
    expect(volMax).toBe(Math.max(...c.vol.filter((v): v is number => v !== null)));
  });

  it("bấm một kỳ ⇒ lát cắt nhảy về kỳ đó và NÓI RA đang đọc kỳ nào; bấm lại ⇒ về cả cửa sổ", () => {
    useTimeframeStore.getState().setRange("6m");
    open(lineSignal);
    const c = sigTrendChart(demoData.sigFires, lineSignal, AS_OF, "6m");
    if (c.kind !== "draw") throw new Error("fixture phải vẽ được");
    const target = c.buckets.find((b, i) => !b.partial && c.vol[i] !== null)!;

    expect(screen.queryByTestId("sigtrend-scoped")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`sigtrend-pick-${target.key}`));
    expect(screen.getByTestId("sigtrend-scoped").textContent).toContain(target.label);

    fireEvent.click(screen.getByTestId(`sigtrend-pick-${target.key}`));
    expect(screen.queryByTestId("sigtrend-scoped")).not.toBeInTheDocument();
  });

  it("lát cắt theo kỳ có tổng NHỎ HƠN cả cửa sổ — nó thật sự cắt, không chỉ đổi nhãn", () => {
    useTimeframeStore.getState().setRange("6m");
    open(lineSignal);
    const c = sigTrendChart(demoData.sigFires, lineSignal, AS_OF, "6m");
    if (c.kind !== "draw") throw new Error("fixture phải vẽ được");
    const target = c.buckets.find((b, i) => !b.partial && (c.vol[i] ?? 0) > 0)!;

    const totalAll = Number(screen.getByTestId("signal-columns").textContent!.replace(/\D/g, "").slice(0, 12));
    fireEvent.click(screen.getByTestId(`sigtrend-pick-${target.key}`));
    const totalWin = Number(screen.getByTestId("signal-columns").textContent!.replace(/\D/g, "").slice(0, 12));
    expect(totalWin).not.toBe(totalAll);
  });

  /* Owner 14/08: *"nhiều đường nhưng cần lồng vào nhau đứng chung 1 chart"*. Lối lưới đường nhỏ bỏ
     hẳn — nhiều giá trị đến mấy cũng MỘT chart, một trục dọc, mọi đường chồng lên nhau. */
  it("điểm đo nhiều giá trị ⇒ VẪN một chart, mọi giá trị một đường lồng chung", () => {
    const many = demoData.signals.find((s) => s.vol > 0 && s.values.length >= 5 && s.instAt !== null)!;
    open(many);
    expect(screen.getByTestId("sigtrend-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("sigtrend-grid")).not.toBeInTheDocument();

    const c = sigTrendChart(demoData.sigFires, many, AS_OF, useTimeframeStore.getState().range);
    if (c.kind !== "draw") throw new Error("fixture phải vẽ được");
    // Mỗi giá trị đúng MỘT đường, và cả bộ nằm trong cùng một svg (cùng trục dọc).
    const svg = screen.getByTestId("sigtrend-chart").querySelector("svg")!;
    for (const l of c.lines) expect(svg.querySelector(`[data-testid="sigtrend-line-${l.val}"]`)).not.toBeNull();
  });

  /* Nhiều đường chồng nhau thì màu thôi không tra ra đường nào là giá trị nào — chú giải phải mang
     tên VÀ số mới nhất. Đây là dữ liệu, không phải lời bình: không mũi tên, không "±x điểm %". */
  it("chú giải: mỗi đường một khoá, có tên + số mới nhất, KHÔNG có delta 'điểm %'", () => {
    useTimeframeStore.getState().setRange("6m");
    const many = demoData.signals.find((s) => s.vol > 0 && s.values.length >= 5 && s.instAt !== null)!;
    open(many);

    const c = sigTrendChart(demoData.sigFires, many, AS_OF, "6m");
    if (c.kind !== "draw") throw new Error("fixture phải vẽ được");
    for (const l of c.lines) {
      expect(screen.getByTestId(`sigtrend-key-${l.val}`).textContent).toContain(l.val);
      if (l.pts.some((p) => p.k === "v")) expect(screen.getByTestId(`sigtrend-last-${l.val}`).textContent).not.toBe("–");
    }
    expect(screen.getByTestId("sigtrend-legend").textContent).not.toMatch(/điểm %/);
    expect(screen.getByTestId("signal-profile-value-chart").textContent).not.toMatch(/điểm %/);
  });

  it("điểm đo cắm giữa cửa sổ ⇒ màn NÊU mốc cắm (chỉ nêu mốc, không diễn giải)", () => {
    useTimeframeStore.getState().setRange("12m");
    const mid = demoData.signals.find((s) => s.instAt !== null && s.instAt > "2025-08-01" && s.vol > 0 && s.values.length > 0)!;
    open(mid);
    /* Mốc hiện lên màn viết `dd/MM/yyyy` (khuôn hiển thị của cả dự án), không phải khuôn lưu
       `yyyy-MM-dd` — suy từ chính fixture nên đổi seed thì test đi theo. */
    expect(screen.getByTestId("sigtrend-mid-window").textContent).toContain(vnFromIso(mid.instAt!));
  });

  it("Demo Mode TẮT (fixture thật, chưa khai mốc cắm) ⇒ nói ra, không vẽ đường trống", () => {
    const sig = seed.signals.find((s) => s.vol > 0 && s.values.length > 0)!;
    render(<SignalProfile data={seed} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
    /* Không có dòng đếm nào ⇒ dừng ở refusal #2 có sẵn. Điều đáng canh là KHÔNG có chart trục thời
       gian nào được vẽ ra từ một fixture chưa khai mốc cắm. */
    expect(screen.queryByTestId("sigtrend-chart")).not.toBeInTheDocument();
  });
});
