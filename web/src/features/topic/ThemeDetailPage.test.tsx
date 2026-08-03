import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { createCxmStore } from "../../store/store.ts";
import { ThemeDetailPage } from "./ThemeDetailPage.tsx";

function renderAtId(id: string) {
  const useStore = createCxmStore(new MockRepository());
  return render(
    <MemoryRouter initialEntries={[`/topic/${id}`]}>
      <Routes>
        <Route path="/topic/:id" element={<ThemeDetailPage useStore={useStore} />} />
      </Routes>
    </MemoryRouter>,
  );
}

/* Oracle (seed.ts): x-th-device (theme, n=412) có 2 subtheme (x-sub-android 238, x-sub-glare 174),
   VoiceInsight seg=['Android tầm trung','Khách 50+'], 4 evidence tax bao gồm x-th-device
   (EV-101..104, q text đọc trực tiếp dòng 307/311/315/319). */
describe("ThemeDetailPage", () => {
  it("id là theme (x-th-device) → 4 section: header (tên+tổng n đã fx()+why), breakdown sub-theme, nhóm khách, evidence", () => {
    renderAtId("x-th-device");
    expect(screen.getByText("Thiết bị / môi trường không tương thích")).toBeInTheDocument();
    // fx(412) = round(412*5.6) = 2307
    expect(screen.getByText("2.307")).toBeInTheDocument();
    expect(screen.getByText(/Khách thất bại vì phần cứng/)).toBeInTheDocument();
    expect(screen.getByText("Android tầm trung, ánh sáng yếu")).toBeInTheDocument();
    expect(screen.getByText("Giấy tờ bị chói hoặc mờ")).toBeInTheDocument();
    expect(screen.getByText("Android tầm trung")).toBeInTheDocument();
    expect(screen.getByText("Khách 50+")).toBeInTheDocument();
    expect(screen.getByText('"Mã lỗi LIGHT_CONDITION sau 3 lần thử."')).toBeInTheDocument();
  });

  it("id là subtheme (x-sub-android) → hiện detail của theme CHA (x-th-device), có chú thích, KHÔNG 'không tìm thấy'", () => {
    renderAtId("x-sub-android");
    expect(screen.getByText(/Đang xem theme cha của sub-theme/)).toBeInTheDocument();
    expect(screen.getByText("Thiết bị / môi trường không tương thích")).toBeInTheDocument();
    expect(screen.queryByText(/Không tìm thấy/)).not.toBeInTheDocument();
  });

  it("id là L2 (feature, x-l2-ekyc 'eKYC') → Note CÁI GÌ + link atlas, KHÔNG 'không tìm thấy' (regression search: hit feature không ngõ cụt)", () => {
    renderAtId("x-l2-ekyc");
    expect(screen.getByText(/eKYC/)).toBeInTheDocument();
    expect(screen.getByText(/CHƯA có màn topic riêng/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bản đồ hành trình/ })).toHaveAttribute("href", "#/atlas");
    expect(screen.queryByText(/Không tìm thấy/)).not.toBeInTheDocument();
  });

  it("id không có trong tax → Note 'Không tìm thấy'", () => {
    renderAtId("khong-ton-tai-abc");
    expect(screen.getByText(/Không tìm thấy/)).toBeInTheDocument();
  });

  it("theme không sub-theme (x-th-fee) → 'Chưa có sub-theme.'", () => {
    renderAtId("x-th-fee");
    expect(screen.getByText("Chưa có sub-theme.")).toBeInTheDocument();
  });

  it("theme không VoiceInsight/evidence (x-th-slow) → 'Chưa gắn nhóm khách.' + 'Chưa có evidence mẫu.'", () => {
    renderAtId("x-th-slow");
    expect(screen.getByText("Chưa gắn nhóm khách.")).toBeInTheDocument();
    expect(screen.getByText("Chưa có evidence mẫu.")).toBeInTheDocument();
  });

  it("Demo TẮT (data rỗng qua setDemoMode(false)) → không throw, hiện 'Không tìm thấy' (EMPTY_DATA.tax rỗng)", () => {
    const useStore = createCxmStore(new MockRepository());
    useStore.getState().setDemoMode(false);
    render(
      <MemoryRouter initialEntries={["/topic/x-th-device"]}>
        <Routes>
          <Route path="/topic/:id" element={<ThemeDetailPage useStore={useStore} />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Không tìm thấy/)).toBeInTheDocument();
  });
});
