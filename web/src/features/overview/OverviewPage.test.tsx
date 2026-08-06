import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { BLOCKS } from "../../data/blocks.ts";
import { MockRepository } from "../../data/mock-repository.ts";
import { navLabel } from "../../nav.tsx";
import { createCxmStore } from "../../store/store.ts";
import { DEFAULT_RANGE, useTimeframeStore } from "../../store/timeframe.ts";
import { OverviewPage } from "./OverviewPage.tsx";
import { TimeframeBar } from "./TimeframeBar.tsx";

/* Container test — mỗi test dùng store CÔ LẬP (createCxmStore(new MockRepository())) tiêm qua
   prop `useStore`, tránh ô nhiễm giữa các test trong cùng file khi test cần mutate boards
   (setBoardBlocks/resetBoard cho banner tùy chỉnh — oracle map #10, charter Phase 2 §2b 84-85).
   TimeframeBar mount CẠNH OverviewPage (giống Shell thật trong App.tsx) để test click-driven
   phủ được đúng đường dây bar→useTimeframeStore(singleton)→OverviewPage. */
function renderAt(initialPath: string, store: ReturnType<typeof createCxmStore>) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TimeframeBar useStore={store} />
      <Routes>
        <Route path="/cxm" element={<OverviewPage sec="cxm" useStore={store} />} />
        <Route path="/cxm/:setId" element={<OverviewPage sec="cxm" useStore={store} />} />
        <Route path="/voc" element={<OverviewPage sec="voc" useStore={store} />} />
        <Route path="/voc/:setId" element={<OverviewPage sec="voc" useStore={store} />} />
      </Routes>
    </MemoryRouter>,
  );
}

// useTimeframeStore là SINGLETON toàn app — trả về DEFAULT_RANGE sau mỗi test tránh rò rỉ range
// sang test khác trong cùng file (nhiều test ở dưới bấm đổi range qua TimeframeBar).
afterEach(() => {
  useTimeframeStore.setState({ range: DEFAULT_RANGE });
});

describe("OverviewPage — mọi set trong dash render được (oracle map #10, §2b 84-85)", () => {
  it("loop qua TỪNG set của data.dash: không throw, tên set thật, có nút Quản lý set, KHÔNG có chuỗi 'blkx'", () => {
    const store = createCxmStore(new MockRepository());
    const { data } = store.getState();
    expect(data.dash.length).toBeGreaterThan(0);

    for (const set of data.dash) {
      const { container, unmount } = renderAt(`/${set.sec}/${set.id}`, store);
      expect(screen.getByText(set.name)).toBeInTheDocument();
      expect(screen.getByText("✎ Quản lý set")).toBeInTheDocument();
      // Harness §2b dòng 85 cấm chuỗi 'blkx' (chuỗi sửa khối inline của redesign cũ) xuất hiện lại
      // ở Overview — kiểm trên MỌI set, không chỉ một set/URL.
      expect(container.innerHTML).not.toContain("blkx");
      unmount();
    }
  });
});

describe("OverviewPage — F3: share-by-URL với id lạ", () => {
  it("#/cxm/<id-không-tồn-tại> vẫn render, fallback đúng set mặc định (def), không throw", () => {
    const store = createCxmStore(new MockRepository());
    expect(() => renderAt("/cxm/khong-ton-tai-xyz-999", store)).not.toThrow();
    // b-cxm-exec (def:true) là set mặc định của phần cxm trong seed.
    expect(screen.getByText("Điều hành CX")).toBeInTheDocument();
  });

  it("#/voc/<id-không-tồn-tại> fallback đúng set mặc định của voc", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/voc/id-la-khong-co-that", store);
    // b-voc-all (def:true) là set mặc định của phần voc trong seed.
    expect(screen.getByText("Toàn cảnh tiếng nói")).toBeInTheDocument();
  });
});

