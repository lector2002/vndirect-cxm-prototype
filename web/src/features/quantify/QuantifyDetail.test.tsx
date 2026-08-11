import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, dims, seed } from "../../data/fixtures/seed.ts";
import type { QuantifyItem } from "../../data/schema/index.ts";
import { QuantifyDetail, type QuantifyDetailProps } from "./QuantifyDetail.tsx";

function findItem(id: string): QuantifyItem {
  const q = seed.qt.find((x) => x.id === id);
  if (!q) throw new Error(`fixture ${id} không tồn tại`);
  return q;
}

/* q16 (Theme × Nền tảng) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — năng lực cross-tab GIỮ NGUYÊN,
   chỉ không còn saved query nào trỏ vào. Tự dựng item tại đây (đúng hình dạng q16 cũ, có cả rowDim
   lẫn colDim) thay vì đọc từ seed, giữ nguyên MỌI phép khẳng định. */
const q16: QuantifyItem = {
  id: "q16", kind: "show", show: "theme", by: "pf", metric: "count", view: "table", chart: "rank",
  name: "Theme × Nền tảng (ghép chéo)",
};

function baseProps(item: QuantifyItem, overrides: Partial<QuantifyDetailProps> = {}): QuantifyDetailProps {
  return {
    item,
    data: seed,
    dims,
    cfg: cfgDefault,
    view: item.view ?? "chart",
    onSetView: () => {},
    usedByIds: [],
    onBack: () => {},
    onEdit: () => {},
    onDuplicate: () => {},
    onRequestDelete: () => {},
    ...overrides,
  };
}

describe("QuantifyDetail — render", () => {
  it("render root testid + tên chart", () => {
    const item = findItem("q1");
    render(<QuantifyDetail {...baseProps(item)} />);
    expect(screen.getByTestId("quantify-detail")).toBeInTheDocument();
    expect(screen.getByText(item.name)).toBeInTheDocument();
  });

  it("usedByIds không rỗng → hiện 'Đang dùng ở N set: …' trong popover ⓘ", () => {
    render(<QuantifyDetail {...baseProps(findItem("q14"), { usedByIds: ["b-voc-all"] })} />);
    fireEvent.click(screen.getByTestId("qmeta"));
    expect(screen.getByText("Đang dùng ở 1 set: b-voc-all")).toBeInTheDocument();
  });

  it("item.note chỉ hiện đúng 1 lần (QuantifyWidget đã tự render note, không lặp lại ở metadata)", () => {
    /* KHÔNG ghim vào `q1`: test hỏi "note hiện đúng một lần", không phụ thuộc item nào. Luật 11/08
       đã bỏ note của q1, nên lấy item ĐẦU TIÊN còn note + chốt chống rỗng. */
    const item = seed.qt.find((x) => !!x.note);
    if (!item?.note) throw new Error("fixture phải còn ít nhất một item có note");
    render(<QuantifyDetail {...baseProps(item)} />);
    expect(screen.getAllByText(item.note).length).toBe(1);
  });

  it("usedByIds rỗng → hiện 'Chưa set nào dùng' trong popover ⓘ", () => {
    render(<QuantifyDetail {...baseProps(findItem("q1"), { usedByIds: [] })} />);
    fireEvent.click(screen.getByTestId("qmeta"));
    expect(screen.getByText("Chưa set nào dùng")).toBeInTheDocument();
  });

  it("popover ⓘ chứa đủ 5 dòng metadata (chiều hàng/cột, chỉ số, view mặc định, set đang dùng)", () => {
    const item = q16; // q16 = cross-tab (theme × pf), có cả rowDim lẫn colDim
    render(<QuantifyDetail {...baseProps(item, { usedByIds: ["b-voc-all"] })} />);
    fireEvent.click(screen.getByTestId("qmeta"));
    const panel = screen.getByTestId("qmeta-panel");
    expect(within(panel).getByText(/Chiều hàng:/)).toBeInTheDocument();
    expect(within(panel).getByText(/Chiều cột:/)).toBeInTheDocument();
    if (item.kind === "show") {
      expect(within(panel).getByText(`Chỉ số: ${item.metric}`)).toBeInTheDocument();
    }
    expect(within(panel).getByText(/View mặc định:/)).toBeInTheDocument();
    expect(within(panel).getByText("Đang dùng ở 1 set: b-voc-all")).toBeInTheDocument();
  });
});

