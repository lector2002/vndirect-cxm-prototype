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

/* q19 (Kênh mở TK × Phân khúc NAV) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — tự dựng item tại
   đây (đúng hình dạng q19 cũ) thay vì đọc từ seed, giữ nguyên MỌI phép khẳng định số liệu. */
const q19: QuantifyItem = {
  id: "q19", kind: "show", show: "acq", split: "nav", metric: "count", chart: "rank",
  name: "Kênh mở TK × Phân khúc NAV",
};

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
    /* Owner chốt DISABLE chứ không ẩn: ẩn thì strip đổi bề rộng theo từng chart.
       05/08 — 5 chip thành 6: thanh giờ lọc theo cờ khai `Dim.slice` chứ không theo `base==='cust'`,
       nên "Nền tảng" (base:'ev', thuộc tính của dòng bằng chứng) vào đủ. Năm cách cắt owner đã chốt
       + chip "Không chia" = 6, kể cả chip bị khoá. Chính con số này là thứ owner đếm trên màn khi hỏi
       "sao chỉ hiển thị có 4 slice/5" — nên GHIM nó, đừng nới thành `toBeGreaterThan`. */
    expect(screen.getByRole("group", { name: "Chiều chia màu trong thanh" }).children).toHaveLength(6);
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
    render(<QuantifyWidget item={q19} data={demoData} dims={dims} />);
    expect(chip("Phân khúc NAV")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Kênh mở TK")).toHaveAttribute("aria-disabled", "true");
    expect(chip("Phân khúc NAV")).not.toHaveAttribute("aria-disabled");
  });
});

