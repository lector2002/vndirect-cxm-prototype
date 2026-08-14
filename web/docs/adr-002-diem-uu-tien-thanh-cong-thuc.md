# ADR-002 — Điểm ưu tiên điểm gãy tính bằng công thức

Status: **ĐÃ DỰNG 14/08.** 18/20 node đã chốt · 2 hoãn (§7 `rep`, §20 CES — cả hai chờ câu trả
lời ngoài repo, cả hai có mặc định đang chạy) · Fog rỗng.
Owner duyệt tổng thể 14/08 (*"đa số là ok r, làm đơn giản thôi"*) kèm chỉ dẫn: dữ liệu nào thực sự
cần thì ghi vào một bản để đi xin, vừa làm vừa dựng — bản đó là `web/docs/ideal-data-model.md`.
Owner chốt trực tiếp §1 · §3 (thang) · §5 · §6 · §10 · §11 · §12 · §16 · §17 · §18 · §19; các mục
còn lại **chốt theo uỷ quyền, chờ owner review tổng thể**. Mỗi mục ghi rõ thuộc loại nào.
**Chưa có spec thị giác khoá** cho ba mặt người dùng thấy (§13 nhóm 6 · §17 `@toppri` · §19 `#/work`
chia hai khối) — đó là việc còn chặn giao cho `/flow`.
Date: 14/08/2026
Phạm vi: `IssuePri` — điểm ưu tiên của điểm gãy, và các khoá xếp hạng ở `#/work` + `@toppri`.
Bản đồ nguồn: `.scratch/diem-uu-tien-thanh-cong-thuc/map.md`
Dữ liệu còn phải xin: `web/docs/ideal-data-model.md`.

**Đã dựng:** `data/priority.ts` (hàm tính) · `cfg.pri` + `cfg.hv` + `cfg.step.jc`/`reg` (schema) ·
nhóm 6 mở khoá kèm xem trước thứ hạng · nhóm mới "Mức của từng bước" · `#/work` chia hai khối ·
`@toppri` còn ba card, đổi cách nói · `iss[].pri` và `imp.aff`/`imp.hv`/`imp.csat` đã rút khỏi dữ
liệu · bất biến tổng thành phần trong `validate` đã bỏ, thay bằng nhóm 25 (trọng số + `cfg.hv` +
hai bảng mức theo bước).

**Đo được ngay sau khi dựng:** tối đa 2/7 khoá (`sev`, `hv`) — riêng CXI-024 và CXI-028 chỉ 1/7 vì
`cust: []` nên `hv` cũng chưa tính được ⇒ cả sáu điểm gãy seed nằm ở khối
*"chưa đủ dữ liệu để xếp"*. Đó là trạng thái ĐÚNG theo §14/§19, không phải hồi quy.

**Một lệch so với ADR, ghi để không tái tranh luận:** §10 định canh `cfg.hv.values` phải là nhãn dải
có thật. Lối đó đã thử và BỎ trong chính phiên dựng — nhãn sinh từ `cuts`, nên bắt thành lỗi bất
biến khiến `setCfg` chặn luôn việc SỬA RANH GIỚI DẢI (Module E). Thay bằng: `measureHv` trả *chưa
tính được* khi khai báo lệch khỏi bộ nhãn hiện tại — cùng luật, áp ở tầng đọc thay vì tầng chặn.

---

## Bối cảnh

Sáu thành phần điểm ưu tiên (`sev` · `aff` · `jc` · `rep` · `tr` · `reg`) hôm nay là **số gõ tay
trong fixture**, và `pri.total` là **trường lưu** mà `validate.ts:124-125` cưỡng chế bằng tổng sáu
thành phần. Vì `total` nằm trong dữ liệu, đổi một trọng số là phải chạy lại mọi điểm gãy — nên nhóm
6 trên `#/rules` buộc phải **chỉ đọc** (`module-g-rules-charter.md:160-165`).

