import { useState } from "react";
import type { Cfg, CxmData, Issue, Metric, TaxNode } from "../../../data/schema/index.ts";
import { Badge, CatChip, Note } from "../../../design-system/index.ts";
import { metricDirection } from "../../../data/metric-direction.ts";

/* Tab Bằng chứng — port V.issue nhánh 'ev' (prototype dòng 3249-3279): giả thuyết → danh sách
   verbatim → khối gập "định nghĩa đo lường". Nhánh 0 bằng chứng giữ NGUYÊN VĂN câu prototype dòng
   3261 (kỷ luật D-1: không sinh verbatim lấp panel — fixture nói thật về chính nó).

   `taxPath`/`srcName` khai lại CỤC BỘ (5 dòng) theo đúng khuôn VocTouchpointInspector — hai màn
   render bằng chứng độc lập, không kéo import chéo feature chỉ vì một hàm join tên. */

function taxPath(data: CxmData, ids: readonly string[]): string {
  return ids
    .map((id) => data.tax.find((t: TaxNode) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n))
    .join(" › ");
}

/** Số ngưỡng in kiểu VN (dấu phẩy thập phân) — cùng khuôn dec() của AtlasMetricsTab. */
function dec(n: number): string {
  return String(n).replace(".", ",");
}

export type EvidenceTabProps = {
  issue: Issue;
  metric: Metric | undefined;
  data: CxmData;
  cfg: Cfg;
};

export function EvidenceTab({ issue, metric, data, cfg }: EvidenceTabProps) {
  const [contractOpen, setContractOpen] = useState(false);
  const evs = issue.ev.map((eid) => data.ev.find((e) => e.id === eid)).filter((e) => e !== undefined);
  const band = metric ? cfg.metric[metric.id] : undefined;
  const worse = metric && metricDirection(metric) === "down" ? "vượt" : "dưới";

  return (
    <div>
      <Note tone="bd">
        <b>Giả thuyết:</b> {issue.hyp}
      </Note>

      {evs.length > 0 ? (
        <div className="grid gap-3 mt-3.5" data-testid="issue-ev-list">
          {evs.map((e) => {
            const cat = data.cats[e.cat];
            return (
              <div key={e.id} className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {cat ? <CatChip label={cat.label} color={cat.color} /> : null}
                  <span className="px-1.5 py-0.5 rounded-[6px] text-[11.5px] bg-surface border border-line">
                    {data.sources.find((s) => s.id === e.src)?.name ?? e.src}
                  </span>
                  <span className="font-mono text-[12px] text-ink-3">{e.ref}</span>
                  <span className="ml-auto t-meta text-[12px]">{e.at}</span>
                </div>
                <p className="text-[13.5px] leading-relaxed">“{e.q}”</p>
                <div className="flex gap-3 flex-wrap mt-2 text-[12px] text-ink-3">
                  {/* `ck` đã che sẵn ở tầng dữ liệu (KH•••482) — màn KHÔNG bao giờ mở khoá. */}
                  <span>🔒 {e.ck} · {e.sig}</span>
                  <span className="font-mono">{taxPath(data, e.tax)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3.5" data-testid="issue-ev-empty">
          <Note tone="crit">
            <Badge state="unknown" /> <b>Chưa có bằng chứng từ khách hàng.</b> Điểm gãy này hiện chỉ dựa trên
            tín hiệu hành vi, nên độ tin cậy chỉ {issue.conf}%. Cần bổ sung khảo sát hoặc verbatim trước khi
            duyệt thay đổi.
          </Note>
        </div>
      )}

      <div className="border-t border-line mt-4 pt-3">
        <button
          type="button"
          data-testid="issue-metric-contract-toggle"
          aria-expanded={contractOpen}
          onClick={() => setContractOpen((v) => !v)}
          className="text-[12.5px] font-semibold text-primary hover:underline"
        >
          {contractOpen ? "Ẩn định nghĩa đo lường ▴" : "Xem định nghĩa đo lường ▾"}
        </button>
        {contractOpen && metric ? (
          <div className="mt-2.5 rounded-lg border border-line bg-surface-2 px-3.5 py-3" data-testid="issue-metric-contract">
            <div className="t-lbl mb-2">Metric contract</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              <dt className="text-ink-3">Metric</dt><dd>{metric.name}</dd>
              <dt className="text-ink-3">Giá trị / mục tiêu</dt><dd>{metric.value} / {metric.target}</dd>
              <dt className="text-ink-3">Ngưỡng đang áp</dt>
              <dd>
                {band?.on
                  ? `cần theo dõi khi ${worse} ${dec(band.watch)} · cần xử lý khi ${worse} ${dec(band.crit)}`
                  : "không theo dõi"}
              </dd>
              <dt className="text-ink-3">Grain</dt><dd>{metric.grain}</dd>
              <dt className="text-ink-3">Công thức</dt><dd>{metric.formula}</dd>
              <dt className="text-ink-3">Nguồn</dt><dd>{metric.source}</dd>
              <dt className="text-ink-3">Độ tươi</dt><dd>{metric.freshness}</dd>
              <dt className="text-ink-3">Chủ sở hữu</dt><dd>{metric.owner}</dd>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
