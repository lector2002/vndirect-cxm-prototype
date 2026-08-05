import type { CxmData, Customer, Dim, Evidence, TaxNode } from "../data/schema/index.ts";
import { ANON_CK } from "../data/validate.ts";
import { isSegUnknown, MISSING, UNKNOWN_YET } from "../data/segment.ts";
import { custField, NOCUST_COLOR, NOCUST_LABEL, PF_LABEL } from "./quantify.ts";
import { bandOrderKey, isOrdinal, SEQ_RAMP, sortByBand } from "./splitOrder.ts";

/* VOC-STACKED-SPEC §2 — chia n của một theme thành các đoạn cho Bars.segments.
   `subtheme` = trục THẬT (n thật của subtheme con, GIỮ NGUYÊN từ bản trước).
   Mọi trục KHÁC `subtheme` giờ PHÁI SINH từ `dims` (module-f-charter.md, F1): không còn trục
   `group` bịa tỷ lệ từ `data.ins[].seg` — nhãn đó là tag tự do, không loại trừ nhau, không đếm
   được (xem charter, mục "Chẩn đoán"). Đoạn nào không đếm được từ `data.ev` thì trục đó bị khoá
   (themeAxisOptions trả disabledReason) và themeSegments trả []. */
export const SUBTHEME_AXIS = "subtheme";

/** `"subtheme"` hoặc một KEY của `dims` (data/fixtures/seed.ts). KHÔNG còn union đóng — trục nào
    đếm được là do `dims` quyết định lúc runtime, không hardcode ở đây (charter: "F lấy danh sách
    chiều chọn được TỪ dims, không hardcode 5 tên chiều ở tầng features"). */
export type ThemeAxis = string;

/** BỎ field `demo` (bản trước): mọi đoạn giờ là số ĐẾM được từ `data.ev`, không còn đoạn nào bịa
    tỷ trọng. */
export type ThemeSegment = {
  label: string;
  n: number;
  c: string;
  /** Chỉ khối GỘP mới có. `n` = Σ parts. Xem NOCUST_LABEL (domain/quantify.ts) cho lý do gộp. */
  parts?: { label: string; n: number }[];
};

export type ThemeAxisOption = { key: ThemeAxis; label: string; disabledReason?: string };

/* Palette phân loại cố định — TRÙNG hằng CAT_CYCLE của design-system/paintCategorical.ts (var(--cat-1)
   .. var(--cat-5), token đã có sẵn trong index.css). KHÔNG import từ design-system: domain đứng DƯỚI
   design-system trong layer (data→store→domain→design-system→features) nên không được import ngược.
   Export để domain/quantify.ts (qRunSplit — breakdown trục khách) dùng CHUNG thay vì tạo bản sao
   THỨ BA của cùng palette. */
export const CAT_CYCLE = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

/** Getter đọc trực tiếp một thuộc tính CỦA CHÍNH Evidence — chỉ những `dims` khai `base:'ev'` mà
    CÓ entry ở đây mới đếm được theo bằng chứng. Hôm nay chỉ `pf` (nền tảng của lần tương tác) —
    `cat`/`sen` là base:'ev' nhưng CHƯA có entry nên bị khoá (themeAxisOptions), không phải vì
    chúng không đếm được về nguyên tắc mà vì chưa có ai kiểm việc thêm chúng vào đây có sai thứ tự
    hiển thị/nhãn nào không (YAGNI — chỉ khai cái charter F1 cần: `pf`). */
const EV_FIELD: Record<string, (e: Evidence) => string> = {
  pf: (e) => e.pf,
};

