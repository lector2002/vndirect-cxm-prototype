# Ideal data model — cái app cần để tính đủ, và cái nó đang có

Status: **SỐNG.** Cập nhật mỗi lần một hàm tính đụng phải chỗ thiếu.
Date: 14/08/2026 · cập nhật 18/08/2026 (thêm §6 — bản vẽ schema gửi đi)

Đây là **một danh sách duy nhất**. Trước file này, nhu cầu dữ liệu nằm rải ở ba chỗ —
`module-i-signal-registry-charter.md` §10 (6 mục, đã gửi), `adr-001` §6, `adr-002` §7/§8/§16. Từ nay
tất cả gom về đây; ba chỗ kia giữ nguyên phần lập luận, phần *"xin cái gì"* thì trỏ sang file này.

Quy ước: **không khai schema trong `web/` cho dữ liệu chưa có.** Chỗ của nó là bảng dưới đây, không
phải một `type` mồ côi (tiền lệ `anomalyX`, `config.ts:15-20`). Khi dữ liệu về thì khai cùng lúc với
chỗ tiêu thụ.

---

## 1. Trạng thái hôm nay: điểm ưu tiên tính được mấy phần bảy

`pri.total = Σ w[k] · norm[k](x[k])` — bảy khoá (ADR-002 §11). Đo được hôm nay:

| Khoá | Tên | Tính được? | Chặn bởi |
|---|---|---|---|
| `sev` | Mức nghiêm trọng | **✅ có** | — (nhãn người chấm + bảng tra trong code) |
| `hv` | Khách giá trị cao | **✅ có** | — (`issue.cust[]` × `cfg.hv`) |
| `jc` | Mức quan trọng của bước | ⬜ chờ **owner** | 30 ô `cfg.step.jc` chưa điền |
| `reg` | Rủi ro pháp lý | ⬜ chờ **owner** | 30 ô `cfg.step.reg` chưa điền |
| `aff` | Số khách ảnh hưởng | 🔴 chờ **owner + data** | map điểm gãy→giá trị điểm đo (owner) **và** mục **A** dưới đây (data) |
| `tr` | Xu hướng | 🔴 chờ **data** | mục **B** |
| `rep` | Liên hệ lặp lại | 🔴 chờ **bên case** | mục **C** |

⇒ Hôm nay **tối đa 2/7** — bốn điểm gãy đạt 2/7 (`sev`+`hv`), hai điểm gãy CXI-024/CXI-028 chỉ
**1/7** vì `cust: []` nên `hv` cũng chưa tính được. Owner điền xong `jc`+`reg` thì **4/7**.
Đủ **7/7** cần cả ba mục A · B · C.

**Hệ quả phải nhìn thẳng:** ADR-002 §19 chỉ xếp hạng điểm gãy **đủ 7/7**, nên tới khi A · B · C về
thì khối trên của `#/work` **rỗng** và cả sáu điểm gãy nằm ở khối *"chưa đủ dữ liệu để xếp"*. Đó là
trạng thái đúng theo §14/§19, không phải hồi quy — nhưng nó cũng có nghĩa là **`rep` treo vô hạn thì
`#/work` không bao giờ xếp được hạng nào**. Nếu bên case trả lời "không nối được", ADR-002 §7 đã
hẹn sẵn: cân nhắc **bỏ `rep` khỏi công thức**, lúc đó "đủ" thành 6/6.

---

## 2. Ba mục MỚI phải xin — sinh từ ADR-002

### A. Số **KHÁCH ĐỘC LẬP** bắn mỗi giá trị điểm đo, theo kỳ

```
sigCustomers = { sig, val, period, customers }     -- period hạt NGÀY
```

`customers` = **COUNT(DISTINCT customer_id)**, không phải số lượt bắn.

