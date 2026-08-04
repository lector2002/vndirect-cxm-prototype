# Chart theo điểm đo (signal) — Handoff cho session mới

_Cập nhật: 2026-08-04. Đọc file này + `AI-CONTEXT.md` + **`output/thiet-ke-chart-signal.html`** trước khi làm._

## Trạng thái

- `main` = **`3a43c2c`**. S1 **đã commit** (`ca3cfc0` nền dữ liệu + `3a43c2c` tài liệu thiết kế) — câu "working tree có 13 file chưa commit" ở bản trước đã lạc hậu, bỏ.
- `npx tsc -b` sạch. **749/749 test xanh (73 file)** — mốc trước S1 là 727/72. Đây là mốc để đối chiếu S2/S4.
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

## S2 + S4 — ĐÃ XONG, đã tự kiểm (04/08, chưa commit)

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

- **S2 — chiều.** Rút `seg` và `tenure` khỏi danh sách chiều (đã đo: không chart nào dùng; nhớ gỡ **cả** `cfg.segment.band.tenure` cùng lúc — luật quanh `validate.ts:602` lặp trên chính `cfg` nên bỏ sót sẽ sinh lỗi mồ côi). Sửa chữ thường `android`/`ios`/`web` ở chart theme. **Sửa lại một câu sai của bản trước:** `server` **đã có** trong bảng tên đẹp nền tảng (`domain/quantify.ts:46` và `design-system/SrcMatrix.tsx:16`) — không thiếu, đừng thêm lần nữa.
  - **Cái giá đã biết và owner đã đồng ý:** rút `seg` làm **đổi chữ trên dòng drill**. Commit `56128e3` tồn tại đúng để giữ chữ đó ("drill theo seg phải in 'Phân khúc NAV'"). Tài liệu thiết kế §4 nói việc rút này "miễn phí vì không chart nào dùng" — đúng với chart, **sai với panel drill**. Owner đã chấp nhận đổi chữ.
  - `tenure` là chiều **duy nhất** sinh từ seed có sentinel `'chưa-biết'` thật. Test canh sentinel/từ chối phải **chuyển sang một dim khai trong test** trên `tenureMonths` (tiền lệ `projectBands.test.ts:32`), **không được xoá**.
- **S3 — chart điểm đo.** Cách đếm đi qua `data.sigCounts` bằng **đường riêng**, không qua `rowBuilder`/`qRun` chung. Cột **"giá trị chưa khai"** (§7). Ba trạng thái của nút chiều (§1): chọn được / chọn được kèm *"x% dữ liệu không gán được nền tảng"* / khoá kèm lý do — **tính từ dữ liệu, tuyệt đối không khai tay**. Nhà của chart: **tab "Touchpoint & signal" của `#/atlas`** — mà `#/atlas` hiện là `Placeholder` trong React (`App.tsx:152`), nên phải dựng tối thiểu trước: dải pha → chip nhóm/luồng → **spine có dải nối dày mỏng + vạch đỏ** → panel bước chỉ với tab 1 (tab "Chỉ số liên kết" và "Độ phủ dữ liệu" hoãn). Hình tham chiếu: `output/cxm-platform-prototype.html` (`V.atlas`, `journeySpine`, `stepInspector`).
- **S4 — dọn.** Bỏ `q16` và `q19`; nhớ gỡ tham chiếu trong `dash` (`seed.ts` có `b:['q17','q18','q19']`) nếu không sẽ lỗi khối treo.
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
