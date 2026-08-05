import type { CxmData, Dim } from "../data/schema/index.ts";
import { isSegUnknown } from "../data/segment.ts";

/* Một chart chia màu phải trả lời được HAI câu bằng hình, không bắt người xem tra chú giải:
   "đoạn này là nhóm nào" và — nếu nhóm có thứ tự — "nhóm này cao hay thấp". Câu thứ hai là chỗ cả
   hai chart đang sai giống nhau (đo 05/08): độ tuổi và phân khúc NAV được khai `cut.kind === 'band'`,
   tức DẢI CÓ THỨ TỰ, nhưng vẫn nhận năm màu phân loại không hơn kém nhau và vẫn xếp theo SỐ LƯỢNG.
   Hệ quả đo được trên demoData: thứ tự đoạn của độ tuổi ra 25-34 · 50+ · 18-24 · 35-49 — nhìn thanh
   không đọc được "trẻ hơn nằm bên nào", mà đó chính là điều duy nhất một chiều tuổi để nói.

   Module RIÊNG chứ không nhét vào quantify.ts hay themeSegments.ts: hai file đó đã import chéo nhau
   (xem ghi chú EV_LABEL ở themeSegments.ts) và cả hai đều cần bộ này. Đặt vào một trong hai là làm
   vòng import sâu thêm đúng chỗ đã một lần gây lỗi nhãn thầm lặng. File này KHÔNG import từ hai file
   đó — chiều import chỉ có một hướng. */

/** Thang tuần tự (index.css) — nhạt = dải thấp, đậm = dải cao. Thay cho CAT_CYCLE ở CHIỀU CÓ THỨ TỰ.
    Năm bậc, khớp số bậc của CAT_CYCLE nên trần "nhiều màu hơn mắt phân biệt được" không đổi. */
export const SEQ_RAMP = ["var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)"];

/** Chiều có thứ tự = chiều chia theo DẢI SỐ. `values` (Value tier, Kênh mở TK, Nền tảng) là nhóm rời
    rạc: giữ CAT_CYCLE. Không thêm cờ khai báo mới — `Dim.cut.kind` đã phân biệt đúng hai ca này rồi,
    chỉ là chưa ai dùng nó để quyết định cách VẼ. */
export function isOrdinal(dim: Dim | undefined): boolean {
  return dim?.cut?.kind === "band";
}

/** Nhãn dải → giá trị thô NHỎ NHẤT quan sát được trong dải đó, dùng làm khoá sắp xếp theo thứ tự dải.
    `undefined` nếu chiều không phải dải (nơi gọi giữ nguyên cách xếp theo số lượng).

    Vì sao suy từ dữ liệu chứ không đọc ranh giới cấu hình: nhãn dải sinh từ `cfg.segment.band` (xem
    data/bands.ts) mà tầng domain KHÔNG được biết tới cfg — `themeSegments`/`qRunSplit` đều không nhận
    cfg, và QuantifyWidget khai `cfg` là prop TUỲ CHỌN nên có đường gọi hợp lệ không có nó. Dải là các
    khoảng liền nhau không chồng lấn, nên "giá trị nhỏ nhất trong dải" xếp ra ĐÚNG thứ tự dải mà không
    cần biết ranh giới. Cách còn lại — đọc chữ trong nhãn ("<50tr", "1-5tỷ") — là phân tích chuỗi hiển
    thị, hỏng ngay lần đầu owner đổi cách viết nhãn. */
export function bandOrderKey(
  data: CxmData,
  dims: Record<string, Dim>,
  id: string,
): Map<string, number> | undefined {
  const cut = dims[id]?.cut;
  if (cut?.kind !== "band") return undefined;
  const out = new Map<string, number>();
  for (const c of data.cust) {
    const label = c.bands[id];
    /* Sentinel không có dải nào để xếp vào (data/segment.ts) — bỏ qua ở đây, chúng đã có chỗ riêng
       là khối "Chưa xếp được nhóm" ghim cuối thanh. */
    if (typeof label !== "string" || isSegUnknown(label)) continue;
    const raw = (c as unknown as Record<string, unknown>)[cut.source];
    if (typeof raw !== "number") continue;
    const cur = out.get(label);
    if (cur === undefined || raw < cur) out.set(label, raw);
  }
  return out;
}

/** Xếp lại danh sách giá trị theo thứ tự DẢI. `rank` vắng ⇒ trả nguyên vẹn (chiều rời rạc giữ thứ tự
    theo số lượng mà nơi gọi đã tính).

    Nhận danh sách ĐÃ CẮT TOP thay vì tự cắt: cắt phải theo SỐ LƯỢNG (giữ lại các dải đông nhất) rồi
    mới xếp theo dải. Làm ngược lại thì một chiều nhiều dải sẽ rụng mất các dải cao — tức là xoá đúng
    phần đuôi mà người xem một chiều tài sản/tuổi quan tâm nhất. */
export function sortByBand(ids: string[], rank: Map<string, number> | undefined): string[] {
  if (!rank) return ids;
  const key = (id: string) => rank.get(id) ?? Number.POSITIVE_INFINITY;
  return [...ids].sort((a, b) => key(a) - key(b));
}
