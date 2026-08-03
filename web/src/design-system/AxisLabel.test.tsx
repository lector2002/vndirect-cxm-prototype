import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AxisLabel } from "./AxisLabel.tsx";

describe("AxisLabel", () => {
  it("hiện đúng chữ truyền vào", () => {
    render(<AxisLabel>6 tháng gần nhất</AxisLabel>);
    expect(screen.getByTestId("axis-label")).toHaveTextContent("6 tháng gần nhất");
  });

  it("dùng đúng cỡ chữ/màu port từ .axis", () => {
    render(<AxisLabel>Trục X</AxisLabel>);
    const el = screen.getByTestId("axis-label");
    expect(el.className).toContain("text-[11.5px]");
    expect(el.className).toContain("text-ink-3");
  });
});
