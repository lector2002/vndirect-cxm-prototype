import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  ChevronRight,
  CircleDot,
  FileQuestion,
  GitBranch,
  Layers3,
  Search,
  Users,
  X,
} from 'lucide-react';
import { kpiById } from '@/data/cxm';
import { ChannelChip, CoverageBar, PlatformChips, StatusBadge } from '@/components/cxm-shared';
import { coverageOf, findTouchpointById, fmtNum } from '@/lib/cxm-utils';
import { useCXM } from '@/store/CXMContext';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';
import { cn } from '@/lib/utils';

type SourceState = 'verified' | 'needs-source';
type JourneyStep = { id: string; name: string; description: string; touchpointIds: string[] };
type JourneyFlow = { id: string; name: string; description: string; source: SourceState; sourceName?: string; steps: JourneyStep[] };
type JourneyGroup = { id: string; name: string; description: string; flows: JourneyFlow[] };
type JourneyPhase = { id: string; code: string; name: string; subtitle: string; goal: string; color: string; groups: JourneyGroup[] };

const step = (id: string, name: string, description: string, touchpointIds: string[] = []): JourneyStep => ({ id, name, description, touchpointIds });
const verified = (id: string, name: string, description: string, sourceName: string, steps: JourneyStep[]): JourneyFlow => ({ id, name, description, source: 'verified', sourceName, steps });
const draft = (id: string, name: string, description: string, steps: JourneyStep[]): JourneyFlow => ({ id, name, description, source: 'needs-source', steps });

