import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { JourneyStateBlock } from "./JourneyStateBlock.tsx";

/* Số suy từ seed + cfgDefault (đối chiếu độc lập với domain/state.test.ts đã có).
   Ngưỡng: failCrit 15% · failWatch 5% · covMin 70 · effortMax 2,0.
   Mở tài khoản (s1..s6) = ok watch crit ok watch ok → crit 1 · watch 2 · ok 3.
   Pilot mở rộng 05/08 thêm 24 bước (mở TK phái sinh · nạp · tra soát · rút · chuyển nội bộ):
     crit 1  = s-dvo-1 (190/1240 = 15,3% — chặn vì chưa có TK cơ sở / chưa xác thực CCCD)
     watch 9 = s-dvo-3, s-tra-1, s-tra-3, s-tra-4, s-rut-1, s-rut-3, s-rut-4, s-rut-6, s-ctn-2
     ok 14   = phần còn lại
   → tổng crit 2 · watch 11 · ok 17 = 30 = steps.length.
   worst = max obs.failed = s3 (2650) — vẫn là mở tài khoản, không bước mới nào vượt (cao nhất 275).
   flows.length=32, flows.filter(observed)=6 (f-open-2026 + 5 flow pilot mở rộng) → "flow chưa đo" = 26 */
describe("JourneyStateBlock", () => {
  it("cnt(crit)+cnt(watch)+cnt(ok) = steps.length (30) — đọc đúng .t-num, không phải substring", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const stats = screen.getAllByTestId("stat");
    const valueOf = (el: HTMLElement) => el.querySelector(".t-num")!.textContent;
    expect(valueOf(stats[0]!)).toBe("2"); // Cần xử lý ngay = s3, s-dvo-1
    expect(valueOf(stats[1]!)).toBe("11"); // Cần theo dõi
    expect(valueOf(stats[2]!)).toBe("17"); // Đang kiểm soát
    const sum = [0, 1, 2].reduce((a, i) => a + Number(valueOf(stats[i]!)), 0);
    expect(sum).toBe(seed.steps.length);
  });

  it("'Flow chưa đo' = 26 (32 flow map, 6 flow đã quan sát)", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const stats = screen.getAllByTestId("stat");
    expect(stats[3]!.textContent).toContain("26");
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
