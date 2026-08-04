# Module F Charter — Chia chiều dữ liệu THẬT cho các tab (bỏ trục giả `ins.seg`)

Status: chờ owner xác nhận breakdown
Date: 04/08/2026

## Owner phát hiện lỗi, nguyên văn

> "phần VoC dashboard bảng theme theo thành phần tại sao lại chia theo gộp cả android tầm trung và
> khách 50+ vào cùng 1 thứ, đây là 2 slice của data khác nhau, user có thể chuyển giữa các slice nhưng
> từng slice ví dụ như nền tảng chỉ có adroid/ios/web/... ko thể có chuyện tổng android+ khách 50+ là
> 100% được"

> "cần redesign lại dataset và cách các tab đọc data để chia chiều dữ liệu"

> "user có thể chọn các chiều như nền tảng, độ tuổi, nav, thâm niên gv, kênh mở tk, mỗi chiều sẽ chỉ
> hiển thị bar hiện tại được chia theo các trường giá trị enum của chiều đó"

## Chẩn đoán — lỗi nằm ở gốc, không phải ở hiển thị

`domain/themeSegments.ts:56-71` (`groupSegments`) lấy nhãn từ `data.ins[].seg` rồi bịa tỷ lệ chia
`theme.n` theo nhãn đó. Giá trị thật của `ins.seg` trong seed:

    seg:['Android tầm trung','Khách 50+']
    seg:['iOS','Khách high-value']
    seg:['Cả iOS và Android']
    seg:['Khách quan tâm iBond']
    seg:['iOS · căn cước có NFC']

`ins.seg` KHÔNG phải một chiều dữ liệu — nó là **danh sách tag mô tả tự do do người viết**: 5 insight
dùng 5 bộ từ vựng khác nhau, trộn nền tảng (`Android tầm trung`, `Cả iOS và Android`), phân khúc khách
(`Khách 50+`, `Khách high-value`), và sở thích sản phẩm (`Khách quan tâm iBond`). Ba hệ quả:

1. **Không loại trừ nhau** — một khách vừa dùng Android vừa trên 50 tuổi, nên cộng lại vượt 100%.
2. **Không phủ hết ai** — không tag nào nói về phần khách còn lại.
3. **Không đếm được** — `VOC-STACKED-SPEC.md:12` đã ghi rõ `seg` "KHÔNG có count per-group", nên spec
   cũ chọn cách **bịa tỷ lệ** rồi đánh dấu `demo:true`. Nhãn demo che được việc số là giả, nhưng KHÔNG
   che được việc **trục không tồn tại** — đó là điều owner chỉ ra, và spec cũ đã sai ở chỗ này.

Tức lỗi không phải "số chưa thật". Lỗi là chart trả lời một câu hỏi vô nghĩa.

## Đã có sẵn cơ chế đúng — không cần phát minh lại

Quantify (Module C/D) đã có đủ ba thứ Module F cần:

| Có sẵn | Ở đâu | Dùng lại thế nào |
|---|---|---|
| Sổ đăng ký chiều `dims` với `base: 'agg'/'ev'/'cust'` | `seed.ts:761+`, type ở `data/schema/config.ts` | `pf` là `base:'ev'`; `age`/`nav`/`tenure`/`acq` là `base:'cust'` — đúng 5 chiều owner liệt kê |
| Chia màu theo chiều + **refuse** khi chiều không nối được | `domain/quantify.ts` (`qRunSplit`) | Chart theme gọi cùng đường, không viết bản thứ hai |
| Chip strip chọn chiều, khoá chiều không dùng được kèm lý do | `design-system/QuantifyWidget.tsx` (`SplitToggle`) | Picker chiều của chart theme là cùng component |
| Đoạn xám "phần chưa phân loại" + dòng "Phủ X%" | `themeSegments.ts:49`, `QuantifyWidget` | Dùng y nguyên cho phần theme chưa có bằng chứng gán |

**Trục `subtheme` hiện tại là THẬT và giữ nguyên** — nó đếm `n` thật của subtheme con rồi dồn phần dư
vào đoạn xám. Chỉ trục `group` phải bỏ.

## Chỗ dataset thật sự thiếu (đã đo, không suy đoán)

