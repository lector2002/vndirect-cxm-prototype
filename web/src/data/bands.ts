import type { CfgBandAxis, SegUnknown } from "./schema/index.ts";
import { isSegUnknown } from "./segment.ts";

/* Sinh nhãn dải + xếp một giá trị vào dải, từ MỘT nguồn duy nhất là `axis.cuts` (module E, owner
   chốt 04/08: "nguồn trong setting sẽ là source of truth"). Bất biến E-c: nhãn KHÔNG BAO GIỜ được
   khai tay ở đâu khác — mọi chuỗi trả về từ đây phải tính ra được từ `cuts`, để nhãn không thể nói
   khác cut. Đặt ở tầng `data/` (không phải `domain/`) vì cả data/validate.ts lẫn domain/quantify.ts
   đều cần — đúng lý do data/segment.ts và data/metric-direction.ts đã đặt ở đó (xem hai file này).

   Biên dưới đóng, trên mở: `bandOf(cuts[i])` rơi vào dải TRÊN mốc cuts[i], không phải dải dưới.

   Ba unit có ba cách hiện SỐ khác nhau — không gộp một hàm format chung, vì cách chọn đơn vị hiện
   ra ở "vai" của giá trị (làm biên trên/dưới của dải nào) khác nhau giữa unit, đo được qua chính
   nhãn owner đang dùng hôm nay:
     - 'đ': mỗi đầu mút hiện theo TẦNG TỰ NHIÊN của chính giá trị đó (>=1e9 là 'tỷ', còn lại 'tr'),
       không quan tâm giá trị đó đang là biên trên hay biên dưới của dải nào — "200tr-1tỷ" chứng
       minh điều này: 200tr và 1tỷ ở hai tầng khác nhau ngay trên MỘT dải.
     - 'tháng': mốc chuyển tầng (24 tháng = 2 năm) là ranh giới CHIA HAI DẢI, nên cùng một số 24
       hiện khác nhau tuỳ vai: là biên TRÊN (loại trừ) của dải dưới nó thì vẫn thuộc tầng của dải
       đó ("6-24 tháng" — nội dung thật của dải chỉ tới 23 tháng, tầng theo 23 là 'tháng'); là biên
       DƯỚI (bao gồm) của dải trên nó thì đổi tầng theo chính nó ("2-5 năm" — 24 là mốc năm bắt đầu
       tính). Coi biên trên theo nội dung ngay dưới nó là cách duy nhất giữ "6-24 tháng" liền mạch
       với "<6 tháng" mà vẫn cho "2-5 năm" đổi tầng đúng lúc.
     - 'năm' (age): không có tầng đơn vị nào cả (tuổi luôn là số nguyên trần, không "tr"/"tỷ"/
       "năm" gắn sau) — biên trên của một dải hiện là số nguyên liền trước cut (cuts[i]-1), để
       "18-24" và "25-34" không cùng nhắc tới tuổi 25 ở hai dải.

   Trường hợp dải rơi hết về 0 (owner thêm cut sát 0, ví dụ cut=1 cho nav, để tách nhóm CHƯA CÓ TÀI
   SẢN ra khỏi "<50tr") không hiện được bằng tầng 'tr'/'tỷ' (1 đồng bằng 0 khi hiện ở tầng triệu) —
   khi đó dùng thẳng "0đ", không phải "<0tr" hay "<1đ". Đây chính là lý do tồn tại của cả module. */

const DONG_TIER_DIVISOR = 1e6; // ngưỡng nhỏ nhất còn hiện được ở tầng 'tr' — dưới đó coi là "0đ"

function roundTrim(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(r);
}

// ---------- unit 'đ' (nav) ----------

function dongTier(v: number): 'tr' | 'tỷ' {
  return v >= 1e9 ? 'tỷ' : 'tr';
}

function dongDivisor(tier: 'tr' | 'tỷ'): number {
  return tier === 'tỷ' ? 1e9 : 1e6;
}

function dongIsNegligible(v: number): boolean {
  return Math.round(v / DONG_TIER_DIVISOR) === 0;
}

function fmtDong(v: number): string {
  const t = dongTier(v);
  return `${roundTrim(v / dongDivisor(t))}${t}`;
}

