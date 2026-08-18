import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { sourceDaysMissing, sourceHealth } from "../../../domain/index.ts";
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

  /* Test này đã LẬT KỲ VỌNG HAI LẦN, và cả hai lần vì owner đổi quyết định — nên ghi lại cả chuỗi,
     đừng dọn cho gọn:

     · trước 07/08: "nới SLA ⇒ badge đổi" — đúng, `cfg.source[id]` tính bằng GIỜ và cầm quyền chấm.
     · 07/08 (charter §0 mục A, I3): thước đổi sang so `Source.last` với `asOf` theo NGÀY, bỏ đọc
       `cfg.source[id]` ⇒ ô nhập thành control MỒ CÔI, test lật thành "nới SLA KHÔNG đổi badge".
     · 11/08 (owner, giải C5): đổi đơn vị ô nhập sang NGÀY thay vì bỏ nhóm ⇒ ô cầm quyền TRỞ LẠI,
       test lật về khẳng định ban đầu — nhưng bằng đơn vị mới.

     Ý ĐỊNH giữ nguyên suốt ba lần: "sửa ô nhập ở nhóm này có đổi được nhãn cột Trạng thái suy ra
     không". Đó là phép kiểm duy nhất phân biệt được một ô cấu hình thật với một ô trang trí. */
  it("nới nhịp giao một nguồn ĐỔI ĐƯỢC badge — cfg.source[id] lại cầm quyền chấm sức khoẻ", () => {
    const { data, cfg } = useCxmStore.getState();
    const stale = data.sources.find((s) => sourceHealth(s, cfg, data.asOf) === "stale");
    if (!stale) throw new Error("fixture hiện không có nguồn nào 'stale' — chọn lại kịch bản đo");

    render(<SourceGroup />);

    const row = screen.getByTestId(`rules-source-row-${stale.id}`);
    expect(row).toHaveTextContent("Missing days");

    /* Nới nhịp lên đúng số ngày nguồn đang thiếu — tính lại từ data, không gõ số. Nới VỪA ĐỦ (không
       phải 999999) mới chứng minh được ngưỡng đọc theo ngày thật: một số khổng lồ cũng cho "ok" dưới
       bất kỳ đơn vị nào, kể cả nếu ai đó lỡ đưa ô này về lại đơn vị giờ. */
    const missing = sourceDaysMissing(stale, data.asOf);
    const input = screen.getByLabelText(`SLA ${stale.name}`);
    fireEvent.change(input, { target: { value: String(missing) } });
    fireEvent.blur(input);

    expect(useCxmStore.getState().cfg.source[stale.id]).toBe(missing);
    expect(screen.getByTestId(`rules-source-row-${stale.id}`)).toHaveTextContent("Receiving");
  });
});
