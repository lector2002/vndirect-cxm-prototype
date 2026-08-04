import type { Cfg, CxmData, Customer, Dim, SegUnknown } from "./schema/index.ts";
import { bandOf } from "./bands.ts";
import { CUST_NUM } from "./rawFields.ts";

/* Chiếu GIÁ TRỊ THÔ của khách thành NHÃN NHÓM theo ranh giới của từng chiều — ĐƯỜNG DUY NHẤT nối
   ranh giới owner sửa trong setting tới con số hiện trên chart.

   Vì sao module này tồn tại: đo được 04/08 rằng `bandOf` KHÔNG có consumer nào trong production
   (chỉ validate.ts gọi `bandLabels`), và nhãn nhóm được lưu sẵn dạng đã nướng ('1-5tỷ') trên hồ sơ
   khách — nên sửa ranh giới không đổi một chart nào. Máy tính nhóm của module E đã đúng, chỉ thiếu
   chỗ nối. Đây là chỗ nối đó.

   Vì sao chiếu ở tầng `data/` chứ không truyền `cfg` xuống `domain/`: `cfg` không tới được domain mà
   không sửa 3 signature export (`qRun`, `qRunSegment`, `themeSegments`) + ~35 call site test — và
   mỗi chiều owner thêm về sau lại là một lần sửa signature nữa, đúng cái hardcode cần bỏ. Chiếu ở
   đây thì domain không cần biết `cfg` tồn tại: nó chỉ đọc nhãn, như trước.

   THUẦN, MỘT implementation, HAI nơi gọi — hai nơi vì test import fixture TRỰC TIẾP, không qua repo:
   - fixtures (seed.ts / demo.ts) gọi với `cfgDefault` lúc dựng ⇒ `seed`/`demoData` luôn có nhãn đủ;
   - MockRepository.getSnapshot() gọi với cfg HIỆN TẠI ⇒ sửa ranh giới là snapshot chiếu lại.
   Chiếu lại một khách đã có nhãn là idempotent: nhãn luôn tính từ số thô, không bao giờ đọc nhãn cũ.

   ĐỔI Ở ĐỢT 2a: trước đây ba dòng cố định cho age/nav/tenure; giờ LẶP trên khai báo chiều. Ba dòng
   cố định là trần cứng của việc owner thêm chiều — chiều thứ tư khai ra thì không dòng nào chiếu nó,
   nên nó xuất hiện trên màn quản trị rồi không chart nào vẽ được: đúng loại lỗi bước 1 vừa sửa. Vòng
   lặp còn xử lý được hai chiều cắt CÙNG một số thô theo hai bộ ranh giới khác nhau — ca dùng thật mà
   ba ô cố định không làm được.

   Chiều `values` (lấy nguyên giá trị: phân khúc, hạng giá trị, kênh mở TK) KHÔNG đi qua đây: không
   có ranh giới, không có số thô nào phía sau, giá trị đọc thẳng từ danh mục dữ kiện. */

/** Nhãn nhóm của MỘT khách theo MỘT chiều cắt ngưỡng. Ném khi khai báo sai thay vì bỏ qua im lặng:
    bỏ qua sẽ để lại `bands[id]` trống, và chart đọc vào đó vẽ ra một nhóm rỗng trông như "không có
    khách nào thuộc nhóm này" — một câu nói dối, trong khi sự thật là chiều chưa cấu hình xong. Ném
    ở đây an toàn vì đường ghi cấu hình (MockRepository.setCfg) chiếu thử TRƯỚC khi nhận cấu hình
    mới, nên một khai báo sai bị chặn tại chỗ ghi, không tới được lúc render. */
function bandLabelFor(c: Customer, id: string, dim: Dim, cfg: Cfg): string | SegUnknown {
  const source = dim.cut?.source ?? "";
  const read = CUST_NUM[source];
  if (!read) {
    throw new Error(
      `projectBands: chiều "${id}" cắt ngưỡng theo dữ kiện "${source}" nhưng dữ kiện đó không có trong danh mục số (CUST_NUM ở data/rawFields.ts) — khai báo sai, hoặc pipeline chưa mang dữ kiện này về`,
    );
  }
  const axis = cfg.segment.band[id];
  if (!axis) {
    throw new Error(
      `projectBands: chiều "${id}" cắt ngưỡng nhưng thiếu ranh giới ở cfg.segment.band["${id}"] — không có ranh giới thì không có nhóm nào`,
    );
  }
  return bandOf(read(c), axis);
}

/** Một khách: trả về OBJECT MỚI (không mutate — nhãn cũ có thể đang được nơi khác đọc).
    `bands` dựng LẠI TỪ ĐẦU, không merge vào map cũ: merge sẽ giữ lại nhãn của một chiều đã bị xoá,
    và chart nào còn trỏ vào chiều đó lại vẽ được bằng dữ liệu mồ — nhãn phải chết cùng chiều. */
export function projectCustomer(c: Customer, cfg: Cfg, dims: Record<string, Dim>): Customer {
  const bands: Record<string, string | SegUnknown> = {};
  for (const [id, dim] of Object.entries(dims)) {
    if (dim.base !== "cust" || dim.cut?.kind !== "band") continue;
    bands[id] = bandLabelFor(c, id, dim, cfg);
  }
  return { ...c, bands };
}

/** Cả snapshot: chỉ `cust` đổi, các mảng khác giữ nguyên tham chiếu (không có nhãn nhóm nào ở đó). */
export function projectCustomerBands(data: CxmData, cfg: Cfg, dims: Record<string, Dim>): CxmData {
  return { ...data, cust: data.cust.map((c) => projectCustomer(c, cfg, dims)) };
}
