# Module E Charter — Phân khúc khách CẤU HÌNH ĐƯỢC + section đầu của màn "Chỉ số & ngưỡng"

Status: **owner đã xác nhận trong chat 04/08** — xem mục "Xác nhận của owner" ngay dưới. Được giao worker.
Date: 04/08/2026

## Vì sao có module này

Owner (04/08): "tôi muốn user có thể customize setting về nav, độ tuổi,... segment khách hàng,...
trong phần ngưỡng và chỉ số".

Hôm nay ranh giới phân khúc **đóng cứng trong code**: union type NavBand/AgeBand/TenureBand
(data/schema/cxm.ts:120-123) + trọng số generator (data/fixtures/demo.ts). Không ai ngoài người sửa
code đổi được mốc 50tr, và không thêm được dải mới.

## Sáu quyết định (chọn qua hộp hỏi 04/08, owner xác nhận trong chat cùng ngày)

| # | Quyết định | Hệ quả |
|---|---|---|
| E-a | **Cfg.segment là source of truth** cho dải; union type NavBand/AgeBand/TenureBand **bỏ**, validate kiểm tra thành viên lúc runtime | Mất compile-time safety trên 3 type, đổi lấy MỘT nguồn duy nhất |
| E-b | **Customer lưu GIÁ TRỊ THÔ**, dải là derived lúc đọc | Đổi cut ⇒ mọi chart xếp lại NGAY, không migration, không nhãn cũ mắc lại |
| E-c | Nhãn dải **luôn sinh ra từ cut**, KHÔNG cho đặt tay | Nhãn không thể nói dối về cut — đây là lý do từ chối option "Cfg khai danh sách nhãn" |
| E-d | acq là **categorical**, control riêng (danh sách tên kênh), không phải cut | Không nhét vào cùng widget với 3 trục số |
| E-e | seg/tier **KHÔNG thuộc module này** | owner 04/08: "tier cũng sẽ có 1 module để customize" — tức tier CÓ trong kế hoạch, nhưng là module riêng. Cần chốt thứ tự ưu tiên rúle + khách không khớp rúle nào trước khi làm |
| E-f | Làm module này **TRƯỚC** theme→step + lát 2 | Lát 2 join trên thuộc tính khách nên phải đứng trên nền type đã ổn định |

Hai quyết định cùng nguồn (hộp hỏi, chờ xác nhận) nhưng thuộc module SAU, ghi lại để không mất:

- **Theme→step:** thêm field riêng `step?: string | null` trên node theme, admin gán. KHÔNG dùng lại
  `maps` — `maps` là khoá ngoại **đa hình không có type** (L3 x-l3-live→s3 là step, nhưng
  x-l3-va→f-dep-4ch là flow, L1→p1..p6 là phase); join lát 2 dựng trên nó sẽ âm thầm nhận flow id ở
  chỗ cần step id.
- **Bằng chứng ẩn danh:** sentinel **thứ ba** trong data/segment.ts; chart **LUÔN vẽ**, nhóm ẩn danh
  là một đoạn hiện rõ trong mẫu số, dòng dưới chart tách rõ ba loại. Refuse chỉ khi known=0.

## Xác nhận của owner (chat, 04/08)

Nguyên văn: *"cusstomer có từ data cần có đủ hết, nguồn trong setting sẽ là source of truth, acq là
danh sách tên đúng, tier cũng sẽ có 1 module để customize, ko sử dụng sol, note lại là dự án này sẽ
chỉ sử dụng sonnet làm worker"*.

Đối chiếu từng mệnh đề:

