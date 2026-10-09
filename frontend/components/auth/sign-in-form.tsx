"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/ui/field";
import { useLogin } from "@/hooks/use-login";
import { EMPTY_SIGN_IN, signInErrorMessage, signInSchema, type SignInValues } from "@/lib/auth/sign-in-form";

export function SignInForm() {
  const signIn = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: EMPTY_SIGN_IN,
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => signIn.mutate(values))}
      className="flex w-full max-w-[380px] flex-col gap-5"
    >
      <Logo className="px-0" />
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-page-title">Sign in</h1>
        <p className="m-0 text-[15px] text-ink-body">Welcome back. Sign in to the park console.</p>
      </div>
      <div className="border-t border-line" />
      <Field label="Work email" error={errors.email?.message}>
        <input type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} className={fieldClass(!!errors.email)} />
      </Field>
      <Field
        label={
          <span className="flex">
            <span className="mr-auto">Password</span>
            <a href="#" className="text-primary hover:text-primary-hover">Forgot password?</a>
          </span>
        }
        error={errors.password?.message}
      >
        <input type="password" autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} className={fieldClass(!!errors.password)} />
      </Field>
      <label className="flex items-center gap-2 text-body text-ink-body">
        <input type="checkbox" defaultChecked className="m-0 size-4 accent-primary" />
        Keep me signed in on this device
      </label>
      {signIn.isError && <p role="alert" className="m-0 text-caption text-negative">{signInErrorMessage(signIn.error)}</p>}
      <Button type="submit" disabled={signIn.isPending} className="w-full justify-center text-[15px] disabled:opacity-60">
        {signIn.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="m-0 text-center text-body text-ink-muted">
        Accounts are created by your park manager.
      </p>
    </form>
  );
}
