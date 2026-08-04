import type { CxmData, Customer, AgeBand, NavBand, TenureBand, AcqChannel, Evidence, EvidenceKind, TaxNode } from "../schema/index.ts";
import { seed } from "./seed.ts";
import { UNKNOWN_YET, MISSING } from "../segment.ts";
import { ANON_CK } from "../validate.ts";

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
  } else if (nav === "1-5tỷ" || nav === ">5tỷ") {
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
   seed chỉ có 20 evidence rải cho 14 theme (`data.tax` với lv:'theme') — chia theo bất kỳ chiều
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
   'android'/'ios'/'web' — xem seed.ts, khối `ev`), không bịa tên nền tảng mới. */
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

const EV_STEPS: ReadonlyArray<readonly [string, number]> = [
  ["s1", 0.1], ["s2", 0.2], ["s3", 0.25], ["s4", 0.15], ["s5", 0.2], ["s6", 0.1],
];

/* Tỷ lệ ẨN DANH: 8% — đủ nhỏ để không chiếm mất khối lượng "đối chiếu được" (mục đích chính của
   F2), nhưng đủ để đoạn "Ẩn danh" của chart có gì để vẽ ở MỌI theme (40 × 8% = 3.2 kỳ vọng/theme,
   không phải 0). Không có nguồn đo thật cho tỷ lệ này (đây LÀ số demo, không phải phép đo) — chọn
   dựa trên tỷ lệ Ẩn danh quan sát được trong seed (2/20 = 10%, xem seed.ts EV-103/EV-304), lấy
   tròn xuống 8% để phần lớn evidence vẫn đối chiếu được khách thật. */
const ANON_RATE = 0.08;

function genEvidenceForTheme(
  rng: () => number,
  theme: TaxNode,
  startIdx: number,
  custKeys: readonly string[],
): Evidence[] {
  const [l1, l2] = THEME_TAX[theme.id];
  /* theme.cat luôn có giá trị cho lv:'theme' — validateFixture nhóm 8 đã bắt buộc điều này trên
     seed (seed qua được nhóm 8 ⇒ mọi theme trong THEME_TAX đều có cat hợp lệ). */
  const cat = theme.cat as string;
  const senBase = cat === "complaint" ? -0.6 : cat === "help" ? -0.2 : cat === "improvement" ? -0.1 : 0.7;

  const count = evCountForTheme(theme);
  const out: Evidence[] = [];
  for (let i = 0; i < count; i++) {
    const pf = pickWeighted(rng, EV_PF);
    const src = pickWeighted(rng, EV_SOURCES);
    const step = pickWeighted(rng, EV_STEPS);
    const ck = rng() < ANON_RATE ? ANON_CK : custKeys[Math.floor(rng() * custKeys.length)];
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

/* generateEvidence — sinh bằng chứng demo TẤT ĐỊNH cho mọi theme, `custKeys` là khoá của TẬP
   KHÁCH ĐÃ SINH XONG (seed.cust + generateCustomers) để `ck` luôn trỏ vào một khách CÓ THẬT
   trong đúng bộ dữ liệu sẽ dùng nó — không tự bịa khoá mới như generateCustomers làm với
   genUniqueKey (đó là khoá KHÁCH, đây là khoá NỐI tới khách đã tồn tại). */
export function generateEvidence(themes: readonly TaxNode[], custKeys: readonly string[]): Evidence[] {
  const rng = mulberry32(DEMO_EV_SEED);
  const out: Evidence[] = [];
  let idx = 0;
  for (const theme of themes) {
    out.push(...genEvidenceForTheme(rng, theme, idx, custKeys));
    idx += evCountForTheme(theme);
  }
  return out;
}

/* Ghép 7 khách THẬT của seed (giữ nguyên, không sửa) với 293 khách SINH — tổng vẫn đúng 300.
   KHÔNG thay hẳn bằng generateCustomers(300): nếu bỏ 7 khách thật, mọi `issue.cust` trong seed
   trỏ tới 7 khoá đó (vd CXI-021 → KH•••7A2…) sẽ thành tham chiếu ma, và validateFixture nhóm 3
   ("khách X không có trong fixture") sẽ đỏ ngay — vi phạm đúng tiêu chí quan trọng nhất của
   section này. Đây là chỗ công thức minh hoạ trong đặc tả (`cust: generateCustomers(300)`) va
   với ràng buộc thật của validateFixture; ghép thay vì thay thế là cách giữ cả hai vế: tổng
   300 khách VÀ validateFixture rỗng. */
const demoCust: Customer[] = [...seed.cust, ...generateCustomers(293)];

/* Bằng chứng demo cộng thêm vào 20 bằng chứng thật của seed (giữ nguyên, không sửa) — theo đúng
   tập khách `demoCust` ở trên để `ck` luôn tra ra được (trừ sentinel Ẩn danh). */
const demoEv: Evidence[] = [
  ...seed.ev,
  ...generateEvidence(
    seed.tax.filter((t): t is TaxNode => t.lv === "theme"),
    demoCust.map((c) => c.key),
  ),
];

export const demoData: CxmData = { ...seed, cust: demoCust, ev: demoEv };
