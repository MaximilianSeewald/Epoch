// Source-derived contract checks and a small effect interpreter. This exercises
// EPOCH's scripts, not a separately authored campaign model or the game engine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {get, parsedByPath: parsed, sourceByPath: source, countDeep} = require('./test_clausewitz_structure.cjs');
let checks = 0;
const check = (v, m) => { checks++; assert.ok(v, m); };
const all = [...source.values()].join('\n');
const eventDefs = new Map();
for (const [p, defs] of parsed) if (p.startsWith('events/')) for (const [kind,b] of defs) {
  const id = Array.isArray(b) && get(b,'id');
  if (!id) continue;
  check(!eventDefs.has(id), `Duplicate event ${id}`);
  eventDefs.set(id,{kind,b});
}
const effects = new Map([...parsed].filter(([p])=>p.startsWith('common/scripted_effects/')).flatMap(([,v])=>v));
const projects = new Map([...parsed].filter(([p])=>p.startsWith('common/special_projects/')).flatMap(([,v])=>v.map(([,b])=>[get(b,'key').replaceAll('"',''),b])));
const decisions = new Map(parsed.get('common/decisions/epoch_resonance_decisions.txt'));
const E = id => eventDefs.get(`epoch_res.${id}`).b;
const stages = get(parsed.get('common/situations/epoch_phase_ii_situations.txt')[0][1],'stages');
check(stages.length===5,'Exactly five situation chapters');
check(!/on_first_enter|on_monthly|add\s*=/.test(source.get('common/situations/epoch_phase_ii_situations.txt')),'Situation never dispatches or advances unmet objectives');
check(get(get(parsed.get('common/situations/epoch_phase_ii_situations.txt')[0][1],'monthly_progress'),'base')==='0','No passive progress');
check(!source.has('events/epoch_phase_ii_block_c_events.txt'),'Old Block C removed');
check(!source.has('common/component_templates/epoch_phase_ii_components.txt'),'Later military components retired');
for (const [id,{b}] of eventDefs) if (id.startsWith('epoch_ii.') && !['epoch_ii.0','epoch_ii.1'].includes(id)) {
  check(!get(b,'immediate')&&!get(b,'option'),'Queued legacy receivers are inert');
}
for (const ref of all.matchAll(/\bid\s*=\s*(epoch_(?:core|ii|res)\.\d+)/g)) check(eventDefs.has(ref[1]),`Defined event ${ref[1]}`);
for (const ref of all.matchAll(/\b(?:type|name)\s*=\s*(EPOCH_[A-Z_]+)/g)) check(projects.has(ref[1]),`Defined project ${ref[1]}`);
const triggers = new Map([...parsed].filter(([p])=>p.startsWith('common/scripted_triggers/')).flatMap(([,v])=>v));
for (const name of new Set([...all.matchAll(/\b(epoch_(?:core|ii|res)_[a-z_]+)\s*=\s*yes/g)].map(m=>m[1]))) check(effects.has(name)||triggers.has(name),`Defined scripted effect/trigger ${name}`);
const newProjects = [...projects].filter(([key])=>key.startsWith('EPOCH_RES_'));
function findNested(pairs,key){for(const [k,v]of pairs||[]){if(k===key)return v;if(Array.isArray(v)){const found=findNested(v,key);if(found)return found;}}}
const projectForCallback=new Map(newProjects.map(([key,b])=>[get(findNested(get(b,'on_success'),'ship_event'),'id'),[key,b]]));
check(newProjects.length===9,'Eight required investigations and optional reconnaissance');
for (const [key,b] of newProjects) {
  check(get(b,'event_scope')==='ship_event',`${key} ship scope`);
  check(get(get(b,'requirements'),'leader')==='scientist',`${key} staffed scientist`);
  check(get(get(b,'requirements'),'shipclass_science_ship')==='1',`${key} real science ship`);
  check(get(b,'location')==='yes',`${key} visible target`);
  const callbackScopes=get(findNested(get(b,'on_success'),'ship_event'),'scopes');
  check(get(callbackScopes,'from')==='from',`${key} preserves observed native Country From`);
  check(get(callbackScopes,'fromfrom')===`event_target:epoch_res_project_${key.slice(10).toLowerCase()}@this`,`${key} explicit ship-bound destination, not native FromFrom guess`);
  check(JSON.stringify(get(b,'on_start')).includes('save_global_event_target_as'),`${key} persists the assigned project target at start`);
  check(!get(b,'timelimit'),`${key} interrupted work does not expire in a loop`);
  check(!get(b,'on_fail').length&&!get(b,'on_cancel').length,`${key} failure grants no success`);
}
const clock = effects.get('epoch_ii_start_invitation_clock');
const delays = [...source.get('common/scripted_effects/epoch_core_effects.txt').matchAll(/country_event = \{ id = epoch_ii\.1 days = (\d+)/g)].map(m=>+m[1]);
check(delays.length===7&&delays.every(v=>v>=1800&&v<=1960),'Owner-local five-year clock with bounded staggering');
check(JSON.stringify(clock).includes('epoch_ii_invitation_clock_started'),'Clock exact-once flag');
check(JSON.stringify(eventDefs.get('epoch_ii.1').b).includes('epoch_ii_invitation_clock'),'Entry waits for persisted timer expiry');
check(JSON.stringify(E(201)).includes('fromfrom')&&JSON.stringify(E(201)).includes('epoch_res_hunters'),'Victory examines destroyed marked fleet');
check(!JSON.stringify(E(201)).includes('epoch_res_hunters@'),'Missing target never proves victory');
check(!JSON.stringify(E(201)).includes('is_in_combat')&&JSON.stringify(E(201)).includes('epoch_res_owner_participated')&&JSON.stringify(E(201)).includes('epoch_res_engagement_system@this'),'Allied finish uses this destroyed fleet engagement, independent of exit ordering');
check(JSON.stringify(E(200)).includes('fromfromfrom')&&JSON.stringify(E(203)).includes('epoch_res.204'),'Join tracks all native fleet slots; exit defers record disposal');
check(!JSON.stringify(get(E(202),'immediate')).includes('epoch_res_chapter'),'Own loss never advances chapter');
check(countDeep(E(20),'create_fleet')===1,'One native fleet spawn site');
check(JSON.stringify(E(20)).includes('epoch_res_force_scaled')&&JSON.stringify(E(20)).includes('epoch_res_force_reissued'),'Scale once, at most one explicit replacement');
check(!all.includes('give_technology'),'No free researched technologies');
const techDefs = parsed.get('common/technology/epoch_phase_ii_technologies.txt');
check(techDefs.length===2,'Only early spectroscopy and infrastructure technology');
check(parsed.get('common/buildings/epoch_phase_ii_buildings.txt').length===2,'Two useful infrastructure unlocks');
check(decisions.size===8,'Seven containment actions and explicit recovery');
for (const [name,b] of decisions) if (!name.endsWith('resume')) {
  check(get(get(b,'resources'),'cost').length>0,`${name} native resource cost`);
  check(get(b,'allow').length>0&&get(b,'effect').length>0,`${name} active requirements and effects`);
  check(JSON.stringify(get(b,'potential')).includes('epoch_ii_target_planet@owner'),`${name} rejects foreign/stale worlds`);
}
check(countDeep(effects.get('epoch_ii_clear_site_state'),'epoch_core_clear_contamination_deposits')===1,'Shared family clear');
check(!JSON.stringify(effects.get('epoch_ii_clear_site_state')).includes('epoch_core_contamination_active_state'),'Old Stage-I penalties survive');
check(JSON.stringify(E(59)).includes('epoch_res_interrupted_complete'),'All three station results gate handoff');
const handoffWriters = [...eventDefs].filter(([,{b}])=>JSON.stringify(b).includes('"set_country_flag","epoch_res_stage_iii_ready"'));
check(handoffWriters.length===1&&handoffWriters[0][0]==='epoch_res.59','Only final validated event writes Stage-III handoff');
check(!/epoch_(?:iii|iv)\.\d/.test(all),'No automatic later-stage crisis');
const nodeSource=source.get('common/scripted_effects/epoch_resonance_effects.txt');
check(nodeSource.includes('epoch_res_reflection_system@root')&&nodeSource.includes('epoch_res_silence_system@root')&&nodeSource.includes('epoch_res_interrupted_system@root'),'Three owner-keyed system targets');
check(countDeep(effects.get('epoch_res_find_interrupted'),'NOT')===3,'Third station excludes previous systems and the capital');

// Fail closed on unsupported interpreter operations, except explicitly marked
// presentation/native object commands; this is not an engine implementation.
const make = (id,kind='country')=>({id,kind,flags:new Set(),vars:{},resources:{energy:5000,alloys:1000,minerals:1000},projects:new Set(),deposits:new Set(),modifiers:new Set(),tech:new Set(),fleets:[]});
let targets,locals,queued,spawns,countries;
function flagKey(name,c) { const [base,key]=name.split('@'); return key?base+'@'+resolve(key,c)?.id:name; }
function resolve(name,c) {
  if(name==='root.owner')return c.root.owner;
  if(name==='root.solar_system')return c.root.system;
  if(name==='root')return c.root;
  if(name==='this')return c.obj;
  if(name==='prev')return c.prev;
  if(name==='owner')return c.obj.owner;
  if(name==='from')return c.from;
  if(name==='fromfrom')return c.fromfrom;
  if(name==='fromfromfrom')return c.fromfromfrom;
  if(name==='capital_scope')return c.obj.capital;
  if(name==='solar_system')return c.obj.system;
  if(name==='planet')return c.obj.kind==='planet'?c.obj:c.obj.planet;
  if(name==='archaeological_site')return c.obj.archSite||c.obj.planet?.archSite;
  if(name.startsWith('event_target:')) {
    const [base,key]=name.slice(13).split('@');
    const target=key?targets.get(base+'@'+resolve(key,c)?.id):locals.get(base);
    return target?.alive===false?undefined:target;
  }
}
function ctx(obj,c){return {...c,obj,prev:c.obj};}
function test(b,c) {
  return b.every(([k,v])=>{
    if(k==='NOT'||k==='NOR')return !v.some(pair=>test([pair],c));
    if(k==='OR')return v.some(pair=>test([pair],c));
    if(k==='AND'||k==='limit')return test(v,c);
    if(k==='always')return v==='yes';
    if(k==='exists')return !!resolve(v,c);
    if(k==='has_country_flag'||k==='has_planet_flag'||k==='has_fleet_flag')return c.obj.flags.has(flagKey(v,c));
    if(k==='check_variable')return c.obj.vars[get(v,'which')]===+get(v,'value');
    if(k==='has_special_project')return c.obj.projects.has(v);
    if(k==='has_deposit')return c.obj.deposits.has(v);
    if(k==='has_modifier'||k==='has_building')return c.obj.modifiers.has(v);
    if(k==='has_technology')return c.obj.tech.has(v);
    if(k==='is_owned_by'){
      // Generated 4.5.3 triggers.log excludes Country. The previous interpreter
      // silently returned false here and therefore missed the runtime error.
      assert.ok(['planet','colony','ship','fleet'].includes(c.obj.kind),`Wrong scope for is_owned_by: ${c.obj.kind}`);
      return c.obj.owner===resolve(v,c);
    }
    if(k==='is_same_value')return c.obj===resolve(v,c);
    if(k==='is_scope_type')return c.obj.kind===v;
    if(k==='is_country_type')return (c.obj.countryType||'default')===v;
    if(k==='is_site_type')return c.obj.siteType===v;
    if(k==='is_in_combat')return c.obj.combat===(v==='yes');
    if(k==='years_passed')return (c.obj.years||0)>+v;
    if(k==='fleet_power')return (c.obj.power||0)>+v;
    if(k==='resource_stockpile_compare')return c.obj.resources[get(v,'resource')]>=+get(v,'value');
    if(k==='any_owned_fleet')return c.obj.fleets.some(o=>test(v,ctx(o,c)));
    if(triggers.has(k))return test(triggers.get(k),c);
    const o=resolve(k,c); if(o)return test(v,ctx(o,c));
    if(['owner','solar_system','planet','archaeological_site','from','fromfrom','fromfromfrom','capital_scope'].includes(k)||k.startsWith('event_target:')) throw Error('Unguarded missing trigger scope '+k);
    throw Error('Unsupported test '+k);
  });
}
function run(b,c) {
  let branch=false;
  for(const [k,v] of b||[]) {
    if(k==='if'){branch=test(get(v,'limit'),c);if(branch)run(v.filter(([k])=>k!=='limit'),c);continue;}
    if(k==='else_if'){if(!branch&&test(get(v,'limit'),c)){branch=true;run(v.filter(([k])=>k!=='limit'),c);}continue;}
    if(k==='else'){if(!branch)run(v,c);continue;}
    if(k==='set_country_flag'||k==='set_planet_flag'||k==='set_fleet_flag'){c.obj.flags.add(flagKey(v,c));continue;}
    if(k==='remove_country_flag'||k==='remove_planet_flag'||k==='remove_fleet_flag'){c.obj.flags.delete(flagKey(v,c));continue;}
    if(k==='set_variable'){c.obj.vars[get(v,'which')]=+get(v,'value');continue;}
    if(k==='add_resource'){for(const [r,n] of v)c.obj.resources[r]=(c.obj.resources[r]||0)+(+n);continue;}
    if(k==='add_deposit'){c.obj.deposits.add(v);continue;}
    if(k==='remove_deposit'){c.obj.deposits.delete(v);continue;}
    if(k==='add_modifier'){c.obj.modifiers.add(get(v,'modifier'));continue;}
    if(k==='remove_modifier'){c.obj.modifiers.delete(v);continue;}
    if(k==='save_event_target_as'){locals.set(v,c.obj);continue;}
    if(k==='save_global_event_target_as'){const [base,key]=v.split('@');targets.set(base+'@'+resolve(key,c)?.id,c.obj);continue;}
    if(k==='clear_global_event_target'){targets.delete(flagKey(v,c));continue;}
    if(k==='country_event'){queued.push(get(v,'id'));continue;}
    if(k==='ship_event'){
      const callbackContext={...c,root:c.obj};
      for(const [key,scope]of get(v,'scopes')||[])callbackContext[key]=resolve(scope,c);
      const b=eventDefs.get(get(v,'id')).b;
      if(!get(b,'trigger')||test(get(b,'trigger'),callbackContext))run(get(b,'immediate'),callbackContext);
      continue;
    }
    if(k==='fleet_event'){queued.push(get(v,'id'));continue;}
    if(k==='every_country'){for(const country of countries)run(v,ctx(country,c));continue;}
    if(k==='every_owned_fleet'){for(const fleet of c.obj.fleets)if(!get(v,'limit')||test(get(v,'limit'),ctx(fleet,c)))run(v.filter(([k])=>k!=='limit'),ctx(fleet,c));continue;}
    if(k==='create_country'){const country=make('spawn-owner-'+spawns);countries.push(country);run(get(v,'effect'),ctx(country,c));continue;}
    if(k==='create_fleet'){const fleet=make('spawn-fleet-'+(++spawns),'fleet');run(get(v,'effect'),ctx(fleet,c));continue;}
    if(k==='set_owner'){c.obj.owner=resolve(v,c);c.obj.owner.fleets.push(c.obj);continue;}
    if(k==='set_location'){c.obj.system=resolve(get(v,'target'),c);continue;}
    if(k==='while'){for(let i=0;i<+get(v,'count');i++)run(v.filter(([k])=>k!=='count'),c);continue;}
    if(k==='create_ship'){c.obj.ships=(c.obj.ships||0)+1;continue;}
    if(k==='create_archaeological_site'){
      const site=make('new-site','archaeological_site');site.siteType=v;
      if(c.obj.kind==='planet')site.planet=c.obj;
      else site.colony=c.obj; // engine associates the exact scope object
      c.obj.archSite=site;continue;
    }
    if(k==='set_site_progress_locked'){assert.equal(c.obj.kind,'archaeological_site');c.obj.locked=v==='yes';continue;}
    if(k==='destroy_archaeological_site'){const site=resolve(v,c);assert.equal(site.kind,'archaeological_site');site.alive=false;continue;}
    if(k==='add_research_option'){c.obj.techLeads??=new Set();c.obj.techLeads.add(v);continue;}
    if(k==='enable_special_project'){const key=get(v,'name');check(!c.obj.projects.has(key),'No duplicated project '+key);c.obj.projects.add(key);continue;}
    if(k==='abort_special_project'){c.obj.projects.delete(get(v,'type'));continue;}
    if(k==='add_planet_devastation'){c.obj.devastation=(c.obj.devastation||0)+(+v);continue;}
    if(['random_situation','every_situation','set_faction_hostility','set_graphical_culture','set_fleet_stance','set_aggro_range_measure_from','set_aggro_range'].includes(k))continue;
    if(effects.has(k)){run(effects.get(k),c);continue;}
    const o=resolve(k,c);if(o){run(v,ctx(o,c));continue;}
    throw Error('Unsupported effect '+k);
  }
}
function reset(chapter=1){
  targets=new Map();locals=new Map();queued=[];spawns=0;countries=[];
  const country=make('empire');country.flags.add('epoch_res_active');country.vars.epoch_res_chapter=chapter;
  countries.push(country);
  const planet=make('world','planet');planet.owner=country;country.capital=planet;
  const ship=make('science','ship');ship.owner=country;
  const system=make('system','system');planet.system=system;ship.system=system;
  targets.set('epoch_ii_target_planet@empire',planet);
  const countryContext={obj:country,root:country};
  const start=id=>{
    const [,b]=projectForCallback.get(`epoch_res.${id}`);
    run(get(b,'on_start'),{obj:ship,root:ship,from:country});
  };
  const callback=(id,from=country,begin=true)=>{
    const [key,b]=projectForCallback.get(`epoch_res.${id}`);
    if(begin)start(id);
    country.projects.delete(key); // engine consumes the successful native project
    // Runtime evidence: native From is Country. Native FromFrom is deliberately
    // not assumed; the authored scopes override must resolve the saved assignment.
    run(get(b,'on_success'),{obj:ship,root:ship,from,fromfrom:make('native-unassumed','country')});
  };
  return {country,planet,ship,system,countryContext,callback,start};
}
// Valid and foreign science callbacks, repeated delivery, real sequential gates.
let x=reset();targets.set('epoch_res_scar@empire',x.planet);
assert.throws(()=>test([['from',[['is_owned_by','root.owner']]]],{obj:x.ship,root:x.ship,from:x.country}),/Wrong scope for is_owned_by: country/,'Reject the original runtime-broken Country-as-Planet fixture');
x.callback(101,make('foreign','planet'));check(!x.country.flags.has('epoch_res_scar_complete'),'Foreign result rejected');
x.callback(101);check(x.country.flags.has('epoch_res_scar_complete')&&x.country.vars.epoch_res_chapter===1,'Scar alone cannot finish chapter 1');
queued=[];x.callback(101);check(!queued.length,'Repeated scar callback inert');
targets.set('epoch_res_baseline@empire',x.planet);x.callback(107);check(x.country.vars.epoch_res_chapter===2,'Actual baseline completes chapter 1');
x=reset(2);const enemy=make('warden');enemy.flags.add('epoch_res_warden');const dead=make('hunters','fleet');dead.flags.add('epoch_res_hunters');dead.system=x.system;dead.owner=enemy;
targets.set('epoch_res_owner@warden',x.country);
function death(killer,cleanup=false){const c={root:enemy,obj:enemy,from:killer,fromfrom:dead};if(cleanup)enemy.flags.add('epoch_res_cleanup');if(test(get(E(201),'trigger'),c))run(get(E(201),'immediate'),c);}
death(make('bystander'));check(x.country.vars.epoch_res_chapter===2,'Uninvolved foreign kill is not victory');
death(x.country,true);check(x.country.vars.epoch_res_chapter===2,'Cleanup cannot simulate victory');enemy.flags.delete('epoch_res_cleanup');
death(x.country);check(x.country.vars.epoch_res_chapter===3&&x.country.flags.has('epoch_res_military_victory'),'Native destruction by owner advances');
queued=[];death(x.country);check(!queued.length,'Repeated destruction grants no second result');

// Military review regressions: execute the actual join/exit/destruction and
// recovery effects. These permutations are assumptions to validate in game,
// not evidence of the engine's internal callback ordering.
function militaryFixture() {
  const f=reset(2),warden=make('warden'),hunters=make('hunters','fleet'),ownFleet=make('own-fleet','fleet'),ally=make('ally');
  warden.flags.add('epoch_res_warden');warden.flags.add('epoch_res_warden_for@empire');
  hunters.flags.add('epoch_res_hunters');hunters.flags.add('epoch_res_hunters_for@empire');
  hunters.owner=warden;hunters.system=f.system;hunters.combat=false;warden.fleets.push(hunters);
  ownFleet.owner=f.country;ownFleet.system=f.system;ownFleet.combat=false;f.country.fleets.push(ownFleet);
  for(const flag of ['epoch_res_force_spawned','epoch_res_force_scaled','epoch_res_identity_v1'])f.country.flags.add(flag);
  countries.push(warden,ally);
  targets.set('epoch_res_owner@warden',f.country);targets.set('epoch_res_enemy@empire',warden);targets.set('epoch_res_hunters@empire',hunters);
  const fire=(id,c)=>{if(!get(E(id),'trigger')||test(get(E(id),'trigger'),c))run(get(E(id),'immediate'),c);};
  return {...f,warden,hunters,ownFleet,ally,
    join:(root=ownFleet,from=hunters,fromfrom,fromfromfrom)=>fire(200,{root,obj:root,from,fromfrom,fromfromfrom}),
    exit:()=>fire(203,{root:hunters,obj:hunters}),
    dispose:()=>fire(204,{root:hunters,obj:hunters}),
    destroy:(from=ally)=>fire(201,{root:warden,obj:warden,from,fromfrom:hunters}),
    refresh:()=>run(effects.get('epoch_res_refresh_hunters'),f.countryContext),
    brief:()=>fire(20,f.countryContext),
  };
}
let f=militaryFixture();f.join();f.exit();f.destroy();
check(f.country.flags.has('epoch_res_military_victory'),'Allied destruction after exit recognizes exact engagement despite is_in_combat=false');
queued=[];f.destroy();check(!queued.length,'Repeated allied callback cannot close twice');
f=militaryFixture();f.join();f.destroy();check(f.country.vars.epoch_res_chapter===3,'Allied destruction before exit also succeeds');
f=militaryFixture();f.join(f.hunters,f.ownFleet);f.destroy();check(f.country.vars.epoch_res_chapter===3,'Defender/root-hunter join records own participation');
for(const slot of ['fromfrom','fromfromfrom']){
  f=militaryFixture();const foreignFleet=make('foreign-fleet','fleet');foreignFleet.owner=f.ally;foreignFleet.system=f.system;
  f.join(f.ownFleet,foreignFleet,slot==='fromfrom'?f.hunters:undefined,slot==='fromfromfrom'?f.hunters:undefined);
  f.destroy();check(f.country.vars.epoch_res_chapter===3,`Additional native enemy slot ${slot} records participation`);
}
f=militaryFixture();f.country.flags.add('epoch_res_combat_participation');f.destroy();
check(f.country.vars.epoch_res_chapter===2,'Historical country participation plus same-system owned fleet is insufficient');
f=militaryFixture();f.ownFleet.system=make('other-system','system');f.join();f.destroy();
check(f.country.vars.epoch_res_chapter===2,'Spatially mismatched join cannot contribute');
f=militaryFixture();f.join();f.exit();f.dispose();f.destroy();
check(f.country.vars.epoch_res_chapter===2,'Disposed old engagement cannot qualify a later foreign kill');
f=militaryFixture();f.join();f.exit();const outsiderFleet=make('outsider','fleet');outsiderFleet.owner=f.ally;outsiderFleet.system=f.system;
f.join(f.hunters,outsiderFleet);f.destroy();
check(f.country.vars.epoch_res_chapter===2,'New foreign-only fight resets old participation before deferred disposal');
f=militaryFixture();f.join();f.exit();f.join();f.hunters.combat=true;f.dispose();f.destroy();
check(f.country.vars.epoch_res_chapter===3,'Old deferred disposal does not erase a fresh ongoing fight');
f=militaryFixture();f.join();f.hunters.system=make('moved-system','system');f.destroy();
check(f.country.vars.epoch_res_chapter===2,'Destroyed fleet must match its own recorded system');
f=militaryFixture();f.join();f.hunters.flags.add('epoch_res_cleanup');f.destroy(f.country);
check(f.country.vars.epoch_res_chapter===2,'Fleet cleanup marker blocks even a direct killer');
f=militaryFixture();f.join();f.exit();f.dispose();
check(f.country.vars.epoch_res_chapter===2&&!f.country.flags.has('epoch_res_military_victory'),'Flight and disposal callbacks never award victory');

const recontact=get(E(20),'option') ? E(20).filter(([k,b])=>k==='option'&&get(b,'name')==='epoch_res.recontact')[0][1] : null;
function selectReplacement(f){run(recontact.filter(([k])=>!['name','trigger','allow','ai_chance'].includes(k)),f.countryContext);}
f=militaryFixture();targets.delete('epoch_res_hunters@empire');f.refresh();
check(targets.get('epoch_res_hunters@empire')===f.hunters,'Missing fleet target reacquired via reciprocal owner');
check(!test(get(recontact,'trigger'),f.countryContext),'Live original blocks replacement after reference recovery');
f=militaryFixture();targets.delete('epoch_res_enemy@empire');targets.delete('epoch_res_hunters@empire');f.refresh();
check(targets.get('epoch_res_enemy@empire')===f.warden&&targets.get('epoch_res_hunters@empire')===f.hunters,'Both primary targets recovered without another spawn');
check(spawns===0&&!f.country.flags.has('epoch_res_military_victory'),'Target recovery grants neither spawn nor victory');
f=militaryFixture();targets.delete('epoch_res_enemy@empire');targets.delete('epoch_res_owner@warden');f.refresh();
check(targets.get('epoch_res_owner@warden')===f.country&&targets.get('epoch_res_enemy@empire')===f.warden,'Independent identity restores lost reciprocal/primary country links');
f=militaryFixture();const other=make('other-empire'),foreignWarden=make('foreign-warden'),foreignHunters=make('foreign-hunters','fleet');
foreignWarden.flags.add('epoch_res_warden');foreignHunters.flags.add('epoch_res_hunters');foreignHunters.flags.add('epoch_res_hunters_for@other-empire');foreignHunters.owner=foreignWarden;foreignWarden.fleets.push(foreignHunters);
countries.push(other,foreignWarden);targets.set('epoch_res_owner@foreign-warden',other);targets.set('epoch_res_enemy@empire',foreignWarden);targets.set('epoch_res_hunters@empire',foreignHunters);
f.refresh();check(targets.get('epoch_res_enemy@empire')===f.warden&&targets.get('epoch_res_hunters@empire')===f.hunters,'Foreign primary targets rejected and correct independent force recovered');
check(!foreignWarden.flags.has('epoch_res_warden_for@empire')&&!foreignHunters.flags.has('epoch_res_hunters_for@empire'),'Recovery does not adopt foreign campaign objects');
f=militaryFixture();f.hunters.alive=false;f.warden.fleets=[];f.refresh();
check(test(get(recontact,'trigger'),f.countryContext),'Verified absence offers the one paid replacement');
const energy=f.country.resources.energy;selectReplacement(f);selectReplacement(f);
check(f.country.resources.energy===energy-400&&f.country.flags.has('epoch_res_force_reissued'),'Repeated stale selection charges and consumes the allowance exactly once');
f.brief();f.brief();check(spawns===1,'Repeated briefing spawns only one replacement at the saved scale');
check(!f.country.flags.has('epoch_res_military_victory'),'Replacement encounter never grants success');
f=militaryFixture();f.hunters.alive=false;f.warden.fleets=[];f.refresh();
f.warden.fleets.push(f.hunters);f.hunters.alive=true;const beforeSelection=f.country.resources.energy;selectReplacement(f);
check(f.country.resources.energy===beforeSelection&&!f.country.flags.has('epoch_res_force_reissued'),'Selection revalidates a returning original before payment/allowance');
f=militaryFixture();f.hunters.alive=false;f.warden.alive=false;f.warden.fleets=[];countries=countries.filter(c=>c!==f.warden);f.refresh();
check(test(get(recontact,'trigger'),f.countryContext),'Absent country and fleet are safe with independent persisted identity');
selectReplacement(f);f.brief();check(spawns===1,'Missing country replacement creates a valid new owner before fleet creation');
f=militaryFixture();countries=countries.filter(c=>c!==f.warden);targets.clear();f.country.flags.delete('epoch_res_identity_v1');f.refresh();
check(!test(get(recontact,'trigger'),f.countryContext),'Ambiguous pre-fix missing identities fail closed rather than invent absence');
f=militaryFixture();f.country.flags.delete('epoch_res_force_spawned');f.brief();
check(spawns===0,'Live identified fleet blocks spawn even with a lost spawn flag');
f=militaryFixture();targets.set('epoch_res_enemy@empire',f.planet);targets.set('epoch_res_hunters@empire',f.planet);f.refresh();
check(targets.get('epoch_res_enemy@empire')===f.warden&&targets.get('epoch_res_hunters@empire')===f.hunters,'Wrong-scope primary targets are rejected before country/fleet operations');
f=militaryFixture();targets.set('epoch_res_enemy@empire',{alive:false});targets.set('epoch_res_hunters@empire',{alive:false});f.refresh();
check(targets.get('epoch_res_hunters@empire')===f.hunters,'Invalidated object references are recovered without entering dead scopes');
f=militaryFixture();f.hunters.alive=false;f.warden.fleets=[];f.refresh();f.country.resources.energy=399;selectReplacement(f);
check(!f.country.flags.has('epoch_res_force_reissued')&&f.country.resources.energy===399,'Insufficient resources do not consume the replacement or produce a fleet');
f.country.resources.energy=1000;selectReplacement(f);f.brief();
const replacementOwner=targets.get('epoch_res_enemy@empire');replacementOwner.fleets=[];targets.delete('epoch_res_hunters@empire');f.country.flags.delete('epoch_res_force_spawned');f.brief();
check(spawns===1&&!test(get(recontact,'trigger'),f.countryContext),'Lost replacement cannot bypass the once-only allowance or spawn guard');
const initial=reset(2);run(get(E(20),'immediate'),initial.countryContext);run(get(E(20),'immediate'),initial.countryContext);
check(spawns===1&&targets.get('epoch_res_hunters@empire').ships===4,'Initial native spawn guard produces one baseline formation');

x=reset(3);targets.set('epoch_res_wreck@empire',x.planet);targets.set('epoch_res_home@empire',x.planet);
x.callback(104);check(!x.country.flags.has('epoch_res_analysis_complete'),'Analysis cannot bypass salvage/signature');
x.callback(103);x.callback(108);x.callback(104);check(x.country.techLeads.size===2&&!x.country.tech.size,'Research leads, no researched technologies');
run(get(E(140),'immediate'),x.countryContext); // native callback dispatch in new country root
check(x.country.vars.epoch_res_chapter===4&&x.planet.flags.has('epoch_res_infected'),'Country-rooted infection transition resolves owner target');
function act(name){const b=decisions.get('decision_epoch_res_'+name),c={obj:x.planet,root:x.planet};if(test(get(b,'allow'),c))run(get(b,'effect'),c);}
x.planet.flags.add('epoch_core_contamination_worsened_state');x.planet.deposits.add('d_epoch_resonance_scar');
act('localize');act('sample');check(x.planet.flags.has('epoch_ii_unstable_resonance'),'Unsecured sampling worsens real feature');
act('quarantine');act('stabilize');check(x.country.vars.epoch_res_chapter===4,'Unstable feature cannot finish cheaply');
act('isolate');act('stabilize');check(x.country.vars.epoch_res_chapter===5,'Distinct planet actions stabilize and advance');
check(x.planet.deposits.has('d_epoch_resonance_scar')&&x.planet.flags.has('epoch_core_contamination_worsened_state'),'Stage-I independent scar and penalties preserved');
check([...x.planet.deposits].filter(v=>v.includes('contamination')).length===1,'One visible contamination feature');
const before=x.country.resources.energy;act('sample');check(x.country.resources.energy===before,'Closed chapter cannot repeat rewards');
x=reset(4);act('localize');act('emergency');check(x.country.flags.has('epoch_res_containment_failure')&&x.planet.modifiers.has('epoch_res_permanent_damage')&&x.country.vars.epoch_res_chapter===5,'Emergency has lasting cost and no softlock');
x=reset(5);for(const name of ['reflection','silence','interrupted'])targets.set('epoch_res_'+name+'@empire',x.planet);
x.country.flags.add('epoch_res_military_victory');x.country.flags.add('epoch_res_containment_complete');
x.callback(105);x.callback(106);check(!test(get(E(59),'trigger'),x.countryContext),'Two results cannot unlock the three-station handoff');
x.callback(109);check(test(get(E(59),'trigger'),x.countryContext),'Independent third project opens handoff');
run(get(E(59),'immediate'),x.countryContext);check(x.country.flags.has('epoch_res_stage_iii_ready')&&!x.country.flags.has('epoch_res_active'),'Permanent handoff closes Stage II');
check(!test(get(E(59),'trigger'),x.countryContext),'No repeated final reward');

// All nine on_start -> native on_success -> ship_event paths use the observed
// Country From. Do not directly inject a Planet as the callback's From.
const scienceCases=[
  [101,1,'scar','epoch_res_scar_complete',[]],
  [102,2,'home','epoch_res_recon_complete',[]],
  [103,3,'wreck','epoch_res_salvage_complete',[]],
  [104,3,'home','epoch_res_analysis_complete',['epoch_res_salvage_complete','epoch_res_signature_complete']],
  [105,5,'reflection','epoch_res_reflection_complete',[]],
  [106,5,'silence','epoch_res_silence_complete',[]],
  [107,1,'baseline','epoch_res_baseline_complete',['epoch_res_scar_complete']],
  [108,3,'wreck','epoch_res_signature_complete',['epoch_res_salvage_complete']],
  [109,5,'interrupted','epoch_res_interrupted_complete',[]],
];
function scienceFixture(spec){
  const [id,chapter,target,,prereqs]=spec,f=reset(chapter);
  f.planet.kind=[101,102,104].includes(id)?'colony':'planet';
  for(const flag of prereqs)f.country.flags.add(flag);
  targets.set(`epoch_res_${target}@empire`,f.planet);
  return f;
}
for(const spec of scienceCases){
  const [id,chapter,target,result]=spec;
  let f=scienceFixture(spec);f.callback(id);
  check(f.country.flags.has(result),`${id}: native Country From and ship-bound Planet/Colony destination succeeds`);
  const beforeFlags=[...f.country.flags],beforeResources={...f.country.resources},beforeCalls=queued.length;
  f.callback(id,f.country,false);
  check(JSON.stringify([...f.country.flags])===JSON.stringify(beforeFlags)&&JSON.stringify(f.country.resources)===JSON.stringify(beforeResources)&&queued.length===beforeCalls,`${id}: repeated success cannot duplicate progress/reward/dispatch`);
  f=scienceFixture(spec);f.callback(id,make('other-project-owner'));
  check(!f.country.flags.has(result),`${id}: foreign native project country rejected`);
  f=scienceFixture(spec);f.callback(id,f.country,false);
  check(!f.country.flags.has(result),`${id}: no assignment proof means no inferred success in a pre-fix save`);
  f=scienceFixture(spec);f.start(id);targets.delete(`epoch_res_${target}@empire`);f.callback(id,f.country,false);
  check(!f.country.flags.has(result),`${id}: missing canonical destination rejected without invalid scope`);
  f=scienceFixture(spec);f.start(id);const replacement=make('replacement','planet');replacement.owner=f.country;replacement.system=f.system;targets.set(`epoch_res_${target}@empire`,replacement);f.callback(id,f.country,false);
  check(!f.country.flags.has(result),`${id}: old assigned destination cannot be credited to a reanchored project`);
  f=scienceFixture(spec);f.ship.system=make('other-system','system');f.callback(id);
  check(!f.country.flags.has(result),`${id}: performing ship must be at the assigned system`);
  f=scienceFixture(spec);f.country.vars.epoch_res_chapter=chapter===1?2:1;f.callback(id);
  check(!f.country.flags.has(result),`${id}: wrong chapter rejected`);
  f=scienceFixture(spec);f.start(id);
  const restored=structuredClone({targets,locals,countries,ship:f.ship,country:f.country});
  targets=restored.targets;locals=restored.locals;countries=restored.countries;
  const [,projectDefinition]=projectForCallback.get(`epoch_res.${id}`);
  run(get(projectDefinition,'on_success'),{obj:restored.ship,root:restored.ship,from:restored.country,fromfrom:make('unknown-native-scope')});
  check(restored.country.flags.has(result),`${id}: serialized ship assignment survives model save/load`);
}
// A saved successful-but-rejected SCAR has no proof flag and no live project.
// Reopening the briefing issues no success; paying/researching it again does.
x=reset(1);targets.set('epoch_res_scar@empire',x.planet);
run(get(E(80),'immediate'),x.countryContext);
check(queued.includes('epoch_res.1')&&!x.country.flags.has('epoch_res_scar_complete'),'Blocked saved chapter 1 reopens the real first project, never grants credit');
const fundScar=E(1).filter(([k,b])=>k==='option'&&get(b,'name')==='epoch_res.begin')[0][1];
run(fundScar.filter(([k])=>!['name','trigger','allow','ai_chance'].includes(k)),x.countryContext);
check(x.country.projects.has('EPOCH_RES_SCAR'),'Paid replay creates a real SCAR project');
x.callback(101);check(queued.includes('epoch_res.11')&&x.country.flags.has('epoch_res_scar_complete'),'Actual replayed SCAR opens the independent expedition briefing');
targets.set('epoch_res_baseline@empire',x.planet);
const fundBaseline=E(11).filter(([k,b])=>k==='option'&&get(b,'name')==='epoch_res.baseline')[0][1];
check(test(get(fundBaseline,'trigger'),x.countryContext)&&test(get(fundBaseline,'allow'),x.countryContext),'Independent expedition funding is available after the first success');
run(fundBaseline.filter(([k])=>!['name','trigger','allow','ai_chance'].includes(k)),x.countryContext);
check(x.country.projects.has('EPOCH_RES_BASELINE'),'Independent expedition funding creates its real project');
x.callback(107);check(x.country.vars.epoch_res_chapter===2&&queued.includes('epoch_res.20'),'Actual BASELINE success enters chapter 2');

// Separate archaeology regression: Colony and physical Planet are distinct in
// 4.5.3. Vanilla on_arch_site_finished's From.planet cannot resolve an arc site
// that EPOCH created on a Colony instead of that Colony's physical Planet.
const coreE=id=>eventDefs.get(`epoch_core.${id}`).b;
function archaeologyFixture(){
  const f=reset(1),colony=make('colony','colony');colony.owner=f.country;colony.planet=f.planet;colony.system=f.system;
  targets.set('epoch_core_world@empire',colony);
  f.country.flags.add('epoch_core_campaign_active');f.country.flags.add('epoch_core_structure_study_ordered');
  return {...f,colony};
}
let arc=archaeologyFixture();
const beginDig=coreE(22).filter(([k,b])=>k==='option'&&get(b,'name')==='epoch_core.22.a')[0][1];
run(get(beginDig,'hidden_effect'),arc.countryContext);
let site=targets.get('epoch_core_structure_site@empire');
check(site.planet===arc.planet&&arc.colony.deposits.has('d_epoch_silent_structure_unsecured'),'New native site binds to physical Planet while feature stays on owned Colony');
check(test([['planet',[['is_scope_type','planet']]]],{obj:site,root:arc.ship,from:site}),'Vanilla completion can resolve the new site’s Planet');
const lockOption=coreE(43).filter(([k,b])=>k==='option'&&get(b,'name')==='epoch_core.43.a')[0][1];
run(get(lockOption,'hidden_effect'),{obj:arc.ship,root:arc.ship}); // expired From from open dialog
check(site.locked&&arc.country.flags.has('epoch_core_structure_secured'),'Late final choice locks saved site without reentering expired From');
const destroyOption=coreE(43).filter(([k,b])=>k==='option'&&get(b,'name')==='epoch_core.43.b')[0][1];
run(get(destroyOption,'hidden_effect'),{obj:arc.ship,root:arc.ship});
check(site.alive!==false&&!arc.country.flags.has('epoch_core_structure_destroyed'),'Repeated final choice cannot overwrite the saved outcome');
arc=archaeologyFixture();site=make('legacy-colony-site','archaeological_site');site.siteType='epoch_core_silent_structure';site.colony=arc.colony;
targets.set('epoch_core_structure_site@empire',site);
assert.throws(()=>test([['planet',[['is_scope_type','planet']]]],{obj:site,root:arc.ship,from:site}),/Unguarded missing trigger scope planet/,'Reproduce Vanilla From.planet failure on legacy Colony-bound site');
check(test(get(coreE(51),'trigger'),arc.countryContext),'Only malformed unfinished EPOCH site qualifies for repair');
run(get(coreE(51),'immediate'),arc.countryContext);
check(site.alive===false&&queued.includes('epoch_core.44')&&!arc.country.flags.has('epoch_core_structure_phase_resolved'),'Legacy repair opens existing real-study recovery and never credits unfinished excavation');
arc=archaeologyFixture();run(get(beginDig,'hidden_effect'),arc.countryContext);
check(!test(get(coreE(51),'trigger'),arc.countryContext),'Correctly Planet-bound site is not migrated');
arc=archaeologyFixture();site=make('resolved-legacy','archaeological_site');site.siteType='epoch_core_silent_structure';targets.set('epoch_core_structure_site@empire',site);arc.country.flags.add('epoch_core_structure_phase_resolved');
check(!test(get(coreE(51),'trigger'),arc.countryContext),'Existing completed Stage-I result remains untouched');
// Every new visible key, project and modifier is translated in both languages.
const repo = process.argv[2]||path.resolve(__dirname,'..');
for(const lang of ['english','german']){
  const loc=fs.readFileSync(path.join(repo,`localisation/${lang}/epoch_core_l_${lang}.yml`),'utf8');
  const keys=new Set([...loc.matchAll(/^\s*([\w.]+):\d+\s+"/gm)].map(m=>m[1]));
  for(const [id,{b}] of eventDefs) if(id.startsWith('epoch_res.'))for(const field of ['title','desc'])if(typeof get(b,field)==='string')check(keys.has(get(b,field)),`${lang} ${id} ${field}`);
  for(const [name]of decisions){check(keys.has(name),`${lang} ${name}`);check(keys.has(name+'_desc'),`${lang} ${name} description`);}
  for(const [key]of newProjects){check(keys.has(key),`${lang} ${key}`);check(keys.has(key+'_DESC'),`${lang} ${key} description`);}
}
console.log(`PASS: ${checks} Resonance contract/interpreted-script assertions. Engine, AI, balance, save/load and MP remain unverified.`);
