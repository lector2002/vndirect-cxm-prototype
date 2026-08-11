import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CxmData } from "../../data/schema/index.ts";
import { demoData } from "../../data/fixtures/demo.ts";
import {
  brokenImpacts,
  evidenceOfSource,
  freshnessCount,
  instrumentedCount,
  metricsAtRisk,
  sourceHealth,
  sourcesByProblem,
  unhealthySources,
} from "../../domain/index.ts";
import { nf } from "../../design-system/format.ts";
import { navLabel } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { SourcesPage } from "./SourcesPage.tsx";

/* Màn đọc store singleton thật, mà singleton là `demoData` (store/store.ts:176) — KHÔNG phải `seed`.
   Mọi kỳ vọng ở đây SUY từ `demoData` qua chính các hàm domain, không chép số bằng tay.

   Hai chỗ canh kỹ nhất, cả hai đều là loại lỗi "màn nói sai về chính nó":
   · Ba ô đếm toàn vẹn phải mang ba đơn vị. Hai ô đếm NGUỒN (7), một ô đếm ĐIỂM ĐO (30) — cùng hiện
     dạng "N/M" mà không nói đơn vị thì người đọc cộng ba con số khác thước.
   · Câu cảnh báo cuối màn phải SINH TỪ DỮ LIỆU và không phán chiều lệch của chỉ số. */

const cfg0 = useCxmStore.getState().cfg;

/* 07/08 (module-i-signal-registry-charter.md I3 Việc 1): `sourceHealth()` không còn đọc
   `cfg.source[id]`, và "thiếu ≥ 1 ngày, có giao ⇒ đang trễ" là NGƯỠNG CỐ ĐỊNH — không cfg hoá được
   qua `deadDays` (nới `deadDays` chỉ nâng mốc "chết", không xoá được mốc "đang trễ"). Ca "không
   nguồn nào hỏng" giờ dựng bằng cách đưa `Source.last` của mọi nguồn về đúng `asOf`.

   Store singleton clone `demoData` vào `MockRepository` lúc dựng (`structuredClone(fixture)`) — sửa
   `demoData.sources` trực tiếp KHÔNG chạm gì tới cái màn đang render. `repo.data` là field TypeScript
   `private`, không có seam công khai để ghi — cast bên dưới là cách DUY NHẤT dựng được ca này qua
   đúng dữ liệu store đang phục vụ màn, không phải việc thêm seam mới (ngoài phạm vi lát I3: chỉ đọc
   domain/sources.ts, không dựng lại màn #/sources). `setCfg({})` (patch rỗng) là đường CÔNG KHAI duy
   nhất buộc store refresh() lại `data` sau khi mutate trực tiếp. */
function repoData(): CxmData {
  return (useCxmStore.getState().repo as unknown as { data: CxmData }).data;
}
const originalLast = repoData().sources.map((s) => s.last);

function makeEveryoneHealthy() {
  const today = `${demoData.asOf.slice(0, 5)} · 00:00`;
  for (const s of repoData().sources) s.last = today;
  useCxmStore.getState().setCfg({});
}

afterEach(() => {
  useCxmStore.getState().setCfg({ source: cfg0.source, data: cfg0.data });
  repoData().sources.forEach((s, i) => {
    s.last = originalLast[i]!;
  });
  useCxmStore.getState().setCfg({});
});

const cfg = () => useCxmStore.getState().cfg;

/* Câu mở đầu ở đầu màn ĐÃ BỎ (owner 06/08 — cùng chỉ thị đã áp cho Bản đồ hành trình). Nó từng nói
   "N trong 7 nguồn đang có vấn đề, và M chỉ số đang ăn dữ liệu từ chúng". Cả hai vế đó vẫn phải
   chứng minh được, chỉ là ở chỗ khác: khối "Hệ quả cụ thể" cuối màn nêu ĐÍCH DANH từng nguồn hỏng
   và từng chỉ số nó kéo theo. Ba test dưới đây chuyển sang canh đúng chỗ ấy — không xoá đi, vì bỏ
   một câu chữ không có nghĩa là bỏ nghĩa vụ nói thật của màn. */
