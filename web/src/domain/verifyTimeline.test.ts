import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { seed } from "../data/fixtures/seed.ts";
import { metricDirection } from "../data/metric-direction.ts";
import { verifyTimeline } from "./verifyTimeline.ts";

/* Nghiệm thu B2 (module-b-issue-charter.md): mọi số ĐỐI CHIẾU LẠI với chính fixture qua join thật
   (0 hằng số ghim) — oracle số học chặn chuyện chart tự vẽ một con số khác số đã đóng băng. */

function snapOf(d: typeof seed, iss: string) {
  return d.snap.find((s) => s.iss === iss);
}
function outOf(d: typeof seed, iss: string) {
  const act = d.iss.find((i) => i.id === iss)?.act;
  return d.out.find((o) => o.act === act);
}

describe("verifyTimeline — demoData (có hist)", () => {
  it("CXI-013: đủ pre + frozen + post; frozen/post BẰNG ĐÚNG số đã đóng băng; vạch phát hành ngay sau frozen", () => {
    const tl = verifyTimeline("CXI-013", demoData);
    expect(tl).not.toBeNull();
    const hist = demoData.hist.find((h) => h.iss === "CXI-013")!;
    const snap = snapOf(demoData, "CXI-013")!;
    const out = outOf(demoData, "CXI-013")!;

    expect(tl!.points).toHaveLength(hist.pre.length + 2);
    expect(tl!.frozenAt).toBe(hist.pre.length);
    expect(tl!.points[tl!.frozenAt!]).toMatchObject({ v: snap.m.v, kind: "frozen", demo: false });
    expect(tl!.points[tl!.points.length - 1]).toMatchObject({ v: out.post.v, kind: "post", demo: false });
    expect(tl!.unit).toBe(snap.m.u);

    // CXA-013 có Action.rel (quyết định #4 charter) ⇒ vạch NGAY SAU điểm đóng băng, nhãn nguyên văn
    const action = demoData.act.find((a) => a.id === "CXA-013")!;
    expect(action.rel).toBeTruthy(); // tiền đề fixture
    expect(tl!.releaseAfter).toBe(tl!.frozenAt);
    expect(tl!.releaseLabel).toBe(action.rel);

    // m-ocr target hướng LÊN
    const metric = demoData.metrics.find((m) => m.id === demoData.iss.find((i) => i.id === "CXI-013")!.metric)!;
    expect(tl!.direction).toBe(metricDirection(metric));
    expect(tl!.direction).toBe("up");

    // hist demo:true ⇒ cờ demo bật + câu trộn grain phải có
    expect(tl!.demo).toBe(hist.demo);
    expect(tl!.note).not.toBeNull();
  });

  it("CXI-028 (m-repeat, target ≤): direction 'down'; không rel ⇒ không vạch phát hành", () => {
    const tl = verifyTimeline("CXI-028", demoData);
    expect(tl).not.toBeNull();
    expect(tl!.direction).toBe("down");
    const action = demoData.act.find((a) => a.id === demoData.iss.find((i) => i.id === "CXI-028")!.act)!;
    expect(action.rel ?? "").toBe(""); // tiền đề: 4 action còn lại không có rel
    expect(tl!.releaseAfter).toBeNull();
    expect(tl!.releaseLabel).toBeNull();
  });

  it("CXI-024: chưa xác nhận ⇒ không snapshot ⇒ null (không có điểm neo, không đoán)", () => {
    expect(snapOf(demoData, "CXI-024")).toBeUndefined(); // tiền đề: cf:'pending'
    expect(verifyTimeline("CXI-024", demoData)).toBeNull();
  });

  it("id lạ ⇒ null", () => {
    expect(verifyTimeline("CXI-KHONG-TON-TAI", demoData)).toBeNull();
  });
});

describe("verifyTimeline — seed (hist rỗng: fixture thật không mang số minh hoạ)", () => {
  it("CXI-013 trên seed: chỉ frozen + post, demo:false, note null (không có kỳ trước nào để trộn grain)", () => {
    expect(seed.hist).toHaveLength(0); // tiền đề B1
    const tl = verifyTimeline("CXI-013", seed);
    expect(tl).not.toBeNull();
    const kinds = tl!.points.map((p) => p.kind);
    expect(kinds).toEqual(outOf(seed, "CXI-013") ? ["frozen", "post"] : ["frozen"]);
    expect(tl!.frozenAt).toBe(0);
    expect(tl!.demo).toBe(false);
    expect(tl!.note).toBeNull();
  });
});
