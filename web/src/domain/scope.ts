import type { CxmData, Source } from "../data/schema/index.ts";

/* Scope VoC — "một tín hiệu khách hàng" nghĩa là gì. Hàm THUẦN trên CxmData nên thuộc domain/,
   không thuộc features/: `design-system/QuantifyWidget` cần mẫu số này để ghi nhãn trục, mà
   design-system KHÔNG được phụ thuộc vào features (S2.5 từng import ngược như vậy — đã sửa).

   Port 1-1 VOC_SCOPE/inScope/scopeSources/scopeTotal (prototype dòng 1403-1410). */

/** 'all' = đếm mọi nguồn; 'voice' = chỉ nguồn có lời khách. MỘT chỗ duy nhất — đổi hằng này là
    mọi mẫu số đổi theo.

    Owner chốt 01/08 giữ 'all' nhưng ĐỔI NHÃN sang "tín hiệu khách hàng": trên seed, 'all' gộp
    56.732 bản ghi thô mà ~95% là event hành vi (Digital analytics 41.200 + eKYC SDK 12.800) —
    không có lời khách nào. Gọi đó là "bản ghi phản hồi" là nói quá, nên nhãn phải nói đúng rằng
    đây là tín hiệu (hành vi + tiếng nói). 'voice' để tham chiếu: 5 nguồn, 2.732 thô. */
const VOC_SCOPE: "all" | "voice" = "all";

const inScope = (s: Source): boolean => VOC_SCOPE === "all" || s.voice;

/** Nguồn nằm trong scope VoC hiện hành. */
export function scopeSources(data: CxmData): Source[] {
  return data.sources.filter(inScope);
}

/** Tổng volume THÔ trong scope — mẫu số của mọi con số "tín hiệu khách hàng".
    Tầng render áp fx() trước khi hiển thị (56.732 thô → 317.699 hiển thị). */
export function scopeTotal(data: CxmData): number {
  return scopeSources(data).reduce((a, s) => a + s.vol, 0);
}
