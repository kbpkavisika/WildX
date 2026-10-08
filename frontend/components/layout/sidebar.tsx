import { Logo } from "./logo";
import { ParkSwitcher } from "./park-switcher";
import { SidebarNav } from "./sidebar-nav";
import { UserCard } from "./user-card";

export function Sidebar() {
  return (
    <nav aria-label="Main" className="flex flex-col gap-5 border-b border-line px-4 py-[22px] md:sticky md:top-0 md:h-screen md:w-sidebar md:shrink-0 md:border-r md:border-b-0">
      <Logo />
      <ParkSwitcher />
      <SidebarNav />
      <UserCard />
    </nav>
  );
}
