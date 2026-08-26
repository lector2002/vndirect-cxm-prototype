import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { SrcMatrixBlock } from "./SrcMatrixBlock.tsx";

/* 07/08 (module-i-signal-registry-charter.md I3): số suy từ seed qua sourceHealth(), giờ so
   `Source.last` với `seed.asOf` ("27/07/2026"), theo NGÀY — không còn so `lagH` với SLA riêng tính
   bằng giờ. 11/08 (owner, giải C5): `cfg.source[id]` được đọc lại làm NHỊP GIAO tính bằng NGÀY; hai
   nguồn khai nhịp 1 ngày (store, broker) đều đang thiếu 0 ngày nên bảy nhãn dưới đây không đổi.
   src-ga/ekyc/case/store/broker: last = 27/07 → thiếu 0 ngày → ok. src-survey:
   last = 26/07 → thiếu 1 ngày, vol=612>0 → stale. src-zalo: last = 19/07 → thiếu 8 ngày ≥
   deadDays 2 → down. → CÙNG kết luận như cách chấm cũ: 2 nguồn có vấn đề — "In-app survey
   (CES/CSAT/NPS)" (stale) và "Zalo OA inbox" (down). Metric bị ảnh hưởng: src-survey→['m-ces'],
   src-zalo→['m-repeat'] → hợp nhất (Set) = 2 metric duy nhất (m-ces, m-repeat). */
describe("SrcMatrixBlock", () => {
  /* 25/08 (owner, quét AI-slop) — ĐẢO kỳ vọng cũ: khối luôn vẽ ĐỦ mọi nguồn nên dải "Đang hiện
     Top N trên N nguồn" chỉ nói lại chính cái bảng — bỏ hẳn, cùng luật với subtitle "Ảnh chụp"
     (GlobalToolbar cầm timeframe). */
  it("KHÔNG còn dải 'Đang hiện Top…' lẫn subtitle 'Ảnh chụp' — bảng luôn đủ mọi nguồn", () => {
    render(<SrcMatrixBlock data={seed} cfg={cfgDefault} />);
    expect(screen.queryByText(/Đang hiện Top/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ảnh chụp/)).not.toBeInTheDocument();
  });

  it("render bảng SrcMatrix compact (không cột metric)", () => {
    render(<SrcMatrixBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByTestId("src-matrix")).toBeInTheDocument();
    expect(screen.queryByText("Nguồn này sai thì metric nào sai")).not.toBeInTheDocument();
  });

  /* 26/08 (owner "mở thêm nút bấm"): nối lại link hồ sơ nguồn của prototype (dòng 2128). */
  it("có onGo: link 'Xem hồ sơ từng nguồn' gọi onGo('sources'); không onGo thì không render", () => {
    const onGo = vi.fn();
    render(<SrcMatrixBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getByTestId("src-go-sources"));
    expect(onGo).toHaveBeenCalledWith("sources");
  });
});
