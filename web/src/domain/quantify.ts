import type {
  CxmData,
  Customer,
  Dim,
  DimRow,
  Evidence,
  QuantifyShow,
  TaxLv,
  TaxNode,
} from "../data/schema/index.ts";
import { isSegUnknown, MISSING, UNKNOWN_YET } from "../data/segment.ts";

/* Quantify ENGINE — port 1-1 từ prototype (output/cxm-platform-prototype.html): DIMS (~dòng 1425),
   qRun() (~dòng 1477), evTaxLv() (~dòng 1420), qRunCross() (~dòng 1931). Không side-effect, không
   đọc DOM/global: mọi hàm nhận data + dims làm tham số.

   KHÁC BIỆT với prototype: ở đó DIMS[id].rows() là một lambda tính trực tiếp trên biến toàn cục
   DATA. Trong bản thật, `dims` (data/fixtures/seed.ts) chỉ còn là METADATA tĩnh
   ({label, unit, base, evAttr}) — rows KHÔNG dùng để tính (luôn rỗng). Engine ở đây tự tính lại
   toàn bộ rows từ (data, dims) mỗi lần gọi, đúng cách prototype tính lại từ DATA mỗi lần render. */

/* ---------- Nhãn/màu tĩnh không còn field riêng trong CxmData ----------
   Category GIỜ CÓ bảng data.cats (seed.ts) — đây là NGUỒN SỰ THẬT DUY NHẤT cho nhãn + màu
   category, đọc trực tiếp trong catRows()/themeRows() bên dưới thay vì các hằng số nhãn/màu
   hardcode riêng trước đây (S2.7, D5a: hai nguồn cho cùng một thứ màu chắc chắn trôi lệch —
   hằng màu cũ vay `--crit/--watch/--good` làm cats trông như trạng thái sức khỏe). CAT_ORDER vẫn
   giữ ở đây vì đó là THỨ TỰ hiển thị (không phải nhãn/màu), port từ hằng số `cats` (~dòng 829)
   của prototype — quyết định thứ tự trước khi sort, khớp thứ tự khai báo gốc để tie giữa các
   category cùng volume port đúng hành vi (Array.prototype.sort ổn định từ ES2019). */
const CAT_ORDER = ["complaint", "help", "improvement", "praise"] as const;

const SEN_ORDER = ["pos", "neu", "neg"] as const;
const SEN_LABEL: Record<string, string> = { pos: "Tích cực", neu: "Trung tính", neg: "Tiêu cực" };
const SEN_COLOR: Record<string, string> = { pos: "var(--good)", neu: "var(--ink3)", neg: "var(--crit)" };

/* Port từ SEN_BUCKET() (~dòng 1413). */
function senBucket(v: number): "pos" | "neu" | "neg" {
  return v > 0.2 ? "pos" : v < -0.2 ? "neg" : "neu";
}

const PF_ORDER = ["ios", "android", "web", "server"] as const;
const PF_LABEL: Record<string, string> = { ios: "iOS", android: "Android", web: "Web", server: "Server" };

/* ---------- rows() từng chiều — port 1-1 từ DIMS[*].rows() (~dòng 1426-1454) ----------
   `agg`: lọc data.tax theo lv (l1/l2/l3/theme/sub) hoặc đọc data.sources (src).
   `ev`:  nhóm data.ev theo thuộc tính (cat/sen/pf).
   `cust`: nhóm data.cust theo thuộc tính (seg/tier). */
function byTaxLv(data: CxmData, lv: TaxLv): DimRow[] {
  return data.tax.filter((t) => t.lv === lv).map((t) => ({ id: t.id, l: t.name, v: t.n }));
}

