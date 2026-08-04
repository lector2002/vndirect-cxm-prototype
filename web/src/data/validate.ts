import type { CxmData, Dim, NavItem, TourStop, Cfg } from "./schema/index.ts";
import type { Step, Metric, Evidence, Issue, Action, Source, Survey, VoiceInsight, QuantifyItem, DashSet, Flow, Customer, Outcome, Snapshot, Group, Phase, Agent, TaxNode } from "./schema/index.ts";
import type { CfgBandAxis } from "./schema/index.ts";
import { BLOCKS } from "./blocks.ts";
import { isSegUnknown } from "./segment.ts";
import { bandLabels } from "./bands.ts";

/* validateFixture — 19 nhóm bất biến (port từ prototype; nhóm 19 thêm 02/08 cho phân khúc khách) */

const ROUTES = new Set([
  "cxm", "voc", "quantify", "assistant", "atlas", "work",
  "sources", "topics", "topic", "vocjourney", "agents", "rules", "issue",
]);

const byId = <T extends { id: string }>(arr: readonly T[]): Map<string, T> =>
  new Map(arr.map((x: T) => [x.id, x]));

function taxByLv(data: CxmData, lv: string): TaxNode[] {
  return data.tax.filter((t: TaxNode) => t.lv === lv);
}

export function validateFixture(
  data: CxmData,
  dims: Record<string, Dim>,
  nav: NavItem[],
  tour: TourStop[],
  cfg?: Cfg,
): string[] {
  const e: string[] = [];

  const lookup = {
    steps: byId<Step>(data.steps),
    metrics: byId<Metric>(data.metrics),
    ev: byId<Evidence>(data.ev),
    iss: byId<Issue>(data.iss),
    act: byId<Action>(data.act),
    sources: byId<Source>(data.sources),
    surveys: byId<Survey>(data.surveys),
    tax: byId<TaxNode>(data.tax),
    ins: byId<VoiceInsight>(data.ins),
    qt: byId<QuantifyItem>(data.qt),
    dash: byId<DashSet>(data.dash),
    flows: byId<Flow>(data.flows),
    cust: new Map<string, Customer>(data.cust.map((c: Customer) => [c.key, c])),
    out: new Map<string, Outcome>(data.out.map((o: Outcome) => [o.act, o])),
    snapByIss: new Map<string, Snapshot>(data.snap.map((s: Snapshot) => [s.iss, s])),
    groups: byId<Group>(data.groups),
    phases: byId<Phase>(data.phases),
    agents: byId<Agent>(data.ag),
  };

  /* 1. ID trùng */
  {
    const allIds: string[] = ([] as string[]).concat(
      data.steps.map((x: Step) => x.id),
      data.metrics.map((x: Metric) => x.id),
      data.ev.map((x: Evidence) => x.id),
      data.iss.map((x: Issue) => x.id),
      data.act.map((x: Action) => x.id),
      data.sources.map((x: Source) => x.id),
      data.surveys.map((x: Survey) => x.id),
      data.tax.map((x: TaxNode) => x.id),
      data.ins.map((x: VoiceInsight) => x.id),
      data.qt.map((x: QuantifyItem) => x.id),
      data.dash.map((x: DashSet) => x.id),
      data.flows.map((x: Flow) => x.id),
    );
    const seen = new Set<string>();
    for (const id of allIds) {
      if (seen.has(id)) e.push(`ID trùng: ${id}`);
      seen.add(id);
    }
  }

  /* 2. stationId */
  {
    const stations = data.steps.map((s: Step) => s.stationId);
    for (const s of data.steps) {
      if (!s.stationId) e.push(`${s.id}: thiếu stationId`);
    }
    const seenSt = new Set<string>();
    for (const st of stations) {
      if (seenSt.has(st)) e.push(`stationId trùng: ${st}`);
      seenSt.add(st);
    }
  }

  /* 3. Issue */
  for (const i of data.iss) {
    if (!lookup.steps.has(i.step)) e.push(`${i.id}: step ${i.step} không tồn tại`);
    if (!lookup.metrics.has(i.metric)) e.push(`${i.id}: metric ${i.metric} không tồn tại`);
    if (!lookup.act.has(i.act)) e.push(`${i.id}: action ${i.act} không tồn tại`);
    const a = lookup.act.get(i.act);
    if (a && a.iss !== i.id) e.push(`${i.id}: action ${i.act} liên kết ngược sai (trỏ về ${a.iss})`);
    if (i.ins !== null && !lookup.ins.has(i.ins)) e.push(`${i.id}: insight ${i.ins} không tồn tại`);
    for (const evId of i.ev) {
      const x = lookup.ev.get(evId);
      if (!x) { e.push(`${i.id}: evidence ${evId} không tồn tại`); continue; }
      if (x.step !== i.step) e.push(`${i.id}: evidence ${evId} thuộc bước ${x.step}, khác bước issue (${i.step})`);
    }
    for (const k of i.cust) {
      if (!lookup.cust.has(k)) e.push(`${i.id}: khách ${k} không có trong fixture`);
    }
    const sum = i.pri.sev + i.pri.aff + i.pri.jc + i.pri.rep + i.pri.tr + i.pri.reg;
    if (sum !== i.pri.total) e.push(`${i.id}: priority.total = ${i.pri.total} nhưng tổng thành phần = ${sum}`);
  }

  /* 4. Action — thứ tự trạng thái */
  for (const a of data.act) {
    if (!lookup.iss.has(a.iss)) e.push(`${a.id}: issue ${a.iss} không tồn tại`);
    if (!lookup.metrics.has(a.sm)) e.push(`${a.id}: success metric ${a.sm} không tồn tại`);
    const i = lookup.iss.get(a.iss);
    if (i && i.act !== a.id) e.push(`${a.id}: issue ${a.iss} không trỏ ngược`);
    /* base (đóng băng từ issue.metric lúc confirmIssue) và post/goal (đọc từ action.sm lúc
       advanceAction) phải cùng một metric — hai field khác nhau nuôi hai vế của MỘT so sánh
       (xem module-a-charter.md, phần correction A5). Lệch nhau thì verdict so hai chỉ số khác
       nhau mà tưởng là một. */
    if (i && a.sm !== i.metric) {
      e.push(`${a.id}: success metric (sm=${a.sm}) khác metric của issue ${a.iss} (metric=${i.metric})`);
    }
    if (a.ap !== "approved" && a.dl !== "backlog") e.push(`${a.id}: đã triển khai trước khi được duyệt`);
    if (a.dl !== "released" && a.iv !== "not-started") e.push(`${a.id}: đang đánh giá trước khi phát hành`);
    if (a.dl !== "released" && lookup.out.has(a.id)) e.push(`${a.id}: có outcome trước khi phát hành`);
    if (a.iv === "validated" && !lookup.out.has(a.id)) e.push(`${a.id}: đã validated nhưng thiếu outcome`);
    if (a.lc !== "blocked" && a.iv !== "validated") e.push(`${a.id}: khép vòng trước khi validated`);
    /* Ràng buộc cặp cf ⟺ snapshot — xương sống của module baseline đóng băng lúc xác nhận. */
    const hasSnap = lookup.snapByIss.has(a.iss);
    if (a.cf === "confirmed" && !hasSnap) e.push(`${a.id}: cf=confirmed nhưng thiếu snapshot cho issue ${a.iss}`);
    if (a.cf === "pending" && hasSnap) e.push(`${a.id}: cf=pending nhưng đã có snapshot cho issue ${a.iss}`);
    if (a.cf === "pending" && a.ap !== "pending") e.push(`${a.id}: cf=pending nhưng ap=${a.ap} (chưa xác nhận thì không thể đã duyệt)`);
  }

  /* 5. Voice Insight handoff */
  for (const v of data.ins) {
    if (!lookup.tax.has(v.theme)) e.push(`${v.id}: theme node ${v.theme} không tồn tại`);
    if (v.step !== null && !lookup.steps.has(v.step)) e.push(`${v.id}: step ${v.step} không tồn tại`);
    for (const s of v.src) {
      if (!lookup.sources.has(s)) e.push(`${v.id}: nguồn ${s} không tồn tại`);
    }
    for (const evId of v.ev) {
      if (!lookup.ev.has(evId)) e.push(`${v.id}: evidence ${evId} không tồn tại`);
    }
    if (v.hoEl === false && v.hoIssue) e.push(`${v.id}: chưa đủ điều kiện handoff nhưng vẫn gắn issue`);
    if (v.hoEl === true && !v.hoIssue) e.push(`${v.id}: đủ điều kiện handoff nhưng chưa gắn issue`);
  }

  /* 6. Nguồn & khảo sát */
  for (const s of data.sources) {
    for (const m of s.metrics) {
      if (!lookup.metrics.has(m)) e.push(`source ${s.id}: metric ${m} không tồn tại`);
    }
  }
  for (const sv of data.surveys) {
    const triggers = new Set(["deposit_credited", "account_activated", "account_open_completed", "cs_session_closed", "account_open_abandoned", "order_matched"]);
    const t = sv.trigger.split(" ")[0];
    if (!triggers.has(t) && !sv.trigger.startsWith("Chiến dịch")) e.push(`survey ${sv.id}: trigger "${sv.trigger}" không hợp lệ`);
  }

  /* 7. Signal dòng tiền */
  for (const sg of data.signals) {
    const tp = data.touchpoints.find((tp) => tp.id === sg.tpId);
    if (!tp) { e.push(`signal ${sg.id}: touchpoint ${sg.tpId} không tồn tại`); continue; }
    const step = lookup.steps.get(tp.stepId);
    if (!step) continue;
    const flow = lookup.flows.get(step.flowId);
    if (!flow) continue;
    const group = lookup.groups.get(flow.groupId);
    if (!group) continue;
    const moneyGroups = new Set(["g-in", "g-out"]);
    if (moneyGroups.has(group.id) && sg.es !== "server") {
      e.push(`signal ${sg.id}: dòng tiền nhưng es="${sg.es}" (cần "server")`);
    }
  }

  /* 8. Taxonomy cấu trúc */
  for (const t of data.tax) {
    if (t.lv === "L2") {
      const parent = lookup.tax.get(t.parentId);
      if (!parent || parent.lv !== "L1") e.push(`taxonomy ${t.id}: parent ${t.parentId} sai tầng cha (cần L1)`);
    }
    if (t.lv === "L3") {
      const parent = lookup.tax.get(t.parentId);
      if (!parent || parent.lv !== "L2") e.push(`taxonomy ${t.id}: parent ${t.parentId} sai tầng cha (cần L2)`);
    }
    if (t.lv === "theme") {
      const parent = lookup.tax.get(t.parentId);
      if (parent && parent.lv !== "L1") e.push(`taxonomy ${t.id}: parent ${t.parentId} sai tầng cha (cần L1 hoặc rỗng)`);
      /* Theme PHẢI khai intent + chuỗi kỳ: `cat` chia bốn khối "Khách đang nói gì?" ở
         Tổng quan VoC, `pts` là nguồn của sparkline + xu hướng (12 điểm/theme kể từ S2.7 —
         D8a; số kỳ HIỂN THỊ vẫn là runtime qua bộ lọc 3/6/12 tháng, không đóng cứng ở đây).
         Thiếu một trong hai thì @intent/@topictrend render rỗng, hoặc tính xu hướng ra 0 mà
         không ai biết. Ngưỡng "ít nhất 2 kỳ" bên dưới là RÀNG BUỘC TỐI THIỂU để tính được
         xu hướng — không phải số điểm thực tế mong đợi (12), nên không cần nới. */
      if (!t.cat) e.push(`taxonomy ${t.id}: theme thiếu cat (intent)`);
      else if (!data.cats[t.cat]) e.push(`taxonomy ${t.id}: cat "${t.cat}" không có trong cats`);
      if (!t.pts || t.pts.length < 2) e.push(`taxonomy ${t.id}: theme cần pts ít nhất 2 kỳ để tính xu hướng`);
    }
    if (t.lv === "subtheme") {
      const parent = lookup.tax.get(t.parentId);
      if (!parent || parent.lv !== "theme") e.push(`taxonomy ${t.id}: parent ${t.parentId} sai tầng cha (cần theme)`);
    }
    /* drift không được là nhãn trần — luôn phải nói lệch cái gì, và ngược lại. */
    if (t.drift && !t.driftNote) e.push(`taxonomy ${t.id}: có drift nhưng thiếu driftNote`);
    if (t.driftNote && !t.drift) e.push(`taxonomy ${t.id}: có driftNote nhưng thiếu drift`);
  }

  /* 9. Evidence × taxonomy (đúng 1 L1/L2/theme; ≤1 L3/subtheme; subtheme kèm theme cha) */
  for (const ev of data.ev) {
    for (const tid of ev.tax) {
      if (!lookup.tax.has(tid)) e.push(`evidence ${ev.id}: node ${tid} không tồn tại`);
    }
    /* `cat` của evidence dùng chung bảng cats với theme — chip intent tra trực tiếp vào đó. */
    if (!data.cats[ev.cat]) e.push(`evidence ${ev.id}: cat "${ev.cat}" không có trong cats`);
    const nodes = ev.tax.map((tid) => lookup.tax.get(tid)).filter(Boolean) as TaxNode[];
    for (const lv of ["L1", "L2", "theme"] as const) {
      const c = nodes.filter((t) => t.lv === lv).length;
      if (c !== 1) e.push(`evidence ${ev.id}: phải có đúng 1 node ${lv}, đang có ${c}`);
    }
    for (const lv of ["L3", "subtheme"] as const) {
      if (nodes.filter((t) => t.lv === lv).length > 1) e.push(`evidence ${ev.id}: có nhiều hơn 1 node ${lv}`);
    }
    for (const sub of nodes.filter((t) => t.lv === "subtheme")) {
      if (!sub.parentId || ev.tax.indexOf(sub.parentId) === -1)
        e.push(`evidence ${ev.id}: có subtheme ${sub.id} nhưng thiếu theme cha`);
    }
  }

  /* 10. Dashboard set — mỗi phần đúng 1 def; block trỏ Quantify/@block thật đúng sec; CFG.sub */
  const validSecs = new Set(["voc", "cxm"]);
  for (const sec of ["voc", "cxm"]) {
    const ss = data.dash.filter((d) => d.sec === sec);
    if (!ss.length) e.push(`phần ${sec}: không có set dashboard nào`);
    const defs = ss.filter((d) => d.def).length;
    if (defs !== 1) e.push(`phần ${sec}: phải có đúng 1 set mặc định, đang có ${defs}`);
  }
  for (const d of data.dash) {
    if (!validSecs.has(d.sec)) e.push(`${d.id}: sec "${d.sec}" phải là voc hoặc cxm`);
    if (cfg && !cfg.sub[d.id]) e.push(`${d.id}: thiếu cấu hình bản tin trong CFG.sub`);
    d.qs.forEach((qq, i) => {
      if (!qq.q) e.push(`${d.id} câu ${i + 1}: thiếu câu hỏi`);
      for (const b of qq.b) {
        if (b[0] === "@") {
          const blk = BLOCKS[b];
          if (!blk) { e.push(`${d.id} câu ${i + 1}: khối "${b}" không tồn tại`); continue; }
          if (blk.sec !== d.sec) e.push(`${d.id} câu ${i + 1}: khối "${b}" thuộc phần ${blk.sec}, không phải ${d.sec}`);
          if (!ROUTES.has(blk.go)) e.push(`khối "${b}": drill-down tới route "${blk.go}" không tồn tại`);
        } else if (!lookup.qt.has(b)) {
          e.push(`${d.id} câu ${i + 1}: Quantify ${b} không tồn tại`);
        }
      }
    });
  }
  if (cfg) {
    for (const k of Object.keys(cfg.sub)) {
      if (!lookup.dash.has(k)) e.push(`CFG.sub: set ${k} không tồn tại`);
    }
  }

  /* 11. Agent / loop / outcome */
  for (const ag of data.ag) {
    for (const f of ag.f) {
      for (const evId of f.ev) {
        if (!lookup.ev.has(evId)) e.push(`agent ${ag.id} f ${f.id}: evidence ${evId} không tồn tại`);
      }
    }
  }
  for (const l of data.loop) {
    if (!lookup.iss.has(l.iss)) e.push(`loop: issue ${l.iss} không tồn tại`);
    if (l.done > l.need) e.push(`loop ${l.iss}: done ${l.done} > need ${l.need}`);
  }
  for (const o of data.out) {
    if (!lookup.act.has(o.act)) e.push(`outcome: action ${o.act} không tồn tại`);
  }
  /* Snapshot baseline — mỗi issue tối đa 1 mốc đóng băng, obs.stepId phải trỏ step thật. */
  {
    const seenSnapIss = new Set<string>();
    for (const s of data.snap) {
      if (!lookup.iss.has(s.iss)) e.push(`snapshot: issue ${s.iss} không tồn tại`);
      if (seenSnapIss.has(s.iss)) e.push(`snapshot: issue ${s.iss} có nhiều hơn 1 snapshot`);
      seenSnapIss.add(s.iss);
      if (!lookup.steps.has(s.obs.stepId)) e.push(`snapshot ${s.iss}: obs.stepId ${s.obs.stepId} không tồn tại`);
    }
  }

  /* 12. Bản đồ */
  for (const g of data.groups) {
    if (!lookup.phases.has(g.phaseId)) e.push(`group ${g.id}: phase ${g.phaseId} không tồn tại`);
  }
  for (const f of data.flows) {
    if (!lookup.groups.has(f.groupId)) e.push(`flow ${f.id}: group ${f.groupId} không tồn tại`);
  }

  /* 13. PROVENANCE */
  for (const f of data.flows) {
    if ((f.verified === false && f.src !== "—") || (f.verified === true && f.src === "—")) {
      e.push(`flow ${f.id}: verified=${f.verified} src="${f.src}" — sai khớp`);
    }
    if (f.verified) {
      const isAJ = f.src.startsWith("Account Journey");
      const isMJ = f.src.startsWith("Money Journey");
      if (!isAJ && !isMJ) e.push(`flow ${f.id}: src "${f.src}" sai format`);
      if (isAJ) {
        const m = f.src.match(/Sơ đồ (\d+)/g);
        if (m) for (const mm of m) {
          if (parseInt(mm.replace("Sơ đồ ", ""), 10) > 13) e.push(`flow ${f.id}: AJ sơ đồ >13`);
        }
      }
      if (isMJ) {
        const m = f.src.match(/Sơ đồ (\d+)/g);
        if (m) for (const mm of m) {
          if (parseInt(mm.replace("Sơ đồ ", ""), 10) > 7) e.push(`flow ${f.id}: MJ sơ đồ >7`);
        }
      }
    }
  }

  /* 14. Flow observed */
  for (const f of data.flows) {
    const fs = data.steps.filter((s: Step) => s.flowId === f.id);
    if (f.observed) {
      if (fs.length === 0) e.push(`flow ${f.id}: observed nhưng không có bước`);
      for (const s of fs) {
        if (!data.obs.some((o) => o.stepId === s.id)) e.push(`flow ${f.id} step ${s.id}: thiếu obs`);
      }
    } else {
      if (fs.length > 0) e.push(`flow ${f.id}: !observed nhưng có ${fs.length} bước`);
    }
  }

  /* 15. Taxonomy ↔ map */
  {
    // 15a. L1 map 1—1 phases
    const l1 = taxByLv(data, "L1");
    if (l1.length !== data.phases.length) {
      e.push(`taxonomy: ${l1.length} L1 vs ${data.phases.length} phase`);
    }
    const seenPhases = new Set<string>();
    for (const t of l1) {
      if (!t.maps || !lookup.phases.has(t.maps)) {
        e.push(`taxonomy ${t.id}: L1 maps "${t.maps}" không trỏ phase thật`);
      } else if (seenPhases.has(t.maps)) {
        e.push(`taxonomy ${t.id}: L1 maps "${t.maps}" trùng phase với node khác`);
      } else {
        seenPhases.add(t.maps);
      }
    }

    // 15b. L2 maps → group or flow
    for (const t of taxByLv(data, "L2")) {
      if (t.maps === undefined) {
        e.push(`taxonomy ${t.id}: L2 thiếu trường maps`);
      } else if (t.maps !== null) {
        const isGroup = lookup.groups.has(t.maps);
        const isFlow = lookup.flows.has(t.maps);
        if (!isGroup && !isFlow) e.push(`taxonomy ${t.id}: L2 maps "${t.maps}" không trỏ group/flow thật`);
      }
    }

    // 15c. L3 maps → step or flow
    for (const t of taxByLv(data, "L3")) {
      if (t.maps === undefined) {
        e.push(`taxonomy ${t.id}: L3 thiếu trường maps`);
      } else if (t.maps !== null) {
        const isStep = lookup.steps.has(t.maps);
        const isFlow = lookup.flows.has(t.maps);
        if (!isStep && !isFlow) e.push(`taxonomy ${t.id}: L3 maps "${t.maps}" không trỏ step/flow thật`);
      }
    }

    // 15d. Tổng con ≤ cha
    for (const p of data.tax) {
      const kids = data.tax.filter((k: TaxNode) => k.parentId === p.id);
      if (!kids.length) continue;
      const sum = kids.reduce((a: number, k: TaxNode) => a + k.n, 0);
      if (sum > p.n) e.push(`taxonomy ${p.id}: tổng con ${sum} > cha ${p.n}`);
    }
  }

  /* 16. Saved Quantify */
  {
    /* Mark tách theo kind (03/08). Set PHẲNG cũ gộp cả 5 mark nên `{kind:'show', chart:'trend'}` đi
       qua được — tổ hợp không có đường render nào. Type `ShowMark`/`SeriesMark` đã chặn ở biên dịch;
       luật này chặn ở RUNTIME cho nguồn không do TS dựng (JSON/API thật khi tích hợp), đúng việc của
       validateFixture. */
    const showMarks = new Set(["rank", "donut"]);
    const seriesMarks = new Set(["trend", "cohort", "anomaly"]);
    const knownViews = new Set(["chart", "table"]);
    const knownMetrics = new Set(data.metrics.map((m: Metric) => m.id));
    knownMetrics.add("count");
    knownMetrics.add("pct");

    for (const q of data.qt) {
      if (q.kind === "show") {
        if (!dims[q.show]) e.push(`Quantify ${q.id}: chiều "${q.show}" không tồn tại`);
        if (!knownMetrics.has(q.metric)) e.push(`Quantify ${q.id}: chỉ số "${q.metric}" không tồn tại`);
      }
      const okMarks = q.kind === "show" ? showMarks : seriesMarks;
      if (!okMarks.has(q.chart)) {
        e.push(`Quantify ${q.id}: chart "${q.chart}" không dùng được cho kind '${q.kind}'`);
      }
      if (q.kind === "series" && q.shown > q.total) e.push(`Quantify ${q.id}: shown ${q.shown} > total ${q.total}`);
      if (q.view && !knownViews.has(q.view)) e.push(`Quantify ${q.id}: view "${q.view}" không hợp lệ`);
      if (q.kind === "series" && q.view === "table") e.push(`Quantify ${q.id}: series không hỗ trợ view table`);
      if (q.kind === "series" && "by" in q) e.push(`Quantify ${q.id}: series không được ghép chéo`);
      if (q.kind === "show" && q.by) {
        if (!dims[q.show] || !dims[q.show].evAttr) e.push(`Quantify ${q.id}: hàng "${q.show}" thiếu evAttr`);
        if (!dims[q.by] || !dims[q.by].evAttr) e.push(`Quantify ${q.id}: cột "${q.by}" thiếu evAttr`);
      }
      /* Breakdown `split` (Module D section 1, owner chốt 03/08) — CỐ Ý KHÔNG nới luật `by` ở trên:
         `split` là đường RIÊNG, không đi qua evidence, nên ba chốt đang giữ nhánh `unsupported` của
         CrossTable không tới được (xem CrossTable.tsx:23) vẫn còn nguyên. */
      if (q.kind === "show" && q.split) {
        if (!dims[q.split]) e.push(`Quantify ${q.id}: chiều chia màu "${q.split}" không tồn tại`);
        if (q.split === q.show) e.push(`Quantify ${q.id}: chiều chia màu trùng chiều hàng "${q.show}"`);
        /* Section 1 chỉ tính THẬT được khi cả hai chiều là thuộc tính khách — hai giá trị khi đó nằm
           trên CÙNG MỘT dòng Customer. Trục agg/ev không có khoá khách trên Evidence nên mọi tỷ trọng
           sẽ là số bịa; chặn ở đây thay vì để tầng vẽ lặng lẽ hiện thanh một màu. */
        if (dims[q.show]?.base !== "cust" || dims[q.split]?.base !== "cust") {
          e.push(`Quantify ${q.id}: chia màu chỉ hợp lệ khi CẢ "${q.show}" và "${q.split}" là base:'cust'`);
        }
        /* Loại trừ nhau (quy tắc Looker Studio): một chart không vừa ghép chéo vừa chia màu — hai thao
           tác cùng chiếm chiều thứ hai, làm cùng lúc thì không đọc ra ô nào thuộc phép nào. */
        if (q.by) e.push(`Quantify ${q.id}: không dùng đồng thời ghép chéo (by) và chia màu (split)`);
        if (q.chart === "donut") e.push(`Quantify ${q.id}: donut không hiện được chia màu`);
      }
      if (q.kind === "show" && q.stack) {
        if (q.stack !== "abs" && q.stack !== "pct") e.push(`Quantify ${q.id}: stack "${q.stack}" không hợp lệ`);
        if (!q.split) e.push(`Quantify ${q.id}: stack chỉ có nghĩa khi có chia màu (split)`);
        /* HAI MẪU SỐ KHÁC NHAU trên cùng một hình. `metric:'pct'` = % trên TỔNG cohort (đi vào nhãn
           số trong thanh qua Bars.pctMode); `stack:'pct'` = tỷ trọng TRONG từng hàng (đi vào bề rộng
           đoạn). Bật cả hai thì QuantifyWidget in nhãn trục dọc "% trên tổng" trong khi nhãn đáy nói
           "(100%) trong từng <đơn vị>" — người xem không biết con số đang so với cái gì. Không phải
           giới hạn kỹ thuật: đây là hình NÓI SAI, nên chặn ở đây thay vì để tầng vẽ tự đoán. */
        if (q.stack === "pct" && q.metric === "pct") {
          e.push(`Quantify ${q.id}: metric 'pct' (% trên tổng) và stack 'pct' (tỷ trọng trong hàng) là hai mẫu số khác nhau — không dùng đồng thời`);
        }
      }
    }
  }

  /* 17. Guided tour */
  for (let i = 0; i < tour.length; i++) {
    const t = tour[i];
    const routeParts = t.r.split("/");
    if (!ROUTES.has(routeParts[0])) e.push(`tour bước ${i + 1}: route "${t.r}" không tồn tại`);
    if (!t.sel) e.push(`tour bước ${i + 1}: thiếu selector "sel"`);
    if (!t.grp) e.push(`tour bước ${i + 1}: thiếu nhãn nhóm "grp"`);
  }

  /* 18. Nav */
  for (const n of nav) {
    if (n.r && !ROUTES.has(n.r)) e.push(`nav "${n.l}": route "${n.r}" không tồn tại`);
  }

  /* 19. Phân khúc khách — age/nav/tenure/acq. Chạy RUNTIME (không phải chỉ tsc) vì fixture demo
     (module C4) sinh dữ liệu bằng hàm lúc chạy, tsc không canh được giá trị sinh động. */
  {
    const AGE_BANDS = new Set(["18-24", "25-34", "35-49", "50+"]);
    const NAV_BANDS = new Set(["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", ">5tỷ"]);
    const TENURE_BANDS = new Set(["<6 tháng", "6-24 tháng", "2-5 năm", ">5 năm"]);
    const ACQ_CHANNELS = new Set(["banner", "giới thiệu", "chi nhánh", "tự tìm", "đối tác"]);

    for (const c of data.cust) {
      if (!AGE_BANDS.has(c.age) && !isSegUnknown(c.age)) e.push(`khách ${c.key}: age "${c.age}" không hợp lệ`);
      /* nav là trục DUY NHẤT không nhận sentinel (owner chốt 04/08: NAV lấy trực tiếp từ tài sản hiện
         tại nên luôn tính ra được — khách chưa nạp tiền là 0đ, thuộc '<50tr'). Bắt cả 'chưa-biết' và
         'thiếu' ở đây, vì fixture demo sinh lúc chạy nên tsc không canh được. */
      if (!NAV_BANDS.has(c.nav)) {
        e.push(
          isSegUnknown(c.nav)
            ? `khách ${c.key}: nav "${c.nav}" là sentinel — NAV lấy từ tài sản hiện tại nên phải luôn có dải (chưa có tài sản ⇒ "<50tr")`
            : `khách ${c.key}: nav "${c.nav}" không hợp lệ`,
        );
      }
      if (!TENURE_BANDS.has(c.tenure) && !isSegUnknown(c.tenure)) e.push(`khách ${c.key}: tenure "${c.tenure}" không hợp lệ`);
      if (!ACQ_CHANNELS.has(c.acq) && !isSegUnknown(c.acq)) e.push(`khách ${c.key}: acq "${c.acq}" không hợp lệ`);

      /* seg nghiệp vụ "Khách 50+" phải khớp dải tuổi thật — bắt lệch giữa nhãn segment và dữ liệu tuổi. */
      if (c.seg === "Khách 50+" && c.age !== "50+") {
        e.push(`khách ${c.key}: seg "Khách 50+" nhưng age "${c.age}" khác 50+`);
      }

      /* Rule "high-value ⟹ nav không sentinel" (bất biến C1 cũ) đã BỎ: rule nav ngay trên bắt sentinel
         cho MỌI khách nên nó chỉ là tập con — giữ lại là hai chỗ nói cùng một điều, rồi lệch nhau. */
    }
  }

  /* 20. Cfg.segment (module E, E-a: đây là source of truth cho ranh giới dải) — kiểm CẤU HÌNH,
     không phải dữ liệu khách. Chạy trước khi bất kỳ chart nào gọi bandLabels/bandOf, vì cuts sai
     (rỗng, không tăng dần, min chồng cut đầu) làm bandLabels/bandOf tính sai lặng lẽ ở tầng dưới
     mà không ai báo. */
  if (cfg) {
    /* Runtime, không phải chỉ tsc — đúng lý do nhóm 16 đã chặn kiểu này: cfg tương lai có thể tới
       từ localStorage/JSON khi UI #/rules lưu (E6/E7), lúc đó tsc không canh được thiếu trục. */
    const AXES = ["nav", "age", "tenure", "acq"] as const;
    for (const ax of AXES) {
      if (!cfg.segment?.[ax]) e.push(`cfg.segment: thiếu trục "${ax}"`);
    }

    const checkAxis = (name: string, axis: { min: number | null; cuts: number[]; unit: string }) => {
      if (axis.cuts.length === 0) {
        e.push(`cfg.segment.${name}: cuts rỗng — không có dải nào để xếp khách vào`);
      } else {
        for (let i = 1; i < axis.cuts.length; i++) {
          if (axis.cuts[i] <= axis.cuts[i - 1]) {
            e.push(`cfg.segment.${name}: cuts không tăng dần nghiêm ngặt (${axis.cuts[i - 1]} rồi ${axis.cuts[i]})`);
          }
        }
        if (axis.min !== null && axis.min >= axis.cuts[0]) {
          e.push(`cfg.segment.${name}: min (${axis.min}) >= cut đầu (${axis.cuts[0]}) — dải đầu rỗng`);
        }
      }
      const unitOk = axis.unit === 'đ' || axis.unit === 'năm' || axis.unit === 'tháng';
      if (!unitOk) {
        e.push(`cfg.segment.${name}: unit "${axis.unit}" không hợp lệ (phải là 'đ', 'năm' hoặc 'tháng')`);
      }
      /* Hai dải KHÁC NHAU không được ra CÙNG một nhãn. Không phải chuyện thẩm mỹ: mọi chỗ đếm theo
         trục này gom theo NHÃN (`bandOf` trả nhãn, không trả index), nên hai dải trùng nhãn bị cộng
         dồn im lặng — đúng loại lỗi "một chiều phải là tập giá trị loại trừ nhau", và đúng lý do
         luật acq ngay dưới cấm trùng tên kênh.
         ĐO ĐƯỢC, không phải giả thiết: `{min:null, cuts:[1,2,50e6,200e6], unit:'đ'}` hợp lệ theo mọi
         luật khác ở trên, lại đúng dạng cấu hình owner cần để tách nhóm CHƯA CÓ TÀI SẢN, mà cho ra
         ["0đ","0đ","<50tr",...] — `bandOf(0)` và `bandOf(1)` không phân biệt được. */
      if (unitOk && axis.cuts.length > 0) {
        const seen = new Set<string>();
        for (const label of bandLabels(axis as CfgBandAxis)) {
          if (seen.has(label)) {
            e.push(`cfg.segment.${name}: hai dải cùng ra nhãn "${label}" — cut quá sát nhau để tách được ở unit '${axis.unit}'`);
          }
          seen.add(label);
        }
      }
    };
    if (cfg.segment?.nav) checkAxis("nav", cfg.segment.nav);
    if (cfg.segment?.age) checkAxis("age", cfg.segment.age);
    if (cfg.segment?.tenure) checkAxis("tenure", cfg.segment.tenure);

    if (cfg.segment?.acq) {
      if (cfg.segment.acq.values.length === 0) {
        e.push(`cfg.segment.acq: values rỗng — không có kênh nào để xếp khách vào`);
      } else {
        const seenAcq = new Set<string>();
        for (const v of cfg.segment.acq.values) {
          if (seenAcq.has(v)) e.push(`cfg.segment.acq: tên kênh "${v}" trùng`);
          seenAcq.add(v);
        }
      }
    }
  }

  return e;
}