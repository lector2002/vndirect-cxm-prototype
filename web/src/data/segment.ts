import type { SegUnknown } from "./schema/index.ts";

/* Hai loại "không biết" trên các trục phân khúc khách (age/nav/tenure/acq) — TUYỆT ĐỐI không
   được gộp, vì cách chữa ngược nhau hoàn toàn:
   - 'chưa-biết' = hành trình chưa tới chỗ biết được (vd: chưa nạp tiền thì chưa có NAV). Đây là
                   QUY LUẬT của hành trình, không phải lỗi — không "chữa" được, chỉ có thể đợi
                   khách đi tiếp. Nếu lọc bỏ nhóm này khi cắt theo trục đó, kết quả chỉ còn lại
                   những người ĐÃ đi hết hành trình — tức đúng những người không rơi vào nhóm
                   đang được xét (survivorship bias).
   - 'thiếu'     = lẽ ra phải biết mà không có (bug thu thập dữ liệu — vd: đã nạp tiền nhưng NAV
                   không ghi lại được). Đây LÀ bug, phải đi sửa pipeline thu thập, không phải chờ.
   Gộp hai loại này làm một sẽ biến quy luật hành trình thành bug (báo động giả, đi sửa cái không
   sửa được) hoặc giấu bug dưới danh nghĩa quy luật (bug thật bị bỏ qua vì tưởng "khách chưa tới
   đó thôi"). Coverage của một trục phải là số ĐẾM ĐƯỢC (đếm sentinel), không phải số khai báo.

   Đặt ở tầng `data/` (không phải `domain/`) vì đây là NGUỒN DUY NHẤT nhận diện sentinel trong
   toàn bộ src/ — đúng lý do metric-direction.ts đặt `metricDirection` ở đây: dự án này đã từng
   dính lỗi so chuỗi rải rác nhiều nơi cho luật hướng chỉ số (hai bản sao `mdir` ở domain/state.ts
   và data/mock-repository.ts, lệch nhau theo thời gian) — nay gom về một hàm. Sentinel phân khúc
   dùng lại đúng bài học đó: mọi nơi cần hỏi "giá trị này có phải sentinel không" phải gọi
   `isSegUnknown`, không tự so chuỗi 'chưa-biết'/'thiếu' lần nữa. */
export const UNKNOWN_YET = "chưa-biết" as SegUnknown;
export const MISSING = "thiếu" as SegUnknown;

export function isSegUnknown(v: string): v is SegUnknown {
  return v === UNKNOWN_YET || v === MISSING;
}
