import { StyleSheet, View } from "react-native";
import { Button, SecondaryButton } from "@/components/ui/button";
import type { DispatchView } from "@/lib/dispatch/mappers";
import type { TaskAction } from "@/lib/dispatch/store";
import { space } from "@/lib/theme";
import { CompleteForm } from "./complete-form";
import { DeclineForm } from "./decline-form";

interface DispatchActionsProps {
  view: DispatchView;
  openAction: TaskAction | null;
  onOpenAction: (action: TaskAction | null) => void;
  onAcknowledge: () => void;
  onComplete: (outcome: string) => void;
  onDecline: (reason: string | null) => void;
}

export function DispatchActions({ view, openAction, onOpenAction, onAcknowledge, onComplete, onDecline }: DispatchActionsProps) {
  const close = () => onOpenAction(null);

  if (openAction === "complete" && view.canComplete) return <CompleteForm onSubmit={onComplete} onCancel={close} />;
  if (openAction === "decline" && view.canDecline) return <DeclineForm onSubmit={onDecline} onCancel={close} />;
  if (!view.canAcknowledge && !view.canComplete && !view.canDecline) return null;

  return (
    <View style={styles.stack}>
      {view.canAcknowledge && <Button label="Acknowledge" onPress={onAcknowledge} />}
      {view.canComplete && <Button label="Complete" onPress={() => onOpenAction("complete")} />}
      {view.canDecline && <SecondaryButton label="Decline" onPress={() => onOpenAction("decline")} />}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[3] },
});
