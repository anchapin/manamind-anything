// System Env Status API
// Returns a safe summary of expected environment variables and whether they are set

export async function GET() {
  try {
    const groups = [
      {
        title: "Core",
        description: "Required for auth, URLs, and database access.",
        vars: [
          { name: "DATABASE_URL", required: true },
          { name: "AUTH_SECRET", required: true },
          { name: "AUTH_URL", required: true },
          { name: "BASE_URL", required: false },
        ].map((v) => ({ ...v, set: Boolean(process.env[v.name]) })),
      },
      {
        title: "Forge",
        description: "Paths and Java config used by the Forge integration.",
        vars: [
          { name: "FORGE_PATH", required: false },
          { name: "FORGE_TEMP_DIR", required: false },
          { name: "JAVA_PATH", required: false },
        ].map((v) => ({ ...v, set: Boolean(process.env[v.name]) })),
      },
      {
        title: "Runners",
        description: "External services for neural and MTGA runners.",
        vars: [
          { name: "NEURAL_RUNNER_URL", required: false },
          { name: "NEURAL_RUNNER_API_KEY", required: false },
          { name: "MTGA_RUNNER_URL", required: false },
          { name: "MTGA_RUNNER_API_KEY", required: false },
        ].map((v) => ({ ...v, set: Boolean(process.env[v.name]) })),
      },
      {
        title: "Frontend (public)",
        description:
          "Available in the browser. Must be prefixed with NEXT_PUBLIC_.",
        vars: [
          { name: "NEXT_PUBLIC_CREATE_ENV", required: false },
          { name: "NEXT_PUBLIC_API_BASE_URL", required: false },
        ].map((v) => ({ ...v, set: Boolean(process.env[v.name]) })),
      },
    ];

    const problems = [];
    // Minimal sanity checks
    if (!process.env.DATABASE_URL) problems.push("DATABASE_URL is not set");
    if (!process.env.AUTH_SECRET) problems.push("AUTH_SECRET is not set");
    if (!process.env.AUTH_URL) problems.push("AUTH_URL is not set");

    return Response.json({
      success: true,
      groups,
      problems,
      timestamp: new Date().toISOString(),
      notes: [
        "Set secrets from Project Settings → Secrets.",
        "Only NEXT_PUBLIC_* are exposed to the web pages; others stay on the server.",
      ],
    });
  } catch (error) {
    console.error("Env status error:", error);
    return Response.json(
      { success: false, error: "Failed to read env status" },
      { status: 500 }
    );
  }
}
