import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Cfg, CxmData } from "../../data/schema/index.ts";
import {
  isSignalRunning,
  signalEvalAll,
  signalEvalWhyText,
  signalTrafficAll,
  signalTrafficText,
} from "../../domain/index.ts";
import { Badge } from "../../design-system/index.ts";
import { signalRowStatus } from "./feedStatus.ts";
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
   gõ" của D6 nay neo ở tầng HỒ SƠ (SignalProfile "Last seen (self-reported)") — drawer cũng chỉ
   mốc trần (SignalDrawer.tsx). Văn bản D6 đã sửa theo 18/08 (charter §5, dòng D6).

   18/08 tối (owner, đợt chỉnh ba cột): (1) Status — Live mang badge `good` lục (signalStatus.ts);
   (2) Traffic — BỎ chấm tròn (nó là phát biểu thứ hai của vol>0, "—" đã nói "không có traffic")
   và số bỏ dấu chấm ngăn nghìn ("9.510" đọc nhầm thành 9,51 khi cạnh chữ Anh; vol lớn nhất 4 chữ
   số, không cần nhóm hàng nghìn); (3) Last seen — "27/07 · 14:52" viết lại "27 Jul · 14:52"
   (stamp.ts), ngày đậm giờ nhạt.

   18/08 tối (owner, đợt tiếp — 4 chỉnh): (1) bỏ tick ✓ cạnh Live (Badge.tsx, state `good` thôi
   prefix); (2) cột Traffic đổi tên "Traffic per day", ô chỉ còn CON SỐ — đơn vị dời hết lên nhãn
   cột, khỏi lặp "/day" ba mươi lần; (3) cột Last seen CĂN PHẢI — cột cuối bảng mà căn trái thì
   mốc treo giữa khoảng trống 22%, căn phải cho nó tựa vào mép bảng; (4) mốc TÔ MÀU theo
   `signalFeedHealth` (bậc thang sourceHealth của #/rules, cùng bậc với badge "Source feed" ở hồ
   sơ — không dựng bậc thang thứ hai): down → đỏ --crit, stale → hổ phách --watch, còn lại giữ
   nguyên. Điểm đo CHƯA NỐI NGUỒN (srcId null, đang hiện `Signal.seen` người gõ) KHÔNG BAO GIỜ tô
   — suy "đang gặp vấn đề" từ mốc người gõ chính là điều D6 cấm.

   18/08 tối (owner, đợt tiếp nữa): "nhìn cái phải thấy được ngay… data có đang được chuyển về
   định kì không hay đang thiếu data từ các ngày gần đây" — mỗi ô Last seen mang thêm MỘT DÒNG
   TRẠNG THÁI GIAO NHẬN dưới mốc (feedStatus.ts, cùng câu chữ với badge "Source feed" ở hồ sơ):
   Receiving / Missing N days / Stopped · missing N days / No source linked. Số ngày là
   `sourceDaysMissing` — máy đếm từ mốc feed của NGUỒN so với Data as of, không phải từ
   `Signal.seen` (D6 nguyên). Dòng ok/unknown để mực thường — dòng có vấn đề là thứ màu duy nhất
   trong cột. Cùng đợt: BỎ chú thích "Data as of" ở đầu trang (SignalsPage) — nó đứng cách chú
   thích cùng chuỗi của thanh công cụ bảng ~40px, chính cái lỗi "một dữ kiện đọc thành hai" mà
   comment ở đó tự nêu; mốc neo duy nhất là của bảng, nơi các dòng trạng thái đọc số từ đó.

   18/08 tối (owner, đợt tiếp): Ô CỘT CUỐI ĐẢO THỨ BẬC — "phần chữ [trạng thái giao nhận] nên là
   thông tin chính và có màu hoặc card gì đó", "time thì bỏ giờ đi và để nhỏ ở dưới cho user biết
   khi cần", "đổi tên cột cho phù hợp". Badge trạng thái (FEED_BADGE — CÙNG badge với "Source
   feed" ở hồ sơ, không chế khung mới) đứng trên; mốc chỉ còn NGÀY, cỡ nhỏ mực nhạt, đứng dưới;
   GIỜ RỜI MẶT BẢNG — vẫn tra được ở drawer và hồ sơ (stampText đầy đủ sống ở hai tầng đó). Cột
   đổi tên "Last seen" → "Feed status" cho khớp thông tin chính mới. FEED_TONE (map tông chữ trần
   của đợt trước) bỏ theo — màu nay là việc của Badge; mốc ngày KHÔNG mang màu nữa: một ô hai thứ
   cùng đỏ là nói một chuyện hai lần. D6 nguyên: ngày là cách VIẾT LẠI chuỗi mốc, không suy tuổi. */
