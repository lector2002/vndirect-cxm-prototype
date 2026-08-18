/* Mốc "Last seen" hiển thị — owner 18/08 tối: "dễ nhìn và dễ hiểu hơn". CHỈ đổi cách viết,
   không đổi dữ kiện: "27/07 · 14:52" (dd/MM người gõ, không năm) viết lại thành "27 Jul · 14:52"
   để khỏi đoán dd/MM hay MM/dd, khớp bộ thuật ngữ tiếng Anh 18/08. Parse không ra thì trả NGUYÊN
   chuỗi — không được bịa. D6 (charter §5) không bị đụng: vế CẤM suy tuổi/số ngày im lặng từ mốc
   giữ nguyên — đây là format, không phải phép tính thời gian. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function stampParts(s: string): { date: string; time: string | null } | null {
  const m = /^(\d{1,2})\/(\d{1,2})(?:\s*\u00b7\s*(.+))?$/.exec(s.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const mon = Number(m[2]);
  if (day < 1 || day > 31 || mon < 1 || mon > 12) return null;
  return { date: `${day} ${MONTHS[mon - 1]}`, time: m[3] ?? null };
}

export function stampText(s: string): string {
  const p = stampParts(s);
  if (!p) return s;
  return p.time ? `${p.date} \u00b7 ${p.time}` : p.date;
}
