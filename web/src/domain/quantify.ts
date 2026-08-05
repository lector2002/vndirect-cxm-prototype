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
/* Sentinel khoá khách "cố ý không có id". Import từ nơi khai DUY NHẤT (data/validate.ts:30) thay vì
   so literal — cùng đường mà themeSegments.ts:2 đã đi. */
import { ANON_CK } from "../data/validate.ts";
import { CUST_CAT } from "../data/rawFields.ts";
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
/* Export để domain/themeSegments.ts dùng CHUNG (S2c, 04/08) thay vì khai bản sao thứ ba của bảng
   tên đẹp — hợp tầng vì themeSegments.ts đã import custField từ module này. Bản sao còn lại ở
   design-system/SrcMatrix.tsx:16 NGOÀI PHẠM VI đợt này, chưa gộp. */
export const PF_LABEL: Record<string, string> = { ios: "iOS", android: "Android", web: "Web", server: "Server" };

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

/* NGUỒN DUY NHẤT của phép "một dòng bằng chứng thuộc hàng nào" trên trục base:'ev'.
   Ba hàm rows() ngay dưới VÀ nhánh chia màu trục ev trong qRunSplit đều đọc bảng này, cố ý: trước
   đó phép suy khoá hàng nằm inline trong từng rows(), nên mở chia màu là phải chép nó ra chỗ thứ
   hai — đúng bẫy "phải khớp TAY với bảng kia, thiếu một bên thì chart trả RỖNG mà không báo lỗi gì"
   mà chú thích custField() ở trên đã cảnh báo. Lệch một bên thì đoạn màu mô tả một tổng KHÁC với
   chiều dài thanh, và nhìn hình không phát hiện được. Test đóng đúng seam này: với MỌI hàng của MỌI
   trục ev, Σ đoạn phải bằng `v` của chính hàng đó do qRun trả. */
const EV_ROW_KEY: Record<string, (e: Evidence) => string> = {
  cat: (e) => e.cat,
  sen: (e) => senBucket(e.sen),
  pf: (e) => e.pf,
};

const countEv = (data: CxmData, axis: string, id: string): number =>
  data.ev.filter((e) => EV_ROW_KEY[axis]!(e) === id).length;

function catRows(data: CxmData): DimRow[] {
  return CAT_ORDER.map((id) => ({
    id,
    l: data.cats[id]?.label ?? id,
    c: data.cats[id]?.color,
    v: countEv(data, "cat", id),
  }));
}

function senRows(data: CxmData): DimRow[] {
  return SEN_ORDER.map((id) => ({
    id,
    l: SEN_LABEL[id],
    c: SEN_COLOR[id],
    v: countEv(data, "sen", id),
  }));
}

