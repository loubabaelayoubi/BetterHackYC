"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "employee">("employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      }, {
        onSuccess: async () => {
          // Update role after signup via API if needed
          // For now, role is set via additionalFields
          router.push("/dashboard");
          router.refresh();
        },
      });

      if (result.error) {
        setError(result.error.message || "Sign up failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-gray-800 rounded-xl border border-gray-700">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">Create Account</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-300">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1 text-gray-300">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "manager" | "employee")}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <a href="/auth/signin" className="text-blue-400 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
