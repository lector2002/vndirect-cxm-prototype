import type { CxmData } from "../data/schema/index.ts";

/* Lookup/navigate search — KHÔNG phải bộ lọc. Gom các thực thể thật (feature, chủ đề phản hồi,
   điểm gãy, nguồn, nhóm khách, bước/flow hành trình) từ CxmData thành một danh sách phẳng để gõ-tìm
   rồi điều hướng tới route của thực thể đó. Thuần dữ liệu (không React) nên thuộc domain/. */
export type SearchKind = "feature" | "reason" | "issue" | "source" | "segment" | "journey";

export type SearchEntry = {
  id: string;
  label: string;
  kind: SearchKind;
  route: string;
  sub?: string;
};

/** Gấp dấu tiếng Việt về ASCII — xử lý đ/Đ riêng vì NFD KHÔNG tách được chúng (không phải ký tự
    có dấu ghép, mà là chữ cái riêng trong Unicode). */
function foldAccents(s: string): string {
  return s
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function slugify(s: string): string {
  return foldAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSearchIndex(data: CxmData): SearchEntry[] {
  const features: SearchEntry[] = data.tax
    .filter((node) => node.lv === "L2")
    .map((node): SearchEntry => ({ id: node.id, label: node.name, kind: "feature", route: `topic/${node.id}`, sub: "Tính năng (L2)" }));

  const reasonThemes: SearchEntry[] = data.tax
    .filter((node) => node.lv === "theme" || node.lv === "subtheme")
    .map((node): SearchEntry => ({ id: node.id, label: node.name, kind: "reason", route: `topic/${node.id}`, sub: "Chủ đề phản hồi" }));

  const reasonCats: SearchEntry[] = Object.entries(data.cats).map(
    ([key, cat]): SearchEntry => ({ id: `cat-${key}`, label: cat.label, kind: "reason", route: "voc", sub: "Nhóm intent" }),
  );

  const issues: SearchEntry[] = data.iss.map(
    (issue): SearchEntry => ({ id: issue.id, label: issue.title, kind: "issue", route: `issue/${issue.id}`, sub: "Điểm gãy" }),
  );

  const sources: SearchEntry[] = data.sources.map(
    (src): SearchEntry => ({ id: src.id, label: src.name, kind: "source", route: "sources", sub: "Nguồn" }),
  );

  const segLabels: string[] = [];
  for (const insight of data.ins) {
    for (const label of insight.seg) {
      if (!segLabels.includes(label)) segLabels.push(label);
    }
  }
  const segments: SearchEntry[] = segLabels.map(
    (label): SearchEntry => ({ id: `seg-${slugify(label)}`, label, kind: "segment", route: "voc", sub: "Nhóm khách" }),
  );

  const journeySteps: SearchEntry[] = data.steps.map(
    (step): SearchEntry => ({ id: step.id, label: `${step.code} ${step.name}`, kind: "journey", route: "atlas", sub: "Bước hành trình" }),
  );
  const journeyFlows: SearchEntry[] = data.flows.map(
    (flow): SearchEntry => ({ id: flow.id, label: flow.name, kind: "journey", route: "atlas", sub: "Flow" }),
  );

  return [...features, ...reasonThemes, ...reasonCats, ...issues, ...sources, ...segments, ...journeySteps, ...journeyFlows];
}

/** Substring case-insensitive + accent-insensitive trên (label + ' ' + sub). Rỗng/whitespace → [].
    Giữ nguyên thứ tự index (stable), không mutate `index`. */
export function queryIndex(index: SearchEntry[], q: string, limit = 8): SearchEntry[] {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const needle = foldAccents(trimmed).toLowerCase();
  const results: SearchEntry[] = [];
  for (const entry of index) {
    const haystack = foldAccents(`${entry.label} ${entry.sub ?? ""}`).toLowerCase();
    if (haystack.includes(needle)) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}
