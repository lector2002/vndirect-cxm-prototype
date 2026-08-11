import type { CxmData, Metric, Signal, Step } from "../data/schema/index.ts";
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
