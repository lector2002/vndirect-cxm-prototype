import type { Cfg, CxmData, Obs } from "../../../data/schema/index.ts";
import { BASE_FACTOR, stepState, stepWhy } from "../../../domain/index.ts";
import type { DerivedState } from "../../../domain/index.ts";
import { AxisLabel, Card, Stat } from "../../../design-system/index.ts";
import { pv } from "../../../design-system/format.ts";

/* @journeystate — port 1-1 "Hành trình đang gãy ở đâu?" (prototype dòng 2170-2195). Component
   THUẦN: trạng thái từng bước là SUY RA qua stepState()/stepWhy() (domain), không hardcode màu. */
export type JourneyStateBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Bấm một chip bước hoặc link cuối khối → điều hướng bản đồ hành trình (port go('atlas')). */
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

export function JourneyStateBlock({ data, cfg, onGo }: JourneyStateBlockProps) {
  const obsOf = (stepId: string): Obs | undefined => data.obs.find((o) => o.stepId === stepId);

  const cnt = (s: DerivedState) => data.steps.filter((x) => stepState(obsOf(x.id), cfg) === s).length;
  const flowsObserved = data.flows.filter((f) => f.observed).length;
  const flowsGap = data.flows.length - flowsObserved;

  return (
    <Card
      title="Trạng thái hành trình"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện Top ${flowsObserved} trên ${data.flows.length} flow có dữ liệu quan sát`}
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

      <div className="flex flex-wrap gap-2 mb-3">
        {data.steps.map((s) => {
          const o = obsOf(s.id);
          const st = stepState(o, cfg);
          const col = STATE_COLOR[st];
          return (
            <button
              key={s.id}
              type="button"
              title={stepWhy(o, cfg)}
              onClick={() => onGo?.("atlas")}
              className="px-2.5 py-1.5 rounded border bg-surface text-[13px]"
              style={{ borderColor: st === "ok" ? "var(--line)" : col }}
            >
              {s.code} {s.name} <b className="font-mono" style={{ color: col }}>{o ? pv(o.failed, o.entered) : "—"}%</b>
            </button>
          );
        })}
      </div>
      <AxisLabel>Tỷ lệ thất bại từng bước</AxisLabel>
    </Card>
  );
}
