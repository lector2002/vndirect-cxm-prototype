import type { Signal } from "./schema/journey.ts";
import type { SigFire } from "./projectSignalCounts.ts";

/* Phép cộng LƯỢT BẮN THÔ → chuỗi theo ngày của MỘT điểm đo (ADR-001 §6).

   Đặt ở `data/` cạnh `projectSignalCounts.ts` vì cùng một lý do tầng lớp: **phép cộng ở `data/`,
   `domain/` chỉ chiếu** (ADR-001 §6, dòng cuối). Module này không biết mốc timeframe, không biết
   hạt hiển thị, không biết tỉ lệ — nó chỉ giao hạt MỊN NHẤT (ngày) và để tầng trên gộp lên.

   MỘT điểm đo mỗi lần gọi, không phải cả 30. Đó không phải tối ưu mà là hình dạng của màn: ADR-001
   §11 đã no-build chế độ nhiều điểm đo trên cùng trục thời gian, nên "chuỗi của tất cả điểm đo"
   không có người tiêu thụ. Gọi một lần cho 30 điểm đo × 365 ngày × 7 giá trị là dựng sẵn 76k dòng
   cho một màn chỉ đọc 2,5k.

   BA TRẠNG THÁI của `n` (§6, phần đắt nhất) — cả ba đều phải phân biệt được từ kết quả trả về:
     1. `n > 0`  — đo được, có bắn.
     2. `n = 0`  — đo được, KHÔNG bắn lần nào. Ngày này **CÓ MẶT** trong mảng trả về.
     3. chưa đo  — ngày nằm trước mốc cắm đo. Ngày này **VẮNG MẶT**. Tầng vẽ để trống, KHÔNG vẽ 0.

   Trộn (2) với (3) là tái phạm luật không-trộn-*chưa-biết*-với-*thiếu*. Đây cũng là chỗ luật đó tốn
   tiền thật: muốn có (2) thì phải dựng XƯƠNG LỊCH (mọi ngày trong cửa sổ, kể cả ngày không có dòng
   nào) rồi mới đổ số vào — `GROUP BY ngày` trên bảng thô không bao giờ tự đẻ ra ngày rỗng. */

/** Một ô của chuỗi: giá trị của điểm đo × MỘT NGÀY → bao nhiêu lượt. `period` dạng `yyyy-MM-dd`. */
export type SigTrend = { sig: string; val: string; period: string; n: number };

export type SigTrendResult =
  /** Không dựng được chuỗi, kèm lý do đọc được. KHÔNG trả mảng rỗng cho ca này: mảng rỗng đọc thành
      "đo được, cả cửa sổ không có lượt nào" — đúng trạng thái (2) — trong khi sự thật là chưa biết. */
  | { kind: "refuse"; reason: string }
  | {
      kind: "draw";
      rows: SigTrend[];
      /** Ngày đầu ĐO ĐƯỢC của cửa sổ này = `max(mốc cắm, đầu cửa sổ)`. Tầng vẽ cần nó cho hai việc:
          nói ra *"trống = chưa đo, cắm dd/mm/yyyy"* khi điểm đo cắm giữa cửa sổ (§11), và lấy mốc so
          sánh của lưới đường nhỏ là **kỳ đầu ĐO ĐƯỢC** chứ không phải kỳ đầu cửa sổ (§4b). */
      from: string;
      /** Điểm đo cắm SAU khi cửa sổ đã bắt đầu ⇒ phần đầu cửa sổ là trạng thái (3), phải tự khai. */
      startsMidWindow: boolean;
      /** Token điểm đo bắn ra mà `Signal.values` KHÔNG khai (§10). Vẫn là đường như mọi giá trị
          khác; cảnh báo *"cần bổ sung khai báo"* gắn vào chú giải của chính đường đó. */
      undeclared: string[];
    };

/** Cộng một ngày. Dùng UTC để không lệch một ngày ở máy có DST — `yyyy-MM-dd` là ngày lịch, không
    phải một thời điểm, nên múi giờ địa phương không được tham gia. */
