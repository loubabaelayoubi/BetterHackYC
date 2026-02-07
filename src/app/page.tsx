"use client";

import { useState, useEffect, useRef } from "react";
import SplatViewer from "@/components/SplatViewer";

interface WorldAssets {
  splats: {
    spz_urls: {
      "100k": string;
      "500k": string;
      full_res: string;
    };
  };
  thumbnail_url: string;
  caption: string;
}

interface World {
  id: string;
  display_name: string;
  assets: WorldAssets;
  world_marble_url: string;
}

type GenerationStatus = "idle" | "generating" | "uploading" | "loading" | "complete" | "error";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [worldIdInput, setWorldIdInput] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [world, setWorld] = useState<World | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [useDraft, setUseDraft] = useState(true);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("wlt_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem("wlt_api_key", value);
    } else {
      localStorage.removeItem("wlt_api_key");
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setStatus("error");
        setStatusMessage("Please select an image file");
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setStatus("error");
        setStatusMessage("Image must be less than 10MB");
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setStatus("idle");
      setStatusMessage("");
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload image and get media asset ID
  const uploadImage = async (file: File): Promise<string> => {
    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    
    // Step 1: Prepare upload
    setStatusMessage("Preparing upload...");
    const prepareRes = await fetch("/api/upload/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey.trim(),
      },
      body: JSON.stringify({
        fileName: file.name,
        extension: extension,
        kind: "image",
      }),
    });

    if (!prepareRes.ok) {
      const error = await prepareRes.json();
      throw new Error(error.error || "Failed to prepare upload");
    }

    const { media_asset, upload_info } = await prepareRes.json();
    
    // Step 2: Upload file to signed URL
    setStatusMessage("Uploading image...");
    const uploadRes = await fetch(upload_info.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        ...upload_info.required_headers,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload image");
    }

    return media_asset.media_asset_id;
  };

  const loadExistingWorld = async (worldId: string) => {
    if (!worldId.trim()) return;
    if (!apiKey.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your World Labs API key");
      return;
    }

    setStatus("loading");
    setStatusMessage("Loading world...");

    try {
      const res = await fetch(`/api/world/${worldId.trim()}`, {
        headers: { "x-api-key": apiKey.trim() },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to load world");
      }

      const data = await res.json();
      setWorld(data.world);
      setStatus("complete");
      setStatusMessage("World loaded successfully!");
      setShowViewer(true);
    } catch (error) {
      console.error("Load world error:", error);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Failed to load world");
    }
  };

  const generateWorld = async (mediaAssetId?: string) => {
    if (!mediaAssetId && !prompt.trim()) return;
    if (!apiKey.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your World Labs API key");
      return;
    }

    setStatus("generating");
    setStatusMessage("Starting generation...");
    setWorld(null);

    try {
      // Start generation
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt.trim(), 
          draft: useDraft, 
          apiKey: apiKey.trim(),
          mediaAssetId: mediaAssetId,
        }),
      });

      if (!generateRes.ok) {
        const error = await generateRes.json();
        throw new Error(error.error || "Failed to start generation");
      }

      const { operationId } = await generateRes.json();
      setStatusMessage("Generation in progress...");

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max (5s intervals)

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const statusRes = await fetch(`/api/status/${operationId}`, {
          headers: { "x-api-key": apiKey.trim() },
        });
        if (!statusRes.ok) {
          throw new Error("Failed to check status");
        }

        const statusData = await statusRes.json();

        if (statusData.error) {
          throw new Error(statusData.error.message || "Generation failed");
        }

        if (statusData.progress?.description) {
          setStatusMessage(statusData.progress.description);
        }

        if (statusData.done && statusData.world) {
          setWorld(statusData.world);
          setStatus("complete");
          setStatusMessage("World generated successfully!");
          setShowViewer(true);
          return;
        }

        attempts++;
      }

      throw new Error("Generation timed out");
    } catch (error) {
      console.error("Generation error:", error);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && status !== "generating" && status !== "uploading") {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Handle generation (with or without image)
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your World Labs API key");
      return;
    }

    if (!selectedImage && !prompt.trim()) {
      setStatus("error");
      setStatusMessage("Please enter a prompt or upload an image");
      return;
    }

    try {
      let mediaAssetId: string | undefined;

      // If image is selected, upload it first
      if (selectedImage) {
        setStatus("uploading");
        mediaAssetId = await uploadImage(selectedImage);
      }

      // Generate world
      await generateWorld(mediaAssetId);
      
      // Clear image after successful generation
      clearImage();
    } catch (error) {
      console.error("Generation error:", error);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🌍 World Labs 3D Generator
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Enter a text prompt or upload an image to generate an immersive 3D scene using World Labs AI.
            The scene will be rendered directly in your browser using Gaussian Splatting.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto">
          {/* API Key Section */}
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-xl border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-300">
                World Labs API Key
              </label>
              <a
                href="https://platform.worldlabs.ai/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Get your API key →
              </a>
            </div>
            <div className="relative">
              <input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter your WLT API key..."
                className="w-full px-4 py-3 pr-20 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                disabled={status === "generating"}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 text-sm"
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
            {apiKey && (
              <p className="text-xs text-green-400 mt-2">✓ API key saved to browser storage</p>
            )}
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-xl border border-gray-700">
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your scene
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedImage ? "Optional: Add a description to guide the generation..." : "A mystical forest with glowing mushrooms and fireflies at twilight..."}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={status === "generating" || status === "uploading"}
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Or upload an image
                </label>
                
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/30 transition-colors"
                  >
                    <svg className="w-10 h-10 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">Click to upload an image</p>
                    <p className="text-gray-500 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Selected"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs">
                      {selectedImage?.name}
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={useDraft}
                    onChange={(e) => setUseDraft(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    disabled={status === "generating" || status === "uploading"}
                  />
                  <span className="text-sm">
                    Draft mode <span className="text-gray-500">(faster, ~30-45s)</span>
                  </span>
                </label>

                <button
                  onClick={handleGenerate}
                  disabled={(!prompt.trim() && !selectedImage) || !apiKey.trim() || status === "generating" || status === "uploading"}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center space-x-2"
                >
                  {status === "uploading" ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : status === "generating" ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate World</span>
                      <span>✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  status === "error"
                    ? "bg-red-900/50 text-red-300"
                    : status === "complete"
                    ? "bg-green-900/50 text-green-300"
                    : "bg-blue-900/50 text-blue-300"
                }`}
              >
                {statusMessage}
              </div>
            )}
          </div>

          {/* Generated World Card */}
          {world && !showViewer && (
            <div className="mt-8 bg-gray-800/50 backdrop-blur rounded-2xl overflow-hidden shadow-xl border border-gray-700">
              <div className="relative">
                <img
                  src={world.assets.thumbnail_url}
                  alt={world.display_name || "Generated world"}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-semibold">
                    {world.display_name || "Your Generated World"}
                  </h3>
                  <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                    {world.assets.caption}
                  </p>
                </div>
              </div>
              <div className="p-4 flex space-x-3">
                <button
                  onClick={() => setShowViewer(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  View in 3D
                </button>
                <a
                  href={world.world_marble_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Open in Marble ↗
                </a>
              </div>
            </div>
          )}

          {/* Example Prompts */}
          <div className="mt-8">
            <h3 className="text-gray-400 text-sm font-medium mb-3">Try these prompts:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "A cozy cabin in a snowy mountain forest",
                "An underwater coral reef with tropical fish",
                "A futuristic cyberpunk city street at night",
                "A peaceful Japanese zen garden with cherry blossoms",
                "An ancient temple ruins in a jungle",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  disabled={status === "generating" || status === "loading" || status === "uploading"}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Load Existing World */}
          <div className="mt-8 bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-gray-400 text-sm font-medium mb-3">Or load an existing world:</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={worldIdInput}
                onChange={(e) => setWorldIdInput(e.target.value)}
                placeholder="World ID (e.g., cd34826d-72bf-493a-8f31-52b816a5566d)"
                className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={status === "generating" || status === "loading" || status === "uploading"}
              />
              <button
                onClick={() => loadExistingWorld(worldIdInput)}
                disabled={!worldIdInput.trim() || !apiKey.trim() || status === "generating" || status === "loading" || status === "uploading"}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Viewer Modal */}
      {showViewer && (
        <SplatViewer world={world} onClose={() => setShowViewer(false)} />
      )}
    </main>
  );
}
