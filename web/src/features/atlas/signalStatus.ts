import type { BadgeState } from "../../design-system/index.ts";
import type { Signal } from "../../data/schema/index.ts";

/* Trạng thái một điểm đo, dịch sang nhãn + tông badge. Trước 05/08 bảng này nằm private trong
   AtlasSignalPanel.tsx kèm ghi chú "nơi DUY NHẤT còn dùng nó" — nay tab "Độ phủ dữ liệu" cũng phải
   nói đúng những chữ đó về cùng một điểm đo, nên tách ra một chỗ. Chép sang file thứ hai là mở đường
   cho hai tab của CÙNG một hồ sơ bước nói hai kiểu về cùng một trạng thái.

   Câu chữ giữ NGUYÊN VĂN, kể cả dấu phẩy trong 'designed'. */
export const SIGNAL_STATUS: Record<Signal["st"], { badge: BadgeState; label: string }> = {
  live: { badge: "ok", label: "Đang đo" },
  validating: { badge: "watch", label: "Đang validate" },
  designed: { badge: "watch", label: "Đã có spec, chưa implement" },
  gap: { badge: "unknown", label: "Chưa đo (gap)" },
};
