import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import type { CxmData } from "../../../data/schema/index.ts";
import { TopicTrendBlock } from "./TopicTrendBlock.tsx";

/* Số suy từ seed (14 theme, trend(t) = pts[last]-pts[0]; S2.7/D8a: seed mở rộng 6→12 điểm/chuỗi,
   6 điểm ĐẦU sinh bằng monthly() của prototype (dòng 3806-3813: stepv = pts[1]-pts[0], kẹp
   Math.max(0,…)) — 6 điểm CUỐI giữ nguyên byte-for-byte nên mọi pts[last] không đổi, chỉ pts[0]
   đổi → trend đổi theo):
   device +222(complaint,bad) · guide -70(help,good) · status +127(complaint,bad,drift=duplicate) ·
   wait +46(complaint,bad) · info +84(help,bad) · praise +150(praise,good) · fee +118(complaint,bad,demo) ·
   slow -38(complaint,good,demo) · start +46(help,bad,demo) · branch +96(improvement,bad,demo) ·
   notify +74(improvement,bad,demo) · nfc +58(improvement,bad,demo) · cs +64(praise,good,demo) ·
   fast +60(praise,good,demo).
   "Tăng theo hướng xấu" (cat≠praise ∧ d>0) = device,status,wait,info,fee,start,branch,notify,nfc = 9/14
   (không đổi so với trước S2.7 — mọi dấu +/- giữ nguyên, chỉ độ lớn đổi).
   demo=true: fee,slow,start,branch,notify,nfc,cs,fast = 8. drift: chỉ status (duplicate). Còn lại
   ok (không demo, không drift): device,guide,wait,info,praise = 5. 1+8+5=14.
   themeStep(guide)=s2 (ev tax chứa x-th-guide: EV-105 s3, EV-302 s2, EV-305 s2, EV-401 s1 → s2
   nhiều nhất) → act released chạm s2 = CXA-013 (iss CXI-013 step s2) → 1 fix.
   themeStep(slow)=null (không ev nào tax chứa x-th-slow) → 0 fix, không hiện dòng "đã phát hành". */