/* Theme tô màu theo `cat` (intent) của CHÍNH node — S2.7/D5a: trước đây hardcode `var(--good)`
   riêng cho node "Trải nghiệm nhanh và mượt" (hằng PRAISE_THEME_ID, nay đã xoá vì mồ côi), khiến
   13/14 hàng của q1 có `c: undefined` (xám hết) và đúng 1 hàng có màu. CỐ Ý KHÔNG tô theo thứ
   hạng: thứ hạng đã được mã hoá bằng ĐỘ DÀI THANH rồi — tô màu theo thứ hạng nữa là màu trang
   trí, không mang thêm thông tin. Màu phải mã hoá intent, thứ mà độ dài thanh không nói. Node
   không có `cat` (hiếm, taxonomy L1-L3 không phải theme) giữ `c: undefined` như cũ. */
function themeRows(data: CxmData): DimRow[] {
  return data.tax
    .filter((t) => t.lv === "theme")
    .map((t) => ({ id: t.id, l: t.name, v: t.n, c: t.cat ? data.cats[t.cat]?.color : undefined }));
}

/* VOC_SCOPE cố định 'all' trong bản redesign bỏ kỳ global (prototype dòng ~1407) nên mọi nguồn đều
   tính, không cần tham số scope. Bỏ màu theo sourceHealth() của prototype (DIMS.src.rows(), dòng
   1439) vì hàm đó cần Cfg — qRun ở đây không nhận Cfg (xem ghi chú cuối file). */
function srcRows(data: CxmData): DimRow[] {
  return data.sources.map((s) => ({ id: s.id, l: s.name, v: s.vol }));
}

function catRows(data: CxmData): DimRow[] {
  return CAT_ORDER.map((id) => ({
    id,
    l: data.cats[id]?.label ?? id,
    c: data.cats[id]?.color,
    v: data.ev.filter((e) => e.cat === id).length,
  }));
}

function senRows(data: CxmData): DimRow[] {
  return SEN_ORDER.map((id) => ({
    id,
    l: SEN_LABEL[id],
    c: SEN_COLOR[id],
    v: data.ev.filter((e) => senBucket(e.sen) === id).length,
  }));
}

function pfRows(data: CxmData): DimRow[] {
  return PF_ORDER.map((id) => ({ id, l: PF_LABEL[id], v: data.ev.filter((e) => e.pf === id).length }));
}

/* Port từ [...new Set(DATA.cust.map(...))] (~dòng 1449-1453): Map bảo toàn insertion order giống
   hệt Set nên thứ tự nhóm xuất hiện lần đầu được giữ nguyên trước khi sort. */
function byCustGroup(data: CxmData, getter: (c: Customer) => string): DimRow[] {
  const counts = new Map<string, number>();
  for (const c of data.cust) {
    const key = getter(c);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, v]) => ({ id, l: id, v }));
}

type RowBuilder = (data: CxmData) => DimRow[];

/* Getter theo field khách cho MỌI trục base:'cust' — dùng CHUNG giữa ROW_BUILDERS (đếm gộp cả
   sentinel, giữ nguyên hành vi qRun cũ) và qRunSegment (tách sentinel ra riêng qua isSegUnknown,
   xem bên dưới). Một nguồn getter duy nhất để hai chỗ không lệch nhau nếu sau này thêm trục khách
   mới — đúng bài học D5a đã dẫn tới việc gom `mdir`/sentinel về một chỗ. */
const CUST_FIELD: Record<string, (c: Customer) => string> = {
  seg: (c) => c.seg,
  tier: (c) => c.tier,
  age: (c) => c.age,
  nav: (c) => c.nav,
  tenure: (c) => c.tenure,
  acq: (c) => c.acq,
};

/* export CHỈ để test đối chiếu 1-1 với `dims` (bẫy quantify.ts: thiếu một bên khiến qRun trả rỗng
   im lặng, xem qRun bên dưới) — bản thân module không có consumer ngoài nào cần import trực tiếp. */
