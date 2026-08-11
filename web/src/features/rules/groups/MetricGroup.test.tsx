import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useCxmStore } from "../../../store/store.ts";
import { MetricGroup } from "./MetricGroup.tsx";
import { metricFreshnessText } from "../../../domain/index.ts";

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

  /* D1 (module-i §5, I3) — chỗ DUY NHẤT chuỗi độ tươi hiện lên màn. Quét MỌI chỉ số: ca lộ bệnh là
     chỉ số mà chuỗi gõ tay khác số thật (`m-ocr` khai 4 giờ, nguồn thật 6 giờ), bốc một dòng bất kỳ
     là test xanh rỗng. Không ghim chuỗi nào — cả hai vế đều suy từ fixture. */
  it("mọi dòng chỉ số hiện chuỗi độ tươi SINH từ nguồn, và không còn chuỗi gõ tay Metric.freshness", () => {
    const { data, cfg } = useCxmStore.getState();
    render(<MetricGroup />);

    expect(data.metrics.length).toBeGreaterThan(0);
    let soCaLech = 0;
    for (const m of data.metrics) {
      const row = screen.getByTestId(`metric-row-${m.id}`);
      expect(within(row).getByTestId(`metric-freshness-${m.id}`)).toHaveTextContent(
        metricFreshnessText(m, data, cfg),
      );
      if (!metricFreshnessText(m, data, cfg).includes(m.freshness)) {
        soCaLech++;
        expect(row).not.toHaveTextContent(m.freshness);
      }
    }
    // Chốt chống rỗng: fixture phải còn ít nhất một ca chuỗi gõ tay lệch, nếu không vòng trên không kiểm gì.
    expect(soCaLech).toBeGreaterThan(0);
  });
});
