import type { PriKey } from './cxm.ts';

// ----- CFG_DEFAULT -----

/** Ba mức của `jc` (mức quan trọng của bước) và `reg` (rủi ro pháp lý) — ADR-002 §5, §6. Thang ba
    mức chứ không phải số tự do: owner phải điền 24 lần, và "cao hơn một chút" giữa hai bước không
    phải phán đoán ai giữ được nhất quán qua 24 lần. */
export type StepLevel = 'low' | 'mid' | 'high';

export type CfgStep = {
  failWatch: number;
  failCrit: number;
  covMin: number;
  effortMax: number;
  /** Mức quan trọng của TỪNG BƯỚC, keyed theo `Step.id`. Thuộc tính của BƯỚC nên khai một lần cho
      mọi bước, không gõ lại theo từng điểm gãy — mọi điểm gãy trên cùng bước thừa hưởng, không có
      đường cho hai chỗ lệch nhau (ADR-002 §5).

      THIẾU ENTRY LÀ HỢP LỆ VÀ CÓ NGHĨA: `jc` của điểm gãy trên bước đó là *chưa tính được* (§9),
      **không có mặc định**. Một mặc định là phán đoán trá hình — "bước này quan trọng vừa" là câu
      khẳng định, không phải chỗ trống. Đây là chỗ khác biệt với `cfg.source` (thiếu entry rơi về
      một hằng): ở đó hằng là một CHÍNH SÁCH SLA chung hợp lý, ở đây không có cái tương đương. */
  jc: Record<string, StepLevel>;
  /** Rủi ro pháp lý / tuân thủ của TỪNG BƯỚC. Cùng khuôn `jc`, cùng luật thiếu-entry (ADR-002 §6).
      Giá đã biết trước khi chốt: hai điểm gãy trên cùng bước luôn cùng mức, kể cả khi một cái chạm
      KYC còn cái kia chỉ là giao diện. */
  reg: Record<string, StepLevel>;
};

export type CfgMetricBand = {
  on: boolean;
  watch: number;
  crit: number;
};

/* `anomalyX` và `repeatMin` ĐÃ BỎ 12/08 (owner quyết, handoff §6): hai field chưa từng có caller
   nào trong bản React — chỉ có ô nhập ở #/rules ghi vào chúng, không phép tính nào đọc ra. Nối vào
   phép tính thật thì cần dữ liệu chưa có (`anomalyX` đòi chuỗi volume theo ngày, `repeatMin` đòi log
   liên hệ theo chủ đề — cả hai nằm trong bản yêu cầu dữ liệu 6 mục, module-i charter §10). Giữ field
   mà không ai đọc là đúng bẫy "ô cấu hình mồ côi" của dự án: màn hứa một thứ nó không làm. Khi dữ
   liệu về thì khai lại cùng lúc với chỗ tiêu thụ, không khai trước. */
