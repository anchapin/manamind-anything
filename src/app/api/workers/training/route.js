import sql from "@/app/api/utils/sql";

// In-memory worker state (module-scoped singleton)
let workerInterval = null;
let running = false;
const workerId = `worker_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export async function GET() {
  try {
    // Queue counts
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

    // Local worker row (may not exist in this process)
    const [localWorker] = await sql`
      SELECT worker_id, status, started_at, stopped_at, last_heartbeat, info
      FROM training_workers WHERE worker_id = ${workerId}
    `;

    return Response.json({
      running: (activeWorkers?.length || 0) > 0,
      localRunning: running,
      workerId,
      counts: counts || { queued: 0, processing: 0, failed: 0, completed: 0 },
      activeWorkers,
      worker: localWorker || null,
    });
  } catch (error) {
    console.error("Worker status error:", error);
    return Response.json(
      { error: "Could not fetch worker status" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { action, payload, type, priority, sessionId, modelVersion } =
      await request.json();

    switch (action) {
      case "start":
        if (!running) {
          await upsertWorker("running");
          startLoop();
        }
        return Response.json({ success: true, running: true, workerId });
      case "stop":
        if (running) {
          stopLoop();
          await sql`
            UPDATE training_workers
            SET status = 'stopped', stopped_at = NOW(), last_heartbeat = NOW()
            WHERE worker_id = ${workerId}
          `;
        }
        return Response.json({ success: true, running: false, workerId });
      case "enqueue": {
        const jobType = type || (payload?.type ?? "self_play");
        const [job] = await sql`
          INSERT INTO training_jobs (type, payload, priority, status, session_id, model_version)
          VALUES (${jobType}, ${JSON.stringify(payload || {})}, ${priority || 0}, 'queued', ${sessionId || null}, ${modelVersion || null})
          RETURNING *
        `;
        return Response.json({ success: true, job });
      }
      case "enqueue_self_play": {
        const [job] = await sql`
          INSERT INTO training_jobs (type, payload, priority, status, session_id, model_version)
          VALUES ('self_play', ${JSON.stringify(payload || {})}, ${priority || 0}, 'queued', ${sessionId || null}, ${modelVersion || null})
          RETURNING *
        `;
        return Response.json({ success: true, job });
      }
      case "enqueue_eval": {
        const [job] = await sql`
          INSERT INTO training_jobs (type, payload, priority, status, session_id, model_version)
          VALUES ('evaluate', ${JSON.stringify(payload || {})}, ${priority || 0}, 'queued', ${sessionId || null}, ${modelVersion || null})
          RETURNING *
        `;
        return Response.json({ success: true, job });
      }
      case "status":
        return await GET();
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Worker control error:", error);
    return Response.json({ error: "Worker control failed" }, { status: 500 });
  }
}

function startLoop() {
  running = true;
  // quick heartbeat and job sweep every 2s
  workerInterval = setInterval(async () => {
    try {
      await heartbeat();
      const job = await claimJob();
      if (job) {
        await processJob(job);
      }
    } catch (e) {
      console.error("Worker loop error:", e);
    }
  }, 2000);
}

function stopLoop() {
  running = false;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

async function upsertWorker(status) {
  // Try insert, then update on conflict
  await sql`
    INSERT INTO training_workers (worker_id, status, info)
    VALUES (${workerId}, ${status}, ${JSON.stringify({ pid: process.pid || null })})
    ON CONFLICT (worker_id) DO UPDATE SET status = ${status}, last_heartbeat = NOW()
  `;
}

async function heartbeat() {
  await sql`
    UPDATE training_workers
    SET last_heartbeat = NOW(), status = ${running ? "running" : "idle"}
    WHERE worker_id = ${workerId}
  `;
}

async function claimJob() {
  // Atomically pick the highest priority queued job
  const [job] = await sql`
    WITH picked AS (
      SELECT id FROM training_jobs
      WHERE status = 'queued'
      ORDER BY priority DESC, created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE training_jobs j
    SET status = 'processing', started_at = NOW(), worker_id = ${workerId}, attempts = attempts + 1
    FROM picked
    WHERE j.id = picked.id
    RETURNING j.*
  `;
  return job || null;
}

async function processJob(job) {
  try {
    switch (job.type) {
      case "self_play":
        await processSelfPlay(job);
        break;
      case "evaluate":
        await processEvaluate(job);
        break;
      case "checkpoint":
        await processCheckpoint(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await sql`
      UPDATE training_jobs SET status = 'completed', completed_at = NOW(), error = NULL
      WHERE id = ${job.id}
    `;
  } catch (err) {
    console.error("Job failed:", err);
    const willRetry = (job.attempts || 1) < (job.max_attempts || 3);

    await sql`
      UPDATE training_jobs
      SET status = ${willRetry ? "queued" : "failed"}, error = ${String(err?.message || err)}, started_at = NULL, worker_id = NULL
      WHERE id = ${job.id}
    `;
  }
}

async function ensureModel(modelVersion) {
  if (!modelVersion) return;
  const [exists] =
    await sql`SELECT 1 FROM models WHERE version = ${modelVersion}`;
  if (!exists) {
    await sql`
      INSERT INTO models (version, name, description, architecture, status)
      VALUES (
        ${modelVersion},
        ${`Model ${modelVersion}`},
        'Auto-created by background worker',
        'alphazero',
        'training'
      )
    `;
  }
}

async function processSelfPlay(job) {
  const payload = job.payload || {};
  const games = Number(payload.games || 100);
  const sessionId = job.session_id || null;
  const modelVersion = job.model_version || payload.modelVersion || null;

  // Simulate self-play batch
  const winRate = 0.4 + Math.random() * 0.3;
  const avgTurns = 10 + Math.random() * 4;

  if (sessionId) {
    await sql`
      UPDATE training_sessions
      SET games_completed = COALESCE(games_completed, 0) + ${games}, win_rate = ${winRate}, updated_at = NOW()
      WHERE id = ${sessionId}
    `;
  }

  if (modelVersion) {
    await ensureModel(modelVersion);
    await sql`
      INSERT INTO performance_metrics (session_id, model_version, metric_name, metric_value, game_count)
      VALUES
        (${sessionId}, ${modelVersion}, 'win_rate', ${winRate}, ${games}),
        (${sessionId}, ${modelVersion}, 'avg_turns', ${avgTurns}, ${games}),
        (${sessionId}, ${modelVersion}, 'self_play_batch', ${games}, ${games})
    `;
  }

  // Write a few sample games for observability (not one per game to limit volume)
  const sampleCount = Math.min(5, Math.max(1, Math.floor(games / 20)));
  const sessionStr = sessionId
    ? `session_${sessionId}`
    : `ad_hoc_${Date.now()}`;
  for (let i = 0; i < sampleCount; i++) {
    const p1won = Math.random() < winRate;
    await sql`
      INSERT INTO games (session_id, game_type, status, player1_type, player2_type, winner, turn_count, duration_seconds, game_data)
      VALUES (
        ${sessionStr}, 'self_play', 'completed', 'neural', 'neural', ${p1won ? "player1" : "player2"},
        ${Math.round(avgTurns + (Math.random() * 4 - 2))}, ${20 + Math.floor(Math.random() * 40)},
        ${JSON.stringify({ batchJobId: job.id, modelVersion, note: "background self-play sample" })}
      )
    `;
  }
}

async function processEvaluate(job) {
  const payload = job.payload || {};
  const sessionId = job.session_id || null;
  const modelVersion = job.model_version || payload.modelVersion || null;

  const winVsPrev = 0.45 + Math.random() * 0.25;
  const policyAcc = 0.5 + Math.random() * 0.4;
  const valueAcc = 0.5 + Math.random() * 0.4;

  if (modelVersion) {
    await ensureModel(modelVersion);
    await sql`
      INSERT INTO performance_metrics (session_id, model_version, metric_name, metric_value, game_count)
      VALUES
        (${sessionId}, ${modelVersion}, 'win_rate_vs_previous', ${winVsPrev}, ${payload.evalGames || 200}),
        (${sessionId}, ${modelVersion}, 'policy_accuracy', ${policyAcc}, ${payload.evalGames || 200}),
        (${sessionId}, ${modelVersion}, 'value_accuracy', ${valueAcc}, ${payload.evalGames || 200})
    `;

    await sql`
      UPDATE models SET win_rate_vs_previous = ${winVsPrev}, policy_accuracy = ${policyAcc}, value_accuracy = ${valueAcc}
      WHERE version = ${modelVersion}
    `;
  }
}

async function processCheckpoint(job) {
  const payload = job.payload || {};
  const modelVersion = job.model_version || payload.modelVersion || null;

  // Simulate checkpoint writing by updating model metadata
  if (modelVersion) {
    await ensureModel(modelVersion);
    await sql`
      UPDATE models SET model_data = COALESCE(model_data, '{}'::jsonb) || ${JSON.stringify({ lastCheckpoint: new Date().toISOString() })}::jsonb
      WHERE version = ${modelVersion}
    `;
  }
}
