import type { CxmData, Dim } from "../data/schema/index.ts";
import { projectSignalCounts } from "../data/projectSignalCounts.ts";
import { signalChart, type SignalChart } from "./signalChart.ts";

/* MỘT cửa duy nhất để hỏi "điểm đo X, cắt theo chiều D, trong kỳ P" (ADR-003).

   Đây là mối gộp thật giữa hai màn. Trước 14/08 `#/quantify` và `#/signals` chạy hai cỗ máy đếm có
   CÙNG hình dạng — đếm một thứ, cắt theo một chiều, vẽ — tách nhau chỉ vì `qRun` thiếu tham số "đang
   xem điểm đo nào" (`domain/quantify.ts:206` tự ghi lại điều đó). Hàm này là tham số còn thiếu, đặt
   ở ngoài `qRun` để `qRun` vẫn nói thật rằng nó không biết điểm đo nào.

   HAI ĐƯỜNG VÀO DỮ LIỆU, một phép cộng:
     · có `sigFires` (hạt thô)  → cộng tại chỗ, và CHỈ đường này cắt được theo kỳ;
     · không có, chỉ `sigCounts` → dùng bảng đã cộng sẵn, không cắt theo kỳ được.
   Bên dữ liệu thật có thể giao một trong hai (thiết kế §2). Yêu cầu một cửa sổ kỳ mà chỉ có bảng
   cộng sẵn là một câu hỏi KHÔNG trả lời được — nói ra, không lặng lẽ trả cả đời điểm đo và để người
   xem tưởng đó là kỳ họ vừa bấm. */

export type SigCutResult =
  | { kind: "refuse"; reason: string }
  | { kind: "draw"; chart: SignalChart; scoped: boolean };

export function sigCut(
  data: CxmData,
  dims: Record<string, Dim>,
  sigIds: readonly string[],
  dimId: string,
  win?: { from: string; to: string },
): SigCutResult {
  const hasFires = data.sigFires.length > 0;

  if (win && !hasFires) {
    return {
      kind: "refuse",
      reason:
        "Chưa nhận được dòng lượt bắn thô nên không cắt được theo kỳ — bảng đếm sẵn không mang mốc thời gian.",
    };
  }

  const rows = hasFires ? projectSignalCounts(data.sigFires, data.cust, dims, win) : data.sigCounts;
  return { kind: "draw", chart: signalChart(rows, data.signals, dims, sigIds, dimId), scoped: win !== undefined };
}
