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
const make = id => ({ id, type:'default', flags:new Set(), vars:{}, deposits:new Set(), modifiers:new Set(), situations:[], calls:[], projects:new Set(), planets:[], ships:[],fleets:[],resources:{energy:10000,alloys:10000},techs:new Set(),federation:new Set(),pacts:new Set() });
let countries, targets, globalFlags, nativeSpawn, nativeWork, fleetCreations=0;
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
    if(k==='is_in_federation_with')return c.obj.federation.has(resolve(v,c));
    if(k==='has_defensive_pact')return c.obj.pacts.has(resolve(v,c));
    if(k==='is_in_combat')return !!c.obj.combat===(v==='yes');
    if(k==='has_hp_percentage')return cmp(c.obj.hp/(c.obj.maxHp||240000),op,+v);
    if(k==='has_hp')return cmp(c.obj.hp,op,+v);
    if(k==='has_technology')return c.obj.techs.has(v);
    if(k==='is_variable_set')return Object.hasOwn(c.obj.vars,v);
    if(k==='resource_stockpile_compare'){const [key,value]=v.find(([x])=>x.startsWith('value'));return cmp(c.obj.resources[get(v,'resource')]||0,key.split('__')[1]||'eq',+value);}
    if(k==='is_country_type'||k==='is_situation_type')return c.obj.type===v;
    if(k==='is_same_value')return c.obj===resolve(v,c);
    if(k==='is_owned_by')return c.obj.owner===resolve(v,c);
    if(k==='is_colony')return !!c.obj.colony===(v==='yes');
    if(k==='check_variable') { const [key,value]=v.find(([x])=>x.startsWith('value')); const variable=get(v,'which'); assert.ok(Object.hasOwn(c.obj.vars,variable),'guard unset check_variable: '+variable); return cmp(c.obj.vars[variable],key.split('__')[1]||'eq',+value); }
    if(k==='any_country')return countries.some(o=>test(v,scope(o,c)));
    if(k==='any_owned_planet')return c.obj.planets.some(o=>test(v,scope(o,c)));
    if(k==='any_owned_ship')return c.obj.ships.some(o=>test(v,scope(o,c)));
    if(Array.isArray(v)) { const obj=resolve(k,c); return !!obj&&test(v,scope(obj,c)); }
    throw Error('Unsupported test trigger '+k);
  });
}
function run(b,c) {
  let branch=false;
  for(const [k,v]of b) {
    if(k==='tooltip'||k==='custom_tooltip'||k==='log')continue;
    if(k==='hidden_effect'){run(v,c);continue;}
    if(k==='if'||k==='else_if') { const take=(k==='if'||!branch)&&test(get(v,'limit'),c); if(k==='if')branch=false; if(take){run(v.filter(([n])=>n!=='limit'),c);branch=true;} continue; }
    if(k==='else'){if(!branch)run(v,c);continue;}
    if(k==='epoch_iv_select_work'&&nativeWork){nativeWork(c);continue;}
    if(k==='enable_special_project'){const owner=resolve(get(v,'owner'),c);owner.projects.add(get(v,'name'));owner.projectResources={...owner.resources};continue;}
    if(k==='epoch_iv_spawn_judge'&&nativeSpawn){nativeSpawn(c);continue;}
    if(effects.has(k)){run(effects.get(k),c);continue;}
    if(/^set_(country|planet|ship|fleet)_flag$/.test(k)){c.obj.flags.add(flagKey(v,c));continue;}
    if(/^remove_(country|planet|ship|fleet)_flag$/.test(k)){c.obj.flags.delete(flagKey(v,c));continue;}
    if(k==='clear_global_event_target'){delete targets[flagKey(v,c)];continue;}
    if(k==='add_resource'){for(const [r,n]of v)c.obj.resources[r]=(c.obj.resources[r]||0)+Number(n);continue;}
    if(k==='create_fleet'){fleetCreations++;continue;} // native boundary: count requests, never simulate combat
    if(k==='set_variable'){c.obj.vars[get(v,'which')]=+get(v,'value');continue;}
    if(k==='change_variable'){const variable=get(v,'which');assert.ok(Object.hasOwn(c.obj.vars,variable),'initialize before change_variable: '+variable);c.obj.vars[variable]+=Number(get(v,'value'));continue;}
    if(k==='add_deposit'){c.obj.deposits.add(v);continue;}
    if(k==='remove_deposit'){c.obj.deposits.delete(v);continue;}
    if(k==='remove_modifier'){c.obj.modifiers.delete(v);continue;}
    if(k==='add_modifier'){c.obj.modifiers.add(get(v,'modifier'));continue;}
    if(k==='country_event'){c.obj.calls.push(get(v,'id'));continue;}
    if(k==='fleet_event'){c.obj.calls.push(get(v,'id'));continue;}
    if(k==='every_owned_fleet'){for(const o of c.obj.fleets)if(test(get(v,'limit'),scope(o,c)))run(v.filter(([n])=>n!=='limit'),scope(o,c));continue;}
    if(k==='every_country'){for(const o of [...countries])if(test(get(v,'limit'),scope(o,c)))run(v.filter(([n])=>n!=='limit'),scope(o,c));continue;}
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
  ship.flags.add('epoch_iv_principal');shipB.flags.add('epoch_iv_principal');ship.flags.add('epoch_iv_principal_for@A');shipB.flags.add('epoch_iv_principal_for@B');
  a.flags.add('epoch_iv_judge_created');b.flags.add('epoch_iv_judge_created');
  enemy.from=ally;enemy.fromfrom=ship;enemy.fromfromfrom=attacker;
  ally.pacts.add(a);attacker.owner=ally;enemy.flags.add('epoch_iv_authorized_battle');ship.fleet={...make('boss-fleet'),combat:true};
  targets={'epoch_iv_claimant@EA':a,'epoch_iv_claimant@EB':b,'epoch_iv_principal@EA':ship,'epoch_iv_principal@EB':shipB,'epoch_iv_ship@A':ship,'epoch_iv_ship@B':shipB};
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
for(const scenario of ['valid','self','federation','subject','overlord','foreign-kill','missing-attacker','missing-attacker-no-combat','no-battle-certificate','mismatched-attacker','missing-ship','missing-claimant','wrong-principal','cleanup','duplicate','owner-optout','other-boss','lost-principal-target','battle-ended','missing-victim','missing-country','victory-duplicate','retired','lost-personal-target','wrong-personal-tag']) {
  const {a,b,enemy,ship,shipB,ally,attacker}=setup();
  if(scenario==='lost-principal-target')delete targets['epoch_iv_principal@EA'];
  if(scenario==='battle-ended'){ship.fleet.combat=false;enemy.flags.delete('epoch_iv_authorized_battle');}
  if(scenario==='missing-victim')delete enemy.fromfrom;
  if(scenario==='missing-country')delete enemy.from;
  if(scenario==='retired')enemy.flags.add('epoch_iv_retired');
  if(scenario==='lost-personal-target')delete targets['epoch_iv_ship@A'];
  if(scenario==='wrong-personal-tag'){ship.flags.delete('epoch_iv_principal_for@A');ship.flags.add('epoch_iv_principal_for@B');}
  if(scenario==='victory-duplicate')enemy.flags.add('epoch_iv_victory_recorded');
  if(scenario==='foreign-kill')ally.pacts.clear();
  if(scenario==='self'){enemy.from=a;attacker.owner=a;}
  if(scenario==='federation'){ally.pacts.clear();ally.federation.add(a);}
  if(scenario==='subject'){ally.pacts.clear();ally.overlord=a;}
  if(scenario==='overlord'){ally.pacts.clear();a.overlord=ally;}
  if(scenario.startsWith('missing-attacker'))delete enemy.fromfromfrom;
  if(scenario==='missing-attacker-no-combat')ship.fleet.combat=false;
  if(scenario==='no-battle-certificate')enemy.flags.delete('epoch_iv_authorized_battle');
  if(scenario==='mismatched-attacker')attacker.owner=b;
  if(scenario==='missing-ship')delete enemy.fromfrom;
  if(scenario==='missing-claimant')delete targets['epoch_iv_claimant@EA'];
  if(scenario==='wrong-principal'||scenario==='other-boss')enemy.fromfrom=shipB;
  if(scenario==='cleanup')enemy.from=enemy;
  if(scenario==='duplicate')ship.flags.add('epoch_iv_death_recorded');
  if(scenario==='owner-optout')a.flags.add('epoch_core_campaign_opted_out');
  const valid=test(get(E(50),'trigger'),context(enemy));
  const rewards=['valid','self','federation','subject','overlord','no-battle-certificate','lost-principal-target','battle-ended','lost-personal-target'].includes(scenario);
  if(valid){run(get(E(50),'immediate'),context(enemy));check(a.flags.has('epoch_iv_protocol_key')===rewards,'combat participation: '+scenario);check(!b.flags.has('epoch_iv_protocol_key'),'only claimant rewarded');check(a.vars.epoch_iv_chapter===(rewards?6:5),'milestone follows participation');const chapter=a.vars.epoch_iv_chapter;run(get(E(50),'immediate'),context(enemy));check(a.vars.epoch_iv_chapter===chapter,'death idempotent');check(a.calls.filter(id=>id==='epoch_iv.60').length===(rewards?1:0),'finale scheduled exactly once');}
  else check(!rewards,'valid victory is not rejected: '+scenario);
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
  check(world.deposits.has('unrelated')&&world.modifiers.has('epoch_res_permanent_damage'),'unrelated deposits and emergency decision preserved');
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
// Native placement is an explicit boundary; payment/project ordering is executed.
const buildOption=E(80).find(([k,v])=>k==='option'&&get(v,'name')==='epoch_iv.build')[1];
for(const scenario of ['no-resources','no-tech','paid','no-location','stale','existing','done']){
 const {a}=setup();a.vars.epoch_iv_chapter=4;
 a.techs.add('tech_epoch_iv_materials');
 if(scenario==='no-resources')a.resources={energy:0,alloys:0};
 if(scenario==='no-tech')a.techs.clear();
 if(scenario==='existing')a.projects.add('EPOCH_IV_PROTOTYPE');
 if(scenario==='done')a.flags.add('epoch_iv_prototype_done');
 const visible=test(get(buildOption,'trigger'),context(a));
 check(visible===!['existing','done'].includes(scenario),'construction visibility: '+scenario);
 check(test(get(buildOption,'allow'),context(a))===['paid','no-location','stale'].includes(scenario),'construction requirements: '+scenario);
 const before={...a.resources};let selections=0;
 nativeWork=c=>{selections++;if(scenario!=='no-location')targets['epoch_iv_work@A']=make('construction-site');};
 if(scenario==='stale')a.resources.alloys=0;
 const atClick={...a.resources};run(buildOption.filter(([k])=>k==='if'),context(a));nativeWork=null;
 check(a.flags.has('epoch_iv_prototype_funded')===(scenario==='paid'),'funded only after successful payment: '+scenario);
 check((a.resources.energy===atClick.energy-3000&&a.resources.alloys===atClick.alloys-4000)===(scenario==='paid'),'costs once and only with location: '+scenario);
 if(scenario==='paid'){
  check(a.projects.has('EPOCH_IV_PROTOTYPE')&&a.projectResources.energy===7000&&a.projectResources.alloys===6000,'project starts after both resources deducted');
  run(buildOption.filter(([k])=>k==='if'),context(a));check(a.resources.energy===7000&&a.resources.alloys===6000,'stale duplicate cannot pay twice');
 }
}
const allNew=[...parsedByPath].filter(([p])=>p.includes('ascension'));
// Two/three coexisting families really pay all three native decision costs.
for(const count of [2,3]) {
 const {a}=setup(),w=make('multi');w.owner=a;w.colony=true;w.planet=w;a.vars.epoch_iv_chapter=3;
 a.resources={energy:50000,alloys:50000};
 a.techs.add('tech_epoch_iv_diagnostics');a.techs.add('tech_epoch_iv_inversion');
 const decisions=new Map(parseFile(file('decisions')));
 for(const [,states]of families.slice(0,count))w.deposits.add(states[0]);
 for(let i=0;i<count;i++){
  for(const action of ['diagnose','stabilize','invert']){
   const d=decisions.get('decision_epoch_iv_'+action);
   check(test(get(d,'allow'),context(w)),'multi-family '+i+' permits '+action);
   const cost=get(get(d,'resources'),'cost');for(const [r,n]of cost)a.resources[r]-=Number(n);
   run(get(d,'effect'),context(w));
  }
  check(w.deposits.has(families[i][2]),'multi-family positive '+i);
  check(!test(triggers.get('epoch_iv_diagnosis_matches'),context(w))&&!w.flags.has('epoch_iv_stabilized@A'),'preparation consumed for family '+i);
 }
 check(a.vars.epoch_iv_chapter===4&&a.calls.filter(x=>x==='epoch_iv.40').length===1,'one story reward across multiple families');
 check(a.resources.energy===50000-5900*count&&a.resources.alloys===50000-2100*count,'every family pays full native cost');
 check(!test(triggers.get('epoch_iv_safe_world'),context(w)),'no family can repeat after all converted');
}
// Cleanup and net economic results use the actual modifier/deposit definitions.
const oldMods=new Map(parseFile('common/static_modifiers/epoch_core_modifiers.txt'));
const crisisMods=new Map(parseFile('common/static_modifiers/epoch_convergence_modifiers.txt'));
const deposits=new Map(parseFile(file('deposits')));
for(const family of ['contamination','scar']) {
 const {a}=setup(),w=make('net');w.owner=a;w.colony=true;w.flags.add('epoch_iv_stabilized@A');w.flags.add('epoch_iv_diagnosed_'+family+'@A');
 w.flags.add('epoch_iii_exposed_v1');w.deposits.add(family==='scar'?'d_epoch_resonance_scar':'d_epoch_resonance_contamination_active');
 const treated=family==='scar'?['epoch_core_permanent_scar_organic','epoch_core_permanent_scar_exacerbated','epoch_iii_scar_pressure']:['epoch_res_quarantine','epoch_iii_pressure_unprepared','epoch_iii_contamination_severe'];
 for(const m of [...treated,'epoch_res_permanent_damage'])w.modifiers.add(m);
 run(effects.get('epoch_iv_convert_world'),context(w));
 check(treated.every(m=>!w.modifiers.has(m)),'family burdens removed: '+family);
 check(w.modifiers.has('epoch_res_permanent_damage'),'independent emergency damage remains');
 const pos=get(deposits.get('d_epoch_iv_'+(family==='scar'?'fold':'matrix')),'planet_modifier');
 const sums={};for(const [k,n]of pos)sums[k]=+n;
 for(const m of w.modifiers)for(const [k,n]of oldMods.get(m)||crisisMods.get(m)||[])if(Number.isFinite(+n))sums[k]=(sums[k]||0)+Number(n);
 check(sums.planet_stability_add===2,'net stability is +2 including independent emergency damage');
 check(family==='scar'?sums.planet_jobs_physics_research_produces_mult+sums.planet_jobs_produces_mult>0:sums.planet_jobs_produces_mult>0,'net production/research is positive');
}
for(const family of ['contamination','scar'])for(const matches of [true,false]) {
 const {a}=setup(),w=make('buffered');w.owner=a;w.colony=true;w.flags.add('epoch_iv_stabilized@A');w.flags.add('epoch_iv_diagnosed_'+family+'@A');
 w.deposits.add(family==='scar'?'d_epoch_resonance_scar':'d_epoch_resonance_contamination_active');w.modifiers.add('epoch_iii_pressure_buffered');
 if(matches){w.flags.add('epoch_iii_scar_exposed');if(family==='contamination')w.flags.add('epoch_iii_feature_added');}
 run(effects.get('epoch_iv_convert_world'),context(w));check(w.modifiers.has('epoch_iii_pressure_buffered')===!matches,'buffered overlay provenance: '+family+' '+matches);
}
for(const scenario of ['missing','target-only-lost','enemy-reference','victory-record','key','cap','foreign-principal','transferred-principal']) {
 const {a,b,enemy,ship,shipB}=setup();
 delete targets['epoch_iv_ship@A'];
 if(scenario!=='enemy-reference')delete targets['epoch_iv_principal@EA'];
 if(scenario==='target-only-lost')enemy.ships.push(ship);
 if(scenario==='victory-record')enemy.flags.add('epoch_iv_victory_recorded');
 if(scenario==='key')a.flags.add('epoch_iv_protocol_key');
 if(scenario==='cap')a.vars.epoch_iv_recoveries=2;
 if(scenario==='foreign-principal'){countries[3].ships.push(shipB);}
 if(scenario==='transferred-principal'){ship.flags.add('epoch_iv_principal_for@A');b.ships.push(ship);}
 check(test(triggers.get('epoch_iv_judge_missing'),context(a))===['missing','foreign-principal'].includes(scenario),'recovery guard: '+scenario);
}
{const {a,enemy}=setup();delete targets['epoch_iv_ship@A'];delete targets['epoch_iv_principal@EA'];let requests=0;
 // Stop at the native spawn boundary; verify the real recovery script retires
 // authority and pays first. Placement itself remains a runtime requirement.
 nativeSpawn=()=>{requests++;check(enemy.flags.has('epoch_iv_retired'),'old authority retired before spawn');targets['epoch_iv_ship@A']=make('replacement');a.flags.add('epoch_iv_judge_created');};
 run(effects.get('epoch_iv_restore_judge'),context(a));run(effects.get('epoch_iv_restore_judge'),context(a));nativeSpawn=null;
 check(requests===1&&a.vars.epoch_iv_recoveries===1,'stale recovery cannot create duplicate');
 check(a.resources.energy===8000&&a.resources.alloys===6000&&!a.flags.has('epoch_iv_protocol_key'),'recovery pays and never grants a key');
}
for(const initial of [undefined,0,1,2]){
 const {a}=setup();delete targets['epoch_iv_ship@A'];delete targets['epoch_iv_principal@EA'];let requests=0;
 if(initial!==undefined)a.vars.epoch_iv_recoveries=initial;
 const allowed=2-(initial??0);
 nativeSpawn=()=>{requests++;targets['epoch_iv_ship@A']=make('replacement'+requests);a.flags.add('epoch_iv_judge_created');};
 for(let attempt=0;attempt<3;attempt++){
  run(effects.get('epoch_iv_restore_judge'),context(a));
  // A stale request must not spend again while the replacement still exists.
  run(effects.get('epoch_iv_restore_judge'),context(a));
  delete targets['epoch_iv_ship@A'];
 }
 nativeSpawn=null;
 check(requests===allowed&&a.vars.epoch_iv_recoveries===2,'exact recovery allowance from '+String(initial));
 check(a.resources.energy===10000-2000*allowed&&a.resources.alloys===10000-4000*allowed,'each allowed replacement pays once from '+String(initial));
 check(!test(triggers.get('epoch_iv_judge_missing'),context(a))&&!a.flags.has('epoch_iv_protocol_key'),'third recovery blocked without key from '+String(initial));
}
{const {a}=setup();
 assert.throws(()=>test(parse('check_variable = { which = epoch_iv_recoveries value = 0 }','unset regression'),context(a)),/guard unset check_variable/);checks++;
 assert.throws(()=>run(parse('change_variable = { which = epoch_iv_recoveries value = 1 }','unset regression'),context(a)),/initialize before change_variable/);checks++;
}
{const {a,enemy,ship}=setup(),f=make('battle');f.owner=enemy;f.combat=true;f.flags.add('epoch_iv_judge');f.ships=[ship];ship.hp=15000;targets['epoch_iv_principal@EA']=ship;fleetCreations=0;
 for(let i=0;i<4;i++)run(get(E(52),'immediate'),context(f));
 check(f.flags.has('epoch_iv_verdict')&&f.flags.has('epoch_iv_broken'),'large hull jump traverses both phases');
 check(fleetCreations===1&&f.modifiers.has('epoch_iv_judge_broken')&&!f.modifiers.has('epoch_iv_judge_verdict'),'one escort wave and terminal phase');
 check(JSON.stringify(a.calls)===JSON.stringify(['epoch_iv.54']),'large jump sends only the final-phase combat report, once');
}
{const {a,enemy,ship}=setup(),f=make('gradual');f.owner=enemy;f.combat=true;f.flags.add('epoch_iv_judge');f.ships=[ship];targets['epoch_iv_principal@EA']=ship;fleetCreations=0;
 ship.hp=160000;run(get(E(52),'immediate'),context(f));run(get(E(52),'immediate'),context(f));
 check(JSON.stringify(a.calls)===JSON.stringify(['epoch_iv.53']),'ordinary 70-percent transition reports once');
 ship.hp=15000;run(get(E(52),'immediate'),context(f));run(get(E(52),'immediate'),context(f));
 check(JSON.stringify(a.calls)===JSON.stringify(['epoch_iv.53','epoch_iv.54']),'separate 30-percent transition retains its report once');
 check(fleetCreations===1&&f.modifiers.has('epoch_iv_judge_broken'),'ordinary transitions retain mechanics and one escort wave');
}
{const {a}=setup();check(!test(triggers.get('epoch_iv_ai_action_available'),context(a)),'AI does not open idle menu');
 a.vars.epoch_iv_chapter=4;a.techs.add('tech_epoch_iv_materials');check(test(triggers.get('epoch_iv_ai_action_available'),context(a)),'AI funded construction is actionable');
 a.projects.add('EPOCH_IV_PROTOTYPE');check(!test(triggers.get('epoch_iv_ai_action_available'),context(a)),'AI waits for active project');}
for(const [,option]of E(80).filter(([k])=>k==='option')) {
  if(get(option,'trigger'))check(JSON.stringify(get(get(option,'if'),'limit'))===JSON.stringify(get(option,'allow')||get(option,'trigger')),'operations action rechecks stale-window requirements');
}
{const {a}=setup();const w=make('changed-family');w.owner=a;w.colony=true;w.flags.add('epoch_iv_stabilized@A');w.flags.add('epoch_iv_diagnosed_contamination@A');w.deposits.add('d_epoch_resonance_scar');
 run(effects.get('epoch_iv_convert_world'),context(w));check(!w.flags.has('epoch_iv_converted'),'changed family needs fresh diagnosis');
 w.flags.delete('epoch_iv_diagnosed_contamination@A');w.flags.add('epoch_iv_diagnosed_scar@B');run(effects.get('epoch_iv_convert_world'),context(w));check(!w.flags.has('epoch_iv_converted'),'foreign paid diagnosis is unusable');}
for(const id of [101,102]) {
  const immediate=JSON.stringify(get(E(id),'immediate'));
  check(immediate.includes('epoch_iv.11')&&!immediate.includes('epoch_iv_after_signals'),'project '+id+' exits ship root before owner-keyed placement');
}
const combined=allNew.map(([p])=>read(p)).join('\n');
check(!/destroy_ship|set_global_flag|save_global_event_target_as\s*=\s*epoch_iv_\w+(?![\w@])\s*(?:\n|})/.test(combined),'no scripted kill victory or unkeyed persistent target');
check((combined.match(/set_country_flag\s*=\s*epoch_iv_protocol_key/g)||[]).length===1,'one key writer');
const situation=new Map(parsedByPath.get(file('situations'))).get('epoch_iv_ascension');
check(get(situation,'stages').length===6&&get(get(situation,'monthly_progress'),'base')==='0','six action milestones, zero timer progress');
const icons=get(situation,'stages').map(([,b])=>get(b,'icon'));
check(new Set(icons).size===6,'six distinct chapter icons');
for(const n of [21,23]){
 const options=E(n).filter(([k])=>k==='option').map(([,b])=>b);
 check(options.every(b=>get(b,'trigger')),'all archaeology choices have replay guards');
 check(options.some(b=>get(b,'name')==='epoch_iv.replay'),'replay preserves recorded choice');
}
check(!E(81)&&!JSON.stringify(situation).includes('epoch_iv_operations'),'no duplicate situation operations button');
check(JSON.stringify(E(82)).includes('auto_follow_fleet')&&JSON.stringify(E(82)).includes('attack_fleet'),'AI receives a native attack order');
check(!JSON.stringify(E(44)).includes('set_fleet_stance'),'immobile demonstrator uses no stance command');
check(JSON.stringify(get(E(58),'trigger')).includes('epoch_iv_withdrawing')&&JSON.stringify(get(E(58),'trigger')).includes('epoch_iv_escorts'),'only withdrawn escorts reach timed cleanup');
check(!JSON.stringify(E(58)).includes('protocol_key')&&!JSON.stringify(E(57)).includes('protocol_key'),'escort cleanup has no victory authority');
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
const sprites=native('interface/situation_log.gfx');for(const icon of icons)check(sprites.includes('"'+icon+'"'),'native icon '+icon);
const componentFiles=fs.readdirSync(path.join(vanilla,'common/component_templates')).filter(p=>p.endsWith('.txt')).map(p=>native('common/component_templates/'+p)).join('\n');
const designs=parsedByPath.get(file('global_ship_designs'));
function checkComponents(b){for(const [k,v]of b)if(k==='component')check(componentFiles.includes('key = '+get(v,'template')),'native component '+get(v,'template'));else if(k==='required_component')check(componentFiles.includes('key = '+v),'native required component '+v);else if(Array.isArray(v))checkComponents(v);}
checkComponents(designs);
const mods=new Map(parseFile(file('static_modifiers'))),body=mods.get('epoch_iv_judge_body'),counter=mods.get('epoch_iv_countermeasure');
const num=(b,k)=>Number(get(b,k)||0);
check(2000*(1+num(body,'ship_hull_mult'))===240000,'phase thresholds use actual 240000 hull');
const raw=(1+num(body,'ship_weapon_damage'))*(1+num(body,'ship_fire_rate_mult'));
const prepared=(1+num(body,'ship_weapon_damage')+num(counter,'ship_weapon_damage'))*(1+num(body,'ship_fire_rate_mult')+num(counter,'ship_fire_rate_mult'));
check(prepared/raw<0.65&&prepared>0,'countermeasure cuts modeled weapon throughput by over 35%, never substitutes for combat');
check(native('common/scripted_variables/02_scripted_variables_component_cost.txt').includes('@shield_L5 = 2340'),'large tier-five shield capacity source');
check(native('common/scripted_variables/02_scripted_variables_component_cost.txt').includes('@armor_L5 = 2340'),'large tier-five armor capacity source');
// Targeted UI/native-contract checks for first-playtest repairs.
const decs=new Map(parseFile(file('decisions')));
for(const action of ['diagnose','stabilize','invert']){
 const b=decs.get('decision_epoch_iv_'+action),eff=get(b,'effect');
 check(get(eff,'tooltip')?.length>0&&get(eff,'hidden_effect')?.length>0,'paid decision separates native preview and execution: '+action);
 check(JSON.stringify(get(eff,'tooltip')).includes('epoch_iv.family.contamination')&&JSON.stringify(get(eff,'tooltip')).includes('epoch_iv.family.scar')&&JSON.stringify(get(eff,'tooltip')).includes('epoch_iv.family.structure'),'all family previews: '+action);
}
const preview=JSON.stringify(get(get(decs.get('decision_epoch_iv_invert'),'effect'),'tooltip'));
for(const [family,old,result]of families)check(preview.includes(result)&&old.every(d=>preview.includes(d)),'inversion previews actual old and positive deposits: '+family);
check(JSON.stringify(get(get(situation,'approach'),'on_select')).includes('custom_tooltip'),'observation has a real on_select tooltip, as required by engine warning');
check(JSON.stringify(get(decs.get('decision_epoch_iv_operations'),'potential')).includes('is_capital'),'manual operations remains capital decision');
check(JSON.stringify(E(1)).includes('epoch_iv_fallback_cooldown')&&JSON.stringify(E(1)).includes('is_capital'),'automatic fallback only for empires without capital');
check(JSON.stringify(E(40)).includes('epoch_iv.80')&&!JSON.stringify(get(E(40),'trigger')).includes('resource_stockpile_compare'),'chapter IV always opens and introduces funding');
check(JSON.stringify(E(1)).includes('epoch_iv.42')&&JSON.stringify(E(42)).includes('epoch_iv_materials_presented'),'research completion introduces assembly exactly once');
check(JSON.stringify(E(1)).includes('epoch_iv.46')&&JSON.stringify(E(46)).includes('epoch_iv_recovery_presented'),'missing old judge automatically offers paid recovery');
check(!JSON.stringify(triggers.get('epoch_iv_valid_military_death')).includes('is_in_combat')&&!JSON.stringify(triggers.get('epoch_iv_valid_military_death')).includes('epoch_iv_authorized_battle'),'victory independent of battle-exit/poll ordering');
check(!JSON.stringify(triggers.get('epoch_iv_valid_military_death')).includes('epoch_iv_principal@'),'victory independent of expiring ship target');
check(JSON.stringify(E(50)).includes('log')&&!JSON.stringify(E(50)).includes('custom_tooltip'),'failure diagnostics only in development logs');
const spawn=JSON.stringify(effects.get('epoch_iv_spawn_judge'));
check(spawn.includes('settings')&&spawn.includes('is_boss')&&spawn.includes('spawn_debris'),'native fleet settings select Guardian display');
check(JSON.stringify(E(1)).includes('set_fleet_settings'),'existing fleet receives native boss-display migration');
check(native('events/leviathans_events_2.txt').includes('is_boss = yes'),'Vanilla Guardian proves fleet settings property');
const docRoot=process.env.EPOCH_SCRIPT_DOCUMENTATION||path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation');
const doc=n=>fs.readFileSync(path.join(docRoot,n+'.log'),'utf8');
for(const effect of ['set_fleet_settings','log'])check(doc('effects').includes(effect+' -'),'generated native effect documentation: '+effect);
check(doc('modifiers').includes('- pop_environment_tolerance,')&&!read(file('deposits')).includes('planet_habitability_add'),'supported habitability modifier replaces invalid name');
check(doc('triggers').includes('has_hp_percentage -')&&JSON.stringify(E(52)).includes('has_hp_percentage'),'phases use native hull ratios including changed maximum hull');
const phaseII=parseFile('common/deposits/epoch_phase_ii_features.txt');
function guardOwners(b){for(let i=0;i<b.length;i++){const [k,v]=b[i];if(k==='owner')check(i>0&&b[i-1][0]==='exists'&&b[i-1][1]==='owner','every deposit owner switch guarded');if(Array.isArray(v))guardOwners(v);}}
guardOwners(phaseII);
const lanes=read(file('scripted_effects'));
check((lanes.match(/add_hyperlane =/g)||[]).length===4&&(lanes.match(/has_hyperlane_to = prev/g)||[]).length===4,'all four spawned-system lane repairs guarded');
check(native('events/ancient_relics_arcsite_events_1.txt').includes('has_hyperlane_to = prev'),'Vanilla proves exact lane-guard scope');
const clear=[];function checkClears(b){for(const [k,v]of b){if(k==='if'&&JSON.stringify(v).includes('clear_global_event_target')){for(const [key,target]of v)if(key==='clear_global_event_target'){clear.push(target);check(JSON.stringify(get(v,'limit')).includes('event_target:'+target),'clear is guarded for '+target);}}if(Array.isArray(v))checkClears(v);}}
checkClears(parseFile(file('scripted_effects')));check(clear.length>=8,'initial and recovery target clears covered');
for(const lang of ['english','german']){
 const source=read('localisation/'+lang+'/epoch_ascension_l_'+lang+'.yml');
 const loc=new Map([...source.matchAll(/^\s*([\w.]+):0 "(.*)"/gm)].map(m=>[m[1],m[2]]));
 for(const k of ['epoch_iv_ascension_type','epoch_iv_ascension_monthly_change_tooltip','epoch_iv.diagnose.tt','epoch_iv.stabilize.tt','epoch_iv.invert.tt','epoch_iv.42.name','epoch_iv.46.name'])check(!!loc.get(k),'new native UI localization: '+lang+'/'+k);
 for(let n=1;n<=6;n++)check((loc.get('epoch_iv_objectives_'+n)||'').includes('\\n\\n'),'narrative and concrete chapter objective: '+lang+'/'+n);
}
for(const [name,b]of mods)for(const [key]of b)check(doc('modifiers').includes('- '+key+','),'native combat/economic modifier: '+name+'/'+key);
const shipVars=native('common/scripted_variables/03_scripted_variables_ships.txt');
check(shipVars.includes('@titan_hp = 20000')&&shipVars.includes('@battleship_hp = 4800'),'native endgame hull baselines for encounter comparison');
check(JSON.stringify(effects.get('epoch_iv_spawn_judge')).includes('epoch_iv_judge_body')&&!JSON.stringify(effects.get('epoch_iv_spawn_judge')).includes('AUTO_REPAIR'),'principal gets durable finite defenses and no hull repair component');
{const {a}=setup();a.vars.epoch_iv_chapter=4;a.resources={energy:0,alloys:0};
 check(test(get(E(40),'trigger'),context(a)),'chapter IV entry independent of resources');
 a.flags.add('epoch_iv_chapter_iv_presented');check(!test(get(E(40),'trigger'),context(a)),'monthly migration and pending callback cannot introduce chapter IV twice');}
console.log(`PASS: ${checks} Stage-IV parsed eligibility, callback, kill attribution, conversion and native-source assertions. Static only.`);
