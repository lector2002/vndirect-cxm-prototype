import { describe, expect, it } from "vitest";
import type { CxmData, TaxNode } from "../data/schema/index.ts";
import { seed } from "../data/fixtures/seed.ts";
import { demoData } from "../data/fixtures/demo.ts";
import {
  defaultTopicLines,
  driftNodes,
  fallingThemes,
  freshThemes,
  isFreshTopic,
  ptsFor,
  risingThemes,
  themesByVolume,
  topicLines,
  trendOf,
} from "./topics.ts";

/* Ca biên (chuỗi rỗng, chuỗi một điểm, topic vừa tăng vừa mới) không dựng được từ `demoData` nên
   phải có node tổng hợp. Ba test cuối đối chiếu ngược lại với `demoData` — bộ mà màn thật render. */

function th(over: Partial<TaxNode> & { id: string }): TaxNode {
  return {
    lv: "theme",
    name: over.id,
    parentId: "p",
    n: 100,
    why: "node tổng hợp cho test",
    up: "01/08/2026",
    by: "test",
    cat: "complaint",
    ...over,
  };
}

function mk(tax: TaxNode[]): CxmData {
  return { ...seed, tax } as CxmData;
}

describe("ptsFor / trendOf — cắt kỳ mà KHÔNG độn điểm", () => {
  it("chuỗi ngắn hơn số kỳ yêu cầu thì trả nguyên phần đang có, không nội suy thêm", () => {
    const t = th({ id: "a", pts: [10, 20, 30] });
    expect(ptsFor(t, 12)).toEqual([10, 20, 30]);
    expect(ptsFor(t, 2)).toEqual([20, 30]);
  });

  it("theme không có chuỗi thì trả mảng rỗng, không phải mảng số 0", () => {
    expect(ptsFor(th({ id: "a" }))).toEqual([]);
  });

  it("dưới hai điểm thì không có xu hướng nào để nói", () => {
    expect(trendOf([])).toBe(0);
    expect(trendOf([42])).toBe(0);
    expect(trendOf([10, 30])).toBe(20);
  });

  /* Cùng một topic phải cho CÙNG một chuỗi ở mọi chỗ trên màn — bảng vẽ sparkline và chart vẽ
     đường đều gọi hàm này. Ghim để không ai đưa lại một bản `monthly()` ngoại suy cho riêng chart. */
  it("chuỗi cấp cho chart trùng khít chuỗi cấp cho bảng, trên cùng số kỳ", () => {
    const t = th({ id: "a", pts: [1, 2, 3, 4, 5, 6] });
    const data = mk([t]);
    expect(topicLines(data, ["a"], 3)[0]!.pts).toEqual(ptsFor(t, 3));
  });
});

describe("isFreshTopic — hai đường vào, không trộn lẫn", () => {
  it("node đã được gắn nhãn 'thuật ngữ mới' là mới, kể cả khi chưa có chuỗi", () => {
    expect(isFreshTopic(th({ id: "a", drift: "new-term" }))).toBe(true);
  });

  it("chuỗi tăng từ gần sàn là mới: đầu kỳ dưới 40% cuối kỳ", () => {
    expect(isFreshTopic(th({ id: "a", pts: [10, 50] }))).toBe(true); // 10 ≤ 20
    expect(isFreshTopic(th({ id: "b", pts: [20, 50] }))).toBe(true); // 20 ≤ 20, biên thuộc về "mới"
    expect(isFreshTopic(th({ id: "c", pts: [21, 50] }))).toBe(false); // vượt biên
  });

  it("chuỗi ĐI XUỐNG không bao giờ là 'mới trồi lên', dù đầu kỳ rất thấp", () => {
    expect(isFreshTopic(th({ id: "a", pts: [5, 3] }))).toBe(false);
  });

  it("kỳ đang xem quyết định câu trả lời — cắt ngắn có thể đổi kết luận", () => {
    const t = th({ id: "a", pts: [10, 100, 90, 95] });
    expect(isFreshTopic(t)).toBe(true); // 10 ≤ 95*0.4
    expect(isFreshTopic(t, 2)).toBe(false); // [90, 95]: đầu kỳ đã cao
  });
});

describe("Ba nhóm chuyển động", () => {
  it("nhánh khen không vào nhóm tăng lẫn nhóm giảm", () => {
    const data = mk([
      th({ id: "praise-up", cat: "praise", pts: [10, 90] }),
      th({ id: "praise-down", cat: "praise", pts: [90, 10] }),
      th({ id: "complaint-up", cat: "complaint", pts: [10, 90] }),
    ]);
    expect(risingThemes(data).map((t) => t.id)).toEqual(["complaint-up"]);
    expect(fallingThemes(data)).toEqual([]);
  });

  /* `freshThemes` KHÔNG lọc praise — một topic khen mới trồi lên vẫn là chuyện mới đáng biết, chỉ
     không phải chuyện "đang xấu đi". Ghim để không ai "dọn cho nhất quán" rồi giấu mất nó. */
  it("nhóm 'mới xuất hiện' vẫn nhận nhánh khen", () => {
    const data = mk([th({ id: "praise-new", cat: "praise", pts: [10, 90] })]);
    expect(freshThemes(data).map((t) => t.id)).toEqual(["praise-new"]);
  });

  it("đi ngang không thuộc nhóm tăng lẫn nhóm giảm", () => {
    const data = mk([th({ id: "flat", pts: [50, 50] })]);
    expect(risingThemes(data)).toEqual([]);
    expect(fallingThemes(data)).toEqual([]);
  });

  it("chỉ tầng theme được tính — node L1/L2/L3 và sub-theme đứng ngoài", () => {
    const data = mk([
      th({ id: "t", pts: [10, 90] }),
      th({ id: "sub", lv: "subtheme", pts: [10, 90] }),
      th({ id: "l3", lv: "L3", pts: [10, 90] }),
    ]);
    expect(themesByVolume(data).map((t) => t.id)).toEqual(["t"]);
    expect(risingThemes(data).map((t) => t.id)).toEqual(["t"]);
  });
});

