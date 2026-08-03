import { describe, expect, it } from "vitest";
/* demoData (300 khách sinh TẤT ĐỊNH) — cần cho qRunSplit vì seed.cust chỉ có 7 khách, không đủ để ô
   breakdown nào có số đáng đọc. seed vẫn dùng cho các ca biên (refuse/known=0). */
import { demoData } from "../data/fixtures/demo.ts";
import { dims, seed } from "../data/fixtures/seed.ts";
import type { Customer, CxmData, QuantifyShow } from "../data/schema/index.ts";
import { qRun, qRunCross, qRunDrill, qRunSegment, qRunSplit, ROW_BUILDERS, UNKNOWN_ROW_ID } from "./quantify.ts";

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
  // nav:    '<50tr' x6, '1-5tỷ' x1 (KH•••9F1)                  → known=7 unknown=0 missing=0
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

  /* nav là trục DUY NHẤT không có sentinel (owner chốt 04/08: NAV lấy trực tiếp từ giá trị tài sản
     hiện tại nên luôn tính ra được — chưa nạp tiền là 0đ, thuộc '<50tr'). Test này vì thế đồng thời
     là chốt chặn: nếu ai đó trả sentinel về cho nav thì unknown>0 và nó đỏ ngay. */
  it("nav — mọi khách đều có dải NAV, known=7 (không có nhóm 'chưa biết' trên trục này)", () => {
    const item: QuantifyShow = { id: "test-seg-nav", kind: "show", show: "nav", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seed, dims);
    if (res.kind !== "draw") throw new Error("kỳ vọng draw");
    expect(res.known).toBe(7);
    expect(res.unknown).toBe(0);
    expect(res.missing).toBe(0);
    expect(res.rows).toEqual([
      { id: "<50tr", l: "<50tr", v: 6 },
      { id: "1-5tỷ", l: "1-5tỷ", v: 1 },
    ]);
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
    /* Dựng fixture tối giản: giữ đúng 4 khách có tenure 'chưa-biết' → known=0. Trục dùng ở đây ĐỔI TỪ
       nav SANG tenure (04/08): nav không còn sentinel nên known=0 không thể xảy ra trên nav nữa. */
    const miniData: CxmData = { ...seed, cust: seed.cust.filter((c) => c.tenure === "chưa-biết") };
    const item: QuantifyShow = { id: "test-seg-zero", kind: "show", show: "tenure", metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, miniData, dims);
    expect(res.kind).toBe("refuse");
  });
});

/* ---------- qRunSplit — breakdown trục khách (Module D section 1, owner chốt 03/08) ----------
   Đây là chỗ chứng minh yêu cầu "thuật toán cần sử dụng được thật, chỉ mượn data demo": mọi số kiểm
   dưới đây được tính LẠI ĐỘC LẬP bằng `demoData.cust.filter(...)` thuần ngay trong test, không qua
   qRunSplit — nên nếu hàm bịa bất kỳ tỷ lệ nào, assert đỏ. Số hardcode kèm theo là chốt hồi quy: nó
   đỏ nếu generator của demo.ts đổi mà không ai để ý. */
