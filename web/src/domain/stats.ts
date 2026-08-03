/* Thống kê chuỗi điểm — port 1-1 từ prototype (output/cxm-platform-prototype.html).
   Không side-effect, không đọc DOM/global. */

/* Z-score theo đúng định nghĩa Enterpret: số độ lệch chuẩn mà điểm cuối nằm cách trung bình của
   các kỳ TRƯỚC nó (không gồm chính nó). Trả về null khi chưa đủ mẫu hoặc phương sai của các kỳ
   trước bằng 0. Port từ zScores() (~dòng 1489).

   CỬA SỔ TỐI THIỂU `i >= 3` — owner chốt 02/08, CỐ Ý LỆCH khỏi prototype (prototype dùng `i < 2`).
   Lý do đo được: với đúng 2 điểm trước, mọi chuỗi ĐƠN ĐIỆU cho z ĐÚNG BẰNG 3,00 — prev = [a, a+d]
   nên mean = a + d/2, sd = d/2, v = a + 2d ⇒ z = (1,5d)/(0,5d) = 3. Con số đó là đặc tính của cỡ
   mẫu chứ không phải của dữ liệu, nên điểm thứ 3 của MỌI chuỗi tăng/giảm đều bị gắn cờ vô điều
   kiện. Cùng với ngưỡng z=2,5 (cfgDefault.anomaly.z), q15 từ 19/20 điểm bị gắn cờ xuống còn 4 —
   đúng những chỗ đứt mạch thật (402, 908, 205, 97).

   HỆ QUẢ caller PHẢI xử: chuỗi ≤ 3 điểm không còn điểm nào chấm được (mọi `i < 3`). Nơi vẽ phải
   nói rõ "chưa đủ kỳ" thay vì im lặng hiện chart không có vòng tròn nào — xem QuantifyWidget.tsx. */
export function zScores(points: readonly number[]): (number | null)[] {
  return points.map((v, i) => {
    if (i < 3) return null;
    const prev = points.slice(0, i);
    const mean = prev.reduce((a, b) => a + b, 0) / prev.length;
    const sd = Math.sqrt(prev.reduce((a, b) => a + (b - mean) ** 2, 0) / prev.length);
    return sd === 0 ? null : (v - mean) / sd;
  });
}

/* Một điểm là bất thường khi |z| ≥ ngưỡng cấu hình (CFG.anomaly.z, truyền vào qua tham số).
   null (chưa đủ mẫu hoặc phương sai 0) không bao giờ là bất thường. Port từ isAnomaly (~dòng 1498). */
export function isAnomaly(z: number | null, threshold: number): boolean {
  return z !== null && Math.abs(z) >= threshold;
}

/* Đếm số điểm bất thường trong một chuỗi, theo ngưỡng z truyền vào. Helper mới (không có tên
   riêng trong prototype — nơi gọi tự lọc `isAnomaly` khi vẽ chart); gom lại thành một hàm thuần
   để test và tái dùng dễ hơn. */
export function countAnomalies(points: readonly number[], threshold: number): number {
  return zScores(points).filter((z) => isAnomaly(z, threshold)).length;
}
