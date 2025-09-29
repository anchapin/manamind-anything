import sql from "@/app/api/utils/sql";

// Game Logs API
// Stores and retrieves per-game event logs inside games.game_data JSON
// POST body: { gameId?: number, sessionId?: string, events: [{ type: string, payload?: any, at?: string|number }], createIfMissing?: boolean }
// GET  query: ?gameId=123[&from=0&limit=200] OR ?sessionId=abc to fetch recent logs

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = toNumber(searchParams.get("gameId"));
    const sessionId = searchParams.get("sessionId");
    const fromIdx = toNumber(searchParams.get("from")) ?? 0;
    const limit = Math.min(toNumber(searchParams.get("limit")) ?? 500, 2000);

    let game;
    if (gameId) {
      [game] = await sql`SELECT id, game_data FROM games WHERE id = ${gameId}`;
    } else if (sessionId) {
      // most recent game for this session
      [game] = await sql`
        SELECT id, game_data
        FROM games
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    if (!game) {
      return Response.json({ events: [], nextIndex: 0, gameId: null });
    }

    const log = Array.isArray(game?.game_data?.log) ? game.game_data.log : [];
    const slice = log.slice(fromIdx, fromIdx + limit);
    const nextIndex = fromIdx + slice.length;

    return Response.json({
      gameId: game.id,
      events: slice,
      nextIndex,
      total: log.length,
    });
  } catch (error) {
    console.error("Game logs GET error:", error);
    return Response.json({ error: "Failed to load logs" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    let { gameId, sessionId, events, createIfMissing } = body || {};

    if (!Array.isArray(events) || events.length === 0) {
      return Response.json({ error: "No events provided" }, { status: 400 });
    }

    // Normalize events
    const normalized = events.map((e) => ({
      type: String(e?.type || "event"),
      at: e?.at ? new Date(e.at).toISOString() : new Date().toISOString(),
      payload: e?.payload ?? null,
    }));

    let game;

    if (gameId) {
      [game] = await sql`SELECT id, game_data FROM games WHERE id = ${gameId}`;
    } else if (sessionId) {
      [game] = await sql`
        SELECT id, game_data FROM games
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (!game && createIfMissing) {
        // Create a minimal active game row for this session
        const [created] = await sql`
          INSERT INTO games (
            session_id, game_type, status, player1_type, player2_type
          ) VALUES (
            ${sessionId}, 'live', 'active', 'user', 'arena'
          ) RETURNING id, game_data
        `;
        game = created;
      }
    }

    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    // Append events into game_data.log atomically
    const updated = await sql`
      UPDATE games
      SET game_data = COALESCE(game_data, '{}'::jsonb)
        || jsonb_build_object(
          'log', COALESCE(game_data->'log', '[]'::jsonb) || ${JSON.stringify(normalized)}::jsonb
        )
      WHERE id = ${game.id}
      RETURNING id, game_data
    `;

    const updatedRow = updated?.[0] || null;
    const total = Array.isArray(updatedRow?.game_data?.log)
      ? updatedRow.game_data.log.length
      : 0;

    return Response.json({
      success: true,
      gameId: game.id,
      appended: normalized.length,
      total,
    });
  } catch (error) {
    console.error("Game logs POST error:", error);
    return Response.json({ error: "Failed to append logs" }, { status: 500 });
  }
}
