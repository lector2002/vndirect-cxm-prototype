import type { Signal } from "../data/schema/index.ts";
import type { SigFire } from "../data/projectSignalCounts.ts";
import { nextDay, projectSigTrend } from "../data/projectSigTrend.ts";
import type { RangeKey } from "../store/timeframe.ts";

/* Chiếu chuỗi NGÀY (data/projectSigTrend.ts) thành đúng hình chart cần vẽ (ADR-001 §2, §4, §5).

   VỀ VIỆC IMPORT `RangeKey` TỪ `store/` — đọc trước khi tưởng là phá tầng: thứ tự tầng của dự án là
   `data → store → domain → design-system → features`, tức `store/` nằm TRƯỚC `domain/` và chiều
   import này thuận. Câu cấm ở `domain/signalChart.ts` ("không import gì từ store/") là câu cấm HẸP,
   có lý do riêng của nó: module đó không được biết `cfg` chỉnh ranh giới dải tồn tại, vì biết là mở
   đường cho tầng chiếu tự chia nhóm lại. Ở đây chỉ mượn một union chuỗi làm KHOÁ MỐC. Bản sao thứ
   hai của union đó mới là cái phải tránh — `RangeKey` khai một chỗ, thêm mốc mới thì bảng WINDOW
   dưới đây đỏ ngay ở `tsc`, không lặng lẽ rơi vào một nhánh mặc định.

   Ranh giới tầng, đúng luật ADR-001 §6 dòng cuối — **phép cộng ở `data/`, `domain/` chỉ chiếu**:
   module này KHÔNG đếm lượt bắn nào. Nó nhận chuỗi ngày đã cộng sẵn rồi gộp lên hạt hiển thị, chia
   mẫu số, và đánh dấu kỳ chưa đủ. Muốn đổi cách ĐẾM thì sửa `data/`, không sửa ở đây.

   Ba thứ máy tự chọn, KHÔNG có công tắc cho người dùng — mỗi cái đều là một ruling, không phải mặc
   định tiện tay:
     · HẠT suy từ mốc timeframe (§5) — không cho chọn tay, để hai điểm đo cùng mốc luôn cùng trục.
     · ĐƠN VỊ: nhiều giá trị ⇒ đường TỈ LỆ; đúng một giá trị ⇒ đường ĐẾM (§4). Công tắc đếm/tỉ lệ đã
       bị bác vì nó chết ở 6/30 điểm đo và làm mất dấu vết mẫu số.
     · LƯỚI đường nhỏ từ 5 giá trị trở lên (§2) — lý do là ràng buộc cứng 5 màu phân loại, không phải
       thẩm mỹ. */

export type SigGrain = "day" | "week" | "month";

/** Một kỳ trên trục ngang. `partial` = kỳ chưa chạy hết (mép phải vượt quá mốc số liệu). */
export type SigBucket = { key: string; label: string; from: string; to: string; partial: boolean };

/** BA trạng thái của một điểm, tách hẳn nhau bằng KIỂU chứ không bằng `null` với `undefined`.
    Hai trạng thái dưới đây đọc trên màn bằng hai thành ngữ KHÁC HẲN nhau (§5, sửa 13/08):
      · `break`      — 0/0, không tính được ⇒ đường ĐỨT (vạch đứt dọc).
      · `unmeasured` — kỳ nằm trước mốc cắm đo ⇒ để TRỐNG (không nét, không cột khối lượng).
    Dùng chung một `null` cho cả hai là ép tầng vẽ đoán, và đó đúng là chỗ đã phải sửa một lần. */
export type SigPoint = { k: "v"; v: number } | { k: "break" } | { k: "unmeasured" };

export type SigLine = { val: string; undeclared: boolean; pts: SigPoint[] };

