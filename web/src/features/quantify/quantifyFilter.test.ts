import { describe, expect, it } from "vitest";
import { dims, seed } from "../../data/fixtures/seed.ts";
import type { QuantifyItem } from "../../data/schema/index.ts";
import { filterItems, qBaseKey } from "./quantifyFilter.ts";

function findItem(id: string): QuantifyItem {
  const q = seed.qt.find((x) => x.id === id);
  if (!q) throw new Error(`fixture ${id} không tồn tại`);
  return q;
}

/* q16 (Theme × Nền tảng) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — năng lực view='table' GIỮ
   NGUYÊN, chỉ không còn saved query nào trỏ vào. Tự dựng item tại đây (đúng hình dạng q16 cũ) và
   nối thêm vào seed.qt khi gọi filterItems, vì filterItems lọc trên CẢ MẢNG chứ không phải một item. */
const q16: QuantifyItem = {
  id: "q16", kind: "show", show: "theme", by: "pf", metric: "count", view: "table", chart: "rank",
  name: "Theme × Nền tảng (ghép chéo)",
};

describe("qBaseKey", () => {
  it("item series (q5) → 'series'", () => {
    expect(qBaseKey(findItem("q5"), dims)).toBe("series");
  });

  it("item show lấy base từ dims[item.show] (q1 show='theme' → base 'agg')", () => {
    expect(qBaseKey(findItem("q1"), dims)).toBe("agg");
  });

  it("item show base 'ev' (q12 show='sen' → User Sentiment)", () => {
    expect(qBaseKey(findItem("q12"), dims)).toBe("ev");
  });
});

describe("filterItems — kind (port harness §11b 286-290)", () => {
  it("kind='donut' giữ chart donut, loại chart rank", () => {
    const result = filterItems(seed.qt, dims, { kind: "donut", base: "all", view: "all", search: "" });
    expect(result.some((q) => q.id === "q14")).toBe(true);
    expect(result.some((q) => q.chart === "rank")).toBe(false);
  });
});

describe("filterItems — base (port harness §11c 328-331)", () => {
  it("base='ev' giữ q12 (User Sentiment), loại q1 (base agg)", () => {
    const result = filterItems(seed.qt, dims, { kind: "all", base: "ev", view: "all", search: "" });
    expect(result.some((q) => q.id === "q12")).toBe(true);
    expect(result.some((q) => q.id === "q1")).toBe(false);
  });
});

describe("filterItems — view (port harness §11c 326-327)", () => {
  it("view='table' giữ q16 (Theme × Nền tảng), loại item view mặc định chart", () => {
    const result = filterItems([...seed.qt, q16], dims, { kind: "all", base: "all", view: "table", search: "" });
    expect(result.some((q) => q.id === "q16")).toBe(true);
    expect(result.some((q) => q.id === "q1")).toBe(false);
  });
});

describe("filterItems — search (port harness §11b 291-292)", () => {
  it("search không khớp gì → mảng rỗng", () => {
    const result = filterItems(seed.qt, dims, { kind: "all", base: "all", view: "all", search: "zzzzz" });
    expect(result).toEqual([]);
  });

  it("search khớp một phần tên q1 ('Volume theo Theme') → chứa q1", () => {
    const result = filterItems(seed.qt, dims, { kind: "all", base: "all", view: "all", search: "theme" });
    expect(result.some((q) => q.id === "q1")).toBe(true);
  });
});

describe("filterItems — tổ hợp AND", () => {
  it("bốn điều kiện áp cùng lúc — search khớp cả tên lẫn kind/base/view khác thì vẫn loại", () => {
    const result = filterItems(seed.qt, dims, { kind: "donut", base: "ev", view: "all", search: "" });
    // q14 (donut) có base 'agg' (show='src'), không phải 'ev' → kind∧base không cùng thỏa mãn q14
    expect(result).toEqual([]);
  });
});
