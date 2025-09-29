"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gamepad2,
  MousePointerClick,
  Crosshair,
  Keyboard,
  RefreshCw,
  Maximize2,
  Target,
  Square,
} from "lucide-react";

function useMtgaHealth() {
  return useQuery({
    queryKey: ["mtga", "health"],
    queryFn: async () => {
      const res = await fetch("/api/mtga");
      if (!res.ok) throw new Error("Failed to reach MTGA runner");
      return res.json();
    },
    refetchInterval: 5000,
  });
}

function useScreenshot(enabled) {
  return useQuery({
    queryKey: ["mtga", "screenshot"],
    queryFn: async () => {
      const res = await fetch("/api/mtga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "screenshot" }),
      });
      if (!res.ok) throw new Error("Failed to get screenshot");
      const data = await res.json();
      return data;
    },
    enabled,
    refetchInterval: enabled ? 500 : false,
  });
}

function useWindowInfo() {
  return useQuery({
    queryKey: ["mtga", "window_info"],
    queryFn: async () => {
      const res = await fetch("/api/mtga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "window_info" }),
      });
      if (!res.ok) throw new Error("Failed to get window info");
      return res.json();
    },
  });
}

export default function MTGAInterface() {
  const queryClient = useQueryClient();
  const { data: health, isLoading: healthLoading } = useMtgaHealth();
  const { data: winInfo } = useWindowInfo();
  const [stream, setStream] = useState(true);
  const [lastClick, setLastClick] = useState(null);
  const [inputText, setInputText] = useState("Good luck!");
  const containerRef = useRef(null);
  // --- new: track current gameId for logging ---
  const [gameId, setGameId] = useState(null);

  const screenshotQuery = useScreenshot(stream && health?.connected);

  const imageSrc = useMemo(() => {
    const d = screenshotQuery.data;
    if (!d) return null;
    if (d.dataUrl) return d.dataUrl;
    if (d.image) return `data:image/png;base64,${d.image}`;
    if (d.raw && d.raw.startsWith("data:image/")) return d.raw;
    return null;
  }, [screenshotQuery.data]);

  const nativeSize = useMemo(() => {
    const w = winInfo?.info?.window?.width || winInfo?.width;
    const h = winInfo?.info?.window?.height || winInfo?.height;
    return w && h ? { width: w, height: h } : null;
  }, [winInfo]);

  // --- new: ensure an active game exists for logging ---
  const ensureGameMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/games/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "mtga_live",
          gameType: "arena_live",
          player1Type: "user",
          player2Type: "arena",
        }),
      });
      if (!res.ok) throw new Error("Failed to create game");
      const data = await res.json();
      return data?.game?.id;
    },
    onSuccess: (id) => setGameId(id),
  });

  useEffect(() => {
    if (
      health?.connected &&
      stream &&
      !gameId &&
      !ensureGameMutation.isLoading
    ) {
      ensureGameMutation.mutate();
    }
  }, [health?.connected, stream, gameId, ensureGameMutation]);

  // --- new: logging mutation ---
  const logMutation = useMutation({
    mutationFn: async (events) => {
      if (!gameId) return;
      const res = await fetch("/api/games/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, events }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Log failed: ${t}`);
      }
      return res.json();
    },
  });

  const clickMutation = useMutation({
    mutationFn: async ({ x, y }) => {
      const res = await fetch("/api/mtga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "click",
          payload: { x, y, button: "left" },
        }),
      });
      if (!res.ok) throw new Error("Click failed");
      return res.json();
    },
    // --- new: on success, append to logs ---
    onSuccess: (_data, vars) => {
      logMutation.mutate([
        { type: "click", payload: { x: vars.x, y: vars.y } },
      ]);
    },
  });

  const keyMutation = useMutation({
    mutationFn: async (key) => {
      const res = await fetch("/api/mtga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "key", payload: { key, down: true } }),
      });
      if (!res.ok) throw new Error("Key failed");
      return res.json();
    },
    onSuccess: (_d, key) =>
      logMutation.mutate([{ type: "key", payload: { key } }]),
  });

  const typeMutation = useMutation({
    mutationFn: async (text) => {
      const res = await fetch("/api/mtga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "type", payload: { text } }),
      });
      if (!res.ok) throw new Error("Type failed");
      return res.json();
    },
    onSuccess: (_d, text) =>
      logMutation.mutate([{ type: "type", payload: { text } }]),
  });

  const focusMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mtga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "focus_window" }),
      });
      if (!res.ok) throw new Error("Focus failed");
      return res.json();
    },
    onSuccess: () => logMutation.mutate([{ type: "focus_window" }]),
  });

  const onImageClick = useCallback(
    (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      // Map to native window coordinates
      const displayedWidth = rect.width;
      const displayedHeight = rect.height;

      let x = relX;
      let y = relY;
      if (nativeSize) {
        x = Math.round((relX / displayedWidth) * nativeSize.width);
        y = Math.round((relY / displayedHeight) * nativeSize.height);
      }

      setLastClick({ x, y, at: Date.now() });
      clickMutation.mutate({ x, y });
    },
    [nativeSize, clickMutation],
  );

  const statusPill = useMemo(() => {
    if (healthLoading)
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          Checking…
        </span>
      );
    if (health?.connected)
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
          Connected
        </span>
      );
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
        Not connected
      </span>
    );
  }, [health, healthLoading]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Gamepad2 className="text-orange-600" size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                MTGA Interface
              </div>
              <div className="text-xs text-gray-500">Screen + input bridge</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusPill}
            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["mtga"] })
              }
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Viewer */}
        <div className="bg-black rounded-2xl overflow-hidden relative">
          <div
            ref={containerRef}
            className="relative w-full"
            style={{ aspectRatio: "16/9", background: "#111" }}
            onClick={onImageClick}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="MTGA"
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                {health?.connected
                  ? "Waiting for screenshot…"
                  : "Connect MTGA runner to start"}
              </div>
            )}

            {/* Click marker */}
            {lastClick && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${(lastClick.x / (nativeSize?.width || 1920)) * 100}%`,
                  top: `${(lastClick.y / (nativeSize?.height || 1080)) * 100}%`,
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white/80 border-2 border-orange-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Controls</div>
            <button
              onClick={() => setStream((s) => !s)}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${stream ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              {stream ? <Square size={14} /> : <Target size={14} />}{" "}
              {stream ? "Stop" : "Start"} Stream
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => focusMutation.mutate()}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 justify-center"
            >
              <Maximize2 size={14} /> Focus Arena Window
            </button>

            <div>
              <label className="text-xs text-gray-500">Send Key</label>
              <div className="mt-1 flex gap-2">
                {["ESC", "ENTER", "SPACE", "CTRL+L"].map((k) => (
                  <button
                    key={k}
                    onClick={() => keyMutation.mutate(k)}
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Type Text</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  placeholder="Message"
                />
                <button
                  onClick={() => typeMutation.mutate(inputText)}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Native size:{" "}
              {nativeSize
                ? `${nativeSize.width}×${nativeSize.height}`
                : "unknown"}{" "}
              {gameId ? `• Game #${gameId}` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