const JOURNEY: JourneyPhase[] = [
  {
    id: 'reach', code: '01', name: 'Reach', subtitle: 'Tìm hiểu', goal: 'Khách nhận biết nhu cầu, hiểu sản phẩm và chủ động bắt đầu.', color: '#0284c7',
    groups: [
      { id: 'discovery', name: 'Khám phá & cân nhắc', description: 'Các đường vào trước khi khách để lại thông tin.', flows: [
        draft('campaign-discovery', 'Khám phá từ campaign', 'Từ nội dung truyền thông đến landing page và CTA.', [step('campaign-content', 'Tiếp cận nội dung', 'Xem campaign, nội dung giáo dục và ưu đãi.', ['tp-landing']), step('campaign-cta', 'Chọn CTA phù hợp', 'Đi tới mở tài khoản hoặc tìm hiểu sản phẩm.', ['tp-landing'])]),
        draft('referral-discovery', 'Khám phá qua giới thiệu', 'Khách đi vào hành trình từ broker, referral hoặc khách hàng hiện hữu.', [step('referral-open', 'Mở referral', 'Nhận và mở liên kết giới thiệu.', ['tp-referral']), step('referral-consider', 'Đánh giá đề xuất', 'Xem lợi ích và quyết định để lại thông tin.', ['tp-landing'])]),
      ] },
      { id: 'education', name: 'Giáo dục đầu tư', description: 'Nội dung giúp khách hiểu lựa chọn trước khi đăng ký.', flows: [
        draft('product-learning', 'Tìm hiểu sản phẩm đầu tư', 'Khám phá cổ phiếu, quỹ, trái phiếu và phái sinh.', [step('learn-market', 'Khám phá danh mục', 'Đọc thông tin sản phẩm và bối cảnh thị trường.', ['tp-market']), step('learn-next', 'Chọn bước tiếp theo', 'Đăng ký hoặc lưu lại để quay lại sau.', ['tp-landing'])]),
      ] },
    ],
  },
  {
    id: 'lead', code: '02', name: 'Lead', subtitle: 'Bắt đầu hành trình', goal: 'Thu lead tối thiểu, tạo account trải nghiệm và nối tiếp luồng dở.', color: '#2563eb',
    groups: [
      { id: 'lead-capture', name: 'Thu lead & account trải nghiệm', description: 'Lead-first, platform-first trước khi eKYC.', flows: [
        verified('lead-first', 'Khai báo lead & xác thực OTP', 'Thu SĐT, email, mật khẩu và tạo Account trải nghiệm S1 có TTL 7 ngày.', 'Account Journey · Sơ đồ 9', [step('lead-declare', 'Khai báo thông tin', 'Nhập thông tin tối thiểu trên MyDGO, DStock hoặc DGO.', ['tp-leadform']), step('lead-otp', 'Xác thực SĐT', 'Xác thực OTP SMS và tạo leadID.', ['tp-otp']), step('lead-trial', 'Tạo Account trải nghiệm', 'Cho phép dùng thử giới hạn trong 7 ngày.', ['tp-leadform'])]),
        verified('lead-resume', 'Nối tiếp luồng đang dở', 'Nhận diện lead trùng và đưa khách về đúng bước chưa hoàn tất.', 'Account Journey · Sơ đồ 9', [step('resume-detect', 'Nhận diện lead dở dang', 'Kiểm tra SĐT hoặc email đã có leadID.', ['tp-leadform']), step('resume-auth', 'Xác thực quay lại', 'OTP để tiếp tục hồ sơ an toàn.', ['tp-otp']), step('resume-route', 'Đi tới bước còn thiếu', 'Mở lại đúng trạng thái eKYC hoặc hợp đồng.', ['tp-leadform'])]),
      ] },
    ],
  },
  {
    id: 'onboarding', code: '03', name: 'Onboarding', subtitle: 'Hoàn tất MTK & định hướng', goal: 'Tạo tài khoản hợp lệ, an toàn và sẵn sàng đầu tư.', color: '#7c3aed',
    groups: [
      { id: 'account-opening', name: 'Mở tài khoản', description: 'eKYC, thiết lập và kích hoạt tài khoản.', flows: [
        verified('open-account-2026', 'Mở tài khoản mới 2026', 'Luồng S0 Visitor, S1 Account trải nghiệm và S2 Full access, bao gồm toàn bộ bước xác thực khách hàng.', 'Account Journey · Sơ đồ 2 & 9', [step('open-declare', 'Khai báo & tạo S1', 'Thu lead và tạo account trải nghiệm.', ['tp-leadform', 'tp-otp']), step('open-ekyc', 'Xác thực danh tính', 'Đối chiếu CCCD qua VNeID/NFC, xác thực khuôn mặt và chữ ký hoặc Video Call khi áp dụng.', ['tp-idcapture', 'tp-liveness', 'tp-profile-form']), step('open-profile', 'Hoàn thiện hồ sơ', 'Bổ sung thông tin và tài khoản ngân hàng chính chủ.', ['tp-profile-form', 'tp-banklink']), step('open-contract', 'Thiết lập & ký hợp đồng', 'Chọn số tài khoản, đọc và ký bộ hợp đồng.', ['tp-contract']), step('open-activate', 'Kích hoạt tài khoản', 'VSDC duyệt và gửi welcome.', ['tp-backoffice'])]),
      ] },
      { id: 'orientation', name: 'Định hướng ban đầu', description: 'Giúp khách hiểu nền tảng và chọn hướng đầu tư.', flows: [
        draft('welcome-orientation', 'Welcome & khám phá nền tảng', 'Từ welcome đến dashboard, watchlist và nội dung nhập môn.', [step('welcome-message', 'Nhận welcome', 'Email, push và in-app sau kích hoạt.', ['tp-push-ftd']), step('welcome-explore', 'Khám phá nền tảng', 'Đi qua dashboard, bảng giá và watchlist.', ['tp-market'])]),
        draft('investment-compass', 'La bàn & chọn track đầu tư', 'Thu khẩu vị rủi ro và đề xuất track phù hợp.', [step('risk-profile', 'Đánh giá khẩu vị', 'Hoàn tất KYC/RNX và mục tiêu đầu tư.'), step('track-recommend', 'Nhận đề xuất', 'Chọn track tự đầu tư, tư vấn hoặc tích sản.')]),
      ] },
    ],
  },
  {
    id: 'be-in', code: '04', name: 'Be In', subtitle: 'Trải nghiệm đầu tư', goal: 'Hoàn tất money-in và hành động đầu tư đầu tiên.', color: '#b45309',
    groups: [
      { id: 'first-money', name: 'Nạp tiền & giao dịch đầu tiên', description: 'Các flow đưa khách tới first value.', flows: [
        verified('first-deposit', 'Nạp tiền lần đầu', 'Chọn kênh nạp, đối soát và ghi có sức mua.', 'Money Journey · Sơ đồ 2', [step('deposit-channel', 'Chọn kênh nạp', 'QR, cổng ngân hàng, liên kết hoặc quầy.', ['tp-banklink', 'tp-deposit']), step('deposit-credit', 'Đối soát & ghi có', 'Hệ thống nhận callback và tăng số dư.', ['tp-payment-gw', 'tp-deposit']), step('deposit-ready', 'Sẵn sàng giao dịch', 'Số dư khả dụng và sức mua được cập nhật.', ['tp-portfolio-first'])]),
        verified('first-buy', 'Mua sản phẩm lần đầu', 'Từ sức mua khả dụng đến lệnh mua theo nhóm sản phẩm.', 'Money Journey · Sơ đồ 3', [step('buy-discover', 'Chọn cơ hội', 'Tìm kiếm mã hoặc sản phẩm phù hợp.', ['tp-market']), step('buy-order', 'Đặt lệnh mua', 'Nhập lệnh và xác nhận giao dịch.', ['tp-orderticket']), step('buy-result', 'Nhận kết quả', 'Khớp lệnh và cập nhật danh mục.', ['tp-matching', 'tp-portfolio-first'])]),
      ] },
      { id: 'product-enable', name: 'Kích hoạt sản phẩm', description: 'Mở thêm quyền và sản phẩm sau tài khoản cơ sở.', flows: [
        verified('margin-register', 'Đăng ký Margin', 'Đăng ký cơ bản hoặc nâng cấp sản phẩm margin.', 'Account Journey · Sơ đồ 10', [step('margin-plan', 'Chọn gói Margin', 'Chọn cơ bản hoặc nâng cao.', ['tp-market']), step('margin-verify', 'Xác thực điều kiện', 'OTP hoặc khuôn mặt tùy gói.', ['tp-liveness', 'tp-otp']), step('margin-sign', 'Ký hợp đồng', 'Giao kết và cấp hạn mức.', ['tp-contract'])]),
        verified('derivative-open', 'Mở tài khoản phái sinh', 'Liên kết tài khoản cơ sở, ký hợp đồng và chờ VSDC.', 'Account Journey · Sơ đồ 11', [step('derivative-eligibility', 'Kiểm tra điều kiện', 'Có tài khoản cơ sở và đã xác thực CCCD.', ['tp-idcapture']), step('derivative-contract', 'Liên kết & ký hợp đồng', 'Chọn tài khoản cơ sở và ký OTP.', ['tp-contract']), step('derivative-vsdc', 'VSDC duyệt', 'Kích hoạt tiểu khoản có mã P.', ['tp-backoffice'])]),
        verified('derivative-pro', 'Đăng ký Phái sinh Pro', 'Xác thực khuôn mặt và kích hoạt giao dịch trong ngày.', 'Account Journey · Sơ đồ 12', [step('pro-info', 'Đọc điều kiện', 'Hiểu tỷ lệ ký quỹ trong ngày và qua đêm.', ['tp-market']), step('pro-face', 'Xác thực khuôn mặt', 'Thực hiện trên DGO app.', ['tp-liveness']), step('pro-sign', 'Ký & kích hoạt', 'Ký hợp đồng bằng OTP trong giờ quy định.', ['tp-contract'])]),
      ] },
    ],
  },
  {
    id: 'engage', code: '05', name: 'Engage & Advocacy', subtitle: 'Gắn bó & giới thiệu', goal: 'Duy trì hoạt động, mở rộng giá trị và tạo advocacy.', color: '#047857',
    groups: [
      { id: 'money-operations', name: 'Money Journey thường xuyên', description: 'Dòng tiền và giao dịch lặp lại trong vòng đời active.', flows: [
        verified('product-buy', 'Mua theo nhóm sản phẩm', 'Cổ phiếu, ETF, CW, trái phiếu, quỹ và phái sinh.', 'Money Journey · Sơ đồ 3', [step('product-funding', 'Xác định nguồn tiền', 'Tiền mặt, margin hoặc UTTB.', ['tp-deposit', 'tp-advance']), step('product-order', 'Giao dịch sản phẩm', 'Thực hiện theo cơ chế từng sản phẩm.', ['tp-daily', 'tp-bond', 'tp-dca'])]),
        verified('product-sell', 'Bán & tất toán sản phẩm', 'Khấu trừ phí, thuế và đưa tiền về trạng thái phù hợp.', 'Money Journey · Sơ đồ 4', [step('sell-execute', 'Bán / tất toán', 'Thực hiện theo loại sản phẩm.', ['tp-daily', 'tp-bond']), step('sell-settle', 'Thuế, phí & thanh toán', 'Tính net và cập nhật dòng tiền.', ['tp-portfolio'])]),
        verified('withdraw', 'Rút tiền', 'Kiểm tra số dư, RTT, định danh, hợp đồng và hạn mức.', 'Money Journey · Sơ đồ 5', [step('withdraw-start', 'Khởi tạo lệnh', 'Chọn tài khoản thụ hưởng và số tiền.', ['tp-withdraw']), step('withdraw-gates', 'Qua cổng kiểm soát', 'RTT, VNeID, chữ ký, hợp đồng và OTP.', ['tp-otp', 'tp-backoffice']), step('withdraw-arrive', 'Chi tiền', 'Ngân hàng nhận và hoàn tất lệnh.', ['tp-payment-gw'])]),
        verified('derivative-margin', 'Ký quỹ phái sinh CCP / VSDC', 'Luân chuyển giữa tài khoản ngân hàng, tài khoản P và CCP.', 'Money Journey · Sơ đồ 6', [step('margin-fund', 'Nộp ký quỹ', 'Chuyển tiền lên CCP trong giờ giao dịch.', ['tp-deposit']), step('margin-release', 'Rút ký quỹ', 'Giữ đủ nghĩa vụ và chuyển về tài khoản P.', ['tp-withdraw'])]),
        verified('internal-transfer', 'Chuyển tiền nội bộ', 'Chuyển giữa cơ sở, Margin và phái sinh cùng chủ tài khoản.', 'Money Journey · Sơ đồ 7', [step('transfer-direction', 'Chọn hướng chuyển', 'Chọn tài khoản nguồn và đích.', ['tp-portfolio']), step('transfer-gates', 'Kiểm tra & OTP', 'Kiểm tra số dư được phép và cùng chủ.', ['tp-otp']), step('transfer-credit', 'Ghi có tài khoản đích', 'Hoàn tất nội bộ, không đi qua ngân hàng.', ['tp-portfolio'])]),
        verified('sell-advance', 'Ứng trước tiền bán', 'Ứng thủ công hoặc tự động từ lệnh bán đã khớp.', 'Account Journey · Sơ đồ 13', [step('advance-mode', 'Chọn chế độ ứng', 'Theo từng món hoặc tự động.', ['tp-advance']), step('advance-use', 'Nhận & sử dụng tiền', 'Tăng sức mua hoặc rút tiền.', ['tp-advance']), step('advance-settle', 'Tự tất toán T+2', 'Tiền bán về và trả khoản đã ứng.', ['tp-portfolio'])]),
      ] },
      { id: 'account-care', name: 'Quản trị tài khoản', description: 'Hồ sơ, bảo mật và báo cáo trong quá trình sử dụng.', flows: [
        verified('personal-info', 'Thay đổi thông tin cá nhân', 'Cập nhật thông tin và phân nhánh hồ sơ bản cứng.', 'Account Journey · Sơ đồ 3', [step('info-update', 'Điền thông tin mới', 'Cập nhật trên My DGO.', ['tp-profile-form']), step('info-otp', 'Xác thực OTP', 'Xác nhận thay đổi qua email hoặc SĐT.', ['tp-otp']), step('info-approve', 'Hoàn thiện hồ sơ', 'Gửi hồ sơ nếu trường thay đổi yêu cầu.', ['tp-backoffice'])]),
        verified('chip-id-update', 'Cập nhật CCCD gắn chip', 'Cập nhật trên DGO app hoặc My DGO và ký Econtract.', 'Account Journey · Sơ đồ 4', [step('chip-capture', 'Chụp / tải CCCD', 'Thu nhận hai mặt CCCD gắn chip.', ['tp-idcapture']), step('chip-contract', 'Đọc & ký đề nghị', 'Ký Econtract bằng OTP.', ['tp-contract']), step('chip-result', 'Nhận kết quả', 'VNDIRECT xử lý và trả thông báo.', ['tp-backoffice'])]),
        verified('beneficiary', 'Quản lý thông tin thụ hưởng', 'Thêm hoặc xóa tài khoản chính chủ, bên thứ ba hay tài khoản VNDIRECT.', 'Account Journey · Sơ đồ 5', [step('beneficiary-type', 'Chọn loại thụ hưởng', 'Chính chủ, không chính chủ hoặc tại VNDIRECT.', ['tp-banklink']), step('beneficiary-verify', 'Xác thực phù hợp', 'Khuôn mặt, chữ ký và OTP theo loại.', ['tp-liveness', 'tp-otp']), step('beneficiary-done', 'Lưu / xóa thụ hưởng', 'Cập nhật danh sách và gửi hồ sơ nếu cần.', ['tp-banklink'])]),
        verified('account-security', 'Bảo mật tài khoản', 'Mật khẩu, xác thực bước 2, Smart OTP, PIN và thiết bị tin cậy.', 'Account Journey · Sơ đồ 6', [step('security-login', 'Đăng nhập an toàn', 'Mật khẩu và xác thực thiết bị.', ['tp-otp']), step('security-otp', 'Smart OTP & PIN', 'Đăng ký và dùng cho giao dịch.', ['tp-otp']), step('security-device', 'Quản lý thiết bị', 'Xem và hủy thiết bị tin cậy.', ['tp-profile-form'])]),
        verified('account-report', 'Báo cáo tài khoản', 'Sao kê, tổng quan tài sản, lịch dòng tiền và quản lý quyền.', 'Account Journey · Sơ đồ 7', [step('report-select', 'Chọn báo cáo', 'Chọn loại và khoảng thời gian.', ['tp-portfolio']), step('report-inspect', 'Tra cứu dữ liệu', 'Lọc sao kê, tài sản, dòng tiền hoặc quyền.', ['tp-portfolio'])]),
      ] },
      { id: 'advocacy', name: 'Chăm sóc & advocacy', description: 'Phản hồi, loyalty và giới thiệu.', flows: [
        draft('support-feedback', 'Hỗ trợ & phản hồi', 'Tạo ticket, xử lý và thu CSAT/NPS.', [step('support-request', 'Yêu cầu hỗ trợ', 'Hotline, live chat hoặc email.', ['tp-support']), step('support-resolve', 'Giải quyết yêu cầu', 'Theo dõi SLA và kết quả.', ['tp-support']), step('support-score', 'Đo phản hồi', 'Thu CSAT hoặc NPS sau tương tác.', ['tp-nps'])]),
        draft('loyalty-referral', 'Loyalty & giới thiệu', 'Ghi nhận gắn bó và chuyển khách active thành người giới thiệu.', [step('loyalty-recognize', 'Ghi nhận gắn bó', 'Nhận diện khách hàng có giá trị.'), step('advocacy-invite', 'Mời giới thiệu', 'Tạo và chia sẻ referral.', ['tp-referral'])]),
      ] },
    ],
  },
  {
    id: 'churn', code: '06', name: 'Churn', subtitle: 'Rời bỏ & phục hồi', goal: 'Phát hiện rủi ro, xử lý điểm gãy và đưa khách quay lại.', color: '#e11d48',
    groups: [
      { id: 'recovery', name: 'Phục hồi trải nghiệm', description: 'Khắc phục lỗi khiến hành trình bị gián đoạn.', flows: [
        verified('deposit-investigation', 'Tra soát nạp tiền', 'Tạo yêu cầu, TTTT xử lý và ghi có hoặc hoàn tiền.', 'Money Journey · Sơ đồ 2', [step('investigation-create', 'Tạo yêu cầu tra soát', 'Gửi chứng từ trên DGO hoặc My DGO.', ['tp-support']), step('investigation-handle', 'Tiếp nhận & xử lý', 'TTTT đối soát và chờ bên thứ ba nếu cần.', ['tp-payment-gw', 'tp-support']), step('investigation-close', 'Ghi có / hoàn tiền', 'Hoàn tất và thông báo kết quả.', ['tp-deposit'])]),
        draft('failed-journey-recovery', 'Phục hồi flow thất bại', 'Tổng hợp lỗi eKYC, hợp đồng, nạp/rút và đưa khách về đúng điểm tiếp tục.', [step('failure-detect', 'Phát hiện điểm gãy', 'Từ event lỗi hoặc hành vi bỏ dở.', ['tp-backoffice']), step('failure-route', 'Chọn phương án phục hồi', 'Self-service, hỗ trợ hoặc xử lý vận hành.', ['tp-support']), step('failure-resume', 'Nối lại hành trình', 'Đưa khách về bước có thể tiếp tục.', ['tp-broker-crm'])]),
      ] },
      { id: 'retention', name: 'Retention & winback', description: 'Can thiệp trước và sau khi khách rời bỏ.', flows: [
        draft('churn-risk', 'Phát hiện nguy cơ churn', 'Chấm điểm rủi ro và đẩy tín hiệu cho đội chăm sóc.', [step('risk-score', 'Gắn cờ rủi ro', 'Model xác định điểm và nguyên nhân churn.', ['tp-broker-crm']), step('risk-prioritize', 'Ưu tiên can thiệp', 'Xếp hạng theo giá trị và mức rủi ro.', ['tp-broker-crm'])]),
        draft('winback', 'Chăm sóc chủ động & winback', 'Broker hoặc campaign tiếp cận và đo tái kích hoạt.', [step('winback-contact', 'Tiếp cận khách', 'Broker gọi hoặc gửi campaign phù hợp.', ['tp-broker-crm']), step('winback-return', 'Khách quay lại', 'Đăng nhập, nạp tiền hoặc giao dịch trở lại.', ['tp-daily']), step('winback-measure', 'Đo reactivation', 'Đánh giá hiệu quả trong cửa sổ 30 ngày.', ['tp-broker-crm'])]),
      ] },
    ],
  },
];

