/* Format số hiển thị dùng nội bộ design-system (Bars/Donut/DataTable/CrossTable) — port 1-1 từ
   prototype (output/cxm-platform-prototype.html dòng 1374-1377: nf/pct/pv). KHÔNG export qua
   index.ts (barrel) vì đây không phải primitive UI, chỉ là helper định dạng số dùng chung để
   tránh lặp logic ở 4 component trên (DRY). domain/format.ts đã có fx()/esc() cho baseline scale
   và HTML-escape — file này KHÔNG trùng phạm vi, chỉ thêm nf()/pv() còn thiếu. */

/** Định dạng số theo chuẩn vi-VN (dấu chấm ngăn cách hàng nghìn). Port từ nf(). */
export function nf(n: number): string {
  return Number(n).toLocaleString("vi-VN");
}

/** % trên tổng, viết theo quy ước tiếng Việt (dấu phẩy thập phân, 1 chữ số lẻ). Port từ pct()+pv(). */
export function pv(a: number, total: number): string {
  const pct = total ? Math.round((a / total) * 1000) / 10 : 0;
  return String(pct).replace(".", ",");
}

/** Số viết tắt K cho nhãn giá trị Bars (R4, spec 2026-08-01-card-enterpret-spec.md). n<1000 → như
 *  nf(). |n|>=1000 → chia 1000, 1 chữ số thập phân, dấu phẩy vi-VN, bỏ ",0" khi tròn, hậu tố K.
 *  Dùng String().replace(".", ",") như pv() ở trên thay vì toLocaleString(): không có gì trong repo
 *  chứng minh toLocaleString("vi-VN") ra đúng dấu phẩy thập phân trong ICU của môi trường chạy test,
 *  và ở >=1e6 toLocaleString còn chèn thêm dấu chấm ngăn cách hàng nghìn (đọc nhầm thành nghìn-K). */
export function nfK(n: number): string {
  const num = Number(n);
  if (Math.abs(num) < 1000) return nf(num);
  const rounded = Math.round(num / 100) / 10;
  return `${String(rounded).replace(".", ",")}K`;
}
