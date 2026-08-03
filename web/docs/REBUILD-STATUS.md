# `web/` — Trạng thái bản dựng lại bằng React

> Cập nhật 03/08/2026. **Đọc file này trước khi sửa bất cứ thứ gì trong `web/`.**
> Tài liệu kèm: [module-a-charter.md](./module-a-charter.md) · [module-c-charter.md](./module-c-charter.md) · [certification-log.md](./certification-log.md) · [VOC-STACKED-SPEC.md](./VOC-STACKED-SPEC.md)

## Đây là gì, và không phải là gì

`web/` là bản dựng lại **thật** bằng React của prototype một-file
`output/cxm-platform-prototype.html` (~4786 dòng, **chỉ đọc — là đặc tả gốc, không sửa**).

⚠️ `AI-CONTEXT.md` ở project root viết ngày 28/07 nói nguồn sự thật để deploy là file HTML kia và
"React app không nằm trên đường deploy nào". Câu đó đúng với thư mục `legacy/` (React app cũ 8 route,
đã bỏ), **không đúng với `web/`**. `web/` là nơi công việc đang diễn ra từ 31/07.

## Cấu hình vận hành owner đã chốt (áp dụng cho MỌI phiên sau)

- Opus **điều phối + review + chứng thực**. Thực thi bằng subagent **native Sonnet**
  (Agent tool, `subagent_type: "claude"`, `model: "sonnet"`, `run_in_background: true`).
  **KHÔNG gọi codex.**
- Nhiều writer chạy song song **chỉ khi tập file rời nhau**. Một section một writer.
- **CHỨNG THỰC ĐỘC LẬP mọi output worker** — không tin report:
  `tsc` + `vitest` + đọc file thật + **suy lại số bằng oracle riêng** + live-check trình duyệt.
  Kiểm phạm vi worker bằng **mtime** (`find src -newermt "<giờ local>"`), KHÔNG bằng git —
  toàn bộ `web/` là untracked. `find` hiểu giờ **local**, nên mốc phải lấy từ `date`, không phải `date -u`.
- **Review độc lập context sạch là BẮT BUỘC cho mọi module**, và phải yêu cầu reviewer đối chiếu
  **đặc tả với code sẵn có**, không chỉ code với đặc tả. (Lý do ở mục *Bài học đắt nhất* bên dưới.)
- **Trước khi code MỖI MÀN: bàn với owner** các section đang có và nên sửa/thêm/xoá gì so với
  prototype, rồi owner chốt. Không code trước rồi mới hỏi.
- **KHÔNG `git commit`** trừ khi owner yêu cầu.
- Trả lời owner bằng **tiếng Việt có dấu**, giữ thuật ngữ kỹ thuật bằng tiếng Anh.

## Kiến trúc

Stack: React 19 · Vite · TypeScript · Tailwind 3 · Zustand · Vitest · RTL · HashRouter.

**Thứ tự tầng — vi phạm là lỗi:**
```
data → store → domain → design-system → features
```
- `data/` KHÔNG được import `domain/` hay `features/`.
- `design-system/` KHÔNG được import `features/`.
- Feature KHÔNG import chéo feature.

**Bất biến toàn dự án:**
- `validateFixture()` trả **rỗng** sau MỌI mutation, trên **cả hai** fixture (thật và demo).
- Không `localStorage`. Không `any`. Import tương đối phải có đuôi `.ts`/`.tsx`. `import type` cho type.
- Design token VND: cam `#d9531e` **chỉ** cho tương tác/định danh, nền xám ấm. **KHÔNG thêm palette** —
  mọi class màu phải đã tồn tại thật trong `tailwind.config.js`.

## Trạng thái hiện tại — 03/08/2026

**Xanh:** `tsc -b` 0 lỗi · **598 test / 68 file** · `vite build` xanh.
Live-check trình duyệt: đã chạy tới 02/08; **phần 03/08 chưa live-check.**

**Toàn bộ `web/` đã được commit** ngày 03/08 (`6434ade`) — trước đó là untracked.

| Giai đoạn | Nội dung | Tình trạng |
|---|---|---|
| Phase 0–2 | scaffold · data contract · adapter · store · domain · Quantify · Overview | xong, đã chứng thực |
| Phase 3 W3a/W3b | Bảng xử lý (`#/work`) | xong, đã chứng thực |
| **Module A** | Chặng Xác nhận + đóng băng baseline | **xong, đã chứng thực (A1–A5)** |
| **Module C1** | 4 trục phân khúc vào schema + sentinel + validate + seed thật | **xong, đã chứng thực** |
| **Module C2** | `domain/quantify.ts`: coverage, `refuse`/`draw`, chặn ghép chéo | **xong, đã chứng thực** |
| **Module C4** | fixture demo 300 khách, sinh tất định | **xong, đã chứng thực** — nhưng xem cảnh báo dead code ở mục C5 |
| **Module C3** | chart: dải `unk`, in tỉ lệ phủ, trạng thái từ chối vẽ | **xong 03/08, CÓ live-check** |
| Module C5 | tab Cấu hình hệ thống + công tắc demo | **MỚI MỘT NỬA** — xem dưới |
| Toolbar + Search | global filter toolbar, ô tìm kiếm (`domain/search.ts`) | xong 03/08, chưa ghi log chứng thực |
| VoC stacked | `@themestack` + `domain/themeSegments.ts` + `/topic/:id` | xong 03/08, **chứng thực tĩnh** (chưa live-check) |

### 03/08 — VoC stacked-bar + màn chi tiết theme

Đặc tả: `VOC-STACKED-SPEC.md`. Đã chứng thực bằng đọc file + oracle đếm độc lập:
14 theme · 4 subtheme · **3 theme có subtheme, 11 không**. Trục sub-theme **không normalize**
(mỗi đoạn màu = `n` thật, đoạn xám = `theme.n − Σsub`, Σ = `theme.n` cả 14/14); trục nhóm khách
tất định, Σ = `theme.n`, mọi đoạn `demo:true`, 12/14 hình phân biệt.

⚠️ **Hệ quả UX của trục trung thực:** trong top 8 theme chỉ 3 có màu — 5 thanh còn lại xám đặc
100% "Chưa gán sub-theme". Đúng dữ liệu, nhưng mặc định biểu đồ trông gần như trống. Ba theme
(`guide`, `info`, `praise`) ở trục Nhóm khách chỉ ra **1 đoạn** nên không stack được gì.
**Chưa hỏi owner** có chấp nhận hình này không.

