# Chart theo điểm đo (signal) — Handoff cho session mới

_Cập nhật: 2026-08-05 (đợt 3 — pilot mở rộng). Đọc file này + `AI-CONTEXT.md` + **`output/thiet-ke-chart-signal.html`** + **`output/thiet-ke-chart-signal-bo-sung-dot-2.html`** + **`output/yeu-cau-du-lieu-pilot-mo-rong.html`** trước khi làm._

> ⏭️ **Stream này ĐÃ ĐÓNG. Hướng hiện tại nằm ở chỗ khác (07/08/2026).** Owner chốt ưu tiên **MVP
> tối giản về quản trị flow dữ liệu và độ phủ** — bắt đầu ở
> **`web/docs/HANDOFF-MVP-FLOW-COVERAGE.md`**, và phiên sau **mở đầu bằng brainstorm, không code**.
> Mọi số đo trong file này (commit, số test 1047/89) là mốc **05/08** của stream chart điểm đo, đã
> cũ — mốc mới nhất: **1113 test / 99 file**, vẫn chưa commit. Giữ file để tra thiết kế chart điểm
> đo, đừng dùng làm trạng thái dự án.

## Trạng thái

- `main` = **`c6767d6`** (05/08). Đã commit: S1 (`ca3cfc0`+`3a43c2c`) · S2+S4 (`13199fd`+`27fd4f6`) · S3a-1 (`607b1fd`) · tài liệu đợt 2b + kế hoạch S3 (`33a07d2`) · S3a-2 (`3f00a99`) · S3b (`9ad1a14`) · S3c-1 (`88a41ec`) · S3c-2a + tầng phân loại "không biết" (`869338b`) · S3c-2b (`17b84ec`) · tài liệu S3 (`725d24d`+`c6767d6`).
- **Working tree KHÔNG sạch.** Pilot mở rộng (đợt 3, 05/08) + ba vòng sửa layout + đổi điểm đo liveness + mở chia màu Quantify + **bản đồ hành trình bù cho bằng prototype & khoá phase ngoài pilot** + **hồ sơ bước lên đủ ba tab** + **bộ máy tour** đã làm xong và tự kiểm nhưng **chưa commit**. Owner chưa yêu cầu commit.
- `npx tsc -b` sạch. **1047/1047 test xanh (89 file)**. Các mốc đã đi qua: 727/72 (trước S1) → 749/73 (sau S1) → 751/74 (S2+S4) → 754/74 (S3a-1) → 793/77 (S3c-1) → 814/78 (S3c-2a) → 827/79 (S3c-2b) → 828/79 (pilot mở rộng) → 861/80 (Atlas + ba tab) → 877/82 (bộ máy tour) → 883/82 (sửa nền tối đóng tour + lý do vắng mốc theo từng chặng) → 893/82 (bỏ hero Atlas + gộp khối "gãy ở đâu" theo hành trình) → 903/82 (độ phủ đổi sang phân bố theo dải) → 908/82 (bấm dải mở danh sách bước tại chỗ) → 911/82 (cắt @topictrend + @journeystate) → 951/84 (màn VoC theo hành trình + ghim phase mặc định không rơi vào phase khoá) → 995/86 (màn Nguồn dữ liệu) → 999/86 (`lagText` về `domain/` + ghim tiền đề fixture) → 1036/88 (màn Topic & xu hướng — tour hết chặng bị giữ vì màn chưa dựng) → **1047/89 (mọi màn chỉ còn tên tab ở đầu trang, tên lấy từ một nguồn)**. Dùng mốc gần nhất để đối chiếu, đừng dùng số cũ.
- **Cả stream đã xong về code, kể cả việc treo cuối cùng (bộ máy tour).** Còn lại là việc của owner + việc chờ dữ liệu thật: xem "Còn hở" và "Việc còn lại của stream".
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

### Đuôi xám: gộp NHÌN, không gộp SỐ (owner chốt 05/08, áp cho mọi chart)

Owner xem trên màn rồi nói: *"cần chỉnh sửa lại tone màu của 3 cái unknown đó, nếu có thể thì gộp lại để dễ nhìn hơn"*. Đo được: `--unk` `#8c8681` → `--unk-anon` `#a9a39c` → `--unk-join` `#c5bfb7`, ba bậc cách nhau ~10% độ sáng, ở đoạn thanh mỏng đọc gần như một màu.

**Gộp SỐ thì không** — `Ẩn danh` (133 dòng, đúng thiết kế) và `Chưa đối chiếu được` (7 dòng, lỗi dữ liệu) là hai thứ khác nhau, gộp là mất đúng con số dùng để đi sửa pipeline. **Gộp NHÌN thì được**: một khối xám `--unk-nocust`, từng số tách ra ở tooltip qua `Bars.segments[].parts` (tooltip nhiều dòng).

**Nhãn: "Chưa xếp được nhóm".** Nhãn tôi đưa trong preview lúc hỏi (*"Chưa gắn được khách"*) **sai** với hai trong bốn lý do — với `chưa-biết`/`thiếu` thì khách VẪN tra ra được, chỉ là ô dữ kiện trống. Owner chốt đổi sang nhãn đúng cho cả bốn.

| Chart | Trước | Sau | Trạng thái |
|---|---|---|---|
| Chia màu ở Quantify (`evSplit`, q3/q12/q13) | 3 đoạn xám | 1 khối + 3 số ở tooltip | **Đã xem trên màn** — legend 7 → 6 nhãn |
| Theme (`themeSegments`, khối `@themestack`) | 4 đoạn xám | 1 khối + 4 số ở tooltip | **Engine xong + test canh, CHƯA nhìn thấy được trên màn** — xem cảnh báo dưới |
| Chart điểm đo (`SignalColumns`) | 3 cột tách | **giữ nguyên** | Owner chốt riêng: ở đó tách ba nghĩa CHÍNH LÀ nội dung chart, nó là danh sách việc đi đòi bên data |

**Cảnh báo về chart theme:** picker của `ThemeStackBlock` hôm nay **chỉ có 2 trục** (`subtheme` + `pf`), cả hai đều không sinh đoạn "không xếp được nhóm" — `pf` là `base:'ev'`, đọc thẳng từ Evidence, không cần join. Nên phần gộp ở đó **đúng và có test, nhưng chưa có đường nào bấm tới trên màn**. Khi F3 mở chip strip đầy đủ (mọi trục của `dims`), khối gộp mới hiện ra — **lúc đó phải xem lại bằng mắt**, đừng coi là đã duyệt.

**Một bất biến đổi chỗ, có chủ ý:** đoạn `Ẩn danh` trước đây luôn có mặt **kể cả n=0** (để nói "có kiểm, bằng không"). Nay nó là một **dòng trong tooltip**, vẫn hiện khi bằng 0. Ý định giữ nguyên, chỗ đặt tốt hơn: đoạn rộng 0px không rê chuột vào được, nên chỗ cũ chưa bao giờ nói được số 0 ấy cho ai đọc.

**Owner đã cân nhắc và chấp nhận:** 7 dòng lỗi đối chiếu **không còn nhìn thấy trên màn**, phải rê chuột mới biết. Đây là chủ ý, không phải sót.

### Năm cách cắt, khai bằng `Dim.slice` — hết chuyện mỗi màn tự đoán (owner hỏi 05/08)

Owner đếm trên màn: *"chỉ hiển thị có 4 slice/5, thiếu mất nền tảng"*, và *"phần khách đang nói gì không chia được theo 5 slice đã nói"*. Hai chỗ, hai nguyên nhân:

| Chỗ | Nguyên nhân | Sửa |
|---|---|---|
| Thanh chip ở Quantify chỉ 4 chiều | lọc `d.base === "cust"` — tự đặt luật *"cắt được ⇔ là thuộc tính khách"*. Luật đó SAI: "Nền tảng" là `base:'ev'` nhưng cắt được, và **chắc hơn** (đọc thẳng `e.pf` trên dòng bằng chứng, không tra hồ sơ khách nên không dính ẩn danh / nối hỏng) | lọc theo cờ khai `Dim.slice` |
| Chart theme chỉ 2 trục | picker là mảng **viết tay** 2 nút, trong khi `themeAxisOptions()` đã tính sẵn cả danh sách lẫn lý do khoá từ lâu — chưa ai nối lên | sinh từ `themeAxisOptions(dims)`, lọc cùng cờ `slice` |

**Vì sao phải khai cờ, không suy từ `base`:** `base` nói CHỖ ĐỌC dữ liệu, không nói VAI TRÒ. `base:'ev'` gồm cả `cat`/`sen` — hai chiều đó là **đề tài** của chart (trục hàng), không phải cách cắt; lọc theo `base:'ev'` sẽ ra 7 chip chứ không phải 5. "Cắt được theo chiều nào" là quyết định thiết kế, phải khai ra. `Dim.slice` khai ở `data/schema/config.ts`, bật trên đúng năm chiều trong `seed.ts`.

**Ba lý do từ chối, mỗi lý do nói đúng việc của nó** (không còn một câu chung *"phải là thuộc tính khách"*):
- chiều chưa khai `slice` → *"chưa khai là chiều để cắt chart"*
- trục hàng là **khách** × chiều chia là **bằng chứng** → *"mỗi thanh đếm KHÁCH, mà Nền tảng là thuộc tính của từng lần để lại dấu vết — một khách dùng nhiều nền tảng ở nhiều thời điểm"*
- trục hàng `agg` → lý do tổng hợp sẵn, như cũ

**Hệ quả có ích:** khối gộp "Chưa xếp được nhóm" ở chart theme **giờ mới bấm tới được** — trước đó picker không có trục khách nào nên phần gộp đúng mà không ai nhìn thấy. Đã xem: chọn "Độ tuổi" ra tooltip `Chưa xếp được nhóm: 88 / chưa-biết: 68 / Ẩn danh: 19 / Chưa đối chiếu được: 1`, còn `Chưa có bằng chứng gán: 116` vẫn tách riêng (khác nghĩa hẳn).

**Một hồi quy layout đã bắt và sửa:** thêm chip thứ năm làm **cả 12 thanh xuống hai hàng** (35px → 61px). Đo ra: thanh rộng 595px, nhãn *"Chia màu theo"* chiếm 84px, sáu chip cần ~515px — thiếu đúng ~12px. Rút nhãn thành *"Chia màu"* trả lại ~29px. Không bóp padding chip vì đó là hình dáng dùng chung với `ThemeStackBlock`/`TimeframeBar`.

**Giới hạn còn lại, nói thẳng:** thanh cần **570px** mới nằm một hàng. Ở cửa sổ 1615px, cột rộng 601px ⇒ dư 31px, một hàng. Dưới khoảng **1555px** thì cột hẹp hơn 570 và thanh **xuống hai hàng** — kể cả ở mức 1280px mà app tuyên bố là tối thiểu. Không hỏng, chỉ cao thêm 26px. Muốn vừa ở 1280 phải cắt thêm ~120px, tức bỏ hẳn nhãn và rút tên chip — chưa làm, chờ owner quyết nếu thấy vướng.

**Chưa mở, và đừng vô tình mở:** `scaled = dim?.base === "agg"` nghĩa là chart agg vẽ số đã nhân `fx()`. Hôm nay agg luôn khoá chia màu nên **không bao giờ** có đoạn màu vẽ trên thanh đã scale. Ai mở chia màu cho agg sau này phải xem lại đúng dòng đó trước.

### Hai lỗi chuẩn của chart chia màu — tự tìm ra sau khi owner nói "tự chỉnh cho đúng chuẩn UI/UX" (05/08)

Owner giao *"tự chỉnh sửa sao cho chart hợp lý và đúng chuẩn ui-ux nhất"*. Đọc lại phần màu và thứ tự thì lòi ra hai lỗi thật, khác nhau, và **cả hai đều là lỗi đọc chart chứ không phải lỗi thẩm mỹ**.

**Lỗi 1 — chart theme: cùng một màu, hai thanh hai nghĩa.** `themeSegments()` gán màu theo **thứ hạng TRONG một theme**, nên thanh nào cũng bắt đầu bằng `--cat-1`: ở theme A màu đầu là Android, ở theme B lại là iOS. Hệ quả là **không so ngang được hai thanh** — mà so ngang chính là lý do tồn tại của một chart thanh xếp hạng — và mỗi thanh phải kéo theo một chú giải riêng (tám chú giải cho tám thanh). Chính dự án đã chốt điều ngược lại ở chart điểm đo: *"hạng 1 toàn chart → cat-1, kể cả khi ở nhóm A nó không phải hạng 1"* (`design-system/SignalColumns.test.tsx:7-9`). Chart chia màu ở Quantify cũng đã đúng từ đầu (xếp hạng toàn cục). **Chart theme là chỗ duy nhất còn lệch.**

