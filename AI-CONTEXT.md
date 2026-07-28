# AI Context

> Updated: 2026-07-28
> Level: Small
> Status: active · đang chờ owner review bản bấm được

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

**Spec đầy đủ: `docs/superpowers/specs/2026-07-28-journey-voc-redesign-design.md`** — đọc file này trước khi sửa code. Kèm phụ lục `docs/journey-provenance-audit.md`. Spec 27/07 đã bị thay thế ở các mục IA, phase model, `#/health`, nhóm Nền dữ liệu.

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
- [x] **Redesign `#/atlas`**: điều hướng ba nhịp ngang (rail 7 phase → chip flow → xương sống bước) thay cho catalog dọc phải kéo xuống mới thấy hết 20 flow.
- [x] **Trực quan hóa tương quan giữa các bước**: dải nối dày mỏng theo số khách còn lại, vạch đỏ tách ra là phần rơi tại bước trước, kèm câu đọc-theo-chiều-ngang tự tính.
- [x] Bỏ khối *"Ảnh hưởng nếu thay đổi bước này"*; step inspector chia 3 tab (Touchpoint & signal · Chỉ số liên kết · Độ phủ dữ liệu).
- [x] **Thêm `#/rules` — màn quản trị Chỉ số & ngưỡng.** Ngưỡng đánh giá không còn hardcode: sửa trong UI là funnel, bản đồ hành trình, bảng nguồn, màn khảo sát và màn agent tô lại ngay.
- [x] Bỏ `#/customers` và `#/customers/<key>` — tra cứu khách lẻ thuộc CRM / Customer 360, không thuộc CXM. Tab *Khách hàng* trong hồ sơ điểm gãy đổi thành *Cohort ảnh hưởng*, chỉ để khép vòng.

## Now
- **Owner review bản đã implement** — spec 28/07 đã build xong vào `output/cxm-platform-prototype.html` và verify cùng ngày (xem mục *Đã verify* bên dưới).
- **Owner chốt mẫu số VoC** — hằng số `VOC_SCOPE` ở mục `===== 2c. QUANTIFY ENGINE =====`. Đang là `'all'`: đếm cả 7 nguồn như Enterpret đếm mọi source → 56.732, trong đó Digital analytics chiếm 72,6%. Đổi thành `'voice'` là chỉ đếm 5 nguồn có lời khách → 2.732. **Sửa một dòng, mọi widget đổi theo.**
- Spec đầy đủ: `docs/superpowers/specs/2026-07-28-journey-voc-redesign-design.md`. Bốn quyết định đã chốt trong phiên brainstorm 28/07:
  1. **Phase 7 → 6** — gộp Margin & Sức mua + Sản phẩm đầu tư vào `04 Giao dịch`; thêm `05 Quản lý tài khoản` cho nhóm servicing (AJ 3–7).
  2. **Nhóm trong phase 04 = sản phẩm** — Cổ phiếu/ETF · CW · Quyền mua · Trái phiếu · CCQ · Phái sinh · Margin · UTTB. Flow 20 → 32, verified 2 → 25.
  3. **Bỏ `#/health`** — funnel trùng `journeySpine()`, friction queue chuyển sang `#/work`.
  4. **Nhóm `Nền dữ liệu` → `Voice of Customer`** 4 surface: Feed · Nguồn & độ toàn vẹn (gộp Khảo sát) · Topic VoC · VoC theo hành trình (mới). `#/dashboard` thành VoC Home 5 câu hỏi theo mô hình Enterpret Home; `#/agents` chuyển sang Quản trị.
- **Owner review bản bấm được** `output/cxm-platform-prototype.html`, và duyệt/điều chỉnh feature set trước khi chuyển cho team dev.
- Owner chốt **giá trị mặc định của ngưỡng** trong `CFG_DEFAULT` (mục `===== 2a. CFG =====`). Hiện đang đặt sao cho khớp đúng các nhận định đã viết trong tài liệu — chưa phải quyết định nghiệp vụ.

