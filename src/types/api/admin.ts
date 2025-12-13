import { t } from "elysia";
import { tboxEmail, tboxPassword } from "../typebox/field";

export const tboxCreateAdminAccount = t.Object({
  email: tboxEmail({fieldName: "Email Address"}),
  password: tboxPassword({fieldName: "Password", minLength: 8, maxLength: 256}),
});