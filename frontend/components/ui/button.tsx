import Link from "next/link";
import { cn } from "@/lib/utils";

const PRIMARY = "inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 text-label text-primary-foreground hover:bg-primary-hover";

export function Button({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" className={cn(PRIMARY, className)} {...props} />;
}

export function ButtonLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn(PRIMARY, className)} {...props} />;
}

export function SecondaryButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-4 text-label text-ink hover:bg-surface-muted", className)}
      {...props}
    />
  );
}

export function QuietButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-line bg-surface-muted px-3 text-field-label font-normal text-ink [&_svg]:size-3.5", className)}
      {...props}
    />
  );
}

export function IconButton({ className, ...props }: React.ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type="button"
      className={cn("relative flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink [&_svg]:size-[18px]", className)}
      {...props}
    />
  );
}
