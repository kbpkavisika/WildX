import { z } from "zod";
import { ROLES, type Role } from "@/lib/enums";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.enum(ROLES),
  parkId: z.number().nullable(),
  parkName: z.string().nullable(),
  active: z.boolean(),
});

export type UserAccountResponse = z.infer<typeof userSchema>;

export interface UserAccountRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  active: boolean;
}

const USERS_PATH = "/users";

export function fetchUsers(): Promise<UserAccountResponse[]> {
  return apiGet(USERS_PATH, z.array(userSchema));
}

export function createUser(request: UserAccountRequest): Promise<UserAccountResponse> {
  return apiPost(USERS_PATH, request, userSchema);
}

export function updateUser(userId: number, request: UserAccountRequest): Promise<UserAccountResponse> {
  return apiPut(`${USERS_PATH}/${userId}`, request, userSchema);
}

export function deactivateUser(userId: number): Promise<void> {
  return apiDelete(`${USERS_PATH}/${userId}`);
}
