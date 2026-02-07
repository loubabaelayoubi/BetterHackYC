"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AnnotationViewer, type Annotation } from "@/components/annotations";
import { useSession } from "@/lib/auth-client";

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

interface Tutorial {
  id: string;
  title: string;
  shareLink: string;
  workspace: {
    id: string;
    name: string;
    modelUuid: string;
  };
  annotations: Annotation[];
}

export default function SharedTutorialPage() {
  const params = useParams();
  const shareLink = params.shareLink as string;
  const { data: session } = useSession();

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Load tutorial
  useEffect(() => {
    async function loadTutorial() {
      try {
        const res = await fetch(`/api/share/${shareLink}`);
        if (!res.ok) {
          setError("Tutorial not found");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTutorial(data.tutorial);

        // Load world data
        if (data.tutorial.workspace?.modelUuid) {
          const worldRes = await fetch(`/api/world/${data.tutorial.workspace.modelUuid}`);
          if (worldRes.ok) {
            const worldData = await worldRes.json();
            setWorld(worldData.world);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load tutorial:", err);
        setError("Failed to load tutorial");
        setLoading(false);
      }
    }

    loadTutorial();
  }, [shareLink]);

  // Load progress separately when session is available
  useEffect(() => {
    async function loadProgress() {
      if (!session || !tutorial || progressLoaded) return;
      
      try {
        const progressRes = await fetch(`/api/progress?tutorialId=${tutorial.id}`);
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          if (progressData.progress?.completedAnnotations) {
            setCompletedSteps(new Set(progressData.progress.completedAnnotations));
          }
        }
        setProgressLoaded(true);
      } catch (err) {
        console.error("Failed to load progress:", err);
      }
    }

    loadProgress();
  }, [session, tutorial, progressLoaded]);

  const sortedAnnotations = tutorial?.annotations
    ? [...tutorial.annotations].sort((a, b) => a.order - b.order)
    : [];

  const currentAnnotation = sortedAnnotations[currentStep];
  const progress = sortedAnnotations.length > 0 
    ? Math.round((completedSteps.size / sortedAnnotations.length) * 100)
    : 0;

  const saveProgress = async (newCompletedSteps: Set<string>) => {
    if (!session || !tutorial) return;
    
    setSaving(true);
    try {
      const isComplete = newCompletedSteps.size === sortedAnnotations.length;
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorialId: tutorial.id,
          completedAnnotations: Array.from(newCompletedSteps),
          completed: isComplete,
        }),
      });
      
      // Redirect to dashboard on completion
      if (isComplete) {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSaving(false);
    }
  };

  const markComplete = () => {
    if (currentAnnotation) {
      const newCompleted = new Set([...completedSteps, currentAnnotation.id]);
      setCompletedSteps(newCompleted);
      saveProgress(newCompleted);
    }
    if (currentStep < sortedAnnotations.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Tutorial not found"}</h1>
          <p className="text-gray-400 mb-6">This tutorial link may be invalid or expired.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">3D Model Unavailable</h1>
          <p className="text-gray-400">The 3D model for this tutorial could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 flex-shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                3D
              </div>
            </Link>
            <div>
              <h1 className="font-semibold">{tutorial.title}</h1>
              <p className="text-xs text-gray-400">{tutorial.workspace?.name}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-xs text-blue-400">Saving...</span>
            )}
            {!session && (
              <Link href="/auth/signin" className="text-xs text-yellow-400 hover:underline">
                Sign in to save progress
              </Link>
            )}
            <div className="text-sm text-gray-400">
              {completedSteps.size} / {sortedAnnotations.length} completed
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <AnnotationViewer
            world={world}
            annotations={sortedAnnotations}
            onAnnotationClick={(ann) => {
              const index = sortedAnnotations.findIndex((a) => a.id === ann.id);
              if (index !== -1) setCurrentStep(index);
            }}
            editMode={false}
            activeAnnotationId={currentAnnotation?.id}
          />
        </div>

        {/* Sidebar - Step Guide */}
        <div className="w-96 border-l border-gray-700 bg-gray-900 flex flex-col">
          {/* Current Step */}
          <div className="p-6 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                {currentStep + 1}
              </span>
              <div>
                <p className="text-xs text-gray-400">Step {currentStep + 1} of {sortedAnnotations.length}</p>
                <h2 className="font-semibold text-lg">{currentAnnotation?.title || "No steps"}</h2>
              </div>
            </div>
            
            {currentAnnotation?.content && (
              <p className="text-gray-300 mb-4">{currentAnnotation.content}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={markComplete}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                {completedSteps.has(currentAnnotation?.id || "") 
                  ? (currentStep < sortedAnnotations.length - 1 ? "Next Step" : "Completed!")
                  : "Mark Complete & Continue"}
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">All Steps</h3>
            <div className="space-y-2">
              {sortedAnnotations.map((ann, index) => (
                <button
                  key={ann.id}
                  onClick={() => goToStep(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentStep === index
                      ? "bg-blue-600/20 border-blue-500"
                      : completedSteps.has(ann.id)
                      ? "bg-green-600/10 border-green-500/50"
                      : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        completedSteps.has(ann.id)
                          ? "bg-green-600 text-white"
                          : currentStep === index
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {completedSteps.has(ann.id) ? "✓" : index + 1}
                    </span>
                    <span className={completedSteps.has(ann.id) ? "text-green-400" : ""}>
                      {ann.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Completion Message */}
          {progress === 100 && (
            <div className="p-4 bg-green-600/20 border-t border-green-500/50">
              <div className="text-center">
                <p className="text-green-400 font-semibold mb-2">🎉 Tutorial Complete!</p>
                <p className="text-sm text-gray-400">
                  {session ? "Redirecting to dashboard..." : "Great job completing all steps."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
