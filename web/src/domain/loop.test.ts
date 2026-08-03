import { describe, it, expect } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import type { Action } from "../data/schema/index.ts";
import { getPrimaryAction, advanceAction, advanceBlockedReason } from "./loop.ts";

const findAction = (id: string): Action => seed.act.find((a) => a.id === id)!;
const findOutcome = (actId: string) => seed.out.find((o) => o.act === actId);

describe("getPrimaryAction", () => {
  /* Nhánh mới 02/08/2026 (module-a-charter.md A3): cf==='pending' phải thắng nhánh approve, dù
     action cũng có ap==='pending' (bất biến 5: cf==='pending' ⟹ ap==='pending', nên CXA-024 luôn có
     cả hai cùng 'pending' — đây chính là ca mà trước khi sửa, getPrimaryAction rơi nhầm vào approve). */
  it("action.cf:'pending' (CXA-024, seed thật) → CTA 'Xác nhận điểm gãy', KHÔNG rơi vào nhánh duyệt dù ap cũng 'pending'", () => {
    const a = findAction("CXA-024");
    expect(a.cf).toBe("pending");
    expect(a.ap).toBe("pending");
    const primary = getPrimaryAction(a, findOutcome(a.id));
    expect(primary).toEqual({
      key: "confirm",
      actor: "CX xác nhận điểm gãy",
      label: "Xác nhận điểm gãy",
    });
    expect(primary.key).not.toBe("approve");
  });

  it("action ap:'pending' (CXA-021, seed thật) → CTA 'Duyệt đề xuất xử lý', actor người phụ trách quyết định", () => {
    const a = findAction("CXA-021");
    expect(a.cf).toBe("confirmed"); // đã xác nhận rồi nên KHÔNG rơi vào nhánh confirm mới
    expect(a.ap).toBe("pending");
    const primary = getPrimaryAction(a, findOutcome(a.id));
    expect(primary).toEqual({
      key: "approve",
      actor: "Người phụ trách quyết định",
      label: "Duyệt đề xuất xử lý",
    });
  });

  it("dl:'backlog' + ap:'approved' → CTA bắt đầu triển khai", () => {
    const a: Action = { ...findAction("CXA-021"), ap: "approved" };
    expect(getPrimaryAction(a, undefined).key).toBe("start");
  });

  it("dl:'in-progress' → CTA đánh dấu đã phát hành (CXA-028, seed thật)", () => {
    const a = findAction("CXA-028");
    expect(a.dl).toBe("in-progress");
    expect(getPrimaryAction(a, findOutcome(a.id)).key).toBe("release");
  });

  it("dl:'released' nhưng chưa có outcome → CTA nhận dữ liệu đánh giá demo", () => {
    const a: Action = { ...findAction("CXA-021"), ap: "approved", dl: "released", iv: "monitoring" };
    expect(getPrimaryAction(a, undefined).key).toBe("observe");
  });

  /* Override tường minh iv/lc thay vì dùng thẳng CXA-013 của seed: từ 02/08/2026 CXA-013 đã
     iv:'validated' + lc:'closed', nên lấy nguyên nó thì test không còn ở trạng thái nó muốn kiểm.
     Ý định của test là "đã có outcome mà chưa kết luận" — neo bằng override giữ đúng ý đó và không
     vỡ lại lần sau nếu fixture đổi tiếp. Vẫn dùng outcome THẬT của CXA-013 (có trong seed.out). */
  it("có outcome nhưng iv chưa validated → CTA xác nhận kết quả đánh giá", () => {
    const a: Action = { ...findAction("CXA-013"), iv: "monitoring", lc: "blocked" };
    const o = findOutcome(a.id);
    expect(o).toBeDefined();
    expect(getPrimaryAction(a, o).key).toBe("validate");
  });

  it("iv:'validated' + loopClosed=false → CTA đánh dấu đã khép vòng", () => {
    const a: Action = { ...findAction("CXA-013"), iv: "validated" };
    const o = findOutcome(a.id);
    expect(getPrimaryAction(a, o, false).key).toBe("close");
  });

  it("iv:'validated' + loopClosed=true → done", () => {
    const a: Action = { ...findAction("CXA-013"), iv: "validated" };
    const o = findOutcome(a.id);
    expect(getPrimaryAction(a, o, true)).toEqual({ key: "done", actor: "", label: "Hoàn tất" });
  });
});

describe("advanceAction", () => {
  it("pending → approved (không mutate action gốc)", () => {
    const a = findAction("CXA-021");
    const next = advanceAction(a, findOutcome(a.id));
    expect(next.ap).toBe("approved");
    expect(a.ap).toBe("pending");
  });

  it("backlog → in-progress", () => {
    const a: Action = { ...findAction("CXA-021"), ap: "approved" };
    expect(advanceAction(a, undefined).dl).toBe("in-progress");
  });

  it("in-progress → released + iv monitoring", () => {
    const a = findAction("CXA-028");
    const next = advanceAction(a, undefined);
    expect(next.dl).toBe("released");
    expect(next.iv).toBe("monitoring");
  });

  it("released, chưa có outcome → giữ nguyên (tạo Outcome không thuộc domain)", () => {
    const a: Action = { ...findAction("CXA-021"), ap: "approved", dl: "released", iv: "monitoring" };
    expect(advanceAction(a, undefined)).toEqual(a);
  });

  // Cùng lý do override như ở getPrimaryAction phía trên: CXA-013 trong seed đã validated + closed.
  it("có outcome, iv chưa validated → validated", () => {
    const a: Action = { ...findAction("CXA-013"), iv: "monitoring", lc: "blocked" };
    const next = advanceAction(a, findOutcome(a.id));
    expect(next.iv).toBe("validated");
  });

  /* advanceAction CỐ Ý không tự set lc:'closed' dù Action đã có field đó từ 02/08/2026 — chưa chốt
     trục nào làm chủ trạng thái khép vòng (Action.lc hay bảng Loop khóa theo issue), xem ghi chú
     trong loop.ts. Test neo đúng lựa chọn đó: đã validated thì hàm trả về nguyên trạng.
     Dùng thẳng CXA-013 của seed được, vì nó đã validated sẵn. */
  it("iv đã validated → giữ nguyên (advanceAction không tự khép vòng)", () => {
    const a = findAction("CXA-013");
    expect(a.iv).toBe("validated");
    expect(advanceAction(a, findOutcome(a.id))).toEqual(a);
  });
});

describe("advanceBlockedReason", () => {
  it("action thường (không outcome hoặc verdict != inconclusive) → null", () => {
    const a = findAction("CXA-021");
    expect(advanceBlockedReason(a, findOutcome(a.id))).toBeNull();
  });

  it("outcome verdict 'inconclusive' + iv chưa validated (CXA-017, seed thật) → câu giải thích khác rỗng", () => {
    const a = findAction("CXA-017");
    const o = findOutcome(a.id);
    expect(o?.verdict).toBe("inconclusive");
    expect(a.iv).not.toBe("validated");
    const reason = advanceBlockedReason(a, o);
    expect(reason).not.toBeNull();
    expect(reason).not.toBe("");
  });

  it("outcome verdict 'inconclusive' nhưng iv đã validated → không còn bị chặn (null)", () => {
    const a: Action = { ...findAction("CXA-017"), iv: "validated" };
    const o = findOutcome("CXA-017");
    expect(advanceBlockedReason(a, o)).toBeNull();
  });
});
