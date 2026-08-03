import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import type { CxmData } from "../../../data/schema/index.ts";
import { ThemeStackBlock } from "./ThemeStackBlock.tsx";

/* Oracle (đọc trực tiếp seed.ts, 14 theme, sort n desc):
   412(x-th-device) 368(x-th-guide) 295(x-th-status) 210(x-th-wait) 186(x-th-info) 164(x-th-praise)
   118(x-th-fee) 96(x-th-slow) 96(x-th-branch) 92(x-th-start) 88(x-th-cs) 74(x-th-notify) 62(x-th-fast)
   58(x-th-nfc). Top 8 = 8 số đầu; sort ổn định giữ thứ tự gốc khi bằng n → x-th-slow (dòng 279) đứng
   trước x-th-branch (dòng 281), nên Top 8 lấy x-th-slow, CẮT x-th-branch. */
describe("ThemeStackBlock", () => {
  it("render tiêu đề card + đúng Top 8 theme (n lớn nhất), cắt theme thứ 9 trở đi", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("Theme theo thành phần")).toBeInTheDocument();
    const bars = screen.getByTestId("bars");
    expect(bars.children).toHaveLength(8);
    expect(screen.getByText("Thiết bị / môi trường không tương thích")).toBeInTheDocument();
    expect(screen.getByText("Tiền về chậm hơn thông báo")).toBeInTheDocument(); // x-th-slow, hạng 8
    expect(screen.queryByText("Đề nghị mở kênh hỗ trợ tại quầy")).not.toBeInTheDocument(); // x-th-branch, hạng 9 bị cắt
  });

  it("mặc định axis='subtheme' — thanh x-th-device chia đúng 2 đoạn màu theo n thật subtheme (Σ=412, không đoạn 'Chưa gán')", () => {
    const { container } = render(<ThemeStackBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByRole("button", { name: "Sub-theme" })).toHaveAttribute("aria-pressed", "true");
    const deviceRow = screen.getByText("Thiết bị / môi trường không tương thích").closest("[title]")!;
    const fill = deviceRow.querySelector(".flex.rounded-\\[4px\\]") as HTMLElement;
    expect(fill.children).toHaveLength(2);
    expect(fill.children[0]).toHaveAttribute("title", "Android tầm trung, ánh sáng yếu: 238");
    expect(fill.children[1]).toHaveAttribute("title", "Giấy tờ bị chói hoặc mờ: 174");
    expect(container.textContent).toContain("theo sub-theme");
  });

  it("axis='subtheme' — theme KHÔNG có subtheme (x-th-fee, hạng 7) → 1 đoạn duy nhất 'Chưa gán sub-theme: 118'", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} />);
    const feeRow = screen.getByText("Phí và thuế trừ không như kỳ vọng").closest("[title]")!;
    const fill = feeRow.querySelector(".flex.rounded-\\[4px\\]") as HTMLElement;
    expect(fill.children).toHaveLength(1);
    expect(fill.children[0]).toHaveAttribute("title", "Chưa gán sub-theme: 118");
  });

  it("bấm toggle 'Nhóm khách' → aria-pressed đổi, nhãn 'demo' xuất hiện, axisLabel đổi, mọi đoạn segments demo=true (Σ vẫn = n theme)", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} />);
    fireEvent.click(screen.getByRole("button", { name: "Nhóm khách" }));
    expect(screen.getByRole("button", { name: "Nhóm khách" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sub-theme" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("demo")).toBeInTheDocument();
    expect(screen.getByText(/theo nhóm khách \(demo\)/)).toBeInTheDocument();

    const deviceRow = screen.getByText("Thiết bị / môi trường không tương thích").closest("[title]")!;
    const fill = deviceRow.querySelector(".flex.rounded-\\[4px\\]") as HTMLElement;
    // x-th-device có VoiceInsight với seg=['Android tầm trung','Khách 50+'] → 2 đoạn, tổng n=412.
    expect(fill.children).toHaveLength(2);
    const titles = Array.from(fill.children).map((c) => c.getAttribute("title"));
    const totalN = titles.reduce((a, t) => a + Number(t!.split(": ")[1]), 0);
    expect(totalN).toBe(412);
  });

  it("bấm một thanh gọi onGo('topic/<id>')", () => {
    const onGo = vi.fn();
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    const bars = screen.getByTestId("bars");
    fireEvent.click(bars.children[0]!);
    expect(onGo).toHaveBeenCalledWith("topic/x-th-device");
  });

  it("không có onGo: hàng KHÔNG có role=button (không throw khi click)", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} />);
    const bars = screen.getByTestId("bars");
    expect(bars.children[0]).not.toHaveAttribute("role");
  });

  it("không có theme nào → thông báo trống, KHÔNG render Bars", () => {
    const data: CxmData = { ...seed, tax: seed.tax.filter((t) => t.lv !== "theme") };
    render(<ThemeStackBlock data={data} cfg={cfgDefault} />);
    expect(screen.getByText("Chưa có theme nào.")).toBeInTheDocument();
    expect(screen.queryByTestId("bars")).not.toBeInTheDocument();
  });
});
