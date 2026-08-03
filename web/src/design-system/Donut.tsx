import type { DimRow } from "../data/schema/index.ts";
import { fx } from "../domain/format.ts";
import { nf, pv } from "./format.ts";

/* Palette dự phòng khi row.c không có — port 1-1 từ PAL trong donut() (prototype dòng 1888). */
const DONUT_PALETTE = ["var(--primary)", "#7A8B99", "#A8B4BD", "#C6CDD2", "#DDE1E4", "#EBEDEF", "#F4F5F6"];

/* D6a (owner chốt 02/08): hệ màu phân loại (`--cat-1`..`--cat-5`, seed.ts data.cats) chỉ có 5 màu.
   Một donut 14 lát buộc phải LẶP màu — hai lát cùng màu trong cùng một donut là đọc sai (không
   phân biệt được lát nào là lát nào chỉ bằng màu). Giữ 5 lát lớn nhất (rows đã sort desc từ
   qRun()), gộp phần đuôi thành một lát "Khác (+N)" màu `--cat-other` (index.css, dành riêng cho
   trường hợp này). N = SỐ LƯỢNG mục bị gộp, không phải tổng giá trị — người xem cần biết "còn bao
   nhiêu mục khác", không phải trọng số của chúng (trọng số đã có trong % của chính lát Khác). */
const MAX_SLICES = 5;
const OTHER_COLOR = "var(--cat-other)";

export type DonutProps = {
  rows: DimRow[];
  /** Nhãn nhỏ dưới số ở tâm donut (vd 'bản ghi phản hồi'). */
  centerLabel?: string;
  /** D0a — xem Bars.tsx: fx() chỉ hợp lệ khi dim.base==='agg'. Mặc định `true` giữ nguyên hành vi
   *  cũ cho caller chưa truyền; QuantifyWidget truyền `dim?.base === 'agg'`. */
  scaled?: boolean;
  /** D6a: bấm lát/mục "Khác (+N)" → mở bảng đầy đủ (view='table' của cùng item). Vắng thì lát Khác
   *  chỉ hiển thị tĩnh, không bấm được — Donut không tự dựng modal/điều hướng mới. */
  onOtherClick?: () => void;
  /** D2b tinh chỉnh #2 (owner chốt 03/08): id của MỘT row PHẢI luôn là một lát riêng ghim CUỐI,
   *  không bao giờ bị gộp vào "Khác (+N)" — dùng cho hàng "Không xác định" (QuantifyWidget
   *  cust-branch truyền "__unknown__") nhưng Donut giữ GENERIC, không hardcode giá trị cụ thể nào.
   *  Vắng (caller khác không truyền) thì hành vi y hệt trước đây. */
  pinnedLastId?: string;
};

/* Donut CSS thuần bằng conic-gradient — port tinh thần từ donut() (prototype dòng 1887), viết lại
   bằng Tailwind. Số ở tâm áp fx() (scale baseline 6 tháng, tuỳ `scaled`); legend hiện % trên tổng
   TẤT CẢ rows gốc (kể cả những rows đã gộp vào "Khác" — % không đổi vì gộp chỉ đổi CÁCH NHÓM, không
   đổi mẫu số). */
export function Donut({ rows, centerLabel, scaled = true, onOtherClick, pinnedLastId }: DonutProps) {
  const total = rows.reduce((a, r) => a + r.v, 0);
  // Tách lát ghim (nếu có) RA TRƯỚC khi áp MAX_SLICES — grouping "Khác" chỉ tính trên phần còn lại
  // (`main`), lát ghim luôn xuất hiện riêng ở CUỐI, không bao giờ bị gộp.
  const pinned = pinnedLastId ? rows.find((r) => r.id === pinnedLastId) : undefined;
  const main = pinned ? rows.filter((r) => r.id !== pinnedLastId) : rows;
  const groupedMain: DimRow[] =
    main.length > MAX_SLICES
      ? [
          ...main.slice(0, MAX_SLICES),
          {
            id: "__other__",
            l: `Khác (+${main.length - MAX_SLICES})`,
            v: main.slice(MAX_SLICES).reduce((a, r) => a + r.v, 0),
            c: OTHER_COLOR,
          },
        ]
      : main;
  const shown: DimRow[] = pinned ? [...groupedMain, pinned] : groupedMain;
  let acc = 0;
  const stops = shown
    .map((r, i) => {
      const angle = (r.v / (total || 1)) * 360;
      const start = acc;
      acc += angle;
      return `${r.c ?? DONUT_PALETTE[i % DONUT_PALETTE.length]} ${start.toFixed(2)}deg ${acc.toFixed(2)}deg`;
    })
    .join(",");
  return (
    <div data-testid="donut" className="flex gap-5 items-center flex-wrap">
      <div
        className="w-[150px] h-[150px] rounded-full flex-none relative"
        style={{ background: `conic-gradient(${stops || "var(--line) 0deg 360deg"})` }}
      >
        <div className="absolute inset-[30px] bg-surface rounded-full" />
        <div className="absolute inset-0 grid place-content-center text-center">
          <b className="block text-xl font-semibold tabular-nums">{nf(scaled ? fx(total) : total)}</b>
          {centerLabel ? (
            <span className="block text-[10.5px] text-ink-3 max-w-[72px] leading-tight">{centerLabel}</span>
          ) : null}
        </div>
      </div>
      <div data-testid="donut-legend" className="grid gap-1.5 min-w-[200px] flex-1">
        {shown.map((r, i) => {
          const isOther = r.id === "__other__";
          const clickable = isOther && Boolean(onOtherClick);
          return (
            <div
              key={r.id}
              className={`flex items-center gap-2 text-[12.5px]${clickable ? " cursor-pointer" : ""}`}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? onOtherClick : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOtherClick?.();
                      }
                    }
                  : undefined
              }
            >
              <i
                className="w-2.5 h-2.5 rounded-sm flex-none"
                style={{ background: r.c ?? DONUT_PALETTE[i % DONUT_PALETTE.length] }}
              />
              <span className="flex-1 text-ink-2">{r.l}</span>
              <b className="tabular-nums">{pv(r.v, total)}%</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
