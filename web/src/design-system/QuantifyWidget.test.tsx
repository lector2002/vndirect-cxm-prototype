import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, dims, seed } from "../data/fixtures/seed.ts";
import type { QuantifyItem, QuantifyShow } from "../data/schema/index.ts";
import { fx } from "../domain/format.ts";
import { scopeSources, scopeTotal } from "../domain/scope.ts";
import { nf } from "./format.ts";
import { QuantifyWidget } from "./QuantifyWidget.tsx";

function findItem(id: string): QuantifyItem {
  const q = seed.qt.find((x) => x.id === id);
  if (!q) throw new Error(`fixture ${id} không tồn tại`);
  return q;
}

/* q16 (Theme × Nền tảng) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — tự dựng item tại đây (đúng
   hình dạng q16 cũ) thay vì đọc từ seed, giữ nguyên MỌI phép khẳng định hành vi. */
const q16: QuantifyItem = {
  id: "q16", kind: "show", show: "theme", by: "pf", metric: "count", view: "table", chart: "rank",
  name: "Theme × Nền tảng (ghép chéo)",
};

describe("QuantifyWidget — show item (không by)", () => {
  it("view='chart' (mặc định, chart='rank') → render Bars", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    expect(screen.getByTestId("bars")).toBeInTheDocument();
  });

  it("view='table' → render DataTable", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} view="table" />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
  });

  /* Đuôi Top-N của trục HÀNG giờ được GỘP thành "Khác (+N)" thay vì biến mất (03/08, sau khảo sát
     nền tảng: Looker Studio bật "Group the rest as Others" mặc định, và Donut.tsx trong nhà đã gộp từ
     D6a — thanh không gộp là cùng một câu hỏi cho hai bức tranh khác nhau). Test cũ assert 10/5 —
     SỬA thành 11/6, đúng cùng lối test donut đã sửa 14 → 6 ở dưới. */
  it("mặc định (không limit): q1 (theme, 14 rows) → 10 thanh có tên + 1 thanh 'Khác (+4)' ghim cuối", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    const bars = screen.getByTestId("bars");
    expect(bars.children).toHaveLength(11);
    // Ghim CUỐI và nói rõ gộp mấy nhóm — "Khác" trần không cho biết nó che 4 nhóm hay 40.
    expect(bars.children[10]).toHaveTextContent("Khác (+4)");
    // Kỳ tuyệt đối vẫn hiện (chuyển từ denom sang subtitle dưới tiêu đề — part 2 anatomy không mất).
    expect(screen.getByText(/6 tháng gần nhất \(28\/01\/2026 – 27\/07\/2026\)/)).toBeInTheDocument();
  });

  it("limit điều khiển số thanh: limit=5 → 5 + 'Khác (+9)'; limit=total (14) → 14, KHÔNG có thanh gộp", () => {
    const { rerender } = render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} limit={5} />);
    expect(screen.getByTestId("bars").children).toHaveLength(6);
    expect(screen.getByTestId("bars").children[5]).toHaveTextContent("Khác (+9)");
    rerender(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} limit={14} />);
    // Không cắt gì ⇒ KHÔNG thêm thanh gộp: "Khác (+0)" là hàng rỗng nghĩa, không phải cho đủ bộ.
    expect(screen.getByTestId("bars").children).toHaveLength(14);
    expect(screen.queryByText(/^Khác \(\+/)).not.toBeInTheDocument();
  });

  /* D6a (owner chốt 02/08): donut vẫn CHẠY trên toàn bộ 14 rows (không cắt Top 10 như rank/bảng —
     đó là việc của `limit`), nhưng tầng HIỂN THỊ (Donut.tsx) giờ tự gộp quá 5 lát thành "Khác (+N)"
     vì hệ màu phân loại chỉ có 5 màu (14 lát ép phải lặp màu, hai lát cùng màu là đọc sai). Test cũ
     assert 14 con — SỬA thành 6 (5 lát lớn nhất + 1 lát "Khác (+9)"), lý do trên. */
  it("donut: qua toàn bộ 14 rows nhưng Donut.tsx gộp còn 6 mục (5 lớn nhất + 'Khác (+9)')", () => {
    const donutItem: QuantifyShow = {
      id: "test-donut",
      kind: "show",
      show: "theme",
      metric: "pct",
      chart: "donut",
      name: "test donut",
    };
    render(<QuantifyWidget item={donutItem} data={seed} dims={dims} />);
    const legend = screen.getByTestId("donut-legend");
    expect(legend.children).toHaveLength(6);
    expect(legend.children[5]).toHaveTextContent("Khác (+9)");
  });

  /* S2.6a (spec 2026-08-01-card-enterpret-spec.md, R2+R3): axisLabel() gộp cũ bị TÁCH LÀM HAI —
     đơn vị đo (VAxisLabel) và mẫu số (Card.denomStrip, testid denom-strip). Cụm "từ N nguồn" là
     provenance owner chốt ở Q4 nên PHẢI còn: Opus đã khôi phục vào denomStrip sau khi S2.6a làm rớt.
     Dải denom đếm bằng `dim.unit` ("theme"), KHÔNG phải `dim.label` ("Theme · vì sao"). */
  /* D1a (owner chốt 02/08, sửa lỗi S2.6a): q1 là BAR ngang (chart='rank') — trục dọc phải mã hoá
     TÊN CHIỀU (dim.label) chứ không phải đơn vị đo; đơn vị đo dời xuống nhãn đáy. Test cũ assert
     vaxis-label="Số tín hiệu khách hàng" là chính assertion mà S2.6a làm SAI (đã lẫn đơn vị đo vào
     trục dọc) — SỬA thành dim.label, thêm assertion nhãn đáy mang đơn vị đo. */
  it("D1a: q1 (bar, base='agg') → VAxisLabel = dim.label 'Theme · vì sao'; nhãn đáy = đơn vị đo 'Số tín hiệu khách hàng'", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    expect(screen.getByTestId("vaxis-label")).toHaveTextContent("Theme · vì sao");
    expect(screen.getByTestId("vaxis-bottom-label")).toHaveTextContent("Số tín hiệu khách hàng");
  });

  it("denom-strip: base='agg' (q1/theme) → đếm bằng dim.unit + mẫu số + provenance 'từ N nguồn'", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    const strip = screen.getByTestId("denom-strip");
    expect(strip).toHaveTextContent("Đang hiện Top 10 trên 14 theme");
    expect(strip).toHaveTextContent(`trên tổng ${nf(fx(scopeTotal(seed)))} tín hiệu từ ${scopeSources(seed).length} nguồn`);
    // dim.label ("Theme · vì sao") là nhãn TRỤC, không được lọt vào câu đếm của dải denom.
    expect(strip).not.toHaveTextContent("vì sao");
  });

  /* D1a: q3 CŨNG là bar ngang (chart='rank', base='ev') — cùng quy tắc như q1: trục dọc mã hoá
     dim.label, đơn vị đo dời xuống nhãn đáy. Test cũ assert vaxis-label="Số bằng chứng mẫu" — SỬA
     tương tự q1, lý do như trên. */
  it("D1a: q3 (bar, base='ev') → VAxisLabel = dim.label 'Category · intent'; nhãn đáy = 'Số bằng chứng mẫu'", () => {
    render(<QuantifyWidget item={findItem("q3")} data={seed} dims={dims} />);
    expect(screen.getByTestId("vaxis-label")).toHaveTextContent("Category · intent");
    expect(screen.getByTestId("vaxis-bottom-label")).toHaveTextContent("Số bằng chứng mẫu");
  });

  /* D0a (defect số sai, ưu tiên cao nhất): fx() (baseline 6 tháng, x5,6) KHÔNG hợp lệ cho base='ev'
     — q3 có seed.ev.length=17, phân bố 9/3/3/2 theo category (complaint/help/improvement/praise).
     Trước đây Bars nhân fx() vô điều kiện nên hiện 50/17/17/11 — sai, người dùng bấm vào đếm được
     đúng 9. */
  it("D0a: q3 (base='ev') qua Bars hiện ĐÚNG số thô 9/3/3/2 — KHÔNG phải 50/17/17/11 (fx() sai)", () => {
    render(<QuantifyWidget item={findItem("q3")} data={seed} dims={dims} />);
    const bars = screen.getByTestId("bars");
    expect(bars).toHaveTextContent("9");
    expect(bars).toHaveTextContent("3");
    expect(bars).toHaveTextContent("2");
    expect(bars).not.toHaveTextContent("50");
    expect(bars).not.toHaveTextContent("17");
    expect(bars).not.toHaveTextContent("11");
  });

  /* D0a: q1 (base='agg') PHẢI vẫn scale — chống sửa quá tay (vd tắt fx() luôn cho mọi base). 5 hàng
     đầu (theo n thô 412/368/295/210/186, xem seed.ts) qua fx() (x5,6) + nfK() ra đúng các giá trị
     biên nêu trong charter. */
  it("D0a: q1 (base='agg') VẪN áp fx() — 5 hàng đầu hiện 2,3K/2,1K/1,7K/1,2K/1K", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    const bars = screen.getByTestId("bars");
    for (const label of ["2,3K", "2,1K", "1,7K", "1,2K", "1K"]) {
      expect(bars).toHaveTextContent(label);
    }
  });

  it("denom-strip: base='ev' (q3/cat) → BẤT BIẾN vẫn nói rõ đây là TẬP MẪU bằng chứng, kèm SỐ THẬT (D0a)", () => {
    render(<QuantifyWidget item={findItem("q3")} data={seed} dims={dims} />);
    const strip = screen.getByTestId("denom-strip");
    /* D0a: câu cũ "tập mẫu bằng chứng, không phải toàn bộ bản ghi" đổi thứ tự chữ để chèn SỐ THẬT
       (owner chốt 02/08) — giờ là "<N> bằng chứng mẫu, không phải toàn bộ bản ghi". Caveat "không
       phải toàn bộ bản ghi" (bất biến gốc) vẫn còn nguyên; N=17 = seed.ev.length (9+3+3+2). */
    expect(strip).toHaveTextContent("17 bằng chứng mẫu, không phải toàn bộ bản ghi");
  });

  /* D1a: bar + metric==='pct' GIỮ NHÁNH CŨ (không đủ căn cứ đổi — % trên tổng không mã hoá theo
     dim.base) — VAxisLabel vẫn "% trên tổng", KHÔNG có nhãn đáy. */
  it("D1a: bar + metric='pct' (item tự dựng) → VAxisLabel giữ nhánh cũ '% trên tổng', không có nhãn đáy", () => {
    const pctBarItem: QuantifyShow = {
      id: "test-pct-bar",
      kind: "show",
      show: "theme",
      metric: "pct",
      chart: "rank",
      name: "test pct bar",
    };
    render(<QuantifyWidget item={pctBarItem} data={seed} dims={dims} />);
    expect(screen.getByTestId("vaxis-label")).toHaveTextContent("% trên tổng");
    expect(screen.queryByTestId("vaxis-bottom-label")).not.toBeInTheDocument();
  });

  it("Donut center vẫn số ĐẦY ĐỦ (nf), KHÔNG có hậu tố K dù rows sau fx() có thể >=1000", () => {
    const donutItem: QuantifyShow = {
      id: "test-donut-2",
      kind: "show",
      show: "theme",
      metric: "pct",
      chart: "donut",
      name: "test donut 2",
    };
    render(<QuantifyWidget item={donutItem} data={seed} dims={dims} />);
    // Donut.tsx (component không sửa trong section này) không có testid riêng cho số tâm — lấy
    // qua class .text-xl (đúng class hiện có trên phần tử số tâm, xem Donut.tsx dòng 35).
    const center = screen.getByTestId("donut").querySelector(".text-xl");
    expect(center?.textContent).not.toMatch(/K$/);
  });

  it("DataTable (view='table') vẫn số ĐẦY ĐỦ (nf), KHÔNG hậu tố K", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} view="table" />);
    const table = screen.getByTestId("data-table");
    expect(table.textContent).not.toMatch(/\d+,\d+K/);
  });

  /* S2.10 (owner chốt 02/08): cửa sổ tối thiểu i>=3 khiến chuỗi ≤3 điểm KHÔNG có điểm nào chấm
     được. Nếu vẫn in "vòng tròn = vượt ngưỡng Z-score" thì card đang mô tả một thứ mà cấu trúc
     không cho phép xuất hiện, và người xem sẽ hiểu thành "kỳ này không có bất thường". */
  it("anomaly + months=3 → chú thích nói CHƯA ĐỦ KỲ, không nói 'vòng tròn = vượt ngưỡng'", () => {
    render(<QuantifyWidget item={findItem("q15")} data={seed} dims={dims} cfg={cfgDefault} months={3} />);
    expect(screen.getByText(/chưa đủ kỳ để chấm bất thường \(cần ít nhất 4 kỳ, đang có 3\)/)).toBeInTheDocument();
    expect(screen.queryByText("vòng tròn = vượt ngưỡng Z-score")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("anomaly-ring")).toHaveLength(0);
  });

  it("anomaly đủ kỳ (months=12) → giữ chú thích 'vòng tròn = vượt ngưỡng' và có đúng 4 vòng", () => {
    render(<QuantifyWidget item={findItem("q15")} data={seed} dims={dims} cfg={cfgDefault} months={12} />);
    expect(screen.getByText("vòng tròn = vượt ngưỡng Z-score")).toBeInTheDocument();
    expect(screen.getAllByTestId("anomaly-ring")).toHaveLength(4);
  });

  /* Khoá màu intent (ChartLegend) dưới bar chart — chỉ có nghĩa khi màu THẬT SỰ gom nhóm nhiều hàng
     lại (số màu phân biệt < số hàng đang hiện) và mọi màu khớp data.cats. */
  it("khoá màu: q1 (Theme · vì sao, 14 hàng, top 10 hiện) → CÓ chart-legend với đúng 4 nhãn intent", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    const legend = screen.getByTestId("chart-legend");
    expect(legend.children).toHaveLength(4);
    for (const label of ["Khiếu nại", "Cần hỗ trợ", "Đề xuất cải thiện", "Khen ngợi"]) {
      expect(legend).toHaveTextContent(label);
    }
  });

  it("khoá màu: q3 (Category · intent, 4 hàng/4 màu — mỗi hàng 1 màu riêng) → KHÔNG có chart-legend", () => {
    render(<QuantifyWidget item={findItem("q3")} data={seed} dims={dims} />);
    expect(screen.queryByTestId("chart-legend")).not.toBeInTheDocument();
  });

  it("khoá màu: q12 (User Sentiment, màu ngoài thang data.cats) → KHÔNG có chart-legend", () => {
    render(<QuantifyWidget item={findItem("q12")} data={seed} dims={dims} />);
    expect(screen.queryByTestId("chart-legend")).not.toBeInTheDocument();
  });

  /* REGRESSION (Opus bắt live trên dist, không test nào phủ): chart mà MỌI hàng đều không có `c`
     từng lọt qua vì `items.length !== definedColors.length` thành `0 !== 0` = false, rồi rơi vào
     nhánh "chưa gán intent" → 6 chart xám mọc chú giải 1 mục. Đo thật: 7 legend thay vì 1. Neo cả 6
     id để guard `definedColors.length === 0` không bị gỡ lại. */
  it.each(["q2", "q4", "q9", "q10", "q11", "q13"])(
    "khoá màu: %s (mọi thanh xám, không hàng nào có màu) → KHÔNG có chart-legend",
    (id) => {
      render(<QuantifyWidget item={findItem(id)} data={seed} dims={dims} />);
      expect(screen.queryByTestId("chart-legend")).not.toBeInTheDocument();
    },
  );
});

