import { z } from "zod";
import { useSession } from "@/lib/auth/store";
import { API_TIMEOUT_MS } from "@/lib/constants";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const UNAUTHORIZED = 401;
const SERVER_ERROR = 500;
const REQUEST_TIMEOUT = 408;
const TOO_MANY_REQUESTS = 429;

const errorSchema = z.object({ error: z.string() });

export class ApiError extends Error {
  constructor(readonly status: number, message?: string) {
    super(message ?? `Request failed with status ${status}`);
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Could not reach WildX. Try again.");
  }
}

export function apiErrorMessage(error: Error): string {
  return error instanceof ApiError ? error.message : "Could not reach WildX. Try again.";
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (!(error instanceof ApiError)) return false;
  return error.status >= SERVER_ERROR || error.status === REQUEST_TIMEOUT || error.status === TOO_MANY_REQUESTS;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === UNAUTHORIZED;
}

export function authHeaders(): Record<string, string> {
  const token = useSession.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const headers = new Headers(init?.headers);
  Object.entries(authHeaders()).forEach(([name, value]) => headers.set(name, value));
  try {
    return await fetch(apiUrl(path), { ...init, headers, signal: controller.signal });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }
}

async function request<T extends z.ZodType>(path: string, schema: T, init?: RequestInit): Promise<z.infer<T>> {
  const response = await send(path, init);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === UNAUTHORIZED) useSession.getState().clearSession();
    throw new ApiError(response.status, errorSchema.safeParse(body).data?.error);
  }
  return schema.parse(body);
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function apiGet<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  return request(path, schema);
}

export function apiPost<T extends z.ZodType>(path: string, body: unknown, schema: T): Promise<z.infer<T>> {
  return request(path, schema, jsonInit("POST", body));
}

export function apiPostForm<T extends z.ZodType>(path: string, body: FormData, schema: T): Promise<z.infer<T>> {
  return request(path, schema, { method: "POST", body });
}