### Seam fixture — ĐÃ DỰNG (owner chốt 03/08). C5 vẫn còn một nửa.

**Owner chốt: Demo Mode BẬT phục vụ `demoData` (300 khách), không phải `seed` (7).** Đã làm:

- `MockRepository(fixture: CxmData = seed)` — fixture tiêm được. **Mặc định giữ nguyên `seed`**, nên
  hàng chục `new MockRepository()` trong test không đổi hành vi.
- `store.ts` singleton: `createCxmStore(new MockRepository(demoData))`. `createCxmStore` vẫn mặc
  định `seed` để test giữ fixture nhỏ, tất định.
- Demo Mode TẮT **không** đổi fixture — vẫn trả `EMPTY_DATA`. Không cần `swapFixture()`: chỉ có
  đúng hai trạng thái (demoData / rỗng), không có trạng thái thứ ba phục vụ `seed`.
- Test khoá: `store.demoMode.test.ts` assert singleton có 300 `cust` còn `createCxmStore()` mặc
  định có 7. **Đây là test DUY NHẤT chặn `demoData` rơi lại thành dead code** — mọi test khác đều
  tiêm repo riêng nên sẽ vẫn xanh nếu ai đó đổi singleton về mặc định.

**`demoData` không còn là dead code.** Nó BAO trọn seed (7 khách thật + 293 sinh tất định), nên
`iss.cust` vẫn trỏ đúng 7 khoá thật; `validateFixture(demoData)` rỗng.

⚠️ **Điều này KHÔNG làm hiện được trạng thái `refuse`.** Theo số oracle 02/08, `demoData` có
known > 0 trên cả 4 trục (age 226 · acq 283 · tenure 80 · nav 64) nên coverage không bao giờ chạm
0%. Cái `demoData` thật sự mở ra là **sentinel `thiếu`**: seed có **0**, demo có **12** (`acq` 9 ·
`nav` 3) — lần đầu tiên phân biệt `chưa-biết` với `thiếu` có dữ liệu để hiện trên UI. Nhánh
`refuse` vẫn cần bộ lọc theo bước hành trình, mà `Customer` chưa có khoá nối tới `Step`.

**C5 còn thiếu:** nút đưa về dữ liệu gốc · khối thông tin nguồn dữ liệu (fixture đang dùng, số bản
ghi, kết quả `validateFixture()` gần nhất). `SettingsPage.tsx` hiện chỉ có switch Demo Mode.

### Mặc định @themestack là trục Nhóm khách (DEMO) — owner chốt 03/08

Đảo mặc định từ `subtheme` sang `group`. Lý do: chỉ 3/14 theme có sub-theme nên trục thật để mặc
định cho ra 5/8 thanh top xám đặc 100%, nhìn như chart hỏng.
**Đánh đổi đã nhận:** mặc định giờ là **số bịa**. Hai thứ chặn đọc nhầm — nhãn `demo` cạnh toggle và
`denomStrip` "tỷ trọng minh hoạ" — **không được bỏ**, và đã có test khoá cả hai.

### Module A đã đổi gì (đọc charter để biết đủ)

Bỏ chặng **Gán**, thay bằng chặng **Xác nhận**. Dải 4 chặng: Xác nhận → Duyệt → Sửa → Verify.
Lúc bấm Xác nhận, hệ thống **đóng băng số liệu làm mốc so sánh** (`Snapshot`, mỗi issue tối đa MỘT,
không ghi đè). `advanceAction` đọc mốc đông cứng đó thay vì đọc lại metric hiện tại — trước đây số
"trước" thực chất là một số "sau", nên verify lane **không thể phát hiện ca xấu đi**.

- `Action.cf: 'pending' | 'confirmed'` — cờ xác nhận, thay cho lane-theo-owner.
- `laneOf()` đọc `cf`, KHÔNG đọc `owner`.
- `assignOwner`/`AssignFields` đã **xoá hẳn**.

### Module C đã đổi gì

`Customer` thêm 4 trục: `age` · `nav` · `tenure` · `acq`. Mỗi trục mang một band hợp lệ **hoặc** một
trong hai sentinel — và **hai sentinel này tuyệt đối không được gộp**:

| Giá trị | Nghĩa | Cách chữa |
|---|---|---|
| `'chưa-biết'` | hành trình chưa tới chỗ biết được | **không chữa được**, là quy luật |
| `'thiếu'` | lẽ ra phải biết mà không có | **bug thu thập dữ liệu**, phải sửa |

Nhận diện sentinel nằm **đúng một chỗ**: `src/data/segment.ts` (`isSegUnknown`, `UNKNOWN_YET`,
`MISSING`). Không nơi nào khác được so chuỗi.

Coverage là số **đếm được** từ dữ liệu, không phải số khai báo — chủ ý, để không có bảng tra song song
nào trôi lệch khỏi dữ liệu.

**Số đo thật (oracle độc lập, 02/08):**

| Trục | seed thật (7 khách) | demo (300 khách) |
|---|---|---|
| `age` | known 7 · phủ 100% | known 226 · chưa-biết 74 |
| `acq` | known 7 · phủ 100% | known 283 · chưa-biết 8 · thiếu 9 |
| `tenure` | known 3 · chưa-biết 4 · phủ 43% | known 80 · chưa-biết 220 |
| `nav` | **known 1 · chưa-biết 6 · phủ 14%** | known 64 · chưa-biết 233 · thiếu 3 |

⚠️ **`nav` phủ 1/7 trên seed thật là NỘI DUNG, không phải khiếm khuyết.** Người duy nhất có NAV là
`KH•••9F1` — khách chuyển từ CTCK khác, đã hoàn tất. Biểu đồ tự nói ra cái bẫy: **ai còn NAV để cắt
thì đều là người đã đi hết hành trình** (survivorship bias). Không được điền bừa cho đầy, không được
thêm dòng `cust` vào seed thật.

Fixture demo sinh **tất định** (mulberry32, hạt giống cố định) — hash `cust` giống hệt qua hai tiến
trình riêng. Nó **ghép** 7 khách thật + 293 sinh mới, KHÔNG thay hẳn, vì `iss.cust` trỏ đích danh 7
khoá thật.

## C3 đóng lại (03/08, commit `76ef3ef`)