/* S2.6b: footer bị bỏ khỏi QuantifyWidget — actions/onTitleClick forward xuống Card.actions/
   Card.onTitleClick, ở CẢ 3 nhánh render (series/cross-tab/show), để QuantifyLibrary/QuantifyDetail
   gắn Popover/Menu vào đúng vị trí. */
describe("QuantifyWidget — actions/onTitleClick forward xuống Card (S2.6b, thay cho footer cũ)", () => {
  it("nhánh show (không by): actions render ở góc phải header; onTitleClick làm tiêu đề bấm được", () => {
    const onTitleClick = vi.fn();
    render(
      <QuantifyWidget
        item={findItem("q1")}
        data={seed}
        dims={dims}
        actions={<button type="button">⋮</button>}
        onTitleClick={onTitleClick}
      />,
    );
    expect(screen.getByRole("button", { name: "⋮" })).toBeInTheDocument();
    const item = findItem("q1");
    fireEvent.click(screen.getByRole("button", { name: item.name }));
    expect(onTitleClick).toHaveBeenCalled();
  });

  it("nhánh series (không có by/show): actions/onTitleClick vẫn forward được", () => {
    const onTitleClick = vi.fn();
    render(
      <QuantifyWidget
        item={findItem("q5")}
        data={seed}
        dims={dims}
        actions={<button type="button">⋮</button>}
        onTitleClick={onTitleClick}
      />,
    );
    expect(screen.getByRole("button", { name: "⋮" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: findItem("q5").name }));
    expect(onTitleClick).toHaveBeenCalled();
  });

  it("nhánh cross-tab (item.by): actions/onTitleClick vẫn forward được", () => {
    const onTitleClick = vi.fn();
    render(
      <QuantifyWidget
        item={q16}
        data={seed}
        dims={dims}
        actions={<button type="button">⋮</button>}
        onTitleClick={onTitleClick}
      />,
    );
    expect(screen.getByRole("button", { name: "⋮" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: q16.name }));
    expect(onTitleClick).toHaveBeenCalled();
  });

  it("vắng actions/onTitleClick (mặc định) → không có ⋮, tiêu đề không phải nút", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    expect(screen.queryByRole("button", { name: "⋮" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: findItem("q1").name })).not.toBeInTheDocument();
  });
});

