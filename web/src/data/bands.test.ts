import { describe, it, expect } from "vitest";
import { bandLabels, bandOf, formatBound } from "./bands.ts";
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
    expect(bandLabels(nav)).toEqual(["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", "5tỷ+"]);
  });

  it("age mặc định: đúng 4 nhãn đang chạy hôm nay", () => {
    expect(bandLabels(age)).toEqual(["18-24", "25-34", "35-49", "50+"]);
  });

  it("tenure mặc định: đúng 4 nhãn đang chạy hôm nay (formatter tháng→năm ở mốc 24 tháng)", () => {
    expect(bandLabels(tenureAxis)).toEqual(["<6 tháng", "6-24 tháng", "2-5 năm", "5 năm+"]);
  });

  it("không mutate axis đầu vào", () => {
    const before = JSON.stringify(nav);
    bandLabels(nav);
    expect(JSON.stringify(nav)).toBe(before);
  });

  /* Bất biến E-c + lý do tồn tại của module: thêm cut sát 0 vào nav để tách nhóm CHƯA CÓ TÀI SẢN
     ra khỏi "<50tr" — dải đầu phải là điểm "0đ" thật, không phải "<1đ" (owner không đọc ra được
     nhóm 0 tài sản từ một nhãn "<1đ"). Dải KẾ TIẾP ("1đ-50tr") không được gộp về "<50tr": dải đó
     không còn là dải đáy (đã có "0đ" nằm dưới nó), gộp về "<50tr" sẽ đọc như bao cả số 0. */
  it("thêm cut 1 vào đầu cuts của nav ⇒ dải đầu là '0đ', dải kế in biên dưới thật '1đ-50tr'", () => {
    const navWithZero: CfgBandAxis = { ...nav, cuts: [1, ...nav.cuts] };
    expect(bandLabels(navWithZero)).toEqual(["0đ", "1đ-50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", "5tỷ+"]);
  });

  /* Sửa 07/08: dải cuối phải LUÔN là dạng "X+", kể cả khi min là null — biên dưới của dải cuối
     luôn ĐÓNG (bandOf xếp value === cuts[last] vào dải cuối), nên nhãn ">X" nói sai khoảng nó mô
     tả bất kể `min`. Trước bản sửa này, cả ba unit đều ra ">X" khi min===null. */
  it("dải cuối luôn dạng 'X+' ở cả ba unit dù min là null, không còn ra '>X'", () => {
    const dong: CfgBandAxis = { min: null, cuts: [50e6, 200e6], unit: "đ" };
    const thang: CfgBandAxis = { min: null, cuts: [6, 24], unit: "tháng" };
    const namAxis: CfgBandAxis = { min: null, cuts: [25, 35], unit: "năm" };
    expect(bandLabels(dong).at(-1)).toBe("200tr+");
    expect(bandLabels(thang).at(-1)).toBe("2 năm+");
    expect(bandLabels(namAxis).at(-1)).toBe("35+");
  });

  /* Sửa 07/08, tiêu chí 2: cut sát 0 (owner tách nhóm CHƯA CÓ TÀI SẢN) tạo ra một dải "0đ" ở đáy —
     dải NGAY TRÊN nó không còn là dải đáy nữa, nên không được gộp về "<upper" (đọc như bao cả số
     0, trong khi 0 đã có dải riêng); phải in biên dưới thật bằng đồng thô. Axis viết thẳng theo
     đúng ví dụ trong đặc tả, không phụ thuộc cfgDefault. */
  it("unit 'đ', min:null, cut sát 0: dải kế dải đáy in biên dưới thật, không gộp về '<upper'", () => {
    const axis: CfgBandAxis = { min: null, cuts: [1, 50e6, 200e6, 1e9, 5e9], unit: "đ" };
    expect(bandLabels(axis)).toEqual(["0đ", "1đ-50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", "5tỷ+"]);
  });

  /* Chốt chặn hồi quy cho tiêu chí 3: KHÔNG có cut sát 0 phía dưới (không có dải "0đ" nào cả) thì
     dải đầu vẫn phải gộp về "<50tr" như cũ — chứng minh bản sửa trên chỉ tránh gộp nhầm khi thật sự
     có một dải "0đ" nằm dưới, không phải mọi trường hợp lower negligible. */
  it("unit 'đ', min:0, không có cut sát 0: dải đầu vẫn là '<50tr' (không có dải nào dưới nó)", () => {
    const axis: CfgBandAxis = { min: 0, cuts: [50e6, 200e6, 1e9, 5e9], unit: "đ" };
    expect(bandLabels(axis)).toEqual(["<50tr", "50-200tr", "200tr-1tỷ", "1-5tỷ", "5tỷ+"]);
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

  it("bandOf ở dải cuối: bandOf(5e9, nav) = '5tỷ+' (biên dưới đóng — chạm đúng mốc cuối vẫn ở dải cuối)", () => {
    expect(bandOf(5e9, nav)).toBe("5tỷ+");
  });

  it("bandOf(10e9, nav) = '5tỷ+' (mọi giá trị vượt mốc cuối đều rơi vào dải cuối)", () => {
    expect(bandOf(10e9, nav)).toBe("5tỷ+");
  });

  /* Thêm cut 1 vào nav ⇒ bandOf(0) tách khỏi bandOf(1) — đúng ý nghĩa của cut mới. bandOf(1) không
     còn là "<50tr": dải đó đã có "0đ" nằm dưới nó, nhãn phải in biên dưới thật "1đ-50tr". */
  it("nav thêm cut 1: bandOf(0) = '0đ', bandOf(1) = '1đ-50tr'", () => {
    const navWithZero: CfgBandAxis = { ...nav, cuts: [1, ...nav.cuts] };
    expect(bandOf(0, navWithZero)).toBe("0đ");
    expect(bandOf(1, navWithZero)).toBe("1đ-50tr");
  });

  it("sentinel UNKNOWN_YET trả nguyên vẹn, không xếp vào dải nào", () => {
    expect(bandOf(UNKNOWN_YET, age)).toBe(UNKNOWN_YET);
  });

  it("sentinel MISSING trả nguyên vẹn, không xếp vào dải nào", () => {
    expect(bandOf(MISSING, tenureAxis)).toBe(MISSING);
  });
});

