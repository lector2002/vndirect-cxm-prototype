import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { BadgeState } from "../../design-system/index.ts";
import { Badge, Note, btnSecondary, btnSizeSm } from "../../design-system/index.ts";
import type { Issue } from "../../data/schema/index.ts";
import { issueScore } from "../../data/priority.ts";
import { useCxmStore } from "../../store/store.ts";
import { SEV_LABEL } from "../work/WorkCreateForm.tsx";
import { EvidenceTab } from "./tabs/EvidenceTab.tsx";
import { ImpactTab } from "./tabs/ImpactTab.tsx";
import { CohortTab } from "./tabs/CohortTab.tsx";
import { ActionTab } from "./tabs/ActionTab.tsx";
import { OutcomeTab } from "./tabs/OutcomeTab.tsx";

/* Màn Điểm gãy #/issue/:id — Module B (docs/module-b-issue-charter.md), owner gỡ chốt "DỪNG Ở B1"
   ngày 25/08 ("dựng đi"). Vỏ màn theo đúng quyết định #2 owner 07/08: h1 "Điểm gãy" + tiêu đề issue
   dòng riêng ngay dưới + nút "← Quay lại" dùng lịch sử trình duyệt. PageTitle KHÔNG dùng được ở đây
   (quyết định thiết kế #1 charter): route `issue` không có trong NAV_GROUPS nên navLabel() ném —
   in thẳng h1 như tiền lệ ThemeDetailPage (route /topic/:id).

   State tab là state CỤC BỘ của màn — store cố ý không giữ UI-selection. Nội dung 5 tab port từ
   V.issue prototype dòng 3224-3345, mỗi tab một file trong ./tabs (file <400 dòng). */

const TABS = [
  ["ev", "Bằng chứng"],
  ["imp", "Ảnh hưởng"],
  ["cust", "Cohort ảnh hưởng"],
  ["act", "Xử lý"],
  ["out", "Kết quả"],
] as const;

type TabKey = (typeof TABS)[number][0];

/* Port 1-1 bảng SEV của prototype (dòng 1503): critical→crit, high→watch, medium→ok. */
const SEV_BADGE: Record<Issue["sev"], BadgeState> = { critical: "crit", high: "watch", medium: "ok" };

const CHIP = "inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border border-line bg-surface-2 whitespace-nowrap";

export function IssuePage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const dims = useCxmStore((s) => s.dims);
  const advanceAction = useCxmStore((s) => s.advanceAction);
  const [tab, setTab] = useState<TabKey>("ev");

  const id = params.id ?? "";
  const issue = data.iss.find((i) => i.id === id);

  if (!issue) {
    return (
      <div className="p-8">
        <h1 className="t-hero mb-4">Điểm gãy</h1>
        <Note tone="crit">Không tìm thấy điểm gãy &quot;{id}&quot;.</Note>
      </div>
    );
  }

  const step = data.steps.find((s) => s.id === issue.step);
  const metric = data.metrics.find((m) => m.id === issue.metric);
  const action = data.act.find((a) => a.id === issue.act);
  const outcome = action ? data.out.find((o) => o.act === action.id) : undefined;
  const loop = data.loop.find((l) => l.iss === issue.id);
  /* aff/hv là số ĐO qua issueScore (ADR-002 §16/§17) — imp.aff/imp.hv cũ không còn trong schema;
     tab Ảnh hưởng và Cohort cùng đọc MỘT lần chấm này, không ai tự đếm lại một đường khác. */
  const score = issueScore(issue, data, cfg, dims);

  return (
    <div className="p-8">
      <h1 className="t-hero mb-4">Điểm gãy</h1>
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        <button type="button" className={`${btnSecondary} ${btnSizeSm}`} onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <span className="font-mono text-[12px] text-ink-3">{issue.id}</span>
        <Badge state={SEV_BADGE[issue.sev]} text={SEV_LABEL[issue.sev]} />
        {step ? <span className={CHIP}>{`${step.code} · ${step.name}`}</span> : null}
        {step ? <span className={`${CHIP} font-mono`}>{step.stationId}</span> : null}
        <span className="ml-auto t-meta">
          Độ tin cậy <b className="text-primary text-[16px]">{issue.conf}%</b>
        </span>
      </div>
      <h2 className="t-block max-w-[30ch] mb-2.5" data-testid="issue-title">{issue.title}</h2>
      <p className="text-[13.5px] text-ink-2 max-w-[86ch] mb-4">{issue.plain}</p>

      <div className="bg-surface border border-line rounded shadow-card">
        <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              data-testid={`issue-tab-${k}`}
              onClick={() => setTab(k)}
              className={`px-3 py-2 text-[13px] rounded-t-[8px] border-b-2 ${
                tab === k ? "border-primary font-bold text-ink" : "border-transparent text-ink-2 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="p-4" data-testid={`issue-panel-${tab}`}>
          {tab === "ev" ? (
            <EvidenceTab issue={issue} metric={metric} data={data} cfg={cfg} />
          ) : tab === "imp" ? (
            <ImpactTab issue={issue} score={score} data={data} cfg={cfg} />
          ) : tab === "cust" ? (
            <CohortTab issue={issue} score={score} loop={loop} data={data} />
          ) : tab === "act" ? (
            <ActionTab issue={issue} action={action} outcome={outcome} onAdvance={action ? () => advanceAction(action.id) : undefined} />
          ) : (
            <OutcomeTab issue={issue} action={action} outcome={outcome} loop={loop} metric={metric} data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
