import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, dims, seed } from "../../data/fixtures/seed.ts";
import type { QuantifyItem, QuantifyShow } from "../../data/schema/index.ts";
import { QB_DEF, QuantifyBuilder, type QbState, type QuantifyBuilderProps } from "./QuantifyBuilder.tsx";

function baseProps(overrides: Partial<QuantifyBuilderProps> = {}): QuantifyBuilderProps {
  return {
    qb: QB_DEF,
    setQb: () => {},
    editId: null,
    dims,
    data: seed,
    cfg: cfgDefault,
    createQuantify: vi.fn((fields: Omit<QuantifyShow, "id">): QuantifyItem => ({ ...fields, id: "qu-test" })),
    saveQuantify: vi.fn(),
    quantifyUsedBy: () => [],
    onBack: () => {},
    onSaved: () => {},
    ...overrides,
  };
}

/* (a) — port harness §182-189: mọi tổ hợp chiều × chỉ số × chart(rank/donut) phải dựng được, không throw. */
describe("QuantifyBuilder — mọi tổ hợp show×metric×chart dựng được (harness §182-189)", () => {
  it("render không throw cho mọi dim × metric(count/pct) × chart(rank/donut)", () => {
    Object.keys(dims).forEach((show) => {
      (["count", "pct"] as const).forEach((metric) => {
        (["rank", "donut"] as const).forEach((chart) => {
          const qb: QbState = { show, metric, chart, by: null, view: "chart" };
          const { unmount } = render(<QuantifyBuilder {...baseProps({ qb })} />);
          expect(screen.getByTestId("quantify-builder")).toBeInTheDocument();
          unmount();
        });
      });
    });
  });
});

/* (b) — gate cross-tab tại builder: by-picker chỉ liệt kê dim evAttr, ẩn khi show không evAttr. */
describe("QuantifyBuilder — by-picker chỉ cho dim có evAttr", () => {
  it("show='theme' (evAttr) → by-picker hiện, không tự liệt kê chính nó, không liệt kê dim thiếu evAttr", () => {
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "theme", by: null } })} />);
    const picker = screen.getByTestId("qbuilder-picker-by");
    expect(within(picker).queryByText(dims.theme.label)).not.toBeInTheDocument();
    expect(within(picker).getByText(dims.pf.label)).toBeInTheDocument();
    expect(within(picker).queryByText(dims.src.label)).not.toBeInTheDocument();
  });

  it("show='src' (không evAttr) → by-picker ẩn hoàn toàn, hiện ghi chú khóa", () => {
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "src", by: null } })} />);
    expect(screen.queryByTestId("qbuilder-picker-by")).not.toBeInTheDocument();
    expect(screen.getByTestId("qbuilder-by-locked-note")).toBeInTheDocument();
  });
});

/* (c) — port setQ() (prototype dòng 4533-4541): đổi show sang dim không evAttr trong lúc đang ghép
   chéo phải xóa `by` NGAY, không đợi thao tác thứ hai — nếu không, live/payload sẽ mang by trỏ vào
   dim không đọc được từ mẫu ev (validateFixture nhóm 16 sẽ đỏ). */
describe("QuantifyBuilder — gate cross-tab: đổi show sang dim không evAttr thì clear by", () => {
  it("đang có by='pf', đổi show sang 'src' → setQb nhận next.by = null", () => {
    const setQb = vi.fn();
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "theme", by: "pf" }, setQb })} />);
    const showPicker = screen.getByTestId("qbuilder-picker-show");
    fireEvent.click(within(showPicker).getByText(dims.src.label));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ show: "src", by: null }));
  });
});

/* (d) — port qSave(false) (harness §314-324, shape §252-263): Lưu đè giữ nguyên id, cập nhật
   name/định nghĩa mới, và MERGE note cũ (không làm mất note khi builder không có ô sửa note). */
describe("QuantifyBuilder — Lưu đè giữ id + merge note (harness §314-324)", () => {
  it("Lưu đè: saveQuantify nhận item id cũ + name mới + note cũ", () => {
    const item = seed.qt.find((q) => q.id === "q1");
    if (!item || item.kind !== "show" || !item.note) throw new Error("fixture q1 phải là show có note");
    const saveQuantify = vi.fn();
    const qb: QbState = { show: item.show, metric: item.metric, chart: item.chart, by: item.by ?? null, view: item.view ?? "chart" };
    render(<QuantifyBuilder {...baseProps({ qb, editId: "q1", saveQuantify })} />);

    fireEvent.change(screen.getByTestId("qbuilder-name"), { target: { value: "q1 sửa đè" } });
    fireEvent.click(screen.getByTestId("qbuilder-save-overwrite"));

    expect(saveQuantify).toHaveBeenCalledTimes(1);
    expect(saveQuantify).toHaveBeenCalledWith(
      expect.objectContaining({ id: "q1", name: "q1 sửa đè", note: item.note, show: item.show }),
    );
  });
});

/* (e) — Nhân bản/tạo mới KHÔNG được đi qua saveQuantify (mới đè nhầm id cũ). */
describe("QuantifyBuilder — Lưu bản mới luôn qua createQuantify, không đụng saveQuantify", () => {
  it("chưa sửa gì (editId=null) → nút Lưu duy nhất gọi createQuantify, không gọi saveQuantify", () => {
    const createQuantify = vi.fn((fields: Omit<QuantifyShow, "id">): QuantifyItem => ({ ...fields, id: "qu-new" }));
    const saveQuantify = vi.fn();
    render(<QuantifyBuilder {...baseProps({ editId: null, createQuantify, saveQuantify })} />);
    fireEvent.click(screen.getByTestId("qbuilder-save-new"));
    expect(createQuantify).toHaveBeenCalledTimes(1);
    expect(saveQuantify).not.toHaveBeenCalled();
  });

  it("đang sửa (editId) nhưng bấm 'Lưu thành bản mới' → vẫn gọi createQuantify, không gọi saveQuantify", () => {
    const createQuantify = vi.fn((fields: Omit<QuantifyShow, "id">): QuantifyItem => ({ ...fields, id: "qu-new" }));
    const saveQuantify = vi.fn();
    render(<QuantifyBuilder {...baseProps({ editId: "q1", createQuantify, saveQuantify })} />);
    fireEvent.click(screen.getByTestId("qbuilder-save-new"));
    expect(createQuantify).toHaveBeenCalledTimes(1);
    expect(saveQuantify).not.toHaveBeenCalled();
  });
});

/* (f) — port qSave() fields.chart = by ? 'rank' : b.chart (prototype dòng 4568): ghép chéo LUÔN
   lưu chart='rank' bất kể qb.chart đang là gì (donut trước đó vẫn phải bị ép về rank khi có by). */
describe("QuantifyBuilder — chọn by (cross-tab) → payload chart luôn 'rank'", () => {
  it("qb.chart='donut' nhưng đã chọn by → Lưu bản mới gửi chart='rank'", () => {
    const createQuantify = vi.fn((fields: Omit<QuantifyShow, "id">): QuantifyItem => ({ ...fields, id: "qu-new" }));
    const qbCross: QbState = { show: "theme", metric: "count", chart: "donut", by: "pf", view: "table" };
    render(<QuantifyBuilder {...baseProps({ qb: qbCross, createQuantify })} />);
    fireEvent.click(screen.getByTestId("qbuilder-save-new"));
    expect(createQuantify).toHaveBeenCalledWith(expect.objectContaining({ chart: "rank", by: "pf" }));
  });
});