/** Hiện số đồng THÔ, không quy đổi tầng 'tr'/'tỷ' — dùng cho biên DƯỚI của một dải mà tầng triệu sẽ
    làm nó biến mất về 0 (ví dụ 1 đồng), nhưng dải đó KHÔNG phải dải đáy (đã có một dải "0đ" riêng
    nằm ngay dưới nó). Gộp về `<upper` ở ca này sẽ đọc như nhãn bao cả số 0 — trong khi 0 đã có dải
    của riêng nó, nên biên dưới thật (dù nhỏ) phải hiện ra để hai dải không nói trùng nhau. */
function fmtDongRaw(v: number): string {
  return `${roundTrim(v)}đ`;
}

function bandLabelsDong(axis: CfgBandAxis): string[] {
  const { min, cuts } = axis;
  const n = cuts.length;
  const labels: string[] = [];
  for (let i = 0; i <= n; i++) {
    if (i === n) {
      labels.push(`${fmtDong(cuts[n - 1])}+`);
      continue;
    }
    const upper = cuts[i];
    const lower = i === 0 ? min ?? 0 : cuts[i - 1];
    if (i === 0 && min === null) {
      labels.push(dongIsNegligible(lower) && dongIsNegligible(upper) ? "0đ" : `<${fmtDong(upper)}`);
      continue;
    }
    if (dongIsNegligible(lower) && dongIsNegligible(upper)) { labels.push("0đ"); continue; }
    if (dongIsNegligible(lower)) {
      // Dải đáy (i === 0): không có dải nào dưới nó, gộp về "<upper" là đúng.
      // Dải không phải đáy (i > 0): đã có một dải "0đ" nằm dưới — phải in biên dưới thật, không gộp.
      labels.push(i === 0 ? `<${fmtDong(upper)}` : `${fmtDongRaw(lower)}-${fmtDong(upper)}`);
      continue;
    }
    if (dongTier(lower) === dongTier(upper)) {
      labels.push(`${roundTrim(lower / dongDivisor(dongTier(upper)))}-${fmtDong(upper)}`);
    } else {
      labels.push(`${fmtDong(lower)}-${fmtDong(upper)}`);
    }
  }
  return labels;
}

// ---------- unit 'tháng' (tenure) ----------

const THANG_TIER_CUTOVER = 24; // 24 tháng = 2 năm — mốc owner chốt 04/08

function thangTierIncl(v: number): 'tháng' | 'năm' {
  return v >= THANG_TIER_CUTOVER ? 'năm' : 'tháng';
}

function thangDivisor(tier: 'tháng' | 'năm'): number {
  return tier === 'năm' ? 12 : 1;
}

/** Tầng của một giá trị khi nó là biên TRÊN (loại trừ) của một dải — xem theo nội dung thật ngay
    dưới nó (v-1), để "24" vẫn đọc là "tháng" khi đang khép dải "6-24 tháng". */
function thangTierExcl(v: number): 'tháng' | 'năm' {
  return thangTierIncl(v - 1);
}

function fmtThangIncl(v: number): { num: string; tier: 'tháng' | 'năm' } {
  const t = thangTierIncl(v);
  return { num: roundTrim(v / thangDivisor(t)), tier: t };
}

function fmtThangExcl(v: number): { num: string; tier: 'tháng' | 'năm' } {
  const t = thangTierExcl(v);
  return { num: roundTrim(v / thangDivisor(t)), tier: t };
}

function bandLabelsThang(axis: CfgBandAxis): string[] {
  const { min, cuts } = axis;
  const n = cuts.length;
  const labels: string[] = [];
  for (let i = 0; i <= n; i++) {
    if (i === n) {
      const { num, tier } = fmtThangIncl(cuts[n - 1]);
      labels.push(`${num} ${tier}+`);
      continue;
    }
    const upper = fmtThangExcl(cuts[i]);
    if (i === 0 && min === null) {
      labels.push(`<${upper.num} ${upper.tier}`);
      continue;
    }
    const lower = i === 0 ? fmtThangIncl(min as number) : fmtThangIncl(cuts[i - 1]);
    labels.push(
      lower.tier === upper.tier
        ? `${lower.num}-${upper.num} ${upper.tier}`
        : `${lower.num} ${lower.tier}-${upper.num} ${upper.tier}`,
    );
  }
  return labels;
}

// ---------- unit 'năm' (age) ----------

