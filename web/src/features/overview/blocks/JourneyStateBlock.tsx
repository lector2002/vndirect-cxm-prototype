import { useState } from "react";
import type { Cfg, CxmData, Flow, Obs, Step } from "../../../data/schema/index.ts";
import { BASE_FACTOR, flowStepsCopied, stepState, stepWhy } from "../../../domain/index.ts";
import type { DerivedState } from "../../../domain/index.ts";
import { AxisLabel, Card, Stat } from "../../../design-system/index.ts";
import { pv } from "../../../design-system/format.ts";

/* @journeystate — "Hành trình đang gãy ở đâu?".

   Bản port 1-1 từ prototype (dòng 2170-2195) render MỘT CHIP CHO MỖI BƯỚC. Hồi đó pilot có đúng
   một flow, sáu bước, nên sáu chip vừa vặn. Owner mở pilot lên hai phase (05/08) thành 30 bước của
   6 flow, và khối này không ai nhìn lại — thành 30 chip. Owner gọi tên đúng chỗ đau: rối mắt.

   Nhưng lỗi nặng hơn thẩm mỹ, và chính nó quyết định cách sửa: MÃ BƯỚC LẶP GIỮA CÁC FLOW. `01` xuất
   hiện 6 lần với 6 nghĩa ("Khởi tạo hồ sơ", "Số dư được phép rút", "Tạo yêu cầu tra soát"…), mà chip
   cũ không nói nó thuộc hành trình nào. Nặng nhất là cặp "02 Xác thực CCCD · VNeID/NFC" (mở TK) và
   "03 Xác thực CCCD qua VNeID" (rút tiền) — đọc lướt tưởng dữ liệu bị trùng. Tức khối cũ không chỉ
   nhiều, nó còn để người đọc hiểu sai bước nào thuộc hành trình nào.

   Nên gộp theo HÀNH TRÌNH (owner chốt 05/08): mỗi flow một dòng, nêu bước tệ nhất của nó và còn mấy
   bước nữa ngoài ngưỡng. Vừa trả lời thẳng câu hỏi của người điều hành, vừa hết mập mờ (tên flow
   đứng ngay đó), vừa không phình thêm khi pilot mở rộng tiếp — thêm flow là thêm một dòng, không
   phải thêm bảy chip.

   17 bước đang trong ngưỡng không còn chiếm chỗ để nói "không có gì" — nhưng KHÔNG bị giấu: ô
   "Đang kiểm soát" ở trên vẫn đếm chúng, và chip mẫu số nói rõ đang hiện bao nhiêu trên bao nhiêu.

   VÒNG HAI (06/08). Gộp theo hành trình mới chỉ HOÃN vấn đề: số dòng = số flow đã khai bước, nên
   map hết 32 flow là 32 dòng — vẫn rơi vào đúng điều kiện owner đặt cho @coverage ("không được cả
   chục bar"). Quét toàn bộ chart chỉ ra chỗ này, nên cắt nốt ở TOP_N hành trình đau nhất, phần còn
   lại đếm ra chữ và mở được tại chỗ. Cùng khuôn với @coverage và @topictrend — ba khối nay nói cùng
   một thứ tiếng: hiện phần đáng nhìn, đếm phần còn lại, mở đủ khi được yêu cầu. */

/** Số hành trình hiện sẵn. Cắt để số dòng thôi bám theo số flow — xem đoạn "VÒNG HAI" ở trên. */
const TOP_N = 6;
export type JourneyStateBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Bấm một dòng hành trình → điều hướng bản đồ hành trình (port go('atlas')). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

const STATE_COLOR: Record<DerivedState, string> = {
  crit: "var(--crit)",
  watch: "var(--watch)",
  ok: "var(--ink3)",
  unknown: "var(--ink3)",
};

type WorstStep = { step: Step; obs: Obs; state: DerivedState; rate: number };

/** Một dòng của khối: một flow đã khai bước. */
type FlowRow = {
  flow: Flow;
  /** Bước ngoài ngưỡng tệ nhất của flow, hoặc `null` nếu không có bước nào ngoài ngưỡng. */
  worst: WorstStep | null;
  /** Số bước ngoài ngưỡng (crit + watch) của flow. */
  offCount: number;
  /** Số bước ĐÃ đo được — tách khỏi tổng số bước để không lẫn "chưa đo" với "đang ổn". */
  measured: number;
  total: number;
};

/* Ba nghĩa của "không có gì để báo" phải tách hẳn nhau, đúng luật đã áp cho signal chart và cho ba
   tab hồ sơ bước: "flow chưa đo bước nào" ≠ "đã đo, mọi bước trong ngưỡng" ≠ "đã đo, có bước gãy".
   Gộp hai cái đầu lại là để một flow mù trông y hệt một flow khỏe. */