**Hoá ra C3 đã làm gần hết từ trước** — `QuantifyWidget.tsx:273-335` gọi `qRunSegment`, dựng dải
`unk` ghim cuối màu `--unk`, in dòng `buildSegDescription()` tách rõ *chưa biết* / *thiếu*, và xử lý
nhánh `refuse`. Chỉ còn hai lỗ, đã bù nốt:

| Việc | Làm gì |
|---|---|
| Không item nào dùng `base:'cust'` | Thêm `q17` (Kênh mở TK) + `q18` (Phân khúc NAV) vào seed, wire vào **`b-cxm-pilot`** |
| `cx.unsupported` tính rồi mà không UI nào đọc | `CrossTable` in lý do thay vì vẽ ma trận rỗng + 2 test |

**Vì sao `b-cxm-pilot` chứ không `b-cxm-exec`:** `OverviewPage.test.tsx:170` chốt cứng
`expect(allBlocks).toEqual(["@journeystate","@toppri","@coverage"])` — đó là quyết định owner 01/08,
nên **mọi** thứ thêm vào exec đều phá test khoá đó (kể cả gắn thêm block vào câu đang có, vì đây là
so khớp toàn danh sách). Pilot không bị test nào khoá số câu, và `dims.acq` nhãn *Kênh mở TK* khớp
thẳng *pilot Mở tài khoản*.

**Live-check (0 console error/warn)** — và khớp tuyệt đối bảng oracle ở mục trên:

| Chart | Phủ | Không xác định | Cộng |
|---|---|---|---|
| `q17` acq | 94,3% (283/300) | 8 chưa biết + **9 thiếu** | 283+8+9 = **300** ✅ |
| `q18` nav | 21,3% (64/300) | 233 chưa biết + **3 thiếu** | 64+233+3 = **300** ✅ |

Hai phép cộng ra đúng cohort là oracle số học của bất biến *mẫu số không lặng lẽ loại nhóm chưa biết*.

> **BÀI HỌC — grep hẹp dẫn tới kết luận sai về tiến độ.** Tôi từng ghi vào chính file này rằng
> `qRunSegment` "**chưa nơi nào trong `features/` gọi tới**" và từ đó kết luận C3 chưa làm. Câu grep
> đúng, kết luận sai: nó được gọi ở **`design-system/`**, không phải `features/`. Rút ra: tầng vẽ của
> dự án này sống ở `design-system/QuantifyWidget.tsx`, nên **hỏi "màn nào hiện thứ này" phải quét cả
> `design-system/`, không chỉ `features/`**. Kiểm tiến độ bằng "có ai render không", không phải "có ai
> trong `features/` import không".

### `unsupported` — trạng thái CHƯA tới được qua UI

Nhánh vừa thêm là **lưới an toàn**, không phải đường chạy thật. Ba chốt đang cùng chặn nó phát sinh:
`QuantifyBuilder.tsx:141` (lọc `byOptions` theo `evAttr`) · `QuantifyBuilder.tsx:132` (ép `by=null`
khi trục hàng không `evAttr`) · `validate.ts:396-397` (rule 16 đòi **cả hai** trục có `evAttr`). Ai
nới một trong ba thì nhánh này bắt đầu chạy thật — đừng xoá nó khi thấy coverage test không chạm tới.

## Việc còn lại

0. ~~Chốt seam fixture~~ — **xong 03/08**, xem mục *Seam fixture* ở trên. C3 hết bị chặn.
1. ~~**C3** — tầng vẽ~~ — **xong 03/08** (commit `76ef3ef`), xem mục *C3 đóng lại* ở dưới.

   **➡️ TIẾP THEO — Module D: ô breakdown (chia màu theo nhóm khách) + stacking + "Other".**
   Owner chốt 03/08 sau khi tra 4 nền tảng (Looker Studio · Metabase · Amplitude · Mixpanel). Chi
   tiết đặt ở mục *Module D* cuối file — **đọc mục đó trước khi giao worker**.
2. **C5** — tab Cấu hình hệ thống (mới hoàn toàn, **KHÔNG phải** màn "Chỉ số & ngưỡng"): công tắc
   demo (chỉ trong phiên, không `localStorage`) · nút đưa về dữ liệu gốc · thông tin nguồn dữ liệu
   (fixture đang dùng, số bản ghi, kết quả `validateFixture()` gần nhất). **Không** đưa hệ số `fx`
   vào tab này.

   > **CẢNH BÁO PHẠM VI — C5 KHÔNG phải section UI thuần.** Đã kiểm 02/08:
   > `grep -rn demoData src/` ⇒ **không nơi nào ngoài `fixtures/` dùng `demoData`** (C4 sinh ra
   > fixture nhưng chưa nối vào đâu — hiện là dead code có chủ đích). `mock-repository.ts:2` import
   > `seed` ở **module level**, constructor `structuredClone(seed)` (dòng 85); `store.ts:62`
   > `createCxmStore(repo: CxmRepository = new MockRepository())`. Nghĩa là **seam đổi fixture chưa
   > tồn tại**: muốn đổi fixture lúc chạy phải sửa đường khởi tạo repository (`data/` + `store/`),
   > không phải chỉ thêm một component toggle trong `features/`.
   > **Trước khi giao C5 phải quyết seam trước** — đề xuất: `MockRepository(fixture: CxmData = seed)`
   > + `createCxmStore` nhận fixture, store expose action `swapFixture()` dựng lại repo. Charter C5
   > phải nêu rõ nó chạm `data/` và `store/`, nếu không worker sẽ ước lượng sai kích thước.
3. **Module B** — màn chi tiết điểm gãy, port đủ **5 tab** của `V.issue` trong prototype (dòng 3228):
   `Bằng chứng · Ảnh hưởng · Cohort ảnh hưởng · Xử lý · Kết quả`.
4. **Sau nữa** — port màn cấu hình 6 nhóm ngưỡng nghiệp vụ của prototype (dòng 4112-4141+:
   `step`/`metric`/`source`/`alert`/`sub`/`weight`, kèm `resetCfg()`/`cfgDirty()`).

## Nợ kỹ thuật đã ghi nhận, cố ý chưa xử

- `data/mock-repository.ts:5` import `domain/loop.ts` — **đảo thứ tự tầng**, có từ trước Module A.
- `domain/loop.ts` có `advanceAction` thuần đã bị thay thế, giờ chỉ còn test của chính nó dùng.
- `q5`–`q8` khai `total:6` và `q15` khai `shown:2, total:6` trong khi series có 12 điểm.
  **Series mới không được copy khuôn sai này.**
