# AI Context

> Updated: 2026-07-27
> Level: Small
> Status: active · đang chờ owner review spec redesign

## Project
VNDIRECT CXM prototype là desktop UI/UX prototype giúp đội CX khám phá, đo lường và quản trị hành trình khách hàng. Dự án chỉ mô phỏng giao diện, tính năng và workflow; không triển khai backend, data source hoặc integration thật.

## Current State
**Bản đang dùng: `output/cxm-platform-prototype.html`** — một file HTML tự chứa, mở bằng browser là chạy, không cần build. Đây là deliverable chính.

React app trong `app/` là bản cũ 8 route, **đã bị thay thế nhưng chưa xóa** — giữ lại để đối chiếu. Owner quyết định có xóa hay không.

Hướng mới: **lấy Enterpret (customer intelligence platform) làm mô hình gốc**, cộng lớp journey/securities của VNDIRECT. Owner đã lật kết luận cũ trong `.swarm/synthesis.md` (*"should not pursue feature parity with Enterpret"*).

- Primitive lõi lấy từ Enterpret: `Feed` · `Quantify` · `Dashboard`, cộng Taxonomy 5 tầng, Category theo intent, Context Graph, 3 Agent read-only, Trợ lý dùng prompt chips.
- 8 bổ sung của VNDIRECT: journey layer · thiết kế/vận hành khảo sát · data coverage · metric contract · approval gate · outcome proof có confounder · masking rule hiện UI · regulatory risk trong ưu tiên.
- IA mới: 13 nav item / 5 nhóm + `/issue/:id`. Thay cho 8 route cũ.
- Theme: cam VNDIRECT trên nền xám ấm, tiết chế. Cam **chỉ** cho tương tác & định danh, không bao giờ làm màu trạng thái.

**Spec đầy đủ: `docs/superpowers/specs/2026-07-27-cxm-voc-redesign-design.md`** — đọc file này trước khi sửa code.

## Done
- [x] Xây một `CX Control Tower` duy nhất thuộc Customer Experience; mở tài khoản là pilot scope đầu tiên.
- [x] Phân định Voice of Customer tạo insight; Customer Experience quản lý issue, action, outcome và close-the-loop.
- [x] Gắn nhãn toàn app là UI prototype/demo data; bỏ tuyên bố realtime không có backend chứng minh.
- [x] Ghi phạm vi prototype và roadmap domain cash/trading/margin/wealth/servicing/churn trong `docs/`.
- [x] Gộp `Xác thực khách hàng` vào các bước eKYC của `Mở tài khoản mới 2026`, tránh hai flow song song bị conflict.
- [x] Loại flow tổng quan/routing trùng với flow chi tiết: `Tổng quan Money Journey` và `Chọn sản phẩm / dịch vụ`.
- [x] Redesign Voice of Customer theo mô hình customer intelligence: hợp nhất nguồn, adaptive taxonomy, context, trend, verbatim evidence và recommended action.
- [x] Tách Customer Experience thành workspace riêng: journey friction, repeat contact, CSAT impact, churn risk, resolution và close-the-loop.
- [x] Xác định project level Small.
- [x] Chốt phạm vi desktop web app; không cần tối ưu mobile.
- [x] Xác định hai nguồn flow thật trong `docs/`: money journey và account journey.
- [x] Redesign journey thành workspace 3 cột: catalog nhóm/flow, flow sequence và step inspector.
- [x] Bổ sung phase Churn vào taxonomy toàn app.
- [x] Map flow từ Account Journey và Money Journey, kèm provenance cho từng flow.
- [x] Build production và lint các file thay đổi thành công.
- [x] Redesign toàn bộ tab còn lại theo reporting hierarchy: kết luận, exception, evidence và drill-down.
- [x] Chuyển Coverage, Impact, Issues và Actions sang master-detail reporting workspace.
- [x] Chuyển Overview thành executive report theo ba trụ cột: điểm gãy, tác động thay đổi và dữ liệu thu thập.
- [x] Chuẩn hóa navigation và global filter cho reporting platform.

## Now
- **Owner review bản bấm được** `output/cxm-platform-prototype.html`, và duyệt/điều chỉnh feature set trước khi chuyển cho team dev.

## Next
1. Cần owner cung cấp **mã cam chính thức** theo brand guideline VNDIRECT. Đang dùng placeholder `#D9531E` ở biến `--primary` trong `<style>` — đổi một dòng là cả app đổi theo.
2. Owner quyết định có xóa React app trong `app/` hay giữ lại để đối chiếu.
3. Nếu cần sửa nội dung: mọi nhãn, số liệu, verbatim nằm trong object `DATA` ở đầu `<script>`, có comment tiếng Việt. Sửa xong refresh browser. `validateFixture()` sẽ báo banner đỏ nếu làm đứt liên kết nào.

