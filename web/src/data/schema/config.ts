// ----- CFG_DEFAULT -----
export type CfgStep = {
  failWatch: number;
  failCrit: number;
  covMin: number;
  effortMax: number;
};

export type CfgMetricBand = {
  on: boolean;
  watch: number;
  crit: number;
};

export type CfgData = {
  deadDays: number;
  anomalyX: number;
  cooldown: number;
  repeatMin: number;
  repeatWarn: number;
  churnWarn: number;
};

export type CfgAnomaly = {
  z: number;
};

export type CfgSub = {
  f: string;
  ch: string;
};

export type Cfg = {
  step: CfgStep;
  metric: Record<string, CfgMetricBand>;
  source: Record<string, number>;
  data: CfgData;
  anomaly: CfgAnomaly;
  sub: Record<string, CfgSub>;
};

// ----- DIMS -----
export type DimBase = 'agg' | 'ev' | 'cust';

export type DimRow = {
  id: string;
  l: string;
  v: number;
  c?: string;
};

export type Dim = {
  label: string;
  unit: string;
  base: DimBase;
  evAttr?: boolean;
  rows: DimRow[];
};

// ----- Metric kind (for type-safe references) -----
export type MetricKind =
  | 'm-completion'
  | 'm-liveness'
  | 'm-contract'
  | 'm-ocr'
  | 'm-ces'
  | 'm-repeat';
