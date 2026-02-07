"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ViewMode = "manager" | "employee";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isManager: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ 
  children, 
  userRole 
}: { 
  children: ReactNode;
  userRole: string;
}) {
  const isManager = userRole === "manager";
  const [viewMode, setViewMode] = useState<ViewMode>(isManager ? "manager" : "employee");

  // Persist view mode in localStorage for managers
  useEffect(() => {
    if (isManager) {
      const saved = localStorage.getItem("viewMode");
      if (saved === "employee" || saved === "manager") {
        setViewMode(saved);
      }
    }
  }, [isManager]);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (isManager) {
      localStorage.setItem("viewMode", mode);
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode: handleSetViewMode, isManager }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within ViewModeProvider");
  }
  return context;
}
