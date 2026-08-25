import type { Cfg, CxmData } from "../../../data/schema/index.ts";
import { AnomalyLanes, Card } from "../../../design-system/index.ts";

/* @anomlanes — port "Cái gì đang bất thường?" → tiêu đề cụm danh từ (prototype dòng 2152-2156).
   Composite AnomalyLanes (design-system, S2.1) đã tự nhóm theo `f.lane` + render note + link tĩnh
   #/agents, #/rules; component này chỉ đếm tổng số cảnh báo và bọc Card.

   25/08 (owner, quét AI-slop): bỏ subtitle "Ảnh chụp · kỳ" (GlobalToolbar cầm timeframe) và bỏ
   dải "Đang hiện Top N trên N cảnh báo" — khối luôn vẽ ĐỦ mọi cảnh báo nên dải chỉ nói lại chính
   nó. 0 cảnh báo thì nói thẳng bằng empty-state thay vì ba làn trống trơ. */
export type AnomalyLanesBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung 5 block S2.3 (data+cfg+onGo) — AnomalyLanes không cần
      ngưỡng cfg, và mọi link của nó là tĩnh (#/agents, #/rules) nên component này KHÔNG dùng
      cfg lẫn onGo bên trong. */
  cfg: Cfg;
  onGo?: (route: string) => void;
};

export function AnomalyLanesBlock({ data }: AnomalyLanesBlockProps) {
  /* Port `DATA.ag.reduce((a,g) => a + g.f.filter(f=>f.lane).length, 0)` (prototype dòng 2153). */
  const count = data.ag.reduce((a, g) => a + g.f.filter((f) => f.lane !== null).length, 0);

  return (
    <Card title="Ba làn bất thường">
      {count === 0 ? (
        <div className="text-[13px] text-ink-3" data-testid="anomlanes-empty">
          Chưa có cảnh báo nào từ các agent — ba làn sẽ hiện khi agent phát hiện bất thường.
        </div>
      ) : (
        <AnomalyLanes agents={data.ag} />
      )}
    </Card>
  );
}
