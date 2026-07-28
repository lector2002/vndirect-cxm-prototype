# Redesign bản đồ hành trình + lớp VoC theo mô hình Enterpret

> Ngày: 28/07/2026 · Trạng thái: **đã implement và verify**
> Thay thế `2026-07-27-cxm-voc-redesign-design.md` ở các mục IA, phase model, `#/health`, nhóm Nền dữ liệu.
> Phụ lục bắt buộc đọc kèm: `docs/journey-provenance-audit.md`
> **Đọc §Z trước §B3 và §B6 — owner đã đổi IA sau khi review bản implement đầu.**

---

## Z. BỔ SUNG 28/07 — TÁCH HAI PHẦN CXM / VoC

Owner review bản implement đầu và nêu ba điểm. Mục này **ghi đè §B3 và §B6**; phần còn lại
của spec (§A toàn bộ, §B1 · §B2 · §B4 · §B5, §C, §D, §E, §F) vẫn đúng nguyên.

**1. Tổng quan cũ nghiêng hẳn về VoC.** Tách thành **hai** Tổng quan theo đúng phân định đã có
từ đầu dự án — *VoC tạo insight · CXM quản lý issue, action, outcome, close-the-loop*:

```
CXM · QUẢN TRỊ TRẢI NGHIỆM        VOICE OF CUSTOMER
  #/cxm    Tổng quan CXM            #/voc         Tổng quan VoC
  #/atlas  Bản đồ hành trình        #/sources     Nguồn dữ liệu
  #/work   Bảng xử lý               #/topics      Topic
                                    #/vocjourney  VoC theo hành trình
CÔNG CỤ                           QUẢN TRỊ
  #/quantify · #/assistant          #/rules · #/agents
```
**11 nav item · 12 view.** Route ẩn `#/cxm/<set>` · `#/voc/<set>` · `#/issue/<id>`.
Mỗi chart trên một Tổng quan chỉ dẫn tới **tab chi tiết của chính phần đó** — không nhảy chéo.
Hai Tổng quan dùng chung `renderSet()` nhưng đọc hai tập dữ liệu khác nhau: VoC lấy
`tax` · `sources` · `ev` · `ins`; CXM lấy `iss` · `act` · `out` · `loop` · `obs`.

**2. `#/feed` bỏ.** *"Không cần xem chi tiết từng feedback, chỉ cần biết nguồn nào như thế nào và
trong nguồn đó feedback như thế nào về mặt data."* Thay bằng **hồ sơ dữ liệu từng nguồn**
(`srcProfile()`) trong `#/sources`: volume · độ tươi vs SLA · nền tảng phủ · chỉ số phụ thuộc, cộng
**năm chiều phân bố** của feedback trong nguồn đó (intent · sentiment · nền tảng · topic · phase),
và đúng **hai** bản ghi mẫu để biết nguồn đó "nói kiểu gì".

> Verbatim **không mất**: vẫn nằm trong `#/topics` (kèm lý do phân loại), tab *Verbatim* của
> `#/vocjourney`, và `#/issue/<id>`. Cái bị bỏ là chỗ **cuộn tin thô** — nó không dẫn tới quyết
> định nào, và giữ nó tạo ảo giác rằng đọc hết feedback là một cách làm việc.

**3. Nhiều set dashboard, customize được.** `DATA.dash` thành **6 set, mỗi phần 3**. Set là một
chuỗi **câu hỏi**, mỗi câu hỏi có một dãy **block**; block là ID saved Quantify hoặc `@<khối>` khi
thứ cần vẽ không phải một chart đơn.

| Khối đặc biệt | Phần | Drill tới |
|---|---|---|
| `@srcmatrix` · `@intent` · `@anomlanes` | voc | `#/sources` · `#/topics` · `#/agents` |
| `@toppri` · `@lanes` · `@outcomes` | cxm | `#/work` |
| `@journeystate` · `@coverage` | cxm | `#/atlas` |

| VoC | CXM |
|---|---|
| Toàn cảnh tiếng nói *(mặc định)* · Chất lượng nền dữ liệu · Topic đang xấu đi | Điều hành CX *(mặc định)* · Sức khỏe pilot Mở tài khoản · Hiệu quả sau thay đổi |

`validateFixture()` bổ sung: mỗi phần có **đúng một** set mặc định · mọi block phải trỏ tới thứ có
thật · **khối của phần này không được gắn vào set của phần kia** · mọi khóa `CFG.sub` phải khớp
một set đang tồn tại.

Tùy chỉnh lưu ở `ST.boards`, **chỉ giữ set đã bị động tới** — set chưa động vẫn đọc thẳng từ
`DATA.dash`, nên "Trả về mặc định" chỉ cần xóa một khóa. Không persist, và UI ghi rõ điều đó.

**Alias giữ link cũ không đứt**: `dashboard`·`board` → `cxm` · `feed`·`surveys` → `sources` ·
`taxonomy` → `topics` · `issues`·`actions`·`outcomes` → `work` · `health` → `work` chế độ ưu tiên.

---

## 0. Vì sao có spec này

Owner review bản `output/cxm-platform-prototype.html` và nêu bốn điểm:

1. Bản đồ hành trình chưa chính xác với thực tế.
2. Phần Giao dịch phải tách theo từng sản phẩm — mỗi sản phẩm là một hành trình sử dụng riêng.
3. Không rõ vì sao cần `Sức khỏe hành trình` khi bản đồ đã bấm vào xem chi tiết được.
4. Feed và nhóm Nền dữ liệu phải làm lại theo hướng VoC, lấy Enterpret làm mô hình gốc:
   nguồn dữ liệu tới từ đâu · độ toàn vẹn dữ liệu từ các nền tảng · các topic của VoC ·
   cấu trúc VoC theo customer journey để thấy insight tại từng điểm chạm.

Sau đó owner bổ sung: **làm giống Enterpret, ưu tiên demo đủ tính năng trước; đây chưa phải toàn bộ
dữ liệu công ty nên con số cụ thể sẽ chốt sau.**

Kiểm chứng điểm 1 cho ra kết quả nặng hơn dự kiến. Trong 20 flow: **12 flow khai báo có nguồn, và
10 trong số đó sai.** Chi tiết từng dòng ở `docs/journey-provenance-audit.md`. Tóm tắt:

- Money Journey có **7** sơ đồ; 5 flow trỏ tới MJ 9 · 10 · 12 · 13 · 14 — không tồn tại.
- 5 flow trỏ nhầm sang sơ đồ có nội dung khác hẳn.
- Chỉ `f-open-2026` và `f-tr-sub` đúng.
- 8 flow còn lại khai `src:'—'` — khai báo trung thực, không phải lỗi.
- 9 sơ đồ có thật không có flow nào, trong đó AJ 3–7 đều là **servicing** — mô hình phase cũ không có chỗ chứa.

