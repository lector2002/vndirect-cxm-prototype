import type { CxmData, Customer, AgeBand, NavBand, TenureBand, AcqChannel } from "../schema/index.ts";
import { seed } from "./seed.ts";
import { UNKNOWN_YET, MISSING } from "../segment.ts";

/* demoData — chế độ "demo bật/tắt" (Module C, section C4): trải seed thật (7 khách trung thực,
   giữ nguyên KHÔNG đụng) rồi thay bảng `cust` bằng 300 khách SINH RA, đủ lớn để các biểu đồ phân
   khúc theo age/nav/tenure/acq có ý nghĩa thống kê. Công tắc bật/tắt và tab cấu hình KHÔNG thuộc
   phạm vi file này (section C5) — file này chỉ lo phần dữ liệu. */

/* ---------- PRNG tất định (mulberry32) — KHÔNG dùng Math.random ----------
   Sinh dữ liệu demo phải tái lập được nguyên vẹn giữa các lần chạy (test, build, review), nên
   toàn bộ ngẫu nhiên đi qua một bộ sinh số có hạt giống cố định thay vì Math.random (vốn không
   tất định và sẽ làm test nhấp nháy + fixture đổi mỗi lần build). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_SEED = 0xc0ffee;

function pickWeighted<T>(rng: () => number, items: ReadonlyArray<readonly [T, number]>): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}

/* Khuôn key che sẵn của seed thật: 'KH•••' + 3 ký tự dạng số-chữ-số (vd '7A2', '1C9'). Sinh
   ngẫu nhiên rồi loại trùng bằng Set — vẫn tất định vì cùng một rng, cùng một chuỗi số. */
function genKeySuffix(rng: () => number): string {
  const digits = "0123456789";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const d1 = digits[Math.floor(rng() * digits.length)];
  const l = letters[Math.floor(rng() * letters.length)];
  const d2 = digits[Math.floor(rng() * digits.length)];
  return `${d1}${l}${d2}`;
}

function genUniqueKey(rng: () => number, used: Set<string>): string {
  let suffix = genKeySuffix(rng);
  while (used.has(suffix)) suffix = genKeySuffix(rng);
  used.add(suffix);
  return `KH•••${suffix}`;
}

/* Vị trí dừng trong hành trình mở TK — biến NỘI BỘ của hàm sinh, không lộ ra Customer. Từ đây
   SUY RA tính khả dụng của age/nav/tenure, không gán độc lập. */
type Pos = "s1" | "s2" | "s3" | "s5" | "done";

/* Phân bố lệch hợp lý theo đời thực: phần lớn khách dừng giữa chừng (rớt rải đều qua các bước),
   khoảng 1/4 hoàn tất mở tài khoản. */
const POSITIONS: ReadonlyArray<readonly [Pos, number]> = [
  ["s1", 0.1],
  ["s2", 0.2],
  ["s3", 0.25],
  ["s5", 0.2],
  ["done", 0.25],
];

const AGE_BANDS: ReadonlyArray<readonly [AgeBand, number]> = [
  ["18-24", 0.25],
  ["25-34", 0.35],
  ["35-49", 0.28],
  ["50+", 0.12],
];

const NAV_BANDS_STANDARD: ReadonlyArray<readonly [NavBand, number]> = [
  ["<50tr", 0.3],
  ["50-200tr", 0.3],
  ["200tr-1tỷ", 0.22],
  ["1-5tỷ", 0.13],
  [">5tỷ", 0.05],
];

/* Khách chuyển từ CTCK khác thường đã có tài sản sẵn — NAV khai lúc chuyển sang lệch cao hơn. */
const NAV_BANDS_TRANSFER: ReadonlyArray<readonly [NavBand, number]> = [
  ["<50tr", 0.05],
  ["50-200tr", 0.15],
  ["200tr-1tỷ", 0.3],
  ["1-5tỷ", 0.35],
  [">5tỷ", 0.15],
];

const TENURE_FRESH: ReadonlyArray<readonly [TenureBand, number]> = [
  ["<6 tháng", 0.6],
  ["6-24 tháng", 0.25],
  ["2-5 năm", 0.1],
  [">5 năm", 0.05],
];

/* Khách 50+ / chuyển từ CTCK khác thường là quan hệ lâu năm hơn — tenure lệch dài hơn nhóm mới. */
const TENURE_ESTABLISHED: ReadonlyArray<readonly [TenureBand, number]> = [
  ["<6 tháng", 0.1],
  ["6-24 tháng", 0.2],
  ["2-5 năm", 0.3],
  [">5 năm", 0.4],
];

const ACQ_CHANNELS: ReadonlyArray<readonly [AcqChannel, number]> = [
  ["banner", 0.22],
  ["giới thiệu", 0.2],
  ["chi nhánh", 0.18],
  ["tự tìm", 0.25],
  ["đối tác", 0.15],
];

