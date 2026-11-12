'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { verifySteamUpload } = require('./steam_upload_result.cjs');
const { classifySteamFailure, diagnose, safeLoginDiagnostics } = require('./steam_failure_classification.cjs');
const id = '1234567890123';
const vdf = `"workshopitem"\n{\n  "publishedfileid" "${id}"\n}\n`;
const verify = (output, options = {}) => verifySteamUpload({ exitCode: 0, output, configuredWorkshopId: id, resultVdf: vdf, ...options });
let checks = 0;
const check = fn => { fn(); checks++; };

check(() => assert.equal(verify('Success. Published file update: 1234567890123').ok, true));
check(() => assert.equal(verify('[2025-01-01 12:00:00] Success. Published File ID: 1234567890123').ok, true));
check(() => assert.equal(verify('Success. Published file update = 1234567890123').ok, true));
check(() => assert.equal(verify('Success. Workshop item updated: 1234567890123').ok, true));
check(() => assert.equal(verify('Success. Published file update: 1234567890123\nSuccess. Published file update: 1234567890123').ok, true));
check(() => assert.equal(verify('Login to Steam successful').ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890124').ok, false));
check(() => assert.equal(verify('Success. Published File ID: 1234567890123', { exitCode: 1 }).ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123', { resultVdf: vdf.replace(id, '1234567890124') }).ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123', { resultVdf: `${vdf} "publishedfileid" "${id}"\n` }).ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123\nERROR! Upload failed').ok, false));
check(() => assert.equal(verify('Success. Published file update: 1234567890123', { configuredWorkshopId: '0' }).ok, false));
check(() => assert.equal(verify('Success. Published file update').ok, false));

const categories = [
  ['login', 'Two-factor authentication code required', 'STEAM_GUARD_REQUIRED'],
  ['login', 'Steam Guard code required', 'STEAM_GUARD_REQUIRED'],
  ['login', 'Invalid Password', 'STEAM_AUTH_FAILED'],
  ['login', 'Session expired; please log in again', 'STEAM_SESSION_EXPIRED'],
  ['login', 'Invalid Steam session', 'STEAM_SESSION_EXPIRED'],
  ['upload', 'Access Denied while updating workshop item', 'STEAM_WORKSHOP_PERMISSION_DENIED'],
  ['upload', 'You are not allowed to update this workshop item', 'STEAM_WORKSHOP_PERMISSION_DENIED'],
  ['upload', 'ERROR! Upload failed', 'STEAM_UPLOAD_FAILED'],
  ['upload', 'Failed to connect to Steam servers', 'STEAM_NETWORK_ERROR'],
  ['upload', 'opaque account-specific response', 'STEAM_UNKNOWN_ERROR'],
];
for (const [stage, output, category] of categories) {
  check(() => assert.deepEqual(classifySteamFailure({ stage, exitCode: 1, output }), { ok: false, category }));
}
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: "Login to Steam successful\nSteam Guard is enabled for this account" }).ok, true));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'Logged in OK' }).ok, true));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'Logging in user \'private-user\' to Steam Public...OK\nWaiting for client config...OK\nWaiting for user info...OK' }).ok, true));
const interleavedLoginOutputs = [
  "WARNING: setlocale('en_US.UTF-8') failed, using locale: 'C'.\nLogging in using cached credentials.\nLogging in user 'ACCOUNT' to Steam Public...OK\nWaiting for client config...Waiting for compat in post-logon took: 0.065615sOK\nWaiting for user info...OK\nUnloading Steam API...OK",
  "WARNING: setlocale('en_US.UTF-8') failed, using locale: 'C'.\nLogging in using cached credentials.\nLogging in user 'ACCOUNT' to Steam Public...OK\nWaiting for client config...OK\nWaiting for user info...Waiting for compat in post-logon took: 0.066187sOK\nUnloading Steam API...OK",
];
const parserPath = path.join(__dirname, 'steam_failure_classification.cjs');
for (const output of interleavedLoginOutputs) {
  check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output }).ok, true));
  // Exercise the actual stdin CLI used in GitHub Actions, not only module helpers.
  check(() => {
    const result = spawnSync(process.execPath, [parserPath, 'login', '0'], { input: output, encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'OK\n');
    assert.equal(result.stderr, '');
  });
  check(() => assert.deepEqual(
    classifySteamFailure({ stage: 'login', exitCode: 0, output: `${output}\nERROR! Login failed` }),
    { ok: false, category: 'STEAM_AUTH_FAILED' },
  ));
  check(() => {
    const result = spawnSync(process.execPath, [parserPath, 'login', '0'], { input: `${output}\nERROR! Login failed`, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, 'STEAM_AUTH_FAILED\n');
    assert.equal(result.stderr, '');
  });
  check(() => {
    const result = spawnSync(process.execPath, [parserPath, 'login', '0', '--diagnostics'], { input: `${output}\nERROR! Login failed`, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^category=STEAM_AUTH_FAILED console_start_reached=no steam_api_loaded=no saved_credentials_indicated=yes/);
    assert.match(result.stdout, /steam_guard_interaction_requested=no authentication_error_detected=yes/);
    assert.equal(result.stderr, '');
    assert.doesNotMatch(result.stdout, /ACCOUNT|setlocale|Steam Public|code required/);
  });
}
check(() => assert.deepEqual(safeLoginDiagnostics({ exitCode: 0, output: 'opaque output without login markers' }), {
	console_start_reached: 'no', steam_api_loaded: 'no', saved_credentials_indicated: 'no',
	password_interaction_requested: 'no', steam_guard_interaction_requested: 'no',
	authentication_error_detected: 'no', connection_error_detected: 'no', session_error_detected: 'no',
	usable_console_output_received: 'yes', exitcode_successful: 'yes', login_marker_recognized: 'no',
	client_config_recognized: 'no', user_info_recognized: 'no',
}));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'opaque output without login markers' }).ok, false,
	'exit code 0 without login markers remains a failure'));
