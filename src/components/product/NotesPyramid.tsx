import type { OlfactoryNotes } from "@/types";

const LAYERS: Array<{ key: keyof OlfactoryNotes; label: string; hint: string }> = [
  { key: "top", label: "Saída", hint: "primeiros minutos" },
  { key: "heart", label: "Coração", hint: "até algumas horas" },
  { key: "base", label: "Fundo", hint: "o rastro que fica" },
];

/**
 * Pirâmide olfativa em texto (topo → coração → fundo). Usada no "Espiar" e
 * na PDP; a versão animada com scroll da home fica em `home/NotesStory`.
 */
export function NotesPyramid({ notes, compact = false }: { notes?: OlfactoryNotes; compact?: boolean }) {
  if (!notes || (notes.top.length + notes.heart.length + notes.base.length === 0)) return null;

  return (
    <dl className={compact ? "space-y-2" : "space-y-4"}>
      {LAYERS.map(({ key, label, hint }) =>
        notes[key].length > 0 ? (
          <div key={key} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3">
            <dt>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{label}</span>
              {!compact && <span className="block text-[11px] text-muted">{hint}</span>}
            </dt>
            <dd className={`text-foreground ${compact ? "text-sm" : "text-base"}`}>{notes[key].join(" · ")}</dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}
