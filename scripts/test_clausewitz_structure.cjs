// Clausewitz parser and focused event-structure audit. It checks nesting plus
// selected engine rules for event options; it is not a complete engine validator.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = process.argv[2] || path.resolve(__dirname, '..');
const vanillaRoot = process.argv[3] || 'G:/Steam/steamapps/common/Stellaris';
const sourceOnly = process.argv.includes('--source-only');
const files = [];
for (const folder of ['common', 'events', 'test-mods']) {
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && full.endsWith('.txt')) files.push(full);
    }
  };
  visit(path.join(root, folder));
}

function tokenize(source, file) {
  const tokens = [];
  for (let i = 0; i < source.length;) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '#') { while (i < source.length && source[i] !== '\n') i++; continue; }
    if ('{}='.includes(c)) { tokens.push(c); i++; continue; }
    if (c === '"') {
      const start = i++;
      let closed = false;
      while (i < source.length) {
        if (source[i] === '\\') { i += 2; continue; }
        if (source[i++] === '"') { closed = true; break; }
      }
      assert.ok(closed, `${file}: unterminated string at byte ${start}`);
      tokens.push(source.slice(start, i));
      continue;
    }
    const start = i;
    while (i < source.length && !/\s/.test(source[i]) && !'{}=#"'.includes(source[i])) i++;
    assert.ok(i > start, `${file}: invalid token at byte ${i}`);
    tokens.push(source.slice(start, i));
  }
  return tokens;
}

function parse(source, file) {
  const tokens = tokenize(source, file);
  let i = 0;
  const parseScope = nested => {
    const pairs = [];
    const isMap = tokens[i] === '}' || ['=', '>', '<', '!'].includes(tokens[i + 1]);
    while (i < tokens.length && tokens[i] !== '}') {
      if (!isMap) {
        const item = tokens[i++];
        assert.ok(item !== '=' && item !== '{', `${file}: invalid list item ${item}`);
        pairs.push([null, item === '}' ? item : item]);
        continue;
      }
      const key = tokens[i++];
      assert.ok(key !== '{' && key !== '=', `${file}: expected key, got ${key} near ${tokens.slice(i-8,i+8).join(" ")}`);
      let operator = tokens[i++];
      if (['>', '<', '!'].includes(operator) && tokens[i] === '=') operator += tokens[i++];
      const operators = new Set(['=', '>', '<', '>=', '<=', '!=']);
      assert.ok(operators.has(operator), `${file}: expected operator after ${key}`);
      const value = tokens[i++];
      assert.notEqual(value, undefined, `${file}: missing value for ${key}`);
      if (operator === '=' && value === '{') pairs.push([key, parseScope(true)]);
      else assert.ok(value !== '}' && value !== '=', `${file}: invalid value for ${key} (${operator} ${value})`);
      if (operator !== '=' || value !== '{') pairs.push([key, value]);
    }
    if (nested) assert.equal(tokens[i++], '}', `${file}: missing closing brace`);
    return pairs;
  };
  const pairs = parseScope(false);
  assert.equal(i, tokens.length, `${file}: trailing tokens after root scope`);
  return pairs;
}

const sourceByPath = new Map();
const parsedByPath = new Map();
for (const file of files) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');
  const bytes = fs.readFileSync(file);
  assert.ok(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), `${rel}: Clausewitz .txt scripts must not have a UTF-8 BOM`);
  const pairs = parse(source, rel);
  sourceByPath.set(rel, source);
  parsedByPath.set(rel, pairs);
  if (rel === 'common/scripted_effects/epoch_core_effects.txt') {
    const invalid = pairs.filter(([, value]) => !Array.isArray(value));
    assert.deepEqual(invalid, [], `${rel}: every scripted effect must be a top-level block`);
    const names = pairs.map(([name]) => name);
    assert.equal(new Set(names).size, names.length, `${rel}: duplicate scripted-effect definition`);
  }
}

