import type { UserAccountResponse } from "@/lib/api/users";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { ChipView } from "@/lib/incidents/types";
import type { UserRow, UsersView } from "./types";

const ACTIVE_DISPLAY: ChipView = { tone: "positive", label: "Active" };
const INACTIVE_DISPLAY: ChipView = { tone: "neutral", label: "Deactivated" };

function toUserRow(user: UserAccountResponse, currentUserId: number | null): UserRow {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: ROLE_LABELS[user.role],
    status: user.active ? ACTIVE_DISPLAY : INACTIVE_DISPLAY,
    active: user.active,
    canDeactivate: user.active && user.id !== currentUserId,
  };
}

export function toUsersView(users: UserAccountResponse[], currentUserId: number | null): UsersView {
  const inactiveCount = users.filter((user) => !user.active).length;
  return { rows: users.map((user) => toUserRow(user, currentUserId)), total: users.length, inactiveCount };
}