Sửa: thêm `axisPalette()` trong `domain/themeSegments.ts` — tính bảng màu + thứ tự **một lần trên toàn bộ bằng chứng gắn theme**, mọi thanh tra cùng bảng đó. Kéo theo: tám chú giải theo hàng rút về **một chú giải chung** (`themeLegend()` + `ChartLegend`). Trục `subtheme` **giữ nguyên chú giải theo hàng** — ở đó nó là cách đúng duy nhất, vì sub-theme thuộc về đúng một theme cha nên không tồn tại bảng màu chung nào.

Bảng tính trên **mọi** theme, không chỉ top 8 đang hiện: tính theo tập đang hiện thì màu sẽ nhảy mỗi lần đổi số thanh hoặc đổi kỳ. Giá phải trả: có thể dư một mục chú giải không xuất hiện trong thanh nào — chấp nhận, dư một dòng đọc được vẫn hơn một bảng màu trôi.

**Lỗi 2 — dải có thứ tự bị tô như nhóm rời rạc, ở CẢ HAI chart.** `age` và `nav` khai `cut.kind: 'band'`, tức **dải có thứ tự**, nhưng vẫn nhận năm màu `--cat-*` không hơn kém nhau và vẫn xếp theo **số lượng**. Đo trên `demoData`: độ tuổi ra thứ tự `25-34 · 50+ · 18-24 · 35-49` — nhìn thanh không đọc được "trẻ hơn nằm bên nào", mà đó là điều duy nhất một chiều tuổi để nói. (Phân khúc NAV **tình cờ** trùng thứ tự dải khi xếp theo số lượng — chính vì tình cờ nên nó không canh được gì.)

Sửa: `domain/splitOrder.ts` (module **riêng**, vì `quantify.ts` và `themeSegments.ts` đã import chéo nhau và cả hai đều cần bộ này). Chiều `cut.kind === 'band'` → xếp theo **dải**, tô bằng thang tuần tự `--seq-1..5` (một hue, nhạt = dải thấp, đậm = dải cao). Chiều `values` và chiều không khai `cut` (Nền tảng, Value tier, Kênh mở TK) → **giữ nguyên** `--cat-*` + xếp theo số lượng. **Không thêm cờ khai báo mới** — `Dim.cut.kind` đã phân biệt đúng hai ca này từ lâu, chỉ là chưa ai dùng nó để quyết định cách vẽ.

Thứ tự dải **suy từ dữ liệu** (giá trị thô nhỏ nhất trong mỗi dải), không đọc ranh giới cấu hình: tầng domain không được biết tới `cfg`, và `QuantifyWidget` khai `cfg` là prop **tuỳ chọn** nên có đường gọi hợp lệ không có nó. Cách còn lại — đọc chữ trong nhãn (`"<50tr"`, `"1-5tỷ"`) — là phân tích chuỗi hiển thị, hỏng ngay lần đầu owner đổi cách viết nhãn.

Cắt `SPLIT_TOP_N` vẫn theo **số lượng**, xếp lại theo dải **sau** khi cắt. Đảo hai bước là rụng mất các dải cao — đúng phần đuôi mà người xem một chiều tài sản/tuổi quan tâm nhất.

**Áp cho cả TRỤC HÀNG, không riêng đoạn màu.** Bản sửa đầu chỉ đụng đoạn màu, và như thế là để hở đúng một nửa: `seed.qt` **có** chart lấy dải làm trục hàng (`show:'nav'`), nên cùng một chiều sẽ đọc ra hai thứ tự ở hai chart — chia màu theo NAV cho ra `<50tr → >5tỷ`, còn lấy NAV làm hàng lại cho ra thứ tự theo số lượng. Đúng loại lệch mà owner đã chỉ ra một lần ở chuyện 4/5 slice. `qRunSegment()` nay dùng cùng `sortByBand`. **Màu hàng không đụng** — hàng có nhãn chữ ngay bên cạnh nên không mã hoá thứ tự bằng màu, chỉ thứ tự mới cần sửa.

Test canh chỗ này dùng **Độ tuổi**, không dùng NAV: trên `demoData` thứ tự-theo-số-lượng của NAV **tình cờ trùng** thứ tự dải, nên canh bằng NAV sẽ xanh cả khi code sai.

**Đã xem trên màn (1615px, `#/voc` + `#/quantify`):** chart theme ra một chú giải `18-24 · 25-34 · 35-49 · 50+ · Chưa xếp được nhóm · Chưa có bằng chứng gán`, tám thanh cùng thứ tự đoạn, tám đoạn "Android" cùng đúng một màu; chart Quantify ra cùng thứ tự dải với thang `--seq-*`. Test: 846 xanh (thêm `domain/splitOrder.test.ts`). Hai test cũ đổi **kỳ vọng**, không đổi **số**: thứ tự đoạn độ tuổi, và chỗ đặt chú giải của chart theme.

**Theo luật roll-out:** lỗi 2 áp cho cả hai chart cùng lúc. `SignalColumns` không đụng — nó không chia theo dải nào.

## Bản đồ hành trình — bù cho bằng prototype + khoá phase ngoài pilot (owner chốt 05/08)

Owner: *"làm lại phần bản đồ hành trình để hiển thị giống với cách prototype đang làm nhưng tạm thời lock các stage ko pilot lại để ko bấm được nữa"*, rồi ngay sau đó thu hẹp: *"hide cả phần giao dịch đi, chỉ lấy dòng tiền và mở tk thôi"*.

**Bù ba chỗ bản React thiếu so với `V.atlas`.** Hero đếm flow/phase (prototype dòng 3374) — nay `#/atlas` là màn duy nhất từng không có hero; đoạn dẫn đọc cách xem dải nối + link sang VoC theo hành trình (3375); chip mẫu số trên hai card (`chead`, 3390/3410) qua `denomStrip`. Rail đổi từ cuộn ngang sang **lưới chia đều** như `.prail` (271). Chip flow đang chọn tô **đặc** màu chính, chữ trắng (`.fchips button.on`, 285) — bản cũ chỉ đổi viền nên trong một hàng chục chip rất khó thấy đang đứng ở đâu.

**Đã soát lại xem chip đặc đó có phá luật "một nghĩa, một cách vẽ" không — KHÔNG.** Grep toàn `web/src`: repo đang có **hai họ, tách theo loại control chứ không phải tuỳ hứng**. (a) Chip đứng rời trên nền màn — `SetChips`, `CountFilter`, `QuantifyFilterBar`, `QuantifyBuilder` — chọn thì **tô đặc màu chính, chữ trắng**. (b) Nút phân đoạn nằm **trong một rãnh xám** (`bg-surface-2 rounded-lg p-0.5`) — `SplitToggle:43`, `TimeframeBar:28`, `ThemeStackBlock:25` — chọn thì **nền trắng, chữ màu chính**, vì tô đặc trong rãnh xám sẽ chọi với chính cái rãnh. Chip flow của Atlas là loại (a) và nay vẽ đúng như 4 chỗ cùng loại. Ghi ra đây vì nhìn hai màu ngược nhau rất dễ tưởng là lệch chuẩn.

**Hai chỗ cố ý KHÔNG chép y prototype, vì chép là chép cả lỗi.** (1) `.prail` ghim `repeat(7,…)` cho 7 phase thời đó; seed nay 6 phase nên số cột suy theo dữ liệu. (2) Prototype tự chọn sẵn bước đầu (`steps[0].id`, dòng 3368); React giữ **rule 4** — chưa chọn bước nào khi mới vào màn. Đó là quyết định cũ đã chốt, không lặng lẽ lật.

**Một lỗi layout tự lộ ra khi bù rail.** `.pd` của prototype để chấm một hàng vì phase đông nhất hồi đó chỉ vài flow; seed nay có phase **16 flow** — 16 chấm trong cột rộng ~186px ép chữ "16 flow" vỡ hai dòng, ô đó cao hơn năm ô kia. Cho **chấm quấn dòng**, số flow `whitespace-nowrap`. Không cắt bớt chấm: hàng chấm chính là chỗ đọc ra phase đo tới đâu, cắt là giấu mất flow. Đo lại sau khi sửa: sáu ô đều 110px, sáu nhãn số đều một dòng.

**Phạm vi pilot là QUYẾT ĐỊNH, không suy được từ dữ liệu.** Ban đầu tôi suy phase pilot bằng cờ `observed` — ra 3 phase (02, 03, 04). Owner chốt lại còn **hai**: `PILOT_PHASE_CODES = {"02","03"}`. Giao dịch **đã có 1/16 flow được đo** mà vẫn để ngoài lượt trình bày, nên nếu cứ suy bằng `observed` thì nó tự mở khoá trở lại và không ai biết vì sao. Ghim tường minh theo `code` của phase.

**"hide" đọc thành KHOÁ MỜ, không gỡ khỏi rail** — nói ra để owner bác nếu tôi hiểu sai. Ba lý do: cả dự án đang theo một luật hiển thị (`SplitToggle.tsx:4-8`) là thứ ngoài phạm vi phải **hiện mờ kèm lý do**, không biến mất; bản đồ hành trình thiếu hẳn một giai đoạn là bản đồ sai; và ba phase ngoài pilot còn lại đang hiện mờ, gỡ riêng một phase là hai luật trong cùng một hàng.

**Khoá tử tế = ba điều cùng đúng**, theo đúng bài học 05/08 từ chip chia màu (lý do nằm sẵn trong `title` mà owner vẫn phải hỏi): nút không mất khỏi màn; `aria-disabled` chứ **không** `disabled` thật, để nút còn trong tab order; và **bấm là in lý do thành CHỮ** ở vùng `aria-live` ngay dưới rail. Vùng live luôn có mặt trong DOM, chỉ nội dung đổi — vùng vừa gắn vào cùng lúc với chữ thì screen reader thường không đọc.

**Lý do khoá nói đúng tình trạng đo của từng phase**, không gộp một câu: `"… (mới 1 trên 16 flow có dữ liệu quan sát)"` cho Giao dịch, `"… (chưa flow nào trong 2 flow …)"` cho phase chưa đo. Gộp một câu "chưa có dữ liệu" là màn nói sai về chính dữ liệu của nó. Câu ở tooltip và câu in ra là **một chuỗi duy nhất** — test canh bằng `title === note.textContent`.

**Chip flow ngoài pilot CỐ Ý vẫn bấm được**: chúng dẫn tới ghi chú "chưa nằm trong pilot" — nội dung có chủ ý, prototype cũng vậy. Nếu owner muốn khoá luôn cấp flow thì nói, đó là việc khác.

**Đã xem trên màn (1615px, `#/atlas`)** + `tsc -b` sạch + **854 test xanh** (thêm 7). Một test cũ đổi kỳ vọng chứ không đổi khẳng định: nó bấm `phases[0]` để đổi phase, mà `phases[0]` chính là "01 Tìm hiểu & Tiếp cận" — nay đang khoá; đổi sang một phase pilot khác.

## Hồ sơ bước lên đủ ba tab + gắn mốc tour (05/08, sau khi owner nói "làm tiếp đi")

Đây là việc code **cuối cùng** còn treo của stream (mục "Việc còn lại" số 3). Hai tab lùi từ S3c nay lên cùng lượt với mốc tour, đúng ràng buộc đã ghi: mốc `atlas-inspector` khai *"Hồ sơ bước — 3 tab"*, gắn khi màn mới có 1 tab là để tour nói một câu sai.

**Tab "Chỉ số liên kết"** (`AtlasMetricsTab.tsx`, port nhánh `met` dòng 3519-3529). Chỉ số **không khai trực tiếp trên bước** — đi qua điểm đo (`Signal.metrics`), nên tab lấy đúng những chỉ số mà điểm đo của bước có nhắc tới. Ngưỡng đọc thẳng từ `cfg.metric`, không khai lại; trạng thái dùng `metricState()` — hàm này tồn tại từ lâu mà **đến nay mới có consumer UI đầu tiên**.