- Trạng thái `refuse` (coverage 0%) **không xuất hiện trên UI ở cả hai fixture** — seed thật thấp nhất
  là `nav` 14%, demo trải đủ band. Nó vẫn được code và test. Muốn thấy thật thì cần bộ lọc theo bước
  hành trình, mà `Customer` hiện **không có khoá nối tới `Step`** (`st` chỉ là chuỗi tự do).

## Bài học đắt nhất — đọc kỹ trước khi giao việc cho worker

**Module A: đặc tả của Opus SAI, và tiêu chí nghiệm thu của Opus khoá cái sai đó lại bằng test.**

Charter ghi luật suy `verdict` là `post.v > base.v → 'improved'`, giả định ngầm mọi chỉ số đều càng
cao càng tốt. Nhưng `m-repeat` có `target:'≤ 15%'` — chiều xuống. `CXA-028` neo vào nó, nên post thấp
hơn base là **cải thiện**, mà luật cũ kết luận `'worse'`. Tệ hơn: tiêu chí nghiệm thu của Opus
("phải có test chứng minh suy ra được `'worse'`") khiến worker viết một test khoá cứng đúng ca bị đảo.

Chỉ **review độc lập** bắt được. Rút ra ba điều:
1. Opus chứng thực bằng cách đối chiếu worker với đặc tả của Opus, nên **không thể tự bắt một đặc tả sai**.
2. Reviewer phải được yêu cầu đối chiếu **đặc tả với code sẵn có**, không chỉ code với đặc tả.
3. Cẩn thận cách diễn đạt tiêu chí nghiệm thu — một câu lệch nhẹ sẽ được worker khoá lại bằng test,
   và từ đó cái sai trở thành "hành vi mong muốn".

**Đặc tả thiếu một file wire ⇒ 42 test đỏ (03/08).** `VOC-STACKED-SPEC` §4 (WIRE) liệt kê
`OverviewPage.tsx` · `blocks/index.ts` · `seed.ts` — và **bỏ sót `data/blocks.ts`**. Khối
`@themestack` vào set `b-voc-all` nhưng không có def trong registry ⇒ `validateFixture()` trả lỗi
⇒ mọi test assert `validate() === []` đỏ (42 test / 6 file), lan sang cả `mock-repository`,
`store`, `WorkPage` — những chỗ chẳng liên quan gì tới VoC.
Rút ra: **thêm/bớt một `@block` luôn chạm ĐỦ BỐN file** — `data/blocks.ts` (registry, nguồn sự
thật duy nhất) · `seed.ts` (wire vào set) · `OverviewPage.tsx` (`BlockBody` + `WIDE_BLOCKS`) ·
`blocks/index.ts` (export). Kèm theo: assert inventory `BLOCKS` trong `OverviewPage.test.tsx` là
số đếm cứng, phải cập nhật cùng lúc — đây là ngoại lệ hợp lệ của luật *chỉ thêm, không sửa test cũ*.

**Các bẫy khác đã đo được:**
- `tsc --noEmit` **không** bắt hết lỗi parse — chỉ oxc/vite bắt. **Luôn chạy `vite build`.**
  Và ở repo này `--noEmit` là **no-op** (root tsconfig `files:[]`) — dùng **`npx tsc -b`**.
- Class Tailwind không tồn tại **biên dịch im lặng** và test vẫn xanh. Đối chiếu `tailwind.config.js`.
- `qRun` (`domain/quantify.ts`) `return []` nếu thiếu entry `dims` ⇒ **biểu đồ rỗng im lặng**.
  `dims` nằm ở `data/fixtures/seed.ts`, KHÔNG ở `domain/`. Thêm trục phải thêm **cả hai bên** —
  đã có test chặn lệch.
- `qRunCross` không ghép chéo được trục `base:'cust'` (không có khoá nối `Customer`↔`Evidence`).
  Trước đây trả matrix rỗng trông như kết quả thật; giờ có `unsupported: string | null`.
- `laneOf()` trả `'off'` cho MỌI action có `iv === 'validated'`, nên **không phân biệt được** "đã đóng"
  với "đang chờ đóng". Chỗ nào đếm việc chờ đóng phải đọc `lc`, không đọc `laneOf`.

## Cách kiểm nhanh

```bash
cd web
npx tsc -b && npx vitest run && npx vite build         # cả ba phải xanh
# KHÔNG dùng `tsc --noEmit`: root tsconfig có `files: []` nên nó là NO-OP (xem mục bài học).
npm run dev                                            # http://localhost:5173
```

Kiểm phạm vi một worker vừa chạy:
```bash
date '+%Y-%m-%d %H:%M:%S'        # lấy mốc TRƯỚC khi dispatch
find src -newermt "<mốc đó>" -type f | sort
```

---

## Module D — ô breakdown + stacking + "Other" (owner chốt 03/08)

Owner yêu cầu builder chia theo tiêu chí rõ ràng: **(1)** nội dung/nguồn data đang dựng · **(2)** trong
nguồn đó chia theo nhóm khách nào (nav/tuổi/…) · **(3)** định dạng chart (line/donut/bar/bảng) · **(4)**
lồng nhiều data trong một chart, chọn cách biểu diễn từng data. Đã tra Looker Studio · Metabase ·
Amplitude · Mixpanel để bám mô hình chuẩn ngành.

### Bốn ô của mọi nền tảng, và ta đang thiếu ô nào

| Ô | Looker Studio | Metabase | Amplitude/Mixpanel | Ta có |
|---|---|---|---|---|
| tập dữ liệu | Data source | Data | Events | `Dim.base` (`agg`·`ev`·`cust`) — **có nhưng ẩn** |
| chỉ số | Metric | Summarize by | Measure | `item.metric` ✅ |
| trục chính | Dimension | 1st breakout | X-axis | `item.show` ✅ |
| **màu trong thanh** | **Breakdown dimension** | **2nd breakout** | **Group by** | ❌ **thiếu field** |
| kiểu vẽ | Chart type | Display | Chart type | `item.chart` — **thiếu line** |
| xếp lớp | Stacked / 100% | Stacking | — | ❌ không có |
| chặn quá nhiều màu | Top-N | — | top 13 + **"Other"** | `TOP_N=10` **cắt âm thầm** |

### Ba điều rút từ nền tảng ngoài

