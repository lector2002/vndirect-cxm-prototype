# Enterpret — design language đọc từ ảnh sản phẩm (chuẩn áp cho MỌI màn)

Status: chuẩn tham chiếu · Ngày: 2026-08-02 · Nguồn: 2 ảnh owner cung cấp
- **Ảnh A** (01/08) — Enterpret Home, tenant Duolingo: 2 section, mỗi section 1 câu hỏi + 3 chart.
- **Ảnh B** (02/08) — "PM View | Learning Experience Team": hàng 3 card bar + 1 card line full-width.

Đây là ghi chép từ **quan sát ảnh**, không phải tài liệu chính thức của Enterpret. Chỗ nào suy đoán đều ghi rõ "suy đoán". Sản phẩm của họ nằm sau đăng nhập, WebFetch trang marketing không ra chi tiết thiết kế.

---

## 1. Bố cục trang (trên → dưới, ảnh B)

| Tầng | Nội dung | Ghi chú |
|---|---|---|
| Tiêu đề dashboard | `PM View \| Learning Experience Team` + `✏️` + `📌` | tên do user đặt, sửa/ghim ngay tại chỗ |
| Meta | `Dashboard · Kelly Schaefer-Flake · a month ago` | loại · người tạo · lần đổi cuối |
| Mời nhập mô tả | *"Add context to your dashboard by entering a brief description here. Click ✏️ to add."* | **empty state có tính dạy việc** — không phải chỗ trống im lặng |
| Thanh lọc | khung viền riêng: `📅 Default \| 7D \| 14D \| 4W \| 3M \| 6M \| 12M \| Custom` + `Show Filters (1)` | xem §2 |
| Section | `## Câu hỏi?` (chữ lớn, đậm, **ngoài** card) rồi tới các card trả lời | xem §3 |

**Điều đáng học nhất:** trang không có hero, không có câu dẫn dắt. Dòng đầu là **tên dashboard**, dòng hai là **ai/khi nào** — *provenance* thay cho *marketing*. Ta đã cắt hero (quyết định owner 01/08) → cùng hướng.

## 2. Thanh lọc thời gian

- Nằm trong **khung viền riêng**, tách khỏi nội dung — nó là điều khiển của cả trang, không thuộc card nào.
- Có `Default` ở đầu (không phải mốc thời gian — nghĩa là "theo mặc định của dashboard") và `Custom` ở cuối.
- 6 mốc: `7D · 14D · 4W · 3M · 6M · 12M`. Họ có mốc **ngày** vì có dữ liệu ngày.
- `Show Filters (1)` mang **badge số filter đang bật** → user luôn biết mình đang xem dữ liệu đã bị lọc.

**Áp cho ta:** ta chỉ có 3 kỳ tuyệt đối + chuỗi 6 điểm tháng → giữ `3 tháng · 6 tháng · 1 năm`; thêm mốc ngày là bịa số. Nhưng **badge số filter đang bật thì phải học** — `OverviewFilterBar` hiện không cho biết đang lọc gì.

## 3. Section = MỘT câu hỏi

- Tiêu đề section là **một câu hỏi thật**, chữ lớn đậm, đặt **ngoài** card: `What feedback is trending?`
- Các card bên dưới là *các cách trả lời* câu hỏi đó.
- Khi section chỉ có 1 card, card lặp lại chính câu hỏi làm tiêu đề (ảnh B).

**Ta đã đúng mô hình này** (`dash.qs[].q` + `b[]`). Khác biệt: tiêu đề section của ta nhỏ hơn nhiều → câu hỏi không "cầm trịch" được cụm card.

## 4. Anatomy card (hợp nhất ảnh A + B)

```
┌─────────────────────────────────────────────┐
│ L2 Keywords                        ▽   ⋮    │  ← header: tên trái, phễu + ⋮ phải
│ For last 3 months (Dec 01 → Mar 12, 2026)   │  ← kỳ TUYỆT ĐỐI, xám nhỏ
├─────────────────────────────────────────────┤
│ Showing Top 3 of 3 Level 2 Keywords         │  ← DẢI XÁM full-width
├─────────────────────────────────────────────┤
│  ▲                                          │
│ L2│  Course Structure  ███████████  12.28K  │  ← nhãn căn PHẢI · thanh DÀY · số sau thanh
│ kw│  AI Learning Fea.  ██████        8.69K  │
│  ▼│  Practice Hub      ██            3.15K  │
│    ↑ nhãn trục PHÂN LOẠI quay dọc           │
│                                             │
│           Count of Feedback Records         │  ← nhãn ĐƠN VỊ ĐO, căn giữa, dưới cùng
└─────────────────────────────────────────────┘
```

