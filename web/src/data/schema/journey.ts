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
  verified: boolean;
  observed: boolean;
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
  metrics: string[];
  desc: string;
  /** Danh sách giá trị RỜI RẠC mà chính điểm đo này bắn ra — khai bởi đội dữ liệu, KHÔNG quét ngược
      từ dữ liệu (thiết kế: output/thiet-ke-chart-signal.html §2, lỗ hổng A). Đây là cột của chart
      điểm đo. `vol > 0` (đã instrument, có bắn) → danh sách thật; `st:'gap'` hoặc `vol === 0`
      (chưa instrument / chưa implement) → mảng rỗng, không có cột nào để vẽ. */
  values: string[];
};
