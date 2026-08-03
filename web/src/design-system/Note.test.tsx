import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Note } from "./Note.tsx";

describe("Note", () => {
  it("mặc định (không truyền tone) dùng class default", () => {
    render(<Note>Ghi chú thường</Note>);
    expect(screen.getByTestId("note")).toHaveTextContent("Ghi chú thường");
    expect(screen.getByTestId("note").className).toContain("bg-surface-2");
  });

  it("tone=warn dùng token watch-bg/watch-line", () => {
    render(<Note tone="warn">Cảnh báo</Note>);
    const el = screen.getByTestId("note");
    expect(el.className).toContain("bg-watch-bg");
    expect(el.className).toContain("border-watch-line");
  });

  it("tone=crit dùng token crit-bg/crit-line", () => {
    render(<Note tone="crit">Nghiêm trọng</Note>);
    const el = screen.getByTestId("note");
    expect(el.className).toContain("bg-crit-bg");
    expect(el.className).toContain("border-crit-line");
  });

  it("tone=bd dùng token primary-soft/primary-line", () => {
    render(<Note tone="bd">Điểm gãy</Note>);
    const el = screen.getByTestId("note");
    expect(el.className).toContain("bg-primary-soft");
    expect(el.className).toContain("border-primary-line");
  });

  it("children là ReactNode bất kỳ, không chỉ string", () => {
    render(
      <Note tone="crit">
        <b>Đậm</b> và chữ thường
      </Note>,
    );
    expect(screen.getByText("Đậm")).toBeInTheDocument();
  });
});
