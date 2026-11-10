#!/usr/bin/env node
// Classifies Stellaris error.log diagnostics into EPOCH root causes, cascades,
// and unrelated/foreign errors. This is a gate for fresh in-game logs.
const fs = require('node:fs');
const path = require('node:path');

const rules = [
  ['Missing EPOCH native asset', /missing texture|missing modifier icon|missing outliner icon sprite|couldn.t find texture|unknown sprite|error initialising texture/i],
  ['Unlocalized EPOCH modifier', /modifier is used but not localized/i],
  ['Critical scripted-effect depth', /max effects post init recursive depth/i],
  ['Invalid context switch', /invalid context switch/i],
  ['Invalid name promotion', /unknown promotion|unknown property/i],
  ['Corrupt Event Table Entry', /corrupt event table entry/i],
  ['Invalid EPOCH event structure', /else(?:\s*\/\s*else)?(?:\s+if)? not following an if/i],
  ['Wrong Scope', /wrong scope/i],
  ['Invalid EPOCH building', /(?:building_sets|invalid building|unexpected token:\s*(?:cost|upkeep))/i],
  ['Unexpected token', /unexpected token/i],
  ['Invalid EPOCH ship component', /invalid component template/i],
  ['Invalid EPOCH GFX culture', /invalid gfx culture/i],
  ['Missing EPOCH localization key', /(?:missing|could not find|unknown).*(?:locali[sz]ation|situation localization key)|(?:locali[sz]ation|situation localization key).*(?:missing|could not find|unknown)/i],
  ['Invalid EPOCH trigger/effect', /invalid (?:trigger|effect)|unknown (?:trigger|effect)|no effect named|no trigger named/i],
  ['Invalid EPOCH Event ID', /invalid event id|invalid id.*epoch|epoch[^\n]*(?:invalid|not found)/i],
  ['Could not find EPOCH event', /could not find event/i],
];

function classify(text) {
  const lines = text.split(/\r?\n/);
  const merged = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*"?\s+in file:/i.test(lines[i]) && merged.length) merged[merged.length - 1].text += ` ${lines[i].trim()}`;
    else merged.push({ line: i + 1, text: lines[i] });
  }
  const entries = merged.map(entry => ({ ...entry, epoch: /epoch[_./\\-]/i.test(entry.text) || /missing situation localization key:\s*(?:stage_|epoch_resonance_)/i.test(entry.text) || /invalid context switch \[planet\] from (?:the )?silent structure \[archaeological_site\].*ancient_relics_site_spawn_event/i.test(entry.text) }));
  const epochCorruptFiles = new Set(entries.filter(e => e.epoch && /corrupt event table entry/i.test(e.text)).map(e => e.text.match(/(?:events[\\/])?epoch_[\w.-]+\.txt/i)?.[0]?.toLowerCase()).filter(Boolean));
  const root = [], cascades = [], foreign = [], seenCorruptFiles = new Set();
  for (const entry of entries) {
    if (!entry.text.trim() || !/error|warning|invalid|corrupt|could not find|missing|unexpected|wrong scope|critical|unknown promotion|unknown property|unknown sprite|not localized/i.test(entry.text)) continue;
    if (!entry.epoch) { foreign.push(entry); continue; }
    const file = entry.text.match(/(?:events[\\/])?epoch_[\w.-]+\.txt/i)?.[0]?.toLowerCase();
    const category = rules.find(([, regex]) => regex.test(entry.text));
    if (category?.[0] === 'Corrupt Event Table Entry') {
      if (file && seenCorruptFiles.has(file)) cascades.push({ ...entry, category: 'Event table cascade' });
      else {
        if (file) seenCorruptFiles.add(file);
        root.push({ ...entry, category: category[0] });
      }
      continue;
    }
    const isEventLookup = category?.[0] === 'Invalid EPOCH Event ID' || category?.[0] === 'Could not find EPOCH event';
    const cascade = (isEventLookup && (epochCorruptFiles.has(file) || epochCorruptFiles.size > 0))
      || (category?.[0] === 'Unexpected token' && file?.startsWith('events/') && epochCorruptFiles.has(file));
    if (cascade) cascades.push({ ...entry, category: category?.[0] || 'EPOCH event cascade' });
    else if (category) root.push({ ...entry, category: category[0] });
    else foreign.push(entry);
  }
  return { root, cascades, foreign };
}

