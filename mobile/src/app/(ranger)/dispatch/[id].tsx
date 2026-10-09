import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { DispatchActions } from "@/components/dispatch/dispatch-actions";
import { IncidentFacts } from "@/components/incidents/incident-facts";
import { LocationPicker } from "@/components/incidents/location-picker";
import { BackLink } from "@/components/ui/back-link";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FactList } from "@/components/ui/fact-list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Screen } from "@/components/ui/screen";
import { useDispatchTask } from "@/hooks/use-dispatch-task";
import { useDispatchTaskPage, type TaskAction } from "@/lib/dispatch/store";

export default function DispatchTaskScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { isPending, isError, view, incident, photoSource, sectors, error, acknowledge, complete, decline } = useDispatchTask(id);
  const { open, notice, openAction, close, reset } = useDispatchTaskPage();
  const action = open?.dispatchId === id ? open.action : null;

  useEffect(() => {
    reset();
  }, [id, reset]);
  const setAction = (next: TaskAction | null) => (next === null ? close() : openAction(id, next));

  return (
    <Screen>
      <BackLink label="Tasks" href="/tasks" />
      {isPending && <Notice tone="muted">Loading dispatch…</Notice>}
      {isError && <Notice tone="negative">Could not load this dispatch. Retrying.</Notice>}
      {view && (
        <>
          <PageHeader title={view.title} badge={<Chip chip={view.status} />} />
          <FactList facts={view.facts} />
          {notice && <Notice tone="positive">{notice}</Notice>}
          {error && <Notice tone="negative">{error}</Notice>}
          <DispatchActions
            view={view}
            openAction={action}
            onOpenAction={setAction}
            onAcknowledge={acknowledge}
            onComplete={complete}
            onDecline={decline}
          />
          {incident && (
            <>
              <Card>
                <CardTitle>Location</CardTitle>
                <LocationPicker value={incident.position} sectors={sectors} />
              </Card>
              <Card>
                <CardTitle>Incident</CardTitle>
                <IncidentFacts facts={incident.facts} photoSource={photoSource} />
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
