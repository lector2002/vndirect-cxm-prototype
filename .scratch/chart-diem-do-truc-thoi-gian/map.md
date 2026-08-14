# Destination

Chart điểm đo (`#/signals` mặt 4 + `AtlasSignalPanel`) trả lời được câu hỏi **xu hướng theo thời
gian**, chứ không chỉ câu **phân bố hiện tại**. Cụ thể: điểm đo một giá trị (`tapped`, `submitted`,
`activated`…) thôi vẽ một cột chết, và điểm đo nhiều giá trị có lối xem lịch sử mà không đánh mất
lối cắt theo nhóm khách đang có.

Ranh giới: chỉ là chart **điểm đo**. Không dựng tầng công thức cho `Metric` trong nhánh này (node 9
chỉ quyết định có nối hay không), không đụng chart VoC/theme (chúng đã có `pts` riêng).

# Notes

ADR đã ra từ bản đồ này: `web/docs/adr-001-chart-diem-do-truc-thoi-gian.md` (node 1, 2, 3, 4, 5, 5b).

Thiết kế gốc, đọc trước khi ra ruling — **đừng trích lẫn hai bản**:
- `output/thiet-ke-chart-signal.html` — §2 (lỗ hổng A: giá trị do đội dữ liệu KHAI, không quét
  ngược) · §3 (ba ràng buộc trung thực) · §4 (năm chiều) · §7 (giá trị chưa khai phải hiện ra) ·
  §9 (11 tiêu chí nghiệm thu) · **§11 (bản yêu cầu dữ liệu Bảng A/B/C + ba yêu cầu về cách lấy)**
- `output/thiet-ke-chart-signal-bo-sung-dot-2.html` — Đ1 (một signal = một nhóm, cấm gộp cột cùng
  tên giữa các signal) · Đ2 (chân đế riêng từng nhóm) · **Đ3 (điểm đo một giá trị vẽ một cột)**
- `web/docs/module-i-signal-registry-charter.md` §10 — bản yêu cầu dữ liệu, mục "Dòng event thô"

Code chạm tới: `data/projectSignalCounts.ts` (`SigCount`, phép cộng) · `domain/signalChart.ts`
(phép chiếu) · `design-system/SignalColumns.tsx` (tầng vẽ) · `data/fixtures/demo.ts` (`Fire`,
`genFiresForSignal`) · `design-system/LineChart.tsx` + `TopicLineChart.tsx` + `Sparkline.tsx`
(đường đã có sẵn, dùng lại chứ không dựng cái thứ tư).

Luật của dự án mà mọi ruling phải sống chung:
- **Cấm bịa kỳ.** Dự án đã từ chối `monthly()` của prototype vì nó ngoại suy ngược 6 điểm rồi dán
  nhãn tháng thật (`docs/DB-FIRST-HANDOFF.md` §"KHÔNG port monthly()"). Chuỗi ngắn thì vẽ ngắn.
- **Demo Mode BẬT = số demo đủ để trình diễn; TẮT = rỗng trung thực**, không phải 0.
- **Không khai schema trước chỗ tiêu thụ** (`data/schema/config.ts:15-20`, vụ bỏ `anomalyX`).
- Tên khối theo **cụm danh từ**, không dạng câu hỏi; không có câu giải thích dưới title (luật
  11/08 + 12/08).

