---
name: redd
description: "Reddit CLI for reading and searching Reddit via browser cookies. No API keys needed. Use when: (1) searching Reddit for discussions/opinions, (2) browsing subreddit posts, (3) reading post content and comments, (4) checking a user's post/comment history, (5) checking Reddit inbox. NOT for: write operations without browser relay setup, real-time monitoring, or bulk data scraping."
metadata:
  {
    "openclaw":
      {
        "emoji": "🔴",
        "requires": { "bins": ["redd"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "redd",
              "global": true,
              "bins": ["redd"],
              "label": "Install redd (npm install -g redd)",
            },
            {
              "id": "git",
              "kind": "shell",
              "command": "git clone https://github.com/jeffweisbein/redd.git && cd redd && npm install && npm link",
              "bins": ["redd"],
              "label": "Install redd from source",
            },
          ],
      },
  }
---

# Reddit Skill (redd)

Browse, search, and read Reddit from the CLI using browser cookies. No API keys or OAuth needed.

## When to Use

✅ **USE this skill when:**

- Searching Reddit for discussions, opinions, or recommendations
- Browsing hot/new posts in a subreddit
- Reading a specific post and its comments
- Researching a Reddit user's post/comment history
- Checking Reddit inbox messages

❌ **DON'T use this skill when:**

- You need to post, comment, or vote (requires browser relay — experimental)
- Real-time monitoring or streaming
- Bulk data export or scraping

## Setup

### 1. Save cookies from your browser

Open Reddit in Chrome → DevTools → Console → copy `document.cookie`, then:

```bash
redd save-cookies myusername --cookie "edgebucket=XXX; csrf_token=YYY; ..."
```

### 2. Verify

```bash
redd whoami --account myusername
```

## Commands — Read Operations

### Search Reddit

```bash
redd search "best mechanical keyboard" -n 10 --account myusername
redd search "site:github.com project" -n 5 --account myusername
```

### Browse Subreddits

```bash
redd hot technology --account myusername
redd new startups -n 20 --account myusername
```

### Read a Post + Comments

```bash
redd read https://reddit.com/r/technology/comments/abc123/ --account myusername
```

### User Research

```bash
redd user-posts someuser --account myusername
redd user-comments someuser --account myusername
```

### Inbox

```bash
redd inbox --account myusername
```

## Options

| Flag | Description |
|------|-------------|
| `--account <name>` | Use saved account cookies |
| `--cookie <string>` | Inline cookie header |
| `--json` | JSON output (for structured processing) |
| `--plain` | No colors/emoji |
| `-n, --limit <n>` | Number of results (default varies) |

## JSON Output

Add `--json` for structured output — useful for piping into other tools or processing with jq:

```bash
redd search "rust vs go" -n 5 --account myusername --json
redd hot programming --json | jq '.[].title'
```

## Write Operations (Experimental)

⚠️ **Write operations require a browser relay** because Chrome 127+ encrypts httpOnly cookies.

```bash
# Generate JS to evaluate in a reddit.com browser tab
redd-write comment t3_abc123 "great post!"
```

The generated JavaScript can be evaluated via:
- OpenClaw browser tool on an `old.reddit.com` tab
- Chrome DevTools console
- Any browser automation tool

## How It Works

redd uses Reddit's JSON API (`old.reddit.com/*.json`) with browser cookie auth. No OAuth registration, no API keys, no rate limit tokens — just your existing browser session cookies.

## Notes

- Cookies expire — re-save when you get auth errors
- Non-httpOnly cookies (from `document.cookie`) are sufficient for all read operations
- Use `--account` to switch between saved Reddit accounts
