import { Fragment, type JSX } from "react";
import { Badge } from "./Badge.tsx";
import { Note } from "./Note.tsx";
import { nf, pv } from "./format.ts";

/* Xương sống hành trình — trình bày lại journeySpine() (output/cxm-platform-prototype.html
   dòng 3424-3471) bằng React/Tailwind, giữ nguyên số đo và cấu trúc đã CHỐT ở bản đó:
   - H=112px là khung dải nối CỐ ĐỊNH (dòng 3425, 3446-3448) để mọi nhãn % nằm cùng cao độ; để
     khung co theo dữ liệu thì các nhãn lệch nhau, trông như lỗi trình bày chứ không như một phễu.
   - passPx/lossPx có sàn 4px/3px (dòng 3452-3453) để dải mỏng vẫn còn thấy được trên màn hình.
   - Thứ tự nội dung thẻ bước (dòng 3436-3442): mã·stationId, tên bước, số hoàn tất (to), số vào,
     ↻ lần thử, rồi badge trạng thái.
   - Hatch chéo cho dải rơi port 1-1 CSS .cxloss (dòng 307-308): màu đơn --crit không đủ phân biệt
     nếu chỉ nhìn màu, nên xen hai tông đỏ theo đường chéo.
   Component CHỈ trình bày: state/why đã được suy ở tầng gọi (không tự suy lại ở đây), và KHÔNG
   import store/data/fixtures/domain — nhận dữ liệu đã chuẩn bị sẵn qua props, giống Bars/Donut.

   07/08 (module-i-signal-registry-charter.md D4): bỏ thanh "Evidence coverage" + prop `covMin` —
   `cov` là số gõ tay không đối chiếu được, không còn được hiện lên màn (QĐ2: "chỉ hiện thứ đếm
   được"). Field `cov` bỏ luôn khỏi SpineStep vì sau khi bỏ hiện thị nó không còn ai đọc ở đây. */

/** Một bước trong journey spine — Step+Obs+state đã gộp sẵn ở tầng trên (xem SpineStep). */
export type SpineStep = {
  id: string;
  code: string;
  stationId: string;
  name: string;
  entered: number;
  completed: number;
  failed: number;
  effort: number;
  /** Đã suy sẵn ở tầng trên (ngưỡng fail ở CFG.step), KHÔNG tự suy lại ở component này. */
  state: "good" | "watch" | "crit";
  /** Câu giải thích lý do gắn nhãn state — hiện trong title thẻ. */
  why: string;
};

