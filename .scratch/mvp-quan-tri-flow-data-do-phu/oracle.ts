/* Oracle độc lập — đo lại số của HANDOFF-MVP-FLOW-COVERAGE.md §3 trên seed HÔM NAY.
   Suy lại từ dữ liệu, không đọc lại con số nào của handoff.

   CHẠY: `npx tsx ../.scratch/mvp-quan-tri-flow-data-do-phu/oracle.ts` từ thư mục `web/`.
   Đo lại mỗi khi seed đổi — số trong map.md phải là số của lần chạy gần nhất.
   KHÔNG đo được ở đây: kiểm kê "sửa được / chỉ đọc" của node 5 — cái đó quét bằng caller của
   `setCfg` + mutator của `store/store.ts`, không suy ra từ dữ liệu. */
import { seed, cfgDefault } from "../../web/src/data/fixtures/seed.ts";
import { flowHasSourceCitation, flowStepsCopied } from "../../web/src/domain/state.ts";

const d = seed;
const line = (s: string) => console.log(s);
const N = (n: number) => String(n);

line("=== 3.1 QUY MÔ ===");
line(`${N(d.phases.length)} phase · ${N(d.groups.length)} group · ${N(d.flows.length)} flow · ${N(d.steps.length)} bước · ${N(d.obs.length)} obs`);
line(`${N(d.touchpoints.length)} touchpoint · ${N(d.signals.length)} signal · ${N(d.sources.length)} nguồn · ${N(d.metrics.length)} chỉ số · ${N(d.surveys.length)} khảo sát`);
line(`asOf = ${d.asOf}`);

line("\n=== 3.2 FLOW — hai trục (schema mới, KHÔNG còn verified/observed) ===");
let cite = 0, copied = 0, both = 0, neither = 0, citeNoSteps = 0;
for (const f of d.flows) {
  const c = flowHasSourceCitation(f);
  const s = flowStepsCopied(f, d.steps);
  if (c) cite++;
  if (s) copied++;
  if (c && s) both++;
  if (!c && !s) neither++;
  if (c && !s) citeNoSteps++;
}
line(`có trích dẫn sơ đồ nguồn: ${N(cite)}/${N(d.flows.length)}`);
line(`đã chép bước:             ${N(copied)}/${N(d.flows.length)}`);
line(`cả hai:                   ${N(both)}`);
line(`CÓ trích dẫn, 0 bước:     ${N(citeNoSteps)}   <-- chỗ hổng câu 1`);
line(`không trích dẫn, 0 bước:  ${N(neither)}`);
const flowsWithSteps = d.flows.filter((f) => flowStepsCopied(f, d.steps));
line(`flow có bước: ${flowsWithSteps.map((f) => `${f.id}(${N(d.steps.filter((s) => s.flowId === f.id).length)})`).join(" · ")}`);
const stepsNoCite = d.flows.filter((f) => flowStepsCopied(f, d.steps) && !flowHasSourceCitation(f));
line(`đã chép bước nhưng KHÔNG trích dẫn nguồn: ${N(stepsNoCite.length)} [${stepsNoCite.map((f) => f.id).join(",")}]`);

