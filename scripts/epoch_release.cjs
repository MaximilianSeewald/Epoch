#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PACKAGE_DIRS = ['common', 'events', 'localisation', 'gfx', 'interface', 'compatibility'];
const EXCLUDED_NAMES = new Set(['.git', '.github', '.codex', '.codegraph', 'docs', 'scripts', 'test-mods', 'tests', 'node_modules']);
const THUMBNAIL_NAME = 'thumbnail.png';
const MAX_THUMBNAIL_BYTES = 900 * 1024;

function validateThumbnail(file) {
	const stat = fs.lstatSync(file);
	if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('thumbnail.png must be a regular file');
	if (stat.size >= MAX_THUMBNAIL_BYTES) throw new Error('thumbnail.png must be smaller than 900 KB');
	const data = fs.readFileSync(file);
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (data.length < 45 || !data.subarray(0, 8).equals(signature)) throw new Error('thumbnail.png is not a valid PNG file');
	const width = data.readUInt32BE(16);
	const height = data.readUInt32BE(20);
	if (width !== 512 || height !== 512) throw new Error('thumbnail.png must be 512 x 512 pixels');
	let offset = 8;
	let sawHeader = false;
	let sawData = false;
	let sawEnd = false;
	const imageData = [];
	function crc32(buffer) {
		let crc = 0xffffffff;
		for (const byte of buffer) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
		}
		return (crc ^ 0xffffffff) >>> 0;
	}
	while (offset + 12 <= data.length) {
		const length = data.readUInt32BE(offset);
		const end = offset + 12 + length;
		if (end > data.length) throw new Error('thumbnail.png contains a truncated PNG chunk');
		const type = data.toString('ascii', offset + 4, offset + 8);
		const chunk = data.subarray(offset + 4, offset + 8 + length);
		if (crc32(chunk) !== data.readUInt32BE(offset + 8 + length)) throw new Error('thumbnail.png contains a damaged PNG chunk');
		if (!sawHeader && type !== 'IHDR') throw new Error('thumbnail.png has no PNG header');
		if (type === 'IHDR') {
			if (sawHeader || length !== 13) throw new Error('thumbnail.png has an invalid PNG header');
			sawHeader = true;
		}
		if (type === 'IDAT') {
			sawData = true;
			imageData.push(data.subarray(offset + 8, offset + 8 + length));
		}
		if (type === 'IEND') {
			if (length !== 0 || end !== data.length) throw new Error('thumbnail.png has an invalid PNG end chunk');
			sawEnd = true;
			break;
		}
		offset = end;
	}
	if (!sawHeader || !sawData || !sawEnd) throw new Error('thumbnail.png is incomplete or damaged');
	try {
		if (!zlib.inflateSync(Buffer.concat(imageData)).length) throw new Error('empty image data');
	} catch {
		throw new Error('thumbnail.png image data is damaged');
	}
}

function parseVersion(text) {
	const match = text.match(/^version\s*=\s*"(\d+)\.(\d+)\.(\d+)"\s*$/m);
	if (!match) throw new Error('descriptor.mod must contain a quoted semantic version');
	return match.slice(1).map(Number);
}

function compareVersions(a, b) {
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
	return 0;
}

function formatVersion(version) { return version.join('.'); }

function parseStableTag(tag) {
	const match = /^(?:(?:stable-v|v))?(\d+)\.(\d+)\.(\d+)$/.exec(tag);
	return match ? match.slice(1).map(Number) : null;
}

function selectVersion({ tags, commit, baseVersion = [0, 1, 0] }) {
	const matches = tags
		.map(tag => ({ ...tag, version: parseStableTag(tag.name) }))
		.filter(tag => tag.version);
	const sameCommit = matches.filter(tag => tag.commit === commit).sort((a, b) => compareVersions(b.version, a.version));
	if (sameCommit.length) return { version: formatVersion(sameCommit[0].version), tag: sameCommit[0].name, reused: true };
	const latest = matches.map(tag => tag.version).sort(compareVersions).at(-1);
	const next = latest ? [latest[0], latest[1], latest[2] + 1] : baseVersion;
	return { version: formatVersion(next), tag: `stable-v${formatVersion(next)}`, reused: false };
}

