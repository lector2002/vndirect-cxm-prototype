import type { Obs, Metric, Source, Action, Cfg, Flow, Step } from "../data/schema/index.ts";
import { metricDirection } from "../data/metric-direction.ts";

/* Trạng thái suy ra từ ngưỡng — port 1-1 từ prototype (output/cxm-platform-prototype.html).
   Không side-effect, không đọc DOM/global: mọi hàm nhận data + cfg làm tham số. */

export type DerivedState = "ok" | "watch" | "crit" | "unknown";
export type SourceHealth = "ok" | "stale" | "down";
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

/* Sức khoẻ một nguồn dữ liệu: im lặng quá deadDays (giờ) là "down"; trễ hơn SLA riêng của nguồn
   là "stale". Port từ sourceHealth() (~dòng 1546) — bỏ nhánh `lagH == null` của bản gốc vì
   Source.lagH trong schema mới là `number` (không nullable). */
export function sourceHealth(s: Source, cfg: Cfg): SourceHealth {
  if (s.lagH >= cfg.data.deadDays * 24) return "down";
  const sla = cfg.source[s.id] ?? 6;
  return s.lagH > sla ? "stale" : "ok";
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
