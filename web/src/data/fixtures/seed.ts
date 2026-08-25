import type { CxmData, Cfg, Dim } from "../schema/index.ts";
import { projectCustomerBands } from "../projectBands.ts";

/* KHÔNG export: `seed` thật là ảnh CHIẾU của literal này qua `cfgDefault` (xem cuối file). Tách hai
   tên để nhãn dải của khách không thể là thứ viết tay lọt ra ngoài — mọi consumer nhận nhãn do
   `cuts` sinh. Phải là hai `const` chứ không phải một, vì `cfgDefault` khai bên dưới trong cùng file
   (const không hoist) nên phép chiếu chỉ chạy được sau chỗ đó. */
const seedRaw: CxmData = {
  // Mốc số liệu — khớp ngày kết thúc chung của ba period ngay dưới đây (đo 07/08, charter §13).
  asOf: "27/07/2026",
  periods: [
    { id: "d7", label: "3 tháng gần nhất", range: "28/04/2026 – 27/07/2026", factor: 2.8 },
    { id: "d30", label: "6 tháng gần nhất", range: "28/01/2026 – 27/07/2026", factor: 5.6 },
    { id: "m3", label: "1 năm gần nhất", range: "28/07/2025 – 27/07/2026", factor: 11 },
  ],
  scopes: [
    { id: "onboarding", label: "Mở tài khoản · Pilot" },
    { id: "all", label: "Toàn bộ hành trình" },
  ],
  phases: [
    { id: "p1", code: "01", name: "Tìm hiểu & Tiếp cận" },
    { id: "p2", code: "02", name: "Mở tài khoản" },
    { id: "p3", code: "03", name: "Dòng tiền" },
    { id: "p4", code: "04", name: "Giao dịch" },
    { id: "p5", code: "05", name: "Quản lý tài khoản" },
    { id: "p6", code: "06", name: "Chăm sóc, khiếu nại & Churn" },
  ],
  groups: [
    { id: "g-reach", phaseId: "p1", name: "Thu hút", desc: "Kênh marketing, landing, referral" },
    { id: "g-lead", phaseId: "p1", name: "Lead & Xác thực SĐT", desc: "Form đăng ký, OTP" },
    { id: "g-open", phaseId: "p2", name: "Mở tài khoản mới", desc: "Từ khởi tạo hồ sơ tới kích hoạt" },
    { id: "g-activate", phaseId: "p2", name: "Định hướng sau mở", desc: "Onboarding trong app, first action" },
    { id: "g-in", phaseId: "p3", name: "Nộp tiền", desc: "QR, cổng NH, liên kết, quầy — và tra soát" },
    { id: "g-out", phaseId: "p3", name: "Rút & chuyển tiền", desc: "Rút về ngân hàng, chuyển nội bộ" },
    { id: "g-eq", phaseId: "p4", name: "Cổ phiếu & ETF", desc: "T+2 · tiền mặt hoặc margin" },
    { id: "g-cw", phaseId: "p4", name: "Chứng quyền CW", desc: "T+2 · không được ký quỹ" },
    { id: "g-right", phaseId: "p4", name: "Quyền mua ưu đãi", desc: "Chỉ tiền mặt · nộp trước 16h ngày cuối" },
    { id: "g-bond", phaseId: "p4", name: "Trái phiếu DBOND/VBOND", desc: "Chỉ tiền mặt · kỳ hạn 30–365 ngày" },
    { id: "g-fund", phaseId: "p4", name: "Chứng chỉ quỹ mở", desc: "Theo phiên NAV · chỉ tiền mặt" },
    { id: "g-deriv", phaseId: "p4", name: "Phái sinh VN30F", desc: "Ký quỹ riêng tại VSDC · T+0" },
    { id: "g-mgn", phaseId: "p4", name: "Margin (GDKQ)", desc: "Đăng ký, call margin" },
    { id: "g-adv", phaseId: "p4", name: "Ứng trước tiền bán", desc: "Dùng ngay, không cần đăng ký" },
    { id: "g-idv", phaseId: "p5", name: "Định danh & giấy tờ", desc: "CCCD gắn chip" },
    { id: "g-info", phaseId: "p5", name: "Thông tin & thụ hưởng", desc: "Thông tin cá nhân, TK nhận tiền" },
    { id: "g-sec", phaseId: "p5", name: "Bảo mật & thiết bị", desc: "Mật khẩu, PIN, Smart OTP, thiết bị tin cậy" },
    { id: "g-report", phaseId: "p5", name: "Báo cáo & tài sản", desc: "Sao kê, tổng quan tài sản, lãi lỗ" },
    { id: "g-care", phaseId: "p6", name: "Hỗ trợ & khiếu nại", desc: "Hotline, chat, khiếu nại" },
    { id: "g-churn", phaseId: "p6", name: "Inactive & Win-back", desc: "Ngừng giao dịch, phục hồi" },
  ],
  flows: [
{ id:'f-reach-ref', groupId:'g-reach', name:'Giới thiệu bạn bè (referral)', owner:'Marketing', version:'v0.3',
      src:'—', note:'Chưa có sơ đồ nguồn' },
    { id:'f-lead-otp',  groupId:'g-lead', name:'Đăng ký & xác thực SĐT', owner:'Growth', version:'v0.9',
      src:'—', note:'Bước nhập SĐT nằm trong AJ 9, chưa có sơ đồ riêng ở mức chi tiết' },

    
    { id:'f-open-2026', groupId:'g-open', name:'Mở tài khoản mới 2026', owner:'Onboarding Squad', version:'v1.0-pilot',
      src:'Account Journey · Sơ đồ 2 & 9',
      note:'AJ 9 là luồng MTK 2026; AJ 2 là 4 phương thức xác thực dùng bên trong. Cố ý KHÔNG tách AJ 2 thành flow riêng' },
    { id:'f-onb-first', groupId:'g-activate', name:'Định hướng & giao dịch đầu tiên', owner:'Growth', version:'v0.4',
      src:'—', note:'Chưa có sơ đồ nguồn' },

    
    { id:'f-dep-4ch',   groupId:'g-in', name:'Nạp tiền — QR · cổng NH · liên kết · quầy', owner:'Payments', version:'v1.2',
      src:'Money Journey · Sơ đồ 2',
      note:'4 kênh trong MỘT sơ đồ: quét QR (ghi có ngay, dưới 500tr/lần) · cổng nộp tiền CK (BIDV·VIB·VCB·VietinBank·VPBank) · liên kết NH chi hộ tự động (chỉ BIDV·VPBank, trùng CCCD) · nộp tại quầy (4 TK tổng ACB·BIDV·VCB·VietinBank). Tiền vào TK chuyên dụng 021C01 cơ sở / 021C02 phái sinh. Không hỗ trợ ATM và thẻ Visa. Nộp 17h–20h có thể chờ xử lý cuối ngày' },
    { id:'f-dep-trace', groupId:'g-in', name:'Tra soát nạp tiền', owner:'Payments', version:'v1.0',
      src:'Money Journey · Sơ đồ 2',
      note:'Sub-flow phục hồi 6 trạng thái: Tạo yêu cầu (chứng từ tối đa 5 file) → Chờ tiếp nhận → Đang xử lý TTTT → Chờ bên thứ ba → Hoàn tất (ghi có / hoàn tiền) hoặc Từ chối. SLA 1 ngày làm việc' },
    { id:'f-wd',        groupId:'g-out', name:'Rút tiền về ngân hàng', owner:'Payments', version:'v1.1',
      src:'Money Journey · Sơ đồ 5',
      note:'Chuỗi cổng: số dư ĐƯỢC PHÉP rút (= dư tiền − chờ T+2 − nợ margin và lãi − phong tỏa − ký quỹ PS) → RTT > 100% (dưới thì Smart Sell) → xác thực CCCD qua VNeID (bắt buộc TK mở sau 01/01/2026) → chữ ký video call (TK phái sinh) → hoàn thiện hợp đồng → OTP → giờ và hạn mức (08–16h không hạn mức; 16h–08h tối đa 499.999.999đ) → blackout sau 16h ngày làm việc cuối tháng' },
    { id:'f-tr-sub',    groupId:'g-out', name:'Chuyển tiền nội bộ giữa TK giao dịch', owner:'Payments', version:'v0.8',
      src:'Money Journey · Sơ đồ 7',
      note:'Chỉ giữa các tài khoản của cùng một chủ tài khoản. Không đi ra ngân hàng nên không phải Nạp/Rút' },

    
    { id:'f-eq-buy',    groupId:'g-eq', name:'Mua cổ phiếu / ETF', owner:'Trading Core', version:'v2.0',
      src:'Money Journey · Sơ đồ 3',
      note:'T+2 · tiền mặt HOẶC margin nếu mã thuộc danh mục ký quỹ' },
    { id:'f-eq-sell',   groupId:'g-eq', name:'Bán cổ phiếu / ETF + thuế phí', owner:'Trading Core', version:'v2.0',
      src:'Money Journey · Sơ đồ 4',
      note:'Khấu trừ trực tiếp khỏi tiền bán: phí giao dịch → thuế TNCN chuyển nhượng 0,1% mọi lệnh bán → thuế TNCN đầu tư vốn 5% nếu là CK quyền. Tiền net về T+2 hoặc UTTB nhận ngay có phí' },
    { id:'f-cw-buy',    groupId:'g-cw', name:'Mua chứng quyền CW', owner:'Trading Core', version:'v1.4',
      src:'Money Journey · Sơ đồ 3',
      note:'Chỉ CW MUA · KHÔNG được ký quỹ · T+2' },
    { id:'f-cw-settle', groupId:'g-cw', name:'Bán / đáo hạn CW', owner:'Trading Core', version:'v1.4',
      src:'Money Journey · Sơ đồ 4',
      note:'Đáo hạn ITM → chênh lệch = giá CKCS bình quân 5 phiên − giá thực hiện' },
    { id:'f-right',     groupId:'g-right', name:'Thực hiện quyền mua ưu đãi', owner:'Trading Core', version:'v0.9',
      src:'Money Journey · Sơ đồ 3 & 4',
      note:'Nộp = giá đăng ký × số lượng, trước 16h ngày cuối. CP về sau niêm yết bổ sung. Thuế TNCN đầu tư vốn 5% = SL CP quyền × mệnh giá × 5%' },
    { id:'f-bond-buy',  groupId:'g-bond', name:'Mua trái phiếu DBOND / VBOND', owner:'Wealth Squad', version:'v1.0',
      src:'Money Journey · Sơ đồ 3',
      note:'CHỈ mua bằng tiền mặt, không margin · hạch toán T (riêng lẻ) / T+1 (niêm yết) · kỳ hạn 30–365 ngày' },
    { id:'f-bond-sell', groupId:'g-bond', name:'Trả lại trái phiếu — sớm / đúng hạn', owner:'Wealth Squad', version:'v0.5',
      src:'Money Journey · Sơ đồ 4',
      note:'Trả lại SỚM → chỉ 0,1%/năm, mất lãi cam kết. Lãi suất thực nhận đã gồm thuế và phí. UTTB được nếu là trái phiếu niêm yết' },
    { id:'f-fund-buy',  groupId:'g-fund', name:'Mua chứng chỉ quỹ theo phiên NAV', owner:'Wealth Squad', version:'v0.7',
      src:'Money Journey · Sơ đồ 3',
      note:'CHỈ tiền mặt · nộp từ số dư TK hoặc TK ngân hàng · thanh toán tùy quỹ' },
    { id:'f-fund-sell', groupId:'g-fund', name:'Bán CCQ & chọn nơi nhận tiền', owner:'Wealth Squad', version:'v0.5',
      src:'Money Journey · Sơ đồ 4',
      note:'Bán theo phiên NAV, phí tùy quỹ theo thời gian nắm giữ. Khách CHỌN nơi nhận: về TK chứng khoán, hoặc về thẳng TK ngân hàng — nhánh sau là dòng tiền RA mà KHÔNG qua bước Rút' },
    { id:'f-deriv-open', groupId:'g-deriv', name:'Mở tài khoản phái sinh', owner:'Derivatives Squad', version:'v1.0',
      src:'Account Journey · Sơ đồ 11',
      note:'Cần TK cơ sở + đã xác thực CCCD. Ký hợp đồng bằng OTP SMS. SLA ~1 ngày làm việc chờ VSDC duyệt. Chữ ký đầy đủ chỉ cần để KÍCH HOẠT RÚT TIỀN. TK phái sinh = tiểu khoản mã có chữ P' },
    { id:'f-deriv-pro', groupId:'g-deriv', name:'Đăng ký & dùng Phái sinh Pro', owner:'Derivatives Squad', version:'v0.8',
      src:'Account Journey · Sơ đồ 12',
      note:'IM 5,6% nếu đóng vị thế trong ngày vs 17,5% nếu giữ qua đêm. Cổng: xác thực khuôn mặt (AJ 2-C), chỉ thao tác được trên DGO app. Ký hợp đồng và OTP trong 8h–16h ngày làm việc' },
    { id:'f-deriv-margin', groupId:'g-deriv', name:'Nộp / rút ký quỹ CCP – VSDC', owner:'Risk', version:'v1.0',
      src:'Money Journey · Sơ đồ 6',
      note:'Nộp và rút ký quỹ CHỈ trong 8h–16h ngày giao dịch. Phí duy trì TK phái sinh 100.000đ/tháng khi phát sinh số dư CCP. Sau KRX, VND tự nộp phần ký quỹ thiếu cuối ngày' },
    { id:'f-deriv-trade', groupId:'g-deriv', name:'Giao dịch VN30F', owner:'Derivatives Squad', version:'v1.1',
      src:'Money Journey · Sơ đồ 3 & 4',
      note:'Ký quỹ riêng tại VSDC 17,5% (an toàn 21,875%) · T+0 · không dùng margin cơ sở. Lãi/lỗ thanh toán HÀNG NGÀY: lãi về sáng T+1, lỗ khấu trừ hoặc nợ thấu chi trước 13h T+1. Đáo hạn thứ 5 tuần thứ 3' },
    { id:'f-mgn-reg',   groupId:'g-mgn', name:'Đăng ký Margin (GDKQ)', owner:'Margin Squad', version:'v1.0',
      src:'Account Journey · Sơ đồ 10',
      note:'Gói CƠ BẢN (DMargin) chỉ cần ký OTP. Nâng cấp NÂNG CAO (T10/T15) hoặc chuyển đổi sản phẩm BẮT BUỘC xác thực khuôn mặt (AJ 2-C), chỉ làm trên DGO app. 1 sản phẩm / 1 tiểu khoản' },
    { id:'f-mgn-call',  groupId:'g-mgn', name:'Call margin & xử lý', owner:'Risk', version:'v1.1',
      src:'—',
      note:'Chưa có sơ đồ nguồn ở cả Account Journey lẫn Money Journey' },
    { id:'f-adv',       groupId:'g-adv', name:'Ứng trước tiền bán (UTTB)', owner:'Margin Squad', version:'v0.9',
      src:'Account Journey · Sơ đồ 13',
      note:'Dùng ngay, không cần đăng ký. Ứng tiền lệnh bán đã khớp, thủ công hoặc tự động' },

    
    { id:'f-cccd-chip', groupId:'g-idv', name:'Cập nhật / thay đổi CCCD gắn chip', owner:'Onboarding', version:'v1.0',
      src:'Account Journey · Sơ đồ 4',
      note:'Chỉ làm được trên DGO app. Là cổng chặn của xác thực và của rút tiền' },
    { id:'f-info-change', groupId:'g-info', name:'Thay đổi thông tin cá nhân', owner:'CS Center', version:'v1.0',
      src:'Account Journey · Sơ đồ 3',
      note:'Kênh My DGO web. Chữ ký trong hồ sơ phải đồng nhất mẫu đã xác thực' },
    { id:'f-benef',     groupId:'g-info', name:'Thêm / xóa thông tin thụ hưởng', owner:'Payments', version:'v1.0',
      src:'Account Journey · Sơ đồ 5',
      note:'Sai thông tin thụ hưởng là CHẶN RÚT TIỀN — đây là nguồn friction thật, không phải phụ lục' },
    { id:'f-security',  groupId:'g-sec', name:'Mật khẩu · PIN · Smart OTP · thiết bị tin cậy', owner:'Security', version:'v1.2',
      src:'Account Journey · Sơ đồ 6',
      note:'Đăng nhập và xác thực giao dịch' },
    { id:'f-report',    groupId:'g-report', name:'Sao kê · tổng quan tài sản · lãi lỗ · lịch dòng tiền', owner:'Product', version:'v0.6',
      src:'Account Journey · Sơ đồ 7',
      note:'Gộp flow "Danh mục & lãi lỗ" cũ vào đây — AJ 7 đã bao gồm tổng quan tài sản' },

    
    { id:'f-care',      groupId:'g-care', name:'Hotline & chat hỗ trợ', owner:'CS Center', version:'v1.3',
      src:'—', note:'Chưa có sơ đồ nguồn' },
    { id:'f-claim',     groupId:'g-care', name:'Khiếu nại', owner:'CS Center', version:'v1.0',
      src:'—', note:'Chưa có sơ đồ nguồn. Tra soát nạp tiền đã tách thành f-dep-trace ở phase 03' },
    { id:'f-churn',     groupId:'g-churn', name:'Ngừng giao dịch & win-back', owner:'CRM', version:'v0.4',
      src:'—', note:'Chưa có sơ đồ nguồn' },
  ],
  steps: [
{ id:'s1', flowId:'f-open-2026', code:'01', name:'Khởi tạo hồ sơ',            stationId:'JS-MTK-01', owner:'Growth' },
    { id:'s2', flowId:'f-open-2026', code:'02', name:'Xác thực CCCD · VNeID/NFC', stationId:'JS-MTK-02', owner:'Onboarding' },
    { id:'s3', flowId:'f-open-2026', code:'03', name:'Liveness & Face match',     stationId:'JS-MTK-03', owner:'Onboarding' },
    { id:'s4', flowId:'f-open-2026', code:'04', name:'Thông tin & NH thụ hưởng',  stationId:'JS-MTK-04', owner:'Product' },
    { id:'s5', flowId:'f-open-2026', code:'05', name:'Chọn số TK & ký hợp đồng',  stationId:'JS-MTK-05', owner:'Onboarding' },
    { id:'s6', flowId:'f-open-2026', code:'06', name:'Kích hoạt tài khoản',       stationId:'JS-MTK-06', owner:'Core Account' },

    /* ---- Pilot mở rộng 05/08/2026: mở TK phái sinh + nạp · rút · chuyển tiền nội bộ ----
       Owner chốt: "cứ làm demo đi … mình sẽ là người đề xuất đo những gì, hiện sẽ pilot tất cả của
       mở tk và nạp rút, chuyển tiền". Bước dưới đây là ĐỀ XUẤT của mình, đọc từ chính `note` của flow
       (sơ đồ nguồn AJ 11 · MJ 2 · MJ 5 · MJ 7), KHÔNG phải sơ đồ bước có sẵn.

       Ba quyết định mô hình, ghi ra để người sau bắt lỗi được thay vì phải đoán:

       1. `f-dep-4ch` — 4 kênh nạp KHÔNG tách thành 4 nhánh bước. Theo đúng tiền lệ owner đã chốt ở
          `f-open-2026` ("AJ 2 là 4 phương thức xác thực dùng bên trong. Cố ý KHÔNG tách AJ 2 thành
          flow riêng"). Bước ở đây là ĐƯỜNG TIỀN mà cả 4 kênh đều đi qua (về TK chuyên dụng → đối
          soát → ghi có → khả dụng); KÊNH NÀO là một GIÁ TRỊ của điểm đo ở bước 01, không phải một
          bước. Hệ quả cố ý: bước "khách bấm nạp trong app" không có ở đây vì kênh quầy không có nó —
          dựng bước đó sẽ là dựng một bước mà 1/4 khách không hề đi qua.

       2. `f-dep-trace` — 6 trạng thái nguồn gộp còn 4 bước. "Chờ bên thứ ba" là TRẠNG THÁI BÊN TRONG
          bước xử lý (thành giá trị của điểm đo), không phải bước riêng; "Hoàn tất" và "Từ chối" là
          HAI KẾT CỤC của bước cuối (`completed` / `failed`), không phải hai bước. Dựng 6 bước tuần tự
          sẽ buộc phải bịa số cho `entered` của một bước mà nhiều yêu cầu không đi qua.

       3. `f-wd` — chuỗi 8 cổng trong `note` gộp còn 7 bước: gộp "chữ ký video call PS" với "hoàn thiện
          hợp đồng" (bước 04), gộp "giờ và hạn mức" với "blackout cuối tháng" (bước 06, cùng là cổng
          thời gian). Bước 07 là tiền thật ra khỏi VNDIRECT — không phải cổng, mà là kết cục.

       CÁCH ĐỌC `obs` (quan trọng, Đ5): mỗi flow đọc như MỘT nhóm khách đã đi hết trong ngày, nên
       `entered === completed + failed` và `completed[n] === entered[n+1]` đúng tuyệt đối. Dữ liệu thật
       đo theo THỜI ĐIỂM sẽ có yêu cầu còn treo giữa hai bước (rõ nhất: `f-dep-trace` đang chờ bên thứ
       ba, `f-deriv-open` đang chờ VSDC duyệt) — lúc đó hai đẳng thức này VỠ, và phải có người khai
       luật đối chiếu (tính khoản treo vào đâu), KHÔNG được để component tự chọn số cho êm. */

    { id:'s-dvo-1', flowId:'f-deriv-open', code:'01', name:'Kiểm tra điều kiện mở PS',      stationId:'JS-MTKPS-01', owner:'Derivatives Squad' },
    { id:'s-dvo-2', flowId:'f-deriv-open', code:'02', name:'Chọn tiểu khoản P & xác nhận',  stationId:'JS-MTKPS-02', owner:'Derivatives Squad' },
    { id:'s-dvo-3', flowId:'f-deriv-open', code:'03', name:'Ký hợp đồng bằng OTP SMS',      stationId:'JS-MTKPS-03', owner:'Derivatives Squad' },
    { id:'s-dvo-4', flowId:'f-deriv-open', code:'04', name:'Chờ VSDC duyệt',                stationId:'JS-MTKPS-04', owner:'Risk' },
    { id:'s-dvo-5', flowId:'f-deriv-open', code:'05', name:'Kích hoạt tài khoản phái sinh', stationId:'JS-MTKPS-05', owner:'Core Account' },

    { id:'s-nap-1', flowId:'f-dep-4ch', code:'01', name:'Tiền về TK chuyên dụng',        stationId:'JS-NAP-01', owner:'Payments' },
    { id:'s-nap-2', flowId:'f-dep-4ch', code:'02', name:'Đối soát chủ khoản',           stationId:'JS-NAP-02', owner:'Payments' },
    { id:'s-nap-3', flowId:'f-dep-4ch', code:'03', name:'Ghi có vào tiểu khoản',        stationId:'JS-NAP-03', owner:'Core Account' },
    { id:'s-nap-4', flowId:'f-dep-4ch', code:'04', name:'Số dư khả dụng để giao dịch',  stationId:'JS-NAP-04', owner:'Core Account' },

    { id:'s-tra-1', flowId:'f-dep-trace', code:'01', name:'Tạo yêu cầu tra soát',        stationId:'JS-TRA-01', owner:'CS Center' },
    { id:'s-tra-2', flowId:'f-dep-trace', code:'02', name:'Tiếp nhận yêu cầu',           stationId:'JS-TRA-02', owner:'Payments' },
    { id:'s-tra-3', flowId:'f-dep-trace', code:'03', name:'Xử lý tại TTTT',              stationId:'JS-TRA-03', owner:'Payments' },
    { id:'s-tra-4', flowId:'f-dep-trace', code:'04', name:'Kết thúc — ghi có / hoàn tiền',stationId:'JS-TRA-04', owner:'Payments' },

    { id:'s-rut-1', flowId:'f-wd', code:'01', name:'Số dư được phép rút',            stationId:'JS-RUT-01', owner:'Risk' },
    { id:'s-rut-2', flowId:'f-wd', code:'02', name:'Cổng RTT > 100%',                stationId:'JS-RUT-02', owner:'Risk' },
    { id:'s-rut-3', flowId:'f-wd', code:'03', name:'Xác thực CCCD qua VNeID',        stationId:'JS-RUT-03', owner:'Onboarding' },
    { id:'s-rut-4', flowId:'f-wd', code:'04', name:'Chữ ký & hợp đồng rút tiền',     stationId:'JS-RUT-04', owner:'Payments' },
    { id:'s-rut-5', flowId:'f-wd', code:'05', name:'Xác thực OTP',                   stationId:'JS-RUT-05', owner:'Security' },
    { id:'s-rut-6', flowId:'f-wd', code:'06', name:'Cổng giờ, hạn mức & blackout',   stationId:'JS-RUT-06', owner:'Payments' },
    { id:'s-rut-7', flowId:'f-wd', code:'07', name:'Chuyển tiền ra ngân hàng',       stationId:'JS-RUT-07', owner:'Payments' },

    { id:'s-ctn-1', flowId:'f-tr-sub', code:'01', name:'Chọn tiểu khoản nguồn & đích', stationId:'JS-CTNB-01', owner:'Payments' },
    { id:'s-ctn-2', flowId:'f-tr-sub', code:'02', name:'Kiểm tra số dư khả dụng',      stationId:'JS-CTNB-02', owner:'Risk' },
    { id:'s-ctn-3', flowId:'f-tr-sub', code:'03', name:'Xác thực OTP',                 stationId:'JS-CTNB-03', owner:'Security' },
    { id:'s-ctn-4', flowId:'f-tr-sub', code:'04', name:'Ghi giảm & ghi tăng hai tiểu khoản', stationId:'JS-CTNB-04', owner:'Core Account' },
  ],
  obs: [
{ stepId:'s1', entered:18420, completed:17690, failed:730,  effort:1.1, cov:96 },
    { stepId:'s2', entered:17690, completed:15840, failed:1850, effort:1.6, cov:71 },
    { stepId:'s3', entered:15840, completed:13190, failed:2650, effort:2.4, cov:64 },
    { stepId:'s4', entered:13190, completed:12760, failed:430,  effort:1.1, cov:92 },
    { stepId:'s5', entered:12760, completed:11990, failed:770,  effort:1.3, cov:58 },
    { stepId:'s6', entered:11990, completed:11840, failed:150,  effort:1.0, cov:89 },

    /* Số của pilot mở rộng — SỐ DEMO do mình đề xuất (xem docblock ở `steps` phía trên), chọn theo
       nghiệp vụ đã ghi trong `note` của từng flow: cổng nào sách vở nói là nặng thì cho `failed` cao
       và `cov` thấp. Ba chỗ đáng nhìn: `s-rut-3` (VNeID — bắt buộc với TK mở sau 01/01/2026 nên chặn
       nhiều nhất trong chuỗi rút), `s-nap-2` (đối soát chủ khoản — đây là nơi sinh ra tra soát), và
       `s-nap-1` `failed:0` cố ý (tiền đã về TK chuyên dụng thì không có khoản nào "vào mà không vào"
       — số 0 này là số ĐÚNG, không phải số chưa điền).
       LƯU Ý cố ý KHÔNG nối: `failed` của `s-nap-2` (130) và `entered` của `f-dep-trace` (148) là HAI
       nhóm khác nhau — tra soát hôm nay gồm cả khoản tồn từ hôm trước. Cho hai số bằng nhau thì biểu
       đồ đẹp hơn nhưng đó là số bịa cho vừa mắt. */
    { stepId:'s-dvo-1', entered:1240, completed:1050, failed:190, effort:1.2, cov:88 },
    { stepId:'s-dvo-2', entered:1050, completed:1010, failed:40,  effort:1.1, cov:91 },
    { stepId:'s-dvo-3', entered:1010, completed:942,  failed:68,  effort:1.5, cov:76 },
    { stepId:'s-dvo-4', entered:942,  completed:903,  failed:39,  effort:1.0, cov:94 },
    { stepId:'s-dvo-5', entered:903,  completed:898,  failed:5,   effort:1.0, cov:96 },

    { stepId:'s-nap-1', entered:9640, completed:9640, failed:0,   effort:1.0, cov:99 },
    { stepId:'s-nap-2', entered:9640, completed:9510, failed:130, effort:1.3, cov:82 },
    { stepId:'s-nap-3', entered:9510, completed:9486, failed:24,  effort:1.0, cov:97 },
    { stepId:'s-nap-4', entered:9486, completed:9481, failed:5,   effort:1.0, cov:98 },

    /* `cov` của hai bước này CỐ Ý không lấy 64 và 58: hai số đó đã là `cov` của s3 và s5, và
       CoverageBlock chỉ vẽ bước dưới ngưỡng 70 nên trùng số sẽ làm hai thanh khác nhau hiện cùng một
       nhãn "64%" — người đọc không biết thanh nào là bước nào. Lệch 1 điểm, không đổi ý nghĩa. */
    { stepId:'s-tra-1', entered:148, completed:141, failed:7,  effort:2.6, cov:63 },
    { stepId:'s-tra-2', entered:141, completed:136, failed:5,  effort:1.2, cov:79 },
    { stepId:'s-tra-3', entered:136, completed:121, failed:15, effort:1.8, cov:59 },
    { stepId:'s-tra-4', entered:121, completed:113, failed:8,  effort:1.1, cov:86 },

    { stepId:'s-rut-1', entered:3180, completed:2905, failed:275, effort:1.1, cov:95 },
    { stepId:'s-rut-2', entered:2905, completed:2848, failed:57,  effort:1.2, cov:88 },
    { stepId:'s-rut-3', entered:2848, completed:2612, failed:236, effort:2.2, cov:61 },
    { stepId:'s-rut-4', entered:2612, completed:2551, failed:61,  effort:2.0, cov:57 },
    { stepId:'s-rut-5', entered:2551, completed:2498, failed:53,  effort:1.3, cov:84 },
    { stepId:'s-rut-6', entered:2498, completed:2364, failed:134, effort:1.1, cov:90 },
    { stepId:'s-rut-7', entered:2364, completed:2351, failed:13,  effort:1.0, cov:96 },

    { stepId:'s-ctn-1', entered:2140, completed:2098, failed:42,  effort:1.2, cov:86 },
    { stepId:'s-ctn-2', entered:2098, completed:1962, failed:136, effort:1.1, cov:93 },
    { stepId:'s-ctn-3', entered:1962, completed:1921, failed:41,  effort:1.3, cov:85 },
    { stepId:'s-ctn-4', entered:1921, completed:1918, failed:3,   effort:1.0, cov:97 },
  ],
  touchpoints: [
{ id:'tp1', stepId:'s1', name:'Form khởi tạo hồ sơ', channel:'app', owner:'Growth',      users:18420, desc:'Màn nhập SĐT và thông tin cơ bản' },
    { id:'tp2', stepId:'s2', name:'Chụp & đọc CCCD',      channel:'app', owner:'Onboarding',  users:17690, desc:'OCR giấy tờ, đối chiếu VNeID hoặc NFC' },
    { id:'tp3', stepId:'s3', name:'Liveness & Face match',channel:'app', owner:'Onboarding',  users:15840, desc:'Quay video xác thực khuôn mặt' },
    { id:'tp4', stepId:'s4', name:'Xác nhận thông tin',   channel:'app', owner:'Product',     users:13190, desc:'Sửa thông tin OCR, chọn NH thụ hưởng' },
    { id:'tp5', stepId:'s5', name:'Ký HĐ điện tử SmartCA',channel:'app', owner:'Onboarding',  users:12760, desc:'Chọn số TK và ký hợp đồng' },
    { id:'tp6', stepId:'s6', name:'Kích hoạt tại core',   channel:'backend', owner:'Core Account', users:11990, desc:'Đồng bộ tài khoản sang hệ thống lõi' },

    /* Điểm tiếp xúc của pilot mở rộng — `users` lấy đúng `obs.entered` của bước tương ứng.
       `channel:'app'` = nơi KHÁCH thao tác; `channel:'backend'` = nơi hệ thống xử lý, khách không
       nhìn thấy. Một điểm tiếp xúc `app` vẫn có thể được đo ở phía server (xem docblock `signals`). */
    { id:'tp-dvo-1', stepId:'s-dvo-1', name:'Màn kiểm tra điều kiện mở PS', channel:'app',     owner:'Derivatives Squad', users:1240, desc:'Báo khách còn thiếu TK cơ sở hay chưa xác thực CCCD' },
    { id:'tp-dvo-2', stepId:'s-dvo-2', name:'Chọn tiểu khoản P',            channel:'app',     owner:'Derivatives Squad', users:1050, desc:'Xác nhận thông tin và chọn tiểu khoản mã có chữ P' },
    { id:'tp-dvo-3', stepId:'s-dvo-3', name:'Ký hợp đồng bằng OTP SMS',     channel:'app',     owner:'Derivatives Squad', users:1010, desc:'Nhập OTP SMS để ký hợp đồng phái sinh' },
    { id:'tp-dvo-4', stepId:'s-dvo-4', name:'Chờ VSDC duyệt',               channel:'backend', owner:'Risk',              users:942,  desc:'Gửi hồ sơ sang VSDC, SLA khoảng 1 ngày làm việc' },
    { id:'tp-dvo-5', stepId:'s-dvo-5', name:'Kích hoạt tiểu khoản P',       channel:'backend', owner:'Core Account',      users:903,  desc:'Mở tiểu khoản phái sinh trên hệ thống lõi' },

    { id:'tp-nap-1', stepId:'s-nap-1', name:'Tiền về TK chuyên dụng',   channel:'backend', owner:'Payments',     users:9640, desc:'Khoản tiền vào 021C01 cơ sở / 021C02 phái sinh từ một trong 4 kênh' },
    { id:'tp-nap-2', stepId:'s-nap-2', name:'Đối soát chủ khoản',       channel:'backend', owner:'Payments',     users:9640, desc:'Ghép khoản tiền với chủ tài khoản; không ghép được thì phải tra soát' },
    { id:'tp-nap-3', stepId:'s-nap-3', name:'Ghi có tiểu khoản',        channel:'backend', owner:'Core Account', users:9510, desc:'Hạch toán vào tiểu khoản của khách' },
    { id:'tp-nap-4', stepId:'s-nap-4', name:'Số dư khả dụng',           channel:'backend', owner:'Core Account', users:9486, desc:'Tiền sẵn sàng để đặt lệnh' },

    { id:'tp-tra-1', stepId:'s-tra-1', name:'Form tạo yêu cầu tra soát', channel:'app',     owner:'CS Center', users:148, desc:'Khách khai thông tin khoản nạp và đính kèm tối đa 5 file chứng từ' },
    { id:'tp-tra-2', stepId:'s-tra-2', name:'Tiếp nhận yêu cầu',         channel:'backend', owner:'Payments',  users:141, desc:'Kiểm tra yêu cầu có đủ điều kiện xử lý' },
    { id:'tp-tra-3', stepId:'s-tra-3', name:'Xử lý tại TTTT',            channel:'backend', owner:'Payments',  users:136, desc:'Đối chiếu với ngân hàng, có thể phải chờ bên thứ ba' },
    { id:'tp-tra-4', stepId:'s-tra-4', name:'Kết quả tra soát',          channel:'backend', owner:'Payments',  users:121, desc:'Ghi có cho khách, hoàn tiền, hoặc từ chối' },

    { id:'tp-rut-1', stepId:'s-rut-1', name:'Màn nhập số tiền rút',        channel:'app',     owner:'Payments',   users:3180, desc:'Hiện số dư ĐƯỢC PHÉP rút, đã trừ T+2, nợ margin, phong tỏa, ký quỹ PS' },
    { id:'tp-rut-2', stepId:'s-rut-2', name:'Cổng RTT',                    channel:'backend', owner:'Risk',       users:2905, desc:'RTT dưới 100% thì chuyển hướng sang Smart Sell' },
    { id:'tp-rut-3', stepId:'s-rut-3', name:'Xác thực CCCD qua VNeID',     channel:'app',     owner:'Onboarding', users:2848, desc:'Bắt buộc với tài khoản mở sau 01/01/2026' },
    { id:'tp-rut-4', stepId:'s-rut-4', name:'Chữ ký video call & hợp đồng',channel:'app',     owner:'Payments',   users:2612, desc:'Chữ ký video call cho TK phái sinh, sau đó hoàn thiện hợp đồng' },
    { id:'tp-rut-5', stepId:'s-rut-5', name:'Nhập OTP',                    channel:'app',     owner:'Security',   users:2551, desc:'Xác thực giao dịch rút tiền' },
    { id:'tp-rut-6', stepId:'s-rut-6', name:'Cổng giờ & hạn mức',          channel:'backend', owner:'Payments',   users:2498, desc:'08–16h không hạn mức; 16h–08h tối đa 499.999.999đ; blackout sau 16h ngày làm việc cuối tháng' },
    { id:'tp-rut-7', stepId:'s-rut-7', name:'Lệnh chuyển tiền ra NH',      channel:'backend', owner:'Payments',   users:2364, desc:'Đẩy lệnh sang ngân hàng thụ hưởng' },

    { id:'tp-ctn-1', stepId:'s-ctn-1', name:'Chọn tiểu khoản nguồn & đích', channel:'app',     owner:'Payments',     users:2140, desc:'Chỉ cho phép giữa các tiểu khoản của cùng một chủ tài khoản' },
    { id:'tp-ctn-2', stepId:'s-ctn-2', name:'Kiểm tra số dư khả dụng',      channel:'backend', owner:'Risk',         users:2098, desc:'Số dư khả dụng của tiểu khoản nguồn' },
    { id:'tp-ctn-3', stepId:'s-ctn-3', name:'Nhập OTP',                     channel:'app',     owner:'Security',     users:1962, desc:'Xác thực lệnh chuyển nội bộ' },
    { id:'tp-ctn-4', stepId:'s-ctn-4', name:'Hạch toán hai tiểu khoản',     channel:'backend', owner:'Core Account', users:1921, desc:'Ghi giảm tiểu khoản nguồn và ghi tăng tiểu khoản đích' },
  ],
  /* Signal.values — danh sách giá trị RỜI RẠC mà chính điểm đo bắn ra (thiết kế
     output/thiet-ke-chart-signal.html §2 lỗ hổng A, §7). Chỉ sg4 có danh sách VIẾT SẴN trong chính
     `desc` ("blur / glare / crop / expired") — bốn signal còn lại (sg1/2/7/10) không có liệt kê
     tường minh trong desc, giá trị dưới đây là SUY DIỄN có căn cứ từ tên/`desc` của chính signal đó
     (quyết định của session này, không phải số đo thật — báo lại trong response, xem mục "tự quyết"):
     sg1/sg10 là sự kiện MỘT giá trị (không có biến thể kết quả) nên values chỉ có đúng 1 phần tử;
     sg2 "bắn lặp theo bước" → giá trị là MÃ BƯỚC (khớp 6 bước s1..s6 của flow f-open-2026); sg3/sg5/
     sg8 là "kết quả mỗi lần" → hai giá trị thành/bại; sg7 "sửa thông tin OCR đọc sai" → giá trị là
     TRƯỜNG bị sửa. sg6 (gap) và sg9 (designed, vol:0) → rỗng, đúng luật "vol===0 ⇒ []". */
  signals: [
{ id:'sg1', tpId:'tp1', name:'account_open_started',        st:'live',       pf:['ios','android','web'], es:'client', vol:614,  seen:'27/07 · 14:52', srcId:'src-ga', metrics:['m-completion'], desc:'Khách bấm Mở tài khoản', instAt:null, values:['tapped'] },
    { id:'sg2', tpId:'tp1', name:'account_open_step_viewed',    st:'live',       pf:['ios','android','web'], es:'client', vol:2840, seen:'27/07 · 14:52', srcId:'src-ga', metrics:['m-completion'], desc:'Hiển thị từng bước của form, bắn lặp theo bước', instAt:null, values:['step_01','step_02','step_03','step_04','step_05','step_06'] },
    { id:'sg3', tpId:'tp2', name:'ekyc_document_capture_result',st:'live',       pf:['ios','android'],       es:'client', vol:920,  seen:'27/07 · 14:50', srcId:'src-ekyc', metrics:['m-ocr'], desc:'Kết quả mỗi lần chụp giấy tờ', instAt:null, values:['success','fail'] },
    { id:'sg4', tpId:'tp2', name:'ekyc_document_fail_reason',   st:'validating', pf:['ios','android'],       es:'client', vol:410,  seen:'27/07 · 13:20', srcId:'src-ekyc', metrics:['m-ocr'], desc:'Lý do thất bại: blur / glare / crop / expired', instAt:null, values:['blur','glare','crop','expired'] },
    { id:'sg5', tpId:'tp3', name:'ekyc_face_liveness_result',   st:'live',       pf:['ios','android'],       es:'client', vol:1180, seen:'27/07 · 14:48', srcId:'src-ekyc', metrics:['m-liveness'], desc:'Kết quả mỗi lần liveness', instAt:null, values:['success','fail'] },
    /* `sg6 ekyc_face_device_context` (gap, vol 0 — "model máy, mức sáng môi trường") ĐÃ BỎ, owner chốt
       05/08: màn giờ cắt mọi điểm đo theo năm chiều, TRONG ĐÓ CÓ Nền tảng, nên một điểm đo riêng chỉ để
       nói "máy nào" là hỏi lại câu chiều đã trả lời. Phần "mức sáng môi trường" KHÔNG mất — nó vốn là
       một LÝ DO trượt liveness, nên đi vào `sg11` ngay dưới đây dưới tên `poor_lighting`.
       `sg11` là cặp `fail_reason` của `sg5`, đúng khuôn sg3+sg4 đã có ở bước chụp giấy tờ: sg5 trả lời
       "bao nhiêu phần trăm qua", sg11 trả lời "trượt thì vì sao" — owner cần CẢ HAI.
       vol 197 = ĐÚNG số fail của sg5 (mỗi lần trượt có đúng một lý do), không phải 2.650 của s3: sg5
       chỉ bắn 1.180 lần nên lý do không thể nhiều hơn thế — cho vol 2.650 là để hai signal cạnh nhau
       tự nói ngược nhau.
       NĂM LÝ DO LÀ ĐỀ XUẤT CỦA MÌNH, không đọc được từ sơ đồ: Account Journey chỉ vẽ liveness là MỘT
       cổng (`face["Xác thực khuôn mặt (liveness)"]`), không liệt kê lý do trượt. Cùng loại quyết định
       với `sg4` (blur/glare/crop/expired) vốn cũng là đề xuất. */
    { id:'sg11',tpId:'tp3', name:'ekyc_face_liveness_fail_reason', st:'validating', pf:['ios','android'], es:'client', vol:197, seen:'27/07 · 14:48', srcId:'src-ekyc', metrics:['m-liveness'], desc:'Lý do trượt liveness từng lần', instAt:null, values:['face_not_matched','poor_lighting','liveness_timeout','spoof_suspected','multiple_faces'] },
    { id:'sg7', tpId:'tp4', name:'account_info_edited',         st:'live',       pf:['ios','android'],       es:'client', vol:520,  seen:'27/07 · 14:31', srcId:'src-ekyc', metrics:['m-ocr'], desc:'Khách sửa thông tin OCR đọc sai', instAt:null, values:['name','dob','id_number','address','bank'] },
    { id:'sg8', tpId:'tp5', name:'contract_sign_result',        st:'live',       pf:['ios','android'],       es:'client', vol:430,  seen:'27/07 · 14:40', srcId:null, metrics:['m-contract'], desc:'Kết quả ký hợp đồng điện tử', instAt:null, values:['success','fail'] },
    { id:'sg9', tpId:'tp5', name:'contract_session_abandoned',  st:'designed',   pf:['ios','android'],       es:'client', vol:0,    seen:null, srcId:null, metrics:['m-contract'], desc:'Phiên ký hết hạn giữa chừng', instAt:null, values:[] },
    { id:'sg10',tpId:'tp6', name:'account_activated',           st:'live',       pf:['server'],              es:'server', vol:395,  seen:'27/07 · 14:45', srcId:'src-ga', metrics:['m-completion'], desc:'Tài khoản sẵn sàng giao dịch', instAt:null, values:['activated'] },

    /* ---- ĐỀ XUẤT ĐO của pilot mở rộng 05/08/2026 ----
       Owner chốt: "đã xác định được các điểm chạm r thì MÌNH SẼ LÀ NGƯỜI ĐỀ XUẤT đo những gì". Nên
       khác hẳn 10 signal trên (đọc từ event registry đã có): 20 signal dưới đây là ĐỀ XUẤT CỦA MÌNH
       gửi đội dữ liệu, KHÔNG phải điểm đo đang chạy. `vol` và `seen` là số demo để màn có gì vẽ —
       chúng KHÔNG phải số đo thật, và đây chính là chỗ dễ tái diễn lỗ hổng A nếu người sau đọc nhầm
       thành "đã đo được". Mỗi giá trị trong `values` đều truy được về một câu trong `note` của flow
       (sơ đồ nguồn AJ 11 · MJ 2 · MJ 5 · MJ 7); không có giá trị nào bịa thêm ngoài tài liệu.

       `metrics: []` CỐ Ý rỗng cho cả 20 signal: điểm đo có TRƯỚC, chỉ số thì chưa — 6 chỉ số hiện có
       đều thuộc hành trình mở tài khoản (m-completion tính "activated ÷ started application"), gán
       bừa một chỉ số mở TK cho luồng nạp tiền sẽ là con số sai chứ không phải con số thiếu. Gắn điểm
       đo vào chỉ số nào là quyết định tiếp theo của owner.

       `es:'server'` cho TẤT CẢ signal của nạp · tra soát · rút · chuyển nội bộ — đây là RÀNG BUỘC
       của hệ thống (validate.ts check 7: signal thuộc nhóm g-in/g-out bắt buộc `es:'server'`), không
       phải lựa chọn. HỆ QUẢ phải nói thẳng: vòng này KHÔNG đề xuất được điểm đo phía client trên màn
       tiền (ví dụ "khách mở màn rút rồi thoát mà chưa bấm gì"). Muốn đo loại đó thì phải nới check 7
       — việc của owner, không tự nới. Riêng mở TK phái sinh thuộc g-deriv nên không bị ràng buộc này.

       `pf` = nền tảng NƠI YÊU CẦU XUẤT PHÁT, vẫn đo ở phía server. Server biết request đến từ đâu nên
       khai được ios/android/web; chỉ những sự kiện KHÔNG có phía khách (tiền ngân hàng chuyển tới,
       VSDC trả kết quả, hạch toán nội bộ) mới khai `['server']`. `sg-nap-1` khai cả 4 vì nạp tại quầy
       thật sự không có nền tảng khách nào. */
    { id:'sg-dvo-1', tpId:'tp-dvo-1', name:'deriv_open_ineligible_reason',  st:'live',       pf:['ios','android','web'], es:'server', vol:190,  seen:'04/08 · 16:20', srcId:null, metrics:[], desc:'Lý do không mở được TK phái sinh', instAt:null, values:['no_base_account','cccd_not_verified'] },
    { id:'sg-dvo-2', tpId:'tp-dvo-3', name:'deriv_contract_otp_fail_reason', st:'live',      pf:['ios','android','web'], es:'server', vol:238,  seen:'04/08 · 16:18', srcId:null, metrics:[], desc:'Lý do ký hợp đồng OTP thất bại, bắn mỗi lần thử', instAt:null, values:['otp_expired','otp_not_received'] },
    { id:'sg-dvo-3', tpId:'tp-dvo-4', name:'deriv_vsdc_approval_result',    st:'live',       pf:['server'],              es:'server', vol:942,  seen:'04/08 · 09:40', srcId:null, metrics:[], desc:'Kết quả VSDC duyệt hồ sơ phái sinh', instAt:null, values:['approved','rejected'] },
    { id:'sg-dvo-4', tpId:'tp-dvo-4', name:'deriv_vsdc_wait_duration',      st:'designed',   pf:['server'],              es:'server', vol:0,    seen:null, srcId:null,            metrics:[], desc:'Dải thời gian chờ VSDC duyệt', instAt:null, values:[] },

    { id:'sg-nap-1', tpId:'tp-nap-1', name:'deposit_credit_received',   st:'live',       pf:['ios','android','web','server'], es:'server', vol:9640, seen:'04/08 · 17:02', srcId:null, metrics:[], desc:'Tiền về TK chuyên dụng, theo kênh nạp', instAt:null, values:['qr','bank_gateway','auto_debit_link','counter'] },
    { id:'sg-nap-2', tpId:'tp-nap-2', name:'deposit_reconcile_fail_reason', st:'live',     pf:['server'],                       es:'server', vol:130,  seen:'04/08 · 17:02', srcId:null, metrics:[], desc:'Lý do không ghép được khoản tiền với chủ tài khoản', instAt:null, values:['holder_not_found','amount_mismatch'] },
    { id:'sg-nap-3', tpId:'tp-nap-3', name:'deposit_credit_timing',      st:'validating', pf:['server'],                       es:'server', vol:9510, seen:'04/08 · 16:55', srcId:null, metrics:[], desc:'Ghi có ngay hay dồn xử lý cuối ngày (khoản nộp 17h–20h)', instAt:null, values:['immediate','end_of_day'] },
    { id:'sg-nap-4', tpId:'tp-nap-1', name:'deposit_amount_band',        st:'gap',        pf:['server'],                       es:'server', vol:0,    seen:null, srcId:null,            metrics:[], desc:'Dải số tiền mỗi lần nạp theo kênh', instAt:null, values:[] },

    { id:'sg-tra-1', tpId:'tp-tra-1', name:'trace_request_created',   st:'live',     pf:['ios','android','web'], es:'server', vol:148, seen:'04/08 · 15:30', srcId:null, metrics:[], desc:'Khách gửi yêu cầu tra soát nạp tiền', instAt:null, values:['created'] },
    { id:'sg-tra-2', tpId:'tp-tra-1', name:'trace_attachment_count',  st:'live',     pf:['ios','android','web'], es:'server', vol:148, seen:'04/08 · 15:30', srcId:null, metrics:[], desc:'Số file chứng từ khách đính kèm — tối đa 5 theo quy định', instAt:null, values:['0','1','2','3','4','5'] },
    { id:'sg-tra-3', tpId:'tp-tra-3', name:'trace_state_entered',     st:'live',     pf:['server'],              es:'server', vol:420, seen:'04/08 · 16:10', srcId:null, metrics:[], desc:'Yêu cầu tra soát vào từng trạng thái, bắn lặp', instAt:null, values:['cho_tiep_nhan','dang_xu_ly_tttt','cho_ben_thu_ba','hoan_tat','tu_choi'] },
    { id:'sg-tra-4', tpId:'tp-tra-4', name:'trace_sla_breach',        st:'designed', pf:['server'],              es:'server', vol:0,   seen:null, srcId:null,            metrics:[], desc:'Vượt SLA 1 ngày làm việc', instAt:null, values:[] },

    { id:'sg-rut-1', tpId:'tp-rut-1', name:'withdraw_request_submitted',    st:'live',       pf:['ios','android','web'], es:'server', vol:3180, seen:'04/08 · 15:58', srcId:null, metrics:[], desc:'Khách gửi lệnh rút tiền về ngân hàng', instAt:null, values:['submitted'] },
    { id:'sg-rut-2', tpId:'tp-rut-2', name:'withdraw_gate_block_reason',    st:'live',       pf:['ios','android','web'], es:'server', vol:816,  seen:'04/08 · 15:58', srcId:null, metrics:[], desc:'Cổng nào chặn lệnh rút, theo chuỗi cổng kiểm tra', instAt:null, values:['insufficient_withdrawable','rtt_below_100','cccd_not_verified','signature_missing','otp_failed','over_limit_after_16h','month_end_blackout'] },
    { id:'sg-rut-3', tpId:'tp-rut-3', name:'withdraw_vneid_fail_reason',    st:'validating', pf:['ios','android'],       es:'server', vol:236,  seen:'04/08 · 15:44', srcId:null, metrics:[], desc:'Lý do trượt xác thực CCCD qua VNeID', instAt:null, values:['timeout','mismatch','app_not_installed'] },
    { id:'sg-rut-4', tpId:'tp-rut-7', name:'withdraw_payout_result',        st:'live',       pf:['server'],              es:'server', vol:2364, seen:'04/08 · 16:02', srcId:null, metrics:[], desc:'Kết quả đẩy lệnh sang ngân hàng thụ hưởng', instAt:null, values:['success','bank_reject'] },
    { id:'sg-rut-5', tpId:'tp-rut-4', name:'withdraw_video_sign_result',    st:'gap',        pf:['ios','android'],       es:'server', vol:0,    seen:null, srcId:null,            metrics:[], desc:'Kết quả chữ ký video call cho TK phái sinh — CHƯA instrument', instAt:null, values:[] },

    { id:'sg-ctn-1', tpId:'tp-ctn-1', name:'internal_transfer_submitted',     st:'live', pf:['ios','android','web'], es:'server', vol:2140, seen:'04/08 · 16:35', srcId:null, metrics:[], desc:'Khách gửi lệnh chuyển tiền giữa hai tiểu khoản của mình', instAt:null, values:['submitted'] },
    { id:'sg-ctn-2', tpId:'tp-ctn-2', name:'internal_transfer_reject_reason',st:'live', pf:['ios','android','web'], es:'server', vol:219,  seen:'04/08 · 16:33', srcId:null, metrics:[], desc:'Lý do lệnh chuyển bị từ chối', instAt:null, values:['wrong_subaccount_pair','insufficient_available','otp_failed'] },
    { id:'sg-ctn-3', tpId:'tp-ctn-4', name:'internal_transfer_posted',       st:'live', pf:['server'],              es:'server', vol:1918, seen:'04/08 · 16:36', srcId:null, metrics:[], desc:'Hạch toán xong cả hai tiểu khoản', instAt:null, values:['posted'] },
  ],
  metrics: [
{ id:'m-completion', name:'Hoàn tất mở tài khoản', value:'64,3%', target:'≥ 72%', unit:'%',
      grain:'Unique applicant / journey instance', formula:'Activated accounts ÷ started applications',
      source:'Digital analytics + Core Account', freshness:'Snapshot · trễ 4 giờ', owner:'Onboarding Analytics' },
    { id:'m-liveness', name:'Liveness completion', value:'83,3%', target:'≥ 90%', unit:'%',
      grain:'Unique applicant / liveness attempt group', formula:'Completed liveness ÷ entered liveness',
      source:'eKYC SDK', freshness:'Snapshot · trễ 6 giờ', owner:'Onboarding Squad' },
    { id:'m-contract', name:'Ký hợp đồng thành công', value:'94,0%', target:'≥ 97%', unit:'%',
      grain:'Unique applicant / contract session', formula:'Signed contracts ÷ contract sessions',
      source:'SmartCA + Account service', freshness:'Snapshot · trễ 4 giờ', owner:'Onboarding Squad' },
    { id:'m-ocr', name:'Evidence coverage bước OCR', value:'71,0%', target:'≥ 90%', unit:'%',
      grain:'Failed ID capture event', formula:'Failure events có reason code hợp lệ ÷ total failure events',
      source:'Mobile SDK event registry', freshness:'Snapshot · trễ 4 giờ', owner:'Data Platform' },
    { id:'m-ces', name:'CES sau mở tài khoản', value:'3,8 / 5', target:'≥ 4,2', unit:'điểm',
      grain:'Response / khách hoàn tất MTK', formula:'Điểm trung bình câu hỏi mức độ dễ dàng',
      source:'In-app survey', freshness:'Snapshot · trễ 12 giờ', owner:'CX Insight' },
    { id:'m-repeat', name:'Repeat contact trong 7 ngày', value:'24,0%', target:'≤ 15%', unit:'%',
      grain:'Unique khách có số lần liên hệ cùng chủ đề đạt ngưỡng repeat', formula:'Khách liên hệ lại ÷ khách có liên hệ',
      source:'CS case system', freshness:'Snapshot · trễ 2 giờ', owner:'CS Center' },
  ],
  sources: [
{ id:'src-ga',    name:'Digital analytics (app + web)', kind:'event',        vol:41200, lagH:4,   last:'27/07 · 14:52', metrics:['m-completion'], pf:['ios','android','web'], voice:false, note:'Nguồn funnel chính' },
    { id:'src-ekyc',  name:'eKYC SDK',                      kind:'event',        vol:12800, lagH:6,   last:'27/07 · 14:48', metrics:['m-liveness','m-ocr'], pf:['ios','android'], voice:false, note:'SDK 4.8.2' },
    { id:'src-case',  name:'CS case (hotline + chat)',      kind:'case',         vol:1840,  lagH:2,   last:'27/07 · 14:39', metrics:['m-repeat'], pf:['server'], voice:true, note:'Ticket đã gán chủ đề' },
    { id:'src-survey',name:'In-app survey (CES/CSAT/NPS)',  kind:'survey',       vol:612,   lagH:12,  last:'26/07 · 23:10', metrics:['m-ces'], pf:['ios','android','web'], voice:true, note:'Job tổng hợp chậm hơn thoả thuận' },
    { id:'src-store', name:'App Store + Google Play review',kind:'store-review', vol:186,   lagH:24,  last:'27/07 · 08:00', metrics:[], pf:['ios','android'], voice:true, note:'Crawl 1 lần/ngày' },
    { id:'src-broker',name:'Ghi chú broker / RM',           kind:'broker-note',  vol:94,    lagH:24,  last:'27/07 · 09:15', metrics:[], pf:[], voice:true, note:'Nhập tay trong CRM' },
    { id:'src-zalo',  name:'Zalo OA inbox',                 kind:'chat',         vol:0,     lagH:192, last:'19/07 · 11:02', metrics:['m-repeat'], pf:[], voice:true, /* 25/08: cắt vế "repeat contact đang bị đếm thiếu" — phán chiều lệch, dữ liệu không chứng minh
       được (bẫy 3, domain/sources.ts); chỉ số bị ảnh hưởng đã đứng ở cột riêng của bảng. */
      note:'Webhook lỗi từ 19/07' },
  ],
  surveys: [
{ id:'sv-ces-mtk', name:'CES sau mở tài khoản', type:'CES', trigger:'account_open_completed',
      cond:'Hiện trong app ngay sau màn chúc mừng · 1 lần/khách', cd:14, scale:'1–5 (rất khó → rất dễ) + ô góp ý',
      target:'≥ 4,2', latest:'3,8', rr:31, n:612, status:'running', state:'watch' },
    { id:'sv-csat-dep', name:'CSAT nạp tiền lần đầu', type:'CSAT', trigger:'deposit_credited (is_first_deposit = true)',
      cond:'Hiện sau khi khách quay lại app thấy tiền đã lên · 1 lần/khách', cd:14, scale:'1–5 sao + ô góp ý',
      target:'≥ 4,3', latest:'4,4', rr:27, n:388, status:'running', state:'ok' },
    { id:'sv-csat-cs', name:'CSAT sau phiên hỗ trợ', type:'CSAT', trigger:'cs_session_closed',
      cond:'Gửi trong app hoặc ZNS trong 1 giờ sau khi đóng ticket', cd:14, scale:'Đã/chưa giải quyết + 1–5 sao',
      target:'≥ 4,0', latest:'3,6', rr:22, n:264, status:'running', state:'watch' },
    { id:'sv-abandon', name:'Khảo sát bỏ dở eKYC', type:'micro', trigger:'account_open_abandoned',
      cond:'Chỉ hỏi khi khách mở lại app trong 7 ngày · 1 lần', cd:14, scale:'Chọn 1: chụp giấy tờ khó / cần chuẩn bị giấy tờ / đổi ý / khác',
      target:'Thu ≥ 200 mẫu/tháng', latest:'156 mẫu', rr:18, n:156, status:'running', state:'watch' },
    { id:'sv-review', name:'In-app review prompt', type:'micro', trigger:'deposit_credited hoặc order_matched',
      cond:'Chỉ khi latency nạp < 2 phút, session không có error, khách active ≥ 14 ngày', cd:90, scale:'Prompt hệ điều hành chuẩn',
      target:'≥ 4,5 store rating', latest:'4,3', rr:9, n:186, status:'running', state:'watch' },
    { id:'sv-nps', name:'NPS quan hệ định kỳ', type:'NPS', trigger:'Chiến dịch quý — không gắn event',
      cond:'Mẫu ngẫu nhiên ~10% khách active · loại khách vừa nhận khảo sát khác trong 30 ngày', cd:90, scale:'0–10 + câu hỏi lý do',
      target:'≥ 40', latest:'34', rr:14, n:1240, status:'paused', state:'unknown' },
  ],
  tax: [
    { id: 'x-l1-reach', lv: 'L1', parentId: '', maps: 'p1', name: 'Tìm hiểu & Tiếp cận', n: 240, why: 'Domain gốc, khớp phase 01', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l1-mtk', lv: 'L1', parentId: '', maps: 'p2', name: 'Mở tài khoản', n: 1840, why: 'Domain gốc, khớp phase 02 của journey', up: '20/07/2026', by: 'CX Insight' },
    { id: 'x-l1-cash', lv: 'L1', parentId: '', maps: 'p3', name: 'Dòng tiền', n: 1120, why: 'Domain gốc, khớp phase 03', up: '20/07/2026', by: 'CX Insight' },
    { id: 'x-l1-trade', lv: 'L1', parentId: '', maps: 'p4', name: 'Giao dịch', n: 1900, why: 'Domain gốc, khớp phase 04. Gộp 3 L1 cũ: Giao dịch 960 + Margin & Sức mua 410 + Sản phẩm đầu tư 530', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l1-acct', lv: 'L1', parentId: '', maps: 'p5', name: 'Quản lý tài khoản', n: 560, why: 'Domain gốc, khớp phase 05 — nhóm servicing trước đây không có node L1', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l1-care', lv: 'L1', parentId: '', maps: 'p6', name: 'Chăm sóc, khiếu nại & Churn', n: 900, why: 'Domain gốc, khớp phase 06. Gộp 2 L1 cũ: Chăm sóc & khiếu nại 720 + Rời bỏ & phục hồi 180', up: '28/07/2026', by: 'CX Insight' },

    { id: 'x-l2-reach', lv: 'L2', parentId: 'x-l1-reach', maps: 'g-reach', name: 'Kênh tiếp cận & referral', n: 240, why: 'Marketing, landing, giới thiệu bạn bè', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-ekyc', lv: 'L2', parentId: 'x-l1-mtk', maps: 'f-open-2026', name: 'eKYC', n: 1240, why: 'Nhóm các bước xác thực danh tính BÊN TRONG flow MTK — không phải một nhóm sản phẩm', up: '21/07/2026', by: 'CX Insight' },
    { id: 'x-l2-sign', lv: 'L2', parentId: 'x-l1-mtk', maps: 'f-open-2026', name: 'Ký hợp đồng điện tử', n: 340, why: 'Bước ký và chọn số tài khoản, bên trong flow MTK', up: '21/07/2026', by: 'CX Insight' },
    { id: 'x-l2-actv', lv: 'L2', parentId: 'x-l1-mtk', maps: 'g-activate', name: 'Kích hoạt & định hướng', n: 260, why: 'Sau khi tài khoản sẵn sàng', up: '21/07/2026', by: 'CX Insight' },
    { id: 'x-l2-dep', lv: 'L2', parentId: 'x-l1-cash', maps: 'g-in', name: 'Nộp tiền', n: 680, why: 'QR, cổng NH, liên kết, quầy — và tra soát', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l2-wd', lv: 'L2', parentId: 'x-l1-cash', maps: 'g-out', name: 'Rút & chuyển tiền', n: 440, why: 'Rút về ngân hàng, chuyển nội bộ', up: '21/07/2026', by: 'CX Insight' },
    { id: 'x-l2-order', lv: 'L2', parentId: 'x-l1-trade', maps: null, name: 'Đặt lệnh', n: 610, why: 'Đặt, sửa, hủy, từ chối — XUYÊN sản phẩm nên cố ý không maps vào nhóm nào', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l2-eq', lv: 'L2', parentId: 'x-l1-trade', maps: 'g-eq', name: 'Cổ phiếu & ETF', n: 240, why: 'Mua bán CK niêm yết, T+2', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-cw', lv: 'L2', parentId: 'x-l1-trade', maps: 'g-cw', name: 'Chứng quyền CW', n: 60, why: 'Chỉ CW mua, không được ký quỹ', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-bond', lv: 'L2', parentId: 'x-l1-trade', maps: 'g-bond', name: 'Trái phiếu DBOND/VBOND', n: 410, why: 'Trái phiếu doanh nghiệp, chỉ mua bằng tiền mặt', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l2-fund', lv: 'L2', parentId: 'x-l1-trade', maps: 'g-fund', name: 'Chứng chỉ quỹ mở', n: 120, why: 'Mua bán theo phiên NAV', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-deriv', lv: 'L2', parentId: 'x-l1-trade', maps: 'g-deriv', name: 'Phái sinh VN30F', n: 50, why: 'Ký quỹ riêng tại VSDC, T+0', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-mgn', lv: 'L2', parentId: 'x-l1-trade', maps: 'g-mgn', name: 'Margin (GDKQ)', n: 410, why: 'Đăng ký gói, call margin', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l2-port', lv: 'L2', parentId: 'x-l1-acct', maps: 'g-report', name: 'Danh mục & lãi lỗ', n: 350, why: 'Xem tài sản, sao kê — chuyển từ L1 Giao dịch sang Quản lý tài khoản cùng flow f-report', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l2-idv', lv: 'L2', parentId: 'x-l1-acct', maps: 'g-idv', name: 'Định danh & CCCD chip', n: 90, why: 'Cập nhật giấy tờ, là cổng chặn của rút tiền', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-info', lv: 'L2', parentId: 'x-l1-acct', maps: 'g-info', name: 'Thông tin & thụ hưởng', n: 70, why: 'Thông tin cá nhân, tài khoản nhận tiền', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-sec', lv: 'L2', parentId: 'x-l1-acct', maps: 'g-sec', name: 'Bảo mật & thiết bị', n: 50, why: 'Mật khẩu, PIN, Smart OTP, thiết bị tin cậy', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-l2-hotl', lv: 'L2', parentId: 'x-l1-care', maps: 'g-care', name: 'Hotline & chat', n: 520, why: 'Kênh hỗ trợ trực tiếp', up: '21/07/2026', by: 'CX Insight' },
    { id: 'x-l2-claim', lv: 'L2', parentId: 'x-l1-care', maps: 'g-care', name: 'Khiếu nại & tra soát', n: 200, why: 'Case cần xử lý theo SLA. Cùng maps với Hotline — hai L2 có thể trỏ chung một nhóm', up: '21/07/2026', by: 'CX Insight' },
    { id: 'x-l2-churn', lv: 'L2', parentId: 'x-l1-care', maps: 'g-churn', name: 'Rời bỏ & phục hồi', n: 180, why: 'Ngừng giao dịch, win-back — L1 cũ hạ xuống L2', up: '28/07/2026', by: 'CX Insight' },

    { id: 'x-l3-live', lv: 'L3', parentId: 'x-l2-ekyc', maps: 's3', name: 'Liveness & Face match', n: 640, why: 'Khớp bước 03 của flow MTK, stationId JS-MTK-03', up: '24/07/2026', by: 'Linh Trần' },
    { id: 'x-l3-ocr', lv: 'L3', parentId: 'x-l2-ekyc', maps: 's2', name: 'Chụp & đọc CCCD', n: 470, why: 'Khớp bước 02, stationId JS-MTK-02', up: '22/07/2026', by: 'CX Insight' },
    { id: 'x-l3-vneid', lv: 'L3', parentId: 'x-l2-ekyc', maps: 's2', name: 'Đối chiếu VNeID / NFC', n: 130, why: 'Nhánh xác thực thay thế OCR, nằm trong bước 02 — không phải step riêng trong DATA.steps', up: '22/07/2026', by: 'CX Insight', drift: 'new-term', driftNote: 'Xuất hiện 34 verbatim dùng từ "app định danh quốc gia" chưa gán vào node này' },
    { id: 'x-l3-smca', lv: 'L3', parentId: 'x-l2-sign', maps: 's5', name: 'Phiên ký SmartCA', n: 280, why: 'Khớp bước 05, stationId JS-MTK-05', up: '22/07/2026', by: 'CX Insight' },
    { id: 'x-l3-va', lv: 'L3', parentId: 'x-l2-dep', maps: 'f-dep-4ch', name: 'Nộp qua QR / cổng ngân hàng', n: 390, why: 'Phương thức nạp phổ biến nhất. ĐỔI TÊN từ "Nộp qua số VA" — nguồn MJ 2 không có khái niệm VA', up: '28/07/2026', by: 'CX Insight' },
    { id: 'x-l3-reject', lv: 'L3', parentId: 'x-l2-order', maps: 'f-eq-sell', name: 'Lệnh bị từ chối', n: 240, why: 'Nhóm reason code từ core. Flow f-reject cũ đã xóa vì provenance bịa, nhưng chuyện khách nói tới thì vẫn có thật nên node được giữ', up: '28/07/2026', by: 'CX Insight' },

    /* Theme mang `cat` = intent chủ đạo (4 Category Enterpret) — thứ chia bốn khối
       "Khách đang nói gì?" ở Tổng quan VoC. `pts` = 12 kỳ gần nhất (D8a, owner chốt 02/08:
       mở rộng seed 6→12 điểm để mốc "1 năm" không còn là no-op của "6 tháng"), dùng cho
       sparkline và phát hiện Z-score. 6 điểm CUỐI của mỗi mảng là 6 điểm gốc, giữ nguyên
       y hệt bản trước — 6 điểm ĐẦU là lịch sử mới prepend (xem cuối file seed.ts cách sinh).
       `demo: true` = seed tổng hợp CÓ NHÃN, không phải phép đo thật. */
    { id: 'x-th-device', lv: 'theme', parentId: '', name: 'Thiết bị / môi trường không tương thích', n: 412, cat: 'complaint', pts: [190, 205, 220, 235, 250, 265, 280, 295, 310, 340, 402, 412], why: 'Khách thất bại vì phần cứng hoặc điều kiện chụp, không phải vì không hiểu cách làm', up: '25/07/2026', by: 'Linh Trần' },
    { id: 'x-th-guide', lv: 'theme', parentId: '', name: 'Hướng dẫn không rõ hoặc thiếu', n: 368, cat: 'help', pts: [438, 432, 426, 420, 414, 408, 402, 396, 388, 381, 374, 368], why: 'Khách không biết phải làm gì tiếp, hoặc thông báo lỗi chung chung', up: '24/07/2026', by: 'CX Insight' },
    { id: 'x-th-status', lv: 'theme', parentId: '', name: 'Không rõ trạng thái giao dịch', n: 295, cat: 'complaint', pts: [168, 180, 192, 204, 216, 228, 240, 252, 265, 274, 286, 295], why: 'Khách không biết việc đã xong chưa, tiền đã đến chưa, hợp đồng đã ký chưa', up: '24/07/2026', by: 'CX Insight', drift: 'duplicate', driftNote: 'Trùng nghĩa một phần với "Chờ quá lâu không phản hồi" — cần người quyết định gộp hay tách' },
    { id: 'x-th-wait', lv: 'theme', parentId: '', name: 'Chờ quá lâu không phản hồi', n: 210, cat: 'complaint', pts: [164, 168, 172, 176, 180, 184, 188, 192, 205, 198, 214, 210], why: 'Thời gian xử lý vượt kỳ vọng, không có ETA', up: '23/07/2026', by: 'CX Insight' },
    { id: 'x-th-info', lv: 'theme', parentId: '', name: 'Thiếu thông tin để ra quyết định', n: 186, cat: 'help', pts: [102, 110, 118, 126, 134, 142, 150, 158, 166, 172, 180, 186], why: 'Khách cần hiểu rủi ro, phí, thanh khoản trước khi hành động', up: '23/07/2026', by: 'CX Insight' },
    { id: 'x-th-praise', lv: 'theme', parentId: '', name: 'Trải nghiệm nhanh và mượt', n: 164, cat: 'praise', pts: [14, 28, 42, 56, 70, 84, 98, 112, 126, 140, 153, 164], why: 'Nhóm phản hồi tích cực, dùng để biết cái gì đang hoạt động tốt', up: '23/07/2026', by: 'CX Insight' },
    { id: 'x-th-fee', lv: 'theme', parentId: '', name: 'Phí và thuế trừ không như kỳ vọng', n: 118, cat: 'complaint', pts: [0, 2, 14, 26, 38, 50, 62, 74, 86, 95, 108, 118], why: 'Khách bất ngờ vì số tiền thực nhận thấp hơn tính toán — tập trung ở bán CK và trả lại trái phiếu sớm', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-th-slow', lv: 'theme', parentId: '', name: 'Tiền về chậm hơn thông báo', n: 96, cat: 'complaint', pts: [134, 130, 126, 122, 118, 114, 110, 106, 102, 99, 97, 96], why: 'Khoảng cách giữa thời gian cam kết và thời gian tiền thực sự tới tài khoản', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-th-start', lv: 'theme', parentId: '', name: 'Không biết bắt đầu từ đâu sau khi mở TK', n: 92, cat: 'help', pts: [46, 50, 54, 58, 62, 66, 70, 74, 80, 84, 88, 92], why: 'Khách đã có tài khoản nhưng chưa biết bước tiếp theo là nạp tiền hay đặt lệnh', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-th-branch', lv: 'theme', parentId: '', name: 'Đề nghị mở kênh hỗ trợ tại quầy', n: 96, cat: 'improvement', pts: [0, 0, 8, 18, 28, 38, 48, 58, 66, 78, 88, 96], why: 'Chủ yếu từ segment 50+ gặp khó ở bước quay mặt', up: '28/07/2026', by: 'Linh Trần', demo: true },
    { id: 'x-th-notify', lv: 'theme', parentId: '', name: 'Đề nghị xác nhận qua SMS / ZNS', n: 74, cat: 'improvement', pts: [0, 0, 8, 16, 24, 32, 40, 48, 55, 62, 68, 74], why: 'Khách muốn nhận xác nhận ngoài app để khỏi phải mở app kiểm tra', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-th-nfc', lv: 'theme', parentId: '', name: 'Đề nghị đặt NFC làm mặc định', n: 58, cat: 'improvement', pts: [0, 0, 0, 0, 2, 10, 18, 26, 34, 42, 50, 58], why: 'Nhánh NFC được đánh giá tốt hơn nhánh chụp OCR', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-th-cs', lv: 'theme', parentId: '', name: 'Hỗ trợ phản hồi nhanh', n: 88, cat: 'praise', pts: [24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 88], why: 'Khen ngợi tổng đài và chat, dùng để biết cái gì đang hoạt động tốt', up: '28/07/2026', by: 'CX Insight', demo: true },
    { id: 'x-th-fast', lv: 'theme', parentId: '', name: 'Nạp tiền vào tài khoản ngay', n: 62, cat: 'praise', pts: [2, 8, 14, 20, 26, 32, 38, 44, 49, 54, 58, 62], why: 'Kênh QR ghi có ngay được đánh giá cao', up: '28/07/2026', by: 'CX Insight', demo: true },

    { id: 'x-sub-android', lv: 'subtheme', parentId: 'x-th-device', name: 'Android tầm trung, ánh sáng yếu', n: 238, why: 'Cụm thiết bị RAM ≤ 4GB gặp lỗi liveness nhiều nhất', up: '25/07/2026', by: 'Linh Trần' },
    { id: 'x-sub-glare', lv: 'subtheme', parentId: 'x-th-device', name: 'Giấy tờ bị chói hoặc mờ', n: 174, why: 'Điều kiện chụp làm OCR đọc sai', up: '24/07/2026', by: 'CX Insight' },
    { id: 'x-sub-errcode', lv: 'subtheme', parentId: 'x-th-guide', name: 'Thông báo lỗi chỉ có mã, không có cách sửa', n: 196, why: 'Reason code chưa được dịch thành hướng dẫn hành động', up: '24/07/2026', by: 'CX Insight' },
    { id: 'x-sub-timeout', lv: 'subtheme', parentId: 'x-th-status', name: 'Phiên hết hạn giữa lúc thao tác', n: 142, why: 'Session timeout trước khi khách nhận xác nhận', up: '24/07/2026', by: 'CX Insight', drift: 'shifting', driftNote: 'Ngữ nghĩa đang lệch: 28% record mới thực ra nói về mất mạng, không phải hết phiên' },
  ],

  /* Category theo intent, trực giao với taxonomy (prototype dòng 829-834). Màu lấy từ thang
     PHÂN LOẠI `--cat-*` (index.css), KHÔNG vay `--crit/--watch/--good` — đây là bốn NHÃN PHÂN
     LOẠI (intent), không phải trạng thái sức khỏe. Trước đây "Khiếu nại" tô đỏ (--crit) khiến
     mọi chart intent trông như báo động, và làm đỏ mất nghĩa "cần xử lý ngay" ở nơi đỏ thật sự
     có nghĩa đó (D5a, card-chart-design-decisions.html, owner chốt 02/08). Gradient
     hồng đất(cat-3) → indigo(cat-1) → tím(cat-2) → lục lam(cat-4) vẫn giữ trực giác âm→dương. */
  cats: {
    complaint: { label: 'Khiếu nại', color: 'var(--cat-3)' },
    help: { label: 'Cần hỗ trợ', color: 'var(--cat-1)' },
    improvement: { label: 'Đề xuất cải thiện', color: 'var(--cat-2)' },
    praise: { label: 'Khen ngợi', color: 'var(--cat-4)' },
  },
  ev: [
{ id:'EV-101', kind:'event', src:'src-ekyc', ref:'liveness_failed · SDK 4.8.2', at:'27/07 · 14:42', step:'s3', pf:'android', cat:'complaint', sen:-0.8, shift:-0.3,
      q:'Mã lỗi LIGHT_CONDITION sau 3 lần thử.', sig:'Android tầm trung · ánh sáng yếu', ck:'KH•••7A2',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device','x-sub-android'],
      why:'Gán theme "Thiết bị / môi trường" vì mã lỗi LIGHT_CONDITION là tín hiệu môi trường, không phải thao tác sai của khách. Subtheme Android tầm trung do device class trong payload.' },
    { id:'EV-102', kind:'case', src:'src-case', ref:'CASE•••1842', at:'27/07 · 14:31', step:'s3', pf:'android', cat:'complaint', sen:-0.9, shift:-0.4,
      q:'Tôi đã quay lại nhiều lần nhưng ứng dụng vẫn yêu cầu làm lại từ đầu.', sig:'Repeat contact · 2 lần trong 40 phút', ck:'KH•••1C9',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device','x-sub-android'],
      why:'Cụm "làm lại từ đầu" + repeat contact trong cùng phiên → theme thiết bị, không phải theme hướng dẫn.' },
    { id:'EV-103', kind:'verbatim', src:'src-store', ref:'PLAY•••522 · 2★', at:'27/07 · 12:18', step:'s3', pf:'android', cat:'complaint', sen:-0.7, shift:-0.2,
      q:'Nhận diện khuôn mặt không hoàn tất trên điện thoại Android, thử buổi tối là chịu.', sig:'Rating 2/5 · Android', ck:'Ẩn danh',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device','x-sub-android'],
      why:'"Thử buổi tối" là tín hiệu ánh sáng → subtheme Android tầm trung, ánh sáng yếu.' },
    { id:'EV-104', kind:'survey-response', src:'src-survey', ref:'CES•••0912 · 2/5', at:'27/07 · 10:04', step:'s3', pf:'android', cat:'complaint', sen:-0.6, shift:-0.1,
      q:'Khó nhất là bước quay mặt, phải nhờ người khác cầm máy hộ.', sig:'CES 2/5 · hoàn tất sau 4 lần thử', ck:'KH•••4B8',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device'],
      why:'Khách hoàn tất nhưng effort cao → vẫn là theme thiết bị, category Khiếu nại vì điểm CES thấp.' },
    { id:'EV-105', kind:'case', src:'src-case', ref:'CASE•••1901', at:'26/07 · 16:22', step:'s3', pf:'ios', cat:'help', sen:-0.3, shift:0,
      q:'Cho hỏi quay mặt cần bỏ kính không, app không nói rõ.', sig:'First contact · chưa fail lần nào', ck:'KH•••2E5',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-guide','x-sub-errcode'],
      why:'Đây là câu hỏi trước khi thao tác, chưa có lỗi → category Cần hỗ trợ, theme Hướng dẫn không rõ.' },
    { id:'EV-201', kind:'event', src:'src-ga', ref:'contract_session_abandoned', at:'27/07 · 13:06', step:'s5', pf:'ios', cat:'complaint', sen:-0.5, shift:-0.2,
      q:'Phiên SmartCA hết hạn trước khi CTA ký được xác nhận.', sig:'Session timeout · 4m32s', ck:'KH•••8B4',
      tax:['x-l1-mtk','x-l2-sign','x-l3-smca','x-th-status','x-sub-timeout'],
      why:'Event timeout + không có xác nhận trạng thái → theme Không rõ trạng thái, subtheme Phiên hết hạn.' },
    { id:'EV-202', kind:'case', src:'src-case', ref:'CASE•••1750', at:'27/07 · 11:49', step:'s5', pf:'ios', cat:'help', sen:-0.4, shift:-0.1,
      q:'Không rõ hồ sơ đã ký thành công hay cần thao tác lại.', sig:'First contact unresolved', ck:'KH•••3D1',
      tax:['x-l1-mtk','x-l2-sign','x-l3-smca','x-th-status'],
      why:'Khách hỏi trạng thái, không phàn nàn về lỗi → category Cần hỗ trợ.' },
    { id:'EV-203', kind:'verbatim', src:'src-broker', ref:'RM-NOTE•••114', at:'26/07 · 09:30', step:'s5', pf:'web', cat:'improvement', sen:-0.2, shift:0,
      q:'Khách đề nghị gửi SMS xác nhận sau khi ký, để khỏi phải mở app kiểm tra.', sig:'Ghi chú RM · khách high-value', ck:'KH•••9F1',
      tax:['x-l1-mtk','x-l2-sign','x-th-status'],
      why:'Là đề xuất giải pháp, không phải báo lỗi → category Đề xuất cải thiện.' },
    { id:'EV-301', kind:'event', src:'src-ekyc', ref:'id_capture_failed · GLARE', at:'27/07 · 14:10', step:'s2', pf:'ios', cat:'complaint', sen:-0.5, shift:0.2,
      q:'Ảnh giấy tờ bị chói, chưa có hướng dẫn thay đổi góc chụp.', sig:'iOS · fail 3 lần', ck:'KH•••5F6',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-ocr','x-th-device','x-sub-glare'],
      why:'GLARE là reason code môi trường → theme thiết bị. sentimentShift dương vì bản cập nhật reason code đã giảm mức bức xúc.' },
    { id:'EV-302', kind:'event', src:'src-ekyc', ref:'id_capture_failed · BLUR', at:'27/07 · 12:55', step:'s2', pf:'android', cat:'complaint', sen:-0.4, shift:0.2,
      q:'Ảnh mờ, hệ thống báo thử lại nhưng không nói mờ ở đâu.', sig:'Android · fail 2 lần', ck:'KH•••6A3',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-ocr','x-th-guide','x-sub-errcode'],
      why:'Có reason code nhưng thông báo không hướng dẫn được → theme Hướng dẫn không rõ.' },
    { id:'EV-303', kind:'survey-response', src:'src-survey', ref:'ABANDON•••221', at:'26/07 · 20:11', step:'s2', pf:'android', cat:'complaint', sen:-0.6, shift:0,
      q:'Chụp giấy tờ khó nên tôi để hôm khác làm, rồi quên luôn.', sig:'Khảo sát bỏ dở · chọn "chụp giấy tờ khó"', ck:'KH•••7C4',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-ocr','x-th-device','x-sub-glare'],
      why:'Trả lời khảo sát bỏ dở, lý do là độ khó thao tác chụp → theme thiết bị.' },
    { id:'EV-304', kind:'verbatim', src:'src-store', ref:'APPSTORE•••318 · 5★', at:'26/07 · 18:40', step:'s2', pf:'ios', cat:'praise', sen:0.9, shift:0.1,
      q:'Quét NFC trên căn cước mới nhanh thật, không phải chụp gì cả.', sig:'Rating 5/5 · iOS', ck:'Ẩn danh',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-vneid','x-th-praise'],
      why:'Phản hồi tích cực về nhánh NFC — dùng để biết cái gì đang hoạt động tốt.' },
    { id:'EV-305', kind:'case', src:'src-case', ref:'CASE•••1688', at:'25/07 · 15:12', step:'s2', pf:'android', cat:'help', sen:-0.2, shift:0,
      q:'Ứng dụng định danh quốc gia của tôi báo lỗi, có cách nào khác không?', sig:'First contact', ck:'KH•••1A7',
      tax:['x-l1-mtk','x-l2-ekyc','x-th-guide'],
      why:'CHƯA gán L3. Khách dùng cụm "ứng dụng định danh quốc gia" thay vì VNeID — đây là 1 trong 34 record tạo cảnh báo drift new-term.' },
    { id:'EV-401', kind:'event', src:'src-ga', ref:'account_open_step_viewed · step=nhap_sdt', at:'27/07 · 14:20', step:'s1', pf:'web', cat:'improvement', sen:-0.1, shift:0,
      q:'Rớt tại bước nhập SĐT sau 8 giây, không thao tác gì thêm.', sig:'Bounce · traffic từ banner', ck:'KH•••3B9',
      tax:['x-l1-mtk','x-l2-ekyc','x-th-guide'],
      why:'Hành vi rớt sớm, không có verbatim → suy luận theme Hướng dẫn, độ tin cậy thấp hơn evidence có lời khách.' },
    { id:'EV-402', kind:'survey-response', src:'src-survey', ref:'CES•••1004 · 5/5', at:'27/07 · 09:15', step:'s6', pf:'ios', cat:'praise', sen:0.8, shift:0.2,
      q:'Mở tài khoản buổi tối, sáng hôm sau đã đặt được lệnh. Rất gọn.', sig:'CES 5/5 · hoàn tất 1 lần', ck:'KH•••8D2',
      tax:['x-l1-mtk','x-l2-actv','x-th-praise'],
      why:'CES cao + verbatim tích cực về tốc độ → theme Trải nghiệm nhanh và mượt.' },
    { id:'EV-501', kind:'case', src:'src-case', ref:'CASE•••2010', at:'27/07 · 10:40', step:'s3', pf:'android', cat:'complaint', sen:-0.9, shift:-0.5,
      q:'Đây là lần thứ ba tôi gọi lên về cùng việc xác thực khuôn mặt.', sig:'Repeat contact · lần 3 · khách high-value', ck:'KH•••9F1',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device','x-sub-android'],
      why:'Repeat lần 3 từ khách high-value → là evidence cho cả issue liveness và cho agent Escalation.' },
    { id:'EV-601', kind:'verbatim', src:'src-broker', ref:'RM-NOTE•••120', at:'25/07 · 11:05', step:'s3', pf:'android', cat:'improvement', sen:-0.3, shift:0,
      q:'Khách lớn tuổi cần người hỗ trợ bước quay mặt, đề nghị có kênh làm tại quầy.', sig:'Ghi chú RM · segment 50+', ck:'KH•••2C8',
      tax:['x-l1-mtk','x-l2-ekyc','x-l3-live','x-th-device'],
      why:'Đề xuất kênh thay thế → category Đề xuất cải thiện, vẫn thuộc theme thiết bị vì nguyên nhân gốc là thao tác khó.' },
  ],
  ins: [
{ id:'VI-01', theme:'x-th-device', step:'s3', src:['src-ekyc','src-case','src-store','src-survey'],
      n:412, pos:19, trend:-7, pts:[42,40,36,31,26,19], seg:['Android tầm trung','Khách 50+'],
      ev:['EV-101','EV-102','EV-103','EV-104','EV-501'], owner:'Linh Trần · CX Insight',
      rec:'Đẩy thành CX issue: cụm Android RAM ≤ 4GB thất bại liveness gấp 2,6 lần iOS. Cần patch SDK và hướng dẫn theo điều kiện lỗi.',
      hoEl:true, hoWhy:'Có journey impact (bước 03), affected scope rõ (412 phản hồi, 2 segment) và owner xử lý (Onboarding Squad)', hoIssue:'CXI-021' },
    { id:'VI-02', theme:'x-th-status', step:'s5', src:['src-ga','src-case','src-broker'],
      n:295, pos:31, trend:-4, pts:[38,37,36,34,33,31], seg:['iOS','Khách high-value'],
      ev:['EV-201','EV-202','EV-203'], owner:'Linh Trần · CX Insight',
      rec:'Đẩy thành CX issue: khách không biết hợp đồng đã ký hay chưa khi phiên SmartCA hết hạn.',
      hoEl:true, hoWhy:'Có journey impact (bước 05), scope 295 phản hồi và owner (Onboarding Squad)', hoIssue:'CXI-017' },
    { id:'VI-03', theme:'x-th-guide', step:'s2', src:['src-ekyc','src-case'],
      n:368, pos:28, trend:2, pts:[24,25,26,27,28,28], seg:['Cả iOS và Android'],
      ev:['EV-302','EV-305','EV-401'], owner:'Hà Vũ · Data Platform',
      rec:'Đã có bản sửa reason code phát hành 16/07, trend đang cải thiện. Theo dõi thêm 2 tuần trước khi kết luận.',
      hoEl:true, hoWhy:'Đã có issue đang theo dõi outcome', hoIssue:'CXI-013' },
    { id:'VI-04', theme:'x-th-info', step:null, src:['src-broker','src-survey'],
      n:186, pos:44, trend:-3, pts:[52,50,48,47,45,44], seg:['Khách quan tâm iBond'],
      ev:[], owner:'Wealth Squad',
      rec:'Khách hỏi lại nhiều về thanh khoản iBond trước khi mua. Cần khảo sát thêm để xác định điểm cần bổ sung thông tin.',
      hoEl:false, hoWhy:'CHƯA đủ điều kiện: không xác định được bước cụ thể trong journey, và chưa có owner nhận xử lý. Chỉ tạo CX issue khi có journey impact, affected scope và owner rõ ràng.' },
    { id:'VI-05', theme:'x-th-praise', step:'s2', src:['src-store','src-survey'],
      n:164, pos:91, trend:6, pts:[78,81,84,86,89,91], seg:['iOS · căn cước có NFC'],
      ev:['EV-304','EV-402'], owner:'Linh Trần · CX Insight',
      rec:'Nhánh NFC được đánh giá tốt hơn nhánh chụp OCR 3,2 lần. Cân nhắc đẩy NFC thành lựa chọn mặc định.',
      hoEl:false, hoWhy:'Là cơ hội tối ưu, không phải điểm gãy. Chuyển sang backlog sản phẩm, không tạo CX issue.' },
  ],
  iss: [
{ id:'CXI-021', title:'Liveness thất bại lặp lại trên Android', step:'s3', metric:'m-liveness', ins:'VI-01', act:'CXA-021',
      sev:'critical', st:'investigating', conf:91,
      ev:['EV-101','EV-102','EV-103','EV-104','EV-501'],
      plain:'Nhiều khách Android không vượt được bước nhận diện khuôn mặt và phải thử lại hoặc gọi hỗ trợ. Tín hiệu đang tăng nên cần quyết định xử lý ngay.',
      hyp:'SDK 4.8.2 nhạy với ánh sáng yếu trên nhóm Android RAM ≤ 4GB.',
      dec:'Duyệt rollout hướng dẫn theo điều kiện lỗi và thử SDK patch trên 10% traffic.',
      sigMap:null,
      imp:{ rep:29, churn:71 },
      cust:['KH•••7A2','KH•••1C9','KH•••4B8','KH•••9F1'] },
    { id:'CXI-017', title:'Không rõ trạng thái ký hợp đồng', step:'s5', metric:'m-contract', ins:'VI-02', act:'CXA-017',
      sev:'high', st:'fixing', conf:84,
      ev:['EV-201','EV-202','EV-203'],
      plain:'Khách không biết hợp đồng đã được ký hay chưa khi phiên SmartCA hết hạn. Điều này tạo bỏ dở và liên hệ lại.',
      hyp:'CTA và trạng thái SmartCA không phản hồi kịp trước khi session hết hạn.',
      dec:'Chốt sticky CTA, trạng thái theo thời gian thực và đường quay lại phiên ký.',
      sigMap:null,
      imp:{ rep:18, churn:19 },
      cust:['KH•••8B4','KH•••9F1'] },
    { id:'CXI-013', title:'Chụp CCCD thất bại nhưng thiếu hướng dẫn', step:'s2', metric:'m-ocr', ins:'VI-03', act:'CXA-013',
      sev:'medium', st:'fixing', conf:72,
      ev:['EV-301','EV-302','EV-303'],
      plain:'Bản cập nhật reason code đã phát hành. Hệ thống đang theo dõi evidence coverage để người phụ trách xác nhận thay đổi có đủ hiệu quả hay chưa.',
      hyp:'Thông báo lỗi chung không phân biệt chói, mờ và sai khung.',
      dec:'Theo dõi reason code sau phát hành và xác nhận evidence coverage đạt mục tiêu trước khi mở rộng hướng dẫn.',
      sigMap:null,
      imp:{ rep:11, churn:12 },
      cust:['KH•••5F6'] },
    { id:'CXI-024', title:'Rớt sớm tại bước nhập SĐT từ traffic banner', step:'s1', metric:'m-completion', ins:null, act:'CXA-024',
      sev:'high', st:'detecting', conf:58,
      ev:['EV-401'],
      plain:'Khách vào từ banner rớt ngay bước đầu sau khoảng 8 giây. Chưa có verbatim nên chưa rõ nguyên nhân, độ tin cậy còn thấp.',
      hyp:'Kỳ vọng từ nội dung banner không khớp với việc phải nhập SĐT ngay.',
      dec:'Chưa đủ căn cứ để duyệt thay đổi. Cần bổ sung khảo sát micro tại bước 01 trước.',
      sigMap:null,
      imp:{ rep:3, churn:8 },
      cust:[] },
    { id:'CXI-026', title:'Khách 50+ cần hỗ trợ bước quay mặt', step:'s3', metric:'m-liveness', ins:'VI-01', act:'CXA-026',
      sev:'medium', st:'investigating', conf:64,
      ev:['EV-601'],
      plain:'Nhóm khách lớn tuổi khó tự hoàn thành bước quay mặt và đề nghị có kênh làm tại quầy.',
      hyp:'Thao tác liveness giả định khách tự cầm máy và tự canh khung.',
      dec:'Cần quyết định liên phòng ban về việc mở kênh hỗ trợ tại quầy. Chưa đưa vào Control Tower kỳ này.',
      sigMap:null,
      imp:{ rep:22, churn:9 },
      cust:['KH•••2C8'] },
    { id:'CXI-028', title:'Zalo OA ngừng gửi dữ liệu từ 19/07', step:'s3', metric:'m-repeat', ins:null, act:'CXA-028',
      sev:'high', st:'fixing', conf:99,
      ev:[],
      plain:'Webhook Zalo OA lỗi từ 19/07 nên repeat contact đang bị đếm thiếu. Mọi số liệu liên hệ lại trong kỳ này đều thấp hơn thực tế.',
      hyp:'Token webhook hết hạn sau lần đổi cấu hình 18/07.',
      dec:'Khôi phục webhook và backfill dữ liệu 8 ngày trước khi dùng số repeat contact để ra quyết định.',
      sigMap:null,
      imp:{ rep:0, churn:0 },
      cust:[] },
  ],
  act: [
    /* 25/08 đợt 2 (owner duyệt báo quá hạn): #/work in "⚠ quá hạn" khi due TRƯỚC asOf (27/07/2026)
       — cùng trục thời gian sources.ts đo stale/down, không dùng đồng hồ thật. Hai due dưới đây
       (CXA-021, CXA-028) CỐ Ý lùi về trước asOf để demo có cả dòng trễ lẫn dòng còn hạn; ngày TĨNH
       chứ không tính tương đối, vì cả vũ trụ fixture đóng băng tại asOf nên không bao giờ trôi. */
{ id:'CXA-021', iss:'CXI-021', title:'Pilot SDK patch + hướng dẫn theo điều kiện lỗi', owner:'Minh Quân', acc:'Head of Onboarding',
      due:'20/07/2026', ap:'pending', cf:'confirmed', dl:'backlog', iv:'not-started', lc:'blocked', sm:'m-liveness' },
    { id:'CXA-017', iss:'CXI-017', title:'Sticky CTA và trạng thái SmartCA theo thời gian thực', owner:'Linh Trần', acc:'Head of Onboarding',
      due:'30/07/2026', ap:'approved', cf:'confirmed', dl:'released', rel:'Mobile 8.12.0 · 16/07/2026 (một phần)', iv:'monitoring', lc:'blocked', sm:'m-contract' },
    /* Action DUY NHẤT đã khép vòng trọn vẹn (owner chốt 02/08/2026, để literal `closed` của ActionLc
       có ít nhất một cư dân thật — trước đó cả prototype lẫn fixture đều 100% 'blocked' nên mọi
       nhánh "đã xong" trong UI là code chết, đếm ra 0 vĩnh viễn).
       CHỌN CXA-013 chứ không thêm issue mới vì dữ liệu quanh nó ĐÃ kể câu chuyện khép vòng: out
       CXA-013 có verdict:'improved', loop CXI-013 đã gửi 25/25 và có `by`/`sent`. Thêm issue mới thì
       phải bịa một điểm gãy và làm dịch MỌI con số Overview — rộng hơn hẳn.
       `iv` phải lên 'validated' cùng lúc: validate.ts:114 canh `closed ⇒ iv==='validated'`, và
       validate.ts:113 canh `validated ⇒ có outcome` (CXA-013 có). */
    { id:'CXA-013', iss:'CXI-013', title:'Reason code cho lỗi chụp CCCD', owner:'Hà Vũ', acc:'Data Platform Lead',
      due:'29/07/2026', ap:'approved', cf:'confirmed', dl:'released', rel:'Mobile 8.12.0 · 16/07/2026', iv:'validated', lc:'closed', sm:'m-ocr' },
    { id:'CXA-024', iss:'CXI-024', title:'Thêm khảo sát micro tại bước nhập SĐT', owner:'Chưa gán', acc:'Head of Growth',
      due:'08/08/2026', ap:'pending', cf:'pending', dl:'backlog', iv:'not-started', lc:'blocked', sm:'m-completion' },
    { id:'CXA-026', iss:'CXI-026', title:'Đánh giá phương án hỗ trợ eKYC tại quầy', owner:'Thu Hà', acc:'Head of CX',
      due:'15/08/2026', ap:'pending', cf:'confirmed', dl:'backlog', iv:'not-started', lc:'blocked', sm:'m-liveness' },
    /* due 24/07 < asOf: webhook gãy từ 18-19/07, việc khôi phục trễ hẹn là dòng "quá hạn" thật của
       demo (xem ghi chú đầu act). */
    { id:'CXA-028', iss:'CXI-028', title:'Khôi phục webhook Zalo OA và backfill 8 ngày', owner:'Hà Vũ', acc:'Data Platform Lead',
      due:'24/07/2026', ap:'approved', cf:'confirmed', dl:'in-progress', iv:'not-started', lc:'blocked', sm:'m-repeat' },
  ],
  out: [
{ act:'CXA-013', base:{ v:71.0, u:'%', p:'09/07 – 15/07/2026', n:412 }, post:{ v:91.4, u:'%', p:'17/07 – 27/07/2026', n:286 },
      cohort:'Khách fail chụp CCCD, cả iOS và Android', win:'11 ngày sau release Mobile 8.12.0',
      conf:[], verdict:'improved', by:'Hà Vũ · 27/07/2026' },
    { act:'CXA-017', base:{ v:94.0, u:'%', p:'28/06 – 15/07/2026', n:1840 }, post:{ v:95.1, u:'%', p:'16/07 – 27/07/2026', n:640 },
      cohort:'Phiên ký SmartCA, iOS', win:'12 ngày, bản sửa chưa release đầy đủ',
      conf:['Cùng kỳ có release Mobile 8.12.0 chứa 4 thay đổi khác','Kỳ quan sát trùng đợt nghỉ lễ, volume thấp hơn 18%'],
      verdict:'inconclusive', by:null },
  ],
  /* Baseline đóng băng lúc XÁC NHẬN — một dòng cho mỗi action có cf:'confirmed', khoá theo issue.
     Issue đã có Outcome (CXA-013, CXA-017) → m là chính outcome.base, không đẻ số mới. Issue chưa có
     Outcome (CXA-021, CXA-026, CXA-028) → m lấy nguyên số hiện tại của metric + obs.entered của bước,
     nghĩa là delta = 0 tại lúc này — đúng sự thật vì chưa sửa gì thì chưa đổi gì, không nống số cho
     đẹp demo. p dùng chuỗi kỳ "6 tháng gần nhất" đã có ở periods (d30) làm cửa sổ quan sát cố định,
     thay vì bịa một khoảng ngày mới. at cố định 15/07/2026 (ngày xác nhận), by lấy từ acc của action. */
  snap: [
{ iss:'CXI-021', at:'15/07/2026', by:'Head of Onboarding',
      m:{ v:83.3, u:'%', p:'28/01/2026 – 27/07/2026', n:15840 },
      obs:{ stepId:'s3', entered:15840, completed:13190, failed:2650, effort:2.4, cov:64 } },
    { iss:'CXI-017', at:'15/07/2026', by:'Head of Onboarding',
      m:{ v:94.0, u:'%', p:'28/06 – 15/07/2026', n:1840 },
      obs:{ stepId:'s5', entered:12760, completed:11990, failed:770, effort:1.3, cov:58 } },
    { iss:'CXI-013', at:'15/07/2026', by:'Data Platform Lead',
      m:{ v:71.0, u:'%', p:'09/07 – 15/07/2026', n:412 },
      obs:{ stepId:'s2', entered:17690, completed:15840, failed:1850, effort:1.6, cov:71 } },
    { iss:'CXI-026', at:'15/07/2026', by:'Head of CX',
      m:{ v:83.3, u:'%', p:'28/01/2026 – 27/07/2026', n:15840 },
      obs:{ stepId:'s3', entered:15840, completed:13190, failed:2650, effort:2.4, cov:64 } },
    { iss:'CXI-028', at:'15/07/2026', by:'Data Platform Lead',
      m:{ v:24.0, u:'%', p:'28/01/2026 – 27/07/2026', n:15840 },
      obs:{ stepId:'s3', entered:15840, completed:13190, failed:2650, effort:2.4, cov:64 } },
  ],
  loop: [
{ iss:'CXI-021', need:63, done:0,  ch:'Chưa chọn kênh', by:null,                    sent:null },
    { iss:'CXI-017', need:29, done:0,  ch:'In-app + ZNS',   by:null,                    sent:null },
    { iss:'CXI-013', need:25, done:25, ch:'In-app',         by:'Thu Hà · Head of CX',   sent:'Sentiment sau liên hệ +0,4 · 18/25 phản hồi tích cực' },
  ],
  /* Fixture thật KHÔNG mang số minh hoạ — cùng nguyên tắc với sigCounts (Demo Mode TẮT ⇒ rỗng là
     trạng thái TRUNG THỰC, không phải bịa số để lấp chart). Xem data/fixtures/demo.ts cho 5 dòng
     sinh tất định (module-b-issue-charter.md, section B1). */
  hist: [],
  /* `bands` ở đây là GIÁ TRỊ MONG ĐỢI theo `cfgDefault` — nguồn thật là ba số thô ngay cạnh
     (ageYears/navVnd/tenureMonths), và `seed` export ở cuối file CHIẾU LẠI bằng
     `projectCustomerBands` nên nhãn thực tế luôn do ranh giới sinh. Giữ nhãn viết tay vì nó tự tài
     liệu hoá số thô, và validate nhóm 19 canh `nhãn === bandOf(số thô)` để không lệch âm thầm.
     navVnd = 0 nghĩa là CHƯA NẠP TIỀN (không phải "không đọc được số" — đó là sentinel). 4B8 có
     12tr để nhóm thấp nhất không phải toàn số 0: nhờ vậy một ranh giới sát 0 (owner tách nhóm CHƯA
     CÓ TÀI SẢN) mới chia được nhóm này làm hai — kiểm được ở projectBands.test.ts.
     Khoá của `bands` là ID CHIỀU, không phải tên field khách: đổi từ ba ô cố định sang map ở đợt 2a
     để chiều owner tự thêm cũng có chỗ ghi nhãn (xem data/schema/cxm.ts). */
  cust: [
{ key:'KH•••7A2', seg:'Mới mở TK',                  tier:'new',        pf:'android', st:'Bỏ dở tại bước 03',
      ageYears:29, navVnd:0, tenureMonths:'chưa-biết',
      bands:{ age:'25-34', nav:'<50tr', tenure:'chưa-biết' }, acq:'banner' },
    { key:'KH•••1C9', seg:'Mới mở TK',                  tier:'new',        pf:'android', st:'Bỏ dở tại bước 03, đã gọi hỗ trợ',
      ageYears:41, navVnd:0, tenureMonths:'chưa-biết',
      bands:{ age:'35-49', nav:'<50tr', tenure:'chưa-biết' }, acq:'banner' },
    { key:'KH•••4B8', seg:'Mới mở TK',                  tier:'new',        pf:'android', st:'Hoàn tất sau 4 lần thử',
      ageYears:31, navVnd:12e6, tenureMonths:3,
      bands:{ age:'25-34', nav:'<50tr', tenure:'<6 tháng' }, acq:'tự tìm' },
    { key:'KH•••9F1', seg:'Khách chuyển từ CTCK khác',  tier:'high-value', pf:'android', st:'Đã hoàn tất, có 3 lần liên hệ',
      ageYears:44, navVnd:2.4e9, tenureMonths:84,
      bands:{ age:'35-49', nav:'1-5tỷ', tenure:'>5 năm' }, acq:'giới thiệu' },
    { key:'KH•••8B4', seg:'Mới mở TK',                  tier:'standard',   pf:'ios',     st:'Bỏ dở tại bước 05',
      ageYears:27, navVnd:0, tenureMonths:'chưa-biết',
      bands:{ age:'25-34', nav:'<50tr', tenure:'chưa-biết' }, acq:'đối tác' },
    { key:'KH•••5F6', seg:'Mới mở TK',                  tier:'standard',   pf:'ios',     st:'Hoàn tất · đã được liên hệ khép vòng',
      ageYears:38, navVnd:0, tenureMonths:4,
      bands:{ age:'35-49', nav:'<50tr', tenure:'<6 tháng' }, acq:'chi nhánh' },
    { key:'KH•••2C8', seg:'Khách 50+',                  tier:'standard',   pf:'android', st:'Chưa hoàn tất, cần hỗ trợ',
      ageYears:57, navVnd:0, tenureMonths:'chưa-biết',
      bands:{ age:'50+', nav:'<50tr', tenure:'chưa-biết' }, acq:'chi nhánh' },
  ],
  qt: [
{ id:'q1', kind:'show', show:'theme', metric:'count', chart:'rank', name:'Volume theo Theme' },
    { id:'q2', kind:'show', show:'l1', metric:'count', chart:'rank', name:'Volume theo L1 Keyword' },
    { id:'q3', kind:'show', show:'cat', metric:'count', chart:'rank', name:'Volume theo Category' },
    { id:'q4', kind:'show', show:'src', metric:'count', chart:'rank', name:'Volume theo Nguồn' },
    { id:'q9', kind:'show', show:'l2', metric:'count', chart:'rank', name:'Volume theo L2 Keyword' },
    { id:'q10',kind:'show', show:'l3', metric:'count', chart:'rank', name:'Volume theo L3 Keyword' },
    { id:'q11',kind:'show', show:'sub', metric:'count', chart:'rank', name:'Volume theo Sub-theme' },
    { id:'q12',kind:'show', show:'sen', metric:'count', chart:'rank', name:'User Sentiment' },
    { id:'q13',kind:'show', show:'pf',  metric:'count', chart:'rank', name:'Volume theo Nền tảng' },
    { id:'q14',kind:'show', show:'src', metric:'pct', chart:'donut', name:'Tỷ trọng nguồn phản hồi' },

    /* q16 (Theme × Nền tảng, ghép chéo) đã BỎ (S4, owner chốt 04/08, thiết kế §5) — năng lực
       qRunCross/CrossTable GIỮ NGUYÊN, chỉ không còn saved query nào trỏ vào; xem
       domain/quantify.test.ts và design-system/CrossTable.test.tsx (tự dựng item để giữ độ phủ). */

    /* Hai chart trục phân khúc khách (owner chốt 03/08) — TRƯỚC ĐÂY không item nào dùng base:'cust',
       nên cả tầng phủ phân khúc (dải "Không xác định" + dòng "Phủ X%" ở QuantifyWidget) chỉ hiện khi
       người dùng tự dựng chart trong builder. Hai item này phơi nó ra sẵn — nhưng sau 04/08 (NAV lấy
       trực tiếp từ tài sản hiện tại) chỉ còn q17 có dải "Không xác định"; q18 chỉ còn dòng "Phủ 100%".
       KHÔNG được set `by`: dims.acq/dims.nav là base:'cust' không có evAttr, validate rule 16 chặn. */
    { id:'q17',kind:'show', show:'acq', metric:'count', chart:'rank', name:'Khách theo kênh mở TK' },
    { id:'q18',kind:'show', show:'nav', metric:'count', chart:'rank', name:'Khách theo phân khúc NAV' },

    /* q19 (Kênh mở TK × Phân khúc NAV, split) đã BỎ (S4, owner chốt 04/08, thiết kế §5) — năng lực
       `qRunSplit`/`SplitToggle` GIỮ NGUYÊN, chỉ không còn saved query nào ghim `split` sẵn; xem
       domain/quantify.test.ts và design-system/QuantifyWidget.*.test.tsx (tự dựng item để giữ độ phủ). */

    { id:'q5', kind:'series', chart:'trend', name:'Trend theme "Thiết bị không tương thích"', dim:'Theme · xu hướng', unit:'kỳ', shown:6, total:6,
      t:[{l:'Positive share (%)',p:[54,52,50,48,46,44,42,40,36,31,26,19]}] },
    { id:'q6', kind:'series', chart:'trend', name:'Trend bước Liveness & Face match', dim:'JourneyStep · 6 kỳ', unit:'kỳ', shown:6, total:6,
      t:[{l:'Liveness completion (%)',p:[95,94,93,92,91,90,89,88,87,86,84,83]}] },
    { id:'q7', kind:'series', chart:'cohort', name:'So sánh cohort Android vs iOS', dim:'platform · theme thiết bị', unit:'kỳ', shown:6, total:6,
      t:[{l:'Android · tỷ lệ fail liveness (%)',p:[8,9,10,11,12,13,14,15,16,18,20,22]},{l:'iOS · tỷ lệ fail liveness (%)',p:[8,8,8,8,8,8,8,8,9,8,9,8]}] },
    { id:'q8', kind:'series', chart:'cohort', name:'So sánh cohort high-value vs còn lại', dim:'valueTier · theme thiết bị', unit:'kỳ', shown:6, total:6,
      t:[{l:'High-value · repeat contact (%)',p:[6,8,10,12,14,16,18,20,23,26,29,34]},{l:'Còn lại · repeat contact (%)',p:[12,12,12,12,12,12,12,12,13,13,14,14]}] },
    { id:'q15',kind:'series', chart:'anomaly', name:'Bất thường theo tháng', dim:'Theme · Z-score', unit:'kỳ', shown:2, total:6,
      t:[{l:'Thiết bị / môi trường không tương thích',p:[190,205,220,235,250,265,280,295,310,340,402,908]},
         {l:'Chờ quá lâu không phản hồi',p:[164,168,172,176,180,184,188,192,205,198,210,97]}] },
  ],
  dash: [
{ id:'b-voc-all', sec:'voc', name:'Toàn cảnh tiếng nói', role:'Head of CX / VoC Analyst', shared:true,
      owner:'Linh Trần · CX Insight', up:'28/07/2026', def:true,
      desc:'Bức tranh đầy đủ: nguồn nào đang nói, nói về phần nào của hành trình, nói gì, và cái gì đang lệch khỏi bình thường.',
      /* 25/08 (owner, quét AI-slop): header mục đổi từ câu hỏi sang CỤM DANH TỪ — cùng quy ước
         tên khối 12/08. Field vẫn tên `q` (schema không đổi); Evidence.q là lời khách, không đụng. */
      qs:[
        { q:'Nguồn phản hồi', b:['q14','@srcmatrix'] },
        /* 25/08 (owner duyệt audit đọc-hiểu): L2/L3 là lớp CHI TIẾT của cùng câu chuyện L1 — ba
           rank chart cùng hình dạng xếp chồng làm màn dài mà không thêm tin. L1 luôn mở; L2/L3
           gập mặc định (fold), bấm mới xoè — và vì đứng liền nhau nên chung một ô grid, hết ô
           mồ côi cạnh q10. */
        { q:'Tiếng nói theo hành trình',
          b:['q2','q9','q10'], fold:['q9','q10'] },
        { q:'Nội dung phản hồi',
          b:['@intent','@themestack'] },
        { q:'Bất thường', b:['q15'] },
      ] },
    { id:'b-voc-data', sec:'voc', name:'Chất lượng nền dữ liệu', role:'Data Platform Lead', shared:true,
      owner:'Hà Vũ · Data Platform', up:'27/07/2026',
      desc:'Chỉ nhìn ống dẫn: nguồn nào hỏng, hỏng kiểu gì, và ta đang nghe thụ động nhiều hơn hỏi chủ động bao nhiêu lần.',
      qs:[
        { q:'Tình trạng nguồn', b:['@srcmatrix','q4'] },
        { q:'Tỷ trọng nghe thụ động · hỏi chủ động', b:['q14','q13'] },
        { q:'Sự cố ống dẫn', b:['@anomlanes'] },
      ] },
    { id:'b-voc-topic', sec:'voc', name:'Topic đang xấu đi', role:'VoC Analyst', shared:false,
      owner:'Linh Trần · CX Insight', up:'28/07/2026',
      desc:'Theo dõi riêng nhóm topic có xu hướng xấu, sub-theme bên dưới và cohort chịu ảnh hưởng nặng nhất.',
      qs:[
        { q:'Topic lớn nhất', b:['@topictrend','q1','q11'] },
        { q:'Xu hướng theo kỳ', b:['q5','q15'] },
        { q:'Nhóm khách chịu ảnh hưởng nặng nhất', b:['q7','q8'] },
      ] },

    
    { id:'b-cxm-exec', sec:'cxm', name:'Điều hành CX', role:'Head of CX / CX Manager', shared:true,
      owner:'Thu Hà · Head of CX', up:'28/07/2026', def:true,
      desc:'Bốn câu của người điều hành: chỗ nào gãy, xử lý cái nào trước, ai đang làm gì, và thay đổi vừa rồi có tác dụng không.',
      qs:[
        { q:'Điểm gãy theo hành trình', b:['@journeystate'] },
        /* Đổi 14/08 (ADR-002 §17). Câu cũ "Điểm gãy nào đáng xử lý trước?" nay là câu của `#/work`
           và CHỈ của `#/work` — ba bảng ở đây đều xếp theo một THÀNH PHẦN của cùng điểm ưu tiên đó,
           nên để hai chỗ cùng hỏi một câu là hai câu trả lời khác nhau chạy song song. Chữ "Bốn"
           cũng phải đổi: card "tác động CES" đã bỏ (§12), còn ba. */
        { q:'Điểm gãy theo từng khoá ưu tiên', b:['@toppri'] },
        /* KHÔNG đặt 'Độ phủ đo lường': đó là tiêu đề card của chính @coverage — header mục trùng
           nguyên văn tiêu đề card ngay dưới là một dữ kiện đọc hai lần. */
        { q:'Phần hành trình đo được', b:['@coverage'] },
      ] },
    { id:'b-cxm-pilot', sec:'cxm', name:'Sức khỏe pilot Mở tài khoản', role:'Onboarding Squad', shared:true,
      owner:'Minh Quân · Onboarding', up:'27/07/2026',
      desc:'Chỉ nhìn pilot: sáu bước đang thế nào, đo được tới đâu, ta biết gì về khách trong đó, và hai chỉ số quan trọng nhất của nó.',
      qs:[
        { q:'Trạng thái sáu bước pilot', b:['@journeystate'] },
        { q:'Phần hành trình đo được', b:['@coverage'] },
        /* Gắn vào b-cxm-pilot, KHÔNG b-cxm-exec: OverviewPage.test.tsx:170 chốt cứng danh sách khối
           của exec bằng toEqual([...]) — đó là quyết định owner 01/08, thêm vào đấy là phá test khoá.
           Và đây là chỗ đúng về nghĩa: dims.acq nhãn "Kênh mở TK", khớp thẳng pilot Mở tài khoản. */
        { q:'Chân dung khách trong cohort',
          b:['q17','q18'] },
        { q:'Chỉ số pilot', b:['q6','q7'] },
      ] },
    { id:'b-cxm-out', sec:'cxm', name:'Hiệu quả sau thay đổi', role:'Head of CX / PO', shared:false,
      owner:'Thu Hà · Head of CX', up:'26/07/2026',
      desc:'Dành cho buổi review cuối kỳ: đã đo được gì, còn gì chờ người, và ưu tiên nào chưa động tới.',
      qs:[
        { q:'Kết quả sau thay đổi', b:['@outcomes'] },
        { q:'Việc chờ người', b:['@lanes'] },
        { q:'Ưu tiên chưa động tới', b:['@toppri'] },
      ] },
  ],
  ag: [
{ id:'ag-q', kind:'quality-monitor', name:'Quality Monitor', st:'on', last:'27/07 · 15:00',
      purpose:'Phát hiện volume tăng/giảm bất thường so với baseline, và nguồn ngừng gửi dữ liệu.',
      f:[ { id:'AF-01', lane:'pipeline', sev:'critical', at:'19/07 · 11:30', title:'Zalo OA ngừng gửi dữ liệu',
            detail:'Volume từ Zalo OA về 0 trong 8 ngày liên tiếp, baseline là ~120/ngày. Mọi số repeat contact trong kỳ đang bị đếm thiếu.', ev:[] },
          { id:'AF-02', lane:'pipeline', sev:'high', at:'26/07 · 23:15', title:'In-app survey trễ hơn thoả thuận',
            detail:'Job tổng hợp survey đang trễ 12 giờ, vượt SLA độ tươi của nguồn In-app survey. Điểm CES trên Dashboard đang là dữ liệu của hôm trước.', ev:[] },
          { id:'AF-03', lane:'behaviour', sev:'high', at:'27/07 · 09:00', title:'Volume lỗi liveness vượt baseline 2,4 lần',
            detail:'Số event ekyc_face_liveness_result với status=fail đạt 1.180/ngày, baseline 30 ngày là ~490/ngày.', ev:['EV-101','EV-103'] } ] },
    { id:'ag-e', kind:'escalation', name:'Escalation', st:'on', last:'27/07 · 14:45',
      purpose:'Đánh dấu khách giá trị cao có phản hồi cảm xúc mạnh hoặc liên hệ lặp lại nhiều lần.',
      f:[ { id:'AF-04', lane:'voice', sev:'critical', at:'27/07 · 10:45', title:'Khách high-value liên hệ lần thứ 3 cùng một việc',
            detail:'KH•••9F1 (khách chuyển từ CTCK khác) đã gọi 3 lần trong 3 ngày về bước xác thực khuôn mặt. Chưa có ai được gán xử lý riêng.', ev:['EV-501'] },
          { id:'AF-05', lane:'voice', sev:'high', at:'26/07 · 18:50', title:'Cụm khách 50+ có repeat contact cao bất thường',
            detail:'Nhóm segment 50+ có repeat contact 22% ở bước 03, so với 11% trung bình toàn bộ.', ev:['EV-601'] } ] },
    { id:'ag-n', kind:'newsfeed', name:'Newsfeed', st:'on', last:'27/07 · 07:00',
      purpose:'Tổng hợp bản tin định kỳ theo vai, gửi qua kênh đã đăng ký.',
      f:[ { id:'AF-06', lane:null, sev:'medium', at:'27/07 · 07:00', title:'Bản tin tuần cho Head of CX đã gửi',
            detail:'Nội dung: 1 issue mới ở mức cần xử lý ngay, 2 action chờ duyệt, 1 outcome kết luận là worse do mất nguồn dữ liệu.', ev:[] },
          { id:'AF-07', lane:'voice', sev:'medium', at:'27/07 · 07:00', title:'Theme mới xuất hiện tuần này',
            detail:'34 verbatim dùng cụm "ứng dụng định danh quốc gia" chưa gán vào node VNeID / NFC. Cần người xác nhận cách gán.', ev:['EV-305'] } ] },
  ],
  /* Demo Mode TẮT = trạng thái TRUNG THỰC "chưa nhận được số đếm sẵn từ bên dữ liệu" (thiết kế §2)
     — RỖNG ở đây không phải lỗi, không phải chỗ thiếu code. demoData (fixtures/demo.ts) mới là nơi
     có số, sinh từ các lần bắn nội bộ rồi cộng qua projectSignalCounts. */
  sigCounts: [],
  /* Cùng lý do với `sigCounts` ngay trên: chưa nhận được dòng lượt bắn thô nào. Kèm một lý do thứ
     hai của riêng bảng này — cả 30 điểm đo đang khai `instAt: null` vì **Bảng D còn treo**, nên dù
     có dòng thô cũng chưa dựng được chuỗi theo ngày (xem projectSigTrend.ts, nhánh `refuse`). */
  sigFires: [],
};

export const seedNav: { g?: string; r?: string; ic?: string; l?: string }[] = [
  { g: "CXM · Quản trị trải nghiệm" },
  { r: "cxm", ic: "▦", l: "Tổng quan CXM" },
  { r: "atlas", ic: "⎇", l: "Bản đồ hành trình" },
  { r: "work", ic: "⚑", l: "Bảng xử lý" },
  { g: "Voice of Customer" },
  { r: "voc", ic: "◐", l: "Tổng quan VoC" },
  { r: "sources", ic: "⌁", l: "Nguồn dữ liệu" },
  { r: "topics", ic: "⋔", l: "Topic & xu hướng" },
  { r: "vocjourney", ic: "❋", l: "VoC theo hành trình" },
  { g: "Công cụ" },
  { r: "quantify", ic: "▤", l: "Quantify" },
  { r: "assistant", ic: "✦", l: "Trợ lý" },
  { g: "Quản trị" },
  { r: "rules", ic: "⚙", l: "Chỉ số & ngưỡng" },
  /* 25/08 (owner): mục "Agent & cảnh báo" gộp vào Trợ lý (assistant) — cùng đợt bỏ mục ở NAV_GROUPS. */
  { r: "signals", ic: "◎", l: "Điểm đo" },
];

export const seedTour: { r: string; grp: string; sel: string; t: string; d: string }[] = [
  { r: "cxm", grp: "Tổng quan CXM", sel: '[data-tour="setchips"]', t: "Bộ chọn set câu hỏi", d: "Mỗi chip là một bộ câu hỏi điều hành viết sẵn cho một vai trò." },
  { r: "cxm", grp: "Tổng quan CXM", sel: '[data-tour="blk-@toppri"]', t: "Điểm gãy nào xử lý trước", d: "Bảng xếp hạng điểm gãy." },
  { r: "cxm", grp: "Tổng quan CXM", sel: '[data-tour="blk-@coverage"]', t: "Đo được bao nhiêu phần hành trình", d: "Độ phủ evidence theo từng bước." },
  { r: "atlas", grp: "Bản đồ hành trình", sel: '[data-tour="atlas-prail"]', t: "Rail 6 phase", d: "Sáu phase hành trình xếp ngang." },
  { r: "atlas", grp: "Bản đồ hành trình", sel: '[data-tour="atlas-spine"]', t: "Xương sống bước & dải nối", d: "Đọc theo chiều ngang." },
  { r: "atlas", grp: "Bản đồ hành trình", sel: '[data-tour="atlas-inspector"]', t: "Hồ sơ bước — 3 tab", d: "Chọn một bước để mở ba tab." },
  { r: "voc", grp: "Tổng quan VoC", sel: '[data-tour="blk-@intent"]', t: "Khách đang nói gì (4 intent)", d: "Bốn khối theo intent." },
  { r: "voc", grp: "Tổng quan VoC", sel: '[data-tour="blk-q15"]', t: "Cái gì đang bất thường", d: "Bất thường theo Z-score qua các kỳ." },
  { r: "sources", grp: "Nguồn dữ liệu", sel: '[data-tour="src-table"]', t: "Sức khỏe 7 nguồn", d: "Mỗi nguồn có SLA độ trễ riêng." },
  { r: "sources", grp: "Nguồn dữ liệu", sel: '[data-tour="src-profile"]', t: "Hồ sơ dữ liệu một nguồn", d: "Bấm một nguồn để mở hồ sơ." },
  { r: "topics", grp: "Topic & xu hướng", sel: '[data-tour="topic-chart"]', t: "Biểu đồ đường theo thời gian", d: "Trục thời gian của VoC." },
  { r: "topics", grp: "Topic & xu hướng", sel: '[data-tour="topic-table"]', t: "Chọn topic để theo dõi", d: "Bảng mọi topic kèm volume." },
  { r: "topic/x-th-device", grp: "Topic & xu hướng", sel: '[data-tour="topic-detail"]', t: "Chi tiết một topic", d: "Màn chi tiết riêng của một topic." },
  { r: "vocjourney", grp: "VoC theo hành trình", sel: '[data-tour="voc-spine"]', t: "Tiếng nói theo điểm chạm", d: "Cùng ba nhịp điều hướng với Bản đồ." },
  { r: "vocjourney", grp: "VoC theo hành trình", sel: '[data-tour="voc-inspector"]', t: "Tab Verbatim — bằng chứng", d: "Hồ sơ điểm chạm mở sẵn ở tab Verbatim." },
  { r: "work", grp: "Bảng xử lý", sel: '[data-tour="work-lanes"]', t: "Bốn làn công việc", d: "Việc còn cần tay người." },
  { r: "work", grp: "Bảng xử lý", sel: '[data-tour="work-lane-approve"]', t: "Cổng duyệt trên thẻ", d: "Làn Chờ duyệt." },
  { r: "work", grp: "Bảng xử lý", sel: '[data-tour="work-lane-verify"]', t: "Làn verify — chặn khi còn nhiễu", d: "So trước–sau trên từng thẻ." },
];

/* Danh sách người cho #/work — port nguyên văn OWNERS/APPROVERS của prototype (dòng 2878-2879).
   Đây là fixture data (danh sách người thật sẽ dùng), KHÔNG phải hằng UI, nên đặt cạnh seed thay
   vì trong component. */
export const seedOwners: string[] = ["Minh Quân", "Linh Trần", "Hà Vũ", "Thu Hà", "Đức Anh", "Ngọc Mai"];
export const seedApprovers: string[] = ["Head of Onboarding", "Head of Growth", "Head of CX", "Head of Risk", "Data Platform Lead"];

export const cfgDefault: Cfg = {
  /* `jc`/`reg` RỖNG là trạng thái ĐÚNG, không phải fixture chưa làm xong (ADR-002 §5, §6): mức
     quan trọng và rủi ro pháp lý của một bước là phán đoán của owner, không phải số đo — điền sẵn
     vài giá trị "cho có" là bịa ra chính thứ bản đồ này sinh ra để bỏ. Hệ quả nhìn thấy ngay: cả
     sáu điểm gãy seed thiếu `jc` và `reg` nên nằm ở khối "chưa đủ dữ liệu để xếp" của `#/work` —
     và khối đó CHÍNH LÀ danh sách 30 ô owner phải điền (§19). */
  step: { failWatch: 5, failCrit: 15, covMin: 70, effortMax: 2.0, jc: {}, reg: {} },
  /* Trọng số bảy khoá, cộng lại đúng 100 (`data/validate.ts` canh). Giữ THỨ TỰ NẶNG NHẸ của bộ số
     cũ đang chạy (sev 30 > aff 22 > jc 18 > rep 12 > tr 8 > reg 4) và chèn `hv` — khoá thứ bảy
     (§11) — vào giữa. Không phát minh lại tương quan: ADR-002 §3 chỉ chốt THANG, không chốt bộ số,
     và đây là ô owner sửa được nên một bộ khởi điểm hợp lý đủ dùng. */
  pri: {
    w: { sev: 24, aff: 22, jc: 16, hv: 12, rep: 10, tr: 8, reg: 8 },
    /* Mốc neo: giá trị nào của số đo thì chiếu chạm 1,0. `aff` 1.000 khách, `hv` 50 khách,
       `tr` ±50%. `rep` neo theo `cfg.data.repeatWarn` (đã có, không khai lại ở đây). */
    anchor: { aff: 1000, hv: 50, tr: 50 },
  },
  /* "Khách giá trị cao" mặc định = hai dải NAV cao nhất. Chọn `nav` chứ không `tier` vì `nav` cắt
     ngưỡng nên nhãn dải SINH từ `segment.band.nav.cuts` ngay bên dưới — danh sách luôn đóng và
     luôn khớp. `tier` là string tự do chưa có danh mục đóng (`segment.values` không có entry), nên
     bộ chọn ở đó chỉ liệt kê được giá trị tình cờ có trong dữ liệu (ADR-002 §10). Hai nhãn dưới đây
     phải khớp `bandLabels(segment.band.nav)` — `data/validate.ts` canh, không tin vào việc gõ đúng. */
  hv: { dim: "nav", values: ["1-5tỷ", "5tỷ+"] },
  metric: {
    "m-completion": { on: true, watch: 72, crit: 68 },
    "m-liveness": { on: true, watch: 90, crit: 85 },
    "m-contract": { on: true, watch: 97, crit: 92 },
    "m-ocr": { on: true, watch: 90, crit: 60 },
    "m-ces": { on: true, watch: 4.2, crit: 3.5 },
    "m-repeat": { on: true, watch: 15, crit: 20 },
  },
  /* Nhịp giao từng nguồn, tính bằng NGÀY (schema/config.ts `Cfg.source`). Đổi đơn vị 11/08 từ bộ
     giờ cũ {ga 6, ekyc 8, case 4, survey 6, store 36, broker 36, zalo 6} — quy đổi bằng SỐ NGÀY DỮ
     LIỆU TRỌN VẸN mà giờ SLA cũ cho phép trễ (`floor(giờ/24)`): nguồn nào thoả thuận trong ngày thì
     nhịp là 0, hai nguồn 36 giờ (crawl 1 lần/ngày, nhập tay trong CRM) thì nhịp là 1. Không làm
     tròn lên: 6 giờ thành 1 ngày là nới thoả thuận gấp bốn lần sau lưng bên dữ liệu. */
  source: { "src-ga": 0, "src-ekyc": 0, "src-case": 0, "src-survey": 0, "src-store": 1, "src-broker": 1, "src-zalo": 0 },
  /* Ngưỡng từng điểm đo (owner chốt schema 19/08). NĂM entry khởi điểm — đúng năm dòng của bản
     mockup ASCII owner đã duyệt, mỗi kind ít nhất một ca: floor (signal một-giá-trị), badRate
     (kết quả success/fail), ceiling đếm tất (fail-reason), ceiling + bad + cửa sổ dài (hiếm-mà-
     nghiêm-trọng), goodRate (nhiều giá trị, "% ghi có ngay tụt" đọc xuôi hơn phần bù). 25 điểm đo
     còn lại BỎ TRỐNG là trạng thái đúng — chưa đặt thì chưa đánh giá, không phải fixture thiếu.
     Số warn/crit là bộ khởi điểm hợp lý (cùng loại quyết định với `metric` ở trên), CÂN theo mật
     độ lượt bắn demo (fires rải cả đời điểm đo nên số trong cửa sổ 7 ngày nhỏ hơn `vol` nhiều). */
  signal: {
    sg1: { kind: "floor", warn: 6, crit: 2 },
    sg3: { kind: "badRate", bad: ["fail"], minN: 10, warn: 10, crit: 20 },
    sg4: { kind: "ceiling", warn: 4, crit: 8 },
    sg8: { kind: "ceiling", bad: ["fail"], winDays: 30, warn: 1, crit: 3 },
    "sg-nap-3": { kind: "goodRate", good: ["immediate"], minN: 30, warn: 80, crit: 60 },
  },
  data: { deadDays: 2, cooldown: 14, repeatWarn: 20, churnWarn: 50 },
  /* z=2,5 — owner chốt 02/08 cùng cửa sổ tối thiểu i>=3 (domain/stats.ts). Ở 1,5 chart gắn cờ
     19/20 điểm chấm được của q15, tức gần như mọi điểm, nên vòng tròn mất hết ý nghĩa. */
  anomaly: { z: 2.5 },
  sub: {
    "b-cxm-exec": { f: "weekly", ch: "Email + Slack" },
    "b-cxm-pilot": { f: "off", ch: "Email" },
    "b-cxm-out": { f: "monthly", ch: "Email" },
    "b-voc-all": { f: "daily", ch: "Slack" },
    "b-voc-data": { f: "daily", ch: "Slack" },
    "b-voc-topic": { f: "weekly", ch: "Email" },
  },
  /* Mốc y hệt union NavBand/AgeBand/TenureBand cũ (data/schema/cxm.ts:120-122) — module E chuyển
     ranh giới dải từ compile-time (union type) sang runtime (cfg.segment), nhãn phải sinh lại
     ĐÚNG những gì đang chạy hôm nay qua data/bands.ts, không đổi nhãn nào. */
  segment: {
    /* Khoá là ID CHIỀU (khớp `dims` bên dưới), không phải tên dữ kiện nguồn: hai chiều cắt cùng một
       số thô theo hai bộ ranh giới khác nhau phải có hai entry riêng ở đây. */
    band: {
      nav: { min: null, cuts: [50e6, 200e6, 1e9, 5e9], unit: 'đ' },
      age: { min: 18, cuts: [25, 35, 50], unit: 'năm' },
    },
    /* `tenure` (S2, 04/08): chiều đã RÚT khỏi `dims` bên dưới nên ranh giới này không còn ai đọc —
       xoá cùng lúc, theo đúng luật validate.ts:602 lặp trên `cfg.segment.band` (bỏ sót sẽ sinh lỗi
       mồ côi ở nhóm 20, xem docs/DB-FIRST-HANDOFF.md mục "Việc còn lại của stream"). `Customer.
       tenureMonths` (dữ kiện thô) và `CUST_NUM.tenureMonths` VẪN GIỮ — hệ thống vẫn biết thâm niên
       từng khách, chỉ không còn cắt chart theo nó.
       `seg`/`tier` CHƯA có entry — chưa chốt danh sách đóng cho hai chiều đó, và thiếu entry là hợp
       lệ (validate không kiểm giá trị lạ). Đừng thêm entry rỗng: `[]` nghĩa là "mọi giá trị đều lạ". */
    values: {
      acq: ['banner', 'giới thiệu', 'chi nhánh', 'tự tìm', 'đối tác'],
    },
  },
};

/* Bảng khai chiều. Bốn chiều khách (`base:'cust'`, sau khi S2 rút `seg`/`tenure`) khai thêm `cut` —
   CÁCH CHIA — từ đợt 2a: trước đó
   cách chia là một bảng viết tay riêng ở tầng tính toán, phải khớp tay với bảng này, và thiếu một bên
   thì chart trả rỗng không báo lỗi. Giờ khai một lần ở đây là đủ.
   Ô `rows` (luôn rỗng, chưa nơi nào đọc) đã bỏ — nhóm của một chiều được ĐẾM RA từ dữ liệu, không
   chứa sẵn trong khai báo.
   `source` trỏ vào danh mục dữ kiện đang có (data/rawFields.ts) — xem giới hạn trung thực ở đó. */
export const dims: Record<string, Dim> = {
  l1: { label: "L1 Keyword · phase", unit: "keyword", base: "agg", evAttr: true },
  l2: { label: "L2 Keyword · tính năng", unit: "keyword", base: "agg", evAttr: true },
  l3: { label: "L3 Keyword · chi tiết", unit: "keyword", base: "agg", evAttr: true },
  theme: { label: "Theme · vì sao", unit: "theme", base: "agg", evAttr: true },
  sub: { label: "Sub-theme", unit: "sub-theme", base: "agg", evAttr: true },
  src: { label: "Nguồn", unit: "nguồn", base: "agg" },
  cat: { label: "Category · intent", unit: "category", base: "ev", evAttr: true },
  sen: { label: "User Sentiment", unit: "sentiment", base: "ev", evAttr: true },
  /* `slice: true` — chiều thứ NĂM để cắt chart (owner chốt 05/08). Khác bốn chiều khách ở CHỖ ĐỌC:
     nền tảng nằm sẵn trên chính dòng bằng chứng (`e.pf`), không phải tra sang hồ sơ khách qua `ck`.
     Nên cắt theo nó còn CHẮC hơn cắt theo chiều khách — không dính phần ẩn danh lẫn phần nối hỏng.
     Đổi lại: chart nào có trục hàng là KHÁCH thì cắt theo nền tảng vô nghĩa (một khách không thuộc
     một nền tảng) — `qRunSplit` khoá đúng ca đó kèm lý do, không im lặng giấu chip đi. */
  pf: { label: "Nền tảng", unit: "nền tảng", base: "ev", evAttr: true, slice: true },
  /* `seg` (Segment khách) và `tenure` (Thâm niên giao dịch) đã RÚT khỏi danh sách chiều (S2, owner
     chốt 04/08, thiết kế output/thiet-ke-chart-signal.html §4: đúng 4 chiều khách + sigpf). Đo được
     trước khi rút: không chart nào dùng hai chiều này để cắt. RÚT CHIỀU, KHÔNG đụng dữ kiện khách —
     `Customer.seg`/`Customer.tenureMonths`, `CUST_CAT.seg`/`CUST_NUM.tenureMonths` và các entry
     `RAW_LABEL` tương ứng (data/rawFields.ts) vẫn giữ nguyên; hệ thống vẫn biết segment/thâm niên
     từng khách, chỉ không còn cắt chart theo chúng. */
  /* Bốn chiều khách — `slice: true` cùng với `pf` ở trên tạo đúng NĂM cách cắt owner đã chốt. */
  tier: { label: "Value tier", unit: "tier", base: "cust", slice: true, cut: { kind: "values", source: "tier" } },
  age: { label: "Độ tuổi", unit: "nhóm tuổi", base: "cust", slice: true, cut: { kind: "band", source: "ageYears" } },
  nav: { label: "Phân khúc NAV", unit: "phân khúc", base: "cust", slice: true, cut: { kind: "band", source: "navVnd" } },
  acq: { label: "Kênh mở TK", unit: "kênh", base: "cust", slice: true, cut: { kind: "values", source: "acq" } },
  /* Chiều thứ năm của chart điểm đo (thiết kế §4) — thuộc tính CỦA CHÍNH LẦN BẮN (nền tảng nó xảy
     ra), không phải của khách: `base:'fire'`, KHÔNG dùng lại `base:'ev'` như `pf` ở trên. `source`
     vẫn trỏ "pf" trong `cut` để tự tài liệu hoá "đọc field pf" nhưng phép cộng (projectSignalCounts)
     đọc THẲNG `pf` của lần bắn, không qua CUST_CAT/CUST_NUM — `cut.source` ở đây không được
     `rawFields.ts` diễn giải (danh mục đó chỉ có dữ kiện CỦA KHÁCH). `unit`/`label` KHÔNG có trong
     câu chốt gốc của owner ("dims.sigpf = { label:'Nền tảng', base:'fire', cut:{...} }") — Dim đòi
     `unit` bắt buộc nên tự quyết thêm, lấy đúng "nền tảng" như `dims.pf` vì cùng một khái niệm vật
     lý, chỉ khác chỗ đọc (lần bắn thay vì mẫu bằng chứng). */
  sigpf: { label: "Nền tảng", unit: "nền tảng", base: "fire", cut: { kind: "values", source: "pf" } },
};

/** Fixture 7 khách thật, nhãn nhóm ĐÃ CHIẾU theo `cfgDefault` + `dims`. Phải khai SAU cả hai (const
    không hoist) — đây là lý do khối này nằm dưới bảng khai chiều chứ không ngay sau `cfgDefault`.
    Mọi nơi import `seed` nhận nhãn do ranh giới sinh, không phải nhãn viết tay trong literal — cùng
    một phép chiếu mà MockRepository.getSnapshot() chạy với cfg hiện tại, nên fixture và runtime
    không thể lệch cách hiểu nhóm. */
export const seed: CxmData = projectCustomerBands(seedRaw, cfgDefault, dims);
