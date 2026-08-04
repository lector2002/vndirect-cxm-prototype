/* Nhãn nền tảng của chart theme KHÔNG được phụ thuộc thứ tự import.
 *
 * THỨ TỰ HAI DÒNG IMPORT DƯỚI ĐÂY LÀ NỘI DUNG CỦA TEST — đừng sắp xếp lại, đừng để công cụ tự sort.
 * `quantify.ts` phải đứng TRƯỚC `themeSegments.ts`, vì đó là thứ tự làm lộ lỗi: hai file import chéo
 * nhau (quantify.ts:15 lấy CAT_CYCLE, themeSegments.ts:4 lấy PF_LABEL), `const` không hoist, nên nạp
 * `quantify.ts` trước làm `PF_LABEL` chưa khởi tạo lúc `EV_LABEL` được khai. Nếu `EV_LABEL` đọc thẳng
 * bảng lúc khai (thay vì bọc hàm, deref lúc gọi) thì nhãn lặng lẽ rơi về giá trị thô 'android'/'ios'
 * và không có gì đỏ. Test cũ trong themeSegments.test.ts KHÔNG bắt được, vì nó import theo thứ tự
 * ngược — thứ tự "may mắn" chạy đúng.
 */
import { PF_LABEL, qRun } from "./quantify.ts";
import { themeSegments } from "./themeSegments.ts";
import { describe, expect, it } from "vitest";
import { seed, dims } from "../data/fixtures/seed.ts";

void qRun; /* Chỉ để chắc chắn quantify.ts thực sự được nạp, không bị tree-shake khỏi thứ tự. */

describe("nhãn nền tảng chart theme", () => {
  it("không phụ thuộc thứ tự import — không segment nào mang giá trị thô", () => {
    const rawKeys = Object.keys(PF_LABEL); // 'ios' | 'android' | 'web' | 'server'
    expect(rawKeys.length).toBeGreaterThan(0);

    const themes = seed.tax.filter((t) => t.lv === "theme").map((t) => t.id);
    const labels = themes.flatMap((t) => themeSegments(seed, t, "pf", dims).map((s) => s.label));

    /* Phải có nhãn thật để test không xanh rỗng — nếu chart không dựng segment nào thì
       "không có nhãn thô" đúng một cách vô nghĩa. */
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.some((l) => Object.values(PF_LABEL).includes(l))).toBe(true);

    expect(labels.filter((l) => rawKeys.includes(l))).toEqual([]);
  });

  it("đổi tên nhãn nhưng KHÔNG đổi khoá đếm — tổng vẫn bằng theme.n", () => {
    for (const theme of seed.tax.filter((t) => t.lv === "theme")) {
      const segs = themeSegments(seed, theme.id, "pf", dims);
      if (segs.length === 0) continue;
      expect(segs.reduce((s, x) => s + x.n, 0)).toBe(theme.n);
    }
  });
});