Không phải greenfield: `data/mock-repository.ts:322-333` (`createIssue`) đã tính `pri` cho điểm gãy
tạo mới — `sev` tra bảng {critical 30 · high 22 · medium 14}, `aff = min(24, round(failed/100))`
(**đã là mốc neo cố định + trần**), `jc = 14` hằng số, ba khoá còn lại để 0 kèm comment *"thà để 0
còn hơn đoán"*.

Ràng buộc không thương lượng:

- App **hiển thị dữ liệu, không luận giải** (owner 11/08).
- **Không khai schema trước chỗ tiêu thụ** — tiền lệ `anomalyX` đã bỏ (`schema/config.ts:15-20`).
- **Không trộn *chưa-biết* với *thiếu***.
- Thứ tự tầng `data → store → domain → design-system → features`; phép cộng ở `data/`.

---

## Quyết định

### 1. Điểm ưu tiên là HÀM TÍNH trong app, từ SỐ ĐO THÔ · *owner chốt trực tiếp*

Dữ liệu chỉ mang **số đo**. Tầng `data/` chiếu thành điểm:

```
total = Σ  w[k] · norm[k](x[k])          k ∈ {sev, aff, jc, rep, tr, reg, hv}
```

- `x[k]` — số đo, do `data/` tính từ dữ liệu thô.
- `norm[k]` — chuẩn hoá 0..1, **cố định trong code**, không cho sửa.
- `w[k]` — trọng số, **ở `cfg`**, owner sửa trên `#/rules`.

Bỏ hẳn trường `total` **và** cả sáu thành phần khỏi dữ liệu.

**Hệ quả:** bất biến `validate.ts:124-125` biến mất; lý do *"vì sao nhóm 6 chỉ đọc"*
(`module-g-rules-charter.md:160-165`) **hết hiệu lực** — charter đó phải sửa khi dựng; owner đổi
trọng số ⇒ thứ hạng đổi ngay, đúng khuôn ranh giới dải NAV đang chạy (`SegmentGroup` →
`cfg.segment.band` → `projectBands` → chart chiếu lại).

**Bác "pipeline SQL tính, app chỉ đọc"** — dù nó đọc luật 11/08 theo nghĩa chặt nhất. Trọng số nằm
ngoài `cfg` thì owner không sửa được trên màn, mỗi lần đổi là một ticket cho bên dữ liệu, nhóm 6
vĩnh viễn chỉ đọc. Luật 11/08 cấm app **tự nghĩ ra luật**, không cấm app **áp luật owner đã khai**;
`metricState()` tính `ok/watch/crit` từ `cfg.metric` là tiền lệ đã chạy.

**Bán kính đã đo:** 5 chỗ production đọc `pri.total`; 6 tham chiếu trong test, **cả sáu đã tính lại
từ dữ liệu**; 6 điểm gãy seed mang `total` gõ tay.

### 2. Tách trọng số khỏi đo lường · *hệ quả của §1*

Ba chỗ: **số đo** ở dữ liệu · **`norm`** trong code · **trọng số + mốc neo** ở `cfg`.

### 3. Thang điểm: `norm` 0..1, trọng số cộng lại 100 · *owner chốt thang; neo uỷ quyền*

Điểm luôn trong 0..100, và trọng số tự nói *"khoá này chiếm bao nhiêu phần trăm quyết định"*.

**Mốc neo khai trong `cfg`**, không hằng trong code. Mặc định khởi điểm: `aff` 1.000 khách = 1,0
(kẹp trần) · `hv` 50 khách = 1,0 · `tr` ±50% = 1,0 · `rep` neo theo `cfg.data.repeatWarn`.
Bảng tra `sev`: `critical 1,0 · high 0,7 · medium 0,45` — giữ đúng tỉ lệ 30/22/14 đang chạy.

**Bác chuẩn hoá theo `max` của tập điểm gãy hiện có**: thêm một điểm gãy mới là điểm của mọi điểm
gãy cũ đổi, thứ hạng nhảy mà bản thân chúng không đổi gì.

**Bác neo tương đối theo bước** (`aff / obs.entered`): tự chuẩn hoá, nhưng đổi câu hỏi từ *"bao
nhiêu khách"* sang *"bao nhiêu phần trăm khách của bước"* — điểm gãy chạm 730 khách ở bước đông sẽ
xếp dưới điểm gãy chạm 60 khách ở bước vắng.

