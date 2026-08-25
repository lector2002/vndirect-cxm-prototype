import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isoFromVn } from "../../data/projectSigTrend.ts";
import { btnPrimary, btnSecondary } from "../../design-system/index.ts";
import { PageTitle } from "../../nav.tsx";
import { useAssistantStore, type AssistantTurn } from "../../store/assistant.ts";
import { useCxmStore } from "../../store/store.ts";
import { answerFor, promptLabel, PROMPTS, type AssistantAnswer } from "./prompts.ts";

/* Màn Assistant gộp (owner duyệt 25/08, layout tham chiếu Enterpret Wisdom; sửa đợt 2 cùng ngày:
   owner chê bản đầu "trống trơn chỉ có nút và chỗ đánh chữ" — chia lại thành KHUNG rõ):
   - Hai khung viền nổi trên nền: khung Lịch sử (trái) và khung Hội thoại (phải) cao hết màn.
   - Khung hội thoại 3 tầng: header nền xám nói rõ trợ lý đếm thật từ dữ liệu nào; vùng cuộn ở
     giữa (landing hoặc hội thoại); Ô NHẬP GHIM ĐÁY khung + disclaimer — không trôi theo nội dung.
   - Landing: mỗi câu hỏi mẫu là MỘT BOX viền rõ gồm nhãn + dòng mô tả đếm-từ-đâu (prompts.ts).
   - Câu trả lời là CARD có header "✦ Trợ lý" và footer nguồn số tách vạch — answerFor() đếm thật,
     kèm nút mở màn gốc; dưới câu trả lời cuối là chip các câu chưa hỏi.
   - Dữ liệu agent (data.ag) trả lời qua câu "Agent phát hiện gì mới?" — màn Agents & Alerts cũ
     rời sidebar, #/agents redirect về đây (App.tsx). Lịch sử nhóm theo data.asOf, không đồng hồ
     thật (store/assistant.ts). */

/** Độ trễ "đang tổng hợp" giả lập — hằng module để test chờ bằng findBy* thay vì ngủ dài. */
export const TYPING_MS = 400;

const GROUP_ORDER = ["Hôm nay", "Tuần này", "Trước đó"] as const;

/* Nhóm lịch sử so với asOf: phiên tạo trong buổi (at rỗng) và phiên đúng ngày asOf là "Hôm nay";
   trong 7 ngày trước đó là "Tuần này"; còn lại "Trước đó". isoFromVn hỏng khuôn → "Trước đó",
   không đoán. */
function groupOf(at: string, asOf: string): (typeof GROUP_ORDER)[number] {
  if (!at) return "Hôm nay";
  const d = isoFromVn(at.split(" · ")[0] ?? "");
  const a = isoFromVn(asOf);
  if (!d || !a) return "Trước đó";
  if (d === a) return "Hôm nay";
  const days = (Date.parse(a) - Date.parse(d)) / 86_400_000;
  return days > 0 && days <= 7 ? "Tuần này" : "Trước đó";
}

function turnLabel(turn: AssistantTurn): string {
  return turn.promptId ? promptLabel(turn.promptId) : (turn.text ?? "");
}

/* Card trả lời: header "✦ Trợ lý" + thân + footer nguồn số tách vạch — cấu trúc card thay khối chữ
   trần của bản đầu, để mắt tách được "đâu là một câu trả lời" khi hội thoại dài. */
