import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, dims, seed } from "../data/fixtures/seed.ts";
import { projectCustomer } from "../data/projectBands.ts";
import type { Cfg, CxmData, Dim, QuantifyShow } from "../data/schema/index.ts";
import { MISSING } from "../data/segment.ts";
import { QuantifyWidget } from "./QuantifyWidget.tsx";

/* S2.C3b: trục base:'cust' (age/nav/tenure/acq/seg/tier) phải đi qua qRunSegment, KHÔNG qRun —
   oracle đếm tay trên seed.cust thật (7 khách, xem domain/quantify.test.ts): tenure = 'chưa-biết' x4,
   '<6 tháng' x2, '>5 năm' x1 → known=3 unknown=4 missing=0.

   Ba test dưới ĐỔI TỪ nav SANG tenure (04/08): owner chốt NAV lấy trực tiếp từ giá trị tài sản hiện
   tại nên trục nav KHÔNG còn sentinel nào — dùng nó thì không chạm được nhánh "gộp Không xác định"
   đang cần test. tenure vẫn là trục có 'chưa-biết' thật (chưa mở xong TK thì chưa có thâm niên).

   `tenure` đã rút khỏi `dims` (S2, 04/08) — dựng DIM + CFG TEST-LOCAL, chiếu qua đúng đường sản phẩm
   (`projectCustomer`, cùng đường domain/quantify.test.ts và data/projectBands.test.ts:32 dùng) —
   KHÔNG phục hồi `dims.tenure` ở sản phẩm thật. */
const TENURE_TEST_ID = "ttenure";
const testDims: Record<string, Dim> = {
  ...dims,
  [TENURE_TEST_ID]: { label: "Thâm niên giao dịch (test)", unit: "nhóm thâm niên", base: "cust", cut: { kind: "band", source: "tenureMonths" } },
};
const testCfg: Cfg = {
  ...cfgDefault,
  segment: { ...cfgDefault.segment, band: { ...cfgDefault.segment.band, [TENURE_TEST_ID]: { min: null, cuts: [6, 24, 60], unit: "tháng" } } },
};
const seedWithTenure: CxmData = { ...seed, cust: seed.cust.map((c) => projectCustomer(c, testCfg, testDims)) };

describe("QuantifyWidget — trục base:'cust' đi qua qRunSegment (S2.C3b)", () => {
  const tenureItem: QuantifyShow = {
    id: "test-seg-tenure",
    kind: "show",
    show: TENURE_TEST_ID,
    metric: "count",
    chart: "rank",
    name: "test tenure",
  };

  it("seg.kind='draw' (tenure, known=3/7) → gộp 'chưa-biết'+'thiếu' thành MỘT bar 'Không xác định' NGAY TRONG chart", () => {
    render(<QuantifyWidget item={tenureItem} data={seedWithTenure} dims={testDims} />);
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
      ...seedWithTenure,
      cust: seedWithTenure.cust.map((c, i) => (i < 2 ? { ...c, bands: { ...c.bands, [TENURE_TEST_ID]: MISSING } } : c)),
    };
    render(<QuantifyWidget item={tenureItem} data={missData} dims={testDims} />);
    const bars = screen.getByTestId("bars");
    // Bar gộp "Không xác định" = unknown+missing = 2+2 = 4, vẫn MỘT bar duy nhất.
    expect(bars.children).toHaveLength(3);
    expect(
      screen.getByText('Phủ 42,9% (3/7 khách có dữ liệu). Nhóm "Không xác định" gồm 2 chưa biết và 2 thiếu (lỗi thu thập).'),
    ).toBeInTheDocument();
  });

  it("seg.kind='refuse' (known=0 sau khi loại bỏ khách có tenure thật) → render panel lý do, KHÔNG chart", () => {
    // Giữ đúng 4 khách 'chưa-biết' ⇒ known=0 (nhánh refuse của qRunSegment).
    const miniData: CxmData = { ...seedWithTenure, cust: seedWithTenure.cust.filter((c) => c.bands[TENURE_TEST_ID] === "chưa-biết") };
    render(<QuantifyWidget item={tenureItem} data={miniData} dims={testDims} />);
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
  /* q19 (Kênh mở TK × Phân khúc NAV) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — tự dựng item tại
     đây (đúng hình dạng q19 cũ) thay vì đọc từ seed, giữ nguyên MỌI phép khẳng định số liệu. */
  const q19: QuantifyShow = {
    id: "q19", kind: "show", show: "acq", split: "nav", metric: "count", chart: "rank",
    name: "Kênh mở TK × Phân khúc NAV",
  };

  it("q19 (acq × nav) → legend đúng 2 bậc của trục CHIA MÀU, không có split-note", () => {
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

  /* 05/08 — kỳ vọng ĐỔI CHỮ, có chủ ý. Test này trước canh câu *"phải là thuộc tính khách"*. Câu đó
     mã hoá một chẩn đoán nay đã SAI: "Nền tảng" cũng không phải thuộc tính khách mà vẫn cắt được, và
     còn chắc hơn (đọc thẳng trên dòng bằng chứng, không phải tra hồ sơ khách). Lý do thật của `theme`
     là nó CHƯA ĐƯỢC KHAI làm chiều để cắt. Ý định gốc giữ nguyên: chọn sai chiều thì phải NÓI RA lý
     do, không vẽ im lặng. */
  it("split trỏ vào chiều CHƯA KHAI là chiều cắt → hiện split-note nêu lý do, chart vẫn vẽ được", () => {
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
    expect(screen.getByTestId("split-note")).toHaveTextContent(/chưa khai là chiều để cắt/);
    // Lý do phải nêu ĐÍCH DANH chiều bị từ chối — "chiều nào đó sai" thì người đọc không sửa được gì.
    expect(screen.getByTestId("split-note")).toHaveTextContent(/theme/);
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