describe("SourcesPage — khối hệ quả nói đúng thứ dữ liệu chứng minh được", () => {
  it("nêu đích danh từng nguồn hỏng và từng chỉ số đang ăn dữ liệu từ chúng", () => {
    render(<SourcesPage />);
    const impacts = brokenImpacts(demoData, cfg());
    const atRisk = metricsAtRisk(demoData, cfg());
    expect(impacts.length).toBeGreaterThan(0);
    expect(atRisk.length).toBeGreaterThan(0);
    const impact = screen.getByTestId("src-impact");
    // Một dòng cho mỗi nguồn hỏng — không gộp thành một con số tổng.
    expect(within(impact).getAllByRole("listitem")).toHaveLength(impacts.length);
    for (const b of impacts) expect(impact).toHaveTextContent(b.source.name);
    for (const m of atRisk) expect(impact).toHaveTextContent(m.name);
  });

  /* Prototype viết "… và điều đó LÀM SAI N chỉ số". Nguồn hỏng làm chỉ số tính trên dữ liệu THIẾU;
     chiều lệch thì không suy được từ dữ liệu (công thức có thể hụt cả tử lẫn mẫu). */
  it("KHÔNG nói nguồn hỏng 'làm sai' chỉ số — dữ liệu không chứng minh được điều đó", () => {
    render(<SourcesPage />);
    const impact = screen.getByTestId("src-impact");
    expect(impact).not.toHaveTextContent("làm sai");
    expect(impact).toHaveTextContent("không nói được");
  });

  it("đầu màn chỉ có tên tab, không còn câu mở đầu", () => {
    const { container } = render(<SourcesPage />);
    expect(screen.queryByTestId("src-hero")).not.toBeInTheDocument();
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(navLabel("sources"));
  });

  it("không nguồn nào hỏng thì khối hệ quả biến mất hẳn, không in khung rỗng", () => {
    makeEveryoneHealthy();
    render(<SourcesPage />);
    // Oracle phải đọc data ĐANG RENDER (repoData(), đã mutate qua makeEveryoneHealthy), không phải
    // `demoData` gốc — 07/08: sức khoẻ nguồn không cfg hoá được nữa nên `demoData` giữ nguyên 2
    // nguồn hỏng suốt bài test này (xem docblock `makeEveryoneHealthy`).
    expect(brokenImpacts(repoData(), cfg())).toHaveLength(0);
    expect(screen.queryByTestId("src-impact")).not.toBeInTheDocument();
  });
});

describe("SourcesPage — ba phép đếm, ba đơn vị", () => {
  it("mỗi ô in kèm đơn vị của chính nó, không để trần 'N/M'", () => {
    render(<SourcesPage />);
    const strip = screen.getByTestId("src-stats");
    const fresh = freshnessCount(demoData, cfg());
    const instr = instrumentedCount(demoData);
    expect(strip).toHaveTextContent(`${fresh.n}/${fresh.of} nguồn`);
    expect(strip).toHaveTextContent(`${instr.n}/${instr.of} điểm đo`);
  });

  /* Nếu hai mẫu số bằng nhau thì test trên vẫn xanh mà chẳng chứng minh gì — chốt luôn rằng chúng
     thật sự khác nhau trong bộ dữ liệu đang render. */
  it("mẫu số của ô độ phủ khác hẳn mẫu số của ô đếm nguồn", () => {
    expect(instrumentedCount(demoData).of).not.toBe(freshnessCount(demoData, cfg()).of);
  });

  it("nguồn đứt bị trừ ở ô tính liên tục chứ không bị trừ hai lần", () => {
    /* Tiền đề: demoData có đúng 2 nguồn hỏng, 1 đứt + 1 trễ. Đòi luôn tiền đề đó thay vì chỉ ghi
       trong comment — fixture đổi hình là dòng này đỏ, chứ không phải phép trừ vẫn đúng một cách
       vô nghĩa. */
    expect(unhealthySources(demoData, cfg())).toHaveLength(2);
    expect(
      unhealthySources(demoData, cfg()).filter((s) => sourceHealth(s, cfg(), demoData.asOf) === "down"),
    ).toHaveLength(1);
    // Nguồn đứt đã bị trừ ở ô tính liên tục, nên ô độ tươi chỉ được trừ đúng nguồn TRỄ.
    expect(freshnessCount(demoData, cfg()).n).toBe(demoData.sources.length - 1);
  });
});

