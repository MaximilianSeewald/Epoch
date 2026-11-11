'use strict';

// SteamCMD output may contain account and session details. This module only
// returns fixed category identifiers and never returns matched text.
const fs = require('node:fs');
const { verifySteamUpload } = require('./steam_upload_result.cjs');

const patterns = [
  ['STEAM_GUARD_REQUIRED', /steam\s*guard.{0,80}(?:code.{0,24}(?:required|needed|invalid|mismatch|denied)|(?:authentication|login).{0,24}(?:required|failed|denied))|(?:two[- ]factor|mobile authenticator|authenticator).{0,80}(?:required|code.{0,24}(?:required|needed|invalid|mismatch|denied)|failed|denied)|enter (?:the )?(?:steam guard|authentication) code/i],
  ['STEAM_SESSION_EXPIRED', /session (?:has )?expired|invalid [a-z ]{0,30}session|expired (?:login )?token|refresh token.*(?:invalid|expired)/i],
  ['STEAM_WORKSHOP_PERMISSION_DENIED', /access denied|permission denied|not authorized|insufficient privilege|not the owner|does not have permission|not allowed to (?:upload|publish|update)/i],
  ['STEAM_NETWORK_ERROR', /could not connect|failed to connect|connection (?:timed out|reset|refused)|network is unreachable|network error|http error|server unavailable|timed? out|no connection|unable to resolve/i],
  ['STEAM_AUTH_FAILED', /invalid password|authentication failed|login failure|account logon denied|logged out|not logged in|login.?failed/i],
  ['STEAM_UPLOAD_FAILED', /upload failed|failed to upload|workshop_build_item.{0,80}(?:failed|error)|error!|workshop.{0,80}(?:failed|error)/i],
];

function hasCompletedLogin(text) {
  if (/\b(?:login to steam successful|logged in ok)\b/i.test(text)) return true;

  // SteamCMD can interleave this known timing status into either readiness
  // marker. Remove only that exact message shape before checking the ordered
  // login sequence; unrelated text remains subject to the strict parser.
  const normalized = text.replace(/Waiting for compat in post-logon took: \d+(?:\.\d+)?s(?=OK|\s|$)/gi, '');
  const lines = normalized.split(/\r?\n/);
  let loginAccepted = -1;
  let clientConfigReady = -1;
  let userInfoReady = -1;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/logging in user\b.*\bto steam\b.*\.\.\.\s*ok\s*$/i.test(line)) loginAccepted = index;
    if (/waiting for client config\s*\.\.\.\s*ok\s*$/i.test(line)) clientConfigReady = index;
    if (/waiting for user info\s*\.\.\.\s*ok\s*$/i.test(line)) userInfoReady = index;
  }
  return loginAccepted >= 0 && clientConfigReady > loginAccepted && userInfoReady > clientConfigReady;
}

function loginMarkers(text) {
  const normalized = text.replace(/Waiting for compat in post-logon took: \d+(?:\.\d+)?s(?=OK|\s|$)/gi, '');
  const lines = normalized.split(/\r?\n/);
  return {
    loginMarkerRecognized: /\b(?:login to steam successful|logged in ok)\b/i.test(text)
      || lines.some(line => /logging in user\b.*\bto steam\b.*\.\.\.\s*ok\s*$/i.test(line)),
    clientConfigRecognized: lines.some(line => /waiting for client config\s*\.\.\.\s*ok\s*$/i.test(line)),
    userInfoRecognized: lines.some(line => /waiting for user info\s*\.\.\.\s*ok\s*$/i.test(line)),
  };
}

