// Targeted parsed-script regression. This models guards and state transitions,
// not the engine's travel, archaeology rolls, combat, AI, save files or network.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { parse, get, parsedByPath } = require('./test_clausewitz_structure.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const parseFile = p => parse(read(p).replace(/\b(\w+)\s*(>=|<=|!=|>|<)\s*/g,
  (_, k, op) => `${k}__${{'>=':'ge','<=':'le','!=':'ne','>':'gt','<':'lt'}[op]} = `), p);
const file = folder => `common/${folder}/epoch_ascension_${folder}.txt`;
const triggers = new Map([...parseFile(file('scripted_triggers')), ...parseFile('common/scripted_triggers/epoch_convergence_triggers.txt')]);
const effects = new Map([...parseFile(file('scripted_effects')), ...parseFile('common/scripted_effects/epoch_core_effects.txt')]);
const events = new Map(parseFile('events/epoch_ascension_events.txt').filter(([,v])=>Array.isArray(v)).map(([,b])=>[get(b,'id'),b]));
const E = id => events.get('epoch_iv.'+id);
let checks = 0;
const check = (v,m) => { checks++; assert.ok(v,m); };
const make = id => ({ id, type:'default', flags:new Set(), vars:{}, deposits:new Set(), modifiers:new Set(), situations:[], calls:[], projects:new Set(), planets:[], ships:[] });
let countries, targets, globalFlags;
const scope = (obj,c) => ({obj,prev:c,root:c.root});
const context = obj => ({obj,root:obj});
function resolve(name,c) {
  if(name.startsWith('event_target:')) { const [key,sub] = name.slice(13).split('@'); return targets[key+(sub?'@'+resolve(sub,c)?.id:'')]; }
  const [base,...rest] = name.split('.');
  let obj = base==='this'?c.obj:base==='root'?c.root:base==='from'?c.root.from:base==='fromfrom'?c.root.fromfrom:base==='fromfromfrom'?c.root.fromfromfrom:
    /^prev+$/.test(base)?undefined:c.obj?.[base];
  if (/^(prev)+$/.test(base)) { let p=c; for(let n=0;n<base.length/4;n++)p=p?.prev; obj=p?.obj; }
  for(const part of rest) obj=obj?.[part];
  return obj;
}
const flagKey = (s,c) => { const [key,sub]=s.split('@'); return key+(sub?'@'+resolve(sub,c)?.id:''); };
const cmp = (a,op,b) => ({eq:a===b,ge:a>=b,le:a<=b,gt:a>b,lt:a<b,ne:a!==b})[op];
function test(b,c) {
  return b.every(([raw,v])=>{
    const [k,op='eq']=raw.split('__');
    if(k==='NOT'||k==='NOR')return !v.some(p=>test([p],c));
    if(k==='OR')return v.some(p=>test([p],c));
    if(k==='AND')return test(v,c);
    if(triggers.has(k))return test(triggers.get(k),c)===(v==='yes');
    if(k==='exists')return !!resolve(v,c);
    if(k==='always')return v==='yes';
    if(k==='has_global_flag')return globalFlags.has(v);
    if(/has_(country|planet|ship|fleet|star)_flag/.test(k))return c.obj.flags.has(flagKey(v,c));
    if(k==='has_deposit')return c.obj.deposits.has(v);
    if(k==='has_modifier')return c.obj.modifiers.has(v);
    if(k==='has_special_project')return c.obj.projects.has(v);
    if(k==='has_event_chain')return !!c.obj.chain;
    if(k==='is_country_type'||k==='is_situation_type')return c.obj.type===v;
    if(k==='is_same_value')return c.obj===resolve(v,c);
    if(k==='is_owned_by')return c.obj.owner===resolve(v,c);
    if(k==='is_colony')return !!c.obj.colony===(v==='yes');
    if(k==='check_variable') { const [key,value]=v.find(([x])=>x.startsWith('value')); return cmp(c.obj.vars[get(v,'which')]||0,key.split('__')[1]||'eq',+value); }
    if(k==='any_country')return countries.some(o=>test(v,scope(o,c)));
    if(k==='any_owned_planet')return c.obj.planets.some(o=>test(v,scope(o,c)));
    if(Array.isArray(v)) { const obj=resolve(k,c); return !!obj&&test(v,scope(obj,c)); }
    throw Error('Unsupported test trigger '+k);
  });
}
function run(b,c) {
  let branch=false;
  for(const [k,v]of b) {
    if(k==='if'||k==='else_if') { const take=(k==='if'||!branch)&&test(get(v,'limit'),c); if(k==='if')branch=false; if(take){run(v.filter(([n])=>n!=='limit'),c);branch=true;} continue; }
    if(k==='else'){if(!branch)run(v,c);continue;}
    if(effects.has(k)){run(effects.get(k),c);continue;}
    if(/^set_(country|planet|ship)_flag$/.test(k)){c.obj.flags.add(flagKey(v,c));continue;}
    if(/^remove_(country|planet|ship)_flag$/.test(k)){c.obj.flags.delete(flagKey(v,c));continue;}
    if(k==='set_variable'){c.obj.vars[get(v,'which')]=+get(v,'value');continue;}
    if(k==='change_variable'){c.obj.vars[get(v,'which')]=(c.obj.vars[get(v,'which')]||0)+Number(get(v,'value'));continue;}
    if(k==='add_deposit'){c.obj.deposits.add(v);continue;}
    if(k==='remove_deposit'){c.obj.deposits.delete(v);continue;}
    if(k==='remove_modifier'){c.obj.modifiers.delete(v);continue;}
    if(k==='add_modifier'){c.obj.modifiers.add(get(v,'modifier'));continue;}
    if(k==='country_event'){c.obj.calls.push(get(v,'id'));continue;}
    if(k==='every_situation'){for(const o of [...c.obj.situations])if(test(get(v,'limit'),scope(o,c)))run(v.filter(([n])=>n!=='limit'),scope(o,c));continue;}
    if(k==='add_situation_progress'){c.obj.progress+=Number(v);continue;}
    if(k==='destroy_situation'){c.obj.owner.situations=c.obj.owner.situations.filter(o=>o!==c.obj);continue;}
    if(k==='end_event_chain'){c.obj.chain=false;continue;}
    if(Array.isArray(v)){const obj=resolve(k,c);assert.ok(obj,'effect target '+k);run(v,scope(obj,c));continue;}
    throw Error('Unsupported test effect '+k);
  }
}
const qualification=['epoch_res_schema_v1','epoch_res_complete','epoch_res_final_choice_v1','epoch_res_stage_iii_ready','epoch_core_phase_ii_ready'];
function setup() {
  const a=make('A'), b=make('B'), enemy=make('EA'), enemyB=make('EB');
  for(const country of [a,b]){qualification.forEach(f=>country.flags.add(f));country.flags.add('epoch_iv_started');country.vars.epoch_iv_chapter=5;}
  enemy.type=enemyB.type='epoch_adjudicator';enemy.flags.add('epoch_iv_judge_identity');enemyB.flags.add('epoch_iv_judge_identity');
  const ship=make('SA'), shipB=make('SB'), ally=make('ally'), attacker=make('attack');
  ship.flags.add('epoch_iv_principal');shipB.flags.add('epoch_iv_principal');
  a.flags.add('epoch_iv_judge_created');b.flags.add('epoch_iv_judge_created');
  enemy.from=ally;enemy.fromfrom=ship;enemy.fromfromfrom=attacker;
  targets={'epoch_iv_claimant@EA':a,'epoch_iv_claimant@EB':b,'epoch_iv_principal@EA':ship,'epoch_iv_principal@EB':shipB};
  countries=[a,b,enemy,enemyB];globalFlags=new Set(['epoch_iii_first_repulsed']);
  for(const owner of [a,b])owner.situations=[{...make('s'+owner.id),owner,type:'epoch_iv_ascension',progress:64}];
  return {a,b,enemy,ship,shipB,ally,attacker};
}
for(const missing of qualification) {
  const {a}=setup();a.flags.delete(missing);
  check(!test(triggers.get('epoch_iv_eligible'),context(a)),'missing personal prerequisite '+missing);
}
for(const refused of ['epoch_core_campaign_opted_out','epoch_res_final_choice_pending','epoch_res_legacy_incompatible']){
  const {a}=setup();a.flags.add(refused);check(!test(triggers.get('epoch_iv_eligible'),context(a)),refused+' fails closed');
}
{const {a}=setup();globalFlags.clear();check(!test(triggers.get('epoch_iv_eligible'),context(a)),'no global victory');}
for(const scenario of ['valid','foreign-kill','missing-attacker','missing-ship','missing-claimant','wrong-principal','cleanup','duplicate','owner-optout','other-boss']) {
  const {a,b,enemy,ship,shipB}=setup();
  if(scenario==='missing-attacker')delete enemy.fromfromfrom;
  if(scenario==='missing-ship')delete enemy.fromfrom;
  if(scenario==='missing-claimant')delete targets['epoch_iv_claimant@EA'];
  if(scenario==='wrong-principal'||scenario==='other-boss')enemy.fromfrom=shipB;
  if(scenario==='cleanup')enemy.from=enemy;
  if(scenario==='duplicate')ship.flags.add('epoch_iv_death_recorded');
  if(scenario==='owner-optout')a.flags.add('epoch_core_campaign_opted_out');
  const valid=test(get(E(50),'trigger'),context(enemy));
  check(valid===['valid','foreign-kill'].includes(scenario),'authenticated death: '+scenario);
  if(valid){run(get(E(50),'immediate'),context(enemy));check(a.flags.has('epoch_iv_protocol_key')&&!b.flags.has('epoch_iv_protocol_key'),'only claimant rewarded');check(a.vars.epoch_iv_chapter===6,'milestone advanced');check(!test(get(E(50),'trigger'),context(enemy)),'death idempotent');}
  check(!b.flags.has('epoch_iv_protocol_key'),'foreign key untouched: '+scenario);
}
// Positive conversion: each pre-existing state is an input, not a fresh feature.
const families=[
 ['contamination',['active','worsened','studied','contained','latent','resonant','unstable','controlled'].map(s=>'d_epoch_resonance_contamination_'+s),'d_epoch_iv_matrix'],
 ['scar',['d_epoch_resonance_scar','d_epoch_resonance_scar_altered','d_epoch_resonance_scar_healed'],'d_epoch_iv_fold'],
 ['structure',['unsecured','secured','investigated'].map(s=>'d_epoch_silent_structure_'+s),'d_epoch_iv_archive']
];
for(const [family,states,result]of families)for(const old of states){
  const {a,b}=setup();a.vars.epoch_iv_chapter=3;
  const planet=make('physical'),world=make('colony');world.colony=true;world.planet=planet;planet.planet=planet;world.owner=planet.owner=a;
  world.deposits.add(old);world.deposits.add('unrelated');world.flags.add('epoch_iv_stabilized@A');
  world.flags.add('epoch_iv_diagnosed_'+family+'@A');
  world.modifiers.add('epoch_iii_pressure_unprepared');world.modifiers.add('epoch_res_permanent_damage');
  check(test(triggers.get('epoch_iv_safe_world'),context(world)),'safe historical '+old);
  run(effects.get('epoch_iv_convert_world'),context(world));
  check(world.deposits.has(result)&&!states.some(d=>world.deposits.has(d)),'one positive family '+old);
  check(world.deposits.has('unrelated')&&world.modifiers.has('epoch_iii_pressure_unprepared')&&world.modifiers.has('epoch_res_permanent_damage'),'unrelated objects preserved');
  check(a.flags.has('epoch_iv_healing_done')&&!b.flags.has('epoch_iv_healing_done'),'conversion personal progression');
  check(a.vars.epoch_iv_chapter===4,'healing milestone once');
  run(effects.get('epoch_iv_convert_world'),context(world));check(a.vars.epoch_iv_chapter===4,'repeat conversion does not advance');
}
for(const protectedScope of ['colony','physical']){
  const {a,b}=setup();const world=make('world'),planet=make('planet');world.owner=a;world.planet=planet;planet.planet=planet;world.colony=true;
  world.deposits.add('d_epoch_resonance_scar');b.flags.add('epoch_res_active');targets['epoch_ii_target_planet@B']=protectedScope==='colony'?world:planet;
  check(!test(triggers.get('epoch_iv_safe_world'),context(world)),'foreign live '+protectedScope+' mission protected');
}
{const {a}=setup();const w=make('ruins');w.owner=a;w.colony=true;w.deposits.add('d_epoch_silent_structure_destroyed');check(!test(triggers.get('epoch_iv_safe_world'),context(w)),'destroyed structure never resurrected');}
for(const [id,key,flag,ch]of [[101,'signal_a','signal_a_done',1],[102,'signal_b','signal_b_done',1],[103,'work','recovery_done',3],[104,'work','prototype_done',4],[105,'work','counter_done',5]])for(const bad of ['none','stale','foreign','wrong-system','duplicate']){
  const {a,b}=setup(),ship=make('science'),target=make('target'),other=make('other'),system=make('system');
  ship.owner=a;ship.solar_system=target.solar_system=system;ship.fromfrom=target;a.vars.epoch_iv_chapter=ch;
  for(const f of ['recovery','prototype','counter'])a.flags.add('epoch_iv_'+f+'_funded');targets['epoch_iv_'+key+'@A']=target;
  if(bad==='stale')targets['epoch_iv_'+key+'@A']=other;
  if(bad==='foreign')ship.owner=b;
  if(bad==='wrong-system')ship.solar_system=other;
  if(bad==='duplicate')a.flags.add('epoch_iv_'+flag);
  check(test(get(E(id),'trigger'),context(ship))===(bad==='none'),'project '+id+' rejects '+bad);
}
const allNew=[...parsedByPath].filter(([p])=>p.includes('ascension'));
for(const [,option]of E(80).filter(([k])=>k==='option')) {
  if(get(option,'trigger'))check(JSON.stringify(get(get(option,'if'),'limit'))===JSON.stringify(get(option,'trigger')),'operations action rechecks stale-window requirements');
}
{const {a}=setup();const w=make('changed-family');w.owner=a;w.colony=true;w.flags.add('epoch_iv_stabilized@A');w.flags.add('epoch_iv_diagnosed_contamination@A');w.deposits.add('d_epoch_resonance_scar');
 run(effects.get('epoch_iv_convert_world'),context(w));check(!w.flags.has('epoch_iv_converted'),'changed family needs fresh diagnosis');
 w.flags.delete('epoch_iv_diagnosed_contamination@A');w.flags.add('epoch_iv_diagnosed_scar@B');run(effects.get('epoch_iv_convert_world'),context(w));check(!w.flags.has('epoch_iv_converted'),'foreign paid diagnosis is unusable');}
