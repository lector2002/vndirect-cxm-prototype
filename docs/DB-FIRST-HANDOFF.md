# DB-first · Chiều phân tích khai báo được — Handoff cho session mới

_Cập nhật: 2026-08-04. Đọc file này + `AI-CONTEXT.md` + `output/thiet-ke-chieu-phan-tich.html` trước khi làm._

## Trạng thái
- `origin/main` = **`56128e3`**, local sync, working tree sạch. `npx tsc -b` sạch, **727/727 test xanh (72 file)**.
- Chuỗi commit của stream này: `c798d2b` (S1 — cuts điều khiển chart thật) → `021f314` (sửa thứ tự doc) → `0e12e6d` (S1 — chốt biên phép rút số thô, 300 khách) → `bcd8bd2` (S2/2a — chiều khai báo được) → `56128e3` (2a — giữ chữ trên dòng drill).
- Tài liệu cho owner (ngôn ngữ nghiệp vụ, có bảng tra *nghiệp vụ ↔ tên code*): `output/thiet-ke-db-first.html` (toàn stream) và `output/thiet-ke-chieu-phan-tich.html` (đợt 2, kèm 3 câu hỏi §8).

## Việc đã xong

**Bước 1 — ranh giới nhóm do owner đặt thật sự điều khiển con số trên chart.**
Trước: nhãn nhóm ("<50tr", "25-34"…) được ghi cứng vào từng khách trong fixture, nên owner đổi ranh giới thì không có gì đổi. Sau: khách chỉ mang **số thô** (tuổi bao nhiêu năm, tài sản bao nhiêu đồng, thâm niên bao nhiêu tháng); nhãn nhóm được **tính lúc đọc dữ liệu** từ ranh giới trong cấu hình. Đổi ranh giới ⇒ chart chia lại nhóm ngay, không sửa dòng code nào. Cấu hình mới được **chiếu thử trước khi nhận**, cấu hình sai thì bị chặn và state cũ giữ nguyên.

**Bước 2 đợt 2a — một cách chia khách = một tờ khai, không còn là code.**
Trước, mỗi cách chia (độ tuổi, phân khúc NAV, thâm niên, segment, value tier, kênh mở TK) nằm rải ở 4 chỗ. Sau, mỗi cách chia là **một dòng khai báo** trỏ vào **danh mục dữ kiện hệ thống đang có về khách** (danh mục này do dev sở hữu, owner không sửa được — đây chính là chỗ chặn việc "khai một chiều mà hệ thống không có dữ liệu"). Nhãn nhóm, luật kiểm tra dữ liệu, và cách đếm của chart đều phái sinh từ tờ khai.

| Nghiệp vụ | Tên trong code |
|---|---|
| Bảng khai các cách chia khách | `dims` (`web/src/data/fixtures/seed.ts`) |
| Danh mục dữ kiện hệ thống có về khách (dev sở hữu) | `web/src/data/rawFields.ts` — `CUST_NUM` (dữ kiện số), `CUST_CAT` (dữ kiện phân loại) |
| Cách chia: theo ngưỡng / theo danh sách giá trị | `dims[id].cut = { kind: 'band' \| 'values', source }` |
| Ranh giới nhóm owner đặt | `cfg.segment.band[id]` · danh sách giá trị hợp lệ: `cfg.segment.values[id]` |
| Nhãn nhóm của một khách | `Customer.bands[id]` (map theo id chiều, **không** còn field cố định `age`/`nav`/`tenure`) |
| Phép tính nhãn từ số thô | `web/src/data/projectBands.ts` |
| Cách đếm của chart cho một chiều | `rowBuilder(dims, id, data)` / `custField(dims, id)` (`web/src/domain/quantify.ts`) |