---

## PHẦN A — BẢN ĐỒ HÀNH TRÌNH

### A1. Mô hình phase: 7 → 6

Margin và Sản phẩm đầu tư đều là **giao dịch**; khung "Sức mua" bị bỏ vì nó mô tả cơ chế nội bộ,
không phải bước khách hàng sử dụng dịch vụ. Thêm phase **Quản lý tài khoản** cho nhóm servicing
mà mô hình cũ không có chỗ chứa.

| Mới | Code | Tên | Từ đâu ra |
|---|---|---|---|
| `p1` | 01 | Tìm hiểu & Tiếp cận | giữ nguyên |
| `p2` | 02 | Mở tài khoản | giữ nguyên |
| `p3` | 03 | Dòng tiền | giữ nguyên |
| `p4` | 04 | Giao dịch | gộp `p4 Giao dịch` + `p5 Margin & Sức mua` + `p6 Sản phẩm đầu tư` |
| `p5` | 05 | **Quản lý tài khoản** | **mới** — chứa AJ 3 · 4 · 5 · 6 · 7 |
| `p6` | 06 | Chăm sóc, khiếu nại & Churn | `p7` cũ, đổi số |

### A2. Nhóm: 14 → 20

Trong phase 04, **nhóm = sản phẩm / dịch vụ khách sử dụng**. Đây là cách hiện thực yêu cầu
*"mỗi sản phẩm đều có 1 hành trình sử dụng riêng"* mà không phải thêm trục điều hướng thứ hai.

| Phase | Nhóm | ID |
|---|---|---|
| 01 | Thu hút · Lead & Xác thực SĐT | `g-reach` `g-lead` |
| 02 | Mở tài khoản mới · Định hướng sau mở | `g-open` `g-activate` |
| 03 | Nộp tiền · Rút & chuyển tiền | `g-in` `g-out` |
| 04 | Cổ phiếu & ETF · Chứng quyền CW · Quyền mua ưu đãi · Trái phiếu DBOND/VBOND · Chứng chỉ quỹ mở · Phái sinh VN30F · Margin (GDKQ) · Ứng trước tiền bán | `g-eq` `g-cw` `g-right` `g-bond` `g-fund` `g-deriv` `g-mgn` `g-adv` |
| 05 | Định danh & giấy tờ · Thông tin & thụ hưởng · Bảo mật & thiết bị · Báo cáo & tài sản | `g-idv` `g-info` `g-sec` `g-report` |
| 06 | Hỗ trợ & khiếu nại · Inactive & Win-back | `g-care` `g-churn` |

### A3. Flow: 20 → 32, trong đó 25 có nguồn xác minh

`verified:true` **chỉ khi** `src` trỏ tới một sơ đồ tồn tại. `verified:false` ⟺ `src:'—'`.
`observed:true` **chỉ khi** flow có `steps` và mọi step có bản ghi `obs`.

| ID | Phase · Nhóm | Tên | `src` | verified | observed |
|---|---|---|---|:-:|:-:|
| `f-reach-ref` | 01 · g-reach | Giới thiệu bạn bè (referral) | `—` | ✗ | ✗ |
| `f-lead-otp` | 01 · g-lead | Đăng ký & xác thực SĐT | `—` | ✗ | ✗ |
| `f-open-2026` | 02 · g-open | Mở tài khoản mới 2026 | AJ · Sơ đồ 2 & 9 | ✓ | **✓ pilot** |
| `f-onb-first` | 02 · g-activate | Định hướng & giao dịch đầu tiên | `—` | ✗ | ✗ |
| `f-dep-4ch` | 03 · g-in | Nạp tiền — QR · cổng NH · liên kết · quầy | MJ · Sơ đồ 2 | ✓ | ✗ |
| `f-dep-trace` | 03 · g-in | Tra soát nạp tiền | MJ · Sơ đồ 2 | ✓ | ✗ |
| `f-wd` | 03 · g-out | Rút tiền về ngân hàng | MJ · Sơ đồ 5 | ✓ | ✗ |
| `f-tr-sub` | 03 · g-out | Chuyển tiền nội bộ giữa TK giao dịch | MJ · Sơ đồ 7 | ✓ | ✗ |
| `f-eq-buy` | 04 · g-eq | Mua cổ phiếu / ETF | MJ · Sơ đồ 3 | ✓ | ✗ |
| `f-eq-sell` | 04 · g-eq | Bán cổ phiếu / ETF + thuế phí | MJ · Sơ đồ 4 | ✓ | ✗ |
| `f-cw-buy` | 04 · g-cw | Mua chứng quyền CW | MJ · Sơ đồ 3 | ✓ | ✗ |
| `f-cw-settle` | 04 · g-cw | Bán / đáo hạn CW | MJ · Sơ đồ 4 | ✓ | ✗ |
| `f-right` | 04 · g-right | Thực hiện quyền mua ưu đãi | MJ · Sơ đồ 3 & 4 | ✓ | ✗ |
| `f-bond-buy` | 04 · g-bond | Mua trái phiếu DBOND / VBOND | MJ · Sơ đồ 3 | ✓ | ✗ |
| `f-bond-sell` | 04 · g-bond | Trả lại trái phiếu — sớm / đúng hạn | MJ · Sơ đồ 4 | ✓ | ✗ |
| `f-fund-buy` | 04 · g-fund | Mua chứng chỉ quỹ theo phiên NAV | MJ · Sơ đồ 3 | ✓ | ✗ |
| `f-fund-sell` | 04 · g-fund | Bán CCQ & chọn nơi nhận tiền | MJ · Sơ đồ 4 | ✓ | ✗ |
| `f-deriv-open` | 04 · g-deriv | Mở tài khoản phái sinh | AJ · Sơ đồ 11 | ✓ | ✗ |
| `f-deriv-pro` | 04 · g-deriv | Đăng ký & dùng Phái sinh Pro | AJ · Sơ đồ 12 | ✓ | ✗ |
| `f-deriv-margin` | 04 · g-deriv | Nộp / rút ký quỹ CCP – VSDC | MJ · Sơ đồ 6 | ✓ | ✗ |
| `f-deriv-trade` | 04 · g-deriv | Giao dịch VN30F | MJ · Sơ đồ 3 & 4 | ✓ | ✗ |
| `f-mgn-reg` | 04 · g-mgn | Đăng ký Margin (GDKQ) | AJ · Sơ đồ 10 | ✓ | ✗ |
| `f-mgn-call` | 04 · g-mgn | Call margin & xử lý | `—` | ✗ | ✗ |
| `f-adv` | 04 · g-adv | Ứng trước tiền bán (UTTB) | AJ · Sơ đồ 13 | ✓ | ✗ |
| `f-cccd-chip` | 05 · g-idv | Cập nhật / thay đổi CCCD gắn chip | AJ · Sơ đồ 4 | ✓ | ✗ |
| `f-info-change` | 05 · g-info | Thay đổi thông tin cá nhân | AJ · Sơ đồ 3 | ✓ | ✗ |
| `f-benef` | 05 · g-info | Thêm / xóa thông tin thụ hưởng | AJ · Sơ đồ 5 | ✓ | ✗ |
| `f-security` | 05 · g-sec | Mật khẩu · PIN · Smart OTP · thiết bị tin cậy | AJ · Sơ đồ 6 | ✓ | ✗ |
| `f-report` | 05 · g-report | Sao kê · tổng quan tài sản · lãi lỗ · lịch dòng tiền | AJ · Sơ đồ 7 | ✓ | ✗ |
| `f-care` | 06 · g-care | Hotline & chat hỗ trợ | `—` | ✗ | ✗ |
| `f-claim` | 06 · g-care | Khiếu nại | `—` | ✗ | ✗ |
| `f-churn` | 06 · g-churn | Ngừng giao dịch & win-back | `—` | ✗ | ✗ |

