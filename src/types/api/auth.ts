import { t } from "elysia";
import { tboxPassword } from "../typebox/field";

export const tboxLoginWithPassword = t.Object({
  email: t.String(),
  password: t.String(),
});

export const tboxResetAdminPasswordWithToken = t.Object({
  token: t.String(),
  newPassword: tboxPassword({fieldName: "New Password", minLength: 8, maxLength: 256}),
})