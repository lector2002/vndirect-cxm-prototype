import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seed } from "../../data/fixtures/seed.ts";
import { QuantifySets, type QuantifySetsProps } from "./QuantifySets.tsx";

function baseProps(overrides: Partial<QuantifySetsProps> = {}): QuantifySetsProps {
  return {
    data: seed,
    boards: {},
    createSet: vi.fn(),
    duplicateSet: vi.fn(),
    deleteSet: vi.fn(),
    renameSet: vi.fn(),
    setBoardBlocks: vi.fn(),
    resetBoard: vi.fn(),
    onBack: () => {},
    ...overrides,
  };
}

/* (a) — port quantifySets() (prototype dòng 2602-2662): 2 nhóm voc/cxm, mỗi set một card. */
describe("QuantifySets — render 2 nhóm + set cards", () => {
  it("render nhóm voc/cxm + card của từng set trong data.dash", () => {
    render(<QuantifySets {...baseProps()} />);
    expect(screen.getByTestId("quantify-sets")).toBeInTheDocument();
    expect(screen.getByTestId("qsets-group-voc")).toBeInTheDocument();
    expect(screen.getByTestId("qsets-group-cxm")).toBeInTheDocument();
    expect(screen.getByTestId("qset-b-voc-all")).toBeInTheDocument();
    expect(screen.getByTestId("qset-b-voc-data")).toBeInTheDocument();
    expect(screen.getByTestId("qset-b-cxm-exec")).toBeInTheDocument();
    expect(screen.getByTestId("qset-b-cxm-pilot")).toBeInTheDocument();
  });
});

/* (b) — LOAD-BEARING (harness nhóm 10 validateFixture): select "Thêm khối" chỉ được liệt kê @block
   CÙNG PHẦN (sec) với set — bỏ filter này cho phép ghép sai sec, validateFixture sẽ đỏ. */
describe("QuantifySets — '＋ Thêm khối' chỉ liệt kê @block cùng sec (harness nhóm 10)", () => {
  it("set cxm (b-cxm-pilot, câu 0) — không chứa @block sec voc, có chứa @block sec cxm", () => {
    render(<QuantifySets {...baseProps()} />);
    const select = screen.getByTestId("qblk-add-b-cxm-pilot-0");
    const values = within(select)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value);
    expect(values).not.toContain("@srcmatrix");
    expect(values).not.toContain("@intent");
    expect(values).not.toContain("@anomlanes");
    expect(values).not.toContain("@topictrend");
    expect(values).toContain("@toppri");
  });

  it("set voc (b-voc-data, câu 0) — không chứa @block sec cxm, có chứa @block sec voc", () => {
    render(<QuantifySets {...baseProps()} />);
    const select = screen.getByTestId("qblk-add-b-voc-data-0");
    const values = within(select)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value);
    expect(values).not.toContain("@toppri");
    expect(values).not.toContain("@journeystate");
    expect(values).not.toContain("@coverage");
    expect(values).not.toContain("@lanes");
    expect(values).not.toContain("@outcomes");
    expect(values).toContain("@intent");
  });
});

/* (c) — port blkAdd/blkDel/blkMove (prototype dòng 4472-4480): mọi mutation tính mảng mới từ bs
   hiện tại rồi gọi setBoardBlocks (KHÔNG mutate) — port qua curB()/harness §88-102. */
describe("QuantifySets — blkAdd/blkDel/blkMove gọi setBoardBlocks đúng mảng", () => {
  it("blkAdd: chọn chart chưa có trong set → setBoardBlocks(id, qi, [...cũ, mới])", () => {
    const setBoardBlocks = vi.fn();
    render(<QuantifySets {...baseProps({ setBoardBlocks })} />);
    // b-voc-data câu 0: bs gốc = ['@srcmatrix','q4'] (seed).
    fireEvent.change(screen.getByTestId("qblk-add-b-voc-data-0"), { target: { value: "q1" } });
    expect(setBoardBlocks).toHaveBeenCalledWith("b-voc-data", 0, ["@srcmatrix", "q4", "q1"]);
  });

  it("blkDel: bỏ một khối khỏi set → setBoardBlocks(id, qi, mảng đã loại đúng phần tử)", () => {
    const setBoardBlocks = vi.fn();
    render(<QuantifySets {...baseProps({ setBoardBlocks })} />);
    fireEvent.click(screen.getByTestId("qblk-del-b-voc-data-0-@srcmatrix"));
    expect(setBoardBlocks).toHaveBeenCalledWith("b-voc-data", 0, ["q4"]);
  });

  it("blkMove: đổi thứ tự khối đầu tiên xuống dưới → setBoardBlocks(id, qi, mảng đã swap)", () => {
    const setBoardBlocks = vi.fn();
    render(<QuantifySets {...baseProps({ setBoardBlocks })} />);
    const card = screen.getByTestId("qset-b-voc-data");
    // Khối đầu tiên trong toàn card = bi=0 của câu 0 ('@srcmatrix') — nút "Xuống" đầu tiên trong DOM.
    const downBtn = within(card).getAllByTitle("Xuống")[0];
    if (!downBtn) throw new Error("thiếu nút Xuống — fixture b-voc-data câu 0 phải có ≥ 2 khối");
    fireEvent.click(downBtn);
    expect(setBoardBlocks).toHaveBeenCalledWith("b-voc-data", 0, ["q4", "@srcmatrix"]);
  });
});

