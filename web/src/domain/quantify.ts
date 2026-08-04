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
/* Palette phân loại phía domain — dùng CHUNG với themeSegments.ts (đã export ở đó 03/08) thay vì
   khai bản sao thứ ba; xem ghi chú layer tại themeSegments.ts:10-14. */
import { CAT_CYCLE } from "./themeSegments.ts";

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
/* export (F1, module-f-charter.md) để themeSegments.ts dùng lại CHUNG getter chiều khách thay vì
   khai bản sao thứ tư của cùng bảng — đúng loại trùng lặp mà ghi chú CAT_CYCLE ở themeSegments.ts
   đã cảnh báo (đã có 3 bản sao palette; đừng thêm bản sao thứ tư của CUST_FIELD). */
export const CUST_FIELD: Record<string, (c: Customer) => string> = {
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

/* ---------- BREAKDOWN: chia thanh thành đoạn màu theo chiều khách THỨ HAI ----------
   Tiêu chí 2 của owner ("data sẽ được chia thành các segment màu nhỏ trong bar như tuổi/nav"), theo
   mô hình chung của 4 nền tảng đã tham khảo: dataset · metric · chiều chính · CHIỀU CHIA MÀU · kiểu
   chart · stacking · top-N + "Other".

   MỌI SỐ Ở ĐÂY LÀ SỐ THẬT, ĐẾM TỪ DÒNG `data.cust` — không một hằng số tỷ lệ bịa nào (khác
   groupSegments() ở themeSegments.ts, nơi tỷ trọng sinh từ hạt char-code nên cắm data thật vào vẫn
   bịa). Điều kiện để làm được: CẢ trục hàng LẪN trục chia màu đều base:'cust', tức hai giá trị nằm
   trên CÙNG MỘT DÒNG khách ⇒ group-by hai chiều là phép đếm thuần. Trục agg/ev (theme/keyword) không
   có khoá khách trên `Evidence` nên KHÔNG đi qua đây (xem docs/REBUILD-STATUS.md, Module D section 2). */

/** Trần số nhãn có màu riêng; phần còn lại gộp một đoạn "Khác" (owner chốt 03/08: top 6 — khớp số
    thanh q17/q18 đang vẽ). Vượt trần là nhiều màu hơn mắt phân biệt được, không phải nhiều tin hơn. */
const SPLIT_TOP_N = 6;

const SPLIT_OTHER_ID = "__split_other__";
/* Id RIÊNG, KHÔNG dùng lại "__unknown__" của tầng hiển thị (QuantifyWidget ghim thanh đó cuối bằng
   đúng chuỗi ấy): một là id ĐOẠN trong thanh, một là id HÀNG — trùng chuỗi là mời nhầm về sau. */
const SPLIT_UNKNOWN_ID = "__split_unknown__";

export type SplitSegment = { id: string; label: string; n: number; c: string };

export type SplitChart =
  /** `item.split` vắng — chart không có breakdown. Không phải lỗi. */
  | { kind: "off" }
  /** Có `split` nhưng KHÔNG tính thật được — nêu lý do cho tầng vẽ in ra, đúng bài học `unsupported`
      của CrossTable: vẽ thanh một màu im lặng sẽ đọc thành "đã chia màu, và mọi khách cùng một nhóm". */
  | { kind: "refuse"; reason: string }
  | {
    kind: "draw";
    /** rowId (giá trị trục hàng, khớp `id` của rows do qRunSegment trả) → các đoạn, đã bỏ đoạn n=0.
        BẤT BIẾN: Σn của một hàng === `v` của hàng đó ở qRunSegment — mọi khách có giá trị trục hàng
        biết được rơi vào ĐÚNG MỘT bucket, nên đoạn màu không bao giờ mô tả một tổng khác. */
    byRow: Record<string, SplitSegment[]>;
    /** Thứ tự + màu dùng CHUNG cho mọi hàng (xếp hạng toàn cục) để so ngang giữa các hàng được. */
    legend: { label: string; color: string }[];
  };

export function qRunSplit(
  item: QuantifyShow,
  data: CxmData,
  dims: Record<string, Dim>,
): SplitChart {
  if (!item.split) return { kind: "off" };

  const rowDim = dims[item.show];
  const splitDim = dims[item.split];
  if (!splitDim) {
    return { kind: "refuse", reason: `Chiều chia màu "${item.split}" không tồn tại trong dims.` };
  }
  if (item.split === item.show) {
    return {
      kind: "refuse",
      reason: `Chia màu theo đúng chiều đang xếp hàng ("${item.show}") thì mỗi thanh chỉ có một đoạn — không thêm thông tin nào.`,
    };
  }
  /* Suy từ `base`, KHÔNG hardcode danh sách id — cùng lý do đã nêu ở qRunSegment/custAxisUnsupported. */
  if (rowDim?.base !== "cust" || splitDim.base !== "cust") {
    const culprit = rowDim?.base !== "cust" ? item.show : item.split;
    return {
      kind: "refuse",
      reason: `Chia màu chỉ tính thật được khi CẢ hai chiều là thuộc tính khách (base:'cust') — khi đó hai giá trị nằm trên cùng một dòng khách nên đếm được. Trục "${culprit}" không phải, nên không có đường tính nào mà không phải bịa tỷ lệ.`,
    };
  }
  const rowGetter = CUST_FIELD[item.show];
  const splitGetter = CUST_FIELD[item.split];
  if (!rowGetter || !splitGetter) {
    /* So `=== undefined` tường minh, KHÔNG dùng ternary trên chính hàm (`rowGetter ? … : …`): TS2774
       báo lỗi ở đó vì CUST_FIELD là Record<string, fn> nên phần tử được coi là luôn có. */
    const missingAxis = rowGetter === undefined ? item.show : item.split;
    return {
      kind: "refuse",
      reason: `Trục "${missingAxis}" khai base:'cust' nhưng thiếu getter khách (bug nội bộ — CUST_FIELD/dims lệch nhau).`,
    };
  }

  /* CHỈ khách có giá trị trục hàng BIẾT ĐƯỢC mới được chia màu. Thanh "Không xác định" của trục hàng
     cố ý giữ một màu đặc: chẻ nó ra là đi nói "ta biết gì về nhóm ta không biết". Chính bộ lọc này
     giữ bất biến Σđoạn === v của hàng, vì `v` của qRunSegment đếm đúng tập không-sentinel này. */
  const scoped = data.cust.filter((c) => !isSegUnknown(rowGetter(c)));
  if (scoped.length === 0) {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}": chưa khách nào tới chỗ biết được giá trị, nên không có thanh nào để chia màu.`,
    };
  }

  /* Xếp hạng giá trị split TOÀN CỤC (trên toàn bộ `scoped`), KHÔNG theo từng hàng — mọi hàng phải
     dùng cùng một bộ nhãn/màu, nếu không thì "màu thứ ba" của hàng A và hàng B là hai thứ khác nhau
     và chart mất khả năng so ngang. Hệ quả cần biết: một giá trị chỉ lớn ở hàng đang bị TOP_N của
     tầng hiển thị cắt bỏ vẫn có thể chiếm một suất màu. Tất định và giải thích được nên chấp nhận. */
  const totals = new Map<string, number>();
  let unkTotal = 0;
  for (const c of scoped) {
    const v = splitGetter(c);
    /* Sentinel của trục CHIA MÀU gộp thành MỘT đoạn "Không xác định" — ở đây KHÔNG tách
       chưa-biết/thiếu như qRunSegment, vì phân biệt đó là câu chuyện của trục chính (dòng "Phủ X%"
       dưới chart), còn trong một thanh nó thành hai đoạn xám sát nhau không đọc được. */
    if (isSegUnknown(v)) {
      unkTotal += 1;
      continue;
    }
    totals.set(v, (totals.get(v) ?? 0) + 1);
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const top = ranked.slice(0, SPLIT_TOP_N);
  const topSet = new Set(top);
  const collapsed = ranked.length - top.length;

  const order: { id: string; label: string; c: string }[] = [
    ...top.map((id, i) => ({ id, label: id, c: CAT_CYCLE[i % CAT_CYCLE.length] })),
    /* Nhãn "Khác" NÓI RÕ đang gộp bao nhiêu giá trị — "Khác" trần không cho biết nó che 2 nhóm hay 40. */
    ...(collapsed > 0
      ? [{ id: SPLIT_OTHER_ID, label: `Khác (${collapsed} ${splitDim.unit})`, c: "var(--ink3)" }]
      : []),
    /* Ghim CUỐI, màu `--unk` — CÙNG token với thanh "Không xác định" của trục hàng vì cùng một nghĩa
       "không đếm được", không phải thêm một nhóm nữa. */
    ...(unkTotal > 0 ? [{ id: SPLIT_UNKNOWN_ID, label: "Không xác định", c: "var(--unk)" }] : []),
  ];

  const bucketOf = (v: string): string =>
    isSegUnknown(v) ? SPLIT_UNKNOWN_ID : topSet.has(v) ? v : SPLIT_OTHER_ID;

  const counts = new Map<string, Map<string, number>>();
  for (const c of scoped) {
    const rid = rowGetter(c);
    const b = bucketOf(splitGetter(c));
    let m = counts.get(rid);
    if (!m) {
      m = new Map();
      counts.set(rid, m);
    }
    m.set(b, (m.get(b) ?? 0) + 1);
  }

  const byRow: Record<string, SplitSegment[]> = {};
  for (const [rid, m] of counts) {
    // Bỏ đoạn n=0: vẽ ra width 0 (không hover được) và tooltip "X: 0" không nói gì.
    byRow[rid] = order
      .filter((o) => (m.get(o.id) ?? 0) > 0)
      .map((o) => ({ id: o.id, label: o.label, n: m.get(o.id) ?? 0, c: o.c }));
  }

  return { kind: "draw", byRow, legend: order.map((o) => ({ label: o.label, color: o.c })) };
}

