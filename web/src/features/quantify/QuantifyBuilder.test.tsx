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

/* (d) — port qSave(false) (harness §314-324, shape §252-263): Lưu đè giữ nguyên id + cập nhật
   name/định nghĩa mới. Vế "merge note cũ" đã BỎ 18/08 tối (owner sweep note/sub): field `note`
   không còn trong schema, builder không còn gì để merge. */
describe("QuantifyBuilder — Lưu đè giữ id (harness §314-324)", () => {
  it("Lưu đè: saveQuantify nhận item id cũ + name mới", () => {
    const item = seed.qt.find((q) => q.kind === "show");
    if (!item || item.kind !== "show") throw new Error("fixture phải còn ít nhất một item show");
    const saveQuantify = vi.fn();
    const qb: QbState = { show: item.show, metric: item.metric, chart: item.chart, by: item.by ?? null, view: item.view ?? "chart" };
    render(<QuantifyBuilder {...baseProps({ qb, editId: item.id, saveQuantify })} />);

    fireEvent.change(screen.getByTestId("qbuilder-name"), { target: { value: "q1 sửa đè" } });
    fireEvent.click(screen.getByTestId("qbuilder-save-overwrite"));

    expect(saveQuantify).toHaveBeenCalledTimes(1);
    expect(saveQuantify).toHaveBeenCalledWith(
      expect.objectContaining({ id: item.id, name: "q1 sửa đè", show: item.show }),
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

/* (g) — Module D section 1: picker CHIA MÀU (`split`). Gate ngược với by-picker: `by` cần evAttr (đọc
   được từ mẫu evidence), `split` cần base:'cust' (hai giá trị nằm trên cùng một dòng khách nên đếm
   được thật). `pf` phải VẮNG khỏi picker này — owner chốt loại nó vì có ở cả Evidence lẫn Customer nên
   nhập nhằng; test neo vào KẾT QUẢ (không thấy nhãn pf) nên vẫn đúng dù cách lọc trong code có đổi. */
describe("QuantifyBuilder — split-picker chỉ cho dim base:'cust'", () => {
  it("show='acq' (cust) → split-picker hiện, không tự liệt kê chính nó, không liệt kê pf (base:'ev')", () => {
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq" } })} />);
    const picker = screen.getByTestId("qbuilder-picker-split");
    expect(within(picker).getByText(dims.nav.label)).toBeInTheDocument();
    expect(within(picker).queryByText(dims.acq.label)).not.toBeInTheDocument();
    expect(within(picker).queryByText(dims.pf.label)).not.toBeInTheDocument();
    expect(within(picker).queryByText(dims.theme.label)).not.toBeInTheDocument();
  });

  it("show='theme' (không cust) → split-picker ẩn hoàn toàn, hiện ghi chú khóa", () => {
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "theme" } })} />);
    expect(screen.queryByTestId("qbuilder-picker-split")).not.toBeInTheDocument();
    expect(screen.getByTestId("qbuilder-split-locked-note")).toBeInTheDocument();
  });

  it("chưa chia màu → không hiện picker cách xếp đoạn; có split → hiện", () => {
    const { unmount } = render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq" } })} />);
    expect(screen.queryByTestId("qbuilder-picker-stack")).not.toBeInTheDocument();
    unmount();
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav" } })} />);
    expect(screen.getByTestId("qbuilder-picker-stack")).toBeInTheDocument();
  });
});

/* (h) — chuẩn hoá setField: `by` và `split` LOẠI TRỪ NHAU, và đổi trục hàng sang dim không phải cust
   thì `split` phải rơi NGAY (cùng tinh thần (c) cho `by`). Không có guard này thì payload mang split
   trỏ vào trục không đếm được → validate rule 16 đỏ. */
describe("QuantifyBuilder — gate chia màu: mutual exclusion + clear khi show mất base:'cust'", () => {
  it("đang có split='nav', đổi show sang 'theme' → setQb nhận split = undefined", () => {
    const setQb = vi.fn();
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav" }, setQb })} />);
    fireEvent.click(within(screen.getByTestId("qbuilder-picker-show")).getByText(dims.theme.label));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ show: "theme", split: undefined }));
  });

  it("đang có split='nav' + stack='pct', bỏ chia màu → stack cũng bị dọn (không mồ côi)", () => {
    const setQb = vi.fn();
    render(
      <QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav", stack: "pct" }, setQb })} />,
    );
    fireEvent.click(within(screen.getByTestId("qbuilder-picker-split")).getByText("— không chia màu —"));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ split: undefined, stack: undefined }));
  });

  it("đang chia màu → donut KHÔNG có trong danh sách kiểu chart (donut không hiện được đoạn màu)", () => {
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav" } })} />);
    const picker = screen.getByTestId("qbuilder-picker-chart");
    expect(within(picker).getByText("Bar")).toBeInTheDocument();
    expect(within(picker).queryByText("Donut")).not.toBeInTheDocument();
  });
});

