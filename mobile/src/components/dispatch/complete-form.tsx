import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { FormPanel } from "@/components/ui/form-panel";
import { Select } from "@/components/ui/select";
import { TEXT_MAX_LENGTH } from "@/lib/constants";
import { completeSchema, DISPATCH_OUTCOMES, EMPTY_COMPLETE, toOutcomeText, type CompleteValues } from "@/lib/dispatch/task-forms";

const OUTCOME_OPTIONS = DISPATCH_OUTCOMES.map((outcome) => ({ value: outcome, label: outcome }));

interface CompleteFormProps {
  onSubmit: (outcome: string) => void;
  onCancel: () => void;
}

export function CompleteForm({ onSubmit, onCancel }: CompleteFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<CompleteValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: EMPTY_COMPLETE,
  });

  return (
    <FormPanel>
      <Controller
        control={control}
        name="outcome"
        render={({ field }) => (
          <Field label="Outcome" error={errors.outcome?.message}>
            <Select title="Outcome" value={field.value} options={OUTCOME_OPTIONS} placeholder="Choose an outcome" invalid={!!errors.outcome} onChange={field.onChange} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <Field label="Note (optional)" error={errors.note?.message}>
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.note}
              multiline
              maxLength={TEXT_MAX_LENGTH}
              placeholder="e.g. Removed 3 snares, handed wire to station"
            />
          </Field>
        )}
      />
      <Button label="Complete" onPress={handleSubmit((values) => onSubmit(toOutcomeText(values)))} />
      <SecondaryButton label="Cancel" onPress={onCancel} />
    </FormPanel>
  );
}