| Câu của owner | Chốt điều gì |
|---|---|
| "nguồn trong setting sẽ là source of truth" | **E-a** — Cfg trong màn setting là nguồn duy nhất của dải |
| "cusstomer có từ data cần có đủ hết" | **E-b** + một luật thêm: Customer phải mang **đủ** các field ĐẾN TỪ DATA. Giá trị thô (tài sản, tuổi, số tháng) là thứ đến từ data ⇒ phải có đủ; nhãn dải KHÔNG đến từ data (nó là thứ tính ra) ⇒ không lưu. Nói cách khác: bỏ 3 field nhãn không phải là "bớt field", mà là bỏ thứ không thuộc data |
| "acq là danh sách tên đúng" | **E-d** |
| "tier cũng sẽ có 1 module để customize" | **E-e** — tier ra khỏi module này, nhưng có module riêng về sau |

**E-c** (nhãn luôn sinh từ cut) và **E-f** (thứ tự làm) owner không nhắc riêng; E-c là hệ quả trực tiếp
của E-a (nếu setting là nguồn duy nhất thì nhãn không được là nguồn thứ hai), E-f giữ nguyên.

**Luật worker của dự án (owner 04/08):** "ko sử dụng sol" và "dự án này sẽ chỉ sử dụng sonnet làm
worker". Nên: KHÔNG dispatch SOL, KHÔNG dùng tầng DeepSeek/Terra. Mọi section giao bằng Agent tool
`model: sonnet` theo Worker Contract; phần cắt section và review section do Opus tự làm.

## Bốn phát hiện từ code hiện tại (đã đo, không suy đoán)

1. **dims.age/nav/tenure/acq có `rows: []`** (seed.ts:773-776) — danh sách dải KHÔNG nằm ở dims, tính
   runtime từ data.cust. Nên hôm nay dải chỉ ở 2 chỗ, không phải 3. Blast radius nhỏ hơn tưởng.
2. **`RowBuilder = (data: CxmData) => DimRow[]`** (domain/quantify.ts:107) — **không có cfg**. Derive
   dải cần cfg ⇒ đây là signature change thật, và ROW_BUILDERS đang được **export** kèm test đối chiếu
   1-1 với dims.
3. **Store giữ snapshot `cfg: Cfg` từ `repo.getCfg()`** (store/store.ts:15,58); mọi mutation đi qua
   repo rồi refresh(). Repo **chưa có** method ghi cfg. Tiền lệ action: setDemoMode (:81). Cảnh báo:
   refresh() có guard demoMode — khi tắt demo thì KHÔNG nạp lại data (:70-74).
4. **Route `rules` ("Chỉ số & ngưỡng") vẫn là Placeholder** (App.tsx:48), chưa có page. Nó KHÔNG phải
   `settings` (C5 — "Cấu hình hệ thống", đã có SettingsPage.tsx). Màn này phải dựng mới.

## Phạm vi — nói rõ cái KHÔNG làm

Cfg hiện có 6 nhóm: step, metric, source, data, anomaly, sub. Màn "Chỉ số & ngưỡng" đúng nghĩa sẽ chứa
cả 6. **Module này chỉ dựng nhóm thứ 7 — segment** — cộng vỏ màn tối thiểu. Sáu nhóm kia **để trống có
nhãn "chưa dựng"**, KHÔNG dựng control giả, KHÔNG dựng control đọc-được-mà-lưu-không-được. Lý do: owner
đặt hàng phần phân khúc; dựng 6 form còn lại là tự nới scope.

## Mô hình dữ liệu

### Cfg.segment (mới, trong data/schema/config.ts)

    export type CfgBandAxis = {
      /** Sàn của dải đầu. null => dải đầu là '<cut1' (nav, tenure). 18 => dải đầu là '18-24' (age). */
      min: number | null;
      /** Ranh giới, TĂNG DẦN, không trùng. n cut => n+1 dải. */
      cuts: number[];
      unit: 'đ' | 'năm' | 'tháng';
    };

    export type CfgSegment = {
      nav: CfgBandAxis;
      age: CfgBandAxis;
      tenure: CfgBandAxis;
      /** acq là categorical — danh sách tên kênh, không có cut. */
      acq: { values: string[] };
    };

