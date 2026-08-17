# Destination

Chốt **phạm vi MVP tối giản về quản trị flow data & độ phủ** — owner chốt 07/08: *"ưu tiên làm mvp
đơn giản nhất, trước tiên làm kĩ và tinh phần quản trị các điểm data và ngưỡng trước"*. Cụ thể: định
nghĩa được MVP dừng ở đâu trên năm mâu thuẫn đã đo được, để charter viết SAU khi biết hướng.

Ranh giới: bản đồ này **chốt phạm vi**, không dựng màn. Không viết charter trong lúc chart — phiên
07/08 đã có hai charter phải treo lại vì viết trước khi biết hướng.

# Notes

Nguồn gốc: `web/docs/HANDOFF-MVP-FLOW-COVERAGE.md` §4 (năm câu hỏi) — nhưng **số đo của nó viết
07/08 và đã lệch**. Mọi con số trong bản đồ này đo lại 15/08 bằng oracle độc lập trên `seed` hôm nay:
`.scratch/mvp-quan-tri-flow-data-do-phu/oracle.ts` (chạy `npx tsx ../.scratch/.../oracle.ts` từ
`web/`, hoặc `npx tsx` từ gốc repo — import đã trỏ tương đối).

**Bốn chỗ lệch so với handoff, ghi để không trích lại số cũ:**

1. **Câu 1 của handoff CHẾT vì lý do schema.** Nó hỏi *"cờ `verified: true` nên có bằng chứng gì
   đứng sau"* — nhưng `Flow.verified`/`Flow.observed` **đã bị xoá khỏi schema 07/08**
   (`module-i-signal-registry-charter.md` D2/F8; `domain/state.ts:160-175`), thay bằng hai trục suy
   tại chỗ đọc: `flowHasSourceCitation` (`src !== "—"`) và `flowStepsCopied` (có ≥1 `Step`). Owner
   **bỏ hẳn chữ "đã xác minh"**. Node 1 dưới đây là câu hỏi đó phát biểu lại trên schema đang chạy.
2. **Hai thước không chỉ lệch — chúng NGƯỢC NHAU** (node 2). Handoff mới đo được "7 bước có obs mà
   0 điểm đo".
3. **`m-contract` không có nguồn nào nuôi** (node 3). Handoff chỉ bắt được `src-zalo`.
4. **`instAt = null` 30/30** — chart điểm đo trục thời gian vừa dựng xong (ADR-001) **từ chối vẽ
   trên fixture thật**, chỉ chạy dưới Demo Mode. Đây là trạng thái ĐÃ KHAI, không phải hỏng: Bảng D
   còn treo (`data/schema/journey.ts:88-101`). Nhưng nó thành câu hỏi phạm vi — node 6.

**Ràng buộc trùm, handoff §1:** *"Mọi charter viết trước 07/08 đều dựa trên giả định dựng đủ như
prototype — giả định đó đã đổi, nên charter cũ không tự động còn hiệu lực."* Không ruling nào ở bản
đồ này được biện hộ bằng "charter đã viết là X".

Luật dự án mọi ruling phải sống chung (giữ nguyên từ bản đồ chart):
- **App hiển thị dữ liệu, không luận giải** (luật owner 11/08).
- **Không trộn *chưa-biết* với *thiếu***.
- **Không khai schema trước chỗ tiêu thụ** (vụ `anomalyX`/`repeatMin` bỏ 12/08).
- Demo Mode BẬT = số đủ trình diễn; TẮT = **rỗng trung thực**, không phải 0.
- Tên khối theo cụm danh từ; không câu giải thích dưới title (11/08 + 12/08).

Hai dữ kiện bối cảnh đã tra, không phải giả định:
- **Phase 04 đang KHOÁ** (owner chốt 07/08). `f-deriv-open` có 5 bước + 51 bằng chứng mà **không mở
  được trên UI** ⇒ trong 6 flow có số liệu, chỉ 5 flow thật sự nhìn được. Con số "6 flow đo được"
  ở mọi chỗ đều là 6 trên dữ liệu, 5 trên màn.
