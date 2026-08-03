/** Số dòng muốn hiển thị trên một chart rank/bảng: một số cụ thể, hoặc 'all' = tất cả. */
export type CountValue = number | "all";

export type CountFilterProps = {
  value: CountValue;
  /** Tổng số dòng có thật (M) — để hiện "N/M" và lọc bỏ mốc lớn hơn M. */
  total: number;
  onChange: (v: CountValue) => void;
  /** Các mốc gợi ý; mốc ≥ total bị ẩn (vô nghĩa). Mặc định 5/10/20. */
  options?: number[];
};

const chip = "text-xs px-2 py-1 rounded border transition-colors";
const chipOff = "border-line text-ink-2 hover:bg-surface-2";
const chipOn = "bg-primary text-white border-primary";

/* Filter số lượng hiển thị — nội dung nằm bên TRONG panel Popover ▽ ở QuantifyDetail (S2.6b:
   Popover đã lo việc mở/đóng, CountFilter không tự quản `open`/chip trigger nữa). Thuần props: state
   limit sống ở QuantifyDetail. */
export function CountFilter({ value, total, onChange, options = [5, 10, 20] }: CountFilterProps) {
  const opts = options.filter((n) => n < total);
  const shown = value === "all" ? total : Math.min(value, total);

  return (
    <div className="flex flex-col gap-2" data-testid="count-filter">
      <span className="text-xs text-ink-2">
        Hiện {shown}/{total}
      </span>
      <div className="flex gap-1 flex-wrap" role="group" aria-label="Số dòng hiển thị">
        {opts.map((n) => (
          <button
            key={n}
            type="button"
            className={`${chip} ${value === n ? chipOn : chipOff}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className={`${chip} ${value === "all" ? chipOn : chipOff}`}
          onClick={() => onChange("all")}
        >
          Tất cả
        </button>
      </div>
    </div>
  );
}
