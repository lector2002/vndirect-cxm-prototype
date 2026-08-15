import { NOT_IDENTIFIED, SIG_CUST_DIMS, SIG_FIRE_DIM } from "../data/projectSignalCounts.ts";
import type { SigCount } from "../data/projectSignalCounts.ts";
import { isSegUnknown, MISSING } from "../data/segment.ts";
import type { Dim, Signal } from "../data/schema/index.ts";

/* Chiếu NĂM bảng đếm (data/projectSignalCounts.ts) thành đúng hình dạng chart điểm đo cần vẽ. Thiết
   kế nằm ở HAI bản, đừng trích lẫn:
   - output/thiet-ke-chart-signal-bo-sung-dot-2.html — Đ1 "Cách B" (một signal = một NHÓM, trong nhóm
     mỗi giá trị của CHÍNH nó là một cột; cấm gộp cột cùng tên giữa các signal), Đ2 (chân đế RIÊNG
     từng nhóm: tổng và "chưa gắn được khách" của chính nó, KHÔNG có dòng tổng chung), Đ3 (signal chỉ
     bắn một giá trị thì vẫn đúng một cột).
   - output/thiet-ke-chart-signal.html — §3 (luôn hiện "x% lần bắn chưa gắn được khách", và ba ràng
     buộc trung thực), §7 mục "Chỗ duy nhất vấn đề đó chạm vào chart điểm đo" (giá trị chưa khai phải
     hiện thành cột VÀ báo lên để người khai bổ sung), §9 (11 tiêu chí nghiệm thu).

   KHÔNG qua `rowBuilder`/`qRun` (domain/quantify.ts) — chart này đếm trên đường riêng qua `sigCounts`
   (đã ghi lại ở data/projectSignalCounts.ts:4-15, đây là ĐƯỜNG DUY NHẤT), rowBuilder đếm trên
   `data.tax`/`data.ev`/`data.cust`, một trục hoàn toàn khác không đọc `sigCounts`.

   `domain/` KHÔNG biết cấu hình chỉnh ranh giới (`store/`) tồn tại (docs/DB-FIRST-HANDOFF.md, bất
   biến layer): không import gì từ `store/`, không đọc `dims[id].cut` — chỉ đọc `dims[id].label` để
   dán nhãn chiều ở `dimStates`, xem rule 7 dưới. */

/** Năm chiều cố định của chart điểm đo, đúng thứ tự dùng ở `dimStates`. Khai một chỗ để guard
    `dimId` và vòng dựng `dimStates` không thể lệch nhau. */
const SIG_DIMS: readonly string[] = [...SIG_CUST_DIMS, SIG_FIRE_DIM];

/** BA nghĩa "không biết" có thể xuất hiện trong bảng đếm điểm đo — phải tách hẳn nhau, ở đây và ở
    mọi tầng phía trên. `unknown-yet` = đợi thì sẽ có (`chưa-biết`); `missing` = đáng ra phải có mà
    trống, tức lỗi dữ liệu (`thiếu`); `not-identified` = lần bắn không nối được về khách nào
    (`chưa định danh`). Hai nghĩa còn lại của "không biết" trong hệ thống (`Ẩn danh`,
    `Chưa đối chiếu được`) thuộc trục bằng chứng VoC, KHÔNG bao giờ vào bảng đếm điểm đo — đừng thêm
    vào union này cho "đủ bộ năm". */
export type SigUnknown = "unknown-yet" | "missing" | "not-identified";

/** Dải này mang nghĩa "không biết" nào, hay là một dải có tên thật (`null`). Nhận diện bằng
    `isSegUnknown`/`NOT_IDENTIFIED` của tầng `data/`, KHÔNG tự so chuỗi — `data/segment.ts:25-30`
    ghi rõ đó là nguồn duy nhất, và ghi luôn dự án đã từng dính lỗi vì so chuỗi rải rác nhiều nơi.
    Trả `null` cho dải lạ chưa phân loại được là CÓ CHỦ Ý: nó sẽ hiện thành một dải bình thường có
    tên riêng — thấy được và đọc được — chứ không bị nhét vào một rổ "không biết" chung. */
function unknownKindOf(band: string): SigUnknown | null {
  if (band === NOT_IDENTIFIED) return "not-identified";
  if (!isSegUnknown(band)) return null;
  return band === MISSING ? "missing" : "unknown-yet";
}

