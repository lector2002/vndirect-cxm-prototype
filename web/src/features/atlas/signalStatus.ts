import type { BadgeState } from "../../design-system/index.ts";
import type { Signal } from "../../data/schema/index.ts";

/* Trạng thái một điểm đo, dịch sang nhãn + tông badge. Trước 05/08 bảng này nằm private trong
   AtlasSignalPanel.tsx kèm ghi chú "nơi DUY NHẤT còn dùng nó" — nay tab "Độ phủ dữ liệu" cũng phải
   nói đúng những chữ đó về cùng một điểm đo, nên tách ra một chỗ. Chép sang file thứ hai là mở đường
   cho hai tab của CÙNG một hồ sơ bước nói hai kiểu về cùng một trạng thái.

   18/08 (owner): thuật ngữ UI chuyển sang tiếng Anh quy ước ngành (tracking-plan status kiểu
   Amplitude/Avo: Live · Validating · Spec ready · Not tracked). 'designed' rút gọn từ câu đầy đủ
   "Đã có spec, chưa implement" — "Spec ready" đã hàm ý chưa implement, và câu cũ tràn ô ở 1280. */
export const SIGNAL_STATUS: Record<Signal["st"], { badge: BadgeState; label: string }> = {
  live: { badge: "ok", label: "Live" },
  validating: { badge: "watch", label: "Validating" },
  designed: { badge: "watch", label: "Spec ready" },
  gap: { badge: "unknown", label: "Not tracked" },
};
