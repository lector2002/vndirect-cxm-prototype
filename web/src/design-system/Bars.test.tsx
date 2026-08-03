import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DimRow } from "../data/schema/index.ts";
import { Bars } from "./Bars.tsx";

const rows: DimRow[] = [
  { id: "a", l: "Alpha", v: 100 },
  { id: "b", l: "Beta", v: 50 },
  { id: "c", l: "Gamma", v: 10 },
];

describe("Bars", () => {
  it("render data-testid=bars, đủ số hàng, có nhãn", () => {
    render(<Bars rows={rows} />);
    const container = screen.getByTestId("bars");
    expect(container).toBeInTheDocument();
    expect(container.children).toHaveLength(rows.length);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("số hiển thị đã qua fx() (baseline 6 tháng, x5,6) — không phải giá trị thô", () => {
    render(<Bars rows={[{ id: "a", l: "Alpha", v: 100 }]} />);
    // fx(100) = round(100*5.6) = 560
    expect(screen.getByText("560")).toBeInTheDocument();
  });

  it("pctMode: hiện % trên tổng thay vì count", () => {
    render(<Bars rows={rows} pctMode />);
    // tổng = 160; 100/160 -> pv = 62,5
    expect(screen.getByText("62,5%")).toBeInTheDocument();
  });

  it("mặc định không có total/onRowClick/kids: hàng không có role/tabIndex, vẫn có tooltip title", () => {
    render(<Bars rows={rows} />);
    const rowAlpha = screen.getByText("Alpha").closest("[title]");
    expect(rowAlpha).not.toHaveAttribute("role");
    expect(rowAlpha).not.toHaveAttribute("tabindex");
    // fx(100)=560, tổng mặc định=160 -> pv(100,160)=62,5
    expect(rowAlpha).toHaveAttribute("title", "Alpha — 560 (62,5%)");
  });

  it("total truyền vào đổi mẫu số dùng cho % trong title, không đổi rows.reduce mặc định", () => {
    render(<Bars rows={rows} total={1000} />);
    const rowAlpha = screen.getByText("Alpha").closest("[title]");
    // pv(100,1000) = 10
    expect(rowAlpha).toHaveAttribute("title", "Alpha — 560 (10%)");
  });

  it("onRowClick: hàng thành role=button, tabIndex=0, click gọi callback đúng row", () => {
    const onRowClick = vi.fn();
    render(<Bars rows={rows} onRowClick={onRowClick} />);
    const rowAlpha = screen.getByText("Alpha").closest('[role="button"]');
    expect(rowAlpha).toHaveAttribute("tabindex", "0");
    fireEvent.click(rowAlpha!);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("onRowClick: Enter và Space đều kích hoạt callback", () => {
    const onRowClick = vi.fn();
    render(<Bars rows={rows} onRowClick={onRowClick} />);
    const rowBeta = screen.getByText("Beta").closest('[role="button"]')!;
    fireEvent.keyDown(rowBeta, { key: "Enter" });
    fireEvent.keyDown(rowBeta, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it("kids: render chip con NGAY DƯỚI hàng tương ứng, số đã qua fx()", () => {
    render(
      <Bars
        rows={rows}
        kids={(r) => (r.id === "a" ? [{ name: "Web", n: 3 }, { name: "App", n: 6 }] : [])}
      />,
    );
    // fx(3) = round(16.8) = 17, fx(6) = round(33.6) = 34 — chọn số không trùng fx(rows.v)
    expect(screen.getByText("Web")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("kids trả mảng rỗng: không render khối chip nào", () => {
    render(<Bars rows={rows} kids={() => []} />);
    expect(screen.queryByText("Web")).not.toBeInTheDocument();
  });

  /* D1 (charter Phase 2): @coverage truyền obs.cov đơn vị % nên KHÔNG được nhân fx() —
     prototype áp fx() ở đây và paint 85% thành "476". formatValue là đường thoát. */
  it("formatValue: thay số trên thanh, KHÔNG áp fx() — 85 hiện '85%' chứ không phải '476'", () => {
    render(<Bars rows={[{ id: "s2", l: "02 Chụp CCCD", v: 85 }]} formatValue={(r) => `${r.v}%`} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.queryByText("476")).not.toBeInTheDocument();
  });

  it("formatValue cũng thay phần giá trị trong tooltip (tooltip không được nói số khác thanh)", () => {
    render(<Bars rows={[{ id: "s2", l: "02 Chụp CCCD", v: 85 }]} total={600} formatValue={(r) => `${r.v}%`} />);
    const row = screen.getByText("02 Chụp CCCD").closest("[title]");
    // pv(85,600) = 14,2 — phần % trong tooltip vẫn là tỷ trọng trên mẫu số, đúng rankBars gốc
    expect(row).toHaveAttribute("title", "02 Chụp CCCD — 85% (14,2%)");
  });

  it("formatValue thắng pctMode khi truyền cả hai", () => {
    render(<Bars rows={rows} pctMode formatValue={(r) => `#${r.v}`} />);
    expect(screen.getByText("#100")).toBeInTheDocument();
    expect(screen.queryByText("62,5%")).not.toBeInTheDocument();
  });

  /* S2.6a (R4): nhãn giá trị mặc định đổi từ nf() sang nfK() — v chọn sao cho fx(v) = round(v*5.6)
     ra đúng 41200 (v = 41200/5.6), khớp bảng giá trị biên nfK trong spec (41200 → "41,2K"). */
  it("nfK trên bar: giá trị sau fx() = 41200 hiện dạng viết tắt '41,2K'", () => {
    render(<Bars rows={[{ id: "a", l: "Alpha", v: 41200 / 5.6 }]} />);
    expect(screen.getByText("41,2K")).toBeInTheDocument();
  });

  it("thứ tự DOM trong một hàng: label → bar → value (grid đổi từ label|value|bar sang label|bar|value)", () => {
    render(<Bars rows={[{ id: "a", l: "Alpha", v: 100 }]} />);
    const label = screen.getByText("Alpha").closest("div")!;
    const value = screen.getByText("560"); // fx(100)=560 <1000 nên nfK===nf, không cần K
    // D2a: 1 hàng (<=3) → thanh 42px, class đổi từ `.h-2\.5` (10px cố định) sang `.h-\[42px\]`.
    const bar = screen.getByTestId("bars").querySelector(".h-\\[42px\\]")!;
    // eslint-disable-next-line no-bitwise
    expect(label.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // eslint-disable-next-line no-bitwise
    expect(bar.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /* D0a (charter Phase 2, owner chốt 02/08): fx() chỉ hợp lệ cho volume TỔNG HỢP (dim.base==='agg').
     Mặc định `scaled=true` giữ NGUYÊN hành vi cũ (test trên đã xác nhận: 100 → "560" = fx(100)). */
  it("scaled=false: KHÔNG áp fx() — 9 hiện đúng '9', không phải fx(9)=50", () => {
    render(<Bars rows={[{ id: "a", l: "Khiếu nại", v: 9 }]} scaled={false} />);
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.queryByText("50")).not.toBeInTheDocument();
  });

  it("scaled=false cũng áp cho tooltip title (không lệch với nhãn trên thanh)", () => {
    render(<Bars rows={[{ id: "a", l: "Khiếu nại", v: 9 }]} scaled={false} />);
    const row = screen.getByText("Khiếu nại").closest("[title]");
    expect(row).toHaveAttribute("title", "Khiếu nại — 9 (100%)");
  });

  /* D2a: thanh dày tự điều chỉnh — rows.length<=3 → 42px (ít hàng, mỗi hàng nổi bật hơn);
     rows.length>3 → 26px (nhiều hàng, tránh đẩy card quá cao). Trước đây `h-2.5` (10px) cố định. */
  it("D2a: 3 hàng trở xuống → thanh dày 42px", () => {
    render(<Bars rows={rows} />); // rows = 3 phần tử (Alpha/Beta/Gamma)
    const bars = screen.getByTestId("bars").querySelectorAll(".h-\\[42px\\]");
    expect(bars).toHaveLength(3);
  });

  it("D2a: 4 hàng trở lên → thanh dày 26px", () => {
    const fourRows: DimRow[] = [...rows, { id: "d", l: "Delta", v: 5 }];
    render(<Bars rows={fourRows} />);
    const bars = screen.getByTestId("bars").querySelectorAll(".h-\\[26px\\]");
    expect(bars).toHaveLength(4);
    expect(screen.getByTestId("bars").querySelectorAll(".h-\\[42px\\]")).toHaveLength(0);
  });

  /* D4a: bỏ chấm màu dẫn đầu nhãn — thanh đã mang màu nên chấm là thông tin lặp lại lần 2, đồng
     thời chiếm chỗ của nhãn đang bị `truncate`. */
  it("D4a: không còn chấm màu dẫn đầu nhãn", () => {
    const { container } = render(<Bars rows={rows} />);
    expect(container.querySelectorAll("i")).toHaveLength(0);
  });

  /* VOC-STACKED-SPEC §1: prop `segments` (ADDITIVE) — row có segments non-empty → fill chia
     thành N đoạn màu, mỗi đoạn có tooltip title "label: nf(n)". */
  describe("segments (stacked-segment mode)", () => {
    it("row có segments → fill chia thành N đoạn màu con, mỗi đoạn có title đúng", () => {
      const { container } = render(
        <Bars
          rows={[{ id: "a", l: "Alpha", v: 100 }]}
          segments={(r) => (r.id === "a" ? [
            { label: "Nhóm 1", n: 60, c: "var(--cat-1)" },
            { label: "Nhóm 2", n: 40, c: "var(--cat-2)" },
          ] : [])}
        />,
      );
      const fill = container.querySelector(".rounded-\\[4px\\].flex") as HTMLElement;
      expect(fill.children).toHaveLength(2);
      const seg1 = fill.children[0] as HTMLElement;
      const seg2 = fill.children[1] as HTMLElement;
      expect(seg1).toHaveAttribute("title", "Nhóm 1: 60");
      expect(seg1.style.width).toBe("60%");
      expect(seg1.style.background).toBe("var(--cat-1)");
      expect(seg2).toHaveAttribute("title", "Nhóm 2: 40");
      expect(seg2.style.width).toBe("40%");
      expect(seg2.style.background).toBe("var(--cat-2)");
    });

    it("row KHÔNG có segments (hoặc segments trả rỗng) → fill vẫn 1 màu duy nhất (regression)", () => {
      const { container } = render(
        <Bars rows={[{ id: "a", l: "Alpha", v: 100, c: "var(--cat-3)" }]} segments={() => []} />,
      );
      const fill = container.querySelector(".rounded-\\[4px\\].flex") as HTMLElement;
      expect(fill.children).toHaveLength(0);
      expect(fill.style.background).toBe("var(--cat-3)");
    });

    it("không truyền prop segments → hành vi y hệt trước khi thêm prop", () => {
      const { container } = render(<Bars rows={rows} />);
      const fill = container.querySelector(".rounded-\\[4px\\].flex") as HTMLElement;
      expect(fill.children).toHaveLength(0);
      expect(fill.style.background).toBe("var(--ink3)");
    });

    /* `segmentLegend` (owner chốt 03/08) — chú giải màu NGAY DƯỚI TỪNG THANH. Phải theo hàng vì caller
       duy nhất (@themestack) gán màu theo thứ hạng TRONG một theme, nên một dải chung sẽ nói sai. Test
       khoá cả ba mặt: có chip đúng nhãn+màu, KHÔNG in `n` (tránh trưng tỷ trọng demo như phép đo), và
       vắng prop thì không thêm gì (regression cho mọi caller cũ). */
    describe("segmentLegend (chú giải màu theo hàng)", () => {
      const twoSegs = () => [
        { label: "Nhóm 1", n: 60, c: "var(--cat-1)" },
        { label: "Nhóm 2", n: 40, c: "var(--cat-2)" },
      ];

      it("hàng có ≥2 đoạn → hiện chip nhãn + ô màu đúng thứ tự, và KHÔNG in số n", () => {
        render(<Bars rows={[{ id: "a", l: "Alpha", v: 100 }]} segments={twoSegs} segmentLegend />);
        const legend = screen.getByTestId("bars-seglegend-a");
        expect(legend).toHaveTextContent("Nhóm 1");
        expect(legend).toHaveTextContent("Nhóm 2");
        expect(legend.textContent).not.toContain("60");
        const swatches = legend.querySelectorAll("span > span");
        expect(swatches).toHaveLength(2);
        expect((swatches[0] as HTMLElement).style.background).toBe("var(--cat-1)");
        expect((swatches[1] as HTMLElement).style.background).toBe("var(--cat-2)");
      });

      it("hàng chỉ có 1 đoạn → không hiện legend (màu không mã hoá gì để phải giải mã)", () => {
        render(
          <Bars
            rows={[{ id: "a", l: "Alpha", v: 100 }]}
            segments={() => [{ label: "Chưa gán sub-theme", n: 100, c: "var(--ink3)" }]}
            segmentLegend
          />,
        );
        expect(screen.queryByTestId("bars-seglegend-a")).not.toBeInTheDocument();
      });

      it("có segments nhưng KHÔNG truyền segmentLegend → không thêm chip nào (regression)", () => {
        render(<Bars rows={[{ id: "a", l: "Alpha", v: 100 }]} segments={twoSegs} />);
        expect(screen.queryByTestId("bars-seglegend-a")).not.toBeInTheDocument();
      });
    });
  });
});
