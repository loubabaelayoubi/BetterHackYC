import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.worldlabs.ai/marble/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, draft = true, apiKey, mediaAssetIds } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Build world_prompt based on input type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let worldPrompt: any;
    
    if (mediaAssetIds && mediaAssetIds.length > 0) {
      if (mediaAssetIds.length === 1) {
        // Single image-to-world generation
        worldPrompt = {
          type: "image",
          image_prompt: {
            source: "media_asset",
            media_asset_id: mediaAssetIds[0],
          },
          disable_recaption: false,
        };
      } else {
        // Multi-image-to-world generation
        worldPrompt = {
          type: "multi-image",
          multi_image_prompt: mediaAssetIds.map((id: string, index: number) => ({
            content: {
              source: "media_asset",
              media_asset_id: id,
            },
            // Distribute images evenly around the sphere
            azimuth: (360 / mediaAssetIds.length) * index,
          })),
          reconstruct_images: mediaAssetIds.length > 4,
          disable_recaption: false,
        };
      }
      
      // Add text prompt if provided (for guidance)
      if (prompt?.trim()) {
        worldPrompt.text_prompt = prompt.trim();
      }
    } else if (prompt?.trim()) {
      // Text-to-world generation
      worldPrompt = {
        type: "text",
        text_prompt: prompt.trim(),
        disable_recaption: false,
      };
    } else {
      return NextResponse.json(
        { error: "Either prompt or mediaAssetIds is required" },
        { status: 400 }
      );
    }

    // Start world generation
    const generateResponse = await fetch(`${API_BASE_URL}/worlds:generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "WLT-Api-Key": apiKey,
      },
      body: JSON.stringify({
        world_prompt: worldPrompt,
        model: draft ? "Marble 0.1-mini" : "Marble 0.1-plus",
      }),
    });

    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      return NextResponse.json(
        { error: `Generation failed: ${JSON.stringify(error)}` },
        { status: generateResponse.status }
      );
    }

    const operation = await generateResponse.json();
    return NextResponse.json({ operationId: operation.operation_id });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 }
    );
  }
}
