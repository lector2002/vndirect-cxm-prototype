# Module G Charter — màn "Chỉ số & ngưỡng" (`#/rules`), đủ 7 nhóm

Status: **XONG 06/08/2026, đã chứng thực độc lập.** `tsc -b` sạch · **1094 test / 99 file** (từ
1047/89) · `vite build` xanh · live-check headless, 0 console error trên cả 7 nhóm. Kết quả, bốn lỗi
bố cục chỉ-nhìn-mới-thấy, và **lỗi thứ năm nằm ngay trong bản vá lỗi thứ nhất** ghi ở
`docs/DB-FIRST-HANDOFF.md` §"Màn Chỉ số & ngưỡng".
Owner chốt 06/08 qua hộp hỏi: dựng màn này trước; nhóm SLA nguồn *dựng, sinh từ dữ liệu + nhãn bản
tạm*.

**Hai việc treo trên màn này, chốt sau khi Module G xong — đọc trước khi sửa `#/rules`:**
- **11/08, luật thiết kế:** bỏ câu ngắn giải thích dưới title lớn, và bỏ đoạn luận giải *"Hướng so
  sánh suy ra từ dấu trong mục tiêu…"* ở chân bảng chỉ số (`MetricGroup.tsx`). Đã ghi luật + phân
  loại 34 chỗ `subtitle` + ranh giới không được xoá sang diện "thừa nhận giới hạn":
  `docs/DB-FIRST-HANDOFF.md` §"Bỏ câu giải thích dưới title". **Chưa thi hành.**
- **07/08 (C5 của Module I):** nhóm SLA nguồn giờ **ghi được mà không quyết định gì** — `sourceHealth()`
  đã chuyển sang chấm theo số ngày thiếu so với mốc số liệu, `cfg.source[id]` mất quyền. Bỏ nhóm đó
  hay đổi sang ngưỡng theo NGÀY là quyết định của owner: `web/docs/module-i-signal-registry-charter.md`
  §0 mục C5.

**Ba chỗ charter này SAI so với code/dữ liệu thật, đã đo lại:**
- "pilot mở rộng: 30 bước, chỉ một phần có quan sát" — **sai**, 30/30 bước đều có `obs`.
- Danh sách chạm thiếu `data/bands.ts` (thêm `formatBound`) và `features/rules/NumField.tsx`
  (thêm prop `wide`/`hint`) — cả hai phát sinh từ lỗi ô nhập cắt mất chữ số.
- `Card.subtitle` có `truncate`: câu giải thích dài KHÔNG đặt được vào slot đó. Charter không nói,
  và hai worker đều rơi vào bẫy này.

**Hai thứ nữa phát sinh sau khi charter đóng, đã xử:**
- `formatBound` bản đầu ghi `= 0đ` cạnh ô đang ghi `1` (mọi mốc dưới tầng triệu). Đổi sang trả
  `string | null`; ghim bằng test đơn vị + test RTL. Xem §"Lỗi thứ năm" trong handoff.
- `testTimeout` nới 5s → 20s ở `vite.config.ts`. Test màn cấu hình gõ nhiều ô liên tiếp, mỗi lần ghi
  là một vòng validate toàn fixture — chạy riêng 1,3-3,2s, chạy song song cả bộ thì có test chạm
  6,8s rồi đỏ vì hết giờ. Nới ở config chứ không dán timeout vào từng test: đây là đặc tính của seam
  ghi, vá lẻ thì test chậm tiếp theo lại đỏ.
Date: 06/08/2026
Baseline trước module: `tsc -b` exit 0 · **1047 test / 89 file** · working tree sạch (trừ 3 ảnh png).

## Vì sao có module này

Bốn chỗ trong app đang **hứa** rằng chỗ sửa ngưỡng nằm ở màn này, và cả bốn đang dẫn tới trang trống:

| Chỗ hứa | Hứa gì | Nhóm cfg tương ứng |
|---|---|---|
| `design-system/AnomalyLanes.tsx:62` | "Ngưỡng và người nhận cảnh báo đặt ở Chỉ số & ngưỡng" | `anomaly.z` + `sub` |
| `features/atlas/AtlasMetricsTab.tsx:67` | "Ngưỡng của từng chỉ số đặt ở màn Chỉ số & ngưỡng" | `metric` |
| `features/atlas/AtlasPage.tsx:327` | "chọn chỉ số theo dõi ở màn Chỉ số & ngưỡng" | `metric[].on` |
| `features/sources/SourcesPage.tsx:336` | "Đổi số ngày [cooldown] ở Chỉ số & ngưỡng" | `data.cooldown` |

**Không chỗ nào hứa phần SLA từng nguồn** — nên việc kiểm kê nguồn chưa chốt (owner 06/08) KHÔNG
chặn màn này. Nó chỉ chạm đúng một nhóm, và owner đã chốt dựng nhóm đó **sinh từ `data.sources`**
kèm nhãn bản tạm, để chốt nguồn xong màn tự đổi mà không phải sửa code.

Ngoài ra: **E7 của Module E chưa từng được dựng** (`module-e-charter.md:149`). Module E làm xong
`cfg.segment` + `data/bands.ts` + đường ghi `setCfg`, nhưng màn để owner sửa ranh giới dải thì không
ai dựng — nên quyết định owner 04/08 *"nguồn trong setting sẽ là source of truth"* tới hôm nay vẫn
chưa có cửa nào bấm vào. Module G đóng nốt E7 (nhóm 7 dưới đây), và **thay thế** câu "6 nhóm còn lại
hiện nhãn chưa dựng" của E7 — nay dựng cả 7.

## Phạm vi — 7 nhóm, hiện MỘT nhóm mỗi lần

Port cấu trúc `V.rules` của prototype (`output/cxm-platform-prototype.html:4103-4327`): menu trái 
nhóm + thân phải một nhóm. Prototype có 6 nhóm; bản React có **7** vì `cfg.segment` là thứ prototype
không có.

| # | Nhóm | Khoá cfg | Sửa được? | Ghi chú |
|---|---|---|---|---|
| 1 | Bước hành trình | `step` (4 số) | có | kèm khối "áp ngay lúc này" trên các bước có quan sát |
| 2 | Chỉ số theo dõi | `metric[id]` (`on`/`watch`/`crit`) | có | band RIÊNG từng chỉ số — **không** ngưỡng chung |
| 3 | SLA từng nguồn | `source[id]` (giờ) | có | **bản tạm** — xem mục riêng bên dưới |
| 4 | Cảnh báo & khảo sát | `anomaly.z` + `data` (6 số) | có | |
| 5 | Bản tin định kỳ | `sub[setId]` (`f`/`ch`) | có | |
| 6 | Trọng số ưu tiên | — | **CHỈ ĐỌC** | lý do ở mục "Vì sao nhóm 6 chỉ đọc" |
| 7 | Phân khúc khách | `segment.band[dim]`, `segment.values[dim]` | cuts sửa được; `values` chỉ đọc | đóng E7 |

**Đầu màn chỉ có `<PageTitle route="rules" />`** — luật 06/08, không câu dẫn nào khác. Câu luận đề
của prototype ("Ngưỡng đánh giá là cấu hình của người vận hành, không phải hằng số trong code") **bỏ**,
nội dung của nó đã nằm trong dòng trạng thái mặc định/đã-sửa ngay dưới tiêu đề.

**`rules` KHÔNG vào `TIMEFRAME_ROUTES`** — màn cấu hình, không có chart theo kỳ (giữ nguyên E7).

## Ba quyết định thiết kế phải đọc trước khi code

### 1. "Trả về mặc định" KHÔNG được ghi đè `cfg.sub` một cục

`cfg.sub` bị **mutate ngoài màn này**: `mock-repository.ts:245` thêm entry khi tạo set,
`:262` khi nhân bản, `:272` xoá khi xoá set. Và `validate.ts:256` bắt buộc **mỗi set trong `dash`
phải có entry `cfg.sub`**, `:272` lặp ngược để bắt entry mồ côi.

