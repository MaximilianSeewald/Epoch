'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const release = require('./epoch_release.cjs');
const steamcmdConfig = require('./steamcmd_config_path.cjs');

let checks = 0;
function check(fn) { fn(); checks++; }

check(() => assert.deepEqual(release.parseVersion('name="EPOCH"\nversion="0.1.0"\n'), [0, 1, 0]));
check(() => assert.equal(release.selectVersion({ tags: [], commit: 'abc', baseVersion: [0, 1, 0] }).version, '0.1.0'));
check(() => assert.deepEqual(release.parseStableTag('0.1.0'), [0, 1, 0]));
check(() => assert.equal(release.selectVersion({ tags: [{ name: 'stable-v0.1.1', commit: 'old' }], commit: 'new' }).version, '0.1.2'));
check(() => assert.equal(release.selectVersion({ tags: [{ name: 'stable-v0.1.0', commit: 'reserved' }], commit: 'new' }).version, '0.1.1'));
check(() => assert.deepEqual(release.selectVersion({ tags: [{ name: 'stable-v0.1.3', commit: 'same' }], commit: 'same' }), { version: '0.1.3', tag: 'stable-v0.1.3', reused: true }));
check(() => assert.equal(release.selectVersion({ tags: [{ name: 'stable-v0.1.3', commit: 'same' }, { name: 'stable-v0.1.2', commit: 'same' }], commit: 'same' }).version, '0.1.3'));
check(() => assert.throws(() => release.parseVersion('version="latest"'), /semantic version/));
check(() => assert.throws(() => release.rewriteDescriptor('version="0.1.0"', '0.1.0-rc1'), /Invalid release version/));
check(() => assert.deepEqual(release.validateWorkshopConfig({}), { enabled: false, reason: 'Steam session and Workshop ID are not configured; package-only dry run' }));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: 'not-an-id', username: 'u', session: 'x' }), /numeric/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '000000', username: 'u', session: 'dGVzdA==' }), /nonzero/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '123456789' }), /incomplete/));
check(() => assert.throws(() => release.validateWorkshopConfig({ username: 'u' }), /incomplete/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '123456789', username: 'u' }), /incomplete/));
check(() => assert.throws(() => release.validateWorkshopConfig({ workshopId: '123456789', username: 'u', session: 'not base64' }), /base64-encoded/));
check(() => assert.equal(release.validateWorkshopConfig({ workshopId: '123456789', username: 'u', session: 'dGVzdA==' }).enabled, true));
const isolatedHome = path.join(os.tmpdir(), 'epoch-steam-home');
check(() => assert.equal(steamcmdConfig.resolveSteamcmdConfigPath(isolatedHome), path.join(isolatedHome, 'Steam', 'config', 'config.vdf')));
check(() => assert.equal(steamcmdConfig.resolveSteamcmdConfigPath(path.join(isolatedHome, '..', 'epoch-steam-home')), path.join(isolatedHome, 'Steam', 'config', 'config.vdf')));
check(() => assert.throws(() => steamcmdConfig.resolveSteamcmdConfigPath(''), /HOME must be provided/));

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'stable-release.yml'), 'utf8');
const uploadScript = fs.readFileSync(path.join(__dirname, 'steamcmd_workshop_upload.sh'), 'utf8');
const loginProbe = fs.readFileSync(path.join(__dirname, 'steamcmd_login_probe.sh'), 'utf8');
const classification = fs.readFileSync(path.join(__dirname, 'steam_failure_classification.cjs'), 'utf8');
const authWorkflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'steamcmd-auth-probe.yml'), 'utf8');
for (const [pattern, label] of [
  [/runs-on:\s*ubuntu-latest/, 'GitHub-hosted Ubuntu runner'],
  [/cancel-in-progress:\s*false/, 'serialized non-cancelling releases'],
  [/git rev-parse FETCH_HEAD/, 'current main freshness guard'],
  [/git tag -a/, 'annotated stable tag'],
  [/git push origin "refs\/tags\/\$RELEASE_TAG"/, 'permanent tag reservation'],
  [/bash scripts\/steamcmd_workshop_upload\.sh/, 'direct SteamCMD upload helper'],
  [/if: steps\.steam-config\.outputs\.upload == 'true'/, 'upload only with valid Steam configuration'],
  [/if: steps\.steam-upload\.outputs\.uploaded == 'true'/, 'tag reservation gated on verified upload'],
  [/if: steps\.reservation\.outputs\.reserved == 'true'/, 'GitHub release gated on tag reservation'],
  [/if: always\(\)[\s\S]*?rm -rf "\$RUNNER_TEMP\/steam-home"/, 'session cleanup'],
]) check(() => assert.match(workflow, pattern, label));
for (const marker of ['exitcode_successful', 'login_marker_recognized', 'client_config_recognized', 'user_info_recognized', 'console_start_reached', 'steam_api_loaded', 'saved_credentials_indicated', 'password_interaction_requested', 'steam_guard_interaction_requested', 'authentication_error_detected', 'connection_error_detected', 'session_error_detected', 'usable_console_output_received']) {
  check(() => assert.match(classification, new RegExp(marker)));
}
check(() => assert.match(uploadScript, /"publishedfileid" "\$STEAM_WORKSHOP_ID"/));
check(() => assert.match(uploadScript, /\+login "\$STEAM_USERNAME" \+workshop_build_item "\$vdf" \+quit/));
check(() => assert.doesNotMatch(uploadScript, /\+login "\$STEAM_USERNAME" \+quit/, 'no standalone login-text gate'));
check(() => assert.match(uploadScript, /steam_workshop_confirmation\.cjs/));
check(() => assert.match(uploadScript, /status=\$\?/));
check(() => assert.match(uploadScript, /trap cleanup EXIT/));
check(() => assert.match(uploadScript, /uploaded=true/));
check(() => assert.doesNotMatch(uploadScript, /git tag|git push|gh release/, 'upload helper has no GitHub publishing action'));
check(() => assert.doesNotMatch(workflow, /steps\.steam-login\.outputs/, 'login-text parser cannot gate release'));
check(() => assert.ok(workflow.indexOf('- name: Upload existing Workshop item') < workflow.indexOf('- name: Reserve release version for this commit'), 'confirmed upload precedes tag reservation'));
check(() => assert.ok(workflow.indexOf('- name: Reserve release version for this commit') < workflow.indexOf('- name: Finalize GitHub stable release'), 'tag reservation precedes GitHub Release'));
const reservation = workflow.slice(workflow.indexOf('- name: Reserve release version for this commit'), workflow.indexOf('- name: Finalize GitHub stable release'));
for (const [pattern, label] of [
  [/git config --local user\.name "github-actions\[bot\]"/, 'tag author'],
  [/git config --local user\.email "41898282\+github-actions\[bot\]@users\.noreply\.github\.com"/, 'tag bot email'],
  [/git config --local tag\.gpgSign false/, 'disable signing'],
  [/git tag -a .* -m /, 'tag carries explicit message'],
]) check(() => assert.match(reservation, pattern, label));
check(() => assert.match(workflow, /persist-credentials:\s*true/));
check(() => assert.ok(reservation.indexOf('git config --local user.name') < reservation.indexOf('git tag -a')));
check(() => assert.ok(reservation.indexOf('git config --local user.email') < reservation.indexOf('git tag -a')));
check(() => assert.doesNotMatch(reservation, /git config --global/));
check(() => assert.doesNotMatch(workflow, /STEAM_PASSWORD|STEAM_GUARD_CODE|EPOCH_VANILLA_ROOT|EPOCH_LOG_DIRECTORY/));
check(() => assert.match(workflow, /if: steps\.steam-upload\.outputs\.uploaded == 'true'[\s\S]*?git push origin "refs\/tags\/\$RELEASE_TAG"/, 'no verified upload means no tag'));
check(() => assert.match(loginProbe, /\+login "\$STEAM_USERNAME" \+quit/));
check(() => assert.doesNotMatch(loginProbe, /workshop_build_item|git tag|gh release/));
check(() => assert.match(authWorkflow, /workflow_dispatch:/));
check(() => assert.match(authWorkflow, /bash scripts\/steamcmd_login_probe\.sh/));
check(() => assert.doesNotMatch(authWorkflow, /workshop_build_item|git tag|gh release|stable-release\.yml/));
check(() => assert.match(authWorkflow, /if: always\(\)[\s\S]*?rm -rf/));

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'epoch-release-'));
try {
	const source = path.join(temp, 'source');
	const output = path.join(temp, 'package');
	fs.mkdirSync(source);
	fs.writeFileSync(path.join(source, 'descriptor.mod'), 'name="EPOCH"\nversion="0.1.0"\nsupported_version="4.5.*"\n');
	for (const dir of ['common', 'events', 'localisation', 'gfx', 'interface', 'compatibility', 'docs', 'scripts', 'test-mods', '.github']) {
		fs.mkdirSync(path.join(source, dir), { recursive: true });
		fs.writeFileSync(path.join(source, dir, 'payload.txt'), 'payload');
	}
	release.walkPackage(source, output, '0.1.0');
	const files = release.validatePackage(output, '0.1.0');
	check(() => assert(files.includes('descriptor.mod')));
	check(() => assert(files.includes('common/payload.txt')));
	check(() => assert(files.includes('compatibility/payload.txt')));
	check(() => assert(!files.some(file => /^(docs|scripts|test-mods|\.github)\//.test(file))));
	check(() => assert.equal(release.formatVersion(release.parseVersion(fs.readFileSync(path.join(output, 'descriptor.mod'), 'utf8'))), '0.1.0'));
	fs.mkdirSync(path.join(output, 'docs'), { recursive: true });
	fs.writeFileSync(path.join(output, 'docs', 'leak.txt'), 'forbidden');
	check(() => assert.throws(() => release.validatePackage(output, '0.1.0'), /Development file/));
} finally {
	fs.rmSync(temp, { recursive: true, force: true });
}

process.stdout.write(`PASS: ${checks} release automation checks passed.\n`);
