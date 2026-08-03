import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import type { QuantifySeriesPoint } from "../data/schema/index.ts";
import { LineChart } from "./LineChart.tsx";

function findSeries(id: string): QuantifySeriesPoint[] {
  const q = seed.qt.find((x) => x.id === id);
  if (!q || q.kind !== "series") throw new Error(`fixture ${id} phải là QuantifySeries`);
  return q.t;
}

describe("LineChart", () => {
  it("q5 (trend, 1 series) → data-testid=line-chart, 1 polyline, legend hiện giá trị cuối kỳ", () => {
    const series = findSeries("q5"); // t:[{p:[42,40,36,31,26,19]}]
    const { container } = render(<LineChart series={series} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(container.querySelectorAll("polyline")).toHaveLength(series.length);
    expect(screen.getByText("19")).toBeInTheDocument();
  });

  it("q7 (cohort, 2 series) → 2 polyline, mỗi cái có legend riêng", () => {
    const series = findSeries("q7"); // Android [..22], iOS [..8]
    const { container } = render(<LineChart series={series} />);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});
