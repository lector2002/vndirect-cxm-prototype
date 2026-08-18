import type { CxmData, Flow, Group, Metric, Phase, Signal, Step, Touchpoint } from "../data/schema/index.ts";
import { MISSING, UNKNOWN_YET } from "../data/segment.ts";
import { NOT_IDENTIFIED, SIG_CUST_DIMS, SIG_FIRE_DIM } from "../data/projectSignalCounts.ts";

/* domain/signalRegistry.ts — phép đếm của màn Điểm đo (#/signals, module-i-signal-registry-charter.md
   §14, lát I4a). Thuần, không React, không đọc store — cùng khuôn domain/sources.ts.

   D5 (charter §5, §9-8): "có chạy" suy TỪ LƯU LƯỢNG (`Signal.vol > 0`), KHÔNG đọc `Signal.st`. `st`
   chỉ còn trả lời "có tin dùng chưa" (live/validating) và "dự định làm hay biết thiếu" (designed/
   gap) — hai trục RỜI. Dữ liệu hôm nay khớp 30/30 giữa hai trục, nhưng đó là MAY, không phải LUẬT
   (charter: "không luật nào ép quan hệ này") — các hàm dưới đây KHÔNG thêm ràng buộc ép chúng khớp. */

export type SignalCount = { n: number; of: number };

/** Trục 1 D5 — điểm đo có đang chở lưu lượng, suy TỪ `vol`, không đọc `st`. */
export function isSignalRunning(s: Signal): boolean {
  return s.vol > 0;
}

/** Điểm đo đang chở lưu lượng / tổng số điểm đo. */
export function runningSignalCount(data: CxmData): SignalCount {
  return { n: data.signals.filter(isSignalRunning).length, of: data.signals.length };
}

/** Điểm đo khai mà chưa chạy (`vol === 0`), tách theo `st`: "dự định làm" (designed) khác "biết
    thiếu chưa làm" (gap). `st` ở đây chỉ dùng để PHÂN LOẠI trong tập đã biết chưa chạy bằng lưu
    lượng — không dùng để SUY "có chạy" (D5). */
export type NotRunningSplit = { designed: Signal[]; gap: Signal[] };
export function notRunningSignals(data: CxmData): NotRunningSplit {
  const notRunning = data.signals.filter((s) => !isSignalRunning(s));
  return {
    designed: notRunning.filter((s) => s.st === "designed"),
    gap: notRunning.filter((s) => s.st === "gap"),
  };
}

/** Điểm đo gắn vào MỘT bước, qua chuỗi allocate Signal.tpId → Touchpoint.stepId (charter §3). */
export function signalsOfStep(data: CxmData, stepId: string): Signal[] {
  const tpIds = new Set(data.touchpoints.filter((t) => t.stepId === stepId).map((t) => t.id));
  return data.signals.filter((s) => tpIds.has(s.tpId));
}

/* ---- Hồ sơ một điểm đo (module-i-signal-registry-charter.md §3, §14 lát I4b) ---- */

/** Chuỗi allocate ĐI HẾT `Signal.tpId → Touchpoint.stepId → Step.flowId → Flow.groupId →
    Group.phaseId` (charter §3 mặt 2). `ok:false` nêu rõ ĐỨT Ở ĐÂU — không render rỗng khi một
    tham chiếu không tìm thấy bản ghi tương ứng (F2 charter). Dữ liệu hôm nay đi hết chuỗi cho cả
    30 signal, nhưng hàm không giả định điều đó — test F2 phải quét MỌI signal, không chỉ ca đẹp. */
export type SignalAllocation =
  | { ok: true; touchpoint: Touchpoint; step: Step; flow: Flow; group: Group; phase: Phase }
  | { ok: false; brokenAt: "touchpoint" | "step" | "flow" | "group" | "phase" };

export function signalAllocationChain(data: CxmData, signal: Signal): SignalAllocation {
  const touchpoint = data.touchpoints.find((t) => t.id === signal.tpId);
  if (!touchpoint) return { ok: false, brokenAt: "touchpoint" };
  const step = data.steps.find((s) => s.id === touchpoint.stepId);
  if (!step) return { ok: false, brokenAt: "step" };
  const flow = data.flows.find((f) => f.id === step.flowId);
  if (!flow) return { ok: false, brokenAt: "flow" };
  const group = data.groups.find((g) => g.id === flow.groupId);
  if (!group) return { ok: false, brokenAt: "group" };
  const phase = data.phases.find((p) => p.id === group.phaseId);
  if (!phase) return { ok: false, brokenAt: "phase" };
  return { ok: true, touchpoint, step, flow, group, phase };
}

/** Trục 2 D5 — "có tin dùng" suy TỪ NGƯỜI KHAI (`Signal.st`), KHÔNG suy từ lưu lượng. Bốn nhãn
    RỜI với trục 1 (`isSignalRunning`, suy từ `vol`) — hai trục không được gộp lại (charter D5). */
const DECLARED_STATE_LABEL: Record<Signal["st"], string> = {
  live: "trusted",
  validating: "validating",
  designed: "spec ready",
  gap: "not tracked",
};
export function declaredStateLabel(s: Signal): string {
  return DECLARED_STATE_LABEL[s.st];
}

/** Điểm đo đang CHỞ LƯU LƯỢNG THẬT (trục 1, suy từ `vol`) mà CHƯA được đánh dấu tin dùng (trục 2,
    `st !== 'live'`) — tình trạng phải THẤY ĐƯỢC (charter §14 I4b), không phải lỗi phải chặn. Hôm
    nay đúng là tập `validating ∧ vol>0` (charter T8/§4), nhưng hàm không giả định quan hệ đó —
    dựng `st='designed'` mà `vol>0` (D5 test) cũng phải rơi vào đây. */
