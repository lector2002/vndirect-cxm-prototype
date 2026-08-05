import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { dims } from "../data/fixtures/seed.ts";
import type { QuantifyShow } from "../data/schema/index.ts";
import { qRunSegment, qRunSplit } from "./quantify.ts";
import { bandOrderKey, SEQ_RAMP, sortByBand } from "./splitOrder.ts";

/* Chiều CÓ THỨ TỰ phải đọc được thứ tự bằng MẮT — xem domain/splitOrder.ts cho chẩn đoán đầy đủ.
   Oracle đo trên demoData 05/08: độ tuổi có 4 dải thật + 74 khách 'chưa-biết'; xếp theo SỐ LƯỢNG ra
   25-34 · 50+ · 18-24 · 35-49, tức thứ tự đọc không nói gì về tuổi. Phân khúc NAV tình cờ trùng thứ
   tự dải khi xếp theo số lượng — chính vì tình cờ mà nó không canh được gì, nên test dùng độ tuổi. */
describe("splitOrder — chiều dải xếp theo dải, không theo số lượng", () => {
  it("bandOrderKey: chỉ chiều cut.kind='band' mới có khoá thứ tự; chiều rời rạc trả undefined", () => {
    expect(bandOrderKey(demoData, dims, "age")).toBeInstanceOf(Map);
    expect(bandOrderKey(demoData, dims, "nav")).toBeInstanceOf(Map);
    // 'acq' khai cut.kind='values', 'pf' không khai cut nào — cả hai là nhóm rời rạc.
    expect(bandOrderKey(demoData, dims, "acq")).toBeUndefined();
    expect(bandOrderKey(demoData, dims, "pf")).toBeUndefined();
  });

  it("bandOrderKey: sentinel KHÔNG chiếm một bậc dải nào", () => {
    const rank = bandOrderKey(demoData, dims, "age");
    if (!rank) throw new Error("kỳ vọng 'age' có khoá thứ tự dải");
    expect(rank.has("chưa-biết")).toBe(false);
    expect(rank.has("thiếu")).toBe(false);
  });

  it("sortByBand: đảo thứ tự theo-số-lượng về đúng thứ tự dải, KHÔNG rơi giá trị nào", () => {
    const byCount = ["25-34", "50+", "18-24", "35-49"];
    expect(sortByBand(byCount, bandOrderKey(demoData, dims, "age"))).toEqual([
      "18-24",
      "25-34",
      "35-49",
      "50+",
    ]);
    // Chiều rời rạc: giữ NGUYÊN thứ tự nơi gọi đã tính (theo số lượng), không tự sắp lại.
    expect(sortByBand(byCount, undefined)).toEqual(byCount);
  });

  it("sortByBand: nhãn lạ (không có bậc dải) dồn về cuối chứ không biến mất", () => {
    const rank = bandOrderKey(demoData, dims, "age");
    expect(sortByBand(["50+", "lạ", "18-24"], rank)).toEqual(["18-24", "50+", "lạ"]);
  });
});

/* Qua ENGINE, không chỉ qua hàm phụ: điều owner nhìn thấy là legend của chart, và chỗ dễ hỏng là
   nối — một hàm xếp đúng mà nơi gọi vẫn dùng thứ tự cũ thì test hàm vẫn xanh. */
describe("qRunSplit — thang màu theo KIỂU chiều", () => {
  const q = (split: string): QuantifyShow => ({
    id: `t-${split}`, kind: "show", show: "acq", split, metric: "count", chart: "rank",
    name: `test ${split}`,
  });

  it("chiều DẢI (Độ tuổi) → thang tuần tự, legend đi theo thứ tự dải", () => {
    const r = qRunSplit(q("age"), demoData, dims);
    if (r.kind !== "draw") throw new Error(`kỳ vọng draw, nhận ${r.kind}`);
    const real = r.legend.filter((l) => l.label !== "Không xác định");
    expect(real.map((l) => l.label)).toEqual(["18-24", "25-34", "35-49", "50+"]);
    expect(real.map((l) => l.color)).toEqual(SEQ_RAMP.slice(0, real.length));
  });

  /* Cùng một chiều KHÔNG được đọc ra hai thứ tự ở hai chart. `seed.qt` có chart lấy dải làm TRỤC HÀNG
     (`show:'nav'`), nên nếu chỉ sửa đoạn màu thì q18 chia màu theo NAV cho ra thứ tự dải còn chart
     kia lấy NAV làm hàng lại cho ra thứ tự theo số lượng. Test dùng ĐỘ TUỔI vì trên demoData hai thứ
     tự đó KHÁC nhau thật (theo số lượng: 25-34 · 50+ · 18-24 · 35-49) — NAV thì trùng nhau nên canh
     bằng NAV sẽ xanh cả khi code sai. */
  it("chiều DẢI làm TRỤC HÀNG (qRunSegment) cũng xếp theo dải, không theo số lượng", () => {
    const r = qRunSegment(
      { id: "t-row-age", kind: "show", show: "age", metric: "count", chart: "rank", name: "test hàng tuổi" },
      demoData,
      dims,
    );
    if (r.kind !== "draw") throw new Error(`kỳ vọng draw, nhận ${r.kind}`);
    expect(r.rows.map((x) => x.id)).toEqual(["18-24", "25-34", "35-49", "50+"]);
    // Số đi kèm đúng hàng của nó — xếp lại thứ tự không được làm lệch nhãn và số.
    expect(r.rows.map((x) => x.v)).toEqual([51, 77, 47, 51]);
  });

  it("chiều RỜI RẠC (Nền tảng) → vẫn thang phân loại, vẫn xếp theo số lượng", () => {
    /* Trục hàng phải là chiều bằng chứng để chia theo Nền tảng được (một khách dùng nhiều nền tảng —
       xem lý do khoá ở qRunSplit). Oracle demoData: android 762 > ios 519 > web 360. */
    const r = qRunSplit({ ...q("pf"), show: "cat" }, demoData, dims);
    if (r.kind !== "draw") throw new Error(`kỳ vọng draw, nhận ${r.kind}`);
    expect(r.legend.map((l) => l.label)).toEqual(["Android", "iOS", "Web"]);
    expect(r.legend.map((l) => l.color)).toEqual(["var(--cat-1)", "var(--cat-2)", "var(--cat-3)"]);
  });
});