/** Tên đẹp cho các trục `base:'ev'` đếm trực tiếp trên Evidence — hôm nay chỉ `pf` cần đổi, vì
    `EV_FIELD.pf` trả giá trị THÔ ('ios'/'android'/'web') để dùng làm KHOÁ đếm (`counts`), trong khi
    bảng tên đẹp (`iOS`/`Android`/`Web`/`Server`) đã có sẵn ở `domain/quantify.ts` (PF_LABEL, dùng
    chung cho `qRun`). Đây là bảng RIÊNG chỉ áp lúc DỰNG LABEL — `counts` vẫn khoá theo giá trị thô,
    không đụng tới (S2c, 04/08). Còn một bản sao PF_LABEL nữa ở design-system/SrcMatrix.tsx:16,
    NGOÀI PHẠM VI đợt này.

    ĐỌC KỸ TRƯỚC KHI "ĐƠN GIẢN HOÁ": giá trị phải lấy bằng HÀM, không đọc thẳng `PF_LABEL` lúc khai.
    `quantify.ts` import `CAT_CYCLE` từ file này (quantify.ts:15) và file này import `PF_LABEL` từ
    `quantify.ts` (dòng 4) ⇒ VÒNG IMPORT. `const` không hoist, nên nếu `quantify.ts` được nạp trước
    thì lúc dòng này chạy `PF_LABEL` còn chưa khởi tạo → bảng thành `undefined` → nhãn lặng lẽ rơi về
    giá trị thô 'android'/'ios'. Đã đo: cùng data, cùng hàm, chỉ đổi thứ tự import mà nhãn khác nhau.
    Bọc trong hàm để deref xảy ra lúc GỌI, khi cả hai module đã khởi tạo xong. Canh bởi test
    "nhãn nền tảng không phụ thuộc thứ tự import" trong themeSegments.pfLabel.test.ts. */
const EV_LABEL: Record<string, () => Record<string, string>> = { pf: () => PF_LABEL };

/** Trục subtheme (THẬT): tách theme.n theo n thật của các subtheme con (data.tax, parentId===theme.id),
    sort n desc, màu CAT_CYCLE cố định theo index. Phần theme.n KHÔNG được subtheme nào phủ (rem =
    theme.n - Σsub.n) dồn vào một đoạn xám cuối "Chưa gán sub-theme" — đoạn THẬT (không bịa số), chỉ
    bịa MÀU trung tính cho phần chưa phân loại. Theme không subtheme → 1 đoạn xám n=theme.n. */
function subthemeSegments(data: CxmData, theme: TaxNode): ThemeSegment[] {
  const subs = data.tax
    .filter((t) => t.lv === "subtheme" && t.parentId === theme.id)
    .slice()
    .sort((a, b) => b.n - a.n);
  const segs: ThemeSegment[] = subs.map((s, i) => ({ label: s.name, n: s.n, c: CAT_CYCLE[i % CAT_CYCLE.length] }));
  const sumSubs = subs.reduce((a, s) => a + s.n, 0);
  const rem = theme.n - sumSubs;
  if (rem > 0) segs.push({ label: "Chưa gán sub-theme", n: rem, c: "var(--ink3)" });
  return segs;
}

/** Vì sao một `dims[key]` KHÔNG đếm được theo bằng chứng — dùng CHUNG bởi `themeAxisOptions` (khoá
    chip, hiện lý do) và `themeSegments` (trả [] khi bị khoá). Một nguồn duy nhất cho "trục nào
    khoá" để hai nơi không lệch nhau (đúng bài học CUST_FIELD/ROW_BUILDERS lệch nhau ở quantify.ts). */
function axisDisabledReason(dim: Dim, key: string): string | undefined {
  if (dim.base === "agg") {
    return `Chiều "${dim.label}" là số tổng hợp sẵn (TaxNode.n/Source.vol), không gắn được vào từng bằng chứng riêng lẻ nên không đếm theo bằng chứng được.`;
  }
  if (dim.base === "ev" && !EV_FIELD[key]) {
    return `Chiều "${dim.label}" chưa có cách đọc trực tiếp từ một bằng chứng (Evidence) nên không đếm được.`;
  }
  /* `base:'fire'` (chart điểm đo, output/thiet-ke-chart-signal.html §4) là thuộc tính của LẦN BẮN
     tín hiệu, không phải của Evidence — không có đường nối nào tới `data.ev` nên không thể là trục
     chia của chart theme. Khoá TƯỜNG MINH ở đây thay vì để lọt qua (hai nhánh trên không bắt biến
     thể này) rồi rơi vào "không khoá" ngầm định — đúng loại lỗi mà `custField` ở quantify.ts đã né
     bằng cách chỉ nhận `base==='cust'`. */
  if (dim.base === "fire") {
    return `Chiều "${dim.label}" là thuộc tính của lần bắn tín hiệu (base:'fire'), không nối được với bằng chứng (Evidence) nên chart theme chưa dùng được chiều này.`;
  }
  return undefined;
}

