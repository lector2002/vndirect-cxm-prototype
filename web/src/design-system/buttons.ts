/* Tầng nút — hằng chuỗi class THUẦN (không JSX/component) cho 3 loại nút dùng chung toàn app.

   Vì sao viền dùng --ink3 chứ không phải --line:
   --line (#e5e1db) chỉ đạt ~1,2:1 contrast trên nền trắng (--surface) — dưới xa ngưỡng WCAG 1.4.11
   (non-text contrast, tối thiểu 3:1 cho viền UI component). Một nút viền --line trông như nhãn chữ
   không viền, không đọc ra "đây là nút bấm được". --ink3 (#8c8681) đạt 3,4:1 trên --surface, vừa đủ
   qua ngưỡng 3:1 mà không tối tới mức cạnh tranh với text-ink (chữ chính).

   Vì sao nút phụ phải chịu được CẢ nền trắng LẪN Card.footer:
   Nút phụ (Sửa/Hủy/Đóng/Đặt lại…) phần lớn nằm trong Card.footer, nền `bg-surface-2/40` (Card.tsx) —
   nếu nút chỉ đổi nền (vd bg-surface-2 đặc, không viền) thì trên chính nền footer đó nút gần như tan
   biến (cùng tông xám nhạt chồng lên nhau). Viền --ink3 KHÔNG phụ thuộc nền bên dưới nên nút vẫn nổi
   dù đứng trên --surface trắng hay trên footer --surface2/40 — đây là lý do bắt buộc phải có viền
   thật, không thể chỉ dùng nền.

   KHÔNG thêm token màu mới — mọi màu ở đây đã có sẵn trong tailwind.config.js/index.css. */

const base = "rounded font-medium whitespace-nowrap transition-colors";

export const btnSizeSm = "text-xs px-2 py-1";
export const btnSizeMd = "text-xs px-3 py-1.5";
export const btnSizeLg = "text-sm px-3 py-1.5";

export const btnPrimary = `${base} bg-primary text-white hover:bg-primary-hover`;
export const btnSecondary = `${base} border border-ink-3 bg-surface-2 text-ink hover:bg-line`;
export const btnDanger = `${base} border border-crit text-crit hover:bg-crit-bg`;
