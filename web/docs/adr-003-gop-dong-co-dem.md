# ADR-003 — Gộp động cơ đếm của Quantify và Điểm đo

Status: **ACCEPTED.** Owner chốt 14/08/2026: *"gộp luôn khi dựng đi"* — chọn dựng chart trục thời
gian (ADR-001) THẲNG vào cỗ máy chung thay vì dựng riêng rồi gộp sau.
Date: 14/08/2026
Phạm vi: tầng đếm dùng chung của `#/quantify` và `#/signals`. **Không** đụng bố cục hai màn, không
gộp mục sidebar — đó là câu hỏi IA còn treo, xem *Không thuộc phạm vi*.

---

## Bối cảnh

Owner hỏi thẳng: *"quantify hiện tại cũng chỉ là từ 1 data đo biến thành chart, vậy thì có thể gộp
lại được ko"*. Đo lại bằng code thì câu hỏi đó đúng, và bằng chứng nằm trong chính comment của repo
— `domain/signalChart.ts:15`:

> *"KHÔNG qua `rowBuilder`/`qRun` (domain/quantify.ts) — chart này đếm trên đường riêng qua
> `sigCounts` …, rowBuilder đếm trên `data.tax`/`data.ev`/`data.cust`, một trục hoàn toàn khác"*

và `domain/quantify.ts:197-206`, nói ra lý do thật của chỗ tách:

> *"`qRun` ở đây không có khái niệm 'đang xem signal nào' nên KHÔNG CÓ cách đếm qua đường chung cho
> chiều này"*

Tức hai màn chạy hai cỗ máy **cùng hình dạng** — đếm một thứ → cắt theo một chiều → vẽ — tách nhau
vì **một tham số thiếu**, không vì hai bài toán khác nhau.

## Quyết định

### 1. Hạt THÔ là nguồn chung; hai bảng đếm đều là TRUY VẤN trên nó

`SigFire = { sigId, val, custKey, pf, at }` (`data/projectSignalCounts.ts`) lên `CxmData.sigFires`.
Từ đó:

| Câu hỏi | Phép chiếu | Ghi ở |
| --- | --- | --- |
| cắt theo nhóm khách | `projectSignalCounts(fires, cust, dims, win?)` | `data/projectSignalCounts.ts` |
| chuỗi theo ngày | `projectSigTrend(fires, signal, win)` | `data/projectSigTrend.ts` |

Đây đúng đường giao owner chốt 13/08 (*"thô, lưu lâu dài, tự lọc bằng SQL"*) và đúng câu ADR-001 §6
đã viết: `sigTrend` là **một truy vấn**, không phải bảng phải xin.

**Vì sao không thể chỉ giữ một bảng đã cộng sẵn:** ADR-001 §2 buộc *bấm một điểm trên đường thì lát
cắt nhảy về đúng kỳ đó*. `SigCount` không có khoá kỳ và §6 **cấm thêm** (nhân theo kỳ nổ số dòng để
mua một khả năng §3 đã bác); chuỗi theo ngày thì không có nhóm khách. Không bảng cộng-sẵn nào phục
vụ được lát cắt-theo-kỳ. `sigCounts` vẫn ở lại vì bên dữ liệu có thể giao sẵn hình đó.

### 2. Tham số thiếu bổ sung ở `sigCut`, KHÔNG nhét vào `qRun`

`domain/sigCut.ts` là **một cửa duy nhất** cho câu *"điểm đo X, cắt theo chiều D, trong kỳ P"*, dùng
chung phép cộng của `data/`. `rowBuilder` vẫn trả `undefined` cho `base:'fire'`.

Bác phương án cho `qRun` tự đoán điểm đo: `qRun(item, data, dims)` thật sự **không biết** đang xem
điểm đo nào. Gộp động cơ là cho hai lối vào chung một cỗ máy, không phải xoá một sự thật để hình vẽ
gọn hơn. Một builder luôn-rỗng ở đó sẽ làm chính phép kiểm *"thiếu là biểu đồ rỗng im lặng"* xanh
trong khi tạo ra đúng cái nó canh.

**Chưa thêm `QuantifyShow.sig`.** Luật nhà: không khai schema trước chỗ tiêu thụ. Ngày `#/quantify`
lưu được một lát cắt điểm đo vào thư viện thì field đó mới có người dùng; hôm nay ngữ cảnh điểm đo
đi qua tham số hàm.

### 3. Số lượt bắn đang xét đọc TỪ DÒNG ĐẾM, không đọc `Signal.vol`

`volOf()` trong `domain/signalChart.ts`. Với bảng đầy đủ, hai cách cho cùng một số (ràng buộc 1 của
`validate.ts` bảo đảm). Với bảng **đã cắt theo kỳ**, `Signal.vol` là tổng cả đời điểm đo — lấy làm
mẫu số thì tỉ lệ *"chưa gắn được khách"* nhỏ đi theo đúng tỉ lệ độ dài cửa sổ, và mọi chiều tụt
thành `partial` chỉ vì cửa sổ ngắn hơn lịch sử. Sai mà không có gì đỏ.

Thứ tự đọc: một chiều khách bất kỳ, rồi `sigpf` làm chỗ dựa cuối (ca hợp lệ chỉ có dòng ở `sigpf`
vẫn phải hiện ra kèm *"chưa gắn được khách: không biết"*, không được biến mất khỏi chart).

### 4. Đòi cắt theo kỳ mà chỉ có bảng cộng sẵn ⇒ NÓI KHÔNG LÀM ĐƯỢC

`sigCut` trả `refuse` kèm lý do. Trả cả đời điểm đo cho một người vừa bấm vào một kỳ là trả lời sai
một câu hỏi rõ ràng, ở đúng chỗ không ai kiểm được.

