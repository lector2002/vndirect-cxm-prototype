import type { CxmData, Dim, NavItem, TourStop, Cfg } from "./schema/index.ts";
import type { Step, Metric, Evidence, Issue, Action, Source, Survey, VoiceInsight, QuantifyItem, DashSet, Flow, Customer, Outcome, Snapshot, Group, Phase, Agent, TaxNode, Signal, StepLevel } from "./schema/index.ts";
import type { CfgBandAxis, SigCount } from "./schema/index.ts";
import { CUST_NUM, CUST_CAT } from "./rawFields.ts";
import { BLOCKS } from "./blocks.ts";
import { isSegUnknown } from "./segment.ts";
import { bandLabels, bandOf } from "./bands.ts";
import { NOT_IDENTIFIED, SIG_CUST_DIMS, SIG_FIRE_DIM } from "./projectSignalCounts.ts";

/* validateFixture — 24 nhóm bất biến (port từ prototype; nhóm 19 thêm 02/08 cho phân khúc khách;
   nhóm 23 thêm 07/08 cho chuỗi lịch sử chỉ số `hist`, module-b-issue-charter.md section B1; nhóm 24
   thêm 12/08 cho dải số của cfg, module-i-signal-registry-charter.md §12.1) */

const ROUTES = new Set([
  "cxm", "voc", "quantify", "assistant", "atlas", "work",
  "sources", "topics", "topic", "vocjourney", "agents", "rules", "issue", "signals",
]);

/* Ba unit mà `bandLabels` (data/bands.ts) biết định dạng. MỘT nguồn cho cả nhóm 19 (bỏ qua trục
   cấu hình hỏng) và nhóm 20 (báo unit sai) — hai nơi cùng hỏi "unit này có dùng được không" nên
   không được có hai danh sách. */
const BAND_UNITS = new Set<string>(['đ', 'năm', 'tháng']);

/* Evidence.ck — hằng dạng khoá khách + sentinel ẩn danh (F4, module-f-charter.md). Đặt Ở ĐÂY,
   KHÔNG ở segment.ts: segment.ts chỉ nói về sentinel 'chưa-biết'/'thiếu' của các TRỤC PHÂN KHÚC
   khách (age/tenure/acq/nav) — một khái niệm khác. Đây là khoá NỐI giữa Evidence và Customer,
   không phải giá trị của một trục phân khúc, nên gộp vào segment.ts sẽ lẫn hai khái niệm không
   cùng bản chất vào một file có docblock đầu chỉ nói về trục phân khúc. Export cả hai để
   fixtures/demo.ts (F2) và domain/themeSegments.ts (F1, việc sau) dùng lại MỘT nguồn duy nhất
   khi cần phân biệt "ẩn danh" với "join hỏng" — đúng bài học chống hai bản sao đã ghi ở
   segment.ts dòng 24-29 (mdir lệch nhau vì có hai bản sao). */
