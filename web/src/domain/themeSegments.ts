import type { CxmData, TaxNode } from "../data/schema/index.ts";

/* VOC-STACKED-SPEC §2 — chia n của một theme thành các đoạn cho Bars.segments.
   `subtheme` = trục THẬT (n thật của subtheme con), `group` = trục DEMO (nhãn nhóm khách thật
   từ data.ins nhưng KHÔNG có count per-group thật nên phải bịa tỷ lệ — mọi đoạn đánh dấu demo:true). */
export type ThemeAxis = "subtheme" | "group";

export type ThemeSegment = { label: string; n: number; c: string; demo?: boolean };

/* Palette phân loại cố định — TRÙNG hằng CAT_CYCLE của design-system/paintCategorical.ts (var(--cat-1)
   .. var(--cat-5), token đã có sẵn trong index.css). KHÔNG import từ design-system: domain đứng DƯỚI
   design-system trong layer (data→store→domain→design-system→features) nên không được import ngược.
   ĐÃ export (03/08) để domain/quantify.ts (qRunSplit — breakdown trục khách) dùng CHUNG thay vì tạo
   bản sao THỨ BA của cùng palette — đúng loại trùng lặp mà ghi chú ngay trên đây đang cảnh báo. */
export const CAT_CYCLE = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

/** Nhãn nhóm khách demo khi theme không có VoiceInsight nào (data.ins rỗng cho theme đó). */
const DEMO_GROUPS = ["Khách mới", "Khách lâu năm", "Nhà đầu tư chủ động", "Khách VIP"];

/** Tổng mã ký tự của id — nguồn "ngẫu nhiên" thuần (không Date.now/Math.random) để mỗi theme
    ra một hình chia khác nhau, nhưng CÙNG id luôn ra CÙNG kết quả. */
function themeSeed(themeId: string): number {
  let sum = 0;
  for (let i = 0; i < themeId.length; i++) sum += themeId.charCodeAt(i);
  return sum;
}

/** Tỷ trọng DEMO cho `count` nhãn, dẫn từ themeId + vị trí — khác nhau giữa các theme (seed đổi
    theo id) và giữa các vị trí trong cùng theme (không phải một mảng ratio lặp lại cho mọi theme). */
function demoRatios(themeId: string, count: number): number[] {
  const seed = themeSeed(themeId);
  const weights = Array.from({ length: count }, (_, i) => ((seed + i * 17) % 7) + 3);
  const total = weights.reduce((a, w) => a + w, 0);
  return weights.map((w) => w / total);
}

/** Trục subtheme (THẬT): tách theme.n theo n thật của các subtheme con (data.tax, parentId===theme.id),
    sort n desc, màu CAT_CYCLE cố định theo index. Phần theme.n KHÔNG được subtheme nào phủ (rem =
    theme.n - Σsub.n) dồn vào một đoạn xám cuối "Chưa gán sub-theme" — đoạn THẬT (không bịa số), chỉ
    bịa MÀU trung tính cho phần chưa phân loại. Theme không subtheme → 1 đoạn xám n=theme.n. */
function subthemeSegments(data: CxmData, theme: TaxNode): ThemeSegment[] {
  const subs = data.tax
    .filter((t) => t.lv === "subtheme" && t.parentId === theme.id)
    .slice()
    .sort((a, b) => b.n - a.n);
  const segs: ThemeSegment[] = subs.map((s, i) => ({ label: s.name, n: s.n, c: CAT_CYCLE[i % CAT_CYCLE.length] }));
  const sumSubs = subs.reduce((a, s) => a + s.n, 0);
  const rem = theme.n - sumSubs;
  if (rem > 0) segs.push({ label: "Chưa gán sub-theme", n: rem, c: "var(--ink3)" });
  return segs;
}

/** Trục group (DEMO): nhãn thật (data.ins theo theme, distinct seg) hoặc DEMO_GROUPS khi rỗng; tỷ
    trọng bịa DETERMINISTIC (demoRatios) rồi chuẩn hoá về đúng theme.n (dư dồn đoạn cuối). Mọi đoạn
    demo:true — KHÔNG phải phép đo thật, chỉ minh hoạ hình dạng phân bố. */
function groupSegments(data: CxmData, theme: TaxNode): ThemeSegment[] {
  const realLabels = Array.from(
    new Set(data.ins.filter((i) => i.theme === theme.id).flatMap((i) => i.seg)),
  );
  const labels = realLabels.length ? realLabels : DEMO_GROUPS;
  const ratios = demoRatios(theme.id, labels.length);
  const raw = ratios.map((r) => Math.floor(r * theme.n));
  const usedSum = raw.reduce((a, n) => a + n, 0);
  const remainder = theme.n - usedSum;
  return labels.map((label, i) => ({
    label,
    n: i === raw.length - 1 ? raw[i] + remainder : raw[i],
    c: CAT_CYCLE[i % CAT_CYCLE.length],
    demo: true,
  }));
}

export function themeSegments(data: CxmData, themeId: string, axis: ThemeAxis): ThemeSegment[] {
  const theme = data.tax.find((t) => t.lv === "theme" && t.id === themeId);
  if (!theme) return [];
  return axis === "subtheme" ? subthemeSegments(data, theme) : groupSegments(data, theme);
}