function stepSignals(item: JourneyStep) {
  return item.touchpointIds.flatMap((id) => findTouchpointById(id)?.touchpoint.events ?? []);
}

function searchable(phase: JourneyPhase, group: JourneyGroup, flow: JourneyFlow) {
  return [phase.name, phase.subtitle, group.name, flow.name, flow.description, ...flow.steps.flatMap((item) => [item.name, item.description])].join(' ').toLocaleLowerCase('vi');
}

export default function JourneyTree() {
  const { selectedCustomerPhaseId, setSelectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const initialPhase = selectedCustomerPhaseId === 'all' ? JOURNEY[0] : JOURNEY.find((phase) => phase.id === selectedCustomerPhaseId) ?? JOURNEY[0];
  const [phaseId, setPhaseId] = useState(initialPhase.id);
  const [flowId, setFlowId] = useState(initialPhase.groups[0].flows[0].id);
  const [stepId, setStepId] = useState(initialPhase.groups[0].flows[0].steps[0].id);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('vi'));

  const activePhase = JOURNEY.find((phase) => phase.id === phaseId) ?? JOURNEY[0];
  const allFlows = activePhase.groups.flatMap((group) => group.flows.map((flow) => ({ group, flow })));
  const activeEntry = allFlows.find(({ flow }) => flow.id === flowId) ?? allFlows[0];
  const activeStep = activeEntry.flow.steps.find((item) => item.id === stepId) ?? activeEntry.flow.steps[0];
  const results = useMemo(() => deferredQuery ? JOURNEY.flatMap((phase) => phase.groups.flatMap((group) => group.flows.filter((flow) => searchable(phase, group, flow).includes(deferredQuery)).map((flow) => ({ phase, group, flow })))).slice(0, 12) : [], [deferredQuery]);
  const phaseFlowCount = (phase: JourneyPhase) => phase.groups.reduce((sum, group) => sum + group.flows.length, 0);

  const syncGlobalPhase = useEffectEvent((nextPhaseId: typeof selectedCustomerPhaseId) => {
    if (nextPhaseId === 'all' || nextPhaseId === phaseId) return;
    const nextPhase = JOURNEY.find((phase) => phase.id === nextPhaseId);
    if (nextPhase) selectPhase(nextPhase);
  });

  useEffect(() => {
    syncGlobalPhase(selectedCustomerPhaseId);
  }, [selectedCustomerPhaseId]);

  function selectPhase(phase: JourneyPhase) {
    const firstFlow = phase.groups[0].flows[0];
    setPhaseId(phase.id);
    setFlowId(firstFlow.id);
    setStepId(firstFlow.steps[0].id);
    setSelectedCustomerPhaseId(phase.id as Parameters<typeof setSelectedCustomerPhaseId>[0]);
  }

  function selectFlow(phase: JourneyPhase, flow: JourneyFlow) {
    setPhaseId(phase.id);
    setFlowId(flow.id);
    setStepId(flow.steps[0].id);
    setSelectedCustomerPhaseId(phase.id as Parameters<typeof setSelectedCustomerPhaseId>[0]);
    setQuery('');
  }

  return (
    <div className="flex h-full min-h-[760px] min-w-[1050px] flex-col overflow-hidden p-5">
      <header className="mb-4 flex shrink-0 items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><GitBranch className="h-3.5 w-3.5" />Journey explorer</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hành trình khách hàng</h1>
          <p className="mt-1 text-xs text-muted-foreground">Đi từ phase đến nhóm, chọn flow và inspect từng bước mà không mất ngữ cảnh.</p>
        </div>
        <div className="flex gap-5 rounded-xl border border-border bg-white px-4 py-2.5 text-xs shadow-sm">
          <Metric value="6" label="phase" />
          <Metric value={String(JOURNEY.reduce((sum, phase) => sum + phase.groups.length, 0))} label="nhóm" />
          <Metric value={String(JOURNEY.reduce((sum, phase) => sum + phaseFlowCount(phase), 0))} label="flow" />
          <Metric value={String(JOURNEY.flatMap((phase) => phase.groups.flatMap((group) => group.flows)).filter((flow) => flow.source === 'verified').length)} label="đã đối soát" accent />
        </div>
      </header>

      <nav aria-label="Các phase hành trình" className="relative mb-4 grid shrink-0 grid-cols-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {JOURNEY.map((phase, index) => {
          const selected = phase.id === activePhase.id;
          return <button key={phase.id} type="button" onClick={() => selectPhase(phase)} aria-current={selected ? 'step' : undefined} className={cn('relative flex min-w-0 items-center gap-3 border-r border-border px-3 py-3 text-left transition-colors last:border-r-0 hover:bg-slate-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', selected && 'bg-slate-50')}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: selected ? phase.color : `${phase.color}18`, color: selected ? 'white' : phase.color }}>{phase.code}</span>
            <span className="min-w-0"><span className={cn('block truncate text-xs font-semibold', selected && 'text-foreground')}>{phase.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{phaseFlowCount(phase)} flow</span></span>
            {index < JOURNEY.length - 1 && <ChevronRight className="absolute -right-2 z-10 h-4 w-4 rounded-full border border-border bg-white text-muted-foreground" />}
            {selected && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: phase.color }} />}
          </button>;
        })}
      </nav>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(440px,1fr)_330px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <aside className="flex min-h-0 flex-col border-r border-border bg-slate-50/70">
          <div className="relative border-b border-border p-3">
            <Search className="absolute left-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phase, nhóm, flow, bước..." aria-label="Tìm trong hành trình" className="h-9 w-full rounded-lg border border-input bg-white pl-9 pr-9 text-xs outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm" className="absolute right-5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {deferredQuery ? <SearchResults results={results} query={query} onSelect={selectFlow} /> : <GroupCatalog phase={activePhase} activeFlowId={activeEntry.flow.id} onSelect={(flow) => selectFlow(activePhase, flow)} />}
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto bg-white p-5">
          <div className="mb-5 flex items-start justify-between gap-5 border-b border-border pb-5">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"><span>{activePhase.name}</span><ChevronRight className="h-3 w-3" /><span>{activeEntry.group.name}</span></div>
              <h2 className="text-xl font-bold tracking-tight">{activeEntry.flow.name}</h2>
              <p className="mt-1.5 max-w-3xl text-xs leading-5 text-muted-foreground">{activeEntry.flow.description}</p>
            </div>
            <SourceBadge flow={activeEntry.flow} />
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="text-xs font-semibold">Flow sequence</h3><p className="mt-0.5 text-[10px] text-muted-foreground">Chọn một bước để inspect touchpoint, signal và KPI.</p></div>
            <span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground">{activeEntry.flow.steps.length} bước</span>
          </div>
          <div className="relative pl-4">
            <div className="absolute bottom-6 left-[31px] top-6 w-px bg-border" />
            <div className="space-y-2.5">
              {activeEntry.flow.steps.map((item, index) => <StepRow key={item.id} item={item} index={index} color={activePhase.color} selected={item.id === activeStep.id} timeFrameId={selectedTimeFrameId} onSelect={() => setStepId(item.id)} />)}
            </div>
          </div>
        </main>

        <StepInspector step={activeStep} phase={activePhase} timeFrameId={selectedTimeFrameId} />
      </div>
    </div>
  );
}

