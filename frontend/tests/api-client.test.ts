import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useAuthStore } from "@/lib/auth/store";
import { ApiError, apiDelete, apiErrorMessage, apiGet, apiGetBlob, apiPatch, apiPost, apiPostForm, apiPut } from "@/lib/api/client";

const user = { id: 1, name: "Ranger", email: "ranger@wildx.lk", role: "RANGER", parkId: 1 } as const;
const schema = z.object({ id: z.number() });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  useAuthStore.getState().clearSession();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("CMN-01 API transport", () => {
  it("validates successful JSON and adds the bearer token", async () => {
    useAuthStore.getState().setSession("token", user);
    respond({ id: 3, ignored: true });
    expect(await apiGet("/parks", schema)).toEqual({ id: 3 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/parks$/);
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
  });

  it("allows requests without a session", async () => {
    respond({ id: 2 });
    await apiGet("/public/reports", schema);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
  });

  it.each([["POST", apiPost], ["PUT", apiPut], ["PATCH", apiPatch]] as const)("serializes %s bodies", async (method, send) => {
    respond({ id: 2 });
    expect(await send("/resource", { name: "Yala" }, schema)).toEqual({ id: 2 });
    const init = fetchMock.mock.calls[0][1];
    expect(init?.method).toBe(method);
    expect(init?.body).toBe('{"name":"Yala"}');
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("sends multipart bodies without setting a JSON content type", async () => {
    respond({ id: 4 });
    const form = new FormData();
    form.append("photo", new File(["photo"], "photo.jpg"));
    await apiPostForm("/incidents", form, schema);
    const init = fetchMock.mock.calls[0][1];
    expect(init?.body).toBe(form);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("accepts an empty delete response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiDelete("/routes/4")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("rejects a response that violates its schema", async () => {
    respond({ id: "wrong" });
    await expect(apiGet("/parks", schema)).rejects.toBeInstanceOf(z.ZodError);
  });

  it("rejects malformed JSON instead of returning unchecked data", async () => {
    fetchMock.mockResolvedValue(new Response("not json"));
    await expect(apiGet("/parks", schema)).rejects.toBeInstanceOf(z.ZodError);
  });

  it("preserves the backend error message and status", async () => {
    respond({ error: "Park not found" }, 404);
    await expect(apiGet("/parks/9", schema)).rejects.toMatchObject({ status: 404, message: "Park not found" });
  });

  it.each([null, { message: "unexpected" }])("uses a fallback for an unrecognized error body %j", async (body) => {
    respond(body, 500);
    await expect(apiGet("/parks", schema)).rejects.toMatchObject({ status: 500, message: "Request failed with status 500" });
  });

  it("clears the session on an unauthorized JSON response", async () => {
    useAuthStore.getState().setSession("expired", user);
    respond({ error: "Expired" }, 401);
    await expect(apiGet("/parks", schema)).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null });
  });

  it("preserves the session for forbidden requests", async () => {
    useAuthStore.getState().setSession("valid", user);
    respond({ error: "Forbidden" }, 403);
    await expect(apiGet("/users", schema)).rejects.toMatchObject({ status: 403 });
    expect(useAuthStore.getState().token).toBe("valid");
  });

  it("propagates network errors with a user facing message", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    await expect(apiGet("/parks", schema)).rejects.toBe(error);
    expect(apiErrorMessage(error)).toBe("Could not reach WildX. Try again.");
    expect(apiErrorMessage(new ApiError(409, "Duplicate"))).toBe("Duplicate");
  });

  it.each([true, false])("downloads a blob with session=%s", async (authenticated) => {
    if (authenticated) useAuthStore.getState().setSession("token", user);
    fetchMock.mockResolvedValue(new Response("csv data"));
    const blob = await apiGetBlob("/reports/coverage");
    expect(await blob.text()).toBe("csv data");
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")).toBe(authenticated ? "Bearer token" : null);
  });

  it.each([401, 404])("handles blob error %s and clears only expired sessions", async (status) => {
    useAuthStore.getState().setSession("token", user);
    respond(null, status);
    await expect(apiGetBlob("/incidents/1/photo")).rejects.toMatchObject({ status });
    expect(useAuthStore.getState().token).toBe(status === 401 ? null : "token");
  });
});
