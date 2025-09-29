import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AlertsListener() {
  const seenIdsRef = useRef(new Set());

  const { data, error } = useQuery({
    queryKey: ["system-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/system/alerts");
      if (!res.ok) {
        throw new Error(`When fetching /api/system/alerts, the response was [${res.status}] ${res.statusText}`);
      }
      return res.json();
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      toast.error("Alerts check failed", { description: String(error?.message || error) });
      return;
    }
    const alerts = data?.alerts || [];
    for (const a of alerts) {
      if (!seenIdsRef.current.has(a.id)) {
        seenIdsRef.current.add(a.id);
        if (a.severity === "error") {
          toast.error(a.title || "Error", { description: a.message });
        } else if (a.severity === "warning") {
          toast.warning(a.title || "Warning", { description: a.message });
        } else {
          toast(a.title || "Notice", { description: a.message });
        }
      }
    }
  }, [data, error]);

  return null;
}
