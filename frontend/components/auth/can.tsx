"use client";

import { useCan } from "@/hooks/use-can";
import type { Permission } from "@/lib/auth/permissions";

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
}

export function Can({ permission, children }: CanProps) {
  return useCan(permission) ? children : null;
}
