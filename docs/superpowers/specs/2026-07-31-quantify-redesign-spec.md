# Quantify — REDESIGN spec (query → 2 views, builder/manager + set composer)

> Status: **ĐÃ THỰC THI 31/07 trên prototype** — 7 section, `node output/_harness.js` xanh (16 chart, 4 màn con). 31/07 owner chốt chuyển sang **giai đoạn code thật (full tính năng)** → prototype này thành **tài liệu tham chiếu thiết kế** cho bản build thật, không còn là deliverable chờ duyệt. Sai khác spec↔prototype: §11. Kiến trúc/nguồn dữ liệu bản thật: đang grill.
> Date: 2026-07-31
> Thay thế: `2026-07-31-quantify-chart-manager-spec.md` (bản "chart library" — đã đập, giữ tham chiếu). Đọc kèm `docs/QUANTIFY-BRAINSTORM-HANDOFF.md`, `docs/REDESIGN-PLAN-HANDOFF.md`, `AI-CONTEXT.md`.
> Nguồn: brainstorm 31/07 với owner (6 quyết định qua grill) + phản biện advisor.

---

## 0. Một câu
Quantify là **xưởng tạo & quản lý**: mỗi item lưu là **một truy vấn** trên nguồn dữ liệu có sẵn, xem được ở **2 dạng (chart / bảng)**; item được **compose thành set** cho Overview — ngay trong Quantify.

---

## 1. Sáu quyết định đã chốt (grill 31/07)

| # | Quyết định | Chọn | Hệ quả chính |
|---|---|---|---|
| Q1 | Primitive Quantify tạo ra | **Truy vấn, 2 view (chart + bảng)** — thư viện chứa cả hai | Thêm field `view`; render path bảng; nhánh validate cho kind mới |
| Q2 | Sửa item đã lưu | **Nạp lại builder + Lưu đè + Nhân bản**, cảnh báo khi đang dùng | `quantifyCreate(id?)` kiêm edit; nút Sửa/Nhân bản; banner "N set sẽ đổi" |
| Q3 | Ghép nhiều chiều | **Ghép chéo trong mẫu `ev` + nhiều cột chỉ số**; chiều `agg`/`cust` khóa | Cross-tab gate theo capability `evAttr`; nhãn "N mẫu" |
| Q4 | Quan hệ với set/Overview | **Màn thứ 4 "Quản lý set"** trong Quantify; 2 tab cố định khóa; `ST.boards` dời về đây | ✎ Tùy chỉnh rời Overview → Quantify |
| Q5 | Tổ chức thư viện | **Lưới phẳng + nhóm theo nền & view** (chip); không folder/tag/phân trang | Thêm chip theo `base` + theo `view`; render full chart, không thumbnail |
| Q7 | Vai trò tab | **Thuần tạo & quản lý** — bấm bar = chọn/highlight tại chỗ, KHÔNG drill sang tab khác | Gỡ `blkClick` drill-away khỏi thư viện; drill khám phá thuộc Topics/VoC/Atlas |

