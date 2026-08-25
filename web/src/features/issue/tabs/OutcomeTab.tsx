import type { Action, CxmData, Issue, Loop, Metric, Outcome } from "../../../data/schema/index.ts";
import { Badge, Note, Stat, VerifyChart } from "../../../design-system/index.ts";
import { nf } from "../../../design-system/format.ts";
import { verifyTimeline } from "../../../domain/index.ts";
import { metricDirection } from "../../../data/metric-direction.ts";
import { VERDICT_LABEL } from "../../overview/blocks/OutcomesBlock.tsx";

/* Tab Kết quả — quyết định #3 owner 07/08: mốc "trước" là Snapshot của Module A, KÈM chuỗi lịch sử
   (VerifyChart trên verifyTimeline: kỳ trước → mốc đóng băng → vạch phát hành → số "sau"), in kèm
   AI đóng băng và LÚC NÀO. Thẻ kết quả port outcomeCard prototype (dòng 3186-3223): base/post/
   chênh lệch/verdict + cohort/cửa sổ/metric + khối confounder — "không được coi tương quan là nhân
   quả" giữ nguyên văn, cùng câu lưu ý prototype về hai snapshot rời. Khối "Khép vòng với khách"
   port nhánh 'out' (dòng 3341-3352). */

export type OutcomeTabProps = {
  issue: Issue;
  action: Action | undefined;
  outcome: Outcome | undefined;
  loop: Loop | undefined;
  metric: Metric | undefined;
  data: CxmData;
};

const num = (v: number) => String(v).replace(".", ",");