describe("OverviewPage — F4: banner set tùy chỉnh", () => {
  it("boards[setId] tồn tại → hiện banner; bấm 'Trả set về mặc định' → banner mất", () => {
    const store = createCxmStore(new MockRepository());
    const setId = "b-voc-data";
    store.getState().setBoardBlocks(setId, 0, ["q14"]);

    renderAt(`/voc/${setId}`, store);
    expect(screen.getByText(/Set này đang có thay đổi/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Trả set về mặc định"));
    expect(screen.queryByText(/Set này đang có thay đổi/)).not.toBeInTheDocument();
    expect(store.getState().boards[setId]).toBeUndefined();
  });

  it("set KHÔNG có overlay → không hiện banner", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/voc/b-voc-data", store);
    expect(screen.queryByText(/Set này đang có thay đổi/)).not.toBeInTheDocument();
  });
});

describe("OverviewPage — F6: câu hỏi rỗng khối", () => {
  it("overlay board rỗng cho một câu hỏi → hiện 'Chưa có khối nào'", () => {
    const store = createCxmStore(new MockRepository());
    const setId = "b-cxm-out";
    store.getState().setBoardBlocks(setId, 0, []);

    renderAt(`/cxm/${setId}`, store);
    expect(screen.getByText(/Câu hỏi này chưa có khối nào/)).toBeInTheDocument();
  });
});

describe("OverviewPage — F2: bấm chip đổi set đang xem", () => {
  it("bấm chip set khác → URL đổi sang /<sec>/<setId>, nội dung đổi theo", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/cxm", store);
    // Mặc định là b-cxm-exec ("Điều hành CX"); bấm chip "Sức khỏe pilot Mở tài khoản".
    expect(screen.getByText("Điều hành CX")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Sức khỏe pilot Mở tài khoản"));
    // Set mới đang hiển thị: câu hỏi riêng của b-cxm-pilot xuất hiện (desc đã bị cắt — declutter
    // 02/08 — nên neo bằng h2 câu hỏi thay vì SetMeta.desc).
    expect(screen.getByText("Sáu bước đang thế nào?")).toBeInTheDocument();
  });
});

describe("OverviewPage — F1: set mặc định của mỗi phần", () => {
  it("#/cxm (không setId) → set mặc định b-cxm-exec ('Điều hành CX')", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/cxm", store);
    expect(screen.getByText("Điều hành CX")).toBeInTheDocument();
  });

  it("#/voc (không setId) → set mặc định b-voc-all ('Toàn cảnh tiếng nói')", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/voc", store);
    expect(screen.getByText("Toàn cảnh tiếng nói")).toBeInTheDocument();
  });
});

/* 06/08: owner chốt "chỉ giữ lại tên tab" cho MỌI màn, nên `<h1>` quay lại — nhưng chỉ đúng một
   dòng tên tab, không phải câu hero cũ. Hai test này trước ghim "không còn <h1> nào"; ghim như vậy
   giờ vừa sai vừa quá rộng. Đổi thành: `<h1>` PHẢI có, đúng MỘT cái, và đúng bằng nhãn trong
   sidebar — còn toàn bộ nội dung hero cũ (kick label, dòng owner/role, provenance, desc) vẫn vắng. */
describe("OverviewPage — đầu màn chỉ còn tên tab; meta owner/role + provenance + desc vẫn ĐÃ CẮT", () => {
  it("#/cxm in đúng nhãn tab, không còn dòng meta owner/role/shared, KHÔNG còn desc/provenance", () => {
    const store = createCxmStore(new MockRepository());
    const { container } = renderAt("/cxm", store);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(navLabel("cxm"));
    expect(container.querySelector('[data-testid="overview-kick"]')).not.toBeInTheDocument();
    // b-cxm-exec: owner 'Thu Hà · Head of CX', role 'Head of CX / CX Manager' — dòng SetMeta cũ
    // ghép owner/role/shared bằng ' · '; SetMeta đã xóa nên các cụm này không còn xuất hiện.
    expect(screen.queryByText(/Thu Hà · Head of CX/)).not.toBeInTheDocument();
    expect(screen.queryByText(/dành cho Head of CX \/ CX Manager/)).not.toBeInTheDocument();
    // D9a (02/08) từng trả lại dòng provenance "Set dùng chung/riêng · cập nhật ..." — declutter
    // owner 02/08 (task GLOBAL timeframe) CẮT LẠI cả provenance lẫn desc để trang gọn hơn quanh
    // thanh timeframe mới; đây là một đảo ngược có chủ đích của D9a, không phải regression.
    expect(screen.queryByTestId("set-provenance")).not.toBeInTheDocument();
    expect(screen.queryByText(/Bốn câu của người điều hành/)).not.toBeInTheDocument();
  });

  /* Hai màn dùng CHUNG component, chỉ khác prop `sec` — nên đây không phải bản sao thừa của test
     trên: nó chốt rằng tiêu đề đi theo `sec`, không phải một chuỗi đóng cứng cho màn CXM. */
  it("#/voc in nhãn tab CỦA NÓ, không mượn tên của #/cxm", () => {
    const store = createCxmStore(new MockRepository());
    const { container } = renderAt("/voc", store);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(navLabel("voc"));
    expect(h1s[0]).not.toHaveTextContent(navLabel("cxm"));
  });
});

