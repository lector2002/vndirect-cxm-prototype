# AI Context

> Updated: 2026-07-22
> Level: Small
> Status: active

## Project
VNDIRECT CXM prototype là desktop web app giúp đội CX khám phá, đo lường và quản trị hành trình khách hàng.

## Current State
React/Vite desktop reporting prototype. Platform tập trung vào báo cáo sức khỏe hành trình, phát hiện điểm gãy/thiếu sót, phân tích tác động thay đổi lên hệ thống và kiểm kê dữ liệu đang thu thập.

## Done
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
- Toàn bộ reporting workspace đã sẵn sàng review UX và nghiệp vụ trên desktop, kèm Voice of Customer để hỗ trợ quyết định sản phẩm.

## Next
1. User review logic executive conclusion, exception ranking và impact chain.
2. Kết nối action/issue register với dữ liệu backend thật khi có API.
3. Bổ sung tài liệu nguồn cho các flow đang gắn nhãn `Cần bổ sung nguồn`.

## Key Files
- `app/src/pages/JourneyTree.tsx` - tab Hành trình khách hàng.
- `app/src/pages/Overview.tsx` - executive reporting home.
- `app/src/pages/CoverageGap.tsx` - data coverage exception report.
- `app/src/pages/ImpactAnalysis.tsx` - change impact report.
- `app/src/pages/IssueHub.tsx` - Customer Experience Intelligence và close-the-loop.
- `app/src/pages/VoiceOfCustomer.tsx` - customer intelligence workspace từ theme tới evidence và action.
- `app/src/pages/POBoard.tsx` - action register.
- `app/src/components/AppShell.tsx` - reporting navigation và global filters.
- `app/src/lib/journey-taxonomy.ts` - taxonomy phase dùng toàn app.
- `app/src/data/cxm.ts` - touchpoint, event và KPI hiện có.
- `docs/money-journey-mermaid.html` - nguồn flow money journey.
- `docs/account-journey-mermaid.html` - nguồn flow account journey.

## Last Session
- Done: Tách Voice of Customer cho product decision và Customer Experience cho issue impact, resolution, close-the-loop; liên kết hai workspace qua touchpoint/CX issue.
- Pending: Kết nối thumb/survey tại touchpoint với analytics/backend thật; xử lý 12 lỗi lint có sẵn toàn repo nếu cần lint sạch.
- Blocker: Không có.
