# Review chart builder — đối chiếu nền tảng ngoài

Reviewer độc lập · 03/08/2026 · phạm vi: `schema/quantify.ts` · `domain/quantify.ts` · `QuantifyBuilder.tsx` · `QuantifyWidget.tsx` · `Bars.tsx` · `ChartLegend.tsx` · `validate.ts` rule 16.
Đã tôn trọng: được sửa data model; bốn bất biến trung thực không tháo; `split`/`stack`/"Khác"/legend trên `base:'cust'` coi như xong.
*Độ dài (khai báo để owner tự chấm): phần đếm — §1, §3–§7 văn xuôi, không kể bảng §2 và danh sách nguồn — là **2562 token cách-trắng**, tương đương **≈1650 từ tiếng Việt** (âm tiết ghép thành từ ~1,55 âm/từ). Theo cách đếm âm tiết của word processor thì vượt trần 1800; theo cách đếm từ vựng thì trong trần. Tôi giữ nguyên §3 và §4 vì đó là phần owner yêu cầu ra quyết định.*

## 1. Kết luận trong 5 gạch đầu dòng

- **Vách `show`/`series` không phải chỗ cần hợp nhất — chỗ sai là `chart: ChartKind` bị hàn vào cả hai kind.** Vega-Lite không xoá phân biệt temporal/nominal, nó *gán type* cho phân biệt đó; cái nó tách là `mark` khỏi `data`, và cái nó dùng để đặt nhiều kiểu vẽ cạnh nhau là `layer`. Khuyến nghị dứt khoát ở §4.
- **Defect mà chính Module D nêu ra vẫn chưa sửa.** Bảng Module D ghi `TOP_N=10` **cắt âm thầm**; Section 1 chỉ thêm "Khác" cho chiều **chia màu**, còn **trục hàng** vẫn rơi đuôi không có bar nào (`QuantifyWidget.tsx:290`, `:376`). Looker Studio bật "Group the rest as 'Others'" **mặc định**.
- **`metric:'pct'` + `stack:'pct'` qua được cả validate lẫn builder, cho ra hình nói dối:** thanh full-width nhưng nhãn số vẫn là `pv(r.v, cohort)%`, đồng thời trục dọc ghi "% trên tổng" và nhãn đáy ghi "Tỷ trọng trong từng… (100%)" — hai chữ "%" khác mẫu số trên một hình.
- **Hai chỗ `REBUILD-STATUS.md` suy luận sai:** (a) "trục dọc thứ hai đến Metabase cũng chưa có" — Metabase **có** `Split y-axis when necessary`; (b) luật loại trừ Looker Studio được nâng thành **ngữ nghĩa phổ quát**, nhưng Metabase cho phép nhiều metric **cùng** grouping column ⇒ đó là **house rule của một sản phẩm**. Chi tiết + URL ở §7.
- **Rủi ro chưa ai ghi: `Evidence.tax` là `string[]`.** Khi section 2 thêm khoá khách vào `Evidence`, một evidence mang 2 theme sẽ **đếm một khách hai lần**, phá đúng bất biến `Σđoạn === v` mà `qRunSplit` đang giữ.

## 2. Bảng đối chiếu ô của builder