| Sự thật | Số đo | Hệ quả |
|---|---|---|
| `ev.tax[]` CÓ chứa id theme | `tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device','x-sub-android']` | theme → bằng chứng nối được THẬT, không cần thêm field |
| `ev.pf` có sẵn | `data/schema/voc.ts:93` | chiều "nền tảng" đếm được ngay |
| `ev.ck` có sẵn nhưng RỖ | 15 giá trị khác nhau, **chỉ 7 khớp** `cust.key`; có cả `'Ẩn danh'` (REBUILD-STATUS D-2) | 4 chiều khách (age/nav/tenure/acq) CHƯA nối được — điểm chặn thật |
| Số bằng chứng | **17 dòng cho 14 theme** | mỗi theme 1-4 dòng ⇒ chia chiều ra n=1, đúng nhưng vô dụng |
| `demo.ts` sinh bằng chứng | **KHÔNG sinh dòng nào** — chỉ sinh 300 khách | demo mode không có thêm bằng chứng nào so với seed |

Nên thứ phải "redesign lại dataset" chính là: **bằng chứng phải có đủ khối lượng và có khoá nối khách
hợp lệ**. Không phải thêm chiều mới, mà làm cho các chiều đã khai trở nên nối được.

## Quyết định thiết kế

**Bề rộng thanh GIỮ `theme.n`** (khối lượng tổng hợp), các đoạn màu đếm THẬT từ `data.ev`, phần
`theme.n` chưa có bằng chứng nào gán vào dồn thành **một đoạn xám "Chưa có bằng chứng gán"**, kèm dòng
"Phủ X% (n bằng chứng / theme.n)". Đây KHÔNG phải thiết kế mới — đúng cách trục `subtheme` đã làm ở
`themeSegments.ts:47-49`. Hai phương án bị loại và vì sao:

- *Bề rộng = số bằng chứng*: chart mất thông tin "theme này to hay nhỏ", tức mất chính thứ người dùng
  vào dashboard để xem.
- *Scale tỷ lệ mẫu lên cho khớp `theme.n`*: lại là bịa tỷ lệ, chỉ khoác áo "đếm". Đây đúng là lỗi đang
  phải sửa, làm lại lần nữa dưới tên khác.

**Bằng chứng không nối được tới khách** (`ck` là `'Ẩn danh'`, hoặc trỏ vào khoá không tồn tại) khi chia
theo 4 chiều khách: thành **một đoạn riêng "Không định danh"**, luôn vẽ, không âm thầm rứt khỏi mẫu số
(bất biến D0). Chỗ dựa là nguyên văn owner — *"có thể có chỗ có id khách hàng để đối chiếu có chỗ ko"* —
tức owner đã nói nhóm này TỒN TẠI; còn **cách hiện nó thành một đoạn riêng là đề xuất của tôi, chưa
được chốt**.

**`ins.seg` giữ lại nhưng CHỈ làm chữ mô tả** trên màn chi tiết theme — nó là ghi chú người viết, có
giá trị đọc. Điều bị cấm là dùng nó làm trục chart. Phải ghi rõ điều đó ngay tại khai báo field.

## Năm feature + tiêu chí nghiệm thu

| # | Feature | Tiêu chí nghiệm thu |
|---|---|---|
| **F1** | `themeSegments`: bỏ trục `group`, thêm trục theo `dims` thật | `ThemeAxis` không còn `'group'`; `demoRatios`/`themeSeed`/`DEMO_GROUPS` **bị xoá hết** (không còn đường nào bịa tỷ lệ trong file); chia theo `pf` trên seed ra số **đếm được từ `data.ev`**, đối chiếu tay; Σ đoạn = `theme.n` nhờ đoạn xám; chiều không nối được ⇒ **refuse** kèm câu lý do, KHÔNG vẽ thanh rỗng |
| **F2** | `demo.ts` sinh bằng chứng có khối lượng + `ck` hợp lệ | demoData vẫn **tất định**; mọi `ev.ck` hoặc khớp một `cust.key` thật hoặc là sentinel ẩn danh; mỗi theme có **đủ bằng chứng để 5 chiều đều ra ≥2 đoạn**; **KHÔNG sửa `seed.ts`** (7 khách + 17 bằng chứng thật giữ nguyên) |
| **F3** | `ThemeStackBlock`: picker 2 lựa chọn → chip strip nhiều chiều | Chip cho `subtheme` + 5 chiều owner liệt kê; chiều không nối được **hiện nhưng khoá**, tooltip mang nguyên văn lý do từ domain (không viết lại ở tầng hiển thị); đổi chiều thì **cả nhãn legend LẪN số từng đoạn** đổi theo |
| **F4** | Luật validate cho `ev.ck` (đóng nợ D-2) | `ck` trỏ vào khoá không tồn tại ⇒ **lỗi** có câu nói rõ; `ck` là sentinel ẩn danh ⇒ hợp lệ; `validateFixture` trên seed + demoData trả `[]` |
| **F5** | Rà các block khác đọc data ad-hoc | Danh sách block nào tự đọc field thay vì đi qua `dims`, kèm đường dẫn — **chỉ liệt kê, không sửa trong module này** |

