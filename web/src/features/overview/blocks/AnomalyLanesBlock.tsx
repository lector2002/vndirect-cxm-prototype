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
      ngưỡng cfg bên trong. */
  cfg: Cfg;
  /** Link cuối khối → màn Assistant: dữ liệu agent (data.ag) sống ở đó từ 25/08 (câu "Agent phát
      hiện gì mới?"); dòng chỉ đường tĩnh #/agents cũ bị bỏ 11/08 vì đích khi ấy là placeholder. */
  onGo?: (route: string) => void;
};

export function AnomalyLanesBlock({ data, onGo }: AnomalyLanesBlockProps) {
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
      {/* 26/08 (owner "mở thêm nút bấm"): cùng idiom footer với cov-go-atlas. */}
      {onGo ? (
        <p className="text-[12px] text-ink-3 mt-2.5 mb-0">
          <button
            type="button"
            data-testid="anomlanes-go-assistant"
            onClick={() => onGo("assistant")}
            className="font-semibold text-ink-3 hover:text-ink hover:underline"
          >
            Hỏi trợ lý về các phát hiện
          </button>
        </p>
      ) : null}
    </Card>
  );
}
