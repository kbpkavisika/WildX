import { EllipsisVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoreButtonProps {
  label: string;
  className?: string;
}

export function MoreButton({ label, className }: MoreButtonProps) {
  return (
    <button aria-label={label} className={cn("flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink", className)}>
      <EllipsisVertical className="size-4" fill="currentColor" />
    </button>
  );
}