**Vì sao `sigCounts` đang có KHÔNG dùng được:** nó đếm **lượt bắn** (`SigCount.n`,
`data/projectSignalCounts.ts:18`). Một khách trượt liveness ba lần đóng góp 3 vào `n`. ADR-002 §16
định nghĩa `aff` là **số khách**, và khi một điểm gãy ứng với nhiều giá trị thì `aff` là **HỢP** của
các tập khách — cộng `n` lại là đếm trùng đúng ở khoá nặng nhất của công thức.

**Không suy được từ dữ liệu đã cộng sẵn.** Hoặc giao bảng trên, hoặc giao lượt bắn thô có
`customer_id` để app tự `COUNT(DISTINCT)`. Đường thô đã được cấp cho `sigTrend` (ADR-001 §6, owner
13/08) — **nếu lượt bắn thô có `customer_id` thì mục A tự có, không phải xin thêm.**
👉 *Câu cần xác nhận với bên data: lượt bắn thô có mang `customer_id` không?*

Ràng buộc kèm: cùng ba trạng thái của `n` như ADR-001 §6 (có bắn · đo-được-0 · chưa đo). Kỳ chưa đo
**vắng mặt**, không phải 0.

### B. `obsTrend` — số ca mỗi bước theo kỳ

```
obsTrend = { step, period, entered, completed, failed }   -- period hạt NGÀY
```

`Obs` hôm nay chỉ có **một ảnh chụp**, không có trục thời gian, nên `tr` (xu hướng) không có gì để
so. **Không** thêm khoá kỳ vào `Obs` — cùng lý do ADR-001 §6 không thêm vào `SigCount`.

Hạt ngày, cộng lên cho hạt hiển thị. Thước đọc **kỳ đầu ĐO ĐƯỢC → kỳ ĐỦ gần nhất** (ADR-002 §8);
kỳ cuối luôn chưa đủ nên không được tính vào, nếu không mọi điểm gãy đọc thành *"đang đỡ dần"*.

### C. Khoá nối **case ↔ bước hành trình** (hoặc ↔ lý do thất bại)

Câu cho bên hệ thống case: *"case có gắn được với BƯỚC hành trình hoặc với lý do thất bại cụ thể
không, gắn bằng trường nào?"*

Có khoá ⇒ `rep` (liên hệ lặp lại của **nhóm khách gặp đúng điểm gãy này**) thành khoá đo được.
Không có ⇒ `rep` ở lại *chưa tính được* vĩnh viễn và phải bàn bỏ khỏi công thức (§7).

**Bác lối tắt:** lấy `m-repeat` toàn cục gán cho từng điểm gãy. Đó là tỉ lệ repeat của TOÀN BỘ
khách, không phải của nhóm gặp điểm gãy này — cùng lỗi hình dạng với §4 và §16.

---

## 3. Mục đã xin, vẫn đang chờ — ảnh hưởng tới điểm ưu tiên

| Mục | Nguồn yêu cầu | Chặn cái gì ở đây |
|---|---|---|
| **Bảng D** — mốc *"áp dụng từ bản build nào"* của mỗi điểm đo | module-i §10 · ADR-001 §6 | Không có nó thì không phân biệt được *chưa cắm* với *đã cắm nhưng im*. Cấm suy bằng `MIN(fire.at)` |
| **Mốc số liệu `asOf`** | module-i §10 | Cửa sổ đọc `tr` và `aff` cần biết "kỳ đủ gần nhất" là kỳ nào |
| **Mã lý do rớt mỗi ca thất bại** | module-i §10 · QĐ 2 | Là đường thứ hai để đo `aff` nếu mục A không về — nhưng vẫn là **lượt**, không phải **khách** |

Các mục còn lại của module-i §10 (dòng event thô, manifest giao hàng, bản đồ nguồn↔chỉ số, số đếm
giá trị độc lập, tách trễ pipeline) **không** chặn điểm ưu tiên. Giữ nguyên ở charter đó.

---

## 4. Việc của OWNER, không phải của bên data

