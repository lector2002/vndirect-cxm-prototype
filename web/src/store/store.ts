import { create } from "zustand";
import type { Action, Cfg, CxmData, DashSet, Dim, Issue, QuantifyItem, QuantifyShow } from "../data/schema/index.ts";
import type { ConfirmFields, CreateIssueFields, CxmRepository } from "../data/repository.ts";
import { MockRepository } from "../data/mock-repository.ts";
import { demoData, recountDemoSignals } from "../data/fixtures/demo.ts";
import { EMPTY_DATA } from "../data/emptyData.ts";

/* Store — cầu nối reactive giữa CxmRepository và React. Giữ SNAPSHOT (data/cfg/dims/boards)
   ổn định-tham-chiếu giữa các lần render; chỉ đổi reference khi có mutation (refresh()).
   Action công khai = gọi repo.<mutation>(...) rồi refresh(). KHÔNG chứa UI-selection
   (route/tab/filter) — đó là state khác, tách riêng. */
export type CxmStore = {
  repo: CxmRepository;
  data: CxmData;
  cfg: Cfg;
  dims: Record<string, Dim>;
  boards: Record<string, string[][]>;
  owners: string[];
  approvers: string[];
  /** true = đang hiện dữ liệu demo (mặc định). false = "chưa kết nối DB thật" — data rỗng. */
  demoMode: boolean;
  /** Bật/tắt Demo Mode — atomic-swap data giữa snapshot demo thật và EMPTY_DATA. */
  setDemoMode(on: boolean): void;

  /** validateFixture trên state hiện tại của repo. Rỗng = hợp lệ. */
  validate(): string[];

  /** Ghi cấu hình (màn #/rules) — xem CxmRepository.setCfg cho hợp đồng merge nông + ném khi cut sai.
      Sau khi ghi, refresh() đọc lại CẢ `data`: nhãn dải của khách được chiếu theo cfg mới trong
      getSnapshot(), nên đổi cut là chart chia lại nhóm ngay. CHẶN (ném Error) khi cfg mới vỡ bất
      biến — propagate như deleteQuantify để UI hiện lý do, và state cũ giữ nguyên. */
  setCfg(patch: Partial<Cfg>): void;
  /** setId đang dùng Quantify item này — đọc, không mutate (UI cảnh báo trước khi xóa). */
  quantifyUsedBy(id: string): string[];

  /** Tạo item mới từ builder (repo cấp id) — dùng cho "Lưu thành bản mới". Trả item đã tạo. */
  createQuantify(fields: Omit<QuantifyShow, "id">): QuantifyItem;
  saveQuantify(item: QuantifyItem): void;
  duplicateQuantify(id: string): QuantifyItem;
  /** CHẶN (ném Error) nếu item đang được set nào dùng — lỗi propagate ra ngoài,
      KHÔNG bị nuốt, để UI bắt và hiển thị lý do chặn. Không mutate/refresh khi bị chặn. */
  deleteQuantify(id: string): void;

  createSet(sec: "voc" | "cxm"): DashSet;
  duplicateSet(id: string): DashSet;
  /** CHẶN nếu là set khóa (b-cxm-exec, b-voc-all) — lỗi propagate như deleteQuantify. */
  deleteSet(id: string): void;
  renameSet(id: string, name: string): void;
  setBoardBlocks(setId: string, qIndex: number, blocks: string[]): void;
  resetBoard(setId: string): void;

  /** Tạo điểm gãy (Issue) mới kèm Action xử lý — xem CxmRepository.createIssue. */
  createIssue(fields: CreateIssueFields): { issue: Issue; action: Action };
  /** Xác nhận điểm gãy — chặng Xác nhận, đóng băng Snapshot baseline. CHẶN nếu owner rỗng hoặc
      action đã cf='confirmed', propagate ra ngoài như deleteQuantify/deleteSet. */
  confirmIssue(actionId: string, fields: ConfirmFields): Action;
  /** Chạy bước kế tiếp trong vòng xử lý của action — xem CxmRepository.advanceAction. */
  advanceAction(id: string): Action;
};

