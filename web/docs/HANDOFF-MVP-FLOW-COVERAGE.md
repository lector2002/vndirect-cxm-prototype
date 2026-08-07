# HANDOFF — phiên sau: MVP minimal về **quản trị flow data & coverage**

Viết 07/08/2026 lúc kết phiên. **Đọc file này trước, rồi mới đọc `REBUILD-STATUS.md`.**

---

## 1. Owner chốt gì ở cuối phiên này

> *"đổi trạng thái dự án thành ưu tiên làm mvp đơn giản nhất, trước tiên làm kĩ và tinh phần quản trị
> các điểm data và ngưỡng trước, sẽ brainstorm kĩ trong session sau"*
>
> *"viết handoff để session sau tập trung vào mvp minimal về quản trị flow data và coverage hoàn
> thiện chi tiết trước"*

**Việc đầu tiên của phiên sau là BRAINSTORM, không phải code.** Phạm vi MVP chưa được định nghĩa.
Mọi charter viết trước 07/08 đều dựa trên giả định *dựng đủ như prototype* — **giả định đó đã đổi**,
nên charter cũ không tự động còn hiệu lực.

**ĐỪNG khởi động những thứ sau khi chưa brainstorm xong:**

| Việc | Trạng thái | Lý do dừng |
|---|---|---|
| Module B B2–B6 (màn Điểm gãy `#/issue/:id`) | **DỪNG ở B1** | Owner từng chốt "làm trọn màn rồi mới dừng", rồi **đổi ý ngay sau đó** bằng câu handoff ở trên. Câu sau thắng. Ba đường dẫn vào màn đó vẫn ra trang trắng — **đó là trạng thái được chấp nhận**, không phải việc bỏ quên |
| Module H (rework Bảng xử lý) | **HOÃN** | Phụ thuộc B2/B3 vốn không còn chạy |
| Màn Agent & cảnh báo · Trợ lý | chưa dựng | Chưa biết có trong MVP không |

---

## 2. Trạng thái cây code — xanh, CHƯA COMMIT

```
tsc -b   exit 0
vitest   99 file · 1113 test · 0 đỏ
vite build  xanh
```

**Toàn bộ công việc từ 06/08 tới giờ vẫn chưa commit** (owner chưa yêu cầu). `git status` bẩn ở
~24 file. Nếu phiên sau định làm gì lớn, **cân nhắc xin owner cho commit trước** để có mốc quay lui —
hiện không có mốc nào giữa `3a7b45d` và bây giờ.

### Phiên này đã làm gì

| Section | Việc | Trạng thái |
|---|---|---|
| **B0** | Nhãn dải nói đúng khoảng: `>5tỷ`→`5tỷ+`, `>5 năm`→`5 năm+`, và dải sát 0 không còn đè lên `0đ` | **xong, chứng thực độc lập** |
| **B1** | Bảng `hist` (chuỗi lịch sử chỉ số) + validate nhóm 23 + sinh demo tất định | **xong, chứng thực độc lập** |

Chi tiết và bài học ở [module-b-issue-charter.md](./module-b-issue-charter.md). **Hai bài học đáng
mang sang phiên sau:**

1. **Worker báo 10 file, mtime cho thấy 11.** Kiểm phạm vi bằng `find src -newermt "<mốc>"`, KHÔNG
   bằng report và KHÔNG bằng git (cây đang bẩn sẵn nên git diff lẫn việc cũ).
2. **Test của worker khoá đúng cái sai.** Bộ sinh chuỗi lịch sử tung đồng xu chọn chiều, làm
   `CXI-013` kể "chỉ số đang tốt dần rồi bỗng bị ghi nhận là điểm gãy" — rồi test pin sáu con số sai
   đó lại thành hành vi mong muốn. Chỉ oracle độc lập (tính `metricDirection` rồi đếm dòng kể ngược)
   mới bắt được. **Đây là lần thứ hai đúng khuôn "Bài học đắt nhất" của dự án.**

---

## 3. Bản đồ: "quản trị flow data & coverage" hiện đang có gì

Đo bằng oracle độc lập trên `seed` ngày 07/08. **Đây là bản đồ để brainstorm, không phải danh sách
việc phải làm.**

### 3.1 Quy mô

```
6 phase · 20 group · 32 flow · 30 bước · 30 obs
30 touchpoint · 30 signal · 7 nguồn · 6 chỉ số · 6 khảo sát
```

### 3.2 Flow — ba trạng thái, và chỗ hổng lớn nhất

| Trạng thái | Số flow | Nghĩa |
|---|---|---|
| `observed: true` | **6** | có sơ đồ + có số liệu thật |
| `verified: true`, chưa đo | **19** | khai là đã xác minh sơ đồ nguồn… |
| chờ nguồn | **7** | chưa có gì |

