/**
 * Reddit API client using old.reddit.com + cookie auth.
 * old.reddit.com has the most reliable API endpoints.
 */

const BASE = 'https://old.reddit.com';
const API_BASE = 'https://www.reddit.com';
const USER_AGENT = 'redd-cli/0.1.0 (browser-cookie-auth)';

/**
 * Get modhash (CSRF token) needed for write operations.
 */
async function getModhash(cookies) {
  const res = await fetch(`${BASE}/api/me.json`, {
    headers: {
      'Cookie': cookies,
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`Failed to get modhash: ${res.status}`);
  const data = await res.json();
  return data?.data?.modhash || '';
}

/**
 * Make an authenticated POST to Reddit API.
 */
async function apiPost(endpoint, params, cookies) {
  const modhash = await getModhash(cookies);
  const body = new URLSearchParams({
    ...params,
    uh: modhash,
    api_type: 'json',
  });

  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'User-Agent': USER_AGENT,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit API error ${res.status}: ${text.substring(0, 200)}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Some endpoints return non-JSON on success
    return { raw: text.substring(0, 500) };
  }
}

/**
 * Make an authenticated GET to Reddit JSON API.
 */
async function apiGet(url, cookies) {
  // Ensure .json suffix
  const jsonUrl = url.endsWith('.json') ? url : url.replace(/\/?$/, '.json');
  const res = await fetch(jsonUrl, {
    headers: {
      'Cookie': cookies,
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`Reddit API error ${res.status}`);
  return res.json();
}

// ── Public API ──────────────────────────────────────────────

export async function whoami(cookies) {
  const res = await fetch(`${BASE}/api/me.json`, {
    headers: { 'Cookie': cookies, 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const data = await res.json();
  return data?.data || data;
}

export async function comment(thingId, text, cookies) {
  // thingId should be like "t3_xxxxx" (post) or "t1_xxxxx" (comment)
  const result = await apiPost('/api/comment', { thing_id: thingId, text }, cookies);
  if (result?.json?.errors?.length) {
    throw new Error(`Comment failed: ${JSON.stringify(result.json.errors)}`);
  }
  return result?.json?.data?.things?.[0]?.data || result;
}

export async function submitPost(subreddit, title, text, cookies, opts = {}) {
  const params = {
    sr: subreddit,
    title,
    kind: opts.url ? 'link' : 'self',
    ...(opts.url ? { url: opts.url } : { text: text || '' }),
    resubmit: 'true',
  };
  const result = await apiPost('/api/submit', params, cookies);
  if (result?.json?.errors?.length) {
    throw new Error(`Submit failed: ${JSON.stringify(result.json.errors)}`);
  }
  return result?.json?.data || result;
}

export async function readPost(postUrl, cookies, opts = {}) {
  // Accept full URL or just post ID
  let url = postUrl;
  if (!url.startsWith('http')) {
    url = `${BASE}/comments/${postUrl}`;
  }
  // Ensure old.reddit.com
  url = url.replace('www.reddit.com', 'old.reddit.com')
            .replace('new.reddit.com', 'old.reddit.com');
  
  const data = await apiGet(url, cookies);
  // Reddit returns [post, comments] array for post pages
  if (Array.isArray(data) && data.length >= 2) {
    const post = data[0]?.data?.children?.[0]?.data;
    const comments = flattenComments(data[1]?.data?.children || [], opts.depth || 3);
    return { post, comments, commentCount: comments.length };
  }
  return data;
}

export async function search(query, cookies, opts = {}) {
  const params = new URLSearchParams({
    q: query,
    sort: opts.sort || 'relevance',
    t: opts.time || 'all',
    limit: String(opts.limit || 10),
    type: opts.type || 'link',
    ...(opts.subreddit ? { restrict_sr: 'on' } : {}),
  });
  const base = opts.subreddit 
    ? `${BASE}/r/${opts.subreddit}/search.json` 
    : `${BASE}/search.json`;
  
  const res = await fetch(`${base}?${params}`, {
    headers: { 'Cookie': cookies, 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map(c => c.data);
}

export async function vote(thingId, dir, cookies) {
  // dir: 1 = upvote, -1 = downvote, 0 = unvote
  return apiPost('/api/vote', { id: thingId, dir: String(dir) }, cookies);
}

export async function editComment(thingId, text, cookies) {
  const result = await apiPost('/api/editusertext', { thing_id: thingId, text }, cookies);
  if (result?.json?.errors?.length) {
    throw new Error(`Edit failed: ${JSON.stringify(result.json.errors)}`);
  }
  return result?.json?.data?.things?.[0]?.data || result;
}

export async function deleteComment(thingId, cookies) {
  return apiPost('/api/del', { id: thingId }, cookies);
}

export async function userPosts(username, cookies, opts = {}) {
  const sort = opts.sort || 'new';
  const url = `${BASE}/user/${username}/submitted.json?sort=${sort}&limit=${opts.limit || 10}`;
  const res = await fetch(url, {
    headers: { 'Cookie': cookies, 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map(c => c.data);
}

export async function userComments(username, cookies, opts = {}) {
  const sort = opts.sort || 'new';
  const url = `${BASE}/user/${username}/comments.json?sort=${sort}&limit=${opts.limit || 10}`;
  const res = await fetch(url, {
    headers: { 'Cookie': cookies, 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map(c => c.data);
}

export async function subredditPosts(subreddit, cookies, opts = {}) {
  const sort = opts.sort || 'hot';
  const url = `${BASE}/r/${subreddit}/${sort}.json?limit=${opts.limit || 25}`;
  const res = await fetch(url, {
    headers: { 'Cookie': cookies, 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map(c => c.data);
}

export async function inbox(cookies, opts = {}) {
  const filter = opts.filter || 'unread'; // unread, inbox, messages, comments, selfreply
  const url = `${BASE}/message/${filter}.json?limit=${opts.limit || 25}`;
  const res = await fetch(url, {
    headers: { 'Cookie': cookies, 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map(c => c.data);
}

// ── Helpers ─────────────────────────────────────────────────

function flattenComments(children, maxDepth, depth = 0) {
  const result = [];
  for (const child of children) {
    if (child.kind === 'more') continue;
    const c = child.data;
    result.push({
      id: c.name,
      author: c.author,
      body: c.body,
      score: c.score,
      created: c.created_utc,
      depth,
      permalink: c.permalink,
    });
    if (depth < maxDepth && c.replies?.data?.children) {
      result.push(...flattenComments(c.replies.data.children, maxDepth, depth + 1));
    }
  }
  return result;
}

/**
 * Parse a reddit URL or thing ID into a fullname (t3_xxx or t1_xxx).
 */
export function parseThingId(input) {
  // Already a thing ID
  if (/^t[1-6]_\w+$/.test(input)) return input;
  
  // Post URL: /r/sub/comments/ID/...
  const postMatch = input.match(/\/comments\/(\w+)/);
  if (postMatch) return `t3_${postMatch[1]}`;
  
  // Comment URL: /r/sub/comments/postID/title/commentID
  const commentMatch = input.match(/\/comments\/\w+\/[^/]+\/(\w+)/);
  if (commentMatch) return `t1_${commentMatch[1]}`;
  
  // Bare ID — assume post
  if (/^\w+$/.test(input)) return `t3_${input}`;
  
  throw new Error(`Can't parse thing ID from: ${input}`);
}
