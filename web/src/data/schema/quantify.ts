/* Kiểu VẼ (mark), tách theo kind — chốt 03/08 sau khảo sát nền tảng tạo chart.

   Trước đổi này cả hai kind dùng chung một `ChartKind`, nên type CHO PHÉP hai tổ hợp không có đường
   render nào: `{kind:'show', chart:'trend'}` (ảnh chụp một chiều mà đòi vẽ đường thời gian) và
   `{kind:'series', chart:'donut'}`. Chúng chỉ bị chặn lúc chạy, không phải lúc biên dịch.

   Đây mới là chỗ sai — KHÔNG phải bản thân vách `show`/`series`. Vega-Lite tách `mark` khỏi `data`
   đúng vì lý do này, và nó vẫn GIỮ phân biệt kiểu dữ liệu (temporal/nominal) chứ không xoá đi. Phép
   thử để không hợp nhất phẳng hai kind: tách mark giữ nguyên chữ ký cả bốn hàm `qRun*` (đều nhận
   `QuantifyShow`), còn hợp nhất phẳng buộc dispatch lại theo hình dạng encoding — tức mở lại phần
   hạch toán known/unknown/missing đang gánh bất biến "mẫu số không lặng lẽ loại nhóm chưa biết", mà
   không được thêm khả năng nào.

   Đã đếm trên seed.ts trước khi tách: `rank` 13 + `donut` 1 đều là `kind:'show'`; `trend` 2 +
   `cohort` 2 + `anomaly` 1 đều là `kind:'series'` ⇒ phân hoạch SẠCH, không cần migration, không đổi
   literal nào. */
export type ShowMark = 'rank' | 'donut';
export type SeriesMark = 'trend' | 'cohort' | 'anomaly';
/** Hợp của hai bộ mark. Giữ lại cho chỗ phải nói về mark mà CHƯA narrow theo kind — hiện là bộ lọc
    "kiểu chart" ở `quantifyFilter.ts` (lọc trên cả hai kind cùng lúc). ĐỪNG dùng nó cho field `chart`
    của một kind cụ thể: làm vậy là quay lại đúng chỗ vừa sửa. */
export type ChartKind = ShowMark | SeriesMark;

export type QuantifyView = 'chart' | 'table';

/* Cách xếp các đoạn màu của breakdown (Module D section 1, owner chốt 03/08).
   - 'abs' (MẶC ĐỊNH khi `stack` vắng): bề rộng thanh vẫn ∝ giá trị hàng, đoạn màu chia trong phần
     fill đó ⇒ giữ được SỐ TUYỆT ĐỐI, thứ mà dòng "Phủ X%" dưới chart đang dựa vào.
   - 'pct': mọi thanh dài bằng nhau, đoạn màu = tỷ trọng trong hàng ⇒ so HÌNH DẠNG giữa các hàng dễ
     hơn, nhưng ĐÁNH MẤT so sánh độ lớn giữa các hàng. Đây là mất mát thật, có chủ đích, nên nhãn
     trục đáy phải nói rõ (QuantifyWidget) — không được để người xem tưởng thanh dài bằng nhau
     nghĩa là các nhóm bằng nhau. */
export type StackMode = 'abs' | 'pct';

// ----- Show item (single metric display) -----
export type QuantifyShow = {
  id: string;
  kind: 'show';
  name: string;
  show: string;
  metric: string;
  chart: ShowMark;
  by?: string;
  /* Chiều CHIA MÀU trong thanh (breakdown — tiêu chí 2 của owner: "chia thành các segment màu nhỏ
     trong bar như tuổi/nav"). Khoá của `dims`, KHÔNG phải `by`: `by` mang nghĩa "ghép chéo trên mẫu
     evidence" và nghĩa đó đã ăn vào qRunCross/CrossTable/validate rule 16 + hai guard builder — mượn
     nó là phá đúng ba chốt đó. Hai field LOẠI TRỪ NHAU (quy tắc Looker Studio: một chart không vừa
     ghép chéo vừa chia màu), validate rule 16 chặn.
     Điều kiện để chia màu là phép đếm THẬT (cập nhật 05/08 — bản trước ghi "chỉ base:'cust' × cust,
     trục agg/ev là section 2", hẹp hơn thực tế):
     - `cust` × `cust` — hai field trên cùng một dòng `Customer`, group-by hai chiều là đếm thuần.
     - `ev`   × `cust` — thanh đếm dòng `Evidence`, mà `ck` (khoá khách) là trường BẮT BUỘC nên nối
       sang `Customer` rồi đếm cũng là đếm thật. Đo 05/08: 1.501/1.641 dòng nối được.
     - `agg`  × bất kỳ — KHÔNG, và lý do KHÔNG phải thiếu khoá khách: số trên thanh agg là tổng hợp
       sẵn (`TaxNode.n`/`Source.vol`), không đếm từ bằng chứng, nên chia màu nó là bịa tỷ lệ. */
  split?: string;
  /** Chỉ có nghĩa khi có `split`. Vắng ⇒ 'abs'. Xem StackMode. */
  stack?: StackMode;
  view?: QuantifyView;
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
  chart: SeriesMark;
  dim: string;
  unit: string;
  shown: number;
  total: number;
  t: QuantifySeriesPoint[];
  by?: undefined;
  /* Cùng lý do `by?: undefined` đã có ở đây: khai tường minh là `undefined` để union QuantifyItem
     narrow được, và để `item.split` đọc trên QuantifyItem không lỗi type. Series là chuỗi thời gian
     nhiều đường — breakdown trong thanh không áp dụng (vách show/series, ngoài phạm vi section này). */
  split?: undefined;
  stack?: undefined;
  view?: QuantifyView;
};

export type QuantifyItem = QuantifyShow | QuantifySeries;

// ----- Dashboard -----
/* 18/08 tối (owner "sweep nốt note/sub"): field `note` (nhận định về chart, chỉ còn hiện ở
   QuantifyDetail từ 03/08) và `sub` (phụ đề câu hỏi — KHÔNG màn nào render từ khi port) XOÁ HẲN
   khỏi schema + fixture. `note` của Flow/Source KHÔNG thuộc đợt này — đó là dữ liệu nghiệp vụ. */
export type DashQuestion = {
  q: string;
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