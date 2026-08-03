# Sprint 1 — Quantify thành trình quản lý chart

_Spec 2026-07-31. Nguồn quyết định: `docs/REDESIGN-PLAN-HANDOFF.md` + phiên grill hôm nay._
_File duy nhất bị sửa: `output/cxm-platform-prototype.html`. Verify: `node output/_harness.js`._

## Mục tiêu
Biến `#/quantify` từ builder có preview-nhưng-không-lưu-được thành **trình quản lý chart**:
tạo chart từ nguồn data có sẵn → **lưu** vào thư viện → **xóa** (có guard) → **quản lý** (xem/mở/đổi tên) thư viện chart đã có.

Phần "thả chart vào set dashboard" ĐÃ chạy sẵn trong `renderSet()` (nút ✎ Tùy chỉnh) — **KHÔNG đụng ở sprint này**.

## Quyết định đã khóa (không được đảo)
1. **Loại chart builder dựng được = Bar + Donut trên 11 chiều `DIMS`.** Chart chuỗi thời gian
   (`kind:'series'`: trend/cohort/anomaly) KHÔNG dựng động — fixture tổng hợp không có chuỗi thời
   gian, dựng động sẽ phải bịa số (vi phạm nguyên tắc không-bịa-data). Series charts vẫn hiện trong
   thư viện dạng curated, quản lý được (xem/đổi tên/xóa) nhưng builder không tạo chúng.
2. **Xóa chart đang được set dùng = CHẶN.** Nút xóa bị khóa, hiện "đang dùng ở N set" + tên set.
   Chỉ chart không set nào tham chiếu mới xóa được. Đây là guard bảo vệ `validateFixture()`.
3. **Store in-memory**: push thẳng vào mảng `DATA.qt` (mutate runtime). Refresh reset về fixture gốc
   — đúng pattern non-persist của prototype. **KHÔNG dùng localStorage** (tránh mô hình persist thứ hai).

## Mô hình dữ liệu một saved chart (loại `show`)
Đúng shape object `live` mà builder đang dựng, chỉ khác `id` thật:
```
{ id:'qu<timestamp36>', kind:'show', show:<DIMS key>, metric:'count'|'pct', chart:'rank'|'donut',
  name:<string user đặt, mặc định auto>, note:'' }
```
`validateFixture()` §17 (dòng ~1793) sẽ tự kiểm: `DIMS[show]`, `METRICS[metric]`, `CHARTS[chart]` phải tồn tại
→ mọi chart builder tạo ra đều hợp lệ. §1 (dòng ~1619) kiểm ID trùng toàn cục → id phải duy nhất.

## State thêm vào `ST.sel`
- `ST.sel.qDel` = id đang chờ xác nhận xóa (two-step inline confirm, KHÔNG dùng `confirm()` của browser).
- `ST.sel.qRen` = id đang đổi tên (hiện input inline).
- `ST.sel.qb` (đã có) = state builder. `ST.sel.quantify` (đã có) = id chart đang mở preview.

## Hàm mới (đặt cạnh `setQ`, ~dòng 4154)
| Hàm | Việc |
|---|---|
| `qUsedBy(id)` | Trả mảng `{id,name}` các set dùng id. Xét **CẢ HAI** nguồn: set mặc định `DATA.dash` (đứt → banner đỏ) VÀ set đã tùy chỉnh `ST.boards` (đứt → `renderSet` gọi `qWidget(undefined)` → THROW chết view). Dùng `ST.boards[d.id] || d.qs.map(q=>q.b)` như `curB()`. |
| `qSave()` | Đọc tên từ `document.getElementById('q-name')` (element có thể `null` trong harness → fallback auto-name từ `DIMS[show].label · METRICS[metric].label`). Dựng item từ `ST.sel.qb` (merge `QB_DEF`), id = `'qu'+Date.now().toString(36)`, đảm bảo duy nhất, `DATA.qt.push(item)`, `ST.sel.quantify=id`, `render()`. |
| `qDelAsk(id)` | `ST.sel.qDel=id; render()`. |
| `qDelCancel()` | `ST.sel.qDel=null; render()`. |
| `qDelete(id)` | Double-guard: nếu `qUsedBy(id).length` → return (không xóa). Ngược lại: `DATA.qt.splice(idx,1)`; nếu `ST.sel.quantify===id` thì clear; `ST.sel.qDel=null`; `render()`. |
| `qRenAsk(id)` | `ST.sel.qRen=id; render()`. |
| `qRenCancel()` | `ST.sel.qRen=null; render()`. |
| `qRenSave(id)` | Đọc tên mới từ `getElementById('q-ren')` (fallback: giữ nguyên nếu null/rỗng), gán `qt(id).name`, `ST.sel.qRen=null`, `render()`. |

**Bảo mật**: mọi `name` do người dùng nhập PHẢI qua `esc()` khi render (đã là quy ước; `qWidget` đã esc name).

