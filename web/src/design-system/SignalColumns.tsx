import type { JSX } from "react";
import { Badge } from "./Badge.tsx";
import { ChartLegend, type ChartLegendItem } from "./ChartLegend.tsx";
import { Note } from "./Note.tsx";
import { nf, pv } from "./format.ts";

/* Cột nhóm theo điểm đo — trình bày Cách B đã CHỐT (output/thiet-ke-chart-signal-bo-sung-dot-2.html
   Đ1/Đ2/Đ3) và các ràng buộc trung thực ở output/thiet-ke-chart-signal.html §3/§7/§9. Component CHỈ
   trình bày: không đọc store/data/domain, nhận SigColGroup[] đã dựng sẵn ở tầng trên (domain/signalChart.ts).

   Bất biến nặng nhất (Đ1 đoạn cuối + Đ2, rule 6 của contract): KHÔNG figure nào ở đây được cộng/chia
   xuyên hai điểm đo — mỗi nhóm cột có chân đế RIÊNG (tổng + % chưa gắn được khách của CHÍNH nó), không
   có dòng tổng chung. Rule 4 (sửa lại): thang chiều cao là CỦA RIÊNG từng nhóm — cột cao nhất của
   CHÍNH nhóm đó mới là 100% MAX_H, không có mẫu số nào dùng chung giữa các nhóm nữa. Vì vậy rule 6
   giờ đúng TUYỆT ĐỐI, không còn ngoại lệ "hình học" nào cả — và vì hai nhóm không còn cùng thang, phải
   nói rõ bằng chữ rằng chiều cao không so được giữa hai nhóm (xem dòng ngay dưới header). */

/** Ba nghĩa "không biết" KHÁC NHAU (index.css dòng 33-40: `--unk`/`--unk-gap` đã tồn tại đúng cho việc
    này, chart theme dùng 4 token cho 4 nghĩa) — KHÔNG được gộp vào một màu xám, vì đó là đúng phép gộp
    mà cả dự án tồn tại để tránh (chỉ là gộp bằng màu thay vì bằng số). `"unknown-yet"` = "chưa biết, đợi
    sẽ có"; `"missing"` = "thiếu, dữ liệu lỗi"; `"not-identified"` = "chưa gắn được với khách nào" (đúng
    dòng "x% lần bắn chưa gắn được khách" — output/thiet-ke-chart-signal.html §3). */
export type SigColUnknown = "unknown-yet" | "missing" | "not-identified";

/** Một lát trong một cột — `label` đã sẵn dạng hiển thị (không tự làm đẹp lại). `unknown`: `null` = dải
    có tên thật (tô theo rule 1); một trong ba giá trị trên = một nghĩa "không biết" CỤ THỂ, mỗi nghĩa
    một cách vẽ riêng (xem UNKNOWN_STYLE) — KHÔNG tự suy loại nào từ chữ trong label, tầng trên quyết
    định. */
export type SigColSlice = { label: string; n: number; unknown: SigColUnknown | null };

/** Một cột = một giá trị của CHÍNH điểm đo đang xét. `total` là con số tổng "chính thức" của cột (từ
    bảng đếm), dùng làm mẫu số thang chiều cao (rule 4) — có thể lệch Σslice.n, xem rule 8. */
export type SigColBar = {
  val: string;
  declared: boolean;
  total: number;
  slices: readonly SigColSlice[];
};

/** Một nhóm = một điểm đo đã chọn. `notIdentified`/`notIdentifiedPct` là thuộc tính của CHÍNH điểm đo
    (không phải của chiều đang hiển thị) — `notIdentifiedPct` được giữ trong shape để khớp đúng
    domain/signalChart.ts (SigGroup), nhưng chân đế (rule 7) in % bằng `pv(notIdentified, vol)` để có
    đúng định dạng vi-VN dùng chung toàn design-system, không in trực tiếp tỉ số thô này. */
export type SigColGroup = {
  sigId: string;
  title: string;
  vol: number;
  bars: readonly SigColBar[];
  notIdentified: number | null;
  notIdentifiedPct: number | null;
};

