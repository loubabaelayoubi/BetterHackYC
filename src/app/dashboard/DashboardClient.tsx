"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@/components/auth";

interface Workspace {
  id: string;
  name: string;
  modelUuid: string;
  createdAt: Date;
  tutorials: {
    id: string;
    title: string;
    shareLink: string;
    annotations: { id: string }[];
  }[];
}

interface Progress {
  id: string;
  tutorialId: string;
  completed: boolean;
  completedAnnotations: string[] | null;
  tutorial: {
    id: string;
    title: string;
    shareLink: string;
    workspace: {
      id: string;
      name: string;
    } | null;
    annotations: { id: string }[];
  };
}

interface Tutorial {
  id: string;
  title: string;
  shareLink: string;
  createdAt: Date;
  workspace: {
    id: string;
    name: string;
  } | null;
  annotations: { id: string }[];
}

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null | undefined;
  };
  workspaces: Workspace[];
  progress: Progress[];
  allTutorials: Tutorial[];
}

export function DashboardClient({ user, workspaces, progress, allTutorials }: DashboardClientProps) {
  const isManager = user.role === "manager";
  const [viewMode, setViewMode] = useState<"manager" | "employee">(isManager ? "manager" : "employee");

  // Load view mode from localStorage
  useEffect(() => {
    if (isManager) {
      const saved = localStorage.getItem("viewMode");
      if (saved === "employee" || saved === "manager") {
        setViewMode(saved);
      }
    }
  }, [isManager]);

  // Listen for view mode changes from UserButton
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("viewMode");
      if (saved === "employee" || saved === "manager") {
        setViewMode(saved);
      }
    };
    window.addEventListener("storage", handleStorage);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const saved = localStorage.getItem("viewMode");
      if (saved && saved !== viewMode && isManager) {
        setViewMode(saved as "manager" | "employee");
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [viewMode, isManager]);

  const showManagerView = isManager && viewMode === "manager";

  // Calculate stats
  const totalTutorials = allTutorials.length;
  const completedTutorials = progress.filter(p => p.completed).length;
  const inProgressTutorials = progress.filter(p => !p.completed && (p.completedAnnotations?.length || 0) > 0).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
              3D
            </div>
            <span className="text-xl font-bold">TrainSpace</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/studio" className="text-gray-300 hover:text-white transition-colors">
              Studio
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
            {isManager && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                viewMode === "employee" 
                  ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/50"
                  : "bg-blue-600/20 text-blue-400 border border-blue-600/50"
              }`}>
                {viewMode === "employee" ? "Employee View" : "Manager View"}
              </span>
            )}
          </div>
          <p className="text-gray-400">
            {showManagerView 
              ? "Manage your workspaces and tutorials"
              : "Track your training progress"
            }
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {showManagerView ? (
            <>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Workspaces</p>
                <p className="text-3xl font-bold">{workspaces.length}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Total Tutorials</p>
                <p className="text-3xl font-bold">
                  {workspaces.reduce((acc, w) => acc + w.tutorials.length, 0)}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Total Annotations</p>
                <p className="text-3xl font-bold">
                  {workspaces.reduce((acc, w) => 
                    acc + w.tutorials.reduce((a, t) => a + t.annotations.length, 0), 0
                  )}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-400">{completedTutorials}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-yellow-400">{inProgressTutorials}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Available</p>
                <p className="text-3xl font-bold text-blue-400">{totalTutorials}</p>
              </div>
            </>
          )}
        </div>

        {showManagerView ? (
          /* Manager View */
          <>
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/workspaces/new"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  + Create Workspace
                </Link>
                <Link
                  href="/studio"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Open 3D Studio
                </Link>
              </div>
            </div>

            {/* Workspaces */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Your Workspaces</h2>
                <Link
                  href="/workspaces/new"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  + New
                </Link>
              </div>
              
              {workspaces.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="mb-4">No workspaces yet</p>
                  <Link href="/workspaces/new" className="text-blue-400 hover:underline">
                    Create your first workspace →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {workspaces.map((workspace) => (
                    <Link
                      key={workspace.id}
                      href={`/workspaces/${workspace.id}`}
                      className="block p-4 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{workspace.name}</h3>
                          <p className="text-sm text-gray-400">
                            {workspace.tutorials.length} tutorial{workspace.tutorials.length !== 1 ? "s" : ""} • Created {new Date(workspace.createdAt).toLocaleDateString()}
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
          </>
        ) : (
          /* Employee View */
          <>
            {/* My Progress */}
            {progress.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 mb-8">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-lg font-semibold">My Training Progress</h2>
                </div>
                <div className="divide-y divide-gray-700">
                  {progress.map((p) => {
                    const totalSteps = p.tutorial.annotations.length;
                      const completedSteps = p.completedAnnotations?.length || 0;
                    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
                    
                    return (
                      <div key={p.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">{p.tutorial.title}</h3>
                            <p className="text-sm text-gray-400">{p.tutorial.workspace?.name}</p>
                          </div>
                          {p.completed ? (
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                              In Progress
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${p.completed ? "bg-green-500" : "bg-blue-500"}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-16 text-right">
                            {completedSteps}/{totalSteps}
                          </span>
                          <Link
                            href={`/share/${p.tutorial.shareLink}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                          >
                            {p.completed ? "Review" : "Continue"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Tutorials */}
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Available Tutorials</h2>
                <p className="text-sm text-gray-400 mt-1">Start a new training module</p>
              </div>
              
              {allTutorials.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p>No tutorials available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {allTutorials.map((tutorial) => {
                    const existingProgress = progress.find(p => p.tutorialId === tutorial.id);
                    const isStarted = !!existingProgress;
                    const isCompleted = existingProgress?.completed;
                    
                    return (
                      <div
                        key={tutorial.id}
                        className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{tutorial.title}</h3>
                          {isCompleted && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {tutorial.workspace?.name || "Unknown workspace"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {tutorial.annotations.length} steps
                          </span>
                          <Link
                            href={`/share/${tutorial.shareLink}`}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              isCompleted
                                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                : isStarted
                                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {isCompleted ? "Review" : isStarted ? "Continue" : "Start"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