Ba thứ dưới đây không ai giao được — chúng là phán đoán, không phải số đo. Chúng nằm trong `cfg`,
sửa trên `#/rules`, và khối *"chưa đủ dữ liệu để xếp"* ở `#/work` chính là danh sách việc này.

| Việc | Chỗ khai | Lượng |
|---|---|---|
| Mức quan trọng của từng bước | `cfg.step.jc[stepId]` | 30 bước |
| Rủi ro pháp lý của từng bước | `cfg.step.reg[stepId]` | 30 bước |
| Điểm gãy này ứng với giá trị nào của điểm đo | `issue.sigMap` | 6 điểm gãy hiện có |

Thêm hai thứ đã có mặc định, sửa được bất cứ lúc nào: **trọng số bảy khoá** (`cfg.pri.w`, cộng lại
100) và **mốc neo** (`cfg.pri.anchor`) — nhóm 6 của `#/rules`; **định nghĩa "khách giá trị cao"**
(`cfg.hv`).

---

## 5. Cái KHÔNG xin

- **Điểm ưu tiên đã tính sẵn từ pipeline.** ADR-002 §1: trọng số phải nằm trong `cfg` để owner sửa
  được trên màn. Pipeline giao **số đo**, app chiếu thành điểm.
- **`sigTrend` như một bảng.** Đường thô lưu lâu dài đã được cấp (owner 13/08) ⇒ nó là một **truy
  vấn**, không phải đơn hàng. Ràng buộc SQL: LEFT JOIN xương lịch để trạng thái *đo-được-0* có mặt.
- **Số ca thật mỗi bước từ hệ lõi.** Đã bỏ 07/08 khi owner chốt coi pipeline là một nguồn ghi.
- **Điểm CES theo từng điểm gãy** — chưa xin, vì chưa biết có tồn tại. Câu hỏi cho CX Insight còn
  đang treo (ADR-002 §20); mặc định là CES **không** ở trong công thức.
---

## 6. Bản vẽ schema — 18/08, verify xong thì gửi bên data

§1–§5 là *đòi hỏi*; mục này vẽ chúng thành *bảng–cột* để bên data trả lời được "làm được / làm
khác / không có". Luật đầu file giữ nguyên: **không khai `type` trong `web/` cho dữ liệu chưa có**
— bản vẽ nằm ở đây dạng chữ, khi dữ liệu về mới khai schema cùng lúc với chỗ tiêu thụ.
Bản để gửi đi (một trang, tự chứa): `output/ban-ve-schema-data.html`.

### 6.0 Điều khoản giao — áp cho MỌI bảng, không phải logic app

1. Mọi mốc thời gian là **timestamp máy sinh, ISO-8601 CÓ NĂM** (`2026-08-17T14:52:00+07:00`).
   Về là nghỉ hưu được hack năm-giả-2000 trong `sourceDaysMissing` và cả bẫy D6.
2. Hạt kỳ là **NGÀY** (`yyyy-MM-dd`); hạt hiển thị (tuần/tháng) app tự cộng lên.
3. Kỳ **chưa đo VẮNG MẶT**, không phải dòng 0 (ba trạng thái, ADR-001 §6).
4. **Giao 0 dòng vẫn phải có dòng manifest** — "giao rỗng" khác "không giao" (bậc `silent`).
5. `Signal.seen` người gõ ở lại **chỉ làm provenance hiển thị** — các mốc dưới đây là thứ thay nó
   trong mọi phép tính.

### 6.1 Tám khối

**T1 · `signal_registry`** — 1 dòng / điểm đo (Bảng D + nối nguồn)

| Cột | Kiểu | Nghĩa |
|---|---|---|
| `sig_id` | PK | khớp `Signal.id` của app |
| `screen` · `route` · `element` | text | tên screen kỹ thuật · route/deeplink · id/selector của element phát event |
| `build_from` | text | áp dụng từ bản build nào |
| `instrumented_at` | date, null được | mốc cắm đo — biên trái xương lịch (`Signal.instAt`). **CẤM suy bằng `MIN(fired_at)`** |
| `src_id` | FK → T2 | nguồn CHỞ điểm đo — mở khoá Missing/Stopped trên `#/signals` (18/08: 30/30 đang `null`) |