Default (phải sinh lại ĐÚNG nhãn đang chạy cho nav và age):

    segment: {
      nav:    { min: null, cuts: [50e6, 200e6, 1e9, 5e9], unit: 'đ' },
      age:    { min: 18,   cuts: [25, 35, 50],            unit: 'năm' },
      tenure: { min: null, cuts: [6, 24, 60],             unit: 'tháng' },
      acq:    { values: ['banner', 'giới thiệu', 'chi nhánh', 'tự tìm', 'đối tác'] },
    }

Kiểm nhãn sinh ra so với hôm nay:

- nav → `<50tr` · `50-200tr` · `200tr-1tỷ` · `1-5tỷ` · `>5tỷ` — **khớp 5/5**
- age → `18-24` · `25-34` · `35-49` · `50+` — **khớp 4/4**
- tenure → `<6 tháng` · `6-24 tháng` · `2-5 năm` · `>5 năm` — **khớp 4/4**, với điều kiện formatter
  `tháng` tự đổi sang `năm` từ mốc 24 tháng, ĐÚNG cách formatter `đ` đã đổi `tr`→`tỷ` ở mốc 1e9. Đây
  vẫn là nhãn SINH RA từ cut (không vi phạm E-c) — chỉ là quy tắc format có hai bậc đơn vị. Nếu
  formatter chỉ có một bậc thì 2 nhãn cuối thành `24-60 tháng`/`>60 tháng` và phải sửa pin trong test;
  **chọn formatter hai bậc để không nhãn nào đổi.**

### Customer (data/schema/cxm.ts)

    // BỎ: nav, age, tenure (nhãn)      THÊM: 3 field giá trị thô
    navValue: number | SegUnknown;    // đồng. 0 = chưa có tài sản.
    ageYears: number | SegUnknown;
    tenureMonths: number | SegUnknown;
    acq: string | SegUnknown;         // đổi từ AcqChannel|SegUnknown

**Không giữ song song nhãn + giá trị thô.** Hai nguồn cho cùng một sự thật là đúng lỗi đã phải sửa hai
lần trong hai ngày (d64c2f8 hai writer cho split; fe03c0e type nói dối về nav).

Sentinel giữ nguyên luật đã chốt 04/08 (fe03c0e): navValue sentinel = **lỗi** (NAV đọc từ tài sản hiện
tại nên phải luôn có; sentinel chỉ xảy ra khi lời gọi lấy tài sản thất bại ⇒ đi sửa pipeline).
ageYears/tenureMonths sentinel = **hợp lệ**.

### data/bands.ts (mới, tầng data/)

    export function bandLabels(axis: CfgBandAxis): string[];
    export function bandOf(v: number | SegUnknown, axis: CfgBandAxis): string;  // sentinel → trả nguyên sentinel

Đặt ở `data/` (không phải `domain/`) vì **cả data/validate.ts lẫn domain/quantify.ts đều cần** — đúng
lý do data/segment.ts và data/metric-direction.ts đã đặt ở đó.

## Bảy feature + tiêu chí nghiệm thu

