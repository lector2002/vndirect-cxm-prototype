import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../App.tsx";
import { seed, seedTour } from "../../data/fixtures/seed.ts";
import { flowStepsCopied } from "../../domain/index.ts";
import { splitTour } from "./tourStops.ts";

/* Chạy tour THẬT trong DOM qua <App/>: đây là chỗ duy nhất chứng được rằng mỗi chặng đi được có mốc
   `data-tour` thật trên màn của nó. `tourStops.test.ts` chỉ kiểm được dạng chuỗi selector.

   jsdom không có layout nên `getBoundingClientRect()` trả toàn số 0 — vị trí popover KHÔNG kiểm ở
   đây (đã xem bằng mắt trên trình duyệt). Cái kiểm được, và là cái đáng kiểm: đi đúng route, tìm
   thấy đúng mốc, và nói đúng chữ khi không tìm thấy. */

const { walk, held } = splitTour(seedTour);

/** Số thứ tự chặng (1-based) của một mốc — tra từ dữ liệu để không ghim số tay. */
function stopNo(anchor: string): number {
  const n = walk.findIndex((s) => s.sel === `[data-tour="${anchor}"]`) + 1;
  if (n === 0) throw new Error(`Không còn chặng nào trỏ vào mốc "${anchor}"`);
  return n;
}
const inspectorStop = stopNo("atlas-inspector");
const spineStop = stopNo("atlas-spine");

/* Flow chưa vào pilot (chưa khai bước), cùng phase mặc định nên bấm được ngay — cùng cách chọn với
   AtlasPage.test.tsx:20 để hai file không mô tả hai thứ khác nhau. */
const pilotFlow = seed.flows.find((f) => flowStepsCopied(f, seed.steps))!;
const pilotPhaseId = seed.groups.find((g) => g.id === pilotFlow.groupId)!.phaseId;
const noStepFlow = seed.flows.find(
  (f) => f.id !== pilotFlow.id && seed.groups.find((g) => g.id === f.groupId)?.phaseId === pilotPhaseId,
)!;

// HashRouter đọc hash lúc mount; một test đổi hash thì test sau phải mở lại từ màn mặc định.
beforeEach(() => {
  window.location.hash = "#/";
});

/** Mở tour và đợi chặng đầu lên. */
async function startTour() {
  render(<App />);
  fireEvent.click(screen.getByTestId("tour-start"));
  await screen.findByTestId("tour-pop");
}

/** Bấm "Tiếp" cho tới chặng thứ `n` (1-based). */
async function goToStop(n: number) {
  for (let k = 1; k < n; k++) {
    fireEvent.click(screen.getByTestId("tour-next"));
    await waitFor(() => {
      expect(screen.getByTestId("tour-pop")).toHaveTextContent(`BƯỚC ${k + 1}/${walk.length}`);
    });
  }
}

