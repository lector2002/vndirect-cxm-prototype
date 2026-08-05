import { describe, expect, it } from "vitest";
/* demoData (300 khách sinh TẤT ĐỊNH) — cần cho qRunSplit vì seed.cust chỉ có 7 khách, không đủ để ô
   breakdown nào có số đáng đọc. seed vẫn dùng cho các ca biên (refuse/known=0). */
import { demoData } from "../data/fixtures/demo.ts";
import { cfgDefault, dims, seed } from "../data/fixtures/seed.ts";
import { projectCustomer } from "../data/projectBands.ts";
import type { Cfg, Customer, CxmData, Dim, QuantifyShow } from "../data/schema/index.ts";
import { NOCUST_LABEL, qRun, qRunCross, qRunDrill, qRunSegment, qRunSplit, rowBuilder, UNKNOWN_ROW_ID } from "./quantify.ts";

function findShow(id: string): QuantifyShow {
  const q = seed.qt.find((x) => x.id === id);
  if (!q || q.kind !== "show") throw new Error(`fixture ${id} phải là QuantifyShow`);
  return q;
}

/* S2 (04/08): `tenure` (Thâm niên giao dịch) đã RÚT khỏi `dims`/`cfgDefault.segment.band` — sản phẩm
   không còn cắt chart theo chiều này. Nhưng `tenure` vẫn là trục DUY NHẤT dựng từ `seed` có sentinel
   THẬT (4/7 khách 'chưa-biết' trên tenureMonths — seed chỉ còn `nav` với 1/7 known, không đủ để
   dựng ca refuse/known=0), nên vài test dưới đây vẫn cần chạm nhánh sentinel/refuse qua đúng chiều
   đó để không mất độ phủ. Dựng DIM + CFG TEST-LOCAL, chiếu qua đúng đường sản phẩm (`projectCustomer`,
   cùng đường data/projectBands.test.ts:32 dùng) — KHÔNG phục hồi `dims.tenure` ở sản phẩm thật. */
const TENURE_TEST_ID = "ttenure";
const testDims: Record<string, Dim> = {
  ...dims,
  [TENURE_TEST_ID]: { label: "Thâm niên giao dịch (test)", unit: "nhóm thâm niên", base: "cust", cut: { kind: "band", source: "tenureMonths" } },
};
const testCfg: Cfg = {
  ...cfgDefault,
  segment: { ...cfgDefault.segment, band: { ...cfgDefault.segment.band, [TENURE_TEST_ID]: { min: null, cuts: [6, 24, 60], unit: "tháng" } } },
};
const seedWithTenure: CxmData = { ...seed, cust: seed.cust.map((c) => projectCustomer(c, testCfg, testDims)) };
const demoDataWithTenure: CxmData = { ...demoData, cust: demoData.cust.map((c) => projectCustomer(c, testCfg, testDims)) };

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

  /* Không có item nào trong seed.qt có show='tier' nên tự dựng item, đúng hướng dẫn khi seed thiếu.
     (Đổi từ 'seg' sang 'tier' — S2, 04/08: `seg` đã rút khỏi `dims`, không còn chiều để suy cách
     đếm; `tier` vẫn là chiều `base:'cust'`/`values` thật, cùng phép kiểm nguyên bản.) */
  it("tier (cust, base=cust) — đếm đúng số khách theo value tier trong seed.cust (7 khách)", () => {
    const item: QuantifyShow = { id: "test-tier", kind: "show", show: "tier", metric: "count", chart: "rank", name: "test" };
    const rows = qRun(item, seed, dims);
    // Đếm tay trên seed.cust (7 dòng): 'new' x3, 'standard' x3, 'high-value' x1
    expect(rows).toEqual([
      { id: "new", l: "new", v: 3 },
      { id: "standard", l: "standard", v: 3 },
      { id: "high-value", l: "high-value", v: 1 },
    ]);
    expect(rows.reduce((a, r) => a + r.v, 0)).toBe(seed.cust.length);
  });

  it("chiều không tồn tại trong dims → rows rỗng, không throw", () => {
    const item: QuantifyShow = { id: "test-bad", kind: "show", show: "khong-ton-tai", metric: "count", chart: "rank", name: "test" };
    expect(() => qRun(item, seed, dims)).not.toThrow();
    expect(qRun(item, seed, dims)).toEqual([]);
  });

  /* Chặn bẫy `if (!build) return []` của qRun: một chiều khai trong `dims` mà không có cách đếm thì
     qRun trả rỗng IM LẶNG — không throw, không log. Sau đợt 2a điều kiện đó KHÔNG còn là "hai bảng
     khớp 1-1": cách đếm của chiều khách SINH ra từ khai báo, nên phép kiểm đúng là "mọi chiều trong
     dims đều dựng được cách đếm", tức tính luôn cả chiều owner thêm sau này. So hai tập id như bản
     cũ sẽ đỏ oan ngay khi bảng cách đếm cố tình không còn chứa trục khách.

     THU HẸP PHẠM VI (đợt sigCounts — KHÔNG phải nới lỏng kỳ vọng): xuất hiện một LOẠI chiều mới,
     `base:'fire'`, có cách đếm THẬT nhưng đi qua đường riêng (`data.sigCounts` / projectSignalCounts,
     xem rowBuilder trong domain/quantify.ts) — không qua `rowBuilder`/`qRun` chung, nên tiền đề "thiếu
     ở đây = biểu đồ rỗng im lặng" không áp dụng cho loại chiều đó nữa. Loại trừ THEO `base`, KHÔNG
     hardcode id 'sigpf' — hardcode id sẽ tạo bản sao thứ hai của "chiều nào đếm bằng đường riêng",
     đúng lỗi mà comment `custAxisUnsupported` (quantify.ts) đã né. Mọi chiều KHÁC — kể cả chiều
     khách nào thêm sau này — vẫn phải bị bắt nếu thiếu cách đếm; đã xác nhận bằng thực nghiệm: xoá
     tạm một case xử lý chiều base:'cust' bất kỳ trong custField làm test này đỏ lại. */
  it("mọi chiều khai trong dims đều dựng được cách đếm — thiếu là biểu đồ rỗng im lặng", () => {
    const thieu = Object.keys(dims)
      .filter((id) => dims[id]?.base !== "fire")
      .filter((id) => rowBuilder(dims, id, demoData) === undefined);
    expect(thieu).toEqual([]);
  });
});

