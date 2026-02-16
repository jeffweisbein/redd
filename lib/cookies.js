/**
 * Cookie extraction for Reddit.
 * 
 * Cookie sources (in priority order):
 * 1. --cookie "header string" 
 * 2. REDD_COOKIE env var
 * 3. --account <name> (saved cookies)
 * 4. Auto-extract from Chrome (macOS, uses keychain)
 * 
 * To save cookies, the easiest method is:
 *   1. Open Reddit in Chrome, log in
 *   2. Open DevTools > Application > Cookies
 *   3. Copy `reddit_session` and `token_v2` values
 *   4. Run: redd save-cookies <username> --cookie "reddit_session=XXX; token_v2=YYY"
 * 
 * Or use the helper: bash scripts/redd-save-cookies-from-browser.sh <username>
 */

/**
 * Resolve cookie header string from various sources.
 */
export async function resolveCookies(opts = {}) {
  if (opts.cookie) return opts.cookie;
  if (process.env.REDD_COOKIE) return process.env.REDD_COOKIE;

  if (opts.account) {
    const { loadAccountCookies } = await import('./accounts.js');
    return loadAccountCookies(opts.account);
  }

  throw new Error(
    'No Reddit cookies found. Options:\n' +
    '  1. Set REDD_COOKIE env var\n' +
    '  2. Use --cookie "reddit_session=XXX; token_v2=YYY"\n' +
    '  3. Save: redd save-cookies <name> --cookie "..."\n' +
    '  4. Use: --account <name>'
  );
}
