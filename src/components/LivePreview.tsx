import { Fragment, useMemo } from "react";
import type {
  AbntAbstract,
  AbntMetadata,
  Block,
  Reference,
} from "@/lib/abnt";
import { parseReference } from "@/lib/abnt";

export interface LivePreviewProps {
  meta: AbntMetadata;
  abstract?: AbntAbstract;
  blocks: Block[];
  references: Reference[];
  refIndex: Map<string, string>;
  includeToc: boolean;
}

/**
 * Pré-visualização "papel A4" do documento gerado, simulando margens,
 * fontes e espaçamentos. Não é WYSIWYG perfeito — serve para inspeção
 * rápida antes do export.
 */
export function LivePreview({
  meta,
  abstract,
  blocks,
  references,
  includeToc,
}: LivePreviewProps) {
  const numbered = useMemo(() => numberSections(blocks), [blocks]);
  const captions = useMemo(() => numberCaptions(blocks), [blocks]);

  return (
    <div className="bg-muted/30 p-4 md:p-8">
      <div
        className="mx-auto bg-white text-black shadow-elevated"
        style={{
          width: "min(100%, 720px)",
          padding: "60px 40px 60px 60px",
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "12pt",
          lineHeight: 1.5,
        }}
      >
        {/* Capa */}
        <Page>
          <Center bold>{meta.institution.toUpperCase()}</Center>
          {meta.course && <Center bold>{meta.course.toUpperCase()}</Center>}
          <Spacer n={5} />
          <Center>{meta.author.toUpperCase()}</Center>
          <Spacer n={6} />
          <Center bold size="14pt">
            {meta.title.toUpperCase()}
          </Center>
          {meta.subtitle && (
            <Center italic size="14pt">
              {meta.subtitle}
            </Center>
          )}
          <Spacer n={8} />
          <Center>{meta.city.toUpperCase()}</Center>
          <Center>{meta.year}</Center>
        </Page>

        {/* Folha de rosto */}
        <Page>
          <Center>{meta.author.toUpperCase()}</Center>
          <Spacer n={6} />
          <Center bold size="14pt">
            {meta.title.toUpperCase()}
          </Center>
          {meta.subtitle && <Center italic>{meta.subtitle}</Center>}
          <Spacer n={3} />
          <p style={{ marginLeft: "8cm", textAlign: "justify", lineHeight: 1 }}>
            {meta.workType ?? "Trabalho acadêmico apresentado"}
            {meta.course && ` ao curso de ${meta.course}`}
            {meta.institution && ` da ${meta.institution}`}
            {meta.advisor && `, sob orientação de ${meta.advisor}`}.
          </p>
          <Spacer n={6} />
          <Center>{meta.city.toUpperCase()}</Center>
          <Center>{meta.year}</Center>
        </Page>

        {/* Resumo */}
        {abstract && (
          <Page>
            <Center bold>RESUMO</Center>
            <Spacer />
            <p style={{ textAlign: "justify", lineHeight: 1 }}>{abstract.resumo}</p>
            {abstract.palavrasChave.length > 0 && (
              <p style={{ marginTop: "1em", lineHeight: 1 }}>
                <strong>Palavras-chave:</strong> {abstract.palavrasChave.join("; ")}.
              </p>
            )}
            {abstract.abstract && (
              <>
                <Spacer n={2} />
                <Center bold>ABSTRACT</Center>
                <Spacer />
                <p style={{ textAlign: "justify", lineHeight: 1 }}>{abstract.abstract}</p>
                {abstract.keywords?.length ? (
                  <p style={{ marginTop: "1em", lineHeight: 1, fontStyle: "italic" }}>
                    <strong>Keywords:</strong> {abstract.keywords.join("; ")}.
                  </p>
                ) : null}
              </>
            )}
          </Page>
        )}

        {/* Sumário */}
        {includeToc && numbered.length > 0 && (
          <Page>
            <Center bold>SUMÁRIO</Center>
            <Spacer />
            {numbered
              .filter((b) => b.type === "section")
              .map((b, i) => (
                <p
                  key={i}
                  style={{
                    marginLeft: `${((b.level ?? 1) - 1) * 0.8}cm`,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {b.num} {b.text.toUpperCase()}
                  </span>
                  <span style={{ color: "#888" }}>…</span>
                </p>
              ))}
          </Page>
        )}

        {/* Corpo */}
        <Page numbered>
          {numbered.map((b, i) => (
            <Fragment key={i}>{renderBlock(b, captions)}</Fragment>
          ))}
        </Page>

        {/* Referências */}
        {references.length > 0 && (
          <Page>
            <Center bold>REFERÊNCIAS</Center>
            <Spacer />
            {references.map((r, i) => {
              const runs = parseReference(r.raw) as unknown as {
                text?: string;
                bold?: boolean;
              }[];
              return (
                <p key={i} style={{ lineHeight: 1, marginBottom: "1em" }}>
                  {runs.map((run, j) => (
                    <span key={j} style={{ fontWeight: run.bold ? 700 : 400 }}>
                      {run.text ?? ""}
                    </span>
                  ))}
                </p>
              );
            })}
          </Page>
        )}
      </div>
    </div>
  );
}

// ─────────── helpers visuais ───────────

function Page({ children, numbered }: { children: React.ReactNode; numbered?: boolean }) {
  return (
    <section
      style={{
        minHeight: "20cm",
        position: "relative",
        pageBreakAfter: "always",
        borderBottom: "1px dashed #ccc",
        paddingBottom: "2em",
        marginBottom: "2em",
      }}
    >
      {numbered && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            fontSize: "10pt",
            color: "#666",
          }}
        >
          1
        </div>
      )}
      {children}
    </section>
  );
}

