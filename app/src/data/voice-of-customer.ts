export type FeedbackMethod = 'Thumb up/down' | 'Survey 1–5';
export type VoiceDecision = 'Mở rộng' | 'Cải thiện' | 'Khảo sát thêm';

export interface ProductVoice {
  id: string;
  product: string;
  touchpointId: string;
  method: FeedbackMethod;
  responses: number;
  positive: number;
  neutral: number;
  negative: number;
  score: number;
  insight: string;
  decision: VoiceDecision;
  nextAction: string;
}

export const PRODUCT_VOICE: ProductVoice[] = [
  { id: 'voc-referral', product: 'Giới thiệu bạn bè', touchpointId: 'tp-referral', method: 'Thumb up/down', responses: 724, positive: 81, neutral: 0, negative: 19, score: 81, insight: 'Khách thích thao tác chia sẻ nhanh; phần theo dõi thưởng còn khó hiểu.', decision: 'Mở rộng', nextAction: 'Mở rộng cohort và làm rõ trạng thái nhận thưởng.' },
  { id: 'voc-market', product: 'Bảng giá & khám phá sản phẩm', touchpointId: 'tp-market', method: 'Thumb up/down', responses: 4180, positive: 76, neutral: 0, negative: 24, score: 76, insight: 'Thông tin hữu ích nhưng khách mới vẫn khó chọn sản phẩm phù hợp.', decision: 'Mở rộng', nextAction: 'Giữ layout, thử nghiệm gợi ý theo khẩu vị rủi ro.' },
  { id: 'voc-bond', product: 'iBond', touchpointId: 'tp-bond', method: 'Thumb up/down', responses: 411, positive: 73, neutral: 0, negative: 27, score: 73, insight: 'Khách quan tâm lợi suất nhưng chưa tự tin về rủi ro và thanh khoản.', decision: 'Cải thiện', nextAction: 'Đơn giản hóa giải thích rủi ro trước khi tăng traffic.' },
  { id: 'voc-margin', product: 'Margin', touchpointId: 'tp-margin-reg', method: 'Survey 1–5', responses: 218, positive: 62, neutral: 23, negative: 15, score: 69, insight: 'Nhóm active đánh giá tốt; khách mới chưa hiểu chi phí và margin call.', decision: 'Cải thiện', nextAction: 'A/B test bảng chi phí và ví dụ margin call.' },
  { id: 'voc-first-trade', product: 'Trải nghiệm sau giao dịch đầu', touchpointId: 'tp-portfolio-first', method: 'Survey 1–5', responses: 386, positive: 68, neutral: 20, negative: 12, score: 72, insight: 'Khoảnh khắc hoàn tất được ghi nhận tốt nhưng next-best-action chưa rõ.', decision: 'Mở rộng', nextAction: 'Triển khai lời chúc mừng và CTA bước tiếp theo.' },
  { id: 'voc-dca', product: 'Tích lũy DCA', touchpointId: 'tp-dca', method: 'Survey 1–5', responses: 34, positive: 53, neutral: 29, negative: 18, score: 58, insight: 'Mẫu phản hồi quá nhỏ để kết luận product-market fit.', decision: 'Khảo sát thêm', nextAction: 'Thu tối thiểu 200 phản hồi từ đúng cohort mục tiêu.' },
];