## Bất biến không được tháo

1. **Không bịa tỷ lệ trong `domain/`.** F1 xoá `demoRatios` là để không còn chỗ nào bịa được.
2. Mẫu số không được âm thầm rứt nhóm không xác định (D0) — nên có đoạn xám và đoạn "Không định danh".
3. Một chiều = một tập giá trị **loại trừ nhau**. Không trục nào được trộn hai chiều — đây là chính lỗi
   owner phát hiện, và là điều test phải chặn tái diễn.
4. Thứ tự tầng `data → store → domain → design-system → features`.

## Blocking edges

    F1 --> F3
    F2 --> (F1 mới có số đáng xem)   F4 --> F2 (luật trước khi sinh data theo luật)

Thứ tự giao: **F4 → F2 → F1 → F3 → F5**. Lý do đảo F4 lên đầu: sinh bằng chứng trước khi có luật kiểm
`ck` thì không có gì chặn việc sinh ra khoá trỏ vào hư không — đúng loại "join im lặng trả 0 dòng" mà
REBUILD-STATUS đã cảnh báo.

## Quan hệ với Module E (đang chạy)

Module E (phân khúc cấu hình được) và Module F là **cùng một hướng**: chiều dữ liệu thành first-class.
E lo *định nghĩa* dải của chiều (cut trong Cfg); F lo *đọc* chiều đó ở mọi tab. Không chồng file:
E ở `schema/config.ts` + `bands.ts` + `validate.ts` + `seed.ts`, F ở `themeSegments.ts` +
`ThemeStackBlock.tsx` + `demo.ts`. **F2 KHÔNG được sửa `seed.ts`** để tránh đụng section E đang chạy.

## Test seams

Ít mà chặn được nhiều — chọn đúng 4 chỗ:

| Seam | File | Chặn được gì |
|---|---|---|
| `themeSegments(data, theme, axis)` — hàm thuần, không React | `domain/themeSegments.test.ts` | Σ đoạn = `theme.n`; số từng đoạn đếm khớp `data.ev`; đổi `axis` ra tập nhãn khác hẳn; chiều không nối được ⇒ refuse |
| `validateFixture(seed…) === []` và `validateFixture(demoData…) === []` | `validate.test.ts`, `fixtures/demo.test.ts` | F2 không sinh nổi `ck` trỏ hư không mà vẫn lọt |
| `bandLabels`/`bandOf` (Module E đã dựng) | `bands.test.ts` | nhãn dải của 4 chiều khách là **một nguồn duy nhất**, F không được khai nhãn lần hai |
| Render `ThemeStackBlock` + click từng chip | `ThemeStackBlock.test.tsx` | đổi chip ⇒ đổi cả nhãn LẪN số; chip bị khoá hiện đúng lý do |

**Một test bắt buộc phải có, viết riêng vì nó là lỗi owner đã bắt:** với mọi chiều, tập nhãn trả về
phải là **tập giá trị của đúng một chiều** — không tồn tại kết quả nào chứa cùng lúc `'Android'` và
`'Khách 50+'`. Đó là test chặn tái diễn, không phải test tính năng.

## Boundary interfaces

| Ranh giới | Hợp đồng |
|---|---|
| `data → domain` | `themeSegments` đọc `data.ev`, `data.cust`, `data.tax`, `cfg.segment`. KHÔNG đọc `data.ins` nữa |
| `domain → design-system` | `ThemeSegment[]` giữ nguyên hình `{label,n,c}`; **bỏ field `demo`** (không còn đoạn nào là số bịa) |
| refuse | dùng lại đúng hình refuse của `qRunSplit` — một câu lý do bằng tiếng Việt, sinh ở `domain/`, tầng hiển thị chỉ hiện lại |
| `cfg.segment` (Module E) | F **đọc**, không ghi. Cut đổi ⇒ nhãn đoạn đổi theo, không cần sửa gì trong F |
| `dims` registry | F lấy danh sách chiều chọn được TỪ `dims` (`base`+`evAttr`), không hardcode 5 tên chiều ở tầng features |

## Nghĩa vụ của người review từng section

1. **Đếm tay lại ít nhất một đoạn** từ `data.ev` — không nhận số vì test xanh.
2. Tìm bằng Grep xem còn chỗ nào trong `src/` sinh tỷ lệ mà không có nguồn đếm (`Math.random`, hằng số
   tỷ lệ, `demo:true`). Còn một chỗ là chưa xong F1.
