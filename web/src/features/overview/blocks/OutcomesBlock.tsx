import type { Cfg, CxmData, Outcome, Verdict } from "../../../data/schema/index.ts";
import { metricDirection } from "../../../data/metric-direction.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Badge, Card, Note } from "../../../design-system/index.ts";
import type { BadgeState } from "../../../design-system/index.ts";

/* @outcomes — port 1-1 "Thay đổi có tác dụng không?" (prototype dòng 2231-2255). Giữ nguyên bậc
   "Chưa kết luận được" (KHÔNG mặc định mọi thay đổi đều có tác dụng) và cảnh báo confounder. */
export type OutcomesBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung 5 block S2.3 (data+cfg+onGo) — verdict/outcome không phụ
      thuộc ngưỡng cfg nên component này KHÔNG dùng cfg bên trong. */
  cfg: Cfg;
  /** Link "Mở bảng xử lý" cuối khối (port href="#/work", prototype dòng 2254). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

const VERDICT_LABEL: Record<Verdict, string> = {
  improved: "Đã cải thiện",
  inconclusive: "Chưa kết luận được",
  worse: "Xấu đi",
};

/* Chỉ 'improved' được badge trạng thái tốt (ok) — 'inconclusive' VÀ 'worse' đều render badge
   'unknown', đúng port 1-1 `badge(o.verdict==='improved'?'ok':'unknown', lbl)` (prototype dòng
   2242): không mặc định "chưa kết luận được" là xấu, nhưng cũng không phải đã xác nhận tốt. */
const verdictBadgeState = (v: Verdict): BadgeState => (v === "improved" ? "ok" : "unknown");

function OutcomeRow({ outcome, data }: { outcome: Outcome; data: CxmData }) {
  const action = data.act.find((a) => a.id === outcome.act);
  const metric = action ? data.metrics.find((m) => m.id === action.sm) : undefined;
  // Cải thiện là THEO HƯỚNG metric (vd m-repeat "≤" — thấp hơn là tốt), không phải theo dấu hiệu
  // số học thô của post - base. Metric không xác định (dữ liệu hỏng) → coi như "up" (mặc định cũ).
  const dir = metric ? metricDirection(metric) : "up";
  const improved = dir === "down" ? outcome.post.v < outcome.base.v : outcome.post.v > outcome.base.v;
  return (
    <div className="mb-2.5">
      <Note tone={outcome.verdict === "improved" ? "bd" : outcome.conf.length ? "warn" : "default"}>
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="font-mono text-ink-3">{outcome.act}</span>
          <b>{action ? action.title : outcome.act}</b>
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

export function OutcomesBlock({ data }: OutcomesBlockProps) {
  const done = data.out.length;
  const released = data.act.filter((a) => a.dl === "released").length;

  return (
    <Card
      title="Kết quả đo được"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện Top ${done} trên ${released} thay đổi đã phát hành`}
    >
      {data.out.map((o) => (
        <OutcomeRow key={o.act} outcome={o} data={data} />
      ))}
    </Card>
  );
}
