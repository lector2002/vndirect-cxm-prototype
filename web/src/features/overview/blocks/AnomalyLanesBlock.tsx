import type { Cfg, CxmData } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { AnomalyLanes, Card } from "../../../design-system/index.ts";

/* @anomlanes — port 1-1 "Cái gì đang bất thường?" (prototype dòng 2152-2156). Composite
   AnomalyLanes (design-system, S2.1) đã tự nhóm theo `f.lane` + render note + link tĩnh #/agents,
   #/rules; component này chỉ đếm tổng số cảnh báo cho wHead và bọc Card. */
export type AnomalyLanesBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung 5 block S2.3 (data+cfg+onGo) — AnomalyLanes không cần
      ngưỡng cfg, và mọi link của nó là tĩnh (#/agents, #/rules) nên component này KHÔNG dùng
      cfg lẫn onGo bên trong. */
  cfg: Cfg;
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

export function AnomalyLanesBlock({ data }: AnomalyLanesBlockProps) {
  /* Port `DATA.ag.reduce((a,g) => a + g.f.filter(f=>f.lane).length, 0)` (prototype dòng 2153). */
  const count = data.ag.reduce((a, g) => a + g.f.filter((f) => f.lane !== null).length, 0);

  return (
    <Card
      title="Ba làn bất thường"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện Top ${count} trên ${count} cảnh báo`}
    >
      <AnomalyLanes agents={data.ag} />
    </Card>
  );
}
