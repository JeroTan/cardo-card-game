import { t, type Static } from "elysia";
import { tboxAlphaNumericSpace, tboxEmail, tboxPassword, tboxTextEssentials } from "../typebox/field";

export const tboxCreateUserAccount = t.Object({
  name: tboxTextEssentials({fieldName: "Full Name"}),
  username: tboxAlphaNumericSpace({fieldName: "Username", minLength: 3, maxLength: 30}),
  email: tboxEmail({fieldName: "Email Address"}),
  password: tboxPassword({fieldName: "Password", minLength: 8, maxLength: 256}),
});

export type typeCreateUserAccount = Static<typeof tboxCreateUserAccount>;

export const tboxUpdateUserAccount = t.Object({
  name: t.Optional(tboxTextEssentials({fieldName: "Full Name"})),
  username: t.Optional(tboxAlphaNumericSpace({fieldName: "Username", minLength: 3, maxLength: 30})),
  email: t.Optional(tboxEmail({fieldName: "Email Address"})),
  password: t.Optional(tboxPassword({fieldName: "Password", minLength: 8, maxLength: 256})),
});

export type typeUpdateUserAccount = Static<typeof tboxUpdateUserAccount>;