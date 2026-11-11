'use strict';

// Exercise the actual Bash probe with fake SteamCMD/bootstrap commands. GitHub
// Actions runs this on Ubuntu; local Windows runs cannot launch Bash here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.platform === 'win32') {
	console.log('SKIP: actual Bash probe regression runs on the Ubuntu CI runner.');
	module.exports = {};
} else {
	const root = path.resolve(__dirname, '..');
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'epoch-steam-probe-test-'));
	const bin = path.join(temp, 'bin');
	fs.mkdirSync(bin);
	const writeExecutable = (name, content) => {
		const file = path.join(bin, name);
		fs.writeFileSync(file, content);
		fs.chmodSync(file, 0o700);
	};

	writeExecutable('sudo', '#!/bin/sh\nexit 0\n');
	writeExecutable('curl', String.raw`#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    printf 'fake archive' > "$2"
    exit 0
  fi
  shift
done
exit 1
`);
	writeExecutable('tar', String.raw`#!/bin/sh
destination=''
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-C" ]; then destination="$2"; shift 2; else shift; fi
done
cat > "$destination/steamcmd.sh" <<'FAKE_STEAMCMD'
#!/bin/sh
if [ "$1" = "+quit" ]; then
  if [ "$FAKE_INITIALIZE_FAIL" = "yes" ]; then
    echo 'Failed to connect to Steam servers'
  else
    echo 'Steam Console Client (c) Valve Corporation'
    echo 'Loading Steam API...OK'
  fi
  exit 0
fi
if [ "$1" = "+login" ]; then
  echo 'Steam Console Client (c) Valve Corporation'
  echo 'Loading Steam API...OK'
  echo 'Steam Guard code required'
  exit 0
fi
exit 2
FAKE_STEAMCMD
chmod 700 "$destination/steamcmd.sh"
`);

	const runProbe = ({ initializeFail = 'no' } = {}) => {
		const runnerTemp = fs.mkdtempSync(path.join(temp, 'runner-'));
		const result = spawnSync('bash', [path.join(root, 'scripts', 'steamcmd_login_probe.sh')], {
			cwd: root,
			encoding: 'utf8',
			env: {
				...process.env,
				PATH: `${bin}${path.delimiter}${process.env.PATH || ''}`,
				RUNNER_TEMP: runnerTemp,
				GITHUB_WORKSPACE: root,
				STEAM_USERNAME: 'probe-test-user',
				STEAMCMD_CONFIG_VDF: Buffer.from('synthetic config only').toString('base64'),
				FAKE_INITIALIZE_FAIL: initializeFail,
			},
		});
		fs.rmSync(runnerTemp, { recursive: true, force: true });
		return result;
	};

	try {
		const loginFailure = runProbe();
		assert.equal(loginFailure.status, 1, 'a failed login must fail the shell probe');
		assert.match(loginFailure.stdout, /SteamCMD stage=LOGIN category=STEAM_GUARD_REQUIRED/);
		assert.match(loginFailure.stdout, /steam_guard_interaction_requested=yes/);
		assert.match(loginFailure.stdout, /exitcode_successful=yes/);
		assert.match(loginFailure.stdout, /login_marker_recognized=no/);
		assert.doesNotMatch(loginFailure.stdout, /Steam Guard code required/,
			'raw SteamCMD output must not be emitted');
		assert.doesNotMatch(loginFailure.stderr, /Steam Guard code required/);

		const initializeFailure = runProbe({ initializeFail: 'yes' });
		assert.equal(initializeFailure.status, 1, 'a diagnosed bootstrap error must fail the shell probe');
		assert.match(initializeFailure.stdout, /SteamCMD stage=INITIALIZE category=STEAM_NETWORK_ERROR/);
		assert.match(initializeFailure.stdout, /connection_error_detected=yes/);
		assert.match(initializeFailure.stdout, /exitcode_successful=yes/);
		assert.doesNotMatch(initializeFailure.stdout, /Failed to connect to Steam servers/,
			'raw initialization output must not be emitted');
		assert.doesNotMatch(initializeFailure.stderr, /Failed to connect to Steam servers/);
		console.log('PASS: actual shell probe preserves login and initialization diagnostics on parser exit 1.');
	} finally {
		fs.rmSync(temp, { recursive: true, force: true });
	}
}
