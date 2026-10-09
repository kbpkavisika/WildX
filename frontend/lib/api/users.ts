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

const parkSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type AdminUserResponse = z.infer<typeof userSchema>;
export type ParkOption = z.infer<typeof parkSchema>;

export interface AdminUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  parkId: number | null;
  active: boolean;
}

const USERS_PATH = "/admin/users";

export function fetchUsers(): Promise<AdminUserResponse[]> {
  return apiGet(USERS_PATH, z.array(userSchema));
}

export function fetchParks(): Promise<ParkOption[]> {
  return apiGet("/admin/parks", z.array(parkSchema));
}

export function createUser(request: AdminUserRequest): Promise<AdminUserResponse> {
  return apiPost(USERS_PATH, request, userSchema);
}

export function updateUser(userId: number, request: AdminUserRequest): Promise<AdminUserResponse> {
  return apiPut(`${USERS_PATH}/${userId}`, request, userSchema);
}

export function deactivateUser(userId: number): Promise<void> {
  return apiDelete(`${USERS_PATH}/${userId}`);
}
