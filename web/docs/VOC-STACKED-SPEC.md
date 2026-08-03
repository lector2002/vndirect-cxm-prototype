# VoC Stacked-Bar + Theme Detail — Spec/Handoff (2026-08-03)

Owner đã chốt (AskUserQuestion 03/08): **dựng cả module 1 lượt** + màn theme-detail **4 section**.

## Bối cảnh phiên (đã xong + tự chứng nhận, CHƯA commit)
- Global filter toolbar + search (tra-cứu/điều-hướng); Demo Mode toggle (BẬT→demo data, TẮT→`EMPTY_DATA`+banner). `tsc -b` sạch, vitest 570/570.
- LƯU Ý build: dùng `npx tsc -b` (KHÔNG `--noEmit` — root tsconfig `files:[]` nên no-op). Chạy từ web root bằng PowerShell `Set-Location`.

## Data model (đã verify trong web/src/data/schema/voc.ts + seed.ts)
- `TaxNode` (data.tax): theme `lv:'theme'` có `cat`, `pts:number[]`, `n`, `why`, `up`, `by`; subtheme `lv:'subtheme'` có `parentId` (trỏ theme id), `n`. (seed dùng `parentId`, KHÔNG phải `p:`.)
- `Evidence` (data.ev): `tax:string[]` chứa theme id; `q` (verbatim), `src`, `at`, `cat`, `sen`, `kind`.
- `VoiceInsight` (data.ins): `theme` (theme id), `seg:string[]` (NHÃN nhóm khách — thật, nhưng KHÔNG có count per-group), `n`, `pts`, `ev:string[]`, `pos`, `trend`, `rec`.
- `data.cats: Record<string,{label,color}>` — màu theo intent.
- Khuôn block: `web/src/features/overview/blocks/IntentBlock.tsx` (lọc theme theo cat, sort n, DimRow{id,l,v,c}, kids=subtheme theo parentId, onRowClick→`onGo('topic/'+id)`, axisLabel). Card từ design-system.
- Wire set: `data.dash` id `b-voc-all`, `qs[2]` q='Khách đang nói gì?' hiện `b:['@intent']` (seed.ts ~dòng 584-586). Thêm `'@themestack'` vào mảng này.

## Việc cần làm

### 1. MODIFY `src/design-system/Bars.tsx` — thêm stacked-segment mode (ADDITIVE)
- Thêm prop optional `segments?: (row: DimRow) => { label: string; n: number; c: string }[]`.
- Khi `segments` có & trả mảng non-empty cho một row → phần FILL của thanh (div width ∝ `r.v/max` như cũ, GIỮ nguyên tổng bề rộng) chia thành các đoạn màu ngang, rộng mỗi đoạn ∝ `seg.n / Σseg.n` (chuẩn hoá TRONG phạm vi fill — themeSegments đã tự đảm bảo Σseg.n = row.v bằng đoạn "chưa gán", nên fill KHÔNG bịa: đoạn xám là phần thật chưa phân loại). Mỗi đoạn có `title` = `${label}: ${nf(seg.n)}`. Vắng/empty → giữ nguyên fill 1 màu (`r.c ?? DEFAULT_BAR_COLOR`).
- QUAN TRỌNG: div FILL hiện có `rounded-[4px]` nhưng CHƯA `overflow-hidden` → segment con sẽ tràn qua góc bo. THÊM `overflow-hidden` vào div fill (track cha có overflow-hidden nhưng không clip con của fill). Render segment bằng flex row bên trong fill, mỗi đoạn `style={{width: pct%, background: seg.c}}`.
- KHÔNG đổi `data-testid="bars"`, KHÔNG đổi grid-template, KHÔNG phá caller cũ (IntentBlock/TopPri/Coverage/QuantifyWidget) hay `QuantifyWidget.segment.test`. Segment nằm TRONG div fill hiện có.
- Thêm test: một row có segments → render N đoạn; không segments → 1 fill (regression).

