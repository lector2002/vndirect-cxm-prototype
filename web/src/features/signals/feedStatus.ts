import type { Cfg, CxmData, Signal } from "../../data/schema/index.ts";
import type { SignalFeedHealth } from "../../domain/index.ts";
import {
  isSignalRunning,
  signalFeedHealth,
  sourceDaysMissing,
} from "../../domain/index.ts";
import type { BadgeState } from "../../design-system/index.ts";

/* Nhãn + tông độ tươi nguồn giao của MỘT ĐIỂM ĐO — dời từ SignalProfile.tsx ra file chung 18/08
   tối (owner, đợt "last seen phải thấy ngay data có về định kì không"): bảng và hồ sơ cùng đọc
   một map, không ai chép tay của ai.

   Đính chính khi dời (18/08 tối): docblock cũ nói bốn nhãn đầu "CHÉP NGUYÊN VĂN từ SourcesPage.tsx"
   — đúng lúc viết (12/08) nhưng SAI từ đợt thuật ngữ tiếng Anh 18/08: phía signals đã đổi sang
   Receiving/Missing days/Stopped, còn SourcesPage vẫn "Đang nhận/Thiếu ngày dữ liệu/Ngừng gửi"
   (nợ bilingual đã ghi). Bốn nhãn dưới là giọng của PHÍA SIGNALS; cùng bậc thang `sourceHealth`,
   khác ngôn ngữ. Nhánh "unknown" là của riêng điểm đo (chưa nối nguồn ⇒ không có gì để chấm) và
   KHÔNG được mượn nhãn "Silent": im lặng là nguồn có mà không giao, còn đây là chưa biết nguồn nào. */
export const FEED_LABEL: Record<SignalFeedHealth, string> = {
  ok: "Receiving",
  stale: "Missing days",
  down: "Stopped",
  silent: "Silent, unclassified",
  unknown: "No source linked",
};

/* 18/08 tối (owner, sau đợt đảo thứ bậc): "bỏ cái tick đi và cho màu đánh màu cho tình trạng nữa"
   — Receiving thôi mượn state `ok` (✓, không màu), sang `good` (lục, không prefix — đợt trước đã
   bỏ ✓ ở good). Trạng thái đang-nhận giờ cũng đọc được bằng màu như ba trạng thái còn lại. */
export const FEED_BADGE: Record<SignalFeedHealth, BadgeState> = {
  ok: "good",
  stale: "watch",
  down: "crit",
  silent: "unknown",
  unknown: "unknown",
};

/* FEED_TONE (map tông chữ trần cho dòng trạng thái của bảng) sống đúng MỘT đợt 18/08 rồi bỏ cùng
   tối: owner đảo thứ bậc ô — trạng thái giao nhận lên làm thông tin chính và mang khung/màu của
   Badge (FEED_BADGE ở trên, CÙNG badge với hồ sơ), nên một map tông chữ riêng cho bảng thành
   giọng thứ hai của cùng một tình trạng. */

/** Câu trạng thái giao nhận, kèm SỐ NGÀY THIẾU đo bằng máy (`sourceDaysMissing` — mốc feed của
    nguồn so với Data as of). `daysMissing` null/0 hoặc bậc không có gì để đếm thì trả nhãn trần.
    KHÔNG BAO GIỜ đếm từ `Signal.seen` người gõ — D6 (charter §5). */
export function feedStatusText(health: SignalFeedHealth, daysMissing: number | null): string {
  const n = daysMissing ?? 0;
  const dayWord = n === 1 ? "day" : "days";
  if (health === "stale" && n > 0) return `Missing ${n} ${dayWord}`;
  if (health === "down" && n > 0) return `Stopped \u00b7 missing ${n} ${dayWord}`;
  return FEED_LABEL[health];
}

