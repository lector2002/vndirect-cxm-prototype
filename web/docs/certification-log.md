# VNDIRECT CXM — Prototype → Code thật (full tính năng)

## Context

Nền tảng CXM hiện tồn tại dưới dạng **một file HTML tự chứa** (`output/cxm-platform-prototype.html`, ~4786 dòng): fixture `DATA` + `CFG` + `DIMS`, render qua dispatcher `V.*` theo hash-route, không backend, in-memory, non-persist. Đây là prototype "bấm được" đã được thiết kế kỹ (mô hình Enterpret + lớp journey/securities VND, design system cam VND / xám ấm, 13 view, `validateFixture()` 18 nhóm bất biến).

Owner chốt (31/07) **chuyển sang giai đoạn code thật, full tính năng** — nâng từ 1-file-HTML lên một codebase thật (framework, build, component, test). Bốn quyết định đã grill + chốt:

| # | Quyết định | Chốt |
|---|---|---|
| Nguồn dữ liệu | **Chưa có nguồn thật** → định nghĩa data contract + adapter STUB + set data mẫu; ráp nguồn thật sau |
| Stack | **Dựng mới** React 19 + Vite 7 + TS + Tailwind 3 + shadcn-ui; port 3 tài sản từ `legacy/app` |
| Triển khai | **Nền tảng trước + 1 lát dọc mẫu (Quantify) có test**, rồi cuốn chiếu theo build-order |
| Design | **Giữ + hệ thống hóa** design hiện tại (tokens → theme, ~20 pattern → component có type, IA 13 view/4 nhóm) |
| Set data mẫu | Owner yêu cầu **tạo 1 set data mẫu** đầy đủ để chạy + test full tính năng (§ Set data mẫu) |

**Kết quả nhắm tới:** một app React thật, đủ 13 view + logic, chạy trên set data mẫu qua một lớp adapter tách bạch (đổi sang API thật = thay 1 implementation), có test (unit/integration/e2e) và giữ nguyên 18 nhóm bất biến nghiệp vụ. Prototype HTML trở thành **tài liệu tham chiếu thiết kế**.

> File này sau khi duyệt sẽ thành spec durable trong `docs/superpowers/specs/2026-07-31-real-build-architecture.md` và thay mục "Current State" của `AI-CONTEXT.md`.

---

## Quyết định thiết kế suy ra (không hỏi lại — nêu để owner phản biện)

- **Persistence:** adapter interface `CxmRepository`; impl mặc định `MockRepository` đọc set data mẫu + giữ mutation **in-memory** (refresh reset — giữ đúng bất biến prototype). localStorage là opt-in để sau, nằm sau adapter nên không đụng UI.
- **State management:** **Zustand** cho global state (route-independent): `cfg` (rules, điều khiển tô màu toàn app), collection mutable (iss/act/qt/dash/boards), UI selection. Derived state (stepState/metricState/sourceHealth…) là **hàm thuần** trong `domain/`, KHÔNG lưu — giữ nguyên tắc "trạng thái suy ra, một chỗ đổi ngưỡng cả app tô lại". (Legacy dùng Context; Zustand tránh prop-drilling cho cfg xuyên 13 view.)
- **Charts:** **port chart hand-rolled (SVG/CSS) thành React component**, KHÔNG dùng recharts. Lý do: prototype cố ý hand-roll để giữ quyền kiểm soát + file sửa được; assertion surface (`class="bars"`, DOM output) cần giữ để test đối chiếu được với logic cũ. (Legacy có recharts trong package.json — bỏ.)
- **Testing:** Vitest + React Testing Library (unit/integration), Playwright (e2e), theo TDD, nhắm coverage 80% (chuẩn CLAUDE.md).

---

## Kiến trúc

### Repo layout — app mới ở `web/` (prototype + legacy giữ nguyên)
```
web/
  src/
    main.tsx  App.tsx  routes.tsx          # react-router 7, hash-route giữ #/cxm... để không đứt link
    app/            shell: AppShell · Sidebar(nav) · TopBar(filter) · Tour(spotlight)
    data/           ★ SET DATA MẪU + CONTRACT
      schema/       types TS = data contract (~30 entity: flows/steps/obs/metrics/sources/tax/ev/iss/act/out/loop/qt/dash/dims/cfg…)
      fixtures/     seed data (port + type từ DATA hiện tại, mở rộng đạt tiêu chí phủ)
      validate.ts   validateFixture() — 18 nhóm bất biến (§ Bất biến)
      repository.ts CxmRepository interface  (adapter seam)
      mock-repository.ts  impl in-memory trên fixtures + mutation
    domain/         hàm thuần suy-ra: stepState · metricState · sourceHealth · loopStateMachine(nextAction) · qRun · qRunCross · zScores · fx/esc/timeframe
    design-system/  theme (Tailwind + CSS vars) + primitives: Card Chip Badge Bars Donut LineChart AnomalyChart CohortChart Table FilterBar Tabs Banner DenomLabel …
    features/       1 thư mục / mảng: cxm-overview atlas work voc-overview sources topics vocjourney quantify assistant rules agents issue topic-detail
    store/          Zustand: cfg · collections · selections
  tests/  ·  e2e/   Vitest + Playwright
```
- **Deploy KHÔNG đổi giai đoạn này:** workflow vẫn đọc `output/cxm-platform-prototype.html` → prototype vẫn live cho tới khi app `web/` đạt parity. Đừng migrate deploy sớm.
- `legacy/app/` giữ nguyên, chỉ **đọc** để port 3 tài sản. `app/` (rác node_modules mồ côi ở root) — dọn khi tiện, không thuộc đường tới hạn.

### Data contract + adapter (lõi của lựa chọn "chưa có nguồn thật")
- `schema/` = single source of truth cho hình dạng dữ liệu. Mọi entity có type.
- `CxmRepository` interface: read (`getFlows`, `getIssues`, `getQuantify`, `getDash`, `getSources`, `getTax`…) + mutation (`createIssue`, `advanceAction`, `saveQuantify(asNew)`, `duplicateQuantify`, `deleteQuantify`, `updateBoard`, `createSet`/`dupSet`/`deleteSet`, `updateConfig`…).
- `MockRepository` implement interface trên set data mẫu + mutation in-memory. **Adapter API thật sau này chỉ cần implement lại cùng interface** — UI/domain không đổi.
- 3 tài sản port từ `legacy/app/src/pages/CXControlTower.tsx` (máy trạng thái loop `nextAction`/`getPrimaryAction` + approval gate + actor-on-CTA), `data/onboarding-pilot.ts` (validator → gộp vào `validate.ts`), `inline-standalone.mjs` (chỉ nếu vẫn muốn ship 1-file — optional).

### Design system (giữ nguyên ngôn ngữ hình ảnh)
- Tokens → Tailwind theme + CSS vars: cam VND (`--primary:#D9531E` …, chỉ cho tương tác/định danh), nền xám ấm, 4 trạng thái (watch/crit/good/unk, "ok" không màu riêng), type scale 7 bậc (sàn 12px, tabular-nums), radius 12/shadow.
- ~20+ pattern CSS → component React có type. Charts port hand-rolled (xem quyết định trên).
- IA giữ **13 view / 4 nhóm** + ALIAS route cũ + `data-tour` cho spotlight.

---

## Phạm vi full tính năng → phase (build-order)

Tất cả 13 view map vào phase. **Set data mẫu + validateFixture + adapter dựng ở Phase 0** nên mọi @BLOCK widget đọc được seed từ đầu; drill-down tới màn chưa build thì **stub link** cho tới khi màn đích có.

| Phase | Mảng | View / màn con |
|---|---|---|
| **0 Foundation** | scaffold · design system · data contract + **validateFixture + set data mẫu** · adapter · store · shell/nav/routing/tour · test harness | — |
| **1 Tracer (lát dọc)** | **Quantify** (đã có spec `2026-07-31-quantify-redesign-spec.md`) | lib · build(tạo/sửa/nhân bản) · detail · **sets (composer)** |
| **2 Overview** | CXM + VoC overview + 9 `@BLOCKS` + chọn set + share-by-URL | `cxm` `voc` (renderSet) |
| **3 Work** | kanban 4 làn + priority mode + **loop state machine** + hồ sơ điểm gãy | `work` · `issue/<id>` |
| **4 Rules** | editor sống cho `CFG` → tô lại toàn app | `rules` |
| **5 Journey/VoC surfaces** | Atlas (phase rail + journeySpine + inspector 3 tab) · Sources (ma trận nguồn) · Topics (line theo tháng + detail) · VoC-journey | `atlas` `sources` `topics` `topic/<id>` `vocjourney` |
| **6 Quản trị** | Agents (3 làn cảnh báo, read-only) · Assistant (placeholder có kịch bản) | `agents` `assistant` |

---

## Phase 0 — Foundation (chi tiết, phần thực thi bắt đầu)