**Trạng thái trống là đường chạy THƯỜNG GẶP, không phải ca hiếm.** Đo trên seed: chỉ **6 trên 30** bước pilot có chỉ số (toàn bộ thuộc flow mở tài khoản); 24 bước còn lại chưa khai gì. Nên tab nói thẳng *"chưa gắn chỉ số nào … đây là chỗ còn thiếu khai báo, không phải chỉ số bằng 0"* thay vì để trắng.

**Và "trống" có HAI nghĩa, tách hẳn ra sau một lượt soát lại.** Bản đầu gộp chúng làm một và **màn nói sai về chính nó** ở những bước **chưa khai điểm đo nào** — có thật trong pilot (vd bước 04 của flow nạp tiền, phase 03 Dòng tiền), không phải ca giả định. Ở đó tab chỉ số in *"điểm đo của bước đã có, nhưng chưa nuôi chỉ số"* trong khi **không có điểm đo nào**, còn tab độ phủ khen *"Đủ signal"* cho một bước hoàn toàn chưa được instrument — vì "không có cái nào chưa hoạt động" bị đọc thành "có và đều ổn". Cùng hạng lỗi với chart điểm đo từng gộp ba nghĩa "không biết". Nay mỗi tab có nhánh thứ ba riêng: tab chỉ số nói việc cần làm **nằm trước một bậc** (instrument signal đã, rồi mới khai chỉ số); tab độ phủ để ô "Signal chưa hoạt động" là **`—`** chứ không phải `0`, kèm cảnh báo rằng **chưa kiểm được con số độ phủ lấy từ đâu ra**. Hai test mới canh đúng ca `signals.length === 0`, và oracle của test "đạt ngưỡng" được siết thêm `sigs.length > 0` — `every()` trên mảng rỗng luôn đúng, nên nó có thể canh nhầm sang đúng ca vừa tách.

**Tab "Độ phủ dữ liệu"** (`AtlasCoverageTab.tsx`, port nhánh `cov` dòng 3530-3548). Nói bằng **phần bù**: *"Còn 42% trường hợp thất bại chưa biết lý do"* — con số 58% tự nó không nói cho ai biết đang thiếu gì. Kèm danh sách signal `gap`/`designed` và câu chốt của prototype về việc độ phủ thuộc về **bước**.

**Một hằng bị tách ra dùng chung.** `SIGNAL_STATUS` đang private trong `AtlasSignalPanel.tsx` kèm ghi chú "nơi DUY NHẤT còn dùng nó" — nay tab độ phủ cũng phải nói đúng những chữ đó về cùng một điểm đo, nên dời sang `signalStatus.ts`. Chép sang file thứ hai là mở đường cho **hai tab của cùng một hồ sơ bước** nói hai kiểu về cùng một trạng thái.

**Tab KHÔNG reset khi đổi bước** — giữ đúng hành vi prototype (`ST.sub.atlasTab` là state toàn cục). Đang so độ phủ giữa các bước mà bị ném về tab đầu là hỏng đúng việc người ta đang làm. `role="tablist"` + `aria-selected` để ba nút này nghe ra là **một** lựa chọn.

**Hai chỗ nói trước, không giấu.** (1) Ô *"Evidence coverage"* xuất hiện **hai lần** — hàng 4 số của header và đầu tab độ phủ; prototype cũng vậy, bản trong tab thêm nguồn (*Mobile SDK event registry*). Giữ theo prototype; owner muốn bỏ ô ở tab thì nói. (2) Nhánh *"chỉ số không được theo dõi"* (`cfg.metric[id].on === false`) **không có đường kiểm bằng mắt trong demo**: cả 6 chỉ số trong seed đều đang bật. Cùng loại với nhánh `partial` đã ghi ở mục "Còn hở" — code đúng, test canh, nhưng chưa từng được mắt người duyệt.

**Hai oracle tôi chọn sai lúc viết test, sửa rồi, ghi lại vì cả hai đều là bẫy sẽ lặp:** bước "chưa khai chỉ số" đầu tiên tìm được nằm trong **phase đang khoá** nên không bấm tới được; và bước dưới ngưỡng độ phủ **không trùng** bước có signal thiếu (bước 03 cov 64 nhưng đủ signal, bước 05 cov 58 và thiếu 1) — lấy bước đầu tiên dưới ngưỡng là canh nhầm bước.

**Đã xem trên màn (1615px, `#/atlas`, bước JS-MTK-05)** + `tsc -b` sạch + **861 test xanh / 80 file** (thêm 7). Một test cũ bị thay chứ không nới: nó canh đúng trạng thái *"chỉ 1 tab, không dựng nút cho 2 tab bị lùi"* — khẳng định về một quyết định TẠM, nay hết hiệu lực.

## Bản giới thiệu có dẫn — bộ máy tour đã chạy, và nó đi 9 trên 18 chặng (05/08)

Việc code cuối cùng còn treo của stream. `seedTour` khai **18 chặng** từ thời prototype; bản React đi được **9**, và con số đó là kết luận của một phép đối chiếu chứ không phải chỗ làm dở.

**Vì sao không đi cả 18.** Tour là thứ nói với người mới *"màn này là gì"*. Dẫn người ta tới màn chưa dựng, hoặc đọc lời dẫn tả một bố cục đã bị thay, thì nó không phải "chưa hoàn thiện" mà là **đang nói sai**. Nên chỗ nào chưa đúng thì giữ lại và **nêu tên**, không đi bừa qua:

| Nhóm | Số chặng | Vì sao |
|---|---|---|
| `cxm`, `atlas`, `voc`, `topic` | **9 — đi được** | Màn có thật, mốc `data-tour` có thật |
| `sources`, `topics`, `vocjourney` | 6 — giữ lại | Màn còn là `Placeholder` |
| `work` | 3 — giữ lại | **Lời dẫn nói sai**, xem dưới |

**Ba chặng `work` là ca đáng chú ý nhất, và nó không phải lỗi kỹ thuật.** `#/work` có thật, đầy đủ dữ liệu. Nhưng `seedTour` tả *"Bốn làn công việc"*, *"Làn Chờ duyệt"*, *"Làn verify"* — trong khi owner **đã chốt bỏ board 4 làn**, đổi sang một danh sách thanh ngang (quyết định ghi ở `WorkPage.tsx:19-22`). Tức bảng chặng đang mô tả một bố cục không còn tồn tại. **Tôi không tự viết lại ba câu đó**: lời dẫn là chữ nói với người dùng, thuộc quyền owner, không phải chi tiết cài đặt để lập trình viên tiện tay sửa. Cần owner cấp bản chữ mới, rồi bỏ `"work"` khỏi `STALE_COPY` (`features/tour/tourStops.ts`) là ba chặng vào lại ngay.

**Bộ lọc tự co lại, không phải sửa tay mỗi lần.** Khi `#/sources`/`#/topics`/`#/vocjourney` lên thật, chỉ cần thêm route vào `SCREEN_BUILT` — không đụng gì trong bộ máy tour.

**Nói ra phần chưa đi được, ngay trên màn.** Chặng cuối in một dòng: *"Bản giới thiệu này còn 9 chặng chưa đi được: 6 chặng màn chưa dựng ở bản React; 3 chặng lời dẫn còn tả bố cục cũ."* Người xem demo không phải đoán vì sao tour ngắn.

**Chặng không tô sáng được thì nói ra, không giả vờ bình thường.** Prototype gặp selector không thấy element thì lặng lẽ đưa popover ra giữa màn (dòng 4761-4765). Ở đây có thêm một dòng chữ, vì ca này **có thật và đúng chủ ý**: chặng *"Hồ sơ bước — 3 tab"* mời người ta **tự chọn một bước** (rule 4: mới vào màn chưa chọn bước nào), nên không có gì để tô sáng. Im lặng thì người xem tưởng mình nhìn sót.

**Hai lỗi tự bắt được sau khi bộ máy đã chạy, cùng một họ với những lỗi cả stream đang chữa — màn nói sai về chính nó:**

1. **Nền tối vừa che vừa đóng tour.** Bản đầu gắn `onClick={onClose}` lên lớp nền. Cộng với dòng chữ *"làm theo câu trên rồi quay lại"* ở chặng hồ sơ bước, thành ra màn **bảo người ta làm một việc mà chính nó chặn**: bấm vào đâu — kể cả vào đúng chỗ được mời bấm — cũng chỉ làm tour tắt. Prototype làm ngược lại (dòng 412-416: nền **nuốt** click để không bấm nhầm ra ngoài tour); tôi port ngược rồi viết chữ dựa trên bản gốc. Đã theo prototype: nền nuốt click, hai lối ra giữ nguyên (nút **Thoát** và phím **Esc**).
2. **Một câu giải thích duy nhất cho mọi lý do vắng mốc.** Dòng cũ khẳng định chắc nịch *"nó chỉ hiện sau khi bạn thao tác trên màn"* — đúng cho đúng một chặng. Bất kỳ mốc nào khác vắng vì lý do khác đều nhận được lời giải thích sai, mà **một lý do sai tệ hơn không có lý do**. Nay lý do tra theo từng mốc (`absentReason`, `tourStops.ts`): `atlas-inspector` có câu riêng, `atlas-spine` có câu riêng, mốc chưa lường trước rơi vào *"Chưa rõ vì sao — có thể màn đang ở một trạng thái khác…"*.

3. **Lời khuyên nghe hữu ích mà làm không được — lỗi tự gây ra khi sửa lỗi 1.** Câu thay thế đầu tiên là *"thoát tour, chọn một bước, rồi mở lại"*. Nghe hợp lý, nhưng đi thử thì hỏng: mở lại là tour bắt đầu từ chặng `#/cxm`, tour rời khỏi `#/atlas` rồi quay lại, AtlasPage remount, bước vừa chọn mất (`selectedStepId` về `null`, `AtlasPage.tsx:87`) — **đúng cái remount vừa dùng để chứng `atlas-spine` an toàn**, quay lại cắn chính lời khuyên của mình. Nay câu chữ chỉ **mô tả** vì sao chưa tô sáng được, không hứa cách khắc phục. Đường đi hỏng đó đã thành một test riêng, để không ai thấy câu chữ hơi cụt mà viết lại thành lời khuyên.

Kèm theo, một câu hỏi phải trả lời bằng test chứ không bằng suy đoán: flow của Atlas là state cục bộ, vậy người dùng **mở sẵn một flow ngoài pilot rồi bấm chạy tour** thì chặng xương sống có vắng mốc không? **Không** — và vì lý do cấu trúc chứ không phải may: ba chặng atlas đứng sau ba chặng `#/cxm`, nên tour luôn rời `#/atlas` rồi quay lại, AtlasPage remount, flow về mặc định. Đã ghim thành test; xếp một chặng atlas lên đầu danh sách là chỗ đó đỏ trước khi kịp lên demo.

**Không port `tourPrep()`.** Prototype phải đặt tay state trước mỗi chặng (dòng 4723) để component đích chắc chắn tồn tại. Bản React không cần: `#/cxm` và `#/voc` tự mở set `def:true` (đúng hai set prototype đặt tay), `#/atlas` tự chọn flow đang có dữ liệu quan sát, `#/topic/x-th-device` là route có tham số. Chỗ duy nhất prototype đặt tay mà ta cố ý không đặt là bước của hồ sơ — xem trên.

**Chỗ cất state.** Chặng đang xem là UI-selection, mà store cố ý không giữ loại đó (`store.ts:10-11`) — nên nó nằm ở `Shell()`. Ngược lại **bảng chặng** là cấu hình, nên đi qua repository như `getCfg()`/`getDims()`: thêm `getTour()` (`data/repository.ts`, `data/mock-repository.ts`) và `tour` trong store. Thuần cộng thêm, không caller nào phải sửa.

**Một chỗ vá ở môi trường test, cố ý không vá trong code chạy thật.** jsdom không cài `Element.scrollIntoView`. Stub đặt ở `src/test/setup.ts`; bọc lời gọi bằng `typeof … === 'function'` trong component chỉ để test xanh là để lỗ hổng của môi trường test viết lại code chạy thật.

**Phép kiểm đắt nhất:** `TourOverlay.test.tsx` render `<App/>` rồi **đi hết 9 chặng**, mỗi chặng đòi mốc `data-tour` phải có thật trong DOM, và ghim đích danh **đúng một** mốc được phép vắng (`atlas-inspector`). Đổi tên một mốc mà quên `seedTour` — hoặc ngược lại — là đỏ ngay.

