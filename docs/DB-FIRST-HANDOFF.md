# Chart theo điểm đo (signal) — Handoff cho session mới

_Cập nhật: 2026-08-05 (đợt 3 — pilot mở rộng). Đọc file này + `AI-CONTEXT.md` + **`output/thiet-ke-chart-signal.html`** + **`output/thiet-ke-chart-signal-bo-sung-dot-2.html`** + **`output/yeu-cau-du-lieu-pilot-mo-rong.html`** trước khi làm._

## Trạng thái

- `main` = **`c6767d6`** (05/08). Đã commit: S1 (`ca3cfc0`+`3a43c2c`) · S2+S4 (`13199fd`+`27fd4f6`) · S3a-1 (`607b1fd`) · tài liệu đợt 2b + kế hoạch S3 (`33a07d2`) · S3a-2 (`3f00a99`) · S3b (`9ad1a14`) · S3c-1 (`88a41ec`) · S3c-2a + tầng phân loại "không biết" (`869338b`) · S3c-2b (`17b84ec`) · tài liệu S3 (`725d24d`+`c6767d6`).
- **Working tree KHÔNG sạch.** Pilot mở rộng (đợt 3, 05/08) + ba vòng sửa layout + đổi điểm đo liveness + mở chia màu Quantify đã làm xong và tự kiểm nhưng **chưa commit** — 15 file code/test sửa, file này sửa, 1 file tài liệu mới (`output/yeu-cau-du-lieu-pilot-mo-rong.html`, chưa track). Owner chưa yêu cầu commit.
- `npx tsc -b` sạch. **828/828 test xanh (79 file)**. Các mốc đã đi qua: 727/72 (trước S1) → 749/73 (sau S1) → 751/74 (S2+S4) → 754/74 (S3a-1) → 793/77 (S3c-1) → 814/78 (S3c-2a) → 827/79 (S3c-2b) → **828/79 (pilot mở rộng)**. Dùng mốc gần nhất để đối chiếu, đừng dùng số cũ.
- **Cả stream đã xong về code.** Còn lại là việc của owner + việc chờ dữ liệu thật: xem "Còn hở" và "Việc còn lại của stream".
- Tài liệu thiết kế owner đã duyệt: **`output/thiet-ke-chart-signal.html`** (6 vòng) + **`output/thiet-ke-chart-signal-bo-sung-dot-2.html`** (bổ sung đợt 2, owner chốt 04/08/2026) — cả hai là nguồn sự thật cho stream này, đọc trước khi code. `output/thiet-ke-chieu-phan-tich.html` và `output/thiet-ke-db-first.html` là của stream trước, còn giá trị lịch sử.

## Stream này làm gì

Thêm **một loại chart mới**: chọn một điểm đo (signal) → hệ thống bẻ giá trị của nó thành các cột → chọn một chiều để cắt lát trong cột. Chart cũ (VoC, taxonomy, hành trình) **giữ nguyên**.

Owner đã **huỷ hẳn** màn thêm/sửa/xoá chiều của stream trước — chiều là cố định. Kéo theo: không gom `cfg.segment`, không làm `dimUsedBy`, không khai enum đóng cho `seg`/`tier`.

## S1 — ĐÃ XONG

| Nghiệp vụ | Tên trong code |
|---|---|
| Danh sách giá trị một điểm đo bắn ra | `Signal.values` (`data/schema/journey.ts`) |
| Từng lần bắn (chỉ sống trong bộ sinh demo) | `Fire[]` module-local ở `data/fixtures/demo.ts` |
| Năm bảng đếm | `CxmData.sigCounts: SigCount[]` |
| Phép cộng ra bảng đếm | `data/projectSignalCounts.ts` |
| Chiều nền tảng của lần bắn | `dims.sigpf`, `base: 'fire'` |
| Ba ràng buộc trung thực | `data/validate.ts`, vòng ngoài theo signal |

## Bất biến KHÔNG được tháo

1. Thứ tự tầng `data → store → domain → design-system → features`. **`domain/` không được biết `cfg` tồn tại.**
2. `domain/` không bịa tỷ lệ; `'chưa-biết'` ≠ `'thiếu'`; mẫu số không âm thầm bỏ nhóm không biết; một chiều = một tập giá trị loại trừ nhau.
3. **Năm** nghĩa "không biết", không gộp: `chưa-biết`, `thiếu`, `Ẩn danh`, `Chưa đối chiếu được`, và **`chưa định danh`** (lần bắn không nối được về khách — nghĩa mới của S1).
4. **Nhãn dải không bao giờ gõ tay** — luôn tính từ ranh giới.
5. Màu gán theo **thứ hạng**, không theo tên giá trị.
6. `Customer.bands` dựng lại từ đầu mỗi lần chiếu.
7. **Năm bảng đếm là số PHÁI SINH**, không phải fixture viết tay — bộ sinh giữ lần bắn ở dạng thô rồi cộng lại. Đây là thứ giữ cho "đổi ranh giới NAV thì chart chia lại ngay" còn đúng. Đừng biến nó thành dữ liệu tĩnh.
8. **Chiều `sigpf` được MIỄN ràng buộc 3.** Lần bắn không biết khách vẫn biết nền tảng, nên số "chưa định danh" ở chiều đó khác bốn chiều khách là **ĐÚNG**. Đừng "sửa cho nó cân".

## Bẫy đã trả giá, đừng lặp lại

- **`tsc` KHÔNG bắt được** `{ ...c, fieldSai: ... }` — spread làm excess-property check bị bỏ qua. Chỉ **grep** mới tìm ra.
- `const` không hoist: `export const seed` phải nằm **dưới** `dims` và `cfgDefault`.
- Một khai báo sai là **MỘT lỗi cấu hình**, không phải N lỗi dữ liệu — kiểm ở vòng ngoài.
- Suite xanh **không** chứng minh "số không đổi" khi kỳ vọng test cũng bị sửa cùng đợt.
- **MỚI (S1) — bẻ code cho vừa test, dạng soi gương của bẫy trên.** Test `"mọi chiều khai trong dims đều dựng được cách đếm — thiếu là biểu đồ rỗng im lặng"` đỏ khi thêm `dims.sigpf`. Vòng đầu worker gỡ bằng cách trả builder **luôn rỗng** → test xanh trong khi tạo ra đúng cái nó canh. Cách đúng đã áp dụng: `rowBuilder` trả `undefined`, test **thu hẹp phạm vi theo `base`** (không hardcode id), và **chứng minh bằng thực nghiệm** rằng xoá một nhánh chiều khách vẫn làm test đỏ.
- **MỚI (S2) — vòng import làm bảng nhãn thành `undefined`, không ai báo lỗi.** `quantify.ts:15` import `CAT_CYCLE` từ `themeSegments.ts`, `themeSegments.ts:4` import `PF_LABEL` từ `quantify.ts` ⇒ vòng. `const EV_LABEL = { pf: PF_LABEL }` đọc bảng **lúc khai**; `const` không hoist, nên khi `quantify.ts` được nạp trước thì `PF_LABEL` chưa khởi tạo → `EV_LABEL.pf === undefined` → `?? raw` → nhãn rơi về `'android'`/`'ios'`. **Cùng data, cùng hàm, chỉ khác thứ tự import mà kết quả khác nhau** (đã đo bằng hai file probe). Cách đúng: bọc hàm, deref lúc GỌI — `{ pf: () => PF_LABEL }`.
  - **Vì sao suite xanh mà lỗi vẫn còn:** `themeSegments.test.ts` import theo thứ tự "may mắn" (themeSegments trước), nên chạy đúng và không đỏ. Sửa xong mới lộ ra 3 test đang ghim chữ thường. Test canh mới `themeSegments.pfLabel.test.ts` **cố ý** đặt `quantify.ts` trước — thứ tự import LÀ nội dung của test, đừng sort lại. Đã chứng minh thực nghiệm: hoàn nguyên bản sửa thì test đỏ, sửa lại thì xanh.
- **MỚI (S2) — hai bên cùng ghi một file.** Worker chạy background vẫn đang sửa `themeSegments.test.ts`/`ThemeStackBlock.test.tsx` trong lúc tôi đang sửa `themeSegments.ts`; nội dung file đổi giữa hai lần đọc cách nhau vài phút. Phải **dừng worker** trước khi tự sửa cùng vùng, và đọc lại file sau khi dừng để biết trạng thái thật.
- **MỚI (S1) — cổng kiểm bỏ qua đúng ca nguy hiểm nhất.** Luật "tổng phải khớp `vol`" ban đầu `continue` khi không có dòng nào để cộng ⇒ điểm đo `vol > 0` mà quên khai `values` thì chart rỗng, cổng vẫn xanh. Đã đóng, và phân biệt: **cả bảng rỗng = Demo Mode TẮT = hợp lệ**; riêng một điểm đo vắng mặt = lỗi.

## Còn hở — phải nói với owner, đừng lặng lẽ mang đi

