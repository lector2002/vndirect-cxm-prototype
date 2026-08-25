import { create } from "zustand";

/* Store phiên chat của màn Assistant (owner duyệt 25/08) — tách khỏi store.ts cùng lý do
   timeframe.ts: đây là UI-state phiên làm việc, không phải snapshot repository, và tầng store
   KHÔNG import features/ nên session chỉ giữ THAM CHIẾU lượt hỏi (promptId hoặc text gõ tay).

   CỐ Ý KHÔNG lưu câu trả lời: câu trả lời là phép đếm trên data hiện tại, dựng lại mỗi lần render
   qua answerFor() (features/assistant/prompts.ts). Lưu text trả lời vào đây là ghim số — seed đổi
   một cái là lịch sử chat nói dối. Cùng lệnh cấm với mọi số ghim khác của repo.

   KHÔNG localStorage — F5 quay về phiên mẫu, khớp cách mọi màn khác của prototype hoạt động. */

export type AssistantTurn = {
  /** id trong PROMPTS (câu hỏi mẫu) — vắng nghĩa là câu gõ tự do, text mới là nội dung. */
  promptId?: string;
  text?: string;
};

export type AssistantSession = {
  id: string;
  /** 'dd/MM/yyyy · HH:mm' đóng băng ≤ data.asOf cho phiên mẫu; '' = phiên tạo trong buổi làm việc
      này (nhóm "Hôm nay") — không đọc đồng hồ thật để không ghim một mốc trôi. */
  at: string;
  turns: AssistantTurn[];
};

/* Phiên mẫu — chỉ promptId + mốc thời gian (≤ asOf 27/07/2026, cùng quyết định ngày tĩnh của seed
   Workboard 25/08): lịch sử không trống khi demo, và người xem thấy ngay panel trái để làm gì. */
export function seedAssistantSessions(): AssistantSession[] {
  return [
    { id: "as-seed-1", at: "27/07/2026 · 09:12", turns: [{ promptId: "p-critical" }] },
    { id: "as-seed-2", at: "25/07/2026 · 16:40", turns: [{ promptId: "p-sources" }, { promptId: "p-overdue" }] },
    { id: "as-seed-3", at: "22/07/2026 · 08:05", turns: [{ promptId: "p-agents" }] },
  ];
}

export type AssistantStore = {
  sessions: AssistantSession[];
  /** null = màn chào (landing) — chưa ở trong phiên nào. */
  activeId: string | null;
  newChat(): void;
  openSession(id: string): void;
  /** Hỏi một lượt: đang ở landing thì mở phiên mới với lượt này, đang trong phiên thì nối tiếp. */
  ask(turn: AssistantTurn): void;
};

let newId = 0;

export const useAssistantStore = create<AssistantStore>((set) => ({
  sessions: seedAssistantSessions(),
  activeId: null,
  newChat: () => set({ activeId: null }),
  openSession: (id) => set({ activeId: id }),
  ask: (turn) =>
    set((st) => {
      if (st.activeId) {
        return {
          sessions: st.sessions.map((s) => (s.id === st.activeId ? { ...s, turns: [...s.turns, turn] } : s)),
        };
      }
      newId += 1;
      const session: AssistantSession = { id: `as-new-${newId}`, at: "", turns: [turn] };
      return { sessions: [session, ...st.sessions], activeId: session.id };
    }),
}));
