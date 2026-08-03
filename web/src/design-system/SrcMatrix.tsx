import type { Cfg, Metric, Source } from "../data/schema/index.ts";
import { sourceHealth } from "../domain/state.ts";
import type { SourceHealth } from "../domain/state.ts";

/* Ma trận nguồn × nền tảng — port 1-1 srcMatrix() (prototype output/cxm-platform-prototype.html
   dòng 3563-3592) + hằng SRC_MARK (3568), PF_LABEL (1412), SRC_LABEL (3593). Dùng lại
   sourceHealth() từ domain/state.ts (KHÔNG suy lại trạng thái ở đây).

   Cột "Trạng thái" là BẮT BUỘC (comment gốc dòng 3565-3569): hai nguồn không gắn nền tảng nào
   (src-broker, src-zalo trong seed) hiện toàn dấu "–" ở 4 cột nền tảng — mà một trong hai
   (src-zalo) chính là nguồn đang NGỪNG GỬI. Bỏ cột Trạng thái thì nguồn hỏng nặng nhất vô hình. */

const PFS = ["ios", "android", "web", "server"] as const;
type Pf = (typeof PFS)[number];

const PF_LABEL: Record<Pf, string> = { ios: "iOS", android: "Android", web: "Web", server: "Server" };

const SRC_MARK: Record<SourceHealth, string> = { ok: "●", stale: "◐", down: "✕" };
const SRC_LABEL: Record<SourceHealth, string> = { ok: "Đang nhận", stale: "Trễ hơn SLA", down: "Ngừng gửi" };

/* Màu mark theo trạng thái — token có sẵn trong tailwind.config.js, không thêm hex mới.
   "na" (không áp dụng) không có token riêng: --unk và --ink3 cùng trỏ #8c8681 trong index.css
   (không phải #C6CDD2 gốc) nên chọn nào cũng lệch nhẹ như nhau về màu; dùng text-ink-3 để nhất
   quán với tiền lệ Badge.tsx (cũng dùng --ink3 cho trạng thái "không xác định được"). */
const MARK_CLASS: Record<SourceHealth, string> = { ok: "text-good", stale: "text-watch", down: "text-crit" };

function metricName(metrics: Metric[], id: string): string {
  return metrics.find((m) => m.id === id)?.name ?? id;
}

export type SrcMatrixProps = {
  sources: Source[];
  metrics: Metric[];
  cfg: Cfg;
  /** Bản rút gọn nhúng vào widget Tổng quan: ẩn note + cột metric, cắt tên trong ngoặc. */
  compact?: boolean;
};

export function SrcMatrix({ sources, metrics, cfg, compact }: SrcMatrixProps) {
  const noPf = sources.filter((s) => !s.pf.length);

  return (
    <div>
      <table data-testid="src-matrix" className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className="text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px]">
              Nguồn
            </th>
            {PFS.map((p) => (
              <th key={p} className="text-center font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px]">
                {PF_LABEL[p]}
              </th>
            ))}
            <th className="text-center font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px]">
              Trạng thái
            </th>
            {compact ? null : (
              <th className="text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px]">
                Nguồn này sai thì metric nào sai
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => {
            const h = sourceHealth(s, cfg);
            const mk = SRC_MARK[h];
            const displayName = compact ? s.name.replace(/ \(.*\)/, "") : s.name;
            return (
              <tr key={s.id} data-testid={`src-row-${s.id}`} className="border-t border-line">
                <td className="text-left py-1.5 px-1">
                  <b className="text-[12.5px]">{displayName}</b>
                  {compact ? null : <div className="t-meta text-[11.5px] mt-0.5">{s.note}</div>}
                </td>
                {PFS.map((p) => {
                  const covers = s.pf.indexOf(p) > -1;
                  if (covers) {
                    return (
                      <td key={p} className="text-center py-1.5 px-1">
                        <span
                          className={`text-[14px] leading-none ${MARK_CLASS[h]}`}
                          title={`${s.name} · ${PF_LABEL[p]} — ${SRC_LABEL[h]}`}
                        >
                          {mk}
                        </span>
                      </td>
                    );
                  }
                  const naTitle = s.pf.length ? `Nguồn này không phủ ${PF_LABEL[p]}` : "Nguồn không gắn nền tảng nào";
                  return (
                    <td key={p} className="text-center py-1.5 px-1">
                      <span className="text-[14px] leading-none text-ink-3" title={naTitle}>
                        –
                      </span>
                    </td>
                  );
                })}
                <td className="text-center py-1.5 px-1 whitespace-nowrap">
                  <span data-testid="src-health" className={`text-[14px] leading-none ${MARK_CLASS[h]}`}>
                    {mk}
                  </span>{" "}
                  <span className={`text-[11.5px] ${h === "ok" ? "text-ink-3" : h === "stale" ? "text-watch" : "text-crit"}`}>
                    {SRC_LABEL[h]}
                  </span>
                </td>
                {compact ? null : (
                  <td className="text-left py-1.5 px-1">
                    {s.metrics.length ? (
                      s.metrics.map((mId) => (
                        <span
                          key={mId}
                          className={`inline-block px-2 py-0.5 rounded-[6px] text-[12px] font-semibold border bg-surface-2 mr-1 ${
                            h !== "ok" ? "text-crit border-current" : "text-ink-2 border-line"
                          }`}
                        >
                          {metricName(metrics, mId)}
                        </span>
                      ))
                    ) : (
                      <span className="t-meta text-[11.5px]">không nối metric nào</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-4 flex-wrap mt-[9px] text-[12px] text-ink-3">
        <span>
          <b className="text-good">●</b> đang nhận
        </span>
        <span>
          <b className="text-watch">◐</b> trễ hơn SLA
        </span>
        <span>
          <b className="text-crit">✕</b> ngừng gửi
        </span>
        <span>
          <b className="text-ink-3">–</b> không áp dụng
        </span>
      </div>
      {noPf.length ? (
        <div className="t-meta text-[11.5px] mt-1.5">
          Nguồn không gắn nền tảng nào: {noPf.map((s) => s.name).join(" · ")} — nhập tay hoặc qua webhook.
        </div>
      ) : null}
    </div>
  );
}
