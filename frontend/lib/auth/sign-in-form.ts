import { z } from "zod";
import { ApiError } from "@/lib/api/client";

export const signInSchema = z.object({
  email: z.email("Enter a valid work email"),
  password: z.string().min(1, "Enter your password"),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const EMPTY_SIGN_IN: SignInValues = { email: "", password: "" };

export function signInErrorMessage(error: Error): string {
  return error instanceof ApiError ? error.message : "Could not reach WildX. Try again.";
}