export type SignalColumnsProps = {
  groups: readonly SigColGroup[];
  dimLabel: string;
};

/** Cùng quy ước xoay vòng --cat-1..5 với paintCategorical.ts (không dùng lại được hàm đó vì nó làm
    trên DimRow, ở đây phải gán MỘT LẦN ở cấp toàn chart — rule 1). */
const CAT_CYCLE = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

/** Bảng màu --cat-1..5 chỉ có 5 màu — KHÔNG mở rộng thêm (constraint: không bịa token màu mới). Vượt
    ngưỡng này phải LỘ RA bằng chữ, không được để hai nhãn trùng màu trong im lặng. */
const MAX_CAT_COLORS = CAT_CYCLE.length;

/** Cách vẽ CỐ ĐỊNH cho từng nghĩa "không biết" — dùng ĐÚNG token đã có ở index.css, KHÔNG mượn
    `--unk-anon`/`--unk-join`: hai token đó đã mang nghĩa khác ở chart theme (Ẩn danh/Chưa đối chiếu
    được) — mượn sẽ dạy người dùng đọc sai màu ở màn khác. `"not-identified"` dùng VÂN "xám có khe" —
    xen `--unk` với `--surface` (KHÔNG xen với `--unk-gap`: hai màu đặc cạnh nhau trong một ô legend
    14px đọc thành một màu bùn lẫn giữa hai ô "unknown-yet"/"missing" bên cạnh, phân biệt bằng PHA MÀU
    chứ không bằng hoa văn). Đúng ký hiệu `░` (dải rỗng có khe) ở sketch §1, khác dải đặc `▉`/`▓`; tiền
    lệ `repeating-linear-gradient` trong stream này: JourneySpine.tsx dòng 55 (hatch dải rơi). */
const UNKNOWN_STYLE: Record<SigColUnknown, string> = {
  "unknown-yet": "var(--unk)",
  missing: "var(--unk-gap)",
  "not-identified": "repeating-linear-gradient(45deg, var(--unk), var(--unk) 3px, var(--surface) 3px, var(--surface) 6px)",
};

/** Thứ tự CỐ ĐỊNH giữa ba nghĩa "không biết" — KHÔNG xếp theo Σn như dải có tên (rule 1): ba nghĩa
    phải luôn ở cùng một chỗ để mắt người xem học được, không nhảy vị trí theo dữ liệu. */
const UNKNOWN_ORDER: readonly SigColUnknown[] = ["unknown-yet", "missing", "not-identified"];

/** Tham chiếu 100% chiều cao cho cột cao nhất CỦA TỪNG NHÓM (rule 4, sửa lại) — mỗi nhóm tự có mẫu
    số riêng (`groupMaxTotal`, tính trong Group), KHÔNG dùng chung giữa các nhóm. Lý do: sg2 (2840)
    đứng cạnh sg4 (bốn cột ~100) mà dùng một thang chung thì bốn cột của sg4 bị nén sát sàn, cao gần
    bằng nhau — mất hẳn phần "giá trị nào nhiều hơn giá trị nào" trong CHÍNH điểm đo đó, đúng công dụng
    chart này tồn tại để trả lời. */
const MAX_H = 140;

/** Sàn hiển thị (px) cho một lát có n>0 — idiom Math.max(...) như JourneySpine.tsx dòng 113-114, để
    lát mỏng vẫn còn thấy được (rule 5). */
const SLICE_MIN_PX = 3;

/** Gom nhãn DUY NHẤT của các dải CÓ TÊN THẬT (unknown===null) trong TOÀN CHART (mọi nhóm, mọi cột),
    xếp theo Σn giảm dần, tie-break theo nhãn tăng dần (rule 1/3). Đây là hàm duy nhất quyết định thứ
    hạng — không tính lại ở nơi khác để tránh hai nhóm ra hai thứ hạng khác nhau cho cùng một nhãn. */
