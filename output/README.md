# output/ — file nào là bản đang dùng

## ✅ Bản hiện tại

**`cxm-platform-prototype.html`** — bản UI prototype đang dùng, cập nhật 28/07/2026.

Một file tự chứa. Double-click là chạy, không cần server, không cần cài gì. Gửi qua email được.

- 14 route + màn hồ sơ điểm gãy, theo mô hình Enterpret cộng lớp hành trình của VNDIRECT
- Có nút **"Chạy bản giới thiệu"** ở đáy sidebar: guided tour 6 bước dùng khi trình bày trước lãnh đạo
- Sửa nội dung: mở bằng text editor, đọc hướng dẫn trong phần comment ở đầu file
- Đổi màu thương hiệu: sửa biến `--primary` trong khối `DESIGN TOKENS`

**Hai chỗ đáng xem trước tiên khi review bản 28/07:**

1. **`#/atlas` Bản đồ hành trình** — điều hướng ba nhịp ngang: chọn phase ở rail trên, chọn flow ở hàng chip, rồi đọc chuỗi bước theo chiều ngang. Dải nối giữa hai bước dày mỏng theo số khách còn đi tiếp, vạch đỏ gạch chéo là phần rơi tại bước bên trái. Bấm một bước để mở hồ sơ 3 tab bên dưới.
2. **`#/rules` Chỉ số & ngưỡng** (menu Quản trị) — nơi đặt "thế nào là cần theo dõi, thế nào là cần xử lý ngay". Thử hạ ô *Cần xử lý ngay* từ 15% xuống 10% rồi mở lại Bản đồ hành trình hoặc Sức khỏe hành trình: bước 02 chuyển sang đỏ. Bấm **Trả về mặc định** để hoàn nguyên. Cấu hình chỉ tồn tại trong phiên — refresh browser là về mặc định, vì prototype không có backend.

**`cxm-redesign-options.html`** — tài liệu quyết định: chẩn đoán bản cũ, mô hình gốc Enterpret, 8 bổ sung của VNDIRECT, IA và hệ thống hiển thị. Đọc file này để hiểu *vì sao* prototype được thiết kế như vậy.

Spec đầy đủ: `../docs/superpowers/specs/2026-07-27-cxm-voc-redesign-design.md`

## 🗄 Bản cũ — giữ để đối chiếu, không dùng nữa

| File | Là gì |
|---|---|
| `vndirect-cxm-prototype.html` | Bản inline-build của React app 8 route. Đã bị thay thế. Tên gần giống bản mới — đừng nhầm. |
| `standalone-build/` | Build tĩnh của React app cũ. |
| `onboarding-control-tower/` | Build tĩnh của bản Control Tower onboarding, cũ hơn nữa. |
| `enterpret-cxm-benchmark.html` | Báo cáo benchmark Enterpret 23/07/2026, gap matrix 12 capability. Vẫn hữu ích khi cần tra cứu. |

Ba mục đầu là output của đường React đã dừng. Owner quyết định có xóa hay không.
