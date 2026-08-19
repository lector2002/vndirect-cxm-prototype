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

  it("signal badRate/ceiling (vượt lên là xấu) mà crit <= warn → 1 câu nêu tên điểm đo", () => {
    const cfg = {
      ...cfgDefault,
      signal: { ...cfgDefault.signal, sg3: { kind: "badRate" as const, bad: ["fail"], warn: 20, crit: 10 } },
    };
    const issues = cfgIssues(seed, cfg);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("ekyc_document_capture_result");
  });

  it("signal goodRate/floor (tụt xuống là xấu) mà crit >= warn → 1 câu", () => {
    const cfg = {
      ...cfgDefault,
      signal: { ...cfgDefault.signal, sg1: { kind: "floor" as const, warn: 2, crit: 6 } },
    };
    const issues = cfgIssues(seed, cfg);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("account_open_started");
  });

  it("bad chứa giá trị ngoài bản khai Signal.values → 1 câu nêu giá trị lạ", () => {
    const cfg = {
      ...cfgDefault,
      signal: { ...cfgDefault.signal, sg3: { kind: "badRate" as const, bad: ["fail", "khong_ton_tai"], warn: 10, crit: 20 } },
    };
    const issues = cfgIssues(seed, cfg);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('"khong_ton_tai"');
  });

  it("bad RỖNG không phải mâu thuẫn — entry khai dở là việc còn làm, không sinh câu", () => {
    const cfg = {
      ...cfgDefault,
      signal: { ...cfgDefault.signal, sg3: { kind: "badRate" as const, bad: [], warn: 10, crit: 20 } },
    };
    expect(cfgIssues(seed, cfg)).toEqual([]);
  });

  it("minN/winDays sai leaf KHÔNG sinh câu ở lưới mềm — đó là việc của nhóm 24 validate (cổng chặn)", () => {
    const cfg = {
      ...cfgDefault,
      signal: {
        ...cfgDefault.signal,
        sg3: { kind: "badRate" as const, bad: ["fail"], minN: 0, winDays: 1.5, warn: 10, crit: 20 },
      },
    };
    expect(cfgIssues(seed, cfg)).toEqual([]);
  });
});