### 5. Giá trị chưa khai thôi là lỗi của `validateFixture`

Luật nhóm 22 *"giá trị không có trong `Signal.values` đã khai"* **gỡ bỏ**. Chú thích của chính nó đã
tự khai là tạm (*"cột giá trị chưa khai là việc của section sau"*), và section sau (ADR-001 §10) lật
nghĩa: token bản khai chưa có là **tình trạng phải hiện lên màn**, không phải lỗi dữ liệu.

Lý do cứng: `validateFixture` là cổng CHẶN — `setCfg` ném khi có lỗi mới và banner đỏ hiện trên mọi
màn. Giữ luật này nghĩa là pipeline bắn ra một lý do thất bại mới sẽ làm cả app báo hỏng, trong khi
đó đúng là thứ chart sinh ra để phát hiện. Đây cũng là lỗ hổng A của thiết kế: giá trị do đội dữ
liệu **KHAI**, không quét ngược — nên bản khai chậm hơn dữ liệu là trạng thái bình thường.

**Cái mất, ghi rõ:** gõ sai một giá trị trong fixture không còn bị bắt ở `validate`. Đổi lại nó hiện
trên chart thành một đường có cảnh báo — thấy được, ở đúng chỗ người khai đang nhìn.

### 6. `Signal.instAt` — mốc cắm đo, khai riêng, KHÔNG suy từ `MIN(fire.at)`

Xương lịch của `projectSigTrend` tiêu thụ nó ngay trong lát này nên khai bây giờ là hợp luật. Fixture
thật khai `null` cả 30 (**Bảng D còn treo**); Demo Mode điền tất định. `null` ⇒ chart **từ chối vẽ**
chuỗi, vì không có biên trái thì mọi ngày rỗng đều mơ hồ giữa *đo được, không bắn* và *chưa đo*.

### 7. Hạt thô có nhóm bất biến của riêng nó — `validate` nhóm 26

Gỡ nhóm 22 (mục 5) không có nghĩa là hạt thô đi vào `CxmData` mà không ai canh. `validateFixture`
nhóm 26 canh sáu điều: `at` đúng khuôn `yyyy-MM-dd` · `at ≤ asOf` · `sigId` tra ra điểm đo ·
`custKey` là `null` hoặc tra ra khách · `instAt` đúng khuôn khi khác `null` · `at ≥ instAt` · và
ràng buộc 1 **bản hạt thô** (đếm thẳng từ fires = `Signal.vol`).

Hai luật giữa là chỗ đắt nhất, vì cả hai đều **lệch im lặng**: một lượt bắn sau `asOf` không kỳ nào
đếm tới, một lượt bắn trước `instAt` rơi khỏi xương lịch của chart nhưng vẫn cộng vào `vol` — hai
con số trên cùng một màn lệch nhau mà không có gì đỏ. Sau mục 3, `volOf` lấy mẫu số từ dòng đếm nên
hạt thô lệch bản khai là **mọi tỉ lệ trên chart** lệch theo.

Generator của Demo Mode hôm nay bảo đảm cả sáu **bằng cách dựng**. Đó không phải lý do bỏ nhóm này:
`validate` có mặt cho lúc cách dựng trôi đi, và cho ngày pipeline thật thay generator. Bộ test bẻ
demoData ở đúng sáu chỗ rồi đòi validate chỉ ra đúng chỗ đó.

### 8. ~~Nhánh LƯỚI~~ — **BỎ, owner lật 14/08**

Mục này từng nói lưới đường nhỏ phải có dải khối lượng dùng chung và nút bấm kỳ. Owner nhìn bản dựng
rồi chốt bỏ hẳn lưới: *"nhiều đường nhưng cần lồng vào nhau đứng chung 1 chart"*. Xem khối lật §4b ở
đầu `adr-001-chart-diem-do-truc-thoi-gian.md`. Giữ mục này làm lịch sử để không dựng lại lưới.

### 8b. Nhánh lưới cũ (giữ làm lịch sử)

ADR-001 §4b: ô mini vẽ **tỉ lệ**, nên mẫu số phải hiện ra ở đâu đó — **một** dải đặt dưới cả lưới
phục vụ được hết (mọi ô chia CÙNG một mẫu số), vẫn là Đ2 chứ không phải ngoại lệ của Đ2. Ô mini cao
52px không đủ chỗ cho dải riêng, và dải riêng cũng chỉ vẽ lại đúng một hình.

Nhánh lưới cũng nhận CÙNG bộ nút bấm kỳ của §2: không có dòng nào miễn trừ nó, mà lưới lại đúng là
nhánh **máy chọn hộ** — người xem không bấm gì để rơi vào đó nên cũng không có lý do gì để mất một
khả năng.

## Không thuộc phạm vi

- **Gộp MÀN** (một mục sidebar, hai tab, hay bỏ hẳn một màn) — câu hỏi IA, chưa chốt.
- **Đưa Chỉ số & ngưỡng về màn hành trình** — đã đo được 3/8 nhóm `#/rules` chuyển được, 4 nhóm buộc
  ở lại; chờ owner chốt hình.
- **Lịch sử điểm gãy + màn chi tiết** (Module H, Module B) — owner để lại sau chart.
- Nối tầng chỉ số — ADR-001 §9 giữ nguyên: dừng, mở đường, ghi lại.

## Trigger mở lại

- Bên dữ liệu KHÔNG giao được mốc thô từng lượt bắn ⇒ mục 1 sập, lát cắt theo kỳ mất theo.
- `#/quantify` cần lưu lát cắt điểm đo vào thư viện ⇒ `QuantifyShow.sig` mới được khai (mục 2).
- Có consumer thật cho chuỗi chỉ số ⇒ mở lại ADR-001 §9.
