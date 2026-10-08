import { ChevronsUpDown } from "lucide-react";

export function UserCard() {
  return (
    <button className="flex shrink-0 cursor-pointer items-center gap-2.5 border-t border-line px-2.5 py-3 text-left">
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-field-label font-semibold text-lime">
        HJ
        <span className="absolute -right-px -bottom-px size-2.5 rounded-full border-2 border-white bg-online" />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="text-label text-ink">H. M. Jayasekara</span>
        <span className="text-caption text-ink-muted">Park manager</span>
      </span>
      <ChevronsUpDown className="size-4 text-ink-muted" strokeWidth={2} />
    </button>
  );
}
