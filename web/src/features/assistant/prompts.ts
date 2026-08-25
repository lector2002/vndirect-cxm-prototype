import type { Cfg, CxmData, QuantifySeries } from "../../data/schema/index.ts";
import { sourceHealth } from "../../domain/index.ts";
import { SEV_LABEL } from "../work/WorkCreateForm.tsx";
import { isOverdue } from "../work/WorkPage.tsx";
import { HEALTH_LABEL } from "../sources/SourceProfile.tsx";

/* Câu hỏi mẫu + answer builder của màn Assistant (owner duyệt 25/08, tham chiếu Enterpret Wisdom).

   Prototype KHÔNG có LLM backend — mỗi câu trả lời là một phép ĐẾM THẬT trên store, đi qua đúng
   các hàm/nhãn mà màn gốc của dữ kiện đó đang dùng (một đường đếm duy nhất, luật SEV_LABEL):
   - "cần xử lý ngay"  → vị từ đang-mở của TopPriorityBlock + SEV_LABEL (WorkCreateForm)
   - "quá hạn"         → isOverdue của WorkPage (so due với data.asOf, không đồng hồ thật)
   - "nguồn có vấn đề" → sourceHealth (domain) + HEALTH_LABEL (SourceProfile)
   - "agent phát hiện" → data.ag — chính dữ liệu màn Agents & Alerts cũ, gộp về đây 25/08
   - "bất thường"      → các qt chart:'anomaly', so điểm cuối với mức nền tự tính từ chuỗi

   Builders là hàm THUẦN (data, cfg) → answer để test không cần render; câu trả lời KHÔNG lưu vào
   store (store chỉ giữ lượt hỏi) — dựng lại mỗi lần render nên seed đổi là số đổi theo, không có
   con số nào bị ghim trong lịch sử chat. */

export type AssistantPrompt = {
  id: string;
  /** Ký tự trang trí đầu dòng — aria-hidden, nhãn chữ mới là nội dung. */
  icon: string;
  label: string;
};

export const PROMPTS: AssistantPrompt[] = [
  { id: "p-critical", icon: "⚠", label: "Điểm gãy nào cần xử lý ngay?" },
  { id: "p-overdue", icon: "⏱", label: "Việc nào đang quá hạn?" },
  { id: "p-sources", icon: "⛁", label: "Nguồn dữ liệu nào đang có vấn đề?" },
  { id: "p-agents", icon: "◈", label: "Agent phát hiện gì mới?" },
  { id: "p-anomaly", icon: "↗", label: "Theme nào đang bất thường?" },
];

export function promptLabel(promptId: string): string {
  return PROMPTS.find((p) => p.id === promptId)?.label ?? promptId;
}

export type AssistantAnswer = {
  intro: string;
  bullets: string[];
  route?: { to: string; label: string };
  /** Nguồn số + mốc asOf — dòng nhỏ dưới câu trả lời, để số nào cũng có xuất xứ. */
  provenance: string;
};

/* "Đang mở" = có action chưa khép vòng — CÙNG vị từ TopPriorityBlock/WorkPage dùng. */
function openIssues(data: CxmData) {
  return data.iss.filter((i) => {
    const a = data.act.find((x) => x.id === i.act);
    return a !== undefined && a.lc !== "closed";
  });
}

function answerCritical(data: CxmData): AssistantAnswer {
  const crit = openIssues(data).filter((i) => i.sev === "critical");
  return {
    intro:
      crit.length > 0
        ? `Có ${crit.length} điểm gãy đang mở ở mức "${SEV_LABEL.critical}":`
        : `Không có điểm gãy đang mở nào ở mức "${SEV_LABEL.critical}".`,
    bullets: crit.map((i) => `${i.id} — ${i.title}`),
    route: { to: "work", label: "Mở Workboard" },
    provenance: `Đếm từ Workboard · số liệu tính đến ${data.asOf}`,
  };
}

function answerOverdue(data: CxmData): AssistantAnswer {
  const late = data.act.filter((a) => a.lc !== "closed" && isOverdue(a.due, data.asOf));
  return {
    intro:
      late.length > 0
        ? `Có ${late.length} việc đang mở đã quá hạn xử lý:`
        : "Không có việc đang mở nào quá hạn xử lý.",
    bullets: late.map((a) => {
      const issue = data.iss.find((i) => i.act === a.id);
      return `${issue?.title ?? a.id} — hạn ${a.due} · xử lý: ${a.owner || "chưa gán"}`;
    }),
    route: { to: "work", label: "Mở Workboard" },
    provenance: `Đếm từ Workboard · số liệu tính đến ${data.asOf}`,
  };
}

