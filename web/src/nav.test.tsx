import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NAV_GROUPS, NAV_ITEMS, PageTitle, navLabel } from "./nav.tsx";

/* Owner 06/08: đầu mỗi màn chỉ còn ĐÚNG tên tab. Nguy cơ của luật đó không nằm ở chỗ quên tiêu đề
   — quên thì nhìn là thấy — mà ở chỗ tiêu đề GÕ TAY rồi trôi khỏi nhãn sidebar, khiến người dùng
   bấm "Bảng xử lý" mà mở ra màn tự xưng tên khác. Nhóm test này canh đúng cái đó. */

describe("navLabel — nhãn tab chỉ có một nguồn", () => {
  it("trả đúng nhãn đang hiện trong sidebar cho mọi mục nav", () => {
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
    for (const n of NAV_ITEMS) expect(navLabel(n.r)).toBe(n.l);
  });

  /* Route lạ mà vẫn ra được một cái tên là cách một màn lọt vào app không qua điều hướng. Ném to
     hơn hẳn trả chuỗi rỗng: chuỗi rỗng chỉ hiện thành một dòng trắng, chẳng ai để ý. */
  it("NÉM khi route không có trong nav, không trả chuỗi rỗng", () => {
    expect(() => navLabel("khong-co-route-nay")).toThrow(/khong-co-route-nay/);
  });

  it("không route nào bị khai hai lần — hai mục cùng route thì nhãn nào thắng là tuỳ thứ tự mảng", () => {
    const routes = NAV_ITEMS.map((n) => n.r);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("không mục nào thiếu nhãn hoặc để nhãn rỗng", () => {
    for (const n of NAV_ITEMS) expect(n.l.trim().length).toBeGreaterThan(0);
  });

  it("NAV_ITEMS đúng bằng các mục của NAV_GROUPS, không rơi nhóm nào", () => {
    const fromGroups = NAV_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
    expect(NAV_ITEMS).toHaveLength(fromGroups);
  });
});

describe("PageTitle — tiêu đề đầu màn", () => {
  it("in đúng nhãn tab của route được truyền", () => {
    render(<PageTitle route="work" />);
    expect(screen.getByTestId("page-title")).toHaveTextContent(navLabel("work"));
  });

  /* Phải là <h1>: đây là tên của cả màn, và người dùng screen reader nhảy theo heading. */
  it("dựng thành <h1>, không phải một div nhìn giống tiêu đề", () => {
    const { container } = render(<PageTitle route="topics" />);
    expect(container.querySelector("h1")).toHaveTextContent(navLabel("topics"));
  });

  it("mỗi route ra một tên khác nhau, không dính cứng vào một chuỗi", () => {
    const { container: a } = render(<PageTitle route="cxm" />);
    const { container: b } = render(<PageTitle route="voc" />);
    expect(a.textContent).not.toBe(b.textContent);
  });
});
