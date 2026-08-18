import { describe, expect, it } from "vitest";
import { stampParts, stampText } from "./stamp.ts";

/* Cặp vào/ra GHIM CHỮ có chủ đích — đây là hợp đồng định dạng, không phải số đếm từ fixture, nên
   luật "không ghim số" không áp. Nếu các bài ở SignalsPage.test đối chiếu qua stampText() thì
   file này là chỗ duy nhất giữ nghĩa của chính stampText — thiếu nó là implementation tự
   khẳng định implementation. */
describe("stampText — dd/MM người gõ viết lại thành 'd MMM · HH:mm'", () => {
  it("mốc đủ ngày giờ", () => {
    expect(stampText("27/07 \u00b7 14:52")).toBe("27 Jul \u00b7 14:52");
    expect(stampText("04/08 \u00b7 09:15")).toBe("4 Aug \u00b7 09:15");
  });

  it("mốc chỉ có ngày", () => {
    expect(stampText("19/07")).toBe("19 Jul");
  });

  it("parse không ra thì trả NGUYÊN chuỗi — không bịa", () => {
    expect(stampText("h\u00f4m qua")).toBe("h\u00f4m qua");
    expect(stampText("27/13 \u00b7 10:00")).toBe("27/13 \u00b7 10:00"); // tháng 13 không tồn tại
    expect(stampText("32/07")).toBe("32/07"); // ngày 32 không tồn tại
  });

  it("stampParts tách ngày/giờ cho bảng vẽ hai tông", () => {
    expect(stampParts("27/07 \u00b7 14:52")).toEqual({ date: "27 Jul", time: "14:52" });
    expect(stampParts("19/07")).toEqual({ date: "19 Jul", time: null });
    expect(stampParts("never ho\u1eb7c g\u00ec \u0111\u00f3")).toBeNull();
  });
});
