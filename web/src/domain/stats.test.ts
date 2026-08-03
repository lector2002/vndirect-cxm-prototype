import { describe, it, expect } from "vitest";
import { seed, cfgDefault } from "../data/fixtures/seed.ts";
import { countAnomalies } from "./stats.ts";

/* q15 ("Bất thường theo tháng") là item được thiết kế riêng để test ngưỡng z. Số dưới là GOLDEN
   PHỤ THUỘC FIXTURE: S2.7 mở chuỗi 6→12 kỳ (D8a) nên số điểm CHẤM ĐƯỢC (z!==null, tức i>=2) tăng
   8→20, kéo số điểm vượt ngưỡng 7→19. Đã đối chứng độc lập: 6 điểm đuôi khớp byte-for-byte với
   prototype, 6 điểm prepend sinh đúng bằng monthly() của prototype (dòng 3806-3813), và
   domain/stats.ts KHÔNG bị sửa — nên 19 là hệ quả trung thực của chuỗi dài hơn, không phải
   regression.

   ✅ ĐÃ SỬA DETECTOR (owner chốt 02/08, S2.10): cửa sổ tối thiểu `i>=3` (domain/stats.ts) +
   `cfgDefault.anomaly.z = 2.5` (seed.ts) → q15 còn **4**. Trước đó tỷ lệ gắn cờ vô nghĩa: bản 6 kỳ
   gốc của prototype đã gắn cờ 7/8 = 88%, bản 12 kỳ là 19/20 = 95%. Nguyên nhân ở detector chứ
   không phải dữ liệu — z tính trên MỨC thô với cửa sổ mở rộng nên mọi chuỗi có xu hướng đều bị
   gắn cờ (dãy z hội tụ về √3≈1,73, vượt ngưỡng cũ 1,5), và tại i=2 chỉ có 2 điểm trước nên mọi
   chuỗi đơn điệu cho z ĐÚNG BẰNG 3,00 (đặc tính cỡ mẫu, không phải bất thường).
   4 điểm còn lại là những chỗ đứt mạch THẬT: t0 `402` (z=3,14) và `908` (z=10,63); t1 `205`
   (z=2,95 — bước nhảy +4 → +13) và `97` (z=−6,16).

   Số này CHỈ đúng khi tính trên q15 — gộp mọi item kind:'series' sẽ ra số khác (toàn bộ series:
   11), nên test neo thẳng vào id 'q15' thay vì lặp toàn bộ seed.qt. */
describe("countAnomalies trên qt id q15 (Z-score)", () => {
  const q15 = seed.qt.find((q) => q.id === "q15");
  if (!q15 || q15.kind !== "series") throw new Error("fixture q15 phải là QuantifySeries");
  const rows = q15.t;

  it("ngưỡng z=2.5 (cfgDefault.anomaly.z) + cửa sổ i>=3 → 4 điểm bất thường trên 18 điểm chấm được", () => {
    const total = rows.reduce((sum, row) => sum + countAnomalies(row.p, cfgDefault.anomaly.z), 0);
    expect(total).toBe(4);
  });

  /* Neo cứng cửa sổ tối thiểu: chuỗi 3 điểm KHÔNG có điểm nào chấm được (mọi i<3 → null), nên
     không bao giờ gắn cờ dù dữ liệu nhảy vọt cỡ nào. Đây là bất biến mà QuantifyWidget dựa vào để
     đổi chú thích thành "chưa đủ kỳ" ở bộ lọc 3 tháng. */
  it("cửa sổ i>=3: chuỗi 3 điểm luôn 0 bất thường, kể cả khi điểm cuối nhảy vọt", () => {
    expect(countAnomalies([10, 11, 9999], 2.5)).toBe(0);
    expect(countAnomalies([10, 11, 12, 9999], 2.5)).toBe(1);
  });

  it("ngưỡng z=30 → 0 điểm bất thường", () => {
    const total = rows.reduce((sum, row) => sum + countAnomalies(row.p, 30), 0);
    expect(total).toBe(0);
  });
});
