import { describe, expect, it } from "vitest";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { CxmData, QuantifyShow } from "../data/schema/index.ts";
import { qRun, qRunCross, qRunSegment, ROW_BUILDERS } from "./quantify.ts";

function findShow(id: string): QuantifyShow {
  const q = seed.qt.find((x) => x.id === id);
  if (!q || q.kind !== "show") throw new Error(`fixture ${id} phải là QuantifyShow`);
  return q;
}

describe("qRun", () => {
  it("q1 (theme, base=agg) — rows khớp tax lv='theme', xếp giảm dần, pct cộng ~100%", () => {
    const rows = qRun(findShow("q1"), seed, dims);
    // 14 node lv='theme' trong seed (dòng ~267-280 seed.ts)
    expect(rows).toHaveLength(14);
    // c: màu theo cat (intent) của node — x-th-device cat='complaint' → data.cats.complaint.color
    // (S2.7/D5a: themeRows() giờ tô theo intent thay vì hardcode 1 node praise, xem quantify.ts).
    expect(rows[0]).toEqual({
      id: "x-th-device",
      l: "Thiết bị / môi trường không tương thích",
      v: 412,
      c: "var(--cat-3)",
    });
    const total = rows.reduce((a, r) => a + r.v, 0);
    // Neo theo seed thật: tổng n của 14 theme node = 2319 (412+368+295+210+186+164+118+96+92+96+74+58+88+62)
    expect(total).toBe(2319);
    const pctSum = rows.reduce((a, r) => a + (r.v / total) * 100, 0);
    expect(Math.round(pctSum)).toBe(100);
    // Xếp giảm dần
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].v).toBeGreaterThanOrEqual(rows[i].v);
  });

  it("q3 (cat, base=ev) — đếm đúng số ev theo từng category trong seed.ev (17 bản ghi)", () => {
    const rows = qRun(findShow("q3"), seed, dims);
    // Đếm tay trên seed.ev: complaint 9 (101-104,201,301-303,501), help 3 (105,202,305),
    // improvement 3 (203,401,601), praise 2 (304,402) — tổng 17 khớp seed.ev.length.
    // Màu đọc từ data.cats (S2.7/D5a: cats thôi vay màu trạng thái --crit/--watch/--good, đổi
    // sang thang phân loại --cat-* — xem seed.ts cats + quantify.ts catRows()).
    expect(rows).toEqual([
      { id: "complaint", l: "Khiếu nại", c: "var(--cat-3)", v: 9 },
      { id: "help", l: "Cần hỗ trợ", c: "var(--cat-1)", v: 3 },
      { id: "improvement", l: "Đề xuất cải thiện", c: "var(--cat-2)", v: 3 },
      { id: "praise", l: "Khen ngợi", c: "var(--cat-4)", v: 2 },
    ]);
    expect(rows.reduce((a, r) => a + r.v, 0)).toBe(seed.ev.length);
  });

  // Không có item nào trong seed.qt có show='seg' nên tự dựng item, đúng hướng dẫn khi seed thiếu.
  it("seg (cust, base=cust) — đếm đúng số khách theo segment trong seed.cust (7 khách)", () => {
    const item: QuantifyShow = { id: "test-seg", kind: "show", show: "seg", metric: "count", chart: "rank", name: "test" };
    const rows = qRun(item, seed, dims);
    // Đếm tay trên seed.cust (7 dòng): 'Mới mở TK' x5, 'Khách chuyển từ CTCK khác' x1, 'Khách 50+' x1
    expect(rows).toEqual([
      { id: "Mới mở TK", l: "Mới mở TK", v: 5 },
      { id: "Khách chuyển từ CTCK khác", l: "Khách chuyển từ CTCK khác", v: 1 },
      { id: "Khách 50+", l: "Khách 50+", v: 1 },
    ]);
    expect(rows.reduce((a, r) => a + r.v, 0)).toBe(seed.cust.length);
  });

  it("chiều không tồn tại trong dims → rows rỗng, không throw", () => {
    const item: QuantifyShow = { id: "test-bad", kind: "show", show: "khong-ton-tai", metric: "count", chart: "rank", name: "test" };
    expect(() => qRun(item, seed, dims)).not.toThrow();
    expect(qRun(item, seed, dims)).toEqual([]);
  });

  // Chặn bẫy quantify.ts:126 (`if (!dims[item.show]) return []`): nếu ai đó thêm một trục vào
  // ROW_BUILDERS mà quên khai trong `dims` (hoặc ngược lại), qRun trả rỗng IM LẶNG — không throw,
  // không log. Test này khẳng định hai tập id luôn khớp nhau, kể cả sau khi thêm age/nav/tenure/acq.
  it("ROW_BUILDERS và dims khớp 1-1 về tập id — lệch một bên là biểu đồ rỗng im lặng", () => {
    expect(Object.keys(ROW_BUILDERS).sort()).toEqual(Object.keys(dims).sort());
  });
});