/* ---------- DRILL-DOWN: các BẢN GHI THẬT nằm dưới một hàng (owner chốt 03/08, phương án (a)) ------
   "Bấm một thanh → mở danh sách bằng chứng/verbatim đã lọc theo hàng đó" — vòng lặp của
   Enterpret/Chattermill. Hàm thuần trên (item, data, dims, rowId) nên sống ở đây, KHÔNG ở widget:
   `QuantifyWidget` ở tầng design-system, việc của nó là vẽ, không phải quyết định bản ghi nào thuộc
   hàng nào.

   ĐIỀU QUAN TRỌNG NHẤT hàm này phải nói được: danh sách trả về có phải TOÀN BỘ hàng đó hay chỉ là
   TẬP MẪU. Ba trục ba quan hệ khác nhau với con số trên thanh, và gộp chúng lại là dựng một màn nói
   dối:
   - trục agg (theme/keyword/nguồn): số trên thanh lấy từ `TaxNode.n`/`Source.vol` — TỔNG HỢP SẴN,
     không đếm từ `data.ev`. Đo trên demoData 03/08: theme "Thiết bị" ghi **412** mà tập mẫu chỉ có
     **8** bằng chứng; nguồn `src-ga` ghi **41.200** mà có **2**. Lệch ~50 lần ⇒ kind:'sample'.
   - trục ev (cat/sen/pf): số trên thanh CHÍNH LÀ số bản ghi đếm được ⇒ kind:'full', liệt kê đủ.
   - trục cust: bản ghi là KHÁCH, không phải verbatim ⇒ kind:'full' trên `data.cust`.

   Vì sao trục cust KHÔNG mở verbatim, dù `Evidence.ck` có khoá khách: đo 03/08 trên demoData —
   `data.ev` có 17 bản ghi / 15 khoá `ck` khác nhau cho 300 khách, và chỉ **7** khoá khớp một dòng
   `data.cust`. Đi qua join đó thì gần như mọi hàng trục khách mở ra RỖNG, trong khi danh sách khách
   là số thật và đếm đủ. Muốn verbatim cho trục khách thì phải YÊU CẦU DATA (mật độ evidence tương
   đương cohort + `ck` toàn vẹn) — xem docs/REBUILD-STATUS.md, danh sách "yêu cầu data". */

