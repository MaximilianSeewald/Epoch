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
let globalFlags, targets, offset, elapsedYears=75, gameDifficulty=2;
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
  if(k==='years_passed')return compare(elapsedYears,op,+v);
  if(k==='is_difficulty')return gameDifficulty===+v;
  if(k==='has_deposit')return c.obj.deposits.has(v);
  if(k==='has_modifier')return c.obj.modifiers.has(v);
  if(k==='has_special_project')return c.obj.projects?.has(v)||false;
  if(k==='has_event_chain')return c.obj.chains?.has(v)||false;
  if(k==='has_point_of_interest')return c.obj.pois?.has(get(v,'poi'))||false;
  if(k==='is_same_value')return c.obj===resolve(v,c);
  if(k==='is_colony')return !!c.obj.colony===(v==='yes');
  if(k==='is_capital_system')return !!c.obj.capital===(v==='yes');
  if(k==='has_starbase_size')return c.obj.size===v;
  if(k==='fleet_power')return compare(c.obj.power||0,op,+v);
  if(k==='always')return v==='yes';
  if(k==='any_situation')return (c.obj.situations||[]).some(o=>test(v,scope(o,c)));
  if(k==='is_situation_type')return c.obj.type===v;
  if(k==='current_situation_approach')return c.obj.approach===v;
  if(k==='num_owned_planets')return compare(c.obj.numColonies??c.obj.planets.length,op,+v);
  if(k==='has_star_flag')return c.obj.flags.has(v);
  if(k==='has_fleet_order')return v==='move_to_system_point_order'&&(c.obj.orders||[]).some(([key])=>key==='move_to');
  if(k==='is_in_combat')return !!c.obj.combat===(v==='yes');
  if(k==='is_disabled')return !!c.obj.disabled===(v==='yes');
  if(k==='can_access_system')return c.obj.accessible?.has(resolve(v,c));
  if(k==='distance') {
   const steps=c.obj.distances?.[resolve(get(v,'source'),c)?.id]??Infinity;
   return steps>=+get(v,'min_jumps')&&steps<=+get(v,'max_jumps');
  }

  if(k==='check_variable') {
   const [valueKey,value] = v.find(([key])=>key.startsWith('value'));
   return compare(c.obj.vars[get(v,'which')]||0,split(valueKey)[1],Number.isFinite(+value)?+value:c.obj.vars[value]||0);
  }
  if(k==='resource_stockpile_compare') {
   const [valueKey,value] = v.find(([key])=>key.startsWith('value'));
   return compare(c.obj.resources[get(v,'resource')]||0,split(valueKey)[1],+value);
  }
  if(k==='count_country') {
   const [countKey,n]=v.find(([key])=>key.startsWith('count'));
   return compare(countries.filter(o=>test(get(v,'limit'),scope(o,c))).length,split(countKey)[1],+n);
  }
  if(['any_owned_fleet','any_owned_planet','any_fleet_in_system','any_system_planet','any_neighbor_system'].includes(k)) {
   const list=c.obj[k==='any_neighbor_system'?'neighbors':['any_system_planet','any_owned_planet'].includes(k)?'planets':'fleets'];
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
 for(const blocked of ['epoch_iii_chapter_dwell']){enemy.flags.add(blocked);check(test(victoryGate,ctx(enemy)),'Obsolete timing guard cannot delay earned victory');enemy.flags.delete(blocked);}
 globalFlags.add('epoch_iii_first_repulsed');check(!test(victoryGate,ctx(enemy)),'Terminal crisis cannot award again');globalFlags.delete('epoch_iii_first_repulsed');
 for(const flag of ['epoch_iii_command_created','epoch_iii_command_destroyed',...Array.from({length:fronts},(_,i)=>`epoch_iii_front_${i+1}_destroyed`)]) {
  globalFlags.delete(flag);check(!test(victoryGate,ctx(enemy)),`Missing ${flag} cannot win`);globalFlags.add(flag);
 }
 for(const key of ['epoch_iii_raids_destroyed','epoch_iii_guards_destroyed']) {
  enemy.vars[key]--;check(test(victoryGate,ctx(enemy)),`Minor-fleet counter ${key} does not delay earned victory`);enemy.vars[key]++;
 }
 for(const role of ['epoch_iii_raid','epoch_iii_guard','epoch_iii_anchor']) {
  const fleet=make();fleet.flags.add(role);enemy.fleets=[fleet];
  check(test(victoryGate,ctx(enemy)),`Surviving ${role} reference does not override confirmed objective deaths`);enemy.fleets=[];
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
 const compatible = s => s.replaceAll('\r\n','\n').replace(/[\u2018\u2019\u201a\u201b\u201c\u201d\u201e\u201f]/g,"'").replace(/[\u2013\u2014]/g,' - ').replace(/\u2026/g,'...').replace(/[\u00a0\u202f]/g,' ').replace(/[\u2010\u2011]/g,'-');
 const normalize = p.startsWith('localisation/') ? compatible : s=>s.replaceAll('\r\n','\n');
 const expected=prior.toString('utf8');
 if(p==='common/deposits/epoch_phase_ii_features.txt'){
  check(normalize(expected.replaceAll('owner = {','exists = owner owner = {'))===normalize(text(p)),p+': only native owner-existence guard added, all old modifier values preserved');
 }else if(p.startsWith('localisation/')) {
  // D1 deliberately edits prose. Preserve the merged-main key inventory;
  // test_narrative_ui and test_stage_iv_d1 validate references and text safety.
  const keys=s=>[...s.matchAll(/^\s*([\w.]+):\d+ /gm)].map(m=>m[1]).sort();
  const merged=cp.execFileSync('git',['show',`12f74555756eaab2614ecea21f0f6201cfe6f9f7:${p}`],{cwd:root,encoding:'utf8'});
  check(JSON.stringify(keys(merged))===JSON.stringify(keys(text(p))),p+': merged Stage I/II localization keys preserved');
 }else check(normalize(expected)===normalize(text(p)),p+': Stage I/II gameplay unchanged');
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
   if(['title','text','custom_tooltip','custom_tooltip_with_modifiers','name','desc'].includes(k)&&typeof v==='string'&&/^(?:epoch_iii\.|NAME_EPOCH_III_)/.test(v))localized(v);
  });
  if(p.includes('/static_modifiers/'))for(const [key]of defs){localized(key);localized(key+'_desc');}
  if(p.includes('/special_projects/'))for(const [,def]of defs){const key=get(def,'key');localized(key);localized(key+'_DESC');}
  if(p.includes('/situations/'))for(const [key,def]of defs) {
   localized(key);localized(key+'_type');localized(key+'_desc');localized(key+'_monthly_change_tooltip');
   for(const [stage]of get(def,'stages'))localized(key+'_'+stage);
   for(const [field,approach]of def)if(field==='approach') {
    const name=get(approach,'name');localized(name);localized(name+'_desc');
    if(['epoch_iii_listen','epoch_iii_watch'].includes(name))check(!!get(get(approach,'on_select'),'custom_tooltip'),`${name}: native observation tooltip prevents empty-effects warning`);
    else check(get(approach,'on_select')?.length>0,`${key}/${name}: useful selection effect`);
   }
  }
 }
}
const modifierDoc=fs.readFileSync(path.join(docs,'modifiers.log'),'utf8');
// Engine documentation reflects the mods loaded when it was generated. A
// locally declared country type generates the same native modifier family.
const convergenceDamageKey='damage_vs_country_type_epoch_convergence_mult';
const generatedConvergenceDamage=parsedByPath.get('common/country_types/epoch_convergence_country_type.txt').some(([key])=>key==='epoch_convergence')
 && modifierDoc.includes('- damage_vs_country_type_default_mult,');
