# Quantify (thư viện chart) — HANDOFF để BRAINSTORM LẠI

_Tạo 2026-07-31. Đọc file này + `AI-CONTEXT.md` + `docs/REDESIGN-PLAN-HANDOFF.md` trước._

## Việc của session mới
**Nghiên cứu + brainstorm lại toàn bộ tab `#/quantify` TRƯỚC KHI code.** Owner muốn Opus:
1. Grill owner để hiểu họ thật sự muốn "thư viện tạo chart" như thế nào (một câu hỏi một lúc, mỗi câu kèm đề xuất).
2. Chốt mô hình + luồng + component, ghi thành spec.
3. Rồi mới slice + thực thi.

**KHÔNG lao vào code ngay.** Bản hiện tại chỉ là **prior-art để phản biện**, không phải nền tảng bắt buộc kế thừa. Owner đã nói: *"redesign lại thư viện chart… brainstorm lại tab này trước khi thực thi."*

## Prior-art hiện có trong file (đang chạy, harness xanh — để CRITIQUE, có thể đập)
`#/quantify` = 3 màn con trong một tab, chuyển bằng state (không đổi route):
- **`quantifyLib()`** (mặc định) — thanh trên: ô search (tên/chiều) + filter chips theo loại chart (Bar/Donut/Line/Cohort/Anomaly, có đếm) + nút **＋ Tạo chart**. Dưới: lưới **2 chart/dòng** (`grid g2`), mỗi thẻ = `qWidget(chart)` thật + badge loại + nút **Xem chi tiết · Đổi tên · Xóa**.
- **`quantifyCreate()`** — builder: chọn `show` (11 chiều DIMS) × `metric` (Count/Percentage) × `chart` (**chỉ Bar+Donut**) → xem trước → đặt tên → Lưu.
- **`quantifyDetail(id)`** — chart cỡ lớn + metadata (chiều, chỉ số, đang dùng ở set nào) + note + đổi tên/xóa.

Code: `V.quantify` là dispatcher; helper `qType/qDim/qTypeBadge`, `qActions`. Hàm điều hướng/CRUD đặt cạnh `$v` (~dòng 4162): `qSave` `qDelete` `qRenSave` `qDelAsk/qDelCancel` `qRenAsk/qRenCancel` `qGoCreate/qGoLib/qOpen/qSearch/qFilter/qClearFilter`. State ở `ST.sel`: `qview` `qDetail` `qSearch` `qFilter` `qb` `qRen` `qDel` `quantify`.
Spec bản cũ (đã đập, giữ tham chiếu): `docs/superpowers/specs/2026-07-31-quantify-chart-manager-spec.md`.

## Ràng buộc BẤT BIẾN (giữ dù redesign kiểu gì)
- **`validateFixture()` phải trả rỗng** sau mọi thao tác (chạy mỗi render; đứt → banner đỏ mọi màn). §17 kiểm mỗi `DATA.qt` item; §12b (dòng ~1715) kiểm block trong `DATA.dash` phải trỏ chart có thật.
- **Xóa chart phải guard**: `qUsedBy(id)` xét CẢ `DATA.dash` (đứt → banner) LẪN `ST.boards` (đứt → `renderSet` gọi `qWidget(undefined)` → THROW chết view). Đừng narrow lại về một nguồn.
- **Store in-memory** (mutate `DATA.qt`), non-persist, refresh reset. KHÔNG localStorage (tránh mô hình persist thứ hai).
- **Không bịa data**: fixture tổng hợp không có chuỗi thời gian cho hầu hết chiều → hiện chỉ dựng Bar/Donut; series charts (`kind:'series'`: q5–q8,q15) là curated, builder không tạo. Nếu muốn dựng Line/Cohort/Anomaly động thì phải có nguồn chuỗi thời gian thật, KHÔNG sinh số giả.
- **Mô hình Enterpret**: builder là danh sách đóng (không ô nhập tự do) — chủ ý, người dùng thấy giới hạn công cụ. Cân nhắc kỹ trước khi bỏ.
- **esc()** mọi tên do người dùng nhập; xác nhận xóa dùng inline two-step, KHÔNG `confirm()` browser (block automation).
- Nguồn data trong hệ thống giao dịch của công ty CK **chưa chốt** → giữ **placeholder** ở lớp nguồn (11 DIMS hiện tại là các chiều fixture, không phải nguồn thật).

## Dữ liệu nền
- `DATA.qt` = **15 chart seed**: 10 loại `show` (dựng động qua `qRun()`) + 5 loại `series` (curated). Gần hết bị `DATA.dash` set tham chiếu → xóa phần lớn bị guard chặn.
- 11 chiều `DIMS` (dòng ~1418): l1/l2/l3/theme/sub (taxonomy), src (nguồn), cat (intent), sen (sentiment), pf (nền tảng), seg (segment), tier (value tier). Đây là "nguồn dữ liệu có sẵn" của builder.
- `qWidget` (dòng ~1901), `qRun` (~1458), `renderSet`/`curB`/`BLOCKS` (~1960-2206).

## Câu hỏi mở để brainstorm (seed — grill owner, đừng tự quyết)
1. **"Sửa định nghĩa chart"**: bản hiện chỉ đổi TÊN. Có cần nạp chart về builder để đổi chiều/kiểu rồi lưu đè? (owner đã gợi ý ở session trước)
2. **Nhân bản (duplicate) chart**?
3. **Loại chart**: chỉ Bar+Donut có đủ không? Có cần Line/Cohort/Anomaly dựng động (cần nguồn chuỗi thời gian thật)? Có cần **ghép nhiều chiều** trong một chart (grouped/stacked/so sánh) — owner từng nói "lấy các nguồn dữ liệu hiện có để ghép vào chart"?
4. **Quan hệ với set/dashboard**: compose chart→set hiện nằm ở ✎ Tùy chỉnh của Tổng quan. Có nên đưa về Quantify không? (quyết định cũ: dời ✎ về Quantify — chưa làm)
5. **Tổ chức thư viện**: cần folder/tag/nhóm khi nhiều chart? phân trang? thumbnail nhẹ vs render full chart?
6. **Nguồn dữ liệu**: mô hình nguồn nên trừu tượng hóa thế nào khi hệ thống giao dịch thật chưa chốt? Placeholder ra sao?
7. **Vai trò tab**: "trình tạo & quản lý chart" thuần, hay còn là nơi khám phá dữ liệu (drill-down)? Hiện thẻ chart drill sang vocjourney/topics/sources qua `blkClick`.

## Verify (bắt buộc mỗi lần đụng prototype)
- `node output/_harness.js` → phải in `✓ Tất cả kiểm tra đạt`, exit 0. §11b phủ save/delete(guard 2 đường)/rename + 3 màn con + search/filter.
- **Harness đã sửa bit-rot 31/07** (giữ lại, KHÔNG thuộc Quantify): stub `el()` robust (`classList/style/remove/getBoundingClientRect`) + `requestAnimationFrame` no-op; `ROUTES` loại `topic` khỏi coverage-check + thêm loop `#/topic/<id>`. Trước đó harness KHÔNG chạy được từ ~29/07 nên mọi "đã verify 28/07" trong AI-CONTEXT có trước tour/#/topic và chưa từng kiểm.

## Trạng thái deploy / git
- `origin/main` = `faeb871` (live). Session này **chưa commit** — thay đổi Quantify + harness còn ở working tree. Owner quyết commit/deploy hay không SAU khi chốt hướng redesign.
- Chạy local để xem: `python -m http.server 8765 --directory output` → `http://127.0.0.1:8765/cxm-platform-prototype.html#/quantify`.
