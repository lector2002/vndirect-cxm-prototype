# Thiết kế lại "Topic & Xu hướng" — Voice Insights

Ngày: 2026-07-29 · Trạng thái: chờ duyệt spec

## Mục tiêu
Thiết kế lại phần topic/xu hướng ở trang Voice Insights: trục ngang theo tháng gần đây,
thêm filter 3m/6m/1y cho các chart time-series, và khi bấm vào một topic thì mở **trang
detail riêng** hiển thị chủ đề con + số liệu chi tiết, thay cho việc mở panel tại chỗ.
Đồng thời **bỏ bộ lọc "kỳ" global** trên topbar.

## Quyết định đã chốt với người dùng
- Filter 3m/6m/1y: **cục bộ từng chart** (state riêng mỗi chart).
- Bỏ hẳn bộ lọc timeframe global trên topbar (giữ bộ lọc phase).
- Màn detail: **route riêng** `/voice/:topicId`.
- Trục xu hướng: **2 trục** — line = % positive sentiment, bar mờ nền = khối lượng phản hồi.
- Chủ đề con: **mở rộng demo data** 3–5 subtheme/topic, mỗi subtheme có số liệu riêng.
- Chart **tự vẽ bằng SVG** (không dùng recharts) để giữ phong cách dày/gọn của app và bundle nhẹ.

## Phạm vi chart time-series
Toàn hệ thống hiện chỉ có chart time-series ở trang Voice. Filter 3m/6m/1y và
`TopicTrendChart` được viết dạng **component dùng lại**; chart time-series tương lai kế thừa.

## Component mới
### `TimeRangeFilter` (`components/charts/TimeRangeFilter.tsx`)
- Segmented control `3m | 6m | 1y`, đặt góc phải chart. Props: `value`, `onChange`.
- Chuẩn a11y: `role="group"`, các nút `aria-pressed`.

### `TopicTrendChart` (`components/charts/TopicTrendChart.tsx`)
- SVG dual-axis. Input: mảng `{ month, positive, volume }` + `range` (số tháng: 3/6/12).
- Trục X = nhãn tháng (vd `08/25 … 07/26`), cắt theo range (lấy N tháng cuối).
- Line = positive %; bar mờ = volume (scale riêng). Có điểm mốc + nhãn tháng gần nhất.
- Props: `data`, `months` (mặc định 6), `showVolume` (mặc định true), `height`.

## Thay đổi dữ liệu — `data/voice-of-customer.ts`
Thêm vào `ProductVoice`:
- `monthly: { month: string; positive: number; volume: number }[]` — **12 tháng** 08/2025→07/2026,
  format tháng `MM/YY` (vd `08/25`), đồng bộ với `trend`/`positive` hiện có (tháng cuối = `positive` hiện tại).
- `subthemes: { name: string; volume: number; positive: number; trend: number; quote: string }[]`
  — 3–5 mục/topic, tổng volume xấp xỉ `responses`.
- Giữ nguyên toàn bộ field cũ (card tóm tắt + logic hiện tại không đổi). Chỉ dùng giá trị synthetic.

## Trang Voice (`/voice`) — layout mới
1. Header + câu hỏi AI + dải Summary: **giữ nguyên**.
2. Cột trái (nguồn/taxonomy): **giữ, gọn lại** — bấm taxonomy vẫn lọc list bên dưới.
3. **[HERO] "Topic & Xu hướng"**: `TopicTrendChart` tổng hợp toàn VoC (aggregate theo tháng)
   + `TimeRangeFilter` 3m/6m/1y ở góc phải.
4. **"Themes cần chú ý"** (list topic): mỗi row = tên topic · subtheme chính · mini-trend theo
   tháng · positive% · volume · ▲▼. **Bấm row = điều hướng `/voice/:topicId`** (dùng `Link`).
5. Bỏ cột "detail aside" bên phải (thay bằng trang detail riêng).

## Trang detail mới — `VoiceTopicDetail` (`pages/VoiceTopicDetail.tsx`, route `/voice/:topicId`)
- Nếu `topicId` không tồn tại: hiển thị empty state + link quay lại.
- Header: `← Quay lại Voice Insights`, tên topic, theme, badge quyết định, owner, positive%, responses.
- **Chart lớn** `TopicTrendChart` (dual-axis) + `TimeRangeFilter` (mặc định 6m).
- KPI strip: Positive / Neutral / Negative · Adoption · Business impact · Trend.
- **Chủ đề con**: mỗi subtheme 1 dòng — volume, positive%, ▲▼ trend, mini-trend, top quote.
- Evidence verbatim (quotes hiện có).
- Handoff sang CX + link CX issue nếu `touchpointId === 'tp-bond'` (giữ logic hiện tại).

## Bỏ filter timeframe global
- `AppShell.tsx`: xoá `<select>` timeframe + icon `CalendarDays` + divider + label "Demo snapshot";
  gỡ import `TIME_FRAMES`/`timeFrameById` và biến `timeFrame` **chỉ trong AppShell**. Giữ select phase.
- `CXMContext.tsx`: đổi mặc định `selectedTimeFrameId` `'today'` → `'last-30d'`. Giữ nguyên
  `selectedTimeFrameId`/`setSelectedTimeFrameId` trong context (không đổi shape).
- Overview / ImpactAnalysis / JourneyTree / CoverageGap: **không sửa** — tự chạy với default 30d.

## Routing — `App.tsx`
- Thêm `<Route path="/voice/:topicId" element={<VoiceTopicDetail />} />`.
- HashRouter đang dùng → route lồng hoạt động cả ở bản standalone build.

## Kiểm chứng (success criteria)
- `tsc -b` không lỗi type; `eslint .` sạch (không import thừa).
- Trang Voice: hero chart hiển thị trục tháng, filter 3m/6m/1y đổi được số tháng.
- Bấm topic → sang `/voice/:topicId`, thấy chart lớn + subthemes + số liệu.
- Topbar không còn control timeframe; 4 trang phụ thuộc vẫn render đúng số liệu.
