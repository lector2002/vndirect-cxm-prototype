import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CountFilter } from "./CountFilter.tsx";

/* S2.6b: CountFilter không còn tự quản `open`/trigger — nội dung của nó giờ nằm thẳng trong panel
   Popover ▽ ở QuantifyDetail (Popover lo việc mở/đóng). Test ở đây kiểm HÀNH VI thuần của component
   (props → render/callback), độc lập với Popover bọc ngoài. */
describe("CountFilter", () => {
  it("hiện nhãn 'Hiện {shown}/{total}' + chip các mốc < total + 'Tất cả'; mốc >= total bị ẩn", () => {
    render(<CountFilter value={10} total={14} onChange={() => {}} />);
    expect(screen.getByText("Hiện 10/14")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Tất cả")).toBeInTheDocument();
    // options mặc định [5,10,20] — 20 >= total(14) nên bị opts.filter(n => n < total) loại bỏ.
    expect(screen.queryByText("20")).not.toBeInTheDocument();
  });

  it("value='all' → nhãn hiện 'Hiện {total}/{total}'", () => {
    render(<CountFilter value="all" total={14} onChange={() => {}} />);
    expect(screen.getByText("Hiện 14/14")).toBeInTheDocument();
  });

  it("bấm chip số → onChange(n)", () => {
    const onChange = vi.fn();
    render(<CountFilter value={10} total={14} onChange={onChange} />);
    fireEvent.click(screen.getByText("5"));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("bấm 'Tất cả' → onChange('all')", () => {
    const onChange = vi.fn();
    render(<CountFilter value={10} total={14} onChange={onChange} />);
    fireEvent.click(screen.getByText("Tất cả"));
    expect(onChange).toHaveBeenCalledWith("all");
  });

  it("không còn tự quản open/trigger riêng — mọi chip render thẳng, không có nút '▾' ẩn/hiện", () => {
    render(<CountFilter value={10} total={14} onChange={() => {}} />);
    expect(screen.queryByText(/▾/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
  });

  it("options tùy biến: mốc >= total vẫn bị lọc theo total tùy biến", () => {
    render(<CountFilter value={3} total={5} onChange={() => {}} options={[3, 5, 8]} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.queryByText("8")).not.toBeInTheDocument();
  });
});
