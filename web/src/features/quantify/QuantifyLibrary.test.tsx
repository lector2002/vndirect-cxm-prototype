import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, dims, seed } from "../../data/fixtures/seed.ts";
import type { QuantifyItem } from "../../data/schema/index.ts";
import { QuantifyLibrary, type QuantifyLibraryProps } from "./QuantifyLibrary.tsx";

function findItem(id: string): QuantifyItem {
  const q = seed.qt.find((x) => x.id === id);
  if (!q) throw new Error(`fixture ${id} không tồn tại`);
  return q;
}

function baseProps(items: QuantifyItem[], overrides: Partial<QuantifyLibraryProps> = {}): QuantifyLibraryProps {
  return {
    items,
    data: seed,
    dims,
    cfg: cfgDefault,
    onOpenDetail: () => {},
    onEdit: () => {},
    onRequestDelete: () => {},
    ...overrides,
  };
}

describe("QuantifyLibrary — grid", () => {
  it("render lưới + đúng 1 card mỗi item", () => {
    const items = [findItem("q1"), findItem("q5"), findItem("q14")];
    render(<QuantifyLibrary {...baseProps(items)} />);
    expect(screen.getByTestId("quantify-library")).toBeInTheDocument();
    expect(screen.getByTestId("qcard-q1")).toBeInTheDocument();
    expect(screen.getByTestId("qcard-q5")).toBeInTheDocument();
    expect(screen.getByTestId("qcard-q14")).toBeInTheDocument();
  });
});

/* S2.6b (dời điều khiển từ Card.footer lên Card.actions): thẻ không còn 3 nút CTA lộ thiên — 3 hành
   động Xem chi tiết/Sửa/Xóa giờ nằm trong menu ⋮ (Card.actions), phải mở menu ra mới thấy. Đồng thời
   cả thẻ là vùng bấm mở rộng (click-anywhere → onOpenDetail), tiêu đề cũng là nút bấm được riêng. */
