# Module C Charter — Trục phân khúc khách + tính khả dụng + chế độ demo

Nháp Opus 02/08/2026. **ĐÃ CHỐT 02/08/2026** — owner phán: sửa quyết định "chỉ 5 field" thành
"cấm màn tra cứu từng khách"; 4 trục phân khúc được phép với điều kiện chỉ gộp nhóm cho chart tổng
hợp (không cohort viết tay, không timeline, không màn tra cứu). C1/C2/C4 giữ, C3/C5 tiếp tục.

## Vì sao có module này

Owner nêu hai việc, và việc thứ hai làm hỏng việc thứ nhất nếu làm ẩu:

1. Cần cắt số liệu theo chiều phân khúc khách (độ tuổi, NAV, thâm niên, kênh mở TK).
2. **Không phải lúc nào cũng biết khách thuộc phân khúc nào** — ở bước mở tài khoản chưa thể biết
   NAV hay tuổi.

Ghép hai điều đó lại ra một cái bẫy cụ thể: cắt "khách fail bước 03" theo NAV thì chỉ những người
**đã hoàn tất và đã nạp tiền** mới có NAV — tức đúng những người KHÔNG fail vĩnh viễn. Biểu đồ vẽ ra
trông bình thường và sai âm thầm. Đây là survivorship bias, và nó là lý do tồn tại của module này.

## Ba phát hiện từ code hiện tại (đã đo, không suy đoán)

Em từng nói "cơ chế đã có sẵn, chỉ thêm 4 dòng". **Sai.** Đọc lại code cho thấy:

| Nơi | Sự thật | Hệ quả |
|---|---|---|
| `domain/quantify.ts:105-117` `ROW_BUILDERS` | `seg`/`tier` → `byCustGroup` chạy tốt | rank/donut: thêm trục ĐÚNG LÀ rẻ |
| `domain/quantify.ts:163-172` `CROSS_EXTRACT` | **KHÔNG có** `seg`/`tier`/`src` | ghép chéo trục khách trả `empty` (dòng 204) — **matrix rỗng vẽ ra như biểu đồ thật** |
| `domain/quantify.ts:126` `qRun` | `if (!dims[item.show]) return []` | thêm trục mà quên khai `dims` ⇒ **biểu đồ rỗng im lặng**, cùng loại bẫy với class Tailwind không tồn tại |
| `data/fixtures/seed.ts:728-740` `dims` | `seg`/`tier` có `base:'cust'`, KHÔNG có `evAttr` | đúng thiết kế prototype: thuộc tính khách không join được với `ev` |
| `data/fixtures/seed.ts:517-525` `cust` | 7 dòng, `st` là **chuỗi tự do** (`'Bỏ dở tại bước 03'`) | KHÔNG có khoá nối `Customer` → `Step`. "Fail bước 03 cắt theo NAV" **hiện chưa biểu diễn được** |
| `data/fixtures/seed.ts` `q7`/`q8` | cohort series là `t:[{l,p[]}]` **viết tay** | coverage ở đó là **lời khai trong fixture**, không phải số đếm được |

## Quyết định thiết kế — đơn giản hoá mô hình khả dụng

Em từng ghi "tính khả dụng là hàm của (trục × bước × nhóm khách), phải mô hình hoá tường minh".
**Bỏ cách đó.** Thay bằng: **đặt cái chưa biết vào chính giá trị, không vào bảng tra riêng.**

```ts
Customer.nav: NavBand | 'chưa-biết' | 'thiếu'
```

Vì sao đổi: một bảng tra song song với dữ liệu là thứ **trôi lệch được** khỏi dữ liệu — đúng cơ chế
đã sinh ra bug `verdict` ở Module A (hai bản sao của "chiều nào là tốt"). Với sentinel nằm trong giá
trị, coverage của bất kỳ trục nào dưới bất kỳ bộ lọc nào là **số ĐẾM ĐƯỢC**, không phải số khai báo.
Hàm (trục × bước × nhóm) tự rơi ra từ dữ liệu: một khách rớt ở bước 01 thì đơn giản là chưa có tuổi,
vì hành trình của họ chưa đi tới chỗ biết được.

Luật nghiệp vụ (NAV biết sớm với khách chuyển từ CTCK khác; tuổi biết được từ bước 02 khi chụp CCCD)
sống trong **hàm sinh fixture demo** kèm chú thích — KHÔNG thành type lúc chạy.

### Kiểm tra bắt buộc trước khi chốt

> Có biểu đồ nào mà coverage KHÔNG đếm được từ sentinel trong chính các dòng đang vẽ không?

