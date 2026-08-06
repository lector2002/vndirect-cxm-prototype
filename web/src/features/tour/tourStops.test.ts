import { describe, expect, it } from "vitest";
import { seedTour } from "../../data/fixtures/seed.ts";
import { absentReason, heldSummary, holdReason, splitTour } from "./tourStops.ts";

/* Bộ lọc chặng là chỗ quyết định tour NÓI GÌ. Test ở đây canh đúng một điều: không chặng nào lọt
   qua mà dẫn người xem tới màn chưa dựng, hoặc đọc lời dẫn tả bố cục đã bỏ. */

const stopAt = (r: string) => ({ r, grp: "g", sel: '[data-tour="x"]', t: "t", d: "d" });
const screenOf = (r: string) => r.split("/")[0];

describe("splitTour — chặng nào bản React đi được", () => {
  it("giữ nguyên thứ tự khai và không làm mất chặng nào", () => {
    const { walk, held } = splitTour(seedTour);
    expect(walk.length + held.length).toBe(seedTour.length);
    // Thứ tự trong `walk` phải là thứ tự con của `seedTour` — tour đi theo mạch đã soạn.
    const order = walk.map((s) => seedTour.indexOf(s));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("KHÔNG đi qua chặng của màn chưa dựng, và nêu tên chúng thay vì bỏ im lặng", () => {
    const { walk, held } = splitTour(seedTour);
    const unbuiltScreens = ["topics"];
    const routes = new Set(walk.map((s) => screenOf(s.r)));
    for (const r of unbuiltScreens) expect(routes.has(r)).toBe(false);

    const unbuiltHeld = held.filter((h) => h.reason === "màn chưa dựng ở bản React");
    expect(unbuiltHeld).toHaveLength(seedTour.filter((s) => unbuiltScreens.includes(screenOf(s.r))).length);
  });

  /* `#/work` CÓ thật — nên đây không phải ca "màn chưa dựng" mà là ca lời dẫn nói sai. Owner đã bỏ
     board 4 làn (WorkPage.tsx:19-22) trong khi `seedTour` vẫn tả "Bốn làn công việc". Giữ lại và
     nêu tên, KHÔNG tự viết chữ mới thay owner. */
  it("giữ ba chặng #/work lại vì lời dẫn còn tả board 4 làn đã bỏ", () => {
    const { walk, held } = splitTour(seedTour);
    expect(walk.some((s) => s.r === "work")).toBe(false);
    const workHeld = held.filter((h) => h.stop.r === "work");
    expect(workHeld).toHaveLength(3);
    for (const h of workHeld) {
      expect(h.reason).toBe("lời dẫn còn tả bố cục cũ (board 4 làn đã bỏ)");
    }
  });

  /* Ca hẹp hơn hai ca trên: `#/vocjourney` đã dựng, nhưng chỉ MỘT trong hai chặng của nó nói đúng.
     Giữ theo màn sẽ chôn theo cả chặng đúng, nên khoá theo tên mốc — canh đúng điều đó ở đây. */
  it("màn vocjourney đã dựng: đi chặng nói đúng, giữ RIÊNG chặng lời dẫn sai", () => {
    const { walk, held } = splitTour(seedTour);
    expect(walk.some((s) => s.sel.includes("voc-spine"))).toBe(true);
    const inspector = held.find((h) => h.stop.sel.includes("voc-inspector"));
    expect(inspector?.reason).toContain("mở ở tab Topic");
    // Chặng anh em cùng màn KHÔNG bị giữ lây.
    expect(held.some((h) => h.stop.sel.includes("voc-spine"))).toBe(false);
  });

  /* `#/sources` vừa dựng: CẢ HAI chặng đi được. Khác `#/vocjourney` ở chỗ lời dẫn của chặng hồ sơ
     ("Bấm một nguồn để mở hồ sơ") tả ĐÚNG hành vi màn — mốc chỉ vắng lúc chưa bấm, và ca vắng mốc
     đã có câu riêng ở `absentReason`. Vắng mốc thì đi tiếp và nói ra; lời dẫn sai mới phải giữ. */
  it("màn sources đã dựng: đi cả hai chặng, không chặng nào bị giữ", () => {
    const { walk, held } = splitTour(seedTour);
    expect(walk.filter((s) => screenOf(s.r) === "sources")).toHaveLength(2);
    expect(held.some((h) => screenOf(h.stop.r) === "sources")).toBe(false);
  });

  it("đi qua đủ chặng của sáu màn đã dựng: cxm, atlas, voc, topic, vocjourney, sources", () => {
    const { walk } = splitTour(seedTour);
    const count = (r: string) => walk.filter((s) => screenOf(s.r) === r).length;
    expect(count("cxm")).toBe(3);
    expect(count("atlas")).toBe(3);
    expect(count("voc")).toBe(2);
    expect(count("topic")).toBe(1);
    expect(count("vocjourney")).toBe(1);
    expect(count("sources")).toBe(2);
    expect(walk).toHaveLength(12);
  });

  /* Chặng đi được mà selector khai sai dạng thì tour chỉ vào chỗ trống. Canh dạng ở đây; còn mốc có
     thật trong DOM hay không thì TourOverlay.test.tsx kiểm bằng cách chạy thật. */
  it("mọi chặng đi được đều nhắc một mốc data-tour dạng hợp lệ", () => {
    for (const s of splitTour(seedTour).walk) {
      expect(s.sel).toMatch(/^\[data-tour="[^"]+"\]$/);
    }
  });
});

describe("heldSummary — nói ra phần chưa đi được", () => {
  it("gộp theo lý do và đếm đúng tổng", () => {
    const { held } = splitTour(seedTour);
    const text = heldSummary(held)!;
    expect(text).toContain(`còn ${held.length} chặng chưa đi được`);
    // Còn đúng `#/topics` chưa dựng — `#/sources` đã lên 06/08 nên rời khỏi nhóm này.
    expect(text).toContain("2 chặng màn chưa dựng ở bản React");
    expect(text).toContain("3 chặng lời dẫn còn tả bố cục cũ");
    expect(text).toContain("1 chặng lời dẫn nói hồ sơ mở sẵn ở tab Verbatim");
  });

  it("không có gì bị giữ lại thì không dựng câu thừa", () => {
    expect(heldSummary([])).toBeNull();
  });
});

/* Đây là câu tour nói khi KHÔNG tô sáng được chỗ nào. Nó là một lời giải thích, nên nó có thể sai —
   và một lời giải thích sai thì tệ hơn hẳn không giải thích. Canh: mỗi ca một câu riêng, ca lạ rơi
   vào câu nhận không biết. */
describe("absentReason — vì sao không tô sáng được", () => {
  it("mỗi mốc đã biết có lý do riêng, không dùng chung một câu", () => {
    const inspector = absentReason('[data-tour="atlas-inspector"]');
    const spine = absentReason('[data-tour="atlas-spine"]');
    const profile = absentReason('[data-tour="src-profile"]');
    expect(inspector).toContain("chọn một bước");
    expect(spine).toContain("ngoài pilot");
    expect(profile).toContain("bấm một nguồn");
    expect(new Set([inspector, spine, profile]).size).toBe(3);
  });

  it("mốc chưa lường trước thì NHẬN là chưa rõ, không mượn lý do của mốc khác", () => {
    const unknown = absentReason('[data-tour="chua-co-mot-moc-nao-ten-the-nay"]');
    expect(unknown).toContain("Chưa rõ vì sao");
    expect(unknown).not.toContain("chọn một bước");
    expect(unknown).not.toContain("ngoài pilot");
  });

  it("selector dạng lạ cũng không làm vỡ, vẫn rơi vào câu nhận chưa rõ", () => {
    expect(absentReason("#khong-phai-data-tour")).toContain("Chưa rõ vì sao");
  });
});

describe("holdReason", () => {
  it("trả null cho màn đã dựng, trả lý do đọc được cho màn chưa dựng", () => {
    expect(holdReason(stopAt("atlas"))).toBeNull();
    expect(holdReason(stopAt("sources"))).toBeNull();
    expect(holdReason(stopAt("topics"))).toBe("màn chưa dựng ở bản React");
  });

  it("đọc đúng segment đầu của route có tham số (topic/x-th-device)", () => {
    expect(holdReason(stopAt("topic/x-th-device"))).toBeNull();
  });
});