**32 flow · 25 verified · 1 observed.** Trước đó: 20 flow · 2 verified · 1 observed.

### A4. Ánh xạ ID cũ → mới

| ID cũ | Xử lý | Lý do |
|---|---|---|
| `f-dep-va` + `f-dep-link` | gộp thành `f-dep-4ch` | MJ 2 mô tả cả 4 kênh nạp trong **một** sơ đồ; tách ra là tạo hai flow từ một nguồn. Tên "VA" cũng không có trong nguồn |
| `f-order` · `f-reject` | **xóa** | provenance bịa (MJ 9, MJ 10). Việc đặt / sửa / hủy lệnh nằm trong flow Mua và Bán của từng sản phẩm |
| `f-port` | **gộp** vào `f-report` | AJ 7 đã bao gồm "tổng quan tài sản"; giữ riêng là tạo flow không nguồn trùng nội dung flow có nguồn |
| `f-bond` "Mua iBond" | → `f-bond-buy`, đổi `src` `—` → MJ 3 | |
| `f-bond-sell` "Bán lại iBond trước hạn" | **giữ, không phải thêm mới** — đổi tên thành "Trả lại trái phiếu — sớm / đúng hạn", đổi `src` `—` → MJ 4 | fixture gốc đã có node này |
| `f-fund` "Mua chứng chỉ quỹ & DCA" | → `f-fund-buy`, đổi `src` `—` → MJ 3 | |
| `f-fund-sell` | **thêm mới** từ MJ 4 | gốc chỉ có một flow `f-fund`, không có nhánh bán |
| `g-mgn` · `g-adv` | chuyển phase `p5` → `p4` | margin và UTTB là dịch vụ dùng khi giao dịch |
| `g-bond` · `g-fund` | chuyển phase `p6` → `p4` | sản phẩm đầu tư cũng là giao dịch |
| `p5` · `p6` cũ | **xóa** | nội dung chuyển hết vào `p4` |
| `p7` cũ | → `p6` | đổi số sau khi bỏ hai phase |

**Không thêm** flow cho AJ 2 (Xác thực khách hàng) và AJ 8 (Đăng ký sản phẩm / dịch vụ). Hai quyết định
cũ trong `AI-CONTEXT.md` vẫn hiệu lực: AJ 2 đã cố ý gộp vào các bước eKYC của `f-open-2026`; AJ 8 là
flow tổng quan/routing đã bị loại vì trùng với flow chi tiết. AJ 2-C (Xác thực khuôn mặt) xuất hiện
dưới dạng **cổng** trong `f-mgn-reg` và `f-deriv-pro`, không phải flow riêng.

### A5. Sửa nội dung, không chỉ sửa con trỏ

Ba flow phải viết lại mô tả cho khớp nguồn:

- **`f-dep-4ch`** — 4 kênh: quét QR (ghi có ngay, dưới 500tr/lần) · cổng nộp tiền CK (BIDV·VIB·VCB·VietinBank·VPBank) · liên kết NH chi hộ tự động (chỉ BIDV·VPBank, trùng CCCD) · nộp tại quầy (4 TK tổng ACB·BIDV·VCB·VietinBank). Tiền vào TK chuyên dụng **021C01** (cơ sở) / **021C02** (phái sinh). Không hỗ trợ ATM và thẻ Visa. Nộp 17h–20h có thể chờ xử lý cuối ngày.
- **`f-dep-trace`** — 6 trạng thái: Tạo yêu cầu (chứng từ tối đa 5 file) → Chờ tiếp nhận → Đang xử lý TTTT → Chờ bên thứ ba → Hoàn tất (ghi có / hoàn tiền) hoặc Từ chối. SLA 1 ngày làm việc.
- **`f-wd`** — chuỗi cổng: số dư *được phép* rút (= dư tiền − chờ T+2 − nợ margin và lãi − phong tỏa − ký quỹ PS) → RTT > 100% (dưới thì Smart Sell) → xác thực CCCD qua VNeID (bắt buộc với TK mở sau 01/01/2026) → xác thực chữ ký qua video call (TK phái sinh) → hoàn thiện hợp đồng → OTP / Smart OTP → giờ và hạn mức (08–16h không hạn mức; 16h–08h tối đa 499.999.999đ) → blackout sau 16h ngày làm việc cuối tháng tới 8h ngày đầu tháng sau.

### A6. Bỏ `#/health`

`V.health` hiện là hai thứ không liên quan bị ghép chung:

| Nửa | Dòng | Kết luận |
|---|---|---|
| Funnel pilot 6 bước | 1522–1547 | **Trùng hoàn toàn** với `journeySpine()` ở `#/atlas` — cùng `DATA.steps` + `DATA.obs`, cùng `stepState()`, cùng thanh evidence coverage. `journeySpine()` là bản đầy đủ hơn: có thêm dải nối thể hiện số khách rơi giữa hai bước và câu đọc-theo-chiều-ngang. **Bỏ.** |
| Friction queue | 1549–1579 | **Không có ở đâu khác.** Xếp hạng điểm gãy xuyên bước kèm breakdown 6 thành phần ưu tiên. `stepInspector` chỉ liệt kê issue của một bước; `#/work` chia làn theo trạng thái xử lý, không theo mức ưu tiên. **Giữ, chuyển sang `#/work`** thành chế độ xem *"xếp theo ưu tiên"* bên cạnh 4 làn hiện có. |