/** Danh sách trục chọn được cho chart theme — luôn có `subtheme` trước, sau đó MỌI entry của
    `dims` (không hardcode tên trục nào: thêm một Dim mới vào `dims` là nó tự hiện ra ở đây). Trục
    `base:'agg'` hoặc `base:'ev'` thiếu getter (EV_FIELD) → khoá kèm lý do; tầng hiển thị (F3) hiện
    nguyên văn lý do đó, không viết lại. */
export function themeAxisOptions(dims: Record<string, Dim>): ThemeAxisOption[] {
  const opts: ThemeAxisOption[] = [{ key: SUBTHEME_AXIS, label: "Sub-theme" }];
  for (const [key, dim] of Object.entries(dims)) {
    const disabledReason = axisDisabledReason(dim, key);
    opts.push(disabledReason ? { key, label: dim.label, disabledReason } : { key, label: dim.label });
  }
  return opts;
}

/** Bảng màu + thứ tự đoạn của MỘT TRỤC, tính trên TOÀN BỘ bằng chứng gắn theme — không phải theo
    từng thanh.

    Đây là chỗ chart này đang sai chuẩn nặng nhất (đo 05/08, sửa cùng ngày). Trước đó màu gán theo
    THỨ HẠNG TRONG một theme: thanh nào cũng bắt đầu bằng --cat-1, nên ở theme A màu đầu là Android
    còn ở theme B lại là iOS. Cùng một chart, cùng một màu, hai nghĩa khác nhau — người xem không so
    ngang được hai thanh, và mỗi thanh phải kéo theo một chú giải riêng (tám chú giải cho tám thanh).
    Chính dự án đã chốt điều ngược lại ở chart điểm đo: "hạng 1 toàn chart → cat-1, kể cả khi ở nhóm A
    nó không phải hạng 1" (design-system/SignalColumns.test.tsx:7-9). Luật roll-out nói quyết định đó
    áp cho MỌI chart, nên chart này phải theo.

    Xếp hạng TOÀN CỤC ⇒ một màu = một nhóm ở mọi thanh ⇒ MỘT chú giải cho cả chart.

    Bảng tính trên mọi theme (kể cả theme nằm ngoài top hiển thị): nếu tính theo tập theme đang hiện
    thì màu sẽ NHẢY mỗi lần đổi số thanh hoặc đổi kỳ. Đổi lại có thể dư một mục chú giải không xuất
    hiện trong thanh nào đang hiện — dư một dòng đọc được vẫn hơn một bảng màu trôi. */
type AxisPalette = {
  /** Khoá THÔ (chưa qua EV_LABEL) theo đúng thứ tự vẽ. */
  order: string[];
  color: Map<string, string>;
  /** Có thanh nào sinh khối "Chưa xếp được nhóm" / "Chưa có bằng chứng gán" không — để chú giải
      chung liệt kê đúng những gì thật sự vẽ ra, không thừa không thiếu. */
  hasNocust: boolean;
  hasRem: boolean;
};

