#!/usr/bin/env node

/**
 * redd-write — Reddit write operations via browser proxy.
 * For use when httpOnly cookies aren't available.
 * 
 * Outputs the JavaScript to evaluate in a reddit.com browser tab.
 * Designed for use with OpenClaw browser relay.
 * 
 * Usage:
 *   redd-write comment <post-id> "text"     → outputs JS for commenting
 *   redd-write reply <comment-id> "text"    → outputs JS for replying
 *   redd-write post <subreddit> "title" "body" → outputs JS for posting
 *   redd-write edit <thing-id> "text"       → outputs JS for editing
 *   redd-write delete <thing-id>            → outputs JS for deleting
 *   redd-write vote <thing-id> <1|-1|0>     → outputs JS for voting
 *   redd-write whoami                       → outputs JS for checking login
 */

import { generateBrowserScript } from '../lib/browser-proxy.js';

const [,, action, ...args] = process.argv;

if (!action || action === '--help' || action === '-h') {
  console.log(`redd-write — generate browser JS for Reddit write operations

Commands:
  comment <thing-id> <text>           Comment on a post (t3_xxx) or reply to comment (t1_xxx)
  post <subreddit> <title> [body]     Submit a new post
  edit <thing-id> <text>              Edit a comment/post
  delete <thing-id>                   Delete a comment/post
  vote <thing-id> <1|-1|0>            Vote on a post/comment
  whoami                              Check logged-in user

Output: JavaScript function to evaluate in a reddit.com browser tab.
`);
  process.exit(0);
}

try {
  let script;
  switch (action) {
    case 'comment':
    case 'reply':
      script = generateBrowserScript('comment', { thingId: args[0], text: args[1] });
      break;
    case 'post':
      script = generateBrowserScript('submit', { subreddit: args[0], title: args[1], text: args[2] });
      break;
    case 'edit':
      script = generateBrowserScript('edit', { thingId: args[0], text: args[1] });
      break;
    case 'delete':
      script = generateBrowserScript('delete', { thingId: args[0] });
      break;
    case 'vote':
      script = generateBrowserScript('vote', { thingId: args[0], dir: parseInt(args[1]) });
      break;
    case 'whoami':
      script = generateBrowserScript('whoami', {});
      break;
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
  console.log(script.trim());
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
