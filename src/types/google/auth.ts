export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}