export type JourneySpineProps = {
  steps: readonly SpineStep[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

/** Khung dải nối CỐ ĐỊNH — prototype dòng 3425/3446-3448. */
const H = 112;

const STATE_CARD_CLASS: Record<SpineStep["state"], string> = {
  good: "bg-surface border-line",
  watch: "bg-watch-bg border-watch-line",
  crit: "bg-crit-bg border-crit-line",
};

/** Port 1-1 .cxloss (prototype dòng 308) — hatch chéo, KHÔNG phải màu đặc, để phân biệt được dải
    rơi mà không chỉ dựa vào hue (rule 6, accessibility). CẤU TRÚC là port 1-1; MÃ MÀU thì không:
    12/08 tối hex sẫm được kéo theo bảng màu "Giấy đậm", #8F2A23 (bản prototype) → #7D1A12;
    18/08 kéo tiếp theo "Trung tính lạnh" (crit #a52218 → #b3261e) thành #8A1D16. */
const LOSS_HATCH =
  "repeating-linear-gradient(45deg, var(--crit), var(--crit) 3px, #8A1D16 3px, #8A1D16 6px)";

function StepCard({
  step,
  selected,
  onSelect,
}: {
  step: SpineStep;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  // Rule 4: onSelect vắng → không gán onClick (không có handler nào được đính) và không tô như
  // đang bấm được — clickable chỉ true khi caller thực sự truyền onSelect.
  const clickable = Boolean(onSelect);
  return (
    <button
      type="button"
      data-testid={`spine-step-${step.id}`}
      title={`${step.name} — ${step.why}`}
      onClick={clickable ? () => onSelect?.(step.id) : undefined}
      style={selected ? { boxShadow: "0 0 0 3px var(--primary-ring)" } : undefined}
      className={`flex-1 min-w-[134px] text-left rounded-[11px] border p-[11px] ${STATE_CARD_CLASS[step.state]} ${
        selected ? "border-primary" : ""
      } ${clickable ? "cursor-pointer hover:border-primary-line" : "cursor-default"}`}
    >
      <div className="font-mono text-[12px] font-bold text-ink-3 tracking-wide">
        {step.code} · {step.stationId}
      </div>
      <div className="text-[12.5px] font-semibold leading-tight my-1.5 min-h-[33px]">{step.name}</div>
      <div className="text-[17px] font-bold tabular-nums">{nf(step.completed)}</div>
      <div className="text-[12px] text-ink-2 mt-0.5">hoàn tất / {nf(step.entered)} vào</div>
      <div className="text-[12px] text-ink-2 mt-2">
        ↻ {String(step.effort).replace(".", ",")} lần thử
      </div>
      <div className="mt-[9px]">
        {/* Badge dùng "ok" cho trạng thái tốt (BadgeState, Badge.tsx dòng 9-14) còn SpineStep khai
            "good" theo đúng shape props được giao (contract) — chỉ đổi TÊN ở ranh giới này. */}
        <Badge state={step.state === "good" ? "ok" : step.state} />
      </div>
    </button>
  );
}

/* Dải nối giữa hai thẻ bước. Rule 1 (bất biến CHỐT): độ dày dải rơi tính từ `from.failed` — số đo
   trực tiếp — KHÔNG tính bằng `from.entered - to.entered`. Hai cách tính hôm nay ra cùng số (xem
   test đối chiếu ở JourneySpine.test.tsx), nhưng cố ý không gộp: nếu dữ liệu thật sau này lệch
   nhau, dùng from.failed đảm bảo sai lệch đó lộ ra ở test đối chiếu thay vì bị component nuốt mất
   bằng cách tự chọn một số "tiện" hơn. */
function Connector({ from, to, base }: { from: SpineStep; to: SpineStep; base: number }) {
  const passPx = Math.max(4, (to.entered / base) * H);
  const lossPx = Math.max(3, (from.failed / base) * H);
  const pct = pv(from.failed, from.entered);
  return (
    <div
      data-testid={`spine-conn-${from.id}`}
      className="flex-none w-16 flex flex-col items-center pt-[54px]"
      title={`Rơi tại bước ${from.code}: ${nf(from.failed)} khách · ${pct}% người vào bước đó`}
    >
      <div className="w-full relative" style={{ height: `${H}px` }}>
        <div
          data-testid={`spine-pass-${from.id}`}
          className="absolute left-0 right-0 top-0"
          style={{
            height: `${passPx}px`,
            background: "linear-gradient(90deg, rgba(132,138,146,.34), rgba(132,138,146,.14))",
            borderTop: "1px solid #C3CAD3",
            borderBottom: "1px solid #C3CAD3",
          }}
        />
        <div
          data-testid={`spine-loss-${from.id}`}
          className="absolute left-0 right-0 rounded-b-[5px]"
          style={{ top: `${passPx}px`, height: `${lossPx}px`, backgroundImage: LOSS_HATCH }}
        />
      </div>
      <div className="mt-[9px] text-center whitespace-nowrap">
        <b className="block font-mono text-[13px] font-bold text-crit">−{pct}%</b>
        <span className="block text-[12px] font-semibold text-ink-3">{nf(from.failed)} rơi</span>
      </div>
    </div>
  );
}

export function JourneySpine({ steps, selectedId, onSelect }: JourneySpineProps): JSX.Element {
  // Rule 2: mảng rỗng → nói thẳng "chưa có bước nào", không dựng khung rỗng giả vờ có dữ liệu.
  if (steps.length === 0) {
    return (
      <div data-testid="journey-spine" className="min-w-0">
        <Note>Chưa có bước nào.</Note>
      </div>
    );
  }

  const base = steps[0].entered;

  // Rule 5: chỉ khung NÀY cuộn ngang (overflow-x-auto) — wrapper ngoài (data-testid=journey-spine)
  // không có overflow riêng, để trang không bị cuộn ngang theo.
  const stepsRow = (
    <div data-testid="spine-steps-row" className="flex items-stretch overflow-x-auto py-1">
      {steps.map((s, i) => (
        <Fragment key={s.id}>
          <StepCard step={s} selected={s.id === selectedId} onSelect={onSelect} />
          {/* Rule 2: base=0 → không chia cho 0, không vẽ dải nối nào cả. */}
          {base > 0 && i < steps.length - 1 ? <Connector from={s} to={steps[i + 1]} base={base} /> : null}
        </Fragment>
      ))}
    </div>
  );

  if (base === 0) {
    return (
      <div data-testid="journey-spine" className="min-w-0">
        {stepsRow}
        <div className="mt-[15px]">
          <Note tone="warn">
            Không vẽ được dải nối: bước {steps[0].code} ghi nhận 0 khách vào, không có mẫu số để tính tỷ lệ.
          </Note>
        </div>
      </div>
    );
  }

  const last = steps[steps.length - 1];
  const totalLost = base - last.completed;
  const worst = [...steps].sort((a, b) => b.failed - a.failed)[0];

  return (
    <div data-testid="journey-spine" className="min-w-0">
      {stepsRow}
      <div className="mt-[15px]">
        <Note>
          <b>{nf(base)}</b> khách vào bước {steps[0].code}, còn <b>{nf(last.completed)}</b> hoàn tất bước{" "}
          {last.code} — mất {nf(totalLost)} người ({pv(totalLost, base)}%). Riêng bước {worst.code}{" "}
          {worst.name} chiếm {pv(worst.failed, totalLost)}% tổng số rơi.
        </Note>
      </div>
    </div>
  );
}