**T2 · `source_registry`** — 1 dòng / nguồn thật (thay bản tạm 7 nguồn; giải T2 charter)

| Cột | Kiểu | Nghĩa |
|---|---|---|
| `src_id` | PK | |
| `name` · `kind` | text · enum | `event\|case\|survey\|store-review\|broker-note\|chat` |
| `cadence_days` | int | nhịp giao chính thức → điền `cfg.source[id]`, thôi đoán |
| `metric_ids` | list | chỉ số nào ăn nguồn này |

**T3 · `event_fire_raw`** — 1 dòng / lượt bắn. **Đã được cấp 13/08 — đây là XÁC NHẬN hình dạng,
không phải xin mới.** Khớp `SigFire` app đang chờ (`sigId·val·custKey·pf·at`) + 2 cột mốc.

| Cột | Kiểu | Nghĩa |
|---|---|---|
| `event_id` | PK | khoá chống trùng (ô *trùng lặp*) |
| `sig_id` · `val` | FK · text | `val` cho ô *giá trị lạ*: `DISTINCT val` độc lập với bản khai `Signal.values` |
| `customer_id` | text, null được | **❓Q1** — quyết mục A |
| `pf` | text | nền tảng của chính lượt bắn (`base:'fire'`) |
| `fired_at` | timestamp | mốc phát sinh (phía nguồn) |
| `received_at` | timestamp | mốc pipeline nhận — cặp với `fired_at` = tách trễ-nguồn/trễ-pipeline + ô *đến muộn* |

Từ T3 app tự truy vấn, không xin thêm bảng: `sigTrend` (LEFT JOIN xương lịch chặn bởi
`instrumented_at`↔`asOf`), lưu lượng cửa sổ 7 ngày (D5), mồ côi tham chiếu, và mục A nếu Q1 = có.
Mốc thấy cuối RIÊNG từng điểm đo (charter §10c, `lastRecordAt`) cũng thành truy vấn —
`MAX(fired_at)` theo `sig_id` — KHÁC bẫy `MIN(fired_at)`: mốc thấy cuối là dữ kiện máy QUAN SÁT
được, còn mốc cắm đo là dữ kiện KHAI, im lặng không suy ra nó được.

**T4 · `step_obs_daily`** — 1 dòng / bước / ngày (mục B): `step_id` · `period_day` · `entered` ·
`completed` · `failed`. Nuôi `tr`; thước đọc *kỳ đầu đo được → kỳ ĐỦ gần nhất* (ADR-002 §8).

**T5 · `step_fail_reason_daily`** — 1 dòng / bước / ngày / mã lý do: `step_id` · `period_day` ·
`reason_code` · `n_cases`. Là tử số mà `obs.cov` hứa mà không có (QĐ 2); đường dự phòng cho `aff`
(vẫn là LƯỢT, không phải KHÁCH). T4+T5 nhận dạng cộng sẵn hạt ngày; nếu bên data thấy giao mức ca
thô (`case_id·step_id·outcome·reason_code·occurred_at`) rẻ hơn thì nhận — hai bảng trên thành truy vấn.

**T6 · `delivery_manifest`** — 1 dòng / nguồn / ngày: `src_id` · `period_day` · `rows_sent` ·
`rows_loaded` · `rows_failed` · `delivered_at`. Là chỗ `sourceHealth`/`sourceDaysMissing` đọc mốc
máy thật (thay `Source.last` người gõ); dòng *Missing N days / Stopped* trên `#/signals` đếm từ
đây; mất mát phía pipeline hiện hình.

**T7 · `asof_watermark`** — 1 dòng / lần chạy pipeline: `data_date` (ngày dữ liệu tính đến →
`data.asOf`) · `run_at`. Mọi phép "thiếu mấy ngày" so với `data_date`, không so với `now`
(charter §12).

