import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.worldlabs.ai/marble/v1";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  const { operationId } = await params;
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/operations/${operationId}`, {
      headers: {
        "WLT-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: `Status check failed: ${JSON.stringify(error)}` },
        { status: response.status }
      );
    }

    const operation = await response.json();
    
    // Log for debugging
    console.log("Operation status:", JSON.stringify(operation, null, 2));

    if (operation.done && operation.response) {
      // The operation response already contains the world data
      const world = operation.response;
      
      // Map to expected format
      return NextResponse.json({
        done: true,
        world: {
          id: world.world_id,
          display_name: world.display_name || "Generated World",
          assets: world.assets,
          world_marble_url: world.world_marble_url,
        },
      });
    }

    return NextResponse.json({
      done: operation.done,
      error: operation.error,
      progress: operation.metadata?.progress,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
