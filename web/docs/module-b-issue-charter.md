# Module B Charter — màn Điểm gãy (`#/issue/:id`), 5 tab

> 🛑 **MODULE DỪNG Ở B1 — ĐỪNG CHẠY TIẾP B2–B6 KHI CHƯA BRAINSTORM.** Owner đổi hướng dự án
> 07/08/2026 sang **MVP minimal về quản trị flow data & coverage**. Owner có chốt "làm trọn màn này
> rồi mới dừng", nhưng **đổi ý ngay sau đó** bằng câu *"đã xong rồi thì viết handoff để session sau
> tập trung vào mvp minimal…"* — câu sau thắng.
>
> Hệ quả: **ba đường dẫn vào `#/issue/:id` vẫn ra trang trắng, và đó là trạng thái ĐƯỢC CHẤP NHẬN**,
> không phải việc bỏ quên. Đừng "tiện tay dựng nốt".
>
> B0 và B1 **không phí**: nhãn dải nay nói đúng khoảng trên toàn app, và bảng `hist` là dữ liệu nền
> dùng lại được dù MVP chọn hướng nào. Đọc
> [HANDOFF-MVP-FLOW-COVERAGE.md](./HANDOFF-MVP-FLOW-COVERAGE.md) trước.

Status: **DỪNG Ở B1** (B0 xong ✅ · B1 xong ✅ · B2–B6 **không chạy**, chờ phạm vi MVP).
Date: 07/08/2026.
Baseline trước module: `tsc -b` exit 0 · **1094 test / 99 file** · `vite build` xanh · working tree
bẩn ở 13 file sửa + `features/rules/` + 4 file `domain/` mới + 3 ảnh png (di sản Module G, chưa commit).

## Vì sao có module này

Ba đường dẫn trong app đang trỏ tới `#/issue/:id`, và cả ba mở ra `Placeholder`:

| Đường vào | Ở đâu |
|---|---|
| kết quả tìm kiếm | `domain/search.ts:47` (`route: \`issue/${issue.id}\``) |
| khối "Ưu tiên xử lý" | `features/overview/blocks/TopPriorityBlock.tsx:77` (`onGo(\`issue/${r.id}\`)`) |
| trình xem điểm chạm VoC | `features/vocjourney/VocTouchpointInspector.tsx:277` (`<a href={\`#/issue/${i.hoIssue}\`}>`) |

Đây là **màn trống thứ tư** — nó không có mục nào ở sidebar nên mọi lần kiểm kê bằng nav đều bỏ sót.

Nguồn đặc tả: `V.issue` trong `output/cxm-platform-prototype.html` **dòng 3224-3345** (chỉ đọc).

## Owner chốt 07/08/2026 — tám quyết định

| # | Chốt |
|---|---|
| 1 | **Dựng màn Điểm gãy trước**, rồi mới tới Agent & cảnh báo và Trợ lý |
| 2 | Đầu màn: `h1` **"Điểm gãy"** + tiêu đề issue thành dòng riêng ngay dưới + nút **"← Quay lại"** dùng lịch sử trình duyệt |
| 3 | Tab Kết quả: mốc "trước" là **`Snapshot`** của Module A, **kèm chuỗi lịch sử**: 6 kỳ trước → mốc đóng băng → vạch phát hành → các kỳ sau tới số "sau" |
| 4 | Chuỗi lịch sử **sinh tất định trong `demo.ts`**, nhãn demo do **cờ trên dữ liệu** điều khiển (tự tắt khi nguồn thật vào); ghi một dòng **D-4** vào danh sách YÊU CẦU DỮ LIỆU |
| 5 | Tab Cohort: **5 cột prototype + 4 dải phân khúc** (tuổi/NAV/thâm niên/kênh mở TK) |
| 6 | Tab Xử lý: **bố cục riêng cho màn chi tiết** (KHÔNG tái dùng `IssueBar`) — nhưng cùng state qua store |
| 7 | Được **tự bổ sung thêm data** khi chart cần |
| 8 | Ngoài module: nợ nhãn dải **sửa cả cụm một lượt** (section B0) · `cfg.segment.values` **giữ chỉ đọc** (nay là quyết định owner, không còn là suy luận) · phase 04 **giữ khoá** |