> ⚠️ **Ghi đè quyết định cũ có chủ ý.** `AI-CONTEXT.md` dòng 110 nằm trong mục *"Quyết định cố ý giữ,
> đừng sửa lại"* ghi: *"Không gộp funnel của `#/health` vào `#/atlas`"*. Owner đã xem lại và quyết
> định bỏ. Lý do phản đối gốc — atlas là cấu trúc trên 32 flow, health là hàng đợi pilot — được xử lý
> bằng cách đưa friction queue sang `#/work` chứ không nhét vào atlas. Dòng 110 phải được cập nhật.

---

## PHẦN B — LỚP VoC THEO MÔ HÌNH ENTERPRET

### B1. Cơ chế Enterpret được áp dụng

Xác minh từ `helpcenter.enterpret.com`, không phải suy đoán.

**Quantify** — mọi chart là một query 4 phần:

| Phần | Giá trị Enterpret có | Ánh xạ sang CXM |
|---|---|---|
| **Show me** (group by) | Tracked Keywords · Reasons · User Sentiment · Language · Users & Accounts · Sources · Source metadata | L1/L2/L3 Keyword · Theme/Sub-theme · Category · Sentiment · Nguồn · Nền tảng · Segment · Value tier |
| **Metric** | Count · Percentage · NPS · CSAT · DSAT · Sum · Mean · **Impact on NPS/CSAT** | Count · Percentage · Mean · CSAT · **Tác động lên CES** · Sum (số khách high-value) |
| **Time range** | Last / Since / Between | `DATA.periods` — 7 ngày / 30 ngày / 3 tháng |
| **Compare** | theo thời gian (A vs B) · theo filter khác | giữ nguyên cả hai |

**Visualisation**: `Anomalies` và `Bar + Trends + Anomalies`. Anomaly dùng **Z-score, ngưỡng mặc định
1,5**; hover hiện Z-score chính xác và các record đẩy nó lên. Ngưỡng chỉnh được (1,0 nhạy hơn · 2,5+ ít
cảnh báo hơn) — đặt trong `CFG` để sửa ở `#/rules`.

**Dashboard** = *"organized collections of Quantify charts"*. Không có widget nào ngoài Quantify chart.

**Taxonomy**: Categories (intent) → Keywords L1/L2/L3 (product area → feature → sub-feature) →
Themes & Sub-themes (nói về gì / vì sao). Enrichment: Sentiment, **Sentiment Shift**, Total Response Time.

Bốn Category intent của Enterpret khớp **1–1** với `DATA.cats` đang có:

| Enterpret | CXM |
|---|---|
| Complaint | `complaint` Khiếu nại |
| Improvement | `improvement` Đề xuất cải thiện |
| Help | `help` Cần hỗ trợ |
| Praise | `praise` Khen ngợi |

### B2. Anatomy widget — copy nguyên

Mọi widget dùng chung bốn phần đầu. Đây là thứ làm nó đọc ra Enterpret thay vì một trang BI chung chung.

```
Nguồn phản hồi                                   ← tiêu đề
3 tháng gần nhất (28/04/2026 → 27/07/2026)       ← DATA.periods[].range
Đang hiện Top 7 trên 7 nguồn                     ← qt.shown / qt.total
▬▬▬▬▬▬▬▬▬▬▬▬▬▬  Digital analytics       41.200
▬▬▬▬▬            eKYC SDK                12.800
▬                CS case                  1.840
Số bản ghi phản hồi                              ← nhãn trục nêu rõ đang đếm gì
```

Hai chi tiết cấu trúc phải giữ:

- **Sub-theme hiện thành chip *dưới* thanh theme cha** — như *"Subscription Entitlements Not Applied"*
  nằm dưới *"Super Status Unrecognized In App"* trong bản Enterpret.
- **Tiêu đề section là câu hỏi**, không phải danh từ.

### B3. `#/dashboard` trở thành VoC Home

**Không thêm route.** Cấu trúc cần thiết đã có sẵn:

- `DATA.dash` — 3 bảng theo vai (`d-cx` · `d-pilot` · `d-voc`) với `role` · `shared` · `desc` · `q:[...]`.
  Đây chính là cấu trúc *PM View* của Enterpret: tiêu đề, chủ sở hữu, mô tả, tập chart.
- `DATA.qt` — đã có `chart:'rank'|'trend'|'cohort'`, `dim`, và **`shown`/`total`** — chính là *"Showing Top N of M"*.

| Route | Vai trò | Tương đương Enterpret |
|---|---|---|
| `#/dashboard` | Home, 5 câu hỏi | Home của org |
| `#/dashboard/<id>` | Bảng đã lưu theo vai | *PM View \| Learning Experience Team* |
| `#/quantify` | Nơi dựng chart | Quantify |
| `#/feed` | Đích drill-down | Feed |

#### Năm câu hỏi của Home

**Câu 1 — "Phản hồi đang tới từ đâu, và có thiếu gì không?"**

| Widget | Chart | Nguồn dữ liệu |
|---|---|---|
| Nguồn phản hồi | donut % + tổng | `sources[].vol` |
| Xu hướng phản hồi | stacked area 6 kỳ theo L1, có brush chọn khoảng | chuỗi kỳ theo L1 |
| Độ toàn vẹn nguồn | ma trận nguồn × nền tảng | `sources[].lagH` vs `CFG.source[id]`, `sources[].pf` (**thêm mới**), `signals[].st` |

**Câu 2 — "Khách đang nói về phần nào của hành trình?"**

Ba ranked bar chồng nhau, đúng bố cục L1 / L2 / L3 của Enterpret:

| Widget | Chiều | Số node |
|---|---|---|
| L1 Keywords | = 6 phase | 6 |
| L2 Keywords | = 20 nhóm sản phẩm / dịch vụ | 20 |
| L3 Keywords | = flow và bước | 32+ |

Bấm bar → `#/voc-journey` mở đúng node đó.

**Câu 3 — "Khách đang nói gì?"** — bốn khối theo Category, khớp `DATA.cats`:

| Tiêu đề khối | Category | Nội dung |
|---|---|---|
| Khách đang bức xúc về điều gì? | `complaint` | Themes (breakdown by Sub-Themes) |
| Khách muốn cải thiện điều gì? | `improvement` | như trên |
| Khách đang cần giúp ở đâu? | `help` | như trên |
| Khách thích điều gì? | `praise` | như trên |

Bấm bar → `#/feed` đã áp sẵn filter theme + category.

**Câu 4 — "Cái gì đang bất thường?"**

Chart `Bar + Trend + Anomaly`, Z-score ngưỡng lấy từ `CFG.anomaly.z` (mặc định 1,5). Hover một điểm
bất thường hiện Z-score và các record đẩy nó lên. Header ghi *"Đang hiện Top N bất thường của tháng
&lt;tháng&gt;"* theo đúng cách Enterpret trình bày.

