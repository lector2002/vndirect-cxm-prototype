export type Period = {
  id: string;
  label: string;
  range: string;
  factor: number;
};

export type Scope = {
  id: string;
  label: string;
};

export type Phase = {
  id: string;
  code: string;
  name: string;
};

export type Group = {
  id: string;
  phaseId: string;
  name: string;
  desc: string;
};

export type Flow = {
  id: string;
  groupId: string;
  name: string;
  owner: string;
  version: string;
  src: string;
  note: string;
};

export type Step = {
  id: string;
  flowId: string;
  code: string;
  name: string;
  stationId: string;
  owner: string;
};

export type Obs = {
  stepId: string;
  entered: number;
  completed: number;
  failed: number;
  effort: number;
  cov: number;
};

export type Touchpoint = {
  id: string;
  stepId: string;
  name: string;
  channel: string;
  owner: string;
  users: number;
  desc: string;
};

export type SignalSt = 'live' | 'designed' | 'gap' | 'validating';

export type Signal = {
  id: string;
  tpId: string;
  name: string;
  st: SignalSt;
  pf: string[];
  es: string;
  /** TỔNG lượt bắn CẢ ĐỜI điểm đo (bản khai) — KHÔNG phải lượt/ngày. Ràng buộc 1 của validate.ts
      (cả bản sigCounts lẫn bản hạt thô) ghim: đếm thẳng từ fires phải bằng đúng số này, mà fires
      demo rải từ `instAt` tới `asOf`, tức số này phủ toàn bộ lịch sử.

      Owner chốt 19/08: nhãn per-day/per-kỳ trên màn PHẢI đọc số đếm trong đúng timeframe đó —
      "Traffic per day" đọc `signalTraffic()` (domain/signalEval.ts, đếm `sigFires` trong cửa sổ),
      KHÔNG đọc field này. Field này chỉ còn hai việc hợp lệ: (a) mẫu đối chiếu của ràng buộc 1;
      (b) `vol > 0` = "đã instrument, có bắn" (isSignalRunning, D5 charter Module I) — một phát
      biểu CÓ/KHÔNG về cả đời, không phải một tốc độ. */
  vol: number;
  seen: string | null;
  /** Nguồn dữ liệu GIAO bản ghi của điểm đo này (`Source.id`), owner chốt 12/08 — lối (i) của §10c.
      `null` = CHƯA NỐI ĐƯỢC NGUỒN, không phải "không có nguồn": nó là ô trống chờ đội dữ liệu khai,
      và mọi chỗ đọc field này phải trả "chưa biết" chứ KHÔNG được rơi về "đang ổn" (cùng luật cấm
      trộn chưa-biết với thiếu ở `data/segment.ts`).

      Vì sao nối tới NGUỒN chứ không thêm `lastRecordAt` riêng cho từng điểm đo: nhịp giao và mốc
      giao là thuộc tính của LÔ dữ liệu, không phải của một event lẻ — nối vào nguồn thì độ tươi của
      điểm đo dùng lại đúng bậc thang `sourceHealth()` và đúng ô nhịp giao đã cấu hình ở #/rules,
      cả app chỉ còn MỘT thành ngữ độ tươi. Mốc máy sinh cho riêng từng điểm đo (§10c, `lastRecordAt`)
      vẫn là việc của đội dữ liệu và KHÔNG bị field này thay thế. */
  srcId: string | null;
  metrics: string[];
  desc: string;
  /** MỐC CẮM ĐO — ngày điểm đo này bắt đầu chạy, dạng `yyyy-MM-dd`. `null` = **chưa ai khai**.

      Đây là biên trái của "xương lịch" mà `projectSigTrend` cần (ADR-001 §6): mọi ngày TRƯỚC mốc này
      là trạng thái (3) *chưa đo* ⇒ **vắng mặt** khỏi chuỗi, tầng vẽ để trống. Mọi ngày TỪ mốc này
      trở đi mà không có lượt bắn nào là trạng thái (2) *đo được, không bắn* ⇒ **có mặt với `n = 0`**.
      Trộn hai thứ đó là tái phạm luật không-trộn-chưa-biết-với-thiếu.

      **KHÔNG được suy mốc này bằng `MIN(fire.at)`** (ADR-001 §6, bẫy đã ghi): điểm đo đã cắm nhưng
      im suốt tháng đầu sẽ bị đọc thành *chưa cắm*, tức xoá đúng cái biên mà ba trạng thái sinh ra để
      giữ. Phải là một trường khai riêng — nó thuộc **Bảng D** của bản yêu cầu dữ liệu, hiện CÒN TREO,
      nên fixture thật (`seed`) khai `null` cho cả 30 điểm đo. Demo Mode điền giá trị tất định.

      `null` không được rơi về "cắm từ đầu cửa sổ": chuỗi khi đó KHÔNG phân biệt được (2) với (3) nên
      chart phải nói ra là chưa khai mốc, không vẽ một đường đầy đủ trông như đã đo cả năm. */
  instAt: string | null;
  /** Danh sách giá trị RỜI RẠC mà chính điểm đo này bắn ra — khai bởi đội dữ liệu, KHÔNG quét ngược
      từ dữ liệu (thiết kế: output/thiet-ke-chart-signal.html §2, lỗ hổng A). Đây là cột của chart
      điểm đo. `vol > 0` (đã instrument, có bắn) → danh sách thật; `st:'gap'` hoặc `vol === 0`
      (chưa instrument / chưa implement) → mảng rỗng, không có cột nào để vẽ. */
  values: string[];
};
