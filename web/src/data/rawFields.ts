import type { Customer, SegUnknown } from "./schema/index.ts";

/* DANH MỤC DỮ KIỆN ĐANG CÓ về một khách — "hệ thống thật sự biết gì", tách hẳn khỏi "chia khách thế
   nào" (khai báo chiều, xem `Dim.cut` ở data/schema/config.ts).

   Đây là GIỚI HẠN TRUNG THỰC của việc owner tự thêm chiều: một chiều chỉ chia lại được dữ kiện có
   trong danh mục này. Không có dữ kiện tỉnh thành thì không cách khai báo nào sinh ra được chiều
   "theo tỉnh thành" — muốn có, pipeline phải mang dữ liệu đó về hồ sơ khách trước. Nên file này
   **dev sở hữu**: nó dài ra khi nguồn dữ liệu dài ra, không khi owner bấm nút trên màn quản trị.
   Màn thêm chiều phải cho chọn `source` TỪ danh mục này, không cho gõ tay tên dữ kiện.

   Vì sao TÁCH LÀM HAI bảng thay vì một `Record<string, (c) => unknown>`: chiều cắt ngưỡng cần dữ
   kiện dạng SỐ (bandOf chỉ nhận số + sentinel), chiều lấy nguyên giá trị cần dữ kiện dạng DANH MỤC.
   Gộp một bảng thì kiểu trả về phải nới thành union và mọi nơi dùng đều phải ép kiểu — ép kiểu ở
   đây nghĩa là một khai báo sai (chiều ngưỡng trỏ vào dữ kiện chữ) lọt qua compiler rồi vỡ lúc
   chạy. Hai bảng thì compiler bắt ngay tại chỗ khai. */

/** Dữ kiện DẠNG SỐ — nguyên liệu của chiều cắt ngưỡng. Sentinel đi qua nguyên vẹn (bandOf trả lại
    chính nó): 'chưa-biết' của tuổi là quy luật hành trình, không nhóm nào được hấp thụ nó. */
export const CUST_NUM: Record<string, (c: Customer) => number | SegUnknown> = {
  ageYears: (c) => c.ageYears,
  navVnd: (c) => c.navVnd,
  tenureMonths: (c) => c.tenureMonths,
};

/** Dữ kiện DẠNG DANH MỤC — nguyên liệu của chiều lấy nguyên giá trị. */
export const CUST_CAT: Record<string, (c: Customer) => string> = {
  seg: (c) => c.seg,
  tier: (c) => c.tier,
  acq: (c) => c.acq,
};

/** Nhãn tiếng Việt của từng dữ kiện — để màn thêm chiều hiện danh sách chọn đọc được, thay vì bắt
    owner chọn giữa `navVnd` và `tenureMonths`. Chỉ là nhãn hiển thị, không tham gia tính toán. */
export const RAW_LABEL: Record<string, string> = {
  ageYears: "Tuổi (số năm)",
  navVnd: "Tài sản hiện tại (VNĐ)",
  tenureMonths: "Thâm niên quan hệ (số tháng)",
  seg: "Phân khúc khách",
  tier: "Hạng giá trị",
  acq: "Kênh mở tài khoản",
};