export function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** `dd/MM/yyyy` (cách `CxmData.asOf` và mọi mốc hiển thị đang khai) → `yyyy-MM-dd` (cách `SigFire.at`
    khai, để so sánh chuỗi là so sánh ngày). Trả `null` khi chuỗi không đúng khuôn — nơi gọi TỪ CHỐI
    vẽ chứ không đoán một ngày thay thế. */
export function isoFromVn(v: string): string | null {
  const p = v.split("/");
  if (p.length !== 3 || p[0].length !== 2 || p[1].length !== 2 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1]}-${p[0]}`;
}

/** Chiều ngược của `isoFromVn`, cho chỗ HIỆN LÊN MÀN. `yyyy-MM-dd` là khuôn lưu/so sánh của
    `SigFire.at` và `Signal.instAt`; mọi mốc người đọc nhìn thấy trong dự án viết `dd/MM/yyyy`
    (ADR-001 §11 lấy đúng khuôn đó làm ví dụ). Chuỗi sai khuôn trả về NGUYÊN VĂN — hiện thô còn hơn
    hiện một ngày bịa ra từ phép đoán. */
export function vnFromIso(v: string): string {
  const p = v.split("-");
  if (p.length !== 3 || p[0].length !== 4 || p[1].length !== 2 || p[2].length !== 2) return v;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

export function projectSigTrend(
  fires: readonly SigFire[],
  signal: Signal,
  win: { from: string; to: string },
): SigTrendResult {
  /* Chưa khai mốc cắm ⇒ KHÔNG dựng chuỗi. Đây là chỗ Bảng D còn treo chạm vào màn: không có biên
     trái thì mọi ngày rỗng trong cửa sổ đều mơ hồ giữa (2) và (3), và vẽ ra một đường đầy đủ là
     khẳng định "đã đo cả cửa sổ" — một câu không ai kiểm được. Từ chối, nói lý do. */
  if (signal.instAt === null) {
    return {
      kind: "refuse",
      reason: `Điểm đo "${signal.name}" chưa khai mốc cắm đo, nên chưa phân biệt được ngày không có lượt nào với ngày chưa đo.`,
    };
  }
  if (signal.instAt > win.to) {
    return {
      kind: "refuse",
      reason: `Điểm đo "${signal.name}" cắm ngày ${signal.instAt}, sau toàn bộ cửa sổ đang xem.`,
    };
  }

  const from = signal.instAt > win.from ? signal.instAt : win.from;
  const mine = fires.filter((f) => f.sigId === signal.id && f.at >= from && f.at <= win.to);

  /* Token chưa khai (§10) — lấy từ CHÍNH các lượt bắn trong cửa sổ, không quét toàn bộ lịch sử: một
     token đã ngừng bắn từ năm ngoái không phải việc phải làm của hôm nay. */
  const declared = new Set(signal.values);
  const seen = new Set(mine.map((f) => f.val));
  const undeclared = [...seen].filter((v) => !declared.has(v)).sort();

  const counts = new Map<string, number>();
  for (const f of mine) {
    const k = `${f.val} ${f.at}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  /* Token chưa khai bắt đầu ở NGÀY ĐẦU TIÊN nó xuất hiện, không kéo ngược về đầu cửa sổ bằng 0
     (§10): kéo ngược là nói "ngày đó đã đo và bằng 0", trong khi ngày đó ta còn chưa biết token này
     tồn tại. Giá trị ĐÃ KHAI thì ngược lại — có mặt từ `from`, vì khai báo chính là lời khẳng định
     "điểm đo này bắn ra giá trị đó", nên ngày rỗng của nó là (2) chứ không phải (3). */
  const firstSeen = new Map<string, string>();
  for (const f of mine) {
    const cur = firstSeen.get(f.val);
    if (cur === undefined || f.at < cur) firstSeen.set(f.val, f.at);
  }

  const rows: SigTrend[] = [];
  for (const val of [...signal.values, ...undeclared]) {
    const start = declared.has(val) ? from : firstSeen.get(val);
    if (start === undefined) continue; // token chưa khai mà không có lượt nào trong cửa sổ
    for (let d = start; d <= win.to; d = nextDay(d)) {
      rows.push({ sig: signal.id, val, period: d, n: counts.get(`${val} ${d}`) ?? 0 });
    }
  }

  return { kind: "draw", rows, from, startsMidWindow: signal.instAt > win.from, undeclared };
}
