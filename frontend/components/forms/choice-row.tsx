interface ChoiceRowProps extends React.ComponentProps<"input"> {
  label: string;
  caption?: string;
}

export function ChoiceRow({ label, caption, ...input }: ChoiceRowProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-line bg-card px-3 py-2 hover:bg-surface-muted has-checked:border-primary has-checked:ring-3 has-checked:ring-lime-soft">
      <input type="radio" className="m-0 size-4 shrink-0 accent-primary" {...input} />
      <span className="flex flex-col gap-0.5">
        <span className="text-body text-ink">{label}</span>
        {caption && <span className="text-caption text-ink-muted">{caption}</span>}
      </span>
    </label>
  );
}
