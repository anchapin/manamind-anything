import sql from "@/app/api/utils/sql";

// Real Neural Training Runner Proxy
// Bridges the web app to an external Python service (e.g., PyTorch) via HTTP
// Configure with:
// - process.env.NEURAL_RUNNER_URL (e.g., http://localhost:8000)
// - process.env.NEURAL_RUNNER_API_KEY (optional)

function makeRunnerUrl(path) {
  const base = process.env.NEURAL_RUNNER_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

function makeHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.NEURAL_RUNNER_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.NEURAL_RUNNER_API_KEY}`;
  }
  return headers;
}

export async function POST(request) {
  try {
    const { action, config, runId, cursor } = await request.json();

    switch (action) {
      case 'start':
        return await startRun(config || {});
      case 'status':
        return await getStatus(runId);
      case 'stop':
        return await stopRun(runId);
      case 'logs':
        return await getLogs(runId, cursor);
      case 'checkpoint':
        return await createCheckpoint(runId, config || {});
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Neural runner error:', error);
    return Response.json({ error: 'Neural runner request failed' }, { status: 500 });
  }
}

export async function GET() {
  // health check and basic info
  try {
    const url = makeRunnerUrl('/health');
    if (!url) {
      return Response.json({
        connected: false,
        reason: 'NEURAL_RUNNER_URL not set',
      }, { status: 200 });
    }

    const res = await fetch(url, { headers: makeHeaders() });
    const data = await res.json().catch(() => ({}));

    return Response.json({ connected: res.ok, info: data });
  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 200 });
  }
}

async function startRun(cfg) {
  const url = makeRunnerUrl('/train/start');
  if (!url) {
    return Response.json({ error: 'Runner URL not configured' }, { status: 500 });
  }

  const payload = {
    // Model + training hyperparams
    modelVersion: cfg.modelVersion || `neural_${Date.now()}`,
    architecture: cfg.architecture || 'alphazero',
    actionSpace: cfg.actionSpace || 200,
    learningRate: cfg.learningRate ?? 0.001,
    batchSize: cfg.batchSize ?? 64,
    epochs: cfg.epochs ?? 1,
    mctsSimulations: cfg.mctsSimulations ?? 100,
    selfPlayGames: cfg.selfPlayGames || cfg.targetGames || 10000,
    evalInterval: cfg.evaluationInterval || 1000,
    // Optional storage integration
    checkpointEvery: cfg.checkpointEvery || 500,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `Runner responded ${res.status}`, details: text }, { status: 500 });
  }

  const data = await res.json();

  // Persist a session row if not already present
  try {
    const [existing] = await sql`SELECT id FROM training_sessions WHERE model_version = ${payload.modelVersion} AND status IN ('running','paused') LIMIT 1`;

    if (!existing) {
      await sql`
        INSERT INTO training_sessions (name, model_version, status, target_games, config)
        VALUES (
          ${`Neural Training ${payload.modelVersion}`},
          ${payload.modelVersion},
          'running',
          ${payload.selfPlayGames},
          ${JSON.stringify({ mode: 'neural', runner: { runId: data.runId } })}
        )
      `;
    } else {
      await sql`
        UPDATE training_sessions
        SET status = 'running', updated_at = NOW(), config = jsonb_set(COALESCE(config,'{}'::jsonb), '{runner}', ${JSON.stringify({ runId: data.runId })}::jsonb, true)
        WHERE id = ${existing.id}
      `;
    }
  } catch (dbErr) {
    console.error('Failed to persist training session for runner:', dbErr);
  }

  return Response.json({ success: true, runId: data.runId, modelVersion: payload.modelVersion });
}

async function getStatus(runId) {
  const url = makeRunnerUrl(`/train/status?runId=${encodeURIComponent(runId || '')}`);
  if (!url) return Response.json({ error: 'Runner URL not configured' }, { status: 500 });

  const res = await fetch(url, { headers: makeHeaders() });
  if (!res.ok) return Response.json({ error: `Runner responded ${res.status}` }, { status: 500 });
  const data = await res.json();

  // Optionally persist lightweight progress
  try {
    if (data?.modelVersion && (data?.progress?.gamesCompleted || data?.metrics?.winRate)) {
      await sql`
        UPDATE training_sessions
        SET games_completed = COALESCE(games_completed, 0) + ${data.progress?.deltaGames || 0},
            win_rate = COALESCE(${data.metrics?.winRate}, win_rate),
            updated_at = NOW()
        WHERE model_version = ${data.modelVersion} AND status = 'running'
      `;
    }
  } catch (dbErr) {
    console.error('Failed to persist status update:', dbErr);
  }

  return Response.json({ success: true, status: data });
}

async function stopRun(runId) {
  const url = makeRunnerUrl('/train/stop');
  if (!url) return Response.json({ error: 'Runner URL not configured' }, { status: 500 });

  const res = await fetch(url, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify({ runId }),
  });

  if (!res.ok) return Response.json({ error: `Runner responded ${res.status}` }, { status: 500 });
  const data = await res.json();

  try {
    await sql`
      UPDATE training_sessions
      SET status = 'completed', updated_at = NOW()
      WHERE config->'runner'->>'runId' = ${runId}
    `;
  } catch (dbErr) {
    console.error('Failed to mark session completed:', dbErr);
  }

  return Response.json({ success: true, result: data });
}

async function getLogs(runId, cursor) {
  const url = makeRunnerUrl(`/train/logs?runId=${encodeURIComponent(runId || '')}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
  if (!url) return Response.json({ error: 'Runner URL not configured' }, { status: 500 });

  const res = await fetch(url, { headers: makeHeaders() });
  if (!res.ok) return Response.json({ error: `Runner responded ${res.status}` }, { status: 500 });
  const data = await res.json();
  return Response.json({ success: true, logs: data.logs || [], nextCursor: data.nextCursor || null });
}

async function createCheckpoint(runId, cfg) {
  const url = makeRunnerUrl('/train/checkpoint');
  if (!url) return Response.json({ error: 'Runner URL not configured' }, { status: 500 });

  const res = await fetch(url, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify({ runId, label: cfg.label }),
  });

  if (!res.ok) return Response.json({ error: `Runner responded ${res.status}` }, { status: 500 });
  const data = await res.json();
  return Response.json({ success: true, checkpoint: data });
}
