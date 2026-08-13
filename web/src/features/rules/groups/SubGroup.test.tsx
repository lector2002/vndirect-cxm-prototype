import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useCxmStore } from "../../../store/store.ts";
import { SubGroup } from "./SubGroup.tsx";

/* Ghim hai thứ: (1) đặt tần suất một bản tin về 'off' phải khoá đúng ô chọn kênh của DÒNG ĐÓ, không
   phải mọi dòng; (2) câu tổng kết cuối nhóm sinh từ `cfg.sub` hiện tại, kể cả khi KHÔNG bản tin nào
   bật. `b-cxm-exec` (tần suất mặc định 'weekly') dùng làm dòng thao tác vì nó không phải 'off' sẵn. */

const cfg0 = useCxmStore.getState().cfg;

afterEach(() => {
  useCxmStore.getState().setCfg({ sub: cfg0.sub });
});

describe("SubGroup — bản tin định kỳ", () => {
  it("số dòng bảng đúng bằng data.dash, không gõ tay id nào", () => {
    render(<SubGroup />);
    const { data } = useCxmStore.getState();
    for (const d of data.dash) {
      expect(screen.getByTestId(`sub-row-${d.id}`)).toBeTruthy();
    }
  });

  it("đặt tần suất một bản tin về off ⇒ ô chọn kênh của đúng dòng đó bị khoá", () => {
    render(<SubGroup />);
    const freqField = screen.getByLabelText("Tần suất bản tin Điều hành CX");
    const chanField = screen.getByLabelText("Kênh gửi bản tin Điều hành CX") as HTMLSelectElement;
    expect(chanField.disabled).toBe(false);

    fireEvent.change(freqField, { target: { value: "off" } });

    expect(useCxmStore.getState().cfg.sub["b-cxm-exec"].f).toBe("off");
    expect(chanField.disabled).toBe(true);

    // Dòng khác không bị ảnh hưởng — chỉ đúng dòng vừa sửa bị khoá.
    const otherChan = screen.getByLabelText("Kênh gửi bản tin Toàn cảnh tiếng nói") as HTMLSelectElement;
    expect(otherChan.disabled).toBe(false);
  });

  it("câu tổng kết cuối nhóm liệt kê đúng các bản tin đang bật, sinh từ cfg.sub", () => {
    render(<SubGroup />);
    const { data, cfg } = useCxmStore.getState();
    const on = data.dash.filter((d) => cfg.sub[d.id].f !== "off");
    expect(on.length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(`${on.length} bản tin đang bật`))).toBeTruthy();
  });

  /* luật 12/08 bỏ vế "Không ai nhận được gì nếu không tự vào xem" (hệ quả luận giải) nên assertion
     ghim nó đi theo. Điều test canh KHÔNG đổi: tắt hết thì khối phải NÓI RA tình trạng đó, không im. */
  it("tắt hết bản tin ⇒ khối tổng kết nói ra là không còn bản tin nào bật", () => {
    render(<SubGroup />);
    const { data } = useCxmStore.getState();
    for (const d of data.dash) {
      const f = screen.getByLabelText(`Tần suất bản tin ${d.name}`);
      fireEvent.change(f, { target: { value: "off" } });
    }
    expect(screen.getByText(/Không có bản tin nào đang bật/)).toBeTruthy();
  });
});
