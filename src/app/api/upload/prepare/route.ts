import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.worldlabs.ai/marble/v1";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { fileName, extension, kind = "image" } = body;

    if (!fileName || !extension) {
      return NextResponse.json(
        { error: "fileName and extension are required" },
        { status: 400 }
      );
    }

    // Prepare upload with World Labs API
    const response = await fetch(`${API_BASE_URL}/media-assets:prepare_upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "WLT-Api-Key": apiKey,
      },
      body: JSON.stringify({
        file_name: fileName,
        extension: extension,
        kind: kind,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: `Failed to prepare upload: ${JSON.stringify(error)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Prepare upload error:", error);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 500 }
    );
  }
}
