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
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-none animate-spin mx-auto mb-4" />
          <p>Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Tutorial not found"}</h1>
          <p className="text-[var(--text-secondary)] mb-6">This tutorial link may be invalid or expired.</p>
          <Link
            href="/"
            className="px-6 py-3 btn-primary font-medium transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">3D Model Unavailable</h1>
          <p className="text-[var(--text-secondary)]">The 3D model for this tutorial could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] backdrop-blur-md flex-shrink-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-600 rounded-none flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(245,158,11,0.5)] text-black">
                3D
              </div>
            </Link>
            <div>
              <h1 className="font-semibold tracking-tight">{tutorial.title}</h1>
              <p className="text-xs text-[var(--text-secondary)]">{tutorial.workspace?.name}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-xs text-amber-400">Saving...</span>
            )}
            {!session && (
              <Link href="/auth/signin" className="text-xs text-amber-400 hover:underline">
                Sign in to save progress
              </Link>
            )}
            <div className="text-sm text-[var(--text-secondary)]">
              {completedSteps.size} / {sortedAnnotations.length} completed
            </div>
            <div className="w-32 h-2 bg-[var(--bg-input)] rounded-none overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
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
        <div className="w-96 border-l border-[var(--border-subtle)] bg-[var(--bg-panel)] backdrop-blur-md flex flex-col absolute right-0 top-0 bottom-0 z-40 shadow-xl">
          {/* Current Step */}
          <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-amber-600 rounded-none flex items-center justify-center text-lg font-bold shadow-lg text-black">
                {currentStep + 1}
              </span>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Step {currentStep + 1} of {sortedAnnotations.length}</p>
                <h2 className="font-semibold text-lg">{currentAnnotation?.title || "No steps"}</h2>
              </div>
            </div>
            
            {currentAnnotation?.imageUrl && (
              <img
                src={currentAnnotation.imageUrl}
                alt={`${currentAnnotation.title} reference`}
                className="w-full max-h-64 object-contain rounded-none border border-[var(--border-subtle)] bg-black/30 mb-4"
              />
            )}
            
            {currentAnnotation?.content && (
              <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">{currentAnnotation.content}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2 glass-button hover:bg-[var(--bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed rounded-none transition-colors"
              >
                Previous
              </button>
              <button
                onClick={markComplete}
                className="flex-1 px-4 py-2 btn-primary rounded-none font-medium transition-all"
              >
                {completedSteps.has(currentAnnotation?.id || "") 
                  ? (currentStep < sortedAnnotations.length - 1 ? "Next Step" : "Completed!")
                  : "Mark Complete & Continue"}
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">All Steps</h3>
            <div className="space-y-2">
              {sortedAnnotations.map((ann, index) => (
                <button
                  key={ann.id}
                  onClick={() => goToStep(index)}
                  className={`w-full text-left p-3 rounded-none border transition-all ${
                    currentStep === index
                      ? "bg-amber-500/10 border-amber-500/30 shadow-sm"
                      : completedSteps.has(ann.id)
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "glass-button border-transparent hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-bold transition-colors ${
                        completedSteps.has(ann.id)
                          ? "bg-emerald-500 text-white"
                          : currentStep === index
                          ? "bg-amber-600 text-black"
                          : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                      }`}
                    >
                      {completedSteps.has(ann.id) ? "✓" : index + 1}
                    </span>
                    <span className={`transition-colors ${
                      completedSteps.has(ann.id) ? "text-emerald-400" : currentStep === index ? "text-amber-300" : "text-[var(--text-secondary)]"
                    }`}>
                      {ann.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Completion Message */}
          {progress === 100 && (
            <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 backdrop-blur-md">
              <div className="text-center">
                <p className="text-emerald-400 font-semibold mb-2">🎉 Tutorial Complete!</p>
                <p className="text-sm text-[var(--text-secondary)]">
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
