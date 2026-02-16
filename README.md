# redd

Fast Reddit CLI — read, search, comment, and post via browser cookies. No API keys needed.

Like [bird](https://github.com/nicholasgasior/bird) for Twitter, but for Reddit.

## Install

```bash
npm install -g redd-cli
# or
git clone https://github.com/jeffweisbein/redd.git
cd redd && npm install && npm link
```

## Quick Start

```bash
# Save your Reddit cookies (from Chrome)
redd save-cookies myusername --cookie "reddit_session=XXX; token_v2=YYY"

# Search Reddit
redd search "discord alternatives" -n 10 --account myusername

# Browse subreddits
redd hot technology
redd new startups -n 20

# Read a post + comments
redd read https://reddit.com/r/technology/comments/abc123/

# Check inbox
redd inbox --account myusername
```

## Commands

### Reading (works with non-httpOnly cookies)

| Command | Description |
|---------|-------------|
| `redd search <query>` | Search Reddit |
| `redd hot <subreddit>` | Hot posts in a subreddit |
| `redd new <subreddit>` | New posts in a subreddit |
| `redd read <post-url>` | Read a post and comments |
| `redd user-posts <username>` | User's recent posts |
| `redd user-comments <username>` | User's recent comments |
| `redd inbox` | Inbox messages |
| `redd whoami` | Check logged-in account |

### Writing (requires httpOnly cookies or browser relay)

| Command | Description |
|---------|-------------|
| `redd comment <post-url> "text"` | Comment on a post |
| `redd reply <comment-url> "text"` | Reply to a comment |
| `redd post <subreddit> "title" "body"` | Submit a new post |
| `redd edit <thing-id> "text"` | Edit a comment/post |
| `redd delete <thing-id>` | Delete a comment/post |
| `redd upvote <thing-id>` | Upvote |
| `redd downvote <thing-id>` | Downvote |

### Browser Relay (for write operations)

Chrome 127+ uses App-Bound Encryption, making it impossible to extract httpOnly cookies (`reddit_session`, `token_v2`) from the CLI. For write operations, use the browser relay:

```bash
# Generate JavaScript for a write operation
redd-write comment t3_abc123 "great post!"

# Then evaluate the output in a reddit.com browser tab
# (via DevTools console, Playwright, or automation tools)
```

## Authentication

### Option 1: Saved Cookies (recommended)

```bash
# Get cookies from Chrome DevTools > Application > Cookies > reddit.com
# Copy the full cookie header string
redd save-cookies myusername --cookie "edgebucket=XXX; csrf_token=YYY; ..."

# Use saved account
redd search "query" --account myusername
```

### Option 2: Environment Variable

```bash
export REDD_COOKIE="edgebucket=XXX; csrf_token=YYY; ..."
redd search "query"
```

### Option 3: Inline

```bash
redd search "query" --cookie "edgebucket=XXX; ..."
```

## Options

| Flag | Description |
|------|-------------|
| `--account <name>` | Use saved account cookies |
| `--cookie <string>` | Inline cookie header |
| `--json` | JSON output |
| `--plain` | No colors/emoji |
| `-n, --limit <n>` | Number of results |

## Cookie Notes

- **Read operations** work with non-httpOnly cookies (extractable from `document.cookie`)
- **Write operations** need `reddit_session` (httpOnly) — use browser relay or extract manually from DevTools
- Chrome 127+ encrypts cookies with App-Bound Encryption — automated extraction from the cookie DB no longer works
- Cookies expire — re-save when you get auth errors

## How It Works

redd uses Reddit's JSON API (`old.reddit.com/*.json`) with browser cookie authentication. No OAuth app registration, no API keys, no rate limit tokens — just your existing browser session.

Read operations hit the public JSON endpoints. Write operations use the authenticated form API (`/api/comment`, `/api/submit`, etc.) with a modhash CSRF token.

## License

MIT