**`Signal.values` hiện phần lớn là SUY DIỄN, không phải số đo.** Chỉ `sg4` có căn cứ trực tiếp từ `desc` (blur/glare/crop/expired). Chín điểm đo còn lại do worker suy từ tên/mô tả. Đây chính là **lỗ hổng A ở §2** của tài liệu — phải xin team data. Khi có danh sách thật, **phần lớn cột của chart sẽ đổi**.

Tỉ lệ `custKey` null trong demo cũng là số đặt tay, không phải số đo: `sg1`/`sg2` = 0.92 (trước mọi bước định danh) giảm dần tới `sg10` = 0.05. Riêng `sg4` neo đúng **0.31** để khớp ví dụ "31% chưa gắn được với khách" trong tài liệu §1.

**Lỗ hổng thứ ba (MỚI, đợt 2) — không có gì nói điểm đo gắn ở đâu trên web/app.** Owner yêu cầu hiện thông tin này. Đã đọc hết: `Signal` chỉ có `{id, tpId, name, st, pf, es, vol, seen, metrics, desc, values}`, `Touchpoint` chỉ có `{id, stepId, name, channel, owner, users, desc}`, `Step.stationId` là `JS-MTK-01..06`. **Không có** tên screen kỹ thuật, route/deeplink, id/selector element, tên view controller. Gần nhất là `Touchpoint.name` — tên màn do người viết, không phải định danh kỹ thuật. **Đã chốt: xin qua Bảng D**, tuyệt đối không bịa field vào fixture (đó đúng là cách lỗ hổng A phát sinh). Đặc tả Bảng D nằm ở cuối `output/thiet-ke-chart-signal-bo-sung-dot-2.html`.

## Quyết định đợt 2 — owner chốt 04/08/2026

Nguyên văn: *"cột nhóm theo điểm đo, note lại phần gắn với element trên hệ thống web/app làm thành bảng D cũng được, 3 ok r"*. Chi tiết + bằng chứng đo: `output/thiet-ke-chart-signal-bo-sung-dot-2.html`.

1. **Chọn được NHIỀU điểm đo; cột nhóm theo điểm đo.** Mỗi điểm đo = một nhóm cột, trong nhóm mỗi giá trị của chính nó = một cột. Chọn một điểm đo thì hình y như bản duyệt. Khoá cột là cặp `(sig, val)` — `SigCount` đã có sẵn, **không cần đổi schema**.
   - **CẤM gộp cột theo tên giá trị bắc qua nhiều điểm đo.** Đã đo: `success` và `fail` cùng xuất hiện ở **ba** điểm đo (`sg3` chụp giấy tờ, `sg5` liveness, `sg8` ký hợp đồng). Gộp là cộng ba phép đo khác nhau vào một cột — vi phạm bất biến 2 ("một chiều = một tập giá trị loại trừ nhau"), và từ hình không tách lại được.
   - Chart **không** in tỷ lệ bắc qua hai điểm đo (kiểu "410/920 = 45% chụp lỗi"). `domain/` không bịa tỷ lệ. Hai nhóm cột đứng cạnh nhau để **so**, không để **chia**.
2. **Không có dòng tổng chung.** Ràng buộc 1 và tiêu chí §9 ("cộng chiều cao các cột = con số tổng") là **theo từng điểm đo**. Mỗi nhóm cột có chân đế riêng: tổng lượt + tỷ lệ chưa gắn được khách của chính nó. Đã đo mức lệch: `sg4` = 125/410 = **30,5%**, `sg1` = 565/614 = **92%** — trộn hai cái này thành một tỷ lệ là số bịa.
3. **Điểm đo một giá trị** (`sg1` = `tapped`, `sg10` = `activated`) vẽ **một cột**, kèm câu "chỉ bắn một giá trị — cột chính là toàn bộ lượt bắn". Không tự động làm gì khác; ai muốn ngữ cảnh thì chọn thêm điểm đo.
4. **Panel "gắn ở đâu"** hiện đúng những gì đang có (điểm tiếp xúc + kênh + tên event + client/server + nền tảng + mã trạm) và **nói rõ đó là mô tả nghiệp vụ, chưa phải vị trí kỹ thuật**. Phần thật đi vào Bảng D.
5. **Dải nối dày mỏng + vạch đỏ lấy trực tiếp từ dữ liệu, không cần luật quy đổi.** Đã đo trên cả 6 bước: `completed + failed = entered` khớp, và `completed[n] = entered[n+1]` khớp. Nếu dữ liệu thật sau này **không** khớp thì phải khai luật đối chiếu tường minh, không được lặng lẽ vẽ theo số nào tiện hơn.

## Quyết định đợt 2b — owner chốt 05/08/2026

Nguyên văn: *"note lại là cách nhận dữ liệu có thể là raw chứ ko nhận đã xử lý và query sẵn, ko cần quan tâm đến từng cột quá nhiều, nếu có thì hiển thị ra các thông báo cụ thể được gán vào giá trị của cột đó, nếu ko có thì bảo ko"*

1. **Nhận raw là khả năng để mở — bên dữ liệu giao raw, mình tự query.** Chú thích `demo.ts:619-621` ("hệ thống chạy thật nhận thẳng NĂM BẢNG ĐẾM đã cộng sẵn… không đưa từng lần bắn qua mạng") là **giả định của người làm S1, KHÔNG phải điều owner chốt** — nay đã bỏ. **Phải sửa chú thích đó trong S3a**, không thì session sau đọc nó như luật rồi tự khoá lại.
2. **Không dựng hợp đồng cột chi li trong bản yêu cầu dữ liệu.** Xin đúng thứ cần; nhận raw thì chọn cột nào / cắt thế nào là việc của mình. Không mở rộng Bảng A/B/C/D thành đặc tả từng cột.
3. **Luật "cột có / cột không" — áp cho MỌI cột, không riêng năm chiều.** Cột *có*: hiện các thông báo cụ thể gán vào giá trị của chính cột đó, bằng tiếng người. Cột *không có*: **nói thẳng là không có** — không giấu, không "N/A", không để trống. Đây là ba trạng thái nút chiều (§1 thiết kế) nói rộng ra, nên trạng thái phải tính **từ dữ liệu** cho mọi cột, không hardcode theo tên chiều đã biết.

**Hệ quả với tiêu chí nghiệm thu #7 (MỚI phát hiện 05/08).** "Đổi ranh giới NAV trong cấu hình → lát chia lại ngay" **đúng ở mức hàm, SAI ở mức app đang chạy**: `demo.ts:691` cộng `sigCounts` một lần lúc nạp module theo `cfgDefault`; `mock-repository.ts:102` `getSnapshot()` chỉ chạy lại `projectCustomerBands` rồi trả `sigCounts` nguyên. `demoFires` và type `Fire` là module-local, `CxmData` không có trường `fires`. Sai **im lặng**: ba ràng buộc nhóm 22 vẫn đúng (đổi nhãn dải không đổi con số) nên validate không kêu một tiếng → hai chart cạnh nhau hiểu "<50tr" theo hai ranh giới khác nhau. Phép tính thì đúng — có test tại `projectSignalCounts.test.ts:102`, chỉ thiếu người gọi lại lúc chạy. **Đóng trong S3a**: đặt phép cộng + phép cắt nhóm ở tầng của mình, cộng lại khi ranh giới đổi (nhận raw thì cộng thẳng từ raw; nhận bảng cộng sẵn thì hỏi lại bên dữ liệu với ranh giới làm tham số — cùng một hình dạng).

**Đã tự chốt, dữ liệu trả lời sẵn nên không hỏi owner.** (a) Cột "giá trị chưa khai" phủ **bằng test**, không nhét giá trị lạ vào demo: `validate.ts:680` đã cấm giá trị ngoài `Signal.values`, nhét vào thì cách duy nhất để demo qua kiểm là **nới luật cho vừa dữ liệu** — đúng bẫy đã trả giá hai lần; thêm nữa sẽ dịch thứ tự rút `rawRng` và mất mốc đối chiếu 588 dòng. Tiêu chí #11 viết dạng giả định ("cho pipeline bắn ra…"), không đòi demo phải đang ở trạng thái đó. (b) Điểm đo `st:'gap'`/`designed` (viết lúc đó là `sg6`, `sg9`; **`sg6` nay đã bỏ** — xem vòng layout thứ ba — nên ca này còn `sg9`, `sg-nap-4`, `sg-rut-5`, `sg-dvo-4`, `sg-tra-4`; đều `vol:0`, `values:[]`) khi **chọn nhiều**: ra **một dòng ghi chú** nêu tên + "chưa instrument"; **không** sinh nhóm cột rỗng (đọc thành "đo rồi, bằng 0") và **không** biến mất im lặng (người chọn tưởng bấm trượt).

