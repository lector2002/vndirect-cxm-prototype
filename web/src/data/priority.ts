import type { Cfg, CxmData, Customer, Dim, Issue, PriKey, StepLevel } from "./schema/index.ts";
import { bandLabels } from "./bands.ts";
import { buildCustDimGetter } from "./projectSignalCounts.ts";

/* ĐIỂM ƯU TIÊN ĐIỂM GÃY — hàm tính, không phải field dữ liệu (ADR-002, web/docs/adr-002-*.md).

   Trước 14/08 điểm nằm sẵn trong fixture (`iss[].pri = { sev:30, aff:22, …, total:94 }`) và
   `validate` chỉ canh "tổng bằng tổng thành phần" — tức canh phép cộng của một dãy số gõ tay.
   Hai lệch đo được ngay trong sáu điểm gãy seed: `CXI-024` (`high`) mang 20 còn bảng tra của chính
   code là 22, `CXI-026` (`medium`) mang 12 còn bảng tra là 14.

   Ba chỗ, tách bạch (§2):
     SỐ ĐO   `x[k]`     ← dữ liệu / cfg khai báo. Đo được hay không là chuyện của dữ liệu.
     CHIẾU   `norm[k]`  ← CỐ ĐỊNH TRONG FILE NÀY, 0..1. Hình dạng phép chiếu là quyết định thiết kế.
     TRỌNG SỐ `w[k]`    ← `cfg.pri.w`, owner sửa trên #/rules nhóm 6, cộng lại 100.

   LUẬT QUAN TRỌNG NHẤT (§9): khoá CHƯA TÍNH ĐƯỢC không vào tổng và KHÔNG thành 0. `null` ở đây là
   "chưa đo được", không phải "đo được và bằng không" — trộn hai nghĩa là biến một điểm gãy chưa map
   thành một điểm gãy nhẹ, rồi nó tụt xuống đáy `#/work` và không ai thấy. Mọi consumer vì vậy đọc
   `computed`/`missing` chứ không đọc mỗi `total`.

   Ràng buộc tầng: phép cộng ở `data/`, không ở `domain/` — cùng chỗ với `projectBands` và
   `projectSignalCounts`, cùng lý do (`docs/DB-FIRST-HANDOFF.md`, bất biến #1). */

export const PRI_KEYS: readonly PriKey[] = ["sev", "aff", "jc", "rep", "tr", "reg", "hv"] as const;

/** Nhãn tiếng Việt của bảy khoá — MỘT nguồn cho mọi màn (`#/work`, nhóm 6, `@toppri`). Ba màn tự
    gõ nhãn là ba màn gọi cùng một khoá bằng ba cái tên khác nhau. */
export const PRI_LABEL: Record<PriKey, string> = {
  sev: "Mức nghiêm trọng",
  aff: "Số khách bị ảnh hưởng",
  jc: "Mức quan trọng của bước",
  rep: "Liên hệ lặp lại",
  tr: "Xu hướng",
  reg: "Rủi ro pháp lý / tuân thủ",
  hv: "Khách giá trị cao",
};

/* Bảng tra `sev` — GIỮ ĐÚNG TỈ LỆ 30/22/14 đang chạy, không phát minh tỉ lệ mới (§3). Nhãn vẫn do
   người chấm (§4): `metricState()` KHÔNG thay được nó, vì `CXI-021` (critical) và `CXI-026`
   (medium) cùng trỏ `m-liveness` nên suy từ trạng thái chỉ số sẽ cho hai điểm gãy này cùng một kết
   quả — xoá mất đúng cái phân biệt mà khoá này tồn tại để giữ. */
const SEV_NORM: Record<Issue["sev"], number> = { critical: 1, high: 0.7, medium: 0.45 };

/** Bậc của `jc` và `reg`. Ba mức đều cách nhau đều — không có dữ liệu nào nói khoảng cách
    thấp→vừa khác vừa→cao, nên đặt lệch là bịa một phán đoán không ai chốt. */
const LEVEL_NORM: Record<StepLevel, number> = { low: 1 / 3, mid: 2 / 3, high: 1 };

export type IssueScore = {
  /** Số đo thô của từng khoá. `null` = CHƯA TÍNH ĐƯỢC (§9), khác hẳn 0. */
  x: Record<PriKey, number | null>;
  /** Số đo đã chiếu về 0..1 (`tr` về -1..1). `null` ở đâu thì `x` cũng `null` ở đó. */
  norm: Record<PriKey, number | null>;
  /** Σ w·norm của RIÊNG các khoá tính được, làm tròn về số nguyên. Không quy đổi lên thang 100 theo
      phần trọng số đã dùng: quy đổi sẽ cho một điểm gãy đo được 2/7 khoá đứng ngang một điểm gãy đo
      đủ — đúng cái "thấp giả" ngược lại, cũng là một lời khẳng định sai. Điểm thiếu khoá THẤP hơn
      là đúng; thứ chặn nó bị đọc nhầm là `missing`, không phải một phép chuẩn hoá. */
  total: number;
  computed: PriKey[];
  missing: PriKey[];
};

