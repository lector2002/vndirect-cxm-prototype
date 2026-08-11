import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { sourceHealth } from "../../../domain/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { SourceGroup } from "./SourceGroup.tsx";

/* Container — dùng store singleton thật, cùng khuôn WorkPage.test.tsx. */
afterEach(() => {
  const { cfgDefault, setCfg } = useCxmStore.getState();
  setCfg({ source: cfgDefault.source });
});

describe("SourceGroup", () => {
  it("số dòng bảng nguồn bằng data.sources.length — không gõ tay dòng nào", () => {
    const { data } = useCxmStore.getState();
    render(<SourceGroup />);
    expect(screen.getAllByTestId(/^rules-source-row-/)).toHaveLength(data.sources.length);
  });

  /* 07/08 (module-i-signal-registry-charter.md §0 mục A, I3): owner chốt đổi cách chấm sức khoẻ
     nguồn sang so `Source.last` với mốc số liệu `asOf` (domain/state.ts) — `cfg.source[id]` (SLA
     giờ riêng từng nguồn, nhóm 3 ở màn này) THÔI ĐƯỢC ĐỌC để chấm sức khoẻ. Test này TỪNG khẳng
     định ngược lại ("nới SLA ⇒ badge đổi") — đúng dưới cách chấm CŨ, SAI dưới cách chấm MỚI. Giữ
     nguyên Ý ĐỊNH kiểm tra ("sửa ô nhập SLA có ảnh hưởng gì không") nhưng lật kỳ vọng: cột "SLA cho
     phép" giờ là control MỒ CÔI (giống `cfg.step.covMin` sau I1) — sửa vẫn ghi được vào cfg, nhưng
     KHÔNG còn đổi được nhãn cột "Trạng thái suy ra". */
  it("nới SLA một nguồn KHÔNG còn đổi badge — cfg.source[id] đã mất quyền chấm sức khoẻ", () => {
    const { data, cfg } = useCxmStore.getState();
    const stale = data.sources.find((s) => sourceHealth(s, cfg, data.asOf) === "stale");
    if (!stale) throw new Error("fixture hiện không có nguồn nào 'stale' — chọn lại kịch bản đo");

    render(<SourceGroup />);

    const row = screen.getByTestId(`rules-source-row-${stale.id}`);
    expect(row).toHaveTextContent("Thiếu ngày dữ liệu");

    // Nới SLA lên một số rất lớn — dưới cách chấm cũ chắc chắn sẽ đổi badge sang "Đang nhận".
    const input = screen.getByLabelText(`SLA ${stale.name}`);
    fireEvent.change(input, { target: { value: "999999" } });
    fireEvent.blur(input);

    expect(useCxmStore.getState().cfg.source[stale.id]).toBe(999_999);
    expect(screen.getByTestId(`rules-source-row-${stale.id}`)).toHaveTextContent("Thiếu ngày dữ liệu");
  });
});
