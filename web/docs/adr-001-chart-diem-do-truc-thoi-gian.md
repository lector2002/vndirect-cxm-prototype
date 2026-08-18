# ADR-001 — Chart điểm đo có trục thời gian

Status: **ACCEPTED — toàn bộ.** Owner chốt trực tiếp §1–§4 (bao gồm phần cơ chế đơn vị), §5b và §11
(no-build) ngày 13/08. Bảy mục còn lại (§4b, §5–§10) ra theo uỷ quyền cùng phiên (*"đi hết đi rồi
bảo tôi review tổng thể"*) và **được owner duyệt 14/08** khi ra lệnh dựng (*"gộp luôn khi dựng đi"*).
Từ 14/08 cả 11 mục là ruling đầy đủ; nhãn *uỷ quyền, chờ review* trên từng mục giữ lại làm lịch sử
xuất xứ, không còn nghĩa "chưa duyệt".

> **LẬT §4b — 14/08/2026, owner chốt trực tiếp sau khi nhìn bản dựng.** Nguyên văn: *"với các trường
> hợp có nhiều giá trị thì cho thành line graph nhiều line chung và có cả trục dọc để user biết đơn
> vị, ngoài ra bỏ tất cả '+ điểm %', ko giải thích, chỉ vẽ và show data"*, làm rõ tiếp: *"nhiều đường
> nhưng cần lồng vào nhau đứng chung 1 chart"*.
>
> **Lưới đường nhỏ BỎ HẲN.** Mọi điểm đo, bao nhiêu giá trị cũng vậy, vẽ MỘT chart — mọi giá trị một
> đường, lồng vào nhau trên cùng một trục dọc. Ngưỡng 5 giá trị không còn chia nhánh hình vẽ nào; thứ
> duy nhất còn do máy chọn là ĐƠN VỊ (§4 giữ nguyên).
>
> Lý do lật, đo được trên chính bản dựng: lưới tách mỗi giá trị ra một ô riêng, nên muốn so hai giá
> trị phải nhớ hình ô này rồi nhìn sang ô kia — trong khi câu người xem hỏi luôn là *"cái nào đang ăn
> vào cái nào"*. Xếp hai cột còn hỏng thêm một tầng: ô trái và ô phải nằm trên hai trục ngang khác
> nhau, trong khi dải khối lượng chỉ có MỘT và chạy hết bề ngang — tức không ô nào thật sự chung trục
> với dải, mà "chung trục ngang" chính là toàn bộ lý do §4b cho phép một dải phục vụ cả lưới. Owner
> nhìn đúng chỗ đó: *"các step đang bị tách ra và ko nhìn rõ được"*.
>
> **Ràng buộc 5 màu — thứ vốn đẻ ra §4b — giải bằng HÌNH CỦA ĐIỂM**, không bằng nét đứt: nét đứt trên
> hình này đã có nghĩa riêng (vạch đứt dọc = 0/0) và cho nó nghĩa thứ hai là tái phạm đúng lỗi §5 đã
> sửa một lần. Vòng tròn → vuông → thoi, 5 màu × 3 hình = 15 đường đọc riêng ra được.
>
> **Bỏ mọi con số so sánh.** Chip `±x điểm %` gỡ khỏi màn. Đây là §4b's delta và cũng là luật 11/08
> (app hiện dữ liệu, không luận giải) áp lại lần nữa. Chú giải giữ TÊN + SỐ MỚI NHẤT của từng đường —
> đó là dữ liệu, không phải lời bình. Câu tự khai mốc cắm (§11) rút còn *"Mốc cắm đo: dd/MM/yyyy"*.
>
> Hệ quả code: `SigTrendChart.grid` **gỡ khỏi type domain**; `SigTrendGrid` xoá khỏi design-system.

**Sửa phạm vi 14/08 — dựng bằng cách GỘP ĐỘNG CƠ, không dựng riêng.** Owner chốt: chart này không
dựng thành một đường vẽ thứ hai cạnh `domain/quantify.ts`, mà đi thẳng vào cỗ máy đếm chung. Lý do
đo được: `domain/quantify.ts:197-206` tự ghi rằng nó KHÔNG đếm được điểm đo chỉ vì `qRun` *"không có
khái niệm đang xem signal nào"* — tức hai màn Quantify và Điểm đo đang chạy hai cỗ máy cùng hình
dạng, tách nhau vì một tham số thiếu. Quyết định gộp ghi ở `adr-003-gop-dong-co-dem.md`; mục *Chỗ
chạm* của ADR này đọc theo ADR-003.
Date: 13/08/2026 · phạm vi sửa 14/08/2026
Phạm vi: chart giá trị phát ra của màn Điểm đo (`#/signals`, mặt 4 của hồ sơ điểm đo).
Bản đồ nguồn: `.scratch/chart-diem-do-truc-thoi-gian/map.md`.
Bản dựng thử owner đã nhìn: `output/demo-chart-diem-do-truc-thoi-gian.html`.
Bắt đầu dựng vào `web/` từ 14/08/2026.

Đây là ADR đầu tiên của dự án, nên đặt luôn quy ước: file phẳng trong `web/docs/`, đánh số tăng
dần, tên `adr-NNN-<slug>.md`, có `Status:` / `Date:` / `## Quyết định`. Không tạo thư mục riêng —
`web/docs/` đang phẳng và các charter module đã nằm ở đó.

---

## Bối cảnh

Chart điểm đo hôm nay **không có trục thời gian**. Nó vẽ đúng một kỳ: mỗi giá trị của điểm đo là
một nhóm cột, chia theo một chiều khách. Câu hỏi *"cái này xấu đi từ bao giờ"* không hỏi được, và
điểm đo một giá trị (`sg1 tapped`) vẽ ra đúng một cột — một hình không nói gì.

Ràng buộc cứng có sẵn, không thương lượng được ở ADR này:

- Bảng màu phân loại của dự án **chỉ có 5 màu** (`--cat-1..5`). Giá trị thứ 6 trở đi phải mượn màu
  khác nghĩa hoặc gộp "Khác (+N)" — tức xoá mất đúng cái danh sách lý do mà chart sinh ra để hiện.
- Luật cấm ngoại suy (`monthly()`): không được bịa kỳ từ hệ số.
- Rule 2 của `domain/signalChart.ts`: nhóm rỗng **không** được đọc thành đã-đo-ra-0.
- Không trộn *chưa-biết* với *thiếu*.
- Không khai schema trước chỗ tiêu thụ.
- App **hiển thị dữ liệu, không luận giải** (luật owner 11/08).

Trong 30 điểm đo của seed: 5 điểm đo **0 giá trị** (chưa instrument), **6 điểm đo 1 giá trị**,
6 điểm đo **≥5 giá trị**.

---

## Quyết định

### 1. Lật Đ3 — điểm đo một giá trị không còn vẽ một cột · *owner chốt trực tiếp*

Đ3 (`output/thiet-ke-chart-signal-bo-sung-dot-2.html`) chốt điểm đo một giá trị vẫn vẽ một cột.
**Lật.** Một giá trị thì hình có nghĩa duy nhất là chuỗi theo thời gian.

Giữ nguyên phần Đ3 vẫn đúng: `vol === 0` **không** vẽ chart rỗng giả vờ là 0 — vẫn ra `SigNote`.

### 2. Hai tầng nối nhau, không phải hai mode · *owner chốt trực tiếp*

Một trang: **đường theo thời gian ở trên**, **lát cắt theo nhóm khách ở dưới**. Bấm một điểm trên
đường thì lát cắt nhảy về đúng kỳ đó.

Bác "hai mode có công tắc": công tắc cắt đúng chỗ nối — bấm sang lát cắt là **mất trục thời gian
khỏi màn**, nên không trả lời được *"kỳ đang vọt lên đó là nhóm khách nào"*, đúng câu mà việc thêm
trục thời gian sinh ra để trả lời.

**Lối thoát khi đông giá trị:** từ **5 giá trị trở lên**, tầng trên tự chuyển sang **lưới đường nhỏ** (mỗi giá trị một ô riêng). Máy chọn theo số giá trị, **không
phải nút cho người dùng bấm**. Lý do là ràng buộc cứng 5 màu ở trên, không phải thẩm mỹ.

### 3. Chiều khách chỉ sống ở tầng dưới · *owner chốt trực tiếp*

Tầng trên chia **chỉ theo giá trị của điểm đo**. Chiều khách nằm ở lát cắt.

Bác "chia đường theo chiều khách" (5 giá trị × 5 nhóm = 25 đường). Bác "lọc ở tầng trên" (một bộ
chọn hai vai, và lọc thì phá luôn mẫu số của chính đường đang vẽ).

### 4. Đơn vị: đường TỈ LỆ + dải khối lượng dưới đường — không có công tắc · *owner chốt trực tiếp*

Đây là **Đ2 dịch sang trục thời gian**. Đ2 đã chốt lát cắt phải có "chân đế riêng từng nhóm" — mỗi
nhóm nhìn thấy mẫu số của chính nó. Trên trục thời gian, chân đế đó là một **dải khối lượng chạy
dưới đường, dùng chung trục ngang**: tỉ lệ vọt lên mà dải teo lại thì đọc ra ngay là mẫu nhỏ.

Bác công tắc đếm/tỉ lệ: nút chết ở **6/30 điểm đo** (một giá trị ⇒ tỉ lệ luôn 100%); thêm một trạng
thái nhân với mốc timeframe và chiều khách; và ở `sg4` · mốc 4W (~13 lượt/ngày cho 4 giá trị) tỉ lệ
nhảy hàng chục phần trăm giữa hai ngày liền nhau mà trên màn **không còn dấu vết mẫu số để nghi**.

**Điểm đo một giá trị:** thiết kế tự thu về một đường ĐẾM, không có nút nào để chết.

**Giá đã trả, ghi để không tái tranh luận:** mất xu hướng ĐẾM của riêng một giá trị dưới dạng
đường — tra được bằng cách bấm vào kỳ rồi đọc ở lát cắt dưới, nhưng không thành đường. Owner nhìn
cả hai biến thể dựng thật rồi mới chọn.

Kèm theo, phần mẫu số:

- Tỉ lệ **chỉ mở** ở điểm đo có các giá trị **loại trừ nhau**.
- Mẫu số **luôn** là lượt bắn của **chính điểm đo trong kỳ**, ~~và phải viết đủ vào nhãn trục~~
  — **GẠCH 18/08 tối (owner, dọn tối giản):** câu chú thích *"Đường:… / Dải dưới:…"* dưới chart bỏ
  hẳn — chú thích cách đọc, người dùng không đọc. Luật mẫu số KHÔNG đổi, và vết mẫu số trên màn vẫn
  còn: chính **dải khối lượng dưới đường** là dấu vết đó (lý do bác công tắc ở trên vẫn đứng
  nguyên) — câu caption chỉ là lần phát biểu THỨ HAI của cùng dữ kiện. Trên màn chỉ giữ dòng lệch
  bản khai (`sigtrend-undeclared`) vì đó là dữ liệu, không phải giải thích.
- **Cấm tỉ lệ liên-điểm-đo** ở vòng này. `sg4 ÷ sg3` là tầng công thức của chỉ số — chỗ đó đang có
  khớp đứt riêng (`Metric.value` là chuỗi gõ tay, `Metric.formula` là văn bản hiển thị) và không
  được giải quyết lén qua chart điểm đo. Xem §9.
- Kỳ có tổng = 0 ⇒ tỉ lệ là **0/0, không tính được** ⇒ đường **đứt**, không tụt về 0. Cùng luật
  rule 2 của `signalChart.ts`.

### 4b. Lưới đường nhỏ: mini vẽ tỉ lệ, một dải khối lượng dùng chung · *uỷ quyền, chờ review*

Ô mini cao 52px không đủ chỗ cho dải riêng từng ô. Vì **mọi ô của lưới chia cùng một mẫu số** (tổng
lượt bắn của điểm đo trong kỳ), **một** dải đặt dưới cả lưới phục vụ được hết — vẫn là Đ2, không
phải ngoại lệ của nó.

Bác "mini vẽ ĐẾM": ngưỡng ≥5 giá trị do **máy** chọn (§2), nên một điểm đo được khai thêm giá trị
thứ 5 sẽ **tự nhảy từ tỉ lệ sang đếm mà người dùng không bấm gì**. Đơn vị không được đổi âm thầm
qua một ngưỡng máy chọn.

Ô mini báo thay đổi bằng **điểm %** (`+3,2 điểm %`), không phải "tăng X% của một %".

*(Chế độ nhiều điểm đo từng là chỗ hở của mục này. Đã đóng: §11 no-build.)*

### 5. Cửa sổ: dùng THANH TIMEFRAME CHUNG, không dựng cụm mốc riêng · *uỷ quyền, chờ review*

> Mục này **lật một ruling đã ra sáng cùng ngày** (bộ cửa sổ 1/3/6/12 tháng tự chế). Bằng chứng nằm
> trong chính repo, tìm ra khi tra nốt câu "bộ lọc kỳ là global hay chart-local".

Chart điểm đo đọc **`store/timeframe.ts`** — `RangeKey = default | 7d | 14d | 4w | 3m | 6m | 12m |
custom`, `TimeframeBar` mount một lần ở App Shell. `App.tsx:21` đã ghi tiền lệ lập ngày 06/08:
TopicsPage **cố ý không dựng cụm 3m/6m/1y riêng** mà đọc thanh chung, vì *"hai chỗ điều khiển cùng
một thứ sẽ lệch nhau"*. Bộ 1/3/6/12 tự chế là đúng cái sai đó.

**Việc phải làm khi dựng:** thêm `'signals'` vào `TIMEFRAME_ROUTES` (`App.tsx`) — hôm nay `#/signals`
chưa có thanh vì chưa có chart nào theo kỳ.

**Hạt suy ra từ mốc**, không cho chọn tay:

| Mốc | Hạt | Số kỳ |
| --- | --- | --- |
| 7D | ngày | 7 |
| 14D | ngày | 14 |
| 4W | ngày | 28 |
| 3M | tuần | 13 |
| Default · 6M | tháng | 6 |
| 12M | tháng | 12 |
| Custom | tháng | 6 (tạm bằng Default — chưa có date-picker thật) |

**KHÔNG dùng lại `RANGE_MONTHS` / `effectiveMonths`** của `features/overview/sec.ts`. Chúng gán
7d/14d/4w = 1 tháng rồi kẹp sàn 3 điểm vì dữ liệu VoC/Quantify là **monthly-only**. Chart điểm đo
có mốc thô từng lượt bắn nên ba mốc mịn ở đây là **thật** — đây là surface đầu tiên của app có dữ
liệu ngày thật, và sự thật đó là **theo từng màn, không phải toàn cục**. Ép qua `effectiveMonths()`
sẽ bẻ 7D thành 3 tháng và người dùng đọc thành bộ lọc hỏng.

`data.periods` cũ (`d7` · `d30` · `m3`, kèm `factor` 2,8 / 5,6 / 11) **không dùng lại được**:
`factor` là hệ số nhân số liệu, nhân `vol` với nó để đẻ ra lịch sử chính là `monthly()` đội lốt.

**Kỳ cuối luôn chưa đủ** ở hạt tháng (`asOf` 27/07 nằm giữa tháng) nên phải vẽ khác: **dải nền mờ +
điểm rỗng**, và **dải khối lượng cũng phải đánh dấu** (cột rỗng + dải nền phủ xuống) — cột cuối mới có 27/31 ngày nên thấp hơn
thật, mà đây đúng là ô có nhiệm vụ nói thật về mẫu số. Không đánh dấu thì mọi đường đều đọc thành
"đang tụt".

**Vì sao KHÔNG dùng nét đứt cho kỳ chưa đủ** (sửa 13/08, sau khi owner nhìn bản dựng): trên cùng
một hình, nét đứt đã mang nghĩa khác — **vạch đứt DỌC ở chỗ ngắt = không tính được (0/0)**, §4. Hai
nghĩa khác hẳn nhau mà cùng một thành ngữ, phân biệt chỉ bằng hướng và màu; ở hạt tháng một tháng
tổng 0 sẽ vẽ **cả hai** trên một đường. Nay **"đứt" chỉ còn đúng một nghĩa** — không tính được —
còn chưa-đủ nói bằng **nền**. Ba dấu hiệu của chưa-đủ (dải nền · điểm rỗng · cột rỗng ở dải khối
lượng) đều cùng một nghĩa nên không xung đột nhau.

Cửa sổ phải cắt **theo đúng hạt**: hạt tháng mà cắt thô ở 27/01 thì bucket đầu chỉ có 4 ngày và vẽ
ra một điểm tụt giả.

### 5b. Hạt ngày cho mọi điểm đo, không có ngoại lệ theo lưu lượng · *owner chốt trực tiếp*

Hạt chỉ phụ thuộc **mốc**, một luật duy nhất. Điểm đo thưa vẫn hạt ngày, để hai điểm đo cùng mốc
luôn có cùng trục ngang.

Giá phải trả (mẫu nhỏ nhiễu) được xử bằng dải khối lượng ở §4, **không** bằng cách đổi hạt, và
**không** bằng trung bình trượt — làm mượt là luận giải.

### 6. Hình dạng dữ liệu: bảng đếm thứ hai, và `n` có BA trạng thái · *uỷ quyền, chờ review*

`sigTrend = { sig, val, period, n }`, **`period` ở hạt NGÀY**. Hạt hiển thị (ngày/tuần/tháng) suy
từ mốc (§5) và **cộng lên từ ngày** — bảng chỉ giao hạt mịn nhất, tầng vẽ tự gộp. Nói cách khác
"kỳ phải có mặt với `n = 0`" ở dưới đây nghĩa là **mỗi NGÀY trong cửa sổ đo được**.
**Không** thêm khoá kỳ vào `SigCount` — nhân theo kỳ ra
`sig × val × dim × band × kỳ`, nổ số dòng để mua một khả năng (lọc theo khách ở tầng đường) mà §3
đã bác.

`n` **ba trạng thái**, đây là phần đắt nhất:

1. `n > 0` — đo được, có bắn.
2. `n = 0` — **đo được, không bắn lần nào**. Kỳ này phải **CÓ MẶT** trong bảng. Đường ĐẾM vẽ điểm 0
   (thật); đường TỈ LỆ **đứt** (0/0 không tính được).
3. **chưa đo** — kỳ nằm trước mốc instrument điểm đo, hoặc nguồn chết cả kỳ. Kỳ này **vắng mặt**,
   tầng vẽ để **trống**, KHÔNG vẽ 0.

Trộn (2) với (3) là tái phạm luật *không trộn chưa-biết với thiếu*. **Phụ thuộc Bảng D** (mốc "áp
dụng từ bản build nào"), chưa về — chốt được hình dạng nhưng chưa chốt được cách khai mốc instrument.

**Đường giao đã chọn: THÔ, lưu lâu dài, tự lọc bằng SQL** (owner 13/08). `sigTrend` do đó là một
**truy vấn**, không phải bảng phải xin ai. Mốc từng lượt bắn đã xin hai lần (thiết kế §11 Bảng A;
charter §10) và nay được cấp. Nhánh "cộng sẵn" đóng lại.

**Hệ quả cứng lên SQL — trạng thái (2) không tự có:** `GROUP BY ngày` trên bảng lượt bắn thô
**không bao giờ đẻ ra dòng cho ngày không có lượt nào**. Ngày `n = 0` chỉ xuất hiện nếu **LEFT JOIN
một xương lịch** (calendar spine) chặn hai đầu bằng mốc instrument và `asOf`. Viết ngây thơ thì hoặc
ngày đó biến mất, hoặc tầng vẽ tự điền 0 — đúng rule 2 lộn ngược, một lời bịa.

**Bẫy phải tránh: KHÔNG suy mốc instrument bằng `MIN(fire.at)`.** Điểm đo đã cắm nhưng im suốt
tháng đầu sẽ bị đọc thành *chưa cắm* — trộn *chưa-biết* với *thiếu* ở đúng cái biên mà luật ba
trạng thái sinh ra để giữ. Mốc instrument phải là một trường khai riêng ⇒ **Bảng D vẫn treo**.

Tổng lượt bắn mỗi kỳ mà §4 cần = `SUM(n)` theo `(sig, period)` của chính bảng này.

Ràng buộc tầng: phép cộng ở `data/`, `domain/signalChart.ts` chỉ chiếu.

### 7. Demo Mode sinh lịch sử: `Fire` thêm mốc, cộng lên từ `Fire` · *uỷ quyền, chờ review*

`Fire` thêm một trường mốc (`at`); `genFiresForSignal` rải lượt bắn theo mốc; `sigTrend` **cộng lên
từ chính các `Fire` đó**, không nhân hệ số.

**Vì sao không phải `monthly()` tái phạm:** `monthly()` bị cấm vì nó ngoại suy **dữ liệu thật** rồi
dán nhãn tháng thật. Demo Mode BẬT có điều lệ ngược lại — *"số demo đủ để trình diễn"* — nên sinh
ra lượt bắn là đúng việc của nó. Ranh giới: cấm dùng `Period.factor` nhân `vol` để đẻ lịch sử ở
**cả hai** chế độ; Demo Mode TẮT thì **rỗng**, không phải đường phẳng 0.

Điểm đo bật giữa chuỗi ⇒ đoạn trước là **trống**, không phải 0 (trạng thái 3 của §6).

### 8. Thuộc tính khách lấy ở mốc nào — LỐI (b), nối temporal lúc đọc · *uỷ quyền, chờ review*

> Mục này đã treo với lý do *"chỉ đội dữ liệu trả lời được"*. Owner 13/08: **dữ liệu là thô, lưu
> lâu dài, mình tự kiểm soát và lọc bằng SQL** ⇒ không còn ai để hỏi, đây thành một quyết định
> **thiết kế lưu trữ** của chính mình.

**Việc phải quyết là quyết ở ĐƯỜNG GHI, không phải đường đọc** — và nó **mục theo ngày**: mọi cơ
chế dưới đây chỉ giữ được lịch sử **kể từ hôm bật**. Từng ngày chưa bật là một ngày vĩnh viễn chỉ
có "thuộc tính hôm nay", không vá lại được bằng bất kỳ truy vấn nào về sau.

Ba lối, chọn một:

- **(a) Đóng dấu lên chính dòng lượt bắn** — mỗi `fire` mang theo giá trị thuộc tính lúc bắn. Đọc
  rẻ nhất, chính xác đến từng lượt. Giá: bên **phát** lượt bắn phải biết NAV/tuổi TK — có thể là
  yêu cầu lớn hơn nó trông thấy; và PII rải khắp mọi dòng sự kiện.
- **(b) Bảng snapshot thuộc tính khách theo kỳ** (`khách × ngày|tháng`), nối theo thời gian lúc
  truy vấn. Không đụng bên phát; PII gom **một chỗ**; đổi lại truy vấn có thêm một phép nối
  temporal và độ chính xác chỉ đến hạt của snapshot. **Khuyến nghị.**
- **(c) Nối bảng khách hiện tại lúc đọc** — chính là mặc định đang chạy, nhưng nay là **tự chọn**
  chứ không phải bị hoàn cảnh ép. Chấp nhận được nếu vẫn giữ nhãn nói rõ mốc.

**Đóng dấu GIÁ TRỊ THÔ, không đóng dấu NHÓM** (ở cả (a) và (b)): ranh giới nhóm NAV/tuổi do `cfg`
sở hữu và **đổi được**. Lưu nhóm thì lịch sử hoá đá theo ranh giới cũ và không đọc lại được; lưu
giá trị thô thì chia nhóm lúc đọc bằng `cfg` hôm nay, cả cửa sổ dùng một bộ ranh giới.

**Thu hẹp 13/08 (owner: mỗi dòng có `customer id`, đối chiếu ra NAV/tuổi):** đối chiếu lúc đọc
CHÍNH LÀ lối (c) — nó trả về giá trị **hôm nay** bất kể lượt bắn xảy ra bao giờ, nên có
`customer id` trên mọi dòng **không** trả lời được câu hỏi lịch sử. Nhưng nó thu hẹp câu hỏi rất
nhiều: trong bốn chiều khách (`data/fixtures/seed.ts` bảng `dims`), chỉ **hai** chiều đổi theo
thời gian.

| Chiều | Dữ kiện gốc | Có mục theo ngày không |
| --- | --- | --- |
| `nav` Phân khúc NAV | `navVnd` — nhãn đã tự khai là *"Tài sản hiện tại"* | **CÓ** — đổi từng ngày |
| `tier` Value tier | `tier` | **CÓ** — xét lại theo kỳ, không lưu vết là mất |
| `age` Độ tuổi | `ageYears` | không — suy lại được ở bất kỳ mốc nào từ ngày sinh |
| `acq` Kênh mở TK | `acq` | không — tĩnh theo khách |
| `sigpf` Nền tảng | `pf` của chính lượt bắn | không — `base:'fire'`, đã nằm sẵn trên dòng |

Nên câu phải hỏi hệ thống lưu trữ gọn lại còn một: **có bảng NAV/tier cuối ngày theo tài khoản
không?** Ở một công ty chứng khoán, NAV cuối ngày gần như chắc chắn đã có sẵn cho margin/sao kê —
nếu có, lối (b) **không phải dựng gì ở đường ghi** và phần "mục theo ngày" biến mất. Chỉ khi
không có mới phải bật ghi mới, và khi đó chỉ bật cho `nav` + `tier`.

Kèm theo: dòng lượt bắn có thuộc tính khách là **dữ liệu cá nhân**. Lối (b) giữ nó trong một bảng
có thể phân quyền riêng; lối (a) đem nó vào một bảng sự kiện thường được mở rộng cho nhiều người đọc.

**Chốt 13/08 — lối (b).** Owner: *"khả năng cao là có"* bảng NAV/tier cuối ngày. Lát cắt **nối
temporal lúc đọc**, không dựng gì ở đường ghi.

Bốn luật của phép nối này, phần dễ làm sai:

1. **Nối theo ngày của LƯỢT BẮN**, không phải ngày đầu kỳ hiển thị. Hạt hiển thị cộng lên từ ngày
   (§6) nên mỗi lượt bắn phải mang nhóm của **chính ngày nó xảy ra**. Hệ quả: một khách đổi nhóm
   giữa kỳ thì các lượt bắn của họ nằm ở hai nhóm khác nhau — đúng, vì chart đếm **lượt bắn**,
   không đếm khách, nên không có chuyện đếm trùng.
2. **Lấy giá trị thô, chia nhóm lúc đọc bằng `cfg` hôm nay** (`cfg.segment.band`, `data/bands.ts`).
   Snapshot lưu `navVnd`, không lưu nhãn nhóm. Cả cửa sổ dùng một bộ ranh giới.
3. **Phạm vi lưu phải phủ mốc dài nhất** — 12M của thanh timeframe chung (§5). Phần cửa sổ nằm
   ngoài phạm vi lưu **không** được rơi về thuộc tính hôm nay: đó là trạng thái (3) *chưa đo* của
   §6 lặp lại ở chiều khách, và nhãn khai giới hạn phải ở lại cho đúng phần đó.
4. Chỉ hai chiều cần nối: **`nav`** và **`tier`**. `age` suy từ ngày sinh, `acq` tĩnh, `sigpf` đã
   nằm trên chính dòng lượt bắn.

Nhãn *"nhóm NAV tính theo hôm nay"* **bỏ đi** cho phần cửa sổ có snapshot phủ.

**Sửa 18/08 tối (owner, dọn tối giản):** note lát cắt trên màn rút về MỨC CAVEAT một dòng —
*"Kỳ {label} — lượt bắn theo kỳ, nhóm khách tính theo hôm nay."* — bỏ câu hướng dẫn thao tác
*"bấm lại để xem cả cửa sổ"*. Nhãn vẫn BẮT BUỘC chừng nào còn chạy lối (c); luật *"bỏ nhãn khi có
snapshot phủ"* ngay trên giữ nguyên.

**Trigger lật lại:** bảng cuối ngày hoá ra không có, hoặc chỉ giữ ngắn hơn 12 tháng, hoặc không có
`tier` theo ngày ⇒ quay về mặc định (c) + nhãn cho phần thiếu, và bật ghi snapshot **đúng hai
trường** `navVnd` + `tier` từ hôm đó.

Chỉ chạm tầng dưới — tầng đường không chia theo khách (§3).

### 9. Không nối tầng chỉ số ở vòng này · *uỷ quyền, chờ review*

**Dừng ở chart điểm đo. Mở đường, ghi lại, không nối.** `Metric` không nhận định nghĩa máy đọc được.

Luật nhà: **không khai schema trước chỗ tiêu thụ**. Chưa có consumer nào của `Metric.formula` dạng
máy đọc — thêm field vào là lặp lại vụ `anomalyX` đã bỏ (`data/schema/config.ts:15-20`).

Lý do cứng thứ hai: chỉ số kiểu *"tỉ lệ trượt giấy tờ"* cần mẫu số ở **điểm đo khác** (`sg4 ÷ sg3`),
mà §4 vừa **cấm tỉ lệ liên-điểm-đo**. Nối bây giờ là mở lại đúng cái cửa vừa đóng, ở một chỗ không
ai nhìn.

**Ghi lại để không mất:** `sigTrend` **chính là** chuỗi nguyên liệu của một chỉ số. Khớp đứt đã đo
ở phiên này — `Metric.value` là chuỗi gõ tay, `mval()` `parseFloat` chuỗi đó rồi đem so ngưỡng —
vẫn còn nguyên và **không** được coi là đã giải quyết.

Trigger mở lại: khi tầng chỉ số có consumer thật.

### 10. Giá trị chưa khai trên trục thời gian · *uỷ quyền, chờ review*

Giá trị chưa khai (§7 thiết kế: pipeline bắn ra token không có trong `Signal.values`) **vẫn là một
đường như mọi giá trị khác**, bắt đầu ở **kỳ đầu tiên token đó xuất hiện** — không kéo ngược về đầu
trục bằng 0. Cảnh báo *"cần bổ sung khai báo"* đặt ở **chú giải**, gắn vào đường đó.

Kéo ngược về 0 là nói "kỳ đó đã đo và bằng 0" — sai, và trùng trạng thái 3 của §6.

### 11. Nhiều điểm đo cùng lúc — KHÔNG LÀM · *owner chốt trực tiếp*

**No-build.** Owner 13/08: *"bỏ hướng ghép nhiều đi, chỉ cần từng data được show cho tốt là được"*.
Màn Điểm đo lo **một điểm đo hiện cho tốt**; không có chế độ so nhiều điểm đo trên cùng trục thời
gian. Bản dựng thử đã gỡ khỏi demo.

**Trigger mở lại:** xuất hiện một câu hỏi thật cần **hai điểm đo trên cùng một trục thời gian** —
ví dụ *"eKYC fail và withdraw block có cùng nhích lên hồi tháng nào không"*. Chừng nào chưa có câu
đó thì đây là năng lực không ai xin.

**Cái giữ lại từ vòng dựng thử** (vì nó là luật của MỘT điểm đo, không phải của chế độ ghép): điểm
đo **cắm giữa cửa sổ** ⇒ phần trước mốc cắm để **TRỐNG** — không vẽ 0, không vẽ cột trong dải khối
lượng, không đánh dấu như chỗ ngắt 0/0, và **tự khai trên màn** (*"trống = chưa đo, cắm dd/mm/yyyy"*).
Đó là trạng thái (3) của §6, nay có chỗ hiện thật thay vì chỉ nằm trên giấy. Kèm theo: so sánh trong
lưới §4b lấy mốc **kỳ đầu ĐO ĐƯỢC**, không phải kỳ đầu cửa sổ.
---

## Trigger mở lại

- §4 mở lại nếu *"giá trị X tăng hay giảm theo kỳ"* (xu hướng ĐẾM của riêng một giá trị) thành câu
  hay hỏi. Đó là giá đã biết trước khi chốt, không phải lỗi của ruling.
- §2 (ngưỡng 5 giá trị) mở lại nếu bảng màu phân loại được mở rộng quá 5 màu.
- §5 mở lại nếu `RangeKey` đổi, hoặc nếu bên dữ liệu không giao được mốc thô từng lượt bắn (thiết
  kế §11 Bảng A đã xin, chưa về).
- §6 chốt nốt khi **Bảng D** về.
- §8 lật lại nếu không có bảng NAV/tier cuối ngày, hoặc nó giữ ngắn hơn 12 tháng.
- §11 mở lại nếu có câu hỏi thật cần **hai điểm đo trên cùng một trục thời gian**.
- §9 mở lại khi tầng chỉ số có consumer thật.
