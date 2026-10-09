"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RouteForm } from "@/components/patrols/route-form";
import { RoutesTable } from "@/components/patrols/routes-table";
import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCan } from "@/hooks/use-can";
import { useRoutes } from "@/hooks/use-routes";
import { apiErrorMessage } from "@/lib/api/client";
import { counted } from "@/lib/devices/mappers";
import { EMPTY_ROUTE, toRouteValues } from "@/lib/patrols/route-form";
import { useRoutesPage } from "@/lib/patrols/store";
import type { RouteRow } from "@/lib/patrols/types";

export default function RoutesPage() {
  const { signedIn, isPending, isError, routes, rows, save, remove } = useRoutes();
  const { formOpen, editingId, openNew, openEdit, close } = useRoutesPage();
  const canManage = useCan("route.create");
  const editing = routes.find((route) => route.id === editingId) ?? null;

  const openForm = (id: number | null) => {
    save.reset();
    remove.reset();
    if (id === null) openNew();
    else openEdit(id);
  };

  const confirmDelete = (row: RouteRow) => {
    if (window.confirm(`Delete ${row.name}? It can no longer be assigned. Past patrols keep it.`)) remove.mutate(row.id);
  };

  return (
    <>
      <PageHeader
        title="Routes"
        subtitle={rows && <><strong className="font-semibold text-ink">{counted(rows.length, "route", "routes")}</strong> in this park.</>}
        action={
          <Can permission="route.create">
            <Button onClick={() => openForm(null)} disabled={!signedIn} aria-haspopup="dialog" className="disabled:opacity-60">
              <Plus className="size-[18px]" strokeWidth={2} />
              New route
            </Button>
          </Can>
        }
      />
      {formOpen && (
        <RouteForm
          key={editingId ?? "new"}
          title={editing ? `Edit ${editing.name}` : "New route"}
          submitLabel={editing ? "Save changes" : "Create route"}
          defaultValues={editing ? toRouteValues(editing) : EMPTY_ROUTE}
          saving={save.isPending}
          error={save.error}
          onSubmit={(values) => save.mutate({ routeId: editingId, values }, { onSuccess: close })}
          onClose={close}
        />
      )}
      {!signedIn && <p className="text-body text-ink-muted">Sign in to see routes.</p>}
      {signedIn && isPending && <p className="text-body text-ink-muted">Loading routes…</p>}
      {isError && <p className="text-body text-negative">Could not load routes.</p>}
      {remove.isError && <p role="alert" className="text-body text-negative">{apiErrorMessage(remove.error)}</p>}
      {rows && (
        <Card label="Routes">
          <RoutesTable
            rows={rows}
            canManage={canManage}
            deletingId={remove.isPending ? (remove.variables ?? null) : null}
            onEdit={openForm}
            onDelete={confirmDelete}
          />
        </Card>
      )}
    </>
  );
}
