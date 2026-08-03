import type { Cfg, CxmData } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { AxisLabel, Card, SrcMatrix } from "../../../design-system/index.ts";

/* @srcmatrix — port 1-1 "Tiếng nói đang tới từ đâu, và có thiếu gì không?" (prototype dòng
   2121-2131). Composite SrcMatrix (design-system, S2.1) đã tự suy sourceHealth() + render bảng;
   component này chỉ bọc Card + note cảnh báo nguồn hỏng. */
export type SrcMatrixBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Link "Xem hồ sơ từng nguồn" trong note (port href="#/sources", prototype dòng 2128). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

export function SrcMatrixBlock({ data, cfg }: SrcMatrixBlockProps) {
  return (
    <Card
      title="Độ toàn vẹn nguồn"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện Top ${data.sources.length} trên ${data.sources.length} nguồn`}
    >
      <SrcMatrix sources={data.sources} metrics={data.metrics} cfg={cfg} compact />
      <AxisLabel>Nguồn × nền tảng</AxisLabel>
    </Card>
  );
}
