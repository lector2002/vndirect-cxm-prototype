import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline.tsx";

describe("Sparkline", () => {
  it("render đủ số cột theo points", () => {
    render(<Sparkline points={[10, 20, 5, 40]} color="var(--good)" />);
    expect(screen.getByTestId("sparkline").children).toHaveLength(4);
  });

  it("chiều cao cột = max(6, p/max*100)%, cột lớn nhất = 100%", () => {
    render(<Sparkline points={[10, 20, 5, 40]} color="var(--good)" />);
    const bars = screen.getByTestId("sparkline").children;
    // max = 40 -> cột cuối 100%, cột 5 -> max(6, 5/40*100=12.5) = 12.5%
    expect(bars[3]).toHaveStyle({ height: "100%" });
    expect(bars[2]).toHaveStyle({ height: "12.5%" });
  });

  it("cột rất nhỏ bị kẹp sàn 6% thay vì gần 0", () => {
    render(<Sparkline points={[1, 100]} color="var(--crit)" />);
    const bars = screen.getByTestId("sparkline").children;
    // 1/100*100 = 1% < 6% -> kẹp thành 6%
    expect(bars[0]).toHaveStyle({ height: "6%" });
  });

  it("dùng đúng màu truyền vào cho mọi cột", () => {
    render(<Sparkline points={[1, 2]} color="rgb(1, 2, 3)" />);
    const bars = screen.getByTestId("sparkline").children;
    expect(bars[0]).toHaveStyle({ background: "rgb(1, 2, 3)" });
    expect(bars[1]).toHaveStyle({ background: "rgb(1, 2, 3)" });
  });
});