/** Một dải (band) của một cột — `band` lấy VERBATIM từ dòng đếm, không hand-type (rule 4). */
export type SigSlice = { band: string; n: number; rank: number; unknown: SigUnknown | null };

/** Một cột = một giá trị của CHÍNH signal đang xét (rule 3) — không merge cột cùng tên giữa các
    signal khác nhau (`success`/`fail` của sg3/sg5/sg8 là ba số khác nhau, xem test "hai signal cùng
    tên giá trị..."). */
export type SigCol = { val: string; declared: boolean; total: number; slices: SigSlice[] };

/** Một nhóm = một signal đã chọn, `vol > 0`. `notIdentified`/`notIdentifiedPct` là thuộc tính của
    CHÍNH SIGNAL (rule 6), không phải của chiều đang hiển thị. */
export type SigGroup = {
  sigId: string;
  sigName: string;
  vol: number;
  cols: SigCol[];
  notIdentified: number | null;
  notIdentifiedPct: number | null;
};

/** Trạng thái phủ dữ liệu của MỘT trong năm chiều cố định — tính từ dữ liệu (rule 7), không hand-
    declare: `full`/`partial` (kèm `missingPct`)/`locked`. */
export type DimState =
  | { id: string; label: string; state: "full" }
  | { id: string; label: string; state: "partial"; missingPct: number }
  | { id: string; label: string; state: "locked" };

/** Một signal đã chọn nhưng `vol === 0` (chưa instrument/chưa implement) — KHÔNG thành group rỗng
    (rule 2: nhóm rỗng đọc thành "đã đo, ra 0", một lời bịa). */
export type SigNote = { sigId: string; sigName: string; reason: string };

export type SignalChart = {
  dim: string;
  groups: SigGroup[];
  notes: SigNote[];
  dimStates: DimState[];
};

/** Lời giải thích cho một signal `vol===0` — chữ dùng đúng trạng thái đã khai của CHÍNH signal đó
    (`Signal.st`, schema/journey.ts:66-84), không nói chung "chưa có dữ liệu" cho mọi trường hợp:
    `gap` = chưa instrument (không ai bắn), `designed` = đã có spec, chưa implement. Xem test
    "signal vol=0 chọn riêng...". */
function noteFor(sig: Signal): SigNote {
  const reason =
    sig.st === "gap"
      ? `điểm đo "${sig.name}" chưa được instrument (trạng thái "gap") — chưa có lần bắn nào để đếm`
      : sig.st === "designed"
        ? `điểm đo "${sig.name}" đã có spec nhưng chưa implement (trạng thái "designed") — chưa có lần bắn nào để đếm`
        : `điểm đo "${sig.name}" có vol=0, chưa có lần bắn nào để đếm (trạng thái "${sig.st}")`;
  return { sigId: sig.id, sigName: sig.name, reason };
}

/** Dựng MỘT cột từ các dòng đếm ĐÃ LỌC sẵn theo (sig, dimId) — slice theo `val`, rank theo n giảm
    dần, tie-break theo `band` tăng dần cho tất định (rule 4). `total` = Σ n của các slice (rule 5). */
function buildCol(rowsForSigDim: readonly SigCount[], val: string, declared: boolean): SigCol {
  const slices = rowsForSigDim
    .filter((r) => r.val === val)
    .map((r) => ({ band: r.band, n: r.n, unknown: unknownKindOf(r.band) }))
    .sort((a, b) => b.n - a.n || (a.band < b.band ? -1 : a.band > b.band ? 1 : 0))
    .map((s, i) => ({ ...s, rank: i }));
  const total = slices.reduce((a, s) => a + s.n, 0);
  return { val, declared, total, slices };
}

/** Cột của một nhóm: giá trị ĐÃ KHAI (`Signal.values`, đúng thứ tự khai) trước, rồi giá trị CHƯA
    KHAI (xuất hiện trong `rows` nhưng không có trong `Signal.values`) sắp theo `total` giảm dần, tie
    theo `val` tăng dần (rule 3, thiết kế §7 "giá trị chưa khai" — phải hiện ra, không bị bỏ). */