/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   25/08 (owner duy\u1ec7t mock rd-2508-signals): C\u1ed8T TR\u1ea0NG TH\u00c1I G\u1ed8P. B\u1ea3ng c\u0169 in m\u1ed9t s\u1ef1 th\u1eadt ba l\u1ea7n \u2014
   c\u1ed9t Status (Live) + c\u1ed9t Feed status (Receiving) + drawer (RUNNING) \u2014 nay b\u1ea3ng v\u00e0 drawer c\u00f9ng \u0111\u1ecdc
   M\u1ed8T tr\u1ea1ng th\u00e1i b\u1ed1n b\u1eadc t\u1eeb h\u00e0m n\u00e0y. \u01afu ti\u00ean x\u1ea5u-nh\u1ea5t-tr\u01b0\u1edbc:

     1. feed "down"        \u2192 crit  "M\u1ea5t d\u1eef li\u1ec7u \u00b7 N ng\u00e0y"   (ngu\u1ed3n ng\u1eebng giao \u2014 s\u1ed1 ng\u00e0y m\u00e1y \u0111\u1ebfm)
     2. feed "stale"       \u2192 watch "Thi\u1ebfu d\u1eef li\u1ec7u \u00b7 N ng\u00e0y" (ngu\u1ed3n tr\u1ec5 nh\u1ecbp)
     3. ch\u01b0a ch\u1ea1y (vol=0)  \u2192 unknown "Ch\u01b0a ch\u1ea1y \u00b7 c\u00f3 spec" / "Ch\u01b0a \u0111o" / "Ch\u01b0a ch\u1ea1y" (theo st)
     4. st "validating"    \u2192 watch "\u0110ang th\u1eed"
     5. c\u00f2n l\u1ea1i            \u2192 good  "\u0110ang ch\u1ea1y"

   Ng\u00e0y CH\u1ec8 xu\u1ea5t hi\u1ec7n khi \u0111\u1ee9t (b\u1eadc 1\u20132) \u2014 h\u1ebft c\u1ea3nh "27 Jul" l\u1eb7p 25 d\u00f2ng d\u01b0\u1edbi badge Receiving.
   Nh\u00e3n xu\u1ea5t x\u1ee9 ("inferred from traffic" / "self-reported") b\u1ecf theo quy\u1ebft \u0111\u1ecbnh owner 25/08: ch\u1ec9 c\u00f3
   m\u1ed9t ngu\u1ed3n report n\u00ean ph\u00e2n bi\u1ec7t xu\u1ea5t x\u1ee9 kh\u00f4ng c\u00f2n mang tin \u1edf t\u1ea7ng b\u1ea3ng/drawer.

   B\u1eadc 3 \u0111\u1ee9ng TR\u01af\u1edaC b\u1eadc 4 v\u00ec "validating m\u00e0 vol=0" (kh\u00f4ng c\u00f3 trong fixture h\u00f4m nay, D5 kh\u00f4ng \u00e9p)
   ph\u1ea3i \u0111\u1ecdc l\u00e0 ch\u01b0a ch\u1ea1y \u2014 "\u0110ang th\u1eed" h\u00e0m \u00fd c\u00f3 s\u1ed1 li\u1ec7u \u0111ang v\u1ec1. */
/** `kind` l\u00e0 tr\u1ee5c L\u1eccC (chip \u0111\u1ea7u m\u00e0n kh\u1edbp b\u1eb1ng n\u00f3, kh\u00f4ng so chu\u1ed7i nh\u00e3n): "feed-lost" g\u1ed9p c\u1ea3 hai b\u1eadc
    \u0111\u1ee9t/tr\u1ec5 \u2014 m\u1ed9t chip "M\u1ea5t d\u1eef li\u1ec7u" cho m\u1ecdi d\u00f2ng c\u1ea7n ng\u01b0\u1eddi v\u1eadn h\u00e0nh ng\u00f3 ngu\u1ed3n. */
export type SignalRowStatusKind = "running" | "trying" | "feed-lost" | "not-running";
export type SignalRowStatus = { kind: SignalRowStatusKind; badge: BadgeState; label: string };

export function signalRowStatus(sig: Signal, data: CxmData, cfg: Cfg): SignalRowStatus {
  const health = signalFeedHealth(sig, data.sources, cfg, data.asOf);
  const src = data.sources.find((x) => x.id === sig.srcId);
  const missing = src ? sourceDaysMissing(src, data.asOf) : 0;
  const days = missing > 0 ? ` \u00b7 ${missing} ng\u00e0y` : "";
  if (health === "down") return { kind: "feed-lost", badge: "crit", label: `M\u1ea5t d\u1eef li\u1ec7u${days}` };
  if (health === "stale") return { kind: "feed-lost", badge: "watch", label: `Thi\u1ebfu d\u1eef li\u1ec7u${days}` };
  if (!isSignalRunning(sig)) {
    if (sig.st === "designed") return { kind: "not-running", badge: "unknown", label: "Ch\u01b0a ch\u1ea1y \u00b7 c\u00f3 spec" };
    if (sig.st === "gap") return { kind: "not-running", badge: "unknown", label: "Ch\u01b0a \u0111o" };
    return { kind: "not-running", badge: "unknown", label: "Ch\u01b0a ch\u1ea1y" };
  }
  if (sig.st === "validating") return { kind: "trying", badge: "watch", label: "\u0110ang th\u1eed" };
  return { kind: "running", badge: "good", label: "\u0110ang ch\u1ea1y" };
}
