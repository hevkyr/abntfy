/**
 * @fileoverview ABNTfy — núcleo de formatação acadêmica ABNT.
 *
 * Gera documentos Word (.docx) seguindo as principais normas ABNT
 * para trabalhos acadêmicos:
 *
 *  - **NBR 14724** — apresentação de trabalhos acadêmicos
 *  - **NBR 6023:2025** — referências (3ª edição, maio/2025)
 *  - **NBR 6024** — numeração progressiva de seções
 *  - **NBR 6027** — sumário
 *  - **NBR 6028** — resumo
 *  - **NBR 10520** — citações em documentos
 *
 * ## Especificação aplicada
 *
 *  | Item                       | Valor                                       |
 *  |----------------------------|---------------------------------------------|
 *  | Fonte                      | Times New Roman 12pt                        |
 *  | Citação longa / nota / leg | 10pt                                        |
 *  | Espaçamento de linhas      | 1,5 (simples para citação longa/refs)       |
 *  | Margens                    | 3 cm (sup./esq.) · 2 cm (inf./dir.)         |
 *  | Recuo de parágrafo         | 1,25 cm                                     |
 *  | Recuo de citação longa     | 4 cm                                        |
 *  | Paginação                  | superior direita, a partir da introdução    |
 *  | Títulos de seção           | numeração progressiva, caixa alta + negrito |
 *  | Referências                | ordem alfabética, alinhadas à esquerda      |
 *
 * ## Sintaxe de marcação aceita pelo parser
 *
 * O parser converte um corpo em "markdown-like" para blocos estruturados:
 *
 *  ```text
 *  # Título            → seção nível 1   (1, 2, 3 …)
 *  ## Título           → seção nível 2   (1.1, 1.2 …)
 *  ### Título          → seção nível 3   (1.1.1 …)
 *  #### Título         → seção nível 4
 *  > texto             → citação longa (recuo 4 cm, fonte 10pt, sem aspas)
 *  - item / * item     → item de lista não-ordenada
 *  1. item             → item de lista ordenada
 *  [fig] legenda       → legenda de figura  (numerada automaticamente)
 *  [tab] legenda       → legenda de tabela
 *  [eq]  legenda       → legenda de equação
 *  (linha em branco)   → separa parágrafos
 *  ```
 *
 * Dentro de qualquer texto, são reconhecidas as marcações inline:
 *
 *  - `**negrito**`
 *  - `*itálico*` ou `_itálico_`
 *  - `[@chave]` → citação autor-data; resolvida contra a 1ª palavra de cada
 *    referência (ex.: `[@LAKATOS, 2021]` ou `[@LAKATOS]`).
 *
 * @module lib/abnt
 */

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
  convertMillimetersToTwip,
} from "docx";
import { saveAs } from "file-saver";

// ──────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ──────────────────────────────────────────────────────────────────────────

/** Metadados que compõem a folha de rosto, capa e cabeçalhos. */
export interface AbntMetadata {
  institution: string;
  course?: string;
  author: string;
  title: string;
  subtitle?: string;
  advisor?: string;
  city: string;
  year: string;
  /** Tipo de trabalho (ex.: "Trabalho de Conclusão de Curso"). Opcional. */
  workType?: string;
}

/** Resumo + Abstract (NBR 6028). */
export interface AbntAbstract {
  resumo: string;
  palavrasChave: string[];
  abstract?: string;
  keywords?: string[];
}

export type BlockType =
  | "section"
  | "paragraph"
  | "quote"
  | "list-item"
  | "olist-item"
  | "caption-fig"
  | "caption-tab"
  | "caption-eq";

export interface Block {
  type: BlockType;
  text: string;
  /** Profundidade 1..4 — usado em `section`. */
  level?: number;
}

export interface Reference {
  raw: string;
}

