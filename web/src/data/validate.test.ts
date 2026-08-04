import { describe, it, expect } from "vitest";
import { seed, seedNav, seedTour, dims, cfgDefault } from "./fixtures/seed.ts";
import { validateFixture } from "./validate.ts";
import { projectCustomerBands } from "./projectBands.ts";
import { NOT_IDENTIFIED } from "./projectSignalCounts.ts";
import type { CxmData, Signal, SigCount } from "./schema/index.ts";

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
    d.signals.push({ id: "sg-test", tpId: "tp-test", name: "deposit_test", st: "live", pf: [], es: "client", vol: 1, seen: null, metrics: [], desc: "", values: [] });
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
    /* q19 (item có `split`) đã bỏ khỏi seed.qt (S4) — không còn item nào dùng `split` để sửa tại
       chỗ, tự dựng item tại đây, đúng lối test "16: kind 'show' mang mark của series" phía trên. */
    const bad = {
      id: "q-splitpct", kind: "show" as const, show: "acq", split: "nav",
      metric: "pct" as const, stack: "pct" as const, chart: "rank" as const, name: "bad",
    };
    d.qt = [bad, ...d.qt];
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

  /* Group 19: Phân khúc khách — age/nav/tenure/acq.
     Kể từ 04/08 nhóm này kiểm theo CẶP (số thô là nguồn, nhãn là ảnh chiếu — data/projectBands.ts)
     thay vì đối chiếu nhãn với một danh sách gõ tay. Nên "nhãn sai" giờ có nghĩa là "nhãn không khớp
     số thô", và luật này CẦN cfg (nhãn hợp lệ do `cuts` sinh) — vì thế các ca dưới truyền cfgDefault. */
  it("19: nhãn dải không khớp số thô (nhãn bị sửa tay)", () => {
    const d = structuredClone(seed) as CxmData;
    d.cust = d.cust.map((c, i) => (i === 0 ? { ...c, bands: { ...c.bands, age: "99-100" } } : c));
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("age") && e.includes("không khớp ageYears"))).toBe(true);
  });

  it("19: seg \"Khách 50+\" nhưng tuổi thật chưa tới 50", () => {
    const d = structuredClone(seed) as CxmData;
    const c50 = d.cust.find((c) => c.seg === "Khách 50+")!;
    /* Sửa TUỔI THẬT, không sửa nhãn: luật này so `ageYears >= 50` để không báo sai khi owner đổi cut
       tuổi (nhãn dải cuối thành "60+" nhưng nghĩa nghiệp vụ của segment vẫn là "từ 50 tuổi"). */
    d.cust = d.cust.map((c) => (c.key === c50.key ? { ...c, ageYears: 30, bands: { ...c.bands, age: "25-34" } } : c));
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes('seg "Khách 50+"') && e.includes("chưa tới 50"))).toBe(true);
  });

  /* Thay test "high-value ⟹ nav không sentinel" (bất biến C1 cũ) bằng luật MẠNH HƠN kể từ 04/08: nav
     không nhận sentinel cho BẤT KỲ khách nào, vì NAV lấy trực tiếp từ tài sản hiện tại. Ép vào một
     khách thường (không phải high-value) để chứng minh rule không chỉ áp cho nhóm high-value. */
  /* Sentinel nav kiểm trên `navVnd` (SỐ THÔ), không trên nhãn: nhãn chỉ là ảnh chiếu, nên sentinel
     lọt vào nhãn thì gốc phải ở số thô. Ép vào chính số thô là ép đúng chỗ luật canh. */
  it("19: navVnd là sentinel ở khách THƯỜNG cũng đỏ (NAV luôn tính được từ tài sản hiện tại)", () => {
    const d = structuredClone(seed) as CxmData;
    const normal = d.cust.find((c) => c.tier !== "high-value")!;
    d.cust = d.cust.map((c) =>
      c.key === normal.key ? { ...c, navVnd: "chưa-biết" as typeof c.navVnd, bands: { ...c.bands, nav: "chưa-biết" } } : c,
    );
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("navVnd") && e.includes("sentinel"))).toBe(true);
  });

  it("19: navVnd 'thiếu' (bug pipeline) cũng đỏ — trục này không có chỗ cho ổ thiếu nữa", () => {
    const d = structuredClone(seed) as CxmData;
    d.cust = d.cust.map((c, i) =>
      i === 0 ? { ...c, navVnd: "thiếu" as typeof c.navVnd, bands: { ...c.bands, nav: "thiếu" } } : c,
    );
    const r = validateFixture(d, dims, seedNav, seedTour);
    expect(r.some((e) => e.includes("navVnd") && e.includes("sentinel"))).toBe(true);
  });

  /* Group 20: Cfg.segment (module E, E-a — cfg là source of truth cho ranh giới dải) */
  it("20: cuts rỗng", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.nav.cuts = [];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.band[\"nav\"]") && e.includes("cuts rỗng"))).toBe(true);
  });

  it("20: cuts không tăng dần nghiêm ngặt", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.nav.cuts = [50e6, 40e6, 1e9, 5e9];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.band[\"nav\"]") && e.includes("không tăng dần"))).toBe(true);
  });

  it("20: cuts trùng nhau cũng bị chặn (không tăng dần NGHIÊM NGẶT)", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.nav.cuts = [50e6, 50e6, 1e9, 5e9];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.band[\"nav\"]") && e.includes("không tăng dần"))).toBe(true);
  });

  it("20: min >= cut đầu", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.age.min = 25;
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes('cfg.segment.band["age"]') && e.includes("min") && e.includes(">="))).toBe(true);
  });

  /* Đổi trục canh từ 'tenure' sang 'nav' (S2, 04/08): `tenure` đã rút khỏi `cfgDefault.segment.band`
     nên không còn axis nào ở đó để sửa tại chỗ — cùng phép kiểm, chỉ đổi trục còn tồn tại. */
  it("20: unit không thuộc 3 giá trị cho phép", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.nav = { ...cfg.segment.band.nav, unit: "usd" as typeof cfg.segment.band.nav.unit };
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes('cfg.segment.band["nav"]') && e.includes("unit") && e.includes("không hợp lệ"))).toBe(true);
  });

  it("20: acq.values rỗng", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.values.acq = [];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes('cfg.segment.values["acq"]') && e.includes("rỗng"))).toBe(true);
  });

  it("20: acq.values có tên trùng", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.values.acq = ["banner", "banner", "chi nhánh"];
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes('cfg.segment.values["acq"]') && e.includes('"banner"') && e.includes("trùng"))).toBe(true);
  });

  it("20: thiếu trục nav trong cfg.segment (nguồn ngoài tsc, ví dụ JSON cũ)", () => {
    const cfg = structuredClone(cfgDefault) as unknown as { segment: { band: Record<string, unknown> } };
    delete cfg.segment.band.nav;
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg as unknown as Parameters<typeof validateFixture>[4]);
    expect(r.some((e) => e.includes('thiếu ranh giới cho chiều "nav"'))).toBe(true);
  });

  /* Cấu hình dưới đây hợp lệ theo MỌI luật khác của nhóm 20 (cuts tăng dần nghiêm ngặt, min null,
     unit đúng) và là đúng dạng owner cần để tách nhóm CHƯA CÓ TÀI SẢN khỏi "<50tr" — nên nếu không
     có luật nhãn-trùng, nó lọt qua validate rồi làm hai dải bị cộng dồn im lặng lúc đếm. */
  it("20: hai cut quá sát 0 ⇒ hai dải nav cùng ra nhãn '0đ'", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.nav = { min: null, cuts: [1, 2, 50e6, 200e6], unit: "đ" };
    const r = validateFixture(seed, dims, seedNav, seedTour, cfg);
    expect(r.some((e) => e.includes("cfg.segment.band[\"nav\"]") && e.includes('"0đ"') && e.includes("hai dải"))).toBe(true);
  });

  it("20: nav + MỘT cut sát 0 vẫn hợp lệ — tách được '0đ' khỏi '<50tr'", () => {
    const cfg = structuredClone(cfgDefault);
    cfg.segment.band.nav = { min: null, cuts: [1, 50e6, 200e6, 1e9, 5e9], unit: "đ" };
    /* Phải CHIẾU LẠI khách theo cfg đang kiểm: nhãn dải của `seed` là ảnh chiếu theo `cfgDefault`,
       nên đem nguyên nó đi kiểm với bộ cut khác thì nhóm 19 báo lệch nhãn/số thô — đúng luật, vì
       nhãn '<50tr' thật sự sai với cut mới (khách navVnd=0 giờ thuộc '0đ'). Đây chính là hợp đồng
       mới: đổi cut thì phải đọc lại snapshot (MockRepository.getSnapshot làm việc này). */
    const r = validateFixture(projectCustomerBands(seed, cfg, dims), dims, seedNav, seedTour, cfg);
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

  /* Group 22: chart điểm đo — sigCounts (thiết kế: output/thiet-ke-chart-signal.html §2/§3).
     seed.signals (sg1..sg10) không có sigCounts nào (seed.sigCounts=[] — Demo Mode tắt, trạng thái
     trung thực), nên dựng một signal test riêng ("sg-x") + sigCounts CHỈ của signal đó — không
     đụng tới 10 signal thật, không ảnh hưởng các nhóm luật khác.

     `withSigX` THAY HẲN d.signals (không PUSH thêm vào 10 signal thật của seed): sau khi validate.ts
     siết thêm luật "vol>0 mà 0 dòng trong sigCounts không rỗng ⇒ lỗi", nếu vẫn giữ 10 signal thật
     cùng lúc (chúng có vol>0 nhưng không có mặt trong sigCounts CỦA RIÊNG TEST NÀY) thì luật mới sẽ
     báo lỗi SAI cho cả sg1..sg10 — phá mọi test bên dưới. THAY là cách đúng để giữ đúng ý cô lập đã
     nêu ở trên, không phải nới lỏng gì.

     Mô hình 10 lần bắn của "sg-x": 3 fires val='a' biết khách (acq=banner, nav=<50tr, age=18-24,
     tier=new, pf=ios) + 2 fires val='a' KHÔNG biết khách (pf=android) + 4 fires val='b' biết khách
     (acq=chi nhánh, nav=50-200tr, age=25-34, tier=standard, pf=ios) + 1 fire val='b' không biết
     khách (pf=android). Tổng = 10 = vol. */
  function sigXSignal(): Signal {
    return {
      id: "sg-x", tpId: "tp1", name: "test_signal", st: "live", pf: ["ios", "android"], es: "client",
      vol: 10, seen: null, metrics: [], desc: "signal test cho nhóm 22", values: ["a", "b"],
    };
  }

  /* Signal ĐỒNG HÀNH cho hai test "vắng mặt hoàn toàn" mới — cần MỘT signal khác sg-x có vol>0
     nhưng KHÔNG có dòng nào trong sigCounts, trong khi bảng sigCounts vẫn có dòng (của sig-x), để
     phân biệt "riêng signal này vắng mặt" khỏi "cả bảng rỗng". */
  function sigYSignal(): Signal {
    return {
      id: "sg-y", tpId: "tp1", name: "test_signal_y", st: "live", pf: ["ios"], es: "client",
      vol: 5, seen: null, metrics: [], desc: "signal test thứ hai cho nhóm 22 — cố tình KHÔNG có sigCounts", values: ["z"],
    };
  }

  function baseSigXCounts(): SigCount[] {
    return [
      { sig: "sg-x", dim: "acq", val: "a", band: "banner", n: 3 },
      { sig: "sg-x", dim: "acq", val: "a", band: NOT_IDENTIFIED, n: 2 },
      { sig: "sg-x", dim: "nav", val: "a", band: "<50tr", n: 3 },
      { sig: "sg-x", dim: "nav", val: "a", band: NOT_IDENTIFIED, n: 2 },
      { sig: "sg-x", dim: "age", val: "a", band: "18-24", n: 3 },
      { sig: "sg-x", dim: "age", val: "a", band: NOT_IDENTIFIED, n: 2 },
      { sig: "sg-x", dim: "tier", val: "a", band: "new", n: 3 },
      { sig: "sg-x", dim: "tier", val: "a", band: NOT_IDENTIFIED, n: 2 },
      { sig: "sg-x", dim: "sigpf", val: "a", band: "ios", n: 3 },
      { sig: "sg-x", dim: "sigpf", val: "a", band: "android", n: 2 },
      { sig: "sg-x", dim: "acq", val: "b", band: "chi nhánh", n: 4 },
      { sig: "sg-x", dim: "acq", val: "b", band: NOT_IDENTIFIED, n: 1 },
      { sig: "sg-x", dim: "nav", val: "b", band: "50-200tr", n: 4 },
      { sig: "sg-x", dim: "nav", val: "b", band: NOT_IDENTIFIED, n: 1 },
      { sig: "sg-x", dim: "age", val: "b", band: "25-34", n: 4 },
      { sig: "sg-x", dim: "age", val: "b", band: NOT_IDENTIFIED, n: 1 },
      { sig: "sg-x", dim: "tier", val: "b", band: "standard", n: 4 },
      { sig: "sg-x", dim: "tier", val: "b", band: NOT_IDENTIFIED, n: 1 },
      { sig: "sg-x", dim: "sigpf", val: "b", band: "ios", n: 4 },
      { sig: "sg-x", dim: "sigpf", val: "b", band: "android", n: 1 },
    ];
  }

  function withSigX(sigCounts: SigCount[]): CxmData {
    const d = structuredClone(seed) as CxmData;
    d.signals = [sigXSignal()];
    d.sigCounts = sigCounts;
    return d;
  }

  it("22: bảng đếm đúng (baseline) — không lỗi nào", () => {
    const r = validateFixture(withSigX(baseSigXCounts()), dims, seedNav, seedTour, cfgDefault);
    expect(r).toEqual([]);
  });

  it("22: giá trị không có trong Signal.values đã khai", () => {
    const rows = baseSigXCounts();
    rows.push({ sig: "sg-x", dim: "sigpf", val: "c-la", band: "ios", n: 1 });
    const r = validateFixture(withSigX(rows), dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("sg-x") && e.includes('giá trị "c-la"'))).toBe(true);
  });

  it("22: ràng buộc 1 — tổng một chiều lệch Signal.vol", () => {
    const rows = baseSigXCounts();
    const acqA = rows.find((r) => r.dim === "acq" && r.val === "a" && r.band === "banner")!;
    acqA.n += 1; // acq: 3+1=4, tổng acq = 4+2+4+1 = 11 ≠ vol=10
    const r = validateFixture(withSigX(rows), dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("sg-x") && e.includes("acq") && e.includes("ràng buộc 1"))).toBe(true);
  });

  it("22: ràng buộc 2 — năm chiều không khớp nhau cho CÙNG một giá trị (tổng theo chiều vẫn = vol)", () => {
    const rows = baseSigXCounts();
    // Đổi lệch NGAY BÊN TRONG chiều tier: val 'a' +1, val 'b' -1 — tổng chiều tier vẫn = 10 (không
    // phạm ràng buộc 1), nhưng theo TỪNG giá trị thì tier không còn khớp acq/nav/age/sigpf nữa.
    rows.find((r) => r.dim === "tier" && r.val === "a" && r.band === "new")!.n += 1;
    rows.find((r) => r.dim === "tier" && r.val === "b" && r.band === "standard")!.n -= 1;
    const r = validateFixture(withSigX(rows), dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("sg-x") && e.includes("ràng buộc 2"))).toBe(true);
    // Không lây sang ràng buộc 1: tổng theo chiều vẫn đúng vol.
    expect(r.some((e) => e.includes("ràng buộc 1"))).toBe(false);
  });

  it("22: ràng buộc 3 — số \"chưa định danh\" lệch nhau giữa bốn chiều khách (tổng theo chiều/giá trị vẫn đúng)", () => {
    const rows = baseSigXCounts();
    // tier/val='a': new 3→2, NOT_IDENTIFIED 2→3 — tổng tier/val='a' vẫn = 5 (khớp acq/nav/age), tổng
    // chiều tier vẫn = 10 (không phạm ràng buộc 1/2), nhưng số "chưa định danh" của tier (3) giờ lệch
    // acq/nav/age (vẫn 2).
    rows.find((r) => r.dim === "tier" && r.val === "a" && r.band === "new")!.n -= 1;
    rows.find((r) => r.dim === "tier" && r.val === "a" && r.band === NOT_IDENTIFIED)!.n += 1;
    const r = validateFixture(withSigX(rows), dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("sg-x") && e.includes(`"${NOT_IDENTIFIED}"`) && e.includes("ràng buộc 3"))).toBe(true);
    expect(r.some((e) => e.includes("ràng buộc 1"))).toBe(false);
    expect(r.some((e) => e.includes("ràng buộc 2"))).toBe(false);
  });

  it("22: ràng buộc 1/2 — MỘT CHIỀU vắng mặt hoàn toàn (0 dòng) vẫn phải bị bắt, không được bỏ lọt vì Map không có key", () => {
    // Xóa sạch mọi dòng của chiều sigpf (cả val='a' lẫn 'b') — khác các test lệch-số ở trên, đây là
    // chiều HOÀN TOÀN KHÔNG XUẤT HIỆN trong sigCounts của sig-x. Nếu vòng lặp chỉ duyệt các dim ĐÃ
    // thấy trong Map (không khởi tạo sẵn cả năm chiều), lỗi này sẽ lọt lưới im lặng.
    const rows = baseSigXCounts().filter((r) => r.dim !== "sigpf");
    const r = validateFixture(withSigX(rows), dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("sg-x") && e.includes("sigpf") && e.includes("ràng buộc 1"))).toBe(true);
    expect(r.some((e) => e.includes("sg-x") && e.includes("ràng buộc 2"))).toBe(true);
  });

  it("22: chiều sigpf được MIỄN ràng buộc 3 — lệch phân bố nền tảng không bị báo lỗi", () => {
    const rows = baseSigXCounts().filter((r) => !(r.dim === "sigpf" && r.val === "a"));
    // Toàn bộ 5 lần bắn val='a' đổi sang nền tảng 'web' thay vì tách ios/android — tổng vẫn 5, chỉ
    // đổi CÁCH CHIA của riêng chiều sigpf, bốn chiều khách giữ nguyên như baseline.
    rows.push({ sig: "sg-x", dim: "sigpf", val: "a", band: "web", n: 5 });
    const r = validateFixture(withSigX(rows), dims, seedNav, seedTour, cfgDefault);
    expect(r).toEqual([]);
  });

  it("22: signal vol>0 VẮNG MẶT HOÀN TOÀN trong sigCounts (bảng KHÔNG rỗng — có dòng của signal khác) ⇒ lỗi", () => {
    // sig-y (vol=5) không có dòng nào trong sigCounts, NHƯNG bảng sigCounts không rỗng (có dòng của
    // sig-x) — đây là ca "cổng nhận số bỏ lọt": vol>0 nghĩa là đã instrument, có bắn thật, mà không
    // nổi một dòng đếm thì rất có thể quên khai Signal.values (giá trị rỗng ⇒ demo generator không
    // sinh fire nào để đếm).
    const d = withSigX(baseSigXCounts());
    d.signals.push(sigYSignal());
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r.some((e) => e.includes("sg-y") && e.includes("vol=5") && e.includes("Signal.values"))).toBe(true);
    // Không lây sang sig-x — sig-x vẫn đầy đủ dòng đúng baseline, không bị báo lỗi gì.
    expect(r.some((e) => e.includes("sg-x"))).toBe(false);
  });

  it("22: sigCounts RỖNG TOÀN BỘ (Demo Mode TẮT) ⇒ KHÔNG lỗi dù signal có vol>0", () => {
    // Khác test trên: ở đây CẢ BẢNG sigCounts rỗng (không có dòng của signal nào, kể cả sig-x) —
    // đây là trạng thái trống TRUNG THỰC của toàn hệ thống (seed.sigCounts=[] thật cũng đúng ca
    // này), KHÔNG được báo lỗi dù sig-x có vol=10 > 0.
    const d = withSigX([]);
    const r = validateFixture(d, dims, seedNav, seedTour, cfgDefault);
    expect(r).toEqual([]);
  });
});