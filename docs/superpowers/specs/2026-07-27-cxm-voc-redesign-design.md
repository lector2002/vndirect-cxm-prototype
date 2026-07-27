# CXM & VoC Platform — Redesign Design Doc

> Ngày: 2026-07-27 · **sửa đổi 2026-07-28** (§8, §9.5, §9.14, §9.15, §9.16)
> Trạng thái: **đã triển khai** — bản bấm được tại `output/cxm-platform-prototype.html`
> Sửa đổi 28/07: viết lại `/atlas`, bỏ blast radius, bỏ `/customers`, thêm `/rules`
> Mô hình gốc: **Enterpret** (customer intelligence platform) + lớp journey/securities của VNDIRECT
> Bản so sánh phương án kèm mockup: `output/cxm-redesign-options.html`

## Định dạng bàn giao

Owner chốt ngày 27/07/2026: prototype là **một file HTML tự chứa**, không phải React app.

- **File:** `output/cxm-platform-prototype.html`. Mở trực tiếp bằng browser, không cần cài hay build gì.
- **Lý do:** mục đích là gửi cho lãnh đạo xem và cho người khác sửa thêm. Một file tự chứa thì gửi qua email là chạy được, và sửa được bằng text editor.
- **Vanilla JS, cố ý không bundle/minify.** Toàn bộ dữ liệu nằm trong object `DATA` ở đầu `<script>` kèm comment tiếng Việt, để người không phải developer sửa được nhãn, số liệu và câu nói của khách. Nếu minify thì không ai sửa nổi — mất đúng mục đích.
- **Chart vẽ bằng SVG/CSS thuần**, không dùng thư viện. Chart đơn giản hơn, đổi lại file vẫn đọc và sửa được.
- **Route là hash route** trong cùng một file: `#/feed`, `#/atlas`, `#/rules`, `#/issue/CXI-021`. Vẫn deep-link và share link được.
- **`validateFixture()` chạy mỗi lần render**, lỗi hiện thành banner đỏ trên mọi màn. Đây là lưới an toàn cho người sửa file: làm đứt một liên kết thì UI nói ngay chỗ nào sai.

Các đường dẫn `app/src/...` trong tài liệu này mô tả **code React cũ đang bị thay thế**, dùng để đối chiếu vấn đề. Code đó vẫn còn trong repo, chưa xóa.

**Trạng thái so với §2.1:** đã build cả hai pha — toàn bộ 14 route cộng hai màn chi tiết. Lý do làm luôn pha 2: mục tiêu thứ hai của bản này là chốt tính năng cho team dev, nên dev cần thấy đủ bề mặt, không chỉ 6 màn của bản giới thiệu.

**Thay thế các phần sau của `docs/CXM-PROTOTYPE-SCOPE.md`:** information architecture · design system · workflow ba bước `Phát hiện → Xử lý → Đánh giá` (nay là vòng bốn chặng) · toàn bộ mục "Acceptance path" (nay là §13) · mục "Feature cần review và chốt" (nay là §5–§6). **Giữ nguyên** mục "Ngoài phạm vi dự án" và "Mock data contract".

**Thay thế kết luận của `.swarm/synthesis.md`:** câu *"VNDIRECT CXM should not pursue feature parity with Enterpret"* đã được owner lật ngày 27/07/2026. Enterpret nay là mô hình gốc. Xem §4.

---

## 1. Mục tiêu

Chuyển prototype từ tập hợp 8 báo cáo rời rạc thành một customer intelligence platform theo mô hình Enterpret, cộng lớp hành trình mà Enterpret không có — đây là chỗ VNDIRECT khác biệt.

Hai giai đoạn:

1. **Demo lấy phê duyệt** — mỗi màn tự giải thích được, người xem không cần học IA trước khi hiểu nội dung.
2. **Bồi thành spec** — IA và data model không phải làm lại khi thêm chi tiết.

Vì có giai đoạn 2, mọi chỗ đơn giản hóa cho demo đều được ghi rõ ở §12. Không để chỗ nào bị hiểu nhầm là thiết kế cuối.

## 2. Phạm vi

**Trong phạm vi**

- Pilot `Mở tài khoản mới 2026` — 6 bước, làm sâu toàn bộ vòng Signal → Insight → Issue → Action → Outcome.
- Bản đồ hành trình hiển thị **toàn bộ** 7 phase đã map từ `docs/account-journey-mermaid.html` và `docs/money-journey-mermaid.html`, ở mức cấu trúc.
- Desktop web, tiếng Việt, mock data trong session.

**Ngoài phạm vi** — kế thừa nguyên `docs/CXM-PROTOTYPE-SCOPE.md` §"Ngoài phạm vi dự án": không backend, API, persistence, PII thật, integration, RBAC thật, audit log thật, mobile. Bổ sung: **không** làm MCP Server (là integration, không phải UI), **không** làm Sales Intelligence (xem §5.5), **không** làm workflow merge/split taxonomy (xem §4).

Thuật ngữ sản phẩm của Enterpret giữ nguyên tiếng Anh khi là danh từ riêng: `Feed`, `Quantify`, `Dashboard`, `Taxonomy`, `Agent`, `Category`, `Saved Items`.

### 2.1 Thứ tự triển khai — hai pha

Tất cả hạng mục ở §9 và §13 đều cần, nhưng **không cùng lúc**. Prototype hiện tại là ~3.500 dòng, trong đó 863 dòng fixture. Xây 15 route trong một pass là cách chắc chắn nhất để không xong pha nào.

Ranh giới chia pha lấy từ chính §11: **guided tour đi qua đúng 6 route** — đó là bộ tối thiểu để demo lấy phê duyệt.

**Pha 1 — bộ demo lấy phê duyệt.** Xong pha này là đủ để trình lãnh đạo.

1. `validateFixture()` — **viết trước tiên**, trước khi gộp fixture, để phát hiện quan hệ đứt ngay khi gộp
2. Gộp 4 fixture thành một nguồn, xóa `customerPhaseForLegacyId()`
3. Design system: token màu, thang chữ, khuôn 4 tầng, hai quy tắc trung thực dữ liệu (§10.3)
4. Sáu route của tour: `/dashboard` · `/feed` · `/quantify` · `/health` · `/actions` · `/outcomes`
5. `/issue/:id` — bắt buộc trong pha 1 vì nó là thứ chặn lỗi P0 ở §7.1
6. Guided tour ribbon

**Pha 2 — chiều sâu chứng minh platform.** Làm sau khi pha 1 được duyệt.

`/atlas` · `/sources` · `/surveys` · `/taxonomy` · `/agents` · `/assistant` · `/rules`

