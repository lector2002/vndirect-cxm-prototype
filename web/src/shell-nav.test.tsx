import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App.tsx";
import { MVP_ROUTES, NAV_ITEMS, navIcon } from "./nav.tsx";

/** Đếm lại từ chính bản khai, không ghim số: đổi `MVP_ROUTES` thì test đi theo, còn đổi CÁCH DỰNG
    sidebar mới làm test đỏ. */
const MVP_ITEMS = NAV_ITEMS.filter((n) => MVP_ROUTES.has(n.r));
const OFF_ITEMS = NAV_ITEMS.filter((n) => !MVP_ROUTES.has(n.r));

/* Sidebar thu gọn + icon điều hướng (owner chốt 12/08 tối). Điều phải canh không phải bề rộng bao
   nhiêu px mà là hai luật:
   1. THU GỌN KHÔNG ĐƯỢC LÀM MẤT ĐƯỜNG SANG MÀN KHÁC. Owner chọn dải icon chứ không chọn ẩn hẳn
      đúng vì lý do này — mọi mục nav phải còn bấm được ở cả hai trạng thái, và mỗi mục phải còn
      NÓI ĐƯỢC TÊN mình (qua `title`) khi nhãn chữ bị dải hẹp cắt đi.
   2. MỌI mục nav phải có icon. Đếm lại từ `NAV_ITEMS`, không ghim số: thêm mục nav thứ 14 mà quên
      icon thì test này phải đỏ, chứ không phải chờ tới lúc ai đó thu gọn sidebar mới thấy ô trống. */

describe("Icon điều hướng — mọi mục nav đều có, không mục nào rơi", () => {
  it("navIcon dựng được icon cho TỪNG mục trong NAV_ITEMS", () => {
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
    for (const n of NAV_ITEMS) expect(() => navIcon(n.r)).not.toThrow();
  });

  it("NÉM khi route không có icon — không trả về một icon rỗng", () => {
    expect(() => navIcon("khong-co-route-nay")).toThrow(/khong-co-route-nay/);
  });

  it("icon dùng currentColor để ăn theo màu mục đang mở, không ghim màu riêng", () => {
    const { container } = render(<>{navIcon(NAV_ITEMS[0].r)}</>);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("fill")).toBe("none");
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});

/* 26/08 (owner "tại sao vẫn chưa bấm được vào các tab còn lại") — ĐẢO luật 17/08: mọi mục nav đều
   bấm được, vì mọi màn nay đã dựng thật (placeholder cuối cùng #/issue/:id xong 25/08). Vẫn đếm lại
   từ `MVP_ROUTES`/`NAV_ITEMS` chứ không ghim tên màn: thu hẹp lại về sau thì test đi theo. */
describe("Sidebar — mọi màn đều bấm được", () => {
  it("mỗi mục nav là MỘT link, đúng bằng tập màn khai bấm được", () => {
    render(<App />);
    const side = screen.getByTestId("sidebar");
    const hrefs = within(side)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs.sort()).toEqual(MVP_ITEMS.map((n) => `#/${n.r}`).sort());
    for (const n of OFF_ITEMS) expect(hrefs).not.toContain(`#/${n.r}`);
  });

  /* Tiền đề của cả describe này: KHÔNG còn mục nào bị làm mờ. Không có dòng này thì mọi vòng lặp
     trên OFF_ITEMS bên dưới xanh rỗng — test không còn canh gì. */
  it("không còn mục nào bị làm mờ: mọi mục trong NAV_ITEMS đều dẫn tới màn của nó", () => {
    render(<App />);
    const side = screen.getByTestId("sidebar");
    expect(OFF_ITEMS).toHaveLength(0);
    expect(within(side).queryAllByTestId(/^nav-off-/)).toHaveLength(0);
    for (const n of NAV_ITEMS) {
      expect(within(side).getByText(n.l).closest("a")?.getAttribute("href")).toBe(`#/${n.r}`);
    }
  });

  /* Cơ chế làm mờ GIỮ trong App.tsx để còn thu hẹp lại được — nhưng đã mờ thì phải khai
     aria-disabled, không để trình đọc màn hình đọc thành mục bình thường. */
  it("mục nào bị làm mờ (nếu có) đều khai aria-disabled", () => {
    render(<App />);
    const side = screen.getByTestId("sidebar");
    for (const n of OFF_ITEMS) {
      expect(within(side).getByTestId(`nav-off-${n.r}`)).toHaveAttribute("aria-disabled", "true");
    }
  });

  /* Nút bản giới thiệu vẫn TẮT bằng cờ `TOUR_ENABLED` (nav.tsx). Lý do gốc 17/08 — 7 chặng của
     `seedTour` nằm trên những màn đang mờ — đã hết từ 26/08; bật lại là một quyết định riêng của
     owner nên cờ giữ nguyên cho tới khi có chốt. Canh `disabled` THẬT: chỉ làm mờ bằng class thì
     chuột vẫn bấm được và bàn phím vẫn tab tới. */
  it("nút bản giới thiệu bị TẮT ở cả hai trạng thái sidebar, không chỉ mờ", () => {
    render(<App />);
    for (const collapsed of [false, true]) {
      if (collapsed) fireEvent.click(screen.getByTestId("sidebar-toggle"));
      expect(screen.getByTestId("tour-start")).toBeDisabled();
    }
  });

  it("bấm nút bản giới thiệu KHÔNG mở được tour", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("tour-start"));
    expect(screen.queryByTestId("tour-pop")).not.toBeInTheDocument();
  });

  /* Luật giữ nguyên qua cả hai đời: màn chủ phải nằm trong tập màn bấm được — 17/08 nó buộc `cxm`
     nhường chỗ cho `signals`, 26/08 mở lại thì `cxm` về đúng chỗ mà test không phải sửa. */
  it("mở app ở '/' ⇒ rơi vào một màn bấm được", () => {
    window.location.hash = "#/";
    render(<App />);
    expect(MVP_ITEMS.some((n) => window.location.hash === `#/${n.r}`)).toBe(true);
  });
});

