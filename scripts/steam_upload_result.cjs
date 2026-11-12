'use strict';

// SteamCMD output is untrusted text. Never print or return it.
// We accept both explicit Workshop-ID success labels and the native Linux
// "Committing update...Success." lifecycle observed in the verified manual upload.
const fs = require('node:fs');

function verifySteamUpload({ exitCode, output, configuredWorkshopId, resultVdf }) {
  const fail = reason => ({ ok: false, reason });
  if (!/^[1-9][0-9]{5,19}$/.test(String(configuredWorkshopId || ''))) return fail('invalid configured Workshop ID');
  if (exitCode !== 0) return fail('SteamCMD did not exit successfully');
  if (typeof output !== 'string' || typeof resultVdf !== 'string') return fail('SteamCMD result is incomplete');
  if (/^\s*(?:ERROR!|Error:|Upload failed\b|Failed to upload\b|Access Denied\b|Login failed\b|Authentication failed\b)/im.test(output)
      || /\b(?:Steam Guard code required|not logged in|account logon denied|connection timed out|could not connect(?: to Steam)?|failed to connect(?: to Steam)?|session expired|not authorized|permission denied)\b/i.test(output)) {
    return fail('SteamCMD reported an upload or authentication error');
  }

  const expected = String(configuredWorkshopId);
  const markers = [
    ...output.matchAll(/^.*?\bSuccess\.[ \t]*(?:Published[ \t]+File[ \t]+ID|Published[ \t]+file[ \t]+update)[ \t]*(?::|=)?[ \t]*([0-9]+)[ \t]*\.?[ \t]*$/gim),
    ...output.matchAll(/^.*?\bSuccess\..*\bWorkshop\b.*\b(?:published|updated|update|uploaded|upload)\b[^\r\n]*?\b([0-9]+)\b[^\r\n]*$/gim),
  ];
  if (markers.some(match => match[1] !== expected)) return fail('SteamCMD confirmation names a different Workshop ID');

  // Real Linux SteamCMD: "Committing update...Success.Unloading Steam API...OK".
  // This is only sufficient if the same invocation clearly prepared and
  // uploaded content, completed successfully, and targeted our unchanged VDF.
  const committed = /\bCommitting[ \t]+update\.\.\.[ \t]*Success\./i.test(output);
  const prepared = /\bPreparing[ \t]+update\.{3}/i.test(output);
  const uploaded = /\bUploading[ \t]+content\.{3,}/i.test(output);
  if (markers.length === 0 && !(committed && prepared && uploaded)) {
    return fail('no positive Workshop upload confirmation found');
  }

  const idLines = [...resultVdf.matchAll(/^\s*"publishedfileid"\s+"([0-9]+)"\s*$/gim)];
  if (idLines.length !== 1 || idLines[0][1] !== expected) return fail('result VDF Workshop ID is missing, ambiguous, or changed');
  const appLines = [...resultVdf.matchAll(/^\s*"appid"\s+"([0-9]+)"\s*$/gim)];
  if (appLines.length && (appLines.length !== 1 || appLines[0][1] !== '281990')) return fail('result VDF game app ID changed');
  return { ok: true, reason: 'verified Workshop upload' };
}

if (require.main === module) {
  const [exitArg, id, vdfPath] = process.argv.slice(2);
  let output = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { output += chunk; });
  process.stdin.on('end', () => {
    let result;
    try {
      const resultVdf = fs.readFileSync(vdfPath, 'utf8');
      result = verifySteamUpload({ exitCode: Number(exitArg), output, configuredWorkshopId: id, resultVdf });
    } catch {
      result = { ok: false, reason: 'SteamCMD result could not be verified' };
    }
    if (!result.ok) {
      process.stderr.write(`SteamCMD upload verification failed: ${result.reason}. Output suppressed.\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('SteamCMD upload result verified.\n');
    }
  });
}

module.exports = { verifySteamUpload };