**Ba hành vi có code + test nhưng KHÔNG bấm ra xem được trong demo** — nói trước với owner, đừng để lúc review đọc thành việc còn dở: cột "giá trị chưa khai" (đã đếm cả 588 dòng, **không dòng nào** mang giá trị lạ); và **cả hai** trạng thái nút chiều "ghi được một phần" + "khoá kèm lý do" (trong demo cả năm chiều đều ghi đủ ⇒ mọi nút ở trạng thái 1).

**LUẬT NÚT CHIỀU — đã sửa một suy luận sai, đừng lặp lại.** Bản đầu tôi định nghĩa con số trên nút = số khách thiếu dữ kiện (`thiếu`/`chưa-biết`). **SAI, và sai đúng loại nguy hiểm nhất**: làm thế là **gộp hai trong năm nghĩa của "không biết" thành một con số**. Nút chiều trả lời câu *"NGUỒN này có ghi chiều đó hay không"* (ví dụ trong thiết kế §1: "chart gộp nhiều nguồn thì survey có nền tảng còn ghi chú broker thì không") — tính chất của **nguồn**. Khách tồn tại + nối được + ô dữ kiện trống là **chất lượng dữ liệu của khách đó**: `thiếu`/`chưa-biết` là **nhãn dải THẬT**, phải hiện thành lát riêng có tên riêng, không được cuộn vào con số trên nút. Ba đường tách hẳn: `chưa định danh` → **dòng chân nhóm**; `thiếu`/`chưa-biết` → **lát bình thường trong cột**; "nguồn không ghi chiều" → **con số trên nút**.

**Luật tính ba trạng thái = ĐỘ PHỦ, không cần sentinel mới.** Đã soát: hôm nay dữ liệu không có cách nào nói "nguồn không ghi chiều này" — `sigpf` đọc thẳng `fire.pf` (`projectSignalCounts.ts:104-106`, chú thích "LUÔN có band thật") nên không có sentinel; bốn chiều khách thì vắng khách đã là `chưa định danh`. Nên dùng chính ràng buộc 1 làm định nghĩa: Σ`n` của một chiều **=** `Signal.vol` ⇒ ghi đủ · **= 0** ⇒ không ghi gì, khoá · **nằm giữa** ⇒ ghi được một phần, hiện tỷ lệ trên nút. Nút tự sáng lên khi bên dữ liệu bắt đầu ghi, không ai phải sửa code. **Kèm theo:** validate coi Σ ≠ `vol` là lỗi pipeline (ràng buộc 1), nên trong fixture đã qua kiểm trạng thái "ghi được một phần" KHÔNG THỂ xảy ra — nó chỉ xuất hiện với dữ liệu thật chưa qua kiểm, đúng lúc cần cảnh báo nhất. **KHÔNG nới ràng buộc 1** để trạng thái đó bấm được trong demo.

## S3a-1 — ĐÃ XONG, đã tự kiểm, commit `607b1fd`

Đóng chỗ hở tiêu chí #7. `MockRepository` nhận thêm tham số optional `recount(cust, dims) => SigCount[]`, chạy ở đúng hai chỗ phép chiếu xảy ra (`getSnapshot`, `projectedValidationSnapshot`); `demo.ts` export `recountDemoSignals` đóng kín trên `demoFires` module-local; `store.ts` truyền nó vào singleton. `Fire`/`demoFires` vẫn không export, `CxmData` không thêm trường, `projectSignalCounts` không sửa, `domain/` không chạm. Optional + mặc định `undefined` nên hàng chục `new MockRepository()` trong test giữ nguyên hành vi.

Tự kiểm **ngoài** test của worker (worker chỉ kiểm nav đổi + tổng khớp + seed rỗng): 588 dòng đúng mốc · validate sạch trước VÀ sau khi nhận cfg mới · `>5tỷ` mất, thêm đúng một dải · **bốn chiều còn lại y nguyên từng nhãn** · **số `chưa định danh` y nguyên từng ô** (ràng buộc 3) · Σ mỗi chiều = `Signal.vol` trên cả hai snapshot. tsc sạch, **754/754 test xanh / 74 file**.

**Nhãn thô trong `sigCounts`:** band của `sigpf` là `android|ios|web|server` — chữ thô. Phải làm đẹp ở tầng hiển thị **và có test canh**, đúng loại lỗi đã gây sự cố S2.

Bản chia việc S3 đầy đủ (S3a phép tính → S3b dải hành trình → S3c màn): `output/ke-hoach-s3-chart-diem-do.html`.

## S3a-2 — ĐÃ XONG, đã tự kiểm, commit `3f00a99`

`domain/signalChart.ts` — phép chiếu năm bảng đếm thành hình chart cần vẽ (nhóm theo điểm đo, cột theo giá trị, lát theo chiều), kèm `dimStates` tính từ độ phủ và `notes` cho điểm đo `vol===0`. Không import `store/`, không đọc `cfg`, không qua `rowBuilder`/`qRun`. 18 test.

**Một lỗi thật của worker, tôi đã sửa:** hàm **không canh `dimId`**. Truyền một chiều đã rút (`tenure`) thì lọc ra rỗng → mọi nhóm hiện tổng 0 trong khi `Signal.vol` là 410 — đúng cái "đọc thành đã đo, ra 0" mà rule 2 chặn ở điểm đo `vol===0`, chỉ vào bằng cửa khác và **không có gì đỏ**. Đã thêm guard ném lỗi + 3 test (gồm test chống-rỗng: năm chiều thật KHÔNG được ném).

**Bẫy trích dẫn — tôi đã tự trượt một lần.** Thiết kế chart này nằm ở **hai** tài liệu: hình nhóm cột (Đ1 cách B), chân đế riêng từng nhóm (Đ2), điểm đo một giá trị (Đ3) và bảng D nằm ở `output/thiet-ke-chart-signal-bo-sung-dot-2.html`; ba trạng thái nút chiều (§1), ba ràng buộc (§3), giá trị chưa khai (§7), nghiệm thu 11 tiêu chí (§9) nằm ở `output/thiet-ke-chart-signal.html`. Chú thích đầu `signalChart.ts` từng trích "§2/§8" cho hình cột và chân nhóm — **sai chỗ** (§2 là "hai chỗ hôm nay chưa có", §8 là "hai câu đã thành vô nghĩa"). Đã sửa. Trích sai còn tệ hơn không trích.

## S3b — ĐÃ XONG, đã tự kiểm, commit `9ad1a14`

`design-system/JourneySpine.tsx` — xương sống bước với dải nối **dày mỏng theo số thật** và vạch đỏ chỗ rơi. Kiểu prop khai **cục bộ trong file** (design-system không được import `domain/`). 13 test, trong đó có **một test đối chiếu dữ liệu**: `entered − entered(bước sau) === failed` và `entered === completed + failed` đúng ở cả sáu bước — nếu dữ liệu tương lai lệch, độ dày dải thành số bịa và test này đỏ trước khi ai kịp tin vào hình.

**Một lỗi hợp đồng của CHÍNH TÔI:** tôi khai `SpineStep.state` là `good|watch|crit`, nhưng `stepState(undefined, cfg)` trả `'unknown'` — bước thiếu dòng quan sát sẽ buộc caller **bịa** một trạng thái. Đã soát: cả sáu bước fixture có đúng một dòng quan sát nên ca đó chưa xảy ra. Chọn **giữ kiểu hẹp** và bắt S3c-1 loại bước thiếu quan sát ra khỏi dải + test canh điều kiện, thay vì dựng giao diện cho một trạng thái chưa tới được.

## S3c-1 — ĐÃ XONG, đã tự kiểm, commit `88a41ec`

`#/atlas` không còn là `Placeholder`. Rail phase → thẻ luồng (chip theo nhóm + legend) → thẻ chi tiết luồng (`JourneySpine`) → hồ sơ bước với **đúng một tab** "Touchpoint & signal"; hai tab còn lại không render nút. Bước thiếu quan sát bị loại khỏi dải kèm ghi chú đếm số bị loại. Luồng chưa có bước nói thẳng "đã map ở mức cấu trúc nhưng chưa vào pilot, đây là chủ ý không phải mất dữ liệu". 8 test. `App.tsx` sửa đúng 3 dòng.

**Tôi siết thêm một chỗ:** hồ sơ bước tra trong tập bước **đã có** quan sát, không tra toàn bộ bước rồi ép kiểu `as Obs` — bất biến "chỉ bước có quan sát mới mở được hồ sơ" thành **cấu trúc**, không còn đúng nhờ tình cờ.

## S3c-2a — ĐÃ XONG, đã tự kiểm, commit `869338b`

`design-system/SignalColumns.tsx` — chart cột nhóm theo điểm đo (Cách B): một điểm đo = một nhóm, trong nhóm mỗi giá trị của **chính nó** là một cột, chân đế riêng từng nhóm, không có dòng tổng chung. Kèm tầng phân loại "không biết" ở `domain/signalChart.ts` (`SigUnknown` + `unknownKindOf`). 17 test cho chart + 4 test cho domain.