/** Id hàng "Không xác định" mà tầng hiển thị ghim cuối mọi chart trục khách. Khai Ở ĐÂY vì NGHĨA của
    nó (gộp hai sentinel `chưa-biết` + `thiếu`) là chuyện của domain; `QuantifyWidget` import về dùng
    thay cho literal viết tay — trước đổi này cùng chuỗi "__unknown__" nằm rải 3 chỗ trong một file,
    đúng kiểu trùng lặp mà chú thích SPLIT_UNKNOWN_ID ở trên đã cảnh báo. */
export const UNKNOWN_ROW_ID = "__unknown__";

/** Trần số dòng in ra. Một hàng trục khách có thể tới ~60 khách (demoData 300): in hết biến panel
    thành bảng dài không ai đọc, mà `total` đã nói đủ mẫu số. KHÔNG áp cho `data.ev` (17 bản ghi,
    không bao giờ chạm trần) nhưng vẫn để chung một đường cắt cho cả hai. */
const DRILL_MAX = 50;

export type DrillLine = { id: string; text: string; meta: string };

export type DrillResult =
  /** Hàng dựng từ số TỔNG HỢP SẴN ⇒ `lines` chỉ là tập mẫu. `total` = số trên thanh, `poolN` = cỡ
      toàn bộ tập mẫu (`data.ev.length`) — tầng hiển thị BẮT BUỘC nói ra cả hai, nếu không người xem
      đọc "8 bằng chứng" thành "hàng này có 8". */
  | { kind: "sample"; lines: DrillLine[]; total: number; poolN: number }
  /** Hàng đếm từ chính các bản ghi đang liệt kê ⇒ `total` là số thật; `lines` có thể bị DRILL_MAX cắt. */
  | { kind: "full"; lines: DrillLine[]; total: number }
  /** Hàng "Không xác định": tách LẠI hai loại sentinel mà chart đã gộp — đây là bài học D0 làm cho
      xem được, và là hàng đáng bấm nhất (nó trả lời "17 khách không xác định kia là ai"). */
  | { kind: "unknown"; lines: DrillLine[]; total: number; unknownYet: number; missing: number }
  | { kind: "none"; reason: string };

