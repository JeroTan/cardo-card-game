import { t, type Static } from "elysia";
import { tboxName, tboxPassword } from "../typebox/field";

export const tboxLoginWithPassword = t.Object({
  email: t.String(),
  password: t.String(),
});

export const tboxLoginWithPasswordUsingEmailOrUsername = t.Object({
  emailOrUsername: t.String(),
  password: t.String(),
});

export const tboxResetPasswordWithToken = t.Object({
  token: t.String(),
  newPassword: tboxPassword({fieldName: "New Password", minLength: 8, maxLength: 256}),
});

export const tboxRegisterWithPassword = t.Object({
  // name: t.String(),
  // username: t.String(),
  email: t.String(),
  password: tboxPassword({fieldName: "Password", minLength: 8, maxLength: 256}),
});

export type typeRegisterWithPassword = Static<typeof tboxRegisterWithPassword>;

export const tboxUpdateUsername = t.Object({
  newUsername: tboxName({fieldName: "Username", minLength: 1, maxLength: 24}),
});

export const tboxUpdateName = t.Object({
  newName: tboxName({fieldName: "Name", minLength: 1, maxLength: 32}),
});