for(const id of [101,102]) {
  const immediate=JSON.stringify(get(E(id),'immediate'));
  check(immediate.includes('epoch_iv.11')&&!immediate.includes('epoch_iv_after_signals'),'project '+id+' exits ship root before owner-keyed placement');
}
const combined=allNew.map(([p])=>read(p)).join('\n');
check(!/delete_fleet|destroy_ship|set_global_flag|save_global_event_target_as\s*=\s*epoch_iv_\w+(?![\w@])\s*(?:\n|})/.test(combined),'no cleanup victory or unkeyed persistent target');
check((combined.match(/set_country_flag = epoch_iv_protocol_key/g)||[]).length===1,'one key writer');
const situation=new Map(parsedByPath.get(file('situations'))).get('epoch_iv_ascension');
check(get(situation,'stages').length===6&&get(get(situation,'monthly_progress'),'base')==='0','six action milestones, zero timer progress');
check(new Map(parsedByPath.get(file('technology'))).size===6,'six real prototype technologies');
check(new Map(parsedByPath.get(file('archaeological_site_types'))).get('epoch_iv_archive').filter(([k])=>k==='stage').length===4,'four native excavation stages');
const initializers=new Map(parsedByPath.get(file('solar_system_initializers')));
check(initializers.get('epoch_iv_arena_init').filter(([k])=>k==='planet').every(([,b])=>get(b,'class')==='star'),'arena has only central star');
check(!/research_technology|give_technology/.test(combined),'no fabricated bulk research rewards');
// Native interface source checks, with installed primary-source evidence.
const vanilla=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
check(native('launcher-settings.json').includes('Cygnus v4.5.3'),'target version present');
check(native('common/on_actions/00_on_actions.txt').includes('# FromFromFrom = ship 2 # can be invalid'),'native kill callback documents attacker identity');
check(native('events/ancient_relics_arcsite_events_1.txt').includes('to = last_created_system'),'native explicit hyperlane repair');
check(native('common/ship_sizes/10_ai_ships.txt').split('large_ship_ai = {')[1].split('small_ship_ai = {')[0].includes('max_hitpoints = 2000'),'fixed base hull supports 70/30 thresholds');
console.log(`PASS: ${checks} Stage-IV parsed eligibility, callback, kill attribution, conversion and native-source assertions. Static only.`);