export const ANON_CK = "Ẩn danh";
export const CK_KEY_RE = /^KH•••[0-9A-Z]{3}$/;

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
    signals: byId<Signal>(data.signals),
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
    /* Bất biến "sev+aff+jc+rep+tr+reg === total" ĐÃ BỎ 14/08 (ADR-002 §1): nó canh phép cộng của
       một dãy số GÕ TAY, nên xanh suốt trong khi hai điểm gãy mang điểm `sev` lệch khỏi chính bảng
       tra của code (`CXI-024` 20 thay vì 22, `CXI-026` 12 thay vì 14). Điểm nay là hàm tính
       (`data/priority.ts`), không còn dãy số nào trong dữ liệu để cộng lại. */
    if (i.sigMap) {
      const sig = lookup.signals.get(i.sigMap.sig);
      if (!sig) e.push(`${i.id}: sigMap trỏ điểm đo ${i.sigMap.sig} không tồn tại`);
      else if (i.sigMap.vals.length === 0) {
        e.push(`${i.id}: sigMap khai điểm đo ${sig.id} nhưng không giá trị nào — bỏ hẳn sigMap nếu chưa map, để aff là "chưa tính được"`);
      } else {
        for (const v of i.sigMap.vals) {
          if (!sig.values.includes(v)) {
            e.push(`${i.id}: sigMap trỏ giá trị "${v}" không có trong bản khai của điểm đo ${sig.id}`);
          }
        }
      }
    }
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
    /* `srcId` trỏ tới một nguồn KHÔNG CÓ THẬT là ca nguy hiểm hơn `srcId: null`: null nói thẳng
       "chưa nối được nguồn" và mọi chỗ đọc đều trả "chưa biết", còn id lạc thì màn sẽ im lặng rơi
       về cùng một nhánh trong khi dữ liệu đang khai một quan hệ sai. Chỉ kiểm TỒN TẠI — không kiểm
       "metrics của signal phải nằm trong metrics của nguồn": luật gán ở seed hôm nay đọc theo
       metric, nhưng một điểm đo hoàn toàn có thể được giao bởi một nguồn chưa nuôi chỉ số nào. */
    if (sg.srcId !== null && !data.sources.some((s) => s.id === sg.srcId)) {
      e.push(`signal ${sg.id}: srcId ${sg.srcId} không tồn tại`);
    }
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
  /* Obs mồ côi (trỏ bước không tồn tại) — lỗi dữ liệu thuần, không có cách đọc hợp lệ nào. Hướng này
     trước 07/08 nằm trong nhóm 14, bỏ cùng `Flow.observed` ở lát I2; giữ lại TẠI NHÓM 12 thay vì mở
     nhóm 24, vì đúng loại "toàn vẹn tham chiếu bản đồ" của nhóm này (bất biến 8 vẫn nguyên).
     CỐ Ý KHÔNG khôi phục hướng ngược lại — "mỗi bước phải có obs": bước đã chép mà CHƯA ĐO là trạng
     thái HỢP LỆ, `stepState()` trả "unknown" và UI đã nói đúng chuyện đó (xem JourneyStateBlock, ca
     "flow đã khai bước mà chưa đo bước nào"). Nhóm 14 cũ cấm trạng thái đó, tức chặn một tình trạng
     thật khỏi màn hình — cùng lý lẽ đã dùng để KHÔNG thêm luật ở D5. */
  for (const o of data.obs) {
    if (!lookup.steps.has(o.stepId)) e.push(`obs: step ${o.stepId} không tồn tại`);
  }

  /* 13, 14 — KHUYẾT VĨNH VIỄN, KHÔNG tái sử dụng số (bất biến 8, module-i-signal-registry-charter.md
     §9). Hai nhóm cũ kiểm `Flow.verified` ⟺ `src !== "—"` và `Flow.observed` ⟺ có ≥1 `Step` — 07/08
     (D2/F8 cùng charter) cả hai field bị xoá khỏi schema vì tự thân chỉ là biểu thức của `src`/
     `steps`, không mang thêm thông tin nào (đếm khớp 25⟷25 và 6⟷6 trước khi xoá — suy tại chỗ đọc
     luôn cho đúng kết quả, không cần validate giữ đồng bộ nữa). Nhóm luật mới trong tương lai là
     25 — số 24 ĐÃ DÙNG (dải số của cfg, thêm 12/08), và vẫn KHÔNG lấp số 13/14 cho nhóm khác:
     người đọc log cũ sẽ hiểu sai luật nào đã fail.
     LƯU Ý cho người đọc lại: nhóm 14 cũ, bên trong nhánh `f.observed`, còn kiểm mỗi bước của flow
     phải có ≥1 `Obs` khớp ("thiếu obs") — kiểm này KHÔNG liên quan gì đến verified/observed, nhưng
     nằm cùng nhóm nên mất theo. Bất biến đó vẫn đang được AtlasPage.test.tsx canh riêng (guard "mọi
     step trong seed có đúng 1 obs khớp") cho `seed`, nhưng KHÔNG còn được validateFixture() canh
     chung cho cả hai fixture — nếu cần lại, phải mở nhóm 24 mới, không phải lấp lại 13/14. */

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
    /* Chiều cắt ngưỡng kiểm theo CẶP (nhãn phái sinh, số thô là nguồn) — thay ba `Set` nhãn hardcode
       của bản trước. Nhãn do ranh giới sinh (data/bands.ts, bất biến E-c), nên gõ tay danh sách nhãn
       ở đây là bản sao thứ tư của cùng ranh giới, và nó báo sai ngay lần đầu owner sửa ranh giới.
       Danh sách chiều cũng SUY TỪ KHAI BÁO, không liệt kê tay 3 cặp như bản trước: liệt kê tay là bản
       sao thứ hai của "chiều nào cắt theo dữ kiện nào", và nó sẽ bỏ qua đúng chiều owner mới thêm —
       chiều mới không được canh một bất biến nào. */
    const BAND_DIMS: Array<readonly [string, string]> = [];
    for (const [dimId, dim] of Object.entries(dims)) {
      if (dim.base !== "cust" || dim.cut?.kind !== "band") continue;
      const rawField = dim.cut.source;
      /* Kiểm khai báo MỘT LẦN ở đây, không trong vòng lặp khách: một khai báo sai là MỘT lỗi cấu
         hình, không phải 300 lỗi dữ liệu — nhân nó lên theo số khách sẽ chôn mọi thông báo khác. */
      if (!CUST_NUM[rawField]) {
        e.push(
          `chiều "${dimId}": cắt ngưỡng theo dữ kiện "${rawField}" nhưng dữ kiện đó không có trong danh mục số (CUST_NUM ở data/rawFields.ts) — khai báo sai, hoặc pipeline chưa mang dữ kiện này về`,
        );
        continue;
      }
      BAND_DIMS.push([dimId, rawField]);
    }

    for (const c of data.cust) {
      /* nav là trục DUY NHẤT không nhận sentinel (owner chốt 04/08: NAV lấy trực tiếp từ tài sản hiện
         tại nên luôn tính ra được — khách chưa nạp tiền có tài sản 0). Kiểm trên SỐ THÔ, không phải
         nhãn: nhãn chỉ là ảnh chiếu, sentinel nào lọt vào nhãn cũng phải đến từ số thô. */
      if (isSegUnknown(c.navVnd)) {
        e.push(
          `khách ${c.key}: navVnd "${c.navVnd}" là sentinel — NAV lấy từ tài sản hiện tại nên phải luôn có số (chưa có tài sản ⇒ 0)`,
        );
      }

      if (cfg) {
        for (const [dimId, rawField] of BAND_DIMS) {
          const axis = cfg.segment?.band?.[dimId];
          /* Bỏ qua trục có CẤU HÌNH hỏng — nhóm 20 là chỗ báo việc đó. Ở đây phải bỏ qua thật sự vì
             `bandLabels` chỉ tổng trên 3 unit hợp lệ: unit lạ (cfg tới từ localStorage/JSON khi UI
             #/rules lưu) làm nó trả undefined và `bandOf` NÉM, che mất chính thông báo của nhóm 20.
             `cuts` rỗng thì không có dải nào để so nhãn — cũng để nhóm 20 nói. */
          if (!axis || axis.cuts.length === 0 || !BAND_UNITS.has(axis.unit)) continue;
          const raw = CUST_NUM[rawField](c);
          const expected = bandOf(raw, axis);
          if (c.bands[dimId] !== expected) {
            e.push(
              `khách ${c.key}: nhãn nhóm chiều "${dimId}" là "${String(c.bands[dimId])}" không khớp ${rawField}=${String(raw)} — theo ranh giới phải là "${expected}"`,
            );
          }
        }
        /* Chiều LẤY NGUYÊN GIÁ TRỊ: chỉ kiểm khi cfg có khai danh sách đóng cho chiều đó. Thiếu khai
           báo là hợp lệ (seg/tier hôm nay) — kiểm khi chưa chốt danh sách sẽ báo mọi giá trị là lạ. */
        for (const [dimId, dim] of Object.entries(dims)) {
          if (dim.base !== "cust" || dim.cut?.kind !== "values") continue;
          const allowed = cfg.segment?.values?.[dimId];
          if (!allowed) continue;
          const read = CUST_CAT[dim.cut.source];
          if (!read) continue;
          const v = read(c);
          if (!isSegUnknown(v) && !allowed.includes(v)) {
            e.push(`khách ${c.key}: giá trị "${v}" của chiều "${dimId}" không có trong cfg.segment.values["${dimId}"]`);
          }
        }
      }

      /* seg nghiệp vụ "Khách 50+" phải khớp TUỔI THẬT — so trên `ageYears`, không so nhãn "50+":
         nhãn dải cuối đổi theo cut (owner sửa cut tuổi là nhãn thành "60+"), còn nghĩa nghiệp vụ của
         segment này vẫn là "từ 50 tuổi", nên so nhãn sẽ báo lỗi giả ngay khi cut đổi. */
      if (c.seg === "Khách 50+" && !(typeof c.ageYears === "number" && c.ageYears >= 50)) {
        e.push(`khách ${c.key}: seg "Khách 50+" nhưng ageYears "${String(c.ageYears)}" chưa tới 50`);
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
    /* Mỗi chiều CẮT NGƯỠNG phải có ranh giới. Suy từ khai báo thay vì danh sách `["nav","age",
       "tenure","acq"]` viết tay: danh sách viết tay đòi ranh giới cho một chiều owner đã xoá (lỗi
       giả không cách nào dẹp) và không đòi gì với chiều owner mới thêm (chiều đó lặng lẽ không có
       nhóm nào). Chiều LẤY NGUYÊN GIÁ TRỊ không bị đòi: thiếu danh sách đóng là hợp lệ. */
    for (const [dimId, dim] of Object.entries(dims)) {
      if (dim.base === "cust" && dim.cut?.kind === "band" && !cfg.segment?.band?.[dimId]) {
        e.push(`cfg.segment.band: thiếu ranh giới cho chiều "${dimId}" — chiều cắt ngưỡng mà không có ranh giới thì không có nhóm nào`);
      }
    }

    const checkAxis = (name: string, axis: { min: number | null; cuts: number[]; unit: string }) => {
      if (axis.cuts.length === 0) {
        e.push(`cfg.segment.band["${name}"]: cuts rỗng — không có dải nào để xếp khách vào`);
      } else {
        for (let i = 1; i < axis.cuts.length; i++) {
          if (axis.cuts[i] <= axis.cuts[i - 1]) {
            e.push(`cfg.segment.band["${name}"]: cuts không tăng dần nghiêm ngặt (${axis.cuts[i - 1]} rồi ${axis.cuts[i]})`);
          }
        }
        if (axis.min !== null && axis.min >= axis.cuts[0]) {
          e.push(`cfg.segment.band["${name}"]: min (${axis.min}) >= cut đầu (${axis.cuts[0]}) — dải đầu rỗng`);
        }
      }
      const unitOk = BAND_UNITS.has(axis.unit);
      if (!unitOk) {
        e.push(`cfg.segment.band["${name}"]: unit "${axis.unit}" không hợp lệ (phải là 'đ', 'năm' hoặc 'tháng')`);
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
            e.push(`cfg.segment.band["${name}"]: hai dải cùng ra nhãn "${label}" — cut quá sát nhau để tách được ở unit '${axis.unit}'`);
          }
          seen.add(label);
        }
      }
    };
    /* Lặp trên NHỮNG GÌ CFG ĐANG CÓ, không trên danh sách trục viết tay: một bộ ranh giới rác dưới
       tên chiều không còn tồn tại vẫn phải bị bắt (nó sẽ sống lại nếu owner tạo lại chiều cùng tên). */
    for (const [dimId, axis] of Object.entries(cfg.segment?.band ?? {})) {
      checkAxis(dimId, axis);
    }

    for (const [dimId, values] of Object.entries(cfg.segment?.values ?? {})) {
      if (values.length === 0) {
        e.push(`cfg.segment.values["${dimId}"]: rỗng — không có giá trị nào để xếp khách vào (bỏ hẳn entry nếu chưa muốn chốt danh sách đóng)`);
        continue;
      }
      const seen = new Set<string>();
      for (const v of values) {
        if (seen.has(v)) e.push(`cfg.segment.values["${dimId}"]: giá trị "${v}" trùng`);
        seen.add(v);
      }
    }
  }

  /* 21. Evidence.ck — luật ĐỊNH DẠNG, KHÔNG phải luật "tra ra được" (F4, module-f-charter.md,
     mục "Chỉnh charter sau khi đọc code" #3). seed.cust chỉ có 7 khách mẫu và không tự nhận là
     đầy đủ — 7/17 dòng ev trong seed có ck không tra ra khách nào trong 7 khách đó (đã đo, không
     phải suy đoán), và đó KHÔNG phải lỗi của seed. Luật "mọi ck phải tra ra khách" sẽ SAI với
     seed và buộc phải phình seed chỉ để né lỗi giả — nên luật ở đây chỉ bắt ĐÚNG DẠNG. Luật
     "tra ra được" thật (chạy ở nơi có đủ khách để kiểm, tức demoData) nằm ở
     fixtures/demo.test.ts, không phải đây. */
  for (const ev of data.ev) {
    if (!ev.ck || !ev.ck.trim()) {
      e.push(`evidence ${ev.id}: ck rỗng — phải là "${ANON_CK}" hoặc đúng dạng khoá khách KH•••XXX (3 ký tự chữ-số in hoa)`);
    } else if (ev.ck !== ANON_CK && !CK_KEY_RE.test(ev.ck)) {
      e.push(`evidence ${ev.id}: ck "${ev.ck}" sai dạng — phải là "${ANON_CK}" hoặc khoá dạng KH•••XXX (3 ký tự chữ-số in hoa), ví dụ KH•••7A2`);
    }
    /* ck === ANON_CK là HỢP LỆ — loại "không biết" thứ BA, khác cả 'chưa-biết' (đợi cũng không
       có id, quy luật hành trình) và 'thiếu' (bug pipeline, phải đi sửa): nguồn ẨN DANH (đánh
       giá store, ghi chú RM không định danh) không có id để đối chiếu VÀ không có pipeline nào
       để "sửa" ra id, vì bản chất nguồn vốn không mang id. Coi nó là lỗi sẽ buộc giả lập id cho
       một nguồn vốn dĩ không có — sai hướng (module-f-charter.md, mục "Chỉnh charter" #2). */
  }

  /* 22. Chart điểm đo — sigCounts (thiết kế: output/thiet-ke-chart-signal.html §2, §3, §9). Bên dữ
     liệu đếm sẵn nghĩa là hệ thống KHÔNG tự kiểm lại được bằng cách cộng từ đầu (khác 300 khách ở
     trên, nơi validate còn tự đếm được) — ba ràng buộc dưới đây LÀ cửa nhận số. Kiểm Ở VÒNG NGOÀI
     (theo signal), không theo từng dòng sigCounts: một bảng đếm sai là MỘT lỗi cấu hình/pipeline,
     không phải N lỗi dữ liệu (docs/DB-FIRST-HANDOFF.md, "Bẫy đã trả giá"). */
  {
    const bySig = new Map<string, SigCount[]>();
    for (const row of data.sigCounts) {
      const arr = bySig.get(row.sig);
      if (arr) arr.push(row);
      else bySig.set(row.sig, [row]);
    }

    for (const sig of data.signals) {
      const rows = bySig.get(sig.id) ?? [];
      if (rows.length === 0) {
        /* Rỗng có HAI nguyên nhân khác hẳn nhau — phải phân biệt bằng PHẠM VI kiểm (cả bảng
           `data.sigCounts`), không thể phân biệt chỉ nhìn riêng `rows` của một signal:
           - CẢ BẢNG sigCounts rỗng (data.sigCounts.length === 0): Demo Mode TẮT, seed chưa giao
             dòng nào cho signal nào cả — trạng thái trống TRUNG THỰC của toàn hệ thống, không phải
             lỗi. Ba ràng buộc dưới đây chỉ có nghĩa khi ĐÃ có dòng để so nên bỏ qua toàn bộ.
           - Bảng CÓ dòng (ít nhất một signal khác đã có sigCounts) nhưng RIÊNG signal này vắng mặt:
             nếu sig.vol > 0 (đã instrument, có bắn thật) mà không nổi một dòng đếm, đây là "cổng
             nhận số" bị bỏ lọt im lặng đúng ca nguy hiểm nhất — không có gì để cộng. Nguyên nhân
             nhiều khả năng nhất là quên khai Signal.values (rỗng ⇒ demo generator không sinh fire
             nào để đếm, xem data/fixtures/demo.ts genFiresForSignal) — nêu thẳng trong câu lỗi. */
        if (data.sigCounts.length > 0 && sig.vol > 0) {
          e.push(
            `sigCounts ${sig.id}: vol=${sig.vol} > 0 nhưng KHÔNG có dòng đếm nào — kiểm lại Signal.values (rỗng thì demo generator không sinh fire nào để đếm)`,
          );
        }
        continue;
      }

      // Giá trị lạ — không có trong danh mục Signal.values đã khai (thiết kế §7: giá trị chưa khai
      // phải HIỆN RA chứ không bị bỏ im lặng; cột "giá trị chưa khai" là việc của section sau, ở đây
      // chỉ chặn giá trị không rõ nguồn gốc lọt vào sigCounts).
      const validVals = new Set(sig.values);
      for (const r of rows) {
        if (!validVals.has(r.val)) {
          e.push(`sigCounts ${sig.id}: giá trị "${r.val}" không có trong Signal.values đã khai`);
        }
      }

      // Ràng buộc 1 — tổng n của MỘT CHIỀU bất kỳ phải bằng Signal.vol. Khởi tạo sẵn cả NĂM chiều
      // bằng 0 (không chỉ những chiều CÓ dòng) — nếu không, một chiều bị THIẾU HẲN (0 dòng) sẽ không
      // bao giờ vào Map nên vòng lặp bỏ qua, "tổng=0 ≠ vol" lọt lưới im lặng.
      const ALL_SIG_DIMS = [...SIG_CUST_DIMS, SIG_FIRE_DIM];
      const byDim = new Map<string, number>(ALL_SIG_DIMS.map((d) => [d, 0]));
      for (const r of rows) byDim.set(r.dim, (byDim.get(r.dim) ?? 0) + r.n);
      for (const [dim, total] of byDim) {
        if (total !== sig.vol) {
          e.push(`sigCounts ${sig.id}/"${dim}": tổng n=${total} không khớp Signal.vol=${sig.vol} (ràng buộc 1)`);
        }
      }

      // Ràng buộc 2 — CÙNG một giá trị, NĂM bảng đếm phải cộng ra CÙNG một số, không chỉ khớp tổng
      // (bắt được lỗi mà ràng buộc 1 bỏ lọt: lệch ở giá trị này bù lại ở giá trị khác, tổng vẫn khớp).
      // Cũng khởi tạo sẵn cả năm chiều bằng 0 cùng lý do như ràng buộc 1 — một chiều vắng mặt hoàn
      // toàn cho MỘT giá trị vẫn phải hiện ra là lệch, không được coi như "chưa nói gì nên bỏ qua".
      const byVal = new Map<string, Map<string, number>>();
      for (const r of rows) {
        let m = byVal.get(r.val);
        if (!m) {
          m = new Map(ALL_SIG_DIMS.map((d) => [d, 0]));
          byVal.set(r.val, m);
        }
        m.set(r.dim, (m.get(r.dim) ?? 0) + r.n);
      }
      for (const [val, m] of byVal) {
        const totals = [...m.values()];
        if (new Set(totals).size > 1) {
          e.push(
            `sigCounts ${sig.id}/"${val}": năm chiều không khớp nhau — ${[...m.entries()].map(([d, n]) => `${d}=${n}`).join(", ")} (ràng buộc 2)`,
          );
        }
      }

      // Ràng buộc 3 — số "chưa định danh" phải GIỐNG NHAU ở BỐN CHIỀU KHÁCH (SIG_CUST_DIMS). Chiều
      // "sigpf" (SIG_FIRE_DIM) được MIỄN: lần bắn không biết khách vẫn biết nền tảng của chính nó,
      // nên chênh lệch ở chiều đó là ĐÚNG — ĐỪNG "sửa" cho nó cân (thiết kế §3, ràng buộc 3; đã có
      // ca đo được: một điểm đo xảy ra trước bước biết khách gần như toàn "chưa định danh" ở bốn
      // chiều khách, trong khi chiều nền tảng vẫn nói được điều gì đó).
      const byValUnid = new Map<string, Map<string, number>>();
      for (const r of rows) {
        if (r.dim === SIG_FIRE_DIM || r.band !== NOT_IDENTIFIED) continue;
        let m = byValUnid.get(r.val);
        if (!m) {
          m = new Map(SIG_CUST_DIMS.map((d) => [d, 0]));
          byValUnid.set(r.val, m);
        }
        m.set(r.dim, (m.get(r.dim) ?? 0) + r.n);
      }
      for (const [val, m] of byValUnid) {
        const totals = SIG_CUST_DIMS.map((d) => m.get(d) ?? 0);
        if (new Set(totals).size > 1) {
          e.push(
            `sigCounts ${sig.id}/"${val}": số "${NOT_IDENTIFIED}" không giống nhau ở bốn chiều khách (${SIG_CUST_DIMS.map((d, i) => `${d}=${totals[i]}`).join(", ")}) — chiều "${SIG_FIRE_DIM}" được MIỄN (ràng buộc 3)`,
          );
        }
      }
    }
  }

  /* 23. Chuỗi lịch sử chỉ số (`hist`) — module-b-issue-charter.md, section B1. Năm luật: thiếu bất
     kỳ luật nào là lỗi im lặng (join sai trả 0 dòng, trông y như "chưa có data" — bài học D-2). */
  {
    const seenHistIss = new Set<string>();
    for (const h of data.hist) {
      // 1. Referential integrity: iss phải tồn tại trong data.iss.
      if (!lookup.iss.has(h.iss)) e.push(`hist: issue ${h.iss} không tồn tại`);

      // 2. Mỗi issue tối đa MỘT dòng hist.
      if (seenHistIss.has(h.iss)) e.push(`hist: issue ${h.iss} có nhiều hơn 1 dòng`);
      seenHistIss.add(h.iss);

      // 3. pre không rỗng; nhãn kỳ pre[].p không trùng nhau trong cùng một dòng.
      if (h.pre.length === 0) e.push(`hist ${h.iss}: pre rỗng — chuỗi lịch sử phải có ít nhất 1 kỳ`);
      const seenPeriods = new Set<string>();
      for (const pt of h.pre) {
        if (seenPeriods.has(pt.p)) e.push(`hist ${h.iss}: nhãn kỳ "${pt.p}" trùng nhau trong pre`);
        seenPeriods.add(pt.p);
      }

      // 4. u phải khớp snap.m.u của cùng issue.
      const snap = lookup.snapByIss.get(h.iss);
      if (snap && h.u !== snap.m.u) {
        e.push(`hist ${h.iss}: đơn vị "${h.u}" khác đơn vị snapshot "${snap.m.u}" — hai đơn vị khác nhau trên một đường là hình nói sai`);
      }

      // 5. Không có snapshot ⇒ lỗi — không có mốc đóng băng thì chuỗi không có điểm neo.
      if (!snap) e.push(`hist ${h.iss}: không có snapshot cho issue này — chuỗi lịch sử không có điểm neo`);
    }
  }

  /* 24. DẢI SỐ CỦA CFG (thêm 12/08 — module-i-signal-registry-charter.md §12.1 "Còn hở"; bất biến 8:
     số 24 là nhóm mới, KHÔNG lấp 13/14 đã vĩnh viễn trống). Trước nhóm này, mọi ô ở #/rules ghi được
     bất cứ con số nào: `deadDays` = 0 xoá hẳn hai bậc "đang trễ"/"im lặng" khỏi sourceHealth(), nhịp
     giao âm làm không nguồn nào đạt nhịp, nhịp thập phân làm nhãn "SLA N ngày" nói khác con số engine
     đang chấm — tất cả trong IM LẶNG, không nhãn nào báo.

     RANH GIỚI VỚI cfgIssues() (domain/cfgIssues.ts) — hai surface, đừng dời luật qua nhau:
     - Nhóm này kiểm MIỀN XÁC ĐỊNH: hữu hạn · dấu · nguyên với ô đếm bằng ngày/lần/khách · trần 100
       với ô phần trăm. Cộng ĐÚNG MỘT ca suy biến owner đã nêu tên (`deadDays` ≥ 1). Là lỗi CỨNG.
     - cfgIssues() kiểm THỨ TỰ giữa hai ngưỡng (crit vs watch) — đặt ngược vẫn là cấu hình đúng dạng,
       nên chỉ cảnh báo mềm để owner tự sửa. Cấu hình suy biến-mà-đúng-dạng (vd `failWatch` = 0) thuộc
       về cfgIssues, KHÔNG thuộc về đây.

     LÊN THẲNG MÀN HÌNH, không cần sửa UI: MockRepository.setCfg() chạy chính validateFixture với cfg
     ứng viên và NÉM nếu có lỗi mới, useCfgWrite() in nguyên văn câu lỗi vào ô "Không ghi được cấu
     hình" của đúng nhóm vừa sửa. Vì thế mọi câu lỗi dưới đây MỞ ĐẦU BẰNG ĐƯỜNG DẪN cfg — đó là thứ
     nói cho người vận hành biết ô nào.

     `cfg.segment` KHÔNG đi qua đây: nhóm 20 sở hữu mặt đó (cuts tăng dần, min, unit, nhãn trùng).
     Chỉ kiểm LEAF SỐ — chuỗi (`cfg.sub`) và boolean (`metric[].on`) không có dải nào để nói. */
  if (cfg) {
    type NumRange = {
      /** Sàn. Thiếu ⇒ không có sàn (chỉ đòi hữu hạn). */
      min?: number;
      /** true ⇒ sàn là biên MỞ (phải LỚN HƠN `min`, không được bằng). */
      minOpen?: true;
      /** Trần. Chỉ đặt khi con số ĐƯỢC SO VỚI có trần thật (tỷ lệ % không vượt 100). */
      max?: number;
      /** true ⇒ phải nguyên. Đặt cho ô đếm bằng ngày/lần/khách: engine đếm nguyên đơn vị VÀ nhãn in
          ra cũng nguyên đơn vị, nên 1,5 ngày là con số không màn nào nói lại được. */
      int?: true;
      unit?: string;
      /** Vì sao dải là thế — đi vào câu lỗi, vì câu đó lên thẳng #/rules. */
      why: string;
    };

    /* Khoá là ĐƯỜNG DẪN trong cfg; `*` khớp một tầng khoá động (id chỉ số, id nguồn). Bảng này là
       chỗ DUY NHẤT khai dải — thêm field số vào Cfg mà quên khai ở đây thì luật cuối khối báo thẳng,
       không để một ô cấu hình mới lặng lẽ không được canh dải nào (đúng bẫy "ô cấu hình mồ côi" đã
       trả giá ba lần). */
    const NUM_RANGE: Record<string, NumRange> = {
      "step.failWatch": { min: 0, max: 100, unit: "%", why: "so với tỷ lệ thất bại của bước, luôn nằm trong 0–100%" },
      "step.failCrit": { min: 0, max: 100, unit: "%", why: "so với tỷ lệ thất bại của bước, luôn nằm trong 0–100%" },
      /* `covMin` KHÔNG còn ai đọc từ 07/08 (stepState bỏ nhánh so `obs.cov` — D4/F9): đây là ô cấu
         hình mồ côi đã ghi nhận, không phải phát hiện mới. Vẫn khai dải vì #/rules còn GHI ĐƯỢC vào
         nó, và một ô ghi được thì phải có dải — bỏ trống ở đây là để dành một chỗ cho số vô nghĩa. */
      "step.covMin": { min: 0, max: 100, unit: "%", why: "phần trăm độ phủ bằng chứng" },
      "step.effortMax": { min: 0, unit: "lần thử", why: "số lần thử; âm thì mọi bước đều vượt ngưỡng bất kể dữ liệu" },
      /* Band của chỉ số: đơn vị THEO TỪNG chỉ số (% hoàn tất, điểm CES, giây…) nên không có dải chung
         nào nói đúng cho cả sáu — chỉ đòi hữu hạn. Quan hệ crit/watch là việc của cfgIssues(). */
      "metric.*.watch": { why: "đơn vị theo từng chỉ số nên không có dải chung; chỉ đòi số hữu hạn" },
      "metric.*.crit": { why: "đơn vị theo từng chỉ số nên không có dải chung; chỉ đòi số hữu hạn" },
      "source.*": {
        int: true,
        min: 0,
        unit: "ngày",
        why: "so với số ngày nguồn còn thiếu (luôn nguyên ≥ 0); âm thì không nguồn nào đạt nhịp, thập phân thì nhãn \"SLA N ngày\" nói khác con số đang chấm",
      },
      "data.deadDays": {
        int: true,
        min: 1,
        unit: "ngày",
        why: "0 làm hai bậc \"đang trễ\" và \"im lặng\" không bao giờ tới được — nguồn vừa quá nhịp một ngày đã bị tuyên Ngừng gửi",
      },
      /* `data.anomalyX` và `data.repeatMin` ĐÃ BỎ 12/08 cùng field trong `CfgData` — hai ô mồ côi,
         không phép tính nào đọc (xem docblock data/schema/config.ts). Xoá dải ở đây là bắt buộc,
         không phải dọn dẹp thêm: khoá thừa trong bảng này không bị luật nào bắt, nên để lại là dựng
         sẵn một dải cho field không tồn tại. */
      "data.cooldown": { int: true, min: 0, unit: "ngày", why: "số ngày, hiện nguyên văn trên màn Nguồn dữ liệu" },
      "data.repeatWarn": { min: 0, max: 100, unit: "%", why: "so với repeat contact của điểm gãy, tính bằng %" },
      "data.churnWarn": { int: true, min: 0, unit: "khách", why: "số khách" },
      "anomaly.z": { minOpen: true, min: 0, unit: "σ", why: "điểm bất thường khi |z| ≥ ngưỡng; ở 0 thì mọi điểm tính được đều là bất thường" },
      /* Trọng số bảy khoá ưu tiên (ADR-002 §3). Dải từng ô là 0–100; TỔNG bằng 100 là một luật
         khác, nằm ở nhóm 25 bên dưới — bảng này chỉ nói về một leaf số một mình. */
      "pri.w.*": { min: 0, max: 100, unit: "% quyết định", why: "phần trăm sức nặng của một khoá; bảy khoá cộng lại đúng 100" },
      "pri.anchor.aff": { int: true, minOpen: true, min: 0, unit: "khách", why: "số khách ứng với mức tối đa của khoá; ở 0 thì mọi điểm gãy có khách đều kịch trần" },
      "pri.anchor.hv": { int: true, minOpen: true, min: 0, unit: "khách", why: "số khách giá trị cao ứng với mức tối đa; ở 0 thì mọi điểm gãy đều kịch trần" },
      "pri.anchor.tr": { minOpen: true, min: 0, unit: "%", why: "mức thay đổi ứng với mức tối đa; ở 0 thì mọi thay đổi dù nhỏ đều kịch trần" },
    };

    const specFor = (path: string[]): { key: string; spec: NumRange } | null => {
      for (const [key, spec] of Object.entries(NUM_RANGE)) {
        const segs = key.split(".");
        if (segs.length === path.length && segs.every((s, i) => s === "*" || s === path[i])) {
          return { key, spec };
        }
      }
      return null;
    };

    /* Đường dẫn để in: tầng khoá động hiện dạng ["id"] như nhóm 20 làm với cfg.segment.band["nav"] —
       cùng một màn đọc cả hai câu, hai lối viết khác nhau là mời đọc nhầm. */
    const pathLabel = (path: string[], key: string | null): string => {
      const segs = key ? key.split(".") : [];
      return "cfg" + path.map((p, i) => (segs[i] === "*" ? `["${p}"]` : `.${p}`)).join("");
    };

    const describe = (s: NumRange): string =>
      [
        s.int ? "số NGUYÊN" : "số",
        s.min === undefined ? "hữu hạn" : s.minOpen ? `> ${s.min}` : `≥ ${s.min}`,
        s.max === undefined ? null : `và ≤ ${s.max}`,
        s.unit ? `(${s.unit})` : null,
      ]
        .filter(Boolean)
        .join(" ");

    /* Lặn vào NHỮNG GÌ CFG ĐANG CÓ, không trên danh sách field viết tay — cùng lý lẽ nhóm 19/20:
       field owner mới thêm phải bị ĐÒI khai dải, chứ không lặng lẽ nằm ngoài mọi bất biến. */
    const numLeaves: Array<{ path: string[]; v: number }> = [];
    const walk = (node: unknown, path: string[]): void => {
      if (typeof node === "number") {
        numLeaves.push({ path, v: node });
        return;
      }
      if (!node || typeof node !== "object") return;
      for (const [k, v] of Object.entries(node)) walk(v, [...path, k]);
    };
    for (const [k, v] of Object.entries(cfg)) {
      if (k === "segment") continue;
      walk(v, [k]);
    }

    for (const { path, v } of numLeaves) {
      const hit = specFor(path);
      if (!hit) {
        e.push(
          `${pathLabel(path, null)} = ${String(v)}: field số này chưa khai dải hợp lệ ở nhóm 24 (data/validate.ts) — khai vào bảng NUM_RANGE, đừng để một ô cấu hình ghi được mà không bất biến nào canh`,
        );
        continue;
      }
      const { key, spec } = hit;
      const bad =
        !Number.isFinite(v) ||
        (spec.int === true && !Number.isInteger(v)) ||
        (spec.min !== undefined && (spec.minOpen ? v <= spec.min : v < spec.min)) ||
        (spec.max !== undefined && v > spec.max);
      if (bad) {
        e.push(`${pathLabel(path, key)} = ${String(v)} không hợp lệ: phải là ${describe(spec)} — ${spec.why}`);
      }
    }
  }

  /* 25. Điểm ưu tiên — trọng số, mốc "khách giá trị cao", và hai bảng mức theo bước (ADR-002).

     Vì sao TÁCH khỏi nhóm 24: nhóm 24 canh MỘT leaf số một mình (dải hợp lệ). Ba luật ở đây nói về
     QUAN HỆ — bảy trọng số cộng lại 100, nhãn "giá trị cao" phải là nhãn dải có thật của chiều đã
     chọn, khoá của `step.jc`/`step.reg` phải là bước có thật. Không luật nào trong số đó nhìn thấy
     được từ một con số đứng riêng.

     Cả ba đều đi qua `MockRepository.setCfg()` như mọi luật khác trong khối này, nên sửa sai trên
     #/rules bị chặn tại chỗ ghi và câu lỗi in nguyên văn vào ô "Không ghi được cấu hình" của đúng
     nhóm vừa sửa — người vận hành không bao giờ thấy một cấu hình nửa vời chạy trên màn. */
  if (cfg) {
    const PRI_KEYS_V: readonly string[] = ["sev", "aff", "jc", "rep", "tr", "reg", "hv"];
    const wKeys = Object.keys(cfg.pri?.w ?? {});
    for (const k of PRI_KEYS_V) {
      if (!wKeys.includes(k)) e.push(`cfg.pri.w: thiếu trọng số cho khoá "${k}" — bảy khoá phải có đủ, không khoá nào được rơi ra ngoài im lặng`);
    }
    for (const k of wKeys) {
      if (!PRI_KEYS_V.includes(k)) e.push(`cfg.pri.w["${k}"]: không phải khoá ưu tiên nào — bảy khoá là ${PRI_KEYS_V.join(", ")}`);
    }
    /* Cộng lại ĐÚNG 100 là thứ làm trọng số tự đọc được thành "khoá này chiếm bao nhiêu phần trăm
       quyết định". Tổng 94 (đúng bộ số cũ đang chạy) vẫn xếp hạng ra kết quả y hệt, nhưng lúc đó
       con số 22 trên màn không còn nghĩa nào nói ra được — và đó là toàn bộ lý do có thang này. */
    const wSum = Object.values(cfg.pri?.w ?? {}).reduce((a: number, b: number) => a + b, 0);
    if (wKeys.length > 0 && Math.round(wSum * 100) / 100 !== 100) {
      e.push(`cfg.pri.w: bảy trọng số cộng lại = ${String(Math.round(wSum * 100) / 100)}, phải đúng 100 — không đủ 100 thì con số từng ô không còn đọc được thành phần trăm quyết định`);
    }

    const hvDim = dims[cfg.hv?.dim ?? ""];
    if (!hvDim) {
      e.push(`cfg.hv.dim = "${String(cfg.hv?.dim)}": không có chiều nào tên vậy trong dims`);
    } else if (hvDim.base !== "cust" || !hvDim.cut) {
      e.push(`cfg.hv.dim = "${cfg.hv.dim}": không phải chiều khách chia được (thiếu base:'cust' hoặc cut) — "khách giá trị cao" phải đếm được trên một chiều của khách`);
    }
    /* KHÔNG kiểm nhãn trong `cfg.hv.values` có tồn tại hay không — cố ý, và đây là một lối đã thử
       rồi bỏ trong chính phiên này. Nhãn dải SINH từ `cfg.segment.band[dim].cuts`, nên hễ owner
       thêm một ranh giới NAV là nhãn cũ ("5tỷ+" → "5-8tỷ" + "8tỷ+") chết theo. Bắt nó ở đây thành
       lỗi bất biến nghĩa là `setCfg` chặn luôn việc SỬA RANH GIỚI — khoá mất một tính năng owner
       đã chốt ở Module E, chỉ để canh một chuỗi.

       Chỗ đúng để xử lý là phép đo: `measureHv` (data/priority.ts) trả *chưa tính được* khi khai
       báo đã lệch khỏi bộ nhãn hiện tại — không đếm một phần rồi im. Cùng luật không trộn
       chưa-biết với thiếu, chỉ áp ở tầng đọc thay vì tầng chặn. */

    const LEVELS = new Set<string>(["low", "mid", "high"]);
    for (const field of ["jc", "reg"] as const) {
      const m: Record<string, StepLevel> = cfg.step?.[field] ?? {};
      for (const [stepId, lv] of Object.entries(m)) {
        if (!lookup.steps.has(stepId)) {
          e.push(`cfg.step.${field}["${stepId}"]: không có bước nào id vậy — mức khai cho một bước không tồn tại thì không điểm gãy nào đọc tới`);
        }
        if (!LEVELS.has(lv)) {
          e.push(`cfg.step.${field}["${stepId}"] = "${String(lv)}": mức không hợp lệ (phải là low, mid hoặc high)`);
        }
      }
    }
  }

  return e;
}