function selfTest() {
  const fixture = [
    '[event.cpp:1]: Corrupt Event Table Entry in "events/epoch_phase_ii_events.txt" line: 1',
    '[event.cpp:2]: Invalid event id: epoch_ii.1 in "events/epoch_phase_ii_events.txt"',
    '[event.cpp:3]: Could not find event epoch_ii.2',
    '[effect.cpp:4]: Wrong Scope for set_situation_approach in events/epoch_phase_ii_events.txt',
    '[building.cpp:5]: Unexpected token: cost in common/buildings/epoch_phase_ii_buildings.txt',
    '[ship.cpp:6]: Invalid component template "COMBAT_COMPUTER_LINE_1" in common/global_ship_designs/epoch_nullwarden_designs.txt',
    '[gfx.cpp:7]: Invalid gfx culture "machine_01" in events/epoch_phase_ii_events.txt',
    '[localisation.cpp:8]: Missing localization key epoch_resonance_protocol_type',
    '[vanilla.cpp:9]: unrelated vanilla warning',
  ].join('\n');
  const result = classify(fixture + '\n[effect.cpp:10]: Else/else if not following an if in events/epoch_phase_ii_events.txt');
  if (result.root.length !== 6 || result.cascades.length !== 2 || result.foreign.length !== 1) throw new Error(`Self-test mismatch: ${JSON.stringify({ root: result.root.length, cascades: result.cascades.length, foreign: result.foreign.length })}`);
  const runtime=classify([
    '[effect.cpp:73]: CRITICAL: Max effects post init recursive depth of 5 reached at common/scripted_effects/epoch_core_effects.txt',
    '[trigger_impl.cpp:1218]: Script Error: Invalid context switch [planet] from Silent structure [archaeological_site], file: events/ancient_relics_site_spawn_event.txt line: 91',
    '[game_text.cpp:1531]: Unknown promotion `event_target:epoch_res_battle_location`',
  ].join('\n'));
  if(runtime.root.length!==3||runtime.foreign.length)throw Error('All three reported runtime failures must be EPOCH root errors');
  const bc=classify('[job.cpp:1]: Job epoch_factory is missing texture gfx/interface/icons/jobs/job_epoch_factory.dds\n[3dicon.cpp:2]: Trying to change sprite to unknown sprite GFX_epoch_nexus_1_build_icon\n[modifier.cpp:3]: mod_pop_epoch_lab_bonus_workforce_mult modifier is used but not localized!');
  if(bc.root.length!==3)throw Error('B+C missing assets and generated localization must fail the log gate');
  if(classify('[modifier.cpp:1]: Missing modifier icon gfx/interface/icons/modifiers/mod_epoch_protocol_cores_cost_add.dds\n[mega.cpp:1]: Megastructure epoch_forge_1 is missing outliner icon sprite GFX_epoch_forge_1_outliner_icon').root.length!==2)throw Error('Modifier/outliner missing art must fail');
  console.log('PASS: runtime log classifier self-test (root causes, EPOCH cascades, foreign diagnostics).');
}

if (process.argv.includes('--self-test')) selfTest();
const logs = process.argv.slice(2).filter(arg => arg !== '--self-test');
if (!logs.length) {
  if (process.argv.includes('--self-test')) process.exit(0);
  console.error('Usage: node scripts/test_stellaris_runtime_log.cjs [--self-test] <error.log> [...logs]');
  process.exit(2);
}
let failed = false;
for (const logPath of logs) {
  const result = classify(fs.readFileSync(path.resolve(logPath), 'utf8'));
  console.log(`\n${logPath}`);
  for (const [label, items] of [['EPOCH root errors', result.root], ['EPOCH cascades', result.cascades], ['Foreign/Vanilla/Workshop', result.foreign]]) {
    console.log(`${label}: ${items.length}`);
    for (const item of items.slice(0, 20)) console.log(`  L${item.line} [${item.category || 'foreign'}] ${item.text.trim()}`);
    if (items.length > 20) console.log(`  ... ${items.length - 20} more`);
  }
  if (result.root.length) failed = true;
}
if (failed) process.exitCode = 1;