- **`cfgIssues.ts` ĐÃ hiểu chiều tốt/xấu** qua `metricDirection(m)` (dòng 29). `m-repeat`
  `watch=15 < crit=20` là **đúng** cho chỉ số càng-thấp-càng-tốt, không phải cấu hình ngược. Không
  có node polarity — đã kiểm và không có lỗ hổng.

# Decisions

## 1. "Có trích dẫn sơ đồ nguồn" phải có bằng chứng gì đứng sau? [type: decide]
blocked by: —
status: open
> **Số đo 15/08:** 32 flow · **25 có trích dẫn** (`src !== "—"`) · **6 đã chép bước** · **19 có
> trích dẫn mà 0 bước** · 7 không có gì.
> Sáu flow có bước: `f-open-2026`(6) · `f-dep-4ch`(4) · `f-dep-trace`(4) · `f-wd`(7) ·
> `f-tr-sub`(4) · `f-deriv-open`(5, phase khoá).
> **Dữ kiện mới, handoff chưa có:** **0 flow đã chép bước mà không trích dẫn**. Tức trong dữ liệu
> hôm nay trục 2 ⟹ trục 1 hoàn toàn — hai trục lồng nhau, không cắt nhau. Điều đó có nghĩa trục 1
> hôm nay **không mang thông tin nào ngoài "đã được ai đó gõ một chuỗi vào ô `src`"**.
> Câu phải chốt: 19 flow kia là *đã khảo sát xong, chưa tới lượt chép bước* hay *chưa ai đụng tới*?
> MVP có buộc trục 1 phải có bằng chứng máy kiểm được không, hay bỏ luôn trục 1 và chỉ đếm bước?

## 2. Hai thước "bước này có đang được đo không" — thước nào gốc, có buộc khớp không? [type: decide]
blocked by: —
status: open
> **PHÁT BIỂU LẠI 17/08 — "hai thước" thực ra là MỘT THƯỚC RƯỠI.** Quét lại thấy `obs.cov` có **0
> chỗ tiêu thụ** trong `domain/`/`features/`/`design-system/` (QĐ 2 ngày 07/08 đã thi hành xong, xem
> node 4). Nên hôm nay chỉ còn **một** thước ở trên màn — bản kiểm kê `signals`; `obs.cov` là một
> trường **còn trong dữ liệu nhưng không ai đọc**. Câu hỏi của node vẫn sống, chỉ đổi hình: không
> phải *"thước nào gốc"* mà là *"trường `obs.cov` còn nằm trong fixture để làm gì, và khi mã lý do
> rớt về thì nó bị thay hay được nối"*. Số đo dưới đây vẫn đúng và vẫn là dữ kiện sắc nhất — nó cho
> thấy hai thước ĐÃ từng nói ngược nhau, tức nối bừa hai bên là mua một mâu thuẫn.
>
> **Số đo 15/08:** hai thước không lệch ngẫu nhiên, chúng **ngược nhau**.
> - 7/30 bước **không có điểm đo nào** — `s-dvo-2`(cov 91) · `s-dvo-5`(96) · `s-nap-4`(98) ·
>   `s-tra-2`(79) · `s-rut-5`(84) · `s-rut-6`(90) · `s-ctn-3`(85). **Cả bảy đều trên ngưỡng
>   `covMin=70`**, bốn cái ≥ 90.
> - 6/30 bước **dưới ngưỡng** — `s3`(64) · `s5`(58) · `s-tra-1`(63) · `s-tra-3`(59) · `s-rut-3`(61)
>   · `s-rut-4`(57). **Cả sáu đều CÓ điểm đo.**
> Tức bước nào `obs.cov` khen là đo tốt thì bản kiểm kê nói không có thiết bị đo nào, và ngược lại.
> Không giao nhau một ca nào.
> **Không phải lỗi dữ liệu — đã kiểm:** `obs.cov` khai thẳng từng dòng ở `seed.ts`; `Signal` gắn vào
> **touchpoint** (`sg.tpId`), không gắn vào bước; không đoạn code nào suy cái này ra cái kia.
> `AtlasCoverageTab.tsx:26` khai ca "bước chưa có điểm đo" là **có thật trong pilot**, và tab đó
> nhận `obs` với `signals` làm **hai prop rời** — tức màn hiện có đã chọn "hiện cạnh nhau" mà chưa
> ai gọi đó là một ruling.
> Kèm: 7/30 touchpoint không có signal nào; 0 signal trỏ vào touchpoint không tồn tại.
> Câu phải chốt: MVP buộc hai thước khớp (và ai là gốc), hay hiện cả hai cạnh nhau và **nói rõ đây
> là hai câu hỏi khác nhau**?

