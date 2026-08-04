import type { CxmData, Customer, Dim, Evidence, TaxNode } from "../data/schema/index.ts";
import { ANON_CK } from "../data/validate.ts";
import { isSegUnknown, MISSING, UNKNOWN_YET } from "../data/segment.ts";
import { custField } from "./quantify.ts";

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
export type ThemeSegment = { label: string; n: number; c: string };

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

  const segs: ThemeSegment[] = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, n], i) => ({ label, n, c: CAT_CYCLE[i % CAT_CYCLE.length] }));

  // Ghim cuối, KHÔNG tiêu slot CAT_CYCLE nào — bốn nghĩa "không biết", bốn đoạn, không gộp.
  if (unk > 0) segs.push({ label: "chưa-biết", n: unk, c: "var(--unk)" });
  if (missing > 0) segs.push({ label: "thiếu", n: missing, c: "var(--unk-gap)" });
  // "Ẩn danh" LUÔN có mặt (kể cả n=0) khi trục có khái niệm join qua ck — chỉ base:'cust'.
  if (dim.base === "cust") segs.push({ label: "Ẩn danh", n: anon, c: "var(--unk-anon)" });
  if (unjoined > 0) segs.push({ label: "Chưa đối chiếu được", n: unjoined, c: "var(--unk-join)" });

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
