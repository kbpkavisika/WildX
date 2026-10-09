import { z } from "zod";
import { ApiError } from "@/lib/api/client";

export class NotRangerError extends Error {
  constructor() {
    super("This app is for rangers. Use the WildX web console.");
  }
}

export const signInSchema = z.object({
  email: z.email("Enter a valid work email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const EMPTY_SIGN_IN: SignInValues = { email: "", password: "", remember: true };

export function signInErrorMessage(error: Error): string {
  return error instanceof ApiError || error instanceof NotRangerError ? error.message : "Could not reach WildX. Try again.";
}
