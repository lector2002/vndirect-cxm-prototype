import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { CoverageBlock } from "./CoverageBlock.tsx";

/* Số suy từ seed (obs.cov theo step, ngưỡng cfgDefault.step.covMin=70).
   Mở tài khoản: s1=96 s2=71 s3=64 s4=92 s5=58 s6=89 → s3 (03) và s5 (05) < 70.
   Pilot mở rộng 05/08 thêm 4 bước dưới ngưỡng: s-tra-1=63, s-tra-3=59 (tra soát nạp tiền),
   s-rut-3=61 (xác thực CCCD qua VNeID), s-rut-4=57 (chữ ký & hợp đồng rút tiền) — evidence mỏng ở
   đúng hai cổng nặng nhất của chuỗi rút là điểm nghiệp vụ, không phải số chưa điền.
   → tổng 6 bước hiện trên thanh. Mọi giá trị cov dưới ngưỡng đều KHÁC NHAU (57·58·59·61·63·64) để
   `getByText("64%")` chỉ trúng đúng một thanh; trùng số sẽ làm test này đỏ vì nhiều kết quả.
   signals st∈{gap,designed}: sg9, sg-dvo-4, sg-tra-4 (designed) + sg-nap-4, sg-rut-5 (gap) = 5.
   (`sg6` từng nằm trong danh sách này; bỏ 05/08 vì chiều Nền tảng trả lời sẵn câu nó định hỏi.
   Không khẳng định nào ở dưới đếm số này — ghi để đọc trạng thái seed, không phải để test bám vào.) */
describe("CoverageBlock", () => {
  it("KHÔNG xuất hiện chuỗi số đã nhân fx() trên thanh — 64/58 hiện raw %, không phải fx(64)=358/fx(58)=325", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("64%")).toBeInTheDocument();
    expect(screen.getByText("58%")).toBeInTheDocument();
    expect(screen.queryByText("358")).not.toBeInTheDocument();
    expect(screen.queryByText("358%")).not.toBeInTheDocument();
    expect(screen.queryByText("325")).not.toBeInTheDocument();
    expect(screen.queryByText("325%")).not.toBeInTheDocument();
  });

  it("D1: tooltip của thanh cũng KHÔNG bị nhân fx() — title bước 03 nói '64%', không phải '358'", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const row = screen.getByText(/03 Liveness & Face match/).closest("[title]");
    expect(row).toHaveAttribute("title", expect.stringContaining("64%"));
    expect(row?.getAttribute("title")).not.toContain("358");
  });

  it("bấm một thanh gọi onGo('atlas')", () => {
    const onGo = vi.fn();
    render(<CoverageBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    const bars = screen.getByTestId("bars");
    fireEvent.click(bars.children[0]!);
    expect(onGo).toHaveBeenCalledWith("atlas");
  });
});
