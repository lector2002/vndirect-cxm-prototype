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

/* Tham số CHIA của các chiều khách, keyed theo ID CHIỀU — không phải bốn field cứng `nav/age/
   tenure/acq` như bản trước. Đổi sang map là điều kiện để owner thêm được chiều mới: chiều thứ tư
   không có ô nào để ghi ranh giới thì màn "thêm chiều" chỉ là hứa suông.

   `band` và `values` TÁCH nhau vì hai kiểu chia có shape khác nhau. Bản trước nhét cả hai vào một
   object nên `acq` (`{ values }`) nằm lẫn giữa ba trục `{ min, cuts, unit }` — không lặp qua được,
   đúng chỗ mà docblock của data/projectBands.ts đã phải dặn "đừng gộp acq vào vòng lặp chung". */
export type CfgSegment = {
  /** Ranh giới của từng chiều CẮT NGƯỠNG: `band[<id chiều>]`. Chiều khai `kind:'band'` mà thiếu
      entry ở đây là LỖI KHAI BÁO, không phải mặc định — không có ranh giới thì không có nhóm nào,
      và một chart vẽ ra từ không-có-nhóm là chart rỗng im lặng. */
  band: Record<string, CfgBandAxis>;
  /** Danh sách giá trị hợp lệ của từng chiều LẤY NGUYÊN GIÁ TRỊ: `values[<id chiều>]`. Thiếu entry
      là HỢP LỆ — nghĩa là chưa chốt danh sách đóng cho chiều đó (seg/tier hôm nay), validate không
      kiểm giá trị lạ. Có entry rồi thì giá trị ngoài danh sách bị coi là lỗi dữ liệu. */
  values: Record<string, string[]>;
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

/* Khai báo CÁCH CHIA của một chiều khách (`base:'cust'`). Đây là chỗ owner sửa được; hai kiểu:

   - `band`  — cắt một dữ kiện DẠNG SỐ theo ranh giới. Ranh giới ở `cfg.segment.band[<id chiều>]`,
               nhãn nhóm SINH ra từ ranh giới (data/bands.ts), owner không gõ nhãn tay.
   - `values`— lấy nguyên giá trị của một dữ kiện DẠNG DANH MỤC.

   `source` trỏ vào DANH MỤC DỮ KIỆN ĐANG CÓ (data/rawFields.ts), không phải tên tự do: một chiều
   chỉ chia lại được dữ kiện hệ thống thật sự biết về khách. Owner định nghĩa cách chia, không tạo
   ra dữ liệu — muốn chiều "theo tỉnh thành" thì dữ liệu tỉnh thành phải về tới hồ sơ khách trước.
   Hệ quả có ích: nhiều chiều trỏ CÙNG một `source` là hợp lệ và có ca dùng thật (một bộ ranh giới
   NAV cho lãnh đạo, một bộ khác cho vận hành, cùng đọc một con số tài sản). */
export type DimCut =
  | { kind: 'band'; source: string }
  | { kind: 'values'; source: string };

export type Dim = {
  label: string;
  unit: string;
  base: DimBase;
  evAttr?: boolean;
  /** CHỈ có nghĩa với `base:'cust'`. Thiếu ⇒ chiều không đếm được, chart từ chối vẽ (không vẽ rỗng).
      Trục `base:'agg'`/`'ev'` đếm theo cấu trúc (taxonomy, thuộc tính bằng chứng) chứ không theo một
      dữ kiện của khách, nên không khai `cut` — xem ROW_BUILDERS ở domain/quantify.ts. */
  cut?: DimCut;
};

// ----- Metric kind (for type-safe references) -----
export type MetricKind =
  | 'm-completion'
  | 'm-liveness'
  | 'm-contract'
  | 'm-ocr'
  | 'm-ces'
  | 'm-repeat';
