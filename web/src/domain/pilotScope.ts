import type { Flow, Group, Phase } from "../data/schema/index.ts";

/* PHẠM VI PILOT ĐANG TRÌNH BÀY — phase nào được mở, phase nào khoá mờ, và khoá thì nói lý do gì.

   KHÁC `scope.ts` cùng thư mục: file đó trả lời "cái gì được tính là một tín hiệu khách hàng"
   (mẫu số VoC). File này trả lời "phần nào của bản đồ đang trong lượt trình bày". Hai câu hỏi
   khác nhau, đừng gộp.

   Owner chốt 05/08: chỉ "Mở tài khoản" và "Dòng tiền". Đây là một QUYẾT ĐỊNH phạm vi, KHÔNG suy
   được từ dữ liệu — "04 Giao dịch" cũng đã có 1 flow được đo (1/16) mà owner vẫn để ngoài lượt này.
   Nên ghim tường minh, không đoán bằng cờ `observed`: đoán thì Giao dịch sẽ tự mở khoá trở lại và
   không ai biết vì sao. Ghim theo `code` của phase (chuỗi "02"/"03" hiện ngay trên rail, ổn định
   hơn id fixture).

   NẰM Ở `domain/` chứ không nằm trong một màn (06/08): phạm vi pilot là luật của SẢN PHẨM, không
   phải của bản đồ hành trình. Từ lúc màn "VoC theo hành trình" cũng có rail phase, để mỗi màn giữ
   một bản sao là mở đường cho chuyện màn này khoá còn màn kia mở — hai câu trả lời khác nhau cho
   cùng một câu hỏi, đúng thứ cả stream đang chữa. Owner đổi phạm vi thì sửa ĐÚNG một chỗ này. */
export const PILOT_PHASE_CODES = new Set(["02", "03"]);

/** Phase này có nằm trong phạm vi pilot đang trình bày không. */
export function isPilotPhase(phase: Phase): boolean {
  return PILOT_PHASE_CODES.has(phase.code);
}

/** Phase mà một flow thuộc về, tra qua group — flow không có `phaseId` trực tiếp (journey.ts:26-36),
    phải đi qua Group (journey.ts:19-24). Trả "" khi group không tồn tại (dữ liệu vỡ bất biến). */
export function phaseIdOfFlow(flow: Flow, groups: readonly Group[]): string {
  return groups.find((g) => g.id === flow.groupId)?.phaseId ?? "";
}

/* Lý do một phase bị KHOÁ — MỘT chuỗi duy nhất dùng cho CẢ tooltip lẫn dòng chữ in ra khi bấm. Cùng
   luật với SplitToggle (design-system/SplitToggle.tsx:19-21): chỗ hiển thị không được viết lại lý do
   bằng câu chữ của mình, nếu không hai chỗ trôi khỏi nhau và người đọc gặp hai câu trả lời.

   Câu chữ nói ĐÚNG tình trạng đo của từng phase, không nói bừa "chưa đo gì": phase khoá có hai kiểu
   rất khác nhau — chưa có flow nào được đo (01/05/06) và đã đo một phần nhưng để ngoài lượt này (04). */
export function phaseLockReason(
  phaseName: string,
  flowCount: number,
  observedCount: number,
): string {
  const measured =
    observedCount === 0
      ? `chưa flow nào trong ${flowCount} flow có dữ liệu quan sát`
      : `mới ${observedCount} trên ${flowCount} flow có dữ liệu quan sát`;
  return `${phaseName} tạm khoá vì chưa nằm trong phạm vi pilot đang trình bày (${measured}).`;
}

/** Lý do khoá của một phase, đếm sẵn từ danh sách flow — `null` nghĩa là phase đang MỞ.
    Gói cả ba việc (có khoá không / đếm flow / soạn câu) vào một chỗ để màn gọi không phải tự đếm —
    tự đếm là chỗ hai màn dễ ra hai con số khác nhau nhất. */
export function lockReasonForPhase(
  phase: Phase,
  flows: readonly Flow[],
  groups: readonly Group[],
): string | null {
  if (isPilotPhase(phase)) return null;
  const inPhase = flows.filter((f) => phaseIdOfFlow(f, groups) === phase.id);
  return phaseLockReason(phase.name, inPhase.length, inPhase.filter((f) => f.observed).length);
}
