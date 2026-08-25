import type { Cfg, CxmData, Issue } from "../../../data/schema/index.ts";
import { PRI_KEYS, PRI_LABEL, type IssueScore } from "../../../data/priority.ts";
import { Note, Sparkline, Stat } from "../../../design-system/index.ts";
import { nf } from "../../../design-system/format.ts";
import { fx } from "../../../domain/index.ts";

/* Tab Ảnh hưởng — port V.issue nhánh 'imp' (prototype dòng 3280-3305) LÊN schema hiện tại:
   - `imp.aff`/`imp.hv` cũ KHÔNG còn — hai số này nay ĐO qua issueScore (ADR-002 §16/§17), nullable
     khi chưa map sigMap / chưa nối được khách. Null hiện "—" + nói lý do, không hiện 0 giả (§9).
   - Card "Tác động CSAT" đã bỏ theo đúng quyết định 14/08 ("Không hiện cái không đo được") — cùng
     lý do bỏ card CES ở TopPriorityBlock, không phải quên port.
   - fx() chỉ áp chỗ prototype áp và field còn tồn tại: `imp.churn`. `aff`/`hv` là số đếm khách
     thật từ fixture (cùng thang TopPriorityBlock), không nhân baseline.
   - Breakdown: 7 khoá của cfg.pri.w — đóng góp = w·norm của RIÊNG khoá tính được; khoá thiếu được
     ĐẾM RA CHỮ chứ không xếp điểm giả (ADR-002 §9 rule 3, cùng luật TopPriorityBlock). */

export type ImpactTabProps = {
  issue: Issue;
  score: IssueScore;
  data: CxmData;
  cfg: Cfg;
};

export function ImpactTab({ issue, score, data, cfg }: ImpactTabProps) {
  const aff = score.x.aff;
  const hv = score.x.hv;
  /* CXI-028: aff trống + 0 bằng chứng + 0 khách ⇒ lỗi ở HỆ THỐNG THU THẬP, không gắn khách cụ thể.
     Suy từ dữ liệu, không hardcode theo id (bẫy đã ghi ở charter B4). */
  const systemic = issue.ev.length === 0 && issue.cust.length === 0 && (aff === null || aff === 0);

  const contrib = PRI_KEYS.filter((k) => score.norm[k] !== null).map((k) => ({
    k,
    v: cfg.pri.w[k] * (score.norm[k] as number),
  }));
  const maxAbs = Math.max(...contrib.map((c) => Math.abs(c.v)), 1);
  const missingLabels = score.missing.map((k) => PRI_LABEL[k]).join(" · ");
  const dec1 = (n: number) => (Math.round(n * 10) / 10).toString().replace(".", ",");

  const vi = issue.ins ? data.ins.find((x) => x.id === issue.ins) : undefined;
  const themeName = vi ? data.tax.find((t) => t.id === vi.theme)?.name ?? vi.theme : "";

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat
          label="Khách bị ảnh hưởng"
          value={aff === null ? "—" : nf(aff)}
          foot={aff === null ? "chưa map giá trị điểm đo (sigMap) nên chưa đếm được" : "unique theo giá trị điểm đo đã map"}
          srcNote="Đếm từ sigMap · fixture"
        />
        <Stat
          label="Liên hệ lặp lại"
          value={`${issue.imp.rep}%`}
          foot={`ngưỡng cảnh báo ${cfg.data.repeatWarn}%`}
          srcNote="CS case · trễ 2 giờ"
          tone={issue.imp.rep > cfg.data.repeatWarn ? "var(--crit)" : undefined}
        />
        <Stat
          label="Có tín hiệu churn"
          value={nf(fx(issue.imp.churn))}
          foot={`khách cần can thiệp · ngưỡng ${cfg.data.churnWarn}`}
          srcNote="Fixture demo"
          tone={issue.imp.churn > cfg.data.churnWarn ? "var(--crit)" : undefined}
        />
        <Stat
          label="Khách high-value"
          value={hv === null ? "—" : nf(hv)}
          foot={hv === null ? "chưa nối được nhóm khách nên chưa đếm được" : "trong nhóm bị ảnh hưởng"}
          srcNote={`Nhóm ${cfg.hv.values.join(" · ")} theo ${cfg.hv.dim}`}
        />
      </div>

      {systemic ? (
        <div className="mb-4" data-testid="issue-imp-systemic">
          <Note>
            Điểm gãy này là lỗi ở <b>hệ thống thu thập dữ liệu</b>, không gắn với khách hàng cụ thể nào — vì
            vậy &quot;khách bị ảnh hưởng&quot; trống trong khi độ tin cậy {issue.conf}% nói về việc <i>nguồn đã
            ngừng gửi là chắc chắn</i>, không phải về số khách.
          </Note>
        </div>
      ) : null}

      <div className="t-lbl mb-2">{`Breakdown điểm ưu tiên — tổng ${score.total}`}</div>
      <div className="flex flex-col gap-1.5 max-w-[640px]" data-testid="issue-pri-breakdown">
        {contrib.map(({ k, v }) => (
          <div key={k} className="grid grid-cols-[220px_1fr_44px] items-center gap-2 text-[12.5px]">
            <span className="text-ink-2 truncate">{PRI_LABEL[k]}</span>
            <div className="h-[10px] bg-surface-2 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${(Math.abs(v) / maxAbs) * 100}%`, background: v < 0 ? "var(--good)" : "var(--ink3)" }}
              />
            </div>
            <span className="text-right font-semibold tabular-nums">{`${v < 0 ? "−" : ""}${dec1(Math.abs(v))}`}</span>
          </div>
        ))}
      </div>
      {score.missing.length > 0 ? (
        <div className="text-[12px] text-ink-3 mt-2" data-testid="issue-pri-missing">
          {`Chưa tính được ${score.missing.length}/${PRI_KEYS.length} khoá: ${missingLabels} — không xếp điểm giả cho khoá thiếu.`}
        </div>
      ) : null}

      <div className="border-t border-line mt-4 pt-3">
        <div className="t-lbl mb-2">Voice Insight nguồn</div>
        {vi ? (
          <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3 flex gap-3 items-start" data-testid="issue-vi">
            <div className="flex-none pt-1">
              <Sparkline points={vi.pts} color="var(--crit)" />
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">{themeName}</div>
              <div className="t-meta my-1">
                {`${nf(vi.n)} phản hồi · positive ${vi.pos}% · ${vi.trend < 0 ? "giảm" : "tăng"} ${Math.abs(vi.trend)}pt qua 6 kỳ · ${vi.src.length} nguồn`}
              </div>
              <div className="text-[13px]">{vi.rec}</div>
              <div className="t-meta mt-1.5">
                Insight owner: <b>{vi.owner}</b> · Segment: {vi.seg.join(", ")}
              </div>
            </div>
          </div>
        ) : (
          <div data-testid="issue-vi-none">
            <Note>
              Điểm gãy này <b>không đến từ Voice of Customer</b> mà từ tín hiệu hành vi. Không phải mọi issue đều
              có insight nguồn.
            </Note>
          </div>
        )}
      </div>
    </div>
  );
}