function pfRows(data: CxmData): DimRow[] {
  return PF_ORDER.map((id) => ({ id, l: PF_LABEL[id], v: countEv(data, "pf", id) }));
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

/* Getter đọc "khách này thuộc nhóm nào của chiều X" — dùng CHUNG giữa phép đếm rows (gộp cả sentinel,
   giữ nguyên hành vi qRun cũ) và qRunSegment (tách sentinel ra riêng qua isSegUnknown, xem bên dưới).
   Một nguồn getter duy nhất để hai chỗ không lệch nhau khi thêm chiều khách mới — đúng bài học D5a
   đã dẫn tới việc gom `mdir`/sentinel về một chỗ. themeSegments.ts gọi lại hàm này thay vì khai bản
   sao thứ tư của cùng bảng (xem ghi chú CAT_CYCLE ở đó).

   ĐỔI Ở ĐỢT 2a: trước đây là BẢNG 6 dòng viết tay (seg/tier/age/nav/tenure/acq); giờ SINH ra từ khai
   báo chiều. Đây là cổ chai đã đo được — toàn bộ production đọc nhãn nhóm của khách qua đúng bảng
   này — nên đổi nó thành "sinh từ khai báo" là bỏ được yêu cầu sửa code mỗi lần owner thêm một cách
   chia. Bảng viết tay còn một bẫy riêng: nó phải khớp TAY với bảng khai chiều ở tầng dữ liệu, thiếu
   một bên thì chart trả RỖNG mà không báo lỗi gì.

   Hai kiểu chia đọc từ hai chỗ khác nhau, và sự khác nhau đó có chủ ý:
   - `band`   → đọc NHÃN ĐÃ CHIẾU (`c.bands[id]`), vì nhãn phụ thuộc ranh giới, mà ranh giới nằm trong
                cấu hình — thứ tầng này không được biết tới (xem data/projectBands.ts).
   - `values` → đọc THẲNG dữ kiện từ danh mục, không phải chiếu gì.

   `base:'fire'` (chart điểm đo, output/thiet-ke-chart-signal.html §4) KHÔNG đi qua hàm này — điều
   kiện `dim.base !== "cust"` bên dưới đã loại nó TƯỜNG MINH cùng với 'agg'/'ev', trả `undefined` như
   một chiều không có cách đọc "thuộc tính khách". Chiều đó đọc thẳng `fire.pf` của lần bắn (xem
   data/projectSignalCounts.ts), không qua Customer nên không có getter nào ở đây cho nó. */
export function custField(dims: Record<string, Dim>, id: string): ((c: Customer) => string) | undefined {
  const dim = dims[id];
  if (!dim || dim.base !== "cust" || !dim.cut) return undefined;
  if (dim.cut.kind === "values") return CUST_CAT[dim.cut.source];
  return (c) => c.bands[id] as string;
}

/* Như trên nhưng KIỂM luôn nhãn có thật trong snapshot không. Thiếu nghĩa là snapshot chưa đi qua
   phép chiếu, hoặc đi qua với bộ chiều khác — trả undefined để nơi gọi TỪ CHỐI vẽ. Không được bịa
   một nhãn thay thế: bịa 'thiếu' ở đây là biến lỗi cấu hình thành một nhóm khách trông như thật. */
function custFieldPresent(
  dims: Record<string, Dim>,
  id: string,
  data: CxmData,
): ((c: Customer) => string) | undefined {
  const getter = custField(dims, id);
  if (!getter) return undefined;
  const probe = data.cust[0];
  if (probe !== undefined && getter(probe) === undefined) return undefined;
  return getter;
}

/* export CHỈ để test đối chiếu với `dims` (bẫy quantify.ts: thiếu một bên khiến qRun trả rỗng im
   lặng, xem qRun bên dưới) — bản thân module không có consumer ngoài nào cần import trực tiếp.
   CHỈ CÒN các trục đếm theo CẤU TRÚC (taxonomy, thuộc tính bằng chứng): chúng không chia theo một dữ
   kiện của khách nên không sinh ra được từ khai báo. Sáu trục chiều khách đã rời khỏi bảng này. */
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
};

/** Cách đếm của một chiều: trục cấu trúc lấy từ bảng trên, chiều khách SINH từ khai báo. Đây là chỗ
    duy nhất biết cả hai đường, nên thêm một chiều khách không phải sửa `qRun`. */
export function rowBuilder(dims: Record<string, Dim>, id: string, data: CxmData): RowBuilder | undefined {
  const fixed = ROW_BUILDERS[id];
  if (fixed) return fixed;
  /* `base:'fire'` (chart điểm đo, output/thiet-ke-chart-signal.html §4) đọc từ `data.sigCounts`
     GỘP THEO MỘT SIGNAL cụ thể (data/projectSignalCounts.ts) — `qRun` ở đây không có khái niệm
     "đang xem signal nào" nên KHÔNG CÓ cách đếm qua đường chung cho chiều này. Trả `undefined` (SỰ
     THẬT: không có cách đếm ở đây), KHÔNG trả builder-luôn-rỗng — một builder luôn rỗng làm test
     "thiếu là biểu đồ rỗng im lặng" xanh trong khi tạo ra chính cái nó canh (builder tồn tại nhưng
     luôn trả rows rỗng = biểu đồ rỗng im lặng). Test quantify.test.ts loại trừ base:'fire' KHỎI phép
     kiểm đó theo đúng lý do này (chiều này đếm qua đường riêng, không qua rowBuilder) — xem comment
     tại test, đó là thu hẹp phạm vi vì đổi tiền đề, không phải nới lỏng kỳ vọng. Chart thật sự dùng
     chiều này là section sau, qua đường riêng (data.sigCounts), không qua `rowBuilder`/`qRun`. */
  if (dims[id]?.base === "fire") return undefined;
  const getter = custFieldPresent(dims, id, data);
  return getter ? (d) => byCustGroup(d, getter) : undefined;
}

