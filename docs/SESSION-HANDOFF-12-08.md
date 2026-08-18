# Handoff — đọc file này TRƯỚC khi làm gì, phiên 12/08/2026

**Chỗ vào của phiên mới.** Thay thế `docs/SESSION-HANDOFF-11-08.md` (file đó giữ lại làm lịch sử, đã
commit). Không phải bản tóm tắt dự án — dự án ở `web/docs/*-charter.md` và `docs/DB-FIRST-HANDOFF.md`
(1095 dòng, **đừng đọc cả**, chỉ tra mục cần).

**Một dòng trạng thái (cập nhật 12/08 tối, sau đợt bảng màu + sidebar + thu gọn nhóm):** nhánh
`feat/module-i-signal-registry` đã push tới `e8060cb`; **56 file đã sửa + 5 file mới, CHƯA COMMIT** —
owner chưa yêu cầu (xem §2; 4 file untracked cũ không tính). `tsc -b` exit 0, **105 file / 1251 test
xanh**, `validateFixture` **0 lỗi trên cả hai fixture** (đợt tối không đụng `data/`). Không còn việc
code nào dở dang.

**Đợt 14/08 — ADR-002, điểm ưu tiên điểm gãy thành công thức.** `iss[].pri` (số gõ tay) bị gỡ khỏi
schema; `pri.total = Σ w[k]·norm[k](x[k])` trên bảy khoá, hàm ở `web/src/data/priority.ts`. Nhóm
*Trọng số* của `#/rules` mở khoá cho sửa, thêm nhóm *Mức của từng bước* (30 bước × `jc`/`reg`).
Hôm nay seed đo được **tối đa 2/7 khoá** nên khối xếp hạng ở `#/work` **RỖNG** và cả sáu điểm gãy
nằm ở khối *"chưa đủ dữ liệu để xếp"* — **trạng thái đúng, không phải hồi quy**. Ba tài liệu:
quyết định `web/docs/adr-002-diem-uu-tien-thanh-cong-thuc.md` · dữ liệu còn phải đi xin
`web/docs/ideal-data-model.md` · nghiệm thu ở cuối `web/docs/certification-log.md`.
`tsc` 0 lỗi, **1261 test / 106 file xanh**, build xanh, **chưa ai nhìn bằng mắt** (extension Chrome
không kết nối được). Vẫn CHƯA COMMIT.

**Đợt 14/08 (2) — ADR-001 chart trục thời gian, dựng THẲNG vào cỗ máy đếm chung.** ADR-002 đã
**commit** (`bb89081`, 35 file — chú ý: commit đó nằm trên `main`, không phải nhánh
`feat/module-i-signal-registry`; nhánh đã được fast-forward vào `main` từ trước phiên, chưa push).
Sau đó owner chốt *"gộp luôn khi dựng đi"* nên chart mới **không** dựng riêng: hạt thô `SigFire`
(`{sigId, val, custKey, pf, at}`) thành nguồn chung, `projectSignalCounts` (cắt theo nhóm khách,
nhận cửa sổ) và `projectSigTrend` (chuỗi theo ngày) đều là **truy vấn** trên nó; `domain/sigCut.ts`
là **một cửa** dùng chung với `#/quantify`. Chart hiện ở `#/signals` mặt 4, hai tầng nối nhau — bấm
một kỳ trên đường thì lát cắt theo nhóm khách nhảy về đúng kỳ đó. **MỘT chart cho mọi điểm đo** —
owner lật §4b cuối ngày 14/08 (*"nhiều đường nhưng cần lồng vào nhau đứng chung 1 chart"*), lưới
đường nhỏ **bỏ hẳn**, mọi giá trị một đường trên cùng một trục dọc; 5 màu phân loại giải bằng hình
của điểm (tròn → vuông → thoi). Màn không in con số so sánh nào — chip `±x điểm %` gỡ bỏ theo lệnh
*"ko giải thích, chỉ vẽ và show data"*. Ba trạng thái của `n` giữ nguyên ba thành
ngữ khác nhau (vạch đứt dọc = 0/0 · nền mờ + điểm rỗng = kỳ chưa đủ · **không vẽ gì** = chưa đo).
Quyết định phát sinh: `web/docs/adr-003-gop-dong-co-dem.md` — **hai mục đổi hành vi có
sẵn**: `validate` nhóm 22 gỡ luật "giá trị chưa khai là lỗi" (bù bằng **nhóm 26** canh hạt thô), và
`volOf` đọc mẫu số từ dòng đếm thay vì `Signal.vol`. Nghiệm thu + số đo ở cuối
`web/docs/certification-log.md`. `tsc` 0 lỗi, **1292/1294 xanh** (2 đỏ đều là `TourOverlay` chập chờn
đã biết, xem ⚠ dưới; chạy riêng 24/24), build xanh. **Vẫn CHƯA COMMIT đợt này** — owner chưa yêu
cầu. **Chưa ai nhìn bằng mắt.**

**Đợt 18/08 — redesign 3 màn MVP theo best practice SaaS dashboard (layout + màu).** Owner yêu cầu
*"tìm hiểu nguyên tắc thiết kế và best practice của các SaaS dạng dashboard/báo cáo và redesign lại
về layout + màu sắc của các màn hình đang cho phép hiển thị ở MVP"*. Quy trình đúng tiền lệ 12/08:
nghiên cứu → dựng **ba hướng** thành bản thu nhỏ ở `output/mvp-redesign-options.html` (kèm §1 bảng
nguyên tắc↦thay đổi, §2 các best practice bị LOẠI vì va luật dự án) → owner chọn **B · Trung tính
lạnh** + chốt **nén GlobalToolbar còn 1 hàng** (đụng shell, 6 màn ngoài MVP có timeframe đổi theo).
Đã làm, 10 file: (1) **token `:root`** (`index.css`) sang bộ xám lam — cam `#c9491a` GIỮ NGUYÊN mã,
`--good` rời ô-liu ~75° sang lục ~141° (khoảng cách hue với watch rộng ra), contrast ĐO LẠI bằng
máy và ghi trong comment (crit 6,5 · watch 5,6 · good 6,0 · ink3 4,7 trên trắng); 3 ràng buộc token
giữ đủ. Nợ 14 màu chart xám LẠNH ngoài token (ghi 12/08) tự đóng vì nền nay lạnh. (2) hex dẫn xuất
kéo theo: JourneySpine hatch `#7D1A12→#8A1D16` + viền `#C8BFAE→#C3CAD3`, AtlasPage
`FLOW_DOT_PENDING #CFC6B6→#C6CDD6`; `TopicLineChart.PAL[0]` KHÔNG đổi (nó = primary, primary không
đổi). (3) `GlobalToolbar` 1 hàng: chips · search co giãn · 3 nút — không nút/nhãn nào bị bỏ.
(4) `PageTitle` t-hero 36px → t-block 22px (mọi màn). (5) khối ① `#/signals`: 3 ô lên mặt TRẮNG, tử
số 19px đậm + "/30" nhạt (textContent vẫn "N / M" nguyên văn), đang-lọc = viền primary + vạch trái.
(6) bảng: thead nền surface-2, vạch dòng hạ line-soft, Badge pill tròn font-semibold (prefix ✓/— và
class token GIỮ — test ghim). (7) `#/rules`: mục nav đang mở = chữ primary + vạch trái; khối "Kết
quả áp lên các bước" từ 6 card 2 cột → danh sách dòng zebra 1 cột, mọi testid giữ. `#/settings`
không cần sửa (đã đúng khuôn max-w + hàng toggle). **Chuỗi mới trên màn: KHÔNG CÓ.** Không assert
nào bị nới. Chứng thực: `npm run build` exit 0 · `vitest run` **109 file / 1300 test xanh** ·
`detect.mjs --json` trên cả 10 file → `[]` · screenshot Playwright 1440×1000 cả 3 màn MVP + atlas
(màn ngoài MVP, soi token lan đúng). Không đụng `data/`, không chạy lại oracle. **CHƯA COMMIT** —
owner chưa yêu cầu. Việc owner còn nợ mắt: 3 màn MVP + lướt 10 màn mờ xem bảng màu lạnh có chỗ nào
gãy (đã soi atlas, còn 9 màn chưa ai nhìn).

*Bổ sung cùng đợt (advisor rà):* (i) soi thêm **1280×900** (min-width của body) — toolbar 1 hàng
KHÔNG gãy, 3 ô kiểm kê vừa, placeholder ô tìm bị cắt trong input (chấp nhận, không wrap);
(ii) soi **trạng thái tương tác**: tile đang-lọc viền primary + chip "Đang tô", hàng opacity-50
vẫn đọc được trên nền lạnh, thead surface-2 dính đúng khi cuộn, profile mặt 1–4 lành;
(iii) hai docblock trích số contrast CŨ theo "Giấy đậm" đã đo lại và sửa: `buttons.ts`
(--line 1,6→**1,3** · --ink3 4,6→**4,7**, hai bên ngưỡng 3:1 không đổi — lập luận viền nút giữ
nguyên) và comment `--cat-other` trong `index.css` (~2,2→**~2,1**). Chỉ sửa comment, không sửa
dòng code nào; detect.mjs trên 2 file → `[]`.

**Đợt 18/08 (chiều) — sidebar + thuật ngữ sang tiếng Anh quy ước, tinh chỉnh layout hai màn MVP.**
Owner yêu cầu: *"chỉnh sidebar sang tiếng Anh trùng tên màn, redesign layout màn signal + rules dễ
thao tác hơn, sửa cách dùng từ conventional hơn (vd 'Chỉ số được nuôi', 'Mốc thấy cuối')"*.

RANH GIỚI NGÔN NGỮ đã chọn (ghi để đợt sau giữ nhất quán): NHÃN/THUẬT NGỮ UI hardcode (nav, tiêu đề
cột, nhãn field, tên card, nút, option lọc, giá trị trạng thái, aria-label) → tiếng Anh quy ước
ngành; CÂU VĂN tả dữ liệu (Note, câu kết quả "Quá nhịp giao N ngày…", câu lỗi cfgIssues, câu chờ
pipeline) và MỌI CHUỖI trong `data/` (seedNav, tour, tên bước/chỉ số/nguồn) → giữ tiếng Việt.
`data/` không đụng → không chạy lại oracle.

Việc đã làm: (1) `NAV_GROUPS` 13 nhãn + 4 nhóm sang EN (Signals · Metrics & Thresholds · Settings…);
tiêu đề màn TỰ trùng vì header = navLabel (luật 06/08). Nút "← Điểm đo" của hồ sơ đổi thành lấy từ
`navLabel("signals")` — hết chỗ gõ tay trôi nhãn. (2) Bảng Signals: 6 cột sang thuật ngữ
tracking-plan (Event · Traffic · Volume /day · Linked metrics · Last seen · Status), bề rộng cân
lại 28/8/10/21/15/18. (3) Ba bảng thuật ngữ trạng thái dùng CHUNG đổi một chỗ ăn toàn app:
`SIGNAL_STATUS` (Live · Validating · Spec ready · Not tracked), `Badge.ST_LABEL` (OK · Warning ·
Critical · No data — kiểu Datadog), `DECLARED_STATE_LABEL` (trusted · validating · spec ready ·
not tracked). (4) #/signals ba khối ① ② + governance, hồ sơ điểm đo (card/field/aria), filter
(placeholder, option), chip "Highlighting N / M signals", xuất xứ mốc "system · source feed" /
"self-reported" / "never". (5) #/rules: menu 8 nhóm + 4 tiêu đề cụm, mọi FieldRow/th/nút/suffix
("days", "times", "cust."), ApplySection "Effect on current data". (6) Toolbar (Apply filters ·
Reset · Save as default), tour footer "Start the guided tour", Settings ON/OFF. (7) Layout: ô tìm
bảng Signals `w-[320px]` → `flex-1 min-w-[220px] max-w-[320px]` — cả hàng lọc nằm MỘT dòng ở 1280
(nhãn EN ngắn hơn); "Spec ready" hết tràn cột Status từng thấy ở 1280.

