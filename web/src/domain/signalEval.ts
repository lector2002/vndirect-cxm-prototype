import type { Cfg, CfgSignalBand, SigFire, Signal } from "../data/schema/index.ts";
import { isoFromVn } from "../data/projectSigTrend.ts";

/* Trạng thái ĐÁNH GIÁ của một điểm đo theo ngưỡng riêng của nó (`cfg.signal[id]`, schema/config.ts
   — owner chốt 19/08). TRỰC GIAO với trạng thái vòng đời `Signal.st` (Live/Validating/Spec ready/
   Not tracked, signalStatus.ts): vòng đời nói "điểm đo có đang chạy không", đánh giá nói "số nó
   bắn ra có đáng lo không". Hai cột, hai câu hỏi — không gộp.

   MỘT GIỌNG TRÊN MỌI MÀN: cửa sổ đo lấy từ cfg (theo SIGNAL), không bao giờ theo range toggle của
   màn đang mở — một điểm đo hai trạng thái tuỳ màn là vi phạm đúng lý do signalStatus.ts tách file.

   `unknown` có LÝ DO RIÊNG TỪNG LOẠI, không trộn (luật không-trộn-chưa-biết-với-thiếu): chưa đặt
   ngưỡng ≠ chưa đủ mẫu ≠ chưa khai mốc cắm. Mọi nhánh unknown KHÔNG rơi về ok. */

/** Cửa sổ mặc định khi entry không khai `winDays` — cùng khuôn `SOURCE_ALLOW_DAYS_DEFAULT`
    (domain/state.ts): một chính sách chung hợp lý, không phải phán đoán trá hình. */
export const SIGNAL_WINDOW_DAYS_DEFAULT = 7;

/** Nhãn bốn dụng cụ đo — dùng chung giữa nhóm cấu hình (#/rules) và drawer (#/signals), hai màn
    không được gọi cùng một kind bằng hai tên. */
export const SIGNAL_BAND_KIND_LABEL: Record<CfgSignalBand["kind"], string> = {
  badRate: "Bad-value rate",
  goodRate: "Good-value rate",
  floor: "Traffic floor",
  ceiling: "Failure ceiling",
};

export type SignalEvalUnknownWhy =
  | "unset" // chưa có entry trong cfg.signal — chưa đặt ngưỡng
  | "no-values" // kind rate nhưng bad/good rỗng — entry khai dở, chưa chọn giá trị
  | "lifecycle" // st là gap/designed — điểm đo chưa chạy, không có gì để đánh
  | "bad-asof" // data.asOf sai khuôn dd/MM/yyyy — không dựng được cửa sổ
  | "no-instAt" // floor/ceiling cần biết đo từ bao giờ; instAt null thì 0 lượt mơ hồ giữa "im" và "chưa đo"
  | "partial-window" // cắm đo giữa cửa sổ — số đếm thiếu ngày, so với ngưỡng cả cửa sổ là so lệch
  | "no-fires" // rate: không có lượt bắn nào trong cửa sổ — mẫu số 0, tỉ lệ không tồn tại
  | "small-sample"; // rate: n < minN — chưa đủ mẫu để tỉ lệ có nghĩa

export type SignalEval =
  | { state: "unknown"; why: SignalEvalUnknownWhy; n?: number; minN?: number }
  /** `value`: % (hai kind rate) hoặc số lượt trong cửa sổ (floor/ceiling). `n`: mẫu số của rate;
      với floor/ceiling n = value (một số đếm, khai cả hai cho chỗ hiện không phải phân nhánh). */
  | { state: "ok" | "watch" | "crit"; n: number; value: number };

/** iso + k ngày (k âm được), UTC — cùng lý do với nextDay (data/projectSigTrend.ts): ngày là nhãn,
    múi giờ địa phương không được tham gia. */
function addDaysIso(iso: string, k: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}

export function signalWinDays(band: CfgSignalBand): number {
  return band.winDays ?? SIGNAL_WINDOW_DAYS_DEFAULT;
}