function orderNamedLabels(groups: readonly SigColGroup[]): string[] {
  const totals = new Map<string, number>();
  for (const g of groups) {
    for (const bar of g.bars) {
      for (const s of bar.slices) {
        if (s.unknown !== null) continue;
        totals.set(s.label, (totals.get(s.label) ?? 0) + s.n);
      }
    }
  }
  return [...totals.entries()]
    .sort(([la, na], [lb, nb]) => nb - na || (la < lb ? -1 : la > lb ? 1 : 0))
    .map(([label]) => label);
}

/** Nhãn hiển thị ĐẦU TIÊN gặp cho mỗi nghĩa "không biết" có xuất hiện trong chart — dùng cho legend
    (rule 11); nghĩa nào không xuất hiện ở dữ liệu thì không có mục legend cho nghĩa đó. */
function firstLabelByUnknownType(groups: readonly SigColGroup[]): Map<SigColUnknown, string> {
  const out = new Map<SigColUnknown, string>();
  for (const g of groups) {
    for (const bar of g.bars) {
      for (const s of bar.slices) {
        if (s.unknown !== null && !out.has(s.unknown)) out.set(s.unknown, s.label);
      }
    }
  }
  return out;
}

/** Thứ hạng xếp lát trong MỌI cột (rule 3): dải có tên theo `labelRank` (rule 1), rồi ba nghĩa "không
    biết" theo UNKNOWN_ORDER cố định — không phụ thuộc Σn của riêng nghĩa đó. */
function rankOfSlice(s: SigColSlice, labelRank: Map<string, number>, namedCount: number): number {
  if (s.unknown === null) return labelRank.get(s.label)!;
  return namedCount + UNKNOWN_ORDER.indexOf(s.unknown);
}

/** Màu/vân của một lát — dải có tên dùng `colorByLabel` (rule 1); ba nghĩa "không biết" dùng ĐÚNG
    cách vẽ cố định của nghĩa đó (rule 2), không bao giờ là --cat-N. */
function colorOfSlice(s: SigColSlice, colorByLabel: Map<string, string>): string {
  return s.unknown === null ? colorByLabel.get(s.label)! : UNKNOWN_STYLE[s.unknown];
}

function BarColumn({
  sigId,
  bar,
  colorByLabel,
  labelRank,
  namedCount,
  groupMaxTotal,
}: {
  sigId: string;
  bar: SigColBar;
  colorByLabel: Map<string, string>;
  labelRank: Map<string, number>;
  namedCount: number;
  groupMaxTotal: number;
}) {
  // Rule 3: thứ tự xếp lát = thứ tự cấp toàn chart (rankOfSlice), giống nhau ở MỌI cột — không tự sắp
  // theo độ lớn riêng của cột này. Rule 14: filter() đã tạo mảng mới, sort() không mutate bar.slices.
  const ordered = [...bar.slices]
    .filter((s) => s.n > 0)
    .sort((a, b) => rankOfSlice(a, labelRank, namedCount) - rankOfSlice(b, labelRank, namedCount));
  const sliceSum = ordered.reduce((a, s) => a + s.n, 0);
  // Rule 4 (sửa lại): chiều cao cột ∝ bar.total/groupMaxTotal — mẫu số riêng của CHÍNH nhóm này, không
  // còn dùng chung với nhóm khác (xem MAX_H).
  const columnH = (bar.total / groupMaxTotal) * MAX_H;

  return (
    <div data-testid={`sigcol-bar-${sigId}-${bar.val}`} className="flex flex-col items-center gap-1 flex-none w-[46px]">
      {/* Rule 9 (nửa 1/2): tag hiện trên cột khi giá trị chưa có trong danh sách đã khai. */}
      {!bar.declared ? <Badge state="watch" text="giá trị chưa khai" /> : null}
      {/* Rule 3: unknown luôn ở CUỐI mảng đã xếp hạng. Sketch Đ1 (▓ ở trên, ░ ở đáy ngay trên dòng
          "tổng ... lượt/ngày") vẽ lát unknown nằm SÁT ĐÁY cột — dùng flex-col (không reverse) để
          phần tử cuối mảng (unknown) rơi xuống đáy khối, đúng hình đã duyệt. */}
      <div
        data-testid={`sigcol-column-${sigId}-${bar.val}`}
        className="flex flex-col w-[30px]"
        style={{ height: `${columnH}px` }}
      >
        {ordered.map((s) => {
          const h = sliceSum > 0 ? Math.max(SLICE_MIN_PX, (s.n / sliceSum) * columnH) : 0;
          return (
            <div
              key={s.label}
              data-testid={`sigcol-slice-${sigId}-${bar.val}-${s.label}`}
              title={`${s.label}: ${nf(s.n)}`}
              style={{ height: `${h}px`, background: colorOfSlice(s, colorByLabel) }}
            />
          );
        })}
      </div>
      <div className="text-[12px] text-ink-2 text-center leading-tight">{bar.val}</div>
      <div className="text-[12.5px] font-bold tabular-nums">{nf(bar.total)}</div>
    </div>
  );
}

