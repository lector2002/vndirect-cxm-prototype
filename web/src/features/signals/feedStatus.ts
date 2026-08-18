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