/* 19/08 (owner): cột "Traffic per day" đổi NGUỒN SỐ — trước đọc `Signal.vol` (tổng cả đời, xem
   docblock schema/journey.ts) đội lốt per-day; nay đếm từ hạt thô qua signalTraffic (cửa sổ 7
   ngày, domain/signalEval.ts). Nhãn cột giữ nguyên vì từ nay con số mới thật sự là per-day.

   25/08 (owner duyệt mock rd-2508-signals-f1) — GỘP HAI CỘT TRẠNG THÁI THÀNH MỘT: Status (Live) và
   Feed status (Receiving) là hai phát biểu của cùng câu hỏi "điểm đo này còn cho số dùng được
   không" — in cạnh nhau là một sự thật đọc hai lần, và ngày "27 Jul" lặp dưới mọi badge Receiving
   trong khi toolbar đã có "Số liệu tính đến". Cột gộp đọc signalRowStatus (feedStatus.ts, bốn bậc,
   ngày CHỈ hiện khi đứt). Bề ngang dôi ra trả cho cột mới "Chỉ số gắn" — chip "chưa gắn chỉ số"
   ở khối ① nay có cột đối chiếu ngay trên bảng. Đơn vị lên nhãn cột, thuần Việt ("Lượt/ngày ·
   7 ngày" = trung bình/ngày đếm trong cửa sổ 7 ngày). */
const HEADERS: readonly { label: string; align: "left" | "right" | "center"; width: string }[] = [
  { label: "Event", align: "left", width: "50%" },
  { label: "Trạng thái", align: "left", width: "22%" },
  { label: "Lượt/ngày · 7 ngày", align: "right", width: "15%" },
  { label: "Chỉ số gắn", align: "right", width: "13%" },
];

