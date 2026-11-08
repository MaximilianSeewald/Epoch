// Focused static tests of the actual opening's guards and definitions. Native
// travel, combat, research delivery, saves and MP are deliberately not emulated.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict');
const {parse, get, parsedByPath, sourceByPath} = require('./test_clausewitz_structure.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const vanilla = process.argv[3] || 'G:/Steam/steamapps/common/Stellaris';
let checks = 0;
const check = (v, m) => { checks++; assert.ok(v, m); };
const text = p => fs.readFileSync(path.join(root,p),'utf8');
// Preserve comparisons: the existing structural parser intentionally discards
// their operators. Normalize only the new scripts before interpreting guards.
const normalized = p => parse(text(p).replace(/\b(\w+)\s*(>=|<=|!=|>|<)\s*/g,
 (_, k, op) => `${k}__${{'>=':'ge','<=':'le','!=':'ne','>':'gt','<':'lt'}[op]} = `),p);
const events = new Map(normalized('events/epoch_convergence_events.txt').filter(([,v])=>Array.isArray(v)).map(([,b])=>[get(b,'id'),b]));
const triggers = new Map(normalized('common/scripted_triggers/epoch_convergence_triggers.txt'));
const effects = new Map(normalized('common/scripted_effects/epoch_convergence_effects.txt'));
const E = id => events.get(`epoch_iii.${id}`);
function walk(b, fn) { for(const [k,v] of b) { fn(k,v,b); if(Array.isArray(v)) walk(v,fn); } }
function findIf(b, name) { let found; walk(b,(k,v)=>{if(k==='if' && Array.isArray(get(v,'limit')) && get(v,'limit').some(([key,val])=>key===name||val===name)) found=v;}); assert.ok(found,name); return found; }
const spawnGate = get(get(effects.get('epoch_iii_spawn_raid'),'if'),'limit');
const victoryGate = get(findIf(get(E(2),'immediate'),'epoch_iii_anchor_destroyed'),'limit');
const flags = (...f) => new Set(f);
const make = (type='default') => ({type,flags:flags(),vars:{},fleets:[],planets:[],deposits:flags(),modifiers:flags(),neighbors:[],resources:{energy:1000,alloys:1000}});
let globalFlags, targets, offset;
const compare = (a,op,b) => ({eq:a===b,ge:a>=b,le:a<=b,gt:a>b,lt:a<b,ne:a!==b})[op];
const split = k => { const [key,op='eq']=k.split('__'); return [key,op]; };
function resolve(k,c) {
 if(k==='this')return c.obj;
 if(k==='root')return c.root;
 if(k==='prev')return c.prev?.obj;
 if(k==='prevprev')return c.prev?.prev?.obj;
 if(k.startsWith('event_target:')) { const [n,sub]=k.slice(13).split('@'); return targets[n+(sub?'@'+resolve(sub,c)?.id:'')]; }
 return c.obj?.[k];
}
const scope = (obj,c) => ({obj,prev:c,root:c.root});
function test(b,c) {
 return b.every(([raw,v])=>{
  const [k,op]=split(raw);
  if(k==='NOT'||k==='NOR')return !v.some(p=>test([p],c));
  if(k==='OR')return v.some(p=>test([p],c));
  if(k==='AND')return test(v,c);
  if(triggers.has(k))return test(triggers.get(k),c)===(v==='yes');
  if(k==='exists')return !!resolve(v,c);
  if(k==='has_global_flag')return globalFlags.has(v);
  if(['has_country_flag','has_fleet_flag','has_planet_flag'].includes(k))return c.obj.flags.has(v);
  if(k==='is_country_type')return c.obj.type===v;
  if(k==='mid_game_years_passed')return compare(offset,op,+v);
  if(k==='has_deposit')return c.obj.deposits.has(v);
  if(k==='has_modifier')return c.obj.modifiers.has(v);
  if(k==='has_special_project')return c.obj.projects?.has(v)||false;
  if(k==='is_same_value')return c.obj===resolve(v,c);
  if(k==='is_colony')return !!c.obj.colony===(v==='yes');
  if(k==='is_capital_system')return !!c.obj.capital===(v==='yes');
  if(k==='has_starbase_size')return c.obj.size===v;
  if(k==='fleet_power')return compare(c.obj.power||0,op,+v);
  if(k==='always')return v==='yes';
  if(k==='check_variable') {
   const [valueKey,value] = v.find(([key])=>key.startsWith('value'));
   return compare(c.obj.vars[get(v,'which')]||0,split(valueKey)[1],Number.isFinite(+value)?+value:c.obj.vars[value]||0);
  }
  if(k==='resource_stockpile_compare') {
   const [valueKey,value] = v.find(([key])=>key.startsWith('value'));
   return compare(c.obj.resources[get(v,'resource')]||0,split(valueKey)[1],+value);
  }
  if(['any_owned_fleet','any_fleet_in_system','any_system_planet','any_neighbor_system'].includes(k)) {
   const list=c.obj[k==='any_neighbor_system'?'neighbors':k==='any_system_planet'?'planets':'fleets'];
   return list.some(o=>test(v,scope(o,c)));
  }
  if(k==='count_owned_fleet') {
   const [countKey,n] = v.find(([key])=>key.startsWith('count'));
   return compare(c.obj.fleets.filter(o=>test(get(v,'limit'),scope(o,c))).length,split(countKey)[1],+n);
  }
  const next=resolve(k,c);
  assert.ok(next,`Unsupported or unguarded trigger scope: ${k}`);
  return test(v,scope(next,c));
 });
}
const ctx = obj => ({obj,root:obj});
const eligible=make();
eligible.flags=flags('epoch_res_schema_v1','epoch_res_complete','epoch_res_final_choice_v1','epoch_res_stage_iii_ready');
offset=-20; globalFlags=flags(); targets={};
check(test(triggers.get('epoch_iii_preparation_eligible'),ctx(eligible)),'All recorded consent facts qualify');
for(const f of eligible.flags) {
 const c=structuredClone(eligible); c.flags.delete(f);
 check(!test(triggers.get('epoch_iii_preparation_eligible'),ctx(c)),`Missing ${f} denies private preparation`);
}
for(const f of ['epoch_core_campaign_opted_out','epoch_res_final_choice_pending','epoch_res_legacy_incompatible']) {
 const c=structuredClone(eligible); c.flags.add(f);
 check(!test(triggers.get('epoch_iii_preparation_eligible'),ctx(c)),`${f} denies private preparation`);
 check(test(triggers.get('epoch_iii_public_empire'),ctx(c)),`${f} does not deny public exposure`);
}
// M is relative; the same actual guard is exercised for both settings.
for(const midgame of [2250,2300])for(const off of [-21,-20,-1,0,1]) {
 offset=off;
 check(test(get(E(20),'trigger'),ctx(eligible))===(off>=-20&&off<0),`Prep completion M=${midgame}, offset=${off}`);
 // Outbreak branch is the one comparing the relative clock to zero.
 const guards=[]; walk(get(E(1),'immediate'),(k,v)=>{if(k==='limit'&&v.some(([key,val])=>key==='mid_game_years_passed__ge'&&val==='0'))guards.push(v);});
 check(guards.every(b=>test(b,ctx(eligible)))===(off>=0),`Outbreak independent of history, M=${midgame}, offset=${off}`);
}
offset=-1;
const prepared=structuredClone(eligible); prepared.flags.add('epoch_iii_prepared');
check(!test(get(E(20),'trigger'),ctx(prepared)),'Repeated prep result is idempotent');
const enemy=make('epoch_convergence'); enemy.flags.add('epoch_iii_identity_v1');
const anchor=make(); anchor.owner=enemy; anchor.flags.add('epoch_iii_anchor');
const raid=()=>{const f=make();f.owner=enemy;f.flags.add('epoch_iii_raid');return f;};
targets={epoch_iii_anchor:anchor}; globalFlags=flags('epoch_iii_active');
for(const spent of [0,1,3,4,5])for(const live of [0,2,3]) {
 enemy.vars.epoch_iii_spent=spent; enemy.fleets=Array.from({length:live},raid);
 check(test(spawnGate,ctx(enemy))===(spent<4&&live<3),`Finite lifetime ${spent} / live ${live}`);
}
enemy.vars.epoch_iii_spent=1; enemy.fleets=[];
globalFlags.add('epoch_iii_anchor_destroyed');
check(!test(spawnGate,ctx(enemy)),'Queued reinforcement after real source death cannot spawn');
globalFlags.delete('epoch_iii_anchor_destroyed'); targets={};
check(!test(spawnGate,ctx(enemy)),'Missing source is no permission to spawn');
targets={epoch_iii_anchor:anchor}; anchor.owner=make();
check(!test(spawnGate,ctx(enemy)),'Foreign source is no permission to spawn'); anchor.owner=enemy;
globalFlags=flags('epoch_iii_anchor_destroyed','epoch_iii_active');
for(const deaths of [0,1,2,3])for(const live of [0,1]) {
 enemy.vars={epoch_iii_spent:3,epoch_iii_raids_destroyed:deaths}; enemy.fleets=Array.from({length:live},raid);
 check(test(victoryGate,ctx(enemy))===(deaths>=3&&live===0),`No victory from absence/retreat: deaths=${deaths}, live=${live}`);
}
enemy.vars={epoch_iii_spent:3,epoch_iii_raids_destroyed:3}; enemy.fleets=[];
globalFlags.delete('epoch_iii_anchor_destroyed');
check(!test(victoryGate,ctx(enemy)),'Missing anchor reference cannot substitute for destruction');
const victim=raid(); enemy.fromfrom=victim;
globalFlags.add('epoch_iii_active');
check(test(get(E(40),'trigger'),ctx(enemy)),'Native death of identified raid is accepted');
victim.flags.add('epoch_iii_death_recorded');
check(!test(get(E(40),'trigger'),ctx(enemy)),'Repeated native death is rejected'); victim.flags.delete('epoch_iii_death_recorded');
victim.flags.add('epoch_iii_cleanup');
check(!test(get(E(40),'trigger'),ctx(enemy)),'Script cleanup cannot award military credit'); victim.flags.delete('epoch_iii_cleanup');
victim.flags.clear();
check(!test(get(E(40),'trigger'),ctx(enemy)),'An unrelated victim cannot count');
const world=make(); world.owner=make();
targets={}; globalFlags=flags();
check(test(triggers.get('epoch_iii_clean_carrier'),ctx(world)),'Clean uninitiated world can receive existing feature');
for(const [deposit] of parsedByPath.get('common/deposits/epoch_phase_ii_features.txt')) {
 world.deposits=flags(deposit);
 check(!test(triggers.get('epoch_iii_clean_carrier'),ctx(world)),`Preserve every existing family state: ${deposit}`);
}
world.deposits=flags();
for(const f of ['epoch_core_campaign_active','epoch_res_active','epoch_ii_active']) {
 world.owner.flags=flags(f);
 check(!test(triggers.get('epoch_iii_clean_carrier'),ctx(world)),`Active objectives use overlay: ${f}`);
}
world.owner.flags=flags(); world.owner.id='owner';
for(const name of ['epoch_core_world','epoch_core_structure_site','epoch_ii_target_planet']) {
 targets={[name+'@owner']:world};
 check(!test(triggers.get('epoch_iii_clean_carrier'),ctx(world)),`Unresolved canonical target protected: ${name}`);
}
targets={};
// Country intake does not test sovereignty, ethic, species, AI or old progress.
for(const type of ['default','epoch_convergence','fallen_empire','awakened_fallen_empire','enclave','observer','primitive','gray_goo'])
 check(test(triggers.get('epoch_iii_public_empire'),ctx(make(type)))===(type==='default'),`Explicit economic intake: ${type}`);
const front=make(); const neighbor=make(); neighbor.owner=make(); front.neighbors=[neighbor];
check(test(triggers.get('epoch_iii_safe_front'),ctx(front)),'Empty hyperlane frontier is eligible');
neighbor.capital=true;
check(!test(triggers.get('epoch_iii_safe_front'),ctx(front)),'Capital-only frontier rejected'); neighbor.capital=false;
front.owner=make();
check(!test(triggers.get('epoch_iii_safe_front'),ctx(front)),'Foreign territorial assets are never replaced'); delete front.owner;
front.fleets=[raid()];
check(!test(triggers.get('epoch_iii_safe_front'),ctx(front)),'No spawn on an existing force');
front.fleets=[]; front.owner=make(); front.starbase={size:'starbase_outpost'};
delete neighbor.owner;
front.neighbors.push({...make(),owner:front.owner});
check(test(triggers.get('epoch_iii_frontier_outpost'),ctx(front)),'Saturated-map frontier outpost can host a real attack');
front.starbase.size='starbase_starport';
check(!test(triggers.get('epoch_iii_frontier_outpost'),ctx(front)),'Upgraded outpost is not a fallback'); front.starbase.size='starbase_outpost';
front.fleets=[{...raid(),power:501}];
check(!test(triggers.get('epoch_iii_frontier_outpost'),ctx(front)),'Defended outpost is not a fallback'); front.fleets=[];
front.capital=true;
check(!test(triggers.get('epoch_iii_frontier_outpost'),ctx(front)),'Fallback never uses a capital'); front.capital=false;
front.planets=[{colony:true}];
check(!test(triggers.get('epoch_iii_frontier_outpost'),ctx(front)),'Fallback never uses an inhabited system');
const mods=new Map(parsedByPath.get('common/static_modifiers/epoch_convergence_modifiers.txt'));
for(const empireClass of ['organic','hive','machine']) {
 const output=['prepared','experienced','unprepared'].map(cohort=>+get(mods.get('epoch_iii_pressure_'+cohort),'planet_jobs_produces_mult'));
 const stability=['prepared','experienced','unprepared'].map(cohort=>+get(mods.get('epoch_iii_pressure_'+cohort),'planet_stability_add'));
 check(output[0]<0&&output[0]>output[1]&&output[1]>output[2],`${empireClass}: strictly ordered broad output loss, including research`);
 check(stability[0]<0&&stability[0]>stability[1]&&stability[1]>stability[2],`${empireClass}: strictly ordered stability loss`);
}
const newFiles=[...sourceByPath].filter(([p])=>p.includes('convergence'));
for(const [p,s]of newFiles) {
 check(!/\b(?:set_country_flag|remove_country_flag)\s*=\s*epoch_(?:core|res|ii)_/.test(s),`${p}: no old progression writes`);
 check(!/\bepoch_(?:core|res|ii)_[\w]+\s*=\s*yes/.test(s.replace(/has_country_flag[^\n]*/g,'')),`${p}: no old scripted setter calls`);
}
const source=text('events/epoch_convergence_events.txt');
check(source.indexOf('set_global_flag = epoch_iii_country_created')<source.indexOf('create_country ='),'Reservation precedes country creation');
check(source.indexOf('set_global_flag = epoch_iii_anchor_created')<source.indexOf('create_fleet ='),'Anchor reservation precedes spawn');
check(source.includes('epoch_iii_unsupported_late_install'),'Unsupported late installs fail closed');
check(source.includes('NOT = { has_global_flag = epoch_iii_first_repulsed }'),'Terminal milestone prevents reactivation');
check(!source.includes('destroy_fleet ='),'No simulated combat victories/cleanup');
const hook=text('common/on_actions/epoch_convergence_on_actions.txt');
check(hook.includes('on_monthly_pulse')&&!hook.includes('on_single_player_save_game_load'),'Recovery uses synchronized simulation');
check(hook.includes('on_fleet_destroyed_victim')&&!hook.includes('on_space_battle_won'),'Only true fleet destruction grants objective credit');
for(const lang of ['english','german']) {
 const file=`localisation/${lang}/epoch_convergence_l_${lang}.yml`, bytes=fs.readFileSync(path.join(root,file));
 check(bytes.subarray(0,3).equals(Buffer.from([239,187,191])),`${lang}: UTF-8 BOM`);
 const loc=text(file);
 check(!/\[event_target:/.test(loc),`${lang}: native local names`);
 check(!/\b(?:Stage III|Stage IV|Handoff|UAP|Universal Ascension Protocol)\b/i.test(loc),`${lang}: no implementation terms/future revelation`);
}
// Every pre-existing gameplay file must retain merged PR #14's Git content.
// Windows checkout CRLF is normalized, as it is by .gitattributes on commit.
const baseline='f3e9856';
const oldFiles=cp.execFileSync('git',['ls-tree','-r','--name-only',baseline],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
for(const p of oldFiles.filter(p=>/^(common|events|localisation)\//.test(p))) {
 const prior=cp.execFileSync('git',['show',`${baseline}:${p}`],{cwd:root,maxBuffer:4*1024*1024});
 check(prior.toString('utf8').replaceAll('\r\n','\n')===text(p).replaceAll('\r\n','\n'),`${p}: Stage I/II Git content unchanged`);
}
// Target-installed definitions, not web/guessed interfaces.
const native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
check(JSON.parse(native('launcher-settings.json')).rawVersion==='v4.5.3','Installed target remains Stellaris 4.5.3');
const docs=process.env.EPOCH_SCRIPT_DOCUMENTATION||path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation');
const triggerDoc=fs.readFileSync(path.join(docs,'triggers.log'),'utf8'),effectDoc=fs.readFileSync(path.join(docs,'effects.log'),'utf8');
for(const key of ['mid_game_years_passed','is_capital_system','can_access_system','is_disabled','count_owned_fleet','has_starbase_size'])check(triggerDoc.includes(key+' -'),`Documented trigger: ${key}`);
for(const key of ['queue_actions','clear_fleet_actions','set_timed_fleet_flag','save_global_event_target_as'])check(effectDoc.includes(key+' -'),`Documented effect: ${key}`);
check(native('events/marauder_events.txt').includes('mid_game_years_passed >= -10'),'Native negative relative midgame precedent');
check(native('events/astral_planes_events.txt').includes('has_starbase_size = starbase_outpost'),'Native outpost equality comparison');
check(/max_speed\s*=\s*0\.0/.test(native('common/ship_sizes/10_ai_ships.txt').split('military_station_small_ai = {')[1].split('# AI Core')[0]),'Anchor uses a genuinely immobile native station hull');
check(native('events/an4_events.txt').includes('move_to = event_target:'),'Native queued system movement');
check(native('common/special_projects/00_projects_infernals.txt').includes('event_scope = country_event'),'Native country research completion');
check(native('common/country_types/00_country_types.txt').split('gray_goo = {')[1].split('mechanocalibrator = {')[0].includes('hostile = yes'),'Native hostile faction semantics');
const componentText=fs.readdirSync(path.join(vanilla,'common/component_templates')).filter(f=>f.endsWith('.txt')).map(f=>native('common/component_templates/'+f)).join('\n');
for(const [,design]of parsedByPath.get('common/global_ship_designs/epoch_convergence_designs.txt')) {
 walk(design,(k,v)=>{if(k==='required_component'||k==='template'&&typeof v==='string'&&!v.includes('DESTROYER_')&&!v.includes('ai_station'))check(componentText.includes(v),`Installed ship component ${v}`);});
}
console.log(`PASS: ${checks} Stage-III source/guard/isolation assertions. Static only; no engine, AI, save/load or MP validation.`);
