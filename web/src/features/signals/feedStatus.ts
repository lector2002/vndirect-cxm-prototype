import type { SignalFeedHealth } from "../../domain/index.ts";
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

export const FEED_BADGE: Record<SignalFeedHealth, BadgeState> = {
  ok: "ok",
  stale: "watch",
  down: "crit",
  silent: "unknown",
  unknown: "unknown",
};

/* Tông chữ cho dòng trạng thái dưới mốc Last seen (bảng). ok KHÔNG xanh lục: badge "ok" của app
   vốn không màu (spec Badge.tsx), tô lục ở đây là cùng một tình trạng hai giọng — và để dòng có
   vấn đề là THỨ MÀU DUY NHẤT trong cột thì mắt bắt được ngay, đúng yêu cầu "thấy được ngay". */
export const FEED_TONE: Record<SignalFeedHealth, string> = {
  ok: "text-ink-2",
  stale: "text-watch",
  down: "text-crit",
  silent: "text-ink-3",
  unknown: "text-ink-3",
};

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