**Ba làn, trong khi Enterpret chỉ có một** — đây là chỗ cố ý khác:

| Làn | Ví dụ có sẵn trong fixture |
|---|---|
| Bất thường trong **phản hồi** | theme volume vọt so với baseline |
| Bất thường trong **hành vi** | `ekyc_face_liveness_result` fail 1.180/ngày vs baseline ~490 (AF-03) |
| Bất thường của **chính nguồn dữ liệu** | Zalo OA về 0 suốt 8 ngày (AF-01) · in-app survey trễ SLA 12 giờ (AF-02) |

Làn thứ ba Enterpret không có vì họ không chịu trách nhiệm SLA nguồn. Nó chặn đúng cái bẫy
*"repeat contact giảm từ 24% xuống 16,2%"* trông như tin tốt trong khi thực chất là mất nguồn.

**Câu 5 — "Cái gì đáng xử lý trước?"** — Quantified Top 10, bốn cách xếp:

| Enterpret | CXM | Vì sao thay |
|---|---|---|
| Top 10 by Volume | Top 10 theo số phản hồi | giữ nguyên |
| Top 10 by Sum(LTV) | Top 10 theo **số khách giá trị cao bị ảnh hưởng** (`iss[].imp.hv`) | fixture không có field LTV; `cust[].tier` là enum 3 giá trị. Bịa số tiền là lặp lại đúng lỗi hệ số 41 ở `V.feed` |
| Top 10 by NPS Impact | Top 10 theo **tác động lên CES** (`m-ces`) | `sv-nps` đang `status:'paused'`, `state:'unknown'`. Xếp hạng theo NPS từ khảo sát đã dừng là vô nghĩa. Enterpret liệt CSAT/DSAT ngang hàng NPS nên vẫn nằm trong mô hình của họ |
| — | Top 10 theo **rủi ro pháp lý / tuân thủ** (`pri.reg`) | thành phần đã được chấm điểm sẵn; là thứ VoC tool cho app tiêu dùng không có tương đương |

#### `#/dashboard/<id>` — bảng đã lưu theo vai

Header đúng bố cục PM View: tên bảng · `Dashboard • <owner> • cập nhật <thời điểm>` · ô mô tả sửa được.
Thân là tập Quantify chart đã lọc theo scope của vai. Ba bảng `DATA.dash` hiện có được mở rộng thêm
`owner` và `updated`.

### B4. Bốn surface của nhóm Voice of Customer

| Route | Tên | Trả lời | Từ đâu ra |
|---|---|---|---|
| `#/feed` | Feed | Khách đang nói gì, từng câu một | `#/feed` sửa lại |
| `#/sources` | Nguồn & độ toàn vẹn | Phản hồi tới từ đâu, nền tảng nào đang thiếu | gộp `#/sources` + `#/surveys` |
| `#/topics` | Topic VoC | Khách nói về cái gì, topic nào xấu đi, topic nào trôi nghĩa | `#/taxonomy` đảo thứ tự ưu tiên |
| `#/voc-journey` | VoC theo hành trình | Tại điểm chạm nào khách nói gì | **mới** |

#### `#/feed`

Giữ nguyên điểm mạnh hiện có: verbatim + nút *"Vì sao phân loại thế này?"* mở rationale. Đây chính là
explainability mà Enterpret bán. Sửa ba thứ:

1. **Filter bước hành trình** đang liệt kê phẳng 6 bước pilot → đổi thành cascade **phase → nhóm → flow → bước**, khớp mô hình 6 phase.
2. **Thêm ba chiều lọc**: nền tảng (iOS · Android · Web · Server) · topic (theme/sub-theme) · sentiment.
3. **Bỏ hệ số nhân bịa.** `V.feed` dòng 1411 đang tính `DATA.ev.length * 41` — nhân 22 record thật thành 902. Không có căn cứ nào cho số 41. Thay bằng con số tổng hợp thật của kỳ, và ghi rõ Feed đang hiện **N mẫu đại diện** của tổng đó.

Nguyên tắc chung cho mọi drill-down: **aggregate và evidence là hai tập fixture khác nhau** —
widget đọc số tổng hợp (`tax[].n`, `sources[].vol`, `qt[].s`), Feed đọc mẫu verbatim (`DATA.ev`).
Mọi chỗ chuyển từ chart sang Feed phải nói rõ *"đang hiện N mẫu của X bản ghi"*, không giả vờ N = X.

#### `#/sources` — Nguồn & độ toàn vẹn

Giữ cột trả lời câu quan trọng nhất hiện có: *"nguồn này chết thì số nào sai"*. Thêm **chiều nền tảng**:

```
                      iOS   Android   Web   Server    Metric bị ảnh hưởng
Digital analytics      ●       ●        ●      –      Hoàn tất MTK
eKYC SDK               ●       ●        –      –      Liveness · Evidence OCR
In-app survey          ●       ●        ●      –      CES              ◐ trễ 12h > SLA
Store review           ●       ●        –      –      —
CS case                –       –        –      ●      Repeat contact
Ghi chú broker / RM         nhập tay                  —
Zalo OA inbox               webhook                   Repeat contact   ✕ ngừng 8 ngày

● đang nhận   ◐ trễ hơn SLA   ✕ ngừng gửi   ○ chưa instrument   – không áp dụng
```

Cần **thêm field `pf`** cho `DATA.sources`:

| Nguồn | `pf` |
|---|---|
| `src-ga` | `['ios','android','web']` |
| `src-ekyc` | `['ios','android']` |
| `src-case` | `['server']` |
| `src-survey` | `['ios','android','web']` |
| `src-store` | `['ios','android']` |
| `src-broker` | `[]` — nhập tay trong CRM |
| `src-zalo` | `[]` — webhook |

Ba chỉ số toàn vẹn, mỗi cái bắt một kiểu hỏng khác nhau:

| Chỉ số | Hỏng kiểu gì | Tính từ |
|---|---|---|
| Độ tươi | dữ liệu về muộn hơn thoả thuận | `lagH` vs `CFG.source[id]` |
| Độ phủ | có touchpoint không nguồn nào chạm tới | `signals[].st === 'gap' \| 'designed'` |
| Tính liên tục | nguồn đứt giữa chừng, số tụt giả tạo | volume = 0 nhiều ngày liên tiếp |

**Khảo sát gộp vào đây** thành khối *Nguồn chủ động* — 6 program với trigger, cooldown, response rate,
kết quả mới nhất. Lý do gộp: khảo sát cũng là một nguồn phản hồi, chỉ khác ở chỗ ta tự tạo ra nó thay
vì chờ khách nói. Đặt cạnh nhau mới thấy tỷ lệ **nghe thụ động vs hỏi chủ động**.

