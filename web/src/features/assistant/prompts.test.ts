import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { createCxmStore } from "../../store/store.ts";
import { seedAssistantSessions } from "../../store/assistant.ts";
import { sourceHealth } from "../../domain/index.ts";
import { SEV_LABEL } from "../work/WorkCreateForm.tsx";
import { isOverdue } from "../work/WorkPage.tsx";
import { HEALTH_LABEL } from "../sources/SourceProfile.tsx";
import { answerFor, PROMPTS, promptLabel } from "./prompts.ts";

/* Answer builder của Assistant — mọi số ĐẾM LẠI từ fixture bằng đúng hàm màn gốc dùng (§7 charter:
   không ghim số), vì chính builder cũng phải đi qua các hàm đó (một đường đếm duy nhất). */

const st = createCxmStore(new MockRepository()).getState();
const { data, cfg } = st;

describe("answerFor — câu trả lời đếm thật từ store", () => {
  it("p-critical: đếm điểm gãy ĐANG MỞ mức critical bằng đúng vị từ TopPriorityBlock + nhãn SEV_LABEL", () => {
    const open = data.iss.filter((i) => {
      const a = data.act.find((x) => x.id === i.act);
      return a !== undefined && a.lc !== "closed";
    });
    const crit = open.filter((i) => i.sev === "critical");
    const ans = answerFor("p-critical", data, cfg);
    if (crit.length > 0) {
      expect(ans.intro).toContain(`Có ${crit.length}`);
      expect(ans.intro).toContain(SEV_LABEL.critical);
    } else {
      expect(ans.intro).toContain("Không có điểm gãy");
    }
    expect(ans.bullets).toHaveLength(crit.length);
    for (const i of crit) expect(ans.bullets.join("\n")).toContain(i.title);
    expect(ans.route?.to).toBe("work");
    expect(ans.provenance).toContain(data.asOf);
  });

  it("p-overdue: đếm việc đang mở quá hạn qua ĐÚNG isOverdue của WorkPage (so với asOf)", () => {
    const late = data.act.filter((a) => a.lc !== "closed" && isOverdue(a.due, data.asOf));
    expect(late.length).toBeGreaterThan(0); // tiền đề: seed 25/08 có việc quá hạn (CXA-021/028)
    const ans = answerFor("p-overdue", data, cfg);
    expect(ans.intro).toContain(`Có ${late.length}`);
    expect(ans.bullets).toHaveLength(late.length);
    for (const a of late) expect(ans.bullets.join("\n")).toContain(`hạn ${a.due}`);
  });

  it("p-sources: nguồn có vấn đề = sourceHealth !== 'ok', nhãn lấy từ HEALTH_LABEL (một nguồn nhãn)", () => {
    const bad = data.sources
      .map((s) => ({ s, h: sourceHealth(s, cfg, data.asOf) }))
      .filter(({ h }) => h !== "ok");
    const ans = answerFor("p-sources", data, cfg);
    expect(ans.bullets).toHaveLength(bad.length);
    for (const { s, h } of bad) {
      expect(ans.bullets.join("\n")).toContain(s.name);
      expect(ans.bullets.join("\n")).toContain(HEALTH_LABEL[h]);
    }
    if (bad.length > 0) expect(ans.intro).toContain(`${bad.length} / ${data.sources.length}`);
    expect(ans.route?.to).toBe("sources");
  });

  it("p-agents: đủ mọi phát hiện của data.ag, xếp nặng trước (critical đứng trước medium)", () => {
    const findings = data.ag.flatMap((g) => g.f);
    expect(findings.length).toBeGreaterThan(0); // tiền đề: seed có phát hiện agent
    const ans = answerFor("p-agents", data, cfg);
    expect(ans.intro).toContain(`${data.ag.length} agent`);
    expect(ans.intro).toContain(`${findings.length} phát hiện`);
    expect(ans.bullets).toHaveLength(findings.length);
    const firstCrit = findings.find((f) => f.sev === "critical");
    if (firstCrit) expect(ans.bullets[0]).toContain(findings.filter((f) => f.sev === "critical")[0]!.title);
    const lastSev = findings.find((f) => f.sev === "medium");
    if (firstCrit && lastSev) {
      const idxCrit = ans.bullets.findIndex((b) => b.includes(firstCrit.title));
      const idxMed = ans.bullets.findIndex((b) => b.includes(lastSev.title));
      expect(idxCrit).toBeLessThan(idxMed);
    }
  });

  it("p-anomaly: số chuỗi lệch đếm lại bằng CÙNG công thức mức nền (trung bình các kỳ trước điểm cuối)", () => {
    let expected = 0;
    for (const item of data.qt) {
      if (item.kind !== "series" || item.chart !== "anomaly") continue;
      for (const line of item.t) {
        if (line.p.length < 2) continue;
        const last = line.p[line.p.length - 1];
        const base = line.p.slice(0, -1).reduce((a, v) => a + v, 0) / (line.p.length - 1);
        if (base <= 0) continue;
        const r = last / base;
        if (r >= 1.5 || r <= 0.67) expected += 1;
      }
    }
    const ans = answerFor("p-anomaly", data, cfg);
    expect(ans.bullets).toHaveLength(expected);
    expect(ans.route?.to).toBe("topics");
  });

  it("câu gõ tự do / promptId lạ → trả lời trung thực về phạm vi demo, không bịa số", () => {
    const ans = answerFor(undefined, data, cfg);
    expect(ans.intro).toContain("câu hỏi mẫu");
    expect(ans.bullets).toHaveLength(0);
    expect(ans.route).toBeUndefined();
  });
});

describe("phiên chat mẫu — khớp danh mục PROMPTS", () => {
  it("mọi promptId trong seedAssistantSessions tồn tại trong PROMPTS (promptLabel không rơi về id thô)", () => {
    for (const s of seedAssistantSessions()) {
      for (const t of s.turns) {
        expect(t.promptId).toBeDefined();
        expect(PROMPTS.some((p) => p.id === t.promptId)).toBe(true);
        expect(promptLabel(t.promptId!)).not.toBe(t.promptId);
      }
    }
  });
});
