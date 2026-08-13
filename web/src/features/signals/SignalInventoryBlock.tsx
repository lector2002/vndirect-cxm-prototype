import type { ReactNode } from "react";
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
import type { SignalFacetId } from "./facets.ts";

/* Khối ① — KIỂM KÊ toàn hệ (module-i-signal-registry-charter.md §14 lát I4a, Việc 3). Mọi số ĐẾM
   TỪ `data`, không gõ tay, và mỗi số kèm mẫu số.

   Hai số bước ("không có điểm đo nào đang chạy" / "không có điểm đo nào cả") LỒNG NHAU — viết trong
   MỘT câu duy nhất ("…, trong đó…"), không phải hai ô cạnh nhau: người đọc sẽ cộng lại nếu tách rời
   (charter T4, tiêu chí nghiệm thu 7 của lát này).

   12/08 (redesign): ba dòng ĐẦU là tập con của bảng bên dưới nên chúng thành NÚT — bấm là bảng tô
   đúng tập đó lên đầu. Hai dòng cuối đếm BƯỚC và CHỈ SỐ, không phải tập con của bảng, nên ở lại
   dạng câu dữ liệu — cố tình để chúng KHÁC hình dạng với ba nút trên, thứ bấm được và thứ không
   bấm được không được trông giống nhau. Câu chữ và mọi testid giữ nguyên.

   12/08 (redesign layout): khối đứng NGANG hết bề ngang màn, ngay trên bảng nó lọc, thay cho ô
   vuông nửa màn xếp cạnh khối ②. Ba lý do:
   · Ba nút này là BỘ LỌC của bảng. Bộ lọc phải chạm được bảng bằng mắt — trước đây nút ở cột trái
     còn ô tìm của cùng một bảng ở dưới cách ~300px, hai nửa của một thao tác nằm hai chỗ.
   · Khối ② là bảng năm cột, khối ① là năm câu ngắn: xếp hai cái vào lưới hai cột đều nhau là lấy
     mặc định của framework làm thứ bậc, và nó đẩy BẢNG — thứ duy nhất người dùng đến đây để đọc —
     xuống dưới mép màn đầu.
   · Ba nút nằm cùng một hàng thì đọc được như MỘT phép chia của cùng mẫu số 30, thay vì ba dòng
     rời phải tự cộng lại trong đầu.

   12/08 (owner) — TÊN KHỐI THEO QUY ƯỚC CỤM DANH TỪ: "① Có đo không?" → "① Kiểm kê điểm đo". Tên
   khối gọi thứ khối chứa, không hỏi lại người đọc câu mà chính nó trả lời. Tên mới KHÔNG được dùng
   danh từ mà bất biến 9 vế 1 cấm (charter §9 mục 9) — đó lại đúng là danh từ dễ rơi vào nhất khi bỏ
   dạng câu hỏi, nên "kiểm kê" là chữ chọn thay. Câu chữ trong ba
   ô và hai dòng đếm GIỮ NGUYÊN: chúng tả dữ liệu, không phải tên. */

function FacetTile({
  id,
  testId,
  ratio,
  active,
  onToggle,
  children,
}: {
  id: SignalFacetId;
  testId: string;
  /** Vế "N / M" đứng riêng một dòng, ĐẦU node — cỡ chữ to hơn nhãn để mắt quét ba số trước, đọc
      nhãn sau. Tách khỏi `children` chứ không nhét chung một câu: ba ô chỉ so được với nhau khi ba
      con số nằm cùng một đường ngang. */
  ratio: ReactNode;
  active: boolean;
  onToggle: (next: SignalFacetId | null) => void;
  children: ReactNode;
}) {
  return (
    <li className="flex">
      <button
        type="button"
        data-testid={testId}
        aria-pressed={active}
        onClick={() => onToggle(active ? null : id)}
        className={`flex w-full flex-col items-start gap-1 rounded-[10px] border px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
          active
            ? "border-primary bg-primary-soft"
            : "border-line-soft bg-surface-2 hover:border-line hover:bg-surface"
        }`}
      >
        <span className={`text-[16px] font-bold tabular-nums ${active ? "text-primary" : "text-ink"}`}>
          {ratio}
        </span>
        <span className="text-[12.5px] leading-snug text-ink-2">{children}</span>
      </button>
    </li>
  );
}

export function SignalInventoryBlock({
  data,
  facet,
  onFacet,
}: {
  data: CxmData;
  facet: SignalFacetId | null;
  onFacet: (next: SignalFacetId | null) => void;
}) {
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
    <Card title="① Kiểm kê điểm đo">
      <div className="flex flex-col gap-3">
        <ul className="grid grid-cols-3 items-stretch gap-2.5">
          <FacetTile
            id="running"
            testId="inv-running"
            ratio={`${running.n} / ${running.of}`}
            active={facet === "running"}
            onToggle={onFacet}
          >
            điểm đo đang chở lưu lượng
          </FacetTile>
          <FacetTile
            id="not-running"
            testId="inv-not-running"
            ratio={`${notRunningTotal} / ${data.signals.length}`}
            active={facet === "not-running"}
            onToggle={onFacet}
          >
            khai mà chưa chạy — <b className="tabular-nums">{notRunning.designed.length}</b> dự định
            làm, <b className="tabular-nums">{notRunning.gap.length}</b> biết thiếu chưa làm
          </FacetTile>
          <FacetTile
            id="no-metric"
            testId="inv-signal-no-metric"
            ratio={`${noMetricSignals.length} / ${data.signals.length}`}
            active={facet === "no-metric"}
            onToggle={onFacet}
          >
            điểm đo không nuôi chỉ số nào
          </FacetTile>
        </ul>

        {/* Hai câu KHÔNG bấm được: không viền, không nền, chữ nhỏ hơn — khác hẳn ba ô trên để không
            ai thử bấm. Xếp NGANG cạnh nhau vì chúng cùng một loại (đếm thứ ngoài bảng này). */}
        <ul className="flex flex-wrap gap-x-8 gap-y-1 border-t border-line-soft pt-2.5 text-[13px] text-ink-2">
          <li data-testid="inv-steps-nested">
            <b className="tabular-nums text-ink">
              {steps.noneRunning.length} / {data.steps.length}
            </b>{" "}
            bước không có điểm đo nào đang chạy, trong đó{" "}
            <b className="tabular-nums text-ink">{steps.none.length}</b> không có điểm đo nào cả
          </li>
          <li data-testid="inv-metric-no-signal">
            <b className="tabular-nums text-ink">
              {noSignalMetrics.length} / {data.metrics.length}
            </b>{" "}
            chỉ số không có điểm đo nào nuôi
          </li>
        </ul>
      </div>
    </Card>
  );
}