/* Trục có rows dựng từ số tổng hợp sẵn — xem chú thích khối ở trên. */
const AGG_TAX_AXES = new Set(["theme", "l1", "l2", "l3", "sub"]);

/* Thuộc tính khách in kèm mỗi dòng, theo THỨ TỰ ƯU TIÊN cố định; trục đang xếp hàng bị loại (in lại
   đúng giá trị vừa bấm là nhiễu), rồi lấy 2 cái đầu. Tất định, không phải chọn tuỳ hàng. */
const CUST_META_AXES = ["seg", "tier", "nav", "acq"] as const;

/* Một `rowId` thuộc bản ghi nào — mỗi trục một phép so, không có trục nào dùng chung được. Trả null
   cho trục chưa có đường tra (vd trục cust đi nhánh riêng ở trên, hoặc trục mới thêm mà quên nối). */
function evMatcher(show: string, rowId: string): ((e: Evidence) => boolean) | null {
  if (AGG_TAX_AXES.has(show)) return (e) => e.tax.includes(rowId);
  if (show === "src") return (e) => e.src === rowId;
  if (show === "cat") return (e) => e.cat === rowId;
  if (show === "sen") return (e) => senBucket(e.sen) === rowId;
  if (show === "pf") return (e) => e.pf === rowId;
  return null;
}

