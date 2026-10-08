import { cn } from "@/lib/utils";

interface FieldProps {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-field-label text-ink-body">
      {label}
      {children}
      {error && <span className="text-caption font-normal text-negative">{error}</span>}
    </label>
  );
}

export function fieldClass(invalid: boolean): string {
  return cn(
    "h-10 w-full rounded-md border bg-card px-3 text-body font-normal text-ink",
    invalid ? "border-negative" : "border-line-strong focus:border-primary focus:ring-3 focus:ring-lime-soft focus:outline-none",
  );
}