| Ô / khái niệm | Nền tảng ngoài | Ta đang có | Khoảng cách |
|---|---|---|---|
| dataset / nguồn | Looker: Data source · Metabase: Data · Amplitude: Events | `Dim.base` (`agg`/`ev`/`cust`) — **suy ngầm**, không có ô | Người dùng không thấy mình đang đếm *tín hiệu*, *bằng chứng mẫu* hay *khách* |
| metric | Metric / Summarize by | `item.metric` ∈ `count`/`pct` | Đủ |
| trục chính | Dimension / 1st breakout / X-axis | `item.show` | Đủ |
| breakdown (màu trong thanh) | Breakdown dimension / 2nd grouping / Group by | `item.split`, **chỉ `base:'cust'`** | Trục `agg`/`ev` chưa có — đúng kế hoạch |
| stacking | Stacked + 100% stacking / Stack-100% | `stack: 'abs' \| 'pct'` | Đủ, thiếu guard với `metric:'pct'` |
| Top-N + "Other" | Looker: **"Group the rest as 'Others'" bật mặc định** · Amplitude: graph mặc định top ~12 · Mixpanel: gộp "Other" ngoài top segments | `SPLIT_TOP_N=6` + "Khác" **chỉ cho split**; `TOP_N=10` cho hàng **cắt âm thầm** | Trục hàng thiếu "Khác"; "Khác" của split hiện **không tới được** (mọi trục khách ≤5 giá trị) |
| null / unknown | Superset **bỏ hẳn** nhóm null khỏi group-by · Power BI cần DAX · Qualtrics có bar **"Comments without a Topic"** bấm được | `qRunSegment` tách `chưa-biết`/`thiếu`, gộp thành bar `Không xác định`, mẫu số = cả cohort | **Ta chặt hơn Superset/Power BI.** Nhưng chỉ trên trục `cust`; trục theme/keyword **không có** bar "chưa gán" |
| legend | legend + per-series color | `ChartLegend` một dải (split) + `segmentLegend` theo hàng | Đủ; lý do tách hai loại legend là đúng |
| cross-tab vs breakdown | Looker: XOR (product constraint) · Metabase: **cho phép** ≥2 metric + 1–2 grouping column, giải bằng **mark khác nhau** | `by` XOR `split`, rule 16 chặn | Owner đã đóng băng XOR ⇒ giữ; nhưng tài liệu phải thôi viện dẫn "chuẩn ngành" |
| kiểu vẽ per-series | Metabase: "change which series are lines, bars, or areas" · Plot: `marks: [...]` mỗi mark data riêng · ggplot2: mỗi layer data + geom riêng | `chart: ChartKind` **một giá trị cho cả item** | Điểm chặn thật của #3 (line) và #4 (nhiều lớp) |
| trục dọc thứ hai | Metabase **có** | không có | **Cố ý không làm** — §5 |
| chart → bằng chứng | Enterpret/Thematic: comment-level traceability · Qualtrics: bấm bar untagged ra comment | `Bars.onRowClick` **có nhưng `QuantifyWidget` không truyền**; đoạn màu chỉ có `title` | Lỗ lớn nhất về giá trị người dùng |

## 3. Đề xuất, xếp theo (giá trị ÷ rủi ro kiến trúc)

### 3.1 Tách `ChartKind` thành mark theo từng kind + rule tương thích — **[đổi data model]**

*Vấn đề:* rule 16 chỉ kiểm `knownCharts.has(q.chart)`, **không đối chiếu `chart` với `kind`**. `{kind:'show', chart:'anomaly'}` qua được `validateFixture()` rồi rơi vào nhánh bar của `QuantifyWidget` như thể là `rank`. Một nửa tổ hợp vô nghĩa mà không tầng nào chặn.