export const ROW_BUILDERS: Record<string, RowBuilder> = {
  l1: (data) => byTaxLv(data, "L1"),
  l2: (data) => byTaxLv(data, "L2"),
  l3: (data) => byTaxLv(data, "L3"),
  theme: themeRows,
  sub: (data) => byTaxLv(data, "subtheme"),
  src: srcRows,
  cat: catRows,
  sen: senRows,
  pf: pfRows,
  seg: (data) => byCustGroup(data, CUST_FIELD.seg),
  tier: (data) => byCustGroup(data, CUST_FIELD.tier),
  age: (data) => byCustGroup(data, CUST_FIELD.age),
  nav: (data) => byCustGroup(data, CUST_FIELD.nav),
  tenure: (data) => byCustGroup(data, CUST_FIELD.tenure),
  acq: (data) => byCustGroup(data, CUST_FIELD.acq),
};

/* Chạy một item `show`: trả rows đã xếp giảm dần theo v. Port từ qRun() (~dòng 1477) — RÚT GỌN so
   với bản gốc: chỉ trả DimRow[], không kèm total/shown/axis (những field đó là mối quan tâm của
   tầng hiển thị/chart ở section sau, tính lại được từ chính rows này). `item.metric` KHÔNG đổi giá
   trị trả về — đúng như prototype, nơi metric:'pct' chỉ đổi NHÃN trục còn rows() luôn trả count
   thô; % được tính ở tầng hiển thị (pv(v, tổng)). fx() cũng KHÔNG áp trong rows() ở prototype (chỉ
   áp lúc format hiển thị qua METRICS.count.fmt) nên engine ở đây cũng trả count thô, chưa scale. */
export function qRun(item: QuantifyShow, data: CxmData, dims: Record<string, Dim>): DimRow[] {
  if (!dims[item.show]) return [];
  const build = ROW_BUILDERS[item.show];
  if (!build) return [];
  return build(data).sort((a, b) => b.v - a.v);
}

/* ---------- SEGMENT COVERAGE: coverage-aware cho 4 trục phân khúc khách mới ----------
   Khác `qRun` ở đúng điểm mà `qRun`/byCustGroup KHÔNG được đổi (nhiều nơi đang gọi qRun, xem chú
   thích trên): `qRun` gộp cả sentinel vào rows như mọi band khác (hành vi cũ, giữ nguyên). Hàm này
   là đường THỨ HAI, riêng cho các chart hỏi khách có biết trục này không — tách hai loại sentinel
   (UNKNOWN_YET, MISSING — xem data/segment.ts) ra khỏi rows nhưng CỘNG chúng vào coverage
   (known/unknown/missing luôn cộng đúng bằng data.cust.length) để mẫu số không bao giờ ngầm loại
   bỏ nhóm chưa biết (survivorship bias — xem data/segment.ts). */
export type SegChart =
  | { kind: "refuse"; reason: string }
  | { kind: "draw"; rows: DimRow[]; known: number; unknown: number; missing: number };

export function qRunSegment(
  item: QuantifyShow,
  data: CxmData,
  dims: Record<string, Dim>,
): SegChart {
  const dim = dims[item.show];
  /* Suy trục-khách từ `base`, KHÔNG hardcode danh sách id 'seg'/'tier'/'age'/... — hardcode là tạo
     bản sao thứ hai của "trục nào là trục khách" (đúng loại trùng lặp đã đẻ ra bug ở module trước:
     hai bản sao `mdir` lệch nhau, xem data/segment.ts dòng 16-21). */
  if (!dim || dim.base !== "cust") {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}" không phải trục phân khúc khách (base khác 'cust') nên không có khái niệm coverage phân khúc.`,
    };
  }
  const getter = CUST_FIELD[item.show];
  if (!getter) {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}" khai base:'cust' trong dims nhưng thiếu getter khách tương ứng (bug nội bộ — ROW_BUILDERS/CUST_FIELD lệch nhau).`,
    };
  }

  const counts = new Map<string, number>();
  let unknown = 0;
  let missing = 0;
  for (const c of data.cust) {
    const v = getter(c);
    /* Gọi isSegUnknown() làm cổng — KHÔNG tự so chuỗi sentinel bằng literal (xem data/segment.ts).
       isSegUnknown chỉ trả có/không phải sentinel, không nói RÕ loại nào; để tách riêng hai bộ đếm
       (bắt buộc theo spec — cách chữa của hai loại ngược nhau) phải so tiếp với chính hằng số
       UNKNOWN_YET/MISSING đã import từ data/segment.ts, không phải một bản sao literal mới. */
    if (isSegUnknown(v)) {
      if (v === UNKNOWN_YET) unknown += 1;
      else if (v === MISSING) missing += 1;
      continue;
    }
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  const known = [...counts.values()].reduce((a, n) => a + n, 0);
  if (known === 0) {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}": chưa khách nào tới chỗ biết được giá trị này (known=0/${data.cust.length}).`,
    };
  }

  const rows = [...counts.entries()]
    .map(([id, v]) => ({ id, l: id, v }))
    .sort((a, b) => b.v - a.v);
  return { kind: "draw", rows, known, unknown, missing };
}