function readSnapshot(repo: CxmRepository) {
  return {
    data: repo.getSnapshot(),
    cfg: repo.getCfg(),
    dims: repo.getDims(),
    boards: repo.getBoards(),
    owners: repo.getOwners(),
    approvers: repo.getApprovers(),
  };
}

/** Factory — cho phép tiêm repo khác (test cô lập, hoặc HttpRepository sau này).
    Mặc định dùng MockRepository mới. */
export function createCxmStore(repo: CxmRepository = new MockRepository()) {
  return create<CxmStore>((set, get) => {
    // Guard: khi demoMode='off', refresh() (gọi sau mọi mutation) KHÔNG được phép nạp lại data
    // thật — nếu không app sẽ "tự bật lại" demo ngay khi có mutation trong lúc đang tắt.
    const refresh = () => {
      const snap = readSnapshot(repo);
      set(get().demoMode ? snap : { ...snap, data: EMPTY_DATA });
    };

    return {
      repo,
      ...readSnapshot(repo),
      demoMode: true,
      setDemoMode: (on) => set({ demoMode: on, data: on ? repo.getSnapshot() : EMPTY_DATA }),

      validate: () => repo.validate(),
      quantifyUsedBy: (id) => repo.quantifyUsedBy(id),

      setCfg: (patch) => {
        repo.setCfg(patch);
        refresh();
      },

      createQuantify: (fields) => {
        const created = repo.createQuantify(fields);
        refresh();
        return created;
      },
      saveQuantify: (item) => {
        repo.saveQuantify(item);
        refresh();
      },
      duplicateQuantify: (id) => {
        const copy = repo.duplicateQuantify(id);
        refresh();
        return copy;
      },
      deleteQuantify: (id) => {
        repo.deleteQuantify(id);
        refresh();
      },

      createSet: (sec) => {
        const created = repo.createSet(sec);
        refresh();
        return created;
      },
      duplicateSet: (id) => {
        const copy = repo.duplicateSet(id);
        refresh();
        return copy;
      },
      deleteSet: (id) => {
        repo.deleteSet(id);
        refresh();
      },
      renameSet: (id, name) => {
        repo.renameSet(id, name);
        refresh();
      },
      setBoardBlocks: (setId, qIndex, blocks) => {
        repo.setBoardBlocks(setId, qIndex, blocks);
        refresh();
      },
      resetBoard: (setId) => {
        repo.resetBoard(setId);
        refresh();
      },

      createIssue: (fields) => {
        const created = repo.createIssue(fields);
        refresh();
        return created;
      },
      confirmIssue: (actionId, fields) => {
        const action = repo.confirmIssue(actionId, fields);
        refresh();
        return action;
      },
      advanceAction: (id) => {
        const action = repo.advanceAction(id);
        refresh();
        return action;
      },
    };
  });
}

/* Singleton dùng cho toàn app (React components gọi useCxmStore(selector)).

   Fixture của app là `demoData` (300 khách), KHÔNG phải `seed` (7 khách) — owner chốt 03/08.
   Lý do: Demo Mode BẬT nghĩa là "trình diễn ĐỦ tính năng", mà `seed` quá thưa để các dải phủ
   phân khúc có hình. `demoData` = 7 khách thật + 293 sinh tất định (mulberry32, hạt cố định),
   nên nó BAO trọn seed chứ không thay — `iss.cust` vẫn trỏ đúng 7 khoá thật.
   Trước 03/08 singleton dùng mặc định `seed`, và `demoData` là dead code không màn nào hiện.

   `createCxmStore` vẫn mặc định `new MockRepository()` (= seed) để test giữ fixture nhỏ, tất định.
   Demo Mode TẮT không đổi fixture — nó trả `EMPTY_DATA` (xem `refresh`/`setDemoMode` ở trên). */
export const useCxmStore = createCxmStore(new MockRepository(demoData, recountDemoSignals));
