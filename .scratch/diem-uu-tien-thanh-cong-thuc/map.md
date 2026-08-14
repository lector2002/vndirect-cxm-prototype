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

Số đo hiện trạng: **24 bước** (`seed.ts`), **6 điểm gãy** trong seed, cả 6 đều có `pri`/`imp` gõ
tay. `validate.ts:124-125` cưỡng chế `sev+aff+jc+rep+tr+reg === total`.

# Decisions

## 1. `pri.total` là TRƯỜNG LƯU hay HÀM TÍNH? [type: decide]
blocked by: —
status: open
> Hôm nay `total` nằm trong dữ liệu và `validate.ts:124-125` khẳng định nó bằng tổng sáu thành
> phần. Chính vì lưu mà `#/rules` nhóm 6 buộc phải chỉ đọc (`module-g-rules-charter.md:160-165`:
> *"cho sửa trọng số mà không tính lại `total` sẽ bắn banner đỏ trên mọi màn"*).
> Đây là node gốc: mọi node khác đổi nghĩa tuỳ nó ngả bên nào. Nếu `total` thành hàm thì bất biến
> validate biến mất và nhóm 6 mở được; nếu giữ lưu thì phải trả lời "ai chạy lại và khi nào".

## 2. Tách TRỌNG SỐ khỏi ĐO LƯỜNG, hay giữ điểm tuyệt đối? [type: decide]
blocked by: 1
status: open
> Hôm nay `sev: 30` là đo-lường × trọng-số dính làm một, nên không sửa trọng số mà không đụng dữ
> liệu. Lối tách: `total = Σ w[k] · norm[k](x[k])` — `x` do `data/` tính, `norm` cố định trong code,
> `w` ở `cfg` cho owner sửa. Lối giữ: không có `w`, mỗi khoá tự mang thang riêng như hiện tại.
> Phải cân: tách thì mở được nhóm 6 nhưng thêm một bảng cấu hình nữa owner phải nuôi.

## 3. Mốc neo chuẩn hoá của từng khoá đo được [type: decide]
blocked by: 2
status: open
> **Bẫy phải tránh, ghi trước khi bàn:** đừng chuẩn hoá theo `max` của tập điểm gãy đang có — thêm
> một điểm gãy mới là điểm của mọi điểm gãy cũ đổi, thứ hạng nhảy mà bản thân chúng không đổi gì.
> Tiền lệ đã có trong code: `aff = min(24, round(failed/100))` — neo 100 khách/điểm, trần 24. Câu
> hỏi: giữ neo đó không, và neo của `rep`/`tr` là gì.

## 4. `sev` — suy từ `metricState()` hay giữ nhãn người chấm? [type: decide]
blocked by: —
status: open
> `IssueSev` (`'critical'|'high'|'medium'`) đang gõ tay trên từng điểm gãy, trong khi hệ thống ĐÃ
> biết tự trả lời: `Issue.metric` bắt buộc có, và `domain/state.ts:53-60` cho `crit/watch/ok` từ
> `cfg.metric[id]`. Đây là khoá rẻ nhất để bỏ gõ tay.
> **Ca phải xử:** `metricState` trả `unknown` khi metric tắt (`on:false`) hoặc thiếu entry cfg —
> lúc đó `sev` là gì? Rơi về nhãn người chấm, hay là *chưa tính được* (node 9)?
> Và: ba mức của `metricState` chỉ có ba, khớp đúng ba mức của `IssueSev` — trùng khớp này là tình
> cờ hay là bằng chứng hai thứ vốn là một?

## 5. `jc` (mức quan trọng của bước) khai ở đâu, ai đặt? [type: decide]
blocked by: —
status: open
> `jc` là thuộc tính của **BƯỚC**, không phải của điểm gãy — cùng một bước thì mọi điểm gãy trên đó
> phải có cùng `jc`. Gõ theo từng điểm gãy là mời hai chỗ lệch nhau. `createIssue` đang để hằng số
> `jc = 14` cho mọi bước, tức hôm nay khoá này **không phân biệt được bước nào với bước nào**.
> Lối: `cfg.step.jc[stepId]` — 24 bước, owner khai một lần trên `#/rules`.
> Phải trả lời: thang mấy mức, thiếu entry thì mặc định bao nhiêu (và mặc định có phải một lời
> phán đoán trá hình không).

## 6. `reg` (rủi ro pháp lý / tuân thủ) — ai ký, khai theo gì? [type: decide]
blocked by: —
status: open
> Khoá này **phải mãi là phán đoán** — bên pháp lý chấm, máy không suy được. Nhưng nó vẫn bỏ được
> khỏi "gõ tay mỗi điểm gãy": khai theo bước như `jc`, hoặc là cờ trên điểm gãy có người ký + ngày.
> Cần trả lời: ai là người có quyền đặt, có cần lưu vết đổi không, và một điểm gãy trên bước đã gắn
> cờ pháp lý có tự thừa hưởng không.