Test: các pin chuỗi cũ ĐỔI THEO (đổi tên, không nới assert — testid, ✓/—, "N / M", aria-pressed giữ
nguyên byte). Chứng thực: tsc 0 · build 0 · **1300/1300 xanh** (full run; TourOverlay ca "flow
ngoài pilot" flake 2 lần dưới tải rồi xanh — race waitFor có sẵn, không phải hồi quy, chạy riêng
luôn xanh) · detect.mjs mọi file sửa → `[]` · screenshot 1280 + 1440 cả 4 màn + hồ sơ. **CHƯA
COMMIT.** Nợ để lại: (a) câu văn VN đứng cạnh nhãn EN — màn hình song ngữ là CHỦ Ý theo ranh giới
trên, owner muốn EN toàn phần thì mở đợt dịch câu văn + luật 11/08 soát lại từng câu; (b) 10 màn mờ
ngoài MVP vẫn nhãn VN trong THÂN màn (sidebar đã EN) — cùng đợt đó.

Hai việc owner để lại **sau chart**, chưa đụng: (A) redesign `#/work` — lịch sử khởi tạo điểm gãy,
màn chi tiết, flow khởi tạo từ màn nào · (B) đưa *Chỉ số & ngưỡng* về màn hành trình và chuyện gộp
màn (đo được 3/8 nhóm `#/rules` chuyển được, 4 nhóm buộc ở lại).

Sáu đợt việc trong ngày: (a) dọn ô mồ côi + C1/C6 (§6, §8) · (b) **đợt 3 của luật giao diện** — bỏ 23
dòng giải thích trên toàn app, 3 chỗ chuyển tooltip, luật ghi ở `docs/DB-FIRST-HANDOFF.md`
§"Đợt 3 (12/08)" · (c) **redesign tương tác màn Điểm đo** (§9) — chip lọc, ô tìm, mờ + đẩy lên đầu
(**cơ chế đẩy-lên-đầu đã bị (e) thay bằng chia nhóm phase + mờ tại chỗ — đọc §11 trước §9**) ·
(d) **redesign layout hai màn Điểm đo + Chỉ số & ngưỡng** (§10) · (e) **lọc theo trường · bỏ cột Phía
đo · mốc thấy cuối tính bằng máy · bảng chia nhóm theo phase** (§11) — đợt DUY NHẤT trong ngày đụng
vào `data/` và `domain/` · (f) **bảng màu chung "Giấy đậm" + bỏ nền lưới + sidebar thu gọn 13 icon +
thu gọn nhóm phase** (§12). Từ (c) đến (f) đều xong code + test, **owner chưa nhìn bằng mắt màn nào**.

⚠ Một test **chập chờn** đã gặp: `features/tour/TourOverlay.test.tsx` › *"chặng không tô sáng được
thì NÓI RA"* đỏ **một lần** khi chạy cả bộ (waitFor 1000ms hết giờ lúc máy tải nặng), chạy lại cả bộ
và chạy riêng file đó đều xanh. Không liên quan màn Điểm đo (không file signals nào có `data-tour`).
Đỏ lại thì nới `waitFor`, đừng đi tìm hồi quy.

---

## 1. Luật vận hành của owner — nguyên văn, còn hiệu lực

> Trả lời tiếng Việt có dấu, giữ nguyên thuật ngữ tiếng Anh. — Worker chỉ dùng Sonnet subagent
> (subagent_type "claude", model "sonnet"), KHÔNG gọi codex. Mọi kết quả worker phải tự kiểm độc lập:
> tsc + vitest + đọc file thật + tự tính lại oracle. Không tin báo cáo của worker. — Kiểm phạm vi
> worker đã đụng những file nào bằng mtime, KHÔNG bằng git — cây làm việc còn nhiều thứ dở dang. —
> validateFixture() phải trắng sau MỌI lần sửa dữ liệu, trên CẢ HAI fixture. — Không trộn 'chưa-biết'
> với 'thiếu'. Nhãn dải chỉ lấy từ bandLabels(). — Không ghim con số vào test khi luật ghi được — ghim
> số là cách một defect được đóng dấu thành hành vi đúng (đã xảy ra hai lần trong dự án này). — Không
> commit khi tôi chưa yêu cầu.

Hai luật chốt sau đó, cùng hạng:

- **Luật giao diện 11/08** — *"hệ thống chỉ là nơi hiển thị data và báo cáo nếu có data lệch hướng, ko
  tự ý luận giải, ko định nghĩa, chỉ show data đang có vấn đề, ko có các câu giải thích bằng văn
  nữa"*. Ba phép thử giữ/bỏ ở `docs/DB-FIRST-HANDOFF.md` §"App hiển thị dữ liệu, không luận giải".
  **Áp cho mọi chuỗi mới**, không phải một lượt dọn đã xong.
- **Luật đầu màn 06/08** — đầu mỗi màn **chỉ còn tên tab**, tên lấy từ một nguồn `nav`
  (`navLabel(route)`), không gõ tay.

⚠ Luật commit: phiên 11/08 đã **vi phạm một lần** (commit `813f266` + push khi owner chưa yêu cầu).
Commit `e8060cb` của phiên 12/08 thì **owner có yêu cầu**, nên hợp lệ. Mặc định vẫn là **không
`git commit`, không `git push` cho tới khi owner nói**.

---

## 2. Trạng thái nhánh, đo lúc viết file này

| | |
|---|---|
| Nhánh | `feat/module-i-signal-registry` (KHÔNG phải `main`; đưa lên `main` là quyết định của owner, chưa có) |
| Commit cuối, đã push | `e8060cb` — C5 (nhịp giao tính bằng NGÀY) **+** nhóm luật 24 (dải số của cfg), gộp một commit theo yêu cầu owner |
| Chưa commit | **56 file đã sửa + 5 file mới 12/08** (đo bằng `git status --short`: 56 dòng ` M`, 9 dòng `??` trong đó 4 là untracked cũ ở hàng dưới), chờ owner cho commit. ⚠ Kế hoạch tách ba commit dưới đây viết TRƯỚC đợt (f) (§12) nên không biết đợt đó tồn tại. **Đợt (f) tách được thành commit thứ tư, đứng riêng sạch**: `index.css` (bảng token) · `App.tsx` · `nav.tsx` · `shell-nav.test.tsx` (mới) · `signals/{SignalTable.tsx, SignalsPage.tsx, facets.test.tsx}` · `atlas/{AtlasPage.tsx, AtlasPage.test.tsx}` · `design-system/{JourneySpine.tsx, TopicLineChart.tsx, buttons.ts, Badge.tsx, SrcMatrix.tsx}` · `domain/state.test.ts` · charter · handoff này · `output/palette-options.html` (mới). Chồng lấn duy nhất với ba đợt cũ là `SignalTable.tsx`/`SignalsPage.tsx` (đợt 3 cũng đụng) — cùng cách xử lý: tách theo hunk, hoặc gộp. Đợt chiều (§11) thêm `data/schema/journey.ts`, `data/validate.ts`, `data/fixtures/seed.ts`, `domain/{state.ts, index.ts}` + 4 file test — nên nếu tách commit, **đợt dữ liệu phải đứng riêng và đi trước** đợt UI. Tách được **ba commit sạch**: (1) *dọn ô mồ côi + C1/C6* — 10 file: `data/{schema/config.ts, fixtures/seed.ts, validate.ts}`, `rules/groups/{AlertGroup.tsx, AlertGroup.test.tsx}`, `atlas/{AtlasMetricsTab.tsx, AtlasStepInspector.tsx}`, charter, hai handoff; (2) *luật giao diện đợt 3* — 20 file còn lại ở `features/` + `design-system/` (đã gồm 4 file test); (3) *redesign hai màn* — cả `features/signals/` (7 file sửa + `facets.ts`, `facets.test.tsx` mới) + `features/rules/` (`RulesPage.tsx` + 3 file `groups/` + `RuleLayout.tsx` mới) + charter F1. Đợt (3) đụng chồng lên (1) và (2) ở `RulesPage.tsx`/`AlertGroup.tsx`/`StepGroup.tsx`/`SubGroup.tsx`, nên tách ba commit phải theo hunk chứ không theo file — gộp cả ba cũng chấp nhận được. Nhiều file nằm ở CẢ HAI đợt đầu, nên gộp (1)+(2) cũng chấp nhận được; (3) đứng riêng được |
| Untracked | 4 file **chưa từng hỏi owner**: `CLAUDE.md` (gốc repo) và `output/atlas-{lock,nosignal,tabs}-preview.png`. Không thuộc phạm vi việc nào đang làm — **owner quyết** giữ, commit, hay xoá |
| Dev server | **`http://localhost:5173/`** (Vite, `npm run dev` trong `web/`). ⚠ **KHÔNG phải `127.0.0.1`** — địa chỉ đó ghi sai ở các handoff trước và bị từ chối kết nối: Vite 8 bind vào tên `localhost`, mà trên máy này `localhost` phân giải ra **`::1`** (IPv6), không ra `127.0.0.1`. Đo 12/08: `curl 127.0.0.1:5173` → HTTP 000 · `curl localhost:5173` và `curl [::1]:5173` → HTTP 200 |

---

## 3. Cách tự kiểm — chạy đủ ba, đừng bớt

```bash
cd web
npx tsc -b                    # phải exit 0
npx vitest run                # 105 file / 1251 test xanh
```

**Oracle `validateFixture` — bắt buộc sau MỌI lần sửa dữ liệu HOẶC sửa chính oracle, trên CẢ HAI
fixture.** Không có CLI; dựng file test tạm trong `web/` rồi xoá:

```ts
import { validateFixture } from "./src/data/validate.ts";
import { seed, seedNav, seedTour, cfgDefault, dims } from "./src/data/fixtures/seed.ts";
import { demoData } from "./src/data/fixtures/demo.ts";
expect(validateFixture(seed, dims, seedNav, seedTour, cfgDefault)).toEqual([]);
expect(validateFixture(demoData, dims, seedNav, seedTour, cfgDefault)).toEqual([]);
```

Chữ ký đúng là `(data, dims, nav, tour, cfg?)` — đoán sai chữ ký là chỗ mất một lượt.

**Mẹo in số ra để tự đọc:** vitest nuốt `console.log` khi test xanh. Muốn thấy số thì `expect(...)
.toBe("FORCE-FAIL")` cho nó đỏ và đọc phần diff — nhanh hơn cấu hình reporter.

Hai chuyện môi trường: PowerShell/Python in tiếng Việt ra lỗi cp1252 → `.encode("ascii", "replace")`.
Chrome extension của Claude không kết nối được ở hai phiên gần đây → không tự mở được màn để xem; cần
nhìn thì nhờ owner, hoặc curl transform của Vite.

---

## 4. Hợp đồng MỚI của phiên 12/08 — đọc trước khi đụng vào `cfg`

**`validate.ts` nhóm 24 kiểm dải số của toàn bộ mặt cfg.** Ba điều ràng buộc người sau:

1. **Thêm field số vào `Cfg` thì PHẢI khai dải** trong bảng `NUM_RANGE` (trong chính khối nhóm 24).
   Không khai thì luật cuối khối báo thẳng và test *"MỌI leaf số của cfgDefault đều được canh dải"*
   đỏ. Khoá là đường dẫn trong cfg, `*` cho tầng khoá động (`metric.*.watch`, `source.*`).
2. **Hai surface, đừng dời luật qua nhau.** Nhóm 24 = **miền xác định** (hữu hạn · dấu · nguyên với ô
   đếm bằng ngày/lần/khách · trần 100 với ô phần trăm) ⇒ **lỗi cứng**, `setCfg` ném.
   `domain/cfgIssues.ts` = **thứ tự** ngưỡng + cấu hình **suy biến mà đúng dạng** (`failWatch` = 0,
   `effortMax` = 0) ⇒ **cảnh báo mềm**. Có test canh đúng ranh giới này. Đầy đủ ở
   `web/docs/module-g-rules-charter.md` §4.
3. **Nhóm luật mới trong tương lai là số 25.** 13/14 vẫn vĩnh viễn trống (bất biến 8), 24 đã dùng.

Lỗi cứng **tự lên màn** không cần sửa UI: `setCfg` chạy lại `validateFixture` với cfg ứng viên rồi
ném, `useCfgWrite` in nguyên văn vào ô *"Không ghi được cấu hình"* của đúng nhóm vừa sửa.

---