**CÒN HỞ, nói trước: vị trí popover và khung sáng chưa được mắt người duyệt.** jsdom không có layout nên `getBoundingClientRect()` trả toàn số 0 — test chứng được tour **đi đúng chỗ và nói đúng chữ**, KHÔNG chứng được popover nằm đẹp hay khung sáng ôm đúng component. Hàm `placePop()` port nguyên từ prototype (dòng 4768) nên rủi ro thấp, nhưng đây là phần duy nhất của tính năng chỉ có test đỡ. Lần chạy này extension trình duyệt không kết nối được nên chưa soi được; **việc cần làm khi mở lại demo: bấm "▶ Chạy bản giới thiệu" và đi hết 9 chặng bằng mắt**, chú ý chặng `atlas-spine` (component rộng, dễ đẩy popover ra ngoài viewport) và chặng cuối `topic-detail` (thân màn cao, khung sáng ôm cả màn).

`tsc -b` sạch, **883 test xanh / 82 file** (thêm 22 test / 2 file — 16 cho bộ máy tour, 6 cho ba lỗi vừa nêu).

## Ba chỗ pilot mở rộng làm hỏng mà không ai nhìn lại — owner chỉ ra 05/08

Cả ba cùng một gốc: **màn được thiết kế khi pilot có một flow / sáu bước, rồi pilot lên hai phase / 6 flow / 30 bước, và không ai quay lại xem thiết kế cũ còn đúng không.** Cùng họ với ba lỗi của bộ máy tour: thứ từng đúng, rồi mặt đất dịch đi.

**Bài học chung, đáng ghim hơn ba lần sửa:** *"một hàng cho mỗi bước"* là thiết kế **phụ thuộc kích thước dữ liệu**. Nó không sai lúc port — nó chỉ có hạn dùng, và không ai ghi hạn đó ra. Chart nào còn dạng một-hàng-một-bản-ghi thì phải trả lời được: **khi map hết 32 flow / vài trăm bước, chart này ra bao nhiêu hàng?** Trả lời "nhiều" là chart đó đang chờ hỏng.

### 1. Bỏ hero + đoạn hướng dẫn đọc ở đầu bản đồ hành trình

Owner yêu cầu bỏ hẳn hai đoạn mở màn (`AtlasPage.tsx`, port prototype dòng 3374-3375):

- Dòng đếm *"32 flow trên 6 phase, 25 flow có nguồn xác minh, 6 flow đang có dữ liệu quan sát."*
- Đoạn *"Chọn phase ở hàng trên… Bề dày dải nối cho biết… 4 phase đang khoá…"*

Lý do giữ lại trong code: ba con số đếm không trả lời câu hỏi nào người dùng đang có, còn đoạn hướng dẫn thì dạy cách đọc một thứ nằm ngay bên dưới và tự nói được.

**Hai nội dung thật trong đoạn cũ KHÔNG mất theo**, và đây là chỗ dễ hỏng nếu ai đó bỏ ẩu: lý do bốn phase bị khoá vẫn in ra chữ khi **bấm vào phase mờ** (`lockedNote`) — đã có test riêng canh đúng đường đó; đường sang VoC theo hành trình vẫn nằm ở điều hướng trái. Có một test ghim *"KHÔNG còn dòng hero"* để không ai "port cho đủ so với prototype" rồi đưa chúng về — **đây là quyết định, không phải chỗ còn thiếu.**

### 2. Khối "Hành trình đang gãy ở đâu?" gộp theo hành trình, thôi một chip mỗi bước

Khối `@journeystate` render `data.steps` — **toàn bộ, không lọc**. Sáu chip hồi pilot một flow; **30 chip** sau khi mở pilot. Owner gọi tên: rối mắt.

**Nhưng lỗi nặng hơn thẩm mỹ, và chính nó quyết định cách sửa: mã bước lặp giữa các flow.** Mã `01` xuất hiện **6 lần** với 6 nghĩa — *Khởi tạo hồ sơ* (mở TK), *Số dư được phép rút* (rút tiền), *Tạo yêu cầu tra soát* (tra soát)… mà chip cũ không nói nó thuộc hành trình nào. Nặng nhất là cặp *"02 Xác thực CCCD · VNeID/NFC"* (mở TK) và *"03 Xác thực CCCD qua VNeID"* (rút tiền): đọc lướt tưởng dữ liệu bị trùng. Tức khối cũ không chỉ nhiều — **nó để người đọc hiểu sai bước nào thuộc hành trình nào.**

Owner chốt phương án **gộp theo hành trình**: mỗi flow một dòng, nêu bước ngoài ngưỡng tệ nhất của nó, kèm *"+N bước nữa ngoài ngưỡng"*. Xếp đau nhất lên đầu. Sáu dòng thay ba mươi chip, hết mập mờ (tên flow đứng ngay đó), và **không phình khi pilot mở rộng tiếp** — thêm flow là thêm một dòng, không phải thêm bảy chip.

Số đo trên seed 05/08: **30 bước — 2 cần xử lý ngay, 11 cần theo dõi, 17 trong ngưỡng.** Tức 17 chip cũ đang chiếm chỗ để nói "không có gì".

**17 bước đó không bị giấu:** ô "Đang kiểm soát" vẫn đếm chúng, và chip mẫu số nói rõ *"Đang hiện 6 hành trình đã khai bước trên 32 flow đã map · 13 trên 30 bước ngoài ngưỡng"*. Ba nghĩa của "không có gì để báo" tách hẳn nhau đúng luật đã áp cho signal chart và ba tab hồ sơ bước: **"flow chưa đo bước nào" ≠ "đã đo, mọi bước trong ngưỡng" ≠ "đã đo, có bước gãy"** — gộp hai cái đầu là để một flow mù trông y hệt một flow khỏe. Seed hôm nay đo hết 30/30 nên ca "chưa đo" được test bằng data rút gọn.

**Còn hở, nói trước:** bấm một dòng vẫn chỉ gọi `onGo("atlas")` — mở bản đồ hành trình ở **flow mặc định**, không nhảy tới đúng flow vừa bấm. Vì flow của `AtlasPage` là state cục bộ chứ không nằm trên URL (`AtlasPage.tsx:84-87`), deep-link đòi đổi Atlas sang route có tham số — ngoài phạm vi lần sửa này. Chữ trên màn chỉ hứa "mở bản đồ hành trình", không hứa hơn.

**Một chỗ dữ liệu chết, nêu chứ không xoá** (quy ước: không dọn code chết có sẵn khi chưa được yêu cầu): `seed.ts:853` còn câu *"Chỉ pilot Mở tài khoản có dữ liệu quan sát. 31 flow còn lại mới map cấu trúc, chưa đo."* — sai từ lúc pilot mở rộng (nay 6 flow đã đo, 26 chưa). **Không hiện lên màn**: trường `sub` của câu hỏi không được component nào render. Nên đây là rác trong fixture, không phải màn nói sai.

### 3. "Độ phủ đo lường" đổi sang phân bố theo dải, thôi một thanh mỗi bước

Cùng bẫy, khối `@coverage`: một thanh cho mỗi bước → **30 thanh** hôm nay. Owner nói thẳng điều kiện nghiệm thu: *"ko thể hiển thị cả chục bar hay cả trăm bar sau khi đủ full hành trình"*.

Điều đó **loại luôn phương án gộp theo hành trình** — dù nó đồng bộ đẹp với khối `@journeystate` vừa sửa, map hết vẫn ra 32 thanh, tức chỉ hoãn đúng vấn đề. Owner chốt **phân bố theo dải độ phủ**: số thanh **không phụ thuộc số bước** — 30 bước hay 300 bước vẫn đúng bốn dải.

| Dải | Đếm (seed 05/08) |
|---|---|
| ≥ 90% · đủ để kết luận | 13 |
| 70–89% · đạt ngưỡng | 11 |
| 50–69% · dưới ngưỡng | 6 |
| < 50% · gần như mù | 0 |

Câu chốt trên đầu: *"24 trên 30 bước đạt ngưỡng phủ 70%"*. Độ phủ thật dao động **57%–99%**.

**Mốc chia dải suy từ `cfg.step.covMin`, không ghim 70 vào code** — owner đổi ngưỡng thì nhãn dải và câu chốt đổi theo, nếu không màn khoe một ngưỡng không còn hiệu lực. Có test riêng: đặt `covMin=80` phải ra `80–89%` và **không** còn `70–89%`; ngưỡng trùng mốc có sẵn (50 hoặc 90) ra **ba** dải chứ không đẻ dải rỗng.

**Dải phủ không tự chỉ được chỗ cần làm**, nên kèm danh sách **mù nhất — cắt cứng ở 3 bước**, phần còn lại đếm ra chữ (*"+3 bước nữa dưới ngưỡng"*). Mỗi dòng nêu **tên hành trình trước mã bước**, đúng lý do đã buộc phải làm thế ở khối trên: mã bước lặp giữa các flow.

**Ba nghĩa của "trống" tách hẳn:** bước **đã khai mà chưa đo** không có độ phủ nên **không thuộc dải nào** — đếm riêng thành một Note, tuyệt đối không dồn vào dải thấp nhất. Seed hôm nay đo hết 30/30 nên ca này test bằng data rút gọn.

**Sửa kèm một chỗ lệch có sẵn:** chip mẫu số cũ ghi *"Đang hiện Top 25 trên 32 **flow** có nguồn xác minh"* trong khi chart vẽ **bước** — mẫu số nói về một thứ, chart vẽ một thứ khác. Nay: *"30 bước đã đo trên 30 bước đã khai · 26 trên 32 flow chưa khai bước nào"*.

**Giữ nguyên D1** (charter Phase 2, owner chốt 01/08 — prototype paint `fx(85)=476`): giá trị khối này không được nhân `fx()`. Nay `v` là **số bước** nên bẫy đổi dạng — `fx()` của một số đếm nhỏ vẫn ra con số trông hợp lý cho "số bước". Nên truyền thẳng `scaled={false}` thay vì chỉ vá ở `formatValue`, và có test canh đích danh.

`tsc -b` sạch, **903 test xanh / 82 file** (+20 test so với mốc trước).

## Quét toàn bộ chart theo tiêu chí "nở theo dữ liệu" — 06/08, owner yêu cầu

Câu hỏi áp cho từng chart: **khi map hết 32 flow / vài trăm bước / taxonomy VoC đầy đủ, chart này ra bao nhiêu hàng?**

**Đã có chặn — không cần làm gì:**

| Chart | Hàng = gì | Cái chặn |
|---|---|---|
| `@coverage` Độ phủ đo lường | dải độ phủ | **cố định 4 dải**, không phụ thuộc dữ liệu |
| `@toppri` Điểm gãy ưu tiên | issue | `.slice(0, 10)` |
| `@intent` Ý định | theme | `.slice(0, TOP_N)` |
| `@themestack` Chồng theme | theme | `.slice(0, TOP_N)` |
| `@lanes` Làn công việc | hằng `LANES` | danh mục cố định trong code |
| `@anomalylanes` | chỉ đếm, không liệt kê | — |
| `@srcmatrix` | không render danh sách nào | — |
| `@outcomes` Kết quả | `data.out` | danh mục kết quả, 2 dòng, không nở theo hành trình |
| Atlas — xương sống | bước của **một** flow | ≤ 7 bước/flow |
| Atlas — chart điểm đo | chiều | 5 chiều, cố định |
| Topic detail — sub-theme | sub-theme của **một** theme | ≤ 2/theme; bằng chứng `.slice(EVIDENCE_N)` |
| `SignalColumns` | signal của một bước | 1 touchpoint/bước ở seed |
| `QuantifyWidget` | do người dùng dựng | `foldRowTail` gộp đuôi |

**Hai chỗ đang chờ hỏng — ĐÃ ĐÓNG CẢ HAI cùng phiên (owner: "làm tiếp đi"):**

**1. `@topictrend` "Topic & xu hướng" — không cắt, và mẫu số nói sai.** `themes.map()` render **mọi** theme thành một dòng bảng: 14 dòng ở seed. Taxonomy VoC là thứ nở nhanh nhất hệ thống — mỗi topic mới là một dòng, vĩnh viễn. Nó là **bảng** chứ không phải bar chart nên chịu được nhiều dòng hơn, nhưng "chịu được" không phải là "có chặn".

Đi kèm một lỗi nói sai đã có sẵn: chip mẫu số ghi *"Đang hiện Top {rising} trên {themes.length} topic đang tăng theo hướng xấu"* — nhưng `tbody` vẽ **toàn bộ** `themes`, không phải `rising` cái. Mẫu số khai một tập con trong khi bảng liệt kê tất cả. Cùng loại với lỗi chip mẫu số của `@coverage` (nói về flow trong khi vẽ bước).