/** Đủ khoá để xếp hạng chưa. `#/work` chia hai khối theo đúng vị từ này (§19). */
export function isRankable(s: IssueScore): boolean {
  return s.missing.length === 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/* ---- SỐ ĐO: bảy hàm đo, mỗi hàm trả `null` khi chưa đo được ---------------------------------- */

/** `aff` — số KHÁCH ĐỘC LẬP gặp điểm gãy này (§16), KHÔNG phải `obs.failed` của cả bước.
    Công thức cũ (`min(24, round(obs.failed/100))`) cho `CXI-021`/`CXI-026`/`CXI-028` cùng nhận 24
    vì cả ba nằm trên `s3` — ba điểm gãy khác hẳn nhau nhận cùng một điểm.

    Hôm nay LUÔN trả `null`, và đó là kết quả đúng chứ không phải hàm chưa viết xong:
    - chưa map (`sigMap === null`) ⇒ chưa tính được;
    - có map rồi thì vẫn cần SỐ KHÁCH ĐỘC LẬP theo giá trị, mà `sigCounts` đang có đếm LƯỢT BẮN
      (`SigCount.n`). Một khách trượt liveness ba lần góp 3 vào `n`; nhiều giá trị thì `aff` là HỢP
      của các tập khách chứ không phải tổng `n`. Cộng `n` lại là đếm trùng ngay ở khoá nặng nhất.
    Bảng cần xin: `web/docs/ideal-data-model.md` mục A. Khi nó về, chỗ sửa là ĐÚNG hàm này. */
function measureAff(_issue: Issue): number | null {
  return null;
}

/** Thứ dựng MỘT LẦN cho cả lô, không dựng lại theo từng điểm gãy: bảng tra khách theo khoá, phép
    đọc nhóm của một khách, và câu trả lời "khai báo `cfg.hv` có còn khớp bộ nhãn hiện tại không".
    Bản đầu đặt cả ba bên trong `measureHv` — mỗi điểm gãy dựng lại một `Map` của TOÀN BỘ khách và
    sinh lại bộ nhãn dải; với `demoData` (hàng nghìn khách) nhân sáu điểm gãy nhân mỗi lần render
    của `#/work` + `@toppri`, nó đủ chậm để làm treo cả bộ test tour. Đo được, không phải đề phòng. */
type HvCtx = {
  byKey: Map<string, Customer>;
  groupOf: (c: Customer) => string;
  /** `false` ⇒ `hv` là *chưa tính được* cho MỌI điểm gãy: chưa khai giá trị nào, hoặc khai báo đã
      lệch khỏi bộ nhãn hiện tại. */
  usable: boolean;
  wanted: Set<string>;
};

function buildHvCtx(data: CxmData, cfg: Cfg, dims: Record<string, Dim>): HvCtx {
  const byKey = new Map(data.cust.map((c) => [c.key, c] as const));
  const groupOf = buildCustDimGetter(dims, cfg.hv.dim);
  const wanted = new Set(cfg.hv.values);

  /* KHAI BÁO LỆCH ⇒ CHƯA TÍNH ĐƯỢC, không đếm một phần. Nhãn dải sinh từ `cfg.segment.band[dim]
     .cuts`, nên owner thêm một ranh giới NAV là nhãn cũ chết theo ("5tỷ+" tách thành "5-8tỷ" +
     "8tỷ+"). Vẫn đếm với phần nhãn còn khớp thì `hv` tụt xuống một con số THẤP GIẢ mà không màn nào
     nói vì sao — đúng lỗi §9 sinh ra để chặn. `validate` cố ý KHÔNG bắt chỗ này thành lỗi bất biến:
     làm vậy sẽ khoá luôn việc sửa ranh giới dải (xem nhóm 25, data/validate.ts).

     Bộ nhãn đối chiếu là bộ KHAI BÁO (sinh từ cuts), KHÔNG phải bộ quan sát được trong `data.cust`:
     một dải cao mà hôm nay chưa khách nào rơi vào vẫn là dải hợp lệ, và câu trả lời đúng lúc đó là
     0 khách giá trị cao. */
  const dim = dims[cfg.hv.dim];
  let usable = cfg.hv.values.length > 0;
  if (usable && dim?.cut?.kind === "band") {
    const declared = new Set(bandLabels(cfg.segment.band[cfg.hv.dim]));
    usable = cfg.hv.values.every((v) => declared.has(v));
  }

  return { byKey, groupOf, usable, wanted };
}

/** `hv` — số khách GIÁ TRỊ CAO trong danh sách khách của điểm gãy (§10, §11).
    Đây cũng là chỗ đóng lỗ `validate` không kiểm chéo được: `CXI-021` từng khai `imp.hv = 9` trong
    khi `cust[]` chỉ có 4 khách. Đếm từ `cust[]` thì con số không thể vượt số khách nữa. */
function measureHv(issue: Issue, hv: HvCtx): number | null {
  if (!hv.usable) return null;
  if (issue.cust.length === 0) return null; // chưa gắn được khách nào ≠ không khách nào giá trị cao
  let n = 0;
  for (const key of issue.cust) {
    const c = hv.byKey.get(key);
    if (!c) continue; // khoá khách không khớp ai — lỗi dữ liệu, `validate` nói; ở đây không đoán
    if (hv.wanted.has(hv.groupOf(c))) n += 1;
  }
  return n;
}

/** `rep` — TREO (§7). Chặn bởi một câu cho bên hệ thống case: case có gắn được với BƯỚC hành trình
    hoặc với lý do thất bại cụ thể không. Lối tắt `m-repeat` toàn cục đã bị bác: đó là tỉ lệ repeat
    của TOÀN BỘ khách, không phải của nhóm gặp điểm gãy này (cùng lỗi hình dạng với §4, §16). */
function measureRep(): number | null {
  return null;
}

/** `tr` — TREO tới khi có `obsTrend` (§8, `ideal-data-model.md` mục B). `Obs` hôm nay là MỘT ảnh
    chụp, không có trục thời gian, nên không có hai kỳ nào để so. Khi bảng về: thay đổi tương đối
    giữa kỳ đầu ĐO ĐƯỢC và kỳ ĐỦ gần nhất — kỳ cuối luôn chưa đủ, tính cả nó thì mọi điểm gãy đọc
    thành "đang đỡ dần". */
function measureTr(): number | null {
  return null;
}

/* ---- CHIẾU + CỘNG --------------------------------------------------------------------------- */

export function issueScore(
  issue: Issue,
  data: CxmData,
  cfg: Cfg,
  dims: Record<string, Dim>,
): IssueScore {
  return scoreOne(issue, cfg, buildHvCtx(data, cfg, dims));
}

function scoreOne(issue: Issue, cfg: Cfg, hvCtx: HvCtx): IssueScore {
  const levelOf = (m: Record<string, StepLevel>): number | null => {
    const lv = m[issue.step];
    return lv === undefined ? null : LEVEL_NORM[lv];
  };

  const aff = measureAff(issue);
  const hv = measureHv(issue, hvCtx);
  const rep = measureRep();
  const tr = measureTr();

  const x: Record<PriKey, number | null> = {
    sev: SEV_NORM[issue.sev],
    aff,
    jc: levelOf(cfg.step.jc),
    rep,
    tr,
    reg: levelOf(cfg.step.reg),
    hv,
  };

  const norm: Record<PriKey, number | null> = {
    // `sev`/`jc`/`reg` đã là bậc 0..1 ngay ở khâu đo — bảng tra CHÍNH LÀ phép chiếu, không có số
    // thô nào khác phía sau để chiếu lần nữa.
    sev: x.sev,
    jc: x.jc,
    reg: x.reg,
    aff: aff === null ? null : clamp(aff / cfg.pri.anchor.aff, 0, 1),
    hv: hv === null ? null : clamp(hv / cfg.pri.anchor.hv, 0, 1),
    rep: rep === null ? null : clamp(rep / cfg.data.repeatWarn, 0, 1),
    // `tr` âm được (đang đỡ) nên chiếu về [-1, 1], không kẹp sàn ở 0: một điểm gãy đang đỡ dần phải
    // kéo điểm XUỐNG, đó là toàn bộ ý nghĩa của khoá này.
    tr: tr === null ? null : clamp(tr / cfg.pri.anchor.tr, -1, 1),
  };

  const computed: PriKey[] = [];
  const missing: PriKey[] = [];
  let total = 0;
  for (const k of PRI_KEYS) {
    const nv = norm[k];
    if (nv === null) {
      missing.push(k);
      continue;
    }
    computed.push(k);
    total += cfg.pri.w[k] * nv;
  }

  return { x, norm, total: Math.round(total), computed, missing };
}

/** Chấm điểm cả danh sách một lần — ĐƯỜNG MẶC ĐỊNH cho mọi màn. Gọi `issueScore` trong comparator
    sẽ dựng lại `HvCtx` (một `Map` của toàn bộ khách) O(n log n) lần cho cùng một lô. */
export function scoreIssues(
  data: CxmData,
  cfg: Cfg,
  dims: Record<string, Dim>,
): Map<string, IssueScore> {
  const hvCtx = buildHvCtx(data, cfg, dims);
  return new Map(data.iss.map((i) => [i.id, scoreOne(i, cfg, hvCtx)] as const));
}
