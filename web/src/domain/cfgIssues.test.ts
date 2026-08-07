import { describe, it, expect } from "vitest";
import { seed, cfgDefault } from "../data/fixtures/seed.ts";
import { cfgIssues } from "./cfgIssues.ts";

describe("cfgIssues", () => {
  it("seed + cfgDefault → rỗng (mọi ngưỡng đang đặt đúng chiều)", () => {
    expect(cfgIssues(seed, cfgDefault)).toEqual([]);
  });

  it("step.failCrit <= step.failWatch → đúng 1 câu nêu cả hai số", () => {
    const cfg = { ...cfgDefault, step: { ...cfgDefault.step, failCrit: 3, failWatch: 9 } };
    const issues = cfgIssues(seed, cfg);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("3");
    expect(issues[0]).toContain("9");
  });

  it("chỉ số hướng XUỐNG (m-repeat, target ≤15%) mà crit <= watch → 1 câu", () => {
    const cfg = {
      ...cfgDefault,
      metric: { ...cfgDefault.metric, "m-repeat": { on: true, watch: 15, crit: 10 } },
    };
    const issues = cfgIssues(seed, cfg);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("Repeat contact trong 7 ngày");
  });

  it("chỉ số hướng LÊN (m-completion, target ≥72%) mà crit >= watch → 1 câu", () => {
    const cfg = {
      ...cfgDefault,
      metric: { ...cfgDefault.metric, "m-completion": { on: true, watch: 72, crit: 75 } },
    };
    const issues = cfgIssues(seed, cfg);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("Hoàn tất mở tài khoản");
  });

  it("chỉ số on:false, dù ngưỡng đặt ngược, KHÔNG sinh câu nào", () => {
    const cfg = {
      ...cfgDefault,
      metric: { ...cfgDefault.metric, "m-repeat": { on: false, watch: 15, crit: 10 } },
    };
    expect(cfgIssues(seed, cfg)).toEqual([]);
  });

  it("chỉ số không có entry trong cfg.metric → bỏ qua, không ném", () => {
    const { "m-repeat": _drop, ...rest } = cfgDefault.metric;
    const cfg = { ...cfgDefault, metric: rest };
    expect(() => cfgIssues(seed, cfg)).not.toThrow();
    expect(cfgIssues(seed, cfg)).toEqual([]);
  });
});