describe("qRunSplit", () => {
  const acqByNav: QuantifyShow = {
    id: "t-split-acq-nav", kind: "show", name: "Kênh mở TK × NAV",
    show: "acq", split: "nav", metric: "count", chart: "rank",
  };

  it("không có `split` → off, KHÔNG phải refuse (chart thường, không phải lỗi)", () => {
    expect(qRunSplit(findShow("q17"), demoData, dims).kind).toBe("off");
  });

  it("BẤT BIẾN: Σ đoạn của mỗi hàng === v của hàng đó ở qRunSegment", () => {
    /* Bất biến QUAN TRỌNG NHẤT của cả section: Bars chuẩn hoá bề rộng đoạn theo Σseg TRONG fill, nên
       Σđoạn ≠ v thì thanh vẫn đầy nhưng các tooltip cộng lại ra một tổng KHÁC con số in ở cột giá
       trị — chart nói hai điều khác nhau về cùng một hàng mà không ai thấy. */
    for (const [show, split] of [["acq", "nav"], ["nav", "age"], ["age", "tier"], ["tenure", "seg"]] as const) {
      const item: QuantifyShow = { id: `t-inv-${show}`, kind: "show", name: "t", show, split, metric: "count", chart: "rank" };
      const seg = qRunSegment(item, demoData, dims);
      const sp = qRunSplit(item, demoData, dims);
      if (seg.kind !== "draw") throw new Error(`kỳ vọng draw (segment) cho ${show}`);
      if (sp.kind !== "draw") throw new Error(`kỳ vọng draw (split) cho ${show}×${split}`);
      for (const r of seg.rows) {
        const segs = sp.byRow[r.id] ?? [];
        expect(segs.reduce((a, s) => a + s.n, 0)).toBe(r.v);
      }
      /* Tổng MỌI đoạn === known, KHÔNG phải cust.length: khách có giá trị trục hàng là sentinel cố ý
         KHÔNG được chia màu (thanh "Không xác định" giữ một màu đặc). */
      expect(Object.values(sp.byRow).flat().reduce((a, s) => a + s.n, 0)).toBe(seg.known);
    }
  });

  it("oracle độc lập: hàng 'banner' của acq×nav khớp số đếm tay trên demoData.cust", () => {
    const sp = qRunSplit(acqByNav, demoData, dims);
    if (sp.kind !== "draw") throw new Error("kỳ vọng draw");
    const byLabel = Object.fromEntries(sp.byRow["banner"].map((s) => [s.label, s.n]));

    // (a) đếm tay, KHÔNG qua qRunSplit — đường tính hoàn toàn khác
    const hand = (nav: string) => demoData.cust.filter((c) => c.acq === "banner" && c.nav === nav).length;
    for (const nav of ["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", ">5tỷ"]) {
      expect(byLabel[nav]).toBe(hand(nav));
    }
    /* KHÔNG có đoạn "Không xác định" trên trục nav (owner chốt 04/08: NAV lấy từ tài sản hiện tại).
       Giữ assert phủ định để nếu sentinel quay lại thì đỏ ngay tại đây, không âm thầm thành một đoạn xám. */
    expect(byLabel["Không xác định"]).toBeUndefined();
    expect(hand("chưa-biết") + hand("thiếu")).toBe(0);

    // (b) chốt hồi quy trên generator demo.ts hiện tại (Σ = 60 = số khách acq='banner')
    expect(byLabel).toEqual({
      "200tr-1tỷ": 5, "50-200tr": 4, "<50tr": 47, "1-5tỷ": 2, ">5tỷ": 2,
    });
    expect(sp.byRow["banner"].reduce((a, s) => a + s.n, 0)).toBe(60);
  });

  it("legend dùng CHUNG cho mọi hàng, đúng 5 dải NAV (trục này không có 'Không xác định')", () => {
    const sp = qRunSplit(acqByNav, demoData, dims);
    if (sp.kind !== "draw") throw new Error("kỳ vọng draw");
    /* 5 thành viên NavBand, KHÔNG có bậc "Không xác định" (nav luôn có dải kể từ 04/08); chưa tới trần
       SPLIT_TOP_N=6 nên cũng KHÔNG có "Khác". Luật "ghim Không xác định xuống CUỐI" chuyển sang test
       ngay dưới (chia màu theo acq — trục còn sentinel thật), không mất độ phủ. */
    expect(sp.legend).toHaveLength(5);
    expect(sp.legend.some((l) => l.label === "Không xác định")).toBe(false);
    expect(sp.legend.some((l) => l.label.startsWith("Khác"))).toBe(false);
    /* Mọi nhãn đoạn của MỌI hàng phải nằm trong legend — nếu không, "màu thứ ba" của hàng A và hàng B
       là hai thứ khác nhau và chart mất khả năng so ngang. */
    const known = new Set(sp.legend.map((l) => l.label));
    for (const segs of Object.values(sp.byRow)) {
      for (const s of segs) expect(known.has(s.label)).toBe(true);
    }
  });

  /* Luật "Không xác định ghim CUỐI legend" — chuyển từ acq×nav sang age×acq sau 04/08: trục nav hết
     sentinel nên không còn chạm được nhánh này, còn acq thì có cả 'chưa-biết' (attribution chưa
     resolve) lẫn 'thiếu' (CRM chưa ghi nguồn). Ghim cuối để nhóm không-biết không chen giữa các bậc
     có tên và bị đọc như một hạng mục ngang hàng. */
  it("chia màu theo acq (trục CÓ sentinel) → 'Không xác định' ghim CUỐI legend", () => {
    const ageByAcq: QuantifyShow = {
      id: "t-split-age-acq", kind: "show", name: "Độ tuổi × Kênh mở TK",
      show: "age", split: "acq", metric: "count", chart: "rank",
    };
    const sp = qRunSplit(ageByAcq, demoData, dims);
    if (sp.kind !== "draw") throw new Error("kỳ vọng draw");
    // 5 AcqChannel + 1 "Không xác định" = 6, đúng trần SPLIT_TOP_N nên vẫn chưa có "Khác".
    expect(sp.legend).toHaveLength(6);
    expect(sp.legend[sp.legend.length - 1].label).toBe("Không xác định");
    // Đếm lại độc lập: 8 'chưa-biết' + 9 'thiếu' = 17 khách acq không biết, không được rơi mất.
    const unknownAcq = demoData.cust.filter((c) => c.acq === "chưa-biết" || c.acq === "thiếu");
    const unknownSegs = Object.values(sp.byRow)
      .flat()
      .filter((s) => s.label === "Không xác định")
      .reduce((a, s) => a + s.n, 0);
    // Chỉ tính khách có age BIẾT được (hàng của chart là age) — phần còn lại không có hàng để nằm.
    expect(unknownSegs).toBe(unknownAcq.filter((c) => c.age !== "chưa-biết" && c.age !== "thiếu").length);
  });

  /* "Khác" KHÔNG tới được bằng data thật ở section 1: mọi union trục khách có tối đa 5 thành viên
     (NavBand/AcqChannel=5, AgeBand/TenureBand=4, seg/tier=3) < SPLIT_TOP_N=6. Nhánh này là lưới an
     toàn cho section 2 (theme/keyword có hàng chục giá trị) và cho data thật nhiều band hơn — cùng
     kiểu với guard `unsupported` của CrossTable. Phải cast mới dựng được 8 giá trị nav. */
  it("Other: >6 giá trị → gộp đúng phần dư vào MỘT đoạn 'Khác (N ...)', không rơi mất khách nào", () => {
    const base = demoData.cust[0];
    // v1 xuất hiện 8 lần, v2 7 lần, … v8 1 lần ⇒ top6 = v1..v6, dồn v7(2)+v8(1) = 3 vào "Khác".
    const cust = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"].flatMap((v, i) =>
      Array.from({ length: 8 - i }, (_, j) => ({ ...base, key: `KH•••X${i}${j}`, acq: "banner", nav: v }) as Customer),
    );
    const sp = qRunSplit(acqByNav, { ...demoData, cust }, dims);
    if (sp.kind !== "draw") throw new Error("kỳ vọng draw");
    const other = sp.byRow["banner"].find((s) => s.label.startsWith("Khác"));
    // Nhãn NÓI RÕ gộp bao nhiêu giá trị ("phân khúc" = dims.nav.unit) — "Khác" trần che 2 hay 40 như nhau.
    expect(other?.label).toBe("Khác (2 phân khúc)");
    expect(other?.n).toBe(3);
    // Bất biến vẫn giữ: 8+7+6+5+4+3+2+1 = 36, không khách nào rơi mất khi gộp.
    expect(sp.byRow["banner"].reduce((a, s) => a + s.n, 0)).toBe(36);
  });

  it("refuse: split trùng show (mỗi thanh chỉ còn một đoạn)", () => {
    const res = qRunSplit({ ...acqByNav, split: "acq" }, demoData, dims);
    expect(res.kind).toBe("refuse");
    if (res.kind !== "refuse") throw new Error("unreachable");
    expect(res.reason).toMatch(/acq/);
  });

  it("refuse: trục chia màu KHÔNG phải thuộc tính khách → nêu rõ vì sao không tính thật được", () => {
    const res = qRunSplit({ ...acqByNav, split: "theme" }, demoData, dims);
    expect(res.kind).toBe("refuse");
    if (res.kind !== "refuse") throw new Error("unreachable");
    expect(res.reason).toMatch(/theme/);
    // Phải nói ra lý do THẬT: không có đường tính nào mà không bịa tỷ lệ.
    expect(res.reason).toMatch(/bịa tỷ lệ/);
  });

  it("refuse: trục hàng không phải thuộc tính khách (theme × nav)", () => {
    const res = qRunSplit({ ...acqByNav, show: "theme", split: "nav" }, demoData, dims);
    expect(res.kind).toBe("refuse");
    if (res.kind !== "refuse") throw new Error("unreachable");
    expect(res.reason).toMatch(/theme/);
  });

  it("refuse: known=0 ở trục hàng → không có thanh nào để chia màu", () => {
    // Giữ 4 khách tenure 'chưa-biết' ⇒ known=0 (cùng ca đã dùng cho qRunSegment; đổi từ nav sang
    // tenure vì nav hết sentinel từ 04/08 nên không dựng được known=0 trên nó nữa).
    const miniData: CxmData = { ...seed, cust: seed.cust.filter((c) => c.tenure === "chưa-biết") };
    expect(qRunSplit({ ...acqByNav, show: "tenure", split: "acq" }, miniData, dims).kind).toBe("refuse");
  });
});