function Group({
  group,
  colorByLabel,
  labelRank,
  namedCount,
}: {
  group: SigColGroup;
  colorByLabel: Map<string, string>;
  labelRank: Map<string, number>;
  namedCount: number;
}) {
  // Rule 8: kiểm tổng — chỉ dùng số của CHÍNH nhóm này, không cộng dồn với nhóm khác (rule 6).
  const sumBars = group.bars.reduce((a, b) => a + b.total, 0);
  const mismatch = sumBars !== group.vol;
  const undeclared = group.bars.filter((b) => !b.declared);
  // Rule 4 (sửa lại): mẫu số thang chiều cao là CỦA RIÊNG nhóm này — cột cao nhất của CHÍNH nhóm này
  // là 100% MAX_H, không đọc chartMaxTotal từ nhóm khác (rule 6 không còn ngoại lệ "hình học" nào).
  const groupMaxTotal = Math.max(...group.bars.map((b) => b.total), 1);

  return (
    <div data-testid={`sigcol-group-${group.sigId}`} className="flex-none min-w-[170px] rounded-[11px] border border-line bg-surface p-3">
      <div className="text-[13px] font-semibold mb-2">{group.title}</div>
      <div className="flex items-end gap-3" style={{ minHeight: `${MAX_H}px` }}>
        {group.bars.map((bar) => (
          <BarColumn
            key={bar.val}
            sigId={group.sigId}
            bar={bar}
            colorByLabel={colorByLabel}
            labelRank={labelRank}
            namedCount={namedCount}
            groupMaxTotal={groupMaxTotal}
          />
        ))}
      </div>
      {/* Rule 7: chân đế riêng của CHÍNH nhóm này — không có dòng tổng chung (Đ2). */}
      <div data-testid={`sigcol-footer-${group.sigId}`} className="mt-3 text-[12px] text-ink-2 space-y-0.5">
        <div>tổng {nf(group.vol)} lượt/ngày</div>
        <div>
          {group.notIdentified !== null
            ? `${pv(group.notIdentified, group.vol)}% chưa gắn được khách`
            : "chưa biết bao nhiêu lượt chưa gắn được khách"}
        </div>
      </div>
      {/* Rule 10: điểm đo chỉ bắn một giá trị — nói rõ, không tự làm gì khác. */}
      {group.bars.length === 1 ? (
        <div data-testid={`sigcol-single-${group.sigId}`} className="mt-2">
          <Note>Điểm đo này chỉ bắn một giá trị — cột chính là toàn bộ lượt bắn.</Note>
        </div>
      ) : null}
      {/* Rule 8: lệch bảng đếm phải LỘ RA, không im lặng sửa số. */}
      {mismatch ? (
        <div data-testid={`sigcol-mismatch-${group.sigId}`} className="mt-2">
          <Note tone="crit">
            cộng các cột được {nf(sumBars)} nhưng tổng của điểm đo là {nf(group.vol)} — bảng đếm đang lệch
          </Note>
        </div>
      ) : null}
      {/* Rule 9 (nửa 2/2): báo lên để người khai bổ sung — một dòng cho mỗi giá trị chưa khai. */}
      {undeclared.map((bar) => (
        <div key={bar.val} data-testid={`sigcol-undeclared-${group.sigId}-${bar.val}`} className="mt-2">
          <Note tone="warn">
            Giá trị "{bar.val}" chưa có trong danh sách đã khai của điểm đo — cần người khai bổ sung.
          </Note>
        </div>
      ))}
    </div>
  );
}