function buildCols(sig: Signal, rows: readonly SigCount[], dimId: string): SigCol[] {
  const rowsForSigDim = rows.filter((r) => r.sig === sig.id && r.dim === dimId);
  const declaredCols = sig.values.map((val) => buildCol(rowsForSigDim, val, true));

  const declaredSet = new Set(sig.values);
  const undeclaredVals = new Set<string>();
  for (const r of rowsForSigDim) if (!declaredSet.has(r.val)) undeclaredVals.add(r.val);
  const undeclaredOrder = [...undeclaredVals]
    .map((val) => ({ val, total: rowsForSigDim.filter((r) => r.val === val).reduce((a, r) => a + r.n, 0) }))
    .sort((a, b) => b.total - a.total || (a.val < b.val ? -1 : a.val > b.val ? 1 : 0));
  const undeclaredCols = undeclaredOrder.map(({ val }) => buildCol(rowsForSigDim, val, false));

  return [...declaredCols, ...undeclaredCols];
}

/** "Chưa gắn được khách" của MỘT signal — luôn đọc từ MỘT chiều khách (`SIG_CUST_DIMS`), KHÔNG BAO
    GIỜ từ `dimId` đang hiển thị (rule 6): `sigpf` (SIG_FIRE_DIM) được MIỄN ràng buộc 3
    (data/validate.ts:718-722) nên nếu đọc "chưa định danh" từ `sigpf` sẽ luôn ra một số không đúng ý
    nghĩa "chưa gắn được khách" — đọc từ chiều khách nào cũng ra cùng số (ràng buộc 3 khi dữ liệu hợp
    lệ), chỉ cần MỘT chiều có dòng. Không có chiều khách nào có dòng cho signal này → cả hai `null`
    (không biết, không phải 0) — xem test "rule 6...không có dòng chiều khách". */
/* SỐ LƯỢT BẮN ĐANG XÉT của một signal — đọc TỪ CHÍNH các dòng đếm được đưa vào, không đọc
   `Signal.vol`.

   Đổi 14/08 (ADR-003). Khi bảng đếm phủ cả lịch sử thì hai cách cho cùng một số: ràng buộc 1 của
   `validate.ts` khẳng định tổng n của MỘT chiều bằng đúng `Signal.vol`. Nhưng từ nay bảng đếm có thể
   là bảng đã CẮT THEO KỲ (`projectSignalCounts(..., win)`, dùng cho lát cắt nhảy theo kỳ ở ADR-001
   §2) — lúc đó `Signal.vol` là tổng CẢ ĐỜI điểm đo, còn thứ đang vẽ là một kỳ. Lấy `Signal.vol` làm
   mẫu số khi đó cho ra một tỉ lệ "chưa gắn được khách" nhỏ đi theo đúng tỉ lệ độ dài cửa sổ — sai mà
   không có gì đỏ.

   Đọc từ rows là ĐÚNG ở cả hai chế độ và bỏ được nguồn sự thật thứ hai. Chiều đọc phải là một chiều
   KHÁCH (rule 6): `sigpf` được miễn ràng buộc 3 nên tổng của nó không dùng làm mẫu số chung được. */
function volOf(sig: Signal, rows: readonly SigCount[]): number {
  /* Đọc từ `sigpf` (SIG_FIRE_DIM), KHÔNG từ một chiều khách và KHÔNG từ `Signal.vol`.

     `sigpf` là chiều DUY NHẤT luôn đủ: nó đọc thẳng nền tảng của chính lần bắn nên được miễn ràng
     buộc 3 (data/validate.ts) — lần bắn không gắn được khách nào vẫn có một dòng ở đây. Chiều khách
     thì có thể thiếu hẳn (nguồn không ghi phân khúc), và lấy một chiều thiếu làm mẫu số chính là
     phép chia làm "thiếu" biến mất: coverage/expected = 1 với mọi mức thiếu.

     `Signal.vol` chỉ dùng khi KHÔNG CÓ DÒNG NÀO — trạng thái "đáng ra phải có mà chưa nhận được",
     và mẫu số phải là con số ĐÃ KHAI để năm chiều đọc thành `locked` chứ không phải biến mất khỏi
     màn. Có dòng rồi thì `Signal.vol` là sai với bảng đã CẮT THEO KỲ: nó là tổng cả đời điểm đo, nên
     mọi chiều sẽ tụt thành `partial` chỉ vì cửa sổ ngắn hơn lịch sử (ADR-003 §3). */
  const fire = rows.filter((r) => r.sig === sig.id && r.dim === SIG_FIRE_DIM);
  if (fire.length === 0) return sig.vol;
  return fire.reduce((a, r) => a + r.n, 0);
}

