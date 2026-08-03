import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../data/fixtures/seed.ts";
import type { QuantifySeriesPoint } from "../data/schema/index.ts";
import { isAnomaly, zScores } from "../domain/stats.ts";
import { AnomalyChart } from "./AnomalyChart.tsx";

function findSeries(id: string): QuantifySeriesPoint[] {
  const q = seed.qt.find((x) => x.id === id);
  if (!q || q.kind !== "series") throw new Error(`fixture ${id} phải là QuantifySeries`);
  return q.t;
}

describe("AnomalyChart", () => {
  const series = findSeries("q15");

  /* GOLDEN CỨNG — bắt buộc phải có. Test "khớp zScores/isAnomaly" ngay dưới tự tính kỳ vọng bằng
     CHÍNH hai hàm nó kiểm, nên nó xanh với mọi con số (19, 74, 4…) và không bao giờ bắt được lỗi
     "chart khoanh gần như mọi điểm". Test này neo số thật để suite có khả năng ĐỎ: q15 ở
     cfgDefault (z=2,5, cửa sổ i>=3) phải đúng 4 vòng tròn — 402, 908 ở dòng 1 và 205, 97 ở dòng 2. */
  it("GOLDEN: q15 ở cfgDefault (z=2,5, i>=3) → đúng 4 vòng tròn", () => {
    render(<AnomalyChart series={series} anomalyZ={cfgDefault.anomaly.z} />);
    expect(screen.getAllByTestId("anomaly-ring")).toHaveLength(4);
  });

  it("anomalyZ=cfgDefault.anomaly.z (2.5) → số vòng tròn khớp đúng số điểm isAnomaly=true (tính độc lập từ zScores/isAnomaly)", () => {
    const expectedRings = series.reduce(
      (sum, s) => sum + zScores(s.p).filter((z) => isAnomaly(z, cfgDefault.anomaly.z)).length,
      0,
    );
    // Guard non-vacuous: nếu seed đổi khiến q15 không còn điểm bất thường nào ở z=2.5, test bên dưới
    // sẽ vô nghĩa (0 ring khớp 0) — chặn bằng khẳng định rõ ràng thay vì để lỗi getAllByTestId mơ hồ.
    expect(expectedRings).toBeGreaterThan(0);
    render(<AnomalyChart series={series} anomalyZ={cfgDefault.anomaly.z} />);
    expect(screen.getByTestId("anomaly-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("anomaly-ring")).toHaveLength(expectedRings);
  });

  it("anomalyZ rất cao (99) → không chuỗi nào vượt ngưỡng, 0 vòng tròn", () => {
    render(<AnomalyChart series={series} anomalyZ={99} />);
    expect(screen.queryAllByTestId("anomaly-ring")).toHaveLength(0);
  });
});
