import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { CxmData, Signal } from "../../data/schema/index.ts";
import { isSignalRunning, signalFeedLast } from "../../domain/index.ts";
import { Badge } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { SIGNAL_STATUS } from "../atlas/signalStatus.ts";
import {
  PHASE_BROKEN,
  PHASE_BROKEN_LABEL,
  SRC_UNLINKED,
  signalPhaseId,
  type SignalFilter,
  type SignalPhaseGroup,
} from "./facets.ts";

/* Bảng 30 điểm đo — F1 (số dòng LUÔN bằng data.signals.length, không lọc theo bước/flow nào đang
   chọn, module-i-signal-registry-charter.md §14 lát I4a). Dùng lại SIGNAL_STATUS
   (features/atlas/signalStatus.ts) cho cột trạng thái tin dùng — KHÔNG viết lại câu chữ.

   D6 (charter): `Signal.seen` là chuỗi NGƯỜI GÕ, không có năm — hiện NGUYÊN VĂN kèm phần xuất xứ
   "(người khai)" trên nhãn cột, KHÔNG suy tuổi/số ngày im lặng từ nó.

   Lát I4b: mỗi dòng bấm được để mở hồ sơ một điểm đo (`onSelect`, cùng khuôn `src-row-*` của
   SourcesPage.tsx) — caller (SignalsPage) quyết định hiện gì khi bấm, bảng này không tự biết về
   hồ sơ.

   12/08 (redesign): `matched` là tập điểm đo khớp bộ lọc đang đặt. Khớp thì giữ nguyên độ đậm, phần
   còn lại MỜ ĐI nhưng VẪN Ở ĐÓ — F1 nói số dòng luôn bằng tổng, nên bộ lọc ở màn này tô chứ không
   cắt. `matched === null` (chưa ai chạm bộ lọc) ⇒ bảng không tô gì.
   `selectedId` là dòng vừa mở hồ sơ, tô lại khi quay về để không phải dò lại chỗ cũ.

   12/08 chiều (owner) — BẢNG CHIA NHÓM THEO PHASE và dòng không khớp mờ TẠI CHỖ, không đẩy lên đầu.
   Lý do owner nêu: tên event sau này lên tới vài trăm. Ở quy mô đó một danh sách phẳng không thao
   tác được, mà "đẩy lên đầu" lại làm bảng nhảy chỗ mỗi lần lọc. Phase là thứ bậc LUÔN ĐỨNG YÊN;
   lọc chỉ làm mờ, và mỗi tiêu đề nhóm tự khai "N/M khớp" của riêng nhóm đó.
   Tiêu đề nhóm KHÔNG mang `data-testid="signal-row-*"` — testid đó là cách test đếm F1, thêm dòng
   không phải điểm đo vào đó là tự phá mẫu số.

   12/08 chiều (owner) — BỎ CỘT "Phía đo". Nó ghép `es` với số nền tảng thành một ô mà không cột nào
   khác đọc tới, và ở bảng vài trăm dòng thì đó là bề ngang trả cho một dữ kiện tra được trong hồ sơ.
   Cả hai dữ kiện CÒN NGUYÊN ở mặt 1 của SignalProfile.

   12/08 chiều (owner, §10c lối (i)) — CỘT MỐC THẤY CUỐI ĐỔI XUẤT XỨ THEO TỪNG DÒNG. Điểm đo đã nối
   nguồn (`srcId`) hiện mốc giao của NGUỒN — máy ghi, đối chiếu được. Điểm đo chưa nối vẫn hiện
   `Signal.seen` và phải NÓI RÕ "người khai" ngay tại dòng (điều D6: nhãn không được im về việc số
   này do người gõ). Vì xuất xứ nay khác nhau giữa các dòng nên phần "(người khai)" rời khỏi nhãn
   cột — để trên nhãn cột là khai sai cho những dòng đã có mốc máy.

   12/08 (redesign layout) — bốn quyết định:
   1. BẢNG NẰM TRÊN MẶT GIẤY RIÊNG (khung `bg-surface` + viền), không còn trôi trần trên nền màn.
      Hàng tiêu đề dính (sticky) đã tô `bg-surface` từ trước, nhưng nền màn phía sau là `--bg` xám
      ấm — nên lúc cuộn, dải tiêu đề hiện ra như một mảng trắng không thuộc về đâu. Khung này là cái
      nó vốn phải dính vào. KHÔNG bọc `overflow-hidden` để bo góc: ancestor có overflow là mất luôn
      `position: sticky` của hàng tiêu đề.
   2. Ô TÌM ĐỨNG TRONG THANH CÔNG CỤ CỦA CHÍNH BẢNG, cùng hàng với số đang tô và mốc số liệu — ba
      thứ đều nói về "bảng đang hiện cái gì".
   3. CỘT SỐ CĂN PHẢI, cột trạng thái chạy căn giữa. Lưu lượng là dãy số nhiều chữ số: căn trái thì hàng
      nghìn của dòng này nằm dưới hàng chục của dòng kia, muốn so hai dòng phải đọc từng chữ số.
   4. Kính lúp vẽ bằng SVG chứ không dùng ký tự 🔍: emoji đổi hình theo hệ điều hành và không nhận
      `currentColor`, nên nó không bao giờ khớp nét/màu với phần còn lại của màn.

   12/08 tối (owner chốt) — THU GỌN NHÓM. Owner hỏi thẳng "tại sao tôi vẫn chưa thu gọn được nhóm",
   tức là quyết định F1 mà bản trước để ngỏ nay đã có người quyết. Thu gọn ĐÚNG LÀ ẩn dòng, nên nó
   chỉ hợp lệ nhờ một điều kiện: TIÊU ĐỀ NHÓM Ở LẠI VÀ CÒN NGUYÊN SỐ ĐẾM. Chính charter F1 nói lý do
   cấm ẩn dòng là *"mẫu số rời khỏi màn thì không còn là kiểm kê"* — nhóm thu gọn vẫn khai đủ
   "N/M khớp" (hoặc "N điểm đo"), nên mẫu số không rời khỏi màn, chỉ có phần thân rời khỏi màn theo
   ĐÚNG Ý người dùng. Khác hẳn bộ lọc: bộ lọc cắt dòng thì người dùng KHÔNG biết mình đang không
   thấy gì.
   Ba ràng buộc kèm theo, test ghim cả ba:
   · mặc định MỞ HẾT — không màn nào mở ra đã giấu sẵn dữ liệu;
   · thu gọn KHÔNG đổi một con số nào (`matched`, số ở tiêu đề nhóm, số ở thanh công cụ);
   · đi tới/lui trong hồ sơ vẫn chạy hết `data.signals` theo thứ tự bảng, KỂ CẢ điểm đo nằm trong
     nhóm đang thu gọn — thu gọn là việc của mắt, không phải của phạm vi dữ liệu.

   12/08 tối — MỐC DÍNH CỦA TIÊU ĐỀ NHÓM ĐO BẰNG MÁY, không gõ tay. Trước đây là `top-[33px]`, một
   con số bằng chiều cao hàng tiêu đề cột ĐO BẰNG MẮT. Nó sai ngay khi bảng bù cỡ chữ ở `index.css`
   đổi thang, hoặc khi một nhãn cột xuống dòng — hở một dải hoặc chồng lên nhau lúc cuộn, mà không
   test nào bắt được. Nay đọc `offsetHeight` thật của `<thead>` qua ResizeObserver. */

