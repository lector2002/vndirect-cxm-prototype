import { describe, expect, it } from "vitest";
import type { DimRow } from "../data/schema/index.ts";
import { paintCategorical } from "./paintCategorical.ts";

describe("paintCategorical", () => {
  it("rows toàn `.c` undefined → mỗi row nhận màu --cat-N xoay vòng theo index", () => {
    const rows: DimRow[] = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, l: `row ${i}`, v: 10 - i }));
    const painted = paintCategorical(rows);
    expect(painted[0]?.c).toBe("var(--cat-1)");
    expect(painted[1]?.c).toBe("var(--cat-2)");
    expect(painted[2]?.c).toBe("var(--cat-3)");
    expect(painted[3]?.c).toBe("var(--cat-4)");
    expect(painted[4]?.c).toBe("var(--cat-5)");
    // row5 quay lại đầu chu kỳ (5 màu, index 5 % 5 = 0).
    expect(painted[5]?.c).toBe("var(--cat-1)");
  });

  it("có ít nhất 1 row `.c` định sẵn → trả về mảng NGUYÊN (chart đã có intent color)", () => {
    const rows: DimRow[] = [
      { id: "a", l: "A", v: 5, c: "#ff0000" },
      { id: "b", l: "B", v: 3 },
    ];
    const painted = paintCategorical(rows);
    expect(painted).toBe(rows);
    expect(painted[0]?.c).toBe("#ff0000");
    expect(painted[1]?.c).toBeUndefined();
  });

  it("không mutate input", () => {
    const rows: DimRow[] = [{ id: "a", l: "A", v: 5 }, { id: "b", l: "B", v: 3 }];
    const snapshot = rows.map((r) => ({ ...r }));
    paintCategorical(rows);
    expect(rows).toEqual(snapshot);
  });
});