/* `formatBound` chỉ phục vụ CHÚ THÍCH cạnh ô nhập ranh giới ở màn "Chỉ số & ngưỡng" — nhưng nó là
   một chỗ sinh nhãn nữa trong file giữ bất biến E-c, nên phải ghim thẳng. Hợp đồng: trả cách đọc
   GỌN HƠN, hoặc `null` khi số thô đã là cách đọc đúng. */
describe("formatBound", () => {
  it("nav: số dài đổi sang tầng tự nhiên của chính nó", () => {
    expect(formatBound(200e6, "đ")).toBe("200tr");
    expect(formatBound(5e9, "đ")).toBe("5tỷ");
  });

  /* Ca này là một lỗi thật đã bị bắt: bản đầu trả '0đ' cho mọi giá trị dưới tầng triệu, nên mốc
     `1` (tách nhóm CHƯA CÓ TÀI SẢN — đúng ca dùng owner đặt hàng ở E7) hiện ô ghi `1` mà chú thích
     cạnh nó ghi "= 0đ". Dưới tầng triệu thì số đồng thô CHÍNH LÀ cách đọc đúng, không chú thích. */
  it("nav dưới tầng triệu: không có cách đọc gọn hơn, trả null (không được nói '0đ')", () => {
    expect(formatBound(1, "đ")).toBeNull();
    expect(formatBound(100_000, "đ")).toBeNull();
  });

  it("tuổi: không có tầng đơn vị nào để rút gọn, luôn trả null", () => {
    expect(formatBound(18, "năm")).toBeNull();
    expect(formatBound(65, "năm")).toBeNull();
  });

  it("tháng: chỉ chú thích khi đổi được sang năm", () => {
    expect(formatBound(24, "tháng")).toBe("2 năm");
    expect(formatBound(60, "tháng")).toBe("5 năm");
    expect(formatBound(6, "tháng")).toBeNull();
  });
});
