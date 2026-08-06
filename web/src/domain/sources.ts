import type { Cfg, CxmData, DimRow, Evidence, Metric, Source, Survey } from "../data/schema/index.ts";
import { sourceHealth } from "./state.ts";
import type { SourceHealth } from "./state.ts";

/* Phép đếm của màn "Nguồn dữ liệu" (#/sources) — nguồn nào đang nhận, nguồn nào đứt, và nguồn đứt
   thì chỉ số nào đang ăn dữ liệu thiếu. Hàm THUẦN, không đọc store.

   BA CÁI BẪY GẶP LẠI Ở ĐÂY, ghi lại vì cả ba đều là loại "màn nói sai về chính nó":

   1. BA PHÉP ĐẾM TOÀN VẸN KHÔNG CÙNG MỘT THƯỚC. Prototype (dòng 3688-3700) xếp bốn ô số cạnh nhau,
      ba ô đọc là "N/M": độ tươi và tính liên tục đếm NGUỒN (7), độ phủ đếm ĐIỂM ĐO (30). Bốn ô cùng
      một hình, hai đơn vị — đúng cái bẫy hai mẫu số vừa xử ở #/vocjourney, chỉ chật hơn. Nên mỗi
      phép đếm ở đây MANG THEO ĐƠN VỊ CỦA CHÍNH NÓ (`IntegrityCount.unit`) và tầng render buộc phải
      in đơn vị ra; không có đường nào in trần "5/7" cạnh "28/30".

   2. TỶ LỆ THỤ ĐỘNG / CHỦ ĐỘNG CHIA CHO 0. Prototype viết `Math.round(passive / (active || 1))` —
      không có khảo sát nào thì nó trả về nguyên tổng volume thụ động dưới dạng một con số có hậu tố
      "×", trông y hệt một phép đo. Ở đây `ratio` trả `null` cho ca đó và tầng render nói bằng chữ.

   3. CHIỀU LỆCH CỦA CHỈ SỐ KHÔNG SUY ĐƯỢC TỪ DỮ LIỆU. Prototype đóng cứng một câu (dòng 3752):
      "Zalo OA ngừng gửi từ 19/07 nên repeat contact bị đếm thiếu. Con số 24% … thấp hơn thực tế."
      Mọi DỮ KIỆN trong câu đó đều tra được — nguồn nào đứt, đứt mấy ngày (`lagH`), nhận lần cuối
      (`last`), chỉ số nào ăn nguồn đó (`Source.metrics`), giá trị đang hiện (`Metric.value`). Riêng
      chữ "thấp hơn thực tế" thì KHÔNG: công thức của `m-repeat` là "Khách liên hệ lại ÷ khách có
      liên hệ" (`Metric.formula`), mà Zalo OA là một kênh liên hệ — mất nó thì hụt CẢ TỬ LẪN MẪU, và
      dữ liệu không nói được thương số đi lên hay đi xuống. Nên `brokenImpacts` trả DỮ KIỆN, tầng
      render nói ra khoảng hụt và chỉ đúng chủ chỉ số (`Metric.owner`) để hỏi — không phán chiều. */

/** Nguồn có vấn đề xếp lên đầu; trong mỗi nhóm giữ nguyên thứ tự khai báo (thứ tự khai báo là thứ
    tự người dựng dữ liệu chọn, không có lý do gì để mình xáo lại). */
export function sourcesByProblem(data: CxmData, cfg: Cfg): Source[] {
  const rank = (s: Source) => (sourceHealth(s, cfg) === "ok" ? 1 : 0);
  return data.sources
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map((x) => x.s);
}

/** Nguồn KHÔNG ở trạng thái `ok` — nguồn của mọi câu cảnh báo trên màn. */
export function unhealthySources(data: CxmData, cfg: Cfg): Source[] {
  return data.sources.filter((s) => sourceHealth(s, cfg) !== "ok");
}

/** Một phép đếm toàn vẹn. `unit` đi kèm là BẮT BUỘC, xem bẫy 1 ở đầu file. */
export type IntegrityCount = { n: number; of: number; unit: string };

/** Nguồn còn trong SLA độ trễ của chính nó. Nguồn đã đứt hẳn KHÔNG tính là trễ — nó là ca nặng hơn
    và được đếm riêng ở `continuityCount`; đếm nó vào cả hai chỗ là kể một nguồn hai lần. */
export function freshnessCount(data: CxmData, cfg: Cfg): IntegrityCount {
  const late = data.sources.filter((s) => sourceHealth(s, cfg) === "stale").length;
  return { n: data.sources.length - late, of: data.sources.length, unit: "nguồn" };
}