export function SignalColumns({ groups, dimLabel }: SignalColumnsProps): JSX.Element {
  // Rule 13: rỗng → nói thẳng, không dựng khung rỗng giả vờ có dữ liệu.
  if (groups.length === 0) {
    return (
      <div data-testid="signal-columns" className="min-w-0">
        <Note>Chưa có điểm đo nào được chọn.</Note>
      </div>
    );
  }

  // Rule 1: màu gán MỘT LẦN ở cấp toàn chart, từ nhãn có tên thật, theo Σn giảm dần toàn chart — thứ
  // hạng riêng của từng cột/nhóm không ảnh hưởng tới màu.
  const nonUnknownOrder = orderNamedLabels(groups);
  const colorByLabel = new Map(nonUnknownOrder.map((label, i) => [label, CAT_CYCLE[i % CAT_CYCLE.length]] as const));
  const labelRank = new Map(nonUnknownOrder.map((label, i) => [label, i] as const));
  const namedCount = nonUnknownOrder.length;

  // Rule 11: legend một hàng, nhãn có tên thật theo thứ tự cấp toàn chart trước, ba nghĩa "không biết"
  // sau cùng theo UNKNOWN_ORDER cố định (chỉ nghĩa nào thực sự xuất hiện mới có mục legend).
  const unknownLabels = firstLabelByUnknownType(groups);
  const legendItems: ChartLegendItem[] = [
    ...nonUnknownOrder.map((label) => ({ label, color: colorByLabel.get(label)! })),
    ...UNKNOWN_ORDER.filter((t) => unknownLabels.has(t)).map((t) => ({ label: unknownLabels.get(t)!, color: UNKNOWN_STYLE[t] })),
  ];

  // Sửa 2: bảng --cat-1..5 chỉ có MAX_CAT_COLORS màu — vượt ngưỡng phải LỘ RA bằng chữ, không được để
  // hai nhãn trùng màu trong im lặng (không phải figure cộng xuyên nhóm — đây là tính chất của cả
  // chart/bảng màu, không phạm rule 6).
  const colorOverflow = Math.max(0, namedCount - MAX_CAT_COLORS);

  return (
    <div data-testid="signal-columns" className="min-w-0">
      <div className="text-[13px] font-semibold text-ink-2 mb-1">Nhìn theo: {dimLabel}</div>
      {/* Rule 4 (sửa lại) đổi lấy nguy cơ đọc nhầm mà Đ1 đã cảnh báo ("rất dễ muốn đọc 410 trên 920 =
          45%… hai nhóm đứng cạnh nhau để so, không để chia") — giờ thang riêng từng nhóm nên NGAY CẢ
          chiều cao cũng không so được giữa hai nhóm nữa, phải nói thẳng bằng chữ. */}
      <div data-testid="sigcol-scale-note" className="text-[12px] text-ink-3 mb-2">
        Chiều cao cột đọc trong từng nhóm — hai nhóm không so chiều cao với nhau.
      </div>
      {colorOverflow > 0 ? (
        <div data-testid="sigcol-color-overflow" className="mb-2">
          <Note tone="warn">
            chart đang có {namedCount} nhóm giá trị nhưng bảng màu chỉ có {MAX_CAT_COLORS} — {colorOverflow} nhóm đang
            dùng lại màu của nhóm khác, cần bổ sung màu trước khi tin vào hình.
          </Note>
        </div>
      ) : null}
      {/* Rule 12: chỉ khung NÀY cuộn ngang — wrapper ngoài không có overflow riêng. */}
      <div data-testid="sigcol-groups-row" className="flex gap-3 overflow-x-auto py-1">
        {groups.map((g) => (
          <Group key={g.sigId} group={g} colorByLabel={colorByLabel} labelRank={labelRank} namedCount={namedCount} />
        ))}
      </div>
      <ChartLegend items={legendItems} />
    </div>
  );
}
