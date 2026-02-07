import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tutorial } from "@/db/schema";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tutorialData = await db.query.tutorial.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        annotations: {
          orderBy: (a, { asc }) => [asc(a.order)],
        },
        workspace: true,
      },
    });

    if (!tutorialData) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    return NextResponse.json({ tutorial: tutorialData });
  } catch (error) {
    console.error("Get tutorial error:", error);
    return NextResponse.json(
      { error: "Failed to get tutorial" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title } = body;

    const [updated] = await db
      .update(tutorial)
      .set({ title, updatedAt: new Date() })
      .where(eq(tutorial.id, id))
      .returning();

    return NextResponse.json({ tutorial: updated });
  } catch (error) {
    console.error("Update tutorial error:", error);
    return NextResponse.json(
      { error: "Failed to update tutorial" },
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.delete(tutorial).where(eq(tutorial.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tutorial error:", error);
    return NextResponse.json(
      { error: "Failed to delete tutorial" },
      { status: 500 }
    );
  }
}
