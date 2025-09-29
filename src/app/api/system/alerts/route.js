import sql from "@/app/api/utils/sql";

// System Alerts API: surfaces operational issues for UI toasts/dashboards
export async function GET() {
  try {
    // Job queue counts
    const [counts] = await sql`
      SELECT
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END)::int AS queued,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END)::int AS processing,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed
      FROM training_jobs
    `;

    // Active workers in the last 15 seconds
    const activeWorkers = await sql`
      SELECT worker_id, status, started_at, stopped_at, last_heartbeat, info
      FROM training_workers
      WHERE last_heartbeat > NOW() - INTERVAL '15 seconds'
      ORDER BY last_heartbeat DESC
    `;

    const alerts = [];

    const queued = counts?.queued || 0;
    const failed = counts?.failed || 0;
    const activeCount = activeWorkers?.length || 0;

    if (failed > 0) {
      alerts.push({
        id: `jobs_failed_${failed}`,
        severity: "error",
        title: "Training job failures",
        message: `${failed} job(s) have failed`,
        area: "training_jobs",
      });
    }

    if (queued > 0 && activeCount === 0) {
      alerts.push({
        id: `queue_stalled_${queued}`,
        severity: "warning",
        title: "Training queue stalled",
        message: `There are ${queued} queued job(s) but no active workers in the last 15s`,
        area: "workers",
      });
    }

    // Check Forge environment health (best-effort)
    let forgeStatus = null;
    try {
      const base = process.env.BASE_URL || "http://localhost:4000";
      const resp = await fetch(`${base}/api/forge/setup`, { method: "GET" });
      if (resp.ok) {
        forgeStatus = await resp.json();
        if (forgeStatus?.status === "error") {
          alerts.push({
            id: "forge_env_error",
            severity: "error",
            title: "Forge environment error",
            message: "Forge or Java not ready; see Environment Setup for details",
            area: "forge",
          });
        } else if (forgeStatus?.status === "warning") {
          alerts.push({
            id: "forge_env_warning",
            severity: "warning",
            title: "Forge environment warning",
            message: "Some Forge checks reported warnings",
            area: "forge",
          });
        }
      }
    } catch (e) {
      // Ignore external check failures; do not block alerts endpoint
      console.error("Forge status check failed:", e);
    }

    return Response.json({
      success: true,
      alerts,
      counts: counts || { queued: 0, processing: 0, failed: 0, completed: 0 },
      workers: activeWorkers,
      forge: forgeStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("System alerts error:", error);
    return Response.json({ error: "Could not compute alerts" }, { status: 500 });
  }
}
