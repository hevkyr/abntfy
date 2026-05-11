import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AbntAbstract } from "@/lib/abnt";

export interface AbstractFormProps {
  value: AbntAbstract;
  onChange: (a: AbntAbstract) => void;
}

/** Resumo + Abstract (NBR 6028). */
export function AbstractForm({ value, onChange }: AbstractFormProps) {
  const set = <K extends keyof AbntAbstract>(k: K, v: AbntAbstract[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-semibold">Resumo (português)</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Parágrafo único, entre 150 e 500 palavras, em espaçamento simples.
        </p>
        <Textarea
          value={value.resumo}
          onChange={(e) => set("resumo", e.target.value)}
          className="min-h-[180px]"
        />
        <label className="mt-3 block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Palavras-chave (separadas por ponto-e-vírgula)
          </span>
          <Input
            className="mt-1"
            value={value.palavrasChave.join("; ")}
            onChange={(e) =>
              set(
                "palavrasChave",
                e.target.value
                  .split(/;\s*/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      </section>

      <section className="border-t border-border pt-6">
        <h3 className="mb-2 font-semibold">Abstract (inglês) — opcional</h3>
        <Textarea
          value={value.abstract ?? ""}
          onChange={(e) => set("abstract", e.target.value)}
          className="min-h-[180px]"
        />
        <label className="mt-3 block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Keywords (semicolon separated)
          </span>
          <Input
            className="mt-1"
            value={(value.keywords ?? []).join("; ")}
            onChange={(e) =>
              set(
                "keywords",
                e.target.value
                  .split(/;\s*/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      </section>
    </div>
  );
}
