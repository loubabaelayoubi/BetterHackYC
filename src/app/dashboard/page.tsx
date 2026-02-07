import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserButton } from "@/components/auth";
import Link from "next/link";
import { db } from "@/db";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const { user } = session;

  // Fetch user's workspaces
  const workspaces = await db.query.workspace.findMany({
    where: (workspace, { eq }) => eq(workspace.createdBy, user.id),
    orderBy: (workspace, { desc }) => [desc(workspace.createdAt)],
    with: {
      tutorials: true,
    },
  });

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-400">Manage your workspaces and tutorials</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Role</p>
            <p className="text-xl font-semibold capitalize">{user.role}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Email</p>
            <p className="text-xl font-semibold truncate">{user.email}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Workspaces</p>
            <p className="text-xl font-semibold">0</p>
          </div>
        </div>

        {/* Quick Actions for all users */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/workspaces/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Create Workspace
            </Link>
            <Link
              href="/studio"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Open 3D Studio
            </Link>
            <Link
              href="/tutorials"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              View Tutorials
            </Link>
          </div>
        </div>

        {/* Workspaces Section */}
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
              <Link
                href="/workspaces/new"
                className="text-blue-400 hover:underline"
              >
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
      </main>
    </div>
  );
}
