import { z } from "zod";
import { useAuthStore } from "@/lib/auth/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const errorSchema = z.object({ error: z.string() });

export class ApiError extends Error {
  constructor(readonly status: number, message?: string) {
    super(message ?? `Request failed with status ${status}`);
  }
}

async function request<T extends z.ZodType>(path: string, schema: T, init?: RequestInit): Promise<z.infer<T>> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, errorSchema.safeParse(body).data?.error);
  return schema.parse(body);
}

export function apiGet<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  return request(path, schema);
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function apiPost<T extends z.ZodType>(path: string, body: unknown, schema: T): Promise<z.infer<T>> {
  return request(path, schema, jsonInit("POST", body));
}

export function apiPut<T extends z.ZodType>(path: string, body: unknown, schema: T): Promise<z.infer<T>> {
  return request(path, schema, jsonInit("PUT", body));
}

export async function apiDelete(path: string): Promise<void> {
  await request(path, z.null(), { method: "DELETE" });
}