/* ---------- CROSS-TAB: ghép 2 chiều, chỉ tính thật trên data.ev ---------- */

export type CrossAxisRow = { id: string; l: string; c?: string; tot: number };

export type QuantifyCrossResult = {
  rd: Dim | undefined;
  cd: Dim | undefined;
  rows: CrossAxisRow[];
  cols: CrossAxisRow[];
  cell: Record<string, Record<string, number>>;
  matched: number;
  sampleN: number;
  multi: boolean;
  grand: number;
  /* null ⇒ ghép chéo hợp lệ. Khác null ⇒ nêu rõ trục nào là thuộc tính khách (base:'cust') không
     nối được với evidence, để tầng vẽ KHÔNG hiển thị matrix rỗng như thể là kết quả thật — trước
     đây `rows`/`cols` rỗng cho cả hai trường hợp "ghép hợp lệ nhưng không match" LẪN "ghép không
     hợp lệ vì trục khách", không phân biệt được (bẫy CROSS_EXTRACT thiếu entry seg/tier/age/nav/
     tenure/acq, xem CROSS_EXTRACT bên dưới). */
  unsupported: string | null;
};

/* Suy "trục khách không ghép chéo được" từ `base`, KHÔNG hardcode danh sách id — cùng lý do đã nêu
   ở qRunSegment: hardcode là tạo bản sao thứ hai của "trục nào là trục khách". */
function custAxisUnsupported(dim: Dim | undefined, id: string): string | null {
  return dim?.base === "cust"
    ? `Trục "${id}" là thuộc tính khách (base:'cust'), không nối được với evidence nên không ghép chéo được.`
    : null;
}

/* Các node taxonomy cùng tầng mà MỘT ev mang qua e.tax[] — port từ evTaxLv() (~dòng 1420). Đa trị:
   một ev có thể mang nhiều node cùng tầng nên trả về MẢNG id (không giả định chỉ có 0 hoặc 1). */
function evTaxIds(data: CxmData, e: Evidence, lv: TaxLv): string[] {
  return e.tax
    .map((id) => data.tax.find((t) => t.id === id))
    .filter((t): t is TaxNode => t !== undefined && t.lv === lv)
    .map((t) => t.id);
}

type CrossExtractor = (data: CxmData, e: Evidence) => string[];

/* Trích giá trị chiều từ MỘT ev — chỉ những chiều có evAttr trong prototype (DIMS[*].evAttr, dòng
   1426-1448) mới ghép chéo được. src/seg/tier KHÔNG có entry ở đây, khớp evAttr=undefined của
   chúng trong dims (data/fixtures/seed.ts) → qRunCross defensive trả matrix rỗng cho các chiều đó
   thay vì bịa ra cách ghép không có căn cứ trong prototype. */
