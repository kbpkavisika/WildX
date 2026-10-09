import { RangerGuard } from "@/components/auth/auth-guard";
import { Logo } from "@/components/layout/logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { RangerNav } from "@/components/layout/ranger-nav";

export default function RangerLayout({ children }: LayoutProps<"/ranger">) {
  return (
    <RangerGuard>
      <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col bg-background text-body text-ink">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <Logo className="px-0" />
          <LogoutButton />
        </header>
        <main className="flex flex-1 flex-col gap-5 p-4">{children}</main>
        <RangerNav />
      </div>
    </RangerGuard>
  );
}
