import type { Obs } from './journey.ts';

export type IssueSt = 'detecting' | 'investigating' | 'fixing';
export type IssueSev = 'critical' | 'high' | 'medium';

/* BẢY khoá của điểm ưu tiên (ADR-002 §11). Điểm KHÔNG còn nằm trong dữ liệu: `Issue.pri` đã bỏ
   14/08 cùng cả `IssuePri` — dữ liệu chỉ mang SỐ ĐO, `data/priority.ts` chiếu thành điểm, trọng số
   và mốc neo ở `cfg.pri` (ADR-002 §1, §2). Ai cần điểm thì gọi `issueScore()`, không đọc field. */
export type PriKey = 'sev' | 'aff' | 'jc' | 'rep' | 'tr' | 'reg' | 'hv';

/* `aff`, `hv`, `csat` ĐÃ BỎ 14/08:
   - `aff`/`hv` chuyển thành SỐ ĐO tính được (`issueScore().x`), vì để chúng lại đây là giữ một số
     gõ tay chạy song song với chính con số công thức đang tính — đúng lệch mà ADR-002 §16 đo được
     (`CXI-024` khai `imp.aff = 730` bằng đúng `obs.s1.failed`, `CXI-021` khai 312 trên 2650).
   - `csat` mất chỗ tiêu thụ cuối cùng khi card "Top theo tác động CES" bị bỏ (ADR-002 §12); theo
     luật không-khai-schema-trước-chỗ-tiêu-thụ thì nó rút luôn, không nằm lại làm field mồ côi.
   `rep`/`churn` Ở LẠI: chúng là số đếm riêng của nhóm cảnh báo (`AlertGroup`), không phải khoá của
   công thức ưu tiên — `pri.rep` là một phép đo khác và đang treo (ADR-002 §7). */
export type IssueImp = {
  rep: number;
  churn: number;
};

/** Điểm gãy này ứng với GIÁ TRỊ nào của điểm đo nào (ADR-002 §16) — đường duy nhất để đo `aff` là
    "bao nhiêu KHÁCH gặp phải", thay cho `obs.failed` của cả bước (ba điểm gãy trên `s3` đang nhận
    cùng một con số vì lấy theo bước). `null` = CHƯA MAP, không phải "không ứng với giá trị nào":
    `aff` khi đó là *chưa tính được*, không phải 0. Nhiều giá trị ⇒ `aff` là HỢP của các tập khách,
    không phải tổng lượt bắn (cộng dồn là đếm trùng khách gặp hai lý do). */
