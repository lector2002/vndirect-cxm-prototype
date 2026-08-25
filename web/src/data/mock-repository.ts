import type { Action, Cfg, CxmData, Customer, DashSet, Dim, Issue, NavItem, Outcome, OutcomeMeasure, QuantifyItem, QuantifyShow, SigCount, Snapshot, TourStop, Verdict } from "./schema/index.ts";
import { cfgDefault, dims, seed, seedApprovers, seedNav, seedOwners, seedTour } from "./fixtures/seed.ts";
import { validateFixture } from "./validate.ts";
import { projectCustomerBands } from "./projectBands.ts";
import { metricDirection } from "./metric-direction.ts";
import { advanceBlockedReason } from "../domain/loop.ts";
import type { CreateIssueFields, ConfirmFields, CxmRepository } from "./repository.ts";

/** Suy verdict THUẦN từ hướng metric + base/post đã đo — tách khỏi advanceAction để test trực
    tiếp được cả nhánh 'worse' và nhánh biên (base === post), hai ca mà dữ liệu seed hiện có
    không tự nhiên đi qua được (mọi metric trong seed đều ở phía "chưa đạt", nên post mô phỏng
    luôn rơi về phía tốt hơn base — xem báo cáo A5). Confounder luôn thắng → inconclusive; sau đó
    so base/post THEO HƯỚNG metric (không phải theo dấu hiệu số học thô); bằng nhau cũng map về
    inconclusive vì Verdict không có giá trị "không đổi". */
export function deriveVerdict(
  dir: "up" | "down",
  base: number,
  post: number,
  hasConfounder: boolean,
): Verdict {
  if (hasConfounder) return "inconclusive";
  if (post === base) return "inconclusive";
  const improved = dir === "down" ? post < base : post > base;
  return improved ? "improved" : "worse";
}

/** Chuỗi kỳ cửa sổ quan sát cố định 6 tháng dùng cho snapshot baseline — cùng period "d30" của
    seed (label "6 tháng gần nhất"), tránh bịa khoảng ngày mới cho mỗi lần xác nhận. */
const SNAPSHOT_PERIOD_ID = "d30";

const LOCKED_SET_IDS = new Set(["b-cxm-exec", "b-voc-all"]);

/** Owner rỗng của action — port hằng UNASSIGNED của prototype (~dòng 2877: `'Chưa gán'`).
    Export để nơi gọi (UI/test) so sánh trực tiếp, không gõ lại chuỗi. */
export const UNASSIGNED = "Chưa gán";

/** Số kế tiếp cho cặp id CXI-<n>/CXA-<n> — port nextNum() (prototype ~dòng 4630-4634): số lớn
    nhất hiện có trong CẢ hai mảng issue/action, +1, đệm 3 chữ số. Khác cơ chế newId() (timestamp)
    dùng cho Quantify/Set vì phải giữ đúng định dạng CXI-NNN/CXA-NNN đã có sẵn trong seed. */
function nextIssueActionNum(iss: readonly Issue[], act: readonly Action[]): string {
  let n = 0;
  for (const x of [...iss, ...act]) {
    const v = parseInt(x.id.split("-")[1] ?? "", 10);
    if (!Number.isNaN(v) && v > n) n = v;
  }
  return String(n + 1).padStart(3, "0");
}

/** hôm nay + n ngày, format dd/MM/yyyy đệm 0 — khớp mọi `due` có sẵn trong seed (vd '29/07/2026').
    LỆCH prototype: plusDays() gốc dùng `new Date().toLocaleDateString('vi-VN')` KHÔNG đệm 0
    (vd '2/8/2026' cho ngày 02/08) — không khớp định dạng seed. Đệm số ở đây để giữ ĐÚNG MỘT
    định dạng ngày trong toàn bộ fixture, tránh hai kiểu due lẫn lộn. */
