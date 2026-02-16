#!/usr/bin/env node

/**
 * redd — fast Reddit CLI using browser cookies
 * Like bird, but for Reddit.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { resolveCookies } from '../lib/cookies.js';
import * as api from '../lib/api.js';
import * as fmt from '../lib/format.js';
import { saveAccountCookies, listAccounts } from '../lib/accounts.js';

const program = new Command();

program
  .name('redd')
  .version('0.1.0')
  .description('Fast Reddit CLI — post, comment, read, and search via browser cookies')
  .option('--cookie <string>', 'Reddit cookie header string')
  .option('--account <username>', 'Use saved account cookies')
  .option('--chrome-profile <name>', 'Chrome profile for cookie extraction (default: Default)')
  .option('--json', 'Output as JSON')
  .option('--plain', 'Plain output (no color, no emoji)');

// ── Helper to get cookies from global opts ──
function getCookieOpts(cmd) {
  const opts = cmd.optsWithGlobals ? cmd.optsWithGlobals() : program.opts();
  return {
    cookie: opts.cookie,
    account: opts.account,
    chromeProfile: opts.chromeProfile,
  };
}

function isJson(cmd) {
  const opts = cmd.optsWithGlobals ? cmd.optsWithGlobals() : program.opts();
  return opts.json;
}

// ── whoami ───────────────────────────────────────────────────
program
  .command('whoami')
  .description('Show the logged-in Reddit account')
  .action(async (_, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const user = await api.whoami(cookies);
      console.log(fmt.formatUser(user, { json: isJson(cmd) }));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── comment ─────────────────────────────────────────────────
program
  .command('comment <post-url-or-id> <text>')
  .description('Post a comment on a post or reply to a comment')
  .action(async (target, text, _, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const thingId = api.parseThingId(target);
      const result = await api.comment(thingId, text, cookies);
      if (isJson(cmd)) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.green('✓ Comment posted'));
        if (result?.permalink) {
          console.log(chalk.dim(`https://reddit.com${result.permalink}`));
        }
      }
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── reply (alias for comment on a comment) ──────────────────
program
  .command('reply <comment-url-or-id> <text>')
  .description('Reply to a comment')
  .action(async (target, text, _, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const thingId = api.parseThingId(target);
      // Ensure it's a comment ID
      const id = thingId.startsWith('t1_') ? thingId : `t1_${thingId.replace(/^t\d_/, '')}`;
      const result = await api.comment(id, text, cookies);
      if (isJson(cmd)) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.green('✓ Reply posted'));
        if (result?.permalink) {
          console.log(chalk.dim(`https://reddit.com${result.permalink}`));
        }
      }
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── post ────────────────────────────────────────────────────
program
  .command('post <subreddit> <title> [body]')
  .description('Submit a new post to a subreddit')
  .option('-u, --url <url>', 'Submit as link post')
  .action(async (subreddit, title, body, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const sub = subreddit.replace(/^r\//, '');
      const result = await api.submitPost(sub, title, body, cookies, { url: opts.url });
      if (isJson(cmd)) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.green('✓ Post submitted'));
        if (result?.url) console.log(chalk.blue(result.url));
      }
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── read ────────────────────────────────────────────────────
program
  .command('read <post-url-or-id>')
  .description('Read a post and its comments')
  .option('-d, --depth <n>', 'Comment depth', '3')
  .action(async (target, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const data = await api.readPost(target, cookies, { depth: parseInt(opts.depth) });
      console.log(fmt.formatPostWithComments(data, { json: isJson(cmd) }));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── search ──────────────────────────────────────────────────
program
  .command('search <query>')
  .description('Search Reddit')
  .option('-s, --subreddit <sub>', 'Restrict to subreddit')
  .option('-n, --limit <n>', 'Number of results', '10')
  .option('--sort <sort>', 'Sort: relevance, hot, top, new, comments', 'relevance')
  .option('-t, --time <time>', 'Time filter: hour, day, week, month, year, all', 'all')
  .action(async (query, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const results = await api.search(query, cookies, {
        subreddit: opts.subreddit,
        limit: parseInt(opts.limit),
        sort: opts.sort,
        time: opts.time,
      });
      console.log(fmt.formatSearchResults(results, { json: isJson(cmd) }));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── edit ────────────────────────────────────────────────────
program
  .command('edit <comment-url-or-id> <text>')
  .description('Edit a comment or post')
  .action(async (target, text, _, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const thingId = api.parseThingId(target);
      const result = await api.editComment(thingId, text, cookies);
      if (isJson(cmd)) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.green('✓ Edited'));
      }
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── delete ──────────────────────────────────────────────────
program
  .command('delete <thing-url-or-id>')
  .description('Delete a comment or post')
  .action(async (target, _, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const thingId = api.parseThingId(target);
      await api.deleteComment(thingId, cookies);
      console.log(chalk.green('✓ Deleted'));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── vote ────────────────────────────────────────────────────
program
  .command('upvote <thing-url-or-id>')
  .description('Upvote a post or comment')
  .action(async (target, _, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      await api.vote(api.parseThingId(target), 1, cookies);
      console.log(chalk.green('✓ Upvoted'));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

program
  .command('downvote <thing-url-or-id>')
  .description('Downvote a post or comment')
  .action(async (target, _, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      await api.vote(api.parseThingId(target), -1, cookies);
      console.log(chalk.green('✓ Downvoted'));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── user ────────────────────────────────────────────────────
program
  .command('user-posts <username>')
  .description("Show a user's recent posts")
  .option('-n, --limit <n>', 'Number of results', '10')
  .action(async (username, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const posts = await api.userPosts(username, cookies, { limit: parseInt(opts.limit) });
      console.log(fmt.formatSearchResults(posts, { json: isJson(cmd) }));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

program
  .command('user-comments <username>')
  .description("Show a user's recent comments")
  .option('-n, --limit <n>', 'Number of results', '10')
  .action(async (username, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const comments = await api.userComments(username, cookies, { limit: parseInt(opts.limit) });
      if (isJson(cmd)) {
        console.log(JSON.stringify(comments, null, 2));
      } else {
        for (const c of comments) {
          const age = c.created_utc ? `${Math.floor((Date.now()/1000 - c.created_utc) / 3600)}h ago` : '';
          console.log(`${chalk.bold(c.subreddit_name_prefixed)} · ${chalk.dim(`↑${c.score} · ${age}`)}`);
          console.log(c.body?.substring(0, 200));
          console.log(chalk.dim(`https://reddit.com${c.permalink}`));
          console.log();
        }
      }
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── subreddit ───────────────────────────────────────────────
program
  .command('hot <subreddit>')
  .description('Show hot posts in a subreddit')
  .option('-n, --limit <n>', 'Number of results', '10')
  .action(async (subreddit, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const sub = subreddit.replace(/^r\//, '');
      const posts = await api.subredditPosts(sub, cookies, { sort: 'hot', limit: parseInt(opts.limit) });
      console.log(fmt.formatSearchResults(posts, { json: isJson(cmd) }));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

program
  .command('new <subreddit>')
  .description('Show new posts in a subreddit')
  .option('-n, --limit <n>', 'Number of results', '10')
  .action(async (subreddit, opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const sub = subreddit.replace(/^r\//, '');
      const posts = await api.subredditPosts(sub, cookies, { sort: 'new', limit: parseInt(opts.limit) });
      console.log(fmt.formatSearchResults(posts, { json: isJson(cmd) }));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── inbox ───────────────────────────────────────────────────
program
  .command('inbox')
  .description('Show inbox messages')
  .option('-f, --filter <type>', 'Filter: unread, inbox, messages, comments', 'unread')
  .option('-n, --limit <n>', 'Number of results', '10')
  .action(async (opts, cmd) => {
    try {
      const cookies = await resolveCookies(getCookieOpts(cmd));
      const messages = await api.inbox(cookies, { filter: opts.filter, limit: parseInt(opts.limit) });
      if (isJson(cmd)) {
        console.log(JSON.stringify(messages, null, 2));
      } else {
        if (!messages.length) {
          console.log(chalk.dim('No messages'));
          return;
        }
        for (const m of messages) {
          console.log(`${chalk.bold(m.author || '?')} ${chalk.dim(`· ${m.subreddit || 'PM'} · ${m.new ? '🔴 NEW' : ''}`)}`);
          console.log(m.body?.substring(0, 200));
          console.log();
        }
      }
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── save-cookies ────────────────────────────────────────────
program
  .command('save-cookies <username>')
  .description('Save cookies from Chrome for a Reddit account')
  .action(async (username, _, cmd) => {
    try {
      const { getChromeRedditCookies } = await import('../lib/cookies.js');
      const opts = program.opts();
      const cookies = await getChromeRedditCookies(opts.chromeProfile);
      const file = saveAccountCookies(username, cookies);
      console.log(chalk.green(`✓ Cookies saved for ${username}`));
      console.log(chalk.dim(file));
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

// ── accounts ────────────────────────────────────────────────
program
  .command('accounts')
  .description('List saved accounts')
  .action(() => {
    const accounts = listAccounts();
    if (!accounts.length) {
      console.log(chalk.dim('No saved accounts. Run: redd save-cookies <username>'));
      return;
    }
    for (const a of accounts) {
      console.log(a);
    }
  });

// ── Parse & run ─────────────────────────────────────────────
program.parse();
