export type PilotStepStatus = 'healthy' | 'watch' | 'critical';
export type PilotSeverity = 'critical' | 'high' | 'medium';
export type ApprovalStatus = 'pending' | 'approved';
export type DeliveryStatus = 'backlog' | 'in-progress' | 'released';
export type ValidationStatus = 'not-started' | 'monitoring' | 'validated';
export type LoopClosureStatus = 'blocked' | 'ready' | 'closed';

export interface PilotStep {
  id: string;
  code: string;
  name: string;
  owner: string;
  status: PilotStepStatus;
  entered: number;
  completed: number;
  failed: number;
  evidenceCoverage: number;
  source: string;
}

export interface PilotMetric {
  id: string;
  name: string;
  value: string;
  target: string;
  grain: string;
  formula: string;
  source: string;
  freshness: string;
  owner: string;
}

export interface PilotEvidence {
  id: string;
  issueId: string;
  stepId: string;
  source: string;
  sourceRef: string;
  occurredAt: string;
  maskedQuote: string;
  signal: string;
  customerKey: string;
}

export interface PilotIssue {
  id: string;
  title: string;
  stepId: string;
  metricId: string;
  actionId: string;
  evidenceRefs: string[];
  severity: PilotSeverity;
  status: 'detecting' | 'investigating' | 'fixing';
  affectedCustomers: number;
  repeatContactRate: number;
  confidence: number;
  trend: number;
  priorityScore: number;
  hypothesis: string;
  decision: string;
}

export interface PilotAction {
  id: string;
  issueId: string;
  title: string;
  owner: string;
  accountable: string;
  dueAt: string;
  approval: ApprovalStatus;
  delivery: DeliveryStatus;
  impactValidation: ValidationStatus;
  loopClosure: LoopClosureStatus;
  successMetricId: string;
  releaseMarker?: string;
  outcome?: {
    observedValue: string;
    target: string;
    period: string;
    sampleSize: number;
    evidenceRef: string;
  };
}

