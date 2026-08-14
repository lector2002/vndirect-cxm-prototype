# Destination
Điểm ưu tiên của điểm gãy (`IssuePri`) chuyển từ **sáu con số gõ tay trong fixture** thành **công
thức máy tính ra được** — máy tính phần đo được, người khai một lần phần phán đoán, và không ai
phải gõ điểm cho từng điểm gãy nữa.

# Notes
Glossary: chưa có (`build-glossary` chưa chạy cho dự án này)
Nguồn sự thật trạng thái dự án: `AI-CONTEXT.md` (dừng ở 07/08) → `docs/SESSION-HANDOFF-12-08.md`
Charter liên quan: `web/docs/module-g-rules-charter.md` (nhóm 6 chỉ đọc, §"Vì sao nhóm 6 chỉ đọc") ·
`web/docs/module-b-issue-charter.md` (breakdown 6 thành phần — màn `#/issue/:id` đang HOÃN) ·
`web/docs/module-e-charter.md:23` (tier sẽ có module riêng)
Luật nhà bắt buộc mọi vòng phải giữ:
- app **hiển thị dữ liệu, không luận giải** (owner 11/08)
- **không khai schema trước chỗ tiêu thụ**
- **không trộn *chưa-biết* với *thiếu***
- cấm ngoại suy kiểu `monthly()`
- thứ tự tầng `data → store → domain → design-system → features`; phép cộng ở `data/`

Điểm xuất phát đã có sẵn trong code, không phải greenfield — `data/mock-repository.ts:322-333`
(`createIssue`) đã tính `pri` cho điểm gãy tạo mới: `sev` tra bảng {critical 30 · high 22 ·
medium 14}, `aff = min(24, round(failed/100))` (**đã là mốc neo cố định + trần**), `jc = 14` hằng
số, `rep`/`tr`/`reg` để 0 kèm comment *"thà để 0 còn hơn đoán"*. Mọi node dưới đây nên đọc là
"mở rộng hàm này thành đường duy nhất", không phải "dựng mới".

Số đo hiện trạng: **30 bước** (`seed.ts`), **6 điểm gãy** trong seed, cả 6 đều có `pri`/`imp` gõ
tay. `validate.ts:124-125` cưỡng chế `sev+aff+jc+rep+tr+reg === total`.

# Decisions

## 1. `pri.total` là TRƯỜNG LƯU hay HÀM TÍNH? [type: decide]
blocked by: —
status: resolved
> **resolution (owner chốt trực tiếp 14/08): HÀM TÍNH, trong app, từ SỐ ĐO THÔ.**
> Dữ liệu chỉ mang **số đo** (khách thất bại, số khách giá trị cao, xu hướng…). Tầng `data/` chiếu
> thành điểm bằng **trọng số + mốc neo khai trong `cfg`**. Bỏ hẳn trường `total` **và** cả sáu
> thành phần khỏi dữ liệu.
> Hệ quả trực tiếp: bất biến `validate.ts:124-125` biến mất; lý do "nhóm 6 chỉ đọc" của
> `module-g-rules-charter.md:160-165` **hết hiệu lực**; owner đổi trọng số trên `#/rules` là thứ
> hạng đổi ngay, không ai phải chạy lại gì — đúng khuôn ranh giới dải NAV đang chạy
> (`SegmentGroup` → `projectBands` → chart chiếu lại).
> **Bác lối "pipeline SQL tính, app chỉ đọc"** dù nó đọc luật *app hiển thị dữ liệu, không luận
> giải* theo nghĩa chặt nhất: trọng số nằm ngoài `cfg` thì owner không sửa được trên màn, mỗi lần
> đổi là một ticket cho bên dữ liệu, và nhóm 6 vĩnh viễn chỉ đọc. Luật 11/08 cấm app **tự nghĩ ra
> luật**, không cấm app **áp luật owner đã khai** — `metricState()` tính ok/watch/crit từ
> `cfg.metric` là tiền lệ đã chạy.
> **Bác lối "bỏ total, giữ 6 thành phần đã lưu"**: rẻ nhất nhưng sáu thành phần vẫn là điểm gõ tay,
> tức vấn đề gốc chưa giải — chỉ là bước đệm.
> **Bán kính đã đo:** 5 chỗ production đọc `pri.total` (`mock-repository.ts:333` · `validate.ts:125`
> · `IssueBar.tsx:78` · `LanesBlock.tsx:49` · `WorkPage.tsx:143`); 6 tham chiếu trong test và **cả
> sáu đã tính lại từ dữ liệu**, không ghim số cứng; 6 điểm gãy seed mang `total` gõ tay.
> Hôm nay `total` nằm trong dữ liệu và `validate.ts:124-125` khẳng định nó bằng tổng sáu thành
> phần. Chính vì lưu mà `#/rules` nhóm 6 buộc phải chỉ đọc (`module-g-rules-charter.md:160-165`:
> *"cho sửa trọng số mà không tính lại `total` sẽ bắn banner đỏ trên mọi màn"*).
> Đây là node gốc: mọi node khác đổi nghĩa tuỳ nó ngả bên nào. Nếu `total` thành hàm thì bất biến
> validate biến mất và nhóm 6 mở được; nếu giữ lưu thì phải trả lời "ai chạy lại và khi nào".

## 2. Tách TRỌNG SỐ khỏi ĐO LƯỜNG, hay giữ điểm tuyệt đối? [type: decide]
blocked by: 1
status: resolved
> **resolution (hệ quả của node 1, không phải phán đoán mới): TÁCH.** Lối owner chọn ở node 1 đã
> nói rõ ba chỗ: **số đo** ở dữ liệu · **`norm`** cố định trong code · **trọng số + mốc neo** ở
> `cfg`. Giữ điểm tuyệt đối là mâu thuẫn trực tiếp với "tính từ số đo thô".
> Phần CHƯA trả lời không thuộc node này mà chuyển sang node 3: thang của `w` (tổng bằng 100 hay
> tự do), và `norm` của từng khoá.
> Hôm nay `sev: 30` là đo-lường × trọng-số dính làm một, nên không sửa trọng số mà không đụng dữ
> liệu. Lối tách: `total = Σ w[k] · norm[k](x[k])` — `x` do `data/` tính, `norm` cố định trong code,
> `w` ở `cfg` cho owner sửa. Lối giữ: không có `w`, mỗi khoá tự mang thang riêng như hiện tại.
> Phải cân: tách thì mở được nhóm 6 nhưng thêm một bảng cấu hình nữa owner phải nuôi.