## 3. Liên kết nguồn ↔ chỉ số được canh thế nào? [type: decide]
blocked by: —
status: open
> (mở rộng câu 3 của handoff: nó chỉ hỏi *nguồn đứt có được nuôi chỉ số không*; đo lại thấy lỗ hổng
> có **hai chiều**, nên node phải phủ cả hai.)
> **Số đo 15/08 — 7 nguồn:**
> | nguồn | loại | vol | trễ | nuôi |
> |---|---|---|---|---|
> | `src-ga` | event | 41.200 | 4h | `m-completion` |
> | `src-ekyc` | event | 12.800 | 6h | `m-liveness`, `m-ocr` |
> | `src-case` | case | 1.840 | 2h | `m-repeat` |
> | `src-survey` | survey | 612 | 12h | `m-ces` |
> | `src-store` | store-review | 186 | 24h | **—** |
> | `src-broker` | broker-note | 94 | 24h | **—** |
> | `src-zalo` | chat | **0** | **192h** | `m-repeat` |
> - **Chiều đứt-vẫn-nuôi:** `src-zalo` vol=0, trễ 8 ngày, vẫn khai nuôi `m-repeat` — mà `m-repeat`
>   neo `CXI-028` (đã kiểm lại trên seed hôm nay: `seed.ts:655` `metric:'m-repeat'`; chính điểm gãy
>   đó tên *"Zalo OA ngừng gửi dữ liệu từ 19/07"*). Chuỗi *nguồn đứt → chỉ số vẫn hiện số → điểm gãy
>   vẫn kết luận* không ai chặn.
>   Nhẹ hơn handoff một bậc: `m-repeat` còn `src-case` (1.840, trễ 2h) nuôi song song, nên nó
>   **không** phải chỉ số chỉ sống bằng nguồn chết. Không chỉ số nào rơi vào ca đó.
> - **Chiều không-ai-nuôi (handoff chưa bắt):** **`m-contract` không có nguồn nào** khai nuôi nó,
>   mà `on=true`, `value="94,0%"`, `watch=97`, `crit=92` — một chỉ số đang chạy ngưỡng trên một con
>   số không có đường dẫn nguồn.
> - Hai nguồn `src-store`/`src-broker` không nuôi chỉ số nào (có thể đúng chủ ý: voice-only).
> Câu phải chốt: MVP có canh liên kết này không, canh ở đâu (validate cứng / cảnh báo trên màn / chỉ
> hiện ra), và **nguồn đứt thì chỉ số phải nói gì** — vẫn hiện số, hay hiện "chưa biết"?

