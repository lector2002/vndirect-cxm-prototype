# Module I Charter — màn **Điểm đo** (`#/signals`): quản trị 30 điểm đang đo

Status: **CHƯA DỰNG.** Viết 07/08/2026 sau phiên brainstorm với owner (§4 của
`HANDOFF-MVP-FLOW-COVERAGE.md` đã chạy hết, cộng một lần owner sửa hướng ở cuối).
Date: 07/08/2026
Baseline đo ngay trước module: `tsc -b` exit 0 · **99 file / 1113 test xanh** · `vite build` xanh ·
working tree sạch (3 png chưa theo dõi + `output/kiem-ke-truong-flow-coverage.html` mới viết).
Mốc quay lui đã có: `cb01013` + `d62cf27`.

> **Sửa một chỗ sai trong handoff §2:** handoff nói *"toàn bộ công việc từ 06/08 chưa commit,
> git status bẩn ở ~24 file"* và khuyên xin owner cho commit trước. **Không còn đúng** — việc đã nằm
> trong `cb01013` và `d62cf27`, cây sạch. Khuyến nghị đó là moot.

---

## 0. VIỆC CẦN OWNER — checklist, cập nhật 07/08

Sắp theo mức cản: nhóm A chặn việc, nhóm B chặn lát sau, nhóm C không chặn gì.

### A · ĐÃ CHỐT 07/08 — A1 không còn chặn

**Owner chọn: chấm sức khoẻ nguồn theo MỐC SỐ LIỆU, không theo SLA giờ.** Kèm hai thứ owner nêu
thêm khi hỏi *"gặp ngày không có dữ liệu vì không ai feedback thì detect thế nào"*:

1. **Trạng thái thứ tư — *im lặng, chưa phân định*.** Ba trạng thái cũ (đang nhận · đang trễ · chết)
   ép im lặng vào một trong ba, và ép kiểu nào cũng sai: gọi *chết* thì báo động giả mỗi Chủ nhật,
   gọi *đang nhận* thì che một webhook đã gãy. Đúng luật **không trộn *chưa-biết* với *thiếu***.
2. **Loại nguồn quyết định im lặng có đáng ngờ không.** `SourceKind` đã có sẵn và **chưa chỗ nào
   dùng để chấm sức khoẻ**: `event` chạy theo lưu lượng (app có người dùng thì có event ⇒ im lặng là
   đáng ngờ); `chat`/`case`/`broker-note`/`store-review`/`survey` do người chủ động gửi (im lặng là
   chuyện thường).

**Đo được, quan trọng cho việc chuyển đổi:** dùng `Source.last` so với `asOf`, cộng
`cfg.data.deadDays` (**vốn đã tính bằng NGÀY**) cho ra **đúng bảy nhãn nguồn như hiện tại** — 5 đang
nhận · 1 đang trễ (`src-survey`) · 1 chết (`src-zalo`). Nên đổi cách chấm **không lệch một nhãn nào
hôm nay**, và có test khẳng định điều đó.

**Hệ quả:** `cfg.source[id]` (ngưỡng giờ mỗi nguồn) **thôi được đọc**. KHÔNG xoá — Module G đã tuyên
nhóm đó là bản tạm; nó thành control mồ côi giống `cfg.step.covMin` sau I1. Vòng sau đổi nghĩa nó
thành **nhịp giao** (*nguồn này ra bao lâu một lần*) — thứ người phụ trách nguồn trả lời được ngay,
khác với *"chậm mấy giờ thì coi là trễ"* vốn phải đoán.

**Chỗ hôm nay chưa phân biệt được, và vì sao manifest giải quyết:** từ trong dữ liệu, *nguồn hỏng* và
*không ai gửi gì* trông y hệt — đều là không có dòng nào. Thứ DUY NHẤT nói `src-zalo` hỏng là câu chữ
trong `Source.note` (*"Webhook lỗi từ 19/07"*), và **không dòng logic nào đọc câu đó** (đã grep).
Manifest giao hàng — đã nằm trong §10 — tách được **"có giao"** khỏi **"giao cái gì"**: giao 0 dòng
load OK = ngày yên tĩnh; load lỗi = hỏng biết chắc; không có dòng manifest = chưa giao, chưa biết.

### A-cũ · nội dung gốc của A1 (giữ để tra lại)

| | Việc | Bối cảnh |
|---|---|---|
| **A1** | **Chấm sức khoẻ nguồn thế nào dưới pipeline T-1?** Hai lối: (a) **canh lại 5 số SLA theo ngày**, hay (b) **chấm theo mốc số liệu** thay vì theo `now`. Tôi khuyên **(b)** — sống sót khi nhịp đổi | §12.1. Đo được: **5/7 nguồn `stale` vĩnh viễn** dưới T-1 vì SLA khai theo giờ (4–8h), và `deadDays = 2` chỉ dư 24h nên **pipeline chậm một ngày là cả 7 nguồn đọc thành "chết"**. Quyền sửa số không phải vấn đề — Module G đã tuyên nhóm SLA là **bản tạm** |

### B · DUYỆT — không chặn I2, nhưng chặn I4/I5

| | Việc | Tôi khuyên |
|---|---|---|
| **B1** | **Bốn mặt ở §3 có đúng thứ anh muốn quản trị?** (các điểm đang đo · đo thế nào trên hệ thống · allocate · xử lý · các giá trị) | Xác nhận trước khi I4 dựng hồ sơ điểm đo — I4 là **đích thật của MVP** theo QĐ 9 |
| **B2** | **Nhận D5 + D6 vào danh sách dọn?** D5 = `Signal.st` gộp hai trục · D6 = `Signal.seen` không tính được tuổi | **Nhận.** Cả hai là **bẫy làm màn nói dối**, không phải tính năng. D6 nặng nhất: tính tuổi từ `seen` sẽ báo *"hầu hết điểm đo đã chết"* |
| **B3** | **Chấp nhận bỏ T2, T6, T8 và hoãn F10?** | **Chấp nhận** — lý do ghi ngay trên từng dòng ở §6 và §7. Kết quả: 5 dọn · 5 trưng · 9 tiêu chí |
| **B4** | **Nhịp pipeline có đúng T-1?** Và **có bao giờ có độ chính xác dưới ngày** không? | Nếu chỉ T-1 thì mọi chuỗi *"trễ N giờ"* là **độ chính xác giả** — đơn vị nhỏ nhất phải là **ngày** (§12.2) |

### C · QUYẾT NHỎ — nói một câu là xong, không chặn gì

| | Việc |
|---|---|
| **C1** | `AtlasStepInspector` sau I1 bỏ hẳn ô "Evidence coverage" (grid 4→3 cột). Muốn giữ 4 cột với **một ô trống tường minh** thì nói, sửa nhanh |
| **C2** | Dòng mốc số liệu hiện ở Tổng quan (sau `SetChips`). Có cần hiện thêm ở màn nào nữa không |
| **C3** | **Demo Mode có cần hiện mốc rõ ràng là giả** để không nhầm demo với thật? Tôi cố ý **chưa** làm ở I1 để không tự bịa cách thể hiện |
| **C5** | **Nhóm SLA nguồn ở `#/rules` giờ ghi được mà không quyết định gì** — I3 đã lấy quyền chấm hạng khỏi `cfg.source[id]` (chấm theo số ngày thiếu so với mốc số liệu). Ô cấu hình gõ vào mà không đổi được gì chính là **loại bẫy module này đang dọn**. Hai đường: **bỏ nhóm đó**, hoặc **đổi sang ngưỡng theo NGÀY** để nó có quyền trở lại. Tôi **không tự quyết** vì đó là màn của Module G |
| **C6** | **Tab "Chỉ số liên kết" trong Atlas đã BỎ dòng độ tươi, chưa thay bằng dòng sinh ra.** Chuỗi thay thế cần `data.sources` + `data.asOf`, mà `AtlasMetricsTab` chỉ nhận `signals`/`metrics`/`cfg` — luồn thêm hai prop qua `AtlasStepInspector` là **việc của Atlas**, tôi không tự làm trong module I. Hiện tại chỗ đó **thiếu một dòng** chứ không **sai một dòng**; ở `#/rules` thì đã hiện đầy đủ. Nói một câu là tôi luồn prop |
| **C4** | **Bước đã chép mà chưa đo — hợp lệ hay lỗi dữ liệu?** Nhóm luật 14 cũ **cấm** trạng thái đó, nhưng UI **đã hỗ trợ** nó (`stepState()` trả *"unknown"*, khối Tổng quan nói *"chưa đo bước nào"*). Hai chỗ mâu thuẫn nhau **từ trước** module này. Ở I2 tôi chọn **hợp lệ** — cấm là chặn một tình trạng thật khỏi màn hình, cùng lý lẽ đã dùng để không thêm luật ở D5. Nếu anh muốn ngược lại thì nói, nhưng khi đó phải bỏ ca *"chưa đo"* khỏi UI cho khỏi nói hai giọng |

