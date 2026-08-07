import type { CfgBandAxis, CxmData, Customer, Dim, AgeBand, NavBand, TenureBand, AcqChannel, Evidence, EvidenceKind, Signal, TaxNode, Snapshot, MetricHistory, Issue, Metric } from "../schema/index.ts";
import { metricDirection } from "../metric-direction.ts";
import { cfgDefault, dims, seed } from "./seed.ts";
import { UNKNOWN_YET, MISSING } from "../segment.ts";
import { ANON_CK } from "../validate.ts";
import { bandLabels } from "../bands.ts";
import { projectCustomerBands } from "../projectBands.ts";
import { projectSignalCounts, type SigCount } from "../projectSignalCounts.ts";
import { CUST_CAT } from "../rawFields.ts";

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

/* Hạt giống RIÊNG cho việc rút số thô (rawInBand). Phải là một STREAM TÁCH BIỆT, không dùng chung
   `rng` của các phép rút phân bố: mỗi lần gọi rng() làm dịch toàn bộ chuỗi số phía sau, nên rút
   thêm 3 số/khách từ cùng stream sẽ sinh ra 300 khách KHÁC HẲN — đo được: 'tự tìm' đổi từ 62 sang
   70 khách, làm sai mọi oracle đã live-check trên app đang chạy. Tách stream thì mọi phép rút cũ
   nhận đúng dãy số như trước ⇒ fixture demo không đổi một khách nào, chỉ được thêm số thô. */
const RAW_SEED = 0xc0ffee ^ 0x5a5a5a;

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
  ["5tỷ+", 0.05],
];

/* Khách chuyển từ CTCK khác thường đã có tài sản sẵn — NAV khai lúc chuyển sang lệch cao hơn. */
const NAV_BANDS_TRANSFER: ReadonlyArray<readonly [NavBand, number]> = [
  ["<50tr", 0.05],
  ["50-200tr", 0.15],
  ["200tr-1tỷ", 0.3],
  ["1-5tỷ", 0.35],
  ["5tỷ+", 0.15],
];

const TENURE_FRESH: ReadonlyArray<readonly [TenureBand, number]> = [
  ["<6 tháng", 0.6],
  ["6-24 tháng", 0.25],
  ["2-5 năm", 0.1],
  ["5 năm+", 0.05],
];

