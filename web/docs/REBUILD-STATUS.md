# `web/` — Trạng thái bản dựng lại bằng React

> Cập nhật 02/08/2026. **Đọc file này trước khi sửa bất cứ thứ gì trong `web/`.**
> Tài liệu kèm: [module-a-charter.md](./module-a-charter.md) · [module-c-charter.md](./module-c-charter.md) · [certification-log.md](./certification-log.md)

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

## Trạng thái hiện tại — 02/08/2026

**Xanh:** `tsc` 0 lỗi · **560 test / 58 file** · `vite build` xanh · live-check trình duyệt đã chạy.

| Giai đoạn | Nội dung | Tình trạng |
|---|---|---|
| Phase 0–2 | scaffold · data contract · adapter · store · domain · Quantify · Overview | xong, đã chứng thực |
| Phase 3 W3a/W3b | Bảng xử lý (`#/work`) | xong, đã chứng thực |
| **Module A** | Chặng Xác nhận + đóng băng baseline | **xong, đã chứng thực (A1–A5)** |
| **Module C1** | 4 trục phân khúc vào schema + sentinel + validate + seed thật | **xong, đã chứng thực** |
| **Module C2** | `domain/quantify.ts`: coverage, `refuse`/`draw`, chặn ghép chéo | **xong, đã chứng thực** |
| **Module C4** | fixture demo 300 khách, sinh tất định | **xong, đã chứng thực** |
| Module C3 | chart: dải `unk`, in tỉ lệ phủ, trạng thái từ chối vẽ | **CHƯA LÀM** |
| Module C5 | tab Cấu hình hệ thống + công tắc demo | **CHƯA LÀM** |

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

## Việc còn lại

1. **C3** — tầng vẽ: dải `unk`, in tỉ lệ phủ, trạng thái từ chối vẽ, và hiển thị
   `QuantifyCrossResult.unsupported` thay vì vẽ matrix rỗng. `qRunSegment` và `unsupported` đã có
   sẵn ở `domain/quantify.ts`, **chưa nơi nào trong `features/` gọi tới**.
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

**Các bẫy khác đã đo được:**
- `tsc --noEmit` **không** bắt hết lỗi parse — chỉ oxc/vite bắt. **Luôn chạy `vite build`.**
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
npx tsc --noEmit && npx vitest run && npx vite build   # cả ba phải xanh
npm run dev                                            # http://localhost:5173
```

Kiểm phạm vi một worker vừa chạy:
```bash
date '+%Y-%m-%d %H:%M:%S'        # lấy mốc TRƯỚC khi dispatch
find src -newermt "<mốc đó>" -type f | sort
```