/* (i) — lát 1: preview của builder có THÊM chip strip đổi chiều chia màu (SplitToggle trong
   QuantifyWidget) đứng cạnh picker `qbuilder-picker-split`. Hai control cho cùng một field, mà chỉ
   `qb.split` đi vào payload lúc Lưu ⇒ chip BUỘC phải ghi vào qb, không được giữ state riêng trong
   widget. Không có test này thì lỗi là loại tệ nhất: chart đổi trước mắt, bấm Lưu, mất im lặng. */
describe("QuantifyBuilder — chip strip trong preview ghi vào CÙNG qb.split với picker (một writer)", () => {
  it("bấm chip 'Độ tuổi' trong preview → setQb nhận split='age' (không phải chỉ đổi hình)", () => {
    const setQb = vi.fn();
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq" }, setQb })} />);
    fireEvent.click(within(screen.getByTestId("split-toggle")).getByRole("button", { name: dims.age.label }));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ show: "acq", split: "age" }));
  });

  it("bấm chip 'Không chia' khi đang có stack='pct' → qua setField nên stack cũng bị dọn", () => {
    const setQb = vi.fn();
    render(
      <QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav", stack: "pct" }, setQb })} />,
    );
    fireEvent.click(within(screen.getByTestId("split-toggle")).getByRole("button", { name: "Không chia" }));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ split: undefined, stack: undefined }));
  });
});

/* (j) — hai mẫu số "%" không được bật cùng lúc. `metric:'pct'` là % trên TỔNG cohort (vào nhãn số),
   `stack:'pct'` là tỷ trọng TRONG hàng (vào bề rộng); bật cả hai thì nhãn trục dọc nói "% trên tổng"
   còn nhãn đáy nói "(100%) trong từng <đơn vị>" — cùng một hình, hai mẫu số. Trước 03/08 tổ hợp này
   qua được cả validate LẪN builder. Giữ lối "field vừa bấm thắng" như gate by↔split. */
describe("QuantifyBuilder — chặn metric 'pct' × stack 'pct' (hai mẫu số)", () => {
  it("đang metric='pct', bấm stack='pct' → metric bị hạ về 'count' (cú bấm vừa rồi thắng)", () => {
    const setQb = vi.fn();
    render(
      <QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav", metric: "pct" }, setQb })} />,
    );
    fireEvent.click(within(screen.getByTestId("qbuilder-picker-stack")).getByText("Tỷ trọng 100%"));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ stack: "pct", metric: "count" }));
  });

  it("đang stack='pct', bấm metric='pct' → stack về 'abs' (cú bấm vừa rồi thắng)", () => {
    const setQb = vi.fn();
    render(
      <QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav", stack: "pct" }, setQb })} />,
    );
    fireEvent.click(within(screen.getByTestId("qbuilder-picker-metric")).getByText("Percentage"));
    expect(setQb).toHaveBeenCalledWith(expect.objectContaining({ metric: "pct", stack: "abs" }));
  });
});

/* (i) — payload: `split` phải đi ra, còn `stack` CHỈ đi ra khi 'pct' (schema chốt "vắng ⇒ 'abs'", nên
   ghi 'abs' tường minh là cách thứ hai nói cùng một điều). */
describe("QuantifyBuilder — payload mang split, chỉ mang stack khi 'pct'", () => {
  it("split='nav', stack mặc định → payload có split, KHÔNG có stack", () => {
    const createQuantify = vi.fn((fields: Omit<QuantifyShow, "id">): QuantifyItem => ({ ...fields, id: "qu-new" }));
    render(<QuantifyBuilder {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav" }, createQuantify })} />);
    fireEvent.click(screen.getByTestId("qbuilder-save-new"));
    const fields = createQuantify.mock.calls[0][0];
    expect(fields).toEqual(expect.objectContaining({ show: "acq", split: "nav" }));
    expect("stack" in fields).toBe(false);
  });

  it("split='nav', stack='pct' → payload mang stack='pct'", () => {
    const createQuantify = vi.fn((fields: Omit<QuantifyShow, "id">): QuantifyItem => ({ ...fields, id: "qu-new" }));
    render(
      <QuantifyBuilder
        {...baseProps({ qb: { ...QB_DEF, show: "acq", split: "nav", stack: "pct" }, createQuantify })}
      />,
    );
    fireEvent.click(screen.getByTestId("qbuilder-save-new"));
    expect(createQuantify).toHaveBeenCalledWith(expect.objectContaining({ split: "nav", stack: "pct" }));
  });
});
