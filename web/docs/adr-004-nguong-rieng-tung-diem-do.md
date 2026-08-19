# ADR-004 — Ngưỡng riêng từng điểm đo (`cfg.signal`)

Status: **ACCEPTED.** Owner chốt 19/08/2026 qua ba vòng hỏi: (1) *"mỗi 1 signal có thể đo khác
nhau và có ngưỡng cảnh báo và báo động khác nhau"* — có nên gộp `#/signals` với `#/rules`; (2)
*"cả tháng chỉ có 1 2 report nhưng đều là xấu nên tỷ lệ quá thấp thì sao"*; (3) *"cái thì cần báo
cáo nếu hiếm mà nghiêm trọng còn cái khác thì sẽ báo khi % giảm"*. Schema chốt SAU vòng 3, không
phải bản đầu.
Date: 19/08/2026
Phạm vi: nhóm cấu hình `cfg.signal` + engine `domain/signalEval.ts` + hai chỗ tiêu thụ (nhóm
"Signal thresholds" ở `#/rules`, hai hàng Evaluation/Threshold ở `SignalDrawer`). **Không** gộp
màn — câu hỏi IA đó vẫn treo như ADR-003 đã ghi.

---

## Bối cảnh

`#/signals` trưng 30 điểm đo nhưng không điểm nào có ngưỡng riêng: trạng thái duy nhất là vòng đời
(`Signal.st`) và các nhãn suy từ nguồn. `#/rules` có band riêng từng CHỈ SỐ (nhóm 2) nhưng không có
gì cho ĐIỂM ĐO. Câu owner hỏi lộ đúng lỗ hổng: `ekyc_document_capture_result` cần canh **tỉ lệ
fail vượt lên**, `account_open_started` cần canh **lưu lượng tụt xuống**, khiếu nại nghiêm trọng
cần canh **số lượt tuyệt đối dù hiếm** — ba bài toán khác nhau, không một cặp watch/crit chung nào
tả nổi.

## Quyết định

### 1. Union 4 kind, MỖI ĐIỂM ĐO ĐÚNG MỘT DỤNG CỤ

`CfgSignalBand` (`data/schema/config.ts`) là discriminated union:

| kind | đo gì | chiều xấu | warn/crit |
|---|---|---|---|
| `badRate` | % lượt mang giá trị xấu (`bad[]`) | vượt LÊN | warn < crit, đơn vị % |
| `goodRate` | % lượt mang giá trị tốt (`good[]`) | tụt XUỐNG | warn > crit, đơn vị % |
| `floor` | số lượt bắn trong cửa sổ | tụt XUỐNG | warn > crit, đơn vị lượt/cửa sổ |
| `ceiling` | số lượt bắn trong cửa sổ (lọc `bad[]` tuỳ chọn) | vượt LÊN | warn < crit, đơn vị lượt/cửa sổ |

Một điểm đo một entry — KHÔNG mảng nhiều dụng cụ. Lý do: hai dụng cụ trên một điểm đo là hai
trạng thái có thể nói ngược nhau trên cùng một dòng bảng, và chưa có ca thật nào đòi. Đường mở
rộng đã ghi trong docblock schema: đổi value thành mảng khi ca thật xuất hiện, không đổi hình
từng phần tử.

### 2. `minN` — mẫu nhỏ thì NÓI KHÔNG ĐỦ MẪU, không tính tỉ lệ

Vòng hỏi 2 của owner: 1–2 report/tháng đều xấu ⇒ 100% fail trên n=2 là con số gây hoảng vô nghĩa.
`minN` (tuỳ chọn, chỉ hai kind tỉ lệ) đặt sàn mẫu: `n < minN` ⇒ `unknown('small-sample')` kèm câu
*"chưa đủ mẫu"*, KHÔNG rơi về ok và KHÔNG hiện %. Ca hiếm-mà-nghiêm-trọng KHÔNG giải bằng hạ
`minN` — nó là việc của `ceiling` đếm tuyệt đối (vòng hỏi 3): `sg8` preset `ceiling bad:["fail"]
winDays:30 warn:1 crit:3` — một lượt fail trong 30 ngày là watch ngay, không cần tỉ lệ.

### 3. `winDays` khai theo ĐIỂM ĐO, mặc định 7 — không theo màn

Cùng lý do `signalStatus.ts` từng được tách: một điểm đo phải nói MỘT trạng thái ở mọi màn. Cửa
sổ là `[asOf − (winDays−1), asOf]` tính theo ngày UTC, biên trái lấy cả. Ngưỡng floor/ceiling là
**lượt mỗi cửa sổ**, không phải lượt mỗi ngày — nhãn đơn vị trên UI ghi rõ `lượt/{win}d` để không
ai đọc nhầm. floor/ceiling đòi `instAt ≤ đầu cửa sổ`: `instAt` null ⇒ `no-instAt`, cắm giữa cửa
sổ ⇒ `partial-window` — KHÔNG chia tỉ lệ bù (prorate là bịa số trên đoạn chưa đo).

### 4. `goodRate` fail-safe TRƯỚC giá trị chưa khai

Vì sao cần cả `goodRate` khi đã có `badRate`: mẫu số là TỔNG lượt, nên pipeline bắn ra một giá trị
MỚI chưa khai sẽ pha loãng tỉ lệ tốt ⇒ `goodRate` TỤT ⇒ báo động. `badRate` với cùng ca đó im lặng
(giá trị mới không nằm trong `bad[]`). Điểm đo mà giá trị lạ là chuyện đáng báo (`sg-nap-3`:
`immediate` phải áp đảo) khai `goodRate`; điểm đo mà giá trị mới là chuyện thường khai `badRate`.
Đây là cùng triết lý ADR-003 §5: bản khai chậm hơn dữ liệu là trạng thái phải HIỆN, không phải lỗi.

