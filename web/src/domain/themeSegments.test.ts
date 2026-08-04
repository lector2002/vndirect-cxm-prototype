import { describe, expect, it } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import { demoData } from "../data/fixtures/demo.ts";
import { dims } from "../data/fixtures/seed.ts";
import type { Dim } from "../data/schema/index.ts";
import { ANON_CK } from "../data/validate.ts";
import { custField } from "./quantify.ts";
import { CAT_CYCLE, SUBTHEME_AXIS, themeAxisOptions, themeSegments } from "./themeSegments.ts";

/* Oracle subtheme 03/08 (đọc trực tiếp seed.ts) — GIỮ NGUYÊN, trục subtheme không đổi ở F1:
   - x-th-device (n=412): subs = x-sub-android(238) + x-sub-glare(174) = 412 → Σsub === theme.n → rem=0.
   - x-th-guide (n=368): sub = x-sub-errcode(196) → rem = 368-196 = 172.
   - x-th-status (n=295): sub = x-sub-timeout(142) → rem = 295-142 = 153.
   - x-th-fee (n=118): KHÔNG có subtheme nào, KHÔNG có VoiceInsight (data.ins) nào theo theme='x-th-fee'. */
describe("themeSegments — axis='subtheme' (THẬT, không đổi)", () => {
  it("themeId không tồn tại trong tax → []", () => {
    expect(themeSegments(seed, "khong-ton-tai", SUBTHEME_AXIS, dims)).toEqual([]);
    expect(themeSegments(seed, "khong-ton-tai", "pf", dims)).toEqual([]);
  });

  it("Σsub === theme.n (x-th-device) → KHÔNG có đoạn 'Chưa gán sub-theme'", () => {
    const segs = themeSegments(seed, "x-th-device", SUBTHEME_AXIS, dims);
    expect(segs).toHaveLength(2);
    expect(segs.map((s) => s.n)).toEqual([238, 174]);
    expect(segs.some((s) => s.label === "Chưa gán sub-theme")).toBe(false);
    expect(segs.reduce((a, s) => a + s.n, 0)).toBe(412);
  });

  it("Σsub < theme.n (x-th-guide) → thêm đoạn 'Chưa gán sub-theme' đúng rem, màu var(--ink3)", () => {
    const segs = themeSegments(seed, "x-th-guide", SUBTHEME_AXIS, dims);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ n: 196 });
    expect(segs[1]).toMatchObject({ label: "Chưa gán sub-theme", n: 172, c: "var(--ink3)" });
    expect(segs.reduce((a, s) => a + s.n, 0)).toBe(368);
  });

  it("Σsub < theme.n (x-th-status) → rem=153", () => {
    const segs = themeSegments(seed, "x-th-status", SUBTHEME_AXIS, dims);
    expect(segs[segs.length - 1]).toMatchObject({ label: "Chưa gán sub-theme", n: 153 });
    expect(segs.reduce((a, s) => a + s.n, 0)).toBe(295);
  });

  it("theme không có subtheme nào (x-th-fee) → đúng 1 đoạn xám n=theme.n", () => {
    const theme = seed.tax.find((t) => t.id === "x-th-fee")!;
    const segs = themeSegments(seed, "x-th-fee", SUBTHEME_AXIS, dims);
    expect(segs).toEqual([{ label: "Chưa gán sub-theme", n: theme.n, c: "var(--ink3)" }]);
  });
});

describe("themeAxisOptions — phái sinh từ dims, không hardcode tên trục", () => {
  it("phần tử đầu luôn 'subtheme'; mọi entry dims đều xuất hiện với đúng Dim.label", () => {
    const opts = themeAxisOptions(dims);
    expect(opts[0]).toEqual({ key: SUBTHEME_AXIS, label: "Sub-theme" });
    expect(opts).toHaveLength(1 + Object.keys(dims).length);
    for (const [key, dim] of Object.entries(dims)) {
      expect(opts.find((o) => o.key === key)?.label).toBe(dim.label);
    }
  });

  it("base:'agg' → khoá kèm disabledReason không rỗng, KHÔNG hardcode tên chiều (thêm Dim lạ vào dims tự hiện ra)", () => {
    const fakeDims: Record<string, Dim> = {
      "x-lạ-nào-đó": { label: "Chiều lạ tự khai", unit: "cái", base: "agg" },
    };
    const opts = themeAxisOptions(fakeDims);
    const opt = opts.find((o) => o.key === "x-lạ-nào-đó");
    expect(opt).toBeDefined();
    expect(opt!.label).toBe("Chiều lạ tự khai");
    expect(opt!.disabledReason).toBeTruthy();
  });

  it("base:'ev' không có trong EV_FIELD (cat/sen) → khoá kèm disabledReason không rỗng", () => {
    const opts = themeAxisOptions(dims);
    expect(opts.find((o) => o.key === "cat")?.disabledReason).toBeTruthy();
    expect(opts.find((o) => o.key === "sen")?.disabledReason).toBeTruthy();
  });

  it("base:'ev' có trong EV_FIELD (pf) hoặc base:'cust' (age/…) → KHÔNG bị khoá", () => {
    const opts = themeAxisOptions(dims);
    expect(opts.find((o) => o.key === "pf")?.disabledReason).toBeUndefined();
    expect(opts.find((o) => o.key === "age")?.disabledReason).toBeUndefined();
  });
});

