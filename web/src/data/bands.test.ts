import { describe, it, expect } from "vitest";
import { bandLabels, bandOf } from "./bands.ts";
import { UNKNOWN_YET, MISSING } from "./segment.ts";
import { cfgDefault } from "./fixtures/seed.ts";
import type { CfgBandAxis } from "./schema/index.ts";

const { nav, age } = cfgDefault.segment.band;

/* `tenure` đã rút khỏi `cfgDefault.segment.band` (S2, 04/08: chiều không còn cắt chart) — nhưng axis
   này là chỗ DUY NHẤT phủ unit 'tháng' (mốc chuyển tầng tháng→năm ở 24 tháng, bandLabelsThang trong
   bands.ts). Giữ một literal TEST-LOCAL với đúng số cũ để không mất độ phủ unit đó — bands.ts không
   biết và không cần biết chiều nào đang dùng nó, chỉ nhận CfgBandAxis thuần. */
const tenureAxis: CfgBandAxis = { min: null, cuts: [6, 24, 60], unit: "tháng" };

describe("bandLabels", () => {
  it("nav mặc định: đúng 5 nhãn đang chạy hôm nay", () => {
    expect(bandLabels(nav)).toEqual(["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", ">5tỷ"]);
  });

  it("age mặc định: đúng 4 nhãn đang chạy hôm nay", () => {
    expect(bandLabels(age)).toEqual(["18-24", "25-34", "35-49", "50+"]);
  });

  it("tenure mặc định: đúng 4 nhãn đang chạy hôm nay (formatter tháng→năm ở mốc 24 tháng)", () => {
    expect(bandLabels(tenureAxis)).toEqual(["<6 tháng", "6-24 tháng", "2-5 năm", ">5 năm"]);
  });

  it("không mutate axis đầu vào", () => {
    const before = JSON.stringify(nav);
    bandLabels(nav);
    expect(JSON.stringify(nav)).toBe(before);
  });

  /* Bất biến E-c + lý do tồn tại của module: thêm cut sát 0 vào nav để tách nhóm CHƯA CÓ TÀI SẢN
     ra khỏi "<50tr" — dải đầu phải là điểm "0đ" thật, không phải "<1đ" (owner không đọc ra được
     nhóm 0 tài sản từ một nhãn "<1đ"). */
  it("thêm cut 1 vào đầu cuts của nav ⇒ dải đầu là '0đ', tách khỏi '<50tr'", () => {
    const navWithZero: CfgBandAxis = { ...nav, cuts: [1, ...nav.cuts] };
    expect(bandLabels(navWithZero)).toEqual(["0đ", "<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", ">5tỷ"]);
  });
});

describe("bandOf", () => {
  it("bandOf(0, nav) = '<50tr'", () => {
    expect(bandOf(0, nav)).toBe("<50tr");
  });

  it("bandOf(50e6, nav) = '50-200tr' (biên dưới đóng — chạm mốc rơi vào dải TRÊN)", () => {
    expect(bandOf(50e6, nav)).toBe("50-200tr");
  });

  it("bandOf(49_999_999, nav) = '<50tr' (biên trên mở — ngay dưới mốc còn ở dải cũ)", () => {
    expect(bandOf(49_999_999, nav)).toBe("<50tr");
  });

  it("bandOf ở dải cuối: bandOf(5e9, nav) = '>5tỷ'", () => {
    expect(bandOf(5e9, nav)).toBe(">5tỷ");
  });

  it("bandOf(10e9, nav) = '>5tỷ' (mọi giá trị vượt mốc cuối đều rơi vào dải cuối)", () => {
    expect(bandOf(10e9, nav)).toBe(">5tỷ");
  });

  /* Thêm cut 1 vào nav ⇒ bandOf(0) tách khỏi bandOf(1) — đúng ý nghĩa của cut mới. */
  it("nav thêm cut 1: bandOf(0) = '0đ', bandOf(1) = '<50tr'", () => {
    const navWithZero: CfgBandAxis = { ...nav, cuts: [1, ...nav.cuts] };
    expect(bandOf(0, navWithZero)).toBe("0đ");
    expect(bandOf(1, navWithZero)).toBe("<50tr");
  });

  it("sentinel UNKNOWN_YET trả nguyên vẹn, không xếp vào dải nào", () => {
    expect(bandOf(UNKNOWN_YET, age)).toBe(UNKNOWN_YET);
  });

  it("sentinel MISSING trả nguyên vẹn, không xếp vào dải nào", () => {
    expect(bandOf(MISSING, tenureAxis)).toBe(MISSING);
  });
});