## Đã build trong file HTML (14 route + 2 màn chi tiết)
- **Khám phá:** `#/dashboard` `#/feed` `#/quantify` `#/assistant`
- **Hành trình:** `#/atlas` (gộp cả độ phủ dữ liệu) `#/health`
- **Xử lý:** `#/issues` `#/actions` `#/outcomes`
- **Nền dữ liệu:** `#/sources` `#/surveys` `#/taxonomy` `#/agents`
- **Tra cứu:** `#/customers` · `#/customers/<key>` · `#/issue/<id>`
- Guided tour 6 bước (nút "Chạy bản giới thiệu" ở đáy sidebar), filter kỳ + phạm vi trên mọi màn, `validateFixture()` chạy mỗi lần render.

Đã verify: 14 route + 2 màn chi tiết render không lỗi; `validateFixture()` trả rỗng; chạy hết vòng governed action cho 3 action mà toàn vẹn dữ liệu vẫn đúng ở mọi bước trung gian; guided tour 6 bước hoạt động.

## Lỗi đã xác minh trong code hiện tại (spec §7.1, §10)
- **P0 · Issue → Action đứt:** trong 6 issue của Issue Register chỉ `CXI-024 → CXM-142` resolve được. `CXI-019 → CXM-135` và `CXI-026 → CXM-147` không tồn tại. `CXI-021/017/013 → CXA-*` chỉ có trong fixture pilot.
- **P0 · Ba mô hình hành trình song song:** `cxm.ts` (p1..p7) + `journey-taxonomy.ts` (6 phase, nối bằng `customerPhaseForLegacyId()`) + `onboarding-pilot.ts` (step `ob-*`). Bước Liveness tồn tại 3 lần.
- **P1 · Hai palette:** token `--primary` navy vs hex teal hardcode trong `CXControlTower.tsx`. Lớp override `!important` ở `index.css:81-97` sẽ chặn việc đổi màu — phải xóa.
- **P1 · 198 lần** dùng `text-[8px]/[9px]/[10px]` trong `pages/` + `components/`.
- **P1 · 5 giá trị `min-w-`** khác nhau (1040–1100). Filter toàn cục bị ẩn trên trang chủ do `!isPilot` ở `AppShell.tsx:107,148`.

## Key Files
**Tài liệu quyết định**
- `docs/superpowers/specs/2026-07-27-cxm-voc-redesign-design.md` — **spec redesign, nguồn sự thật hiện tại**.
- `output/cxm-redesign-options.html` — bản so sánh có mockup, mở bằng browser.
- `template/tracking-plan-cx-mau.xlsx` — tracking plan thật của team: quy ước event, 13 context property, masking rule (sheet 1C), 6 survey program (sheet 4). Là nguồn cho `stationId`, `SurveyProgram` và masking.
- `output/enterpret-cxm-benchmark.html` — benchmark Enterpret 23/07, gap matrix 12 capability.
- `docs/CXM-PROTOTYPE-SCOPE.md` — **một phần đã bị spec thay thế** (IA, design system, workflow 3 bước, acceptance path). Mục "Ngoài phạm vi dự án" và "Mock data contract" vẫn hiệu lực.
- `docs/CXM-DOMAIN-ROADMAP.md` — backlog domain sau pilot, vẫn hiệu lực.
- `docs/money-journey-mermaid.html` · `docs/account-journey-mermaid.html` — nguồn flow, dùng cho provenance của Atlas.

**Code hiện tại (sẽ bị thay theo spec)**
- `app/src/components/AppShell.tsx` — nav + global filter.
- `app/src/pages/CXControlTower.tsx` — chứa logic tốt nhất của prototype: approval gate, chuỗi trạng thái action, actor trên CTA, và evidence đặt cạnh nút duyệt. **Giữ nguyên logic này khi redesign.**
- `app/src/data/onboarding-pilot.ts` — fixture pilot + `validateOnboardingPilot()`, sẽ mở rộng thành `validateFixture()`.
- `app/src/data/cxm.ts` · `customer-experience.ts` · `voice-of-customer.ts` · `lib/journey-taxonomy.ts` — 4 nguồn sẽ gộp thành một.
- `app/src/pages/` — Overview, JourneyTree, CoverageGap, ImpactAnalysis, IssueHub, VoiceOfCustomer, POBoard.

## Last Session (27/07/2026)
- Done: Audit toàn bộ prototype, xác minh 5 vấn đề bằng code. Brainstorm lại feature set và UI/UX. Chốt Enterpret làm mô hình gốc + 8 bổ sung của VNDIRECT. Chốt IA 13 route / 5 nhóm, theme cam–xám ấm, guided tour 6 màn. Viết spec và bản so sánh HTML.
- Pending: Owner review spec. Chưa có implementation plan. Chưa sửa code.
- Blocker: Thiếu mã cam chính thức từ brand guideline.
- Lưu ý: repo `CXM Platform` **không phải git repository** nên không commit được gì. Cần `git init` nếu muốn version.