function axisPalette(data: CxmData, axis: string, dim: Dim, dims: Record<string, Dim>): AxisPalette {
  const themeById = new Map(data.tax.filter((t) => t.lv === "theme").map((t) => [t.id, t] as const));
  const totals = new Map<string, number>();
  const perTheme = new Map<string, number>();
  let nocust = 0;

  const getterEv = dim.base === "ev" ? EV_FIELD[axis] : undefined;
  const getterCust = dim.base === "cust" ? custField(dims, axis) : undefined;
  const custByKey = getterCust ? new Map(data.cust.map((c) => [c.key, c] as const)) : undefined;

  for (const e of data.ev) {
    const hit = e.tax.filter((t) => themeById.has(t));
    if (hit.length === 0) continue;
    for (const t of hit) perTheme.set(t, (perTheme.get(t) ?? 0) + 1);
    if (getterEv) {
      const v = getterEv(e);
      totals.set(v, (totals.get(v) ?? 0) + 1);
      continue;
    }
    if (!getterCust) continue;
    const cust = e.ck === ANON_CK ? undefined : custByKey?.get(e.ck);
    if (!cust) {
      nocust += 1;
      continue;
    }
    const v = getterCust(cust);
    if (isSegUnknown(v)) {
      nocust += 1;
      continue;
    }
    totals.set(v, (totals.get(v) ?? 0) + 1);
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const order = sortByBand(ranked, bandOrderKey(data, dims, axis));
  const cycle = isOrdinal(dim) ? SEQ_RAMP : CAT_CYCLE;
  let hasRem = false;
  for (const [id, t] of themeById) {
    if (t.n > (perTheme.get(id) ?? 0)) hasRem = true;
  }
  return {
    order,
    color: new Map(order.map((id, i) => [id, cycle[i % cycle.length]])),
    hasNocust: nocust > 0,
    hasRem,
  };
}

/** Chú giải CHUNG cho cả chart — đi cùng bảng màu toàn cục ở trên. Rỗng với trục `subtheme`: ở đó
    mỗi theme có bộ sub-theme RIÊNG (sub-theme thuộc về đúng một theme cha), nên không tồn tại bảng
    màu chung nào để chú giải, và chú giải theo từng thanh vẫn là cách đúng duy nhất. */
export function themeLegend(
  data: CxmData,
  axis: ThemeAxis,
  dims: Record<string, Dim>,
): { label: string; c: string }[] {
  if (axis === SUBTHEME_AXIS) return [];
  const dim = dims[axis];
  if (!dim || axisDisabledReason(dim, axis)) return [];
  const p = axisPalette(data, axis, dim, dims);
  return [
    ...p.order.map((raw) => ({ label: EV_LABEL[axis]?.()[raw] ?? raw, c: p.color.get(raw) as string })),
    ...(p.hasNocust ? [{ label: NOCUST_LABEL, c: NOCUST_COLOR }] : []),
    ...(p.hasRem ? [{ label: "Chưa có bằng chứng gán", c: "var(--rem)" }] : []),
  ];
}

/** Trục đếm được (base:'ev' có EV_FIELD, hoặc base:'cust'): chia `rows = data.ev` của theme theo
   giá trị THẬT của chiều, ghép thêm các đoạn "không biết"/"chưa gán" để Σ luôn bằng `theme.n`.

   Bốn nghĩa "không biết" KHÁC NHAU, KHÔNG được gộp (module-f-charter.md, "Chỉnh charter" #2; bất
   biến data/segment.ts cấm gộp chưa-biết/thiếu):
   - `chưa-biết`/`thiếu` — giá trị SENTINEL của chính chiều khách đó (Customer.age/nav/…), chỉ có
     thể phát sinh khi `dim.base==='cust'` (chiều base:'ev' đọc thẳng từ Evidence, không có sentinel).
   - `Ẩn danh` — `e.ck === ANON_CK`: bằng chứng cố ý không có id khách (đúng thiết kế, không phải lỗi).
   - `Chưa đối chiếu được` — `e.ck` có giá trị nhưng không tra ra khách nào trong `data.cust` (join
     hỏng — LÀ một defect dữ liệu, khác Ẩn danh).
   Hai nhóm sau CHỈ có nghĩa khi phải join qua `e.ck` để lấy giá trị, tức CHỈ áp dụng cho
   `dim.base==='cust'` — trục base:'ev' (pf) đọc `e.pf` thẳng từ chính dòng evidence, không cần
   `ck`, nên không có khái niệm "đối chiếu được" ở đó (mọi dòng đều đã có giá trị thật). */
function countedSegments(
  data: CxmData,
  theme: TaxNode,
  axis: string,
  dim: Dim,
  dims: Record<string, Dim>,
): ThemeSegment[] {
  const rows = data.ev.filter((e) => e.tax.includes(theme.id));
  const m = rows.length;

  const counts = new Map<string, number>();
  let unk = 0;
  let missing = 0;
  let anon = 0;
  let unjoined = 0;

  if (dim.base === "ev") {
    const getter = EV_FIELD[axis];
    for (const e of rows) {
      const v = getter(e);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  } else {
    const getter = custField(dims, axis);
    if (!getter) return [];
    const custByKey = new Map(data.cust.map((c) => [c.key, c] as const));
    for (const e of rows) {
      if (e.ck === ANON_CK) {
        anon += 1;
        continue;
      }
      const cust: Customer | undefined = custByKey.get(e.ck);
      if (!cust) {
        unjoined += 1;
        continue;
      }
      const v = getter(cust);
      /* Gọi isSegUnknown() làm cổng — KHÔNG tự so chuỗi sentinel bằng literal (data/segment.ts).
         Cùng khuôn với qRunSegment (quantify.ts) để hai chỗ không lệch cách nhận diện sentinel. */
      if (isSegUnknown(v)) {
        if (v === UNKNOWN_YET) unk += 1;
        else if (v === MISSING) missing += 1;
        continue;
      }
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }

  /* Thứ tự VÀ màu lấy từ bảng toàn cục (axisPalette) chứ không xếp lại trong từng thanh: cùng một
     nhóm phải nằm cùng một chỗ và mang cùng một màu ở MỌI thanh, nếu không thì hai thanh không so
     ngang được. `raw` vẫn là khoá đếm thật (giữ nguyên) — `label` chỉ đổi tên đẹp lúc DỰNG segment,
     qua EV_LABEL nếu trục có bảng đó (hôm nay chỉ `pf`); trục không có giữ nguyên như cũ. */
  const palette = axisPalette(data, axis, dim, dims);
  const nameOf = (raw: string) => EV_LABEL[axis]?.()[raw] ?? raw;
  const segs: ThemeSegment[] = palette.order
    .filter((raw) => (counts.get(raw) ?? 0) > 0)
    .map((raw) => ({ label: nameOf(raw), n: counts.get(raw) as number, c: palette.color.get(raw) as string }));

  /* Lưới an toàn cho bất biến Σ đoạn = theme.n. Bảng màu quét TẬP CHA (mọi bằng chứng gắn theme) của
     tập đang đếm ở đây, nên về lý không thể sót khoá nào. Nhưng nếu một ngày hai phép quét lệch nhau
     thì hậu quả là một đoạn LẶNG LẼ biến mất khỏi thanh — sai số không ai thấy. Rơi vào đây là đã có
     lỗi, chỉ là lỗi hiện ra dưới dạng một đoạn màu trung tính chứ không phải một con số hụt. */
  for (const [raw, n] of counts) {
    if (!palette.color.has(raw) && n > 0) segs.push({ label: nameOf(raw), n, c: "var(--cat-other)" });
  }

  /* Ghim cuối, KHÔNG tiêu slot CAT_CYCLE nào. Bốn nghĩa "không biết" vẫn ĐẾM RIÊNG (không gộp số),
     nhưng VẼ thành MỘT khối — owner chốt 05/08 sau khi xem trên màn: bốn sắc xám cạnh nhau ở đuôi
     thanh đọc gần như một màu. Bốn số nằm ở tooltip qua `parts`. Nhãn/màu lấy từ quantify.ts để
     chart này và chart chia màu ở Quantify nói CÙNG một thứ tiếng (luật roll-out).

     "Ẩn danh" trước đây luôn có mặt KỂ CẢ n=0 (để nói "có kiểm, bằng không"). Nay chỉ vào tooltip
     khi trục có khái niệm join (`base:'cust'`), kể cả bằng 0 — ý định giữ nguyên, nhưng đặt ở chỗ
     ĐỌC ĐƯỢC: một đoạn rộng 0px thì không rê chuột vào được, nên chỗ cũ chưa bao giờ nói được gì. */
  const nocustParts: { label: string; n: number }[] = [
    ...(unk > 0 ? [{ label: "chưa-biết", n: unk }] : []),
    ...(missing > 0 ? [{ label: "thiếu", n: missing }] : []),
    ...(dim.base === "cust" ? [{ label: "Ẩn danh", n: anon }] : []),
    ...(unjoined > 0 ? [{ label: "Chưa đối chiếu được", n: unjoined }] : []),
  ];
  const nocustN = nocustParts.reduce((a, p) => a + p.n, 0);
  if (nocustN > 0) segs.push({ label: NOCUST_LABEL, n: nocustN, c: NOCUST_COLOR, parts: nocustParts });

  const rem = theme.n - m;
  if (rem > 0) segs.push({ label: "Chưa có bằng chứng gán", n: rem, c: "var(--rem)" });

  return segs;
}

export function themeSegments(
  data: CxmData,
  themeId: string,
  axis: ThemeAxis,
  dims: Record<string, Dim>,
): ThemeSegment[] {
  const theme = data.tax.find((t) => t.lv === "theme" && t.id === themeId);
  if (!theme) return [];
  if (axis === SUBTHEME_AXIS) return subthemeSegments(data, theme);

  const dim = dims[axis];
  if (!dim) return [];
  if (axisDisabledReason(dim, axis)) return [];

  return countedSegments(data, theme, axis, dim, dims);
}