check(() => assert.equal(classifySteamFailure({ stage: 'initialize', exitCode: 0, output: 'Steam Console Client started' }).ok, true,
	'bootstrap exit status is diagnosed separately from strict login confirmation'));
check(() => assert.equal(classifySteamFailure({ stage: 'initialize', exitCode: 0, output: 'Failed to connect to Steam servers' }).category, 'STEAM_NETWORK_ERROR'));
check(() => assert.equal(safeLoginDiagnostics({ exitCode: 1, output: '' }).usable_console_output_received, 'no'));
check(() => {
	const safe = safeLoginDiagnostics({
		exitCode: 1,
		output: "Steam Console Client (c) Valve Corporation\nLoading Steam API...OK\nLogging in using cached credentials\nSteam Guard code required for ACCOUNT\nConnection timed out; session expired\n",
	});
	assert.deepEqual(safe, {
		console_start_reached: 'yes', steam_api_loaded: 'yes', saved_credentials_indicated: 'yes',
		password_interaction_requested: 'no', steam_guard_interaction_requested: 'yes',
		authentication_error_detected: 'no', connection_error_detected: 'yes', session_error_detected: 'yes',
		usable_console_output_received: 'yes', exitcode_successful: 'no', login_marker_recognized: 'no',
		client_config_recognized: 'no', user_info_recognized: 'no',
	});
	assert.doesNotMatch(JSON.stringify(safe), /ACCOUNT|Steam Guard|timed out/);
});
check(() => assert.equal(classifySteamFailure({
  stage: 'login',
  exitCode: 0,
  output: "Logging in user 'ACCOUNT' to Steam Public...OK\nWaiting for client config...unrecognized textOK\nWaiting for user info...OK",
}).category, 'STEAM_UNKNOWN_ERROR'));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'Logged in OK\nWaiting for user info...FAILED' }).category, 'STEAM_UNKNOWN_ERROR'));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'Logging in user \'private-user\' to Steam Public...OK\nWaiting for client config...OK\nLoading Steam API...OK' }).category, 'STEAM_UNKNOWN_ERROR'));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 1, output: 'Logged in OK' }).ok, false));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'Logged in OK\noperation timed out' }).category, 'STEAM_NETWORK_ERROR'));
check(() => assert.equal(classifySteamFailure({ stage: 'login', exitCode: 0, output: 'opaque response' }).category, 'STEAM_UNKNOWN_ERROR'));
check(() => assert.equal(classifySteamFailure({
  stage: 'login',
  exitCode: 0,
  output: "WARNING: setlocale('de_DE.UTF-8') failed, using locale: 'C'.\nLogged in OK",
}).category, 'STEAM_UNKNOWN_ERROR'));
check(() => assert.equal(classifySteamFailure({ stage: 'upload', exitCode: 0, output: 'opaque response' }).category, 'STEAM_UPLOAD_FAILED'));
const secret = 'private-user Steam Guard code required 123456';
check(() => assert.deepEqual(diagnose({ stage: 'login', exitCode: 1, output: secret }), { ok: false, category: 'STEAM_GUARD_REQUIRED' }));
check(() => assert.doesNotMatch(JSON.stringify(diagnose({ stage: 'login', exitCode: 1, output: secret })), /private-user|123456/));

const realCommittedUpload = [
  "WARNING: setlocale('en_US.UTF-8') failed, using locale: 'C'. International characters may not work.",
  'Loading Steam API...OK',
  'Logging in using cached credentials.',
  "Logging in user 'ACCOUNT' to Steam Public...OK",
  'Waiting for client config...OK',
  'Waiting for user info...OK',
  'Preparing update...',
  'Preparing content....',
  'Uploading content....',
  'Committing update...Success.Unloading Steam API...OK',
].join('\n');
check(() => assert.equal(verify(realCommittedUpload).ok, true));
check(() => assert.equal(diagnose({ stage: 'upload', exitCode: 0, output: realCommittedUpload, workshopId: id, resultVdf: vdf }).ok, true));
check(() => assert.equal(verify(realCommittedUpload, {exitCode: 1}).ok, false));
check(() => assert.equal(verify(realCommittedUpload.replace('Uploading content....', 'No content upload')).ok, false));
check(() => assert.equal(verify(realCommittedUpload.replace('Committing update...Success.', 'Committing update...FAILED.')).ok, false));
check(() => assert.equal(verify(realCommittedUpload, {resultVdf: vdf.replace(id, '9999999999999')}).ok, false));
check(() => assert.equal(verify(realCommittedUpload + '\nERROR! Upload failed').ok, false));
check(() => assert.equal(verify(realCommittedUpload + '\nSuccess. Published File ID: 9999999999999').ok, false));
check(() => assert.equal(verify('Preparing update...\nUploading content....\nSuccess.').ok, false));
check(() => assert.equal(verify(realCommittedUpload + '\nSteam Guard code required').ok, false));

require('./test_steamcmd_login_probe_shell.cjs');
require('./test_steamcmd_workshop_upload_shell.cjs');
console.log(`PASS: ${checks} SteamCMD result, strict login, and safe diagnostic cases; no output contents are emitted.`);
