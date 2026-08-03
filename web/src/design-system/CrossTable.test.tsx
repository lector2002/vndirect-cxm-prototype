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