| # | Feature | Tiêu chí nghiệm thu (test phải ghim) |
|---|---|---|
| **E1** | data/bands.ts: sinh nhãn + xếp dải | bandLabels với default nav trả ĐÚNG 5 nhãn đang chạy; với age trả đúng 4; bandOf(0, nav) = `<50tr`; bandOf(50e6) = `50-200tr` (biên **dưới đóng, trên mở**); bandOf(UNKNOWN_YET) trả nguyên sentinel; thêm cut 1 vào nav ⇒ bandOf(0) = `0đ` và bandOf(1) = `<50tr` |
| **E2** | Cfg.segment + cfgDefault + validate cfg | cuts rỗng / không tăng dần / trùng nhau / min >= cuts[0] / unit lạ / acq.values rỗng hoặc trùng ⇒ **mỗi ca một lỗi có câu nói rõ sai gì**; cfgDefault hợp lệ |
| **E3** | Customer đổi 3 field + generator sinh giá trị thô | demoData vẫn **tất định** (gọi 2 lần bằng nhau); mọi navValue >= 0; MỌI khách chưa có tài sản có navValue === 0 **đúng bằng 0**, không phải số nhỏ ngẫu nhiên; ageYears thuộc [18,100]; band sinh ra từ giá trị thô **trùng khớp từng con số đang pin hôm nay** (xem "Điểm chặn RNG") |
| **E4** | validate.ts đổi luật 19 + luật mới cho giá trị thô | navValue sentinel ⇒ lỗi (giữ nguyên câu đã có); ageYears ngoài [18,120] ⇒ lỗi; tenureMonths < 0 ⇒ lỗi; acq không thuộc cfg.segment.acq.values ⇒ lỗi; validateFixture(demoData, ...) = [] |
| **E5** | domain/quantify.ts: RowBuilder nhận cfg, derive dải | ROW_BUILDERS vẫn đối chiếu 1-1 với dims (test cũ phải còn xanh); q18 trên demoData ra **`<50tr` 247 · 50-200tr 18 · 200tr-1tỷ 17 · 1-5tỷ 10 · >5tỷ 8**; đổi cfg.segment.nav.cuts thêm cut 1 ⇒ **cùng một data** tách `<50tr` 247 thành hai dải `0đ` + `<50tr` mà TỔNG hai dải vẫn đúng 247 (con số từng dải: worker ĐO rồi pin, KHÔNG lấy từ charter — charter chưa đo cái này), KHÔNG sửa data |
| **E6** | Repo + store: ghi được cfg.segment | Repo có method ghi cfg; store action đổi cut ⇒ store.cfg.segment đổi VÀ chart đọc lại số mới; đổi cut khi demoMode tắt **không** làm data sống lại (guard refresh ở store.ts:70-74) |
| **E7** | Màn #/rules — section "Phân khúc khách" | Route rules không còn Placeholder; 3 trục số có control thêm/xoá/sửa cut, 1 control danh sách kênh; **xem trước nhãn sinh ra + số khách mỗi dải NGAY khi sửa, trước khi lưu**; cut sai (không tăng dần, trùng) bị chặn kèm câu nói rõ; 6 nhóm cfg còn lại hiện nhãn "chưa dựng"; rules **KHÔNG** vào TIMEFRAME_ROUTES (màn cấu hình, không có chart theo kỳ) |

## Điểm chặn RNG — quyết định quan trọng nhất của module

Sinh một giá trị thô trong dải cần **một draw RNG mới**. Nếu lấy từ rng đang dùng thì **toàn bộ chuỗi
lệch**, kéo theo seg/age/tenure/acq của cả 293 khách đổi giá trị ⇒ phải pin lại số ở ~15 file test, và
mất luôn khả năng đối chiếu "trước/sau" khi review.

**Bắt buộc:** dùng một **RNG THỨ HAI, seed độc lập**, CHỈ để chọn giá trị trong dải. Chuỗi rng cũ giữ
nguyên từng draw ⇒ dải mà mỗi khách rơi vào **không đổi** ⇒ mọi số đang pin hôm nay còn đúng (vd
`Độ tuổi` trên 62 khách `tự tìm`: 25-34: 19 · 50+: 6 · 18-24: 14 · 35-49: 9 · Không xác định: 14).
Đây là điều biến module này từ "pin lại 15 file test" thành "pin lại 1 chỗ".

Ngoại lệ **không** dùng RNG: khách chưa có tài sản ⇒ navValue = 0 **đúng bằng 0** (không phải số nhỏ
ngẫu nhiên), vì đó là điều làm cut `0đ` của owner có tác dụng thật.

## Test seam