const ALIGN: Record<"left" | "right" | "center", string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/* SeenDate (ngày dưới badge Feed status) BỎ 25/08 cùng cột Feed status — ngày chỉ còn xuất hiện
   trong nhãn trạng thái khi feed đứt ("Mất dữ liệu · N ngày", signalRowStatus). Mốc đầy đủ vẫn
   tra được ở hồ sơ. */

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
  /** Luật độ tươi từ #/rules — cần cho `signalFeedHealth` tô màu cột Last seen (18/08 tối). */
  cfg: Cfg;
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
  cfg,
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
  /* 19/08 (owner): cột "Traffic per day" thôi đọc `Signal.vol` (tổng cả đời — docblock schema) mà
     ĐẾM từ hạt thô trong cửa sổ 7 ngày. Một lượt cho cả bảng, không lọc lại fires từng dòng. */
  const traffic = useMemo(() => signalTrafficAll(data.signals, data.sigFires, data.asOf), [data]);
  /* 25/08 (mock f1): số lượt tô vàng/đỏ khi chạm ngưỡng đã đặt ở Rules — cột số thôi câm. Một
     lượt cho cả bảng, cùng khuôn `traffic`. */
  const evals = useMemo(() => signalEvalAll(data.signals, data.sigFires, cfg, data.asOf), [data, cfg]);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const theadH = useElementHeight(theadRef);
  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.phaseId));

  function toggleGroup(phaseId: string) {
    const next = new Set(collapsed);
    if (next.has(phaseId)) next.delete(phaseId);
    else next.add(phaseId);
    onCollapsed(next);
  }
  // Nguồn nào có ít nhất một điểm đo nối vào mới vào ô lọc: bày một lựa chọn chắc chắn cho 0 dòng
  // khớp là mời người dùng vào ngõ cụt.
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
            placeholder="Event, nhãn, chỉ số, bước, phase"
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

        {/* 25/08 (mock f1): thanh công cụ chỉ còn HAI ô lọc theo trường (phase · nguồn). Ô Status
            bỏ vì trục trạng thái nay là dải chip ngay trên bảng (một trục hai chỗ điều khiển sẽ
            lệch nhau); ô Metric bỏ vì chip "chưa gắn chỉ số" + cột "Chỉ số gắn" phủ đúng câu hỏi
            người dùng thật sự hỏi ("cái nào chưa gắn") — lọc theo TÊN chỉ số là thao tác tra cứu,
            đã có ô tìm (signalSearchText soi cả tên chỉ số). Field `st`/`metricId` GIỮ trong
            SignalFilter: vị từ và test của facets không đổi. */}
        <FilterSelect
          label="Filter by phase"
          testId="signal-filter-phase"
          value={filter.phaseId ?? ""}
          onChange={(v) => set({ phaseId: v === "" ? null : v })}
        >
          <option value="">Mọi phase</option>
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
          label="Filter by source"
          testId="signal-filter-src"
          value={filter.srcId ?? ""}
          onChange={(v) => set({ srcId: v === "" ? null : v })}
        >
          <option value="">Mọi nguồn</option>
          {sourcesInUse.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          {hasUnlinked ? <option value={SRC_UNLINKED}>Chưa nối nguồn</option> : null}
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
          {allCollapsed ? "Mở hết nhóm" : "Thu gọn nhóm"}
        </button>

        <div className="ml-auto flex items-baseline gap-3 text-[12px]">
          {matched ? (
            <span
              className="rounded-[7px] border border-primary-line bg-primary-soft px-2 py-0.5 text-ink-2 tabular-nums"
              data-testid="signal-table-count"
            >
              Đang tô {matched.size} / {data.signals.length} điểm đo
            </span>
          ) : null}
          {/* luật 12/08: bỏ hai vế dạy cách đọc cột ("Lưu lượng là số của MỘT NGÀY", "Cột Thấy lần
              cuối là mốc do người khai — không tính được im lặng bao lâu từ đó"). Xuất xứ mốc nay
              nằm ngay trong từng ô của cột. Còn lại đúng MỘT dữ kiện: mốc số liệu của lô đang xem. */}
          {data.asOf ? (
            <span className="t-meta text-[12px]" data-testid="signal-table-asof-note">
              Số liệu tính đến {data.asOf}
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
                      `${grp.signals.length} điểm đo`
                    ) : (
                      <span data-testid={`signal-group-count-${key}`}>
                        {grp.matched} / {grp.signals.length} khớp
                      </span>
                    )}
                  </span>
                </button>
              </th>
            </tr>
            {(open ? grp.signals : []).map((sig) => {
              const running = isSignalRunning(sig);
              const rowStatus = signalRowStatus(sig, data, cfg);
              const dimmed = matched ? !matched.has(sig.id) : false;
              const ev = evals.get(sig.id);
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
                  {/* 25/08 (mock f1): MỘT cột trạng thái — badge bốn bậc của signalRowStatus,
                      ngày chỉ nằm trong nhãn khi feed đứt. */}
                  <td
                    className="border-b border-line-soft px-3 py-2 whitespace-nowrap"
                    data-testid={`signal-status-${sig.id}`}
                  >
                    <Badge state={rowStatus.badge} text={rowStatus.label} />
                  </td>
                  <td
                    className="border-b border-line-soft px-3 py-2 text-right tabular-nums whitespace-nowrap"
                    data-testid={`signal-running-${sig.id}`}
                    aria-label={running ? "receiving traffic" : "no traffic"}
                  >
                    {/* 19/08 (owner): số là TRUNG BÌNH/NGÀY đếm từ hạt thô trong cửa sổ 7 ngày
                        (signalTraffic); đo không được thì "—" mang lý do trong title, không rơi
                        về 0. 25/08 (mock f1): tô vàng/đỏ khi eval theo ngưỡng ở Rules ra
                        watch/crit — lý do nằm trong title, không thêm dòng chữ nào. */}
                    {(() => {
                      const t = traffic.get(sig.id);
                      if (t === undefined || t.state !== "measured")
                        return <span title={t ? (signalEvalWhyText(t) ?? undefined) : undefined}>—</span>;
                      const text = signalTrafficText(t);
                      if (ev?.state === "watch" || ev?.state === "crit")
                        return (
                          <span
                            className={`font-semibold ${ev.state === "crit" ? "text-crit" : "text-watch"}`}
                            title={ev.state === "crit" ? "chạm ngưỡng xử lý (Rules)" : "chạm ngưỡng theo dõi (Rules)"}
                          >
                            {text} ⚠
                          </span>
                        );
                      return text;
                    })()}
                  </td>
                  {/* 25/08 (mock f1): cột "Chỉ số gắn" — số chỉ số điểm đo này nuôi, đối chiếu
                      trực tiếp với chip "chưa gắn chỉ số" của khối ①. "—" = chưa gắn. Tên chỉ số
                      tra ở drawer. */}
                  <td
                    className="border-b border-line-soft px-3 py-2 text-right tabular-nums whitespace-nowrap"
                    data-testid={`signal-metriccount-${sig.id}`}
                  >
                    {sig.metrics.length > 0 ? sig.metrics.length : <span className="text-ink-3">—</span>}
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
