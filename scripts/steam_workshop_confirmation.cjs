'use strict';

// Independent verification of a SteamCMD Workshop update. Never write raw
// SteamCMD output, Workshop HTML or credentials to console or CI artifacts.
const fs = require('node:fs');
const { verifySteamUpload } = require('./steam_upload_result.cjs');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function expectedNote(version, commit) {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[0-9a-f]{40}$/i.test(commit)) {
    throw new Error('Invalid version or commit input.');
  }
  return `EPOCH ${version} | commit ${commit}`;
}

function validateTargetVdf(vdf, workshopId, note) {
  if (!/^[1-9]\d{5,19}$/.test(workshopId)) return false;
  if (typeof vdf !== 'string') return false;
  const matches = key => [...vdf.matchAll(new RegExp(`^\\s*"${key}"\\s+"([^"]*)"\\s*$`, 'gim'))].map(match => match[1]);
  const ids = matches('publishedfileid');
  const apps = matches('appid');
  const notes = matches('changenote');
  return ids.length === 1 && ids[0] === workshopId
    && apps.length === 1 && apps[0] === '281990'
    && notes.length === 1 && notes[0] === note;
}

function visibleText(html) {
  if (typeof html !== 'string' || html.length > 2_000_000) return '';
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<[^>]*>/g, '\n')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&(?:#124|vert);/gi, '|')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\r/g, '\n');
}

function newestChangeNoteMatches(html, note) {
  const text = visibleText(html);
  // Steam's public Workshop Change Notes page lists newest entries first.
  // Never accept the commit if it only occurs in an older entry.
  const updates = text.split(/(?:^|\n)\s*Update:\s*/im);
  if (updates.length < 2) return false;
  const newest = updates[1].replace(/\s+/g, ' ');
  return newest.includes(note);
}

// Used by GitHub Actions: make at most 8 HTTP requests. No API key required.
async function confirmPublicChangelog({ workshopId, note, fetchPage, attempts = 8, delayMs = 5000 }) {
  const url = `https://steamcommunity.com/sharedfiles/filedetails/changelog/${workshopId}?l=english`;
  let reachable = false;
  for (let i = 0; i < attempts; i++) {
    try {
      const html = await fetchPage(url);
      reachable = true;
      if (newestChangeNoteMatches(html, note)) return { match: true, reachable };
    } catch { /* transient Steam failure; no raw output */ }
    if (i + 1 < attempts) await sleep(delayMs);
  }
  return { match: false, reachable };
}

async function fetchPublicPage(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EPOCHReleaseVerification/1.0)', 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('Steam public changelog unavailable');
  }
  return response.text();
}

async function verifyWorkshopUpdate({ exitCode, output, workshopId, version, commit, resultVdf, fetchPage = fetchPublicPage, attempts = 8, delayMs = 5000 }) {
  const note = expectedNote(version, commit);
  const targetValid = validateTargetVdf(resultVdf, workshopId, note);
  const steamcmdExitOk = Number(exitCode) === 0;
  const local = verifySteamUpload({ exitCode: Number(exitCode), output, configuredWorkshopId: workshopId, resultVdf });
  const explicitError = local.reason === 'SteamCMD reported an upload or authentication error'
    || local.reason === 'SteamCMD confirmation names a different Workshop ID'
    || /(?:ERROR!|Failed to update workshop item|Steam Guard code required|Invalid Password|Access Denied|Upload failed|Login failed|not logged in|authentication failed)/i.test(output);
  // Never overrule a nonzero SteamCMD exit code, a changed upload target,
  // or any reported authentication/Workshop failure based on a stale page.
  const local_reason = local.ok ? 'OK' : ({
    'SteamCMD did not exit successfully': 'NONZERO_EXIT',
    'SteamCMD reported an upload or authentication error': 'REPORTED_ERROR',
    'SteamCMD confirmation names a different Workshop ID': 'CONFLICTING_ID',
    'no positive Workshop upload confirmation found': 'NO_POSITIVE_MARKER',
    'result VDF Workshop ID is missing, ambiguous, or changed': 'WRONG_VDF_ID',
    'result VDF game app ID changed': 'WRONG_VDF_APP',
  }[local.reason] || 'OTHER');
  if (!steamcmdExitOk || !targetValid || explicitError) {
    return { ok: false, method: 'none', exitcode_ok: steamcmdExitOk, target_valid: targetValid, local_confirmation: local.ok, local_reason, remote_confirmation: false, remote_reachable: false };
  }
  if (local.ok) {
    return { ok: true, method: 'steamcmd', exitcode_ok: true, target_valid: true, local_confirmation: true, local_reason, remote_confirmation: false, remote_reachable: false };
  }
  const remote = await confirmPublicChangelog({ workshopId, note, fetchPage, attempts, delayMs });
  return { ok: remote.match, method: remote.match ? 'steam_changelog' : 'none', exitcode_ok: true, target_valid: true, local_confirmation: false, local_reason, remote_confirmation: remote.match, remote_reachable: remote.reachable };
}

async function main() {
  const [exitArg, workshopId, version, commit, vdfPath] = process.argv.slice(2);
  let output = '';
  for await (const part of process.stdin) {
    output += part;
    if (output.length > 1_000_000) throw new Error('SteamCMD output exceeded size limit');
  }
  const resultVdf = fs.readFileSync(vdfPath, 'utf8');
  const result = await verifyWorkshopUpdate({ exitCode: Number(exitArg), output, workshopId, version, commit, resultVdf });
  process.stdout.write(`SteamCMD stage=UPLOAD category=${result.ok ? 'OK' : 'STEAM_UPLOAD_UNCONFIRMED'} verification=${result.method} exitcode_ok=${result.exitcode_ok ? 'yes' : 'no'} target_valid=${result.target_valid ? 'yes' : 'no'} local_confirmation=${result.local_confirmation ? 'yes' : 'no'} local_reason=${result.local_reason} remote_confirmation=${result.remote_confirmation ? 'yes' : 'no'} remote_reachable=${result.remote_reachable ? 'yes' : 'no'}; raw output suppressed.\n`);
  if (!result.ok) process.exitCode = 1;
}

if (require.main === module) {
  main().catch(() => {
    process.stderr.write('SteamCMD stage=UPLOAD category=STEAM_UPLOAD_UNCONFIRMED; verifier failed, raw output suppressed.\n');
    process.exitCode = 1;
  });
}

module.exports = { expectedNote, validateTargetVdf, visibleText, newestChangeNoteMatches, confirmPublicChangelog, verifyWorkshopUpdate };
