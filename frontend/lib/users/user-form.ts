import { z } from "zod";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import type { UserAccountRequest, UserAccountResponse } from "@/lib/api/users";
import { ROLES } from "@/lib/enums";

const NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;
const CONFLICT_STATUS = 409;
const NO_CHOICE = "";

const baseSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters`),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(PHONE_MAX_LENGTH, `Keep it under ${PHONE_MAX_LENGTH} characters`),
  role: z.union([z.enum(ROLES), z.literal(NO_CHOICE)]),
  password: z.string().max(PASSWORD_MAX_LENGTH, `Keep it under ${PASSWORD_MAX_LENGTH} characters`),
  active: z.boolean(),
});

export function userSchema(creating: boolean) {
  return baseSchema.superRefine((values, ctx) => {
    if (values.role === NO_CHOICE) ctx.addIssue({ code: "custom", path: ["role"], message: "Choose a role" });
    const needsPassword = creating || values.password.length > 0;
    if (needsPassword && values.password.length < PASSWORD_MIN_LENGTH) {
      ctx.addIssue({ code: "custom", path: ["password"], message: `Use at least ${PASSWORD_MIN_LENGTH} characters` });
    }
  });
}

export type UserValues = z.infer<typeof baseSchema>;

export const EMPTY_USER: UserValues = {
  name: "",
  email: "",
  phone: "",
  role: NO_CHOICE,
  password: "",
  active: true,
};

export function toUserValues(user: UserAccountResponse): UserValues {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    password: "",
    active: user.active,
  };
}

export function toUserRequest(values: UserValues): UserAccountRequest {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone,
    password: values.password,
    role: values.role === NO_CHOICE ? ROLES.RANGER : values.role,
    active: values.active,
  };
}

export function userErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.status === CONFLICT_STATUS) return "This email is already in use.";
  return apiErrorMessage(error);
}