describe("QuantifyDetail — điều hướng", () => {
  it("bấm '← Về thư viện' gọi onBack", () => {
    const onBack = vi.fn();
    render(<QuantifyDetail {...baseProps(findItem("q1"), { onBack })} />);
    fireEvent.click(screen.getByText("← Về thư viện"));
    expect(onBack).toHaveBeenCalled();
  });
});

describe("QuantifyDetail — no-drill (port harness §11c 333-336, mirror QuantifyLibrary)", () => {
  it("màn chi tiết KHÔNG chứa link điều hướng sang tab khác", () => {
    const { container } = render(<QuantifyDetail {...baseProps(findItem("q1"))} />);
    expect(container.querySelectorAll("a").length).toBe(0);
  });
});

describe("QuantifyDetail — Xóa mở modal ở page (KHÔNG còn confirm inline)", () => {
  it("bấm mục Xóa trong menu ⋮ gọi onRequestDelete(id) — KHÔNG gọi window.confirm, KHÔNG hiện 'Chắc chưa?' inline", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const onRequestDelete = vi.fn();
    render(<QuantifyDetail {...baseProps(findItem("q1"), { onRequestDelete })} />);
    fireEvent.click(screen.getByTestId("qmenu-q1"));
    fireEvent.click(screen.getByTestId("qdelete-q1"));
    expect(onRequestDelete).toHaveBeenCalledWith("q1");
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByText("Chắc chưa?")).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it("bấm mục 'Sửa'/'Nhân bản' trong menu ⋮ vẫn gọi đúng callback (không đổi hành vi)", () => {
    const onEdit = vi.fn();
    const onDuplicate = vi.fn();
    render(<QuantifyDetail {...baseProps(findItem("q1"), { onEdit, onDuplicate })} />);
    // Menu tự đóng sau mỗi lần chọn mục (Popover render-prop `close`) — phải mở lại trước lần bấm kế.
    fireEvent.click(screen.getByTestId("qmenu-q1"));
    fireEvent.click(screen.getByText("Sửa"));
    expect(onEdit).toHaveBeenCalledWith("q1");
    fireEvent.click(screen.getByTestId("qmenu-q1"));
    fireEvent.click(screen.getByText("Nhân bản"));
    expect(onDuplicate).toHaveBeenCalledWith("q1");
  });
});