export function qRunDrill(
  item: QuantifyShow,
  data: CxmData,
  dims: Record<string, Dim>,
  rowId: string,
): DrillResult {
  const dim = dims[item.show];
  if (!dim) return { kind: "none", reason: `Trục "${item.show}" không tồn tại trong dims.` };

  if (dim.base === "cust") {
    const getter = CUST_FIELD[item.show];
    if (!getter) {
      return {
        kind: "none",
        reason: `Trục "${item.show}" khai base:'cust' nhưng thiếu getter khách (bug nội bộ — CUST_FIELD/dims lệch nhau).`,
      };
    }
    /* `key` đã mask sẵn trong fixture ("KH•••7A2") — KHÔNG unmask, và KHÔNG dùng làm React key một
       mình: 300 khách sinh ra từ generateCustomers có thể trùng chuỗi mask. Ghép thêm chỉ số. */
    const lineId = (key: string, i: number) => `${key}#${i}`;

    if (rowId === UNKNOWN_ROW_ID) {
      const hit = data.cust.filter((c) => isSegUnknown(getter(c)));
      let unknownYet = 0;
      let missing = 0;
      for (const c of hit) {
        if (getter(c) === UNKNOWN_YET) unknownYet += 1;
        else if (getter(c) === MISSING) missing += 1;
      }
      return {
        kind: "unknown",
        lines: hit.slice(0, DRILL_MAX).map((c, i) => ({
          id: lineId(c.key, i),
          text: c.key,
          /* Cách CHỮA hai loại ngược nhau nên dòng meta phải nói rõ loại nào, không chỉ "không xác
             định": `chưa-biết` là khách chưa tới chỗ biết được (chờ, không phải lỗi), `thiếu` là lỗi
             thu thập (phải đi sửa pipeline). */
          meta: getter(c) === UNKNOWN_YET ? "chưa biết — khách chưa tới chỗ biết được" : "thiếu — lỗi thu thập",
        })),
        total: hit.length,
        unknownYet,
        missing,
      };
    }

    const hit = data.cust.filter((c) => getter(c) === rowId);
    if (hit.length === 0) {
      /* rows của qRunSegment/qRun chỉ sinh từ giá trị ĐANG CÓ nên hàng 0 khách không tồn tại — tới
         đây là dims/rows lệch nhau, nói thẳng thay vì mở một panel trắng. */
      return { kind: "none", reason: `Không khách nào có giá trị "${rowId}" ở trục ${dim.label}.` };
    }
    const metaAxes = CUST_META_AXES.filter((k) => k !== item.show).slice(0, 2);
    return {
      kind: "full",
      lines: hit.slice(0, DRILL_MAX).map((c, i) => ({
        id: lineId(c.key, i),
        text: c.key,
        meta: metaAxes.map((k) => `${dims[k]?.label ?? k}: ${CUST_FIELD[k]?.(c) ?? "—"}`).join(" · "),
      })),
      total: hit.length,
    };
  }

  const match = evMatcher(item.show, rowId);
  if (!match) {
    return { kind: "none", reason: `Trục "${item.show}" chưa có đường tra bản ghi gốc.` };
  }
  const hit = data.ev.filter(match);
  /* Nguồn in TÊN, không in id ("Google Analytics" chứ không "src-ga") — `ThemeDetailPage` in thô
     `e.src` nhưng ở đó chuỗi nằm trong ngữ cảnh một theme đã biết; panel này liệt kê chéo nhiều
     nguồn nên id thô thành khó đọc. */
  const lines = hit.slice(0, DRILL_MAX).map((e) => ({
    id: e.id,
    text: e.q,
    meta: `${data.sources.find((s) => s.id === e.src)?.name ?? e.src} · ${e.at}`,
  }));

  if (dim.base === "ev") return { kind: "full", lines, total: hit.length };

  /* base==='agg': lấy lại số TRÊN THANH từ chính engine thay vì nhận qua tham số — caller truyền sai
     số thì panel nói sai mẫu số, mà đây đúng là chỗ không được sai. */
  const rowV = qRun(item, data, dims).find((r) => r.id === rowId)?.v ?? 0;
  return { kind: "sample", lines, total: rowV, poolN: data.ev.length };
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
