// MTGA (Magic: The Gathering Arena) screen/input proxy
// Bridges the web UI to a local/remote runner that can capture the Arena window and send inputs
// Configure with:
// - process.env.MTGA_RUNNER_URL (e.g., http://localhost:8765)
// - process.env.MTGA_RUNNER_API_KEY (optional)

function baseUrl() {
  const base = process.env.MTGA_RUNNER_URL;
  return base ? base.replace(/\/$/, '') : null;
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MTGA_RUNNER_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.MTGA_RUNNER_API_KEY}`;
  }
  return headers;
}

export async function GET() {
  // Health/status from runner
  const base = baseUrl();
  if (!base) {
    return Response.json({ connected: false, reason: 'MTGA_RUNNER_URL not set' }, { status: 200 });
  }

  try {
    const res = await fetch(`${base}/health`, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    return Response.json({ connected: res.ok, info: data }, { status: 200 });
  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    const base = baseUrl();

    if (!base) {
      return Response.json({ success: false, error: 'MTGA runner not configured' }, { status: 500 });
    }

    switch (action) {
      case 'screenshot':
        return await proxyGet(`${base}/screenshot`);
      case 'window_info':
        return await proxyGet(`${base}/window/info`);
      case 'focus_window':
        return await proxyPost(`${base}/window/focus`, {});
      case 'move':
        return await proxyPost(`${base}/input/move`, payload);
      case 'click':
        return await proxyPost(`${base}/input/click`, payload);
      case 'drag':
        return await proxyPost(`${base}/input/drag`, payload);
      case 'key':
        return await proxyPost(`${base}/input/key`, payload);
      case 'type':
        return await proxyPost(`${base}/input/type`, payload);
      case 'ocr':
        return await proxyGet(`${base}/ocr`);
      case 'find':
        return await proxyPost(`${base}/vision/find`, payload);
      default:
        return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MTGA proxy error:', error);
    return Response.json({ success: false, error: 'MTGA proxy failed' }, { status: 500 });
  }
}

async function proxyGet(url) {
  const res = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return Response.json({ success: res.ok, ...body }, { status: res.ok ? 200 : 500 });
}

async function proxyPost(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload || {}),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return Response.json({ success: res.ok, ...body }, { status: res.ok ? 200 : 500 });
}