## Đo được từ fixture — MỌI nhánh rỗng đều tới được, không phải bịa gì

Đo bằng oracle độc lập 07/08 trên `seed` (6 issue, mọi tham chiếu `ev`/`cust` đều phân giải được):

| Issue | sev · conf | ev | cohort | insight | outcome | loop | snapshot |
|---|---|---|---|---|---|---|---|
| CXI-021 | critical · 91 | 5 | 4 | VI-01 | không | need 63 · done 0 · **by null** | có |
| CXI-017 | high · 84 | 3 | 2 | VI-02 | **có** (`inconclusive`, 2 confounder) | need 29 · done 0 · by null | có |
| CXI-013 | medium · 72 | 3 | 1 | VI-03 | **có** (`improved`) | **25/25, có người duyệt** | có |
| CXI-024 | high · 58 | 1 | **0** | **null** | không | **không có** | **không** (`cf:'pending'`) |
| CXI-026 | medium · 64 | 1 | 1 | VI-01 | không | không có | có |
| CXI-028 | high · 99 | **0** | **0** | **null** | không | không có | có |

**Kỷ luật D-1 giữ nguyên: KHÔNG sinh thêm verbatim để lấp panel rỗng.** Panel nói thẳng tập mẫu có
bao nhiêu bản ghi là fixture đang nói thật về chính nó, không phải defect.

`CXI-024` không có snapshot là **đúng luật**, không phải thiếu dữ liệu: snapshot đóng băng lúc Xác
nhận, mà `CXA-024` còn `cf:'pending'`.

## Sáu quyết định thiết kế phải đọc trước khi code

### 1. `PageTitle` KHÔNG dùng được ở màn này — gọi vào là app crash

`nav.tsx:56` **ném Error** cho route lạ, và `issue` không có trong `NAV_GROUPS`. Tiền lệ đã có:
`features/topic/ThemeDetailPage.tsx` (route `/topic/:id` cũng không có mục sidebar) in thẳng
`<h1 className="t-hero mb-4">Topic</h1>`. Màn này làm y hệt với chữ **"Điểm gãy"**.

Luật 06/08 *"đầu màn chỉ còn tên tab"* **không áp được** cho màn không có tab — owner đã chốt cách
xử lý ở quyết định #2, đừng tự diễn giải lại.

### 2. Trục thời gian: `Snapshot.m.p` là CỬA SỔ ĐO TỰ DO, không phải ô trên một lưới kỳ

Đo được (07/08): `m.p` của 5 snapshot lần lượt là `28/01/2026 – 27/07/2026` (6 tháng) ·
`28/06 – 15/07/2026` (~2,5 tuần) · `09/07 – 15/07/2026` (1 tuần) · và hai cái 6 tháng nữa. Bảng
`periods` chỉ có **3 preset timeframe** (3 tháng / 6 tháng / 1 năm), **không phải** lưới kỳ đều nhau.

Hệ quả bắt buộc:
- **Không được** suy 6 kỳ trước bằng cách nhân cửa sổ của snapshot ra sau — CXI-021 sẽ ra 3 năm lịch sử.
- 6 điểm trước là **điểm MINH HOẠ theo tháng**, còn mốc đóng băng và số "sau" đo trên **cửa sổ riêng
  ghi ở nhãn**. Chart **phải nói ra** điều đó bằng chữ; trộn hai grain trên một đường mà im lặng là
  đúng loại lỗi "hình nói sai" đã chặn ba lần ở các module trước.
- Đây chính là nội dung dòng **D-4** phải ghi vào danh sách YÊU CẦU DỮ LIỆU: *chuỗi chỉ số theo kỳ
  ĐỀU NHAU, cùng grain với cửa sổ đo của mốc đóng băng.*

### 3. Chỗ bịa dồn hết về `demo.ts` — `domain/` chỉ NỐI, không sinh

Bảng ba tầng của Module D áp nguyên vào đây:

