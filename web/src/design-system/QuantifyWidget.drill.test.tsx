import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { QuantifyItem } from "../data/schema/index.ts";
import { QuantifyWidget } from "./QuantifyWidget.tsx";

/* Drill-down (owner chốt 03/08, phương án (a)): bấm một thanh → mở danh sách bằng chứng/khách của
   hàng đó. Điều được kiểm ở đây KHÔNG phải "panel có mở không" mà là CÂU MẪU SỐ có nói đúng quan hệ
   giữa danh sách và con số trên thanh hay không — đó là chỗ duy nhất panel này có thể nói dối.

   Vì sao test ở tầng widget chứ không chỉ ở DrillPanel: quyết định "hàng này là sample hay full, là
   bằng chứng hay khách, là nhóm gộp hay thực thể" nằm ở chỗ NỐI giữa widget và domain. Test riêng
   DrillPanel với content tự dựng sẽ xanh cả khi widget nối sai kind. */

function findItem(id: string): QuantifyItem {
  const q = seed.qt.find((x) => x.id === id);
  if (!q) throw new Error(`fixture ${id} không tồn tại`);
  return q;
}

function clickRow(i: number) {
  const bars = screen.getByTestId("bars");
  fireEvent.click(bars.children[i]);
}

describe("QuantifyWidget — drill-down trục agg (bằng chứng là TẬP MẪU)", () => {
  it("bấm hàng đầu q1 → panel mở, nói rõ số trên thanh là TỔNG HỢP và danh sách chỉ là tập mẫu", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    expect(screen.queryByTestId("drill-denom")).not.toBeInTheDocument();
    clickRow(0); // rows xếp giảm dần → x-th-device (n=412), 8 bằng chứng trong tập 17
    const denom = screen.getByTestId("drill-denom");
    expect(denom).toHaveTextContent("tín hiệu tổng hợp");
    // Câu này là cả lý do panel tồn tại: KHÔNG được để người đọc hiểu 8 là số của hàng 412.
    expect(denom).toHaveTextContent("KHÔNG đếm từ danh sách");
    expect(denom).toHaveTextContent("8 bằng chứng mẫu");
    expect(denom).toHaveTextContent("trong tập 17 bản ghi");
    expect(screen.getByTestId("drill-lines").children).toHaveLength(8);
    // Tiêu đề hộp thoại = nhãn hàng vừa bấm, để không mất ngữ cảnh.
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Thiết bị / môi trường không tương thích");
  });

  it("hàng KHÔNG có bằng chứng nào (10/14 theme rơi vào ca này) → nói ra trần của tập mẫu, không panel trắng", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    clickRow(3); // x-th-wait (n=210), 0 bằng chứng
    const denom = screen.getByTestId("drill-denom");
    expect(denom).toHaveTextContent("CHƯA có bằng chứng mẫu nào");
    expect(denom).toHaveTextContent("17 bản ghi");
    expect(screen.queryByTestId("drill-lines")).not.toBeInTheDocument();
  });

  it("Esc đóng panel (hành vi Modal, không dựng lối đóng riêng)", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    clickRow(0);
    expect(screen.getByTestId("drill-denom")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("drill-denom")).not.toBeInTheDocument();
  });
});

describe("QuantifyWidget — drill-down hàng gộp 'Khác (+N)'", () => {
  it("bấm hàng gộp → liệt kê các NHÓM bị cắt (không phải bản ghi), số nhóm khớp nhãn '(+4)'", () => {
    render(<QuantifyWidget item={findItem("q1")} data={seed} dims={dims} />);
    const bars = screen.getByTestId("bars");
    // 10 hàng có tên + 1 hàng gộp = 11 (xem QuantifyWidget.test.tsx); hàng gộp ghim CUỐI.
    expect(bars.children[10]).toHaveTextContent("Khác (+4)");
    clickRow(10);
    const denom = screen.getByTestId("drill-denom");
    expect(denom).toHaveTextContent("gộp 4 nhóm nhỏ");
    expect(denom).toHaveTextContent("không phải bản ghi");
    expect(screen.getByTestId("drill-lines").children).toHaveLength(4);
    // Tên nhóm KHÔNG bọc ngoặc kép — chỉ verbatim (lời khách nói) mới được bọc.
    expect(screen.getByTestId("drill-lines").textContent).not.toContain("“");
  });
});

describe("QuantifyWidget — drill-down trục khách", () => {
  it("hàng 'Không xác định' TÁCH LẠI hai sentinel mà chart đã gộp (bài học D0 làm cho xem được)", () => {
    render(<QuantifyWidget item={findItem("q19")} data={demoData} dims={dims} />);
    const bars = screen.getByTestId("bars");
    // demoData/q19: 5 hàng có tên (đều dưới TOP_N nên không gộp đuôi) + 'Không xác định' ghim cuối.
    expect(bars.children).toHaveLength(6);
    expect(bars.children[5]).toHaveTextContent("Không xác định");
    clickRow(5);
    const denom = screen.getByTestId("drill-denom");
    expect(denom).toHaveTextContent("8 chưa biết");
    expect(denom).toHaveTextContent("9 thiếu (lỗi thu thập)");
    expect(denom).toHaveTextContent("cách chữa ngược nhau");
  });

  it("hàng khách thường: liệt kê KHÁCH (khoá đã mask), total giữ số thật khi danh sách bị cắt", () => {
    render(<QuantifyWidget item={findItem("q19")} data={demoData} dims={dims} />);
    clickRow(0); // 'tự tìm' = 62 khách, cắt còn 50 dòng
    const denom = screen.getByTestId("drill-denom");
    expect(denom).toHaveTextContent("50 khách đầu trong 62");
    expect(denom).toHaveTextContent("số trên thanh vẫn là 62");
    expect(screen.getByTestId("drill-lines").children).toHaveLength(50);
    // KHÔNG unmask: fixture đã mask, panel in nguyên.
    expect(screen.getByTestId("drill-lines").textContent).toContain("KH•••");
  });
});
