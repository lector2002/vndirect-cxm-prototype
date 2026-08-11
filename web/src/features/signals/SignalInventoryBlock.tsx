import type { CxmData } from "../../data/schema/index.ts";
import {
  isSignalRunning,
  metricsWithoutSignal,
  notRunningSignals,
  runningSignalCount,
  signalsWithoutMetric,
  stepsWithoutRunningSignal,
} from "../../domain/index.ts";
import { Card } from "../../design-system/index.ts";

/* Khối ① — KIỂM KÊ toàn hệ (module-i-signal-registry-charter.md §14 lát I4a, Việc 3). Mọi số ĐẾM
   TỪ `data`, không gõ tay, và mỗi số kèm mẫu số.

   Hai số bước ("không có điểm đo nào đang chạy" / "không có điểm đo nào cả") LỒNG NHAU — viết trong
   MỘT câu duy nhất ("…, trong đó…"), không phải hai ô cạnh nhau: người đọc sẽ cộng lại nếu tách rời
   (charter T4, tiêu chí nghiệm thu 7 của lát này). */
export function SignalInventoryBlock({ data }: { data: CxmData }) {
  const running = runningSignalCount(data);
  const notRunning = notRunningSignals(data);
  // Đếm lại TRỰC TIẾP bằng !isSignalRunning, không cộng designed.length + gap.length: nếu tương lai
  // có signal st='live'/'validating' mà vol=0 (không có trong data hôm nay), cộng hai nhóm sẽ lặng
  // lẽ bỏ sót ca đó khỏi mẫu số "khai mà chưa chạy" — cùng lỗi §7 charter cảnh báo (đừng suy diễn
  // ngầm một quan hệ D5 không ép).
  const notRunningTotal = data.signals.filter((s) => !isSignalRunning(s)).length;
  const steps = stepsWithoutRunningSignal(data);
  const noMetricSignals = signalsWithoutMetric(data);
  const noSignalMetrics = metricsWithoutSignal(data);

  return (
    <Card title="① Có đo không?">
      <ul className="space-y-2.5 text-[13px]">
        <li data-testid="inv-running">
          <b className="tabular-nums">
            {running.n} / {running.of}
          </b>{" "}
          điểm đo đang chở lưu lượng
        </li>
        <li data-testid="inv-not-running">
          <b className="tabular-nums">
            {notRunningTotal} / {data.signals.length}
          </b>{" "}
          khai mà chưa chạy — <b className="tabular-nums">{notRunning.designed.length}</b> dự định
          làm, <b className="tabular-nums">{notRunning.gap.length}</b> biết thiếu chưa làm
        </li>
        <li data-testid="inv-steps-nested">
          <b className="tabular-nums">
            {steps.noneRunning.length} / {data.steps.length}
          </b>{" "}
          bước không có điểm đo nào đang chạy, trong đó{" "}
          <b className="tabular-nums">{steps.none.length}</b> không có điểm đo nào cả
        </li>
        <li data-testid="inv-signal-no-metric">
          <b className="tabular-nums">
            {noMetricSignals.length} / {data.signals.length}
          </b>{" "}
          điểm đo không nuôi chỉ số nào
        </li>
        <li data-testid="inv-metric-no-signal">
          <b className="tabular-nums">
            {noSignalMetrics.length} / {data.metrics.length}
          </b>{" "}
          chỉ số không có điểm đo nào nuôi
        </li>
      </ul>
    </Card>
  );
}