for(const [name,body]of parsedByPath.get('common/static_modifiers/epoch_convergence_modifiers.txt'))
 for(const [key]of body)if(key!=='icon')check(modifierDoc.includes('- '+key+',')||(key===convergenceDamageKey&&generatedConvergenceDamage),`${name}: native economic/combat modifier ${key}`);
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
let countries=[], notices=[], commands=0, rollBranch='25';
function targetKey(v,c){const [name,key]=v.split('@');return name+(key?'@'+resolve(key,c)?.id:'');}
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
  if(k==='remove_global_flag'){globalFlags.delete(v);continue;}
  if(k==='set_country_flag'||k==='set_fleet_flag'||k==='set_ship_flag'||k==='set_planet_flag'){c.obj.flags.add(v);continue;}
  if(k==='remove_country_flag'||k==='remove_fleet_flag'){c.obj.flags.delete(v);continue;}
  if(k==='set_timed_fleet_flag'){c.obj.flags.add(get(v,'flag'));continue;}
  if(k==='clear_global_event_target'){delete targets[targetKey(v,c)];continue;}
  if(k==='save_global_event_target_as'){targets[targetKey(v,c)]=c.obj;continue;}
  if(k==='save_event_target_as'){targets[v]=c.obj;continue;}
  if(k==='clear_fleet_actions'){c.obj.clears=(c.obj.clears||0)+1;c.obj.orders=[];continue;}
  if(k==='queue_actions'){c.obj.orders=v.map(([key,val])=>[key,resolve(val,c)]);continue;}
  if(k==='closest_system') {
   const next=(c.obj.systems||[]).find(o=>test(get(v,'limit'),scope(o,c)));
   if(next)run(v.filter(([key])=>!['limit','min_steps','max_steps','use_bypasses'].includes(key)),scope(next,c));
   continue;
  }

  if(k==='set_timed_country_flag'){c.obj.flags.add(get(v,'flag'));continue;}
  if(k==='add_modifier'){c.obj.modifiers.add(get(v,'modifier'));continue;}
  if(k==='add_deposit'){c.obj.deposits.add(v);continue;}
  if(k==='random_list'){run(get(v,rollBranch),c);continue;}
  if(k==='abort_special_project'){c.obj.projects?.delete(get(v,'type'));continue;}
  if(k==='fleet_event'){(c.obj.scheduled??=[]).push(v);continue;}
  if(k==='destroy_situation'){const a=c.obj.owner.situations;a.splice(a.indexOf(c.obj),1);continue;}
  if(k==='remove_modifier'){c.obj.modifiers.delete(v);continue;}
  if(k==='set_situation_progress'){c.obj.progress=+v;continue;}
  if(k==='start_situation'){(c.obj.situations??=[]).push({...make(get(v,'type')),progress:0,target:resolve(get(v,'target'),c)});continue;}
  if(k==='country_event'){notices.push([c.obj,get(v,'id')]);continue;}
  if(k==='begin_event_chain'){(c.obj.chains??=new Set()).add(get(v,'event_chain'));continue;}
  if(k==='end_event_chain'){c.obj.chains?.delete(v);c.obj.pois?.clear();continue;}
  if(k==='create_point_of_interest'){(c.obj.pois??=new Map()).set(get(v,'id'),v);c.obj.poiCreates=(c.obj.poiCreates||0)+1;continue;}
  if(k==='remove_point_of_interest'){c.obj.pois?.delete(v);continue;}
  if(k==='set_visited'||k==='set_surveyed')continue; // no sensor simulation
  if(k==='set_aggro_range_measure_from'||k==='set_aggro_range'){c.obj[k]=v;continue;}
  if(k==='epoch_iii_spawn_command'){commands++;globalFlags.add('epoch_iii_command_created');continue;}
  if(k==='every_country'||k==='every_situation'||k==='every_owned_fleet'||k==='every_owned_planet'||k==='random_owned_fleet'||k==='random_owned_planet') {
   const list=k==='every_country'?countries:k==='every_situation'?[...(c.obj.situations||[])]:['every_owned_planet','random_owned_planet'].includes(k)?c.obj.planets:c.obj.fleets;
   for(const o of list){const sub=scope(o,c);if(!get(v,'limit')||test(get(v,'limit'),sub)){run(v.filter(([x])=>x!=='limit'),sub);if(k.startsWith('random_'))break;}}
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
globalFlags.add('epoch_iii_battle_proven');update();check(authority.vars.epoch_iii_chapter===3,'Confirmed battle immediately publishes earned discovery');
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
globalFlags.add('epoch_iii_front_2_destroyed');update();check(displayed().every(n=>n===61),'All nodes lost still lets commandant conduct its first real operation');
globalFlags.add('epoch_iii_command_engaged');update();check(displayed().every(n=>n===81),'All physical node losses and command combat publish chapter V');
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
 for(const [key]of get(approach,'modifier'))check(modifierDoc.includes('- '+key+',')||(key===convergenceDamageKey&&generatedConvergenceDamage),'Native approach modifier '+key);
}
check(effectDoc.includes('set_situation_progress -'),'Absolute situation setter supported by installed documentation');
check(native('common/on_actions/00_on_actions.txt').includes('on_entering_system_fleet ='),'Physical border hook exists in installed Vanilla');


