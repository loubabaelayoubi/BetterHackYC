import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const { user } = session;

  // Fetch user's workspaces (for manager view)
  const workspaces = await db.query.workspace.findMany({
    where: (workspace, { eq }) => eq(workspace.createdBy, user.id),
    orderBy: (workspace, { desc }) => [desc(workspace.createdAt)],
    with: {
      tutorials: {
        with: {
          annotations: true,
        },
      },
    },
  });

  // Fetch user's progress on tutorials (for employee view)
  const progress = await db.query.progress.findMany({
    where: (p, { eq }) => eq(p.employeeId, user.id),
    with: {
      tutorial: {
        with: {
          workspace: true,
          annotations: true,
        },
      },
    },
  });

  // Fetch all available tutorials (for employee to browse)
  const allTutorials = await db.query.tutorial.findMany({
    with: {
      workspace: true,
      annotations: true,
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return (
    <DashboardClient
      user={user}
      workspaces={workspaces}
      progress={progress}
      allTutorials={allTutorials}
    />
  );
}
