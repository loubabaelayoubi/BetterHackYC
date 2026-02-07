import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.worldlabs.ai/marble/v1";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  const { worldId } = await params;
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`, {
      headers: {
        "WLT-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: `Failed to fetch world: ${JSON.stringify(error)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const world = data.world || data;

    return NextResponse.json({
      world: {
        id: world.world_id || worldId,
        display_name: world.display_name || "Generated World",
        assets: world.assets,
        world_marble_url: world.world_marble_url,
      },
    });
  } catch (error) {
    console.error("Fetch world error:", error);
    return NextResponse.json(
      { error: "Failed to fetch world" },
      { status: 500 }
    );
  }
}
