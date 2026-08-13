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
  /** Danh sách giá trị RỜI RẠC mà chính điểm đo này bắn ra — khai bởi đội dữ liệu, KHÔNG quét ngược
      từ dữ liệu (thiết kế: output/thiet-ke-chart-signal.html §2, lỗ hổng A). Đây là cột của chart
      điểm đo. `vol > 0` (đã instrument, có bắn) → danh sách thật; `st:'gap'` hoặc `vol === 0`
      (chưa instrument / chưa implement) → mảng rỗng, không có cột nào để vẽ. */
  values: string[];
};
