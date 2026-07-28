# Kiểm chứng provenance của `DATA.flows` — 28/07/2026

Đối chiếu từng dòng `src:` trong `output/cxm-platform-prototype.html` (`DATA.flows`, dòng 463–504)
với hai nguồn thật:

- `docs/money-journey-mermaid.html` — **có đúng 7 sơ đồ** (h2 tại dòng 65 · 115 · 157 · 197 · 227 · 258 · 272)
- `docs/account-journey-mermaid.html` — **có đúng 13 sơ đồ** (h2 tại dòng 66 · 113 · 172 · 201 · 233 · 288 · 339 · 390 · 421 · 465 · 492 · 513 · 534)

## Mục lục nguồn thật

| Money Journey | Account Journey |
|---|---|
| MJ 1 · Tổng quan Money Journey | AJ 1 · Tổng quan luồng tài khoản |
| MJ 2 · Nạp tiền chi tiết + Tra soát | AJ 2 · Xác thực khách hàng — 4 phương thức |
| MJ 3 · Luồng MUA theo nhóm sản phẩm | AJ 3 · Thay đổi thông tin cá nhân |
| MJ 4 · Luồng BÁN + thuế / phí | AJ 4 · Cập nhật / Thay đổi CCCD gắn chip |
| MJ 5 · Rút tiền chi tiết | AJ 5 · Thông tin thụ hưởng (thêm / xóa) |
| MJ 6 · Phái sinh — ký quỹ CCP / VSDC | AJ 6 · Bảo mật — đăng nhập & xác thực giao dịch |
| MJ 7 · Chuyển tiền nội bộ giữa các TK giao dịch | AJ 7 · Báo cáo tài khoản |
| | AJ 8 · Đăng ký sản phẩm / dịch vụ — tổng quan |
| | AJ 9 · Mở tài khoản mới — luồng 2026 |
| | AJ 10 · Đăng ký Margin (GDKQ) |
| | AJ 11 · Mở tài khoản phái sinh |
| | AJ 12 · Phái sinh Pro |
| | AJ 13 · Ứng trước tiền bán (UTTB) |

## A. Provenance BỊA — trỏ tới sơ đồ không tồn tại

Money Journey chỉ có 7 sơ đồ. Năm flow dưới đây trỏ tới MJ 9–14.

| Flow | `src` đang ghi | Thực tế |
|---|---|---|
| `f-order` Đặt / sửa / hủy lệnh | MJ · Sơ đồ 9 | **Không tồn tại.** MJ không có sơ đồ luồng đặt lệnh. Gần nhất là MJ 3 (MUA theo nhóm sản phẩm) nhưng đó là sơ đồ cơ chế thanh toán, không phải luồng thao tác đặt lệnh. |
| `f-reject` Lệnh bị từ chối & reason code | MJ · Sơ đồ 10 | **Không tồn tại.** Không nguồn nào mô tả reason code lệnh bị từ chối. |
| `f-mgn-reg` Đăng ký margin | MJ · Sơ đồ 12 | Sai file. Đúng là **AJ 10**. |
| `f-mgn-call` Call margin & xử lý | MJ · Sơ đồ 13 | **Không tồn tại** ở cả hai file. MJ 6 là ký quỹ phái sinh CCP, không phải call margin cơ sở. |
| `f-adv` Ứng trước tiền bán | MJ · Sơ đồ 14 | Sai file. Đúng là **AJ 13**. |

## B. Provenance SAI SỐ — flow có thật, con trỏ trỏ nhầm chỗ

| Flow | `src` đang ghi | Sơ đồ đó thật ra là gì | Đúng phải là |
|---|---|---|---|
| `f-dep-va` Nộp tiền qua VA / QR | MJ · Sơ đồ 3 | Luồng MUA theo nhóm sản phẩm | **MJ 2** |
| `f-dep-link` Liên kết ngân hàng | MJ · Sơ đồ 4 | Luồng BÁN + thuế / phí | **MJ 2** — liên kết NH là 1 trong 4 kênh nạp *bên trong* MJ 2, không phải sơ đồ riêng |
| `f-wd` Rút tiền về ngân hàng | MJ · Sơ đồ 6 | Phái sinh — ký quỹ CCP / VSDC | **MJ 5** |
| `f-onb-first` Định hướng & giao dịch đầu tiên | AJ · Sơ đồ 11 | Mở tài khoản phái sinh | **Không có nguồn.** Phải chuyển `verified:false` |
| `f-lead-otp` Đăng ký & xác thực SĐT | AJ · Sơ đồ 1 | Tổng quan luồng tài khoản | **Không có nguồn** ở mức chi tiết. AJ 9 có bước nhập SĐT nhưng nằm trong flow MTK |

## C. Provenance ĐÚNG

| Flow | `src` | Xác nhận |
|---|---|---|
| `f-open-2026` Mở tài khoản mới 2026 | AJ · Sơ đồ 2 & 9 | Đúng. AJ 9 là luồng MTK 2026, AJ 2 là 4 phương thức xác thực dùng trong đó |
| `f-tr-sub` Chuyển tiền giữa tiểu khoản | MJ · Sơ đồ 7 | Đúng |

## D. Sai NỘI DUNG, không chỉ sai con trỏ

