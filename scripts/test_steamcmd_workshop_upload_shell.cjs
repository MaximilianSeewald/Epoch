'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const bashCandidates = [
  'bash',
  ...(process.platform === 'win32' && process.env.ProgramFiles
    ? [path.join(process.env.ProgramFiles, 'Git', 'bin', 'bash.exe')]
    : []),
];
const bash = bashCandidates.find(candidate => {
  const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
  return !result.error && result.status === 0;
});

if (!bash) {
  console.log('SKIP: direct SteamCMD Bash helper test requires Bash.');
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
  make('timeout', [
    '#!/bin/sh',
    'if [ "$FAKE_UPLOAD_MODE" = timeout ]; then exit 124; fi',
    'shift 2',
    'exec "$@"',
    '',
  ].join('\n'));
  make('curl', '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do\n if [ "$1" = "-o" ]; then printf "fake archive" > "$2"; exit 0; fi\n shift\ndone\nexit 1\n');
  make('tar', [
    '#!/bin/sh',
    'while [ "$#" -gt 0 ]; do',
    '  if [ "$1" = "-C" ]; then destination="$2"; break; fi',
    '  shift',
    'done',
    'cat > "$destination/steamcmd.sh" <<\'FAKE_STEAMCMD\'',
    '#!/bin/sh',
    'if [ "$1" = "+quit" ]; then echo "SteamCMD initialized"; exit 0; fi',
    'if [ "$1" = "+login" ]; then',
    '  [ "$3" = "+workshop_build_item" ] || exit 44',
    '  case "$FAKE_UPLOAD_MODE" in',
    '    failed) echo "ERROR! Upload failed for TEST_ACCOUNT"; exit 1 ;;',
    '    *) echo "arbitrary output, including ERROR! Upload failed for TEST_ACCOUNT"; exit 0 ;;',
    '  esac',
    'fi',
    'exit 43',
    'FAKE_STEAMCMD',
    'chmod 700 "$destination/steamcmd.sh"',
    '',
  ].join('\n'));

  function probe(mode, { workshopId = '1234567890123', packagePresent = true } = {}) {
    const runnerTemp = fs.mkdtempSync(path.join(temp, 'runner-'));
    const stage = path.join(runnerTemp, 'epoch-mod-package');
    fs.mkdirSync(stage);
    if (packagePresent) fs.writeFileSync(path.join(stage, 'descriptor.mod'), 'version="0.1.5"\n');
    const result = spawnSync(bash, [path.join(root, 'scripts', 'steamcmd_workshop_upload.sh')], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: bin + path.delimiter + (process.env.PATH || ''),
        RUNNER_TEMP: runnerTemp,
        GITHUB_WORKSPACE: root,
        STEAM_USERNAME: 'TEST_ACCOUNT',
        STEAMCMD_CONFIG_VDF: Buffer.from('synthetic test config').toString('base64'),
        STEAM_WORKSHOP_ID: workshopId,
        RELEASE_VERSION: '0.1.5',
        COMMIT_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        GITHUB_OUTPUT: path.join(runnerTemp, 'output'),
        FAKE_UPLOAD_MODE: mode,
      },
    });
    const output = fs.existsSync(path.join(runnerTemp, 'output')) ? fs.readFileSync(path.join(runnerTemp, 'output'), 'utf8') : '';
    assert.equal(fs.existsSync(path.join(runnerTemp, 'steam-home')), false, 'session must be cleaned up');
    assert.equal(fs.existsSync(path.join(runnerTemp, 'steamcmd-output.log')), false, 'raw SteamCMD log must be cleaned up');
    fs.rmSync(runnerTemp, { recursive: true, force: true });
    return { result, output };
  }

  try {
    const ok = probe('success');
    assert.equal(ok.result.status, 0, ok.result.stderr);
    assert.match(ok.output, /uploaded=true/);
    assert.match(ok.result.stdout, /SteamCMD completed successfully for Workshop 1234567890123/);
    assert.doesNotMatch(ok.result.stdout + ok.result.stderr, /arbitrary output|TEST_ACCOUNT/);

    for (const [mode, options] of [
      ['failed', {}],
      ['timeout', {}],
      ['success', { packagePresent: false }],
      ['success', { workshopId: 'not-an-id' }],
    ]) {
      const attempt = probe(mode, options);
      assert.equal(attempt.result.status, 1, `${mode} must fail: ${attempt.result.stderr}`);
      assert.doesNotMatch(attempt.output, /uploaded=true/);
      assert.doesNotMatch(attempt.result.stdout + attempt.result.stderr, /ERROR! Upload failed|TEST_ACCOUNT/);
    }
    console.log('PASS: SteamCMD exit code controls upload result; timeout, missing package, invalid ID, log secrecy and cleanup verified.');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
