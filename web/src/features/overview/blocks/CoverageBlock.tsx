import type { Cfg, CxmData, DimRow, Obs, Step } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

/* @coverage — port 1-1 "Ta đo được bao nhiêu phần hành trình?" (prototype dòng 2197-2211), ÁP
   D1 (charter Phase 2, owner chốt 01/08): rows là obs.cov (đơn vị %) nên KHÔNG được nhân fx() —
   prototype gốc gọi rankBars() mặc định nên paint fx(85)=476 (LỖI THẬT, chỉ sửa ở web/, KHÔNG
   chạm output/cxm-platform-prototype.html). Dùng Bars.formatValue để giữ raw %. */
export type CoverageBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Bấm một thanh → điều hướng bản đồ hành trình (port click:()=>go('atlas'), prototype dòng 2201). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

type StepObs = { step: Step; obs: Obs };

/* total={600} giữ nguyên như bản gốc rankBars(..., {total:600,...}) — chỉ ảnh hưởng tỷ trọng %
   trong tooltip, không liên quan tới D1 (charter Phase 2, mục D1, dòng cuối). */
const TOOLTIP_TOTAL = 600;

export function CoverageBlock({ data, cfg, onGo }: CoverageBlockProps) {
  const stepObs: StepObs[] = data.steps
    .map((step) => ({ step, obs: data.obs.find((o) => o.stepId === step.id) }))
    .filter((p): p is StepObs => p.obs !== undefined);

  const rows: DimRow[] = stepObs.map((p) => ({
    id: p.step.id,
    l: `${p.step.code} ${p.step.name}`,
    v: p.obs.cov,
    c: p.obs.cov < cfg.step.covMin ? "var(--watch)" : "var(--ink3)",
  }));

  const flowsVerified = data.flows.filter((f) => f.verified).length;

  return (
    <Card
      title="Độ phủ đo lường"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện Top ${flowsVerified} trên ${data.flows.length} flow có nguồn xác minh`}
    >
      <Bars
        rows={rows}
        total={TOOLTIP_TOTAL}
        formatValue={(r) => `${r.v}%`}
        onRowClick={onGo ? () => onGo("atlas") : undefined}
        axisLabel="Evidence coverage từng bước, đơn vị %"
      />
    </Card>
  );
}