// Clausewitz else branches must immediately follow their if/else_if sibling in
// the same scope. The generic lexer catches braces, but not this engine rule.
function checkElsePairs(pairs, file, scope = 'root') {
  let previous = null;
  for (const [key, value] of pairs) {
    if (key === 'else' || key === 'else_if') {
      assert.ok(previous === 'if' || previous === 'else_if', `${file}:${scope}: ${key} must immediately follow if/else_if in the same scope`);
    }
    if (Array.isArray(value)) checkElsePairs(value, file, `${scope}/${key}`);
    previous = key;
  }
}
for (const [rel, pairs] of parsedByPath) checkElsePairs(pairs, rel);

const get = (pairs, key) => pairs.find(([name]) => name === key)?.[1];
const effectDefs = new Map(parsedByPath.get('common/scripted_effects/epoch_core_effects.txt'));
function countPairs(pairs, key) { return pairs.filter(([name]) => name === key).length; }
function countDeep(pairs,key) { return pairs.reduce((n,[name,value]) => n + (name === key ? 1 : 0) + (Array.isArray(value) ? countDeep(value,key) : 0),0); }
function hasDeep(pairs,key) { return countDeep(pairs,key) > 0; }

const eventTypes = new Set(['event','country_event','situation_event','ship_event','fleet_event']);
const effectKeys = new Set(['add_resource','add_modifier','remove_modifier','add_deposit','remove_deposit','add_planet_devastation','set_country_flag','remove_country_flag','set_planet_flag','remove_planet_flag','change_variable','set_variable','set_situation_approach','country_event','situation_event','enable_special_project','create_fleet','create_ship','destroy_situation','hidden_effect']);
const countryEffectKeys = new Set(['add_resource','set_country_flag','remove_country_flag','set_variable','change_variable','country_event']);
function validateEventOptions(roots, rel) {
  function visit(pairs, context) {
    for (const [key, value] of pairs) {
      if (context.eventRoot && context.visible && (effectKeys.has(key) || ['if','else_if','else','random','random_list'].includes(key))) {
        assert.fail(`${rel}:${context.eventId}: event-level effect ${key} must be inside immediate or an option`);
      }
      if (key === 'add_resource') {
        assert.ok(context.option || !context.visible || context.immediate, `${rel}:${context.eventId}: visible-event add_resource outside option`);
        assert.ok(!context.trigger, `${rel}:${context.eventId}: add_resource inside trigger/limit`);
        if (context.eventType === 'situation_event') assert.ok(context.countryScope, `${rel}:${context.eventId}: situation-event resources must execute in owner scope`);
      }
      if (key === 'ai_chance') assert.ok(context.option, `${rel}:${context.eventId}: ai_chance outside option`);
      if (key === 'set_situation_approach') {
        assert.ok(context.situationScope, `${rel}:${context.eventId}: set_situation_approach requires situation scope`);
        assert.ok(!context.countryScope, `${rel}:${context.eventId}: set_situation_approach must not be nested in owner/country scope`);
      }
      if (context.eventType === 'situation_event' && countryEffectKeys.has(key)) {
        assert.ok(context.countryScope, `${rel}:${context.eventId}: ${key} requires owner/country scope in situation events`);
      }
      if (context.trigger && effectKeys.has(key)) assert.fail(`${rel}:${context.eventId}: effect ${key} is nested in trigger/limit`);
      if (!Array.isArray(value)) continue;
      if (key === 'option') {
        const names = value.filter(([child]) => child === 'name');
        assert.equal(names.length, 1, `${rel}:${context.eventId}: every event option needs exactly one name`);
        assert.equal(typeof names[0]?.[1], 'string', `${rel}:${context.eventId}: option name must be a key`);
        assert.ok(names[0][1].length > 0, `${rel}:${context.eventId}: option name may not be empty`);
        assert.ok(countPairs(value, 'hidden_effect') <= 1, `${rel}:${context.eventId}.${names[0][1]}: duplicate hidden_effect blocks`);
        assert.ok(countPairs(value, 'ai_chance') <= 1, `${rel}:${context.eventId}.${names[0][1]}: duplicate ai_chance blocks`);
        visit(value, { ...context, option: true, trigger: false, eventRoot: false });
      } else {
        visit(value, {
          ...context,
          trigger: context.trigger || key === 'trigger' || key === 'limit',
          countryScope: context.countryScope || key === 'owner',
          situationScope: context.situationScope || key === 'random_situation',
          immediate: context.immediate || key === 'immediate',
          eventRoot: false,
        });
      }
    }
  }
  for (const [type, body] of roots) {
    if (!eventTypes.has(type) || !Array.isArray(body)) continue;
    const id = get(body, 'id') || '<missing id>';
    const visible = countPairs(body, 'option') > 0 && get(body, 'hide_window') !== 'yes';
    visit(body, { eventType: type, eventId: id, visible, option: false, trigger: false, countryScope: false, situationScope: type === 'situation_event', immediate: false, eventRoot: true });
  }
}
for (const [rel, roots] of parsedByPath) if (rel.startsWith('events/')) validateEventOptions(roots, rel);