⚠️ **CẢ 19 FLOW "ĐÃ XÁC MINH" ĐỀU CÓ 0 BƯỚC.** Không flow nào trong nhóm đó khai được một bước nào.
Tức nhãn *"có sơ đồ nguồn, chưa đo"* hiện **không có gì đứng sau nó** ngoài một cờ boolean. Đây là
câu hỏi quản trị số một: *"đã xác minh" nghĩa là gì, và bằng chứng của nó nằm ở đâu?*

Sáu flow có số liệu: `f-open-2026` (6 bước, phase 02) · `f-dep-4ch` (4) · `f-dep-trace` (4) ·
`f-wd` (7) · `f-tr-sub` (4) · `f-deriv-open` (5, **phase 04 đang KHOÁ** — owner chốt giữ khoá 07/08,
nên flow này có 51 bằng chứng mẫu mà không mở được trên UI).

### 3.3 Coverage — số đo

```
cfg.step.covMin = 70
obs.cov:  n=30 · min=57 · max=99 · median=88
bước DƯỚI ngưỡng: 6/30
```

### 3.4 Điểm đo (signal) — hai thước đo song song, không ai đối chiếu

```
live=21 · validating=4 · designed=3 · gap=2
bước CÓ ít nhất 1 điểm đo: 23/30
bước KHÔNG có điểm đo nào:  7/30
```

**Đây KHÔNG phải lỗi dữ liệu** — đã kiểm: `obs.cov` là số khai thẳng ở `seed.ts` (mỗi bước một dòng),
còn `signal` gắn vào **touchpoint** (`sg.tpId`), không gắn vào bước. Không đoạn code nào suy `obs` ra
từ `signal` hay ngược lại. `AtlasCoverageTab.tsx:26` nói rõ ca "bước chưa khai điểm đo nào" là **có
thật trong pilot** (bước 04 flow nạp tiền, phase 03 Dòng tiền), và tab đó nhận `obs` với `signals`
làm **hai prop rời**.

⚠️ Cái đáng đào là chỗ khác: hệ đang có **hai thước đo độc lập cho cùng một câu hỏi "bước này có
đang được đo không"** — con số quan sát (`obs.cov`) và bản kiểm kê thiết bị đo (`signals`) — mà
**không màn nào đối chiếu hai thứ đó với nhau**. 7 bước có `obs` đầy đủ nhưng 0 điểm đo là chỗ hai
thước lệch nhau rõ nhất; MVP phải chốt xem hai thước có buộc phải khớp không, và ai là thước gốc.

`AtlasCoverageTab.tsx` chỉ nói cho **một bước đang xem**, không ai tổng hợp lên mức flow hay toàn hệ.

### 3.5 Nguồn — hai chỗ đáng nhìn

| Nguồn | Loại | vol | trễ | ghi chú |
|---|---|---|---|---|
| `src-ga` | event | 41.200 | 4h | |
| `src-ekyc` | event | 12.800 | 6h | |
| `src-case` | case | 1.840 | 2h | voice |
| `src-survey` | survey | 612 | 12h | voice |
| `src-store` | store-review | 186 | 24h | voice · **không nuôi chỉ số nào** |
| `src-broker` | broker-note | 94 | 24h | voice · **không nuôi chỉ số nào** |
| `src-zalo` | chat | **0** | **192h (8 ngày)** | voice · **đứt hẳn**, nhưng vẫn khai nuôi `m-repeat` |

⚠️ `src-zalo` khai là nguồn của `m-repeat` mà vol = 0 và trễ 8 ngày. `m-repeat` là chỉ số neo của
`CXI-028`. Chuỗi *nguồn đứt → chỉ số vẫn hiện số → điểm gãy vẫn kết luận* hiện **không ai chặn**.

⚠️ Danh sách 7 nguồn này là **giả định của prototype**, không phải kết quả kiểm kê thật — owner chốt
06/08. Màn `#/sources` là bản tạm sẽ phải dựng lại. **Phần số học `domain/sources.ts` và bộ test của
nó dùng lại được nguyên.**

### 3.6 Chỉ số & ngưỡng

Cả 6 chỉ số đều `on: true`. Đáng chú ý: `m-ocr` có `watch=90` nhưng `crit=60` — khoảng cách 30 điểm,
rộng bất thường so với các chỉ số khác (thường 3–5 điểm). Chưa rõ chủ ý hay sót.

### 3.7 Code đang đỡ những thứ trên