| Tầng | Quy tắc |
|---|---|
| `data/fixtures/demo.ts` | sinh **6 điểm trước** một cách tất định (mulberry32, hạt cố định), gắn `demo:true` |
| `data/fixtures/seed.ts` | **KHÔNG có dòng `hist` nào** — fixture thật không mang số minh hoạ |
| `domain/` | **nối** 6 điểm demo + điểm đóng băng (**số thật** từ `snap.m.v`) + điểm sau (**số thật** từ `out.post.v`). **0 hằng số tỷ lệ bịa** |
| UI | nhãn "minh hoạ" đọc **cờ `demo` trên dữ liệu**, không hardcode trong component ⇒ tự tắt khi nguồn thật vào |

Tiền lệ đã có trong nhà cho việc seed rỗng là trạng thái trung thực: `sigCounts` (Demo Mode TẮT ⇒
rỗng ⇒ chart tự nói "chưa có dữ liệu", không vẽ 0 giả vờ).

⚠️ Singleton store chạy `demoData`, nên **trên trình duyệt chart vẫn hiện**; test dùng `seed` sẽ
thấy nhánh "chưa có chuỗi lịch sử". Cả hai nhánh đều phải có test.

### 4. Vạch phát hành đã có sẵn trong dữ liệu — KHÔNG thêm field mới cho nó

`Action.rel` là chuỗi tự do và đã mang đúng thông tin: `CXA-013` = `"Mobile 8.12.0 · 16/07/2026"`,
`CXA-017` = `"Mobile 8.12.0 · 16/07/2026 (một phần)"`, 4 action còn lại **không có** `rel`. Domain
đặt vạch **ngay sau điểm đóng băng** khi `rel` tồn tại, và không vẽ vạch nào khi `rel` rỗng.

### 5. `LineChart` hiện có KHÔNG dùng lại được — dựng component mới

`design-system/LineChart.tsx` là **port 1-1 hình học SVG** của prototype: không nhãn trục x, không
vạch dọc, không đường mục tiêu, `series` gõ kiểu `QuantifySeriesPoint[]`. Nới nó ra là sửa cái đang
đỡ `trend`/`cohort` của Quantify. Dựng **`design-system/VerifyChart.tsx`** riêng.

### 6. `getPrimaryAction` phải truyền ĐỦ BA tham số, và theo đúng quy ước `WorkPage`

`WorkPage.tsx:285` gọi `getPrimaryAction(action, outcome, action.lc === "closed")`. Màn này **gọi y
hệt**. Thiếu tham số thứ ba thì `CXI-013` (`lc:'closed'`, loop 25/25) hiện CTA *"Đánh dấu đã khép
vòng"* cho một việc đã khép xong. Hai màn cùng một câu hỏi phải cho cùng một câu trả lời.

## Sections

Blocking edges nghiêm ngặt, **một writer một lúc** (B0 và B1 đều chạm `seed.ts`).

### B0 — Nhãn dải nói đúng khoảng — **XONG 07/08, đã chứng thực độc lập**

Kết quả: `tsc -b` exit 0 · **99 file / 1097 test** (baseline 1094 + đúng 3 test mới) · `vite build`
xanh. Oracle độc lập (không đọc test của worker) xác nhận:

```
nav       => [<50tr | 50-200tr | 200tr-1tỷ | 1-5tỷ | 5tỷ+]
bandOf(5.000.000.000) = "5tỷ+"      ← biên dưới ĐÓNG, nhãn nay nói đúng
cut sát 0 => [0đ | 1đ-50tr | 50-200tr | 200tr-1tỷ | 1-5tỷ | 5tỷ+]
min=0     => [<50tr | ...]          ← không có dải dưới thì vẫn gộp, ĐÚNG
24 nhãn sinh ra · số nhãn còn chứa ">": 0
```

Ba điều ghi lại cho phiên sau:
1. **Lỗi rộng hơn hai nhãn owner nêu.** `>5 năm` của trục thâm niên sai y hệt (cùng một nhánh code),
   nên `TenureBand` cũng đổi thành `'5 năm+'`. `AgeBand` (`'50+'`) vốn đã đúng, không đụng.