// Fast combat must consume all earned milestones without missing the commandant.
authority.vars={epoch_iii_chapter:1};authority.fleets=[];notices=[];commands=0;
globalFlags=flags('epoch_iii_active','epoch_iii_chapters_v2','epoch_iii_battle_proven','epoch_iii_anchor_breached','epoch_iii_front_1_destroyed','epoch_iii_front_2_destroyed');
targets={epoch_iii_country:authority};update();
check(authority.vars.epoch_iii_chapter===4&&commands===1,'Rapid anchor victory immediately reaches IV and spawns commandant once');
check(countries.every(o=>o.situations[0].progress===61),'Fast milestones remain globally synchronized');
const rapidNotices=notices.length;update();check(commands===1&&notices.length===rapidNotices,'Repeated fast dispatch cannot repeat commandant or reports');
const commandFleet={...make(),owner:authority};commandFleet.flags.add('epoch_iii_command');
authority.from=make();authority.fromfrom=commandFleet;authority.fromfromfrom=make();
check(test(get(E(32),'trigger'),ctx(authority)),'Real command-fleet battle entry is a valid final chapter milestone');
run(get(E(32),'immediate'),ctx(authority));
check(authority.vars.epoch_iii_chapter===5&&displayed().every(n=>n===81),'Command combat releases earned chapter V immediately');
check(!globalFlags.has('epoch_iii_command_destroyed')&&!globalFlags.has('epoch_iii_first_repulsed'),'Entering combat grants neither death credit nor victory');
check(!/set_timed_country_flag.*epoch_iii_chapter_dwell/.test(fleetSource),'No replacement chapter delay exists');

// Front placement prefers separated, connected, safe sites.
const primary={...make(),id:'front1'},secondary={...make(),id:'front2'};
targets={epoch_iii_front_1:primary,epoch_iii_front_2:secondary};
const spaced={...make(),id:'spaced',neighbors:[{...make(),owner:make()}],distances:{front1:4,front2:3}};
check(test(triggers.get('epoch_iii_spaced_front'),ctx(spaced)),'Safely spaced connected front accepted');
spaced.distances.front1=3;check(!test(triggers.get('epoch_iii_spaced_front'),ctx(spaced)),'Fronts do not cluster around the primary');spaced.distances.front1=4;
spaced.distances.front2=2;check(!test(triggers.get('epoch_iii_spaced_front'),ctx(spaced)),'Secondary spacing also enforced');spaced.distances.front2=3;
spaced.distances.front1=Infinity;check(!test(triggers.get('epoch_iii_spaced_front'),ctx(spaced)),'Disconnected front candidate rejected');

// Final orders use actual reachable fronts, recover after path changes, and
// expose stranded locations without inventing a military result.
const home={...make(),id:'home'},battleSite={...make(),id:'battleSite',fleets:[{...make(),owner:make(),power:1000}]};
const mobile={...make(),id:'mobile',owner:authority,solar_system:home,accessible:new Set([secondary]),systems:[]};mobile.flags.add('epoch_iii_raid');home.fleets=[mobile];
globalFlags=flags('epoch_iii_active','epoch_iii_chapter_5');targets={epoch_iii_country:authority,epoch_iii_front_1:primary,epoch_iii_front_2:secondary};
const rally=()=>run(effects.get('epoch_iii_rally_fleet'),ctx(mobile));rally();
check(mobile.orders[0][1]===secondary,'Blocked primary falls back to reachable secondary front');
check(countries.every(o=>!o.situations.some(v=>v.type==='epoch_iii_front_marker')),'Fleet movement creates no additional Situation Log entries');
const clears=mobile.clears;const markerCounts=countries.map(o=>o.situations.length);rally();
check(mobile.clears===clears&&countries.every((o,i)=>o.situations.length===markerCounts[i]),'Repeated rally pulse neither interrupts orders nor duplicates markers');
mobile.flags.delete('epoch_iii_final_order_cooldown');mobile.accessible.add(primary);rally();check(mobile.orders[0][1]===secondary,'Active travel is not reset when a second route opens');
mobile.flags.delete('epoch_iii_final_order_cooldown');mobile.orders=[];rally();check(mobile.orders[0][1]===primary,'Reopened primary path is used on replan');
mobile.flags.delete('epoch_iii_final_order_cooldown');mobile.accessible.clear();rally();
check(mobile.orders.length===0&&targets['epoch_iii_final_goal@mobile']===home,'No route: group holds locally and stays marked');
mobile.flags.delete('epoch_iii_final_order_cooldown');mobile.accessible.add(battleSite);mobile.systems=[battleSite];rally();
check(mobile.orders[0][1]===battleSite,'No reachable old front: seek a reachable opponent');
mobile.flags.delete('epoch_iii_final_order_cooldown');mobile.combat=true;const engagedClears=mobile.clears;rally();
check(mobile.clears===engagedClears,'Final orders do not interrupt combat');mobile.combat=false;mobile.disabled=true;rally();
check(mobile.clears===engagedClears,'Disabled formation is located without invalid movement');
const markerType=parsedByPath.get('common/situations/epoch_convergence_situations.txt').find(([k])=>k==='epoch_iii_front_marker')[1];
const marker={...make(),target:home};check(test(get(markerType,'abort_trigger'),ctx(marker)),'Legacy fleet marker always closes');
home.fleets=[];check(test(get(markerType,'abort_trigger'),ctx(marker)),'Empty final location removes obsolete marker');
check(!globalFlags.has('epoch_iii_first_repulsed'),'Navigation and marker cleanup cannot award victory');