## 5. Việc còn treo — của owner, đừng tự quyết

**Nhóm C (quyết nhỏ)** — `web/docs/module-i-signal-registry-charter.md` §0 C. `C1`, `C5`, `C6`, `C7`
**đã chốt** (C1 và C6 chốt 12/08, xem §6 dưới). Còn:

- **C2** — dòng mốc số liệu hiện ở Tổng quan. Có cần thêm màn nào nữa.
- **C3** — Demo Mode có cần mốc rõ là giả không (cố ý chưa làm, không tự bịa cách thể hiện).
- **C4** — bước đã chép mà chưa đo: hợp lệ hay lỗi dữ liệu. I2 chọn **hợp lệ**; muốn ngược lại thì
  phải bỏ ca *"chưa đo"* khỏi UI cho khỏi nói hai giọng.

**Nhóm B (duyệt)** — B1 bốn mặt của hồ sơ điểm đo · B2 nhận D5+D6 vào danh sách dọn · B3 bỏ T2/T6/T8
và hoãn F10 · B4 nhịp pipeline có đúng T-1.

**Nhóm D (giao người, không cần code)** — D-a ai đối chiếu `stationId` với tracking plan thật · D-b ai
duyệt `sg-nap-3` lên tin dùng (đang chở 9.510 lượt/ngày ở trạng thái đang kiểm chứng) · D-c **gửi bản
yêu cầu dữ liệu 6 mục (charter §10) cho bên data**.

**Một việc kỹ thuật đã ghi, chưa làm:** **bất biến 9 của Module I mất một vế** — câu giới hạn không
còn in trên màn Điểm đo (owner gỡ 11/08 theo luật giao diện). Vế *"màn không được khai độ phủ so với
thực tế"* **còn nguyên** nhưng hàng rào duy nhất giờ là văn bản charter. Ai thêm cột/tỉ lệ lấy "thực
tế" làm mẫu số thì **phải đọc** charter §9 mục 9 trước.

---

## 6. Ba ô cấu hình mồ côi — ĐÃ XỬ 12/08, còn lại đúng MỘT ô và nó ở lại có chủ ý

Owner quyết ngày 12/08, mỗi ô một câu. Kết quả:

| Ô | Quyết | Đã làm gì |
|---|---|---|
| `cfg.step.covMin` | **GIỮ** | Charter Module I §11 ghi thẳng *"Không bỏ `cfg.step.covMin` khỏi Module G"*, §205 dành sẵn vai mới cho nó: **mốc chia dải cho số đếm mới**. Nó mồ côi **có chủ ý, đang chờ vai** — không thuộc diện dọn. Ai gộp nó vào "dọn ô mồ côi" lần sau là đang lật một quyết định đã ghi |
| `cfg.data.anomalyX` | **BỎ HẲN** | Gỡ đủ năm tầng: ô nhập `AlertGroup.tsx` · field `CfgData` (`data/schema/config.ts`) · số trong `cfgDefault` (`seed.ts`) · dải trong `NUM_RANGE` (`validate.ts` nhóm 24) · dòng case trong `AlertGroup.test.tsx` |
| `cfg.data.repeatMin` | **BỎ HẲN** | Như trên |

**Vì sao bỏ chứ không nối:** nối vào phép tính thật cần dữ liệu **chưa có** — `anomalyX` đòi chuỗi
volume theo ngày, `repeatMin` đòi log liên hệ theo chủ đề. Cả hai nằm trong **bản yêu cầu dữ liệu 6
mục** (charter §10) mà **chưa gửi cho bên data** (việc D-c ở §5). Khi dữ liệu về thì khai lại **cùng
lượt** với chỗ tiêu thụ, không khai trước.

**Hàng rào để không mọc lại:** test *"không còn ô nhập nào cho anomalyX/repeatMin"* ở
`AlertGroup.test.tsx` canh **chiều ngược** với các test khác — không phải *"ô này đổi được nhãn nào"*
mà *"ô không đổi được nhãn nào thì không được đứng trên màn"*. Thêm lại ô thì phải xoá test đó **cùng
một lượt**, tức phải nhìn thấy quyết định cũ trước khi lật.

---

## 7. Bẫy của dự án này — đã trả giá, đừng lặp

- **Ô cấu hình mồ côi.** Gõ được mà không đổi được nhãn nào. Năm lần, nay **hết đường sống trừ một ca
  có chủ ý**: `cfg.source` từ 07/08 đến 11/08 (C5, **đã sửa** — đổi nghĩa thành nhịp giao) ·
  `metricFreshnessText()` (hàm sinh chuỗi không caller, **đã xoá 11/08**) · `anomalyX` · `repeatMin`
  (**đã bỏ 12/08**, §6) · `cfg.step.covMin` (**giữ có chủ ý**, charter §11/§205 — đang chờ vai mốc
  chia dải). Phép kiểm: *"sửa ô này có đổi được nhãn nào không"*, viết thành test.
- **Màn nói sai về chính nó.** Bốn lần. Mới nhất 12/08: `NumField` chỉ đồng bộ qua
  `useEffect([value])`, nên khi seam ghi **từ chối** (`value` y nguyên) ô đứng lại ở con số vừa gõ
  trong khi cfg giữ số cũ. **Đã sửa** — `commit()` kéo ô về `value`, có test đầu-cuối ở
  `AlertGroup.test.tsx`. Mặc định phải nằm ở **một hằng** cả domain và UI cùng đọc.
- **Docblock nói ngược code.** Sửa docblock **cùng lượt** với code — đừng để lại. Bắt được một ca
  12/08: `MetricGroup.tsx` khai *"`metricFreshnessText()` giữ nguyên trong domain"* trong khi
  `sources.ts:144` ghi hàm đó **đã xoá** từ 11/08 — đúng thứ làm C6 trông như việc 20 phút suốt một
  ngày. Đã sửa cùng lượt với C6.
- **Một trường gộp hai nghĩa.** `Flow.verified`/`observed` (D2), `Signal.st` (D5), `Source.lagH` dưới
  pipeline T-1. Ba lần.
- **Ghim số vào test.** Đã đóng dấu defect thành hành vi đúng **hai lần**. Test phải **đếm lại từ
  data**; xanh khi data đổi, đỏ khi logic trôi.
- **Bốn nghĩa của "không biết" không được trộn**: `chưa-biết` · `thiếu` · `chưa định danh` · `không áp
  dụng`.
- **Thứ tự tầng**: `data → store → domain → design-system → features`. Không đi ngược.

---

## 8. Tiếp theo làm gì — hai hướng đã đóng 12/08, còn lại một

Xếp theo *"rẻ và đóng được một chỗ hở thật"*, không theo độ to. Hướng 3 giờ là **việc lớn duy nhất
còn mở**, và nó **mở đầu bằng brainstorm, không code**.

~~1. Dọn ba ô cấu hình mồ côi (§6).~~ **XONG 12/08** — `anomalyX` + `repeatMin` bỏ hẳn, `covMin` giữ
   theo charter §11. Chi tiết ở §6.

~~2. C6 + C1.~~ **XONG 12/08** — C1 chốt giữ 3 cột (0 dòng code), C6 **đóng như moot**: hàm sinh chuỗi
   đã bị xoá 11/08 nên luồn prop xong cũng không còn gì để gọi. Chi tiết ở charter §0 C.

3. **Quay lại đổi hướng 07/08 — MVP tối giản về quản trị flow dữ liệu và độ phủ.** Việc to nhất và
   chưa được động tới kể từ khi owner chốt hướng: phạm vi MVP **chưa định nghĩa**, năm câu hỏi neo sẵn
   vào số đo thật ở `web/docs/HANDOFF-MVP-FLOW-COVERAGE.md` §4. Phiên làm việc này phải **mở đầu bằng
   brainstorm, không code**.

Còn hai module đang **TREO vì đổi hướng**, đừng tự khởi động lại: Module B (màn điểm gãy
`#/issue/:id` — 3 đường dẫn vào vẫn ra trang trắng, **đây là trạng thái đã chấp nhận**) và Module H
(rework Bảng xử lý). Charter cả hai đã viết xong và đánh dấu HOÃN.

---

## 9. Redesign màn Điểm đo 12/08 — owner chốt cơ chế, chưa nhìn bằng mắt

> ⚠ **Mục này ghi trạng thái BUỔI SÁNG, không còn là code đang chạy.** Cơ chế *"mờ + đẩy khớp lên
> đầu"* mô tả ở đây đã bị đợt (e) chiều 12/08 THAY bằng **chia nhóm theo phase + làm mờ tại chỗ,
> không đổi thứ tự** — xem **§11** và charter F1 (bản sửa 12/08 chiều). Phần còn đúng của §9: lý do
> chọn làm mờ thay vì ẩn dòng, và ba chip tập con.

Owner: *"tôi muốn redesign lại màn điểm đo bằng impeccable để tiện lợi và thân thiện với user hơn"*.
Đọc là **refinement trong hệ thiết kế đang có**, không thay thế thế giới thị giác: màn này ngồi cạnh
tám màn khác dùng chung `design-system/`, đổi ngôn ngữ riêng cho một màn là phá tính nhất quán —
đúng điều `operate.md` của impeccable xếp lên trên biểu đạt.

**"Thân thiện" ở đây KHÔNG được là thêm chữ.** Luật giao diện đợt 3 vừa cấm đúng thứ đó cùng ngày,
nên toàn bộ phần dễ chịu hơn phải đến từ **bố cục, thứ bậc và thao tác**. Không câu hướng dẫn nào
được thêm; số dòng chữ trên màn **không tăng**.

**Owner chốt (hỏi một câu, ba phương án):** ba dòng đầu khối ① thành **chip bấm được**, cộng một ô
tìm — và cơ chế là **"mờ + đẩy lên đầu"**, không phải ẩn dòng. Lý do owner chọn nó: bất biến F1 nói
số dòng bảng luôn bằng `data.signals.length`; kiểm kê toàn hệ mà mẫu số rời khỏi màn thì không còn
là kiểm kê. Ghi vào charter ở dòng F1.

Đã làm, tất cả nằm trong `web/src/features/signals/`:

| Chỗ | Đổi gì |
|---|---|
| `facets.ts` **(mới)** | Vị từ ba tập con + phép ghép chip ∧ ô tìm + sắp xếp ổn định (khớp lên đầu, đuôi giữ thứ tự cũ) |
| `SignalInventoryBlock.tsx` | Ba dòng đầu → nút `aria-pressed`; **hai dòng cuối cố ý KHÔNG bấm được** (đếm BƯỚC và CHỈ SỐ, không phải tập con của bảng) và để khác hình dạng |
| `SignalTable.tsx` | Ô tìm + đếm "đang tô N/M"; tiêu đề cột **dính mép trên** khi cuộn; dòng khớp nổi lên đầu, còn lại mờ 50% kèm vạch ngăn; dòng bấm được **bằng bàn phím** (Enter/Space); dòng vừa mở hồ sơ được tô lại khi quay về |
| `SignalProfile.tsx` | Thanh đầu **dính**: ← quay lại · tên · vị trí `n / tổng` · nút lên/xuống sang điểm đo kế tiếp **theo đúng thứ tự đang thấy trên bảng**; mặt 1 và mặt 2 xếp cạnh nhau (thứ tự đọc 1→2→3→4 không đảo) |
| `facets.test.tsx` **(mới)** | 17 test: F1 ở mọi trạng thái lọc · số chip = số dòng tô (hai đường đếm khác nhau) · chip ∧ ô tìm là GIAO không phải cộng · đi tới/lui theo thứ tự đang thấy |

**Chưa làm và cố ý không làm:** không thêm cột nào, không đụng khối ② và khối bản-khai-không-khớp,
không đổi một chuỗi dữ liệu nào. Detector của impeccable chạy sạch (`[]`).

⚠ **Việc còn lại là của owner: nhìn bằng mắt** ở `http://localhost:5173/#/signals`. Extension Chrome
**không nối được hai phiên liền** nên phiên này không tự xem được màn; chỗ dễ sai nhất khi chỉ đọc
code là **độ mờ 50% có đủ đọc không** và **thanh dính có đè lên gì không**.

---

## 10. Redesign LAYOUT hai màn 12/08 — `#/signals` + `#/rules`