/** Nguồn chưa đứt. */
export function continuityCount(data: CxmData, cfg: Cfg): IntegrityCount {
  const dead = data.sources.filter((s) => sourceHealth(s, cfg) === "down").length;
  return { n: data.sources.length - dead, of: data.sources.length, unit: "nguồn" };
}

/** Điểm đo đã instrument — ĐƠN VỊ KHÁC HẲN hai phép trên, xem bẫy 1. `gap` = chưa gắn gì,
    `designed` = mới có spec; cả hai đều chưa bắn dữ liệu nên cùng nằm ngoài tử số. */
export function instrumentedCount(data: CxmData): IntegrityCount {
  const notYet = data.signals.filter((g) => g.st === "gap" || g.st === "designed").length;
  return { n: data.signals.length - notYet, of: data.signals.length, unit: "điểm đo" };
}

/** Nghe thụ động so với hỏi chủ động. `ratio` là `null` khi chưa có khảo sát nào — xem bẫy 2. */
export function passiveActive(data: CxmData): { passive: number; active: number; ratio: number | null } {
  const active = data.sources.filter((s) => s.kind === "survey").reduce((a, s) => a + s.vol, 0);
  const passive = data.sources.filter((s) => s.kind !== "survey").reduce((a, s) => a + s.vol, 0);
  return { passive, active, ratio: active === 0 ? null : passive / active };
}

/** Một nguồn đang hỏng + đúng những chỉ số ăn nó. `days` là số ngày trọn vẹn suy từ `lagH`. */
export type BrokenImpact = {
  source: Source;
  health: Exclude<SourceHealth, "ok">;
  days: number;
  /** Chỉ số ăn nguồn này. RỖNG là ca thật (`src-store`, `src-broker` không nối chỉ số nào) và có
      nghĩa khác hẳn: nguồn hỏng nhưng không làm lệch con số nào — chỉ mất tiếng nói của khách. */
  metrics: Metric[];
};

export function brokenImpacts(data: CxmData, cfg: Cfg): BrokenImpact[] {
  return unhealthySources(data, cfg).map((s) => ({
    source: s,
    health: sourceHealth(s, cfg) as Exclude<SourceHealth, "ok">,
    days: Math.floor(s.lagH / 24),
    metrics: s.metrics.map((id) => data.metrics.find((m) => m.id === id)).filter((m): m is Metric => !!m),
  }));
}

/** Chỉ số đang ăn dữ liệu từ ít nhất một nguồn hỏng, mỗi chỉ số ĐÚNG MỘT LẦN — hai nguồn cùng hỏng
    cùng nuôi một chỉ số vẫn là một chỉ số bị ảnh hưởng, đếm hai lần là thổi con số trên tiêu đề. */
export function metricsAtRisk(data: CxmData, cfg: Cfg): Metric[] {
  const seen = new Set<string>();
  return brokenImpacts(data, cfg)
    .flatMap((b) => b.metrics)
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
}

/** Chủ của các chỉ số đang bị ảnh hưởng — người phải hỏi khi cần biết con số lệch chiều nào. */
export function ownersAtRisk(data: CxmData, cfg: Cfg): string[] {
  return [...new Set(metricsAtRisk(data, cfg).map((m) => m.owner))];
}

/** Độ trễ đọc bằng chữ. Dưới một ngày thì giờ là đơn vị đúng; quá một ngày thì "192 giờ" bắt người
    đọc tự chia. Thuần chuỗi, không React — nên ở `domain/` cạnh `brokenImpacts` vốn cũng quy `lagH`
    ra ngày, để hai chỗ không trôi khỏi nhau. */
export function lagText(lagH: number): string {
  if (lagH < 24) return `trễ ${lagH} giờ`;
  const days = Math.floor(lagH / 24);
  const rest = lagH % 24;
  return rest === 0 ? `trễ ${days} ngày` : `trễ ${days} ngày ${rest} giờ`;
}

/** Bằng chứng mẫu đến từ một nguồn. */
export function evidenceOfSource(data: CxmData, srcId: string): Evidence[] {
  return data.ev.filter((e) => e.src === srcId);
}

/* Các phân bố dưới đây đếm trên TẬP BẰNG CHỨNG MẪU của một nguồn, KHÔNG phải trên `Source.vol`.
   Hai con số cách nhau rất xa (`src-ga`: 157 bằng chứng so với 41.200 volume) nên chỗ hiển thị phải
   nói ra mình đang đếm cái nào — cùng luật hai mẫu số ở #/vocjourney. */