### 4. `sev`: GIỮ nhãn người chấm, BỎ điểm gõ tay · *uỷ quyền, chờ review*

**Bằng chứng bác "suy từ `metricState()`":** `CXI-021` (`critical`) và `CXI-026` (`medium`) **cùng
trỏ `m-liveness`** (`seed.ts:610, 646`). `metricState()` chỉ biết trạng thái của CHỈ SỐ nên cho hai
điểm gãy này cùng một kết quả — suy từ nó là xoá mất phân biệt. Mức nghiêm trọng là phán đoán về
ĐIỂM GÃY, không phải trạng thái của chỉ số nó trỏ tới.

Thứ phải bỏ là **điểm gõ tay**, không phải nhãn. Nhãn → điểm bằng bảng tra cố định trong code (§3).

**Bằng chứng số gõ tay đã trôi khỏi công thức:** bảng tra của `createIssue` là {30 · 22 · 14}, nhưng
seed có `CXI-024` (`high`) → **20** và `CXI-026` (`medium`) → **12**. Hai trong sáu điểm gãy lệch
khỏi chính bảng tra mà code dùng; `validate` không bắt vì chỉ kiểm tổng.

### 5. `jc` khai theo BƯỚC: `cfg.step.jc[stepId]` · *owner chốt trực tiếp*

Thang ba mức (thấp / vừa / cao), owner khai một lần cho **30 bước** trên `#/rules`. Mọi điểm gãy
trên cùng bước thừa hưởng — không có đường cho hai chỗ lệch nhau.

**Bước thiếu entry ⇒ `jc` CHƯA TÍNH ĐƯỢC (§9), không có mặc định.** Một mặc định là phán đoán trá
hình: *"bước này quan trọng vừa"* là câu khẳng định, không phải chỗ trống.

**Bác "suy từ vị trí trong hành trình"**: máy tính được, nhưng đó là app **tự nghĩ ra luật**.
**Bác "bỏ `jc`"**: mất khả năng nói *"bước này ít khách nhưng hỏng là mất tiền"*.

### 6. `reg` khai theo BƯỚC: `cfg.step.reg[stepId]` · *owner chốt trực tiếp*

Cùng khuôn `jc` — một màn, hai cột, điền cùng lúc. Thiếu entry ⇒ chưa tính được.

**Giá đã biết trước khi chốt:** hai điểm gãy trên cùng bước luôn cùng mức rủi ro pháp lý, kể cả khi
một cái chạm KYC còn cái kia chỉ là giao diện. Chấp nhận, vì lối "cờ theo từng điểm gãy có người
ký" quay về gõ tay từng điểm gãy. **Bác "cả hai, bước là nền, điểm gãy ghi đè"**: hai nguồn cho một
số — đúng loại lệch nhau mà `metric-direction.ts` đã phải đi dọn một lần.

### 7. `rep` — TREO, chờ bên hệ thống case · *uỷ quyền, chờ review*

Câu phải chuyển: *"case có gắn được với BƯỚC hành trình hoặc với lý do thất bại cụ thể không, gắn
bằng trường nào?"*

**Mặc định đang chạy:** `rep` là **chưa tính được** (§9), **không** phải 0. Bác lối lấy `m-repeat`
toàn cục gán cho từng điểm gãy — đó là tỉ lệ repeat của TOÀN BỘ khách, cùng lỗi hình dạng với §4 và
§16.

### 8. `tr`: bảng `obsTrend` hạt NGÀY, thước hai đầu · *uỷ quyền, chờ review*

Áp tiền lệ ADR-001, không phát minh mới:

1. `obsTrend = { step, period, entered, completed, failed }`, `period` hạt **ngày**; hạt hiển thị
   cộng lên từ ngày. **Không** thêm khoá kỳ vào `Obs` — cùng lý do ADR-001 §6.
