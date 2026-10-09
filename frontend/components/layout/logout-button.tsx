"use client";

import { LogOut } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";

export function LogoutButton() {
  const logout = useLogout();
  return (
    <IconButton aria-label="Log out" onClick={logout}>
      <LogOut strokeWidth={1.8} />
    </IconButton>
  );
}
