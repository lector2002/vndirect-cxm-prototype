export type Metric = {
  id: string;
  name: string;
  value: string;
  target: string;
  unit: string;
  grain: string;
  formula: string;
  source: string;
  freshness: string;
  owner: string;
};

export type SourceKind = 'event' | 'case' | 'survey' | 'store-review' | 'broker-note' | 'chat';

export type Source = {
  id: string;
  name: string;
  kind: SourceKind;
  vol: number;
  lagH: number;
  last: string;
  metrics: string[];
  pf: string[];
  voice: boolean;
  note: string;
};

export type SurveyStatus = 'running' | 'draft' | 'paused';
export type SurveyState = 'ok' | 'watch' | 'unknown';

export type Survey = {
  id: string;
  name: string;
  type: string;
  trigger: string;
  cond: string;
  cd: number;
  scale: string;
  target: string;
  latest: string;
  rr: number;
  n: number;
  status: SurveyStatus;
  state: SurveyState;
};

export type TaxLv = 'L1' | 'L2' | 'L3' | 'theme' | 'subtheme';

/* Node taxonomy. `why`/`up`/`by` là PROVENANCE — bắt buộc trên mọi node (đo trên prototype:
   50/50 node đều có), đúng kỷ luật "mỗi node phải nói được vì sao nó tồn tại".
   `cat`/`pts` chỉ có ở tầng `theme` (14/14) nên optional trong type, nhưng validateFixture
   nhóm 8 bắt buộc chúng cho lv='theme'. */
export type TaxNode = {
  id: string;
  lv: TaxLv;
  name: string;
  parentId: string;
  n: number;
  /** Lý do node này tồn tại / cách gán — provenance, không phải mô tả marketing. */
  why: string;
  /** Ngày cập nhật gần nhất, format dd/mm/yyyy. */
  up: string;
  /** Ai cập nhật (người hoặc agent). */
  by: string;
  /** Intent chủ đạo (key trong CxmData.cats) — CHỈ tầng theme. */
  cat?: string;
  /** Chuỗi kỳ gần nhất (12 kể từ S2.7/D8a), dùng cho sparkline + phát hiện Z-score — CHỈ tầng
      theme. Số kỳ HIỂN THỊ là runtime theo bộ lọc 3/6/12 tháng, không đóng cứng ở đây. */
  pts?: number[];
  drift?: string;
  /** Diễn giải cụ thể của drift — luôn đi kèm `drift`. */
  driftNote?: string;
  /** true = seed tổng hợp CÓ NHÃN "demo", không phải phép đo thật. */
  demo?: boolean;
  maps?: string | null;
};

export type Category = {
  label: string;
  color: string;
};

export type EvidenceKind = 'event' | 'case' | 'survey-response' | 'verbatim';

export type Evidence = {
  id: string;
  kind: EvidenceKind;
  src: string;
  ref: string;
  at: string;
  step: string;
  pf: string;
  cat: string;
  sen: number;
  shift: number;
  q: string;
  sig: string;
  ck: string;
  tax: string[];
  why: string;
};

export type VoiceInsight = {
  id: string;
  theme: string;
  step: string | null;
  src: string[];
  n: number;
  pos: number;
  trend: number;
  pts: number[];
  seg: string[];
  ev: string[];
  owner: string;
  rec: string;
  hoEl: boolean;
  hoWhy: string;
  hoIssue?: string;
};