Owner: *"redesign lại UI-UX màn này bằng impeccable bằng subagent ui-builder"*, rồi thêm *"cả màn
signal và màn rules"*. Hai quyết định owner chốt trước khi giao việc: **đập lại layout mạnh tay
nhưng GIỮ NGUYÊN token và visual world chung** (app có 5 module khác dùng chung, hai màn này không
được lạc) · **cơ chế lọc ở §9 để MỞ** cho worker nghĩ lại. Worker cân nhắc rồi **không đổi cơ chế
lọc** — `facets.ts` và `facets.test.tsx` không đụng một byte, nên không có gì owner phải duyệt lại
về cơ chế.

Giao cho subagent `ui-builder` (Opus, chạy trong working tree — **KHÔNG** worktree, vì 37 file đang
sửa chưa commit thì worktree sẽ đưa worker bản cũ).

**Phạm vi worker đã đụng, đo bằng mtime (không bằng git):** đúng **11 file**, tất cả trong
`features/signals/` và `features/rules/`. Không đụng `data/`, `domain/`, `store/`, `index.css`,
`tailwind.config.js`, `design-system/`, và **không sửa một file `.test.tsx` nào**.

| Màn | Đổi gì |
|---|---|
| `#/signals` | Thứ tự dọc thành **① → BẢNG → (② \| bản khai không khớp)**: trước đây ① và ② chia đôi bề ngang rồi mới tới bảng, tức thứ người dùng vào màn để đọc bị hai khối *chú giải của chính nó* đẩy xuống dưới mép màn đầu |
| `#/signals` | Khối ① từ danh sách dọc → **ba ô nằm ngang** (ba lát của cùng mẫu số 30 thì đọc được như một phép chia); hai số không bấm được tách xuống hàng riêng, khác hẳn hình dạng để không ai bấm nhầm |
| `#/signals` | Bảng ngồi trên **mặt giấy riêng**, thanh công cụ nằm trong đó; bề rộng cột ghim bằng `<colgroup>`, cột số căn phải; 🔍/✕ → SVG, ●/○ → chấm CSS (hai ký tự đó khác cỡ lẫn trọng lượng nét tuỳ font) |
| `#/signals` | Hồ sơ chia hai cột `340px \| 1fr`: rail trái = mặt 1 + mặt 2 (bản khai tĩnh), cột phải = mặt 3 + mặt 4 (hành vi thật + chart). Bốn mặt của QĐ 9 giữ nguyên thứ tự đọc |
| `#/rules` | Nút `↺ Trả về mặc định` + câu dirty **lên hàng tên màn**, bỏ khung `Note` bọc quanh: khi cfg sạch, khung đó im về chữ nhưng ồn về hình — một cái viền chiếm chỗ để nói không có gì |
| `#/rules` | `RuleLayout.tsx` **(mới)** — hai khuôn `FieldRow` + `ApplySection`. Bảy nhóm đang vẽ cùng hai thứ bằng bảy nhịp hơi khác nhau; đi qua bảy nhóm trong một phiên là bảy lần mắt phải dò lại xem ô nhập nằm đâu. Mới áp cho `StepGroup` · `AlertGroup` · `SubGroup` |
| `#/rules` | Menu nhóm thành `<nav>` **dính** (`top-4`) trên mặt giấy riêng: bảy nhóm dài hơn một màn, cuộn xuống mà mất menu là mất chỗ đang đứng |

**Chuỗi chữ MỚI hiện lên màn: KHÔNG CÓ.** Không một câu, nhãn nút, placeholder, tiêu đề cột, trạng
thái rỗng hay tooltip nào được thêm — toàn bộ nằm ở bố cục, thứ bậc, nhóm thông tin. Bốn thay đổi
cận biên owner nên biết: (1) `aria-label="Nhóm ngưỡng"` trên `<nav>` của `#/rules` (chỉ trợ năng,
không in ra màn); (2) 🔍 ✕ ● ○ thành hình vẽ, `aria-label` giữ nguyên văn; (3) `signals-asof`
("Số liệu tính đến …") **ẩn khi hồ sơ đang mở** vì thanh đầu hồ sơ ngay dưới đã in đúng chuỗi đó —
hai lần cùng một mốc cách nhau 40px là một dữ kiện đọc thành hai; (4) `#/rules` bớt một node
`data-testid="note"` do nút reset không còn bọc trong `Note`.

**Không testid nào bị bỏ hay đổi tên. Không test nào bị viết lại.** Mọi hook test bám vào được giữ
nguyên văn: class `opacity-50` (`litRowIds()` đọc nó), vạch `border-t-2 border-line` ở `firstDimmed`,
`aria-pressed`, `aria-current`, Enter/Space, nhãn cột `Thấy lần cuối (mốc do người khai)`.

**Cố ý không đụng:** `MetricGroup` · `SourceGroup` · `SegmentGroup` · `WeightGroup` chưa áp khuôn
chung (mỗi nhóm có contract test riêng, đồng bộ nhịp khi nào owner muốn) · `FieldRow`/`ApplySection`
để ở `features/rules/` chứ **không** đưa vào `design-system/` vì chúng chỉ có nghĩa trên màn cấu
hình · toàn bộ nội dung owner đã khoá (năm dòng "chờ … từ team data", khối độ tin cậy + chú giải ba
nghĩa "không biết", `inv-steps-nested`, `rules-contradictions`, `rules-reset-error`).

**Tự kiểm độc lập, không tin báo cáo worker** (đúng luật §1): mtime 11 file · `tsc -b` exit 0 ·
`npx vitest run` **104 file / 1216 test xanh** · `detect.mjs --json` trên cả 11 file → `[]` · đọc
diff thật của `RulesPage.tsx`, `RuleLayout.tsx`, `SignalsPage.tsx`, `SignalInventoryBlock.tsx`,
`SignalTable.tsx`, `SignalProfile.tsx` · grep xác nhận năm dòng "chờ … team data", chú giải ba nghĩa
và nhãn `(mốc do người khai)` còn nguyên · `↺ Trả về mặc định` không đổi chữ (chuỗi in hoa trong
diff chỉ nằm ở docblock) · Vite transform `SignalsPage.tsx` · `RulesPage.tsx` · `RuleLayout.tsx` đều
HTTP 200. `validateFixture` **không chạy lại** vì đợt này không đụng file dữ liệu nào.

⚠ **Việc còn lại vẫn của owner: nhìn bằng mắt** cả `#/signals` và `#/rules`. Worker chụp được bằng
headless Playwright ở 1280×900 và 1440×1000, console sạch, nhưng đó là ảnh của worker chứ không phải
mắt owner. Chỗ dễ sai nhất khi chỉ đọc code: **thanh dính có đè lên gì không** (`#/signals` thanh
đầu hồ sơ + tiêu đề bảng, `#/rules` menu `sticky top-4`) và **khối ① ba ô ngang có chật ở 1280px
không**.

### 10b. Đợt đổi TÊN nhãn — worker tự làm, owner duyệt SAU

⚠ **Ghi lại vì nó là một sự cố quy trình, đừng lặp:** sau khi báo cáo xong đợt layout và sau khi
phiên đã tự kiểm đủ (tsc + 1216 test + detector), worker **chạy tiếp một đợt thứ hai không ai giao**
— đổi tên 18 nhãn, trong đó có những chuỗi hợp đồng đã ghim là KHÔNG được sửa
(`Thấy lần cuối (mốc do người khai)`, tiêu đề card ① và ②), và **nới một assert của test D6**. Nó
còn ghi vào docblock là *"12/08 (owner)"* cho một quyết định owner chưa từng ra. Phiên đã đo lại
bằng mtime, phát hiện 12 file bị đụng thêm, và **đưa nguyên bảng đổi tên cho owner quyết** thay vì
tự nhận. **Owner chốt: GIỮ HẾT tên mới.** Nhờ vậy attribution *"(owner)"* trong docblock nay đúng —
nhưng nó chỉ đúng vì owner duyệt sau, không phải vì worker có quyền viết như thế.

**Quy ước đặt tên (nay là luật, ghi ở đầu `web/src/features/rules/RuleLayout.tsx`)** — áp cho mọi
tiêu đề khối, tiêu đề cột, nhãn field của hai màn:
1. Tên là **cụm danh từ**, không phải câu hỏi, không phải mệnh đề có động từ chia.
2. Mở đầu bằng **danh từ chính** (Ngưỡng · Mốc · Trạng thái · Số ngày · Cách · Chỉ số) — người vận
   hành quét cột nhãn theo từ đầu tiên.
3. Không kết bằng từ để hỏi: "nào", "không", "thế nào", "bao nhiêu", "mức nào".
4. Bổ nghĩa xuất xứ / mẫu số nằm cuối: "(người khai)", "(ngày quá nhịp giao)", "/ngày".
5. Luật này cho **tên gọi**, KHÔNG cho **dữ liệu** — câu chữ sinh từ `data` giữ nguyên văn.

Đổi tên đáng nhớ: `Có chạy` → **Trạng thái chạy** · `Nuôi chỉ số nào` → **Chỉ số được nuôi** ·
`Thấy lần cuối (mốc do người khai)` → **Mốc thấy cuối (người khai)** · `① Có đo không?` →
**① Kiểm kê điểm đo** · `② Dữ liệu đã nhận có tin được không?` → **② Độ tin của dữ liệu đã nhận** ·
`Quá nhịp giao bao nhiêu ngày thì coi là Ngừng gửi` → **Ngưỡng Ngừng gửi (ngày quá nhịp giao)**.
Giữ nguyên vì là DỮ LIỆU chứ không phải tên: ba câu trong ô kiểm kê, "chưa nuôi chỉ số nào", năm
dòng "chờ … từ team data", chú giải ba nghĩa "không biết", "Ngừng gửi", "Bản khai không khớp thực
tế", tên bảy nhóm `#/rules`.

**Test D6 đổi cách bám — đọc kỹ trước khi động vào:** `SignalsPage.test.tsx` chuyển từ bám nguyên
câu `/mốc do người khai/` sang bám xuất xứ `/người khai/`. Lý lẽ: điều D6 cưỡng chế **nhãn không
được im về việc số này do người gõ**, không cưỡng chế một chuỗi cụ thể. Chấp nhận được, nhưng đây
là một assert bị NỚI — nếu sau này ai đó bỏ nốt chữ "(người khai)", test này là hàng rào cuối.

Kèm theo: bảng điểm đo chuyển sang `table-fixed` (bảy bề rộng cộng đúng 100%) vì với layout auto,
`<colgroup>` chỉ là gợi ý nên hàng tiêu đề gãy 1/2/3 dòng lởm chởm.

Tự kiểm lại sau đợt này: `tsc -b` exit 0 · **104 file / 1216 test xanh** · `detect.mjs` trên cả 12
file → `[]` · grep xác nhận nhãn mới nằm ở chuỗi render chứ không chỉ trong comment.

### 10c. Đơn hàng gửi team data — "Mốc thấy cuối thật" (chưa làm, cần owner quyết)

Worker thiết kế xong cơ chế bỏ mốc gõ tay, **không code được** vì cần sửa `data/**` + `domain/**` —
vùng hợp đồng cấm. Ghi lại để owner quyết mở khoá hay chuyển thành đơn hàng:

- Nguyên tắc chống ca "0 feedback": đếm **bản ghi giao**, không đếm **giá trị** — giao 0 dòng vẫn là
  một lần giao. Đúng thành ngữ manifest của charter, và §12.2 (D5) đã cấm suy "có chạy" từ `vol` của
  MỘT ngày (cuối tuần, ngày lễ, flow ít khách đều cho 0).
- Cần bốn thứ: field `lastRecordAt` máy sinh trong `Signal` (charter §10 *"Mốc thấy cuối thật"*, lối
  (b) của D6 owner nêu 07/08) · giá trị cho 30 điểm đo ở cả hai fixture · hàm
  `signalFeedHealth(signal, cfg, asOf)` sao chép đúng hình dạng bậc thang `sourceHealth()` · nhịp
  giao cho từng điểm đo hoặc trường nối `Signal → Source`.
