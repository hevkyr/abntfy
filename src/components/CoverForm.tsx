import { Input } from "@/components/ui/input";
import type { AbntMetadata } from "@/lib/abnt";

export interface CoverFormProps {
  meta: AbntMetadata;
  onChange: (m: AbntMetadata) => void;
}

/** Formulário da folha de rosto / capa (NBR 14724). */
export function CoverForm({ meta, onChange }: CoverFormProps) {
  const set = <K extends keyof AbntMetadata>(k: K, v: AbntMetadata[K]) =>
    onChange({ ...meta, [k]: v });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Instituição" value={meta.institution} onChange={(v) => set("institution", v)} />
      <Field label="Curso" value={meta.course ?? ""} onChange={(v) => set("course", v)} />
      <Field label="Autor(a)" value={meta.author} onChange={(v) => set("author", v)} />
      <Field label="Orientador(a)" value={meta.advisor ?? ""} onChange={(v) => set("advisor", v)} />
      <Field label="Título" value={meta.title} onChange={(v) => set("title", v)} />
      <Field label="Subtítulo" value={meta.subtitle ?? ""} onChange={(v) => set("subtitle", v)} />
      <Field label="Cidade" value={meta.city} onChange={(v) => set("city", v)} />
      <Field label="Ano" value={meta.year} onChange={(v) => set("year", v)} />
      <div className="md:col-span-2">
        <Field
          label="Tipo / natureza do trabalho"
          value={meta.workType ?? ""}
          onChange={(v) => set("workType", v)}
          hint='Ex.: "Trabalho de Conclusão de Curso apresentado", "Dissertação de Mestrado apresentada"'
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
      {hint && <span className="mt-1 block text-xs text-muted-foreground/70">{hint}</span>}
    </label>
  );
}