// Costs scale with colonies, while military upkeep/build-cost percentages also
// scale with actual fleets and construction. No positive global science/jobs buff.
const tunedMain=new Map(normalized('common/situations/epoch_convergence_situations.txt')).get('epoch_iii_first_offensive');
for(const [,approach]of tunedMain.filter(([k])=>k==='approach')) {
 const total=n=>{const o={...make(),numColonies:n};const sit={...make(),owner:o};let energy=0;for(const [k,v]of get(approach,'resources'))if(k==='upkeep'&&(!get(v,'trigger')||test(get(v,'trigger'),ctx(sit))))energy+=+get(v,'energy');return energy;};
 const base=total(1);for(const [n,factor]of [[7,1],[8,2],[19,2],[20,4],[39,4],[40,8],[100,8]])check(total(n)===base*factor,get(approach,'name')+' scales colony costs at '+n);
 const modifier=get(approach,'modifier');
 check(+(get(modifier,'all_technology_research_speed')||0)<=0&&+(get(modifier,'planet_jobs_produces_mult')||0)<=0,'No approach grants free empire-wide science or job output');
}
check(modifierDoc.includes('- '+convergenceDamageKey+',')||generatedConvergenceDamage,'Crisis damage modifier is documented or generated from the declared country type');
for(const n of [1,2,7,8,11,12,19,20,39,40,100]) {
 const c={...make(),numColonies:n};const cap=n>=40?10:n>=20?5:n>=12?3:n>=8?2:1;
 c.vars.epoch_iii_scar_worlds=cap-1;check(test(triggers.get('epoch_iii_scar_capacity'),ctx(c)),'Scaled scar allowance available at '+n);
 c.vars.epoch_iii_scar_worlds=cap;check(!test(triggers.get('epoch_iii_scar_capacity'),ctx(c)),'Scaled scar hard bound at '+n);
}
for(const [,project]of parsedByPath.get('common/special_projects/epoch_convergence_projects.txt'))if(/^EPOCH_III_SITE_/.test(get(project,'key')))check(get(project,'days_to_research')==='90','Wreck study fits the active military window');

// Local shielding never benefits intact/buffered worlds, never deletes damage,
// and is withdrawn on switching or resolution.
const defender=make();defender.flags.add('epoch_iii_shield_response');
const damaged=(mod,buffered=false)=>{const w={...make(),owner:defender};if(mod)w.modifiers.add(mod);if(buffered)w.flags.add('epoch_iii_buffered');defender.planets.push({...make(),owner:defender,planet:w,colony:w});return w;};
const heavy=damaged('epoch_iii_pressure_unprepared'),medium=damaged('epoch_iii_pressure_experienced'),light=damaged('epoch_iii_pressure_prepared'),intact=damaged(),buffered=damaged('epoch_iii_pressure_buffered',true);
globalFlags=flags('epoch_iii_active');run(effects.get('epoch_iii_update_defenses'),ctx(defender));
check(heavy.modifiers.has('epoch_iii_defense_heavy')&&medium.modifiers.has('epoch_iii_defense_medium')&&light.modifiers.has('epoch_iii_defense_light'),'Relief matches actual crisis damage');
check(![...intact.modifiers,...buffered.modifiers].some(k=>k.startsWith('epoch_iii_defense_')),'Intact and buffered planets receive no production subsidy');
defender.flags.delete('epoch_iii_shield_response');run(effects.get('epoch_iii_update_defenses'),ctx(defender));
check([heavy,medium,light].every(w=>![...w.modifiers].some(k=>k.startsWith('epoch_iii_defense_'))),'Switching removes every temporary defense modifier');
check(heavy.modifiers.has('epoch_iii_pressure_unprepared'),'Switching preserves original damage');
defender.flags.add('epoch_iii_shield_response');globalFlags.clear();run(effects.get('epoch_iii_update_defenses'),ctx(defender));
check(!heavy.modifiers.has('epoch_iii_defense_heavy'),'Crisis resolution disables temporary relief');

// First study is useful immediately, second replaces it rather than stacking.
const studiedFleet=make();authority.fleets=[studiedFleet];globalFlags=flags('epoch_iii_logistics_disrupted');run(effects.get('epoch_iii_apply_study'),ctx(authority));
check(studiedFleet.modifiers.has('epoch_iii_studied_network'),'First secured site immediately weakens hostile weapons');
globalFlags.add('epoch_iii_science_support');run(effects.get('epoch_iii_apply_study'),ctx(authority));
check(!studiedFleet.modifiers.has('epoch_iii_studied_network')&&studiedFleet.modifiers.has('epoch_iii_disrupted_network'),'Second study replaces first-stage combat penalty');
for(const id of [61,62,63,64])check(JSON.stringify(E(id)).includes('epoch_iii_apply_study'),'Every wreck callback updates combat effects immediately');
for(const key of ['closest_system','save_event_target_as'])check(effectDoc.includes(key+' -'),'Documented navigation effect '+key);


// Battle milestones work with either side of the documented hook and cannot
// grant native-death accounting or replay final chapter events.
const otherCombatant={...make(),from:authority,fromfrom:make(),fromfromfrom:commandFleet};
globalFlags=flags('epoch_iii_active','epoch_iii_chapters_v2','epoch_iii_front_1_destroyed','epoch_iii_front_2_destroyed');authority.vars.epoch_iii_chapter=4;authority.fleets=[];targets={epoch_iii_country:authority};
check(test(get(E(33),'trigger'),ctx(otherCombatant)),'Commandant recognized as the other battle combatant');
run(get(E(33),'immediate'),ctx(otherCombatant));const mirroredNotices=notices.length;run(get(E(33),'immediate'),ctx(otherCombatant));
check(authority.vars.epoch_iii_chapter===5&&notices.length===mirroredNotices,'Mirrored battle notifications cannot duplicate final chapter');
check(!globalFlags.has('epoch_iii_command_destroyed'),'Mirrored battle start cannot replace destruction proof');

