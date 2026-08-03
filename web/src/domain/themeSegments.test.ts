import { describe, expect, it } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import { themeSegments } from "./themeSegments.ts";

/* Oracle 03/08 (đọc trực tiếp seed.ts):
   - x-th-device (n=412): subs = x-sub-android(238) + x-sub-glare(174) = 412 → Σsub === theme.n → rem=0.
   - x-th-guide (n=368): sub = x-sub-errcode(196) → rem = 368-196 = 172.
   - x-th-status (n=295): sub = x-sub-timeout(142) → rem = 295-142 = 153.
   - x-th-fee (n=118): KHÔNG có subtheme nào, KHÔNG có VoiceInsight (data.ins) nào theo theme='x-th-fee'. */
describe("themeSegments", () => {
  it("themeId không tồn tại trong tax → []", () => {
    expect(themeSegments(seed, "khong-ton-tai", "subtheme")).toEqual([]);
    expect(themeSegments(seed, "khong-ton-tai", "group")).toEqual([]);
  });

  describe("axis='subtheme' (THẬT)", () => {
    it("Σsub === theme.n (x-th-device) → KHÔNG có đoạn 'Chưa gán sub-theme'", () => {
      const segs = themeSegments(seed, "x-th-device", "subtheme");
      expect(segs).toHaveLength(2);
      expect(segs.map((s) => s.n)).toEqual([238, 174]);
      expect(segs.some((s) => s.label === "Chưa gán sub-theme")).toBe(false);
      expect(segs.reduce((a, s) => a + s.n, 0)).toBe(412);
      // Không đoạn nào demo — trục subtheme là THẬT.
      expect(segs.every((s) => !s.demo)).toBe(true);
    });

    it("Σsub < theme.n (x-th-guide) → thêm đoạn 'Chưa gán sub-theme' đúng rem, màu var(--ink3)", () => {
      const segs = themeSegments(seed, "x-th-guide", "subtheme");
      expect(segs).toHaveLength(2);
      expect(segs[0]).toMatchObject({ n: 196 });
      expect(segs[1]).toMatchObject({ label: "Chưa gán sub-theme", n: 172, c: "var(--ink3)" });
      expect(segs.reduce((a, s) => a + s.n, 0)).toBe(368);
    });

    it("Σsub < theme.n (x-th-status) → rem=153", () => {
      const segs = themeSegments(seed, "x-th-status", "subtheme");
      expect(segs[segs.length - 1]).toMatchObject({ label: "Chưa gán sub-theme", n: 153 });
      expect(segs.reduce((a, s) => a + s.n, 0)).toBe(295);
    });

    it("theme không có subtheme nào (x-th-fee) → đúng 1 đoạn xám n=theme.n", () => {
      const theme = seed.tax.find((t) => t.id === "x-th-fee")!;
      const segs = themeSegments(seed, "x-th-fee", "subtheme");
      expect(segs).toEqual([{ label: "Chưa gán sub-theme", n: theme.n, c: "var(--ink3)" }]);
    });
  });

  describe("axis='group' (DEMO)", () => {
    it("Σ luôn bằng theme.n (mọi theme, cả có/không có VoiceInsight)", () => {
      for (const id of ["x-th-device", "x-th-guide", "x-th-fee", "x-th-branch"]) {
        const theme = seed.tax.find((t) => t.id === id)!;
        const segs = themeSegments(seed, id, "group");
        expect(segs.reduce((a, s) => a + s.n, 0)).toBe(theme.n);
        expect(segs.every((s) => s.demo === true)).toBe(true);
      }
    });

    it("deterministic — gọi 2 lần cùng themeId ra cùng kết quả (không random/Date.now)", () => {
      const a = themeSegments(seed, "x-th-device", "group");
      const b = themeSegments(seed, "x-th-device", "group");
      expect(a).toEqual(b);
    });

    it("theme có VoiceInsight (x-th-device) → nhãn lấy từ data.ins.seg thật, KHÔNG dùng DEMO_GROUPS", () => {
      const segs = themeSegments(seed, "x-th-device", "group");
      expect(segs.map((s) => s.label).sort()).toEqual(["Android tầm trung", "Khách 50+"].sort());
    });

    it("theme KHÔNG có VoiceInsight (x-th-fee) → fallback nhãn demo hằng định", () => {
      const segsFee = themeSegments(seed, "x-th-fee", "group");
      const segsBranch = themeSegments(seed, "x-th-branch", "group");
      expect(segsFee.map((s) => s.label)).toEqual(["Khách mới", "Khách lâu năm", "Nhà đầu tư chủ động", "Khách VIP"]);
      expect(segsBranch.map((s) => s.label)).toEqual(["Khách mới", "Khách lâu năm", "Nhà đầu tư chủ động", "Khách VIP"]);
    });

    it("hai theme CÙNG n=96 (x-th-slow, x-th-branch) nhưng id khác → tỷ trọng khác nhau (không phải một mảng ratio giống hệt mọi theme)", () => {
      const segsSlow = themeSegments(seed, "x-th-slow", "group");
      const segsBranch = themeSegments(seed, "x-th-branch", "group");
      expect(segsSlow.map((s) => s.n)).not.toEqual(segsBranch.map((s) => s.n));
      // Nhưng cả hai vẫn chuẩn hoá đúng về theme.n=96.
      expect(segsSlow.reduce((a, s) => a + s.n, 0)).toBe(96);
      expect(segsBranch.reduce((a, s) => a + s.n, 0)).toBe(96);
    });
  });
});