- **`f-dep-va` tên là "Nộp tiền qua VA / QR"** — MJ 2 liệt kê 4 kênh nạp: **quét mã QR · cổng nộp tiền CK (BIDV·VIB·VCB·VietinBank·VPBank) · liên kết NH chi hộ tự động (chỉ BIDV·VPBank, trùng CCCD) · nộp tại quầy (4 TK tổng ACB·BIDV·VCB·VietinBank)**. Không có khái niệm "VA". Tiền vào **TK chuyên dụng 021C01 (cơ sở) / 021C02 (phái sinh)**. Không hỗ trợ ATM và thẻ Visa.
- **Thiếu hẳn sub-flow Tra soát** — MJ 2 có nhánh phục hồi 6 trạng thái (Tạo yêu cầu → Chờ tiếp nhận → Đang xử lý TTTT → Chờ bên thứ ba → Hoàn tất / Từ chối), SLA 1 ngày làm việc, chứng từ tối đa 5 file. Đây là flow đau nhất trong dòng tiền mà bản đồ hiện tại không có.
- **`f-wd` mất toàn bộ cổng kiểm soát** — MJ 5 có chuỗi gate thật: số dư *được phép* rút (= dư tiền − chờ T+2 − nợ margin+lãi − phong tỏa − ký quỹ PS) → RTT > 100% (dưới thì Smart Sell) → xác thực CCCD qua VNeID (bắt buộc TK mở sau 01/01/2026) → chữ ký video call (TK phái sinh) → hoàn thiện hợp đồng → OTP → giờ & hạn mức (08–16h không hạn mức, ngoài giờ tối đa 499.999.999đ) → blackout cuối tháng.

## E. Chín sơ đồ CÓ THẬT nhưng không có flow nào trong bản đồ

| Sơ đồ | Nội dung | Ghi chú |
|---|---|---|
| AJ 3 | Thay đổi thông tin cá nhân | servicing |
| AJ 4 | Cập nhật / Thay đổi CCCD gắn chip | servicing · chỉ làm được trên DGO app |
| AJ 5 | Thông tin thụ hưởng (thêm / xóa) | servicing · sai là chặn rút tiền |
| AJ 6 | Bảo mật — mật khẩu · PIN · Smart OTP · thiết bị tin cậy | servicing |
| AJ 7 | Báo cáo tài khoản · sao kê · tổng quan tài sản · lịch dòng tiền | servicing |
| AJ 8 | Đăng ký sản phẩm / dịch vụ — tổng quan 2 luồng | cổng vào của mọi flow đăng ký |
| AJ 12 | Phái sinh Pro — giao dịch trong ngày | IM 5,6% day-trade vs 17,5% qua đêm |
| MJ 6 | Phái sinh — ký quỹ CCP / VSDC | nộp/rút ký quỹ chỉ 8h–16h |
| MJ 2 (nhánh) | Tra soát nạp tiền | xem mục D |

**AJ 3–7 đều là servicing / tự quản lý tài khoản.** Mô hình 7 phase hiện tại không có phase servicing —
nó dồn nhóm này vào `p7 Chăm sóc, khiếu nại & Churn`, vốn nói về khiếu nại chứ không phải tự phục vụ.
Đây là sai lệch cấu trúc, không chỉ là thiếu dòng.

## F. Cơ sở để tách Giao dịch theo sản phẩm

MJ 3 và MJ 4 đã liệt kê sẵn nhóm sản phẩm, với cơ chế khác nhau đủ để mỗi cái là một hành trình riêng:

| Sản phẩm | MUA (MJ 3) | BÁN / tất toán (MJ 4) |
|---|---|---|
| Cổ phiếu / ETF | T+2 · tiền mặt **hoặc** margin (mã thuộc danh mục ký quỹ) | phí GD + thuế TNCN 0,1% khấu trừ trực tiếp · UTTB nhận ngay có phí |
| Chứng quyền CW | T+2 · chỉ CW MUA · **không được ký quỹ** | như trên · đáo hạn ITM = bình quân giá CKCS 5 phiên − giá thực hiện |
| Trái phiếu DBOND / VBOND | **chỉ tiền mặt** · hạch toán T (riêng lẻ) / T+1 (niêm yết) · kỳ hạn 30–365 ngày | trả sớm → chỉ 0,1%/năm, mất lãi cam kết |
| Quyền mua ưu đãi | **chỉ tiền mặt** · nộp trước 16h ngày cuối · CP về sau niêm yết bổ sung | thuế TNCN đầu tư vốn 5% (SL CP quyền × mệnh giá × 5%) |
| Chứng chỉ quỹ mở | **chỉ tiền mặt** · phiên NAV · nộp từ số dư TK hoặc TK ngân hàng | bán theo phiên NAV · **chọn nơi nhận tiền: TK chứng khoán hoặc thẳng TK ngân hàng** (dòng tiền ra, bỏ qua bước Rút) |
| Phái sinh VN30F | ký quỹ riêng tại VSDC 17,5% (an toàn 21,875%) · T+0 · không dùng margin cơ sở | lãi/lỗ thanh toán **hàng ngày** · lãi về sáng T+1, lỗ khấu trừ / nợ thấu chi trước 13h T+1 · đáo hạn thứ 5 tuần 3 |

Năm flow có provenance bịa ở mục A (`f-order`, `f-reject`, `f-mgn-call`) và flow không nguồn
`f-port` chính là vùng cần thay bằng cấu trúc theo sản phẩm này.

---

*Nguồn đối chiếu: `docs/money-journey-mermaid.html` và `docs/account-journey-mermaid.html`,
bản cập nhật 2026-07-21 từ Trung tâm hỗ trợ VNDIRECT + BRD nội bộ "MỞ TÀI KHOẢN 2026".*