export type SigTrendChart =
  | { kind: "refuse"; reason: string }
  | {
      kind: "draw";
      grain: SigGrain;
      buckets: SigBucket[];
      lines: SigLine[];
      /** Dải khối lượng chạy dưới đường, DÙNG CHUNG trục ngang (§4 — "chân đế" của Đ2 dịch sang trục
          thời gian). `null` ở kỳ chưa đo: cột rỗng, không phải cột 0. */
      vol: (number | null)[];
      /** `ratio` — mẫu số là tổng lượt bắn của CHÍNH điểm đo trong kỳ, phải viết đủ vào nhãn trục. */
      unit: "ratio" | "count";
      /** Kỳ đầu ĐO ĐƯỢC — biên trái thật của chuỗi, không phải kỳ đầu cửa sổ. */
      firstMeasured: number;
      startsMidWindow: boolean;
      /** Mốc cắm đo, `yyyy-MM-dd`. Không bao giờ `null` ở nhánh này — `projectSigTrend` đã từ chối ca
          chưa khai mốc trước khi tới đây (ADR-001 §6). Xem chú thích ở `SigTrendResult.instAt`. */
      instAt: string;
      undeclared: string[];
    };

/** Bảng mốc → hạt → số kỳ, ADR-001 §5. KHÔNG dùng lại `RANGE_MONTHS`/`effectiveMonths` của
    `features/overview/sec.ts`: chúng gán 7d/14d/4w = 1 tháng rồi kẹp sàn 3 điểm vì dữ liệu VoC là
    monthly-only. Chart điểm đo có mốc thô từng lượt bắn nên ba mốc mịn ở đây là THẬT — ép qua
    `effectiveMonths()` sẽ bẻ 7D thành 3 tháng và bộ lọc đọc thành hỏng. */
const WINDOW: Record<RangeKey, { grain: SigGrain; n: number }> = {
  "7d": { grain: "day", n: 7 },
  "14d": { grain: "day", n: 14 },
  "4w": { grain: "day", n: 28 },
  "3m": { grain: "week", n: 13 },
  "6m": { grain: "month", n: 6 },
  "12m": { grain: "month", n: 12 },
  default: { grain: "month", n: 6 },
  // Chưa có date-picker thật nên tạm bằng Default — ghi ra chứ không im lặng rơi vào nhánh mặc định.
  custom: { grain: "month", n: 6 },
};