**T8 · snapshot NAV/tier cuối ngày** — KHÔNG dựng mới, chỉ **XÁC NHẬN có sẵn** (❓Q2):
`customer_id` · `period_day` · `nav_vnd` (GIÁ TRỊ THÔ, không lưu nhãn nhóm) · `tier`, giữ ≥ 12
tháng. Lối (b) ADR-001 §8.

### 6.2 Ba câu hỏi mở — mỗi câu một người trả lời

| # | Hỏi ai | Câu | Có → | Không → |
|---|---|---|---|---|
| Q1 | data | lượt bắn thô có mang `customer_id` không? | mục A tự có, không xin gì thêm | xin bảng cộng sẵn `sig_customers_daily` (`sig_id·val·period_day·customers = COUNT(DISTINCT customer_id)`) |
| Q2 | data | bảng NAV/tier cuối ngày có sẵn không, giữ đủ 12 tháng, có `tier` theo ngày? | T8 = 0 công dựng | bật ghi snapshot ĐÚNG HAI TRƯỜNG `nav_vnd`+`tier` từ hôm đó (trigger §8) |
| Q3 | bên case (KHÔNG phải data) | case gắn được với bước hành trình / mã lý do thất bại bằng trường nào? | `rep` đo được | bàn bỏ `rep` khỏi công thức — "đủ" thành 6/6 (§7 ADR-002) |

### 6.3 Bảng đối chiếu để verify — mục xin → cột → chỗ tiêu thụ ĐANG TỒN TẠI

| Mục xin (nguồn) | Nằm ở | Ai tiêu thụ hôm nay |
|---|---|---|
| Bảng D (charter §10) | T1 | `projectSigTrend` xương lịch; phân biệt *chưa cắm* / *cắm mà im* |
| Nối điểm đo↔nguồn (18/08) | T1.`src_id` | `signalFeedHealth` → cột Last seen + badge Source feed |
| Bản đồ nguồn↔chỉ số (§10) | T2 | thay bản tạm 7 nguồn; đóng T2 charter |
| Mốc thấy cuối thật (§10 · D6) | T6.`delivered_at`/`period_day` | `sourceDaysMissing`/`sourceHealth` |
| Mốc số liệu `asOf` (§10) | T7.`data_date` | `data.asOf`; `feedStatusText` đếm *Missing N days* |
| Manifest giao hàng (§10) | T6.`rows_*` | tách `silent` khỏi `down`; ô manifest tầng ② |
| Dòng event thô (§10) | T3 | `sigTrend`; *giá trị lạ*; *trùng lặp*; *mồ côi*; *đến muộn* |
| Mục A — khách độc lập | T3.`customer_id` (Q1) | `pri.aff` |
| Mục B — `obsTrend` | T4 | `pri.tr` |
| Mã lý do rớt (§10 · QĐ 2) | T5.`reason_code` | thay quyền `obs.cov` |
| Mục C — khoá case | Q3 | `pri.rep` |
| Tách trễ pipeline/nguồn (§12.2) | T3.`fired_at` vs `received_at` | màn Nguồn dữ liệu (khi dựng lại) |
| Lưu lượng theo cửa sổ (§12.2 · D5) | truy vấn trên T3 | *"điểm đo còn chạy không"* |
| NAV/tier lịch sử (ADR-001 §8) | T8 (Q2) | chart tầng dưới chia nhóm đúng lịch sử |

Tự kiểm hai chiều: mọi cột ở 6.1 đều có tên người tiêu thụ trong bảng này (không cột nào xin
"cho chắc"); mọi mục §1–§3 + charter §10 đều rơi vào ≥1 ô; và không mục nào của §5 *"cái KHÔNG
xin"* lọt vào (không điểm ưu tiên tính sẵn, không bảng `sigTrend`, không số hệ lõi, không CES).