describe("Sidebar thu gọn — hẹp lại nhưng không mất đường đi", () => {
  it("mặc định MỞ RỘNG: nhãn chữ của mọi mục nav đều đang hiện", () => {
    render(<App />);
    const side = screen.getByTestId("sidebar");
    expect(side).toHaveAttribute("data-collapsed", "false");
    for (const n of NAV_ITEMS) expect(within(side).getByText(n.l)).toBeInTheDocument();
  });

  it("bấm thu gọn ⇒ nhãn chữ rời màn nhưng MỌI mục vẫn còn link bấm được", () => {
    render(<App />);
    const side = screen.getByTestId("sidebar");
    const linksBefore = within(side).getAllByRole("link").length;

    fireEvent.click(screen.getByTestId("sidebar-toggle"));

    expect(side).toHaveAttribute("data-collapsed", "true");
    /* Luật của THU GỌN: nó không được đổi tập màn đi tới được. Số link trước = sau. Tập đó bằng
       `MVP_ROUTES` là luật của MVP nhỏ, canh riêng ở describe dưới — trộn hai luật vào một phép so
       thì sau này bật lại một màn sẽ không biết test đỏ vì luật nào. */
    expect(within(side).getAllByRole("link").length).toBe(linksBefore);
    for (const n of NAV_ITEMS) expect(within(side).queryByText(n.l)).not.toBeInTheDocument();
  });

  it("thu gọn ⇒ mỗi mục còn nói được TÊN mình qua title, không thành ô trống", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("sidebar-toggle"));
    const side = screen.getByTestId("sidebar");
    for (const n of MVP_ITEMS) {
      expect(within(side).getByTitle(n.l).getAttribute("href")).toBe(`#/${n.r}`);
    }
    /* Mục ngoài MVP cũng phải nói được tên mình — mờ không có nghĩa là thành ô trống vô danh. */
    for (const n of OFF_ITEMS) {
      expect(within(side).getByTestId(`nav-off-${n.r}`).getAttribute("title")).toContain(n.l);
    }
  });

  it("bấm lại ⇒ trả về đúng trạng thái mở rộng ban đầu", () => {
    render(<App />);
    const toggle = screen.getByTestId("sidebar-toggle");
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    const side = screen.getByTestId("sidebar");
    expect(side).toHaveAttribute("data-collapsed", "false");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const n of NAV_ITEMS) expect(within(side).getByText(n.l)).toBeInTheDocument();
  });

  it("nút chạy bản giới thiệu còn nguyên ở cả hai trạng thái", () => {
    render(<App />);
    expect(screen.getByTestId("tour-start")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("sidebar-toggle"));
    expect(screen.getByTestId("tour-start")).toBeInTheDocument();
  });

  /* Owner chốt 13/08: nút thu gọn nằm CUỐI dải, không nằm cạnh logo. Canh bằng thứ tự trong DOM chứ
     không bằng class hay px — thứ owner yêu cầu là "dưới mọi mục nav", và đó là quan hệ đo được. */
  it("nút thu gọn nằm SAU mọi mục nav trong DOM, không ở khối logo", () => {
    render(<App />);
    const side = screen.getByTestId("sidebar");
    const toggle = screen.getByTestId("sidebar-toggle");
    for (const link of within(side).getAllByRole("link")) {
      expect(link.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  /* Icon "?" trong vòng tròn thay ký tự ▶ (owner chốt 13/08). Canh là icon VẼ chứ không phải ký tự
     mượn từ font, ở CẢ HAI trạng thái — thu gọn là lúc icon phải tự đứng một mình. */
  it("nút bản giới thiệu mang icon vẽ, không mang ký tự ▶", () => {
    render(<App />);
    for (const collapsed of [false, true]) {
      if (collapsed) fireEvent.click(screen.getByTestId("sidebar-toggle"));
      const tour = screen.getByTestId("tour-start");
      const svg = tour.querySelector("svg")!;
      expect(svg).toBeTruthy();
      expect(svg.getAttribute("stroke")).toBe("currentColor");
      expect(svg.querySelector("circle")).toBeTruthy();
      expect(tour.textContent).not.toContain("▶");
    }
  });
});