function plusDaysVi(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Sinh id mới không trùng, cùng dạng prefix + timestamp base36 + hậu tố ngẫu nhiên
    như prototype (newSetId / id trong qSave-qDuplicate). */
function newId(prefix: string, exists: (id: string) => boolean): string {
  let id: string;
  do {
    id = prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  } while (exists(id));
  return id;
}

/* MockRepository — implementation in-memory của CxmRepository dùng khi chưa có API
   thật. Giữ bản sao (structuredClone) riêng của seed/cfgDefault/dims/seedNav/seedTour
   ngay từ constructor — KHÔNG bao giờ mutate module fixtures gốc. Non-persist: state
   chỉ sống trong instance, mất khi instance bị hủy (không dùng localStorage). */
export class MockRepository implements CxmRepository {
  private data: CxmData;
  private cfg: Cfg;
  /** Cfg MẶC ĐỊNH của repo này = đúng cfgFixture đã tiêm (25/08) — "mặc định" nghĩa là "trạng thái
      lúc dựng repo", không phải hằng module: demoCfg điền sẵn Per-step levels KHÔNG được đọc thành
      "đã sửa trong phiên" ở màn Rules, và nút Reset phải trả về đúng nó. */
  private cfgFixture: Cfg;
  private dims: Record<string, Dim>;
  private nav: NavItem[];
  private tour: TourStop[];
  /** Overlay set dashboard đã tùy chỉnh — setId -> mảng-theo-câu-hỏi các block.
      Port từ ST.boards (lazy: chỉ có mặt khi set đó đã bị sửa). */
  private boards: Record<string, string[][]>;

  /** Hàm cộng lại năm bảng đếm signal từ khách ĐÃ CHIẾU nhãn dải — tiêm được, giống lý do tiêm
      `fixture` (đọc docblock constructor). Khi absent, `sigCounts` đi qua projectBands nguyên vẹn,
      không tính toán gì thêm (khớp seed, nơi sigCounts luôn rỗng). */
  private recount?: (cust: readonly Customer[], dims: Record<string, Dim>) => SigCount[];

  /* Fixture tiêm được (owner chốt 03/08). Mặc định `seed` để mọi `new MockRepository()` sẵn có —
     hàng chục test — giữ nguyên hành vi; app thật truyền `demoData` ở singleton trong store.ts.
     `cfg`/`dims`/`nav`/`tour` KHÔNG đi theo fixture: chúng là cấu hình chứ không phải dữ liệu, và
     `demoData` chỉ khác `seed` ở mảng `cust`.

     `recount` (owner chốt 05/08): mảng `sigCounts` của fixture bị nướng SẴN theo cfg mặc định lúc
     module load (data/fixtures/demo.ts) — đổi ranh giới NAV trong cfg tự nó không re-slice bảng đã
     nướng. Tham số này là đường TÁI CỘNG lại từ khách vừa chiếu nhãn dải mới, chạy ở đúng hai chỗ
     phép chiếu xảy ra bên dưới (getSnapshot/projectedValidationSnapshot). Optional + mặc định
     undefined giữ nguyên hành vi của hàng chục test dùng `seed` (sigCounts luôn `[]`, xem seed.ts). */
  /* `cfgFixture` (25/08, owner quét AI-slop): cfg cũng tiêm được như fixture — Demo Mode cần bảng
     "Per-step levels" ĐIỀN SẴN (demoCfg, data/fixtures/demo.ts) để các trục xếp hạng jc/reg có số
     mà trình diễn; seed/test giữ nguyên cfgDefault (jc/reg rỗng — "bỏ trống là mặc định", ADR-002). */
  constructor(
    fixture: CxmData = seed,
    recount?: (cust: readonly Customer[], dims: Record<string, Dim>) => SigCount[],
    cfgFixture: Cfg = cfgDefault,
  ) {
    this.data = structuredClone(fixture);
    this.cfg = structuredClone(cfgFixture);
    this.cfgFixture = structuredClone(cfgFixture);
    this.dims = structuredClone(dims);
    this.nav = structuredClone(seedNav);
    this.tour = structuredClone(seedTour);
    this.boards = {};
    this.recount = recount;
  }

  /** Chiếu nhãn dải theo cfg HIỆN TẠI trước khi trả ra — đây là chỗ `cfg.segment.cuts` thật sự điều
      khiển con số hiện trên chart (data/projectBands.ts). Trước section này `cuts` không có consumer
      nào trong production nên sửa ngưỡng ở setting không đổi được gì.
      Sau khi chiếu nhãn, nếu có `recount` thì cộng lại `sigCounts` từ ĐÚNG tập khách vừa chiếu —
      nếu không, chart điểm đo vẫn đọc bảng nướng theo cfg mặc định dù mọi chart khác đã chia lại. */
  getSnapshot(): CxmData {
    const projected = projectCustomerBands(structuredClone(this.data), this.cfg, this.dims);
    if (!this.recount) return projected;
    return { ...projected, sigCounts: this.recount(projected.cust, this.dims) };
  }

  getCfg(): Cfg {
    return structuredClone(this.cfg);
  }

  getCfgDefault(): Cfg {
    return structuredClone(this.cfgFixture);
  }

  getDims(): Record<string, Dim> {
    return structuredClone(this.dims);
  }

  getOwners(): string[] {
    return seedOwners.slice();
  }

  getApprovers(): string[] {
    return seedApprovers.slice();
  }

  getBoards(): Record<string, string[][]> {
    return structuredClone(this.boards);
  }

  /** Chặng của bản giới thiệu có dẫn. Cùng lối `getDims()`/`getCfg()`: là cấu hình chứ không phải
      dữ liệu, và trả bản sao để không ai sửa được bảng gốc từ bên ngoài. */
  getTour(): TourStop[] {
    return structuredClone(this.tour);
  }

  validate(): string[] {
    return validateFixture(this.projectedValidationSnapshot(this.cfg), this.dims, this.nav, this.tour, this.cfg);
  }

  /** Ghi cfg — xem hợp đồng ở CxmRepository.setCfg. Kiểm bằng cách chạy CHÍNH validateFixture với cfg
      ứng viên rồi so danh sách lỗi trước/sau: chỉ lỗi MỚI PHÁT SINH mới chặn. So kiểu này thay vì
      match chuỗi thông báo của nhóm 20, vì (a) không phụ thuộc câu chữ của một nhóm kiểm cụ thể —
      thêm bất biến mới ở validate là tự động được canh ở đây, (b) không chặn oan khi state đang có
      lỗi sẵn từ trước không liên quan đến cut. */
  setCfg(patch: Partial<Cfg>): void {
    const next: Cfg = { ...this.cfg, ...structuredClone(patch) };
    const before = this.validate();
    const after = validateFixture(this.projectedValidationSnapshot(next), this.dims, this.nav, this.tour, next);
    const introduced = after.filter((m) => !before.includes(m));
    if (introduced.length > 0) {
      throw new Error(`setCfg: cấu hình mới làm vỡ bất biến — ${introduced.join(" · ")}`);
    }
    this.cfg = next;
  }

  /** Snapshot để kiểm, đã chiếu nhãn dải theo `cfg` ĐANG ĐƯỢC KIỂM (không phải luôn `this.cfg`) —
      setCfg cần kiểm với cfg ứng viên trước khi nhận. Không chiếu thì nhóm 19 báo lệch nhãn/số thô
      cho MỌI khách ngay khi cut đổi, vì `this.data` giữ nhãn nướng theo cut cũ.
      Cùng lý do cộng lại `sigCounts` như getSnapshot() ở trên: cfg ứng viên có thể đổi ranh giới NAV,
      validateFixture phải soi đúng bảng đếm SẼ có sau khi nhận cfg đó, không phải bảng nướng cũ. */
  private projectedValidationSnapshot(cfg: Cfg): CxmData {
    const projected = projectCustomerBands(this.buildValidationSnapshot(), cfg, this.dims);
    if (!this.recount) return projected;
    return { ...projected, sigCounts: this.recount(projected.cust, this.dims) };
  }

  /** Hợp nhất overlay boards vào dash (mỗi câu hỏi đã sửa -> block overlay thay cho
      qs[].b gốc) trước khi đưa vào validateFixture — mirror đúng curB() của prototype,
      để validate() phát hiện cả liên kết đứt trong set đã tùy chỉnh, không chỉ set gốc. */
  private buildValidationSnapshot(): CxmData {
    const dash = this.data.dash.map((d) => {
      const board = this.boards[d.id];
      if (!board) return d;
      return { ...d, qs: d.qs.map((q, i) => ({ ...q, b: board[i] ?? q.b })) };
    });
    return { ...this.data, dash };
  }

  // ----- Quantify (thư viện chart) -----
  createQuantify(fields: Omit<QuantifyShow, "id">): QuantifyItem {
    const id = newId("qu", (x) => this.data.qt.some((q) => q.id === x));
    const item: QuantifyShow = structuredClone({ ...fields, id });
    this.data.qt.push(item);
    return structuredClone(item);
  }

  saveQuantify(item: QuantifyItem): void {
    const clone = structuredClone(item);
    const idx = this.data.qt.findIndex((q) => q.id === clone.id);
    if (idx > -1) this.data.qt[idx] = clone;
    else this.data.qt.push(clone);
  }

  duplicateQuantify(id: string): QuantifyItem {
    const src = this.data.qt.find((q) => q.id === id);
    if (!src) throw new Error(`Quantify "${id}" không tồn tại`);
    const clone = structuredClone(src);
    clone.id = newId("qu", (x) => this.data.qt.some((q) => q.id === x));
    clone.name = `${src.name} (bản sao)`;
    this.data.qt.push(clone);
    return structuredClone(clone);
  }

  deleteQuantify(id: string): void {
    const usedBy = this.quantifyUsedBy(id);
    if (usedBy.length > 0) {
      throw new Error(`Không thể xóa Quantify "${id}": đang được dùng bởi set ${usedBy.join(", ")}`);
    }
    const idx = this.data.qt.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error(`Quantify "${id}" không tồn tại`);
    this.data.qt.splice(idx, 1);
  }

  quantifyUsedBy(id: string): string[] {
    const result: string[] = [];
    for (const d of this.data.dash) {
      const board = this.boards[d.id];
      const inDash = d.qs.some((q) => q.b.includes(id));
      const inBoard = board ? board.some((bs) => bs.includes(id)) : false;
      if (inDash || inBoard) result.push(d.id);
    }
    return result;
  }

  // ----- Set / dashboard -----
  createSet(sec: "voc" | "cxm"): DashSet {
    const id = newId("set", (x) => this.data.dash.some((d) => d.id === x));
    const set: DashSet = {
      id, sec, def: false, name: "Set mới", owner: "Bạn", up: "hôm nay", shared: false,
      role: "tùy chỉnh", desc: "Set tự tạo — ghép chart từ Quantify.",
      qs: [{ q: "Các chart đã chọn", b: [] }],
    };
    this.data.dash.push(set);
    this.cfg.sub[id] = { f: "off", ch: "Email" };
    return structuredClone(set);
  }

  duplicateSet(id: string): DashSet {
    const src = this.data.dash.find((d) => d.id === id);
    if (!src) throw new Error(`Set "${id}" không tồn tại`);
    const copy = structuredClone(src);
    copy.id = newId("set", (x) => this.data.dash.some((d) => d.id === x));
    copy.def = false;
    copy.name = `${src.name} (bản sao)`;
    copy.owner = "Bạn";
    copy.shared = false;
    // D9a: bản sao là set MỚI tạo hôm nay — thừa kế `up` của bản gốc sẽ khai một ngày sửa chưa từng
    // xảy ra với set này. Khớp đúng createSet.
    copy.up = "hôm nay";
    this.data.dash.push(copy);
    this.cfg.sub[copy.id] = { f: "off", ch: "Email" };
    return structuredClone(copy);
  }

  deleteSet(id: string): void {
    if (LOCKED_SET_IDS.has(id)) throw new Error(`Không thể xóa set khóa "${id}"`);
    const idx = this.data.dash.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Set "${id}" không tồn tại`);
    this.data.dash.splice(idx, 1);
    delete this.boards[id];
    delete this.cfg.sub[id];
  }

  renameSet(id: string, name: string): void {
    const set = this.data.dash.find((d) => d.id === id);
    if (!set) throw new Error(`Set "${id}" không tồn tại`);
    const trimmed = name.trim();
    if (!trimmed) return;
    set.name = trimmed;
    /* D9a: OverviewPage hiện "cập nhật {up}" nên `up` PHẢI theo kịp mọi thay đổi định nghĩa set —
       không bump ở đây thì đổi tên xong dòng provenance vẫn khai ngày fixture cũ, tức nói dối đúng
       chỗ nó được thêm vào để tạo tin cậy. Dùng lại đúng chuỗi "hôm nay" của createSet, không đẻ
       thêm format ngày thứ ba. Cố ý KHÔNG bump ở setBoardBlocks: đó là tùy chỉnh board cục bộ của
       người xem, không phải sửa định nghĩa set, và CustomBanner đã báo riêng. */
    set.up = "hôm nay";
  }

  setBoardBlocks(setId: string, qIndex: number, blocks: string[]): void {
    const set = this.data.dash.find((d) => d.id === setId);
    if (!set) throw new Error(`Set "${setId}" không tồn tại`);
    if (qIndex < 0 || qIndex >= set.qs.length) {
      throw new Error(`Set "${setId}": câu hỏi index ${qIndex} không hợp lệ`);
    }
    const board = this.boards[setId] ?? set.qs.map((q) => q.b.slice());
    board[qIndex] = blocks.slice();
    this.boards[setId] = board;
  }

  resetBoard(setId: string): void {
    delete this.boards[setId];
  }

  // ----- Work (điểm gãy & xử lý) -----
  createIssue(fields: CreateIssueFields): { issue: Issue; action: Action } {
    const title = fields.title.trim();
    if (!title) {
      // Form đã chặn trước ở UI (createForm() prototype) — đây là chốt phòng thủ tầng data.
      throw new Error("Cần tiêu đề — một câu nói rõ khách đang gặp gì.");
    }
    const num = nextIssueActionNum(this.data.iss, this.data.act);
    const iid = `CXI-${num}`;
    const aid = `CXA-${num}`;

    /* KHÔNG còn chấm điểm ở đây (ADR-002 §1, §9). Bản cũ đặt `sev` theo bảng tra, `aff` bằng
       `min(24, round(obs.failed/100))` và `jc = 14` cứng, rồi để `rep`/`tr`/`reg` = 0 kèm ghi chú
       "thà để 0 còn hơn đoán". Ba lỗi trong bốn dòng đó:
         - `aff` lấy theo BƯỚC nên ba điểm gãy trên `s3` nhận cùng một con số (kịch trần 24);
         - `jc = 14` cho MỌI bước, tức khoá này chưa phân biệt được bước nào với bước nào;
         - số 0 cho khoá chưa đo được là *chưa-biết viết thành thiếu* — điểm gãy mới xếp thấp hơn
           thực chất và không màn nào nói vì sao.
       Điểm nay do `data/priority.ts` tính lúc đọc; điểm gãy mới sinh ra với `sigMap: null` nên
       `aff` là *chưa tính được*, và nó hiện ở khối "chưa đủ dữ liệu để xếp" của `#/work` cho tới
       khi owner map điểm đo — đúng chỗ để nhìn thấy việc còn phải làm. */
    const owner = fields.owner || UNASSIGNED;
    const acc = fields.acc || seedApprovers[0];
    const due = fields.due || plusDaysVi(14);
    const plain = fields.plain.trim() ||
      "Điểm gãy vừa được tạo trong phiên và chưa gán bằng chứng nào từ khách hàng, nên độ tin cậy còn thấp. Cần bổ sung verbatim hoặc khảo sát tại bước này trước khi duyệt thay đổi.";

    const issue: Issue = {
      id: iid, title, step: fields.step, metric: fields.metric, ins: null, act: aid,
      sev: fields.sev, st: "detecting", conf: 50, ev: [], cust: [],
      plain,
      hyp: "Chưa có giả thuyết — điểm gãy mới tạo, chưa nối được bằng chứng.",
      dec: "Chưa đủ căn cứ để duyệt thay đổi. Bổ sung bằng chứng tại bước này trước.",
      sigMap: null,
      imp: { rep: 0, churn: 0 },
    };
    const action: Action = {
      id: aid, iss: iid, title: `Xử lý: ${title}`, owner, acc, due,
      ap: "pending", cf: "pending", dl: "backlog", iv: "not-started", lc: "blocked", sm: fields.metric,
    };

    this.data.iss.push(issue);
    this.data.act.push(action);
    return { issue: structuredClone(issue), action: structuredClone(action) };
  }

  /** Xác nhận điểm gãy — chặng Xác nhận (thay chặng Gán). Atomic: mọi kiểm tra chạy TRƯỚC khi
      mutate bất cứ gì, nên khi bị chặn (throw) state không đổi. Ngoài gán owner/acc/due như chặng
      Gán cũ, còn đóng băng baseline: tạo đúng 1 dòng Snapshot cho issue của action — mốc so sánh
      mà advanceAction sẽ đọc lại thay vì đọc metric hiện tại (xem "vì sao có module này"). */
  confirmIssue(actionId: string, fields: ConfirmFields): Action {
    const action = this.data.act.find((a) => a.id === actionId);
    if (!action) throw new Error(`Action "${actionId}" không tồn tại`);
    if (!fields.owner) {
      // Cùng câu lỗi với chặng Gán cũ: form đã chặn trước, đây là chốt phòng thủ tầng data.
      throw new Error("Chọn một người xử lý. Đây là chỗ duy nhất biến điểm gãy thành việc của ai đó.");
    }
    if (action.cf === "confirmed") {
      // Mốc so sánh mà đổi được thì không còn là mốc — issue đã xác nhận thì không xác nhận lại.
      throw new Error(`Action "${actionId}" đã được xác nhận trước đó — không thể xác nhận lại (baseline đã đóng băng).`);
    }

    const issue = this.data.iss.find((i) => i.id === action.iss);
    if (!issue) throw new Error(`Action "${actionId}": issue ${action.iss} không tồn tại`);

    action.owner = fields.owner;
    if (fields.acc) action.acc = fields.acc;
    if (fields.due) action.due = fields.due;
    action.cf = "confirmed";
    if (issue.st === "detecting") issue.st = "investigating";

    // Luật seed baseline (charter): issue chưa có Outcome tại lúc xác nhận → lấy nguyên số hiện tại
    // của metric + obs của bước, delta = 0 tại mốc này (sự thật: chưa sửa gì thì chưa đổi gì).
    const metric = this.data.metrics.find((m) => m.id === issue.metric);
    const v = metric ? (parseFloat(metric.value.replace(",", ".")) || 0) : 0;
    const u = metric ? metric.unit : "";
    const obsRow = this.data.obs.find((o) => o.stepId === issue.step);
    const n = obsRow ? obsRow.entered : 0;
    const period = this.data.periods.find((p) => p.id === SNAPSHOT_PERIOD_ID)?.range ?? "";

    const snapshot: Snapshot = {
      iss: action.iss,
      at: plusDaysVi(0),
      by: action.acc,
      m: { v, u, p: period, n },
      // Bản sao — KHÔNG share reference với data.obs, nếu không snapshot sẽ trôi theo dữ liệu hiện tại.
      obs: obsRow
        ? structuredClone(obsRow)
        : { stepId: issue.step, entered: 0, completed: 0, failed: 0, effort: 0, cov: 0 },
    };
    this.data.snap.push(snapshot);

    return structuredClone(action);
  }

  advanceAction(id: string): Action {
    const action = this.data.act.find((a) => a.id === id);
    if (!action) throw new Error(`Action "${id}" không tồn tại`);
    const outcome = this.data.out.find((o) => o.act === id);

    /* Gate tương đương vị trí `else if (outc(id).verdict === 'inconclusive' && a.iv !== 'validated')`
       trong chuỗi if/else-if của advance() prototype: điều kiện chỉ có thể đúng khi outcome đã tồn
       tại, mà theo bất biến validate.ts:112 outcome chỉ tồn tại khi dl==='released' (tức các nhánh
       1-3 bên dưới đã qua) — nên kiểm ở đầu hàm tương đương kiểm đúng vị trí, không tắt nhầm các
       bước approve/start/release. No-op AN TOÀN thay vì điều hướng '#/issue/:id' của bản gốc. */
    if (advanceBlockedReason(action, outcome)) {
      return structuredClone(action);
    }

    if (action.ap === "pending") {
      /* Gate BẮT BUỘC: chưa xác nhận (cf='pending') thì không được duyệt. Thiếu gate này để lộ một
         lỗ hổng thật trên luồng công khai — advanceAction có thể đẩy ap 'pending'->'approved' mà
         không cần confirmIssue trước, phá vỡ bất biến 5 (cf==='pending' ⟹ ap==='pending', xem
         validate.ts) ngay ở bước đầu tiên. Ném TRƯỚC khi mutate — action giữ nguyên khi bị chặn. */
      if (action.cf === "pending") {
        throw new Error(
          `Action "${action.id}": phải xác nhận điểm gãy (confirmIssue) trước khi duyệt (ap: 'pending' -> 'approved').`,
        );
      }
      action.ap = "approved";
    } else if (action.dl === "backlog") {
      action.dl = "in-progress";
    } else if (action.dl === "in-progress") {
      action.dl = "released";
      action.rel = `Bản demo · ${new Date().toLocaleDateString("vi-VN")}`;
      action.iv = "monitoring";
    } else if (!outcome) {
      /* Bước "nhận dữ liệu đánh giá" — port advance() prototype ~dòng 4703-4712, SỬA LỖI PHƯƠNG
         PHÁP (lý do tồn tại của Module A): base KHÔNG còn đọc metric.value hiện tại (đó là giá trị
         ĐỌC SAU khi bản sửa đã release — nhánh này chỉ chạy khi dl==='released'), mà đọc từ
         Snapshot đã đóng băng lúc XÁC NHẬN. Theo bất biến 4 (validate.ts), cf==='confirmed' ⟺ có
         snapshot cho issue, và dl==='released' ⟹ ap==='approved' ⟹ cf==='confirmed' (ActionCf chỉ
         có 2 giá trị) — nên thiếu snapshot ở đây nghĩa là dữ liệu đã hỏng, không phải trường hợp
         hợp lệ để lặng lẽ quay về hành vi cũ. */
      const snap = this.data.snap.find((s) => s.iss === action.iss);
      if (!snap) {
        throw new Error(
          `Action "${action.id}": dl='released' (⟹ cf phải 'confirmed') nhưng thiếu snapshot cho issue ${action.iss} — bất biến "cf ⟺ snapshot" (validate.ts) đã vỡ.`,
        );
      }
      const base: OutcomeMeasure = structuredClone(snap.m);
      const metric = this.data.metrics.find((m) => m.id === action.sm);
      const goal = metric
        ? (parseFloat(metric.target.replace(/[^0-9,.]/g, "").replace(",", ".")) || base.v + 6)
        : base.v + 6;
      // "post" vẫn là mô phỏng như hiện tại — dữ liệu "sau" thật sự chưa tồn tại trong prototype này.
      const post: OutcomeMeasure = { v: Math.round((goal + 1.4) * 10) / 10, u: base.u, p: "24 giờ sau bản phát hành (mô phỏng)", n: 240 };
      const conf: string[] = [];
      // verdict SUY RA theo HƯỚNG metric (up/down), không theo dấu hiệu số học thô — xem
      // deriveVerdict ở đầu file: post thấp hơn base là CẢI THIỆN với metric "down" (vd m-repeat).
      const dir = metric ? metricDirection(metric) : "up";
      const verdict: Verdict = deriveVerdict(dir, base.v, post.v, conf.length > 0);
      const newOutcome: Outcome = {
        act: action.id,
        base,
        post,
        cohort: "Cohort demo trong phiên",
        win: "24 giờ · dữ liệu mô phỏng",
        conf,
        verdict,
        by: null,
      };
      this.data.out.push(newOutcome);
      action.iv = "monitoring";
    } else if (action.iv !== "validated") {
      action.iv = "validated";
      action.lc = "ready";
    } else if (action.lc !== "closed") {
      action.lc = "closed";
      // Đồng bộ Loop (khóa theo ISSUE id, không phải action id) — port `const l = loop(a.iss)`.
      const loop = this.data.loop.find((l) => l.iss === action.iss);
      if (loop) {
        loop.done = loop.need;
        loop.by = loop.by || "Thu Hà · Head of CX";
      }
    }
    return structuredClone(action);
  }
}
