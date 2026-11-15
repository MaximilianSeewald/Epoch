'use strict';
// Source-derived contracts and a small bookkeeping model. Native navigation,
// project assignment, economic ticks, combat and AI are not simulated here.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
process.argv.push(root,'--source-only');
const {parse,get} = require('./test_clausewitz_structure.cjs');
process.argv.splice(-2,2);
const read = p => fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const tree = p => parse(read(p),p);
const ep = 'events/epoch_echoes_events.txt', source = read(ep);
const effects = new Map(tree('common/scripted_effects/epoch_echoes_effects.txt'));
const triggers = new Map(tree('common/scripted_triggers/epoch_echoes_triggers.txt'));
const decisions = new Map(tree('common/decisions/epoch_echoes_decisions.txt'));
const megas = new Map(tree('common/megastructures/epoch_echoes_relay.txt'));
const mods = new Map(tree('common/static_modifiers/epoch_echoes_modifiers.txt'));
const projects = new Map(tree('common/special_projects/epoch_echoes_projects.txt').map(([,b])=>[get(b,'key'),b]));
const events = new Map(); let checks=0;
const check=(c,m)=>{checks++;assert.ok(c,m);}, has=(b,s)=>JSON.stringify(b).includes(s);
const E=id=>events.get(`epoch_echoes.${id}`);
const walk=(b,fn)=>{for(const [k,v] of b){fn(k,v);if(Array.isArray(v))walk(v,fn);}};
for(const [kind,b] of tree(ep)) {
 if(!Array.isArray(b))continue;
 const id=get(b,'id'); check(!events.has(id),`Unique event ${id}`);events.set(id,b);
 check(get(b,'is_triggered_only')==='yes',`${id}: no independent polling`);
 check(['country_event','ship_event','carrier_event'].includes(kind),`${id}: native scope`);
}
for(const p of [ep,'common/special_projects/epoch_echoes_projects.txt','common/scripted_effects/epoch_echoes_effects.txt','common/decisions/epoch_echoes_decisions.txt','common/on_actions/epoch_core_on_actions.txt'])for(const [,id] of read(p).matchAll(/\bid\s*=\s*(epoch_echoes\.\d+)\b/g))check(events.has(id),`Defined ${id} in ${p}`);
const originalHooks={
 on_game_start_country:['epoch_core.1'],on_country_created:['epoch_core.1'],on_country_type_changed:['epoch_core.1'],
 on_yearly_pulse_country:['epoch_core.51','epoch_ii.0','epoch_res.81'],on_survey_planet:['epoch_core.15'],
 on_fleet_destroyed_victim:['epoch_res.201','epoch_res.202'],on_fleet_combat_joined_attacker:['epoch_res.200'],
 on_fleet_combat_joined_defender:['epoch_res.200'],on_fleet_exit_battle:['epoch_res.203'],
 on_single_player_save_game_load:['epoch_core.52'],on_monthly_pulse:['epoch_core.52'],
};
const preservedHooks={};
for(const [hook,b] of tree('common/on_actions/epoch_core_on_actions.txt')){
 const ids=(get(b,'events')||[]).map(([,v])=>v).filter(id=>!id.startsWith('epoch_echoes.'));
 if(ids.length)preservedHooks[hook]=ids;
}
assert.deepEqual(preservedHooks,originalHooks,'Every pre-existing campaign hook and callback order is preserved');checks++;
for(const id of [31,33])check(get(E(id),'option')&&get(E(id),'trigger'),`${id}: full relay event rather than a scheduling stub`);
const actor=()=>({flags:new Set(),mods:new Set(),resources:{},targets:new Set(),draws:0,trace:[]});
function test(b,a){return b.every(([k,v])=>{
 if(k==='NOT')return !test(v,a);
 if(k==='OR')return v.some(p=>test([p],a));
 if(k==='NOR')return !v.some(p=>test([p],a));
 if(k==='AND')return test(v,a);
 if(k==='always')return v==='yes';
 if(['has_country_flag','has_planet_flag'].includes(k))return a.flags.has(v);
 if(k==='has_modifier')return a.mods.has(v);
 if(k==='exists')return v==='owner'?!!a.owner:a.targets.has(v);
 if(k==='owner')return !!a.owner&&test(v,a.owner);
 if(triggers.has(k))return test(triggers.get(k),a)===(v==='yes');
 throw Error(`Unsupported model trigger ${k}`);
});}
function apply(b,a,draws=[]){let previous=false;for(const [k,v]of b){
 if(k==='if'){previous=test(get(v,'limit'),a);if(previous)apply(v.filter(([k])=>k!=='limit'),a,draws);}
 else if(k==='else_if'){if(!previous&&test(get(v,'limit'),a)){previous=true;apply(v.filter(([k])=>k!=='limit'),a,draws);}}
 else if(k==='else'){if(!previous)apply(v,a,draws);previous=true;}
 else if(k==='random'){a.draws++;if(draws.shift())apply(v.filter(([k])=>k!=='chance'),a,draws);}
 else if(['set_country_flag','set_planet_flag'].includes(k))a.flags.add(v);
 else if(['remove_country_flag','remove_planet_flag'].includes(k))a.flags.delete(v);
 else if(k==='set_timed_country_flag')a.flags.add(get(v,'flag'));
 else if(k==='add_resource')for(const [r,n]of v)a.resources[r]=(a.resources[r]||0)+Number(n);
 else if(k==='add_modifier')a.mods.add(get(v,'modifier'));
 else if(k==='remove_modifier')a.mods.delete(v);
 else if(k==='owner')apply(v,a.owner,draws);
 else if(k==='hidden_effect')apply(v,a,draws);
 // Record deferred/native work without interpreting it as successful gameplay.
 else if(['abort_special_project','destroy_ambient_object','country_event','carrier_event','epoch_echoes_prepare_cache'].includes(k))a.trace.push(k);
 else if(effects.has(k))apply(effects.get(k),a,draws);
 else throw Error(`Unsupported model effect ${k}`);
}}
const sampler=effects.get('epoch_echoes_select_stories'),chances=[];
walk(sampler,(k,v)=>{if(k==='chance')chances.push(Number(v));});
assert.deepEqual(chances,[35,30,20]);checks++;
check(!/\bchance\s*=/.test(source),'No per-opportunity percentage rolls');
for(let mask=0;mask<8;mask++){
 let a=actor();const outcomes=[0,1,2].map(i=>!!(mask&(1<<i)));apply(sampler,a,[...outcomes]);
 for(let n=0;n<10000;n++)apply(sampler,a,[true,true,true]);
 a={...a,flags:new Set(JSON.parse(JSON.stringify([...a.flags])))};apply(sampler,a,[true,true,true]);
 check(a.draws===3,`${mask}: only three draws after 10000 opportunities and save/load`);
 ['ghost','unquiet','relay'].forEach((s,i)=>check(a.flags.has(`epoch_echoes_${s}_selected`)===outcomes[i],`${mask}: independent ${s}`));
}
check(Math.abs(chances.reduce((p,c)=>p*(1-c/100),1)-0.364)<1e-10,'36.4% select no story before placement restrictions');
check(!has(get(E(1),'trigger'),'epoch_echoes_ghost_started')&&!has(get(E(1),'trigger'),'epoch_echoes_relay_started'),'Survey has no cross-story exclusion');
check(!has(E(20),'epoch_echoes_ghost_trace_complete')&&!has(E(20),'epoch_echoes_unquiet_resolved'),'Relay does not auto-start from another result');
check(has(E(20),'random_owned_starbase')&&!has(E(20),'random_system ='),'Placement is empire-local');
check(JSON.stringify(E(20)).indexOf('["set_country_flag","epoch_echoes_relay_started"]')<JSON.stringify(E(20)).indexOf('["spawn_megastructure"'),'Relay reserves its single construction attempt before spawning');
check(has(E(1),'epoch_echoes_discovery_spacing')&&has(E(20),'epoch_echoes_discovery_spacing'),'Discoveries are spaced');
for(const relay of [false,true]){
 const a=actor();a.flags=new Set(['epoch_echoes_ghost_started','epoch_echoes_ghost_trace_complete',...(relay?['epoch_echoes_relay_started']:[])]);a.targets.add('event_target:epoch_echoes_ghost_site@this');
 check(test(get(E(30),'trigger'),a),`Ghost reward eligible with relay=${relay}`);apply(get(E(30),'immediate'),a);
 check(!test(get(E(30),'trigger'),a),'Duplicate callback cannot reward again');
 assert.deepEqual(a.resources,{society_research:180,physics_research:120});checks++;
 check(a.flags.has('epoch_echoes_relay_started')===relay,'Reward preserves relay state');
 a.flags.delete('epoch_echoes_ghost_rewarded');a.flags.add('epoch_core_campaign_opted_out');check(!test(get(E(30),'trigger'),a),'Opt-out rejects reward');
}
check(!has(E(30),'epoch_echoes_relay_'),'Ghost result has no relay gate');
check(has(effects.get('epoch_echoes_prepare_cache'),'random_neighbor_system')&&projects.has('EPOCH_ECHOES_GHOST_CACHE'),'Ghost adds map salvage');
check(has(E(46),'epoch_echoes_cache_recovered')&&has(E(46),'alloys","250')&&has(E(46),'alloys","150'),'Cargo has guarded method-dependent material reward');
for(const [key,b]of projects){
 const story=key.includes('GHOST')?'ghost':'relay',failure=story==='ghost'?'60':'61';
 check(get(b,'event_scope')==='ship_event'&&get(b,'location')==='yes',`${key}: visible ship work`);
 check(get(get(b,'requirements'),'leader')==='scientist'&&get(get(b,'requirements'),'shipclass_science_ship')==='1',`${key}: staffed science ship`);
 check(has(get(b,'on_start'),'_target@prev')&&has(get(b,'on_success'),'_target@this'),`${key}: assignment belongs to performing ship`);
 check(has(get(b,'on_success'),'scopes'),`${key}: explicit target callback`);
 for(const c of ['on_fail','on_cancel'])check(has(get(b,c),`epoch_echoes.${failure}`)&&has(get(b,c),'owner')&&!has(get(b,c),'epoch_echoes.21'),`${key}: owner-local isolated ${c}`);
 check(has(get(b,'abort_trigger'),`epoch_echoes_${story}_open`),`${key}: closes stale work`);
}
for(const [id,s]of [[40,'ghost'],[41,'ghost'],[42,'ghost'],[43,'ghost'],[44,'relay'],[45,'relay'],[46,'ghost']]){
 check(has(get(E(id),'trigger'),'leader')&&has(get(E(id),'trigger'),`epoch_echoes_${s}_open`),`${id}: scientist and active assignment required`);
 check(/_target@root"/.test(JSON.stringify(get(E(id),'trigger'))),`${id}: uses ship assignment instead of country assignment`);
 check(has(get(E(id),'trigger'),'is_same_value')&&has(get(E(id),'trigger'),'root.owner'),`${id}: country and destination validated`);
}
for(const [s,other,id]of [['ghost','relay',60],['relay','ghost',61]]){
 check(!has(effects.get(`epoch_echoes_close_${s}`),`epoch_echoes_${other}`)&&!has(E(id),`epoch_echoes_${other}`),`${s}: cleanup/recovery cannot abort ${other}`);
 check(has(E(id),'retries')&&has(E(id),'"2"'),`${s}: at most two reissues`);
 check(has(E(90),`epoch_echoes_${s}_age`)&&has(E(90),'"12"'),`${s}: bounded lifetime`);
}
assert.deepEqual([...decisions.keys()].sort(),['decision_epoch_echoes_investigate','decision_epoch_echoes_recover']);checks++;
for(let mask=0;mask<32;mask++){
 const a=actor();a.owner=actor();
 ['epoch_echoes_unquiet_active','epoch_echoes_unquiet_closed','epoch_echoes_unquiet_treating','epoch_echoes_unquiet_menu','epoch_echoes_unquiet_backlash'].forEach((f,i)=>{if(mask&(1<<i))a.flags.add(f);});
 a.flags.add('epoch_echoes_unquiet_for@owner');a.mods.add('epoch_echoes_unquiet_organic');if(mask&16)a.mods.add('epoch_echoes_unquiet_backlash');
 const visible=[...decisions.values()].filter(b=>test(get(b,'potential'),a)).length;
 check(visible<=1,`${mask}: at most one visible colony decision, including inconsistent flag combinations`);
}
check(has(get(decisions.get('decision_epoch_echoes_recover'),'potential'),'has_modifier'),'No repair for an expired penalty');
check(has(E(20),'days","-1')&&has(E(12),'days","-1'),'Disturbance and backlash persist until treated');
for(const s of ['containment','research','exploit'])check(has(E(11),`epoch_echoes_treatment_${s}`)&&has(E(12),`epoch_echoes_treatment_${s}`),`${s}: paid timed treatment reaches own result`);
const a=actor();a.owner=actor();a.flags=new Set(['epoch_echoes_unquiet_active','epoch_echoes_unquiet_treating','epoch_echoes_treatment_containment','epoch_echoes_unquiet_for@owner']);a.mods.add('epoch_echoes_unquiet_organic');
check(test(get(E(12),'trigger'),a),'Treatment finishes after its temporary modifier expires');apply(get(E(12),'immediate'),a);
check(!test(get(E(12),'trigger'),a)&&!a.mods.has('epoch_echoes_unquiet_organic')&&a.owner.flags.has('epoch_echoes_unquiet_contained'),'Containment removes actual penalty exactly once');
check(has(E(13),'epoch_echoes_clear_disturbance')&&!has(E(13),'add_resource'),'Colony loss cleans this story without rewards');
check(!/set_(?:planet|country)_flag = epoch_(?:core|res|ii|iii|iv)_/.test(source),'No writes to Stage I-IV state');
for(const k of ['epoch_res_infected','epoch_ii_controlled_resonance','epoch_core_resonance_scar_healed'])check(has(triggers.get('epoch_echoes_safe_colony'),k),`Protected state ${k}`);
for(const kind of ['organic','hive','machine'])check(has(E(20),`epoch_echoes_unquiet_${kind}`),`${kind}: real production penalty`);
const active=megas.get('epoch_echoes_relay_active');
check(get(get(get(active,'resources'),'upkeep'),'energy')==='4','Physical relay has native energy upkeep');
check(get(get(get(active,'resources'),'produces'),'physics_research')==='6','Physical relay has bounded native output');
for(const k of ['has_deficit','resource_stockpile_compare','epoch_core_campaign_opted_out','epoch_echoes_relay_for@prev','is_inside_border'])check(has(get(get(active,'resources'),'produces'),k),`Output checks ${k}`);
const outputTrigger=get(get(get(active,'resources'),'produces'),'trigger');
check(outputTrigger.length===1&&get(outputTrigger,'owner?'),'Native recurring query uses optional-owner scope exclusively');
check(get(get(get(outputTrigger,'owner?'),'any_owned_megastructure'),'has_megastructure_flag')==='epoch_echoes_relay_for@prev','Instance predicates are nested in a real megastructure scope');
check(has(get(outputTrigger,'owner?'),'count_owned_megastructure'),'Captured duplicate cannot multiply output before its ownership callback');
const sprites=new Map(get(tree('interface/epoch_echoes.gfx'),'spriteTypes').map(([,b])=>[get(b,'name').replaceAll('"',''),b]));
for(const id of megas.keys())for(const suffix of ['build_icon','outliner_icon'])check(sprites.has(`GFX_${id}_${suffix}`),`${id}: implicit ${suffix} defined`);
check(!has(mods.get('epoch_echoes_relay_active'),'research')&&!has(mods.get('epoch_echoes_relay_active'),'sensor'),'No country buff masquerades as infrastructure');
for(const s of ['active','disabled','salvaged'])check(has(effects.get(`epoch_echoes_replace_relay_${s}`),'spawn_megastructure')&&has(effects.get(`epoch_echoes_replace_relay_${s}`),'remove_megastructure'),`${s}: persistent map object`);
check(get(get(megas.get('epoch_echoes_relay_disabled'),'potential'),'always')==='yes'&&has(megas.get('epoch_echoes_relay_disabled'),'has_monthly_income'),'AI can select native shutdown during deficits');
check(has(E(33),'create_fleet')&&has(E(33),'create_ship')&&has(E(33),'fleet_power'),'Military route has defenders and AI strength check');
check(has(get(E(900),'trigger'),'fromfromfrom')&&has(E(900),'epoch_echoes_relay_guard_destroyed'),'Military success requires destroyed guard and combatant');
check(!has(E(90),'set_country_flag","epoch_echoes_relay_military_ready'),'Missing guard never grants victory');
for(const f of ['epoch_echoes_ghost_signal_insight','epoch_echoes_unquiet_contained','epoch_echoes_unquiet_researched'])check(has(E(33),f),`${f}: technical aid`);
check(Number(get(projects.get('EPOCH_ECHOES_RELAY_DEFUSE_AIDED'),'days_to_research'))<Number(get(projects.get('EPOCH_ECHOES_RELAY_DEFUSE'),'days_to_research')),'Previous stories shorten actual work');
check(get(projects.get('EPOCH_ECHOES_RELAY_DEFUSE_LINKED'),'days_to_research')==='45'&&has(E(33),'epoch_echoes_relay_linked'),'Both discoveries together provide a further advantage');
for(const [k,v] of E(35))if(k==='option'){
 check(has(get(v,'trigger'),'epoch_echoes_relay_open'),'Stale relay choice is unavailable');
 const body=get(get(v,'hidden_effect'),'if');
 check(has(get(body,'limit'),'epoch_echoes_relay_open'),'Relay action revalidates before execution');
 const claim=body.findIndex(([k])=>k==='epoch_echoes_finalize_relay');
 const grant=body.findIndex(([k])=>k==='add_resource');
 check(claim>=0&&(grant<0||claim<grant),'Relay claims completion before charging or paying');
}
check(has(E(91),'days","1')&&has(E(92),'epoch_echoes_relay_for@root')&&has(E(92),'epoch_echoes_relay_disabled'),'Captured relay becomes an inert object without overwriting the conqueror’s personal targets');
check(has(E(11),'resource_stockpile_compare')&&has(E(90),'is_ai')&&has(E(35),'has_monthly_income'),'AI actions account for economy');
check(!/on_monthly_pulse[^\n]*epoch_echoes/.test(read('common/on_actions/epoch_core_on_actions.txt'))&&!/every_(?:planet|country|fleet)|every_system/.test(source),'No monthly/galaxy-wide scans');
check(has(E(22),'epoch_echoes_disable_relay')&&has(E(22),'epoch_echoes_close_ghost'),'Permanent refusal cleans active work');
check(has(E(89),'epoch_echoes_migrated')&&has(E(89),'epoch_echoes_ghost_rewarded'),'Old assignments migrate without repeating rewards');
for(const language of ['english','german']){
 const loc=read(`localisation/${language}/epoch_echoes_l_${language}.yml`),keys=new Set([...loc.matchAll(/^\s*([\w.]+):/gm)].map(m=>m[1]));
 for(const [key]of projects)for(const suffix of ['','_DESC'])check(keys.has(key+suffix),`${language}: ${key+suffix}`);
 for(const [key]of decisions)for(const suffix of ['','_desc'])check(keys.has(key+suffix),`${language}: ${key+suffix}`);
 for(const [key]of megas)for(const suffix of ['','_DESC','_MEGASTRUCTURE_DETAILS','_CONSTRUCTION_INFO_DELAYED'])check(keys.has(key+suffix),`${language}: ${key+suffix}`);
 walk(tree(ep),(k,v)=>{if(['title','desc','text','name','custom_tooltip'].includes(k)&&typeof v==='string'&&v.startsWith('epoch_echoes.'))check(keys.has(v),`${language}: UI key ${v}`);});
}
for(const b of events.values())for(const [k,v]of b)if(k==='option'&&get(v,'tooltip'))check(!get(v,'add_resource'),'No duplicate native option cost tooltip');

// Optional installed-source audit; CI remains independent of a game install.
// This establishes source matches on the installed version, never engine behavior.
if(process.env.EPOCH_ECHOES_VANILLA_ROOT){
 const base=process.env.EPOCH_ECHOES_VANILLA_ROOT,native=p=>fs.readFileSync(path.join(base,p),'utf8');
 const spy=native('common/megastructures/02_spy_orb.txt');
 for(const b of megas.values()){
  check(spy.includes(`entity = ${get(b,'entity')}`),'Relay entity is a real Vanilla asset reference');
  check(spy.includes(`portrait = ${get(b,'portrait')}`),'Relay portrait exists in Vanilla');
 }
 for(const b of sprites.values())check(fs.existsSync(path.join(base,get(b,'texturefile').replaceAll('"',''))),'Native relay icon texture exists');
 const seal=native('common/megastructures/22_shroud_seal.txt');
 for(const fragment of ['construction_blocks_and_blocked_by = none','owner? = {','produces = {','upkeep = {'])check(seal.includes(fragment),`Native infrastructure pattern ${fragment}`);
 const actions=native('common/on_actions/00_on_actions.txt');
 for(const hook of ['on_colonized','on_colony_transfer','on_colony_destroyed','on_megastructure_change_owner','on_fleet_destroyed_victim'])check(actions.includes(`${hook} = {`),`Native hook ${hook}`);
 check(native('common/ambient_objects/ambient_objects.txt').includes('name = "derelict_ship_object"'),'Native wreck object');
 const version=JSON.parse(native('launcher-settings.json')).version;
 console.log(`Installed source evidence: ${version}. This is not a 4.5.3 engine test.`);
}
console.log(`PASS: ${checks} Echoes source/model checks; independent one-time draws, guarded callbacks, colony management, cargo, native relay, AI/recovery and EN/DE. Not an in-game test.`);
