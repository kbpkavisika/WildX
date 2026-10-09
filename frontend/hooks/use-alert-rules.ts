import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAlertRule, saveAlertRule } from "@/lib/api/alert-rules";
import { useAuthStore } from "@/lib/auth/store";
import type { ZoneType } from "@/lib/enums";
import { toRuleRequest, type RuleFormValues } from "@/lib/zones/rule-form";
import { useZonesPage } from "@/lib/zones/store";

interface SaveRule {
  zoneType: ZoneType;
  values: RuleFormValues;
}

export function useAlertRules() {
  const queryClient = useQueryClient();
  const parkId = useAuthStore((state) => state.user?.parkId ?? null);
  const closeRule = useZonesPage((state) => state.closeRule);
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["parks", parkId, "alert-rules"] });
    closeRule();
  };

  const save = useMutation({
    mutationFn: ({ zoneType, values }: SaveRule) => saveAlertRule(parkId as number, zoneType, toRuleRequest(values)),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (zoneType: ZoneType) => deleteAlertRule(parkId as number, zoneType),
    onSuccess: refresh,
  });

  return { save, remove };
}
