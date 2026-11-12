'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.platform === 'win32') {
  console.log('SKIP: direct SteamCMD Bash helper test runs on Ubuntu CI.');
} else {
  const root = path.resolve(__dirname, '..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'epoch-upload-shell-'));
  const bin = path.join(temp, 'bin');
  fs.mkdirSync(bin);
  const make = (name, contents) => {
    const target = path.join(bin, name);
    fs.writeFileSync(target, contents);
    fs.chmodSync(target, 0o700);
  };
  make('sudo', '#!/bin/sh\nexit 0\n');
  make('curl', '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do\n if [ "$1" = "-o" ]; then printf "fake archive" > "$2"; exit 0; fi\n shift\ndone\nexit 1\n');
  make('tar', [
    '#!/bin/sh',
    'while [ "$#" -gt 0 ]; do',
    '  if [ "$1" = "-C" ]; then destination="$2"; break; fi',
    '  shift',
    'done',
    'cat > "$destination/steamcmd.sh" <<\'FAKE_STEAMCMD\'',
    '#!/bin/sh',
    'if [ "$1" = "+quit" ]; then',
    '  echo "Steam Console Client (c) Valve Corporation"',
    '  echo "Loading Steam API...OK"',
    '  exit 0',
    'fi',
    'if [ "$1" = "+login" ]; then',
    '  if [ "$3" != "+workshop_build_item" ]; then exit 44; fi',
    '  case "$FAKE_UPLOAD_MODE" in',
    '    failed) echo "ERROR! Upload failed"; exit 0 ;;',
    '    badid) echo "Preparing update..."; echo "Uploading content...."; echo "Committing update...Success."; echo "Success. Published File ID: 9999999999999"; exit 0 ;;',
    '    skipped) echo "Logging in using cached credentials."; exit 1 ;;',
    '    *) echo "Preparing update..."; echo "Preparing content...."; echo "Uploading content...."; echo "Committing update...Success.Unloading Steam API...OK"; exit 0 ;;',
    '  esac',
    'fi',
    'exit 43',
    'FAKE_STEAMCMD',
    'chmod 700 "$destination/steamcmd.sh"',
    '',
  ].join('\n'));

  function probe(mode) {
    const runnerTemp = fs.mkdtempSync(path.join(temp, 'runner-'));
    const stage = path.join(runnerTemp, 'epoch-mod-package');
    fs.mkdirSync(stage);
    fs.writeFileSync(path.join(stage, 'descriptor.mod'), 'version="0.1.5"\n');
    const result = spawnSync('bash', [path.join(root, 'scripts', 'steamcmd_workshop_upload.sh')], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: bin + path.delimiter + (process.env.PATH || ''),
        RUNNER_TEMP: runnerTemp,
        GITHUB_WORKSPACE: root,
        STEAM_USERNAME: 'TEST_ACCOUNT',
        STEAMCMD_CONFIG_VDF: Buffer.from('synthetic test config').toString('base64'),
        STEAM_WORKSHOP_ID: '1234567890123',
        RELEASE_VERSION: '0.1.5',
        COMMIT_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        GITHUB_OUTPUT: path.join(runnerTemp, 'output'),
        FAKE_UPLOAD_MODE: mode,
      },
    });
    const output = fs.existsSync(path.join(runnerTemp, 'output')) ? fs.readFileSync(path.join(runnerTemp, 'output'), 'utf8') : '';
    assert.equal(fs.existsSync(path.join(runnerTemp, 'steam-home')), false, 'session must be cleaned up');
    fs.rmSync(runnerTemp, { recursive: true, force: true });
    return { result, output };
  }

  try {
    const ok = probe('success');
    assert.equal(ok.result.status, 0, ok.result.stderr);
    assert.match(ok.output, /uploaded=true/);
    assert.match(ok.result.stdout, /stage=UPLOAD category=OK/);

    for (const failure of ['failed', 'badid', 'skipped']) {
      const attempt = probe(failure);
      assert.equal(attempt.result.status, 1, `case ${failure} must fail closed: ${attempt.result.stderr}`);
      assert.doesNotMatch(attempt.output, /uploaded=true/);
      assert.doesNotMatch(attempt.result.stderr, /ERROR! Upload failed|9999999999999|TEST_ACCOUNT/, 'raw SteamCMD output not exposed');
    }
    console.log('PASS: direct upload helper confirms committed update, rejects errors, wrong ID and missing upload.');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