## 3. Mốc neo chuẩn hoá của từng khoá đo được [type: decide]
blocked by: 2
status: resolved
> **resolution (owner chốt trực tiếp 14/08 phần thang; phần neo uỷ quyền):**
> - Mỗi khoá `norm` về **0..1**; **trọng số cộng lại bằng 100**. Điểm luôn nằm trong 0..100, và
>   trọng số tự nói *"khoá này chiếm bao nhiêu phần trăm quyết định"*. Gần thang đang có (`total`
>   cao nhất 94) nên không ai phải làm quen lại con số.
> - **Mốc neo khai trong `cfg`, không hằng trong code** — cùng lý do node 1 đưa trọng số vào `cfg`.
>   Mặc định khởi điểm: `aff` **1.000 khách = 1,0** (kẹp trần), `hv` **50 khách = 1,0**,
>   `tr` **±50% = 1,0**, `rep` neo theo `cfg.data.repeatWarn` đang có.
> - **Bác chuẩn hoá theo `max` của tập điểm gãy đang có**: thêm một điểm gãy mới là điểm của MỌI
>   điểm gãy cũ đổi, thứ hạng nhảy mà bản thân chúng không đổi gì. Neo cố định thì điểm so được
>   **giữa các kỳ**, không chỉ trong một lần chấm.
> - **Bác neo tương đối theo bước** (`aff / obs.entered`): tự chuẩn hoá, không phải chọn số nào —
>   nhưng nó đổi câu hỏi từ *"bao nhiêu khách"* sang *"bao nhiêu phần trăm khách của bước"*, và một
>   điểm gãy chạm 730 khách ở bước đông sẽ xếp dưới một điểm gãy chạm 60 khách ở bước vắng.
> **Bảng tra `sev`** (node 4) cũng chuẩn hoá về 0..1: `critical 1,0 · high 0,7 · medium 0,45` —
> giữ đúng tỉ lệ 30/22/14 của bảng đang chạy, không phát minh tỉ lệ mới.
> **Bẫy phải tránh, ghi trước khi bàn:** đừng chuẩn hoá theo `max` của tập điểm gãy đang có — thêm
> một điểm gãy mới là điểm của mọi điểm gãy cũ đổi, thứ hạng nhảy mà bản thân chúng không đổi gì.
> Tiền lệ đã có trong code: `aff = min(24, round(failed/100))` — neo 100 khách/điểm, trần 24. Câu
> hỏi: giữ neo đó không, và neo của `rep`/`tr` là gì.

## 4. `sev` — suy từ `metricState()` hay giữ nhãn người chấm? [type: decide]
blocked by: —
status: resolved
> **resolution (uỷ quyền 14/08, bằng chứng bác lối tôi từng đề xuất): GIỮ nhãn `IssueSev` người
> chấm; BỎ điểm `pri.sev` gõ tay; nhãn → điểm bằng bảng tra CỐ ĐỊNH TRONG CODE.**
>
> **Bằng chứng bác "suy từ `metricState()`":** `CXI-021` (sev `critical`) và `CXI-026` (sev
> `medium`) **cùng trỏ metric `m-liveness`** (`seed.ts:610, 646`). `metricState()` chỉ biết trạng
> thái của CHỈ SỐ, nên cho hai điểm gãy này **cùng một kết quả** — suy từ nó là xoá mất phân biệt
> giữa hai điểm gãy trên cùng một chỉ số. Đây là cùng một lỗi hình dạng với node 16 (`aff` lấy cả
> bước gán cho từng điểm gãy).
> Mức nghiêm trọng là phán đoán về ĐIỂM GÃY, không phải trạng thái của chỉ số nó trỏ tới. Máy không
> thay được, và đó không phải thất bại — thứ phải bỏ là **điểm gõ tay**, không phải nhãn.
>
> **Bằng chứng phụ, cho thấy số gõ tay ĐÃ TRÔI khỏi công thức:** bảng tra của `createIssue` là
> {critical 30 · high 22 · medium 14}, nhưng seed có `CXI-024` (`high`) → **20** và `CXI-026`
> (`medium`) → **12**. Hai trong sáu điểm gãy lệch khỏi chính bảng tra mà code dùng, không ai bắt
> được vì `validate` chỉ kiểm tổng.
>
> **Còn lại, không thuộc node này:** thang điểm của bảng tra (30/22/14 giữ hay đổi) thuộc node 3.
> **Trigger mở lại:** nếu về sau `aff` chia được theo giá trị điểm đo (node 16), phần "nghiêm trọng"
> có thể trùng lặp với `aff` — lúc đó mới bàn được việc bỏ hẳn `sev`.
> `IssueSev` (`'critical'|'high'|'medium'`) đang gõ tay trên từng điểm gãy, trong khi hệ thống ĐÃ
> biết tự trả lời: `Issue.metric` bắt buộc có, và `domain/state.ts:53-60` cho `crit/watch/ok` từ
> `cfg.metric[id]`. Đây là khoá rẻ nhất để bỏ gõ tay.
> **Ca phải xử:** `metricState` trả `unknown` khi metric tắt (`on:false`) hoặc thiếu entry cfg —
> lúc đó `sev` là gì? Rơi về nhãn người chấm, hay là *chưa tính được* (node 9)?
> Và: ba mức của `metricState` chỉ có ba, khớp đúng ba mức của `IssueSev` — trùng khớp này là tình
> cờ hay là bằng chứng hai thứ vốn là một?

