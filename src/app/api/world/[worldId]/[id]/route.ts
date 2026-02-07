import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.worldlabs.ai/marble/v1";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.WORLD_LABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "World Labs API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/worlds/${id}`, {
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

    const worldData = await response.json();
    
    return NextResponse.json({
      world: {
        id: worldData.world_id,
        display_name: worldData.display_name || "Generated World",
        assets: worldData.assets,
        world_marble_url: worldData.world_marble_url,
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
