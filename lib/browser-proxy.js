/**
 * Browser proxy for write operations.
 * When httpOnly cookies aren't available, delegate API calls
 * through a browser page that has full cookie access.
 * 
 * This uses old.reddit.com's form-based API from within the browser context.
 */

/**
 * Post a comment via browser page fetch (has httpOnly cookies).
 * Requires: OpenClaw browser relay active on a reddit.com tab.
 * 
 * @param {string} thingId - e.g. "t3_1r3kznv" or "t1_xxxxx"
 * @param {string} text - comment text
 * @returns {object} result
 */
export function generateBrowserScript(action, params) {
  switch (action) {
    case 'comment':
      return `
async () => {
  const me = await (await fetch('/api/me.json', {credentials:'include'})).json();
  const modhash = me.data?.modhash;
  if (!modhash) return JSON.stringify({error: 'Not logged in'});
  const body = new URLSearchParams({
    thing_id: ${JSON.stringify(params.thingId)},
    text: ${JSON.stringify(params.text)},
    uh: modhash,
    api_type: 'json'
  });
  const r = await fetch('/api/comment', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString(),
    credentials: 'include'
  });
  return await r.text();
}`;

    case 'submit':
      return `
async () => {
  const me = await (await fetch('/api/me.json', {credentials:'include'})).json();
  const modhash = me.data?.modhash;
  if (!modhash) return JSON.stringify({error: 'Not logged in'});
  const body = new URLSearchParams({
    sr: ${JSON.stringify(params.subreddit)},
    title: ${JSON.stringify(params.title)},
    ${params.url ? `url: ${JSON.stringify(params.url)},` : `text: ${JSON.stringify(params.text || '')},`}
    kind: ${JSON.stringify(params.url ? 'link' : 'self')},
    resubmit: 'true',
    uh: modhash,
    api_type: 'json'
  });
  const r = await fetch('/api/submit', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString(),
    credentials: 'include'
  });
  return await r.text();
}`;

    case 'edit':
      return `
async () => {
  const me = await (await fetch('/api/me.json', {credentials:'include'})).json();
  const modhash = me.data?.modhash;
  if (!modhash) return JSON.stringify({error: 'Not logged in'});
  const body = new URLSearchParams({
    thing_id: ${JSON.stringify(params.thingId)},
    text: ${JSON.stringify(params.text)},
    uh: modhash,
    api_type: 'json'
  });
  const r = await fetch('/api/editusertext', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString(),
    credentials: 'include'
  });
  return await r.text();
}`;

    case 'vote':
      return `
async () => {
  const me = await (await fetch('/api/me.json', {credentials:'include'})).json();
  const modhash = me.data?.modhash;
  if (!modhash) return JSON.stringify({error: 'Not logged in'});
  const body = new URLSearchParams({
    id: ${JSON.stringify(params.thingId)},
    dir: ${JSON.stringify(String(params.dir))},
    uh: modhash,
    api_type: 'json'
  });
  const r = await fetch('/api/vote', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString(),
    credentials: 'include'
  });
  return await r.text();
}`;

    case 'delete':
      return `
async () => {
  const me = await (await fetch('/api/me.json', {credentials:'include'})).json();
  const modhash = me.data?.modhash;
  if (!modhash) return JSON.stringify({error: 'Not logged in'});
  const body = new URLSearchParams({
    id: ${JSON.stringify(params.thingId)},
    uh: modhash,
    api_type: 'json'
  });
  const r = await fetch('/api/del', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString(),
    credentials: 'include'
  });
  return await r.text();
}`;

    case 'whoami':
      return `
async () => {
  const r = await fetch('/api/me.json', {credentials:'include'});
  return await r.text();
}`;

    default:
      throw new Error(`Unknown browser proxy action: ${action}`);
  }
}
