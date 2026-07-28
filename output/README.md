# output/ — file nào là bản đang dùng

## ✅ Bản hiện tại

**`cxm-platform-prototype.html`** — bản UI prototype đang dùng, cập nhật 28/07/2026.

Một file tự chứa. Double-click là chạy, không cần server, không cần cài gì. Gửi qua email được.

- **Hai phần tách bạch**: CXM quản trị trải nghiệm · Voice of Customer. 11 nav item, 12 view, cộng màn hồ sơ điểm gãy.
- Có nút **"Chạy bản giới thiệu"** ở đáy sidebar: guided tour 6 bước dùng khi trình bày trước lãnh đạo
- Sửa nội dung: mở bằng text editor, đọc hướng dẫn trong phần comment ở đầu file
- Đổi màu thương hiệu: sửa biến `--primary` trong khối `DESIGN TOKENS`

**Bốn chỗ đáng xem trước tiên khi review bản 28/07:**

1. **`#/cxm` và `#/voc` — hai Tổng quan.** Hàng chip trên cùng đổi **set**: mỗi phần có 3 set trả lời 3 bộ câu hỏi khác nhau. Bấm **✎ Tùy chỉnh** để thêm/bớt từng khối, rồi **Trả set về mặc định** để hoàn nguyên. Mọi thanh chart bấm được và dẫn tới tab chi tiết của **chính phần đó**.
2. **`#/atlas` Bản đồ hành trình** — điều hướng ba nhịp ngang: chọn phase ở rail trên, chọn nhóm sản phẩm và flow ở hàng chip, rồi đọc chuỗi bước theo chiều ngang. Dải nối giữa hai bước dày mỏng theo số khách còn đi tiếp, vạch đỏ gạch chéo là phần rơi tại bước bên trái.
3. **`#/sources` Nguồn dữ liệu** — bấm một dòng để mở **hồ sơ dữ liệu** của nguồn đó: feedback trong nguồn ấy trông thế nào về mặt data. Đây là thứ thay cho màn Feed cũ.
4. **`#/rules` Chỉ số & ngưỡng** — nơi đặt "thế nào là cần theo dõi, thế nào là cần xử lý ngay". Thử hạ ô *Cần xử lý ngay* từ 15% xuống 10% rồi mở lại Bản đồ hành trình: bước 02 chuyển sang đỏ. Thử đổi **ngưỡng Z-score** từ 1,5 lên 3,0 rồi mở Tổng quan VoC: chart bất thường thôi khoanh điểm. Bấm **Trả về mặc định** để hoàn nguyên. Cấu hình chỉ tồn tại trong phiên — refresh là về mặc định, vì prototype không có backend.

**`cxm-redesign-options.html`** — tài liệu quyết định **bản 23/07**: chẩn đoán bản cũ, mô hình gốc Enterpret, 8 bổ sung của VNDIRECT. Vẫn hữu ích để hiểu *vì sao* chọn hướng Enterpret.

> ⚠️ Phần **IA và hệ thống hiển thị** trong file đó **đã lỗi thời** — nó còn mô tả `/health Sức khỏe hành trình` và nhóm `Nền dữ liệu`, cả hai không còn. IA hiện tại xem ở §Z của spec 28/07.

Spec đầy đủ: `../docs/superpowers/specs/2026-07-28-journey-voc-redesign-design.md` (kèm phụ lục `../docs/journey-provenance-audit.md`).
Spec 27/07 `../docs/superpowers/specs/2026-07-27-cxm-voc-redesign-design.md` đã bị thay thế ở IA, phase model, `#/health` và nhóm Nền dữ liệu — giữ để đối chiếu.

Spec 28/07 **đã implement** vào `cxm-platform-prototype.html` và verify cùng ngày: 6 phase · 20 nhóm sản phẩm · 32 flow (25 có nguồn xác minh) · 11 nav item · 12 view · 6 set dashboard. `#/health`, `#/surveys` và `#/feed` đã bỏ; gõ hash cũ vẫn tự chuyển đúng chỗ. **Đọc §Z của spec trước §B3 và §B6** — hai mục đó đã bị bổ sung ghi đè.

## 🗄 Bản cũ — giữ để đối chiếu, không dùng nữa

| File | Là gì |
|---|---|
| `vndirect-cxm-prototype.html` | Bản inline-build của React app 8 route. Đã bị thay thế. Tên gần giống bản mới — đừng nhầm. |
| `standalone-build/` | Build tĩnh của React app cũ. |
| `onboarding-control-tower/` | Build tĩnh của bản Control Tower onboarding, cũ hơn nữa. |
| `enterpret-cxm-benchmark.html` | Báo cáo benchmark Enterpret 23/07/2026, gap matrix 12 capability. Vẫn hữu ích khi cần tra cứu. |

Ba mục đầu là output của đường React đã dừng. Owner quyết định có xóa hay không.
