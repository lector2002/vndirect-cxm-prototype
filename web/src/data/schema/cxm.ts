import type { Obs } from './journey.ts';

export type IssueSt = 'detecting' | 'investigating' | 'fixing';
export type IssueSev = 'critical' | 'high' | 'medium';

export type IssuePri = {
  sev: number;
  aff: number;
  jc: number;
  rep: number;
  tr: number;
  reg: number;
  total: number;
};

export type IssueImp = {
  aff: number;
  rep: number;
  csat: number;
  churn: number;
  hv: number;
};

export type Issue = {
  id: string;
  title: string;
  step: string;
  metric: string;
  ins: string | null;
  act: string;
  sev: IssueSev;
  st: IssueSt;
  conf: number;
  ev: string[];
  plain: string;
  hyp: string;
  dec: string;
  pri: IssuePri;
  imp: IssueImp;
  cust: string[];
};

export type ActionAp = 'pending' | 'approved';
export type ActionCf = 'pending' | 'confirmed';
export type ActionDl = 'backlog' | 'released' | 'in-progress';
export type ActionIv = 'not-started' | 'monitoring' | 'validated';
/* Trạng thái khép vòng với khách của một action — máy trạng thái 3 bước, port đúng prototype:
   - 'blocked' : chưa kết luận được tác động → CHƯA ĐƯỢC PHÉP khép vòng.
   - 'ready'   : đã validated → được phép khép vòng nhưng CHƯA khép. Đây là nhóm mà chip
                 "N chờ khép vòng với khách" ở #/work đếm.
   - 'closed'  : đã khép vòng với khách.
   Bất biến do validate.ts:114 canh: `lc !== 'blocked'` ⇒ `iv === 'validated'`. Chú ý dạng của luật
   này — nó chỉ có nghĩa với type NHIỀU HƠN 2 giá trị, và chính nó là bằng chứng 'ready' vốn thuộc
   về đây; luật được viết cho 3 giá trị từ đầu.
   Lịch sử: type này từng CHỈ có 'blocked', nên mọi nhánh `lc === 'closed'` port từ prototype đều là
   code chết (tsc bắt "no overlap", phải bỏ điều kiện đi — xem TopPriorityBlock). Owner mở dần:
   'closed' ngày 02/08/2026 (kèm CXA-013 trong fixture), rồi 'ready' ngay sau khi đọc prototype
   `advance()` thấy nó set cả ba. Fixture KHÔNG có row 'ready' nào — đúng, vì action duy nhất đã
   validated (CXA-013) thì cũng đã closed; 'ready' là trạng thái phát sinh trong phiên qua advance(). */
export type ActionLc = 'blocked' | 'ready' | 'closed';

export type Action = {
  id: string;
  iss: string;
  title: string;
  owner: string;
  acc: string;
  due: string;
  ap: ActionAp;
  cf: ActionCf;
  dl: ActionDl;
  rel?: string;
  iv: ActionIv;
  lc: ActionLc;
  sm: string;
};

export type Verdict = 'improved' | 'inconclusive' | 'worse';

export type OutcomeMeasure = {
  v: number;
  u: string;
  p: string;
  n: number;
};

/* Ảnh chụp số liệu tại đúng lúc điểm gãy được XÁC NHẬN. Một issue tối đa MỘT snapshot — đóng băng
   một lần, không ghi đè: nếu cho sửa lại sau khi đã biết kết quả, mốc "trước" sẽ luôn có thể bị kéo
   về phía làm verdict đẹp hơn, và nó không còn là mốc so sánh trung thực nữa. Đây chính là lỗi mà
   module này sinh ra để sửa (đọc số "trước" SAU khi bản sửa đã release) — snapshot phải cứng ngay
   lúc ghi nhận vấn đề, không phải lúc verify mới quay lại tính. */
export type Snapshot = {
  iss: string;        // issue id
  at: string;         // dd/MM/yyyy — lúc đóng băng
  by: string;         // ai xác nhận
  m: OutcomeMeasure;  // chỉ số kết luận tại mốc; m.p là chuỗi KỲ, m.n là cỡ mẫu
  obs: Obs;           // ảnh chụp Obs của bước trong hành trình tại mốc (schema/journey.ts)
};

export type Outcome = {
  act: string;
  base: OutcomeMeasure;
  post: OutcomeMeasure;
  cohort: string;
  win: string;
  conf: string[];
  verdict: Verdict;
  by: string | null;
};

export type Loop = {
  iss: string;
  need: number;
  done: number;
  ch: string;
  by: string | null;
  sent: string | null;
};

export type AgeBand = '18-24' | '25-34' | '35-49' | '50+';
export type NavBand = '<50tr' | '50-200tr' | '200tr-1tỷ' | '1-5tỷ' | '>5tỷ';
export type TenureBand = '<6 tháng' | '6-24 tháng' | '2-5 năm' | '>5 năm';
export type AcqChannel = 'banner' | 'giới thiệu' | 'chi nhánh' | 'tự tìm' | 'đối tác';

/** Hai loại "không biết" — xem chú thích trong data/segment.ts. KHÔNG gộp làm một. */
export type SegUnknown = 'chưa-biết' | 'thiếu';

export type Customer = {
  key: string;
  seg: string;
  tier: string;
  pf: string;
  st: string;
  age: AgeBand | SegUnknown;
  /** NAV đọc TRỰC TIẾP từ giá trị tài sản hiện tại của khách (owner chốt 04/08: "NAV sẽ lấy trực
   *  tiếp từ giá trị tài sản hiện tại của KH nên ko thể có ko xác định"), nên luôn tính ra được:
   *  khách chưa mở xong TK hoặc mở xong mà chưa nạp tiền thì tài sản = 0đ ⇒ rơi vào dải thấp nhất
   *  '<50tr' (owner chốt dồn vào dải này, không thêm dải '0đ'). Hệ quả khi đọc chart: '<50tr' nghĩa
   *  là "chưa có hoặc còn rất ít tài sản" — phần lớn nhóm này là khách chưa nạp tiền, KHÔNG đọc
   *  thành "khách nhỏ đã đầu tư".
   *
   *  VẪN giữ `| SegUnknown` dù dữ liệu đúng thì không bao giờ dùng tới: điều owner nói là NAV luôn
   *  ĐỌC RA ĐƯỢC, không phải "lời gọi lấy tài sản không bao giờ thất bại". Nếu hẹp type xuống còn
   *  NavBand thì ngày pipeline tài sản trả về rỗng, mọi giá trị ghi được đều là lời nói dối — ghi
   *  '<50tr' là báo "khách không có tài sản" trong khi sự thật là "không đọc được số" (đúng cặp
   *  'chưa-biết' vs 'thiếu' mà data/segment.ts cấm gộp). Chốt: type CHO PHÉP biểu diễn ca đó,
   *  validate rule 19 COI NÓ LÀ LỖI phải đi sửa pipeline — chứ không âm thầm thành một dải NAV. */
  nav: NavBand | SegUnknown;
  tenure: TenureBand | SegUnknown;
  acq: AcqChannel | SegUnknown;
};
