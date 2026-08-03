import type { BaseFilterValue, KindFilterValue, ViewFilterValue } from "./quantifyFilter.ts";

export type ChipOption<T extends string> = { value: T; label: string; count: number };

export type QuantifyFilterBarProps = {
  kind: KindFilterValue;
  base: BaseFilterValue;
  view: ViewFilterValue;
  /** Danh sách option + count đã tính sẵn ở QuantifyPage (tổng theo data.qt chưa lọc). */
  kindOptions: ChipOption<KindFilterValue>[];
  baseOptions: ChipOption<BaseFilterValue>[];
  viewOptions: ChipOption<ViewFilterValue>[];
  onKind: (v: KindFilterValue) => void;
  onBase: (v: BaseFilterValue) => void;
  onView: (v: ViewFilterValue) => void;
  /** Xóa 3 nhóm chip (kind/base/view) về mặc định. KHÔNG chạm tới search: ô search giờ nằm ngoài
      popover, luôn hiện, và tự có nút × của nó (QuantifySearch) — nút trong đây xóa luôn cái người
      dùng đang thấy bên ngoài thì khó hiểu. */
  onClear: () => void;
};

const chip = "text-xs px-2 py-1 rounded border";
const chipOff = "border-line text-ink-2 hover:bg-surface-2";
const chipOn = "bg-primary text-white border-primary";

function ChipGroup<T extends string>({
  group,
  groupLabel,
  options,
  active,
  onSelect,
}: {
  group: string;
  groupLabel: string;
  options: ChipOption<T>[];
  active: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap items-center" role="group" aria-label={groupLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-testid={`qfilter-${group}-${opt.value}`}
          className={`${chip} ${active === opt.value ? chipOn : chipOff}`}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label} <span className="opacity-60">{opt.count}</span>
        </button>
      ))}
    </div>
  );
}

/* 3 nhóm chip (kind/base/view) của thư viện Quantify — thuần presentational, state kind/base/view
   sống ở QuantifyPage (local useState, KHÔNG Zustand). Port 1-1 nhãn/nhóm từ quantifyLib() prototype
   (dòng 2443-2494): TYPES / GKEYS / VIEWS.
   Input `q-search` ĐÃ DỜI ra khỏi đây sang QuantifySearch.tsx (owner chốt 02/08: ô tìm phải luôn
   hiện trên toolbar, không nấp trong popover). Chip ở lại vì chúng là thu hẹp tập, khác lớp tương
   tác với việc tìm một chart đã biết tên. */
export function QuantifyFilterBar({
  kind,
  base,
  view,
  kindOptions,
  baseOptions,
  viewOptions,
  onKind,
  onBase,
  onView,
  onClear,
}: QuantifyFilterBarProps) {
  const anyActive = kind !== "all" || base !== "all" || view !== "all";
  return (
    <div data-testid="quantify-filterbar" className="flex flex-col gap-3">
      <ChipGroup group="kind" groupLabel="Lọc theo kiểu chart" options={kindOptions} active={kind} onSelect={onKind} />
      {/* Nhãn nhóm base/view port 1-1 title="" của .fchips trong quantifyLib() (prototype dòng 2487, 2491). */}
      <ChipGroup group="base" groupLabel="Lọc theo nền dữ liệu" options={baseOptions} active={base} onSelect={onBase} />
      <ChipGroup group="view" groupLabel="Lọc theo cách xem mặc định" options={viewOptions} active={view} onSelect={onView} />
      {/* Nút xóa lọc chỉ hiện khi đang có chip active — tránh nút thừa khi chưa lọc gì. Dời xuống
          cuối vì hàng trên (chỗ nó đứng cùng input search) đã không còn. */}
      {anyActive ? (
        <div>
          <button type="button" data-testid="qfilter-clear" className={`${chip} ${chipOff}`} onClick={onClear}>
            Xóa bộ lọc
          </button>
        </div>
      ) : null}
    </div>
  );
}
