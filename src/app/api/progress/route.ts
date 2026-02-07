import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

// Get or create progress for a tutorial
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tutorialId = searchParams.get("tutorialId");

  if (!tutorialId) {
    return NextResponse.json({ error: "tutorialId is required" }, { status: 400 });
  }

  try {
    let userProgress = await db.query.progress.findFirst({
      where: (p, { eq, and }) => 
        and(eq(p.tutorialId, tutorialId), eq(p.employeeId, session.user.id)),
    });

    // Create progress if it doesn't exist
    if (!userProgress) {
      const [newProgress] = await db
        .insert(progress)
        .values({
          tutorialId,
          employeeId: session.user.id,
          completedAnnotations: [],
          completed: false,
        })
        .returning();
      userProgress = newProgress;
    }

    return NextResponse.json({ progress: userProgress });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}

// Update progress
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tutorialId, completedAnnotations, completed } = body;

    if (!tutorialId) {
      return NextResponse.json({ error: "tutorialId is required" }, { status: 400 });
    }

    // Check if progress exists
    const existing = await db.query.progress.findFirst({
      where: (p, { eq, and }) => 
        and(eq(p.tutorialId, tutorialId), eq(p.employeeId, session.user.id)),
    });

    if (existing) {
      // Update existing progress
      const [updated] = await db
        .update(progress)
        .set({
          completedAnnotations: completedAnnotations || existing.completedAnnotations,
          completed: completed ?? existing.completed,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(progress.tutorialId, tutorialId),
            eq(progress.employeeId, session.user.id)
          )
        )
        .returning();

      return NextResponse.json({ progress: updated });
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(progress)
        .values({
          tutorialId,
          employeeId: session.user.id,
          completedAnnotations: completedAnnotations || [],
          completed: completed || false,
        })
        .returning();

      return NextResponse.json({ progress: newProgress });
    }
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