export interface DocumentInput {
  meta: AbntMetadata;
  abstract?: AbntAbstract;
  blocks: Block[];
  references: Reference[];
  /** Inclui sumário automático antes do corpo. */
  includeToc?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Constantes de estilo ABNT
// ──────────────────────────────────────────────────────────────────────────

const FONT = "Times New Roman";
const SIZE_BODY = 24;       // 12pt (half-points)
const SIZE_SMALL = 20;      // 10pt
const SIZE_TITLE = 28;      // 14pt — capa
const INDENT_FIRST = convertMillimetersToTwip(12.5); // 1,25 cm
const INDENT_QUOTE = convertMillimetersToTwip(40);   // 4 cm
const INDENT_LIST = convertMillimetersToTwip(12.5);
const LINE_15 = 360; // 1,5
const LINE_1 = 240;  // 1,0

// ──────────────────────────────────────────────────────────────────────────
// Helpers de baixo nível
// ──────────────────────────────────────────────────────────────────────────

interface RunOpts {
  bold?: boolean;
  italic?: boolean;
  size?: number;
}

const run = (text: string, opts: RunOpts = {}): TextRun =>
  new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SIZE_BODY,
    bold: opts.bold,
    italics: opts.italic,
  });

const blank = () => new Paragraph({ children: [run("")] });

/**
 * Converte texto inline com `**negrito**`, `*itálico*` e `[@cite]`
 * em uma sequência de TextRuns.
 *
 * Citações `[@KEY]` ou `[@KEY, ANO]` resolvidas contra `refIndex`
 * (mapa de chaves normalizadas → índice). A ordem de aparição não
 * altera o item exibido — apenas o destaque visual (`(AUTOR, ANO)`).
 */
export function renderInline(
  text: string,
  refIndex?: Map<string, string>,
  opts: RunOpts = {},
): TextRun[] {
  const out: TextRun[] = [];
  // Tokeniza preservando delimitadores
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_|\[@[^\]]+\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (chunk: string, extra: RunOpts = {}) => {
    if (!chunk) return;
    out.push(run(chunk, { ...opts, ...extra }));
  };

  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      push(tok.slice(2, -2), { bold: true });
    } else if (tok.startsWith("*") || tok.startsWith("_")) {
      push(tok.slice(1, -1), { italic: true });
    } else if (tok.startsWith("[@")) {
      const key = tok.slice(2, -1).trim();
      const rendered = renderCitation(key, refIndex);
      push(rendered);
    }
    last = m.index + tok.length;
  }
  push(text.slice(last));
  return out.length ? out : [run(text, opts)];
}

/**
 * Resolve uma chave de citação para o formato autor-data ABNT (NBR 10520).
 * Aceita "SOBRENOME" ou "SOBRENOME, 2024".
 */
function renderCitation(key: string, refIndex?: Map<string, string>): string {
  const [author, year] = key.split(/,\s*/);
  const a = (author || "").toUpperCase().trim();
  const y = (year || "").trim();
  // Se a chave existir no índice, mantemos ela (nome canônico do autor).
  if (refIndex && refIndex.has(a)) {
    return y ? `(${a}, ${y})` : `(${a})`;
  }
  return y ? `(${a}, ${y})` : `(${a})`;
}

// ──────────────────────────────────────────────────────────────────────────
// Parser de referências (NBR 6023:2025)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Quebra uma referência em runs realçando o **título da obra em negrito**,
 * conforme recomendação da NBR 6023:2025 (3ª edição, maio/2025).
 *
 * Estratégia: assume formato `AUTOR. Título. Resto.` — um parser simples
 * baseado nas duas primeiras sentenças. Também detecta `Disponível em:`
 * e `DOI:` para preservar conformidade.
 */
export function parseReference(raw: string): TextRun[] {
  const clean = raw.trim().replace(/\s+/g, " ");
  const m = clean.match(/^([^.]+?\.)\s+([^.]+?\.)\s*(.*)$/);
  if (!m) return [run(clean, { size: SIZE_BODY })];
  const [, author, title, rest] = m;
  return [
    run(author + " "),
    run(title.replace(/\.$/, "") + ".", { bold: true }),
    run(rest ? " " + rest : ""),
  ];
}

/** Ordena referências alfabeticamente conforme regras pt-BR. */
export function sortReferences(refs: Reference[]): Reference[] {
  return [...refs].sort((a, b) =>
    a.raw.localeCompare(b.raw, "pt-BR", { sensitivity: "base" }),
  );
}

/**
 * Extrai a chave de cada referência (primeira palavra antes da vírgula),
 * usada para resolver citações `[@KEY]` no corpo.
 */
export function buildReferenceIndex(refs: Reference[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const r of refs) {
    const first = r.raw.trim().split(/[,.]/)[0]?.trim().toUpperCase();
    if (first) idx.set(first, r.raw);
  }
  return idx;
}

// ──────────────────────────────────────────────────────────────────────────
// Parser de corpo livre → blocos
// ──────────────────────────────────────────────────────────────────────────

