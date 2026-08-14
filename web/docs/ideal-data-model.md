# Ideal data model — cái app cần để tính đủ, và cái nó đang có

Status: **SỐNG.** Cập nhật mỗi lần một hàm tính đụng phải chỗ thiếu.
Date: 14/08/2026

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