const CROSS_EXTRACT: Record<string, CrossExtractor> = {
  l1: (data, e) => evTaxIds(data, e, "L1"),
  l2: (data, e) => evTaxIds(data, e, "L2"),
  l3: (data, e) => evTaxIds(data, e, "L3"),
  theme: (data, e) => evTaxIds(data, e, "theme"),
  sub: (data, e) => evTaxIds(data, e, "subtheme"),
  cat: (_data, e) => [e.cat],
  sen: (_data, e) => [senBucket(e.sen)],
  pf: (_data, e) => [e.pf],
};

/* Ghép chéo 2 chiều, CHỈ tính thật trên data.ev — port từ qRunCross() (~dòng 1931). Cell = số ev
   thoả CẢ thuộc tính hàng LẪN cột; chiều đa trị (taxonomy) khiến một ev đếm vào nhiều hàng/cột nên
   tổng có thể > sampleN. `multi=true` nếu MỘT ev bất kỳ mang > 1 giá trị ở chiều hàng hoặc cột
   (kể cả những ev không match cả hai chiều — đúng hành vi prototype, xem dòng 1940).
   LƯU Ý chữ ký: nhận thêm tham số `dims` (khác bản rút gọn `(item, data)` nêu trong đề bài) vì cần
   dims[id] để trả rd/cd (Dim đầy đủ label/unit) — không thể tự suy ra chỉ từ item.show/item.by mà
   không trùng lặp metadata đã có sẵn trong fixtures/seed.ts. */
export function qRunCross(
  item: QuantifyShow,
  data: CxmData,
  dims: Record<string, Dim>,
): QuantifyCrossResult {
  const rd = dims[item.show];
  const cd = item.by ? dims[item.by] : undefined;
  const rowExtract = CROSS_EXTRACT[item.show];
  const colExtract = item.by ? CROSS_EXTRACT[item.by] : undefined;
  const rowBuild = ROW_BUILDERS[item.show];
  const colBuild = item.by ? ROW_BUILDERS[item.by] : undefined;

  const unsupported =
    custAxisUnsupported(rd, item.show) ?? (item.by ? custAxisUnsupported(cd, item.by) : null);

  const empty: QuantifyCrossResult = {
    rd,
    cd,
    rows: [],
    cols: [],
    cell: {},
    matched: 0,
    sampleN: data.ev.length,
    multi: false,
    grand: 0,
    unsupported,
  };
  if (!rowExtract || !colExtract || !rowBuild || !colBuild) return empty;

  const rowMeta = new Map<string, CrossAxisRow>();
  for (const r of rowBuild(data)) rowMeta.set(r.id, { id: r.id, l: r.l, c: r.c, tot: 0 });
  const colMeta = new Map<string, CrossAxisRow>();
  for (const col of colBuild(data)) colMeta.set(col.id, { id: col.id, l: col.l, c: col.c, tot: 0 });

  const cell: Record<string, Record<string, number>> = {};
  let matched = 0;
  let multi = false;
  let grand = 0;

  for (const e of data.ev) {
    const rs = rowExtract(data, e);
    const cs = colExtract(data, e);
    if (rs.length > 1 || cs.length > 1) multi = true;
    if (!rs.length || !cs.length) continue;
    let hit = false;
    for (const ri of rs) {
      const rm = rowMeta.get(ri);
      if (!rm) continue;
      for (const ci of cs) {
        const cm = colMeta.get(ci);
        if (!cm) continue;
        hit = true;
        if (!cell[ri]) cell[ri] = {};
        cell[ri][ci] = (cell[ri][ci] ?? 0) + 1;
        rm.tot += 1;
        cm.tot += 1;
        grand += 1;
      }
    }
    if (hit) matched += 1;
  }

  const rows = [...rowMeta.values()].filter((r) => r.tot > 0).sort((a, b) => b.tot - a.tot);
  const cols = [...colMeta.values()].filter((c) => c.tot > 0).sort((a, b) => b.tot - a.tot);
  return { rd, cd, rows, cols, cell, matched, sampleN: data.ev.length, multi, grand, unsupported };
}
