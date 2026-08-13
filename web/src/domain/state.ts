import type { Obs, Metric, Source, Action, Cfg, Flow, Step, Signal } from "../data/schema/index.ts";
import { metricDirection } from "../data/metric-direction.ts";

/* Trạng thái suy ra từ ngưỡng — port 1-1 từ prototype (output/cxm-platform-prototype.html).
   Không side-effect, không đọc DOM/global: mọi hàm nhận data + cfg làm tham số. */

export type DerivedState = "ok" | "watch" | "crit" | "unknown";
/* "silent" thêm 07/08 (module-i-signal-registry-charter.md §0 mục A, I3 Việc 2) — trạng thái THỨ TƯ,
   nghĩa "nguồn không giao gì, và từ dữ liệu hiện có KHÔNG phân định được là hỏng hay chỉ là ngày
   không ai gửi". KHÔNG phải tin xấu, tự biến mất khi manifest giao hàng về (§10). Thêm một nhánh vào
   union KHÔNG phải thêm trường — charter cho phép rõ (§0 mục A). */
export type SourceHealth = "ok" | "stale" | "down" | "silent";
export type LaneKey = "confirm" | "approve" | "fix" | "verify" | "off";

const failRate = (o: Obs): number => (o.entered ? (o.failed / o.entered) * 100 : 0);

/* Trạng thái một bước hành trình: tỷ lệ thất bại là tiêu chí chính; effort cao thì ít nhất phải
   "Cần theo dõi" — thấy thất bại mà không biết vì sao cũng là vấn đề.
   Port từ stepState() (~dòng 1513).
   07/08 (module-i-signal-registry-charter.md D4/F9): bỏ nhánh so trường `cov` với `cfg.step.covMin`
   — `cov` là số gõ tay không đối chiếu được (không suy lại được từ đâu), không còn được cầm quyền
   đẩy trạng thái. Trường `cov` của `Obs` VẪN Ở TRONG schema/fixture, chỉ mất quyền tiêu thụ ở đây. */
export function stepState(o: Obs | undefined, cfg: Cfg): DerivedState {
  if (!o) return "unknown";
  const fr = failRate(o);
  let s: DerivedState = fr >= cfg.step.failCrit ? "crit" : fr >= cfg.step.failWatch ? "watch" : "ok";
  if (s === "ok" && o.effort > cfg.step.effortMax) s = "watch";
  return s;
}

/* Lý do bước bị gắn nhãn — để UI giải thích được, không chỉ tô màu. Port từ stepWhy() (~dòng 1521).
   07/08: bỏ dòng lý do "evidence coverage ... dưới ngưỡng" cùng lý do với stepState() ở trên. */
export function stepWhy(o: Obs | undefined, cfg: Cfg): string {
  if (!o) return "Chưa có dữ liệu quan sát";
  const r: string[] = [];
  const fr = failRate(o);
  if (fr >= cfg.step.failCrit) {
    r.push(`thất bại ${fr.toFixed(1).replace(".", ",")}% ≥ ngưỡng xử lý ${cfg.step.failCrit}%`);
  } else if (fr >= cfg.step.failWatch) {
    r.push(`thất bại ${fr.toFixed(1).replace(".", ",")}% ≥ ngưỡng theo dõi ${cfg.step.failWatch}%`);
  }
  if (o.effort > cfg.step.effortMax) {
    r.push(`effort ${String(o.effort).replace(".", ",")} vượt ${String(cfg.step.effortMax).replace(".", ",")} lần thử`);
  }
  return r.length ? r.join(" · ") : "mọi tiêu chí trong ngưỡng";
}

const mval = (m: Metric): number => parseFloat(m.value.replace(",", "."));

/* Trạng thái metric: band RIÊNG từng metric (cfg.metric[id]), không dùng ngưỡng chung.
   Port từ metricState() (~dòng 1534). Hướng so sánh (`metricDirection`) giờ dùng chung với
   data/mock-repository.ts — xem data/metric-direction.ts để biết vì sao luật đặt ở tầng data/. */
