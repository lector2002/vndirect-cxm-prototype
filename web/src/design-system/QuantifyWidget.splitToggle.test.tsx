import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { QuantifyItem } from "../data/schema/index.ts";
import { QuantifyWidget } from "./QuantifyWidget.tsx";

/* Toggle chiều chia màu (owner chốt 03/08, lát 1): "khi thấy vấn đề có thể toggle để xem insight xem
   tập trung vào nhóm kh nào", kèm luật owner nêu thẳng — "nếu chart là tỷ lệ khách theo nav sẵn thì ko
   thể toggle nav được, phân [đó] sẽ bị disable".

   Điều được kiểm ở đây là CHỖ NỐI widget ↔ domain, không phải "chip có đổi màu không": một test chỉ
   xem đoạn màu có xuất hiện sẽ XANH cả khi lựa chọn mới tới được legend mà KHÔNG tới `qRunSplit` (lúc
   đó chart vẽ số của chiều cũ dưới nhãn của chiều mới — đúng kiểu nói dối khó thấy nhất). Vì thế các
   test dưới ghim SỐ THẬT đã đo trên demoData, không tính lại bằng chính hàm đang test.

   Dùng demoData (300 khách) chứ không phải seed: seed.cust quá nhỏ để các đoạn màu khác nhau rõ ràng
   giữa hai chiều. QuantifyWidget.segment.test.tsx đã phủ nhánh seed + split ghim trong fixture. */

function findItem(id: string): QuantifyItem {
  const q = seed.qt.find((x) => x.id === id);
  if (!q) throw new Error(`fixture ${id} không tồn tại`);
  return q;
}

/* Title của mỗi đoạn màu do Bars đặt: `${label}: ${nf(n)}` (Bars.tsx). Chính con số đó là thứ phải
   đổi khi người dùng đổi chiều — nhãn legend đổi mà số không đổi là bug này tồn tại. */
function rowSegTitles(rowIndex: number): string[] {
  const row = screen.getByTestId("bars").children[rowIndex];
  return [...row.querySelectorAll("div[title]")].map((el) => el.getAttribute("title") ?? "");
}

function chip(label: string): HTMLElement {
  return screen.getByRole("button", { name: label });
}

