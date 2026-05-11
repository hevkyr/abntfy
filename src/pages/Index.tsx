import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Download,
  FileText,
  Github,
  ListOrdered,
  Quote,
  Sparkles,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  type AbntAbstract,
  type AbntMetadata,
  buildReferenceIndex,
  computeStats,
  downloadDocx,
  parseDocument,
  parseReference,
  sortReferences,
} from "@/lib/abnt";
import {
  SAMPLE_ABSTRACT,
  SAMPLE_BODY,
  SAMPLE_REFS,
  SAMPLE_RESUMO,
} from "@/data/samples";
import { CoverForm } from "@/components/CoverForm";
import { AbstractForm } from "@/components/AbstractForm";
import { BodyEditor } from "@/components/BodyEditor";
import { ReferencesEditor } from "@/components/ReferencesEditor";
import { LivePreview } from "@/components/LivePreview";

export default function Index() {
  const [meta, setMeta] = useState<AbntMetadata>({
    institution: "Universidade Federal do Brasil",
    course: "Curso de Graduação",
    author: "Seu Nome Completo",
    title: "Título do Trabalho Acadêmico",
    subtitle: "subtítulo opcional explicativo",
    advisor: "Prof. Dr. Orientador",
    city: "São Paulo",
    year: "2026",
    workType: "Trabalho de Conclusão de Curso apresentado",
  });
  const [abstract, setAbstract] = useState<AbntAbstract>({
    resumo: SAMPLE_RESUMO,
    palavrasChave: ["ABNT", "formatação", "trabalho acadêmico", "automação"],
    abstract: SAMPLE_ABSTRACT,
    keywords: ["ABNT standard", "formatting", "academic writing", "automation"],
  });
  const [includeAbstract, setIncludeAbstract] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);

  const [bodyRaw, setBodyRaw] = useState(SAMPLE_BODY);
  const [refsRaw, setRefsRaw] = useState(SAMPLE_REFS);
  const [busy, setBusy] = useState(false);

  const blocks = useMemo(() => parseDocument(bodyRaw), [bodyRaw]);
  const references = useMemo(
    () =>
      sortReferences(
        refsRaw
          .split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((raw) => ({ raw })),
      ),
    [refsRaw],
  );
  const refIndex = useMemo(() => buildReferenceIndex(references), [references]);
  const stats = useMemo(
    () => computeStats(bodyRaw, blocks, references),
    [bodyRaw, blocks, references],
  );

  const handleExport = async () => {
    if (!meta.title || !meta.author) {
      toast.error("Preencha pelo menos título e autor.");
      return;
    }
    try {
      setBusy(true);
      const filename =
        (meta.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").slice(0, 60) ||
          "trabalho-abnt") + ".docx";
      await downloadDocx(
        {
          meta,
          abstract: includeAbstract ? abstract : undefined,
          blocks,
          references,
          includeToc,
        },
        filename,
      );
      toast.success("Documento .docx gerado com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar o documento.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid">
      {/* ───────────────── Hero ───────────────── */}
      <header className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg glow">
                <BookOpen className="size-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ABNTfy</h1>
                <p className="text-sm text-muted-foreground">
                  Formatação ABNT automática · NBR 6023:2025 · 14724 · 6024 · 6027 · 6028 · 10520
                </p>
              </div>
            </div>
            <a
              href="https://github.com/hevkyr/abntfy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="size-4" /> hevkyr/abntfy
            </a>
          </div>

          <div className="mt-10 max-w-3xl">
            <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Escreva em texto livre.{" "}
              <span className="text-gradient">A ABNT é nossa.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Capa, folha de rosto, resumo, sumário, citações longas, listas,
              legendas numeradas, paginação e referências —
              tudo aplicado automaticamente em um <code>.docx</code> final.
              O LaTeX da norma brasileira, sem precisar aprender LaTeX.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={handleExport} disabled={busy}>
                <Download className="size-4" />
                {busy ? "Gerando…" : "Exportar .docx"}
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#editor">
                  <Sparkles className="size-4" /> Começar a editar
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────── Stats ───────────────── */}
      <section className="container mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Stat icon={<Type className="size-4" />} label="Palavras" value={stats.words} />
          <Stat icon={<FileText className="size-4" />} label="Páginas" value={`~${stats.pages}`} />
          <Stat icon={<ListOrdered className="size-4" />} label="Seções" value={stats.sections} />
          <Stat icon={<Quote className="size-4" />} label="Citações" value={stats.quotes} />
          <Stat label="Figuras/Tab." value={stats.figures + stats.tables} />
          <Stat label="Referências" value={stats.refs} />
        </div>
      </section>

      {/* ───────────────── Editor ───────────────── */}
      <section id="editor" className="container mx-auto max-w-6xl px-6 pb-16">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="cover">Capa</TabsTrigger>
            <TabsTrigger value="abstract">Resumo</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="refs">Referências</TabsTrigger>
            <TabsTrigger value="preview">Pré-visualizar</TabsTrigger>
          </TabsList>

          <TabsContent value="cover" className="mt-4">
            <Card className="p-6">
              <CoverForm meta={meta} onChange={setMeta} />
              <div className="mt-6 flex items-center gap-4 border-t border-border pt-4 text-sm">
                <ToggleSwitch
                  checked={includeToc}
                  onChange={setIncludeToc}
                  label="Incluir sumário automático (NBR 6027)"
                />
                <ToggleSwitch
                  checked={includeAbstract}
                  onChange={setIncludeAbstract}
                  label="Incluir resumo / abstract (NBR 6028)"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="abstract" className="mt-4">
            <Card className="p-6">
              <AbstractForm value={abstract} onChange={setAbstract} />
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <Card className="p-6">
              <BodyEditor value={bodyRaw} onChange={setBodyRaw} />
            </Card>
          </TabsContent>

          <TabsContent value="refs" className="mt-4">
            <Card className="p-6">
              <ReferencesEditor
                value={refsRaw}
                onChange={setRefsRaw}
                references={references}
                parse={parseReference}
              />
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card className="overflow-hidden">
              <LivePreview
                meta={meta}
                abstract={includeAbstract ? abstract : undefined}
                blocks={blocks}
                references={references}
                refIndex={refIndex}
                includeToc={includeToc}
              />
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button size="lg" onClick={handleExport} disabled={busy}>
            <Download className="size-4" />
            {busy ? "Gerando documento…" : "Exportar .docx ABNT"}
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>
          ABNTfy · Formatação acadêmica automática · feito com ❤ por{" "}
          <a className="underline" href="https://github.com/hevkyr">
            hevkyr
          </a>
        </p>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4" style={{ background: "var(--gradient-card)" }}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      <span className="text-muted-foreground">{label}</span>
    </label>
  );
}