2. Cửa sổ đọc **thanh timeframe chung** (`store/timeframe.ts`), không dựng cụm mốc riêng.
3. **Thước:** thay đổi tương đối giữa **kỳ đầu ĐO ĐƯỢC** và **kỳ ĐỦ gần nhất**. Hai chữ in hoa là
   hai bẫy đã trả giá ở ADR-001: kỳ đầu cửa sổ có thể là kỳ chưa đo (bước cắm muộn), và **kỳ cuối
   luôn chưa đủ** — tính cả nó thì mọi điểm gãy đều đọc thành "đang đỡ dần".
4. `tr` **âm được** (đang đỡ). Chưa đủ hai kỳ đo được ⇒ chưa tính được.

`obsTrend` là bảng **chưa có** — cùng loại yêu cầu dữ liệu với ADR-001 §6, nên xin một lần cùng
nhau.

### 9. Khoá chưa tính được KHÔNG vào tổng và KHÔNG thành 0 · *uỷ quyền, chờ review*

1. `createIssue` hôm nay để `rep`/`tr`/`reg` = 0 kèm comment *"thà để 0 còn hơn đoán"* — thành thật
   về ý định nhưng vẫn là *chưa-biết bị viết thành thiếu*: điểm gãy mới xếp thấp hơn thực chất.
2. `total` **luôn đi kèm số khoá đã tính** — `72 · đủ 7/7` hay `48 · thiếu 2/7`.
3. Bảng Top theo MỘT trục **loại** điểm gãy chưa tính được trục đó, thay vì xếp nó xuống cuối —
   xếp cuối là khẳng định *"trục này thấp"*, tức bịa.

Cùng luật với rule 2 của `signalChart.ts` và trạng thái (3) của ADR-001 §6.

### 10. "Khách giá trị cao" — KHÔNG chốt cứng, cho customize · *owner chốt trực tiếp*

`cfg.hv = { dim: <id chiều>, values: [<nhãn>…] }` — owner chọn giá trị/dải nào được coi là giá trị
cao, sửa trên `#/rules`, đổi khai báo là `imp.hv` chiếu lại ngay.

**Cảnh báo phải nói trước khi dựng — hai chiều không cùng độ chắc:**

- `nav` là chiều **cắt ngưỡng**: nhãn dải **sinh ra** từ `cfg.segment.band.nav.cuts`, luôn đóng và
  luôn đủ. Bộ chọn liệt kê chính xác 5 dải.
- `tier` là **string tự do**: `cfg.segment.values` **chưa có entry** (`seed.ts:1000-1002`),
  `validate` không kiểm giá trị lạ, luật gán chỉ sống trong generator demo (`demo.ts:236-244`). Bộ
  chọn chỉ liệt kê được **các giá trị tình cờ có trong dữ liệu** — một lỗi gõ ở nguồn đẻ ra một
  "tier" mới mà không ai báo.

⇒ **Mặc định `cfg.hv` = `nav` + hai dải cao** (`1-5tỷ`, `5tỷ+`), khớp luật gán tier trong generator
demo và khớp `certification-log.md:836-842`. Chọn `tier` **mở được**, nhưng màn phải nói thẳng rằng
danh sách tier là *"các giá trị đang thấy trong dữ liệu"*, không phải danh mục đã chốt. `tier` chỉ
thành chiều chắc chắn khi **Module E-e** chốt danh sách đóng — ngoài phạm vi ADR này.

**Kèm theo:** `imp.hv` thành SỐ ĐẾM ⇒ đóng luôn lỗ `validate` không kiểm chéo `hv` với `cust[]`
(`CXI-021` khai `hv: 9` trong khi `cust[]` chỉ có 4 khách, 1 người high-value).

### 11. `hv` là khoá THỨ BẢY, cộng vào điểm · *owner chốt trực tiếp*

Công thức có **bảy khoá**: `sev · aff · jc · rep · tr · reg · hv`, trọng số cộng lại 100.

Giá thường phải trả (thang đổi nghĩa, điểm cũ không so được với điểm mới) ở đây **gần bằng 0**: §1
đã bỏ hết điểm cũ khỏi dữ liệu, nên nếu làm **cùng đợt** thì không có điểm cũ nào để lệch. Làm sau,
thành một đợt riêng, thì giá này quay lại.

