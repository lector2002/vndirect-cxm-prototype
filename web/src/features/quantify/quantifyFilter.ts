import type { ChartKind, Dim, QuantifyItem, QuantifyView } from "../../data/schema/index.ts";

/** Giá trị lọc theo kiểu chart — 'all' + mọi ChartKind. Port TYPES (prototype dòng 2443). */
export type KindFilterValue = ChartKind | "all";

/** Giá trị lọc theo nền dữ liệu — 'all' + base thật (agg/ev/cust) + 'series' (chuỗi thời gian,
    không thuộc base nào). Port qBaseKey/GKEYS (prototype dòng 2411, 2444). */
export type BaseFilterValue = Dim["base"] | "series" | "all";

/** Giá trị lọc theo view mặc định — 'all' + QuantifyView. Port VIEWS (prototype dòng 2445). */
export type ViewFilterValue = QuantifyView | "all";

export type QuantifyFilterState = {
  kind: KindFilterValue;
  base: BaseFilterValue;
  view: ViewFilterValue;
  search: string;
};

/** Nhóm "nền dữ liệu" của một item để lọc thư viện — series là chuỗi thời gian curated, không
    thuộc base nào; show item lấy base từ dims[item.show]. Port 1-1 qBaseKey() (prototype dòng 2411). */
export function qBaseKey(item: QuantifyItem, dims: Record<string, Dim>): BaseFilterValue {
  return item.kind === "series" ? "series" : dims[item.show].base;
}

/** Chiều dữ liệu dùng để search theo tên chiều — show item là label của dims[item.show] (fallback
    về key nếu dim lạ), series item là item.dim (đã là chuỗi mô tả, vd "Theme · 6 kỳ"). */
export function qDim(item: QuantifyItem, dims: Record<string, Dim>): string {
  return item.kind === "series" ? item.dim : (dims[item.show]?.label ?? item.show);
}

/** Lọc thư viện Quantify — port 1-1 predicate quantifyLib() (prototype dòng 2446-2450):
    kind ∧ base ∧ view ∧ search, tất cả AND với nhau. Hàm thuần, không đọc React/store. */
export function filterItems(
  items: QuantifyItem[],
  dims: Record<string, Dim>,
  filter: QuantifyFilterState,
): QuantifyItem[] {
  const s = filter.search.trim().toLowerCase();
  return items.filter(
    (q) =>
      (filter.kind === "all" || q.chart === filter.kind) &&
      (filter.base === "all" || qBaseKey(q, dims) === filter.base) &&
      (filter.view === "all" || (q.view ?? "chart") === filter.view) &&
      (!s || q.name.toLowerCase().includes(s) || qDim(q, dims).toLowerCase().includes(s)),
  );
}
