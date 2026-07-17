import type { KPI, Phase, POTask } from '@/types/cxm';

// =====================================================
// KPI REGISTRY — thước đo trải nghiệm & kinh doanh
// =====================================================
export const KPIS: KPI[] = [
  { id: 'kpi-cpl', name: 'Chi phí trên lead (CPL)', formula: 'Chi phí marketing / Số lead', value: '86K', target: '≤ 95K', unit: 'đ', trend: 'down', trendValue: '-12% MoM', trendGood: true, owner: 'Growth', category: 'revenue', criticality: 'supporting' },
  { id: 'kpi-referral-rate', name: 'Tỷ lệ giới thiệu bạn bè', formula: 'TK mở từ referral / Tổng TK mở', value: '9,4%', target: '12%', unit: '%', trend: 'up', trendValue: '+1,8pt QoQ', trendGood: true, owner: 'Growth', category: 'conversion', criticality: 'core' },
  { id: 'kpi-visit-lead', name: 'CR Visit → Lead', formula: 'Lead form submitted / Unique visitors', value: '4,1%', target: '5%', unit: '%', trend: 'flat', trendValue: '±0,1pt', trendGood: true, owner: 'Growth', category: 'conversion', criticality: 'supporting' },
  { id: 'kpi-ekyc-completion', name: 'Tỷ lệ hoàn tất eKYC', formula: 'Account approved / Onboarding started', value: '61%', target: '72%', unit: '%', trend: 'up', trendValue: '+4pt QoQ', trendGood: true, owner: 'Onboarding Squad', category: 'conversion', criticality: 'north-star' },
  { id: 'kpi-time-to-open', name: 'Thời gian mở TK (trung vị)', formula: 'p50(account_approved − onboarding_started)', value: '14m 20s', target: '≤ 10m', unit: '', trend: 'down', trendValue: '-2m QoQ', trendGood: true, owner: 'Onboarding Squad', category: 'ops', criticality: 'core' },
  { id: 'kpi-approval-sla', name: 'SLA xét duyệt hồ sơ', formula: '% hồ sơ duyệt trong 4h làm việc', value: '88%', target: '95%', unit: '%', trend: 'up', trendValue: '+3pt', trendGood: true, owner: 'Ops', category: 'ops', criticality: 'core' },
  { id: 'kpi-activation-7d', name: 'Activation rate (7 ngày)', formula: '% TK nạp tiền lần đầu trong 7 ngày sau duyệt', value: '44%', target: '55%', unit: '%', trend: 'up', trendValue: '+5pt QoQ', trendGood: true, owner: 'Activation Squad', category: 'conversion', criticality: 'north-star' },
  { id: 'kpi-ftd-amount', name: 'Giá trị FTD trung vị', formula: 'p50(first deposit value)', value: '12,5tr', target: '15tr', unit: 'đ', trend: 'up', trendValue: '+8% MoM', trendGood: true, owner: 'Activation Squad', category: 'revenue', criticality: 'core' },
  { id: 'kpi-deposit-success', name: 'Tỷ lệ nạp tiền thành công', formula: 'deposit_success / deposit_initiated', value: '93,2%', target: '97%', unit: '%', trend: 'down', trendValue: '-0,8pt MoM', trendGood: false, owner: 'Payments', category: 'ops', criticality: 'core' },
  { id: 'kpi-time-first-trade', name: 'Thời gian đến lệnh đầu tiên', formula: 'p50(first order_matched − account_approved)', value: '5,2 ngày', target: '≤ 3 ngày', unit: '', trend: 'down', trendValue: '-0,6 ngày', trendGood: true, owner: 'Activation Squad', category: 'conversion', criticality: 'core' },
  { id: 'kpi-first-trade-30d', name: '% KH giao dịch trong 30 ngày', formula: 'TK có ≥1 lệnh khớp trong 30d / TK mở mới', value: '38%', target: '48%', unit: '%', trend: 'flat', trendValue: '+0,4pt', trendGood: true, owner: 'Activation Squad', category: 'conversion', criticality: 'north-star' },
  { id: 'kpi-order-success', name: 'Tỷ lệ đặt lệnh thành công', formula: '1 − order_place_failed / order_placed', value: '98,7%', target: '≥ 99%', unit: '%', trend: 'flat', trendValue: '±0,05pt', trendGood: true, owner: 'Trading Core', category: 'ops', criticality: 'core' },
  { id: 'kpi-order-latency', name: 'Latency khớp lệnh p95', formula: 'p95(order_matched − order_placed)', value: '—', target: '≤ 250ms', unit: '', trend: 'flat', trendValue: 'Chưa đo', trendGood: false, owner: 'Trading Core', category: 'ops', criticality: 'core' },
  { id: 'kpi-dau-mau', name: 'Độ dính DAU/MAU', formula: 'DAU / MAU', value: '23%', target: '28%', unit: '%', trend: 'up', trendValue: '+1,2pt', trendGood: true, owner: 'Engagement Squad', category: 'engagement', criticality: 'north-star' },
  { id: 'kpi-orders-per-user', name: 'Số lệnh / KH / tháng', formula: 'Tổng lệnh khớp / KH active', value: '6,8', target: '8', unit: 'lệnh', trend: 'up', trendValue: '+0,5', trendGood: true, owner: 'Engagement Squad', category: 'engagement', criticality: 'core' },
  { id: 'kpi-withdraw-success', name: 'Tỷ lệ rút tiền thành công', formula: 'withdraw_success / withdraw_initiated', value: '96,1%', target: '≥ 98%', unit: '%', trend: 'flat', trendValue: '±0,2pt', trendGood: true, owner: 'Payments', category: 'ops', criticality: 'core' },
  { id: 'kpi-margin-uptake', name: 'Tỷ lệ đăng ký margin', formula: 'TK có margin active / TK đủ điều kiện', value: '17%', target: '22%', unit: '%', trend: 'up', trendValue: '+1,5pt', trendGood: true, owner: 'Wealth Squad', category: 'revenue', criticality: 'core' },
  { id: 'kpi-margin-balance', name: 'Dư nợ margin bình quân', formula: 'Tổng dư nợ margin EOM', value: '9,8K tỷ', target: '11K tỷ', unit: 'đ', trend: 'up', trendValue: '+6% QoQ', trendGood: true, owner: 'Wealth Squad', category: 'revenue', criticality: 'north-star' },
  { id: 'kpi-cross-sell', name: 'Cross-sell rate', formula: '% KH dùng ≥2 sản phẩm (CK cơ sở, trái phiếu, CCQ, phái sinh)', value: '21%', target: '30%', unit: '%', trend: 'up', trendValue: '+2pt QoQ', trendGood: true, owner: 'Wealth Squad', category: 'revenue', criticality: 'north-star' },
  { id: 'kpi-dca-retention', name: 'DCA retention 6 tháng', formula: '% kế hoạch DCA còn duy trì sau 6 tháng', value: '—', target: '≥ 60%', unit: '%', trend: 'flat', trendValue: 'Chưa đo', trendGood: false, owner: 'Wealth Squad', category: 'engagement', criticality: 'core' },
  { id: 'kpi-nps', name: 'NPS tổng thể', formula: '%Promoter − %Detractor (khảo sát quý)', value: '42', target: '50', unit: 'điểm', trend: 'up', trendValue: '+3 điểm', trendGood: true, owner: 'CX Team', category: 'satisfaction', criticality: 'north-star' },
  { id: 'kpi-csat', name: 'CSAT sau hỗ trợ', formula: '% đánh giá 4–5 sao sau ticket', value: '—', target: '≥ 90%', unit: '%', trend: 'flat', trendValue: 'Chưa đo', trendGood: false, owner: 'CX Team', category: 'satisfaction', criticality: 'core' },
  { id: 'kpi-churn', name: 'Churn rate 90 ngày', formula: '% KH không giao dịch & không đăng nhập 90 ngày', value: '18%', target: '≤ 14%', unit: '%', trend: 'down', trendValue: '-1,1pt', trendGood: true, owner: 'Retention Squad', category: 'risk', criticality: 'core' },
  { id: 'kpi-reactivation', name: 'Reactivation rate', formula: '% KH churn quay lại giao dịch trong 30d sau campaign', value: '7,2%', target: '10%', unit: '%', trend: 'up', trendValue: '+0,9pt', trendGood: true, owner: 'Retention Squad', category: 'conversion', criticality: 'supporting' },
  { id: 'kpi-fcr', name: 'First Contact Resolution', formula: '% ticket xử lý xong ở lần tiếp xúc đầu', value: '71%', target: '80%', unit: '%', trend: 'up', trendValue: '+2pt', trendGood: true, owner: 'CX Team', category: 'satisfaction', criticality: 'supporting' },
];