Hệ quả đo được: người dùng tạo một set mới rồi bấm "Trả về mặc định" — nếu reset gán thẳng
`cfgDefault.sub` thì set mới mất entry ⇒ `setCfg` **ném** (nó chạy `validateFixture` với cfg ứng viên
và chặn lỗi mới phát sinh, `mock-repository.ts:156-164`). Không hỏng dữ liệu, nhưng nút reset **tịt**
đúng lúc người dùng cần nó nhất.

**Luật reset (phải viết thành hàm thuần + test):** với MỖI khoá đang có trong `cfg.sub` hiện tại —
có trong `cfgDefault.sub` thì lấy lại giá trị mặc định; không có (set tạo trong phiên) thì đặt
`{ f: 'off', ch: 'Email' }`, **đúng giá trị `mock-repository.ts:245` gán cho set mới**. Khoá có trong
`cfgDefault.sub` mà set đã bị xoá thì **không** dựng lại. Sáu nhóm còn lại reset thẳng.

### 2. Sửa cut phải chặn TRƯỚC khi gọi `setCfg`, và vẫn phải bắt lỗi ném ra

`setCfg` là đường ghi duy nhất và nó **ném Error** khi cfg mới làm phát sinh lỗi validate. Màn phải:
(a) tự kiểm cuts tăng dần nghiêm ngặt / không trùng / `min` không chồng cut đầu **và xem trước nhãn
sinh ra** trước khi cho bấm lưu (tiêu chí E7); (b) vẫn `try/catch` quanh `setCfg` và in nguyên văn lý
do ném ra — luật validate rộng hơn phần UI tự kiểm (ví dụ luật *hai dải khác nhau không được ra cùng
một nhãn*, thêm ở review Module E section 1), nên UI không được giả vờ mình biết hết.

Nhãn dải **luôn** lấy từ `bandLabels(axis)` (`data/bands.ts`) — bất biến E-c, không có đường nào khác
được gõ nhãn tay.

### 3. Nhóm 3 (SLA nguồn) là BẢN TẠM — và cách nói điều đó

Danh sách nguồn chưa chốt (owner 06/08, cùng lứa với màn `#/sources`). Ràng buộc: **số dòng của nhóm
này sinh ra từ `data.sources`**, không gõ tay dòng nào, không gõ tay id nguồn nào. Chốt kiểm kê xong
thì màn tự đổi. Kèm một `Note` nói rõ đây là bản tạm cùng lứa với màn Nguồn dữ liệu.

Câu cảnh báo tự-lừa của prototype **giữ nguyên tinh thần**: nới SLA một nguồn thì nhãn nguồn đó
chuyển sang "Đang nhận" ngay, nhưng độ trễ thật không đổi.

## Vì sao nhóm 6 chỉ đọc

Fixture lưu **điểm tuyệt đối** của 6 thành phần ưu tiên và `validateFixture()` khẳng định
`sev+aff+jc+rep+tr+reg === total`. Cho sửa trọng số mà không tính lại `total` sẽ bắn banner đỏ trên
mọi màn. Đây là lý do đã ghi trong `AI-CONTEXT.md` và prototype nói thẳng trên UI — giữ nguyên cách
nói đó, kèm bảng 6 thành phần + điểm cao nhất đang ghi nhận (`max` trên `data.iss[].pri`).

## Bốn feature + tiêu chí nghiệm thu