#### `#/topics` — Topic VoC

Đảo thứ tự ưu tiên của màn taxonomy hiện tại: **theme/sub-theme (VÌ SAO) lên trước**, cấu trúc
L1–L3 (CÁI GÌ) thu xuống khối phụ — vì L1–L3 nay gióng thẳng bản đồ hành trình nên không cần chiếm
chỗ chính.

Mỗi topic một dòng: volume · xu hướng 6 kỳ (`sparkline()` đã có) · % positive · category mix ·
nguồn đóng góp · điểm chạm tập trung · verbatim mẫu.

Giữ nguyên **cờ drift** — đây là *adaptive taxonomy* của Enterpret, fixture đã có ba loại thật:

| Cờ | Ví dụ trong fixture |
|---|---|
| `new-term` | 34 verbatim dùng cụm *"ứng dụng định danh quốc gia"* chưa gán vào node VNeID / NFC |
| `duplicate` | *"Không rõ trạng thái giao dịch"* trùng nghĩa một phần với *"Chờ quá lâu không phản hồi"* |
| `shifting` | 28% record mới của *"Phiên hết hạn giữa lúc thao tác"* thực ra nói về mất mạng |

Mỗi cờ kèm nút **gộp / tách / giữ nguyên** — có người quyết, không tự động.

#### `#/voc-journey` — VoC theo hành trình

Điều hướng **ba nhịp y hệt `#/atlas`**: rail 6 phase → chip nhóm sản phẩm → xương sống điểm chạm.
Dùng lại `prail` / `frail` / `fchips` đã có trong CSS.

Khác `#/atlas` ở một chỗ căn bản:

| `#/atlas` | `#/voc-journey` |
|---|---|
| đo **hành vi** | đo **tiếng nói** |
| `entered` / `completed` / `failed` | volume · sentiment · topic mix · category mix |

Đặt cạnh nhau mới lộ ra thứ không màn nào thấy một mình. Ví dụ có sẵn: **bước 05 Ký hợp đồng chỉ rơi
6%** — hành vi trông ổn — nhưng **295 phản hồi thuộc theme "Không rõ trạng thái giao dịch"** dồn vào
đúng bước đó. Hành vi im lặng, tiếng nói thì không.

Inspector từng điểm chạm, ba tab:

| Tab | Nội dung |
|---|---|
| Topic tại điểm chạm | theme/sub-theme xếp theo volume, kèm xu hướng |
| Verbatim | lời khách thật, đã masking, link sang `#/feed` đã lọc sẵn |
| Insight & đề xuất | từ `DATA.ins`, kèm điều kiện `hoEl` quyết định đã đủ tư cách đẩy thành CX issue chưa |

Phase và flow chưa có tín hiệu nào thì nói thẳng *"chưa có phản hồi gán vào đây"* — 31/32 flow sẽ ở
trạng thái này, đúng cách `#/atlas` đang xử lý flow chưa quan sát. Không bịa số.

### B5. Gióng lại taxonomy theo bản đồ

**Chỉ L1 bị ràng buộc 1–1 với phase. L2 và L3 KHÔNG bị ép 1–1 với nhóm và flow.**

Ép 1–1 là sai với cả Enterpret lẫn fixture đang có. Enterpret định nghĩa L1/L2/L3 là *product area →
feature → sub-feature* — một cách phân loại **điều khách nói tới**, không phải bản sao cấu trúc hành
trình. Kiểm lại `tax` hiện tại thì thấy rõ: `x-l2-ekyc` và `x-l2-sign` là phần *bên trong* một flow
(`f-open-2026`), không phải nhóm; `x-l2-hotl` và `x-l2-claim` cùng thuộc một nhóm `g-care`.
Ép 1–1 sẽ buộc phải xóa hoặc bẻ gãy phần lớn taxonomy đang dùng.

Thay bằng **trường `maps` tùy chọn** trên mỗi node — đây là thứ cho phép chiếu taxonomy lên hành trình
mà không ép hai cấu trúc phải trùng nhau:

```
L1        6 node, ràng buộc 1–1 với 6 phase          maps: 'p1'..'p6'   BẮT BUỘC
L2        node phân loại mức tính năng                maps: group | flow | null
L3        node phân loại mức chi tiết                 maps: flow | step | null
theme     ─┐
sub-theme  ┴─ VÌ SAO · hoàn toàn độc lập cấu trúc     không có maps
```

`maps` là thứ `#/voc-journey` và câu hỏi 2 của Home dùng để chiếu topic lên phase / nhóm / flow / bước.
`maps: null` là hợp lệ và có ý nghĩa: node đó chưa gắn được vào điểm chạm nào — chính là tín hiệu để
người quản trị taxonomy xử lý.

**Ba node L3 phải xử lý riêng, không được xóa nhầm:**

| Node | Vấn đề | Xử lý |
|---|---|---|
| `x-l3-va` "Nộp qua số VA" | §A5 bỏ khái niệm "VA" khỏi tên flow | đổi tên thành **"Nộp qua QR / cổng ngân hàng"**, `maps:'f-dep-4ch'` |
| `x-l3-reject` "Lệnh bị từ chối" | trỏ `f-reject` đã xóa ở §A4 | giữ node, `maps:'f-eq-sell'` — lệnh bị từ chối vẫn là chuyện khách nói tới, chỉ không còn là flow riêng |
| `x-l3-vneid` "Đối chiếu VNeID / NFC" | không phải step trong `DATA.steps`, là nhánh trong bước 02 | giữ nguyên, `maps:'s2'`. **Node này mang cờ `new-term`** — là 1 trong 3 ví dụ drift mà `#/topics` (§B4) dựa vào. Xóa nó là mất tính năng vừa đặc tả |

**Quy mô remap `ev`**: 20 trên 22 record có `x-l2-ekyc` hoặc `x-l2-sign` trong mảng `tax[]`. Vì hai node
này **được giữ nguyên** (chỉ thêm `maps`), phần lớn `ev[].tax` không phải sửa. Chỉ các record trỏ tới
ba node ở bảng trên cần rà lại. Đây là lý do chọn `maps` thay vì ép 1–1.

Hệ quả với L1 hiện tại:

| L1 cũ | `n` | L1 mới | `n` |
|---|---:|---|---:|
| — | — | **Tìm hiểu & Tiếp cận** (mới) | **240** ✱ |
| Mở tài khoản | 1.840 | Mở tài khoản | 1.840 |
| Dòng tiền | 1.120 | Dòng tiền | 1.120 |
| Giao dịch · Margin & Sức mua · Sản phẩm đầu tư | 960 · 410 · 530 | **Giao dịch** (gộp 3) | **1.900** |
| — | — | **Quản lý tài khoản** (mới) | **560** ✱ |
| Chăm sóc & khiếu nại · Rời bỏ & phục hồi | 720 · 180 | **Chăm sóc, khiếu nại & Churn** (gộp 2) | **900** |
| | **5.760** | | **6.560** |