// Commandant makes an actual rescue move toward a threatened living node.
const secureSystem={...make(),id:'secure',fleets:[]},threatenedSystem={...make(),id:'threatened',fleets:[{...make(),owner:make(),power:2000}]};
const secureAnchor={...make(),solar_system:secureSystem},threatenedAnchor={...make(),solar_system:threatenedSystem};
for(const f of [secureAnchor,threatenedAnchor])f.flags.add('epoch_iii_anchor');
const commander={...make(),id:'commander',owner:authority,solar_system:home,accessible:new Set([secureSystem,threatenedSystem]),systems:[]};commander.flags.add('epoch_iii_command');home.fleets=[commander];
authority.fleets=[secureAnchor,threatenedAnchor];globalFlags=flags('epoch_iii_active');targets={epoch_iii_country:authority};run(effects.get('epoch_iii_command_move'),ctx(commander));
check(commander.orders[0][1]===threatenedSystem,'Commandant reinforces the threatened node ahead of an unthreatened one');
commander.flags.delete('epoch_iii_command_order_cooldown');const commandClears=commander.clears;run(effects.get('epoch_iii_command_move'),ctx(commander));
check(commander.clears===commandClears,'Command travel is not canceled on each planning pulse');
commander.flags.delete('epoch_iii_command_order_cooldown');commander.orders=[];authority.fleets=[];commander.systems=[battleSite];commander.accessible=new Set([battleSite]);run(effects.get('epoch_iii_command_move'),ctx(commander));
check(commander.orders[0][1]===battleSite,'After losing all nodes, commandant seeks an accessible opponent');
check(triggerDoc.includes('has_fleet_order -')&&effectDoc.includes('closest_system -'),'Movement guards use documented native interfaces');

