'use strict';

// SteamCMD output is treated as untrusted text. Never print or return it.
// Steamworks documents updating an existing item with a nonzero publishedfileid
// in the build VDF. SteamCMD's observed success labels are parsed narrowly.
const fs = require('node:fs');

function verifySteamUpload({ exitCode, output, configuredWorkshopId, resultVdf }) {
  const fail = reason => ({ ok: false, reason });
  if (!/^[1-9][0-9]{5,19}$/.test(String(configuredWorkshopId || ''))) return fail('invalid configured Workshop ID');
  if (exitCode !== 0) return fail('SteamCMD did not exit successfully');
  if (typeof output !== 'string' || typeof resultVdf !== 'string') return fail('SteamCMD result is incomplete');
  if (/^\s*(?:ERROR!|Error:|Upload failed\b|Failed to upload\b|Access Denied\b)/im.test(output)) return fail('SteamCMD reported an upload error');

  const expected = String(configuredWorkshopId);
  const markers = [
    ...output.matchAll(/^.*?\bSuccess\.[ \t]*(?:Published[ \t]+File[ \t]+ID|Published[ \t]+file[ \t]+update)[ \t]*(?::|=)?[ \t]*([0-9]+)[ \t]*\.?[ \t]*$/gim),
    ...output.matchAll(/^.*?\bSuccess\..*\bWorkshop\b.*\b(?:published|updated|update|uploaded|upload)\b[^\r\n]*?\b([0-9]+)\b[^\r\n]*$/gim),
  ];
  if (markers.length === 0) return fail('no positive Workshop upload confirmation found');
  if (markers.some(match => match[1] !== expected)) return fail('SteamCMD confirmation names a different Workshop ID');

  const idLines = [...resultVdf.matchAll(/^\s*"publishedfileid"\s+"([0-9]+)"\s*$/gim)];
  if (idLines.length !== 1 || idLines[0][1] !== expected) return fail('result VDF Workshop ID is missing, ambiguous, or changed');
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