1. **Luật loại trừ (Looker Studio):** *một chỉ số + breakdown* **HOẶC** *nhiều chỉ số, không
   breakdown* — **không cả hai**. Không phải giới hạn kỹ thuật mà là ngữ nghĩa: thanh stacked đã dùng
   **màu** để mã hoá nhóm khách, thêm nhiều chỉ số nữa thì màu mang hai nghĩa. ⇒ **tiêu chí (2) và (4)
   của owner là hai CHẾ ĐỘ THAY NHAU, không cộng vào nhau.** Builder phải ép luật này.
2. **"Chọn cách biểu diễn từng data" là *visualization setting*, không phải cấu trúc data** (Metabase):
   series tồn tại trước, rồi mới gán từng series là line/bar/area. ⇒ #4 = thêm map `{series → kiểu vẽ}`.
   ~~**Trục dọc thứ hai thì đến Metabase cũng chưa có — đừng hứa ở đợt đầu.**~~
   **SAI, đã bác 03/08 (khảo sát lại):** Metabase **có** `Split y-axis when necessary`. Câu cũ lấy một
   khẳng định sai làm lý do hoãn — hoãn thì vẫn được, nhưng phải vì lý do khác (nó nằm sau vách mark),
   không phải vì "nền tảng lớn cũng chưa có".
3. **Ô "Other" là chuẩn ngành ta đang thiếu:** Amplitude top 13 + "Other"; Mixpanel ≤10 nhóm +
   "Rest of the World". Ta cắt `TOP_N=10` và **đuôi biến mất** khỏi chart. Tiền lệ để sửa đã có trong
   nhà: `subthemeSegments` dùng dải xám `"Chưa gán sub-theme"` cho phần dư.

### Điểm chặn thật: vách `show` / `series`

`QuantifyItem = QuantifyShow | QuantifySeries` là hai kind **rời nhau**. `show` là ảnh chụp một chiều,
**không có trục thời gian**; `series` có `t[]` nhiều chuỗi nhưng **không dựng được ở builder**
(`CHART_OPTIONS` chỉ có `rank`/`donut`) và mọi chuỗi vẽ **cùng một kiểu**. Vách này khoá **cả #3 (line)
lẫn #4 (nhiều lớp)** — không phải chuyện join khách↔bằng chứng như tưởng ban đầu.

⇒ **Phạm vi đợt này (owner chốt): CHỈ #1 + #2 + stacking + "Other". KHÔNG chạm vách show/series.**

### Độ trung thực — hai nửa khác nhau

- Nội dung `base:'cust'` chia màu theo thuộc tính khách khác ⇒ **số THẬT, đếm được, không đổi schema**:
  hai field nằm trên **cùng một dòng** `Customer`. `q17`/`q18` vừa thêm ở C3 là ví dụ thật để thử.
- Nội dung `base:'agg'`/`'ev'` (theme, keyword, category) chia màu theo nhóm khách ⇒ **không có đường
  tính thật**: `Evidence` (`schema/voc.ts:86`) **không có khoá khách**.

**Owner chốt: dùng tỷ lệ minh hoạ + nhãn demo — NHƯNG kèm ràng buộc bổ sung "thuật toán phải dùng
được thật, chỉ mượn data demo".** Hai câu đó va nhau nếu làm y như `groupSegments`, vì hàm đó nhét tỷ
lệ bịa vào **chính thuật toán** (`demoRatios` từ hạt char-code tên theme) — cắm data thật vào thì nó
vẫn bịa. Cách hoà giải dưới đây là **CÁCH ĐỌC CỦA CLAUDE, CHƯA ĐƯỢC OWNER DUYỆT** — nói rõ vì khi
được hỏi trực tiếp, owner đã chọn *"tỷ lệ minh hoạ"* và **loại** nhánh *"thêm khoá khách vào
Evidence"*; chỉ thị bổ sung đến sau mới làm nhánh bị loại thành nhánh duy nhất khả thi. Ai đọc file
này về sau: **đây là suy luận cần xác nhận, không phải quyết định đã chốt.**

> **CẬP NHẬT 03/08 (tiếp 4) — chốt này ĐÃ ĐƯỢC THÁO.** Owner cho phép sửa data model. Xem
> `### ✅ OWNER CHỐT 03/08 (tiếp 4)` ngay dưới đây; bảng ba tầng bên dưới vẫn đúng nhưng đổi vai:
> tầng demo giờ chỉ **điền giá trị**, không còn phải **phát minh ra quan hệ**.

| Tầng | Quy tắc |
|---|---|
| `domain/` | group-by/join **thật**, đếm từ dòng. **KHÔNG hằng số bịa nào.** Data thật vào ⇒ số thật, **không sửa code** |
| `data/fixtures/demo.ts` | chỗ bịa dồn hết về đây: sinh khoá khách trên `Evidence` một cách **tất định** |
| UI | nhãn "demo" do **cờ trên dữ liệu** điều khiển ⇒ **tự tắt** khi nguồn thật vào, không hardcode trong component |

**Hai hệ quả của nhánh join `ev→cust` mà bảng trên KHÔNG tự lo — phải chốt TRƯỚC khi giao worker,
vì worker đụng phải giữa section sẽ hoặc tự nới, hoặc tắc:**

1. **validate rule 16 (`validate.ts:396-397`) sẽ mâu thuẫn với thực tế.** Join thật làm trục khách
   ghép chéo **được**, trong khi rule 16 vẫn cấm. Mà rule 16 đúng là **một trong ba chốt** vừa ghi ở
   `### unsupported — trạng thái CHƯA tới được qua UI`. Nếu Module D nới rule 16 thì guard vừa ship
   **bắt đầu chạy thật**, và comment trong `CrossTable.test.tsx:35` ("KHÔNG ĐƯỢC có") thành **sai**.
   ⇒ Quyết định rõ: **Module D có chạm rule 16 hay không.** Mặc định đề xuất: **KHÔNG chạm** (breakdown
   dùng field `split` riêng, không đi qua đường `by`/cross).
2. **`seed.ts` chỉ có 17 bản ghi `ev`.** Join thật ⇒ ô breakdown trên trục `agg`/`ev` ra **1-3 mẫu**.
   Mọi test render breakdown sẽ assert trên data gần rỗng, trừ khi nới `ev` — mà đó là sửa **fixture
   thật**, không phải fixture demo. Đây là lý do thứ tự section bên dưới quan trọng.

### ✅ OWNER CHỐT 03/08 (tiếp 4) — ĐƯỢC PHÉP SỬA DATA MODEL ĐỂ PHỤC VỤ CHART

