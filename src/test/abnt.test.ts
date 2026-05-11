import { describe, expect, it } from "vitest";
import {
  buildReferenceIndex,
  computeStats,
  parseDocument,
  parseReference,
  renderInline,
  sortReferences,
} from "@/lib/abnt";

describe("parseDocument", () => {
  it("identifica seções por nível", () => {
    const blocks = parseDocument("# Um\n\n## Dois\n\n### Três");
    expect(blocks).toEqual([
      { type: "section", level: 1, text: "Um" },
      { type: "section", level: 2, text: "Dois" },
      { type: "section", level: 3, text: "Três" },
    ]);
  });

  it("reconhece citação longa, lista e legendas", () => {
    const raw = `> citação longa\n\n- a\n- b\n\n[fig] minha figura`;
    const blocks = parseDocument(raw);
    expect(blocks.map((b) => b.type)).toEqual([
      "quote",
      "list-item",
      "list-item",
      "caption-fig",
    ]);
  });

  it("trata listas ordenadas independentes", () => {
    const blocks = parseDocument("1. um\n2. dois");
    expect(blocks).toEqual([
      { type: "olist-item", text: "um" },
      { type: "olist-item", text: "dois" },
    ]);
  });
});

/**
 * Extrai recursivamente todos os textos plain de um TextRun do `docx`.
 */
function runText(r: unknown): string {
  const json = JSON.stringify(r);
  const m = json.matchAll(/"w:t"[^"]*"root":\s*\[[^\]]*?"([^"]+)"\s*\]/g);
  return Array.from(m, (x) => x[1]).join("");
}

function isBold(r: unknown): boolean {
  return JSON.stringify(r).includes('"w:b"');
}

describe("parseReference", () => {
  it("destaca título em negrito (NBR 6023:2025)", () => {
    const runs = parseReference(
      "ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 6023. Rio de Janeiro: ABNT, 2025.",
    );
    const titleRun = runs.find(isBold);
    expect(titleRun).toBeDefined();
    expect(runText(titleRun)).toContain("NBR 6023");
  });
});

describe("sortReferences", () => {
  it("ordena alfabeticamente em pt-BR", () => {
    const sorted = sortReferences([
      { raw: "Z, autor." },
      { raw: "A, autor." },
      { raw: "Á, autor." },
    ]);
    expect(sorted[0].raw).toMatch(/^[AÁ],/);
  });
});

describe("renderInline", () => {
  it("aplica negrito inline", () => {
    const runs = renderInline("um **dois** três");
    const bold = runs.find(isBold);
    expect(bold).toBeDefined();
    expect(runText(bold)).toBe("dois");
  });

  it("renderiza citação autor-data no padrão ABNT", () => {
    const runs = renderInline("texto [@LAKATOS, 2021] mais texto");
    const joined = runs.map(runText).join("");
    expect(joined).toContain("(LAKATOS, 2021)");
  });
});

describe("buildReferenceIndex", () => {
  it("usa primeira palavra em maiúscula como chave", () => {
    const idx = buildReferenceIndex([
      { raw: "LAKATOS, Eva. Fundamentos. Atlas, 2021." },
    ]);
    expect(idx.has("LAKATOS")).toBe(true);
  });
});

describe("computeStats", () => {
  it("contabiliza palavras, seções e referências", () => {
    const raw = "# Intro\n\nUm dois três quatro cinco.";
    const blocks = parseDocument(raw);
    const stats = computeStats(raw, blocks, [{ raw: "x" }]);
    expect(stats.sections).toBe(1);
    expect(stats.refs).toBe(1);
    expect(stats.words).toBeGreaterThan(4);
  });
});
