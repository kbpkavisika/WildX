import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { FormPanel } from "@/components/ui/form-panel";
import { TEXT_MAX_LENGTH } from "@/lib/constants";
import { declineSchema, EMPTY_DECLINE, type DeclineValues } from "@/lib/dispatch/task-forms";

interface DeclineFormProps {
  onSubmit: (reason: string | null) => void;
  onCancel: () => void;
}

export function DeclineForm({ onSubmit, onCancel }: DeclineFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<DeclineValues>({
    resolver: zodResolver(declineSchema),
    defaultValues: EMPTY_DECLINE,
  });

  return (
    <FormPanel>
      <Controller
        control={control}
        name="reason"
        render={({ field }) => (
          <Field label="Reason (optional)" error={errors.reason?.message}>
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.reason}
              multiline
              maxLength={TEXT_MAX_LENGTH}
              placeholder="e.g. Already responding to another call"
            />
          </Field>
        )}
      />
      <Button label="Decline dispatch" onPress={handleSubmit((values) => onSubmit(values.reason === "" ? null : values.reason))} />
      <SecondaryButton label="Cancel" onPress={onCancel} />
    </FormPanel>
  );
}