function buildRows(data: CxmData, cfg: Cfg): FlowRow[] {
  const obsOf = (stepId: string) => data.obs.find((o) => o.stepId === stepId);
  const rows: FlowRow[] = [];

  for (const flow of data.flows) {
    const steps = data.steps.filter((s) => s.flowId === flow.id);
    if (steps.length === 0) continue; // Flow mới map cấu trúc — thuộc ô "Flow chưa đo" ở trên.

    let worst: WorstStep | null = null;
    let offCount = 0;
    let measured = 0;
    for (const step of steps) {
      const obs = obsOf(step.id);
      if (!obs) continue;
      measured++;
      const state = stepState(obs, cfg);
      if (state !== "crit" && state !== "watch") continue;
      offCount++;
      const rate = obs.entered ? obs.failed / obs.entered : 0;
      if (!worst || rate > worst.rate) worst = { step, obs, state, rate };
    }
    rows.push({ flow, worst, offCount, measured, total: steps.length });
  }

  /* Xếp theo bước tệ nhất giảm dần — người điều hành đọc từ trên xuống là gặp chỗ đau trước. Flow
     không có bước nào ngoài ngưỡng xuống cuối, giữ thứ tự khai để lần đọc nào cũng như nhau. */
  return rows.sort((a, b) => (b.worst?.rate ?? -1) - (a.worst?.rate ?? -1));
}

export function JourneyStateBlock({ data, cfg, onGo }: JourneyStateBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const obsOf = (stepId: string): Obs | undefined => data.obs.find((o) => o.stepId === stepId);

  const cnt = (s: DerivedState) => data.steps.filter((x) => stepState(obsOf(x.id), cfg) === s).length;
  const flowsStepsCopiedCount = data.flows.filter((f) => flowStepsCopied(f, data.steps)).length;
  const flowsGap = data.flows.length - flowsStepsCopiedCount;

  const rows = buildRows(data, cfg);
  const offTotal = rows.reduce((a, r) => a + r.offCount, 0);
  const shown = expanded ? rows : rows.slice(0, TOP_N);
  const hidden = rows.length - shown.length;

  return (
    <Card
      title="Trạng thái hành trình"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện ${shown.length} trên ${rows.length} hành trình đã khai bước (${data.flows.length} flow đã map) · ${offTotal} trên ${data.steps.length} bước ngoài ngưỡng`}
    >
      <div className="grid grid-cols-4 gap-3 mb-3.5">
        <Stat
          label="Cần xử lý ngay"
          value={String(cnt("crit"))}
          foot="bước vượt ngưỡng xử lý"
          tone={cnt("crit") ? "var(--crit)" : undefined}
        />
        <Stat
          label="Cần theo dõi"
          value={String(cnt("watch"))}
          foot="bước vượt ngưỡng theo dõi"
          tone={cnt("watch") ? "var(--watch)" : undefined}
        />
        <Stat
          label="Đang kiểm soát"
          value={String(cnt("ok"))}
          foot="bước trong ngưỡng"
        />
        <Stat
          label="Flow chưa đo"
          value={String(flowsGap)}
          foot={`trên ${data.flows.length} flow đã map`}
        />
      </div>

      <div
        className={`flex flex-col gap-1.5 mb-3${expanded ? " max-h-[320px] overflow-y-auto" : ""}`}
        data-testid="journey-flow-rows"
      >
        {shown.map((r) => {
          const col = r.worst ? STATE_COLOR[r.worst.state] : "var(--line)";
          return (
            <button
              key={r.flow.id}
              type="button"
              data-testid={`journey-flow-${r.flow.id}`}
              title={r.worst ? stepWhy(r.worst.obs, cfg) : undefined}
              onClick={() => onGo?.("atlas")}
              className="w-full text-left flex items-baseline gap-3 px-3 py-2 rounded-lg border bg-surface hover:bg-surface-2"
              style={{ borderColor: col }}
            >
              <span className="text-[13px] font-semibold min-w-[15ch] shrink-0">{r.flow.name}</span>
              {r.measured === 0 ? (
                /* Chưa đo bước nào — KHÔNG được đọc thành "đang ổn". */
                <span className="text-[13px] text-ink-3">
                  Chưa đo bước nào trong {r.total} bước đã khai
                </span>
              ) : r.worst === null ? (
                <span className="text-[13px] text-ink-3">
                  Mọi bước trong ngưỡng ({r.measured}/{r.total} bước đã đo)
                </span>
              ) : (
                <>
                  <span className="text-[13px] text-ink-2 flex-1">
                    {r.worst.step.code} {r.worst.step.name}
                  </span>
                  <b className="font-mono text-[13px] shrink-0" style={{ color: col }}>
                    {pv(r.worst.obs.failed, r.worst.obs.entered)}%
                  </b>
                  {r.offCount > 1 ? (
                    <span className="text-[12px] text-ink-3 shrink-0">
                      +{r.offCount - 1} bước nữa ngoài ngưỡng
                    </span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>
      {/* Phần bị cắt phải ĐẾM RA CHỮ, không cắt im lặng — cùng khuôn với @coverage và @topictrend. */}
      {rows.length > TOP_N ? (
        <button
          type="button"
          data-testid="journey-more"
          onClick={() => setExpanded((v) => !v)}
          className="mb-3 text-[12px] font-semibold text-primary hover:underline"
        >
          {expanded ? "Thu gọn" : `Xem hết ${rows.length} hành trình (+${hidden} nữa)`}
        </button>
      ) : null}
      <AxisLabel>Tỷ lệ thất bại của bước tệ nhất mỗi hành trình</AxisLabel>
    </Card>
  );
}
