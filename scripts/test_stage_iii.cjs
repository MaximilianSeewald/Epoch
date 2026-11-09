// Focused static tests of the full crisis's guards and definitions. Native
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
const resolution = effects.get('epoch_iii_check_resolution');
const victoryGate = [...get(findIf(resolution,'epoch_iii_command_created'),'limit'), ...get(findIf(resolution,'epoch_iii_command_destroyed'),'limit')];
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
  if(['has_country_flag','has_fleet_flag','has_planet_flag','has_ship_flag'].includes(k))return c.obj.flags.has(v);
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
  if(k==='any_situation')return (c.obj.situations||[]).some(o=>test(v,scope(o,c)));
  if(k==='is_situation_type')return c.obj.type===v;
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
// Execute the actual per-source gates across all four identities, caps and
// cross-front signal/research states. This is static guard evaluation only.
anchor.flags.add('epoch_iii_front_1');
for (let i=1;i<=4;i++) {
 const gate=get(findIf(effects.get('epoch_iii_front_operations'),`epoch_iii_front_${i}_registered`),'limit');
 anchor.flags=flags('epoch_iii_anchor',`epoch_iii_front_${i}`);
 targets={[`epoch_iii_anchor_${i}`]:anchor};
 for(const signal of [false,true])for(const science of [false,true])
 for(const spent of [0,2,3,4,5,6,7])for(const live of [0,11,12]) {
  globalFlags=flags('epoch_iii_active',`epoch_iii_front_${i}_registered`);
  if(signal)globalFlags.add('epoch_iii_signal_disabled');
  if(science)globalFlags.add('epoch_iii_logistics_disrupted');
  enemy.vars[`epoch_iii_source_${i}_spent`]=spent;
  enemy.fleets=Array.from({length:live},raid);
  check(test(gate,ctx(enemy))===(spent<6&&(!signal||spent<3)&&(!science||spent<4)&&live<12),`Source ${i}: spent ${spent}, live ${live}, signal ${signal}, science ${science}`);
 }
 enemy.fleets=[];enemy.vars[`epoch_iii_source_${i}_spent`]=0;
 globalFlags=flags('epoch_iii_active',`epoch_iii_front_${i}_registered`,`epoch_iii_front_${i}_destroyed`);
 check(!test(gate,ctx(enemy)),`Source ${i}: destroyed source rejects queued dispatch`);
 globalFlags.delete(`epoch_iii_front_${i}_destroyed`); targets={};
 check(!test(gate,ctx(enemy)),`Source ${i}: absent source is not a spawn permit`);
 targets={[`epoch_iii_anchor_${i}`]:anchor};anchor.owner=make();
 check(!test(gate,ctx(enemy)),`Source ${i}: foreign object cannot supply reinforcements`);anchor.owner=enemy;
}
// All required fronts, ship death, fleet death and guard death are independent
// obligations. A science result never substitutes for any military obligation.
const won=['epoch_iii_active','epoch_iii_command_created','epoch_iii_command_destroyed','epoch_iii_front_1_destroyed','epoch_iii_front_2_destroyed'];
for(const fronts of [2,3,4])for(const scientific of [false,true]) {
 globalFlags=flags(...won);
 if(scientific)globalFlags.add('epoch_iii_science_support');
 for(let i=3;i<=fronts;i++) {globalFlags.add(`epoch_iii_front_${i}_registered`);globalFlags.add(`epoch_iii_front_${i}_destroyed`);}
 enemy.vars={epoch_iii_chapter:5,epoch_iii_spent:3,epoch_iii_raids_destroyed:3,epoch_iii_guards_created:fronts,epoch_iii_guards_destroyed:fronts};enemy.fleets=[];
 check(test(victoryGate,ctx(enemy)),`${fronts} fronts: earned military victory, science=${scientific}`);
 enemy.vars.epoch_iii_chapter=4;check(!test(victoryGate,ctx(enemy)),'Chapter IV cannot resolve');enemy.vars.epoch_iii_chapter=5;
 for(const blocked of ['epoch_iii_chapter_dwell']){enemy.flags.add(blocked);check(!test(victoryGate,ctx(enemy)),'Final pacing guard blocks premature report');enemy.flags.delete(blocked);}
 globalFlags.add('epoch_iii_first_repulsed');check(!test(victoryGate,ctx(enemy)),'Terminal crisis cannot award again');globalFlags.delete('epoch_iii_first_repulsed');
 for(const flag of ['epoch_iii_command_created','epoch_iii_command_destroyed',...Array.from({length:fronts},(_,i)=>`epoch_iii_front_${i+1}_destroyed`)]) {
  globalFlags.delete(flag);check(!test(victoryGate,ctx(enemy)),`Missing ${flag} cannot win`);globalFlags.add(flag);
 }
 for(const key of ['epoch_iii_raids_destroyed','epoch_iii_guards_destroyed']) {
  enemy.vars[key]--;check(!test(victoryGate,ctx(enemy)),`Missing ${key} blocks scripted removal/retreat`);enemy.vars[key]++;
 }
 for(const role of ['epoch_iii_raid','epoch_iii_guard','epoch_iii_anchor']) {
  const fleet=make();fleet.flags.add(role);enemy.fleets=[fleet];
  check(!test(victoryGate,ctx(enemy)),`Surviving ${role} blocks victory`);enemy.fleets=[];
 }
}
const victim=raid(); enemy.fromfrom=victim;enemy.from=make();enemy.fromfromfrom=make();
globalFlags=flags('epoch_iii_active');
check(test(get(E(40),'trigger'),ctx(enemy)),'Native death of identified raid with combatant is accepted');
victim.flags.add('epoch_iii_death_recorded');
check(!test(get(E(40),'trigger'),ctx(enemy)),'Repeated native death is rejected'); victim.flags.delete('epoch_iii_death_recorded');
victim.flags.add('epoch_iii_cleanup');
check(!test(get(E(40),'trigger'),ctx(enemy)),'Script cleanup cannot award military credit'); victim.flags.delete('epoch_iii_cleanup');
delete enemy.fromfromfrom;
check(!test(get(E(40),'trigger'),ctx(enemy)),'No perpetrator fleet: removal cannot masquerade as combat');enemy.fromfromfrom=make();
victim.flags.clear();check(!test(get(E(40),'trigger'),ctx(enemy)),'Unrelated victim cannot count');
victim.flags.add('epoch_iii_commandant');
check(test(get(E(41),'trigger'),ctx(enemy)),'Unique command ship death accepted independently of surviving escort');
victim.flags.clear();check(!test(get(E(41),'trigger'),ctx(enemy)),'Escort death cannot impersonate command ship');
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
const fleetSource=text('common/scripted_effects/epoch_convergence_effects.txt');
check(fleetSource.indexOf('set_global_flag = epoch_iii_full_formations_created')<fleetSource.indexOf('create_fleet ='),'Formation reservation precedes every initial spawn');
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
 walk(design,(k,v)=>{if(k==='required_component')check(componentText.includes(v),`Installed required component ${v}`);if(k==='component')check(componentText.includes(get(v,'template')),`Installed weapon/utility ${get(v,'template')}`);});
}
// UI references and new interfaces are checked against actual definitions,
// not inferred from a balanced brace tree.
const allConvergence=[...parsedByPath].filter(([p])=>p.includes('convergence'));
for(const lang of ['english','german']) {
 const entries=new Set([...text(`localisation/${lang}/epoch_convergence_l_${lang}.yml`).matchAll(/^\s*([\w.]+):\d+ /gm)].map(m=>m[1]));
 const localized=key=>check(entries.has(key),`${lang}: localization ${key}`);
 for(const [p,defs]of allConvergence) {
  walk(defs,(k,v)=>{
   if(['title','text','custom_tooltip','name','desc'].includes(k)&&typeof v==='string'&&/^(?:epoch_iii\.|NAME_EPOCH_III_)/.test(v))localized(v);
  });
  if(p.includes('/static_modifiers/'))for(const [key]of defs){localized(key);localized(key+'_desc');}
  if(p.includes('/special_projects/'))for(const [,def]of defs){const key=get(def,'key');localized(key);localized(key+'_DESC');}
  if(p.includes('/situations/'))for(const [key,def]of defs) {
   localized(key);localized(key+'_type');localized(key+'_desc');localized(key+'_monthly_change_tooltip');
   for(const [stage]of get(def,'stages'))localized(key+'_'+stage);
   for(const [field,approach]of def)if(field==='approach') {
    const name=get(approach,'name');localized(name);localized(name+'_desc');
    check(get(approach,'on_select')?.length>0,`${key}/${name}: useful selection effect or tooltip`);
   }
  }
 }
}
const modifierDoc=fs.readFileSync(path.join(docs,'modifiers.log'),'utf8');
for(const [name,body]of parsedByPath.get('common/static_modifiers/epoch_convergence_modifiers.txt'))
 for(const [key]of body)if(key!=='icon')check(modifierDoc.includes('- '+key+','),`${name}: native economic/combat modifier ${key}`);
