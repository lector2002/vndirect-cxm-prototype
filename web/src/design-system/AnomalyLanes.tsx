import type { Agent, AgentFindingLane } from "../data/schema/index.ts";
import { Note } from "./Note.tsx";
import type { NoteTone } from "./Note.tsx";

/* Ba làn bất thường — port 1-1 anomalyLanes() (prototype dòng 2361-2388). Phân loại theo BẢN CHẤT
   của cái bất thường (khách nói khác đi / event hệ thống lệch / ống dẫn hỏng), không theo agent
   nào phát hiện ra nó. Làn lấy TRỰC TIẾP từ field `f.lane` khai báo tường minh trên AgentFinding
   — KHÔNG đoán từ tiêu đề bằng regex. Bản đầu của tác giả gốc làm vậy và gán nhầm ngay finding
   quan trọng nhất: "Volume lỗi liveness vượt baseline" khớp chữ "volume" nên rơi vào làn phản hồi
   dù lane thật của nó là 'behaviour', khiến làn hành vi trống rỗng (xem AF-03 trong seed). */
/* luật 12/08: bỏ `desc` của cả ba làn ("Khách nói khác đi so với baseline" · "Event hệ thống lệch
   baseline" · "Ống dẫn hỏng"). Ba chuỗi đó ĐỊNH NGHĨA làn chứ không nói gì về dữ liệu đang có —
   nhãn làn cộng số đếm đã đủ. Nghĩa của ba làn ở docblock trên và trong tài liệu thiết kế. */
const LANES: { key: Exclude<AgentFindingLane, null>; label: string }[] = [
  { key: "voice", label: "Trong phản hồi" },
  { key: "behaviour", label: "Trong hành vi" },
  { key: "pipeline", label: "Của chính nguồn dữ liệu" },
];

function noteTone(sev: string): NoteTone {
  if (sev === "critical") return "crit";
  if (sev === "high") return "warn";
  return "default";
}

export type AnomalyLanesProps = {
  agents: Agent[];
};

export function AnomalyLanes({ agents }: AnomalyLanesProps) {
  const all = agents.flatMap((g) => g.f.map((f) => ({ ...f, agentName: g.name })));
  const noneCount = all.filter((f) => f.lane === null).length;

  return (
    <div>
      {LANES.map(({ key, label }) => {
        const hits = all.filter((f) => f.lane === key);
        return (
          <div key={key} data-testid={`lane-${key}`} className="mb-[13px]">
            <div className="t-lbl">
              {label} <b className="font-mono">{hits.length}</b>
            </div>
            <div className="mb-[7px]" />
            {hits.length ? (
              hits.map((f) => (
                <div key={f.id} className="mb-1.5">
                  <Note tone={noteTone(f.sev)}>
                    <b>{f.title}</b> <span className="t-meta">· {f.at} · {f.agentName}</span>
                    <div className="mt-1">{f.detail}</div>
                  </Note>
                </div>
              ))
            ) : (
              <div className="t-meta text-[12px]">Không có cảnh báo trong làn này.</div>
            )}
          </div>
        );
      })}
      {noneCount ? (
        <div className="t-meta text-[12px] mb-1.5">
          {noneCount} mục không phải bất thường (bản tin định kỳ) nên không nằm trong ba làn.
        </div>
      ) : null}
      {/* luật 11/08: bỏ dòng chỉ đường sang #/rules và #/agents */}
    </div>
  );
}
