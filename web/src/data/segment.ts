import type { SegUnknown } from "./schema/index.ts";

/* Hai loại "không biết" trên các trục phân khúc khách (age/tenure/acq — xem ghi chú về nav ở
   dưới) — TUYỆT ĐỐI không được gộp, vì cách chữa ngược nhau hoàn toàn:
   - 'chưa-biết' = hành trình chưa tới chỗ biết được (vd: chưa mở xong TK thì chưa tính được
                   tenure quan hệ). Đây là QUY LUẬT của hành trình, không phải lỗi — không "chữa"
                   được, chỉ có thể đợi khách đi tiếp. Nếu lọc bỏ nhóm này khi cắt theo trục đó,
                   kết quả chỉ còn lại những người ĐÃ đi hết hành trình — tức đúng những người
                   không rơi vào nhóm đang được xét (survivorship bias).
   - 'thiếu'     = lẽ ra phải biết mà không có (bug thu thập dữ liệu — vd: khách mở TK qua chi
                   nhánh nhưng kênh mở TK không ghi lại được). Đây LÀ bug, phải đi sửa pipeline
                   thu thập, không phải chờ.

   nav là NGOẠI LỆ về DỮ LIỆU, không phải về type (owner chốt 04/08): NAV đọc trực tiếp từ tài sản
   hiện tại nên không có đường nào để "chưa tới chỗ biết được" — khách chưa nạp tiền vẫn tính ra
   được, bằng 0 ⇒ rơi vào dải thấp nhất. Vì vậy dữ liệu đúng thì trục nav KHÔNG có nhóm "Không xác
   định". Type `Customer.navVnd` vẫn nhận sentinel, và validate rule 19 coi mọi sentinel navVnd là
   LỖI: chỗ duy nhất sentinel nav còn nghĩa là khi lời gọi lấy tài sản thất bại — đó là 'thiếu' (đi
   sửa pipeline), không được ghi thành 0 vì như thế là báo "khách không có tài sản" thay cho "không
   đọc được số".
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

/** Nhận cả `number` vì các trục dải giờ lưu SỐ THÔ (`Customer.navVnd`…): câu hỏi "giá trị này có
    phải sentinel không" phải hỏi được TRƯỚC khi biết nó là số hay chuỗi, không thì nơi gọi lại tự
    so chuỗi lần nữa — đúng thứ file này tồn tại để dẹp. */
export function isSegUnknown(v: string | number): v is SegUnknown {
  return v === UNKNOWN_YET || v === MISSING;
}
