import type { Cfg } from "../data/schema/index.ts";

/* "Trả về mặc định" cho màn Chỉ số & ngưỡng — patch để truyền thẳng vào store.setCfg(...).

   Các nhóm step/metric/source/signal/data/anomaly/segment không ai mutate ngoài màn cấu hình, nên
   lấy nguyên từ `def` là đủ. Riêng `sub` KHÔNG được gán nguyên `def.sub`: nó bị mutate NGOÀI màn này —
   mock-repository.ts thêm entry khi tạo/nhân bản set, xoá entry khi xoá set — và validate.ts bắt
   buộc mỗi set trong `dash` phải có đúng một entry `cfg.sub` (thiếu là lỗi, thừa/mồ côi cũng là
   lỗi). Gán nguyên `def.sub` sẽ:
     - làm set MỚI tạo trong phiên mất entry ⇒ setCfg() ném ngay (thiếu cấu hình bản tin);
     - dựng lại entry cho set ĐÃ XOÁ ⇒ setCfg() ném vì entry mồ côi không trỏ set nào.
   Luật đúng (owner chốt, xem docs/module-g-rules-charter.md mục "Ba quyết định thiết kế" #1): lặp
   trên các khoá đang có trong `current.sub` — khoá đó còn tồn tại trong `def.sub` thì lấy lại giá
   trị mặc định; không còn (set tạo trong phiên) thì đặt {f:'off', ch:'Email'}, ĐÚNG giá trị mà
   mock-repository.ts gán cho set mới. Khoá chỉ có trong `def.sub` mà `current.sub` đã xoá thì
   KHÔNG dựng lại — nếu không, xoá set xong bấm reset sẽ hồi sinh entry mồ côi.

   `structuredClone` từng nhóm để hàm THUẦN tuyệt đối — không trả về tham chiếu dùng chung với
   `current`/`def`, tránh caller mutate patch rồi vô tình mutate ngược lại cfg mặc định gốc. */
export function resetCfgPatch(current: Cfg, def: Cfg): Cfg {
  const sub: Cfg["sub"] = {};
  for (const key of Object.keys(current.sub)) {
    sub[key] = def.sub[key] ? structuredClone(def.sub[key]) : { f: "off", ch: "Email" };
  }

  return {
    step: structuredClone(def.step),
    pri: structuredClone(def.pri),
    hv: structuredClone(def.hv),
    metric: structuredClone(def.metric),
    source: structuredClone(def.source),
    signal: structuredClone(def.signal),
    data: structuredClone(def.data),
    anomaly: structuredClone(def.anomaly),
    sub,
    segment: structuredClone(def.segment),
  };
}