Ba dữ kiện đã tra, không phải giả định:
1. `SigCount = { sig, dim, val, band, n }` — **không có khoá kỳ**. Trục thời gian là trường mới.
2. Mốc thời gian của từng lần bắn **đã nằm trong bản yêu cầu dữ liệu, xin hai lần** (thiết kế §11
   Bảng A "thời điểm bắn — xin thời điểm thô, không xin sẵn theo kỳ"; charter §10 "dòng event thô
   … mốc phát sinh"). Mode lịch sử **không phát sinh yêu cầu dữ liệu mới**.
3. `Fire = { sigId, val, custKey, pf }` (`demo.ts:658`) — bộ sinh demo đã có từng lần bắn, thêm mốc
   vào đó là dựng được mode lịch sử thật dưới Demo Mode mà không chờ pipeline.

# Decisions

## 1. Điểm đo một giá trị: lật Đ3, hay giữ Đ3 và thêm mode? [type: decide]
blocked by: —
status: resolved
> resolution: **Lật Đ3** — owner chốt 13/08 ("ko cần quan tâm đến Đ3 nữa"). Sáu điểm đo một giá trị
> (`sg1 tapped` · `sg10 activated` · `sg-tra-1 created` · `sg-rut-1 submitted` · `sg-ctn-1
> submitted` · `sg-ctn-3 posted`) thôi vẽ một cột; trục thời gian thành nội dung chính của chúng.
> Đ3 vẫn còn đúng một phần được giữ: **không vẽ chart rỗng giả vờ là 0** cho điểm đo `vol === 0` —
> phần đó thuộc rule 2 của `signalChart.ts`, không bị ruling này chạm.
> ADR: `web/docs/adr-001-chart-diem-do-truc-thoi-gian.md` §1 — nó đè lên Đ3, quyết định đã chốt ở đợt 2.

## 2. Hai mode trên một chart, hay hai chart rời? Mode nào mặc định cho signal nhiều giá trị? [type: mockup]
blocked by: 1
status: resolved
> resolution: **Hướng B — hai tầng nối nhau** (owner chốt 13/08 sau khi xem demo). Đường lịch sử ở
> tầng trên, lát cắt ở tầng dưới, bấm một điểm trên đường thì lát cắt nhảy về đúng kỳ đó.
> **Bỏ hẳn ý "hai mode"** — hướng A (công tắc) bị loại vì bấm sang lát cắt là mất trục thời gian
> khỏi màn, nên không trả lời được "kỳ đang vọt lên đó là nhóm khách nào".
> Hướng C (lưới đường nhỏ) **không bị loại** — nó là lối thoát khi điểm đo đông giá trị, xem
> ngưỡng ở phần learned. Ngưỡng chuyển do MÁY chọn theo số giá trị, không cho người dùng bấm.
> Kèm theo (owner chốt cùng lúc, luật 11/08 + 12/08 áp lên mô phỏng UI): **bỏ dòng
> "N giá trị · cửa sổ N tháng · N kỳ (hạt X)"** — tả hành vi của màn chứ không tả dữ liệu; và **bỏ
> câu dạy thao tác** "bấm một điểm bất kỳ trên đường…". Khối `note` gợi ý dưới chart cũng bỏ luôn:
> trạng thái "kỳ chưa đủ" đã nói bằng dải nền + điểm rỗng + nhãn ở thanh trên, nói lần thứ tư là thừa.
> ADR: `web/docs/adr-001-chart-diem-do-truc-thoi-gian.md` §2 — đã viết 13/08, cùng file với node
> 1, 3, 4, 5, 5b. Chỗ đặt đã chốt luôn quy ước ADR đầu tiên của dự án: file phẳng trong `web/docs/`,
> `adr-NNN-<slug>.md`, có `Status:` / `Date:` / `## Quyết định`.
> Đổi type `decide` → `mockup` 13/08: owner yêu cầu nhìn demo trước khi phán
> ("show demo xem hướng nào hợp lý hơn"). Artifact: `output/demo-chart-diem-do-truc-thoi-gian.html`
> — ba hướng A/B/C dựng trên cùng một bộ số, cùng bộ điều khiển, để so thẳng.
> learned: **Số giá trị của điểm đo mới là thứ quyết định hình, không phải sở thích.** Dựng xong
> rồi mới thấy: A (công tắc) và B (hai tầng) dùng CHUNG một chart đường ở trên, nên chúng gãy CÙNG
> CHỖ khi điểm đo đông giá trị — không phải hai hướng đối lập mà là một hướng, B chỉ hơn A ở chỗ
> nối xuống lát cắt. Đối thủ thật của cả hai là C (lưới đường nhỏ).
> Ràng buộc CỨNG tìm ra: bảng màu phân loại của dự án **chỉ có 5 màu** (`--cat-1..5`, `index.css`).
> `sg-rut-2` có **7 giá trị** ⇒ ở A và B, giá trị thứ 6–7 phải mượn `--cat-other` hoặc gộp
> "Khác (+N)" — tức là **xoá đúng cái danh sách lý do** mà chart này sinh ra để hiện. C không cần
> màu (mỗi giá trị một khung riêng) nên thoát ràng buộc này hoàn toàn. Đây là lý do kỹ thuật, không
> phải thẩm mỹ, nên ngưỡng chuyển hướng phải là **số giá trị ≥ 5**, máy tự chọn, không cho người
> dùng bấm.
> Ba ca đã dựng và chạy: `sg1` 1 giá trị · `sg5` 2 · `sg4` 4 · `sg-rut-2` 7. Đã tự kiểm 672 tổ hợp
> (4 điểm đo × 4 cửa sổ × đơn vị × mode × 4 chiều) không lỗi runtime, không rò `undefined`/`NaN`.
> **Chưa nhìn bằng mắt trên browser** — extension Chrome không kết nối được phiên này.
> Đề xuất của owner: mode **Lịch sử** (mỗi giá trị = một đường qua các kỳ) và mode **Lát cắt** (như
> hôm nay: cột theo giá trị, chia màu theo nhóm khách). Hai mode trả lời hai câu khác nhau — *"đang
> tăng hay giảm"* vs *"ai đang bị"* — nên đều có lý do tồn tại. Câu cần chốt là hình thức: một chart
> có công tắc, hay hai khối xếp dọc cùng hiện. Ràng buộc kế thừa: Đ1 cấm gộp cột cùng tên giữa các
> signal, và màn cho **chọn nhiều signal** cùng lúc — mode lịch sử với 3 signal × 5 giá trị là 15
> đường, phải nói rõ xử lý thế nào.

## 3. Trong mode Lịch sử, chiều khách đóng vai gì — bộ lọc hay chia đường? [type: decide]
blocked by: 2
status: resolved
> resolution: **Chiều khách sống ở TẦNG DƯỚI, không chạm tầng đường** (owner chốt 13/08). Tầng
> trên chỉ chia đường theo GIÁ TRỊ của điểm đo; chiều khách là cách chia của lát cắt bên dưới, và
> lát cắt đó bám theo kỳ đang chỉ trên đường.
> Loại bỏ: chia đường theo chiều khách (5 giá trị × 5 nhóm = 25 đường, không đọc được) và vai
> "bộ lọc" ở tầng trên (một picker mang hai vai ở hai chỗ là nguồn nhầm lẫn, và lọc đi thì mất mẫu
> số của chính đường đang vẽ).
> **Hệ quả cho node 6, đây là phần đắt nhất của ruling:** bảng đếm theo kỳ **không cần chiều khách**
> ⇒ không phải nhân `sigCounts` lên theo kỳ (sig × val × dim × band × kỳ). Bảng thứ hai gọn
> `{ sig, val, period, n }` là đủ. Ít dữ liệu phải đi xin hơn hẳn.
> **"Chưa định danh" không còn là câu hỏi ở tầng trên** (không lọc thì không giấu được gì) — nó vẫn
> là một dải của lát cắt dưới như hiện tại, giữ nguyên `--unk-nocust`.

## 4. Đường vẽ là SỐ ĐẾM hay TỈ LỆ — và tỉ lệ thì mẫu số là gì? [type: decide]
blocked by: 2
status: resolved
> **resolution (owner chốt 13/08): KHÔNG thêm công tắc. Cơ chế (ii) — đường TỈ LỆ + dải khối lượng
> dưới đường, dùng chung trục ngang.** Câu hỏi thật không phải "đếm hay tỉ lệ" mà là *mẫu số có
> nằm trên màn không*; thêm nút chỉ nhân đôi số trạng thái mà không trả lời được câu đó.
> Cơ sở: đây là **Đ2 dịch sang trục thời gian** — Đ2 đã chốt lát cắt phải có "chân đế riêng từng
> nhóm", mỗi nhóm nhìn thấy mẫu số của chính nó. Không phải luật mới, là luật cũ mở rộng.
> **Giá đã trả, ghi để không tái tranh luận:** mất xu hướng ĐẾM của riêng một giá trị dưới dạng
> đường; tra được bằng cách bấm vào kỳ rồi đọc ở lát cắt dưới. Owner nhìn cả hai biến thể dựng
> thật rồi mới chọn — nếu về sau câu "giá trị X tăng hay giảm theo ngày" thành câu hay hỏi thì đó
> là **trigger mở lại node này**, không phải lỗi của ruling.
>
> **Mẫu số — chốt cùng lúc, độc lập với cơ chế:** tỉ lệ **chỉ mở** ở điểm đo có các giá trị **loại
> trừ nhau**; mẫu số luôn là **lượt bắn của chính điểm đo trong kỳ** và phải viết đủ vào nhãn trục;
> **cấm tỉ lệ liên-điểm-đo** ở vòng này (`sg4 ÷ sg3` là tầng công thức chỉ số — node 9, không phải
> chart điểm đo). Điểm đo một giá trị không có tỉ lệ: 6/30 điểm đo của seed rơi vào ca này.
> Kỳ có tổng = 0 ⇒ 0/0 **không tính được** ⇒ đường **đứt**, không tụt về 0 (cùng luật rule 2 của
> `signalChart.ts`: nhóm rỗng không được đọc thành đã-đo-ra-0).
>
> **Bác (i) — công tắc đếm/tỉ lệ.** Đúng câu owner hỏi, và cái nó giữ được là xu hướng ĐẾM của
> riêng một giá trị thành đường. Bị loại vì: mẫu số không có trên màn; nút chết ở 6/30 điểm đo (một
> giá trị ⇒ tỉ lệ luôn 100%); thêm một trạng thái nhân với cửa sổ và chiều khách; và ở `sg4` · mốc
> **4W** (tên cũ "cửa sổ 1 tháng" — xem reroute node 5) (n≈13/ngày cho 4 giá trị) tỉ lệ nhảy hàng chục % giữa hai ngày liền nhau mà **trên màn
> không còn dấu vết mẫu số để nghi**.
>
> **Vì sao node này khó (bối cảnh, giữ lại để không đào lại):** số đếm lên xuống theo lưu lượng nên
> không đọc được xu hướng chất lượng; tỉ lệ đọc được nhưng đòi một mẫu số **khai ra được cho từng
> signal**, và đây đúng là chỗ dự án hay vấp (vụ `VOC_SCOPE`). Ba dạng signal, ba mẫu số khác nhau:
> `sg5 success/fail` — các giá trị loại trừ nhau trong một lần bắn, mẫu số = `vol` của chính nó;
> `sg4 fail_reason` (410) — là **tập con** của `sg3` (920), mẫu số đúng nằm ở signal KHÁC;
> `sg2 step_viewed` — bắn lặp nhiều lần trên một khách, `vol` không phải số người. Chốt sai chỗ này
> là in một con số dưới cái nhãn nó không thuộc về.
>
> **Ca phân định đã dựng vào demo để owner so trước khi chốt:** `sg4` · mốc **4W** (tên cũ "cửa sổ 1 tháng" — xem reroute node 5) (hạt ngày, hệ quả trực tiếp của 5b) —
> ~13 lượt/ngày cho 4 giá trị, tỉ lệ nhảy hàng chục % giữa hai ngày liền nhau. Ở (i) không có dấu
> hiệu nào để nghi; ở (ii) dải teo lại đúng chỗ nhảy. Thêm **ngày 05/07/2026 cấy chủ ý tổng = 0**:
> 0/0 là **không tính được** ⇒ đường phải ĐỨT (cùng luật rule 2 `signalChart.ts`: nhóm rỗng không
> được đọc thành đã-đo-ra-0). Vạch đỏ báo lý do đứt là luật chung, có ở **cả hai** biến thể — cái
> riêng của (ii) không phải chỗ đứt mà là **mẫu số nhìn thấy liên tục ở mọi kỳ**, tức là thấy được
> mẫu số hai bên chỗ đứt tụt tới đâu, và thấy được cú nhảy n≈13 ở trên.
>
> **Còn treo sau ruling này → đã tách thành node 4b:** lưới C (≥5 giá trị) mang đơn vị gì.
> artifact: `output/demo-chart-diem-do-truc-thoi-gian.html` mục 3 (hai biến thể vẫn giữ lại để đối
> chiếu, mặc định là (ii)) và mục 6 (bảng so hai cơ chế).

## 4b. Lưới C (≥5 giá trị) mang đơn vị gì dưới thiết kế không-công-tắc? [type: mockup]
blocked by: 4
status: resolved
> resolution (**uỷ quyền 13/08, chờ owner review tổng thể**): **lối (b)** — ô mini vẽ **TỈ LỆ**, và
> **MỘT dải khối lượng dùng chung đặt dưới cả lưới**. Hợp lệ vì mọi ô của lưới chia **cùng một mẫu
> số** (tổng lượt bắn của điểm đo trong kỳ), nên một dải phục vụ được hết — đây vẫn là Đ2, không
> phải ngoại lệ của nó; dải riêng từng ô chỉ vẽ lại cùng một hình.
> Bác (a) mini vẽ ĐẾM — **ràng buộc phân định**: ngưỡng ≥5 giá trị do MÁY chọn (node 2), nên một
> điểm đo được khai thêm giá trị thứ 5 sẽ **tự nhảy từ tỉ lệ sang đếm mà người dùng không bấm gì**.
> Đơn vị không được đổi âm thầm qua một ngưỡng máy chọn. Bác (c) mini cao thêm để chứa dải riêng —
> tốn chỗ để vẽ bảy lần cùng một hình.
> Kèm theo: ô mini báo thay đổi bằng **điểm %** (`+3,2 điểm %`), không phải "tăng X% của một %" —
> hai cách đọc lẫn nhau được và cách sau là một con số dưới cái nhãn nó không thuộc về.
> **Còn hở, ghi rõ chứ không giả định:** khi chọn **nhiều điểm đo** cùng lúc thì mỗi điểm đo có mẫu
> số riêng, một dải chung không còn đúng. Ruling này chỉ phủ **một điểm đo**.
> learned: dựng ra mới thấy điểm đo một giá trị vẫn tới được C nếu cho chọn tay (thực tế ngưỡng ≥5
> chặn), nên C phải có nhánh rơi về ĐẾM — không có nhánh đó thì `pct(null)` in ra "0,0%".
> artifact: `output/demo-chart-diem-do-truc-thoi-gian.html` mục 4 (`cAxis` + `cStrip`).

## 5. Kỳ là gì — tháng lịch, hay ba cửa sổ 3/6/12 tháng đang có? [type: decide]
blocked by: —
status: resolved
> **REROUTE 13/08 (uỷ quyền, chờ review tổng thể) — ruling đầu bị lật bởi bằng chứng trong code.**
> Cửa sổ **KHÔNG phải cụm mốc riêng của chart điểm đo**. Nó là **thanh timeframe CHUNG đã có**:
> `store/timeframe.ts` khai `RangeKey = default|7d|14d|4w|3m|6m|12m|custom`, `TimeframeBar` mount ở
> App Shell. `App.tsx:21` ghi thẳng tiền lệ đã lập 06/08: *"TopicsPage … CỐ Ý không dựng cụm 3m/6m/1y
> riêng, mà đọc chính thanh timeframe chung này — hai chỗ điều khiển cùng một thứ sẽ lệch nhau."*
> Bộ 1/3/6/12 tự chế của ruling đầu là đúng cái sai đó. **Việc phải làm khi dựng:** thêm `'signals'`
> vào `TIMEFRAME_ROUTES` (App.tsx) — hôm nay `#/signals` chưa có thanh vì chưa có chart nào theo kỳ.
>
> **Hạt suy từ MỐC**, vẫn không cho chọn tay: 7D→ngày (7 kỳ) · 14D→ngày (14) · 4W→ngày (28) ·
> 3M→tuần (13) · Default/6M/12M→tháng (6/6/12) · Custom→tạm bằng Default (chưa có date-picker thật).
> **KHÔNG dùng lại `RANGE_MONTHS`/`effectiveMonths`** của `features/overview/sec.ts`: chúng gán
> 7d/14d/4w = 1 tháng rồi kẹp sàn 3 điểm vì dữ liệu VoC/Quantify là **monthly-only**. Chart điểm đo
> có mốc thô từng lượt bắn nên ba mốc mịn ở đây là **thật** — đây là surface đầu tiên của app có dữ
> liệu ngày thật, và sự thật đó là **theo từng màn**, không phải toàn cục. Ép qua `effectiveMonths`
> sẽ bẻ 7D thành 3 tháng và người dùng đọc thành bộ lọc hỏng.
>
> Phần vẫn còn đúng của ruling đầu, giữ nguyên:
> `data.periods` cũ `data.periods` cũ (`d7` 3 tháng · `d30` 6 tháng · `m3` 1 năm, kèm `factor` 2.8 / 5.6 / 11)
> (`d7` 3 tháng · `d30` 6 tháng · `m3` 1 năm, kèm `factor` 2.8 / 5.6 / 11) **không dùng lại được**:
> `factor` là hệ số nhân số liệu, nhân `vol` với nó để đẻ ra lịch sử chính là `monthly()` đội lốt.
> **Cửa sổ KHÔNG phải hạt** — 7D với hạt tháng ra đúng một điểm, không thành đường.
> **Kỳ cuối luôn chưa đủ** ở hạt tháng (`asOf` 27/07 nằm giữa tháng) nên phải vẽ khác kỳ đủ (dải nền mờ
> + điểm rỗng + **cột rỗng ở dải khối lượng**) — không thì mọi đường đều tụt ở điểm cuối và đọc
> thành "đang giảm". Cửa sổ phải cắt **theo đúng hạt**: hạt tháng cắt thô ở 27/01 thì bucket đầu chỉ
> có 4 ngày và vẽ ra một điểm tụt giả. Xem mục 1 của demo.

<!-- KIEM CHUNG THI GIAC 13/08: owner mo demo, doc dung "duong ngat = ky khong ban lan nao" o
     sg4 4W. Day la lan dau ban dung duoc nhin bang mat; caveat "chua mo trong browser" het hieu luc.
     PHAT SINH tu chinh lan nhin do, chua chot: NÉT ĐỨT đang mang HAI nghia gan nhau — net dut ngang
     tren duong = ky CHUA DU (node 5), net dut doc mau --crit tai cho ngat = KHONG TINH DUOC (node 4).
     O hat NGAY khong cham nhau (khong bucket ngay nao la partial) nhung o hat THANG thi mot thang
     tong 0 se ve ca hai tren cung mot duong. De xuat: giu CHO NGAT cho khong-tinh-duoc, doi ky-chua-du
     sang dai nen mo + diem rong (bo net dut), de "dut" chi con dung mot nghia.
     CHOT 13/08 (owner: "do la net dut doc, giu cho ngat cung duoc. lam vay di") — DA SUA vao demo:
     bo stroke-dasharray tren duong; ky chua du = rect --ink3 opacity .09 phu ca vung ve LAN dai khoi
     luong, kem vach doc mo o bien trai; chu thich doi thanh "dai nen = ky chua du". stripSvg (dai
     dung chung cua luoi C) tu ve lai dai nen vi nam ngoai svg cua luoi. -->

## 5b. Hạt ngày có đọc được cho điểm đo lưu lượng thấp không? [type: decide]
blocked by: 5
status: resolved
> resolution: **Lối (a) — hạt ngày cho MỌI điểm đo, không suy thêm theo lưu lượng** (owner chốt
> 13/08: "cứ dùng đơn vị hàng ngày kể cả lưu lượng thấp"; owner xác nhận lại cách hiểu 13/08: hạt
> vẫn suy từ mốc, chỉ bỏ ngoại lệ theo lưu lượng). Hạt chỉ phụ thuộc MỐC, một luật duy nhất, không
> có ngoại lệ theo `vol`. Reroute node 5 không chạm ruling này — chỉ đổi tên bộ mốc.
> Loại bỏ: (b) hạt suy theo cả lưu lượng — hai điểm đo cạnh nhau cùng mốc mà khác hạt thì trục
> ngang của chúng không so được với nhau, và không ai nhìn ra vì sao; (c) mốc ngắn dùng hạt tuần —
> 4 điểm quá mỏng để gọi là đường.
> **Cấm làm mượt** (trung bình trượt) để chữa nhiễu hạt ngày: đó là luận giải, mà app hiển thị dữ
> liệu chứ không luận giải (luật owner 11/08). Nhiễu được xử bằng dải khối lượng ở node 4.
> **Cái giá phải nói thẳng, và nó đẩy sang node 4:** `sg4` ở hạt ngày còn ~13 lượt/ngày chia cho 4
> giá trị ⇒ **~3 lượt/ngày/giá trị**. Đường ĐẾM ở mức đó là dao động mẫu nhỏ, còn đường TỈ LỆ thì
> tệ hơn — tỉ lệ tính trên n=13 nhảy hàng chục phần trăm giữa hai ngày liền nhau mà chẳng có gì
> xảy ra. Nên mẫu số phải NHÌN THẤY ĐƯỢC ở tầng đường, không được giấu — xem node 4.

## 6. Hình dạng dữ liệu: `sigCounts` thêm khoá kỳ, hay bảng đếm thứ hai? [type: decide]
blocked by: 2, 3, 4, 5
status: resolved
> resolution (**uỷ quyền 13/08, chờ owner review tổng thể**): **lối (b)** — bảng đếm thứ hai
> `sigTrend = { sig, val, period, n }` với **`period` ở hạt NGÀY**, KHÔNG thêm khoá kỳ vào
> `SigCount`. Hạt hiển thị suy từ mốc (node 5) và **cộng lên từ ngày** — bảng chỉ giao hạt mịn
> nhất, tầng vẽ tự gộp; "kỳ có mặt với `n = 0`" dưới đây nghĩa là **mỗi NGÀY trong cửa sổ đo được**.
> *(13/08: trạng thái (3) đã được VẼ THẬT ở demo mục D — `sg-rut-2` cắm 01/12/2025, mốc 12M có 4
> kỳ trống. Trước đó nó chỉ có trên giấy.)*
> **`n` có BA trạng thái, không phải hai** — đây là phần đắt nhất của ruling và là fog đã graduate
> vào đây:
> 1. `n > 0` — đo được, có bắn.
> 2. `n = 0` — **đo được, không bắn lần nào**. Kỳ này phải **CÓ MẶT** trong bảng. Đường ĐẾM vẽ điểm
>    0 (thật), đường TỈ LỆ **đứt** (0/0 không tính được).
> 3. **chưa đo** — kỳ nằm trước mốc instrument điểm đo (Bảng D "áp dụng từ bản build nào"), hoặc
>    nguồn chết cả kỳ. Kỳ này **vắng mặt**, và tầng vẽ để **trống**, KHÔNG vẽ 0.
> Trộn (2) với (3) là tái phạm đúng luật đã có: *không trộn chưa-biết với thiếu*. Bảng phải phân
> biệt được — hoặc bằng cách chỉ giao kỳ ≥ mốc instrument, hoặc bằng một cột mốc riêng. **Phụ thuộc
> Bảng D, chưa về** — chốt được hình dạng nhưng chưa chốt được cách khai mốc instrument.
> **Đường giao đã chọn (owner 13/08): THÔ, lưu lâu dài, tự lọc bằng SQL.** `sigTrend` do đó là một
> **truy vấn**, không phải bảng phải xin; nhánh "cộng sẵn" đóng lại. Kèm hai hệ quả cứng lên SQL:
> trạng thái (2) `n = 0` **không tự có** — `GROUP BY ngày` không đẻ dòng cho ngày trống, phải
> **LEFT JOIN xương lịch** chặn hai đầu bằng mốc instrument và `asOf`; và **cấm suy mốc instrument
> bằng `MIN(fire.at)`** — điểm đo đã cắm mà im tháng đầu sẽ bị đọc thành chưa cắm, trộn *chưa-biết*
> với *thiếu*. Bảng D vẫn treo vì lý do này.
>
> **Không phát sinh yêu cầu dữ liệu mới ở đường giao THÔ:** mốc từng lượt bắn đã xin hai lần (Notes
> dữ kiện 2), và `sigTrend` là bảng **nội bộ** mà cả hai chế độ nhận (thô hay cộng sẵn) phải cùng
> sinh ra. Chỉ đường giao **cộng sẵn** mới phải xin thêm bảng này.
> Cơ chế (ii) của node 4 cần tổng lượt bắn mỗi kỳ — đó là `SUM(n)` theo `(sig, period)` của chính
> bảng này, không phải dữ liệu đi xin thêm.
> Bác (a): nhân `SigCount` theo kỳ ra `sig × val × dim × band × kỳ`, nổ số dòng để mua một khả năng
> (lọc theo khách ở tầng đường) mà node 3 đã bác.
> Ràng buộc tầng giữ nguyên: phép cộng ở `data/`, `domain/signalChart.ts` chỉ chiếu.
>
> Bối cảnh gốc: (a) Thêm `period` vào `SigCount` → mọi dòng nhân theo số kỳ: sig × val × dim × band × kỳ, nổ số
> dòng nhưng cho phép "lịch sử **và** lọc theo nhóm khách" cùng lúc. (b) Bảng thứ hai
> `sigTrend = { sig, val, period, n }` không có chiều khách → gọn, nhưng node 3 buộc phải chốt
> "lọc theo khách không dùng được ở mode lịch sử". Chọn (b) rồi sau muốn (a) là phải làm lại.
> Ràng buộc tầng: phép cộng sống ở `data/`, `domain/signalChart.ts` chỉ chiếu — cả hai chế độ nhận
> (đã cộng sẵn hay raw) phải ra cùng hình dạng (`projectSignalCounts.ts` docblock).
>
> Node 3 đã quyết gần hết: chiều khách chỉ sống ở tầng dưới ⇒ **(b)**, và cái node 3 lo ("lọc theo
> khách không dùng được ở mode lịch sử") không còn là mất mát vì tầng dưới vẫn giữ nguyên chiều
> khách. Node 4 chỉ còn ảnh hưởng một chi tiết: cơ chế (ii) cần tổng lượt bắn của kỳ — nhưng đó là
> `SUM(n)` của chính bảng (b), **không phải dữ liệu phải đi xin thêm**. Còn chờ node 4 chốt xong
> mới viết `resolution`, vì `n = 0` phải giao được thành **kỳ có mặt với n = 0** chứ không phải
> **kỳ vắng dòng** — hai cái này khác nhau đúng ở chỗ 0/0 mà (ii) đang bắt phải phân biệt.

## 7. Demo Mode sinh lịch sử thế nào mà không tái phạm `monthly()`? [type: simulate]
blocked by: 5, 6
status: resolved
> resolution (**uỷ quyền 13/08, chờ owner review tổng thể**): `Fire` thêm **một trường mốc** (`at`),
> `genFiresForSignal` rải lượt bắn theo mốc trong cửa sổ dữ liệu; `sigTrend` **cộng lên từ chính
> các `Fire` đó**, không nhân hệ số.
> **Vì sao đây KHÔNG phải `monthly()` tái phạm** — phải nói rõ chỗ này hoặc nó đọc thành vi phạm:
> `monthly()` bị cấm vì nó ngoại suy **dữ liệu thật** rồi dán nhãn tháng thật. Demo Mode BẬT có
> điều lệ ngược lại — *"số demo đủ để trình diễn"* — nên **sinh** ra lượt bắn là đúng việc của nó.
> Ranh giới: cấm dùng `Period.factor` (2,8 / 5,6 / 11) nhân `vol` để đẻ lịch sử, ở **cả hai** chế
> độ; và Demo Mode TẮT thì **rỗng**, không phải đường phẳng 0.
> Ràng buộc giữ nguyên: chỉ vẽ kỳ có số, chuỗi ngắn vẽ ngắn, không ngoại suy ngược; `vol === 0` vẫn
> không có đường nào (rule 2); điểm đo bật giữa chuỗi thì đoạn trước là **trống**, không phải 0
> (đây chính là trạng thái 3 của node 6).
> learned (từ chính bản dựng thử): hai lỗi chỉ lộ ra khi dựng, không lộ ra khi nghĩ — (1) cửa sổ
> cắt thô theo ngày làm bucket đầu ở hạt tháng chỉ có 4 ngày và vẽ ra **một điểm tụt giả**, phải
> cắt theo đúng hạt; (2) không đánh dấu kỳ chưa đủ thì **mọi** đường đều đọc thành "đang giảm" —
> và dải khối lượng cũng dính đúng lỗi đó, phải vẽ cột rỗng.
> artifact: `output/demo-chart-diem-do-truc-thoi-gian.html` (bộ sinh theo NGÀY + gộp bucket theo
> hạt, 2.688 tổ hợp render đã chạy qua stub DOM không lỗi).
>
> Bối cảnh gốc: `Fire` thêm trường mốc + `genFiresForSignal` rải theo kỳ. Ràng buộc: chỉ vẽ kỳ **có số**, chuỗi
> ngắn vẽ ngắn, không ngoại suy ngược; điểm đo `vol === 0` vẫn không có đường nào (rule 2 hiện
> hành); Demo TẮT → rỗng, không phải đường phẳng 0. Cần một bản dựng thử để nhìn bằng mắt trước khi
> chốt hình — đặc biệt ca signal mới bật giữa chuỗi (đường bắt đầu giữa trục, không được đọc thành
> "rớt về 0" ở đoạn trước đó).

## 8. Thuộc tính khách lấy ở thời điểm nào — lúc bắn hay hôm nay? [type: decide]
<!-- type đổi research → decide 13/08: không còn bên ngoài để tra, owner chọn cơ chế lưu -->
blocked by: 3
status: resolved
> **CHỐT 13/08 — lối (b), nối temporal lúc đọc.** Owner: *"khả năng cao là có"* bảng NAV/tier cuối
> ngày ⇒ không dựng gì ở đường ghi. Bốn luật của phép nối (chi tiết ADR §8): nối theo **ngày của
> lượt bắn** chứ không phải đầu kỳ hiển thị (chart đếm lượt bắn nên khách đổi nhóm giữa kỳ không
> gây đếm trùng); lưu **giá trị thô**, chia nhóm lúc đọc bằng `cfg` hôm nay; **phạm vi lưu phải
> phủ 12M** — phần ngoài phạm vi là trạng thái (3) *chưa đo* của node 6 lặp ở chiều khách, không
> được rơi về thuộc tính hôm nay; chỉ **`nav` + `tier`** cần nối. Nhãn "tính theo hôm nay" bỏ cho
> phần có snapshot phủ.
> **Trigger lật lại:** không có bảng đó / giữ ngắn hơn 12 tháng / không có `tier` theo ngày ⇒ về
> mặc định (c) + nhãn, và bật ghi snapshot đúng hai trường `navVnd` + `tier`.
>
> *(quá trình 13/08, giữ để không tái tranh luận)* — **REROUTE:** Owner: *"data sẽ là dạng raw lưu trữ lâu dài nên mình sẽ là
> bên tự kiểm soát và filter bằng SQL"* ⇒ không còn bên thứ ba để hỏi; đây thành quyết định
> **thiết kế đường GHI** của chính mình, và nó **mục theo ngày** (mọi cơ chế chỉ giữ lịch sử kể từ
> hôm bật; ngày chưa bật không vá lại được). Ba lối: **(a)** đóng dấu thuộc tính lên chính dòng
> lượt bắn — chính xác nhất, nhưng bên PHÁT phải biết NAV/tuổi và PII rải khắp bảng sự kiện;
> **(b)** bảng snapshot `khách × kỳ`, nối temporal lúc đọc — không đụng bên phát, PII gom một chỗ,
> chính xác đến hạt snapshot (**khuyến nghị**); **(c)** nối bảng khách hiện tại lúc đọc = chính
> mặc định đang chạy, nay là tự chọn chứ không bị ép. Ở (a) và (b) phải đóng dấu **giá trị thô,
> không đóng dấu nhóm** — ranh giới nhóm do `cfg` sở hữu và đổi được. Chờ owner chọn một.
>
> **Thu hẹp 13/08** (owner: mỗi dòng có `customer id`, đối chiếu ra NAV/tuổi) — đối chiếu lúc đọc
> chính là lối (c), trả giá trị HÔM NAY bất kể lượt bắn xảy ra bao giờ, nên `customer id` không
> trả lời được câu hỏi lịch sử. Nhưng chỉ **2/4 chiều khách đổi theo thời gian**: `nav`
> (`navVnd`, nhãn tự khai là "Tài sản hiện tại") và `tier` (xét lại theo kỳ). `age` suy lại được
> từ ngày sinh ở mọi mốc, `acq` tĩnh, `sigpf` là `base:'fire'` đã nằm sẵn trên dòng. Câu hỏi còn
> lại đúng một: **có bảng NAV/tier cuối ngày theo tài khoản không?** — có thì lối (b) không phải
> dựng gì ở đường ghi và phần mục-theo-ngày biến mất. Chi tiết: ADR §8.
>
> *(text treo cũ, giữ nguyên để không tái tranh luận)* — deferred vì chỉ đội dữ liệu trả lời được
> *"có snapshot thuộc tính khách theo kỳ không, hay chỉ có giá trị hôm nay"*.
> **Mặc định đang có hiệu lực trong lúc chờ:** lát cắt dùng **thuộc tính HÔM NAY**, và **nhãn phải
> nói rõ mốc** — ví dụ *"nhóm NAV tính theo hôm nay, không phải theo kỳ đang xem"*. Nói ra thì đó
> là một giới hạn đã khai; im lặng thì đó là một con số dưới cái nhãn nó không thuộc về.
> **Trigger mở lại:** ~~đội dữ liệu trả lời~~ — **đã nổ 13/08**. Chọn (a)/(b) ⇒ lát cắt đổi sang
> mốc-lúc-bắn và nhãn bỏ đi (chỉ cho phần lịch sử kể từ hôm bật ghi). Chọn (c) ⇒ mặc định thành
> ruling chính thức, nhãn ở lại vĩnh viễn.
> Chỉ chạm **tầng dưới** (lát cắt). Tầng đường không chia theo khách (node 3) nên không dính.
>
> Bối cảnh: câu này **đã ghi trong thiết kế §11 yêu cầu 3 và chưa ai trả lời**: *"Cắt lỗi eKYC của quý trước
> theo NAV hôm nay nghĩa là gán phân khúc hiện tại cho hành vi quá khứ"*. Hôm nay nó ngủ yên vì
> chart không có trục thời gian; thêm trục vào là nó thành load-bearing ngay. Cần bên dữ liệu trả
> lời (họ có snapshot theo kỳ không), owner chốt sau. Nếu chỉ có NAV hôm nay thì node 3 phải chọn
> "lọc theo khách" kèm nhãn nói rõ nhóm tính theo mốc nào.

## 9. Chart lịch sử có nuôi lại tầng chỉ số không? [type: decide]
blocked by: 4, 6
status: resolved
> resolution (**uỷ quyền 13/08, chờ owner review tổng thể**): **DỪNG ở chart điểm đo. Mở đường, ghi
> lại, không nối.** `Metric` KHÔNG nhận định nghĩa máy đọc được trong vòng này.
> Lý do là luật nhà, không phải ngại việc: **không khai schema trước chỗ tiêu thụ**. Hôm nay chưa có
> consumer nào của `Metric.formula` dạng máy đọc — thêm field vào là lặp lại đúng vụ `anomalyX` đã
> bỏ (`data/schema/config.ts:15-20`).
> Thêm một lý do cứng vừa xuất hiện từ node 4: chỉ số kiểu *"tỉ lệ trượt giấy tờ"* cần mẫu số ở
> **điểm đo khác** (`sg4 ÷ sg3`), mà node 4 vừa **cấm tỉ lệ liên-điểm-đo**. Nối tầng chỉ số bây giờ
> là mở lại đúng cái cửa vừa đóng, ở một chỗ không ai nhìn.
> **Cái được ghi lại để không mất:** `sigTrend = { sig, val, period, n }` (node 6) **chính là** chuỗi
> nguyên liệu của một chỉ số. Khớp đứt đã đo ở phiên này — `Metric.value` là chuỗi gõ tay,
> `Metric.formula` là văn bản hiển thị, `mval()` `parseFloat` một chuỗi rồi đem so ngưỡng — vẫn còn
> nguyên và **không** được coi là đã giải quyết.
> **Trigger mở lại:** khi tầng chỉ số có consumer thật (một màn cần chuỗi chỉ số theo kỳ, hoặc
> ngưỡng cần chạy trên chuỗi thay vì trên một số gõ tay).
>
> Bối cảnh: khi đã có "số lần theo giá trị theo kỳ", thì `fail ÷ tổng theo kỳ` **chính là** chuỗi của một chỉ
> số — tức là khớp đứt đã đo được ở phiên này (`Metric.value` là chuỗi gõ tay, `Metric.formula` là
> văn bản hiển thị) được nhánh này mở đường. Câu cần chốt: nhánh này dừng ở chart điểm đo, hay
> `Metric` nhận luôn định nghĩa máy đọc được trỏ vào `(signalId, value)`. Luật nhà: **không khai
> schema trước chỗ tiêu thụ** — nên nhiều khả năng là "dừng, mở đường, ghi lại", nhưng phải là một
> ruling chứ không phải im lặng.

## 10. Giá trị CHƯA KHAI hiện thế nào trên trục thời gian? [type: decide]
blocked by: 6
status: resolved
> (graduate từ Fog 13/08 — đã phát biểu chính xác được sau khi node 6 chốt hình dạng dữ liệu.)
> resolution (**uỷ quyền 13/08, chờ owner review tổng thể**): giá trị chưa khai (§7 thiết kế:
> pipeline bắn ra token không có trong `Signal.values`) **vẫn là một đường như mọi giá trị khác**,
> bắt đầu ở **kỳ đầu tiên token đó xuất hiện** — không kéo ngược về đầu trục bằng 0. Cảnh báo *"cần
> bổ sung khai báo"* đặt ở **chú giải**, gắn vào đường đó, không đặt theo kỳ.
> Đây là §7 mở rộng sang trục thời gian, không phải luật mới: §7 đã chốt giá trị chưa khai **phải
> hiện ra** chứ không bị nuốt. Kéo ngược về 0 là nói "kỳ đó đã đo và bằng 0" — sai, và trùng đúng
> trạng thái 3 của node 6 (chưa đo ⇒ trống).

## 11. Chọn NHIỀU điểm đo cùng lúc trên trục thời gian? [type: decide]
blocked by: 2, 4b
status: no-build
> (graduate từ Fog 13/08.)
> **NO-BUILD 13/08 — owner chốt trực tiếp:** *"bỏ hướng ghép nhiều đi, chỉ cần từng data được show
> cho tốt là được r, ko làm cái này nữa"*. Màn Điểm đo lo MỘT điểm đo hiện cho tốt. Bản dựng thử
> (demo mục D) đã gỡ.
> **Trigger mở lại:** có câu hỏi thật cần hai điểm đo trên cùng một trục thời gian (kiểu "eKYC fail
> và withdraw block có cùng nhích lên hồi tháng nào không"). Chưa có câu đó thì đây là năng lực
> không ai xin.
>
> **Giữ lại từ vòng dựng thử** — vì là luật của MỘT điểm đo, không phải của chế độ ghép: điểm đo cắm
> giữa cửa sổ ⇒ phần trước mốc cắm để TRỐNG (không vẽ 0, không cột trong dải khối lượng, không đánh
> dấu như chỗ ngắt 0/0) và **tự khai trên màn**; lưới C so với **kỳ đầu ĐO ĐƯỢC** chứ không phải kỳ
> đầu cửa sổ. Cấy vào demo bằng `sg-rut-2.since = 01/12/2025`, hiện ở mốc 12M.
>
> *(ruling cũ, giữ để không tái tranh luận)* — trước đó: ép sang lưới C, mỗi điểm đo một dải khối
> lượng riêng; rồi bản dựng 13/08 sửa thành "ô = một điểm đo, một đường đếm, không cần dải". Cả hai
> nay đều không dùng.
# Fog

— (rỗng 13/08: bốn mục đã graduate thành node 10, 11, vào node 6 (trạng thái "chưa đo"), và tra
xong (bộ lọc kỳ là **global**, `store/timeframe.ts` — đã đổ vào reroute node 5).)

# Handoffs

—

# Out of scope

- Dựng formula engine cho `Metric` — node 9 chỉ quyết định có nối hay không, không tự làm.
- Chart VoC / theme (`pts` 12 điểm thật) — đã có đường riêng, không gộp vào đây.
- Màn thêm chiều khách (gap đã đo ở phiên này) — khác nhánh, không chặn nhánh này.
