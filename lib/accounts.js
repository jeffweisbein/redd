/**
 * Multi-account cookie storage (like bird's account system).
 * Stores cookies per-username in ~/.config/redd/accounts/
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.config', 'redd', 'accounts');

function ensureDir() {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

export function saveAccountCookies(username, cookies) {
  ensureDir();
  const file = join(CONFIG_DIR, `${username}.cookie`);
  writeFileSync(file, cookies, 'utf8');
  return file;
}

export function loadAccountCookies(username) {
  const file = join(CONFIG_DIR, `${username}.cookie`);
  if (!existsSync(file)) {
    throw new Error(`No saved cookies for "${username}". Run: redd save-cookies ${username}`);
  }
  return readFileSync(file, 'utf8').trim();
}

export function listAccounts() {
  ensureDir();
  return readdirSync(CONFIG_DIR)
    .filter(f => f.endsWith('.cookie'))
    .map(f => f.replace('.cookie', ''));
}