### D · GIAO NGƯỜI — không tốn dòng code nào, nhưng không giao thì lát 2 lại tắc

| | Việc | Vì sao cần người, không cần code |
|---|---|---|
| **D-a** | **Ai đối chiếu `stationId` với tracking plan thật** | 30/30 đúng khuôn nhưng **chưa ai xác nhận khớp**. Là hằng số, hiện lên màn thì tháng sau vẫn thế |
| **D-b** | **Ai duyệt `sg-nap-3` lên tin dùng** | Nó chở **9.510 lượt/ngày** ở trạng thái *đang kiểm chứng*. Hoặc duyệt, hoặc nói rõ vì sao chưa |
| **D-c** | **Gửi bản yêu cầu dữ liệu (§10, 6 mục)** cho bên data | Pipeline là đường giao thật ⇒ 6 mục đó **đặt hàng được**, thôi là danh sách mong ước |

---

## 1. Owner chốt gì trong phiên brainstorm 07/08

Chín quyết định, theo thứ tự đã chốt. Quyết định **9** đến sau và **định nghĩa lại đích của MVP** —
tám cái trước vẫn đúng nhưng tụt xuống làm nền đỡ.

| # | Quyết định | Ghi chú |
|---|---|---|
| 1 | **MVP chỉ XEM, không CRUD.** Việc của nó: làm lỗ hổng đã đo được hiện ra, quy được trách nhiệm, nói rõ mức tin cậy | Ngưỡng vẫn sửa được như Module G đã làm — không cuốn ngược |
| 2 | **Bỏ tỉ lệ tự khai `obs.cov`** khỏi mọi chỗ tiêu thụ; chỉ hiện thứ đếm được | Nhu cầu *"mã lý do rớt"* vào bản yêu cầu dữ liệu |
| 3 | **Trạng thái flow tách thành hai trục rời, cả hai đếm được**: có trích dẫn sơ đồ nguồn · đã chép bước. Bỏ hẳn chữ *"đã xác minh"* | Không gộp lại thành một nhãn nào |
| 4 | **Mỗi chỉ số mang phả hệ nguồn đếm được.** Ba trạng thái tách bạch: đủ nguồn tươi · giảm một phần · không nối được nguồn | Dùng lại `domain/sources.ts` |
| 5 | **Cộng lên bằng ĐẾM, mẫu số luôn hiện, chưa-biết tách riêng.** Không trung bình tỉ lệ, không trọng số theo lưu lượng | 26 flow chưa chép bước **không vào mẫu số** của bất kỳ tỉ lệ nào |
| 6 | **Dọn bug của mình, trưng tình trạng thật** — hai danh sách tách bạch, không trộn | Xem §5 và §6 |
| 7 | **Surface: màn mới + lấp ô trống ở Tổng quan** | `CoverageBlock` mất hết nội dung khi bỏ cov, nên đó là ô trống có sẵn |
| 8 | **Ô "đo ở đâu trên app" chừa sẵn**, ghi rõ đang chờ Bảng D từ team data/mobile | Đúng luật Đ4 tài liệu đợt 2: **không bịa vào fixture** |
| **9** | **ĐÍCH THẬT của MVP là quản trị các điểm đang đo** — đo bằng gì trên hệ thống, được allocate thế nào, xử lý thế nào, các giá trị là gì. Màn đối chiếu ở QĐ 6–7 là **nền đỡ**, không phải đích | Nguyên văn owner: *"đây ko phải target của mvp, mvp quan trọng về quản trị các điểm đang đo, các điểm đó đo như thế nào trên hệ thống và được allocate, xử lý như thế nào, các giá trị là gì"* |

---

## 2. Vì sao có module này

**30 điểm đo có thật trong dữ liệu, và không màn nào liệt kê chúng.** Cách duy nhất để thấy một điểm
đo hôm nay: vào `#/atlas` → chọn phase → chọn flow → bấm một bước → mở tab điểm đo. Tức phải **biết
trước** mình cần bước nào. Người quản trị đo lường không có câu hỏi đó — họ hỏi *"hệ đang đo những
gì, cái nào chưa chạy, cái nào không dùng vào việc gì"*.

