import type { UseFormRegisterReturn } from "react-hook-form";
import { Field, fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const BOUNDARY_PLACEHOLDER = '{"type":"Polygon","coordinates":[[[81.45,6.33],[81.47,6.33],[81.47,6.35],[81.45,6.33]]]}';

interface BoundaryFieldProps {
  registration: UseFormRegisterReturn;
  error?: string;
  caption: string;
}

export function BoundaryField({ registration, error, caption }: BoundaryFieldProps) {
  return (
    <Field label="Boundary (GeoJSON polygon)" error={error}>
      <textarea
        {...registration}
        rows={5}
        spellCheck={false}
        placeholder={BOUNDARY_PLACEHOLDER}
        aria-invalid={!!error}
        className={cn(fieldClass(!!error), "h-auto min-h-[132px] resize-y py-2.5 font-mono text-[13px] leading-5")}
      />
      {!error && <span className="text-caption font-normal text-ink-muted">{caption}</span>}
    </Field>
  );
}