## 4. Coverage là thuộc tính của bước, của flow, hay của phase? [type: decide]
blocked by: 2
status: no-build
> **NO-BUILD 17/08 — tiền đề của node này đã sập, và sập từ 07/08 chứ không phải hôm nay.** Node đo
> chuyện cộng `obs.cov` lên mức flow, nhưng **QĐ 2 đã cấm hiện chính con số đó** (*"Bỏ tỉ lệ tự khai
> `obs.cov` khỏi mọi chỗ tiêu thụ; chỉ hiện thứ đếm được"*) — và **đã thi hành xong**: quét 17/08 cho
> **0 người đọc** `obs.cov` trong `domain/`, `features/`, `design-system/` (chỉ còn một câu comment ở
> `Bars.tsx:25`). Cộng lên mức flow một con số đã bị gỡ khỏi màn là dựng lại đúng thứ vừa bỏ.
> Bảng ba-cách-cộng đo được vẫn giữ dưới đây làm bằng chứng cho ngày node này mở lại — nó chứng minh
> phép cộng KHÔNG trung tính, nên lúc có số đếm được thì vẫn phải chốt phép cộng, không được mặc định
> lấy trung bình.
> **Trigger mở lại:** **mã lý do rớt mỗi ca thất bại** về (`ideal-data-model.md` §3 · module-i §10
> QĐ 2) — đó đúng là con số ĐẾM ĐƯỢC mà QĐ 2 đòi để thay `obs.cov`. Khi đó câu hỏi trở lại nguyên
> hình, chỉ khác là trên một tử số có thật.
>
> ~~status: open~~ — bối cảnh gốc và số đo giữ nguyên bên dưới:
> **Số đo 15/08:** `covMin=70` · `obs.cov` n=30 · min=57 · max=99 · median=88 · **6/30 dưới ngưỡng**
> · 0 obs mồ côi · 0 bước thiếu obs (một-đối-một hoàn hảo ở mức bước).
> **Dữ kiện mới, handoff chưa có — ba cách cộng lên mức flow cho ra ba KẾT LUẬN khác nhau:**
> | flow | n | trung bình | thấp nhất | % bước đạt |
> |---|---|---|---|---|
> | `f-open-2026` | 6 | 78,3 ✓ | 58 ✗ | 67% |
> | `f-deriv-open` | 5 | 89,0 ✓ | 76 ✓ | 100% |
> | `f-dep-4ch` | 4 | 94,0 ✓ | 82 ✓ | 100% |
> | `f-dep-trace` | 4 | **71,8 ✓** | **59 ✗** | **50%** |
> | `f-wd` | 7 | 81,6 ✓ | 57 ✗ | 71% |
> | `f-tr-sub` | 4 | 90,3 ✓ | 85 ✓ | 100% |
> `f-dep-trace` là ca phân định gắt nhất: trung bình **đạt** ngưỡng, thấp nhất **trượt**, và một
> nửa số bước trượt. `f-open-2026` cùng khuôn. Tức 2/6 flow đổi kết luận theo cách cộng — chọn phép
> cộng ở đây **không phải chi tiết kỹ thuật**, nó là chọn câu trả lời.
> Hôm nay `AtlasCoverageTab.tsx` chỉ nói cho **một bước đang xem**; không màn nào tổng hợp lên flow
> hay phase, tức phép cộng này **chưa tồn tại** — chốt xong là dựng mới, không phải sửa.
> Chặn bởi node 2 vì nếu thước gốc không phải `obs.cov` thì cộng cái gì lên cũng đổi theo.

## 5. "Quản trị" ở đây là XEM hay là SỬA? [type: decide]
blocked by: —
status: resolved
> **resolution (owner chốt 17/08) — XEM, không CRUD. QĐ 1 của phiên 07/08 giữ nguyên hiệu lực.**
> Ngưỡng vẫn sửa được (`#/rules`, Module G) — "không cuốn ngược", đúng chú thích của chính QĐ 1.
> Bản khai (flow · bước · obs · touchpoint · điểm đo · nguồn · định nghĩa `Metric`) **chỉ đọc**.
> Lý do cứng hơn hồi 07/08, ghi để không tái tranh luận: pipeline T-1 khiến **đội dữ liệu là chủ bản
> khai**, nên một ô sửa trên màn là nguồn sự thật thứ hai bị lượt feed sau ghi đè. Đường khai đã có
> sẵn và **không phải một màn**: `web/docs/ideal-data-model.md`.
> Node này KHÔNG cần grill tiếp: câu hỏi của nó đã được owner phán ngày 07/08 trong chính phiên đặt
> hướng MVP (`module-i-signal-registry-charter.md` §1 QĐ 1, lặp ở §11). Vòng grill 17/08 chỉ xác nhận
> lại và **thêm một ranh giới mới** (dưới đây), chứ không lật gì.
>
> **RANH GIỚI MÀN — owner chốt 17/08, phần này là mới:** MVP nhỏ gồm **ĐÚNG BA MÀN** —
> `signals` (đích QĐ 9) · `rules` (ngưỡng + 66 ô ở dưới) · `settings` (công tắc Demo Mode, hạ tầng).
> Mười màn còn lại **làm mờ trong sidebar, không bấm được**. Owner chốt cơ chế nguyên văn: *"tắt ở
> đây là làm mờ trong sidebar và user ko bấm vào được thôi"* — nên **KHÔNG chặn route**, gõ thẳng
> hash vẫn mở được.
> Bác hai lối rộng hơn đã trình: giữ sáng thêm `work` (chỗ duy nhất 66 ô trả ra kết quả) và thêm cả
> `atlas`. Owner chọn hẹp nhất. **Giá đã trả, nói thẳng:** khai xong 66 ô thì không màn nào trong MVP
> hiển thị hệ quả — điểm ưu tiên bảy khoá và khối *"Chưa đủ dữ liệu để xếp"* đều ở `#/work`, đang mờ.
> Đã dựng: `nav.tsx` khai `MVP_ROUTES` + `HOME_ROUTE='signals'` + `TOUR_ENABLED=false` (route mặc
> định cũ trỏ `cxm` — một màn mờ; nút *Chạy bản giới thiệu* tắt theo vì `seedTour` dẫn qua 7 chặng
> nằm trên các màn mờ). Bật lại một màn = thêm tên vào `MVP_ROUTES`, không sửa chỗ khác.
>
> **VIỆC CÒN LẠI CỦA MVP, đo được, không cần code** — ba ô khai của chính owner, nằm trong `cfg`, mặt
> sửa đã dựng sẵn, công thức đã tiêu thụ:
> | Việc | Chỗ khai | Đang có | Nuôi cái gì |
> |---|---|---|---|
> | Mức quan trọng từng bước | `cfg.step.jc[stepId]` | **0/30** | `data/priority.ts:181` |
> | Rủi ro pháp lý từng bước | `cfg.step.reg[stepId]` | **0/30** | `data/priority.ts:184` |
> | Điểm gãy ↔ giá trị điểm đo | `issue.sigMap` | **0/6** (cả 6 `null`) | — |
> `StepPriGroup.tsx:63` đã in "Đã điền X/30", `RulesPage.tsx:143` đã đếm chỗ thiếu. Nguồn:
> `ideal-data-model.md` §4 — *"không ai giao được, chúng là phán đoán, không phải số đo"*.
> **Kiểm kê 15/08 — mọi thứ SỬA ĐƯỢC trong app hôm nay.** Quét mutator của `store/store.ts`, caller
> của `setCfg`, **và caller của hai lớp bọc `useCfgWrite`/`NumField`** — lớp bọc phải quét riêng vì
> một màn ghi cfg qua chúng sẽ không chứa chuỗi `setCfg` nào. Kết quả: **0 importer ngoài
> `features/rules/`**. `SourcesPage.tsx` chỉ ĐỌC (`cfg.source[s.id]`, `cfg.data.cooldown`), không
> ghi — nên chữ "duy nhất" dưới đây là đã kiểm, không phải suy từ một lần grep.
> | Đối tượng | Sửa được? | Ở đâu |
> |---|---|---|
> | `cfg` — ngưỡng, trọng số, nhịp nguồn, dải khách | **SỬA** | `#/rules`, **chỗ DUY NHẤT ghi cfg** |
> | Quantify item | **SỬA** (tạo/lưu/nhân bản/xoá) | `#/quantify` |
> | DashSet / board | **SỬA** (tạo/nhân bản/xoá/đổi tên/xếp khối) | `#/dash` |
> | Điểm gãy + hành động | **TẠO + xác nhận + đẩy chặng** | `createIssue`/`confirmIssue`/`advanceAction` |
> | Demo Mode · timeframe | bật/tắt · chọn | App Shell |
> | **flow · group · phase · step · obs · touchpoint · signal · source · Metric (định nghĩa)** | **CHỈ ĐỌC — 0 mutator** | chỉ sửa được bằng cách sửa fixture |
> **Phát biểu sắc hơn handoff:** toàn bộ đồ thị đối tượng mà *"quản trị flow data & coverage"* nói
> tới **không có một mutator nào**. Cái sửa được hôm nay là **ngưỡng** (cfg), **cách bày** (quantify/
> dash) và **quy trình xử lý** (issue/action) — không có cái nào là **bản khai**. Kể cả màn *Chỉ số
> & ngưỡng*: nó sửa `cfg.metric[id]`, còn `Metric` (name/value/formula/grain/source) vẫn chỉ đọc.
> Tức hôm nay *"quản trị"* = **sửa ngưỡng, không sửa bản khai**.
> Câu phải chốt: MVP dừng ở đó (XEM bản khai + SỬA ngưỡng), hay mở đường khai/sửa cho một phần đồ
> thị — và nếu mở thì **phần nào trước**?
> **Node này là node gốc của phạm vi:** node 6 và node 7 đều treo vào nó.

## 6. Bản khai còn trống nhiều — MVP có dựng đường khai cho chúng không? [type: decide]
blocked by: 5
status: resolved
> **resolution 17/08 — KHÔNG. Đây là HỆ QUẢ của ruling node 5, không phải phán quyết mới của owner.**
> Node 5 chốt *chỉ XEM, không CRUD* ⇒ không dựng ô khai trên màn cho `instAt` · `srcId` ·
> `Signal.metrics`. Đường duy nhất để lấp là **đơn hàng dữ liệu** (`web/docs/ideal-data-model.md` §3,
> Bảng D đang treo ở đó) — không phải một màn.
> **Cái phải nói ra và app đã nói:** chart trục thời gian (ADR-001, dựng 14/08) **chỉ chạy dưới Demo
> Mode**; trên fixture thật `instAt` null 30/30 nên nó TỪ CHỐI vẽ kèm lý do. Đó là hành vi đúng theo
> ADR-001 §6, không phải lỗi cần lấp bằng cách cho gõ tay một mốc.
> **Trigger mở lại:** Bảng D về (⇒ hết câu hỏi, chỉ còn nạp dữ liệu), HOẶC owner lật node 5 sang có
> CRUD.
> **Số đo 15/08 trên 30 điểm đo:**
> | Trường | Trống | Nghĩa |
> |---|---|---|
> | `instAt` | **30/30** | chưa ai khai mốc cắm đo ⇒ **chart trục thời gian từ chối vẽ trên fixture thật** |
> | `srcId` | **22/30** | chưa nối nguồn ⇒ `signalFeedLast()` trả `null`, độ tươi về "chưa biết" |
> | `metrics` rỗng | **20/30** | điểm đo không nuôi chỉ số nào |
> | `values` rỗng · `vol=0` · `seen=null` | 5/30 mỗi loại | trùng nhóm `st:'gap'`/chưa implement |
> Trạng thái điểm đo: live=21 · validating=4 · designed=3 · gap=2.
> **Đây KHÔNG phải hỏng — là trạng thái đã khai và đã ghi lý do:** `instAt` thuộc **Bảng D** của bản
> yêu cầu dữ liệu, còn treo (`data/schema/journey.ts:88-101` nói thẳng "fixture thật khai `null` cho
> cả 30"). `srcId=null` cũng đã có luật đọc riêng (phải trả "chưa biết", cấm rơi về "đang ổn").
> **Nhưng nó là câu hỏi phạm vi thật:** tính năng vừa dựng xong tuần này (ADR-001, chart trục thời
> gian) **chỉ chạy dưới Demo Mode**. MVP có coi việc lấp Bảng D — bằng đường khai trên màn, hay bằng
> đơn hàng gửi đội dữ liệu — là trong phạm vi không?
> Chặn bởi node 5: nếu MVP chốt "chỉ XEM" thì đường khai trên màn tự loại, chỉ còn đường đơn hàng.

## 7. Chỉ số & ngưỡng có về màn hành trình không? [type: decide]
blocked by: 5
status: deferred
> **DEFERRED 17/08 — hệ quả của ruling node 5, không phải phán quyết mới.** Node 5 chốt MVP gồm đúng
> ba màn và **`atlas` (màn hành trình) nằm trong nhóm làm mờ**. Chuyển `#/rules` — một trong ba màn
> MVP — vào một màn đang tắt là đẩy mặt sửa duy nhất của MVP ra ngoài phạm vi MVP. Câu hỏi mất nền
> chứ không mất giá trị: 3/8 nhóm chuyển được vẫn đúng như đã đo.
> **Trigger mở lại:** `atlas` được bật lại vào `MVP_ROUTES`. Chưa bật thì đây là việc không có chỗ
> đứng.
> (Track đã đo từ trước và **owner cố ý để lại sau chart trục thời gian**; đưa lên bản đồ để nó tìm
> lại được, KHÔNG phải để khởi động.)
> **Số đo đã có:** 3/8 nhóm `#/rules` chuyển được về màn hành trình, **4 nhóm buộc ở lại** (chúng là
> cấu hình toàn cục, không thuộc một hành trình nào).
> Chặn bởi node 5 vì lý do cứng: nếu node 5 chốt *"quản trị = chỉ XEM"* thì `#/rules` là màn SỬA duy
> nhất còn lại và câu hỏi chuyển nó đi đâu đổi hẳn hình — có khi không còn màn để chuyển. Dựng track
> này trước node 5 là dựng trên một giả định chưa chốt.

# Fog

- ~~**Màn Agent & cảnh báo · Trợ lý có trong MVP không**~~ — **GRADUATE + đóng 17/08 bởi node 5**:
  cả hai nằm ngoài `MVP_ROUTES`, đang làm mờ. Không thành node riêng vì ruling của node 5 đã phủ.
- **`cfg.step.covMin` là Ô CẤU HÌNH MỒ CÔI đang mở cho sửa** — phát hiện 17/08, chưa phát biểu được
  thành câu quyết định. `validate.ts:840` ghi thẳng *"`covMin` KHÔNG còn ai đọc từ 07/08"*, mà
  `StepPriGroup`/`StepGroup.tsx:101-102` vẫn bày ô nhập nó ở `#/rules` — sửa xong không đổi gì trên
  màn. Đây đúng khuôn bẫy dự án đã dọn ba lần (`anomalyX`, `repeatMin` bỏ 12/08). Chỗ khó: charter
  §11 nói **"Không bỏ `cfg.step.covMin` khỏi Module G"**, tức nó được giữ CÓ CHỦ Ý — nên câu hỏi thật
  là *"giữ một ô không chạy thì màn phải nói gì"*, và câu đó chưa chín. **Đáng chú ý vì `#/rules` là
  một trong ba màn MVP**: ô chết duy nhất còn lại của app đang nằm trong phạm vi hẹp nhất.
- **`m-ocr` `watch=90` `crit=60` — khoảng 30 điểm, rộng bất thường** (các chỉ số khác 4–5 điểm,
  `m-ces` 0,7 trên thang 5). `cfgIssues` KHÔNG kêu vì chiều vẫn đúng. Chưa rõ chủ ý hay sót — mà
  cũng chưa rõ nó có phải câu hỏi của MVP hay chỉ là một giá trị fixture cần sửa.

# Handoffs

— (chưa có; bản đồ này chốt phạm vi trước, giao việc sau)

# Out of scope

- **Module B (`#/issue/:id`) và Module H (rework Bảng xử lý)** — owner đánh dấu HOÃN 07/08, handoff
  §8 ghi *"đừng tự khởi động lại"*. Ba đường dẫn vào màn điểm gãy ra trang trắng là **trạng thái
  được chấp nhận**. Charter cả hai đã viết nhưng theo ràng buộc trùm ở Notes, chúng **không còn tự
  động có hiệu lực**.
- **Formula engine cho `Metric`** — ADR-001 §9 đã chốt: dừng, mở đường, ghi lại. Trigger mở lại là
  có consumer thật cho chuỗi chỉ số.
- **Chart VoC / theme** — có đường riêng (`pts`), không gộp.
- **Chart điểm đo trục thời gian** — vừa xong 14/08, bản đồ
  `.scratch/chart-diem-do-truc-thoi-gian/map.md` đã đóng. Chỉ còn dội lại vào đây qua node 6
  (`instAt` trống).
- **Dựng lại màn `#/sources`** — owner chốt 06/08 danh sách 7 nguồn là giả định prototype, màn là
  bản tạm sẽ dựng lại. Phần số học `domain/sources.ts` + test **dùng lại được nguyên**. Node 3 chỉ
  chốt LUẬT canh liên kết, không dựng màn.