export function metricState(m: Metric, cfg: Cfg): DerivedState {
  const c = cfg.metric[m.id];
  if (!c || !c.on) return "unknown";
  const v = mval(m);
  if (Number.isNaN(v)) return "unknown";
  if (metricDirection(m) === "down") return v > c.crit ? "crit" : v > c.watch ? "watch" : "ok";
  return v < c.crit ? "crit" : v < c.watch ? "watch" : "ok";
}

/** Số NGÀY một nguồn còn thiếu, so `Source.last` với mốc số liệu `asOf`.
    07/08 (module-i-signal-registry-charter.md §0 mục A, I3 Việc 1): thước cũ hỏi "chậm hơn BÂY GIỜ
    mấy tiếng" — dưới lối giao T+1 thì độ chậm so với `now` không bao giờ dưới 24h, nên thước đó tự
    báo "chết" mỗi ngày dù nguồn không hỏng. Thước mới hỏi "đã giao đủ dữ liệu của ngày cần chưa".

    ⚠ `Source.last` là CHUỖI NGƯỜI GÕ KHÔNG CÓ NĂM ("27/07 · 14:52") — đúng bẫy D6 của `Signal.seen`
    (xem `signalRegistry.ts:seenAfterAsOf`). Ở đây parse được số NGÀY (không chỉ trước/sau như D6)
    bằng cách gán CÙNG MỘT NĂM GIẢ ĐỊNH (2000, không nhuận) cho cả `last` và `asOf` rồi lấy hiệu theo
    lịch — ĐÚNG khi cả hai rơi trong cùng một năm dương lịch và không bắc qua 31/12 (đúng cho fixture
    hôm nay, trải hai tháng trong 2026). KHÔNG phải mốc thời gian thật; mốc máy sinh thật đã nằm
    trong bản yêu cầu dữ liệu (charter §10). Đọc không được khuôn dd/mm thì trả 0 — an toàn hơn báo
    "chết" sai vì lỗi khuôn chuỗi. */
export function sourceDaysMissing(s: Source, asOf: string): number {
  const toDdMm = (str: string): { d: number; m: number } | null => {
    const m = /^(\d{2})\/(\d{2})/.exec(str);
    return m ? { d: Number(m[1]), m: Number(m[2]) } : null;
  };
  const last = toDdMm(s.last);
  const ref = toDdMm(asOf);
  if (!last || !ref) return 0;
  const lastTs = Date.UTC(2000, last.m - 1, last.d);
  const refTs = Date.UTC(2000, ref.m - 1, ref.d);
  return Math.max(0, Math.round((refTs - lastTs) / 86_400_000));
}

/** Nhịp giao mặc định khi `cfg.source[id]` chưa khai: 0 ngày — "phải giao đủ dữ liệu của mốc số
    liệu". MỌI chỗ hiện lại giá trị này (ô nhập nhóm 3 ở #/rules, hai màn Nguồn dữ liệu) PHẢI đọc
    CHÍNH hằng này, không gõ lại con số: ô nhập hiện một mặc định khác cái engine đang chấm là đúng
    loại lỗi "màn nói sai về chính nó" mà dự án này đã bắt được ba lần (bản cũ ô nhập hiện `?? 6`
    trong khi engine không đọc `cfg.source` chút nào). */
export const SOURCE_ALLOW_DAYS_DEFAULT = 0;