1. **Header** — tên chart bên trái (~13px, không đậm nặng), bên phải **icon phễu** + **`⋮`**. Không có nút chữ nào.
2. **Subtitle** — kỳ **tuyệt đối**: `For last 3 months (Dec 01, 2025 → Mar 12, 2026)`. Luôn nói cả *tương đối* lẫn *ngày thật*.
3. **Dải xám full-width** — `Showing Top <N> of <M> <đơn vị số nhiều>`. Đếm bằng **đơn vị**, không bằng tên mô tả của chiều.
   - Dải này chịu được **token nhấn màu**: ảnh B ghi `Showing Top 2 Anomalies for the month: **February, 2026**` với tháng tô đỏ/cam.
4. **Thân chart** — nền trắng, padding thoáng, không viền trong.
5. **Nhãn trục quay dọc, sát lề trái.**
6. **Nhãn đơn vị đo, căn giữa, dưới cùng.**
7. **Viền card rất nhạt, bo ~8px, gần như không shadow**, đặt trên nền xám nhạt.

## 5. ⚠ Quy tắc nhãn trục — chỗ ta từng làm SAI

Enterpret **không** đặt "đơn vị lên trục dọc". Họ đặt nhãn theo đúng thứ mà trục đó **mã hoá**:

| Loại chart | Trục dọc (quay dọc, lề trái) | Dưới cùng, căn giữa |
|---|---|---|
| Bar ngang (ảnh B, 3 card trên) | **tên CHIỀU**: `User Sentiments`, `Level 2 Keywords`, `Level1 Keywords` | **ĐƠN VỊ ĐO**: `Count of Feedback Records` |
| Line / anomaly (ảnh B, card dưới) | **ĐƠN VỊ ĐO**: `# Feedback Records` | (trục X là thời gian, tự hiển nhiên) |

Lý do nhất quán: **bar ngang có trục dọc = danh mục, trục ngang = số đo** → số đo phải nằm dưới. Line chart thì trục dọc = số đo.

→ Spec S2.6 của ta (`R3`) ghi "nhãn trục dọc CHỈ mang đơn vị" là **sai với bar ngang**, và S2.6a đã implement theo đó. Phải sửa (xem §11 mục 1).

## 6. Bar ngang — kiểu của họ vs của ta

| | Enterpret | Ta hiện tại |
|---|---|---|
| Độ dày thanh | **DÀY** (~44px khi 3 dòng, ~26px khi 6 dòng) — thanh là khối màu | `h-2.5` = **10px**, mảnh như progress bar |
| Nhãn hàng | chữ thường, **căn PHẢI**, sát mép trái thanh, **không có chấm màu** | căn trái, `truncate`, có chấm màu `●` dẫn đầu |
| Vị trí số | **ngay sau đầu thanh** (bám mép thanh → mỗi hàng một vị trí x khác nhau) | căn phải ở **một cột cố định** |
| Màu thanh | mỗi hàng **một màu phân loại khác nhau** | mặc định `--ink3` xám cho tất cả |
| Giá trị rất nhỏ | vẫn vẽ (`24` gần như không thấy thanh) nhưng vẫn in số | có sàn `Math.max(2, …%)` — tương tự |

Đánh đổi họ chọn: **số bám đầu thanh** dễ ghép cặp thanh↔số, nhưng **mất khả năng quét dọc cột số**. Cần owner chốt, không phải chuyện đúng/sai.

Chấm màu dẫn đầu của ta **thành thừa** khi thanh đã có màu — hai lần cùng một thông tin.

## 7. Line / anomaly chart (ảnh B)

- Gridline **ngang, nét đứt, rất nhạt**. Không có gridline dọc.
- Trục Y: **số đầy đủ** `1000 / 750 / 500 / 250 / 0` — không viết tắt K.
- Trục X: nhãn kỳ ngắn `Dec'25 · Jan'26 · Feb'26 · Mar'26`.
- **Đoạn đã có dữ liệu = nét liền; đoạn sau mốc bất thường = nét ĐỨT** → phần ngoại suy/chưa chắc vẽ khác hẳn. (Suy đoán: forecast, hoặc kỳ chưa đủ dữ liệu.)
- **Đường dọc nét đứt màu đỏ** tại mốc bất thường.
- **Tooltip**: hộp trắng viền đậm, dòng đầu là kỳ (`Feb'26`), mỗi dòng sau = chấm màu + icon (`⚠`/`🔑`) + tên + **số căn phải**.
- **Legend nằm bên PHẢI**, xếp dọc, chấm màu + icon + chữ xuống dòng — không nằm dưới chart.