## Next
1. Cần owner cung cấp **mã cam chính thức** theo brand guideline VNDIRECT. Đang dùng placeholder `#D9531E` ở biến `--primary` trong `<style>` — đổi một dòng là cả app đổi theo.
2. Owner quyết định có xóa React app trong `app/` hay giữ lại để đối chiếu.
3. Nếu cần sửa nội dung: mọi nhãn, số liệu, verbatim nằm trong object `DATA` ở đầu `<script>`, có comment tiếng Việt. Sửa xong refresh browser. `validateFixture()` sẽ báo banner đỏ nếu làm đứt liên kết nào.
4. **Workflow `.github/workflows/deploy-pages.yml` đang deploy `app/dist` (React app cũ), KHÔNG deploy file HTML prototype.** Nếu muốn publish bản đang dùng thì phải sửa workflow — hiện push lên `main` chỉ build lại bản cũ.

## Đã build trong file HTML — 11 nav item · 12 view · hai phần tách bạch
**Phân định**: VoC **tạo insight** · CXM **quản lý** issue, action, outcome, close-the-loop.
- **CXM · Quản trị trải nghiệm:** `#/cxm` (Tổng quan, có bộ chọn set) `#/atlas` `#/work`
- **Voice of Customer:** `#/voc` (Tổng quan, có bộ chọn set) `#/sources` `#/topics` `#/vocjourney`
- **Công cụ:** `#/quantify` (query builder 44 tổ hợp) `#/assistant`
- **Quản trị:** `#/rules` `#/agents`
- **Route ẩn:** `#/cxm/<set>` · `#/voc/<set>` (chia sẻ set bằng URL) · `#/issue/<id>`
- **Alias giữ link cũ không đứt:** `dashboard`·`board`→`cxm` · `feed`·`surveys`→`sources` · `issues`·`actions`·`outcomes`→`work` · `health`→`work` chế độ ưu tiên · `taxonomy`→`topics`

## Set dashboard — 6 set, mỗi phần 3, customize được
Set là một chuỗi **câu hỏi**, mỗi câu hỏi có một dãy **block**. Block là ID saved Quantify,
hoặc `@<khối>` khi thứ cần vẽ không phải một chart đơn. Tám khối đặc biệt:
`@srcmatrix` `@intent` `@anomlanes` (VoC) · `@toppri` `@journeystate` `@coverage` `@lanes` `@outcomes` (CXM).
`validateFixture()` chặn việc gắn khối của phần này vào set của phần kia.

| VoC | CXM |
|---|---|
| Toàn cảnh tiếng nói *(mặc định)* · Chất lượng nền dữ liệu · Topic đang xấu đi | Điều hành CX *(mặc định)* · Sức khỏe pilot Mở tài khoản · Hiệu quả sau thay đổi |

Bật **✎ Tùy chỉnh** để thêm/bớt block. `ST.boards` chỉ giữ set **đã bị động tới** — set chưa
động vẫn đọc thẳng từ `DATA.dash`, nên "Trả về mặc định" chỉ cần xóa một khóa. Không persist.

## `#/feed` ĐÃ BỎ — vai trò chuyển vào `#/sources`
Duyệt từng feedback một không dẫn tới quyết định nào. Thay bằng **hồ sơ dữ liệu từng nguồn**
(`srcProfile()`): volume · độ tươi vs SLA · nền tảng phủ · chỉ số phụ thuộc, cộng năm chiều phân
bố của feedback trong nguồn đó (intent · sentiment · nền tảng · topic · phase), và **đúng 2** bản
ghi mẫu để biết nguồn đó "nói kiểu gì". Verbatim đầy đủ vẫn nằm trong `#/topics`, tab Verbatim của
`#/vocjourney`, và `#/issue/<id>` — tức là luôn trong ngữ cảnh, không phải một dòng tin thô để cuộn.
- Guided tour 6 bước (nút "Chạy bản giới thiệu" ở đáy sidebar), filter kỳ + phạm vi trên mọi màn, `validateFixture()` chạy mỗi lần render.

