# Chart theo điểm đo (signal) — Handoff cho session mới

_Cập nhật: 2026-08-04. Đọc file này + `AI-CONTEXT.md` + **`output/thiet-ke-chart-signal.html`** trước khi làm._

## Trạng thái

- `origin/main` = **`fa68c39`**. **Working tree CÓ THAY ĐỔI CHƯA COMMIT** — toàn bộ S1 (13 file). Owner chưa trả lời câu hỏi có commit hay không; **đừng tự commit**.
- `npx tsc -b` sạch. **749/749 test xanh (73 file)** — mốc trước S1 là 727/72.
- Tài liệu thiết kế owner đã duyệt: **`output/thiet-ke-chart-signal.html`** — nguồn sự thật cho stream này, đọc trước khi code. `output/thiet-ke-chieu-phan-tich.html` và `output/thiet-ke-db-first.html` là của stream trước, còn giá trị lịch sử.

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
- **MỚI (S1) — cổng kiểm bỏ qua đúng ca nguy hiểm nhất.** Luật "tổng phải khớp `vol`" ban đầu `continue` khi không có dòng nào để cộng ⇒ điểm đo `vol > 0` mà quên khai `values` thì chart rỗng, cổng vẫn xanh. Đã đóng, và phân biệt: **cả bảng rỗng = Demo Mode TẮT = hợp lệ**; riêng một điểm đo vắng mặt = lỗi.

## Còn hở — phải nói với owner, đừng lặng lẽ mang đi

**`Signal.values` hiện phần lớn là SUY DIỄN, không phải số đo.** Chỉ `sg4` có căn cứ trực tiếp từ `desc` (blur/glare/crop/expired). Chín điểm đo còn lại do worker suy từ tên/mô tả. Đây chính là **lỗ hổng A ở §2** của tài liệu — phải xin team data. Khi có danh sách thật, **phần lớn cột của chart sẽ đổi**.

Tỉ lệ `custKey` null trong demo cũng là số đặt tay, không phải số đo: `sg1`/`sg2` = 0.92 (trước mọi bước định danh) giảm dần tới `sg10` = 0.05. Riêng `sg4` neo đúng **0.31** để khớp ví dụ "31% chưa gắn được với khách" trong tài liệu §1.

## Việc còn lại của stream

- **S2 — chiều.** Rút `seg` và `tenure` khỏi danh sách chiều (đã đo: không chart nào dùng; nhớ gỡ **cả** `cfg.segment.band.tenure` cùng lúc — luật quanh `validate.ts:602` lặp trên chính `cfg` nên bỏ sót sẽ sinh lỗi mồ côi). Bảng tên đẹp nền tảng hiện chỉ có Android/iOS/Web — **thiếu `server`** (`sg10` là điểm đo phía server). Sửa chữ thường `android`/`ios`/`web` ở chart theme.
- **S3 — chart điểm đo.** Cách đếm đi qua `data.sigCounts` bằng **đường riêng**, không qua `rowBuilder`/`qRun` chung. Cột **"giá trị chưa khai"** (§7). Ba trạng thái của nút chiều (§1): chọn được / chọn được kèm *"x% dữ liệu không gán được nền tảng"* / khoá kèm lý do — **tính từ dữ liệu, tuyệt đối không khai tay**.
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