**Hai lỗi hợp đồng của CHÍNH TÔI, cả hai đều do reviewer chặn lại:**

1. **Tôi khai "không biết" là một cờ boolean** ⇒ cả ba nghĩa (`chưa-biết` / `thiếu` / `chưa định danh`) ra **một màu xám** — đúng phép gộp mà cả stream tồn tại để tránh, chỉ là gộp bằng màu thay vì bằng số. `index.css:32-40` đã dựng sẵn bốn token xám cho bốn nghĩa vì lý do đó. **Đã đo: cả ba nghĩa CÙNG có mặt trong dữ liệu demo** (chiều `acq` có cột chứa đủ 8 lát), nên lỗi này sẽ hiện ngay màn đầu tiên mở lên, không phải lỗi lý thuyết. Nhận diện bằng `isSegUnknown`/`NOT_IDENTIFIED` của `data/segment.ts` (nguồn duy nhất), không so chuỗi rải rác.
2. **Tôi khai một thang chiều cao dùng chung toàn chart** ⇒ bốn cột ~100 lượt của `sg4` bị nén sát sàn khi đứng cạnh `sg2` (2840) và **cao gần bằng nhau** — mất hẳn cách đọc "giá trị nào nhiều hơn giá trị nào" **trong** một điểm đo, tức mất lý do chart tồn tại. Tiêu chí §9-3 tính tổng trong phạm vi **một** điểm đo, và sketch Đ1 vẽ hai nhóm cao xấp xỉ bằng nhau. Đã đổi sang **thang riêng từng nhóm**, đổi lại phải in một câu chống đọc nhầm ("hai nhóm không so chiều cao với nhau"). **Đo sau khi đổi: không cột nào tràn hộp, biên hẹp nhất còn 4,03 lần** (`acq`/`sg4`/`expired`: cao 96,8px, cần 24px cho 8 lát) — nếu sau này thêm dải hoặc thêm chiều nhiều nhóm hơn, đo lại con số này trước khi tin.

Bảng màu chỉ có 5 màu (`--cat-1..5`). Hôm nay chưa chiều nào quá 5 dải có tên (nav 5, acq 5, age 4, sigpf 4) nên chưa với tới, nhưng **thêm một mốc NAV là trùng màu trong im lặng** — nên chart in note cảnh báo nêu đúng số nhóm bị trùng, kèm test chống rỗng ở đúng ngưỡng 5.

## S3c-2b — ĐÃ XONG, đã tự kiểm, commit `17b84ec`

`features/atlas/AtlasSignalPanel.tsx` — nhà thật của chart: bảng signal thêm cột chọn (giữ nguyên sáu cột và testid cũ nên test S3c-1 không phải sửa), chart cột nhóm, **năm nút chiều ba trạng thái tính từ dữ liệu**, panel Đ4 "gắn ở đâu". Mở ra là đã có chart của điểm đo sống đầu tiên; đổi bước thì lựa chọn reset (`key={step.id}`). Điểm đo `gap`/`designed` vẫn tick được và nói đúng lý do chưa có số, không vẽ chart rỗng giả vờ là 0. 13 test.

**Một lỗi hợp đồng của tôi, worker báo lại thay vì im lặng sửa:** tôi ghi mã trạm là `Step.code`, nhưng `code` của bước 2 chỉ là `'02'` — mã trạm thật là `Step.stationId` = `JS-MTK-02`, đúng như ví dụ đã chốt ở Đ4.

**Một lỗi thật tôi đo ra được:** tắt Demo Mode ⇒ bảng đếm rỗng ⇒ **cả năm nút chiều cùng khoá**, nhưng màn hình lại khuyên *"chọn một chiều khác ở trên"* — lời khuyên **không làm được** (mọi nút disabled) và nói **sai nguyên nhân** (không phải "chiều này không ghi" mà là "chưa có bảng đếm cho điểm đo này"). Đã tách hai ca; ca "cả năm khoá" được test bằng `seed.sigCounts` thật, không fixture dựng tay.

## Đã xem bằng mắt trên màn đã mount — 05/08, cuối phiên

Chạy dev server, mở `#/atlas`, bấm bước 02, tick hai điểm đo, đổi chiều. **Không phải chỉ đọc test.** Bốn thứ chứng được bằng mắt:

1. **Thang riêng từng nhóm là quyết định đúng.** Bốn cột của `ekyc_document_fail_reason` (95 · 120 · 112 · 83) đọc rõ khác nhau khi đứng cạnh nhóm 920 lượt. Dưới thang chung, cả bốn sẽ cao khoảng một phần tư và gần bằng nhau.
2. **Tiêu chí §9-2 và §9-4 đúng ngay trên màn:** đổi chiều thì các cột giữ **đúng** con số cũ (438/482/95/120/112/83), chỉ lát bên trong đổi.
3. **Đổi sang chiều Nền tảng thì dải "chưa định danh" biến mất hẳn** — đúng thiết kế và đúng bất biến 8 (lần bắn không biết khách vẫn biết nền tảng), không phải mất dữ liệu.
4. **Nhãn nền tảng hiện `iOS`/`Android` thật trên màn**, không phải chữ thô — tức lần này không lặp lại bẫy "trông như đã sửa mà không chạy" của S2.

Hai điều mắt thấy, chưa sửa, để owner quyết:

- **Thứ tự dải trong cột và trong chú giải xếp theo số lượng giảm dần, không theo thứ tự tự nhiên của nhóm.** Với chiều NAV nó ra `<50tr · 200tr-1tỷ · 50-200tr · >5tỷ · 1-5tỷ` — nhảy bậc, trong khi sketch §1 của thiết kế vẽ tăng dần (`<50tr · 50–200tr · 200tr–1tỷ`). Đổi được, nhưng **không phải sửa một dòng**: tầng trình bày chỉ nhận nhãn chữ, muốn xếp theo bậc thì phải dẫn thứ tự bậc từ cấu hình xuống. Cái giá của việc đổi: mất tính chất "lát lớn nhất luôn ở trên", nên hai cột cạnh nhau sẽ khó so bằng mắt hơn. Chiều `tier`/`acq`/`sigpf` không có bậc tự nhiên nên chỉ NAV và Độ tuổi bị ảnh hưởng.
- **Dải "chưa định danh" vẽ vân rất nhạt** (khe trắng trên xám), nên một cột mà phần lớn là "chưa gắn được khách" trông gần như **rỗng** — đúng ký hiệu `░` của thiết kế và vẫn phân biệt được với hai loại xám đặc, nhưng với `sg1` (92% chưa định danh) thì hiệu ứng "cột trống" khá mạnh. Cần mắt owner phán, không phải lỗi.

## Pilot mở rộng (đợt 3) — owner chốt 05/08/2026, ĐÃ XONG, tự kiểm, CHƯA commit

Owner: *"trước khi có bản giá trị thật thì cứ làm demo đi, đã xác định được các điểm chạm r thì mình sẽ là người đề xuất đo những gì, hiện sẽ pilot tất cả của mở tk và nạp rút, chuyển tiền"*

**Đọc kỹ câu này vì nó đổi một khung nhận thức, không chỉ mở rộng phạm vi:** trước đây `Signal.values` bị coi là **lỗ hổng A** — thứ phải chờ bên dữ liệu trả lời. Owner chốt ngược lại: **bên nghiệp vụ là bên đề xuất đo gì.** Nên `Signal.values` từ đây là **đề xuất của mình**, không phải chỗ trống chờ lấp. Lỗ hổng A **đóng lại bằng quyết định**, không phải bằng dữ liệu. Bản yêu cầu dữ liệu đổi theo: không hỏi "có giá trị nào", mà gửi đề xuất kèm cột để bên dữ liệu ghi *đã có / tên khác / phải ghi mới*.

Phạm vi mở từ 1 luồng lên **6 luồng · 30 bước · 20 điểm đo đề xuất**: mở TK thường (cũ) + mở TK phái sinh, nạp tiền, tra soát nạp, rút tiền, chuyển nội bộ.

**Ba quyết định mô hình, mỗi cái đều có tiền lệ hoặc lý do ghi tại chỗ trong `seed.ts`:**

1. **4 kênh nạp KHÔNG tách thành 4 luồng** — theo đúng tiền lệ owner tự ghi ở `f-open-2026` ("AJ 2 là 4 phương thức xác thực dùng bên trong. Cố ý KHÔNG tách"). Các bước là đường tiền chung, kênh trở thành **giá trị** của `deposit_credit_received`. Giữ được danh mục luồng 1:1 với sơ đồ gốc, và giữ spine là một chuỗi thật.
2. **6 trạng thái tra soát → 4 bước.** "Chờ bên thứ ba" là **giá trị trạng thái nằm trong** bước xử lý, không phải bước riêng; Hoàn tất/Từ chối là `completed`/`failed` của bước cuối.
3. **8 cổng rút → 7 bước** (gộp video-signature + hợp đồng, gộp giờ + blackout). Bảy giá trị của `withdraw_gate_block_reason` giữ đủ lý do của cả 8 cổng (giờ và blackout tách lại thành hai lý do riêng), nên không mất thông tin nào.