`AtlasSignalPanel.tsx` đã dựng đúng phần khó (bảng điểm đo + chart giá trị + panel *gắn ở đâu*),
nhưng **prop của nó là điểm đo của một bước** (`AtlasSignalPanelProps.signals` — *"đã lọc ở
caller"*), nên nó về bản chất không trả lời được câu nào ở mức toàn hệ.

Hai tài liệu thiết kế đã duyệt — `output/thiet-ke-chart-signal.html` và
`output/thiet-ke-chart-signal-bo-sung-dot-2.html` — đã chốt phần **giá trị** rất kỹ (chọn nhiều điểm
đo → nhóm cột theo điểm đo → cắt theo 5 chiều cố định → ba ràng buộc trung thực). Module này
**không thiết kế lại phần đó**, chỉ đưa nó ra khỏi phạm vi một bước.

---

## 3. Bốn mặt của hồ sơ điểm đo — đối chiếu với dữ liệu thật

Bốn mặt owner nêu ở QĐ 9, map sang trường thật. **Đã đọc code, không đoán.**

| Mặt owner nêu | Trường đang có | Trạng thái |
|---|---|---|
| **các điểm đang đo** | 30 bản ghi `Signal` | Dữ liệu đủ · **không có surface** |
| **đo như thế nào trên hệ thống** | `Signal.name` = **tên event** (`account_open_started`) · `Signal.es` = `'client'` \| `'server'` · `Signal.pf` = nền tảng · `Step.stationId` = mã trạm tracking plan | Bốn trường có thật. **Tên screen kỹ thuật / route / id element KHÔNG CÓ** → Bảng D |
| **được allocate thế nào** | `Signal.tpId` → `Touchpoint.stepId` → `Step.flowId` → `Flow.groupId` → `Group.phaseId` · `Signal.metrics[]` → chỉ số · `Source.metrics[]` → nguồn nào chở | Đủ đường dẫn · **không màn nào đi hết đường** |
| **xử lý thế nào** | `Signal.st` (4 trạng thái) · `Signal.vol` · `Signal.seen` · `Source.lagH` so với SLA riêng ở `cfg.source[id]` | Rời rạc ở ba màn |
| **các giá trị là gì** | `Signal.values[]` + `data.sigCounts` (5 bảng đếm) | **Đã thiết kế + code chạy**: `domain/signalChart.ts` · `data/projectSignalCounts.ts` · `design-system/SignalColumns` |

### Hai điều về trường phải nhớ trước khi code

- **`Signal.name` LÀ tên event, không phải nhãn người đọc.** Nhãn người đọc là `Signal.desc`
  (`"Khách bấm Mở tài khoản"`). Đừng đặt `name` vào chỗ tiêu đề thân thiện.
- **`Signal.es` bị `validate.ts:189-190` ràng buộc theo nhóm**: signal thuộc group dòng tiền
  **buộc** phải `es === 'server'`. Đây là luật đang có, không được vô tình phá khi đổi cách hiện.

---

## 4. Số đo neo — đo lại 07/08 trên **cả hai** fixture, khớp nhau từng con số

Đây là các số charter dựa vào. **Đo bằng oracle độc lập, không lấy từ tài liệu cũ.**

```
6 phase · 20 group · 32 flow · 30 bước · 30 obs · 30 touchpoint · 30 signal · 7 nguồn · 6 chỉ số

flow:     32 tổng · 7 có src='—' · 25 verified:true · 6 observed:true   (đếm trực tiếp trên seed.ts)
          19 flow verified mà 0 bước
signal:   live=21 · validating=4 · designed=3 · gap=2
bước:     23/30 có ≥1 điểm đo
          BA TẦNG, không phải một số (đo 07/08, oracle 4):
            7/30  không có điểm đo NÀO                       → thiếu hẳn thiết bị
            9/30  không có điểm đo chạy theo BẤT KỲ định nghĩa nào (!live && vol=0) → trong đó 8 khai cov ≥ 70
           11/30  không có điểm đo st='live'                 → số cũ, PHỤ THUỘC định nghĩa
          9 vs 11 lệch đúng 2 bước (s-nap-3, s-rut-3): signal 'validating' mà vol 9.510 và 236
signal:   st ⟷ lưu lượng khớp 30/30 — live 21 + validating 4 đều vol>0; designed 3 + gap 2 đều
          vol=0 VÀ seen=null. Không luật nào ép quan hệ này (xem D5)
seen:     chuỗi gõ tay, KHÔNG CÓ NĂM, cả fixture chỉ 2 ngày ("27/07", "04/08") (xem D6)
es:       client 9 / server 21 — lưu lượng client 7.111 / server 32.634 ⇒ 18% lưu lượng đo ở client
          ĐO ĐỂ BIẾT, KHÔNG DỰNG. Không mặt nào ở §3 hỏi câu này, không QĐ nào phủ nó — số hay
          nhưng chưa có câu hỏi đi kèm. Đừng biến thành feature khi chưa ai đặt hàng
nguồn ×
chỉ số:   CHỈ 1/6 chỉ số có >1 nguồn (m-repeat). Ảnh hưởng tính khả thi test F7
liên kết: 20/30 signal không nuôi chỉ số nào · 7/30 touchpoint không có signal nào
          m-ces và m-repeat ← 0 signal
cov:      covMin=70 · n=30 min=57 max=99 median=88 · 6/30 dưới ngưỡng
validate: 23 nhóm luật (nhóm mới sẽ là 24)
```

**Ba chỗ handoff §3 mô tả sai, đã sửa:**

1. **§3.2 sai** — cờ `verified` không rỗng. `validate.ts:314` ép `verified === true ⟺ src !== '—'`,
   và `validate.ts:318-332` kiểm cả biên số sơ đồ (AJ ≤ 13, MJ ≤ 7). Đứng sau cờ là một **trích dẫn
   sơ đồ nguồn**. Cái thiếu là **bản chép lại**, không phải bằng chứng.
2. **§3.5 sai một nửa** — `m-repeat` được nuôi bởi **cả** `src-case` (khoẻ: vol 1.840, trễ 2h)
   **và** `src-zalo` (chết: vol 0, trễ 192h). Con số 24,0% là **thật**. Lỗi là **suy giảm âm thầm
   từng phần**, không phải số bịa.
3. **§3.4 có số yếu hơn số thật, nhưng bản charter đầu của tôi cũng neo sai** — handoff neo
   *"7/30 bước không có điểm đo"*. Tôi đổi thành *"11 bước không có thiết bị đo nào chạy, 9 khai
   cov ≥ 70"* — con số đó **phụ thuộc định nghĩa "đang chạy" = `st === 'live'`**, và định nghĩa đó
   đang tranh chấp với lưu lượng (2 bước có signal `validating` chở 9.510 và 236 lượt/ngày).
   **Số phải neo là số không phụ thuộc định nghĩa: 9/30 bước không có điểm đo chạy theo bất kỳ
   định nghĩa nào, trong đó 8 khai `cov ≥ 70`.** Giữ 11/30 nhưng phải gọi đúng tên *"không có điểm
   đo được đánh dấu tin dùng"*, không gọi là *"không có thiết bị đo nào chạy"*.

---

## 5. DỌN — lỗi tự gây, **không được đem trưng như phát hiện nghiệp vụ**

Bốn chỗ. Tất cả đã đo, có chứng cứ dòng code.

| # | Lỗi | Chứng cứ | Cách dọn |
|---|---|---|---|
| D1 | `Metric.freshness` là derivation gõ tay đã trôi khỏi gốc — **3/6 lệch số + 1/6 đúng số mà che trạng thái** | **Lệch số:** `m-ocr` khai *"trễ 4 giờ"* mà nguồn `src-ekyc` trễ 6 · `m-repeat` khai *"trễ 2 giờ"*, **im nguồn trễ 8 ngày** · `m-contract` khai *"trễ 4 giờ"* mà **0 nguồn** nối tới. **Đúng số mà che trạng thái:** `m-ces` khai *"trễ 12 giờ"* — khớp `src-survey` lagH 12, nhưng SLA nguồn đó là 6 ⇒ nguồn **đang trễ** mà chuỗi hiện ra vô can | Sinh từ `domain/sources.ts:114 lagText(lagH)` của nguồn nối tới, **kèm hạng sức khoẻ** — ca `m-ces` chứng minh con số đúng vẫn nói dối nếu thiếu hạng. Nhiều nguồn ⇒ kể **nguồn xấu nhất** (định nghĩa ở F7) |
| D2 | `verified` / `observed` là **hai trường không mang thông tin nào** | `validate.ts:314` và `validate.ts:339-346` chứng minh cả hai bằng một biểu thức của trường khác. Đếm khớp: 25⟷25, 6⟷6 | Suy tại chỗ đọc thay vì lưu. **Bỏ được luôn hai nhóm luật** — nhóm 13/14 thành **khuyết**, không lấp số (bất biến 8) |
| ~~D3~~ | ~~`srcNote` hardcode~~ — **gộp vào D4, không phải việc riêng** | `AtlasCoverageTab.tsx:39` | Nó nằm trong đúng khối mà D4 rút hết nội dung ⇒ chết theo. Đừng mở task riêng |
| D4 | `obs.cov` — số gõ tay đang **cầm quyền đẩy trạng thái bước** | `state.ts:20` cho nó đẩy `ok → watch` | Gỡ khỏi 6 chỗ tiêu thụ (xem §8). Bao gồm gỡ `srcNote` hardcode của D3 |

**Phạm vi D4 — owner chốt phương án giữ field:** `obs.cov` **vẫn ở trong schema và cả hai fixture**;
chỉ gỡ hết quyền tiêu thụ. Không đụng schema, không đụng validate, không phải sửa 1113 test.
`cfg.step.covMin` **giữ lại** trong Module G, chuyển vai thành mốc chia dải cho số đếm mới — nên
màn Chỉ số & ngưỡng **không mất nhóm nào**.

**Vì sao D2 xoá field mà D4 thì không — bất đối xứng này là quyết định, không phải sơ suất.**
Hai ca khác nhau ở chỗ *cái gì chứng minh việc xoá là an toàn*:

- **D2 xoá được** vì `validate.ts:314` và `:339-346` **tự chứng minh** hai cờ là biểu thức của trường
  khác — suy lại luôn cho đúng kết quả, và F8 ghim đúng điều đó ("không đổi một pixel nào" trên cả 32
  flow). Xoá xong không mất thông tin nào vì chưa từng có thông tin nào ở đó.
- **D4 không xoá** vì `obs.cov` là **số gõ tay không suy lại được** — không có gì thay nó. Gỡ khỏi
  schema/fixture nghĩa là chạm 1113 test để đổi một thứ owner đã chốt chỉ cần **mất quyền quyết
  định**, không cần mất chỗ đứng. Chi phí lớn, lợi ích bằng 0.

Test biên của cả hai vẫn chỉ một điều: **màn hình không đổi**.

### D5 · D6 — hai chỗ đo được sau khi viết charter, **ĐỀ XUẤT, owner chưa chốt**

| # | Lỗi | Chứng cứ đo 07/08 | Cách dọn |
|---|---|---|---|
| **D5** | `Signal.st` **gộp hai trục** — đúng bệnh của `verified`/`observed` ở D2, chỉ chưa ai gọi tên | `st` ⟷ `vol > 0` **khớp 30/30**: `live` 21 + `validating` 4 đều `vol>0`; `designed` 3 + `gap` 2 đều `vol=0` **và** `seen=null`. Tức nửa *"có chạy hay không"* của `st` là **suy được hoàn toàn từ `vol`**. **Khác D2 ở một điểm quan trọng: không luật nào ép quan hệ này** — nó khớp do may, không do luật | Tách hai trục: **có chạy** = suy từ `vol` · **có tin dùng** = người khai (`live` vs `validating`), và **dự định** (`designed` = định làm) vs (`gap` = biết thiếu chưa làm). **KHÔNG thêm luật ép quan hệ này** — xem ô dưới. ⚠️ **Suy "có chạy" phải dùng CỬA SỔ NHIỀU NGÀY, không dùng `vol` của một ngày** — xem §12.2, dưới pipeline T-1 thì `vol=0` một ngày không còn nghĩa "không chạy" |
| **D6** | `Signal.seen` **không dùng được để tính "im lặng bao lâu"** — và đây là cách dễ nhất để màn mới nói dối | Là **chuỗi gõ tay**, **không có năm** (`"27/07 · 14:52"`). Cả fixture chỉ **2 ngày phân biệt**: `27/07` và `04/08`. Hôm nay 07/08 ⇒ ai tính tuổi từ nó sẽ hiện **hầu hết điểm đo im lặng 11 ngày** = **báo chết hàng loạt sai** | Hai lối: (a) **cấm** tính tuổi từ `seen`, chỉ hiện nguyên chuỗi kèm nhãn *"mốc do người khai"*; (b) xin team data một **timestamp thật**. **Owner nêu pipeline T-1 (07/08) ⇒ (b) thành mục CHÍNH ở §10, không còn là việc vòng sau.** Trong module này vẫn làm (a) vì pipeline chưa có; khi có thì tuổi tính được nhưng **đơn vị nhỏ nhất là NGÀY** — xem §12.2 |

> **Vì sao D5 KHÔNG kèm luật mới — quan trọng, đừng tự ý thêm lại.** Bản đầu tôi đề xuất thêm nhóm
> luật 24 ép `vol>0 ⟺ st ∈ {live, validating}`. **Sai hướng.** D1–D4 đều là *"thôi tin một trường
> đang nói dối"*; thêm luật là *"đặt một điều luật mới vào tầng dữ liệu"* — việc khác hẳn. Và nó
> **phản mục đích module này**: đích của màn là **trưng ra tình trạng để người xử lý**. Biến
> *"trạng thái lệch lưu lượng"* thành lỗi validate cứng nghĩa là tình trạng đó **không bao giờ đến
> được màn hình** — fixture chỉ đơn giản từ chối load. Hôm nay quan hệ khớp 30/30 **do may**; khi có
> dữ liệu thật, một điểm đo `designed` bắt đầu phát lưu lượng là **phát hiện đáng trưng**, không phải
> lỗi phải chặn. **Giữ chẩn đoán, bỏ luật.** Module này **không thêm nhóm luật nào** — bất biến 8 vẫn
> đứng đó cho lần sau ai cần cấp số.

---

## 6. TRƯNG — tình trạng thật, **phải thấy được, không được dọn**

| # | Tình trạng | Số neo |
|---|---|---|
| T1 | Flow đã trích dẫn sơ đồ mà chưa chép bước | ~~19/32~~ → **19/25**, cộng **7 flow chưa đánh giá được đếm riêng** (I5 sửa mẫu số, số 19 không đổi). Mẫu số 32 là **trộn *chưa-biết* với *thiếu***: flow chưa trích dẫn **và** chưa chép bước thì chưa có thông tin nào để xếp loại, khác hẳn flow **đã** trích dẫn mà chưa chép bước. Để chung mẫu số thì thêm một flow vừa map xong sẽ **pha loãng tỉ lệ** dù chẳng có gì đổi — đúng ca F6 cấm. Đã đếm lại độc lập: 25 + 7 = 32, khớp tổng flow. ⚠️ Hôm nay *"đã đánh giá được"* (có trích dẫn **hoặc** đã chép bước) **tình cờ bằng** *"có trích dẫn"* = 25, vì **0 flow** chép bước mà không trích dẫn; hai định nghĩa sẽ tách nhau khi dữ liệu đổi, đừng đọc 25 thành "số flow có trích dẫn" |
| ~~T2~~ | ~~Chỉ số khai nguồn bằng chữ mà không nối được vào nguồn nào~~ — **gộp vào D1, một gốc chứ không hai dòng** | Đúng **1 ca**: `m-contract` (`Metric.source = "SmartCA + Account service"`, không dòng nguồn nào tên đó). Nhưng đây **cùng một gốc** với ô D1 *"`m-contract` khai trễ 4 giờ mà 0 nguồn"* — một sự thật, đang kể ở hai chỗ. Giữ **câu nói** ở dưới, bỏ dòng đếm |
| T3 | Nguồn đứt mà vẫn khai nuôi chỉ số | `src-zalo` vol 0, trễ 8 ngày, khai nuôi `m-repeat` — và `m-repeat` đang neo `CXI-028` |
| T4 | Bước không có thiết bị đo nào chạy — **các số LỒNG nhau, không cộng được** | **9/30** bước không có điểm đo nào **đang chạy** (số không phụ thuộc định nghĩa) — **trong đó 7 không có điểm đo nào cả**, 2 có nhưng im (`s-tra-4`, `s-rut-4`). ~~Trong 9 đó, 8 vẫn khai `cov ≥ 70`~~ — **GẠCH sau I1: `obs.cov` đã gỡ khỏi mọi chỗ đọc trong `src/` (F9), trưng lại ở I5 là phá chính tiêu chí vừa nghiệm thu.** Phần còn lại của dòng đủ mang thông điệp T4. Con số 11/30 là **cùng một tình trạng đếm theo nhãn tin dùng**; chênh đúng 2 bước (`s-nap-3`, `s-rut-3`) vì signal của chúng là `validating` mà chở **9.510** và **236** lượt/ngày. ⚠️ **Không viết 7 và 9 cạnh nhau như hai nhóm rời** — người đọc sẽ cộng thành 16 |
| T5 | Điểm đo không nuôi chỉ số nào | 20/30 |
| ~~T6~~ | ~~`stationId` chưa ai đối chiếu~~ — **chuyển sang §10, không trưng trên màn** | 30/30 bước, `stationId` **distinct 30/30 và đúng khuôn** (`JS-MTK-01`…). Là **hằng số**, không phải trạng thái — hiện *"30/30 chưa đối chiếu"* thì tháng sau vẫn thế, người xem không làm gì được. Đây là việc **giao người**, không phải việc **hiện số** |
| T7 | Chỉ số không có điểm đo nào nuôi | `m-ces`, `m-repeat` |
| ~~T8~~ | ~~Điểm đo chở lưu lượng thật mà chưa được tin dùng~~ — **gộp vào T4, không đếm hai lần** | 4/30 `validating` mà `vol>0` (`sg-nap-3` 9.510 · `sg4` 410 · `sg-rut-3` 236 · `sg11` 197). Hai trong bốn cái này **chính là toàn bộ khoảng chênh 9↔11 của T4** — tách thành dòng riêng là trưng cùng một tình trạng ở hai chỗ với hai mẫu số khác nhau. Việc **giao người** cho `sg-nap-3` đã ở §10 |

**Câu chữ cho ca `m-contract` (T2 cũ, giờ nằm trong D1) — giữ nguyên, đây là chỗ dễ nói quá:**
phải nói *"khai nguồn bằng chữ nhưng không nối được vào nguồn nào trong danh sách hiện tại"* —
**không** phải *"chỉ số này không có nguồn"*. Danh sách 7 nguồn là **bản tạm** (owner chốt 06/08),
nên lỗi có thể ở danh sách chứ không ở chỉ số.

**Còn 5 dòng phải trưng: T1 · T3 · T4 · T5 · T7.** T2, T6, T8 đã rời khỏi danh sách vì các lý do
ghi ngay trên dòng — **không phải vì hết quan trọng**, mà vì trưng lên màn thì trùng hoặc vô dụng.

---

## 7. Tiêu chí nghiệm thu — **luật, không phải số**

> ⚠️ **Đây là chỗ dự án đã sai hai lần.** Mọi tiêu chí dưới đây phải **tính lại từ fixture** và
> khẳng định **quan hệ**. Ghim `expect(x).toBe(19)` là cách một defect được đóng dấu thành hành vi
> đúng. Nếu số thay đổi vì fixture thay đổi, test phải **vẫn xanh**.

| # | Feature | Nghiệm thu (dạng luật) |
|---|---|---|
| F1 | Bảng liệt kê đủ điểm đo | Số dòng bảng **bằng** `data.signals.length`, không phụ thuộc bước/flow nào đang chọn |
| F2 | Hồ sơ một điểm đo đi hết đường allocate | Với **mọi** signal, hồ sơ hiện đúng chuỗi điểm chạm → bước → flow → phase suy từ `tpId`; signal có `metrics` rỗng phải nói *"chưa nuôi chỉ số nào"*, **không** để trống |
| F3 | Mặt "xử lý" | Trạng thái hiện đúng `Signal.st`; độ tươi của nguồn chở nó suy từ **số ngày thiếu so với mốc số liệu** `sourceHealth(s, cfg, asOf)`, **không** đọc `Metric.freshness`, **không** đọc `cfg.source[id]`. ~~Chặn bởi §12.1~~ **GỠ CHẶN 07/08 (I3)** — owner chọn đổi cách chấm sang mốc số liệu. Phần còn treo trên hồ sơ điểm đo là **nối signal → nguồn**: chưa có trường nào nối, không phải chưa có cách chấm |
| F4 | Mặt "đo ở đâu trên app" | Hiện đúng 4 trường đang có; **ba ô Bảng D** (tên screen kỹ thuật · route/deeplink · id element) hiện **ô chờ có tên người nợ**, không hiện giá trị bịa. Test chỉ soi **ba ô đó**: không ô nào trong ba ô lấy chuỗi từ `Signal.desc`, `Signal.name`, `Touchpoint.name` hay `stationId` |
| F5 | Chart giá trị | Dùng lại `signalChart` nguyên trạng. Signal `values` rỗng ⇒ **từ chối vẽ kèm lý do**, không vẽ rỗng |
| F6 | Đếm cộng lên | Mọi con số tổng **kèm mẫu số**; flow **chưa đánh giá được** (chưa trích dẫn sơ đồ **và** chưa chép bước) **không nằm trong mẫu số** của bất kỳ tỉ lệ nào. ⚠️ **Không phải "chưa chép bước"** — sửa 07/08 (I5): T1 đếm đúng những flow chưa chép bước và chúng **phải** nằm trong mẫu số của chính T1. Vế cấm là *chưa-biết*, không phải *thiếu* — đọc lẫn hai cái là báo T1 vi phạm F6 trong khi T1 đang đúng — test: thêm một flow không bước thì mọi tỉ lệ **không đổi**, chỉ ô "chưa đánh giá được" tăng 1. **Thêm vào BẢN SAO trong test, KHÔNG thêm vào fixture đang ship** — đụng fixture thật là mở một mặt trận không cần thiết. ⚠️ **Công thức dựng đã đổi sau I2:** `Flow.verified`/`Flow.observed` **không còn tồn tại** và **luật 13/14 đã khuyết** — flow thêm vào chỉ cần `steps: []`, hai trục nay suy tại chỗ đọc bằng `flowHasSourceCitation()` / `flowStepsCopied()`. Ai còn set `observed`/`verified` là đang viết theo bản charter cũ |
| F7 | D1 — độ tươi chỉ số | *"Nguồn xấu nhất"* = xấu nhất theo **hạng sức khoẻ** `sourceHealth(s, cfg, asOf)`: `down` > `stale` > `silent` > `ok`, **đồng hạng thì thiếu nhiều ngày hơn thắng**. KHÔNG phải `max(lagH)`. **Test phải TỰ DỰNG input, không đọc fixture** — đo 07/08: **chỉ 1/6 chỉ số có >1 nguồn** (`m-repeat`), và nguồn xấu nhất của nó **cũng là** nguồn thiếu nhiều ngày nhất, nên fixture **không chứa ca phân biệt** hai luật. Chuỗi có **ba đoạn, mỗi đoạn gọi tên trục của nó**: tuổi lần giao cuối (`lagText(lagH)`) · độ phủ ngày · hạng. ⚠️ **`lagH` KHÔNG được đứng trần cạnh chữ hạng** — hạng chấm bằng ngày thiếu, để `"trễ 12 giờ · đang trễ"` là dựng lại đúng bệnh `Metric.freshness` mà module này sinh ra để chữa (`m-ces`: 12 giờ nhưng thiếu 1 ngày). Test quét **mọi** chỉ số có nguồn, không bốc một ca |
| F8 | D2 — bỏ hai cờ | Sau khi bỏ, ba trạng thái flow trên Atlas **không đổi một pixel nào** so với trước. Test: so nhãn suy ra với nhãn cũ trên cả 32 flow |
| F9 | D4 — gỡ `obs.cov` | Không chỗ nào trong `src/` (trừ schema + fixtures) đọc `obs.cov`. Test phải quét **cả 30 obs**, không chọn một dòng: với **mọi** obs, `stepState()` **và** `stepWhy()` cho **cùng kết quả** ở `cov = 0` và `cov = 100`. Lý do bắt buộc quét hết: `state.ts:20` chỉ cho `cov` đẩy trạng thái khi `s === 'ok'`, nên nếu test bốc một bước vốn đã `watch`/`crit` theo tỉ lệ thất bại thì **test xanh trong khi logic cov còn nguyên** — đó là test rỗng. `stepWhy()` phải kiểm riêng vì `state.ts:34` đẩy chuỗi lý do `cov` **không phụ thuộc** nhánh `ok`, tức người dùng vẫn đọc thấy nó |
| ~~F10~~ | ~~Khối ở Tổng quan~~ — **HOÃN sang lát 2** | Thay `CoverageBlock` bằng khối dẫn vào màn mới. Đây là tiêu chí **duy nhất nằm ngoài màn mới**, và nó sinh từ QĐ 7 — thứ mà **chính QĐ 9 đã hạ xuống làm nền đỡ**. Nếu phải bỏ một tiêu chí để MVP còn tối giản thì bỏ cái này. `CoverageBlock` sau D4 sẽ **rỗng nhưng không vỡ** — chấp nhận được trong một lát |

---

## 8. Chỗ chạm — đã kiểm, không đoán

**Sáu chỗ tiêu thụ `obs.cov`** (grep xác nhận):
`domain/state.ts:20,34` · `design-system/JourneySpine.tsx:71,92,96` ·
`features/atlas/AtlasCoverageTab.tsx:20,34,35,58` · `features/atlas/AtlasStepInspector.tsx:69,88,89` ·
`features/atlas/AtlasPage.tsx:114,344` · `features/overview/blocks/CoverageBlock.tsx` (**cả khối**).

**Chỗ tiêu thụ `verified`/`observed`:**
`features/atlas/AtlasPage.tsx:36,42,306` · `data/validate.ts:314-346` (nhóm 13, 14) ·
`data/validate.test.ts:121,322-324`.

**Dùng lại nguyên, KHÔNG viết lại:**
`domain/sources.ts` (owner + handoff đều xác nhận phần số học dùng lại được) ·
`domain/signalChart.ts` · `data/projectSignalCounts.ts` · `design-system/SignalColumns` ·
`features/atlas/signalStatus.ts` (`SIGNAL_STATUS`).

**Nav:** thêm một item vào nhóm **Quản trị** của `seedNav` (seed.ts:916-933), cạnh
`rules` và `agents`. Đó là nhóm đúng — đây là màn quản trị, không phải màn đọc số.

---

## 9. Bất biến KHÔNG được tháo

1. **`validateFixture()` trắng sau MỌI lần sửa dữ liệu, trên CẢ HAI fixture.**
2. **Không trộn *chưa-biết* với *thiếu*.** Áp cả ở mức tổng: flow chưa chép bước ≠ flow đo được 0%.
3. **Nhãn dải chỉ lấy từ `bandLabels()`**, không gõ tay.
4. **Không ghim số vào test khi luật ghi được** (xem §7).
5. **Ba ràng buộc trung thực của chart điểm đo** (`thiet-ke-chart-signal.html` §3) giữ nguyên — kể cả
   ràng buộc 1 vốn *"trông như thừa"* ở phương án 2.
6. **Không bịa trường vào fixture để lấp ô Bảng D** (Đ4 tài liệu đợt 2 — đã có tiền lệ lỗ hổng A).
7. **`Signal.es === 'server'` cho group dòng tiền** (`validate.ts:189`) — luật đang có.
8. **Số nhóm luật KHÔNG BAO GIỜ tái sử dụng.** Bỏ nhóm 13 và 14 (D2) để lại **hai lỗ khuyết** —
   `validate.ts` sẽ còn 21 nhóm nhưng số cao nhất vẫn là 23. Nhóm mới **vẫn là 24**, không phải
   "số nhóm + 1". Đừng lấp số 13/14 cho nhóm khác: người đọc log cũ sẽ hiểu sai luật nào đã fail.
   Đếm để **kiểm**, không để **cấp số**: `grep -oE "^\s*/\* ?[0-9]+\." src/data/validate.ts` → số
   lớn nhất hiện **23**.
9. **Màn KHÔNG khai độ phủ so với thực tế — và phải IN RA điều đó trên màn.** Owner chốt 07/08:
   *"coi như pipeline data chỉ là 1 nguồn, bỏ mẫu số đi vì ko có nguồn khác để so sánh độ phủ thực
   tế, khả năng chỉ chở event thôi"*. Một nguồn ghi duy nhất ⇒ *"đo được bao nhiêu % của thực tế"*
   **không tồn tại**, không phải *"chưa tính được"*. Câu phải hiện trên màn, đại ý: *"Màn này không
   nói được đang đo bao nhiêu phần của thực tế — dữ liệu chỉ đến từ một nguồn ghi, không có gì để
   so. Mọi số ở đây là về cái đã nhận được."*
   **Vì sao in ra chứ không chỉ ghi ở đây:** `obs.cov` sống được một năm vì không ai hỏi nó là phần
   trăm **của cái gì**. Giới hạn nằm trong charter thì lần tới có người thêm lại một cột *"% độ phủ"*
   và không ai chặn; giới hạn in trên màn thì người thêm **phải xoá câu đó trước** — việc thêm trở
   thành quyết định có chủ ý, không phải tai nạn.
   Kèm theo: **không gọi độ tin cậy của dữ liệu nhận được là "độ phủ"**. Hai thứ khác nhau; trộn lại
   đúng là cách `obs.cov` sinh ra.

*(Bất biến 9 thêm 07/08, đặt CUỐI danh sách có chủ ý — số 8 phải giữ nguyên cho luật đánh số nhóm
vì `validate.ts` nhóm 12 và §14 đang trỏ tới "bất biến 8". Chèn vào giữa là tự phạm đúng luật đó.)*

---

## 10. Bản yêu cầu dữ liệu — **là deliverable, không phải ghi chú**

Ba mục phát sinh từ phiên này, phải vào bản yêu cầu gửi bên data:

| Mục | Cần gì | Sinh từ QĐ |
|---|---|---|
| **Bảng D** | Mỗi điểm đo: tên screen kỹ thuật · route/deeplink · id hoặc selector của element phát sinh event · áp dụng từ bản build nào | QĐ 8 · Đ4 đợt 2 |
| **Mã lý do rớt** | Mỗi ca thất bại ở một bước: mã lý do đọc được. Đây là **tử số** mà `obs.cov` vốn hứa mà không có | QĐ 2 |
| **Dòng event thô** (tối thiểu: case id · tên event · mốc phát sinh · mốc nhận) | Mở được **3 trong 5 ô** của tầng ② một lúc: **trùng lặp** · **mồ côi tham chiếu** · **đến muộn**. Ô *đến muộn* đáng giá nhất dưới nhịp T-1 — nó đo trực tiếp *"hôm qua chốt số thì đã thiếu bao nhiêu"* | Bất biến 9 |
| **Số đếm giá trị ĐỘC LẬP với bản khai** | Mở ô **giá trị lạ**. Hiện `sigCounts` **sinh từ chính bản khai**, nên *"0 giá trị ngoài khai báo"* là hệ quả cách sinh số, **không phải bằng chứng dữ liệu sạch** | Bất biến 9 |
| **Manifest giao hàng** theo bảng theo ngày (số dòng gửi · load thành công/thất bại/một phần) | Mở ô **manifest**. Bắt được mất mát **phía pipeline** — thứ nhìn từ trong dữ liệu thì **vô hình** | Bất biến 9 |
| ~~**Số ca thật mỗi bước từ hệ lõi**~~ | **BỎ 07/08** — chết cùng phương pháp đối chiếu hệ lõi khi owner chốt coi pipeline là **một nguồn ghi**. Đừng xin lại nếu không có nguồn ghi thứ hai | — |
| **Bản đồ nguồn↔chỉ số chính thức** | Danh sách nguồn thật (thay bản tạm 7 nguồn) + chỉ số nào ăn nguồn nào. Giải quyết T2 tận gốc | QĐ 4 · T2 |

| **Mốc thấy cuối thật** | `Signal.seen` hiện là chuỗi người gõ, **không có năm**, cả fixture chỉ 2 ngày. Cần timestamp máy sinh để tính được *"im lặng bao lâu"*. Chưa có nó thì **cấm** tính tuổi (D6) | D6 · pipeline |
| **Mốc số liệu (`asOf`)** | Ngày dữ liệu tính đến. Pipeline T-1 nghĩa là số trên màn **luôn là của hôm qua** — không có mốc này thì người xem đọc thành *"bây giờ"* | §12.3 |
| **Lưu lượng theo cửa sổ, không theo một ngày** | Đủ để trả lời *"điểm đo này còn chạy không"* mà không nhầm ngày ít khách thành điểm đo chết. Ví dụ: số ngày có ≥1 event trong 7 ngày gần nhất | §12.2 · D5 |
| **Tách trễ-pipeline khỏi trễ-nguồn** | Hai con số riêng, không gộp. Gộp thì mọi nguồn đọc 24h+ và **không phân biệt được nguồn hỏng** | §12.2 |

Kèm hai việc **giao người**, không phải việc hiện số:

- **Ai đối chiếu `stationId` với tracking plan thật** (T6 cũ). 30/30 đúng khuôn nhưng chưa ai xác nhận
  khớp — đây là lý do nó rời khỏi §6: hiện một hằng số lên màn không giúp ai làm gì.
- **Ai duyệt cho `sg-nap-3` lên tin dùng** (T8). Nó chở **9.510 lượt/ngày** ở trạng thái *đang kiểm
  chứng* — hoặc duyệt, hoặc nói rõ vì sao chưa.

---

## 11. Ngoài phạm vi module này

- **Không CRUD** trên flow, bước, điểm đo, gán nguồn (QĐ 1).
- **Không xoá `obs.cov`** khỏi schema/fixture (QĐ 2, phương án giữ field).
- **Không bỏ `cfg.step.covMin`** khỏi Module G.
- **Không đụng Module B B2–B6** và **Module H** — vẫn HOÃN.
- **Không dựng lại màn `#/sources`** — nguồn chưa chốt (owner 06/08). Module này chỉ **đọc**
  `domain/sources.ts`.
- **Không thêm/sửa/xoá chiều** — 5 chiều cố định, owner chốt 04/08.

---

## 12. Ràng buộc PIPELINE T-1 — owner nêu 07/08, **áp lên cả module**

> Owner: *"data sẽ được xây dựng 1 pipeline để feed có thể là t-1 của data real date"*.
> Nhịp chưa chốt (*"có thể"*), nhưng hệ quả thiết kế đã rõ: **số tươi nhất là của HÔM QUA**. Mọi thứ
> dưới đây đúng với mọi nhịp **từ T-1 trở lên**, nên quyết được ngay không cần chờ chốt nhịp.

### 12.1 Cấu hình ngưỡng nguồn đang có **bị vô hiệu** — số thật, đã đếm

`cfgDefault.source` (seed.ts:971) khai SLA theo **giờ**: `src-ga` 6 · `src-ekyc` 8 · `src-case` 4 ·
`src-survey` 6 · `src-store` 36 · `src-broker` 36 · `src-zalo` 6. Dưới pipeline T-1, `lagH` **không
bao giờ < 24 vì kiến trúc**. Suy ra:

| | Hôm nay (feed gần thực) | Dưới pipeline T-1 |
|---|---|---|
| **5/7 nguồn có SLA < 24h** (`src-ga` 6, `src-ekyc` 8, `src-case` 4, `src-survey` 6, `src-zalo` 6) | 4 nguồn `ok`, 1 `stale`, 1 `down` | **`stale` vĩnh viễn — do kiến trúc, không do nguồn hỏng** |
| **2/7 nguồn SLA 36h** (`src-store`, `src-broker`) | `ok` | `ok`, dư 12h |
| **`cfg.data.deadDays = 2`** ⇒ mốc `down` = 48h | `src-zalo` (192h) `down` | Chỉ **dư 24h** trên sàn T-1 ⇒ **pipeline chậm một ngày là CẢ 7 NGUỒN đọc thành `down`** |

**Đây là chỗ đắt nhất của ràng buộc mới:** toàn bộ ngưỡng nguồn được canh cho feed gần thực. Màn
Điểm đo tiêu thụ `sourceHealth()` ở **cả F3 và F7**, nên nếu không xử lý, màn mới sẽ trưng
*"5/7 nguồn đang trễ"* mỗi ngày — một báo động **luôn bật**, đúng loại vô dụng đã gạt T6 ra ở §6.

**Khuyến nghị: chấm sức khoẻ nguồn theo MỐC SỐ LIỆU, không theo `now`.** Nguồn đúng hạn của một
pipeline T-1 là nguồn *"có đủ dữ liệu của ngày D-1"*, không phải *"trễ dưới 6 giờ so với bây giờ"*.
Cách này sống sót khi nhịp đổi. **Việc owner phải quyết:** 5 con số SLA kia canh lại theo ngày, hay
giữ nguyên và đổi cách chấm. Không tự quyết được — nó là số của Module G.

### 12.2 Ba trường đổi nghĩa dưới pipeline

| Trường | Nghĩa hôm nay | Nghĩa dưới T-1 | Phải làm gì |
|---|---|---|---|
| `Source.lagH` | trễ bao nhiêu giờ | **Gộp HAI thứ**: trễ do pipeline (hằng số ~24h, **không phải lỗi**) + nguồn cũ đến đâu lúc pipeline lấy (**mới là lỗi**) | Tách hai. Gộp lại thì mọi nguồn đều đọc 24h+ và **không phân biệt được nguồn hỏng với nguồn bình thường**. Đây là **lần thứ ba** dự án này gộp hai nghĩa vào một trường (sau `verified`/`observed` ở D2 và `Signal.st` ở D5) |
| `Signal.vol` | "lượt/ngày", đọc như mức ổn định | **Số của đúng một ngày D-1** | ⚠️ **Ràng buộc lên D5**: `vol = 0` một ngày **KHÔNG** còn nghĩa *"không chạy"* — cuối tuần, ngày lễ, flow ít khách đều cho 0. Suy *"có chạy"* từ `vol` phải dùng **cửa sổ nhiều ngày**, hoặc dùng mốc thấy cuối thật. **Không suy từ một ngày** |
| `Signal.seen` | chuỗi người gõ, không năm (D6) | Pipeline sinh được **mốc thật** | D6 chuyển từ *"cấm tính tuổi"* sang **tính được, nhưng sàn là 1 ngày** — hiện *"trễ 4 giờ"* dưới batch T-1 là **độ chính xác giả**. Đơn vị nhỏ nhất là **ngày** |

### 12.3 Một trường phải thêm, và chỉ một

**Mốc số liệu (`asOf`) — ngày dữ liệu tính đến.** Chưa fixture nào có. Không có nó, người xem đọc số
của hôm qua như số của bây giờ, và đó là dạng nói dối tốn uy tín nhất vì **không ai phát hiện được**.
Yêu cầu: một mốc duy nhất, hiện trên màn, **Demo Mode phải hiện mốc rõ ràng là giả** để không ai
nhầm demo với thật. Một trường, rẻ — và là điều kiện để mọi con số khác trung thực được.

### 12.4 Một tin tốt

Bản yêu cầu dữ liệu ở §10 **thôi là danh sách mong ước**: pipeline là đường giao thật cho **Bảng D**,
**mã lý do rớt** (tử số mà `obs.cov` vốn hứa) và **mốc thấy cuối thật**. Ba mục đó giờ đặt hàng được.

---

## 13. Mốc số liệu **đã tồn tại ngầm** — đo 07/08, đổi cách làm §12.3

Trước khi thêm trường, tôi kiểm xem hệ đã mang mốc nào chưa. **Có** — và nó đang nằm sai chỗ:

- Cả **ba** `Period.range` (seed.ts:9-13) kết thúc cùng một ngày: `27/07/2026`. Đó chính là mốc số
  liệu, nhưng nó **nằm trong chuỗi để hiển thị**, gõ tay, **lặp ba lần**.
- `Signal.seen` có hai ngày phân biệt: `27/07` (khớp mốc) và **`04/08`** — **sau** ngày kết thúc của
  **mọi** period. Tức một số điểm đo khai *thấy lần cuối* ở thời điểm **ngoài cửa sổ dữ liệu**.

⇒ **§12.3 không phải "thêm khái niệm mới", mà là "đưa khái niệm đang ẩn ra thành một trường".**
Đây lại đúng cái bệnh của module: một sự thật gõ tay ở nhiều chỗ, không ai đối chiếu.

**Hai điều chốt luôn để tránh mâu thuẫn nội bộ:**

1. **KHÔNG thêm nhóm luật** ép `Period.range` khớp `asOf` — đúng lý lẽ đã ghi ở khối dưới D6: chặn
   bằng validate thì mâu thuẫn **không bao giờ lên được màn hình**. Ba chuỗi `range` **giữ nguyên**,
   không refactor (ngoài phạm vi module).
2. Ca *"`seen` muộn hơn `asOf`"* **hiện ra như một điều kiện đọc được**, gộp vào luật hiển thị của D6
   — không mở dòng TRƯNG mới, danh sách trưng vẫn **đúng 5 dòng**.

---

## 14. Năm lát — thứ tự, ranh giới, cái gì đang bị chặn

Theo khuôn Module G: mỗi lát một khối việc + tiêu chí ghim. **Một lát trong bay tại một thời điểm.**

| Lát | Việc | Gồm | Phụ thuộc |
|---|---|---|---|
| **I1** | **Mốc số liệu + gỡ số gõ tay khỏi quyền quyết định** | `asOf` (§13) · D4 (gỡ 6 chỗ tiêu thụ `obs.cov`) · D3 (chết theo D4) · F9 | — **làm đầu tiên**: không có mốc thì mọi con số sau đều đọc sai thành "bây giờ" |
| **I2** | **Bỏ hai cờ không mang thông tin** | D2 · F8 · nhóm luật 13/14 thành **khuyết** (bất biến 8) | Độc lập với I1 |
| **I3** | **Phả hệ nguồn + độ tươi chỉ số** | D1 (4 ca, gồm `m-ces` đúng số mà che trạng thái) · F7 · ca `m-contract` (T2 cũ) | ✅ **XONG 07/08** — gỡ chặn, xem dưới |
| **I4a** | **Màn Điểm đo: route + bảng 30 điểm + hai khối tầng ①/②** | F1 · bất biến 9 (câu giới hạn IN TRÊN MÀN) · khối kiểm kê · khối độ tin cậy (1 số thật + 5 ô chờ) · nav vào nhóm Quản trị | I1 (mốc số liệu) |
| **I4b** | **Hồ sơ một điểm đo — bốn mặt** | F2 · F4 · D5 · D6 | I4a. **F3 phần độ tươi nguồn HOÃN** — chặn bởi A1 |
| **I5** | **Chart giá trị + khối đếm + 5 tình trạng trưng** | F5 · F6 · T1 · T3 · T4 · T5 · T7 | ✅ **XONG 07/08** — xem cuối §14 |

**Hoãn sang lát 2:** F10 (khối ở Tổng quan) · mọi việc cần pipeline thật (Bảng D, mã lý do rớt, mốc
thấy cuối máy sinh, lưu lượng theo cửa sổ, tách trễ-pipeline khỏi trễ-nguồn — §10 và §12).

### I3 — XONG 07/08, đã tự kiểm độc lập

**Owner chọn: đổi cách chấm sang so với mốc số liệu** (không canh lại 5 số SLA). `sourceHealth(s,
cfg, asOf)` nay so `Source.last` với `CxmData.asOf` theo **NGÀY**; `cfg.source[id]` **mất quyền
quyết định hạng**. Thêm hạng thứ tư **`silent`** cho nguồn do người gửi (`chat`/`case`/`broker-note`/
`store-review`/`survey`): im lặng chưa phân định được là đứt hay không ai gửi. Nguồn theo lưu lượng
(`event`) im lặng vẫn là bất thường ⇒ `stale`. Commit `3849afa`.

`tsc -b` exit 0 · `vitest run` **102 file / 1175 test xanh** · `validateFixture()` **0 lỗi trên CẢ
HAI** fixture.

**Bốn thứ tôi tự đo lại, không tin báo cáo worker:**

1. **Bảy nhãn nguồn KHÔNG đổi cái nào** (`ok`×5 · `src-survey` `stale` · `src-zalo` `down`) — đổi
   thước mà giữ nguyên kết luận, nên bật được ngay. Đúng tinh thần cảnh báo tự-lừa của Module G:
   đây là **đổi thước**, không phải nguồn khoẻ lên.
2. **`cfg.source` mất quyền thật** — đặt cả 7 ngưỡng thành `999999`, hạng không đổi cái nào.
3. **Loại nguồn có quyền thật** — cùng dữ liệu (`vol` 0, thiếu 1 ngày), `kind: "chat"` ⇒ `silent`,
   `kind: "event"` ⇒ `stale`.
4. **Im lặng 1 ngày không bị đẩy oan thành `down`** (`deadDays` = 2).

**Hai chỗ tôi phải sửa sau worker:**

- **Sáu chuỗi UI còn nói "Trễ hơn SLA"** sau khi SLA mất quyền — chính là bệnh `Metric.freshness`
  mà module này sinh ra để chữa, chỉ khác chỗ đứng. Đổi hết sang *"Thiếu ngày dữ liệu"*
  (`SrcMatrix.tsx` · `rules/groups/SourceGroup.tsx` + test · `sources/SourceProfile.tsx` ·
  `sources/SourcesPage.tsx`), và chân trang `SourcesPage` *"còn trong SLA độ trễ của chính nó"* →
  *"đã giao đủ dữ liệu đến mốc số liệu"*.
- **`metricFreshnessText` in `lagH` (giờ) cạnh chữ hạng chấm bằng NGÀY** — `m-ces` đọc thành
  *"trễ 12 giờ · đang trễ"*, người xem tưởng 12 giờ làm nên chữ đó, thật ra là thiếu 1 ngày. Tách
  thành ba đoạn có tên trục (F7). Đây là cùng một bệnh với gạch đầu dòng trên, tái lập ngay trong
  chuỗi thay thế — đáng ghi lại.

**Một sai phạm vi tôi CHẤP NHẬN, không phải bỏ qua:** worker tràn ra **17 file**, gồm Module G và
`#/sources` mà contract đã loại trừ. Không tránh được về mặt cấu trúc — đổi chữ ký `sourceHealth()`
thì mọi chỗ gọi phải đổi theo. Đã kiểm test Module G bị lật vẫn **giữ nguyên chủ ý** (khẳng định
`cfg` vẫn ghi được, chỉ là nhãn không đổi theo nữa) và có chốt chống rỗng.

**Còn treo, KHÔNG thuộc I3:** hồ sơ điểm đo vẫn chưa hiện độ tươi nguồn — vì **chưa có trường nào
nối `Signal` → `Source`**, không phải vì chưa có cách chấm. Đó là việc dữ liệu, đã nằm ở §10.

**Món nợ I3 để lại cho Module G — phải trả, không được quên:** nhóm SLA nguồn ở `#/rules` **vẫn ghi
được** nhưng **không còn quyết định gì**. `module-g-rules-charter.md` §3 đã tuyên nhóm này là **BẢN
TẠM** nên nó không phá phạm vi Module G, nhưng một ô cấu hình gõ vào mà không đổi được gì là **đúng
loại bẫy** module này đang dọn. Đưa thành **C5** ở §0: hoặc bỏ nhóm đó, hoặc đổi nó thành ngưỡng
**theo ngày** để có quyền trở lại. Không tự quyết ở I5.

### I1 — XONG 07/08, đã tự kiểm độc lập

`tsc -b` exit 0 · `vitest run` **99 file / 1100 test xanh** · `validateFixture()` **0 lỗi trên CẢ HAI**
fixture · `asOf = "27/07/2026"` trên cả seed và demoData. Chưa commit. 15 file đụng, kiểm bằng mtime,
không tràn khỏi phạm vi lát.

**Test 1113 → 1100 (−13), đã đối chiếu:** `CoverageBlock.test.tsx` 18 → 4 (18 test cũ kiểm UI phân
dải theo `cov`, mà khối đó đã gỡ theo đúng chỉ định) `= −14`, cộng F9 mới `= +1`.

**Hai chỗ tôi phải sửa sau worker — cùng một bệnh, đáng ghi lại:**

1. **`JourneyStateBlock.test.tsx` ghim số, worker sửa bằng cách GHIM SỐ MỚI** (`"2"/"11"/"17"` →
   `"2"/"10"/"18"`). Số mới **đúng** — tôi tự đếm lại: `ok 18 · watch 10 · crit 2`, và `s-rut-4`
   (fail 2,34% · effort 2,0 không > 2,0 · cov 57) đúng là chuyển `watch → ok` vì trước đây nó
   *"watch" CHỈ nhờ `cov`*. Nhưng **đúng số không phải đúng cách**: đó chính là *"defect được đóng dấu
   thành hành vi đúng"* mà §7 cảnh báo, lần thứ ba. Đã đổi sang **đếm lại `stepState()` từ `seed`** —
   fixture đổi thì xanh, phân bố lệch thì đỏ.
2. **F9 ghim `expect(seed.obs.length).toBe(30)`** — đổi thành `toBeGreaterThan(0)`: vẫn chặn vòng lặp
   rỗng, nhưng thêm bước vào fixture không làm test đỏ oan.

### I2 — XONG 07/08, đã tự kiểm độc lập

`tsc -b` exit 0 · `vitest run` **99 file / 1099 test xanh** · `validateFixture()` **0 lỗi trên CẢ HAI**
fixture. 16 file đụng (kiểm mtime). Nhóm luật: `1..12, 15..23` — **13/14 khuyết, max vẫn 23**, không
đánh số lại. Chưa commit.

**Xoá field là VÔ TỔN THẤT — tự đếm lại để chứng minh:** hai hàm suy mới cho `có trích dẫn sơ đồ = 25`
và `đã chép bước = 6`, **khớp đúng** `verified=25` / `observed=6` đo được **trước** khi xoá. Và hai trục
**rời thật**, không phải một nhãn đội hai tên: `6` flow cả hai · **`19` chỉ có trích dẫn mà chưa chép
bước** · `0` chép bước mà không nguồn · `7` không cái nào. Con số 19 này **xác nhận độc lập T1** ở §6.

Test 1100 → 1099: `−2` (test của chính nhóm 13/14, kiểm một luật không còn tồn tại) `+1` (F8).

**Worker phát hiện đúng một chỗ tôi giao thiếu, và tôi KHÔNG khôi phục theo nguyên trạng:**
nhóm luật 14 cũ, bên trong nhánh `observed`, còn kiểm thêm *"mỗi bước phải có ≥1 obs"* — xoá cả nhóm
làm mất luôn kiểm đó. Nhưng khôi phục nguyên văn là **sai**: `stepState()` trả *"unknown"* cho bước
chưa đo và UI **đã** nói đúng chuyện đó, tức luật 14 cũ đang **cấm một trạng thái mà app hỗ trợ**.
Cách xử lý:

- **Giữ** hướng vô nghĩa-nếu-sai: **obs mồ côi** (trỏ bước không tồn tại) → đưa vào **nhóm 12**
  (toàn vẹn tham chiếu bản đồ), **không mở nhóm 24** ⇒ bất biến 8 nguyên vẹn. Đã tự kiểm luật này
  **không rỗng**: cắm một obs mồ côi vào fixture ⇒ validate **bắt được**.
- **Bỏ** hướng cấm-trạng-thái-thật: bỏ obs của một bước ⇒ validate **0 lỗi**, đúng chủ ý. Đưa thành
  **C4** ở §0 để owner quyết dứt điểm — vì hai chỗ này mâu thuẫn nhau **từ trước** module I.

**Hai test tôi bỏ ghim số sau worker** (worker không tạo, nhưng đã đụng file mà để nguyên):
`'Flow chưa đo'` ghim `26`/`32` → đếm lại từ `flowStepsCopied`; và ô ba trạng thái ở I1 (xem dưới).

**Đo được một điều đáng giữ về F9:** trên fixture hôm nay **chỉ 2/30 bước** từng bị `cov`/`effort` đẩy
trạng thái, và một trong hai (`s-tra-1`) bị đẩy bởi **`effort` 2,6**, không phải `cov`. ⇒ **`cov` chỉ
từng ảnh hưởng ĐÚNG MỘT bước** (`s-rut-4`). Một test F9 viết theo lối bốc một bước có **29/30 xác suất
xanh rỗng**. Đây là bằng chứng số cho luật *"quét hết, đừng bốc mẫu"* ở §7.

---

### I5 — XONG 07/08, đã tự kiểm độc lập. **Module I đóng.**

`tsc -b` exit 0 · `vitest run` **103 file / 1192 test xanh** · `validateFixture()` **0 lỗi trên CẢ HAI**
fixture. Worker đụng đúng **6 file**, tất cả trong `features/signals/`, **không tràn** (kiểm bằng
mtime, không bằng git).

**Năm số tôi tự đếm lại từ field thô** (không dùng hàm domain mà component dùng — nếu hàm sai thì
test dùng chính nó vẫn xanh), **khớp cả trên `seed` và `demoData`:**
T1 **19/25** (+7 riêng) · T3 **1/7** (`src-zalo` → `m-repeat`) · T4 **9/30, trong đó 7** ·
T5 **20/30** · T7 **2/6** (`m-ces`, `m-repeat`).

**Hai đường từ chối vẽ của F5 đều có ca thật, không phải nhánh chết:** 5 điểm đo `values` rỗng ⇒ từ
chối #1; và trên `seed` (`sigCounts` rỗng) cả 25 điểm đo có `values` đều rơi vào từ chối #2, còn
`demoData` (1.791 dòng) thì 0 ca. Tức Demo Mode tắt/bật đi hai đường khác nhau và cả hai đều chạy.

**Một bug tôi cắt sau worker — cùng loại với thứ §6 đã gạch T2/T6/T8:** bản đầu trưng cả năm dòng
T1·T3·T4·T5·T7 ở khối mới, trong khi **T4, T5, T7 ĐÃ hiện ở khối ①** ngay phía trên, cùng hàm, cùng
mẫu số, cùng câu chữ. Số không thể lệch (chung hàm) nên **đây không phải bug số mà là bug đọc**:
người xem đếm hai lần một chuyện. Cắt còn **T1 + T3**, đổi tên khối thành *"Bản khai không khớp thực
tế"*. Hai điều đáng ghi: (1) *"phải thấy được"* là yêu cầu về **MÀN**, không phải về **KHỐI**;
(2) test cho T5/T7 **không xoá theo** mà chuyển sang soi `inv-*` — trước lát này **chưa có test nào**
chạm hai dòng đó ở khối ①, xoá đi là mất phủ chứ không phải dọn trùng. Đã thêm một test **chống tái
phát**: `gov-t4/t5/t7` không được có mặt, kèm chốt chống rỗng.

**Mẫu số T1 worker sửa, tôi CHẤP NHẬN** (chi tiết ở dòng T1 §6): 19/32 → 19/25 + 7 đếm riêng. Đây
là sửa đúng, không phải lách để test xanh — 32 trộn *chưa-biết* vào mẫu số.

**Còn hở, tôi không lấp và nói rõ vì sao:** nhánh *"chiều đang chọn bị khoá"* ở chart giá trị **không
có ca thật nào** trên hai fixture hôm nay (`sigpf` luôn mở vì `projectSignalCounts` ghi dòng `sigpf`
cho mọi lần bắn). Dựng dữ liệu giả để phủ nhánh này là test một tình huống chưa ai chứng minh xảy ra
được — để dữ liệu thật quyết. Nhánh này thừa hưởng độ tin cậy từ cùng pattern đã chạy ở
`AtlasSignalPanel`.

---

## 15. Chưa cắt nhỏ hơn nữa

Owner chưa duyệt bản charter này. **Cắt section sau khi owner đọc §3, §5, §6, §7** — đặc biệt cần
owner xác nhận bốn mặt ở §3 là đúng thứ anh muốn quản trị, trước khi chia việc.

### Hình dạng đề nghị — **một quyết định, không phải tám**

| | Bản viết lần đầu | Bản này |
|---|---|---|
| DỌN | 4 (D1–D4) | **5** — D3 gộp vào D4; **thêm D5** (chẩn đoán `Signal.st`, *không* kèm luật mới) và **D6** (bẫy `Signal.seen`) |
| TRƯNG | 7 (T1–T7) | **5** — bỏ T2 (gộp D1), T6 (sang §10), T8 (gộp T4) |
| Tiêu chí | 10 (F1–F10) | **9** — hoãn F10 sang lát 2 |

**Nhỏ hơn bản owner đang đọc, dù có thêm hai chỗ dọn.** Hai thứ thêm vào đều là **bẫy làm màn nói
dối** nếu không biết trước, không phải tính năng: D6 khiến người dựng vô tình báo *"hầu hết điểm đo
đã chết"*; D5 khiến người dựng tưởng `Signal.st` là một sự thật trong khi nó là hai.

Ba việc **giao người** ở §10 (`stationId`, `sg-nap-3`, mốc thấy cuối thật) không tốn dòng code nào
trong module — nhưng không giao thì lát 2 lại gặp đúng ba chỗ đó.
