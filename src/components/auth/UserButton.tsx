"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import type { AppUser } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function UserButton() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Cast to include custom fields
  const user = session?.user as AppUser | undefined;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isPending) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!session || !user) {
    return (
      <a
        href="/auth/signin"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize">{user.role || "employee"}</p>
      </div>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium hover:bg-blue-700 transition-colors"
        >
          {user.name?.charAt(0).toUpperCase() || "U"}
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <a
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </a>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
