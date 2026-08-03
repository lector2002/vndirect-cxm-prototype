import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatChip } from "./CatChip.tsx";

describe("CatChip", () => {
  it("hiện label, chữ = color truyền vào, border = currentColor", () => {
    render(<CatChip label="Khiếu nại" color="#b3261e" />);
    const el = screen.getByText("Khiếu nại");
    expect(el).toHaveStyle({ color: "rgb(179, 38, 30)" });
    // toHaveStyle không đọc được border-color qua getComputedStyle trong jsdom (thiếu
    // border-style thì jsdom bỏ qua), nên đọc thẳng từ style attribute.
    expect(el.style.borderColor).toBe("currentcolor");
  });

  it("đổi color thì style đổi theo, không đọc map cats nào cả", () => {
    render(<CatChip label="Khen ngợi" color="#3f6212" />);
    const el = screen.getByText("Khen ngợi");
    expect(el).toHaveStyle({ color: "rgb(63, 98, 18)" });
  });
});
