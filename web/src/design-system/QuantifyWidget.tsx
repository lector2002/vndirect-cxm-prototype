import { useState, type ReactNode } from "react";
import type { Cfg, CxmData, Dim, DimRow, QuantifyItem, QuantifyShow, QuantifyView } from "../data/schema/index.ts";
import { BASE_FACTOR, fx } from "../domain/format.ts";
import { qRun, qRunCross, qRunDrill, qRunSegment, qRunSplit, UNKNOWN_ROW_ID } from "../domain/quantify.ts";
// scopeTotal = định nghĩa DUY NHẤT của mẫu số "tín hiệu khách hàng" (VOC_SCOPE). Hàm thuần trên
// CxmData nên sống ở domain/, KHÔNG ở features/ — design-system không được phụ thuộc vào features.
// (S2.5 từng import ngược từ features/overview/sec.ts; Opus đã dời.)
import { scopeSources, scopeTotal } from "../domain/scope.ts";
import { AnomalyChart } from "./AnomalyChart.tsx";
import { Bars } from "./Bars.tsx";
import { Card } from "./Card.tsx";
import { ChartLegend, type ChartLegendItem } from "./ChartLegend.tsx";
import { CrossTable } from "./CrossTable.tsx";
import { DataTable } from "./DataTable.tsx";
import { Donut } from "./Donut.tsx";
import { DrillPanel, type DrillContent, type DrillRecordKind } from "./DrillPanel.tsx";
import { nf, pv } from "./format.ts";
import { LineChart } from "./LineChart.tsx";
import { paintCategorical } from "./paintCategorical.ts";
import { VAxisLabel } from "./VAxisLabel.tsx";

export type QuantifyWidgetProps = {
  item: QuantifyItem;
  data: CxmData;
  dims: Record<string, Dim>;
  /** Ép view bất kể item.view (dùng khi builder cho phép người dùng đổi chart/table tại chỗ). */
  view?: QuantifyView;
  /** Ngưỡng anomaly (cfg.anomaly.z) cho AnomalyChart. Caller thật (Library screen, P1.2) PHẢI
   * truyền cfg từ store để màn Chỉ số & ngưỡng điều khiển được ngưỡng — thiếu prop này chỉ là
   * fallback an toàn cho render (DEFAULT_ANOMALY_Z bên dưới), không phải giá trị nghiệp vụ đúng. */
  cfg?: Cfg;
  /** Số dòng tối đa hiển thị cho chart rank/bảng (item `show` 1 chiều, không donut). Tầng thư viện
   *  điều khiển qua filter số lượng. Bỏ trống = mặc định TOP_N. Donut/series/cross-tab bỏ qua. */
  limit?: number;
  /** S2.6b: slot góc phải header (Card.actions) — Popover/Menu thao tác của card (thay cho footer cũ,
   *  đã bỏ khỏi widget này). */
  actions?: ReactNode;
  /** S2.6b: có mặt → tiêu đề bấm được, mở màn chi tiết (forward xuống Card.onTitleClick). */
  onTitleClick?: () => void;
  /** Số tháng gần nhất áp cho item.kind==='series' (bộ lọc Enterpret-style ở Overview, sec.ts
   *  RANGE_MONTHS). Cắt `t[].p` theo `.slice(-months)` — KHÔNG nội suy: chuỗi ít điểm hơn N thì
   *  `slice(-months)` tự nhiên trả về nguyên chuỗi đang có. Bỏ trống = không cắt (hành vi cũ,
   *  dùng cho mọi caller ngoài Overview — QuantifyLibrary/Detail/Builder — chưa cần range).
   *  KHÔNG áp cho item.kind==='show' (rank/donut/table là snapshot, không có chuỗi thời gian). */
  months?: number;
};

/* Fallback render-safe khi cfg chưa được truyền — KHÔNG phải ngưỡng nghiệp vụ chính thức, chỉ để
   component không crash. Caller thật phải truyền cfg từ store. Giữ ĐỒNG BỘ với cfgDefault.anomaly.z
   trong seed.ts (2,5 kể từ 02/08) — lệch nhau thì cùng một chart vẽ khác nhau tuỳ caller. */
const DEFAULT_ANOMALY_Z = 2.5;

/* Số điểm tối thiểu để chấm được bất thường: zScores() trả null cho i<3 nên chuỗi phải có ÍT NHẤT
   4 điểm mới có một điểm chấm được. Dùng để nói thẳng "chưa đủ kỳ" thay vì hiện chú thích "vòng
   tròn = vượt ngưỡng" trên một chart mà cấu trúc không cho phép khoanh gì (vd bộ lọc 3 tháng). */
