# CXM UI/Feature Prototype Scope

## Mục tiêu

Đây là dự án UI/UX prototype độc lập để chốt trải nghiệm, feature và workflow nghiệp vụ. Repository không triển khai backend, database, data pipeline, production AI, authentication hoặc integration thật.

## Pilot đang triển khai

Domain: `Mở tài khoản mới 2026`.

Phạm vi hành trình:

1. Khởi tạo hồ sơ.
2. Xác thực CCCD qua VNeID hoặc NFC.
3. Liveness và Face match.
4. Xác nhận thông tin và ngân hàng thụ hưởng chính chủ.
5. Chọn số tài khoản và ký hợp đồng điện tử.
6. Kích hoạt tài khoản.

## Feature cần review và chốt

- Canonical journey taxonomy có stable ID, version, provenance và owner.
- Executive conclusion gắn trực tiếp với issue ưu tiên.
- Journey health theo completion, failure và evidence coverage.
- Friction queue xếp theo severity, affected customers, confidence và trend.
- Evidence inspector có source reference, timestamp, masking và customer key giả lập.
- Metric contract có grain, formula, source, freshness và owner.
- Issue liên kết bắt buộc tới step, metric, evidence và action.
- Governed action gồm human approval, delivery, impact validation và loop closure.
- Integrity check phát hiện broken relation trong fixture.
- Demo/snapshot labeling rõ ràng, không tuyên bố realtime.

## Ngoài phạm vi dự án

- API và persistence.
- Customer identity resolution thật.
- PII processing thật.
- Event, CRM, SmartCA hoặc eKYC integration.
- Automated taxonomy hoặc anomaly model.
- LLM-generated production insight.
- Customer outbound communication.
- RBAC, SSO và immutable audit log.

UI có thể mô phỏng trạng thái của các capability trên để review luồng sử dụng, nhưng repository không xây implementation thật.

## Mock data contract

Source of truth của pilot UI: `app/src/data/onboarding-pilot.ts`.

Fixture được tách thành:

- Journey definition.
- Step observations.
- Metric definitions.
- Masked evidence.
- Issues.
- Governed actions.

Contract này chỉ phục vụ review UI và giữ fixture nhất quán. Nó không phải API contract hoặc thiết kế backend.

## Acceptance path

Một reviewer phải thực hiện được chuỗi sau trong UI:

1. Nhận biết điểm gãy ưu tiên từ summary và journey.
2. Chọn issue trong friction queue.
3. Kiểm tra metric definition và evidence đã masking.
4. Đọc hypothesis và decision recommendation.
5. Phê duyệt action.
6. Mô phỏng delivery, impact validation và loop closure.
7. Nhận biết rõ mọi thay đổi chỉ tồn tại trong UI session.

## Prototype approval gate

Prototype được xem là chốt khi owner duyệt:

- Canonical journey và terminology.
- Priority model.
- Evidence fields và masking rule.
- Issue/action lifecycle.
- Approval gates.
- Success metrics và outcome validation.
- Cách UI mô phỏng ranh giới giữa CXM, CRM và delivery tools.
