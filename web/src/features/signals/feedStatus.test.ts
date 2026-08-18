import { describe, expect, it } from "vitest";
import { FEED_LABEL, feedStatusText } from "./feedStatus.ts";

/* Cặp vào/ra GHIM CHỮ có chủ đích — hợp đồng câu chữ của dòng trạng thái giao nhận (như
   stamp.test.ts): các bài ở SignalsPage.test đối chiếu QUA feedStatusText, nên nghĩa của chính nó
   phải ghim ở đây, không thì implementation tự khẳng định implementation. */
describe("feedStatusText — câu trạng thái giao nhận kèm số ngày máy đếm", () => {
  it("stale/down mang số ngày; số ít dùng 'day'", () => {
    expect(feedStatusText("stale", 3)).toBe("Missing 3 days");
    expect(feedStatusText("stale", 1)).toBe("Missing 1 day");
    expect(feedStatusText("down", 12)).toBe("Stopped \u00b7 missing 12 days");
  });

  it("không có số để đếm thì trả nhãn trần — không bịa '0 days'", () => {
    expect(feedStatusText("stale", null)).toBe(FEED_LABEL.stale);
    expect(feedStatusText("down", 0)).toBe(FEED_LABEL.down);
  });

  it("ok/unknown/silent: nhãn trần, không đếm gì", () => {
    expect(feedStatusText("ok", 2)).toBe("Receiving");
    expect(feedStatusText("unknown", null)).toBe("No source linked");
    expect(feedStatusText("silent", 5)).toBe("Silent, unclassified");
  });
});
