import { describe, it, expect, beforeEach } from "vitest";
import { MockRepository, UNASSIGNED, deriveVerdict } from "./mock-repository.ts";
import { demoData, recountDemoSignals } from "./fixtures/demo.ts";
import { seed } from "./fixtures/seed.ts";
import { metricDirection } from "./metric-direction.ts";
import { SIG_CUST_DIMS, SIG_FIRE_DIM } from "./projectSignalCounts.ts";
import type { CreateIssueFields } from "./repository.ts";

describe("MockRepository", () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository();
  });

  it("validate() trên state gốc trả rỗng", () => {
    expect(repo.validate()).toEqual([]);
  });

  /* Seam đổi fixture (owner chốt 03/08) — trước đó constructor ghi cứng `seed`, nên `demoData`
     là dead code không màn nào hiện được. Hai điều phải giữ cùng lúc: mặc định KHÔNG đổi (hàng
     chục test dựa vào `seed` nhỏ, tất định), và fixture truyền vào phải thật sự được dùng. */
  describe("fixture tiêm được qua constructor", () => {
    it("mặc định (không tham số) vẫn là seed — 7 khách, validate() rỗng", () => {
      expect(new MockRepository().getSnapshot().cust).toHaveLength(7);
      expect(new MockRepository().validate()).toEqual([]);
    });

    it("truyền demoData → 300 khách và validate() vẫn rỗng", () => {
      const demoRepo = new MockRepository(demoData);
      expect(demoRepo.getSnapshot().cust).toHaveLength(300);
      expect(demoRepo.validate()).toEqual([]);
    });

    it("demoData BAO trọn seed — 7 khoá thật còn nguyên (iss.cust trỏ đích danh chúng)", () => {
      const keys = new Set(new MockRepository(demoData).getSnapshot().cust.map((c) => c.key));
      for (const c of seed.cust) expect(keys.has(c.key)).toBe(true);
    });

    it("clone chứ không giữ tham chiếu — mutate snapshot KHÔNG đụng vào hằng demoData", () => {
      const before = demoData.cust.length;
      const demoRepo = new MockRepository(demoData);
      demoRepo.getSnapshot().cust.pop();
      expect(demoData.cust).toHaveLength(before);
      expect(demoRepo.getSnapshot().cust).toHaveLength(before);
    });
  });

  /* Seam re-aggregate `sigCounts` (owner chốt 05/08) — trước section này, `sigCounts` được nướng
     MỘT LẦN với cfgDefault lúc module load (data/fixtures/demo.ts) rồi đi qua getSnapshot()/
     setCfg() nguyên vẹn: đổi ranh giới NAV chia lại nhãn `cust.bands.nav` như mọi chart khác, nhưng
     KHÔNG chia lại `sigCounts` — vỡ đúng tiêu chí "đổi ranh giới NAV → lát trong cột chia lại ngay,
     không sửa dòng code nào" cho riêng chart điểm đo. */
  describe("recount tiêm được qua constructor — sigCounts re-aggregate theo cfg", () => {
    it("đổi ranh giới NAV qua setCfg ⇒ nhãn dải nav trong sigCounts chia lại — '5tỷ+' biến mất, '5-8tỷ'/'8tỷ+' xuất hiện", () => {
      const demoRepo = new MockRepository(demoData, recountDemoSignals);
      const navBandsBefore = new Set(
        demoRepo.getSnapshot().sigCounts.filter((r) => r.dim === "nav").map((r) => r.band),
      );
      expect(navBandsBefore.has("5tỷ+")).toBe(true);
      expect(navBandsBefore.has("5-8tỷ")).toBe(false);
      expect(navBandsBefore.has("8tỷ+")).toBe(false);

      demoRepo.setCfg({
        segment: { ...demoRepo.getCfg().segment, band: { ...demoRepo.getCfg().segment.band, nav: { min: null, cuts: [50e6, 200e6, 1e9, 5e9, 8e9], unit: "đ" } } },
      });
      const navBandsAfter = new Set(
        demoRepo.getSnapshot().sigCounts.filter((r) => r.dim === "nav").map((r) => r.band),
      );
      // Dải "5tỷ+" cũ đã CHIA THẬT làm hai — không chỉ đổi tên (cùng oracle với projectSignalCounts.test.ts).
      expect(navBandsAfter.has("5tỷ+")).toBe(false);
      expect(navBandsAfter.has("5-8tỷ")).toBe(true);
      expect(navBandsAfter.has("8tỷ+")).toBe(true);
    });

    it("bất biến trung thực sống sót qua re-aggregate: Σ n mỗi chiều của MỖI signal vol>0 vẫn bằng đúng Signal.vol", () => {
      const demoRepo = new MockRepository(demoData, recountDemoSignals);
      demoRepo.setCfg({
        segment: { ...demoRepo.getCfg().segment, band: { ...demoRepo.getCfg().segment.band, nav: { min: null, cuts: [50e6, 200e6, 1e9, 5e9, 8e9], unit: "đ" } } },
      });
      const { sigCounts } = demoRepo.getSnapshot();
      for (const sig of seed.signals) {
        if (sig.vol === 0 || sig.values.length === 0) continue;
        for (const dim of [...SIG_CUST_DIMS, SIG_FIRE_DIM]) {
          const total = sigCounts
            .filter((r) => r.sig === sig.id && r.dim === dim)
            .reduce((a, r) => a + r.n, 0);
          expect(total).toBe(sig.vol);
        }
      }
    });

    it("KHÔNG truyền recount (mặc định seed) ⇒ sigCounts vẫn là [] — không bịa số cho fixture hợp lệ không có count", () => {
      const seedRepo = new MockRepository();
      expect(seedRepo.getSnapshot().sigCounts).toEqual([]);
      seedRepo.setCfg({
        segment: { ...seedRepo.getCfg().segment, band: { ...seedRepo.getCfg().segment.band, nav: { min: null, cuts: [50e6, 200e6, 1e9, 5e9, 8e9], unit: "đ" } } },
      });
      expect(seedRepo.getSnapshot().sigCounts).toEqual([]);
    });
  });

  describe("Quantify", () => {
    it("saveQuantify: lưu đè id cũ giữ nguyên count", () => {
      const before = repo.getSnapshot().qt.length;
      const existing = repo.getSnapshot().qt[0];
      repo.saveQuantify({ ...existing, name: "Tên mới" });
      const after = repo.getSnapshot();
      expect(after.qt.length).toBe(before);
      expect(after.qt.find((q) => q.id === existing.id)?.name).toBe("Tên mới");
      expect(repo.validate()).toEqual([]);
    });

    it("saveQuantify: thêm id mới tăng count", () => {
      const before = repo.getSnapshot().qt.length;
      repo.saveQuantify({ id: "qu-new-1", kind: "show", show: "pf", metric: "count", chart: "rank", name: "Test mới" });
      expect(repo.getSnapshot().qt.length).toBe(before + 1);
      expect(repo.validate()).toEqual([]);
    });

    it("createQuantify: cấp id 'qu' tươi, count+1, validate() rỗng", () => {
      const before = repo.getSnapshot().qt.length;
      const created = repo.createQuantify({
        kind: "show", show: "theme", metric: "count", chart: "rank", name: "Chart builder",
      });
      expect(created.id.startsWith("qu")).toBe(true);
      expect(repo.getSnapshot().qt.some((q) => q.id === created.id)).toBe(true);
      expect(repo.getSnapshot().qt.length).toBe(before + 1);
      expect(repo.validate()).toEqual([]);
    });

    it("duplicateQuantify: count+1, tên chứa '(bản sao)', id mới", () => {
      const before = repo.getSnapshot().qt.length;
      const src = repo.getSnapshot().qt[0];
      const copy = repo.duplicateQuantify(src.id);
      expect(repo.getSnapshot().qt.length).toBe(before + 1);
      expect(copy.id).not.toBe(src.id);
      expect(copy.name).toContain("(bản sao)");
      expect(repo.validate()).toEqual([]);
    });

    it("deleteQuantify: xóa được item KHÔNG dùng", () => {
      const free = repo.getSnapshot().qt.find((q) => repo.quantifyUsedBy(q.id).length === 0);
      expect(free).toBeDefined();
      const before = repo.getSnapshot().qt.length;
      repo.deleteQuantify(free!.id);
      expect(repo.getSnapshot().qt.length).toBe(before - 1);
      expect(repo.validate()).toEqual([]);
    });

    it("deleteQuantify: CHẶN item đang dùng trong set mặc định (b-voc-all)", () => {
      const voc = repo.getSnapshot().dash.find((d) => d.id === "b-voc-all")!;
      const usedId = voc.qs.flatMap((q) => q.b).find((b) => !b.startsWith("@"))!;
      expect(usedId).toBeDefined();
      expect(() => repo.deleteQuantify(usedId)).toThrow();
      expect(repo.validate()).toEqual([]);
    });

    it("quantifyUsedBy UNION (a): item chỉ trong dash[].qs[].b → phát hiện", () => {
      const voc = repo.getSnapshot().dash.find((d) => d.id === "b-voc-all")!;
      const usedId = voc.qs.flatMap((q) => q.b).find((b) => !b.startsWith("@"))!;
      expect(repo.quantifyUsedBy(usedId)).toContain("b-voc-all");
    });

    it("quantifyUsedBy UNION (b): item chỉ trong boards overlay → VẪN phát hiện (chống bug cũ)", () => {
      // Item KHÔNG được dùng ở đâu cả trước khi thêm vào overlay.
      const free = repo.getSnapshot().qt.find((q) => repo.quantifyUsedBy(q.id).length === 0)!;
      expect(free).toBeDefined();
      expect(repo.quantifyUsedBy(free.id)).toEqual([]);

      repo.setBoardBlocks("b-voc-all", 0, [free.id]);

      const usedBy = repo.quantifyUsedBy(free.id);
      expect(usedBy).toContain("b-voc-all");
      // Delete-guard phải xét cả nguồn overlay, không chỉ dash[].qs[].b gốc.
      expect(() => repo.deleteQuantify(free.id)).toThrow();
      expect(repo.validate()).toEqual([]);
    });
  });

  describe("Set / dashboard", () => {
    it("createSet: +1 dash, +CFG.sub mặc định", () => {
      const beforeDash = repo.getSnapshot().dash.length;
      const created = repo.createSet("voc");
      expect(repo.getSnapshot().dash.length).toBe(beforeDash + 1);
      expect(created.sec).toBe("voc");
      expect(created.def).toBe(false);
      expect(repo.getCfg().sub[created.id]).toEqual({ f: "off", ch: "Email" });
      expect(repo.validate()).toEqual([]);
    });

    it("duplicateSet", () => {
      const src = repo.getSnapshot().dash[0];
      const beforeDash = repo.getSnapshot().dash.length;
      const copy = repo.duplicateSet(src.id);
      expect(repo.getSnapshot().dash.length).toBe(beforeDash + 1);
      expect(copy.id).not.toBe(src.id);
      expect(copy.name).toContain("(bản sao)");
      expect(copy.def).toBe(false);
      expect(repo.getCfg().sub[copy.id]).toBeDefined();
      /* D9a: OverviewPage in "cập nhật {up}" nên bản sao KHÔNG được thừa kế `up` của bản gốc —
         set này chưa từng bị sửa vào ngày đó. */
      expect(src.up).not.toBe("hôm nay");
      expect(copy.up).toBe("hôm nay");
      /* `copy` là structuredClone TRẢ VỀ, không phải object trong this.data.dash — assert riêng nó
         thì không chứng minh state đã lưu. Neo luôn bản đã push. */
      expect(repo.getSnapshot().dash.find((d) => d.id === copy.id)?.up).toBe("hôm nay");
      expect(repo.validate()).toEqual([]);
    });

    it("renameSet", () => {
      const target = repo.getSnapshot().dash[0];
      expect(target.up).not.toBe("hôm nay"); // guard: fixture phải khác, nếu không assert dưới vô nghĩa
      repo.renameSet(target.id, "Tên mới cho set");
      const after = repo.getSnapshot().dash.find((d) => d.id === target.id);
      expect(after?.name).toBe("Tên mới cho set");
      // D9a: đổi tên LÀ sửa định nghĩa set → dòng provenance phải theo kịp, không khai ngày cũ.
      expect(after?.up).toBe("hôm nay");
      expect(repo.validate()).toEqual([]);
    });

    it("renameSet với tên rỗng: không đổi tên VÀ không bump `up`", () => {
      const target = repo.getSnapshot().dash[0];
      const before = { name: target.name, up: target.up };
      repo.renameSet(target.id, "   ");
      const after = repo.getSnapshot().dash.find((d) => d.id === target.id);
      expect(after?.name).toBe(before.name);
      expect(after?.up).toBe(before.up);
    });

    it("deleteSet: xóa + gỡ CFG.sub", () => {
      const created = repo.createSet("cxm");
      repo.deleteSet(created.id);
      expect(repo.getSnapshot().dash.find((d) => d.id === created.id)).toBeUndefined();
      expect(repo.getCfg().sub[created.id]).toBeUndefined();
      expect(repo.validate()).toEqual([]);
    });

    it("deleteSet: set khóa (b-cxm-exec, b-voc-all) → CHẶN", () => {
      expect(() => repo.deleteSet("b-cxm-exec")).toThrow();
      expect(() => repo.deleteSet("b-voc-all")).toThrow();
      expect(repo.validate()).toEqual([]);
    });
  });

  describe("Work (điểm gãy & xử lý)", () => {
    const baseFields: CreateIssueFields = {
      title: "Khách không nhận được xác nhận sau khi ký hợp đồng",
      step: "s1", metric: "m-completion", sev: "high",
      owner: "", acc: "", due: "", plain: "",
    };

    it("createIssue: cặp CXI-/CXA- cùng số, issue trỏ action và action trỏ ngược issue", () => {
      const { issue, action } = repo.createIssue(baseFields);
      const numI = issue.id.split("-")[1];
      const numA = action.id.split("-")[1];
      expect(numI).toBe(numA);
      expect(issue.act).toBe(action.id);
      expect(action.iss).toBe(issue.id);
      // Neo vào state ĐÃ LƯU, không chỉ vào object trả về (clone).
      const snap = repo.getSnapshot();
      expect(snap.iss.find((i) => i.id === issue.id)?.act).toBe(action.id);
      expect(snap.act.find((a) => a.id === action.id)?.iss).toBe(issue.id);
      expect(repo.validate()).toEqual([]);
    });

    it("createIssue: owner rỗng → owner === UNASSIGNED", () => {
      const { action } = repo.createIssue(baseFields);
      const saved = repo.getSnapshot().act.find((a) => a.id === action.id)!;
      expect(saved.owner).toBe(UNASSIGNED);
      expect(repo.validate()).toEqual([]);
    });

    it("createIssue: pri.total = tổng 6 thành phần (tính lại trong test)", () => {
      const { issue } = repo.createIssue(baseFields);
      const saved = repo.getSnapshot().iss.find((i) => i.id === issue.id)!;
      const sum = saved.pri.sev + saved.pri.aff + saved.pri.jc + saved.pri.rep + saved.pri.tr + saved.pri.reg;
      expect(saved.pri.total).toBe(sum);
      expect(repo.validate()).toEqual([]);
    });

    /* Test riêng cho phương thức gán owner cũ (đẩy issue.st 'detecting'→'investigating', owner
       rỗng→throw) đã GỠ ở đây (section A4, module-a-charter.md): phương thức đó đã xoá khỏi
       CxmRepository, và nhánh detecting→investigating cùng owner-rỗng→throw đã có bằng chứng qua
       confirmIssue trong describe "Xác nhận (confirmIssue)" bên dưới (dòng ~299) — không viết lại
       trùng lặp. */
    it("advanceAction: chạy hết chuỗi 6 bước trên action seed CXA-021 (có Loop row CXI-021 thật), assert từng chặng", () => {
      /* Dùng action SEED CXA-021 (chưa qua bước nào: ap:'pending', dl:'backlog', iv:'not-started')
         thay vì action vừa tạo qua createIssue() — vì createIssue() (khớp createIssue() prototype)
         KHÔNG tạo dòng Loop cho issue mới, nên chặng cuối "loop.done === loop.need" không có Loop
         nào để kiểm trên một issue mới tạo. CXA-021/CXI-021 có sẵn Loop row (need:63, done:0) trong
         seed nên chặng cuối kiểm được đúng ý bất biến cần kiểm. */
      const id = "CXA-021";
      expect(repo.getSnapshot().act.find((a) => a.id === id)).toMatchObject({ ap: "pending", dl: "backlog", iv: "not-started" });

      repo.advanceAction(id); // 1. pending -> approved
      expect(repo.getSnapshot().act.find((a) => a.id === id)?.ap).toBe("approved");
      expect(repo.validate()).toEqual([]);

      repo.advanceAction(id); // 2. backlog -> in-progress
      expect(repo.getSnapshot().act.find((a) => a.id === id)?.dl).toBe("in-progress");
      expect(repo.validate()).toEqual([]);

      repo.advanceAction(id); // 3. in-progress -> released, iv monitoring
      let saved = repo.getSnapshot().act.find((a) => a.id === id)!;
      expect(saved.dl).toBe("released");
      expect(saved.iv).toBe("monitoring");
      expect(repo.validate()).toEqual([]);

      repo.advanceAction(id); // 4. tạo Outcome mô phỏng
      expect(repo.getSnapshot().out.find((o) => o.act === id)).toBeDefined();
      expect(repo.validate()).toEqual([]);

      repo.advanceAction(id); // 5. iv -> validated, lc -> ready
      saved = repo.getSnapshot().act.find((a) => a.id === id)!;
      expect(saved.iv).toBe("validated");
      expect(saved.lc).toBe("ready");
      expect(repo.validate()).toEqual([]);

      repo.advanceAction(id); // 6. lc -> closed, đồng bộ loop.done = loop.need
      saved = repo.getSnapshot().act.find((a) => a.id === id)!;
      expect(saved.lc).toBe("closed");
      const loop = repo.getSnapshot().loop.find((l) => l.iss === "CXI-021")!;
      expect(loop.done).toBe(loop.need);
      expect(repo.validate()).toEqual([]);
    });

    it("advanceAction: action bị chặn (outcome verdict 'inconclusive', CXA-017 seed thật) → trả action KHÔNG đổi", () => {
      const before = repo.getSnapshot().act.find((a) => a.id === "CXA-017")!;
      const result = repo.advanceAction("CXA-017");
      expect(result).toEqual(before);
      const after = repo.getSnapshot().act.find((a) => a.id === "CXA-017")!;
      expect(after).toEqual(before);
      expect(repo.validate()).toEqual([]);
    });

    it("advanceAction: verdict SUY RA 'improved' khi post mô phỏng thấp hơn baseline đóng băng trên metric CHIỀU DOWN (CXA-028 seed thật, m-repeat)", () => {
      /* CXA-028 seed: ap:'approved', dl:'in-progress' — chỉ cần 2 lần advance để chạm nhánh !outcome.
         metric m-repeat: value:'24,0%', target:'≤ 15%' (chiều "down" — thấp hơn là TỐT hơn) → goal=15,
         post.v=round((15+1.4)*10)/10=16.4, thấp hơn hẳn base.v (24.0, đóng băng từ snap CXI-028) →
         verdict PHẢI suy ra 'improved'. Bản cũ so sánh post>base theo dấu hiệu số học thô (bỏ qua
         hướng metric) nên kết luận ngược lại là 'worse' — đây là chính lỗi mà correction A5 sửa. */
      repo.advanceAction("CXA-028"); // dl: in-progress -> released
      expect(repo.getSnapshot().act.find((a) => a.id === "CXA-028")?.dl).toBe("released");
      repo.advanceAction("CXA-028"); // !outcome -> tạo Outcome
      const outcome = repo.getSnapshot().out.find((o) => o.act === "CXA-028")!;
      expect(outcome).toBeDefined();
      expect(outcome.verdict).toBe("improved");
      /* base phải đến từ Snapshot đã đóng băng (CXI-028: n:15840, p:'28/01/2026 – 27/07/2026'), KHÔNG
         phải giá trị hardcode cũ (n:412, p:'Trước bản phát hành') mà nhánh !outcome từng gán trước
         khi sửa — hai field này là bằng chứng phân biệt rõ base có thật sự đọc từ snapshot hay không
         (base.v một mình không đủ phân biệt vì mọi snapshot seed đều đồng nhất với metric hiện tại). */
      expect(outcome.base.v).toBe(24.0);
      expect(outcome.base.n).toBe(15840);
      expect(outcome.base.p).toBe("28/01/2026 – 27/07/2026");
      expect(outcome.post.v).toBe(16.4);
      // Ghim verdict quan sát được vào ĐÚNG hàm thuần mà advanceAction gọi (không phải một bản
      // sao song song) — chứng minh unit test của deriveVerdict bên dưới test cùng code với pipeline.
      const metric = repo.getSnapshot().metrics.find((m) => m.id === "m-repeat")!;
      expect(outcome.verdict).toBe(
        deriveVerdict(metricDirection(metric), outcome.base.v, outcome.post.v, outcome.conf.length > 0),
      );
      expect(repo.validate()).toEqual([]);
    });

    describe("deriveVerdict (hàm thuần) — ca không tự nhiên dựng được qua pipeline công khai", () => {
      /* Mọi metric trong seed đều ở phía "chưa đạt mục tiêu" nên post mô phỏng (goal + 1.4) luôn rơi
         về phía TỐT hơn base, bất kể hướng metric — chạy đủ createIssue→confirmIssue→advanceAction×3
         cho cả 6 metric trong seed đều cho verdict 'improved' (xác nhận thủ công khi viết section
         A5). Không có API công khai để mutate giá trị metric, và action.sm PHẢI khớp issue.metric
         (bất biến mới ở validate.ts) nên không thể "lệch metric" để lách ra ca 'worse'/biên bằng
         nhau trên chiều up qua pipeline thật. Hai test dưới đây kiểm trực tiếp hàm thuần đã được
         pipeline gọi (xem assertion ghim ở test CXA-028 trên) thay cho một ca tích hợp không dựng
         được. */
      it("dir='up', post < base, không confounder → 'worse'", () => {
        expect(deriveVerdict("up", 50, 40, false)).toBe("worse");
      });

      it("post === base (mọi hướng) → 'inconclusive' (Verdict không có giá trị 'không đổi')", () => {
        expect(deriveVerdict("up", 50, 50, false)).toBe("inconclusive");
        expect(deriveVerdict("down", 50, 50, false)).toBe("inconclusive");
      });

      it("có confounder → luôn 'inconclusive' bất kể base/post", () => {
        expect(deriveVerdict("up", 40, 50, true)).toBe("inconclusive");
      });
    });

    it("advanceAction: action CHƯA xác nhận (cf='pending') → ném lỗi ngay bước duyệt, validate() vẫn RỖNG, action KHÔNG đổi", () => {
      /* Correction sau khi A2 báo cáo lỗ hổng: nhánh ap==='pending'->'approved' giờ GATE theo cf,
         đóng đúng lỗ hổng đã phát hiện (advanceAction từng có thể duyệt một action chưa xác nhận,
         phá vỡ bất biến 5 cf==='pending' ⟹ ap==='pending'). Test này thay thế test cũ (đã ghim lại
         validate() không rỗng — không còn hợp lệ vì trạng thái đó không còn dựng được qua API công
         khai nữa) bằng bằng chứng: chưa xác nhận thì không duyệt được, và validate() vẫn rỗng ngay
         cả sau nỗ lực duyệt bị chặn. */
      const { action } = repo.createIssue({
        title: "Case kiểm gate: chưa xác nhận thì không duyệt được",
        step: "s1", metric: "m-completion", sev: "medium", owner: "", acc: "", due: "", plain: "",
      });
      expect(repo.getSnapshot().act.find((a) => a.id === action.id)?.cf).toBe("pending");
      const before = repo.getSnapshot();

      expect(() => repo.advanceAction(action.id)).toThrow(/xác nhận/i);

      const after = repo.getSnapshot();
      expect(after.act.find((a) => a.id === action.id)?.ap).toBe("pending"); // KHÔNG đổi
      expect(after.act).toEqual(before.act);
      expect(repo.validate()).toEqual([]);
    });
  });

  describe("Xác nhận (confirmIssue) — chặng Xác nhận + đóng băng baseline", () => {
    it("CXA-024 (action cf='pending' duy nhất trong seed): cf->confirmed, snapshot mới cho CXI-024, issue.st->investigating, validate() rỗng", () => {
      const before = repo.getSnapshot();
      expect(before.act.find((a) => a.id === "CXA-024")?.cf).toBe("pending");
      expect(before.snap.find((s) => s.iss === "CXI-024")).toBeUndefined();
      expect(before.iss.find((i) => i.id === "CXI-024")?.st).toBe("detecting");

      const result = repo.confirmIssue("CXA-024", { owner: "Minh Quân" });
      expect(result.cf).toBe("confirmed");

      const after = repo.getSnapshot();
      expect(after.act.find((a) => a.id === "CXA-024")?.cf).toBe("confirmed");
      const snapRows = after.snap.filter((s) => s.iss === "CXI-024");
      expect(snapRows.length).toBe(1);
      expect(snapRows[0].m).toEqual({ v: 64.3, u: "%", p: "28/01/2026 – 27/07/2026", n: 18420 });
      expect(snapRows[0].by).toBe("Head of Growth"); // acc không đổi (fields.acc không truyền)
      expect(snapRows[0].at).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(after.iss.find((i) => i.id === "CXI-024")?.st).toBe("investigating");
      expect(repo.validate()).toEqual([]);
    });

    it("confirmIssue lần hai trên cùng action → ném lỗi, dữ liệu KHÔNG đổi", () => {
      repo.confirmIssue("CXA-024", { owner: "Minh Quân" });
      const before = repo.getSnapshot();
      expect(() => repo.confirmIssue("CXA-024", { owner: "Ai đó khác" })).toThrow();
      const after = repo.getSnapshot();
      expect(after.act).toEqual(before.act);
      expect(after.snap).toEqual(before.snap);
      expect(repo.validate()).toEqual([]);
    });

    it("confirmIssue với owner rỗng → ném lỗi, dữ liệu KHÔNG đổi", () => {
      const before = repo.getSnapshot();
      expect(() => repo.confirmIssue("CXA-024", { owner: "" })).toThrow();
      const after = repo.getSnapshot();
      expect(after.act).toEqual(before.act);
      expect(after.snap).toEqual(before.snap);
      expect(repo.validate()).toEqual([]);
    });

    it("Snapshot.obs KHÔNG share reference với data.obs — đổi data.obs sau khi chụp không kéo theo snap.obs", () => {
      repo.confirmIssue("CXA-024", { owner: "Minh Quân" });
      const snapshotState = repo.getSnapshot();
      const snapObs = snapshotState.snap.find((s) => s.iss === "CXI-024")!.obs;
      const dataObs = snapshotState.obs.find((o) => o.stepId === "s1")!;
      expect(snapObs).not.toBe(dataObs);
      expect(snapObs).toEqual({ stepId: "s1", entered: 18420, completed: 17690, failed: 730, effort: 1.1, cov: 96 });

      // Đổi bản data.obs vừa đọc — vì getSnapshot() trả clone, sửa nó không lan ngược vào repo, nhưng
      // đủ để chứng minh snapObs không phải cùng object: nếu confirmIssue từng lưu thẳng tham chiếu
      // obsRow, snapObs và dataObs sẽ là CÙNG MỘT object (không `.not.toBe`) ngay cả sau clone.
      dataObs.entered = 999999;
      expect(snapObs.entered).toBe(18420);
    });
  });

  describe("Board overlay", () => {
    it("setBoardBlocks rồi resetBoard: overlay xuất hiện/biến mất, validate() luôn rỗng", () => {
      const setId = "b-voc-all";
      const originalBlocks = repo.getSnapshot().dash.find((d) => d.id === setId)!.qs[0].b;

      repo.setBoardBlocks(setId, 0, [...originalBlocks, "q13"]);
      expect(repo.getBoards()[setId]?.[0]).toContain("q13");
      expect(repo.validate()).toEqual([]);

      repo.resetBoard(setId);
      expect(repo.getBoards()[setId]).toBeUndefined();
      expect(repo.validate()).toEqual([]);
    });
  });
});
