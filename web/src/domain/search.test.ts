import { describe, it, expect } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import { buildSearchIndex, queryIndex, type SearchKind } from "./search.ts";

describe("buildSearchIndex", () => {
  const index = buildSearchIndex(seed);

  it("sinh ít nhất một entry cho mỗi SearchKind", () => {
    const kinds: SearchKind[] = ["feature", "reason", "issue", "source", "segment", "journey"];
    for (const kind of kinds) {
      expect(index.some((e) => e.kind === kind)).toBe(true);
    }
  });

  it("feature chỉ lấy từ tax lv='L2', không lấy L1/L3/theme/subtheme", () => {
    const featureIds = index.filter((e) => e.kind === "feature").map((e) => e.id);
    const l2Ids = seed.tax.filter((n) => n.lv === "L2").map((n) => n.id);
    expect(featureIds.sort()).toEqual(l2Ids.sort());
  });

  it("không mutate mảng index khi gọi lại buildSearchIndex", () => {
    const before = seed.tax.length;
    buildSearchIndex(seed);
    expect(seed.tax.length).toBe(before);
  });
});

describe("queryIndex", () => {
  const index = buildSearchIndex(seed);

  it("query rỗng hoặc chỉ khoảng trắng → trả về mảng rỗng", () => {
    expect(queryIndex(index, "")).toEqual([]);
    expect(queryIndex(index, "   ")).toEqual([]);
  });

  it("khớp substring thật: source 'eKYC SDK'", () => {
    const results = queryIndex(index, "eKYC SDK");
    expect(results.some((r) => r.kind === "source" && r.label === "eKYC SDK")).toBe(true);
  });

  it("khớp substring thật: issue title 'Liveness thất bại lặp lại trên Android'", () => {
    const results = queryIndex(index, "Liveness thất bại");
    expect(results.some((r) => r.id === "CXI-021" && r.kind === "issue")).toBe(true);
  });

  it("accent-insensitive: gõ không dấu 'thiet bi' vẫn khớp theme có dấu 'Thiết bị...'", () => {
    const results = queryIndex(index, "thiet bi");
    expect(results.some((r) => r.id === "x-th-device" && r.kind === "reason")).toBe(true);
  });

  it("giới hạn theo limit truyền vào", () => {
    const unlimited = queryIndex(index, "a", 999);
    expect(unlimited.length).toBeGreaterThan(3);
    const limited = queryIndex(index, "a", 3);
    expect(limited.length).toBe(3);
    expect(limited).toEqual(unlimited.slice(0, 3));
  });

  it("không mutate index đầu vào", () => {
    const before = index.length;
    queryIndex(index, "eKYC");
    expect(index.length).toBe(before);
  });
});