describe("QuantifyLibrary — thẻ: click-anywhere mở chi tiết, menu ⋮ chứa 3 hành động (S2.6b)", () => {
  it("item show (q1): menu ⋮ có đúng 3 mục Xem chi tiết/Sửa/Xóa — KHÔNG còn CountFilter/toggle/Nhân bản lộ thiên", () => {
    render(<QuantifyLibrary {...baseProps([findItem("q1")])} />);
    const card = screen.getByTestId("qcard-q1");
    expect(within(card).queryByText("Xem chi tiết")).not.toBeInTheDocument();
    fireEvent.click(within(card).getByTestId("qmenu-q1"));
    expect(within(card).getByText("Xem chi tiết")).toBeInTheDocument();
    expect(within(card).getByText("Sửa")).toBeInTheDocument();
    expect(within(card).getByTestId("qdelete-q1")).toBeInTheDocument();
    expect(within(card).queryByTestId("count-filter")).not.toBeInTheDocument();
    expect(within(card).queryByTestId("qtoggle-q1")).not.toBeInTheDocument();
    expect(within(card).queryByText("Nhân bản")).not.toBeInTheDocument();
  });

  it("item series (q5): menu KHÔNG có mục Sửa (series là curated, không sửa ở builder)", () => {
    render(<QuantifyLibrary {...baseProps([findItem("q5")])} />);
    const card = screen.getByTestId("qcard-q5");
    fireEvent.click(within(card).getByTestId("qmenu-q5"));
    expect(within(card).queryByText("Sửa")).not.toBeInTheDocument();
    expect(within(card).getByText("Xem chi tiết")).toBeInTheDocument();
    expect(within(card).getByTestId("qdelete-q5")).toBeInTheDocument();
  });

  it("bấm vào card (không phải ⋮) → gọi onOpenDetail(id)", () => {
    const onOpenDetail = vi.fn();
    render(<QuantifyLibrary {...baseProps([findItem("q1")], { onOpenDetail })} />);
    fireEvent.click(screen.getByTestId("qcard-q1"));
    expect(onOpenDetail).toHaveBeenCalledWith("q1");
  });

  it("bấm ⋮ → KHÔNG gọi onOpenDetail (stopPropagation chặn nổi bọt lên wrapper)", () => {
    const onOpenDetail = vi.fn();
    render(<QuantifyLibrary {...baseProps([findItem("q1")], { onOpenDetail })} />);
    fireEvent.click(screen.getByTestId("qmenu-q1"));
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  /* REGRESSION (Opus đo live trên dist, worker không phủ): mở ⋮ rồi bấm thân thẻ để ĐÓNG menu thì
     cú bấm đó vừa đóng menu VỪA nhảy sang màn chi tiết — Popover đóng bằng `mousedown` còn wrapper
     thẻ bắt `click`, nên click "để đóng" lọt xuống. Đã đổi Popover sang đóng ở capture-phase `click`
     + stopPropagation. Test này neo hành vi đó: một click dismiss chỉ được ĐÓNG, không được điều hướng. */
  it("mở ⋮ rồi bấm thân thẻ để đóng: menu đóng nhưng KHÔNG gọi onOpenDetail", () => {
    const onOpenDetail = vi.fn();
    render(<QuantifyLibrary {...baseProps([findItem("q1")], { onOpenDetail })} />);
    const card = screen.getByTestId("qcard-q1");

    fireEvent.click(within(card).getByTestId("qmenu-q1"));
    expect(screen.getByTestId("qmenu-q1-panel")).toBeInTheDocument();
    expect(onOpenDetail).not.toHaveBeenCalled();

    /* Bấm THÂN thẻ (wrapper), KHÔNG bấm tiêu đề: tiêu đề là <button onTitleClick> nên bấm nó là
       hành động mở chi tiết hợp lệ, không phải cú bấm dismiss. */
    fireEvent.click(card);
    expect(screen.queryByTestId("qmenu-q1-panel")).not.toBeInTheDocument();
    expect(onOpenDetail).toHaveBeenCalledTimes(0);
  });

  it("bấm tiêu đề → gọi onOpenDetail(id)", () => {
    const onOpenDetail = vi.fn();
    const item = findItem("q1");
    render(<QuantifyLibrary {...baseProps([item], { onOpenDetail })} />);
    fireEvent.click(screen.getByText(item.name));
    expect(onOpenDetail).toHaveBeenCalledWith("q1");
  });

  it("bấm mục 'Xem chi tiết' trong menu gọi onOpenDetail(id)", () => {
    const onOpenDetail = vi.fn();
    render(<QuantifyLibrary {...baseProps([findItem("q1")], { onOpenDetail })} />);
    const card = screen.getByTestId("qcard-q1");
    fireEvent.click(within(card).getByTestId("qmenu-q1"));
    fireEvent.click(within(card).getByText("Xem chi tiết"));
    expect(onOpenDetail).toHaveBeenCalledWith("q1");
  });

  it("bấm mục 'Sửa' trong menu gọi onEdit(id)", () => {
    const onEdit = vi.fn();
    render(<QuantifyLibrary {...baseProps([findItem("q1")], { onEdit })} />);
    const card = screen.getByTestId("qcard-q1");
    fireEvent.click(within(card).getByTestId("qmenu-q1"));
    fireEvent.click(within(card).getByText("Sửa"));
    expect(onEdit).toHaveBeenCalledWith("q1");
  });
});

describe("QuantifyLibrary — Xóa mở modal ở page (KHÔNG còn confirm inline)", () => {
  it("bấm mục Xóa trong menu gọi onRequestDelete(id) — KHÔNG gọi window.confirm, KHÔNG hiện 'Chắc chưa?' inline", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const onRequestDelete = vi.fn();
    render(<QuantifyLibrary {...baseProps([findItem("q1")], { onRequestDelete })} />);
    const card = screen.getByTestId("qcard-q1");
    fireEvent.click(within(card).getByTestId("qmenu-q1"));
    fireEvent.click(screen.getByTestId("qdelete-q1"));
    expect(onRequestDelete).toHaveBeenCalledWith("q1");
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByText("Chắc chưa?")).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});

describe("QuantifyLibrary — no-drill (port harness §11c 333-336)", () => {
  it("thư viện KHÔNG chứa link điều hướng sang tab khác (thuần authoring)", () => {
    const items = [findItem("q1"), findItem("q5"), findItem("q14"), findItem("q16")];
    const { container } = render(<QuantifyLibrary {...baseProps(items)} />);
    expect(container.querySelectorAll("a").length).toBe(0);
  });
});

describe("QuantifyLibrary — trạng thái rỗng (port harness §11b 291-292)", () => {
  it("items=[] → hiện quantify-empty với thông báo + nút xóa bộ lọc, KHÔNG render lưới", () => {
    const onClearFilters = vi.fn();
    render(<QuantifyLibrary {...baseProps([], { onClearFilters })} />);
    expect(screen.getByTestId("quantify-empty")).toBeInTheDocument();
    expect(screen.getByText("Không có chart nào khớp bộ lọc.")).toBeInTheDocument();
    expect(screen.queryByTestId("quantify-library")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Xóa bộ lọc"));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