### 12. Bỏ hẳn card "Top theo tác động CES" khỏi `@toppri` · *owner chốt trực tiếp*

Card đọc `imp.csat` — số âm gõ tay — rồi `Math.abs(x)*10` và in đơn vị *"điểm CES × 10"*
(`TopPriorityBlock.tsx:54-58`). **Không có đường code nào** nối nó với `m-ces` hay `sv-ces-mtk`. Gốc
tích: `AI-CONTEXT.md:148` — cột gốc là *"Impact on NPS"*, đổi tên vì `sv-nps` paused.

Không hiện cái không đo được. `@toppri` còn ba trục. Bác "sửa nhãn thành CSAT": rẻ hơn nhưng vẫn để
một số gõ tay không nguồn đứng xếp hạng.

**Phải làm cùng lúc:** `IssueImp.csat` mất chỗ tiêu thụ cuối cùng ⇒ theo luật *không khai schema
trước chỗ tiêu thụ*, nó rút khỏi `IssueImp` chứ không nằm lại làm field mồ côi.

**Trigger mở lại:** CX Insight xác nhận khảo sát CES chấm được theo từng điểm gãy.

### 13. Mở nhóm 6 trên `#/rules` · *uỷ quyền, chờ review*

Theo đúng khuôn nhóm 7 (ranh giới dải): ô nhập `w[k]`, ghi qua `useCfgWrite`, `setCfg` ném ⇒ in
nguyên văn lý do và giữ state cũ.

**Xem trước TRƯỚC KHI LƯU** — hiện thứ hạng `#/work` sẽ thành thế nào với bản nháp, đúng tiền lệ
`SegmentGroup.previewCounts` (`SegmentGroup.tsx:71-87`). Đây là khác biệt đáng giá nhất so với nhóm
7: đổi ranh giới dải chỉ đổi cách chia, đổi trọng số **đổi thứ tự việc phải làm**.

**Phải sửa `module-g-rules-charter.md:80, 160-165`** — mục "Vì sao nhóm 6 chỉ đọc" hết hiệu lực,
không được để lại làm luật mồ côi.

### 14. Chuyển hết sang tính, không có đường song song · *hệ quả của §1*

`iss[].pri` biến mất khỏi `seed.ts`. 6 tham chiếu `pri.total` trong test đều đã tính lại từ dữ liệu
nên phần lớn tự sống; phải sửa tay là các oracle ghim số trong `certification-log.md` — đó là
**nhật ký**, ghi bản mới chứ không sửa lịch sử.

**Hệ quả không tránh được:** cho tới khi owner map xong điểm gãy → giá trị điểm đo (§16) và điền
xong `jc`/`reg` cho 30 bước, **sáu điểm gãy seed sẽ hiện "thiếu k/7"**. Đó là trạng thái ĐÚNG,
không phải hồi quy — hôm nay chúng trông đủ vì số được gõ vào.

### 15. Khai `Cfg.pri` cùng lúc với hàm tính, không sớm hơn · *uỷ quyền, chờ review*

**Chỗ tiêu thụ đã tồn tại:** `#/work` sắp theo `pri.total` (`WorkPage.tsx:143`), `LanesBlock.tsx:49`,
`IssueBar.tsx:78`. Ba chỗ này đủ là consumer — **không** phải chờ màn `#/issue/:id` (Module B đang
HOÃN). Breakdown bảy thành phần cần màn đó, nhưng breakdown là **cách hiển thị**, không phải điều
kiện để công thức chạy.

**Ba cụm, ba đợt, mỗi cụm có consumer ngay trong đợt của nó:** `cfg.step.jc` + `cfg.step.reg` đi
cùng nhóm mới ở `#/rules` · `cfg.pri.w` + `cfg.pri.anchor` đi cùng nhóm 6 mở khoá · `cfg.hv` đi
cùng chỗ tính `imp.hv`.

### 16. `aff` đo theo GIÁ TRỊ CỦA ĐIỂM ĐO · *owner chốt trực tiếp*