**Có đúng một loại: cohort series viết tay (`chart:'cohort'`, q7/q8).** Số của nó không dẫn xuất từ
`data.cust`.

⇒ **Quyết định: Module C KHÔNG viết thêm cohort series nào cho trục phân khúc.** Biểu đồ phân khúc
chỉ dùng `rank`/`donut` dẫn xuất từ `data.cust`. Nhờ vậy bảng tra biến mất hoàn toàn, và không có
chỗ nào để một con số coverage "được khai" lọt vào.

## Hai loại "không biết" — KHÔNG được gộp

| Giá trị | Nghĩa | Cách chữa |
|---|---|---|
| `'chưa-biết'` | hành trình chưa tới chỗ biết được | **Không chữa được.** Đó là quy luật của hành trình |
| `'thiếu'` | lẽ ra phải biết mà không có | **Bug thu thập dữ liệu**, phải đi sửa |

Gộp hai cái này là biến một quy luật thành một bug, hoặc giấu một bug dưới danh nghĩa quy luật.
Cách chữa ngược nhau hoàn toàn nên không bao giờ được trộn.

**Nhận diện sentinel phải nằm ĐÚNG MỘT CHỖ** — một hằng + một predicate export từ `data/`. So chuỗi
rải rác ba file là tái lập đúng lỗi `mdir` của Module A.

## Bốn trục (owner đã chốt danh sách)

| id | Nhãn | Dải giá trị | Biết được từ khi nào |
|---|---|---|---|
| `age` | Độ tuổi | `18-24` · `25-34` · `35-49` · `50+` | từ bước 02 (chụp CCCD có ngày sinh) |
| `nav` | Phân khúc NAV | `<50tr` · `50-200tr` · `200tr-1tỷ` · `1-5tỷ` · `>5tỷ` | chỉ sau khi nạp tiền — **trừ** khách chuyển từ CTCK khác khai sớm |
| `tenure` | Thâm niên giao dịch | `<6 tháng` · `6-24 tháng` · `2-5 năm` · `>5 năm` | chỉ với khách đã có lịch sử; khách mới luôn `chưa-biết` |
| `acq` | Kênh mở TK | `banner` · `giới thiệu` · `chi nhánh` · `tự tìm` · `đối tác` | **từ chạm đầu tiên** — trục duy nhất phủ ~100% ở bước 01 |

`acq` được chọn (thay vì tỉnh/thành trong lựa chọn "hoặc" của owner) chính vì nó biết được sớm: cần
ít nhất một trục có coverage đầy ở bước đầu để người dùng nhìn ra sự tương phản với `nav`/`age` —
nếu mọi trục đều thủng thì màn hình chỉ dạy được rằng "hệ thống hỏng", không dạy được vì sao.

## Luật vẽ (owner đã chốt)

Trả về từ `domain/`, dạng discriminated union **thuần**, KHÔNG nằm trong component (trong component
thì không test được nếu không render):

```ts
type SegChart =
  | { kind: 'refuse'; reason: string }
  | { kind: 'draw'; rows: DimRow[]; known: number; unknown: number; missing: number };
```

- coverage **0%** → `refuse`, kèm câu giải thích vì sao trục này chưa biết được tại đây.
- coverage **một phần** → `draw`, **luôn** hiện dải `'chưa biết'` (token `unk`) + in rõ tỉ lệ phủ.
  Không bao giờ lặng lẽ bỏ nhóm chưa biết ra khỏi mẫu số.
- ghép chéo (`by`) với trục khách → **`refuse` kèm lý do**, KHÔNG trả matrix rỗng.
  (Sửa luôn hành vi hiện tại của `seg`/`tier` — cùng lớp lỗi, và 4 trục mới nhân nó lên.)

## Coverage THẬT trên seed thật — bản đầu của charter này ĐOÁN SAI

Bản đầu ghi "phần lớn biểu đồ sẽ từ chối vẽ". **Sai.** Suy lại giá trị trung thực cho từng khách
trong 7 dòng `cust` (mọi khách đều đã qua bước 02 nên tuổi biết được hết) cho kết quả:

| Trục | Phủ | Kết quả |
|---|---|---|
| `acq` | 7/7 · 100% | `draw` bình thường |
| `age` | 7/7 · 100% | `draw` bình thường |
| `tenure` | 3/7 · 43% | `draw` + dải chưa biết 4 khách |
| `nav` | **1/7 · 14%** | `draw` + dải chưa biết 6 khách |

⇒ **Nhánh `refuse` (0%) KHÔNG xuất hiện trên seed thật.** Nó vẫn phải viết và phải có test, nhưng
test đó dựng dữ liệu riêng; chỉ fixture demo (C4) mới hiện nhánh này trên UI.

