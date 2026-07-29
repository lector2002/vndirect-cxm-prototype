export type VoiceDecision = 'Mở rộng' | 'Cải thiện' | 'Khảo sát thêm';
export type VoiceSource = 'In-app survey' | 'Thumb feedback' | 'App review' | 'Support' | 'Broker note';

export interface VoiceEvidence {
  source: VoiceSource;
  segment: string;
  quote: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface MonthlyPoint {
  month: string;
  positive: number;
  volume: number;
}

export interface VoiceSubtheme {
  name: string;
  volume: number;
  positive: number;
  trend: number;
  quote: string;
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
  monthly: MonthlyPoint[];
  subthemes: VoiceSubtheme[];
  adoption: number;
  businessImpact: 'Cao' | 'Trung bình' | 'Thăm dò';
  insight: string;
  decision: VoiceDecision;
  nextAction: string;
  evidence: VoiceEvidence[];
}

// 12 tháng gần nhất (08/2025 → 07/2026), khớp demo snapshot 17/07/2026.
export const VOICE_MONTHS = ['08/25', '09/25', '10/25', '11/25', '12/25', '01/26', '02/26', '03/26', '04/26', '05/26', '06/26', '07/26'] as const;

function monthly(positive: number[], volume: number[]): MonthlyPoint[] {
  return VOICE_MONTHS.map((month, index) => ({ month, positive: positive[index], volume: volume[index] }));
}

export const PRODUCT_VOICE: ProductVoice[] = [
  {
    id: 'voc-referral', product: 'Giới thiệu bạn bè', touchpointId: 'tp-referral', theme: 'Giá trị sản phẩm', subtheme: 'Minh bạch phần thưởng', owner: 'Growth', sources: ['Thumb feedback', 'Support'], responses: 724, positive: 81, neutral: 0, negative: 19, trend: 6, trendPoints: [62, 65, 69, 71, 76, 81],
    monthly: monthly([54, 56, 58, 59, 60, 61, 62, 65, 69, 71, 76, 81], [38, 42, 45, 48, 52, 55, 58, 60, 63, 66, 70, 74]),
    subthemes: [
      { name: 'Minh bạch phần thưởng', volume: 286, positive: 68, trend: -4, quote: 'Đã giới thiệu thành công nhưng chưa biết khi nào nhận thưởng.' },
      { name: 'Thao tác chia sẻ', volume: 240, positive: 92, trend: 8, quote: 'Tạo link và gửi qua Zalo rất nhanh.' },
      { name: 'Điều kiện nhận thưởng', volume: 118, positive: 61, trend: -2, quote: 'Chưa rõ bạn được giới thiệu cần làm gì để mình nhận thưởng.' },
      { name: 'Theo dõi trạng thái', volume: 80, positive: 74, trend: 5, quote: 'Muốn có timeline hiển thị bạn tôi đang ở bước nào.' },
    ],
    adoption: 34, businessImpact: 'Cao', insight: 'Thao tác chia sẻ được yêu thích, nhưng trạng thái nhận thưởng tạo phần lớn phản hồi tiêu cực.', decision: 'Mở rộng', nextAction: 'Mở rộng cohort sau khi bổ sung timeline và trạng thái nhận thưởng.', evidence: [
      { source: 'Thumb feedback', segment: 'Khách active', quote: 'Tạo link và gửi qua Zalo rất nhanh.', sentiment: 'positive' },
      { source: 'Support', segment: 'Người giới thiệu', quote: 'Đã giới thiệu thành công nhưng chưa biết khi nào nhận thưởng.', sentiment: 'negative' },
    ],
  },
  {
    id: 'voc-market', product: 'Bảng giá & khám phá', touchpointId: 'tp-market', theme: 'Khả năng khám phá', subtheme: 'Chọn sản phẩm phù hợp', owner: 'Engagement Squad', sources: ['Thumb feedback', 'App review'], responses: 4180, positive: 76, neutral: 0, negative: 24, trend: 3, trendPoints: [68, 70, 69, 72, 74, 76],
    monthly: monthly([66, 67, 68, 69, 68, 70, 69, 70, 72, 73, 74, 76], [280, 300, 315, 330, 340, 350, 360, 370, 385, 400, 410, 420]),
    subthemes: [
      { name: 'Chọn sản phẩm phù hợp', volume: 1650, positive: 70, trend: 2, quote: 'Nhiều thông tin nhưng chưa biết nên bắt đầu xem mã nào.' },
      { name: 'Tốc độ bảng giá', volume: 1320, positive: 88, trend: 4, quote: 'Bảng giá nhanh, đủ thông tin để theo dõi trong phiên.' },
      { name: 'Bộ lọc & watchlist', volume: 780, positive: 74, trend: 3, quote: 'Muốn lọc theo ngành và lưu nhóm mã theo dõi.' },
      { name: 'Dữ liệu phân tích', volume: 430, positive: 69, trend: 1, quote: 'Cần thêm chỉ báo cơ bản ngay trên bảng giá.' },
    ],
    adoption: 72, businessImpact: 'Cao', insight: 'Dữ liệu thị trường được đánh giá tốt; khách mới vẫn thiếu hướng dẫn để chuyển từ xem sang chọn sản phẩm.', decision: 'Mở rộng', nextAction: 'Giữ cấu trúc hiện tại và thử gợi ý theo khẩu vị rủi ro cho khách mới.', evidence: [
      { source: 'App review', segment: 'Nhà đầu tư mới', quote: 'Nhiều thông tin nhưng chưa biết nên bắt đầu xem mã nào.', sentiment: 'neutral' },
      { source: 'Thumb feedback', segment: 'Khách active', quote: 'Bảng giá nhanh, đủ thông tin để theo dõi trong phiên.', sentiment: 'positive' },
    ],
  },
  {
    id: 'voc-bond', product: 'iBond', touchpointId: 'tp-bond', theme: 'Niềm tin sản phẩm', subtheme: 'Rủi ro & thanh khoản', owner: 'Wealth Squad', sources: ['Thumb feedback', 'Broker note', 'Support'], responses: 411, positive: 73, neutral: 0, negative: 27, trend: -8, trendPoints: [81, 80, 78, 77, 75, 73],
    monthly: monthly([83, 82, 82, 81, 80, 80, 81, 80, 78, 77, 75, 73], [26, 28, 30, 31, 33, 35, 36, 38, 40, 42, 45, 47]),
    subthemes: [
      { name: 'Rủi ro & thanh khoản', volume: 176, positive: 64, trend: -10, quote: 'Khách hỏi nhiều về phương án bán lại trước hạn nhưng màn sản phẩm chưa trả lời rõ.' },
      { name: 'So sánh lợi suất', volume: 120, positive: 85, trend: 2, quote: 'So sánh lợi suất giữa các mã khá thuận tiện.' },
      { name: 'Điều khoản & phí', volume: 68, positive: 66, trend: -6, quote: 'Phí bán lại trước hạn chưa được nêu rõ ràng.' },
      { name: 'Kỳ hạn & tất toán', volume: 47, positive: 70, trend: -3, quote: 'Chưa rõ khi đến hạn tiền về tài khoản trong bao lâu.' },
    ],
    adoption: 18, businessImpact: 'Cao', insight: 'Lợi suất tạo quan tâm, nhưng cách giải thích rủi ro và thanh khoản đang làm giảm niềm tin trước quyết định mua.', decision: 'Cải thiện', nextAction: 'Ưu tiên risk explainer và kịch bản thanh khoản trước khi tăng traffic.', evidence: [
      { source: 'Broker note', segment: 'Khách affluent', quote: 'Khách hỏi nhiều về phương án bán lại trước hạn nhưng màn sản phẩm chưa trả lời rõ.', sentiment: 'negative' },
      { source: 'Thumb feedback', segment: 'Khách active', quote: 'So sánh lợi suất giữa các mã khá thuận tiện.', sentiment: 'positive' },
    ],
  },
  {
    id: 'voc-margin', product: 'Margin', touchpointId: 'tp-margin-reg', theme: 'Minh bạch chi phí', subtheme: 'Lãi vay & margin call', owner: 'Wealth Squad', sources: ['In-app survey', 'Support'], responses: 218, positive: 62, neutral: 23, negative: 15, trend: -5, trendPoints: [71, 70, 68, 66, 64, 62],
    monthly: monthly([74, 73, 72, 71, 71, 70, 71, 70, 68, 66, 64, 62], [14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24]),
    subthemes: [
      { name: 'Lãi vay & margin call', volume: 96, positive: 55, trend: -8, quote: 'Tôi chưa biết số tiền lãi thực trả nếu giữ vị thế trong một tháng.' },
      { name: 'Điều kiện cấp margin', volume: 62, positive: 66, trend: -3, quote: 'Không rõ danh mục nào được cấp và tỷ lệ bao nhiêu.' },
      { name: 'Cảnh báo rủi ro', volume: 38, positive: 68, trend: -2, quote: 'Cần ví dụ cụ thể khi tỷ lệ tài sản giảm thì hệ thống xử lý thế nào.' },
      { name: 'Tổng chi phí', volume: 22, positive: 60, trend: -4, quote: 'Muốn xem tổng chi phí gộp trước khi mở vị thế.' },
    ],
    adoption: 27, businessImpact: 'Cao', insight: 'Nhóm active thấy sản phẩm hữu ích; khách mới chưa hiểu tổng chi phí và điều kiện margin call.', decision: 'Cải thiện', nextAction: 'A/B test bảng tổng chi phí và mô phỏng margin call trước bước đăng ký.', evidence: [
      { source: 'In-app survey', segment: 'Khách mới', quote: 'Tôi chưa biết số tiền lãi thực trả nếu giữ vị thế trong một tháng.', sentiment: 'negative' },
      { source: 'Support', segment: 'Khách active', quote: 'Cần ví dụ cụ thể khi tỷ lệ tài sản giảm thì hệ thống xử lý thế nào.', sentiment: 'neutral' },
    ],
  },
  {
    id: 'voc-first-trade', product: 'Sau giao dịch đầu', touchpointId: 'tp-portfolio-first', theme: 'Kích hoạt', subtheme: 'Bước tiếp theo', owner: 'Activation Squad', sources: ['In-app survey', 'Thumb feedback'], responses: 386, positive: 68, neutral: 20, negative: 12, trend: 9, trendPoints: [54, 57, 60, 62, 65, 68],
    monthly: monthly([50, 52, 53, 54, 55, 56, 54, 57, 60, 62, 65, 68], [20, 22, 24, 26, 28, 30, 31, 33, 35, 37, 40, 42]),
    subthemes: [
      { name: 'Bước tiếp theo', volume: 168, positive: 60, trend: 6, quote: 'Đặt lệnh xong thấy yên tâm, nhưng chưa biết nên theo dõi danh mục ở đâu.' },
      { name: 'Xác nhận giao dịch', volume: 120, positive: 84, trend: 10, quote: 'Xác nhận rõ ràng, dễ biết lệnh đã hoàn tất.' },
      { name: 'Theo dõi danh mục', volume: 62, positive: 66, trend: 7, quote: 'Muốn có nơi xem lời lỗ danh mục dễ hiểu hơn.' },
      { name: 'Gợi ý sau giao dịch', volume: 36, positive: 62, trend: 4, quote: 'Sau khi mua nên gợi ý mã liên quan để tham khảo.' },
    ],
    adoption: 43, businessImpact: 'Trung bình', insight: 'Khoảnh khắc hoàn tất tạo cảm xúc tốt, nhưng chưa dẫn khách tới hành động có giá trị tiếp theo.', decision: 'Mở rộng', nextAction: 'Triển khai celebration cùng next-best-action và đo giao dịch thứ hai.', evidence: [
      { source: 'In-app survey', segment: 'First-time investor', quote: 'Đặt lệnh xong thấy yên tâm, nhưng chưa biết nên theo dõi danh mục ở đâu.', sentiment: 'neutral' },
      { source: 'Thumb feedback', segment: 'First-time investor', quote: 'Xác nhận rõ ràng, dễ biết lệnh đã hoàn tất.', sentiment: 'positive' },
    ],
  },
  {
    id: 'voc-dca', product: 'Tích lũy DCA', touchpointId: 'tp-dca', theme: 'Product-market fit', subtheme: 'Mục tiêu tích lũy', owner: 'Wealth Squad', sources: ['In-app survey'], responses: 34, positive: 53, neutral: 29, negative: 18, trend: 2, trendPoints: [48, 51, 49, 50, 51, 53],
    monthly: monthly([47, 48, 49, 48, 50, 49, 48, 51, 49, 50, 51, 53], [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]),
    subthemes: [
      { name: 'Mục tiêu tích lũy', volume: 16, positive: 52, trend: 2, quote: 'Ý tưởng phù hợp nhưng tôi muốn biết có thể dừng kế hoạch bất kỳ lúc nào không.' },
      { name: 'Tần suất & linh hoạt', volume: 12, positive: 55, trend: 3, quote: 'Muốn tùy chỉnh tần suất nạp theo lương.' },
      { name: 'Kết quả kỳ vọng', volume: 6, positive: 50, trend: 1, quote: 'Chưa hình dung được lợi ích dài hạn ra sao.' },
    ],
    adoption: 6, businessImpact: 'Thăm dò', insight: 'Tín hiệu ban đầu chưa đủ đại diện để kết luận nhu cầu hoặc product-market fit.', decision: 'Khảo sát thêm', nextAction: 'Thu tối thiểu 200 phản hồi từ cohort có mục tiêu tích lũy dài hạn.', evidence: [
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
