import Link from "next/link";

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-4 text-label text-ink hover:bg-surface-muted"
    >
      {children}
    </Link>
  );
}