→ **Đã sửa:** cắt `TOP_N = 8` (bằng `ThemeStackBlock`), nút *"Xem hết 14 topic (+6 nữa)"* mở đủ tại chỗ, mở ra thì bảng cuộn trong khung `max-h-[420px]`. Mẫu số đổi thành *"Đang hiện 8 trên 14 topic · 9 đang tăng theo hướng xấu"* — vế đầu nói đúng số dòng đang hiện, `rising` giữ lại thành **vế riêng** vì nó là thông tin thật, chỉ không phải mẫu số.

**2. `@journeystate` "Trạng thái hành trình" — gộp theo hành trình mới chỉ HOÃN.** Số dòng = số flow đã khai bước, nên map hết là **32 dòng** — vẫn rơi vào đúng điều kiện owner đặt cho `@coverage` (*"ko thể hiển thị cả chục bar"*).

→ **Đã sửa:** cắt `TOP_N = 6`, nút *"Xem hết N hành trình"*, mở ra thì cuộn trong `max-h-[320px]`. Mẫu số đổi thành *"Đang hiện 6 trên 6 hành trình đã khai bước (32 flow đã map)"*.

**Một điều đáng ghi về cách test chỗ này:** seed hôm nay có **đúng 6** flow đã khai bước, bằng `TOP_N`, nên nút "Xem hết" chưa bao giờ hiện. Test khẳng định cái chặn có thật thì **không được kết luận từ một seed vừa vặn** — nó dựng thêm 4 flow giả rồi đòi đúng 6 dòng cộng một nút đếm *"+4 nữa"*. Không có bước đó thì test chỉ đang chứng minh seed nhỏ, không chứng minh code cắt.

**Ba khối nay nói cùng một thứ tiếng** (`@coverage`, `@topictrend`, `@journeystate`): hiện phần đáng nhìn, đếm phần còn lại ra chữ, mở đủ khi được yêu cầu, và phần mở ra luôn cuộn trong khung cao cố định.

**Một chỗ không phải chart nhưng cùng bệnh:** hàng chip flow trong một phase của Atlas (`AtlasPage.tsx:270`) — phase "Giao dịch" có **16 flow** nên 16 chip. Nó là thanh điều hướng chứ không phải chart, và đang nằm trong phase khoá, nên chưa gây hại. Ghi để không quên.

## Bấm vào chart độ phủ mở danh sách bước NGAY TẠI ĐÓ (06/08)

Owner đo bằng cách dùng thật: bấm một dải mà nhảy sang bản đồ hành trình thì thấy nguyên một hành trình, **không thấy rõ bước nào đang thiếu dữ liệu**.

Chẩn đoán: bản đồ hành trình trả lời *"khách rơi ở đâu"*, không trả lời *"ta mù ở đâu"*. Đẩy người ta sang đó là đẩy sang một câu hỏi khác rồi để họ tự dịch. Nên:

- **Bấm một dải → mở ngay danh sách bước của dải đó**, tại chỗ, mỗi dòng có tên hành trình + mã bước + độ phủ. Bấm lại hoặc nút **Đóng** để thu.
- **"Xem hết N bước dưới ngưỡng"** mở đủ toàn bộ phần dưới ngưỡng, không chỉ ba bước mù nhất.
- **Dải rỗng vẫn phải trả lời** — người ta vừa bấm vào nó, không được im lặng không mở gì.
- Danh sách **cuộn trong khung cao cố định** (`max-h-[220px]`): mở rộng theo yêu cầu thì được, đẩy card dài vô tận thì lại rơi đúng cái bẫy vừa thoát.
- Đường sang bản đồ hành trình **vẫn còn** nhưng thành link phụ cuối khối, kèm một câu nói rõ mỗi màn trả lời câu gì.

`tsc -b` sạch, **911 test xanh / 82 file**.

## Màn "VoC theo hành trình" `#/vocjourney` — dựng mới 06/08

Màn thứ tám có thân thật (sau `#/cxm`, `#/voc`, `#/atlas`, `#/work`, `#/quantify`, `#/topic`, `#/settings`). Port `V.vocjourney` của prototype (dòng 2671-2759) + `vocInspector` (2762-2823).

**Vì sao nó tồn tại bên cạnh bản đồ hành trình:** cùng ba nhịp điều hướng (phase → flow → chuỗi điểm chạm), khác thứ đo. `#/atlas` đo **hành vi** (bao nhiêu người vào, hoàn tất, rơi); màn này đo **tiếng nói** (khách nói gì ở đó, sắc thái ra sao). Đặt cạnh nhau mới lộ ra chỗ hành vi im lặng mà tiếng nói thì không.

### Phạm vi pilot dời sang `domain/pilotScope.ts`

Hai màn dùng chung rail phase, nên luật "phase nào mở, phase nào khoá, khoá thì nói lý do gì" **không còn nằm trong một màn**. `PILOT_PHASE_CODES` + `phaseLockReason` + `phaseIdOfFlow` từ `AtlasPage.tsx` chuyển hết vào `domain/pilotScope.ts`; cả hai màn đọc một bản. Owner đổi phạm vi thì sửa đúng một chỗ. Để mỗi màn giữ một bản sao là mở đường cho chuyện màn này khoá còn màn kia mở.

### Hai mẫu số cùng sống trên một màn — cái bẫy chính

Đây là chỗ dễ lặp lại đúng lỗi đã sửa ba lần ở `@coverage`/`@topictrend`/`@journeystate`:

| Con số | Nghĩa | Phase 04 Giao dịch |
|---|---|---|
| `TaxNode.n` (tầng L1 gắn với phase) | volume **tổng hợp** taxonomy khai | **1.900** — cao nhất trong sáu phase |
| `Evidence` gắn tới bước | **bằng chứng mẫu**, đếm được từng cái | **51** |

Prototype in `n` lên rail kèm chữ "phản hồi" và in số evidence ở hồ sơ điểm chạm kèm chữ "bằng chứng mẫu" — hai đơn vị, hai chỗ, không nói với nhau. Người đọc lướt rail sẽ kết luận phase 04 nhiều tiếng nói nhất.

**Cách xử:** rail mang **đúng một đơn vị** (bằng chứng mẫu, cùng đơn vị với spine). Số của taxonomy vẫn hiện, nhưng ở đúng một chỗ — `coverageGapLine`, câu nói ra *khoảng cách* giữa hai con số, nơi chênh lệch chính là nội dung.

### Một phát hiện thật khi đo, owner cần biết

Flow **"Mở tài khoản phái sinh"** (5 bước, **51 bằng chứng mẫu**) nằm ở **phase 04 Giao dịch**, không phải phase 02 như tên gọi khiến người ta tưởng. Phase 04 đang **khoá**. Kéo theo:

- Một trong sáu flow đã đo của pilot **không mở được trên cả hai màn** — Atlas lẫn VoC theo hành trình đều khoá phase 04.
- Rail in "51 bằng chứng mẫu" trên một ô bấm không vào được. Đã xử bằng `phaseLockNote`: lý do khoá nay nói cả hai vế — *"…đã có 51 bằng chứng mẫu gắn tới điểm chạm, nhưng vẫn nằm ngoài lượt trình bày"*. **Không** tự mở khoá: phạm vi là quyết định của owner.
- Còn một hệ quả nữa, sát hơn: **cả hai màn tự chọn sẵn một phase khi mới vào**, suy từ flow mặc định — Atlas lấy flow observed đầu tiên, VoC lấy flow có bằng chứng đầu tiên. Nếu biểu thức đó rơi vào một flow ở phase khoá thì màn mới mở đã đứng sẵn bên trong một phase nó vừa báo là chưa mở. Hôm nay chưa xảy ra, và chỉ vì flow phái sinh tình cờ đứng sau trong mảng — **thứ tự mảng, không phải luật**. Đã ghim bằng một test ở mỗi màn: ô phase đang `aria-pressed` khi vừa render không được mang `aria-disabled`.
- **Việc của owner:** có mở phase 04 (hoặc riêng flow phái sinh) vào lượt trình bày không.

### Cắt danh sách — cùng khuôn với ba chart đã sửa

| Chỗ | Nở tới đâu nếu không cắt | Cắt |
|---|---|---|
| Verbatim tại một điểm chạm | **175** (bước `s3`) | hiện 10, đếm phần còn lại ra chữ, mở ra thì cuộn trong `max-h-[520px]` |
| Topic tại một điểm chạm | **16** node theme+subtheme (bước `s2`) | gộp theo **theme cha**, sub-theme thành chip dưới đúng cha; hiện 6 |
| Intent | 4 category cố định | không nở |
| Chuỗi điểm chạm | 4-7 bước/flow | không cần cắt |

Vì sao gộp theo theme cha thay vì cắt danh sách phẳng như prototype: danh sách phẳng trộn hai cấp, cắt theo số đếm thô sẽ **đẩy theme cha xuống dưới sub-theme con của chính nó** — cắt xong mất cha, còn con.

### Ba nghĩa của "trống" ở màn này

`sentimentAtStep` trả `null` khi chưa có bằng chứng nào — **khác hẳn** 0 (đã đọc, thấy trung tính). Trong `demoData` cả 30 bước đều có bằng chứng nên nhánh `null` không bao giờ chạy qua màn; test **dựng thẳng ca rỗng** ra. Một fixture đầy đủ tiện tay là cùng cái bẫy với một fixture nhỏ tiện tay.

Tab Insight là ca chính chứ không phải ngoại lệ: **27 trên 30 bước** chưa có insight nào. Câu chữ tách hai thứ mà một chữ "trống" gộp làm một — *chưa có tiếng nói* và *có tiếng nói nhưng chưa ai tổng hợp*.

### Ba chỗ cố ý không port

- **Đoạn dẫn cách đọc** (2695) — bỏ, cùng lý do đã bỏ ở Atlas. Câu luận đề (2694) thì giữ: đó là nội dung.
- **Banner "bạn vừa mở từ node …"** (2697-2701) — đọc `ST.sel.vocTax`, đặt bởi màn Topic. Bản React chưa có màn nào đặt được giá trị đó, nhánh không tới được.
- **Hai nút gọi `drillFeed(...)`** (2781/2786/2802) — hàm đó **không tồn tại** trong prototype: gọi ở ba chỗ, không khai ở đâu, bấm vào là lỗi. Bỏ vì đích đến không có, không phải vì quên.

### Tour: một chặng mở, một chặng vẫn giữ

`vocjourney` vào `SCREEN_BUILT`, nhưng chỉ **một** trong hai chặng của nó đi được. Chặng `voc-inspector` khai *"Hồ sơ điểm chạm mở sẵn ở tab Verbatim"* (`seed.ts:945`) — màn thật mở ở tab **Topic**, và chỉ mở sau khi bấm chọn một điểm chạm. Giữ theo màn sẽ chôn theo cả chặng nói đúng, tự viết lại câu chữ thì phạm ranh giới "lời dẫn thuộc quyền owner", nên thêm cơ chế **khoá theo tên mốc** (`STALE_STOP`). Tour nay đi **10 trên 18 chặng**. **Việc của owner:** bản chữ mới cho chặng đó.

`tsc -b` sạch, **951 test xanh / 84 file**.

## Màn "Nguồn dữ liệu" `#/sources` — dựng mới 06/08

Màn thứ chín có thân thật. Port `V.sources` (prototype dòng 3671-3757) + `srcProfile` (3600-3665).

**Vì sao khảo sát nằm trong màn này** (giữ nguyên lý do prototype dòng 3666-3669): khảo sát cũng là một nguồn phản hồi, chỉ khác ở chỗ **ta tự tạo ra nó** thay vì chờ khách nói. Để riêng một route thì không bao giờ đọc được tỷ lệ *nghe thụ động so với hỏi chủ động* — mà đó chính là con số nói ra ta đang nghe hay đang hỏi. Hôm nay tỷ lệ đó là **92×**.

### Ba phép đếm toàn vẹn, ba thước khác nhau

Prototype xếp bốn ô số cạnh nhau, ba ô đọc trần là "N/M":

| Ô | Đếm gì | Mẫu số |
|---|---|---|
| Độ tươi | nguồn còn trong SLA của chính nó | **7 nguồn** |
| Tính liên tục | nguồn chưa đứt | **7 nguồn** |
| Độ phủ đo lường | điểm đo đã instrument | **30 điểm đo** |

