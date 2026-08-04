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

/** Một trục dải số (nav/age/tenure) — nguồn DUY NHẤT của ranh giới dải (module E, owner chốt
    04/08: "nguồn trong setting sẽ là source of truth"). Nhãn dải KHÔNG khai ở đây, luôn SINH từ
    `cuts` qua `data/bands.ts` — khai nhãn tay là đường owner đã từ chối, vì nhãn sẽ có thể nói
    khác cut. */
export type CfgBandAxis = {
  /** Sàn của dải đầu. null => dải đầu là '<cut1' (nav, tenure, không có sàn tự nhiên). 18 =>
      dải đầu là '18-24' (age, có sàn tự nhiên là tuổi tối thiểu tính). */
  min: number | null;
  /** Ranh giới, TĂNG DẦN nghiêm ngặt, không trùng. n cut => n+1 dải. Biên dưới đóng, trên mở. */
  cuts: number[];
  unit: 'đ' | 'năm' | 'tháng';
};

export type CfgSegment = {
  nav: CfgBandAxis;
  age: CfgBandAxis;
  tenure: CfgBandAxis;
  /** acq là categorical (kênh mở TK) — danh sách tên, không có cut, không có min/unit. */
  acq: { values: string[] };
};

export type Cfg = {
  step: CfgStep;
  metric: Record<string, CfgMetricBand>;
  source: Record<string, number>;
  data: CfgData;
  anomaly: CfgAnomaly;
  sub: Record<string, CfgSub>;
  segment: CfgSegment;
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