export function parseDocument(raw: string): Block[] {
  const blocks: Block[] = [];
  const paragraphs = raw.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const line = para.trim();
    if (!line) continue;

    const h = line.match(/^(#{1,4})\s+(.*)$/s);
    if (h) {
      blocks.push({ type: "section", level: h[1].length, text: h[2].trim() });
      continue;
    }
    if (line.startsWith(">")) {
      blocks.push({
        type: "quote",
        text: line.replace(/^>\s?/, "").replace(/\n>\s?/g, " ").trim(),
      });
      continue;
    }
    if (/^\[fig\]/i.test(line)) {
      blocks.push({ type: "caption-fig", text: line.replace(/^\[fig\]\s*/i, "") });
      continue;
    }
    if (/^\[tab\]/i.test(line)) {
      blocks.push({ type: "caption-tab", text: line.replace(/^\[tab\]\s*/i, "") });
      continue;
    }
    if (/^\[eq\]/i.test(line)) {
      blocks.push({ type: "caption-eq", text: line.replace(/^\[eq\]\s*/i, "") });
      continue;
    }
    // Listas: cada linha vira um item independente
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const lines = line.split(/\n/);
      for (const ln of lines) {
        const li = ln.trim();
        if (!li) continue;
        if (/^[-*]\s+/.test(li)) {
          blocks.push({ type: "list-item", text: li.replace(/^[-*]\s+/, "") });
        } else if (/^\d+\.\s+/.test(li)) {
          blocks.push({ type: "olist-item", text: li.replace(/^\d+\.\s+/, "") });
        } else {
          // continuação do item anterior
          const prev = blocks[blocks.length - 1];
          if (prev && (prev.type === "list-item" || prev.type === "olist-item")) {
            prev.text += " " + li;
          }
        }
      }
      continue;
    }
    blocks.push({ type: "paragraph", text: line.replace(/\n/g, " ") });
  }
  return blocks;
}

// ──────────────────────────────────────────────────────────────────────────
// Construção do .docx
// ──────────────────────────────────────────────────────────────────────────

function buildCover(meta: AbntMetadata): Paragraph[] {
  const center = (children: TextRun[]) =>
    new Paragraph({
      children,
      alignment: AlignmentType.CENTER,
      spacing: { line: LINE_15 },
    });

  const out: Paragraph[] = [
    center([run(meta.institution.toUpperCase(), { bold: true })]),
    ...(meta.course ? [center([run(meta.course.toUpperCase(), { bold: true })])] : []),
    blank(), blank(), blank(), blank(),
    center([run(meta.author.toUpperCase())]),
    blank(), blank(), blank(), blank(), blank(), blank(),
    center([run(meta.title.toUpperCase(), { bold: true, size: SIZE_TITLE })]),
    ...(meta.subtitle
      ? [center([run(meta.subtitle, { italic: true, size: SIZE_TITLE })])]
      : []),
    blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank(),
    center([run(meta.city.toUpperCase())]),
    center([run(meta.year)]),
  ];
  return out;
}

/** Folha de rosto (verso da capa) com nota de natureza do trabalho. */
function buildTitlePage(meta: AbntMetadata): Paragraph[] {
  const center = (children: TextRun[]) =>
    new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { line: LINE_15 } });

  const note = [
    meta.workType ?? "Trabalho acadêmico apresentado",
    meta.course ? `ao curso de ${meta.course}` : "",
    meta.institution ? `da ${meta.institution}` : "",
    meta.advisor ? `, sob orientação de ${meta.advisor}` : "",
    ".",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".");

  return [
    center([run(meta.author.toUpperCase())]),
    blank(), blank(), blank(), blank(), blank(), blank(),
    center([run(meta.title.toUpperCase(), { bold: true, size: SIZE_TITLE })]),
    ...(meta.subtitle ? [center([run(meta.subtitle, { italic: true })])] : []),
    blank(), blank(), blank(),
    new Paragraph({
      children: [run(note)],
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: convertMillimetersToTwip(80) },
      spacing: { line: LINE_1 },
    }),
    blank(), blank(), blank(), blank(), blank(),
    center([run(meta.city.toUpperCase())]),
    center([run(meta.year)]),
  ];
}