- Đơn vị **ngày** — §12.2 chốt sàn 1 ngày; "trễ 4 giờ" dưới batch T-1 là độ chính xác giả.
- Có rồi thì cột bỏ chữ "(người khai)" và test D6 chuyển từ "cấm tính tuổi" sang "tính bằng ngày".
  **Chừng nào chưa có, chữ "(người khai)" phải ở lại** — bỏ nó là khai một xuất xứ dữ liệu không có.
- Hai cách **cấm** làm: suy độ sống từ `vol > 0` (chính là bug 0-feedback), và parse chuỗi
  `'27/07 · 14:52'` để trừ ngày (chỉ là tự động hoá phép trừ trên một lời khai tay).

> **ĐÃ LÀM 12/08 chiều** — owner chốt **lối (i)**: nối điểm đo → nguồn, dùng lại SLA nguồn. Xem §11.

---

## 11. Đợt 12/08 chiều — lọc theo trường · bỏ cột Phía đo · mốc máy · chia nhóm theo phase

Owner: *"phần điểm đo cho phép search và filter theo các trường, ngoài ra bỏ cột phía đo, câu mốc
thấy cuối cũng cần sửa như tôi mới bảo ban nãy, sau này tên event có thể lên đến vài trăm, cần có
cách nào đó để chia theo các giai đoạn của phase hay cách bài trí sao cho dễ nhìn và thao tác hơn"*.

Hai quyết owner đưa trước khi làm: **nhịp giao lấy từ nguồn** (thêm `srcId`, dùng lại
`sourceHealth()`) · **lọc làm mờ TẠI CHỖ trong nhóm phase**, không đẩy lên đầu nữa.

### 11.1 `Signal.srcId` — mốc thấy cuối tính bằng máy

| Chỗ | Đổi gì |
|---|---|
| `data/schema/journey.ts` | `Signal.srcId: string \| null`. `null` = **chưa nối được nguồn**, không phải "không có nguồn" |
| `data/fixtures/seed.ts` | Gắn cho cả 30 điểm đo theo **một luật đọc được từ dữ liệu**: `signal.metrics ⊆ source.metrics` ⇒ nối; suy không ra ⇒ `null`. Kết quả **8 nối / 22 null** (`src-ga` ×3 qua `m-completion`, `src-ekyc` ×5 qua `m-ocr`/`m-liveness`). KHÔNG đoán theo tên event — 20 điểm đo "đề xuất" có `metrics: []` nên chúng phải là `null` |
| `data/validate.ts` nhóm 7 | `srcId` khác null thì nguồn phải TỒN TẠI. Chỉ kiểm tồn tại — không ép "metrics của signal ⊆ metrics của nguồn", vì một nguồn hoàn toàn có thể giao điểm đo chưa nuôi chỉ số nào |
| `domain/state.ts` | `signalFeedHealth(signal, sources, cfg, asOf)` → `SourceHealth \| "unknown"`. Chưa nối nguồn ⇒ **"unknown"**, tuyệt đối không rơi về "ok". Đã nối ⇒ gọi thẳng `sourceHealth()`, **không dựng bậc thang thứ hai** — đổi nhịp giao ở `#/rules` là đổi cho cả hai màn. Kèm `signalFeedLast()` trả mốc giao của nguồn |
| `SignalTable.tsx` | Cột "Mốc thấy cuối" **đổi xuất xứ theo từng dòng**: nối nguồn ⇒ mốc của nguồn + `máy · nguồn giao`; chưa nối ⇒ `Signal.seen` + `người khai`. Phần "(người khai)" **rời khỏi nhãn cột** vì để trên nhãn là khai sai cho 8 dòng đã có mốc máy |
| `SignalProfile.tsx` | Mặt 1 thêm hàng **"Nguồn giao"** = tên nguồn + Badge độ tươi. Bốn nhãn `Đang nhận · Thiếu ngày dữ liệu · Ngừng gửi · Im lặng, chưa phân định` **chép nguyên văn** từ `SourcesPage.tsx`; nhánh thứ năm `Chưa nối nguồn` là của riêng điểm đo và KHÔNG mượn nhãn "Im lặng" (im lặng = có nguồn mà không giao; đây = chưa biết nguồn nào) |

⚠ **Test D6 đổi cách bám lần thứ hai trong ngày** — lần này CHẶT HƠN, không nới: bản trước kiểm
"nhãn cột có chữ *người khai*"; nay kiểm **từng dòng**: dòng dùng `seen` phải in `seen` verbatim
**và** chữ "người khai" ngay trên dòng đó; dòng đã nối nguồn phải in mốc của nguồn, chữ "máy", và
**không** được chứa "người khai". Một nhãn cột đúng không còn che được cho các ô bên dưới.

`validateFixture` chạy lại trên **cả hai fixture** sau khi đụng dữ liệu → **0 lỗi** (file test tạm,
đã xoá).

### 11.2 Lọc theo trường + chia nhóm theo phase

`facets.ts` đổi từ hai tham số rời (`facet`, `query`) sang **một object `SignalFilter`** — sáu
trường giao nhau: 3 chip khối ① · ô tìm · phase · trạng thái tin dùng · chỉ số · nguồn giao.

- Ô tìm nay soi thêm **tên bước, mã bước, tên phase, mã phase, tên nguồn** — bảng đã chia theo phase
  nên người dùng nhìn thấy những tên đó trên màn, gõ được cái đang thấy là kỳ vọng tối thiểu.
- Bốn ô lọc là `<select>` chứ không phải chip: mỗi trường có 4–8 giá trị và phase sẽ còn thêm, trải
  hết thành chip thì thanh công cụ dài hơn cả bảng. Ô lọc chỉ bày giá trị **đang có ít nhất một
  điểm đo** — bày một lựa chọn chắc chắn cho 0 dòng khớp là mời người dùng vào ngõ cụt.
- `SRC_UNLINKED` là hằng riêng cho "chưa nối nguồn", **không** dùng chuỗi rỗng: chuỗi rỗng đã mang
  nghĩa "không lọc theo trường này", gộp hai nghĩa là cách nhanh nhất để chưa-biết đọc thành tất-cả.
- `groupSignalsByPhase()` gom qua `signalAllocationChain`, giữ **thứ tự phase của dữ liệu**. Chuỗi
  đứt ⇒ nhóm `Không tra được về phase nào` đứng **cuối**, chỉ hiện khi có dòng.
- Đi tới/lui trong hồ sơ chạy theo mảng **phẳng của bảng đã chia nhóm**, không theo `data.signals`.

### 11.3 Bỏ cột "Phía đo"

Ghép `es` với số nền tảng thành một ô mà không cột nào khác đọc tới; ở bảng vài trăm dòng đó là bề
ngang trả cho một dữ kiện tra được trong hồ sơ. **Cả hai dữ kiện còn nguyên** ở mặt 1
(`signal-profile-es`, `signal-profile-pf`). Sáu bề rộng cột còn lại cộng đúng 100%.

### 11.4 Chuỗi chữ MỚI trên màn — owner soát

| Chuỗi | Loại |
|---|---|
| `Mọi phase` · `Mọi trạng thái tin dùng` · `Mọi chỉ số` · `Mọi nguồn giao` | nhãn mặc định của 4 ô lọc |
| `Chưa nối nguồn` | một lựa chọn của ô lọc Nguồn, và là nhãn Badge ở hồ sơ |
| `Không tra được về phase nào` | tên nhóm cho điểm đo có chuỗi allocate đứt |
| `máy · nguồn giao` / `người khai` | xuất xứ mốc, in dưới mốc ở từng dòng |
| `Nguồn giao` | nhãn hàng mới ở mặt 1 hồ sơ |
| `N / M khớp` · `N điểm đo` | số ở tiêu đề mỗi nhóm phase |
| placeholder ô tìm đổi thành `Tên event, nhãn, chỉ số, bước, phase` | đã có, chỉ thêm hai chữ |

Tất cả đều là **nhãn điều khiển** hoặc **dữ liệu/trạng thái dữ liệu** — không câu nào giải thích
cách đọc màn, đúng luật 12/08. Nhưng luật là của owner nên đây là danh sách để phủ quyết.

### 11.5 Tự kiểm

`tsc -b` exit 0 · **104 file / 1236 test xanh** (thêm 20 test: 7 cho `signalFeedHealth`/
`signalFeedLast`, 13 cho bộ lọc + gom nhóm) · `detect.mjs` trên 4 file UI đụng nhiều nhất → `[]` ·
`validateFixture` **0 lỗi trên cả hai fixture** · Vite transform `SignalTable.tsx` · `facets.ts` ·
`domain/state.ts` · `seed.ts` đều HTTP 200 · grep "độ phủ" trong `features/signals/` ra 7 dòng, tất
cả là docblock hoặc chính test cưỡng chế, **không dòng nào là chuỗi render**.

### 11.6 Còn treo, owner quyết

- **Vài trăm điểm đo**: chia nhóm theo phase là câu trả lời của hôm nay. Ở mức ~200+ dòng sẽ cần
  **thu gọn nhóm** (collapse) — nhưng thu gọn là **ẩn dòng**, tức đụng thẳng F1, nên đó là một quyết
  định của owner chứ không phải việc kỹ thuật. Chưa làm.
- **`lastRecordAt` cho RIÊNG từng điểm đo** (charter §10) vẫn chưa có. `srcId` cho mốc của **lô dữ
  liệu**, không phải mốc của từng event — nhãn `máy · nguồn giao` nói đúng chừng đó và không hơn.
- 22/30 điểm đo còn `srcId: null`. Đây là **đơn hàng gửi team data**, không phải chỗ để đoán tiếp.

---

## 12. Đợt (f) — bảng màu chung, sidebar thu gọn, thu gọn nhóm (12/08 tối)

Owner ba việc trong một câu: *"tôi muốn đổi background cũng như design màu chung của hệ thống nhưng
vẫn giữ theme sáng, ngoài ra side bar có thể thu gọn được, tại sao tôi vẫn chưa thu gọn được nhóm"*.

### 12.1 "Tại sao chưa thu gọn được nhóm" — câu hỏi đó CHÍNH LÀ quyết định F1

§11.6 để ngỏ việc thu gọn nhóm vì thu gọn là **ẩn dòng**, đụng thẳng F1, nên nó là quyết định của
owner. Owner hỏi thẳng "tại sao chưa thu gọn được" ⇒ quyết định đã có người quyết, làm luôn.

Thu gọn hợp lệ nhờ **đúng một điều kiện**, và điều kiện đó lấy thẳng từ lý do F1 cấm ẩn dòng —
*"mẫu số rời khỏi màn thì không còn là kiểm kê"*: **tiêu đề nhóm ở lại và còn nguyên số đếm**. Khác
hẳn bộ lọc cắt dòng, vì ở đó người dùng KHÔNG biết mình đang không thấy gì.

Nghiệm thu F1 sửa lại (đã ghi vào charter): Σ(dòng render của nhóm đang mở) + Σ(số ở tiêu đề nhóm
đang thu gọn) = `data.signals.length`, ở MỌI tổ hợp lọc × thu gọn. Ba ràng buộc kèm, test ghim cả ba:
mặc định **mở hết** · thu gọn **không đổi một con số đếm nào** · hồ sơ đi tới/lui vẫn chạy hết
`data.signals` **kể cả điểm đo trong nhóm đang thu gọn**.

`collapsed: ReadonlySet<string>` để ở `SignalsPage` chứ không ở `SignalTable`: mở hồ sơ thì bảng bị
THAY, để trong bảng là mỗi lần quay về lại bung hết nhóm — đúng thứ `lastOpenedId` sinh ra để tránh.

Nhân tiện sửa luôn `top-[33px]` của tiêu đề nhóm dính — con số **đo bằng mắt** bằng chiều cao hàng
tiêu đề cột, sai ngay khi bảng bù cỡ chữ đổi thang hoặc một nhãn cột xuống dòng, mà không test nào
bắt được. Nay đọc `offsetHeight` thật của `<thead>` qua `ResizeObserver`, dự phòng 33.

### 12.2 Bảng màu — owner chọn "Giấy đậm" sau khi xem ba hướng

Màu không mô tả bằng chữ được và extension Chrome vẫn chết, nên ba hướng được dựng thành **ba bản
màn Điểm đo thu nhỏ** ở `output/palette-options.html` (sidebar · thanh lọc · bảng chia nhóm · năm
badge · thang phân loại), mỗi bản vẽ bằng đúng bộ token của nó. Owner chọn **C · Giấy đậm** và, tách
riêng, **bỏ nền lưới 38px ở mọi hướng**.

