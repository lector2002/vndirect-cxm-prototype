# Chart theo điểm đo (signal) — Handoff cho session mới

_Cập nhật: 2026-08-05. Đọc file này + `AI-CONTEXT.md` + **`output/thiet-ke-chart-signal.html`** + **`output/thiet-ke-chart-signal-bo-sung-dot-2.html`** trước khi làm._

## Trạng thái

- `main` = **`88a41ec`** (05/08). Đã commit: S1 (`ca3cfc0`+`3a43c2c`) · S2+S4 (`13199fd`+`27fd4f6`) · S3a-1 (`607b1fd`) · tài liệu đợt 2b + kế hoạch S3 (`33a07d2`) · S3a-2 (`3f00a99`) · S3b (`9ad1a14`) · S3c-1 (`88a41ec`).
- `npx tsc -b` sạch. **793/793 test xanh (77 file)**. Các mốc đã đi qua: 727/72 (trước S1) → 749/73 (sau S1) → 751/74 (S2+S4) → 754/74 (S3a-1) → 793/77 (S3c-1). Dùng mốc gần nhất để đối chiếu, đừng dùng số cũ.
- Còn lại: **S3c-2** (chart điểm đo trong tab) — xem "Việc còn lại của stream".
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

**Đã tự chốt, dữ liệu trả lời sẵn nên không hỏi owner.** (a) Cột "giá trị chưa khai" phủ **bằng test**, không nhét giá trị lạ vào demo: `validate.ts:680` đã cấm giá trị ngoài `Signal.values`, nhét vào thì cách duy nhất để demo qua kiểm là **nới luật cho vừa dữ liệu** — đúng bẫy đã trả giá hai lần; thêm nữa sẽ dịch thứ tự rút `rawRng` và mất mốc đối chiếu 588 dòng. Tiêu chí #11 viết dạng giả định ("cho pipeline bắn ra…"), không đòi demo phải đang ở trạng thái đó. (b) Điểm đo `st:'gap'`/`designed` (`sg6`, `sg9` — `vol:0`, `values:[]`) khi **chọn nhiều**: ra **một dòng ghi chú** nêu tên + "chưa instrument"; **không** sinh nhóm cột rỗng (đọc thành "đo rồi, bằng 0") và **không** biến mất im lặng (người chọn tưởng bấm trượt).

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

## Còn hở sau S3c-1 — nói thẳng, đừng đọc thành đã phủ

- **Hai trạng thái "ghi được một phần" / "khoá" của nút chiều không có đường kiểm bằng mắt.** Dữ liệu demo ghi đủ cả năm chiều (test canh điều đó), nên hai nhánh này chỉ render trong unit test với fixture dựng tay. Test chứng minh nhánh **chạy đúng**, không chứng minh nó **trông đúng**. Owner cần tự nhìn khi có dữ liệu thật, hoặc chấp nhận đây là phần chưa được mắt người duyệt.
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

**Cập nhật 05/08/2026:** S1, S2, S4, S3a-1, S3a-2, S3b, S3c-1 **đã xong và đã commit** (xem các mục ở trên). Còn đúng **S3c-2** — chart điểm đo bên trong tab "Touchpoint & signal": chọn nhiều điểm đo, nhóm cột, nút chiều ba trạng thái, cột "giá trị chưa khai", panel "gắn ở đâu" (Đ4) nói rõ là **mô tả nghiệp vụ chưa phải vị trí kỹ thuật**. Hai bullet S2/S4 ngay dưới **giữ lại làm hồ sơ cái giá đã trả**, không phải việc còn phải làm.

- **S2 (ĐÃ XONG) — chiều.** Rút `seg` và `tenure` khỏi danh sách chiều (đã đo: không chart nào dùng; nhớ gỡ **cả** `cfg.segment.band.tenure` cùng lúc — luật quanh `validate.ts:602` lặp trên chính `cfg` nên bỏ sót sẽ sinh lỗi mồ côi). Sửa chữ thường `android`/`ios`/`web` ở chart theme. **Sửa lại một câu sai của bản trước:** `server` **đã có** trong bảng tên đẹp nền tảng (`domain/quantify.ts:46` và `design-system/SrcMatrix.tsx:16`) — không thiếu, đừng thêm lần nữa.
  - **Cái giá đã biết và owner đã đồng ý:** rút `seg` làm **đổi chữ trên dòng drill**. Commit `56128e3` tồn tại đúng để giữ chữ đó ("drill theo seg phải in 'Phân khúc NAV'"). Tài liệu thiết kế §4 nói việc rút này "miễn phí vì không chart nào dùng" — đúng với chart, **sai với panel drill**. Owner đã chấp nhận đổi chữ.
  - `tenure` là chiều **duy nhất** sinh từ seed có sentinel `'chưa-biết'` thật. Test canh sentinel/từ chối phải **chuyển sang một dim khai trong test** trên `tenureMonths` (tiền lệ `projectBands.test.ts:32`), **không được xoá**.
- **S3 (còn S3c-2) — chart điểm đo.** Cách đếm đi qua `data.sigCounts` bằng **đường riêng**, không qua `rowBuilder`/`qRun` chung. Cột **"giá trị chưa khai"** (§7). Ba trạng thái của nút chiều (§1): chọn được / chọn được kèm *"x% dữ liệu không gán được nền tảng"* / khoá kèm lý do — **tính từ dữ liệu, tuyệt đối không khai tay**. Nhà của chart: **tab "Touchpoint & signal" của `#/atlas`** — mà `#/atlas` hiện là `Placeholder` trong React (`App.tsx:152`), nên phải dựng tối thiểu trước: dải pha → chip nhóm/luồng → **spine có dải nối dày mỏng + vạch đỏ** → panel bước chỉ với tab 1 (tab "Chỉ số liên kết" và "Độ phủ dữ liệu" hoãn). Hình tham chiếu: `output/cxm-platform-prototype.html` (`V.atlas`, `journeySpine`, `stepInspector`).
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
Đọc docs/DB-FIRST-HANDOFF.md, AI-CONTEXT.md và output/thiet-ke-chart-signal.html.

Stream: chart theo điểm đo (signal). S1 (nền dữ liệu) đã xong — tsc sạch, 749/749 test xanh,
NHƯNG CHƯA COMMIT, working tree đang có 13 file thay đổi. Hỏi tôi có commit không trước khi làm gì.

Việc của session này: làm S2 rồi S3 (xem mục "Việc còn lại"). Không cần bàn lại thiết kế —
output/thiet-ke-chart-signal.html là bản owner đã duyệt qua sáu vòng.

Đừng tháo các bất biến ở mục "Bất biến KHÔNG được tháo" — đặc biệt số 7 và 8.
Đọc mục "Bẫy đã trả giá" TRƯỚC khi sửa bất kỳ test nào.
Tự chạy tsc + vitest để kiểm chứng, đừng tin số worker báo.
```
