"use client";

import { useState, useMemo } from "react";
import useUser from "@/utils/useUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function RolesAdminPage() {
  const { data: user, loading } = useUser();
  const email = user?.email || null;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["role", email],
    queryFn: async () => {
      if (!email) return { role: "guest", bootstrapAllowed: false };
      const res = await fetch(
        `/api/auth/roles?email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) {
        throw new Error(
          `When fetching /api/auth/roles, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    enabled: !!email,
  });

  const myRole = data?.role || (email ? "user" : "guest");
  const canBootstrap = !!data?.bootstrapAllowed;

  const [targetEmail, setTargetEmail] = useState("");
  const [targetRole, setTargetRole] = useState("user");
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(null);

  const assignRole = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/auth/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || `Failed with ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess("Saved");
      queryClient.invalidateQueries({ queryKey: ["role", email] });
      setTimeout(() => setSuccess(null), 2000);
    },
    onError: (err) => {
      setSubmitError(err.message || "Save failed");
    },
  });

  const handleBootstrap = async () => {
    setSubmitError(null);
    if (!email) return;
    assignRole.mutate({ targetEmail: email, role: "admin" });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!email) {
      setSubmitError("Sign in first");
      return;
    }
    if (!targetEmail) {
      setSubmitError("Enter target email");
      return;
    }
    assignRole.mutate({ targetEmail, role: targetRole });
  };

  const content = useMemo(() => {
    if (loading) {
      return <div>Loading auth...</div>;
    }
    if (!user) {
      return (
        <div className="text-center">
          <p className="mb-4">You are not signed in.</p>
          <a
            href="/account/signin"
            className="text-[#357AFF] hover:text-[#2E69DE]"
          >
            Sign in
          </a>
        </div>
      );
    }

    if (isLoading) {
      return <div>Loading role...</div>;
    }

    return (
      <div>
        <div className="mb-6">
          <div className="text-sm text-gray-600">Signed in as</div>
          <div className="font-medium">{email}</div>
          <div className="mt-1 text-sm">
            Your role: <span className="font-semibold">{myRole}</span>
          </div>
        </div>

        {canBootstrap && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="font-medium mb-2">Bootstrap admin</div>
            <p className="text-sm mb-3">
              No roles exist yet. You can make your account an admin.
            </p>
            <button
              onClick={handleBootstrap}
              className="rounded-lg bg-[#357AFF] px-4 py-2 text-white text-sm hover:bg-[#2E69DE]"
              disabled={assignRole.isLoading}
            >
              {assignRole.isLoading ? "Saving..." : "Make me admin"}
            </button>
          </div>
        )}

        {myRole === "admin" && (
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User email
              </label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#357AFF] focus:ring-1 focus:ring-[#357AFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#357AFF] focus:ring-1 focus:ring-[#357AFF]"
              >
                <option value="user">user</option>
                <option value="viewer">viewer</option>
                <option value="admin">admin</option>
              </select>
            </div>

            {submitError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
                {submitError}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={assignRole.isLoading}
              className="rounded-lg bg-[#357AFF] px-4 py-2 text-white text-sm hover:bg-[#2E69DE]"
            >
              {assignRole.isLoading ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </div>
    );
  }, [
    loading,
    user,
    isLoading,
    email,
    myRole,
    canBootstrap,
    assignRole.isLoading,
    targetEmail,
    targetRole,
    submitError,
    success,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow border border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            User Roles
          </h1>
          {error ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              Failed to load role
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}