2. **`seed.ts:743` có `tenure:'>5 năm'` gõ tay — CHỮ CHẾT, không phải lỗi hiển thị.** `tsc` không bắt
   được vì `Customer.bands` khai `Record<string, string | SegUnknown>` chứ không phải union đóng.
   Nhưng `seed` xuất ra đã chiếu lại bands qua `projectCustomerBands`, và trục `tenure` đã rút khỏi
   `cfg.segment.band` từ 04/08 ⇒ **7 khách chỉ còn `age` và `nav`, 0 nhãn chứa `>`**. Đo rồi mới kết
   luận, đừng sửa nó vì thấy chướng mắt.
3. **Nợ mỹ thuật nhỏ, cố ý chưa xử:** biên dưới dưới tầng triệu in bằng đồng thô không có dấu ngăn
   nghìn (cut 400.000 ⇒ `400000đ-50tr`). `data/` không được import `nf()` của `design-system/` (sai
   thứ tự tầng). Ca dùng thật của owner là cut `1` ⇒ `1đ`, đọc bình thường.

### ~~B0 — đặc tả gốc~~ (giữ lại để đối chiếu)

Chạy **TRƯỚC** để test của màn mới ghim luôn nhãn đúng.

| Việc | Chi tiết |
|---|---|
| `'>5tỷ'` → `'5tỷ+'` | Là **thành viên của union `NavBand`** (`data/schema/cxm.ts`), nên `tsc -b` sẽ liệt kê đủ mọi chỗ chạm — dùng chính nó làm bản kiểm kê. Chạm cả `seed.ts` và các pin trong test |
| ca `<50tr` đứng ngay trên `0đ` | Là **luật trong `bandLabels()`** (`data/bands.ts`), chỉ phát sinh khi có cut sát 0. Dải thứ hai phải nói đúng biên dưới của nó, không được đọc như thể bao cả 0 |

Nghiệm thu: `tsc -b` 0 · toàn bộ suite xanh · test đơn vị mới cho `bandLabels()` ở ca có cut sát 0 ·
**không** nhãn nào còn gõ tay ngoài `bandLabels()` (bất biến E-c).

### B1 — Schema `hist` + validate + sinh demo — **XONG 07/08, đã chứng thực độc lập**

`tsc -b` exit 0 · **99 file / 1113 test** (baseline 1097) · `vite build` xanh. Oracle độc lập xác
nhận: `seed.hist` rỗng · `demoData.hist` 5 dòng · `CXI-024` không có dòng nào (chưa xác nhận ⇒ chưa
có mốc đóng băng) · nhãn kỳ không trùng · `u` khớp `snap.m.u` từng dòng · **300 khách và
`tự tìm = 62`** — đúng con số gốc mà `demo.ts` cảnh báo sẽ thành 70 nếu rút nhầm luồng số, tức
stream PRNG đã tách đúng.

**Luật validate là nhóm 23, KHÔNG phải 21.** Contract của Opus ghi 21 vì chỉ đọc docblock ("19 nhóm")
mà không đếm — file thực tế đã có tới nhóm 22. Worker đếm lại và sửa cả docblock. Bài học: **docblock
đếm số nhóm ở đầu `validate.ts` đã từng trôi khỏi thực tế**, đếm bằng `grep -nE "^\s*/\* ?[0-9]+\."`
trước khi cấp số mới.

**DEFECT NGỮ NGHĨA đã bắt và sửa — cùng khuôn "Bài học đắt nhất".** Bản đầu **rút ngẫu nhiên** chiều
của chuỗi (`rng() < 0.5 ? 1 : -1`), đo được **1/5 dòng kể ngược câu chuyện**: `CXI-013` (`m-ocr`,
target `≥ 90%`, hướng LÊN) ra `63 → 71,1` tiến tới mốc đóng băng `71,0` — biểu đồ nói chỉ số đang
**tốt dần** rồi bỗng bị ghi nhận là điểm gãy, mâu thuẫn với chính lý do điểm gãy tồn tại. Và **test
pin khoá đúng sáu con số sai đó lại** làm hành vi mong muốn.

