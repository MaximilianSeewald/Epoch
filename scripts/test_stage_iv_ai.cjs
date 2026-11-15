'use strict';

// Interpret the shipped AI guards/effects, not a second implementation of the
// decision. Travel, orders, combat and timed flag expiry are native boundaries.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { parse, get } = require('./test_clausewitz_structure.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const tree = p => parse(read(p).replace(/\b(\w+)\s*(>=|<=|!=|>|<)\s*/g,
  (_, k, op) => `${k}__${{ '>=':'ge', '<=':'le', '!=':'ne', '>':'gt', '<':'lt' }[op]} = `), p);
const triggers = new Map(tree('common/scripted_triggers/epoch_ascension_scripted_triggers.txt'));
const effects = new Map(tree('common/scripted_effects/epoch_ascension_scripted_effects.txt'));
const events = new Map(tree('events/epoch_ascension_events.txt').filter(([, b]) => Array.isArray(b)).map(([, b]) => [get(b, 'id'), b]));
const onActions = new Map(tree('common/on_actions/epoch_ascension_on_actions.txt'));
const obj = id => ({ id, flags:new Set(), fleets:[], ships:[], orders:new Set(), vars:{ epoch_iv_chapter:5 }, power:0, hp:1 });
let targets, countries, checks = 0;
const check = (v, m) => { checks++; assert.ok(v, m); };
const context = o => ({ o, root:o });
const scope = (o, c) => ({ o, root:c.root, prev:c });
function resolve(s, c) {
  if (s.endsWith('.trigger:fleet_power')) return resolve(s.slice(0, -20), c)?.power;
  if (s.startsWith('event_target:')) {
    const [key, suffix] = s.slice(13).split('@');
    // Dynamic target key is a scope, followed optionally by a scope switch.
    const [who, ...rest] = suffix.split('.');
    let result = targets[key + '@' + resolve(who, c)?.id];
    for (const part of rest) result = result?.[part];
    return result;
  }
  const [first, ...rest] = s.split('.');
  let result;
  if (/^(prev)+$/.test(first)) { let p=c; for(let i=0;i<first.length/4;i++) p=p?.prev; result=p?.o; }
  else result = first==='this' ? c.o : first==='root' ? c.root : first==='from' ? c.root.from : c.o?.[first];
  for (const part of rest) result=result?.[part];
  return result;
}
const key = (s,c) => { const [name,who]=s.split('@'); return name+(who?'@'+resolve(who,c)?.id:''); };
const compare = (a,op,b) => ({ eq:a===b, gt:a>b, lt:a<b, ge:a>=b, le:a<=b, ne:a!==b })[op];
function test(b,c) {
  return b.every(([raw,v]) => {
    const [k,op='eq']=raw.split('__');
    if (k==='NOT'||k==='NOR') return !v.some(p=>test([p],c));
    if (k==='OR') return v.some(p=>test([p],c));
    if (k==='AND') return test(v,c);
    // Existing campaign eligibility is covered by test_stage_iv.cjs.
    if (k==='epoch_iv_eligible') return c.o.eligible===(v==='yes');
    if (triggers.has(k)) return test(triggers.get(k),c)===(v==='yes');
    if (k==='exists') return !!resolve(v,c);
    if (/^has_(country|fleet|ship)_flag$/.test(k)) return c.o.flags.has(key(v,c));
    if (k==='is_ai') return c.o.ai===(v==='yes');
    if (k==='is_in_combat') return !!c.o.combat===(v==='yes');
    if (k==='is_fleet_idle') return !!c.o.idle===(v==='yes');
    if (k==='is_country_type') return c.o.type===v;
    if (k==='is_ship_class') return c.o.shipclass===v;
    if (k==='is_owned_by') return c.o.owner===resolve(v,c);
    if (k==='is_same_value') return c.o===resolve(v,c);
    if (k==='can_access_system') return c.o.access.has(resolve(v,c));
    if (k==='has_fleet_order') return c.o.orders.has(v);
    if (k==='fleet_power') return compare(c.o.power,op,Number.isFinite(+v)?+v:resolve(v,c));
    if (k==='has_hp_percentage') return compare(c.o.hp,op,+v);
    if (k==='check_variable') return c.o.vars[get(v,'which')]===+get(v,'value');
    if (k==='any_owned_ship') return c.o.ships.some(o=>test(v,scope(o,c)));
    if (Array.isArray(v)) { const o=resolve(k,c); return !!o&&test(v,scope(o,c)); }
    throw Error('Unmodelled AI trigger '+k);
  });
}
function run(b,c) {
  let taken=false;
  for (const [k,v] of b) {
    if (k==='if'||k==='else_if') {
      if(k==='if') taken=false;
      if(!taken&&test(get(v,'limit'),c)) { run(v.filter(([n])=>n!=='limit'),c); taken=true; }
    } else if(k==='else') { if(!taken) run(v,c); }
    else if(effects.has(k)) run(effects.get(k),c);
    else if(k==='set_country_flag') c.o.flags.add(v);
    else if(k==='remove_country_flag') c.o.flags.delete(v);
    else if(k==='set_timed_country_flag') { c.o.flags.add(get(v,'flag')); c.o.cooldown=+get(v,'days'); }
    else if(k==='save_global_event_target_as') targets[key(v,c)]=c.o;
    else if(k==='clear_global_event_target') delete targets[key(v,c)];
    else if(k==='auto_follow_fleet') { c.o.commands=(c.o.commands||0)+1; c.o.attackTarget=resolve(get(v,'target'),c); c.o.idle=false; }
    else if(k==='random_owned_fleet') { const o=c.o.fleets.find(o=>test(get(v,'limit'),scope(o,c))); if(o) run(v.filter(([n])=>n!=='limit'),scope(o,c)); }
    else if(k==='every_country') { for(const o of countries) if(test(get(v,'limit'),scope(o,c))) run(v.filter(([n])=>n!=='limit'),scope(o,c)); }
    else if(k==='country_event') fire(Number(get(v,'id').split('.')[1]),c.o);
    else if(Array.isArray(v)) { const o=resolve(k,c); assert.ok(o,'effect scope '+k); run(v,scope(o,c)); }
    else throw Error('Unmodelled AI effect '+k);
  }
}
function fire(id,o) { const b=events.get('epoch_iv.'+id), c=context(o); if(test(get(b,'trigger'),c)) run(get(b,'immediate'),c); }
const ordered = c => c.flags.has('epoch_iv_ai_attack_ordered');
function setup() {
  targets={}; countries=['A','B'].map(obj);
  for(const c of countries) {
    c.ai=c.eligible=true; c.flags.add('epoch_iv_started');
    const arena=obj('arena'+c.id), enemy=obj('enemy'+c.id), boss=obj('boss'+c.id), principal=obj('principal'+c.id), fleet=obj('fleet'+c.id);
    enemy.type='epoch_adjudicator'; enemy.flags.add('epoch_iv_judge_identity');
    boss.owner=enemy; boss.solar_system=arena; boss.power=60000; boss.flags.add('epoch_iv_judge');
    principal.flags.add('epoch_iv_principal_for@'+c.id); boss.ships=[principal];
    Object.assign(fleet,{owner:c,shipclass:'shipclass_military',idle:true,power:100000,solar_system:obj('home'+c.id),access:new Set([arena]),ships:[obj('ship'+c.id)]});
    c.fleets=[fleet]; c.boss=boss; c.arena=arena; c.enemy=enemy;
    for(const [k,v] of [['arena',arena],['enemy',enemy],['fleet',boss],['ship',principal]]) targets['epoch_iv_'+k+'@'+c.id]=v;
    targets['epoch_iv_claimant@'+enemy.id]=c;
  }
  return countries;
}
function end(c,label) {
  check(!ordered(c)&&!targets['epoch_iv_ai_fleet@'+c.id],label+': assignment cleared');
  check(c.cooldown===180,label+': six-month cooldown');
  check(!c.flags.has('epoch_iv_protocol_key')&&!c.flags.has('epoch_iv_combat_proven'),label+': no victory');
  fire(82,c); check(!ordered(c),label+': no immediate replacement order');
}
for(const scenario of ['weak','equal','stronger-guardian','floor','unreachable','busy','combat','damaged','missing-system','civilian','human']) {
  const [c]=setup(), f=c.fleets[0];
  if(scenario==='weak') f.power=50000;
  if(scenario==='equal') f.power=c.boss.power;
  if(scenario==='stronger-guardian') c.boss.power=110000;
  if(scenario==='floor') { c.boss.power=1000; f.power=30000; }
  if(scenario==='unreachable') f.access.clear();
  if(scenario==='busy') f.idle=false;
  if(scenario==='combat') f.combat=true;
  if(scenario==='damaged') f.ships[0].hp=0.74;
  if(scenario==='missing-system') delete f.solar_system;
  if(scenario==='civilian') f.shipclass='shipclass_science_ship';
  if(scenario==='human') c.ai=false;
  fire(82,c); check(!ordered(c),scenario+': wait');
}
{
  const [a,b]=setup(); fire(82,a); fire(82,b);
  for(const c of [a,b]) {
    const f=c.fleets[0]; check(ordered(c)&&f.attackTarget===c.boss,'suitable reachable fleet attacks own guardian');
    // Long trips are deliberately unbounded; no monthly reissue or timeout.
    for(let month=0;month<60;month++) { fire(83,c); fire(82,c); }
    check(f.commands===1&&ordered(c),'five years of ongoing approach retained');
    f.combat=true; f.solar_system=c.arena; f.from=c.boss; fire(84,f);
    fire(83,c); fire(82,c); check(ordered(c)&&f.commands===1,'active personal combat retained');
    f.combat=false; f.orders.add('return_fleet_order'); fire(85,f); end(c,'surviving retreat callback');
    f.orders.clear(); f.idle=true; c.flags.delete('epoch_iv_ai_attack_cooldown'); fire(82,c);
    check(ordered(c)&&f.commands===2,'ready survivor can attack again after cooldown');
  }
}
for(const scenario of ['destroyed','transferred','idle','return','repair','evade','transit','battle-ended','legacy-idle','legacy-moving','legacy-combat','orphan-target','optout','complete','chapter','key','missing-guardian','foreign-guardian','foreign-claimant']) {
  const [c,other]=setup(), f=c.fleets[0]; fire(82,c);
  if(scenario==='destroyed') { delete targets['epoch_iv_ai_fleet@A']; c.fleets=[]; }
  if(scenario==='transferred') f.owner=other;
  if(scenario==='idle'||scenario==='legacy-idle') f.idle=true;
  if(['return','repair','evade'].includes(scenario)) f.orders.add({return:'return_fleet_order',repair:'repair_fleet_order',evade:'evade_hostiles_order'}[scenario]);
  if(scenario==='transit') delete f.solar_system;
  if(scenario==='battle-ended') c.flags.add('epoch_iv_ai_attack_engaged');
  if(scenario==='legacy-combat') { f.combat=true; f.solar_system=c.arena; }
  if(scenario==='orphan-target') c.flags.delete('epoch_iv_ai_attack_ordered');
  if(scenario==='optout') c.eligible=false;
  if(scenario==='complete') c.flags.add('epoch_iv_complete');
  if(scenario==='chapter') c.vars.epoch_iv_chapter=4;
  if(scenario==='key') c.flags.add('epoch_iv_combat_proven');
  if(scenario==='missing-guardian') delete targets['epoch_iv_ship@A'];
  if(scenario==='foreign-guardian') targets['epoch_iv_fleet@A']=other.boss;
  if(scenario==='foreign-claimant') targets['epoch_iv_claimant@'+c.enemy.id]=other;
  fire(83,c);
  if(['transit','legacy-moving','legacy-combat'].includes(scenario)) check(ordered(c),'retain '+scenario+' without reissuing');
  else if(scenario==='key') check(!ordered(c),'proven victory stops tracking');
  else end(c,scenario);
  check(!ordered(other)&&!other.flags.has('epoch_iv_protocol_key'),'other claimant isolated: '+scenario);
}
{
  const [c]=setup(), old=c.fleets[0]; fire(82,c);
  const replacement={...old,id:'replacement',commands:0,idle:true}; c.fleets=[replacement];
  delete targets['epoch_iv_ai_fleet@A']; fire(83,c); end(c,'saved fleet lost after merge/replacement');
  c.flags.delete('epoch_iv_ai_attack_cooldown'); fire(82,c);
  check(targets['epoch_iv_ai_fleet@A']===replacement&&replacement.commands===1,'replacement selected only after cooldown');
}
{
  const [c]=setup(), f=c.fleets[0]; fire(82,c);
  f.from=obj('unrelated'); fire(84,f); fire(85,f);
  check(ordered(c)&&!c.flags.has('epoch_iv_ai_attack_engaged'),'unrelated skirmish does not end approach');
  // Legacy battle exits before the first monthly reconciliation.
  f.solar_system=c.arena; fire(85,f); end(c,'legacy personal battle exit');
}
{
  const [c]=setup(); c.flags.add('epoch_iv_ai_attack_engaged'); c.eligible=false;
  run([get(events.get('epoch_iv.1'),'immediate')[0]],context(obj('pulse')));
  check(!c.flags.has('epoch_iv_ai_attack_engaged'),'monthly reconciliation clears orphan state even after opt-out');
}
for(const target of ['arena','fleet','ship','enemy']) {
  const [c]=setup(); delete targets['epoch_iv_'+target+'@A']; fire(82,c);
  check(!ordered(c)&&!c.flags.has('epoch_iv_protocol_key'),'missing '+target+' fails closed');
}
{
  const [c,other]=setup(); targets['epoch_iv_fleet@A']=other.boss; fire(82,c);
  check(!ordered(c)&&!c.flags.has('epoch_iv_protocol_key'),'foreign guardian cannot be selected or unlock research');
  const pulse=get(events.get('epoch_iv.1'),'immediate');
  check(JSON.stringify(pulse[0]).includes('epoch_iv.83'),'monthly cleanup runs before eligible-country dispatch');
  check(JSON.stringify(get(effects.get('epoch_iv_restore_judge'),'if')).includes('epoch_iv_ai_end_attack'),'recovery clears full AI assignment');
}
for(const [hook,id] of [['on_fleet_combat_joined_attacker',84],['on_fleet_combat_joined_defender',84],['on_fleet_exit_battle',85]])
  check(JSON.stringify(get(onActions.get(hook),'events')).includes('epoch_iv.'+id),'wired Vanilla callback '+hook);
