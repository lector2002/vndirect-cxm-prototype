import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useCxmStore } from "../../../store/store.ts";
import { MetricGroup } from "./MetricGroup.tsx";

/* Container — dùng store singleton thật, cùng khuôn WorkPage.test.tsx. */
afterEach(() => {
  const { cfgDefault, setCfg } = useCxmStore.getState();
  setCfg({ metric: cfgDefault.metric });
});

describe("MetricGroup", () => {
  it("tắt on của một chỉ số ⇒ chỉ số đó mất nhãn trạng thái và hai ô ngưỡng thành '—'", () => {
    render(<MetricGroup />);

    const rowBefore = screen.getByTestId("metric-row-m-liveness");
    // Đang bật: có ô nhập ngưỡng, không có ô nào hiện "—".
    expect(within(rowBefore).queryByText("—")).not.toBeInTheDocument();

    const toggle = screen.getByLabelText("Theo dõi Liveness completion");
    fireEvent.click(toggle);

    const rowAfter = screen.getByTestId("metric-row-m-liveness");
    // Tắt xong: hai ô ngưỡng (watch + crit) đều thành "—", và badge trạng thái đổi thành "Chưa đo được".
    expect(within(rowAfter).getAllByText("—")).toHaveLength(2);
    expect(within(rowAfter).getByTestId("badge")).toHaveTextContent("Chưa đo được");
  });
});
