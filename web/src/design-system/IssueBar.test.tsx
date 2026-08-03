import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import { advanceBlockedReason, getPrimaryAction, laneOf } from "../domain/index.ts";
import { IssueBar } from "./IssueBar.tsx";

/* Dữ liệu fixture THẬT (seed.ts) — không bịa object. `stage`/`primary`/`blockedReason` được tính
   bằng đúng hàm domain container sẽ dùng, để test bám sát hành vi thật thay vì tự gán số. */
const issueOf = (id: string) => seed.iss.find((i) => i.id === id)!;
const actionOf = (id: string) => seed.act.find((a) => a.id === id)!;
const outcomeOf = (actId: string) => seed.out.find((o) => o.act === actId);
const loopClosedOf = (issId: string) => {
  const l = seed.loop.find((x) => x.iss === issId);
  return l ? l.done === l.need : false;
};

// CXI-021/CXA-021: owner đã gán, ap='pending' -> lane 'approve', không outcome -> không bị chặn.
const issue021 = issueOf("CXI-021");
const action021 = actionOf("CXA-021");
const stage021 = laneOf(action021);
const primary021 = getPrimaryAction(action021, outcomeOf(action021.id), loopClosedOf(issue021.id));
const blocked021 = advanceBlockedReason(action021, outcomeOf(action021.id));

// CXI-028/CXA-028: ap='approved', dl='in-progress' -> lane 'fix'.
const issue028 = issueOf("CXI-028");
const action028 = actionOf("CXA-028");
const stage028 = laneOf(action028);
const primary028 = getPrimaryAction(action028, outcomeOf(action028.id), loopClosedOf(issue028.id));

// CXI-013/CXA-013: action DUY NHẤT đã khép vòng trọn vẹn -> lane 'off'.
const issue013 = issueOf("CXI-013");
const action013 = actionOf("CXA-013");
const stage013 = laneOf(action013);
const primary013 = getPrimaryAction(action013, outcomeOf(action013.id), loopClosedOf(issue013.id));

// CXI-024/CXA-024: cf='pending' -> lane 'confirm'.
const issue024 = issueOf("CXI-024");
const action024 = actionOf("CXA-024");
const stage024 = laneOf(action024);
const primary024 = getPrimaryAction(action024, outcomeOf(action024.id), loopClosedOf(issue024.id));

// CXI-017/CXA-017: outcome verdict='inconclusive' && iv!=='validated' -> advanceBlockedReason có lý do thật.
const issue017 = issueOf("CXI-017");
const action017 = actionOf("CXA-017");
const stage017 = laneOf(action017);
const primary017 = getPrimaryAction(action017, outcomeOf(action017.id), loopClosedOf(issue017.id));
const blocked017 = advanceBlockedReason(action017, outcomeOf(action017.id));

const SEV_COLOR = "var(--crit)";