describe("QuantifyWidget — toggle chiều chia màu: lựa chọn tới được ENGINE, không chỉ tới legend", () => {
  it("q19: đổi NAV → Độ tuổi thì CẢ nhãn legend LẪN số từng đoạn của hàng 'tự tìm' (62 khách) đổi theo", () => {
    render(<QuantifyWidget item={q19} data={demoData} dims={dims} />);
    expect(screen.getByTestId("bars").children[0]).toHaveTextContent("tự tìm");
    /* Trạng thái đầu = split 'nav' của fixture: 48+6+3+3+2 = 62. KHÔNG có đoạn "Không xác định" — owner
       chốt 04/08 NAV lấy trực tiếp từ tài sản hiện tại, khách chưa nạp tiền là 0đ nên nằm ở '<50tr'
       (chính vì vậy đoạn '<50tr' chiếm gần hết thanh). */
    expect(rowSegTitles(0)).toEqual([
      "<50tr: 48",
      "50-200tr: 6",
      "200tr-1tỷ: 3",
      "1-5tỷ: 3",
      "5tỷ+: 2",
    ]);

    fireEvent.click(chip("Độ tuổi"));

    expect(chip("Độ tuổi")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Phân khúc NAV")).toHaveAttribute("aria-pressed", "false");
    /* Số MỚI, đếm thật trên cùng 62 khách đó: 14+19+9+6+14 = 62. Đây là chỗ bug "nhãn mới, số cũ" lộ ra.
       THỨ TỰ đổi (05/08), số KHÔNG đổi: trước đây các đoạn xếp theo số lượng (25-34 · 50+ · 18-24 ·
       35-49), nay xếp theo DẢI vì "Độ tuổi" khai `cut.kind:'band'` — dải có thứ tự thật thì thứ tự đọc
       phải là thứ tự dải, xem domain/splitOrder.ts. Giữ nguyên phép khẳng định trên cả 5 con số. */
    expect(rowSegTitles(0)).toEqual([
      "18-24: 14",
      "25-34: 19",
      "35-49: 9",
      "50+: 6",
      "Không xác định: 14",
    ]);
    // Legend phải giải mã thang màu ĐANG vẽ — bậc NAV không được còn sót lại.
    const legend = screen.getByTestId("chart-legend");
    expect(legend).toHaveTextContent("25-34");
    expect(legend).not.toHaveTextContent("200tr-1tỷ");
  });

  it("q19: bấm 'Không chia' → hết đoạn màu, thanh về một khối liền", () => {
    render(<QuantifyWidget item={q19} data={demoData} dims={dims} />);
    expect(rowSegTitles(0)).toHaveLength(5);
    fireEvent.click(chip("Không chia"));
    expect(chip("Không chia")).toHaveAttribute("aria-pressed", "true");
    expect(rowSegTitles(0)).toHaveLength(0);
  });

  it("q17 (chưa có split trong fixture) → bật được chia màu tại chỗ, không cần sửa fixture", () => {
    render(<QuantifyWidget item={findItem("q17")} data={demoData} dims={dims} />);
    expect(rowSegTitles(0)).toHaveLength(0);
    // S2 (04/08): "Thâm niên giao dịch" đã rút khỏi dims — đổi sang "Value tier", vẫn là chiều khách còn lại.
    fireEvent.click(chip("Value tier"));
    /* Hàng 0 vẫn là 'tự tìm' (62 khách). Ghim TỔNG chứ không ghim từng đoạn: điều phải đúng ở đây là
       các đoạn cộng lại đúng bằng số trên thanh — nếu lệch thì mẫu số đã âm thầm rơi mất một nhóm
       (đúng lỗi D0), và đó là bất biến quan trọng hơn thứ tự các bậc tier. */
    const titles = rowSegTitles(0);
    expect(titles.length).toBeGreaterThan(1);
    expect(titles.reduce((a, t) => a + Number(t.split(": ")[1]), 0)).toBe(62);
  });
});

describe("QuantifyWidget — toggle chiều chia màu: nơi không vẽ được đoạn màu", () => {
  it("view bảng → strip vẫn hiện nhưng khoá cả cụm, nói rõ vì sao (không âm thầm biến mất)", () => {
    render(<QuantifyWidget item={q19} data={demoData} dims={dims} view="table" />);
    const group = screen.getByRole("group", { name: "Chiều chia màu trong thanh" });
    for (const b of [...group.children]) {
      expect(b).toHaveAttribute("aria-disabled", "true");
      expect(b.getAttribute("title")).toContain("View bảng");
    }
    // Trạng thái ĐANG hiện vẫn đọc được dù khoá — biết mình đang ở chiều nào là thông tin, không phải nút.
    expect(chip("Phân khúc NAV")).toHaveAttribute("aria-pressed", "true");
  });

  /* 05/08 — ĐẢO kỳ vọng cũ, có chủ ý. Test này trước đây canh "trục theme → KHÔNG có strip nào".
     Owner chốt ngược: cột nào không có thì NÓI THẲNG là không có, không giấu. Ẩn strip khiến người
     xem không phân biệt được "lỗi" với "giới hạn cố ý" — đúng lý do owner phải đi hỏi. Ý định gốc
     (chia màu KHÔNG được phép vẽ trên trục này) giữ nguyên và mạnh hơn: giờ khẳng định cả việc mọi
     chip đều khoá LẪN việc lý do phải đọc được bằng mắt. */
  it("trục tổng hợp (q1, theme) → strip HIỆN nhưng khoá, và lý do nói đúng: số tổng hợp sẵn", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    expect(screen.getByTestId("split-toggle")).toBeInTheDocument();

    const group = screen.getByRole("group", { name: "Chiều chia màu trong thanh" });
    for (const b of [...group.children]) {
      expect(b).toHaveAttribute("aria-disabled", "true");
    }
    /* Lý do phải hiện thành CHỮ, không chỉ tooltip — tooltip thì phải rê chuột mới thấy, mà luật
       owner là "nói thẳng". Và phải là lý do THẬT (số tổng hợp sẵn), không phải "thiếu khoá khách":
       `Evidence.ck` luôn có, chẩn đoán đó đã được đo là sai ngày 05/08. */
    const note = screen.getByTestId("split-note");
    expect(note).toHaveTextContent(/TỔNG HỢP SẴN/);
    expect(note).toHaveTextContent(/không đếm từ bằng chứng/);
    expect(note).not.toHaveTextContent(/khoá khách/);
  });

  /* Chiều cắt thứ NĂM (owner hỏi 05/08: "chỉ hiển thị có 4 slice/5, thiếu mất Nền tảng"). Khác bốn
     chiều kia ở chỗ đọc — nền tảng nằm sẵn trên dòng bằng chứng, không tra hồ sơ khách — nên nó cắt
     được ở chart trục bằng chứng và KHÔNG cắt được ở chart trục khách. Hai test dưới ghim cả hai vế:
     mở đúng chỗ mở được, khoá đúng chỗ không, và khoá thì phải nói ra vì sao. */
  it("q3 (Category, trục bằng chứng) chia màu theo Nền tảng → đếm thật, nhãn là tên đẹp", () => {
    render(<QuantifyWidget item={findItem("q3")} data={demoData} dims={dims} />);
    const pfChip = chip("Nền tảng");
    expect(pfChip).not.toHaveAttribute("aria-disabled");

    fireEvent.click(pfChip);
    expect(pfChip).toHaveAttribute("aria-pressed", "true");

    /* Nhãn phải là "Android" chứ không phải khoá thô "android" — cùng bảng tên đẹp mà hàng của chart
       Nền tảng đang dùng, nếu không thì hai chỗ trong cùng một màn viết khác nhau. */
    const titles = rowSegTitles(0);
    expect(titles.some((t) => t.startsWith("Android: "))).toBe(true);
    expect(titles.some((t) => t.startsWith("android: "))).toBe(false);
    /* KHÔNG có khối "Chưa xếp được nhóm": chiều này đọc thẳng trên dòng bằng chứng nên không có ẩn
       danh, không có nối hỏng, không có sentinel — mọi dòng đều xếp được. Đây là điểm khác biệt thật
       so với chia theo chiều khách, không phải chi tiết vặt. */
    expect(titles.some((t) => t.startsWith("Chưa xếp được nhóm"))).toBe(false);
  });

  it("q18 (trục KHÁCH) chia màu theo Nền tảng → khoá, lý do nói đúng vì sao chứ không nói chung chung", () => {
    render(<QuantifyWidget item={findItem("q18")} data={demoData} dims={dims} />);
    const pfChip = chip("Nền tảng");
    expect(pfChip).toHaveAttribute("aria-disabled", "true");
    // Lý do phải nói ra điều THẬT: một khách không thuộc một nền tảng.
    expect(pfChip.getAttribute("title")).toMatch(/một khách dùng nhiều nền tảng/);
  });

  /* Trục BẰNG CHỨNG: chart mới mở 05/08. Khác trục tổng hợp ở chỗ nó chia màu ĐƯỢC — mỗi thanh đếm
     dòng bằng chứng, mà mỗi dòng mang sẵn khoá khách. Khẳng định ở đây là mức màn: bấm một chiều thì
     thanh THẬT SỰ có nhiều đoạn. Phép kiểm số nằm ở domain (quantify.test.ts: Σ đoạn = v). */
  it("trục bằng chứng (q13, nền tảng) → chọn được chiều chia màu, thanh chia thành nhiều đoạn", () => {
    render(<QuantifyWidget item={findItem("q13")} data={demoData} dims={dims} />);
    const navChip = chip("Phân khúc NAV");
    expect(navChip).not.toHaveAttribute("aria-disabled");

    fireEvent.click(navChip);
    expect(navChip).toHaveAttribute("aria-pressed", "true");
    expect(rowSegTitles(0).length).toBeGreaterThan(1);
  });

  /* Bằng chứng thật cho test này: owner nhìn màn rồi HỎI "tại sao chart khách theo phân khúc NAV
     không bấm được vào chia theo nền tảng?" — lý do đã có sẵn, đúng chữ, trên `title` của chính chip
     đó, mà vẫn phải hỏi. Tooltip chỉ tới được người đã đoán ra là nên rê chuột; ai BẤM (phản xạ tự
     nhiên khi nút không phản hồi), ai dùng bàn phím, ai dùng cảm ứng thì không bao giờ thấy. */
  it("bấm chip đang khoá → lý do hiện thành CHỮ dưới chart, không chỉ nằm trong tooltip", () => {
    render(<QuantifyWidget item={findItem("q18")} data={demoData} dims={dims} />);
    expect(screen.queryByTestId("split-note")).not.toBeInTheDocument();

    fireEvent.click(chip("Nền tảng"));
    expect(screen.getByTestId("split-note")).toHaveTextContent(/một khách dùng nhiều nền tảng/);
    // Bấm chip khoá KHÔNG được đổi chiều chia màu — nó chỉ trả lời.
    expect(chip("Nền tảng")).toHaveAttribute("aria-pressed", "false");

    // Đổi sang một chiều bấm được ⇒ câu hỏi đã hết, câu trả lời cũ phải biến mất cùng nó.
    fireEvent.click(chip("Độ tuổi"));
    expect(screen.queryByTestId("split-note")).not.toBeInTheDocument();
  });
});