**Ba file "ngoài chart" phải sửa theo, đừng đọc thành sửa lạc đề** — mở từ 1 lên 6 flow quan sát thì ba chỗ đang đếm trên giả định "chỉ có 1 flow pilot" hoá sai:

| File | Vì sao |
|---|---|
| `features/atlas/AtlasPage.tsx` | Chỉ sửa **chú thích**. `defaultFlow = flows.find(f => f.observed)` giữ nguyên, nhưng câu "flow pilot **duy nhất**" không còn đúng khi có 6 flow `observed`. Thứ tự mảng vẫn đưa `f-open-2026` lên trước nên **màn mặc định không đổi** — chỉ là chú thích không được nói dối người đọc sau. |
| `features/overview/blocks/JourneyStateBlock.test.tsx` | Đếm thật đổi: bước `crit` 1 → **2** (thêm `s-dvo-1`, 190/1240 = 15,3%), `watch` 2 → **11**, `ok` 3 → **17**, tổng 6 → **30**. "Flow chưa đo" 31 → **26**. `worst` vẫn là `s3` (2.650) — không bước mới nào vượt (cao nhất 275). |
| `features/overview/blocks/CoverageBlock.test.tsx` | Thêm 4 bước dưới ngưỡng `covMin=70`: `s-tra-1`=63, `s-tra-3`=59, `s-rut-3`=61, `s-rut-4`=57. **Sáu giá trị cov dưới ngưỡng đặt KHÁC NHAU hẳn nhau** (57·58·59·61·63·64) là **cố ý**: test dùng `getByText("64%")`, trùng số là nhiều kết quả và test đỏ vì lý do không liên quan gì đến lỗi thật. |

**Ràng buộc đã đo, không suy diễn:** `validate.ts` check 7 buộc **mọi** signal thuộc nhóm `g-in`/`g-out` phải `es:'server'`. Hệ quả thật: **vòng này không đề xuất được điểm đo nào nằm trên màn tiền của khách.** Muốn đo hành vi client trên luồng tiền thì phải nới check 7 — **quyết định của owner**, đừng tự nới.

### Hai lỗi chỉ lộ ra khi xem màn — đã sửa

Test 827/827 xanh vẫn **không** thấy hai lỗi này. Ghi lại vì cả hai là bài học về loại lỗi mà test không bắt được:

1. **Chart tự nói ngược spine.** Bộ sinh demo chia đều mọi giá trị, nên `withdraw_gate_result` 8 giá trị ra `pass` ≈ 12,9% — tức "87% lệnh rút bị chặn" — trong khi spine ngay phía trên nói 2.351/3.180 = 74% rút xong. **Cùng một dân số, hai con số chửi nhau trên cùng một màn.** Sửa bằng `SIG_WEIGHT` trong `demo.ts`: khai trọng số theo đúng `obs`, `pass` = 2.364 = `s-rut-7.entered`, sáu lý do chặn = `failed` của sáu bước cổng. Sau khi sửa: chart 74,7% vs spine 73,9% — cùng một phép tính, không còn là hai lần bịa độc lập. Quy tắc khai ghi ngay trong docblock: **chỉ** khai khi có (a) số `obs` ràng buộc hoặc (b) một câu trong `note` nói thứ tự lớn nhỏ; không có thì để chia đều và **hiểu rằng đọc phân bố cột đó là đọc sai**.
2. **Nhãn 8 cột đè nhau thành vệt không đọc được.** Cột cố định `w-[46px]`, mà CSS **không** coi dấu `_` là chỗ ngắt dòng, nên `insufficient_withdrawable` tràn ra hai bên. Đã thêm test 8 nhãn dài — ca mà cả bộ S3 chưa từng chạy (trước chỉ có ≤6 nhãn ngắn kiểu `step_01`).

### Vòng sửa layout thứ hai — owner xem màn rồi chỉ ra, 05/08

Bản `break-all` ở trên **chữa được chỗ tràn nhưng gây ra lỗi nặng hơn**, và owner phát hiện trước khi nó kịp đi xa: *"do tên dài ngắn khác nhau nên điểm bắt đầu của bar đang ở các vị trí lệch"*.

**Nguyên nhân:** `Group` canh các cột bằng `items-end`, mỗi cột là một flex dọc `[badge] → bar → nhãn → số`. Nên đáy bar = đáy cột − chiều cao số − **chiều cao nhãn**. Trước khi có `break-all`, mọi nhãn đều tràn trên MỘT dòng nên các bar tình cờ cùng đáy; sau khi ngắt dòng, nhãn 1–4 dòng đẩy bar lên mỗi cột một mức. **Bar chart mất đường đáy chung thì không so được chiều cao nữa** — đúng thứ nó tồn tại để làm. Bài học: sửa một lỗi trình bày mà không kiểm lại hình học của cả khối là cách tạo ra lỗi nặng hơn lỗi cũ.

**Ba thứ đã sửa, đều đo được trên màn (không đo bằng test — jsdom không có layout):**

1. **CSS Grid + `subgrid` thay cho flex.** Bốn hàng (badge · bar · nhãn · số) do grid của NHÓM định chiều cao, nên mọi cột dùng chung chiều cao hàng. Cột vẫn là **một** element nhờ `grid-rows-[subgrid]` + `row-span-4`, nên **DOM không đổi và 18 test của `SignalColumns` xanh nguyên**. Hàng bar cố định đúng `MAX_H` = vùng vẽ, thay `minHeight` cũ. Đo được: 7 bar cùng đáy `y=475`, 7 nhãn cùng mốc `y=479`. **Ô badge phải LUÔN vẽ dù rỗng** — subgrid xếp con theo thứ tự, thiếu một ô là bar rơi lên hàng badge và lệch lại.
2. **Nới ngang + ngắt nhãn theo từ** (owner cho phép): cột `46px → 92px`, bar `30px → 44px`, và thay `break-all` bằng `<wbr>` sau mỗi dấu `_`. Nhãn xuống dòng thành `insufficient_` / `withdrawable` chứ không cắt giữa từ. `<wbr>` không thêm ký tự nào vào `textContent` nên tên đầy đủ còn nguyên. Nhóm 7 cột rộng 716px, khung 1241px → **không phải kéo ngang**.
3. **Điểm đo không gộp "thành công" với "lý do"** — xem mục dưới.

### Quy tắc điểm đo owner chốt 05/08 — không gộp thành công với lý do

Khai đúng trọng số vẫn chưa đủ. Đo trên màn: một giá trị áp đảo nén mọi lý do thất bại xuống **1–4px**, mắt không phân biệt được 271 với 232 với 14.

| Điểm đo | Bar nhỏ nhất trước | Đọc được? |
|---|---|---|
| `withdraw_payout_result` (2.351/13) | 0,8px | không |
| `deposit_reconcile_result` (9.510/104/26) | 0,4px | không |
| `withdraw_gate_result` (8 giá trị) | 1px | không |
| `internal_transfer_reject_reason` (42/136/41) | 43px | **tốt** |

Chỗ đọc tốt duy nhất là điểm đo **chỉ chứa lý do**. Nên quy tắc: **điểm đo có giá trị áp đảo VÀ từ 3 giá trị trở lên thì bỏ giá trị thành công, chỉ giữ các lý do**; tỉ lệ thành/không đọc ở spine ngay phía trên nên không mất thông tin. Áp cho đúng 5 điểm đo, và `vol` đổi thành **đúng số `failed`** của bước tương ứng — nhờ vậy chart càng khớp spine chặt hơn:

| Cũ | Mới | `vol` |
|---|---|---|
| `deriv_open_eligibility_result` | `deriv_open_ineligible_reason` | 190 |
| `deriv_contract_otp_result` | `deriv_contract_otp_fail_reason` | 238 |
| `deposit_reconcile_result` | `deposit_reconcile_fail_reason` | 130 |
| `withdraw_gate_result` | `withdraw_gate_block_reason` | 816 |
| `withdraw_vneid_result` | `withdraw_vneid_fail_reason` | 236 |

**Loại chỉ 2 giá trị CỐ Ý giữ nguyên** (`sg-dvo-3` 903/39 · `sg-rut-4` 2.351/13 · `sg-nap-3`): chỉ hai cột thì hai con số đọc thẳng được, mà tách ra sẽ thành điểm đo một giá trị — vô nghĩa. Sau khi sửa, `withdraw_gate_block_reason` ra `140·32·125·38·35·59·10 px` (trước `140·16·4·14·3·3·6·1`).