describe("QuantifyWidget — cross-tab (item.by)", () => {
  it("q16 (theme × pf) → render CrossTable, không crash", () => {
    render(<QuantifyWidget item={q16} data={seed} dims={dims} />);
    expect(screen.getByTestId("cross-table")).toBeInTheDocument();
  });
});

describe("QuantifyWidget — series item", () => {
  it("q5 (trend) → render LineChart", () => {
    render(<QuantifyWidget item={findItem("q5")} data={seed} dims={dims} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("q15 (anomaly), cfg={cfgDefault} → render AnomalyChart", () => {
    render(<QuantifyWidget item={findItem("q15")} data={seed} dims={dims} cfg={cfgDefault} />);
    expect(screen.getByTestId("anomaly-chart")).toBeInTheDocument();
  });

  /* D1a: series (line/anomaly) KHÔNG đổi — trục dọc vẫn mã hoá ĐƠN VỊ ĐO "Số tín hiệu khách hàng
     theo kỳ" (không phải dim.label, series không có `dim`/`show`), và KHÔNG có nhãn đáy (trục X là
     thời gian, tự hiển nhiên). */
  it("D1a: q15 (anomaly) → VAxisLabel = 'Số tín hiệu khách hàng theo kỳ', KHÔNG có nhãn đáy", () => {
    render(<QuantifyWidget item={findItem("q15")} data={seed} dims={dims} cfg={cfgDefault} />);
    expect(screen.getByTestId("vaxis-label")).toHaveTextContent("Số tín hiệu khách hàng theo kỳ");
    expect(screen.queryByTestId("vaxis-bottom-label")).not.toBeInTheDocument();
  });

  it("không truyền months (caller ngoài Overview) → giữ NGUYÊN hành vi cũ: đủ 12 điểm/dòng (S2.7), subtitle = kỳ baseline", () => {
    render(<QuantifyWidget item={findItem("q15")} data={seed} dims={dims} cfg={cfgDefault} />);
    const chart = screen.getByTestId("anomaly-chart");
    expect(chart.querySelectorAll("title")).toHaveLength(24); // 2 dòng × 12 điểm (S2.7: seed 6→12 điểm/chuỗi)
    expect(screen.getByText("6 tháng gần nhất (28/01/2026 – 27/07/2026)")).toBeInTheDocument();
  });

  it("months=3 → q15 (2 dòng × 12 điểm thật, S2.7) RÚT NGẮN còn 3 điểm/dòng, subtitle nói đúng số kỳ đang hiện", () => {
    render(<QuantifyWidget item={findItem("q15")} data={seed} dims={dims} cfg={cfgDefault} months={3} />);
    const chart = screen.getByTestId("anomaly-chart");
    expect(chart.querySelectorAll("title")).toHaveLength(6); // 2 dòng × 3 điểm
    expect(screen.getByText("3 kỳ gần nhất")).toBeInTheDocument();
  });

  it("months=24 nhưng chuỗi thật chỉ có 12 điểm (q5, S2.7) → KHÔNG nội suy, giữ nguyên 12 điểm", () => {
    render(<QuantifyWidget item={findItem("q5")} data={seed} dims={dims} months={24} />);
    const chart = screen.getByTestId("line-chart");
    // LineChart vẽ 1 <circle> mỗi điểm — q5 chỉ có 1 dòng × 12 điểm thật.
    expect(chart.querySelectorAll("circle")).toHaveLength(12);
    expect(screen.getByText("12 kỳ gần nhất")).toBeInTheDocument();
  });
});