**Lỗi thật trong công thức đang chạy:** `createIssue` lấy `aff = min(24, round(obs.failed/100))`,
tức số khách thất bại của cả **BƯỚC**. Nhưng `CXI-021` · `CXI-026` · `CXI-028` **cùng nằm trên bước
`s3`** (`seed.ts:610, 646, 655`), `obs.s3.failed = 2650` ⇒ cả ba nhận **cùng `aff = 24`** (kịch
trần), trong khi `imp.aff` gõ tay của chúng là **312 · 64 · 0**. Số gõ tay còn để lộ hai nghĩa đang
trộn: `CXI-024` có `imp.aff = 730` **bằng đúng** `obs.s1.failed`, còn `CXI-021` chỉ 312/2650.

**Ruling:** điểm gãy khai nó ứng với giá trị nào của điểm đo (vd. `CXI-013` ↔ `sg4 = 'blur'`), rồi
`aff = số khách bắn giá trị đó trong kỳ`. Dùng lại nền dữ liệu chart điểm đo (ADR-001 §6).

Ba thứ đi kèm, không tách rời:

1. **`Issue` cần liên kết mới tới giá trị điểm đo** — hôm nay `Issue` chỉ có `step` và `metric`.
   Trường mới này khai cùng lúc với hàm tính `aff` (§15).
2. **Một điểm gãy được ứng với NHIỀU giá trị.** Khi đó `aff` = **số khách bắn BẤT KỲ giá trị nào
   trong tập** — hợp, KHÔNG phải tổng lượt bắn. Cộng dồn sẽ đếm trùng khách gặp hai lý do, ở đúng
   khoá nặng nhất.
3. **Bước chưa cắm điểm đo phân loại ⇒ `aff` chưa tính được** (§9).

**Việc owner phải làm một lần:** map từng điểm gãy sang giá trị điểm đo.

### 17. `@toppri`: GIỮ ba bảng, ĐỔI CÁCH NÓI · *owner chốt trực tiếp*

Tiêu đề khối thôi nói *"Điểm gãy nào đáng xử lý trước"* — đổi thành **"Nhìn theo từng khoá"**.

Giữ vì một điểm tổng **che mất lý do**; ba bảng cho thấy VÌ SAO một điểm gãy lên đầu. Đổi chữ vì
sau §11 cả ba khoá của khối đều đã là thành phần của `pri.total`, nên để nguyên tiêu đề cũ là **hai
định nghĩa "đáng xử lý trước" chạy song song** — người xem không biết tin bảng nào.
**`#/work` là chỗ DUY NHẤT nói thứ tự việc phải làm.**

**Bác "bỏ khối"**: mất hẳn khả năng nhìn từng khoá, vì chỗ đúng để đặt breakdown là màn chi tiết
điểm gãy — mà màn đó đang HOÃN. **Bác "đổi thành một bảng breakdown"**: đắt hơn, và làm đúng việc
màn chi tiết sẽ làm ⇒ dựng bây giờ là dựng trước rồi bỏ.

Rẻ: chỉ sửa chữ, không đụng logic `TopPriorityBlock` ngoài việc bỏ card CES (§12).

### 18. Điểm SỐNG, không đóng băng thứ hạng · *owner chốt trực tiếp*

Thứ hạng luôn phản ánh dữ liệu mới nhất. Không thêm khái niệm "kỳ chấm điểm", **không lưu điểm đã
chốt ở đâu cả** — lưu thì lưu lại đúng cái §1 vừa bỏ. Câu `#/work` trả lời là *"giờ này cái gì đáng
làm nhất"*, không phải *"đầu tuần ta đã cam kết gì"*.

**Liên đới đã tính:** đổi trọng số ở nhóm 6 là thứ tự việc phải làm đổi **ngay lập tức** — §13 đã
đòi xem trước trước khi lưu chính vì lý do này, nên cú nhảy không đến bất ngờ.

**Trigger mở lại:** có người vận hành phàn nàn *"thứ tự cứ đổi, không làm việc được"*.

### 19. `#/work` chia hai khối; thiếu dữ liệu vào khối riêng · *owner chốt trực tiếp*