const MIN_POINTS_FOR_ANOMALY = 4;

/* Trần hiển thị mặc định của mọi rank chart — quyết định nghiệp vụ port 1-1 từ qRun() gốc
   prototype (dòng 1482: `limit || (q.chart==='donut' ? all.length : Math.min(all.length,10))`).
   domain/quantify.ts (bản thật) đã BỎ slicing này khỏi engine — chỉ trả rows đã sort — nên tầng
   hiển thị SỞ HỮU quy tắc này ở đây (follow-up #1 nêu trong P1.1a). */
const TOP_N = 10;

/* Đuôi bị Top-N cắt của trục HÀNG → gộp thành MỘT hàng "Khác (+N)" thay vì biến mất khỏi hình.
   Tiền lệ NGAY TRONG NHÀ: `Donut.tsx` đã gộp đúng như vậy (`OTHER_COLOR = var(--cat-other)`), nên
   trước đổi này cùng một câu hỏi vẽ bằng donut và bằng thanh cho HAI bức tranh khác nhau — donut giữ
   đuôi, thanh mất đuôi. Chuẩn ngành cũng vậy (Looker Studio bật "Group the rest as Others" mặc định).
   Dải `denomStrip` vẫn giữ: nó nói "Top N trên M" tức số nhóm CÓ TÊN RIÊNG, vẫn đúng sau khi gộp.

   ĐỪNG gộp "Khác" vào "Không xác định". "Khác" là các nhóm ĐẾM ĐƯỢC nhưng nhỏ; "Không xác định" là
   phần KHÔNG đếm được (chưa biết + thiếu). Gộp hai thứ đó lại đúng là lỗi D0. Vì thế màu cũng phải
   khác: `--cat-other` (nhạt, lùi về sau) ≠ `--unk`.

   Gọi SAU paintCategorical: hàm đó gán `--cat-N` xoay vòng theo index nên nếu gộp trước thì màu
   `--cat-other` bị ghi đè.

   CHỈ dùng cho CHART, KHÔNG cho view bảng. Bảng có việc là LIỆT KÊ: người dùng đổi mốc số dòng để đọc
   thêm từng giá trị, gộp chúng lại thành một dòng "Khác" là lấy đi đúng thứ họ vừa xin — và mẫu số đã
   có ở `denomStrip`. Cùng lý do Looker Studio để "Others" cho chart còn bảng thì phân trang. */
const ROW_OTHER_ID = "__row_other__";

function foldRowTail(painted: DimRow[], all: DimRow[]): DimRow[] {
  const collapsed = all.length - painted.length;
  if (collapsed <= 0) return painted;
  const v = all.slice(painted.length).reduce((a, r) => a + r.v, 0);
  // Nhãn "(+N)" khớp Donut.tsx từng chữ — cùng khái niệm thì phải cùng cách gọi tên.
  return [...painted, { id: ROW_OTHER_ID, l: `Khác (+${collapsed})`, v, c: "var(--cat-other)" }];
}

/* Nội dung panel khi bấm chính hàng gộp "Khác (+N)". KHÔNG gọi qRunDrill được: hàng đó không phải một
   thực thể nào trong data — nó do `foldRowTail` ở ĐÂY dựng ra, và chỉ tầng này biết đuôi bị cắt gồm
   những nhóm nào. Trả về DANH SÁCH NHÓM (tên + số), không phải bản ghi: bấm "Khác" là hỏi "trong đó
   có gì", không phải "ai đã nói gì".
   Cố ý vẫn mở panel thay vì để hàng đó không bấm được: một hàng trơ giữa các hàng bấm được đọc thành
   "chỗ này lỗi". */
function groupsContent(tail: DimRow[], fmt: (v: number) => string): DrillContent {
  return {
    kind: "groups",
    lines: tail.map((r) => ({ id: r.id, text: r.l, meta: fmt(r.v) })),
    total: tail.length,
  };
}

/* Nhãn trục — phần thứ 4 (bắt buộc) của anatomy widget theo ghi chú wHead() prototype (dòng
   1850-1857): "Bỏ bất kỳ phần nào là người xem mất một mảnh ngữ cảnh cần để tin con số." Port 1-1
   BASE_AXIS (dòng 1456).

   S2.6a (spec 2026-08-01-card-enterpret-spec.md, R2+R3): axisLabel() gộp cũ TÁCH LÀM HAI vì quay
   dọc (VAxisLabel) không đủ chỗ cho cả đơn vị lẫn mẫu số:
   - axisUnit() → CHỈ đơn vị, bọc quanh chart bằng VAxisLabel.
   - buildDenomStrip() → mẫu số + caveat "tập mẫu" (base='ev'), render ở Card.denomStrip (R2).
   base='ev' (mẫu bằng chứng, khác mẫu số agg/cust) phải nói rõ đây là tập mẫu — CrossTable đã tự
   có caveat này nên chỉ show item (không by) cần render ở đây. */