/* Khách 50+ / chuyển từ CTCK khác thường là quan hệ lâu năm hơn — tenure lệch dài hơn nhóm mới. */
const TENURE_ESTABLISHED: ReadonlyArray<readonly [TenureBand, number]> = [
  ["<6 tháng", 0.1],
  ["6-24 tháng", 0.2],
  ["2-5 năm", 0.3],
  ["5 năm+", 0.4],
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

/* Rút một GIÁ TRỊ THÔ nằm trong đúng dải vừa chọn được. Các bảng weight bên trên vẫn quyết định
   phân bố THEO DẢI (giữ nguyên chủ ý owner đã chốt, không đổi một con số nào); helper này chỉ hạ
   nhãn đó xuống thành số, để `bandOf` chiếu lại ra CHÍNH nhãn ấy dưới `cfgDefault` — phân bố demo
   không đổi — nhưng khi owner sửa cut thì cùng số thô đó rơi sang dải khác.

   `topMax` là trần lấy mẫu cho dải CUỐI (dải mở, không có biên trên): chọn tay ở tầng fixture, cùng
   loại quyết định với các bảng weight bên trên (data/fixtures/ được phép mã hoá mẫu bằng tay).
   Nhãn không thuộc dải nào ⇒ ném, không lặng lẽ trả 0: chỉ xảy ra khi ai đó sửa `cfgDefault.cuts`
   mà quên bảng weight, và im lặng ở đây sẽ ra một fixture nói dối. */
function rawInBand(rng: () => number, axis: CfgBandAxis, label: string, topMax: number): number {
  const i = bandLabels(axis).indexOf(label);
  if (i < 0) {
    throw new Error(`fixture demo: nhãn "${label}" không phải dải nào của cfgDefault (cuts đã đổi?)`);
  }
  const lower = i === 0 ? axis.min ?? 0 : axis.cuts[i - 1];
  const upper = i < axis.cuts.length ? axis.cuts[i] : topMax;
  return Math.floor(lower + rng() * (upper - lower));
}

/* Trần lấy mẫu của dải cuối từng trục — 10 tỷ đồng / 75 tuổi / 15 năm quan hệ: đủ rộng để dải mở
   không dồn hết vào một điểm, đủ hẹp để không sinh ra khách vô lý. */
const NAV_TOP_MAX = 10e9;
const AGE_TOP_MAX = 75;
const TENURE_TOP_MAX = 180;

/* Ranh giới thâm niên (S2, 04/08): `tenure` đã RÚT khỏi `cfgDefault.segment.band` (chiều không còn
   cắt chart), nên `rawInBand` không còn đọc được `cfgDefault.segment.band.tenure`. Hằng MODULE-LOCAL
   này giữ ĐÚNG số cũ (`{min:null, cuts:[6,24,60], unit:'tháng'}`) — cùng tiền lệ với NAV_BANDS_TRANSFER/
   TENURE_ESTABLISHED trong file này (data/fixtures/ được phép mã hoá hằng riêng). Mục đích DUY NHẤT:
   giữ nguyên xi số lần và thứ tự rút từ `rawRng` — đổi nguồn ranh giới nhưng KHÔNG đổi giá trị, nên
   mọi khách sinh sau điểm này không dịch một bit (xem oracle đối chiếu `sigCountsDemo`/`custBandsDemo`
   trong báo cáo đợt này). `Customer.tenureMonths` (dữ kiện thô) vẫn sinh ra như cũ — chỉ chiều CẮT
   chart theo nó đã rút, không phải dữ kiện. */
const TENURE_BAND: CfgBandAxis = { min: null, cuts: [6, 24, 60], unit: "tháng" };

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

function genOne(rng: () => number, rawRng: () => number, usedKeys: Set<string>): GenCustomer {
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

  /* nav — LUÔN CÓ GIÁ TRỊ, không có sentinel (owner chốt 04/08: "NAV sẽ lấy trực tiếp từ giá trị tài
     sản hiện tại của KH nên ko thể có ko xác định"). Bản trước đây coi NAV là trường phải đợi khai
     báo (chỉ biết sau khi nạp tiền / khách chuyển từ CTCK khác) nên 79% khách rơi vào 'chưa-biết' —
     sai nguồn dữ liệu: NAV đọc thẳng từ tài sản đang có nên khách chưa nạp tiền vẫn tính được, bằng 0.
     Khách chưa có đồng nào ⇒ dải thấp nhất '<50tr' (owner chốt dồn vào đây, không thêm dải '0đ'). */
  const hasAssets = (isDone && deposited) || isTransfer;
  const nav: NavBand = hasAssets
    ? pickWeighted(rng, isTransfer ? NAV_BANDS_TRANSFER : NAV_BANDS_STANDARD)
    : "<50tr";

  /* tenure — QUY LUẬT: biết được khi đã mở xong tài khoản (done); trước đó hành trình chưa tới
     chỗ có thể tính tenure quan hệ. */
  const tenure: TenureBand | typeof UNKNOWN_YET = isDone
    ? pickWeighted(rng, seg === SEG_MOI ? TENURE_FRESH : TENURE_ESTABLISHED)
    : UNKNOWN_YET;

  /* tier — high-value gán theo NAV thuộc dải cao. Không còn phải canh "NAV đã biết chưa" như bản cũ:
     chỉ khách CÓ tài sản mới rút được dải cao (nhóm không có tài sản bị ghim '<50tr' ở trên), nên điều
     kiện dải cao đã hàm ý có tài sản — thêm `hasAssets &&` chỉ là một luật thứ hai để trôi lệch. */
  let tier: string;
  if (isTransfer) {
    tier = "high-value";
  } else if (nav === "1-5tỷ" || nav === "5tỷ+") {
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

  /* ---- Hạ ba nhãn dải vừa rút xuống GIÁ TRỊ THÔ (nguồn thật của nhãn, xem data/projectBands.ts) ----
     Sentinel đi thẳng qua: 'chưa-biết' của age/tenure là QUY LUẬT hành trình, không có số nào đại
     diện được cho nó (bandOf trả lại nguyên vẹn, không dải nào hấp thụ).
     navVnd của khách KHÔNG có tài sản là **0 chính xác**, không phải số ngẫu nhiên trong dải thấp
     nhất: tài sản của họ đúng bằng 0 (chưa nạp tiền / chưa mở xong TK). Nhờ vậy nhóm "chưa có tài
     sản" tách được khỏi nhóm "có ít tài sản" nếu owner thêm một cut sát 0 — đúng ca dùng mà
     data/bands.ts đã lường trước (nhãn "0đ"). */
  const ageYears = age === UNKNOWN_YET ? UNKNOWN_YET : rawInBand(rawRng, cfgDefault.segment.band.age, age, AGE_TOP_MAX);
  const navVnd = hasAssets ? rawInBand(rawRng, cfgDefault.segment.band.nav, nav, NAV_TOP_MAX) : 0;
  const tenureMonths =
    tenure === UNKNOWN_YET ? UNKNOWN_YET : rawInBand(rawRng, TENURE_BAND, tenure, TENURE_TOP_MAX);

  return {
    key,
    seg,
    tier,
    pf,
    st: stFor(pos, deposited),
    ageYears,
    navVnd,
    tenureMonths,
    /* Nhãn nhóm mà BẢNG WEIGHT vừa chọn — CHỦ Ý phân bố của fixture. Phép chiếu ở cuối file tính
       lại chúng từ số thô; hai bên phải bằng nhau, và projectBands.test.ts so đúng cặp đó trên cả
       300 khách để bắt lỗi lệch biên một đơn vị của rawInBand. */
    bands: { age, nav, tenure },
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
  /* Stream thứ hai, khởi tạo TRONG hàm (không phải ở module) để mỗi lần gọi generateCustomers đều
     rút lại từ đầu — hằng ở module sẽ khiến lần gọi thứ hai ra số khác lần đầu, mất tính tất định. */
  const rawRng = mulberry32(RAW_SEED);
  const usedKeys = new Set<string>(seed.cust.map((c) => c.key.slice(-3)));
  const list: GenCustomer[] = [];
  for (let i = 0; i < n; i++) list.push(genOne(rng, rawRng, usedKeys));

  /* ---- Phủ có chủ đích hai ổ 'thiếu' (bug dữ liệu thật, khác hẳn 'chưa-biết' quy luật) ----
     Chọn theo THỨ TỰ sinh (không random thêm) để số lượng luôn > 0 một cách tất định, không phụ
     thuộc may rủi của một lần rút PRNG có thể ra toàn trượt. */

  /* Ổ 'thiếu' của nav đã BỎ (owner chốt 04/08). Nó dựng trên tiền đề "NAV đi qua pipeline nạp tiền
     nên pipeline làm rớt được" — mà NAV đọc trực tiếp từ tài sản hiện tại thì không có bước nào để
     rớt. Trục nav từ nay KHÔNG có sentinel nào (cả 'chưa-biết' lẫn 'thiếu'); phần minh hoạ "hai loại
     không biết khác nhau" nằm hết ở trục acq bên dưới, chỗ bug thu thập là thật. */

  /* Ổ 'thiếu' của acq: ~3% tổng khách — kênh mở TK mới ra mắt, CRM chưa tích hợp ghi nguồn. */
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

/* ---------- Bằng chứng demo cho từng theme (Module F, section F2) ----------
   seed chỉ có 17 evidence rải cho 14 theme (`data.tax` với lv:'theme') — chia theo bất kỳ chiều
   nào cũng ra n≈1, đúng nhưng vô dụng (module-f-charter.md, mục "Chỗ dataset thật sự thiếu").
   Sinh THÊM bằng chứng, KHÔNG đụng seed.ev, bằng một RNG THỨ HAI seed riêng (DEMO_EV_SEED khác
   DEMO_SEED) — nếu chèn draw mới vào CÙNG một chuỗi rng với generateCustomers thì mọi số khách
   test đã ghim (vd `demoData.cust.length === 300`, các tỷ lệ age/nav/tenure/acq) sẽ lệch theo,
   vì chuỗi draw sẽ dài ra và mọi giá trị rút SAU điểm chèn đổi hết. Hai rng độc lập ⇒ chuỗi
   customer không đổi một bit dù gọi generateEvidence lúc nào. */
const DEMO_EV_SEED = 0xbeef;

/* KHÔNG dùng số TUYỆT ĐỐI cố định cho mọi theme — mẫu số của "đủ bằng chứng để chart đọc được"
   không phải một hằng số chung, mà là `theme.n` (bề rộng thanh trong ThemeStackBlock: số tổng
   hợp 210-412, lệch tới ~7×/theme trong seed). Bản trước dùng 40 cố định: coverage = 40/theme.n
   ra 10% cho theme.n=412 (x-th-device) nhưng 19% cho theme.n=210 (x-th-wait) — hai theme cùng
   "vài chục bằng chứng" nhưng một thanh gần như trắng, một thanh gần như đặc xám, không phải vì
   dữ liệu khác nhau mà vì đơn vị sinh sai (owner đã bác đúng hình này trước đó ở trục subtheme).
   Sửa: mỗi theme sinh COVERAGE × theme.n bằng chứng — cùng % phủ cho mọi theme dù n lệch bao nhiêu. */
const COVERAGE = 0.7;
/* 0.7 chứ không phải 1.0: phải CÒN một đoạn xám thật (30% theme.n) để nhãn "Phủ X%" có ý nghĩa —
   phủ hết 100% xoá mất chính thông tin "bằng chứng không phủ hết khối lượng" mà đoạn xám tồn tại
   để nói. */
function evCountForTheme(theme: TaxNode): number {
  return Math.round(theme.n * COVERAGE);
}

/* Ánh xạ theme -> (L1, L2) chọn theo đúng nội dung `why`/`name` của từng theme trong seed.ts.
   validateFixture nhóm 9 KHÔNG đòi L1/L2/theme phải khớp nghĩa nhau (chỉ đòi đúng 1 node mỗi
   tầng) — bảng này chỉ để demo không tạo cảnh evidence "Đặt lệnh" lại gắn theme "Trải nghiệm
   nhanh mượt", gây hiểu lầm lúc review tay (nghĩa vụ review #1 trong charter: đếm tay một đoạn). */
const THEME_TAX: Record<string, readonly [string, string]> = {
  "x-th-device": ["x-l1-mtk", "x-l2-ekyc"],
  "x-th-guide": ["x-l1-mtk", "x-l2-ekyc"],
  "x-th-status": ["x-l1-mtk", "x-l2-sign"],
  "x-th-wait": ["x-l1-care", "x-l2-claim"],
  "x-th-info": ["x-l1-trade", "x-l2-bond"],
  "x-th-praise": ["x-l1-mtk", "x-l2-ekyc"],
  "x-th-fee": ["x-l1-trade", "x-l2-eq"],
  "x-th-slow": ["x-l1-cash", "x-l2-wd"],
  "x-th-start": ["x-l1-mtk", "x-l2-actv"],
  "x-th-branch": ["x-l1-mtk", "x-l2-ekyc"],
  "x-th-notify": ["x-l1-mtk", "x-l2-sign"],
  "x-th-nfc": ["x-l1-mtk", "x-l2-ekyc"],
  "x-th-cs": ["x-l1-care", "x-l2-hotl"],
  "x-th-fast": ["x-l1-cash", "x-l2-dep"],
};

/* pf lấy từ giá trị nền tảng THẬT đang dùng trên Evidence trong seed (EV-101..EV-601 dùng đúng
   'android'/'ios'/'web' — xem seed.ts, khối `ev`), không bịa tên nền tảng mới.

   `Evidence.pf` nghĩa là NỀN TẢNG CỦA LẦN TƯƠNG TÁC ĐÓ, không phải nền tảng của khách. Không phải
   lựa chọn tuỳ ý — dữ liệu bắt buộc thế: `PF_CHOICES` phía trên chỉ sinh 'android'|'ios' cho
   `Customer.pf`, KHÔNG có 'web'. Nếu suy pf của bằng chứng từ khách thì đoạn 'web' biến mất khỏi
   mọi bằng chứng đối chiếu được, trong khi seed.ev có bằng chứng 'web' thật. Hệ quả cho chart:
   chip pf đọc là "kênh phát sinh phản hồi", một khách android vẫn gửi được phản hồi từ web. */
const EV_PF: ReadonlyArray<readonly [string, number]> = [
  ["android", 0.4],
  ["ios", 0.35],
  ["web", 0.25],
];

/* Nguồn thật đang có trong seed.sources — kind suy từ đúng loại nguồn (event/case/verbatim/
   survey-response) để không sinh cảnh "sự kiện app" mà lại gắn nguồn "ghi chú broker". */
const EV_SOURCES: ReadonlyArray<readonly [string, number]> = [
  ["src-ekyc", 0.2],
  ["src-case", 0.2],
  ["src-store", 0.15],
  ["src-survey", 0.2],
  ["src-broker", 0.15],
  ["src-ga", 0.1],
];

const EV_KIND_BY_SOURCE: Record<string, EvidenceKind> = {
  "src-ekyc": "event",
  "src-case": "case",
  "src-store": "verbatim",
  "src-survey": "survey-response",
  "src-broker": "verbatim",
  "src-ga": "event",
};

/* Bước gắn bằng chứng — PHÁI SINH từ chính `seed.steps`, KHÔNG hardcode danh sách bước.
   Lý do (owner chốt 04/08): "khung của bản đồ hành trình là chính xác cho cả bản real, không chỉ
   demo; chỉ có các data và set là chưa chốt, các touchpoint cũng chưa đầy đủ". Khung bước là thật và
   sẽ DÀI RA. Bảng cũ ghi cứng s1..s6 kèm trọng số tôi tự đặt: thêm bước thứ 7 vào flow thì bảng đó
   vẫn chạy xanh mà không bao giờ sinh bằng chứng cho bước mới — sai âm thầm, đúng loại lỗi lời chốt
   trên cảnh báo.
   Trọng số = `obs.entered` của bước đó, tức số khách THỰC SỰ tới bước đó trong seed, thay vì 6 con số
   tôi bịa: phản hồi nhiều hay ít ở một bước trước hết tỷ lệ với lưu lượng đi qua bước đó. Bước không
   có `obs` (mới thêm, chưa đo) vẫn được vào danh sách với trọng số 1 để không bị bỏ rơi khỏi demo.
   CÒN NỢ: theme nào thuộc bước nào là quan hệ NGỮ NGHĨA và owner chưa chốt (mục "theme→step" trong
   phần hoãn) — hiện mọi theme rút bước theo cùng phân bố lưu lượng này. */
const EV_STEPS: ReadonlyArray<readonly [string, number]> = seed.steps.map((s) => {
  const entered = seed.obs.find((o) => o.stepId === s.id)?.entered ?? 1;
  return [s.id, entered] as const;
});

/* Tỷ lệ ẨN DANH: 8% — đủ nhỏ để không chiếm mất khối lượng "đối chiếu được" (mục đích chính của
   F2), nhưng đủ để đoạn "Ẩn danh" của chart có gì để vẽ ở MỌI theme (theme nhỏ nhất x-th-nfc sinh
   41 dòng × 8% = 3.3 kỳ vọng, không phải 0). Không có nguồn đo thật cho tỷ lệ này (đây LÀ số demo,
   không phải phép đo) — chọn dựa trên tỷ lệ Ẩn danh quan sát được trong seed (2/17 ≈ 12%, xem
   seed.ts EV-103/EV-304), lấy tròn xuống 8% để phần lớn evidence vẫn đối chiếu được khách thật. */
const ANON_RATE = 0.08;

/* ---------- Lệch theo theme (Module F, section F2b) ----------
   Bản F2 đầu rút `ck` ĐỀU từ 300 khách bất kể bằng chứng thuộc theme nào. Hệ quả: chia theme theo
   BẤT KỲ chiều khách nào cũng ra đúng phân bố dân số ⇒ mọi theme cho cùng một hình, và ở theme nhỏ
   (41 dòng, 4 dải) thì khác biệt duy nhất giữa các cột là nhiễu rút thăm — người đọc lại hiểu nhiễu
   là phát hiện. Nó phản lại đúng mục đích owner đặt cho nút toggle, ghi nguyên văn ở
   SplitToggle.tsx:1 ("khi thấy vấn đề có thể toggle để xem insight xem tập trung vào nhóm kh nào"):
   câu trả lời sẽ luôn là "không tập trung ở đâu cả".

   ĐO ĐƯỢC trước khi sửa — age của bằng chứng theme `x-th-branch`:
   18-24:24% · 25-34:30% · 35-49:13% · 50+:13% · chưa-biết:15% · ẩn danh:4%
   trong khi `why` của CHÍNH theme đó (seed.ts:281) viết "Chủ yếu từ segment 50+ gặp khó ở bước quay
   mặt". Dữ liệu demo mâu thuẫn với chú giải của chính nó.

   Vì sao được lệch: đây là `data/fixtures/` — cùng loại với NAV_BANDS_TRANSFER phía trên (đã mã hoá
   "khách chuyển CTCK có NAV cao hơn"). Bất biến "không bịa tỉ lệ" ràng buộc `domain/`: domain chỉ
   ĐẾM dữ liệu có sẵn, không bao giờ suy ra tỉ lệ. Chỗ này đang sinh dữ liệu, không đang đo.

   Chỉ lệch ở theme mà seed NÓI có tập trung. 10/14 theme rút đều — CÓ CHỦ ĐÍCH: "thanh phẳng" là
   một câu trả lời thật, và nếu MỌI theme đều lệch thì nút toggle vô nghĩa theo chiều ngược lại. */
type CustBias = {
  readonly field: "seg" | "nav" | "acq" | "tenure";
  readonly values: readonly string[];
  /* p = tỷ trọng bằng chứng của theme này rút từ nhóm KHỚP. Phần còn lại (1-p) rút đều toàn bộ 300
     khách — KỂ CẢ nhóm khớp và kể cả khách 'chưa-biết'/'thiếu'. Không lọc nhóm không biết ra khỏi
     tập rút: làm thế thì demoData sẽ không bao giờ sinh ra được cảnh "một phần khối lượng không
     quy được về nhóm nào", tức chart mất luôn thứ nó tồn tại để nói (defect D0). */
  readonly p: number;
};

type ThemeSkew = {
  /* ghi đè EV_PF cho riêng theme này */
  readonly pf?: ReadonlyArray<readonly [string, number]>;
  readonly cust?: CustBias;
};

const THEME_SKEW: Record<string, ThemeSkew> = {
  /* seed.ts:281 `why`: "Chủ yếu từ segment 50+ gặp khó ở bước quay mặt" — lệch theo `seg` chứ không
     theo `age` để một phát biểu duy nhất kéo theo cả ba chiều một cách nhất quán: seg 'Khách 50+'
     buộc age='50+' (bất biến C1, xem genOne) và dùng TENURE_ESTABLISHED. Lệch theo age trực tiếp sẽ
     ra khách "50+ mới mở TK 1 tháng" chiếm phần lớn theme quầy — vô lý khi soi bằng chip khác. */
  "x-th-branch": { cust: { field: "seg", values: [SEG_50], p: 0.55 } },

  /* seed.ts:279 `why`: "Khách đã có tài khoản nhưng chưa biết bước tiếp theo" — theme này ĐỊNH NGHĨA
     là về khách vừa mở xong. Lệch theo `tenure` chứ KHÔNG theo seg='Mới mở TK': đo được, seg đó đã
     chiếm 84.3% trong 300 khách demo (pickSeg gán nó cho gần như mọi khách chưa qua bước 02), nên
     "lệch" về nó không tạo được tập trung nào — trần chỉ còn 15.7%. Xem thêm ghi chú về seg gần suy
     biến trong module-f-charter.md. */
  "x-th-start": { cust: { field: "tenure", values: ["<6 tháng"], p: 0.6 } },

  /* seed.ts:277 `why`: "tập trung ở bán CK và trả lại trái phiếu sớm". Đây là SUY DIỄN, không phải
     phát biểu về nhóm khách: khách có trái phiếu để trả lại sớm thì có tài sản, nên lệch NAV cao.
     Cùng loại suy diễn với NAV_BANDS_TRANSFER đã có trong file. p thấp hơn hai theme trên vì căn cứ
     yếu hơn. Đây là chiều duy nhất làm cột NAV/tier có gì để đọc. */
  "x-th-fee": { cust: { field: "nav", values: ["1-5tỷ", ">5tỷ"], p: 0.45 } },

  /* seed.ts:273 `why`: "Khách không biết phải làm gì tiếp, hoặc thông báo lỗi chung chung" — SUY
     DIỄN: khách tự tìm đến / vào từ banner không có ai cầm tay, nên vướng hướng dẫn nhiều hơn khách
     vào qua giới thiệu hoặc chi nhánh. Chiều duy nhất làm cột acq có gì để đọc. */
  "x-th-guide": { cust: { field: "acq", values: ["tự tìm", "banner"], p: 0.45 } },

  /* KHÔNG lệch theo khách — lệch theo NỀN TẢNG, vì seed nói về thiết bị chứ không về nhóm khách:
     subtheme `x-sub-android` (seed.ts:287) có n=238 trên theme.n=412 = 58%. Lấy đúng 0.58 cho
     android thay vì bịa số. 174 còn lại là subtheme "giấy tờ chói/mờ", không đặc thù nền tảng; chia
     ios 0.27 / web 0.15 — web thấp vì luồng eKYC chụp giấy tờ chủ yếu trên mobile. */
  "x-th-device": {
    pf: [
      ["android", 0.58],
      ["ios", 0.27],
      ["web", 0.15],
    ],
  },
};

/* Tập khoá để rút `ck` cho MỘT theme: `all` là toàn bộ khách, `match` là nhóm khớp bias (rỗng nếu
   theme không lệch, khi đó p=0 nên nhánh match không bao giờ chạy). */
type CkPool = { readonly all: readonly string[]; readonly match: readonly string[]; readonly p: number };

/* Khớp MỘT khách với bảng lệch. Ba đường vì `tenure` không còn đi qua đường của `nav`:
   - `seg`/`acq`: dữ kiện danh mục đọc thẳng qua CUST_CAT (không phụ thuộc `dims`).
   - `nav`: NHÃN NHÓM nằm trong map đã chiếu (`c.bands.nav`) — trục còn tồn tại trong `dims`.
   - `tenure` (S2, 04/08): chiều đã RÚT khỏi `dims` nên `c.bands.tenure` không còn được tính, đọc
     THẲNG dữ kiện thô `c.tenureMonths` và so SỐ — đúng hướng dẫn "data/fixtures/ sinh dữ liệu,
     không phải tầng đo" (domain/ mới là nơi cấm hằng số bịa, không phải chỗ này). Ngưỡng "<6 tháng"
     hạ thành điều kiện số thô tương ứng (`< 6`), giữ NGUYÊN Ý NGHĨA cũ (nhóm quan hệ mới), chỉ đổi
     CHỖ SO vì không còn nhãn dải nào để so chuỗi. */
function matchesBias(c: Customer, bias: CustBias): boolean {
  if (bias.field === "tenure") {
    return typeof c.tenureMonths === "number" && c.tenureMonths < 6;
  }
  const v = CUST_CAT[bias.field]?.(c) ?? (c.bands[bias.field] as string);
  return bias.values.includes(v);
}

function ckPoolFor(theme: TaxNode, cust: readonly Customer[]): CkPool {
  const all = cust.map((c) => c.key);
  const bias = THEME_SKEW[theme.id]?.cust;
  if (!bias) return { all, match: [], p: 0 };
  const match = cust.filter((c) => matchesBias(c, bias)).map((c) => c.key);
  /* match rỗng = giá trị trong bảng không còn tồn tại trong tập khách (đổi enum, sai chính tả).
     Hạ p về 0 để không index vào mảng rỗng ra `undefined`. Không im lặng: test
     "theme có bias thì nhóm khớp phải chiếm ≥40%" trong demo.test.ts đỏ ngay khi bias mất tác dụng. */
  return { all, match, p: match.length > 0 ? bias.p : 0 };
}

function pickCk(rng: () => number, pool: CkPool): string {
  if (rng() < ANON_RATE) return ANON_CK;
  const from = rng() < pool.p ? pool.match : pool.all;
  return from[Math.floor(rng() * from.length)];
}

function genEvidenceForTheme(
  rng: () => number,
  theme: TaxNode,
  startIdx: number,
  pool: CkPool,
): Evidence[] {
  const [l1, l2] = THEME_TAX[theme.id];
  /* theme.cat luôn có giá trị cho lv:'theme' — validateFixture nhóm 8 đã bắt buộc điều này trên
     seed (seed qua được nhóm 8 ⇒ mọi theme trong THEME_TAX đều có cat hợp lệ). */
  const cat = theme.cat as string;
  const senBase = cat === "complaint" ? -0.6 : cat === "help" ? -0.2 : cat === "improvement" ? -0.1 : 0.7;

  const count = evCountForTheme(theme);
  const out: Evidence[] = [];
  for (let i = 0; i < count; i++) {
    const pf = pickWeighted(rng, THEME_SKEW[theme.id]?.pf ?? EV_PF);
    const src = pickWeighted(rng, EV_SOURCES);
    const step = pickWeighted(rng, EV_STEPS);
    const ck = pickCk(rng, pool);
    const sen = Math.max(-1, Math.min(1, senBase + (rng() - 0.5) * 0.4));

    out.push({
      id: `EV-DEMO-${theme.id}-${startIdx + i}`,
      kind: EV_KIND_BY_SOURCE[src],
      src,
      ref: `DEMO•••${startIdx + i}`,
      at: `28/07 · ${String(8 + (i % 12)).padStart(2, "0")}:00`,
      step,
      pf,
      cat,
      sen,
      shift: 0,
      q: `Bằng chứng demo sinh cho theme "${theme.name}" (#${i + 1}) — F2, không phải phản hồi thật.`,
      sig: `Demo · ${pf}`,
      ck,
      tax: [l1, l2, theme.id],
      why: `Sinh cho F2 để theme "${theme.id}" có đủ khối lượng bằng chứng chia được theo chiều`,
    });
  }
  return out;
}

/* generateEvidence — sinh bằng chứng demo TẤT ĐỊNH cho mọi theme. `cust` là TẬP KHÁCH ĐÃ SINH XONG
   (seed.cust + generateCustomers) để `ck` luôn trỏ vào một khách CÓ THẬT trong đúng bộ dữ liệu sẽ
   dùng nó — không tự bịa khoá mới như generateCustomers làm với genUniqueKey (đó là khoá KHÁCH, đây
   là khoá NỐI tới khách đã tồn tại). Nhận cả Customer chứ không chỉ `key` vì THEME_SKEW lệch theo
   TRƯỜNG của khách (seg/nav/acq), không đọc được từ mảng khoá. */
/* Sàn "mỗi bước có ít nhất MỘT bằng chứng". Đây là quyết định CHẤT LƯỢNG DEMO, KHÔNG phải phát biểu
   rằng luồng nhỏ nhận nhiều phản hồi hơn thực tế: hồ sơ bước trên màn mà rỗng bằng chứng thì người xem
   demo tưởng màn bị lỗi.
   Vì sao cần: `EV_STEPS` rút bước theo trọng số `obs.entered`, nên khi pilot mở rộng 05/08 thêm luồng
   NHỎ (tra soát nạp tiền 148 lượt/ngày, cạnh mở tài khoản 18.420) thì bước của luồng nhỏ có xác suất
   được rút ~0,09% mỗi lần — gần như không bao giờ trúng, và bước đó không có bằng chứng nào.
   Cách bù CỐ Ý là CHUYỂN ĐÍCH, không phải THÊM DÒNG: tổng số bằng chứng và số bằng chứng của TỪNG
   theme không đổi một dòng nào, nên `idx` (mã EV-DEMO-*), pool `ck` và mọi test so tỷ trọng theo theme
   (F2b) không bị xê dịch — chỉ trường `step` của đúng vài dòng đổi chỗ, lấy từ bước ĐÔNG NHẤT.
   Ném lỗi thay vì bù thiếu lặng lẽ: nếu bước đông nhất không đủ dòng để nhường thì giả định "vài dòng"
   đã sai và phải có người xem lại, không được để một bước vẫn rỗng mà test vẫn xanh. */
function coverEveryStep(ev: readonly Evidence[]): Evidence[] {
  const covered = new Set(ev.map((e) => e.step));
  const uncovered = seed.steps.filter((s) => !covered.has(s.id)).map((s) => s.id);
  if (uncovered.length === 0) return [...ev];

  const donor = [...EV_STEPS].sort((a, b) => b[1] - a[1])[0]![0];
  const donorIdx: number[] = [];
  for (let i = ev.length - 1; i >= 0 && donorIdx.length < uncovered.length; i--) {
    if (ev[i]!.step === donor) donorIdx.push(i);
  }
  if (donorIdx.length < uncovered.length) {
    throw new Error(
      `coverEveryStep: bước đông nhất (${donor}) chỉ có ${donorIdx.length} dòng để nhường, cần ${uncovered.length}`,
    );
  }
  const moveTo = new Map(donorIdx.map((i, k) => [i, uncovered[k]!] as const));
  return ev.map((e, i) => {
    const to = moveTo.get(i);
    return to === undefined ? e : { ...e, step: to };
  });
}

export function generateEvidence(themes: readonly TaxNode[], cust: readonly Customer[]): Evidence[] {
  const rng = mulberry32(DEMO_EV_SEED);
  const out: Evidence[] = [];
  let idx = 0;
  for (const theme of themes) {
    out.push(...genEvidenceForTheme(rng, theme, idx, ckPoolFor(theme, cust)));
    idx += evCountForTheme(theme);
  }
  return coverEveryStep(out);
}

/* Ghép 7 khách THẬT của seed (giữ nguyên, không sửa) với 293 khách SINH — tổng vẫn đúng 300.
   KHÔNG thay hẳn bằng generateCustomers(300): nếu bỏ 7 khách thật, mọi `issue.cust` trong seed
   trỏ tới 7 khoá đó (vd CXI-021 → KH•••7A2…) sẽ thành tham chiếu ma, và validateFixture nhóm 3
   ("khách X không có trong fixture") sẽ đỏ ngay — vi phạm đúng tiêu chí quan trọng nhất của
   section này. Đây là chỗ công thức minh hoạ trong đặc tả (`cust: generateCustomers(300)`) va
   với ràng buộc thật của validateFixture; ghép thay vì thay thế là cách giữ cả hai vế: tổng
   300 khách VÀ validateFixture rỗng. */
const demoCust: Customer[] = [...seed.cust, ...generateCustomers(293)];

/* Bằng chứng demo cộng thêm vào 17 bằng chứng thật của seed (giữ nguyên, không sửa) — theo đúng
   tập khách `demoCust` ở trên để `ck` luôn tra ra được (trừ sentinel Ẩn danh). */
const demoEv: Evidence[] = [
  ...seed.ev,
  ...generateEvidence(
    seed.tax.filter((t): t is TaxNode => t.lv === "theme"),
    demoCust,
  ),
];

/* ---------- Lần bắn tín hiệu — chart điểm đo (thiết kế output/thiet-ke-chart-signal.html §2) ----------
   Một dòng = MỘT lần một signal bắn ra một giá trị, có thể gắn hoặc KHÔNG gắn được với một khách.
   RÚT LẠI (owner chốt 05/08): docblock trước đây khẳng định hệ thống chạy thật CHỈ nhận NĂM BẢNG
   ĐẾM đã cộng sẵn, không đưa từng lần bắn qua mạng — đó là GIẢ ĐỊNH của người viết code, không phải
   quyết định của owner, và đã bị rút: nhận RAW (từng lần bắn) vẫn là một khả năng mở, app không được
   khoá cứng vào một chế độ nhận. Phép cộng/cắt (data/projectSignalCounts.ts) SỐNG ở tầng `data/` của
   ta đúng vì lý do đó — để cả hai chế độ nhận (đã cộng sẵn HAY raw) đều đi qua cùng một phép cộng và
   ra cùng hình dạng `sigCounts`. `Fire` chỉ sống trong file này vì bộ sinh demo là chủ của nó — KHÔNG
   phải vì raw bị cấm qua mạng; nếu sau này nhận raw thật, kiểu lần bắn của đường nhận đó khai riêng ở
   chỗ đọc dữ liệu thật, không nhất thiết trùng `Fire` (Fire chỉ mô phỏng đúng nhu cầu genFiresForSignal
   ở dưới). */
type Fire = { sigId: string; val: string; custKey: string | null; pf: string };

/* Hạt giống RIÊNG, KHÔNG dùng chung DEMO_SEED/RAW_SEED/DEMO_EV_SEED — cùng lý do đã nêu ở
   DEMO_EV_SEED: một stream riêng thì mọi số khách/bằng chứng đã sinh trước đó không lệch một bit dù
   thêm lần bắn vào lúc nào. */
const SIG_SEED = 0x51624e;

/* Tỉ lệ custKey NULL theo TỪNG SIGNAL — càng SỚM trong hành trình (tpId → stepId, s1 trước s6), càng
   ít lần bắn định danh được khách (thiết kế §3/§4: "Bắt đầu mở tài khoản" xảy ra TRƯỚC bước biết
   khách là ai nên gần như toàn bộ là "chưa định danh"). sg4 CỐ Ý lấy ĐÚNG 31% — khớp con số ví dụ
   minh hoạ trong thiết kế (§1, mock "410 lần bắn · 31% chưa gắn được với khách"). Các signal còn lại
   KHÔNG có số đo thật để tham chiếu — đây LÀ số demo (data/fixtures/ được phép mã hoá mẫu tay, cùng
   loại quyết định với NAV_BANDS_TRANSFER ở trên trong file này), chọn theo cùng quy luật giảm dần
   khi bước trong hành trình đi xa hơn (tp1/s1 cao nhất, tp6/s6 thấp nhất). */
const SIG_NULL_RATE: Record<string, number> = {
  sg1: 0.92, // tp1/s1 — bấm bắt đầu, trước MỌI bước định danh
  sg2: 0.92, // tp1/s1 — cùng bước, bắn lặp theo từng bước hiển thị
  sg3: 0.45, // tp2/s2 — đang chụp giấy tờ, một phần đã đối chiếu được
  sg4: 0.31, // tp2/s2 — khớp đúng ví dụ minh hoạ trong thiết kế §1
  sg5: 0.22, // tp3/s3 — qua liveness, phần lớn đã có hồ sơ
  sg11: 0.22, // tp3/s3 — cùng bước với sg5 nên cùng tỉ lệ, không có lý do gì lệch
  sg7: 0.15, // tp4/s4 — đã xác nhận thông tin
  sg8: 0.1, // tp5/s5 — sắp ký hợp đồng, gần như đã định danh
  sg10: 0.05, // tp6/s6 — tài khoản đã kích hoạt

  /* Pilot mở rộng 05/08 — quy luật ở đây NGƯỢC với mở tài khoản, và đó là điểm nghiệp vụ đáng nhìn
     nhất của cả nhóm này: muốn nạp · rút · chuyển tiền thì khách BUỘC phải đã đăng nhập và đã có tài
     khoản, nên gần như mọi lần bắn đều gắn được khách — "chưa định danh" gần 0, không phải cao ở đầu
     hành trình như mở TK.
     NGOẠI LỆ DUY NHẤT là `sg-nap-1`: tiền về TK chuyên dụng TRƯỚC khi biết tiền của ai (chính vì thế
     mới có bước đối soát, và mới có luồng tra soát). 0,40 là chỗ "chưa định danh" thật sự có nghĩa
     trong nhóm này. `sg-nap-2` còn 0,12 vì đối soát chỉ giải quyết được phần lớn, chưa phải toàn bộ.
     Vẫn LÀ số demo như 8 dòng trên, chọn theo quy luật vừa nêu chứ không phải số đo thật. */
  'sg-dvo-1': 0.06, // đã có TK cơ sở nên biết khách là ai
  'sg-dvo-2': 0.04,
  'sg-dvo-3': 0.02, // VSDC trả kết quả theo hồ sơ đã định danh
  'sg-nap-1': 0.4, // tiền tới trước khi biết của ai — khoảng mù thật của luồng nạp
  'sg-nap-2': 0.12, // sau đối soát vẫn còn khoản chưa ghép được
  'sg-nap-3': 0.03,
  'sg-tra-1': 0.03, // khách chủ động gửi yêu cầu khi đã đăng nhập
  'sg-tra-2': 0.03,
  'sg-tra-3': 0.05,
  'sg-rut-1': 0.02,
  'sg-rut-2': 0.02,
  'sg-rut-3': 0.04,
  'sg-rut-4': 0.02,
  'sg-ctn-1': 0.02,
  'sg-ctn-2': 0.03,
  'sg-ctn-3': 0.02,
};

/* Trọng số phân bố của MỘT signal — theo giá trị (`val`) và/hoặc theo nền tảng (`pf`). Thiếu khai thì
   mặc định chia ĐỀU, đúng như trước khi có bảng này.

   VÌ SAO CẦN: chia đều làm chart tự nói ngược spine. `sg-rut-2` lúc còn giá trị `pass` bị chia đều ra
   ~12,9% cho `pass` — tức 87% lệnh rút bị chặn — trong khi spine ngay phía trên nói 2.351/3.180 = 74%
   rút xong. Cùng một dân số, hai con số chửi nhau trên CÙNG một màn. Khai trọng số thì chart và spine
   thành CÙNG một phép tính, không còn là hai lần bịa độc lập.

   QUY TẮC THỨ HAI, owner chốt 05/08 sau khi xem màn — ĐIỂM ĐO KHÔNG GỘP "THÀNH CÔNG" VỚI "LÝ DO":
   khai đúng trọng số vẫn chưa đủ. Một giá trị áp đảo (thành công ~90%) nén mọi lý do thất bại xuống
   1–4px, mắt không phân biệt được 271 với 232 với 14 — chart mất đúng câu hỏi nó tồn tại để trả lời.
   Nên điểm đo nào có giá trị áp đảo VÀ từ 3 giá trị trở lên thì BỎ giá trị thành công, chỉ giữ các lý
   do; tỉ lệ thành/không đọc ở spine ngay phía trên nên không mất thông tin nào. Áp cho đúng 5 điểm đo
   (`sg-dvo-1` `sg-dvo-2` `sg-nap-2` `sg-rut-2` `sg-rut-3`), và `vol` của chúng đổi thành ĐÚNG số
   `failed` của bước tương ứng — nhờ vậy chart lại càng khớp spine chặt hơn trước.
   Loại chỉ 2 giá trị (`sg-dvo-3` 903/39, `sg-rut-4` 2.351/13, `sg-nap-3`) CỐ Ý giữ nguyên: chỉ hai
   cột thì hai con số đọc thẳng được, mà tách ra sẽ thành điểm đo một giá trị — vô nghĩa.

   QUY TẮC KHAI (một quy tắc, hai căn cứ hợp lệ — không xét từng signal theo cảm tính):
     (a) có một số `obs` trên cùng màn ràng buộc nó → khai theo đúng số đó;
     (b) có một câu trong `note` của flow nói rõ thứ tự lớn nhỏ → khai theo thứ tự đó.
   Không (a) cũng không (b) → ĐỂ CHIA ĐỀU và hiểu rằng đọc phân bố cột của signal đó là đọc sai.
   Trường hợp duy nhất như vậy ở nhóm này là `sg-tra-2` (số file đính kèm 0–5): note chỉ nói "tối đa
   5 file", không nói ai đính kèm mấy file — nên 6 cột bằng nhau là chỗ lấp, không phải phát hiện.

   Mọi tổng trọng số dưới đây = `Signal.vol` của signal đó, nên tỉ lệ đọc được thẳng ra số lượt.

   sg3 · sg5 · sg8 của mở tài khoản ĐÃ SỬA 05/08 (trước đó cố ý để nguyên vì ngoài phạm vi): cả ba là
   `['success','fail']` chia đều = 50% thất bại, trong khi obs của bước tương ứng chỉ 6–17%. Owner yêu
   cầu rà lại nhóm mở tài khoản nên sửa luôn — chấp nhận việc sigCounts của sg1..sg10 dịch và phải cập
   nhật các số ghim trong test (cập nhật số, KHÔNG nới test). */
const SIG_WEIGHT: Record<string, { val?: Record<string, number>; pf?: Record<string, number> }> = {
  /* (a) sg4.vol = 410 = số lần chụp thất bại, mỗi lần trượt có ĐÚNG một lý do — nên `fail` của sg3 phải
     bằng 410, không phải 460 do chia đều. Hai điểm đo cạnh nhau giờ khớp nhau bằng phép tính. */
  sg3: { val: { success: 510, fail: 410 } },
  /* (a) s3 obs 15840/13190/2650 → tỉ lệ trượt 16,7%. sg5 bắn 1.180 lần nên fail = 197 (16,7% của
     1.180), và 197 chính là vol của sg11 — cùng khuôn sg3+sg4. */
  sg5: { val: { success: 983, fail: 197 } },
  /* (a) 197 lần trượt liveness tách theo năm lý do ĐỀ XUẤT (xem docblock ở seed.ts): cổng này tên là
     "Liveness & Face match" nên không khớp mặt là lý do nặng nhất; `poor_lighting` kế thừa đúng ý của
     `sg6` đã bỏ. Tổng 197 = vol. */
  sg11: {
    val: { face_not_matched: 88, poor_lighting: 46, liveness_timeout: 36, spoof_suspected: 15, multiple_faces: 12 },
  },
  // (a) s5 obs 12760/11990/770 → trượt 6,0%. sg8 bắn 430 lần → fail 26, không phải 215 do chia đều.
  sg8: { val: { success: 404, fail: 26 } },
  // (a) obs s-dvo-1 1240/1050/190 — vol 190 = đúng failed; tách hai lý do của note, CCCD nặng hơn.
  'sg-dvo-1': { val: { no_base_account: 60, cccd_not_verified: 130 } },
  // (a) s-dvo-3 1010/942/68 — vol 238 > 68 vì bắn mỗi lần khách nhập lại OTP, không phải số ca trượt.
  'sg-dvo-2': { val: { otp_expired: 148, otp_not_received: 90 } },
  // (a) s-dvo-4 942/903/39 — khớp tuyệt đối, không có chỗ nào phải đoán.
  'sg-dvo-3': { val: { approved: 903, rejected: 39 } },
  /* (b) note luồng nạp: QR "ghi có ngay" là kênh chính; cổng NH gồm 5 bank; liên kết tự động chỉ
     BIDV·VPBank nên nhỏ nhất; quầy còn 4 TK tổng nhưng là kênh phụ.
     pf: quầy và liên kết tự động KHÔNG có phía khách bấm → chúng chính là phần `server` (1.340/9.640
     ≈ 14%). Chia đều 4 nền tảng sẽ nói "25% tiền nạp tại quầy" — một phát biểu không ai có ý nói. */
  'sg-nap-1': {
    val: { qr: 5400, bank_gateway: 2900, auto_debit_link: 640, counter: 700 },
    pf: { ios: 3600, android: 3400, web: 1300, server: 1340 },
  },
  // (a) s-nap-2 9640/9510/130 — vol 130 = đúng failed; phần lớn là không tìm ra chủ khoản.
  'sg-nap-2': { val: { holder_not_found: 104, amount_mismatch: 26 } },
  // (b) note: "nộp 17h–20h có thể chờ xử lý cuối ngày" → cuối ngày là cửa sổ hẹp, không phải một nửa.
  'sg-nap-3': { val: { immediate: 8600, end_of_day: 910 } },
  /* (a) bốn trong năm trạng thái lấy thẳng từ obs tra soát: chờ tiếp nhận 148 = mọi yêu cầu tạo ra,
     đang xử lý TTTT 136 = s-tra-3 entered, hoàn tất 113 = s-tra-4 completed, từ chối 8 = s-tra-4
     failed. `cho_ben_thu_ba` 15 là phần dư để tổng bằng vol 420 — trạng thái này không có obs riêng
     vì nó nằm BÊN TRONG bước xử lý (đúng quyết định gộp 6 trạng thái thành 4 bước đã ghi ở seed). */
  'sg-tra-3': {
    val: { cho_tiep_nhan: 148, dang_xu_ly_tttt: 136, cho_ben_thu_ba: 15, hoan_tat: 113, tu_choi: 8 },
  },
  /* (a) Bảy lý do chặn = đúng `failed` của sáu bước cổng (275·57·236·61·53·134). 134 của s-rut-6 tách
     hai theo note — blackout chỉ xảy ra sau 16h NGÀY LÀM VIỆC CUỐI THÁNG nên rất nhỏ so với quá hạn
     mức đêm. Tổng 816 = vol. */
  'sg-rut-2': {
    val: {
      insufficient_withdrawable: 275,
      rtt_below_100: 57,
      cccd_not_verified: 236,
      signature_missing: 61,
      otp_failed: 53,
      over_limit_after_16h: 120,
      month_end_blackout: 14,
    },
  },
  // (a) s-rut-3 2848/2612/236 — vol 236 = đúng failed, tách ba theo note; hết thời gian hay gặp nhất.
  'sg-rut-3': { val: { timeout: 110, mismatch: 60, app_not_installed: 66 } },
  // (a) s-rut-7 2364/2351/13 — khớp tuyệt đối.
  'sg-rut-4': { val: { success: 2351, bank_reject: 13 } },
  // (a) 219 = 42+136+41, đúng failed của ba cổng chuyển nội bộ; mỗi lý do về đúng cổng của nó.
  'sg-ctn-2': { val: { wrong_subaccount_pair: 42, insufficient_available: 136, otp_failed: 41 } },
};

/* Sinh các lần bắn của MỘT signal. `vol===0` (gap/designed) luôn đi kèm `values:[]` (luật khai ở
   seed.ts) nên không có gì để sinh — trả rỗng, không throw: đây là bộ sinh demo, không phải luật
   kiểm (validate.ts mới là nơi ném lỗi khi khai báo sai). */
function genFiresForSignal(rng: () => number, sig: Signal, custPool: readonly Customer[]): Fire[] {
  if (sig.vol === 0 || sig.values.length === 0) return [];
  // Phòng khi một signal mới thêm quên khai tỉ lệ ở SIG_NULL_RATE — mặc định 0.5, không throw.
  const nullRate = SIG_NULL_RATE[sig.id] ?? 0.5;
  /* Thiếu khai ở SIG_WEIGHT → trọng số 1 cho mọi mục, tức chia đều y như trước. Vẫn ĐÚNG MỘT lần
     rng() mỗi lần rút bất kể trọng số (xem pickWeighted), nên thêm trọng số cho signal mới không
     dịch một bit nào của sg1..sg10 — chúng đứng trước trong mảng và trọng số vẫn đều. */
  const w = SIG_WEIGHT[sig.id];
  const valWeights = sig.values.map((v) => [v, w?.val?.[v] ?? 1] as const);
  const pfWeights = sig.pf.map((p) => [p, w?.pf?.[p] ?? 1] as const);
  const out: Fire[] = [];
  for (let i = 0; i < sig.vol; i++) {
    const val = pickWeighted(rng, valWeights);
    const pf = pickWeighted(rng, pfWeights);
    const custKey = rng() < nullRate ? null : custPool[Math.floor(rng() * custPool.length)].key;
    out.push({ sigId: sig.id, val, custKey, pf });
  }
  return out;
}

/* generateFires — sinh TẤT ĐỊNH các lần bắn của MỌI signal. `custPool` PHẢI là tập khách CUỐI CÙNG
   sẽ dùng (`demoCust`) để `custKey` luôn tra ra được một khách thật — cùng nguyên tắc với
   `generateEvidence` ở trên (không tự bịa khoá mới, chỉ NỐI tới khách đã tồn tại). */
export function generateFires(signals: readonly Signal[], custPool: readonly Customer[]): Fire[] {
  const rng = mulberry32(SIG_SEED);
  const out: Fire[] = [];
  for (const sig of signals) out.push(...genFiresForSignal(rng, sig, custPool));
  return out;
}

const demoFires = generateFires(seed.signals, demoCust);

/* ---------- Chuỗi lịch sử chỉ số trước mốc đóng băng (module-b-issue-charter.md, section B1) ----------
   6 điểm MINH HOẠ theo tháng, sinh tất định, cho các issue ĐÃ có snapshot — snapshot là điểm neo duy
   nhất của chuỗi (validate.ts nhóm 23, luật 5: không snapshot thì không có dòng hist).
   `Snapshot.m.p` là CỬA SỔ ĐO TỰ DO, mỗi issue một kiểu (quyết định #2 của charter) — KHÔNG suy được
   lưới kỳ đều nhau từ nó, nên 6 điểm trước KHÔNG nhân cửa sổ đo ra sau; chúng là điểm minh hoạ theo
   THÁNG, đi tới gần giá trị đã đóng băng (`snap.m.v`) để chuỗi đọc được như diễn biến dẫn tới lúc
   issue được ghi nhận. Điểm đóng băng và điểm "sau" KHÔNG sinh ở đây — số THẬT (`snap.m.v`/
   `out.post.v`), domain/ (section B2) nối lại, đúng bảng ba tầng "data sinh minh hoạ, domain chỉ nối"
   ở quyết định #3. */

/* Hạt giống RIÊNG, KHÔNG dùng chung DEMO_SEED/RAW_SEED/DEMO_EV_SEED/SIG_SEED — đây là một STREAM MỚI
   HOÀN TOÀN, không rút thêm số từ bất kỳ stream đang có, nên thêm chuỗi lịch sử ở đây KHÔNG làm lệch
   một khách/bằng chứng/lần bắn nào đã sinh trước đó (demoData.cust không đổi một khách nào — xem
   demo.test.ts, chốt chặn "hist không làm lệch cust"). */
const HIST_SEED = 0x486973;

/* Nhãn 6 kỳ trước, THÁNG LÙI DẦN từ tháng của `at` (dd/MM/yyyy) — KHÔNG tính tháng của `at` (đó là
   tháng đóng băng). Ví dụ at='15/07/2026' ⇒ '01/2026'..'06/2026'. Định dạng MM/yyyy để KHÔNG lẫn với
   cửa sổ đo dạng dd/MM/yyyy – dd/MM/yyyy của snapshot (quyết định #2 — nhãn phải nói rõ nó là tháng). */
function preMonthLabels(at: string): string[] {
  const [, mmStr, yyyyStr] = at.split("/");
  let month = parseInt(mmStr!, 10);
  let year = parseInt(yyyyStr!, 10);
  const labels: string[] = [];
  for (let i = 0; i < 6; i++) {
    month -= 1;
    if (month === 0) { month = 12; year -= 1; }
    labels.unshift(`${String(month).padStart(2, "0")}/${year}`);
  }
  return labels;
}

/* 6 giá trị đi từ một điểm lệch khỏi mốc đóng băng, tiến dần về gần mốc — hình dạng "diễn biến dẫn
   tới lúc ghi nhận vấn đề" (đặc tả B1), KHÔNG phải hằng số tỷ lệ nghiệp vụ (ranh giới đó thuộc
   domain/, không đụng ở đây — data/fixtures/ được phép mã hoá mẫu tay, cùng loại quyết định với
   NAV_BANDS_TRANSFER phía trên). Chặn về [0,100] khi đơn vị là '%': spread theo % của chính giá trị
   có thể vượt biên khi mốc đóng băng gần 100 (vd CXI-017 = 94,0%), tự chặn ở đây để chuỗi vẫn đọc
   được như một chỉ số phần trăm thật, không cần domain/ xử lý việc này. */
function genPreValues(rng: () => number, frozen: number, unit: string, dir: "up" | "down"): number[] {
  const spreadPct = 0.05 + rng() * 0.1; // lệch 5%-15% so với mốc đóng băng ở điểm xa nhất
  /* CHIỀU KHÔNG ĐƯỢC RÚT NGẪU NHIÊN — phải suy từ `metricDirection`. Bản đầu tung đồng xu
     (`rng() < 0.5 ? 1 : -1`) và đo được 1/5 dòng kể NGƯỢC câu chuyện: CXI-013 (`m-ocr`, target
     `≥ 90%`, hướng LÊN) ra 63 → 71,1 tiến tới mốc đóng băng 71,0 — tức biểu đồ nói chỉ số đang TỐT
     DẦN rồi bỗng bị ghi nhận là điểm gãy, mâu thuẫn với chính lý do điểm gãy đó tồn tại. Chuỗi phải
     đi từ chỗ ĐỠ XẤU về đúng giá trị đã đóng băng: chỉ số hướng LÊN thì bắt đầu CAO hơn rồi tụt
     xuống; hướng XUỐNG (vd `m-repeat`, target `≤ 15%`) thì bắt đầu THẤP hơn rồi dâng lên.
     Vẫn RÚT rồi BỎ một số ở đây để không dịch chuỗi số phía sau: bốn dòng còn lại vốn đã đúng chiều,
     giữ nguyên vị trí trong stream thì chúng không đổi một giá trị nào và mọi số đã đối chiếu trước
     đó còn nguyên giá trị làm chứng. */
  rng();
  const sign = dir === "up" ? 1 : -1;
  const start = frozen + sign * frozen * spreadPct;
  const values: number[] = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5; // 0 ở điểm xa nhất → 1 ở điểm gần mốc đóng băng nhất
    const base = start + (frozen - start) * t;
    const noise = (rng() - 0.5) * frozen * 0.02;
    let v = Math.round((base + noise) * 10) / 10;
    if (unit === "%") v = Math.max(0, Math.min(100, v));
    values.push(v);
  }
  return values;
}

/* Khoá hạt giống theo NỘI DUNG đo (v/u/p/obs), KHÔNG theo vị trí lặp trong một stream chung — hai
   snapshot trùng nội dung đo (cùng metric, cùng mốc, cùng cửa sổ) phải ra CÙNG hình dạng chuỗi, nếu
   không sẽ "nói sai" khi hai issue cùng trưng cùng một số liệu nhưng minh hoạ hai chiều diễn biến
   ngược nhau. FNV-1a 32-bit, thuần, tất định. */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* Sinh MỖI issue CÓ snapshot đúng MỘT dòng hist — vòng lặp chạy trên `snaps` (không phải `data.iss`)
   nên issue KHÔNG có snapshot (CXI-024) tự động KHÔNG có dòng nào, đúng luật 5 mà không cần điều
   kiện lọc riêng. Mỗi snapshot dùng một mulberry32 RIÊNG khoá theo nội dung đo (xem hashStr) — không
   rút tuần tự từ một rng chung, nên thứ tự `snaps` không ảnh hưởng kết quả và hai snapshot trùng số
   liệu luôn ra cùng chuỗi. */
export function generateMetricHistory(
  snaps: readonly Snapshot[],
  issues: readonly Issue[],
  metrics: readonly Metric[],
): MetricHistory[] {
  return snaps.map((s): MetricHistory => {
    const labels = preMonthLabels(s.at);
    const key = hashStr(`${HIST_SEED}|${s.m.v}|${s.m.u}|${s.m.p}|${s.obs.entered}|${s.obs.completed}|${s.obs.failed}`);
    const rng = mulberry32(key);
    /* Chiều của chỉ số quyết định chuỗi đi lên hay xuống (xem genPreValues). Không tra ra được
       metric thì mặc định 'up' — cùng mặc định mà mock-repository.ts:464 đã dùng, để hai nơi không
       suy khác nhau về cùng một ca thiếu dữ liệu. */
    const metric = metrics.find((m) => m.id === issues.find((i) => i.id === s.iss)?.metric);
    const dir = metric ? metricDirection(metric) : "up";
    const values = genPreValues(rng, s.m.v, s.m.u, dir);
    return {
      iss: s.iss,
      u: s.m.u,
      pre: labels.map((p, i) => ({ p, v: values[i]! })),
      demo: true,
    };
  });
}

const demoHist: MetricHistory[] = generateMetricHistory(seed.snap, seed.iss, seed.metrics);

/* Chiếu lại nhãn dải qua `cfgDefault` — CÙNG phép chiếu mà MockRepository.getSnapshot() chạy với
   cfg hiện tại, nên fixture và runtime không thể lệch cách hiểu dải. Idempotent với 7 khách của
   `seed` (đã chiếu một lần rồi): nhãn luôn tính từ số thô, không đọc nhãn cũ. */
const demoProjected: CxmData = projectCustomerBands({ ...seed, cust: demoCust, ev: demoEv }, cfgDefault, dims);

/* sigCounts PHẢI cộng SAU projectCustomerBands ở trên: projectSignalCounts đọc `Customer.bands[id]`
   cho hai chiều cắt-ngưỡng (nav/age) — cộng trước khi chiếu sẽ đọc `bands` rỗng và ném lỗi khai báo
   giả (xem docblock projectSignalCounts, data/projectSignalCounts.ts). Nghiệm thu: đổi ranh giới NAV
   trong `cfgDefault` rồi gọi lại `projectCustomerBands` + `projectSignalCounts` (không sửa dòng nào
   ở đây) → `band` của chiều `nav` trong `sigCounts` chia lại theo ranh giới mới — xem
   projectSignalCounts.test.ts. */
export const demoData: CxmData = {
  ...demoProjected,
  sigCounts: projectSignalCounts(demoFires, demoProjected.cust, dims),
  hist: demoHist,
};

/** Đường tái cộng `sigCounts` cho MockRepository (data/mock-repository.ts) — đóng kín trên
    `demoFires` module-local ở trên, KHÔNG export `Fire`/`demoFires` ra ngoài file này. Owner chốt
    05/08: `demoData.sigCounts` ở trên nướng SẴN theo `cfgDefault` lúc module load, nên đổi ranh giới
    NAV trong cấu hình rồi chiếu lại `cust` không tự động re-slice bảng đó — phải có ai đó GỌI LẠI
    `projectSignalCounts` với khách vừa chiếu. Đây là hàm đó; singleton của store (store.ts) truyền
    nó vào `new MockRepository(demoData, recountDemoSignals)` để getSnapshot()/setCfg() re-aggregate
    đúng lúc chiếu lại nhãn dải, không phải sửa gì ở projectSignalCounts.ts (xem test ở đó). */
export function recountDemoSignals(cust: readonly Customer[], dims: Record<string, Dim>): SigCount[] {
  return projectSignalCounts(demoFires, cust, dims);
}