/** Đánh giá MỘT điểm đo trên các lượt bắn ĐÃ LỌC theo sigId — lõi dùng chung của hai export dưới. */
function evalWithOwnFires(signal: Signal, mine: readonly SigFire[], band: CfgSignalBand, toIso: string): SignalEval {
  if (signal.st === "gap" || signal.st === "designed") return { state: "unknown", why: "lifecycle" };

  const winDays = signalWinDays(band);
  const from = addDaysIso(toIso, -(winDays - 1));
  const inWin = mine.filter((f) => f.at >= from && f.at <= toIso);

  if (band.kind === "floor" || band.kind === "ceiling") {
    /* Không có mốc cắm thì 0 lượt trong cửa sổ mơ hồ giữa "đo mà im" và "chưa đo" — đúng biên mà
       ba trạng thái của chart sinh ra để giữ (Signal.instAt, schema/journey.ts). Cắm GIỮA cửa sổ
       thì số đếm chỉ phủ một phần ngày: so nó với ngưỡng đặt cho CẢ cửa sổ là so lệch — floor sẽ
       báo động giả. Không chia tỉ lệ bù (phép toán không ai kiểm được bằng mắt): trả chưa-biết,
       điểm đo mới cắm tự hết mơ hồ sau winDays ngày. */
    if (signal.instAt === null) return { state: "unknown", why: "no-instAt" };
    if (signal.instAt > from) return { state: "unknown", why: "partial-window" };
    const bad = band.kind === "ceiling" ? band.bad : undefined;
    const counted = bad && bad.length > 0 ? inWin.filter((f) => bad.includes(f.val)) : inWin;
    const value = counted.length;
    const state =
      band.kind === "floor"
        ? value <= band.crit
          ? "crit"
          : value <= band.warn
            ? "watch"
            : "ok"
        : value >= band.crit
          ? "crit"
          : value >= band.warn
            ? "watch"
            : "ok";
    return { state, n: value, value };
  }

  const vals = band.kind === "badRate" ? band.bad : band.good;
  if (vals.length === 0) return { state: "unknown", why: "no-values" };
  const n = inWin.length;
  if (n === 0) return { state: "unknown", why: "no-fires" };
  const minN = band.minN ?? 1;
  if (n < minN) return { state: "unknown", why: "small-sample", n, minN };
  const hit = inWin.filter((f) => vals.includes(f.val)).length;
  const value = (hit / n) * 100;
  const state =
    band.kind === "badRate"
      ? value >= band.crit
        ? "crit"
        : value >= band.warn
          ? "watch"
          : "ok"
      : value <= band.crit
        ? "crit"
        : value <= band.warn
          ? "watch"
          : "ok";
  return { state, n, value };
}

export function signalEval(signal: Signal, fires: readonly SigFire[], cfg: Cfg, asOfVn: string): SignalEval {
  const band = cfg.signal[signal.id];
  if (!band) return { state: "unknown", why: "unset" };
  const toIso = isoFromVn(asOfVn);
  if (toIso === null) return { state: "unknown", why: "bad-asof" };
  return evalWithOwnFires(
    signal,
    fires.filter((f) => f.sigId === signal.id),
    band,
    toIso,
  );
}

/** Bản chạy MỘT LƯỢT cho cả danh sách — gom lượt bắn theo sigId đúng một lần thay vì lọc lại toàn
    bộ `sigFires` cho từng điểm đo (menu #/rules và bảng nhóm gọi mỗi lần render). */
export function signalEvalAll(
  signals: readonly Signal[],
  fires: readonly SigFire[],
  cfg: Cfg,
  asOfVn: string,
): Map<string, SignalEval> {
  const toIso = isoFromVn(asOfVn);
  const bySig = new Map<string, SigFire[]>();
  for (const f of fires) {
    const list = bySig.get(f.sigId);
    if (list) list.push(f);
    else bySig.set(f.sigId, [f]);
  }
  const out = new Map<string, SignalEval>();
  for (const s of signals) {
    const band = cfg.signal[s.id];
    if (!band) out.set(s.id, { state: "unknown", why: "unset" });
    else if (toIso === null) out.set(s.id, { state: "unknown", why: "bad-asof" });
    else out.set(s.id, evalWithOwnFires(s, bySig.get(s.id) ?? [], band, toIso));
  }
  return out;
}

/* ---- Lưu lượng theo ngày (owner chốt 19/08: "nếu đã per day hay per thời gian thì cần phải đọc
   đúng trong timeframe đó") ----

   Mọi chỗ ghi nhãn "Traffic per day" TRƯỚC đây đọc `Signal.vol` — tổng lượt bắn CẢ ĐỜI (ràng buộc 1
   validate.ts ghim fires đếm được = vol), tức con số không phải per-day. Từ nay per-day phải ĐẾM từ
   hạt thô `sigFires` trong cửa sổ, chia đúng số ngày cửa sổ.

   Ba luật kế thừa nguyên từ signalEval, không dựng luật cửa sổ thứ hai cạnh nó:
   · CỬA SỔ CỐ ĐỊNH cho mọi dòng (SIGNAL_WINDOW_DAYS_DEFAULT), KHÔNG theo winDays riêng của band —
     đây là cột thông tin để SO các điểm đo với nhau, mỗi dòng một cửa sổ thì hết so được, và 25
     điểm chưa đặt band vẫn phải có số.
   · Cắm đo giữa cửa sổ ⇒ chưa-biết, KHÔNG chia bù theo ngày đã đo — drawer trưng Evaluation (từ
     signalEval, từ chối cửa sổ dở) ngay cạnh dòng Traffic; hai hàng kề nhau hai luật cửa sổ là
     đúng bệnh hai-giọng mà signalStatus.ts tách file để chữa.
   · 0 lượt trong cửa sổ phủ đủ ngày = ĐO ĐƯỢC 0/ngày, không phải chưa-biết — dữ liệu một mình
     không phân biệt được "feed gãy" với "hệ im" (charter Module I §A, việc của manifest giao
     hàng), nên không bịa thêm lý do unknown từ fires rỗng. */
