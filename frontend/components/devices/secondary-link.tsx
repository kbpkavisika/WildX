import Link from "next/link";
import { cn } from "@/lib/utils";

export function SecondaryLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-4 text-label text-ink hover:bg-surface-muted", className)}
      {...props}
    />
  );
}
