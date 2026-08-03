import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DimRow } from "../data/schema/index.ts";
import { DataTable } from "./DataTable.tsx";

const rows: DimRow[] = [
  { id: "a", l: "Alpha", v: 60 },
  { id: "b", l: "Beta", v: 40 },
];

describe("DataTable", () => {
  it("có cột Count và %, đúng số hàng", () => {
    render(<DataTable rows={rows} />);
    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
    const table = screen.getByTestId("data-table");
    expect(table.querySelectorAll("tbody tr")).toHaveLength(rows.length);
  });

  it("% tính đúng trên tổng rows truyền vào", () => {
    render(<DataTable rows={rows} />);
    // 60/100 = 60% ; 40/100 = 40%
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("labelHeader tùy chỉnh thay cho 'Nhãn' mặc định", () => {
    render(<DataTable rows={rows} labelHeader="Theme · vì sao" />);
    expect(screen.getByText("Theme · vì sao")).toBeInTheDocument();
  });

  /* D0a (charter Phase 2): fx() chỉ hợp lệ cho volume TỔNG HỢP (dim.base==='agg'). Mặc định
     `scaled=true` giữ NGUYÊN hành vi cũ (chưa test riêng ở đây vì 2 test đầu đã phủ, dùng số
     <5.6*60 nên fx không đổi hình dạng số — thêm test số lớn để phân biệt rõ scaled=true/false). */
  it("scaled=false: Count hiện số thô, KHÔNG áp fx()", () => {
    render(<DataTable rows={[{ id: "a", l: "Alpha", v: 100 }]} scaled={false} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByText("560")).not.toBeInTheDocument(); // fx(100)=560, phải KHÔNG xuất hiện
  });
});