3. Kiểm `Σ đoạn === theme.n` trên **mọi** theme, không phải theme mẫu.
4. Kiểm nhãn dải của 4 chiều khách đến từ `bandLabels`, không phải chuỗi viết tay trong F.
5. Kiểm `validateFixture` trên **cả** seed và demoData trả `[]`.
6. Nếu section không đạt tiêu chí nào trong bảng feature: **nói rõ tiêu chí nào**, không viết "gần đạt".

## Ba điều trong charter này là ĐỀ XUẤT CỦA TÔI, chưa phải owner chốt

Owner đã chốt (nguyên văn, trích ở đầu file): trục hiện tại sai, cần chia lại chiều dữ liệu, và 5 chiều
cần có. Ba điều dưới đây tôi tự quyết để charter đủ dùng — **cần owner chốt trước khi code F**:

1. **Bề rộng thanh giữ `theme.n`**, phần chưa có bằng chứng thành đoạn xám + dòng "Phủ X%".
2. **`ins.seg` xuống làm chữ mô tả**, không còn là trục chart (không xoá field).
3. **Bằng chứng không nối được tới khách thành một đoạn "Không định danh" riêng**, luôn vẽ.

## Chỉnh charter sau khi đọc code (04/08, trước khi giao section)

Ba điều tôi viết trong charter khi chưa đọc kỹ, giờ đã đo và phải sửa:

**1. `qRunSplit` KHÔNG dùng lại trực tiếp được.** Hợp đồng của nó là *cả hai trục đều `base:'cust'`*
và nó chia `data.cust` (`quantify.ts:280-303`). Chart theme có trục hàng là theme (`base:'agg'`) và
đếm **bằng chứng**, không đếm khách — nên nó sẽ bị đúng nhánh refuse của `qRunSplit`. Dùng lại được:
`CUST_FIELD` (getter cho từng chiều khách), `CAT_CYCLE`, **hình** refuse, `bandLabels`/`bandOf`, và
`SplitToggle` (đã ở `design-system/`, props `options`/`disabledReason`/`lockedReason` đủ tổng quát).
Hàm đếm là hàm MỚI trong `themeSegments.ts`. Ràng buộc kèm theo: F **phải** đọc chiều khách qua
`CUST_FIELD`, KHÔNG đọc `c.age`/`c.nav`/… trực tiếp — E3 sẽ đổi các field đó sang giá trị thô, và
`CUST_FIELD` là chỗ duy nhất phải sửa khi đó.

**2. Không phải MỘT đoạn "Không định danh" mà HAI đoạn.** Đo `ev.ck` trong seed: có `'Ẩn danh'`, và có
7/17 dòng mang khoá dạng `KH•••XXX` **không** khớp `cust.key` nào (15 giá trị ck khác nhau, 7 khớp,
2 dòng ẩn danh — seed chỉ có 7 khách mẫu). Hai thứ này khác
nhau đúng theo cặp `chưa-biết`/`thiếu` mà `data/segment.ts` cấm gộp:

- `'Ẩn danh'` ⇒ đoạn **"Ẩn danh"** — không có id để đối chiếu, đợi cũng không có (owner: *"có chỗ ko"*).
- khoá có nhưng không tra ra khách ⇒ đoạn **"Chưa đối chiếu được"** — join hỏng, LÀ việc phải đi sửa.

Gộp chúng lại là biến một bug thành quy luật. Đây là chỗ tôi **lệch khỏi điều owner vừa ok** (tôi trình
một đoạn, giờ thành hai) — lệch theo hướng chặt hơn, ghi ra để owner bác được nếu không muốn.

**3. Luật F4 phải là luật ĐỊNH DẠNG, không phải luật tra được.** `data.cust` của seed là 7 dòng mẫu,
không tự nhận là đầy đủ — nên "mọi `ck` phải tra ra khách" là luật SAI với seed và sẽ buộc phình seed.
Luật đúng: `ck` không rỗng, và nếu không phải `'Ẩn danh'` thì phải đúng dạng khoá khách. Phần "mọi
`ck` không ẩn danh đều tra ra được" là **assert trên demoData** (nơi có 300 khách), đặt ở `demo.test.ts`.

**Ràng buộc "không sửa `seed.ts`" HẾT hiệu lực** — nó chỉ có để tránh đụng section E đang chạy, mà
section đó đã xong và đã commit. Vẫn không phình `data.cust` của seed: 7 khách mẫu là con số nhiều test
đang ghim.
