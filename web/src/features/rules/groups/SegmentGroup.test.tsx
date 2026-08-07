import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { bandLabels, bandOf, formatBound } from "../../../data/bands.ts";
import { CUST_NUM } from "../../../data/rawFields.ts";
import { isSegUnknown } from "../../../data/segment.ts";
import { nf } from "../../../design-system/format.ts";
import { useCxmStore } from "../../../store/store.ts";
import { SegmentGroup } from "./SegmentGroup.tsx";

/* Nhóm ranh giới dải — E7 của Module E, dựng ở Module G.

   Bộ test này canh đúng thứ E7 đặt hàng: XEM TRƯỚC được hậu quả trước khi lưu, và ranh giới sai bị
   chặn TRƯỚC khi chạm seam ghi. Mọi con số kỳ vọng SUY LẠI từ `data.cust` qua chính `bandOf` —
   không chép số bằng tay, để fixture đổi thì test đổi theo chứ không đỏ giả. */

const cfg0 = useCxmStore.getState().cfg;
const cfg = () => useCxmStore.getState().cfg;
const cust = () => useCxmStore.getState().data.cust;

afterEach(() => {
  useCxmStore.getState().setCfg({ segment: cfg0.segment });
});

/** Đếm độc lập với component: bao nhiêu khách rơi vào một nhãn dải, theo một trục cho trước. */
function countIn(dimId: string, label: string): number {
  const dim = useCxmStore.getState().dims[dimId];
  const source = dim.cut?.kind === "band" ? dim.cut.source : "";
  const axis = cfg().segment.band[dimId];
  return cust().filter((c) => {
    const raw = CUST_NUM[source](c);
    return !isSegUnknown(raw) && bandOf(raw, axis) === label;
  }).length;
}