/* Sức khoẻ một nguồn dữ liệu — chấm theo MỐC SỐ LIỆU (`asOf`), KHÔNG theo `now`. Port cũ (~dòng
   1546, `lagH` so `cfg.source[id]` tính bằng GIỜ) THAY THẾ 07/08 theo quyết định owner ở charter §0
   mục A — lý do và số đo ở §12.1: dưới pipeline T+1, `lagH` không bao giờ < 24h vì kiến trúc, nên
   5/7 nguồn khai SLA < 24h đọc thành "stale" vĩnh viễn.

   11/08 (owner, giải C5): `cfg.source[id]` ĐỔI ĐƠN VỊ sang NGÀY và ĐƯỢC ĐỌC LẠI Ở ĐÂY. Từ 07/08 đến
   11/08 nó là control mồ côi — gõ vào được ở #/rules mà không đổi được nhãn nào; owner chọn đổi đơn
   vị thay vì bỏ nhóm, nên nhịp giao riêng từng nguồn lấy lại thẩm quyền chấm.

   Bậc thang (mọi số tính bằng NGÀY), `allow` = `cfg.source[id] ?? SOURCE_ALLOW_DAYS_DEFAULT`:
     1. thiếu ≤ allow                        → "ok"    (nguồn giao đúng nhịp của chính nó)
     2. thiếu ≥ allow + deadDays              → "down"  (bất kể loại nguồn)
     3. còn lại, có giao (vol > 0)            → "stale" (đang trễ — rõ ràng, có giao chỉ chậm)
     4. còn lại, KHÔNG giao gì                → "stale" nếu `kind:'event'` (app có người dùng thì có
        event ⇒ im lặng đáng ngờ), ngược lại "silent" (do người chủ động gửi, im lặng là chuyện
        thường — charter §0 mục A, I3 Việc 2)

   VÌ SAO `allow + deadDays` chứ không phải `deadDays` phẳng: `deadDays` giờ đọc là "quá nhịp giao
   bao nhiêu ngày thì coi là ngừng gửi". Để phẳng thì nguồn khai nhịp ≥ deadDays nhảy thẳng
   "ok" → "down", BỎ QUA hẳn bậc "stale" — một nguồn giao hằng tuần sẽ không bao giờ được báo "đang
   trễ", chỉ im lặng rồi bị tuyên chết. Bậc thang không được nhảy bậc.

   VÌ SAO xét "ok" TRƯỚC "down": chỉ khác thứ tự cũ khi `deadDays` = 0 — bản cũ tuyên "down" cho cả
   nguồn vừa giao đủ hôm nay. Không luật nào chặn người vận hành gõ 0 vào ô đó (xem handoff: dải số
   của cfg chưa có luật nào kiểm), nên bậc "ok" đứng trước là bậc an toàn hơn.

   Đo được: bậc thang này cho ĐÚNG BẢY nhãn như bản 07/08 trên CẢ HAI fixture — xem `state.test.ts`
   (đối chiếu bằng chính công thức 07/08 viết tại chỗ, không ghim số). */
export function sourceHealth(s: Source, cfg: Cfg, asOf: string): SourceHealth {
  const missing = sourceDaysMissing(s, asOf);
  const allow = cfg.source[s.id] ?? SOURCE_ALLOW_DAYS_DEFAULT;
  if (missing <= allow) return "ok";
  if (missing >= allow + cfg.data.deadDays) return "down";
  if (s.vol > 0) return "stale";
  return s.kind === "event" ? "stale" : "silent";
}

/** Độ tươi của một điểm đo, tính BẰNG MÁY thay cho mốc `Signal.seen` người gõ (owner chốt 12/08,
    lối (i) của handoff §10c). "unknown" KHÔNG phải một bậc của bậc thang — nó là câu trả lời cho
    một câu hỏi khác hẳn: chưa nối được nguồn thì không có gì để chấm, và rơi về "ok" ở đây đúng là
    kiểu lỗi biến chưa-biết thành đang-ổn mà dự án cấm. Điểm đo đã nối thì độ tươi của nó CHÍNH LÀ
    độ tươi của lô dữ liệu chở nó — dùng lại nguyên `sourceHealth()`, không dựng bậc thang thứ hai,
    để đổi luật ở #/rules là đổi cho cả hai màn. */
