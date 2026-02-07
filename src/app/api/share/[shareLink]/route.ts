import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareLink: string }> }
) {
  const { shareLink } = await params;

  try {
    const tutorial = await db.query.tutorial.findFirst({
      where: (t, { eq }) => eq(t.shareLink, shareLink),
      with: {
        annotations: {
          orderBy: (a, { asc }) => [asc(a.order)],
        },
        workspace: true,
      },
    });

    if (!tutorial) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    return NextResponse.json({ tutorial });
  } catch (error) {
    console.error("Get shared tutorial error:", error);
    return NextResponse.json(
      { error: "Failed to get tutorial" },
      { status: 500 }
    );
  }
}
