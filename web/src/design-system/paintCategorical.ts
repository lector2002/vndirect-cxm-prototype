import type { DimRow } from "../data/schema/index.ts";

const CAT_CYCLE = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

/* Nếu chart CHƯA có màu intent nào (mọi row.c undefined) → gán --cat-N xoay vòng để bar/lát phân biệt
   được thay vì đồng loạt xám. Nếu ĐÃ có ít nhất một row mang màu intent (data.cats) → trả NGUYÊN rows
   (giữ legend intent + hành vi mixed "chưa gán intent"). Immutable: trả rows MỚI, không mutate. */
export function paintCategorical(rows: DimRow[]): DimRow[] {
  if (rows.some((r) => r.c !== undefined)) return rows;
  return rows.map((r, i) => ({ ...r, c: CAT_CYCLE[i % CAT_CYCLE.length] }));
}