/* `width` là bề rộng THẬT của cột — bảng chạy `table-fixed` (xem chỗ khai `<table>` bên dưới). Để
   layout auto thì trình duyệt chia theo chữ dài nhất trong cột: cột "Tên event" có tên event dài
   nhất màn nên nó nuốt gần một phần ba bảng, cột chỉ số bị bóp xuống ba dòng chữ mỗi ô, và hàng
   tiêu đề gãy 1/2/3 dòng lởm chởm. Bốn số dưới đây cộng đúng 100%, đo bằng mắt ở 1280px.

   12/08 (owner) — TÊN CỘT THEO MỘT QUY ƯỚC, không còn câu hỏi: mỗi tên là một CỤM DANH TỪ, mở đầu
   bằng danh từ chỉ thứ mà cột chứa, không kết bằng từ để hỏi, phần bổ nghĩa xuất xứ/mẫu số nằm
   trong ngoặc hoặc sau dấu gạch.

   18/08 (owner) — THUẬT NGỮ SANG TIẾNG ANH QUY ƯỚC NGÀNH, thay các cụm tự chế: "Chỉ số được nuôi"
   → "Linked metrics", "Mốc thấy cuối" → "Last seen" (chuẩn Segment/Amplitude), "Trạng thái tin
   dùng" → "Status" (tracking-plan status), "Trạng thái chạy" → "Traffic" (chấm = đang nhận event).
   Quy ước cụm-danh-từ 12/08 vẫn áp — chỉ đổi ngôn ngữ.

   18/08 chiều (owner chốt redesign, phương án A) — BẢNG 6 CỘT CO CÒN 4: mặt bảng chỉ giữ thứ cần
   để QUÉT (tên, trạng thái, lưu lượng, mốc cuối); phần tra cứu (Linked metrics, source feed, chuỗi
   allocate) dời sang drawer mở khi bấm dòng. Hai cột gộp làm một: chấm Traffic + số Volume /day là
   HAI MẶT của cùng dữ kiện (chấm suy từ vol>0) — đứng hai cột là đếm một chuyện hai lần.

   18/08 tối (owner) — BỎ XUẤT XỨ KHỎI MẶT BẢNG: cột Last seen chỉ còn mốc trần. Vế "khai người
   gõ" của D6 dời xuống drawer + hồ sơ (một cú bấm, SignalDrawer.tsx vẫn khai "self-reported" /
   "source feed" ở từng mốc). Văn bản D6 còn ghi "ngay tại dòng" — chưa sửa theo, việc của owner. */