**Nguyên văn owner:** *"được phép điều chỉnh data model để fulfill các dạng chart mà tôi muốn, đây chỉ
là dựng bản lý tưởng, có thể yêu cầu data dựa trên các nhu cầu để tạo chart lý tưởng của mình."*

**Đảo chiều ràng buộc.** Trước 03/08 mặc định là *chart phải bó theo schema đang có*, nên mọi chỗ schema
không đỡ được đều rơi vào "bịa tỷ lệ" hoặc "để sau". Từ nay: **schema đi theo nhu cầu chart.** Đây là
bản lý tưởng — được quyền **yêu cầu data**, và cái gì nguồn thật chưa có thì đó là **yêu cầu tích hợp**
ghi lại, không phải lý do làm số giả.

**Tháo ba chốt đang chặn:**

| Chốt cũ | Ghi ở | Trạng thái mới |
|---|---|---|
| `Evidence` không có khoá khách ⇒ trục `agg`/`ev` × nhóm khách phải bịa tỷ lệ | mục *Độ trung thực* trên | **Tháo.** Nhánh "thêm khoá khách vào `Evidence`" từ *bị owner loại* → thành **nhánh chính**. `demoRatios()` không còn là đường duy nhất |
| Vách `show`/`series` khoá #3 (line) và #4 (nhiều lớp) | mục *Điểm chặn thật* trên | **Tháo.** Được phép mở/hợp nhất union `QuantifyItem`. Vẫn là **module riêng**, không nhét vào Module D |
| `seed.ts` chỉ có 17 bản ghi `ev` ⇒ breakdown ra 1-3 mẫu | hệ quả (2) ở trên | **Tháo.** Được nới fixture thật để test breakdown có mẫu đủ |

**Bốn thứ quyền này KHÔNG tháo** — chúng là bất biến *trung thực*, không phải giới hạn kỹ thuật, nên
schema rộng hơn không làm chúng hết đúng:

1. **`domain/` không được có hằng số tỷ lệ bịa.** Mục đích sửa schema là để số **đếm được**, không phải
   để bịa cho dễ. Data thật cắm vào ⇒ số thật, **không sửa code**.
2. **`'chưa-biết'` (`UNKNOWN_YET`) ≠ `'thiếu'` (`MISSING`)** — không gộp trong `domain/`.
3. **Mẫu số không được lặng lẽ loại nhóm chưa biết** (bài học defect D0).
4. **Luật loại trừ Looker Studio** — *một chỉ số + breakdown* **XOR** *nhiều chỉ số, không breakdown*.
   ⚠ **Đã hạ bậc 03/08 (khảo sát lại):** trước đó ghi đây là "**ngữ nghĩa** phổ quát" — **không đúng**.
   Đó là **house rule của Looker Studio**; Metabase cho ≥2 metric + grouping column và giải bằng cách
   gán **mark khác nhau** cho từng series. Nên luật này **yếu hơn ba bất biến trên**: nó là lựa chọn
   thiết kế đáng giữ cho người dùng nghiệp vụ (một hình một mẫu số), **nhưng đừng dùng nó để chặn tiêu
   chí #4** của owner (nhiều lớp data, chọn kiểu vẽ từng lớp) — đúng đường mà Metabase đã đi. Tương tự: nhãn "demo"/"minh hoạ" vẫn do **cờ trên dữ liệu** điều khiển để tự tắt khi nguồn
   thật vào.

**Việc bắt buộc kèm theo MỖI lần sửa schema** (thiếu là lỗi im lặng, không phải lỗi hiển thị):

- **`validate.ts` phải có rule cho field mới.** Riêng khoá khách trên `Evidence` cần rule **referential
  integrity** (khoá phải tồn tại trong `data.cust`) — không có thì join sai sẽ ra **0 mẫu im lặng**,
  đúng loại lỗi trông như "chưa có data".
- **`seed.ts` phải cập nhật cùng lúc**, vì `validate.test.ts:8` đòi `validateFixture(seed, …) === []`.
- **Quyết định lại rule 16** (`validate.ts:396-397`): có join thật thì trục khách ghép chéo **được**, nên
  lý do kỹ thuật của lệnh cấm mất. Nhưng **đề xuất vẫn GIỮ `split` tách khỏi `by`** — vì lý do thật của
  rule 16 là luật loại trừ (4) ở trên, không phải thiếu join. Nếu về sau vẫn nới: `unsupported` guard
  **bắt đầu chạy thật** và comment `CrossTable.test.tsx:35` ("KHÔNG ĐƯỢC có") thành **sai** — phải sửa
  cả hai trong cùng lần.
- **Ghi "yêu cầu data" thành danh sách.** Mỗi field mình tự thêm vào model là một dòng nguồn thật phải
  cấp về sau; không ghi thì đến lúc tích hợp không ai biết chart nào phụ thuộc field nào.

### 📋 YÊU CẦU DATA (danh sách sống — mở 03/08 khi dựng drill-down)

Đây là chỗ giữ lời hứa ở gạch đầu dòng trên. Mỗi dòng là **một thứ nguồn thật phải cấp**, kèm **màn
nào đang bị què vì thiếu nó** và **số đo chứng minh**, chứ không phải mong muốn chung.

| # | Yêu cầu | Vì sao (đo được, 03/08 trên `demoData`) | Màn bị ảnh hưởng |
|---|---|---|---|
| **D-1** | **Mật độ `Evidence` tương đương cohort.** Hiện `data.ev` có **17 bản ghi** cho **14 theme** và **300 khách**. | **10/14 theme có 0 bằng chứng** ⇒ bấm vào là panel rỗng. Hàng lớn nhất (`x-th-device`) ghi **412** mà chỉ có **8** bằng chứng — lệch ~50 lần. Nguồn `src-ga` ghi **41.200** có **2**. | Drill-down (mọi trục `agg`); "Evidence mẫu" ở `ThemeDetailPage` |
| **D-2** | **`Evidence.ck` phải TOÀN VẸN** — mỗi `ck` trỏ tới một dòng `Customer` thật, hoặc là sentinel `'Ẩn danh'` khai báo rõ. | `ck` **đã tồn tại** trong schema (`voc.ts:99`) — nhận định cũ "Evidence không có khoá khách" là **SAI, đã bác 03/08**. Nhưng có **15 giá trị `ck` khác nhau, chỉ 7 khớp** `cust.key`; 7 khoá trỏ vào hư không. `validate.ts` **chưa có luật nào** kiểm việc này ⇒ đúng loại "join im lặng trả 0 dòng" mà mục obligations ở trên đã cảnh báo. | Module D **section 2** (chia màu trục theme theo nhóm khách); drill-down verbatim cho trục khách |
| **D-3** | **Nhãn `st` (trạng thái hành trình) trên `Customer`** nếu muốn toggle nhóm khách theo bước đang mắc. | Field `st` có sẵn nhưng **chưa có `dims` entry nào** dùng nó, nên chưa vào được picker chia màu. | Yêu cầu toggle nhóm khách (owner nêu 03/08) |