describe("SourcesPage — bảng nguồn", () => {
  it("nguồn có vấn đề đứng dòng đầu", () => {
    render(<SourcesPage />);
    const first = sourcesByProblem(demoData, cfg())[0]!;
    const rows = screen.getByTestId("src-table").querySelectorAll("tbody tr");
    expect(rows[0]).toHaveAttribute("data-testid", `src-row-${first.id}`);
    expect(brokenImpacts(demoData, cfg()).some((b) => b.source.id === first.id)).toBe(true);
  });

  it("mới vào màn CHƯA mở hồ sơ nào; bấm một dòng mới mở, bấm lại thì đóng", () => {
    render(<SourcesPage />);
    const target = demoData.sources[0]!;
    expect(screen.queryByTestId("src-profile")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`src-row-${target.id}`));
    expect(screen.getByTestId("src-profile")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`src-row-${target.id}`));
    expect(screen.queryByTestId("src-profile")).not.toBeInTheDocument();
  });

  it("nút đóng trong hồ sơ cũng đóng được", () => {
    render(<SourcesPage />);
    fireEvent.click(screen.getByTestId(`src-row-${demoData.sources[0]!.id}`));
    fireEvent.click(screen.getByTestId("src-profile-close"));
    expect(screen.queryByTestId("src-profile")).not.toBeInTheDocument();
  });
});

describe("SourceProfile — hai mẫu số không được gộp", () => {
  /* luật 11/08 (Dạng C): bỏ câu đối chiếu "KHÔNG phải toàn bộ N bản ghi nguồn này khai" khỏi dải mẫu
     số — đó là một biến thể của câu "bằng chứng mẫu, không phải toàn bộ bản ghi" mà hợp đồng lượt 2
     liệt kê. Số volume vẫn hiện, chỉ dời sang đúng Stat "Volume trong kỳ" của nó — test canh lại ở
     đó thay vì đòi cả hai số nằm trong một câu. */
  it("dải mẫu số nói rõ đang đếm bằng chứng mẫu; volume nguồn khai đọc ở Stat riêng, không gộp vào cùng câu", () => {
    render(<SourcesPage />);
    const s = demoData.sources.find((x) => evidenceOfSource(demoData, x.id).length > 0)!;
    const evs = evidenceOfSource(demoData, s.id);
    expect(evs.length).toBeLessThan(s.vol);
    fireEvent.click(screen.getByTestId(`src-row-${s.id}`));
    const denom = screen.getByTestId("src-profile-denom");
    expect(denom).toHaveTextContent(`${nf(evs.length)} bằng chứng mẫu`);
    expect(denom).not.toHaveTextContent(nf(s.vol));
    const profile = screen.getByTestId("src-profile");
    const volStat = within(profile)
      .getAllByTestId("stat")
      .find((el) => el.textContent?.includes("Volume trong kỳ"));
    expect(volStat).toHaveTextContent(nf(s.vol));
  });

  it("nguồn không có bằng chứng mẫu nào thì nói là chưa có, không hiện chart rỗng", () => {
    render(<SourcesPage />);
    const empty = demoData.sources.find((x) => evidenceOfSource(demoData, x.id).length === 0);
    expect(empty).toBeDefined();
    fireEvent.click(screen.getByTestId(`src-row-${empty!.id}`));
    expect(screen.getByTestId("src-profile-denom")).toHaveTextContent("Chưa có bằng chứng mẫu nào");
    expect(screen.getByTestId("src-dist-intent")).toHaveTextContent("Không có bằng chứng mẫu nào");
  });

  it("nguồn hỏng: hồ sơ nêu chỉ số bị ảnh hưởng và chủ chỉ số, nhưng KHÔNG phán chiều lệch", () => {
    render(<SourcesPage />);
    const impact = brokenImpacts(demoData, cfg()).find((b) => b.metrics.length > 0)!;
    fireEvent.click(screen.getByTestId(`src-row-${impact.source.id}`));
    const box = screen.getByTestId("src-profile-impact");
    for (const m of impact.metrics) {
      expect(box).toHaveTextContent(m.name);
      expect(box).toHaveTextContent(m.owner);
    }
    /* Canh cụm PHỦ ĐỊNH đầy đủ, không canh riêng chữ "thấp hơn thực tế": chính câu đúng cũng chứa
       cụm đó ("không nói được con số đang cao hơn hay thấp hơn thực tế"). Thứ phải vắng là lời
       KHẲNG ĐỊNH chiều lệch mà prototype đóng cứng — "bị đếm thiếu". */
    expect(box).toHaveTextContent("không nói được con số đang cao hơn hay thấp hơn thực tế");
    expect(box).not.toHaveTextContent("bị đếm thiếu");
  });

  it("nguồn khoẻ thì không có khối cảnh báo nào", () => {
    makeEveryoneHealthy();
    render(<SourcesPage />);
    fireEvent.click(screen.getByTestId(`src-row-${demoData.sources[0]!.id}`));
    expect(screen.queryByTestId("src-profile-impact")).not.toBeInTheDocument();
  });
});

