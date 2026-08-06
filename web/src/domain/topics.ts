import type { CxmData, TaxNode } from "../data/schema/index.ts";

/* Số học của màn "Topic & xu hướng" #/topics — port V.topics (prototype dòng 3853-3891).

   MỘT CHỖ CỐ Ý KHÔNG PORT, và đây là chỗ quan trọng nhất của file này.

   Prototype vẽ biểu đồ đường bằng `monthly(t)` (dòng 3807-3814), KHÔNG bằng `pts`. Hàm đó nhận
   chuỗi 6 kỳ rồi **bịa thêm 6 điểm đầu** bằng ngoại suy tuyến tính ngược
   (`head.push(Math.max(0, Math.round(first - stepv * i)))`), sau đó dán nhãn tháng THẬT lên cả 12
   điểm (`MONTHS12`, dòng 3802). Ở mốc "1 năm", một nửa đường là số do công thức đẻ ra, đứng dưới
   nhãn "08/25 … 01/26" như thể đã đo. Chính lời chú trong prototype cũng nói rõ nó ngoại suy.

   Bản React không cần và không được làm thế: fixture ở đây đã có **12 điểm thật** cho cả 14 theme
   (`seed.ts`, kiểm 06/08). Nên mọi hàm dưới đây đọc thẳng `pts`, và cắt theo bộ lọc thời gian bằng
   `.slice(-months)` — chuỗi ngắn hơn số tháng yêu cầu thì trả về đúng phần đang có, không độn.
   Cùng kỷ luật với `TimeframeBar` ("Chuỗi thật hiện chỉ có N tháng — đang hiện đủ dữ liệu có,
   không nội suy thêm") và với `ptsFor` cũ trong `TopicTrendBlock`.

   `ptsFor`/`trendOf` trước nằm private trong `TopicTrendBlock.tsx`. Chuyển xuống đây vì màn
   #/topics vẽ chart trên CÙNG chuỗi mà bảng vẽ sparkline — hai chỗ tách nhau ra là cùng một topic
   hiện hai hình dạng khác nhau trên cùng một màn. */

/** Chuỗi điểm thật của một theme, đã cắt theo bộ lọc thời gian. KHÔNG nội suy: chuỗi ngắn hơn
    `months` thì `.slice(-months)` tự trả nguyên phần đang có. */
export function ptsFor(t: TaxNode, months?: number): number[] {
  if (!t.pts) return [];
  return months ? t.pts.slice(-months) : t.pts;
}

/** Chênh lệch đầu–cuối của chuỗi đang hiện. Dưới 2 điểm thì không có xu hướng nào để nói. */
export function trendOf(pts: number[]): number {
  return pts.length > 1 ? pts[pts.length - 1]! - pts[0]! : 0;
}

/** Mọi theme, xếp theo volume giảm dần. Chỉ tầng `theme` có `cat`/`pts`. */
export function themesByVolume(data: CxmData): TaxNode[] {
  return data.tax.filter((t) => t.lv === "theme").slice().sort((a, b) => b.n - a.n);
}

/* Ngưỡng "trồi lên từ gần sàn" — port 1-1 hằng số 0.4 trong isFreshTopic (prototype dòng 3792).
   Nghĩa: điểm đầu kỳ còn dưới 40% điểm cuối kỳ, tức phần lớn khối lượng mới xuất hiện trong kỳ. */
const FRESH_FLOOR = 0.4;

/** Topic MỚI TRỒI LÊN — port isFreshTopic (prototype dòng 3792). Hai đường vào: node được đánh dấu
    `drift: 'new-term'` (người/agent đã gắn nhãn), hoặc chuỗi tăng từ gần sàn trong kỳ đang xem. */
export function isFreshTopic(t: TaxNode, months?: number): boolean {
  if (t.drift === "new-term") return true;
  const pts = ptsFor(t, months);
  if (pts.length < 2) return false;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  return last > first && first <= last * FRESH_FLOOR;
}

/* Ba nhóm chuyển động — trục THỜI GIAN, thứ mà #/sources và #/vocjourney không trả lời.

   `cat !== 'praise'` chỉ loại nhánh khen khỏi hai nhóm tăng/giảm, giữ đúng 1-1 với prototype
   (dòng 3859-3861): một topic khen tăng lên không phải chuyện "nổi lên cần xử". */
export function risingThemes(data: CxmData, months?: number): TaxNode[] {
  return themesByVolume(data).filter((t) => t.cat !== "praise" && trendOf(ptsFor(t, months)) > 0);
}

export function fallingThemes(data: CxmData, months?: number): TaxNode[] {
  return themesByVolume(data).filter((t) => t.cat !== "praise" && trendOf(ptsFor(t, months)) < 0);
}

export function freshThemes(data: CxmData, months?: number): TaxNode[] {
  return themesByVolume(data).filter((t) => isFreshTopic(t, months));
}

/* Bao nhiêu đường vẽ mặc định — port `defLines` (prototype dòng 3865): ba mover mạnh nhất nhóm
   tăng, hai nhóm giảm, một nhóm mới. Đây LÀ luật cắt của chart này: taxonomy nở bao nhiêu topic thì
   chart vẫn chỉ mở sẵn tối đa sáu đường, và màn phải đếm ra chữ phần không vẽ. */
const DEF_RISING = 3;
const DEF_FALLING = 2;
const DEF_FRESH = 1;

/** Bộ đường mở sẵn khi mới vào màn. Khử trùng lặp vì một topic vừa tăng vừa "mới trồi lên" là
    chuyện bình thường — nó chỉ được một đường, không phải hai. */
export function defaultTopicLines(data: CxmData, months?: number): string[] {
  const picked = [
    ...risingThemes(data, months).slice(0, DEF_RISING),
    ...fallingThemes(data, months).slice(0, DEF_FALLING),
    ...freshThemes(data, months).slice(0, DEF_FRESH),
  ].map((t) => t.id);
  return picked.filter((id, i) => picked.indexOf(id) === i);
}

/** Node taxonomy đang chờ người quyết định (gộp / tách / gán nghĩa). Hệ thống phát hiện, người
    quyết — không có gộp/tách tự động. */
export function driftNodes(data: CxmData): TaxNode[] {
  return data.tax.filter((t) => t.drift !== undefined);
}

export type TopicLine = { t: TaxNode; pts: number[]; fresh: boolean };

/** Dữ liệu vẽ cho các đường đang chọn, theo ĐÚNG thứ tự `ids` truyền vào (thứ tự quyết định màu,
    nên nó phải ổn định). Bỏ qua id không tra được và theme chưa đủ 2 điểm — một điểm không vẽ
    thành đường được, và vẽ một chấm lẻ trông như đường phẳng. */
export function topicLines(data: CxmData, ids: string[], months?: number): TopicLine[] {
  const lines: TopicLine[] = [];
  for (const id of ids) {
    const t = data.tax.find((n) => n.id === id);
    if (!t || t.lv !== "theme") continue;
    const pts = ptsFor(t, months);
    if (pts.length < 2) continue;
    lines.push({ t, pts, fresh: isFreshTopic(t, months) });
  }
  return lines;
}