describe("IssueBar", () => {
  it("render root testid + tiêu đề + Ưu tiên {pri.total}", () => {
    render(
      <IssueBar
        issue={issue021}
        action={action021}
        stage={stage021}
        primary={primary021}
        blockedReason={blocked021}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    const root = screen.getByTestId(`issue-bar-${issue021.id}`);
    expect(root).toBeInTheDocument();
    expect(root).toHaveTextContent(issue021.title);
    expect(root).toHaveTextContent(`Ưu tiên ${issue021.pri.total}`);
  });

  it("stage='fix': ô stage-fix có aria-current='step', các ô khác không có", () => {
    render(
      <IssueBar
        issue={issue028}
        action={action028}
        stage={stage028}
        primary={primary028}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(stage028).toBe("fix");
    expect(screen.getByTestId("stage-fix")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("stage-confirm")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("stage-approve")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("stage-verify")).not.toHaveAttribute("aria-current");
  });

  it("stage='off': KHÔNG ô nào có aria-current", () => {
    render(
      <IssueBar
        issue={issue013}
        action={action013}
        stage={stage013}
        primary={primary013}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(stage013).toBe("off");
    expect(screen.getByTestId("stage-confirm")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("stage-approve")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("stage-fix")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("stage-verify")).not.toHaveAttribute("aria-current");
  });

  it("cả 4 ô LUÔN in nhãn chữ ở mọi stage (a11y: không chỉ dựa vào màu)", () => {
    render(
      <IssueBar
        issue={issue024}
        action={action024}
        stage={stage024}
        primary={primary024}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(screen.getByTestId("stage-confirm")).toHaveTextContent("1 Xác nhận");
    expect(screen.getByTestId("stage-approve")).toHaveTextContent("2 Duyệt");
    expect(screen.getByTestId("stage-fix")).toHaveTextContent("3 Sửa");
    expect(screen.getByTestId("stage-verify")).toHaveTextContent("4 Verify");
  });

  it("blockedReason=null: nút CTA bấm được, nhãn = primary.label, click gọi onAdvance đúng 1 lần", () => {
    expect(blocked021).toBeNull();
    const onAdvance = vi.fn();
    render(
      <IssueBar
        issue={issue021}
        action={action021}
        stage={stage021}
        primary={primary021}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={onAdvance}
      />,
    );
    const btn = screen.getByTestId(`advance-${action021.id}`);
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveTextContent(primary021.label);
    fireEvent.click(btn);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("blockedReason!=null: nút disabled, click KHÔNG gọi onAdvance, lý do hiện thành chữ đọc được trong DOM", () => {
    expect(blocked017).not.toBeNull();
    const onAdvance = vi.fn();
    render(
      <IssueBar
        issue={issue017}
        action={action017}
        stage={stage017}
        primary={primary017}
        blockedReason={blocked017}
        sevColor={SEV_COLOR}
        onAdvance={onAdvance}
      />,
    );
    const btn = screen.getByTestId(`advance-${action017.id}`);
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onAdvance).not.toHaveBeenCalled();
    expect(screen.getByText(blocked017 as string)).toBeInTheDocument();
  });

  it("action.lc='ready': hiện chip 'chờ khép vòng'", () => {
    // Fixture hiện KHÔNG có action nào lc='ready' (seed.ts ghi rõ: action validated duy nhất đã
    // 'closed' luôn) — override MỘT field trên action thật để dựng nhánh này, không bịa cả object.
    const readyAction = { ...action021, lc: "ready" as const };
    render(
      <IssueBar
        issue={issue021}
        action={readyAction}
        stage={stage021}
        primary={primary021}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(screen.getByTestId(`lc-chip-${readyAction.id}`)).toHaveTextContent("Chờ khép vòng");
  });

  it("action.lc='closed': hiện chip 'đã khép vòng'", () => {
    expect(action013.lc).toBe("closed");
    render(
      <IssueBar
        issue={issue013}
        action={action013}
        stage={stage013}
        primary={primary013}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(screen.getByTestId(`lc-chip-${action013.id}`)).toHaveTextContent("Đã khép vòng");
  });

  it("action.lc='blocked': KHÔNG có chip khép vòng", () => {
    expect(action021.lc).toBe("blocked");
    render(
      <IssueBar
        issue={issue021}
        action={action021}
        stage={stage021}
        primary={primary021}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(screen.queryByTestId(`lc-chip-${action021.id}`)).toBeNull();
  });

  it("có onOpenIssue: tiêu đề là button, click gọi callback", () => {
    const onOpenIssue = vi.fn();
    render(
      <IssueBar
        issue={issue021}
        action={action021}
        stage={stage021}
        primary={primary021}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
        onOpenIssue={onOpenIssue}
      />,
    );
    const titleBtn = screen.getByRole("button", { name: issue021.title });
    fireEvent.click(titleBtn);
    expect(onOpenIssue).toHaveBeenCalledTimes(1);
  });

  it("không có onOpenIssue: tiêu đề KHÔNG phải button", () => {
    render(
      <IssueBar
        issue={issue021}
        action={action021}
        stage={stage021}
        primary={primary021}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: issue021.title })).not.toBeInTheDocument();
  });

  it("stage='confirm' + onConfirm truyền vào: CTA đổi thành 'Xác nhận điểm gãy', click gọi onConfirm chứ KHÔNG gọi onAdvance", () => {
    expect(stage024).toBe("confirm");
    const onAdvance = vi.fn();
    const onConfirm = vi.fn();
    render(
      <IssueBar
        issue={issue024}
        action={action024}
        stage={stage024}
        primary={primary024}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={onAdvance}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.queryByTestId(`advance-${action024.id}`)).not.toBeInTheDocument();
    const btn = screen.getByTestId(`assign-${action024.id}`);
    expect(btn).toHaveTextContent("Xác nhận điểm gãy");
    expect(screen.getByText("Không duyệt được khi chưa xác nhận điểm gãy")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("stage='confirm' nhưng KHÔNG truyền onConfirm: giữ nguyên CTA cũ (advance/primary.label/primary.actor)", () => {
    expect(stage024).toBe("confirm");
    render(
      <IssueBar
        issue={issue024}
        action={action024}
        stage={stage024}
        primary={primary024}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
      />,
    );
    expect(screen.queryByTestId(`assign-${action024.id}`)).not.toBeInTheDocument();
    const btn = screen.getByTestId(`advance-${action024.id}`);
    expect(btn).toHaveTextContent(primary024.label);
    expect(screen.getByText(primary024.actor)).toBeInTheDocument();
  });

  it("stage!=='confirm' dù CÓ truyền onConfirm: vẫn dùng nhánh advance cũ (vd stage='fix')", () => {
    expect(stage028).toBe("fix");
    const onConfirm = vi.fn();
    render(
      <IssueBar
        issue={issue028}
        action={action028}
        stage={stage028}
        primary={primary028}
        blockedReason={null}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.queryByTestId(`assign-${action028.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`advance-${action028.id}`)).toHaveTextContent(primary028.label);
  });

  it("không có thẻ <a> nào (màn này không điều hướng sang tab khác)", () => {
    const { container } = render(
      <IssueBar
        issue={issue021}
        action={action021}
        stage={stage021}
        primary={primary021}
        blockedReason={blocked021}
        sevColor={SEV_COLOR}
        onAdvance={() => {}}
        onOpenIssue={() => {}}
      />,
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });
});
