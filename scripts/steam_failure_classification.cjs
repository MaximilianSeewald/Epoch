'use strict';

// SteamCMD output may contain account and session details. This module only
// returns fixed category identifiers and never returns matched text.
const fs = require('node:fs');
const { verifySteamUpload } = require('./steam_upload_result.cjs');

const patterns = [
  ['STEAM_GUARD_REQUIRED', /steam\s*guard|two[- ]factor|mobile authenticator|authenticator code|enter (?:the )?(?:steam guard|authentication) code/i],
  ['STEAM_SESSION_EXPIRED', /session (?:has )?expired|invalid [a-z ]{0,30}session|expired (?:login )?token|refresh token.*(?:invalid|expired)/i],
  ['STEAM_WORKSHOP_PERMISSION_DENIED', /access denied|permission denied|not authorized|insufficient privilege|not the owner|does not have permission|not allowed to (?:upload|publish|update)/i],
  ['STEAM_NETWORK_ERROR', /could not connect|failed to connect|connection (?:timed out|reset|refused)|network is unreachable|network error|http error|server unavailable|timed? out|no connection|unable to resolve/i],
  ['STEAM_AUTH_FAILED', /invalid password|authentication failed|login failure|account logon denied|logged out|not logged in|login.?failed/i],
  ['STEAM_UPLOAD_FAILED', /upload failed|failed to upload|workshop_build_item.{0,80}(?:failed|error)|error!|workshop.{0,80}(?:failed|error)/i],
];

function classifySteamFailure({ stage, exitCode, output }) {
  const text = typeof output === 'string' ? output : '';
  if (stage === 'login' && Number(exitCode) === 0 && /login to steam successful|logged in ok/i.test(text)) {
    return { ok: true, category: null };
  }
  for (const [category, pattern] of patterns) {
    if (pattern.test(text)) return { ok: false, category };
  }
  if (stage === 'upload' && Number(exitCode) === 0) {
    return { ok: false, category: 'STEAM_UPLOAD_FAILED' };
  }
  return { ok: false, category: 'STEAM_UNKNOWN_ERROR' };
}

function diagnose({ stage, exitCode, output, workshopId, resultVdf }) {
  if (stage === 'login') return classifySteamFailure({ stage, exitCode, output });
  if (stage === 'upload') {
    const verified = verifySteamUpload({ exitCode: Number(exitCode), output, configuredWorkshopId: workshopId, resultVdf });
    if (verified.ok) return { ok: true, category: null };
  }
  return classifySteamFailure({ stage, exitCode, output });
}

if (require.main === module) {
  const [stage, exitArg, workshopId, vdfPath] = process.argv.slice(2);
  let output = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { output += chunk; });
  process.stdin.on('end', () => {
    let result;
    try {
      const resultVdf = stage === 'upload' ? fs.readFileSync(vdfPath, 'utf8') : undefined;
      result = diagnose({ stage, exitCode: Number(exitArg), output, workshopId, resultVdf });
    } catch {
      result = { ok: false, category: 'STEAM_UNKNOWN_ERROR' };
    }
    process.stdout.write(result.ok ? 'OK\n' : `${result.category}\n`);
    if (!result.ok) process.exitCode = 1;
  });
}

module.exports = { classifySteamFailure, diagnose };
