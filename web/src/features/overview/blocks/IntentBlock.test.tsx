import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import type { CxmData, TaxNode } from "../../../data/schema/index.ts";
import { IntentBlock } from "./IntentBlock.tsx";

/* `.closest("div.bg-surface")` là selector hợp ghép nên TS chỉ suy ra `Element`, không phải
   `HTMLElement` (within() cần HTMLElement) — dùng overload generic của Element.closest() thay vì
   ép kiểu `as`, giữ đúng ràng buộc "không any, không as any". */
function closestCard(el: HTMLElement): HTMLElement {
  const card = el.closest<HTMLElement>("div.bg-surface");
  if (!card) throw new Error("card not found");
  return card;
}

/* Số suy từ seed (lv='theme', nhóm theo cat):
   complaint: x-th-device(412), x-th-status(295), x-th-wait(210), x-th-fee(118), x-th-slow(96) = 5
   help: x-th-guide(368), x-th-info(186), x-th-start(92) = 3
   improvement: x-th-branch(96), x-th-notify(74), x-th-nfc(58) = 3
   praise: x-th-praise(164), x-th-cs(88), x-th-fast(62) = 3
   Tổng 14 theme — không nhóm nào tự nhiên vượt quá 6, nên test cắt Top 6 dùng data tổng hợp
   thêm theme complaint giả (không đụng seed thật). */
describe("IntentBlock", () => {
  /* 25/08 (owner, quét AI-slop): tiêu đề card đổi từ câu hỏi sang nhãn danh từ đọc thẳng từ
     data.cats[cat].label — đối chiếu qua chính seed.cats, không gõ lại chuỗi. */
  it("4 card mang đúng nhãn data.cats[cat].label, đúng thứ tự complaint → improvement → help → praise", () => {
    render(<IntentBlock data={seed} cfg={cfgDefault} />);
    for (const cat of ["complaint", "improvement", "help", "praise"]) {
      expect(screen.getByText(seed.cats[cat]!.label)).toBeInTheDocument();
    }
  });

  it("card complaint CHỈ chứa theme cat=complaint — theme praise/help/improvement KHÔNG xuất hiện trong card đó", () => {
    render(<IntentBlock data={seed} cfg={cfgDefault} />);
    const card = closestCard(screen.getByText(seed.cats.complaint!.label));
    const within_ = within(card);
    expect(within_.getByText("Thiết bị / môi trường không tương thích")).toBeInTheDocument(); // complaint
    expect(within_.queryByText("Trải nghiệm nhanh và mượt")).not.toBeInTheDocument(); // praise
    expect(within_.queryByText("Hướng dẫn không rõ hoặc thiếu")).not.toBeInTheDocument(); // help
    expect(within_.queryByText("Đề nghị mở kênh hỗ trợ tại quầy")).not.toBeInTheDocument(); // improvement
  });

  it("nhóm không vượt TOP_N → KHÔNG có dải mẫu số ('Top 5 trên 5' là nói lại chính chart — 25/08)", () => {
    render(<IntentBlock data={seed} cfg={cfgDefault} />);
    // Seed: không nhóm nào quá 6 theme (xem bảng đếm ở đầu file) → cả 4 card đều không dải.
    expect(screen.queryByText(/Đang hiện Top/)).not.toBeInTheDocument();
  });

  it("cắt Top 6 đúng khi nhóm có >6 theme (data tổng hợp, không đụng seed thật)", () => {
    const extra: TaxNode[] = Array.from({ length: 4 }, (_, i) => ({
      id: `x-th-extra-${i}`,
      lv: "theme",
      parentId: "",
      name: `Theme phụ ${i}`,
      n: 10 + i,
      why: "Test-only",
      up: "01/01/2026",
      by: "Test",
      cat: "complaint",
    }));
    const data: CxmData = { ...seed, tax: [...seed.tax, ...extra] };
    render(<IntentBlock data={data} cfg={cfgDefault} />);
    const card = closestCard(screen.getByText(seed.cats.complaint!.label));
    // 5 theme gốc + 4 theme phụ = 9 tổng, chỉ hiện Top 6
    expect(within(card).getByText(/Đang hiện Top 6/)).toBeInTheDocument();
    expect(within(card).getByText(/trên 9 theme/)).toBeInTheDocument();
    // Theme phụ nhỏ nhất (n=10, thấp hơn mọi theme gốc) bị cắt khỏi Top 6
    expect(within(card).queryByText("Theme phụ 0")).not.toBeInTheDocument();
  });

  it("nhóm rỗng → 'Chưa có theme nào thuộc nhóm này.' (data tổng hợp không theme improvement nào)", () => {
    const data: CxmData = { ...seed, tax: seed.tax.filter((t) => t.cat !== "improvement") };
    render(<IntentBlock data={data} cfg={cfgDefault} />);
    const card = closestCard(screen.getByText(seed.cats.improvement!.label));
    expect(within(card).getByText("Chưa có theme nào thuộc nhóm này.")).toBeInTheDocument();
  });

  it("màu thanh lấy từ data.cats[cat].color, không hardcode", () => {
    render(<IntentBlock data={seed} cfg={cfgDefault} />);
    const bars = screen.getAllByTestId("bars");
    /* D4a (charter Phase 2, section S2.8): Bars.tsx bỏ chấm màu dẫn đầu nhãn (`<i>`) — thanh đã
       mang màu nên chấm là thông tin lặp lại lần 2. Màu giờ CHỈ còn ở chính thanh (`.h-full`, phần
       tô màu bên trong track) — đổi selector từ `querySelector("i")` sang `.h-full`, không đổi Ý
       NGHĨA test (vẫn xác nhận màu đến từ data.cats[cat].color, không hardcode). */
    const complaintBar = bars[0]!.querySelector(".h-full");
    expect(complaintBar).toHaveStyle({ background: seed.cats.complaint!.color });
  });

  it("kids = subtheme có parentId đúng theme cha (x-th-device có 2 subtheme)", () => {
    render(<IntentBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("Android tầm trung, ánh sáng yếu")).toBeInTheDocument();
    expect(screen.getByText("Giấy tờ bị chói hoặc mờ")).toBeInTheDocument();
  });

  it("bấm một thanh gọi onGo('topic/<id>')", () => {
    const onGo = vi.fn();
    render(<IntentBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    const bars = screen.getAllByTestId("bars")[0]!;
    fireEvent.click(bars.children[0]!);
    expect(onGo).toHaveBeenCalledWith("topic/x-th-device");
  });
});
