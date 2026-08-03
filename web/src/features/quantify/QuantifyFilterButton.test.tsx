import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuantifyFilterButton } from "./QuantifyFilterButton.tsx";

describe("QuantifyFilterButton — badge", () => {
  it("activeCount=0 → không hiện badge", () => {
    render(
      <QuantifyFilterButton open={false} onToggle={() => {}} activeCount={0}>
        nội dung
      </QuantifyFilterButton>,
    );
    expect(screen.queryByTestId("qfilter-badge")).not.toBeInTheDocument();
  });

  it("activeCount=3 → hiện badge '3'", () => {
    render(
      <QuantifyFilterButton open={false} onToggle={() => {}} activeCount={3}>
        nội dung
      </QuantifyFilterButton>,
    );
    expect(screen.getByTestId("qfilter-badge")).toHaveTextContent("3");
  });
});

describe("QuantifyFilterButton — mở/đóng", () => {
  it("bấm nút gọi onToggle(!open)", () => {
    const onToggle = vi.fn();
    render(
      <QuantifyFilterButton open={false} onToggle={onToggle} activeCount={0}>
        nội dung
      </QuantifyFilterButton>,
    );
    fireEvent.click(screen.getByTestId("qfilter-toggle"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("open=true → hiện popover chứa children", () => {
    render(
      <QuantifyFilterButton open onToggle={() => {}} activeCount={0}>
        <div data-testid="child">bar</div>
      </QuantifyFilterButton>,
    );
    expect(screen.getByTestId("qfilter-popover")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("open=false → KHÔNG render popover", () => {
    render(
      <QuantifyFilterButton open={false} onToggle={() => {}} activeCount={0}>
        <div data-testid="child">bar</div>
      </QuantifyFilterButton>,
    );
    expect(screen.queryByTestId("qfilter-popover")).not.toBeInTheDocument();
  });

  it("phím Esc → onToggle(false)", () => {
    const onToggle = vi.fn();
    render(
      <QuantifyFilterButton open onToggle={onToggle} activeCount={0}>
        nội dung
      </QuantifyFilterButton>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("click ra ngoài → onToggle(false)", () => {
    const onToggle = vi.fn();
    render(
      <div>
        <QuantifyFilterButton open onToggle={onToggle} activeCount={0}>
          nội dung
        </QuantifyFilterButton>
        <button type="button" data-testid="outside">
          ngoài
        </button>
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("bấm 'Xong' trong popover → onToggle(false)", () => {
    const onToggle = vi.fn();
    render(
      <QuantifyFilterButton open onToggle={onToggle} activeCount={0}>
        nội dung
      </QuantifyFilterButton>,
    );
    fireEvent.click(screen.getByText("Xong"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
