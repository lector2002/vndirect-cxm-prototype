# Spec — Card layout kiểu Enterpret (S2.6)

Status: chốt (owner 01/08, từ ảnh sản phẩm Enterpret Home của Duolingo-com)
Phạm vi: **cả app** — Overview + Quantify. Đảo quyết định P1.2a-fix ("mọi điều khiển vào `Card.footer`"); owner biết và chấp nhận phải làm lại phần card Quantify của P1.4.

## Nguồn tham chiếu
- Ảnh Enterpret Home owner cung cấp 01/08 (không có file ảnh trong repo — anatomy chép lại ở dưới).
- Quyết định đầy đủ: `C:\Users\Admin\.claude\plans\crystalline-giggling-sprout.md` mục "⚠ QUYẾT ĐỊNH OWNER 01/08 — Overview + Card".
- Prototype `output/cxm-platform-prototype.html`: `wHead()` 1858 (denom cũ), `rankBars()` 1866-1883, `rangeToggle()` 3817.

## Anatomy card Enterpret (đọc từ ảnh, trên xuống dưới)
1. **Header**: tiêu đề nhỏ (~13px, màu link/teal, không bold nặng) bên trái; bên phải **icon phễu** + **`⋮`**.
2. **Subtitle**: kỳ TUYỆT ĐỐI — `For last 3 months (Dec 01, 2025 → Mar 12, 2026)`. → ta ĐÃ có (`Card.subtitle`).
3. **Dải xám full-width** (nền `surface-2`, chữ nhỏ): `Showing Top 6 of 6 Sources`; khi bị cắt thì thêm link phải `View All →`.
4. **Thân chart**: nền trắng, padding thoáng.
5. **Nhãn trục Y quay dọc** sát lề trái: `# Feedback Records`, `Level 1 Keywords`.
6. **Nhãn giá trị bar nằm BÊN PHẢI bar**, viết tắt K: `41.76K`, `16.43K`.
7. Donut: **tâm số đầy đủ** `165,672` + nhãn nhỏ `Feedback Records`; legend phải dạng `32.9% Reddit`. → ta ĐÃ có.
8. Line chart: trục Y **số đầy đủ** (`18000/13500/9000/4500/0`); stepper `← Time-Range (Dec 01, 2025 → Today) →` dưới chart; legend dưới + `Others (+5)`.
9. Card: viền rất nhạt, bo ~8px, shadow gần như không, trên nền xám nhạt.

## Quy tắc bắt buộc

### R1 · Điều khiển lên header
- `Card` thêm slot `actions?: ReactNode` ở góc phải header. `footer?` GIỮ API (không xóa) nhưng **không còn là chỗ chứa điều khiển**.
- Icon-only PHẢI có `title` + `aria-label` — icon phễu/`⋮` kém rõ hơn nút có chữ; đây là điều kiện nhận, không phải tuỳ chọn.
- `⋮` mở menu: Xem chi tiết · Sửa (chỉ `kind==='show'`) · Nhân bản · Xóa.

### R2 · Dải denom thay chip footer
- `Card` thêm slot `denomStrip?: ReactNode` render NGAY dưới header, full-width, nền `surface-2`, chữ ~11.5px.
- Nội dung chuẩn: `Hiện Top <N> / <M> <đơn vị>`; khi `base==='agg'` thêm mẫu số ` · trên tổng <nf(fx(scopeTotal))> tín hiệu`.
- Câu "95% là event hành vi (Digital analytics + eKYC SDK), không phải lời khách" → **tooltip** trên dải, không in dài dòng ra card.
- `CountFilter` (chip "Hiện N/M ▾" ở footer) → thành control mở từ **icon phễu ở header**. Dải xám là phần HIỂN THỊ, phễu là phần ĐỔI.
- **BẤT BIẾN KHÔNG ĐƯỢC MẤT**: với `base==='ev'` phải vẫn nói rõ đây là TẬP MẪU ("đang hiện N mẫu bằng chứng") — aggregate và evidence là 2 tập khác nhau. Dải denom là chỗ mới cho câu đó; mất câu này là fail.

### R3 · Nhãn trục — ⚠ BẢN GỐC SAI, ĐÃ SỬA 02/08

> **R3 bản gốc sai và S2.6a đã code theo cái sai đó.** Nó ghi "trục dọc chỉ mang ĐƠN VỊ" cho mọi loại chart. Ảnh Enterpret thứ hai (02/08, xem `docs/ENTERPRET-DESIGN-NOTES.md` §5) cho thấy họ gắn nhãn theo **đúng thứ mà trục đó mã hoá**, chứ không phải "dọc thì là đơn vị". Owner chốt sửa: **D1 = a** (02/08).

Quy tắc đúng — **nhãn theo thứ mà trục đó mã hoá**:

| Loại chart | Trục dọc (quay dọc, lề trái) | Đáy, căn giữa |
|---|---|---|
| **Bar ngang** | **tên CHIỀU** — `dim.label`, vd `Theme · vì sao` | **ĐƠN VỊ ĐO** — `BASE_AXIS[dim.base]`, vd `Số tín hiệu khách hàng` |
| **Line / anomaly** | **ĐƠN VỊ ĐO** — vd `Số tín hiệu khách hàng theo kỳ` | (trục X là thời gian → tự hiển nhiên, không cần nhãn) |

Lý do: bar ngang có trục dọc = danh mục, trục ngang = số đo. Đặt đơn vị đo lên trục danh mục là nói sai trục đó đo cái gì. Enterpret: trục dọc `Level 2 Keywords`, đáy `Count of Feedback Records`.

- Trình bày: `writing-mode: vertical-rl` + rotate (hoặc tương đương), sát lề trái thân chart, `ink-3`, ~11.5px. Nhãn đáy căn giữa, cùng cỡ, cùng màu.
- Mẫu số KHÔNG nằm ở nhãn trục nào — nó ở dải denom (R2).
- `AxisLabel` (1 dòng dưới chart) vẫn dùng cho **caveat/ghi chú**, không phải nhãn trục (vd "vòng tròn = vượt ngưỡng Z-score", caveat cross-tab "tập mẫu").

### R4 · Số viết tắt K, bên phải bar
- Thêm `nfK(n)` vào `web/src/design-system/format.ts`: `n >= 1000` → chia 1000, **1 chữ số thập phân, dấu phẩy vi-VN**, bỏ `,0` khi tròn, hậu tố `K`; `n < 1000` → số nguyên như cũ.
  Ví dụ: `41200 → "41,2K"` · `16430 → "16,4K"` · `230720 → "230,7K"` · `1000 → "1K"` · `999 → "999"`.
- **CHỈ áp cho nhãn giá trị của `Bars`.** Giữ `nf` số đầy đủ ở: tâm donut, trục Y line/anomaly chart, mọi ô `DataTable`/`CrossTable`, `Stat`, mọi câu văn trong `Note`.
- Đổi grid `Bars`: hiện là `label | value | bar`, đổi thành `label | bar | value` (giá trị sang phải).

## File dự kiến phải sửa
| File | Việc |
|---|---|
| `design-system/Card.tsx` | thêm `actions?`, `denomStrip?`; header nhẹ hơn (tiêu đề nhỏ hơn, bớt bold) |
| `design-system/Bars.tsx` | giá trị sang phải + `nfK`; nhận nhãn trục dọc |
| `design-system/format.ts` | thêm `nfK` |
| `design-system/QuantifyWidget.tsx` | dựng `denomStrip` + trục dọc; không truyền điều khiển xuống footer |
| `features/quantify/CountFilter.tsx` | thành popover mở từ icon phễu |
| `features/quantify/QuantifyLibrary.tsx` · `QuantifyDetail.tsx` | thao tác vào `⋮` header thay hàng nút footer; **giữ Modal xóa 2 nhánh + guard `usedBy`** |
| `features/overview/blocks/*` | card dùng slot mới (denom strip, trục dọc) |

## Giữ nguyên, không được phá
- Modal xóa giữa màn (P1.4c) + 2 nhánh CHẶN/TỰ DO + guard `quantifyUsedBy` union 2 đường.
- Nút "Sửa" chỉ hiện với `kind==='show'` (series không sửa được).
- Kỳ tuyệt đối ở `Card.subtitle`; donut tâm số lớn + legend `%`.
- Design token VND (cam `#d9531e` chỉ cho tương tác/định danh, xám ấm); **không thêm palette**.
- `validateFixture()` rỗng sau mọi thao tác.

## Chưa chốt (KHÔNG làm trong S2.6 nếu owner không nói thêm)
- Stepper `← Time-Range (…) →` dưới line chart.
- Legend `Others (+5)` cho line/bars.

## Oracle / acceptance
1. `npx tsc -b` 0 lỗi · `npx vitest run` xanh 0 skip · `npm run build` xanh.
2. Test cũ assert chuỗi số hoặc vị trí nút → **sửa kỳ vọng, KHÔNG xóa test**. Nêu rõ test nào sửa và vì sao.
3. `nfK`: test bảng giá trị biên `999 / 1000 / 41200 / 230720` đúng như ví dụ R4.
4. `Bars`: test khẳng định giá trị nằm SAU bar trong thứ tự DOM, và bar `41200` hiện `41,2K`.
5. Donut center + ô bảng + `Stat` **vẫn số đầy đủ** — test khẳng định KHÔNG có hậu tố `K`.
6. `base==='ev'` vẫn hiện câu "mẫu bằng chứng" ở dải denom (test).
7. Icon phễu và `⋮` có `aria-label`; menu `⋮` của item `kind==='series'` KHÔNG có "Sửa".
8. Xóa chart đang được set dùng → vẫn ra Modal nhánh CHẶN kèm tên set.