export const kpiById = (id: string): KPI | undefined => KPIS.find((k) => k.id === id);

// =====================================================
// JOURNEY TREE — Giai đoạn ▸ Flow ▸ Stage ▸ Touchpoint ▸ Event
// =====================================================
export const PHASES: Phase[] = [
  {
    id: 'p1',
    code: 'G1',
    name: 'Nhận biết & Tiếp cận',
    description: 'Khách hàng tiềm năng biết đến VNDIRECT qua marketing, nội dung và referral; để lại thông tin lead.',
    color: '#38bdf8',
    northStarKpiId: 'kpi-visit-lead',
    flows: [
      {
        id: 'f1',
        name: 'Marketing & Thu hút lead',
        owner: 'Growth',
        description: 'Phễu acquisition từ quảng cáo, landing page và chương trình giới thiệu.',
        stages: [
          {
            id: 's1-1',
            name: 'Tiếp cận quảng cáo & nội dung',
            description: 'Người dùng xem quảng cáo, bài viết, video và landing page chiến dịch.',
            touchpoints: [
              {
                id: 'tp-landing',
                name: 'Landing page chiến dịch',
                channel: 'web',
                description: 'Trang đích của chiến dịch marketing (vndirect.com.vn/*).',
                owner: 'Growth',
                dailyUsers: 18500,
                revenueImpact: 4,
                events: [
                  { id: 'ev-page-view', name: 'campaign_page_viewed', description: 'Xem trang chiến dịch kèm UTM', status: 'live', platforms: ['web'], owner: 'Growth', kpiIds: ['kpi-visit-lead'], volumePerDay: 21400, lastSeen: '2 phút trước' },
                  { id: 'ev-cta-click', name: 'open_account_cta_clicked', description: 'Click nút "Mở tài khoản"', status: 'live', platforms: ['web'], owner: 'Growth', kpiIds: ['kpi-visit-lead'], volumePerDay: 1730, lastSeen: '1 phút trước' },
                  { id: 'ev-utm-capture', name: 'utm_attribution_captured', description: 'Ghi nhận nguồn UTM vào CDP', status: 'live', platforms: ['server'], owner: 'Data Platform', kpiIds: ['kpi-cpl'], volumePerDay: 20900, lastSeen: '5 phút trước' },
                ],
              },
              {
                id: 'tp-referral',
                name: 'Màn hình giới thiệu bạn bè',
                channel: 'app',
                description: 'Tính năng referral trong app — tạo link, chia sẻ, theo dõi thưởng.',
                owner: 'Growth',
                dailyUsers: 3200,
                revenueImpact: 6,
                events: [
                  { id: 'ev-ref-create', name: 'referral_link_created', description: 'Tạo mã/link giới thiệu', status: 'live', platforms: ['ios', 'android'], owner: 'Growth', kpiIds: ['kpi-referral-rate'], volumePerDay: 940, lastSeen: '3 phút trước' },
                  { id: 'ev-ref-share', name: 'referral_link_shared', description: 'Chia sẻ link qua Zalo/FB/Messenger', status: 'live', platforms: ['ios', 'android'], owner: 'Growth', kpiIds: ['kpi-referral-rate'], volumePerDay: 610, lastSeen: '8 phút trước' },
                  { id: 'ev-ref-click', name: 'referral_link_clicked', description: 'Người được giới thiệu click link', status: 'validating', platforms: ['web'], owner: 'Growth', kpiIds: ['kpi-referral-rate'], volumePerDay: 450, lastSeen: '1 giờ trước' },
                ],
              },
            ],
          },
          {
            id: 's1-2',
            name: 'Đăng ký lead',
            description: 'Người dùng để lại SĐT/email để được tư vấn hoặc mở tài khoản.',
            touchpoints: [
              {
                id: 'tp-leadform',
                name: 'Form đăng ký tư vấn',
                channel: 'web',
                description: 'Form lead trên landing page & fanpage.',
                owner: 'Growth',
                dailyUsers: 760,
                revenueImpact: 5,
                events: [
                  { id: 'ev-lead-submit', name: 'lead_form_submitted', description: 'Submit form SĐT + nhu cầu', status: 'live', platforms: ['web'], owner: 'Growth', kpiIds: ['kpi-visit-lead', 'kpi-cpl'], volumePerDay: 720, lastSeen: '4 phút trước' },
                  { id: 'ev-lead-crm', name: 'lead_synced_to_crm', description: 'Đồng bộ lead sang CRM cho telesales', status: 'designed', platforms: ['crm', 'server'], owner: 'Data Platform', kpiIds: ['kpi-cpl'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p2',
    code: 'G2',
    name: 'Mở tài khoản & eKYC',
    description: 'Hành trình onboarding: xác thực danh tính điện tử, ký hợp đồng và cấp tài khoản giao dịch.',
    color: '#a78bfa',
    northStarKpiId: 'kpi-ekyc-completion',
    flows: [
      {
        id: 'f2',
        name: 'eKYC mở tài khoản',
        owner: 'Onboarding Squad',
        description: 'Luồng mở tài khoản 100% online trên app, 6 bước từ SĐT đến cấp tài khoản.',
        stages: [
          {
            id: 's2-1',
            name: 'Khởi tạo & xác thực SĐT',
            description: 'Nhập số điện thoại, nhận và xác thực OTP.',
            touchpoints: [
              {
                id: 'tp-otp',
                name: 'Màn nhập SĐT & OTP',
                channel: 'app',
                description: 'Bước đầu tiên của onboarding trên mobile app.',
                owner: 'Onboarding Squad',
                dailyUsers: 2900,
                revenueImpact: 7,
                events: [
                  { id: 'ev-onb-start', name: 'onboarding_started', description: 'Bắt đầu luồng mở tài khoản', status: 'live', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion', 'kpi-time-to-open'], volumePerDay: 2880, lastSeen: '1 phút trước' },
                  { id: 'ev-otp-sent', name: 'otp_sent', description: 'Gửi OTP thành công', status: 'live', platforms: ['server'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 2750, lastSeen: '1 phút trước' },
                  { id: 'ev-otp-ok', name: 'otp_verified', description: 'Xác thực OTP thành công', status: 'live', platforms: ['server'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 2610, lastSeen: '2 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's2-2',
            name: 'Chụp giấy tờ tùy thân',
            description: 'Chụp CCCD/CMND mặt trước/sau, OCR trích xuất thông tin.',
            touchpoints: [
              {
                id: 'tp-idcapture',
                name: 'Camera chụp CCCD + OCR',
                channel: 'app',
                description: 'SDK camera eKYC chụp giấy tờ, chấm điểm chất lượng ảnh.',
                owner: 'Onboarding Squad',
                dailyUsers: 2550,
                revenueImpact: 8,
                events: [
                  { id: 'ev-id-front', name: 'id_front_captured', description: 'Chụp mặt trước CCCD thành công', status: 'live', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion', 'kpi-time-to-open'], volumePerDay: 2380, lastSeen: '2 phút trước' },
                  { id: 'ev-id-back', name: 'id_back_captured', description: 'Chụp mặt sau CCCD thành công', status: 'live', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion', 'kpi-time-to-open'], volumePerDay: 2310, lastSeen: '3 phút trước' },
                  { id: 'ev-ocr-ok', name: 'id_ocr_confidence_scored', description: 'Điểm confidence của OCR theo trường dữ liệu', status: 'validating', platforms: ['server'], owner: 'Data Platform', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 2290, lastSeen: '30 phút trước' },
                  { id: 'ev-id-fail', name: 'id_capture_failed', description: 'Chụp thất bại quá 3 lần (mờ, chói, sai giấy tờ)', status: 'gap', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's2-3',
            name: 'Xác thực khuôn mặt',
            description: 'Liveness detection và đối sánh khuôn mặt với CCCD.',
            touchpoints: [
              {
                id: 'tp-liveness',
                name: 'Liveness & Face match',
                channel: 'app',
                description: 'Quay video selfie / cử động theo hướng dẫn.',
                owner: 'Onboarding Squad',
                dailyUsers: 2280,
                revenueImpact: 8,
                events: [
                  { id: 'ev-live-start', name: 'liveness_started', description: 'Bắt đầu bước xác thực khuôn mặt', status: 'live', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 2260, lastSeen: '2 phút trước' },
                  { id: 'ev-live-pass', name: 'liveness_passed', description: 'Vượt qua liveness + face match', status: 'live', platforms: ['server'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 2080, lastSeen: '2 phút trước' },
                  { id: 'ev-live-fail', name: 'liveness_failed', description: 'Thất bại kèm mã lỗi (ánh sáng, giả mạo, mismatch)', status: 'gap', platforms: ['server'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's2-4',
            name: 'Bổ sung thông tin cá nhân',
            description: 'Nghề nghiệp, thu nhập, địa chỉ, ngườoi thụ hưởng, FATCA.',
            touchpoints: [
              {
                id: 'tp-profile-form',
                name: 'Form thông tin bổ sung',
                channel: 'app',
                description: 'Form động nhiều bước trên app.',
                owner: 'Onboarding Squad',
                dailyUsers: 2050,
                revenueImpact: 5,
                events: [
                  { id: 'ev-profile-done', name: 'profile_form_completed', description: 'Hoàn tất form thông tin bổ sung', status: 'live', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion', 'kpi-time-to-open'], volumePerDay: 1940, lastSeen: '4 phút trước' },
                  { id: 'ev-fatca', name: 'fatca_declared', description: 'Khai báo FATCA (Mỹ/không Mỹ)', status: 'designed', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's2-5',
            name: 'Ký hợp đồng điện tử',
            description: 'Xem và ký hợp đồng mở tài khoản bằng chữ ký số/OTP.',
            touchpoints: [
              {
                id: 'tp-contract',
                name: 'Ký HĐ điện tử (CA)',
                channel: 'app',
                description: 'Màn xem hợp đồng + ký qua SmartCA/OTP.',
                owner: 'Onboarding Squad',
                dailyUsers: 1900,
                revenueImpact: 9,
                events: [
                  { id: 'ev-contract-view', name: 'contract_viewed', description: 'Mở xem hợp đồng (đo thởi gian đọc)', status: 'validating', platforms: ['ios', 'android'], owner: 'Onboarding Squad', kpiIds: ['kpi-time-to-open'], volumePerDay: 1870, lastSeen: '45 phút trước' },
                  { id: 'ev-contract-sign', name: 'contract_signed', description: 'Ký hợp đồng thành công', status: 'live', platforms: ['server'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion', 'kpi-time-to-open'], volumePerDay: 1810, lastSeen: '3 phút trước' },
                  { id: 'ev-sign-fail', name: 'contract_sign_failed', description: 'Ký thất bại (hết phiên CA, OTP sai, user bỏ ngang)', status: 'gap', platforms: ['server'], owner: 'Onboarding Squad', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's2-6',
            name: 'Xét duyệt & cấp tài khoản',
            description: 'Back-office kiểm tra hồ sơ, đối chiếu và duyệt cấp tài khoản.',
            touchpoints: [
              {
                id: 'tp-backoffice',
                name: 'Hệ thống xét duyệt (Back-office)',
                channel: 'backend',
                description: 'Queue duyệt hồ sơ của Ops, auto-approve nếu đủ tin cậy.',
                owner: 'Ops',
                dailyUsers: 1810,
                revenueImpact: 9,
                events: [
                  { id: 'ev-acc-ok', name: 'account_approved', description: 'Hồ sơ được duyệt, cấp số tài khoản', status: 'live', platforms: ['server'], owner: 'Ops', kpiIds: ['kpi-ekyc-completion', 'kpi-approval-sla', 'kpi-time-to-open', 'kpi-activation-7d'], volumePerDay: 1760, lastSeen: '1 phút trước' },
                  { id: 'ev-acc-reject', name: 'account_rejected', description: 'Hồ sơ bị từ chối kèm lý do', status: 'live', platforms: ['server'], owner: 'Ops', kpiIds: ['kpi-ekyc-completion'], volumePerDay: 120, lastSeen: '6 phút trước' },
                  { id: 'ev-sla-breach', name: 'approval_sla_breached', description: 'Hồ sơ chờ duyệt quá 4h làm việc', status: 'designed', platforms: ['server'], owner: 'Ops', kpiIds: ['kpi-approval-sla'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p3',
    code: 'G3',
    name: 'Kích hoạt & Nạp tiền đầu',
    description: 'Sau khi có tài khoản: liên kết ngân hàng, thực hiện giao dịch nạp tiền đầu tiên (FTD).',
    color: '#34d399',
    northStarKpiId: 'kpi-activation-7d',
    flows: [
      {
        id: 'f3',
        name: 'Nạp tiền lần đầu (FTD)',
        owner: 'Activation Squad',
        description: 'Luồng kích hoạt tài khoản bằng giao dịch nạp tiền đầu tiên.',
        stages: [
          {
            id: 's3-1',
            name: 'Liên kết tài khoản ngân hàng',
            description: 'Chọn ngân hàng và xác thực liên kết để nạp/rút.',
            touchpoints: [
              {
                id: 'tp-banklink',
                name: 'Màn liên kết ngân hàng',
                channel: 'app',
                description: 'Chọn từ 20+ ngân hàng nội địa, xác thực chủ TK trùng tên.',
                owner: 'Activation Squad',
                dailyUsers: 1450,
                revenueImpact: 8,
                events: [
                  { id: 'ev-bl-start', name: 'bank_link_started', description: 'Bắt đầu liên kết ngân hàng', status: 'live', platforms: ['ios', 'android'], owner: 'Activation Squad', kpiIds: ['kpi-activation-7d'], volumePerDay: 1390, lastSeen: '3 phút trước' },
                  { id: 'ev-bl-ok', name: 'bank_link_success', description: 'Liên kết thành công', status: 'live', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-activation-7d'], volumePerDay: 1180, lastSeen: '3 phút trước' },
                  { id: 'ev-bl-fail', name: 'bank_link_failed', description: 'Liên kết thất bại kèm mã lỗi ngân hàng', status: 'gap', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-activation-7d', 'kpi-deposit-success'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's3-2',
            name: 'Tạo lệnh nạp tiền',
            description: 'Nhập số tiền, chọn phương thức (chuyển khoản định danh, Napas, QR).',
            touchpoints: [
              {
                id: 'tp-deposit',
                name: 'Màn nạp tiền',
                channel: 'app',
                description: 'Vé nạp tiền với gợi ý mệnh giá và hướng dẫn chuyển khoản định danh.',
                owner: 'Activation Squad',
                dailyUsers: 1620,
                revenueImpact: 10,
                events: [
                  { id: 'ev-dep-init', name: 'deposit_initiated', description: 'Tạo lệnh nạp tiền', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Payments', kpiIds: ['kpi-activation-7d', 'kpi-deposit-success', 'kpi-ftd-amount'], volumePerDay: 1590, lastSeen: '1 phút trước' },
                  { id: 'ev-dep-method', name: 'deposit_method_selected', description: 'Chọn phương thức nạp', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Payments', kpiIds: ['kpi-deposit-success'], volumePerDay: 1560, lastSeen: '2 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's3-3',
            name: 'Hoàn tất giao dịch nạp',
            description: 'Nhận tiền vào tiểu khoản qua callback ngân hàng/Napas.',
            touchpoints: [
              {
                id: 'tp-payment-gw',
                name: 'Cổng thanh toán & đối soát',
                channel: 'backend',
                description: 'Payment gateway nhận callback, ghi có tiểu khoản, đối soát T+0.',
                owner: 'Payments',
                dailyUsers: 1510,
                revenueImpact: 10,
                events: [
                  { id: 'ev-dep-ok', name: 'deposit_success', description: 'Nạp tiền thành công, tiền về tiểu khoản', status: 'live', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-activation-7d', 'kpi-deposit-success', 'kpi-ftd-amount'], volumePerDay: 1480, lastSeen: '1 phút trước' },
                  { id: 'ev-dep-fail', name: 'deposit_failed', description: 'Nạp thất bại (sai nội dung, timeout ngân hàng)', status: 'live', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-deposit-success'], volumePerDay: 108, lastSeen: '9 phút trước' },
                  { id: 'ev-dep-stuck', name: 'deposit_stuck_detected', description: 'Giao dịch treo > 15 phút chưa ghi có', status: 'designed', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-deposit-success'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's3-4',
            name: 'Kích hoạt qua thông báo',
            description: 'Push/email nhắc KH chưa nạp tiền sau 24h/72h/7 ngày.',
            touchpoints: [
              {
                id: 'tp-push-ftd',
                name: 'Chiến dịch push kích hoạt',
                channel: 'push',
                description: 'Chuỗi push nhắc FTD với deep-link về màn nạp tiền.',
                owner: 'Activation Squad',
                dailyUsers: 8900,
                revenueImpact: 6,
                events: [
                  { id: 'ev-push-sent', name: 'ftd_reminder_push_sent', description: 'Gửi push nhắc nạp tiền', status: 'live', platforms: ['server'], owner: 'Activation Squad', kpiIds: ['kpi-activation-7d'], volumePerDay: 8600, lastSeen: '12 phút trước' },
                  { id: 'ev-push-open', name: 'ftd_reminder_push_opened', description: 'Mở push và deep-link vào app', status: 'validating', platforms: ['ios', 'android'], owner: 'Activation Squad', kpiIds: ['kpi-activation-7d'], volumePerDay: 930, lastSeen: '2 giờ trước' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p4',
    code: 'G4',
    name: 'Giao dịch đầu tiên',
    description: 'Khoảnh khắc A-ha: khách hàng tìm mã, đặt và khớp lệnh chứng khoán đầu tiên.',
    color: '#fbbf24',
    northStarKpiId: 'kpi-first-trade-30d',
    flows: [
      {
        id: 'f4',
        name: 'Lệnh giao dịch đầu tiên',
        owner: 'Activation Squad',
        description: 'Từ khám phá thị trường đến khớp lệnh đầu tiên thành công.',
        stages: [
          {
            id: 's4-1',
            name: 'Khám phá mã cổ phiếu',
            description: 'Xem bảng giá, tìm kiếm mã, xem chi tiết doanh nghiệp.',
            touchpoints: [
              {
                id: 'tp-market',
                name: 'Bảng giá & tìm kiếm mã',
                channel: 'app',
                description: 'Màn thị trường: bảng giá realtime, top gainers, tìm kiếm.',
                owner: 'Engagement Squad',
                dailyUsers: 48000,
                revenueImpact: 6,
                events: [
                  { id: 'ev-mkt-view', name: 'market_screen_viewed', description: 'Xem màn thị trường/bảng giá', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau', 'kpi-first-trade-30d'], volumePerDay: 132000, lastSeen: '30 giây trước' },
                  { id: 'ev-sym-search', name: 'symbol_searched', description: 'Tìm kiếm mã chứng khoán', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-first-trade-30d'], volumePerDay: 38400, lastSeen: '1 phút trước' },
                  { id: 'ev-sym-detail', name: 'symbol_detail_viewed', description: 'Xem chi tiết mã (chart, thông tin DN)', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-first-trade-30d', 'kpi-dau-mau'], volumePerDay: 56700, lastSeen: '1 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's4-2',
            name: 'Đặt lệnh',
            description: 'Mở vé lệnh, nhập giá/khối lượng, xác nhận đặt lệnh.',
            touchpoints: [
              {
                id: 'tp-orderticket',
                name: 'Vé lệnh (Order ticket)',
                channel: 'app',
                description: 'Form đặt lệnh LO/MP/ATO/ATC với tính sức mua realtime.',
                owner: 'Trading Core',
                dailyUsers: 26500,
                revenueImpact: 10,
                events: [
                  { id: 'ev-ot-open', name: 'order_ticket_opened', description: 'Mở vé lệnh từ bảng giá/danh mục', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Trading Core', kpiIds: ['kpi-first-trade-30d', 'kpi-orders-per-user'], volumePerDay: 41800, lastSeen: '30 giây trước' },
                  { id: 'ev-order-placed', name: 'order_placed', description: 'Đặt lệnh thành công vào sở lệnh', status: 'live', platforms: ['server'], owner: 'Trading Core', kpiIds: ['kpi-order-success', 'kpi-first-trade-30d', 'kpi-orders-per-user', 'kpi-order-latency'], volumePerDay: 33600, lastSeen: '20 giây trước' },
                  { id: 'ev-order-fail', name: 'order_place_failed', description: 'Đặt lệnh thất bại (thiếu sức mua, sai giá, ngoài giờ)', status: 'live', platforms: ['server'], owner: 'Trading Core', kpiIds: ['kpi-order-success'], volumePerDay: 440, lastSeen: '3 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's4-3',
            name: 'Khớp lệnh & xác nhận',
            description: 'Lệnh được đẩy lên sở HOSE/HNX, khớp và gửi xác nhận về app.',
            touchpoints: [
              {
                id: 'tp-matching',
                name: 'Trading core & khớp lệnh',
                channel: 'backend',
                description: 'OMS kết nối sở giao dịch, nhận execution report.',
                owner: 'Trading Core',
                dailyUsers: 18200,
                revenueImpact: 10,
                events: [
                  { id: 'ev-matched', name: 'order_matched', description: 'Lệnh khớp (đầy đủ/một phần)', status: 'live', platforms: ['server'], owner: 'Trading Core', kpiIds: ['kpi-first-trade-30d', 'kpi-orders-per-user', 'kpi-order-latency', 'kpi-time-first-trade'], volumePerDay: 21400, lastSeen: '20 giây trước' },
                  { id: 'ev-rejected', name: 'order_rejected_by_exchange', description: 'Sở từ chối lệnh kèm mã lỗi', status: 'live', platforms: ['server'], owner: 'Trading Core', kpiIds: ['kpi-order-success'], volumePerDay: 96, lastSeen: '14 phút trước' },
                  { id: 'ev-latency', name: 'order_roundtrip_latency_measured', description: 'Đo latency đặt→khớp theo phiên và mã', status: 'designed', platforms: ['server'], owner: 'Trading Core', kpiIds: ['kpi-order-latency'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's4-4',
            name: 'Trải nghiệm sau khớp lệnh đầu',
            description: 'Xác nhận, chúc mừng giao dịch đầu tiên, gợi ý bước tiếp theo.',
            touchpoints: [
              {
                id: 'tp-portfolio-first',
                name: 'Danh mục sau giao dịch đầu',
                channel: 'app',
                description: 'Màn danh mục hiển thị vị thế đầu tiên + moment chúc mừng.',
                owner: 'Activation Squad',
                dailyUsers: 12400,
                revenueImpact: 5,
                events: [
                  { id: 'ev-pf-after', name: 'portfolio_viewed_after_first_trade', description: 'Xem danh mục ngay sau lệnh đầu', status: 'validating', platforms: ['ios', 'android'], owner: 'Activation Squad', kpiIds: ['kpi-first-trade-30d', 'kpi-dau-mau'], volumePerDay: 9100, lastSeen: '1 giờ trước' },
                  { id: 'ev-celebrate', name: 'first_trade_celebration_shown', description: 'Hiển thị animation chúc mừng + gợi ý next-best-action', status: 'gap', platforms: ['ios', 'android'], owner: 'Activation Squad', kpiIds: ['kpi-first-trade-30d'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p5',
    code: 'G5',
    name: 'Giao dịch & Đầu tư định kỳ',
    description: 'Thói quen hằng ngày: theo dõi thị trường, giao dịch, quản lý danh mục, nạp/rút và nội dung tư vấn.',
    color: '#22d3ee',
    northStarKpiId: 'kpi-dau-mau',
    flows: [
      {
        id: 'f5',
        name: 'Giao dịch thường xuyên',
        owner: 'Engagement Squad',
        description: 'Vòng đời phiên giao dịch định kỳ và quản lý tài sản.',
        stages: [
          {
            id: 's5-1',
            name: 'Phiên giao dịch hằng ngày',
            description: 'Đăng nhập, xem watchlist, đặt lệnh trong phiên.',
            touchpoints: [
              {
                id: 'tp-daily',
                name: 'Phiên app & watchlist',
                channel: 'app',
                description: 'Session giao dịch hằng ngày trên app và iBoard web.',
                owner: 'Engagement Squad',
                dailyUsers: 62000,
                revenueImpact: 9,
                events: [
                  { id: 'ev-session', name: 'trading_session_started', description: 'Phiên đăng nhập có xem bảng giá', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau'], volumePerDay: 148000, lastSeen: '10 giây trước' },
                  { id: 'ev-watchlist', name: 'watchlist_updated', description: 'Thêm/xóa mã khỏi watchlist', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau', 'kpi-orders-per-user'], volumePerDay: 8400, lastSeen: '2 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's5-2',
            name: 'Quản lý danh mục & báo cáo',
            description: 'Xem P&L, hiệu suất, tải sao kê và báo cáo thuế.',
            touchpoints: [
              {
                id: 'tp-portfolio',
                name: 'Màn danh mục & P&L',
                channel: 'app',
                description: 'Tổng quan NAV, P&L theo ngày/tháng, phân bổ tài sản.',
                owner: 'Engagement Squad',
                dailyUsers: 41000,
                revenueImpact: 6,
                events: [
                  { id: 'ev-pf-view', name: 'portfolio_viewed', description: 'Xem màn danh mục', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau'], volumePerDay: 68000, lastSeen: '40 giây trước' },
                  { id: 'ev-pnl', name: 'pnl_detail_viewed', description: 'Xem chi tiết lãi/lỗ theo mã', status: 'live', platforms: ['ios', 'android'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau'], volumePerDay: 12600, lastSeen: '3 phút trước' },
                  { id: 'ev-report-dl', name: 'statement_report_downloaded', description: 'Tải sao kê/báo cáo PDF', status: 'designed', platforms: ['web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's5-3',
            name: 'Rút tiền',
            description: 'Tạo lệnh rút về ngân hàng liên kết, xử lý trong ngày.',
            touchpoints: [
              {
                id: 'tp-withdraw',
                name: 'Màn rút tiền',
                channel: 'app',
                description: 'Vé rút tiền với kiểm tra sức mua T+ và hạn mức.',
                owner: 'Payments',
                dailyUsers: 5400,
                revenueImpact: 7,
                events: [
                  { id: 'ev-wd-init', name: 'withdraw_initiated', description: 'Tạo lệnh rút tiền', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Payments', kpiIds: ['kpi-withdraw-success'], volumePerDay: 5200, lastSeen: '2 phút trước' },
                  { id: 'ev-wd-ok', name: 'withdraw_success', description: 'Rút tiền thành công', status: 'live', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-withdraw-success'], volumePerDay: 5000, lastSeen: '4 phút trước' },
                  { id: 'ev-wd-fail', name: 'withdraw_failed', description: 'Rút thất bại (chưa đủ T+, sai hạn mức, lỗi ngân hàng)', status: 'gap', platforms: ['server'], owner: 'Payments', kpiIds: ['kpi-withdraw-success'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'f6',
        name: 'Nội dung & công cụ tư vấn',
        owner: 'Engagement Squad',
        description: 'Báo cáo phân tích, tin tức và cảnh báo giá giữ chân KH.',
        stages: [
          {
            id: 's5-4',
            name: 'Đọc phân tích & tin tức',
            description: 'Báo cáo ngành, khuyến nghị, tin thị trường trong app.',
            touchpoints: [
              {
                id: 'tp-research',
                name: 'Trung tâm phân tích',
                channel: 'app',
                description: 'Hub nội dung: báo cáo VCBS-style, tin tức, video phân tích.',
                owner: 'Engagement Squad',
                dailyUsers: 15600,
                revenueImpact: 4,
                events: [
                  { id: 'ev-research', name: 'research_report_viewed', description: 'Đọc báo cáo phân tích (đo scroll depth)', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau', 'kpi-orders-per-user'], volumePerDay: 9800, lastSeen: '5 phút trước' },
                  { id: 'ev-news', name: 'market_news_read', description: 'Đọc tin tức thị trường', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau'], volumePerDay: 21300, lastSeen: '2 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's5-5',
            name: 'Cảnh báo giá',
            description: 'Tạo alert giá/khối lượng, nhận push khi chạm ngưỡng.',
            touchpoints: [
              {
                id: 'tp-alert',
                name: 'Price alert',
                channel: 'push',
                description: 'Tạo và nhận cảnh báo giá realtime.',
                owner: 'Engagement Squad',
                dailyUsers: 8900,
                revenueImpact: 5,
                events: [
                  { id: 'ev-alert-create', name: 'price_alert_created', description: 'Tạo cảnh báo giá cho mã', status: 'live', platforms: ['ios', 'android'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau', 'kpi-orders-per-user'], volumePerDay: 3400, lastSeen: '6 phút trước' },
                  { id: 'ev-alert-fire', name: 'price_alert_triggered', description: 'Alert kích hoạt và gửi push', status: 'live', platforms: ['server'], owner: 'Engagement Squad', kpiIds: ['kpi-dau-mau'], volumePerDay: 11200, lastSeen: '1 phút trước' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p6',
    code: 'G6',
    name: 'Mở rộng sản phẩm',
    description: 'Cross-sell: margin, ứng trước, trái phiếu, chứng chỉ quỹ & tích lũy DCA.',
    color: '#fb7185',
    northStarKpiId: 'kpi-cross-sell',
    flows: [
      {
        id: 'f7',
        name: 'Margin & Ứng trước',
        owner: 'Wealth Squad',
        description: 'Sản phẩm tín dụng: đăng ký, sử dụng margin và ứng trước tiền bán.',
        stages: [
          {
            id: 's6-1',
            name: 'Đăng ký margin',
            description: 'Giới thiệu, đánh giá điều kiện và ký phụ lục margin.',
            touchpoints: [
              {
                id: 'tp-margin-reg',
                name: 'Màn đăng ký margin',
                channel: 'app',
                description: 'Giới thiệu margin + wizard đăng ký trong app.',
                owner: 'Wealth Squad',
                dailyUsers: 2100,
                revenueImpact: 9,
                events: [
                  { id: 'ev-mg-intro', name: 'margin_intro_viewed', description: 'Xem màn giới thiệu margin', status: 'live', platforms: ['ios', 'android'], owner: 'Wealth Squad', kpiIds: ['kpi-margin-uptake'], volumePerDay: 1980, lastSeen: '7 phút trước' },
                  { id: 'ev-mg-submit', name: 'margin_registration_submitted', description: 'Nộp đăng ký margin', status: 'validating', platforms: ['ios', 'android'], owner: 'Wealth Squad', kpiIds: ['kpi-margin-uptake'], volumePerDay: 320, lastSeen: '3 giờ trước' },
                  { id: 'ev-mg-ok', name: 'margin_approved', description: 'Margin được duyệt và kích hoạt', status: 'live', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-margin-uptake', 'kpi-margin-balance'], volumePerDay: 260, lastSeen: '18 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's6-2',
            name: 'Sử dụng margin & quản trị rủi ro',
            description: 'Giải ngân, cảnh báo margin call, xử lý force-sell.',
            touchpoints: [
              {
                id: 'tp-margin-use',
                name: 'Giải ngân & margin call',
                channel: 'backend',
                description: 'Core lending: giải ngân, tính tỷ lệ TTBT, cảnh báo và xử lý.',
                owner: 'Wealth Squad',
                dailyUsers: 7800,
                revenueImpact: 10,
                events: [
                  { id: 'ev-mg-draw', name: 'margin_loan_drawn', description: 'Giải ngân khoản vay margin', status: 'live', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-margin-balance'], volumePerDay: 3900, lastSeen: '2 phút trước' },
                  { id: 'ev-mg-call', name: 'margin_call_triggered', description: 'Chạm ngưỡng cảnh báo/giải chấp, bắn cảnh báo', status: 'live', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-margin-balance', 'kpi-churn'], volumePerDay: 180, lastSeen: '11 phút trước' },
                  { id: 'ev-force-sell', name: 'force_sell_executed', description: 'Bán giải chấp bắt buộc', status: 'live', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-margin-balance', 'kpi-churn'], volumePerDay: 22, lastSeen: '42 phút trước' },
                ],
              },
            ],
          },
          {
            id: 's6-3',
            name: 'Ứng trước tiền bán',
            description: 'Ứng trước tiền bán chứng khoán chờ T+ về.',
            touchpoints: [
              {
                id: 'tp-advance',
                name: 'Màn ứng trước tiền bán',
                channel: 'app',
                description: 'Tạo yêu cầu ứng trước, nhận tiền trong phiên.',
                owner: 'Wealth Squad',
                dailyUsers: 1300,
                revenueImpact: 6,
                events: [
                  { id: 'ev-adv-create', name: 'advance_request_created', description: 'Tạo yêu cầu ứng trước tiền bán', status: 'gap', platforms: ['ios', 'android'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell'], volumePerDay: 0 },
                  { id: 'ev-adv-disburse', name: 'advance_disbursed', description: 'Giải ngân ứng trước thành công', status: 'designed', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'f8',
        name: 'Trái phiếu & Tích lũy dài hạn',
        owner: 'Wealth Squad',
        description: 'Sản phẩm đầu tư dài hạn: trái phiếu, chứng chỉ quỹ và kế hoạch DCA.',
        stages: [
          {
            id: 's6-4',
            name: 'Mua trái phiếu',
            description: 'Khám phá, đặt mua trái phiếu doanh nghiệp niêm yết.',
            touchpoints: [
              {
                id: 'tp-bond',
                name: 'Sàn trái phiếu (iBond)',
                channel: 'app',
                description: 'Danh mục trái phiếu, tính lãi suất, đặt lệnh OTC.',
                owner: 'Wealth Squad',
                dailyUsers: 3400,
                revenueImpact: 8,
                events: [
                  { id: 'ev-bond-list', name: 'bond_list_viewed', description: 'Xem danh mục trái phiếu đang chào bán', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell'], volumePerDay: 2900, lastSeen: '9 phút trước' },
                  { id: 'ev-bond-order', name: 'bond_order_placed', description: 'Đặt mua trái phiếu', status: 'validating', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell'], volumePerDay: 140, lastSeen: '4 giờ trước' },
                  { id: 'ev-bond-matched', name: 'bond_order_settled', description: 'Tất toán trái phiếu thành công (tiền/chứng từ đối ứng)', status: 'gap', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's6-5',
            name: 'Chứng chỉ quỹ & kế hoạch DCA',
            description: 'Khám phá quỹ, tạo kế hoạch tích lũy định kỳ tự động.',
            touchpoints: [
              {
                id: 'tp-dca',
                name: 'Tích lũy chứng chỉ quỹ (DCA)',
                channel: 'app',
                description: 'Wizard tạo kế hoạch DCA theo mục tiêu (hưu trí, giáo dục).',
                owner: 'Wealth Squad',
                dailyUsers: 1800,
                revenueImpact: 7,
                events: [
                  { id: 'ev-fund-explore', name: 'fund_catalog_explored', description: 'Duyệt danh mục quỹ mở', status: 'designed', platforms: ['ios', 'android'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell', 'kpi-dca-retention'], volumePerDay: 0 },
                  { id: 'ev-dca-create', name: 'dca_plan_created', description: 'Tạo kế hoạch tích lũy định kỳ', status: 'gap', platforms: ['ios', 'android'], owner: 'Wealth Squad', kpiIds: ['kpi-cross-sell', 'kpi-dca-retention'], volumePerDay: 0 },
                  { id: 'ev-dca-exec', name: 'dca_installment_executed', description: 'Kỳ trích tiền DCA thực thi thành công/thất bại', status: 'gap', platforms: ['server'], owner: 'Wealth Squad', kpiIds: ['kpi-dca-retention'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p7',
    code: 'G7',
    name: 'Giữ chân & Chăm sóc',
    description: 'Đo lường hài lòng, hỗ trợ đa kênh, phát hiện churn sớm và tái kích hoạt.',
    color: '#4ade80',
    northStarKpiId: 'kpi-nps',
    flows: [
      {
        id: 'f9',
        name: 'Chăm sóc & Đo lường hài lòng',
        owner: 'CX Team',
        description: 'NPS/CSAT, hỗ trợ khách hàng và chương trình winback.',
        stages: [
          {
            id: 's7-1',
            name: 'Khảo sát NPS / CSAT',
            description: 'Thu thập phản hồi định kỳ và sau các tương tác dịch vụ.',
            touchpoints: [
              {
                id: 'tp-nps',
                name: 'Khảo sát in-app',
                channel: 'app',
                description: 'Popup NPS theo quý và CSAT sau sự kiện dịch vụ.',
                owner: 'CX Team',
                dailyUsers: 22000,
                revenueImpact: 4,
                events: [
                  { id: 'ev-nps-show', name: 'nps_prompt_shown', description: 'Hiển thị khảo sát NPS', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'CX Team', kpiIds: ['kpi-nps'], volumePerDay: 4200, lastSeen: '15 phút trước' },
                  { id: 'ev-nps-submit', name: 'nps_submitted', description: 'Gửi điểm NPS kèm lý do', status: 'live', platforms: ['ios', 'android', 'web'], owner: 'CX Team', kpiIds: ['kpi-nps'], volumePerDay: 1250, lastSeen: '8 phút trước' },
                  { id: 'ev-csat', name: 'csat_after_interaction', description: 'CSAT 1-5 sao sau cuộc gọi/chat', status: 'validating', platforms: ['web', 'crm'], owner: 'CX Team', kpiIds: ['kpi-csat'], volumePerDay: 380, lastSeen: '2 giờ trước' },
                ],
              },
            ],
          },
          {
            id: 's7-2',
            name: 'Hỗ trợ khách hàng',
            description: 'Hotline, live chat, ticket — đo SLA và FCR.',
            touchpoints: [
              {
                id: 'tp-support',
                name: 'Hotline & Live chat',
                channel: 'hotline',
                description: 'Tổng đài 1900xxxx + chat trong app, ghi nhận vào CRM.',
                owner: 'CX Team',
                dailyUsers: 3100,
                revenueImpact: 5,
                events: [
                  { id: 'ev-ticket', name: 'support_ticket_created', description: 'Tạo ticket từ hotline/chat/email', status: 'live', platforms: ['crm'], owner: 'CX Team', kpiIds: ['kpi-fcr', 'kpi-csat'], volumePerDay: 2980, lastSeen: '3 phút trước' },
                  { id: 'ev-ticket-done', name: 'support_ticket_resolved', description: 'Ticket đóng với mã kết quả', status: 'live', platforms: ['crm'], owner: 'CX Team', kpiIds: ['kpi-fcr'], volumePerDay: 2740, lastSeen: '5 phút trước' },
                  { id: 'ev-ticket-sla', name: 'support_sla_breached', description: 'Ticket vượt SLA phản hồi', status: 'designed', platforms: ['crm'], owner: 'CX Team', kpiIds: ['kpi-csat'], volumePerDay: 0 },
                ],
              },
            ],
          },
          {
            id: 's7-3',
            name: 'Chăm sóc chủ động & winback',
            description: 'Broker/RM chủ động liên hệ, cờ churn-risk, chiến dịch tái kích hoạt.',
            touchpoints: [
              {
                id: 'tp-broker-crm',
                name: 'CRM của Broker / RM',
                channel: 'broker',
                description: 'Công cụ CRM cho broker: lịch sử tương tác, cảnh báo churn.',
                owner: 'Retention Squad',
                dailyUsers: 640,
                revenueImpact: 8,
                events: [
                  { id: 'ev-broker-call', name: 'broker_outreach_logged', description: 'Broker ghi nhận cuộc gọi chăm sóc', status: 'live', platforms: ['crm'], owner: 'Retention Squad', kpiIds: ['kpi-churn'], volumePerDay: 1120, lastSeen: '7 phút trước' },
                  { id: 'ev-churn-flag', name: 'churn_risk_flagged', description: 'Model gắn cờ KH rủi ro churn (điểm 0-100)', status: 'designed', platforms: ['server', 'crm'], owner: 'Data Platform', kpiIds: ['kpi-churn', 'kpi-reactivation'], volumePerDay: 0 },
                  { id: 'ev-winback', name: 'winback_campaign_delivered', description: 'Gửi ưu đãi winback đến KH churn', status: 'gap', platforms: ['server'], owner: 'Retention Squad', kpiIds: ['kpi-reactivation'], volumePerDay: 0 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// =====================================================
// PO BOARD — backlog instrumentation (RICE-based)
// =====================================================
export const PO_TASKS: POTask[] = [
  {
    id: 'CXM-128', title: 'Gắn event contract_sign_failed với mã lỗi CA', description: 'Ký HĐ điện tử là nút thắt cuối cùng của eKYC; hiện không đo được lý do thất bại (hết phiên CA, OTP sai, user bỏ ngang). Cần event server-side kèm error_code.', type: 'gap-closure', priority: 'P0', column: 'doing', reach: 13300, impact: 9, confidence: 90, effort: 2, rice: 5324, owner: 'Linh Trần', squad: 'Onboarding Squad', phaseId: 'p2', touchpointId: 'tp-contract', eventId: 'ev-sign-fail', kpiIds: ['kpi-ekyc-completion'], due: '25/07', tags: ['eKYC', 'server-side'], createdAt: '2026-07-02',
  },
  {
    id: 'CXM-131', title: 'Tracking lỗi chụp CCCD (id_capture_failed)', description: 'Gắn event khi chụp giấy tờ thất bại quá 3 lần kèm lý do (mờ, chói sáng, sai loại giấy tờ). Dữ liệu này giải thích ~11% drop-off eKYC chưa rõ nguyên nhân.', type: 'gap-closure', priority: 'P0', column: 'doing', reach: 12600, impact: 8, confidence: 85, effort: 1.5, rice: 4760, owner: 'Minh Quân', squad: 'Onboarding Squad', phaseId: 'p2', touchpointId: 'tp-idcapture', eventId: 'ev-id-fail', kpiIds: ['kpi-ekyc-completion'], due: '22/07', tags: ['eKYC', 'mobile-sdk'], createdAt: '2026-07-03',
  },
  {
    id: 'CXM-115', title: 'Validate event id_ocr_confidence_scored', description: 'Event OCR confidence đã deploy staging; cần đối chiếu 500 mẫu thủ công để xác nhận ngưỡng confidence hợp lệ trước khi lên prod.', type: 'enhancement', priority: 'P1', column: 'validating', reach: 9800, impact: 6, confidence: 70, effort: 1, rice: 2881, owner: 'Hà Vũ', squad: 'Data Platform', phaseId: 'p2', touchpointId: 'tp-idcapture', eventId: 'ev-ocr-ok', kpiIds: ['kpi-ekyc-completion'], due: '29/07', tags: ['data-quality'], createdAt: '2026-06-28',
  },
  {
    id: 'CXM-134', title: 'Event liveness_failed kèm phân loại lỗi', description: 'Phân biệt fail do ánh sáng/môi trường vs nghi giả mạo vs face-mismatch để tối ưu hướng dẫn người dùng và cảnh báo fraud.', type: 'gap-closure', priority: 'P1', column: 'ready', reach: 11400, impact: 7, confidence: 80, effort: 2, rice: 3192, owner: 'Minh Quân', squad: 'Onboarding Squad', phaseId: 'p2', touchpointId: 'tp-liveness', eventId: 'ev-live-fail', kpiIds: ['kpi-ekyc-completion'], due: '05/08', tags: ['eKYC', 'fraud'], createdAt: '2026-07-06',
  },
  {
    id: 'CXM-119', title: 'Cảnh báo giao dịch nạp treo (deposit_stuck_detected)', description: 'Phát hiện giao dịch nạp > 15 phút chưa ghi có, trigger alert cho Payments + thông báo chủ động cho KH. Giảm ticket "nạp tiền chưa nhận được" (~18% tổng ticket).', type: 'gap-closure', priority: 'P0', column: 'ready', reach: 10600, impact: 9, confidence: 85, effort: 2.5, rice: 3244, owner: 'Tuấn Anh', squad: 'Payments', phaseId: 'p3', touchpointId: 'tp-payment-gw', eventId: 'ev-dep-stuck', kpiIds: ['kpi-deposit-success', 'kpi-fcr'], due: '08/08', tags: ['payment', 'alerting'], createdAt: '2026-06-30',
  },
  {
    id: 'CXM-122', title: 'Tracking lỗi liên kết ngân hàng (bank_link_failed)', description: 'Event thất bại liên kết kèm mã lỗi từng ngân hàng. 3 ngân hàng chiếm 70% lỗi nhưng chưa biết lỗi gì.', type: 'gap-closure', priority: 'P1', column: 'backlog', reach: 8400, impact: 7, confidence: 80, effort: 1.5, rice: 3136, owner: 'Tuấn Anh', squad: 'Payments', phaseId: 'p3', touchpointId: 'tp-banklink', eventId: 'ev-bl-fail', kpiIds: ['kpi-activation-7d', 'kpi-deposit-success'], tags: ['payment'], createdAt: '2026-07-05',
  },
  {
    id: 'CXM-136', title: 'Đo latency khớp lệnh theo phiên & mã (roundtrip)', description: 'Server-side timing từ order_placed đến order_matched, phân tách theo phiên ATO/liên tục và nhóm mã. Nền tảng cho cam kết SLA trading.', type: 'enhancement', priority: 'P1', column: 'ready', reach: 128000, impact: 8, confidence: 75, effort: 3, rice: 2133, owner: 'Đức Phạm', squad: 'Trading Core', phaseId: 'p4', touchpointId: 'tp-matching', eventId: 'ev-latency', kpiIds: ['kpi-order-latency', 'kpi-order-success'], due: '12/08', tags: ['trading', 'performance'], createdAt: '2026-07-07',
  },
  {
    id: 'CXM-138', title: 'Moment chúc mừng lệnh đầu tiên + đo next-best-action', description: 'Thiết kế trải nghiệm celebration sau lệnh đầu khớp, gắn event đo CTR sang hành động tiếp theo (nạp thêm, tạo watchlist, tìm hiểu margin).', type: 'experiment', priority: 'P2', column: 'backlog', reach: 62000, impact: 5, confidence: 60, effort: 2, rice: 930, owner: 'Linh Trần', squad: 'Activation Squad', phaseId: 'p4', touchpointId: 'tp-portfolio-first', eventId: 'ev-celebrate', kpiIds: ['kpi-first-trade-30d'], tags: ['experiment', 'activation'], createdAt: '2026-07-08',
  },
  {
    id: 'CXM-140', title: 'Tracking lỗi rút tiền (withdraw_failed) theo nguyên nhân', description: 'Phân loại fail: chưa đủ T+, vượt hạn mức, lỗi ngân hàng. Rút tiền là touchpoint nhạy cảm nhất về trust.', type: 'gap-closure', priority: 'P1', column: 'backlog', reach: 36400, impact: 8, confidence: 85, effort: 1.5, rice: 1654, owner: 'Tuấn Anh', squad: 'Payments', phaseId: 'p5', touchpointId: 'tp-withdraw', eventId: 'ev-wd-fail', kpiIds: ['kpi-withdraw-success'], tags: ['payment', 'trust'], createdAt: '2026-07-09',
  },
  {
    id: 'CXM-124', title: 'Sao kê & báo cáo: event statement_report_downloaded', description: 'Đo nhu cầu tải sao kê/báo cáo thuế để ưu tiên self-serve, giảm ticket yêu cầu sao kê.', type: 'gap-closure', priority: 'P2', column: 'backlog', reach: 28700, impact: 4, confidence: 70, effort: 1, rice: 803, owner: 'Hà Vũ', squad: 'Engagement Squad', phaseId: 'p5', touchpointId: 'tp-portfolio', eventId: 'ev-report-dl', kpiIds: ['kpi-dau-mau'], tags: ['web'], createdAt: '2026-07-01',
  },
  {
    id: 'CXM-141', title: 'Bộ event tất toán trái phiếu (bond_order_settled)', description: 'Đo full funnel trái phiếu: đặt → khớp OTC → tất toán song phương. Hiện mất tín hiệu ở bước cuối nên không tính được cross-sell thật.', type: 'gap-closure', priority: 'P1', column: 'backlog', reach: 23800, impact: 8, confidence: 75, effort: 2, rice: 7140, owner: 'Mai Hương', squad: 'Wealth Squad', phaseId: 'p6', touchpointId: 'tp-bond', eventId: 'ev-bond-matched', kpiIds: ['kpi-cross-sell'], tags: ['bond', 'server-side'], createdAt: '2026-07-10',
  },
  {
    id: 'CXM-142', title: 'Instrument toàn bộ luồng DCA chứng chỉ quỹ', description: '3 event: fund_catalog_explored, dca_plan_created, dca_installment_executed. Sản phẩm chiến lược 2026 nhưng chưa có bất kỳ tín hiệu nào.', type: 'gap-closure', priority: 'P0', column: 'backlog', reach: 12600, impact: 9, confidence: 85, effort: 3, rice: 3213, owner: 'Mai Hương', squad: 'Wealth Squad', phaseId: 'p6', touchpointId: 'tp-dca', eventId: 'ev-dca-create', kpiIds: ['kpi-cross-sell', 'kpi-dca-retention'], tags: ['fund', 'strategic'], createdAt: '2026-07-10',
  },
  {
    id: 'CXM-126', title: 'Event ứng trước tiền bán (advance_request_created)', description: 'Đo nhu cầu ứng trước thật để sizing sản phẩm; hiện chỉ có số liệu tổng hợp từ core lending.', type: 'gap-closure', priority: 'P2', column: 'backlog', reach: 9100, impact: 6, confidence: 75, effort: 1.5, rice: 2730, owner: 'Mai Hương', squad: 'Wealth Squad', phaseId: 'p6', touchpointId: 'tp-advance', eventId: 'ev-adv-create', kpiIds: ['kpi-cross-sell'], tags: ['lending'], createdAt: '2026-07-04',
  },
  {
    id: 'CXM-143', title: 'Model churn-risk: event churn_risk_flagged vào CRM', description: 'Deploy scoring churn hằng tuần, đẩy cờ rủi ro + lý do top-3 vào CRM cho broker gọi chủ động.', type: 'enhancement', priority: 'P1', column: 'backlog', reach: 4480, impact: 9, confidence: 70, effort: 4, rice: 706, owner: 'Hà Vũ', squad: 'Data Platform', phaseId: 'p7', touchpointId: 'tp-broker-crm', eventId: 'ev-churn-flag', kpiIds: ['kpi-churn', 'kpi-reactivation'], tags: ['ml', 'crm'], createdAt: '2026-07-11',
  },
  {
    id: 'CXM-144', title: 'Tracking chiến dịch winback (winback_campaign_delivered)', description: 'Đo delivered → opened → reactivated cho chiến dịch winback; hiện reactivation rate chỉ tính thủ công hằng tháng.', type: 'gap-closure', priority: 'P2', column: 'backlog', reach: 31500, impact: 7, confidence: 80, effort: 2, rice: 8820, owner: 'Thu Hằng', squad: 'Retention Squad', phaseId: 'p7', touchpointId: 'tp-broker-crm', eventId: 'ev-winback', kpiIds: ['kpi-reactivation'], tags: ['campaign'], createdAt: '2026-07-12',
  },
  {
    id: 'CXM-116', title: 'CSAT sau tương tác (csat_after_interaction)', description: 'Khảo sát 1-5 sao ngay sau cuộc gọi/chat, gắn vào ticket CRM. Đang validate tỷ lệ response trên 200 ticket mẫu.', type: 'enhancement', priority: 'P1', column: 'validating', reach: 2660, impact: 6, confidence: 75, effort: 1, rice: 1197, owner: 'Thu Hằng', squad: 'CX Team', phaseId: 'p7', touchpointId: 'tp-nps', eventId: 'ev-csat', kpiIds: ['kpi-csat'], due: '30/07', tags: ['csat', 'crm'], createdAt: '2026-06-29',
  },
  {
    id: 'CXM-120', title: 'Governance: schema registry & naming convention v2', description: 'Chuẩn hóa tên event/object_action, bắt buộc owner + kpiIds khi đăng ký event mới. Chặn event "mồ côi" không gắn KPI.', type: 'governance', priority: 'P1', column: 'doing', reach: 0, impact: 7, confidence: 90, effort: 2, rice: 0, owner: 'Hà Vũ', squad: 'Data Platform', phaseId: 'p5', kpiIds: [], due: '01/08', tags: ['governance'], createdAt: '2026-07-03',
  },
  {
    id: 'CXM-112', title: 'Đối soát volume order_placed giữa app-tracking và OMS', description: 'Kiểm chứng chênh lệch < 1% giữa tracking client và sở lệnh OMS cho cụm event trading.', type: 'fix', priority: 'P0', column: 'done', reach: 0, impact: 8, confidence: 95, effort: 1, rice: 0, owner: 'Đức Phạm', squad: 'Trading Core', phaseId: 'p4', touchpointId: 'tp-orderticket', kpiIds: ['kpi-order-success'], due: '11/07', tags: ['data-quality'], createdAt: '2026-06-25',
  },
  {
    id: 'CXM-109', title: 'Chuẩn hóa UTM attribution vào CDP', description: 'Mapping đầy đủ utm_source/medium/campaign cho mọi kênh trả phí; fix mất attribution trên iOS Safari.', type: 'fix', priority: 'P1', column: 'done', reach: 0, impact: 6, confidence: 90, effort: 1.5, rice: 0, owner: 'Linh Trần', squad: 'Growth', phaseId: 'p1', touchpointId: 'tp-landing', kpiIds: ['kpi-cpl', 'kpi-visit-lead'], due: '04/07', tags: ['attribution'], createdAt: '2026-06-20',
  },
  {
    id: 'CXM-117', title: 'Deep-link push FTD: đo opened → deposit trong 24h', description: 'Gắn attribution cửa sổ 24h từ push mở đến deposit_success để đo hiệu quả chuỗi nhắc FTD.', type: 'enhancement', priority: 'P1', column: 'validating', reach: 6510, impact: 7, confidence: 80, effort: 1, rice: 3646, owner: 'Thu Hằng', squad: 'Activation Squad', phaseId: 'p3', touchpointId: 'tp-push-ftd', eventId: 'ev-push-open', kpiIds: ['kpi-activation-7d'], due: '31/07', tags: ['push', 'attribution'], createdAt: '2026-06-27',
  },
];