describe("SourcesPage — khối hệ quả sinh từ dữ liệu", () => {
  it("mỗi nguồn hỏng một dòng, nêu đúng tên nguồn và số ngày suy từ độ trễ", () => {
    render(<SourcesPage />);
    const box = screen.getByTestId("src-impact");
    for (const b of brokenImpacts(demoData, cfg())) {
      expect(box).toHaveTextContent(b.source.name);
      expect(box).toHaveTextContent(b.source.last);
      if (b.days >= 1) expect(box).toHaveTextContent(`${b.days} ngày`);
    }
  });

  it("không phán con số đang cao hơn hay thấp hơn thực tế", () => {
    render(<SourcesPage />);
    const box = screen.getByTestId("src-impact");
    /* Canh cụm PHỦ ĐỊNH đầy đủ, không canh riêng chữ "thấp hơn thực tế": chính câu đúng cũng chứa
       cụm đó ("không nói được con số đang cao hơn hay thấp hơn thực tế"). Thứ phải vắng là lời
       KHẲNG ĐỊNH chiều lệch mà prototype đóng cứng — "bị đếm thiếu". */
    expect(box).toHaveTextContent("không nói được con số đang cao hơn hay thấp hơn thực tế");
    expect(box).not.toHaveTextContent("bị đếm thiếu");
  });
});

describe("SourcesPage — tab nguồn chủ động", () => {
  it("nhãn tab đếm khảo sát đang chạy từ dữ liệu", () => {
    render(<SourcesPage />);
    const running = demoData.surveys.filter((s) => s.status === "running").length;
    expect(screen.getByTestId("src-tab-active")).toHaveTextContent(`${running}/${demoData.surveys.length}`);
  });

  it("khảo sát đang tạm dừng tự nêu tên mình, không đóng cứng chữ 'NPS'", () => {
    render(<SourcesPage />);
    fireEvent.click(screen.getByTestId("src-tab-active"));
    const paused = demoData.surveys.filter((s) => s.status === "paused");
    expect(paused.length).toBeGreaterThan(0);
    for (const s of paused) {
      expect(screen.getByTestId("src-survey-table")).toHaveTextContent(s.name);
      expect(screen.getByText(`${s.name} đang tạm dừng.`)).toBeInTheDocument();
    }
  });

  it("cooldown đọc từ cấu hình, không phải số gõ tay", () => {
    render(<SourcesPage />);
    fireEvent.click(screen.getByTestId("src-tab-active"));
    /* "14 ngày" xuất hiện nhiều chỗ — cột Cooldown của từng khảo sát cũng in số ngày. Chốt đúng ô
       ghi chú quy tắc toàn cục, không bắt chuỗi trần trên cả màn. */
    const rule = screen.getByText(/Quy tắc cooldown toàn cục/).closest('[data-testid="note"]');
    expect(rule).toHaveTextContent(`${cfg().data.cooldown} ngày`);
  });

  it("khảo sát đã dừng xếp lên đầu bảng", () => {
    render(<SourcesPage />);
    fireEvent.click(screen.getByTestId("src-tab-active"));
    const rows = screen.getByTestId("src-survey-table").querySelectorAll("tbody tr");
    const paused = demoData.surveys.find((s) => s.status === "paused")!;
    expect(rows[0]).toHaveAttribute("data-testid", `src-survey-${paused.id}`);
  });
});

describe("SourcesPage — chuyển tab", () => {
  it("tab ma trận hiện bảng nguồn × nền tảng, và bảng sức khoẻ biến mất", () => {
    render(<SourcesPage />);
    expect(screen.getByTestId("src-table")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("src-tab-matrix"));
    expect(screen.queryByTestId("src-table")).not.toBeInTheDocument();
    expect(screen.getByTestId("src-matrix")).toBeInTheDocument();
  });
});
