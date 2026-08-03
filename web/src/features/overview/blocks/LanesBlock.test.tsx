import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { laneOf } from "../../../domain/index.ts";
import { LanesBlock } from "./LanesBlock.tsx";

/* Số suy từ seed qua laneOf() (khớp domain/state.test.ts "suy đúng làn cho toàn bộ action"):
   confirm=[CXA-024](1) approve=[CXA-021,CXA-026](2) fix=[CXA-028](1) verify=[CXA-017](1)
   → tổng 4 làn = 5 = act.filter(laneOf!=='off').length, trên tổng 6 action.
   Từ 02/08/2026 CXA-013 có iv:'validated' + lc:'closed' → laneOf='off', rời làn 'verify' (làn này
   từ 2 xuống 1). Đây là action 'off' ĐẦU TIÊN của fixture; khẳng định cũ "không action nào là 'off'"
   không còn đúng, nên tổng 4 làn 6 → 5 và nhãn mẫu số đổi sang "action đã ghi nhận" (mẫu số 6 gồm cả
   action đã khép vòng, không phải "việc còn cần tay người"). */
describe("LanesBlock", () => {
  it("tổng 4 làn = act.filter(laneOf!=='off').length (5) trên tổng 6 action — 1 action đã 'off'", () => {
    render(<LanesBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText(/Đang hiện Top 5/)).toBeInTheDocument();
    expect(screen.getByText(/trên 6 action đã ghi nhận/)).toBeInTheDocument();
    // Neo cả hai số về seed, không chép tay: tử 5 = còn trong làn, mẫu 6 = tổng action.
    expect(seed.act.filter((a) => laneOf(a) !== "off").length).toBe(5);
    expect(seed.act.length).toBe(6);
  });

  it("đúng số việc mỗi làn (lane-count, KHÔNG phải số thứ tự lane): 1, 2, 1, 1 — tổng = act.filter(laneOf!=='off').length", () => {
    render(<LanesBlock data={seed} cfg={cfgDefault} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveTextContent("1 · Cần xác nhận");
    expect(buttons[1]).toHaveTextContent("2 · Chờ duyệt");
    expect(buttons[2]).toHaveTextContent("3 · Đang sửa");
    expect(buttons[3]).toHaveTextContent("4 · Đang verify");

    const counts = screen.getAllByTestId("lane-count").map((el) => Number(el.textContent));
    expect(counts).toEqual([1, 2, 1, 1]);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(seed.act.filter((a) => laneOf(a) !== "off").length);
  });

  it("làn 'Cần xác nhận' có phần tử (CXA-024) → viền crit (border-crit)", () => {
    render(<LanesBlock data={seed} cfg={cfgDefault} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]!.className).toContain("border-crit");
    expect(buttons[1]!.className).not.toContain("border-crit");
  });

  it("bấm một làn gọi onGo('work') (KHÔNG có field sub-tab nào khác)", () => {
    const onGo = vi.fn();
    render(<LanesBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getAllByRole("button")[0]!);
    expect(onGo).toHaveBeenCalledWith("work");
    expect(onGo).toHaveBeenCalledTimes(1);
  });
});