describe("defaultTopicLines — luật cắt của chart, sinh từ dữ liệu", () => {
  it("một topic vừa tăng vừa 'mới trồi lên' chỉ được MỘT đường, không phải hai", () => {
    const data = mk([th({ id: "both", pts: [10, 90] })]);
    expect(defaultTopicLines(data)).toEqual(["both"]);
  });

  it("thiếu nhóm nào thì mở ít đường hơn, không bù từ nhóm khác cho đủ sáu", () => {
    const data = mk([
      th({ id: "up1", n: 400, pts: [10, 20] }),
      th({ id: "up2", n: 300, pts: [30, 40] }),
      th({ id: "up3", n: 200, pts: [50, 60] }),
      th({ id: "up4", n: 100, pts: [70, 80] }),
    ]);
    /* Bốn topic đều tăng, không topic nào giảm; đầu kỳ của cả bốn đều trên 40% cuối kỳ nên không
       topic nào "mới". Nhóm tăng chỉ lấy 3 → đúng 3 đường, KHÔNG kéo `up4` vào cho đủ sáu. */
    expect(defaultTopicLines(data)).toHaveLength(3);
  });

  it("taxonomy phình to vẫn không mở quá sáu đường", () => {
    const many = Array.from({ length: 200 }, (_, i) =>
      th({ id: `up${i}`, n: 1000 - i, pts: [10 + i, 90 + i] }),
    );
    expect(defaultTopicLines(mk(many)).length).toBeLessThanOrEqual(6);
  });
});

describe("topicLines — chỉ vẽ thứ vẽ được", () => {
  it("giữ ĐÚNG thứ tự id truyền vào, vì thứ tự quyết định màu", () => {
    const data = mk([th({ id: "a", pts: [1, 2] }), th({ id: "b", pts: [3, 4] })]);
    expect(topicLines(data, ["b", "a"]).map((l) => l.t.id)).toEqual(["b", "a"]);
  });

  it("bỏ qua id không tra được và theme chưa đủ hai điểm, không throw", () => {
    const data = mk([th({ id: "ok", pts: [1, 2] }), th({ id: "one", pts: [5] })]);
    expect(topicLines(data, ["ok", "one", "khong-ton-tai"]).map((l) => l.t.id)).toEqual(["ok"]);
  });
});

describe("driftNodes — node chờ người quyết", () => {
  it("nhận node ở MỌI tầng, không chỉ theme", () => {
    const data = mk([
      th({ id: "t", drift: "duplicate" }),
      th({ id: "sub", lv: "subtheme", drift: "shifting" }),
      th({ id: "clean" }),
    ]);
    expect(driftNodes(data).map((n) => n.id)).toEqual(["t", "sub"]);
  });
});

/* Đối chiếu với `demoData` — bộ dữ liệu màn thật đang render (store/store.ts:176), không phải seed. */
describe("Đối chiếu với demoData", () => {
  it("cả 14 theme đều có 12 điểm THẬT — nên không cần và không được ngoại suy", () => {
    const themes = themesByVolume(demoData);
    expect(themes).toHaveLength(14);
    for (const t of themes) expect(t.pts).toHaveLength(12);
  });

  it("ở 6 kỳ: 9 tăng, 2 giảm, 1 mới → mở đúng 6 đường, không trùng nhau", () => {
    expect(risingThemes(demoData, 6)).toHaveLength(9);
    expect(fallingThemes(demoData, 6)).toHaveLength(2);
    expect(freshThemes(demoData, 6)).toHaveLength(1);
    const def = defaultTopicLines(demoData, 6);
    expect(def).toHaveLength(6);
    expect(new Set(def).size).toBe(6);
  });

  /* Số đường mặc định KHÔNG phải hằng 6 ghim tay: rút cửa sổ còn 3 kỳ thì nhóm "mới" rỗng và chart
     mở 5 đường. Đây là phép kiểm chứng minh luật cắt đọc từ dữ liệu. */
  it("rút cửa sổ còn 3 kỳ thì nhóm 'mới' rỗng và chart mở 5 đường", () => {
    expect(freshThemes(demoData, 3)).toHaveLength(0);
    expect(defaultTopicLines(demoData, 3)).toHaveLength(5);
  });
});
