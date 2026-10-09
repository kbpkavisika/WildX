"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { QuietButton } from "@/components/ui/button";
import { useAlertRules } from "@/hooks/use-alert-rules";
import type { AlertRuleResponse } from "@/lib/api/alert-rules";
import { EMPTY_RULE, toRuleValues } from "@/lib/zones/rule-form";
import { useZonesPage } from "@/lib/zones/store";
import type { RuleRow } from "@/lib/zones/types";
import { RuleForm } from "./rule-form";

interface RulesCardProps {
  rows: RuleRow[];
  rules: AlertRuleResponse[];
  canManage: boolean;
}

function RuleSummaryRow({ row, canManage, onOpen }: { row: RuleRow; canManage: boolean; onOpen: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line-soft py-3 last:border-b-0">
      <span className="flex min-w-0 flex-[1_1_180px] flex-col gap-1">
        <span className="inline-flex items-center gap-2 text-label text-ink">
          {row.label}
          {row.severity && <Chip tone={row.severity.tone} className="whitespace-nowrap">{row.severity.label}</Chip>}
        </span>
        <span className="text-caption text-ink-muted">{row.caption}</span>
      </span>
      {canManage && (
        <QuietButton onClick={onOpen} aria-label={`${row.severity ? "Edit" : "Add"} ${row.label} rule`}>
          {row.severity ? "Edit" : "Add rule"}
        </QuietButton>
      )}
    </div>
  );
}

export function RulesCard({ rows, rules, canManage }: RulesCardProps) {
  const ruleType = useZonesPage((state) => state.ruleType);
  const openRule = useZonesPage((state) => state.openRule);
  const closeRule = useZonesPage((state) => state.closeRule);
  const { save, remove } = useAlertRules();

  return (
    <Card label="Alert rules" className="flex-[2_1_340px]">
      <div className="flex flex-col gap-1">
        <CardTitle>Alert rules</CardTitle>
        <p className="m-0 text-caption text-ink-muted">One rule per zone type. Breaches between 18:00 and 06:00 go up one level.</p>
      </div>
      <div className="flex flex-col">
        {rows.map((row) => {
          if (!canManage || row.zoneType !== ruleType) {
            return (
              <RuleSummaryRow
                key={row.zoneType}
                row={row}
                canManage={canManage}
                onOpen={() => {
                  save.reset();
                  remove.reset();
                  openRule(row.zoneType);
                }}
              />
            );
          }
          const rule = rules.find((item) => item.zoneType === row.zoneType);
          const confirmRemove = () => {
            if (window.confirm(`Remove the ${row.label} rule? ${row.label} zones will stop raising alerts.`)) remove.mutate(row.zoneType);
          };
          return (
            <div key={row.zoneType} className="border-b border-line-soft py-3 last:border-b-0">
              <RuleForm
                title={`${row.label} rule`}
                defaultValues={rule ? toRuleValues(rule) : EMPTY_RULE}
                canRemove={!!rule}
                busy={save.isPending || remove.isPending}
                error={save.error ?? remove.error}
                onSubmit={(values) => save.mutate({ zoneType: row.zoneType, values })}
                onRemove={confirmRemove}
                onClose={closeRule}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
