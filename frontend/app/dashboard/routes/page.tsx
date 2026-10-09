"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NewRouteForm } from "@/components/patrols/new-route-form";
import { RoutesTable } from "@/components/patrols/routes-table";
import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRoutes } from "@/hooks/use-routes";
import { counted } from "@/lib/devices/mappers";
import { useRoutesPage } from "@/lib/patrols/store";

export default function RoutesPage() {
  const { signedIn, isPending, isError, rows, create } = useRoutes();
  const { formOpen, setFormOpen } = useRoutesPage();

  const openForm = () => {
    create.reset();
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Routes"
        subtitle={rows && <><strong className="font-semibold text-ink">{counted(rows.length, "route", "routes")}</strong> in this park.</>}
        action={
          <Can permission="route.create">
            <Button onClick={openForm} disabled={!signedIn} aria-haspopup="dialog" className="disabled:opacity-60">
              <Plus className="size-[18px]" strokeWidth={2} />
              New route
            </Button>
          </Can>
        }
      />
      {formOpen && <NewRouteForm create={create} onClose={() => setFormOpen(false)} />}
      {!signedIn && <p className="text-body text-ink-muted">Sign in to see routes.</p>}
      {signedIn && isPending && <p className="text-body text-ink-muted">Loading routes…</p>}
      {isError && <p className="text-body text-negative">Could not load routes.</p>}
      {rows && (
        <Card label="Routes">
          <RoutesTable rows={rows} />
        </Card>
      )}
    </>
  );
}
