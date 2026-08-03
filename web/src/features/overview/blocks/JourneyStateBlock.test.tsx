import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { JourneyStateBlock } from "./JourneyStateBlock.tsx";

/* Số suy từ seed + cfgDefault (đối chiếu độc lập với domain/state.test.ts đã có):
   stepState(s1..s6) = ok watch crit ok watch ok → cnt(crit)=1, cnt(watch)=2, cnt(ok)=3, tổng=6=steps.length
   worst = max obs.failed = s3 (2650) — cũng là bước duy nhất "crit"
   flows.length=32, flows.filter(observed)=1 (f-open-2026) → "flow chưa đo" = 31 */
describe("JourneyStateBlock", () => {
  it("cnt(crit)+cnt(watch)+cnt(ok) = steps.length (6) — đọc đúng .t-num, không phải substring", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const stats = screen.getAllByTestId("stat");
    const valueOf = (el: HTMLElement) => el.querySelector(".t-num")!.textContent;
    expect(valueOf(stats[0]!)).toBe("1"); // Cần xử lý ngay = 1 (s3)
    expect(valueOf(stats[1]!)).toBe("2"); // Cần theo dõi = 2 (s2, s5)
    expect(valueOf(stats[2]!)).toBe("3"); // Đang kiểm soát = 3 (s1, s4, s6)
    const sum = [0, 1, 2].reduce((a, i) => a + Number(valueOf(stats[i]!)), 0);
    expect(sum).toBe(seed.steps.length);
  });

  it("'Flow chưa đo' = 31 (32 flow map, chỉ 1 flow đã quan sát)", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const stats = screen.getAllByTestId("stat");
    expect(stats[3]!.textContent).toContain("31");
    expect(stats[3]!.textContent).toContain("trên 32 flow đã map");
  });

  it("tooltip mỗi chip bước = stepWhy(o, cfg)", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const chipS2 = screen.getByText(/02 Xác thực CCCD/).closest("button")!;
    // s2: failRate 10,5% >= failWatch(5) nhưng < failCrit(15) → "thất bại 10,5% ≥ ngưỡng theo dõi 5%"
    expect(chipS2).toHaveAttribute("title", expect.stringContaining("ngưỡng theo dõi 5%"));
  });

  it("bấm chip bước gọi onGo('atlas')", () => {
    const onGo = vi.fn();
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getByText(/01 Khởi tạo hồ sơ/).closest("button")!);
    expect(onGo).toHaveBeenCalledWith("atlas");
  });
});
