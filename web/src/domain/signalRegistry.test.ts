import { describe, it, expect } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import { demoData } from "../data/fixtures/demo.ts";
import { MISSING, UNKNOWN_YET } from "../data/segment.ts";
import { NOT_IDENTIFIED, SIG_CUST_DIMS, SIG_FIRE_DIM } from "../data/projectSignalCounts.ts";
import {
  isSignalRunning,
  metricsWithoutSignal,
  notRunningSignals,
  runningSignalCount,
  sigCountReliability,
  signalsOfStep,
  signalsWithoutMetric,
  stepsWithoutRunningSignal,
} from "./signalRegistry.ts";

/* module-i-signal-registry-charter.md §14 lát I4a — mọi test ở đây ĐẾM LẠI từ fixture bằng
   Array.prototype thô, không ghim con số (§7 charter: "mọi tiêu chí phải tính lại từ fixture"). */

describe("isSignalRunning / runningSignalCount — D5 trục 1", () => {
  it("suy TỪ vol>0, không đọc st: một signal st='designed' mà vol>0 vẫn phải là đang chạy", () => {
    const fake = { ...seed.signals[0], id: "sig-test-d5", st: "designed" as const, vol: 500 };
    expect(isSignalRunning(fake)).toBe(true);

    const withFake = { ...seed, signals: [...seed.signals, fake] };
    const before = runningSignalCount(seed);
    const after = runningSignalCount(withFake);
    expect(after.of).toBe(before.of + 1);
    expect(after.n).toBe(before.n + 1);
  });

  it("một signal vol=0 (bất kể st) không được tính đang chạy", () => {
    const fake = { ...seed.signals[0], id: "sig-test-zero", st: "live" as const, vol: 0 };
    expect(isSignalRunning(fake)).toBe(false);
  });

  it("đếm lại trên seed: n bằng đúng số signal có vol>0", () => {
    const r = runningSignalCount(seed);
    expect(r.of).toBe(seed.signals.length);
    expect(r.n).toBe(seed.signals.filter((s) => s.vol > 0).length);
  });
});

describe("notRunningSignals — tách designed/gap trong tập chưa chạy", () => {
  it("mọi signal ở cả hai nhóm đều vol=0, và union đúng bằng tập chưa chạy đếm lại từ seed", () => {
    const split = notRunningSignals(seed);
    for (const s of [...split.designed, ...split.gap]) expect(s.vol).toBe(0);

    const expectedNotRunning = seed.signals.filter((s) => s.vol === 0);
    expect(split.designed.length + split.gap.length).toBe(expectedNotRunning.length);
    expect(split.designed.every((s) => s.st === "designed")).toBe(true);
    expect(split.gap.every((s) => s.st === "gap")).toBe(true);
  });
});

describe("signalsOfStep — chuỗi allocate Signal.tpId → Touchpoint.stepId", () => {
  it("mọi signal trả về đều có touchpoint thuộc đúng bước", () => {
    const step = seed.steps[0];
    const sigs = signalsOfStep(seed, step.id);
    const tpIds = new Set(seed.touchpoints.filter((t) => t.stepId === step.id).map((t) => t.id));
    for (const s of sigs) expect(tpIds.has(s.tpId)).toBe(true);
  });
});

