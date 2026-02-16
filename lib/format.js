/**
 * Human-readable formatting for Reddit data.
 */

import chalk from 'chalk';

export function formatPost(post, opts = {}) {
  if (opts.json) return JSON.stringify(post, null, 2);
  
  const score = post.score ?? '?';
  const comments = post.num_comments ?? '?';
  const age = timeAgo(post.created_utc);
  const sub = post.subreddit_name_prefixed || `r/${post.subreddit}`;
  
  let out = '';
  out += chalk.bold(`${post.title}\n`);
  out += chalk.dim(`${sub} · ${post.author} · ${age} · ↑${score} · 💬${comments}\n`);
  if (post.selftext) {
    out += '\n' + post.selftext.substring(0, 500);
    if (post.selftext.length > 500) out += chalk.dim('...');
    out += '\n';
  }
  if (post.url && !post.is_self) {
    out += chalk.blue(post.url) + '\n';
  }
  out += chalk.dim(`https://reddit.com${post.permalink}`);
  return out;
}

export function formatComment(c, opts = {}) {
  if (opts.json) return JSON.stringify(c, null, 2);
  
  const indent = '  '.repeat(c.depth || 0);
  const age = timeAgo(c.created);
  const score = c.score ?? '?';
  
  let out = '';
  out += `${indent}${chalk.bold(c.author)} · ${chalk.dim(`↑${score} · ${age}`)}\n`;
  const body = c.body || '';
  const lines = body.split('\n');
  for (const line of lines) {
    out += `${indent}${line}\n`;
  }
  return out;
}

export function formatPostWithComments(data, opts = {}) {
  if (opts.json) return JSON.stringify(data, null, 2);
  
  let out = formatPost(data.post, opts) + '\n';
  out += chalk.dim(`\n── ${data.commentCount} comments ──\n\n`);
  for (const c of data.comments) {
    out += formatComment(c, opts) + '\n';
  }
  return out;
}

export function formatSearchResults(results, opts = {}) {
  if (opts.json) return JSON.stringify(results, null, 2);
  
  let out = '';
  for (const post of results) {
    out += formatPost(post, opts) + '\n\n';
  }
  return out;
}

export function formatUser(user, opts = {}) {
  if (opts.json) return JSON.stringify(user, null, 2);
  
  let out = '';
  out += chalk.bold(user.name || user.subreddit?.display_name_prefixed || 'unknown') + '\n';
  out += `Link karma: ${user.link_karma ?? '?'}\n`;
  out += `Comment karma: ${user.comment_karma ?? '?'}\n`;
  out += `Created: ${user.created_utc ? new Date(user.created_utc * 1000).toISOString().split('T')[0] : '?'}\n`;
  return out;
}

function timeAgo(epoch) {
  if (!epoch) return '?';
  const diff = Date.now() / 1000 - epoch;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}