export const ONBOARDING_PILOT = {
  journey: {
    id: 'journey-account-opening-2026',
    name: 'Mở tài khoản mới 2026',
    version: 'v1.0-pilot',
    source: 'Account Journey · Sơ đồ 2 & 9',
    scope: 'Bắt đầu đăng ký → tài khoản sẵn sàng giao dịch',
    asOf: '17/07/2026 · 15:30',
  },
  steps: [
    { id: 'ob-start', code: '01', name: 'Khởi tạo hồ sơ', owner: 'Growth', status: 'healthy', entered: 18420, completed: 17690, failed: 730, evidenceCoverage: 96, source: 'Digital analytics' },
    { id: 'ob-id', code: '02', name: 'Xác thực CCCD · VNeID/NFC', owner: 'Onboarding', status: 'watch', entered: 17690, completed: 15840, failed: 1850, evidenceCoverage: 71, source: 'VNeID + Mobile SDK + eKYC' },
    { id: 'ob-face', code: '03', name: 'Liveness & Face match', owner: 'Onboarding', status: 'critical', entered: 15840, completed: 13190, failed: 2650, evidenceCoverage: 64, source: 'eKYC SDK' },
    { id: 'ob-profile', code: '04', name: 'Thông tin & NH thụ hưởng', owner: 'Product', status: 'healthy', entered: 13190, completed: 12760, failed: 430, evidenceCoverage: 92, source: 'Account + Bank verification' },
    { id: 'ob-contract', code: '05', name: 'Chọn số TK & ký hợp đồng', owner: 'Onboarding', status: 'watch', entered: 12760, completed: 11990, failed: 770, evidenceCoverage: 58, source: 'SmartCA + Account service' },
    { id: 'ob-activate', code: '06', name: 'Kích hoạt tài khoản', owner: 'Core Account', status: 'healthy', entered: 11990, completed: 11840, failed: 150, evidenceCoverage: 89, source: 'Core Account' },
  ] satisfies PilotStep[],
  metrics: [
    { id: 'm-completion', name: 'Hoàn tất mở tài khoản', value: '64,3%', target: '≥ 72%', grain: 'Unique applicant / journey instance', formula: 'Activated accounts ÷ started applications', source: 'Digital analytics + Core Account', freshness: 'Snapshot · trễ 4 giờ', owner: 'Onboarding Analytics' },
    { id: 'm-liveness', name: 'Liveness completion', value: '83,3%', target: '≥ 90%', grain: 'Unique applicant / liveness attempt group', formula: 'Completed liveness ÷ entered liveness', source: 'eKYC SDK', freshness: 'Snapshot · trễ 6 giờ', owner: 'Onboarding Squad' },
    { id: 'm-contract', name: 'Ký hợp đồng thành công', value: '94,0%', target: '≥ 97%', grain: 'Unique applicant / contract session', formula: 'Signed contracts ÷ contract sessions', source: 'SmartCA + Account service', freshness: 'Snapshot · trễ 4 giờ', owner: 'Onboarding Squad' },
    { id: 'm-ocr-evidence', name: 'Evidence coverage bước OCR', value: '71,0%', target: '≥ 90%', grain: 'Failed ID capture event', formula: 'Failure events có reason code hợp lệ ÷ total failure events', source: 'Mobile SDK event registry', freshness: 'Snapshot · trễ 4 giờ', owner: 'Data Platform' },
  ] satisfies PilotMetric[],
  evidence: [
    { id: 'EV-101', issueId: 'OBI-021', stepId: 'ob-face', source: 'eKYC event', sourceRef: 'liveness_failed · SDK 4.8.2', occurredAt: '17/07 · 14:42', maskedQuote: 'Mã lỗi LIGHT_CONDITION sau 3 lần thử.', signal: 'Android · thiết bị tầm trung · ánh sáng yếu', customerKey: 'KH•••7A2' },
    { id: 'EV-102', issueId: 'OBI-021', stepId: 'ob-face', source: 'Chat', sourceRef: 'CASE•••1842', occurredAt: '17/07 · 14:31', maskedQuote: 'Tôi đã quay lại nhiều lần nhưng ứng dụng vẫn yêu cầu làm lại từ đầu.', signal: 'Repeat contact · 2 lần trong 40 phút', customerKey: 'KH•••1C9' },
    { id: 'EV-103', issueId: 'OBI-021', stepId: 'ob-face', source: 'Google Play', sourceRef: 'REVIEW•••522', occurredAt: '17/07 · 12:18', maskedQuote: 'Nhận diện khuôn mặt không hoàn tất trên điện thoại Android.', signal: 'Rating 2/5 · Android', customerKey: 'Ẩn danh' },
    { id: 'EV-201', issueId: 'OBI-017', stepId: 'ob-contract', source: 'Funnel event', sourceRef: 'contract_session_abandoned', occurredAt: '17/07 · 13:06', maskedQuote: 'Phiên SmartCA hết hạn trước khi CTA ký được xác nhận.', signal: 'Session timeout · 4m32s', customerKey: 'KH•••8B4' },
    { id: 'EV-202', issueId: 'OBI-017', stepId: 'ob-contract', source: 'Hotline', sourceRef: 'CASE•••1750', occurredAt: '17/07 · 11:49', maskedQuote: 'Không rõ hồ sơ đã ký thành công hay cần thao tác lại.', signal: 'First contact unresolved', customerKey: 'KH•••3D1' },
    { id: 'EV-301', issueId: 'OBI-013', stepId: 'ob-id', source: 'ID capture event', sourceRef: 'id_capture_failed · GLARE', occurredAt: '17/07 · 14:10', maskedQuote: 'Ảnh giấy tờ bị chói; chưa có hướng dẫn thay đổi góc chụp.', signal: 'iOS · fail 3 lần', customerKey: 'KH•••5F6' },
  ] satisfies PilotEvidence[],
  issues: [
    { id: 'OBI-021', title: 'Liveness thất bại lặp lại trên Android', stepId: 'ob-face', metricId: 'm-liveness', actionId: 'OBA-021', evidenceRefs: ['EV-101', 'EV-102', 'EV-103'], severity: 'critical', status: 'investigating', affectedCustomers: 312, repeatContactRate: 29, confidence: 91, trend: 18, priorityScore: 94, hypothesis: 'SDK 4.8.2 nhạy với ánh sáng yếu trên nhóm Android tầm trung.', decision: 'Duyệt rollout hướng dẫn theo điều kiện lỗi và thử SDK patch trên 10% traffic.' },
    { id: 'OBI-017', title: 'Không rõ trạng thái ký hợp đồng', stepId: 'ob-contract', metricId: 'm-contract', actionId: 'OBA-017', evidenceRefs: ['EV-201', 'EV-202'], severity: 'high', status: 'fixing', affectedCustomers: 146, repeatContactRate: 18, confidence: 84, trend: 9, priorityScore: 82, hypothesis: 'CTA và trạng thái SmartCA không phản hồi kịp trước khi session hết hạn.', decision: 'Chốt sticky CTA, trạng thái theo thời gian thực và đường quay lại phiên ký.' },
    { id: 'OBI-013', title: 'Chụp CCCD thất bại nhưng thiếu hướng dẫn', stepId: 'ob-id', metricId: 'm-ocr-evidence', actionId: 'OBA-013', evidenceRefs: ['EV-301'], severity: 'medium', status: 'detecting', affectedCustomers: 228, repeatContactRate: 11, confidence: 72, trend: -4, priorityScore: 68, hypothesis: 'Thông báo lỗi chung không phân biệt chói, mờ và sai khung.', decision: 'Thu thêm 200 mẫu đã gắn reason code trước khi thay flow hướng dẫn.' },
  ] satisfies PilotIssue[],
  actions: [
    { id: 'OBA-021', issueId: 'OBI-021', title: 'Pilot SDK patch + contextual recovery', owner: 'Minh Quân', accountable: 'Head of Onboarding', dueAt: '25/07', approval: 'pending', delivery: 'backlog', impactValidation: 'not-started', loopClosure: 'blocked', successMetricId: 'm-liveness' },
    { id: 'OBA-017', issueId: 'OBI-017', title: 'Sticky CTA và trạng thái SmartCA', owner: 'Linh Trần', accountable: 'Head of Onboarding', dueAt: '22/07', approval: 'approved', delivery: 'in-progress', impactValidation: 'not-started', loopClosure: 'blocked', successMetricId: 'm-contract' },
    { id: 'OBA-013', issueId: 'OBI-013', title: 'Reason code cho lỗi chụp CCCD', owner: 'Hà Vũ', accountable: 'Data Platform Lead', dueAt: '29/07', approval: 'approved', delivery: 'released', impactValidation: 'monitoring', loopClosure: 'blocked', successMetricId: 'm-ocr-evidence', releaseMarker: 'Mobile 8.12.0 · 16/07', outcome: { observedValue: '91,4%', target: '≥ 90%', period: '16/07–17/07 · 24 giờ sau release', sampleSize: 286, evidenceRef: 'DQ-RUN•••0717' } },
  ] as PilotAction[],
};

