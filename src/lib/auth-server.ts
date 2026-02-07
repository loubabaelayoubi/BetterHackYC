import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current session on the server side.
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Require authentication. Redirects to sign in if not authenticated.
 * Use in server components and server actions.
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect("/auth/signin");
  }
  return session;
}

/**
 * Require manager role. Redirects if not a manager.
 */
export async function requireManager() {
  const session = await requireAuth();
  if (session.user.role !== "manager") {
    redirect("/dashboard");
  }
  return session;
}

/**
 * Require employee role. Redirects if not an employee.
 */
export async function requireEmployee() {
  const session = await requireAuth();
  if (session.user.role !== "employee") {
    redirect("/dashboard");
  }
  return session;
}