## Bất biến KHÔNG được tháo
1. Thứ tự tầng `data → store → domain → design-system → features`. **Tầng tính toán (`domain/`) không được biết `cfg` tồn tại** — tờ khai đi vào qua tham số `dims` mà mọi hàm tính đã có sẵn.
2. Bốn nguyên tắc trung thực: `domain/` không bịa tỷ lệ; `'chưa-biết'` ≠ `'thiếu'`; mẫu số không được âm thầm bỏ nhóm không biết; một chiều = một tập giá trị loại trừ nhau.
3. Bốn nghĩa "không biết" không gộp: `chưa-biết`, `thiếu`, `Ẩn danh`, `Chưa đối chiếu được`.
4. **Nhãn dải không bao giờ được gõ tay** — luôn tính từ ranh giới (`data/bands.ts`).
5. Màu gán theo **thứ hạng**, không theo tên giá trị ⇒ nhóm owner tạo ra tự có màu, không cần khai thêm.
6. `Customer.bands` **dựng lại từ đầu** mỗi lần chiếu, không merge — merge sẽ giữ sống nhãn của một chiều đã xoá.

## Bẫy đã trả giá, đừng lặp lại
- **`tsc` KHÔNG bắt được** `{ ...c, age: "25-34" }`: object literal có spread thì excess-property check bị bỏ qua ⇒ gán vào field không tồn tại vẫn compile, test xanh mà không kiểm gì. Đã có 4 ca như vậy trong `validate.test.ts`. Muốn tìm loại lỗi này chỉ có **grep**, không có tsc.
- `const` không hoist: `export const seed` phải nằm **dưới** `dims` và `cfgDefault` trong `seed.ts`.
- Một khai báo sai là **MỘT lỗi cấu hình, không phải 300 lỗi dữ liệu** — kiểm khai báo ở vòng ngoài, đừng để trong vòng lặp theo khách.
- Suite xanh **không** chứng minh "số không đổi" khi kỳ vọng của test cũng bị sửa trong cùng đợt. Muốn khẳng định "ra đúng như trước" thì phải chỉ ra từng chỗ hiển thị và kiểm, hoặc nói rõ chỗ nào đã đổi. (2a đã lệch đúng 1 chỗ: chữ ngữ cảnh trên panel drill — đã sửa ở `56128e3`.)

## Chờ owner trả lời — **blocking cho đợt 2b**
1. Owner được **tạo chiều cắt-ngưỡng MỚI**, hay chỉ được sửa ranh giới của chiều có sẵn? → khuyến nghị: **được tạo mới** (cùng một dữ kiện số có thể cần nhiều cách cắt song song).
2. Owner được **tạo chiều theo danh sách giá trị mới** (kiểu segment/kênh) không? → khuyến nghị: **chưa** — không còn dữ kiện phân loại nào chưa dùng, nút đó sẽ là lời hứa rỗng.
3. Đợt 2a không thêm màn nào cho người dùng — **có ổn không?** → khuyến nghị: **ổn**, nó là điều kiện để 2b không tạo ra chiều mà chart không vẽ được.

Đã chốt từ trước: **độ sâu tuỳ biến** = thêm/bớt **chiều** + lớp hành trình, còn taxonomy 5 tầng thì cố định. **Tham chiếu treo** = **chặn xoá** chiều đang có chart dùng, **cảnh báo** khi đổi ranh giới.

## Đợt 2b — màn thêm/sửa/xoá chiều (làm sau khi có 3 câu trả lời)
- Gom **ba mảnh rời của một chiều** (tờ khai · ranh giới · danh sách giá trị) về một chỗ để sửa, hiện nay đang nằm ở 2 file khác nhau.
- Đường **ghi** tờ khai (hiện chỉ có đường đọc).
- Đếm chiều đang được dùng: phải đếm **cả ba chỗ tham chiếu** — trục chính của chart, trục chia nhỏ (breakdown), và trục của chart theme trong bản đồ hành trình. Đếm thiếu một chỗ là bug thật: cho xoá một chiều mà chart còn dùng.
- Trước khi code màn này: **bàn với owner** (quy ước `web/docs/REBUILD-STATUS.md`: không code trước rồi mới hỏi).

