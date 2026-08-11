import type { CxmData, Signal } from "../../data/schema/index.ts";
import { isSignalRunning } from "../../domain/index.ts";
import { Badge } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { SIGNAL_STATUS } from "../atlas/signalStatus.ts";

/* Bảng 30 điểm đo — F1 (số dòng LUÔN bằng data.signals.length, không lọc theo bước/flow nào đang
   chọn, module-i-signal-registry-charter.md §14 lát I4a). Dùng lại SIGNAL_STATUS
   (features/atlas/signalStatus.ts) cho cột trạng thái tin dùng — KHÔNG viết lại câu chữ.

   D6 (charter): `Signal.seen` là chuỗi NGƯỜI GÕ, không có năm — hiện NGUYÊN VĂN kèm nhãn "mốc do
   người khai", KHÔNG suy tuổi/số ngày im lặng từ nó. */
const HEADERS = [
  "Tên event",
  "Phía đo",
  "Có chạy",
  "Lưu lượng /ngày",
  "Nuôi chỉ số nào",
  "Thấy lần cuối (mốc do người khai)",
  "Trạng thái tin dùng",
];

function metricNames(data: CxmData, sig: Signal): string {
  if (sig.metrics.length === 0) return "chưa nuôi chỉ số nào";
  return sig.metrics.map((id) => data.metrics.find((m) => m.id === id)?.name ?? id).join(", ");
}

export function SignalTable({ data }: { data: CxmData }) {
  const asOfNote = data.asOf ? ` — mốc ${data.asOf}` : "";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" data-testid="signal-table">
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-left px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.signals.map((sig) => {
            const running = isSignalRunning(sig);
            const status = SIGNAL_STATUS[sig.st];
            const noMetric = sig.metrics.length === 0;
            return (
              <tr key={sig.id} data-testid={`signal-row-${sig.id}`}>
                <td className="px-2.5 py-1.5 border-b border-line">
                  <code className="font-mono text-[12px] text-primary">{sig.name}</code>
                  <div className="t-meta text-[12px] mt-0.5">{sig.desc}</div>
                </td>
                <td className="px-2.5 py-1.5 border-b border-line t-meta whitespace-nowrap">
                  {sig.es === "server" ? "server" : "client"} · {sig.pf.length} nền
                </td>
                <td
                  className="px-2.5 py-1.5 border-b border-line"
                  data-testid={`signal-running-${sig.id}`}
                  aria-label={running ? "đang chạy" : "chưa chạy"}
                >
                  {running ? "●" : "○"}
                </td>
                <td className="px-2.5 py-1.5 border-b border-line tabular-nums whitespace-nowrap">
                  {sig.vol ? `${nf(sig.vol)}/ngày` : "—"}
                </td>
                <td className={`px-2.5 py-1.5 border-b border-line ${noMetric ? "text-ink-3 italic" : ""}`}>
                  {metricNames(data, sig)}
                </td>
                <td className="px-2.5 py-1.5 border-b border-line t-meta whitespace-nowrap">
                  {sig.seen ?? <span className="text-ink-3">chưa từng</span>}
                </td>
                <td className="px-2.5 py-1.5 border-b border-line whitespace-nowrap">
                  <Badge state={status.badge} text={status.label} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="t-meta mt-2" data-testid="signal-table-asof-note">
        Lưu lượng là số của MỘT NGÀY (mốc số liệu){asOfNote}, không phải mức ổn định. Cột "Thấy lần
        cuối" là mốc do người khai — không tính được im lặng bao lâu từ đó.
      </p>
    </div>
  );
}
