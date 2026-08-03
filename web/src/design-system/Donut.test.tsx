import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DimRow } from "../data/schema/index.ts";
import { Donut } from "./Donut.tsx";

const rows3: DimRow[] = [
  { id: "a", l: "Alpha", v: 60 },
  { id: "b", l: "Beta", v: 30 },
  { id: "c", l: "Gamma", v: 10 },
];

// 14 rows, giá trị giảm dần — mô phỏng q1 (theme, 14 hàng) dùng cho donut.
const rows14: DimRow[] = Array.from({ length: 14 }, (_, i) => ({
  id: `r${i}`,
  l: `Row ${i}`,
  v: 100 - i,
}));

describe("Donut", () => {
  it("<=5 rows: hiện đủ, KHÔNG gộp 'Khác'", () => {
    render(<Donut rows={rows3} />);
    expect(screen.getByTestId("donut-legend").children).toHaveLength(3);
    expect(screen.queryByText(/Khác/)).not.toBeInTheDocument();
  });

  /* D6a (owner chốt 02/08): hệ màu phân loại chỉ có 5 màu — 14 lát buộc lặp màu, hai lát cùng màu
     trong một donut là đọc sai. Giữ 5 lát lớn nhất (rows đã sort desc), gộp 9 lát còn lại thành
     "Khác (+9)" màu var(--cat-other). */
  it("D6a: 14 rows → legend còn đúng 6 mục, mục cuối là 'Khác (+9)' màu var(--cat-other)", () => {
    render(<Donut rows={rows14} />);
    const legend = screen.getByTestId("donut-legend");
    expect(legend.children).toHaveLength(6);
    const last = legend.children[5];
    expect(last).toHaveTextContent("Khác (+9)");
    const dot = last.querySelector("i")!;
    expect(dot).toHaveStyle({ background: "var(--cat-other)" });
  });

  it("D6a: % của lát Khác tính trên TỔNG TẤT CẢ rows gốc (không chỉ 9 rows bị gộp)", () => {
    render(<Donut rows={rows14} />);
    const legend = screen.getByTestId("donut-legend");
    const last = legend.children[5];
    // tổng rows14 = sum(100..87) = 1309; 9 rows cuối (v=91..83, tức index 9..13 sau khi bỏ top5) —
    // top5 là v=100,99,98,97,96 (index 0-4); phần gộp là index 5-13 (9 rows, v=95..87).
    const other = 95 + 94 + 93 + 92 + 91 + 90 + 89 + 88 + 87;
    const total = Array.from({ length: 14 }, (_, i) => 100 - i).reduce((a, v) => a + v, 0);
    const expectedPct = String(Math.round((other / total) * 1000) / 10).replace(".", ",");
    expect(last).toHaveTextContent(`${expectedPct}%`);
  });

  it("D6a: lát 'Khác' bấm được khi có onOtherClick (role=button, Enter/Space kích hoạt)", () => {
    const onOtherClick = vi.fn();
    render(<Donut rows={rows14} onOtherClick={onOtherClick} />);
    const legend = screen.getByTestId("donut-legend");
    const other = legend.children[5];
    expect(other).toHaveAttribute("role", "button");
    fireEvent.click(other);
    expect(onOtherClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(other, { key: "Enter" });
    expect(onOtherClick).toHaveBeenCalledTimes(2);
  });

  it("không có onOtherClick: lát 'Khác' không có role=button (không bấm được)", () => {
    render(<Donut rows={rows14} />);
    const legend = screen.getByTestId("donut-legend");
    const other = legend.children[5];
    expect(other).not.toHaveAttribute("role");
  });

  /* D0a: fx() chỉ hợp lệ cho volume TỔNG HỢP (dim.base==='agg'). Mặc định `scaled=true` giữ nguyên
     hành vi cũ cho caller chưa biết prop này. */
  it("scaled mặc định true: số tâm áp fx()", () => {
    render(<Donut rows={[{ id: "a", l: "Alpha", v: 100 }]} />);
    const center = screen.getByTestId("donut").querySelector(".text-xl")!;
    expect(center.textContent).toBe("560"); // fx(100)=560
  });

  it("scaled=false: số tâm KHÔNG áp fx(), giữ nguyên tổng thô", () => {
    render(<Donut rows={[{ id: "a", l: "Alpha", v: 100 }]} scaled={false} />);
    const center = screen.getByTestId("donut").querySelector(".text-xl")!;
    expect(center.textContent).toBe("100");
  });

  /* D2b tinh chỉnh #2 (owner chốt 03/08): row có id===pinnedLastId PHẢI luôn là lát riêng ghim CUỐI,
     KHÔNG bao giờ bị gộp vào "Khác (+N)" — MAX_SLICES chỉ áp trên phần row còn lại (`main`). */
  it("pinnedLastId: 7 row main (>MAX_SLICES) + 1 row ghim → 'Khác' VÀ lát ghim cùng xuất hiện riêng", () => {
    const rows: DimRow[] = [
      ...Array.from({ length: 7 }, (_, i) => ({ id: `m${i}`, l: `Main ${i}`, v: 20 - i })),
      { id: "__unknown__", l: "Không xác định", v: 6, c: "var(--unk)" },
    ];
    render(<Donut rows={rows} pinnedLastId="__unknown__" />);
    const legend = screen.getByTestId("donut-legend");
    // 5 lát main lớn nhất + 1 lát "Khác (+2)" + 1 lát ghim = 7 mục.
    expect(legend.children).toHaveLength(7);
    expect(screen.getByText(/Khác \(\+2\)/)).toBeInTheDocument();
    const last = legend.children[legend.children.length - 1];
    expect(last).toHaveTextContent("Không xác định");
    // Lát ghim KHÔNG nằm trong "Khác" — text "Khác" không chứa "Không xác định".
    const otherSlice = screen.getByText(/Khác \(\+2\)/).closest("div");
    expect(otherSlice).not.toHaveTextContent("Không xác định");
    // Màu lát ghim giữ nguyên var(--unk), không rơi vào DONUT_PALETTE.
    const dot = last.querySelector("i")!;
    expect(dot).toHaveStyle({ background: "var(--unk)" });
  });
});