function Center({
  children,
  bold,
  italic,
  size,
}: {
  children: React.ReactNode;
  bold?: boolean;
  italic?: boolean;
  size?: string;
}) {
  return (
    <p
      style={{
        textAlign: "center",
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? "italic" : "normal",
        fontSize: size,
      }}
    >
      {children}
    </p>
  );
}

function Spacer({ n = 1 }: { n?: number }) {
  return (
    <div aria-hidden style={{ height: `${n * 1}em` }} />
  );
}

interface NumberedBlock extends Block {
  num?: string;
}

function numberSections(blocks: Block[]): NumberedBlock[] {
  const counters = [0, 0, 0, 0];
  return blocks.map((b) => {
    if (b.type !== "section") return b;
    const lvl = Math.min(Math.max(b.level ?? 1, 1), 4);
    counters[lvl - 1]++;
    for (let i = lvl; i < counters.length; i++) counters[i] = 0;
    return { ...b, num: counters.slice(0, lvl).join(".") };
  });
}

function numberCaptions(blocks: Block[]): Map<number, string> {
  const map = new Map<number, string>();
  let f = 0,
    t = 0,
    e = 0;
  blocks.forEach((b, i) => {
    if (b.type === "caption-fig") map.set(i, `Figura ${++f}`);
    else if (b.type === "caption-tab") map.set(i, `Tabela ${++t}`);
    else if (b.type === "caption-eq") map.set(i, `Equação ${++e}`);
  });
  return map;
}

function renderBlock(b: NumberedBlock, captions: Map<number, string>) {
  if (b.type === "section") {
    const tag = b.level === 1 ? "h2" : b.level === 2 ? "h3" : "h4";
    return (
      <Tag tag={tag}>
        <strong>
          {b.num} {b.text.toUpperCase()}
        </strong>
      </Tag>
    );
  }
  if (b.type === "paragraph") {
    return (
      <p style={{ textIndent: "1.25cm", textAlign: "justify" }}>
        {renderInlineText(b.text)}
      </p>
    );
  }
  if (b.type === "quote") {
    return (
      <p
        style={{
          marginLeft: "4cm",
          fontSize: "10pt",
          lineHeight: 1,
          textAlign: "justify",
          marginTop: "1em",
          marginBottom: "1em",
        }}
      >
        {renderInlineText(b.text)}
      </p>
    );
  }
  if (b.type === "list-item") {
    return <p style={{ marginLeft: "1.25cm" }}>• {renderInlineText(b.text)}</p>;
  }
  if (b.type === "olist-item") {
    return <p style={{ marginLeft: "1.25cm" }}>{renderInlineText(b.text)}</p>;
  }
  // captions
  const idx = Array.from(captions.entries()).find(([, v]) =>
    v.toLowerCase().startsWith(
      b.type === "caption-fig" ? "figura" : b.type === "caption-tab" ? "tabela" : "equação",
    ),
  );
  const label = idx?.[1] ?? "Figura";
  return (
    <p style={{ textAlign: "center", fontSize: "10pt", lineHeight: 1, margin: "1em 0" }}>
      <strong>{label} – </strong>
      {b.text}
    </p>
  );
}

function Tag({ tag, children }: { tag: string; children: React.ReactNode }) {
  const Component = tag as keyof React.JSX.IntrinsicElements;
  return (
    <Component style={{ fontSize: "12pt", margin: "1.5em 0 0.5em" }}>{children}</Component>
  );
}

function renderInlineText(text: string): React.ReactNode {
  // bold / italic / citações
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_|\[@[^\]]+\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*") || tok.startsWith("_"))
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    else if (tok.startsWith("[@")) {
      const [a, y] = tok.slice(2, -1).split(/,\s*/);
      parts.push(
        <span key={key++} style={{ color: "#444" }}>
          ({a.toUpperCase()}
          {y ? `, ${y}` : ""})
        </span>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
