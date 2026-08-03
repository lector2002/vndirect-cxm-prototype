import type { Metric } from "./schema/index.ts";

/** Hướng so sánh của metric, suy từ dấu ≥ / ≤ trong `target` — MỘT nguồn sự thật duy nhất cho
    luật này trong toàn bộ src/. Đặt ở tầng `data/` (không phải `domain/`) vì thứ tự tầng của dự
    án là data → store → domain → design-system → features: `data/` không được import từ
    `domain/`, nhưng NGƯỢC LẠI thì được — nên đặt luật ở tầng thấp nhất trong hai nơi cần dùng nó
    (`domain/state.ts` và `data/mock-repository.ts`) là cách duy nhất để cả hai dùng chung MỘT
    hàm mà không đảo tầng. Trước đây `domain/state.ts` có bản `mdir` riêng (private, trùng luật)
    và `data/mock-repository.ts` tự gõ lại luật verdict mà không hỏi hướng — hai bản dễ lệch
    nhau theo thời gian; hàm này thay cả hai. */
export function metricDirection(m: Metric): "up" | "down" {
  return m.target.indexOf("≤") > -1 ? "down" : "up";
}