### 5. Thiếu entry = CHƯA ĐẶT, không bao giờ rơi về ok

`cfg.signal[id]` không có ⇒ `unknown('unset')` — cùng luật với `cfg.step.jc/reg` (bỏ trống = chưa
tính được), KHÁC `cfg.source` (có fallback). Tám lý do unknown có tên riêng
(`SignalEvalUnknownWhy`): `unset · no-values · lifecycle · bad-asof · no-instAt · partial-window ·
no-fires · small-sample` — đúng luật nhà **không trộn chưa-biết với thiếu**, mỗi lý do một câu
tiếng Việt ở `signalEvalWhyText()` dùng chung cho mọi màn. Vòng đời (`Signal.st` = gap/designed)
chặn đánh giá qua `lifecycle`, trực giao với chuyện có band hay không.

### 6. Ranh giới kiểm tra: leaf vào nhóm 24, mâu thuẫn vào lưới mềm

**Đây là chỗ LỆCH so với bản đề xuất đã duyệt** (đề xuất để kiểm `minN`/`winDays` trong
`cfgIssuesTyped`) — lý do lệch: repo đã chia sẵn hai tầng ở Module G §"quyết định 4" (12/08) —
miền xác định từng ô là **lỗi cứng** nhóm 24 (`NUM_RANGE`, `setCfg` ném), ngưỡng nói ngược nhau là
**cảnh báo mềm**. Lặp kiểm leaf ở lưới mềm là hai nhà cho một luật. Kết quả:
`signal.*.warn/crit/minN/winDays` khai vào `NUM_RANGE`; `cfgIssuesTyped` nhóm `"signal"` chỉ soi
(a) warn/crit ngược chiều kind, (b) giá trị trong `bad`/`good` không có trong `Signal.values`.
`bad`/`good` RỖNG không phải mâu thuẫn — là entry khai dở, `signalEval` trả `no-values`.

### 7. Hai chỗ tiêu thụ, một đường đếm

- Nhóm **"Signal thresholds"** ở `#/rules` (`groups/SignalBandGroup.tsx`): bảng chia nhóm theo
  phase (dùng lại `groupSignalsByPhase` bên `#/signals` — một phân hoạch, không viết bản thứ hai),
  mỗi dòng chọn kind + chip giá trị + 4 ô số, cột status hiện đánh giá SỐNG từ `signalEvalAll`.
  Chấm đỏ menu đếm **crit**, KHÔNG đếm unset — 25/30 điểm chưa đặt là việc còn làm, không phải
  25 đám cháy (tương phản chủ ý với nhóm Mức của từng bước, nơi bỏ trống được trưng).
- **Drawer** `#/signals` thêm hai hàng: *Evaluation* (trạng thái + số đo hoặc lý do unknown, cùng
  `signalEval` — không tự suy lại) và *Threshold* (band chỉ-đọc + lối `#/rules/signal`). Route
  `/rules/:group` thêm cho lối đó; menu bấm trong màn vẫn là state cục bộ, URL không đổi theo —
  chấp nhận ở mức prototype.

### 8. Preset 5/30 trong `cfgDefault` — đủ kể chuyện, không đặt hộ 30

`sg1` floor · `sg3` badRate (crit với demo: 30,8% fail) · `sg4` ceiling đếm-tất · `sg8` ceiling
lọc fail (ca hiếm-nghiêm-trọng, watch) · `sg-nap-3` goodRate (ok, 91% immediate). Đã cân chỉnh
bằng cách đo demoData thật để Demo Mode hiện đủ ok/watch/crit/unset — không phải số khuyên dùng
cho production. 25 điểm còn lại unset là CHỦ Ý: trưng trạng thái "chưa đặt" là một phần của bảng.

## Không thuộc phạm vi

- **Gộp màn** `#/signals` ↔ `#/rules` — vẫn là câu hỏi IA treo (ADR-003).
- **Nhiều dụng cụ trên một điểm đo** — chờ ca thật (mục 1).
- **Nối crit vào pipeline cảnh báo** (`anomaly`/`sub`) — chưa có yêu cầu.
- ~~**Nghĩa của `Signal.vol`**~~ — **ĐÃ SỬA cùng ngày (owner chốt 19/08):** "nếu đã per day hay
  per thời gian thì cần phải đọc đúng trong timeframe đó". Ba tầng "Traffic per day" (bảng ·
  drawer · hồ sơ) đổi sang `signalTraffic()` — đếm hạt thô trong cửa sổ 7 ngày cố định, cổng
  unknown kế thừa signalEval (lifecycle/no-instAt/partial-window, không prorate; 0 lượt cửa sổ đủ
  ngày = đo được 0). Chỗ KHÔNG có hạt thô thì sửa NHÃN cho khớp số: Atlas "Volume/ngày"→"Volume
  tổng", chân chart bỏ "/ngày", hai màn Nguồn bỏ "trong kỳ"/"kỳ" (`Source.vol` không gắn kỳ).
  Ngữ nghĩa đóng đinh bằng docblock tại `Signal.vol` (schema/journey.ts) và `Source.vol`
  (schema/voc.ts). Câu "9.510 lượt/ngày" trong charter Module I (§T4) là cách đọc cũ — số đó là
  tổng cả đời.

## Trigger mở lại

- Một điểm đo thật cần đồng thời hai dụng cụ (vd. vừa floor lưu lượng vừa badRate) ⇒ mở mục 1.
- Bên dữ liệu chốt nhịp giao thật ⇒ xem lại mặc định `winDays = 7` và các preset.
- Nhóm cấu hình này về sau cần theo SET (`cfg.sub` là tiền lệ per-set) ⇒ đổi khoá, viết ADR mới.
