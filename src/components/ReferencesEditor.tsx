import type { TextRun } from "docx";
import { Textarea } from "@/components/ui/textarea";
import type { Reference } from "@/lib/abnt";

export interface ReferencesEditorProps {
  value: string;
  onChange: (v: string) => void;
  references: Reference[];
  parse: (raw: string) => TextRun[];
}

interface RunLike {
  text?: string;
  bold?: boolean;
}

/**
 * Editor de referências (NBR 6023:2025) com pré-visualização da
 * formatação tipográfica (título em negrito).
 */
export function ReferencesEditor({
  value,
  onChange,
  references,
  parse,
}: ReferencesEditorProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 font-semibold">Referências (NBR 6023)</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Uma referência por linha. São ordenadas alfabeticamente no documento
          final. A primeira palavra (autor em caixa alta) também serve como
          chave para citações <code className="text-primary">[@AUTOR, ANO]</code> no corpo.
        </p>
        <Textarea
          className="min-h-[420px] font-mono text-sm leading-relaxed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Pré-visualização ({references.length})</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Tipografia conforme NBR 6023:2025 — título em negrito.
        </p>
        <div className="max-h-[420px] space-y-3 overflow-auto rounded-lg border border-border bg-muted/20 p-4 text-sm">
          {references.map((r, i) => {
            const runs = parse(r.raw) as unknown as RunLike[];
            return (
              <p key={i} className="leading-snug">
                {runs.map((run, j) => (
                  <span key={j} style={{ fontWeight: run.bold ? 700 : 400 }}>
                    {run.text ?? ""}
                  </span>
                ))}
              </p>
            );
          })}
          {!references.length && (
            <p className="text-muted-foreground">Nenhuma referência adicionada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