Đã sửa: chiều suy từ `metricDirection()` — hướng LÊN ⇒ chuỗi giảm về mốc; hướng XUỐNG (`m-repeat`)
⇒ chuỗi tăng về mốc. Thêm test canh **LUẬT** (không canh giá trị) nên đổi `HIST_SEED` hay đổi công
thức vẫn bắt được. Mẹo giữ ổn định: **rút rồi bỏ** một số ở đúng vị trí cũ trong stream ⇒ bốn chuỗi
vốn đã đúng chiều **không đổi một giá trị nào**, mọi số đã đối chiếu trước đó còn nguyên làm chứng.

Ba điều thiết kế cần biết trước khi dùng `hist`:
1. **`CXI-021` và `CXI-026` ra chuỗi GIỐNG HỆT nhau — đúng chủ ý.** Hạt giống khoá theo *nội dung
   đo* (`m.v`/`m.u`/`m.p`/`obs`), không theo vị trí lặp. Hai issue này cùng `m-liveness`, cùng cửa sổ,
   cùng mốc `83,3%` ⇒ **đó LÀ cùng một phép đo**, minh hoạ hai chiều khác nhau mới là nói sai.
2. Nhãn kỳ dạng `MM/yyyy` — cố ý khác dạng `dd/MM/yyyy – dd/MM/yyyy` của cửa sổ đo, để không lẫn.
3. `generateMetricHistory(snaps, issues, metrics)` — ba tham số, vì phải tra `metricDirection`.

### ~~B1 — đặc tả gốc~~ (giữ lại để đối chiếu)

```ts
// data/schema/cxm.ts
export type HistPoint = { p: string; v: number };
export type MetricHistory = {
  iss: string;        // khoá issue
  u: string;          // đơn vị
  pre: HistPoint[];   // các kỳ TRƯỚC mốc đóng băng, theo thứ tự thời gian
  demo: boolean;      // cờ minh hoạ — UI đọc cờ này, không hardcode
};
// CxmData thêm: hist: MetricHistory[];
```

Luật `validate.ts` **bắt buộc** (thiếu là lỗi im lặng, không phải lỗi hiển thị):
1. **Referential integrity**: `hist[].iss` phải tồn tại trong `data.iss` — bài học D-2, join sai
   trả 0 dòng im lặng trông y như "chưa có data".
2. Mỗi issue **tối đa MỘT** dòng `hist`.
3. `pre` không rỗng; nhãn kỳ `pre[].p` **không trùng nhau** trong cùng một dòng.
4. `u` phải **khớp** `snap.m.u` của cùng issue khi issue đó có snapshot — hai đơn vị khác nhau trên
   một đường là hình nói sai.
5. Dòng `hist` của một issue **không có snapshot** ⇒ lỗi: không có mốc đóng băng thì chuỗi không có
   điểm neo, vẽ ra là một đường lửng không biết dừng ở đâu.

`seed.ts`: `hist: []`. `demo.ts`: sinh **6 điểm** cho **5 issue có snapshot**, tất định, `demo:true`,
nhãn kỳ theo tháng lùi dần từ tháng của `snap.at`.

Nghiệm thu: `validateFixture(seed)` và `validateFixture(demoData)` đều **rỗng** · test cho **cả 5
luật** (mỗi luật một fixture cast vi phạm đúng nó) · sinh lại `demoData` qua hai tiến trình cho
**cùng một chuỗi số** · `demoData.hist.length === 5`.

### B2 — `domain/verifyTimeline.ts` (thuần)

```ts
export type VerifyPointKind = 'pre' | 'frozen' | 'post';
export type VerifyPoint = { p: string; v: number; kind: VerifyPointKind; demo: boolean };
export type VerifyTimeline = {
  points: VerifyPoint[];
  releaseAfter: number | null;   // vẽ vạch NGAY SAU điểm thứ i; null = chưa phát hành
  releaseLabel: string | null;   // nguyên văn Action.rel
  frozenAt: number | null;       // chỉ số của điểm đóng băng
  unit: string;
  target: string;                // Metric.target, để vẽ đường mục tiêu
  direction: 'up' | 'down';      // metricDirection() — cao hơn là tốt hay xấu
  demo: boolean;                 // có ít nhất một điểm demo
  note: string | null;           // câu nói ra chỗ trộn grain (quyết định #2)
};
export function verifyTimeline(issueId: string, data: CxmData): VerifyTimeline | null;
```

