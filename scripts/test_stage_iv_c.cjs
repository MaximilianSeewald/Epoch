// Source contracts and bounded eligibility/economy evaluation; not an engine simulation.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {parse,get,parsedByPath}=require('./test_clausewitz_structure.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..'),vanilla=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
const tree=p=>parsedByPath.get(p)||parse(read(p),p),unquote=s=>s?.replace(/^"|"$/g,'');
const defs=(dir)=>new Map(tree(`common/${dir}/epoch_c_${({tradition_categories:'categories',scripted_triggers:'triggers',ascension_perks:'perks',static_modifiers:'modifiers'})[dir]||dir}.txt`));
const cats=defs('tradition_categories'),traditions=defs('traditions'),perks=defs('ascension_perks'),traits=defs('traits'),megas=defs('megastructures'),triggers=defs('scripted_triggers');
triggers.set('epoch_iv_future_research',new Map(tree('common/scripted_triggers/epoch_ascension_scripted_triggers.txt')).get('epoch_iv_future_research'));
const manifest=JSON.parse(read('docs/research/stage-iv-c-content.json'));
let checks=0;function check(v,m){checks++;assert.ok(v,m);}
const values=(b,key)=>b.filter(([k])=>k===key).map(([,v])=>v);
const deep=(b,key)=>b.flatMap(([k,v])=>[...(k===key?[v]:[]),...(Array.isArray(v)?deep(v,key):[])]);
function gate(b,e){return b.every(([k,v])=>{
 if(triggers.has(k))return gate(triggers.get(k),e)===(v==='yes');
 if(k==='epoch_iv_eligible')return e.eligible;
 if(k==='always')return v==='yes';
 if(k==='NOT'||k==='NOR')return !v.some(p=>gate([p],e));
 if(k==='OR')return v.some(p=>gate([p],e));
 if(k==='AND')return gate(v,e);
 if(k==='exists')return !!e[v];
 if(k==='owner'||k==='from')return !!e[k]&&gate(v,e[k]);
 if(k==='has_country_flag')return e.flags?.has(v)||false;
 if(k==='has_ascension_perk')return e.perks?.has(v)||false;
 if(k==='has_tradition'||k==='has_active_tradition')return e.traditions?.has(v)||false;
 if(k==='has_technology')return e.techs?.has(v)||false;
 if(k==='has_trait')return e.traits?.has(v)||false;
 if(k==='has_deposit')return e.deposits?.has(v)||false;
 if(k==='has_modifier')return e.modifiers?.has(v)||false;
 if(k==='has_planet_flag')return e.flags?.has(v.replace('@owner','@'+e.owner?.id))||false;
 if(k==='any_country')return (e.countries||[]).some(country=>gate(v,country));
 if(k==='has_civic'||k==='has_valid_civic')return e.civics?.has(v)||false;
 if(k==='ROOT')return !!e.root&&gate(v,e.root);
 if(k==='can_add_genetic_traits')return e.from?.techs.has('tech_gene_tailoring')||false;
 if(k==='has_deficit')return e.deficits?.has(v)||false;
 if(k==='has_megastructure_flag'){assert.equal(v,'epoch_c_operational');return e.operational!==false;}
 if(k==='count_owned_megastructure')return (e.megas||[]).filter(type=>gate(get(v,'limit'),typeof type==='string'?{type}:type)).length<Number(get(v,'count'));
 if(k==='is_megastructure_type')return e.type===v;
 if(k==='any_owned_megastructure')return (e.megas||[]).some(type=>gate(v,typeof type==='string'?{type}:type));
 if(['is_gestalt','is_robot_empire','is_hive_empire','is_wilderness_empire','is_machine_empire','is_colony'].includes(k))return !!e[k]===(v==='yes');
 throw Error('Unmodelled eligibility key '+k);
});}
const techs=new Set([...parsedByPath].filter(([p])=>p.startsWith('common/technology/')).flatMap(([,b])=>b.map(([k])=>k)));
for(const id of ['tech_gene_tailoring','tech_robomodding','tech_robomodding_m','tech_mega_engineering'])techs.add(id);
const profiles={organic:{},lithoid:{},hive:{is_gestalt:true,is_hive_empire:true},wilderness:{is_gestalt:true,is_hive_empire:true,is_wilderness_empire:true},machine:{is_gestalt:true,is_robot_empire:true},individual_machine:{is_robot_empire:true},synthetic:{is_robot_empire:true}};
const classFor=n=>['hive','wilderness'].includes(n)?'hive':['machine','individual_machine','synthetic'].includes(n)?'machine':'organic';
const empire=(p,philosophy)=>({...p,eligible:true,flags:new Set(['epoch_iv_protocol_key','epoch_iv_complete',...(philosophy?[`epoch_iv_philosophy_${philosophy}`]:[])]),techs:new Set(techs),perks:new Set(),traditions:new Set([...traditions.keys()]),deficits:new Set(),megas:[]});
check(cats.size===4&&traditions.size===28&&perks.size===5&&traits.size===5&&megas.size===10,'exact four/seven, five perks, five traits, three/three/four content counts');
check((read('common/scripted_triggers/epoch_c_triggers.txt').match(/count_owned_megastructure = \{ count < 2 /g)||[]).length===2,'bounded cap evaluator matches actual comparison operators');
for(const f of manifest.trees){
 const c=cats.get('tradition_epoch_'+f.id),items=get(c,'traditions').map(([,v])=>unquote(v));
 check(items.length===5&&new Set(items).size===5,'five actual choices '+f.id);
 check(get(c,'tree_template')==='"tree_11_12"','native tree template '+f.id);
 for(const id of [unquote(get(c,'adoption_bonus')),...items,unquote(get(c,'finish_bonus'))])check(traditions.has(id)&&get(traditions.get(id),'modifier').length>0,'real modifier '+id);
 check(get(get(traditions.get(`tr_epoch_${f.id}_finish`),'modifier'),'ascension_perks_add')==='1','normal finisher unlocks a native perk slot '+f.id);
 for(const [id,b]of items.map(k=>[k,traditions.get(k)]))for(const p of deep(get(b,'possible')||[],'has_tradition'))check(items.includes(p),'internal non-cyclic tree dependency '+id);
}
// Evaluate the chosen swap's effects/name rather than merely finding its keys.
const wildernessSwaps=[
 ['tr_epoch_convergence_drones','planet_jobs_produces_mult','0.1','megastructure_build_speed_mult','0.2'],
 ['tr_epoch_convergence_nodes','planet_stability_add','5','building_time_mult','-0.25']
];
function effectiveHiveTradition(id,e){
 if(!gate(get(cats.get('tradition_epoch_convergence'),'potential'),e))return null;
 const t=traditions.get(id),active=values(t,'tradition_swap').filter(s=>gate(get(s,'trigger'),e));
 check(active.length<=1,'one applicable swap '+id);
 if(!active.length)return {name:id,modifier:get(t,'modifier')};
 const s=active[0];return {name:get(s,'inherit_name')==='yes'?id:get(s,'name'),modifier:[...(get(s,'inherit_effects')==='yes'?get(t,'modifier'):[]),...get(s,'modifier')]};
}
for(const [id,baseKey,baseValue,swapKey,swapValue]of wildernessSwaps){
 const swaps=values(traditions.get(id),'tradition_swap');
 check(swaps.length===1,'exactly one Wilderness swap '+id);
 const s=swaps[0];
 check(get(s,'name')===id+'_wilderness'&&get(s,'inherit_name')==='no','use alternate localized name '+id);
 check(get(s,'inherit_effects')==='no'&&get(s,'inherit_icon')==='yes','replace effects and retain native icon '+id);
 for(const [name,profile]of Object.entries(profiles)){
  const result=effectiveHiveTradition(id,empire(profile,'free'));
  if(classFor(name)!=='hive'){check(result===null,'foreign class has no hive tradition effects '+name+'/'+id);continue;}
  assert.deepEqual(result,{name:id+(name==='wilderness'?'_wilderness':''),modifier:[[name==='wilderness'?swapKey:baseKey,name==='wilderness'?swapValue:baseValue]]});checks++;
 }
 check(effectiveHiveTradition(id,empire({...profiles.machine,is_wilderness_empire:true},'free'))===null,'Wilderness marker cannot bypass machine class exclusion '+id);
 check(effectiveHiveTradition(id,{...empire(profiles.wilderness,'free'),flags:new Set()})===null,'Wilderness swap cannot bypass personal completion '+id);
}
// Execute the actual decision completion branch on worlds that lose each prerequisite.
const symbiosis=defs('decisions').get('decision_epoch_c_symbiotic_world');
const symbiosisBranch=get(get(symbiosis,'effect'),'if');
function finishSymbiosis(world){
 if(gate(get(symbiosisBranch,'limit'),world)){
  const reward=get(symbiosisBranch,'add_modifier');
  check(get(reward,'days')==='-1','symbiotic reward is persistent');
  world.modifiers.add(get(reward,'modifier'));
 }
 return world.modifiers.has('epoch_c_symbiotic_world');
}
function symbioticWorld(deposit='d_epoch_iv_matrix'){
 const owner={...empire(profiles.organic,'free'),id:'original',perks:new Set(['ap_epoch_living'])};
 return {is_colony:true,owner,deposits:new Set([deposit]),modifiers:new Set()};
}
for(const deposit of ['d_epoch_iv_matrix','d_epoch_iv_fold','d_epoch_iv_archive']){
 const world=symbioticWorld(deposit);
 check(gate(get(symbiosis,'potential'),world)&&gate(get(symbiosis,'allow'),world),'valid decision start '+deposit);
 check(finishSymbiosis(world),'each positive family can earn symbiosis '+deposit);
 check(!gate(get(symbiosisBranch,'limit'),world),'existing modifier prevents reaward '+deposit);
}
const lostPrerequisites={
 colony:w=>{w.is_colony=false;},owner:w=>{delete w.owner;},deposit:w=>{w.deposits.clear();},
 technology:w=>{w.owner.techs.delete('tech_epoch_iv_harmonization');},key:w=>{w.owner.flags.delete('epoch_iv_protocol_key');},
 completion:w=>{w.owner.flags.delete('epoch_iv_complete');},eligibility:w=>{w.owner.eligible=false;},
 perk:w=>{w.owner.perks.clear();},hiveOwner:w=>{Object.assign(w.owner,profiles.hive);},machineOwner:w=>{Object.assign(w.owner,profiles.machine);},
 unqualifiedConqueror:w=>{w.owner={...empire(profiles.organic,'free'),id:'conqueror'};}
};
for(const [reason,mutate]of Object.entries(lostPrerequisites)){
 const world=symbioticWorld();check(gate(get(symbiosis,'potential'),world)&&gate(get(symbiosis,'allow'),world),'valid before loss '+reason);
 mutate(world);check(!finishSymbiosis(world),'no permanent reward after loss '+reason);
}
const duplicate=symbioticWorld();duplicate.modifiers.add('epoch_c_symbiotic_world');
check(!gate(get(symbiosisBranch,'limit'),duplicate),'completion rejects an existing modifier');
// Inversion already repeats potential+allow and calls A's guarded conversion unchanged.
const aTriggers=new Map(tree('common/scripted_triggers/epoch_ascension_scripted_triggers.txt'));
for(const key of ['epoch_iv_safe_world','epoch_iv_diagnosis_matches','epoch_iv_contamination','epoch_iv_scar','epoch_iv_structure'])triggers.set(key,aTriggers.get(key));
const inversionBranch=get(get(defs('decisions').get('decision_epoch_c_network_inversion'),'effect'),'if');
const conversion=new Map(tree('common/scripted_effects/epoch_ascension_scripted_effects.txt')).get('epoch_iv_convert_world');
const conversionLimit=get(get(conversion,'if'),'limit');
check(get(inversionBranch,'epoch_iv_convert_world')==='yes','reuse the existing conversion effect');
for(const [family,deposit]of [['contamination','d_epoch_resonance_contamination_active'],['scar','d_epoch_resonance_scar'],['structure','d_epoch_silent_structure_secured']]){
 const fresh=()=>({...symbioticWorld(),deposits:new Set([deposit]),flags:new Set(['epoch_iv_diagnosed_'+family+'@original','epoch_iv_stabilized@original'])});
 const world=fresh();world.owner.megas=['epoch_nexus_1'];
 check(gate(get(inversionBranch,'limit'),world)&&gate(conversionLimit,world),'valid network conversion '+family);
 for(const reason of ['colony','owner','deposit','key','completion','eligibility','unqualifiedConqueror','technology','network','diagnosis','stabilization']){
  const changed=fresh();changed.owner.megas=['epoch_nexus_1'];
  if(reason==='technology')changed.owner.techs.delete('tech_epoch_iv_inversion');
  else if(reason==='network')changed.owner.megas=[];
  else if(reason==='diagnosis')changed.flags.delete('epoch_iv_diagnosed_'+family+'@original');
  else if(reason==='stabilization')changed.flags.delete('epoch_iv_stabilized@original');
  else lostPrerequisites[reason](changed);
  check(!gate(get(inversionBranch,'limit'),changed),'inversion completion rejects lost '+reason+'/'+family);
  if(['colony','owner','deposit','eligibility','unqualifiedConqueror','diagnosis','stabilization'].includes(reason))check(!gate(conversionLimit,changed),'reused A conversion independently guards '+reason+'/'+family);
 }
}
for(const [name,profile]of Object.entries(profiles))for(const p of ['guard','free']){
 const e=empire(profile,p),c=classFor(name),classTree={organic:'symbiosis',hive:'convergence',machine:'network'}[c],classAP={organic:'living',hive:'hive',machine:'machine'}[c];
 const visible=[...cats].filter(([,b])=>gate(get(b,'potential'),e)).map(([id])=>id);
 assert.deepEqual(visible.sort(),['tradition_epoch_legacy','tradition_epoch_'+classTree].sort());checks++;
 const selectable=[...perks].filter(([,b])=>gate(get(b,'potential'),e)&&gate(get(b,'possible'),e)).map(([id])=>id);
 assert.deepEqual(selectable.sort(),['ap_epoch_'+classAP,'ap_epoch_'+p].sort());checks++;
 // Finishing legacy is required; slots are never fabricated by scripts.
 check(!gate(get(cats.get('tradition_epoch_'+classTree),'potential'),{...e,traditions:new Set()}),'legacy gates class tree '+name);
 for(const flags of [[],['epoch_iv_protocol_key'],['epoch_iv_complete']])for(const [,b]of [...cats,...perks,...megas])check(!gate(get(b,'potential'),{...e,flags:new Set(flags)}),'no pre-key native unlock '+name);
 const conflicting={...e,flags:new Set([...e.flags,'epoch_iv_philosophy_'+(p==='guard'?'free':'guard')])};
 for(const id of ['guard','free']){
  check(!gate(get(perks.get('ap_epoch_'+id),'possible'),conflicting),'conflicting story flags fail closed '+name+'/'+id);
  const effect=get(perks.get('ap_epoch_'+id),'triggered_modifier');
  check(!gate(get(effect,'potential'),conflicting),'conflicting story flags disable perk bonuses '+id);
  check(!gate(get(effect,'potential'),{...e,perks:new Set(['ap_epoch_guard','ap_epoch_free'])}),'corrupt duplicate perks cannot stack '+id);
 }
 e.perks=new Set(['ap_epoch_'+classAP,'ap_epoch_'+p]);
 const species={from:e,traits:new Set(c==='hive'?['trait_hive_mind',...(name==='wilderness'?['trait_wilderness']:[])]:c==='machine'?['trait_machine_unit']:[])};
 const allowed=[...traits].filter(([,t])=>gate(get(t,'species_potential_add'),species)&&gate(get(t,'species_possible_add'),species)).map(([id])=>id);
 assert.deepEqual(allowed.sort(),(c==='organic'?['trait_epoch_physiology','trait_epoch_intelligence','trait_epoch_imprinted']:c==='hive'?['trait_epoch_drones','trait_epoch_imprinted']:['trait_epoch_core','trait_epoch_imprinted']).sort());checks++;
 for(const [,t]of traits)check(!gate(get(t,'species_possible_merge_add'),{...species,from:{...e,perks:new Set()}}),'foreign templates cannot bypass perks '+name);
 for(const [,t]of traits)for(const mode of ['species_possible_add','species_possible_merge_add'])check(!gate(get(t,mode),{...species,traits:new Set([...species.traits,'trait_invasive'])}),'native Invasive Species exclusion survives template application '+name);
 if(name==='wilderness')check(gate(get(traits.get('trait_epoch_drones'),'species_possible_add'),{...species,traits:new Set(['trait_wilderness'])}),'Wilderness trait need not depend on hive marker');
 const modes=values(traits.get('trait_epoch_imprinted'),'triggered_species_modifier').filter(b=>gate(get(b,'potential'),species));
 check(modes.length===1,'exactly one class-sensitive final trait effect '+name);
 // Each structure has an operating first tier; final tier replaces rather than adds lower output.
 for(const family of manifest.megastructures){
  const owned={...e,megas:['epoch_'+family.id+'_1']};
  const first=megas.get('epoch_'+family.id+'_1'),r=get(first,'resources');
  const produces=values(r,'produces').filter(b=>gate(get(b,'trigger'),owned));
  check(produces.length===1,'operating stage one '+name+'/'+p+'/'+family.id);
  check(values(r,'produces').every(b=>!deep(get(b,'trigger'),'has_megastructure_flag').length),'production uses country scope; native engine activates completed stages '+family.id);
  if(family.id!=='forge'){
   const duplicate={...owned,megas:[...owned.megas,'epoch_'+family.id+'_2']};
   check(values(r,'produces').every(b=>!gate(get(b,'trigger'),duplicate)),'conquered duplicates do not stack production '+family.id);
   check(values(first,'triggered_country_modifier').every(b=>!gate(get(b,'potential'),{owner:duplicate})),'conquered duplicates do not stack modifiers '+family.id);
  }
  for(const res of ['energy',family.id==='forge'?'minerals':'epoch_protocol_cores'])check(values(r,'produces').every(b=>!gate(get(b,'trigger'),{...owned,deficits:new Set([res])})),'no output through input shortage '+family.id+'/'+res);
 }
 const inversion=defs('decisions').get('decision_epoch_c_network_inversion'),costs=values(get(inversion,'resources'),'cost');
 for(const structures of [[],['epoch_nexus_1'],['epoch_uap_1'],['epoch_nexus_1','epoch_uap_4']]){
  const owner={...e,megas:structures},live=structures.includes('epoch_nexus_1')||(p==='free'&&structures.some(x=>x.startsWith('epoch_uap_')));
  check(gate(triggers.get('epoch_c_healing_network'),owner)===live,'real owner-scoped healing infrastructure '+name+'/'+p+'/'+structures);
  const active=costs.filter(b=>gate(get(b,'trigger'),{owner}));
  check(active.length===1,'exclusive native healing price '+name+'/'+p);
  const discounted=p==='free'&&structures.some(x=>x.startsWith('epoch_uap_'));
  check(Number(get(active[0],'energy'))===(discounted?1600:2400)&&Number(get(active[0],'epoch_protocol_cores'))===(discounted?40:60),'UAP healing discount requires personal Free interface '+name);
 }
 check(!gate(triggers.get('epoch_c_healing_network'),{...e,megas:[{type:'epoch_nexus_1',operational:false},{type:'epoch_uap_1',operational:false}]}),'unfinished sites cannot unlock planetary healing');
}
const nativeTechs=new Set(fs.readdirSync(path.join(vanilla,'common/technology')).filter(p=>p.endsWith('.txt')).flatMap(p=>[...native('common/technology/'+p).matchAll(/^(tech_\w+)\s*=/gm)].map(m=>m[1])));
for(const [id,b]of [...perks,...megas])for(const t of deep(b,'has_technology').concat((get(b,'prerequisites')||[]).map(([,v])=>unquote(v))))check(techs.has(t)||nativeTechs.has(t),'real tech reference '+id+'/'+t);
for(const [id,t]of traits){
 check(get(t,'initial')==='no'&&get(t,'randomized')==='no'&&Number(get(t,'cost'))>0,'earned native modification '+id);
 check(get(t,'species_possible_remove').length>0&&get(t,'species_possible_merge_add').length>0,'native removal and template merge guards '+id);
 for(const [,opposite]of get(t,'opposites'))check(traits.has(unquote(opposite))||(unquote(opposite)==='trait_invasive'&&native('common/traits/04_species_traits.txt').includes('trait_invasive =')),'defined exclusion '+opposite);
}
for(const f of manifest.megastructures)for(let n=1;n<=f.stages;n++){
 const id=`epoch_${f.id}_${n}`,b=megas.get(id),r=get(b,'resources'),cost=get(r,'cost'),upkeep=get(r,'upkeep');
 check(Number(get(b,'build_time'))>=1800,'real construction time '+id);
 for(const resource of ['alloys','unity','epoch_protocol_cores'])check(Number(get(cost,resource))>0,'paid '+resource+' construction '+id);
 check(Number(get(cost,'epoch_protocol_cores'))<=15000,'fits Package-B stockpile '+id);
 check(Number(get(upkeep,'energy'))>0&&Number(get(upkeep,f.id==='forge'?'minerals':'epoch_protocol_cores'))>0,'running inputs '+id);
 if(n>1)check(get(b,'upgrade_from')[0][1]===`epoch_${f.id}_${n-1}`,'unbroken native upgrade chain '+id);
 else{
  const place=get(get(b,'placement_rules'),'planet_possible');
  check(get(place,'colonizable_planet')==='no'&&deep(place,'is_star').includes('yes')&&deep(place,'has_anomaly').includes('yes'),'safe nonhabitable orbital construction '+id);
  check(get(b,'on_build_start').length===0&&!deep(get(b,'possible'),'has_country_flag').length,'no self-invalidating reservation flag '+id);
 }
 check(deep(get(b,'on_dismantle_complete'),'has_planet_flag').includes('epoch_c_'+f.id+'_anchor'),'dismantle touches only its anchor '+id);
 check(Number(get(get(b,'ai_weight'),'factor'))>0,'native AI weight '+id);
}
// Core economy: one paid Forge III funds a Nexus III + Interface IV with 26 cores left.
const output=(id,res)=>values(get(megas.get(id),'resources'),'produces').reduce((sum,b)=>sum+Number(get(b,res)||0),0);
const upkeep=(id,res)=>Number(get(get(get(megas.get(id),'resources'),'upkeep'),res)||0);
check(output('epoch_forge_3','epoch_protocol_cores')+output('epoch_nexus_3','epoch_protocol_cores')-upkeep('epoch_nexus_3','epoch_protocol_cores')-upkeep('epoch_uap_4','epoch_protocol_cores')===26,'integrated infrastructure core surplus is real');
check(output('epoch_nexus_3','epoch_protocol_cores')-upkeep('epoch_nexus_3','epoch_protocol_cores')===6,'Nexus is a limited net core source');
check(upkeep('epoch_forge_3','minerals')===1200&&upkeep('epoch_forge_3','energy')===180,'industrial production has significant native inputs');
// Every modifier must exist in generated engine documentation, native static aliases, or be generated by a real EPOCH job.
const modDoc=fs.readFileSync(path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation/modifiers.log'),'utf8');
const aliases=new Set(parse(native('common/static_modifiers/24_static_modifiers_jobs.txt'),'native workforce aliases').map(([k])=>k));
const jobs=new Set(tree('common/pop_jobs/epoch_era_jobs.txt').map(([k])=>k));
function modifiers(b){for(const [k,v]of b){if(['ai_weight','weight'].includes(k))continue;if(Array.isArray(v)&&['modifier','triggered_modifier','triggered_country_modifier','triggered_species_modifier'].includes(k))for(const [m,n]of v)if(!Array.isArray(n))check(modDoc.includes('- '+m+',')||aliases.has(m)||[...jobs].some(j=>m===`pop_${j}_bonus_workforce_mult`),'documented/generated modifier '+m);if(Array.isArray(v))modifiers(v);}}
for(const p of [...parsedByPath.keys()].filter(p=>p.includes('/epoch_c_')))modifiers(tree(p));
const asset=p=>fs.existsSync(path.join(root,p))||fs.existsSync(path.join(vanilla,p));
const gfx=read('interface/epoch_c.gfx');
for(const m of gfx.matchAll(/texturefile = "([^"]+)"/g))check(asset(m[1]),'resolved sprite texture '+m[1]);
for(const [,b]of [...traits,...defs('static_modifiers')])check(asset(unquote(get(b,'icon'))),'resolved trait/modifier texture '+get(b,'icon'));
const nativeEntities=['03_think_tank.txt','06_matter_decompressor.txt','07_strategic_coordination_center.txt'].map(p=>native('common/megastructures/'+p)).join('\n');
for(const [,b]of megas)for(const field of ['entity','construction_entity','portrait'])check(nativeEntities.includes(get(b,field)),'native megastructure art '+get(b,field));
for(const [id]of [...traditions,...perks])check(gfx.includes('name = "GFX_'+id+'"'),'registered native icon '+id);
const names=[...cats.keys(),...traditions.keys(),...perks.keys(),...traits.keys(),...defs('decisions').keys(),...defs('static_modifiers').keys()];
let prior;
for(const lang of ['english','german']){
 const p=`localisation/${lang}/epoch_c_l_${lang}.yml`,bytes=fs.readFileSync(path.join(root,p)),s=read(p);
 check(bytes.subarray(0,3).equals(Buffer.from([239,187,191])),'native UTF-8 BOM '+lang);
 const keys=[...s.matchAll(/^ ([\w.]+):0 ".*"$/gm)].map(m=>m[1]);check(new Set(keys).size===keys.length,'no duplicate localization '+lang);
 for(const id of names)check(keys.includes(id)&&keys.includes(id+'_desc'),'localized name and description '+lang+'/'+id);
 for(const [id]of wildernessSwaps)for(const suffix of ['','_desc']){
  const entries=new Map([...s.matchAll(/^ ([\w.]+):0 "(.*)"$/gm)].map(m=>[m[1],m[2]]));
  check(entries.has(id+'_wilderness'+suffix)&&entries.get(id+'_wilderness'+suffix)!==entries.get(id+suffix),'distinct localized Wilderness swap '+lang+'/'+id+suffix);
 }
 for(const id of megas.keys())for(const suffix of ['','_DESC','_MEGASTRUCTURE_DETAILS','_CONSTRUCTION_INFO_DELAYED'])check(keys.includes(id+suffix),'localized mega UI '+lang+'/'+id+suffix);
 if(prior){assert.deepEqual(keys.sort(),prior);checks++;}prior=keys.sort();
}
// Installed source patterns and native limits: no GUI/define replacements in the delta.
check(native('launcher-settings.json').includes('Cygnus v4.5.3 (4e91)'),'installed version');
check(/ASCENSION_PERKS_SLOTS\s*=\s*8/.test(native('common/defines/00_defines.txt'))&&/TRADITION_CATEGORIES_MAX\s*=\s*7/.test(native('common/defines/00_defines.txt')),'native slot bounds');
const megaDoc=native('common/megastructures/99_README_MEGASTRUCTURES.txt');
for(const field of ['upgrade_from','potential','possible','placement_rules','resources','dismantle_possible','triggered_country_modifier'])check(megaDoc.includes(field),'native megastructure contract '+field);
check(megaDoc.includes('trigger, scope: country. Monthly output'),'native resource COUNTRY scope, confirmed by actual playtest diagnostics');
check(native('common/traits/000_documentation_species_traits.txt').includes('this = species, from = country'),'documented species modification scopes');
const robo=native('common/technology/00_synthetic_dawn_tech.txt');
check(robo.includes('tech_robomodding_m =')&&robo.includes('is_individual_machine = yes'),'machine/individual machine modification tech');
// Compatibility spot checks use native selectable traits/rules, not a fictional category override.
const nativeSwap=get(new Map(parse(native('common/traditions/00_versatility.txt'),'native versatility')).get('tr_versatility_finish'),'tradition_swap');
for(const field of ['inherit_effects','inherit_name','inherit_icon'])for(const [id]of wildernessSwaps)check(get(get(traditions.get(id),'tradition_swap'),field)===get(nativeSwap,field),'explicit inheritance matches native replacement swap '+id+'/'+field);
const nomadTraits=new Map(parse(native('common/traits/18_nomads_species_traits.txt'),'native nomad traits'));
for(const id of ['trait_structural_awareness','trait_interconnected']){
 const t=nomadTraits.get(id);
 check((get(t,'category')||'normal')==='normal'&&Number(get(t,'cost'))>0&&get(t,'species_possible_add').length>0,'native paid modifiable normal-category mechanical trait '+id);
 for(const archetype of ['ROBOT','MACHINE'])check(get(t,'allowed_archetypes').some(([,v])=>v===archetype),'native normal trait permits '+archetype+'/'+id);
}
const imprinted=traits.get('trait_epoch_imprinted');
check(get(imprinted,'category')==='normal'&&get(imprinted,'hidden')!=='yes','imprinted retains a source-compatible visible category');
for(const archetype of ['BIOLOGICAL','LITHOID','ROBOT','MACHINE'])check(get(imprinted,'allowed_archetypes').some(([,v])=>v===archetype),'imprinted explicitly allows '+archetype);
const society=new Map(parse(native('common/technology/00_soc_tech.txt'),'native society research'));
triggers.set('is_natural_design_empire',new Map(parse(native('common/scripted_triggers/02_scripted_triggers_machine_age.txt'),'native machine age triggers')).get('is_natural_design_empire'));
const wilderness={...profiles.wilderness,civics:new Set()};
for(const id of ['tech_genome_mapping','tech_gene_tailoring'])check(gate(get(society.get(id),'potential'),wilderness),'regular Wilderness can research native '+id);
assert.deepEqual(get(society.get('tech_gene_tailoring'),'prerequisites'),[[null,'"tech_genome_mapping"']]);checks++;
check(get(society.get('tech_gene_tailoring'),'feature_flags').some(([,v])=>v==='modify_traits'),'reachable native technology enables species modification');
check(!gate(get(society.get('tech_gene_tailoring'),'potential'),{...wilderness,civics:new Set(['civic_hive_natural_design'])}),'native Natural Design restriction is preserved');
const nativeRules=new Map(parse(native('common/game_rules/00_rules.txt'),'native game rules'));
const organicRule=values(nativeRules.get('can_modify_species'),'if').find(b=>deep(get(b,'limit'),'is_archetype').includes('BIOLOGICAL'));
const nativeOrganicRequirement=get(organicRule,'custom_tooltip').filter(([k])=>k!=='fail_text');
check(gate(nativeOrganicRequirement,{root:{techs:new Set(['tech_gene_tailoring'])}}),'native organic modification rule accepts researched Gene Tailoring');
check(!gate(nativeOrganicRequirement,{root:{techs:new Set()}}),'native organic modification rule still rejects missing technology/traditions');
for(const [p]of [...parsedByPath].filter(([p])=>p.includes('/epoch_c_')))check(!/give_technology|research_technology|modify_species|change_species|add_trait_species|set_country_flag = epoch_iv_philosophy_/.test(read(p)),'no free unlock, species conversion or story rewrite '+p);
const base='944c3c2';
for(const p of cp.execFileSync('git',['ls-tree','-r','--name-only',base,'common','events','interface'],{encoding:'utf8'}).trim().split(/\r?\n/))check(read(p).replaceAll('\r\n','\n')===cp.execFileSync('git',['show',base+':'+p],{encoding:'utf8'}).replaceAll('\r\n','\n'),'Package A/B and story preserved '+p);
check(!fs.existsSync(path.join(root,'common/defines'))&&!fs.existsSync(path.join(root,'interface/topbar_traditions_view.gui')),'no slot or vanilla GUI override');
console.log(`PASS: ${checks} Package-C native content, class/philosophy matrices, trait/template gates, paid upgrade chains, capped capture behavior, shortage economy, DE/EN, art and B preservation assertions. Static only.`);
