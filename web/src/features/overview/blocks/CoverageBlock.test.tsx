import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { CoverageBlock } from "./CoverageBlock.tsx";

/* Số suy từ seed (obs.cov theo step, ngưỡng cfgDefault.step.covMin=70):
   s1=96 s2=71 s3=64 s4=92 s5=58 s6=89 → chỉ s3 (03) và s5 (05) < 70.
   signals st∈{gap,designed}: sg6 (gap) + sg9 (designed) = 2. */
describe("CoverageBlock", () => {
  it("KHÔNG xuất hiện chuỗi số đã nhân fx() trên thanh — 64/58 hiện raw %, không phải fx(64)=358/fx(58)=325", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("64%")).toBeInTheDocument();
    expect(screen.getByText("58%")).toBeInTheDocument();
    expect(screen.queryByText("358")).not.toBeInTheDocument();
    expect(screen.queryByText("358%")).not.toBeInTheDocument();
    expect(screen.queryByText("325")).not.toBeInTheDocument();
    expect(screen.queryByText("325%")).not.toBeInTheDocument();
  });

  it("D1: tooltip của thanh cũng KHÔNG bị nhân fx() — title bước 03 nói '64%', không phải '358'", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const row = screen.getByText(/03 Liveness & Face match/).closest("[title]");
    expect(row).toHaveAttribute("title", expect.stringContaining("64%"));
    expect(row?.getAttribute("title")).not.toContain("358");
  });

  it("bấm một thanh gọi onGo('atlas')", () => {
    const onGo = vi.fn();
    render(<CoverageBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    const bars = screen.getByTestId("bars");
    fireEvent.click(bars.children[0]!);
    expect(onGo).toHaveBeenCalledWith("atlas");
  });
});
