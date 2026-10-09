import { Pencil, UserX } from "lucide-react";
import { QuietButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { UserRow } from "@/lib/users/types";
import { cn } from "@/lib/utils";

const ROW = "grid grid-cols-[1.4fr_1.6fr_1.2fr_0.8fr_180px] items-center gap-3";
const COLUMNS = ["Name", "Email", "Role", "Status"];

interface UsersTableProps {
  rows: UserRow[];
  deactivatingId: number | null;
  onEdit: (id: number) => void;
  onDeactivate: (row: UserRow) => void;
}

export function UsersTable({ rows, deactivatingId, onEdit, onDeactivate }: UsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Users" className="flex min-w-[760px] flex-col">
        <div role="row" className={cn(ROW, "border-b border-line pb-2.5 text-caption text-ink-muted")}>
          {COLUMNS.map((column) => (
            <span key={column} role="columnheader">{column}</span>
          ))}
          <span role="columnheader" className="sr-only">Actions</span>
        </div>
        {rows.length === 0 && <p className="m-0 py-6 text-body text-ink-muted">No users yet.</p>}
        {rows.map((user) => (
          <div key={user.id} role="row" className={cn(ROW, "border-b border-line-soft py-3 text-body text-ink")}>
            <span role="cell" className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{user.name}</span>
              {user.phone && <span className="text-caption text-ink-muted">{user.phone}</span>}
            </span>
            <span role="cell" className="truncate">{user.email}</span>
            <span role="cell">{user.role}</span>
            <span role="cell"><Chip tone={user.status.tone}>{user.status.label}</Chip></span>
            <span role="cell" className="flex justify-end gap-2">
              <QuietButton aria-label={`Edit ${user.name}`} onClick={() => onEdit(user.id)}>
                <Pencil />
                Edit
              </QuietButton>
              {user.canDeactivate && (
                <QuietButton
                  aria-label={`Deactivate ${user.name}`}
                  disabled={deactivatingId === user.id}
                  onClick={() => onDeactivate(user)}
                  className="disabled:opacity-60"
                >
                  <UserX />
                  Deactivate
                </QuietButton>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
