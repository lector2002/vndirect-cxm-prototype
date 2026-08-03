import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuantifySearch } from "./QuantifySearch.tsx";

/* Hai test đầu chuyển từ QuantifyFilterBar.test.tsx sang đây cùng lúc input `q-search` dời chỗ —
   cùng hành vi, chỉ đổi component chủ. Test nút × là mới: trước đây search dùng chung nút "Xóa bộ
   lọc" của filter bar, giờ nó phải tự xóa được. */
describe("QuantifySearch", () => {
  it("render ô tìm luôn hiện, giữ testid q-search + có aria-label", () => {
    render(<QuantifySearch value="" onChange={() => {}} />);
    const input = screen.getByTestId("q-search");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAccessibleName("Tìm chart trong thư viện");
  });

  it("gõ vào ô search gọi onChange với giá trị mới", () => {
    const onChange = vi.fn();
    render(<QuantifySearch value="" onChange={onChange} />);
    fireEvent.change(screen.getByTestId("q-search"), { target: { value: "theme" } });
    expect(onChange).toHaveBeenCalledWith("theme");
  });

  it("nút × ẩn khi rỗng, hiện khi có từ khóa, bấm thì gọi onChange('')", () => {
    const onChange = vi.fn();
    const { rerender } = render(<QuantifySearch value="" onChange={onChange} />);
    expect(screen.queryByTestId("q-search-clear")).not.toBeInTheDocument();

    rerender(<QuantifySearch value="theme" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("q-search-clear"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
