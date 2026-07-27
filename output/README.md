# output/ — file nào là bản đang dùng

## ✅ Bản hiện tại

**`cxm-platform-prototype.html`** — bản UI prototype đang dùng, cập nhật 27/07/2026.

Một file tự chứa. Double-click là chạy, không cần server, không cần cài gì. Gửi qua email được.

- 14 route + 2 màn chi tiết, theo mô hình Enterpret cộng lớp hành trình của VNDIRECT
- Có nút **"Chạy bản giới thiệu"** ở đáy sidebar: guided tour 6 bước dùng khi trình bày trước lãnh đạo
- Sửa nội dung: mở bằng text editor, đọc hướng dẫn trong phần comment ở đầu file
- Đổi màu thương hiệu: sửa biến `--primary` trong khối `DESIGN TOKENS`

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