/* q16 (Theme × Nền tảng) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — năng lực `qRunCross` GIỮ
   NGUYÊN, chỉ không còn saved query nào trỏ vào. Tự dựng item tại đây (đúng hình dạng q16 cũ) thay
   vì đọc từ seed, giữ nguyên MỌI phép khẳng định số liệu. */
const q16Cross: QuantifyShow = {
  id: "q16", kind: "show", show: "theme", by: "pf", metric: "count", view: "table", chart: "rank",
  name: "Theme × Nền tảng (ghép chéo)",
};

describe("qRunCross", () => {
  it("q16 (theme × pf) — matrix khớp seed.ev thật", () => {
    const cx = qRunCross(q16Cross, seed, dims);
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

  /* Đổi từ 'seg' sang 'tier' (S2, 04/08): `seg` đã rút khỏi `dims`, không còn chiều `base:'cust'`
     để canh nhánh "thiếu evAttr" — `tier` vẫn khai `base:'cust'` không evAttr, cùng phép kiểm. */
  it("defensive: chiều thiếu evAttr (tier) → matrix rỗng, không throw", () => {
    const item: QuantifyShow = { id: "test-defensive", kind: "show", show: "tier", by: "pf", metric: "count", chart: "rank", name: "test" };
    expect(() => qRunCross(item, seed, dims)).not.toThrow();
    const cx = qRunCross(item, seed, dims);
    expect(cx.rows).toEqual([]);
    expect(cx.cols).toEqual([]);
    expect(cx.cell).toEqual({});
    expect(cx.matched).toBe(0);
    expect(cx.grand).toBe(0);
    expect(cx.multi).toBe(false);
    expect(cx.sampleN).toBe(seed.ev.length);
    // tier là trục khách (base:'cust') — matrix rỗng ở trên là "không ghép được", KHÔNG PHẢI "ghép
    // được nhưng không match" — hai trường hợp trước đây không phân biệt được (bẫy CROSS_EXTRACT).
    expect(cx.unsupported).not.toBeNull();
    expect(cx.unsupported).toMatch(/tier/);
  });

  /* Bỏ 'tenure' khỏi danh sách (S2): chiều đã rút khỏi `dims`, không còn là "trục khách bị chặn
     ghép chéo" mà là "chiều không tồn tại" — một ca KHÁC, đã có test riêng ở nhóm `qRun` phía trên. */
  it("trục khách MỚI (age/nav/acq) cũng bị chặn ghép chéo như tier — không nhân bẫy cũ", () => {
    for (const show of ["age", "nav", "acq"] as const) {
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

  /* tenure đã rút khỏi `dims` (S2) — dùng dim test-local (xem đầu file) để vẫn chạm nhánh sentinel
     thật của seed (4/7 khách 'chưa-biết' trên tenureMonths). */
  it("tenure (test-local) — known=3 unknown=4", () => {
    const item: QuantifyShow = { id: "test-seg-tenure", kind: "show", show: TENURE_TEST_ID, metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, seedWithTenure, testDims);
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

  /* Bốn trục khách hiện có + `tenure` test-local (S2: 'seg' đã rút hẳn, không còn thay được bằng
     dim nào tương đương — bất biến này vẫn cần giữ độ phủ trên chính chiều có sentinel thật). */
  it("known+unknown+missing luôn bằng data.cust.length trên các trục khách hiện có — mẫu số không bao giờ mất khách", () => {
    for (const show of ["tier", "age", "nav", "acq", TENURE_TEST_ID] as const) {
      const item: QuantifyShow = { id: `test-seg-total-${show}`, kind: "show", show, metric: "count", chart: "rank", name: "test" };
      const res = qRunSegment(item, seedWithTenure, testDims);
      if (res.kind !== "draw") throw new Error(`kỳ vọng draw cho ${show}`);
      expect(res.known + res.unknown + res.missing).toBe(seedWithTenure.cust.length);
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
       nav SANG tenure (04/08): nav không còn sentinel nên known=0 không thể xảy ra trên nav nữa.
       tenure đã rút khỏi `dims` (S2) — dùng dim test-local (xem đầu file). */
    const miniData: CxmData = { ...seedWithTenure, cust: seedWithTenure.cust.filter((c) => c.bands[TENURE_TEST_ID] === "chưa-biết") };
    const item: QuantifyShow = { id: "test-seg-zero", kind: "show", show: TENURE_TEST_ID, metric: "count", chart: "rank", name: "test" };
    const res = qRunSegment(item, miniData, testDims);
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
    /* Cặp thứ tư ĐỔI TỪ ["tenure","seg"] (S2: cả hai đã rút khỏi `dims`) sang [tenure test-local, "acq"]
       — vẫn một tổ hợp trục KHÁC ba cặp trên, và `testDims`/`demoDataWithTenure` là superset an toàn
       (mọi trục cũ tính ra y nguyên, xem đầu file) nên dùng chung cho cả bốn cặp không đổi kỳ vọng. */
    for (const [show, split] of [["acq", "nav"], ["nav", "age"], ["age", "tier"], [TENURE_TEST_ID, "acq"]] as const) {
      const item: QuantifyShow = { id: `t-inv-${show}`, kind: "show", name: "t", show, split, metric: "count", chart: "rank" };
      const seg = qRunSegment(item, demoDataWithTenure, testDims);
      const sp = qRunSplit(item, demoDataWithTenure, testDims);
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
    const hand = (nav: string) => demoData.cust.filter((c) => c.acq === "banner" && c.bands.nav === nav).length;
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
    expect(unknownSegs).toBe(unknownAcq.filter((c) => c.bands.age !== "chưa-biết" && c.bands.age !== "thiếu").length);
  });

  /* "Khác" KHÔNG tới được bằng data thật ở section 1: mọi union trục khách có tối đa 5 thành viên
     (NavBand/AcqChannel=5, AgeBand/TenureBand=4, seg/tier=3) < SPLIT_TOP_N=6. Nhánh này là lưới an
     toàn cho section 2 (theme/keyword có hàng chục giá trị) và cho data thật nhiều band hơn — cùng
     kiểu với guard `unsupported` của CrossTable. Phải cast mới dựng được 8 giá trị nav. */
  it("Other: >6 giá trị → gộp đúng phần dư vào MỘT đoạn 'Khác (N ...)', không rơi mất khách nào", () => {
    const base = demoData.cust[0];
    // v1 xuất hiện 8 lần, v2 7 lần, … v8 1 lần ⇒ top6 = v1..v6, dồn v7(2)+v8(1) = 3 vào "Khác".
    const cust = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"].flatMap((v, i) =>
      Array.from({ length: 8 - i }, (_, j) => ({ ...base, key: `KH•••X${i}${j}`, acq: "banner", bands: { ...base.bands, nav: v } }) as Customer),
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
    // tenure đã rút khỏi `dims` (S2) — dùng dim test-local (xem đầu file).
    const miniData: CxmData = { ...seedWithTenure, cust: seedWithTenure.cust.filter((c) => c.bands[TENURE_TEST_ID] === "chưa-biết") };
    expect(qRunSplit({ ...acqByNav, show: TENURE_TEST_ID, split: "acq" }, miniData, testDims).kind).toBe("refuse");
  });
});

/* ---------- qRunSplit trên trục BẰNG CHỨNG (owner chốt 05/08: "làm cả 3 đi") ----------
   Mở được vì `Evidence.ck` là trường BẮT BUỘC — mỗi dòng bằng chứng mang sẵn khoá khách, nên nối
   sang `Customer` rồi đếm là phép đếm THẬT. Phép đo mở khoá quyết định này, trên demoData 05/08:
   1.641 dòng bằng chứng · 1.501 nối được (91,5%) · 133 ẩn danh (8,1%) · 7 nối hỏng (0,4%).

   Lý do chặn cũ ghi ở quantify.ts ("trục ev không có khoá khách") SAI, và bản trước đó chặn bằng một
   phép đo đã hết hạn (17 dòng / 7 khoá khớp, đo 03/08 khi bằng chứng chưa được sinh thêm). */
const EV_AXES = ["cat", "sen", "pf"] as const;

describe("qRunSplit — trục hàng base:'ev'", () => {
  const showOn = (axis: string, split: string): QuantifyShow => ({
    id: `t-${axis}`, kind: "show", show: axis, split, metric: "count", chart: "rank",
    name: `test ${axis} × ${split}`,
  });

  /* BÀI KIỂM CHÍNH — canh đúng chỗ hở mà việc mở nhánh này tạo ra. `EV_ROW_KEY` (cách suy hàng từ một
     dòng bằng chứng) nay được DÙNG CHUNG bởi rows() và bởi chia màu. Nếu ai đó tách nó thành hai bảng
     rồi để lệch, đoạn màu sẽ mô tả một tổng khác với chiều dài thanh — nhìn hình KHÔNG phát hiện
     được, chỉ test này bắt. Đối chiếu qua qRun, một đường tính hoàn toàn khác. */
  it.each(EV_AXES)("Σ đoạn màu của MỌI hàng = v của chính hàng đó do qRun trả (trục %s)", (axis) => {
    const item = showOn(axis, "nav");
    const rows = qRun(item, demoData, dims);
    const sp = qRunSplit(item, demoData, dims);
    expect(sp.kind).toBe("draw");
    if (sp.kind !== "draw") throw new Error("unreachable");

    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const sum = (sp.byRow[r.id] ?? []).reduce((a, s) => a + s.n, 0);
      // So chuỗi kèm id để lúc đỏ biết ngay HÀNG NÀO lệch, không phải chỉ "2 !== 3".
      expect(`${r.id}=${sum}`).toBe(`${r.id}=${r.v}`);
    }
  });

  it("mọi hàng dùng CHUNG một bộ nhãn/màu — không thì 'màu thứ ba' của hai hàng là hai thứ khác nhau", () => {
    const sp = qRunSplit(showOn("pf", "nav"), demoData, dims);
    if (sp.kind !== "draw") throw new Error("phải draw");
    const legendLabels = sp.legend.map((l) => l.label);
    for (const segs of Object.values(sp.byRow)) {
      // Đoạn n=0 bị bỏ, nên mỗi hàng là TẬP CON của legend và giữ ĐÚNG thứ tự legend.
      const idx = segs.map((s) => legendLabels.indexOf(s.label));
      expect(idx.every((i) => i >= 0)).toBe(true);
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    }
  });

  /* Ba nghĩa "không nối được sang khách" VẼ chung một khối (owner chốt 05/08 — ba sắc xám cạnh nhau
     đọc gần như một màu) nhưng SỐ thì không được gộp: 8,1% ẩn danh là đúng thiết kế, 0,4% nối hỏng là
     defect, người sửa pipeline cần đúng hai số đó tách nhau. Cộng dồn qua mọi hàng của một trục ev =
     tổng toàn cục, nên hai số dưới đối chiếu thẳng với phép đo 05/08, KHÔNG đi qua bộ đếm nội bộ.
     Đây là test chặn "gộp cho gọn": ai cộng ba giỏ lại thành một số thì nó đỏ. */
  it("'Ẩn danh' và 'Chưa đối chiếu được' là hai SỐ TÁCH RIÊNG trong khối gộp, khớp phép đo demoData", () => {
    const sp = qRunSplit(showOn("pf", "nav"), demoData, dims);
    if (sp.kind !== "draw") throw new Error("phải draw");
    const totalOf = (label: string) =>
      Object.values(sp.byRow).reduce(
        (a, segs) => a + segs.reduce((b, s) => b + (s.parts?.find((p) => p.label === label)?.n ?? 0), 0),
        0,
      );

    expect(totalOf("Ẩn danh")).toBe(133);
    expect(totalOf("Chưa đối chiếu được")).toBe(7);
    // Trên MÀN chỉ còn một nhãn xám — đúng điều owner chốt; legend không được lòi ba nhãn cũ ra.
    expect(sp.legend.filter((l) => l.label === NOCUST_LABEL)).toHaveLength(1);
    expect(sp.legend.some((l) => l.label === "Ẩn danh" || l.label === "Chưa đối chiếu được")).toBe(false);
    // Mỗi khối gộp mang ĐÚNG tổng các phần của nó — không số nào rơi ra ngoài lúc gộp.
    for (const segs of Object.values(sp.byRow)) {
      for (const s of segs.filter((x) => x.parts)) {
        expect(s.parts!.reduce((a, p) => a + p.n, 0)).toBe(s.n);
      }
    }
  });

  it("refuse: trục chia màu phải là thuộc tính khách (ev × ev không mở)", () => {
    const res = qRunSplit(showOn("pf", "cat"), demoData, dims);
    expect(res.kind).toBe("refuse");
    if (res.kind !== "refuse") throw new Error("unreachable");
    expect(res.reason).toMatch(/cat/);
  });
});

/* Trục TỔNG HỢP vẫn khoá — nhưng lý do phải là lý do THẬT. Đây là điều owner chốt ở mục 2: màn phải
   nói ra "số trên thanh là tổng hợp sẵn, không đếm từ bằng chứng", KHÔNG được nói "thiếu khoá khách"
   (chẩn đoán sai đã sửa 05/08) và cũng không được ẩn im lặng. Tầng vẽ in NGUYÊN VĂN chuỗi này, nên
   chính chuỗi này là deliverable chứ không phải một chi tiết nội bộ. */
describe("qRunSplit — trục hàng base:'agg' khoá kèm LÝ DO ĐÚNG", () => {
  it.each(["theme", "l1", "src"])("trục %s: từ chối vì số tổng hợp sẵn, KHÔNG vì thiếu khoá khách", (axis) => {
    const res = qRunSplit(
      { id: "t", kind: "show", show: axis, split: "nav", metric: "count", chart: "rank", name: "t" },
      demoData,
      dims,
    );
    expect(res.kind).toBe("refuse");
    if (res.kind !== "refuse") throw new Error("unreachable");
    expect(res.reason).toMatch(/TỔNG HỢP SẴN/);
    expect(res.reason).toMatch(/không đếm từ bằng chứng/);
    expect(res.reason).not.toMatch(/khoá khách/);
  });
});

/* qRunDrill — bản ghi thật dưới một hàng. Bài kiểm CHÍNH ở đây không phải "có trả về dòng nào không"
   mà là `kind` có nói đúng QUAN HỆ với con số trên thanh hay không: 'sample' (số tổng hợp sẵn, lệch
   hàng chục lần) vs 'full' (số chính là số bản ghi). Lẫn hai cái là dựng một panel nói dối. */
/* q19 (Kênh mở TK × Phân khúc NAV) đã bỏ khỏi seed.qt (S4, owner chốt 04/08) — tự dựng item tại
   đây (đúng hình dạng q19 cũ) thay vì đọc từ seed, giữ nguyên MỌI phép khẳng định số liệu. */
const q19Split: QuantifyShow = {
  id: "q19", kind: "show", show: "acq", split: "nav", metric: "count", chart: "rank",
  name: "Kênh mở TK × Phân khúc NAV",
};

describe("qRunDrill", () => {
  const q1 = findShow("q1");
  const acq = q19Split;

  /* BA ca dưới đây chạy trên `seed`, KHÔNG phải `demoData` (đổi 04/08, Module F section 1). Cả ba số
     đã ghim (412/8/17, 210/0, 9) vốn LÀ sự thật của seed.ev — trước F2 thì `demoData.ev === seed.ev`
     nên dùng demoData chỉ là tình cờ, không phải chủ đích. F2 sinh thêm bằng chứng vào demoData để
     chart chia chiều có số đáng xem, và ca "hàng không có bằng chứng nào" thì KHÔNG CÒN tồn tại trên
     demoData nữa — nhánh code đó vẫn còn nên phải giữ độ phủ, và seed là chỗ nó còn thật.
     Ca thứ tư là ca MỚI, chạy trên demoData, cho trạng thái SAU F2. */
  it("trục agg (theme): kind='sample' — total là số TỔNG HỢP, lines chỉ là tập mẫu, lệch ~50 lần", () => {
    const res = qRunDrill(q1, seed, dims, "x-th-device");
    expect(res.kind).toBe("sample");
    if (res.kind !== "sample") throw new Error("unreachable");
    // Oracle: TaxNode 'x-th-device'.n = 412; seed.ev có đúng 8 bản ghi mang theme này; pool = 17.
    expect(res.total).toBe(412);
    expect(res.lines).toHaveLength(8);
    expect(res.poolN).toBe(17);
    // Nguồn in TÊN, không in id — 'src-ekyc' → 'eKYC SDK'.
    expect(res.lines[0].meta).toContain("eKYC SDK");
    expect(res.lines[0].meta).not.toContain("src-ekyc");
  });

  it("trục agg, hàng KHÔNG có bằng chứng nào: vẫn kind='sample' với total thật, lines rỗng", () => {
    /* 10/14 theme trong seed rơi vào ca này (17 bản ghi cho 14 theme). Phải trả total=210 chứ
       KHÔNG phải 'none': hàng đó có số thật trên thanh, chỉ là chưa có bằng chứng mẫu gắn vào — hai
       chuyện khác nhau và panel nói hai câu khác nhau. */
    const res = qRunDrill(q1, seed, dims, "x-th-wait");
    expect(res.kind).toBe("sample");
    if (res.kind !== "sample") throw new Error("unreachable");
    expect(res.total).toBe(210);
    expect(res.lines).toHaveLength(0);
  });

  it("trục ev (cat): kind='full' — total === số dòng, vì số trên thanh CHÍNH LÀ số bản ghi đếm được", () => {
    const res = qRunDrill({ ...q1, show: "cat" }, seed, dims, "complaint");
    expect(res.kind).toBe("full");
    if (res.kind !== "full") throw new Error("unreachable");
    expect(res.total).toBe(9);
    expect(res.lines).toHaveLength(res.total);
  });

  /* Sau F2: mọi theme trong demoData đều có bằng chứng, nên `kind` VẪN phải là 'sample' — số trên
     thanh là `TaxNode.n` (tổng hợp), KHÔNG phải số bằng chứng đếm được, dù giờ đã có hàng chục bằng
     chứng. Ca này chặn đúng cái bẫy F2 mở ra: có nhiều bằng chứng rồi rất dễ tưởng con số trên thanh
     đã thành số đếm được và đổi kind thành 'full' — lúc đó panel nói dối về quan hệ giữa hai số. */
  it("trục agg (theme) trên demoData sau F2: có nhiều bằng chứng nhưng kind VẪN 'sample'", () => {
    const res = qRunDrill(q1, demoData, dims, "x-th-wait");
    expect(res.kind).toBe("sample");
    if (res.kind !== "sample") throw new Error("unreachable");
    expect(res.total).toBe(210);
    expect(res.lines.length).toBeGreaterThan(0);
    expect(res.poolN).toBeGreaterThan(res.lines.length);
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

  /* Hai thuộc tính in kèm mỗi dòng phải TẤT ĐỊNH và không đổi theo thứ tự khai chiều. `seg` đã rút
     khỏi `dims` (S2) nên không còn drill được theo nó — đổi sang `nav` (trục vẫn tồn tại) để canh
     ĐÚNG hệ quả owner đã chấp nhận: drill theo `nav` trước đây in "Segment khách · Value tier", sau
     đợt này in "Value tier · Kênh mở TK" (META_PRIORITY bỏ `seg`, xem domain/quantify.ts). */
  it("meta của dòng drill giữ THỨ TỰ ƯU TIÊN (tier > nav > acq), seg đã rút khỏi ưu tiên (S2)", () => {
    const nav: QuantifyShow = { ...acq, show: "nav" };
    const res = qRunDrill(nav, demoData, dims, demoData.cust[0].bands.nav as string);
    expect(res.kind).toBe("full");
    if (res.kind !== "full") throw new Error("unreachable");
    expect(res.lines[0].meta).toContain("Value tier");
    expect(res.lines[0].meta).toContain("Kênh mở TK");
    expect(res.lines[0].meta).not.toContain("Độ tuổi");
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