const BASE_AXIS: Record<Dim["base"], string> = {
  agg: "Số tín hiệu khách hàng",
  ev: "Số bằng chứng mẫu",
  cust: "Số khách trong cohort",
};

/* Danh từ đơn vị cho nhãn nhỏ dưới số ở tâm donut — cùng nguồn nghĩa với BASE_AXIS, bỏ tiền tố
   "Số". Trước đây tâm donut ghi cứng "tín hiệu khách hàng" cho MỌI chiều: D0a đã sửa CON SỐ (ev/cust
   thôi nhân fx()) nhưng nhãn vẫn nói sai loại. Seed hiện chỉ có q14 (Nguồn, base='agg') là donut nên
   chưa lộ, nhưng QuantifyBuilder cho user chọn bất kỳ chiều nào + kiểu Donut (CHART_OPTIONS dòng 41)
   — dựng donut trên "Category · intent" sẽ ra "17 tín hiệu khách hàng" cho 17 bằng chứng mẫu. */
const BASE_NOUN: Record<Dim["base"], string> = {
  agg: "tín hiệu khách hàng",
  ev: "bằng chứng mẫu",
  cust: "khách trong cohort",
};

/* CHỈ đơn vị trục — mẫu số (agg) và caveat tập mẫu (ev) đã dời sang buildDenomStrip(). Nhánh pct
   GIỮ NGUYÊN hành vi cũ ("% trên tổng", không đổi theo base) vì donut/pct hiện tỷ trọng, không phải
   số tuyệt đối. */
function axisUnit(item: { metric: string }, dim: Dim | undefined): string {
  if (!dim) return "";
  if (item.metric === "pct") return "% trên tổng";
  return BASE_AXIS[dim.base];
}

/* D1a (owner chốt 02/08, sửa lỗi S2.6a): nhãn trục phải theo ĐÚNG thứ mà trục đó mã hoá.
   - donut/table: GIỮ NGUYÊN axisUnit() cũ (đơn vị đo, không có nhãn đáy) — ngoài phạm vi D1a.
   - bar (chart !== 'donut', view !== 'table') với metric !== 'pct': trục dọc đổi sang mã hoá TÊN
     CHIỀU (`dim.label`, vd "Theme · vì sao") vì đó là thứ trục thực sự phân loại theo; ĐƠN VỊ ĐO
     (BASE_AXIS[dim.base]) dời xuống `bottomLabel` — quay dọc không đủ chỗ cho cả hai (VAxisLabel.tsx).
   - bar với metric==='pct': GIỮ NHÁNH CŨ (không đủ căn cứ để đổi — % trên tổng không mã hoá theo
     dim.base), không có nhãn đáy. */
function chartAxisLabels(
  item: QuantifyShow,
  dim: Dim | undefined,
  effectiveView: QuantifyView,
): { vAxis: string; bottomAxis?: string } {
  if (!dim) return { vAxis: "" };
  const isBarChart = effectiveView !== "table" && item.chart !== "donut";
  if (isBarChart && item.metric !== "pct") {
    return { vAxis: dim.label, bottomAxis: BASE_AXIS[dim.base] };
  }
  return { vAxis: axisUnit(item, dim) };
}

/* Dải denom (Card.denomStrip, R2) cho item `show` KHÔNG có `by` — "Đang hiện Top N trên M <đơn vị>"
   + mẫu số thật theo base:
   - agg: LUÔN ghi mẫu số thật (owner chốt 01/08, VOC_SCOPE='all' gộp CẢ event hành vi lẫn lời
     khách — gọi trần "bản ghi phản hồi" là nói quá). scopeTotal() là ĐỊNH NGHĨA DUY NHẤT của mẫu số
     này (domain/scope.ts) — không tính lại ở đây. Câu "≈95% là event hành vi..., không phải lời
     khách" đặt làm tooltip `title` trên dải (không in dài dòng ra card).
   - ev: BẤT BIẾN KHÔNG ĐƯỢC MẤT — phải nói rõ đây là TẬP MẪU bằng chứng, khác mẫu số aggregate;
     D0a (owner chốt 02/08) thêm SỐ THẬT (tổng thô của các rows đang hiện, KHÔNG fx()) vào câu đó —
     người dùng đếm được đúng số này khi bấm mở từng hàng (vd q3: 9+3+3+2=17, không phải 50+17+17+11
     — số cũ do fx() nhân sai vào một tập đếm được, xem Bars.tsx D0a).
   - cust: không thêm gì (mẫu số "khách trong cohort" đã đủ tự giải thích qua đơn vị + số dòng). */
