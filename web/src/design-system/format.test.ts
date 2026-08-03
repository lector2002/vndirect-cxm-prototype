import { describe, expect, it } from "vitest";
import { nfK } from "./format.ts";

/* Bảng giá trị biên bắt buộc — spec 2026-08-01-card-enterpret-spec.md mục R4/1. */
describe("nfK", () => {
  it.each<[number, string]>([
    [999, "999"],
    [1000, "1K"],
    [16430, "16,4K"],
    [41200, "41,2K"],
    [230720, "230,7K"],
  ])("nfK(%d) === %s", (input, expected) => {
    expect(nfK(input)).toBe(expected);
  });

  it("0 → '0' (không hậu tố K)", () => {
    expect(nfK(0)).toBe("0");
  });

  it("số âm xử lý nhất quán: -41200 → '-41,2K'", () => {
    expect(nfK(-41200)).toBe("-41,2K");
  });
});
