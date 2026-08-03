import type { DimRow } from "../data/schema/index.ts";
import { fx } from "../domain/format.ts";
import { nf, pv } from "./format.ts";

export type DataTableProps = {
  rows: DimRow[];
  /** Tiêu đề cột nhãn — mặc định 'Nhãn', truyền dims[item.show].label để cụ thể hơn. */
  labelHeader?: string;
  /** D0a — xem Bars.tsx: fx() chỉ hợp lệ khi dim.base==='agg'. Mặc định `true` giữ nguyên hành vi
   *  cũ cho caller chưa truyền; QuantifyWidget truyền `dim?.base === 'agg'`. */
  scaled?: boolean;
};

/* Bảng 1 chiều — VIEW thứ hai của một query 'show', cùng qRun() với chart nên không thể lệch số.
   Port tinh thần từ qTable() (prototype dòng ~1907), viết lại bằng Tailwind. Luôn hiện CẢ Count
   LẪN %, bất kể item.metric — đúng quy tắc gốc. */
export function DataTable({ rows, labelHeader = "Nhãn", scaled = true }: DataTableProps) {
  const total = rows.reduce((a, r) => a + r.v, 0);
  return (
    <table data-testid="data-table" className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="text-left px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs">
            {labelHeader}
          </th>
          <th className="text-right px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs">
            Count
          </th>
          <th className="text-right px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="px-2.5 py-1.5 border-b border-line">
              <span className="inline-flex items-center gap-1.5">
                <i className="w-2 h-2 rounded-sm flex-none" style={{ background: r.c ?? "var(--ink3)" }} />
                {r.l}
              </span>
            </td>
            <td className="px-2.5 py-1.5 border-b border-line text-right tabular-nums">
              {nf(scaled ? fx(r.v) : r.v)}
            </td>
            <td className="px-2.5 py-1.5 border-b border-line text-right tabular-nums">{pv(r.v, total)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
