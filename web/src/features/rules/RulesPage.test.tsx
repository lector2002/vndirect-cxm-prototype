import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { navLabel } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { RulesPage } from "./RulesPage.tsx";

/* Vỏ màn "Chỉ số & ngưỡng" — bộ test này canh những bất biến của CHÍNH VỎ MÀN, không lặp lại phần
   từng nhóm đã tự canh:

   · bảy nhóm đều mở được (một nhóm câm là một mảng cấu hình không ai tới được, và không có gì đỏ);
   · dòng trạng thái nói đúng đang mặc định hay đã sửa, và nút trả về mặc định ĐƯA ĐƯỢC về thật —
     kể cả sau khi tạo thêm một set (ca làm hỏng nút reset nếu `cfg.sub` bị ghi đè một cục);
   · cấu hình mâu thuẫn thì màn nói ra, không im lặng chạy tiếp. */

const cfg0 = useCxmStore.getState().cfg;

afterEach(() => {
  useCxmStore.getState().setCfg(cfg0);
});

const cfg = () => useCxmStore.getState().cfg;

const GROUPS = [
  "Bước hành trình",
  "Chỉ số theo dõi",
  "SLA từng nguồn",
  "Cảnh báo & khảo sát",
  "Phân khúc khách",
  "Bản tin định kỳ",
  "Trọng số ưu tiên",
];

describe("RulesPage — vỏ màn", () => {
  it("đầu màn chỉ có tên tab, lấy từ nguồn nav duy nhất", () => {
    render(<RulesPage />);
    expect(screen.getByTestId("page-title").textContent).toBe(navLabel("rules"));
  });

  it("bảy nhóm đều mở được, không nhóm nào câm", () => {
    render(<RulesPage />);
    for (const g of GROUPS) {
      const btn = screen.getByRole("button", { name: new RegExp(g.replace("&", "&")) });
      fireEvent.click(btn);
      expect(btn.getAttribute("aria-pressed")).toBe("true");
      // Nhóm đang mở phải render THÂN THẬT, không còn là stub "đang được dựng".
      expect(screen.queryByText("Nhóm này đang được dựng.")).toBeNull();
    }
  });

  it("mặc định thì nút trả về mặc định bị khoá; sửa một ô là mở ra", () => {
    render(<RulesPage />);
    expect(screen.getByTestId("rules-reset").hasAttribute("disabled")).toBe(true);

    // `setCfg` ngoài luồng sự kiện của React phải bọc `act` — không bọc thì màn chưa render lại
    // xong lúc assert, và test đỏ vì lý do chẳng liên quan gì tới nội dung đang canh.
    act(() => useCxmStore.getState().setCfg({ step: { ...cfg0.step, failCrit: 33 } }));
    expect(screen.getByTestId("rules-reset").hasAttribute("disabled")).toBe(false);
    expect(screen.getByText(/Đang dùng ngưỡng đã sửa/)).toBeTruthy();
  });

  it("trả về mặc định đưa cfg về đúng mặc định — KỂ CẢ sau khi tạo thêm một set", () => {
    render(<RulesPage />);
    // Tạo set làm `cfg.sub` mọc thêm một khoá không có trong mặc định. Gán thẳng `cfgDefault.sub`
    // lúc reset sẽ làm set đó mất cấu hình bản tin ⇒ seam ghi CHẶN ⇒ nút reset tịt.
    const created = useCxmStore.getState().createSet("cxm");
    act(() => useCxmStore.getState().setCfg({ anomaly: { z: 9 } }));
    expect(cfg().sub[created.id]).toBeTruthy();

    fireEvent.click(screen.getByTestId("rules-reset"));

    expect(screen.queryByTestId("rules-reset-error")).toBeNull();
    expect(cfg().anomaly.z).toBe(cfg0.anomaly.z);
    expect(cfg().sub[created.id]).toEqual({ f: "off", ch: "Email" });
    useCxmStore.getState().deleteSet(created.id);
  });

  it("ngưỡng đặt ngược nhau thì màn nói ra ngay đầu trang", () => {
    render(<RulesPage />);
    expect(screen.queryByTestId("rules-contradictions")).toBeNull();

    // failCrit phải CAO hơn failWatch; đặt ngược lại là nhãn trạng thái mất nghĩa.
    act(() => useCxmStore.getState().setCfg({ step: { ...cfg0.step, failCrit: 1, failWatch: 20 } }));
    const box = screen.getByTestId("rules-contradictions");
    expect(within(box).getByText(/ngưỡng đang đặt ngược nhau/)).toBeTruthy();
  });
});