/* qRunDrill — bản ghi thật dưới một hàng. Bài kiểm CHÍNH ở đây không phải "có trả về dòng nào không"
   mà là `kind` có nói đúng QUAN HỆ với con số trên thanh hay không: 'sample' (số tổng hợp sẵn, lệch
   hàng chục lần) vs 'full' (số chính là số bản ghi). Lẫn hai cái là dựng một panel nói dối. */
describe("qRunDrill", () => {
  const q1 = findShow("q1");
  const acq = findShow("q19");

  it("trục agg (theme): kind='sample' — total là số TỔNG HỢP, lines chỉ là tập mẫu, lệch ~50 lần", () => {
    const res = qRunDrill(q1, demoData, dims, "x-th-device");
    expect(res.kind).toBe("sample");
    if (res.kind !== "sample") throw new Error("unreachable");
    // Oracle: TaxNode 'x-th-device'.n = 412; data.ev có đúng 8 bản ghi mang theme này; pool = 17.
    expect(res.total).toBe(412);
    expect(res.lines).toHaveLength(8);
    expect(res.poolN).toBe(17);
    // Nguồn in TÊN, không in id — 'src-ekyc' → 'eKYC SDK'.
    expect(res.lines[0].meta).toContain("eKYC SDK");
    expect(res.lines[0].meta).not.toContain("src-ekyc");
  });

  it("trục agg, hàng KHÔNG có bằng chứng nào: vẫn kind='sample' với total thật, lines rỗng", () => {
    /* 10/14 theme trong demoData rơi vào ca này (17 bản ghi cho 14 theme). Phải trả total=210 chứ
       KHÔNG phải 'none': hàng đó có số thật trên thanh, chỉ là chưa có bằng chứng mẫu gắn vào — hai
       chuyện khác nhau và panel nói hai câu khác nhau. */
    const res = qRunDrill(q1, demoData, dims, "x-th-wait");
    expect(res.kind).toBe("sample");
    if (res.kind !== "sample") throw new Error("unreachable");
    expect(res.total).toBe(210);
    expect(res.lines).toHaveLength(0);
  });

  it("trục ev (cat): kind='full' — total === số dòng, vì số trên thanh CHÍNH LÀ số bản ghi đếm được", () => {
    const res = qRunDrill({ ...q1, show: "cat" }, demoData, dims, "complaint");
    expect(res.kind).toBe("full");
    if (res.kind !== "full") throw new Error("unreachable");
    expect(res.total).toBe(9);
    expect(res.lines).toHaveLength(res.total);
  });

  it("trục cust (acq): liệt kê KHÁCH, cắt ở DRILL_MAX nhưng total giữ số thật", () => {
    const res = qRunDrill(acq, demoData, dims, "tự tìm");
    expect(res.kind).toBe("full");
    if (res.kind !== "full") throw new Error("unreachable");
    // Oracle khớp live-check chart q19: 'tự tìm' = 62 khách.
    expect(res.total).toBe(62);
    // Cắt 50 dòng, KHÔNG cắt total — nếu total cũng bị cắt thì panel nói sai mẫu số.
    expect(res.lines).toHaveLength(50);
    // Khoá khách đã mask sẵn trong fixture; meta là 2 thuộc tính KHÁC trục đang xếp hàng.
    expect(res.lines[0].text).toMatch(/^KH•••/);
    expect(res.lines[0].meta).not.toContain("Kênh mở TK");
  });

  it("hàng 'Không xác định': kind='unknown', TÁCH LẠI hai sentinel mà chart đã gộp (bài học D0)", () => {
    const res = qRunDrill(acq, demoData, dims, UNKNOWN_ROW_ID);
    expect(res.kind).toBe("unknown");
    if (res.kind !== "unknown") throw new Error("unreachable");
    // Oracle khớp dòng coverage của q19: 8 chưa biết + 9 thiếu = 17.
    expect(res.unknownYet).toBe(8);
    expect(res.missing).toBe(9);
    expect(res.total).toBe(res.unknownYet + res.missing);
    // Mỗi dòng phải nói RÕ loại nào — cách chữa hai loại ngược nhau.
    expect(res.lines.some((l) => l.meta.includes("chưa biết"))).toBe(true);
    expect(res.lines.some((l) => l.meta.includes("thiếu"))).toBe(true);
  });

  it("rowId không có thật → kind='none' với lý do, KHÔNG mở panel trắng", () => {
    const res = qRunDrill(acq, demoData, dims, "không-có-thật");
    expect(res.kind).toBe("none");
    if (res.kind !== "none") throw new Error("unreachable");
    expect(res.reason).toContain("Kênh mở TK");
  });
});
