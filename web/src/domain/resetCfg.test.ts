import { describe, it, expect } from "vitest";
import { cfgDefault } from "../data/fixtures/seed.ts";
import { MockRepository } from "../data/mock-repository.ts";
import { resetCfgPatch } from "./resetCfg.ts";

describe("resetCfgPatch", () => {
  it("sáu nhóm ngoài sub lấy nguyên từ def, kể cả khi current đã bị sửa", () => {
    const current = {
      ...cfgDefault,
      step: { ...cfgDefault.step, failCrit: 999 },
      anomaly: { z: 0.1 },
    };
    const patch = resetCfgPatch(current, cfgDefault);
    expect(patch.step).toEqual(cfgDefault.step);
    expect(patch.metric).toEqual(cfgDefault.metric);
    expect(patch.source).toEqual(cfgDefault.source);
    expect(patch.data).toEqual(cfgDefault.data);
    expect(patch.anomaly).toEqual(cfgDefault.anomaly);
    expect(patch.segment).toEqual(cfgDefault.segment);
  });

  it("khoá sub chỉ có ở current (set tạo trong phiên) → {f:'off', ch:'Email'}", () => {
    const current = { ...cfgDefault, sub: { ...cfgDefault.sub, "set-moi": { f: "weekly", ch: "Slack" } } };
    const patch = resetCfgPatch(current, cfgDefault);
    expect(patch.sub["set-moi"]).toEqual({ f: "off", ch: "Email" });
  });

  it("khoá sub chỉ có ở def (set đã bị xoá) → KHÔNG dựng lại", () => {
    const current = { ...cfgDefault, sub: { "b-cxm-exec": cfgDefault.sub["b-cxm-exec"] } };
    const patch = resetCfgPatch(current, cfgDefault);
    expect(Object.keys(patch.sub)).toEqual(["b-cxm-exec"]);
    expect(patch.sub["b-voc-all"]).toBeUndefined();
  });

  it("khoá sub có ở cả hai bên → lấy lại giá trị mặc định (không giữ giá trị đã sửa của current)", () => {
    const current = { ...cfgDefault, sub: { ...cfgDefault.sub, "b-cxm-exec": { f: "off", ch: "Email" } } };
    const patch = resetCfgPatch(current, cfgDefault);
    expect(patch.sub["b-cxm-exec"]).toEqual(cfgDefault.sub["b-cxm-exec"]);
  });

  it("hàm thuần: không mutate current lẫn def", () => {
    const current = structuredClone(cfgDefault);
    const def = structuredClone(cfgDefault);
    const patch = resetCfgPatch(current, def);
    patch.step.failCrit = -1;
    patch.sub["b-cxm-exec"].f = "mutated";
    expect(current.step.failCrit).toBe(cfgDefault.step.failCrit);
    expect(def.sub["b-cxm-exec"].f).toBe(cfgDefault.sub["b-cxm-exec"].f);
  });

  it("reset sau khi TẠO set mới → repo.setCfg(...) không ném, set mới giữ {f:'off', ch:'Email'}", () => {
    const repo = new MockRepository();
    const created = repo.createSet("cxm");
    expect(() => repo.setCfg(resetCfgPatch(repo.getCfg(), repo.getCfgDefault()))).not.toThrow();
    expect(repo.getCfg().sub[created.id]).toEqual({ f: "off", ch: "Email" });
  });

  it("reset sau khi XOÁ set → không dựng lại entry mồ côi", () => {
    const repo = new MockRepository();
    repo.deleteSet("b-voc-data"); // không khoá, không phải def — xoá được
    expect(() => repo.setCfg(resetCfgPatch(repo.getCfg(), repo.getCfgDefault()))).not.toThrow();
    expect(repo.getCfg().sub["b-voc-data"]).toBeUndefined();
  });
});

describe("getCfgDefault (seam)", () => {
  it("trả bản sao — mutate kết quả không đụng repo.getCfg()", () => {
    const repo = new MockRepository();
    const def = repo.getCfgDefault();
    def.step.failCrit = -1;
    def.sub["b-cxm-exec"].f = "mutated";
    expect(repo.getCfg().step.failCrit).toBe(cfgDefault.step.failCrit);
    expect(repo.getCfg().sub["b-cxm-exec"].f).toBe(cfgDefault.sub["b-cxm-exec"].f);
  });
});
