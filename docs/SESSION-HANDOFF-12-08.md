# Handoff — đọc file này TRƯỚC khi làm gì, phiên 12/08/2026

**Chỗ vào của phiên mới.** Thay thế `docs/SESSION-HANDOFF-11-08.md` (file đó giữ lại làm lịch sử, đã
commit). Không phải bản tóm tắt dự án — dự án ở `web/docs/*-charter.md` và `docs/DB-FIRST-HANDOFF.md`
(1095 dòng, **đừng đọc cả**, chỉ tra mục cần).

**Một dòng trạng thái:** nhánh `feat/module-i-signal-registry` đã **push tới `e8060cb`**, cây làm việc
**sạch** (trừ 4 file untracked ở §2), `tsc -b` exit 0, **103 file / 1198 test xanh**, `validateFixture`
**0 lỗi trên cả hai fixture**. Không còn việc code nào dở dang.

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
| Chưa commit | **Không có gì** trong `web/src`. Còn 4 file **untracked chưa từng hỏi owner**: `CLAUDE.md` (gốc repo) và `output/atlas-{lock,nosignal,tabs}-preview.png`. Chưa add vào commit nào vì không thuộc phạm vi việc nào đang làm — **owner quyết** giữ, commit, hay xoá |
| Dev server | `http://127.0.0.1:5173/` (Vite, `npm run dev` trong `web/`) |

---

## 3. Cách tự kiểm — chạy đủ ba, đừng bớt

```bash
cd web
npx tsc -b                    # phải exit 0
npx vitest run                # 103 file / 1198 test xanh
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

**Nhóm C (quyết nhỏ)** — `web/docs/module-i-signal-registry-charter.md` §0 C. `C5` và `C7` **đã
chốt**. Còn:

- **C1** — `AtlasStepInspector` sau I1 bỏ hẳn ô "Evidence coverage" (grid 4→3 cột). Muốn 4 cột với một
  ô trống tường minh thì sửa nhanh.
- **C2** — dòng mốc số liệu hiện ở Tổng quan. Có cần thêm màn nào nữa.
- **C3** — Demo Mode có cần mốc rõ là giả không (cố ý chưa làm, không tự bịa cách thể hiện).
- **C4** — bước đã chép mà chưa đo: hợp lệ hay lỗi dữ liệu. I2 chọn **hợp lệ**; muốn ngược lại thì
  phải bỏ ca *"chưa đo"* khỏi UI cho khỏi nói hai giọng.
- **C6** — tab "Chỉ số liên kết" trong Atlas **thiếu** dòng độ tươi (không phải sai). Cần luồn
  `data.sources` + `data.asOf` qua `AtlasStepInspector` — việc của Atlas, một câu là làm.

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

## 6. Ba ô cấu hình MỒ CÔI đang còn sống — đo được, không phải suy đoán

Gõ được ở `#/rules`, đã có dải kiểm (nhóm 24), nhưng **không phép tính nào đọc**:

| Ô | Mồ côi từ | Đo bằng gì |
|---|---|---|
| `cfg.step.covMin` | 07/08 (D4/F9 bỏ nhánh so `obs.cov` khỏi `stepState`) | không caller nào ngoài `StepGroup.tsx:100` |
| `cfg.data.anomalyX` | chưa từng có caller trong bản React | chỉ `AlertGroup.tsx:95`; câu "Volume vượt baseline" của prototype đã bỏ vì không có chuỗi volume thật để tính |
| `cfg.data.repeatMin` | chưa từng có caller trong bản React | chỉ `AlertGroup.tsx:121` |

Đây là **bẫy số 1 của dự án** (xem §7) ở lần thứ ba, tư, năm. Hai đường xử, **owner chọn**: (a) bỏ ô
khỏi màn — màn không hứa thứ nó không làm; (b) nối vào phép tính thật — cần dữ liệu chưa có (`anomalyX`
đòi chuỗi volume theo ngày, `repeatMin` đòi log liên hệ theo chủ đề). **Không tự chọn**: bỏ ô là xoá
một hứa hẹn owner có thể đang muốn giữ.

---

## 7. Bẫy của dự án này — đã trả giá, đừng lặp

- **Ô cấu hình mồ côi.** Gõ được mà không đổi được nhãn nào. Năm lần: `cfg.step.covMin` sau I1 ·
  `cfg.source` từ 07/08 đến 11/08 (C5, **đã sửa**) · `metricFreshnessText()` (hàm sinh chuỗi không có
  caller) · `anomalyX` · `repeatMin`. Phép kiểm: *"sửa ô này có đổi được nhãn nào không"*, viết thành
  test.
- **Màn nói sai về chính nó.** Bốn lần. Mới nhất 12/08: `NumField` chỉ đồng bộ qua
  `useEffect([value])`, nên khi seam ghi **từ chối** (`value` y nguyên) ô đứng lại ở con số vừa gõ
  trong khi cfg giữ số cũ. **Đã sửa** — `commit()` kéo ô về `value`, có test đầu-cuối ở
  `AlertGroup.test.tsx`. Mặc định phải nằm ở **một hằng** cả domain và UI cùng đọc.
- **Docblock nói ngược code.** Sửa docblock **cùng lượt** với code — đừng để lại.
- **Một trường gộp hai nghĩa.** `Flow.verified`/`observed` (D2), `Signal.st` (D5), `Source.lagH` dưới
  pipeline T-1. Ba lần.
- **Ghim số vào test.** Đã đóng dấu defect thành hành vi đúng **hai lần**. Test phải **đếm lại từ
  data**; xanh khi data đổi, đỏ khi logic trôi.
- **Bốn nghĩa của "không biết" không được trộn**: `chưa-biết` · `thiếu` · `chưa định danh` · `không áp
  dụng`.
- **Thứ tự tầng**: `data → store → domain → design-system → features`. Không đi ngược.

---

## 8. Tiếp theo làm gì — ba hướng, owner chọn một

Xếp theo *"rẻ và đóng được một chỗ hở thật"*, không theo độ to.

1. **Dọn ba ô cấu hình mồ côi (§6).** Một câu quyết của owner cho mỗi ô, rồi code theo — bỏ ô là
   ~30 phút cả test; nối vào phép tính thì phải đợi dữ liệu. **Vì sao nên trước:** đây là bẫy số 1 của
   dự án, đang có **ba** ca sống cùng lúc, và màn `#/rules` vừa được siết dải số nên đụng lúc này là
   rẻ nhất — cùng một vùng code, cùng một mạch đọc.
2. **C6 + C1 — hai quyết nhỏ đã đủ dữ kiện.** C6 luồn `data.sources` + `data.asOf` qua
   `AtlasStepInspector` (một câu là làm, ~20 phút). C1 chỉ là chọn grid 3 hay 4 cột. Cả hai đóng nốt
   dư âm của Module I.
3. **Quay lại đổi hướng 07/08 — MVP tối giản về quản trị flow dữ liệu và độ phủ.** Việc to nhất và
   chưa được động tới kể từ khi owner chốt hướng: phạm vi MVP **chưa định nghĩa**, năm câu hỏi neo sẵn
   vào số đo thật ở `web/docs/HANDOFF-MVP-FLOW-COVERAGE.md` §4. Phiên làm việc này phải **mở đầu bằng
   brainstorm, không code**.

Còn hai module đang **TREO vì đổi hướng**, đừng tự khởi động lại: Module B (màn điểm gãy
`#/issue/:id` — 3 đường dẫn vào vẫn ra trang trắng, **đây là trạng thái đã chấp nhận**) và Module H
(rework Bảng xử lý). Charter cả hai đã viết xong và đánh dấu HOÃN.
