import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-9 items-center gap-2.5 px-2", className)}>
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-md bg-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4C11 4.5 19 11 20 20C13 19.5 5 13 4 4Z" className="fill-lime" />
          <path d="M20 4C19.5 11 13 19 4 20C4.5 13 11 5 20 4Z" className="fill-lime" fillOpacity="0.6" />
        </svg>
      </div>
      <span className="text-wordmark text-ink">
        Wild<span className="font-bold text-primary">X</span>
      </span>
    </div>
  );
}