/* Chạy một item `show`: trả rows đã xếp giảm dần theo v. Port từ qRun() (~dòng 1477) — RÚT GỌN so
   với bản gốc: chỉ trả DimRow[], không kèm total/shown/axis (những field đó là mối quan tâm của
   tầng hiển thị/chart ở section sau, tính lại được từ chính rows này). `item.metric` KHÔNG đổi giá
   trị trả về — đúng như prototype, nơi metric:'pct' chỉ đổi NHÃN trục còn rows() luôn trả count
   thô; % được tính ở tầng hiển thị (pv(v, tổng)). fx() cũng KHÔNG áp trong rows() ở prototype (chỉ
   áp lúc format hiển thị qua METRICS.count.fmt) nên engine ở đây cũng trả count thô, chưa scale. */
export function qRun(item: QuantifyShow, data: CxmData, dims: Record<string, Dim>): DimRow[] {
  if (!dims[item.show]) return [];
  const build = rowBuilder(dims, item.show, data);
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
  const getter = custFieldPresent(dims, item.show, data);
  if (!getter) {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}" khai base:'cust' nhưng chưa đọc được nhãn nhóm: thiếu khai báo cách chia (Dim.cut), hoặc dữ kiện nguồn không có trong danh mục (data/rawFields.ts), hoặc snapshot chưa đi qua phép chiếu nhóm (data/projectBands.ts).`,
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

   MỌI SỐ Ở ĐÂY LÀ SỐ THẬT — không một hằng số tỷ lệ bịa nào (khác groupSegments() ở
   themeSegments.ts, nơi tỷ trọng sinh từ hạt char-code nên cắm data thật vào vẫn bịa).

   HAI đường tính thật, tách theo `base` của TRỤC HÀNG (trục chia màu luôn phải là base:'cust'):
   - `cust` × `cust` — hai giá trị nằm trên CÙNG MỘT DÒNG khách ⇒ group-by hai chiều là phép đếm
     thuần. Đây là đường có từ section 1.
   - `ev`   × `cust` — mỗi thanh đếm từ `data.ev`, mà mỗi dòng `Evidence` mang sẵn khoá khách `ck`
     (trường BẮT BUỘC, validate quy tắc 21 canh định dạng) ⇒ nối sang `Customer` rồi đếm cũng là
     phép đếm thật. Xem evSplit().

   SỬA MỘT KHẲNG ĐỊNH SAI ở bản trước (05/08): chỗ này từng ghi "trục agg/ev không có khoá khách trên
   `Evidence`". KHÔNG ĐÚNG — `Evidence.ck` luôn có. Điều đúng là chuyện KHÁC hẳn và chỉ áp cho `agg`:
   số trên thanh agg là TỔNG HỢP SẴN (`TaxNode.n`/`Source.vol`), không đếm từ bằng chứng, nên chia màu
   nó là bịa tỷ lệ bất kể khoá khách tốt đến đâu. Đừng gộp hai lý do đó lại lần nữa. */

/** Trần số nhãn có màu riêng; phần còn lại gộp một đoạn "Khác" (owner chốt 03/08: top 6 — khớp số
    thanh q17/q18 đang vẽ). Vượt trần là nhiều màu hơn mắt phân biệt được, không phải nhiều tin hơn. */
const SPLIT_TOP_N = 6;

const SPLIT_OTHER_ID = "__split_other__";
/* Id RIÊNG, KHÔNG dùng lại "__unknown__" của tầng hiển thị (QuantifyWidget ghim thanh đó cuối bằng
   đúng chuỗi ấy): một là id ĐOẠN trong thanh, một là id HÀNG — trùng chuỗi là mời nhầm về sau. */
const SPLIT_UNKNOWN_ID = "__split_unknown__";
/* Hai nghĩa "không nối được sang khách", KHÔNG gộp với nhau và KHÔNG gộp vào SPLIT_UNKNOWN_ID:
   - `Ẩn danh` — bằng chứng CỐ Ý không có id khách (khảo sát ẩn danh, review store). Đúng thiết kế.
   - `Chưa đối chiếu được` — có id nhưng tra không ra khách nào. LÀ một defect dữ liệu.
   Cùng cách phân biệt mà themeSegments.ts đã dựng, và cùng bộ token màu (`--unk-anon`/`--unk-join`)
   nên hai màn nói cùng một ngôn ngữ. Đo trên demoData 05/08: 133 ẩn danh (8,1%) vs 7 chưa đối chiếu
   (0,4%) — hai con số khác hẳn nhau về bậc, gộp là mất đúng thông tin cần cho người sửa pipeline. */
const SPLIT_ANON_ID = "__split_anon__";
const SPLIT_UNJOINED_ID = "__split_unjoined__";

/* Lý do khoá của trục TỔNG HỢP, cắt làm hai mảnh và GHÉP LẠI thành `reason` — một nguồn chữ, hai độ
   dài, nên không có bản sao nào trôi lệch:
   - `AGG_SPLIT_NOTE` là câu hiện thành CHỮ dưới chart. Đo trên màn 05/08: trang Quantify có 7 chart
     trục tổng hợp, in nguyên đoạn dài dưới cả 7 thì thành 7 khối 2–3 dòng giống hệt nhau — người xem
     thôi đọc, tức là mất đúng cái luật "nói thẳng" định đạt được.
   - `AGG_SPLIT_EVIDENCE` là phần ĐO ĐƯỢC, đi kèm trong `reason` đầy đủ (tooltip từng chip) cho ai cần
     kiểm chứng con số. Không bỏ đi: nó là bằng chứng cho lời khẳng định ở câu trên. */
export const AGG_SPLIT_NOTE =
  "Số trên thanh là số TỔNG HỢP SẴN, không đếm từ bằng chứng — chia màu theo thuộc tính khách sẽ là tỷ lệ bịa, nên khoá.";
const AGG_SPLIT_EVIDENCE =
  "Tập bằng chứng dưới mỗi thanh chỉ là mẫu: đo trên dữ liệu demo có thanh ghi 412 mà chỉ 8 dòng bằng chứng, lệch ~50 lần.";

/* Chia màu cho trục HÀNG là base:'ev' (cat/sen/pf). Mỗi thanh đếm dòng `data.ev`, nên đoạn màu cũng
   phải đếm đúng tập dòng đó — khoá hàng lấy từ EV_ROW_KEY, CÙNG bảng mà rows() dùng, để Σ đoạn không
   bao giờ lệch chiều dài thanh.

   Mỗi dòng bằng chứng rơi vào ĐÚNG MỘT trong bốn giỏ: giá trị thật của khách · sentinel của chiều
   khách (`Không xác định`) · `Ẩn danh` · `Chưa đối chiếu được`. Phân hoạch kín ⇒ bất biến Σ = v giữ
   được mà không cần phép cộng bù nào. */
function evSplit(
  item: QuantifyShow,
  data: CxmData,
  dims: Record<string, Dim>,
  splitDim: Dim,
): SplitChart {
  const rowKey = EV_ROW_KEY[item.show];
  if (!rowKey) {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}" khai base:'ev' nhưng chưa khai cách suy hàng từ một dòng bằng chứng (EV_ROW_KEY), nên không có tập dòng nào để chia.`,
    };
  }
  const splitGetter = custFieldPresent(dims, item.split ?? "", data);
  if (!splitGetter) {
    return {
      kind: "refuse",
      reason: `Chiều chia màu "${item.split}" khai base:'cust' nhưng chưa đọc được nhãn nhóm (thiếu khai báo cách chia, hoặc snapshot chưa chiếu nhóm).`,
    };
  }
  if (data.ev.length === 0) {
    return { kind: "refuse", reason: `Chưa có dòng bằng chứng nào để chia màu.` };
  }

  const custByKey = new Map(data.cust.map((c) => [c.key, c] as const));
  /* Giỏ của MỘT dòng bằng chứng. Thứ tự kiểm là thứ tự nghĩa, không đảo được: ẩn danh là chuyện của
     dòng bằng chứng (không có id để mà tra), nối hỏng là chuyện của phép tra, sentinel là chuyện của
     ô dữ kiện trên dòng khách đã tra ra. */
  const rawBucketOf = (e: Evidence): string => {
    if (e.ck === ANON_CK) return SPLIT_ANON_ID;
    const cust = custByKey.get(e.ck);
    if (!cust) return SPLIT_UNJOINED_ID;
    const v = splitGetter(cust);
    return isSegUnknown(v) ? SPLIT_UNKNOWN_ID : v;
  };

  /* Xếp hạng TOÀN CỤC trên toàn bộ `data.ev` (không theo từng hàng) — cùng lý do đã nêu ở nhánh
     cust: mọi hàng phải dùng chung bộ nhãn/màu, nếu không thì "màu thứ ba" của hai hàng là hai thứ
     khác nhau. Chỉ giá trị THẬT tham gia xếp hạng; ba giỏ "không biết" ghim cuối, không tiêu suất. */
  const totals = new Map<string, number>();
  let unkTotal = 0;
  let anonTotal = 0;
  let unjoinedTotal = 0;
  for (const e of data.ev) {
    const b = rawBucketOf(e);
    if (b === SPLIT_UNKNOWN_ID) unkTotal += 1;
    else if (b === SPLIT_ANON_ID) anonTotal += 1;
    else if (b === SPLIT_UNJOINED_ID) unjoinedTotal += 1;
    else totals.set(b, (totals.get(b) ?? 0) + 1);
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const top = ranked.slice(0, SPLIT_TOP_N);
  const topSet = new Set(top);
  const collapsed = ranked.length - top.length;

  const order: { id: string; label: string; c: string }[] = [
    ...top.map((id, i) => ({ id, label: id, c: CAT_CYCLE[i % CAT_CYCLE.length] })),
    ...(collapsed > 0
      ? [{ id: SPLIT_OTHER_ID, label: `Khác (${collapsed} ${splitDim.unit})`, c: "var(--ink3)" }]
      : []),
    ...(unkTotal > 0 ? [{ id: SPLIT_UNKNOWN_ID, label: "Không xác định", c: "var(--unk)" }] : []),
    ...(anonTotal > 0 ? [{ id: SPLIT_ANON_ID, label: "Ẩn danh", c: "var(--unk-anon)" }] : []),
    ...(unjoinedTotal > 0
      ? [{ id: SPLIT_UNJOINED_ID, label: "Chưa đối chiếu được", c: "var(--unk-join)" }]
      : []),
  ];

  const bucketOf = (e: Evidence): string => {
    const raw = rawBucketOf(e);
    if (raw === SPLIT_UNKNOWN_ID || raw === SPLIT_ANON_ID || raw === SPLIT_UNJOINED_ID) return raw;
    return topSet.has(raw) ? raw : SPLIT_OTHER_ID;
  };

  const counts = new Map<string, Map<string, number>>();
  for (const e of data.ev) {
    const rid = rowKey(e);
    const b = bucketOf(e);
    let m = counts.get(rid);
    if (!m) {
      m = new Map();
      counts.set(rid, m);
    }
    m.set(b, (m.get(b) ?? 0) + 1);
  }

  const byRow: Record<string, SplitSegment[]> = {};
  for (const [rid, m] of counts) {
    // Bỏ đoạn n=0 — cùng lý do nhánh cust: width 0 không hover được, tooltip "X: 0" không nói gì.
    byRow[rid] = order
      .filter((o) => (m.get(o.id) ?? 0) > 0)
      .map((o) => ({ id: o.id, label: o.label, n: m.get(o.id) ?? 0, c: o.c }));
  }

  return { kind: "draw", byRow, legend: order.map((o) => ({ label: o.label, color: o.c })) };
}

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
  if (splitDim.base !== "cust") {
    return {
      kind: "refuse",
      reason: `Chia màu phải theo một thuộc tính khách (base:'cust') — "${item.split}" không phải, nên không có đường tính nào mà không phải bịa tỷ lệ.`,
    };
  }
  /* Trục BẰNG CHỨNG: mở được vì mỗi dòng `Evidence` mang sẵn khoá khách `ck` (trường BẮT BUỘC,
     validate quy tắc 21 canh định dạng), nên nối sang `Customer` là phép đếm THẬT chứ không phải
     phân bổ tỷ lệ. Xem evSplit(). */
  if (rowDim?.base === "ev") return evSplit(item, data, dims, splitDim);
  if (rowDim?.base === "agg") {
    /* KHÔNG mở, và lý do KHÁC HẲN trục ev — không phải "thiếu khoá khách" mà là "số trên thanh không
       đếm từ bằng chứng". `TaxNode.n`/`Source.vol` là số TỔNG HỢP SẴN; tập bằng chứng dưới nó chỉ là
       mẫu. Đã đo trên demoData: theme "Thiết bị" ghi 412 mà có 8 dòng bằng chứng, nguồn `src-ga` ghi
       41.200 mà có 2 dòng — lệch ~50 lần (cùng phép đo mà qRunDrill dựa vào để trả kind:'sample').
       Tô một thanh 412 bằng 8 dòng là bịa tỷ lệ. Nói ĐÚNG lý do này ra là mục đích của nhánh. */
    /* Tên trục đứng ĐẦU câu đầy đủ: `reason` còn dùng ở tooltip từng chip và ở test, nơi phải biết
       lời từ chối nói về trục nào. Dòng chữ dưới chart bỏ được tiền tố này vì nó nằm ngay trong
       chart đó. */
    return { kind: "refuse", reason: `Trục "${item.show}": ${AGG_SPLIT_NOTE} ${AGG_SPLIT_EVIDENCE}` };
  }
  if (rowDim?.base !== "cust") {
    return {
      kind: "refuse",
      reason: `Trục "${item.show}" không có đường đếm nào ghép được với thuộc tính khách.`,
    };
  }
  const rowGetter = custFieldPresent(dims, item.show, data);
  const splitGetter = custFieldPresent(dims, item.split, data);
  if (!rowGetter || !splitGetter) {
    /* So `=== undefined` tường minh, KHÔNG dùng ternary trên chính hàm (`rowGetter ? … : …`): TS2774
       báo lỗi ở đó vì kiểu trả về là một hàm có thể undefined. */
    const missingAxis = rowGetter === undefined ? item.show : item.split;
    return {
      kind: "refuse",
      reason: `Trục "${missingAxis}" khai base:'cust' nhưng chưa đọc được nhãn nhóm (thiếu khai báo cách chia, hoặc dữ kiện nguồn không có trong danh mục, hoặc snapshot chưa chiếu nhóm).`,
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

   Vì sao trục cust vẫn liệt kê KHÁCH chứ không phải verbatim: bản ghi dưới một hàng trục khách LÀ
   khách — `data.cust` đếm đủ và là số thật, nên đó mới là danh sách đúng nghĩa của hàng.

   CẢNH BÁO CHO NGƯỜI SỬA SAU: chỗ này từng biện minh bằng một phép đo, nay đã HẾT HẠN — "17 bản ghi
   / 15 khoá `ck`, chỉ 7 khoá khớp" (đo 03/08, khi bằng chứng demo chưa được sinh thêm). Đo lại
   05/08: **1.641 dòng bằng chứng, 1.501 nối được (91,5%), 133 ẩn danh, 7 nối hỏng**. Join qua `ck`
   nay LÀNH, và chính phép đo mới này đã mở chia màu cho trục ev (xem evSplit). Nếu sau này muốn cho
   hàng trục khách mở ra verbatim thay vì danh sách khách, thì đó là một quyết định về Ý NGHĨA của
   hàng — KHÔNG còn bị chặn bởi chất lượng join nữa, đừng viện lại con số 7/15. */

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

/* Thứ tự ưu tiên khi chọn thuộc tính in kèm mỗi dòng drill — GIỮ NGUYÊN cơ chế từ bản trước, chỉ bỏ
   `seg` (S2, 04/08: chiều đã rút khỏi `dims`, không còn ứng viên nào để xếp hạng). Đây KHÔNG phải
   danh sách đóng: chiều nào không có trong đây vẫn được chọn, chỉ xếp sau.
   Hệ quả CÓ CHỦ Ý của việc rút `seg`: drill theo `nav` trước đây in "Segment khách · Value tier",
   sau đợt này in "Value tier · Kênh mở TK" (owner đã chấp nhận, xem docs/DB-FIRST-HANDOFF.md). */
const META_PRIORITY = ["tier", "nav", "acq"];

/* Hai chiều khách hiện kèm theo mỗi dòng drill làm ngữ cảnh ("khách này còn thuộc nhóm nào nữa").
   Tập ứng viên SUY từ khai báo thay vì hardcode như bản trước: danh sách hardcode sẽ trỏ vào một
   chiều owner đã xoá (hiện "—" mãi mãi) và bỏ qua chiều owner mới thêm. Chiều mới xếp sau nhóm ưu
   tiên, giữ thứ tự khai báo (sort ổn định) — nên không chiều nào vô hình, mà chữ hiện ra vẫn tất
   định, không phụ thuộc thứ tự khai. */
function custMetaAxes(dims: Record<string, Dim>, exclude: string): string[] {
  const rank = (id: string) => {
    const i = META_PRIORITY.indexOf(id);
    return i === -1 ? META_PRIORITY.length : i;
  };
  return Object.entries(dims)
    .filter(([id, d]) => d.base === "cust" && d.cut !== undefined && id !== exclude)
    .map(([id]) => id)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 2);
}

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
    const getter = custFieldPresent(dims, item.show, data);
    if (!getter) {
      return {
        kind: "none",
        reason: `Trục "${item.show}" khai base:'cust' nhưng chưa đọc được nhãn nhóm (thiếu khai báo cách chia, hoặc dữ kiện nguồn không có trong danh mục, hoặc snapshot chưa chiếu nhóm).`,
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
    const metaAxes = custMetaAxes(dims, item.show);
    return {
      kind: "full",
      lines: hit.slice(0, DRILL_MAX).map((c, i) => ({
        id: lineId(c.key, i),
        text: c.key,
        meta: metaAxes.map((k) => `${dims[k]?.label ?? k}: ${custField(dims, k)?.(c) ?? "—"}`).join(" · "),
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
  if (dim?.base === "cust") {
    return `Trục "${id}" là thuộc tính khách (base:'cust'), không nối được với evidence nên không ghép chéo được.`;
  }
  /* `base:'fire'` (chart điểm đo) không có entry trong CROSS_EXTRACT nên `rowExtract`/`colExtract`
     phía dưới sẽ undefined và hàm trả `empty` — TƯỜNG MINH lý do ở đây thay vì để `unsupported: null`
     (đọc như "ghép được nhưng không match gì", một câu SAI cho trường hợp này) rơi vào nhánh mặc
     định im lặng. */
  if (dim?.base === "fire") {
    return `Trục "${id}" là thuộc tính của lần bắn tín hiệu (base:'fire') — chart điểm đo chưa nối vào ghép chéo evidence ở đợt này.`;
  }
  return null;
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
  const rowBuild = rowBuilder(dims, item.show, data);
  const colBuild = item.by ? rowBuilder(dims, item.by, data) : undefined;

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
