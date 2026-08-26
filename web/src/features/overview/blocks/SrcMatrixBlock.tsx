import type { Cfg, CxmData } from "../../../data/schema/index.ts";
import { AxisLabel, Card, SrcMatrix } from "../../../design-system/index.ts";

/* @srcmatrix — port 1-1 "Tiếng nói đang tới từ đâu, và có thiếu gì không?" (prototype dòng
   2121-2131). Composite SrcMatrix (design-system, S2.1) đã tự suy sourceHealth() + render bảng;
   component này chỉ bọc Card + note cảnh báo nguồn hỏng.

   25/08 (owner, quét AI-slop): bỏ subtitle "Ảnh chụp · kỳ" (GlobalToolbar đầu trang cầm timeframe)
   và bỏ dải "Đang hiện Top N trên N nguồn" — bảng luôn vẽ ĐỦ mọi nguồn nên dải chỉ nói lại chính
   cái bảng; dải mẫu số chỉ dành cho card đang cắt bớt. */
export type SrcMatrixBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Link "Xem hồ sơ từng nguồn" trong note (port href="#/sources", prototype dòng 2128). */
  onGo?: (route: string) => void;
};

export function SrcMatrixBlock({ data, cfg, onGo }: SrcMatrixBlockProps) {
  return (
    <Card title="Độ toàn vẹn nguồn">
      <SrcMatrix sources={data.sources} metrics={data.metrics} cfg={cfg} asOf={data.asOf} compact />
      <AxisLabel>Nguồn × nền tảng</AxisLabel>
      {/* 26/08 (owner "mở thêm nút bấm"): nối lại link hồ sơ nguồn của prototype (dòng 2128) —
          cùng idiom footer với cov-go-atlas. */}
      {onGo ? (
        <p className="text-[12px] text-ink-3 mt-2.5 mb-0">
          <button
            type="button"
            data-testid="src-go-sources"
            onClick={() => onGo("sources")}
            className="font-semibold text-ink-3 hover:text-ink hover:underline"
          >
            Xem hồ sơ từng nguồn
          </button>
        </p>
      ) : null}
    </Card>
  );
}