const damagedOptionExample = parse(`country_event = { id = epoch_ii.15 option = { name = epoch_ii.15.evacuate } add_resource = { alloys = -100 energy = -200 } }`, 'damaged epoch_ii.15 regression fixture');
assert.throws(() => validateEventOptions(damagedOptionExample, 'damaged epoch_ii.15 regression fixture'), /event-level effect add_resource|add_resource outside option/, 'The damaged epoch_ii.15 resource-after-option example must be rejected');
if (!sourceOnly) {
  const vanillaEventSample = fs.readFileSync(path.join(vanillaRoot,'events/advisor_events.txt'),'utf8');
  assert.match(vanillaEventSample, /option\s*=\s*\{\s*name\s*=\s*advisor\.1\.c[\s\S]{0,500}hidden_effect\s*=\s*\{\s*add_resource\s*=\s*\{\s*minerals\s*=\s*2\s*\}/, 'Installed Vanilla event advisor.1.c demonstrates effect fields nested under the option block');
}

for (const name of ['epoch_core_apply_contamination_active','epoch_core_apply_contamination_worsened','epoch_core_apply_contamination_studied','epoch_ii_set_site_latent','epoch_ii_set_site_active','epoch_ii_set_site_unstable','epoch_ii_set_site_controlled']) {
  const body = effectDefs.get(name);
  assert.ok(body, `Missing feature setter ${name}`);
  assert.equal(countDeep(body,'add_deposit'),1,`${name}: one contamination feature deposit per state`);
  assert.ok(hasDeep(body,'epoch_core_remove_contamination_effects') || hasDeep(body,'remove_deposit'), `${name}: prior contamination state must be cleared first`);
}
for (const name of ['epoch_core_set_resonance_scar','epoch_core_set_resonance_scar_altered','epoch_core_set_resonance_scar_healed']) {
  const body = effectDefs.get(name);
  assert.ok(body, `Missing scar setter ${name}`);
  assert.equal(countDeep(body,'add_deposit'),1,`${name}: one scar feature deposit per state`);
  assert.equal(countDeep(body,'epoch_core_clear_resonance_scar'),1,`${name}: prior scar state must be cleared first`);
}
const clearState = effectDefs.get('epoch_ii_clear_site_state');
const contaminationManager = effectDefs.get('epoch_core_clear_contamination_deposits');
assert.equal(countPairs(contaminationManager,'remove_deposit'),8,'Shared contamination manager removes every contamination variant');
assert.deepEqual(clearState.filter(([k])=>k==='remove_deposit'),contaminationManager,'Flattened state clear preserves every contamination removal and its order');
assert.equal(countPairs(clearState,'remove_modifier'),4,'Phase II state clear removes the four legacy modifiers once');
const featurePairs = parsedByPath.get('common/deposits/epoch_phase_ii_features.txt');
const featureNames = featurePairs.map(([name]) => name);
const featureBodies = new Map(featurePairs);
const expectedFeatures = [
  'd_epoch_resonance_contamination_active','d_epoch_resonance_contamination_worsened',
  'd_epoch_resonance_contamination_studied','d_epoch_resonance_contamination_contained',
  'd_epoch_resonance_contamination_latent','d_epoch_resonance_contamination_resonant',
  'd_epoch_resonance_contamination_unstable','d_epoch_resonance_contamination_controlled',
  'd_epoch_resonance_scar','d_epoch_resonance_scar_altered','d_epoch_resonance_scar_healed',
  'd_epoch_silent_structure_unsecured','d_epoch_silent_structure_secured','d_epoch_silent_structure_investigated','d_epoch_silent_structure_destroyed'
];
assert.deepEqual([...featureNames].sort(), [...expectedFeatures].sort(), 'Only declared state variants of the three logical EPOCH feature families may exist');
for (const name of featureNames) {
  const body = featureBodies.get(name);
  assert.equal(get(body, 'category'), 'deposit_cat_rare', `${name}: expected the non-clearable Planetary Feature category`);
  assert.ok(get(body, 'is_for_colonizable') === 'yes', `${name}: feature must be valid on colonizable planets`);
  assert.ok(get(body, 'icon'), `${name}: feature needs a deposit icon`);
  assert.ok(get(body, 'drop_weight'), `${name}: event-added feature must not spawn naturally`);
  assert.ok(!['all_blocker_swap_types','blocker_swap_types','resources','can_be_cleared','on_cleared','time'].some(k => get(body,k) !== undefined), `${name}: no random swap or player-clear behavior is configured`);
  if (name.includes('contamination_active') || name.includes('contamination_worsened') || name.includes('contamination_studied') || name.includes('contamination_latent') || name.includes('contamination_resonant') || name.includes('contamination_unstable') || name.includes('contamination_controlled') || name === 'd_epoch_resonance_scar' || name === 'd_epoch_resonance_scar_altered' || name.startsWith('d_epoch_silent_structure_')) {
    assert.ok(get(body,'triggered_planet_modifier') || get(body,'planet_modifier'), `${name}: economic effects must be on the feature`);
  }
}

const allSource = [...sourceByPath.values()].join('\n');
const refs = new Set([...allSource.matchAll(/\b(?:add_deposit|remove_deposit|has_deposit)\s*=\s*(d_[A-Za-z0-9_]+)/g)].map(m => m[1]));
const deposits = new Set();
for (const [rel,pairs] of parsedByPath) if (rel.startsWith('common/deposits/')) for (const [name] of pairs) if (name.startsWith('d_')) deposits.add(name);
assert.deepEqual([...refs].filter(name => !deposits.has(name)), [], 'All referenced EPOCH deposits must have definitions');
if (!sourceOnly) {
  const eventSprites = fs.readFileSync(path.join(vanillaRoot,'interface/eventpictures.gfx'),'utf8');
  const referencedEventSprites = new Set([...allSource.matchAll(/\b(GFX_evt_[A-Za-z0-9_]+)/g)].map(m => m[1]));
  for (const sprite of referencedEventSprites) assert.ok(eventSprites.includes(`name = "${sprite}"`), `Vanilla event picture sprite is missing: ${sprite}`);
}

// Immediate option resources must be visible to the event UI. Any resource
// that remains below hidden_effect must sit in a conditional branch.
const conditionalKeys = new Set(['if','else','else_if','random','random_list']);
let hiddenResourceChecks = 0;
function checkOptionResources(pairs, inOption = false, inHidden = false, conditional = false, context = '') {
  for (const [key, value] of pairs) {
    const option = key === 'option';
    const hidden = key === 'hidden_effect';
    const nextOption = inOption || option;
    const nextHidden = inHidden || hidden;
    const nextConditional = conditional || conditionalKeys.has(key);
    if (key === 'add_resource' && nextOption && nextHidden) {
      hiddenResourceChecks++;
      assert.ok(nextConditional, `${context}: unconditional option resource remains hidden`);
    }
    if (Array.isArray(value)) checkOptionResources(value, nextOption, nextHidden, nextConditional, context || (option ? 'event option' : ''));
  }
}
for (const [rel, pairs] of parsedByPath) if (rel.startsWith('events/')) checkOptionResources(pairs, false, false, false, rel);
// Hidden guarded execution is allowed only with an equal display-only resource
// preview. Compare the amounts rather than demanding one particular layout.
function resourcePreviews(b, hidden=false, preview=false, result={actual:[],shown:[]}) {
  for(const [k,v] of b) {
    if(k==='add_resource'&&(hidden||preview))result[preview?'shown':'actual'].push(JSON.stringify(v));
    if(Array.isArray(v))resourcePreviews(v,hidden||k==='hidden_effect',preview||k==='tooltip',result);
  }
  return result;
}
for(const [rel,pairs]of parsedByPath)if(rel.startsWith('events/'))for(const [,event]of pairs)if(Array.isArray(event))for(const [k,b]of event)if(k==='option'){
  const r=resourcePreviews(b);
  for(const v of r.actual)assert.ok(r.shown.includes(v),`${rel}: hidden resource must have an equal native preview`);
}

const englishLoc = fs.readFileSync(path.join(root,'localisation/english/epoch_core_l_english.yml'),'utf8').replace(/^\uFEFF/,'');
const germanLoc = fs.readFileSync(path.join(root,'localisation/german/epoch_core_l_german.yml'),'utf8').replace(/^\uFEFF/,'');
for (const rel of ['localisation/english/epoch_core_l_english.yml','localisation/german/epoch_core_l_german.yml']) {
  const bytes = fs.readFileSync(path.join(root, rel));
  assert.ok(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf, `${rel}: Stellaris localization must retain UTF-8 BOM`);
}
const optionNames = new Set();
function collectOptionNames(pairs) {
  for (const [key,value] of pairs) {
    if (key === 'option' && Array.isArray(value)) { const name = get(value,'name'); if (typeof name === 'string') optionNames.add(name); }
    if (Array.isArray(value)) collectOptionNames(value);
  }
}
for (const [rel,pairs] of parsedByPath) if (rel.startsWith('events/')) collectOptionNames(pairs);
for (const name of expectedFeatures) for (const key of [name, `${name}_desc`]) {
  assert.match(englishLoc, new RegExp(`^\\s*${key}:\\d+\\s`, 'm'), `English localization missing ${key}`);
  assert.match(germanLoc, new RegExp(`^\\s*${key}:\\d+\\s`, 'm'), `German localization missing ${key}`);
}
for (const [label, localization] of [['English',englishLoc],['German',germanLoc]]) for (const line of localization.split(/\r?\n/)) {
  const key = line.match(/^\s*([^\s:]+):\d+\s/is)?.[1];
  if (optionNames.has(key)) assert.doesNotMatch(line, /\([^)]*(?:Energy|Alloys|Minerals|Food|Unity|Physics|Society|Engineering|Energie|Legierungen|Mineralien|Nahrung|Einigkeit|Physik|Gesellschaft|Ingenieur|Stabilität)[^)]*\)/i, `${label} option ${key} must not use manual parenthetical resource or stability costs`);
}