describe("qRunCross", () => {
  it("q16 (theme × pf) — matrix khớp seed.ev thật", () => {
    const cx = qRunCross(findShow("q16"), seed, dims);
    expect(cx.sampleN).toBe(seed.ev.length); // 17
    expect(cx.matched).toBe(17); // mọi ev trong seed đều có cả theme lẫn pf hợp lệ
    expect(cx.grand).toBe(17);
    // Ghi chú quan trọng: trong seed THẬT, mỗi ev chỉ mang đúng 1 node theme và 1 pf (không có ev
    // nào gắn 2 theme cùng lúc) nên multi=false ở đây — khác với kỳ vọng sơ bộ "multi=true (theme
    // multi-valued)" ghi trong spec section. Nhánh multi=true được port đúng và test riêng bên dưới
    // bằng một fixture tối giản có ev gắn 2 theme.
    expect(cx.multi).toBe(false);
    expect(cx.rows.map((r) => ({ id: r.id, tot: r.tot }))).toEqual([
      { id: "x-th-device", tot: 8 },
      { id: "x-th-guide", tot: 4 },
      { id: "x-th-status", tot: 3 },
      { id: "x-th-praise", tot: 2 },
    ]);
    expect(cx.cols.map((c) => ({ id: c.id, tot: c.tot }))).toEqual([
      { id: "android", tot: 9 },
      { id: "ios", tot: 6 },
      { id: "web", tot: 2 },
    ]);
    // server không xuất hiện (tot=0, đã lọc) — đúng hành vi prototype (filter tot>0, dòng ~1948-1949)
    expect(cx.cols.some((c) => c.id === "server")).toBe(false);
    expect(cx.cell["x-th-device"]).toEqual({ android: 7, ios: 1 });
    expect(cx.cell["x-th-guide"]).toEqual({ ios: 1, android: 2, web: 1 });
    expect(cx.cell["x-th-status"]).toEqual({ ios: 2, web: 1 });
    expect(cx.cell["x-th-praise"]).toEqual({ ios: 2 });
    // Ghép chéo 2 trục evidence bình thường (theme, pf đều base khác 'cust') → unsupported=null,
    // số liệu ở trên KHÔNG đổi so với trước khi thêm field này.
    expect(cx.unsupported).toBeNull();
  });

  it("multi=true khi một ev mang nhiều node cùng tầng (fixture tối giản, không sửa seed.ts)", () => {
    const miniData: CxmData = { ...seed, ev: [{ ...seed.ev[0], tax: ["x-th-device", "x-th-guide"] }] };
    const item: QuantifyShow = { id: "test-cross-multi", kind: "show", show: "theme", by: "pf", metric: "count", chart: "rank", name: "test" };
    const cx = qRunCross(item, miniData, dims);
    expect(cx.multi).toBe(true);
    expect(cx.sampleN).toBe(1);
    // Một ev, 2 theme × 1 pf → 2 cell, grand=2, nhưng vẫn chỉ 1 ev match (matched đếm theo ev, không theo cell)
    expect(cx.grand).toBe(2);
    expect(cx.matched).toBe(1);
  });

  it("defensive: chiều thiếu evAttr (seg) → matrix rỗng, không throw", () => {
    const item: QuantifyShow = { id: "test-defensive", kind: "show", show: "seg", by: "pf", metric: "count", chart: "rank", name: "test" };
    expect(() => qRunCross(item, seed, dims)).not.toThrow();
    const cx = qRunCross(item, seed, dims);
    expect(cx.rows).toEqual([]);
    expect(cx.cols).toEqual([]);
    expect(cx.cell).toEqual({});
    expect(cx.matched).toBe(0);
    expect(cx.grand).toBe(0);
    expect(cx.multi).toBe(false);
    expect(cx.sampleN).toBe(seed.ev.length);
    // seg là trục khách (base:'cust') — matrix rỗng ở trên là "không ghép được", KHÔNG PHẢI "ghép
    // được nhưng không match" — hai trường hợp trước đây không phân biệt được (bẫy CROSS_EXTRACT).
    expect(cx.unsupported).not.toBeNull();
    expect(cx.unsupported).toMatch(/seg/);
  });

  it("trục khách MỚI (age/nav/tenure/acq) cũng bị chặn ghép chéo như seg/tier — không nhân bẫy cũ", () => {
    for (const show of ["age", "nav", "tenure", "acq"] as const) {
      const item: QuantifyShow = { id: `test-cust-${show}`, kind: "show", show, by: "pf", metric: "count", chart: "rank", name: "test" };
      const cx = qRunCross(item, seed, dims);
      expect(cx.unsupported).not.toBeNull();
      expect(cx.rows).toEqual([]);
      expect(cx.cols).toEqual([]);
    }
  });
});