function AnswerView({ answer, onGo }: { answer: AssistantAnswer; onGo: (to: string) => void }) {
  return (
    <div className="max-w-[92%] rounded-[10px] border border-line bg-surface">
      <div className="px-3.5 pt-2.5 text-[10.5px] font-bold tracking-[0.08em] text-ink-3">
        <span aria-hidden="true">✦ </span>TRỢ LÝ
      </div>
      <div className="px-3.5 py-2 text-[13.5px] text-ink">
        <p>{answer.intro}</p>
        {answer.bullets.length > 0 ? (
          <ul className="mt-1.5 flex flex-col gap-1">
            {answer.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span aria-hidden="true" className="flex-none text-ink-3">•</span>
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {answer.route || answer.provenance ? (
        <div className="border-t border-line px-3.5 py-2 flex items-baseline gap-3 flex-wrap">
          {answer.provenance ? <span className="t-meta text-[11.5px]">{answer.provenance}</span> : null}
          {answer.route ? (
            <button
              type="button"
              className={`${btnSecondary} ml-auto px-2.5 py-1 text-[12px] whitespace-nowrap`}
              onClick={() => onGo(answer.route!.to)}
            >
              {`${answer.route.label} →`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AssistantPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const sessions = useAssistantStore((s) => s.sessions);
  const activeId = useAssistantStore((s) => s.activeId);
  const newChat = useAssistantStore((s) => s.newChat);
  const openSession = useAssistantStore((s) => s.openSession);
  const ask = useAssistantStore((s) => s.ask);
  const navigate = useNavigate();

  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setTyping(false), TYPING_MS);
    return () => clearTimeout(t);
  }, [typing]);

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const onGo = (to: string) => navigate(`/${to}`);
  const submitTurn = (turn: AssistantTurn) => {
    ask(turn);
    setTyping(true);
  };

  const groups = GROUP_ORDER.map((g) => ({
    g,
    list: sessions.filter((s) => groupOf(s.at, data.asOf) === g),
  })).filter(({ list }) => list.length > 0);

  const askedIds = new Set((active?.turns ?? []).map((t) => t.promptId).filter(Boolean));
  const followups = PROMPTS.filter((p) => !askedIds.has(p.id)).slice(0, 3);

  return (
    /* h-full + min-h-0 xuyên suốt: <main> của Shell là flex-1 trong h-screen nên khung con ăn được
       đúng chiều cao màn — nhờ đó ô nhập ghim đáy KHUNG chứ không trôi cuối trang. */
    <div className="h-full p-8 pb-6 flex flex-col">
      <PageTitle route="assistant" />
      <div className="flex gap-5 items-stretch flex-1 min-h-0">
        {/* Khung Lịch sử — box viền riêng, tự cuộn */}
        <aside className="w-64 flex-none flex flex-col bg-surface border border-line rounded shadow-card min-h-0" data-testid="assistant-history">
          <div className="px-3.5 py-2.5 border-b border-line flex items-center gap-2">
            <span className="t-lbl">Lịch sử chat</span>
            <button
              type="button"
              data-testid="assistant-new"
              className={`${btnSecondary} ml-auto px-2 py-1 text-[12px]`}
              onClick={() => { newChat(); setTyping(false); }}
            >
              + Chat mới
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {groups.map(({ g, list }) => (
              <div key={g} className="mb-3 last:mb-0">
                <div className="t-lbl px-1.5 mb-1.5">{g}</div>
                <div className="flex flex-col gap-1">
                  {list.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`assistant-session-${s.id}`}
                      aria-current={s.id === activeId ? "true" : undefined}
                      onClick={() => { openSession(s.id); setTyping(false); }}
                      className={`w-full text-left rounded-[8px] px-2.5 py-1.5 text-[12.5px] border ${
                        s.id === activeId ? "bg-surface-2 border-line font-semibold" : "border-transparent text-ink-2 hover:bg-surface-2"
                      }`}
                    >
                      <span className="block truncate">{turnLabel(s.turns[0] ?? {}) || "Phiên trống"}</span>
                      {s.at ? <span className="t-meta text-[11px]">{s.at}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Khung Hội thoại — 3 tầng: header nền xám · vùng cuộn · ô nhập ghim đáy */}
        <section className="flex-1 min-w-0 max-w-[860px] flex flex-col bg-surface border border-line rounded shadow-card min-h-0">
          <div className="px-4 py-2.5 border-b border-line bg-surface-2 rounded-t flex items-baseline gap-2 flex-wrap">
            <span className="text-[13px] font-bold">
              <span aria-hidden="true">✦ </span>Trợ lý CXM
            </span>
            <span className="t-meta text-[11.5px]">{`trả lời bằng số đếm thật từ dữ liệu đang hiển thị · tính đến ${data.asOf}`}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {active ? (
              <div data-testid="assistant-conversation" className="flex flex-col gap-4">
                {active.turns.map((turn, i) => {
                  const last = i === active.turns.length - 1;
                  return (
                    <div key={`${active.id}-${i}`} data-testid={`assistant-turn-${i}`} className="flex flex-col gap-2.5">
                      <div className="self-end max-w-[80%] rounded-[10px] bg-surface-2 border border-line px-3 py-2 text-[13.5px]">
                        {turnLabel(turn)}
                      </div>
                      {last && typing ? (
                        <div data-testid="assistant-typing" className="t-meta text-[12.5px]">
                          Đang tổng hợp từ dữ liệu…
                        </div>
                      ) : (
                        <AnswerView answer={answerFor(turn.promptId, data, cfg)} onGo={onGo} />
                      )}
                    </div>
                  );
                })}
                {!typing && followups.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {followups.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        data-testid={`assistant-followup-${p.id}`}
                        className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-2 hover:bg-surface-2"
                        onClick={() => submitTurn({ promptId: p.id })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div data-testid="assistant-landing">
                <h2 className="t-block mb-1">Bạn muốn biết gì về khách hàng?</h2>
                <p className="t-meta text-[12px] mb-4">Chọn một câu hỏi mẫu — mỗi câu ghi rõ số được đếm từ màn nào.</p>
                <div className="flex flex-col gap-2">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`assistant-prompt-${p.id}`}
                      className="w-full flex items-start gap-3 rounded-[9px] border border-line bg-surface px-3.5 py-2.5 text-left hover:bg-surface-2 hover:shadow-sm"
                      onClick={() => submitTurn({ promptId: p.id })}
                    >
                      <span aria-hidden="true" className="flex-none w-5 text-center text-[15px] text-ink-3">{p.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-semibold">{p.label}</span>
                        <span className="block t-meta text-[11.5px] mt-0.5">{p.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line px-4 pt-3 pb-2.5">
            <form
              className="border border-line rounded-[10px] bg-surface px-3 py-2.5 focus-within:border-ink-3"
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (!text) return;
                submitTurn({ text });
                setDraft("");
              }}
            >
              <input
                data-testid="assistant-input"
                type="text"
                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-3"
                placeholder="Hỏi bất kỳ điều gì về khách hàng…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex items-center mt-2">
                {/* Chữ tĩnh, KHÔNG phải nút: owner duyệt phần trang trí giống Enterpret; dựng thành
                    button câm là một control trông bấm được mà không nói vì sao không làm gì. */}
                <span className="t-meta text-[12px]">Claude ▾</span>
                <button type="submit" data-testid="assistant-send" aria-label="Gửi" className={`${btnPrimary} ml-auto px-2.5 py-1 text-[13px]`}>
                  ↑
                </button>
              </div>
            </form>
            <p className="t-meta text-[11.5px] mt-2">Trợ lý có thể nhầm — kiểm tra lại số quan trọng.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