const PF_CHOICES: ReadonlyArray<readonly ["android" | "ios", number]> = [
  ["android", 0.55],
  ["ios", 0.45],
];

const SEG_MOI = "Mới mở TK";
const SEG_TRANSFER = "Khách chuyển từ CTCK khác";
const SEG_50 = "Khách 50+";

type GenCustomer = Customer & { readonly _pos: Pos; readonly _deposited: boolean };

function pickSeg(rng: () => number, pastStep02: boolean): string {
  /* seg 'Khách 50+' đòi hỏi age='50+' đã biết (bất biến C1) — age chỉ biết được sau bước 02,
     nên seg này chỉ được gán cho khách đã qua bước 02. Tương tự, khách "chuyển từ CTCK khác" là
     quan hệ đã có sẵn, hợp lý hơn khi khách đã đi được một đoạn trong hành trình mở TK mới. */
  if (pastStep02) {
    const r = rng();
    if (r < 0.06) return SEG_TRANSFER;
    if (r < 0.18) return SEG_50;
  }
  return SEG_MOI;
}

function stFor(pos: Pos, deposited: boolean): string {
  switch (pos) {
    case "s1": return "Bỏ dở tại bước 01";
    case "s2": return "Bỏ dở tại bước 02";
    case "s3": return "Bỏ dở tại bước 03";
    case "s5": return "Bỏ dở tại bước 05";
    case "done": return deposited ? "Đã hoàn tất, đã nạp tiền" : "Đã hoàn tất, chưa nạp tiền";
  }
}

function genOne(rng: () => number, usedKeys: Set<string>): GenCustomer {
  const pos = pickWeighted(rng, POSITIONS);
  /* "Đã qua bước 02" = đã rời khỏi s1/s2 (bước 02 là chụp CCCD/VNeID — chụp XONG mới có ngày
     sinh); dừng NGAY TẠI s2 nghĩa là đang giữa chừng bước đó, chưa chắc đã chụp xong, nên vẫn
     xếp vào "chưa qua". Diễn giải này là quyết định của section này khi đặc tả không nói rõ biên
     tại s2 — xem mục (e) trong báo cáo. */
  const pastStep02 = pos === "s3" || pos === "s5" || pos === "done";
  const seg = pickSeg(rng, pastStep02);
  const isTransfer = seg === SEG_TRANSFER;
  const isDone = pos === "done";

  /* age — QUY LUẬT hành trình: chưa qua bước 02 thì chưa có ngày sinh, không phải bug. */
  const age: AgeBand | typeof UNKNOWN_YET =
    !pastStep02 ? UNKNOWN_YET : seg === SEG_50 ? "50+" : pickWeighted(rng, AGE_BANDS);

  /* deposited — chỉ có ý nghĩa khi tài khoản đã kích hoạt xong (done); trước đó không thể nạp
     tiền vào một tài khoản chưa mở xong. */
  const deposited = isDone ? rng() < 0.7 : false;

  /* nav — QUY LUẬT: biết được khi (đã mở xong TK VÀ đã nạp tiền) HOẶC khách chuyển từ CTCK khác
     (nhóm này khai NAV ngay lúc chuyển sang, không cần đợi nạp tiền ở TK mới). */
  const navKnownByDeposit = isDone && deposited;
  const navKnown = navKnownByDeposit || isTransfer;
  const nav: NavBand | typeof UNKNOWN_YET = navKnown
    ? pickWeighted(rng, isTransfer ? NAV_BANDS_TRANSFER : NAV_BANDS_STANDARD)
    : UNKNOWN_YET;

  /* tenure — QUY LUẬT: biết được khi đã mở xong tài khoản (done); trước đó hành trình chưa tới
     chỗ có thể tính tenure quan hệ. */
  const tenure: TenureBand | typeof UNKNOWN_YET = isDone
    ? pickWeighted(rng, seg === SEG_MOI ? TENURE_FRESH : TENURE_ESTABLISHED)
    : UNKNOWN_YET;

  /* tier — high-value CHỈ gán khi NAV đã chắc chắn biết (khách chuyển từ CTCK khác, hoặc đã mở
     xong + đã nạp tiền + NAV thuộc dải cao) — đúng bất biến C1 (high-value ⟹ nav không sentinel). */
  let tier: string;
  if (isTransfer) {
    tier = "high-value";
  } else if (navKnown && (nav === "1-5tỷ" || nav === ">5tỷ")) {
    tier = "high-value";
  } else if (pos === "s1" || pos === "s2") {
    tier = rng() < 0.7 ? "new" : "standard";
  } else {
    tier = "standard";
  }

  /* acq — biết được từ chạm đầu tiên nên gần như luôn có (mặc định gán ngay ở đây); hai ổ
     'chưa-biết' (bounce tức thời, attribution chưa kịp resolve) và 'thiếu' (bug CRM) được phủ
     lên một cách CÓ CHỦ ĐÍCH ở bước hậu xử lý bên dưới, không xáo trộn logic sinh cơ bản này. */
  const acq: AcqChannel = pickWeighted(rng, ACQ_CHANNELS);

  const pf = pickWeighted(rng, PF_CHOICES);
  const key = genUniqueKey(rng, usedKeys);

  return {
    key,
    seg,
    tier,
    pf,
    st: stFor(pos, deposited),
    age,
    nav,
    tenure,
    acq,
    _pos: pos,
    _deposited: deposited,
  };
}