line("\n=== 3.3 COVERAGE ===");
const covs = d.obs.map((o) => o.cov).sort((a, b) => a - b);
const med = covs.length % 2 ? covs[(covs.length - 1) / 2] : (covs[covs.length / 2 - 1] + covs[covs.length / 2]) / 2;
line(`cfg.step.covMin = ${N(cfgDefault.step.covMin)}`);
line(`obs.cov: n=${N(covs.length)} · min=${N(covs[0])} · max=${N(covs[covs.length - 1])} · median=${N(med)}`);
line(`bước DƯỚI ngưỡng: ${N(covs.filter((c) => c < cfgDefault.step.covMin).length)}/${N(covs.length)}`);
const stepIds = new Set(d.steps.map((s) => s.id));
const obsIds = new Set(d.obs.map((o) => o.stepId));
line(`obs trỏ vào bước không tồn tại: ${N(d.obs.filter((o) => !stepIds.has(o.stepId)).length)}`);
line(`bước KHÔNG có obs:              ${N(d.steps.filter((s) => !obsIds.has(s.id)).length)}`);
// mức flow / phase: có cộng lên được không, và cộng kiểu gì
const stepsByFlow = new Map<string, string[]>();
for (const s of d.steps) stepsByFlow.set(s.flowId, [...(stepsByFlow.get(s.flowId) ?? []), s.id]);
const covByStep = new Map(d.obs.map((o) => [o.stepId, o.cov]));
line("cov mức flow — ba cách cộng cho ra ba số khác nhau:");
for (const [fid, ss] of stepsByFlow) {
  const cs = ss.map((s) => covByStep.get(s) ?? NaN).filter((v) => !Number.isNaN(v));
  if (cs.length === 0) continue;
  const mean = cs.reduce((a, b) => a + b, 0) / cs.length;
  const worst = Math.min(...cs);
  const passRate = (cs.filter((c) => c >= cfgDefault.step.covMin).length / cs.length) * 100;
  line(`  ${fid.padEnd(14)} n=${N(cs.length)} trung bình=${mean.toFixed(1)} · thấp nhất=${N(worst)} · %bước đạt=${passRate.toFixed(0)}%`);
}

line("\n=== 3.4 ĐIỂM ĐO — hai thước ===");
const byStatus: Record<string, number> = {};
for (const s of d.signals) byStatus[s.st] = (byStatus[s.st] ?? 0) + 1;
line(Object.entries(byStatus).map(([k, v]) => `${k}=${N(v)}`).join(" · "));
const tpByStep = new Map<string, string[]>();
for (const t of d.touchpoints) tpByStep.set(t.stepId, [...(tpByStep.get(t.stepId) ?? []), t.id]);
const sigByTp = new Map<string, number>();
for (const s of d.signals) sigByTp.set(s.tpId, (sigByTp.get(s.tpId) ?? 0) + 1);
let withSig = 0;
const noSigSteps: string[] = [];
for (const st of d.steps) {
  const n = (tpByStep.get(st.id) ?? []).reduce((a, tp) => a + (sigByTp.get(tp) ?? 0), 0);
  if (n > 0) withSig++;
  else noSigSteps.push(st.id);
}
line(`bước CÓ ít nhất 1 điểm đo: ${N(withSig)}/${N(d.steps.length)}`);
line(`bước KHÔNG có điểm đo nào: ${N(noSigSteps.length)}/${N(d.steps.length)} -> [${noSigSteps.join(",")}]`);
const hiCovNoSig = noSigSteps.filter((s) => (covByStep.get(s) ?? 0) >= cfgDefault.step.covMin);
line(`bước cov >= ${N(cfgDefault.step.covMin)} MÀ 0 điểm đo: ${N(hiCovNoSig.length)} -> ${hiCovNoSig.map((s) => `${s}(${N(covByStep.get(s) ?? 0)})`).join(" ")}`);
const loCovWithSig = d.steps
  .filter((st) => !noSigSteps.includes(st.id) && (covByStep.get(st.id) ?? 100) < cfgDefault.step.covMin)
  .map((st) => `${st.id}(${N(covByStep.get(st.id) ?? 0)})`);
line(`bước cov < ${N(cfgDefault.step.covMin)} MÀ CÓ điểm đo: ${N(loCovWithSig.length)} -> ${loCovWithSig.join(" ")}`);
// touchpoint mồ côi
const tpIds = new Set(d.touchpoints.map((t) => t.id));
line(`signal trỏ vào touchpoint không tồn tại: ${N(d.signals.filter((s) => !tpIds.has(s.tpId)).length)}`);
line(`touchpoint KHÔNG có signal nào: ${N(d.touchpoints.filter((t) => !sigByTp.has(t.id)).length)}/${N(d.touchpoints.length)}`);