describe("QuantifyDetail — CountFilter trong popover ▽ (dời từ thẻ lưới sang màn chi tiết, S2.6b: popover thay vì lộ thiên)", () => {
  it("item rank 1 chiều nhiều hơn 5 dòng (q1, theme=14 node) → có popover ▽, mở ra thấy CountFilter", () => {
    render(<QuantifyDetail {...baseProps(findItem("q1"))} />);
    expect(screen.getByTestId("qcount")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("qcount"));
    expect(screen.getByTestId("count-filter")).toBeInTheDocument();
  });

  it("item donut (q14) → KHÔNG có popover ▽ (showCount=false)", () => {
    render(<QuantifyDetail {...baseProps(findItem("q14"))} />);
    expect(screen.queryByTestId("qcount")).not.toBeInTheDocument();
  });

  it("item cross-tab (q16, có item.by) → KHÔNG có popover ▽ (showCount=false)", () => {
    render(<QuantifyDetail {...baseProps(q16)} />);
    expect(screen.queryByTestId("qcount")).not.toBeInTheDocument();
  });

  it("chọn mốc khác trong CountFilter (mở qua popover ▽) đổi số dòng hiển thị trong bảng (view='table')", () => {
    render(<QuantifyDetail {...baseProps(findItem("q1"), { view: "table" })} />);
    const table = screen.getByTestId("data-table");
    // Mặc định count=10 → tối đa 10 dòng dữ liệu (không tính header).
    expect(within(table).getAllByRole("row").length).toBeLessThanOrEqual(11);

    fireEvent.click(screen.getByTestId("qcount"));
    fireEvent.click(screen.getByText("5"));
    const tableAfter = screen.getByTestId("data-table");
    expect(within(tableAfter).getAllByRole("row").length).toBeLessThanOrEqual(6);
  });

  /* Đổi từ "badge = số dòng" sang "đánh dấu active không con số": pill cam đếm số đã là ngôn ngữ của
     nút Bộ lọc (số tiêu chí), tái dùng cho số dòng thì hai đơn vị chung một ký hiệu. */
  it("count lệch mặc định (10) → trigger ▽ được đánh dấu active, KHÔNG in con số; ở mặc định thì không", () => {
    render(<QuantifyDetail {...baseProps(findItem("q1"))} />);
    const trigger = screen.getByTestId("qcount");
    expect(trigger).not.toHaveAttribute("data-active");

    fireEvent.click(trigger);
    fireEvent.click(screen.getByText("5"));
    const after = screen.getByTestId("qcount");
    expect(after).toHaveAttribute("data-active", "true");
    expect(after.textContent).not.toMatch(/\d/);
  });

  it("bấm 'Tất cả' trong CountFilter → nhánh count='all' của limit hiện toàn bộ dòng (nhiều hơn mốc 5)", () => {
    render(<QuantifyDetail {...baseProps(findItem("q1"), { view: "table" })} />);
    fireEvent.click(screen.getByTestId("qcount"));
    fireEvent.click(screen.getByText("5"));
    const rowsAtFive = within(screen.getByTestId("data-table")).getAllByRole("row").length;

    // Popover ▽ không tự đóng khi chọn chip (chỉ Menu mới tự đóng sau onSelect) → vẫn đang mở, bấm thẳng "Tất cả".
    fireEvent.click(screen.getByText("Tất cả"));
    const rowsAtAll = within(screen.getByTestId("data-table")).getAllByRole("row").length;
    // count="all" → limit = total, phải hiện nhiều dòng hơn khi giới hạn ở 5.
    expect(rowsAtAll).toBeGreaterThan(rowsAtFive);
  });
});

describe("QuantifyDetail — menu ⋮ Chart/Bảng là menuitemradio (S2.6b)", () => {
  it("q1 (show, không by) → mục ▮ Chart/▤ Bảng có role=menuitemradio, aria-checked theo view hiện tại", () => {
    render(<QuantifyDetail {...baseProps(findItem("q1"), { view: "chart" })} />);
    fireEvent.click(screen.getByTestId("qmenu-q1"));
    // Mục Chart neo bằng testId (giữ NGUYÊN qtoggle-${id} cho test cũ) — Bảng dò bằng regex vì nội
    // dung nút có thể có dấu ✓ đứng trước nhãn khi đang được chọn (không exact-match được).
    const chart = screen.getByTestId("qtoggle-q1");
    const table = screen.getByText(/Bảng/);
    expect(chart).toHaveAttribute("role", "menuitemradio");
    expect(chart).toHaveAttribute("aria-checked", "true");
    expect(table).toHaveAttribute("role", "menuitemradio");
    expect(table).toHaveAttribute("aria-checked", "false");
  });

  it("bấm mục 'Bảng' trong menu gọi onSetView(id, 'table')", () => {
    const onSetView = vi.fn();
    render(<QuantifyDetail {...baseProps(findItem("q1"), { view: "chart", onSetView })} />);
    fireEvent.click(screen.getByTestId("qmenu-q1"));
    fireEvent.click(screen.getByText(/Bảng/));
    expect(onSetView).toHaveBeenCalledWith("q1", "table");
  });

  it("q16 (cross-tab, có item.by) → menu KHÔNG có mục Chart/Bảng, vẫn giữ testid qtoggle cũ vắng mặt", () => {
    render(<QuantifyDetail {...baseProps(q16)} />);
    fireEvent.click(screen.getByTestId("qmenu-q16"));
    expect(screen.queryByText(/Chart/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("qtoggle-q16")).not.toBeInTheDocument();
  });
});