for (const rel of ['common/situations/epoch_core_situations.txt','common/situations/epoch_phase_ii_situations.txt']) {
  const roots = parsedByPath.get(rel);
  for (const [, situation] of roots) {
    const stages = get(situation, 'stages');
    if (!stages) continue;
    for (const [stage, body] of stages) {
      const key = get(body,'custom_tooltip');
      assert.ok(key, `${rel}:${stage}: visible stage text uses Vanilla custom_tooltip localization`);
      assert.match(englishLoc, new RegExp(`^\\s*${stage}:\\d+\\s`, 'm'), `English raw stage name missing ${stage}`);
      assert.match(germanLoc, new RegExp(`^\\s*${stage}:\\d+\\s`, 'm'), `German raw stage name missing ${stage}`);
      assert.match(englishLoc, new RegExp(`^\\s*${key}:\\d+\\s`, 'm'), `English stage tooltip missing ${key}`);
      assert.match(germanLoc, new RegExp(`^\\s*${key}:\\d+\\s`, 'm'), `German stage tooltip missing ${key}`);
    }
  }
}
for (const key of ['epoch_resonance_protocol','epoch_resonance_protocol_type','epoch_resonance_protocol_monthly_change_tooltip','epoch_resonance_protocol_desc']) {
  assert.match(englishLoc, new RegExp(`^\\s*${key}:\\d+\\s`, 'm'), `English situation localization missing ${key}`);
  assert.match(germanLoc, new RegExp(`^\\s*${key}:\\d+\\s`, 'm'), `German situation localization missing ${key}`);
}