### 2. NEW `src/domain/themeSegments.ts` (+ test)
- `export type ThemeAxis = 'subtheme' | 'group';`
- `export type ThemeSegment = { label: string; n: number; c: string; demo?: boolean };`
- `export function themeSegments(data: CxmData, themeId: string, axis: ThemeAxis): ThemeSegment[]`
  - `theme = data.tax.find(t=>t.lv==='theme' && t.id===themeId)`; không thấy → `[]`.
  - `axis==='subtheme'`: THẬT — `subs = data.tax.filter(lv==='subtheme' && parentId===themeId)` sort n desc, màu palette cố định (mảng hằng, cycle theo index). **ORACLE (đã verify seed 03/08): chỉ 4 subtheme/3 theme; 11 theme KHÔNG có subtheme; x-th-guide & x-th-status chỉ phủ ~50%. TUYỆT ĐỐI KHÔNG normalize seg.n về theme.n (sẽ bịa phân rã).** Thay vào đó: `rem = theme.n - Σsubs.n`; nếu `rem>0` THÊM đoạn cuối `{ label:'Chưa gán sub-theme', n:rem, c:'var(--ink3)' }` (màu token trung tính, KHÔNG demo). Kết quả Σ=theme.n, đoạn xám = phần thật chưa phân loại (trung thực, không phải màu bịa). Theme không subtheme → trả đúng `[{label:'Chưa gán sub-theme', n:theme.n, c:'var(--ink3)'}]` (1 thanh xám — trung thực "chưa có phân rã").
  - `axis==='group'`: DEMO (toàn phần) — nhãn nhóm từ `data.ins` của theme (`ins.filter(i=>i.theme===themeId).flatMap(i=>i.seg)` distinct); rỗng → hằng `DEMO_GROUPS`. Chia `theme.n` theo tỷ lệ DETERMINISTIC dẫn từ `theme.id` (vd char-sum của id hoán vị một base-ratio set) để MỖI theme có hình khác nhau — KHÔNG dùng một mảng ratio giống hệt mọi theme (sẽ trông giả rõ). Chuẩn hoá về tổng theme.n, dư dồn đoạn cuối để Σ=theme.n. Mọi đoạn `demo:true`, màu palette. KHÔNG random/Date.now — hàm thuần, cùng input ra cùng output.
- Layer: domain — được phép import `data/schema` (giống các domain khác). Immutable, no any. Có test riêng verify: subtheme axis có đoạn "chưa gán" đúng rem; group axis deterministic (gọi 2 lần = kết quả bằng nhau) & Σ=theme.n.

### 3. NEW `src/features/overview/blocks/ThemeStackBlock.tsx` (+ test) — block `@themestack`
- Theo khuôn IntentBlock. Props TYPE `{ data: CxmData; cfg: Cfg; onGo?: (route:string)=>void }` nhưng **destructure chỉ `{ data, onGo }`** trong signature (giữ `cfg` trong type theo shape chung, không dùng → tránh lint unused, y hệt IntentBlock).
- 1 Card, tiêu đề "Theme theo thành phần". Local `useState<ThemeAxis>('subtheme')` (mặc định sub-theme = trục trung thực) + toggle 2 nút (Sub-theme / Nhóm khách) segmented pill (mẫu TimeframeBar pill: `inline-flex ... bg-surface-2 rounded-lg p-0.5 border border-line`, aria-pressed).
- Rank theme: `data.tax.filter(lv==='theme')` sort n desc, top N (=8). DimRow{id,l:name,v:n,c: cats[cat].color ?? var(--ink3)}.
- `<Bars rows={rows} segments={(r)=>themeSegments(data, r.id, axis)} onRowClick={onGo?(r)=>onGo('topic/'+r.id):undefined} axisLabel={...} />`. axisLabel NỘI SUY tên trục: subtheme→`"Số tín hiệu, chia theo sub-theme"`, group→`"Số tín hiệu, chia theo nhóm khách (demo)"` (KHÔNG để literal placeholder).
- `Card` prop `denomStrip` nêu độ phủ khi axis='subtheme' (vd đếm số theme có subtheme / tổng), và khi axis='group' ghi rõ "Số nhóm khách là dữ liệu demo". Dùng nhãn "demo" hiển thị cạnh toggle khi group.
- Empty-guard: không theme → Note/t-meta.

### 4. WIRE
- `OverviewPage.tsx` BlockBody: thêm `case "@themestack": return <ThemeStackBlock data={data} cfg={cfg} onGo={onGo} />;`. Thêm `"@themestack"` vào `WIDE_BLOCKS` (full-width).
- `blocks/index.ts`: export ThemeStackBlock.
- `seed.ts` `b-voc-all` qs[2] `b:['@intent']` → `b:['@intent','@themestack']`.

