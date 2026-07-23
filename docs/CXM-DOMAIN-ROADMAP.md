# CXM UI Prototype Roadmap After Onboarding Pilot

## Nguyên tắc mở rộng

Chỉ có một `CX Control Tower`. Không nhân bản Control Tower hoặc màn quản lý theo từng domain. Domain mới xuất hiện dưới dạng scope/filter và tái sử dụng cùng capability model:

`Journey → Observation → Friction → Evidence → Decision → Action → Outcome`

## Ranh giới VOC và CX

### Voice of Customer

- Hợp nhất phản hồi, phân loại theme và phát hiện xu hướng.
- Trả lời khách hàng đang nói gì và vì sao.
- Output là `Voice Insight` có evidence và recommendation.
- Chỉ handoff sang CX khi insight có journey impact, affected scope và owner rõ.

### Customer Experience

- Hợp nhất Voice Insight với behavioral và operational signals.
- Tạo và quản lý `CX Issue` trong Issue Register.
- Đưa issue ưu tiên vào một `CX Control Tower` duy nhất.
- Điều phối action, đánh giá outcome và close the loop.

Object flow:

`Voice Insight (optional) → CX Issue → Control Tower priority → Action → Outcome`

Không phải mọi VOC insight đều trở thành issue. Không phải mọi issue đều phải xuất hiện trên Control Tower.

Domain chỉ được đưa vào prototype sau khi thống nhất owner giả lập, source provenance, stable identifiers và success metric hiển thị.

## Thứ tự đề xuất

### Phase 2 · Cash movement

Scope:

- Liên kết ngân hàng.
- Nộp tiền và đối soát callback.
- Rút tiền.
- Chuyển tiền giữa tiểu khoản.

Feature emphasis:

- Transaction status timeline.
- Pending state và expected resolution time.
- Correlation giữa transaction, case và repeat contact.
- Regulatory/customer communication approval.

### Phase 3 · Trading

Scope:

- Đặt, sửa và hủy lệnh.
- Từ chối lệnh và reason code.
- Khớp lệnh và latency.

Feature emphasis:

- Order lifecycle evidence.
- Session/market-calendar context.
- Error explainability.
- System dependency và release impact.

### Phase 4 · Margin and lending

Scope:

- Sức mua.
- Margin eligibility.
- Call margin.
- Ứng trước tiền bán.

Feature emphasis:

- Policy/version context.
- Financial impact guardrails.
- Human approval cho customer-level action.

### Phase 5 · Wealth products

Scope:

- iBond.
- Chứng chỉ quỹ và DCA.
- Thanh khoản và tất toán.

Feature emphasis:

- Product suitability context.
- Risk disclosure evidence.
- Adoption và intent analysis.

### Phase 6 · Servicing and complaint

Scope:

- Hotline, chat, broker và branch.
- Khiếu nại, tra soát và escalation.
- Repeat contact và FCR.

Feature emphasis:

- Omnichannel interaction chain.
- Case ownership và SLA.
- Approved close-the-loop communication.

### Phase 7 · Retention and churn

Scope:

- Inactivity.
- Churn risk.
- Win-back.

Feature emphasis:

- Tách market-driven behavior khỏi experience-driven churn.
- Explainable reason codes.
- Consent, contact policy và outcome measurement.

## Deferred prototype capabilities

- Adaptive taxonomy suggestion screens: sau khi taxonomy onboarding được chốt.
- AI assistant states: chỉ sau khi evidence, access-control và confidence UX được chốt.
- Anomaly alert screens: cần mô phỏng time-series, market calendar và source-health states.
- Context graph views: cần chốt cách hiển thị identity và relation confidence.
- MCP/agent automation screens: mô phỏng read-only trước; write action luôn có approval gate.

## Không thuộc CXM

- CDP, data lake và streaming platform tổng quát.
- Contact-center, survey và ticketing suite.
- Generic BI builder.
- Foundation speech/translation/LLM model.
- Autonomous compensation, account restriction hoặc case closure.
- Tư vấn hoặc khuyến nghị đầu tư từ journey/VOC signals.