export type SignalTraffic =
  | { state: "unknown"; why: "lifecycle" | "bad-asof" | "no-instAt" | "partial-window" }
  | { state: "measured"; n: number; winDays: number; perDay: number };

export function signalTraffic(
  signal: Signal,
  fires: readonly SigFire[],
  asOfVn: string,
  winDays: number = SIGNAL_WINDOW_DAYS_DEFAULT,
): SignalTraffic {
  if (signal.st === "gap" || signal.st === "designed") return { state: "unknown", why: "lifecycle" };
  const toIso = isoFromVn(asOfVn);
  if (toIso === null) return { state: "unknown", why: "bad-asof" };
  if (signal.instAt === null) return { state: "unknown", why: "no-instAt" };
  const from = addDaysIso(toIso, -(winDays - 1));
  if (signal.instAt > from) return { state: "unknown", why: "partial-window" };
  const n = fires.filter((f) => f.sigId === signal.id && f.at >= from && f.at <= toIso).length;
  return { state: "measured", n, winDays, perDay: n / winDays };
}

/** Bản chạy MỘT LƯỢT cho cả danh sách — cùng lý do với signalEvalAll (bảng 30 dòng × chục nghìn
    lượt bắn demo, không lọc lại toàn bộ fires cho từng dòng). */
export function signalTrafficAll(
  signals: readonly Signal[],
  fires: readonly SigFire[],
  asOfVn: string,
  winDays: number = SIGNAL_WINDOW_DAYS_DEFAULT,
): Map<string, SignalTraffic> {
  const counted = new Map<string, number>();
  const toIso = isoFromVn(asOfVn);
  if (toIso !== null) {
    const from = addDaysIso(toIso, -(winDays - 1));
    for (const f of fires) {
      if (f.at >= from && f.at <= toIso) counted.set(f.sigId, (counted.get(f.sigId) ?? 0) + 1);
    }
  }
  const out = new Map<string, SignalTraffic>();
  for (const s of signals) {
    if (s.st === "gap" || s.st === "designed") out.set(s.id, { state: "unknown", why: "lifecycle" });
    else if (toIso === null) out.set(s.id, { state: "unknown", why: "bad-asof" });
    else if (s.instAt === null) out.set(s.id, { state: "unknown", why: "no-instAt" });
    else if (s.instAt > addDaysIso(toIso, -(winDays - 1))) out.set(s.id, { state: "unknown", why: "partial-window" });
    else {
      const n = counted.get(s.id) ?? 0;
      out.set(s.id, { state: "measured", n, winDays, perDay: n / winDays });
    }
  }
  return out;
}

/** Con số per-day thành chữ — MỘT phép viết cho cả ba tầng (bảng · drawer · hồ sơ). Dưới 10 giữ
    một chữ số lẻ (phẩy thập phân kiểu Việt), từ 10 làm tròn nguyên; KHÔNG dấu ngăn nghìn — cùng
    quyết định 18/08 của cột bảng ("9.510" cạnh chữ Anh đọc nhầm thành 9,51). */
export function signalTrafficText(t: SignalTraffic): string | null {
  if (t.state !== "measured") return null;
  if (t.perDay >= 10) return String(Math.round(t.perDay));
  const r = Math.round(t.perDay * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace(".", ",");
}

/** Câu chữ cho từng lý do unknown — MỘT chỗ, để drawer (#/signals) và nhóm cấu hình (#/rules) nói
    cùng một giọng về cùng một trạng thái (đúng lý do signalStatus.ts tách file). */
export function signalEvalWhyText(ev: SignalEval): string | null {
  if (ev.state !== "unknown") return null;
  switch (ev.why) {
    case "unset":
      return "chưa đặt ngưỡng";
    case "no-values":
      return "chưa chọn giá trị để đo";
    case "lifecycle":
      return "điểm đo chưa chạy";
    case "bad-asof":
      return "mốc số liệu sai khuôn, không dựng được cửa sổ";
    case "no-instAt":
      return "chưa khai mốc cắm đo";
    case "partial-window":
      return "cắm đo giữa cửa sổ, số đếm chưa phủ đủ ngày";
    case "no-fires":
      return "không có lượt bắn nào trong cửa sổ";
    case "small-sample":
      return `chưa đủ mẫu (n=${ev.n} < ${ev.minN})`;
  }
}
