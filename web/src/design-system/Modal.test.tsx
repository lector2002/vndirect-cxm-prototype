import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal.tsx";

describe("Modal — render", () => {
  it("open=false → không render gì", () => {
    const { container } = render(
      <Modal open={false} title="Xóa chart?" onClose={() => {}}>
        Nội dung
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("open=true → render dialog qua portal với title + nội dung", () => {
    render(
      <Modal open title="Xóa chart?" onClose={() => {}}>
        Không thể hoàn tác.
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Xóa chart?")).toBeInTheDocument();
    expect(screen.getByText("Không thể hoàn tác.")).toBeInTheDocument();
  });
});

describe("Modal — đóng", () => {
  it("phím Esc gọi onClose", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Xóa chart?" onClose={onClose}>
        Nội dung
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("click backdrop (ngoài hộp) gọi onClose", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Xóa chart?" onClose={onClose}>
        Nội dung
      </Modal>,
    );
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("click TRONG hộp KHÔNG gọi onClose", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Xóa chart?" onClose={onClose}>
        Nội dung
      </Modal>,
    );
    fireEvent.click(screen.getByText("Nội dung"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Modal — focus management", () => {
  it("mở, không truyền initialFocusRef → focus vào hộp thoại", () => {
    render(
      <Modal open title="Xóa chart?" onClose={() => {}}>
        Nội dung
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });
});

describe("Modal — footer", () => {
  it("render footer khi có truyền", () => {
    render(
      <Modal open title="Xóa chart?" onClose={() => {}} footer={<button type="button">Xóa</button>}>
        Nội dung
      </Modal>,
    );
    expect(screen.getByText("Xóa")).toBeInTheDocument();
  });
});
