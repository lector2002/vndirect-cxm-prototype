# Module Charter — Phase 2: Overview (Tổng quan CXM + VoC)

Status: active (owner đã chốt D1 + D2 ngày 01/08)
Date: 2026-08-01
Nguồn: `C:\Users\Admin\.claude\plans\crystalline-giggling-sprout.md` (Phase 2), prototype `output/cxm-platform-prototype.html` 2084-2356, oracle `output/_harness.js` §2b (77-119), design gốc `docs/superpowers/specs/2026-07-27-cxm-voc-redesign-design.md`.

## Mục tiêu
`#/cxm` và `#/voc` render SET (boards) đã compose ở Quantify: hero + chip chọn set + meta + 9 @BLOCK body + widget Quantify, share-by-URL `#/<sec>/<setId>`. KHÔNG sửa khối inline (redesign 31/07 đã dời compose về Quantify → harness §2b dòng 85 cấm chuỗi `blkx` xuất hiện ở Overview).

## Quyết định đã chốt (owner, 01/08)
- **D1 — `@coverage` số trên thanh → SỬA, render raw `%`.** Prototype `rankBars` render `nf(fx(v))`; rows của `@coverage` là `obs.cov` (đơn vị %), nên bản gốc paint `fx(85)=476` — LỖI THẬT (số % bị nhân factor volume 5,6). `web/` render raw `cov` + `%`, KHÔNG áp `fx` (tiền lệ `qCrossTable` raw-nf ở P1.1b). **CHỈ sửa ở `web/`** — không chạm `output/cxm-platform-prototype.html` (bản live). Defect prototype ghi vào follow-ups.
  - Hệ quả kỹ thuật: `Bars` cần chế độ giá trị **raw + đơn vị** (không `fx`, không `pctMode`). Chế độ này KHÔNG nằm trong contract S2.1a (đã dispatch trước khi chốt D1) → Opus tự thêm sau khi certify S2.1a, hoặc gộp vào contract S2.3 (chủ sở hữu `@coverage`).
- **D2 — Backfill ngay, làm đủ 9/9 block.** S2.0 chạy đầy đủ như mô tả dưới; đồng thời mở đường Phase 5 (Topics dùng đúng các field này).

## Flow inventory
| # | Flow | Nguồn prototype |
|---|---|---|
| F1 | Vào `#/cxm` / `#/voc` → render set mặc định (`x.def`) của phần đó | 2299-2302 |
| F2 | Bấm chip set → đổi set đang xem | 2313-2315 |
| F3 | Share-by-URL `#/<sec>/<setId>` → mở đúng set; id lạ/đã xóa → fallback set mặc định (không throw) | harness 80, 111-115 |
| F4 | Set đã tùy chỉnh (`boards[setId]`) → banner cảnh báo "không persist" + nút "Trả set về mặc định" | 2320-2321 |
| F5 | Mỗi câu hỏi render dãy block theo `curB()` (overlay boards nếu có, không thì `qs[].b`) | 2286, 2323-2336 |
| F6 | Câu hỏi rỗng khối → empty state "Câu hỏi này chưa có khối nào" | 2335 |
| F7 | Link "✎ Quản lý set" → `#/quantify` màn sets | 2316 |
| F8 | Drill-down từ block → route đích (`BLOCKS[b].go`) + drill chart (`blkClick`) | 2290-2297, 2332-2334 |

### Bất biến kiến trúc cho F2+F3 (nêu rõ để worker không tự thêm store field)
**URL là source of truth của set đang xem.** Chip = `navigate('/<sec>/<setId>')`; page suy set từ route param, fallback `def` khi param vắng HOẶC trỏ set không còn tồn tại. **KHÔNG** thêm field `selectedSet` vào Zustand (sẽ desync với URL — harness 111-115 xóa set đang chọn rồi vào `#/cxm`).
**Drill link chỉ điều hướng route.** `@lanes` gốc gọi `setSub('work','lanes')` trước `go('work')`; ý định sub-tab **defer** sang Phase 3 — không dựng store field cho màn chưa có.

## Sections

### S2.0 — Data contract backfill (PREREQ của S2.2; chờ D2)
- `TaxNode` (`web/src/data/schema/voc.ts:50`) thiếu `cat`, `pts`, `why`, `demo`, `up`, `by`; `drift` có type nhưng seed chưa set giá trị.
- `CxmData` (`schema/index.ts`) thiếu `cats: Record<string, Category>` (type `Category` đã có, chưa dùng).
- **Lưu ý port**: seed đã đổi tên `tax.p` (prototype) → `parentId`. Giữ `parentId`, ĐỪNG tái sinh `p`.
- AC: seed backfill trung thành prototype 805-830 (đúng `n`/`pts`/`cat`/`why`/`demo`); `validateFixture` thêm kiểm `tax.cat ∈ cats` cho lv=theme + 1 negative test; validate() rỗng; tsc 0 lỗi; 194 test cũ giữ nguyên kết quả.

