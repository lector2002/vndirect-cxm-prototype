import type { ReactNode } from "react";
import type { CxmData } from "../../data/schema/index.ts";
import {
  isSignalRunning,
  notRunningSignals,
  runningSignalCount,
  signalsWithoutMetric,
} from "../../domain/index.ts";
import type { SignalFacetId } from "./facets.ts";

/* Khối kiểm kê toàn hệ (module-i-signal-registry-charter.md §14 lát I4a, Việc 3). Mọi số ĐẾM TỪ
   `data`, không gõ tay.

   18/08 (owner chốt redesign, phương án A): ba Ô TO thành MỘT DÒNG CHIP — khối card ba ô chiếm một
   phần ba màn đầu cho ba con số một-dòng-đọc-hết, đúng lỗi "tường KPI card" của các bản AI sinh.
   Cấu trúc dòng, ba hạng rõ ràng vì "thứ bấm được và thứ không bấm được không được trông giống
   nhau" (luật 12/08, giữ nguyên):
   · TỔNG "30 signals" là CHỮ TRẦN không viền — nó là mẫu số của cả dòng, không phải bộ lọc;
   · ba CHIP pill có viền là ba facet lọc của bảng (aria-pressed + testid GIỮ NGUYÊN từ bản ô to);
   Vế "— N spec ready · M not tracked" ở lại TRONG chip not-running: bỏ đi là số tách nhóm rời màn.

   18/08 tối (owner) — hai CÂU ĐẾM bước/chỉ số (T4·T7) RỜI khối này sang noti ngoại lệ ở CXM
   Overview (overview/SignalHealthNoti.tsx, SỬA charter §6 lần bốn trong ngày): chúng đếm BƯỚC và
   CHỈ SỐ chứ không phải tập con của bảng, và không phải thứ người dùng vào màn danh sách để đọc.
   Ràng T4 "hai số lồng trong MỘT câu" (tiêu chí 7) đi theo sang dòng noti. */

function FacetChip({
  id,
  testId,
  active,
  onToggle,
  children,
}: {
  id: SignalFacetId;
  testId: string;
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
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
          active
            ? "border-primary bg-primary-soft font-semibold text-primary"
            : "border-line bg-surface text-ink-2 hover:border-ink-3 hover:text-ink"
        }`}
      >
        {children}
      </button>
    </li>
  );
}

/** Chấm cùng ngôn ngữ với cột Traffic của bảng: đặc = đang nhận event, rỗng = không. */
function TrafficDot({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 flex-none rounded-full ${filled ? "bg-ink" : "border border-ink-3"}`}
    />
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
  const noMetricSignals = signalsWithoutMetric(data);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="signal-inventory">
      <b className="text-[13px] tabular-nums text-ink" data-testid="inv-total">
        {data.signals.length} signals
      </b>

      <ul className="flex flex-wrap items-center gap-2">
        <FacetChip id="running" testId="inv-running" active={facet === "running"} onToggle={onFacet}>
          <TrafficDot filled />
          <span>
            <b className="tabular-nums">{running.n}</b> receiving traffic
          </span>
        </FacetChip>
        <FacetChip
          id="not-running"
          testId="inv-not-running"
          active={facet === "not-running"}
          onToggle={onFacet}
        >
          <TrafficDot filled={false} />
          <span>
            <b className="tabular-nums">{notRunningTotal}</b> not running —{" "}
            <b className="tabular-nums">{notRunning.designed.length}</b> spec ready ·{" "}
            <b className="tabular-nums">{notRunning.gap.length}</b> not tracked
          </span>
        </FacetChip>
        <FacetChip
          id="no-metric"
          testId="inv-signal-no-metric"
          active={facet === "no-metric"}
          onToggle={onFacet}
        >
          <span>
            <b className="tabular-nums">{noMetricSignals.length}</b> no linked metric
          </span>
        </FacetChip>
      </ul>
    </div>
  );
}