function Metric({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return <div><span className={cn('font-bold tabular-nums text-foreground', accent && 'text-emerald-700')}>{value}</span><span className="ml-1 text-[10px] text-muted-foreground">{label}</span></div>;
}

function SourceBadge({ flow }: { flow: JourneyFlow }) {
  const verifiedSource = flow.source === 'verified';
  return <span title={flow.sourceName} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold', verifiedSource ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>{verifiedSource ? <BookOpenCheck className="h-3 w-3" /> : <FileQuestion className="h-3 w-3" />}{verifiedSource ? 'Đã đối soát docs' : 'Cần bổ sung nguồn'}</span>;
}

function GroupCatalog({ phase, activeFlowId, onSelect }: { phase: JourneyPhase; activeFlowId: string; onSelect: (flow: JourneyFlow) => void }) {
  return <div className="space-y-3">{phase.groups.map((group) => <section key={group.id}><div className="mb-1.5 flex items-center justify-between px-1"><div><h2 className="text-[11px] font-semibold text-foreground">{group.name}</h2><p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground">{group.description}</p></div><span className="ml-2 shrink-0 text-[9px] text-muted-foreground">{group.flows.length}</span></div><div className="space-y-1">{group.flows.map((flow) => <button key={flow.id} type="button" onClick={() => onSelect(flow)} aria-pressed={flow.id === activeFlowId} className={cn('group flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', flow.id === activeFlowId ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:border-border hover:bg-white')}><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: flow.source === 'verified' ? phase.color : '#94a3b8' }} /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium">{flow.name}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">{flow.steps.length} bước · {flow.source === 'verified' ? 'Có nguồn' : 'Chờ nguồn'}</span></span><ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5', flow.id === activeFlowId && 'text-primary')} /></button>)}</div></section>)}</div>;
}

function SearchResults({ results, query, onSelect }: { results: { phase: JourneyPhase; group: JourneyGroup; flow: JourneyFlow }[]; query: string; onSelect: (phase: JourneyPhase, flow: JourneyFlow) => void }) {
  if (!results.length) return <div className="rounded-lg border border-dashed border-border bg-white p-4 text-center"><Search className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xs font-medium">Không tìm thấy “{query}”</p><p className="mt-1 text-[10px] text-muted-foreground">Thử tên nghiệp vụ như “nạp tiền”, “CCCD” hoặc “phái sinh”.</p></div>;
  return <div><div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{results.length} kết quả gần nhất</div><div className="space-y-1.5">{results.map(({ phase, group, flow }) => <button key={`${phase.id}-${flow.id}`} type="button" onClick={() => onSelect(phase, flow)} className="group w-full rounded-lg border border-border bg-white p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold" style={{ color: phase.color, background: `${phase.color}15` }}>{phase.code}</span><span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{flow.name}</span><ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div><div className="mt-1.5 truncate pl-8 text-[9px] text-muted-foreground">{phase.name} · {group.name} · {flow.steps.length} bước</div></button>)}</div></div>;
}

function StepRow({ item, index, color, selected, timeFrameId, onSelect }: { item: JourneyStep; index: number; color: string; selected: boolean; timeFrameId: Parameters<typeof volumeForTimeFrame>[1]; onSelect: () => void }) {
  const signals = stepSignals(item);
  const coverage = coverageOf(signals);
  const volume = volumeForTimeFrame(signals.reduce((sum, signal) => sum + signal.volumePerDay, 0), timeFrameId);
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={cn('relative flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selected ? 'border-primary/50 shadow-[0_8px_24px_-18px_rgba(15,23,42,.6)] ring-1 ring-primary/10' : 'border-border hover:border-primary/30 hover:bg-slate-50')}><span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-[10px] font-bold" style={{ background: selected ? color : `${color}18`, color: selected ? 'white' : color }}>{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{item.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{item.description}</span></span><span className="grid shrink-0 grid-cols-3 gap-4 text-right"><span><span className="block text-[9px] text-muted-foreground">Touchpoint</span><span className="mt-0.5 block text-[11px] font-semibold tabular-nums">{item.touchpointIds.length || '—'}</span></span><span><span className="block text-[9px] text-muted-foreground">Signal</span><span className="mt-0.5 block text-[11px] font-semibold tabular-nums">{signals.length || '—'}</span></span><span><span className="block text-[9px] text-muted-foreground">Volume</span><span className="mt-0.5 block text-[11px] font-semibold tabular-nums">{volume ? fmtNum(volume) : '—'}</span></span></span>{signals.length > 0 && <span className="w-16 shrink-0"><CoverageBar stats={coverage} height="h-1.5" showLabel={false} /><span className="mt-1 block text-right text-[9px] font-semibold" style={{ color }}>{coverage.score}%</span></span>}<ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground', selected && 'text-primary')} /></button>;
}

function StepInspector({ step: item, phase, timeFrameId }: { step: JourneyStep; phase: JourneyPhase; timeFrameId: Parameters<typeof volumeForTimeFrame>[1] }) {
  const entries = useMemo(() => item.touchpointIds.map(findTouchpointById).filter(Boolean), [item]);
  const signals = stepSignals(item);
  const coverage = coverageOf(signals);
  const kpis = [...new Set(signals.flatMap((signal) => signal.kpiIds))].map(kpiById).filter(Boolean);
  const timeFrame = timeFrameById(timeFrameId);
  return <aside aria-label="Chi tiết bước" className="flex min-h-0 flex-col border-l border-border bg-slate-50/70"><div className="border-b border-border bg-white p-4"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><CircleDot className="h-3.5 w-3.5" style={{ color: phase.color }} />Inspector</div><h2 className="mt-2 text-sm font-bold">{item.name}</h2><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{item.description}</p>{signals.length > 0 && <div className="mt-3"><div className="mb-1 flex items-center justify-between text-[9px] text-muted-foreground"><span>Signal coverage</span><strong className="text-foreground">{coverage.score}%</strong></div><CoverageBar stats={coverage} height="h-1.5" showLabel={false} /></div>}</div><div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"><InspectorSection icon={<Layers3 className="h-3.5 w-3.5" />} title={`Touchpoint (${entries.length})`}>{entries.length ? entries.map((entry) => entry && <div key={entry.touchpoint.id} className="rounded-lg border border-border bg-white p-3"><div className="flex items-start gap-2"><span className="min-w-0 flex-1 text-[11px] font-semibold">{entry.touchpoint.name}</span><ChannelChip channel={entry.touchpoint.channel} /></div><p className="mt-1.5 text-[9px] leading-4 text-muted-foreground">{entry.touchpoint.description}</p><div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground"><Users className="h-3 w-3" />{fmtNum(volumeForTimeFrame(entry.touchpoint.dailyUsers, timeFrameId))} KH / {timeFrame.label}</div></div>) : <Empty text="Bước này chưa được map touchpoint." />}</InspectorSection><InspectorSection icon={<GitBranch className="h-3.5 w-3.5" />} title={`Signal (${signals.length})`}>{signals.length ? signals.map((signal) => <div key={signal.id} className="rounded-lg border border-border bg-white p-3"><div className="flex items-start justify-between gap-2"><code className="break-all text-[10px] font-semibold text-primary">{signal.name}</code><StatusBadge status={signal.status} size="xs" /></div><p className="mt-1.5 text-[9px] leading-4 text-muted-foreground">{signal.description}</p><div className="mt-2 flex items-center justify-between"><PlatformChips platforms={signal.platforms} /><span className="text-[9px] text-muted-foreground">{fmtNum(volumeForTimeFrame(signal.volumePerDay, timeFrameId))}</span></div></div>) : <Empty text="Chưa có signal cho bước này." />}</InspectorSection><InspectorSection icon={<CircleDot className="h-3.5 w-3.5" />} title={`KPI liên kết (${kpis.length})`}>{kpis.length ? kpis.map((kpi) => kpi && <div key={kpi.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-2.5"><span className="min-w-0 truncate text-[10px] font-medium">{kpi.name}</span><span className="ml-2 shrink-0 text-[11px] font-bold text-primary">{kpi.value}</span></div>) : <Empty text="Chưa liên kết KPI." />}</InspectorSection></div></aside>;
}

function InspectorSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section><h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{icon}{title}</h3><div className="space-y-2">{children}</div></section>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-white p-3 text-[10px] text-muted-foreground">{text}</div>;
}