if (!sourceOnly) {
  const vanillaBlockers = parse(fs.readFileSync(path.join(vanillaRoot,'common/deposits/01_blocker_deposits.txt'),'utf8'),'Vanilla 4.5.3 blocker deposits');
  const vanillaCategories = parse(fs.readFileSync(path.join(vanillaRoot,'common/deposit_categories/00_deposit_categories.txt'),'utf8'),'Vanilla 4.5.3 deposit categories');
  const blockerCategory = get(vanillaCategories,'deposit_cat_blockers');
  assert.equal(get(blockerCategory,'blocker'),'yes','Vanilla category must mark deposit_cat_blockers as a Blocker category');
  assert.ok(vanillaBlockers.some(([,body]) => Array.isArray(body) && get(body,'category') === 'deposit_cat_blockers' && get(body,'triggered_planet_modifier')), 'Installed Vanilla must demonstrate triggered_planet_modifier in the requested blocker category');
  const vanillaGraphics = fs.readFileSync(path.join(vanillaRoot,'common/graphical_culture/00_graphical_culture.txt'),'utf8');
  assert.match(vanillaGraphics, /(?:^|\n)\s*fallen_machine_empire_01\s*=\s*\{/,'Installed Vanilla must define the selected Nullwarden graphical culture');
  const vanillaComponents = fs.readFileSync(path.join(vanillaRoot,'common/component_templates/00_utilities_roles.txt'),'utf8');
  assert.ok(vanillaComponents.includes('key = "COMBAT_COMPUTER_LINE_DEFAULT"'),'Installed Vanilla must define the selected Nullwarden combat computer');
  const vanillaBuildingDoc = fs.readFileSync(path.join(vanillaRoot,'common/buildings/00_example.txt'),'utf8');
  assert.match(vanillaBuildingDoc, /#\s*building_sets\s*=\s*\{/,'Installed Vanilla building example must document building_sets');
  assert.match(vanillaBuildingDoc, /#\s*resources\s*=\s*\{[\s\S]*?#\s*category\s*=\s*planet_buildings[\s\S]*?#\s*upkeep\s*=\s*\{[\s\S]*?#\s*cost\s*=\s*\{/,'Installed Vanilla building example must place cost/upkeep under resources');
}

console.log(`PASS: ${files.length} Clausewitz files parsed; event option scopes, feature states, mod references, visible option resources, and stage/feature DE/EN keys validated${sourceOnly ? '; native Vanilla evidence explicitly skipped.' : ', including installed Vanilla syntax.'}`);

module.exports = { parse, get, parsedByPath, sourceByPath, countDeep };