function safeLoginDiagnostics({ exitCode, output }) {
	const text = typeof output === 'string' ? output : '';
	const normalized = text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
	const compact = withoutKnownHarmlessLocaleWarning(normalized);
	const markers = loginMarkers(normalized);
	return {
		console_start_reached: /Steam Console Client\s*\(c\)\s*Valve Corporation/i.test(normalized) ? 'yes' : 'no',
		steam_api_loaded: /(?:\bLoading Steam API\.{0,3}\s*OK|\bSteamAPI_Init\(\).*?(?:success|OK)|\bSteam API (?:loaded|initialized) successfully)/i.test(normalized) ? 'yes' : 'no',
		saved_credentials_indicated: /(?:using|loaded|found) (?:cached|saved) credentials|using cached login credentials/i.test(normalized) ? 'yes' : 'no',
		password_interaction_requested: /\b(?:please )?(?:enter|input) (?:your )?(?:steam )?password\b|\bpassword(?: for login)?\s*(?:required|needed|:)|request(?:ing)? password/i.test(normalized) ? 'yes' : 'no',
		steam_guard_interaction_requested: /steam\s*guard.{0,80}(?:code|required|enter|need|prompt|requested|authentication)|(?:two[- ]factor|mobile authenticator|authenticator).{0,80}(?:code|required|enter|need|prompt)|enter (?:the )?(?:steam guard|authentication) code/i.test(normalized) ? 'yes' : 'no',
		authentication_error_detected: /invalid password|authentication failed|login failure|account logon denied|logged out|not logged in|login.?failed|invalid auth/i.test(normalized) ? 'yes' : 'no',
		connection_error_detected: /could not connect|failed to connect|connection (?:timed out|reset|refused)|network is unreachable|network error|http error|server unavailable|timed? out|no connection|unable to resolve/i.test(normalized) ? 'yes' : 'no',
		session_error_detected: /session (?:has )?expired|invalid [a-z ]{0,30}session|expired (?:login )?token|refresh token.*(?:invalid|expired)/i.test(normalized) ? 'yes' : 'no',
		usable_console_output_received: compact.trim().length > 0 ? 'yes' : 'no',
		exitcode_successful: Number(exitCode) === 0 ? 'yes' : 'no',
		login_marker_recognized: markers.loginMarkerRecognized ? 'yes' : 'no',
		client_config_recognized: markers.clientConfigRecognized ? 'yes' : 'no',
		user_info_recognized: markers.userInfoRecognized ? 'yes' : 'no',
	};
}

function withoutKnownHarmlessLocaleWarning(text) {
  // This exact SteamCMD warning is benign. Keep the exception narrow so other
  // occurrences of "failed" remain visible to the login failure classifier.
  return text.replace(/^WARNING: setlocale\('en_US\.UTF-8'\) failed, using locale: 'C'\.\s*\r?\n?/gim, '');
}

function classifySteamFailure({ stage, exitCode, output }) {
  const text = typeof output === 'string' ? output : '';
  for (const [category, pattern] of patterns) {
    if (pattern.test(text)) return { ok: false, category };
  }
	if (stage === 'initialize' && Number(exitCode) === 0) return { ok: true, category: null };
  if (stage === 'login') {
    const failureText = withoutKnownHarmlessLocaleWarning(text);
    if (/\b(?:failed|failure|fatal error|timed? out|timeout)\b/i.test(failureText)) {
      return { ok: false, category: 'STEAM_UNKNOWN_ERROR' };
    }
    if (Number(exitCode) === 0 && hasCompletedLogin(text)) return { ok: true, category: null };
    return { ok: false, category: 'STEAM_UNKNOWN_ERROR' };
  }
  if (stage === 'upload' && Number(exitCode) === 0) {
    return { ok: false, category: 'STEAM_UPLOAD_FAILED' };
  }
  return { ok: false, category: 'STEAM_UNKNOWN_ERROR' };
}

function diagnose({ stage, exitCode, output, workshopId, resultVdf }) {
	if (stage === 'login' || stage === 'initialize') return classifySteamFailure({ stage, exitCode, output });
  if (stage === 'upload') {
    const verified = verifySteamUpload({ exitCode: Number(exitCode), output, configuredWorkshopId: workshopId, resultVdf });
    if (verified.ok) return { ok: true, category: null };
  }
  return classifySteamFailure({ stage, exitCode, output });
}

if (require.main === module) {
  const [stage, exitArg, ...args] = process.argv.slice(2);
  const diagnostics = args.includes('--diagnostics');
  const positional = args.filter(arg => arg !== '--diagnostics');
  const [workshopId, vdfPath] = positional;
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
	if (diagnostics && (stage === 'login' || stage === 'initialize')) {
		const diagnosticsResult = safeLoginDiagnostics({ exitCode: Number(exitArg), output });
      process.stdout.write([
        `category=${result.ok ? 'OK' : result.category}`,
			...Object.entries(diagnosticsResult).map(([key, value]) => `${key}=${value}`),
      ].join(' ') + '\n');
    } else {
      process.stdout.write(result.ok ? 'OK\n' : `${result.category}\n`);
    }
    if (!result.ok) process.exitCode = 1;
  });
}

module.exports = { classifySteamFailure, diagnose, loginMarkers, safeLoginDiagnostics };