for(const key of ['create_species','every_owned_ship','set_visited','add_intel_report','set_star_flag','every_neighbor_system'])check(effectDoc.includes(key+' -'),`Native new effect ${key}`);
check(native('events/gray_goo_events.txt').includes('diplomatic = yes'),'Native Tempest diplomatic transmission');
check(native('events/anomaly_events_1.txt').includes('portrait = "default_robot"'),'Native non-DLC robot portrait');
check(native('common/intel_categories/04_intel_military.txt').includes('intel_military_fleets'),'Native military intel contains fleet locations');
check(/category = military level = 4/.test(fleetSource),'Fleet visibility report is a real intel tier, not a 0..100 percentage');
check(/every_owned_ship = \{ set_ship_flag = epoch_iii_commandant/.test(fleetSource),'Unique command ship identified before escort creation');
for(const i of [61,62,63,64]) {
 const callback=E(i);
 check(!JSON.stringify(callback).includes('epoch_iii_first_repulsed'),`Research ${i} never resolves crisis`);
 check(get(callback,'trigger').some(([k,v])=>k==='solar_system'&&get(v,'is_same_value')===`event_target:epoch_iii_front_${i-60}`),`Research ${i} validates physical site`);
}
// Station fleets cannot accept the mobile aggressive stance reported in the
// player's log. Apply it only to native mobile formations.
walk(normalized('common/scripted_effects/epoch_convergence_effects.txt'),(k,v)=>{
 if(k==='create_fleet'&&JSON.stringify(get(v,'effect')).includes('"set_fleet_flag","epoch_iii_anchor"'))check(!JSON.stringify(v).includes('set_fleet_stance'),'Anchor has no unsupported fleet stance');
});

// Execute the parsed coordinator and absolute projection against several empire
// objects. This verifies script semantics within this explicit static subset,
// not native hooks, native scheduling, save serialization or multiplayer.
let countries=[], notices=[], commands=0;
function run(b,c) {
 let branch=false;
 for(const [k,v]of b) {
  if(k==='if'||k==='else_if') {
   const yes=(k==='if'||!branch)&&test(get(v,'limit'),c);
   if(k==='if')branch=false;
   if(yes){run(v.filter(([x])=>x!=='limit'),c);branch=true;}
   continue;
  }
  if(k==='else'){if(!branch)run(v,c);continue;}
  if(k==='set_variable'){c.obj.vars[get(v,'which')]=+get(v,'value');continue;}
  if(k==='change_variable'){const n=get(v,'which');c.obj.vars[n]=(c.obj.vars[n]||0)+ +get(v,'value');continue;}
  if(k==='set_global_flag'){globalFlags.add(v);continue;}
  if(k==='set_country_flag'){c.obj.flags.add(v);continue;}
  if(k==='set_timed_country_flag'){c.obj.flags.add(get(v,'flag'));continue;}
  if(k==='add_modifier'){c.obj.modifiers.add(get(v,'modifier'));continue;}
  if(k==='remove_modifier'){c.obj.modifiers.delete(v);continue;}
  if(k==='set_situation_progress'){c.obj.progress=+v;continue;}
  if(k==='start_situation'){(c.obj.situations??=[]).push({...make(get(v,'type')),progress:0});continue;}
  if(k==='country_event'){notices.push([c.obj,get(v,'id')]);continue;}
  if(k==='set_aggro_range_measure_from'||k==='set_aggro_range'){c.obj[k]=v;continue;}
  if(k==='epoch_iii_spawn_command'){commands++;globalFlags.add('epoch_iii_command_created');continue;}
  if(k==='every_country'||k==='every_situation'||k==='every_owned_fleet') {
   const list=k==='every_country'?countries:k==='every_situation'?c.obj.situations||[]:c.obj.fleets;
   for(const o of list){const sub=scope(o,c);if(!get(v,'limit')||test(get(v,'limit'),sub))run(v.filter(([x])=>x!=='limit'),sub);}
   continue;
  }
  if(effects.has(k)){run(effects.get(k),c);continue;}
  const obj=resolve(k,c);assert.ok(obj,'Unimplemented execution scope '+k);run(v,scope(obj,c));
 }
}
const authority=make('epoch_convergence');authority.flags.add('epoch_iii_identity_v1');
const participant=()=>{const o=make();o.flags.add('epoch_iii_enrolled');return o;};
countries=[participant(),participant()];targets={epoch_iii_country:authority};
globalFlags=flags('epoch_iii_active','epoch_iii_chapters_v2');authority.vars.epoch_iii_chapter=1;
const update=()=>run(effects.get('epoch_iii_update_chapter'),ctx(authority));
const displayed=()=>countries.map(o=>o.situations[0].progress);
update();check(JSON.stringify(displayed())==='[0,0]','Two empires start with identical chapter I');
// Personal research changes no global chapter or either display.
run(get(E(21),'immediate'),ctx(countries[0]));update();
check(countries[0].flags.has('epoch_iii_counterharmonics')&&!countries[1].flags.has('epoch_iii_counterharmonics'),'Personal research stays personal');
check(authority.vars.epoch_iii_chapter===1&&displayed().every(n=>n===0),'Personal research never advances chapter');
globalFlags.add('epoch_iii_border_crossed');update();
check(authority.vars.epoch_iii_chapter===2&&displayed().every(n=>n===21),'Physical border crossing publishes chapter II');
globalFlags.add('epoch_iii_battle_proven');update();check(authority.vars.epoch_iii_chapter===2,'Dwell prevents immediate chapter cascade');
authority.flags.delete('epoch_iii_chapter_dwell');update();
check(displayed().every(n=>n===41),'AI or player military evidence publishes chapter III to all');
const before=notices.length;update();check(notices.length===before,'Repeated dispatch cannot repeat transition reports');
// Corrupt an old local display; absolute synchronization repairs it without
// incrementing authority or reissuing chapter-entry narrative/rewards.
countries[0].situations[0].progress=0;update();check(displayed().every(n=>n===41),'Reload-style stale display repaired from saved authority');
check(notices.length===before,'Repair does not replay transition');
globalFlags.add('epoch_iii_anchor_breached');authority.flags.delete('epoch_iii_chapter_dwell');update();
check(displayed().every(n=>n===61)&&commands===1,'Breached anchor creates one command formation and chapter IV');
const newcomer=participant();countries.push(newcomer);run(effects.get('epoch_iii_sync_display'),ctx(newcomer));
check(newcomer.situations[0].progress===61,'New empire immediately inherits chapter IV');
update();check(commands===1,'Repeated coordinator cannot duplicate commandant');
authority.flags.delete('epoch_iii_chapter_dwell');update();check(authority.vars.epoch_iii_chapter===4,'Time alone cannot reach final chapter');
globalFlags.add('epoch_iii_front_1_destroyed');update();check(authority.vars.epoch_iii_chapter===4,'One remaining node blocks final chapter');
globalFlags.add('epoch_iii_front_2_destroyed');update();check(displayed().every(n=>n===81),'All physical node losses publish chapter V');
check(!globalFlags.has('epoch_iii_first_repulsed'),'Chapter V publication never grants victory');
// Saved canonical state reconstructs the same display without personal history.
const durable=JSON.parse(JSON.stringify(authority.vars));authority.vars=durable;update();
check(displayed().every(n=>n===81),'Saved chapter remains authoritative across reconstruction');

// Upgrade an old active save from global evidence, ignoring obsolete local bits.
globalFlags=flags('epoch_iii_active','epoch_iii_chapter_3');authority.vars={};authority.flags.delete('epoch_iii_chapter_dwell');
countries[0].flags.add('epoch_iii_display_3');update();
check(authority.vars.epoch_iii_chapter===3&&displayed().every(n=>n===41),'Legacy chapter III migrates once; obsolete local progress is ignored');
const migrationNotices=notices.length;update();check(notices.length===migrationNotices,'Save adoption cannot replay chapter narrative');
// Global progression has no private-history prerequisite.
check(countries.every(o=>!o.flags.has('epoch_res_complete')),'Sync fixtures have no Stage-II completion');
for(const id of [20,21,61,62,63,64])check(!/epoch_iii_(?:update_chapter|sync_display|chapter)|situation_progress/.test(JSON.stringify(E(id))), 'Research '+id+' cannot write or dispatch chapter progression');
for(const [name,body]of effects)if(name!=='epoch_iii_update_chapter'&&name!=='epoch_iii_initialize_fronts') {
 walk(body,(k,v)=>{if(k==='set_variable')check(get(v,'which')!=='epoch_iii_chapter',name+' cannot write authority');});
}
const main=parsedByPath.get('common/situations/epoch_convergence_situations.txt').find(([k])=>k==='epoch_iii_first_offensive')[1];
check(get(main,'stages').length===5,'Main situation has five named phases');
check(get(get(main,'monthly_progress'),'base')==='0','No monthly progression');
for(const [,approach]of main.filter(([k])=>k==='approach')) {
 check(!!get(approach,'modifier')&&!!get(get(approach,'resources'),'upkeep'),'Each main approach has ongoing benefits and costs');
 check(!/set_situation_progress|add_situation_progress|epoch_iii_update_chapter/.test(JSON.stringify(approach)),'Local approach cannot change global progress');
 for(const [key]of get(approach,'modifier'))check(modifierDoc.includes('- '+key+','),'Native approach modifier '+key);
}
check(effectDoc.includes('set_situation_progress -'),'Absolute situation setter supported by installed documentation');
check(native('common/on_actions/00_on_actions.txt').includes('on_entering_system_fleet ='),'Physical border hook exists in installed Vanilla');

console.log(`PASS: ${checks} Stage-III source/guard/isolation assertions. Static only; no engine, AI, save/load or MP validation.`);