const HEADERS: readonly { label: string; align: "left" | "right" | "center"; width: string }[] = [
  { label: "Event", align: "left", width: "46%" },
  { label: "Status", align: "left", width: "14%" },
  { label: "Traffic", align: "right", width: "18%" },
  { label: "Last seen", align: "left", width: "22%" },
];

const ALIGN: Record<"left" | "right" | "center", string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 flex-none text-ink-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25 14 14" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
    </svg>
  );
}

/* Mũi tên xoay 90° khi mở, giống mọi cây thư mục — KHÔNG dùng ▼/▶ dạng ký tự: hai ký tự đó khác
   nhau cả cỡ lẫn baseline tuỳ font, nên lúc bấm qua lại nhìn như cả dòng nhảy chỗ. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 flex-none text-ink-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 3.5 5 4.5-5 4.5" />
    </svg>
  );
}

/** Chiều cao THẬT của hàng tiêu đề cột, đo lại mỗi khi nó đổi (bù cỡ chữ, nhãn xuống dòng, zoom).
    Trả `null` ở lần render đầu và trong môi trường không có ResizeObserver (jsdom cũ) — chỗ dùng
    phải có số dự phòng, đừng để `top: undefined` biến tiêu đề nhóm thành không dính. */
function useElementHeight<T extends HTMLElement>(ref: React.RefObject<T | null>): number | null {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setH(el.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}

/* Ô lọc theo trường. `<select>` chứ không phải chip: bốn trường này có 4–8 giá trị mỗi trường (và
   phase sẽ còn thêm), trải hết ra thành chip thì thanh công cụ dài hơn cả bảng. Ba chip của khối ①
   ở lại vì chúng là ba con số người dùng vừa đọc ngay phía trên, không phải một danh mục. */
function FilterSelect({
  label,
  value,
  onChange,
  testId,
  children,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  testId: string;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={label}
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`max-w-[190px] rounded-lg border bg-surface px-2 py-1.5 text-[12.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
        value === "" ? "border-line text-ink-2" : "border-primary-line bg-primary-soft text-ink"
      }`}
    >
      {children}
    </select>
  );
}