### S2.1 — Primitives Overview (design-system) — KHÔNG chờ D1/D2
Port từ prototype, KHÔNG palette mới:
- Đơn giản: `Stat` (1564), `Badge` (1502), `CatChip` (1572), `Note` (biến thể ''/warn/crit/bd), `AxisLabel` (1884), `Sparkline` (1616), `WidgetHead` (1858 → dùng `Card.denom`: "Đang hiện Top N trên M unit").
- **Composite — thuộc S2.1, KHÔNG để block tự dựng inline** (Phase 5 Sources/Agents sẽ dùng lại): `SrcMatrix` (3563, chế độ compact) · `AnomalyLanes` (2361).
- `Bars` mở rộng **backward-compatible** (194 test hiện tại phải xanh): `total?` (mẫu số tooltip), `onRowClick?`, `kids?` (chip sub-theme dưới thanh, 1880-1882), **+ khôi phục `title` tooltip** `"<l> — <nf(fx(v))> (<pv(v,total)>%)"` (bản React đã bỏ; không có nó thì `total?` là prop chết).
- AC: mỗi primitive có test render khẳng định nội dung thật; Bars test cũ xanh; không màu ngoài token VND.

### S2.2 — 4 block VoC (chờ S2.0 + S2.1)
`@srcmatrix` (2121-2131) · `@intent` (2133-2150) · `@anomlanes` (2152-2156) · `@topictrend` (2256-2281).
`themeFixes`/`themeStep` (3794-3795) suy từ `ev[].tax` + `ev[].step` — ĐÃ XÁC MINH có trong seed, không cần backfill.

### S2.3 — 5 block CXM (chờ S2.1)
`@toppri` (2158-2168 + `topCard` 2347) · `@journeystate` (2170-2195) · `@coverage` (2197-2211, theo D1) · `@lanes` (2213-2229 + `LANES` 2882) · `@outcomes` (2231-2255).
Bất biến nội dung: `@toppri` giữ nguyên 3 ghi chú "thay cho …" (không bịa LTV/NPS); `@outcomes` giữ bậc "Chưa kết luận được" + cảnh báo confounder; `@journeystate` giữ "Flow chưa đo … chủ ý, không phải mất dữ liệu".

### S2.4 — OverviewPage + routing (chờ S2.2/S2.3)
- `features/overview/OverviewPage.tsx` (container, reader store duy nhất) + `SetChips`, `SetMeta`, `CustomBanner` (presenter thuần).
- Route `#/cxm`, `#/voc`, `#/cxm/:setId`, `#/voc/:setId`; thêm stub `#/issue/:id`, `#/topic/:id` để link drill không rơi vào "Không tìm thấy màn".
- `SEC` lead/intro (2095-2103) tính từ data, không hardcode số.
- Giữ `data-tour="setchips"` + `data-tour="blk-<b>"` cho tour (Phase 0 step 7, còn treo).

## P2 oracle map — assertion PHẢI port (đừng để worker tự chế coverage)
Harness 118-119 chỉ assert `length>=300 && !includes('không tồn tại')` → **pass được trên rác**. Mỗi block cần ≥1 assertion **suy lại độc lập từ seed**:
1. `@coverage` — tập step có `obs.cov < cfg.step.covMin` phải khớp ĐÚNG các mã step mà note liệt kê; nhắc ngưỡng `covMin` bằng số từ cfg.
2. `@outcomes` — số badge mỗi `verdict` khớp `out` theo verdict; con số "chưa có kết quả đo" = `act.filter(dl==='released').length - out.length`; loop "N/M" khớp `loop.filter(done>=need).length`/`loop.length`.
3. `@journeystate` — `cnt(crit)+cnt(watch)+cnt(ok)` = `steps.length`; step "nặng nhất" = max `obs.failed`; "flow chưa đo" = `flows.length - flows.filter(observed).length`.
4. `@toppri` — đúng 4 card; thứ tự điểm gãy KHÁC nhau giữa ≥2 cách xếp (đó là toàn bộ thông điệp của block).
5. `@lanes` — tổng 4 làn = `act.filter(laneOf!=='off').length`; làn `assign` có phần tử → viền crit.
6. `@srcmatrix` — số nguồn có vấn đề = `sources.filter(sourceHealth!=='ok').length`, note liệt kê đúng tên các nguồn đó.
7. `@intent` — 4 card đúng 4 intent; mỗi card chỉ chứa theme có `cat` tương ứng; Top 6 cắt đúng.
8. `@anomlanes` — số cảnh báo = `ag.reduce(+f.filter(f.lane).length)`.
9. `@topictrend` — mọi theme có 1 hàng; dấu `Thay đổi` = `pts[last]-pts[0]`; tô crit khi (cat≠praise ∧ d>0) hoặc (cat=praise ∧ d<0); badge "Dữ liệu demo" đúng theme `demo`.
10. Page (§2b 84-85) — có link "Quản lý set", KHÔNG có chuỗi `blkx`; mọi set trong `dash` render được; xóa set đang chọn → `#/cxm` vẫn render (fallback); banner custom hiện khi `boards[setId]` tồn tại, mất sau `resetBoard`.

## Test seams
`validate.test.ts` (S2.0) · `design-system/*.test.tsx` (S2.1) · `features/overview/blocks/*.test.tsx` (S2.2/S2.3) · `features/overview/OverviewPage.test.tsx` (S2.4, `createCxmStore(new MockRepository())`).

## Blocking edges
S2.1 độc lập (dispatch ngay). S2.0 → S2.2. S2.1 → S2.2, S2.3. S2.2+S2.3 → S2.4.

## Boundary interfaces
Chỉ đọc qua store (`data`/`cfg`/`boards`) + mutation qua `resetBoard`. KHÔNG thêm API repo mới. Block body nhận data qua props (thuần) như `QuantifyWidget`.

## Ngoài phạm vi
Thân màn drill-down (sources/topics/agents/work/atlas/vocjourney/issue/topic) = Phase 3/5. Tour spotlight = còn treo Phase 0 step 7. Persist boards = không (in-memory).