/* Overlay boards (harness §88-102): curB() phải ĐỌC overlay khi có, không rơi về qs[].b gốc — đây
   là lý do duy nhất curB tồn tại, nên phải test riêng thay vì luôn truyền boards={}. */
describe("QuantifySets — overlay boards: curB đọc overlay, '· đã sửa', 'Về mặc định' → resetBoard", () => {
  it("boards có overlay cho b-voc-data → hiện đúng khối overlay + nhãn 'đã sửa' + resetBoard", () => {
    const resetBoard = vi.fn();
    const boards = { "b-voc-data": [["q4"], ["q14", "q13"], ["@anomlanes"]] };
    render(<QuantifySets {...baseProps({ boards, resetBoard })} />);
    const card = screen.getByTestId("qset-b-voc-data");
    // Overlay câu 0 = ['q4'] (không còn '@srcmatrix' như qs[].b gốc).
    expect(within(card).queryByTestId("qblk-del-b-voc-data-0-@srcmatrix")).not.toBeInTheDocument();
    expect(within(card).getByTestId("qblk-del-b-voc-data-0-q4")).toBeInTheDocument();
    expect(card).toHaveTextContent("đã sửa");
    fireEvent.click(within(card).getByText("Về mặc định"));
    expect(resetBoard).toHaveBeenCalledWith("b-voc-data");
  });
});

/* (d) — port setNew() (prototype dòng 4488-4494): mỗi phần có nút riêng, tạo đúng sec của nhóm đó. */
describe("QuantifySets — '＋ Set mới' tạo set đúng phần", () => {
  it("bấm '＋ Set mới' ở nhóm voc → createSet('voc')", () => {
    const createSet = vi.fn();
    render(<QuantifySets {...baseProps({ createSet })} />);
    fireEvent.click(screen.getByTestId("qsets-new-voc"));
    expect(createSet).toHaveBeenCalledWith("voc");
  });

  it("bấm '＋ Set mới' ở nhóm cxm → createSet('cxm')", () => {
    const createSet = vi.fn();
    render(<QuantifySets {...baseProps({ createSet })} />);
    fireEvent.click(screen.getByTestId("qsets-new-cxm"));
    expect(createSet).toHaveBeenCalledWith("cxm");
  });
});

/* (e) — port SET_LOCKED (prototype dòng 2600): 2 set cố định khóa cấu trúc, chỉ nhân bản được. */
describe("QuantifySets — set khóa (b-cxm-exec/b-voc-all) không có nút Xóa", () => {
  it("b-voc-all: hiện 'Nhân bản để sửa', KHÔNG có nút Xóa", () => {
    render(<QuantifySets {...baseProps()} />);
    const card = screen.getByTestId("qset-b-voc-all");
    expect(within(card).getByText("Nhân bản để sửa")).toBeInTheDocument();
    expect(within(card).queryByTestId("qset-delete-b-voc-all")).not.toBeInTheDocument();
  });

  it("b-cxm-exec: hiện 'Nhân bản để sửa', KHÔNG có nút Xóa", () => {
    render(<QuantifySets {...baseProps()} />);
    const card = screen.getByTestId("qset-b-cxm-exec");
    expect(within(card).getByText("Nhân bản để sửa")).toBeInTheDocument();
    expect(within(card).queryByTestId("qset-delete-b-cxm-exec")).not.toBeInTheDocument();
  });
});