function answerSources(data: CxmData, cfg: Cfg): AssistantAnswer {
  const bad = data.sources
    .map((s) => ({ s, h: sourceHealth(s, cfg, data.asOf) }))
    .filter(({ h }) => h !== "ok");
  return {
    intro:
      bad.length > 0
        ? `${bad.length} / ${data.sources.length} nguồn đang có vấn đề:`
        : `Cả ${data.sources.length} nguồn đều đang nhận dữ liệu bình thường.`,
    bullets: bad.map(({ s, h }) => `${s.name} — ${HEALTH_LABEL[h]}`),
    route: { to: "sources", label: "Mở Data Sources" },
    provenance: `Đếm từ Data Sources · số liệu tính đến ${data.asOf}`,
  };
}

/* AgentFinding.sev là string mở trong schema — map thứ tự tường minh, sev lạ rơi xuống cuối
   thay vì ném hay lặng lẽ lên đầu. */
const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2 };

function answerAgents(data: CxmData): AssistantAnswer {
  const findings = data.ag
    .flatMap((g) => g.f.map((f) => ({ ...f, agent: g.name })))
    .sort((a, b) => (SEV_ORDER[a.sev] ?? 3) - (SEV_ORDER[b.sev] ?? 3));
  return {
    intro:
      findings.length > 0
        ? `${data.ag.length} agent đang chạy, ${findings.length} phát hiện (nặng trước):`
        : `${data.ag.length} agent đang chạy, chưa có phát hiện nào.`,
    bullets: findings.map((f) => `${f.title} — ${f.agent} · ${f.at}`),
    provenance: `Từ nhật ký agent · số liệu tính đến ${data.asOf}`,
  };
}

/* Mức nền = trung bình các kỳ TRƯỚC điểm cuối của chính chuỗi — tự tính, không ghim. Ngưỡng
   1,5×/0,67× chỉ là ngưỡng KỂ (kể dòng nào vào câu trả lời), không phải ngưỡng nghiệp vụ mới:
   chart anomaly gốc vẫn là nơi nhìn đầy đủ, câu trả lời chỉ tóm những dòng lệch rõ. */
function answerAnomaly(data: CxmData): AssistantAnswer {
  /* type predicate: .filter() thường không narrow union QuantifyItem — không có nó thì `item.t`
     (chỉ nhánh series có) trượt type-check ở `tsc -b` của npm run build */
  const items = data.qt.filter((q): q is QuantifySeries => q.kind === "series" && q.chart === "anomaly");
  const bullets: string[] = [];
  for (const item of items) {
    for (const line of item.t) {
      if (line.p.length < 2) continue;
      const last = line.p[line.p.length - 1];
      const base = line.p.slice(0, -1).reduce((a, v) => a + v, 0) / (line.p.length - 1);
      if (base <= 0) continue;
      const ratio = last / base;
      if (ratio >= 1.5) {
        bullets.push(`${line.l} — tăng gấp ${ratio.toFixed(1).replace(".", ",")} lần mức nền (~${Math.round(base)}/kỳ → ${last})`);
      } else if (ratio <= 0.67) {
        bullets.push(`${line.l} — giảm còn ${Math.round(ratio * 100)}% mức nền (~${Math.round(base)}/kỳ → ${last})`);
      }
    }
  }
  const names = items.map((i) => `"${i.name}"`).join(", ");
  return {
    intro:
      bullets.length > 0
        ? `${bullets.length} chuỗi đang lệch rõ khỏi mức nền:`
        : "Không chuỗi nào đang lệch rõ khỏi mức nền.",
    bullets,
    route: { to: "topics", label: "Mở Topics & Trends" },
    provenance: `Tính từ chart ${names} (Quantify) · số liệu tính đến ${data.asOf}`,
  };
}

/** Câu trả lời cho một lượt hỏi. promptId lạ hoặc câu gõ tự do → trả lời trung thực rằng demo
    chỉ chạy câu hỏi mẫu — không bịa một câu trả lời không đếm được. */
export function answerFor(promptId: string | undefined, data: CxmData, cfg: Cfg): AssistantAnswer {
  switch (promptId) {
    case "p-critical":
      return answerCritical(data);
    case "p-overdue":
      return answerOverdue(data);
    case "p-sources":
      return answerSources(data, cfg);
    case "p-agents":
      return answerAgents(data);
    case "p-anomaly":
      return answerAnomaly(data);
    default:
      return {
        intro:
          "Bản demo trả lời được các câu hỏi mẫu — backend AI sẽ nối ở giai đoạn code thật. Chọn một câu hỏi mẫu để xem số đếm từ dữ liệu đang hiển thị.",
        bullets: [],
        provenance: "",
      };
  }
}
