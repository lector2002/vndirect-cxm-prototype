export type { Period, Scope, Phase, Group, Flow, Step, Obs, Touchpoint, SignalSt, Signal } from './journey.ts';
export type { Metric, SourceKind, Source, SurveyStatus, SurveyState, Survey, TaxLv, TaxNode, Category, EvidenceKind, Evidence, VoiceInsight } from './voc.ts';
export type { IssueSt, IssueSev, IssuePri, IssueImp, Issue, ActionAp, ActionCf, ActionDl, ActionIv, ActionLc, Action, Verdict, OutcomeMeasure, Outcome, Snapshot, Loop, HistPoint, MetricHistory, Customer, AgeBand, NavBand, TenureBand, AcqChannel, SegUnknown } from './cxm.ts';
export type { ChartKind, ShowMark, SeriesMark, QuantifyView, StackMode, QuantifyShow, QuantifySeriesPoint, QuantifySeries, QuantifyItem, DashQuestion, DashSet, AgentKind, AgentFindingLane, AgentFinding, Agent } from './quantify.ts';
export type { CfgStep, CfgMetricBand, CfgData, CfgAnomaly, CfgSub, CfgBandAxis, CfgSegment, Cfg, DimBase, DimRow, DimCut, Dim, MetricKind } from './config.ts';
export type { NavItem, Meta, TourStop, Chip } from './ui.ts';
/* `SigCount` khai ở `../projectSignalCounts.ts` (tầng data/, KHÔNG ở schema/) theo đúng chủ ý của
   thiết kế chart điểm đo: type sống cạnh phép cộng sinh ra nó (projectBands.ts cũng không có type
   "hàng" riêng trong schema/), CxmData chỉ re-export để mọi consumer vẫn `import … from
   './schema/index.ts'` như các type khác — không phải ngoại lệ về CÁCH DÙNG, chỉ khác NƠI KHAI. */
export type { SigCount } from '../projectSignalCounts.ts';

import type { Period, Scope, Phase, Group, Flow, Step, Obs, Touchpoint, Signal } from './journey.ts';
import type { Metric, Source, Survey, TaxNode, Category, Evidence, VoiceInsight } from './voc.ts';
import type { Issue, Action, Outcome, Snapshot, Loop, MetricHistory, Customer } from './cxm.ts';
import type { QuantifyItem, DashSet, Agent } from './quantify.ts';
import type { SigCount } from '../projectSignalCounts.ts';

export type CxmData = {
  /** MỐC SỐ LIỆU — ngày dữ liệu tính đến, dạng "dd/mm/yyyy". Trước đây tồn tại NGẦM: cả ba
      `Period.range` (xem seed.ts) kết thúc cùng một ngày, gõ tay lặp lại ba lần trong chuỗi hiển
      thị. Khai một lần ở đây để người xem biết số trên màn là của ngày nào, không đọc nhầm thành
      "bây giờ" — đặc biệt quan trọng khi pipeline chạy T-1 (module-i-signal-registry-charter.md
      §12.3, §13). KHÔNG có luật nào ép `Period.range` khớp trường này (cố ý — xem charter §13). */
  asOf: string;
  periods: Period[];
  scopes: Scope[];
  phases: Phase[];
  groups: Group[];
  flows: Flow[];
  steps: Step[];
  obs: Obs[];
  touchpoints: Touchpoint[];
  signals: Signal[];
  metrics: Metric[];
  sources: Source[];
  surveys: Survey[];
  tax: TaxNode[];
  /** Category theo intent (complaint/help/improvement/praise) — TRỰC GIAO với taxonomy:
      taxonomy trả lời CÁI GÌ, cat trả lời KHÁCH ĐANG MUỐN GÌ. Key được `TaxNode.cat`
      (tầng theme) và `Evidence.cat` tham chiếu. */
  cats: Record<string, Category>;
  ev: Evidence[];
  ins: VoiceInsight[];
  iss: Issue[];
  act: Action[];
  out: Outcome[];
  snap: Snapshot[];
  loop: Loop[];
  /** Chuỗi lịch sử chỉ số TRƯỚC mốc đóng băng — xem MetricHistory (schema/cxm.ts). Fixture thật
      (seed) không mang dòng nào; demo.ts sinh tất định cho các issue có snapshot. */
  hist: MetricHistory[];
  cust: Customer[];
  qt: QuantifyItem[];
  dash: DashSet[];
  ag: Agent[];
  /** Năm bảng đếm của chart điểm đo — giá trị của MỘT signal × nhóm của MỘT chiều → bao nhiêu lần
      (xem data/projectSignalCounts.ts). Demo Mode TẮT ⇒ RỖNG là trạng thái TRUNG THỰC (chưa nhận
      được số đếm sẵn từ bên dữ liệu), không phải lỗi — chart điểm đo tự nói "chưa có dữ liệu", không
      vẽ rỗng giả vờ là 0 (cùng nguyên tắc với Signal.st==='gap'). */
  sigCounts: SigCount[];
};