function rowsFrom(counts: Map<string, number>, label: (k: string) => string, color?: (k: string) => string): DimRow[] {
  return [...counts.entries()]
    .map(([id, v]) => ({ id, l: label(id), v, ...(color ? { c: color(id) } : {}) }))
    .sort((a, b) => b.v - a.v);
}

function tally<T>(items: readonly T[], key: (x: T) => string | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of items) {
    const k = key(x);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function distByIntent(data: CxmData, evs: readonly Evidence[]): DimRow[] {
  return rowsFrom(
    tally(evs, (e) => e.cat),
    (k) => data.cats[k]?.label ?? k,
    (k) => data.cats[k]?.color ?? "var(--ink3)",
  );
}

/* Sắc thái chia ba nhóm quanh 0. Ngưỡng ±0,2 là ranh giới của chính màn này chứ không phải hằng số
   toàn hệ — nếu sau này owner muốn đổi thì đây là chỗ sửa, và đổi ở đây là đổi mọi chỗ đọc nó. */
const SEN_EDGE = 0.2;
const SEN_ORDER = ["neg", "neu", "pos"] as const;
type SenBucket = (typeof SEN_ORDER)[number];

const SEN_LABEL: Record<SenBucket, string> = { neg: "Tiêu cực", neu: "Trung tính", pos: "Tích cực" };
const SEN_COLOR: Record<SenBucket, string> = { neg: "var(--crit)", neu: "var(--ink3)", pos: "var(--good)" };

export function senBucket(sen: number): SenBucket {
  if (sen <= -SEN_EDGE) return "neg";
  if (sen >= SEN_EDGE) return "pos";
  return "neu";
}

/* Giữ THỨ TỰ tiêu cực → trung tính → tích cực thay vì xếp theo số đếm: đây là một thang, không phải
   bảng xếp hạng. Xếp lại theo số đếm thì hình dạng của thang đổi theo từng nguồn, không so được. */
export function distBySentiment(evs: readonly Evidence[]): DimRow[] {
  const counts = tally(evs, (e) => senBucket(e.sen));
  return SEN_ORDER.filter((k) => counts.has(k)).map((k) => ({
    id: k,
    l: SEN_LABEL[k],
    v: counts.get(k) ?? 0,
    c: SEN_COLOR[k],
  }));
}

const PF_LABEL: Record<string, string> = { ios: "iOS", android: "Android", web: "Web", server: "Server" };

export function distByPlatform(evs: readonly Evidence[]): DimRow[] {
  return rowsFrom(
    tally(evs, (e) => e.pf),
    (k) => PF_LABEL[k] ?? k,
  );
}

/* Topic và phase đọc qua `Evidence.tax`, mảng id node ở nhiều tầng. Mỗi bằng chứng đóng góp TỐI ĐA
   MỘT lần cho mỗi phân bố (`find`, không phải `filter`) — một bằng chứng gắn hai node cùng tầng vẫn
   là một tiếng nói, cộng hai lần là thổi tổng vượt số bằng chứng thật. */
function distByTaxLevel(data: CxmData, evs: readonly Evidence[], lv: string): DimRow[] {
  const nodeName = (id: string) => data.tax.find((t) => t.id === id)?.name ?? id;
  return rowsFrom(
    tally(evs, (e) => e.tax.find((id) => data.tax.find((t) => t.id === id)?.lv === lv)),
    nodeName,
  );
}

export function distByTheme(data: CxmData, evs: readonly Evidence[]): DimRow[] {
  return distByTaxLevel(data, evs, "theme");
}

export function distByPhase(data: CxmData, evs: readonly Evidence[]): DimRow[] {
  return distByTaxLevel(data, evs, "L1");
}

/** Khảo sát: đang chạy / tạm dừng / chưa đạt mục tiêu. `offTarget` chỉ đếm khảo sát ĐANG CHẠY —
    một khảo sát đã dừng thì "chưa đạt mục tiêu" không còn là việc phải xử, nó là hệ quả của việc
    dừng. */
export function surveyCounts(data: CxmData): { running: number; paused: number; offTarget: number } {
  return {
    running: data.surveys.filter((s) => s.status === "running").length,
    paused: data.surveys.filter((s) => s.status === "paused").length,
    offTarget: data.surveys.filter((s) => s.status === "running" && s.state !== "ok").length,
  };
}

/** Khảo sát có vấn đề lên đầu: đã dừng trước, rồi đang chạy mà chưa đạt, rồi phần còn lại. */
export function surveysByProblem(data: CxmData): Survey[] {
  const rank = (s: Survey) => (s.status === "paused" ? 0 : s.state !== "ok" ? 1 : 2);
  return data.surveys
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map((x) => x.s);
}