## Redesign `V.quantify` (layout)
Giữ khung `split 320px | 1fr`, đọc/sửa được, dùng CSS/card/lst/itm sẵn có. Bỏ 3 nút placeholder chết
("Lưu thành Saved Item / Thêm vào bảng / Share" ở card "Lưu và chia sẻ").

- **Cột trái**
  - Card *Dựng chart*: giữ `pick(show)`, `pick(metric)`, `pick(chart=rank/donut)` + ghi chú khoảng thời gian.
  - Card *Lưu chart*: `<input id="q-name">` prefilled auto-name (uncontrolled, đọc lúc bấm — tránh re-render mất focus)
    + nút `Lưu vào thư viện` (`onclick="qSave()"`). Ghi chú ngắn: lưu in-memory, refresh reset.
- **Cột phải**
  - Preview LIVE của builder (`qWidget(live, {click})`) — giữ.
  - Card *Thư viện chart · N chart* (thay card "Đã lưu" cũ): list mọi `DATA.qt`. Mỗi dòng:
    badge loại (`BAR/DONUT/LINE/COHORT/ANOMALY`) · tên (`esc`) · chiều (`DIMS[show].label` hoặc `q.dim`) ·
    dòng "đang dùng ở N set: …" (từ `qUsedBy`). Actions:
    - `Mở` → `setSel('quantify', id)` (preview bên dưới).
    - `Đổi tên` → `qRenAsk(id)`; khi `ST.sel.qRen===id` thì thay tên bằng `<input id="q-ren">` + `Lưu`/`Hủy`.
    - `Xóa`: nếu `qUsedBy(id).length` → nút **disabled** + title "đang dùng ở N set, không xóa được".
      Nếu 0 và `ST.sel.qDel!==id` → nút `Xóa` gọi `qDelAsk(id)`. Nếu `ST.sel.qDel===id` → hiện
      "Xóa chart này?" + `Xác nhận`(`qDelete(id)`)/`Hủy`(`qDelCancel()`).
  - Nếu `ST.sel.quantify`: preview `qWidget(qt(ST.sel.quantify))` bên dưới.

Series charts (`kind:'series'`) trong thư viện: hiện badge loại đúng, **không có** đường dẫn "dựng lại từ builder";
vẫn cho Mở/Đổi tên/Xóa(guarded) như chart show.

## Harness — thêm khối test (trước §12 validateFixture, ~dòng 217)
Mục *"Quantify · quản lý chart"*:
1. `qSave` với `FIELDS['q-name']='Test chart X'` và `ST.sel.qb={show:'theme',metric:'count',chart:'rank'}`
   → `DATA.qt.length` +1; item mới có `kind:'show'`, id bắt đầu `qu`, name đúng.
2. `qUsedBy` một chart seed đang được set dùng (vd `'q14'`) → `.length > 0`.
3. `qUsedBy` chart vừa tạo → `.length === 0`.
4. `qDelete('q14')` (đang dùng) → `DATA.qt.length` KHÔNG đổi (guard chặn).
5. `qDelete(<id vừa tạo>)` → `DATA.qt.length` về gốc; `qt(<id>)` trả undefined.
6. `qRenSave` với `FIELDS['q-ren']='Tên mới'` trên một chart tạm rồi xóa lại (giữ DATA sạch).
7. **Sau khối này `validateFixture()` PHẢI trả rỗng** (§12 đã có sẽ tự bắt, nhưng khối này phải tự dọn DATA.qt về đúng 16 item gốc).

Ràng buộc harness sẵn có vẫn phải xanh: 44 tổ hợp builder `V.quantify()` ≥ 2000 ký tự; mọi route render OK;
`validateFixture()` rỗng ở §12; không chuỗi `undefined`/`NaN` trong HTML.

## Non-goals (đừng làm)
- KHÔNG sửa `renderSet()`, `DATA.dash`, các `@block`, hay logic ✎ Tùy chỉnh của overview (Sprint 2).
- KHÔNG dựng động series charts; KHÔNG bịa chuỗi thời gian.
- KHÔNG thêm localStorage / persist.
- KHÔNG đổi `DIMS`, `METRICS`, `CHARTS`, `qRun`, `qWidget`, `validateFixture` (trừ khi bắt buộc — nếu phải, dừng và báo).
- KHÔNG commit. Owner sẽ review + tự commit.

## Acceptance
- [ ] `node output/_harness.js` in `✓ Tất cả kiểm tra đạt`, exit 0.
- [ ] Tạo chart → Lưu → xuất hiện trong thư viện, mở preview đúng.
- [ ] Xóa chart không set dùng → biến mất; xóa chart đang dùng → bị chặn + báo set.
- [ ] Đổi tên chart → tên đổi ở thư viện và preview.
- [ ] Không banner đỏ trên mọi route sau mọi thao tác.