## 5. `jc` (mức quan trọng của bước) khai ở đâu, ai đặt? [type: decide]
blocked by: —
status: resolved
> **resolution (owner chốt trực tiếp 14/08): owner khai TỪNG BƯỚC, `cfg.step.jc[stepId]`, thang
> ba mức (thấp / vừa / cao), khai trên `#/rules`.**
> `jc` là thuộc tính của BƯỚC nên khai một lần cho 30 bước, không gõ lại theo từng điểm gãy — mọi
> điểm gãy trên cùng bước thừa hưởng cùng một `jc`, không có đường cho hai chỗ lệch nhau.
> **Bước THIẾU entry ⇒ `jc` là CHƯA TÍNH ĐƯỢC** (node 9), **không có mặc định**. Một mặc định là
> một phán đoán trá hình: "bước này quan trọng vừa" là câu khẳng định, không phải chỗ trống.
> Hôm nay `createIssue` để `jc = 14` cho MỌI bước, tức khoá này chưa phân biệt được bước nào với
> bước nào — 30 ô phải điền là giá của việc nó bắt đầu có nghĩa.
> **Bác "suy từ vị trí trong hành trình"** (bước càng cuối càng đắt): máy tính được, không ai phải
> điền, nhưng đó là **app tự nghĩ ra luật** — va thẳng luật owner 11/08.
> **Bác "bỏ `jc`"**: mất khả năng nói "bước này ít khách nhưng hỏng là mất tiền".
> `jc` là thuộc tính của **BƯỚC**, không phải của điểm gãy — cùng một bước thì mọi điểm gãy trên đó
> phải có cùng `jc`. Gõ theo từng điểm gãy là mời hai chỗ lệch nhau. `createIssue` đang để hằng số
> `jc = 14` cho mọi bước, tức hôm nay khoá này **không phân biệt được bước nào với bước nào**.
> Lối: `cfg.step.jc[stepId]` — 30 bước, owner khai một lần trên `#/rules`.
> Phải trả lời: thang mấy mức, thiếu entry thì mặc định bao nhiêu (và mặc định có phải một lời
> phán đoán trá hình không).

## 6. `reg` (rủi ro pháp lý / tuân thủ) — ai ký, khai theo gì? [type: decide]
blocked by: —
status: resolved
> **resolution (owner chốt trực tiếp 14/08): khai theo BƯỚC — `cfg.step.reg[stepId]`, cùng khuôn
> `jc` (node 5).** Một màn, hai cột, điền cùng lúc cho 30 bước; mọi điểm gãy trên bước thừa hưởng.
> Thiếu entry ⇒ **chưa tính được** (node 9), không mặc định — cùng luật với `jc`.
> **Giá đã biết trước khi chốt, ghi để không tái tranh luận:** hai điểm gãy trên cùng bước luôn
> cùng mức rủi ro pháp lý, kể cả khi một cái chạm KYC còn cái kia chỉ là giao diện. Chấp nhận,
> vì lối "cờ theo từng điểm gãy có người ký" quay về gõ tay từng điểm gãy — đúng thứ bản đồ này
> sinh ra để bỏ.
> **Bác lối "cả hai, bước là nền, điểm gãy ghi đè":** hai nguồn cho một số, đúng loại lệch nhau mà
> `metric-direction.ts` đã phải đi dọn một lần.
> **Trigger mở lại:** xuất hiện một ca thật mà hai điểm gãy cùng bước phải khác mức pháp lý.
> Khoá này **phải mãi là phán đoán** — bên pháp lý chấm, máy không suy được. Nhưng nó vẫn bỏ được
> khỏi "gõ tay mỗi điểm gãy": khai theo bước như `jc`, hoặc là cờ trên điểm gãy có người ký + ngày.
> Cần trả lời: ai là người có quyền đặt, có cần lưu vết đổi không, và một điểm gãy trên bước đã gắn
> cờ pháp lý có tự thừa hưởng không.

## 7. `rep` (liên hệ lặp lại) — nối điểm gãy với hệ thống case bằng khoá nào? [type: research]
blocked by: —
status: deferred
> **deferred 14/08 — không tra được từ trong repo, và không chặn dựng.** Câu phải chuyển cho bên
> vận hành hệ thống case: *"case có gắn được với BƯỚC hành trình hoặc với lý do thất bại cụ thể
> không, gắn bằng trường nào?"*
> **Mặc định đang chạy trong lúc chờ:** `rep` là **chưa tính được** (node 9), **không** phải 0.
> Bác lối lấy `m-repeat` toàn cục gán cho từng điểm gãy: đó là tỉ lệ repeat của TOÀN BỘ khách, không
> phải của nhóm gặp điểm gãy này — cùng lỗi hình dạng với node 16 và node 4.
> **Trigger mở lại:** bên case trả lời. Có khoá nối ⇒ `rep` thành khoá đo được; không có ⇒ `rep`
> ở lại *chưa tính được* vĩnh viễn và phải cân nhắc bỏ khỏi công thức.
> `imp.rep` đang là số gõ tay. Metric `m-repeat` có thật (repeat contact 7 ngày, nguồn `src-case`,
> ngưỡng `cfg.data.repeatWarn = 20`) nhưng nó là số **toàn cục**, không phải "repeat của nhóm khách
> gặp ĐIỂM GÃY NÀY". Cần tra bên dữ liệu: case có gắn được với bước/điểm gãy không, gắn bằng gì.
> Không tra được thì `rep` ở lại nhóm chưa-tính-được (node 9), không được để 0.

## 8. `tr` (xu hướng) — hình dạng dữ liệu nào? [type: decide]
blocked by: —
status: resolved
> **resolution (uỷ quyền 14/08 — áp tiền lệ ADR-001, không phát minh gì mới):**
> 1. **Bảng đếm thứ hai, hạt NGÀY**: `obsTrend = { step, period, entered, completed, failed }`,
>    `period` ở hạt ngày; hạt hiển thị cộng lên từ ngày. **Không** thêm khoá kỳ vào `Obs` — cùng lý
>    do ADR-001 §6 không thêm khoá kỳ vào `SigCount`.
> 2. **Cửa sổ đọc thanh timeframe chung** (`store/timeframe.ts`), không dựng cụm mốc riêng — tiền
>    lệ `App.tsx:21` và ADR-001 §5.
> 3. **Thước:** thay đổi tương đối giữa **kỳ đầu ĐO ĐƯỢC** và **kỳ ĐỦ gần nhất**, chuẩn hoá theo
>    mức đầu. Hai chữ in hoa là hai bẫy đã trả giá ở ADR-001: kỳ đầu cửa sổ có thể là kỳ chưa đo
>    (bước cắm muộn), và **kỳ cuối luôn chưa đủ** — tính cả nó thì MỌI điểm gãy đều đọc thành
>    "đang đỡ dần".
> 4. **`tr` âm được** (đang đỡ) — `CXI-013` hôm nay có `tr: -4`, giữ nguyên tính chất đó.
> 5. Chưa đủ hai kỳ đo được ⇒ `tr` **chưa tính được** (node 9), không phải 0.
> **Điều kiện chặn:** `obsTrend` là bảng CHƯA CÓ. Cùng loại yêu cầu dữ liệu với ADR-001 §6 và nên
> xin một lần cùng nhau, không xin làm hai đợt.
> `Obs = {stepId, entered, completed, failed, effort, cov}` — **KHÔNG có khoá kỳ**. Không có trục
> thời gian thì không có xu hướng để tính, nên hôm nay `tr` là số gõ tay (và âm được: CXI-013 có
> `tr: -4`).
> Cùng một câu hỏi hình-dạng-dữ-liệu mà ADR-001 §6 đã trả lời cho điểm đo (bảng đếm thứ hai, hạt
> NGÀY, `n` ba trạng thái). Câu ở đây: `Obs` thêm khoá kỳ, hay có bảng `obsTrend` riêng — và thước
> nào (độ dốc? so với kỳ trước? so với đầu cửa sổ?).
> **Liên đới:** cửa sổ nào cũng phải là thanh timeframe chung (`store/timeframe.ts`), đúng tiền lệ
> ADR-001 §5 — không dựng cụm mốc riêng.