/* Từ đây dùng demoData (300 khách, bằng chứng sinh theo Module F2/F2b) — seed chỉ có 17 bằng
   chứng cho 14 theme (m≈1/theme), chia chiều ra n=1 đúng nhưng vô dụng (module-f-charter.md). */
describe("themeSegments — trục đếm được từ dims (demoData)", () => {
  const themes = demoData.tax.filter((t) => t.lv === "theme");
  const countedAxes = Object.entries(dims)
    .filter(([key, dim]) => key === "pf" || dim.base === "cust")
    .map(([key]) => key);

  it("Σ mọi đoạn === theme.n, cho MỌI theme × MỌI trục không bị khoá (subtheme + pf + 6 trục cust)", () => {
    for (const theme of themes) {
      for (const axis of [SUBTHEME_AXIS, ...countedAxes]) {
        const segs = themeSegments(demoData, theme.id, axis, dims);
        const sum = segs.reduce((a, s) => a + s.n, 0);
        expect(sum).toBe(theme.n);
      }
    }
  });

  /* Test bắt buộc (module-f-charter.md, "Test seams"): "với mọi chiều, tập nhãn trả về phải là tập
     giá trị của đúng một chiều — không tồn tại kết quả nào chứa cùng lúc 'Android' và 'Khách 50+'."
     Đây là test chặn tái diễn lỗi trục "Nhóm khách" DEMO cũ (nhãn tự bịa, không thuộc domain nào). */
  it("MỖI trục: nhãn đoạn THƯỜNG chỉ thuộc tập giá trị của ĐÚNG trục đó, không lẫn trục khác", () => {
    const unknownLabels = new Set(["chưa-biết", "thiếu", "Ẩn danh", "Chưa đối chiếu được", "Chưa có bằng chứng gán"]);
    const domainOf = (axis: string): Set<string> =>
      axis === "pf"
        ? new Set(demoData.ev.map((e) => e.pf))
        : new Set(
            demoData.cust
              .map((c) => custField(dims, axis)!(c))
              .filter((v) => v !== "chưa-biết" && v !== "thiếu"),
          );
    for (const theme of themes) {
      for (const axis of countedAxes) {
        const domain = domainOf(axis);
        const segs = themeSegments(demoData, theme.id, axis, dims);
        for (const s of segs) {
          if (unknownLabels.has(s.label)) continue;
          expect(domain.has(s.label)).toBe(true);
        }
      }
    }
  });

  /* Đếm tay độc lập (không gọi lại themeSegments) trực tiếp trên demoData.ev, đối chiếu bằng
     probe tạm lúc code (đã xoá) — số dưới đây khớp 1-1 với log của probe đó. */
  it("trục 'pf' của x-th-device: đếm tay {android:175, ios:82, web:39}, tổng 3 đoạn + đoạn 'không biết' === số dòng ev", () => {
    const theme = demoData.tax.find((t) => t.id === "x-th-device")!;
    const rows = demoData.ev.filter((e) => e.tax.includes(theme.id));
    const handCount = new Map<string, number>();
    for (const e of rows) handCount.set(e.pf, (handCount.get(e.pf) ?? 0) + 1);
    expect(Object.fromEntries(handCount)).toEqual({ android: 175, ios: 82, web: 39 });

    const segs = themeSegments(demoData, "x-th-device", "pf", dims);
    const known = new Set(["chưa-biết", "thiếu", "Ẩn danh", "Chưa đối chiếu được"]);
    const normalSum = segs.filter((s) => !known.has(s.label) && s.label !== "Chưa có bằng chứng gán").reduce((a, s) => a + s.n, 0);
    const unknownSum = segs.filter((s) => known.has(s.label)).reduce((a, s) => a + s.n, 0);
    // pf đọc thẳng từ Evidence (base:'ev'), không qua join ck → không có đoạn "không biết" nào.
    expect(unknownSum).toBe(0);
    expect(normalSum).toBe(rows.length);
    expect(rows.length).toBe(296);
  });

  it("'chưa-biết' và 'thiếu' KHÔNG BAO GIỜ ra cùng một đoạn (trục 'acq' của x-th-device: cả hai n>0)", () => {
    const segs = themeSegments(demoData, "x-th-device", "acq", dims);
    const unk = segs.find((s) => s.label === "chưa-biết");
    const missing = segs.find((s) => s.label === "thiếu");
    expect(unk).toBeDefined();
    expect(missing).toBeDefined();
    expect(unk!.n).toBeGreaterThan(0);
    expect(missing!.n).toBeGreaterThan(0);
    expect(unk!.label).not.toBe(missing!.label);
    expect(unk!.c).not.toBe(missing!.c);
    expect(unk!.c).toBe("var(--unk)");
    expect(missing!.c).toBe("var(--unk-gap)");
  });

  it("đoạn 'Ẩn danh' có mặt ở MỌI theme (trục 'age', kể cả khi n=0)", () => {
    for (const theme of themes) {
      const segs = themeSegments(demoData, theme.id, "age", dims);
      const anon = segs.find((s) => s.label === "Ẩn danh");
      expect(anon).toBeDefined();
      expect(anon!.n).toBeGreaterThanOrEqual(0);
      expect(anon!.c).toBe("var(--unk-anon)");
    }
  });

  /* Test trên KHÔNG tự đi qua nhánh n=0 (demoData có Ẩn danh >0 ở mọi theme) — dựng lát cắt bỏ hết
     dòng Ẩn danh của x-th-device để khoá riêng nhánh "LUÔN có mặt kể cả n=0" (module-f-charter.md:
     "Đoạn này LUÔN có mặt kể cả n === 0"). */
  it("đoạn 'Ẩn danh' vẫn có mặt với n=0 khi lát dữ liệu không còn dòng Ẩn danh nào", () => {
    const theme = demoData.tax.find((t) => t.id === "x-th-device")!;
    const sliced = { ...demoData, ev: demoData.ev.filter((e) => !(e.tax.includes(theme.id) && e.ck === ANON_CK)) };
    const segs = themeSegments(sliced, "x-th-device", "age", dims);
    const anon = segs.find((s) => s.label === "Ẩn danh");
    expect(anon).toEqual({ label: "Ẩn danh", n: 0, c: "var(--unk-anon)" });
    // Σ vẫn === theme.n (rem hấp thụ đúng số dòng Ẩn danh đã bị lọc bỏ).
    expect(segs.reduce((a, s) => a + s.n, 0)).toBe(theme.n);
  });

  it("đoạn 'Chưa đối chiếu được' xuất hiện khi ck không tra ra khách nào (x-th-device, trục 'age')", () => {
    const segs = themeSegments(demoData, "x-th-device", "age", dims);
    const unjoined = segs.find((s) => s.label === "Chưa đối chiếu được");
    expect(unjoined).toBeDefined();
    expect(unjoined!.n).toBe(1);
    expect(unjoined!.c).toBe("var(--unk-join)");
  });

  it("Không đoạn nào của nhóm 'không biết'/'chưa gán' mang màu CAT_CYCLE", () => {
    const unknownLabels = new Set(["chưa-biết", "thiếu", "Ẩn danh", "Chưa đối chiếu được", "Chưa có bằng chứng gán"]);
    for (const theme of themes) {
      for (const axis of ["pf", "age", "acq"]) {
        const segs = themeSegments(demoData, theme.id, axis, dims);
        for (const s of segs) {
          if (unknownLabels.has(s.label)) expect(CAT_CYCLE).not.toContain(s.c);
        }
      }
    }
  });

  it("trục base:'agg' (theme/l1/l2/l3/sub/src) → luôn [] trên demoData", () => {
    for (const axis of ["theme", "l1", "l2", "l3", "sub", "src"]) {
      expect(themeSegments(demoData, "x-th-device", axis, dims)).toEqual([]);
    }
  });

  it("trục base:'ev' không có EV_FIELD (cat/sen) → []", () => {
    expect(themeSegments(demoData, "x-th-device", "cat", dims)).toEqual([]);
    expect(themeSegments(demoData, "x-th-device", "sen", dims)).toEqual([]);
  });

  it("axis không tồn tại trong dims và khác 'subtheme' → []", () => {
    expect(themeSegments(demoData, "x-th-device", "khong-co-truc-nay", dims)).toEqual([]);
  });

  it("themeId không tồn tại → [] (trên demoData, trục 'pf')", () => {
    expect(themeSegments(demoData, "khong-ton-tai", "pf", dims)).toEqual([]);
  });

  it("giá trị THƯỜNG sắp giảm dần theo n, màu CAT_CYCLE theo thứ hạng (trục 'pf' của x-th-device)", () => {
    const segs = themeSegments(demoData, "x-th-device", "pf", dims);
    const normal = segs.filter((s) => s.label === "android" || s.label === "ios" || s.label === "web");
    expect(normal.map((s) => s.label)).toEqual(["android", "ios", "web"]);
    expect(normal.map((s) => s.n)).toEqual([175, 82, 39]);
    expect(normal.map((s) => s.c)).toEqual([CAT_CYCLE[0], CAT_CYCLE[1], CAT_CYCLE[2]]);
  });

  it("đoạn 'Chưa có bằng chứng gán' = theme.n - m, màu var(--rem), chỉ thêm khi rem>0", () => {
    const theme = demoData.tax.find((t) => t.id === "x-th-device")!;
    const rows = demoData.ev.filter((e) => e.tax.includes(theme.id));
    const segs = themeSegments(demoData, "x-th-device", "pf", dims);
    const rem = segs.find((s) => s.label === "Chưa có bằng chứng gán");
    expect(rem).toEqual({ label: "Chưa có bằng chứng gán", n: theme.n - rows.length, c: "var(--rem)" });
  });
});