Thứ tự trong pha 2 theo giá trị chứng minh: `/atlas` trước (đây là differentiation lớn nhất, xem §6 #1), rồi `/sources` và `/surveys` (nền dữ liệu), rồi `/rules` (§9.16 — thứ làm cho ba màn trên có nghĩa), cuối cùng `/taxonomy`, `/agents`, `/assistant`.

Ba route cuối cũng là ba route được cắt đầu tiên nếu hết thời gian — trùng với mitigation ở §14 nhưng vì lý do khác: ở đây là công sức xây, ở §14 là số lượng nav item.

## 3. Vai người dùng

| Vai | Câu hỏi họ mở app để trả lời | Điểm vào | Lớp họ dùng |
|---|---|---|---|
| **Head of CX / CX Manager** (chính) | Điểm gãy nào tệ nhất, ai đang xử lý, đã cải thiện chưa | `Dashboard` template dọn sẵn | Curated: Dashboard, Hành trình, Xử lý |
| **VoC Analyst** (đồng chính) | Khách đang nói gì, bằng chứng nào, theme nào đang xấu đi | `Feed` | Artifact: Feed, Quantify, Taxonomy, Nguồn |
| Ban lãnh đạo (phụ, chỉ xem) | Sức khỏe trải nghiệm và ROI của việc đã sửa | `Dashboard` được share | Chỉ Dashboard |
| PO / Squad owner (phụ) | Issue nào giao cho tôi, hạn nào, metric thành công nào | `Hành động` | Chỉ Xử lý |

Điểm quan trọng về triết học thiết kế: Enterpret là **artifact-centric** — app đưa primitive, người dùng tự soạn. Được vậy vì user của họ là analyst toàn thời gian. Head of CX của ta không phải analyst. Nên prototype phải có **cả hai lớp**: primitive cho Analyst, và Dashboard template dọn sẵn cho Head of CX để họ không bao giờ phải tự soạn Quantify. Đây cũng là cách Enterpret làm — họ ship template kiểu "Track Your Feature".

## 4. Quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Mục đích | Demo lấy phê duyệt trước, chốt xong bồi thành spec |
| Phạm vi | Giữ pilot **Mở tài khoản**, làm sâu. Bản đồ vẫn hiển thị toàn bộ 7 phase |
| Vai chính | Head of CX + VoC Analyst — hai vai đồng chính, hai điểm vào, hai lớp UI |
| **Mô hình gốc** | **Enterpret**. Lật kết luận *"should not pursue feature parity"* trong `.swarm/synthesis.md` |
| Primitive lõi | `Feed` · `Quantify` · `Dashboard` — lấy nguyên từ Enterpret |
| Lớp bổ sung | 8 hạng mục ở §6, trọng tâm là journey layer |
| IA | 14 nav item / 5 nhóm + route hồ sơ dùng chung `/issue/:id` |
| Theme | Cam VNDIRECT trên nền xám ấm, hướng tiết chế. Cam chỉ dùng cho tương tác & định danh |
| Demo mode | Guided tour 6 màn, song song chế độ tự do |
| Route bỏ | `/legacy-overview` xóa · `/coverage` gộp vào Bản đồ · `/impact` tách vào 2 nơi |
| Fixture khách | 6–8 khách pseudonymized |

**Hai xung đột với quyết định trước, và cách xử lý:**

1. **Taxonomy.** Ngày 27/07 lúc đầu chốt *không* làm taxonomy workbench; Enterpret-làm-gốc kéo nó về. Giải pháp: lấy đúng phần Enterpret mở cho role Member — xem 5 tầng, xem rationale phân loại, sửa phân loại **ở mức từng record**, và hiện cảnh báo drift. **Không** làm workflow merge/split node (bên Enterpret đó là quyền role Editor). Đủ để thấy taxonomy sống, không phình thành module quản trị.

2. **AI Agents.** `output/enterpret-cxm-benchmark.html` xếp AI agents/MCP là **DEFER P2**, điều kiện *"mô phỏng read-only trước; write action luôn có approval gate"*. Cả 3 agent của Enterpret đều read-only — chúng phát hiện, cảnh báo, tổng hợp digest, không con nào ghi dữ liệu nghiệp vụ. Nên lấy cả 3 mà **không** vi phạm điều kiện cũ. MCP Server bị bỏ vì là integration.

---

## 5. Mô hình gốc — lấy gì từ Enterpret

### 5.1 Ba primitive lõi

| Primitive | Nội dung | Ghi chú prototype |
|---|---|---|
| **Feed** | Dòng tín hiệu thô theo thời gian. Filter theo taxonomy, Category, nguồn, segment, bước hành trình. Đọc verbatim đã masking. Toggle verbatim ↔ AI summary | Lưu được thành `SavedArtifact` |
| **Quantify** | Biến một filter thành chart volume/sentiment theo thời gian. Chart type: bar ngang xếp hạng, line theo kỳ, so sánh cohort | Lưu được, thêm vào Dashboard |
| **Dashboard** | Tập hợp Quantify. Share, Subscribe theo tần suất, có template dọn sẵn theo vai | Nút `Add` cho đúng 3 lựa chọn: `Saved Items` · `New Quantify` · `New Feed` |

### 5.2 Adaptive Taxonomy — 5 tầng

Enterpret dùng `L1/L2/L3 keyword` (product area → feature → sub-feature) + `Theme` + `Sub-theme`. Map sang chứng khoán:

| Tầng | Nghĩa | Ví dụ |
|---|---|---|
| L1 | Domain | Mở tài khoản · Dòng tiền · Giao dịch · Margin · Sản phẩm đầu tư · Chăm sóc & khiếu nại · Retention |
| L2 | Flow | eKYC · Ký hợp đồng điện tử |
| L3 | Bước / tính năng | Liveness & Face match · Chụp CCCD VNeID/NFC |
| Theme | **Vì sao** | Thiết bị không tương thích · Hướng dẫn lỗi không rõ |
| Sub-theme | Chi tiết của vì sao | Android tầm trung, ánh sáng yếu |

L1–L3 trả lời *cái gì*, Theme/Sub-theme trả lời *vì sao*. Đây là điểm mạnh thật của Enterpret và prototype hiện tại không có tầng nào tương đương.

Ba năng lực đi kèm, đều lấy: **explainable** (xem được rationale của từng phân loại) · **sửa ở mức record** kèm audit trail · **drift detection** (hiện cảnh báo khi có thuật ngữ mới hoặc node trùng nghĩa).

### 5.3 Category — phân loại theo intent

`Help · Improvement · Complaint · Praise` → **Cần hỗ trợ · Đề xuất cải thiện · Khiếu nại · Khen ngợi**.

Trực giao với taxonomy: một verbatim vừa có L1/L2/L3/Theme, vừa có đúng một Category. Rẻ để làm, tăng đáng kể khả năng phân tích — ví dụ *"Complaint về Liveness tăng 18% nhưng Help giảm"* nghĩa khác hẳn *"cả hai đều tăng"*.

### 5.4 Context Graph, Enrichment, Agent

**Context Graph** — Enterpret nối `user → account → opportunity → product → revenue`. Với retail brokerage, hình đúng là:

```
customer → account → order/transaction → case → journeyStep
```

Mục đích giống nhau: biến *"312 lượt fail"* thành *"312 lượt, tập trung ở khách Android mới mở tài khoản, trong đó 9 khách high-value"*.

**Data Enrichment** — sentiment, `Sentiment Shift`, normalized fields. Gắn lên `Evidence`.

**Agent** — cả 3, đều read-only:

| Agent | Việc | Bản của ta |
|---|---|---|
| Quality Monitor | Phát hiện volume tăng/giảm bất thường | Cảnh báo nguồn chết, volume lệch baseline |
| Escalation | Feedback cảm xúc mạnh từ khách chiến lược | Khách high-value có repeat contact |
| Newsfeed | Digest cá nhân hóa định kỳ | Bản tin tuần cho Head of CX |

**Wisdom Assistant** → `Trợ lý`. Không phải ô prompt trống mà là **chips câu hỏi sẵn**, đúng pattern Enterpret. Chips cho bối cảnh chứng khoán: *Điểm gãy cần chú ý · Nguyên nhân gốc · Theme đang xấu đi · Lý do khách rời · Khách nào bị ảnh hưởng · Tạo báo cáo*. Trả lời gồm câu kết luận + chart + bảng + **citation một click** về verbatim gốc.

### 5.5 Không lấy

| Hạng mục | Lý do |
|---|---|
| **Sales Intelligence** | Không áp dụng được. Graph của Enterpret giả định khách hàng là doanh nghiệp có tên và có deal/ARR. VNDIRECT là B2C retail brokerage với khách lẻ. Thay bằng `valueTier` trên `CustomerCase` |
| **MCP Server** | Là integration, không phải UI. Ngoài phạm vi prototype |
| **Merge/split taxonomy node** | Quyền role Editor bên Enterpret. Giữ prototype ở mức Member — xem + sửa record |
| **50+ connector** | Prototype có 6–8 nguồn thật ở VN là đủ để review IA |

---

## 6. Tám bổ sung của VNDIRECT lên trên Enterpret

Đây là phần trả lời câu *"vì sao không mua Enterpret luôn"*.

| # | Bổ sung | Enterpret có? | Vì sao cần |
|---|---|---|---|
| 1 | **Journey layer** — Atlas, `stationId`, observation theo bước | Không. Họ hỏi "khách nói gì về feature nào" | Câu hỏi của CTCK là "khách kẹt ở **bước nào** trong hành trình nào". Đây là differentiation lớn nhất |
| 2 | **Thiết kế & vận hành khảo sát** — trigger, điều kiện, cooldown, mục tiêu | Không. Họ chỉ *thu* khảo sát | `template/tracking-plan-cx-mau.xlsx` sheet 4 đã thiết kế xong 6 khảo sát. Ai vận hành chúng? |
| 3 | **Data coverage & instrumentation gap** | Không. Họ giả định dữ liệu đã về | Nhiều bước của VNDIRECT chưa instrument. Phải phân biệt "ổn" với "chưa đo được" |
| 4 | **Metric contract** — grain, formula, source, freshness, owner | Không lộ ra UI | Nhiều phòng ban dùng chung số; không có contract thì tranh luận vô tận |
| 5 | **Approval gate trước hành động chạm khách** | Họ route sang Jira, không có gate | Ngành chứng khoán: mọi communication tới khách cần người duyệt |
| 6 | **Outcome proof có confounder + verdict `inconclusive`** | Đo pre/post nhưng không lộ confounder | Không được trình bày correlation như causality khi cùng kỳ có release khác hoặc thị trường biến động |
| 7 | **Masking rule hiện trong UI** | Có PII scrubbing ở backend, không hiện | Quy tắc sheet 1C là yêu cầu pháp chế, reviewer phải thấy nó được tuân thủ |
| 8 | **Regulatory risk trong breakdown ưu tiên** | Không | Một lỗi eKYC có rủi ro pháp lý khác một lỗi UI, dù cùng số khách bị ảnh hưởng |

---

## 7. Kiến trúc dữ liệu

### 7.1 Vấn đề đang phải sửa

Prototype hiện có **ba mô hình hành trình song song**:

- `data/cxm.ts` — `Phase p1..p7 → Flow → Stage → Touchpoint → Event → KPI`
- `lib/journey-taxonomy.ts` — 6 phase lifecycle, nối bằng `customerPhaseForLegacyId()`: chuỗi ternary + 2 `Set` touchpoint hardcode
- `data/onboarding-pilot.ts` — journey thứ ba với step `ob-*`

Bước "Liveness" tồn tại 3 lần: `tp-liveness`, `ob-face`, thuộc `p2`. Đây là lý do filter phase toàn cục phải tắt trên route mặc định.

Và **chuỗi Issue → Action bị đứt**: trong 6 issue của Issue Register chỉ `CXI-024 → CXM-142` resolve được. `CXI-019 → CXM-135` và `CXI-026 → CXM-147` không tồn tại. `CXI-021/017/013 → CXA-*` chỉ có trong fixture pilot, Action Register không thấy.

### 7.2 Trục canonical

```
SignalSource → Evidence → TaxonomyNode + Category → VoiceInsight
                  ↓
             JourneyStep → Observation → Issue → Action → Outcome
                  ↓                                  ↓
             CustomerCase                        CloseLoop
```

Một fixture duy nhất thay cho 4 file hiện tại. Xóa `customerPhaseForLegacyId()`.

### 7.3 Entity

Kiểu ghi dưới đây là hợp đồng fixture cho UI, **không phải** API contract hay thiết kế backend.

**Cấu trúc hành trình**

```ts
JourneyPhase   { id, code, name, order }
JourneyGroup   { id, phaseId, name, description }
JourneyFlow    { id, groupId, name, owner, version,
                 provenance: { sourceDoc, diagramRef, verified: boolean } }
JourneyStep    { id, flowId, code, name, stationId, owner, order }
Touchpoint     { id, stepId, name, channel, description, owner, dailyUsers, revenueImpact }
Signal         { id, touchpointId, name, description,
                 status: 'live'|'validating'|'designed'|'gap',
                 platforms[], eventSource: 'client'|'server', volumePerDay, lastSeen?, kpiIds[] }
```

`stationId` là `journey_station_id` trong tracking plan — khóa nối bắt buộc giữa prototype và tracking plan thật. Mọi step phải có, và duy nhất.

**Taxonomy & Category** (mới, gốc Enterpret)

```ts
TaxonomyNode { id, level: 'L1'|'L2'|'L3'|'theme'|'subtheme', parentId?, name,
               recordCount, rationale, driftFlag?: 'new-term'|'duplicate'|'shifting',
               updatedAt, updatedBy }
Category = 'help' | 'improvement' | 'complaint' | 'praise'
```

**Đo lường**

```ts
Metric       { id, name, grain, formula, source, freshness, owner, value, target }
Observation  { id, stepId, periodId, entered, completed, failed, effortIndex, evidenceCoverage }
```

**Thu thập tín hiệu**

```ts
SignalSource  { id, name, kind: 'event'|'survey'|'case'|'store-review'|'broker-note'|'chat',
                volume, freshness, health: 'ok'|'stale'|'down', lastReceivedAt, note,
                contributesToMetricIds[] }
SurveyProgram { id, name, type: 'CES'|'CSAT'|'NPS'|'micro',
                triggerSignalId, displayCondition, cooldownDays, scale, target,
                responseRate, sampleSize, latestScore, status: 'running'|'paused' }
```

`SurveyProgram` lấy nguyên sheet 4 tracking plan: CES sau mở TK (≥4.2), CSAT nạp tiền lần đầu (≥4.3), CSAT sau phiên CS + FCR, khảo sát bỏ dở eKYC (chỉ hỏi khi mở lại app trong 7 ngày), in-app review có điều kiện, NPS quý mẫu 10% khách active. `cooldownDays` mặc định 14 theo quy tắc cooldown toàn cục.

`contributesToMetricIds[]` để màn Nguồn trả lời được *"nguồn này chết thì số nào sai"*.

**Evidence & Insight**

```ts
Evidence     { id, kind: 'verbatim'|'event'|'case'|'survey-response',
               sourceId, sourceRef, occurredAt, maskedQuote, signal, customerKey, stepId,
               taxonomyNodeIds[], category: Category,
               enrichment: { sentiment, sentimentShift, normalizedFields },
               classificationRationale, issueIds[], insightIds[] }
VoiceInsight { id, themeNodeId, stepId?, sourceIds[], responses, positiveShare,
               trend, trendPoints[], segments[], evidenceRefs[], recommendation,
               handoff: { eligible: boolean, reason, issueId? } }
```

`handoff.eligible` chỉ true khi insight có đủ ba thứ: journey impact (có `stepId`), affected scope (`responses` và `segments`), và owner. Đây là quy tắc trong `docs/CXM-DOMAIN-ROADMAP.md`, nay kiểm bằng code thay vì hardcode một link.

**Điểm gãy và xử lý**

```ts
Issue   { id, title, stepId, metricId, insightId?, evidenceRefs[], actionId,
          severity, status, confidence, hypothesis, decision,
          priority: { severity, affectedUnique, journeyCriticality,
                      repeatContact, trend, regulatoryRisk, total },
          impact: { affectedCustomers, repeatContactRate, csatImpact,
                    churnRiskCustomers, highValueCustomers },
          affectedCustomerKeys[] }
Action  { id, issueId, title, owner, accountable, dueAt,
          approval: 'pending'|'approved',
          delivery: 'backlog'|'in-progress'|'released', releaseMarker?,
          successMetricId,
          impactValidation: 'not-started'|'monitoring'|'validated',
          loopClosure: 'blocked'|'ready'|'closed' }
```

`priority` là **object có breakdown**, không phải một số cứng như `priorityScore` hiện tại. Màn Sức khỏe hành trình phải trả lời được "vì sao issue này xếp trên", và một con số 94 không trả lời được. `regulatoryRisk` là thành phần đặc thù chứng khoán.

**Kết quả**

```ts
Outcome   { actionId,
            baseline: { value, period, sampleSize },
            post:     { value, period, sampleSize },
            cohort, observationWindow, confounders[],
            verdict: 'improved'|'no-change'|'worse'|'inconclusive' }
CloseLoop { issueId, customersToContact, contacted, channel, approvedBy, postSentiment }
```

`verdict` có bậc `inconclusive` là bắt buộc. Prototype hiện tại chỉ có một con số quan sát và một nhãn `validated`, tức mặc định mọi thay đổi đều có tác dụng.

**Khách hàng — Context Graph**

```ts
CustomerCase  { key, segment, valueTier, accountRef, currentState, timeline: TimelineEntry[] }
TimelineEntry { at, kind: 'event'|'case'|'survey'|'verbatim'|'action-notice',
                label, stepId?, ref, outcome? }
```

`key` dạng `KH•••7A2`. Tuân thủ masking rule sheet 1C: không tên, CCCD, SĐT, email; số tiền chỉ `amount_bucket`; ảnh eKYC chỉ log kết quả + `fail_reason`.

**Artifact do người dùng tạo** (mới, gốc Enterpret)

```ts
SavedArtifact { id, kind: 'feed'|'quantify'|'dashboard', name, ownerRole,
                filters, chartType?, childIds?: string[],
                subscription?: { frequency: 'daily'|'weekly'|'monthly', channel },
                shared: boolean, isTemplate: boolean }
Agent         { id, kind: 'quality-monitor'|'escalation'|'newsfeed', name,
                status: 'on'|'off', lastFiredAt, findings: AgentFinding[] }
AgentFinding  { id, agentId, severity, title, detail, evidenceRefs[], acknowledged }
```

`isTemplate: true` cho các Dashboard dọn sẵn theo vai — đây là cơ chế để Head of CX không phải tự soạn Quantify.

### 7.4 Quy tắc toàn vẹn

Mở rộng `validateOnboardingPilot()` thành `validateFixture()` chạy trên toàn bộ dữ liệu. Lỗi hiện thành banner trong UI theo pattern đang có ở `CXControlTower.tsx:159`.

1. Không có ID trùng trên toàn bộ collection.
2. `Issue.stepId` ∈ steps · `Issue.metricId` ∈ metrics · `Issue.actionId` ∈ actions và `action.issueId === issue.id`.
3. Mỗi `Issue.evidenceRefs[]` tồn tại và `evidence.stepId === issue.stepId`.
4. `Action.successMetricId` ∈ metrics. Thứ tự trạng thái: không delivery trước approval, không validation trước release, không outcome trước release, không close-loop trước validation.
5. `VoiceInsight.handoff.issueId` nếu có thì phải ∈ issues. Nếu `handoff.eligible === false` thì không được có `issueId`.
6. `Evidence.sourceId` ∈ sources · `SurveyProgram.triggerSignalId` ∈ signals · `SignalSource.contributesToMetricIds[]` ⊂ metrics.
7. `Issue.affectedCustomerKeys[]` ⊂ customers.
8. Mọi `JourneyStep.stationId` tồn tại và duy nhất.
9. Signal thuộc các flow trong Money Journey (nạp, rút, chuyển tiền, đối soát) phải có `eventSource: 'server'` — quy tắc "event tiền bạc lấy server làm nguồn sự thật". Pilot onboarding không có signal loại này, nhưng rule cần có sẵn vì bản đồ hiển thị cả Money Journey.
10. `priority.total` phải khớp kết quả tính từ các thành phần trong cùng object, không được là số rời nhập tay.
11. **Taxonomy:** mọi `Evidence.taxonomyNodeIds[]` ⊂ taxonomy. Bắt buộc có **đúng một** node ở mỗi tầng `L1`, `L2`, `theme`. Tầng `L3` và `subtheme` là **tùy chọn** — nếu có thì tối đa một node mỗi tầng, và parent của nó phải nằm trong cùng `taxonomyNodeIds[]`. `TaxonomyNode.parentId` phải trỏ tới node ở tầng ngay trên (`L2`→`L1`, `L3`→`L2`, `subtheme`→`theme`; `theme` có `parentId` rỗng vì theme trực giao với nhánh keyword).
12. **Artifact:** `SavedArtifact.childIds[]` chỉ hợp lệ khi `kind === 'dashboard'` và mọi child có `kind === 'quantify'`.
13. **Agent:** mọi `AgentFinding.evidenceRefs[]` ⊂ evidence.

---

## 8. Information Architecture

14 nav item, 5 nhóm, cộng route hồ sơ dùng chung `/issue/:id`.
*(Bản 27/07 viết "13 nav item" trong khi app dựng 14 — đã sửa lại cho khớp code.)*

```
KHÁM PHÁ                      ← gốc Enterpret, artifact primitives
  /feed                Feed                  tín hiệu thô · filter · Category · verbatim
  /quantify            Quantify              filter → chart · lưu lại
  /dashboard           Dashboard             tập Quantify · share · subscribe · template
  /assistant           Trợ lý                prompt chips · trả lời có citation

HÀNH TRÌNH                    ← lớp của VNDIRECT, Enterpret không có
  /atlas               Bản đồ hành trình     7 phase · coverage · stationId
  /health              Sức khỏe hành trình   funnel pilot · friction queue có breakdown

XỬ LÝ
  /issues              Điểm gãy              issue register
  /actions             Hành động             approval gate · owner · release marker
  /outcomes            Kết quả               outcome proof · close the loop

NỀN DỮ LIỆU
  /sources             Nguồn tín hiệu        source health · freshness · ảnh hưởng metric
  /surveys             Khảo sát              survey program        ← lớp của VNDIRECT
  /taxonomy            Taxonomy              5 tầng · explainable · sửa mức record
  /agents              Agent & cảnh báo      3 agent read-only

QUẢN TRỊ                      ← bổ sung 28/07, xem §9.16
  /rules               Chỉ số & ngưỡng       chọn chỉ số theo dõi · đặt band trạng thái

  /issue/:id           Hồ sơ điểm gãy        deep-link từ mọi nơi
```

**Sửa đổi 28/07/2026:** nhóm `TRA CỨU` với `/customers` và `/customers/:key` **đã bỏ**. Tra cứu hồ sơ và
timeline từng khách thuộc CRM / Customer 360; dựng lại trong CXM là tạo hệ thống tra cứu thứ hai. Phần
còn cần cho khép vòng — *ai bị ảnh hưởng, đã liên hệ chưa* — nằm ở tab **Cohort ảnh hưởng** trong
`/issue/:id`, dạng bảng không bấm sâu được. Số nav item giữ nguyên 14 vì `/rules` thay chỗ `/customers`.

### 8.1 Bảng chuyển đổi từ route cũ

| Route cũ | Đi đâu |
|---|---|
| `/` Control Tower | Tách: journey health + friction → `/health`; approval loop → `/actions`; outcome → `/outcomes` |
| `/issues` Issue Register | `/issues` (danh sách) + `/issue/:id` (hồ sơ) |
| `/board` Action Register | `/actions` |
| `/voice` Voice Insights | Tách: theme explorer → `/quantify` + `/taxonomy`; verbatim → `/feed`; nguồn → `/sources` |
| `/journey` | `/atlas` |
| `/coverage` | Gộp vào tab **Độ phủ dữ liệu** của step inspector ở `/atlas` |
| `/impact` | Ảnh hưởng của issue → tab trong `/issue/:id`. Khối blast radius cấu trúc **đã bỏ 28/07** — xem §9.5 |
| `/legacy-overview` | Xóa |

Route mặc định `/` redirect sang `/dashboard` với Dashboard template của vai đang chọn.

### 8.2 Ranh giới quyết định

Bốn chặng của vòng xử lý mỗi chặng sở hữu **danh sách** và **quyết định** tương ứng:

- `/feed` `/quantify` `/taxonomy` — phát hiện. Kết thúc ở: *insight này có thành issue không*
- `/health` — xếp ưu tiên. Kết thúc ở: *xử lý cái nào trước*
- `/actions` — điều phối. Kết thúc ở: *duyệt và release*
- `/outcomes` — đánh giá. Kết thúc ở: *khép vòng hay mở lại*

`/atlas`, `/sources` và `/issue/:id` không sở hữu danh sách quyết định nào — chúng là tra cứu.

`/rules` là ngoại lệ: nó không thuộc vòng xử lý mà **định nghĩa luật chơi của vòng đó**. Quyết định nó
sở hữu là *thế nào thì gọi là cần theo dõi, thế nào là cần xử lý ngay* — quyết định này phải nằm ngoài
bốn chặng trên, nếu không mỗi màn lại tự đặt ngưỡng cho mình.

---

## 9. Đặc tả màn

Mọi màn theo cùng khuôn 4 tầng (§10.4). Dưới đây chỉ ghi phần đặc thù.

### 9.1 `/feed`

Dòng `Evidence` theo thời gian giảm dần. Mỗi dòng: nguồn, thời điểm, Category badge, taxonomy path (L1 › L2 › theme), verbatim 14px, customerKey, sentiment.

Filter panel bên trái: khoảng thời gian, nguồn, Category, taxonomy node, bước hành trình, segment, valueTier.

Hai chức năng lấy nguyên Enterpret: toggle **verbatim ↔ AI summary**, và nút **lưu thành Saved Item**. Mỗi dòng có link "vì sao phân loại thế này" mở `classificationRationale`.

### 9.2 `/quantify`

Chọn filter → ra chart. Ba loại chart: bar ngang xếp hạng theme, line volume/sentiment theo kỳ, so sánh 2 cohort cạnh nhau.

Chart header **bắt buộc** theo pattern Enterpret: `X of Y <đơn vị>` và kỳ có ngày tuyệt đối. Ví dụ: `10 of 68 theme · 01/04/2026 – 04/07/2026`. Xem §10.3.

Nút lưu → `SavedArtifact` kind `quantify`, thêm được vào Dashboard.

**Tổ hợp filter được hỗ trợ — đúng 8 tổ hợp, không phải query engine tự do.** Đây là danh sách đóng; §12.9 giải thích lý do. UI hiện chúng dưới dạng lựa chọn, không phải ô nhập tự do:

| # | Chiều phân tích | Chart |
|---|---|---|
| 1 | Volume theo `theme`, toàn bộ nguồn | Bar ngang xếp hạng |
| 2 | Volume theo `L1` domain | Bar ngang xếp hạng |
| 3 | Volume theo `Category` (Cần hỗ trợ / Đề xuất / Khiếu nại / Khen ngợi) | Bar ngang |
| 4 | Volume theo `SignalSource` | Bar ngang |
| 5 | Volume + sentiment theo kỳ, lọc một `theme` | Line |
| 6 | Volume + sentiment theo kỳ, lọc một `JourneyStep` | Line |
| 7 | **So sánh cohort `platform`** — Android vs iOS, một `theme` | Hai line cạnh nhau |
| 8 | **So sánh cohort `valueTier`** — high-value vs còn lại, một `theme` | Hai line cạnh nhau |

Tổ hợp #7 là tổ hợp dùng trong tour scene 3 và trong tiêu chí §13 bước 3.

### 9.3 `/dashboard`

Grid các Quantify. Nút `Add` cho đúng 3 lựa chọn: `Saved Items` · `New Quantify` · `New Feed`.

`Share` → chọn kênh (mô phỏng Slack/Email). `Subscribe` → tần suất daily/weekly/monthly.

**Template dọn sẵn theo vai** — đây là cơ chế để Head of CX không phải tự soạn gì:

- *Bảng điều hành CX* — điểm gãy theo ưu tiên, repeat contact, churn exposure, action chờ duyệt, verdict outcome gần nhất
- *Sức khỏe pilot Mở tài khoản* — funnel 6 bước, evidence coverage, CES
- *Theme đang xấu đi* — cho VoC Analyst

### 9.4 `/assistant`

Prompt chips thay ô trống, đúng pattern Enterpret. Chips: *Điểm gãy cần chú ý · Nguyên nhân gốc · Theme đang xấu đi · Lý do khách rời · Khách nào bị ảnh hưởng · Tạo báo cáo*.

Trả lời gồm: câu kết luận + chart + bảng + citation một click về verbatim gốc.

**Yêu cầu về tính trung thực:** đây là câu trả lời **có kịch bản**, không phải AI thật. Nhãn phải ghi rõ *"Câu trả lời demo theo kịch bản"* — không dùng nhãn kiểu "AI answer · grounded" như `VoiceOfCustomer.tsx:30` hiện tại, vì đó là tuyên bố sai. Người xem demo được biết đúng những gì họ đang xem.

### 9.5 `/atlas` Bản đồ hành trình — *viết lại 28/07/2026*

Bản ba cột trước đó có hai vấn đề thật, do owner chỉ ra khi dùng:

1. Catalog dọc chứa cả 20 flow trong một khung `max-height:78vh; overflow:auto` — muốn tới flow ở phase 05 phải cuộn qua toàn bộ phase 01–04.
2. Chuỗi bước là danh sách dọc, nên **tương quan giữa các bước không nhìn thấy được**. Đọc từng dòng thì biết mỗi bước mất bao nhiêu người, nhưng không thấy dòng khách teo dần dọc hành trình.

**Điều hướng ba nhịp ngang** thay cho ba cột:

1. **Rail 7 phase** — một hàng, 7 ô bằng nhau. Mỗi ô: mã phase, tên, một chấm cho mỗi flow (cam = có dữ liệu quan sát, xám = có sơ đồ nguồn chưa đo, nhạt = chờ nguồn), tổng số flow. Không cuộn.
2. **Chip flow của phase đang chọn** — nhóm theo `JourneyGroup`, tối đa 4 chip mỗi phase nên luôn thấy hết. Chọn phase thì tự nhảy sang flow đầu tiên của phase đó; nếu không, rail và phần bên dưới đang nói về hai chỗ khác nhau.
3. **Xương sống bước** — các bước xếp ngang, giữa hai bước là **dải nối**:
   - bề dày dải xám = số khách còn đi tiếp, chia theo `entered` của bước đầu flow;
   - vạch đỏ gạch chéo tách xuống dưới = phần rơi tại bước bên trái;
   - nhãn `−X%` (theo số vào bước đó) cộng số khách rơi tuyệt đối;
   - `title` bổ sung thông tin thứ ba mà nhãn không đủ chỗ: phần rơi này chiếm bao nhiêu **tổng số rơi của cả flow**.

   Khung dải cao **cố định** bằng 100% thang; chỉ phần tô bên trong thay đổi. Để khung co theo dữ liệu thì mọi nhãn `−X%` lệch cao độ nhau và trông như lỗi trình bày chứ không như một cái phễu.

   Dưới xương sống là một câu tự tính: *bao nhiêu vào bước đầu → bao nhiêu hoàn tất bước cuối → mất bao nhiêu → bước nào chiếm phần lớn nhất trong số rơi đó*. Đây là câu trả lời cho "tương quan", ở dạng chữ, cho người không đọc được biểu đồ.

**Step inspector** nằm bên dưới, mở theo bước đang chọn, chia **3 tab** thay cho một cột dọc dài:

| Tab | Trả lời |
|---|---|
| Touchpoint & signal | Đang đo cái gì, ở đâu, trên platform nào |
| Chỉ số liên kết | Bước này ảnh hưởng chỉ số nào, band ngưỡng đang áp là gì (đọc từ `/rules`) |
| Độ phủ dữ liệu | Có đủ bằng chứng để giải thích thất bại hay không |

Trên phần tab là khối **"Vì sao gắn nhãn ..."** — liệt kê đúng những tiêu chí đã vượt ngưỡng, ví dụ *thất bại 16,7% ≥ ngưỡng xử lý 15% · evidence coverage 64% dưới ngưỡng 70% · effort 2,4 vượt 2 lần thử*. Tô màu mà không nói được vì sao thì người đọc không kiểm tra được.

Khối **"Ảnh hưởng nếu thay đổi bước này"** (blast radius) **đã bỏ**. Lý do: nó trả lời một câu hỏi thuộc pha thiết kế thay đổi, trong khi màn này dùng để quan sát; và phần duy nhất còn giá trị vận hành — *signal nào chưa instrument* — đã nằm đúng chỗ hơn ở tab Độ phủ dữ liệu.

Đây vẫn là nơi `/coverage` sống — độ phủ dữ liệu là thuộc tính của step, không phải một màn riêng.

**Về bất đối xứng phạm vi:** bản đồ có 7 phase, vòng xử lý chỉ chạy sâu trên pilot. Đây là chủ ý. Mọi flow ngoài pilot phải có badge *"Chưa có dữ liệu quan sát"* kèm đúng các bước cần làm để đo được, thay vì để trống — nếu không người xem tưởng dữ liệu bị mất.

### 9.6 `/health` Sức khỏe hành trình

**Funnel 6 bước pilot.** Mỗi bước: entered / completed / failed / effort / evidence coverage, tô theo 4 trạng thái §10.2. Bước "chưa đo được" phải nhìn khác bước "đang ổn".

**Friction queue** xếp theo `priority.total`, mỗi dòng **mở được breakdown**: severity, affected unique, journey criticality, repeat contact, trend, regulatory risk. Người đọc phải kiểm tra được vì sao issue này xếp trên.

### 9.7 `/issues` Điểm gãy

Bảng toàn bộ issue với filter theo taxonomy, bước, severity, trạng thái, owner. Cột: ID, tiêu đề, bước, severity, affected unique, repeat contact, churn exposure, priority, trạng thái, owner, loop status.

Bấm một dòng → `/issue/:id`.

### 9.8 `/actions` Hành động

Nhóm theo trạng thái: chờ duyệt → đang làm → đã release. Mỗi action: owner, accountable, hạn, metric thành công, issue nguồn.

Giữ nguyên approval gate và chuỗi trạng thái của `CXControlTower.tsx` — logic tốt nhất trong prototype hiện tại. Giữ cả cách ghi actor trên CTA ("Người phụ trách quyết định", "Owner cập nhật trạng thái", "Hệ thống mô phỏng").

### 9.9 `/outcomes` Kết quả

**Outcome trước/sau** cho mỗi action đã release: baseline → post, release marker trên trục thời gian, cohort, cửa sổ quan sát, confounder, `verdict`.

Bắt buộc: khi `confounders[]` không rỗng, UI hiện cảnh báo và **không** cho `verdict: 'improved'` mà không có ghi chú người kết luận. Không trình bày correlation như causality.

**Close-the-loop** — số khách cần thông báo, đã thông báo, kênh, ai duyệt nội dung, sentiment sau đó.

### 9.10 `/sources` Nguồn tín hiệu

Bảng `SignalSource`: tên, loại, volume kỳ, độ tươi, health, lần nhận cuối. Nguồn `stale`/`down` đẩy lên đầu.

Cột **"ảnh hưởng metric nào"** từ `contributesToMetricIds[]` — trả lời *"nguồn này chết thì số nào sai"*. Enterpret có connector health nhưng không nối tới metric; đây là chỗ ta chi tiết hơn.

### 9.11 `/surveys` Khảo sát

Bảng `SurveyProgram`: tên, loại, trigger event, điều kiện hiển thị, cooldown, thang đo, response rate, điểm mới nhất so mục tiêu, trạng thái.

Màn hoàn toàn mới. Enterpret *thu* khảo sát nhưng không thiết kế/vận hành chúng — đây là bổ sung #2 ở §6.

### 9.12 `/taxonomy`

Cây 5 tầng: L1 › L2 › L3 › Theme › Sub-theme. Mỗi node: tên, `recordCount`, cập nhật lần cuối, ai cập nhật.

Ba năng lực: xem **rationale** của node · **cảnh báo drift** (`new-term`, `duplicate`, `shifting`) hiện thành danh sách đề xuất chưa xử lý · từ một record trong Feed **sửa được phân loại** kèm ghi audit.

Không có merge/split node — xem §4.

### 9.13 `/agents` Agent & cảnh báo

Ba agent read-only với trạng thái on/off và danh sách `AgentFinding` chưa acknowledge. Mỗi finding: severity, tiêu đề, chi tiết, evidence liên quan, nút acknowledge.

### 9.14 ~~`/customers` và `/customers/:key`~~ — *đã bỏ 28/07/2026*

Hai route này **không còn**. Owner chốt: tra cứu hồ sơ và timeline từng khách là việc của CRM /
Customer 360, và CXM dựng lại thì thành hệ thống tra cứu thứ hai cho cùng một dữ liệu — với đủ rủi ro
quyền truy cập và masking đi kèm, mà không thêm quyết định nào cho đội CX.

Phần **thực sự cần** cho close-the-loop là *ai bị ảnh hưởng* và *đã liên hệ chưa*. Nó ở tab
**Cohort ảnh hưởng** của `/issue/:id`: 3 số neo (số khách trong cohort mẫu trên tổng bị ảnh hưởng ·
số khách high-value cần ưu tiên · số cần liên hệ so với đã liên hệ) cộng một bảng
`key · segment · valueTier · platform · trạng thái hiện tại`, **không bấm sâu được**.

Fixture `DATA.cust` thu lại còn đúng 5 field trên. `TimelineEntry`, `accountRef` và mảng `tl` đã xóa vì
không còn nơi nào đọc — giữ dữ liệu chết trong một file được sửa bằng tay là mời người sau nhầm.

Điều này **không** làm mất năng lực nào của vòng xử lý: chuỗi *3 lần liveness fail → gọi hotline → bỏ dở
→ 2 ngày sau trả lời CES 2/5* vẫn kể được, nhưng kể ở nơi nó tạo ra quyết định — trong `evidence[]` của
`/issue/:id` và trong `/feed`, chứ không phải trên một trục thời gian của một khách riêng lẻ.

### 9.15 `/issue/:id` Hồ sơ điểm gãy

Năm tab:

| Tab | Nội dung |
|---|---|
| Bằng chứng | `evidenceRefs[]` đã masking: nguồn, sourceRef, thời điểm, Category, taxonomy path, verbatim 14px, customerKey |
| Ảnh hưởng | `impact` + breakdown `priority` + insight nguồn nếu có |
| Cohort ảnh hưởng | `affectedCustomerKeys[]` dạng bảng, **không bấm sâu** — xem §9.14 |
| Xử lý | `Action` đầy đủ trạng thái, **CTA thao tác được tại chỗ** |
| Kết quả | `Outcome` + `CloseLoop` đầy đủ trạng thái, **CTA thao tác được tại chỗ** |

**Về "không sở hữu quyết định":** ranh giới ở §8.2 là về *quyền sở hữu danh sách*, không phải về việc chặn nút bấm.

- `/actions` và `/outcomes` sở hữu **danh sách** — nơi duy nhất liệt kê toàn bộ action/outcome, nơi PO mở để xem việc của mình.
- `/issue/:id` **không** liệt kê gì, chỉ hiển thị đúng một action của đúng một issue — nhưng CTA ở đó **phải bấm được**.

Lý do bắt buộc: thứ tốt nhất trong prototype hiện tại là `CXControlTower.tsx` đặt evidence disclosure và nút `primaryAction` trong cùng một màn (`CXControlTower.tsx:180-199`). Người ra quyết định đọc bằng chứng rồi duyệt ngay. Nếu bắt họ đọc 5 tab rồi nhảy sang `/actions` tìm lại action, ta phá đúng điểm mạnh đó — và §9.8 đã hứa giữ nguyên nó.

**Triển khai:** tab Xử lý và Kết quả render **cùng component và cùng state** với `/actions` và `/outcomes`, không nhân bản logic. Một nguồn state, hai nơi hiển thị. Đây cũng là cách chặn việc trạng thái lệch giữa hai route như lỗi hiện tại giữa Control Tower và Issue Register.

### 9.16 `/rules` Chỉ số & ngưỡng — *bổ sung 28/07/2026*

**Vấn đề nó giải quyết.** Trước đó ngưỡng đánh giá nằm rải rác ba chỗ và không chỗ nào sửa được: field
`state` hardcode trong từng record fixture (`obs[].state`, `metrics[].state`, `sources[].health`); số
literal trong code (`o.cov < 70`, `i.imp.rep > 20`, `i.imp.churn > 50`); và **số viết thẳng vào câu văn**
("Bước 03 và 05 có evidence coverage dưới 70%", "vượt ngưỡng 6 giờ", "tối đa 1 khảo sát trong 14 ngày").
Chỗ thứ ba là tệ nhất: đổi ngưỡng thì câu văn nói sai mà không có gì báo.

Đây là pattern **Knowledge Manager** của Enterpret áp vào ngưỡng: một surface sở hữu định nghĩa, mọi màn
khác đọc lại.

**Trạng thái phải được SUY RA.** Ba hàm là chỗ duy nhất quyết định trạng thái:

| Hàm | Tiêu chí | Cấu hình |
|---|---|---|
| `stepState(o)` | `failed ÷ entered`, cộng OR: `cov < covMin` hoặc `effort > effortMax` → ít nhất *Cần theo dõi* | `CFG.step` |
| `metricState(m)` | so giá trị với **band riêng của metric**; hướng lấy từ dấu `≥`/`≤` trong `target` | `CFG.metric[id]` |
| `sourceHealth(s)` | `lagH` so với **SLA riêng của nguồn**; im lặng ≥ `deadDays` → *Ngừng gửi* | `CFG.source[id]` |

Cộng `stepWhy(o)` trả về đúng những tiêu chí đã vượt, để UI giải thích được nhãn chứ không chỉ tô màu.

**Vì sao band phải riêng từng metric, không dùng một ngưỡng chung.** Đây là điểm dễ làm sai nhất:

| Metric | Giá trị | Mục tiêu | Cách xa mục tiêu | Trạng thái đúng |
|---|---|---|---|---|
| `m-liveness` | 83,3% | ≥ 90% | 7,4% | **Cần xử lý ngay** |
| `m-ocr` | 71,0% | ≥ 90% | 21,1% | Cần theo dõi |

`m-ocr` xa mục tiêu gấp 3 lần nhưng nhẹ hơn. Không phải lỗi dữ liệu: liveness là metric **chạm khách**,
evidence coverage là metric **chất lượng dữ liệu** với đường chạy dài hơn. Bất kỳ ngưỡng chung nào cũng
đảo ngược đúng hai metric này. Band mặc định đặt sao cho tái tạo chính xác trạng thái cũ.

**Sáu mục của màn:**

1. **Ngưỡng trạng thái của một bước** — `failWatch` `failCrit` `covMin` `effortMax`, kèm preview 6 bước pilot với lý do từng nhãn, cập nhật ngay khi sửa.
2. **Chỉ số đang theo dõi** — bảng metric: công tắc *theo dõi*, giá trị, mục tiêu, hai ô band, trạng thái suy ra, metric contract đầy đủ. Tắt công tắc thì vẫn tính và hiện số nhưng không gắn nhãn và không vào cảnh báo — trạng thái `unknown`, nhãn *"Không theo dõi"*.
3. **SLA độ tươi từng nguồn** — mỗi nguồn một ô giờ, cộng cột *chỉ số bị ảnh hưởng nếu nguồn sai*.
4. **Ngưỡng nền dữ liệu và cảnh báo** — `deadDays` `anomalyX` `cooldown` `repeatMin` `repeatWarn` `churnWarn`.
5. **Bản tin định kỳ và kênh nhận** — tần suất và kênh cho từng Dashboard template. Đây là pattern alert/subscription của Enterpret.
6. **Mô hình xếp ưu tiên điểm gãy** — **chỉ đọc**, xem ràng buộc bên dưới.

**Ràng buộc bắt buộc:**

- **Trọng số ưu tiên không được cho sửa** nếu chưa tính lại `priority.total`. `validateFixture()` khẳng định `sev+aff+jc+rep+tr+reg === total`; cho sửa trọng số mà bỏ qua điều này thì banner đỏ bắn trên mọi màn. Và đó không phải thứ owner yêu cầu — yêu cầu là *band trạng thái*, không phải số học ưu tiên. Trọng số là quyết định của CX Council, không phải cấu hình vận hành hằng ngày.
- **Ngưỡng đặt ngược nhau không dùng banner đỏ toàn app.** Banner đỏ dành cho fixture đứt liên kết. Ngưỡng ngược là lựa chọn hợp lệ về mặt dữ liệu nhưng vô nghĩa về mặt nghiệp vụ, nên `cfgIssues()` cảnh báo **ngay trong màn cấu hình**, và app vẫn chạy.
- **Ghi bằng `onchange`, không phải `oninput`.** App render lại bằng `innerHTML`; nếu render mỗi lần gõ một ký tự thì ô nhập mất focus giữa lúc đang gõ.
- **Nhập rác thì bỏ qua và vẽ lại giá trị cũ**, không ghi `NaN` vào `CFG`.
- **Không persist**, vì không có backend. Trạng thái "đang dùng ngưỡng đã sửa / đang dùng mặc định" phải hiện rõ trên UI cùng nút **Trả về mặc định** — nói dối về persistence là mất tin cậy ngay lần refresh đầu.

**Nơi khác phải đọc lại từ CFG,** nếu không màn này chỉ là mockup: funnel `/health` và câu văn về coverage · nhãn trạng thái và tab Chỉ số của step inspector `/atlas` · cột trạng thái và SLA của `/sources` · câu cooldown ở `/surveys` · dải *"Ngưỡng agent đang áp dụng"* ở `/agents` · ngưỡng tô đỏ repeat/churn và dòng *Ngưỡng đang áp* ở `/issue/:id` · chip bản tin ở `/dashboard`.

---

## 10. Design system

### 10.1 Thang chữ

Hiện có **198 lần** dùng dưới 11px trong `pages/` và `components/`: 112× `text-[10px]`, 80× `text-[9px]`, 6× `text-[8px]`. 10px ≈ 7.5pt, không đọc được ở khoảng cách họp. Nội dung quan trọng nhất — verbatim của khách — đang ở 10px.

Thang mới, 7 bậc, sàn 12px:

| Cỡ | Weight | Dùng cho |
|---|---|---|
| 12px | 600, uppercase, tracking .06em, **monospace** | Nhãn section, đơn vị, denominator |
| 13px | 400 | Meta, mô tả phụ, timestamp |
| 14px | 400 | Nội dung chính, **verbatim, evidence** |
| 15px | 600 | Tiêu đề item, tên issue |
| 18px | 650 | Tiêu đề khối |
| 24px | 700, tabular-nums | Số liệu neo |
| 34px | 700, tracking −.02em | Câu kết luận |

Nhãn 12px dùng **monospace in hoa giãn chữ** theo pattern Enterpret — nó tách nhãn khỏi nội dung rõ hơn sans thường, và là một phần lớn tạo cảm giác sản phẩm của họ.

Câu kết luận lên 34px (Enterpret dùng display còn lớn hơn). Không có gì dưới 12px.

### 10.2 Palette

**Xung đột phải giải quyết:** cam là màu thương hiệu, nhưng cam cũng là màu cảnh báo quy ước. Quy tắc: **cam chỉ dùng cho tương tác và định danh** — logo, nav đang chọn, nút hành động chính, focus ring, dòng đang chọn, series chính trong chart. **Không bao giờ** dùng cam làm màu trạng thái.

Xám ấm — chiếm ~90% giao diện:

| Token | Hex | Dùng cho |
|---|---|---|
| `--bg` | `#FAF9F7` | Nền app |
| `--surface` | `#FFFFFF` | Thẻ, bảng |
| `--surface-2` | `#F4F2EF` | Nền phụ, header bảng |
| `--line` | `#E5E1DB` | Viền |
| `--ink-dark` | `#292420` | Dải tối, header band |
| `--ink` | `#1C1917` | Chữ chính |
| `--ink-2` | `#57534E` | Chữ phụ |
| `--ink-3` | `#8C8681` | Nhãn, meta |

Xám **ấm** (hue ~30), không phải slate lạnh như hiện tại (hue ~215). Xám lạnh cạnh cam ra cảm giác lệch.

Cam thương hiệu:

| Token | Hex | Dùng cho |
|---|---|---|
| `--primary` | `#D9531E` | **Placeholder** — chờ mã chính thức từ brand guideline |
| `--primary-hover` | `#B84415` | Hover, pressed |
| `--primary-soft` | `#FDF3EE` | Nền vùng đang chọn |
| `--primary-ring` | `rgba(217,83,30,.22)` | Focus ring |

Bốn trạng thái, phân biệt bằng **hình trước, màu sau**:

| Trạng thái | Hình | Màu |
|---|---|---|
| Đang kiểm soát | Viền xám mảnh, **không nền**, dấu tick | không có màu riêng |
| Cần theo dõi | Nền nhạt + thanh trái 3px | `#A16207` / nền `#FDFBEB` / viền `#EADDA0` |
| Cần xử lý ngay | Nền nhạt + thanh trái 3px + nhãn đậm | `#B3261E` / nền `#FDF1F0` / viền `#F3C9C4` |
| Chưa đo được | **Viền nét đứt, không nền** | `#8C8681` |

Ba lý do "đang kiểm soát" không có màu: giải phóng vùng màu ấm cho cam thương hiệu; mắt tự đi tới chỗ có màu nên chú ý dồn vào đúng thứ cần xử lý; và đây là cách giao diện cao cấp tạo cảm giác sang trọng — màu là điểm nhấn hiếm.

Bậc "chưa đo được" quan trọng nhất. Prototype hiện tại không phân biệt "ổn" và "không có dữ liệu" — một bước không có evidence coverage trông giống một bước đang khỏe. Đó là cách nhanh nhất để mất tin cậy khi demo.

**Rủi ro:** vàng olive `#A16207`, đỏ sâu `#B3261E` và cam `#D9531E` đều trong vùng ấm, có thể lẫn nếu chỉ nhìn màu. Ba lớp chặn: mỗi trạng thái luôn có nhãn chữ; mỗi trạng thái có hình khác nhau; cam không xuất hiện trong bất kỳ badge trạng thái nào.

**Bắt buộc khi triển khai:** mọi màu đi qua đúng một token, không hex hardcode. Xóa hex `#087264`/`#123a35`/`#f6f7f4` trong `CXControlTower.tsx` và xóa lớp override `!important` ở `index.css:81-97` — lớp này sót từ lần chuyển dark→light, nó ghi đè cả `.text-emerald-300` và sẽ chặn việc đổi màu.

**Nền có lưới mờ** — `index.css` đã có sẵn utility `.grid-lines`. Dùng nó cho nền app ở opacity rất thấp, theo pattern Enterpret. Đây là chi tiết rẻ mà nâng chất cảm rõ rệt.

### 10.3 Hai quy tắc trung thực dữ liệu — lấy từ UI thật của Enterpret

Đây là phần giá trị nhất học được từ họ, và prototype hiện tại không có.

**Quy tắc denominator.** Mọi card, chart và danh sách xếp hạng **bắt buộc** hiện `X of Y <đơn vị>` ở header. Enterpret dùng `10 of 68 Themes`, `10 of 45 Keywords`. Người đọc luôn biết mình đang xem một tập con, không bao giờ nhầm top-10 là toàn bộ.

**Quy tắc kỳ dữ liệu tuyệt đối.** Mọi chart hiện kỳ bằng **ngày tuyệt đối**, không chỉ nhãn tương đối. Enterpret dùng `Last 3 Months (Apr 01, 2025 – Jul 04, 2026)`. Bản của ta: `3 tháng gần nhất · 01/04/2026 – 04/07/2026`.

Cộng thêm quy tắc thứ ba của riêng ta: mỗi số liệu neo hover ra **nguồn + độ tươi + cỡ mẫu**.

### 10.4 Khuôn trang — 4 tầng, áp cho mọi route

1. **Kết luận** — một câu tiếng Việt thường, 34px
2. **Số liệu neo** — tối đa 4 con số, 24px, hover ra nguồn + độ tươi + cỡ mẫu
3. **Danh sách ưu tiên** — cái cần xử lý trước nằm trên, kèm lý do vì sao nó trên
4. **Hồ sơ chi tiết** — cột phải hoặc drawer, mở theo lựa chọn ở tầng 3

### 10.5 Progressive disclosure — 3 lớp

- **Lớp 0, luôn hiện** — kết luận, số liệu, ai chịu trách nhiệm, hạn
- **Lớp 1, một click** — bằng chứng nguyên văn, danh sách khách bị ảnh hưởng, breakdown ưu tiên, rationale phân loại
- **Lớp 2, hai click** — metric contract, công thức, grain, độ tươi, ID nguồn, version taxonomy

Kiểm tra: nếu một người không thuộc team CX đọc lớp 0 mà vẫn hiểu vấn đề và biết ai đang xử lý thì layout đạt. Nếu phải mở lớp 1 mới hiểu thì câu kết luận viết sai.

### 10.6 Layout

- Một `min-width: 1280px` duy nhất, thay 5 giá trị 1040–1100 hiện tại. Không cuộn ngang ở màn nào.
- Filter toàn cục (kỳ dữ liệu + scope) hiện **trên mọi route**. Bỏ điều kiện `!isPilot` ở `AppShell.tsx:107,148`. Filter đang bật phải nhìn thấy được, không ẩn trong dropdown.
- Sidebar 5 nhóm có nhãn nhóm monospace in hoa. Thu gọn được như hiện tại.
- Padding thẻ 20–24px. Không gradient, không glow, không shadow nhiều lớp.
- Số liệu dùng `tabular-nums` + tracking âm nhẹ ở cỡ lớn.
- Mỗi màn tối đa 2 vùng có màu. Nhiều hơn nghĩa là chưa xếp ưu tiên xong.
- Giữ nhãn "UI prototype · Demo data", thêm dấu thời điểm snapshot cạnh mỗi số liệu quan trọng.

---

## 11. Guided demo mode

Bật bằng `?tour=1&scene=n`. Ribbon không chặn tương tác ở đầu trang, có Tiếp / Lùi / Thoát. UI bên dưới vẫn dùng được — đây là lớp dẫn đường, không phải slideshow.

| Scene | Route | Thông điệp |
|---|---|---|
| 1 | `/dashboard` | Bảng điều hành CX: hành trình mở tài khoản đang mất 1 trong 6 người ở bước nhận diện khuôn mặt |
| 2 | `/feed` | Đây là tín hiệu thô khách gửi về, từ 6 nguồn, đã phân loại tự động |
| 3 | `/quantify` | Theme "thiết bị không tương thích" tăng 18% — xem chart và so sánh cohort Android/iOS |
| 4 | `/health` | Bước nào gãy, và vì sao CXI-021 xếp đầu — mở breakdown ưu tiên |
| 5 | `/actions` | Ai duyệt, ai làm, hạn nào, metric thành công nào |
| 6 | `/outcomes` | Trước/sau, cohort, confounder, và khép vòng với khách |

Buổi demo không phụ thuộc người trình bày nhớ đúng thứ tự. Bảy route còn lại là chiều sâu, dùng khi có câu hỏi.

---

## 12. Đơn giản hóa có ý thức

Ghi lại để giai đoạn 2 không hiểu nhầm là thiết kế cuối:

1. **State chỉ tồn tại trong session.** Prototype chưa mô phỏng shared persistence. Kế thừa hạn chế đã ghi trong `docs/CXM-PROTOTYPE-SCOPE.md`.
2. **`Observation` là snapshot một kỳ**, không phải time-series thật. Trend là mảng điểm dựng sẵn. Vì vậy `Outcome.baseline` và `Outcome.post` cũng là hai snapshot rời — UI phải nói rõ điều này cạnh biểu đồ trước/sau.
3. **Một issue có đúng một action.** Thực tế một issue có thể cần nhiều action; quan hệ 1-1 chỉ để giữ demo gọn.
4. **`priority.total` là công thức cố định trong fixture**, không có UI điều chỉnh trọng số.
5. **Không có identity resolution.** `customerKey` là khóa giả lập, không nối sang hệ thống nghiệp vụ.
6. **Taxonomy không tự học.** Enterpret gọi là *adaptive* vì model tự sinh và tự cập nhật node. Bản của ta là taxonomy tĩnh trong fixture, có hiển thị `driftFlag` dựng sẵn để minh họa năng lực đó. Không được gọi nó là adaptive trong UI.
7. **Mọi output "AI" đều theo kịch bản**, không phải AI thật. Áp cho **cả hai** surface: câu trả lời ở `/assistant`, và **AI summary trong `/feed`** (toggle verbatim ↔ AI summary ở §9.1). Cả hai phải có nhãn *"nội dung demo theo kịch bản"*. Tuyệt đối không dùng nhãn kiểu "AI answer · grounded" như `VoiceOfCustomer.tsx:30` hiện tại — đó là tuyên bố sai về năng lực.
8. **Agent không thật sự chạy.** `AgentFinding` là fixture dựng sẵn, không có scheduler.
9. **`Quantify` chỉ hỗ trợ đúng 8 tổ hợp filter liệt kê ở §9.2.** Không phải query engine tự do. UI hiện chúng dưới dạng lựa chọn có sẵn, không có ô nhập tự do — người xem demo không bị dẫn tới tưởng đây là BI builder.
10. **Role chỉ là selector đổi Dashboard template**, không phải RBAC. Bốn role của Enterpret (Admin/Editor/Member/Viewer) không được triển khai.

---

## 13. Tiêu chí hoàn thành

Thay thế mục "Acceptance path" của `docs/CXM-PROTOTYPE-SCOPE.md`.

Một reviewer phải làm được liền mạch:

1. Từ `/dashboard` đọc được kết luận trên Dashboard template và biết bước nào tệ nhất, không cần giải thích thêm.
2. Sang `/feed`, filter theo Category `Khiếu nại` + bước Liveness, đọc verbatim, mở được rationale phân loại.
3. Sang `/quantify`, chọn tổ hợp #7 trong 8 tổ hợp có sẵn (so sánh cohort Android vs iOS trên một theme), thấy header có denominator và ngày tuyệt đối, lưu thành Saved Item.
4. Sang `/taxonomy`, xem cây 5 tầng, thấy cảnh báo drift, sửa phân loại một record và thấy audit.
5. Sang `/health`, thấy funnel 6 bước, mở breakdown ưu tiên và **kiểm tra được** vì sao issue đứng đầu.
6. Bấm một issue → `/issue/:id`, đi qua 5 tab, **duyệt action ngay tại tab Xử lý**, từ tab Khách hàng bấm sang timeline một khách.
7. Sang `/outcomes`, thấy trước/sau, cohort, confounder, verdict; khép vòng.
8. Sang `/atlas`, chọn phase trên rail rồi chọn flow, đọc dải nối để thấy khách rơi ở đâu, mở một step và thấy signal, coverage, metric contract, provenance, cùng lý do bước đó bị gắn nhãn.
8b. Sang `/rules`, hạ ngưỡng *Cần xử lý ngay* xuống 10%, quay lại `/health` và `/atlas` thấy bước 02 chuyển đỏ, bấm *Trả về mặc định* thấy quay lại trạng thái gốc.
9. Sang `/sources`, thấy nguồn nào stale và **số nào bị ảnh hưởng**.
10. Sang `/surveys`, thấy 6 khảo sát với trigger, cooldown, response rate so mục tiêu.
11. Sang `/agents`, thấy finding chưa acknowledge và acknowledge được.
12. Nhận biết rõ mọi thay đổi chỉ tồn tại trong session, và Trợ lý là kịch bản không phải AI thật.

Kỹ thuật — kiểm trên `output/cxm-platform-prototype.html`. Cột kết quả ghi rõ lần kiểm gần nhất:

| Tiêu chí | Cách kiểm | Kết quả |
|---|---|---|
| Toàn vẹn dữ liệu | `validateFixture()` trả về mảng rỗng | ✅ rỗng · 28/07 |
| Toàn vẹn xuyên suốt vòng xử lý | Chạy `advance()` hết vòng cho 3 action, gọi `validateFixture()` sau **mỗi** bước trung gian | ✅ rỗng ở mọi bước · 27/07 |
| Không màn nào crash | Gọi cả 14 hàm `V.*` cộng `V.issue()`; thêm 6 issue × 5 tab, 20 flow, 7 phase, 6 bước × 3 tab | ✅ 0 lỗi, 0 console error/warning · 28/07 |
| Trạng thái suy ra khớp fixture cũ | `stepState` `metricState` `sourceHealth` trên toàn bộ record, so với các field `state`/`health` đã xóa | ✅ khớp cả 19/19 · 28/07 |
| Ngưỡng thật sự điều khiển UI | Hạ `failCrit` 15→10 rồi đếm `.sn.crit` **trên DOM**; bấm *Trả về mặc định* | ✅ 1 crit + 2 watch → 2 crit + 1 watch → hoàn nguyên · 28/07 |
| Sàn chữ 12px | Duyệt DOM mọi màn, đọc `getComputedStyle().fontSize`, tìm giá trị < 12 | ✅ 0 phần tử · 27/07 |
| Không cuộn ngang ở 1280 | `scrollWidth > clientWidth` trên cả 14 route | ⚠️ **một ngoại lệ có chủ ý:** `.spine` ở `/atlas` tràn 125px ở khung 1280, cuộn ngang **trong khung** (thanh cuộn riêng của card, không phải của trang). Từ ~1400px trở lên vừa khít. · 28/07 |
| Guided tour | 6 bước, ribbon hiện/ẩn đúng, clamp ở bước cuối, thoát sạch | ✅ đạt |
| Quy tắc denominator | Mọi card/chart header có `X of Y <đơn vị>` và kỳ bằng ngày tuyệt đối | ✅ qua hàm `chead()`/`denom()` dùng chung |
| Một token màu | Không hex hardcode ngoài khối `DESIGN TOKENS` | ✅ mọi màu qua `var(--*)` |
| Tự chứa | Không `import`, không `fetch`, không tài nguyên ngoài — mở bằng `file://` phải chạy | ⬜ **cần owner double-click xác nhận một lần** |

Ba tiêu chí của bản React cũ đã bỏ vì không còn áp dụng: grep `text-[8/9/10px]` trong `pages/`, grep hex trong `pages/`, và `build production + lint`. File HTML không có bước build. `customerPhaseForLegacyId` không tồn tại trong bản mới — chỉ có một mô hình hành trình duy nhất.

**Về ngoại lệ cuộn ngang ở `/atlas`.** Đây là ràng buộc thật, không phải chỗ chưa làm xong. Quy tắc trạng thái ở §10.2 buộc badge không được wrap, và badge dài nhất — *Cần xử lý ngay* — cần ~110px, nên thẻ bước không thể hẹp hơn ~132px. Sáu thẻ đã ăn 792px trong 931px khả dụng ở khung 1280 (1280 − 246 sidebar − padding − thanh cuộn dọc), phần còn lại không đủ cho 5 dải nối có nhãn. Ba cách thoát đều tệ hơn: rút ngắn nhãn trạng thái riêng ở màn này thì nhãn lệch nhau giữa các màn; bỏ nhãn số khách rơi thì mất chính con số cần đọc; xếp bước xuống hai dòng thì mất chiều đọc trái-sang-phải. Nên chấp nhận cuộn ngang **có giới hạn trong một card**, kèm ba thứ bù: thanh cuộn hiện rõ ngay dưới chuỗi bước, câu tổng kết bằng chữ nêu đủ *vào bao nhiêu – còn bao nhiêu – bước nào tệ nhất*, và một câu trong phần chú giải nói trước rằng dưới ~1400px thì chuỗi bước cuộn ngang. Khác hẳn vấn đề gốc: người dùng vẫn thấy ngay 5/6 bước và không phải cuộn để *tìm* được flow.

## 14. Rủi ro

| Rủi ro | Mức | Cách chặn |
|---|---|---|
| **Scope phình vì Enterpret là sản phẩm lớn hơn** — 13 route thay vì 7 | **Cao** | Guided tour chỉ 6 màn; 7 route còn lại là chiều sâu. Dashboard template để Head of CX không cần lớp artifact. Nếu vẫn quá lớn thì cắt `/agents` và `/assistant` trước — đó là 2 route ít thiết yếu nhất |
| Cam thương hiệu lẫn với vàng/đỏ trạng thái | Cao | Ba lớp chặn ở §10.2 |
| **Trông giống Enterpret nhưng không có năng lực Enterpret** → mất tin cậy | **Cao** | §12 liệt kê đủ 10 điểm đơn giản hóa; nhãn UI trung thực ở **cả ba** surface: `/assistant`, **AI summary trong `/feed`**, và `/taxonomy`; không dùng từ "adaptive" hay "AI grounded" |
| Mã cam thật sáng hơn `#D9531E` → chữ trắng trên nút không đủ contrast | Trung bình | Khi có mã thật, kiểm contrast; nếu không đạt thì đổi chữ nút sang đen hoặc dùng cam đậm hơn |
| Gộp 4 fixture thành 1 làm vỡ màn đang chạy | Trung bình | `validateFixture()` viết trước khi gộp |
| Bản đồ 7 phase nhưng chỉ pilot có dữ liệu → tưởng mất dữ liệu | Trung bình | Badge "Chưa có dữ liệu quan sát" trên mọi flow ngoài pilot |
| Fixture phình vì thêm taxonomy + artifact + agent | Trung bình | Giới hạn: 6–8 khách, 6 survey, 6–8 nguồn, ~40 taxonomy node, ~30 evidence, 3 agent, 3 Dashboard template |
| Demo simplification bị hiểu là thiết kế cuối | Trung bình | Mục §12 liệt kê đủ 10 điểm |

---

## Ghi chú

Tài liệu này **chưa được commit** — `CXM Platform` không phải git repository. Nếu muốn version nó, cần `git init` trước.