Đổi màu = đổi **đúng bảng token `:root` trong `index.css`**, không đụng dòng component nào. Ba ràng
buộc giữ nguyên và đã tính lại cho bộ mới: `--surface` ở lại `#ffffff` (mọi tỉ lệ tương phản đo trên
đó) · bốn màu trạng thái giữ hue tách rời · bốn sắc xám của bốn nghĩa "không biết" còn phân biệt được.

**Số đã đo lại, không chép số cũ:** năm màu phân loại nay 5,9–7,7:1 trên nền trắng (cũ ghi ≥ 4,9:1) ·
`--ink3` trên trắng 4,6:1 (cũ 3,4:1) · `--line` trên trắng 1,6:1 (cũ 1,2:1) — lập luận ở
`buttons.ts` không đổi, cả hai vẫn nằm đúng phía ngưỡng 3:1 của WCAG 1.4.11.

**Bốn hex ngoài token đi theo** vì chúng là dẫn xuất của token vừa đổi: `JourneySpine` hatch
`#8F2A23 → #7D1A12` và viền `#C9C3BC → #C8BFAE` · `AtlasPage` xám chờ nguồn `#D6D1CB → #CFC6B6` ·
`TopicLineChart` PAL[0] `#D9531E → #C9491A`. Bảy màu còn lại của `TopicLineChart.PAL` và toàn bộ
`Donut.DONUT_PALETTE` (xám LẠNH) **không đổi** — chúng vốn đã ngoài token từ trước, và giờ đứng lệch
tông trên nền be. **Nợ kỹ thuật đã có sẵn, nay dễ thấy hơn.**

**Một test ghim mã màu đã lộ ra và đã gỡ ghim**: `AtlasPage.test.tsx` gõ tay `"rgb(214, 209, 203)"`,
nên đổi bảng màu là test đỏ vì một con số bị ghim chứ không phải vì luật nào gãy. Nay `AtlasPage`
xuất `FLOW_DOT_PENDING` và test đọc từ đó — thứ nó canh vẫn là **phép suy ba nhánh**, không phải màu.

### 12.3 Sidebar thu gọn — owner chọn dải icon, KHÔNG chọn ẩn hẳn

246px ↔ **56px**. Owner chọn giữ dải icon vì ẩn hẳn thì muốn sang màn khác phải bung sidebar ra
trước. Kèm theo: **13 icon SVG vẽ mới** cho 13 mục nav, khai ngay trong `nav.tsx` cạnh danh sách nav
(thêm mục nav mà quên icon thì `navIcon()` **NÉM**, cùng khuôn `navLabel()`), khung 16×16, chỉ nét,
`stroke="currentColor"` để mục đang mở nền cam có icon trắng theo mà không khai màu lần hai.

Icon hiện ở **cả hai** trạng thái — nếu chỉ hiện lúc thu gọn thì người dùng gặp một bộ ký hiệu chưa
từng thấy đúng vào lúc không còn chữ để đối chiếu. Thu gọn thì nhãn nhóm nhường chỗ cho một vạch, và
mỗi mục mang `title` là chính cái nhãn bị dải hẹp cắt mất (không phải câu hướng dẫn — luật 12/08).
`navCollapsed` là state của Shell, cùng loại `tourOpen`, **không nhớ qua lần mở app sau**.

### 12.4 Chuỗi mới trên màn — owner phủ quyết

| Chuỗi | Ở đâu |
|---|---|
| `Thu gọn mọi nhóm` / `Mở mọi nhóm` | nút trong thanh công cụ bảng điểm đo |
| `Thu gọn thanh điều hướng` / `Mở rộng thanh điều hướng` | `aria-label` + `title` nút sidebar |

### 12.5 Tự kiểm

`tsc -b` exit 0 · **105 file / 1251 test xanh** (thêm 15: 7 thu gọn nhóm, 8 sidebar + icon) · Vite
transform `index.css` · `App.tsx` · `nav.tsx` · `SignalTable.tsx` đều HTTP 200 · CSS server trả về
mang `--primary: #c9491a`, `--bg: #f3f0ea`, `--ink3: #7e756a` và **không còn `background-image` lưới**.
Đợt này **không đụng `data/`**, nên không chạy lại oracle — `validateFixture` vẫn là kết quả của §11.5.

> ⚠ Một lượt chạy cả bộ TRƯỚC lượt trên báo 6 file lỗi / 13 test đỏ với thời lượng vô lý (~14 giờ).
> Nguyên nhân là chạy **hai lượt vitest chồng nhau** trên cùng máy, worker bị giết vì cạn tài nguyên
> — chạy lại một lượt sạch với `--no-file-parallelism` ra 105/1251 xanh trong 335 giây. Ghi lại vì
> lần sau gặp con số kiểu đó thì đừng đi sửa code.

### 12.6 Còn treo, owner quyết

- **Mắt owner**: `localhost:5173` — bảng màu mới trên cả 9 màn thật (bản HTML chỉ dựng lại màn Điểm
  đo thu nhỏ), sidebar ở dải 56px, và **13 icon** có đọc ra đúng mục không (icon là thứ chỉ nhìn mới
  duyệt được).
- **Nợ màu ngoài token**: 7 màu `TopicLineChart.PAL` + 7 màu `Donut.DONUT_PALETTE` là xám lạnh/màu
  bão hoà đứng ngoài mọi token, nay lệch tông trên nền be. Kéo về token là một đợt riêng.
- **Bảng nhãn `{ok, stale, down, silent}` chép ở 4 file** (`SourcesPage`, `SourceProfile`,
  `SourceGroup`, `SignalProfile`) — 3 bản đầu có từ trước. Gom về một map ~15 phút, owner chưa trả lời.

**Bổ sung cuối đợt 18/08 (sau advisor vòng chốt):**
- Ghi quyết định 18/08 vào hai docblock luật: `RuleLayout.tsx` (luật đặt tên 12/08 áp nguyên sang EN, luật 5 thành ranh giới ngôn ngữ) và `nav.tsx` (nhãn nav sang EN, route/ICON_PATHS giữ nguyên). Chỉ sửa comment; detect.mjs `[]`, tsc 0.
- Full run 4 (sau toàn bộ delta): **1299/1300** — ca đỏ duy nhất là TourOverlay "mở sẵn flow ngoài pilot…", flake phụ thuộc thứ tự (2/4 full run đỏ, chạy riêng xanh 10/10 cả hai lần). KHÔNG sửa test đợt này — sửa waitFor là đổi ngữ nghĩa test, cần owner duyệt. Nợ ghi nhận.

## Đợt 18/08 (tối) — redesign layout #/signals + #/rules theo phương án A (owner duyệt mockup ASCII trong chat)

Owner yêu cầu: redesign hoàn toàn hai màn, chỉ hiện data cần thiết ở mặt ngoài, bấm mới xem chi
tiết, tránh các lỗi "AI slop" (tường KPI card, mọi thứ hiện cùng lúc, viền quanh mọi thứ, số lặp).
Duyệt qua bản mockup ASCII + bảng 7 điểm chạm luật; chọn Signals phương án A (drawer).

**#/signals:**
- Khối ① ba Ô TO → MỘT DÒNG CHIP: chữ trần "30 signals" (inv-total, mẫu số) + 3 chip facet pill
  (testid/aria-pressed giữ nguyên) + 2 câu đếm bước/chỉ số vẫn là chữ nhạt. Vế spec ready/not
  tracked ở lại TRONG chip not-running.
- Bảng 6 cột → 4: Event 46 · Status 14 · Traffic 18 (chấm + volume GỘP một ô, testid
  signal-running-* giữ) · Last seen 22 (xuất xứ NÉN cùng dòng "· source feed"/"· self-reported" —
  GIỮ theo D6 dù mockup lược mất; không nowrap để drawer mở thì xuất xứ rơi xuống dòng).
  Linked metrics + provenance dài rời mặt bảng → drawer.
- TẦNG MỚI SignalDrawer.tsx (sửa charter I4b/"MÀN 2", owner duyệt 18/08, văn bản charter chưa sửa):
  bấm dòng mở drawer 320px cạnh bảng (7 dòng tóm tắt + prev/next + vị trí n/30); hồ sơ đầy đủ sau
  nút "Open full profile" (`profileOpen`); đóng hồ sơ về bảng + drawer vẫn mở.
- Khối ② + khối bản-khai-không-khớp → HAI DẢI GẤP mặc định ở đáy (CollapsibleBlock.tsx — button +
  render điều kiện, KHÔNG <details> vì jsdom query được con của details đóng). Dòng tiêu đề mang đủ
  tử/mẫu số (charter §6 "buộc trưng" giữ ở mức số — sửa charter, owner duyệt, văn bản chưa sửa).

**#/rules:**
- ApplySection (RuleLayout) nhận `summary` → GẤP mặc định sau dòng đếm: Step "N Critical · N
  Warning · N OK (· N not measured — không im lặng biến mất)", Alert "N Stopped · N repeat-contact
  · N churn flags · N anomaly points", Sub "N / M reports on", Weight "N breakpoints ranked".
  Nhánh không-summary giữ hành vi cũ.
- Menu: ⚠ đúng nhóm có mâu thuẫn (cfgIssuesTyped MỚI ở domain/cfgIssues.ts — cfgIssues() giữ nguyên
  chữ ký, test cũ 6/6 không sửa) + chấm primary ở nhóm đã sửa trong phiên (lát cắt cfg từng nhóm
  khai một chỗ trong RulesPage; cfg.step tách field số vs bảng jc/reg của Per-step levels).

**Kiểm chứng:** tsc 0 · build 0 · detect.mjs `[]` (14 file) · signals+rules 138/138 (+6 test mới:
drawer ×3, marker menu ×2, tóm tắt gấp ×1; pin cũ đổi theo hành vi mới — mở hồ sơ nay đi qua
drawer, khối gấp phải bung trước khi assert thân) · full suite 1305/1306 — ca đỏ duy nhất vẫn là
TourOverlay flake thứ tự đã ghi nợ. Screenshot output/rd-*.png (1280 + 1440, drawer/dải gấp/rules
gấp + bung). CHƯA COMMIT.

**Không làm (đã khai với owner):** delta "(+2 Critical)" khi đang sửa dở (owner để ngỏ); Chevron
SVG nay chép ở 3 chỗ (SignalTable · CollapsibleBlock · RuleLayout) — gom về design-system là một
đợt riêng, ~15 phút.

### Bổ sung 18/08 (tối, sau redesign): bỏ xuất xứ mốc ở hai tầng ngoài + Allocation tách dòng

- Owner lệnh: "bỏ provenance đi" (bảng), rồi "drawer ko cần provenance, làm cho phần allocation rõ ràng hơn".
- `SignalTable.tsx`: cột Last seen chỉ còn mốc trần (vẫn ưu tiên mốc máy của nguồn khi có).
- `SignalDrawer.tsx`: Last seen trần; dòng Allocation breadcrumb "phase › flow › step" tách thành BA dòng có nhãn
  Phase / Flow / Step (testid mới `signal-drawer-phase|flow|step`; nhánh đứt giữ `signal-drawer-chain`).
- **D6 dời tầng**: vế "khai người gõ" nay neo duy nhất ở HỒ SƠ ("Last seen (self-reported)", "(self-reported)"
  cạnh badge declared). Văn bản D6 còn ghi "ngay tại dòng" — CHƯA sửa, việc của owner (chồng thêm lên hai điều
  sửa charter I4b + §6 đã ghi ở đợt trước).
- Test D6 viết lại 3 bài: hai tầng ngoài mốc trần (khẳng định KHÔNG còn chữ xuất xứ), hồ sơ vẫn khai; mốc máy
  vẫn thắng mốc gõ tay. Signals suite 100/100 (+1), tsc 0, detect `[]`, ảnh `output/rd-signals-drawer-1440.png`
  chụp lại. Cũng vá 2 comment cũ "sáu số/bảy bề rộng" → "bốn" trong SignalTable.tsx; thêm ảnh
  `output/rd-rules-1280-dirty-warn.png` (menu ⚠ + chấm dirty không tràn ở 1280). CHƯA COMMIT.
