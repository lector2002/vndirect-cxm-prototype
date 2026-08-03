/* Format helpers thuần — port 1-1 từ prototype (output/cxm-platform-prototype.html).
   Không side-effect, không đọc DOM/global. */

/* Baseline hiển thị số cố định ở kỳ 6 tháng (factor 5,6): timeframe giờ là per-chart
   (ST.sel.range), không còn kỳ global, nên fx() không đọc period nào cả — đúng quyết định
   ghi ở prototype dòng ~1369-1373. */
export const BASE_FACTOR = 5.6;

/* Scale một số thô về số hiển thị theo baseline 6 tháng. Port từ fx() (~dòng 1373). */
export function fx(n: number): number {
  return Math.round(n * BASE_FACTOR);
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/* Escape ký tự HTML đặc biệt trong input người dùng trước khi hiển thị. Port từ esc() (~dòng 1368);
   bỏ `String(s)` phòng thủ của bản gốc vì tham số đã được gõ kiểu `string`. */
export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] ?? c);
}
