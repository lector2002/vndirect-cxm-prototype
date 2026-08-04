import type { Cfg, CxmData, Customer } from "./schema/index.ts";
import { bandOf } from "./bands.ts";

/* Chiếu GIÁ TRỊ THÔ của khách (navVnd/ageYears/tenureMonths) thành NHÃN DẢI (nav/age/tenure) theo
   `cfg.segment` — ĐƯỜNG DUY NHẤT nối `cuts` owner sửa trong setting tới con số hiện trên chart.

   Vì sao module này tồn tại: đo được 04/08 rằng `bandOf` KHÔNG có consumer nào trong production
   (chỉ validate.ts gọi `bandLabels`), và `Customer.nav` lưu sẵn nhãn đã nướng ('1-5tỷ') — nên sửa
   `cfg.segment.nav.cuts` hôm qua không đổi một chart nào. Máy tính dải của module E đã đúng, chỉ
   thiếu chỗ nối. Đây là chỗ nối đó.

   Vì sao chiếu ở tầng `data/` chứ không truyền `cfg` xuống `domain/`: `cfg` không tới được domain mà
   không sửa 3 signature export (`qRun`, `qRunSegment`, `themeSegments`) + ~35 call site test — và
   mỗi chiều user thêm về sau lại là một lần sửa signature nữa, đúng cái hardcode cần bỏ. Chiếu ở
   đây thì domain không cần biết `cfg` tồn tại: nó chỉ đọc nhãn, như trước.

   THUẦN, MỘT implementation, HAI nơi gọi — hai nơi vì test import fixture TRỰC TIẾP, không qua repo:
   - fixtures (seed.ts / demo.ts) gọi với `cfgDefault` lúc dựng ⇒ `seed`/`demoData` luôn có nhãn đủ;
   - MockRepository.getSnapshot() gọi với cfg HIỆN TẠI ⇒ sửa cut là snapshot chiếu lại.
   Chiếu lại một khách đã có nhãn là idempotent: nhãn luôn tính từ số thô, không bao giờ đọc nhãn cũ.

   `acq` KHÔNG đi qua đây — trục categorical (`cfg.segment.acq.values`), không có cut, không có số
   thô nào phía sau. Đừng gộp nó vào một vòng lặp chung trên `cfg.segment`: shape của nó khác
   (`{ values }` chứ không phải `{ min, cuts, unit }`). */

/** Một khách: trả về OBJECT MỚI (không mutate — nhãn cũ có thể đang được nơi khác đọc). */
export function projectCustomer(c: Customer, cfg: Cfg): Customer {
  return {
    ...c,
    age: bandOf(c.ageYears, cfg.segment.age),
    nav: bandOf(c.navVnd, cfg.segment.nav),
    tenure: bandOf(c.tenureMonths, cfg.segment.tenure),
  };
}

/** Cả snapshot: chỉ `cust` đổi, các mảng khác giữ nguyên tham chiếu (không có nhãn dải nào ở đó). */
export function projectCustomerBands(data: CxmData, cfg: Cfg): CxmData {
  return { ...data, cust: data.cust.map((c) => projectCustomer(c, cfg)) };
}