describe("QuantifyWidget — toggle chiều chia màu: luật disable của owner", () => {
  it("q18 (xếp hàng theo NAV) → chip 'Phân khúc NAV' vẫn HIỆN nhưng khoá, tooltip mang đúng lý do của qRunSplit", () => {
    render(<QuantifyWidget item={findItem("q18")} data={demoData} dims={dims} />);
    const navChip = chip("Phân khúc NAV");
    expect(navChip).toHaveAttribute("aria-disabled", "true");
    // Lý do KHÔNG được viết lại ở tầng hiển thị — đây là câu qRunSplit trả về, nguyên văn.
    expect(navChip).toHaveAttribute(
      "title",
      'Chia màu theo đúng chiều đang xếp hàng ("nav") thì mỗi thanh chỉ có một đoạn — không thêm thông tin nào.',
    );
    /* Owner chốt DISABLE chứ không ẩn: ẩn thì strip đổi bề rộng theo từng chart. 6 chiều khách + chip
       "Không chia" = 7 chip, kể cả chip bị khoá. */
    expect(screen.getByRole("group", { name: "Chiều chia màu trong thanh" }).children).toHaveLength(7);
    /* KHÔNG dùng attribute `disabled` thật: nút disabled rơi khỏi tab order và screen reader bỏ qua,
       nên tooltip mang lý do thành không tới được đúng với người cần nó nhất. */
    expect(navChip).not.toBeDisabled();
  });

  it("chip bị khoá bấm không có tác dụng (chart giữ nguyên trạng thái chưa chia màu)", () => {
    render(<QuantifyWidget item={findItem("q18")} data={demoData} dims={dims} />);
    expect(chip("Không chia")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip("Phân khúc NAV"));
    expect(chip("Không chia")).toHaveAttribute("aria-pressed", "true");
    expect(rowSegTitles(0)).toHaveLength(0);
  });

  it("q19 (acq × nav ghim trong fixture) → chip đang dùng là 'Phân khúc NAV', chip bị khoá là 'Kênh mở TK'", () => {
    render(<QuantifyWidget item={findItem("q19")} data={demoData} dims={dims} />);
    expect(chip("Phân khúc NAV")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Kênh mở TK")).toHaveAttribute("aria-disabled", "true");
    expect(chip("Phân khúc NAV")).not.toHaveAttribute("aria-disabled");
  });
});

describe("QuantifyWidget — toggle chiều chia màu: lựa chọn tới được ENGINE, không chỉ tới legend", () => {
  it("q19: đổi NAV → Độ tuổi thì CẢ nhãn legend LẪN số từng đoạn của hàng 'tự tìm' (62 khách) đổi theo", () => {
    render(<QuantifyWidget item={findItem("q19")} data={demoData} dims={dims} />);
    expect(screen.getByTestId("bars").children[0]).toHaveTextContent("tự tìm");
    /* Trạng thái đầu = split 'nav' của fixture: 48+6+3+3+2 = 62. KHÔNG có đoạn "Không xác định" — owner
       chốt 04/08 NAV lấy trực tiếp từ tài sản hiện tại, khách chưa nạp tiền là 0đ nên nằm ở '<50tr'
       (chính vì vậy đoạn '<50tr' chiếm gần hết thanh). */
    expect(rowSegTitles(0)).toEqual([
      "<50tr: 48",
      "50-200tr: 6",
      "200tr-1tỷ: 3",
      "1-5tỷ: 3",
      ">5tỷ: 2",
    ]);

    fireEvent.click(chip("Độ tuổi"));

    expect(chip("Độ tuổi")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Phân khúc NAV")).toHaveAttribute("aria-pressed", "false");
    // Số MỚI, đếm thật trên cùng 62 khách đó: 19+6+14+9+14 = 62. Đây là chỗ bug "nhãn mới, số cũ" lộ ra.
    expect(rowSegTitles(0)).toEqual([
      "25-34: 19",
      "50+: 6",
      "18-24: 14",
      "35-49: 9",
      "Không xác định: 14",
    ]);
    // Legend phải giải mã thang màu ĐANG vẽ — bậc NAV không được còn sót lại.
    const legend = screen.getByTestId("chart-legend");
    expect(legend).toHaveTextContent("25-34");
    expect(legend).not.toHaveTextContent("200tr-1tỷ");
  });

  it("q19: bấm 'Không chia' → hết đoạn màu, thanh về một khối liền", () => {
    render(<QuantifyWidget item={findItem("q19")} data={demoData} dims={dims} />);
    expect(rowSegTitles(0)).toHaveLength(5);
    fireEvent.click(chip("Không chia"));
    expect(chip("Không chia")).toHaveAttribute("aria-pressed", "true");
    expect(rowSegTitles(0)).toHaveLength(0);
  });

  it("q17 (chưa có split trong fixture) → bật được chia màu tại chỗ, không cần sửa fixture", () => {
    render(<QuantifyWidget item={findItem("q17")} data={demoData} dims={dims} />);
    expect(rowSegTitles(0)).toHaveLength(0);
    fireEvent.click(chip("Thâm niên giao dịch"));
    /* Hàng 0 vẫn là 'tự tìm' (62 khách). Ghim TỔNG chứ không ghim từng đoạn: điều phải đúng ở đây là
       các đoạn cộng lại đúng bằng số trên thanh — nếu lệch thì mẫu số đã âm thầm rơi mất một nhóm
       (đúng lỗi D0), và đó là bất biến quan trọng hơn thứ tự các bậc thâm niên. */
    const titles = rowSegTitles(0);
    expect(titles.length).toBeGreaterThan(1);
    expect(titles.reduce((a, t) => a + Number(t.split(": ")[1]), 0)).toBe(62);
  });
});

describe("QuantifyWidget — toggle chiều chia màu: nơi không vẽ được đoạn màu", () => {
  it("view bảng → strip vẫn hiện nhưng khoá cả cụm, nói rõ vì sao (không âm thầm biến mất)", () => {
    render(<QuantifyWidget item={findItem("q19")} data={demoData} dims={dims} view="table" />);
    const group = screen.getByRole("group", { name: "Chiều chia màu trong thanh" });
    for (const b of [...group.children]) {
      expect(b).toHaveAttribute("aria-disabled", "true");
      expect(b.getAttribute("title")).toContain("View bảng");
    }
    // Trạng thái ĐANG hiện vẫn đọc được dù khoá — biết mình đang ở chiều nào là thông tin, không phải nút.
    expect(chip("Phân khúc NAV")).toHaveAttribute("aria-pressed", "true");
  });

  it("trục KHÔNG phải thuộc tính khách (q1, theme) → không có strip nào: chia màu vô nghĩa ở đó", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    expect(screen.queryByTestId("split-toggle")).not.toBeInTheDocument();
  });
});