export type CfgData = {
  deadDays: number;
  cooldown: number;
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

/** Trọng số bảy khoá + mốc neo của điểm ưu tiên (ADR-002 §2, §3). Đây là chỗ owner sửa được trên
    `#/rules` nhóm 6 — lý do lối "pipeline tính sẵn điểm" bị bác: trọng số nằm ngoài `cfg` thì mỗi
    lần đổi là một ticket cho bên dữ liệu.

    `w` CỘNG LẠI ĐÚNG 100 (`data/validate.ts` canh) để trọng số tự đọc thành "khoá này chiếm bao
    nhiêu phần trăm quyết định". `norm` (chiếu số đo về 0..1) KHÔNG ở đây — nó cố định trong code
    (`data/priority.ts`), vì hình dạng phép chiếu là quyết định thiết kế, không phải ô vận hành. */
export type CfgPri = {
  w: Record<PriKey, number>;
  /** Mốc neo của ba khoá chiếu tuyến tính: giá trị nào của số đo thì `norm` chạm 1,0. Ở `cfg` chứ
      không hằng trong code vì "1.000 khách là nhiều" là một phán đoán về quy mô nghiệp vụ, đổi theo
      lô dữ liệu. `rep` neo theo `cfg.data.repeatWarn` (đã có), `sev`/`jc`/`reg` là bảng tra bậc. */
  anchor: {
    /** Số KHÁCH bị ảnh hưởng ứng với `norm = 1,0`. Trên mốc thì kẹp trần. */
    aff: number;
    /** Số khách GIÁ TRỊ CAO ứng với `norm = 1,0`. */
    hv: number;
    /** Thay đổi tương đối (%) ứng với `norm = 1,0`. `tr` âm được (đang đỡ) nên chiếu về [-1, 1]. */
    tr: number;
  };
};

/** "Khách giá trị cao" là gì — owner khai, KHÔNG chốt cứng trong code (ADR-002 §10).

    CẢNH BÁO ĐỘ CHẮC, đã ghi ở ADR và phải nhắc lại tại chỗ khai: hai chiều không cùng độ chắc.
    `nav` cắt ngưỡng nên nhãn dải SINH từ `cfg.segment.band.nav.cuts` — danh sách luôn đóng, luôn
    đủ. `tier` là string tự do, `cfg.segment.values` chưa có entry, `validate` không kiểm giá trị
    lạ ⇒ bộ chọn chỉ liệt kê được các giá trị TÌNH CỜ CÓ trong dữ liệu, và một lỗi gõ ở nguồn đẻ ra
    một "tier" mới mà không ai báo. Mặc định vì vậy là `nav`. */
export type CfgHv = {
  /** Id chiều khách trong `dims` (phải có `base:'cust'` và `cut`). */
  dim: string;
  /** Nhãn nhóm nào của chiều đó được coi là giá trị cao. Rỗng ⇒ `hv` là *chưa tính được*, không
      phải 0: "chưa khai ai là khách giá trị cao" khác "không có khách giá trị cao nào". */
  values: string[];
};

/** Ngưỡng đánh giá của MỘT điểm đo — keyed theo `Signal.id` ở `Cfg.signal` (owner chốt 19/08).
    Bốn kind, mỗi kind MỘT dụng cụ đo và MỘT chiều xấu — cố ý không cho một signal vừa rate vừa
    count: signal cần cả hai góc nhìn là dấu hiệu nên lên thành metric (tỉ lệ bắc cầu hai signal —
    fail ÷ attempts — là việc của `cfg.metric`, vd `m-ocr`; ngưỡng ở đây chỉ đọc lượt bắn của CHÍNH
    signal đó).

    `badRate` vs `goodRate` với signal hai giá trị là tương đương về toán (% fail tăng ≡ % success
    giảm) — chọn theo chiều fail-safe: `Signal.values` là bản khai và ĐƯỢC PHÉP chậm hơn dữ liệu
    (validate nhóm 22 đã gỡ luật kiểm), nên giá trị MỚI chưa khai rơi vào `badRate` được đếm là
    "tốt" (im lặng đúng lúc cần kêu), rơi vào `goodRate` thì pha loãng phần tốt (chuông reo).
    Liệt kê giá trị mình TIN → goodRate; liệt kê giá trị mình SỢ → badRate.

    `winDays` thiếu ⇒ `SIGNAL_WINDOW_DAYS_DEFAULT` (domain/signalEval.ts) — cùng khuôn
    `SOURCE_ALLOW_DAYS_DEFAULT`: một chính sách cửa sổ chung hợp lý, KHÔNG phải phán đoán trá hình.
    Cửa sổ theo SIGNAL là cấu hình; thứ bị cấm là cửa sổ theo MÀN (một signal hai trạng thái tuỳ
    màn đang mở — vi phạm đúng lý do signalStatus.ts tách file).

    `minN` (chỉ hai kind rate): số lượt tối thiểu trong cửa sổ để TÍNH tỉ lệ — dưới mức là
    *chưa đủ mẫu* (unknown có lý do riêng), không phải ok và cũng không báo động từ n=1. Thiếu = 1:
    đánh từ lượt bắn đầu tiên — chặn mẫu nhỏ là opt-in. */
export type CfgSignalBand =
  /** % lượt bắn mang giá trị trong `bad` / tổng lượt bắn trong cửa sổ — VƯỢT LÊN là xấu (warn < crit). */
  | { kind: 'badRate'; bad: string[]; minN?: number; winDays?: number; warn: number; crit: number }
  /** % lượt bắn mang giá trị trong `good` / tổng — TỤT XUỐNG là xấu (warn > crit, cùng họ floor). */
  | { kind: 'goodRate'; good: string[]; minN?: number; winDays?: number; warn: number; crit: number }
  /** SỐ LƯỢT trong cửa sổ — TỤT XUỐNG là xấu (warn > crit). Cho signal một-giá-trị: im lặng nghĩa
      là pipeline hỏng hoặc không ai vào. */
  | { kind: 'floor'; winDays?: number; warn: number; crit: number }
  /** SỐ LƯỢT trong cửa sổ — VƯỢT LÊN là xấu (warn < crit). `bad` (tuỳ chọn): chỉ đếm lượt mang giá
      trị này; thiếu = đếm tất (signal fail-reason: mỗi lượt bắn LÀ một ca hỏng, giảm là tin tốt nên
      floor sai chiều — ca hiếm-mà-nghiêm-trọng dùng kind này với winDays dài, không dùng badRate
      vì minN sẽ đè im đúng lúc cần kêu). */
  | { kind: 'ceiling'; bad?: string[]; winDays?: number; warn: number; crit: number };

export type Cfg = {
  step: CfgStep;
  /** ADR-002 §15: khai CÙNG LÚC với `data/priority.ts` và nhóm 6 mở khoá, không sớm hơn. */
  pri: CfgPri;
  hv: CfgHv;
  metric: Record<string, CfgMetricBand>;
  /** Nhịp giao của từng nguồn, keyed theo id nguồn: SỐ NGÀY dữ liệu nguồn được phép còn thiếu so
      với mốc số liệu `asOf` mà vẫn coi là "đang nhận". ĐƠN VỊ LÀ NGÀY — đổi 11/08 (owner, giải C5);
      trước đó là GIỜ và không ai đọc (`sourceHealth()` bỏ đọc field này 07/08 khi chuyển sang thước
      ngày, nên ô nhập ở #/rules gõ được mà không đổi được nhãn nào). Thiếu entry là HỢP LỆ — engine
      áp `SOURCE_ALLOW_DAYS_DEFAULT` (domain/state.ts), vì danh sách nguồn còn là bản tạm và một
      nguồn mới mở không được kéo theo lỗi khai báo. */
  source: Record<string, number>;
  /** Ngưỡng đánh giá từng điểm đo, keyed theo `Signal.id`. THIẾU ENTRY LÀ HỢP LỆ VÀ CÓ NGHĨA:
      điểm đo chưa đặt ngưỡng ⇒ trạng thái *chưa đánh giá* (unknown), KHÔNG rơi về ok — cùng luật
      thiếu-entry với `step.jc`/`step.reg`, KHÁC `source` (ở đó thiếu rơi về SLA chung hợp lý; ở
      đây không có ngưỡng chung hợp lý vì mỗi điểm đo đo một thứ khác nhau — đúng lý do nhóm
      "Signal thresholds" tồn tại). */
  signal: Record<string, CfgSignalBand>;
  data: CfgData;
  anomaly: CfgAnomaly;
  sub: Record<string, CfgSub>;
  segment: CfgSegment;
};

// ----- DIMS -----
/** `'fire'` thêm cho chart điểm đo (output/thiet-ke-chart-signal.html §4): thuộc tính CỦA CHÍNH LẦN
    BẮN (nền tảng), không phải của khách (`'cust'`) lẫn của bằng chứng VoC (`'ev'`) — một lần bắn
    chưa gắn được với khách vẫn có nền tảng, khác `'cust'` chết ngay khi chưa định danh. Mọi chỗ
    switch trên `base` phải xử lý biến thể này TƯỜNG MINH (ném lỗi hoặc trả rỗng có comment), không
    để rơi vào nhánh mặc định im lặng — xem domain/quantify.ts, domain/themeSegments.ts,
    design-system/QuantifyWidget.tsx (BASE_AXIS/BASE_NOUN, hai Record đã compile-error nếu thiếu). */
export type DimBase = 'agg' | 'ev' | 'cust' | 'fire';

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
  /** Chiều này dùng để CẮT chart khác (thanh "Chia màu theo" ở Quantify, picker trục của chart
      theme). Owner chốt 05/08 đúng NĂM chiều: bốn chiều khách + "Nền tảng" (thiết kế
      output/thiet-ke-chart-signal.html §4).

      Vì sao cần cờ này thay vì suy từ `base`: trước 05/08 hai màn tự đoán, và đoán KHÁC NHAU —
      Quantify lọc `base==='cust'` nên rụng mất "Nền tảng" (nó là `base:'ev'`, thuộc tính của chính
      dòng bằng chứng chứ không phải của khách), còn chart theme thì đóng cứng hai nút viết tay. Suy
      từ `base` cũng không cứu được: `base:'ev'` còn có `cat`/`sen` — hai chiều đó là ĐỀ TÀI của
      chart (trục hàng), không phải cách cắt. "Cắt được theo chiều nào" là một quyết định thiết kế,
      không suy ra được từ chỗ đọc dữ liệu, nên phải khai ra.

      Khai cờ này KHÔNG hứa mọi chart cắt được theo nó: có cắt được hay không vẫn do engine trả lời
      từng ca (`qRunSplit`, `themeAxisOptions`); chart nào không cắt được thì hiện chip KHOÁ kèm lý
      do, đúng luật "nói thẳng" của owner. */
  slice?: true;
};

// ----- Metric kind (for type-safe references) -----
export type MetricKind =
  | 'm-completion'
  | 'm-liveness'
  | 'm-contract'
  | 'm-ocr'
  | 'm-ces'
  | 'm-repeat';