function bandLabelsNam(axis: CfgBandAxis): string[] {
  const { min, cuts } = axis;
  const n = cuts.length;
  const labels: string[] = [];
  for (let i = 0; i <= n; i++) {
    if (i === n) {
      labels.push(`${cuts[n - 1]}+`);
      continue;
    }
    const upper = cuts[i] - 1;
    if (i === 0 && min === null) { labels.push(`<${cuts[i]}`); continue; }
    const lower = i === 0 ? (min as number) : cuts[i - 1];
    labels.push(`${lower}-${upper}`);
  }
  return labels;
}

/** Cách đọc GỌN HƠN của một con số ranh giới ("200tr", "5tỷ", "2 năm") — hoặc `null` khi chính số
    thô đã là cách đọc đúng rồi.

    Dùng cho màn cấu hình: ô nhập ranh giới buộc phải hiện số THÔ (nhập 1 đồng thì ô phải hiện `1`,
    không phải "0,000001tr"), mà số thô 10 chữ số thì người đọc không nhận ra ngay là năm tỷ. Hàm
    này cho chỗ nhập một cách đọc đi kèm.

    VÌ SAO TRẢ `null` CHỨ KHÔNG LUÔN TRẢ CHUỖI — đây là một lỗi thật đã bị bắt trong review: bản đầu
    trả `'0đ'` cho MỌI giá trị dưới 500.000đ, nên đúng ca dùng owner đặt hàng ở Module E (thêm mốc
    `1` để tách nhóm CHƯA CÓ TÀI SẢN) cho ra ô ghi `1` mà chú thích cạnh nó ghi `= 0đ`. Con số đứng
    dưới một cách đọc không thuộc về nó — đúng loại lỗi cả stream này tồn tại để chặn. Dưới tầng
    triệu thì "1 đồng" chính là cách đọc đúng, và trục tuổi cũng vậy: không có tầng đơn vị nào để
    rút gọn, `18` đọc là `18`. Cả hai ca đó trả `null` để nơi gọi KHÔNG in gì thêm.

    Đặt ở ĐÂY chứ không viết lại trong `features/`: quy tắc đổi tầng (1e9 → 'tỷ', 24 tháng → 'năm')
    đã sống trong file này và nhãn dải đang dùng chính nó. Viết bản thứ hai ở tầng UI là mở đường
    cho hai cách đọc cùng một con số lệch nhau — đúng loại lỗi `PF_LABEL` đã gây một lần. */
export function formatBound(v: number, unit: CfgBandAxis['unit']): string | null {
  switch (unit) {
    case 'đ': return dongIsNegligible(v) ? null : fmtDong(v);
    case 'tháng': {
      const { num, tier } = fmtThangIncl(v);
      return tier === 'tháng' && num === String(v) ? null : `${num} ${tier}`;
    }
    // Tuổi không có tầng đơn vị nào (không "tr"/"tỷ"/"năm" gắn sau) — số thô đã là cách đọc đúng.
    case 'năm': return null;
  }
}

/** Sinh danh sách nhãn dải theo đúng thứ tự dải, từ `axis.cuts` — n cut cho n+1 nhãn. Nguồn nhãn
    DUY NHẤT trong toàn bộ src/ (bất biến E-c); không có đường nào khác được khai nhãn tay. */
export function bandLabels(axis: CfgBandAxis): string[] {
  switch (axis.unit) {
    case 'đ': return bandLabelsDong(axis);
    case 'tháng': return bandLabelsThang(axis);
    case 'năm': return bandLabelsNam(axis);
  }
}

/** Xếp một giá trị thô vào dải, biên dưới đóng trên mở. Sentinel (`isSegUnknown`) trả nguyên vẹn —
    "chưa-biết" hay "thiếu" không có dải nào để rơi vào, xếp bừa vào một dải số sẽ giấu mất sentinel
    (đúng lỗi bất biến #2/#3 của module: "chưa-biết" khác "thiếu", và mẫu số không được âm thầm rứt
    nhóm không xác định). */
export function bandOf(v: number | SegUnknown, axis: CfgBandAxis): string {
  if (typeof v === "string" && isSegUnknown(v)) return v;
  const value = v as number;
  const labels = bandLabels(axis);
  const { cuts } = axis;
  for (let i = 0; i < cuts.length; i++) {
    if (value < cuts[i]) return labels[i];
  }
  return labels[cuts.length];
}
