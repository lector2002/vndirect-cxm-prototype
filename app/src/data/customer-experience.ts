export type CXSeverity = 'critical' | 'high' | 'medium';
export type CXStatus = 'detecting' | 'investigating' | 'fixing' | 'resolved';
export type LoopStatus = 'Chưa phản hồi' | 'Chờ bản sửa' | 'Sẵn sàng liên hệ' | 'Đã khép vòng';

export interface CXIssue {
  id: string;
  title: string;
  phaseId: string;
  touchpointId: string;
  touchpoint: string;
  theme: string;
  rootCause: string;
  severity: CXSeverity;
  status: CXStatus;
  owner: string;
  actionId: string;
  affectedCustomers: number;
  contacts: number;
  repeatContactRate: number;
  escalations: number;
  csatImpact: number;
  churnRiskCustomers: number;
  highValueCustomers: number;
  trend: number;
  priorityScore: number;
  signal: string;
  updated: string;
  resolution: string;
  loopStatus: LoopStatus;
  customersToContact: number;
  outcome?: string;
  evidence: { channel: string; quote: string; time: string }[];
}

export const CX_ISSUES: CXIssue[] = [
  { id: 'CXI-024', title: 'Nạp tiền treo sau callback ngân hàng', phaseId: 'p3', touchpointId: 'tp-payment-gw', touchpoint: 'Cổng thanh toán & đối soát', theme: 'Nạp/rút tiền', rootCause: 'Callback timeout không có trạng thái chờ và ETA cho khách', severity: 'critical', status: 'fixing', owner: 'Payments', actionId: 'CXM-142', affectedCustomers: 214, contacts: 87, repeatContactRate: 38, escalations: 16, csatImpact: -1.4, churnRiskCustomers: 46, highValueCustomers: 28, trend: 42, priorityScore: 94, signal: '214 giao dịch timeout liên kết với 87 ticket trong cùng cửa sổ 24 giờ.', updated: '12 phút trước', resolution: 'Bổ sung trạng thái pending, ETA và tự động đối soát lại callback.', loopStatus: 'Chờ bản sửa', customersToContact: 87, evidence: [{ channel: 'Hotline', quote: 'Tiền đã trừ nhưng hơn 30 phút chưa vào tiểu khoản.', time: '12 phút trước' }, { channel: 'App feedback', quote: 'Tôi phải gọi lại lần hai vì không biết giao dịch đang ở đâu.', time: '26 phút trước' }] },
  { id: 'CXI-021', title: 'Liveness thất bại lặp lại trên Android', phaseId: 'p2', touchpointId: 'tp-liveness', touchpoint: 'Liveness & Face match', theme: 'eKYC', rootCause: 'SDK nhạy với thiết bị Android tầm trung và ánh sáng yếu', severity: 'critical', status: 'investigating', owner: 'Onboarding Squad', actionId: 'CXA-021', affectedCustomers: 312, contacts: 63, repeatContactRate: 29, escalations: 7, csatImpact: -0.9, churnRiskCustomers: 71, highValueCustomers: 9, trend: 18, priorityScore: 94, signal: 'Failure loop tăng 18%; completion eKYC giảm 3,2pt trên Android.', updated: '34 phút trước', resolution: 'Pilot SDK patch và contextual recovery sau human approval.', loopStatus: 'Chưa phản hồi', customersToContact: 63, evidence: [{ channel: 'Google Play', quote: 'Quay đi quay lại vẫn báo không nhận diện được khuôn mặt.', time: '34 phút trước' }, { channel: 'Chat', quote: 'Đã thử bốn lần và app yêu cầu làm lại từ đầu.', time: '1 giờ trước' }] },
  { id: 'CXI-019', title: 'Không rõ lý do lệnh bị từ chối', phaseId: 'p4', touchpointId: 'tp-orderticket', touchpoint: 'Vé lệnh (Order ticket)', theme: 'Đặt lệnh', rootCause: 'Mã lỗi core chưa được dịch thành hướng dẫn có thể hành động', severity: 'high', status: 'fixing', owner: 'Trading Core', actionId: 'CXM-135', affectedCustomers: 168, contacts: 41, repeatContactRate: 24, escalations: 11, csatImpact: -1.1, churnRiskCustomers: 38, highValueCustomers: 31, trend: 11, priorityScore: 83, signal: 'FCR chỉ 58%; cùng khách liên hệ lại khi thử lệnh lần hai.', updated: '1 giờ trước', resolution: 'Map error code sang nguyên nhân, cách sửa và CTA phù hợp.', loopStatus: 'Chờ bản sửa', customersToContact: 41, evidence: [{ channel: 'Hotline', quote: 'Lệnh báo từ chối nhưng không hiểu sai giá hay sai sức mua.', time: '1 giờ trước' }, { channel: 'iOS review', quote: 'Cần hiện hướng dẫn cụ thể thay vì mã lỗi.', time: '2 giờ trước' }] },
  { id: 'CXI-026', title: 'Khách hỏi lại về thanh khoản iBond trước khi mua', phaseId: 'p6', touchpointId: 'tp-bond', touchpoint: 'Sàn trái phiếu (iBond)', theme: 'Sản phẩm đầu tư', rootCause: 'Thông tin bán lại trước hạn nằm sâu và thiếu ví dụ tình huống', severity: 'medium', status: 'investigating', owner: 'Wealth Squad', actionId: 'CXM-147', affectedCustomers: 411, contacts: 54, repeatContactRate: 31, escalations: 5, csatImpact: -0.6, churnRiskCustomers: 22, highValueCustomers: 47, trend: 23, priorityScore: 78, signal: '27% feedback tiêu cực; 54 liên hệ có cùng intent về thanh khoản.', updated: '3 giờ trước', resolution: 'Đưa risk explainer và kịch bản bán lại vào trước CTA mua.', loopStatus: 'Chưa phản hồi', customersToContact: 54, evidence: [{ channel: 'Broker note', quote: 'Khách chưa quyết định vì không rõ bán lại trước hạn theo giá nào.', time: '3 giờ trước' }, { channel: 'Thumb feedback', quote: 'Lợi suất rõ nhưng phần thanh khoản khó tìm.', time: '5 giờ trước' }] },
  { id: 'CXI-017', title: 'Không rõ trạng thái ký hợp đồng', phaseId: 'p2', touchpointId: 'tp-contract', touchpoint: 'Ký HĐ điện tử (CA)', theme: 'eKYC', rootCause: 'CTA và trạng thái SmartCA không phản hồi kịp trước khi session hết hạn', severity: 'high', status: 'fixing', owner: 'Onboarding Squad', actionId: 'CXA-017', affectedCustomers: 146, contacts: 29, repeatContactRate: 18, escalations: 2, csatImpact: -0.8, churnRiskCustomers: 19, highValueCustomers: 4, trend: 9, priorityScore: 82, signal: 'Phiên SmartCA hết hạn trước khi khách nhận được xác nhận trạng thái ký.', updated: '1 giờ trước', resolution: 'Sticky CTA, trạng thái theo thời gian thực và đường quay lại phiên ký.', loopStatus: 'Chờ bản sửa', customersToContact: 29, evidence: [{ channel: 'Hotline', quote: 'Không rõ hồ sơ đã ký thành công hay cần thao tác lại.', time: '1 giờ trước' }] },
  { id: 'CXI-013', title: 'Chụp CCCD thất bại nhưng thiếu hướng dẫn', phaseId: 'p2', touchpointId: 'tp-idcapture', touchpoint: 'Xác thực CCCD · VNeID/NFC', theme: 'eKYC', rootCause: 'Thông báo lỗi chung không phân biệt chói, mờ và sai khung', severity: 'medium', status: 'fixing', owner: 'Data Platform', actionId: 'CXA-013', affectedCustomers: 228, contacts: 25, repeatContactRate: 11, escalations: 1, csatImpact: -0.4, churnRiskCustomers: 12, highValueCustomers: 2, trend: -4, priorityScore: 68, signal: 'Reason code coverage đạt 71%; bản cập nhật instrumentation đang được đánh giá.', updated: '2 giờ trước', resolution: 'Theo dõi reason code sau phát hành và xác nhận evidence coverage.', loopStatus: 'Chờ bản sửa', customersToContact: 25, evidence: [{ channel: 'App event', quote: 'Ảnh giấy tờ bị chói; chưa có hướng dẫn thay đổi góc chụp.', time: '2 giờ trước' }] },
];