**`sg3`/`sg5`/`sg8` — vòng này để lại, vòng sau ĐÃ VÁ.** Lúc viết mục này ba điểm đo đó vẫn `['success','fail']` chia đều = 50% thất bại trong khi `s2` obs chỉ 10,5%, và tôi hoãn lại vì sợ dịch `sigCounts` của sg1..sg10. **Nỗi sợ đó sai, đã kiểm bằng nguồn:** `pickWeighted` rút **đúng một** lần `rng()` bất kể trọng số, nên khai thêm trọng số không dịch dòng rút của điểm đo nào khác. Đã vá ở vòng layout thứ ba (mục ngay dưới) — `sg3 {510/410}`, `sg5 {983/197}`, `sg8 {404/26}`, tất cả neo vào `obs`.

### Vòng layout thứ ba — chart xoay ngang, 05/08

Owner: *"đổi dạng chart signal thành chart ngang hết để dễ nhìn hơn"*. Đây là **lời giải thật** cho bài toán nhãn dài, còn hai vòng trước chỉ là vá: bar dọc bắt nhãn nằm ngang dưới một cột hẹp, nên tên `insufficient_withdrawable` kiểu gì cũng phải ngắt dòng hoặc tràn. Bar ngang cho nhãn cả một dòng đầy — hết bài toán, không phải cân đối gì nữa.

- `MAX_H = 140` (chiều cao vùng vẽ) → `MAX_W = 320` (chiều dài vùng vẽ). `SLICE_MIN_PX = 3` giữ nguyên.
- `BarColumn` → `BarRow`, mỗi giá trị là **một hàng ba ô**: nhãn canh phải · vạch · số. Vẫn dùng `subgrid` như vòng trước nhưng đổi trục — `grid-cols-[subgrid]` + `col-span-3` thay cho `grid-rows-[subgrid]` + `row-span-4`. Wrapper vẫn là **một** element nên DOM và `data-testid` không đổi.
- Cột nhãn để `auto`, nên **mọi vạch trong nhóm bắt đầu ở cùng một mốc** — đúng thứ owner chỉ ra ở vòng hai — và mốc đó tự giãn theo nhãn dài nhất, không phải chỉnh tay.
- `<wbr>` sau mỗi `_` giữ nguyên: nhãn dài quá vẫn ngắt theo từ chứ không cắt giữa từ.
- Câu chú thích thang đo sửa theo: *"Chiều **dài** vạch đọc trong từng nhóm — hai nhóm không so chiều dài với nhau."*
- Test: ba khẳng định đổi từ chiều cao sang chiều dài (`320px`, `160px`, sàn lát `3px`), thêm một test nhãn dài (đếm số `<wbr>` = số `_`, và `textContent` phải bằng tên đầy đủ).

### Bỏ `ekyc_face_device_context`, thêm `ekyc_face_liveness_fail_reason` — owner chốt 05/08

Nguyên văn: *"bước liveness & face match phần ekyc_face_liveness_result đang chỉ show mỗi success và fail, cái tôi cần là tỉ lệ suceess/fail và tỷ lệ các lý do fail. ngoài ra … giờ đã show user các thông tin được tách theo các chiều sẵn bao gồm cả nền tảng nên ko cần ekyc_face_device_context nữa"*.

- **Bỏ `sg6`.** Nó sinh ra để hỏi "trượt liveness thì nghiêng về thiết bị nào" — mà chiều **Nền tảng** nay cắt sẵn cho **mọi** điểm đo, nên câu hỏi đã có người trả lời. Giữ lại là đo trùng.
- **Thêm `sg11 ekyc_face_liveness_fail_reason`** vào đúng chỗ `sg6` vừa rời: `tpId:'tp3'`, `st:'validating'`, `pf:['ios','android']`, `es:'client'`, `vol:197`, 5 giá trị `face_not_matched · poor_lighting · liveness_timeout · spoof_suspected · multiple_faces`. Vế "môi trường" của câu hỏi cũ sống tiếp dưới dạng `poor_lighting`.
- **Đúng theo quy tắc "không gộp thành công với lý do"** ở mục trên: tỉ lệ đạt/trượt đọc ở spine, chart chỉ vẽ lý do.
- `vol` là **197, không phải 2.650**: `sg5` chỉ bắn 1.180 lượt (không phải toàn bộ 15.840 lượt vào bước), nên số trượt tương ứng là 197 chứ không phải 2.650 của `obs`. Hai điểm đo lấy mẫu độc lập nên **màn có thể hiện 202 thay vì 197** — `desc` đã viết lại để không tự khẳng định con số khớp tuyệt đối.
- **Năm lý do là ĐỀ XUẤT của mình, không phải enum đang có.** Sơ đồ quy trình mô tả liveness như một cổng chặn duy nhất. Đã ghi rõ trong docblock `seed.ts` và trong bản yêu cầu dữ liệu.
- Hai test cũ ghim `sg6` đã **chuyển mốc chứ không xoá**: `signalChart.test.ts` trỏ sang `sg-nap-4`; `AtlasPage.test.tsx` thôi ghim `s3` mà tự tìm signal `st:'gap'` đầu tiên rồi lần ngược ra bước/flow/phase — khẳng định "signal `vol:0` vẫn phải hiện kèm trạng thái bằng chữ" giữ nguyên. `AtlasSignalPanel.test.tsx` chuyển sang cặp `tp-nap-1`/`s-nap-1`.

### Một điều phải nói với owner, đừng để tự phát hiện

Màn đang hiện `✓ Đang đo` kèm giờ "lần thấy cuối" cho **16 điểm đo, không có cái nào đang được đo thật**. `Signal.st` và `Signal.seen` là số demo — cần thiết để chạy đủ bốn trạng thái trên màn, nhưng **ai xem màn cũng đọc thành sự thật**. Đừng dùng ảnh màn hình làm căn cứ về độ phủ đo lường. Chỗ đóng lại chuyện này là cột cuối Bảng C của bản yêu cầu dữ liệu.

### Bản yêu cầu dữ liệu — `output/yeu-cau-du-lieu-pilot-mo-rong.html`

Gửi thẳng bên dữ liệu. Giữ **gọn theo đúng quyết định 2b** (không dựng hợp đồng từng cột). Nội dung: 20 điểm đo đề xuất kèm giá trị, **Bảng E mới** (số phễu từng bước — chưa bản nào xin, mà 30 bước đang chạy bằng số demo), và hai yêu cầu riêng của dòng tiền (nguồn phía server; kênh nạp là cột trong một bảng, không phải 4 nguồn rời).

**Một cảnh báo trong đó đáng đọc lại:** spine giả định `vào bước = đi tiếp + trượt`. Chỉ đúng với **cohort đã tất toán**. Cắt theo **thời điểm** thì các lượt đang treo (chờ VSDC, chờ bên thứ ba) làm `vào > đi tiếp + trượt` và bất biến chuỗi toàn cục (`JourneySpine.test.tsx:130-148`) sẽ **đỏ đúng như nó được thiết kế để đỏ** — lúc đó cần người chốt luật đối chiếu, đừng sửa test cho xanh.

## Quantify — mở chia màu cho trục bằng chứng, owner chốt 05/08 ("làm cả 3 đi")

Owner hỏi: *"check phần quantify nhiều graph đang chưa có thanh chuyển giữa các cách cắt"*. Đo được: **17 chart, đúng 2 chart** có thanh (q17 `acq`, q18 `nav`). Cổng là `QuantifyWidget.tsx` — `if (dim?.base === "cust")`, cụm chia màu nằm **trong** nhánh đó nên 15 chart kia không với tới.

**Chẩn đoán đầu của tôi SAI, owner bắt đúng.** Tôi báo là "việc lớn, phải nối bằng chứng ↔ khách". Owner phản biện: *"phần bằng chứng với khách đã phải có sẵn trên data nhận vào r chứ? mọi data đều cần ID của customer"*. Đúng — `Evidence.ck` là trường **bắt buộc**, `validate.ts` quy tắc 21 canh định dạng, và phép nối **đã có code chạy** ở `domain/themeSegments.ts`. Cái tôi dựa vào để nói "đắt" là một phép đo **đã hết hạn**.

| Phép đo | 03/08 (chú thích cũ) | 05/08 (đo lại) |
|---|---|---|
| Dòng bằng chứng | 17 | **1.641** |
| Nối được vào một khách | 7 | **1.501 (91,5%)** |
| Ẩn danh (cố ý không có ID) | — | 133 (8,1%) |
| Có ID nhưng tra không ra | — | **7 (0,4%)** |

Bảy dòng hỏng đúng là bảy dòng viết tay từ đợt đầu, không phải vấn đề hệ thống.

**Ranh giới thật không phải "khách vs không khách", mà là SỐ TRÊN THANH CÓ ĐẾM TỪ BẰNG CHỨNG KHÔNG:**

