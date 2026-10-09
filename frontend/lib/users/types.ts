import type { ChipView } from "@/lib/incidents/types";

export interface UserRow {
  id: number;
  name: string;
  phone: string | null;
  email: string;
  role: string;
  park: string | null;
  status: ChipView;
  active: boolean;
  canDeactivate: boolean;
}

export interface UsersView {
  rows: UserRow[];
  total: number;
  inactiveCount: number;
}