Bốn ô cùng một hình, hai đơn vị — đúng cái bẫy hai mẫu số vừa xử ở `#/vocjourney`, chỉ chật hơn. **Cách xử:** đơn vị nằm **trong** giá trị (`6/7 nguồn`, `25/30 điểm đo`), nên không có đường nào in trần "6/7" cạnh "25/30". `IntegrityCount` mang theo `unit` như một field bắt buộc, tầng render không bỏ được.

Thêm một chỗ đếm trùng đã sửa: nguồn **đứt hẳn** cũng thoả điều kiện "quá SLA". Prototype trừ nó ở cả hai ô, người đọc thấy hai vấn đề trong khi chỉ có một. Nay `freshnessCount` chỉ đếm trạng thái `stale`.

### Câu cảnh báo cuối màn — thứ đáng nói nhất của lần này

Prototype đóng cứng (dòng 3752): *"Zalo OA ngừng gửi từ 19/07 nên repeat contact **bị đếm thiếu**. Con số 24% trên bảng điều hành **thấp hơn thực tế**."*

Mọi **dữ kiện** trong câu đó đều tra được: nguồn nào đứt, đứt mấy ngày (`lagH` = 192 → 8 ngày), nhận lần cuối (`last`), chỉ số nào ăn nguồn đó (`Source.metrics`), giá trị đang hiện (`Metric.value`). Nay câu đó **sinh từ dữ liệu**, nên đúng với bất kỳ số nguồn hỏng nào — kể cả không nguồn nào hỏng (khối biến mất) hay nhiều nguồn hỏng (mỗi nguồn một dòng).

Riêng **"thấp hơn thực tế" thì không suy được, và tôi đã bỏ.** Công thức của `m-repeat` là *"Khách liên hệ lại ÷ khách có liên hệ"* (`Metric.formula`), mà Zalo OA là một **kênh liên hệ** — mất nó thì hụt **cả tử lẫn mẫu**, dữ liệu không nói được thương số đi lên hay xuống. Màn nay nói ra khoảng hụt rồi **chỉ đúng chủ chỉ số** (`Metric.owner` = CS Center) để hỏi. Cùng kỷ luật với `phaseLockNote`: nói cả hai vế, đừng suy vế không nhìn thấy.

Tiêu đề cũng bỏ chữ "làm sai" vì cùng lý do — *"2 trong 7 nguồn đang có vấn đề, và 2 chỉ số đang ăn dữ liệu từ chúng"* là đúng thứ dữ liệu chứng minh được.

### Hai chỗ khác đã sửa

- **`Math.round(passive / (active || 1))`** — không có khảo sát nào thì prototype trả nguyên tổng volume thụ động dưới dạng "56120×", trông y hệt một phép đo. Nay `ratio` trả `null` và ô số nói bằng chữ ("chưa hỏi").
- **Nhãn mẫu số trong hồ sơ nguồn.** Prototype in `share + "% tổng bản ghi phản hồi"` — owner đã bác đúng cách gọi đó **01/08** (ghi tại `domain/scope.ts:12-15`): mẫu số `scopeTotal` gộp cả nguồn hành vi (~95% tổng) vốn không có lời khách nào. Nhãn nay là **"tín hiệu khách hàng"**.
- **Câu "NPS đang tạm dừng"** không còn đóng cứng tên. Khảo sát nào `status='paused'` thì tự nêu tên mình.

### Cắt danh sách — và một chỗ phải nói rõ để phiên sau đừng đọc nhầm

Hôm nay 7 nguồn, 6 khảo sát nên chưa cắt gì, nhưng một ngân hàng đủ nguồn thì bảng dài vài chục dòng. Cả hai bảng cắt ở **8 dòng**, mở ra thì cuộn trong `max-h-[520px]`. Trong hồ sơ nguồn, phân bố **theo topic** cắt ở 6 (tầng theme có 14 node); bốn phân bố còn lại không cần cắt (intent ≤ 4, sắc thái 3, nền tảng ≤ 4, phase 6) — nói ra chỗ **không** cắt cũng là một phần của luật.

**Lưu ý cho phiên sau:** luật cắt owner duyệt nói về **chart**. Bảng nguồn là một **sổ đăng ký**, không phải chart — nó cắt được vì đã xếp nguồn hỏng lên đầu, nên cái cắt đi luôn là nguồn đang khoẻ. Đừng đọc chỗ này thành "mọi bảng đều cắt".

### Tour: hai chặng mở thêm

`sources` vào `SCREEN_BUILT`, **cả hai chặng đi được** — khác `#/vocjourney` ở chỗ lời dẫn của chặng hồ sơ (*"Bấm một nguồn để mở hồ sơ"*, `seed.ts:940`) tả **đúng** hành vi màn. Mốc `src-profile` chỉ vắng lúc chưa bấm, và ca vắng mốc có câu riêng ở `absentReason` — **vắng mốc thì đi tiếp và nói ra; lời dẫn sai mới phải giữ**. Hai chuyện khác nhau, nay có hai cơ chế khác nhau. Tour đi **12 trên 18 chặng**.

### ⚠️ Màn này là BẢN TẠM — owner chốt 06/08

**Danh sách nguồn dữ liệu chưa chốt.** Bảy nguồn đang hiện là giả định của prototype, không phải kết quả kiểm kê thật. Khi bên dữ liệu chốt đủ nguồn, **màn này phải dựng lại** — owner đã nói rõ như vậy.

Cái gì sẽ đổi, cái gì không:

- **Sẽ đổi:** số dòng trong bảng, ba phép đếm toàn vẹn, ma trận nguồn × chỉ số, và câu cảnh báo (nó sinh từ dữ liệu nên tự đổi theo — không phải sửa tay).
- **KHÔNG nên vứt khi dựng lại:** ba thứ dưới đây là *luật đọc số*, không phải dữ liệu, nên nguồn nào cũng đúng — (1) đơn vị nằm trong kiểu `IntegrityCount` để không in được "N/M" trần, (2) nguồn đứt hẳn không bị đếm lần hai vào ô "trễ", (3) không phán chiều lệch của chỉ số khi nguồn hỏng, chỉ nêu dữ kiện và chỉ đích danh `Metric.owner`.

Nói cách khác: **thân màn là tạm, `domain/sources.ts` thì không.** Dựng lại phần hiển thị, giữ phần số học và bộ test của nó.

### Một chỗ dọn tầng sau khi màn xong

`lagText` — hàm quy `Source.lagH` thành chữ ("trễ 8 ngày") — ban đầu nằm trong `SourceProfile.tsx` và bị `SourcesPage.tsx` import ngược sang. Nó thuần chuỗi, không React, nên đã chuyển xuống `domain/sources.ts` **cạnh `brokenImpacts`** — hai chỗ này cùng quy giờ ra ngày, để tách nhau ra là bảng nói "trễ 7 ngày" còn câu cảnh báo bên dưới nói "8 ngày". Có test riêng cho ba nhánh (dưới 24 giờ, tròn ngày, lẻ giờ) **và** một test đối chiếu thẳng với `brokenImpacts().days`.

`tsc -b` sạch, **999 test xanh / 86 file** tại thời điểm màn Nguồn dữ liệu xong.

# Màn "Topic & xu hướng" `#/topics` — dựng mới 06/08

Màn thứ mười có thân thật, và là màn **cuối cùng** mà tour còn giữ chặng vì "màn chưa dựng". Port `V.topics` (prototype dòng 3853-3891) + `topicLineChart` (3824-3850).

Câu hỏi riêng của màn này là **trục thời gian**: cái gì đang nổi lên, cái gì đã lắng xuống, cái gì mới xuất hiện. `#/sources` hỏi "dữ liệu có về không", `#/vocjourney` hỏi "khách nói ở điểm chạm nào" — không màn nào trả lời được câu này.

## Chỗ quan trọng nhất: KHÔNG port `monthly()`

Prototype vẽ biểu đồ đường **không** trên `pts`, mà trên chuỗi do `monthly()` (dòng 3807-3814) sinh ra: nhận 6 kỳ thật rồi **bịa thêm 6 điểm đầu** bằng ngoại suy tuyến tính ngược, sau đó dán nhãn tháng thật (`MONTHS12`) lên cả 12. Ở mốc "1 năm", một nửa đường là số do công thức đẻ ra, đứng dưới nhãn "08/25 … 01/26" như thể đã đo. Lời chú trong chính prototype cũng nói nó ngoại suy.

Bản React **không cần** hàm đó: fixture ở đây đã có **12 điểm thật** cho cả 14 theme (đo 06/08). Nên chart đọc thẳng `pts`, cắt kỳ bằng `.slice(-months)` — chuỗi ngắn hơn thì trả đúng phần đang có. Có test ghim rằng trục ngang **không viết tên tháng nào**.

Đây là lần thứ ba cùng một loại lỗi bị chặn ở stream này (sau `TaxNode.n` ở `#/vocjourney` và `Source.vol` ở `#/sources`): **một con số được in ra dưới một nhãn mà nó không thuộc về**.

## Không dựng range toggle riêng cho chart

Prototype cho mỗi chart một cụm 3m/6m/1y. App này đã có `TimeframeBar` **chung**, và thanh đó tự chặn ở số kỳ thật rồi nói thẳng *"không nội suy thêm"*. Dựng thêm một cụm nữa là hai chỗ điều khiển cùng một thứ và chúng sẽ lệch nhau — nên `topics` được thêm vào `TIMEFRAME_ROUTES` (`App.tsx`), đúng như lời chú sẵn có ở đó đã dặn từ trước.

Hệ quả cần biết: đổi bộ lọc thời gian **không** ném đi các đường người dùng đã tự chọn (`useState` lazy-init một lần) — có test riêng.

## Luật cắt của chart đường

Chart mở sẵn tối đa **sáu đường**: 3 tăng mạnh nhất + 2 giảm + 1 mới trồi lên, khử trùng. Taxonomy nở bao nhiêu topic thì vẫn sáu, và dải mẫu số **đếm ra chữ** phần không vẽ ("Đang vẽ 6 trên 14 topic"). Số này sinh từ dữ liệu chứ không ghim tay: rút cửa sổ còn 3 kỳ thì nhóm "mới" rỗng và chart mở **5** đường — có test.

Bảng bên dưới **dùng lại nguyên** `TopicTrendBlock` của Tổng quan VoC, vì block đó vốn được thiết kế để trang sở hữu lựa chọn ★ (xem docblock `selectedLines` của nó). Dựng bảng thứ hai là hai bảng cùng nói một chuyện rồi trôi khỏi nhau.

## Hai chỗ dọn tầng

- `ptsFor`/`trendOf` trước nằm private trong `TopicTrendBlock.tsx`, nay ở `domain/topics.ts`. Chart đường và sparkline trong bảng vẽ **cùng một chuỗi** — tách ra là cùng một topic hiện hai hình dạng khác nhau trên cùng một màn.
- Chart đường là component **riêng** (`design-system/TopicLineChart.tsx`), không mở rộng `LineChart` có sẵn: file đó khai đúng hai màu theo hợp đồng cohort của `QuantifyWidget`, sáu đường qua nó thành bốn đường xám giống hệt nhau.

Một lựa chọn thiết kế cố ý khác `signalChart`: chart này dùng **một thang dọc chung** cho mọi đường. Ở chart cột theo điểm đo, câu hỏi là "hình dạng từng nhóm ra sao" nên mỗi nhóm một thang; ở đây câu hỏi là "topic nào to hơn và đang chạy về đâu", cho mỗi topic một thang riêng thì topic 40 và topic 900 trông cao bằng nhau.

## Tour: hai chặng cuối cùng mở ra

`topics` vào `SCREEN_BUILT` → tour đi **14 trên 18 chặng**, và **không còn chặng nào bị giữ vì màn chưa dựng**. Bốn chặng còn lại đều chờ **owner viết lời dẫn mới** (3 chặng `#/work` tả board 4 làn đã bỏ, 1 chặng `voc-inspector` nói hồ sơ mở sẵn ở tab Verbatim). Nhánh "màn chưa dựng" vẫn còn trong code và vẫn có test — dùng một route không tồn tại để chứng minh nó còn sống, vì xoá đi thì màn dựng sau sẽ lặng lẽ vào tour với mốc chưa có.

`tsc -b` sạch, **1036 test xanh / 88 file**.

# Đầu mỗi màn chỉ còn tên tab — luật chung, chốt 06/08