/* generateCustomers — sinh N khách demo TẤT ĐỊNH (cùng seed số ⇒ cùng kết quả mọi lần chạy).
   Khoá sinh ra KHÔNG được trùng với khoá của 7 khách thật trong seed — vì demoData ghép cả hai
   (xem lý do ở demoData bên dưới), nạp trước các khoá thật vào usedKeys để loại va chạm. */
export function generateCustomers(n: number): Customer[] {
  const rng = mulberry32(DEMO_SEED);
  const usedKeys = new Set<string>(seed.cust.map((c) => c.key.slice(-3)));
  const list: GenCustomer[] = [];
  for (let i = 0; i < n; i++) list.push(genOne(rng, usedKeys));

  /* ---- Phủ có chủ đích hai ổ 'thiếu' (bug dữ liệu thật, khác hẳn 'chưa-biết' quy luật) ----
     Chọn theo THỨ TỰ sinh (không random thêm) để số lượng luôn > 0 một cách tất định, không phụ
     thuộc may rủi của một lần rút PRNG có thể ra toàn trượt. */

  /* Ổ 1: ~4% khách ĐÃ NẠP TIỀN nhưng nav bị pipeline làm rớt — chỉ chọn trong nhóm nav biết được
     QUA ĐƯỜNG NẠP TIỀN (không đụng khách chuyển từ CTCK khác — NAV của họ đến từ tự khai lúc
     chuyển, không qua pipeline nạp tiền nên không dính bug này), và KHÔNG được chọn khách
     high-value (bất biến C1: high-value ⟹ nav không sentinel). */
  const navBugPool = list.filter(
    (c) => c._deposited && c.seg !== SEG_TRANSFER && c.tier !== "high-value" && c.nav !== UNKNOWN_YET,
  );
  const navBugCount = Math.max(3, Math.round(navBugPool.length * 0.04));
  for (let i = 0; i < Math.min(navBugCount, navBugPool.length); i++) {
    (navBugPool[i] as Customer).nav = MISSING;
  }

  /* Ổ 2: ~3% tổng khách có acq 'thiếu' — kênh mở TK mới ra mắt, CRM chưa tích hợp ghi nguồn. */
  const acqBugCount = Math.max(5, Math.round(n * 0.03));
  let acqBugPicked = 0;
  for (const c of list) {
    if (acqBugPicked >= acqBugCount) break;
    (c as Customer).acq = MISSING;
    acqBugPicked++;
  }

  /* ---- Phủ 'chưa-biết' hợp lệ cho acq (khác ổ 'thiếu' ở trên) ----
     Một phần nhỏ khách bounce NGAY tại s1 (chạm đầu tiên) rơi vào cửa sổ attribution bất đồng bộ
     chưa kịp resolve kênh — đây là QUY LUẬT độ trễ pipeline, không phải bug mất dữ liệu, nên
     không dùng ổ 'thiếu'. Chỉ áp cho khách CHƯA bị gán 'thiếu' ở ổ 2 để hai ổ không giẫm nhau. */
  const s1Pool = list.filter((c) => c._pos === "s1" && c.acq !== MISSING);
  const acqUnknownCount = Math.max(5, Math.round(s1Pool.length * 0.3));
  for (let i = 0; i < Math.min(acqUnknownCount, s1Pool.length); i++) {
    (s1Pool[i] as Customer).acq = UNKNOWN_YET;
  }

  return list.map(({ _pos, _deposited, ...c }) => c);
}

/* Ghép 7 khách THẬT của seed (giữ nguyên, không sửa) với 293 khách SINH — tổng vẫn đúng 300.
   KHÔNG thay hẳn bằng generateCustomers(300): nếu bỏ 7 khách thật, mọi `issue.cust` trong seed
   trỏ tới 7 khoá đó (vd CXI-021 → KH•••7A2…) sẽ thành tham chiếu ma, và validateFixture nhóm 3
   ("khách X không có trong fixture") sẽ đỏ ngay — vi phạm đúng tiêu chí quan trọng nhất của
   section này. Đây là chỗ công thức minh hoạ trong đặc tả (`cust: generateCustomers(300)`) va
   với ràng buộc thật của validateFixture; ghép thay vì thay thế là cách giữ cả hai vế: tổng
   300 khách VÀ validateFixture rỗng. */
export const demoData: CxmData = { ...seed, cust: [...seed.cust, ...generateCustomers(293)] };