function buildDenomStrip(shownRows: DimRow[], all: number, dim: Dim, data: CxmData): ReactNode {
  const shown = shownRows.length;
  /* `dim.unit` (số đếm được: "theme"/"category"/"nguồn"), KHÔNG phải `dim.label` — label là tên mô
     tả của chiều ("Theme · vì sao", "Category · intent") nên nhét vào câu đếm sẽ ra "trên 14 Theme
     · vì sao · trên tổng …", vô nghĩa. Enterpret cũng đếm bằng đơn vị: "Showing Top 3 of 3 User
     Sentiments". `dim.label` là nhãn của TRỤC PHÂN LOẠI, thuộc chỗ khác. */
  const base = `Đang hiện Top ${shown} trên ${all} ${dim.unit}`;
  if (dim.base === "agg") {
    /* "từ N nguồn" là provenance mà owner chốt ở Q4 (01/08) phải luôn đi kèm mẫu số — mẫu số 317.699
       không tự nói nó gộp cả event hành vi lẫn lời khách. S2.6a từng làm rớt cụm này; khôi phục. */
    const text = `${base} · trên tổng ${nf(fx(scopeTotal(data)))} tín hiệu từ ${scopeSources(data).length} nguồn`;
    return (
      <span title="≈95% là event hành vi (Digital analytics + eKYC SDK), không phải lời khách">{text}</span>
    );
  }
  if (dim.base === "ev") {
    // N = tổng thô (KHÔNG fx()) của các rows ĐANG HIỆN — đúng số bằng chứng người dùng đếm được.
    const sampleN = shownRows.reduce((a, r) => a + r.v, 0);
    return `${base} · ${nf(sampleN)} bằng chứng mẫu, không phải toàn bộ bản ghi`;
  }
  return base;
}

/* Kỳ tuyệt đối cho Card.subtitle — bản thật đã bỏ kỳ global, fx() luôn scale theo baseline 6 tháng
   cố định (domain/format.ts, BASE_FACTOR=5.6). Tra data.periods để lấy đúng label+range của kỳ đó
   thay vì hardcode chuỗi ngày — nếu seed đổi baseline thì kỳ vẫn khớp fx() không cần sửa ở đây. */
function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

/* Màu mặc định khi row.c vắng — PHẢI khớp DEFAULT_BAR_COLOR (Bars.tsx): thanh xám đó vẫn xuất hiện
   trên chart nên khoá màu (legend) không được bỏ sót nó. */
const UNASSIGNED_BAR_COLOR = "var(--ink3)";

/* Khoá màu cho nhánh Bars (rank, không donut/table) — quyết định LUẬT do S2.6a+ chốt: màu thanh mã
   hoá `data.cats` (intent) nhưng không phải chart nào cũng đúng — chỉ chú giải khi màu THẬT SỰ gom
   nhóm, không phải khi màu chỉ lặp lại nhãn hàng (vd q3 Category · intent: 4 hàng, mỗi hàng 1 màu —
   chú giải ở đây thừa vì hàng đã tự nói tên rồi) và không phải khi màu đến từ thang khác (vd
   User Sentiment dùng pos/neu/neg, không khớp `data.cats`).
   - Mọi màu XUẤT HIỆN (kể cả undefined, coi là một "màu" riêng) phải khớp `data.cats[k].color` —
     một màu lạ (không thuộc cats) làm cả legend vô nghĩa, trả [].
   - Số màu phân biệt PHẢI < số hàng đang hiện — bằng nhau nghĩa là màu không gom nhóm gì. */
