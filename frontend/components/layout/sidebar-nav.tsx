"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";
import { useNavStore } from "@/lib/layout/store";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavChild, type NavItem } from "./nav-items";

const ACTIVE = "bg-lime font-medium text-ink hover:bg-lime";

function SubNav({ items, pathname }: { items: NavChild[]; pathname: string }) {
  return (
    <div className="ml-6 flex flex-col gap-0.5 border-l border-line-strong pl-3.5">
      {items.map((child) => {
        const active = pathname === child.href;
        return (
          <Link
            key={child.label}
            href={child.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex h-[38px] items-center rounded-md px-3 text-body text-ink-body hover:bg-surface-muted", active && ACTIVE)}
          >
            <span className="grow">{child.label}</span>
            <span className="text-caption text-ink-muted">{child.count}</span>
          </Link>
        );
      })}
    </div>
  );
}

const ENTRY = "flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 text-left text-nav text-ink-body hover:bg-surface-muted";

function NavGroup({ item, items, pathname }: { item: NavItem; items: NavChild[]; pathname: string }) {
  const Icon = item.icon;
  const open = useNavStore((state) => !state.collapsed[item.label]);
  const toggle = useNavStore((state) => state.toggle);
  const childActive = items.some((child) => child.href === pathname);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(item.label)}
        className={cn(ENTRY, childActive && "font-medium text-ink")}
      >
        <Icon className="size-5 shrink-0" strokeWidth={1.8} />
        <span className="grow">{item.label}</span>
        <Chevron className="size-4" strokeWidth={2} />
      </button>
      {open && <SubNav items={items} pathname={pathname} />}
    </>
  );
}

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  if (item.children) return <NavGroup item={item} items={item.children} pathname={pathname} />;
  const Icon = item.icon;
  const active = pathname === item.href;
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={cn(ENTRY, active && ACTIVE)}>
      <Icon className="size-5 shrink-0" strokeWidth={1.8} />
      <span className="grow">{item.label}</span>
      {item.badge !== undefined && (
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-coral px-1.5 text-caption font-semibold text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const items = NAV_ITEMS.filter((item) => !item.roles || (role !== undefined && item.roles.includes(role)));
  return (
    <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
      {items.map((item) => (
        <NavEntry key={item.label} item={item} pathname={pathname} />
      ))}
    </div>
  );
}
