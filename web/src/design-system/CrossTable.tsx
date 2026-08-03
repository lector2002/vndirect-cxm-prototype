import type { QuantifyCrossResult } from "../domain/quantify.ts";
import { nf } from "./format.ts";

export type CrossTableProps = {
  cx: QuantifyCrossResult;
};

function cellValue(cx: QuantifyCrossResult, rowId: string, colId: string): number {
  return cx.cell[rowId]?.[colId] ?? 0;
}

/* Bảng ma trận ghép chéo — port tinh thần từ qCrossTable() (prototype dòng ~1956), viết lại bằng
   Tailwind. CỐ Ý KHÔNG áp fx(): cell là số bằng chứng MẪU thật đếm trên data.ev (như qCrossTable
   gốc dùng nf(v) trần, không nf(fx(v))) — khác số hiển thị đã scale baseline của Bars/Donut/
   DataTable vốn tính trên rows agg/cust. Nhãn "mẫu" luôn hiện (không chỉ khi multi) — quy tắc
   denom bắt buộc mọi chart phải nói rõ mẫu số. */
export function CrossTable({ cx }: CrossTableProps) {
  const multiNote = cx.multi
    ? ` · một phản hồi có thể mang nhiều ${cx.rd?.unit ?? ""}/${cx.cd?.unit ?? ""} nên tổng có thể lớn hơn số mẫu`
    : "";
  return (
    <div>
      <div className="overflow-x-auto">
        <table data-testid="cross-table" className="border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="text-left px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs whitespace-nowrap">
                {cx.rd?.label ?? ""} ↓ / {cx.cd?.label ?? ""} →
              </th>
              {cx.cols.map((c) => (
                <th
                  key={c.id}
                  className="text-right px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs"
                >
                  {c.l}
                </th>
              ))}
              <th className="text-right px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs">
                Tổng
              </th>
            </tr>
          </thead>
          <tbody>
            {cx.rows.map((r) => (
              <tr key={r.id}>
                <td className="text-left px-2.5 py-1.5 border-b border-line">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="w-2 h-2 rounded-sm flex-none" style={{ background: r.c ?? "var(--ink3)" }} />
                    {r.l}
                  </span>
                </td>
                {cx.cols.map((c) => {
                  const v = cellValue(cx, r.id, c.id);
                  return (
                    <td key={c.id} className="text-right px-2.5 py-1.5 border-b border-line tabular-nums">
                      {v ? nf(v) : "·"}
                    </td>
                  );
                })}
                <td className="text-right px-2.5 py-1.5 border-b border-line font-bold tabular-nums">
                  {nf(r.tot)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="text-left px-2.5 py-1.5 border-t-2 border-line font-bold">Tổng</td>
              {cx.cols.map((c) => (
                <td key={c.id} className="text-right px-2.5 py-1.5 border-t-2 border-line font-bold tabular-nums">
                  {nf(c.tot)}
                </td>
              ))}
              <td className="text-right px-2.5 py-1.5 border-t-2 border-line font-bold tabular-nums">
                {nf(cx.grand)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-[11.5px] text-ink-3 mt-2">
        Đang hiện {nf(cx.matched)} trên {nf(cx.sampleN)} mẫu bằng chứng — tập mẫu, không phải toàn bộ bản ghi
        {multiNote}
      </div>
    </div>
  );
}