describe("qRunSegment", () => {
  // Oracle đếm tay trên seed.cust thật (7 khách, dòng ~518-531 seed.ts):
  // age:    25-34,35-49,25-34,35-49,25-34,35-49,50+           → known=7 unknown=0 missing=0
  // nav:    chưa-biết x6, '1-5tỷ' x1 (KH•••9F1)                → known=1 unknown=6 missing=0
  // tenure: chưa-biết x4, '<6 tháng' x2, '>5 năm' x1           → known=3 unknown=4 missing=0
  // acq:    banner,banner,tự tìm,giới thiệu,đối tác,chi nhánh,chi nhánh → known=7 unknown=0 missing=0
  it("age — mọi khách đã biết, known=7", () => {
    const item: QuantifyShow = { id: "test-seg-age", kind: "show", show: "age", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seed, dims);
    if (res.kind !== "draw") throw new Error("kỳ vọng draw");
    expect(res.known).toBe(7);
    expect(res.unknown).toBe(0);
    expect(res.missing).toBe(0);
    expect(res.rows.reduce((a, r) => a + r.v, 0)).toBe(res.known);
  });

  it("nav — chỉ 1/7 khách đã có NAV, 6 còn lại chưa-biết (nội dung thật của trục, không phải lỗi)", () => {
    const item: QuantifyShow = { id: "test-seg-nav", kind: "show", show: "nav", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seed, dims);
    if (res.kind !== "draw") throw new Error("kỳ vọng draw");
    expect(res.known).toBe(1);
    expect(res.unknown).toBe(6);
    expect(res.missing).toBe(0);
    expect(res.rows).toEqual([{ id: "1-5tỷ", l: "1-5tỷ", v: 1 }]);
  });

  it("tenure — known=3 unknown=4", () => {
    const item: QuantifyShow = { id: "test-seg-tenure", kind: "show", show: "tenure", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seed, dims);
    if (res.kind !== "draw") throw new Error("kỳ vọng draw");
    expect(res.known).toBe(3);
    expect(res.unknown).toBe(4);
    expect(res.missing).toBe(0);
  });

  it("acq — known=7", () => {
    const item: QuantifyShow = { id: "test-seg-acq", kind: "show", show: "acq", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seed, dims);
    if (res.kind !== "draw") throw new Error("kỳ vọng draw");
    expect(res.known).toBe(7);
    expect(res.unknown).toBe(0);
    expect(res.missing).toBe(0);
  });

  it("known+unknown+missing luôn bằng data.cust.length trên cả 6 trục khách — mẫu số không bao giờ mất khách", () => {
    for (const show of ["seg", "tier", "age", "nav", "tenure", "acq"] as const) {
      const item: QuantifyShow = { id: `test-seg-total-${show}`, kind: "show", show, metric: "count", chart: "rank", name: "test" };
      const res = qRunSegment(item, seed, dims);
      if (res.kind !== "draw") throw new Error(`kỳ vọng draw cho ${show}`);
      expect(res.known + res.unknown + res.missing).toBe(seed.cust.length);
      // rows chỉ chứa band có thật — sentinel không được lẫn vào
      expect(res.rows.some((r) => r.id === "chưa-biết" || r.id === "thiếu")).toBe(false);
    }
  });

  it("trục không phải trục khách (base khác 'cust') → refuse, nêu rõ lý do", () => {
    const item: QuantifyShow = { id: "test-seg-notcust", kind: "show", show: "theme", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seed, dims);
    expect(res.kind).toBe("refuse");
    if (res.kind !== "refuse") throw new Error("unreachable");
    expect(res.reason).toMatch(/theme/);
  });

  it("known=0 (chưa khách nào biết) → refuse, KHÔNG vẽ matrix rỗng như thật", () => {
    // Dựng fixture tối giản: loại bỏ đúng khách duy nhất có nav thật (KH•••9F1) khỏi seed thật,
    // còn lại toàn 'chưa-biết' → known=0. Không sửa seed.ts, chỉ override cục bộ cho test này.
    const miniData: CxmData = { ...seed, cust: seed.cust.filter((c) => c.nav !== "1-5tỷ") };
    const item: QuantifyShow = { id: "test-seg-zero", kind: "show", show: "nav", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, miniData, dims);
    expect(res.kind).toBe("refuse");
  });
});
