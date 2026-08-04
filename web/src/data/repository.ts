import type { Action, Cfg, CxmData, DashSet, Dim, Issue, IssueSev, QuantifyItem, QuantifyShow } from "./schema/index.ts";

/* Field builder gửi lên khi tạo điểm gãy mới — port createForm()/createIssue() (prototype
   ~dòng 3015 / 4641). Chuỗi rỗng ("") là quy ước "để mặc định" cho owner/acc/due/plain — khớp
   $v(...) trả '' khi input trống trong prototype. */
export type CreateIssueFields = {
  title: string;
  step: string;
  metric: string;
  sev: IssueSev;
  owner: string;
  acc: string;
  due: string;
  plain: string;
};

/** Field xác nhận điểm gãy — chặng Xác nhận (thay chặng Gán, owner chốt 02/08/2026). Port
    assignForm()/saveAssign() (prototype ~dòng 3049/4676): owner bắt buộc, acc/due optional — chỉ
    ghi đè khi có giá trị (khớp `if (acc) a.acc = acc` của prototype). Riêng với bản gốc, confirmIssue
    còn đóng băng Snapshot baseline — một hành vi mà bước Gán cũ không có (xem module-a-charter.md). */
export type ConfirmFields = { owner: string; acc?: string; due?: string };

/* CxmRepository — seam data-access giữa domain/UI và nguồn dữ liệu. Phase 1: đọc
   toàn bộ state + mutation Quantify (thư viện chart) và set dashboard. Đổi sang
   API thật sau này = thay 1 implementation (vd. HttpRepository), UI/domain không đổi. */
export interface CxmRepository {
  /** Bản data hiện tại (đọc để render). */
  getSnapshot(): CxmData;
  getCfg(): Cfg;
  getDims(): Record<string, Dim>;
  /** Danh sách người xử lý có thể gán cho action — port OWNERS của prototype (~dòng 2878). */
  getOwners(): string[];
  /** Danh sách người có thẩm quyền duyệt — port APPROVERS của prototype (~dòng 2879). */
  getApprovers(): string[];
  /** Overlay tùy chỉnh set dashboard: setId -> mảng-theo-câu-hỏi các block.
      Chỉ có mặt cho set đã bị sửa (lazy) — set chưa sửa dùng thẳng qs[].b gốc. */
  getBoards(): Record<string, string[][]>;
  /** validateFixture trên state hiện tại, đã hợp nhất overlay boards vào dash để
      kiểm cả set đã tùy chỉnh (không chỉ set mặc định). Rỗng = hợp lệ. */
  validate(): string[];

  // ----- Cấu hình (màn #/rules — "Chỉ số & ngưỡng") -----
  /** Ghi cấu hình. Đây là ĐƯỜNG GHI DUY NHẤT của `Cfg`: trước section này repo chỉ có reader nên
      không màn customize nào ghi được gì.

      Merge NÔNG một tầng: `setCfg({ segment })` thay TOÀN BỘ `segment`, nên nơi gọi phải truyền đủ
      cả 4 trục (đọc `getCfg()`, sửa trục cần sửa, gửi lại). Cố ý không merge sâu — merge sâu trên
      `cuts: number[]` không có nghĩa rõ ràng (gộp hai mảng cut? lấy mảng nào?), và một API "ghi
      một phần mảng" là chỗ để lệch cut âm thầm.

      NÉM Error nếu cfg mới không hợp lệ (cuts rỗng / không tăng dần / min chồng cut đầu / hai dải
      cùng ra một nhãn) — cùng khuôn `deleteQuantify` đã ném khi bị set dùng: chặn ở seam ghi, không
      để state hỏng rồi mới báo ở tầng validate. Cut sai làm `bandOf` xếp khách sai LẶNG LẼ.

      Lưu ý cho nơi gọi: `getSnapshot()` chiếu nhãn dải theo cfg HIỆN TẠI, nên ghi cfg xong phải đọc
      lại snapshot (store gọi `refresh()`) — không thì chart vẫn hiện nhãn theo cut cũ. */
  setCfg(patch: Partial<Cfg>): void;

  // ----- Quantify (thư viện chart) -----
  /** Tạo item MỚI từ builder: repo cấp id tươi (prefix "qu"), trả item đã tạo (kèm id).
      Nhận `Omit<QuantifyShow, "id">` — builder CHỈ dựng item `show`, không dựng series
      (chuỗi thời gian là curated). Dùng cho "Lưu thành bản mới"; "Lưu đè" đi qua saveQuantify. */
  createQuantify(fields: Omit<QuantifyShow, "id">): QuantifyItem;
  /** Upsert theo id: id đã tồn tại thì lưu đè toàn bộ item, id mới thì thêm mới. */
  saveQuantify(item: QuantifyItem): void;
  /** Nhân bản: id mới, tên = tên gốc + " (bản sao)". */
  duplicateQuantify(id: string): QuantifyItem;
  /** Xóa — CHẶN (ném Error) nếu đang được set nào dùng (xem quantifyUsedBy). */
  deleteQuantify(id: string): void;
  /** setId đang dùng item này — UNION cả dash[].qs[].b lẫn overlay boards (2 nguồn). */
  quantifyUsedBy(id: string): string[];

  // ----- Set / dashboard -----
  createSet(sec: "voc" | "cxm"): DashSet;
  duplicateSet(id: string): DashSet;
  /** Xóa — CHẶN nếu là set khóa (b-cxm-exec, b-voc-all); xóa kèm CFG.sub. */
  deleteSet(id: string): void;
  renameSet(id: string, name: string): void;
  /** Ghi đè overlay block của một câu hỏi trong set (lazy-copy từ qs[].b nếu chưa có overlay). */
  setBoardBlocks(setId: string, qIndex: number, blocks: string[]): void;
  /** Xóa overlay của set — về lại mặc định (qs[].b gốc). */
  resetBoard(setId: string): void;

  // ----- Work (điểm gãy & xử lý) — #/work -----
  /** Tạo điểm gãy (Issue) mới kèm Action xử lý đi cùng — port createIssue() (prototype ~dòng 4641).
      Sinh cặp id CXI-<n>/CXA-<n> CÙNG một n, liên kết 2 chiều issue.act/action.iss. */
  createIssue(fields: CreateIssueFields): { issue: Issue; action: Action };
  /** Xác nhận điểm gãy — chặng Xác nhận (thay chặng Gán). owner rỗng hoặc action đã cf='confirmed'
      bị CHẶN (ném Error), atomic (không đổi gì khi bị chặn). Ngoài việc gán owner/acc/due như chặng
      Gán cũ, còn ĐÓNG BĂNG baseline: tạo đúng 1 dòng Snapshot cho issue của action, theo luật seed
      trong charter Module A (issue chưa có Outcome → số hiện tại của metric + obs). */
  confirmIssue(actionId: string, fields: ConfirmFields): Action;
  /** Chạy bước kế tiếp trong vòng xử lý governed action — port advance() (prototype ~dòng 4690),
      gồm cả bước tạo Outcome mô phỏng khi phát hành và đồng bộ Loop khi khép vòng. No-op AN TOÀN
      (không mutate) khi advanceBlockedReason() báo còn yếu tố nhiễu chưa kết luận được. */
  advanceAction(id: string): Action;
}
