# AI Context

> Updated: 2026-07-22
> Level: Small
> Status: active

## Project
VNDIRECT CXM prototype là desktop UI/UX prototype giúp đội CX khám phá, đo lường và quản trị hành trình khách hàng. Dự án chỉ mô phỏng giao diện, tính năng và workflow; không triển khai backend, data source hoặc integration thật.

## Current State
React/Vite desktop reporting prototype. Platform tập trung vào báo cáo sức khỏe hành trình, phát hiện điểm gãy/thiếu sót, phân tích tác động thay đổi lên hệ thống và kiểm kê dữ liệu đang thu thập.

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
- Review và chốt UI/feature pilot mở tài khoản; không có backend/API phase trong phạm vi dự án.

## Next
1. User review canonical journey, friction ranking, evidence fields và action lifecycle trong Control Tower.
2. Chốt cách prototype mô phỏng ranh giới giữa CXM, CRM và delivery tools.
3. Mở rộng prototype sang domain tiếp theo sau khi pilot onboarding được duyệt.

## Key Files
- `app/src/pages/JourneyTree.tsx` - tab Hành trình khách hàng.
- `app/src/pages/Overview.tsx` - executive reporting home.
- `app/src/pages/CoverageGap.tsx` - data coverage exception report.
- `app/src/pages/ImpactAnalysis.tsx` - change impact report.
- `app/src/pages/IssueHub.tsx` - Customer Experience Intelligence và close-the-loop.
- `app/src/pages/VoiceOfCustomer.tsx` - customer intelligence workspace từ theme tới evidence và action.
- `app/src/pages/POBoard.tsx` - action register.
- `app/src/components/AppShell.tsx` - reporting navigation và global filters.
- `app/src/pages/CXControlTower.tsx` - Control Tower duy nhất thuộc Customer Experience; mở tài khoản là pilot scope.
- `app/src/data/onboarding-pilot.ts` - mock domain contract và integrity validation của pilot.
- `docs/CXM-PROTOTYPE-SCOPE.md` - phạm vi dự án và prototype approval gate.
- `docs/CXM-DOMAIN-ROADMAP.md` - backlog domain sau pilot.
- `app/src/lib/journey-taxonomy.ts` - taxonomy phase dùng toàn app.
- `app/src/data/cxm.ts` - touchpoint, event và KPI hiện có.
- `docs/money-journey-mermaid.html` - nguồn flow money journey.
- `docs/account-journey-mermaid.html` - nguồn flow account journey.

## Last Session
- Done: Chuẩn hóa nhóm Mở tài khoản: xác thực CCCD, khuôn mặt, chữ ký/Video Call là bước thành phần của flow MTK, không còn flow song song.
- Pending: Review UI/feature pilot onboarding; xử lý 12 lỗi lint có sẵn toàn repo nếu cần lint sạch.
- Blocker: Không có.
