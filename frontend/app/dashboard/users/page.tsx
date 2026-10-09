"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserForm } from "@/components/users/user-form";
import { UsersTable } from "@/components/users/users-table";
import { useUsers } from "@/hooks/use-users";
import { useUsersPage } from "@/lib/users/store";
import type { UserRow } from "@/lib/users/types";
import { EMPTY_USER, toUserValues, userErrorMessage } from "@/lib/users/user-form";

export default function UsersPage() {
  const { canManage, isPending, isError, users, view, save, remove } = useUsers();
  const { formOpen, editingId, openNew, openEdit, close } = useUsersPage();
  const editing = users.find((user) => user.id === editingId) ?? null;

  const openForm = (id: number | null) => {
    save.reset();
    if (id === null) openNew();
    else openEdit(id);
  };

  const confirmDeactivate = (row: UserRow) => {
    if (window.confirm(`Deactivate ${row.name}? They will no longer be able to sign in.`)) remove.mutate(row.id);
  };

  if (!canManage) return <p className="text-body text-ink-muted">Only park managers can manage users.</p>;

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={view && <><strong>{view.total} users</strong>, {view.inactiveCount} deactivated.</>}
        action={
          <Button onClick={() => openForm(null)} aria-haspopup="dialog">
            <Plus className="size-[18px]" strokeWidth={2} />
            New user
          </Button>
        }
      />
      {formOpen && (
        <UserForm
          key={editingId ?? "new"}
          title={editing ? `Edit ${editing.name}` : "New user"}
          submitLabel={editing ? "Save changes" : "Create user"}
          creating={!editing}
          defaultValues={editing ? toUserValues(editing) : EMPTY_USER}
          saving={save.isPending}
          error={save.error}
          onSubmit={(values) => save.mutate({ userId: editingId, values }, { onSuccess: close })}
          onClose={close}
        />
      )}
      {isPending && <p className="text-body text-ink-muted">Loading users…</p>}
      {isError && <p className="text-body text-negative">Could not load users.</p>}
      {remove.isError && <p role="alert" className="text-body text-negative">{userErrorMessage(remove.error)}</p>}
      {view && (
        <Card label="Users">
          <UsersTable
            rows={view.rows}
            deactivatingId={remove.isPending ? (remove.variables ?? null) : null}
            onEdit={(id) => openForm(id)}
            onDeactivate={confirmDeactivate}
          />
        </Card>
      )}
    </>
  );
}