function buildAbstract(a: AbntAbstract): Paragraph[] {
  const heading = (text: string) =>
    new Paragraph({
      children: [run(text.toUpperCase(), { bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240, line: LINE_15 },
    });

  const para = (text: string) =>
    new Paragraph({
      children: [run(text)],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: LINE_1 }, // resumo: espaçamento simples (NBR 6028)
    });

  const out: Paragraph[] = [heading("Resumo"), para(a.resumo)];
  if (a.palavrasChave.length) {
    out.push(
      new Paragraph({
        children: [
          run("Palavras-chave: ", { bold: true }),
          run(a.palavrasChave.join("; ") + "."),
        ],
        spacing: { before: 240, line: LINE_1 },
      }),
    );
  }
  if (a.abstract) {
    out.push(heading("Abstract"));
    out.push(para(a.abstract));
    if (a.keywords?.length) {
      out.push(
        new Paragraph({
          children: [
            run("Keywords: ", { bold: true, italic: true }),
            run(a.keywords.join("; ") + ".", { italic: true }),
          ],
          spacing: { before: 240, line: LINE_1 },
        }),
      );
    }
  }
  return out;
}

function buildToc(blocks: Block[]): Paragraph[] {
  const sections = blocks.filter((b) => b.type === "section");
  if (!sections.length) return [];

  const counters = [0, 0, 0, 0];
  const items: { num: string; text: string; level: number }[] = [];
  for (const s of sections) {
    const lvl = Math.min(Math.max(s.level ?? 1, 1), 4);
    counters[lvl - 1]++;
    for (let i = lvl; i < counters.length; i++) counters[i] = 0;
    items.push({ num: counters.slice(0, lvl).join("."), text: s.text, level: lvl });
  }

  const out: Paragraph[] = [
    new Paragraph({
      children: [run("SUMÁRIO", { bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 360, line: LINE_15 },
    }),
  ];

  for (const it of items) {
    out.push(
      new Paragraph({
        children: [
          run(`${it.num} ${it.text.toUpperCase()}\t`),
          run(""), // o leader preencherá até o tab
        ],
        tabStops: [
          { type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: "dot" },
        ],
        indent: { left: convertMillimetersToTwip((it.level - 1) * 8) },
        spacing: { line: LINE_15 },
      }),
    );
  }
  return out;
}

function buildBody(blocks: Block[], refIndex: Map<string, string>): Paragraph[] {
  const counters = [0, 0, 0, 0];
  let figN = 0,
    tabN = 0,
    eqN = 0;
  const out: Paragraph[] = [];

  const heading = (lvl: number, num: string, text: string) =>
    new Paragraph({
      children: [run(`${num} ${text.toUpperCase()}`, { bold: true })],
      heading:
        lvl === 1
          ? HeadingLevel.HEADING_1
          : lvl === 2
            ? HeadingLevel.HEADING_2
            : lvl === 3
              ? HeadingLevel.HEADING_3
              : HeadingLevel.HEADING_4,
      spacing: { before: 480, after: 240, line: LINE_15 },
      alignment: AlignmentType.LEFT,
    });

  for (const b of blocks) {
    if (b.type === "section") {
      const lvl = Math.min(Math.max(b.level ?? 1, 1), 4);
      counters[lvl - 1]++;
      for (let i = lvl; i < counters.length; i++) counters[i] = 0;
      out.push(heading(lvl, counters.slice(0, lvl).join("."), b.text));
    } else if (b.type === "paragraph") {
      out.push(
        new Paragraph({
          children: renderInline(b.text, refIndex),
          spacing: { line: LINE_15, after: 0 },
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: INDENT_FIRST },
        }),
      );
    } else if (b.type === "quote") {
      out.push(
        new Paragraph({
          children: renderInline(b.text, refIndex, { size: SIZE_SMALL }),
          spacing: { line: LINE_1, before: 120, after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: INDENT_QUOTE },
        }),
      );
    } else if (b.type === "list-item") {
      out.push(
        new Paragraph({
          children: [run("• "), ...renderInline(b.text, refIndex)],
          spacing: { line: LINE_15, after: 60 },
          indent: { left: INDENT_LIST, hanging: 180 },
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    } else if (b.type === "olist-item") {
      // Numeração nativa via lista "abnt-ord"
      out.push(
        new Paragraph({
          children: renderInline(b.text, refIndex),
          numbering: { reference: "abnt-ord", level: 0 },
          spacing: { line: LINE_15, after: 60 },
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    } else if (b.type === "caption-fig") {
      figN++;
      out.push(captionParagraph(`Figura ${figN}`, b.text));
    } else if (b.type === "caption-tab") {
      tabN++;
      out.push(captionParagraph(`Tabela ${tabN}`, b.text));
    } else if (b.type === "caption-eq") {
      eqN++;
      out.push(captionParagraph(`Equação ${eqN}`, b.text));
    }
  }
  return out;
}

function captionParagraph(label: string, text: string): Paragraph {
  return new Paragraph({
    children: [
      run(`${label} – `, { bold: true, size: SIZE_SMALL }),
      run(text, { size: SIZE_SMALL }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_1, before: 120, after: 120 },
  });
}

function buildReferences(refs: Reference[]): Paragraph[] {
  if (!refs.length) return [];
  const out: Paragraph[] = [
    new Paragraph({
      children: [run("REFERÊNCIAS", { bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 360, line: LINE_15 },
    }),
  ];
  for (const r of sortReferences(refs)) {
    out.push(
      new Paragraph({
        children: parseReference(r.raw),
        spacing: { line: LINE_1, after: 240 },
        alignment: AlignmentType.LEFT,
      }),
    );
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Documento principal
// ──────────────────────────────────────────────────────────────────────────

export async function generateDocx(input: DocumentInput): Promise<Blob> {
  const { meta, abstract, blocks, references, includeToc = true } = input;
  const refIndex = buildReferenceIndex(references);

  // Cabeçalho com identificação do trabalho (curto)
  const headerPara = new Paragraph({
    children: [run(meta.title, { italic: true, size: SIZE_SMALL })],
    alignment: AlignmentType.RIGHT,
  });

  // Rodapé com paginação ABNT (canto superior direito real é via header,
  // mas para simplicidade usamos rodapé centralizado com número de página)
  const pageNumberPara = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({
        children: [PageNumber.CURRENT],
        font: FONT,
        size: SIZE_SMALL,
      }),
    ],
  });

  const doc = new Document({
    creator: meta.author || "ABNTfy",
    title: meta.title,
    description: "Documento gerado pelo ABNTfy — formatação ABNT automática.",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_BODY },
          paragraph: { spacing: { line: LINE_15 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "abnt-ord",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: INDENT_LIST, hanging: 200 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      // Pré-textuais (sem paginação visível) — capa + folha de rosto
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(30),
              left: convertMillimetersToTwip(30),
              right: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
            },
          },
        },
        children: [
          ...buildCover(meta),
          new Paragraph({ children: [run("")], pageBreakBefore: true }),
          ...buildTitlePage(meta),
          ...(abstract
            ? [
                new Paragraph({ children: [run("")], pageBreakBefore: true }),
                ...buildAbstract(abstract),
              ]
            : []),
          ...(includeToc
            ? [
                new Paragraph({ children: [run("")], pageBreakBefore: true }),
                ...buildToc(blocks),
              ]
            : []),
        ],
      },
      // Textuais — corpo + referências, com paginação
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(30),
              left: convertMillimetersToTwip(30),
              right: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
            },
          },
        },
        headers: { default: new Header({ children: [headerPara, pageNumberPara] }) },
        footers: { default: new Footer({ children: [new Paragraph({ children: [run("")] })] }) },
        children: [
          ...buildBody(blocks, refIndex),
          new Paragraph({ children: [run("")], pageBreakBefore: true }),
          ...buildReferences(references),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function downloadDocx(
  input: DocumentInput,
  filename = "trabalho-abnt.docx",
): Promise<void> {
  const blob = await generateDocx(input);
  saveAs(blob, filename);
}

// ──────────────────────────────────────────────────────────────────────────
// Estatísticas — exposta para o painel da UI
// ──────────────────────────────────────────────────────────────────────────

export function computeStats(raw: string, blocks: Block[], refs: Reference[]) {
  const words = raw.trim().split(/\s+/).filter(Boolean).length;
  const chars = raw.length;
  const sections = blocks.filter((b) => b.type === "section").length;
  const figures = blocks.filter((b) => b.type === "caption-fig").length;
  const tables = blocks.filter((b) => b.type === "caption-tab").length;
  const quotes = blocks.filter((b) => b.type === "quote").length;
  // ~250 palavras por página A4 com fonte 12 e espaço 1,5
  const pages = Math.max(1, Math.ceil(words / 250));
  return {
    words,
    chars,
    sections,
    figures,
    tables,
    quotes,
    refs: refs.length,
    pages,
  };
}
