import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartLegend } from "./ChartLegend.tsx";

describe("ChartLegend", () => {
  it("items rỗng → không render gì", () => {
    const { container } = render(<ChartLegend items={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("chart-legend")).not.toBeInTheDocument();
  });

  it("2 items → hiện đúng 2 nhãn + 2 ô màu", () => {
    render(
      <ChartLegend
        items={[
          { label: "Khiếu nại", color: "var(--cat-3)" },
          { label: "Cần hỗ trợ", color: "var(--cat-1)" },
        ]}
      />,
    );
    const legend = screen.getByTestId("chart-legend");
    expect(legend.children).toHaveLength(2);
    expect(legend).toHaveTextContent("Khiếu nại");
    expect(legend).toHaveTextContent("Cần hỗ trợ");
    const swatches = legend.querySelectorAll("span > span");
    expect(swatches).toHaveLength(2);
    expect((swatches[0] as HTMLElement).style.background).toBe("var(--cat-3)");
    expect((swatches[1] as HTMLElement).style.background).toBe("var(--cat-1)");
  });
});
