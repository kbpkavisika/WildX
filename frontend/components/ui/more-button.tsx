import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MoreButtonProps {
  label: string;
  className?: string;
  href?: string;
  disabled?: boolean;
}

const BASE = "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink";

export function MoreButton({ label, className, href, disabled }: MoreButtonProps) {
  const icon = <EllipsisVertical className="size-4" fill="currentColor" />;
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cn(BASE, "hover:bg-surface-muted", className)}>
        {icon}
      </Link>
    );
  }
  return (
    <button aria-label={label} disabled={disabled} className={cn(BASE, "disabled:cursor-not-allowed disabled:opacity-40", className)}>
      {icon}
    </button>
  );
}