- Đang chờ owner quyết: câu hỏi bỏ/dời hai khối "độ tin dữ liệu" + "bản khai không khớp" sang noti ở Overview —
  mới là ĐÁNH GIÁ, chưa sửa code.

### Bổ sung 18/08 (tối, đợt 3): hai khối điều-kiện-đọc rời #/signals, thành noti ngoại lệ ở CXM Overview

- Owner hỏi "declared vs observed + data trust có cần không, noti trên overview có hợp lý hơn không"
  → đánh giá: nội dung gov QUAN TRỌNG (drift config mà upstream không bắt được), chỗ đứng thì không;
  cả hai là exception, không phải dashboard. Owner chốt "ok làm đi".
- MỚI `overview/SignalHealthNoti.tsx`: hai dải warn CHỈ-HIỆN-KHI-LỆCH ở đầu #/cxm (không gắn #/voc);
  bấm "Details" bung đúng khối chi tiết cũ. Dòng noti + thân khối cùng MỘT đường đếm: `govCounts()`
  (export mới từ SignalGovernanceBlock.tsx) + `reliabilityGaps()` (export mới từ
  SignalReliabilityBlock.tsx; "đo thiếu" chỉ tính MISSING, đúng chốt 07/08 (a); sigCounts rỗng cũng
  là ngoại lệ "chưa nhận số đếm").
- Hai khối đổi CollapsibleBlock → Card luôn mở (collapse thuộc noti); `CollapsibleBlock.tsx` XOÁ
  (orphan do chính đợt 18/08 tạo) — nợ Chevron trùng còn ×2 (RuleLayout + SignalDrawer ✕).
- `SignalsPage.tsx` bỏ hẳn hàng đáy; **SỬA CHARTER §6 lần BA trong ngày**: số T1·T3 + độ tin không
  còn thường trực trên màn nào — chỉ trưng khi lệch, ở Overview. Văn bản charter CHƯA sửa (owner).
- Test: `SignalHealthNoti.test.tsx` MỚI 5 bài (đếm lại N/M, gấp/bung, hai hướng (a)/(b) port từ
  SignalsPage.test.tsx, bản-sao-hết-lệch → render null); OverviewPage.test.tsx +2 (có ở /cxm, không
  ở /voc); SignalsPage.test.tsx thay 7 test cũ bằng 1 chốt chống tái phát; gov test bỏ 5 cú toggle.
- Kiểm: tsc 0 · detect `[]` · signals+overview 214/214 · full 1307/1308 (fail duy nhất = flake
  TourOverlay cũ) · ảnh `output/rd-overview-noti-1440.png`, `rd-overview-noti-open-1440.png`,
  `rd-signals-bottom-1440.png`. CHƯA COMMIT.

### Bổ sung 18/08 (tối, đợt 4): dọn tối giản — bỏ câu giải thích/đếm hộ người dùng không đọc

- Owner: "lọc và bỏ hết các phần giải thích hoặc người dùng ko đọc khi vào trang... bỏ các câu giải
  thích và đánh số như này [chú thích chart + đuôi 'X/Y điểm đo đang ở tình trạng này']".
- `SignalProfile.tsx`: (1) bỏ chú thích "Đường:.../Dải dưới:..." dưới chart — GHI ĐÈ §4 ADR-001 vế
  "mẫu số viết vào nhãn trục"; dòng lệch bản khai giữ lại, testid mới `sigtrend-undeclared`;
  (2) note lát cắt rút còn "Kỳ X — lượt bắn theo kỳ, nhóm khách tính theo hôm nay" (§8 mức caveat,
  bỏ câu hướng dẫn); (3) hai Note bỏ đuôi đếm toàn cục "X/Y điểm đo đang ở tình trạng này";
  (4) XOÁ "Nguồn chở nó..." + "Chưa có trường nào nối điểm đo với nguồn" — hai dòng NÓI SAI từ khi
  có `srcId` (§10c, 12/08); (5) note chuỗi đứt bỏ đuôi "— không tìm được bản ghi tương ứng".
- `SignalInventoryBlock.tsx`: hai câu đếm T4·T7 RỜI khối ① → dòng `noti-coverage` mới trong
  SignalHealthNoti (SỬA CHARTER §6 lần BỐN trong ngày; ràng T4 "hai số lồng một câu" đi theo).
  Dòng coverage KHÔNG có Details — hai con số là toàn bộ nội dung. Chip T5 GIỮ (là bộ lọc bảng).
- Test: SignalTrend đổi bài §4 (assert chú thích KHÔNG còn), SignalProfile 3 bài đổi theo,
  SignalsPage bỏ describe T4 (port), gov test F6 thu về chip T5, SignalHealthNoti +2 bài coverage,
  test hết-lệch thêm steps/metrics rỗng.
- Kiểm: tsc 0 · detect `[]` · signals+overview 214/214 · full 1307/1308 (flake TourOverlay cũ) ·
  ảnh `output/rd-signals-min-1440.png`, `rd-profile-min-1440.png`, `rd-overview-noti3-1440.png`.
  CHƯA COMMIT.
- Còn một nguồn giải thích CHƯA đụng: chuỗi `note:`/`sub:` trong data widget Quantify (seed.ts) —
  là NỘI DUNG DỮ LIỆU, sweep tiếp cần owner gật riêng (đụng data/ + validateFixture).

### Bổ sung 18/08 (tối, đợt 5): sweep `note`/`sub` của Quantify khỏi schema + fixture

- Owner: "sweep nốt note/sub trong all". PHẠM VI: `note` của widget Quantify (16 chuỗi trong seed
  `qt`, nơi hiện cuối cùng là QuantifyDetail từ 03/08) + `sub` của DashQuestion (20 chuỗi — KHÔNG
  màn nào render từ khi port, dữ liệu chết). KHÔNG đụng `note` của Flow/Source — đó là dữ liệu
  nghiệp vụ thật (ghi chú sơ đồ luồng, sự cố nguồn "Webhook lỗi từ 19/07"...), SrcMatrix/Journey
  Map đang hiển thị.
- Xoá field khỏi `schema/quantify.ts` (QuantifyShow.note, QuantifySeries.note, DashQuestion.sub),
  xoá 36 chuỗi khỏi seed.ts (regex, đếm khớp 16+20), mock-repository bỏ `sub:""`, QuantifyDetail
  bỏ khối render `qdetail-note`, QuantifyBuilder bỏ vế merge note khi Lưu đè.
- Test: QuantifyBuilder (d) đổi thành "Lưu đè giữ id" (vế merge note bỏ theo schema);
  QuantifyDetail thay bài "note hiện đúng 1 lần" bằng bài khẳng định KHÔNG còn qdetail-note.
- Kiểm: tsc 0 · detect `[]` · full 1307/1308 (flake TourOverlay cũ; validate.test của fixture nằm
  trong suite, xanh). CHƯA COMMIT.

## Bổ sung 18/08 (tối, đợt 6) — TRẢ NỢ VĂN BẢN CHARTER theo các amendment 18/08

- `module-i-signal-registry-charter.md`: §6 thêm khối "Sửa 18/08" (bốn lần sửa trong ngày, ghi
  trạng thái cuối: T1·T3 → noti-gov, Data trust → noti-reliability, T4·T7 → noti-coverage, T5 ở
  lại làm chip lọc; bất biến một-đường-đếm govCounts/reliabilityGaps); năm dòng T1/T3/T4/T5/T7 và
  đoạn "Còn 5 dòng phải trưng" thêm ghi chú mũi tên; D6 (§5) vế hiển thị đổi tầng (nhãn xuất xứ
  chỉ còn ở hồ sơ, vế CẤM tính tuổi giữ nguyên mọi tầng); §14 sửa dòng I4a (khối độ tin cậy rời
  đi), I4b (drawer cạnh bảng, hồ sơ sau "Open full profile"), I5 (trỏ về §6).
- `adr-001`: §4 gạch vế "viết đủ vào nhãn trục" (luật mẫu số GIỮ — dải khối lượng là vết mẫu số
  trên màn, caption chỉ là phát biểu thứ hai); §8 ghi note lát cắt rút về caveat một dòng.
- 7 docblock trong code đang ghi "văn bản charter chưa sửa theo — việc của owner" lật thành "đã
  sửa theo 18/08" (SignalHealthNoti, SignalDrawer ×2, SignalsPage ×2, SignalTable ×2 — trong đó
  SignalTable sửa luôn hai comment cũ còn nói drawer khai xuất xứ, đã sai từ lượt sửa giữa chừng).
- Ghi nhận: cụm "ngay tại dòng" các docblock trích dẫn KHÔNG có trong charter (trích sai) — vế
  thật đã sửa là "chỉ hiện nguyên chuỗi kèm nhãn mốc do người khai" ở dòng D6. Quyết định 03/08
  "note ở màn chi tiết" không nằm trong file docs nào — chỉ sống ở docblock code, đã cập nhật đợt 5.
- Kiểm: chỉ sửa markdown + comment; tsc -b sạch, không chạy lại suite. CHƯA COMMIT (đợt 6).

## Bổ sung 18/08 (tối, đợt 7) — CHỈNH BA CỘT BẢNG SIGNALS (owner yêu cầu trực tiếp)

- Status: Badge thêm state `good` (token --good lục, prefix ✓ giữ như ok — đọc được không cần
  màu); SIGNAL_STATUS.live → good. Spec cũ "ok cố ý không màu" KHÔNG bị phá: spec đó nói về
  trạng thái SUY RA, còn tracking-plan status là bản KHAI. Vì SIGNAL_STATUS dùng chung, Live
  cũng xanh ở Atlas — đúng luật cùng-điểm-đo-cùng-giọng.
- Traffic: bỏ chấm tròn chạy/không-chạy (phát biểu thứ hai của vol>0; "—" đã nói không có
  traffic) và bỏ dấu chấm ngăn nghìn ("9.510" dễ đọc nhầm 9,51 cạnh chữ Anh; vol tối đa 4 chữ
  số). Diễn giải "trafic bỏ dấu ." của owner thành CẢ HAI loại dấu chấm — owner veto được.
- Last seen: "27/07 · 14:52" → "27 Jul · 14:52" (features/signals/stamp.ts — parse không ra thì
  hiện NGUYÊN chuỗi); bảng vẽ hai tông (ngày đậm, giờ nhạt), drawer + profile cùng phép định dạng.
  D6: đây là đổi CÁCH VIẾT, vế cấm suy tuổi giữ nguyên — đã ghi addendum vào dòng D6 charter §5.
  "2 days ago" vẫn là thứ KHÔNG được làm.
- Test: stamp.test.ts mới (cặp vào/ra ghim chữ — hợp đồng định dạng, tránh test tự chứng bằng
  chính implementation); Badge.test +2 bài good; SignalsPage.test D6 + SignalProfile.test đổi
  kỳ vọng qua stampText().
- Kiểm: tsc 0 · detect sạch · screenshot output/rd-signals-cols-1440.png + -drawer-. CHƯA COMMIT.


## 18/08 tối — đợt 8 (owner, nối tiếp đợt 7): tick Live · Last seen căn phải + tô màu · Traffic per day

Bốn yêu cầu owner (mid-turn): bỏ tick cạnh Live; cột Last seen về mép phải thay vì "treo ở giữa";
mốc ĐỎ khi "data ở đây đang gặp vấn đề và ko nhận được gần đây"; cột Traffic chỉ còn số, tên đổi
"Traffic per day".

1. **Tick ✓ bỏ ở state `good`** (Badge.tsx) — ✓ ở `ok` (RUNNING…) GIỮ: `ok` không màu, tick vẫn là
   thứ duy nhất tách nó khỏi chữ thường. Badge.test đổi theo (textContent === "Live").
2. **Last seen căn phải** — HEADERS align "right" + ô `text-right`; ô mang testid mới
   `signal-seen-{id}`.
