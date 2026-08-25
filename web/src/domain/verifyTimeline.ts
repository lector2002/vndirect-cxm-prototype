import type { CxmData } from "../data/schema/index.ts";
import { metricDirection } from "../data/metric-direction.ts";

/* Chuỗi so sánh trước/sau của một điểm gãy (module-b-issue-charter.md, section B2) — hàm THUẦN,
   chỉ NỐI ba nguồn số đã có, KHÔNG sinh số mới (0 hằng số tỷ lệ, bất biến 2):
   - các kỳ TRƯỚC: data.hist (demo.ts sinh tất định, cờ demo trên từng dòng dữ liệu);
   - điểm ĐÓNG BĂNG: Snapshot.m.v — số thật ghi lúc Xác nhận, không tính lại;
   - điểm SAU: Outcome.post.v — số thật của cửa sổ quan sát.
   Vạch phát hành lấy từ Action.rel có sẵn (quyết định #4 charter): rel tồn tại ⇒ vạch NGAY SAU
   điểm đóng băng; rel rỗng ⇒ không vạch nào.

   Trộn grain phải NÓI RA (quyết định thiết kế #2 charter): kỳ trước là điểm theo THÁNG, còn mốc
   đóng băng / số sau đo trên CỬA SỔ TỰ DO ghi ở nhãn (`Snapshot.m.p` không phải ô trên lưới kỳ) —
   `note` mang câu đó để chart in ra, im lặng là hình nói sai. */

export type VerifyPointKind = "pre" | "frozen" | "post";
export type VerifyPoint = { p: string; v: number; kind: VerifyPointKind; demo: boolean };

export type VerifyTimeline = {
  points: VerifyPoint[];
  /** Vẽ vạch phát hành NGAY SAU điểm thứ i; null = chưa phát hành (Action.rel rỗng). */
  releaseAfter: number | null;
  /** Nguyên văn Action.rel — chart in đúng chuỗi, không diễn giải. */
  releaseLabel: string | null;
  /** Chỉ số của điểm đóng băng trong `points`. null không xảy ra khi hàm trả khác null —
      giữ nullable theo đặc tả để chỗ đọc không giả định. */
  frozenAt: number | null;
  unit: string;
  /** Metric.target nguyên văn — để vẽ đường mục tiêu kèm nhãn. */
  target: string;
  /** metricDirection() — cao hơn là tốt (up) hay xấu (down). */
  direction: "up" | "down";
  /** Có ít nhất một điểm demo — UI đọc cờ này để gắn nhãn "minh hoạ", không hardcode. */
  demo: boolean;
  /** Câu nói ra chỗ trộn grain; null khi không có kỳ trước nào (chỉ mốc đóng băng + sau). */
  note: string | null;
};

/** null khi issue không tồn tại, không có mốc đóng băng (Snapshot), hoặc metric không phân giải
    được — không có điểm neo thì không vẽ, UI in "chưa có mốc so sánh" thay vì đoán. Dòng hist
    không snapshot đã bị validate.ts nhóm 23 chặn từ tầng dữ liệu. */
export function verifyTimeline(issueId: string, data: CxmData): VerifyTimeline | null {
  const issue = data.iss.find((i) => i.id === issueId);
  if (!issue) return null;
  const snap = data.snap.find((s) => s.iss === issueId);
  if (!snap) return null;
  const metric = data.metrics.find((m) => m.id === issue.metric);
  if (!metric) return null;

  const hist = data.hist.find((h) => h.iss === issueId);
  const action = data.act.find((a) => a.id === issue.act);
  const outcome = action ? data.out.find((o) => o.act === action.id) : undefined;

  const points: VerifyPoint[] = [
    ...(hist?.pre ?? []).map((pt) => ({ p: pt.p, v: pt.v, kind: "pre" as const, demo: hist!.demo })),
    { p: snap.m.p, v: snap.m.v, kind: "frozen", demo: false },
  ];
  if (outcome) points.push({ p: outcome.post.p, v: outcome.post.v, kind: "post", demo: false });

  const frozenAt = hist?.pre.length ?? 0;
  const hasRel = action?.rel !== undefined && action.rel !== "";

  return {
    points,
    releaseAfter: hasRel ? frozenAt : null,
    releaseLabel: hasRel ? action!.rel! : null,
    frozenAt,
    unit: snap.m.u,
    target: metric.target,
    direction: metricDirection(metric),
    demo: points.some((pt) => pt.demo),
    note:
      frozenAt > 0
        ? "Các kỳ trước là điểm theo tháng; mốc đóng băng và số \"sau\" đo trên cửa sổ riêng ghi ở nhãn — hai grain khác nhau trên cùng một đường."
        : null,
  };
}
