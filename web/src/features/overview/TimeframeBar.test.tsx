import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CxmData } from "../../data/schema/index.ts";
import { MockRepository } from "../../data/mock-repository.ts";
import { createCxmStore } from "../../store/store.ts";
import { DEFAULT_RANGE, useTimeframeStore } from "../../store/timeframe.ts";
import { TimeframeBar } from "./TimeframeBar.tsx";

/* useTimeframeStore là SINGLETON toàn app (không phải factory như CxmStore) — mỗi test đổi range
   phải trả về DEFAULT_RANGE sau khi chạy, tránh rò rỉ state sang test khác trong cùng file/suite. */
afterEach(() => {
  useTimeframeStore.setState({ range: DEFAULT_RANGE });
});

function renderBar() {
  const store = createCxmStore(new MockRepository());
  return render(<TimeframeBar useStore={store} />);
}

describe("TimeframeBar", () => {
  it("render đúng 8 mốc theo thứ tự Default·7D·14D·4W·3M·6M·12M·Custom", () => {
    renderBar();
    const group = screen.getByRole("group", { name: "Khoảng thời gian" });
    const labels = Array.from(group.querySelectorAll("button")).map((b) => b.textContent);
    expect(labels).toEqual(["Default", "7D", "14D", "4W", "3M", "6M", "12M", "Custom"]);
  });

  it("mặc định (DEFAULT_RANGE='6m') → nút '6M' aria-pressed=true, còn lại false", () => {
    renderBar();
    expect(screen.getByText("6M")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Default")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("3M")).toHaveAttribute("aria-pressed", "false");
  });

  it("bấm '3M' → useTimeframeStore.range đổi thành '3m', nút '3M' tô đậm", () => {
    renderBar();
    fireEvent.click(screen.getByText("3M"));
    expect(useTimeframeStore.getState().range).toBe("3m");
    expect(screen.getByText("3M")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("6M")).toHaveAttribute("aria-pressed", "false");
  });

  it("nút 'Custom' disabled (chưa có date-picker thật), bấm không đổi range", () => {
    renderBar();
    const custom = screen.getByText("Custom");
    expect(custom).toBeDisabled();
    expect(custom).toHaveAttribute("title", expect.stringMatching(/pipeline dữ liệu theo ngày/));
    fireEvent.click(custom);
    expect(useTimeframeStore.getState().range).toBe(DEFAULT_RANGE);
  });

  it("bấm '7D'/'14D'/'4W' → hiện ghi chú trung thực 'dữ liệu hiện theo tháng'", () => {
    renderBar();
    fireEvent.click(screen.getByText("7D"));
    expect(screen.getByText(/Dữ liệu hiện theo tháng/)).toBeInTheDocument();
  });

  it("range 3M/6M/12M/Default (đủ dữ liệu thật) → KHÔNG hiện ghi chú nào", () => {
    renderBar();
    expect(screen.queryByText(/Dữ liệu hiện theo tháng/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chuỗi thật hiện chỉ có/)).not.toBeInTheDocument();
  });

  it("dữ liệu thật NGẮN hơn mốc đang chọn (12M > maxReal) → hiện cảnh báo 'Chuỗi thật hiện chỉ có N tháng'", () => {
    const base = new MockRepository().getSnapshot();
    // Cắt xuống 2 điểm/chuỗi (mutate qua copy mới, không đụng base) để maxRealMonths=2 < 12.
    const shortData: CxmData = {
      ...base,
      qt: base.qt.map((q) => (q.kind === "series" ? { ...q, t: q.t.map((s) => ({ ...s, p: s.p.slice(-2) })) } : q)),
      tax: base.tax.map((t) => (t.pts ? { ...t, pts: t.pts.slice(-2) } : t)),
    };
    const store = createCxmStore(new MockRepository());
    // Ghi đè snapshot của store cô lập bằng shortData (không đụng repo thật/base).
    store.setState({ data: shortData });

    render(<TimeframeBar useStore={store} />);
    fireEvent.click(screen.getByText("12M"));
    expect(screen.getByText(/Chuỗi thật hiện chỉ có 2 tháng/)).toBeInTheDocument();
  });
});