describe("SegmentGroup — xem trước ranh giới dải", () => {
  it("hiện đúng nhãn dải đang dùng, và nhãn đến từ bandLabels chứ không phải chuỗi viết tay", () => {
    render(<SegmentGroup />);
    for (const label of bandLabels(cfg().segment.band.nav)) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("số khách mỗi dải khớp phép đếm độc lập trên data.cust", () => {
    render(<SegmentGroup />);
    const labels = bandLabels(cfg().segment.band.nav);
    // Tổng các dải + hai nghĩa "không biết" phải bằng đúng cohort — mẫu số không được lặng lẽ rứt
    // nhóm không xác định (bất biến của dự án).
    const inBands = labels.reduce((a, l) => a + countIn("nav", l), 0);
    const unknown = cust().filter((c) => isSegUnknown(CUST_NUM.navVnd(c))).length;
    expect(inBands + unknown).toBe(cust().length);
    for (const l of labels) {
      const n = countIn("nav", l);
      if (n > 0) expect(screen.getAllByText(`${nf(n)} khách`).length).toBeGreaterThan(0);
    }
  });

  it("sửa một ranh giới cho ra bản NHÁP: dải mới hiện ngay nhưng cfg chưa đổi", () => {
    render(<SegmentGroup />);
    const nav = within(screen.getByTestId("axis-nav"));
    const before = cfg().segment.band.nav.cuts.slice();

    const field = screen.getByLabelText("Ranh giới thứ 1 của Phân khúc NAV");
    fireEvent.change(field, { target: { value: "1" } });
    fireEvent.blur(field);

    expect(nav.getByText("Dải sẽ thành thế này sau khi lưu")).toBeTruthy();
    expect(cfg().segment.band.nav.cuts).toEqual(before);

    // Dải mới phải hiện được nhãn sinh từ ranh giới nháp — đây là cái E7 gọi là "xem trước".
    const drafted = bandLabels({ ...cfg0.segment.band.nav, cuts: [1, ...before.slice(1)] });
    expect(screen.getAllByText(drafted[0]).length).toBeGreaterThan(0);
  });

  it("ranh giới không tăng dần bị chặn TRƯỚC khi chạm seam ghi, kèm câu nói rõ sai gì", () => {
    render(<SegmentGroup />);
    const nav = within(screen.getByTestId("axis-nav"));
    const before = cfg().segment.band.nav.cuts.slice();

    const field = screen.getByLabelText("Ranh giới thứ 2 của Phân khúc NAV");
    fireEvent.change(field, { target: { value: "1" } });
    fireEvent.blur(field);

    expect(nav.getByText(/Ranh giới phải tăng dần/)).toBeTruthy();
    const save = nav.getByRole("button", { name: "Lưu ranh giới" });
    expect(save.hasAttribute("disabled")).toBe(true);
    fireEvent.click(save);
    expect(cfg().segment.band.nav.cuts).toEqual(before);
  });

  it("lưu ranh giới mới thì cfg đổi VÀ khách được chia lại theo ranh giới mới", () => {
    render(<SegmentGroup />);
    const nav = within(screen.getByTestId("axis-nav"));
    const before = cfg().segment.band.nav.cuts.slice();

    /* Hạ ranh giới đầu xuống 1 đồng — đúng ca dùng owner nêu ở Module E: tách nhóm CHƯA CÓ TÀI SẢN
       ra khỏi nhóm tài sản nhỏ. Trước khi hạ, hai khách "0đ" và "12tr" ở CÙNG một dải; sau khi hạ
       thì phải khác dải. Đây là phép kiểm nói được thành câu nghiệp vụ, không phải so hai con số
       tổng — mà tổng cũng phải bảo toàn, nên kiểm luôn ở dưới. */
    const zero = cust().find((c) => c.navVnd === 0);
    const small = cust().find((c) => typeof c.navVnd === "number" && c.navVnd > 1 && c.navVnd < before[0]);
    expect(zero && small).toBeTruthy();
    const axisBefore = cfg().segment.band.nav;
    expect(bandOf(zero!.navVnd, axisBefore)).toBe(bandOf(small!.navVnd, axisBefore));

    const field = screen.getByLabelText("Ranh giới thứ 1 của Phân khúc NAV");
    fireEvent.change(field, { target: { value: "1" } });
    fireEvent.blur(field);
    fireEvent.click(nav.getByRole("button", { name: "Lưu ranh giới" }));

    // Sửa MỘT mốc là THAY mốc đó, không phải chèn thêm — số dải giữ nguyên.
    expect(cfg().segment.band.nav.cuts).toEqual([1, ...before.slice(1)]);

    const axisAfter = cfg().segment.band.nav;
    expect(bandOf(zero!.navVnd, axisAfter)).not.toBe(bandOf(small!.navVnd, axisAfter));

    // Không khách nào biến mất khi chia lại: tổng các dải + hai nghĩa "không biết" = đúng cohort.
    const inBands = bandLabels(axisAfter).reduce((a, l) => a + countIn("nav", l), 0);
    const unknown = cust().filter((c) => isSegUnknown(CUST_NUM.navVnd(c))).length;
    expect(inBands + unknown).toBe(cust().length);
  });

  it("thêm một ranh giới làm số dải tăng đúng một, và lưu được", () => {
    render(<SegmentGroup />);
    const nav = within(screen.getByTestId("axis-nav"));
    const before = cfg().segment.band.nav.cuts.length;

    fireEvent.click(nav.getByRole("button", { name: "+ Thêm ranh giới" }));
    fireEvent.click(nav.getByRole("button", { name: "Lưu ranh giới" }));

    expect(cfg().segment.band.nav.cuts.length).toBe(before + 1);
    expect(bandLabels(cfg().segment.band.nav).length).toBe(before + 2);
  });

  /* Ranh giới NAV tính bằng đồng nên ô nhập giữ số THÔ (5.000.000.000), khó đọc bằng mắt — cạnh ô
     có một chú thích cách đọc. Chú thích đó phải nói đúng con số ĐANG nằm trong ô: bản đầu ghi
     "= 0đ" cho mọi mốc dưới tầng triệu, tức ô ghi `1` mà chú thích ghi `0đ`, ngay đúng ca dùng owner
     đặt hàng ở E7 (tách nhóm CHƯA CÓ TÀI SẢN). Không có test nào chạm tới thì bản vá đó vô hình. */
  it("chú thích cạnh ô ranh giới nói đúng con số trong ô, mốc 1 đồng không được ghi '= 0đ'", () => {
    render(<SegmentGroup />);
    const axis = cfg().segment.band.nav;
    const read = formatBound(axis.cuts[0], axis.unit);
    expect(read).not.toBeNull();
    expect(screen.getAllByText(`= ${read}`).length).toBeGreaterThan(0);

    const field = screen.getByLabelText("Ranh giới thứ 1 của Phân khúc NAV") as HTMLInputElement;
    fireEvent.change(field, { target: { value: "1" } });
    fireEvent.blur(field);

    expect(field.value).toBe("1");
    expect(screen.queryByText("= 0đ")).toBeNull();
  });

  it("danh sách giá trị hợp lệ là CHỈ ĐỌC — không có ô nhập nào cho nó", () => {
    render(<SegmentGroup />);
    for (const v of cfg().segment.values.acq) {
      expect(screen.getAllByText(v).length).toBeGreaterThan(0);
      expect(screen.queryByDisplayValue(v)).toBeNull();
    }
  });
});