export function validateOnboardingPilot() {
  const stepIds = new Set(ONBOARDING_PILOT.steps.map((step) => step.id));
  const metricIds = new Set(ONBOARDING_PILOT.metrics.map((metric) => metric.id));
  const evidenceIds = new Set(ONBOARDING_PILOT.evidence.map((item) => item.id));
  const issueIds = new Set(ONBOARDING_PILOT.issues.map((issue) => issue.id));
  const actionIds = new Set(ONBOARDING_PILOT.actions.map((action) => action.id));
  const errors: string[] = [];
  const allIds = [
    ...ONBOARDING_PILOT.steps.map((item) => item.id),
    ...ONBOARDING_PILOT.metrics.map((item) => item.id),
    ...ONBOARDING_PILOT.evidence.map((item) => item.id),
    ...ONBOARDING_PILOT.issues.map((item) => item.id),
    ...ONBOARDING_PILOT.actions.map((item) => item.id),
  ];
  allIds.filter((id, index) => allIds.indexOf(id) !== index).forEach((id) => errors.push(`${id}: ID bị trùng`));

  ONBOARDING_PILOT.issues.forEach((issue) => {
    if (!stepIds.has(issue.stepId)) errors.push(`${issue.id}: step không tồn tại`);
    if (!metricIds.has(issue.metricId)) errors.push(`${issue.id}: metric không tồn tại`);
    if (!actionIds.has(issue.actionId)) errors.push(`${issue.id}: action không tồn tại`);
    const action = ONBOARDING_PILOT.actions.find((item) => item.id === issue.actionId);
    if (action && action.issueId !== issue.id) errors.push(`${issue.id}: action liên kết ngược sai`);
    if (action && action.successMetricId !== issue.metricId) errors.push(`${issue.id}: success metric không khớp`);
    issue.evidenceRefs.forEach((id) => {
      if (!evidenceIds.has(id)) errors.push(`${issue.id}: evidence ${id} không tồn tại`);
      const evidence = ONBOARDING_PILOT.evidence.find((item) => item.id === id);
      if (evidence && (evidence.issueId !== issue.id || evidence.stepId !== issue.stepId)) errors.push(`${issue.id}: evidence ${id} sai relation`);
    });
  });
  ONBOARDING_PILOT.actions.forEach((action) => {
    if (!issueIds.has(action.issueId)) errors.push(`${action.id}: issue không tồn tại`);
    if (!metricIds.has(action.successMetricId)) errors.push(`${action.id}: success metric không tồn tại`);
    const issue = ONBOARDING_PILOT.issues.find((item) => item.id === action.issueId);
    if (issue && issue.actionId !== action.id) errors.push(`${action.id}: issue không liên kết ngược tới action`);
    if (action.approval !== 'approved' && action.delivery !== 'backlog') errors.push(`${action.id}: delivery trước approval`);
    if (action.delivery !== 'released' && action.impactValidation !== 'not-started') errors.push(`${action.id}: validation trước release`);
    if (action.delivery !== 'released' && action.outcome) errors.push(`${action.id}: outcome trước release`);
    if (action.impactValidation === 'validated' && !action.outcome) errors.push(`${action.id}: thiếu outcome observation`);
    if (action.loopClosure === 'ready' && action.impactValidation !== 'validated') errors.push(`${action.id}: sẵn sàng khép vòng trước validation`);
    if (action.loopClosure === 'closed' && action.impactValidation !== 'validated') errors.push(`${action.id}: khép vòng trước validation`);
  });
  ONBOARDING_PILOT.evidence.forEach((item) => {
    if (!issueIds.has(item.issueId)) errors.push(`${item.id}: issue không tồn tại`);
    if (!stepIds.has(item.stepId)) errors.push(`${item.id}: step không tồn tại`);
    const issue = ONBOARDING_PILOT.issues.find((candidate) => candidate.id === item.issueId);
    if (issue && !issue.evidenceRefs.includes(item.id)) errors.push(`${item.id}: issue không tham chiếu evidence`);
  });

  return errors;
}
