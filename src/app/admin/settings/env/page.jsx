import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function EnvSettingsPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["env-status"],
    queryFn: async () => {
      const res = await fetch("/api/system/env");
      if (!res.ok) {
        throw new Error(`When fetching /api/system/env, the response was [${res.status}] ${res.statusText}`);
      }
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#0B1220] dark:text-white">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold">Environment & Secrets</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2">
            Manage secrets in Project Settings → Secrets. Only variables that start with <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">NEXT_PUBLIC_</code> are available to the browser.
          </p>
        </div>

        {isLoading && (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">Loading…</div>
        )}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Could not load environment status
          </div>
        )}

        {data?.problems?.length > 0 && (
          <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 mb-6">
            <div className="font-medium mb-2">Recommended fixes</div>
            <ul className="list-disc ml-6 space-y-1">
              {data.problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.groups?.map((group, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="mb-3">
                <div className="text-lg font-medium">{group.title}</div>
                {group.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{group.description}</div>
                )}
              </div>
              <div className="space-y-3">
                {group.vars.map((v) => {
                  const badgeColor = v.set
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    : v.required
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
                  const badgeText = v.set ? "set" : v.required ? "missing" : "optional";
                  return (
                    <div key={v.name} className="flex items-center justify-between">
                      <div className="text-sm font-mono break-all">{v.name}</div>
                      <div className={`text-xs px-2 py-1 rounded ${badgeColor}`}>{badgeText}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {data?.notes?.length ? (
          <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
            <ul className="list-disc ml-6 space-y-1">
              {data.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="font-medium mb-2">How to set secrets</div>
          <ol className="list-decimal ml-6 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Open Project Settings in the top-left of the builder.</li>
            <li>Go to Secrets and add keys for your environment.</li>
            <li>Use NEXT_PUBLIC_ prefix for any values needed in the browser.</li>
            <li>Publish to production to set production secrets.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
