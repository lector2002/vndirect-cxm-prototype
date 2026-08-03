import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { CxmData, QuantifyShow } from "../data/schema/index.ts";
import { MISSING } from "../data/segment.ts";
import { QuantifyWidget } from "./QuantifyWidget.tsx";

/* S2.C3b: trục base:'cust' (age/nav/tenure/acq/seg/tier) phải đi qua qRunSegment, KHÔNG qRun —
   oracle đếm tay trên seed.cust thật (7 khách, xem domain/quantify.test.ts): nav = 'chưa-biết' x6,
   '1-5tỷ' x1 (KH•••9F1) → known=1 unknown=6 missing=0. */
describe("QuantifyWidget — trục base:'cust' đi qua qRunSegment (S2.C3b)", () => {
  const navItem: QuantifyShow = {
    id: "test-seg-nav",
    kind: "show",
    show: "nav",
    metric: "count",
    chart: "rank",
    name: "test nav",
  };

  it("seg.kind='draw' (nav, known=1/7) → gộp 'chưa-biết'+'thiếu' thành MỘT bar 'Không xác định' NGAY TRONG chart", () => {
    render(<QuantifyWidget item={navItem} data={seed} dims={dims} />);
    const bars = screen.getByTestId("bars");
    // 2 hàng: band đã biết '1-5tỷ' + bar gộp "Không xác định" (unknown=6, missing=0) ghim cuối.
    expect(bars.children).toHaveLength(2);
    expect(bars).toHaveTextContent("1-5tỷ");
    expect(bars).toHaveTextContent("Không xác định");
    expect(bars).not.toHaveTextContent("chưa-biết");

    // Không còn dải coverage riêng — đã gộp vào chart.
    expect(screen.queryByTestId("seg-coverage")).not.toBeInTheDocument();

    // Màu: bar "Không xác định" luôn var(--unk); bar '1-5tỷ' (chart chưa có intent color) nhận
    // --cat-N xoay vòng — KHÔNG phải xám ink3, KHÔNG phải --unk.
    const rowDivs = bars.children;
    const knownBar = rowDivs[0]?.querySelector<HTMLDivElement>(".overflow-hidden > div");
    const unknownBar = rowDivs[1]?.querySelector<HTMLDivElement>(".overflow-hidden > div");
    expect(knownBar?.style.background).toMatch(/^var\(--cat-/);
    expect(unknownBar?.style.background).toBe("var(--unk)");

    // D2b tinh chỉnh #1: dòng mô tả coverage bằng CHỮ dưới chart — phân biệt lại "chưa biết" vs
    // "thiếu" mà bar gộp đã xoá mất. known=1, unknown=6, missing=0, total=7 → pv(1,7)="14,3".
    expect(screen.getByText(/Phủ 14,3% \(1\/7 khách có dữ liệu\)/)).toBeInTheDocument();
    expect(screen.getByText(/6 chưa biết/)).toBeInTheDocument();

    // D2b tinh chỉnh #3: known (1) không bị TOP_N (10) cắt → denomStrip KHÔNG render ("Top 1 trên 1"
    // chỉ gây nhiễu).
    expect(screen.queryByTestId("denom-strip")).not.toBeInTheDocument();
    expect(screen.queryByText(/Đang hiện Top/)).not.toBeInTheDocument();
  });

  it("seg.kind='draw' với missing>0 → dòng mô tả gọi tên RIÊNG 'thiếu', KHÔNG lẫn vào 'chưa biết'", () => {
    // Ép 2 khách 'chưa-biết' (index 0,1) thành MISSING ('thiếu') — known=1, unknown=4, missing=2,
    // total=7 (khác oracle gốc chỉ có unknown, chưa từng chạm nhánh 'thiếu' của buildSegDescription).
    const missData: CxmData = {
      ...seed,
      cust: seed.cust.map((c, i) => (i < 2 ? { ...c, nav: MISSING } : c)),
    };
    render(<QuantifyWidget item={navItem} data={missData} dims={dims} />);
    const bars = screen.getByTestId("bars");
    // Bar gộp "Không xác định" = unknown+missing = 4+2 = 6, vẫn MỘT bar duy nhất.
    expect(bars.children).toHaveLength(2);
    expect(
      screen.getByText('Phủ 14,3% (1/7 khách có dữ liệu). Nhóm "Không xác định" gồm 4 chưa biết và 2 thiếu (lỗi thu thập).'),
    ).toBeInTheDocument();
  });

  it("seg.kind='refuse' (known=0 sau khi loại bỏ khách nav thật) → render panel lý do, KHÔNG chart", () => {
    // Cùng fixture tối giản với domain/quantify.test.ts: bỏ đúng khách duy nhất có nav thật.
    const miniData: CxmData = { ...seed, cust: seed.cust.filter((c) => c.nav !== "1-5tỷ") };
    render(<QuantifyWidget item={navItem} data={miniData} dims={dims} />);
    expect(screen.queryByTestId("bars")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vaxis-label")).not.toBeInTheDocument();
    expect(screen.queryByTestId("seg-coverage")).not.toBeInTheDocument();
    expect(screen.getByText(/chưa khách nào tới chỗ biết được giá trị này/)).toBeInTheDocument();
  });
});

describe("QuantifyWidget — trục KHÔNG phải cust vẫn dùng qRun như cũ (chống regression S2.C3b)", () => {
  it("q1 (show='theme', base='agg') → vẫn render Bars bình thường, KHÔNG có seg-coverage", () => {
    const themeItem = seed.qt.find((x) => x.id === "q1");
    if (!themeItem) throw new Error("fixture q1 không tồn tại");
    render(<QuantifyWidget item={themeItem} data={seed} dims={dims} />);
    expect(screen.getByTestId("bars")).toBeInTheDocument();
    expect(screen.queryByTestId("seg-coverage")).not.toBeInTheDocument();
  });
});