export type SignalTableProps = {
  data: CxmData;
  onSelect: (id: string) => void;
  matched: Set<string> | null;
  selectedId: string | null;
  filter: SignalFilter;
  onFilter: (next: SignalFilter) => void;
  /** Bảng đã chia nhóm — dựng ở caller để hồ sơ đi tới/lui theo ĐÚNG thứ tự này. */
  groups: readonly SignalPhaseGroup[];
  /** `phaseId` của những nhóm đang thu gọn. Rỗng = mở hết (mặc định). Ở caller chứ không ở đây:
      mở hồ sơ một điểm đo thì bảng bị THAY, component này unmount — để state ở đây là mỗi lần
      quay về từ hồ sơ lại mở bung hết nhóm, đúng thứ `lastOpenedId` sinh ra để tránh. */
  collapsed: ReadonlySet<string>;
  onCollapsed: (next: ReadonlySet<string>) => void;
};

export function SignalTable({
  data,
  onSelect,
  matched,
  selectedId,
  filter,
  onFilter,
  groups,
  collapsed,
  onCollapsed,
}: SignalTableProps) {
  const set = (patch: Partial<SignalFilter>) => onFilter({ ...filter, ...patch });
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const theadH = useElementHeight(theadRef);
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.phaseId));

  function toggleGroup(phaseId: string) {
    const next = new Set(collapsed);
    if (next.has(phaseId)) next.delete(phaseId);
    else next.add(phaseId);
    onCollapsed(next);
  }
  // Chỉ số nào có ít nhất một điểm đo nuôi mới vào ô lọc: bày một lựa chọn chắc chắn cho 0 dòng
  // khớp là mời người dùng vào ngõ cụt.
  const metricsInUse = data.metrics.filter((m) => data.signals.some((s) => s.metrics.includes(m.id)));
  const sourcesInUse = data.sources.filter((src) => data.signals.some((s) => s.srcId === src.id));
  const hasUnlinked = data.signals.some((s) => s.srcId === null);

  function activate(e: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onSelect(id);
  }

  return (
    <div className="rounded border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
        <div className="flex min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 focus-within:border-primary-line focus-within:ring-2 focus-within:ring-[var(--primary-ring)]">
          <SearchIcon />
          <input
            type="text"
            value={filter.query}
            onChange={(e) => set({ query: e.target.value })}
            aria-label="Search signals"
            placeholder="Event, label, metric, step, phase"
            data-testid="signal-table-search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
          />
          {filter.query ? (
            <button
              type="button"
              onClick={() => set({ query: "" })}
              aria-label="Clear search"
              data-testid="signal-table-search-clear"
              className="flex-none rounded text-ink-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              <ClearIcon />
            </button>
          ) : null}
        </div>

        <FilterSelect
          label="Filter by phase"
          testId="signal-filter-phase"
          value={filter.phaseId ?? ""}
          onChange={(v) => set({ phaseId: v === "" ? null : v })}
        >
          <option value="">All phases</option>
          {data.phases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} {p.name}
            </option>
          ))}
          {data.signals.some((s) => signalPhaseId(data, s) === PHASE_BROKEN) ? (
            <option value={PHASE_BROKEN}>{PHASE_BROKEN_LABEL}</option>
          ) : null}
        </FilterSelect>

        <FilterSelect
          label="Filter by status"
          testId="signal-filter-st"
          value={filter.st ?? ""}
          onChange={(v) => set({ st: v === "" ? null : (v as Signal["st"]) })}
        >
          <option value="">All statuses</option>
          {(Object.keys(SIGNAL_STATUS) as Signal["st"][]).map((st) => (
            <option key={st} value={st}>
              {SIGNAL_STATUS[st].label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Filter by metric"
          testId="signal-filter-metric"
          value={filter.metricId ?? ""}
          onChange={(v) => set({ metricId: v === "" ? null : v })}
        >
          <option value="">All metrics</option>
          {metricsInUse.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Filter by source"
          testId="signal-filter-src"
          value={filter.srcId ?? ""}
          onChange={(v) => set({ srcId: v === "" ? null : v })}
        >
          <option value="">All sources</option>
          {sourcesInUse.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          {hasUnlinked ? <option value={SRC_UNLINKED}>No source linked</option> : null}
        </FilterSelect>

        {/* Một nút cho cả bảng: ở vài trăm điểm đo, thu gọn tám phase bằng tám cú bấm là việc thừa.
            Nhãn nói VIỆC SẼ XẢY RA khi bấm, không nói trạng thái đang có. */}
        <button
          type="button"
          data-testid="signal-groups-toggle-all"
          onClick={() => onCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.phaseId)))}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink-2 hover:border-primary-line hover:bg-primary-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          <Chevron open={!allCollapsed} />
          {allCollapsed ? "Expand all groups" : "Collapse all groups"}
        </button>

        <div className="ml-auto flex items-baseline gap-3 text-[12px]">
          {matched ? (
            <span
              className="rounded-[7px] border border-primary-line bg-primary-soft px-2 py-0.5 text-ink-2 tabular-nums"
              data-testid="signal-table-count"
            >
              Highlighting {matched.size} / {data.signals.length} signals
            </span>
          ) : null}
          {/* luật 12/08: bỏ hai vế dạy cách đọc cột ("Lưu lượng là số của MỘT NGÀY", "Cột Thấy lần
              cuối là mốc do người khai — không tính được im lặng bao lâu từ đó"). Xuất xứ mốc nay
              nằm ngay trong từng ô của cột. Còn lại đúng MỘT dữ kiện: mốc số liệu của lô đang xem. */}
          {data.asOf ? (
            <span className="t-meta text-[12px]" data-testid="signal-table-asof-note">
              Data as of {data.asOf}
            </span>
          ) : null}
        </div>
      </div>

      {/* `table-fixed`: với layout auto, bề rộng ở `<colgroup>` chỉ là GỢI Ý — trình duyệt vẫn kéo
          cột theo chữ dài nhất, nên hàng tiêu đề gãy 1/2/3 dòng lởm chởm và hai cột tên dài nhất
          vẫn nuốt phần của cột bên cạnh. Cố định thì bốn bề rộng dưới đây là bề rộng THẬT, hàng
          tiêu đề gãy đúng chỗ mình chọn. Ô nào dài hơn thì xuống dòng — không cắt chữ. */}
      <table className="w-full table-fixed border-collapse text-[13px]" data-testid="signal-table">
        <colgroup>
          {HEADERS.map((h) => (
            <col key={h.label} style={{ width: h.width }} />
          ))}
        </colgroup>
        <thead ref={theadRef}>
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h.label}
                /* Vạch chân tiêu đề vẽ bằng inset shadow, KHÔNG bằng border-b: trong bảng
                   border-collapse, viền của ô dính (sticky) bị gộp vào ô dưới nên nó biến mất ngay
                   khi bảng cuộn — đúng lúc cần nhất. */
                /* 18/08 (S4): hàng tiêu đề cột mang nền surface-2 — trước đây cùng bg-surface với
                   thân bảng nên ranh giới "đây là nhãn, dưới là dữ liệu" chỉ còn mỗi vạch chân. */
                className={`sticky top-0 z-10 bg-surface-2 px-3 py-2 text-xs font-semibold text-ink-2 shadow-[inset_0_-2px_0_var(--line)] ${ALIGN[h.align]}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((grp) => {
          const open = !collapsed.has(grp.phaseId);
          const key = grp.phaseId.trim();
          return (
          /* MỖI NHÓM LÀ MỘT `<tbody>` chứ không phải một hàng `<tr>` chèn giữa: nhóm là một khối
             ngữ nghĩa, và tiêu đề nhóm dính được dưới hàng tiêu đề cột chỉ khi nó đứng đầu chính
             tbody của mình. Hàng tiêu đề nhóm KHÔNG có `signal-row-*` — testid đó là mẫu số F1. */
          <tbody key={grp.phaseId} data-testid={`signal-group-${key}`}>
            <tr>
              <th
                colSpan={HEADERS.length}
                scope="colgroup"
                style={{ top: theadH ?? 33 }}
                className="sticky z-[9] border-y border-line bg-surface-2 p-0 text-left"
              >
                {/* Cả dải tiêu đề là một nút: ở bảng vài trăm dòng, bắt trúng một mũi tên 14px là
                    thao tác đắt hơn hẳn việc bấm vào chỗ nào cũng được trên dải. */}
                <button
                  type="button"
                  onClick={() => toggleGroup(grp.phaseId)}
                  aria-expanded={open}
                  data-testid={`signal-group-toggle-${key}`}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-semibold text-ink-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <Chevron open={open} />
                  <span>
                    <span className="tabular-nums text-ink-3">{grp.code}</span> {grp.name}
                  </span>
                  {/* Số đếm Ở LẠI khi nhóm thu gọn — đó là điều kiện DUY NHẤT khiến thu gọn không
                      phá F1: mẫu số không rời khỏi màn. */}
                  <span className="font-normal tabular-nums text-ink-3">
                    {grp.matched === null ? (
                      `${grp.signals.length} signals`
                    ) : (
                      <span data-testid={`signal-group-count-${key}`}>
                        {grp.matched} / {grp.signals.length} match
                      </span>
                    )}
                  </span>
                </button>
              </th>
            </tr>
            {(open ? grp.signals : []).map((sig) => {
              const running = isSignalRunning(sig);
              const status = SIGNAL_STATUS[sig.st];
              const dimmed = matched ? !matched.has(sig.id) : false;
              const feedLast = signalFeedLast(sig, data.sources);
              return (
                <tr
                  key={sig.id}
                  data-testid={`signal-row-${sig.id}`}
                  onClick={() => onSelect(sig.id)}
                  onKeyDown={(e) => activate(e, sig.id)}
                  tabIndex={0}
                  aria-current={sig.id === selectedId ? "true" : undefined}
                  className={`cursor-pointer transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                    sig.id === selectedId ? "bg-primary-soft" : "hover:bg-surface-2"
                  } ${dimmed ? "opacity-50" : ""}`}
                >
                  <td className="border-b border-line-soft px-3 py-2">
                    <code className="font-mono text-[12px] text-primary">{sig.name}</code>
                    <div className="t-meta text-[12px] mt-0.5">{sig.desc}</div>
                  </td>
                  <td className="border-b border-line-soft px-3 py-2 whitespace-nowrap">
                    <Badge state={status.badge} text={status.label} />
                  </td>
                  <td
                    className="border-b border-line-soft px-3 py-2 text-right tabular-nums whitespace-nowrap"
                    data-testid={`signal-running-${sig.id}`}
                    aria-label={running ? "receiving traffic" : "no traffic"}
                  >
                    {/* Chấm vẽ bằng hộp chứ không bằng ký tự ●/○: hai ký tự đó khác nhau cả cỡ lẫn
                        trọng lượng nét tuỳ font, nên cột này lúc nhìn lướt không thành hai mức rõ. */}
                    <span
                      className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${
                        running ? "bg-ink" : "border border-ink-3"
                      }`}
                    />
                    {sig.vol ? `${nf(sig.vol)}/day` : "—"}
                  </td>
                  {/* 18/08 tối (owner): mốc trần, không kèm xuất xứ — xuất xứ nằm ở drawer/hồ sơ
                      (D6 khai ở đó). Vẫn ưu tiên mốc máy của nguồn khi có, y hệ trước. */}
                  <td className="border-b border-line-soft px-3 py-2">
                    {feedLast ? (
                      <span className="t-meta">{feedLast}</span>
                    ) : sig.seen ? (
                      <span className="t-meta">{sig.seen}</span>
                    ) : (
                      <span className="text-ink-3">never</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          );
        })}
      </table>
    </div>
  );
}
