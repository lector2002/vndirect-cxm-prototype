export { fx, esc, BASE_FACTOR } from "./format.ts";
export { scopeSources, scopeTotal } from "./scope.ts";
export { PILOT_PHASE_CODES, isPilotPhase, phaseIdOfFlow, phaseLockReason, lockReasonForPhase } from "./pilotScope.ts";
export {
  evidenceAtStep,
  sentimentAtStep,
  themeRowsAtStep,
  intentRowsAtStep,
  voiceCountAtPhase,
  phaseTaxNode,
  coverageGapLine,
  phaseLockNote,
  quietButVoicedSteps,
} from "./vocJourney.ts";
export type { StepThemeRow } from "./vocJourney.ts";
export {
  sourcesByProblem,
  unhealthySources,
  freshnessCount,
  continuityCount,
  instrumentedCount,
  passiveActive,
  brokenImpacts,
  metricsAtRisk,
  ownersAtRisk,
  lagText,
  evidenceOfSource,
  senBucket,
  distByIntent,
  distBySentiment,
  distByPlatform,
  distByTheme,
  distByPhase,
  surveyCounts,
  surveysByProblem,
} from "./sources.ts";
export type { IntegrityCount, BrokenImpact } from "./sources.ts";
export { zScores, isAnomaly, countAnomalies } from "./stats.ts";
export { stepState, stepWhy, metricState, sourceHealth, laneOf } from "./state.ts";
export type { DerivedState, SourceHealth, LaneKey } from "./state.ts";
export { getPrimaryAction, advanceAction, advanceBlockedReason } from "./loop.ts";
export type { LoopStageKey, PrimaryAction } from "./loop.ts";
export { qRun, qRunCross, PF_LABEL } from "./quantify.ts";
export type { CrossAxisRow, QuantifyCrossResult } from "./quantify.ts";
export { signalChart } from "./signalChart.ts";
export type { SignalChart, SigGroup, SigCol, SigSlice, SigUnknown, DimState, SigNote } from "./signalChart.ts";
export { buildSearchIndex, queryIndex } from "./search.ts";
export type { SearchKind, SearchEntry } from "./search.ts";
export { themeSegments, themeAxisOptions, themeLegend, SUBTHEME_AXIS } from "./themeSegments.ts";
export type { ThemeAxis, ThemeSegment, ThemeAxisOption } from "./themeSegments.ts";
