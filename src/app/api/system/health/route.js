import sql from "@/app/api/utils/sql";

// Simple health check endpoint for production readiness
// - Verifies database connectivity
// - Returns overall status and per-check details
export async function GET() {
  const checks = {
    database: { ok: false, responseTimeMs: null, error: null },
  };

  let overall = "ok";

  // Database check
  const start = Date.now();
  try {
    const rows = await sql`SELECT 1 as ok`;
    const elapsed = Date.now() - start;
    checks.database.ok = Array.isArray(rows) && rows.length > 0;
    checks.database.responseTimeMs = elapsed;
  } catch (err) {
    checks.database.ok = false;
    checks.database.error = err?.message || String(err);
    overall = "error";
  }

  if (!checks.database.ok) {
    overall = "error";
  }

  return Response.json({
    success: true,
    status: overall,
    checks,
    timestamp: new Date().toISOString(),
  });
}
