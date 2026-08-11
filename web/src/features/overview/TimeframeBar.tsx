import { useCxmStore } from "../../store/store.ts";
import { useTimeframeStore } from "../../store/timeframe.ts";
import { effectiveMonths, maxRealMonths, RANGE_MONTHS, type RangeKey } from "./sec.ts";

/* Thanh timeframe GLOBAL kiểu Enterpret — mount 1 lần ở App Shell (App.tsx), hiện trên mọi route
   CÓ dữ liệu/chart. Đọc/ghi state qua useTimeframeStore (KHÔNG local state, KHÔNG localStorage).
   `useStore` injectable (mirror OverviewPageProps) để test cô lập khỏi store thật. */
export type TimeframeBarProps = {
  useStore?: typeof useCxmStore;
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "7d", label: "7D" },
  { key: "14d", label: "14D" },
  { key: "4w", label: "4W" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "12m", label: "12M" },
  { key: "custom", label: "Custom" },
];

/** 3 mốc "mịn hơn tháng" — data hiện monthly-only nên không có dữ liệu ngày thật cho các mốc này
    (xem RANGE_MONTHS/effectiveMonths ở sec.ts). */
const FINE_RANGES = new Set<RangeKey>(["7d", "14d", "4w"]);

const seg = "text-[13px] px-3 py-1.5 rounded-sm font-semibold transition-colors";
const segOn = "bg-white text-primary shadow-sm";
const segOff = "bg-transparent text-ink-3 hover:text-ink";
const segDisabled = "bg-transparent text-ink-3 opacity-50 cursor-not-allowed";

export function TimeframeBar({ useStore = useCxmStore }: TimeframeBarProps) {
  const data = useStore((s) => s.data);
  const range = useTimeframeStore((s) => s.range);
  const setRange = useTimeframeStore((s) => s.setRange);

  const maxReal = maxRealMonths(data);
  const requested = RANGE_MONTHS[range];
  const shown = effectiveMonths(range, maxReal);
  const isFine = FINE_RANGES.has(range);
  const isCapped = !isFine && requested > maxReal;

  return (
    /* Dạng CỘT (owner chốt 03/08): hàng trên là 📅 + cụm nút segmented (chrome ngoài — border/bg/px —
       do GlobalToolbar sở hữu, TimeframeBar chỉ còn phần lõi); hàng dưới là note chú thích, tránh dồn
       ngang chật cụm nút. */
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-[15px] text-ink-3">
          📅
        </span>
        <div
          role="group"
          aria-label="Khoảng thời gian"
          className="inline-flex gap-0.5 bg-surface-2 rounded-lg p-0.5 border border-line"
        >
          {RANGE_OPTIONS.map((opt) => {
            const isCustom = opt.key === "custom";
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={opt.key === range}
                disabled={isCustom}
                /* Custom: CHƯA có date-picker thật (không bịa data theo ngày) — disabled/no-op, chỉ
                   chú thích lý do qua title (tooltip), không throw/không giả vờ hoạt động. */
                // luật 11/08: bỏ "chưa có date-picker thật"
                title={isCustom ? "Cần pipeline dữ liệu theo ngày." : undefined}
                className={`${seg} ${isCustom ? segDisabled : opt.key === range ? segOn : segOff}`}
                onClick={isCustom ? undefined : () => setRange(opt.key)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      {isFine ? (
        <span className="t-meta text-ink-3">
          {/* luật 11/08: bỏ "mốc nhỏ hơn tháng sẽ đủ khi có pipeline dữ liệu ngày/tuần" */}
          Dữ liệu hiện theo tháng — đang hiện {shown} tháng gần nhất.
        </span>
      ) : isCapped ? (
        <span className="t-meta text-ink-3">
          {/* luật 11/08: bỏ "đang hiện đủ dữ liệu có, không nội suy thêm" */}
          Chuỗi thật hiện chỉ có {maxReal} tháng.
        </span>
      ) : null}
    </div>
  );
}
