import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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
    const workspaceData = await db.query.workspace.findFirst({
      where: (w, { eq }) => eq(w.id, id),
      with: {
        tutorials: {
          with: {
            annotations: true,
          },
        },
      },
    });

    if (!workspaceData) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace: workspaceData });
  } catch (error) {
    console.error("Get workspace error:", error);
    return NextResponse.json(
      { error: "Failed to get workspace" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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
    await db.delete(workspace).where(eq(workspace.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