## 9. Khoá CHƯA TÍNH ĐƯỢC thì `total` nói gì? [type: decide]
blocked by: 1, 2
status: resolved
> **resolution (uỷ quyền 14/08 — luật nhà ép, không phải phán đoán mới):**
> 1. Khoá chưa tính được **không vào tổng** và **không thành 0**. `createIssue` hôm nay để
>    `rep`/`tr`/`reg` = 0 kèm comment *"thà để 0 còn hơn đoán"* — thành thật về ý định nhưng vẫn là
>    *chưa-biết bị viết thành thiếu*: điểm gãy mới xếp thấp hơn thực chất, không màn nào nói vì sao.
> 2. `total` **luôn đi kèm số khoá đã tính** — `72 · đủ 6/6` hay `48 · thiếu 2/6`. Một con số trần
>    không nói được nó đứng trên bao nhiêu chân.
> 3. Bảng Top xếp theo MỘT trục (`@toppri`) **loại** điểm gãy chưa tính được trục đó, thay vì xếp
>    nó xuống cuối — xếp cuối là khẳng định "trục này thấp", tức bịa.
> Cùng luật với rule 2 của `signalChart.ts` và trạng thái (3) của ADR-001 §6.
> **Còn hở, thuộc Fog:** điểm gãy thiếu thành phần nên nằm ĐẦU bảng `#/work` (chưa biết, cần nhìn)
> hay theo đúng `total` đã tính. Chưa đủ rõ để thành ruling.
> `createIssue` hôm nay để `rep`/`tr`/`reg` = **0** kèm comment *"thà để 0 còn hơn đoán"* — thành
> thật về ý định nhưng vẫn là *chưa-biết bị viết thành thiếu*: điểm gãy mới xếp hạng thấp hơn thực
> chất, và không màn nào nói vì sao.
> Phải chốt: `total` thiếu thành phần thì hiện thế nào (điểm kèm dấu "thiếu 2/6"? khoảng thay vì
> một số? không xếp hạng?), và một điểm gãy thiếu thành phần đứng ở đâu so với điểm gãy đủ.

## 10. "Khách giá trị cao" đếm theo `tier` hay theo dải `nav`? [type: decide]
blocked by: —
status: resolved
> **resolution (owner chốt trực tiếp 14/08): KHÔNG chốt cứng — cho CUSTOMIZE.** Owner chọn
> **giá trị/dải nào được coi là "giá trị cao"**, khai trong `cfg`, sửa trên `#/rules`. Hình dạng:
> `cfg.hv = { dim: <id chiều>, values: [<nhãn>…] }` — cùng khuôn `cfg.segment` đang chạy, và đổi
> khai báo là `imp.hv` chiếu lại ngay, không sửa code.
>
> **Cảnh báo phải nói trước khi dựng — hai chiều KHÔNG cùng độ chắc:**
> - `nav` là chiều **cắt ngưỡng**: nhãn dải **sinh ra** từ `cfg.segment.band.nav.cuts`, luôn đóng
>   và luôn đủ. Bộ chọn liệt kê được chính xác 5 dải.
> - `tier` là **string tự do**: `cfg.segment.values` **chưa có entry** cho nó (`seed.ts:1000-1002`),
>   `validate` không kiểm giá trị lạ, và luật gán chỉ sống trong generator demo
>   (`demo.ts:236-244`). Bộ chọn chỉ liệt kê được **các giá trị tình cờ có trong dữ liệu** — một
>   lỗi gõ ở nguồn là đẻ ra một "tier" mới mà không ai báo.
> ⇒ **Mặc định của `cfg.hv` là `nav` + hai dải cao** (`1-5tỷ`, `5tỷ+`), khớp đúng luật gán tier
> trong generator demo hiện tại và khớp `certification-log.md:836-842` (owner đã chốt `nav` thay
> nghĩa mơ hồ của `tier:'high-value'`). Chọn `tier` **mở được**, nhưng màn phải nói thẳng rằng danh
> sách tier là "các giá trị đang thấy trong dữ liệu", không phải danh mục đã chốt.
> **Phụ thuộc ngoài phạm vi:** `tier` chỉ thành chiều chắc chắn khi Module E-e (module tuỳ biến
> tier) chốt danh sách đóng. Bản đồ này không mở việc đó.
> **Kèm theo:** `imp.hv` thành SỐ ĐẾM ⇒ đóng luôn lỗ `validate` không kiểm chéo `hv` với `cust[]`
> (CXI-021 khai `hv: 9` trong khi `cust[]` chỉ có 4 khách, 1 người high-value).
> `imp.hv` (số khách high-value bị ảnh hưởng) đang gõ tay, và **`validate.ts` không kiểm chéo với
> `cust[]`** — CXI-021 khai `hv: 9` trong khi `cust` chỉ liệt kê 4 khách, 1 người high-value. Không
> màn nào báo.
> Đếm được ngay từ `cust[].tier === 'high-value'`. NHƯNG: `tier` là **string tự do**, `cfg.segment.
> values` chưa có entry cho nó (`seed.ts:1000-1002`), luật gán chỉ tồn tại trong **generator demo**
> (`demo.ts:236-244`), và `certification-log.md:836-842` ghi owner đã chốt **`nav` thay nghĩa mơ hồ
> của `tier:'high-value'`**. `nav` thì có ranh giới cấu hình được, sửa trên `#/rules`, nhãn sinh từ
> cuts.
> Vậy: đếm theo `tier` (đang có, mơ hồ) hay theo dải `nav` cao (đã chốt về thiết kế, nhưng phải
> chọn dải nào là "cao")?