// Victory validator/death callback remain independently covered by test_stage_iv.
for(const id of [82,83,84,85]) check(!/add_research_option|epoch_iv_finish|set_country_flag","epoch_iv_(?:protocol_key|combat_proven)/.test(JSON.stringify(events.get('epoch_iv.'+id))),'AI event never grants victory: '+id);
// Freeze only the existing victory boundary, not unrelated future gameplay.
// Parsed original main 4ce4518; no Git history is required in CI fixtures.
const hash = b => require('node:crypto').createHash('sha256').update(JSON.stringify(b)).digest('hex');
check(hash(events.get('epoch_iv.50'))==='7577436cb92aba92debf908165d7bfafd8b676acf8d346dc7eefb952e6e93a46','principal-death callback unchanged');
check(hash(triggers.get('epoch_iv_valid_military_death'))==='1805b48b40b2e06683e57d8d3add9dc1b2be0939d617d0c067871d0ae334140c','personal victory validator unchanged');
if(process.argv.includes('--native-evidence')) {
  const vanilla=process.env.EPOCH_VANILLA_ROOT||'G:/Steam/steamapps/common/Stellaris';
  const native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
  const bytes=fs.readFileSync(path.join(vanilla,'common/on_actions/00_on_actions.txt'));
  const manifest=JSON.parse(read('docs/research/stage-iii-source-manifest-2026-11-08.json'));
  const targetHash=manifest.sources.find(s=>s.path==='INSTALL/common/on_actions/00_on_actions.txt').sha256;
  check(manifest.steamBuild==='26325427','archived callback evidence targets requested build');
  check(require('node:crypto').createHash('sha256').update(bytes).digest('hex')===targetHash,'installed callbacks exactly match archived 4.5.3/26325427 SHA-256');
  const actions=new Map(parse(bytes.toString('utf8')));
  for(const hook of ['on_fleet_combat_joined_attacker','on_fleet_combat_joined_defender','on_fleet_exit_battle']) check(actions.has(hook),'target-build native callback '+hook);
  check(native('events/aquatics_events.txt').includes('fleet_power > from.starbase.fleet.trigger:fleet_power'),'installed Vanilla direct numerical fleet-power reference');
  check(native('events/utopia_shroud_events.txt').includes('is_fleet_idle = yes'),'installed Vanilla idle-fleet predicate');
  const docRoot=process.env.EPOCH_SCRIPT_DOCUMENTATION||path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation');
  const docs=fs.readFileSync(path.join(docRoot,'triggers.log'),'utf8');
  for(const name of ['is_fleet_idle','has_fleet_order','can_access_system','has_hp_percentage']) check(docs.includes(name+' -'),'installed generated trigger docs: '+name);
  console.log(`Native evidence only: installed ${JSON.parse(native('launcher-settings.json')).version}; callback file matches target build. Other installed files do not establish an exact target-build runtime test.`);
}
console.log(`PASS: ${checks} Stage-IV AI parsed-script regression checks. Static model only; no engine travel/combat/save-load execution.`);
