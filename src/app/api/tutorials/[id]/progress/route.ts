import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Get all progress for a specific tutorial (for managers)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tutorialId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is manager
  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get tutorial with all progress records
    const tutorial = await db.query.tutorial.findFirst({
      where: (t, { eq }) => eq(t.id, tutorialId),
      with: {
        annotations: true,
        progress: {
          with: {
            employee: true,
          },
        },
        workspace: true,
      },
    });

    if (!tutorial) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    // Format the response
    const employeeProgress = tutorial.progress.map((p) => ({
      id: p.id,
      employee: {
        id: p.employee.id,
        name: p.employee.name,
        email: p.employee.email,
      },
      completedSteps: p.completedAnnotations?.length || 0,
      totalSteps: tutorial.annotations.length,
      percentComplete: tutorial.annotations.length > 0 
        ? Math.round(((p.completedAnnotations?.length || 0) / tutorial.annotations.length) * 100)
        : 0,
      completed: p.completed,
      lastUpdated: p.updatedAt,
    }));

    return NextResponse.json({
      tutorial: {
        id: tutorial.id,
        title: tutorial.title,
        shareLink: tutorial.shareLink,
        workspace: tutorial.workspace,
        totalAnnotations: tutorial.annotations.length,
      },
      employeeProgress,
      summary: {
        totalEmployees: employeeProgress.length,
        completed: employeeProgress.filter((p) => p.completed).length,
        inProgress: employeeProgress.filter((p) => !p.completed && p.completedSteps > 0).length,
        notStarted: employeeProgress.filter((p) => p.completedSteps === 0).length,
      },
    });
  } catch (error) {
    console.error("Get tutorial progress error:", error);
    return NextResponse.json(
      { error: "Failed to get tutorial progress" },
      { status: 500 }
    );
  }
}
