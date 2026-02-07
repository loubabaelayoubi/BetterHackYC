"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AnnotationViewer,
  AnnotationEditor,
  AnnotationList,
  type Annotation,
} from "@/components/annotations";

// Mock world data - in production this would come from your API
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

export default function TutorialEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tutorialId = params.id as string;
  
  const [tutorial, setTutorial] = useState<{
    id: string;
    title: string;
    workspaceId: string;
  } | null>(null);
  
  const [world, setWorld] = useState<World | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<Partial<Annotation> | null>(null);
  const [isNewAnnotation, setIsNewAnnotation] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load tutorial and world data
  useEffect(() => {
    // For demo purposes, check if there's a worldId in the URL
    const worldId = searchParams.get("worldId");
    const apiKey = localStorage.getItem("wlt_api_key");

    if (worldId && apiKey) {
      // Fetch world data
      fetch(`/api/world/${worldId}`, {
        headers: { "x-api-key": apiKey },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.world) {
            setWorld(data.world);
            setTutorial({
              id: tutorialId,
              title: "New Tutorial",
              workspaceId: worldId,
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load world:", err);
          setLoading(false);
        });
    } else {
      // Demo mode with placeholder
      setLoading(false);
    }
  }, [tutorialId, searchParams]);

  const handleAddAnnotation = (position: { x: number; y: number; z: number }) => {
    const newAnnotation: Partial<Annotation> = {
      ...position,
      title: "",
      content: "",
      order: annotations.length + 1,
    };
    setEditingAnnotation(newAnnotation);
    setIsNewAnnotation(true);
    setSidebarOpen(true);
  };

  const handleSaveAnnotation = (data: Partial<Annotation>) => {
    if (isNewAnnotation) {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        title: data.title || "Untitled",
        content: data.content || "",
        x: data.x || 0,
        y: data.y || 0,
        z: data.z || 0,
        order: data.order || annotations.length + 1,
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveAnnotation(newAnnotation);
    } else if (editingAnnotation?.id) {
      setAnnotations(
        annotations.map((a) =>
          a.id === editingAnnotation.id ? { ...a, ...data } : a
        )
      );
    }
    setEditingAnnotation(null);
    setIsNewAnnotation(false);
  };

  const handleDeleteAnnotation = () => {
    if (editingAnnotation?.id) {
      setAnnotations(annotations.filter((a) => a.id !== editingAnnotation.id));
      setActiveAnnotation(null);
    }
    setEditingAnnotation(null);
    setIsNewAnnotation(false);
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    setActiveAnnotation(annotation);
    if (editMode) {
      setEditingAnnotation(annotation);
      setIsNewAnnotation(false);
    }
    setSidebarOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                3D
              </div>
              <span className="text-xl font-bold">TrainSpace</span>
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No 3D Model Loaded</h1>
          <p className="text-gray-400 mb-8">
            To create a tutorial, you need a workspace with a 3D model first.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/workspaces/new"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Create Workspace
            </Link>
            <Link
              href="/studio"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Open Studio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 flex-shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                3D
              </div>
            </Link>
            <div>
              <h1 className="font-semibold">{tutorial?.title || "Tutorial Editor"}</h1>
              <p className="text-xs text-gray-400">{annotations.length} annotations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                editMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {editMode ? "Edit Mode" : "Preview Mode"}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              Done
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <AnnotationViewer
            world={world}
            annotations={annotations}
            onAnnotationClick={handleAnnotationClick}
            onAddAnnotation={editMode ? handleAddAnnotation : undefined}
            editMode={editMode}
            activeAnnotationId={activeAnnotation?.id}
          />
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l border-gray-700 bg-gray-900 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold">Annotations</h2>
              <p className="text-xs text-gray-400 mt-1">
                {editMode
                  ? "Double-click in 3D view to add"
                  : "Click to view details"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {editingAnnotation ? (
                <AnnotationEditor
                  annotation={editingAnnotation}
                  onSave={handleSaveAnnotation}
                  onDelete={!isNewAnnotation ? handleDeleteAnnotation : undefined}
                  onCancel={() => {
                    setEditingAnnotation(null);
                    setIsNewAnnotation(false);
                  }}
                  isNew={isNewAnnotation}
                />
              ) : (
                <AnnotationList
                  annotations={annotations}
                  activeId={activeAnnotation?.id || null}
                  onSelect={handleAnnotationClick}
                />
              )}
            </div>

            {/* Annotation detail view (when not editing) */}
            {!editingAnnotation && activeAnnotation && !editMode && (
              <div className="border-t border-gray-700 p-4 bg-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {activeAnnotation.order}
                  </span>
                  <h3 className="font-semibold">{activeAnnotation.title}</h3>
                </div>
                {activeAnnotation.content && (
                  <p className="text-sm text-gray-300">{activeAnnotation.content}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
