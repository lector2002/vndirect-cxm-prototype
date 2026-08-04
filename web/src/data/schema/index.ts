export type { Period, Scope, Phase, Group, Flow, Step, Obs, Touchpoint, SignalSt, Signal } from './journey.ts';
export type { Metric, SourceKind, Source, SurveyStatus, SurveyState, Survey, TaxLv, TaxNode, Category, EvidenceKind, Evidence, VoiceInsight } from './voc.ts';
export type { IssueSt, IssueSev, IssuePri, IssueImp, Issue, ActionAp, ActionCf, ActionDl, ActionIv, ActionLc, Action, Verdict, OutcomeMeasure, Outcome, Snapshot, Loop, Customer, AgeBand, NavBand, TenureBand, AcqChannel, SegUnknown } from './cxm.ts';
export type { ChartKind, ShowMark, SeriesMark, QuantifyView, StackMode, QuantifyShow, QuantifySeriesPoint, QuantifySeries, QuantifyItem, DashQuestion, DashSet, AgentKind, AgentFindingLane, AgentFinding, Agent } from './quantify.ts';
export type { CfgStep, CfgMetricBand, CfgData, CfgAnomaly, CfgSub, CfgBandAxis, CfgSegment, Cfg, DimBase, DimRow, DimCut, Dim, MetricKind } from './config.ts';
export type { NavItem, Meta, TourStop, Chip } from './ui.ts';

import type { Period, Scope, Phase, Group, Flow, Step, Obs, Touchpoint, Signal } from './journey.ts';
import type { Metric, Source, Survey, TaxNode, Category, Evidence, VoiceInsight } from './voc.ts';
import type { Issue, Action, Outcome, Snapshot, Loop, Customer } from './cxm.ts';
import type { QuantifyItem, DashSet, Agent } from './quantify.ts';

export type CxmData = {
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
  cust: Customer[];
  qt: QuantifyItem[];
  dash: DashSet[];
  ag: Agent[];
};