> Q6 (lớp nguồn) — **owner CHƯA CHỐT**, xem §7. Q "nhân bản" (seed #2) = hệ quả của Q2, không hỏi riêng.

---

## 2. Mô hình dữ liệu

### 2.1 Item Quantify (`DATA.qt[]`)
Giữ shape hiện tại, **thêm/đổi**:

```
{ id, kind:'show'|'series', name, note,
  metric:'count'|'pct',
  view:'chart'|'table',        // MỚI — view mặc định; người xem lật được tại chỗ
  chart:'rank'|'donut'|...,    // kiểu chart khi view==='chart'
  // kind:'show' (builder tạo):
  show:'<dimId>',              // chiều hàng
  by:'<dimId>'|null,           // MỚI — chiều cột (cross-tab). null = 1 chiều
  // kind:'series' (curated): giữ nguyên t/dim/unit/shown/total
}
```
- `view` mặc định do builder chọn; **library card & detail có toggle `▮ Chart / ▤ Bảng`** lật ngay, không đổi item đã lưu (toggle là trạng thái xem, ở `ST.sel.qViewOverride[id]`, lazy, non-persist).
- `by` chỉ set được khi cả `show` và `by` đều **ev-crossable** (§3). null với item 1 chiều.

### 2.2 DIMS = registry nguồn duy nhất (§7)
Mọi surface (picker builder, chip nhóm, cross-tab gate, nhãn placeholder) đọc **một** bảng `DIMS`. Thêm 2 field:

```
<dimId>: {
  label, base:'agg'|'ev'|'cust', rows:()=>[...],   // giữ nguyên
  evAttr:(e)=> id | [id,...]                        // MỚI — CHỈ có trên chiều ghép chéo được từ 1 bản ghi ev
}
```
- **Nhóm hiển thị KHÔNG per-entry.** Thực thi: `BASE_GROUP = { agg:'Taxonomy & nguồn', ev:'Bằng chứng (mẫu)', cust:'Cohort khách' }` suy từ `base` (DRY — không lặp `group` trên 11 entry). `qBaseKey(q)` map item → khóa nhóm; `GROUP_LABEL` cho nhãn chip.
- **`evAttr` là "khóa capability" ghép chéo**, KHÔNG dùng allowlist id cứng. Cross-tab picker bật một chiều ⇔ chiều đó có `evAttr`. Chiều không có `evAttr` (src/seg/tier + taxonomy khi chỉ có tổng `.n`) hiện **xám + lý do**.
- Single-valued: `cat`→`e.cat`, `sen`→`SEN_BUCKET(e.sen)`, `pf`→`e.pf`. Multi-valued: `theme/sub/l1..l3`→ mảng id qua `e.tax[]` (một phản hồi mang nhiều theme).

---

## 3. Cross-tab (ghép 2 chiều) — quy tắc

- **Chỉ tính từ `DATA.ev`** (22 bản ghi mẫu). Cell(hàng r, cột c) = số bản ghi ev có `evAttr_show(e)⊇r` **và** `evAttr_by(e)⊇c`.
- **Multi-valued caveat**: chiều taxonomy trả mảng → một ev đếm vào nhiều hàng; tổng cột theo taxonomy **> số mẫu**. Hiển thị nhãn rõ: *"một phản hồi có thể mang nhiều theme"*. (Cùng semantics với `themesAt()` sẵn có ở vocjourney — không phát minh cách đếm mới.)
- **Nhãn bắt buộc** trên mọi cross-tab: *"đang hiện N mẫu — tập mẫu, không phải toàn bộ bản ghi"* (dùng lại quy ước `base:'ev'` hiện có).
- **Khóa**: nếu `show` hoặc `by` không có `evAttr` → không cho chọn cross-tab (không bao giờ tạo ra item bịa số).
- **View của cross-tab**: bảng ma trận (mặc định) hoặc grouped/stacked bar. `view` + `chart` áp dụng bình thường.
- **Nhiều cột chỉ số (1 chiều, `by=null`)**: bảng có Count | %  (Δ vs kỳ trước để sau — cần chuỗi thời gian, chưa có). Không phải cross-tab, dùng được **mọi** chiều.

---

## 4. Bốn màn (dispatcher `V.quantify`)

Giữ mô hình "3 màn con đổi bằng state, không đổi route" + **thêm màn Set**. State ở `ST.sel.qview`: `lib`(mặc định) · `build` · `detail` · `sets`.

### 4.1 Thư viện (`quantifyLib`)
- Header + **＋ Tạo** (→ build) + link **Quản lý set** (→ sets).
- Thanh lọc: search (tên/chiều) + 3 nhóm chip: **theo kiểu** (Bar/Donut/Line/Cohort/Anomaly + đếm, giữ) · **theo nền** (Taxonomy/Bằng chứng/Cohort) · **theo view** (Chart/Bảng).
- Lưới `g2`; mỗi thẻ = widget thật + **toggle Chart/Bảng** + badge + nút **Xem chi tiết · Sửa · Nhân bản · Đổi tên · Xóa** (`qActions`).
- **Bấm bar/hàng = highlight tại chỗ, KHÔNG drill sang tab** (gỡ `blkClick`).

### 4.2 Builder tạo **& sửa** (`quantifyCreate(id?)`)
- Không `id` = tạo mới; có `id` = **nạp item về builder** (Sửa).
- Panel chọn: **Chiều hàng** (`show`, nhóm theo `group`) × **Chiều cột** (`by`, chỉ hiện chiều có `evAttr`; chọn "— không ghép —" = 1 chiều) × **Chỉ số** (Count/%) × **View** (Chart/Bảng) × **Kiểu** (khi Chart).
- Danh sách **đóng** (không ô nhập tự do) — giữ mô hình Enterpret.
- Xem trước live bên phải (widget thật).
- Lưu: `[Lưu đè <id>]` (khi sửa) + `[Lưu thành bản mới]` (nhân bản). Khi item đang được set dùng → **banner cảnh báo** "N set sẽ đổi theo" + gợi ý lưu bản mới.

### 4.3 Chi tiết (`quantifyDetail`)
- Widget lớn + toggle Chart/Bảng + metadata (chiều, cột nếu cross-tab, chỉ số, view, đang dùng ở set nào) + note + `qActions`.

### 4.4 Quản lý set (`quantifySets`) — MỚI
- Danh sách set (VoC + CXM). Mỗi set = chuỗi **câu hỏi** × dãy **block**.
- Thêm/bớt/đổi thứ tự block (chọn từ thư viện + `@khối` đặc biệt), tạo/đổi tên/xóa set.
- **GIỚI HẠN đã thực thi**: `ST.boards[setId]` là overlay **theo vị trí câu hỏi** (`d.qs.map(q => q.b.slice())`), nên **số câu hỏi cố định lúc tạo**. `setNew`/`setDup` tạo set người dùng với **đúng 1 câu hỏi** ("Các chart đã chọn"); chưa có UI thêm/bớt câu hỏi. Compose = thêm/xếp block trong 1 câu hỏi đó. Muốn nhiều câu hỏi → mở rộng sau (đổi `ST.boards` sang overlay theo id câu hỏi, không theo vị trí).
- **2 tab cố định** (`b-cxm-exec`, `b-voc-all`) hiện ra **khóa** (không sửa cấu trúc) — muốn đổi thì **Nhân bản set** rồi sửa bản mới.
- Mutate `ST.boards` (dời từ ✎ Overview về đây). Overview chỉ **hiển thị** set + link "Sửa ở Quantify". Không persist; "Trả về mặc định" = xóa khóa trong `ST.boards`.

---

## 5. Bất biến phải giữ (đừng narrow lại)

- `validateFixture()` **trả rỗng** sau mọi thao tác (chạy mỗi render; đứt → banner đỏ mọi màn).
- **Xóa guard 2 đường**: `qUsedBy(id)` xét **cả** `DATA.dash` **lẫn** `ST.boards`. Không thu về một nguồn.
- **Store in-memory** (mutate `DATA.qt`/`ST.boards`), **non-persist**, refresh reset. KHÔNG localStorage.
- **Không bịa data**: cross-tab chỉ từ `ev`; agg/cust khóa. Line/Cohort/Anomaly động vẫn cần nguồn chuỗi thời gian thật (chưa có) → chỉ 5 series curated.
- **Builder danh sách đóng** (Enterpret). `esc()` mọi tên người dùng nhập. Xóa dùng **inline two-step**, KHÔNG `confirm()` browser.
- Nguồn hệ giao dịch thật **chưa chốt** → giữ placeholder ở lớp DIMS (§7).

---

## 6. `validateFixture()` — assertion MỚI (§17 / §12b)

§17 lặp mỗi `DATA.qt` item; thêm:
1. `view ∈ {'chart','table'}`.
2. `kind:'series'` **không** được `view:'table'` (§8 — series chưa hỗ trợ bảng) và **không** có `by`.
3. `kind:'show'`: `show` tồn tại trong `DIMS`.
4. Nếu có `by` (cross-tab): **cả** `show` **và** `by` phải có `evAttr` trong `DIMS` (nếu không → đúng loại lỗi cần bắt: item bịa số).
5. §12b giữ nguyên: mỗi block trong `DATA.dash`/`ST.boards` trỏ chart/`@khối` có thật.

---

## 7. LỚP NGUỒN — owner CHƯA CHỐT (open item, đã contain)

Owner không chọn phương án ở Q6, ghi *"để tạm thời là cái này nhưng chưa chốt"*. **Không** promote thành quyết định. Cách contain:
- **DIMS là bảng khai báo DUY NHẤT** của lớp nguồn (§2.2). Mọi surface đọc từ đó.
- Tạm dùng: nhóm 11 chiều theo `group` + nhãn *"nguồn fixture demo · hệ giao dịch thật chưa chốt — sẽ nối sau"* (kiểu Atlas show in-development).
- Khi chốt nguồn thật: sửa **một** bảng DIMS (thêm/đổi entry + `evAttr`), không redesign. → chi phí "chưa chốt" = 1 lần sửa bảng.

---

## 8. Quyết định spec (grill không phủ — chốt tại đây)

- **View của 5 series curated** (`q5–q8,q15`): chart-only. Toggle Chart/Bảng **chỉ hiện khi `kind:'show'`** (đi qua `qRun`). Series không hiện toggle (tránh nút chết). Bảng kỳ×giá trị cho series = mở rộng sau, không nằm slice đầu.
- **Nhân bản** (Q2): copy item → id mới (`qN`+timestamp), tên "… (bản sao)", `view/by` copy nguyên. Không hỏi owner (hệ quả trực tiếp).
- **Toggle view** là trạng thái xem tạm (`ST.sel.qViewOverride`), không ghi vào item; refresh về `view` mặc định.

---

## 9. Ảnh hưởng harness §11b (đánh dấu để slice đầu không bị đọc nhầm là regression)

Prior-art (working tree, §11b đang xanh) sẽ đổi:
- Rename-only → **thêm** edit/lưu-đè/nhân-bản: §11b phải phủ Sửa (nạp id + lưu đè) + Nhân bản (id mới, count +1).
- Drill-away (`blkClick` trong lib) → **bỏ**: §11b không còn assert bar trong lib điều hướng.
- **Thêm** phủ: toggle view chart↔bảng; cross-tab (item có `by`) render + validate; màn Set (thêm/bớt/đổi thứ tự block, mutate `ST.boards`, guard xóa 2 đường vẫn chặn).
- Verify: `node output/_harness.js` → `✓ Tất cả kiểm tra đạt`, exit 0.

---

## 10. Slice — ĐÃ THỰC THI (S1–S7, harness xanh)
1. ✅ **Data + DIMS registry**: thêm `view/by`, `evAttr` + `evTaxLv`, `BASE_GROUP`; normalizer `view/by`; 5 §17 assertion.
2. ✅ **Render bảng + toggle**: `qTable()`, `qViewOf`, `qViewToggle`, `qSetView`; nhánh view trong `qWidget`.
3. ✅ **Cross-tab**: `qRunCross()` từ `ev` (single/multi-valued), `qCrossTable`/`qCrossBars`, nhãn "mẫu"; gate `evAttr`.
4. ✅ **Builder tạo+sửa+nhân bản**: `quantifyCreate(id?)` (edit mode, by-picker, view picker, banner in-use), `qSave(asNew)`, `qDuplicate`, `qGoEdit`.
5. ✅ **Màn Quản lý set**: `quantifySets`, `SET_LOCKED`, `blkMove`, `setNew/setDup/setDel*/setRen*` (+ `CFG.sub`); Overview thành hiển thị + link `qGoSets`.
   - ✅ **FIX bất biến**: `qUsedBy` từ either/or (`ST.boards[d.id] || d.qs.map(...)`) → **union** (`.concat`). Bug cũ: gỡ chart khỏi overlay set đã tùy chỉnh trong khi `DATA.dash` vẫn trỏ → xóa chart lọt guard → §12b banner đỏ. Xem §11.
6. ✅ **Lib org + gỡ drill**: chip `qBaseKey`/view (`qFilterG`/`qFilterV`); bỏ `blkClick` drill-away ở lib + detail.
7. ✅ **Harness §11c** cập nhật + xanh: view toggle, cross-tab q16, gate (evAttr + series-table + series-by), edit/nhân bản, lọc, no-drill, Overview fallback sau xóa set đang chọn.

---

## 11. Sai khác bản build vs spec nháp (chốt theo code)

1. **`qUsedBy` union fix (bất biến, hệ quả nhất)** — không suy ra được từ spec nháp. Guard cũ là **either/or**: `(ST.boards[d.id] || (d.qs||[]).map(q=>q.b))`. Khi một set đã tùy chỉnh (`ST.boards[d.id]` tồn tại) bị gỡ một chart khỏi overlay trong khi `DATA.dash` gốc vẫn trỏ chart đó → `qUsedBy` chỉ nhìn overlay → trả 0 → cho phép xóa → §12b bắt "block trỏ chart không tồn tại" → **banner đỏ mọi màn**. Sửa thành **union** hai nguồn (dòng ~4559). Repro đã xác nhận bằng probe vm (gỡ q2 khỏi overlay `b-voc-all` → xóa → đỏ; sau fix → chặn).
2. **Nhóm hiển thị**: spec nháp ghi `group` per-entry trong DIMS; thực thi dùng `BASE_GROUP` theo `base` + `qBaseKey`/`GROUP_LABEL` (DRY — không lặp 11 entry). §2.2 đã sửa.
3. **Seed cross-tab `q16`** (`Theme × Nền tảng (ghép chéo)`, `by:'pf'`, `view:'table'`) thêm vào `DATA.qt` để thư viện có ví dụ cross-tab thật + harness kiểm render bảng ma trận + nhãn "mẫu". Spec nháp không có.
4. **Set người dùng = 1 câu hỏi cố định** (giới hạn positional `ST.boards`). §4.4 đã ghi.
5. **Gate series** (`view:'table'` và `by` trên `kind:'series'`) nay có test §11c — trước chỉ có assertion trong code, chưa kiểm.