## Mô hình Enterpret đã áp dụng (xác minh từ helpcenter.enterpret.com, không suy đoán)
- **Quantify = query 4 phần**: Show me (11 chiều) × Metric (Count/Percentage) × Chart (Bar/Donut) × Time. Mọi ô là **dropdown trên tập hữu hạn** — có builder thật nhưng người dùng thấy ngay giới hạn. Ghi chú *"cố ý không làm query engine tự do"* trong `V.quantify` đã được gỡ có chủ ý.
- **Anatomy widget**: tiêu đề · khoảng thời gian tuyệt đối · *"Đang hiện Top N trên M"* · nhãn trục. Bốn phần, mọi widget.
- **Anomaly**: Z-score, ngưỡng mặc định **1,5** trong `CFG.anomaly.z`, hover hiện Z chính xác và số kỳ trước.
- **4 Category intent** khớp 1–1 với `DATA.cats` → bốn khối *"Khách đang nói gì?"*.
- **Ba làn bất thường** (Enterpret chỉ có một): trong phản hồi · trong hành vi · **của chính nguồn dữ liệu**. Làn thứ ba chặn đọc nhầm "repeat contact giảm 24%→16,2%" thành tin tốt. Làn lấy từ trường `lane` khai báo tường minh trên finding — **không** đoán từ tiêu đề (bản đầu dùng regex và gán nhầm ngay AF-03).
- **Top 10 thay 2 cột**: Sum(LTV) → *số khách giá trị cao* (fixture không có LTV); Impact on NPS → *tác động CES* (`sv-nps` đang paused). Thêm cột thứ tư *rủi ro tuân thủ* — không có trong mô hình gốc.

## Aggregate và evidence là HAI tập fixture khác nhau
Widget đọc số tổng hợp (`tax[].n` · `sources[].vol`) — Feed đọc mẫu verbatim (`DATA.ev`, 22 bản ghi).
Mọi chỗ chuyển từ chart sang Feed đều nói rõ *"đang hiện N mẫu"*, không giả vờ N = X.
Hệ số nhân bịa `DATA.ev.length * 41` ở `V.feed` đã bị gỡ.

## Trạng thái được SUY RA, không hardcode (28/07/2026)
Ba hàm là chỗ duy nhất quyết định "Đang kiểm soát / Cần theo dõi / Cần xử lý ngay":
- `stepState(o)` — theo `failed ÷ entered`, cộng điều kiện coverage và effort. Ngưỡng ở `CFG.step`.
- `metricState(m)` — **band riêng từng metric** ở `CFG.metric[id]`. Cố ý không dùng một ngưỡng chung: `m-liveness` (83,3% / mục tiêu 90%) là `crit` còn `m-ocr` (71% / mục tiêu 90%) chỉ là `watch` — metric chạm khách và metric chất lượng dữ liệu không đọc cùng một cách. Một ngưỡng chung sẽ đảo ngược đúng hai metric này.
- `sourceHealth(s)` — so `lagH` với **SLA riêng từng nguồn** ở `CFG.source[id]`. Crawl store 1 lần/ngày không thể chấm cùng SLA với event stream.

Trọng số xếp ưu tiên điểm gãy để **chỉ đọc** (mục 6 của `#/rules`): fixture lưu điểm tuyệt đối và `validateFixture()` khẳng định `sev+aff+jc+rep+tr+reg === total`, nên cho sửa trọng số mà không tính lại `total` sẽ bắn banner đỏ mọi màn.

## Đã verify 28/07/2026 sau khi implement spec (Node harness + Chrome DevTools)
- **13 view render OK**, không console error/warning, không banner đỏ trên mọi route kể cả hash không tồn tại.
- `validateFixture()` **trả rỗng**, kể cả sau khi tạo issue mới, gán người và chạy hết chuỗi advance.
- Cấu trúc: **6 phase · 20 nhóm · 32 flow · 25 verified · 1 observed · 11 nav item · 15 saved Quantify · 14 theme**.
- Trạng thái suy ra vẫn khớp fixture: bước `ok watch crit ok watch ok`; đổi ngưỡng xử lý 15%→10% làm bước 02 chuyển `crit`.
- **60 thanh chart trên Tổng quan đều bấm được**, dẫn tới `vocjourney` (22) · `feed` (14) · `issue` (4).
- 13 tab trên 7 màn bấm không lỗi; thẻ `<div>` cân bằng ở cả hai chế độ của `#/work`.
- **Guided tour chạy hết 6 bước**, không bước nào rơi vào route rỗng.
- Ngưỡng Z-score có tác dụng thật: z=1,5 → 7 điểm bất thường · z=30 → 0.
- **7 phép kiểm provenance mới đều bắt được lỗi khi cố tình phá**: sơ đồ vượt số thật (MJ>7, AJ>13) · `verified` lệch `src` · flow trỏ nhóm không tồn tại · `maps` trỏ điểm chạm không tồn tại · tổng node con vượt node cha · tour trỏ route đã xóa.
- Quantify builder: **44 tổ hợp** (11 chiều × 2 metric × 2 chart) render không lỗi.
- Nút *Tạo điểm gãy* hoạt động ở **cả hai** chế độ của `#/work`, kể cả khi vào qua alias `#/health`.
- Ô **ngưỡng Z-score** có thật ở `#/rules` › *Cảnh báo & khảo sát*, sửa qua UI có tác dụng ngay: 3,0 → 6 điểm khoanh · 1,5 (mặc định) → 7 · "Trả về mặc định" khôi phục đúng.

