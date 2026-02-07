import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, modelUuid } = body;

    if (!name || !modelUuid) {
      return NextResponse.json(
        { error: "name and modelUuid are required" },
        { status: 400 }
      );
    }

    const [newWorkspace] = await db
      .insert(workspace)
      .values({
        name,
        modelUuid,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ workspace: newWorkspace });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const workspaces = await db.query.workspace.findMany({
      where: (workspace, { eq }) => eq(workspace.createdBy, session.user.id),
      orderBy: (workspace, { desc }) => [desc(workspace.createdAt)],
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);
    return NextResponse.json(
      { error: "Failed to get workspaces" },
      { status: 500 }
    );
  }
}
