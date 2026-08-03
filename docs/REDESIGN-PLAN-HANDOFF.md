# CXM Redesign — Handoff cho session mới

_Cập nhật: 2026-07-31. Đọc file này + `AI-CONTEXT.md` trước khi làm._

## Trạng thái hiện tại
- **Deploy:** `origin/main` = `faeb871` đang live (GitHub Pages copy `output/cxm-platform-prototype.html` → index.html). Local đã sync, 0 commit lệch.
- **Deliverable đã có (session trước):**
  - `output/cxm-review-tracking-plan.html` — **untracked**. Review từng màn (14 mục: component + ID đề xuất + quyết định) + skeleton tracking-plan journey (Deliverable A) + nút xuất CSV. Nếu muốn giữ trong git thì commit file này.
  - Tab "Kế hoạch tracking journey" (thêm vào màn Sources) đang nằm ở branch **`backup/deploy-tracking`** (`2c1e485`) — CHƯA merge. Sẽ gộp vào redesign Sources (Sprint 5), không apply riêng (quyết định = phương án b).

## Quyết định đã khóa
- **Quantify = trình tạo bảng & quản lý:** dựng chart từ nguồn data hệ thống → compose thành set.
- **Overview:** đúng **2 tab CỐ ĐỊNH** — *Điều hành CX* (`b-cxm-exec`) + *Toàn cảnh tiếng nói* (`b-voc-all`). Các tab khác **thêm/sửa/xóa** bằng cách combine chart từ Quantify. Chức năng ✎ Tùy chỉnh dời về logic Quantify.
- **Agent vs Trợ lý (tách rõ, làm cuối):** "Agent & cảnh báo" thực chất là engine **rule-based** → đổi tên **"Cảnh báo & giám sát"**, giữ. "Trợ lý" = lớp **LLM** hỏi–đáp, rủi ro cao → optional/cuối cùng.
- **Xuyên suốt:** "full flow của tất cả tính năng để dùng thực tế" = định nghĩa **stage cho cả 32 flow** (placeholder nơi sản phẩm chưa chốt) → nuôi atlas + rules + work + tracking.

## Build order (đã chốt)
1. **Quantify** — ĐANG BRAINSTORM LẠI. Bản 31/07 (thư viện chart 3 màn: lib/create/detail; tạo/lưu/xóa-có-guard/đổi tên/search/filter) là **prior-art**, owner muốn nghiên cứu + brainstorm lại tab trước khi thực thi → **đọc `docs/QUANTIFY-BRAINSTORM-HANDOFF.md`**. Code prior-art vẫn ở working tree, harness §11b xanh, chưa commit.
2. **Tổng quan CXM + VoC** — 2 set cố định + set compose từ Quantify.
3. **Bảng xử lý (Work)** — redesign **thanh ngang**, mỗi vấn đề 1 thanh có **status**; full lifecycle flow.
4. **Chỉ số & ngưỡng (Rules)** — dễ hiểu/tiếp cận hơn; phủ **đủ stage từng flow**.
5. **Sources + Topics** — redesign `sources.matrix`; gộp tracking view; áp các cut.
6. **Cảnh báo & giám sát + Trợ lý** — cuối cùng.

## Quyết định cut/keep/redesign từng màn (từ export của owner)
- **Shell:** GIỮ nav.item · **REDESIGN** topbar.filter (remote đã bỏ ô Kỳ, còn 3m/6m/1y) · GIỮ tour.launch.
- **CXM overview:** CẮT hero, setbar.meta, block.lanes, block.outcomes · GIỮ setbar.chips, block.journeystate, block.toppri, block.coverage, savedq, footer.quantifylink · customize/edit → chuyển sang Quantify.
- **Atlas:** GIỮ toàn bộ — chỉ cần **show rõ in-development/placeholder**.
- **VoC overview:** CẮT hero, block.anomlanes, block.topictrend.
- **Sources:** CẮT hero, consequence · **REDESIGN** matrix · + gộp tracking journey view.
- **Topics:** CẮT hero · GIỮ linechart.range (3m/6m/1y).
- **Work:** REDESIGN (thanh ngang + status + full flow).
- **Quantify:** REDESIGN thành table builder/manager.
- **Rules:** REDESIGN dễ hiểu + đủ stage mọi flow.

## Việc còn treo (blocking cho tracking cuối)
- **`template/tracking-plan-cx-mau.xlsx` KHÔNG có trong repo** — cần owner gửi: quy ước tên event, 13 context property, masking rule (sheet 1C). Skeleton hiện là *đề xuất* từ fixture.
- Event convention đã quan sát: snake_case (`account_open_started`, `ekyc_face_liveness_result`...), stationId `JS-MTK-01..06`; chỉ pilot Mở tài khoản có event thật, 31 flow còn lại placeholder.

## Bước tiếp theo khi mở session mới
→ **Sprint 2: Tổng quan CXM + VoC** — 2 tab CỐ ĐỊNH (`b-cxm-exec` + `b-voc-all`), các tab khác compose từ Quantify; áp các cut từ mục "Quyết định cut/keep/redesign" (CXM cắt hero/setbar.meta/block.lanes/block.outcomes; VoC cắt hero/block.anomlanes/block.topictrend); dời ✎ Tùy chỉnh về đúng mô hình 2-tab-cố-định. Verify bằng `output/_harness.js`.

### Đã sửa harness 31/07 (bit-rot tích tụ, KHÔNG phải lỗi Quantify)
Harness KHÔNG chạy được kể từ khi thêm tour spotlight (~29/07) → mọi mốc "Đã verify 28/07" trong AI-CONTEXT có trước tour/`#/topic`/theme nodes và CHƯA từng được harness kiểm. Lần chạy xanh 31/07 là lần pass thật đầu tiên sau 3 ngày. Hai fix hạ tầng đã làm: (1) stub `el()` robust (thêm `classList`/`style`/`remove`/`getBoundingClientRect`) + `requestAnimationFrame` no-op; (2) `ROUTES` loại `topic` khỏi coverage-check + thêm loop `#/topic/<id>` cho mọi theme node.

## Lệnh hữu ích
- Lấy lại tab tracking đã làm: `git checkout backup/deploy-tracking -- output/cxm-platform-prototype.html` (rồi tách 2 edit: tab button trong V.sources + branch `tab==='plan'`).
