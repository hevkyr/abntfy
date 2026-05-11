import { Textarea } from "@/components/ui/textarea";

export interface BodyEditorProps {
  value: string;
  onChange: (v: string) => void;
}

/**
 * Editor de corpo livre, com referência rápida da sintaxe abntfy.
 */
export function BodyEditor({ value, onChange }: BodyEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Conteúdo do trabalho</h3>
        <span className="text-xs text-muted-foreground">
          Markdown-like · auto-formatação ABNT
        </span>
      </div>

      <SyntaxLegend />

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[520px] font-mono text-sm leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}

function SyntaxLegend() {
  const items: [string, string][] = [
    ["# Título", "seção 1"],
    ["## Subtítulo", "seção 1.1"],
    ["### Sub-sub", "seção 1.1.1"],
    ["> citação longa", "recuo 4 cm"],
    ["- item / 1. item", "lista"],
    ["[fig] legenda", "figura nº"],
    ["[tab] legenda", "tabela nº"],
    ["**negrito** *itálico*", "inline"],
    ["[@LAKATOS, 2021]", "citação"],
  ];
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs">
      {items.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1.5 rounded-md bg-background/60 px-2 py-1">
          <code className="font-mono text-primary">{k}</code>
          <span className="text-muted-foreground">→ {v}</span>
        </span>
      ))}
    </div>
  );
}