## 11. `hv` có thành thành phần THỨ BẢY của `pri` không? [type: decide]
blocked by: 2, 10
status: resolved
> **resolution (owner chốt trực tiếp 14/08): CÓ — `hv` là khoá thứ bảy, cộng vào điểm.**
> Vấn đề chạm nhiều khách giá trị cao thì xếp lên trên. Đo được ngay sau node 10 (đếm khách trong
> tập `cfg.hv`), không cần cơ chế mới.
> **Giá thường phải trả — ở đây gần bằng 0:** thêm khoá là thang điểm đổi nghĩa, điểm cũ không so
> được với điểm mới. Nhưng node 1 đã bỏ hết điểm cũ khỏi dữ liệu, nên nếu làm **cùng đợt** thì
> không có điểm cũ nào để mà lệch. Làm sau, thành một đợt riêng, thì giá này quay lại.
> ⇒ Công thức có **bảy khoá**: `sev · aff · jc · rep · tr · reg · hv`, trọng số cộng lại 100.
> Hôm nay `imp.hv` chỉ nuôi **một bảng Top-10 riêng** (`TopPriorityBlock.tsx:53`), không cộng vào
> `total`. Muốn "vấn đề chạm khách giá trị cao thì được ưu tiên hơn" thì đó là khoá thứ bảy — đo
> được, không cần cơ chế mới, nhưng đổi nghĩa của cả thang điểm và làm mọi điểm cũ không so được
> với điểm mới.

## 12. Nhãn "tác động CES" đọc `imp.csat` — sửa nhãn hay nối thật? [type: decide]
blocked by: —
status: resolved
> **resolution (owner chốt trực tiếp 14/08): BỎ HẲN card khỏi `@toppri`.** Không hiện cái không đo
> được. `@toppri` còn ba trục: số khách ảnh hưởng · khách giá trị cao · rủi ro tuân thủ.
> Bác "sửa nhãn thành CSAT": rẻ hơn nhưng vẫn để một số gõ tay không nguồn đứng xếp hạng.
> **Kèm theo, phải làm cùng lúc:** field `IssueImp.csat` mất chỗ tiêu thụ cuối cùng ⇒ theo luật
> *không khai schema trước chỗ tiêu thụ*, nó phải rút khỏi `IssueImp` chứ không nằm lại làm field
> mồ côi. Kiểm trước khi rút: `Math.abs(i.imp.csat)` chỉ còn dùng ở `TopPriorityBlock.tsx:56`.
> **Trigger mở lại:** CX Insight xác nhận khảo sát CES chấm được theo từng điểm gãy — lúc đó dựng
> lại card bằng dữ liệu thật, không phải bằng `csat` gõ tay.
> *(Cùng loại, chưa thành node: `Survey.state` cũng là chuỗi gõ tay, không suy từ `latest` so
> `target`, trong khi luật so đã có sẵn ở `metricState`. Một dòng là xong, nhưng nằm ngoài bản đồ
> này — ghi để không sót.)*
> `TopPriorityBlock.tsx:54-58` in *"Top theo tác động CES"*, đơn vị *"điểm CES × 10"*, nhưng đọc
> `imp.csat` — số âm gõ tay — rồi `Math.abs(x)*10`. **Không có đường code nào** nối nó với metric
> `m-ces` (thang 1–5, ngưỡng watch 4,2 / crit 3,5) hay survey `sv-ces-mtk`.
> Gốc tích: `AI-CONTEXT.md:148` — cột gốc là *"Impact on NPS"*, đổi tên vì `sv-nps` đang paused.
> Đổi nhãn mà không đổi dữ liệu ⇒ đúng loại lỗi *một con số in dưới cái nhãn nó không thuộc về*.
> Hai lối rất khác giá: sửa nhãn cho đúng thứ đang đọc (5 phút), hay nối thật với CES (phải hỏi CX
> Insight khảo sát có chấm được theo từng điểm gãy không — nếu không thì lối này chết).
> *(Cùng loại, ghi kèm để không sót: `Survey.state` cũng là chuỗi gõ tay, không suy từ `latest` so
> `target`, trong khi luật so đã có sẵn ở `metricState`.)*

## 13. Mở nhóm 6 trên `#/rules` cho sửa trọng số — tới đâu? [type: decide]
blocked by: 1, 2
status: resolved
> **resolution (uỷ quyền 14/08): MỞ, theo đúng khuôn nhóm 7 (ranh giới dải) đã chạy.**
> - Ô nhập trọng số `w[k]` cho sáu (hoặc bảy, node 11) khoá, ghi qua `useCfgWrite`.
> - **Xem trước TRƯỚC KHI LƯU**: hiện thứ hạng `#/work` sẽ thành thế nào với bản nháp — đúng tiền
>   lệ `SegmentGroup.previewCounts` (`SegmentGroup.tsx:71-87`) đếm khách mỗi dải trước khi lưu.
>   Đây là điểm khác biệt đáng giá nhất so với nhóm 7: đổi ranh giới dải chỉ đổi cách chia, đổi
>   trọng số **đổi thứ tự việc phải làm**.
> - `setCfg` ném ⇒ in nguyên văn lý do, state cũ giữ nguyên (`SegmentGroup.tsx:29-32`).
> - **Phải sửa `module-g-rules-charter.md:80, 160-165`** — mục "Vì sao nhóm 6 chỉ đọc" hết hiệu lực
>   theo node 1, không được để lại làm luật mồ côi.
> **Còn hở:** có lưu vết ai đổi trọng số lúc nào không. Chưa có cơ chế audit nào trong `cfg` cho
> bất kỳ nhóm nào, nên node này không tự mở ra một cái riêng — ghi vào Fog.
> Nhóm 6 hiện chỉ đọc, và charter ghi rõ lý do. Nếu node 1+2 ngả sang "tính", lý do đó biến mất và
> nhóm mở được. Câu còn lại: mở cho ai, có xem trước tác động lên thứ hạng trước khi lưu không
> (tiền lệ `SegmentGroup` đã làm `previewCounts` cho ranh giới dải), có lưu vết đổi không.

