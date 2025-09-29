import sql from "@/app/api/utils/sql";
import { upload } from "@/app/api/utils/upload";

// Game Replay API
// Stores or retrieves a game's replay reference under games.game_data.replay
// POST body: { gameId?: number, sessionId?: string, format?: string, data?: any, url?: string, base64?: string }
// If url or base64 is provided, the file will be uploaded and stored as replay_url; otherwise JSON is stored in replay_data

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = toNumber(searchParams.get("gameId"));
    const sessionId = searchParams.get("sessionId");

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
    }

    if (!game)
      return Response.json({ error: "Game not found" }, { status: 404 });

    const replay = game?.game_data?.replay || null;
    return Response.json({ gameId: game.id, replay });
  } catch (error) {
    console.error("Replay GET error:", error);
    return Response.json({ error: "Failed to load replay" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      gameId: rawGameId,
      sessionId,
      format = "json",
      data,
      url,
      base64,
    } = body || {};

    let gameId = toNumber(rawGameId);
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
    }

    if (!game)
      return Response.json({ error: "Game not found" }, { status: 404 });

    let replayRef = { format };

    if (url || base64) {
      const {
        url: uploadedUrl,
        mimeType,
        error,
      } = await upload({ url, base64 });
      if (error)
        return Response.json({ error: String(error) }, { status: 500 });
      replayRef = { ...replayRef, url: uploadedUrl, mimeType };
    } else if (data) {
      replayRef = { ...replayRef, data };
    } else {
      return Response.json(
        { error: "Provide url, base64, or data" },
        { status: 400 },
      );
    }

    const updated = await sql`
      UPDATE games
      SET game_data = COALESCE(game_data, '{}'::jsonb)
        || jsonb_build_object('replay', ${JSON.stringify(replayRef)}::jsonb)
      WHERE id = ${game.id}
      RETURNING id, game_data
    `;

    return Response.json({
      success: true,
      gameId: game.id,
      replay: updated?.[0]?.game_data?.replay || replayRef,
    });
  } catch (error) {
    console.error("Replay POST error:", error);
    return Response.json({ error: "Failed to save replay" }, { status: 500 });
  }
}