describe("OverviewPage — b-cxm-exec: đúng 3 câu hỏi, KHÔNG còn @lanes/@outcomes (cut owner 01/08)", () => {
  it("đúng 3 câu hỏi, mỗi câu 1 khối, không câu nào rỗng", () => {
    const store = createCxmStore(new MockRepository());
    const { data } = store.getState();
    const set = data.dash.find((d) => d.id === "b-cxm-exec")!;
    expect(set.qs).toHaveLength(3);
    expect(set.qs.every((q) => q.b.length > 0)).toBe(true);
  });

  it("KHÔNG chứa @lanes/@outcomes; giữ @journeystate, @toppri, @coverage", () => {
    const store = createCxmStore(new MockRepository());
    const { data } = store.getState();
    const set = data.dash.find((d) => d.id === "b-cxm-exec")!;
    const allBlocks = set.qs.flatMap((q) => q.b);
    expect(allBlocks).not.toContain("@lanes");
    expect(allBlocks).not.toContain("@outcomes");
    expect(allBlocks).toEqual(["@journeystate", "@toppri", "@coverage"]);
  });

  it("render #/cxm mặc định KHÔNG có khối 'Bốn làn công việc'/'Kết quả đo được'", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/cxm", store);
    expect(screen.queryByText("Bốn làn công việc")).not.toBeInTheDocument();
    expect(screen.queryByText("Kết quả đo được")).not.toBeInTheDocument();
    expect(screen.getByText("Trạng thái hành trình")).toBeInTheDocument();
    expect(screen.getByText("Độ phủ đo lường")).toBeInTheDocument();
  });
});

describe("OverviewPage — b-voc-all: câu 'Cái gì đang bất thường?' KHÔNG còn @anomlanes (cut owner 01/08)", () => {
  it("chỉ còn q15, không chứa @anomlanes", () => {
    const store = createCxmStore(new MockRepository());
    const { data } = store.getState();
    const set = data.dash.find((d) => d.id === "b-voc-all")!;
    const q4 = set.qs.find((q) => q.q === "Cái gì đang bất thường?")!;
    expect(q4.b).toEqual(["q15"]);
  });

  it("render #/voc mặc định KHÔNG có khối 'Ba làn bất thường'", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/voc", store);
    expect(screen.queryByText("Ba làn bất thường")).not.toBeInTheDocument();
  });
});

describe("OverviewPage — validateFixture rỗng sau các cut/sửa 01/08", () => {
  it("store.validate() (validateFixture qua repo) không có lỗi", () => {
    const store = createCxmStore(new MockRepository());
    expect(store.getState().validate()).toEqual([]);
  });
});

/* 9 block gốc (owner chốt giữ cả 9 để compose) + `@themestack` thêm 03/08. Con số này phải đi
   cùng registry: `seed.ts` gắn `@themestack` vào `b-voc-all`, mà `validateFixture()` đòi mọi
   `@block` trong set phải có def trong BLOCKS — bỏ sót một bên là 42 test đỏ. */
describe("OverviewPage — registry blocks.ts đủ 10 block", () => {
  it("BLOCKS có đúng 10 entry", () => {
    expect(Object.keys(BLOCKS)).toHaveLength(10);
  });

  it("@themestack có def, thuộc phần voc, drill-down tới route có thật", () => {
    expect(BLOCKS["@themestack"]).toEqual({
      n: "Theme theo thành phần",
      sec: "voc",
      go: "topics",
    });
  });
});

describe("OverviewPage — bộ lọc thời gian GLOBAL kiểu Enterpret (TimeframeBar ở App Shell, quyết định owner 01/08 mở rộng 02/08)", () => {
  it("mặc định '6M' được chọn (aria-pressed=true, DEFAULT_RANGE='6m')", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/voc", store);
    expect(screen.getByText("6M")).toHaveAttribute("aria-pressed", "true");
  });

  it("bấm '3M' → q15 (anomaly, 2 dòng × 6 điểm thật) RÚT NGẮN còn 2 dòng × 3 điểm", () => {
    const store = createCxmStore(new MockRepository());
    const { container } = renderAt("/voc", store);
    const chartBefore = screen.getByTestId("anomaly-chart");
    expect(chartBefore.querySelectorAll("title")).toHaveLength(12);

    fireEvent.click(screen.getByText("3M"));
    const chartAfter = container.querySelector('[data-testid="anomaly-chart"]')!;
    expect(chartAfter.querySelectorAll("title")).toHaveLength(6);
  });

  it("card snapshot (@journeystate, /cxm) KHÔNG đổi số khi đổi range, nhưng CÓ dấu 'Ảnh chụp'", () => {
    const store = createCxmStore(new MockRepository());
    renderAt("/cxm", store);
    expect(screen.getAllByText(/Ảnh chụp ·/).length).toBeGreaterThan(0);

    const statValue = () => screen.getAllByTestId("stat")[0]!.querySelector(".t-num")!.textContent;
    const before = statValue();

    fireEvent.click(screen.getByText("3M"));
    expect(statValue()).toBe(before);
  });
});