## Lỗi đã xác minh trong code hiện tại (spec §7.1, §10)
- **P0 · Issue → Action đứt:** trong 6 issue của Issue Register chỉ `CXI-024 → CXM-142` resolve được. `CXI-019 → CXM-135` và `CXI-026 → CXM-147` không tồn tại. `CXI-021/017/013 → CXA-*` chỉ có trong fixture pilot.
- **P0 · Ba mô hình hành trình song song:** `cxm.ts` (p1..p7) + `journey-taxonomy.ts` (6 phase, nối bằng `customerPhaseForLegacyId()`) + `onboarding-pilot.ts` (step `ob-*`). Bước Liveness tồn tại 3 lần.
- **P1 · Hai palette:** token `--primary` navy vs hex teal hardcode trong `CXControlTower.tsx`. Lớp override `!important` ở `index.css:81-97` sẽ chặn việc đổi màu — phải xóa.
- **P1 · 198 lần** dùng `text-[8px]/[9px]/[10px]` trong `pages/` + `components/`.
- **P1 · 5 giá trị `min-w-`** khác nhau (1040–1100). Filter toàn cục bị ẩn trên trang chủ do `!isPilot` ở `AppShell.tsx:107,148`.

## Key Files
**Tài liệu quyết định**
- `docs/superpowers/specs/2026-07-28-journey-voc-redesign-design.md` — **spec redesign, nguồn sự thật hiện tại**.
- `docs/journey-provenance-audit.md` — **đối chiếu từng dòng `DATA.flows.src` với 20 sơ đồ nguồn thật.** Phụ lục bắt buộc của spec trên.
- `docs/superpowers/specs/2026-07-27-cxm-voc-redesign-design.md` — spec cũ, **đã bị thay thế** ở IA / phase model / `#/health` / nhóm Nền dữ liệu. Giữ để đối chiếu.
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

## Last Session (28/07/2026)
- Done: Tra cứu Enterpret sâu hơn (Dashboards & Reporting, Customer Context Graph, AI Insights) — lấy hai pattern: **Knowledge Manager** (một surface sở hữu định nghĩa và ngưỡng) và **alert/subscription** (tần suất + kênh gửi). Redesign `#/atlas` theo điều hướng ngang + dải nối thể hiện tương quan bước. Bỏ khối blast radius. Thêm `#/rules` và nối nó vào 6 màn khác. Bỏ `#/customers`.
- Pending: Owner review bản bấm được và chốt giá trị mặc định của ngưỡng.
- Blocker: Thiếu mã cam chính thức từ brand guideline.
- Lưu ý: repo này **có** git (`origin` = `github.com/lector2002/vndirect-cxm-prototype`, branch `main`) — ghi chú "không phải git repository" ở bản trước đã sai và đã bỏ.

## Quyết định cố ý giữ, đừng "sửa" lại
- **Không** dùng một ngưỡng chung cho mọi metric (xem mục *Trạng thái được SUY RA* ở trên).
- ~~**Không** gộp funnel của `#/health` vào `#/atlas`~~ — **owner đã lật ngày 28/07/2026.** `#/health` bị bỏ hẳn: nửa funnel trùng hoàn toàn `journeySpine()` nên xóa, nửa friction queue chuyển sang `#/work` thành chế độ xem *xếp theo ưu tiên*. Lý do phản đối gốc (atlas là cấu trúc, health là hàng đợi pilot) được xử lý bằng cách đưa queue sang `#/work` chứ không nhét vào atlas. Xem spec 28/07 §A6.
- **Không** dựng lại timeline từng khách. Fixture `DATA.cust` cố ý chỉ còn `key · seg · tier · pf · st` — vừa đủ để khép vòng, không thành hệ thống tra cứu thứ hai.
- Cấu hình ngưỡng **không persist** (không có backend). Refresh là về mặc định — đây là chủ ý và có ghi rõ trên UI.
