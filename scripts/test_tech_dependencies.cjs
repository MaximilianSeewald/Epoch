'use strict';

// Validates the EPOCH technology DAG from repository definitions only. This
// checks identifiers and graph structure, not Stellaris engine semantics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('./test_clausewitz_structure.cjs');

const root = process.argv[2] || path.resolve(__dirname, '..');
const directory = path.join(root, 'common', 'technology');
const definitions = new Map();
let checks = 0;
const check = (value, message) => { checks++; assert.ok(value, message); };

for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.txt'))) {
	const relative = path.join('common', 'technology', file);
	for (const [id, body] of parse(fs.readFileSync(path.join(directory, file), 'utf8'), relative)) {
		if (!id.startsWith('tech_epoch_')) continue;
		check(!definitions.has(id), `Duplicate EPOCH technology ${id}`);
		definitions.set(id, { body, file: relative });
	}
}
check(definitions.size > 0, 'No EPOCH technologies were found');

const read = (body, key) => body.find(([name]) => name === key)?.[1];
const edges = new Map();
for (const [id, definition] of definitions) {
	const area = read(definition.body, 'area');
	const tier = Number(read(definition.body, 'tier'));
	check(['physics', 'society', 'engineering'].includes(area), `${id}: valid research area`);
	check(Number.isInteger(tier) && tier >= 1 && tier <= 5, `${id}: valid technology tier`);
	const prerequisites = read(definition.body, 'prerequisites');
	const refs = prerequisites ? prerequisites.map(([, value]) => value.replace(/^"|"$/g, '')) : [];
	for (const reference of refs) check(typeof reference === 'string' && reference.length > 0, `${id}: prerequisite must be a non-empty identifier`);
	for (const reference of refs.filter(value => value.startsWith('tech_epoch_'))) {
		check(definitions.has(reference), `${id}: EPOCH prerequisite ${reference} is defined`);
	}
	edges.set(id, refs.filter(value => definitions.has(value)));
}

const active = new Set();
const complete = new Set();
function visit(id, chain = []) {
	if (complete.has(id)) return;
	check(!active.has(id), `Technology prerequisite cycle: ${[...chain, id].join(' -> ')}`);
	active.add(id);
	for (const prerequisite of edges.get(id) || []) visit(prerequisite, [...chain, id]);
	active.delete(id);
	complete.add(id);
}
for (const id of definitions.keys()) visit(id);

process.stdout.write(`PASS: ${checks} EPOCH technology DAG checks across ${definitions.size} definitions; source-only, no Vanilla files used.\n`);
