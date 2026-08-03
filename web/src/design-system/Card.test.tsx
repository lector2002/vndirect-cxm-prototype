import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Card } from "./Card.tsx";

describe("Card", () => {
  it("render title + subtitle", () => {
    render(
      <Card title="Tiêu đề" subtitle="Phụ đề">
        Nội dung
      </Card>,
    );
    expect(screen.getByText("Tiêu đề")).toBeInTheDocument();
    expect(screen.getByText("Phụ đề")).toBeInTheDocument();
  });

  it("actions render ở góc phải header; vắng thì không render", () => {
    const { rerender } = render(
      <Card title="T" actions={<button type="button">⋮</button>}>
        Nội dung
      </Card>,
    );
    expect(screen.getByRole("button", { name: "⋮" })).toBeInTheDocument();

    rerender(<Card title="T">Nội dung</Card>);
    expect(screen.queryByRole("button", { name: "⋮" })).not.toBeInTheDocument();
  });

  it("denomStrip render full-width dưới header, TRƯỚC children theo thứ tự DOM", () => {
    render(
      <Card title="T" denomStrip="Đang hiện Top 5 trên 10 mục">
        <div data-testid="body">Nội dung</div>
      </Card>,
    );
    const strip = screen.getByTestId("denom-strip");
    const body = screen.getByTestId("body");
    expect(strip).toHaveTextContent("Đang hiện Top 5 trên 10 mục");
    // strip đứng TRƯỚC body trong DOM → body "theo sau" strip.
    // eslint-disable-next-line no-bitwise
    expect(strip.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("vắng denomStrip: không render container rỗng", () => {
    render(<Card title="T">Nội dung</Card>);
    expect(screen.queryByTestId("denom-strip")).not.toBeInTheDocument();
  });

  it("onTitleClick: tiêu đề render thành nút bấm được, gọi callback khi bấm", () => {
    const onTitleClick = vi.fn();
    render(
      <Card title="Tiêu đề bấm được" onTitleClick={onTitleClick}>
        Nội dung
      </Card>,
    );
    const titleBtn = screen.getByRole("button", { name: "Tiêu đề bấm được" });
    fireEvent.click(titleBtn);
    expect(onTitleClick).toHaveBeenCalled();
  });

  it("vắng onTitleClick: tiêu đề KHÔNG phải nút (giữ hành vi cũ)", () => {
    render(<Card title="Tiêu đề tĩnh">Nội dung</Card>);
    expect(screen.queryByRole("button", { name: "Tiêu đề tĩnh" })).not.toBeInTheDocument();
    expect(screen.getByText("Tiêu đề tĩnh").tagName).toBe("B");
  });
});