export function OutcomeTab({ issue, action, outcome, loop, metric, data }: OutcomeTabProps) {
  const tl = verifyTimeline(issue.id, data);
  const snap = data.snap.find((s) => s.iss === issue.id);

  const delta = outcome ? Math.round((outcome.post.v - outcome.base.v) * 10) / 10 : 0;
  const better = outcome && metric ? (metricDirection(metric) === "down" ? delta < 0 : delta > 0) : false;

  return (
    <div>
      <div className="t-lbl mb-2">Diễn biến chỉ số quanh mốc đóng băng</div>
      {tl ? (
        <>
          <VerifyChart tl={tl} />
          {snap ? (
            <div className="text-[12px] text-ink-3 mt-1" data-testid="issue-snap-provenance">
              {`Mốc "trước" đóng băng lúc Xác nhận điểm gãy: ${num(snap.m.v)}${snap.m.u} · n = ${nf(snap.m.n)} · do ${snap.by} đóng băng ngày ${snap.at} — không tính lại sau khi đã biết kết quả.`}
            </div>
          ) : null}
        </>
      ) : (
        <div data-testid="issue-timeline-none">
          <Note>
            <Badge state="unknown" /> <b>Chưa có mốc so sánh.</b> Điểm gãy chưa qua bước Xác nhận nên chưa có
            snapshot đóng băng — chưa có điểm neo nào để vẽ diễn biến.
          </Note>
        </div>
      )}

      <div className="border-t border-line mt-4 pt-3.5">
        {outcome && metric ? (
          <div data-testid="issue-outcome-card">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
              <Stat
                label="Trước thay đổi"
                value={`${num(outcome.base.v)}${outcome.base.u}`}
                foot={outcome.base.p}
                srcNote={`n = ${nf(outcome.base.n)} · ${metric.name}`}
              />
              <Stat
                label="Sau thay đổi"
                value={`${num(outcome.post.v)}${outcome.post.u}`}
                foot={outcome.post.p}
                srcNote={`n = ${nf(outcome.post.n)} · cùng grain`}
                tone={outcome.verdict === "improved" ? "var(--good)" : outcome.verdict === "worse" ? "var(--crit)" : undefined}
              />
              <Stat
                label="Chênh lệch"
                value={`${delta > 0 ? "+" : ""}${num(delta)}${outcome.post.u}`}
                foot={
                  outcome.verdict === "inconclusive"
                    ? better
                      ? "Đúng hướng, nhưng chưa đủ căn cứ"
                      : "Ngược hướng, chưa đủ căn cứ"
                    : better
                      ? "Theo hướng mong muốn"
                      : "Ngược hướng mong muốn"
                }
                srcNote={`Mục tiêu ${metric.target}`}
                tone={outcome.verdict === "inconclusive" ? undefined : better ? "var(--good)" : "var(--crit)"}
              />
              <div className="bg-surface border border-line rounded px-4 py-[15px]">
                <div className="t-lbl mb-[7px]">Kết luận</div>
                <div className="my-1.5">
                  <Badge state={outcome.verdict === "improved" ? "ok" : "unknown"} text={VERDICT_LABEL[outcome.verdict]} />
                </div>
                <div className="text-[12px] text-ink-3">{outcome.by ?? "Chưa có người kết luận"}</div>
              </div>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px] max-w-[720px] mb-3">
              <dt className="text-ink-3">Cohort</dt><dd>{outcome.cohort}</dd>
              <dt className="text-ink-3">Cửa sổ quan sát</dt><dd>{outcome.win}</dd>
              <dt className="text-ink-3">Metric</dt><dd>{`${metric.name} · grain ${metric.grain}`}</dd>
            </dl>

            {outcome.conf.length > 0 ? (
              <div data-testid="issue-confounders">
                <Note tone="crit">
                  <b>⚠ {outcome.conf.length} yếu tố nhiễu (confounder) — không được coi tương quan là nhân quả</b>
                  <ul className="mt-2 ml-5 list-disc">
                    {outcome.conf.map((c) => (
                      <li key={c} className="my-0.5">{c}</li>
                    ))}
                  </ul>
                  {outcome.verdict === "inconclusive" ? (
                    <div className="mt-2">
                      Vì còn yếu tố nhiễu, hệ thống <b>không cho phép</b> kết luận là cải thiện mà chưa có người
                      phụ trách ghi nhận rõ lý do.
                    </div>
                  ) : null}
                </Note>
              </div>
            ) : (
              <Note>
                <b>Không phát hiện yếu tố nhiễu.</b> Cùng kỳ không có release nào khác chạm vào bước này, volume
                không lệch bất thường.
              </Note>
            )}

            <div className="text-[12px] text-ink-3 mt-3">
              Lưu ý về prototype: trước và sau là <b>hai snapshot rời</b>, không phải chuỗi thời gian liên tục.
              Bản thật cần time-series và release marker thật.
            </div>
          </div>
        ) : (
          <div data-testid="issue-outcome-none">
            <Note>
              <Badge state="unknown" /> <b>Chưa có kết quả để đo.</b>{" "}
              {action?.rel
                ? "Thay đổi đã phát hành nhưng chưa đủ cửa sổ quan sát."
                : "Thay đổi chưa được phát hành nên chưa có cửa sổ quan sát."}
            </Note>
          </div>
        )}
      </div>

      <div className="border-t border-line mt-4 pt-3.5">
        <div className="t-lbl mb-2">Khép vòng với khách hàng</div>
        {loop ? (
          <div data-testid="issue-loop">
            <Note tone={loop.done >= loop.need ? "default" : "warn"}>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-ink-3">Khách cần liên hệ</dt><dd>{nf(loop.need)}</dd>
                <dt className="text-ink-3">Đã liên hệ</dt><dd>{nf(loop.done)}</dd>
                <dt className="text-ink-3">Kênh</dt><dd>{loop.ch}</dd>
                <dt className="text-ink-3">Người duyệt nội dung</dt>
                <dd>{loop.by ?? "Chưa duyệt — nội dung gửi khách bắt buộc có người duyệt"}</dd>
                <dt className="text-ink-3">Sentiment sau đó</dt><dd>{loop.sent ?? "—"}</dd>
              </dl>
            </Note>
          </div>
        ) : (
          <div data-testid="issue-loop-none">
            <Note>Chưa lập danh sách khách cần liên hệ.</Note>
          </div>
        )}
      </div>
    </div>
  );
}
