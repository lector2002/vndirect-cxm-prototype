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

    const toggle = screen.getByLabelText("Watch Liveness completion");
    fireEvent.click(toggle);

    const rowAfter = screen.getByTestId("metric-row-m-liveness");
    // Tắt xong: hai ô ngưỡng (watch + crit) đều thành "—", và badge trạng thái đổi thành "No data".
    expect(within(rowAfter).getAllByText("—")).toHaveLength(2);
    expect(within(rowAfter).getByTestId("badge")).toHaveTextContent("No data");
  });

  /* Luật 11/08: chuỗi độ tươi (Metric.freshness, gõ tay) đã bỏ khỏi bảng — bảng giờ KHÔNG khai gì
     về độ tươi. Quét MỌI chỉ số, kèm chốt chống rỗng: fixture phải còn ít nhất một freshness không
     rỗng, nếu không vòng dưới không kiểm gì. */
  it("không dòng chỉ số nào hiện chuỗi gõ tay Metric.freshness", () => {
    const { data } = useCxmStore.getState();
    render(<MetricGroup />);

    expect(data.metrics.length).toBeGreaterThan(0);
    expect(data.metrics.some((m) => m.freshness.length > 0)).toBe(true);
    for (const m of data.metrics) {
      if (!m.freshness) continue;
      const row = screen.getByTestId(`metric-row-${m.id}`);
      expect(row).not.toHaveTextContent(m.freshness);
    }
  });
});