**`nav` 1/7 là hiện vật quan trọng nhất của cả module.** Người duy nhất có NAV là `KH•••9F1` — khách
chuyển từ CTCK khác, đã hoàn tất. Tức biểu đồ tự nói ra cái bẫy owner nêu: ai còn NAV để cắt thì đều
là người đã đi hết hành trình. **Không được "sửa" cho đẹp** — dải chưa-biết chiếm 6/7 chính là nội
dung của biểu đồ đó.

**CẤM tuyệt đối:** không worker nào được thêm dòng vào `cust` của seed thật, hay điền bừa giá trị vào
ô `'chưa-biết'`, để biểu đồ trông đầy hơn. Muốn thấy đủ thì bật demo. *(Bài học Module A: một tiêu
chí nghiệm thu diễn đạt hơi lệch đã khiến worker khoá cứng hành vi sai bằng test. "Dải chưa biết
chiếm gần hết" đọc như một defect với worker, trừ khi charter nói thẳng rằng đó mới là điểm chính.)*

## Chế độ demo + tab System Setting

Tab **Cấu hình hệ thống** — mới hoàn toàn, **KHÔNG phải** màn "Chỉ số & ngưỡng" (6 nhóm threshold
nghiệp vụ; đó là module riêng sau này). Nội dung:

1. **Công tắc demo** — bật thì đổi sang fixture demo (vài trăm khách, phủ đủ trạng thái + đủ dải
   coverage), tắt thì về seed thật. **Chỉ trong phiên, KHÔNG `localStorage`.**
2. **Nút đưa về dữ liệu gốc** — huỷ mọi mutation của phiên.
3. **Thông tin nguồn dữ liệu** — đang dùng fixture nào, số bản ghi từng bảng, kết quả
   `validateFixture()` gần nhất.

KHÔNG đưa hệ số `fx` (baseline 6 tháng) vào tab này — nó là tham số trình bày, không phải cấu hình
hệ thống.

## Bất biến toàn dự án (mọi section đều phải giữ)

- `validateFixture()` trả **rỗng** sau MỌI mutation — **và trên CẢ HAI fixture**, thật lẫn demo.
- Không `localStorage`. Không `any`. Import tương đối có đuôi `.ts`/`.tsx`, `import type` cho type.
- `data/` không import `domain/`. `design-system/` không import `features/`. Feature không import chéo.
- Token VND: cam `#d9531e` chỉ cho tương tác/định danh. `unk` đã có sẵn trong `tailwind.config.js` —
  **KHÔNG thêm palette**, mọi class màu phải đã tồn tại thật.
- Không `git commit`.
- Nợ cũ, **không được lặp lại**: `q5`–`q8` ghi `total:6` trong khi series có 12 điểm. Series mới phải
  ghi đúng ngữ nghĩa `shown`/`total`, không copy dòng cũ.

## Năm section

- **C1** — `schema/cxm.ts` + 4 field vào `Customer` + sentinel (hằng & predicate ở `data/`) +
  `validate.ts` + điền giá trị **trung thực** cho 7 khách seed thật. *Chạy MỘT MÌNH — mọi thứ khác
  phụ thuộc tên field.*
- **C2** — `domain/quantify.ts`: 4 `ROW_BUILDERS`, 4 entry `dims`, hàm coverage, union `refuse`/`draw`,
  chặn ghép chéo trục khách. ∥ **C5**
- **C3** — chart: dải `unk`, dòng in tỉ lệ phủ, trạng thái từ chối vẽ. ∥ **C4**
- **C4** — fixture demo (vài trăm khách) + hàm sinh mang luật khả dụng kèm chú thích. **Đụng
  `data/fixtures/` nên KHÔNG song song được với C1.**
- **C5** — tab Cấu hình hệ thống + công tắc demo. ∥ **C2**

Song song CHỈ khi tập file rời nhau. Opus chứng thực độc lập từng section.

**Đường cắt nếu cần giảm chi phí:** C1+C2 một mình đã cho mô hình trung thực và test được headless.
C4 (vài trăm khách) là phần đắt nhất và là thứ cắt được sau cùng.

## Yêu cầu riêng cho reviewer độc lập (bắt buộc — bài học Module A)

Không chỉ hỏi "code có khớp charter không". Phải hỏi thêm:

- **(a)** Mọi luật coverage/unknown trong charter có **thật sự tính được** từ các shape dữ liệu đang
  tồn tại không?
- **(b)** Có biểu đồ nào trong charter đi tới đường render **rỗng im lặng** không —
  `qRun` thiếu `dims`, hay `qRunCross` thiếu `CROSS_EXTRACT`?
