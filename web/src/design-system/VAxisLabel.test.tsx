import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VAxisLabel } from "./VAxisLabel.tsx";

describe("VAxisLabel", () => {
  it("render children + nhãn trục trong DOM", () => {
    render(
      <VAxisLabel label="Số tín hiệu khách hàng">
        <div data-testid="chart-body">Chart</div>
      </VAxisLabel>,
    );
    expect(screen.getByTestId("chart-body")).toBeInTheDocument();
    expect(screen.getByTestId("vaxis-label")).toHaveTextContent("Số tín hiệu khách hàng");
  });

  it("nhãn nằm TRƯỚC children theo thứ tự DOM", () => {
    render(
      <VAxisLabel label="Số tín hiệu khách hàng">
        <div data-testid="chart-body">Chart</div>
      </VAxisLabel>,
    );
    const label = screen.getByTestId("vaxis-label");
    const body = screen.getByTestId("chart-body");
    // eslint-disable-next-line no-bitwise
    expect(label.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("nhãn trục là thông tin, KHÔNG đặt aria-hidden (phải đọc được bằng screen reader)", () => {
    render(
      <VAxisLabel label="Số tín hiệu khách hàng">
        <div>Chart</div>
      </VAxisLabel>,
    );
    expect(screen.getByTestId("vaxis-label")).not.toHaveAttribute("aria-hidden");
  });

  /* D1a (owner chốt 02/08): bar ngang cần CẢ tên chiều (trục dọc) LẪN đơn vị đo — quay dọc không đủ
     chỗ cho cả hai nên đơn vị đo dời xuống `bottomLabel`, đặt ngang dưới đáy chart. */
  it("D1a: bottomLabel render dưới children khi có truyền, căn giữa", () => {
    render(
      <VAxisLabel label="Theme · vì sao" bottomLabel="Số tín hiệu khách hàng">
        <div data-testid="chart-body">Chart</div>
      </VAxisLabel>,
    );
    expect(screen.getByTestId("vaxis-bottom-label")).toHaveTextContent("Số tín hiệu khách hàng");
  });

  it("D1a: vắng bottomLabel → không render nhãn đáy (hành vi mặc định cũ, donut/table/line giữ nguyên)", () => {
    render(
      <VAxisLabel label="Số tín hiệu khách hàng theo kỳ">
        <div>Chart</div>
      </VAxisLabel>,
    );
    expect(screen.queryByTestId("vaxis-bottom-label")).not.toBeInTheDocument();
  });
});
