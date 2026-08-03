import type { Action, Outcome } from "../data/schema/index.ts";

/* Vòng xử lý một action — port từ legacy/app/src/pages/CXControlTower.tsx (nextAction() +
   getPrimaryAction()), bỏ JSX, đổi tên field theo Action mới (ap/dl/iv thay
   approval/delivery/impactValidation) và tách `outcome` ra tham số riêng: Outcome giờ là bảng
   riêng (CxmData.out, khớp qua action id), không còn nhúng trong Action như PilotAction cũ.

   `loopClosed` là THAM SỐ, cố ý không suy từ `a.lc`. (Ghi chú cũ ở đây nói ActionLc chỉ có
   'blocked' nên `a.lc === 'closed'` là lỗi biên dịch — KHÔNG còn đúng từ 02/08/2026: owner đã mở
   type thành 'blocked' | 'ready' | 'closed'.) Vẫn giữ tham số, vì hàm này là hàm THUẦN suy CTA cho
   một action rời rạc và không được tự chọn giúp nơi gọi tin trục nào:
   - `Action.lc` = trạng thái khép vòng, khóa theo action id.
   - `CxmData.loop` = bằng chứng liên hệ lại khách (need/done/ch/by/sent), khóa theo ISSUE id.
   `validate.ts` canh `lc !== 'blocked' ⇒ iv === 'validated'`, nhưng KHÔNG canh
   `loop.done === loop.need`. Việc giữ hai trục khớp nhau là của TRANSITION, không của hàm suy này:
   store `advanceAction` khi đặt `lc='closed'` phải đồng thời đẩy `loop.done = loop.need` — đúng như
   prototype `advance()` làm. Nơi gọi tra trục nó tin rồi truyền kết quả vào đây. */

export type LoopStageKey = "confirm" | "approve" | "start" | "release" | "observe" | "validate" | "close" | "done";

export type PrimaryAction = {
  key: LoopStageKey;
  actor: string;
  label: string;
};

/* CTA chính + actor cho bước kế tiếp của một action. Port từ getPrimaryAction() (~dòng 225-233).
   Nhánh 'confirm' thêm 02/08/2026 (module-a-charter.md, section A3): PHẢI đứng TRƯỚC nhánh approve
   — action.cf==='pending' ⟹ action.ap==='pending' (bất biến 5, validate.ts), nên trước khi có nhánh
   này getPrimaryAction rơi thẳng vào approve và mời người dùng "Duyệt" một action còn CHƯA được xác
   nhận là điểm gãy thật. A2 phát hiện advanceAction cũng cho phép duyệt action chưa xác nhận — nhánh
   này là nửa còn lại của việc bít lỗ đó ở tầng suy CTA. */
export function getPrimaryAction(action: Action, outcome: Outcome | undefined, loopClosed = false): PrimaryAction {
  if (action.cf === "pending") return { key: "confirm", actor: "CX xác nhận điểm gãy", label: "Xác nhận điểm gãy" };
  if (action.ap === "pending") return { key: "approve", actor: "Người phụ trách quyết định", label: "Duyệt đề xuất xử lý" };
  if (action.dl === "backlog") return { key: "start", actor: "Owner cập nhật trạng thái", label: "Bắt đầu triển khai" };
  if (action.dl === "in-progress") return { key: "release", actor: "Owner cập nhật trạng thái", label: "Đánh dấu đã phát hành" };
  if (!outcome) return { key: "observe", actor: "Hệ thống mô phỏng", label: "Nhận dữ liệu đánh giá demo" };
  if (action.iv !== "validated") return { key: "validate", actor: "Người phụ trách kết luận", label: "Xác nhận kết quả đánh giá" };
  if (!loopClosed) return { key: "close", actor: "CX xác nhận trạng thái", label: "Đánh dấu đã khép vòng" };
  return { key: "done", actor: "", label: "Hoàn tất" };
}