Đáng học nhất: **họ phân biệt bằng hình dạng đường (liền/đứt) đâu là dữ liệu thật, đâu là không**. Ta đang có đúng vấn đề đó với `1 năm` (seed chỉ 6 điểm) và với `fx()` là scale từ snapshot.

## 8. Màu

- Bảng phân loại **trầm, giảm bão hoà**: teal đậm, hồng đất, xanh dương nhạt, nâu vàng, tím, xám. Khoảng 6 màu.
- Sentiment dùng màu **có nghĩa**: Positive = xanh lá, Negative = đỏ đất, Neutral = xanh dương.
- Nền trang xám rất nhạt, card trắng, viền nhạt.
- Đỏ/cam chỉ xuất hiện ở **điểm bất thường** và **token nhấn trong dải xám** — rất tiết chế.

→ Khớp thang `--cat-1..5` + `--cat-other` đã chốt 02/08. Khác một chỗ: họ cho sentiment dùng màu ngữ nghĩa. Ta có `--good/--crit/--watch` cho việc đó nhưng phải cẩn thận: ở ta đỏ = "cần xử lý ngay", nếu Negative cũng đỏ thì hai nghĩa chồng nhau.

## 9. Chữ & số

- Tiêu đề card nhỏ (~13px), **không đậm nặng** — card không cạnh tranh với tiêu đề section.
- Tiêu đề section to và đậm hẳn — đây là cái cầm trịch thị giác.
- Số trên thanh **viết tắt K**: `27.45K · 12.28K · 9.11K · 8.69K · 5.51K · 4.27K · 3.15K`. Dưới 1000 để nguyên: `940 · 654 · 633 · 605 · 24`.
  - ⚠ Họ dùng **2 chữ số thập phân**; ta chốt **1** (`27,5K`). Lệch có ý thức, owner cần biết.
- Trục Y line chart và tooltip: **số đầy đủ**, không K.

## 10. Cái ta CHỦ Ý không sao chép

| Của họ | Vì sao ta không lấy |
|---|---|
| Mốc `7D · 14D · 4W` | ta không có dữ liệu ngày; thêm mốc ngày là bịa số |
| Tiêu đề card màu teal/link | ở họ tiêu đề card **là link**; ở ta link đã là cam VNDIRECT → teal không-phải-link gợi sai affordance. Ta mở chi tiết bằng `⋮` |
| 2 chữ số thập phân cho K | dải số của ta tối đa ~317K, 1 số lẻ đủ; 2 số lẻ làm nhãn dài mà không thêm thông tin quyết định |
| Avatar/tên người tạo | fixture không có người thật; bịa danh tính là tạo niềm tin sai |

## 11. Khoảng cách giữa app của ta và chuẩn này — danh sách phải chốt với owner

1. **Nhãn trục sai vai** — S2.6a đặt đơn vị đo lên trục dọc của bar ngang. Phải đổi: trục dọc = tên chiều (`dim.label`), dưới cùng căn giữa = đơn vị đo (`BASE_AXIS[base]`).
2. **Thanh quá mảnh** — `h-2.5` (10px) vs ~26-44px. Thanh mảnh làm chart trông như progress bar, không như biểu đồ so sánh.
3. **Chấm màu dẫn đầu nhãn thành thừa** khi thanh đã mang màu phân loại.
4. **Vị trí số**: cột cố định (ta) vs bám đầu thanh (họ) — cần chốt.
5. **Bar toàn xám** — chưa dùng thang `--cat-*` vừa thêm.
6. **Tiêu đề section chưa cầm trịch** — chưa đủ to/đậm so với tiêu đề card.
7. **Thiếu badge "đang lọc N"** trên thanh lọc.
8. **Không phân biệt dữ liệu thật vs ngoại suy bằng hình dạng đường** — trong khi `1 năm` của ta đang là no-op và `fx()` là scale từ snapshot. Chỗ này Enterpret nghiêm túc hơn ta.
9. **Donut 14 lát** — với 5 màu phân loại buộc phải gom đuôi thành "Khác (+N)". Ảnh A cho thấy họ giới hạn 6 lát.
10. **Empty state chưa dạy việc** — Enterpret dùng chỗ trống để chỉ user cách làm; ta chỉ ghi "không có dữ liệu".
11. **Card cross-tab không có dải xám** dù cùng mang thông tin "đang xem bao nhiêu trên tổng" (phát hiện của worker S2.6a).
12. **Tiêu đề + provenance của set** — Enterpret có `tên · người tạo · lần đổi cuối` và lời mời nhập mô tả. Ta cắt `setbar.meta` (quyết định 01/08) nên hiện **không** có provenance nào cho set. Cần xem lại: cắt meta là để bỏ nhiễu, nhưng "set này ai dựng, đổi lần cuối khi nào" là thông tin tin-cậy, không phải nhiễu.