**Kỷ luật đi kèm:** cho tới khi D-1/D-2 được cấp, **KHÔNG sinh thêm verbatim để lấp chỗ rỗng.** Quyền
"được yêu cầu data" là quyền **đòi**, không phải quyền **bịa**: bịa 800 verbatim làm panel trông đầy
sẽ phá đúng bất biến (a) (`domain/` không có hằng số tỷ lệ bịa — data thật vào là số thật ra). Panel
hiện nói thẳng "chưa có bằng chứng mẫu nào cho hàng này, tập mẫu có 17 bản ghi" — đó là fixture đang
nói thật về chính nó, không phải defect.

### Thứ tự section — tracer bullet KHÔNG cần join

| # | Nội dung | Vì sao trước/sau |
|---|---|---|
| **1** | `split` + stacking + "Other" **chỉ trên trục `base:'cust'`** (`q17`/`q18`) | Hai field trên **cùng dòng `Customer`** ⇒ group-by hai chiều thật: **0 đổi schema, 0 chạm `Evidence`, 0 câu hỏi rule 16, số THẬT**. Chạy hết sáu-file-chạm end-to-end và live-check được ngay trên `#/cxm/b-cxm-pilot` |
| **2** | Trục `agg`/`ev` chia theo nhóm khách — **join THẬT qua khoá khách thêm vào `Evidence`** (owner chốt 03/08 tiếp 4 cho sửa schema), giá trị do `demo.ts` sinh tất định + cờ demo | Chỉ scope sau khi section 1 chốt được **hình dạng field**. ~~Nếu owner đổi ý về nhánh join~~ — owner **đã** chốt nhánh join; section 1 đã ship nên không bị ảnh hưởng |

### Section 1 — ĐÃ XONG (03/08)

Chín file chạm (nhiều hơn danh sách "sáu file" dự kiến bên dưới — thêm `Bars.tsx` cho prop vẽ,
`themeSegments.ts` cho palette dùng chung, và `QuantifyPage.tsx` cho map item→builder):

| File | Việc |
|---|---|
| `data/schema/quantify.ts` | `StackMode` + `split?`/`stack?` trên `QuantifyShow`; `split?: undefined` trên `QuantifySeries` để union narrow được |
| `data/validate.ts` | rule 16 **THÊM** nhánh `split`/`stack` — **KHÔNG nới** luật `by` cũ, nên ba chốt giữ `unsupported` không tới được vẫn nguyên |
| `domain/quantify.ts` | `qRunSplit()` — group-by hai chiều trên cùng dòng `Customer`, **0 hằng số tỷ lệ bịa**; top 6 + "Khác", "Không xác định" là đoạn RIÊNG |
| `domain/themeSegments.ts` | export `CAT_CYCLE` để `qRunSplit` dùng chung, tránh bản sao thứ ba của palette |
| `design-system/Bars.tsx` | prop `stackPct` (100%) + prop `segmentLegend` (chú giải màu **theo hàng**) |
| `design-system/QuantifyWidget.tsx` | nhánh render split; legend đổi sang `split.legend`; nhãn trục nói rõ khi `pct` |
| `features/quantify/QuantifyBuilder.tsx` | picker `split` (lọc `base:'cust'`) + picker `stack`; 5 guard chuẩn hoá trong `setField` |
| `features/quantify/QuantifyPage.tsx` | `openBuilderFor` map thêm `split`/`stack` — thiếu là **Lưu đè ghi mất định nghĩa chart** |
| `data/fixtures/seed.ts` | `q19` (`show:'acq'`, `split:'nav'`), gắn vào câu 3 của `b-cxm-pilot` |

Verify: `tsc -b` exit 0 · vitest **68/68 file, 614 test, 0 error** · `vite build` OK.
(Lần chạy trước đó in `62 passed (62)` — mẫu số đó là số file **chạy được**, không phải 68 file tồn
tại: 6 worker không start nổi vì CPU 100%. Bài học: đọc dòng `Errors` và đối chiếu số file với `find`,
đừng tin exit code — `| tail` làm exit code luôn bằng 0.)

Hai quyết định thiết kế cần biết trước khi sửa tiếp:

1. **"Khác" hiện KHÔNG tới được trên section 1.** Mọi trục khách có ≤5 giá trị, còn `SPLIT_TOP_N` = 6.
   Guard vẫn giữ (section 2 và data thật sẽ cần) và được test bằng fixture cast — cùng lối `unsupported`.
2. **Legend `@themestack` là CHÚ GIẢI THEO HÀNG, không phải một dải chung** — và **đừng gộp** nó với
   `ChartLegend` của `QuantifyWidget`. Lý do: `themeSegments()` gán `CAT_CYCLE[i]` theo thứ hạng TRONG
   một theme, mỗi theme lại có bộ sub-theme/nhóm khách riêng ⇒ cùng một màu ở hai thanh là hai thứ khác
   nhau; một dải chung ở đó **nói điều không đúng** (và cũng không đủ màu: ~12 nhãn trên 8 theme mà
   `CAT_CYCLE` chỉ có 5). Ngược lại `qRunSplit` gán màu MỘT LẦN từ mảng `order` dùng chung cho mọi hàng
   nên `ChartLegend` một dải là đúng ở đó. Legend theo hàng cố ý **không in `n`**: trục "Nhóm khách" của
   `@themestack` có tỷ trọng DEMO, in số ra là trưng số bịa như phép đo.

### Section A + B — XONG (03/08, sau khảo sát nền tảng `output/chart-platform-review.md`)