1. **Scaffold** `web/`: `npm create vite` (react-ts) + Tailwind 3 + shadcn init + react-router 7 + Zustand + Vitest + Playwright. → verify: `npm run dev` chạy, `npm run build` xanh.
2. **Data contract** `data/schema/`: type hóa ~30 entity từ `DATA`. → verify: `tsc` xanh.
3. **validateFixture** `data/validate.ts`: port **đủ 18 nhóm**. **Deliverable hạng nhất, làm TRƯỚC feature vì nó gate set data mẫu.** → verify: mỗi nhóm có **1 negative test** phá có chủ đích và assert validator bắt được (mở rộng kỷ luật 7 phép provenance của prototype ra cả 18).
4. **Set data mẫu** `data/fixtures/`: port + mở rộng đạt tiêu chí phủ (§ dưới). → verify: `validateFixture(seed)` trả rỗng.
5. **Adapter** `repository.ts` + `mock-repository.ts`. → verify: integration test đọc/ghi cơ bản.
6. **Store** Zustand (`cfg`/collections/selections) + **domain/** hàm thuần (stepState/metricState/sourceHealth/qRun/zScores/loopStateMachine). → verify: unit test từng hàm suy-ra (port các phép kiểm ngưỡng của prototype: bước `ok watch crit ok watch ok`; đổi 15%→10% → bước 02 `crit`; z=1.5→7 điểm, z=30→0).
7. **Shell + routing + tour**: AppShell/Sidebar/TopBar, hash-route + ALIAS, tour spotlight 18 stop, banner đỏ khi validateFixture đứt. → verify: e2e smoke mọi route render, không banner đỏ.

## Phase 1 — Tracer slice: Quantify

- 4 màn con theo spec `2026-07-31-quantify-redesign-spec.md`: `lib` (lưới + 3 trục lọc + toggle chart/bảng) · `build` (tạo/sửa/nhân bản, by-picker gate `evAttr`) · `detail` · `sets` (composer).
- **Ranh giới (theo advisor): composer CHỈ ghi dữ liệu vào `dash`/`boards` qua repository — VERIFY BẰNG TEST, KHÔNG render overview.** Overview để Phase 2. Giữ tracer gọn trong đúng 1 mảng.
- Đi qua: data contract (qt/dims/dash), domain (qRun, cross-tab, zScores), design-system (bars/donut/table/chip/filter), mutation (save/duplicate/delete-guard union 2 đường/set CRUD), validateFixture §16.
- → verify: port toàn bộ assertion Quantify của `_harness.js` sang Vitest (16 chart, guard xóa 2 đường, view toggle, cross-tab, gate series, filter, edit/nhân bản); e2e 1 luồng tạo→lưu→compose set.

---

## Set data mẫu — tiêu chí phủ (kiểm được, để "full" không mơ hồ)

Set data mẫu phải thỏa (fixture hiện tại CHƯA đủ: chỉ 1/32 flow observed, 25/32 verified, `sv-nps` paused, 1 band metric chưa test):
- [ ] Mọi view (13) render **non-empty** từ seed.
- [ ] Mọi derived state `ok/watch/crit/unk` **đều xuất hiện** cho step, metric, source.
- [ ] Mọi `verdict` outcome (improved/inconclusive/worse) có ≥1 bản ghi.
- [ ] Mọi trạng thái trong chuỗi loop (approval→delivery→outcome→impactValidation→loopClosure) có ≥1 bản ghi.
- [ ] Mọi chart kind (rank/anomaly/trend/donut/cohort) có ≥1 item backing.
- [ ] Cả 2 giá trị `VOC_SCOPE` (all/voice) ra số hợp lý.

**Giải quyết căng thẳng "không bịa data" (nêu rõ để session sau không tranh lại):** bất biến này cấm **bịa số tổng hợp ngụ ý đo đạc thật** (kiểu hệ số nhân `DATA.ev.length*41` đã bị gỡ), KHÔNG cấm bề rộng seed. **Seed tổng hợp có nhãn "demo/mẫu" là hợp lệ**; số trình bày như phép đo thật thì không.

---

## Bất biến phải giữ (port nguyên, đừng narrow)

- `validateFixture()` **18 nhóm** trả rỗng sau mọi thao tác (ID trùng · stationId · issue↔action↔insight↔evidence · thứ tự trạng thái action không đảo · handoff insight · nguồn/khảo sát · signal tiền phải server · taxonomy cấu trúc · evidence×taxonomy · dashboard set (mỗi phần 1 def, block trỏ thật, CFG.sub) · agent/loop/outcome · bản đồ · **provenance** format+biên sơ đồ · flow observed · taxonomy↔map (L1 1–1 phase, tổng con ≤ cha) · Quantify view/cross-tab gate · tour · nav). Mỗi nhóm có negative test.
- **Trạng thái suy ra, không lưu:** `obs`/`metrics` không có field `state`; màu/nhãn suy từ `CFG`.
- **Xóa Quantify guard union 2 đường** (`DATA.dash` ∪ `ST.boards`) — bug đã sửa ở prototype, giữ.
- **Builder danh sách đóng** (Enterpret); `esc()` mọi input; xóa **inline two-step** không `confirm()`.
- **Aggregate vs evidence là 2 tập khác nhau**; mọi chỗ dùng mẫu ev ghi "đang hiện N mẫu".

---

## Verification (end-to-end)

- `cd web && npm run dev` → mở, mọi route render, không banner đỏ.
- `npm run typecheck` (tsc) xanh · `npm run test` (Vitest, coverage ≥80% cho domain + validate) · `npm run e2e` (Playwright smoke 13 route + luồng tới hạn) · `npm run build` xanh.
- **Bộ đối chiếu:** assertion của `output/_harness.js` được map hết sang Vitest — coi như test hồi quy so với prototype.
- Gate mỗi section: Terra/Codex review (theo model-routing) trước khi nhận.

---

## Ngoài phạm vi / để sau

- Adapter API/DB thật (chỉ dựng interface + mock giờ này).
- Migrate deploy sang build `web/` (giữ prototype live tới parity).
- Persistence localStorage (opt-in sau adapter).
- Redesign visual / đổi IA (đã chốt: giữ).
- 31 flow non-pilot lên data thật (seed mẫu đủ phủ tính năng là đủ giai đoạn này).

---

## Critical files (đọc/tham chiếu khi thực thi)

- `output/cxm-platform-prototype.html` — **tham chiếu thiết kế** (DATA 479–1294, validateFixture 1627–1841, `<style>` 45–472, V.* dispatchers).
- `output/_harness.js` — nguồn assertion để port sang Vitest.
- `docs/superpowers/specs/2026-07-31-quantify-redesign-spec.md` — spec đầy đủ cho tracer Phase 1.
- `docs/superpowers/specs/2026-07-28-journey-voc-redesign-design.md` + `docs/journey-provenance-audit.md` — IA/journey/provenance (nền invariant #13,#15).
- `legacy/app/src/pages/CXControlTower.tsx` (:59-90,225-233) · `legacy/app/src/data/onboarding-pilot.ts` — 3 tài sản port.
- `docs/REDESIGN-PLAN-HANDOFF.md` — build-order + quyết định khóa.

---

## Operating config (chốt 31/07 — áp dụng từ đây)
- **Thực thi bằng subagent NATIVE Sonnet** (Agent tool, `model: sonnet`). **KHÔNG gọi codex ngoài nữa** (9router local chập chờn: Terra/SOL/DeepSeek đều từng treo/502). Opus vẫn owns plan + review + verify.
- **Tự compact khi context đạt ngưỡng ~30%** — checkpoint ở ranh giới section (durable trên đĩa) trước khi compact.

## Tiến độ Phase 0 (cập nhật 31/07)
- ✅ S0.1 Foundation: `web/` scaffold (React 19 · Vite 8 · TS 6 · Tailwind 3 · Vitest) + tokens + shell 13-nav + smoke test. build/test/typecheck xanh.
- ✅ S0.2 Data contract: `web/src/data/schema/` (7 file, ~30 type). tsc 0 lỗi, không `any`.
- ✅ S0.3+S0.4 Seed + validateFixture (lõi data-integrity): `seed.ts` (24 collection, port trung thành — đếm khớp prototype), `validate.ts` (18 nhóm TRUNG THÀNH, đã vá group 9 theme/subtheme + group 10 block-integrity/def/CFG.sub), `validate.test.ts` (29 test: 1 positive + 28 negative phủ 18 nhóm). tsc xanh.
- ✅ S0.6 domain: `web/src/domain/{state,stats,loop,format}.ts` — stepState/metricState/sourceHealth/laneOf/zScores/countAnomalies/loop(getPrimaryAction,advanceAction)/fx/esc. Ngưỡng khớp tài liệu (step `ok watch crit ok watch ok`; z=1.5→7, z=30→0; m-liveness crit / m-ocr watch).
- ✅ S0.5 adapter: `web/src/data/repository.ts` (interface `CxmRepository`) + `mock-repository.ts` (`MockRepository` in-memory). Delete-guard UNION verified.
- ✅ Store: `web/src/store/store.ts` (Zustand + factory `createCxmStore(repo?)`, snapshot ổn định).
- ✅ **PHASE 0 ĐÓNG** — `npx tsc -b` 0 lỗi, `npx vitest run` **90/90** (8 file test).
- ✅ P1.1a Quantify engine: `web/src/domain/quantify.ts` (`qRun`/`qRunCross`), 7 test, số re-derive độc lập từ seed.
- ✅ P1.1b render primitives: `web/src/design-system/` (Card·DenomLabel·Bars·Donut·DataTable·CrossTable·QuantifyWidget + `format.ts` nf/pv nội bộ + barrel). ĐỐI CHIẾU PROTOTYPE: qRun axis (`pct?'% trên tổng':BASE_AXIS[base]`), TOP_N slicing (`donut→all, else slice(0,10)`), rankBars `r.c||ink3`, qCrossTable raw-nf (không fx), donut conic-gradient + PAL, qTable Count+%, wHead denom — tất cả khớp 1-1. `tsc -b` 0 lỗi, `vitest run` **106/106** (12 file). Widget nhận data/dims qua props (thuần, không đọc store).
- ✅ P1.1c series charts: `web/src/design-system/{LineChart,AnomalyChart}.tsx` (+ test) — port 1-1 lineChart(1589)/anomalyChart(1997); wired vào `QuantifyWidget` (thay placeholder), `cfg?` prop cho ngưỡng anomaly (từ `cfg.anomaly.z`, không hardcode; `DEFAULT_ANOMALY_Z=1.5` chỉ fallback render). `tsc -b` sạch, `vitest run` **111/111** (14 file), `as any` sạch. Subagent stall giữa chừng nhưng file đã ghi đủ + certify tay + thêm guard non-vacuous cuối.
- ✅ P1.2a Thư viện: `features/quantify/{QuantifyPage,QuantifyLibrary,ValidateBanner}.tsx` + wire route + banner đỏ vào `App.tsx` Shell. Container/presenter (page đọc store + giữ `qview`/`viewOverride` local; library thuần props). tsc sạch, 123→**124/124**.
- ✅ P1.2a-fix (owner iterate live, chốt UI): (1) **card tự chứa** — mọi điều khiển vào `Card.footer` (thêm slot footer trong Card; QuantifyWidget nhận `footer?` prop), không lửng lơ ngoài card; (2) **bỏ nhãn denom** → `CountFilter.tsx` (chip "Hiện N/M ▾", mốc 5/10/20/Tất cả, ẩn mốc>M) điều khiển `limit` cắt top-N; **DenomLabel.tsx đã XOÁ** (dead), gỡ khỏi barrel; kỳ → `Card.subtitle` nhẹ (fix overlap). QuantifyWidget nhận `limit?` prop. State `count` cục bộ ở QuantifyLibraryCard. Filter chỉ cho rank/bảng 1 chiều >5 dòng. Owner chốt giữ nguyên (mốc 5/10/20/Tất cả + kỳ subtitle). Caveat "tập mẫu" ev KHÔNG ở denom (ở axis label + CrossTable) nên bỏ denom không phá bất biến. Verify LIVE qua chrome-devtools (bấm 5→5 thanh OK).
- ✅ **P1.2b Lọc + search + chi tiết**: `quantifyFilter.ts` (`qBaseKey`/`qDim`/`filterItems` thuần, predicate kind∧base∧view∧search port 1-1 proto 2446-2450) + `QuantifyFilterBar.tsx` (search + 3 nhóm chip có đếm; nút "Xóa bộ lọc" chỉ hiện khi có filter active) + `QuantifyDetail.tsx` (widget lớn + metadata + usedBy, controls TRONG Card.footer — tự chứa như thẻ lib). QuantifyPage giữ filter/search/detailId local; `onOpenDetail` mang id thật; empty state "Không có chart nào khớp bộ lọc" + clear. tsc sạch, **151/151** (20 file). Verify LIVE chrome-devtools: lọc base=ev→3 chart, count chip đúng (kind 10+1+2+2+1, nền 8+3+5, view 15+1 =16), màn Chi tiết "Đang dùng ở 1 set: b-voc-topic". Files chỉ trong `features/quantify/`.
- 🔄 **P1.3 (đang làm — owner: "làm full tất cả của quantify r sẽ chỉnh sửa sau")**: builder tạo/sửa/nhân bản + màn Quản lý set. **Advisor đã gọi** (2 grep xác nhận: harness CÓ oracle build/sets §11b/§11c dòng 88-114/182-189/252-324; seed đủ 8 dim evAttr).
  - ✅ **Foundation seam (Opus tự dựng, certify tsc + vitest 152/152)**: (1) tách `data/blocks.ts` (registry @block CÓ tên `n`, bỏ `wide`) làm single source of truth; `validate.ts` import lại (xóa const cục bộ, 29 negative test bất biến). (2) thêm `createQuantify(fields: Omit<QuantifyShow,"id">): QuantifyItem` vào repository/mock/store (advisor: type chặt = builder không dựng series; repo giữ quyền cấp id) + 1 test (id 'qu' tươi + validate() rỗng).
  - ✅ **UI port (worker Sonnet, Opus certify)**: `QuantifyBuilder.tsx` + `QuantifySets.tsx` + 2 test (8+11) + wiring QuantifyPage (state qb/editId, openBuilderFor thread id, render thật thay stub). Đọc lại toàn bộ: setQ normalize sau MỌI field (130-135); live sentinel 'qb-live' tách khỏi save (148-157); payload save tường minh + merge note (163-173); sec-filter avail load-bearing (268-270). tsc 0 lỗi, **vitest 171/171** (22 file).
  - ✅ **Opus fix ngoài scope worker flag**: series (q5-q8,q15) vẫn hiện nút "Sửa" → no-op (builder chỉ sửa show). Guard `item.kind==='show'` ở QuantifyLibrary.tsx + QuantifyDetail.tsx (port qActions proto 2432). Vẫn 171/171.
  - ✅ **Live-verify chrome-devtools (cả 2 màn)**: Builder — by-picker loại đúng show hiện tại + non-evAttr dim; chọn by → ẩn "Kiểu chart", live thành CrossTable ma trận + caveat "N mẫu bằng chứng — tập mẫu". Composer — 2 nhóm; set khóa chỉ "Nhân bản để sửa"; dropdown "＋ Thêm khối" lọc @-block đúng sec (voc≠cxm) verify trực tiếp; ↑/↓ disable đầu/cuối.
- ✅ **P1.4 UX redesign (owner 01/08, skill ui-ux-pro-max) XONG** — cài skill `ui-ux-pro-max` (MIT) vào `~/.claude/skills/` (search.py chạy qua hermes python, đã smoke-test). Worker Sonnet + Opus certify + live-verify:
  - (a) **Filter sau nút**: `QuantifyFilterButton.tsx` — nút "Bộ lọc" + badge đếm tiêu chí active + popover (đóng click-ngoài/Esc/"Xong"); QuantifyFilterBar tái dùng nguyên trong popover. Live: popover ẩn search+chip khi đóng, badge hiện khi lọc.
  - (b) **Card gọn**: `QuantifyLibrary` card chỉ 3 nút Xem chi tiết (primary cam) / Sửa (chỉ show) / Xóa (danger crit, ml-auto). Dời CountFilter + toggle Chart/Bảng → `QuantifyDetail`; bỏ Nhân bản khỏi card (vẫn ở detail). hover:shadow-lg.
  - (c) **Modal xóa giữa màn**: `design-system/Modal.tsx` (portal→body, backdrop blur+click-close, Esc, focus initialFocusRef, scale+fade motion-reduce, role=dialog). Page-level `deletingId`; nhánh CHẶN (usedBy>0 → reason + "Đóng") vs TỰ DO (Hủy/Xóa danger, confirm auto-focus). Live-verify cả 2 nhánh: "Volume theo Theme" → chặn "đang dùng ở 1 set: b-voc-topic"; "Volume theo Category" → "Xóa vĩnh viễn? Không thể hoàn tác."
  - Design tokens VND giữ nguyên (verify `primary.soft`/`crit.bg` tồn tại trong tailwind.config + index.css); logic filter/mutation bất biến. **tsc 0 lỗi, vitest 194/194** (24 file; +Modal/FilterButton test, cập nhật Library/Detail/Page test).
- ✅ **PHASE 1 (Quantify) ĐÓNG** — 4 màn con (lib/detail/build/sets) full tính năng trên store, mọi mutation giữ validateFixture rỗng. Owner: "làm full ... r sẽ chỉnh sửa sau" → chờ owner góp ý tinh chỉnh. KHÔNG render Overview (@-block body = Phase 2).
  - Deferred vẫn treo: #8 qCrossBars stacked-bar cho cross+chart-view (giờ builder cross-tab luôn ra CrossTable cho cả 2 view — note trong builder đã hứa "stacked bar (View Chart)" nhưng chưa dựng); ô "Tên chart" tạo-mới dùng placeholder=autoName thay vì pre-fill value (UX nhỏ).

## Tiến độ Phase 2 — Overview (bắt đầu 01/08)
Charter: `docs/superpowers/specs/2026-08-01-phase2-overview-charter.md` (flow inventory F1-F8, 4 section, **P2 oracle map 10 assertion suy lại từ seed** — harness §2b chỉ assert `length>=300` nên pass được trên rác).
- ✅ Baseline xác nhận trước khi code: `npx tsc -b` 0 lỗi, `npx vitest run` 194/194 (24 file).
- ✅ **Owner chốt 2 quyết định (01/08)**:
  - **D1 `@coverage`**: prototype có LỖI THẬT — rows là `obs.cov` (đơn vị %) nhưng `rankBars` render `nf(fx(v))` → độ phủ 85% paint thành "476" (nhân factor volume 5,6). Chốt: `web/` render **raw %**, không áp `fx` (tiền lệ `qCrossTable` raw-nf ở P1.1b). **KHÔNG sửa prototype** (bản live) → defect ghi ở follow-up #10.
  - **D2 phạm vi**: **backfill data contract ngay**, làm đủ 9/9 block (không defer @intent/@topictrend).
- ✅ **Oracle ngoài cho S2.0 dựng xong (scratchpad, trước khi worker chạy)**: `extract-tax.js` (bootstrap DOM stub port từ `_harness.js` → chạy prototype trong `vm`, xuất `DATA.tax`+`DATA.cats` ra JSON authoritative) · `dump-seed.cjs` (require `seed.ts` qua `jiti` có trong web/node_modules) · `compare-tax.cjs` (diff từng field, map `p`→`parentId`). Kết quả baseline: **50 hàng tax khớp số lượng, nhưng thiếu 203 giá trị field** (`cat`/`pts`/`why`/`up`/`by`/`drift`/`driftNote`/`demo`) + **`CxmData.cats` chưa tồn tại**. 14 theme đều cần `cat`+`pts`, 8 theme `demo:true`, 3 node có `drift`.
- ✅ **Sinh code thay vì sao chép tay**: `gen-tax-ts.cjs` sinh block `tax:`+`cats:` TS từ JSON authoritative (66 dòng) → loại bỏ rủi ro worker paraphrase/truncate 203 giá trị prose+date. Certify = chạy lại `compare-tax.cjs`, không đọc mắt.
- ✅ Token `--crit/--watch/--ink2/--good` (màu `cats`) đã có trong `web/src/index.css:22-35` — không cần thêm palette.
- ✅ **S2.1a XONG (worker Sonnet, Opus certify độc lập)**: `design-system/{Stat,Badge,CatChip,Note,AxisLabel,Sparkline}.tsx` + test, và `Bars` thêm `total?`/`onRowClick?`/`kids?` + **khôi phục tooltip `title`** (bản React trước đã bỏ → `total?` sẽ là prop chết). `CatChip` nhận label+color qua props nên độc lập S2.0.
  - Certify: tsc 0 · vitest **223/223** · không `any` · **scope đúng** (mtime cho thấy 4 file `features/quantify/*`+`Modal.test` là của phiên P1.4 lúc 22:29-22:30, worker chỉ ghi 23:13-23:23 trong `design-system/`) · `ST_LABEL` khớp verbatim proto 1501 · `.chip` = `surface2`/`2px 8px` đúng · token Tailwind (`watch-bg/crit-line/primary-soft/primary-line`) đều tồn tại · test non-vacuous (assert chuỗi tooltip chính xác + assertion ÂM cho role/tabIndex).
  - Lệch có chủ ý (worker khai): `.st.unknown` gốc dùng `border-color:#A8A29E` — hex KHÔNG thuộc token nào, worker dùng `--ink3` thay vì bịa hex. Chấp nhận.
- ✅ **`Bars.formatValue?` (Opus tự thêm — hệ quả D1)**: ghi đè cách in giá trị cho CẢ số trên thanh LẪN tooltip, để `@coverage` in `85%` thay vì `476`. Chọn 1 callback thay vì thêm enum mode; thứ tự ưu tiên `formatValue > pctMode > nf(fx(v))`. 3 test mới, gồm 1 test khẳng định tooltip KHÔNG nói số khác thanh.
- ✅ **S2.0 XONG (Opus tự làm, oracle-certified)**: `TaxNode` thêm `why/up/by` **required** (50/50 node proto đều có) + `cat?/pts?/driftNote?/demo?`; `CxmData.cats` required; seed patch bằng **code sinh** (12.106 ký tự thay 5.131); `validate` nhóm 8 thêm 3 kiểm (theme phải có `cat` ∈ `cats`, `pts` ≥ 2 kỳ, `drift`↔`driftNote` đi cặp) + nhóm 9 thêm `ev.cat` ∈ `cats`; **5 negative test mới**.
  - Certify: `compare-tax.cjs` → **PASS, khớp prototype từng field** · tsc 0 · vitest **231/231** · positive test `validateFixture(seed)` vẫn rỗng.
  - Lưu ý kỹ thuật: `seed.ts` có **line ending trộn** (CRLF chỗ khác, vùng `tax` dùng LF) → patch phải khớp bằng regex `/\r?\n  \],\r?\n/`. Không normalize cả file (ngoài scope). Backup ở `scratchpad/seed.ts.bak`.
- ✅ **S2.3 XONG (worker Sonnet, Opus certify độc lập)**: `features/overview/blocks/{TopPriority,JourneyState,Coverage,Lanes,Outcomes}Block.tsx` + 5 test + barrel. Component THUẦN (nhận `data`/`cfg`/`onGo` qua props, không đọc store). tsc 0 · vitest **263/263** (231 cũ nguyên vẹn + 32 mới) · không `any` · scope đúng (mtime 23:45-23:57 chỉ trong `blocks/`).
  - **Opus suy lại TOÀN BỘ số bằng oracle riêng (jiti + seed + domain/state), khớp 100% report**: covMin=70 → dưới ngưỡng đúng `s3`(64) và `s5`(58), `s2`=71 nằm trên · stepState `ok watch crit ok watch ok` → crit 1/watch 2/ok 3, tổng 6 = `steps.length` (khớp bất biến đã ghi ở Phase 0) · worst = `s3` failed 2650 · flows 32/observed 1 → gap 31 · out 2 (improved+inconclusive), released 2 → "0 chưa đo" · loop 1/3 · lanes assign 1/approve 2/fix 1/verify 2 = tổng 6 · toppri thứ tự KHÁC nhau thật: aff→CXI-024, hv→CXI-021, reg→CXI-013.
  - Bất biến nội dung verify từng chuỗi: 3 ghi chú "Thay cho Sum(LTV)" / "Thay cho Impact on NPS" / "Không có trong mô hình VoC…" đủ và verbatim · "Chưa kết luận được" · "⚠ N yếu tố nhiễu chưa loại trừ" · "chủ ý, không phải mất dữ liệu" · tooltip chip = `stepWhy(o,cfg)` · `cfg.step.covMin` đọc từ cfg, không hardcode.
  - **D1 thực thi đúng**: `CoverageBlock` dùng `Bars.formatValue={(r)=>`${r.v}%`}` + `total={600}` (chỉ vào tooltip), có test khẳng định KHÔNG xuất hiện số đã nhân fx().
  - Nợ mới ghi ở follow-up #5 (vế `lc!=='closed'`).
  - UX nit worker nêu (không sửa): trên seed này `@outcomes` in "**0** thay đổi đã phát hành nhưng chưa có kết quả đo" — đúng dữ liệu (released 2 == out 2), prototype cũng vậy; đọc hơi lạ, chờ owner quyết có ẩn dòng khi = 0.
- ✅ **S2.1b XONG (worker Sonnet, Opus certify độc lập)**: `design-system/{SrcMatrix,AnomalyLanes}.tsx` + test + barrel. tsc 0 · vitest **275/275** (263 cũ + 12 mới) · scope đúng (mtime 00:09-00:12 chỉ trong `design-system/`) · không `any`.
  - **Opus suy lại bằng oracle riêng, khớp 100%**: 7 nguồn; `sourceHealth` non-ok = `src-survey`(stale) + `src-zalo`(down); `pf:[]` = `src-broker` + `src-zalo` — **nguồn `down` CHÍNH LÀ nguồn không gắn nền tảng nào**, đúng lý do comment gốc 3565-3569 nói cột "Trạng thái" là bắt buộc chứ không phải trang trí. Findings: voice 3 (AF-04,05,07) · behaviour 1 (AF-03) · pipeline 2 (AF-01,02) · null 1 (AF-06) = 7. **AF-03 tiêu đề "Volume lỗi liveness vượt baseline 2,4 lần" nhưng lane = `behaviour`** → đúng cái bug regex mà comment 2362-2365 cảnh báo, đã có test chặn.
  - Deviation #1 worker khai + **Opus xác minh đúng**: `.srcmx .mk.ok/.stale/.down/.na` có scope dưới `.srcmx` (proto 264-266) nhưng `.lgd` nằm NGOÀI `<table class="srcmx">` → legend prototype thật sự render dấu ●◐✕– không màu. Worker tô legend theo cùng map health. Cosmetic-only, không đụng logic dữ liệu. Chấp nhận.
  - **Còn treo tới live-check S2.4**: dấu `–` (not-applicable) gốc dùng `#C6CDD2` (xám lạnh nhạt) — không token nào khớp (`--ink3`/`--unk` đều `#8c8681`, `--line` `#e5e1db`). Worker dùng `text-ink-3` theo tiền lệ `Badge`, nên dấu `–` sẽ ĐẬM hơn ý gốc (nhìn ngang hàng nội dung thật). Quyết ở live-check khi thấy ma trận thật; nếu cần thì thêm 1 token cho dấu na.
- ✅ **S2.2 XONG (worker Sonnet, Opus certify độc lập)**: `blocks/{SrcMatrix,Intent,AnomalyLanes,TopicTrend}Block.tsx` + 4 test (35 test mới) + barrel giữ 5 export cũ. tsc 0 · vitest **310/310** · scope đúng (mtime 00:22-00:29 chỉ trong `blocks/`) · không `any`.
  - **Opus suy lại bằng oracle riêng, khớp 100%**: `@srcmatrix` 2 nguồn hỏng (In-app survey stale · Zalo OA inbox down) → metric bị ảnh hưởng hợp nhất qua `Set` = `m-ces`,`m-repeat` = 2 · `@intent` complaint 5/help 3/improvement 3/praise 3 = 14 theme · `@anomlanes` 6 finding có lane · `@topictrend` 14 hàng, 9 "tăng xấu", 8 `demo`, 1 theme có `drift` (`x-th-status/duplicate`), `x-th-guide` themeStep=`s2`→`CXA-013` = "✓ 1 đã phát hành", `x-th-slow` themeStep=`null`→0 fix.
  - `TopicTrendBlock` nhận `selectedLines?`/`onToggleLine?` qua props (page sở hữu selection) — **KHÔNG dựng chart đường**, đúng ranh giới (chart đường = Phase 5 `vocjourney`).
- ✅ **S2.4 XONG (worker Sonnet, Opus certify + live-check)**: `features/overview/{sec.ts,SetChips,SetMeta,CustomBanner,OverviewPage,index}` + wire `App.tsx` (route `/cxm`, `/voc`, `/cxm/:setId`, `/voc/:setId`, stub `/issue/:id`, `/topic/:id`). tsc 0 · vitest **326/326** (đúng 310 cũ + 16 mới: OverviewPage 9 + sec 7, KHÔNG test nào bị xóa) · `npm run build` xanh (82 module).
  - `App.test.tsx` sửa ngoài scope nhưng **chính đáng**: nó assert đúng chữ `Placeholder` mà section này thay. Bản mới assert NHIỀU hơn (kick label + tên set mặc định), không bị làm yếu.
  - `dangerouslySetInnerHTML` dùng **đúng 1 chỗ** cho `qq.sub` (HTML do người viết fixture soạn, có `<a href="#/...">` thật cần chạy với HashRouter) — có comment ranh giới tin cậy. `SEC.intro` để text thường vì là hằng tự viết, không có link → không mở thêm bề mặt rủi ro.
  - `OverviewPage` nhận prop `useStore?` (mặc định singleton) để test được với `createCxmStore(new MockRepository())` — lệch có chủ ý so với `QuantifyPage`.
- ✅ **PHASE 2 ĐÓNG — LIVE-CHECK chrome-devtools (khổ 1512×950) khớp oracle từng số**:
  - `#/cxm`: h1 "6 điểm gãy chưa khép vòng, **3** hành động đang chờ…" (oracle `ap==='pending'` = 3) · 4 block `@journeystate/@toppri/@lanes/@outcomes` · Stat tiles **1 crit / 2 watch / 3 ok / 31 flow chưa đo** đúng y oracle · chip `03 Liveness` viền crit 16,7%, `02`+`05` viền watch · note "14.840 lượt thất bại" = `fx(2650)`.
  - `#/voc`: h1 "**317.699** bản ghi phản hồi từ **7** nguồn, **2** nguồn đang có vấn đề" — `fx(56732)`=317699 khớp oracle · 8 block (trộn @block VÀ widget Quantify q14/q2/q9/q10/q15 → dispatcher đúng cả 2 loại) · `SrcMatrix`: `Zalo OA inbox` 4 dấu `–` + "✕ Ngừng gửi" đỏ (đúng kịch bản comment 3565-3569 cảnh báo), note crit liệt kê đúng 2 nguồn + "2 chỉ số bị sai".
  - `#/voc/b-voc-topic` (**share-by-URL**): chip "Topic đang xấu đi" active, `@topictrend` 14 hàng / 14 sparkline / **8 badge "Dữ liệu demo"** / "✓ 1 đã phát hành" — khớp oracle.
  - `#/cxm/set-khong-ton-tai-999`: **fallback về set def "Điều hành CX"**, không throw, không "Không tìm thấy màn".
  - **Không banner đỏ · không chuỗi `blkx` · không "undefined"/"NaN" · console 0 error/warn** ở mọi màn.
  - **CHỐT việc treo từ S2.1b**: dấu `–` dùng `ink-3` NHÌN THẬT thì lùi rõ so với ●/◐/✕ có màu, thứ bậc thị giác đúng → **giữ `ink-3`, KHÔNG thêm token** cho hex #C6CDD2. Đóng mục treo.
  - **Cảnh báo giả đã loại**: thấy cuộn ngang + card bị cắt ở cửa sổ 1036px → truy ra `min-width:1280px` có ở **CẢ** `web/src/index.css:48` VÀ prototype dòng 80 (app cố ý desktop-only, port trung thành Phase 0). Ở ≥1280px: 0 phần tử vượt viền, không cuộn ngang. **Không phải defect — đã KHÔNG "sửa" thứ không hỏng.**
  - Nền graph-paper là `body linear-gradient` trong index.css (có từ Phase 0), không phải thứ S2.4 thêm.
- ✅ **SEAM compose→render đã ĐI QUA LIVE (advisor chỉ ra thiếu — đúng, vì đó CHÍNH LÀ yêu cầu gốc "render các set đã compose ở Quantify")**. Trước đó chỉ test 2 nửa riêng lẻ: P1.3 chứng minh composer GHI `boards`, S2.4 chứng minh Overview ĐỌC `boards`, nhưng chỗ nối chưa chạy lần nào.
  - Phân tích code loại được rủi ro sparse-array: `mock-repository.ts:168` lazy-copy **toàn bộ** câu hỏi (`set.qs.map(q => q.b.slice())`) rồi mới ghi 1 index → overlay luôn dense; thêm nữa `OverviewPage.tsx:122` dùng `boards[cur.id]?.[qi] ?? cur.qs[qi].b` → fallback theo TỪNG câu hỏi. An toàn 2 lớp.
  - `onGo` verify đủ 9/9 block (OverviewPage dòng 56,58,60,66,72,74,76,78,80) — nếu sót 1 thì block đó render đẹp mà bấm không làm gì, không test nào đỏ.
  - **Đi live**: `#/quantify` → Quản lý set → thêm `@toppri` vào 1 câu của `b-cxm-pilot` (set sửa được) → `#/cxm/b-cxm-pilot`: `@toppri` xuất hiện đúng 1 lần, **cả 3 câu hỏi vẫn render đủ** (thân khối 833 / 481+1742 / 177+266 ký tự), chip có dấu `•`, banner custom hiện, không banner đỏ → **"Trả set về mặc định"**: banner mất, dấu `•` mất, `@toppri` biến, mọi khối vẫn render, **KHÔNG banner đỏ** (bất biến "validate rỗng sau MỌI mutation" giữ).
  - **Quét cả 6 set live** (bản live của harness §2b:118-119, thứ mà chính ta đã phê là quá yếu khi đứng một mình): 31 khối, **0 khối rỗng** (thân ngắn nhất 177 ký tự), 0 "không tồn tại", 0 banner đỏ, 0 `undefined`/`NaN`. Lần đầu thấy THÂN thật của `@intent`/`@anomlanes`/`@lanes`/`@outcomes` (trước đó chỉ đếm div bọc). **Đủ 9/9 @block.**

### Lỗ hổng phủ của seed (phát hiện ở S2.2 — bổ sung "tiêu chí phủ" §Set data mẫu)
Worker khai trung thực, Opus xác nhận bằng oracle: 2 nhánh logic KHÔNG có dữ liệu thật để test, phải dùng data tổng hợp cục bộ trong test:
1. **Không nhóm intent nào có >6 theme** → nhánh cắt Top-6 của `@intent` chưa được seed thật phủ (complaint nhiều nhất chỉ 5).
2. **Cả 3 theme `praise` đều tăng** (`praise giảm = 0`) → nhánh "praise giảm phải tô crit" (quy tắc `cat!=='praise' ? d>0 : d<0`) chưa được seed thật phủ.
Nếu mở rộng seed sau này: thêm 2 theme complaint nữa + cho 1 theme praise chuỗi `pts` giảm. Cùng loại với follow-up #3 (seed thiếu ev multi-valued taxonomy). (OverviewPage + route `#/<sec>/:setId`, **URL là source of truth của set đang xem, KHÔNG thêm store field**).
- **Live-check chrome-devtools hoãn tới S2.4** — trước đó chưa có màn nào render các primitive/block này nên không có gì để bấm.

## ⚠ QUYẾT ĐỊNH OWNER 01/08 — Overview + Card (ĐỌC TRƯỚC KHI SỬA 2 MÀN TỔNG QUAN HOẶC `Card`)
**Bài học quy trình:** Phase 2 ban đầu build ĐỦ 9 block + hero + meta, LỆCH quyết định đã khóa ở `docs/REDESIGN-PLAN-HANDOFF.md:13,27,29` ("từ export của owner"). Nguyên nhân: đi theo dòng "9 @BLOCKS" ở bảng Phase 2 mà KHÔNG mở file handoff, dù chính plan này liệt kê nó ở Critical files. **Từ nay: mỗi màn phải discuss + owner chốt TRƯỚC khi code** (owner yêu cầu tường minh 01/08). Artifact bàn: `output/overview-reconcile-decisions.html`.

### Cắt/giữ (nguồn: REDESIGN-PLAN-HANDOFF.md:27,29)
- **CXM overview CẮT**: `hero`, `setbar.meta`, `@lanes`, `@outcomes`. GIỮ: `setbar.chips`, `@journeystate`, `@toppri`, `@coverage`, savedq, footer link.
- **VoC overview CẮT**: `hero`, `@anomlanes`, `@topictrend`.
- Lý do cắt 4 block = **TRÙNG màn khác** (lanes/outcomes↔Work, anomlanes↔Cảnh báo, topictrend↔Topics) → **KHÔNG xóa code**, Phase 3/5/6 dùng lại.
- `b-cxm-exec` còn 3 câu: `@journeystate` · `@toppri` · `@coverage` (dời từ `b-cxm-pilot`). `b-voc-all` câu "Cái gì đang bất thường?" còn `['q15']`.

### Q1-Q4 (owner chốt 01/08)
- **Q1 time filter = đường (a)**: bỏ hero, thay bằng segmented `3 tháng · 6 tháng · 1 năm` (style port `rangeToggle()` proto 3817-3821). **CHỈ 3 mốc** — Enterpret có 7D/14D/4W vì họ có dữ liệu ngày; seed ta chỉ có 3 kỳ + chuỗi 6 điểm tháng, thêm mốc ngày là bịa. Range **chỉ áp lên chuỗi thời gian THẬT** (series Quantify, `tax.pts`), theo đúng `monthly(t).slice(-months)` (proto 3828) = lấy N tháng cuối, KHÔNG nội suy. **TUYỆT ĐỐI KHÔNG đổi hệ số `fx()` theo kỳ** (đó là lý do commit `faeb871` gỡ kỳ global; benchmark xếp "time range là ngoại suy snapshot" vào lỗi P0). Card snapshot PHẢI hiện dấu "ảnh chụp · 6 tháng gần nhất", nếu không user bấm mà card không đổi sẽ tưởng hỏng.
- **Q2**: giữ 4 set không-khóa, user thêm/sửa/xóa — **đã đúng sẵn**, `mock-repository.ts:6` chỉ khóa `b-cxm-exec`+`b-voc-all`.
- **Q3**: giữ cả 9 block trong `data/blocks.ts` để compose được.
- **Q4**: `VOC_SCOPE` giữ `'all'` nhưng **đổi nhãn** "bản ghi phản hồi" → **"tín hiệu khách hàng"**. Lý do: `all` = 56.732 thô (hiện 317.699 sau fx) mà **95% là event hành vi** (Digital analytics 41.200 + eKYC SDK 12.800), không có lời khách → gọi "phản hồi" là nói quá. Đối chiếu ảnh Enterpret: "165,672 Feedback Records" của họ toàn kênh có lời khách, không có stream analytics. Opus tự thêm chữ "khách hàng" để không trùng nghĩa với `data.signals` (signal instrument hoá) — owner chưa phản đối.
  - `voice` để tham chiếu: 5 nguồn, 2.732 thô → 15.299 sau fx.

### Card layout = Enterpret (owner chốt 01/08, từ ảnh sản phẩm của họ)
**Áp CẢ APP** (Overview + Quantify) → **đảo quyết định P1.2a-fix** ("mọi điều khiển vào `Card.footer`"). Owner biết và chấp nhận phải làm lại phần card Quantify (P1.4).
1. **Điều khiển LÊN header**: icon phễu + `⋮` (cần tooltip vì icon-only kém rõ). Footer không còn là chỗ chứa điều khiển.
2. **Dải xám full-width dưới header** = "Hiện Top N / M <đơn vị>" + **mẫu số** ("· trên tổng 317.699 tín hiệu"); phần "95% là event hành vi" để tooltip. Thay chip `CountFilter` ở footer.
3. **Nhãn trục Y quay dọc bên trái**, chỉ mang ĐƠN VỊ ("Số tín hiệu khách hàng") — vì quay dọc không đủ chỗ cho mẫu số, nên mẫu số dời sang dải xám (đúng cách Enterpret tách).
4. **Số trên bar: viết tắt K, đặt BÊN PHẢI bar** (`41.200` → `41,2K`, vi-VN dùng dấu phẩy thập phân). **Chỉ áp cho nhãn giá trị của bar** — donut center và trục Y line chart giữ số đầy đủ (đúng ảnh: donut "165,672", trục line "18000/13500/9000").
5. Giữ nguyên: kỳ tuyệt đối ở `Card.subtitle` (đã khớp Enterpret), donut tâm số lớn + legend "% tên" (đã khớp).
6. Còn thiếu, chưa chốt: stepper `← Time-Range (…) →` dưới line chart; legend "Others (+5)" cho line/bars.

### ✅ S2.5 XONG — áp quyết định owner vào Overview (worker Sonnet + Opus certify + 2 fix)
Certify: `npx tsc -b` 0 lỗi · `npx vitest run` **352/352** (44 file; baseline 326 → +26) · `npm run build` xanh.
- Đã làm: cắt hero (kick+h1+intro) & `SetMeta` (xóa file, dead code) · `OverviewFilterBar.tsx` segmented `3/6/12 tháng` + nhãn kỳ tuyệt đối đọc từ `data.periods` + "Đặt lại" · range chỉ áp `item.kind==='series'` (qua `QuantifyWidget.months`, slice `-months`, KHÔNG nội suy) và sparkline/Thay-đổi/rising của `TopicTrendBlock` · **8 block snapshot hiện `Ảnh chụp · <kỳ>` ở `Card.subtitle`** · nhãn → "tín hiệu khách hàng" + mẫu số · `b-cxm-exec` còn 3 câu (`@journeystate`/`@toppri`/`@coverage`), `b-voc-all` q3 còn `['q15']`.
- **Nhãn trục agg cuối cùng (Opus verify bằng oracle)**: `Số tín hiệu khách hàng · trên tổng 317.699 từ 7 nguồn (hành vi + tiếng nói)`. Report của worker ghi "317.659" — **typo trong report, code đúng** (`nf(fx(scopeTotal(data)))`, fx(56732)=317699).
- **Opus fix #1 — vi phạm phân lớp**: worker cho `design-system/QuantifyWidget.tsx` import ngược từ `features/overview/sec.ts` (comment còn ghi sai là "theo yêu cầu owner"; contract cho 2 đường, worker chọn đường sai). Đã **dời `VOC_SCOPE`/`scopeSources`/`scopeTotal` → `web/src/domain/scope.ts`** (hàm thuần trên `CxmData`, đúng chỗ); `sec.ts` re-export để giữ API; sửa import ở widget + test; dọn `Source` mồ côi ở `sec.ts`. **`grep features/ src/design-system/` giờ chỉ còn comment.**
- **Opus fix #2 — copy hỏng do việc cắt sinh ra**: câu `Cái gì đang bất thường?` của `b-voc-all` vẫn tả "Ba làn — …" dù `@anomlanes` đã cắt. Đổi thành "Bất thường theo Z-score qua các kỳ. Ba làn (tiếng nói · hành vi · ống dẫn dữ liệu) xem ở Cảnh báo & giám sát" — giữ con trỏ tới nơi 3 làn thật sự sống (đúng lý do de-dup).
- Worker tự khai (đáng ghi nhận, không giấu): sửa `App.test.tsx` ngoài scope vì nó assert đúng `overview-kick` bị xóa (**Opus xác nhận: chính đáng, giữ**) · retarget 2 stop `seedTour` trỏ vào block đã cắt (`blk-@outcomes` /cxm, `blk-@anomlanes` /voc) — latent runtime break thật, nhưng **nó cũng viết lại tiêu đề/mô tả tour** (ngoài scope, owner nên đọc lại 2 stop đó).

### ⚠ CÒN MỞ, cần owner xem khi tiện (không chặn S2.6)
1. **`1 năm` hiện là no-op**: mọi chuỗi thật trong seed đúng 6 điểm nên `slice(-12)` ≡ `slice(-6)`. Worker thêm caveat **suy ra** (không hardcode) khi range vượt `maxRealMonths(data)`. Cách sửa gốc: mở rộng seed lên 12 điểm, hoặc bỏ mốc `1 năm`.
2. **`TopicTrendBlock` tiêu đề vs cột lệch nhau**: title lấy từ registry `blocks.ts` = "Topic & xu hướng **6 kỳ**" (tĩnh), còn header cột động theo range → chọn `3 tháng` thì title nói "6 kỳ" mà cột nói "3 kỳ". Sửa: bỏ "6 kỳ" khỏi tên registry, hoặc cho title động.
3. `BASE_LABEL`/`BASE_RANGE` ở `sec.ts` giờ chỉ còn test dùng (hero là caller duy nhất, đã cắt). Giữ lại có chủ ý, không phải rác do S2.5 sinh.

### ✅ S2.6a XONG — tầng design-system + Overview (worker Sonnet + Opus certify + 1 fix)
Certify độc lập: `npx tsc -b` 0 lỗi · `npx vitest run` **372/372** (47 file; baseline 352 → +20) · `npm run build` xanh.
- Đã làm: `nfK()` (`41200→"41,2K"`, `999→"999"`, `1050→"1,1K"` — Opus kiểm lại bảng biên) · `Card` thêm `actions?`/`denomStrip?` và **XÓA `denom?`** (slot phải-header cũ; `actions` chiếm đúng góc đó, 9 caller đã migrate) · `Bars` grid `label|value|bar` → **`label|bar|value`** + nhãn giá trị `nfK`, tooltip GIỮ `nf` số đầy đủ (hai mức chính xác, không phải bất đồng) · `VAxisLabel.tsx` mới (tách riêng thay vì nhồi vào `Bars` — donut/line/anomaly cũng cần, Opus chấp thuận lệch spec) · `QuantifyWidget` tách `axisLabel()` → `axisUnit()` + `buildDenomStrip()`.
- **Opus fix — `dim.label` vs `dim.unit`**: worker đếm bằng `dim.label` nên dải denom ra câu vô nghĩa `"Đang hiện Top 10 trên 14 Theme · vì sao · trên tổng …"`. `Dim` có CẢ hai (`seed.ts:686` → `label:"Theme · vì sao"`, `unit:"theme"`). Đã đổi sang `dim.unit` + thêm assertion `not.toHaveTextContent("vì sao")`. Cũng khôi phục cụm **`từ N nguồn`** mà contract của Opus làm rớt — đó là provenance owner chốt ở Q4, mẫu số 317.699 không tự nói nó gộp cả event hành vi.
- Worker khai trung thực: đơn vị trục series hợp nhất (line/trend trước là "Giá trị theo kỳ" → nay "Số tín hiệu khách hàng theo kỳ") — **đúng contract nhưng là khẳng định về đơn vị đo, cần rà lại theo D1**; card cross-tab không có dải xám.

### 🎨 Palette — owner giao Opus tự quyết (02/08): "tự tạo pallete màu đi… chốt theo hướng của bạn"
Đã thêm vào `web/src/index.css` + `web/tailwind.config.js`, **thuần bổ sung, không đổi token nào đang có**:
- `--cat-1..5` (`#3b5ea8` indigo · `#6f4a9c` tím · `#a3436b` hồng đất · `#2f7d6a` lục lam · `#5a6570` xám lam) + `--cat-other` (`#b8b2ac`). Contrast ≥ 4,9:1 trên `--surface`; `--cat-other` chỉ làm nền thanh/lát (2,2:1, không cho chữ).
- `--info`/`-bg`/`-line` (`#2c5f8a`) — tone thứ 5 cho `Note tone="info"` + nhãn in-development/placeholder (`REDESIGN-PLAN-HANDOFF.md:28` đã khóa việc này mà chưa có token).
- **Quy tắc phải enforce**: thang `cat` KHÔNG BAO GIỜ mang nghĩa trạng thái. Hue tách hẳn khỏi cam ~15° / đỏ ~5° / hổ phách ~40° / ô-liu ~75°.
- Opus **không** thêm accent teal cho tiêu đề card như Enterpret: ở họ tiêu đề card *là link*, ở ta link đã là cam → teal không-phải-link gợi sai affordance. Màu không có việc rõ ràng thì không thêm.

### 📐 Chuẩn design mới: `docs/ENTERPRET-DESIGN-NOTES.md` (02/08, owner yêu cầu "note lại cách enterpret thiết kế để áp dụng cho all màn")
Đọc từ 2 ảnh sản phẩm owner cung cấp. **Đọc file này trước khi thiết kế bất kỳ màn nào.** Nội dung: bố cục trang · thanh lọc · section = 1 câu hỏi · anatomy card · **quy tắc nhãn trục** · bar ngang · line/anomaly · màu · chữ&số · cái ta chủ ý không copy · 12 khoảng cách so với app hiện tại.
**Phát hiện quan trọng nhất — spec S2.6 `R3` SAI**: Enterpret không đặt "đơn vị lên trục dọc". Họ đặt nhãn theo đúng thứ trục đó mã hoá — bar ngang: trục dọc = **tên chiều**, đáy căn giữa = **đơn vị đo**; line: trục dọc = **đơn vị đo**. S2.6a đã implement theo spec sai → cần sửa (quyết định D1).

### 🚨 DEFECT D0 (Opus phát hiện 02/08 khi lấy số thật cho artifact) — nghiêm trọng hơn `@coverage`
`seed.ev.length = 17`. Chart `q3 Volume theo Category` có 4 hàng tổng đúng 17 (9/3/3/2). Nhưng `Bars` in `nfK(fx(v))` **vô điều kiện** → "Khiếu nại" hiện **50**. `fx()` (×5,6) hợp lệ cho **volume tổng hợp** (snapshot → ước lượng 6 tháng); KHÔNG hợp lệ cho tập bằng chứng **liệt kê được** (`base='ev'`) hay số khách trong cohort (`base='cust'`). Khác `@coverage` ở chỗ: `@coverage` nhìn là biết sai (85% → 476), cái này **trông hoàn toàn hợp lý** nhưng bấm vào sẽ đếm được 9. Hướng sửa đề xuất: chỉ `fx()` khi `base==='agg'`.

### ✅ OWNER CHỐT 02/08 09:30 — D0..D10 = **a** (toàn bộ đề xuất của Opus)
Nguồn: export từ `output/card-chart-design-decisions.html`. **Quyết định khóa, không tự diễn giải lại.**

| | Chốt | Ý nghĩa |
|---|---|---|
| D0 | a | `fx()` **chỉ** khi `base==='agg'`. `ev`/`cust` in số thô (tập đếm được, không phải snapshot để ngoại suy) |
| D1 | a | Nhãn trục theo thứ trục đó mã hoá — bar ngang: dọc=`dim.label`, đáy=đơn vị đo; line: dọc=đơn vị đo |
| D2 | a | Thanh dày tự điều chỉnh: 42px khi ≤3 hàng, 26px khi >3 |
| D3 | a | Số ở **cột cố định** căn phải (**cố ý KHÔNG theo Enterpret** — họ bám đầu thanh; ta ưu tiên quét dọc cột) |
| D4 | a | Bỏ chấm màu dẫn đầu nhãn (thanh đã mang màu) |
| D5 | a | Màu = trạng thái khi hạng mục CÓ trạng thái; còn lại dùng thang `cat`. `cats` thôi vay `--crit`/`--good` |
| D6 | a | Donut: 5 lát lớn nhất + gom đuôi "Khác (+N)" màu `--cat-other` |
| D7 | a | Câu hỏi section 20-22px đậm ngoài card; tiêu đề card 13,5px |
| D8 | a | Mở rộng seed lên 12 điểm/chuỗi |
| D9 | a | Trả lại MỘT dòng provenance cho set (`DashSet` đã có sẵn `owner` + `up` — **không cần field mới, không bịa tên người**) |
| D10 | a | Badge số điều kiện đang lọc trên thanh lọc |

**Owner giao Opus toàn quyền màu** (02/08: *"cho phép tự chốt màu sắc"*; trước đó *"tự tạo pallete màu đi… chốt theo hướng của bạn"*). Hai tinh chỉnh Opus tự quyết, owner đã xác nhận:
1. **Màu mã hoá INTENT, không mã hoá thứ hạng.** Mockup tô `cat-1..5` theo thứ tự hàng — nhưng thứ hạng đã nằm ở ĐỘ DÀI THANH, tô thêm theo thứ hạng là màu trang trí. Theme node có sẵn `cat` → màu chạy theo intent, mọi theme "khiếu nại" cùng màu. Chữa luôn việc 13/14 hàng `q1` đang xám.
2. **`SEN_COLOR` (sentiment) GIỮ màu ngữ nghĩa** — ngoại lệ có chủ ý của quy tắc "cat không mang nghĩa trạng thái". Sentiment có valence thật, Enterpret cũng tô vậy (ảnh B).

Owner xác nhận **prepend**: 6 điểm cũ giữ nguyên xi ở cuối mảng, chỉ thêm 6 điểm TRƯỚC đó → mọi số ở mốc 3m/6m không đổi, oracle đã certify vẫn đứng.

### 📋 Slice thực thi (tuần tự, MỘT writer tại một thời điểm)
- **S2.7** ✅ **XONG + ĐÃ CERTIFY (02/08)**: D8a + D5a + bỏ "6 kỳ". `tsc` 0 · **372/372** · build xanh · `validateFixture` 0.
  - Oracle độc lập (`scratchpad/verify-s27.cjs`, đối chứng `tax-proto.json` trích từ **prototype**, không dùng file worker sinh): đuôi 6 điểm khớp **14/14 byte-for-byte** · 22/22 mảng đủ 12 điểm · **8/8 chuỗi có `1 năm` ≠ `6 tháng`** (D8a đạt) · `q1` **14/14 hàng có màu** (`--cat-1..4` khớp `seed.cats`).
  - **Opus sửa sau khi worker xong** — worker tự chế công thức prepend (`(pts[2]-pts[0])/2`) làm 10/22 mảng lệch; prototype **đã có sẵn** `monthly()` (`output/cxm-platform-prototype.html:3806-3813`, `stepv = pts[1]-pts[0]`, kẹp `Math.max(0,…)`). Đã sinh lại 10 mảng đúng `monthly()`. Xoá được 2 lỗi bịa dữ liệu: `q7.t1`/`q8.t1` đuôi PHẲNG mà prepend dựng tăng trưởng 4× (giờ phẳng đúng), và số 0 giả ở `q8.t0`. Số 0 còn lại (`fee`/`branch`/`notify`/`nfc`) là do `Math.max(0,…)` của chính prototype — giữ.
  - Kỳ vọng golden đã sửa (sửa số, không xoá test): `stats.test.ts` 7→**19**; `TopicTrendBlock.test.tsx` guide −76→**−70** + comment 14 delta (status +127, wait +46, start +46). Dấu +/− và tỷ lệ "tăng theo hướng xấu" 9/14 **không đổi**.
  - Worker khai thiếu `data/validate.ts` (đã kiểm: **comment-only**, check `pts.length < 2` không bị nới — `validate.test.ts:110-115` viết 01/08 vẫn assert đúng thông điệp cũ) và bỏ sót `TopicTrendBlock.tsx:112` title `"Topic & xu hướng 6 kỳ"` **có render** (đã sửa).
  - **Nợ mở → hỏi owner cùng lúc chốt S2.8** (không chặn S2.8): detector anomaly vô nghĩa TỪ TRƯỚC — bản 6 kỳ gốc prototype đã gắn cờ **7/8 = 88%** điểm chấm được, giờ 19/20 = 95%. Lỗi ở detector chứ không phải dữ liệu: z trên MỨC thô + cửa sổ mở rộng ⇒ mọi xu hướng đều bị cờ (z hội tụ √3≈1,73 > 1,5); tại `i=2` chỉ có 2 điểm trước nên mọi chuỗi đơn điệu cho z **đúng bằng 3,00** (cấu trúc). Bất thường THẬT chỉ 3 (402, 908, 97). Đề xuất **cửa sổ tối thiểu `i>=3` + `z=2.5`** → còn đúng 3. Cùng lỗi lộ ở đường `months=3` (chỉ 1 điểm chấm được, luôn là ca 3,00).
  - `AnomalyChart.test.tsx:19` tự tính kỳ vọng bằng chính `zScores`/`isAnomaly` ⇒ xanh ở 19, ở 74, ở bất kỳ số nào. **Suite xanh KHÔNG chứng minh chart đọc được.**
  - Nợ nhỏ chưa đụng (không render, chỉ `validate.ts:367` kiểm `shown > total`): `q5/q6/q7/q8` còn `total:6`, `q15` còn `shown:2, total:6` trong khi chuỗi đã 12 điểm.
- **S2.8** ✅ **XONG + ĐÃ CERTIFY (02/08)**: D0a + D1a + D2a + D3a + D4a + D6a. `tsc` 0 · **395/395** · build xanh · `validateFixture` 0.
  - Scope worker khớp CHÍNH XÁC 11 file đã khai (kiểm mtime) — không có file source nào không khai, khác hẳn S2.7.
  - Live-check chrome-devtools trên `dist` thật (`vite preview`): `q3` (`base='ev'`) in **9 · 3 · 3 · 2** thay vì 50/17/17/11, denom `"17 bằng chứng mẫu, không phải toàn bộ bản ghi"`; `q1` (`agg`) giữ **2,3K · 2,1K · 1,7K · 1,2K · 1K**; thanh 26px (>3 hàng); 0 chấm màu; trục dọc `Theme · vì sao` + nhãn đáy `Số tín hiệu khách hàng`; donut `q14` 7 rows → 6 mục legend kết thúc `Khác (+2)`, tâm `317.699 tín hiệu khách hàng`; **không tràn ngang** (scrollW = clientW = 1283).
  - **Opus bổ sung sau khi certify** — defect cùng loại D0a mà worker bỏ sót: `Donut centerLabel` ghi cứng `"tín hiệu khách hàng"` cho MỌI chiều. D0a sửa con SỐ (ev/cust thôi nhân fx) nhưng để nguyên NHÃN. Chưa lộ vì seed chỉ có `q14` (agg) là donut, nhưng `QuantifyBuilder` cho user chọn bất kỳ chiều + kiểu Donut (`CHART_OPTIONS` dòng 41) ⇒ dựng donut trên `Category · intent` sẽ ra "17 tín hiệu khách hàng" cho 17 bằng chứng. Đã thêm `BASE_NOUN` (agg/ev/cust) và truyền `centerLabel={BASE_NOUN[dim.base]}`.
  - ⚠ **D4a KHÔNG đạt mục đích đã nêu — cần owner quyết**: lý do chốt D4a là "bỏ chấm để thêm chỗ cho nhãn đang bị truncate". Đo thật trên browser: **18/54 nhãn vẫn bị cắt**, nhãn dài nhất cần 230px mà chỉ có 155px. Bỏ chấm chỉ giải phóng ~14px; nút thắt thật là `grid-cols-[1fr_44%_56px]` — thanh chiếm cứng 44% còn nhãn ăn phần thừa. Giảm bát thành ~32% thì nhãn được ~204px (vẫn thiếu 26px). Hàng đã có `title` đầy đủ khi hover nên không mất thông tin, nhưng đọc lướt vẫn khó. **Không tự sửa** vì đây là quyết định design.
  - Cột giá trị 56px: đo thật `giaTriTran = 0`, mọi giá trị vừa khít — phán đoán bằng mắt của worker đúng với dữ liệu hiện có (chưa gặp chuỗi `230,7K`).
- **S2.10** ✅ **XONG + ĐÃ CERTIFY (02/08)** — sửa detector anomaly, owner chốt `i>=3` + `z=2.5`.
  - `domain/stats.ts` `zScores`: `i < 2` → `i < 3` (cố ý LỆCH prototype, ghi rõ lý do trong comment). `cfgDefault.anomaly.z`: 1.5 → **2.5**. `QuantifyWidget.DEFAULT_ANOMALY_Z` đồng bộ 1.5 → 2.5 (lệch nhau thì cùng chart vẽ khác nhau tuỳ caller).
  - **q15: 19 → 4 vòng tròn**, xác nhận LIVE trên browser (`anomaly-ring` = 4). Đúng chỗ đứt mạch thật: t0 `402`/`908`, t1 `205`/`97`. Toàn bộ series 63 → 11.
  - Hệ quả đã xử: `months=3` cho 0 điểm chấm được ⇒ chú thích đổi thành `"chưa đủ kỳ để chấm bất thường (cần ít nhất 4 kỳ, đang có 3)"` (hằng `MIN_POINTS_FOR_ANOMALY = 4`), có 2 test phủ cả 2 nhánh.
  - Đã vá điểm mù: thêm GOLDEN CỨNG `4 vòng tròn` vào `AnomalyChart.test.tsx` (test cũ tự tính kỳ vọng bằng chính `zScores`/`isAnomaly` nên xanh với mọi con số) và test neo `countAnomalies([10,11,9999], 2.5) === 0` vs `([10,11,12,9999], 2.5) === 1` trong `stats.test.ts`.
- **S2.9-A+B — ĐÃ CHỨNG THỰC 02/08** (worker Sonnet dựng, Opus tự chạy lại tsc/vitest/build + oracle jiti + live-check `dist` qua chrome-devtools). tsc 0 · **409/409** · build xanh · `validateFixture(seed,dims,seedNav,seedTour)` = 0. Scope kiểm bằng mtime: đúng 14 file worker khai, không under-declare.
  - **A · tầng nút phụ** (owner chốt "a" 02/08 — "các nút bộ lọc hay quản lý set đang quá chìm"): mới `src/design-system/buttons.ts` (`btnPrimary`/`btnSecondary`/`btnDanger` + `btnSizeSm/Md/Lg`). Nguyên nhân gốc KHÔNG phải chữ nhạt (`--ink2` #57534e = 7,5:1, đạt) mà là **viền `--line` #e5e1db = 1,2:1 trên trắng** — nút không có tín hiệu nào cho thấy nó là nút. Chốt: nền `surface-2` + **viền `--ink3`** (#8c8681 = 3,4:1, đạt WCAG 1.4.11 non-text 3:1) + chữ `--ink`. Viền là BẮT BUỘC vì nút phụ hay nằm trong `Card.footer` (`bg-surface-2/40`) — chỉ đổ nền `surface-2` là tan biến ở đúng chỗ chúng phổ biến nhất. Thay 15 call site; **KHÔNG đụng 4 hằng `chipOff`** (chip toggle phải nhạt để chip đang chọn nền cam còn nổi). Đo live: `bg #f4f2ef` / `border #8c8681` / `text #1c1917`.
  - **B · khoá màu intent** (owner chốt "a"): mới `ChartLegend.tsx` + `buildLegend()` trong `QuantifyWidget`. Màu bar mã hoá intent (D5a) nhưng trước đó KHÔNG có chú giải ở đâu — grep `Bars.tsx`/`QuantifyWidget.tsx` = 0 legend. Luật: mọi màu phải khớp `data.cats`, VÀ số màu phân biệt < số hàng (màu phải THẬT SỰ gom nhóm). Oracle độc lập (`scratchpad/oracle-legend.cjs`) tiên đoán **đúng 1/10 chart** có legend (q1: 10 hàng/4 màu; q3 loại vì 4 hàng/4 màu; q12 loại vì thang sentiment ngoài `cats`; 6 chart xám loại vì không có màu nào).
  - **DEFECT WORKER Opus bắt live, không test nào phủ:** thiếu guard `definedColors.length === 0` ⇒ `0 !== 0` = false lọt qua, rồi rơi vào nhánh "chưa gán intent" ⇒ **7 legend thay vì 1** — 6 chart L1/L2/L3 Keyword, Nguồn, Sub-theme, Nền tảng mọc chú giải 1 mục ngụ ý sai rằng chúng đáng lẽ phải có intent. Opus tự sửa + neo regression `it.each(["q2","q4","q9","q10","q11","q13"])`. Đo lại live sau sửa: đúng 1 legend, đúng q1.
- **S2.9-C+D — ĐÃ CHỨNG THỰC 02/08** (Opus tự làm, không dispatch — quá nhỏ để trả overhead).
  - **D7a**: `.t-block` 18px/650 → **21px/700** trong `index.css`. Consumer DUY NHẤT là `<h2>` câu hỏi section ở `OverviewPage.tsx` nên sửa global an toàn. Đo live: 3 `<h2>` đều 21px/700 vs tiêu đề card 13,5px — thang 34/21/13,5.
  - **D9a**: dòng `data-testid="set-provenance"` dưới `SetChips`: `{shared ? "Set dùng chung" : "Set riêng"} · cập nhật {up}`. **Lệch có chủ ý so với câu chữ nháp "Set cố định"**: "cố định" không phải trường nào, và sai với set người dùng tạo (`createSet` → `shared:false`). **KHÔNG in `owner`** vì fixture chứa tên người bịa; test neo `queryByText(/Thu Hà/)` không xuất hiện.
  - **Nợ D9a trả cùng lúc:** `up` từng KHÔNG được cập nhật bởi `renameSet`/`duplicateSet` ⇒ dòng provenance khai ngày cũ ngay sau khi sửa set (đúng loại defect "số đúng, nhãn nói dối" như `Donut centerLabel` ở S2.8). Đã bump `up = "hôm nay"` ở cả hai (dùng lại chuỗi của `createSet`, không đẻ format ngày thứ ba). **Cố ý KHÔNG bump ở `setBoardBlocks`** — đó là tùy chỉnh board cục bộ, `CustomBanner` báo riêng. 3 test mới phủ, kể cả nhánh tên rỗng không được bump.
  - **D10a phía Overview: BỎ, là no-op.** `OverviewFilterBar` là segmented control LUÔN hiện trạng thái + đã có nút "Đặt lại" khi `range !== DEFAULT_RANGE`. Badge của D10 giả định filter bị ẩn — đúng với Quantify (popover, `QuantifyFilterButton` đã có `activeFilterCount` từ trước), sai với Overview.
- **S2.9-E = S2.6b — ĐÃ CHỨNG THỰC 02/08** (worker native Sonnet; 16 file, khớp đúng khai báo theo mtime baseline 08:49:51Z). tsc 0 · **443/443 test, 52 file** · build xanh · zero DS→features import.
  - **Owner chốt**: bỏ HẲN footer ở cả Library lẫn Detail. `Xem chi tiết` không còn nút CTA — vào `⋮`, và bấm thân thẻ cũng mở chi tiết. Metadata **và** toggle Chart/Bảng đều gom lên header (owner chọn phương án "cả hai", bác đề xuất giữ toggle ở footer của tôi).
  - **Header Detail = ⓘ → ▽ → ⋮**. Đo live trên dist: q1 (rank show, total>5) có đủ 3; q3 KHÔNG có ▽ — điều kiện `showCount` đúng. Escape đóng popover. `role="menuitemradio"` + `aria-checked` đúng theo `view`. Badge ▽ = `5` sau khi chọn mốc 5.
  - **Modal xóa 2 nhánh còn nguyên** (đo live, không tin test): nhánh chặn `«Volume theo Theme»: đang dùng ở 1 set: b-voc-topic` chỉ có nút `Đóng`; nhánh xác nhận `«Volume theo Category»? Không thể hoàn tác` có `Hủy`/`Xóa`.
  - **`QuantifyWidget.footer` đã XÓA** (zero consumer). Hệ quả worker nêu đúng: **`Card.footer` giờ cũng zero-consumer** — API còn đó nhưng không `<Card>` nào truyền. Nợ dọn dẹp, chưa xử.
  - **Defect còn treo (tôi đo được, CHƯA sửa, chờ owner):** mở `⋮` rồi bấm thân thẻ để đóng menu thì vừa đóng **vừa** điều hướng sang chi tiết. Nguyên nhân: Popover đóng bằng `document mousedown`, còn wrapper thẻ bắt `click` — cú bấm "để đóng" lọt xuống. Fix hẹp kiểu "dò panel còn trong DOM" KHÔNG dùng được: đo thật cho thấy React đã flush gỡ panel trước khi `click` tới. Fix đúng là cho `Popover` đóng ở **capture-phase `click`** + `stopPropagation`, nhưng đổi lại: khi ⓘ đang mở, bấm ▽ chỉ đóng ⓘ chứ không mở ▽ (mất 1 click). Không đơn phương sửa primitive.
  - **Thay đổi hành vi nhỏ chưa khai:** popover ▽ **không tự đóng** sau khi chọn mốc (CountFilter cũ có `setOpen(false)`). Giữ mở thực ra tiện hơn — đổi mốc thấy chart cập nhật ngay — nhưng là lệch so với trước.
- **S2.9-F — dismiss-click + search ra toolbar. ĐÃ CHỨNG THỰC 02/08** (Opus tự làm, không dispatch). tsc 0 · **447/447 test, 53 file** · build xanh.
  - **Fix dismiss-click** (owner ok): `Popover` đóng ở **capture-phase `click`** + `stopPropagation` thay cho `mousedown`. Đo live trên `index-wbPAHn4q.js`: bấm dismiss → menu đóng, **KHÔNG** điều hướng; bấm thẻ bình thường vẫn mở chi tiết; trigger vẫn tự toggle. Test cũ của worker neo `mouseDown` đã đổi sang `click` + `expect(onOutsideClick).not.toHaveBeenCalled()` (chứng minh việc NUỐT click, không chỉ việc đóng). Regression ở `QuantifyLibrary.test.tsx` bấm **wrapper** chứ không bấm tiêu đề — tiêu đề là `<button onTitleClick>` nên bấm nó là mở chi tiết hợp lệ, không phải cú dismiss.
  - **Search KHÔNG hề thiếu** — nó đã có (`q-search`, khớp tên + chiều dữ liệu), chỉ bị chôn trong popover "Bộ lọc" do chỉ thị cũ *"ko hiển thị phần search và filter như thế kia, cho nút mở filter"*. Owner chốt: đưa ra toolbar luôn hiện, chip ở lại popover. Lý do phân lớp: search = TÌM một chart đã biết tên → 0 click; chip = THU HẸP tập chưa biết → nấp sau nút vẫn ổn.
  - File: **MỚI** `QuantifySearch.tsx` + `.test.tsx` (giữ nguyên `data-testid="q-search"` và placeholder — cùng một ô, chỉ đổi chỗ); `QuantifyFilterBar` bỏ prop `search`/`onSearch` + input, `anyActive` chỉ còn chip, nút "Xóa bộ lọc" dời xuống cuối (`data-testid="qfilter-clear"`).
  - **Hai đường xóa TÁCH ĐÔI có chủ ý**: `handleClearFilters` (xóa cả 4, dùng cho empty state thư viện) vs `handleClearFilterChips` (chỉ 3 chip, dùng cho nút trong popover). Nút trong popover không được xóa search vì search nằm ngoài, xóa cái người dùng đang thấy ở chỗ khác thì khó hiểu. Bù lại `QuantifySearch` có nút × riêng (`q-search-clear`).
  - **`activeFilterCount` bỏ đếm search** (4 → 3 tiêu chí): badge tồn tại để trạng thái BỊ ẨN vẫn thấy được; search giờ luôn hiện nên đếm nó là báo trùng, tệ hơn là badge hiện 1 mà mở popover chẳng thấy chip nào active. `hasActiveFilter` (nhãn "· đã lọc") VẪN xét search vì con số N/M do search ảnh hưởng thật.
  - Đo live trên `index-B2Dz9mTj.js`: search hiện không cần click, filterbar vẫn ẩn mặc định; gõ `theme` → `16 → 7` thẻ, meta `Hiển thị 7 / 16 chart · đã lọc`, **badge vắng**; bật chip `qfilter-kind-rank` → badge `1`; bấm "Xóa bộ lọc" trong popover → badge mất nhưng search **giữ** `theme`; nút × → về 16 thẻ.
- **S2.9-G — layout toolbar + trả 2 nợ. ĐÃ CHỨNG THỰC 02/08.** tsc 0 · **447/447 test, 53 file** · build xanh.
  - **Layout** (chỉ thị owner: *"nút bộ lọc đang bay giữa trang với thanh search đang bị ngắn"*): 3 con trong một `justify-between` nên nút Bộ lọc bị đùn ra giữa. Gom search + nút thành cụm trái `flex-1 max-w-[680px]`, meta `ml-auto`. `QuantifySearch` bỏ `max-w-[420px]` (cap hai lần → bó ngắn dù còn chỗ), dùng `min-w-0`. Cả hai control `h-9` + nút `flex-none`. Đo live: search **590px**, nút liền kề gap 8px, cùng cao 36px, cùng tâm dọc, meta ở `right:1373/1422`.
  - **Nợ 1 — `Card.footer` XÓA HẲN** (prop + nhánh render + doc). Zero consumer sau S2.6b; giữ slot không ai dùng chỉ mời quay lại kiểu cũ. `Modal.footer` là prop khác, không đụng. Đo live: `0` phần tử footer trong DOM.
  - **Nợ 2 — badge lệch đơn vị đã xử.** `Popover.badge?: number` → **`Popover.active?: boolean`**: trigger đổi màu primary thay vì in con số. Lý do: viên pill cam đếm số đã mang nghĩa "số tiêu chí lọc" ở `QuantifyFilterButton`; tái dùng đúng hình đó cho SỐ DÒNG khiến `5` không biết là 5 tiêu chí hay 5 dòng. Đo live: mặc định `data-active` vắng; chọn mốc 5 → `data-active="true"`, màu `rgb(217,83,30)` trên nền `rgb(253,243,238)`, **0** pill và **0** chữ số trên trigger. Test ở `Popover.test.tsx` + `QuantifyDetail.test.tsx` neo cả việc "không in con số".
  - **BÀI HỌC CÔNG CỤ:** `tsc --noEmit` **KHÔNG** bắt được JSX comment `{/* */}` đặt ngoài root element trong `return (` — tsc báo 0 lỗi, chỉ oxc/vite parse fail và làm 3 test **file** không load (App.test, QuantifySearch.test, QuantifyPage.test — báo "3 failed" nhưng 0 assertion đỏ). **Luôn chạy `vite build` chứ đừng tin tsc một mình.**

## Phase 3 · `#/work` — owner chốt 02/08: phương án (a)
- **Hình thức chốt**: MỘT danh sách thanh ngang, mỗi thanh = 1 issue, trên thanh có dải tiến trình 4 chặng (gán → duyệt → sửa → verify) đánh dấu chặng hiện tại, xếp theo `pri.total`. Thay cho board 4 làn của prototype.
- **Hệ quả cấu trúc**: prototype có 2 tab (`ST.sub.work`: `lanes` = board 4 làn / `pri` = `frictionQueue()` bảng xếp ưu tiên). Phương án (a) **gộp hai tab thành một** — thanh ngang vừa xếp theo ưu tiên vừa hiện chặng, nên cả `lanes` và `pri` đều dư. Đây chính là lý do owner đòi đổi.
- **Section prototype phải port (KHÔNG tự cắt)**: câu lead `t-hero` động (theo `noOwner`/`pend` hoặc `onBoard`/`pend`) · nút `＋ Tạo điểm gãy` + hint · chip `N chờ khép vòng` + `Đã xong N` · banner `mkok`/`asok` · `createForm()` · `assignForm()` · 2 khối đóng sẵn `outcomeSection()` + `loopSection()`.
- **NỢ `ActionLc` — ĐÃ TRUY RA GỐC, CẦN OWNER QUYẾT.** `web/src/data/schema/cxm.ts:44` khai `ActionLc = 'blocked'` (union 1 phần tử) và `domain/loop.ts:10` ghi rõ so `a.lc === 'closed'` sẽ là **lỗi biên dịch**. Lý do: `'closed'` **chưa từng có trong data** — đếm thật: prototype `lc:'blocked'` ×7 (0 `closed`), web seed ×6 (0 `closed`). Nên trong prototype các nhánh `closed` là **code chết**: chip `Đã xong ${closed}` luôn bằng 0; filter `lc !== 'closed'` của `frictionQueue` không loại gì; clause thứ hai của `waitLoop` luôn true. `TopPriorityBlock.tsx:34` đã ghi nhận điều này từ Phase 2.
  - Vì owner yêu cầu "**đủ lifecycle**", muốn thể hiện được chặng cuối thì phải thêm `'closed'` vào type **và** thêm action `closed` vào fixture — nhưng việc đó **đổi số ở màn khác** (`TopPriorityBlock`, đếm loop, Overview) nên phải re-certify Phase 2. KHÔNG tự làm; chờ owner chốt.
- **S2.10 · SỬA DETECTOR ANOMALY — owner chốt 02/08: `i>=3` + `z=2.5`.** CHỜ S2.8 tiếp đất mới làm (một writer tại một thời điểm; S2.8 đã bị cấm đụng `domain/stats.ts`). Đã đo trước read-only:
  - `domain/stats.ts` `zScores`: `if (i < 2) return null` → `if (i < 3) return null`. `cfgDefault.anomaly.z` trong `seed.ts`: `1.5` → `2.5`.
  - **q15: 19 → 4 điểm gắn cờ.** Đúng những điểm đáng gắn: t0 `402` (z=3,14) và `908` (z=10,63); t1 `205` (z=2,95 — bước nhảy +4→+13, đứt mạch thật) và `97` (z=−6,16). Tôi từng dự đoán 3; con số thật là 4 vì `205` là đứt mạch có thật, không phải nhiễu.
  - Toàn bộ series: 63 → 11.
  - ⚠ **Hệ quả phải xử cùng lúc**: `months=3` cho **0 điểm chấm được** (3 điểm đều `i<3`) ⇒ chart anomaly ở dải 3 tháng không bao giờ khoanh được gì, trong khi chú thích vẫn ghi "vòng tròn = vượt ngưỡng Z-score" — thành câu nói dối. Khi số điểm chấm được = 0 phải đổi chú thích thành "chưa đủ kỳ để chấm bất thường (cần ≥ 4 kỳ)". `months=6` → 6 điểm chấm được, 4 cờ; `months=12` → 18 chấm được, 4 cờ.
  - Đồng thời vá điểm mù: `AnomalyChart.test.tsx:19` tự tính kỳ vọng bằng chính `zScores`/`isAnomaly` nên xanh với MỌI con số — phải neo thêm ít nhất một golden cứng để test có khả năng đỏ.
  - Kỳ vọng golden phải sửa: `stats.test.ts` 19 → **4** (test `z=30 → 0` giữ nguyên). `AnomalyChart.tsx:62` render `threshLabel` sẽ đổi "1,5" → "2,5" — kiểm test nào assert chuỗi này.

### ⏸ (lịch sử) S2.6b + S2.6c — từng CHẶN chờ owner chốt design
Artifact chốt: **`output/card-chart-design-decisions.html`** (11 quyết định D0-D10, mockup render bằng **số thật** trích qua oracle jiti từ `qRun('q1')`; đã live-check chrome-devtools: 27 radio, lưu/xuất/xoá chạy, không overflow). `localStorage['cxm_card_dec']`.
- **S2.6b** (dời điều khiển Quantify: `CountFilter` → popover từ icon phễu; hàng nút footer `QuantifyLibrary`/`QuantifyDetail` → menu `⋮`; giữ Modal xóa 2 nhánh + guard `usedBy`) — chặn vì phụ thuộc design header cuối cùng.
- **S2.6c** (áp palette: `cats` thôi vay màu trạng thái · `Note tone="info"` · thang `cat` cho bar/donut · gom "Khác (+N)") — chặn vì phụ thuộc D5/D6.
- Owner yêu cầu quy trình 02/08: **verify bằng skill design + tham chiếu Enterpret cho gọn nhất, RỒI hỏi owner chốt design cuối cùng cho từng phần, áp với cả các phần.** Không code trước.

## P1.2 oracle map (từ `output/_harness.js` §11b/§11c — port sang Vitest, ĐỪNG để worker tự chế coverage)
Advisor: dùng harness làm oracle NGOÀI để tránh "pass giả". Chia P1.2 làm 2 contract:
- **P1.2a** = lưới `g2` + thẻ (widget thật) + toggle ▮Chart/▤Bảng + hàng action (shell) + **banner đỏ validateFixture ở AppShell** (Phase 0 step 7 mới minimal — advisor: land banner ở đây, trước khi P1.3 mutate qt/dash/boards; nếu không mất lưới an toàn đã bắt bug qUsedBy either/or).
- **P1.2b** = 3 nhóm chip lọc (kiểu/nền/view) + search + empty state + màn detail.

Assertion cụ thể phải port:
1. Toggle view (§11c 296-299): item `show` render CẢ `<table>` (view:table) LẪN `bars` (view:chart); show có toggle, **series KHÔNG có toggle** (tránh nút chết).
2. Lọc theo kiểu (§11b 286-290): filter='donut' → hiện donut, ẩn bar.
3. Lọc theo nền (§11c 328-331): filterG='ev' → hiện q12 (User Sentiment), ẩn item agg (Volume theo Theme).
4. Lọc theo view (§11c 326-327): filterV='table' → hiện q16 (Theme × Nền tảng), ẩn khác.
5. Search rỗng (§11b 291-292): search='zzzzz' → empty state "Không có chart nào khớp".
6. **No-drill (§11c 333-336, INVARIANT Q7)**: lib KHÔNG chứa drillTopic/drillVoc/drillSource. Bấm bar/hàng = highlight tại chỗ, KHÔNG điều hướng. `Bars` hiện chưa có click handler (prototype rankBars nhận `{click,kids}`) — P1.2 quyết: thêm highlight-in-place, KHÔNG thêm link drill. Hai hướng sai phải nêu rõ cho worker: (a) thêm link drill, (b) bỏ highlight.
7. Detail (§11b 283-285): qDetail='q1' → render tên q1.
- **State ở QuantifyPage level** (advisor sửa): `qViewOverride` + filter/search + qview sub-nav là local component state Ở `QuantifyPage` (KHÔNG trong sub-view, KHÔNG trong Zustand) — override phải sống xuyên nav lib↔detail (toggle ở lib → sang detail → về vẫn giữ) và là MỘT map chung cho cả card lib lẫn detail.
- **Follow-up #2 (src-death coloring q4/q14)**: P1.2 quyết dứt — hoặc inject `r.c` từ `cfg`+`sourceHealth` ở tầng widget, hoặc defer bằng văn bản. Đừng để lơ lửng.

## Follow-ups / deferred (đừng bỏ sót — tích luỹ từ review các section)
1. **qRun trả `DimRow[]` trần** — tầng render (P1.1b) PHẢI tự lo slicing "top 10 trừ donut→all" + tính total/shown/axis (không suy được từ DimRow[]). Sở hữu ở 1 chỗ, đừng lặp mỗi widget.
2. **src-health coloring** mất ở qRun (không nhận `cfg`) — `q4`/`q14` nguồn chết (`src-zalo`) chưa tô đỏ. Khôi phục khi render nếu cần (truyền cfg hoặc tô ở widget).
3. **Seed thiếu ev multi-valued taxonomy** — mỗi ev chỉ 1 node/level → `qRunCross` q16 cho `multi=false`; đã có synthetic test phủ path. Cân nhắc mở rộng seed cho tiêu chí phủ.
4. **`saveQuantify` full-replace-by-id** — builder (P1.3) phải đọc item hiện tại rồi MERGE `note` (nếu không mang theo sẽ mất note). Hoặc đổi chữ ký repo.
5. **`ActionLc` schema chỉ `'blocked'`** — loop closure sống ở bảng `Loop` (theo issue id) + tham số `loopClosed`. Nếu Work (Phase 3) cần lc phong phú hơn, mở rộng union + cập nhật domain/loop.
   - **ĐÃ THÀNH NỢ CỤ THỂ (S2.3, 01/08)**: `@toppri` gốc lọc `action(i.act) && action(i.act).lc !== 'closed'`; vế `lc !== 'closed'` là **lỗi kiểu** với union hiện tại (tsc "no overlap") nên `TopPriorityBlock.tsx:34-38` bỏ nó — "đang mở" giờ = "có action tương ứng". **Kiểm chứng: cả 6 action trong seed đều `lc:'blocked'`, không cái nào `'closed'` → hành vi hôm nay GIỐNG HỆT.** Nhưng khi có dữ liệu đã khép vòng, `@toppri` sẽ hiện cả điểm gãy đã đóng. Phase 3 phải chốt: mở rộng union `ActionLc`, hay định nghĩa "open" qua bảng `Loop`.
6. **repo getters `structuredClone` mỗi lần** — store đã giữ snapshot ổn định (ok); nếu thêm HttpRepository/tối ưu, xem lại reference-equality.
7. **DIMS = metadata** (evAttr = boolean marker); row computation nằm trong `qRun` (domain), không trong DIMS.
8. **qCrossBars (stacked bar) defer** — P1.1b dùng `CrossTable` cho CẢ 2 view của cross-tab (chart+table); prototype có `qCrossBars()` (stacked bar ngang) riêng cho cross+chart-view. Ưu tiên đúng số trước; dựng stacked bar khi làm P1.1c hoặc khi màn detail cần.
9. **Series widget = placeholder** — `QuantifyWidget` render item.kind='series' thành thẻ "biểu đồ ở bước sau (P1.1c)". P1.1c phải port `lineChart()`/`anomalyChart()` (SVG hand-rolled) + `axisLbl` cho series (anomaly: "vòng tròn = vượt ngưỡng Z-score").
10. **Defect prototype `@coverage` (phát hiện 01/08, owner chốt KHÔNG sửa prototype)** — `output/cxm-platform-prototype.html:2203-2204` truyền rows `obs.cov` (đơn vị %) vào `rankBars`, mà `rankBars` (1874-1876) render `nf(fx(v))` → độ phủ 85% hiện thành "476"; `total:600` chỉ vào tooltip nên không chữa được. `web/` đã render raw % (D1). Nếu sau này chạm prototype: sửa call-site 2203 và chạy lại `node output/_harness.js`.
11. **`TaxNode.up`/`by` đã backfill nhưng Phase 2 chưa dùng** — S2.0 port trọn `tax` (gồm `up`/`by`/`why` cho cả L1-L3) vì sinh code mechanical nên miễn phí; Phase 5 (topic detail, atlas provenance) mới là chỗ tiêu thụ. Đừng tưởng field chết mà xóa.

---

## S3.0 — `ActionLc` mở thành `'blocked' | 'closed'` (owner chốt 02/08/2026) — ĐÃ CHỨNG THỰC

**Chỉ thị owner:** "Thêm `closed` vào type + fixture (đề xuất)" — chấp nhận phải re-certify Phase 2.

**Đã sửa (8 điểm, đúng danh sách advisor lập từ grep):**
1. `src/data/schema/cxm.ts` — `ActionLc = 'blocked' | 'closed'` + ghi chú bất biến `closed ⇒ iv==='validated'` (validate.ts:114).
2. `src/data/fixtures/seed.ts` — CXA-013: `iv:'monitoring'→'validated'`, `lc:'blocked'→'closed'`.
   Chọn CXA-013 chứ KHÔNG thêm issue mới: dữ liệu quanh nó đã kể câu chuyện khép vòng (`out` verdict
   `improved`, `loop` CXI-013 gửi 25/25 có `by`/`sent`). Thêm issue mới thì phải bịa điểm gãy và làm
   dịch MỌI con số Overview — rộng hơn hẳn.
3. `src/domain/loop.ts` — 2 comment đã thành sai sự thật (đều nói `lc === 'closed'` là lỗi biên dịch).
4. `src/features/overview/blocks/TopPriorityBlock.tsx` — khôi phục vế `lc !== 'closed'`.
5. `src/domain/loop.test.ts` — 2 test re-anchor bằng override `{...findAction('CXA-013'), iv:'monitoring', lc:'blocked'}`.
6. `src/domain/state.test.ts` — `expected['CXA-013']`: `verify` → `off`.
7. `src/features/overview/blocks/LanesBlock.test.tsx` — counts `1,2,1,2` → `1,2,1,1`; tổng 6 → 5.
8. `src/features/overview/blocks/TopPriorityBlock.test.tsx` — bảng thứ hạng, đầu bảng card 4, Top 6/6 → 5/5.

**Phát sinh (do thay đổi của tôi làm lộ):** `LanesBlock.tsx` denomStrip `"Top {inWork} trên {act.length}
việc còn cần tay người"` — mẫu số là TỔNG action, gồm cả action đã khép vòng, nên nhãn nói sai. Trước
đây cả hai số đều là 6 nên không ai thấy. Đổi thành `"… trên {act.length} action đã ghi nhận"`.

**ĐÃ BÁC (advisor, đúng):** không cho `advanceAction` set `lc:'closed'`, không đổi default
`loopClosed = a.lc === 'closed'`. Cả hai là bất biến tôi tự nghĩ ra — `Action.lc` khóa theo action,
`CxmData.loop` khóa theo ISSUE, và `validate.ts` KHÔNG canh gì buộc hai bên đồng bộ. Chưa có caller
thật nào ngoài test. Chỉ sửa comment cho khỏi nói sai.

**Số đo bằng oracle riêng (jiti, KHÔNG suy từ test):**
- `pri.reg`: CXI-013(20) là ĐỈNH → rời bảng → card "rủi ro tuân thủ" đổi đầu bảng sang CXI-028(14).
- 3 card còn lại giữ nguyên đầu bảng (024 / 021 / 021) vì 013 chỉ đứng thứ 3–4 ở đó.
- 4 card: 6 → 5 dòng.
- `laneOf(CXA-013)`: `verify` → `off`; làn verify 2 → 1; `inWork` 6 → 5 trên tổng 6.

**Chứng thực:** `tsc --noEmit` 0 · `vitest run` 447/447 pass (53 file) · `vite build` xanh ·
`validateFixture(seed, dims, seedNav, seedTour, cfgDefault)` = `[]` · `lc` distribution
`{blocked:5, closed:1}` · `closed-but-not-validated` = `[]`.
Không consumer nào khác dịch: `OutcomesBlock` và `TopicTrendBlock` đều lọc theo `dl === 'released'`
(CXA-013 vẫn released), không đọc `iv`/`lc`.

### RÀNG BUỘC BẮT BUỘC cho Phase 3 `#/work`
`laneOf()` trả `'off'` cho MỌI action `iv === 'validated'` — hiện gộp hai nhóm khác nhau: (a) đã khép
vòng thật (`lc === 'closed'`), (b) đã validated nhưng CÒN CHỜ khép vòng với khách. Fixture hôm nay chỉ
có nhóm (a) nên chưa lộ. Khi `#/work` dựng chip "N chờ khép vòng" / "Đã xong N", PHẢI suy từ
`Action.lc` (và/hoặc bảng `CxmData.loop`), TUYỆT ĐỐI KHÔNG suy từ `laneOf` — nếu không, một action ở
nhóm (b) sẽ không hiện ở đâu cả: vừa rơi khỏi 4 làn, vừa không được đếm là đã xong.
`laneOf` giữ nguyên 4 làn theo prototype — KHÔNG sửa nó để phân biệt.

## S3.0b — `ActionLc` thêm `'ready'` (owner chốt 02/08/2026, ngay sau S3.0)

**Vì sao phát sinh:** đọc prototype `advance()` (dòng 4714-4715) thấy nó set **ba** giá trị lc, không
phải hai: `iv!=='validated' → iv='validated', lc='ready'` rồi `lc!=='closed' → lc='closed'`. Thông tin
này tôi CHƯA có khi hỏi owner về `closed`, nên hỏi lại trước khi code thay vì sửa type lần thứ hai.
Bằng chứng thêm: bất biến `validate.ts:114` viết dạng `lc !== 'blocked' ⇒ iv === 'validated'` — dạng đó
chỉ có nghĩa với type >2 giá trị, tức luật được viết cho 3 giá trị từ đầu.

**Ngữ nghĩa:** `blocked` = chưa được phép khép vòng · `ready` = được phép, chưa khép (chip "N chờ khép
vòng" đếm nhóm này) · `closed` = đã khép.

**Chi phí:** thuần type + comment. KHÔNG sửa fixture (action duy nhất đã validated là CXA-013 thì cũng
đã closed; `'ready'` là trạng thái phát sinh trong phiên qua advance()). Chứng thực: tsc 0 · 447/447 ·
`vite build` xanh · **hash bundle KHÔNG đổi** (`index-DV1OTX61.js` trước và sau) → xác nhận không chạm
runtime, đúng dự đoán.

**Giải toả nỗi lo "hai nguồn sự thật" của advisor:** prototype `advance()` khi đặt `lc='closed'` cũng
đẩy `loop.done = loop.need` và điền `loop.by`. Vậy việc giữ hai trục khớp nhau là của TRANSITION, không
của hàm suy trạng thái. Đã ghi vào comment `loop.ts`: store `advanceAction` phải đồng bộ Loop.
`domain/advanceAction` (hàm thuần) vẫn KHÔNG tự khép vòng — đúng quyết định cũ.

## Phase 3 — `#/work`, phương án (a) owner chốt

**Hình màn:** một danh sách thanh ngang duy nhất, mỗi thanh = 1 issue, trên thanh có dải tiến trình
4 chặng (gán → duyệt → sửa → verify) đánh dấu chặng hiện tại, sắp theo `pri.total`.
**Gộp 2 tab của prototype thành 1** — board 4 làn (`LANES`) và `frictionQueue()` đều thành dư, đó chính
là mục đích của phương án (a).

**Quyết định owner 02/08/2026 — nhánh `inconclusive`:** prototype đẩy sang `#/issue/:id` tab yếu tố
nhiễu, nhưng màn đó trong app này vẫn là Placeholder. Chốt: **chặn tại chỗ, nêu lý do trên thanh** —
nút disable + một dòng giải thích còn yếu tố nhiễu. KHÔNG điều hướng tới màn chưa dựng.

**Phải port, KHÔNG được cắt:** dòng `t-hero` động (`noOwner` ? … : `onBoard`/`pend`) · đoạn `t-meta`
giải thích board không phải kho lưu trữ · `＋ Tạo điểm gãy` + câu hint · chip `N chờ khép vòng`
(= `lc === 'ready'`) + chip `Đã xong N` (= `lc === 'closed'`) · banner `mkok`/`asok` · `createForm()` ·
`assignForm()` · hai khối ĐÓNG SẴN `outcomeSection()` + `loopSection()`.

**Chia section (một writer tại một thời điểm):**
- **W1** tầng data: `createIssue` / `assignOwner` / `advanceAction` + `domain/advanceBlockedReason`.
  Blocking edge: W3 cần method của W1. → ĐÃ DISPATCH.
- **W2** `design-system/IssueBar` — thanh ngang + dải 4 chặng, props-only.
- **W3** `features/work/WorkPage` — hero, chip, form, banner, danh sách thanh, 2 khối đóng sẵn, route.

### W1 — tầng data `#/work`: ĐÃ CHỨNG THỰC (02/08/2026)

**Scope worker (kiểm bằng mtime local-time, ĐÚNG 7 file đã khai, không thiếu không lố):**
`data/repository.ts` · `data/mock-repository.ts` · `data/mock-repository.test.ts` · `store/store.ts` ·
`domain/loop.ts` · `domain/loop.test.ts` · `domain/index.ts`

*Bẫy đã sập một lần:* mốc baseline ghi bằng `date -u` nhưng `find -newermt` đọc theo giờ LOCAL (UTC+7)
→ lần đầu ra 47 file (bắt cả sửa đổi trước đó trong phiên). Lần sau PHẢI ghi baseline bằng `date`
(local), không `date -u`.

**Chứng thực:** tsc 0 · `vitest` 457/457 (baseline 447 + 10 mới) · `vite build` xanh.
**Oracle riêng (jiti, không tin test):** `validate()` = `[]` sau MỌI mutation, kể cả chuỗi 6 chặng
chạy trên issue TỰ TẠO không có Loop row · `pri.total` = tổng 6 thành phần (48 = 30+4+14) ·
`pri.aff = min(24, round(430/100)) = 4` · `imp.aff = 430` · id cặp `CXI-029`/`CXA-029` trỏ nhau ·
`due` = `16/08/2026` đúng `dd/MM/yyyy` · owner rỗng → `UNASSIGNED` + `laneOf='assign'` ·
chặng 6 đồng bộ `loop.done 63/63` + điền `by` · chặng 7 idempotent · CXA-017 (verdict
`inconclusive`) no-op KHÔNG đổi 1 byte.

**BẰNG CHỨNG THỰC NGHIỆM cho ràng buộc đã ghi ở S3.0b:** tại chặng 5 `lc='ready'` nhưng
`laneOf` ĐÃ trả `'off'`. Một action chờ khép vòng KHÔNG nằm trong 4 làn. Chip "N chờ khép vòng"
buộc phải đọc `lc === 'ready'`. Không còn là suy đoán.

**Lệch prototype, có chủ đích, đã kiểm:**
- `plusDaysVi()` đệm 0 thay cho `plusDays()` gốc (bản gốc `toLocaleDateString('vi-VN')` ra `2/8/2026`,
  không khớp định dạng `29/07/2026` của mọi `due` trong seed). ĐÚNG — giữ một định dạng ngày duy nhất.
- Gate `inconclusive` đặt ở ĐẦU `advanceAction` thay vì giữa chuỗi if/else. Đã kiểm lập luận: outcome
  tồn tại ⇒ `dl==='released'` (validate.ts:112) ⇒ `ap==='approved'` (validate.ts:110), nên nhánh 1-4
  không thể chạy và gate rơi đúng ngay trước nhánh 5. Tương đương thật.
- `assignOwner` throw khi action không tồn tại (prototype đóng panel im lặng). Nhất quán với
  `deleteQuantify`/`duplicateSet` trong cùng file.

**NỢ đã ghi nhận, chưa xử lý (chờ owner):** `domain/advanceAction` (hàm thuần) giờ TRÙNG TÊN với
`MockRepository.advanceAction` nhưng chỉ phủ 5 chặng và không chạm `lc` → đã thành code chết, chỉ test
của chính nó còn dùng. Đã ghi chú "ĐÃ ĐƯỢC THAY THẾ" ngay trong `loop.ts`; chưa xoá vì xoá một public
export + 6 test là mở rộng phạm vi owner không yêu cầu.

**Ràng buộc cho W3:** `createIssue` KHÔNG tạo dòng Loop (đúng prototype). Prototype xử lý khuyết này
ở downstream — số đếm khối khép vòng là `DATA.loop.length + ACT.filter(a => a.iv==='validated' &&
!loop(a.iss)).length` (dòng ~2957). W3 PHẢI dùng đúng công thức đó, không phải `loop.length`.

### W2 — `design-system/IssueBar`: ĐÃ CHỨNG THỰC (02/08/2026)

**Scope (mtime, đúng 3 file khai):** `design-system/IssueBar.tsx` · `IssueBar.test.tsx` · `index.ts`.
**Chứng thực:** tsc 0 · 469/469 (baseline 457 + 12 mới) · `vite build` xanh · không có import
`features/` trong `design-system/`.

**Kiểm rủi ro riêng của section UI:** class Tailwind KHÔNG tồn tại vẫn compile và test vẫn xanh, chỉ là
không ra style. Đã đối chiếu từng class màu worker khai với `tailwind.config.js`: `watch.bg/line`,
`good.bg/line`, `surface-2`, `line/line-soft`, `ink-2/ink-3`, `primary/primary-soft`, `shadow-card` —
tất cả có thật, không có class bịa.

**Opus sửa lại 2 chỗ worker tự quyết (contract không chốt, và cả hai tiêu màu SỨC KHOẺ cho thứ không
phải sức khoẻ):**
1. Chip "Đã khép vòng" dùng `--good` → đổi sang tông trung tính `bg-surface-2 border-line text-ink-2`.
   Prototype cho chip "Đã xong N" KHÔNG màu nào; chỉ chip chờ khép vòng lấy `color:var(--watch)`. Và
   `tailwind.config.js` ghi rõ tách 4 màu trạng thái sức khoẻ khỏi tone thông tin — khép vòng là trạng
   thái QUY TRÌNH.
2. Chữ `blockedReason` dùng `text-crit` → đổi `text-ink-2`. `--crit` trong hệ này đã mang nghĩa "cần xử
   lý ngay" và đang được chấm sev ở tầng 1 dùng; hai thứ đỏ cạnh nhau hai nghĩa khác nhau thì không tách
   được. Tín hiệu "đang bị chặn" do nút `disabled` gánh.

### W3a — khung `#/work` + data plumbing: ĐÃ DISPATCH

**Opus sửa một quyết định của chính mình trước khi dispatch.** Ban đầu định lọc danh sách bằng
`laneOf(a) !== 'off'` (như board cũ). SAI: `lc==='ready'` kéo theo `iv==='validated'` nên `laneOf` trả
`'off'` → việc đang CHỜ KHÉP VÒNG biến mất khỏi màn, dù `getPrimaryAction` vẫn trả cho nó
`key:'close'` tức còn một bước người phải làm. Đây chính là cái bẫy đã ghi ở S3.0b, nhưng nó áp cho cả
DANH SÁCH chứ không riêng chip — chỗ đó tôi ghi thiếu.
**Bộ lọc đúng: `a.lc !== 'closed'`.** Mọi thứ chưa khép vòng còn một bước kế tiếp thật; chỉ việc đã
khép mới rời xuống hai khối cuối màn. Với seed hiện tại: 5 thanh (CXA-013 rời danh sách).

**Chốt chỗ đặt danh sách người (dependency chưa tồn tại trong web):** prototype có `OWNERS` (6) /
`APPROVERS` (5) là hằng CỨNG, không suy từ data. → `seedOwners`/`seedApprovers` trong `seed.ts` (fixture
data), lộ qua `repo.getOwners()`/`getApprovers()` → `store.owners`/`store.approvers`, mirror `dims`.
`mock-repository.ts` PHẢI bỏ `DEFAULT_APPROVER` hardcode, dùng `seedApprovers[0]` — một nguồn sự thật.
`SEV_LABEL` để trong feature `work/` (đúng lối `LANES` nằm trong `LanesBlock.tsx`).

**Còn lại của Phase 3:** W3b form tạo/gán + banner `mkok`/`asok` · W3c hai khối đóng sẵn
`outcomeSection`/`loopSection`. Số đếm khối khép vòng PHẢI dùng công thức prototype
`loop.length + act.filter(a => a.iv==='validated' && !loop(a.iss)).length`, KHÔNG phải `loop.length`
(vì `createIssue` không tạo dòng Loop).

### W3a — CHỨNG THỰC XONG (02/08/2026)

**Scope đo bằng mtime** (`find src -newermt`, giờ ĐỊA PHƯƠNG): đúng 7 file đã khai — `App.tsx`,
`seed.ts`, `mock-repository.ts`, `repository.ts`, `store.ts`, `WorkPage.tsx`, `WorkPage.test.tsx`.
`tsc --noEmit` 0 lỗi · **478/478 test** (55 file) · `vite build` xanh · không có import chéo feature ·
`DEFAULT_APPROVER` hardcode đã bị bỏ.

**Oracle độc lập (jiti nạp `seed.ts` + `domain/`, KHÔNG đọc code worker):**
`{noOwner:1, pend:2, onBoard:5, closed:1, waitLoop:0}` · hero = *"1 điểm gãy chưa có người chịu trách
nhiệm, 2 đang chờ duyệt."* · 5 thanh, thứ tự `CXA-021(94) > CXA-017(82) > CXA-024(62) > CXA-028(50) >
CXA-026(47)`, loại `['CXA-013']` · owners 6 / approvers 5 · `validate()` = `[]` · bị chặn `['CXA-017']`.
DOM thật trên `dist` khớp toàn bộ, cộng: `aria-current="step"` đúng một ô, 4 ô cùng hàng 262px đều nhau,
ô hiện tại nền `rgb(217,83,30)` = `#d9531e`, 0 thẻ `<a>`, không tràn ngang ở 1422px.

**Ba lỗi CHỈ ảnh chụp mới lộ (test xanh vẫn không bắt được) — 2 đã sửa, 1 hoãn sang W3b:**
1. *(đã sửa)* Ô chặng ĐÃ QUA và CHƯA TỚI gần như không phân biệt được bằng mắt — đo trên dist:
   `rgb(253,243,238)` vs `rgb(244,242,239)`. Vi phạm chính luật a11y tôi đặt trong contract (trạng thái
   không được chỉ dựa vào màu). Sửa: thêm dấu `✓` trước ô đã qua. An toàn với test vì test dùng
   `toHaveTextContent` khớp chuỗi con.
2. *(đã sửa)* Mất dòng ACTOR dưới nút — `workCard()` prototype LUÔN in `n.actor`; contract của tôi cắt
   mất. Dòng này trả lời "ai phải làm bước này", điều nhãn nút không nói ("Duyệt đề xuất xử lý" không
   cho biết là người phụ trách QUYẾT ĐỊNH chứ không phải owner). Cần guard vì `actor` rỗng ở `key:'done'`.
3. *(hoãn W3b — LỖI TRONG CONTRACT CỦA TÔI)* Tôi bảo worker luôn dùng `primary.label` và không truyền
   `onAssign`. Hậu quả: CXI-024 hiện CTA "Duyệt đề xuất xử lý" trong khi owner là "Chưa gán" và thanh
   đang ở chặng "1 Gán" — đúng thứ prototype cấm. `workCard()` (dòng 2964-3014) có nhánh riêng
   `lane === 'assign'`: nút **"Gán người xử lý"** → `openAssign(a.id)`, kèm hint **"Không duyệt được khi
   chưa có owner"** THAY CHO dòng actor. Không vá nửa vời ở W3a vì nó cần form gán.

### W3b — CHỨNG THỰC (02/08/2026)

Kiểm độc lập, không dựa báo cáo worker.

- **Scope** `find src -newermt "2026-08-02 19:27:33"` → **đúng 8 file**, không thừa:
  `design-system/IssueBar.tsx` + `.test.tsx`; `features/work/WorkPage.tsx` + `.test.tsx`;
  `features/work/WorkCreateForm.tsx` + `.test.tsx`; `features/work/WorkAssignForm.tsx` + `.test.tsx`.
- `npx tsc --noEmit` → **0 lỗi**. `npx vitest run` → **57 file / 514 test PASS** (baseline 55/478 → +2 file, +36 test).
  `npx vite build` → xanh, 93 modules, 1.75s.
- **Không** có `any`, **không** `localStorage`, **không** import chéo feature, `design-system/` không import `features/`.
- **Lớp màu**: mọi class dùng (`bg-primary`, `bg-primary-soft`, `bg-surface`, `bg-surface-2`, `bg-watch-bg`,
  `border-line`, `border-watch-line`, `text-crit`, `text-ink-2`, `text-ink-3`, `text-primary`, `text-watch`,
  `text-white`) đều có thật trong `tailwind.config.js` (`watch`/`crit` ở dòng 24-25). **Không thêm palette.**
- **Bất biến** `validate()` rỗng: 3 assertion trong `WorkPage.test.tsx`.
- **Deviation của worker được CHẤP NHẬN**: worker thêm `setMkok(null)` vào `openAssign()` — lệch bản port
  literal prototype (dòng 4636-4638) nhưng đúng Criterion 9 do chính tôi viết. Một banner tại một thời điểm
  là hành vi đúng; và chặng Gán sắp bị thay nên điểm này thành moot.

**CỐ Ý CHƯA LÀM — không phải bỏ sót:** live-check chuỗi tương tác trên trình duyệt + oracle jiti cho luồng
Gán. Lý do: ngay sau khi W3b xong, owner chốt **bỏ chặng Gán, đổi thành chặng Xác nhận** (xem module kế
tiếp) — luồng này đang bị nắn lại, nên live-check sẽ chạy một lần trên hình dạng cuối thay vì hai lần.
Phần chắc chắn sống sót (form Tạo, banner, đổi ngày dd/MM/yyyy) đã được test tự động phủ.

### Owner chốt (02/08/2026) — hướng mới

1. **Bỏ chặng Gán → chặng Xác nhận.** Dải 4 chặng: Xác nhận → Duyệt → Sửa → Verify. `Action.owner/acc/due`
   GIỮ trong schema, chỉ gộp vào form xác nhận thay vì là một chặng riêng.
2. **Đóng băng baseline đúng lúc bấm Xác nhận.** Dùng lại shape `OutcomeMeasure {v,u,p,n}`, lưu **số thô**,
   nhân `fx` lúc render ở cả hai vế.
3. **Giữ cả hai nguồn ticket**: hệ thống tự sinh (luồng chính) + người nêu tay; cả hai dừng ở Chờ xác nhận.
4. **Màn chi tiết điểm gãy: port đủ 5 tab** `V.issue` (prototype dòng 3228).

**Lỗi phương pháp mà việc này sửa:** `mock-repository.ts` nhánh `!outcome` lấy `base.v` từ `metric.value`
— giá trị ĐỌC SAU khi bản sửa đã release, và `verdict` hardcode `'improved'`. Verify lane hiện không thể
phát hiện ca xấu đi.

**Bán kính ảnh hưởng đã đo:** `domain/state.ts:8,71` (LaneKey + laneOf) · `design-system/IssueBar.tsx:31-32`
(STAGES) · `data/mock-repository.ts:11,251` (UNASSIGNED) · **`features/overview/blocks/LanesBlock.tsx:27,70`
(màn ĐÃ CERT — sẽ phải chứng thực lại)** · 5 file test. `QuantifyWidget.tsx:192` "chưa gán intent" là
DƯƠNG TÍNH GIẢ — nói về taxonomy intent, không liên quan owner.

### A1 — CHỨNG THỰC XONG (02/08/2026)

Kiểm độc lập, không dựa báo cáo worker.

- **Scope** đúng 5 file: `schema/cxm.ts`, `schema/index.ts` (CxmData nằm ở đây, không phải cxm.ts),
  `fixtures/seed.ts`, `validate.ts`, `validate.test.ts`.
- `tsc` **0 lỗi** · `vitest` **57 file / 521 test** (+7 từ 514) · `vite build` xanh.
- 5 bất biến có thật: `validate.ts:117-120` (cặp cf⟺snapshot + cf=pending⟹ap=pending),
  `:267-271` (iss tồn tại, ≤1 snapshot/issue, obs.stepId tồn tại). 7 test tương ứng.
- **Baseline truy được về nguồn** (oracle riêng, không tin worker):
  - CXI-013 `{71.0,%,'09/07 – 15/07/2026',412}` = SAO Y `outcome.base`. CXI-017 `{94.0,%,'28/06 – 15/07/2026',1840}` = SAO Y.
  - CXI-021/026 `m-liveness value='83,3%'` → 83.3 · CXI-028 `m-repeat value='24,0%'` → 24.0 (parse đúng dấu phẩy Việt).
  - Cả ba THẬT SỰ ở bước `s3`; `n` = `obs.entered` = 15840. Không có số bịa.
- `cf`: 5 confirmed + 1 pending (CXA-024). `snap` 5 dòng — khớp. Bất biến 5 không vướng vì
  CXA-024 vốn `ap:'pending'`.

**Sửa lỗi của chính charter:** charter bản đầu ghi "28 action" — SAI, fixture chỉ có **6** action
(CXA-021/017/013/024/026/028). Worker phát hiện. Đã sửa charter. Ảnh hưởng: A2-A4 nhỏ hơn ước lượng.

### Owner đề xuất (02/08/2026) — Demo mode trong màn Cấu hình

Nguyên văn: *"đúng là bây giờ đang chưa có, nên note lại thành 1 mode là demo trong tab setting mới ko,
để chỉnh cấu hình hệ thống, cho phép bật demo để show ra full các tính năng và trạng thái trong hệ thống"*

**Vì sao đúng về kiến trúc:** A1 chốt luật "không bịa số trong seed" — hệ quả là phần lớn điểm gãy sẽ hiện
delta = 0, và `Outcome.post` vẫn là số mô phỏng vì dữ liệu "sau khi sửa" chưa tồn tại. Demo mode giải đúng
căng thẳng đó: **tách phần mô phỏng ra thành một chế độ có công tắc tường minh**, thay vì trộn nó vào seed.
Seed thật giữ sự thật; demo mode chịu trách nhiệm phô diễn. Bịa có công tắc thì trung thực; bịa nằm trong
seed thì không.

**Phát hiện:** prototype ĐÃ CÓ màn cấu hình (dòng 4112-4141+), **chưa port sang React**. 6 nhóm:
`step` (ngưỡng bước) · `metric` (chỉ số) · `source` (SLA nguồn) · `alert` (cảnh báo & khảo sát) ·
`sub` (bản tin) · `weight` (trọng số ưu tiên). Hiện MỘT nhóm mỗi lần, có chấm đỏ trên menu theo số đối
tượng đang vượt ngưỡng, và khối "Áp ngay lúc này". Có `resetCfg()` + cờ `cfgDirty()`.

**Tiền lệ hợp bất biến:** prototype tự nói *"Prototype không có backend nên cấu hình không lưu — refresh
browser là về mặc định... Cấu hình chỉ tồn tại trong phiên, không lưu xuống đâu cả."* → khớp bất biến
KHÔNG `localStorage`. Công tắc demo nên theo đúng tiền lệ này (chỉ trong phiên), trừ khi owner muốn link
chia sẻ được thì dùng tham số trên URL hash — KHÔNG dùng localStorage.

**Chưa chốt:** demo mode thực sự đổi cái gì; đặt trước hay sau Module B; có port cả 6 nhóm cấu hình ngay không.

### Owner chốt (02/08/2026) — Demo mode + tab System Setting

**Owner đính chính quan trọng:** màn ngưỡng 6 nhóm của prototype (cấu hình NGHIỆP VỤ: ngưỡng bước, mục
tiêu chỉ số, SLA nguồn, trọng số ưu tiên) là MỘT THỨ KHÁC. **System Setting là tab HOÀN TOÀN MỚI**, không
có trong prototype, dành cho cấu hình HỆ THỐNG. Đừng gộp hai cái. Màn ngưỡng port sau, module riêng.

**Chốt:**
1. Demo mode = **fixture riêng `seed-demo.ts`**, công tắc đổi NGUỒN DỮ LIỆU, không vá lên seed thật.
   Phủ đủ: 4 chặng đều có việc · đủ ba verdict improved/worse/inconclusive · có cả `lc:'ready'` lẫn
   `'closed'` · baseline có delta thật. **CẢ HAI fixture đều phải qua `validateFixture()` rỗng** — bất
   biến sẵn có trở thành bảo đảm rằng dữ liệu demo vẫn mạch lạc, không phải rác cho đẹp mắt.
2. **Thứ tự mới: Module A → Module C (demo mode) → Module B (màn chi tiết 5 tab).**
   Lý do owner chọn ngược mặc định: fixture demo là DỮ LIỆU, chỉ cần schema (A1 xong), không cần B tồn
   tại. Dựng màn 5 tab trên dữ liệu gần rỗng là cách để lọt lỗi layout và trạng thái rỗng.
3. Nội dung tab (owner giao Opus quyết): **công tắc demo · nút reset phiên về dữ liệu gốc · thông tin
   phiên và nguồn dữ liệu** (đang dùng fixture nào, số bản ghi mỗi loại, `validateFixture()` mới nhất).
   Mục 3 biến bất biến xương sống thành thứ NHÌN THẤY ĐƯỢC thay vì chỉ sống trong test.
   **LOẠI hệ số `fx` baseline 6 tháng**: là ống nước hiển thị, không phải thứ người vận hành nên chỉnh —
   đưa ra tab sẽ mời người ta vặn một con số họ không có cách nào biết đúng hay sai.
4. Công tắc demo chỉ tồn tại **trong phiên**, KHÔNG `localStorage` (theo đúng tiền lệ prototype tự nêu).

### A2 + A2-correction + A3 — CHỨNG THỰC (02/08/2026)

Owner nới quy tắc: **cho phép nhiều writer song song + dùng subagent review**. Opus áp dụng CÓ ĐIỀU KIỆN:
song song CHỈ khi tập file rời nhau. A2-correction (`data/`) ‖ A3 (`domain/`+`design-system/`+`overview/`)
chạy đồng thời, thành công. A4 KHÔNG song song được vì cần `LaneKey` mới của A3 tồn tại trước.

**A2** — scope đúng 5 file (`repository.ts`, `mock-repository.ts` + test, `store.ts` + test), tsc 0.
`confirmIssue` đóng băng Snapshot; `advanceAction` đọc baseline đông cứng thay vì `metric.value`;
`verdict` SUY RA thay vì hardcode `'improved'`.

**LỖ HỔNG THẬT do chính A1+A2 tạo ra, worker A2 phát hiện và báo cáo thay vì tự bịt:**
A1 thêm bất biến 5 (`cf='pending'` ⟹ `ap='pending'`); A2 cho `createIssue` đặt `cf:'pending'`; nhưng
`advanceAction` nhánh approve KHÔNG gác `cf`. Tạo điểm gãy có điền owner rồi bấm "Duyệt" → bất biến vỡ
qua đường UI công khai. Worker ghim bằng một test khẳng định `validate()` KHÔNG rỗng.

**Opus xử lý:** mở rộng scope A2 tường minh, gửi correction về đúng thread cũ. Đóng ở HAI tầng —
repository ném lỗi (`mock-repository.ts:364-367`, ném TRƯỚC khi mutate) và `getPrimaryAction` trả CTA
"Xác nhận" nên UI không còn mời bấm sai. Test ghim-bất-biến-vỡ đã bị gỡ: **một bộ test khẳng định bất
biến bị vỡ sẽ dạy mọi worker sau rằng vỡ là chấp nhận được.** Xác minh độc lập: mọi assertion `validate()`
còn lại đều `toEqual([])`.

**A3** — scope đúng 8 file. `LaneKey` `'assign'`→`'confirm'`; `laneOf()` nhánh 1 đọc `cf`;
`getPrimaryAction` có nhánh confirm đứng TRƯỚC approve; `IssueBar` STAGES[0] = "Xác nhận";
`LanesBlock` đổi khoá + nhãn.

**PHÉP KIỂM CHỨNG CỦA CẢ MODULE — ĐẠT.** Phân bố làn KHÔNG dịch một đơn vị nào.
Opus suy lại độc lập từ seed dòng 459-478: CXA-024 `owner:'Chưa gán'`→confirm · CXA-021/026
`ap:'pending'`→approve · CXA-028 `dl:'in-progress'`→fix · CXA-017 `iv:'monitoring'`→verify ·
CXA-013 `iv:'validated'`→off = `{1,2,1,1,1}`. Khớp chính xác con số worker báo.

**Chứng thực cụm:** scope đúng **10 file** (2 của A2-corr + 8 của A3) · `tsc` 0 · `vite build` xanh ·
`vitest` **531 test, 2 ĐỎ** — cả hai ở `WorkPage.test.tsx`, ĐÚNG như A3 báo và ĐÚNG là lỗi chức năng
thật: `WorkPage` còn gọi `assignOwner` (không đụng `cf`) nên luồng gán cũ không đẩy action ra khỏi làn
Xác nhận. A4 sửa. Cây đỏ có chủ ý, đã quy trách nhiệm, không phải hồi quy lạc.

**A3 tự quyết, Opus CHẤP NHẬN:** sửa thêm một chữ trong `AxisLabel` của `LanesBlock` ("làn suy ra từ
*owner*" → "*xác nhận*") — vượt khung "chỉ khoá và nhãn" nhưng đúng, vì để nguyên là một câu SAI SỰ THẬT
trên màn đã chứng thực.

### A4 — CHỨNG THỰC XONG (02/08/2026) · MODULE A HOÀN TẤT (chờ review độc lập)

- **Scope** đúng 10 file + 2 rename (`WorkAssignForm.*` → `WorkConfirmForm.*`, file cũ đã biến mất).
- `tsc` **0** · `vitest` **57/57 file, 530 test, 0 đỏ** · `vite build` xanh.
- `grep -rn "assignOwner\|AssignFields\|Gán người xử lý" src/` → **RỖNG**. Đường cũ đã gỡ sạch.
- **Lớp màu**: tập class y hệt trước A4 — không class mới nào lọt vào. Mọi token có thật trong config.
- 2 test đỏ của A3 đã xanh **bằng cách sửa CHỨC NĂNG** (`WorkPage` gọi `confirmIssue`), không phải sửa
  kỳ vọng. `criterion 5` giờ kiểm chứng bar THẬT SỰ chuyển làn `stage-confirm`→`stage-approve`, không
  chỉ đổi nhãn.

**Opus tự sửa 3 chỗ rác lời văn trong `WorkCreateForm.tsx`** (file A4 bị cấm đụng, worker báo đúng):
2 comment còn trỏ tên file cũ, và hint dòng 108 **sai SÂU hơn worker nghĩ** — cũ ghi "Để trống thì thẻ
nằm ở chặng Gán", nhưng sau Module A thì MỌI issue mới đều `cf:'pending'` nên **luôn** vào chặng Xác
nhận, kể cả khi đã điền sẵn owner. Sai cả từ vựng lẫn logic. Đổi thành "Điền sẵn cũng vẫn phải qua
chặng Xác nhận" + comment giải thích. Cây vẫn xanh sau sửa (530 test).

**Đang chạy:** reviewer độc lập chỉ-đọc, context sạch, soi cả Module A đối chiếu charter — nhắm vào
đường nối giữa các section (nơi lỗ hổng `cf` đã từng nằm), bất biến chỉ-có-trên-giấy, snapshot có thật
sự đông cứng (không share reference), và lời văn nói dối trên màn đã cert.

### REVIEW ĐỘC LẬP Module A (02/08/2026) — TÌM RA LỖI NGHIÊM TRỌNG TRONG CHARTER

Reviewer chỉ-đọc, context sạch. Opus đã tự xác minh từng điểm, KHÔNG tin báo cáo.

**PHÁT HIỆN 1 — NGHIÊM TRỌNG. Lỗi nằm trong ĐẶC TẢ của Opus, không phải ở worker nào.**

Charter viết luật verdict: `post.v > base.v → 'improved'`. Luật này **giả định ngầm mọi chỉ số đều càng
cao càng tốt**. Sai. `domain/state.ts:41` đã có sẵn `mdir()`: target chứa `≤` → chiều `'down'`.

Xác minh: `m-repeat` có `value:'24,0%'`, `target:'≤ 15%'` → chiều down. `CXA-028` neo vào nó. post mô
phỏng thấp hơn `base.v=24.0` là **cải thiện thật**, nhưng `mock-repository.ts:384-385` kết luận `'worse'`.
`OutcomesBlock.tsx:35,47` tô màu theo hiệu số thô `up > 0 ? text-good : text-crit` → màn Overview ĐÃ CERT
sẽ hiện `24,0% → 16,4%` màu đỏ, nhãn "Xấu đi", cho một cải thiện.

**Và test `mock-repository.test.ts:250-260` KHOÁ CỨNG cái sai đó** (`expect(verdict).toBe("worse")`).
`m-repeat` là chỉ số chiều down DUY NHẤT trong seed — nên tiêu chí nghiệm thu do chính Opus đặt ("phải có
test chứng minh suy ra được 'worse'") vô tình chọn đúng ca mà công thức bị đảo, và **hợp thức hoá chính
lỗi mà module muốn sửa**.

**BÀI HỌC PHƯƠNG PHÁP:** cách chứng thực của Opus là đối chiếu worker với đặc tả của Opus — nên nó
**về mặt cấu trúc không thể bắt được một đặc tả sai**. Ba worker đều làm đúng hợp đồng. Chỉ một reviewer
đọc code với con mắt độc lập, không bị đặc tả dẫn dắt, mới thấy. → Review độc lập là BẮT BUỘC cho mọi
module sau, không phải tuỳ chọn.

**Phát hiện 2 (trung bình):** không có bất biến nào buộc `action.sm === issue.metric`, dù `base` đóng băng
từ `issue.metric` còn `post`/`goal` đọc từ `action.sm` — hai field nuôi hai vế của CÙNG một phép so sánh.
`validate.ts:108` chỉ kiểm `a.sm` tồn tại. Tiềm ẩn, seed hiện khớp cả 6 cặp.

**Phát hiện 3-5 (nhẹ):** ranh giới `post.v === base.v` chưa có test đỏ · tên test
`mock-repository.test.ts:180` còn nhắc `laneOf='assign'` (giá trị đã bị xoá) · nhánh chết `"Duyệt"` trong
`WorkPage.tsx:~86` (vì `createIssue` luôn `cf:'pending'`).

**Reviewer kiểm SẠCH:** 5 luật cf/snap đều có test làm đỏ được · snapshot KHÔNG share reference
(`structuredClone` ở cả `confirmIssue` và `advanceAction`, seed dùng literal riêng) · cả 5 dòng `snap`
truy được về nguồn · seam `cf⟺ap` đã bịt · bất biến toàn dự án sạch trên 23 file.

→ **Section A5 (correction)** đã dispatch: một nguồn sự thật duy nhất cho chiều chỉ số ở tầng `data/`
(`state.ts` bỏ bản sao riêng), sửa verdict + màu hiển thị theo chiều, sửa test khoá-cái-sai, thêm bất
biến `sm === issue.metric`, dọn 2 chỗ nhẹ.

### Owner chốt (02/08/2026) — Trục phân khúc khách trong biểu đồ

**Cơ chế ĐÃ CÓ SẴN, không cần dựng mới:**
- `ChartKind` đã có `'cohort'`; `QuantifySeries` có `dim` + `t:{l,p[]}[]` = nhiều đường/chart.
- Seed đã dùng: `q7` (Android vs iOS, `dim:'platform · theme thiết bị'`), `q8` (high-value vs còn lại).
- **`domain/quantify.ts:115-116` đã có group-by thuộc tính khách**: `seg:`, `tier:` qua `byCustGroup`.
  → Thêm trục mới = thêm dòng cùng khuôn, và chart SUY TỪ DỮ LIỆU chứ không viết tay số.

**Vấn đề mô hình hoá đã nêu với owner:** `Customer.seg` trộn BA trục vào một chuỗi tự do —
`'Mới mở TK'` (thâm niên) · `'Khách chuyển từ CTCK khác'` (nguồn) · `'Khách 50+'` (tuổi). `tier` cũng
trộn: `'new'` (thâm niên) vs `'high-value'/'standard'` (giá trị). Hệ quả: KHÔNG hỏi được "NAV cao VÀ
trên 50 tuổi".

**Owner chốt: TÁCH thành field riêng, thêm cả 4 trục.**
1. `age` — dưới 25 · 25-34 · 35-49 · 50+
2. `nav` — dưới 100tr · 100tr-1 tỷ · 1-5 tỷ · trên 5 tỷ (thay nghĩa mơ hồ của `tier:'high-value'`)
3. `ten` (thâm niên) — mới mở <3 tháng · 3-12 tháng · trên 1 năm
4. **`ch` (kênh mở TK)** — Opus chọn kênh thay vì tỉnh/thành (owner để "hoặc"): kênh nối thẳng vào
   hành trình đang phân tích, tỉnh/thành là lát cắt marketing hơn lát cắt CX. Đổi lại được nếu owner muốn.

`pf` (android/ios) GIỮ — `q7` đang dùng. `st` GIỮ — free text trạng thái trong bối cảnh điểm gãy.

**Bán kính:** `schema/cxm.ts` (Customer) · `fixtures/seed.ts` (7 dòng cust) · `validate.ts` ·
`domain/quantify.ts:115-116` (+4 dòng group-by) · `SrcMatrix`/`QuantifyBuilder` test. Chưa màn nào đọc
`seg` để TÍNH SỐ nên rủi ro hồi quy thấp.

**Giải pháp cho vấn đề "7 dòng thì nhóm ra vô nghĩa":** owner KHÔNG chọn dựng nền khách lớn cho seed
thật. Opus giải: **seed thật giữ 7 dòng trung thực; fixture demo của Module C mang vài trăm khách** để
chart phân khúc có ý nghĩa. Bật demo thấy đủ, tắt demo thấy sự thật — đúng tinh thần công tắc demo.

**Xuất hiện ở:** thư viện Quantify + tab "Cohort ảnh hưởng" của màn chi tiết (Module B). Opus tự quyết.

**Sequencing: GỘP vào Module C** thay vì module riêng — cả hai đều là làm giàu fixture; tách ra phải
viết lại seed hai lần. Phải chờ A5 xong (A5 đang giữ `validate.ts`, `mock-repository.ts`, `state.ts`).

**Nợ cũ không được lặp lại:** `q7`/`q8` mang `shown:6, total:6` trong khi `t[]` có 12 điểm; `q15` mang
`shown:2, total:6`. Series mới phải khai đúng.

### A5 — CHỨNG THỰC XONG (02/08/2026) · MODULE A ĐÓNG

- Scope 8 file (gồm file mới src/data/metric-direction.ts) · tsc 0 · 534 test (+4) · build xanh.
- Quy tắc chiều chỉ số tồn tại ĐÚNG MỘT CHỖ: metric-direction.ts:12. domain/state.ts đã bỏ mdir riêng.
  Xác minh bằng grep toàn src cho phép so sánh dấu nhỏ-hơn-hoặc-bằng trong target: đúng 1 kết quả.
- CXA-028 (chiều down, post thấp hơn base) giờ cho verdict improved. Test cũ khoá worse đã sửa.
- Thêm bất biến action.sm === issue.metric (nhóm 4) + test làm nó đỏ được.
- OutcomesBlock tô màu theo CHIỀU, không theo hiệu số thô. Không class Tailwind mới.

Worker báo trung thực một điều KHÔNG đạt: criterion 6 (ca worse thật trên chỉ số chiều up) không dựng
được end-to-end qua API công khai, vì createIssue luôn đặt action.sm = fields.metric, và mọi metric
trong seed đều nằm ở phía chưa-đạt mục tiêu nên post = goal + 1.4 luôn rơi về phía tốt. Worker phủ bằng
unit test trên deriveVerdict KÈM một assertion ghim vào đúng call site thật, để unit test không trôi
thành bản sao song song. Opus chấp nhận cách này.

NỢ KỸ THUẬT (nợ CŨ, không do A5): src/data/mock-repository.ts:5 import advanceBlockedReason từ
../domain/loop.ts, tức ĐẢO THỨ TỰ LỚP (data không được phụ thuộc domain). Opus quyết KHÔNG sửa ngay:
khác với lỗi chiều chỉ số (do NHÂN BẢN quy tắc, sinh sai số thật), đây chỉ là một import lệch lớp,
không gây sai kết quả. Xử khi chạm lại vùng đó.

### Owner chốt (02/08/2026) — Tính khả dụng của trục phân khúc theo bước

Owner nêu vấn đề, và nó nghiêm trọng hơn "thiếu dữ liệu": ở luồng mở tài khoản, NAV chỉ có SAU khi nạp
tiền, tuổi chỉ biết SAU khi chụp CCCD thành công. Nên cắt tỷ lệ fail tại bước 3 theo NAV thì chỉ thấy NAV
của người ĐÃ ĐI HẾT hành trình, tức đúng nhóm KHÔNG fail vĩnh viễn. Đây là SURVIVORSHIP BIAS: biểu đồ
giấu mất nhóm bị ảnh hưởng nặng nhất mà vẫn trông hoàn toàn bình thường.

Neo vào thứ đã có, không đẻ cơ chế mới:
- token unk (tailwind.config.js:27)
- obs.cov + ngưỡng cfg.step.covMin (domain/state.ts:20 — phủ thấp thì bước tự sang watch)
- tiền lệ SurveyState = ok | watch | unknown

CHỐT:
1. Chart: phủ 0% thì TỪ CHỐI vẽ, hiện câu giải thích vì sao trục này chưa tồn tại tại bước đó.
   Phủ một phần thì vẽ, nhưng dải "chưa biết được" LUÔN hiện (màu unk) và IN ĐỘ PHỦ ngay trên chart.
2. Tách hai loại unknown thành hai giá trị riêng: "chưa-biết" (hành trình chưa tới điểm biết được — quy
   luật, không sửa được) vs "thiếu" (đáng lẽ biết mà không có — lỗi thu thập, phải đi sửa). Hai biện pháp
   NGƯỢC NHAU nên không được gộp; gộp là mất luôn đầu mối đi sửa.
3. NAV biết SỚM với nhóm "Khách chuyển từ CTCK khác" (họ khai giá trị danh mục lúc mở TK), các nhóm khác
   thì không.

HỆ QUẢ THIẾT KẾ QUAN TRỌNG: tính khả dụng KHÔNG phải thuộc tính tĩnh của trục, mà là hàm của
(trục × bước × nhóm khách). Phải mô hình hoá tường minh, không suy ngầm. Đây là điểm khó nhất của
Module C và phải đưa vào charter trước khi dispatch bất kỳ section nào.

## 02/08/2026 — Nợ live-check ĐÃ TRẢ + Module C Charter chốt

LIVE-CHECK (chrome-devtools, localhost:5173/#/work) — nợ từ W3b, nay trả xong:
- Trạng thái đầu khớp oracle: Xác nhận 1 · Duyệt 2 · Sửa 1 · Verify 1 · xong 1.
- Đường xấu: bấm Xác nhận khi chưa chọn người xử lý -> chặn kèm câu giải thích, KHÔNG mutate.
- Đường tốt: chọn Đức Anh -> CXI-024 nhảy Xác nhận sang Duyệt, banner đúng nội dung.
- Cổng cf mở thật: bấm Duyệt sau đó -> sang Sửa. Console 0 lỗi/0 warn.

MODULE C — hai lần Opus tự sửa mình trước khi dispatch:

(1) Em từng nói "phân khúc có sẵn cơ chế, thêm 4 dòng là xong". SAI. domain/quantify.ts:163
    CROSS_EXTRACT không có entry seg/tier, qRunCross trả empty (dòng 204) -> matrix rỗng vẫn vẽ ra
    như biểu đồ thật. qRun dòng 126 cũng trả [] nếu thiếu dims. Thêm 4 trục = nhân bẫy lên 6 lần.
    Charter phải xử riêng: ghép chéo trục khách -> refuse KÈM LÝ DO, không trả matrix rỗng.

(2) Em từng ghi "khả dụng là hàm của (trục x bước x nhóm khách), phải mô hình hoá tường minh".
    BỎ. Thay bằng sentinel nằm trong chính giá trị: nav: NavBand | 'chưa-biết' | 'thiếu'.
    Lý do: bảng tra song song với dữ liệu là thứ TRÔI LỆCH được khỏi dữ liệu — đúng cơ chế đã đẻ ra
    bug verdict ở Module A. Với sentinel, coverage là số ĐẾM ĐƯỢC, không phải số khai báo, và hàm ba
    chiều tự rơi ra từ dữ liệu. Luật nghiệp vụ sống trong hàm sinh fixture demo, không thành type.
    Hệ quả: KHÔNG viết thêm cohort series nào cho phân khúc (số viết tay -> coverage là lời khai,
    không đếm được). Chỉ rank/donut dẫn xuất từ data.cust.

(3) Bản đầu charter đoán "phần lớn biểu đồ sẽ từ chối vẽ trên seed thật" — cũng SAI. Suy giá trị
    trung thực cho 7 khách: acq 7/7, age 7/7 (mọi khách đã qua bước 02 nên biết tuổi), tenure 3/7,
    nav 1/7. Nhánh refuse 0% KHÔNG xuất hiện trên seed thật, chỉ hiện ở fixture demo.
    nav 1/7 là hiện vật quan trọng nhất: người duy nhất có NAV là khách chuyển từ CTCK khác đã hoàn
    tất -> biểu đồ TỰ NÓI RA rằng ai còn NAV để cắt thì đều là người đã đi hết hành trình.

(4) Dải tuổi đổi 45-54/55+ thành 18-24/25-34/35-49/50+ để khớp segment nghiệp vụ 'Khách 50+' đã có
    sẵn trong seed — dải cũ làm một khách "50+" rơi mập mờ giữa hai band.

OWNER CHỐT: trục 0% -> từ chối vẽ kèm câu giải thích (không ẩn trục, không bật demo mặc định).
Phạm vi: chạy đủ C1-C5.

Charter: scratchpad/module-c-charter.md. C1 dispatch 23:11 (mtime baseline 2026-08-02 23:11:01).
C1 chạy MỘT MÌNH — mọi section sau phụ thuộc tên field.

## 02/08/2026 — C1 + C2 + C4 CHỨNG THỰC XONG · bàn giao phiên

**C1** (schema + sentinel + validate + 7 khách seed thật):
- Scope mtime: đúng 6 file, toàn bộ trong `data/`. tsc xanh, 537 test (534+3), build xanh.
- Sentinel literal chỉ ở `segment.ts` / `schema/cxm.ts` / `seed.ts` / test. Không rò `domain/` hay `features/`.
- 3 test mới đều dựng data vi phạm rồi khẳng định lỗi XUẤT HIỆN — đúng chiều, không lặp lỗi A2.
- Worker bắt được mâu thuẫn TRONG ĐẶC TẢ CỦA OPUS: bảng ghi `1-5 tỷ` (có dấu cách) còn type chốt là `1-5tỷ`. Nó theo type và báo lại thay vì tự sửa type. Đúng cách.
- Opus tự sửa 1 chú thích ghi sai ngày (01/08 → 02/08).

**C2** (`domain/quantify.ts` + `dims`):
- `CUST_FIELD` gom getter dùng chung giữa `ROW_BUILDERS` và `qRunSegment` — một nguồn, không lệch.
- Suy "trục khách" từ `dims[].base === cust`, KHÔNG hardcode danh sách id. Đúng bài học `mdir`.
- `qRunSegment` trả union refuse/draw; `known+unknown+missing === cust.length` theo cấu trúc.
- `qRunCross` thêm `unsupported: string | null` — hết cảnh matrix rỗng trông như kết quả thật.
- Có test chặn lệch `ROW_BUILDERS` ↔ `dims` (bẫy biểu đồ rỗng im lặng).

**C4** (fixture demo 300 khách):
- Worker bắt được LỖI THỨ HAI trong đặc tả Opus: công thức trải seed rồi thay `cust` sẽ xoá mất 7 khách thật, mà `iss.cust` trỏ đích danh 7 khoá đó → `validateFixture` đỏ 8 lỗi nhóm 3. Nó ghép 7 thật + 293 sinh thay vì thay hẳn. Đúng.
- Sinh tất định mulberry32: hash `cust` giống hệt qua HAI tiến trình node riêng (-1354881479).

**ORACLE ĐỘC LẬP** (`scratchpad/oracle-c.mjs` — tự đếm, KHÔNG gọi hàm coverage của domain):

```
SEED   7: age 7/0/0    · nav 1/6/0     · tenure 3/4/0    · acq 7/0/0
DEMO 300: age 226/74/0 · nav 64/233/3  · tenure 80/220/0 · acq 283/8/9
```

Cả hai fixture: key trùng 0 · vi phạm "Khách 50+ ⟹ age 50+" 0 · vi phạm "high-value ⟹ nav biết" 0 · `issue.cust` trỏ khách không tồn tại 0.
Khớp report worker VÀ khớp dự đoán charter viết TRƯỚC khi dispatch.

**TỔNG:** tsc xanh · 560 test / 58 file · vite build xanh · sentinel không rò khỏi `data/`.

**BÀN GIAO:**
- Charter + log đã copy từ scratchpad (thư mục tạm, sẽ mất) vào `web/docs/` — persist thật.
- Mới: `web/docs/REBUILD-STATUS.md` là tài liệu trạng thái tổng cho agent sau.
- `AI-CONTEXT.md` project root ĐÃ LỖI THỜI NẶNG (viết 28/07, nói React không nằm trên đường deploy). Đã thêm banner đỏ trỏ sang `web/docs/REBUILD-STATUS.md` và nói rõ cảnh báo cũ nói về `legacy/` chứ không phải `web/`.

**VẤN ĐỀ MỞ CHỜ OWNER:** `AI-CONTEXT.md` dòng ~175 ghi quyết định cố ý "`DATA.cust` chỉ còn key/seg/tier/pf/st, không thành hệ thống tra cứu thứ hai". Module C thêm 4 field → vượt chữ, nhưng giữ tinh thần (chỉ dùng gộp nhóm tổng hợp, không có màn tra cứu từng khách). Opus đề xuất sửa quyết định thành "cấm màn tra cứu từng khách" thay vì "cấm thêm field". ĐÃ GHI CHÚ VÀO `AI-CONTEXT.md` LÀ CHỜ PHÁN, chưa tự sửa.

**CÒN LẠI:** C3 (tầng vẽ) · C5 (tab Cấu hình hệ thống) · Module B (5 tab `V.issue`) · màn 6 nhóm ngưỡng.

## 03/08/2026 — VoC stacked-bar + `/topic/:id`: SỬA REGRESSION CHẶN, chứng thực tĩnh

**Vào phiên thấy suite ĐỎ.** `npx vitest run` → **42 test đỏ / 6 file**
(`mock-repository` 24 · `store` 12 · `validate` 2 · `WorkPage` 2 · `demo` 1 · `OverviewPage` 1).
Một nguyên nhân duy nhất cho cả 42: `@themestack` được gắn vào `b-voc-all` trong `seed.ts` nhưng
**không có def trong `data/blocks.ts`** → `validateFixture()` trả
`b-voc-all câu 3: khối "@themestack" không tồn tại` → mọi assert `validate() === []` gãy.

`VOC-STACKED-SPEC` §4 (WIRE) liệt kê 3 file và bỏ sót `blocks.ts` — **lại là lỗi đặc tả của Opus**,
đúng khuôn "Bài học đắt nhất" của Module A. Khác lần trước ở chỗ lần này test KHÔNG khoá cái sai
lại, mà đỏ ầm lên, nên bắt được ngay.

**Sửa:** thêm `"@themestack": { n: "Theme theo thành phần", sec: "voc", go: "topics" }` vào registry.
`go:"topics"` được kiểm thực nghiệm chứ không suy đoán — `validate.ts:244` khẳng định
`ROUTES.has(blk.go)`, và `validate()` giờ trả rỗng.

⚠️ **Có sửa một test cũ, lệch ràng buộc spec** (*CHỈ THÊM test, KHÔNG sửa test cũ*):
`OverviewPage.test.tsx` assert `BLOCKS` có đúng 9 entry → đổi thành 10, kèm một assert mới cho def
của `@themestack`. Lựa chọn còn lại là gỡ feature khỏi seed. **Đã báo owner, chờ xác nhận.**

**Sau khi sửa:** `tsc -b` exit 0 · **598 test / 68 file xanh** · `vite build` xanh.

**ORACLE ĐỘC LẬP** (script tạm, tự đếm từ `seed`, KHÔNG gọi test của worker — đã xoá sau khi chạy):

```
theme=14 · subtheme=4 · theme CÓ subtheme=3 · KHÔNG có=11
x-th-device n=412 subs=2 Σsub=412 rem=0   xám=0     | group 2 đoạn Σ=412
x-th-guide  n=368 subs=1 Σsub=196 rem=172 xám=172   | group 1 đoạn Σ=368
x-th-status n=295 subs=1 Σsub=142 rem=153 xám=153   | group 2 đoạn Σ=295
(11 theme còn lại: subs=0, xám = trọn theme.n)
Hình group phân biệt = 12/14 theme  ==> KHỚP TOÀN BỘ
```

Khớp đúng oracle mà spec viết TRƯỚC khi code. Ba điều đã kiểm chéo:
- Trục sub-theme **không normalize** — mỗi đoạn không-xám bằng ĐÚNG `n` của subtheme cùng tên;
  đoạn xám = `theme.n − Σsub`; Σ đoạn = `theme.n` cả 14/14.
- Trục group tất định (gọi 2 lần bằng nhau), Σ = `theme.n`, mọi đoạn `demo:true`.
- `ThemeDetailPage` resolve **theo id trước rồi branch `lv`** → hit "feature" (L2) của Search
  không chết ngõ cụt, subtheme hiện theme cha. Không regress search.

**CHƯA LÀM: live-check trình duyệt.** Phần tĩnh đã chứng thực, phần chạy thật thì chưa.

**PHÁT HIỆN NGOÀI PHẠM VI — `demoData` VẪN LÀ DEAD CODE.** Demo Mode (làm 03/08, không có spec
doc, không có mục log) dựng theo hướng khác hẳn seam mà `REBUILD-STATUS` đề xuất: `store.ts:80`
BẬT → `repo.getSnapshot()` (= `seed`, 7 khách), TẮT → `EMPTY_DATA`. Không `swapFixture()`.
`grep` xác nhận chỉ `demo.test.ts` dùng `demoData`. **Đây là điều kiện chặn của C3** — nhánh
`refuse` (coverage 0%) chỉ tồn tại trong `demoData`. Đã đưa lên owner quyết trước khi làm C3.

**HỆ QUẢ UX cần owner xem:** top 8 theme chỉ 3 có màu, 5 thanh xám đặc 100%. Trung thực nhưng
biểu đồ mặc định trông gần như trống. `guide`/`info`/`praise` ở trục Nhóm khách chỉ 1 đoạn.

**GIT:** toàn bộ `web/` (184 file) trước đó **untracked** — nay đã commit `6434ade`.
Kèm `fc1e223` (redesign Quantify trong prototype HTML) và `241db8d` (docs + AI-CONTEXT).
**Chưa push** — push sẽ deploy `output/cxm-platform-prototype.html` lên site live.
Đã khôi phục `output/enterpret-cxm-benchmark.html` bị xoá trong working tree (3 file đang
tham chiếu tới nó: `AI-CONTEXT.md:172`, spec 27/07, `output/README.md:37`).
`output/__data_extract.txt` (110KB scrap dump `const DATA`) **cố ý không commit** — file tạm.

## 03/08/2026 (tiếp) — seam fixture + đảo mặc định @themestack, CÓ LIVE-CHECK

Owner chốt ba việc: (1) Demo Mode BẬT phục vụ `demoData` 300 khách · (2) `@themestack` mặc định
sang trục Nhóm khách · (3) push tất cả. Đã push `faeb871..1140523` (site live đổi theo commit
`fc1e223` sửa prototype HTML).

**Seam fixture.** `MockRepository(fixture: CxmData = seed)` + singleton
`createCxmStore(new MockRepository(demoData))`. Mặc định constructor GIỮ `seed` nên hàng chục
`new MockRepository()` trong test không đổi hành vi — đó là lý do chọn cách này thay vì đổi mặc
định của chính constructor. Không cần `swapFixture()`: chỉ có hai trạng thái (demoData / rỗng),
không có trạng thái thứ ba phục vụ `seed`.

⚠️ **Tự bác một kỳ vọng của chính Opus:** mục trước viết "seam là điều kiện chặn C3 vì nhánh
`refuse` chỉ tồn tại trong `demoData`" — **SAI**. Theo số oracle 02/08, `demoData` có known > 0
trên cả 4 trục (age 226 · acq 283 · tenure 80 · nav 64) nên coverage không bao giờ chạm 0%, tức
`refuse` vẫn KHÔNG hiện. Cái `demoData` thật sự mở ra là sentinel `thiếu`: seed **0**, demo **12**
(`acq` 9 · `nav` 3) — lần đầu phân biệt được `chưa-biết` với `thiếu` trên UI. Nhánh `refuse` cần
bộ lọc theo bước hành trình, mà `Customer` chưa có khoá nối `Step`. Đã sửa lại trong REBUILD-STATUS.

⚠️ **Seam CHƯA đổi gì nhìn thấy được.** Không màn nào trong `features/` đọc `data.cust` (C3 chưa
làm), nên app trông y hệt. Bằng chứng seam hoạt động nằm ở test, không ở màn hình.

**Test khoá thêm (5 test, 598 → 603):** singleton có 300 `cust` còn `createCxmStore()` mặc định có
7 — **test DUY NHẤT chặn `demoData` rơi lại thành dead code**, vì mọi test khác đều tiêm repo riêng
nên vẫn xanh nếu ai đó đổi singleton về mặc định. Kèm: `validate(demoData)` rỗng · `demoData` bao
trọn 7 khoá thật · constructor clone chứ không giữ tham chiếu.

**Sửa test cũ lần hai (ThemeStackBlock).** Đảo mặc định `subtheme` → `group` làm 2 test cũ sai
chiều. Viết lại: một test assert mặc định group + khoá nhãn `demo` và denomStrip "tỷ trọng minh
hoạ" (hai thứ duy nhất chặn đọc nhầm số bịa), hai test kia thêm click `Sub-theme` trước khi assert
trục thật.

**Chứng thực:** `tsc -b` 0 · **603 test / 68 file xanh** · `vite build` xanh.

**LIVE-CHECK (Chrome DevTools, `vite` dev :5173) — khoảng trống của mục trước, nay đã đóng:**

| Kiểm | Kết quả |
|---|---|
| `/voc` mặc định | `@themestack` render, `Nhóm khách` aria-pressed=true, nhãn `demo` + denomStrip có mặt |
| Thanh đầu (trục group) | 2 đoạn `288 + 124 = 412` = đúng `x-th-device.n` |
| Bấm `Sub-theme` | 8 thanh: 3 có màu thật (412 · 368 · 295), **5 thanh xám đặc** — đúng oracle, và đúng hiện tượng khiến owner đảo mặc định |
| Bấm thanh | → `#/topic/x-th-device`, đủ 4 section |
| `/topic/x-sub-android` (subtheme) | hiện theme cha + chú thích, KHÔNG "không tìm thấy" |
| `/topic/x-l2-ekyc` (hit *feature* của Search) | Note "node taxonomy tầng L2" + link `#/atlas` — **search không chết ngõ cụt** |
| `/topic/khong-ton-tai` | "Không tìm thấy" — đúng nghĩa |
| Demo Mode TẮT | switch `true`→`false`, `/voc` trống, có banner, **không NaN** |
| Console | **0 error / 0 warning** qua toàn bộ điều hướng |

---

## 03/08/2026 (tiếp 2) — C3 đóng lại: 2 chart trục khách + guard `unsupported`, CÓ LIVE-CHECK

**Phát hiện đầu tiên, và nó sửa một câu tôi đã tự ghi sai vào REBUILD-STATUS.** Tôi từng ghi
`qRunSegment` "chưa nơi nào trong `features/` gọi tới" rồi kết luận **C3 chưa làm**. Câu grep đúng,
kết luận sai: nó được gọi ở **`design-system/QuantifyWidget.tsx:278`**. Đọc lại `QuantifyWidget.tsx`
dòng 273-335 thì C3 **đã làm gần hết từ trước** (comment ghi rõ `S2.C3b` và `D2b owner chốt 03/08`):
dải `unk` ghim cuối màu `--unk` (dòng 303-306), `buildSegDescription()` in tỉ lệ phủ + tách *chưa
biết* / *thiếu* (dòng 202-212), nhánh `refuse` (dòng 280-287). Bài học: tầng vẽ của dự án sống ở
`design-system/`, nên kiểm tiến độ bằng **"có ai render không"**, không phải "có ai trong `features/`
import không".

**Hai lỗ thật còn lại, đã bù:**

1. **Không item nào dùng `base:'cust'`** — `grep 'show: *"(seg|tier|age|nav|tenure|acq)"' seed.ts` trả
   rỗng; `show` trong seed chỉ có `theme·l1·cat·src·l2·l3·sub·sen·pf`. Nghĩa là cả tầng phủ phân khúc
   **chỉ hiện khi người dùng tự dựng chart trong builder** — cùng loại lỗi với `demoData` là dead code
   hôm qua: code đúng, test xanh, người xem không gặp. Thêm `q17` (acq) + `q18` (nav).
2. **`cx.unsupported` tính rồi mà không UI nào đọc** — `grep unsupported src/` chỉ ra `domain/` và
   test, `CrossTable.tsx` không tham chiếu. Ghép chéo trục khách sẽ vẽ bảng rỗng + dòng "Đang hiện 0
   trên 17 mẫu", đọc thành **kết quả thật bằng 0**. Thêm nhánh in lý do + 2 test.

**Quyết định wiring, có căn cứ test:** gắn vào `b-cxm-pilot` **chứ không** `b-cxm-exec`, vì
`OverviewPage.test.tsx:170` chốt `expect(allBlocks).toEqual(["@journeystate","@toppri","@coverage"])`
— so khớp **toàn danh sách**, nên kể cả thêm block vào câu đang có cũng phá test khoá quyết định owner
01/08. Kiểm `grep -rn b-cxm-pilot src/`: không test nào khoá số câu / danh sách khối của pilot. Và về
nghĩa thì `dims.acq` nhãn *Kênh mở TK* khớp thẳng *pilot Mở tài khoản*.

**Live-check (`vite --port 5174`, `#/cxm/b-cxm-pilot`) — 0 console error/warn:**

| # | Kiểm | Kết quả |
|---|---|---|
| 1 | Set pilot có câu mới | ✅ 4 câu, có "Ta biết được bao nhiêu về khách trong cohort?" |
| 2 | `q17` acq | Phủ **94,3%** (283/300) — 8 chưa biết + **9 thiếu (lỗi thu thập)** |
| 3 | `q18` nav | Phủ **21,3%** (64/300) — 233 chưa biết + **3 thiếu** |
| 4 | Cộng đúng cohort | 283+8+9 = **300** ✅ · 64+233+3 = **300** ✅ |
| 5 | Dải "Không xác định" | 2 nhãn, một mỗi chart ✅ |
| 6 | Số thanh | 6 mỗi chart = 5 nhóm + 1 unk ✅ |
| 7 | Phân biệt sentinel hiện ra CHỮ | ✅ cả hai chart nói rõ "chưa biết" và "thiếu (lỗi thu thập)" riêng |

**Oracle độc lập:** hai phép cộng ra đúng `data.cust.length = 300` là oracle số học của bất biến *mẫu
số không lặng lẽ loại nhóm chưa biết*. Ngoài ra bảng oracle ở `REBUILD-STATUS.md` dòng 144-149 **đã
ghi sẵn từ 02/08** `acq` known 283 / chưa-biết 8 / thiếu 9 và `nav` known 64 / chưa-biết 233 / thiếu 3
— khớp **tuyệt đối** với số live hôm nay. Con số được xác nhận độc lập hai lần, hai thời điểm.

**Về test:** lần này **KHÔNG sửa test cũ nào** — chỉ thêm 2 test mới (`CrossTable.test.tsx`). Khác hai
lần trước trong ngày (BLOCKS 9→10, ThemeStackBlock default axis) mà tôi đã phải sửa test cũ.

**Chuyện timeout cần ghi lại để lần sau không chẩn sai:** lần chạy full suite đầu tiên sau khi sửa cho
**4 test đỏ / 3 file**, lần thứ hai **9 đỏ / 5 file** — danh sách đỏ **đổi giữa hai lần chạy**, và
100% là `Test timed out in 5000ms`, **không một assertion nào sai**. Bằng chứng quyết định:
`Card.test.tsx > actions render ở góc phải header` cũng timeout, mà test đó **không đọc seed** nên
không thể bị `q17`/`q18` ảnh hưởng. Chạy riêng 6 file đó: **69/69 xanh trong 18s**. Chạy full với
`--testTimeout=30000`: **605/605 xanh, 68 file**. Kết luận: máy đang tranh chấp nặng
(`environment 862s` ở lần đỏ vs `345s` ở lần xanh), 5s mặc định là biên. **Không nới timeout trong
config** — chỉ dùng cờ CLI để chẩn đoán, vì nới vĩnh viễn sẽ che một chart thật sự chậm về sau.

**Verify cuối:** `npx tsc -b` exit 0 · **605 test / 68 file xanh** · `npx vite build` xanh (2,38s).
Commit `76ef3ef`.

---

## 03/08/2026 (tiếp 3) — Module D section 1: chia màu trong thanh (`split`) + stacking + legend, CÓ LIVE-CHECK

**Phạm vi owner chốt:** breakdown = chia màu các đoạn BÊN TRONG thanh (`split`), stacking `abs` mặc định
/ `pct` bật được, bucket "Khác", **chỉ trên trục `base:'cust'`**; loại `pf` khỏi picker; top 6 + "Khác";
đoạn "Khác" nằm CẠNH dải "Không xác định", không gộp; **mọi chart có đoạn chia màu phải có legend giải
mã màu→nhóm**; bỏ dòng `item.note` khỏi card; tăng font toàn cục.

**9 file sửa:** `data/schema/quantify.ts` · `data/validate.ts` (rule 16) · `data/fixtures/seed.ts` (q19) ·
`domain/quantify.ts` (`qRunSplit`) · `domain/themeSegments.ts` · `design-system/Bars.tsx`
(prop `segmentLegend`) · `design-system/QuantifyWidget.tsx` · `features/quantify/QuantifyBuilder.tsx` ·
`features/quantify/QuantifyPage.tsx`. Test mới: 15 test trên 4 file.

### Live-check `#/cxm/b-cxm-pilot` — card q19 (`acq` × `nav`, 300 khách demo)

| # | Kiểm | Kết quả |
|---|---|---|
| 1 | Thanh có đoạn màu | ✅ `tự tìm 62` · `banner 60` · `giới thiệu 60` · `chi nhánh 59` · `đối tác 42` · `Không xác định 17` |
| 2 | Legend giải mã màu | ✅ 6 mục: `200tr-1tỷ` `50-200tr` `<50tr` `1-5tỷ` `>5tỷ` `Không xác định` |
| 3 | Dòng phủ | ✅ `Phủ 94,3% (283/300 khách có dữ liệu). Nhóm "Không xác định" gồm 8 chưa biết và 9 thiếu (lỗi thu thập).` |
| 4 | Cộng đúng cohort | 62+60+60+59+42+17 = **300** ✅ · 283+8+9 = **300** ✅ |
| 5 | `item.note` trên card | ✅ KHÔNG còn (owner: "card nên clean nhất có thể") |
| 6 | Console error/warn | ✅ `<no console messages found>` |

**Điều đáng ghi nhất cho yêu cầu "thuật toán phải dùng được thật":** bất biến *Σ đoạn màu = giá trị
thanh* và *known + chưa-biết + thiếu = cohort* đúng ở **300 khách sinh ra**, không chỉ ở 7 dòng
`seed.cust`. Số đoạn màu là số ĐẾM ĐƯỢC trên cùng một dòng `Customer` (`acq` và `nav` đều `base:'cust'`)
— không có hằng số tỷ lệ nào bị bịa, khác hẳn trục "Nhóm khách" của `@themestack` (`demoRatios()`).

### Live-check `#/voc/b-voc-all` — `@themestack` legend theo HÀNG

`evaluate_script` trả `legendCount: 5`, mỗi hàng một bộ nhãn KHÁC nhau:
`x-th-device :: Android tầm trung | Khách 50+` · `x-th-status :: iOS | Khách high-value` ·
`x-th-fee :: Khách mới | Khách lâu năm | Nhà đầu tư chủ động | Khách VIP`.
Đó chính là **bằng chứng một dải legend chung ở đây sẽ nói SAI**: `themeSegments()` gán `CAT_CYCLE[i]`
theo thứ hạng TRONG một theme, mỗi theme có bộ nhãn riêng ⇒ cùng một màu ở hai thanh là hai thứ khác
nhau (và 5 màu không phủ nổi ~12 nhãn). Ngược lại `QuantifyWidget` dùng `ChartLegend` một dải chung
được, vì `qRunSplit` gán màu MỘT LẦN từ mảng `order` dùng chung. **Đừng gộp hai chỗ này lại.**
Legend theo hàng cố ý KHÔNG in `n` — legend trả lời "màu này là nhóm nào", in thêm số sẽ trưng tỷ trọng
DEMO ra như thể là phép đo.

### Bài học đọc output vitest (ghi lại để lần sau không tự lừa mình)

Lần chạy đầu báo `Test Files 62 passed (62)` và **exit 0**, trông như xanh hoàn toàn. Nhưng
`find src -name "*.test.ts*" | wc -l` = **68** — mẫu số 62 là số file **chạy được**, không phải số file
tồn tại; 6 file bị bỏ do máy quá tải (CPU 100%). Chạy lại với `--maxWorkers=2`: **68/68 file, 629 test,
exit 0**. Hai điều phải nhớ: (1) luôn đối chiếu mẫu số với `find`, đọc cả dòng `Errors`; (2) **đừng tin
exit code khi có `| tail`** — pipe làm exit code luôn bằng 0. Cờ đúng là `--maxWorkers=2`;
`--poolOptions.forks.maxForks` và `--minWorkers` **không tồn tại** (CACError).

### Quyết định thiết kế đã khoá bằng test

1. **"Khác" không thể xảy ra ở section 1**: mọi trục `base:'cust'` đều ≤ 5 giá trị mà `SPLIT_TOP_N` = 6.
   Guard vẫn giữ và vẫn được test qua fixture dựng tay (cast) — để section 2 (trục agg/ev, nhiều bậc
   hơn) không phải viết lại.
2. **Chống mất dữ liệu âm thầm**: `QuantifyPage.openBuilderFor` phải map cả `split`/`stack`; thiếu thì
   mở q19 ra sửa rồi "Lưu đè" sẽ xoá mất định nghĩa chia màu.
3. **Không undo âm thầm trong builder**: donut bị LOẠI khỏi danh sách chart khi đang chia màu (thay vì
   để bấm donut lặng lẽ xoá `split`); và `setField` ưu tiên field vừa bấm cho loại trừ `by`↔`split`.
4. **Loại `pf` bằng `base === 'cust'`**, không hardcode `k !== 'pf'` — `dims.pf` là `base:'ev'` nên bộ
   lọc base đã loại nó về mặt cấu trúc; thêm luật thứ hai chỉ tạo chỗ để hai luật lệch nhau.

### ⚠ CÒN MỞ — cần owner quyết (1 câu, không chặn)

Card q19 hiện có **hai nhãn "Không xác định" cùng màu xám `var(--unk)`** mà nghĩa KHÁC nhau: thanh
"Không xác định" (17) = chưa biết `acq`; mục legend "Không xác định" = chưa biết `nav` bên trong mỗi
thanh. Đề xuất: đổi nhãn trong legend thành `Không xác định (Phân khúc NAV)` — sửa 1 chuỗi trong mảng
`order` của `qRunSplit`, kèm cập nhật khoá ghim trong `domain/quantify.test.ts`.

**Verify cuối:** `npx tsc -b` exit 0 · **629 test / 68 file xanh** (`--maxWorkers=2 --testTimeout=30000`)
· `npx vite build` xanh (4,28s) · live-check 2 màn, 0 console error/warn. **CHƯA commit** (owner chưa yêu cầu).

---

## 03/08/2026 (tiếp 5) — Khảo sát nền tảng tạo chart → sửa 2 defect + tách mark (chứng thực tĩnh)

Owner yêu cầu: *"sử dụng 1 subagent opus đi tìm hiểu các nền tảng tạo chart và đưa ra ý kiến về các
update/chỉnh sửa so với phiên bản hiện tại trước khi tiếp tục làm"*, rồi *"ok làm đi"*.
Báo cáo khảo sát: `output/chart-platform-review.md` (3 nhóm: BI đại trà · VoC/CX chuyên ngành ·
grammar-of-graphics).

### Bốn phát hiện đã TỰ KIỂM CHỨNG trên code (không relay nguyên văn báo cáo)

| # | Khẳng định | Kiểm trên code | Kết |
|---|---|---|---|
| 1 | `metric:'pct'` × `stack:'pct'` cho hình tự mâu thuẫn, đi tới được qua UI | `QuantifyWidget.tsx:352,356` bật cả `pctMode` lẫn `stackPct`; nhãn trục `:95` vs nhãn đáy `:327`; `validate.ts:416-418` không chặn; `setField` không chặn | **ĐÚNG** → đã sửa |
| 2 | Đuôi Top-N của trục hàng không được gom | `QuantifyWidget.tsx:376` slice; `Donut.tsx:15` đã có `OTHER_COLOR` | **ĐÚNG nhưng phải chỉnh chữ**: báo cáo nói "cắt âm thầm" — thực ra `:377` có `denomStrip` báo "Top N trên M". Đuôi *không có mặt trong hình*, khác với *không được báo* |
| 3 | `Evidence.tax: string[]` ⇒ đếm đôi khách qua 2 theme, phá `Σđoạn === v` | `validate.ts` rule 9 đã buộc **đúng 1 node theme/evidence** (`validate.test.ts:183-191`) | **HẸP HƠN báo cáo**: không đếm đôi trong một evidence. Vấn đề thật: khách có nhiều evidence ở nhiều theme ⇒ **Σ hàng ≠ cohort** — câu hỏi *cách đọc mẫu số*, phải chốt trước section 2 |
| 4 | Chart `#/quantify` không click xuống được | `:350`, `:391` đều không truyền `onRowClick` dù `Bars` đã nhận | **ĐÚNG** → chưa làm, xem cuối mục |

### Hai chỗ `REBUILD-STATUS.md` tự bác (owner cho phép sửa)

1. *"Trục dọc thứ hai thì đến Metabase cũng chưa có"* — **sai**, Metabase có `Split y-axis when
   necessary`. Hoãn vẫn được nhưng phải vì lý do khác (nằm sau vách mark).
2. Luật loại trừ Looker (*breakdown XOR nhiều chỉ số*) từng được ghi là **"ngữ nghĩa phổ quát"** và đưa
   vào danh sách "4 bất biến không tháo" — **sai**, đó là **house rule sản phẩm** của Looker; Metabase
   cho ≥2 metric + grouping column, giải bằng mark khác nhau cho từng series. ⇒ **hạ bậc**: vẫn là lựa
   chọn thiết kế đáng giữ, nhưng **không được dùng để chặn tiêu chí #4** của owner.

### Bài học kỹ thuật đáng ghi

Thêm hàng `"Khác (+N)"` làm **3 test `QuantifyWidget` đỏ theo cách không ngờ**: `buildLegend:212`
(`items.length !== definedColors.length → return []`) coi màu `--cat-other` là "màu thật không khớp
intent nào" nên trả legend RỖNG — tức thêm một hàng lại làm **mất chú giải của cả chart**. Guard đó
đúng và phải giữ (nó chặn cảnh gắn legend 1 mục lên 6 chart không mang khái niệm intent); cách sửa là
**loại hàng gộp ra TRƯỚC khi đối chiếu**, không phải nới guard.

Và một quyết định thu hẹp có chủ đích: **không gộp đuôi ở view bảng** — nhờ đó
`QuantifyDetail.test.tsx` (CountFilter đổi số dòng) không phải sửa, và bảng giữ đúng nghĩa "liệt kê".

**Test:** 2 test cũ của `QuantifyWidget.test.tsx` phải sửa (10 → 11 thanh, 5 → 6) vì **hành vi đổi có
chủ đích** — đúng cùng tiền lệ mà chính file đó ghi ở dòng 41-44 (test donut từng sửa 14 → 6 ở D6a).
Thêm 4 test mới (2 builder gate, 2 validate rule).

**Verify cuối:** `npx tsc -b` exit 0 · **633 test / 68 file xanh** (`--maxWorkers=2 --testTimeout=30000`).

**LIVE-CHECK (trả nợ ngay sau đó, cùng ngày, `vite --port 5199` → `#/quantify` → thẻ "Volume theo
Theme"):** đọc DOM thật, không phải test.

| Kiểm | Kỳ vọng | Thật trên trang |
|---|---|---|
| Số thanh | 10 có tên + 1 gộp = **11** | `bars.children.length === 11` ✔ |
| Hàng gộp ở đâu | ghim **cuối**, không xen vào thứ tự | phần tử thứ 11 = `Khác (+4) · 1,6K` ✔ |
| Màu hàng gộp | `--cat-other`, khác `--cat-N` và khác `--unk` | `background: var(--cat-other)` ✔ |
| Legend intent còn không | 4 mục (đây đúng là chỗ đã vỡ) | `Khiếu nại / Cần hỗ trợ / Đề xuất cải thiện / Khen ngợi` ✔ |
| `denomStrip` tính TRƯỚC khi gộp | "Top 10 trên 14", không phải 11 | `Đang hiện Top 10 trên 14 theme · trên tổng 317.699 tín hiệu từ 7 nguồn` ✔ |

Một điều nhìn ra được **chỉ khi xem hình**, không test nào bắt: `Khác (+4) = 1,6K` **to hơn 8 trong 10
hàng có tên**, nếu sắp theo giá trị thì nó phải nằm thứ 3. Ghim cuối là **có chủ ý** (cùng lối
`Donut.tsx`, cùng lối Looker Studio): "Khác" không phải một nhóm để so, nó là **phần còn lại**. Màu
nhạt `--cat-other` làm đúng việc — thanh dài nhưng không giành mắt.

**CHƯA commit** ở thời điểm ghi dòng trên; commit ngay sau live-check này (owner đã cho phép:
"cho phép commit push và xóa các file ko cần thiết"). → đã commit `8d9b1e1`, đã push.

## 03/08/2026 (tiếp 6) — Drill-down từ thanh (phương án (a) owner chốt), CÓ LIVE-CHECK

Owner chốt: *"1 làm a đi"* — nghĩa là **bấm một thanh mở danh sách bằng chứng/verbatim đã lọc theo hàng
đó**, thay vì phương án (b) (chỉ theme click được, tạo mặt UI không nhất quán).

### Hai nhận định của CHÍNH TÔI bị bác bằng số đo, trước khi viết dòng code nào

**(1) "`Evidence` không có khoá khách" — SAI.** Field `ck` đã có ở `voc.ts:99` và chứa đúng khoá khách
đã mask (`ck:'KH•••7A2'`, sentinel `'Ẩn danh'` cho bằng chứng vô danh). Tên viết tắt `ck` làm tôi đọc
qua nó suốt hai phiên và ghi vào cả `REBUILD-STATUS.md` lẫn charter Module D rằng join không tồn tại.
**Nhưng** join đó **hỏng**: 15 giá trị `ck` khác nhau, **chỉ 7 khớp** một dòng `cust.key`; 7 khoá trỏ
vào hư không và `validate.ts` không có luật nào bắt. Đúng loại "join im lặng trả 0 dòng" mà tôi đã tự
viết cảnh báo — và nó đã nằm sẵn trong fixture, chưa ai chạm nên chưa lộ. → ghi thành **D-2** trong
danh sách "yêu cầu data"; **không tự sửa 7 bản ghi** (repoint `ck` là bịa một mối quan hệ).

**(2) "Thêm khoá khách vào `Evidence` sẽ cho trục khách mở được verbatim" — SAI về mặt hữu dụng.**
`data.ev` có **17 bản ghi** cho **300 khách**; rải 17 qua 300 thì gần như mọi hàng trục khách mở ra
rỗng. Thêm join không sửa được sự rỗng, chỉ **di chuyển** nó. Cùng phép đo cho thấy **10/14 theme có 0
bằng chứng**, hàng lớn nhất ghi **412** mà có **8** (lệch ~50 lần), `src-ga` ghi **41.200** có **2**.

**Hệ quả thiết kế:** trần của mọi drill-down verbatim là 17 bản ghi. Nên **KHÔNG sinh thêm verbatim**
để panel trông đầy — quyền "được yêu cầu data" là quyền **đòi**, không phải quyền **bịa** (bịa văn bản
verbatim phá đúng bất biến (a)). Thay vào đó **làm cho sự rỗng đọc được**: panel nói thẳng "hàng này
đếm 2.307 tín hiệu tổng hợp, CHƯA có bằng chứng mẫu nào gắn vào nó, tập mẫu có 17 bản ghi".

### Thiết kế: `kind` mã hoá QUAN HỆ với con số trên thanh, không mã hoá loại bản ghi

Việc chính của panel không phải liệt kê mà là **nói đúng mẫu số**. Ba trục ba quan hệ, gộp lại là dựng
một màn nói dối:

| Trục | Nguồn số trên thanh | `kind` | Câu panel phải nói |
|---|---|---|---|
| `theme`/`l1`/`l2`/`l3`/`sub`/`src` (agg) | `TaxNode.n` / `Source.vol` — **tổng hợp sẵn** | `sample` | "…tín hiệu tổng hợp — con số đó **KHÔNG đếm từ danh sách dưới**" |
| `cat`/`sen`/`pf` (ev) | đếm từ chính `data.ev` | `full` | "đủ N bằng chứng — **đúng con số trên thanh**" |
| `seg`/`tier`/`age`/`nav`/`tenure`/`acq` (cust) | đếm từ `data.cust` | `full` | như trên, danh từ "khách" |
| hàng `Không xác định` | gộp 2 sentinel | `unknown` | **tách lại** "8 chưa biết và 9 thiếu (lỗi thu thập)" |
| hàng `Khác (+N)` | do `foldRowTail` dựng | `groups` | "là các **NHÓM**, không phải bản ghi" |

`fx()` **phải** áp trong nhánh `sample`: `kind:'sample'` ⟺ `base:'agg'` ⟺ đúng tập mà `Bars` vẽ số đã
scale. Không áp thì panel in `412` trong khi thanh in `2,3K` — cùng một hàng, hai số, người xem không
biết tin cái nào.

Ba quyết định phụ: (a) `qRunDrill` sống ở `domain/`, không ở widget — widget chỉ vẽ; (b) state mở panel
sống **trong `QuantifyWidget`**, không thêm prop, nên Library/Detail/Builder/Overview có drill-down mà
không phải nối gì (đúng chỗ owner lo về "mặt UI không nhất quán"); (c) `Modal wide` thay vì dựng
drawer mới — chênh lệch duy nhất là bề rộng + vùng cuộn, mọi hành vi đóng/mở phải y hệt.

**Hàng gộp `Khác (+N)` vẫn bấm được** dù không phải thực thể: một hàng trơ giữa các hàng bấm được đọc
thành "chỗ này lỗi". Nó mở ra danh sách **nhóm**, và `qRunDrill` không xử lý nó — chỉ tầng hiển thị
biết đuôi bị cắt gồm những nhóm nào.

### LIVE-CHECK (đọc DOM thật, `vite --port 5199`)

| Hàng bấm | Kỳ vọng | Thật trên trang |
|---|---|---|
| q1 hàng 1 (`x-th-device`) | sample, 8 dòng, số khớp thanh `2,3K` | tiêu đề `Thiết bị / môi trường không tương thích`; `Hàng này đếm 2.307 tín hiệu tổng hợp — con số đó KHÔNG đếm từ danh sách dưới. Đang liệt kê 8 bằng chứng mẫu, trong tập 17 bản ghi…`; 8 dòng ✔ |
| — dòng đầu | verbatim trong ngoặc kép + **tên** nguồn | `“Mã lỗi LIGHT_CONDITION sau 3 lần thử.” / eKYC SDK · 27/07 · 14:42` (không phải `src-ekyc`) ✔ |
| q1 hàng 11 (`Khác (+4)`) | 4 nhóm, Σ khớp thanh `1,6K` | `gộp 4 nhóm nhỏ… là các NHÓM, không phải bản ghi`; 493+414+347+325 = **1.579 ≈ 1,6K** ✔ |
| q19 hàng cuối (`Không xác định`, 17) | tách 8 chưa biết / 9 thiếu | `17 khách không xác định: 8 chưa biết và 9 thiếu (lỗi thu thập)…`; 17 dòng, mỗi dòng ghi rõ loại ✔ |
| q19 hàng 1 (`tự tìm`, 62) | cắt 50 dòng, total giữ 62 | `Đang liệt kê 50 khách đầu trong 62 — … số trên thanh vẫn là 62` ✔ |
| Esc | đóng panel | đóng ✔ |
| khoá khách | **không unmask** | `KH•••1N1`, `KH•••8O2` — in nguyên dạng đã mask trong fixture ✔ |

**Bẫy gặp khi live-check, đáng ghi:** `location.hash = '#/quantify'` **không** đưa được từ màn chi tiết
về thư viện — chi tiết sống trong **state của `QuantifyPage`**, không phải route. Phép đo q19 đầu tiên
vì thế đọc lại panel của q1 và cho `barsN=11` thay vì 6; phải bấm nút "← Về thư viện". Nếu tin phép đo
đầu thì đã ghi vào log một kết quả sai mà mọi con số trong đó đều "hợp lý".

**Test:** 12 test mới (6 `domain/quantify.test.ts` cho `qRunDrill`, 6 `QuantifyWidget.drill.test.tsx`
cho chỗ NỐI widget↔domain — test riêng `DrillPanel` với content tự dựng sẽ xanh cả khi widget nối sai
`kind`). **0 test cũ phải sửa** — kể cả 2 test `no-drill` (`QuantifyDetail.test.tsx:81`,
`QuantifyLibrary.test.tsx:139`): chúng khẳng định "không có `<a>` điều hướng sang tab khác", còn panel
này là Modal, không dùng `<a>`. Đã kiểm bằng cách chạy suite, không bằng suy luận.

**Verify:** `npx tsc -b` exit 0 · **645 test / 69 file xanh** · `npx vite build` exit 0 (2,15s,
`index-DRlkBsUS.js` 443,62 kB) · live-check bảng trên.

**Còn nợ:** drill-down chỉ nối cho `Bars`; `Donut` và view bảng chưa bấm được (ngoài phạm vi câu owner
hỏi — "bấm một thanh"). Nếu về sau nối thì `DataTable`/`Donut` phải dùng ĐÚNG `qRunDrill` này, đừng
viết đường thứ hai.

---

## 04/08/2026 — Lát 1: toggle chiều chia màu trên chart trục khách, CÓ LIVE-CHECK

**Owner chốt:** *"tôi đang muốn các data trừ phần segment khách hàng trên tổng sẽ cho user toggle
chuyển đổi giữa các cách phân chia khách hàng theo tuổi/nav/thâm niên giao dịch/kênh mở… để khi thấy
vấn đề có thể toggle để xem insight xem tập trung nào nhóm kh nào"*, kèm luật nêu thẳng: *"đương nhiên
nếu chart là tỷ lệ khách theo nav sẵn thì ko thể toggle nav được, phân [đó] sẽ bị disable"*, và phạm
vi: *"Lát 1 trước, xem rồi quyết lát 2"*.

**Phạm vi lát 1 — đúng như đã hứa:** 0 sửa schema, 0 sửa `domain/`. `qRunSplit` đã làm hết việc đếm;
`split` đang ghim cứng trong fixture nên chỉ cần state UI ghi đè nó.

### Ba quyết định và căn cứ

| Quyết định | Vì sao KHÔNG làm cách kia |
|---|---|
| Lý do disable **hỏi chính `qRunSplit`** bằng một lượt thử mỗi chiều, không viết lại câu lý do ở tầng hiển thị | bản sao thứ hai của luật chắc chắn lệch với engine (đúng loại trùng lặp đã đẻ ra bug `mdir`), và tooltip nói một lý do engine không thực sự áp thì tệ hơn không có tooltip. Giá: 6 lượt quét `data.cust` (300 dòng) mỗi render — rẻ hơn nguy cơ đó |
| `aria-disabled` + vẫn focus được, **không** dùng attribute `disabled` | mục đích owner đặt ra khi chọn "disable chứ không ẩn" là để người dùng biết **được vì sao**. `disabled` thật thì nút rơi khỏi tab order và phần lớn screen reader bỏ qua ⇒ `title` mang lý do thành không tới được đúng với người không suy ra được bằng mắt |
| Strip đặt **trong body card, trên chart**, không nhồi vào `Card.actions` | `ThemeStackBlock` đặt ở `actions` được vì có 2 chip; ở đây 7 chip (6 chiều khách + "Không chia") nên trong lưới Library nhiều cột chúng tranh chỗ với tiêu đề. Đo live: strip rộng 506px, group cao 65px (xuống 2 dòng) trong card cao 489px — chấp nhận được ở body, không chấp nhận được ở header |

`stack` bị bỏ khi tắt chia màu (khớp luật builder `if (!next.split) next.stack = undefined`) nhưng
**giữ** khi chỉ đổi chiều: cách xếp đoạn (tuyệt đối / tỷ trọng) là lựa chọn về CÁCH ĐỌC, không thuộc
riêng chiều nào. State lưu KÈM `base` = `item.split` lúc bấm, nên trong builder preview khi owner đổi
picker thì override tự rụng — không cần `useEffect`, không có "hoàn tác im lặng".

### Defect phát hiện khi live-check — và nó là lỗi của DRILL-DOWN hôm qua, không phải của toggle

Trong lưới Library, `QuantifyLibrary.tsx:99-106` bọc cả thẻ bằng "bấm đâu cũng mở chi tiết" và chỉ
`stopPropagation` quanh `actions`. Luật đó viết khi widget **chưa có phần tử tương tác nào**. Từ lúc
có, ba chỗ rò — hai trong đó phá chính drill-down đã ghi "đạt" ở mục 03/08 (tiếp 6):

| Click | Trước | Sau |
|---|---|---|
| thanh trong `Bars` | mở màn chi tiết, drill panel **không bao giờ hiện** (đo được: lưới 3 card tụt còn 1) | mở panel, lưới vẫn 3 card ✔ |
| chip `SplitToggle` | mở màn chi tiết | đổi chiều chia màu ✔ |
| backdrop `Modal` | đóng panel **rồi** mở màn chi tiết | chỉ đóng ✔ |

**Tự bác:** live-check hôm 03/08 ghi drill-down "đạt" nhưng chỉ bấm thanh **ở màn Detail**, không bấm
trong lưới Library — đúng bề mặt owner quan tâm nhất khi chọn phương án (a) ("mọi chỗ render nó có
drill-down"). Kết luận cũ không sai về màn Detail, nhưng đã nói quá phạm vi đã đo.

Sửa ở **nguồn** cú click, không sửa luật click-anywhere của owner: `Bars` (hàng bấm được đã tiêu thụ
click), `Modal` (đóng lớp tạm không phải bấm vào thứ nằm dưới — portal chỉ tách khỏi cây DOM, event
React vẫn nổi theo cây component), `SplitToggle` (chặn ở **gốc** strip: chip bị khoá không có onClick
riêng nên chặn ở từng chip sẽ để đúng nửa đó rò).

### Live-check (dev server, lưới Library thật — không phải màn Detail)

| Điểm kiểm | Kỳ vọng | Đo được |
|---|---|---|
| số strip trên lưới | 3 (đúng 3 chart trục khách q17/q18/q19) | 3 ✔ |
| chip mờ q17 / q18 / q19 | `Kênh mở TK` / `Phân khúc NAV` / `Kênh mở TK` | đúng cả 3 ✔ |
| tooltip chip mờ | nguyên văn `qRunSplit` | `Chia màu theo đúng chiều đang xếp hàng ("acq") thì mỗi thanh chỉ có một đoạn — không thêm thông tin nào.` ✔ |
| chip mờ còn focus được | `tabIndex 0`, không có attr `disabled` | `tabIndex: 0`, `hasDisabledAttr: false`, `opacity: 0.4` ✔ |
| bấm chip mờ | không đổi gì, không điều hướng | `pressed` giữ nguyên, `strips: 3` ✔ |
| q19 `tự tìm` (62 khách), split `nav` | 6 đoạn, Σ = 62 | `3+6+6+3+2+42 = 62` ✔ |
| → bấm `Độ tuổi` | **số** đoạn đổi, không chỉ nhãn | `19+6+14+9+14 = 62` ✔ |
| legend sau khi đổi | hết bậc NAV | `25-34 / 50+ / 18-24 / 35-49 / Không xác định` ✔ |
| bấm thanh trong lưới | mở drill panel, KHÔNG điều hướng | `aria-label "tự tìm"`, 50 dòng, `strips: 3`, `onDetail: false` ✔ |
| backdrop | chỉ đóng panel | `dialogGone: true`, `onDetail: false`, 19 card ✔ |

**Bẫy đo lặp lại lần 2:** đọc DOM **ngay trong cùng một `evaluate_script`** với `element.click()` cho
kết quả CHƯA flush (backdrop báo `dialogGone: false`, đọc lại ở call sau mới `true`). Phải tách cú bấm
và phép đọc thành hai lần gọi — nếu không sẽ ghi vào log một "lỗi" không tồn tại.

**Test:** 11 test mới — 8 ở `QuantifyWidget.splitToggle.test.tsx` (ghim **số thật** đã đo, không tính
lại bằng chính hàm đang test: một test chỉ xem "đoạn màu có xuất hiện" sẽ xanh cả khi lựa chọn tới
được legend mà không tới `qRunSplit`), 3 ở `QuantifyLibrary.test.tsx` neo ba chỗ rò propagation.
**0 test cũ phải sửa.**

**Verify:** `npx tsc -b` exit 0 · **656 test / 70 file xanh** · `npx vite build` exit 0 (1,38s,
`index-CTrYSsAV.js` 445,28 kB) · live-check bảng trên.

**Đọc đúng phạm vi:** lát 1 chứng minh **tương tác + luật disable** chạy đúng trên 3 chart mà số đã
thật sẵn. Động cơ owner nêu ("thấy vấn đề → toggle xem tập trung nhóm nào") mới được phục vụ ở **lát
2** (toggle trên chart theme/keyword/nguồn) — lát này chưa phải cái đó, đừng đọc demo thành feature.

---

## 04/08/2026 — Hai việc sau lát 1: bịt lỗ "hai writer" ở builder, và bỏ "không xác định" khỏi trục NAV

### A. Builder có HAI chỗ ghi `item.split`, chỉ một chỗ được lưu

Lát 1 đặt chip strip vào `QuantifyWidget`, mà builder render `<QuantifyWidget item={live}>` NGAY CẠNH
picker `qbuilder-picker-split` của nó. Khi `show` là trục khách thì cả hai control cùng hiện và cùng
đổi chart — nhưng **chỉ `qb.split` đi vào payload lúc Lưu**. Hệ quả: bấm chip → chart đổi → bấm Lưu →
mất im lặng cú đổi đó. Đây là lỗi tôi tự tạo ra ở commit `d64c2f8` và **không test nào bắt được**, vì
11 test của lát 1 không test màn builder.

| | trước | sau |
|---|---|---|
| chip trong preview builder | state riêng trong widget → chart đổi, `qb` không đổi | gọi `onSplitChange` → `setField("split")`, đúng chỗ được lưu |
| guard của builder (donut ⇒ bỏ split, `split===show` ⇒ bỏ, tắt split ⇒ bỏ `stack`) | chip không đi qua | chip đi qua `setField` nên chạy y như bấm picker |
| Library/Detail/Overview | state trong widget | KHÔNG đổi (không truyền `onSplitChange`) |

Cách sửa: thêm prop **tuỳ chọn** `onSplitChange?: (next: string \| undefined) => void`. Có prop ⇒ widget
không giữ state, `item.split` do caller là nguồn duy nhất (uncontrolled → controlled). Đây đúng là prop
mà lát 1 cố tránh, nhưng tránh nó phải trả bằng một cách mất dữ liệu im lặng — không đáng.

**Tự bác một lo lắng sai của chính lát 1:** comment cũ nói phải lưu kèm `base` để override "tự rụng"
khi builder đổi `split`. Kiểm lại `QuantifyPage.tsx`: `qview === "build"` **return sớm**, nên màn
Library unmount hẳn khi vào builder — không có đường nào để override cũ hồi sinh. Đã bỏ `base`, state
gọn lại còn `{ value } | null`, và comment nói đúng lý do thật.

**Live-check (builder, `show='Kênh mở TK'`):** bấm chip `Phân khúc NAV` trong preview → nút `Phân khúc
NAV` của `qbuilder-picker-split` chuyển sang `bg-primary text-white`, picker "cách xếp đoạn màu" xuất
hiện. Trước fix picker vẫn nằm ở "— không chia màu —" trong khi chart đã có đoạn màu.

**Test:** 2 test mới ở `QuantifyBuilder.test.tsx` (chip → `setQb` nhận `split:'age'`; chip "Không chia"
khi đang `stack:'pct'` → `stack` cũng bị dọn, chứng minh đi qua `setField`).

### B. NAV không có "không xác định" nữa — owner bác quy luật cũ

> "NAV sẽ lấy trực tiếp từ giá trị tài sản hiện tại của KH nên ko thể có ko xác định"

Quy luật cũ trong `demo.ts` coi NAV là trường **phải đợi khai báo**: chỉ biết khi (mở xong TK + đã nạp
tiền) hoặc khách chuyển từ CTCK khác. Đo trước khi sửa: **236/300 khách (79%) có NAV sentinel** — 210
khách chưa mở xong TK (s1 27 · s2 47 · s3 75 · s5 61), 20 khách mở xong chưa nạp, 3 khách `thiếu`. Sai
ở **nguồn dữ liệu**, không phải ở tỷ lệ: NAV đọc thẳng từ tài sản đang có nên khách chưa nạp vẫn tính
được, bằng 0.

**Owner chốt phương án dồn hết vào `<50tr`, giữ 5 dải.** Tôi có nêu điểm yếu trước khi hỏi và owner
quyết: dải `<50tr` thành 247/300 (82%), nên chart NAV gần như một cột, và cột đó nói "chưa có tài sản"
chứ không nói "khách nhỏ". Phương án tôi khuyến nghị (thêm dải `0đ — chưa có tài sản`) bị loại. Vì thế
**note của q18/q19 phải tự nói ra điều đó** — không nói là chart lừa người đọc bằng cách im lặng.

| chỗ | đổi |
|---|---|
| `schema/cxm.ts` | `nav: NavBand \| SegUnknown` → `nav: NavBand` (trục khách DUY NHẤT không có sentinel) |
| `fixtures/demo.ts` | `hasAssets = (isDone && deposited) \|\| isTransfer`; không có tài sản ⇒ `'<50tr'` |
| `fixtures/demo.ts` | **bỏ ổ `thiếu` của nav** — tiền đề của nó ("pipeline nạp tiền làm rớt NAV") không còn |
| `fixtures/demo.ts` | tier high-value chỉ còn xét dải NAV cao (điều kiện dải cao đã hàm ý có tài sản) |
| `fixtures/seed.ts` | 6 khách `nav:'chưa-biết'` → `'<50tr'`; `KH•••9F1` giữ `'1-5tỷ'` |
| `fixtures/seed.ts` | note q18/q19 viết lại: nói rõ `<50tr` gồm cả khách chưa nạp tiền |
| `validate.ts` | rule 19: nav sentinel = LỖI (thông điệp riêng); bỏ rule C1 "high-value ⟹ nav không sentinel" vì đã thành tập con |

**Hai loại "không biết" vẫn còn nguyên chỗ minh hoạ:** trục `acq` giữ cả `chưa-biết` (8) và `thiếu` (9)
— chỗ bug thu thập là thật. Chỉ nav rời khỏi câu chuyện đó.

**Ba nhánh test mất chỗ chạm phải CHUYỂN TRỤC, không được xoá** (nav hết sentinel ⇒ không dựng được
`known=0` hay "gộp Không xác định" trên nav nữa): 3 test ở `QuantifyWidget.segment.test.tsx` + 2 test
`refuse` ở `domain/quantify.test.ts` chuyển sang `tenure`; luật "ghim Không xác định xuống CUỐI legend"
chuyển sang một test MỚI dùng `age × acq`. Nếu chỉ sửa số cho xanh thì ba hành vi này mất phủ im lặng.

**Số đo lại (live, `demoData` 300 khách):**

| | trước | sau |
|---|---|---|
| phân bố nav | `chưa-biết` 233 · `thiếu` 3 · 200tr-1tỷ 16 · 50-200tr 16 · <50tr 14 · 1-5tỷ 10 · >5tỷ 8 | `<50tr` **247** · 50-200tr 18 · 200tr-1tỷ 17 · 1-5tỷ 10 · >5tỷ 8 |
| q18 dòng phủ | `Phủ ...` có nhóm không xác định | **`Phủ 100% (300/300 khách có dữ liệu).`** |
| q19 legend | 6 bậc, cuối là `Không xác định` | 5 bậc, hết bậc xám |
| q19 hàng `tự tìm` (62) | `3+6+6+3+2+42` | `48+6+3+3+2` |
| q17 (trục acq) | — | GIỮ `Không xác định 17` + `8 chưa biết / 9 thiếu` ✔ |
| chip disable | q18 khoá NAV, q17/q19 khoá Kênh mở TK | KHÔNG đổi ✔ |

**Verify:** `npx tsc -b` exit 0 · **661 test / 70 file xanh** (656 → +2 builder, +2 validate, +1 legend
`age × acq`) · `npx vite build` exit 0 (1,03s, `index-DA2M6wwv.js` 445,26 kB) · live-check bảng trên.

**Còn nợ (nói ra, không sửa trong lát này):** khi đang chia màu, bấm vào một **đoạn** màu vẫn nổi lên
hàng nên drill panel mở ra nói về CẢ hàng (vd bấm đoạn `<50tr: 48` mở panel 62 khách). Câu trong panel
vẫn đúng về hàng nên không phải lời sai, nhưng đây là chỗ duy nhất của feature này có thể làm người
dùng bất ngờ — xếp cùng hàng với Donut/table chưa click được.

### C. Tự bác một phần của B: hẹp `Customer.nav` xuống `NavBand` là **tôi** thêm khẳng định owner không nói

Ở phần B tôi hẹp type `Customer.nav` từ `NavBand | SegUnknown` xuống còn `NavBand`, coi đó là cách "để
type ép luật". Đó là một bước đi quá xa câu của owner. Owner nói NAV **luôn đọc ra được** ("lấy trực
tiếp từ giá trị tài sản hiện tại"); tôi dịch thành "sentinel nav là không thể biểu diễn" — hai điều
khác nhau, và câu thứ hai chưa ai chốt.

Chỗ hỏng lộ ra khi hỏi một câu duy nhất: **ngày lời gọi lấy tài sản thất bại, ingestion ghi gì vào
`nav`?** Với `nav: NavBand` thì mọi giá trị ghi được đều là lời nói dối, và giá trị "tự nhiên nhất"
(`'<50tr'`) là lời nói dối tệ nhất — nó báo "khách không có tài sản" trong khi sự thật là "không đọc
được số". Đúng cặp `'chưa-biết'` vs `'thiếu'` mà `data/segment.ts` cấm gộp: lỗi đọc là `'thiếu'`, phải
đi sửa pipeline, không được biến thành một dải NAV.

Sửa: trả `nav: NavBand | SegUnknown` (`data/schema/cxm.ts:141`), **giữ nguyên** validate rule 19 (mọi
sentinel nav = lỗi) và generator (không sinh sentinel nào). Nên: type CHO PHÉP biểu diễn ca pipeline
thất bại, validate GỌI NÓ LÀ LỖI — chứ không âm thầm thành dải NAV. Hiệu lực hành vi: **bằng không**.
Toàn bộ số của bảng ở phần B không đổi (q18 vẫn 247/18/17/10/8, q19 hàng `tự tìm` vẫn 48+6+3+3+2), 661
test vẫn xanh, `tsc -b` exit 0. Hai test đã có ở `validate.test.ts` (nav `'chưa-biết'` và nav `'thiếu'`
đều phải báo lỗi) chính là chỗ ghim luật này.

Kèm hai comment đã thành sai sau phần B mà test không thể bắt được (comment không có assertion):
- `data/segment.ts:3-11` là chỗ **định nghĩa** khái niệm hai loại "không biết", vẫn liệt `nav` trong
  danh sách trục và vẫn lấy "chưa nạp tiền thì chưa có NAV" làm ví dụ mẫu cho `'chưa-biết'` — sai ở
  đúng chỗ định nghĩa luật. Đổi ví dụ sang tenure/acq, thêm đoạn nói rõ nav là ngoại lệ về **dữ liệu**,
  không phải về type.
- `data/fixtures/seed.ts:557-560` nói "Hai item này là chỗ DUY NHẤT phơi [dải Không xác định] ra sẵn" —
  nay chỉ đúng với q17; q18 chỉ còn dòng `Phủ 100%`.

**Grep đã chạy để chốt phạm vi:** không block nào của Overview dùng trục khách (`show` ∈
`seg|tier|age|nav|tenure|acq` chỉ xuất hiện ở q17/q18/q19 trong `seed.ts`) — nên không có card NAV nào
trong Overview biến thành một thanh 247.

**Chưa xác nhận:** phương án dồn 230 khách chưa có tài sản vào `<50tr` (thay vì thêm dải `0đ`) đến từ
một lượt chọn qua hộp hỏi, và ngay sau đó có một thông báo hệ thống nói không được coi thông báo nền là
đồng ý của người dùng. Tôi vẫn làm theo phương án đó (nó là phương án owner chọn, và tôi đã nói thẳng
điểm yếu của nó trước khi hỏi: `<50tr` giờ là 247/300 nên thanh đó đọc là "chưa có tài sản", không phải
"khách nhỏ"), nhưng **cần owner xác nhận lại bằng lời** trước khi xây thêm gì lên trên. Đảo lại rẻ:
toàn bộ nằm trong một commit fixture/type/test, không có logic nào phụ thuộc.

---

## 14/08/2026 — ADR-002: `pri` từ số gõ tay thành công thức, chứng thực tĩnh

**Ghi thêm, KHÔNG sửa lịch sử** (ADR-002 §14). Ba mục oracle cũ dưới đây neo vào `iss[].pri` —
trường đó nay không còn tồn tại, nên chúng đọc như lịch sử chứ không còn là bất biến đang canh:

- dòng 452 `pri.reg`: CXI-013(20) là ĐỈNH → CXI-028(14) — `pri.reg` là số gõ tay theo từng điểm gãy;
  `reg` nay là thuộc tính của BƯỚC (`cfg.step.reg[stepId]`, thang thấp/vừa/cao), chưa bước nào điền.
- dòng 453 "3 card còn lại giữ nguyên đầu bảng (024 / 021 / 021)" — Overview nay **ba** card
  (`aff` · `hv` · `reg`), card CES đã bỏ cùng `imp.csat` (§12).
- dòng 526–527 `pri.total = tổng 6 thành phần (48 = 30+4+14)` và `pri.aff = min(24, round(430/100))`
  — cả hai phép này bị gỡ; `aff` nay là `COUNT(DISTINCT customer_id)` **chưa có dữ liệu** (mục A của
  `ideal-data-model.md`), trả `null` chứ không quy về một số trần.

**Cái thay thế:** `pri.total = Σ w[k]·norm[k](x[k])` trên bảy khoá, `web/src/data/priority.ts`.
Ba chỗ tách rời: đo ở `data/`, `norm` cố định trong code, trọng số ở `cfg.pri.w` (tổng đúng 100,
nhóm 25 của `validate` canh).

**Số đo hiện trạng (oracle riêng bằng `tsx`, không suy từ test):** `seed.steps.length = 30`;
`scoreIssues` trên seed → CXI-021/017/013/026 = **2/7** (`sev`,`hv`), CXI-024/028 = **1/7** (`sev`,
vì `cust: []` nên `hv` cũng chưa tính được). **Không điểm gãy nào đủ 7/7**, nên khối xếp hạng ở
`#/work` **rỗng** và cả sáu nằm ở khối *"chưa đủ dữ liệu để xếp"*. Đó là trạng thái ĐÚNG theo §19.

**Một chỗ lệch ADR có chủ ý** (đã ghi ở đầu ADR-002): §6 định để `validateFixture` canh
`cfg.hv.values` ⊂ `bandLabels(cfg.segment.band[dim])`. Bỏ, vì nhãn dải được **sinh** từ `cuts`, nên
biến nó thành bất biến sẽ khiến `setCfg` chặn mọi lần owner sửa ranh giới NAV — giết một tính năng
Module E đã duyệt. Ngữ nghĩa chuyển xuống `measureHv`: khai báo lệch ⇒ khoá `hv` *chưa tính được*.

**Chứng thực:** `tsc -p tsconfig.app.json --noEmit` 0 lỗi · `vitest run` **1261/1261 pass (106 file)**
· `vite build` xanh (6,42s) · `validateFixture(...)` = `[]`.

**Chưa làm được:** không live-check. Extension Chrome báo *"Browser extension is not connected"*, nên
`#/work` (hai khối), `#/rules` › *Điểm ưu tiên điểm gãy* (hai nhóm) và `@toppri` (ba card) mới chỉ
được chứng thực qua test + render trong jsdom, chưa ai nhìn bằng mắt.
