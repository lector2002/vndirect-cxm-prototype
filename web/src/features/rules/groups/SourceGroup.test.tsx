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

  it("nới SLA một nguồn ⇒ badge nguồn đó đổi sang 'Đang nhận'", () => {
    const { data, cfg } = useCxmStore.getState();
    // Suy nguồn 'stale' từ dữ liệu thật (không chép cứng id) — phải là 'stale', không phải 'down',
    // vì 'down' bị khoá bởi deadDays trong sourceHealth() và nới SLA sẽ không đổi được nhãn.
    const stale = data.sources.find((s) => sourceHealth(s, cfg) === "stale");
    if (!stale) throw new Error("fixture hiện không có nguồn nào 'stale' — chọn lại kịch bản đo");

    render(<SourceGroup />);

    const row = screen.getByTestId(`rules-source-row-${stale.id}`);
    expect(row).toHaveTextContent("Trễ hơn SLA");

    const input = screen.getByLabelText(`SLA ${stale.name}`);
    fireEvent.change(input, { target: { value: String(stale.lagH) } });
    fireEvent.blur(input);

    expect(screen.getByTestId(`rules-source-row-${stale.id}`)).toHaveTextContent("Đang nhận");
  });
});