**A1. Chặn `metric:'pct'` × `stack:'pct'`.** Hai field này là **hai mẫu số khác nhau**: `metric:'pct'`
= % trên TỔNG cohort (vào nhãn số qua `Bars.pctMode`), `stack:'pct'` = tỷ trọng TRONG từng hàng (vào bề
rộng đoạn). Bật cả hai thì `QuantifyWidget` in nhãn trục dọc `"% trên tổng"` trong khi nhãn đáy nói
`"(100%) trong từng <đơn vị>"` — hình NÓI SAI. Trước đổi này tổ hợp đó **qua được cả validate lẫn
builder** (defect do chính section 1 mở ra). Chặn ở `validate.ts` rule 16 **và** ở `setField` của
builder (builder dựng payload trước khi validate chạy; thiếu guard thứ hai thì user lưu được rồi mới
thấy banner đỏ). Lối "field vừa bấm thắng" giữ nguyên như gate `by`↔`split`.

**A2. Gộp đuôi Top-N của trục HÀNG thành `"Khác (+N)"`.** `Donut.tsx` đã gộp từ D6a
(`OTHER_COLOR = var(--cat-other)`), còn chart dạng **thanh** thì cắt và đuôi biến mất ⇒ cùng một câu hỏi
vẽ hai kiểu cho hai bức tranh khác nhau. Looker Studio bật "Group the rest as Others" **mặc định**.
Bốn quyết định kèm theo:
- **KHÔNG gộp cho view bảng.** Bảng có việc là liệt kê; người dùng đổi mốc số dòng để đọc thêm từng
  giá trị, gộp lại là lấy đi đúng thứ họ vừa xin — mẫu số đã có ở `denomStrip`. (Looker cũng để "Others"
  cho chart, bảng thì phân trang.) Đây là lý do `QuantifyDetail.test.tsx` không phải sửa.
- **"Khác" ≠ "Không xác định", không bao giờ gộp.** "Khác" là các nhóm ĐẾM ĐƯỢC nhưng nhỏ; "Không xác
  định" là phần KHÔNG đếm được. Màu khác nhau (`--cat-other` vs `--unk`), và thứ tự là *nhóm có tên →
  Khác → Không xác định* (ghim cuối).
- **`denomStrip` tính TRƯỚC khi gộp** (`paintedRows`, không phải `shownRows`): tính sau thì hàng "Khác"
  bị đếm như một nhóm nữa và mẫu số nói sai.
- **`buildLegend` phải LOẠI hàng "Khác" trước khi đối chiếu `data.cats`.** Không loại thì
  `items.length !== definedColors.length` thành đúng và hàm trả rỗng — tức thêm hàng "Khác" lại làm
  **mất chú giải intent của cả chart** (đã thấy 3 test đỏ). Cố ý KHÔNG thêm mục legend cho "Khác": khác
  với đoạn màu trong thanh, hàng có nhãn riêng ngay cạnh nó rồi.

**B. Tách `ChartKind` → `ShowMark` | `SeriesMark`.** Chỗ sai **không phải** vách `show`/`series` mà là
`chart: ChartKind` bị hàn dùng chung, nên type cho phép `{kind:'show', chart:'trend'}` và
`{kind:'series', chart:'donut'}` — hai tổ hợp không có đường render nào, chỉ bị chặn lúc chạy. Đã đếm
`seed.ts` trước khi tách: `rank` 13 + `donut` 1 đều `kind:'show'`; `trend` 2 + `cohort` 2 + `anomaly` 1
đều `kind:'series'` ⇒ **phân hoạch sạch, 0 migration, 0 literal bị đổi, `tsc -b` xanh ngay lần đầu**.
`ChartKind` **giữ lại** làm alias hợp, chỉ cho `quantifyFilter.ts` (lọc trên cả hai kind cùng lúc).
`validate.ts` đổi set phẳng 5 mark thành **hai set theo kind** — luật runtime này để đỡ nguồn JSON/API
thật khi tích hợp, vì type đã chặn ở biên dịch.

**Khuyến nghị kiến trúc đã chốt: KHÔNG hợp nhất phẳng `show`/`series` theo encoding kiểu Vega-Lite.**
Phép thử phân định: tách mark **giữ nguyên chữ ký cả bốn hàm** `qRun`/`qRunSegment`/`qRunSplit`/
`qRunCross` (đều nhận `QuantifyShow`), còn hợp nhất phẳng buộc dispatch lại theo hình dạng encoding —
tức **mở lại phần hạch toán `known`/`unknown`/`missing`** đang gánh bất biến "mẫu số không lặng lẽ loại
nhóm chưa biết", mà **không được thêm khả năng nào**. Vega-Lite tách `mark` khỏi `data` và dùng `layer`
để đặt nhiều kiểu vẽ cạnh nhau; nó **không** xoá phân biệt kiểu dữ liệu.

Verify: `tsc -b` exit 0 · vitest **68/68 file, 633 test, exit 0**.

**Đính chính về `Evidence.tax: string[]`** (báo cáo khảo sát nêu như rủi ro chặn section 2): rủi ro
**hẹp hơn** thế. `validate.ts` rule 9 đã buộc **mỗi evidence đúng 1 node theme** (test khoá ở
`validate.test.ts:183-191`, thông điệp "đúng 1 node theme"), nên một evidence **không** đếm đôi một
khách qua hai theme. Cái còn lại thật sự phải chốt: một khách có NHIỀU evidence ở nhiều theme là bình
thường và đúng ⇒ **Σ các hàng theme ≠ cohort**. Đó là câu hỏi *cách đọc mẫu số*, không phải lỗi đếm —
và phải chốt TRƯỚC khi code section 2, không phải giữa lúc code.

### Cạm bẫy phải tránh khi giao worker

- **KHÔNG mượn field `by`.** `by` mang nghĩa "ghép chéo trên evidence", nghĩa đó đã ăn vào `qRunCross`,
  `CrossTable`, validate rule 16 và hai guard builder. Mượn nó là phá đúng ba chốt đang giữ
  `unsupported` không tới được. Breakdown cần **field MỚI** (`split`).
- **`pf` có ở CẢ `Evidence` LẪN `Customer`** — đưa vào picker "nhóm khách" là nhập nhằng. Loại nó ra,
  hoặc nói rõ đang lấy `pf` của bên nào.
- **Danh sách chạm của một field mới trên `QuantifyShow` là SÁU file, không phải bốn:**
  `schema/quantify.ts` · `validate.ts` (rule mới) · `domain/quantify.ts` (hàm run mới) ·
  `QuantifyBuilder.tsx` (picker + normalize trong `setField`) · `QuantifyWidget.tsx` (nhánh render) ·
  `seed.ts` nếu có fixture dùng. So sánh: bài học `@block` là bốn file.