line("\n=== 3.4b ĐIỂM ĐO — trường mới sau ADR-001/003 ===");
line(`srcId === null (chưa nối nguồn):     ${N(d.signals.filter((s) => s.srcId === null).length)}/${N(d.signals.length)}`);
line(`instAt === null (chưa khai mốc cắm): ${N(d.signals.filter((s) => s.instAt === null).length)}/${N(d.signals.length)}`);
line(`values.length === 0:                 ${N(d.signals.filter((s) => s.values.length === 0).length)}/${N(d.signals.length)}`);
line(`vol === 0:                           ${N(d.signals.filter((s) => s.vol === 0).length)}/${N(d.signals.length)}`);
line(`seen === null:                       ${N(d.signals.filter((s) => s.seen === null).length)}/${N(d.signals.length)}`);
line(`metrics.length === 0 (không nuôi chỉ số nào): ${N(d.signals.filter((s) => s.metrics.length === 0).length)}/${N(d.signals.length)}`);

line("\n=== 3.5 NGUỒN ===");
for (const s of d.sources) {
  line(`${s.id.padEnd(12)} ${s.kind.padEnd(13)} vol=${N(s.vol).padStart(6)} lagH=${N(s.lagH).padStart(4)} last=${s.last} voice=${String(s.voice)} nuôi=[${s.metrics.join(",") || "—"}]`);
}
const metricIds = new Set(d.metrics.map((m) => m.id));
for (const s of d.sources) for (const m of s.metrics) if (!metricIds.has(m)) line(`  !! ${s.id} nuôi chỉ số không tồn tại: ${m}`);
const fedBy = new Map<string, string[]>();
for (const s of d.sources) for (const m of s.metrics) fedBy.set(m, [...(fedBy.get(m) ?? []), s.id]);
line(`chỉ số KHÔNG có nguồn nào nuôi: [${d.metrics.filter((m) => !fedBy.has(m.id)).map((m) => m.id).join(",") || "—"}]`);
line(`chỉ số CHỈ được nuôi bởi nguồn vol=0: [${d.metrics.filter((m) => { const ss = fedBy.get(m.id) ?? []; return ss.length > 0 && ss.every((sid) => (d.sources.find((x) => x.id === sid)?.vol ?? 0) === 0); }).map((m) => m.id).join(",") || "—"}]`);
line(`chỉ số có ÍT NHẤT MỘT nguồn vol=0: [${d.metrics.filter((m) => (fedBy.get(m.id) ?? []).some((sid) => (d.sources.find((x) => x.id === sid)?.vol ?? 0) === 0)).map((m) => m.id).join(",") || "—"}]`);

line("\n=== 3.6 CHỈ SỐ & NGƯỠNG (ngưỡng ở cfg.metric, KHÔNG ở Metric) ===");
for (const m of d.metrics) {
  const b = cfgDefault.metric[m.id];
  const gap = b ? Math.abs(b.watch - b.crit) : NaN;
  line(`${m.id.padEnd(10)} value="${m.value}" unit=${m.unit.padEnd(6)} grain=${m.grain.padEnd(8)} on=${String(b?.on)} watch=${N(b?.watch ?? NaN)} crit=${N(b?.crit ?? NaN)} khoảng=${N(gap)}`);
}
line(`chỉ số có band trong cfg: ${N(d.metrics.filter((m) => cfgDefault.metric[m.id] !== undefined).length)}/${N(d.metrics.length)}`);
line(`band trong cfg không có chỉ số: [${Object.keys(cfgDefault.metric).filter((k) => !metricIds.has(k)).join(",") || "—"}]`);
line(`chỉ số Metric.value không parse ra số: [${d.metrics.filter((m) => Number.isNaN(parseFloat(m.value))).map((m) => m.id).join(",") || "—"}]`);