| # | Feature | Tiêu chí test phải ghim |
|---|---|---|
| **G1** | `domain/cfgIssues.ts` — ngưỡng đặt ngược nhau | `failCrit <= failWatch` ⇒ đúng 1 câu; chỉ số hướng **xuống** (`m-repeat`, `metricDirection`) mà `crit <= watch` ⇒ 1 câu; hướng **lên** mà `crit >= watch` ⇒ 1 câu; chỉ số `on:false` **không** sinh câu nào; `cfgDefault` + seed ⇒ **rỗng** |
| **G2** | Seam `getCfgDefault()` + `domain/resetCfg.ts` | repo trả bản sao (mutate kết quả không đụng repo); reset sau khi **tạo set mới** ⇒ `setCfg` KHÔNG ném, và set mới giữ entry `{f:'off',ch:'Email'}`; reset sau khi **xoá set** ⇒ không dựng lại entry mồ côi; reset 6 nhóm kia = `cfgDefault` từng khoá |
| **G3** | Màn 7 nhóm, sửa được, áp ngay | route `rules` không còn `Placeholder`; đổi `step.failCrit` ⇒ nhãn trạng thái bước đổi **trong cùng màn**; tắt `metric.on` ⇒ chỉ số đó mất nhãn trạng thái; nới `source[id]` ⇒ nhãn nguồn đổi; đổi `sub[].f='off'` ⇒ ô kênh bị khoá; **cả 7 nhóm bấm vào đều render**, nhóm 6 không có control ghi nào |
| **G4** | Nhóm 7 — ranh giới dải (đóng E7) | thêm/xoá/sửa cut trên `nav` xem trước được **nhãn sinh ra + số khách mỗi dải TRƯỚC khi lưu**; cut không tăng dần ⇒ chặn kèm câu nói rõ, **không** gọi `setCfg`; lưu cut mới ⇒ `store.cfg` đổi VÀ nhãn dải của khách chiếu lại (đây là lần đầu **tiêu chí #7 của stream signal** bấm được bằng tay); `setCfg` ném ⇒ màn in nguyên văn lý do, state cũ giữ nguyên |

## Bất biến KHÔNG được tháo

1. Thứ tự tầng `data → store → domain → design-system → features`. Nhóm UI đọc store, **không**
   import fixture trực tiếp (`cfgDefault` phải đi qua seam G2, không `import { cfgDefault }` trong
   `features/`).
2. Nhãn dải chỉ đến từ `bandLabels()`; không gõ tay nhãn nào.
3. `'chưa-biết'` ≠ `'thiếu'`; nhận diện sentinel chỉ ở `data/segment.ts`.
4. Cấu hình **không persist** — không `localStorage`. Màn phải nói thẳng: refresh là về mặc định.
5. Không thêm palette; mọi class màu phải có thật trong `tailwind.config.js`.
6. Không `any`; import tương đối có đuôi `.ts`/`.tsx`; `import type` cho type.

## Chỗ chạm (đã kiểm, không đoán)

| File | Việc |
|---|---|
| `src/data/repository.ts` | thêm `getCfgDefault(): Cfg` vào interface |
| `src/data/mock-repository.ts` | trả `structuredClone(cfgDefault)` |
| `src/store/store.ts` | thêm `cfgDefault: Cfg` vào snapshot (`readSnapshot`) |
| `src/domain/cfgIssues.ts` · `src/domain/resetCfg.ts` | mới, thuần, có test |
| `src/domain/index.ts` | export hai hàm mới |
| `src/features/rules/RulesPage.tsx` | vỏ màn + menu 7 nhóm (Opus tự viết) |
| `src/features/rules/NumField.tsx` | ô nhập số dùng chung (Opus tự viết) |
| `src/features/rules/groups/*.tsx` | 7 nhóm, mỗi nhóm một file |
| `src/App.tsx` | route `rules` → `RulesPage` (Opus tự sửa, 2 dòng) |

**KHÔNG** thêm `rules` vào `TIMEFRAME_ROUTES`.

## Nợ đã ghi từ Module E — module này KHÔNG tự sửa

Review Module E section 1 ghi hai chỗ **nhãn nói sai khoảng**, và cả hai sẽ hiện rõ hơn khi owner bắt
đầu sửa cut trên màn này:

1. `>5tỷ` sai bao hàm — biên dưới đóng nên khách có **đúng** 5 tỷ nằm trong dải mà nhãn bảo là hơn.
   Đúng phải là `5tỷ+`. Không sửa ở đây: `'>5tỷ'` đang là literal trong seed và trong pin của test.
2. Có cut sát 0 thì dải thứ hai mang nhãn `<50tr` trong khi ngay dưới nó đã có dải `0đ`.

Nêu lại cho owner sau khi màn chạy, **không sửa lẻ trong module này**.