✱ Hai node mới chưa có dữ liệu thật. Đặt số fixture demo để chart không rỗng, gắn nhãn *dữ liệu demo*
trên UI. Xem §D.3.

`n` của L2 và L3 được phân bổ sao cho Σ con = `n` cha, theo phép kiểm §C.6.

### B6. Cây điều hướng cuối cùng

```
Khám phá
  #/dashboard      Tổng quan            ← VoC Home, 5 câu hỏi
  #/quantify       Quantify
  #/assistant      Trợ lý
Hành trình
  #/atlas          Bản đồ hành trình
Voice of Customer                        ← đổi tên từ "Nền dữ liệu"
  #/feed           Feed                  ← chuyển từ Khám phá
  #/sources        Nguồn & độ toàn vẹn   ← gộp Nguồn tín hiệu + Khảo sát
  #/topics         Topic VoC             ← đổi tên từ Taxonomy
  #/voc-journey    VoC theo hành trình   ← MỚI
Xử lý
  #/work           Bảng xử lý            ← thêm chế độ xem "xếp theo ưu tiên"
Quản trị
  #/rules          Chỉ số & ngưỡng       ← thêm ngưỡng Z-score
  #/agents         Agent & cảnh báo      ← chuyển từ Nền dữ liệu
```

Route ẩn: `#/dashboard/<id>` · `#/issue/<id>`.
**11 nav item · 13 route.** Trước: **12 nav item · 13 route** (`DATA.nav` hiện có 12 mục sau khi 3 route
`issues` / `actions` / `outcomes` đã gộp thành `work`; con số "14 route" trong `AI-CONTEXT.md` là của bản
trước lần gộp đó và cần sửa).

Route bị bỏ: `#/health` (§A6) · `#/surveys` (gộp vào `#/sources`).

---

## C. THAY ĐỔI FIXTURE

| Object | Thay đổi |
|---|---|
| `phases` | 7 → 6, đổi `code` của phase cuối |
| `groups` | 14 → 20, sửa `phaseId` của `g-mgn` `g-adv` `g-bond` `g-fund` |
| `flows` | 20 → 32, sửa toàn bộ `src`, thêm mô tả đúng nguồn cho `f-dep-4ch` `f-dep-trace` `f-wd` |
| `steps` · `obs` · `touchpoints` · `signals` | **không đổi** — vẫn chỉ pilot có dữ liệu quan sát |
| `sources` | thêm field `pf` |
| `surveys` | không đổi dữ liệu, đổi chỗ hiển thị |
| `tax` | thêm trường `maps` theo §B5; L1 7 → 6 node; giữ nguyên L2/L3 và theme/sub-theme, chỉ đổi tên 1 node và gán lại `maps` cho 3 node |
| `qt` | **sửa series đã lệch, không chỉ mở rộng.** `q2 "Volume theo L1 domain"` đang có 7 bar gồm `Sản phẩm đầu tư` 530 và `Margin & Sức mua` 410 — hai L1 bị xóa ở §A1. Phải thành **6 bar**, `shown:6, total:6`, và note đổi từ *"Mở tài khoản chiếm 33%"* thành **28%** (1.840 / 6.560). Sau đó mới thêm tổ hợp mới cho Home |
| `dash` | thêm `owner` và `updated` |
| `ev` · `ins` · `iss` · `act` | không đổi cấu trúc; rà lại `ev[].tax` cho 3 node ở §B5 và `ev[].step` nếu ID thay đổi |
| `nav` · `meta` | theo §B6 |
| `tour` | **`tour[3]` đang là `{ r:'health' }`** — route bị xóa ở §A6, `tourGo()` sẽ gọi `go('health')` vào view không tồn tại và hỏng đúng bước 4/6 của bản trình bày trước lãnh đạo. Viết lại cả route lẫn lời dẫn: funnel đã bỏ, breakdown ưu tiên nay ở `#/work` |
| `CFG` | thêm `anomaly.z` (mặc định 1,5) |

### `validateFixture()` mở rộng

Giữ nguyên các phép kiểm hiện có (đặc biệt `sev+aff+jc+rep+tr+reg === total`), thêm:

1. Mọi `flow.groupId` tồn tại; mọi `group.phaseId` tồn tại.
2. `flow.verified === false` **⟺** `flow.src === '—'`.
3. Nếu `verified`, `src` phải khớp `Account Journey · Sơ đồ N` với **N ≤ 13**, hoặc
   `Money Journey · Sơ đồ N` với **N ≤ 7** — đây là phép kiểm ngăn đúng lỗi đã xảy ra.
4. `flow.observed === true` **⟹** flow có ≥ 1 step và mọi step có bản ghi `obs`.
5. Số node L1 = số phase, và mọi L1 có `maps` trỏ tới một phase tồn tại, không trùng nhau.
   Với L2 / L3: **không** ràng buộc số lượng; chỉ kiểm `maps` khi khác `null` thì phải trỏ tới một
   group / flow / step tồn tại. (Xem §B5 — ép 1–1 sẽ bẻ gãy phần lớn taxonomy đang dùng.)
6. Σ `n` của node con **≤** `n` của node cha — **không** bắt bằng nhau.
   Không phải bản ghi nào cũng được phân loại xuống tầng sâu nhất; Enterpret cũng vậy
   (*"Showing Top 10 of 60"*). Fixture hiện tại bắt buộc phải là `≤`: `x-l2-sign` có `n:340`
   nhưng node con duy nhất `x-l3-smca` chỉ có `n:280`. Bắt bằng nhau sẽ buộc bịa thêm node
   để lấp chỗ trống — đúng loại lỗi spec này đang đi sửa.
   **Cố ý KHÔNG kiểm** Σ `n` của L1 so với tổng `sources[].vol` — hai con số này chưa hòa giải được
   và việc hòa giải phụ thuộc quyết định mẫu số ở §D.1. Thêm phép kiểm đó bây giờ sẽ bắn banner đỏ
   trên mọi màn trước khi owner kịp chốt.
7. Mọi `dash[].q[]` tồn tại trong `qt`.
8. Mọi `qt[].shown` ≤ `qt[].total`.
9. Mọi `ev[].tax[]`, `ev[].src`, `ev[].step` trỏ tới ID tồn tại.

---

## D. QUYẾT ĐỊNH ĐỂ MỞ CHO OWNER

Owner đã chỉ đạo: *làm giống Enterpret, ưu tiên demo đủ tính năng trước; đây chưa phải toàn bộ dữ liệu
công ty nên con số cụ thể sẽ chốt sau.* Các mục dưới đây làm theo Enterpret trước, chốt sau:

1. **Mẫu số của "bản ghi phản hồi".** Hiện đếm cả 7 nguồn như Enterpret đếm mọi source → tổng
   **56.732**, trong đó 41.200 là Digital analytics và 12.800 là eKYC SDK. Hệ quả: donut sẽ ghi
   *72,6% phản hồi đến từ Digital analytics*. Nếu sau này chỉ muốn đếm nguồn có lời khách
   (CS case · khảo sát · store review · ghi chú RM · Zalo) thì tổng còn **2.732**. Đặt mẫu số trong
   **một hằng số duy nhất** để đổi một chỗ là mọi widget đổi theo.
2. **`tax[].n` ở L1** hiện tổng 5.760, chưa khớp cả 56.732 lẫn 2.732. Sẽ tính lại cho khớp mẫu số đã
   chọn, và `validateFixture()` §C.6 giữ cho nó không lệch lại.
3. **`n` cho hai L1 mới** — *Tìm hiểu & Tiếp cận* và *Quản lý tài khoản* — chưa có dữ liệu. Sẽ đặt số
   fixture demo để chart không rỗng, gắn nhãn dữ liệu demo.
4. **Ngưỡng Z-score** mặc định 1,5 theo Enterpret; owner chỉnh trong `#/rules`.
5. Các mục còn treo từ trước: **mã cam chính thức** theo brand guideline (đang dùng placeholder
   `#D9531E`) và **giá trị mặc định của ngưỡng** trong `CFG_DEFAULT`.

---

## E. ĐIỀU KIỆN NGHIỆM THU

1. `validateFixture()` trả rỗng; không banner đỏ trên mọi route.
2. Không console error / warning trên toàn bộ 13 route (Node harness + Chrome DevTools, như lần verify 28/07).
3. **Không `src` nào trỏ tới sơ đồ không tồn tại** — phép kiểm §C.3 chạy được và bắt được lỗi khi cố tình đặt sai.
4. 32 flow render đúng; 31 flow chưa quan sát hiện khối *"Chưa có dữ liệu quan sát"*, không hiện số bịa.
5. Pilot Mở tài khoản giữ nguyên hành vi: 6 bước × 3 tab, trạng thái suy ra khớp fixture
   (`ok watch crit ok watch ok`), đổi ngưỡng ở `#/rules` làm bước 02 chuyển `crit`.
6. `#/dashboard` render đủ 5 câu hỏi; mọi widget có đủ 4 phần header (tiêu đề · khoảng thời gian ·
   *Đang hiện Top N trên M* · nhãn trục).
7. Mọi chart bấm được và dẫn tới đúng đích drill-down đã ghi ở §B3.
8. `#/voc-journey` điều hướng được cả 6 phase; phase không có tín hiệu hiện thông báo rỗng đúng cách.
9. Friction queue xuất hiện trong `#/work` với breakdown 6 thành phần ưu tiên còn nguyên.
10. `#/health` và `#/surveys` không còn trong nav; gõ hash cũ không làm vỡ router.
11. **Guided tour chạy hết 6 bước không rơi vào route rỗng** — `tourGo()` là điều hướng lập trình,
    không phải gõ hash, nên tiêu chí 10 không phủ. Bước 4 hiện trỏ `#/health`.
12. `#/quantify` dựng được chart từ mọi tổ hợp Show me × Metric × Chart hợp lệ (§F), không chỉ 8 tổ
    hợp cứng; tổ hợp không có dữ liệu hiện thông báo rỗng thay vì chart trống.

---

## F. RANH GIỚI PHẠM VI

### Quantify: có query builder, nhưng trên tập hữu hạn

Ba tín hiệu trong bản hiện tại đang chỉ ba hướng khác nhau — chốt ở đây một lần:

- `V.quantify` ghi *"cố ý không làm query engine tự do, để không tạo kỳ vọng sai về năng lực"*
- `DATA.qt` có đúng 8 tổ hợp hardcode
- §B1 mô tả Quantify như query 4 phần của Enterpret

**Quyết định: làm builder thật, nhưng mọi ô là dropdown trên tập giá trị liệt kê sẵn.**
Không nhập tự do, không join tùy ý, không tính toán phái sinh.

| Ô | Tập giá trị **đã build** | Để vòng sau |
|---|---|---|
| Show me | 11 chiều: L1 · L2 · L3 · Theme · Sub-theme · Nguồn · Category · Sentiment · Nền tảng · Segment · Value tier | — |
| Metric | **Count · Percentage** | Mean · CSAT · Tác động lên CES · Sum(khách high-value) — bốn cái này cần grain theo từng response, fixture tổng hợp chưa đủ |
| Chart | **Bar · Donut** trong builder | Bar+Trend+Anomaly · Line · Cohort — có trong saved Quantify (`q5`–`q8`, `q15`) nhưng **không dựng động được**, vì chuỗi thời gian không suy ra được từ số tổng hợp |
| Time | 3 kỳ trong `DATA.periods`, lấy từ bộ lọc kỳ toàn cục | Since · Between |
| Compare | nằm trong 4 saved Quantify dạng chuỗi | dựng động |

Builder hiện có **11 × 2 × 2 = 44 tổ hợp**, đã verify render được toàn bộ.
Bảng *Quantified Top* trên Home đọc `imp.hv` · `imp.csat` · `pri.reg` trực tiếp từ `DATA.iss`,
không đi qua builder — nên bốn metric ở cột "để vòng sau" **không chặn** tính năng nào đang có.

> ⚠️ **Ghi đè quyết định cũ có chủ ý.** Câu *"cố ý không làm query engine tự do"* trong `V.quantify`
> phải được gỡ. Lý do gốc — sợ tạo kỳ vọng sai — vẫn được tôn trọng bằng cách khóa mọi ô thành dropdown
> hữu hạn: người xem thấy ngay đâu là giới hạn, thay vì gặp ô nhập trống rồi tưởng gõ gì cũng chạy.
> Tổ hợp không có dữ liệu phải hiện thông báo rỗng nói rõ vì sao, không vẽ chart trống.

### Không làm

- **Context graph đầy đủ** của Enterpret (nối user ↔ account ↔ product ↔ outcome) — cần identity thật, prototype không có backend.
- **AI phân loại thật** — mọi rationale `why` vẫn là văn bản viết sẵn; giữ nguyên banner *"nội dung demo theo kịch bản"*.
- **Dựng lại timeline từng khách** — quyết định cũ vẫn hiệu lực, đó là việc của CRM / Customer 360.
- **Persist cấu hình** — không có backend; refresh về mặc định, có ghi rõ trên UI.