describe("stepsWithoutRunningSignal — T4, HAI SỐ LỒNG NHAU (không cộng được)", () => {
  it("`none` là TẬP CON của `noneRunning` trên seed", () => {
    const { none, noneRunning } = stepsWithoutRunningSignal(seed);
    const runningIds = new Set(noneRunning.map((s) => s.id));
    for (const s of none) expect(runningIds.has(s.id)).toBe(true);
    expect(none.length).toBeLessThanOrEqual(noneRunning.length);
  });

  it("một bước có ĐÚNG một signal, và signal đó vol=0 → vào noneRunning nhưng KHÔNG vào none", () => {
    // Bước có tín hiệu (khác oracle rỗng) nhưng signal đó không chạy — chứng minh `none` không rơi
    // vào TẤT CẢ các bước không chạy chỉ vì trùng số, mà thật sự loại đúng "có gắn nhưng im".
    const stepWithOneSignal = seed.steps.find((step) => {
      const sigs = signalsOfStep(seed, step.id);
      return sigs.length === 1 && sigs[0].vol === 0;
    });
    if (!stepWithOneSignal) return; // Không có ca này trong fixture hôm nay — bỏ qua, không bịa.
    const { none, noneRunning } = stepsWithoutRunningSignal(seed);
    expect(noneRunning.some((s) => s.id === stepWithOneSignal.id)).toBe(true);
    expect(none.some((s) => s.id === stepWithOneSignal.id)).toBe(false);
  });

  it("đếm lại: noneRunning đúng bằng số bước mà mọi signal gắn vào đều vol=0 (hoặc không có signal nào)", () => {
    const { none, noneRunning } = stepsWithoutRunningSignal(seed);
    const expectedNoneRunning = seed.steps.filter((step) => {
      const sigs = signalsOfStep(seed, step.id);
      return sigs.every((s) => s.vol === 0);
    });
    const expectedNone = seed.steps.filter((step) => signalsOfStep(seed, step.id).length === 0);
    expect(noneRunning.length).toBe(expectedNoneRunning.length);
    expect(none.length).toBe(expectedNone.length);
  });
});

describe("signalsWithoutMetric / metricsWithoutSignal — T5/T7", () => {
  it("signalsWithoutMetric đúng bằng đếm lại metrics.length===0 trên seed", () => {
    expect(signalsWithoutMetric(seed).length).toBe(seed.signals.filter((s) => s.metrics.length === 0).length);
  });

  it("metricsWithoutSignal đúng bằng đếm lại metric id không nằm trong bất kỳ signal.metrics nào", () => {
    const fed = new Set(seed.signals.flatMap((s) => s.metrics));
    expect(metricsWithoutSignal(seed).length).toBe(seed.metrics.filter((m) => !fed.has(m.id)).length);
  });
});

describe("sigCountReliability — bất biến 9 + owner chốt 07/08 phương án (a)", () => {
  const DIM_IDS = [SIG_FIRE_DIM, ...SIG_CUST_DIMS];

  it("seed (sigCounts rỗng) → mọi chiều total/missing/notIdentified/unknownYet đều 0, KHÔNG throw", () => {
    expect(seed.sigCounts.length).toBe(0);
    const rows = sigCountReliability(seed);
    expect(rows.map((r) => r.dim)).toEqual(DIM_IDS);
    for (const r of rows) {
      expect(r.total).toBe(0);
      expect(r.missing).toBe(0);
      expect(r.notIdentified).toBe(0);
      expect(r.unknownYet).toBe(0);
    }
  });

  it("demoData (sigCounts có dữ liệu) → CHỈ nhãn 'thiếu' vào missing, không trộn với hai nhãn khác", () => {
    expect(demoData.sigCounts.length).toBeGreaterThan(0);
    const rows = sigCountReliability(demoData);

    for (const r of rows) {
      const dimRows = demoData.sigCounts.filter((c) => c.dim === r.dim);
      const expectedTotal = dimRows.reduce((a, c) => a + c.n, 0);
      const expectedMissing = dimRows.filter((c) => c.band === MISSING).reduce((a, c) => a + c.n, 0);
      const expectedNotIdentified = dimRows
        .filter((c) => c.band === NOT_IDENTIFIED)
        .reduce((a, c) => a + c.n, 0);
      const expectedUnknownYet = dimRows.filter((c) => c.band === UNKNOWN_YET).reduce((a, c) => a + c.n, 0);

      expect(r.total).toBe(expectedTotal);
      expect(r.missing).toBe(expectedMissing);
      expect(r.notIdentified).toBe(expectedNotIdentified);
      expect(r.unknownYet).toBe(expectedUnknownYet);
    }

    // Ít nhất một chiều thật có dữ liệu, để test này không xanh rỗng.
    expect(rows.some((r) => r.total > 0)).toBe(true);
  });
});