export function runningNotTrusted(s: Signal): boolean {
  return isSignalRunning(s) && s.st !== "live";
}

/** D6/§13 — so `Signal.seen` ("dd/mm · hh:mm", KHÔNG có năm) với mốc số liệu `asOf` ("dd/mm/yyyy")
    CHỈ theo tháng/ngày, trả lời ĐÚNG một câu hỏi: mốc khai có nằm NGOÀI cửa sổ dữ liệu không.
    TUYỆT ĐỐI không suy ra số ngày/giờ đã trôi — đó là việc D6 cấm (seen không có năm, cả fixture
    chỉ 2 ngày phân biệt, tính tuổi sẽ báo sai "hầu hết điểm đo đã chết"). `false` khi thiếu một
    trong hai chuỗi hoặc không đọc được khuôn dd/mm. */
export function seenAfterAsOf(seen: string | null, asOf: string): boolean {
  if (!seen) return false;
  const seenMatch = /^(\d{2})\/(\d{2})/.exec(seen);
  const asOfMatch = /^(\d{2})\/(\d{2})/.exec(asOf);
  if (!seenMatch || !asOfMatch) return false;
  const [, sd, sm] = seenMatch;
  const [, ad, am] = asOfMatch;
  return Number(sm) > Number(am) || (Number(sm) === Number(am) && Number(sd) > Number(ad));
}

/** Điểm đo chưa có giá trị nào đã khai (mặt 4, `Signal.values` rỗng) — luôn đi cùng `vol === 0`
    theo thiết kế của trường (journey.ts:77-82: chưa instrument/implement thì mảng rỗng). */
export function signalsWithoutValues(data: CxmData): Signal[] {
  return data.signals.filter((s) => s.values.length === 0);
}

/** Bước không có điểm đo nào ĐANG CHẠY (T4 charter) — HAI SỐ LỒNG NHAU, không cộng được: `none`
    (không có điểm đo nào cả) là TẬP CON của `noneRunning` (không có cái nào đang chạy), vì một bước
    không điểm đo nào thì hiển nhiên không có cái nào đang chạy. Nơi render PHẢI viết lồng
    ("X bước…, trong đó Y…"), không đặt hai ô cạnh nhau như hai nhóm rời (charter T4, §9 tiêu chí 7). */
export type StepRunningCoverage = { none: Step[]; noneRunning: Step[] };
export function stepsWithoutRunningSignal(data: CxmData): StepRunningCoverage {
  const none: Step[] = [];
  const noneRunning: Step[] = [];
  for (const step of data.steps) {
    const sigs = signalsOfStep(data, step.id);
    if (sigs.length === 0) none.push(step);
    if (!sigs.some(isSignalRunning)) noneRunning.push(step);
  }
  return { none, noneRunning };
}

/** Điểm đo không nuôi chỉ số nào (T5 charter). */
export function signalsWithoutMetric(data: CxmData): Signal[] {
  return data.signals.filter((s) => s.metrics.length === 0);
}

/** Chỉ số không có điểm đo nào nuôi (T7 charter). */
export function metricsWithoutSignal(data: CxmData): Metric[] {
  const fed = new Set(data.signals.flatMap((s) => s.metrics));
  return data.metrics.filter((m) => !fed.has(m.id));
}

/* ---- Khối ② — độ tin cậy của dữ liệu ĐÃ NHẬN (bất biến 9), theo TỪNG CHIỀU của sigCounts ---- */

/** Năm chiều của bảng đếm điểm đo (data/projectSignalCounts.ts) — MỘT nguồn, không liệt kê tay lần
    hai (cùng tinh thần bất biến E-c của data/bands.ts). */
export const SIG_COUNT_DIMS: readonly string[] = [SIG_FIRE_DIM, ...SIG_CUST_DIMS];

export type DimReliability = {
  dim: string;
  /** Mẫu số của CHÍNH chiều này — tổng n mọi dòng sigCounts của chiều, không phải tổng lưu lượng. */
  total: number;
  /** CHỈ nhãn "thiếu" — owner chốt 07/08 phương án (a). Lỗi đo DUY NHẤT tính được hôm nay. */
  missing: number;
  /** "chưa định danh" — khách chưa có hồ sơ lúc event xảy ra. HỢP LỆ, không phải lỗi. */
  notIdentified: number;
  /** "chưa-biết" — có hồ sơ khách, trường chưa từng được ghi. Việc của CRM/nghiệp vụ, không phải
      lỗi đo. */
  unknownYet: number;
};

/** Đếm lại từ `data.sigCounts` cho mỗi chiều. RỖNG khi `sigCounts` rỗng (Demo Mode tắt — trạng thái
    TRUNG THỰC "chưa nhận số đếm", KHÔNG phải 0%) — nơi render phải tự phân biệt bằng
    `data.sigCounts.length === 0`, hàm này không tự bịa cách hiện của ca đó. */
export function sigCountReliability(data: CxmData): DimReliability[] {
  return SIG_COUNT_DIMS.map((dim) => {
    const rows = data.sigCounts.filter((r) => r.dim === dim);
    const sum = (pred: (band: string) => boolean) =>
      rows.filter((r) => pred(r.band)).reduce((a, r) => a + r.n, 0);
    return {
      dim,
      total: rows.reduce((a, r) => a + r.n, 0),
      missing: sum((b) => b === MISSING),
      notIdentified: sum((b) => b === NOT_IDENTIFIED),
      unknownYet: sum((b) => b === UNKNOWN_YET),
    };
  });
}
