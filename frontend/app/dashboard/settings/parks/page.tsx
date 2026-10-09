"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { FormPanel } from "@/components/devices/form-panel";
import { PageHeader } from "@/components/layout/page-header";
import { ParkForm } from "@/components/parks/park-form";
import { ParkList } from "@/components/parks/park-list";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useCan } from "@/hooks/use-can";
import { useParks } from "@/hooks/use-parks";
import { apiErrorMessage } from "@/lib/api/client";
import { counted } from "@/lib/devices/mappers";

export default function ParksPage() {
  const canManage = useCan("settings.manage");
  const { parks, current, isPending, isError, switchTo, create } = useParks();
  const [formOpen, setFormOpen] = useState(false);

  if (!canManage) return <p className="text-body text-ink-muted">Only park managers can manage parks.</p>;

  const openForm = () => {
    create.reset();
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Parks"
        subtitle={parks.length > 0 && <><strong className="font-semibold text-ink">{counted(parks.length, "park", "parks")}</strong> you manage.</>}
        action={
          <Button onClick={openForm} aria-expanded={formOpen}>
            <Plus className="size-[18px]" strokeWidth={2} />
            New park
          </Button>
        }
      />
      {formOpen && (
        <FormPanel title="New park" onClose={() => setFormOpen(false)}>
          <ParkForm
            saving={create.isPending}
            error={create.error}
            onSubmit={(values) => create.mutate(values, { onSuccess: () => setFormOpen(false) })}
            onClose={() => setFormOpen(false)}
          />
        </FormPanel>
      )}
      {isPending && <p className="text-body text-ink-muted">Loading parks…</p>}
      {isError && <p className="text-body text-negative">Could not load parks.</p>}
      {switchTo.isError && <p role="alert" className="text-body text-negative">{apiErrorMessage(switchTo.error)}</p>}
      {parks.length > 0 && (
        <Card label="Parks">
          <CardTitle>Parks</CardTitle>
          <ParkList parks={parks} currentId={current?.id ?? null} switching={switchTo.isPending} onSwitch={(id) => switchTo.mutate(id)} />
        </Card>
      )}
    </>
  );
}
