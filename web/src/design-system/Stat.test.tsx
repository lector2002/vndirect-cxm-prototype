import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stat } from "./Stat.tsx";

describe("Stat", () => {
  it("hiện label, value, foot, srcNote", () => {
    render(<Stat label="Vào bước" value="1.234" foot="hoàn tất" srcNote="stepState() · n=10" />);
    expect(screen.getByText("Vào bước")).toBeInTheDocument();
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("hoàn tất")).toBeInTheDocument();
    expect(screen.getByText("stepState() · n=10")).toBeInTheDocument();
  });

  it("không có foot/srcNote thì chỉ render 2 dòng (label + value), không có 2 dòng kia", () => {
    render(<Stat label="Vào bước" value="1.234" />);
    expect(screen.getByTestId("stat").children).toHaveLength(2);
  });

  it("tone áp màu chữ lên value", () => {
    render(<Stat label="Thất bại" value="42" tone="var(--crit)" />);
    expect(screen.getByText("42")).toHaveStyle({ color: "var(--crit)" });
  });

  it("không có tone thì value không set style color", () => {
    render(<Stat label="Thất bại" value="42" />);
    expect(screen.getByText("42")).not.toHaveAttribute("style");
  });
});
