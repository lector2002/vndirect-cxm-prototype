import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Popover } from "./Popover.tsx";

describe("Popover", () => {
  it("panel đóng mặc định; bấm trigger mở panel; bấm lần nữa đóng", () => {
    render(
      <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop">
        <div>Nội dung</div>
      </Popover>,
    );
    expect(screen.queryByText("Nội dung")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("pop"));
    expect(screen.getByText("Nội dung")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("pop"));
    expect(screen.queryByText("Nội dung")).not.toBeInTheDocument();
  });

  it("Escape đóng panel", () => {
    render(
      <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop">
        <div>Nội dung</div>
      </Popover>,
    );
    fireEvent.click(screen.getByTestId("pop"));
    expect(screen.getByText("Nội dung")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Nội dung")).not.toBeInTheDocument();
  });

  /* Đóng bằng `click` capture-phase, KHÔNG bằng `mousedown` (test này trước neo mouseDown). Đổi vì
     cú bấm "để đóng" phải bị NUỐT, không được kích hoạt hành động của phần tử bên dưới — xem comment
     trong Popover.tsx và regression ở QuantifyLibrary.test.tsx. `onOutsideClick` chứng minh việc nuốt. */
  it("click ra ngoài đóng panel VÀ không cho click đó chạm tới handler bên dưới", () => {
    const onOutsideClick = vi.fn();
    render(
      <div>
        <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop">
          <div>Nội dung</div>
        </Popover>
        <div data-testid="outside" onClick={onOutsideClick}>
          Ngoài
        </div>
      </div>,
    );
    fireEvent.click(screen.getByTestId("pop"));
    expect(screen.getByText("Nội dung")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByText("Nội dung")).not.toBeInTheDocument();
    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it("trigger icon-only PHẢI có aria-label + title", () => {
    render(
      <Popover trigger={<span>⋮</span>} label="Thao tác">
        <div>Nội dung</div>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Thao tác" });
    expect(trigger).toHaveAttribute("aria-label", "Thao tác");
    expect(trigger).toHaveAttribute("title", "Thao tác");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  /* Trước đây prop là `badge?: number` in một viên pill đếm SỐ DÒNG. Đã đổi sang `active?: boolean`:
     viên pill cam đếm số đã mang nghĩa "số tiêu chí lọc" ở nút Bộ lọc, dùng lại đúng hình đó cho một
     đơn vị khác thì `5` không còn biết là 5 tiêu chí hay 5 dòng. Test neo việc KHÔNG có chữ số nào
     xuất hiện trên trigger, để không ai đem badge số quay lại. */
  it("active=true → trigger đánh dấu; active vắng → không; KHÔNG in con số nào", () => {
    const { rerender } = render(
      <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop" active>
        <div>Nội dung</div>
      </Popover>,
    );
    const trigger = screen.getByTestId("pop");
    expect(trigger).toHaveAttribute("data-active", "true");
    expect(trigger.textContent).not.toMatch(/\d/);

    rerender(
      <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop">
        <div>Nội dung</div>
      </Popover>,
    );
    expect(screen.getByTestId("pop")).not.toHaveAttribute("data-active");
  });

  it("children dạng render-prop (close) => ReactNode nhận được hàm đóng, gọi được từ bên trong", () => {
    render(
      <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop">
        {(close) => (
          <button type="button" onClick={close}>
            Đóng lại
          </button>
        )}
      </Popover>,
    );
    fireEvent.click(screen.getByTestId("pop"));
    expect(screen.getByText("Đóng lại")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Đóng lại"));
    expect(screen.queryByText("Đóng lại")).not.toBeInTheDocument();
  });

  it("aria-expanded phản ánh đúng trạng thái open", () => {
    render(
      <Popover trigger={<span>⋮</span>} label="Thao tác" testId="pop">
        <div>Nội dung</div>
      </Popover>,
    );
    const trigger = screen.getByTestId("pop");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
