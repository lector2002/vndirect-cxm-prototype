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
   CHÍNH nhóm đó mới là 100% MAX_W, không có mẫu số nào dùng chung giữa các nhóm nữa. Vì vậy rule 6
   giờ đúng TUYỆT ĐỐI, không còn ngoại lệ "hình học" nào cả. Vì hai nhóm không còn cùng thang, chiều
   cao KHÔNG so được giữa hai nhóm — bất biến này nằm ở CÁCH TÍNH (mỗi nhóm tự co theo max của chính
   nó), không còn có câu chữ nói thẳng ra dưới header: luật giao diện 11/08 đã bỏ hẳn dòng đó (từng
   là `sigcol-scale-note`, xem chỗ đánh dấu `luật 11/08` phía dưới). */

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

/** Tham chiếu 100% chiều DÀI cho vạch dài nhất CỦA TỪNG NHÓM (rule 4) — mỗi nhóm tự có mẫu số riêng
    (`groupMaxTotal`, tính trong Group), KHÔNG dùng chung giữa các nhóm. Lý do: sg2 (2840) đứng cạnh
    sg4 (bốn giá trị ~100) mà dùng một thang chung thì bốn vạch của sg4 bị nén cụt gần bằng nhau — mất
    hẳn phần "giá trị nào nhiều hơn giá trị nào" trong CHÍNH điểm đo đó, đúng công dụng chart này tồn
    tại để trả lời.
    05/08 owner chốt đổi sang bar NGANG nên hằng này từ chiều cao thành chiều dài. Bar ngang giải quyết
    tận gốc chuyện nhãn: tên giá trị nằm bên trái trên một dòng thay vì nhồi vào cột hẹp rồi ngắt dòng,
    và mọi vạch tự cùng một mốc bắt đầu nên không còn chuyện lệch đáy như bản dọc. */
const MAX_W = 320;

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