function notIdentifiedOf(sig: Signal, rows: readonly SigCount[]): [number | null, number | null] {
  const custDim = SIG_CUST_DIMS.find((d) => rows.some((r) => r.sig === sig.id && r.dim === d));
  if (custDim === undefined) return [null, null];
  const n = rows
    .filter((r) => r.sig === sig.id && r.dim === custDim && r.band === NOT_IDENTIFIED)
    .reduce((a, r) => a + r.n, 0);
  const vol = volOf(sig, rows);
  return [n, vol === 0 ? null : n / vol];
}

function buildGroup(sig: Signal, rows: readonly SigCount[], dimId: string): SigGroup {
  const cols = buildCols(sig, rows, dimId);
  const [notIdentified, notIdentifiedPct] = notIdentifiedOf(sig, rows);
  return { sigId: sig.id, sigName: sig.name, vol: volOf(sig, rows), cols, notIdentified, notIdentifiedPct };
}

/** Trả CHART cho chart điểm đo — không side-effect, không mutate `rows`/`signals` (rule "Pure", xem
    test "gọi hai lần..."). */
export function signalChart(
  rows: readonly SigCount[],
  signals: readonly Signal[],
  dims: Record<string, Dim>,
  selectedSigIds: readonly string[],
  dimId: string,
): SignalChart {
  /* `dimId` PHẢI là một trong năm chiều cố định. Không chặn ở đây thì một chiều lạ (ví dụ `tenure`
     đã rút ở S2) lọc ra RỖNG và mọi nhóm hiện tổng 0 trong khi `Signal.vol` là 410 — đúng cái "đọc
     thành đã đo, ra 0" mà rule 2 chặn ở signal `vol===0`, chỉ vào bằng cửa khác và không có gì đỏ.
     Ném lỗi cùng khuôn với chiều thiếu trong `dims` ở dưới: khai sai phải lộ ngay lần gọi đầu. */
  if (!SIG_DIMS.includes(dimId)) {
    throw new Error(
      `signalChart: chiều "${dimId}" không phải một trong năm chiều của chart điểm đo (${SIG_DIMS.join(", ")}) — lỗi khai báo, xem SIG_CUST_DIMS/SIG_FIRE_DIM ở data/projectSignalCounts.ts`,
    );
  }

  const selected = new Set(selectedSigIds);
  // Lọc theo THỨ TỰ KHAI BÁO của `signals`, không theo thứ tự chọn — tất định (rule 1).
  const selectedSignals = signals.filter((s) => selected.has(s.id));
  const liveSignals = selectedSignals.filter((s) => s.vol > 0);
  const notes = selectedSignals.filter((s) => s.vol === 0).map(noteFor);

  /* Σ số lượt bắn ĐANG XÉT của các signal sống — mẫu số của mọi `missingPct` ở rule 7. Đọc qua
     `volOf` chứ không cộng `Signal.vol`, cùng lý do đã ghi ở `volOf`: với bảng đếm đã cắt theo kỳ,
     `Signal.vol` là tổng cả đời nên MỌI chiều sẽ đọc thành `partial` chỉ vì cửa sổ ngắn hơn lịch sử.
     Không chọn gì / chỉ chọn signal vol=0 → mẫu số 0, không được chia — trả rỗng thay vì giả "mọi
     chiều đều locked" (rule 7). */
  const expected = liveSignals.reduce((a, s) => a + volOf(s, rows), 0);
  if (expected === 0) return { dim: dimId, groups: [], notes, dimStates: [] };

  const groups = liveSignals.map((sig) => buildGroup(sig, rows, dimId));

  const liveIds = new Set(liveSignals.map((s) => s.id));
  const dimStates: DimState[] = SIG_DIMS.map((id) => {
    const dim = dims[id];
    if (!dim) {
      throw new Error(
        `signalChart: chiều "${id}" không có trong "dims" — lỗi khai báo (chart điểm đo cần đúng 5 chiều cố định, xem SIG_CUST_DIMS/SIG_FIRE_DIM ở data/projectSignalCounts.ts)`,
      );
    }
    const coverage = rows.filter((r) => r.dim === id && liveIds.has(r.sig)).reduce((a, r) => a + r.n, 0);
    if (coverage === expected) return { id, label: dim.label, state: "full" };
    if (coverage === 0) return { id, label: dim.label, state: "locked" };
    return { id, label: dim.label, state: "partial", missingPct: 1 - coverage / expected };
  });

  return { dim: dimId, groups, notes, dimStates };
}