| Nhóm | Chart | Chia màu |
|---|---|---|
| `cust` — `acq`, `nav` | q17, q18 | Đã chạy từ trước |
| `ev` — `cat`, `sen`, `pf` | q3, q12, q13 | **MỞ 05/08.** Thanh đếm dòng `data.ev`, nối qua `ck` là đếm thật. |
| `agg` — `theme`, `l1`, `l2`, `l3`, `sub`, `src` | q1, q2, q4, q9, q10, q11, q14 | **KHOÁ, kèm lý do thật.** Số trên thanh là tổng hợp sẵn (`TaxNode.n`/`Source.vol`); đo được theme "Thiết bị" ghi 412 mà có 8 dòng bằng chứng, `src-ga` ghi 41.200 mà có 2 — lệch ~50 lần. Tô thanh 412 bằng 8 dòng là bịa. |

q5–q8, q15 là chart theo thời gian, chia màu không cùng dạng câu hỏi.

**Ba thứ đã làm:**

1. **`EV_ROW_KEY` — nguồn DUY NHẤT của phép "một dòng bằng chứng thuộc hàng nào".** `catRows`/`senRows`/`pfRows` và nhánh chia màu mới đều đọc bảng này. Trước đó phép suy khoá hàng nằm inline trong từng `rows()`, nên mở chia màu là phải chép ra chỗ thứ hai — đúng bẫy `custField()` đã cảnh báo. Lệch một bên thì **đoạn màu mô tả một tổng khác với chiều dài thanh, nhìn hình không thấy được**. Test đóng đúng seam đó: với mọi hàng của mọi trục ev, Σ đoạn phải bằng `v` do `qRun` trả (đường tính khác hẳn).
2. **`evSplit()` trong `domain/quantify.ts`.** Mỗi dòng bằng chứng rơi vào **đúng một** trong bốn giỏ: giá trị thật · sentinel (`Không xác định`) · `Ẩn danh` · `Chưa đối chiếu được`. Phân hoạch kín ⇒ bất biến Σ = v giữ được không cần phép cộng bù. **Ba nghĩa "không nối được" KHÔNG gộp** — 8,1% ẩn danh là đúng thiết kế, 0,4% nối hỏng là defect; gộp là mất đúng thông tin người sửa pipeline cần. Đoạn `n=0` bị bỏ nên thanh nào không có nối hỏng thì không sinh lát mỏng vô nghĩa.
3. **`buildSplitBundle()` trong `QuantifyWidget.tsx`** — cụm chia màu tách khỏi nhánh `cust`, dùng chung cho mọi trục. Trục `agg` **hiện thanh nhưng khoá**, và lý do hiện thành **chữ dưới chart** (`split-note`) chứ không chỉ tooltip: luật owner là "nói thẳng", mà tooltip phải rê chuột mới thấy. Mọi lý do **hỏi thẳng `qRunSplit`**, không viết lại ở tầng vẽ.

**Một test bị ĐẢO kỳ vọng, cố ý:** `QuantifyWidget.splitToggle.test.tsx` trước canh *"trục theme → không có strip nào"*. Nay canh ngược: strip **hiện**, mọi chip khoá, và `split-note` phải nói *"TỔNG HỢP SẴN / không đếm từ bằng chứng"*, **không được** nói *"khoá khách"*. Ý định gốc (không vẽ đoạn màu trên trục này) giữ nguyên và mạnh hơn.

**Ba chú thích hết hạn đã sửa** — cả ba đang nói dối người đọc sau bằng phép đo 7/15: `domain/quantify.ts` (docblock `qRunDrill` + docblock breakdown, chỗ còn ghi sai hẳn là *"trục agg/ev không có khoá khách trên Evidence"*), `data/schema/quantify.ts` (docblock field `split`), `design-system/QuantifyWidget.tsx` (chú thích drill trục khách).

**Sửa sau khi xem bằng mắt (05/08):** bản đầu in nguyên câu từ chối dài dưới cả 7 chart trục tổng hợp — đo trên màn là 7 khối chữ **giống hệt nhau, cao 40–60px**, tức là nhiễu, mà nhiễu thì người ta thôi đọc, hỏng đúng cái luật "nói thẳng" định đạt. Nay cắt làm hai mảnh **ghép từ một nguồn** (`AGG_SPLIT_NOTE` + `AGG_SPLIT_EVIDENCE` trong `domain/quantify.ts`): câu khẳng định hiện thành chữ dưới chart (**20px, một dòng**), phần đo được (412 vs 8 dòng) nằm trong `reason` đầy đủ ở tooltip từng chip. Ghép chứ không chép — hai bản sao chắc chắn trôi lệch.

**Đã xem trên màn, không chỉ qua test** (jsdom không có layout): ở bề rộng 1600px, cả 12 thanh chia màu **cao 35px = một hàng, không chip nào xuống dòng**; q3/q12/q13 chia được thành nhiều đoạn kèm đủ ba nhãn `Không xác định` / `Ẩn danh` / `Chưa đối chiếu được`; q14 (donut trên trục nguồn) hiện **lý do trục** chứ không phải "dùng chart thanh" — đúng thứ tự đã chốt, vì trên trục tổng hợp thì đổi mark cũng là đường cụt.

**Chưa mở, và đừng vô tình mở:** `scaled = dim?.base === "agg"` nghĩa là chart agg vẽ số đã nhân `fx()`. Hôm nay agg luôn khoá chia màu nên **không bao giờ** có đoạn màu vẽ trên thanh đã scale. Ai mở chia màu cho agg sau này phải xem lại đúng dòng đó trước.

## Còn hở sau S3c — nói thẳng, đừng đọc thành đã phủ

- **Trạng thái "ghi được một phần" của nút chiều không có đường kiểm bằng mắt trong demo — nhưng KHÔNG phải code chết.** Đã lần lại đủ đường: ràng buộc 1 (`data/validate.ts` ~683-694) buộc cả năm chiều cộng ra đúng `Signal.vol` (Map khởi tạo sẵn cả năm chiều bằng 0, nên một chiều vắng hẳn cũng bị bắt), nên **bộ dữ liệu đã qua kiểm không sinh nổi ca này** — đúng như bản kế hoạch S3 đã nói trước với owner (`output/ke-hoach-s3-chart-diem-do.html`, box "Một điều đi kèm, cần nói ra") và owner đã chốt **không nới ràng buộc 1** chỉ để bấm thử được trong demo. Điều bản kế hoạch chưa nói rõ, tôi kiểm bổ sung: `validate()` **không chặn render**, nó chỉ dựng banner đỏ toàn cục (`App.tsx:75`, `features/quantify/ValidateBanner.tsx`) — nên với **dữ liệu thật** thiếu dòng ở một chiều, app vẫn vẽ, nút chiều đó hiện `partial` kèm *"x% dữ liệu không gán được …"*, **cùng lúc** với banner đỏ nói bảng đếm lệch. Đó là hành vi đúng, không phải xung đột: banner nói với người vận hành pipeline, chữ trên nút nói với người đọc chart. **Đừng xoá nhánh `partial`, và đừng nới ràng buộc 1 để "test cho dễ".** Cái còn hở đúng là: nhánh này chưa từng được **mắt người** duyệt, chỉ được test chứng minh là **chạy đúng**.
- **Trạng thái "khoá" thì CÓ ca thật và đã đo.** Khi `sigCounts` rỗng (Demo Mode TẮT — trạng thái trống trung thực, ghi ở `data/schema/index.ts:52`), chọn `sg1` cho ra **cả năm chiều `locked`** cùng lúc, cột tổng 0, "chưa gắn được khách" = không biết. Đây là đường duy nhất tới `locked` hiện nay, và nó không phải "chiều này không ghi X" mà là "chưa có bảng đếm cho điểm đo này". Panel phải nói đúng nguyên nhân đó (xem S3c-2b).
- **Tour của `#/atlas` chưa nối.** `seed.ts:743-745` khai ba mốc tour (`atlas-prail`, `atlas-spine`, `atlas-inspector`) và mô tả "Hồ sơ bước — 3 tab", nhưng màn ship **1 tab** và tour chưa được dựng ở React (`App.tsx:21` ghi "dựng ở bước sau"). Không phải hồi quy — trước đó `#/atlas` là `Placeholder`. **Đừng gắn mốc tour bây giờ**: gắn vào là tour khẳng định "3 tab", một câu sai. Sửa chữ tour cùng lúc hai tab kia lên.

## S2 + S4 — ĐÃ XONG, đã tự kiểm (04/08, đã commit `13199fd` + `27fd4f6`)

`npx tsc -b` sạch. **751/751 test xanh (74 file)** = 749/73 cũ + 1 file / 2 test canh mới. 21 file sửa, **chưa commit**.

Đã đối chiếu bằng oracle số liệu dựng TRƯỚC khi sửa (tiêu chí §9 "chart cũ giữ nguyên số"):

