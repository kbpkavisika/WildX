import { cn } from "@/lib/utils";

interface CardProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

export function Card({ label, className, children }: CardProps) {
  return (
    <section aria-label={label} className={cn("flex min-w-0 flex-col gap-[18px] rounded-xl border border-line bg-card px-6 py-[22px]", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="m-0 text-card-title">{children}</h2>;
}