export type IssueSigMap = {
  sig: string;
  vals: string[];
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
  sigMap: IssueSigMap | null;
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

/* Chuỗi lịch sử chỉ số TRƯỚC mốc đóng băng (module-b-issue-charter.md, section B1, quyết định #2/#3).
   Chỉ chứa các kỳ TRƯỚC — điểm đóng băng (Snapshot.m) và điểm SAU (Outcome.post) là số THẬT đã có ở
   nơi khác; domain/ (section B2) nối lại, KHÔNG sinh thêm. Một issue tối đa MỘT dòng (validate.ts
   nhóm 23, luật 2). */
export type HistPoint = { p: string; v: number };
export type MetricHistory = {
  iss: string;        // khoá issue — validate.ts nhóm 23 canh tồn tại trong data.iss
  u: string;          // đơn vị — phải khớp Snapshot.m.u của cùng issue
  pre: HistPoint[];   // các kỳ TRƯỚC mốc đóng băng, theo thứ tự thời gian (cũ → mới)
  demo: boolean;      // cờ minh hoạ — UI đọc cờ này, KHÔNG hardcode trong component
};

export type AgeBand = '18-24' | '25-34' | '35-49' | '50+';
export type NavBand = '<50tr' | '50-200tr' | '200tr-1tỷ' | '1-5tỷ' | '5tỷ+';
export type TenureBand = '<6 tháng' | '6-24 tháng' | '2-5 năm' | '5 năm+';
export type AcqChannel = 'banner' | 'giới thiệu' | 'chi nhánh' | 'tự tìm' | 'đối tác';

/** Hai loại "không biết" — xem chú thích trong data/segment.ts. KHÔNG gộp làm một. */
export type SegUnknown = 'chưa-biết' | 'thiếu';

export type Customer = {
  key: string;
  seg: string;
  tier: string;
  pf: string;
  st: string;

  /* ---- GIÁ TRỊ THÔ: cái khách hàng THẬT SỰ có. Nguồn duy nhất của ba nhãn dải bên dưới. ----
     Ba trục phân dải (age/nav/tenure) lưu SỐ, không lưu nhãn: nhãn phụ thuộc `cfg.segment[trục].cuts`
     mà owner sửa được ở màn #/rules, nên lưu nhãn là đóng băng một lần cắt vào dữ liệu — sửa cut sau
     đó không đổi được gì (đúng lỗi đo được 04/08: `bandOf` không có consumer nào trong production,
     `cuts` không điều khiển chart nào). Nhãn được CHIẾU lúc đọc, xem data/projectBands.ts. */

  /** Tuổi thật (số năm). `SegUnknown` khi hành trình chưa tới chỗ biết ngày sinh (chưa qua bước 02
   *  chụp CCCD/VNeID) — 'chưa-biết' theo quy luật, khác 'thiếu' do bug thu thập. */
  ageYears: number | SegUnknown;
  /** Tài sản hiện tại (VNĐ). Đọc TRỰC TIẾP từ giá trị tài sản của khách (owner chốt 04/08: "NAV sẽ
   *  lấy trực tiếp từ giá trị tài sản hiện tại của KH nên ko thể có ko xác định"), nên luôn tính ra
   *  được: khách chưa mở xong TK hoặc mở xong mà chưa nạp tiền thì tài sản = **0**, không phải
   *  sentinel. Hệ quả khi đọc chart: dải thấp nhất nghĩa là "chưa có hoặc còn rất ít tài sản" —
   *  phần lớn nhóm này là khách chưa nạp tiền, KHÔNG đọc thành "khách nhỏ đã đầu tư".
   *
   *  VẪN giữ `| SegUnknown` dù dữ liệu đúng thì không bao giờ dùng tới: điều owner nói là NAV luôn
   *  ĐỌC RA ĐƯỢC, không phải "lời gọi lấy tài sản không bao giờ thất bại". Nếu hẹp type xuống còn
   *  `number` thì ngày pipeline tài sản trả về rỗng, mọi giá trị ghi được đều là lời nói dối — ghi 0
   *  là báo "khách không có tài sản" trong khi sự thật là "không đọc được số" (đúng cặp 'chưa-biết'
   *  vs 'thiếu' mà data/segment.ts cấm gộp). Chốt: type CHO PHÉP biểu diễn ca đó, validate rule 19
   *  COI NÓ LÀ LỖI phải đi sửa pipeline — chứ không âm thầm thành 0đ. */
  navVnd: number | SegUnknown;
  /** Thâm niên quan hệ (số tháng). `SegUnknown` khi chưa mở xong TK — chưa có mốc nào để tính. */
  tenureMonths: number | SegUnknown;

  /* ---- NHÃN NHÓM: PHÁI SINH, do data/projectBands.ts điền từ số thô + ranh giới của từng chiều. ----
     MAP theo id chiều, không phải ba ô cố định `age`/`nav`/`tenure` như bản trước. Đổi sang map vì
     ba ô cố định là trần cứng của việc owner thêm chiều: chiều thứ tư anh khai ra không có ô nào để
     ghi nhãn, và mỗi chiều thêm sau đó lại là một lần sửa type này — đúng cái hardcode cần bỏ.
     Hệ quả có ích: hai chiều cắt cùng một số thô theo hai bộ ranh giới khác nhau cùng tồn tại được
     (`bands['nav-5nhom']` và `bands['nav-tach-chua-nap']`), việc mà ba ô cố định không làm được.

     `string` chứ không phải union đóng (AgeBand/NavBand/TenureBand): nhãn do ranh giới sinh ra
     (data/bands.ts, bất biến E-c) nên owner đổi ranh giới là ra nhãn chưa có trong bất kỳ union nào.
     Bất biến: `bands[id]` luôn bằng `bandOf(<số thô của chiều>, cfg.segment.band[id])`, validate
     nhóm 19 canh không cho lệch. Sentinel của số thô đi qua nguyên vẹn (bandOf trả lại chính nó) —
     không nhóm nào hấp thụ nó.

     Khách CHƯA đi qua phép chiếu có `bands` rỗng (hoặc chỉ mang nhãn fixture khai làm CHỦ Ý, xem
     data/fixtures/demo.ts). Không đọc `bands` để suy ra khách thuộc nhóm nào ngoài tầng `data/` —
     đường đọc chuẩn là getter chiều khách ở domain/quantify.ts. */
  bands: Record<string, string | SegUnknown>;

  /** Kênh mở TK — dữ kiện DẠNG DANH MỤC (`cfg.segment.values['acq']`), không có ranh giới nên không
      đi qua phép chiếu nhóm: giá trị lưu thẳng, không có số thô nào phía sau. */
  acq: AcqChannel | SegUnknown;
};