## 7. `rep` (liên hệ lặp lại) — nối điểm gãy với hệ thống case bằng khoá nào? [type: research]
blocked by: —
status: open
> `imp.rep` đang là số gõ tay. Metric `m-repeat` có thật (repeat contact 7 ngày, nguồn `src-case`,
> ngưỡng `cfg.data.repeatWarn = 20`) nhưng nó là số **toàn cục**, không phải "repeat của nhóm khách
> gặp ĐIỂM GÃY NÀY". Cần tra bên dữ liệu: case có gắn được với bước/điểm gãy không, gắn bằng gì.
> Không tra được thì `rep` ở lại nhóm chưa-tính-được (node 9), không được để 0.

## 8. `tr` (xu hướng) — hình dạng dữ liệu nào? [type: decide]
blocked by: —
status: open
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
status: open
> `createIssue` hôm nay để `rep`/`tr`/`reg` = **0** kèm comment *"thà để 0 còn hơn đoán"* — thành
> thật về ý định nhưng vẫn là *chưa-biết bị viết thành thiếu*: điểm gãy mới xếp hạng thấp hơn thực
> chất, và không màn nào nói vì sao.
> Phải chốt: `total` thiếu thành phần thì hiện thế nào (điểm kèm dấu "thiếu 2/6"? khoảng thay vì
> một số? không xếp hạng?), và một điểm gãy thiếu thành phần đứng ở đâu so với điểm gãy đủ.

## 10. "Khách giá trị cao" đếm theo `tier` hay theo dải `nav`? [type: decide]
blocked by: —
status: open
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
status: open
> Hôm nay `imp.hv` chỉ nuôi **một bảng Top-10 riêng** (`TopPriorityBlock.tsx:53`), không cộng vào
> `total`. Muốn "vấn đề chạm khách giá trị cao thì được ưu tiên hơn" thì đó là khoá thứ bảy — đo
> được, không cần cơ chế mới, nhưng đổi nghĩa của cả thang điểm và làm mọi điểm cũ không so được
> với điểm mới.

## 12. Nhãn "tác động CES" đọc `imp.csat` — sửa nhãn hay nối thật? [type: decide]
blocked by: —
status: open
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
status: open
> Nhóm 6 hiện chỉ đọc, và charter ghi rõ lý do. Nếu node 1+2 ngả sang "tính", lý do đó biến mất và
> nhóm mở được. Câu còn lại: mở cho ai, có xem trước tác động lên thứ hạng trước khi lưu không
> (tiền lệ `SegmentGroup` đã làm `previewCounts` cho ranh giới dải), có lưu vết đổi không.

## 14. Sáu điểm gãy seed đang gõ tay — chuyển hết sang tính, hay giữ song song? [type: decide]
blocked by: 1, 3, 4
status: open
> `seed.ts:616,625,634,643,652,661` giữ `pri` gõ tay của 6 điểm gãy; nhiều test và oracle trong
> `certification-log.md` neo vào chính các số đó (vd. dòng 452: *"`pri.reg`: CXI-013(20) là ĐỈNH"*).
> Chuyển sang tính là các số đó đổi ⇒ phải sửa cả test. Giữ song song là có hai đường sinh điểm,
> đúng loại lệch mà `metric-direction.ts` đã phải đi dọn một lần.

## 15. Khai `Cfg.pri` (trọng số / neo / `jc` / `reg`) vào lúc nào? [type: decide]
blocked by: 2, 5, 6
status: open
> Luật nhà: **không khai schema trước chỗ tiêu thụ** — tiền lệ `anomalyX` đã bỏ
> (`data/schema/config.ts:15-20`), và ADR-001 §9 vừa dùng đúng luật này để chặn `Metric.formula`.
> Nên `Cfg.pri` chỉ được thêm cùng lúc với hàm tính đọc nó, không thêm trước. Node này giữ chỗ để
> không ai lỡ tay khai sớm.
> Câu phụ: màn `#/issue/:id` — nơi `module-b-issue-charter.md:273` định đặt "breakdown 6 thành
> phần" — **đang HOÃN, route là `Placeholder`**. Chỗ tiêu thụ thật của breakdown chưa tồn tại; điều
> đó có chặn việc này không, hay `#/work` (đang sắp theo `pri.total`) đã đủ là chỗ tiêu thụ?

# Fog
- Ưu tiên nên là **MỘT con số** hay **mấy trục xếp song song**? Hôm nay tồn tại cả hai lối cạnh
  nhau mà không ai chốt: `pri.total` (một số) nuôi `#/work`, còn `@toppri` là **bốn bảng Top-10 độc
  lập không giao nhau**. Gộp về một là mất khả năng nhìn từng trục; giữ cả hai là hai định nghĩa
  "đáng xử lý trước" cùng chạy.
- Điểm tính ra thì **thứ hạng đổi mỗi khi dữ liệu đổi**. Vận hành chịu được thứ hạng nhảy giữa kỳ
  không, hay cần "đóng băng thứ hạng trong kỳ"? Chưa đủ rõ để thành câu hỏi chính xác.
- **CES có chỗ nào trong ưu tiên không?** Hôm nay: không có, kể cả gián tiếp. Chưa rõ đó là thiếu
  sót hay là đúng.
- Điểm gãy **mới phát hiện, chưa có dữ liệu** nên nằm đầu bảng (vì chưa biết, cần nhìn) hay cuối
  bảng (vì chưa có bằng chứng)? Liên quan node 9 nhưng chưa phải cùng một câu.

# Handoffs
- (chưa có)

# Out of scope
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