function buildLegend(allShown: DimRow[], data: CxmData): ChartLegendItem[] {
  /* Hàng gộp đuôi ("Khác (+N)", màu `--cat-other`) phải bị LOẠI trước khi đối chiếu với data.cats.
     Nó không phải một intent, nên để lẫn vào thì `items.length !== definedColors.length` ở dưới thành
     đúng và hàm trả RỖNG — tức thêm hàng "Khác" lại làm MẤT chú giải intent của cả chart (đã thấy: 3
     test QuantifyWidget đỏ). Cố ý KHÔNG thêm một mục legend cho "Khác": khác với đoạn màu trong thanh,
     hàng có NHÃN riêng ngay cạnh nó rồi — thêm mục legend chỉ là nói lại. */
  const shownRows = allShown.filter((r) => r.id !== ROW_OTHER_ID);
  if (shownRows.length === 0) return [];
  const distinctColors = new Set(shownRows.map((r) => r.c));
  if (distinctColors.size >= shownRows.length) return [];

  const definedColors = [...distinctColors].filter((c): c is string => c !== undefined);
  /* Không có màu THẬT nào — mọi thanh đều rơi về DEFAULT_BAR_COLOR xám (Bars.tsx) — thì không có gì
     để giải mã. BẮT BUỘC chặn ở đây: thiếu guard này, nhánh "chưa gán intent" bên dưới lọt qua
     (`0 !== 0` là false) và gắn chú giải MỘT mục lên 6 chart L1/L2/L3 Keyword, Nguồn, Sub-theme,
     Nền tảng — những chiều KHÔNG mang khái niệm intent, nên câu đó ngụ ý sai rằng các hàng ấy đáng
     lẽ phải có intent. Đã đo live trên dist: 7 legend thay vì 1 trước khi thêm guard. */
  if (definedColors.length === 0) return [];
  const items: ChartLegendItem[] = [];
  for (const cat of Object.values(data.cats)) {
    if (definedColors.includes(cat.color)) items.push({ label: cat.label, color: cat.color });
  }
  // Có màu THẬT xuất hiện mà không khớp cat nào (vd thang sentiment riêng) → không phải khoá intent.
  if (items.length !== definedColors.length) return [];

  if (distinctColors.has(undefined)) {
    items.push({ label: "chưa gán intent", color: UNASSIGNED_BAR_COLOR });
  }
  return items;
}

/* D2b tinh chỉnh (owner chốt 03/08): bar "Không xác định" trong chart GỘP unknown+missing làm một —
   đúng cho hình nhưng xoá mất phân biệt hai loại sentinel khác nhau (chưa biết = trục không áp dụng
   cho khách này; thiếu = lỗi thu thập, đáng lẽ phải có mà không có). Dòng text NGAY DƯỚI chart khôi
   phục phân biệt này bằng CHỮ — mini-bar coverage (SegCoverage) đã bỏ hẳn, không dựng lại. */
function buildSegDescription(seg: { known: number; unknown: number; missing: number }, segTotal: number): string {
  const pct = pv(seg.known, segTotal);
  let text = `Phủ ${pct}% (${seg.known}/${segTotal} khách có dữ liệu).`;
  const unkV = seg.unknown + seg.missing;
  if (unkV > 0) {
    text += ` Nhóm "Không xác định" gồm ${seg.unknown} chưa biết${
      seg.missing > 0 ? ` và ${seg.missing} thiếu (lỗi thu thập)` : ""
    }.`;
  }
  return text;
}

/* Widget vạn năng render một QuantifyItem — orchestrator port tinh thần từ qWidget() (prototype
   dòng 2021). Nhận toàn bộ data/dims qua props (không đọc store) để component thuần theo props. */