function rewriteDescriptor(descriptor, version) {
	if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Invalid release version: ${version}`);
	const pattern = /^(version\s*=\s*)"\d+\.\d+\.\d+"\s*$/m;
	if (!pattern.test(descriptor)) throw new Error('Could not replace descriptor.mod version');
	return descriptor.replace(pattern, `$1"${version}"`);
}

function walkPackage(root, destination, version) {
	const descriptorPath = path.join(root, 'descriptor.mod');
	if (!fs.existsSync(descriptorPath)) throw new Error('descriptor.mod is missing');
	parseVersion(fs.readFileSync(descriptorPath, 'utf8'));
	fs.mkdirSync(destination, { recursive: true });
	fs.writeFileSync(path.join(destination, 'descriptor.mod'), rewriteDescriptor(fs.readFileSync(descriptorPath, 'utf8'), version));
	const thumbnailPath = path.join(root, THUMBNAIL_NAME);
	if (!fs.existsSync(thumbnailPath)) throw new Error('thumbnail.png is missing');
	validateThumbnail(thumbnailPath);
	fs.copyFileSync(thumbnailPath, path.join(destination, THUMBNAIL_NAME));
	const copied = ['descriptor.mod'];
	for (const name of PACKAGE_DIRS) {
		const source = path.join(root, name);
		if (!fs.existsSync(source)) continue;
		const stat = fs.lstatSync(source);
		if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Package source must be a real directory: ${name}`);
		fs.cpSync(source, path.join(destination, name), {
			recursive: true,
			filter: entry => {
				const rel = path.relative(root, entry);
				const parts = rel.split(path.sep);
				if (parts.some(part => EXCLUDED_NAMES.has(part) || part.startsWith('.'))) return false;
				if (fs.lstatSync(entry).isSymbolicLink()) throw new Error(`Symlinks are not allowed in package: ${rel}`);
				return true;
			}
		});
		copied.push(name);
	}
	return copied;
}

function validatePackage(root, version) {
	const descriptorPath = path.join(root, 'descriptor.mod');
	if (!fs.existsSync(descriptorPath)) throw new Error('Packaged descriptor.mod is missing');
	const descriptor = fs.readFileSync(descriptorPath, 'utf8');
	if (formatVersion(parseVersion(descriptor)) !== version) throw new Error('Package descriptor version does not match release version');
	if (!/^picture\s*=\s*"thumbnail\.png"\s*$/m.test(descriptor)) throw new Error('Packaged descriptor.mod must reference thumbnail.png');
	validateThumbnail(path.join(root, THUMBNAIL_NAME));
	const files = [];
	function visit(dir) {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			const rel = path.relative(root, full).split(path.sep).join('/');
			if (entry.isSymbolicLink()) throw new Error(`Package contains a symlink: ${rel}`);
			if (entry.isDirectory()) visit(full);
			else {
				if (EXCLUDED_NAMES.has(entry.name) || /(?:^|\/)(?:\.git|\.github|docs|scripts|test-mods|tests)(?:\/|$)/.test(rel)) throw new Error(`Development file included in package: ${rel}`);
				files.push(rel);
			}
		}
	}
	visit(root);
	if (!files.includes('descriptor.mod')) throw new Error('descriptor.mod must be at the package root');
	if (!files.includes(THUMBNAIL_NAME)) throw new Error('thumbnail.png must be at the package root');
	return files.sort();
}

function validateWorkshopConfig({ workshopId, username, session }) {
	const id = String(workshopId || '').trim();
	const account = String(username || '').trim();
	const authenticatedSession = String(session || '').trim();
	if (!id && !account && !authenticatedSession) return { enabled: false, reason: 'Steam session and Workshop ID are not configured; package-only dry run' };
	if (!id || !account || !authenticatedSession) throw new Error('Steam upload configuration is incomplete; set STEAM_WORKSHOP_ID, STEAM_USERNAME, and STEAMCMD_CONFIG_VDF');
	if (!/^[1-9]\d{5,19}$/.test(id)) throw new Error('STEAM_WORKSHOP_ID must be a nonzero numeric Workshop item ID');
	const base64 = authenticatedSession.replace(/\s+/g, '');
	if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64) || !base64) {
		throw new Error('STEAMCMD_CONFIG_VDF must be a base64-encoded SteamCMD config.vdf');
	}
	return { enabled: true, workshopId: id };
}

module.exports = { PACKAGE_DIRS, MAX_THUMBNAIL_BYTES, parseVersion, compareVersions, formatVersion, parseStableTag, selectVersion, rewriteDescriptor, validateThumbnail, walkPackage, validatePackage, validateWorkshopConfig };

if (require.main === module) {
	const [command, ...args] = process.argv.slice(2);
	try {
		if (command === 'version') {
			const [root, commit, ...rawTags] = args;
			const tags = rawTags.map(pair => { const index = pair.indexOf('='); return { name: pair.slice(0, index), commit: pair.slice(index + 1) }; });
			const baseVersion = parseVersion(fs.readFileSync(path.join(root, 'descriptor.mod'), 'utf8'));
			process.stdout.write(JSON.stringify(selectVersion({ tags, commit, baseVersion })) + '\n');
		} else if (command === 'package') {
			const [root, destination, version] = args;
			walkPackage(root, destination, version);
			const files = validatePackage(destination, version);
			process.stdout.write(JSON.stringify({ version, files }) + '\n');
		} else throw new Error('Usage: epoch_release.cjs <version|package> ...');
	} catch (error) {
		process.stderr.write(`Release preparation failed: ${error.message}\n`);
		process.exitCode = 1;
	}
}
