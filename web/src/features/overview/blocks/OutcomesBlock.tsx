import type { Cfg, CxmData, Outcome, Verdict } from "../../../data/schema/index.ts";
import { metricDirection } from "../../../data/metric-direction.ts";
import { Badge, Card, Note } from "../../../design-system/index.ts";
import type { BadgeState } from "../../../design-system/index.ts";

/* @outcomes — port 1-1 "Thay đổi có tác dụng không?" (prototype dòng 2231-2255). Giữ nguyên bậc
   "Chưa kết luận được" (KHÔNG mặc định mọi thay đổi đều có tác dụng) và cảnh báo confounder. */
export type OutcomesBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung 5 block S2.3 (data+cfg+onGo) — verdict/outcome không phụ
      thuộc ngưỡng cfg nên component này KHÔNG dùng cfg bên trong. */
  cfg: Cfg;
  /** 26/08: tiêu đề mỗi dòng kết quả bấm được → hồ sơ điểm gãy #/issue/:id (thay link chung
      "Mở bảng xử lý" của prototype dòng 2254 — đích theo từng dòng cụ thể hơn đích cả khối). */
  onGo?: (route: string) => void;
};

/* Export 25/08 (Module B): tab Kết quả của màn Điểm gãy in verdict bằng ĐÚNG bảng này — một nguồn
   cho ba chuỗi, không chép lần hai (cùng luật SEV_LABEL). */
export const VERDICT_LABEL: Record<Verdict, string> = {
  improved: "Đã cải thiện",
  inconclusive: "Chưa kết luận được",
  worse: "Xấu đi",
};

/* Chỉ 'improved' được badge trạng thái tốt (ok) — 'inconclusive' VÀ 'worse' đều render badge
   'unknown', đúng port 1-1 `badge(o.verdict==='improved'?'ok':'unknown', lbl)` (prototype dòng
   2242): không mặc định "chưa kết luận được" là xấu, nhưng cũng không phải đã xác nhận tốt. */
const verdictBadgeState = (v: Verdict): BadgeState => (v === "improved" ? "ok" : "unknown");

function OutcomeRow({ outcome, data, onGo }: { outcome: Outcome; data: CxmData; onGo?: (route: string) => void }) {
  const action = data.act.find((a) => a.id === outcome.act);
  const metric = action ? data.metrics.find((m) => m.id === action.sm) : undefined;
  /* 26/08 (owner "mở thêm nút bấm"): tiêu đề bấm được → hồ sơ điểm gãy của chính action này
     (#/issue/:id, tab Kết quả có đủ snapshot/confounder) — cùng lối tiêu đề-bấm-được của IssueBar. */
  const issue = data.iss.find((i) => i.act === outcome.act);
  // Cải thiện là THEO HƯỚNG metric (vd m-repeat "≤" — thấp hơn là tốt), không phải theo dấu hiệu
  // số học thô của post - base. Metric không xác định (dữ liệu hỏng) → coi như "up" (mặc định cũ).
  const dir = metric ? metricDirection(metric) : "up";
  const improved = dir === "down" ? outcome.post.v < outcome.base.v : outcome.post.v > outcome.base.v;
  return (
    <div className="mb-2.5">
      <Note tone={outcome.verdict === "improved" ? "bd" : outcome.conf.length ? "warn" : "default"}>
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="font-mono text-ink-3">{outcome.act}</span>
          {issue && onGo ? (
            <button
              type="button"
              data-testid={`outcome-open-${issue.id}`}
              className="font-bold text-left hover:text-primary hover:underline"
              onClick={() => onGo(`issue/${issue.id}`)}
            >
              {action ? action.title : outcome.act}
            </button>
          ) : (
            <b>{action ? action.title : outcome.act}</b>
          )}
          <Badge state={verdictBadgeState(outcome.verdict)} text={VERDICT_LABEL[outcome.verdict]} />
        </div>
        <div className="t-meta">
          {String(outcome.base.v).replace(".", ",")}
          {outcome.base.u} →{" "}
          <b className={improved ? "text-good" : "text-crit"}>
            {String(outcome.post.v).replace(".", ",")}
            {outcome.post.u}
          </b>{" "}
          · cohort {outcome.cohort} · {outcome.win}
        </div>
      </Note>
    </div>
  );
}

export function OutcomesBlock({ data, onGo }: OutcomesBlockProps) {
  const done = data.out.length;
  const released = data.act.filter((a) => a.dl === "released").length;

  return (
    <Card
      title="Kết quả đo được"
      /* 25/08 (owner, quét AI-slop): bỏ subtitle kỳ (GlobalToolbar cầm timeframe); dải mẫu số chỉ
         hiện khi có thay đổi đã phát hành mà CHƯA đo — N/N là nói lại chính danh sách bên dưới. */
      denomStrip={
        done < released ? `Đang hiện Top ${done} trên ${released} thay đổi đã phát hành` : undefined
      }
    >
      {done === 0 ? (
        <div className="t-meta" data-testid="outcomes-empty">
          Chưa có thay đổi phát hành nào được đo kết quả.
        </div>
      ) : (
        data.out.map((o) => <OutcomeRow key={o.act} outcome={o} data={data} onGo={onGo} />)
      )}
    </Card>
  );
}
