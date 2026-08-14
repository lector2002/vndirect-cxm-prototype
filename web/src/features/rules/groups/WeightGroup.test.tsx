import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PRI_KEYS, isRankable, scoreIssues } from "../../../data/priority.ts";
import { useCxmStore } from "../../../store/store.ts";
import { WeightGroup } from "./WeightGroup.tsx";

/* Nhóm 6 MỞ KHOÁ 14/08 (ADR-002 §13). Bộ test cũ ghim bất biến ngược lại — "không render bất kỳ
   input/select/button nào" — với lý do fixture lưu điểm tuyệt đối và `validate` canh tổng thành
   phần. Lý do đó chết cùng `iss[].pri`, nên bất biến cũng phải chết, không được để lại làm luật mồ
   côi ghim một màn chỉ-đọc mà ADR vừa yêu cầu mở.

   Ba thứ đáng canh ở đây, không cái nào là "có ô nhập hay không":
     1. đủ BẢY ô, một ô cho mỗi khoá — thiếu ô là một khoá không sửa được mà không ai báo;
     2. tổng ≠ 100 thì KHÔNG lưu được — đây là ràng buộc duy nhất giữa bảy ô;
     3. bảng xem trước dùng CHÍNH `scoreIssues`, nên nó không thể nói khác `#/work`. */

describe("WeightGroup — trọng số sửa được, xem trước trước khi lưu", () => {
  it("render đúng một ô nhập cho mỗi khoá ưu tiên", () => {
    const { container } = render(<WeightGroup />);
    expect(container.querySelectorAll("input").length).toBe(PRI_KEYS.length);
  });

  it("trọng số mặc định cộng lại đúng 100, đọc lại từ cfg chứ không ghim số", () => {
    render(<WeightGroup />);
    const { cfg } = useCxmStore.getState();
    const sum = PRI_KEYS.reduce((a, k) => a + cfg.pri.w[k], 0);
    expect(sum).toBe(100);
    expect(screen.getByTestId("weight-sum").textContent).toContain(`Tổng: ${sum}`);
  });

  it("sửa một ô làm tổng lệch 100 → nút lưu bị khoá và nói còn thiếu bao nhiêu", () => {
    const { container } = render(<WeightGroup />);
    const { cfg } = useCxmStore.getState();
    const first = container.querySelectorAll("input")[0] as HTMLInputElement;
    const lowered = cfg.pri.w[PRI_KEYS[0]] - 5;

    fireEvent.change(first, { target: { value: String(lowered) } });
    fireEvent.blur(first);

    expect(screen.getByTestId("weight-apply")).toBeDisabled();
    expect(screen.getByTestId("weight-sum").textContent).toContain("còn 5 nữa mới đủ 100");
    // cfg KHÔNG bị ghi khi bản nháp còn sai — bản nháp sống trong nhóm, không rò ra store.
    expect(useCxmStore.getState().cfg.pri.w[PRI_KEYS[0]]).toBe(cfg.pri.w[PRI_KEYS[0]]);
  });

  it("bảng xem trước khớp đúng kết quả của scoreIssues, tính độc lập trong test", () => {
    render(<WeightGroup />);
    const { data, cfg, dims } = useCxmStore.getState();
    const scores = scoreIssues(data, cfg, dims);
    const rankable = data.iss.filter((i) => {
      const s = scores.get(i.id);
      return s !== undefined && isRankable(s);
    });

    if (rankable.length === 0) {
      /* Trạng thái ĐÚNG của seed hôm nay: chưa ai điền `cfg.step.jc`/`reg` và chưa map điểm đo nên
         không điểm gãy nào đủ 7/7. Test đi theo dữ liệu chứ không ghim nhánh — điền `jc`/`reg` vào
         seed sau này là nhánh dưới tự nhận việc, không phải sửa test. */
      expect(screen.getByTestId("weight-preview-empty")).toBeInTheDocument();
      return;
    }
    for (const i of rankable) {
      expect(screen.getByTestId(`weight-rank-${i.id}`).textContent).toContain(
        String(scores.get(i.id)?.total),
      );
    }
  });
});