describe("TourOverlay — bản giới thiệu có dẫn", () => {
  it("mở từ nút ở sidebar, vào chặng 1 và tô sáng đúng mốc", async () => {
    await startTour();
    const pop = screen.getByTestId("tour-pop");
    expect(pop).toHaveTextContent(`BƯỚC 1/${walk.length} · ${walk[0].grp}`);
    expect(pop).toHaveTextContent(walk[0].t);
    await waitFor(() => expect(screen.getByTestId("tour-hole")).toBeInTheDocument());
    // Chặng đầu là #/cxm — mốc của nó phải có thật trên màn.
    expect(document.querySelector(walk[0].sel)).not.toBeNull();
  });

  /* Phép kiểm ĐẮT nhất của file: đi hết mọi chặng và đòi mỗi chặng phải có mốc thật. Nếu ai đó đổi
     tên một `data-tour` mà quên `seedTour` (hoặc ngược lại), đây là chỗ đỏ. */
  it("đi hết mọi chặng, mỗi chặng tìm thấy mốc thật của nó — trừ đúng hai ca đã biết", async () => {
    await startTour();
    const missing: string[] = [];
    for (let n = 1; n <= walk.length; n++) {
      if (n > 1) {
        fireEvent.click(screen.getByTestId("tour-next"));
        await waitFor(() => {
          expect(screen.getByTestId("tour-pop")).toHaveTextContent(`BƯỚC ${n}/${walk.length}`);
        });
      }
      const sel = walk[n - 1].sel;
      // Đợi màn của chặng render xong rồi mới soi mốc.
      await waitFor(() => expect(screen.getByTestId("tour-pop")).toBeInTheDocument());
      if (!document.querySelector(sel)) missing.push(sel);
    }
    /* Đúng HAI mốc được phép vắng, và cả hai vắng vì CÙNG MỘT chủ ý: hồ sơ chi tiết chỉ hiện sau
       khi người dùng bấm chọn, mà không màn nào tự chọn hộ để tour có cái tô sáng (rule 4 ở #/atlas,
       và cùng luật đó ở #/sources). Ghim đích danh — vắng thêm chỗ nào là lỗi. */
    expect(missing.sort()).toEqual(['[data-tour="atlas-inspector"]', '[data-tour="src-profile"]']);
  });

  it("chặng không tô sáng được thì NÓI RA, không lặng lẽ đưa popover ra giữa màn", async () => {
    await startTour();
    await goToStop(inspectorStop);
    await waitFor(() => {
      expect(screen.getByTestId("tour-noanchor")).toHaveTextContent(/chỉ hiện sau khi đã chọn một bước/i);
    });
    expect(screen.queryByTestId("tour-hole")).not.toBeInTheDocument();
  });

  /* Lời dẫn của chặng này MỜI người ta chọn một bước. Nếu nền tối vừa che vừa đóng tour khi bị bấm
     thì lời mời đó bấm vào đâu cũng chỉ làm tour tắt — màn bảo làm một việc mà chính nó chặn. Chọn
     hướng của prototype: nền nuốt click, câu chữ nói rõ phải thoát ra trước. Hai lối ra còn nguyên,
     đã có test riêng ở dưới. */
  it("bấm vào nền tối KHÔNG đóng tour — kể cả ở chặng đang mời người dùng thao tác", async () => {
    await startTour();
    fireEvent.click(screen.getByTestId("tour-mask"));
    expect(screen.getByTestId("tour-pop")).toBeInTheDocument();

    await goToStop(inspectorStop);
    await waitFor(() => {
      expect(screen.getByTestId("tour-noanchor")).toHaveTextContent(/chưa có gì để tô sáng/i);
    });
    fireEvent.click(screen.getByTestId("tour-mask"));
    expect(screen.getByTestId("tour-pop")).toBeInTheDocument();
  });

  /* Câu ở nhánh vắng mốc chỉ MÔ TẢ, không bảo "thoát ra, chọn một bước rồi mở lại" — vì làm đúng
     như thế cũng không ra kết quả: mở lại là tour bắt đầu từ #/cxm, rời khỏi #/atlas rồi quay lại,
     AtlasPage remount, bước vừa chọn mất. Test này ghim chính đường đi đó, để không ai thấy câu chữ
     "hơi cụt" mà viết lại thành lời khuyên nghe hữu ích nhưng làm không được. */
  it("thoát tour → chọn một bước → mở lại VẪN vắng mốc hồ sơ bước, nên câu chữ không hứa điều đó", async () => {
    await startTour();
    await goToStop(inspectorStop);
    fireEvent.click(screen.getByTestId("tour-exit"));
    await waitFor(() => expect(screen.queryByTestId("tour-pop")).not.toBeInTheDocument());

    fireEvent.click(screen.getAllByTestId(/^spine-step-/)[0]);
    expect(screen.getByTestId("atlas-inspector")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tour-start"));
    await screen.findByTestId("tour-pop");
    await goToStop(inspectorStop);
    await waitFor(() => expect(screen.getByTestId("tour-noanchor")).toBeInTheDocument());
  });

  /* Mốc `atlas-spine` chỉ có khi flow đang mở có bước, mà flow là state cục bộ của AtlasPage — nên
     câu hỏi đáng lo: người dùng mở sẵn một flow ngoài pilot rồi bấm chạy tour thì chặng xương sống
     có rơi vào nhánh vắng mốc không? Không, và lý do là cấu trúc chứ không phải may: ba chặng atlas
     đứng sau ba chặng #/cxm nên tour luôn rời màn rồi quay lại, AtlasPage remount, flow về mặc định.
     Ghim lại ở đây vì nếu ai đó xếp một chặng atlas lên đầu thì chỗ này phải đỏ trước khi lên demo. */
  it("mở sẵn flow ngoài pilot rồi chạy tour: chặng xương sống vẫn tô sáng được (màn remount)", async () => {
    window.location.hash = "#/atlas";
    render(<App />);
    fireEvent.click(await screen.findByTestId(`atlas-flow-${noStepFlow.id}`));
    expect(screen.queryByTestId("journey-spine")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tour-start"));
    await screen.findByTestId("tour-pop");
    await goToStop(spineStop);
    await waitFor(() => expect(document.querySelector(walk[spineStop - 1].sel)).not.toBeNull());
    expect(screen.queryByTestId("tour-noanchor")).not.toBeInTheDocument();
  });

  it("chặng cuối nói thẳng còn bao nhiêu chặng chưa đi được, và nút đổi thành 'Xong'", async () => {
    await startTour();
    await goToStop(walk.length);
    expect(screen.getByTestId("tour-done")).toHaveTextContent("Xong");
    expect(screen.queryByTestId("tour-next")).not.toBeInTheDocument();
    const summary = screen.getByTestId("tour-held");
    expect(summary).toHaveTextContent(`còn ${held.length} chặng chưa đi được`);
    expect(summary).toHaveTextContent("3 chặng lời dẫn còn tả bố cục cũ");
  });

  it("chỉ hiện tóm tắt phần còn thiếu ở chặng CUỐI, không nhắc lại mỗi chặng", async () => {
    await startTour();
    expect(screen.queryByTestId("tour-held")).not.toBeInTheDocument();
    await goToStop(2);
    expect(screen.queryByTestId("tour-held")).not.toBeInTheDocument();
  });

  it("lùi được về chặng trước; chặng 1 không dựng nút Lùi", async () => {
    await startTour();
    expect(screen.queryByTestId("tour-prev")).not.toBeInTheDocument();
    await goToStop(2);
    fireEvent.click(screen.getByTestId("tour-prev"));
    await waitFor(() => {
      expect(screen.getByTestId("tour-pop")).toHaveTextContent(`BƯỚC 1/${walk.length}`);
    });
  });

  it("Esc và nút Thoát đều đóng tour", async () => {
    await startTour();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByTestId("tour-pop")).not.toBeInTheDocument());

    fireEvent.click(screen.getByTestId("tour-start"));
    await screen.findByTestId("tour-pop");
    fireEvent.click(screen.getByTestId("tour-exit"));
    await waitFor(() => expect(screen.queryByTestId("tour-pop")).not.toBeInTheDocument());
  });
});