## 14. Sáu điểm gãy seed đang gõ tay — chuyển hết sang tính, hay giữ song song? [type: decide]
blocked by: 1, 3, 4
status: resolved
> **resolution (hệ quả của node 1, không phải phán đoán mới): CHUYỂN HẾT. Không có đường song
> song.** Node 1 bỏ cả `total` lẫn sáu thành phần khỏi dữ liệu, nên `iss[].pri` biến mất khỏi
> `seed.ts` — không còn cái gì để chạy song song.
> **Việc kéo theo, đã đo:** 6 tham chiếu `pri.total` trong test **đều đã tính lại từ dữ liệu**
> (`mock-repository.test.ts:274` ghi rõ *"tính lại trong test"*), nên phần lớn tự sống. Phải sửa
> tay: các oracle ghim số trong `certification-log.md` (vd. dòng 452 *"`pri.reg`: CXI-013(20) là
> ĐỈNH"*) — đó là **nhật ký**, sửa bằng cách ghi bản mới, không sửa lịch sử.
> **Hệ quả không tránh được:** cho tới khi owner map xong điểm gãy → giá trị điểm đo (node 16) và
> điền xong `jc`/`reg` cho 30 bước (node 5, 6), **sáu điểm gãy seed sẽ hiện "thiếu k/7"**. Đó là
> trạng thái ĐÚNG, không phải hồi quy — hôm nay chúng trông đủ vì số được gõ vào.
> `seed.ts:616,625,634,643,652,661` giữ `pri` gõ tay của 6 điểm gãy; nhiều test và oracle trong
> `certification-log.md` neo vào chính các số đó (vd. dòng 452: *"`pri.reg`: CXI-013(20) là ĐỈNH"*).
> Chuyển sang tính là các số đó đổi ⇒ phải sửa cả test. Giữ song song là có hai đường sinh điểm,
> đúng loại lệch mà `metric-direction.ts` đã phải đi dọn một lần.

## 15. Khai `Cfg.pri` (trọng số / neo / `jc` / `reg`) vào lúc nào? [type: decide]
blocked by: 2, 5, 6
status: resolved
> **resolution (uỷ quyền 14/08 — luật nhà ép): khai CÙNG LÚC với hàm tính đọc nó, không sớm hơn
> một commit.** Tiền lệ `anomalyX` đã bỏ (`schema/config.ts:15-20`) và ADR-001 §9 vừa dùng đúng
> luật này để chặn `Metric.formula`.
> **Chỗ tiêu thụ ĐÃ TỒN TẠI, không phải chờ ai:** `#/work` đang sắp theo `pri.total`
> (`WorkPage.tsx:143`), `LanesBlock.tsx:49` sắp trong từng làn, `IssueBar.tsx:78` hiện điểm. Ba chỗ
> này đủ là consumer — **không** phải chờ màn `#/issue/:id` (Module B đang HOÃN) dựng xong.
> Breakdown bảy thành phần thì đúng là cần màn đó, nhưng breakdown là **cách hiển thị**, không phải
> điều kiện để công thức chạy.
> **Thứ tự khai an toàn:** `cfg.step.jc` + `cfg.step.reg` (node 5, 6) đi cùng màn `#/rules` nhóm
> mới; `cfg.pri.w` + `cfg.pri.anchor` đi cùng nhóm 6 mở khoá (node 13); `cfg.hv` (node 10) đi cùng
> chỗ tính `imp.hv`. Ba cụm, ba đợt, mỗi cụm có consumer ngay trong đợt của nó.
> Luật nhà: **không khai schema trước chỗ tiêu thụ** — tiền lệ `anomalyX` đã bỏ
> (`data/schema/config.ts:15-20`), và ADR-001 §9 vừa dùng đúng luật này để chặn `Metric.formula`.
> Nên `Cfg.pri` chỉ được thêm cùng lúc với hàm tính đọc nó, không thêm trước. Node này giữ chỗ để
> không ai lỡ tay khai sớm.
> Câu phụ: màn `#/issue/:id` — nơi `module-b-issue-charter.md:273` định đặt "breakdown 6 thành
> phần" — **đang HOÃN, route là `Placeholder`**. Chỗ tiêu thụ thật của breakdown chưa tồn tại; điều
> đó có chặn việc này không, hay `#/work` (đang sắp theo `pri.total`) đã đủ là chỗ tiêu thụ?

## 16. `aff` đo bằng gì khi MỘT BƯỚC mang NHIỀU điểm gãy? [type: decide]
blocked by: 1
status: resolved
> **resolution (owner chốt trực tiếp 14/08): `aff` đo theo GIÁ TRỊ CỦA ĐIỂM ĐO.**
> Điểm gãy khai nó ứng với giá trị nào của điểm đo (vd. `CXI-013` ↔ `sg4 = 'blur'`), rồi
> `aff = số khách bắn giá trị đó trong kỳ`. Dùng lại đúng nền dữ liệu chart điểm đo (ADR-001 §6).
> **Ba thứ đi kèm, không tách rời được:**
> 1. **`Issue` phải có liên kết mới tới giá trị điểm đo** — hôm nay `Issue` chỉ có `step` và
>    `metric`, không có đường nào xuống tới giá trị. Đây là trường mới, và theo luật *không khai
>    schema trước chỗ tiêu thụ* thì nó khai cùng lúc với hàm tính `aff`, không sớm hơn.
> 2. **Một điểm gãy được ứng với NHIỀU giá trị** (vd. một điểm gãy gom cả `blur` lẫn `glare`).
>    Khi đó `aff` = **số khách bắn BẤT KỲ giá trị nào trong tập** — hợp, KHÔNG phải tổng lượt bắn.
>    Cộng dồn sẽ đếm trùng khách gặp hai lý do, và đếm trùng ở đúng khoá nặng nhất.
> 3. **Bước chưa cắm điểm đo phân loại ⇒ `aff` là CHƯA TÍNH ĐƯỢC** (node 9), không được lấy
>    `obs.failed` của cả bước gán cho từng điểm gãy.
> **Việc owner phải làm một lần:** map từng điểm gãy sang giá trị điểm đo. Sáu điểm gãy seed hôm
> nay chưa có map nào.
>
> **Phát hiện khi đo node 1 — đây là lỗi THẬT trong công thức đang chạy, không phải giả định.**
> `createIssue` (`mock-repository.ts:326`) lấy `aff = min(24, round(obs.failed/100))`, tức **số
> khách thất bại của cả BƯỚC**. Nhưng ba điểm gãy `CXI-021` · `CXI-026` · `CXI-028` **cùng nằm trên
> bước `s3`** (`seed.ts:610, 646, 655`), mà `obs.s3.failed = 2650` (`seed.ts:221`). Chạy công thức
> hiện tại thì cả ba nhận **cùng một điểm** `aff = 24` (kịch trần), trong khi `imp.aff` gõ tay của
> chúng là **312 · 64 · 0**.
> Số gõ tay còn để lộ hai nghĩa đang trộn: `CXI-024` có `imp.aff = 730` **bằng đúng**
> `obs.s1.failed = 730` (điểm gãy chiếm trọn bước), còn `CXI-021` chỉ 312/2650 (điểm gãy là một
> phần của bước).
> Câu phải trả lời: chia `obs.failed` cho các điểm gãy trên cùng bước bằng gì? Ứng viên duy nhất
> đang có là **giá trị của điểm đo** (`sg4 ekyc_document_fail_reason` cho từng lý do thất bại) —
> tức nối sang nền dữ liệu chart điểm đo. Không có đường chia thì `aff` phải là *chưa tính được*
> (node 9), **không** được lấy cả bước gán cho từng điểm gãy.

## 17. `@toppri` còn lý do tồn tại khi `hv` đã vào điểm? [type: decide]
blocked by: 11, 12
status: resolved
> **resolution (owner chốt trực tiếp 14/08): GIỮ ba bảng, ĐỔI CÁCH NÓI.**
> Tiêu đề khối thôi nói *"Điểm gãy nào đáng xử lý trước"* — đổi thành **"Nhìn theo từng khoá"**.
> Lý do giữ: một điểm tổng **che mất lý do**; ba bảng cho thấy VÌ SAO một điểm gãy lên đầu.
> Lý do đổi chữ: sau node 11, cả ba khoá của khối đều đã là thành phần của `pri.total`, nên để
> nguyên tiêu đề cũ là **hai định nghĩa "đáng xử lý trước" chạy song song** — người xem không biết
> tin bảng nào. **`#/work` là chỗ DUY NHẤT nói thứ tự việc phải làm.**
> Bác "bỏ khối": mất hẳn khả năng nhìn từng khoá, vì chỗ đúng để đặt breakdown là màn chi tiết điểm
> gãy — mà màn đó đang HOÃN (Module B).
> Bác "đổi thành một bảng breakdown": đắt hơn (dựng khối mới), và làm đúng việc mà màn chi tiết điểm
> gãy sẽ làm — dựng bây giờ là dựng trước rồi bỏ.
> **Rẻ: chỉ sửa chữ.** Không đụng `TopPriorityBlock` logic, ngoài việc bỏ card CES (node 12).
> *(graduate từ Fog 14/08 — hai ruling làm nó thành câu chính xác được.)*
> Fog cũ hỏi "ưu tiên là một số hay mấy trục". Nay đã cụ thể: node 12 bỏ card CES ⇒ `@toppri` còn
> **ba** trục (số khách ảnh hưởng · khách giá trị cao · rủi ro tuân thủ); node 11 đưa `hv` **vào**
> `total`. Tức cả ba trục còn lại đều đã là thành phần của điểm.
> Câu: `@toppri` là **cách nhìn xuyên vào từng khoá của cùng một điểm** (giữ, có giá trị chẩn đoán)
> hay là **định nghĩa thứ hai của "đáng xử lý trước"** đang chạy song song với `#/work` (bỏ)?

## 18. Thứ hạng tính lại liên tục — có cần mốc đóng băng? [type: decide]
blocked by: 1
status: resolved
> **resolution (owner chốt trực tiếp 14/08): ĐIỂM SỐNG, không đóng băng.**
> Thứ hạng luôn phản ánh dữ liệu mới nhất. Không thêm khái niệm "kỳ chấm điểm", **không lưu điểm
> đã chốt ở đâu cả** — nếu lưu thì lưu lại đúng cái node 1 vừa bỏ.
> Câu màn `#/work` trả lời là *"giờ này cái gì đáng làm nhất"*, không phải *"đầu tuần ta đã cam kết
> gì"*.
> **Liên đới đã tính:** đổi trọng số ở nhóm 6 là thứ tự việc phải làm đổi **ngay lập tức** — node 13
> đã đòi **xem trước trước khi lưu** chính vì lý do này, nên cú nhảy không bao giờ đến bất ngờ.
> **Trigger mở lại:** có người vận hành phàn nàn "thứ tự cứ đổi, không làm việc được".
> *(graduate từ Fog 14/08.)* Điểm là hàm ⇒ dữ liệu đổi là thứ hạng đổi, kể cả giữa kỳ. Hôm nay
> điểm là số lưu nên nó **đứng yên cho tới khi ai đó sửa**, và vận hành đang quen với sự đứng yên
> đó. Câu: `#/work` xếp theo điểm **sống** (đổi mỗi lần dữ liệu về) hay theo điểm **chốt tại một
> mốc** (đầu tuần/đầu kỳ), có nút xem điểm sống bên cạnh?
> Liên đới: nếu chọn "sống" thì đổi trọng số ở nhóm 6 là thứ tự việc phải làm đổi ngay lập tức —
> node 13 đã đòi xem trước trước khi lưu, chính vì lý do này.

## 19. Điểm gãy THIẾU thành phần đứng ở đâu trong `#/work`? [type: decide]
blocked by: 9
status: resolved
> **resolution (owner chốt trực tiếp 14/08): KHỐI RIÊNG "chưa đủ dữ liệu để xếp".**
> `#/work` chia hai phần: danh sách **đã xếp được** (đủ 7/7) ở trên, và khối **chưa đủ dữ liệu để
> xếp** ở dưới, mỗi dòng ghi **thiếu khoá nào** (`thiếu: aff · jc · reg · rep · tr`).
> Không giả vờ xếp được cái chưa xếp được — và khối đó **tự nó là danh sách việc-phải-điền** cho
> owner (map điểm đo, điền `jc`/`reg` cho 30 bước).
> **Giá đã biết và owner đã nhìn hình trước khi chốt:** tuần đầu sau khi dựng, khối trên **RỖNG**
> và cả sáu điểm gãy nằm dưới. Đó là trạng thái ĐÚNG (node 14), không phải hồi quy.
> Bác "xếp lẫn, chỉ đánh dấu": thiếu khoá thì điểm **thấp giả**, nên điểm gãy nặng mà chưa map sẽ
> tụt xuống đáy và không ai thấy — đúng lỗi node 9 sinh ra để chặn.
> Bác "đẩy lên đầu bảng": một điểm gãy vặt nhưng thiếu một khoá sẽ nằm trên điểm gãy nặng đủ dữ
> liệu — cũng là một lời khẳng định sai.
> *(graduate từ Fog 14/08 — node 9 cố ý để hở đúng chỗ này.)* Node 9 đã chốt: khoá chưa tính được
> không vào tổng, không thành 0, và `total` hiện kèm "thiếu k/7". Còn lại: một điểm gãy `48 · thiếu
> 3/7` xếp ở đâu so với `52 · đủ 7/7`?
> Ba lối: xếp theo `total` đã tính (đơn giản, nhưng thiếu thành phần thì điểm thấp giả) · đẩy lên
> ĐẦU (chưa biết thì cần nhìn trước) · tách thành một khối riêng "chưa đủ dữ liệu để xếp".
> **Không phải chuyện nhỏ:** ngay sau khi dựng, cả sáu điểm gãy seed đều thiếu thành phần (node 14).

## 20. CES có nên là một khoá của điểm ưu tiên không? [type: research]
blocked by: 12
status: deferred
> *(graduate từ Fog 14/08 — node 12 đã dọn phần SAI, còn lại là câu đúng nhưng chưa tra được.)*
> Node 12 bỏ card đọc `imp.csat` gắn nhãn CES. Câu còn lại là câu khác: CES — chỉ số khảo sát thật,
> thang 1–5, ngưỡng `watch 4,2 / crit 3,5` — **có nên** là khoá thứ tám không?
> **Không tra được trong repo.** Chặn bởi một câu cho CX Insight: *"khảo sát CES chấm được theo
> từng ĐIỂM GÃY không, hay chỉ có điểm trung bình toàn bộ?"* Chỉ có điểm tổng thì lối này chết —
> một con số toàn cục gán cho từng điểm gãy là đúng lỗi hình dạng của node 4, 7, 16.
> **Mặc định đang chạy:** CES **không** có mặt trong công thức. Bảy khoá, không tám.
> **Trigger mở lại:** CX Insight trả lời có.

# Fog
(rỗng)

# Handoffs
- **Toàn bộ bản đồ → dựng thẳng 14/08**, không qua `/flow`. Owner duyệt tổng thể (*"đa số là ok r,
  làm đơn giản thôi, các data nào thực sự cần thì cứ add vào để biết còn đi xin, vừa làm vừa dựng
  ideal data model"*) và chọn dựng trực tiếp thay vì mở pipeline — quy mô thay đổi vừa (26 file sửa + 5 file mới,
  không đụng kiến trúc, không đụng public API).
  - Quyết định: `web/docs/adr-002-diem-uu-tien-thanh-cong-thuc.md` (Status: ĐÃ DỰNG)
  - Dữ liệu còn phải xin: `web/docs/ideal-data-model.md` — bản GỘP, thay ba danh sách rải rác
  - Hàm tính: `web/src/data/priority.ts`
  - Nghiệm thu: 1261/1261 test xanh, 106 file (lượt chạy trước đó 1256/1257, ca đỏ là flake TourOverlay CÓ SẴN TỪ TRƯỚC — đo bằng cách
    stash toàn bộ thay đổi rồi chạy lại full suite, baseline cũng đỏ đúng ca đó)
- **Ba mục dữ liệu (A · B · C) → chuyển ra ngoài repo**, chưa có người nhận. Cho tới khi về, điểm
  ưu tiên đứng ở **tối đa 2/7 khoá** (hai điểm gãy `cust: []` chỉ 1/7) và khối xếp hạng của `#/work` rỗng — trạng thái đúng theo node 14/19.

# Trigger mở lại sau khi dựng
- **Bên data trả lời "lượt bắn thô CÓ mang `customer_id`"** ⇒ `measureAff` (data/priority.ts) là chỗ
  sửa duy nhất; `aff` chuyển từ *chưa tính được* sang đo được mà không đụng consumer nào.
- **`obsTrend` về** ⇒ `measureTr` cùng cách.
- **Bên case trả lời KHÔNG nối được** ⇒ node 7 hẹn sẵn: cân nhắc BỎ `rep` khỏi công thức, lúc đó
  "đủ" thành 6/6 và `#/work` xếp hạng được mà không cần chờ gì thêm.

# Out of scope
- **Lưu vết ai đổi `cfg` lúc nào** (nổi lên từ node 13) — hôm nay `cfg` **không có cơ chế audit nào
  cho bất kỳ nhóm nào trong bảy nhóm**. Nên đây không phải câu hỏi về nhóm 6, nó là câu hỏi về cả
  `cfg`, và bản đồ này không mở ra một cơ chế audit riêng cho một nhóm — làm vậy là để lại một nhóm
  cư xử khác sáu nhóm kia. Chuyển ra ngoài phạm vi; ai làm audit cho `cfg` thì làm cho cả bảy nhóm.
- **Module tuỳ biến `tier`** — owner đã chốt tier có module riêng (`module-e-charter.md:23`), còn
  phải chốt thứ tự ưu tiên rule và ca "khách không khớp rule nào". Bản đồ này chỉ *tiêu thụ* `tier`
  hoặc `nav`, không định nghĩa lại chúng.
- **Dựng màn `#/issue/:id`** (Module B) và **rework Bảng xử lý** (Module H) — cả hai đã đánh dấu
  HOÃN vì đổi hướng 07/08. Bản đồ này không mở lại chúng; nếu một ruling ở đây *đòi* màn đó thì ghi
  thành node phụ thuộc, không tự dựng.
- **Đổi union `IssueSev`** — ba mức đang khớp ba mức của `metricState`; node 4 chỉ hỏi ai sinh ra
  nhãn, không hỏi có mấy nhãn.
- **Sửa cơ chế ngưỡng metric** (`cfg.metric`, `metric-direction.ts`) — đã chạy đúng, bản đồ này chỉ
  đọc nó.