## Đợt 2c — dọn phần hiển thị còn hardcode
- `web/src/features/overview/blocks/ThemeStackBlock.tsx:30` — danh sách trục chỉ có 2 mục ghi cứng, không đọc từ tờ khai.
- `themeAxisOptions(dims)` trả **hai** mục cùng nhãn "Sub-theme" (một là trục subtheme thật, một là chiều `sub` trong `dims`).
- Nền tảng hiện chữ thường `android`/`ios`/`web` ở chart theme, trong khi `PF_LABEL` (`Android`/`iOS`/`Web`) đã có ở `web/src/domain/quantify.ts:46`.

## Việc sau đó (từ `output/thiet-ke-db-first.html` §8)
- Khoá tên/màu hệ thống hai tầng (tên dành riêng + màu của các nhóm "không biết").
- Màn **Chỉ số & ngưỡng** (`#/rules`) hiện là `Placeholder` — chưa dựng.
- CRUD hành trình/taxonomy + quan hệ *theme → step*.
- Xoá các union nhãn dải cũ (`*Band`) khi không còn ai đọc.

## Nợ đã ghi, chưa sửa
Ánh xạ *theme → step* còn là quy ước ngầm · Module E: `>5tỷ` → `5tỷ+`, tách nhãn cuối khỏi `min`, câu chữ `<50tr` đứng trên `0đ`, `bandOf` dựng lại mảng nhãn mỗi lần gọi · Module E section E3–E7 · Module D section 2 · chart đường (#3) và mark nhiều lớp (#4) · nửa sau C5 · Module B · click vào một đoạn bị nổi lên cả hàng · view Donut/bảng chưa click được · class chip lặp ở `ThemeStackBlock.tsx:18-20` và `TimeframeBar.tsx:63`.

## Quy ước làm việc
- Trả lời owner bằng **tiếng Việt có dấu**, giữ thuật ngữ kỹ thuật bằng English.
- **Mô tả thiết kế bằng ngôn ngữ nghiệp vụ**, đừng lấy tên biến làm đơn vị giải thích; buộc phải nhắc thì nói nghĩa trước, tên code trong ngoặc. Có bảng tra *nghiệp vụ ↔ tên code* trong mỗi tài liệu.
- Worker: **chỉ dùng Sonnet**; không SOL/DeepSeek/Terra cho dự án này.
- Kiểm chứng: `cd web && npx tsc -b` (**không** dùng `--noEmit`) rồi `npx vitest run --maxWorkers=2 --testTimeout=30000`.
- Không commit khi chưa được yêu cầu. Owner đã cho phép commit/push và xoá file không cần thiết cho stream này.

## Prompt cho session mới

```
Đọc docs/DB-FIRST-HANDOFF.md, AI-CONTEXT.md và output/thiet-ke-chieu-phan-tich.html.
Stream đang làm: DB-first — cho owner tự định nghĩa cách chia khách. Bước 1 và đợt 2a đã
xong và push (HEAD 56128e3, tsc sạch, 727/727 test xanh).

Việc của session này:
1. Hỏi tôi 3 câu ở mục "Chờ owner trả lời" của handoff — mỗi lần một câu, kèm khuyến nghị
   của bạn. Đợt 2b bị chặn bởi 3 câu này.
2. Sau khi tôi trả lời: chốt phạm vi đợt 2b (màn thêm/sửa/xoá chiều phân tích) và bàn với
   tôi về thiết kế màn TRƯỚC khi code — mô tả bằng ngôn ngữ nghiệp vụ, đừng lấy tên biến
   làm đơn vị giải thích.
3. Nếu tôi muốn làm việc nhẹ hơn trước, làm đợt 2c (dọn 3 chỗ hardcode ở phần hiển thị,
   xem mục "Đợt 2c" — việc này không phụ thuộc 3 câu hỏi trên).

Đừng tháo các bất biến ở mục "Bất biến KHÔNG được tháo". Đọc mục "Bẫy đã trả giá" trước
khi sửa test.
```