// Post-playtest changes: exercise bounded state transitions, not an engine mock.
for(const empireClass of ['organic','hive','machine']) {
 const colony={...make(),owner:make()};colony.flags.add('epoch_iii_exposed_v1');
 globalFlags=flags('epoch_iii_active');targets={};
 const tick=()=>run(effects.get('epoch_iii_contamination_tick'),ctx(colony));
 for(let m=0;m<11;m++)tick();
 check(!colony.modifiers.has('epoch_iii_contamination_rising'),empireClass+': no premature annual escalation');tick();
 check(colony.modifiers.has('epoch_iii_contamination_rising'),empireClass+': first annual step');
 for(let m=0;m<12;m++)tick();
 check(colony.modifiers.has('epoch_iii_contamination_severe')&&!colony.modifiers.has('epoch_iii_contamination_rising'),empireClass+': second step replaces first');
 for(let m=0;m<120;m++)tick();check(colony.vars.epoch_iii_contamination_tier===2,empireClass+': decade cannot exceed two steps');
 for(const blocker of ['epoch_iii_contained','epoch_iii_buffered','epoch_iii_treated']) {
  colony.vars={};colony.flags.add(blocker);for(let m=0;m<24;m++)tick();
  check(!colony.vars.epoch_iii_contamination_tier,blocker+' stops local worsening');colony.flags.delete(blocker);
 }
 colony.vars={};globalFlags.add('epoch_iii_scar_disabled');for(let m=0;m<24;m++)tick();
 check(!colony.vars.epoch_iii_contamination_tier,empireClass+': source destruction stops escalation');
 globalFlags=flags('epoch_iii_first_repulsed');for(let m=0;m<24;m++)tick();
 check(!colony.vars.epoch_iii_contamination_tier&&colony.modifiers.has('epoch_iii_contamination_severe'),empireClass+': victory stops worsening without free healing');
}
const viewer=participant();countries=[viewer];targets={};
for(let i=1;i<=4;i++)targets['epoch_iii_front_'+i]=make();
globalFlags=flags('epoch_iii_active');
const syncTargets=()=>run(effects.get('epoch_iii_sync_targets'),ctx(viewer));syncTargets();
check(viewer.pois.size===4&&viewer.chains.size===1,'Four native POIs share one chain without a progress counter');
check([...viewer.pois.values()].every(p=>get(p,'name')==='epoch_iii.poi.unknown'),'Functions remain unclassified before military knowledge');
syncTargets();check(viewer.poiCreates===4,'Repeated pulse cannot duplicate unknown contacts');
globalFlags.add('epoch_iii_battle_proven');syncTargets();
check(viewer.poiCreates===8&&get(viewer.pois.get('epoch_iii_site_2'),'name')==='epoch_iii.poi.2','Battle knowledge replaces contacts with functional descriptions once');
syncTargets();check(viewer.poiCreates===8,'Known contacts remain stable after reload-style repeat');
globalFlags.add('epoch_iii_front_2_destroyed');syncTargets();check(!viewer.pois.has('epoch_iii_site_2'),'Destroyed source removes its POI');
viewer.chains.clear();viewer.pois.clear();syncTargets();check(viewer.pois.size===3,'Lost chain reconstructs exactly the surviving contacts');
globalFlags.add('epoch_iii_front_1_destroyed');globalFlags.add('epoch_iii_front_3_destroyed');globalFlags.add('epoch_iii_front_4_destroyed');syncTargets();
check(viewer.chains.size===0,'All anchor losses remove the empty chain even with commandant alive');
globalFlags.delete('epoch_iii_active');syncTargets();check(viewer.chains.size===0&&viewer.pois.size===0,'Resolution removes the chain and remaining POIs');
check(!/start_situation\s*=\s*\{\s*type\s*=\s*epoch_iii_front_marker/.test(fleetSource),'No code creates legacy anchor/command/minor-fleet situations');
const stageIcons=get(main,'stages').map(([,b])=>get(b,'icon'));
check(new Set(stageIcons).size===5&&stageIcons.every(icon=>native('interface/situation_log.gfx').includes('"'+icon+'"')),'Five distinct installed chapter icons');
for(const id of [70,71]) {
 const survivor={...make(),owner:authority};survivor.flags.add('epoch_iii_cleanup');globalFlags=flags('epoch_iii_active');
 check(!test(get(E(id),'trigger'),ctx(survivor)),'Retirement '+id+' impossible before victory');
 globalFlags=flags('epoch_iii_first_repulsed');
 if(id===70)survivor.flags.delete('epoch_iii_cleanup');
 check(test(get(E(id),'trigger'),ctx(survivor)),'Retirement '+id+' allowed only after earned terminal milestone');
}
check(JSON.stringify(E(70)).includes('move_to')&&JSON.stringify(E(70)).includes('120'),'Native withdrawal has a bounded 120-day final dispersal');
for(const id of [21,40,41])check(get(E(id),'trigger').some(([k,v])=>k==='has_global_flag'&&v==='epoch_iii_active'),'Queued callback '+id+' cannot award military buffs or death credit after resolution');
for(const project of ['COUNTERHARMONICS','SITE_1','SITE_2','SITE_3','SITE_4'])check(JSON.stringify(effects.get('epoch_iii_cleanup_war')).includes('EPOCH_III_'+project),'Cleanup aborts '+project);
check(get(E(51),'diplomatic')==='yes'&&JSON.stringify(E(51)).includes('epoch_iii_command_transmitted'),'Command escalation uses guarded native diplomatic presentation');
check(get(get(E(10),'picture_event_data'),'portrait')===get(get(E(51),'picture_event_data'),'portrait'),'Both transmissions use the same reliable portrait');
const decisions=new Map(normalized('common/decisions/epoch_convergence_decisions.txt'));
for(const key of ['contain','investigate','treat'])check(+get(get(get(decisions.get('decision_epoch_iii_'+key),'resources'),'cost'),'energy')>0,key+' has real resource costs');
check(!JSON.stringify(get(decisions.get('decision_epoch_iii_treat'),'potential')).includes('epoch_iii_active'),'Planetary treatment remains available after crisis');
check(JSON.stringify(decisions.get('decision_epoch_iii_investigate')).includes('random_list'),'Uncontained investigation has an actual probabilistic accident');
for(const year of [50,100,150])for(const difficulty of [0,2,4,5,6]) {
 elapsedYears=year;gameDifficulty=difficulty;
 const formation=make();formation.flags.add('epoch_iii_anchor');formation.modifiers.add('epoch_iii_disrupted_network');authority.fleets=[formation];
 run(effects.get('epoch_iii_update_strength'),ctx(authority));
 const tier=year>=100?(difficulty>=5?'hard':'late'):'base';
 check(formation.modifiers.has('epoch_iii_force_'+tier),`Bounded force tier: year ${year}, difficulty ${difficulty}`);
 const initial=[...formation.modifiers].sort().join();
 for(let pulse=0;pulse<24;pulse++)run(effects.get('epoch_iii_update_strength'),ctx(authority));
 check(initial===[...formation.modifiers].sort().join(),'Strength does not stack or erase science after repeated dispatch');
 check(formation.modifiers.has('epoch_iii_bastion_hull'),'Anchors gain their independent fortification boost');
}
const supportCreates=effects.get('epoch_iii_create_support_stations').filter(([k])=>k==='create_fleet');
check(supportCreates.length===2,'Two support stations are separate physical fleets');
for(const [,station]of supportCreates){
 const body=get(station,'effect');
 check(body.filter(([k])=>k==='create_ship').length===1,'Each support fleet contains one station');
 check(get(get(body,'set_location'),'target')==='event_target:epoch_iii_station_site.star','Support station uses a physical star location');
 check(!JSON.stringify(body).includes('set_fleet_stance'),'Station creation avoids unsupported mobile stance');
}
check(native('gfx/models/ships/ai_01/_ai_01_ships_entities.asset').includes('ai_01_military_station_large_ai_entity'),'Large physical station has an installed graphical entity');
check(native('gfx/models/ships/ai_01/_ai_01_ships_entities.asset').includes('ai_01_military_station_small_ai_entity'),'Small physical station has an installed graphical entity');
for(const lang of ['english','german'])for(const file of fs.readdirSync(path.join(root,'localisation',lang)).filter(f=>f.endsWith('.yml'))) {
 const p=path.join(root,'localisation',lang,file), bytes=fs.readFileSync(p),loc=bytes.toString('utf8');
 check(new TextDecoder('utf-8',{fatal:true}).decode(bytes).length>0,file+': valid UTF-8');
 check(bytes.subarray(0,3).equals(Buffer.from([239,187,191])),file+': all localization is UTF-8 BOM');
 check(!/[\u2010\u2011\u2013-\u201f\u2026\u202f\ufffd]/.test(loc),file+': no known unsupported punctuation or replacement characters');
 if(lang==='german')check(/[äöüß]/.test(loc),file+': German letters retained');
 if(lang==='english')check(loc.includes("'"),file+': ordinary apostrophes retained');
}
// Final corrections after the successful third connected player test.
// Actual parsed chapter/resolution scripts, including repeat/reload-style calls.
for(const fronts of [2,3,4])for(const finalCommandKill of [false,true]) {
 countries=[participant(),participant()];notices=[];
 authority.vars={epoch_iii_chapter:4};authority.fleets=[];
 targets={epoch_iii_country:authority};
 globalFlags=flags('epoch_iii_active','epoch_iii_chapters_v2','epoch_iii_command_created','epoch_iii_command_engaged');
 for(let i=1;i<=fronts;i++){globalFlags.add(`epoch_iii_front_${i}_registered`);globalFlags.add(`epoch_iii_front_${i}_destroyed`);}
 if(finalCommandKill)globalFlags.add('epoch_iii_command_destroyed');
 update();
 check(authority.vars.epoch_iii_chapter===5&&displayed().every(n=>n===81),'Final military milestone still synchronizes chapter V');
 check(notices.filter(([,id])=>id==='epoch_iii.52').length===(finalCommandKill?0:2),'Simultaneous victory suppresses only chapter-V narrative');
 if(!finalCommandKill){
  check(test(get(E(52),'trigger'),ctx(countries[0])),'Earlier chapter V can display its own event');
  run(get(E(52),'immediate'),ctx(countries[0]));
  check(!test(get(E(52),'trigger'),ctx(countries[0])),'Chapter-V presentation reserves a durable per-country guard');
 }
 globalFlags.add('epoch_iii_command_destroyed');
 // Destroying the situation is native; attach the owner used by this evaluator.
 for(const c of countries)for(const s of c.situations)s.owner=c;
 run(resolution,ctx(authority));
 check(globalFlags.has('epoch_iii_first_repulsed')&&!globalFlags.has('epoch_iii_active'),'Final kill resolves immediately');
 check(notices.filter(([,id])=>id==='epoch_iii.12').length===2,'Exactly one victory report per participant');
 check(!test(get(E(52),'trigger'),ctx(countries[1])),'Queued chapter-V report cannot appear after final kill');
 for(let i=0;i<3;i++){update();run(resolution,ctx(authority));}
 check(notices.filter(([,id])=>id==='epoch_iii.12').length===2,'Repeated parallel/reload-style callback cannot duplicate victory');
}

const spread=effects.get('epoch_iii_spread_tick');
const spreadSetup=(n=20)=>{
 const empire={...participant(),numColonies:n};
 const add=()=>{const colony={...make(),owner:empire};empire.planets.push({...make(),owner:empire,planet:colony,colony});return colony;};
 const source=add();source.flags.add('epoch_iii_exposed_v1');source.modifiers.add('epoch_iii_pressure_unprepared');
 for(let i=0;i<9;i++)add();
 globalFlags=flags('epoch_iii_active','epoch_iii_front_2_registered');
 targets={epoch_iii_anchor_2:{...make(),owner:authority}};rollBranch='25';
 run(spread,ctx(empire)); // reserve the first native 360-day interval
 let months=0;
 return {empire,source,tick:()=>{
  if(++months%12===0)empire.flags.delete('epoch_iii_spread_cooldown'); // explicit native-expiry boundary
  run(spread,ctx(empire));
 }};
};
{
 const {empire}=spreadSetup();
 for(let battle=0;battle<1000;battle++)run(spread,ctx(empire));
 check(!empire.vars.epoch_iii_spread_attempts&&!empire.vars.epoch_iii_spread_worlds,'Battle callbacks cannot accelerate the native annual cooldown');
 const restored=structuredClone(empire);for(let pulse=0;pulse<100;pulse++)run(spread,ctx(restored));
 check(restored.flags.has('epoch_iii_spread_cooldown')&&!restored.vars.epoch_iii_spread_attempts,'Reload-style restored cooldown does not reopen attempts');
 check(JSON.stringify(spread).includes('"days","360"'),'Native cooldown is explicitly 360 days');
}
for(const [n,cap]of [[1,1],[7,1],[8,2],[19,2],[20,3],[40,3],[100,3]]) {
 const {empire,tick}=spreadSetup(n);
 for(let m=0;m<11;m++)tick();check(!empire.vars.epoch_iii_spread_attempts,'No transmission roll before twelve active months');
 tick();check(empire.vars.epoch_iii_spread_worlds===1,'One annual opportunity infects at most one same-owner colony');
 for(let m=0;m<1200;m++)tick();
 check(empire.vars.epoch_iii_spread_attempts===3,'Three attempts total even over a century of monthly pulses');
 check(empire.vars.epoch_iii_spread_worlds===cap,'Lifetime imported-world cap at '+n+' colonies');
 check(empire.planets.filter(p=>p.colony.flags.has('epoch_iii_spread_received')).length===cap,'Physical infections match bounded country count');
 for(const p of empire.planets.filter(p=>p.colony.flags.has('epoch_iii_spread_received'))){
  check(p.colony.deposits.has('d_epoch_resonance_contamination_active'),'New exposure has a real planetary feature');
  check(!test(triggers.get('epoch_iii_spread_source'),ctx(p.colony)),'Imported infection never becomes a source');
 }
}
for(const blocker of ['epoch_iii_contained','epoch_iii_buffered','epoch_iii_treated','epoch_iii_spread_received']) {
 const {empire,source,tick}=spreadSetup();source.flags.add(blocker);
 for(let m=0;m<36;m++)tick();check(!empire.vars.epoch_iii_spread_worlds,blocker+' stops transmission');
}
for(const stop of ['anchor_destroyed','anchor_absent','anchor_foreign','crisis_over']) {
 const {empire,tick}=spreadSetup();tick();
 if(stop==='anchor_destroyed')globalFlags.add('epoch_iii_scar_disabled');
 if(stop==='anchor_absent')delete targets.epoch_iii_anchor_2;
 if(stop==='anchor_foreign')targets.epoch_iii_anchor_2.owner=make();
 if(stop==='crisis_over')globalFlags.delete('epoch_iii_active');
 for(let m=0;m<120;m++)tick();check(!empire.vars.epoch_iii_spread_attempts&&!empire.vars.epoch_iii_spread_worlds,stop+' stops new transmission');
}
{
 const {empire,tick}=spreadSetup();rollBranch='75';for(let m=0;m<120;m++)tick();
 check(empire.vars.epoch_iii_spread_attempts===3&&!empire.vars.epoch_iii_spread_worlds,'Failed rolls consume their finite opportunities');
 const success=get(get(spread,'if'),'else_if');
 check(JSON.stringify(success).includes('random_list')&&JSON.stringify(success).includes('"75"')&&JSON.stringify(success).includes('"25"'),'One 25% roll is explicit in the parsed script');
}
{
 const {empire,source,tick}=spreadSetup();
 for(const [deposit]of parsedByPath.get('common/deposits/epoch_phase_ii_features.txt')){
  const candidate=empire.planets[1].colony;candidate.deposits=flags(deposit);
  check(!test(triggers.get('epoch_iii_spread_target'),ctx(candidate)),'Every old active/completed deposit rejects infection: '+deposit);
 }
 const candidate=empire.planets[1].colony;candidate.deposits.clear();
 for(const [,flag]of get(triggers.get('epoch_iii_spread_target'),'NOR').filter(([k])=>k==='has_planet_flag')){
  candidate.flags=flags(flag);check(!test(triggers.get('epoch_iii_spread_target'),ctx(candidate)),'Legacy/protected flag rejects infection: '+flag);
 }
 candidate.flags.clear();
 for(const active of ['epoch_core_campaign_active','epoch_res_active','epoch_ii_active']){
  empire.flags.add(active);check(!test(triggers.get('epoch_iii_spread_target'),ctx(candidate)),'Active old campaign rejects infection: '+active);empire.flags.delete(active);
 }
 for(const target of ['epoch_core_world','epoch_core_structure_site','epoch_ii_target_planet']){
  empire.id='spreadOwner';targets[target+'@spreadOwner']=candidate;
  check(!test(triggers.get('epoch_iii_spread_target'),ctx(candidate)),'Canonical old objective rejects infection: '+target);delete targets[target+'@spreadOwner'];
 }
 for(let m=0;m<12;m++)tick();source.flags.add('epoch_iii_contained');
 const count=empire.vars.epoch_iii_spread_worlds;for(let m=0;m<120;m++)tick();
 check(count===1&&empire.vars.epoch_iii_spread_worlds===count,'Contained original plus imported colonies cannot form a chain');
 check(empire.planets[1].colony.modifiers.has('epoch_iii_scar_pressure'),'Stopping transmission leaves existing damage');
}
check(!JSON.stringify(spread).includes('country_event')&&!JSON.stringify(spread).includes('while'),'Transmission adds neither mandatory events nor loops');
check(JSON.stringify(E(2)).includes('epoch_iii_spread_tick'),'Existing monthly coordinator invokes finite spread');
for(const id of [1,2]){
 const species=[];walk(E(id),(k,v)=>{if(k==='create_species')species.push(v);});
 check(species.length===1&&get(species[0],'class')==='ROBOT'&&get(species[0],'namelist')==='MACHINE1','Creation/recovery use explicit ROBOT namelist');
 check(JSON.stringify(species[0]).includes('trait_machine_unit'),'Nullwarden machine identity retained');
}
check(/class = ROBOT\s+name = NAME_Surveillance_Bots\s+namelist = "MACHINE1"/.test(native('events/ancient_relics_arcsite_events_2.txt')),'Installed 4.5.3 explicitly uses ROBOT plus MACHINE1');
check(fs.existsSync(path.join(vanilla,'common/name_lists/MACHINE1.txt')),'Machine namelist exists in installed Vanilla');
check(!JSON.stringify(E(70)).includes('set_fleet_stance'),'End-of-crisis retirement never requests unsupported evasive stance');
check(JSON.stringify(E(70)).indexOf('epoch_iii_cleanup')<JSON.stringify(E(70)).indexOf('clear_fleet_actions'),'Cleanup marking precedes withdrawal commands');
const forceModifiers=new Map(normalized('common/static_modifiers/epoch_convergence_modifiers.txt'));
for(const [tier,oldDamage,oldHull]of [['base',.15,.20],['late',.25,.35],['hard',.35,.50]]){
 const b=forceModifiers.get('epoch_iii_force_'+tier);
 for(const science of [0,-.1,-.2]){
  const increase=(1+ +get(b,'ship_weapon_damage')+science)/(1+oldDamage+science)-1;
  check(increase>=.10&&increase<=.15,'Actual weapon-damage increase stays within 10-15%: '+tier+'/'+science);
 }
 check(+get(b,'ship_hull_mult')===oldHull&&b.length===2,'No compounded durability/rate/size multiplier: '+tier);
}
for(const lang of ['english','german']){
 const loc=new Map([...text(`localisation/${lang}/epoch_convergence_l_${lang}.yml`).matchAll(/^\s*([\w.]+):0 "(.*)"/gm)].map(m=>[m[1],m[2]]));
 const ui=[...loc].filter(([k])=>/\.tt$|_goal$|_objectives$|_desc$|_DESC$|\.poi\..*desc$|monthly_change_tooltip$|\.front\./.test(k)&&!/^epoch_iii\.\d+\./.test(k));
 for(const [k,v]of ui){
  check(v.length<=200,'Concise Stage-III UI text: '+lang+'/'+k);
  check(!/\b(?:later chapters?|future events?|second (?:distinct )?study|final engagement begins|spätere[nrs]? Kapitel|zukünftige[nrs]? Ereignisse|zweite[nrs]? Untersuchung)\b/i.test(v),'No future chapter instructions: '+lang+'/'+k);
  check(!/epoch_iii[._]|epoch_core[._]|epoch_res[._]|epoch_ii[._]/.test(v.replace(/\$[^$]+\$/g,'')),'No internal flags/event IDs: '+lang+'/'+k);
 }
}
for(const id of [10,11,50,51,52])for(const [,option]of E(id).filter(([k])=>k==='option'))if(get(option,'name')==='epoch_iii.acknowledge')check(!get(option,'custom_tooltip'),'Acknowledgment '+id+' has no instructional tooltip');
for(const key of ['investigate','treat','buffer','contain'])check(get(get(decisions.get('decision_epoch_iii_'+key),'effect'),'tooltip')?.length>0,'Native planetary preview: '+key);
// Successful native preparation callback ends only its own preparation situation.
{
 const c=structuredClone(eligible);c.flags.delete('epoch_iii_prepared');
 const preparation={...make('epoch_iii_preparations'),owner:c};
 const unrelated={...make('unrelated_situation'),owner:c};c.situations=[preparation,unrelated];
 globalFlags=flags('epoch_iii_schema_v1');notices=[];offset=-1;
 check(test(get(E(20),'trigger'),ctx(c)),'preparation callback accepts real completion before midgame');
 run(get(E(20),'immediate'),ctx(c));
 check(c.flags.has('epoch_iii_prepared')&&c.situations.length===1&&c.situations[0]===unrelated,'completion removes exactly the preparation situation');
 check(notices.length===1&&notices[0][1]==='epoch_iii.22','one clear completion notice');
 check(globalFlags.size===1&&!globalFlags.has('epoch_iii_active')&&!globalFlags.has('epoch_iii_reserved'),'preparation does not start or reserve the crisis');
 check(!test(get(E(20),'trigger'),ctx(c)),'duplicate completion cannot repeat the notice');
 const prep=new Map(normalized('common/situations/epoch_convergence_situations.txt')).get('epoch_iii_preparations');
 check(test(get(prep,'abort_trigger'),scope({...make('epoch_iii_preparations'),owner:c},ctx(c))),'already-prepared legacy save closes preparation');
 for(const approach of prep.filter(([k])=>k==='approach').map(([,v])=>v))check(!!get(get(approach,'on_select'),'custom_tooltip'),'each preparation approach has a nonempty native tooltip');
 check(!JSON.stringify(E(22)).includes('epoch_iii_start')&&!JSON.stringify(E(20)).includes('epoch_iii_start'),'completion report has no outbreak call');
}
console.log(`PASS: ${checks} Stage-III source/guard/isolation assertions. Static only; no engine, AI, save/load or MP validation.`);
