import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useCxmStore } from "../../../store/store.ts";
import { StepGroup } from "./StepGroup.tsx";

/* Container — dùng store singleton thật (useCxmStore), cùng khuôn WorkPage.test.tsx: mọi số kỳ
   vọng SUY LẠI từ dữ liệu thật (đo bằng script một lần, xem báo cáo worker), không chép hằng cứng.

   afterEach gọi `setCfg({ step: cfgDefault.step })` — patch này luôn về đúng mặc định VÀ (qua
   refresh() trong store.ts) đọc lại `data` từ repo thật, nên cũng dọn sạch mọi `data` bị ghi đè
   trực tiếp qua `useCxmStore.setState` ở bài kiểm dưới (không cần dòng reset riêng cho `data`). */
afterEach(() => {
  const { cfgDefault, setCfg } = useCxmStore.getState();
  setCfg({ step: cfgDefault.step });
});

describe("StepGroup", () => {
  it("đổi step.failCrit qua ô nhập ⇒ nhãn trạng thái của bước s2 đổi trong cùng màn", () => {
    render(<StepGroup />);

    // s2 (Xác thực CCCD · VNeID/NFC): fail rate ~10,46% — dưới failCrit mặc định (15%) nên đang
    // 'watch'. Nằm trong top 6 hiện sẵn (2 bước 'crit' + 4 bước 'watch' đầu tiên theo thứ tự khai).
    const rowBefore = screen.getByTestId("step-apply-s2");
    expect(rowBefore).toHaveTextContent("Cần theo dõi");

    const input = screen.getByLabelText("Ngưỡng xử lý ngay tỷ lệ thất bại");
    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.blur(input);

    const rowAfter = screen.getByTestId("step-apply-s2");
    expect(rowAfter).toHaveTextContent("Cần xử lý ngay");
  });

  it("bước không có dòng quan sát KHÔNG xuất hiện trong khối kết quả, và số bị loại đếm ra chữ", () => {
    const data = useCxmStore.getState().data;
    // s6 đang có obs (state 'ok') — bỏ dòng obs của nó để giả lập ca "bước chưa đo".
    const withoutS6Obs = { ...data, obs: data.obs.filter((o) => o.stepId !== "s6") };
    useCxmStore.setState({ data: withoutS6Obs });

    render(<StepGroup />);

    expect(screen.queryByTestId("step-apply-s6")).not.toBeInTheDocument();
    expect(screen.getByTestId("step-excluded-note")).toHaveTextContent(
      "1 bước chưa có dữ liệu quan sát nên không chấm được",
    );
  });
});
