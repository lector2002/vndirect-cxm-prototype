# AI Context

> Updated: 2026-07-22
> Level: Small
> Status: done

## Project
VNDIRECT CXM prototype là desktop web app giúp đội CX khám phá, đo lường và quản trị hành trình khách hàng.

## Current State
React/Vite prototype đang được redesign tab Hành trình khách hàng. Journey thực tế có 6 phase gồm Reach, Lead, Onboarding, Be In, Engage & Advocacy và Churn; mỗi phase có nhiều nhóm và mỗi nhóm có nhiều flow.

## Done
- [x] Xác định project level Small.
- [x] Chốt phạm vi desktop web app; không cần tối ưu mobile.
- [x] Xác định hai nguồn flow thật trong `docs/`: money journey và account journey.
- [x] Redesign journey thành workspace 3 cột: catalog nhóm/flow, flow sequence và step inspector.
- [x] Bổ sung phase Churn vào taxonomy toàn app.
- [x] Map flow từ Account Journey và Money Journey, kèm provenance cho từng flow.
- [x] Build production và lint các file thay đổi thành công.

## Now
- Tab Hành trình khách hàng đã sẵn sàng review UX trên desktop.

## Next
1. User review tên nhóm, cách map flow vào phase và độ chi tiết từng bước.
2. Bổ sung tài liệu nguồn cho các flow đang gắn nhãn `Cần bổ sung nguồn`.

## Key Files
- `app/src/pages/JourneyTree.tsx` - tab Hành trình khách hàng.
- `app/src/lib/journey-taxonomy.ts` - taxonomy phase dùng toàn app.
- `app/src/data/cxm.ts` - touchpoint, event và KPI hiện có.
- `docs/money-journey-mermaid.html` - nguồn flow money journey.
- `docs/account-journey-mermaid.html` - nguồn flow account journey.

## Last Session
- Done: Redesign desktop journey explorer, thêm 6 phase, search, provenance và inspector; build pass.
- Pending: Review nghiệp vụ với user.
- Blocker: Không có.