Trả `null` khi issue không có snapshot **và** không có `hist` ⇒ UI in "chưa có mốc so sánh".

Nghiệm thu: **0 hằng số tỷ lệ** trong file · CXI-013 ⇒ 6 pre + frozen + post, `releaseAfter` trỏ
đúng điểm frozen, `direction:'up'` · CXI-028 (`m-repeat`, `target:'≤ 15%'`) ⇒ `direction:'down'` ·
CXI-024 ⇒ `null` · chạy trên `seed` (không `hist`) ⇒ chỉ frozen (+post nếu có), `demo:false` ·
điểm `frozen` phải **bằng đúng** `snap.m.v` và điểm `post` bằng đúng `out.post.v` — oracle số học
chặn chuyện chart tự vẽ một con số khác với số đã đóng băng.

### B3 — `design-system/VerifyChart.tsx`

Thuần presentational, nhận `VerifyTimeline`. Vẽ: đường · **vạch dọc mốc đóng băng** · **vạch dọc
phát hành** (khi có) · **đường ngang mục tiêu** · nhãn kỳ trục x · điểm `demo` phân biệt bằng kênh
**không-phải-màu** (nét đứt), giống lối `IssueBar` dùng dấu ✓.

Nghiệm thu: `demo:true` ⇒ có nhãn "minh hoạ" · `demo:false` ⇒ **không** có · `releaseAfter:null` ⇒
không render vạch phát hành · không thêm class Tailwind nào chưa có trong `tailwind.config.js`.

### B4 — Vỏ màn + tab Bằng chứng + tab Ảnh hưởng

Vỏ: `h1 "Điểm gãy"` · dòng tiêu đề issue · hàng nhận dạng (mã · badge sev · chip bước · độ tin cậy) ·
`i.plain` · nút "← Quay lại" (lịch sử trình duyệt) · dải 5 tab, state tab là state cục bộ của màn
(store cố ý không giữ UI-selection).

- **Bằng chứng**: giả thuyết `i.hyp` · danh sách verbatim · khối gập "định nghĩa đo lường"
  (metric contract, ngưỡng đang áp đọc từ `cfg.metric`). Nhánh 0 bằng chứng: câu của prototype dòng 3261.
- **Ảnh hưởng**: 5 stat · breakdown 6 thành phần điểm ưu tiên · Voice Insight nguồn (hoặc câu
  "không đến từ VoC" khi `ins === null`).

⚠️ **Hai bẫy đã đo:**
- Lưới **5 stat** là đúng hình dạng đã vỡ ở Module G (tên chỉ số xuống dòng từng chữ, một dòng cao
  gần 200px). Soi bằng mắt ở bề rộng thật, không chỉ jsdom.
- **CXI-028 có `imp.aff = 0` cạnh `conf = 99`, `sev = high`.** Không được để "0 khách bị ảnh hưởng"
  đứng cạnh "Độ tin cậy 99%" mà không có câu giải thích. Câu đó phải **suy từ dữ liệu**
  (`ev.length === 0 && cust.length === 0 && imp.aff === 0` ⇒ lỗi hệ thống thu thập, không gắn với
  khách cụ thể nào), **không** hardcode theo id.

`fx()` áp đúng những chỗ prototype áp: `fx(i.imp.aff)`, `fx(i.imp.churn)`. `i.imp.hv` **không** qua `fx`.

### B5 — tab Cohort + tab Xử lý + tab Kết quả

- **Cohort**: câu rào "đây là cohort để khép vòng, không phải màn tra cứu khách hàng" +
  "toàn bộ định danh đã pseudonymize" — **KHÔNG được bỏ**, đây là câu làm cho việc hiện 4 dòng thật
  cạnh "trên tổng {fx(imp.aff)} khách" là trung thực (cùng họ với `denomStrip` "tỷ trọng minh hoạ").
  3 stat + bảng **9 cột**: khoá · segment · nhóm giá trị · platform · trạng thái + **tuổi · NAV ·
  thâm niên · kênh mở TK**. Nhãn dải **chỉ** từ `bandLabels()`; `'chưa-biết'` và `'thiếu'` phải hiện
  **khác nhau** (bất biến 2). Hai nhánh rỗng của prototype (dòng 3327) giữ nguyên phân biệt.