| Việc | Ở đâu |
|---|---|
| tính coverage của Quantify (đếm được, `refuse`/`draw`) | `domain/quantify.ts` |
| sức khoẻ nguồn, đếm tươi/đứt/instrumented, chỉ số bị đe doạ | `domain/sources.ts` (**dùng lại được**) |
| trạng thái bước / chỉ số / nguồn | `domain/state.ts` |
| ngưỡng đặt ngược nhau | `domain/cfgIssues.ts` |
| khối "ta đo được bao nhiêu phần hành trình" (phân bố theo dải, không nở theo số bước) | `features/overview/blocks/CoverageBlock.tsx` |
| tab độ phủ của một bước | `features/atlas/AtlasCoverageTab.tsx` |
| bốn trạng thái điểm đo | `features/atlas/signalStatus.ts`, `AtlasSignalPanel.tsx` |
| màn sửa ngưỡng, 7 nhóm | `features/rules/` (Module G, xong 06/08) |
| lỗ hổng độ phủ theo hành trình VoC | `domain/vocJourney.ts` (`coverageGapLine`, `quietButVoicedSteps`) |

---

## 4. Năm câu hỏi để brainstorm — mỗi câu neo vào một số đo ở trên

Không phải câu hỏi tu từ; mỗi câu là một mâu thuẫn thật đã đo được.

1. **"Đã xác minh" nghĩa là gì?** 19/32 flow mang cờ `verified: true` mà 0 bước. Cờ đó nên phải có
   bằng chứng gì đứng sau? (§3.2)
2. **Hai thước "bước này có đang được đo không" — thước nào là gốc?** `obs.cov` và bản kiểm kê
   `signals` là hai đường ống độc lập, không ai đối chiếu; 7 bước có `obs` đầy đủ nhưng 0 điểm đo.
   MVP có buộc hai thước phải khớp không, hay chỉ **hiện cả hai cạnh nhau** và để người đọc tự
   đối chiếu? (§3.4)
3. **Nguồn đứt có được phép nuôi chỉ số không?** `src-zalo` vol=0, trễ 8 ngày, vẫn khai nuôi
   `m-repeat` — mà `m-repeat` đang neo một điểm gãy. (§3.5)
4. **Coverage là thuộc tính của bước hay của flow?** Hiện chỉ có ở mức bước (`obs.cov`); mức flow và
   mức phase phải tự cộng, mà chưa ai định nghĩa cộng thế nào cho đúng. (§3.3)
5. **"Quản trị" ở đây là XEM hay là SỬA?** Màn Chỉ số & ngưỡng đã cho sửa thật. Nhưng danh sách flow,
   khai báo bước, khai báo điểm đo, gán nguồn↔chỉ số thì hiện **chỉ đọc**, sửa được duy nhất bằng
   cách sửa fixture. MVP dừng ở đâu?

**Đề xuất mở đầu phiên sau:** chạy `/grill-me` hoặc `/wayfind` trên đúng năm câu này, chốt phạm vi,
rồi mới viết charter. Đừng viết charter trước — phiên này đã có hai charter phải treo lại vì viết
trước khi biết hướng.

---

## 5. Luật vận hành — không đổi, vẫn áp

- Opus điều phối + review + **chứng thực độc lập**. Worker là subagent **native Sonnet**
  (`subagent_type:"claude"`, `model:"sonnet"`, `run_in_background:true`). **KHÔNG gọi codex.**
- **Không tin report worker.** Chứng thực bằng: `tsc -b` + `vitest` + đọc file thật + **oracle riêng
  suy lại số** + live-check. Kiểm phạm vi bằng **mtime**, không bằng git.
- **Trước khi code MỖI MÀN: bàn với owner** các section, rồi owner chốt. Không code trước rồi mới hỏi.
- **KHÔNG `git commit`** trừ khi owner yêu cầu.
- Trả lời owner bằng **tiếng Việt có dấu**, giữ thuật ngữ kỹ thuật bằng tiếng Anh.

⚠️ **Worker Sonnet phiên này hỏng hai lần** (một lần lỗi API giữa dòng, một lần tự kẹt trong vòng
chờ chính lượt vitest của nó — 50 phút, 103 lượt gọi công cụ, không ra kết quả). Cách chữa đã dùng:
dừng agent, tự chứng thực từ file trên đĩa (code nó viết vẫn còn nguyên và dùng được). **Ghi vào
contract: chạy test có trọng điểm trong lúc làm, chỉ chạy full suite MỘT lần ở cuối.**

## 6. Cách kiểm nhanh

```bash
cd web
npx tsc -b && npx vitest run && npx vite build     # cả ba phải xanh
# KHÔNG dùng `tsc --noEmit`: root tsconfig có `files: []` nên nó là NO-OP.
npm run dev                                        # http://localhost:5173

date '+%Y-%m-%d %H:%M:%S'                          # lấy mốc TRƯỚC khi dispatch worker
find src -newermt "<mốc đó>" -type f | sort        # kiểm phạm vi worker
```

Số nhóm luật trong `validate.ts` **đã từng trôi khỏi docblock** — đếm trước khi cấp số mới:
```bash
grep -nE "^\s*/\* ?[0-9]+\." src/data/validate.ts
```
