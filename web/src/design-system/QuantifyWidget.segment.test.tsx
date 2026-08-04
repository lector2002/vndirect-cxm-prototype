import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { CxmData, QuantifyShow } from "../data/schema/index.ts";
import { MISSING } from "../data/segment.ts";
import { QuantifyWidget } from "./QuantifyWidget.tsx";

/* S2.C3b: trục base:'cust' (age/nav/tenure/acq/seg/tier) phải đi qua qRunSegment, KHÔNG qRun —
   oracle đếm tay trên seed.cust thật (7 khách, xem domain/quantify.test.ts): tenure = 'chưa-biết' x4,
   '<6 tháng' x2, '>5 năm' x1 → known=3 unknown=4 missing=0.

   Ba test dưới ĐỔI TỪ nav SANG tenure (04/08): owner chốt NAV lấy trực tiếp từ giá trị tài sản hiện
   tại nên trục nav KHÔNG còn sentinel nào — dùng nó thì không chạm được nhánh "gộp Không xác định"
   đang cần test. tenure vẫn là trục có 'chưa-biết' thật (chưa mở xong TK thì chưa có thâm niên). */
describe("QuantifyWidget — trục base:'cust' đi qua qRunSegment (S2.C3b)", () => {
  const tenureItem: QuantifyShow = {
    id: "test-seg-tenure",
    kind: "show",
    show: "tenure",
    metric: "count",
    chart: "rank",
    name: "test tenure",
  };

  it("seg.kind='draw' (tenure, known=3/7) → gộp 'chưa-biết'+'thiếu' thành MỘT bar 'Không xác định' NGAY TRONG chart", () => {
    render(<QuantifyWidget item={tenureItem} data={seed} dims={dims} />);
    const bars = screen.getByTestId("bars");
    // 3 hàng: 2 band đã biết ('<6 tháng' 2, '>5 năm' 1) + bar gộp "Không xác định" (unknown=4) ghim cuối.
    expect(bars.children).toHaveLength(3);
    expect(bars).toHaveTextContent("<6 tháng");
    expect(bars).toHaveTextContent("Không xác định");
    expect(bars).not.toHaveTextContent("chưa-biết");

    // Không còn dải coverage riêng — đã gộp vào chart.
    expect(screen.queryByTestId("seg-coverage")).not.toBeInTheDocument();

    // Màu: bar "Không xác định" luôn var(--unk); bar band thật (chart chưa có intent color) nhận
    // --cat-N xoay vòng — KHÔNG phải xám ink3, KHÔNG phải --unk.
    const rowDivs = bars.children;
    const knownBar = rowDivs[0]?.querySelector<HTMLDivElement>(".overflow-hidden > div");
    const unknownBar = rowDivs[2]?.querySelector<HTMLDivElement>(".overflow-hidden > div");
    expect(knownBar?.style.background).toMatch(/^var\(--cat-/);
    expect(unknownBar?.style.background).toBe("var(--unk)");

    // D2b tinh chỉnh #1: dòng mô tả coverage bằng CHỮ dưới chart — phân biệt lại "chưa biết" vs
    // "thiếu" mà bar gộp đã xoá mất. known=3, unknown=4, missing=0, total=7 → pv(3,7)="42,9".
    expect(screen.getByText(/Phủ 42,9% \(3\/7 khách có dữ liệu\)/)).toBeInTheDocument();
    expect(screen.getByText(/4 chưa biết/)).toBeInTheDocument();

    // D2b tinh chỉnh #3: known (2 hàng) không bị TOP_N (10) cắt → denomStrip KHÔNG render.
    expect(screen.queryByTestId("denom-strip")).not.toBeInTheDocument();
    expect(screen.queryByText(/Đang hiện Top/)).not.toBeInTheDocument();
  });

  it("seg.kind='draw' với missing>0 → dòng mô tả gọi tên RIÊNG 'thiếu', KHÔNG lẫn vào 'chưa biết'", () => {
    // Ép 2 khách 'chưa-biết' (index 0,1) thành MISSING ('thiếu') — known=3, unknown=2, missing=2,
    // total=7 (khác oracle gốc chỉ có unknown, chưa từng chạm nhánh 'thiếu' của buildSegDescription).
    const missData: CxmData = {
      ...seed,
      cust: seed.cust.map((c, i) => (i < 2 ? { ...c, bands: { ...c.bands, tenure: MISSING } } : c)),
    };
    render(<QuantifyWidget item={tenureItem} data={missData} dims={dims} />);
    const bars = screen.getByTestId("bars");
    // Bar gộp "Không xác định" = unknown+missing = 2+2 = 4, vẫn MỘT bar duy nhất.
    expect(bars.children).toHaveLength(3);
    expect(
      screen.getByText('Phủ 42,9% (3/7 khách có dữ liệu). Nhóm "Không xác định" gồm 2 chưa biết và 2 thiếu (lỗi thu thập).'),
    ).toBeInTheDocument();
  });

  it("seg.kind='refuse' (known=0 sau khi loại bỏ khách có tenure thật) → render panel lý do, KHÔNG chart", () => {
    // Giữ đúng 4 khách 'chưa-biết' ⇒ known=0 (nhánh refuse của qRunSegment).
    const miniData: CxmData = { ...seed, cust: seed.cust.filter((c) => c.bands.tenure === "chưa-biết") };
    render(<QuantifyWidget item={tenureItem} data={miniData} dims={dims} />);
    expect(screen.queryByTestId("bars")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vaxis-label")).not.toBeInTheDocument();
    expect(screen.queryByTestId("seg-coverage")).not.toBeInTheDocument();
    expect(screen.getByText(/chưa khách nào tới chỗ biết được giá trị này/)).toBeInTheDocument();
  });
});

/* Module D section 1 — wiring `qRunSplit` vào widget. Oracle đếm tay trên seed.cust (7 khách): acq biết
   đủ 7/7, nav = '<50tr' x6 + '1-5tỷ' x1 (KH•••9F1, khách chuyển từ CTCK khác) ⇒ thang màu có ĐÚNG 2
   bậc: '<50tr' và '1-5tỷ', KHÔNG có bậc 'Không xác định' (owner chốt 04/08: NAV lấy từ tài sản hiện
   tại nên luôn có dải). Điều dễ sai nhất ở tầng vẽ không phải con số mà là DÙNG SAI BẢNG LEGEND: có
   chia màu thì màu mã hoá NHÓM CHIA, không phải intent — chú giải cho một thang khác thang đang hiện
   là loại lỗi không test nào khác trong repo bắt được. */
describe("QuantifyWidget — chia màu (split) dùng legend của thang màu ĐANG vẽ", () => {
  const q19 = seed.qt.find((x) => x.id === "q19");

  it("q19 (acq × nav) → legend đúng 2 bậc của trục CHIA MÀU, không có split-note", () => {
    if (!q19) throw new Error("fixture q19 (show='acq', split='nav') phải tồn tại trong seed");
    render(<QuantifyWidget item={q19} data={seed} dims={dims} />);
    const legend = screen.getByTestId("chart-legend");
    expect(legend).toHaveTextContent("1-5tỷ");
    expect(legend).toHaveTextContent("<50tr");
    // Trục nav không còn sentinel ⇒ legend KHÔNG được có bậc "Không xác định" nào.
    expect(legend).not.toHaveTextContent("Không xác định");
    // Đúng 2 bậc: seed chỉ có 2 dải nav nên không thể có bậc thứ ba (kể cả "Khác").
    expect(legend.children).toHaveLength(2);
    expect(legend).not.toHaveTextContent("Khác");
    expect(screen.queryByTestId("split-note")).not.toBeInTheDocument();
  });

  it("split trỏ vào trục KHÔNG phải base:'cust' → hiện split-note nêu lý do, chart vẫn vẽ được", () => {
    // Dựng tay: validate rule 16 chặn tổ hợp này nên nó KHÔNG có (và không được có) trong seed —
    // cùng lối đã dùng cho guard `unsupported` của CrossTable.
    const bad: QuantifyShow = {
      id: "test-split-bad",
      kind: "show",
      show: "acq",
      split: "theme",
      metric: "count",
      chart: "rank",
      name: "test split sai trục",
    };
    render(<QuantifyWidget item={bad} data={seed} dims={dims} />);
    expect(screen.getByTestId("bars")).toBeInTheDocument();
    expect(screen.getByTestId("split-note")).toHaveTextContent(/thuộc tính khách/);
  });
});

describe("QuantifyWidget — trục KHÔNG phải cust vẫn dùng qRun như cũ (chống regression S2.C3b)", () => {
  it("q1 (show='theme', base='agg') → vẫn render Bars bình thường, KHÔNG có seg-coverage", () => {
    const themeItem = seed.qt.find((x) => x.id === "q1");
    if (!themeItem) throw new Error("fixture q1 không tồn tại");
    render(<QuantifyWidget item={themeItem} data={seed} dims={dims} />);
    expect(screen.getByTestId("bars")).toBeInTheDocument();
    expect(screen.queryByTestId("seg-coverage")).not.toBeInTheDocument();
  });
});