describe("TopicTrendBlock", () => {
  /* 06/08: bảng này là chỗ nở nhanh nhất hệ thống (mỗi topic mới của taxonomy VoC là một dòng, vĩnh
     viễn) nên cắt ở TOP_N=8, phần còn lại đếm ra chữ và mở được tại chỗ. */
  it("mặc định chỉ hiện 8 topic đầu, KHÔNG đổ hết 14 dòng", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getAllByTestId(/^topic-row-/)).toHaveLength(8);
    expect(screen.getByTestId("topic-more")).toHaveTextContent("Xem hết 14 topic (+6 nữa)");
  });

  it("mở hết thì mọi theme có đúng 1 hàng (14/14), thu gọn lại về 8", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    fireEvent.click(screen.getByTestId("topic-more"));
    const rows = seed.tax.filter((t) => t.lv === "theme").map((t) => screen.getByTestId(`topic-row-${t.id}`));
    expect(rows).toHaveLength(14);
    expect(screen.getByTestId("topic-more")).toHaveTextContent("Thu gọn");

    fireEvent.click(screen.getByTestId("topic-more"));
    expect(screen.getAllByTestId(/^topic-row-/)).toHaveLength(8);
  });

  /* Mẫu số cũ ghi "Đang hiện Top 9 trên 14 topic đang tăng theo hướng xấu" trong khi bảng vẽ CẢ 14 —
     khai một tập con mà liệt kê tất cả. Nay vế đầu nói đúng số đang hiện, `rising` thành vế riêng. */
  it("mẫu số nói đúng số dòng ĐANG HIỆN, và tách riêng số topic đang tăng xấu", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("Đang hiện 8 trên 14 topic · 9 đang tăng theo hướng xấu")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("topic-more"));
    expect(screen.getByText("Đang hiện 14 trên 14 topic · 9 đang tăng theo hướng xấu")).toBeInTheDocument();
  });

  it("Thay đổi đúng dấu +222 cho x-th-device (tăng) và -70 cho x-th-guide (giảm)", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    const deviceRow = screen.getByTestId("topic-row-x-th-device");
    expect(within(deviceRow).getByText("+222")).toBeInTheDocument();
    const guideRow = screen.getByTestId("topic-row-x-th-guide");
    expect(within(guideRow).getByText("-70")).toBeInTheDocument();
  });

  it("complaint tăng (x-th-device, +222) tô crit; help giảm (x-th-guide, -70) tô good", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    const deviceChange = within(screen.getByTestId("topic-row-x-th-device")).getByText("+222");
    expect(deviceChange).toHaveStyle({ color: "var(--crit)" });
    const guideChange = within(screen.getByTestId("topic-row-x-th-guide")).getByText("-70");
    expect(guideChange).toHaveStyle({ color: "var(--good)" });
  });

  it("theme cat=praise GIẢM phải tô crit, không phải good (data tổng hợp — seed thật không có praise giảm)", () => {
    const data: CxmData = {
      ...seed,
      tax: seed.tax.map((t) => (t.id === "x-th-praise" ? { ...t, pts: [200, 190, 180, 170, 160, 150] } : t)),
    };
    render(<TopicTrendBlock data={data} cfg={cfgDefault} />);
    const row = screen.getByTestId("topic-row-x-th-praise");
    const change = within(row).getByText("-50");
    expect(change).toHaveStyle({ color: "var(--crit)" });
  });

  it("theme cat=praise TĂNG (thật, seed gốc) tô good, không phải crit", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    const row = screen.getByTestId("topic-row-x-th-praise");
    const change = within(row).getByText("+150");
    expect(change).toHaveStyle({ color: "var(--good)" });
  });

  it("badge 'Dữ liệu demo' xuất hiện ĐÚNG 8 theme có demo:true, không xuất hiện ở theme không demo", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    fireEvent.click(screen.getByTestId("topic-more")); // theme demo nằm rải cả ngoài top 8
    const demoIds = ["x-th-fee", "x-th-slow", "x-th-start", "x-th-branch", "x-th-notify", "x-th-nfc", "x-th-cs", "x-th-fast"];
    demoIds.forEach((id) => {
      expect(within(screen.getByTestId(`topic-row-${id}`)).getByText(/Dữ liệu demo/)).toBeInTheDocument();
    });
    expect(within(screen.getByTestId("topic-row-x-th-device")).queryByText(/Dữ liệu demo/)).not.toBeInTheDocument();
  });

  it("theme có drift (x-th-status) hiện badge watch với nhãn D_DRIFT tương ứng ('Có thể trùng nghĩa')", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    expect(within(screen.getByTestId("topic-row-x-th-status")).getByText("Có thể trùng nghĩa")).toBeInTheDocument();
  });

  it("theme không demo không drift (device/guide/wait/info/praise) hiện badge 'Ổn định'", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    ["x-th-device", "x-th-guide", "x-th-wait", "x-th-info", "x-th-praise"].forEach((id) => {
      expect(within(screen.getByTestId(`topic-row-${id}`)).getByText(/Ổn định/)).toBeInTheDocument();
    });
  });

  it("x-th-guide (giảm, cat help) hiện '✓ 1 đã phát hành' (themeStep=s2 → CXA-013 released)", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    expect(within(screen.getByTestId("topic-row-x-th-guide")).getByText(/✓ 1 đã phát hành/)).toBeInTheDocument();
  });

  it("x-th-slow (giảm, cat complaint, không evidence tax nào) KHÔNG hiện dòng 'đã phát hành'", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    expect(within(screen.getByTestId("topic-row-x-th-slow")).queryByText(/đã phát hành/)).not.toBeInTheDocument();
  });

  it("Volume = nf(fx(n)) — x-th-device n=412 → fx=2307 → '2.307'", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    expect(within(screen.getByTestId("topic-row-x-th-device")).getByText("2.307")).toBeInTheDocument();
  });

  it("Sub-theme: x-th-device hiện 2 chip subtheme con; theme không có subtheme hiện '—'", () => {
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    const deviceRow = screen.getByTestId("topic-row-x-th-device");
    expect(within(deviceRow).getByText("Android tầm trung, ánh sáng yếu")).toBeInTheDocument();
    expect(within(deviceRow).getByText("Giấy tờ bị chói hoặc mờ")).toBeInTheDocument();
    const praiseRow = screen.getByTestId("topic-row-x-th-praise");
    expect(within(praiseRow).getByText("—")).toBeInTheDocument();
  });

  it("mặc định (không truyền selectedLines) mọi dòng hiện ☆; truyền selectedLines hiện ★ đúng dòng đó", () => {
    const { rerender } = render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
    const deviceRow = screen.getByTestId("topic-row-x-th-device");
    expect(within(deviceRow).getByText("☆")).toBeInTheDocument();

    rerender(<TopicTrendBlock data={seed} cfg={cfgDefault} selectedLines={["x-th-device"]} />);
    expect(within(screen.getByTestId("topic-row-x-th-device")).getByText("★")).toBeInTheDocument();
    expect(within(screen.getByTestId("topic-row-x-th-guide")).getByText("☆")).toBeInTheDocument();
  });

  it("bấm ★/☆ gọi onToggleLine(id), KHÔNG gọi onGo (stopPropagation)", () => {
    const onToggleLine = vi.fn();
    const onGo = vi.fn();
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} onToggleLine={onToggleLine} onGo={onGo} />);
    const star = within(screen.getByTestId("topic-row-x-th-device")).getByText("☆");
    fireEvent.click(star);
    expect(onToggleLine).toHaveBeenCalledWith("x-th-device");
    expect(onGo).not.toHaveBeenCalled();
  });

  it("bấm một dòng (ngoài nút ★) gọi onGo('topic/<id>')", () => {
    const onGo = vi.fn();
    render(<TopicTrendBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getByTestId("topic-row-x-th-device"));
    expect(onGo).toHaveBeenCalledWith("topic/x-th-device");
  });

  describe("months — bộ lọc thời gian Enterpret-style (owner 01/08, chỉ áp sparkline + Thay đổi)", () => {
    it("không truyền months → header 'Xu hướng 12 kỳ' (S2.7: mọi theme seed nay có đúng 12 điểm)", () => {
      render(<TopicTrendBlock data={seed} cfg={cfgDefault} />);
      expect(screen.getByText("Xu hướng 12 kỳ")).toBeInTheDocument();
    });

    it("months=3 → header 'Xu hướng 3 kỳ', sparkline RÚT NGẮN còn 3 cột, 'Thay đổi' tính lại trên 3 điểm cuối (x-th-device: pts 12 điểm, 3 điểm CUỐI [340,402,412] giữ nguyên byte-for-byte qua S2.7 → slice(-3) → +72, không đổi)", () => {
      render(<TopicTrendBlock data={seed} cfg={cfgDefault} months={3} />);
      expect(screen.getByText("Xu hướng 3 kỳ")).toBeInTheDocument();
      const deviceRow = screen.getByTestId("topic-row-x-th-device");
      expect(within(deviceRow).getByText("+72")).toBeInTheDocument();
      expect(within(deviceRow).getByTestId("sparkline").children).toHaveLength(3);
    });

    it("months=24 nhưng theme chỉ có 12 điểm thật (S2.7) → KHÔNG nội suy, giữ nguyên header/sparkline/Thay đổi như không lọc", () => {
      render(<TopicTrendBlock data={seed} cfg={cfgDefault} months={24} />);
      expect(screen.getByText("Xu hướng 12 kỳ")).toBeInTheDocument();
      const deviceRow = screen.getByTestId("topic-row-x-th-device");
      expect(within(deviceRow).getByText("+222")).toBeInTheDocument();
      expect(within(deviceRow).getByTestId("sparkline").children).toHaveLength(12);
    });
  });
});