function BarRow({
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
  // Rule 3: thứ tự xếp lát = thứ tự cấp toàn chart (rankOfSlice), giống nhau ở MỌI vạch — không tự sắp
  // theo độ lớn riêng của vạch này. Rule 14: filter() đã tạo mảng mới, sort() không mutate bar.slices.
  const ordered = [...bar.slices]
    .filter((s) => s.n > 0)
    .sort((a, b) => rankOfSlice(a, labelRank, namedCount) - rankOfSlice(b, labelRank, namedCount));
  const sliceSum = ordered.reduce((a, s) => a + s.n, 0);
  // Rule 4: chiều DÀI vạch ∝ bar.total/groupMaxTotal — mẫu số riêng của CHÍNH nhóm này (xem MAX_W).
  const barW = (bar.total / groupMaxTotal) * MAX_W;

  /* `grid-cols-[subgrid]` + `col-span-3`: mỗi giá trị vẫn là MỘT element, nhưng ba ô con của nó rơi vào
     ba CỘT của grid nhóm (nhãn · vạch · số) nên mọi hàng thẳng cột với nhau — xem docblock ở Group. */
  return (
    <div
      data-testid={`sigcol-bar-${sigId}-${bar.val}`}
      className="grid grid-cols-[subgrid] col-span-3 items-center"
    >
      {/* Nhãn nằm BÊN TRÁI trên một dòng — đây là cái lợi chính của bar ngang: tên giá trị thật
          (`insufficient_withdrawable`) không còn phải nhồi vào một cột hẹp rồi ngắt dòng. `<wbr>` sau
          mỗi dấu _ vẫn giữ làm lưới an toàn cho tên dài bất thường: CSS không coi _ là chỗ được ngắt,
          thiếu nó thì một tên quá dài đẩy toang cột nhãn thay vì xuống dòng. `<wbr>` không thêm ký tự
          nào vào textContent nên tên đầy đủ còn nguyên.
          Rule 9 (nửa 1/2): tag "giá trị chưa khai" đứng ngay cạnh nhãn của chính giá trị đó. */}
      <div className="text-[12.5px] text-ink-2 leading-tight text-right pr-2" title={bar.val}>
        {bar.val.split("_").map((phan, i, all) => (
          <span key={i}>
            {phan}
            {i < all.length - 1 ? <>_<wbr /></> : null}
          </span>
        ))}
        {!bar.declared ? (
          <span className="ml-1 inline-block align-middle">
            <Badge state="watch" text="giá trị chưa khai" />
          </span>
        ) : null}
      </div>
      {/* Rule 3: unknown luôn ở CUỐI mảng đã xếp hạng. Bản dọc vẽ lát unknown sát ĐÁY cột; bản ngang giữ
          đúng ý đó ở đầu kia của vạch — flex-row (không reverse) nên phần tử cuối mảng rơi về mút PHẢI.
          Testid vẫn là `sigcol-column-*`: tên có từ thời chart còn dọc, giữ nguyên để không phá hợp
          đồng với test — nó định danh khối chứa các lát, không nói gì về hướng vẽ. */}
      <div
        data-testid={`sigcol-column-${sigId}-${bar.val}`}
        className="flex flex-row h-[20px] rounded-[3px] overflow-hidden"
        style={{ width: `${barW}px` }}
      >
        {ordered.map((s) => {
          const w = sliceSum > 0 ? Math.max(SLICE_MIN_PX, (s.n / sliceSum) * barW) : 0;
          return (
            <div
              key={s.label}
              data-testid={`sigcol-slice-${sigId}-${bar.val}-${s.label}`}
              title={`${s.label}: ${nf(s.n)}`}
              style={{ width: `${w}px`, background: colorOfSlice(s, colorByLabel) }}
            />
          );
        })}
      </div>
      {/* Ô thứ ba: số của chính vạch này, thẳng cột với mọi hàng khác nhờ subgrid. `tabular-nums` giữ
          các chữ số cùng bề rộng nên hàng đơn vị xếp thẳng, đọc so được nhanh hơn. */}
      <div className="text-[12.5px] font-bold tabular-nums pl-2">{nf(bar.total)}</div>
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
  // là 100% MAX_W, không đọc chartMaxTotal từ nhóm khác (rule 6 không còn ngoại lệ "hình học" nào).
  const groupMaxTotal = Math.max(...group.bars.map((b) => b.total), 1);

  return (
    <div data-testid={`sigcol-group-${group.sigId}`} className="flex-none min-w-[170px] rounded-[11px] border border-line bg-surface p-3">
      <div className="text-[13px] font-semibold mb-2">{group.title}</div>
      {/* Grid BA CỘT — nhãn · vạch · số — và mỗi giá trị là một hàng dùng `grid-cols-[subgrid]`, nên ba
          ô của mọi hàng thẳng cột với nhau: nhãn cùng lề phải, mọi vạch cùng MỘT mốc bắt đầu, số cùng
          một cột. Cột nhãn để `auto` nên nó tự rộng bằng nhãn dài nhất CỦA CHÍNH nhóm này, không phải
          một con số đoán trước; cột vạch cố định `MAX_W` = vùng vẽ.
          Vì sao không còn là bar dọc: bản dọc canh các cột bằng `items-end` nên đáy vạch = đáy cột trừ
          đi chiều cao nhãn, mà nhãn dài ngắn khác nhau thì mỗi vạch bắt đầu một chỗ — bar chart mất
          đường đáy chung thì không so được nữa. Bar ngang không có bệnh đó: mốc bắt đầu là lề trái,
          nhãn nằm ngoài vùng vẽ nên dài bao nhiêu cũng không xê dịch vạch. */}
      <div
        data-testid={`sigcol-plot-${group.sigId}`}
        className="grid gap-x-0 gap-y-1.5"
        style={{ gridTemplateColumns: `auto ${MAX_W}px auto` }}
      >
        {group.bars.map((bar) => (
          <BarRow
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
      {/* Rule 7: chân đế riêng của CHÍNH nhóm này — không có dòng tổng chung (Đ2).
          19/08 (owner): bỏ đuôi "/ngày" — `group.vol` là TỔNG lượt của lựa chọn đang xem (cả đời
          hoặc đã cắt theo kỳ, volOf ở signalChart.ts), không phải tốc độ ngày; component này không
          biết cửa sổ nên sửa NHÃN cho khớp số, không bịa phép chia. */}
      <div data-testid={`sigcol-footer-${group.sigId}`} className="mt-3 text-[12px] text-ink-2 space-y-0.5">
        <div>tổng {nf(group.vol)} lượt</div>
        <div>
          {group.notIdentified !== null
            ? `${pv(group.notIdentified, group.vol)}% chưa gắn được khách`
            : "chưa biết bao nhiêu lượt chưa gắn được khách"}
        </div>
      </div>
      {/* luật 11/08: bỏ ghi chú giải thích hình dạng chart khi chỉ có một giá trị */}
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
            {/* luật 11/08: bỏ "cần người khai bổ sung" */}
            Giá trị "{bar.val}" chưa có trong danh sách đã khai của điểm đo.
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
      <div className="text-[13px] font-semibold text-ink-2 mb-1">View by: {dimLabel}</div>
      {/* Rule 4 (sửa lại) đổi lấy nguy cơ đọc nhầm mà Đ1 đã cảnh báo ("rất dễ muốn đọc 410 trên 920 =
          45%… hai nhóm đứng cạnh nhau để so, không để chia") — giờ thang riêng từng nhóm nên NGAY CẢ
          chiều cao cũng không so được giữa hai nhóm nữa. luật 11/08: bỏ hẳn câu nói thẳng bằng chữ,
          không còn `sigcol-scale-note`. */}
      {colorOverflow > 0 ? (
        <div data-testid="sigcol-color-overflow" className="mb-2">
          <Note tone="warn">
            {/* luật 11/08: bỏ "cần bổ sung màu trước khi tin vào hình" */}
            chart đang có {namedCount} nhóm giá trị nhưng bảng màu chỉ có {MAX_CAT_COLORS} — {colorOverflow} nhóm đang
            dùng lại màu của nhóm khác.
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
