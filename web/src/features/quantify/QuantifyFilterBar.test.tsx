import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuantifyFilterBar, type QuantifyFilterBarProps } from "./QuantifyFilterBar.tsx";

function baseProps(overrides: Partial<QuantifyFilterBarProps> = {}): QuantifyFilterBarProps {
  return {
    kind: "all",
    base: "all",
    view: "all",
    kindOptions: [
      { value: "all", label: "Tất cả", count: 15 },
      { value: "rank", label: "Bar", count: 9 },
    ],
    baseOptions: [
      { value: "all", label: "Mọi nền", count: 15 },
      { value: "agg", label: "Taxonomy & nguồn", count: 6 },
    ],
    viewOptions: [
      { value: "all", label: "Mọi view", count: 15 },
      { value: "table", label: "▤ Bảng", count: 1 },
    ],
    onKind: () => {},
    onBase: () => {},
    onView: () => {},
    onClear: () => {},
    ...overrides,
  };
}

describe("QuantifyFilterBar — render", () => {
  it("render 3 nhóm chip kèm count — KHÔNG còn ô search (đã dời ra QuantifySearch)", () => {
    render(<QuantifyFilterBar {...baseProps()} />);
    expect(screen.getByTestId("quantify-filterbar")).toBeInTheDocument();
    /* Neo việc dời: ô tìm phải LUÔN HIỆN trên toolbar (owner chốt 02/08), không được quay lại nằm
       trong popover này. Nếu ai đó thêm lại input vào đây, test này đỏ. */
    expect(screen.queryByTestId("q-search")).not.toBeInTheDocument();
    expect(screen.getByTestId("qfilter-kind-rank")).toBeInTheDocument();
    expect(screen.getByTestId("qfilter-base-agg")).toBeInTheDocument();
    expect(screen.getByTestId("qfilter-view-table")).toBeInTheDocument();
    // Count hiện cạnh label chip.
    expect(screen.getByTestId("qfilter-kind-rank")).toHaveTextContent("Bar");
    expect(screen.getByTestId("qfilter-kind-rank")).toHaveTextContent("9");
  });
});

describe("QuantifyFilterBar — chip callbacks", () => {
  it("bấm chip kind='rank' gọi onKind('rank')", () => {
    const onKind = vi.fn();
    render(<QuantifyFilterBar {...baseProps({ onKind })} />);
    fireEvent.click(screen.getByTestId("qfilter-kind-rank"));
    expect(onKind).toHaveBeenCalledWith("rank");
  });

  it("bấm chip base='agg' gọi onBase('agg')", () => {
    const onBase = vi.fn();
    render(<QuantifyFilterBar {...baseProps({ onBase })} />);
    fireEvent.click(screen.getByTestId("qfilter-base-agg"));
    expect(onBase).toHaveBeenCalledWith("agg");
  });

  it("bấm chip view='table' gọi onView('table')", () => {
    const onView = vi.fn();
    render(<QuantifyFilterBar {...baseProps({ onView })} />);
    fireEvent.click(screen.getByTestId("qfilter-view-table"));
    expect(onView).toHaveBeenCalledWith("table");
  });
});

describe("QuantifyFilterBar — clear", () => {
  it("nút 'Xóa bộ lọc' ẩn khi chưa lọc gì, hiện khi có filter active", () => {
    const { rerender } = render(<QuantifyFilterBar {...baseProps()} />);
    expect(screen.queryByText("Xóa bộ lọc")).not.toBeInTheDocument();
    rerender(<QuantifyFilterBar {...baseProps({ kind: "rank" })} />);
    expect(screen.getByText("Xóa bộ lọc")).toBeInTheDocument();
  });

  it("bấm 'Xóa bộ lọc' (khi đang lọc) gọi onClear", () => {
    const onClear = vi.fn();
    render(<QuantifyFilterBar {...baseProps({ onClear, base: "agg" })} />);
    fireEvent.click(screen.getByText("Xóa bộ lọc"));
    expect(onClear).toHaveBeenCalled();
  });
});
