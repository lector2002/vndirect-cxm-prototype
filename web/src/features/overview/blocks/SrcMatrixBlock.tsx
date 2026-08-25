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

export function SrcMatrixBlock({ data, cfg }: SrcMatrixBlockProps) {
  return (
    <Card title="Độ toàn vẹn nguồn">
      <SrcMatrix sources={data.sources} metrics={data.metrics} cfg={cfg} asOf={data.asOf} compact />
      <AxisLabel>Nguồn × nền tảng</AxisLabel>
    </Card>
  );
}
