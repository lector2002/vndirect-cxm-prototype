import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { QuantifyShow } from "../data/schema/index.ts";
import { qRunCross } from "../domain/quantify.ts";
import { CrossTable } from "./CrossTable.tsx";

function findShow(id: string): QuantifyShow {
  const q = seed.qt.find((x) => x.id === id);
  if (!q || q.kind !== "show") throw new Error(`fixture ${id} phải là QuantifyShow`);
  return q;
}

describe("CrossTable", () => {
  it("q16 (theme × pf) — đúng số hàng/cột từ qRunCross + nhãn 'mẫu'", () => {
    const cx = qRunCross(findShow("q16"), seed, dims);
    // Neo theo domain/quantify.test.ts: 4 theme row, 3 pf col (server lọc vì tot=0).
    expect(cx.rows).toHaveLength(4);
    expect(cx.cols).toHaveLength(3);

    render(<CrossTable cx={cx} />);
    const table = screen.getByTestId("cross-table");
    expect(table.querySelectorAll("thead th")).toHaveLength(cx.cols.length + 2); // cột hàng + N cột + Tổng
    expect(table.querySelectorAll("tbody tr")).toHaveLength(cx.rows.length + 1); // N hàng + dòng Tổng
    expect(screen.getByText(/mẫu/)).toBeInTheDocument();
  });

  it("cell KHÔNG áp fx() — hiện đúng số ev thô đếm được (x-th-device × android = 7)", () => {
    const cx = qRunCross(findShow("q16"), seed, dims);
    render(<CrossTable cx={cx} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});

/* Guard `unsupported` (owner chốt 03/08). Item dưới đây KHÔNG có trong seed và KHÔNG ĐƯỢC có:
   validate rule 16 (validate.ts:396-397) đòi cả hai trục ghép chéo có evAttr, mà dims.seg là
   base:'cust' không evAttr. Dựng tay tại đây là cách duy nhất chạm được nhánh lưới an toàn — nó tồn
   tại cho trường hợp một trong ba chốt (builder dòng 132/141, validate rule 16) bị nới. */
describe("CrossTable — trục khách: in lý do, KHÔNG vẽ ma trận rỗng", () => {
  const custCross: QuantifyShow = {
    id: "q-test-cust-cross",
    kind: "show",
    name: "Theme × Segment khách",
    show: "theme",
    by: "seg",
    metric: "count",
    chart: "rank",
  };

  it("qRunCross nêu đích danh trục khách, và rows rỗng", () => {
    const cx = qRunCross(custCross, seed, dims);
    expect(cx.unsupported).toMatch(/seg/);
    expect(cx.rows).toHaveLength(0);
  });

  it("render lý do thay cho bảng — bảng rỗng sẽ bị đọc thành 'kết quả bằng 0'", () => {
    const cx = qRunCross(custCross, seed, dims);
    render(<CrossTable cx={cx} />);
    expect(screen.getByTestId("cross-unsupported")).toBeInTheDocument();
    expect(screen.queryByTestId("cross-table")).not.toBeInTheDocument();
    // Dòng mẫu số "Đang hiện 0 trên N mẫu" PHẢI vắng: chính nó là thứ khiến người xem đọc thành 0 thật.
    expect(screen.queryByText(/Đang hiện/)).not.toBeInTheDocument();
    expect(screen.getByText(/không nối được với evidence/)).toBeInTheDocument();
  });
});
