import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL is optional if running on same domain
  // baseURL: "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Extended user type with custom fields
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "manager" | "employee";
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