### 5. NEW `src/features/topic/ThemeDetailPage.tsx` (+ test) — route `/topic/:id`
- Thay `<Route path="/topic/:id" element={<Placeholder name="Topic" />} />` trong App.tsx bằng `<ThemeDetailPage />`. Injectable `useStore?` như OverviewPage.
- **BLOCKER (search đã ship gửi id KHÔNG-theme vào đây):** `domain/search.ts` map feature=`tax lv 'L2'`→`topic/${id}` và reason=`theme/subtheme`→`topic/${id}`. Nên `/topic/:id` NHẬN cả L2 id và subtheme id. TUYỆT ĐỐI KHÔNG chỉ tìm lv==='theme' rồi "không tìm thấy" — sẽ regress search vừa chứng nhận (mọi hit "feature" chết ngõ cụt).
- Resolve theo id TRƯỚC rồi branch theo `lv`: `node = data.tax.find(t=>t.id===id)`.
  - `node.lv==='theme'` → 4 SECTION dưới.
  - `node.lv==='subtheme'` → render detail của theme CHA (`node.parentId`), có thể chú thích "đang xem theme cha của sub-theme <name>". KHÔNG "không tìm thấy".
  - `node.lv` ∈ L1/L2/L3 → Note trung thực: đây là node "CÁI GÌ" (taxonomy chức năng), CHƯA có màn topic riêng; link `#/atlas`. KHÔNG "không tìm thấy theme".
  - `node` undefined (id không có trong tax) → Note "Không tìm thấy" (đúng nghĩa).
- 4 SECTION (owner chốt):
  1. **Header**: tên theme + tổng `n` + mini-trend (sparkline/inline từ `theme.pts`) + `why`.
  2. **Breakdown sub-theme**: `<Bars>` các subtheme (parentId===id, n THẬT), axisLabel.
  3. **Nhóm khách nhắc tới**: nhãn từ `data.ins` (theme===id).flatMap(seg) distinct — hiển thị chip nhãn (KHÔNG số, hoặc số demo có nhãn "demo"). Nếu rỗng → dòng "Chưa gắn nhóm khách".
  4. **Evidence mẫu**: `data.ev.filter(e=>e.tax.includes(id))` lấy vài cái, hiện `q` (verbatim) + src + at. Rỗng → "Chưa có evidence mẫu."
- Dùng Card/Note/Bars từ design-system; giữ token màu, KHÔNG palette mới.

## Ràng buộc (BẮT BUỘC)
- Layer: data→store→domain→design-system→features (design-system KHÔNG import features/domain-cụ-thể; block features import domain OK).
- No localStorage; no `any`; relative import kèm ext `.ts`/`.tsx`; `import type` cho type; no new Tailwind palette color (chỉ token có sẵn); immutable.
- CHỈ THÊM test, KHÔNG sửa test cũ. Không đụng file ngoài danh sách trên.
- Demo group data chỉ sống khi Demo Mode BẬT (khi TẮT `data` rỗng → block/màn tự trống) — cơ chế đã có, không thêm check demoMode trong các file này.

## Chứng nhận (Opus tự làm, KHÔNG tin report worker)
`tsc -b` exit 0 · `vitest run` full xanh · đọc lại mọi file sửa/mới · tự suy lại số segment bằng oracle riêng (subtheme axis: đoạn "chưa gán"=theme.n−Σsub; group axis: Σ=theme.n & deterministic) · live-check:
- Demo BẬT: /voc câu "Khách đang nói gì?" có block @themestack stacked; toggle Sub-theme (đa số thanh xám "chưa gán", 3 theme có màu subtheme) ↔ Nhóm khách (đủ màu, nhãn demo); click 1 thanh → /topic/:id hiện 4 section.
- **Regression search:** dùng thanh Search điều hướng tới 1 kết quả FEATURE (L2, vd "eKYC") → /topic/:id KHÔNG ngõ cụt (hiện Note "CÁI GÌ node" + link atlas), tới 1 kết quả reason (theme) → hiện 4 section, tới subtheme → hiện theme cha.
- Demo TẮT: /voc trống, banner, không NaN/console error.
- mtime scope (chỉ các file trên).