Owner đã bỏ khối câu mở đầu ở Bản đồ hành trình (05/08), rồi bắt gặp nó còn sót ở hai màn mới và chốt thành luật cho **mọi** màn: *"chỉ giữ lại tên tab, bỏ các phần ko quan trọng, tương tự với các tab khác, giữ lại tên tab"*. Áp cho cả tám màn có thân thật, **kể cả ba màn trước đây không in tên nào** (`#/cxm`, `#/voc`, `#/atlas`) — tức đảo lại phần "bỏ h1" của declutter 02/08.

## Vì sao tên tab phải khai một chỗ

Luật này làm một cái tên hiện ở **hai** nơi: mục sáng trong sidebar và dòng tiêu đề đầu màn. Gõ tay ở từng màn thì sớm muộn hai chỗ lệch, và người bấm "Bảng xử lý" sẽ mở ra màn tự xưng tên khác. Nên `NAV_GROUPS` rời khỏi `App.tsx` sang `src/nav.tsx`; sidebar và `PageTitle` cùng đọc từ đó. `navLabel()` **ném** khi gặp route lạ chứ không trả chuỗi rỗng — chuỗi rỗng chỉ hiện thành một dòng trắng, chẳng ai để ý, và một màn in được tiêu đề trong khi sidebar không có mục nào trỏ tới nó là màn lọt vào app không qua điều hướng.

`PageTitle` đặt trong container của **chính màn**, không dựng ở shell: `#/topics` canh giữa theo bề rộng tối đa còn các màn khác dùng padding đều, nên tiêu đề dựng ở shell sẽ lệch khỏi thân màn ở đúng màn đó.

`src/nav.test.tsx` (10 test) canh chính bất biến này, không canh câu chữ của từng màn.

## Bỏ thì phải kiểm từng vế xem nó có mất thông tin không

Ba màn, ba kết luận khác nhau — đây là phần đáng đọc lại nếu sau này có màn mới:

- **`#/topics`** — "14 topic đang mở, 9 đang tăng theo hướng xấu" đã có nguyên vẹn trong dải mẫu số của chart. Bỏ thẳng, không mất gì.
- **`#/sources`** — "2 trong 7 nguồn đang có vấn đề, và 2 chỉ số đang ăn dữ liệu từ chúng" đã có ở khối "Hệ quả cụ thể" cuối màn, và ở đó nêu **đích danh** từng nguồn kèm từng chỉ số — chi tiết hơn hẳn con số tổng. Bỏ thẳng. `atRisk` mất caller cuối cùng nên bỏ cùng import; `metricsAtRisk` vẫn sống vì `ownersAtRisk` gọi nó.
- **`#/work`** — khác hẳn hai màn trên: hai phép đếm "N chờ xác nhận, M chờ duyệt" **không có mặt ở đâu khác trên màn**, xoá thẳng là mất thông tin thật. Owner chọn phương án dời chúng xuống hàng chip có sẵn, thành bốn chip xếp theo thứ tự việc chảy qua (đang tới → chờ duyệt → chờ khép vòng → đã xong). Giữ cả hai nhánh của câu cũ; chip "chờ duyệt" vắng hẳn khi bằng 0, cùng luật với chip "chờ khép vòng" — hàng chip đếm việc **đang** có, không đếm số 0.

Câu luận đề của `#/vocjourney` ("Bản đồ hành trình đo *hành vi*. Màn này đo *tiếng nói* tại cùng những điểm chạm đó.", port prototype dòng 2694) cũng bỏ theo. Đó là lý lẽ **thiết kế** — nó thuộc về tài liệu này chứ không phải thứ người dùng phải đọc lại mỗi lần mở màn. Ghi ở đây để không mất: đó là câu duy nhất nói ra vì sao màn đó tồn tại cạnh `#/atlas`.

Bốn test cũ ghim "không còn `<h1>` nào" hoặc đọc câu mở đầu đều được **viết lại để canh chỗ mới**, không xoá — bỏ một câu chữ không có nghĩa là bỏ nghĩa vụ nói thật của màn.

`tsc -b` sạch, **1047 test xanh / 89 file**.

# Màn "Chỉ số & ngưỡng" `#/rules` — dựng mới 06/08, ĐỦ 7 NHÓM

Charter: `web/docs/module-g-rules-charter.md`. Owner chốt 06/08 (hộp hỏi): dựng màn này trước, và
nhóm SLA nguồn thì **dựng, sinh từ dữ liệu, kèm nhãn bản tạm** — không chừa lại.

`tsc -b` sạch · **1089 test xanh / 99 file** (từ 1047/89) · `vite build` xanh · live-check headless
Chromium, **0 console error** trên cả 7 nhóm.

## Vì sao màn này đi trước, dù trước đó tôi đã hoãn nó

Bản trước tôi ghi cho owner rằng "nửa màn Chỉ số & ngưỡng là chỗ đặt SLA cho từng nguồn — đúng phần
anh vừa nói là chưa chốt", rồi hoãn. **Câu đó sai về tỷ lệ.** Đo lại bốn chỗ trong app đang hứa dẫn
sang màn này: `AnomalyLanes.tsx:62` (ngưỡng Z + kênh nhận) · `AtlasMetricsTab.tsx:67` (ngưỡng từng
chỉ số) · `AtlasPage.tsx:327` (chọn chỉ số theo dõi) · `SourcesPage.tsx:336` (số ngày cooldown).
**Không chỗ nào cần SLA từng nguồn.** Phần bị kiểm-kê-nguồn-chưa-chốt ảnh hưởng đúng **một nhóm trên
bảy**, và là nhóm duy nhất không ai link tới.

Bài học chung: *"màn X bị chặn"* phải đo bằng **chỗ nào đang hứa gì**, không bằng cảm giác về khối
lượng. Tôi đã suýt hoãn thêm một vòng nữa vì một câu ước lượng của chính mình.

## Nhóm 7 đóng luôn E7 của Module E — món nợ từ 04/08

`module-e-charter.md:149` đặc tả E7 (màn sửa ranh giới dải) cùng ngày owner chốt *"nguồn trong
setting sẽ là source of truth"*. Module E làm xong `cfg.segment`, `data/bands.ts` và đường ghi
`setCfg` — **nhưng màn thì không ai dựng**, nên tới hôm nay ranh giới dải vẫn là thứ chỉ sửa được
bằng cách sửa code, đúng cái quyết định đó nói là không nên. Nay bấm được thật.

Kèm theo: đây là lần đầu **tiêu chí #7 của stream signal** ("đổi ranh giới NAV thì lát chia lại
ngay") đi được bằng tay qua UI, không chỉ ở mức hàm.

## Ba quyết định đáng đọc lại

1. **"Trả về mặc định" KHÔNG gán thẳng `cfgDefault.sub`.** `cfg.sub` bị mutate ngoài màn cấu hình
   (`mock-repository.ts` thêm entry khi tạo/nhân bản set, xoá khi xoá set) và `validate.ts:256/272`
   buộc mỗi set có đúng một entry. Gán một cục thì: set tạo trong phiên mất entry ⇒ `setCfg` **ném**
   ⇒ nút reset **tịt đúng lúc cần nhất**. Luật đúng ở `domain/resetCfg.ts`: lặp trên khoá đang có,
   khoá lạ thì đặt `{f:'off', ch:'Email'}` — đúng giá trị repo gán cho set mới. Có test dựng đúng ca
   đó.
2. **Nhóm Trọng số ưu tiên CHỈ ĐỌC, và có test canh chuyện chỉ-đọc.** Fixture lưu điểm tuyệt đối,
   `validateFixture()` khẳng định `sev+aff+jc+rep+tr+reg === total`; cho sửa mà không tính lại
   `total` là bắn banner đỏ mọi màn. Test assert nhóm này **không render ô nhập/select/checkbox
   nào** — vì đây đúng loại ràng buộc một phiên sau dễ vô tình nới ra.
3. **Sửa cut chặn trước, nhưng vẫn bắt lỗi ném ra.** UI tự kiểm bốn ca nói được thành câu (rỗng ·
   không tăng dần · sàn chồng ranh giới đầu · hai dải ra cùng một nhãn), rồi vẫn `try/catch` quanh
   `setCfg` và in nguyên văn. Luật ở `validate.ts` rộng hơn phần UI kiểm được — UI không được giả vờ
   mình biết hết luật.

## Bốn lỗi CHỈ NHÌN MỚI THẤY — test xanh không chứng minh bố cục

Đây là phần đáng giá nhất của đợt này. 28 test của màn xanh hết, `tsc` sạch, 0 console error — và
màn vẫn sai bốn chỗ, tất cả chỉ lộ ra khi mở trình duyệt soi:

| Lỗi | Vì sao test không bắt | Đã sửa thế nào |
|---|---|---|
| **Ô ranh giới cắt mất chữ số** — `200000000` hiện thành `20000000`, `5000000000` thành `50000000` | test đọc `value` của input, không đo bề rộng hiển thị. Đây là **màn nói sai con số của chính nó**, đúng loại lỗi stream này đã chặn ba lần ở chỗ khác | ô rộng riêng cho số nhiều chữ số + cách đọc đi kèm (`= 200tr`, `= 5tỷ`), sinh từ `formatBound()` mới ở `data/bands.ts` — KHÔNG viết bản format thứ hai ở tầng UI |
| **Bảng chỉ số bị bóp**: 7 cột vào ~700px, cột tên là cột duy nhất co được nên tụt xuống **mỗi dòng một chữ**, một dòng cao gần 200px | test tìm theo `data-testid`, không quan tâm cột rộng bao nhiêu | sàn bề rộng `min-w-[880px]` rồi mới cho cuộn ngang; cùng cách cho bảng nguồn |
| **Câu giải thích dài bị cắt cụt** ở hai nhóm | `subtitle` của `Card` có `truncate`, test dùng `toHaveTextContent` nên vẫn khớp | câu dài chuyển xuống thân card; `subtitle` chỉ giữ câu một dòng |
| **Tên bước cắt thành "03 Live…"** trên thẻ kết quả | test khớp badge trạng thái, không đọc tên | thẻ xếp 2 cột thay vì 3, tên **xuống dòng** thay vì cắt |

**Rút ra, ghi cho phiên sau:** với màn nhiều bảng và nhiều ô nhập, *test xanh + tsc sạch* mới chỉ
chứng minh **số và câu chữ**. Bề rộng cột, chữ số bị cắt trong ô, chữ bị `truncate` — không cái nào
có đường đỏ. Phải mở trình duyệt. Máy này chưa bật extension điều khiển Chrome, nhưng **skill
`drive-local-webapp` (Playwright headless) chạy được** — đây là lần đầu dùng nó trong dự án, và nó
bắt được cả bốn lỗi trên trong một lượt.

### Lỗi thứ năm — nằm ngay TRONG bản vá lỗi thứ nhất

Bản vá "ô cắt mất chữ số" ở trên đẻ ra một lỗi cùng loại, và **bốn ảnh chụp màn hình không bắt được
nó** vì nó chỉ hiện ra ở một giá trị không có sẵn trên màn lúc chụp. `formatBound` bản đầu trả `'0đ'`
cho **mọi** mốc dưới 500.000đ. Nên đúng ca dùng owner đặt hàng ở Module E — thêm mốc `1` để tách nhóm
CHƯA CÓ TÀI SẢN — cho ra ô ghi `1` mà chú thích ngay cạnh ghi `= 0đ`. Chú thích sinh ra để chống "màn
nói sai con số của chính nó" lại đi nói sai chính con số đó. Trục tuổi thì ngược lại: mọi chú thích
đều là lặp thừa (`18` → `= 18`).

Đã sửa: `formatBound` trả `string | null` — **`null` nghĩa là số thô đã là cách đọc đúng, đừng in gì
thêm**. Ghim bằng test đơn vị ở `data/bands.test.ts` (`formatBound(1,'đ')` phải là `null`, không được
là `'0đ'`) cộng một test RTL ở `SegmentGroup.test.tsx` gõ `1` vào ô rồi khẳng định không có chuỗi
`= 0đ` nào trong DOM. Đã soi lại bằng trình duyệt cả hai trục.

**Rút ra thêm:** một bản vá cho lỗi "màn nói sai chính nó" **cũng là code mới**, và bản thân nó chưa
có test cho tới khi mình viết. Bốn lỗi trên tìm bằng mắt xong là hết đường đỏ — không có gì giữ chúng
không quay lại. Vá lỗi hiển thị xong thì hỏi tiếp: *phần vừa thêm được ghim bằng cái gì?*

