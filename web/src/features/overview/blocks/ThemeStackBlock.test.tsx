import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, dims, seed } from "../../../data/fixtures/seed.ts";
import type { CxmData } from "../../../data/schema/index.ts";
import { ThemeStackBlock } from "./ThemeStackBlock.tsx";

/* Oracle (đọc trực tiếp seed.ts, 14 theme, sort n desc):
   412(x-th-device) 368(x-th-guide) 295(x-th-status) 210(x-th-wait) 186(x-th-info) 164(x-th-praise)
   118(x-th-fee) 96(x-th-slow) 96(x-th-branch) 92(x-th-start) 88(x-th-cs) 74(x-th-notify) 62(x-th-fast)
   58(x-th-nfc). Top 8 = 8 số đầu; sort ổn định giữ thứ tự gốc khi bằng n → x-th-slow (dòng 279) đứng
   trước x-th-branch (dòng 281), nên Top 8 lấy x-th-slow, CẮT x-th-branch.

   Oracle pf của x-th-device (đọc trực tiếp `ev` trong seed.ts, lọc tax.includes('x-th-device')):
   EV-101,102,103,104,303,501,601 = pf 'android' (7 dòng); EV-301 = pf 'ios' (1 dòng). Tổng 8 dòng
   ev, theme.n=412 → rem "Chưa có bằng chứng gán" = 404. */