/* Bước kế tiếp trong vòng xử lý — trả về Action MỚI, không mutate. Port từ nextAction() (~dòng
   59-90). Hai nhánh cuối của bản gốc không có gì để đổi trên Action trong schema mới nên trả
   nguyên action (không mutate):
   - "observe" (nhận outcome demo): tạo bản ghi Outcome là việc của tầng lưu trữ, không phải domain
     thuần suy trạng thái — Outcome mới có shape base/post/cohort/win/conf/verdict/by, khác hẳn
     outcome demo cũ (observedValue/target/period/sampleSize/evidenceRef) của legacy.
   - "khép vòng" cuối cùng: từ 02/08/2026 Action ĐÃ có field để đổi (`lc`), nhưng hàm này CỐ Ý không
     tự set.

   ĐÃ ĐƯỢC THAY THẾ (02/08/2026) — ĐỌC TRƯỚC KHI DÙNG: caller thật mà ghi chú cũ chờ đã xuất hiện ở
   Phase 3, và câu trả lời là `MockRepository.advanceAction(id)` (xem `data/mock-repository.ts`) mới
   là transition ĐẦY ĐỦ: nó chạy đủ 6 chặng, tạo Outcome mô phỏng, set `lc:'ready'` rồi `lc:'closed'`,
   và đồng bộ `loop.done = loop.need`. Hàm thuần dưới đây CHỈ còn phủ 5 chặng đầu và KHÔNG chạm `lc`.
   Hai hàm TRÙNG TÊN ở hai tầng khác nhau, mức hoàn chỉnh khác nhau — đừng dùng hàm này cho luồng
   #/work, hãy gọi qua store. Hiện chỉ còn test của chính nó dùng tới; đã báo owner là có thể xoá. */
export function advanceAction(action: Action, outcome: Outcome | undefined): Action {
  if (action.ap === "pending") return { ...action, ap: "approved" };
  if (action.dl === "backlog") return { ...action, dl: "in-progress" };
  if (action.dl === "in-progress") return { ...action, dl: "released", iv: "monitoring" };
  if (!outcome) return { ...action };
  if (action.iv !== "validated") return { ...action, iv: "validated" };
  return { ...action };
}

/* Lý do CHẶN bước kế tiếp — hàm THUẦN, port từ nhánh `outc(id).verdict === 'inconclusive' &&
   a.iv !== 'validated'` của advance() (prototype ~dòng 4713-4716). Bản gốc điều hướng sang
   '#/issue/:id' để người dùng đọc yếu tố nhiễu; tầng domain thuần này không điều hướng — chỉ trả
   về CÂU GIẢI THÍCH, để nơi gọi (repo.advanceAction) quyết định no-op và UI quyết định hiển thị gì.
   null = không bị chặn, được phép chạy tiếp.

   Xét lại 02/08/2026 (module-a-charter.md A3): hàm này KHÔNG cần biết về `action.cf`. Lý do — chỉ
   nhánh chặn ở đây phụ thuộc `outcome`, và `outcome` chỉ tồn tại từ `dl==='released'` trở đi. Muốn
   `dl==='released'` thì trước đó `ap` phải đã 'approved' (xem `advanceAction` trên: backlog→
   in-progress→released đều đi qua nhánh `ap==='pending'` trước tiên). Bất biến 5 của validate.ts
   (`cf==='pending' ⟹ ap==='pending'`) đảo lại cho ta `ap==='approved' ⟹ cf==='confirmed'`. Tức là
   bất kỳ action nào có `outcome` thật thì `cf` CHẮC CHẮN đã 'confirmed' — nhánh cf==='pending' không
   bao giờ gặp outcome, nên không có ca nào cần thêm điều kiện `cf` ở đây. */
export function advanceBlockedReason(action: Action, outcome: Outcome | undefined): string | null {
  if (outcome?.verdict === "inconclusive" && action.iv !== "validated") {
    return "Kết quả đánh giá còn yếu tố nhiễu (confounder) nên chưa thể kết luận là cải thiện — cần xử lý/loại trừ yếu tố nhiễu trước khi xác nhận kết quả.";
  }
  return null;
}