| Seam | Vì sao chọn |
|---|---|
| data/bands.ts (unit, thuần) | Toàn bộ luật sinh nhãn + xếp dải nằm ở một hàm không cần render, không cần fixture — chỗ rẻ nhất và chặt nhất |
| validateFixture(...) | Đã nhận cfg sẵn (validate.ts), nên luật cfg và luật giá trị thô kiểm ở cùng một cửa |
| ROW_BUILDERS (đã export) | Bẫy sẵn có: thiếu một bên dims/builder thì qRun trả rỗng **im lặng** |
| qRunSegment / qRunSplit trên demoData | Ghim SỐ THẬT, không tính lại bằng chính hàm đang test — giữ đúng cách QuantifyWidget.splitToggle.test.tsx đang làm |
| Store action (RTL, không cần màn) | Tách "ghi được cfg" khỏi "màn vẽ đúng", nên E6 xanh/đỏ độc lập với E7 |

## Bất biến toàn dự án — module này KHÔNG được tháo

1. Không bịa tỷ lệ trong domain/.
2. `chưa-biết` khác `thiếu` — không gộp. (Sentinel thứ ba `ẩn danh` là module SAU, không làm ở đây.)
3. Mẫu số **không được âm thầm rứt** nhóm không xác định (lỗi D0).
4. Thứ tự tầng data → store → domain → design-system → features. bands.ts ở data/ ⇒ domain/ được
   import; features/ KHÔNG được tự tính dải.
5. Nhãn dải sinh từ cut, **không đặt tay** (E-c) — nhãn không được nói khác cut.

## Blocking edges (chỉ để gating; writer vẫn tuần tự)

    E1 --+--> E3 --> E4 --+
         |                |
         +--> E5 ---------+--> E6 --> E7
    E2 --+

E1 (bands) và E2 (cfg) là nền — không có chúng thì E3/E5 không có gì để derive. E7 (màn) đứng cuối vì
nó chỉ là vỏ cho E6.

## Boundary interface phải chạm (đã kiểm, không đoán)

| Chỗ | Đổi gì |
|---|---|
| data/schema/config.ts | thêm CfgBandAxis, CfgSegment, Cfg.segment |
| data/schema/cxm.ts:120-123,128-144 | bỏ 3 union band; Customer đổi 3 field + acq |
| data/schema/index.ts | export lại (bỏ 3 type, thêm 2) |
| data/bands.ts | file mới |
| data/validate.ts:466 | luật 19 + luật giá trị thô + luật cfg.segment |
| data/fixtures/seed.ts | 7 khách thật → giá trị thô; cfgDefault thêm segment |
| data/fixtures/demo.ts | RNG thứ hai; sinh giá trị thô |
| domain/quantify.ts:107,113-135 | RowBuilder + CUST_FIELD nhận cfg |
| data/mock-repository.ts | method ghi cfg |
| store/store.ts:15,58,81 | action ghi cfg.segment (theo tiền lệ setDemoMode), giữ guard refresh |
| App.tsx:48,160 | route rules → page thật, KHÔNG thêm vào TIMEFRAME_ROUTES |
| features/rules/RulesPage.tsx | file mới |

## Yêu cầu riêng cho reviewer độc lập

1. **Đừng tin bảng "nhãn sinh ra khớp hôm nay"** — tự chạy bandLabels với default và so với 5 nhãn nav
   + 4 nhãn age đang chạy. Nếu lệch một ký tự (`1tỷ` vs `1 tỷ`) thì mọi số pin đều sai.
2. **Kiểm chuỗi RNG thật sự không lệch:** so band count của age/tenure/acq trước và sau. Lệch một con
   số nghĩa là RNG thứ hai đã bị lấy từ chuỗi cũ.
3. **Kiểm navValue === 0** cho nhóm chưa có tài sản — 0 < x < 50tr cũng làm mọi test hiện tại xanh
   nhưng làm cut `0đ` của owner **vô dụng**, đúng loại lỗi test không bắt được.
4. **Kiểm E5 bằng cách đổi cfg, không đổi data** — nếu phải sinh lại fixture mới thấy dải đổi thì quyết
   định E-b đã bị làm sai và cả module mất ý nghĩa.
5. **Kiểm nhãn không đặt tay được** — tìm mọi đường trong cfg/UI cho phép ghi nhãn tay. Có = vi phạm E-c.
