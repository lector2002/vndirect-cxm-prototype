import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Menu, type MenuItem } from "./Menu.tsx";

describe("Menu", () => {
  it("bấm ⋮ mở panel (role=menu); bấm lần nữa đóng", () => {
    const items: MenuItem[] = [{ label: "A", onSelect: () => {} }];
    render(<Menu items={items} testId="qmenu" />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("qmenu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("qmenu"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Escape đóng panel", () => {
    const items: MenuItem[] = [{ label: "A", onSelect: () => {} }];
    render(<Menu items={items} testId="qmenu" />);
    fireEvent.click(screen.getByTestId("qmenu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("nhãn mặc định 'Thao tác' khi không truyền label", () => {
    render(<Menu items={[{ label: "A", onSelect: () => {} }]} testId="qmenu" />);
    expect(screen.getByRole("button", { name: "Thao tác" })).toBeInTheDocument();
  });

  it("bấm một mục → gọi onSelect() RỒI đóng panel", () => {
    const onSelect = vi.fn();
    render(<Menu items={[{ label: "Xóa", onSelect }]} testId="qmenu" />);
    fireEvent.click(screen.getByTestId("qmenu"));
    fireEvent.click(screen.getByText("Xóa"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("mục checked=true/false → role=menuitemradio + aria-checked đúng; mục thường → role=menuitem, không có aria-checked", () => {
    render(
      <Menu
        testId="qmenu"
        items={[
          { label: "Chart", checked: true, testId: "opt-chart", onSelect: () => {} },
          { label: "Bảng", checked: false, testId: "opt-table", onSelect: () => {} },
          { label: "Sửa", testId: "opt-edit", onSelect: () => {} },
        ]}
      />,
    );
    fireEvent.click(screen.getByTestId("qmenu"));
    const chart = screen.getByTestId("opt-chart");
    const table = screen.getByTestId("opt-table");
    const edit = screen.getByTestId("opt-edit");
    expect(chart).toHaveAttribute("role", "menuitemradio");
    expect(chart).toHaveAttribute("aria-checked", "true");
    expect(table).toHaveAttribute("role", "menuitemradio");
    expect(table).toHaveAttribute("aria-checked", "false");
    expect(edit).toHaveAttribute("role", "menuitem");
    expect(edit).not.toHaveAttribute("aria-checked");
  });

  it("mục tone='crit' vẫn render và bấm được (không throw); separatorBefore không chặn onSelect", () => {
    const onSelect = vi.fn();
    render(
      <Menu
        testId="qmenu"
        items={[
          { label: "Sửa", onSelect: () => {} },
          { label: "Xóa", tone: "crit", separatorBefore: true, testId: "opt-delete", onSelect },
        ]}
      />,
    );
    fireEvent.click(screen.getByTestId("qmenu"));
    fireEvent.click(screen.getByTestId("opt-delete"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