const MONTH_LBL = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const DAY_LBL = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function addDays(iso: string, k: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function addMonths(iso: string, k: number): string {
  const d = new Date(`${monthStart(iso)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + k);
  return d.toISOString().slice(0, 10);
}

/** Thứ Hai của tuần chứa `iso` — tuần ISO, để mép kỳ không phụ thuộc ngày người dùng mở màn. */
function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return addDays(iso, -((d.getUTCDay() + 6) % 7));
}

/* Dựng các kỳ LÙI TỪ mốc số liệu, và mỗi kỳ cắt theo ĐÚNG RANH GIỚI LỊCH của hạt (§5, câu cuối):
   hạt tháng mà cắt thô ở 27/01 thì kỳ đầu chỉ có 4 ngày và vẽ ra một điểm tụt giả. Nên kỳ đầu luôn
   bắt đầu ở mốc lịch, còn kỳ CUỐI mới là kỳ bị cắt — và nó được đánh dấu `partial` đúng vì thế.

   Một luật duy nhất cho `partial`: mép phải của kỳ vượt quá `asOf`. Ở hạt ngày, kỳ cuối kết thúc
   ĐÚNG `asOf` nên không kỳ nào partial — đúng, vì `asOf` là mốc số liệu, ngày đó đã chốt. */
export function buildBuckets(asOf: string, range: RangeKey): { grain: SigGrain; buckets: SigBucket[] } {
  const { grain, n } = WINDOW[range];
  const buckets: SigBucket[] = [];

  if (grain === "month") {
    for (let i = n - 1; i >= 0; i--) {
      const from = addMonths(asOf, -i);
      const to = addDays(addMonths(from, 1), -1);
      buckets.push({ key: from, label: MONTH_LBL(from), from, to, partial: to > asOf });
    }
  } else if (grain === "week") {
    for (let i = n - 1; i >= 0; i--) {
      const from = addDays(weekStart(asOf), -7 * i);
      const to = addDays(from, 6);
      buckets.push({ key: from, label: DAY_LBL(from), from, to, partial: to > asOf });
    }
  } else {
    for (let i = n - 1; i >= 0; i--) {
      const from = addDays(asOf, -i);
      buckets.push({ key: from, label: DAY_LBL(from), from, to: from, partial: false });
    }
  }
  return { grain, buckets };
}

export function sigTrendChart(
  fires: readonly SigFire[],
  signal: Signal,
  asOf: string,
  range: RangeKey,
): SigTrendChart {
  const { grain, buckets } = buildBuckets(asOf, range);
  const win = { from: buckets[0].from, to: buckets[buckets.length - 1].to };
  const base = projectSigTrend(fires, signal, win);
  if (base.kind === "refuse") return { kind: "refuse", reason: base.reason };

  /* Gộp NGÀY lên hạt hiển thị. Ngày VẮNG MẶT trong `rows` là *chưa đo* (trạng thái 3), nên một kỳ
     chỉ đo được khi nó có ít nhất một ngày đo được — cộng `n` của các ngày vắng mặt thành 0 là biến
     *chưa đo* thành *đo được, không bắn*, đúng phép trộn cả lát này sinh ra để chặn. */
  const measuredDays = new Map<string, Set<string>>(); // bucket key → ngày đo được
  const sum = new Map<string, number>(); // `${val} ${bucketKey}` → tổng n
  const volByBucket = new Map<string, number>();

  const bucketOf = new Map<string, string>();
  for (const b of buckets) for (let d = b.from; d <= b.to; d = nextDay(d)) bucketOf.set(d, b.key);

  for (const row of base.rows) {
    const bk = bucketOf.get(row.period);
    if (bk === undefined) continue;
    const seen = measuredDays.get(bk) ?? new Set<string>();
    seen.add(row.period);
    measuredDays.set(bk, seen);
    sum.set(`${row.val} ${bk}`, (sum.get(`${row.val} ${bk}`) ?? 0) + row.n);
    volByBucket.set(bk, (volByBucket.get(bk) ?? 0) + row.n);
  }

  const vals = [...signal.values, ...base.undeclared];
  /* Tỉ lệ CHỈ mở khi các giá trị loại trừ nhau (§4). Ở đây điều đó đúng theo CẤU TRÚC chứ không phải
     theo một cờ khai thêm: mỗi lượt bắn mang đúng MỘT `val`, nên tổng các giá trị trong một kỳ chính
     là tổng lượt bắn của kỳ đó — không có lượt nào đếm hai lần. Một giá trị thì tỉ lệ luôn 100%, nên
     đơn vị tự thu về ĐẾM, không cần nút nào để chết. */
  const unit: "ratio" | "count" = vals.length <= 1 ? "count" : "ratio";

  const lines: SigLine[] = vals.map((val) => ({
    val,
    undeclared: base.undeclared.includes(val),
    pts: buckets.map((b): SigPoint => {
      if ((measuredDays.get(b.key)?.size ?? 0) === 0) return { k: "unmeasured" };
      const n = sum.get(`${val} ${b.key}`) ?? 0;
      if (unit === "count") return { k: "v", v: n };
      const tot = volByBucket.get(b.key) ?? 0;
      // Kỳ có tổng = 0 ⇒ 0/0, KHÔNG tính được ⇒ đứt. Không tụt về 0 (§4, cùng rule 2 signalChart).
      return tot === 0 ? { k: "break" } : { k: "v", v: n / tot };
    }),
  }));

  const vol = buckets.map((b) => ((measuredDays.get(b.key)?.size ?? 0) === 0 ? null : volByBucket.get(b.key) ?? 0));
  const firstMeasured = Math.max(0, vol.findIndex((v) => v !== null));

  return {
    kind: "draw",
    grain,
    buckets,
    lines,
    vol,
    unit,
    firstMeasured,
    startsMidWindow: base.startsMidWindow,
    instAt: base.instAt,
    undeclared: base.undeclared,
  };
}