- **Xử lý**: bố cục riêng (owner chốt #6) — đề xuất xử lý `i.dec` · người phụ trách/duyệt/hạn ·
  dải 4 chặng · CTA chính + actor + lý do chặn. Ghi ở store nên **cùng state với `#/work`**; câu nói
  điều đó (prototype dòng 3340) giữ nguyên.
- **Kết quả**: `VerifyChart` + thẻ kết quả (base/post/verdict/win/cohort/confounder) + khối "khép
  vòng với khách" (`Loop`). Mốc "trước" lấy từ **`Snapshot`**, in kèm **ai đóng băng và lúc nào**.

### B6 — Wire + ba đường vào + live-check

`App.tsx`: `/issue/:id` → `IssuePage`. **KHÔNG** thêm `issue` vào `TIMEFRAME_ROUTES` — cùng lý do
với `rules`, và prototype tự nói ở dòng 3220: *"trước và sau là hai snapshot rời, không phải chuỗi
thời gian liên tục."*

Live-check headless bắt buộc: **5 tab × 3 issue** (CXI-021 đủ · CXI-028 rỗng hết · CXI-013 đã khép
vòng) + **bấm cả ba đường dẫn vào** (kết quả tìm kiếm · dòng "Ưu tiên xử lý" · link trong trình xem
điểm chạm VoC). Ba link đó tồn tại chính là lý do màn này được dựng — gõ thẳng URL **không** kiểm
được chúng.

## Bất biến KHÔNG được tháo

1. Thứ tự tầng `data → store → domain → design-system → features`. Feature không import chéo feature.
2. `domain/` **không** có hằng số tỷ lệ bịa — data thật vào ⇒ số thật, không sửa code.
3. `'chưa-biết'` ≠ `'thiếu'`; nhận diện sentinel chỉ ở `data/segment.ts`.
4. Nhãn dải chỉ đến từ `bandLabels()`.
5. Nhãn "minh hoạ" do **cờ trên dữ liệu** điều khiển, không hardcode trong component.
6. Không `localStorage`. Không `any`. Import tương đối có đuôi `.ts`/`.tsx`. `import type` cho type.
7. Không thêm palette; mọi class màu phải có thật trong `tailwind.config.js`.
8. Mẫu số không lặng lẽ loại nhóm chưa biết.

## Chỗ chạm

| File | Việc | Section |
|---|---|---|
| `data/bands.ts` · `data/schema/cxm.ts` (`NavBand`) · `seed.ts` · test pin | nhãn dải | B0 |
| `data/schema/cxm.ts` · `data/schema/index.ts` · `data/validate.ts` · `seed.ts` · `data/fixtures/demo.ts` | `hist` | B1 |
| `domain/verifyTimeline.ts` (mới) · `domain/index.ts` | timeline thuần | B2 |
| `design-system/VerifyChart.tsx` (mới) · `design-system/index.ts` | chart | B3 |
| `features/issue/IssuePage.tsx` + `tabs/*.tsx` (mới) | màn | B4·B5 |
| `App.tsx` | route (2 dòng, Opus tự sửa) | B6 |

## Nợ ghi nhận, module này KHÔNG tự sửa

- `data/mock-repository.ts:418` hiện **no-op** thay vì điều hướng `#/issue/:id` khi advance bị chặn
  (ca confounder — đúng `CXA-017`). Màn có thật rồi thì việc đó có nên thành link thật hay không là
  **một quyết định riêng**, nêu cho owner sau khi màn chạy, không đổi lặng lẽ trong module này.
- `q5`–`q8` khai `total:6` và `q15` khai `shown:2,total:6` trong khi series có 12 điểm — khuôn sai
  có sẵn, **series mới không được copy**.
