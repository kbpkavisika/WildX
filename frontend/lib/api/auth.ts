import { z } from "zod";
import { ROLES } from "@/lib/enums";
import { apiPost } from "./client";

export const sessionUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  parkId: z.number().nullable(),
});

const loginSchema = z.object({
  token: z.string(),
  user: sessionUserSchema,
});

export type LoginResponse = z.infer<typeof loginSchema>;

export interface LoginRequest {
  email: string;
  password: string;
}

export function login(request: LoginRequest): Promise<LoginResponse> {
  return apiPost("/auth/login", request, loginSchema);
}