Danh sách **đã xếp được** (đủ 7/7) ở trên; khối **"chưa đủ dữ liệu để xếp"** ở dưới, mỗi dòng ghi
**thiếu khoá nào** (`thiếu: aff · jc · reg · rep · tr`).

Không giả vờ xếp được cái chưa xếp được — và khối đó **tự nó là danh sách việc-phải-điền** cho owner
(map điểm đo, điền `jc`/`reg` cho 30 bước).

**Giá đã biết, owner đã nhìn hình trước khi chốt:** tuần đầu sau khi dựng, khối trên **RỖNG** và cả
sáu điểm gãy nằm dưới. Đó là trạng thái ĐÚNG (§14), không phải hồi quy.

**Bác "xếp lẫn, chỉ đánh dấu"**: thiếu khoá thì điểm **thấp giả**, điểm gãy nặng mà chưa map sẽ tụt
xuống đáy và không ai thấy — đúng lỗi §9 sinh ra để chặn. **Bác "đẩy lên đầu bảng"**: một điểm gãy
vặt thiếu một khoá sẽ nằm trên điểm gãy nặng đủ dữ liệu — cũng là một lời khẳng định sai.

### 20. CES KHÔNG là khoá của điểm ưu tiên — TREO, có mặc định · *uỷ quyền, chờ review*

§12 đã dọn phần **sai** (card đọc `imp.csat` gắn nhãn CES). Câu còn lại là câu khác: CES thật — chỉ
số khảo sát thang 1–5, ngưỡng `watch 4,2 / crit 3,5` — **có nên** là khoá thứ tám?

Không tra được trong repo. Chặn bởi một câu cho CX Insight: *"khảo sát CES chấm được theo từng ĐIỂM
GÃY không, hay chỉ có điểm trung bình toàn bộ?"* Chỉ có điểm tổng thì lối này chết — một con số
toàn cục gán cho từng điểm gãy là đúng lỗi hình dạng của §4, §7, §16.

**Mặc định đang chạy:** CES **không** có mặt. **Bảy** khoá, không tám.

---

## Hai câu phải chuyển ra ngoài repo

| Cho ai | Câu |
|---|---|
| Bên hệ thống case | Case có gắn được với BƯỚC hành trình hoặc với lý do thất bại cụ thể không, gắn bằng trường nào? *(§7)* |
| CX Insight | Khảo sát CES chấm được theo từng điểm gãy không, hay chỉ có điểm trung bình toàn bộ? *(§20)* |

Cả hai đều **không chặn dựng** — mỗi câu có một mặc định đang chạy, và mặc định đó là *chưa tính
được* chứ không phải một con số bịa.

## Ngoài phạm vi

- **Lưu vết ai đổi `cfg` lúc nào** — hôm nay `cfg` không có cơ chế audit cho **bất kỳ nhóm nào**
  trong bảy nhóm. Đây là câu hỏi về cả `cfg`, không riêng nhóm 6; ADR này không mở một cơ chế audit
  cho một nhóm, vì làm vậy là để lại một nhóm cư xử khác sáu nhóm kia.
- **Module tuỳ biến `tier`** (Module E-e) · **màn `#/issue/:id`** (Module B, HOÃN) · **rework Bảng
  xử lý** (Module H, HOÃN) · **cơ chế ngưỡng metric** (`cfg.metric`, `metric-direction.ts` — đang
  chạy đúng, ADR này chỉ đọc).

## Trigger mở lại

- §1 mở lại nếu `cfg` mất vai trò mặt điều khiển của owner.
- §4 mở lại nếu `aff` chia được theo giá trị điểm đo (§16) và phần "nghiêm trọng" hoá ra trùng lặp
  với `aff` — lúc đó mới bàn được việc bỏ hẳn `sev`.
- §6 mở lại khi có ca thật mà hai điểm gãy cùng bước phải khác mức pháp lý.
- §7 chốt nốt khi bên hệ thống case trả lời.
- §8 chặn cho tới khi có `obsTrend`.
- §10 phần `tier` chốt nốt khi Module E-e chốt danh sách đóng.
- §12 mở lại khi CX Insight xác nhận CES chấm được theo từng điểm gãy.
