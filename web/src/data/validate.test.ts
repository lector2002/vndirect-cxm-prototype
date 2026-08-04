import { describe, it, expect } from "vitest";
import { seed, seedNav, seedTour, dims, cfgDefault } from "./fixtures/seed.ts";
import { validateFixture } from "./validate.ts";
import type { CxmData } from "./schema/index.ts";

describe("validateFixture", () => {
  it("positive: seed passes all 19 groups", () => {
    expect(validateFixture(seed, dims, seedNav, seedTour, cfgDefault)).toEqual([]);
  });

  /* Group 1: ID trùng */
  it("1: ID trùng", () => {
    const d = structuredClone(seed) as CxmData;
    d.steps[0] = { ...d.steps[0], id: d.flows[0].id };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("ID trùng"))).toBe(true);
  });

  /* Group 2: stationId */
  it("2: thiếu stationId", () => {
    const d = structuredClone(seed) as CxmData;
    d.steps[0] = { ...d.steps[0], stationId: "" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("thiếu stationId"))).toBe(true);
  });

  it("2: stationId trùng", () => {
    const d = structuredClone(seed) as CxmData;
    d.steps[1] = { ...d.steps[1], stationId: d.steps[0].stationId };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("stationId trùng"))).toBe(true);
  });

  /* Group 3: Issue */
  it("3: issue step không tồn tại", () => {
    const d = structuredClone(seed) as CxmData;
    d.iss[0] = { ...d.iss[0], step: "s-nonexistent" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("step s-nonexistent"))).toBe(true);
  });

  it("3: priority.total sai", () => {
    const d = structuredClone(seed) as CxmData;
    d.iss[0] = { ...d.iss[0], pri: { ...d.iss[0].pri, total: 999 } };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("priority.total"))).toBe(true);
  });

  /* Group 4: Action */
  it("4: triển khai trước khi duyệt", () => {
    const d = structuredClone(seed) as CxmData;
    d.act[0] = { ...d.act[0], ap: "pending", dl: "in-progress" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("triển khai trước"))).toBe(true);
  });

  /* Module A — Action.cf ⟺ Snapshot (nhóm 4) */
  it("4: cf=confirmed nhưng thiếu snapshot", () => {
    const d = structuredClone(seed) as CxmData;
    const confirmedAction = d.act.find((a) => a.cf === "confirmed")!;
    d.snap = d.snap.filter((s) => s.iss !== confirmedAction.iss);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("cf=confirmed nhưng thiếu snapshot"))).toBe(true);
  });

  it("4: cf=pending nhưng đã có snapshot", () => {
    const d = structuredClone(seed) as CxmData;
    const pendingAction = d.act.find((a) => a.cf === "pending")!;
    d.snap = [
      ...d.snap,
      { iss: pendingAction.iss, at: "15/07/2026", by: "Test",
        m: { v: 1, u: "%", p: "test", n: 1 },
        obs: { stepId: "s1", entered: 1, completed: 1, failed: 0, effort: 1, cov: 100 } },
    ];
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("cf=pending nhưng đã có snapshot"))).toBe(true);
  });

  it("4: cf=pending nhưng đã duyệt (ap)", () => {
    const d = structuredClone(seed) as CxmData;
    const pendingAction = d.act.find((a) => a.cf === "pending")!;
    d.act = d.act.map((a) => (a.id === pendingAction.id ? { ...a, ap: "approved" as const } : a));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("chưa xác nhận thì không thể đã duyệt"))).toBe(true);
  });

  /* Correction A5: action.sm (đọc lúc advanceAction) phải khớp issue.metric (đóng băng base lúc
     confirmIssue) — hai field khác nhau nuôi hai vế của MỘT so sánh, lệch nhau là so hai chỉ số
     khác nhau mà tưởng là một. */
  it("4: action.sm khác issue.metric", () => {
    const d = structuredClone(seed) as CxmData;
    const a0 = d.act[0];
    const issue = d.iss.find((i) => i.id === a0.iss)!;
    const otherMetric = d.metrics.find((m) => m.id !== issue.metric)!.id;
    d.act = d.act.map((a) => (a.id === a0.id ? { ...a, sm: otherMetric } : a));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("khác metric của issue"))).toBe(true);
  });

  /* Group 5: Voice Insight handoff */
  it("5: chưa đủ đk handoff nhưng vẫn gắn issue", () => {
    const d = structuredClone(seed) as CxmData;
    d.ins[3] = { ...d.ins[3], hoEl: false, hoIssue: "CXI-021" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("chưa đủ điều kiện"))).toBe(true);
  });

  /* Group 6: Nguồn & khảo sát */
  it("6: trigger survey không khớp", () => {
    const d = structuredClone(seed) as CxmData;
    d.surveys[0] = { ...d.surveys[0], trigger: "unknown_event_xyz" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("trigger"))).toBe(true);
  });

  /* Group 7: Signal dòng tiền */
  it("7: signal dòng tiền sai es", () => {
    const d = structuredClone(seed) as CxmData;
    d.flows.push({ id: "f-test-m", groupId: "g-in", name: "t", owner: "x", version: "v1", src: "\u2014", verified: false, observed: false, note: "" });
    d.steps.push({ id: "s-test", flowId: "f-test-m", code: "01", name: "t", stationId: "JS-TEST-01", owner: "x" });
    d.touchpoints.push({ id: "tp-test", stepId: "s-test", name: "t", channel: "app", owner: "x", users: 10, desc: "" });
    d.signals.push({ id: "sg-test", tpId: "tp-test", name: "deposit_test", st: "live", pf: [], es: "client", vol: 1, seen: null, metrics: [], desc: "" });
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("d\u00F2ng ti\u1EC1n"))).toBe(true);
  });

  /* Group 8: Taxonomy cấu trúc */
  it("8: parent sai tầng", () => {
    const d = structuredClone(seed) as CxmData;
    const l3 = d.tax.find((t) => t.lv === "L3")!;
    d.tax = d.tax.map((t) => t.id === l3.id ? { ...t, lv: "theme" as const } : t);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("sai tầng cha"))).toBe(true);
  });

  /* Group 8 (mở rộng 01/08 — field tax mới): theme phải khai cat/pts, drift phải có note */
  it("8: theme thiếu cat", () => {
    const d = structuredClone(seed) as CxmData;
    const th = d.tax.find((t) => t.lv === "theme")!;
    d.tax = d.tax.map((t) => (t.id === th.id ? { ...t, cat: undefined } : t));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("theme thiếu cat"))).toBe(true);
  });

  it("8: theme có cat không tồn tại trong cats", () => {
    const d = structuredClone(seed) as CxmData;
    const th = d.tax.find((t) => t.lv === "theme")!;
    d.tax = d.tax.map((t) => (t.id === th.id ? { ...t, cat: "khong-co-that" } : t));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes('cat "khong-co-that" không có trong cats'))).toBe(true);
  });

  it("8: theme thiếu pts (không tính được xu hướng)", () => {
    const d = structuredClone(seed) as CxmData;
    const th = d.tax.find((t) => t.lv === "theme")!;
    d.tax = d.tax.map((t) => (t.id === th.id ? { ...t, pts: [42] } : t));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("cần pts ít nhất 2 kỳ"))).toBe(true);
  });

  it("8: drift trần không kèm driftNote", () => {
    const d = structuredClone(seed) as CxmData;
    d.tax = d.tax.map((t) => (t.id === d.tax[0].id ? { ...t, drift: "shifting", driftNote: undefined } : t));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("thiếu driftNote"))).toBe(true);
  });

  /* Group 9: Evidence × taxonomy */
  it("9: evidence cat không tồn tại trong cats", () => {
    const d = structuredClone(seed) as CxmData;
    d.ev[0] = { ...d.ev[0], cat: "khong-co-that" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes('cat "khong-co-that" không có trong cats'))).toBe(true);
  });

  it("9: evidence thiếu L1", () => {
    const d = structuredClone(seed) as CxmData;
    d.ev[0] = { ...d.ev[0], tax: d.ev[0].tax.filter((tid) => !d.tax.find((tn) => tn.id === tid && tn.lv === "L1")) };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("đúng 1 node L1"))).toBe(true);
  });

  it("9: evidence có 2 theme", () => {
    const d = structuredClone(seed) as CxmData;
    const themes = d.tax.filter((t) => t.lv === "theme");
    const ev = d.ev.find((x) => x.tax.some((tid) => themes.find((t) => t.id === tid)))!;
    const extra = themes.find((t) => ev.tax.indexOf(t.id) === -1)!;
    d.ev = d.ev.map((x) => (x.id === ev.id ? { ...x, tax: [...x.tax, extra.id] } : x));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("đúng 1 node theme"))).toBe(true);
  });

  it("9: subtheme thiếu theme cha", () => {
    const d = structuredClone(seed) as CxmData;
    const subIds = new Set(d.tax.filter((t) => t.lv === "subtheme").map((t) => t.id));
    const ev = d.ev.find((x) => x.tax.some((tid) => subIds.has(tid)))!;
    const sub = d.tax.find((t) => t.id === ev.tax.find((tid) => subIds.has(tid)))!;
    d.ev = d.ev.map((x) => (x.id === ev.id ? { ...x, tax: x.tax.filter((tid) => tid !== sub.parentId) } : x));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("thiếu theme cha"))).toBe(true);
  });

  /* 16 (03/08): mark tách theo kind. Set phẳng cũ gộp cả 5 mark nên `{kind:'show', chart:'trend'}` —
     ảnh chụp một chiều mà đòi vẽ đường thời gian — đi qua được. Phải CAST vì type `ShowMark` giờ đã
     chặn tổ hợp này ở biên dịch; luật runtime là để đỡ nguồn JSON/API thật khi tích hợp, cùng lối đã
     dùng cho guard `unsupported` của CrossTable. */
  it("16: kind 'show' mang mark của series ('trend') → chặn", () => {
    const d = structuredClone(seed) as CxmData;
    const bad = { id: "q-badmark", kind: "show", show: "theme", metric: "count", chart: "trend", name: "bad" };
    d.qt = [bad as unknown as (typeof d.qt)[number], ...d.qt];
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("không dùng được cho kind 'show'"))).toBe(true);
  });

  /* 16 (thêm 03/08 sau khảo sát nền tảng): `metric:'pct'` là % trên TỔNG cohort, `stack:'pct'` là tỷ
     trọng TRONG từng hàng — hai mẫu số. Bật cả hai thì QuantifyWidget in nhãn trục dọc "% trên tổng"
     trong khi nhãn đáy nói "(100%) trong từng <đơn vị>": hình NÓI SAI, không phải giới hạn kỹ thuật.
     Trước luật này tổ hợp đó qua được cả validate lẫn builder. */
  it("16: metric 'pct' + stack 'pct' trên cùng item → chặn (hai mẫu số)", () => {
    const d = structuredClone(seed) as CxmData;
    d.qt = d.qt.map((q) => (q.id === "q19" && q.kind === "show" ? { ...q, metric: "pct", stack: "pct" as const } : q));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("hai mẫu số khác nhau"))).toBe(true);
  });

  /* Group 10: Dashboard set */
  it("10: sec sai", () => {
    const d = structuredClone(seed) as CxmData;
    d.dash[0] = { ...d.dash[0], sec: "invalid-sec" };
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("phải là voc hoặc cxm"))).toBe(true);
  });

  it("10: block trỏ Quantify ma", () => {
    const d = structuredClone(seed) as CxmData;
    const ds = d.dash[0];
    d.dash = d.dash.map((x) =>
      x.id === ds.id ? { ...x, qs: x.qs.map((qq, i) => (i === 0 ? { ...qq, b: [...qq.b, "q-ghost"] } : qq)) } : x,
    );
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("Quantify q-ghost không tồn tại"))).toBe(true);
  });

  it("10: block @cxm gắn vào set voc", () => {
    const d = structuredClone(seed) as CxmData;
    const voc = d.dash.find((x) => x.sec === "voc")!;
    d.dash = d.dash.map((x) =>
      x.id === voc.id ? { ...x, qs: x.qs.map((qq, i) => (i === 0 ? { ...qq, b: [...qq.b, "@toppri"] } : qq)) } : x,
    );
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("@toppri") && e.includes("thuộc phần cxm"))).toBe(true);
  });

  it("10: phần thiếu set mặc định", () => {
    const d = structuredClone(seed) as CxmData;
    const def = d.dash.find((x) => x.sec === "voc" && x.def)!;
    d.dash = d.dash.map((x) => (x.id === def.id ? { ...x, def: false } : x));
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("phải có đúng 1 set mặc định"))).toBe(true);
  });

  it("10: CFG.sub trỏ set ma", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.sub["ghost-set"] = { f: "off", ch: "Email" };
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("CFG.sub") && e.includes("ghost-set"))).toBe(true);
  });

  /* Group 11: Agent / loop / outcome */
  it("11: loop done > need", () => {
    const d = structuredClone(seed) as CxmData;
    d.loop[0] = { ...d.loop[0], done: 999 };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("done"))).toBe(true);
  });

  /* Module A — Snapshot integrity (nhóm 11) */
  it("11: snapshot trỏ issue ma", () => {
    const d = structuredClone(seed) as CxmData;
    d.snap = d.snap.map((s, i) => (i === 0 ? { ...s, iss: "CXI-nonexistent" } : s));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("issue CXI-nonexistent không tồn tại"))).toBe(true);
  });

  it("11: snapshot trùng issue", () => {
    const d = structuredClone(seed) as CxmData;
    d.snap = [...d.snap, { ...d.snap[0] }];
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("có nhiều hơn 1 snapshot"))).toBe(true);
  });

  it("11: snapshot obs.stepId không tồn tại", () => {
    const d = structuredClone(seed) as CxmData;
    d.snap = d.snap.map((s, i) => (i === 0 ? { ...s, obs: { ...s.obs, stepId: "s-nonexistent" } } : s));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("obs.stepId s-nonexistent không tồn tại"))).toBe(true);
  });

  /* Module A — xác nhận seed nguyên bản không vi phạm 5 luật cf/snapshot mới lẫn 18 nhóm cũ. */
  it("cf/snapshot: seed nguyên bản qua hết validateFixture", () => {
    const r = validateFixture(seed, dims, seedNav, seedTour, cfgDefault);
    expect(r).toEqual([]);
  });

  /* Group 12: Bản đồ */
  it("12: group phase sai", () => {
    const d = structuredClone(seed) as CxmData;
    d.groups[0] = { ...d.groups[0], phaseId: "p-nonexistent" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("phase"))).toBe(true);
  });

  /* Group 13: PROVENANCE */
  it("13: verified/sai src khớp", () => {
    const d = structuredClone(seed) as CxmData;
    const f = d.flows.find((fl) => fl.verified === true)!;
    d.flows = d.flows.map((fl) => fl.id === f.id ? { ...fl, src: "\u2014" } : fl);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("sai khớp"))).toBe(true);
  });

  /* Group 14: Flow observed */
  it("14: !observed nhưng có bước", () => {
    const d = structuredClone(seed) as CxmData;
    const f = d.flows.find((fl) => fl.observed === true)!;
    d.flows = d.flows.map((fl) => fl.id === f.id ? { ...fl, observed: false } : fl);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("!observed"))).toBe(true);
  });

  /* Group 15: Taxonomy ↔ map */
  it("15: tổng con > cha", () => {
    const d = structuredClone(seed) as CxmData;
    const parent = d.tax.find((t) => t.lv === "L2" && d.tax.some((k) => k.parentId === t.id))!;
    d.tax = d.tax.map((t) => t.id === parent.id ? { ...t, n: 0 } : t);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("> cha"))).toBe(true);
  });

  it("15: L2 maps trỏ id ma", () => {
    const d = structuredClone(seed) as CxmData;
    const l2 = d.tax.find((t) => t.lv === "L2" && t.maps !== undefined && t.maps !== null)!;
    d.tax = d.tax.map((t) => t.id === l2.id ? { ...t, maps: "nonexistent-id" } : t);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("maps") && e.includes("không trỏ group/flow"))).toBe(true);
  });

  it("15: L3 maps trỏ id ma", () => {
    const d = structuredClone(seed) as CxmData;
    const l3 = d.tax.find((t) => t.lv === "L3" && t.maps !== undefined && t.maps !== null)!;
    d.tax = d.tax.map((t) => t.id === l3.id ? { ...t, maps: "ghost-step" } : t);
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("maps") && e.includes("không trỏ step/flow"))).toBe(true);
  });

  /* Group 16: Saved Quantify */
  it("16: Quantify chiều không tồn tại", () => {
    const d = structuredClone(seed) as CxmData;
    d.qt = [{ id: "q-bad", kind: "show" as const, show: "nonexistent-dim", metric: "count", chart: "rank" as const, name: "bad" }, ...d.qt];
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("chiều"))).toBe(true);
  });

  /* Group 17: Guided tour */
  it("17: tour route sai", () => {
    const badTour = [{ r: "nonexistent-route", grp: "test", sel: "#test", t: "test", d: "test" }];
    const r = validateFixture(seed, dims, seedNav, badTour);
    expect(r.some((e) => e.includes("route"))).toBe(true);
  });

  /* Group 18: Nav */
  it("18: nav route sai", () => {
    const badNav = [{ r: "nonexistent-route", l: "Bad Nav" }];
    const r = validateFixture(seed, dims, badNav, seedTour);
    expect(r.some((e) => e.includes("route"))).toBe(true);
  });

  /* Group 19: Phân khúc khách — age/nav/tenure/acq */
  it("19: age không phải band hợp lệ cũng không phải sentinel", () => {
    const d = structuredClone(seed) as CxmData;
    d.cust = d.cust.map((c, i) => (i === 0 ? { ...c, age: "99-100" as unknown as typeof c.age } : c));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("age") && e.includes("không hợp lệ"))).toBe(true);
  });

  it("19: seg \"Khách 50+\" nhưng age khác 50+", () => {
    const d = structuredClone(seed) as CxmData;
    const c50 = d.cust.find((c) => c.seg === "Khách 50+")!;
    d.cust = d.cust.map((c) => (c.key === c50.key ? { ...c, age: "25-34" as typeof c.age } : c));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes('seg "Khách 50+"') && e.includes("khác 50+"))).toBe(true);
  });

  /* Thay test "high-value ⟹ nav không sentinel" (bất biến C1 cũ) bằng luật MẠNH HƠN kể từ 04/08: nav
     không nhận sentinel cho BẤT KỲ khách nào, vì NAV lấy trực tiếp từ tài sản hiện tại. Ép vào một
     khách thường (không phải high-value) để chứng minh rule không chỉ áp cho nhóm high-value. */
  it("19: nav là sentinel ở khách THƯỜNG cũng đỏ (NAV luôn tính được từ tài sản hiện tại)", () => {
    const d = structuredClone(seed) as CxmData;
    const normal = d.cust.find((c) => c.tier !== "high-value")!;
    d.cust = d.cust.map((c) => (c.key === normal.key ? { ...c, nav: "chưa-biết" as typeof c.nav } : c));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("nav") && e.includes("sentinel"))).toBe(true);
  });

  it("19: nav 'thiếu' (bug pipeline) cũng đỏ — trục này không có chỗ cho ổ thiếu nữa", () => {
    const d = structuredClone(seed) as CxmData;
    d.cust = d.cust.map((c, i) => (i === 0 ? { ...c, nav: "thiếu" as typeof c.nav } : c));
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("nav") && e.includes("sentinel"))).toBe(true);
  });

  /* Group 20: Cfg.segment (module E, E-a — cfg là source of truth cho ranh giới dải) */
  it("20: cuts rỗng", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.nav.cuts = [];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.nav") && e.includes("cuts rỗng"))).toBe(true);
  });

  it("20: cuts không tăng dần nghiêm ngặt", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.nav.cuts = [50e6, 40e6, 1e9, 5e9];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.nav") && e.includes("không tăng dần"))).toBe(true);
  });

  it("20: cuts trùng nhau cũng bị chặn (không tăng dần NGHIÊM NGẶT)", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.nav.cuts = [50e6, 50e6, 1e9, 5e9];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.nav") && e.includes("không tăng dần"))).toBe(true);
  });

  it("20: min >= cut đầu", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.age.min = 25;
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.age") && e.includes("min") && e.includes(">="))).toBe(true);
  });

  it("20: unit không thuộc 3 giá trị cho phép", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.tenure = { ...cfg.segment.tenure, unit: "usd" as typeof cfg.segment.tenure.unit };
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.tenure") && e.includes("unit") && e.includes("không hợp lệ"))).toBe(true);
  });

  it("20: acq.values rỗng", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.acq.values = [];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.acq") && e.includes("values rỗng"))).toBe(true);
  });

  it("20: acq.values có tên trùng", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.acq.values = ["banner", "banner", "chi nhánh"];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.acq") && e.includes('"banner"') && e.includes("trùng"))).toBe(true);
  });

  it("20: thiếu trục nav trong cfg.segment (nguồn ngoài tsc, ví dụ JSON cũ)", () => {
    const cfg = structuredClone(cfgDefault) as unknown as { segment: Record<string, unknown> };
    delete cfg.segment.nav;
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg as unknown as Parameters<typeof validateFixture>[4]);
    expect(r.some((e) => e.includes('thiếu trục "nav"'))).toBe(true);
  });

  /* Cấu hình dưới đây hợp lệ theo MỌI luật khác của nhóm 20 (cuts tăng dần nghiêm ngặt, min null,
     unit đúng) và là đúng dạng owner cần để tách nhóm CHƯA CÓ TÀI SẢN khỏi "<50tr" — nên nếu không
     có luật nhãn-trùng, nó lọt qua validate rồi làm hai dải bị cộng dồn im lặng lúc đếm. */
  it("20: hai cut quá sát 0 ⇒ hai dải nav cùng ra nhãn '0đ'", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.nav = { min: null, cuts: [1, 2, 50e6, 200e6], unit: "đ" };
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.nav") && e.includes('"0đ"') && e.includes("hai dải"))).toBe(true);
  });

  it("20: nav + MỘT cut sát 0 vẫn hợp lệ — tách được '0đ' khỏi '<50tr'", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.nav = { min: null, cuts: [1, 50e6, 200e6, 1e9, 5e9], unit: "đ" };
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r).toEqual([]);
  });

  it("20: cfgDefault hợp lệ — segment mới không vi phạm luật nào", () => {
    const r = validateFixture(seed, dims, seedNav, seedTour, cfgDefault);
    expect(r).toEqual([]);
  });

  /* Group 21: Evidence.ck — luật ĐỊNH DẠNG (F4, module-f-charter.md) */
  it("21: ck rỗng", () => {
    const d = structuredClone(seed) as CxmData;
    d.ev[0] = { ...d.ev[0], ck: "" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes(d.ev[0].id) && e.includes("ck rỗng"))).toBe(true);
  });

  it("21: ck chỉ toàn khoảng trắng cũng bị bắt như rỗng", () => {
    const d = structuredClone(seed) as CxmData;
    d.ev[0] = { ...d.ev[0], ck: "   " };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes(d.ev[0].id) && e.includes("ck rỗng"))).toBe(true);
  });

  it("21: ck sai dạng (không phải 'Ẩn danh', không đúng KH•••XXX)", () => {
    const d = structuredClone(seed) as CxmData;
    d.ev[0] = { ...d.ev[0], ck: "abc-123" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes(d.ev[0].id) && e.includes("sai dạng") && e.includes("abc-123"))).toBe(true);
  });

  it("21: ck = 'Ẩn danh' là HỢP LỆ dù không tra ra khách nào (loại 'không biết' thứ ba)", () => {
    const d = structuredClone(seed) as CxmData;
    d.ev[0] = { ...d.ev[0], ck: "Ẩn danh" };
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes(d.ev[0].id) && e.includes("ck"))).toBe(false);
  });

  it("21: seed nguyên bản qua hết luật ck — 7/17 dòng có ck không tra ra khách nhưng ĐÚNG DẠNG nên không lỗi", () => {
    const r = validateFixture(seed, dims, seedNav, seedTour, cfgDefault);
    expect(r).toEqual([]);
  });
});