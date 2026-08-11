import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCxmStore } from "../../../store/store.ts";
import { WeightGroup } from "./WeightGroup.tsx";

/* Ghim bất biến "chỉ đọc" của nhóm Trọng số ưu tiên — đây là thứ dễ bị một phiên sau vô tình nới ra
   (charter mục "Vì sao nhóm 6 chỉ đọc"): fixture lưu điểm TUYỆT ĐỐI và validateFixture() khẳng định
   sev+aff+jc+rep+tr+reg===total, nên sửa một trọng số tại đây mà không tính lại total sẽ bắn banner
   đỏ trên mọi màn. Test này canh thẳng KHÔNG có control ghi nào, không đoán qua tên biến. */

const PRI_KEYS = ["sev", "aff", "jc", "rep", "tr", "reg"] as const;

describe("WeightGroup — bảng 6 thành phần ưu tiên, chỉ đọc", () => {
  it("không render bất kỳ input / select / checkbox nào", () => {
    const { container } = render(<WeightGroup />);
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(container.querySelectorAll("select").length).toBe(0);
    expect(container.querySelectorAll('[type="checkbox"]').length).toBe(0);
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("in đúng điểm cao nhất của từng thành phần, đối chiếu bằng phép max tính độc lập", () => {
    render(<WeightGroup />);
    const { data } = useCxmStore.getState();
    for (const k of PRI_KEYS) {
      const expected = Math.max(...data.iss.map((i) => i.pri[k]));
      const row = screen.getByTestId(`weight-row-${k}`);
      expect(row.textContent).toContain(String(expected));
    }
  });

  it("luật 11/08: đã bỏ ghi chú luận giải, bất biến chỉ đọc vẫn giữ qua việc không có control ghi nào", () => {
    const { container } = render(<WeightGroup />);
    expect(screen.queryByText(/Vì sao nhóm này chỉ đọc/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rủi ro pháp lý là thành phần đặc thù/)).not.toBeInTheDocument();
    expect(container.querySelectorAll("input, select, button").length).toBe(0);
  });
});
