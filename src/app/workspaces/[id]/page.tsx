"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { UserButton } from "@/components/auth";
import { AnnotationViewer } from "@/components/annotations";

interface Workspace {
  id: string;
  name: string;
  modelUuid: string;
  createdAt: string;
  tutorials: {
    id: string;
    title: string;
    shareLink: string;
    annotations: { id: string }[];
  }[];
}

interface World {
  id: string;
  display_name: string;
  assets: {
    splats: {
      spz_urls: {
        "100k": string;
        "500k": string;
        full_res: string;
      };
    };
    thumbnail_url: string;
    caption: string;
  };
  world_marble_url: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        // Load workspace from database
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Workspace not found");
          } else {
            setError("Failed to load workspace");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setWorkspace(data.workspace);

        // Load world data from World Labs API
        const worldRes = await fetch(`/api/world/${data.workspace.modelUuid}`);
        if (worldRes.ok) {
          const worldData = await worldRes.json();
          setWorld(worldData.world);
        }

        setLoading(false);
      } catch (err) {
        console.error("Load error:", err);
        setError("Failed to load workspace");
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading workspace...</div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                3D
              </div>
              <span className="text-xl font-bold">TrainSpace</span>
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Workspace not found"}</h1>
          <Link
            href="/dashboard"
            className="text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                3D
              </div>
              <span className="text-xl font-bold">TrainSpace</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{workspace.name}</span>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Workspace Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">{workspace.name}</h1>
            <p className="text-gray-400">
              Created {new Date(workspace.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowViewer(true)}
              disabled={!world}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              View 3D Model
            </button>
            <Link
              href={`/tutorials/new?workspaceId=${workspace.id}&worldId=${workspace.modelUuid}`}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              + Create Tutorial
            </Link>
          </div>
        </div>

        {/* 3D Preview */}
        {world && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-8">
            <div className="relative h-64">
              <img
                src={world.assets.thumbnail_url}
                alt={workspace.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => setShowViewer(true)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm">{world.assets.caption}</p>
            </div>
          </div>
        )}

        {/* Tutorials Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Tutorials</h2>
            <Link
              href={`/tutorials/new?workspaceId=${workspace.id}&worldId=${workspace.modelUuid}`}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              + New Tutorial
            </Link>
          </div>

          {workspace.tutorials.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mb-4">No tutorials yet</p>
              <Link
                href={`/tutorials/new?workspaceId=${workspace.id}&worldId=${workspace.modelUuid}`}
                className="text-green-400 hover:underline"
              >
                Create your first tutorial →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {workspace.tutorials.map((tutorial) => (
                <Link
                  key={tutorial.id}
                  href={`/tutorials/${tutorial.id}`}
                  className="block p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{tutorial.title}</h3>
                      <p className="text-sm text-gray-400">
                        {tutorial.annotations.length} annotations
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 3D Viewer Modal */}
      {showViewer && world && (
        <div className="fixed inset-0 z-50 bg-black">
          <AnnotationViewer
            world={world}
            annotations={[]}
            onClose={() => setShowViewer(false)}
          />
        </div>
      )}
    </div>
  );
}