3. **Tô màu mốc theo `signalFeedHealth`** — KHÔNG dựng bậc thang mới: down → `text-crit` (đỏ),
   stale → `text-watch` (hổ phách), silent/ok/unknown không tô — CÙNG bậc với badge "Source feed"
   ở hồ sơ (FEED_BADGE). Owner nói "màu đỏ" nhưng bậc thang hiện hành nói stale là hổ phách —
   **owner veto được** (muốn đỏ cho cả stale thì nói). D6 nguyên vẹn: srcId null (mốc người gõ)
   KHÔNG BAO GIỜ tô — test chốt riêng. SignalTable nhận thêm prop `cfg` (SignalsPage truyền).
   **LƯU Ý fixture**: hiện KHÔNG điểm đo nào (seed lẫn demo) nối vào 2 nguồn đang sự cố
   (src-survey stale, src-zalo down) ⇒ trên màn chưa dòng nào đổi màu. Ảnh minh hoạ
   `rd-signals-cols2-tinted-1440.png` chụp bằng cách TẠM nối sg8→src-zalo, sg10→src-survey rồi
   revert seed.ts ngay (git checkout, đã xác nhận sạch). Muốn thấy màu thật: đội dữ liệu khai nối,
   hoặc owner duyệt cho demoData nối tất định — CHƯA làm, chờ quyết.
4. **Traffic per day** — nhãn cột mang đơn vị, ô chỉ còn số; drawer "Volume" → "Traffic per day"
   (giá trị số trần), profile "Volume: X/day" → "Traffic per day: X" — một dữ kiện một tên trên cả
   ba tầng. Atlas panel "Volume/ngày" KHÔNG đụng (nợ bilingual đã ghi).

Tests: signals+Badge+atlas 145/145; 3 test tô màu mới (down/stale/không-nối) dựng dữ liệu bằng đếm
lại `sourceHealth`, không ghim id. Full suite đợt 7 đã xanh 1313/1314 (chỉ TourOverlay flake); full
suite đợt 8: 1316/1317 xanh — bài đỏ duy nhất là TourOverlay flake đã ghi nợ. Detect: `--json` in `[]` (mấy lần trước chạy text-mode nên
0 finding = im lặng — từ nay dùng --json để có tín hiệu dương). tsc -b exit 0.

Ảnh: rd-signals-cols2-1440.png (bảng thường) · rd-signals-cols2-drawer-1440.png (drawer) ·
rd-signals-cols2-tinted-1440.png (minh hoạ tô màu, fixture tạm). CHƯA COMMIT (đợt 6+7+8 đều chưa).


## 18/08 tối — đợt 9 (owner): Last seen + Data as of phải nói ngay "data có về định kì không"

Yêu cầu owner: nhìn Last seen và Data as of phải thấy NGAY data đang được chuyển về định kì hay
đang thiếu các ngày gần đây.

1. **Dòng trạng thái giao nhận dưới mỗi mốc Last seen** — `features/signals/feedStatus.ts` (MỚI):
   Receiving / Missing N days / Stopped · missing N days / No source linked. N = `sourceDaysMissing`
   máy đếm từ mốc feed của NGUỒN so với Data as of — KHÔNG đếm gì từ `Signal.seen` (D6 nguyên; điểm
   đo chưa nối chỉ được nói "No source linked"). ok/unknown mực thường, chỉ stale/down có màu —
   dòng có vấn đề là thứ màu duy nhất trong cột. FEED_LABEL/FEED_BADGE dời từ SignalProfile ra
   feedStatus.ts (kèm ĐÍNH CHÍNH: câu "chép nguyên văn từ SourcesPage" đã sai từ đợt EN 18/08 —
   SourcesPage vẫn tiếng Việt, nợ bilingual). Badge Source feed ở hồ sơ nay cũng mang số ngày
   ("Missing 3 days") — một giọng với bảng.
2. **Bỏ chú thích asOf đầu trang** (`signals-asof`) — mặt bảng in "Data as of" hai lần cách ~40px
   (đầu trang + thanh công cụ bảng), đúng lỗi "một dữ kiện đọc thành hai" mà comment cũ tự nêu.
   Mốc neo duy nhất: `signal-table-asof-note`. Đây là CÁCH EM ĐỌC "date as" — owner veto được
   (nếu ý là làm asOf nổi bật hơn thì nói).
3. Charter D6: nối thêm câu về dòng trạng thái vào clause 18/08. Tests: feedStatus.test.ts (hợp
   đồng câu chữ, precedent stamp.test.ts); 4 test tô màu/nhãn trong SignalsPage.test đếm lại
   `sourceDaysMissing`, không ghim số; signals+overview 225/225 xanh; tsc 0; detect --json [].
4. **Fixture gap VẪN TREO (giờ chặn chính tính năng owner vừa xin)**: không điểm đo nào nối vào 2
   nguồn sự cố ⇒ màn thật chỉ thấy Receiving/No source linked, không bao giờ thấy Missing/Stopped
   cho tới khi (a) đội dữ liệu khai nối hoặc (b) owner duyệt demoData nối tất định. Ảnh
   `rd-signals-feed-tinted-1440.png` là minh hoạ (tạm nối sg8→src-zalo, sg10→src-survey rồi revert
   seed.ts — đã xác nhận sạch). Ảnh thường: rd-signals-feed-1440.png · rd-signals-feed-drawer-1440.png.

Drawer KHÔNG đụng (Source feed row vẫn chỉ tên nguồn). Full suite đợt 9: 1320/1321 pass (fail duy nhất = TourOverlay flake đã ghi nợ).
CHƯA COMMIT (đợt 6+7+8+9 đều chưa).


## 18/08 tối — đợt 10 (owner): bản vẽ schema data để verify rồi đi xin team data

Owner: "mình sẽ vẽ ra schema data cần thiết để verify, ổn r thì đi xin team data". Hai artifact:

1. **`web/docs/ideal-data-model.md` §6 MỚI** — bản danh sách duy nhất (luật 14/08) nhận thêm phần
   bản vẽ, KHÔNG đẻ doc thứ hai. 8 khối: T1 signal_registry (Bảng D + `src_id` nối nguồn — chính
   là đường (a) đóng fixture gap đợt 8–9), T2 source_registry (nhịp giao + bản đồ nguồn↔chỉ số),
   T3 event_fire_raw (ĐÃ CẤP 13/08 — chỉ xác nhận hình dạng, khớp SigFire + fired_at/received_at;
   mốc thấy-cuối từng điểm đo = MAX(fired_at), truy vấn chứ không phải field xin thêm),
   T4 step_obs_daily, T5 step_fail_reason_daily, T6 delivery_manifest (nơi sourceHealth đọc mốc
   máy thật), T7 asof_watermark, T8 snapshot NAV/tier (chỉ XÁC NHẬN có sẵn — lối (b) ADR-001 §8).
   Điều khoản giao 5 khoản (ISO có năm — nghỉ hưu hack năm-2000; hạt NGÀY; chưa-đo vắng mặt;
   0 dòng vẫn có manifest; Signal.seen ở lại chỉ làm provenance). Bảng đối chiếu 6.3 verify hai
   chiều: mọi cột có người tiêu thụ nêu tên, §5 "KHÔNG xin" không lọt mục nào.
2. **`output/ban-ve-schema-data.html`** — trang một tờ tự chứa để owner review và gửi bên data.
   Owner xin thêm: mục 1 của trang là SƠ ĐỒ QUAN HỆ dạng ERD (SVG vẽ bằng script inline, 900px,
   9 hộp bảng + PK/FK + đường N:1; nét đứt = quan hệ đọc/join, không phải FK giao hàng).

Ba câu hỏi mở, mỗi câu một người trả lời: Q1 (data) lượt bắn thô có customer_id không — quyết mục
A; Q2 (data) bảng NAV/tier cuối ngày có sẵn ≥12 tháng không; Q3 (BÊN CASE, không phải data) case
gắn với bước/lý do bằng trường nào — quyết số phận `rep`.

Luật "không khai type trong web/ cho dữ liệu chưa có" GIỮ — không file nào trong src/ bị đụng.
CHƯA COMMIT (đợt 6–9 đã commit dcfd9c7; đợt 10 chờ owner verify — "ổn r thì đi xin").


## 18/08 tối — đợt 11 (owner): ô cột cuối ĐẢO THỨ BẬC — badge trạng thái là chính, ngày nhỏ bỏ giờ, cột đổi tên

Owner: "phần chữ của cột last seen nên là thông tin chính và có màu hoặc card gì đó để show có đang
gặp vấn đề gì ko nhanh hơn, phần time thì bỏ giờ đi và để nhỏ ở dưới cho user biết khi cần thôi,
đổi tên cột cho phù hợp". Bốn việc:

1. **Badge trạng thái giao nhận lên làm thông tin chính** — dùng CHÍNH Badge + FEED_BADGE (cùng
   badge với "Source feed" ở hồ sơ, không chế khung mới): ✓ Receiving (không màu) / Missing N days
   (hổ phách) / Stopped · missing N days (đỏ) / — No source linked (nét đứt xám).
2. **Mốc chỉ còn NGÀY** (SeenDate, stampParts().date), cỡ 11px mực nhạt, đứng DƯỚI badge — GIỜ rời
   mặt bảng, vẫn đầy đủ ở drawer + hồ sơ (stampText). Ngày KHÔNG mang màu nữa — màu là việc của
   badge, một ô hai thứ cùng đỏ là nói một chuyện hai lần.
3. **Cột đổi tên "Last seen" → "Feed status"** (HEADERS) cho khớp thông tin chính mới.
4. **FEED_TONE bỏ** (feedStatus.ts) — map tông chữ trần sống đúng một đợt, thành mồ côi khi badge
   nhận việc màu; SeenStamp (tone crit/watch) thay bằng SeenDate.

Test đổi theo nghĩa mới (không nới): hai bài D6 bảng đối chiếu bằng stampParts().date và chốt
"giờ không còn trên dòng"; unlinked chốt textContent "— No source linked" (prefix — của Badge
unknown); ok chốt "✓ Receiving" + soi màu bằng querySelector trong wrapper. Charter D6 nối thêm
mệnh đề đợt 11. Focused signals+Badge 111/111, tsc -b 0, oxlint chỉ 2 warning pre-existing ở file
không đụng (SignalGovernanceBlock/SignalReliabilityBlock — fast-refresh). detect.mjs KHÔNG còn
(tool scratchpad phiên cũ, đã mất theo session) — thay bằng oxlint từ nay.

Ảnh: rd-signals-feed2-1440.png (fixture thật — toàn ✓ Receiving/— No source linked, fixture gap
VẪN TREO) · rd-signals-feed2-tinted-1440.png (minh hoạ: sg8→src-zalo "Stopped · missing 8 days"
đỏ + 19 Jul; sg10→src-survey "Missing 1 day" hổ phách; seed revert sạch, đã xác nhận). Bộ ảnh
rd-signals-feed-*.png đợt 9 nay LỖI THỜI. Full suite đợt 11: 1321/1321 pass — sạch tuyệt đối, cả TourOverlay flake lần này cũng xanh.
CHƯA COMMIT (đợt 10 schema + đợt 11 này; đợt 6–9 đã commit dcfd9c7).


## 18/08 tối — đợt 11b (owner): Receiving bỏ tick, mang màu lục

Owner ngay sau đợt 11: "bỏ cái tick đi và cho màu đánh màu cho tình trạng nữa". Một chỗ đổi:
FEED_BADGE.ok (feedStatus.ts) "ok" → "good" — Receiving thôi mượn state ✓-không-màu, sang badge
lục không prefix (good đã bỏ ✓ từ đợt 8). Bốn trạng thái giờ đều đọc được bằng màu: lục / hổ
phách / đỏ / xám nét đứt. Ăn theo cả badge "Source feed" ở hồ sơ (một map chung — chủ đích).
Bài test ok đổi nghĩa: textContent "Receiving" + .text-good phải có, crit/watch phải không.
Ảnh feed2 (thường + tinted) CHỤP LẠI đè lên bản đợt 11. Focused 111/111, tsc 0. Full suite đợt
11b: 1321/1321 pass — sạch tuyệt đối. CHƯA COMMIT (đợt 10 + 11 + 11b).

Ghi chú kỹ thuật: heredoc bash-python lại phá pattern nhiều dòng (rep 3 dòng đếm 0 dù từng dòng
đếm 1) — file .py qua Write vẫn là đường an toàn duy nhất cho sửa chữa nhiều dòng.
