import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuantifyPage } from "./QuantifyPage.tsx";

/* Container — dùng store singleton thật (useCxmStore), KHÔNG mutate (không gọi
   duplicate/delete ở đây, việc đó đã được phủ ở QuantifyLibrary.test.tsx bằng spy,
   tránh ô nhiễm singleton dùng chung giữa các test file). Chỉ kiểm điều hướng qview. */
describe("QuantifyPage — điều hướng qview", () => {
  it("mặc định render thư viện; '＋ Tạo' → stub build; '← Về thư viện' → về lưới", () => {
    render(<QuantifyPage />);
    expect(screen.getByTestId("quantify-library")).toBeInTheDocument();

    fireEvent.click(screen.getByText("＋ Tạo"));
    expect(screen.getByText("Tạo chart mới")).toBeInTheDocument();
    expect(screen.queryByTestId("quantify-library")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("← Về thư viện"));
    expect(screen.getByTestId("quantify-library")).toBeInTheDocument();
  });
});

describe("QuantifyPage — onOpenDetail thread đúng id (P1.2b)", () => {
  it("bấm vào thẻ q1 (click-anywhere, S2.6b) → render màn chi tiết ĐÚNG chart q1; '← Về thư viện' → về lưới", () => {
    render(<QuantifyPage />);
    const card = screen.getByTestId("qcard-q1");
    fireEvent.click(card);

    expect(screen.getByTestId("quantify-detail")).toBeInTheDocument();
    expect(screen.getByText("Volume theo Theme")).toBeInTheDocument();
    expect(screen.queryByTestId("quantify-library")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("← Về thư viện"));
    expect(screen.getByTestId("quantify-library")).toBeInTheDocument();
  });
});

describe("QuantifyPage — filter sau nút 'Bộ lọc' (redesign chỉ thị owner: progressive disclosure)", () => {
  /* ĐẢO NGƯỢC so với trước (owner chốt 02/08): ô search phải LUÔN HIỆN, không nấp sau nút "Bộ lọc".
     Chỉ 3 nhóm chip còn ẩn. Lý do đảo: chôn search sau một nút khiến owner tưởng thư viện không có
     chức năng tìm — "phần quantify cần cho thêm search để tìm chart mình muốn". */
  it("ô search LUÔN hiện; chỉ chip mới ẩn sau nút 'Bộ lọc'", () => {
    render(<QuantifyPage />);
    expect(screen.getByTestId("q-search")).toBeInTheDocument();
    expect(screen.queryByTestId("quantify-filterbar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("qfilter-toggle"));
    expect(screen.getByTestId("quantify-filterbar")).toBeInTheDocument();
  });

  it("gõ search không khớp gì → hiện trạng thái rỗng với nút xóa bộ lọc trả lưới về đủ chart", () => {
    render(<QuantifyPage />);
    fireEvent.change(screen.getByTestId("q-search"), { target: { value: "zzzzz" } });
    const empty = screen.getByTestId("quantify-empty");
    expect(empty).toBeInTheDocument();

    // Nút trong empty state xóa MỌI tiêu chí kể cả search (handleClearFilters), khác nút trong popover.
    fireEvent.click(within(empty).getByText("Xóa bộ lọc"));
    expect(screen.getByTestId("quantify-library")).toBeInTheDocument();
    expect((screen.getByTestId("q-search") as HTMLInputElement).value).toBe("");
  });

  it("nút × trên ô search xóa từ khóa, lưới trở về đủ chart", () => {
    render(<QuantifyPage />);
    fireEvent.change(screen.getByTestId("q-search"), { target: { value: "zzzzz" } });
    expect(screen.getByTestId("quantify-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("q-search-clear"));
    expect(screen.getByTestId("quantify-library")).toBeInTheDocument();
    expect((screen.getByTestId("q-search") as HTMLInputElement).value).toBe("");
  });

  /* Badge đếm CHIP, không đếm search: search đã tự hiện trạng thái trên toolbar nên đếm nó là báo
     trùng, và tệ hơn là badge hiện 1 trong khi mở popover ra chẳng thấy chip nào active. */
  it("badge trên nút 'Bộ lọc' đếm chip, KHÔNG đếm search", () => {
    render(<QuantifyPage />);
    fireEvent.change(screen.getByTestId("q-search"), { target: { value: "theme" } });
    expect(screen.queryByTestId("qfilter-badge")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("qfilter-toggle"));
    fireEvent.click(screen.getByTestId("qfilter-kind-rank"));
    expect(screen.getByTestId("qfilter-badge")).toHaveTextContent("1");
  });
});

/* S2.6b: nút Xóa dời từ footer lộ thiên vào menu ⋮ (Card.actions) — phải mở menu trước khi bấm mục
   Xóa. Modal xác nhận 2 nhánh (chặn khi đang dùng / xác nhận khi tự do) render ở QuantifyPage.tsx,
   KHÔNG đổi — chỉ đường phát sự kiện onRequestDelete đổi từ nút lộ thiên sang mục menu. */
describe("QuantifyPage — Xóa mở Modal giữa màn (chỉ thị owner)", () => {
  it("bấm mục Xóa trong menu ⋮ ở thẻ lưới → hiện Modal xác nhận (role=dialog), KHÔNG confirm inline trong card", () => {
    render(<QuantifyPage />);
    const card = screen.getByTestId("qcard-q1");
    fireEvent.click(within(card).getByTestId("qmenu-q1"));
    fireEvent.click(within(card).getByTestId("qdelete-q1"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Modal cho item tự do (q3) → focus tự chuyển vào nút xác nhận Xóa khi mở (nhánh xác nhận)", () => {
    render(<QuantifyPage />);
    const card = screen.getByTestId("qcard-q3");
    fireEvent.click(within(card).getByTestId("qmenu-q3"));
    fireEvent.click(within(card).getByTestId("qdelete-q3"));
    expect(screen.getByTestId("qdelete-modal-confirm")).toHaveFocus();
  });

  it("Modal cho item đang bị set dùng (q14) → chỉ có nút 'Đóng', không có nút xác nhận Xóa (nhánh chặn)", () => {
    render(<QuantifyPage />);
    const card = screen.getByTestId("qcard-q14");
    fireEvent.click(within(card).getByTestId("qmenu-q14"));
    fireEvent.click(within(card).getByTestId("qdelete-q14"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Đóng")).toBeInTheDocument();
    expect(within(dialog).queryByTestId("qdelete-modal-confirm")).not.toBeInTheDocument();
  });

  it("bấm 'Hủy' trong Modal đóng modal, KHÔNG xóa gì (q3 — chart tự do, không set nào dùng)", () => {
    render(<QuantifyPage />);
    const card = screen.getByTestId("qcard-q3");
    fireEvent.click(within(card).getByTestId("qmenu-q3"));
    fireEvent.click(within(card).getByTestId("qdelete-q3"));
    fireEvent.click(screen.getByText("Hủy"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("qcard-q3")).toBeInTheDocument();
  });
});