| Kiểm | Kết quả |
|---|---|
| Danh sách chiều | 16 → **14**, rút đúng `seg` + `tenure`, không thêm chiều nào |
| Chiều khách | `[seg,tier,age,nav,tenure,acq]` → **`[tier,age,nav,acq]`** |
| Ranh giới trong `cfg` | `[nav,age,tenure]` → **`[nav,age]`** (không còn khai mồ côi) |
| Cổng kiểm hai fixture | 0 lỗi trước, **0 lỗi sau** |
| Saved query | 19 → **17**, bỏ đúng `q16` + `q19`, `dash` không còn treo tham chiếu |
| **Số của 12 chart cũ** | **KHÔNG một query nào đổi số**, trên cả hai fixture |
| Trục khách còn lại | 4 trục, **không đổi số** |
| Chart theme | 112 tổ hợp, đổi đúng **28** = 14 theme × 2 trục bị rút. Không tổ hợp nào khác đổi |
| **Bảng đếm điểm đo** (bất biến 7) | **588 dòng, nội dung GIỐNG HỆT** — thứ tự rút số của bộ sinh demo còn nguyên |
| **300 khách demo** | `seg`/`tier`/`tenureMonths` **giống hệt từng khách**; `bands` chỉ mất đúng khoá `tenure` |
| Test sentinel `tenure` | **chuyển hướng, không xoá** — dim khai trong test trên `tenureMonths`, vẫn canh `'chưa-biết'` không được thành `'<6 tháng'` |
| Docblock `SIG_CUST_DIMS` | đã viết lại — lý do khép kín danh sách không còn dựa vào câu "dims vẫn khai seg/tenure" (đã sai sau S2) |

**Một lỗi thật worker để lại, tôi đã sửa:** việc đổi chữ thường `android`/`ios`/`web` → `Android`/`iOS`/`Web` **trông như đã làm nhưng không chạy** (vòng import, xem "Bẫy đã trả giá"). Đã sửa bằng deref lúc gọi, thêm test canh, và cập nhật 3 test đang ghim chữ thường.

## Việc còn lại của stream

**Cập nhật 05/08/2026 (cuối phiên):** **toàn bộ stream đã xong về code và đã commit** — S1, S2, S4, S3a-1, S3a-2, S3b, S3c-1, S3c-2a, S3c-2b (xem các mục ở trên). Các bullet dưới đây **giữ lại làm hồ sơ cái giá đã trả**, không phải việc còn phải làm.

Còn lại, không phải việc code:

1. **Chờ dữ liệu thật.** ~~`Signal.values` phần lớn còn là suy diễn (lỗ hổng A)~~ — **câu này đã sai sau 05/08**, owner chốt bên nghiệp vụ là bên đề xuất đo gì, nên `values` là **đề xuất của mình**, không phải chỗ chờ lấp (xem mục "Pilot mở rộng"). Còn chờ thật: **Bảng D** (định danh element trên web/app) và **Bảng E** (số phễu từng bước — 30 bước đang chạy số demo). Cả hai đã đặc tả ở `output/yeu-cau-du-lieu-pilot-mo-rong.html`. Khi có, phần lớn cột của chart sẽ đổi — đó là chủ ý, không phải hồi quy.
3. **Hai tab còn lại của hồ sơ bước** ("Chỉ số liên kết", "Độ phủ dữ liệu") và **tour `#/atlas`** — cố ý hoãn, xem bullet cuối mục "Còn hở". Sửa chữ tour **cùng lúc** hai tab kia lên, đừng gắn mốc tour trước.

- **S2 (ĐÃ XONG) — chiều.** Rút `seg` và `tenure` khỏi danh sách chiều (đã đo: không chart nào dùng; nhớ gỡ **cả** `cfg.segment.band.tenure` cùng lúc — luật quanh `validate.ts:602` lặp trên chính `cfg` nên bỏ sót sẽ sinh lỗi mồ côi). Sửa chữ thường `android`/`ios`/`web` ở chart theme. **Sửa lại một câu sai của bản trước:** `server` **đã có** trong bảng tên đẹp nền tảng (`domain/quantify.ts:46` và `design-system/SrcMatrix.tsx:16`) — không thiếu, đừng thêm lần nữa.
  - **Cái giá đã biết và owner đã đồng ý:** rút `seg` làm **đổi chữ trên dòng drill**. Commit `56128e3` tồn tại đúng để giữ chữ đó ("drill theo seg phải in 'Phân khúc NAV'"). Tài liệu thiết kế §4 nói việc rút này "miễn phí vì không chart nào dùng" — đúng với chart, **sai với panel drill**. Owner đã chấp nhận đổi chữ.
  - `tenure` là chiều **duy nhất** sinh từ seed có sentinel `'chưa-biết'` thật. Test canh sentinel/từ chối phải **chuyển sang một dim khai trong test** trên `tenureMonths` (tiền lệ `projectBands.test.ts:32`), **không được xoá**.
- **S3 (ĐÃ XONG) — chart điểm đo.** Cách đếm đi qua `data.sigCounts` bằng **đường riêng**, không qua `rowBuilder`/`qRun` chung. Cột **"giá trị chưa khai"** (§7). Ba trạng thái của nút chiều (§1): chọn được / chọn được kèm *"x% dữ liệu không gán được nền tảng"* / khoá kèm lý do — **tính từ dữ liệu, tuyệt đối không khai tay**. Nhà của chart: **tab "Touchpoint & signal" của `#/atlas`** — lúc lập kế hoạch `#/atlas` còn là `Placeholder`, nên phải dựng tối thiểu trước (đã xong ở S3c-1): dải pha → chip nhóm/luồng → **spine có dải nối dày mỏng + vạch đỏ** → panel bước chỉ với tab 1 (tab "Chỉ số liên kết" và "Độ phủ dữ liệu" hoãn). Hình tham chiếu: `output/cxm-platform-prototype.html` (`V.atlas`, `journeySpine`, `stepInspector`).
- **S4 (ĐÃ XONG) — dọn.** Bỏ `q16` và `q19`; nhớ gỡ tham chiếu trong `dash` (`seed.ts` có `b:['q17','q18','q19']`) nếu không sẽ lỗi khối treo.
- **Không đụng hành vi bấm thanh.** Owner chốt giữ nguyên. Màn "VoC theo hành trình" chưa dựng và tầng theme chưa khai `maps` — **không còn là chặn** vì không có gì điều hướng.

## Quy ước làm việc

- Trả lời owner bằng **tiếng Việt có dấu**, thuật ngữ kỹ thuật giữ English.
- **Mô tả thiết kế bằng ngôn ngữ nghiệp vụ**, đừng lấy tên biến làm đơn vị giải thích. Mỗi tài liệu có bảng tra *nghiệp vụ ↔ tên code*.
- Worker: **chỉ dùng Sonnet**. Không SOL/DeepSeek/Terra cho dự án này.
- Kiểm chứng: `cd web && npx tsc -b` (**không** `--noEmit`) rồi `npx vitest run --maxWorkers=2 --testTimeout=30000`. **Tự chạy, đừng tin số worker báo** — worker phiên này hai lần dừng trước khi nộp kết quả test.
- **Không commit khi chưa được yêu cầu.**

## Prompt cho session mới

```
Đọc docs/DB-FIRST-HANDOFF.md, AI-CONTEXT.md, output/thiet-ke-chart-signal.html,
output/thiet-ke-chart-signal-bo-sung-dot-2.html và
output/yeu-cau-du-lieu-pilot-mo-rong.html.

Stream "chart theo điểm đo (signal)" ĐÃ XONG về code (tsc sạch, 828/828 test xanh /
79 file). main = c6767d6, NHƯNG working tree KHÔNG sạch: pilot mở rộng (6 luồng ·
30 bước · 20 điểm đo) đã xong và tự kiểm, chưa commit — 7 file code/test + 1 tài
liệu mới. Đừng tự commit, đừng dọn, đừng coi các sửa đó là rác.

Đọc mục "Pilot mở rộng" TRƯỚC: nó đổi một khung nhận thức, không chỉ mở phạm vi —
Signal.values từ 05/08 là ĐỀ XUẤT của bên nghiệp vụ, không còn là lỗ hổng A chờ bên
dữ liệu lấp. Trong đó cũng ghi hai lỗi mà 827 test xanh KHÔNG bắt được, chỉ lộ khi
xem màn đã mount — nếu làm chart, đọc trước khi tin vào test.

Việc còn lại của stream KHÔNG phải code — xem mục "Việc còn lại của stream": chờ
Bảng D + Bảng E, hai tab còn lại của hồ sơ bước, và tour #/atlas.
Nếu tôi nhờ làm việc khác, đọc mục "Còn hở" trước để đừng hứa những gì chưa phủ.

Đừng tháo các bất biến ở mục "Bất biến KHÔNG được tháo" — đặc biệt số 7 và 8.
Đọc mục "Bẫy đã trả giá" TRƯỚC khi sửa bất kỳ test nào.
Tự chạy tsc + vitest để kiểm chứng, đừng tin số worker báo.
```
