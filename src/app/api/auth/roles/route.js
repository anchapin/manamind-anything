import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const ALLOWED_ROLES = ["admin", "user", "viewer"];

async function ensureRolesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100),
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_key ON user_roles (user_id)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_roles_email_key ON user_roles (email)`;
  } catch (e) {
    console.error("ensureRolesTable error:", e);
    throw e;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    await ensureRolesTable();

    const [countRow] = await sql`SELECT COUNT(*)::int AS count FROM user_roles`;
    const total = countRow?.count ?? 0;

    let row = null;
    if (email) {
      [row] =
        await sql`SELECT user_id, email, role FROM user_roles WHERE email = ${email} LIMIT 1`;
    } else if (userId) {
      [row] =
        await sql`SELECT user_id, email, role FROM user_roles WHERE user_id = ${userId} LIMIT 1`;
    }

    return Response.json({
      role: row?.role || "user",
      email: row?.email || email || null,
      userId: row?.user_id || userId || null,
      bootstrapAllowed: total === 0,
    });
  } catch (error) {
    console.error("roles GET error:", error);
    return Response.json({ error: "Failed to load role" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { targetEmail, targetUserId, role } = body || {};

    if (!role || !ALLOWED_ROLES.includes(String(role))) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!targetEmail && !targetUserId) {
      return Response.json({ error: "Missing target" }, { status: 400 });
    }

    await ensureRolesTable();

    const [countRow] = await sql`SELECT COUNT(*)::int AS count FROM user_roles`;
    const total = countRow?.count ?? 0;

    // Bootstrap: first ever role assignment can promote to admin without actor check
    if (total === 0 && role === "admin") {
      const [ins] = await sql`
        INSERT INTO user_roles (user_id, email, role)
        VALUES (${targetUserId || null}, ${targetEmail || null}, ${role})
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, updated_at = now()
        RETURNING user_id, email, role
      `;
      return Response.json({ ok: true, bootstrapGranted: true, assigned: ins });
    }

    // Non-bootstrap: require current authenticated user to be an admin
    const session = await auth();
    const actorEmail = session?.user?.email || null;
    if (!actorEmail) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const [actor] =
      await sql`SELECT role FROM user_roles WHERE email = ${actorEmail} LIMIT 1`;
    if (!actor || actor.role !== "admin") {
      return Response.json({ error: "Admin required" }, { status: 403 });
    }

    const [ins] = await sql`
      INSERT INTO user_roles (user_id, email, role)
      VALUES (${targetUserId || null}, ${targetEmail || null}, ${role})
      ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, updated_at = now()
      RETURNING user_id, email, role
    `;

    return Response.json({ ok: true, assigned: ins });
  } catch (error) {
    console.error("roles POST error:", error);
    return Response.json({ error: "Failed to assign role" }, { status: 500 });
  }
}
