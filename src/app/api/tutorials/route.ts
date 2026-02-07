import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tutorial } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, workspaceId } = body;

    if (!title || !workspaceId) {
      return NextResponse.json(
        { error: "title and workspaceId are required" },
        { status: 400 }
      );
    }

    const shareLink = nanoid(10);

    const [newTutorial] = await db
      .insert(tutorial)
      .values({
        title,
        workspaceId,
        shareLink,
      })
      .returning();

    return NextResponse.json({ tutorial: newTutorial });
  } catch (error) {
    console.error("Create tutorial error:", error);
    return NextResponse.json(
      { error: "Failed to create tutorial" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    const tutorials = await db.query.tutorial.findMany({
      where: workspaceId
        ? (t, { eq }) => eq(t.workspaceId, workspaceId)
        : undefined,
      with: {
        annotations: true,
        workspace: true,
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return NextResponse.json({ tutorials });
  } catch (error) {
    console.error("Get tutorials error:", error);
    return NextResponse.json(
      { error: "Failed to get tutorials" },
      { status: 500 }
    );
  }
}
