"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, SecondaryButton } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { userErrorMessage, userSchema, type UserValues } from "@/lib/users/user-form";

interface UserFormProps {
  title: string;
  submitLabel: string;
  creating: boolean;
  defaultValues: UserValues;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: UserValues) => void;
  onClose: () => void;
}

export function UserForm({ title, submitLabel, creating, defaultValues, saving, error, onSubmit, onClose }: UserFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<UserValues>({
    resolver: zodResolver(userSchema(creating)),
    defaultValues,
  });

  return (
    <Modal title={title} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <input {...register("name")} placeholder="e.g. K. Bandara" aria-invalid={!!errors.name} className={fieldClass(!!errors.name)} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" autoComplete="off" {...register("email")} aria-invalid={!!errors.email} className={fieldClass(!!errors.email)} />
          </Field>
          <Field label="Phone (optional)" error={errors.phone?.message}>
            <input type="tel" {...register("phone")} aria-invalid={!!errors.phone} className={fieldClass(!!errors.phone)} />
          </Field>
          <Field label="Role" error={errors.role?.message}>
            <select {...register("role")} aria-invalid={!!errors.role} className={fieldClass(!!errors.role)}>
              <option value="">Choose a role</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} className={fieldClass(!!errors.password)} />
            {!creating && !errors.password && (
              <span className="text-caption font-normal text-ink-muted">Leave blank to keep the current password.</span>
            )}
          </Field>
          {!creating && (
            <label className="flex min-h-12 items-center gap-2 self-end text-body text-ink-body">
              <input type="checkbox" {...register("active")} className="m-0 size-4 accent-primary" />
              Active · can sign in
            </label>
          )}
        </div>
        {error && <p role="alert" className="m-0 text-body text-negative">{userErrorMessage(error)}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <Button type="submit" disabled={saving} className="h-10 px-[18px] disabled:opacity-60">
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