export type SignalFeedHealth = SourceHealth | "unknown";

export function signalFeedHealth(
  signal: Signal,
  sources: readonly Source[],
  cfg: Cfg,
  asOf: string,
): SignalFeedHealth {
  if (signal.srcId === null) return "unknown";
  const src = sources.find((s) => s.id === signal.srcId);
  // srcId trỏ vào nguồn không có thật: validate.ts nhóm 7 đã chặn ở cửa dữ liệu, nhưng hàm domain
  // không giả định fixture nào cũng qua cửa đó — vẫn là "chưa biết", không phải "đang ổn".
  return src ? sourceHealth(src, cfg, asOf) : "unknown";
}

/** Mốc giao gần nhất mà MÁY ghi được cho điểm đo — là mốc của nguồn chở nó, không phải mốc riêng
    từng event. `null` = chưa nối nguồn, chỗ đọc phải quay về `Signal.seen` và nói rõ đó là mốc
    người khai (điều D6). Mốc máy sinh cho RIÊNG từng điểm đo vẫn là việc chưa có (charter §10). */
export function signalFeedLast(signal: Signal, sources: readonly Source[]): string | null {
  if (signal.srcId === null) return null;
  return sources.find((s) => s.id === signal.srcId)?.last ?? null;
}

/* Hai trục rời của một flow trên bản đồ hành trình — SUY TẠI CHỖ ĐỌC, không lưu thành field.
   07/08 (module-i-signal-registry-charter.md D2/F8): `Flow.verified`/`Flow.observed` bị xoá khỏi
   schema vì cả hai chỉ là biểu thức của trường khác — validate.ts nhóm 13/14 (cũ) đã tự chứng minh
   khớp 25⟷25 và 6⟷6 trên seed, tức chưa từng có thông tin nào ở hai field đó ngoài `src` và `steps`.
   Hai trục owner chốt (QĐ 3, module I): "có trích dẫn sơ đồ nguồn" và "đã chép bước". KHÔNG gộp lại
   thành một nhãn, KHÔNG dùng lại chữ "đã xác minh" — owner đã bỏ hẳn chữ đó. */

/** Trục 1 — flow có trích dẫn sơ đồ nguồn (Account/Money Journey) chưa. Thay `Flow.verified` cũ. */
export function flowHasSourceCitation(flow: Flow): boolean {
  return flow.src !== "—";
}

/** Trục 2 — flow đã chép bước (có ≥1 `Step` trỏ tới nó) chưa. Thay `Flow.observed` cũ. */
export function flowStepsCopied(flow: Flow, steps: readonly Step[]): boolean {
  return steps.some((s) => s.flowId === flow.id);
}

/* Làn xử lý của một action, suy từ cf/ap/dl/iv — không thêm field mới. Port từ LANES/laneOf()
   (~dòng 2882-2896); viết lại thành early-return tương đương vì mỗi nhánh sau đã loại trừ nhánh
   trước (cf==='confirmed' khi tới nhánh 2 — bất biến 5 của validate.ts buộc
   cf==='pending' ⟹ ap==='pending', nên nhánh 1 vẫn loại trừ đúng theo cùng logic cũ; ap==='approved'
   khi tới nhánh 3, dl==='released' khi tới nhánh 4 — vì ActionAp/ActionDl chỉ có 2/3 giá trị).
   02/08/2026: chặng 1 đổi từ "Gán" (owner===UNASSIGNED) sang "Xác nhận" (cf==='pending') — owner chốt
   trong module-a-charter.md, gộp owner/acc/due vào form xác nhận thay vì là chặng riêng. */
export function laneOf(a: Action): LaneKey {
  if (a.cf === "pending") return "confirm";
  if (a.ap === "pending") return "approve";
  if (a.dl !== "released") return "fix";
  if (a.iv !== "validated") return "verify";
  return "off";
}
