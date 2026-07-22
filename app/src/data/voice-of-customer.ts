export type VoiceDecision = 'Mở rộng' | 'Cải thiện' | 'Khảo sát thêm';
export type VoiceSource = 'In-app survey' | 'Thumb feedback' | 'App review' | 'Support' | 'Broker note';

export interface VoiceEvidence {
  source: VoiceSource;
  segment: string;
  quote: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ProductVoice {
  id: string;
  product: string;
  touchpointId: string;
  theme: string;
  subtheme: string;
  owner: string;
  sources: VoiceSource[];
  responses: number;
  positive: number;
  neutral: number;
  negative: number;
  trend: number;
  trendPoints: number[];
  adoption: number;
  businessImpact: 'Cao' | 'Trung bình' | 'Thăm dò';
  insight: string;
  decision: VoiceDecision;
  nextAction: string;
  evidence: VoiceEvidence[];
}

export const PRODUCT_VOICE: ProductVoice[] = [
  {
    id: 'voc-referral', product: 'Giới thiệu bạn bè', touchpointId: 'tp-referral', theme: 'Giá trị sản phẩm', subtheme: 'Minh bạch phần thưởng', owner: 'Growth', sources: ['Thumb feedback', 'Support'], responses: 724, positive: 81, neutral: 0, negative: 19, trend: 6, trendPoints: [62, 65, 69, 71, 76, 81], adoption: 34, businessImpact: 'Cao', insight: 'Thao tác chia sẻ được yêu thích, nhưng trạng thái nhận thưởng tạo phần lớn phản hồi tiêu cực.', decision: 'Mở rộng', nextAction: 'Mở rộng cohort sau khi bổ sung timeline và trạng thái nhận thưởng.', evidence: [
      { source: 'Thumb feedback', segment: 'Khách active', quote: 'Tạo link và gửi qua Zalo rất nhanh.', sentiment: 'positive' },
      { source: 'Support', segment: 'Người giới thiệu', quote: 'Đã giới thiệu thành công nhưng chưa biết khi nào nhận thưởng.', sentiment: 'negative' },
    ],
  },
  {
    id: 'voc-market', product: 'Bảng giá & khám phá', touchpointId: 'tp-market', theme: 'Khả năng khám phá', subtheme: 'Chọn sản phẩm phù hợp', owner: 'Engagement Squad', sources: ['Thumb feedback', 'App review'], responses: 4180, positive: 76, neutral: 0, negative: 24, trend: 3, trendPoints: [68, 70, 69, 72, 74, 76], adoption: 72, businessImpact: 'Cao', insight: 'Dữ liệu thị trường được đánh giá tốt; khách mới vẫn thiếu hướng dẫn để chuyển từ xem sang chọn sản phẩm.', decision: 'Mở rộng', nextAction: 'Giữ cấu trúc hiện tại và thử gợi ý theo khẩu vị rủi ro cho khách mới.', evidence: [
      { source: 'App review', segment: 'Nhà đầu tư mới', quote: 'Nhiều thông tin nhưng chưa biết nên bắt đầu xem mã nào.', sentiment: 'neutral' },
      { source: 'Thumb feedback', segment: 'Khách active', quote: 'Bảng giá nhanh, đủ thông tin để theo dõi trong phiên.', sentiment: 'positive' },
    ],
  },
  {
    id: 'voc-bond', product: 'iBond', touchpointId: 'tp-bond', theme: 'Niềm tin sản phẩm', subtheme: 'Rủi ro & thanh khoản', owner: 'Wealth Squad', sources: ['Thumb feedback', 'Broker note', 'Support'], responses: 411, positive: 73, neutral: 0, negative: 27, trend: -8, trendPoints: [81, 80, 78, 77, 75, 73], adoption: 18, businessImpact: 'Cao', insight: 'Lợi suất tạo quan tâm, nhưng cách giải thích rủi ro và thanh khoản đang làm giảm niềm tin trước quyết định mua.', decision: 'Cải thiện', nextAction: 'Ưu tiên risk explainer và kịch bản thanh khoản trước khi tăng traffic.', evidence: [
      { source: 'Broker note', segment: 'Khách affluent', quote: 'Khách hỏi nhiều về phương án bán lại trước hạn nhưng màn sản phẩm chưa trả lời rõ.', sentiment: 'negative' },
      { source: 'Thumb feedback', segment: 'Khách active', quote: 'So sánh lợi suất giữa các mã khá thuận tiện.', sentiment: 'positive' },
    ],
  },
  {
    id: 'voc-margin', product: 'Margin', touchpointId: 'tp-margin-reg', theme: 'Minh bạch chi phí', subtheme: 'Lãi vay & margin call', owner: 'Wealth Squad', sources: ['In-app survey', 'Support'], responses: 218, positive: 62, neutral: 23, negative: 15, trend: -5, trendPoints: [71, 70, 68, 66, 64, 62], adoption: 27, businessImpact: 'Cao', insight: 'Nhóm active thấy sản phẩm hữu ích; khách mới chưa hiểu tổng chi phí và điều kiện margin call.', decision: 'Cải thiện', nextAction: 'A/B test bảng tổng chi phí và mô phỏng margin call trước bước đăng ký.', evidence: [
      { source: 'In-app survey', segment: 'Khách mới', quote: 'Tôi chưa biết số tiền lãi thực trả nếu giữ vị thế trong một tháng.', sentiment: 'negative' },
      { source: 'Support', segment: 'Khách active', quote: 'Cần ví dụ cụ thể khi tỷ lệ tài sản giảm thì hệ thống xử lý thế nào.', sentiment: 'neutral' },
    ],
  },
  {
    id: 'voc-first-trade', product: 'Sau giao dịch đầu', touchpointId: 'tp-portfolio-first', theme: 'Kích hoạt', subtheme: 'Bước tiếp theo', owner: 'Activation Squad', sources: ['In-app survey', 'Thumb feedback'], responses: 386, positive: 68, neutral: 20, negative: 12, trend: 9, trendPoints: [54, 57, 60, 62, 65, 68], adoption: 43, businessImpact: 'Trung bình', insight: 'Khoảnh khắc hoàn tất tạo cảm xúc tốt, nhưng chưa dẫn khách tới hành động có giá trị tiếp theo.', decision: 'Mở rộng', nextAction: 'Triển khai celebration cùng next-best-action và đo giao dịch thứ hai.', evidence: [
      { source: 'In-app survey', segment: 'First-time investor', quote: 'Đặt lệnh xong thấy yên tâm, nhưng chưa biết nên theo dõi danh mục ở đâu.', sentiment: 'neutral' },
      { source: 'Thumb feedback', segment: 'First-time investor', quote: 'Xác nhận rõ ràng, dễ biết lệnh đã hoàn tất.', sentiment: 'positive' },
    ],
  },
  {
    id: 'voc-dca', product: 'Tích lũy DCA', touchpointId: 'tp-dca', theme: 'Product-market fit', subtheme: 'Mục tiêu tích lũy', owner: 'Wealth Squad', sources: ['In-app survey'], responses: 34, positive: 53, neutral: 29, negative: 18, trend: 2, trendPoints: [48, 51, 49, 50, 51, 53], adoption: 6, businessImpact: 'Thăm dò', insight: 'Tín hiệu ban đầu chưa đủ đại diện để kết luận nhu cầu hoặc product-market fit.', decision: 'Khảo sát thêm', nextAction: 'Thu tối thiểu 200 phản hồi từ cohort có mục tiêu tích lũy dài hạn.', evidence: [
      { source: 'In-app survey', segment: 'Khách thăm dò', quote: 'Ý tưởng phù hợp nhưng tôi muốn biết có thể dừng kế hoạch bất kỳ lúc nào không.', sentiment: 'neutral' },
    ],
  },
];

export const VOICE_SOURCES: { source: VoiceSource; volume: number }[] = [
  { source: 'Thumb feedback', volume: 4486 },
  { source: 'In-app survey', volume: 638 },
  { source: 'App review', volume: 412 },
  { source: 'Support', volume: 289 },
  { source: 'Broker note', volume: 124 },
];