describe("ThemeStackBlock", () => {
  it("render tiêu đề card + đúng Top 8 theme (n lớn nhất), cắt theme thứ 9 trở đi", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    expect(screen.getByText("Theme theo thành phần")).toBeInTheDocument();
    const bars = screen.getByTestId("bars");
    expect(bars.children).toHaveLength(8);
    expect(screen.getByText("Thiết bị / môi trường không tương thích")).toBeInTheDocument();
    expect(screen.getByText("Tiền về chậm hơn thông báo")).toBeInTheDocument(); // x-th-slow, hạng 8
    expect(screen.queryByText("Đề nghị mở kênh hỗ trợ tại quầy")).not.toBeInTheDocument(); // x-th-branch, hạng 9 bị cắt
  });

  /* MẶC ĐỊNH là 'pf' (Nền tảng) — F1 (module-f-charter.md) bỏ trục "Nhóm khách" DEMO, không còn lý
     do để tránh trục thật làm mặc định (đúng lý do cũ chỉ áp cho 'subtheme': 3/14 theme có sub-theme).
     'pf' đếm THẬT từ data.ev nên không còn nhãn "demo" nào phải hiện. */
  it("mặc định axis='pf' — trục thật (đếm từ data.ev), Σ đoạn vẫn = n theme", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    expect(screen.getByRole("button", { name: "Nền tảng" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sub-theme" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/chia theo Nền tảng/)).toBeInTheDocument();
    expect(screen.getByText(/Đếm thật từ bằng chứng/)).toBeInTheDocument();

    const deviceRow = screen.getByText("Thiết bị / môi trường không tương thích").closest("[title]")!;
    const fill = deviceRow.querySelector(".flex.rounded-\\[4px\\]") as HTMLElement;
    // x-th-device: android(7) + ios(1) + "Chưa có bằng chứng gán"(404) = 3 đoạn, Σ=412.
    expect(fill.children).toHaveLength(3);
    const titles = Array.from(fill.children).map((c) => c.getAttribute("title"));
    const totalN = titles.reduce((a, t) => a + Number(t!.split(": ")[1]), 0);
    expect(totalN).toBe(412);
  });

  it("bấm 'Sub-theme' → trục THẬT: x-th-device chia đúng 2 đoạn theo n thật subtheme (Σ=412, không đoạn 'Chưa gán')", () => {
    const { container } = render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    fireEvent.click(screen.getByRole("button", { name: "Sub-theme" }));
    expect(screen.getByRole("button", { name: "Sub-theme" })).toHaveAttribute("aria-pressed", "true");
    const deviceRow = screen.getByText("Thiết bị / môi trường không tương thích").closest("[title]")!;
    const fill = deviceRow.querySelector(".flex.rounded-\\[4px\\]") as HTMLElement;
    expect(fill.children).toHaveLength(2);
    expect(fill.children[0]).toHaveAttribute("title", "Android tầm trung, ánh sáng yếu: 238");
    expect(fill.children[1]).toHaveAttribute("title", "Giấy tờ bị chói hoặc mờ: 174");
    expect(container.textContent).toContain("theo sub-theme");
  });

  it("bấm 'Sub-theme' — theme KHÔNG có subtheme (x-th-fee, hạng 7) → 1 đoạn duy nhất 'Chưa gán sub-theme: 118'", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    fireEvent.click(screen.getByRole("button", { name: "Sub-theme" }));
    const feeRow = screen.getByText("Phí và thuế trừ không như kỳ vọng").closest("[title]")!;
    const fill = feeRow.querySelector(".flex.rounded-\\[4px\\]") as HTMLElement;
    expect(fill.children).toHaveLength(1);
    expect(fill.children[0]).toHaveAttribute("title", "Chưa gán sub-theme: 118");
  });

  it("bấm một thanh gọi onGo('topic/<id>')", () => {
    const onGo = vi.fn();
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} onGo={onGo} />);
    const bars = screen.getByTestId("bars");
    fireEvent.click(bars.children[0]!);
    expect(onGo).toHaveBeenCalledWith("topic/x-th-device");
  });

  it("không có onGo: hàng KHÔNG có role=button (không throw khi click)", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    const bars = screen.getByTestId("bars");
    expect(bars.children[0]).not.toHaveAttribute("role");
  });

  /* Owner chốt 03/08: "chart có chia nhỏ bar theo nhóm khách/sub-theme thì cần cho thêm phần legend
     note các màu phân chia là nhóm nào". Legend ở đây phải THEO HÀNG: themeSegments() gán CAT_CYCLE[i]
     theo thứ hạng TRONG một theme, mỗi theme lại có bộ n riêng cho từng giá trị, nên một dải chung sẽ
     không đủ màu (5 màu CAT_CYCLE cho nhiều nhãn hơn qua nhiều theme). Hai test dưới khoá đúng điều đó
     cho CẢ hai trục. */
  it("trục 'Nền tảng' (mặc định) → thanh x-th-device có legend đúng 2 giá trị pf đếm được", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    const legend = screen.getByTestId("bars-seglegend-x-th-device");
    // 7 dòng ev pf='android', 1 dòng pf='ios' — xem oracle đầu file.
    // S2c (04/08): nhãn pf hiện tên đẹp (PF_LABEL) — 'android'→'Android', 'ios'→'iOS'.
    expect(legend).toHaveTextContent("Android");
    expect(legend).toHaveTextContent("iOS");
  });

  it("trục 'Sub-theme' → theme có subtheme thì có legend; theme không có subtheme (1 đoạn) thì không", () => {
    render(<ThemeStackBlock data={seed} cfg={cfgDefault} dims={dims} />);
    fireEvent.click(screen.getByRole("button", { name: "Sub-theme" }));
    const legend = screen.getByTestId("bars-seglegend-x-th-device");
    expect(legend).toHaveTextContent("Android tầm trung, ánh sáng yếu");
    expect(legend).toHaveTextContent("Giấy tờ bị chói hoặc mờ");
    // Legend là CHÚ GIẢI MÀU, không phải bảng số — n đã có ở bề rộng đoạn + tooltip.
    expect(legend.textContent).not.toContain("238");
    expect(screen.queryByTestId("bars-seglegend-x-th-fee")).not.toBeInTheDocument();
  });

  it("không có theme nào → thông báo trống, KHÔNG render Bars", () => {
    const data: CxmData = { ...seed, tax: seed.tax.filter((t) => t.lv !== "theme") };
    render(<ThemeStackBlock data={data} cfg={cfgDefault} dims={dims} />);
    expect(screen.getByText("Chưa có theme nào.")).toBeInTheDocument();
    expect(screen.queryByTestId("bars")).not.toBeInTheDocument();
  });
});
