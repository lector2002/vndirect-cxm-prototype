import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { TopPriorityBlock } from "./TopPriorityBlock.tsx";

/* Số suy từ seed (đối chiếu độc lập bằng oracle jiti, không phải giả).
   CXI-013 KHÔNG còn trong bảng: action CXA-013 có lc:'closed' từ 02/08/2026, block lọc
   `lc !== 'closed'`. Giữ lại (013) trong ngoặc để thấy chính xác nó rơi ra ở đâu:
   imp.aff  → CXI-024(730) > CXI-021(312) > [CXI-013(228) loại] > CXI-017(146) > CXI-026(64) > CXI-028(0)
   imp.hv   → CXI-021(9)   > CXI-026(6)   > CXI-017(4)   > [CXI-013(2) loại]  > CXI-024(1)  > CXI-028(0)
   |csat|*10→ CXI-021(9)   > CXI-017(8)   > CXI-026(5)   > [CXI-013(4) loại]  > CXI-024(2)  > CXI-028(0)
   pri.reg  → [CXI-013(20) loại] > CXI-028(14) > CXI-017(12) > CXI-026(6) > CXI-021(4) > CXI-024(0)
   → mỗi bảng 5 dòng (không phải 6). Đầu bảng: CXI-024 / CXI-021 / CXI-021 / CXI-028.
   Bảng 4 ĐỔI người dẫn đầu (013 → 028) vì 013 chính là đỉnh của pri.reg; ba bảng còn lại giữ
   nguyên đầu bảng vì 013 chỉ đứng thứ 3-4 ở đó. */
describe("TopPriorityBlock", () => {
  it("render đúng 4 card xếp hạng", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("Top theo số khách ảnh hưởng")).toBeInTheDocument();
    expect(screen.getByText("Top theo khách giá trị cao")).toBeInTheDocument();
    expect(screen.getByText("Top theo tác động CES")).toBeInTheDocument();
    expect(screen.getByText("Top theo rủi ro tuân thủ")).toBeInTheDocument();
  });

  it("thứ tự điểm gãy KHÁC nhau giữa ít nhất 2 cách xếp hạng — suy độc lập từ seed", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} />);
    const bars = screen.getAllByTestId("bars");
    expect(bars).toHaveLength(4);
    // Card 1 (khách ảnh hưởng): CXI-024 đứng đầu
    expect(bars[0].children[0]!.textContent).toContain("Rớt sớm tại bước nhập SĐT từ traffic banner");
    // Card 2 (khách giá trị cao): CXI-021 đứng đầu — KHÁC card 1
    expect(bars[1].children[0]!.textContent).toContain("Liveness thất bại lặp lại trên Android");
    /* Card 4 (rủi ro tuân thủ): CXI-028 đứng đầu — khác cả card 1 và card 2, nên ý của test (4 cách
       xếp hạng cho ra thứ tự khác nhau) vẫn được chứng minh. Trước 02/08/2026 đây là CXI-013, nó
       chính là đỉnh pri.reg=20 nhưng đã khép vòng (lc:'closed') nên rời bảng, nhường cho 028(14). */
    expect(bars[3].children[0]!.textContent).toContain("Zalo OA ngừng gửi dữ liệu từ 19/07");
    // Neo luôn việc 013 KHÔNG xuất hiện ở bất kỳ card nào — nếu ai bỏ vế lc!=='closed' thì test này đỏ.
    for (const b of bars) {
      expect(b.textContent).not.toContain("Chụp CCCD thất bại nhưng thiếu hướng dẫn");
    }
  });

  it("mỗi card hiện đúng 'Đang hiện Top 5 trên 5 điểm gãy' (6 issue, 1 đã khép vòng nên bị loại)", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getAllByText(/Đang hiện Top 5/).length).toBe(4);
    expect(screen.getAllByText(/trên 5 điểm gãy/).length).toBe(4);
    // Mẫu số 5 phải suy được từ seed, không phải hằng chép tay: 6 issue − 1 action lc:'closed'.
    const open = seed.iss.filter((i) => seed.act.find((a) => a.id === i.act)?.lc !== "closed");
    expect(open.length).toBe(5);
  });

  it("bấm một hàng gọi onGo('issue/<id>') đúng id được bấm", () => {
    const onGo = vi.fn();
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    const bars = screen.getAllByTestId("bars");
    fireEvent.click(bars[0].children[0]!);
    expect(onGo).toHaveBeenCalledWith("issue/CXI-024");
  });

  it("không truyền onGo: hàng không có role=button (không crash, không điều hướng)", () => {
    render(<TopPriorityBlock data={seed} cfg={cfgDefault} />);
    const bars = screen.getAllByTestId("bars");
    expect(bars[0].children[0]).not.toHaveAttribute("role");
  });
});
