import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seed } from "../data/fixtures/seed.ts";
import { AnomalyLanes } from "./AnomalyLanes.tsx";

/* Suy lại từ seed thật: 7 finding tổng (AF-01..AF-07).
   voice = 3 (AF-04, AF-05, AF-07) · behaviour = 1 (AF-03) · pipeline = 2 (AF-01, AF-02) · null = 1 (AF-06).
   3 làn cộng lại (6) + null (1) = 7 = tổng finding. */
describe("AnomalyLanes", () => {
  it("số finding mỗi làn khớp agents.flatMap(g=>g.f).filter(f=>f.lane===k)", () => {
    render(<AnomalyLanes agents={seed.ag} />);
    const all = seed.ag.flatMap((g) => g.f);
    const voice = all.filter((f) => f.lane === "voice");
    const behaviour = all.filter((f) => f.lane === "behaviour");
    const pipeline = all.filter((f) => f.lane === "pipeline");
    const none = all.filter((f) => f.lane === null);

    expect(voice).toHaveLength(3);
    expect(behaviour).toHaveLength(1);
    expect(pipeline).toHaveLength(2);
    expect(none).toHaveLength(1);
    expect(voice.length + behaviour.length + pipeline.length + none.length).toBe(all.length);

    expect(within(screen.getByTestId("lane-voice")).getAllByTestId("note")).toHaveLength(voice.length);
    expect(within(screen.getByTestId("lane-behaviour")).getAllByTestId("note")).toHaveLength(behaviour.length);
    expect(within(screen.getByTestId("lane-pipeline")).getAllByTestId("note")).toHaveLength(pipeline.length);
  });

  it("finding có chữ 'Volume' trong tiêu đề (AF-03) KHÔNG bị xếp vào làn voice — đây là bug regex mà comment gốc cảnh báo", () => {
    render(<AnomalyLanes agents={seed.ag} />);
    const af03 = seed.ag.flatMap((g) => g.f).find((f) => f.id === "AF-03");
    expect(af03?.title).toMatch(/volume/i);
    expect(af03?.lane).toBe("behaviour");

    const behaviourLane = screen.getByTestId("lane-behaviour");
    const voiceLane = screen.getByTestId("lane-voice");
    expect(within(behaviourLane).getByText(af03!.title)).toBeInTheDocument();
    expect(within(voiceLane).queryByText(af03!.title)).not.toBeInTheDocument();
  });

  it("hiện dòng 'N mục không phải bất thường' cho finding lane===null (luật 11/08: đã bỏ link #/agents)", () => {
    render(<AnomalyLanes agents={seed.ag} />);
    expect(screen.getByText(/1 mục không phải bất thường/)).toBeInTheDocument();
    expect(screen.queryByText("Agent & cảnh báo")).not.toBeInTheDocument();
  });

  it("làn rỗng hiện 'Không có cảnh báo trong làn này.', không hiện dòng 'mục không phải bất thường' khi không có finding nào", () => {
    render(<AnomalyLanes agents={[]} />);
    const messages = screen.getAllByText("Không có cảnh báo trong làn này.");
    expect(messages).toHaveLength(3);
    expect(screen.queryByText(/mục không phải bất thường/)).not.toBeInTheDocument();
    expect(screen.queryByText("Agent & cảnh báo")).not.toBeInTheDocument();
  });
});