export function QuantifyWidget({ item, data, dims, view, cfg, limit, actions, onTitleClick, months }: QuantifyWidgetProps) {
  const period = periodLabel(data);
  /* Hàng đang mở drill-down. State sống Ở ĐÂY, không thêm prop cho caller: đặt trong widget thì MỌI
     chỗ render nó (Library, Detail, Builder preview, Overview) có drill-down mà không cần nối gì —
     đúng cái owner lo khi loại phương án (b) ("chart theme click được, chart khác không → mặt UI
     không nhất quán"). Hook phải gọi TRƯỚC mọi nhánh return bên dưới (series/cross-tab). */
  const [drillRow, setDrillRow] = useState<DimRow | null>(null);

  if (item.kind === "series") {
    /* S2.6a (R3): item series KHÔNG có denomStrip (không có rows để đếm; Card.subtitle đã mang kỳ)
       nhưng VẪN bọc VAxisLabel với đơn vị phù hợp — anomaly/trend port 1-1 cùng một đơn vị (prototype
       qWidget() dòng 2028, giữ nguyên chuỗi "theo kỳ"). Caveat Z-score KHÔNG phải đơn vị trục (R3 câu
       cuối) nên GIỮ LẠI riêng dưới dạng dòng ngang dưới chart, không nhồi vào VAxisLabel. */
    const axisText = "Số tín hiệu khách hàng theo kỳ";
    /* Cắt range CHỈ khi `months` được truyền (Overview) — KHÔNG nội suy: `.slice(-months)` trên
       chuỗi ít điểm hơn N tự nhiên trả về nguyên chuỗi đang có. Tạo mảng MỚI (không mutate item.t
       gốc từ props/store). */
    const t = months ? item.t.map((s) => ({ ...s, p: s.p.slice(-months) })) : item.t;
    /* Subtitle phải nói ĐÚNG số kỳ đang hiện, không phải baseline cố định — nếu không, card sẽ
       khẳng định một kỳ (vd "6 tháng gần nhất") trong khi chart chỉ vẽ 3 điểm sau khi lọc. */
    const shownPoints = t.length ? Math.max(...t.map((s) => s.p.length)) : 0;
    const subtitle = months ? `${shownPoints} kỳ gần nhất` : period;
    return (
      <Card title={item.name} subtitle={subtitle} actions={actions} onTitleClick={onTitleClick}>
        <VAxisLabel label={axisText}>
          {item.chart === "anomaly" ? (
            <AnomalyChart series={t} anomalyZ={cfg?.anomaly.z ?? DEFAULT_ANOMALY_Z} />
          ) : (
            <LineChart series={t} />
          )}
        </VAxisLabel>
        {item.chart === "anomaly" ? (
          /* Chuỗi ngắn hơn MIN_POINTS_FOR_ANOMALY không có ĐIỂM NÀO chấm được (zScores trả null cho
             i<3), nên câu "vòng tròn = vượt ngưỡng" sẽ mô tả một thứ không bao giờ xuất hiện — người
             xem hiểu nhầm thành "kỳ này không có bất thường". Nói thẳng là chưa đủ kỳ. */
          <div className="text-[11.5px] text-ink-3 mt-2">
            {shownPoints < MIN_POINTS_FOR_ANOMALY
              ? `chưa đủ kỳ để chấm bất thường (cần ít nhất ${MIN_POINTS_FOR_ANOMALY} kỳ, đang có ${shownPoints})`
              : "vòng tròn = vượt ngưỡng Z-score"}
          </div>
        ) : null}
      </Card>
    );
  }

  if (item.by) {
    /* Cross-tab: ma trận ghép chéo trên mẫu ev; CrossTable tự có caveat "N mẫu — tập mẫu". */
    const cx = qRunCross(item, data, dims);
    return (
      <Card title={item.name} subtitle={period} actions={actions} onTitleClick={onTitleClick}>
        {/* Spec cho phép CrossTable dùng cho cả 2 view khi chart phức tạp — ưu tiên đúng số hơn
            stacked bar riêng (xem ghi chú P1.1b, cần Opus xác nhận). */}
        <CrossTable cx={cx} />
      </Card>
    );
  }

  const dim = dims[item.show];
  const effectiveView = view ?? item.view ?? "chart";

  if (dim?.base === "cust") {
    /* S2.C3b: trục phân khúc khách (age/nav/tenure/acq/seg/tier) đi qua qRunSegment thay vì qRun —
       qRunSegment vẫn TÁCH RIÊNG hai bộ đếm known/unknown/missing ở tầng domain (xem
       domain/quantify.ts, data/segment.ts). D2b (owner chốt 03/08, bên dưới) mới là chỗ tầng hiển
       thị GỘP unknown+missing thành một hàng "Không xác định" hiện trong chart — domain KHÔNG lump. */
    const seg = qRunSegment(item, data, dims);

    if (seg.kind === "refuse") {
      return (
        <Card title={item.name} subtitle={period} actions={actions} onTitleClick={onTitleClick}>
          <div className="text-[13px] text-ink-3">{seg.reason}</div>
        </Card>
      );
    }

    /* Breakdown (Module D section 1, owner chốt 03/08): chia mỗi thanh thành đoạn màu theo chiều
       khách THỨ HAI. Số do domain đếm THẬT trên cùng một dòng Customer — xem qRunSplit. */
    const split = qRunSplit(item, data, dims);

    const knownShown = item.chart === "donut" ? seg.rows : seg.rows.slice(0, limit ?? TOP_N);
    const paintedKnown = paintCategorical(knownShown);
    /* D2b tinh chỉnh #3 (owner chốt 03/08): denomStrip "Đang hiện Top N trên M ..." chỉ có nghĩa khi
       known THẬT SỰ bị cắt bởi limit/TOP_N — seed hiện known ≤5 < TOP_N=10 nên mọi trục (nav/tenure/
       ...) không cắt gì, dòng "Top 1 trên 1" chỉ gây nhiễu. Card nhận denomStrip=undefined render
       bình thường (giống non-cust truyền null — cùng một điều kiện `denomStrip ?` ở Card.tsx). */
    const segDenomStrip =
      paintedKnown.length < seg.rows.length ? buildDenomStrip(paintedKnown, seg.rows.length, dim, data) : undefined;
    const { vAxis: segVAxis, bottomAxis: segBottomAxis } = chartAxisLabels(item, dim, effectiveView);
    /* D2b (owner chốt 03/08): "chưa biết" + "thiếu" GỘP thành một bar/lát/hàng "Không xác định" hiện
       NGAY TRONG chart (không còn dải coverage riêng SegCoverage) — ghim CUỐI, màu cố định `--unk`
       (không xoay vòng theo paintCategorical vì đây không phải một nhóm intent, mà là "không đếm
       được"). value=0 (mọi khách đều biết được) thì không thêm hàng thừa. */
    const unkV = seg.unknown + seg.missing;
    /* Gộp đuôi TRƯỚC khi ghim "Không xác định" ⇒ thứ tự ra đúng yêu cầu owner: các nhóm có tên →
       "Khác (+N)" → "Không xác định" cuối. "Khác" nằm CẠNH, không bao giờ gộp vào. */
    const shownKnown = effectiveView === "table" ? paintedKnown : foldRowTail(paintedKnown, seg.rows);
    const chartRows: DimRow[] =
      unkV > 0
        ? [...shownKnown, { id: UNKNOWN_ROW_ID, l: "Không xác định", v: unkV, c: "var(--unk)" }]
        : shownKnown;
    // Bars.total = tổng cohort thật (known+unknown+missing = data.cust.length), không phải sum(chartRows.v).
    const segTotal = seg.known + seg.unknown + seg.missing;
    // Dòng mô tả coverage bằng CHỮ dưới chart — xem buildSegDescription() ở trên.
    const segDescription = buildSegDescription(seg, segTotal);

    /* ---- Đấu nối breakdown vào tầng vẽ ----
       Chỉ chart dạng THANH vẽ được đoạn màu: donut và bảng không có chỗ cho nó. KHÔNG im lặng bỏ qua —
       im lặng thì người dùng tưởng đã chia màu mà không thấy màu nào; nói ra bằng `splitNote`. */
    const isPctStack = item.stack === "pct";
    const splitDrawn = split.kind === "draw" && effectiveView !== "table" && item.chart !== "donut";
    const splitSegments =
      split.kind === "draw" && splitDrawn ? (r: DimRow) => split.byRow[r.id] ?? [] : undefined;
    /* Legend PHẢI giải mã thang màu ĐANG vẽ: có breakdown thì màu mã hoá NHÓM CHIA (split.legend —
       nhãn + màu dùng chung cho mọi hàng nên so ngang được), không phải intent (buildLegend). Dùng sai
       bảng là chú giải cho một thang màu khác thang đang hiện. */
    const legendItems = split.kind === "draw" && splitDrawn ? split.legend : buildLegend(chartRows, data);
    /* stack='pct' làm mọi thanh dài bằng nhau ⇒ bề rộng KHÔNG còn mã hoá số lượng. Nói ở NHÃN TRỤC
       (đúng chỗ: đây là phát biểu về trục), không nhồi thêm một dòng chữ dưới card. */
    const segBottomLabel =
      isPctStack && splitDrawn ? `Tỷ trọng trong từng ${dim.unit} (100%) — bề rộng KHÔNG mã hoá số lượng` : segBottomAxis;
    const splitNote =
      split.kind === "refuse"
        ? split.reason
        : split.kind === "draw" && !splitDrawn
          ? `Chia màu theo "${dims[item.split ?? ""]?.label ?? item.split}" chỉ hiện được ở dạng thanh — chuyển sang view Chart để xem.`
          : null;

    /* Trục khách: bản ghi dưới một hàng là KHÁCH, không phải verbatim — `Evidence` có khoá khách
       (`ck`) nhưng đo 03/08 trên demoData chỉ 7/15 khoá khớp một dòng `data.cust`, nên đi qua join đó
       thì gần như mọi hàng mở ra rỗng, còn danh sách khách là số thật và đếm đủ. Xem qRunDrill. */
    const segDrill: DrillContent | null = !drillRow
      ? null
      : drillRow.id === ROW_OTHER_ID
        ? groupsContent(seg.rows.slice(paintedKnown.length), (v) => `${nf(v)} khách`)
        : qRunDrill(item, data, dims, drillRow.id);
    const segDrillKind: DrillRecordKind = drillRow?.id === ROW_OTHER_ID ? "group" : "cust";

    return (
      <Card
        title={item.name}
        subtitle={period}
        denomStrip={segDenomStrip}
        actions={actions}
        onTitleClick={onTitleClick}
      >
        <VAxisLabel label={segVAxis} bottomLabel={segBottomLabel}>
          {effectiveView === "table" ? (
            <DataTable rows={chartRows} labelHeader={dim.label} scaled={false} />
          ) : item.chart === "donut" ? (
            <Donut rows={chartRows} centerLabel={BASE_NOUN[dim.base]} scaled={false} pinnedLastId={UNKNOWN_ROW_ID} />
          ) : (
            <>
              <Bars
                rows={chartRows}
                pctMode={item.metric === "pct"}
                scaled={false}
                total={segTotal}
                segments={splitSegments}
                stackPct={isPctStack}
                onRowClick={setDrillRow}
              />
              <ChartLegend items={legendItems} />
            </>
          )}
        </VAxisLabel>
        {/* Dòng độ phủ KHÔNG phải "nhận định" mà là MẪU SỐ đếm được — bất biến của thiết kế (mẫu số
            luôn là toàn bộ cohort nên nhóm chưa biết không bị lặng lẽ loại). Dòng `item.note` (nhận
            định) đã bỏ khỏi mọi card theo owner chốt 03/08 "card nên clean nhất có thể"; note giờ chỉ
            hiện ở màn chi tiết (QuantifyDetail). */}
        <div className="text-[11.5px] text-ink-3 mt-2">{segDescription}</div>
        {splitNote ? <div data-testid="split-note" className="text-[11.5px] text-ink-3 mt-1">{splitNote}</div> : null}
        {/* Đặt TRONG Card cho gần chỗ sinh ra nó; Modal tự portal ra body nên không bị overflow của
            card cắt. Render có điều kiện (không chỉ `open`) để không dựng panel khi chưa bấm gì. */}
        {drillRow && segDrill ? (
          <DrillPanel
            open
            rowLabel={drillRow.l}
            content={segDrill}
            recordKind={segDrillKind}
            onClose={() => setDrillRow(null)}
          />
        ) : null}
      </Card>
    );
  }

  const allRows = qRun(item, data, dims);
  // Donut hiện tất cả lát; rank/bảng cắt theo limit từ filter số lượng (mặc định TOP_N).
  // paintCategorical NGAY SAU KHI CẮT — chart chưa có màu intent nào thì gán --cat-N xoay vòng theo
  // index (hết cảnh mọi bar xám); chart đã có intent color (>=1 row.c) thì trả nguyên rows.
  const paintedRows = paintCategorical(item.chart === "donut" ? allRows : allRows.slice(0, limit ?? TOP_N));
  /* denomStrip tính trên `paintedRows` (số nhóm CÓ TÊN RIÊNG), KHÔNG trên shownRows — nếu tính sau khi
     gộp thì hàng "Khác" bị đếm như một nhóm nữa và mẫu số nói sai. */
  const denomStrip = dim ? buildDenomStrip(paintedRows, allRows.length, dim, data) : null;
  const shownRows = effectiveView === "table" ? paintedRows : foldRowTail(paintedRows, allRows);
  const { vAxis, bottomAxis } = chartAxisLabels(item, dim, effectiveView);
  // D0a: fx() chỉ hợp lệ cho volume TỔNG HỢP (dim.base==='agg') — q3 (base='ev') không được scale.
  const scaled = dim?.base === "agg";
  /* Trục agg/ev: bản ghi dưới một hàng là BẰNG CHỨNG. Với agg, số trên thanh là tổng hợp sẵn nên danh
     sách chỉ là tập mẫu — qRunDrill trả kind:'sample' và DrillPanel buộc phải nói ra chênh lệch đó. */
  const drill: DrillContent | null = !drillRow
    ? null
    : drillRow.id === ROW_OTHER_ID
      ? groupsContent(allRows.slice(paintedRows.length), (v) => nf(scaled ? fx(v) : v))
      : qRunDrill(item, data, dims, drillRow.id);
  const drillKind: DrillRecordKind = drillRow?.id === ROW_OTHER_ID ? "group" : "ev";

  return (
    <Card title={item.name} subtitle={period} denomStrip={denomStrip} actions={actions} onTitleClick={onTitleClick}>
      <VAxisLabel label={vAxis} bottomLabel={bottomAxis}>
        {effectiveView === "table" ? (
          <DataTable rows={shownRows} labelHeader={dim?.label} scaled={scaled} />
        ) : item.chart === "donut" ? (
          <Donut rows={shownRows} centerLabel={dim ? BASE_NOUN[dim.base] : undefined} scaled={scaled} />
        ) : (
          <>
            <Bars rows={shownRows} pctMode={item.metric === "pct"} scaled={scaled} onRowClick={setDrillRow} />
            <ChartLegend items={buildLegend(shownRows, data)} />
          </>
        )}
      </VAxisLabel>
      {drillRow && drill ? (
        <DrillPanel
          open
          rowLabel={drillRow.l}
          content={drill}
          recordKind={drillKind}
          onClose={() => setDrillRow(null)}
        />
      ) : null}
    </Card>
  );
}
