export type ChartKind = 'rank' | 'anomaly' | 'trend' | 'donut' | 'cohort';

export type QuantifyView = 'chart' | 'table';

// ----- Show item (single metric display) -----
export type QuantifyShow = {
  id: string;
  kind: 'show';
  name: string;
  show: string;
  metric: string;
  chart: ChartKind;
  by?: string;
  view?: QuantifyView;
  note?: string;
};

// ----- Series item (time-series / cohort) -----
export type QuantifySeriesPoint = {
  l: string;
  p: number[];
};

export type QuantifySeries = {
  id: string;
  kind: 'series';
  name: string;
  chart: ChartKind;
  dim: string;
  unit: string;
  shown: number;
  total: number;
  t: QuantifySeriesPoint[];
  note?: string;
  by?: undefined;
  view?: QuantifyView;
};

export type QuantifyItem = QuantifyShow | QuantifySeries;

// ----- Dashboard -----
export type DashQuestion = {
  q: string;
  sub: string;
  b: string[];
};

export type DashSet = {
  id: string;
  sec: string;
  name: string;
  role: string;
  shared: boolean;
  owner: string;
  up: string;
  def?: boolean;
  desc: string;
  qs: DashQuestion[];
};

// ----- Agent & Findings -----
export type AgentKind = 'quality-monitor' | 'escalation' | 'newsfeed';

export type AgentFindingLane = 'pipeline' | 'behaviour' | 'voice' | null;

export type AgentFinding = {
  id: string;
  lane: AgentFindingLane;
  sev: string;
  at: string;
  title: string;
  detail: string;
  ev: string[];
};

export type Agent = {
  id: string;
  kind: AgentKind;
  name: string;
  st: 'on';
  last: string;
  purpose: string;
  f: AgentFinding[];
};