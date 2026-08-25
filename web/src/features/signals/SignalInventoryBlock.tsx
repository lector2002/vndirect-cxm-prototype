import type { ReactNode } from "react";
import type { Cfg, CxmData } from "../../data/schema/index.ts";
import { signalRowStatus, type SignalRowStatusKind } from "./feedStatus.ts";
import type { SignalFacetId } from "./facets.ts";

/* Khối kiểm kê toàn hệ (module-i-signal-registry-charter.md §14 lát I4a, Việc 3). Mọi số ĐẾM TỪ
   `data`, không gõ tay.

   25/08 (owner duyệt mock rd-2508-signals-f1): dải chip ĐI THEO CỘT TRẠNG THÁI GỘP. Bản cũ là ba
   chip đọc như một câu nối ("25 receiving traffic | 5 not running — 3 spec ready · 2 not tracked")
   — mỗi chip nay đúng MỘT SỐ MỘT NGHĨA, mang chấm màu của chính bậc trạng thái nó lọc, cộng chip
   "Tất cả" làm mẫu số kiêm nút bỏ lọc. Chip "chưa gắn chỉ số" đứng tách một nhịp vì nó là trục
   khác (gắn chỉ số), không phải một bậc trạng thái.

   Vế "— N spec ready · M not tracked" trong chip not-running BỎ: hai phân nhóm đó nay đọc được
   ngay trên bảng (nhãn "Chưa chạy · có spec" / "Chưa đo" từng dòng), chip không phải chở hộ.

   18/08 tối (owner) — hai CÂU ĐẾM bước/chỉ số (T4·T7) đã RỜI sang noti ở CXM Overview
   (overview/SignalHealthNoti.tsx) — giữ nguyên quyết định đó. */

const KIND_DOT: Record<SignalRowStatusKind, string> = {
  running: "bg-good",
  trying: "bg-watch",
  "feed-lost": "bg-crit",
  "not-running": "border border-ink-3 opacity-60",
};

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

function Dot({ kind }: { kind: SignalRowStatusKind }) {
  return <span aria-hidden="true" className={`inline-block h-[7px] w-[7px] flex-none rounded-full ${KIND_DOT[kind]}`} />;
}

export function SignalInventoryBlock({
  data,
  cfg,
  facet,
  onFacet,
}: {
  data: CxmData;
  cfg: Cfg;
  facet: SignalFacetId | null;
  onFacet: (next: SignalFacetId | null) => void;
}) {
  const counts: Record<SignalRowStatusKind, number> = {
    running: 0,
    trying: 0,
    "feed-lost": 0,
    "not-running": 0,
  };
  for (const s of data.signals) counts[signalRowStatus(s, data, cfg).kind] += 1;
  const noMetric = data.signals.filter((s) => s.metrics.length === 0).length;

  const KIND_CHIPS: readonly { id: SignalFacetId & SignalRowStatusKind; testId: string; label: string }[] = [
    { id: "running", testId: "inv-running", label: "Đang chạy" },
    { id: "trying", testId: "inv-trying", label: "Đang thử" },
    { id: "feed-lost", testId: "inv-feed-lost", label: "Mất dữ liệu" },
    { id: "not-running", testId: "inv-not-running", label: "Chưa chạy" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="signal-inventory">
      {/* "Tất cả" cũng là nút BỎ lọc — bấm nó khi đang lọc trả facet về null. Mẫu số ở trong chip
          thay vì đứng trần: cả dải là một hàng lựa chọn, một phần tử trần lẫn giữa sẽ trông như
          nhãn của chip đầu. */}
      <ul className="flex flex-wrap items-center gap-2">
        <li className="flex">
          <button
            type="button"
            data-testid="inv-total"
            aria-pressed={facet === null}
            onClick={() => onFacet(null)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
              facet === null
                ? "border-primary bg-primary-soft font-semibold text-primary"
                : "border-line bg-surface text-ink-2 hover:border-ink-3 hover:text-ink"
            }`}
          >
            <b className="tabular-nums">{data.signals.length}</b> Tất cả
          </button>
        </li>
        {KIND_CHIPS.map((c) => (
          <FacetChip key={c.id} id={c.id} testId={c.testId} active={facet === c.id} onToggle={onFacet}>
            <Dot kind={c.id} />
            <span>
              <b className="tabular-nums">{counts[c.id]}</b> {c.label}
            </span>
          </FacetChip>
        ))}
      </ul>

      <ul className="ml-2 flex flex-wrap items-center gap-2">
        <FacetChip
          id="no-metric"
          testId="inv-signal-no-metric"
          active={facet === "no-metric"}
          onToggle={onFacet}
        >
          <span>
            <b className="tabular-nums">{noMetric}</b> chưa gắn chỉ số
          </span>
        </FacetChip>
      </ul>
    </div>
  );
}