## Ba điều nói thẳng, chưa xử

1. **Nhánh "bước chưa có dữ liệu quan sát" không bấm ra xem được trong demo.** Đo lại fixture:
   **30/30 bước đều có dòng `obs`** — charter tôi viết là "chỉ một phần có quan sát", **sai**. Luật
   loại-bước-chưa-đo vẫn cài như một bất biến của màn (không tự gán "đang ổn" cho bước chưa đo) và
   được ghim bằng test giả lập bỏ `obs` của một bước. Cùng nhóm với các nhánh "có code, có test,
   chưa ai duyệt bằng mắt" đã ghi trước đây.
2. **Hai câu "áp ngay lúc này" của prototype đã BỎ vì không tính được thật:** (a) "volume vượt
   baseline N lần" — prototype so với tỷ lệ **cứng** `1.180/490`, không có chuỗi volume nào trong
   `CxmData` để tính lại; (b) "cooldown và mốc repeat đang hiện nguyên văn trên `#/agents`" — màn
   `#/agents` chưa dựng, và `repeatMin` không hiện ở màn nào. Bỏ hẳn, không thay bằng số khác.
   Hệ quả: `data.anomalyX` là field **sửa được mà chưa có bằng chứng "áp ngay"** đi kèm.
3. **`cfg.segment.values` (danh sách giá trị hợp lệ của chiều `acq`) để CHỈ ĐỌC** — bỏ một giá trị
   đang có khách mang nó không phải "đổi cách chia" mà là tuyên bố dữ liệu đang có là sai, tức một
   quyết định về dữ liệu chứ không phải một ô ngưỡng vận hành. Đây là **suy luận của tôi, owner chưa
   phán** — nói ra để không đọc thành việc còn dở.

## Nợ Module E nay đã hiện ra trước mắt owner

Review Module E section 1 ghi hai chỗ **nhãn nói sai khoảng**, lúc đó không sửa vì chưa có màn nào
cho owner đụng vào cut. Nay có, nên owner sẽ nhìn thấy chúng:

1. `>5tỷ` **sai bao hàm** — biên dưới đóng, nên khách có **đúng** 5 tỷ nằm trong dải mà nhãn bảo là
   hơn 5 tỷ. Đúng phải là `5tỷ+`.
2. Thêm một cut sát 0 thì dải thứ hai mang nhãn `<50tr` trong khi ngay dưới nó đã có dải `0đ` — chữ
   nói sai khoảng, dù hai nhãn không trùng nhau nên luật nhãn-trùng không bắt.

Module G **không sửa** hai chỗ này: `'>5tỷ'` đang là literal trong seed và trong pin của test, sửa
lẻ là đổi nhãn owner đang thấy mà không hỏi.

## Còn hở sau S3c — nói thẳng, đừng đọc thành đã phủ

- **Trạng thái "ghi được một phần" của nút chiều không có đường kiểm bằng mắt trong demo — nhưng KHÔNG phải code chết.** Đã lần lại đủ đường: ràng buộc 1 (`data/validate.ts` ~683-694) buộc cả năm chiều cộng ra đúng `Signal.vol` (Map khởi tạo sẵn cả năm chiều bằng 0, nên một chiều vắng hẳn cũng bị bắt), nên **bộ dữ liệu đã qua kiểm không sinh nổi ca này** — đúng như bản kế hoạch S3 đã nói trước với owner (`output/ke-hoach-s3-chart-diem-do.html`, box "Một điều đi kèm, cần nói ra") và owner đã chốt **không nới ràng buộc 1** chỉ để bấm thử được trong demo. Điều bản kế hoạch chưa nói rõ, tôi kiểm bổ sung: `validate()` **không chặn render**, nó chỉ dựng banner đỏ toàn cục (`App.tsx:75`, `features/quantify/ValidateBanner.tsx`) — nên với **dữ liệu thật** thiếu dòng ở một chiều, app vẫn vẽ, nút chiều đó hiện `partial` kèm *"x% dữ liệu không gán được …"*, **cùng lúc** với banner đỏ nói bảng đếm lệch. Đó là hành vi đúng, không phải xung đột: banner nói với người vận hành pipeline, chữ trên nút nói với người đọc chart. **Đừng xoá nhánh `partial`, và đừng nới ràng buộc 1 để "test cho dễ".** Cái còn hở đúng là: nhánh này chưa từng được **mắt người** duyệt, chỉ được test chứng minh là **chạy đúng**.
- **Trạng thái "khoá" thì CÓ ca thật và đã đo.** Khi `sigCounts` rỗng (Demo Mode TẮT — trạng thái trống trung thực, ghi ở `data/schema/index.ts:52`), chọn `sg1` cho ra **cả năm chiều `locked`** cùng lúc, cột tổng 0, "chưa gắn được khách" = không biết. Đây là đường duy nhất tới `locked` hiện nay, và nó không phải "chiều này không ghi X" mà là "chưa có bảng đếm cho điểm đo này". Panel phải nói đúng nguyên nhân đó (xem S3c-2b).
- ~~**Tour của `#/atlas` chưa nối.**~~ ~~**Bộ máy tour chưa dựng ở React.**~~ — **ĐÃ ĐÓNG HẲN 05/08**, xem mục "Bản giới thiệu có dẫn" bên dưới. Cả ba mốc đã gắn và bộ máy đã chạy qua chúng.
- ~~**Hai trong ba mốc tour chỉ tồn tại CÓ ĐIỀU KIỆN.**~~ **ĐÃ XỬ, nhưng giữ lại vì luật vẫn còn hiệu lực:** `atlas-prail` luôn có; `atlas-spine` chỉ có khi flow đang chọn **có bước**; `atlas-inspector` chỉ có khi **đã chọn một bước**, mà rule 4 nói mới vào màn thì chưa chọn bước nào. `TourOverlay` xử bằng cách **nói ra** khi không tô sáng được, KHÔNG tự chọn sẵn bước cho tour đẹp — chọn hộ là lật rule 4 sau lưng owner.

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

**Cập nhật 05/08/2026 (cuối phiên):** **toàn bộ stream đã xong về code** — S1, S2, S4, S3a-1, S3a-2, S3b, S3c-1, S3c-2a, S3c-2b đã commit; ba đợt cuối (Atlas + khoá phase, ba tab hồ sơ bước, bộ máy tour) đã xong và tự kiểm nhưng **chưa commit**. Các bullet S1-S4 dưới đây **giữ lại làm hồ sơ cái giá đã trả**, không phải việc còn phải làm.

Còn lại, không phải việc code:

1. **Chờ dữ liệu thật.** ~~`Signal.values` phần lớn còn là suy diễn (lỗ hổng A)~~ — **câu này đã sai sau 05/08**, owner chốt bên nghiệp vụ là bên đề xuất đo gì, nên `values` là **đề xuất của mình**, không phải chỗ chờ lấp (xem mục "Pilot mở rộng"). Còn chờ thật: **Bảng D** (định danh element trên web/app) và **Bảng E** (số phễu từng bước — 30 bước đang chạy số demo). Cả hai đã đặc tả ở `output/yeu-cau-du-lieu-pilot-mo-rong.html`. Khi có, phần lớn cột của chart sẽ đổi — đó là chủ ý, không phải hồi quy.
2. **Ba chặng tour của `#/work` chờ owner cấp lời dẫn mới.** `seedTour` (dòng 946-948) tả *"Bốn làn công việc"* / *"Làn Chờ duyệt"* / *"Làn verify"*, nhưng owner đã bỏ board 4 làn. Bộ máy tour đang **giữ ba chặng đó lại và nêu tên** thay vì đọc chữ sai. Có bản chữ mới thì bỏ `"work"` khỏi `STALE_COPY` (`features/tour/tourStops.ts`) là chúng vào lại. Đây là việc **viết chữ**, thuộc owner — không phải việc code.
3. ~~**Hai tab còn lại của hồ sơ bước** và **tour `#/atlas`**~~ ~~**bộ máy tour**~~ — **ĐÃ XONG HẲN 05/08**, xem mục "Hồ sơ bước lên đủ ba tab" và "Bản giới thiệu có dẫn".

- **S2 (ĐÃ XONG) — chiều.** Rút `seg` và `tenure` khỏi danh sách chiều (đã đo: không chart nào dùng; nhớ gỡ **cả** `cfg.segment.band.tenure` cùng lúc — luật quanh `validate.ts:602` lặp trên chính `cfg` nên bỏ sót sẽ sinh lỗi mồ côi). Sửa chữ thường `android`/`ios`/`web` ở chart theme. **Sửa lại một câu sai của bản trước:** `server` **đã có** trong bảng tên đẹp nền tảng (`domain/quantify.ts:46` và `design-system/SrcMatrix.tsx:16`) — không thiếu, đừng thêm lần nữa.
  - **Cái giá đã biết và owner đã đồng ý:** rút `seg` làm **đổi chữ trên dòng drill**. Commit `56128e3` tồn tại đúng để giữ chữ đó ("drill theo seg phải in 'Phân khúc NAV'"). Tài liệu thiết kế §4 nói việc rút này "miễn phí vì không chart nào dùng" — đúng với chart, **sai với panel drill**. Owner đã chấp nhận đổi chữ.
  - `tenure` là chiều **duy nhất** sinh từ seed có sentinel `'chưa-biết'` thật. Test canh sentinel/từ chối phải **chuyển sang một dim khai trong test** trên `tenureMonths` (tiền lệ `projectBands.test.ts:32`), **không được xoá**.
- **S3 (ĐÃ XONG) — chart điểm đo.** Cách đếm đi qua `data.sigCounts` bằng **đường riêng**, không qua `rowBuilder`/`qRun` chung. Cột **"giá trị chưa khai"** (§7). Ba trạng thái của nút chiều (§1): chọn được / chọn được kèm *"x% dữ liệu không gán được nền tảng"* / khoá kèm lý do — **tính từ dữ liệu, tuyệt đối không khai tay**. Nhà của chart: **tab "Touchpoint & signal" của `#/atlas`** — lúc lập kế hoạch `#/atlas` còn là `Placeholder`, nên phải dựng tối thiểu trước (đã xong ở S3c-1): dải pha → chip nhóm/luồng → **spine có dải nối dày mỏng + vạch đỏ** → panel bước chỉ với tab 1 (tab "Chỉ số liên kết" và "Độ phủ dữ liệu" hoãn). Hình tham chiếu: `output/cxm-platform-prototype.html` (`V.atlas`, `journeySpine`, `stepInspector`).
- **S4 (ĐÃ XONG) — dọn.** Bỏ `q16` và `q19`; nhớ gỡ tham chiếu trong `dash` (`seed.ts` có `b:['q17','q18','q19']`) nếu không sẽ lỗi khối treo.
- **Không đụng hành vi bấm thanh.** Owner chốt giữ nguyên. Màn "VoC theo hành trình" chưa dựng và tầng theme chưa khai `maps` — **không còn là chặn** vì không có gì điều hướng.

## Quy ước làm việc

- Trả lời owner bằng **tiếng Việt có dấu**, thuật ngữ kỹ thuật giữ English.
- **Mô tả thiết kế bằng ngôn ngữ nghiệp vụ**, đừng lấy tên biến làm đơn vị giải thích. Mỗi tài liệu có bảng tra *nghiệp vụ ↔ tên code*.
- **Một quyết định thiết kế áp cho MỌI chart, không riêng chart đang bàn** (owner chốt 05/08). Khi owner duyệt một cách vẽ — tông màu, cách gộp/tách đoạn, cách xếp legend, chỗ đặt dòng chú, cách nói khi không có dữ liệu — thì đó là luật của **cả hệ**, kể cả những chart owner không nhắc tên vì lúc ấy không nhìn thấy chúng trên màn. **Đừng khoanh phạm vi về đúng cái chart vừa xem rồi báo "xong"**: làm vậy là để hệ trôi thành nhiều phương ngữ, người dùng gặp hai cách vẽ cho cùng một ý nghĩa.
  - Việc phải làm mỗi lần: **quét hết chỗ dùng** (grep theo token màu / theo nhãn / theo hàm dựng đoạn), liệt kê ra, sửa cùng một lượt.
  - Nếu có chart mà luật mới **làm hỏng chính mục đích của nó**, đó không phải cớ để lặng lẽ chừa ra — **nói với owner trước**, nêu rõ chart nào hỏng chỗ nào, để owner quyết. Chừa mà không nói là vi phạm đúng luật này.
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