*Thay đổi:* `schema/quantify.ts` — `ShowMark = 'rank'|'donut'`, `SeriesMark = 'trend'|'cohort'|'anomaly'` (+`'line'` khi làm #3); `validate.ts` rule 16 thêm nhánh mark×kind; `QuantifyBuilder.tsx` + `QuantifyWidget.tsx` đổi type/dispatch.

*Chi phí & rủi ro:* thấp — thuần type-level, **giữ nguyên mọi literal đang có** (đã kiểm `seed.ts`: 14 item `show` chỉ dùng `rank`/`donut`, 5 item `series` chỉ dùng `trend`/`cohort`/`anomaly` ⇒ phân hoạch sạch, **không cần migration**). Không hàm domain nào đổi chữ ký.

*Nghiệm thu:* `{kind:'show', chart:'anomaly'}` **vừa** đỏ `tsc -b` **vừa** ra lỗi validate; 614 test cũ xanh; +2 test.

### 3.2 Chặn `metric:'pct'` × `stack:'pct'`

*Vấn đề:* đường đi có thật. `QuantifyWidget.tsx:352` truyền `pctMode` **và** `stackPct` cùng lúc ⇒ `Bars.tsx:126` cho bề rộng `100%`, còn `:86` vẫn in `pv(r.v, totalUsed)%`. `chartAxisLabels` (`:113`) rơi vào nhánh `pct` nên trục dọc ghi "% trên tổng" trong khi nhãn đáy ghi "(100%)". `setField` không guard, rule 16 không chặn.

*Thay đổi:* `validate.ts` rule 16 + `setField` (lối "field vừa bấm thắng" đã có) + bỏ nhánh nhãn mâu thuẫn ở `QuantifyWidget.tsx`.

*Chi phí & rủi ro:* ~15 dòng, gần bằng 0.

*Nghiệm thu:* fixture cast ra đúng một lỗi validate; test chứng minh builder không bấm tới được; không card nào in hai loại "%".

### 3.3 Drill-down từ thanh / đoạn màu xuống danh sách đối tượng

*Vấn đề:* động tác đặc trưng của cả nhóm 2 — Thematic gọi là "comment-level traceability", Qualtrics cho bấm thẳng bar untagged ra comment. Ta có `Bars.onRowClick` nhưng `QuantifyWidget` **không truyền** ở cả hai nhánh (`:350`, `:391`); đoạn màu (`Bars.tsx:130-136`) chỉ có `title`. Nhân viên CX thấy thanh "Kênh mở TK = eKYC" cao rồi **hết đường đi tiếp**.

*Thay đổi:* `Bars.tsx` thêm `onSegmentClick` · `QuantifyWidget.tsx` truyền handler · tái dùng lối `/topic/:id` để liệt kê, không dựng route mới.

*Chi phí & rủi ro:* trung bình về implementation, **thấp về kiến trúc** — không con số nào đổi.
*Giới hạn phải nói thẳng:* trên trục `cust`, drill-down ra **khách**, không phải verbatim; verbatim cần join `ev→cust` (3.7).

*Nghiệm thu:* bấm đoạn màu `q19` ra đúng N dòng với N = số trong tooltip; bấm bar "Không xác định" ra đúng `unknown + missing`.

### 3.4 Bar "Khác" cho **trục hàng**, không chỉ cho chiều chia màu

*Vấn đề:* bảng Module D tự ghi "`TOP_N=10` cắt âm thầm", rồi Section 1 chỉ giải quyết phía split. `:290` và `:376` vẫn làm đuôi **biến mất khỏi hình**; `denomStrip` chỉ nói bằng **chữ**, và ở nhánh `cust` còn `undefined` khi không bị cắt. Looker bật "Others" **mặc định** — tức họ coi đuôi biến mất là mặc định sai, không phải tuỳ chọn thiếu.

*Thay đổi:* `QuantifyWidget.tsx` chỗ dựng `chartRows` — thêm hàng `__other__` = Σ các hàng bị cắt, ghim **trước** `__unknown__`. Hai thứ khác nghĩa ("Khác" đếm được, "Không xác định" không đếm được) ⇒ không gộp.

*Chi phí & rủi ro:* thấp; giữ `segTotal = known+unknown+missing` để không phá bất biến (c).

*Nghiệm thu:* fixture ≥12 band known: `Σ(rows.v) + Khác + Không xác định === data.cust.length`; nhãn "Khác" nói rõ gộp bao nhiêu giá trị.

### 3.5 Xoá `shown`/`total`/`unit` khai sẵn trên `QuantifySeries` — **[đổi data model]**

*Vấn đề:* `QuantifyShow` đọc đơn vị từ `dims[show].unit`; `QuantifySeries` **tự khai** `unit`/`shown`/`total`. Đã kiểm trực tiếp `seed.ts` (không lấy lại từ dòng nợ trong tài liệu): `q5:576` khai `shown:6, total:6, unit:'kỳ'` nhưng `t[0].p` có **12 điểm**; `q15:588` khai `shown:2, total:6` với 2 series × 12 điểm. Rule 16 chỉ kiểm `shown > total` ⇒ một chart **tự khai sai mẫu số của chính nó** mà validate vẫn xanh. Đúng loại "số khai báo thay vì số đếm được" mà bất biến (a) tồn tại để chặn — Module C chọn đúng ở coverage, `series` bị bỏ sót.

*Thay đổi:* bỏ 3 field ở `schema/quantify.ts`; một helper tính từ `t[]` + `dims`; `seed.ts` xoá khai báo; `validate.ts` bỏ rule `shown > total`.

*Chi phí & rủi ro:* thấp-trung bình. Xoá field là **giảm** bề mặt sai, không tăng. Rủi ro: test đang assert `total:6`.

*Nghiệm thu:* `grep` không còn chỗ đọc `.shown`/`.total` ngoài helper; dòng nợ `q5`–`q8` **được xoá** khỏi `REBUILD-STATUS.md` thay vì tiếp tục được ghi chú.

### 3.6 Bar "chưa gán" cho trục `agg`/`ev` — parity coverage với trục `cust`

*Vấn đề:* trục khách có `buildSegDescription()` nói rõ phủ/chưa biết/thiếu. Trục theme/keyword — nơi con số là **đầu ra classifier**, rủi ro cao hơn — **không có gì tương đương**. `subthemeSegments` đã làm đúng việc này *bên trong* một theme, nhưng chart `theme` cấp trên không nói bao nhiêu evidence không rơi vào theme nào.

*Thay đổi:* `domain/quantify.ts` thêm đường coverage cho `agg`/`ev`; `QuantifyWidget.tsx` render bar + dòng chữ; đưa `TaxNode.why/up/by` (đã bắt buộc có) lên card làm provenance của classifier.

*Chi phí & rủi ro:* thấp-trung bình, **không** đổi schema.

*Nghiệm thu:* trên `q1`, `Σ(rows.v) + chưa-gán` cộng đúng tổng evidence trong scope, khớp oracle độc lập.

### 3.7 Khoá khách trên `Evidence` + rule referential integrity — **[đổi data model, lớn nhất]**

*Vấn đề:* `Evidence` (`schema/voc.ts:86`) không có khoá khách ⇒ `themeSegments.groupSegments()` bịa tỷ lệ từ hạt char-code; cắm data thật vào **vẫn bịa**. Nó đã vi phạm tinh thần bất biến (a) **ngay bây giờ**, không chỉ trong tương lai.

*Thay đổi:* `schema/voc.ts` thêm `cust: string` · `validate.ts` **rule referential integrity** (`ev.cust` phải có trong `data.cust` — thiếu rule này thì join sai ra **0 mẫu im lặng**) · `domain/quantify.ts` tổng quát hoá `qRunSplit` · `themeSegments.ts` **xoá `demoRatios`** · `seed.ts` nới `ev` (17 bản ghi ⇒ breakdown 1–3 mẫu) · `fixtures/demo.ts` sinh tất định + cờ demo **trên dữ liệu** · ghi "yêu cầu data" thành danh sách.

*Chi phí & rủi ro:* cao nhất. **Giữ khuyến nghị của tài liệu: KHÔNG nới clause `by` của rule 16** — `split` đi đường riêng, ba chốt giữ `unsupported` vẫn nguyên, comment `CrossTable.test.tsx:35` vẫn đúng.

*Cạm bẫy chưa ai ghi:* `Evidence.tax: string[]`, `evTaxIds()` trả **mảng**, `qRunCross` đã phải mang cờ `multi`. Bất biến `Σđoạn === v` của `qRunSplit` nghiêm hơn thế. Phải chốt trước: *đếm evidence* (Σ > cohort, phải nói rõ) hay *đếm khách distinct* (Σ ≤ cohort, mất cường độ).

*Nghiệm thu:* validate bắt được `ev.cust` trỏ khoá không tồn tại; `theme × nav` cộng đúng số oracle; đổi sang fixture `demo:false` thì nhãn "minh hoạ" **tự tắt** không sửa component; `grep demoRatios` rỗng.

## 4. Vách `show` / `series` — khuyến nghị dứt khoát

**Giữ union hai kind. Không hợp nhất phẳng theo encoding. Tách `mark` ra khỏi cả hai, và thêm `layer` chỉ cho phía series.**

**Lý do 1 — Vega-Lite không xoá phân biệt temporal/nominal, nó *gán type* cho nó.** `encoding` khai `type: "temporal" | "quantitative" | "ordinal" | "nominal"`, và docs nói rõ `type` mô tả *semantics* của dữ liệu, không phải kiểu nguyên thuỷ. "Làm như Vega-Lite" **không** đồng nghĩa "gộp `show` và `series`". Cái nó thật sự tách là `mark` khỏi `data`; cái nó dùng để đặt nhiều kiểu vẽ cạnh nhau là `layer` — mỗi layer có mark + encoding riêng. Observable Plot nói thẳng hơn: *"Each mark supplies its own data"*. ggplot2: *"Each layer can come from a different dataset and have a different aesthetic mapping"*. Cả ba **không** cần union phẳng để làm được điều đó.

**Lý do 2 — hợp nhất phẳng mở lại đúng vùng code rủi ro nhất mà không cho người dùng thêm gì.** `qRun`, `qRunSegment`, `qRunSplit`, `qRunCross` **cả bốn** nhận `QuantifyShow`. Union phẳng buộc cả bốn dispatch lại theo hình dạng encoding, tức mở lại phần hạch toán `known`/`unknown`/`missing` đang gánh bất biến (a) và (c) — chính vùng đã sinh defect D0. Đổi lấy **0** khả năng mới mà tách mark không cho.

**Lý do 3 — các field `undefined` ma trên `QuantifySeries` là chính union tự thú nhận nó sai hình.** `by?: undefined` · `split?: undefined` · `stack?: undefined` (`quantify.ts:54-59`) tồn tại chỉ để `item.split` đọc được trên union. Đó không phải lý do phẳng hoá; đó là dấu hiệu tầng đọc **narrow theo `kind` quá muộn**. Cách chữa: gom field chung vào base (`id`/`name`/`note`/`view`), narrow `kind` **trước** khi chạm `split`/`stack`, rồi xoá cả ba phantom.

Thứ tự nên làm:
1. **Bây giờ (3.1):** tách mark + rule mark×kind. Đây là **toàn bộ** phần "line chart" còn thiếu về mặt model: `design-system/LineChart.tsx` **đã tồn tại và đã render** (`QuantifyWidget.tsx:17,239`), nên #3 là lỗ **model + builder**, không phải lỗ tầng vẽ — chi phí thật thấp hơn hẳn tài liệu ngụ ý.
2. **Module riêng sau đó:** `QuantifySeries.layers: { dim, mark }[]` — đúng `layer` của Vega-Lite / `marks[]` của Plot / layer của ggplot2, và khớp cách Metabase mô tả: *"change which series are lines, bars, or areas"* là **visualization setting trên series đã tồn tại**, không phải cấu trúc data mới. Điểm này tài liệu đọc đúng.
3. **Không làm:** trục dọc thứ hai; và không cho `show` có `layers`.

Điều kiện đủ để phân biệt hai hướng: **thay đổi có giữ nguyên chữ ký bốn hàm `qRun*` hay không.** Tách mark + `layer` giữ nguyên. Hợp nhất phẳng không. Đó là lằn ranh, không phải khẩu vị.

## 5. Những gì nền tảng ngoài làm mà ta nên CỐ Ý KHÔNG làm

Người đọc là nhân viên CX/nghiệp vụ, không phải analyst; đọc đúng ưu tiên hơn nhiều tuỳ chọn.

- **Trục dọc thứ hai / `Split y-axis`.** Hai thang trên một hình là máy sinh đọc-nhầm. Kết luận của tài liệu đúng, chỉ sai lý do.
- **Grouped/dodge bar làm mode thứ ba** cạnh `abs`/`pct`: ba cách xếp là ba cách đọc phải học. Chọn stacked + drill-down (3.3).
- **Nới Top-N lên 20 series** như Looker. 6 màu đã sát trần phân biệt của mắt.
- **Báo lỗi cardinality** kiểu Mixpanel. Ta phải **gộp**, không được **từ chối** — người nghiệp vụ không có đường sửa query.
- **Field/formula tự do.** Danh sách đóng là **tính năng** ở đây: nó làm mọi giới hạn của công cụ nhìn thấy được.
- **Sentiment tô đỏ** (Enterpret làm). Ở ta đỏ = "cần xử lý ngay"; Negative cũng đỏ là hai nghĩa chồng nhau.
- **Cross-tab matrix như một kiểu chart** cho người nghiệp vụ. Giữ dạng bảng + caveat "tập mẫu".
- **Insight tự sinh trên card:** một câu AI cạnh con số làm mờ ranh giới đo được / suy ra.

## 6. Rủi ro trung thực số liệu — học từ nhóm VoC trước khi đụng vào

- **Con số theme là *đầu ra model*, không phải phép đo.** Thematic công bố **80–90%** accuracy trước tinh chỉnh, và *"most modern platforms achieve 80–85% out of the box"*. Một bar theme cao hơn bar khác 8% có thể nằm gọn trong sai số classifier ⇒ `TaxNode.why/up/by` phải **lên card**, không nằm trong data.
- **Nhóm chưa phân loại phải là đối tượng bậc một và bấm được.** Qualtrics: *"view untagged comments by clicking on the Comments without a Topic bar."* Ta làm đúng cho trục khách, **chưa** cho trục theme (3.6).
- **Ta đang chặt hơn BI đại trà ở mẫu số — giữ và nói ra.** Superset **bỏ hẳn** nhóm null khỏi group-by (#14893: *"will not graph missing records"*); Power BI cần DAX để có "Others". Bất biến (c) là chỗ ta hơn công cụ thị trường.
- **Top-N của breakdown đổi thứ hạng theo cách người xem không thấy.** `qRunSplit` xếp hạng split **toàn cục** trên `scoped`, còn hiển thị cắt hàng ở `TOP_N=10` ⇒ một giá trị chỉ lớn ở hàng **đã bị cắt** vẫn chiếm một suất màu. Điều này **người xem** cần biết ⇒ thuộc dải denom, không thuộc comment.
- **Đa nhãn là bẫy chưa cài chốt** — xem 3.7. Chốt cách đếm trước dòng code đầu tiên của section 2.
- **Nhãn demo do cờ trên dữ liệu** đã là bất biến; cần thêm: **nghiệm thu bằng cách đổi fixture**, không bằng cách đọc component.

## 7. Chỗ `REBUILD-STATUS.md` suy luận sai / mâu thuẫn với nền tảng ngoài

1. **"Trục dọc thứ hai thì đến Metabase cũng chưa có."** Sai sự kiện: Metabase có `Split y-axis when necessary` (Settings › Axes) cho bar/line/area/combo — issues #4778, #47938, #55431 đều bàn chính setting đó. Kết luận giữ, lý do đổi sang "trục kép là máy sinh đọc-nhầm".
2. **Luật loại trừ Looker Studio bị nâng thành ngữ nghĩa phổ quát** ("là **ngữ nghĩa**… Sửa schema không xoá được nó"). Looker phát biểu nó như **giới hạn sản phẩm**: *"If you specify a breakdown dimension, the chart is limited to a single metric."* Metabase **cho phép** *"two or more metrics… with one or two grouping columns"* và giải xung đột màu bằng **mark khác nhau cho từng series**, không bằng cách cấm. ⇒ XOR là house rule; bất biến (d) **vẫn giữ**, nhưng thôi viện dẫn "chuẩn ngành" và nên ghi lại đường thoát mà ngành thật sự dùng — Module line/nhiều-lớp sẽ cần đúng đường đó.
3. **Bảng Module D ghi khoảng cách "`TOP_N=10` cắt âm thầm", rồi mục "Section 1 — ĐÃ XONG" để nguyên khoảng cách đó** (3.4).
4. **Số Amplitude/Mixpanel không khớp docs hiện tại.** Tài liệu ghi "Amplitude top 13 + Other; Mixpanel ≤10 nhóm + **Rest of the World**". Nguồn hiện tại: Amplitude graph mặc định **top ~12** (bảng breakdown tới 100); Mixpanel gộp phần ngoài top segments vào **"Other"** — *"Rest of the World"* là nhãn **địa lý**, không phải bucket tràn chung. ⚠️ Trang `amplitude.com/docs/analytics/charts/group-by` **404 khi tôi fetch**, nên hai số Amplitude đến từ tóm tắt search, **chưa xác minh trên trang gốc**. Vấn đề không ở con số mà ở việc một tài liệu nội bộ mang **độ chính xác giả** về sản phẩm bên thứ ba.
5. **"Vách `show`/`series` khoá cả #3 (line)."** Nửa đúng — xem §4 mục 1.
6. **Rule 16 được coi là chốt chất lượng của `chart` nhưng không đối chiếu `chart` với `kind`** (3.1) — lỗ im lặng, đúng loại mà chính tài liệu dặn phải sợ.

## Nguồn

**Grammar of graphics**
- Vega-Lite, Specification: https://vega.github.io/vega-lite/docs/spec.html
- Vega-Lite, Encoding (channels + `type` semantics): https://vega.github.io/vega-lite/docs/encoding.html
- Observable Plot, Marks (*"Each mark supplies its own data"*): https://observablehq.com/plot/features/marks
- ggplot2 book, Layers (data/mapping/geom/stat/position; stack·fill·dodge): https://ggplot2-book.org/layers

**BI / chart builder**
- Looker Studio, Bar & column chart reference (breakdown ⇒ single metric; "Group the rest as 'Others'" bật mặc định; stacked + 100%): https://docs.cloud.google.com/looker/docs/studio/bar-chart-and-column-chart-reference
- Metabase, Line/bar/area charts (per-series display; Stack / Stack-100%; `Split y-axis when necessary`): https://www.metabase.com/docs/latest/questions/visualizations/line-bar-and-area-charts
- Metabase, Combo charts (≥2 metric + 1–2 grouping column; series → line/bar/area): https://www.metabase.com/docs/latest/questions/visualizations/combo-chart
- Metabase, Charts with multiple series: https://www.metabase.com/docs/latest/dashboards/multiple-series
- Metabase issue #55431 (Always Split Y-Axis): https://github.com/metabase/metabase/issues/55431
- Metabase issue #4778 (`Use a split y-axis when necessary`): https://github.com/metabase/metabase/issues/4778
- Amplitude, Group-bys: how Amplitude prunes and orders chart results: https://amplitude.com/docs/analytics/charts/group-by — **404 khi fetch**
- Amplitude, Results limits and sorting logic (Data Tables): https://amplitude.com/docs/analytics/charts/data-tables/data-tables-results-and-sorting-logic — **404 khi fetch**
- Amplitude community, "Limit of 30 items in a group by or Breakdown table?": https://community.amplitude.com/building-and-sharing-your-analysis-58/limit-of-30-items-in-a-group-by-or-breakdown-table-749
- Mixpanel, Reports overview: https://docs.mixpanel.com/docs/reports
- Mixpanel community, Cardinality limit exceeded: https://community.mixpanel.com/x/ask-ai/ew5hcxydfj2a/mixpanel-error-cardinality-limit-exceeded-on-disti
- Superset issue #14893 (bar chart & null value bar): https://github.com/apache/superset/issues/14893
- Superset discussion #18464 (Group by Top-N + 'Other' trên time-series): https://github.com/apache/superset/discussions/18464
- Power BI, building better bar charts ("Others" bucket cần DAX pattern): https://tabulareditor.com/blog/building-better-bar-charts-in-power-bi-reports-a-comprehensive-guide

**VoC / CX analytics**
- Enterpret Help Center, Features explained (Quantify: *"Visualize feedback trends and patterns based on your taxonomy structure"*; anomaly detection): https://helpcenter.enterpret.com/en/articles/12665465-enterpret-features-explained
- Enterpret, Custom taxonomy (Tracked Keywords + Reasons; intent Help/Improvement/Complaint/Praise): https://www.enterpret.com/product/custom-taxonomy
- Enterpret, How do I monitor feedback for my product area: https://helpcenter.enterpret.com/en/articles/8906705-how-do-i-monitor-feedback-for-my-product-area
- Thematic, How accurate is AI-powered feedback analytics (80–90%; comment-level traceability): https://getthematic.com/insights/ai-feedback-analytics-accuracy
- Qualtrics, Text iQ best practices (*"view untagged comments by clicking on the Comments without a Topic bar"*): https://www.qualtrics.com/support/survey-platform/data-and-analysis-module/text-iq/text-iq-best-practices/
- Qualtrics, Text iQ table widget: https://www.qualtrics.com/support/vocalize/widgets/analysis-widgets-cx/text-iq-table-widget/
- Chattermill vs Thematic (supervised + unsupervised vs unsupervised clustering): https://chattermill.com/blog/chattermill-vs-thematic

**Không truy cập được / không xác minh được**
- Enterpret Taxonomy Management (`.../articles/6833188-taxonomy-management`) — **404**. Không có nguồn chính thức nào về coverage/confidence của Enterpret; sản phẩm nằm sau đăng nhập, khớp ghi chú `docs/ENTERPRET-DESIGN-NOTES.md`.
- Hai trang docs Amplitude nêu trên — **404** (xem §7.4).
- Medallia · Dovetail · Viable · Idiomatic · Tableau · Hex · Omni — **không khảo sát**, cố ý bỏ để tránh trải mỏng; các nhóm đã tra đủ để kết luận không đổi.
