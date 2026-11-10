// Package B contracts against executable content and the installed 4.5.3 source.
// This deliberately does not simulate combat, AI construction or native UI loading.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {parse,get,parsedByPath}=require('./test_clausewitz_structure.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..');
const vanilla=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
const tree=p=>parsedByPath.get(p)||parse(read(p),p);
const unquote=s=>s?.replace(/^"|"$/g,'');
const all=(folder)=>[...parsedByPath].filter(([p])=>p.startsWith('common/'+folder+'/')).flatMap(([,b])=>b);
const deep=(b,key)=>b.flatMap(([k,v])=>[...(k===key?[v]:[]),...(Array.isArray(v)?deep(v,key):[])]);
let checks=0;function check(v,m){checks++;assert.ok(v,m);}
const technologies=new Map(all('technology').filter(([k])=>k.startsWith('tech_epoch_iv_')));
const era=new Map(tree('common/technology/epoch_era_technology.txt'));
const manifest=JSON.parse(read('docs/research/stage-iv-b-content.json'));
check(technologies.size===42&&era.size===36,'42 regular Stage-IV technologies, six prototypes and 36 additions');
for(const area of ['physics','society','engineering'])check([...technologies.values()].filter(t=>get(t,'area')===area).length===14,'14 technologies in '+area);
for(const [rank,n]of [[1,12],[2,14],[3,10]])check([...era.values()].filter(t=>Number(get(t,'tier'))===rank+2).length===n,'conceptual tier '+rank+' count');
const nativeTechs=new Set(fs.readdirSync(path.join(vanilla,'common/technology')).filter(p=>p.endsWith('.txt')).flatMap(p=>[...native('common/technology/'+p).matchAll(/^(tech_\w+)\s*=/gm)].map(m=>m[1])));
const prereqs=t=>(get(t,'prerequisites')||[]).map(([,v])=>unquote(v));
const visited=new Set(),visiting=new Set();
function visit(id){check(!visiting.has(id),'acyclic prerequisite: '+id);if(visited.has(id))return;visiting.add(id);for(const p of prereqs(technologies.get(id))){check(technologies.has(p)||nativeTechs.has(p),'real prerequisite '+id+' -> '+p);if(technologies.has(p))visit(p);}visiting.delete(id);visited.add(id);}
for(const id of technologies.keys())visit(id);
const future=new Map(tree('common/scripted_triggers/epoch_ascension_scripted_triggers.txt')).get('epoch_iv_future_research');
assert.deepEqual(future,[['epoch_iv_eligible','yes'],['has_country_flag','epoch_iv_protocol_key'],['has_country_flag','epoch_iv_complete']]);checks++;
function gate(b,empire){return b.every(([k,v])=>{
 if(k==='epoch_iv_future_research')return gate(future,empire);
 if(k==='epoch_iv_eligible')return empire.eligible;
 if(k==='has_country_flag')return empire.flags.has(v);
 if(k==='has_technology')return empire.techs?.has(v)||false;
 if(k==='NOT')return !gate(v,empire);
 if(k==='OR')return v.some(pair=>gate([pair],empire));
 if(k==='AND')return gate(v,empire);
 if(k==='exists')return v==='owner'&&!!empire.owner;
 if(k==='owner')return gate(v,empire.owner);
 if(['is_gestalt','is_robot_empire','is_hive_empire','country_uses_bio_ships','is_wilderness_empire','is_special_colony_type','is_lithoid_empire'].includes(k))return !!empire[k]===(v==='yes');
 throw Error('Unsupported eligibility contract '+k);
 });}
const profiles={wilderness:{is_wilderness_empire:true,is_hive_empire:true,is_gestalt:true},wilderness_bio:{is_wilderness_empire:true,is_hive_empire:true,is_gestalt:true,country_uses_bio_ships:true},lithoid:{is_lithoid_empire:true},organic:{},hive:{is_gestalt:true,is_hive_empire:true},machine:{is_gestalt:true,is_robot_empire:true},individual_machine:{is_robot_empire:true},biological_hulls:{country_uses_bio_ships:true}};
for(const [name,profile,philosophy]of Object.entries(profiles).flatMap(([n,p])=>['guard','free'].map(f=>[n+'/'+f,p,f]))){
 const e={...profile,eligible:true,flags:new Set(['epoch_iv_protocol_key','epoch_iv_complete','epoch_iv_philosophy_'+philosophy])};
 for(const flags of [[],['epoch_iv_protocol_key'],['epoch_iv_complete']]){
  const locked={...e,flags:new Set(flags)};
  for(const [id,t]of era)check(!gate(get(t,'potential'),locked),'personal completion gate '+name+'/'+flags+'/'+id);
 }
 for(const [id,t]of era)check(!gate(get(t,'potential'),{...e,eligible:false}),'private eligibility '+name+'/'+id);
 const eligible=[...era].filter(([,t])=>gate(get(t,'potential'),e));
 const known=new Set([...technologies.keys()].filter(k=>!era.has(k)));known.add('tech_titans');
 let changed=true;while(changed){changed=false;for(const [id,t]of eligible)if(!known.has(id)&&prereqs(t).every(p=>known.has(p))){known.add(id);changed=true;}}
 for(const [id]of eligible)check(known.has(id),'reachable research '+name+'/'+id);
 // The economy must stay reachable even for hulls which cannot use conventional equipment.
 for(const id of ['cores','fabrication','nexus','uap_core','coupling','sovereignty'])check(known.has('tech_epoch_iv_'+id),'universal infrastructure '+name+'/'+id);
}
for(const [id,t]of era){
 check(get(get(t,'potential'),'epoch_iv_future_research')==='yes','explicit card eligibility '+id);
 check(get(t,'is_reverse_engineerable')==='no','debris cannot bypass private research '+id);
 check(Number(get(t,'cost'))>0&&Number(get(t,'weight'))>0&&Number(get(get(t,'ai_weight'),'weight'))>0,'normal paid research and AI '+id);
 const contract=manifest.technologies.find(x=>x.id===id);check(!!contract&&JSON.stringify(contract.prerequisites)===JSON.stringify(prereqs(t)),'documented exact DAG '+id);
}
const buildings=new Map(tree('common/buildings/epoch_era_buildings.txt'));
const jobs=new Map(tree('common/pop_jobs/epoch_era_jobs.txt'));
check(buildings.size===18&&manifest.buildingFamilies.length===8&&jobs.size===16,'eight families, eighteen tiers, sixteen organic/drone jobs');
for(const f of manifest.buildingFamilies){
 check(f.levels>=2&&f.levels<=3,'two to three levels '+f.id);
 for(let i=1;i<=f.levels;i++){
  const id=`building_epoch_${f.id}_${i}`,b=buildings.get(id),r=get(b,'resources');
  check(!!b&&get(b,'can_build')===(i===1?'yes':'no'),'real sequential upgrade '+id);
  check(Number(get(get(r,'cost'),'minerals'))>0&&Number(get(get(r,'upkeep'),'energy'))>0,'paid construction and upkeep '+id);
  check(deep(b,'job_epoch_'+f.id+'_add').includes(String(f.workforce[i-1]))&&deep(b,'job_epoch_'+f.id+'_drone_add').includes(String(f.workforce[i-1])),'both staffed job variants '+id);
  for(const key of ['epoch_'+f.id,'epoch_'+f.id+'_drone'])check(jobs.has(key),'defined job '+key);
  if(i<f.levels)check(prereqs(b).length>0&&get(b,'upgrades')[0][1]===`"building_epoch_${f.id}_${i+1}"`,'upgrade link '+id);
  check(get(b,'building_sets').length>0&&get(b,'planet_limit')==='1','native building set and colony cap '+id);
  if(f.id==='factory'){
   check(!deep(get(r,'cost'),'epoch_protocol_cores').length&&!deep(get(r,'upkeep'),'epoch_protocol_cores').length,'no core bootstrap loop '+id);
   check(!get(b,'empire_limit'),'factory scales by paid colonies rather than fixed empire cap '+id);
  }
 }
}
check(JSON.stringify(get(buildings.get('building_epoch_factory_1'),'potential')).includes('building_epoch_factory_2'),'factory colony guard includes upgraded factories');
for(const id of ['epoch_factory','epoch_factory_drone']){
 const r=get(jobs.get(id),'resources');check(Number(get(get(r,'produces'),'epoch_protocol_cores'))===2,'real staffed core output '+id);
 check(!deep(r,'upkeep').some(b=>get(b,'epoch_protocol_cores')),'core job bootstraps from vanilla inputs '+id);
 for(const input of ['minerals','alloys','energy'])check(Number(get(get(r,'upkeep'),input))>0,'factory consumes '+input);
}
const strategic=tree('common/strategic_resources/epoch_era_resources.txt');
check(strategic.length===1&&strategic[0][0]==='epoch_protocol_cores','exactly one new resource');
const resource=strategic[0][1];check(get(resource,'tradable')==='no'&&Number(get(resource,'max'))===15000,'stored resource with no market bypass');
check(get(resource,'deficit_modifier')==='epoch_era_core_deficit','real native shortage response');
const hardware=tree('common/component_templates/epoch_era_weapons.txt');
const utilities=tree('common/component_templates/epoch_era_utilities.txt');
const component=(b,key)=>b.find(([,v])=>unquote(get(v,'key'))===key)?.[1];
check(hardware.length===8&&new Set(hardware.map(([,b])=>prereqs(b)[0])).size===7,'seven weapons; one has M/L variants');
check(utilities.length===26&&manifest.utilityFamilies.length===6,'six component families with native size/hull/role variants');
const nativeComponentFiles=new Set([...manifest.weapons.map(w=>w.source),'00_strike_craft.txt','00_utilities_roles.txt']);
const nativeComponents=[...nativeComponentFiles].flatMap(p=>parse(native('common/component_templates/'+p),p).filter(([,b])=>Array.isArray(b)&&get(b,'key')));
const nativeComponent=key=>component(nativeComponents,key);
const sets=[...tree('common/component_sets/epoch_era_sets.txt'),...fs.readdirSync(path.join(vanilla,'common/component_sets')).filter(p=>p.endsWith('.txt')).flatMap(p=>parse(native('common/component_sets/'+p),p))];
const setKeys=new Set(sets.filter(([,b])=>Array.isArray(b)).map(([,b])=>unquote(get(b,'key'))));
for(const [,b]of [...hardware,...utilities]){
 const id=unquote(get(b,'key'));check(setKeys.has(unquote(get(b,'component_set'))),'real native slot set '+id);
 for(const p of prereqs(b))check(technologies.has(p),'hardware tech exists '+id+'/'+p);
 check(deep(get(b,'potential'),'epoch_iv_future_research').includes('yes'),'equipment owner rechecks key '+id);
 const r=get(b,'resources');check(Number(get(get(r,'cost'),'alloys'))>0&&Number(get(get(r,'cost'),'epoch_protocol_cores'))>0&&Number(get(get(r,'upkeep'),'epoch_protocol_cores'))>0,'equipment has real costs and ongoing core draw '+id);
 check(deep(get(b,'ai_weight'),'has_monthly_income').some(t=>get(t,'resource')==='epoch_protocol_cores')&&deep(get(b,'ai_weight'),'resource_stockpile_compare').some(t=>get(t,'resource')==='epoch_protocol_cores'),'AI requires positive core production and stockpile without market dependence '+id);
 check(!JSON.stringify(b).includes('"null"'),'no invalid null upgrade '+id);
}
const csv=native('common/component_templates/weapon_components.csv').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split(';'));const columns=csv.shift();const rows=new Map(csv.map(r=>[r[0],Object.fromEntries(columns.map((c,i)=>[c,Number(r[i])]))]));
for(const entry of manifest.weapons){
 const b=component(hardware,entry.key),base=nativeComponent(entry.vanilla),stats=rows.get(entry.vanilla);
 check(get(b,'size')===get(base,'size')&&get(b,'type')===get(base,'type'),'native tactical slot/type '+entry.key);
 const overrides={EPOCH_PHASE_M:{range:50,shield_damage:0.15},EPOCH_PHASE_L:{range:70,shield_damage:0.15},EPOCH_CAUSAL_LANCE:{range:175,cooldown:90},EPOCH_FRACTAL_ARTILLERY:{shield_damage:3,armor_damage:0.25,cooldown:60}}[entry.key]||{};
 for(const k of ['range','accuracy','tracking','shield_damage','armor_damage','shield_penetration','armor_penetration','size_damage_factor','cooldown'])check(Number(get(b,k==='cooldown'?'total_fire_time':k))===(overrides[k]??stats[k]),'native values or explicitly bounded role '+entry.key+'/'+k);
 for(const [k,col]of [['min','min_damage'],['max','max_damage']])check(Math.abs(Number(get(get(b,'damage'),k))/stats[col]-entry.damageScale)<0.001,'bounded primary damage '+entry.key+'/'+k);
 if(entry.key.startsWith('EPOCH_PHASE_')){check(get(b,'chain_count')==='2'&&Number(get(b,'chain_range'))<=20,'two short chain bounces '+entry.key);check(Number(get(get(b,'damage'),'max'))===stats.max_damage,'no primary damage inflation '+entry.key);}
 if(entry.key==='EPOCH_CAUSAL_LANCE')check(get(b,'min_range')==='60'&&Number(get(b,'total_fire_time'))>stats.cooldown,'siege lance has minimum range and lower sustained damage');
 if(entry.key==='EPOCH_FRACTAL_ARTILLERY')check(get(b,'hull_damage')==='0.75'&&get(b,'min_range')==='45.0','shield artillery trades armor/hull damage and close range');
 check(Number(get(b,'power'))<stats.power,'higher power draw '+entry.key);
 check(get(b,'projectile_gfx')===get(base,'projectile_gfx'),'existing projectile art '+entry.key);
 check(!get(b,'cooldown')&&native('common/component_templates/000_documentation.txt').includes('# total_fire_time'),'documented weapon fire-cycle field '+entry.key);
}
check(get(component(hardware,'EPOCH_NULLWAVE_TORPEDO'),'size')==='torpedo','anti-capital torpedo uses G slot');
const fighters=component(hardware,'EPOCH_SWARM_FIGHTERS'),vanillaFighters=nativeComponent('STRIKE_CRAFT_HANGAR_3');
check(Number(get(get(fighters,'damage'),'max'))/Number(get(get(vanillaFighters,'damage'),'max'))===1.3,'strike-craft damage uplift');
check(get(fighters,'count')==='8'&&get(fighters,'shield_penetration')==='1.0','eight shield-bypassing fighters per H slot');
for(const role of ['SWARM','PICKET','LINE','ARTILLERY','CARRIER','TORPEDO']){
 const b=component(utilities,'EPOCH_COMPUTER_'+role),base=nativeComponent('COMBAT_COMPUTER_'+role+'_AUTONOMOUS');
 check(get(b,'ship_behavior')===get(base,'ship_behavior')&&get(b,'upgrade_path')===get(base,'upgrade_path'),'native combat AI role '+role);
 check(Number(get(get(b,'ship_modifier'),'ship_tracking_add'))===Number(get(get(base,'ship_modifier'),'ship_tracking_add')||0)+5,'five additional tracking without replacing native tracking '+role);
}
for(const [,b]of utilities)if(unquote(get(b,'key')).endsWith('_REACTOR'))check(Number(get(b,'power'))>0,'reactor actually supplies power');
const decisions=tree('common/decisions/epoch_era_decisions.txt'),edicts=tree('common/edicts/epoch_era_edicts.txt');
for(const [id,b]of decisions){assert.deepEqual(get(b,'allow'),get(get(get(b,'effect'),'if'),'limit'),'paid development rechecks completion, class and duplicate guards '+id);checks++;check(get(get(get(b,'resources'),'cost'),'epoch_protocol_cores')>0,'development paid in cores '+id);}
for(const id of ['symbiosis','synaptic_nodes'])check(JSON.stringify(new Map(decisions).get('decision_epoch_era_'+id)).includes('remove_modifier'),'advanced development replaces earlier form '+id);
const liveUnlocks=[...buildings,...hardware,...utilities,...strategic,...decisions,...edicts];
const references=(b,id)=>b.some(([,v])=>Array.isArray(v)?references(v,id):unquote(v)===id);
for(const [id,t]of era)check(get(t,'modifier')||liveUnlocks.some(([,b])=>references(b,id)),'technology has a live benefit '+id);
// Personal philosophy is immutable story state. Check offers, active effects, and legacy dual-edict saves.
const edictMap=new Map(edicts);
for(const choice of [[],['guard'],['free'],['guard','free']]){
 const e={eligible:true,flags:new Set(['epoch_iv_protocol_key','epoch_iv_complete',...choice.map(x=>'epoch_iv_philosophy_'+x)]),techs:new Set(['tech_epoch_iv_mandate','tech_epoch_iv_universal_sovereignty'])};
 for(const [id,flag]of [['warden_doctrine','guard'],['open_protocol','free']]){
  const b=edictMap.get('epoch_era_'+id),expected=choice.length===1&&choice[0]===flag;
  check(gate(get(b,'potential'),e)===expected,'philosophy offer '+choice+'/'+id);
  check(gate(get(get(b,'triggered_country_modifier'),'potential'),e)===expected,'legacy active edict cannot bypass philosophy '+choice+'/'+id);
 }
}
// Positive Wilderness path: production, paid universal outputs, and no dummy job-building unlocks.
const wc=edictMap.get('epoch_era_wilderness_cores'),wi=edictMap.get('epoch_era_wilderness_integration');
const tables=(b,k)=>get(b,'resources').filter(([key])=>key===k).map(([,v])=>v);
function economicGate(b,e){return (b||[]).every(([k,v])=>k==='has_deficit'?e.deficits.has(v):k==='NOT'?!economicGate(v,e):gate([[k,v]],e));}
function output(b,resource,e){return tables(b,'produces').filter(t=>economicGate(get(t,'trigger'),e)).reduce((n,t)=>n+Number(get(t,resource)||0),0);}
const wild={eligible:true,is_wilderness_empire:true,is_hive_empire:true,is_gestalt:true,flags:new Set(['epoch_iv_protocol_key','epoch_iv_complete']),techs:new Set(['tech_epoch_iv_cores','tech_epoch_iv_reconstruction']),deficits:new Set()};
check(gate(get(wc,'potential'),wild)&&gate(get(wi,'potential'),wild),'Wilderness can activate paid production and integration after earned research');
check(output(wc,'epoch_protocol_cores',wild)===12,'Wilderness can bootstrap twelve actual cores without jobs');
check(output(wi,'physics_research',wild)===3,'Wilderness gains actual early research output');
wild.techs=new Set(era.keys());
check(output(wc,'epoch_protocol_cores',wild)===24,'Wilderness UAP production doubles');
check(output(wi,'physics_research',wild)===27&&output(wi,'society_research',wild)===24&&output(wi,'engineering_research',wild)===18,'universal research nodes have cumulative Wilderness benefits');
for(const input of ['minerals','alloys','energy'])check(output(wc,'epoch_protocol_cores',{...wild,deficits:new Set([input])})===0,'Wilderness fabrication stops during '+input+' deficit');
check(output(wi,'physics_research',{...wild,deficits:new Set(['epoch_protocol_cores'])})===0,'Wilderness research suspends under core shortage');
for(const [id,b]of buildings)check(!gate(get(b,'potential'),{owner:wild}),'Wilderness does not see incompatible job building '+id);
for(const tech of Object.keys(manifest.wildernessIntegration))check(JSON.stringify(wi).includes('tech_epoch_iv_'+tech),'universal building research has actual Wilderness alternative '+tech);
for(const id of ['tissue','symbiosis']){
 const d=new Map(decisions).get('decision_epoch_era_'+id),text=JSON.stringify(d);
 check(text.includes('is_lithoid_empire')&&text.includes('epoch_era_'+id+'_lithoid'),'paid organic development branches for lithoids '+id);
 const mods=new Map(tree('common/static_modifiers/epoch_era_modifiers.txt'));
 check(get(mods.get('epoch_era_'+id+'_lithoid'),'planet_jobs_minerals_produces_mult')===(id==='tissue'?'0.10':'0.20'),'lithoid mineral effect '+id);
 check(!get(mods.get('epoch_era_'+id+'_lithoid'),'planet_jobs_food_produces_mult'),'no useless lithoid food effect '+id);
}
// Bio-ships hide exactly eleven equipment-only cards; infrastructure remains reachable above.
check([...era.values()].filter(t=>get(get(t,'potential'),'country_uses_bio_ships')==='no').length===11,'eleven incompatible military cards');
// Economic load is derived from real component, building, workforce and job resource tables.
const core=(b,k)=>Number(get(get(get(b,'resources'),k),'epoch_protocol_cores')||0);
const shipLoad={EPOCH_CAUSAL_LANCE:1,EPOCH_FRACTAL_ARTILLERY:4,EPOCH_LARGE_TRANSCENDENT_SHIELD:3,EPOCH_LARGE_PHASE_ARMOR:3,EPOCH_BATTLESHIP_REACTOR:1,EPOCH_COMPUTER_ARTILLERY:1,EPOCH_COHERENCE_DRIVE:1,EPOCH_TEMPORAL_STABILIZER:2};
const equipment=[...hardware,...utilities];
const design=(items,k)=>Object.entries(items).reduce((n,[id,count])=>n+count*core(component(equipment,id),k),0);
const battleship=design(shipLoad,'upkeep'),shipCost=design(shipLoad,'cost');
const selectedPower=Object.entries(shipLoad).reduce((n,[id,count])=>n+count*Number(get(component(equipment,id),'power')||0),0);
check(selectedPower>=500,'representative fully equipped battleship has power reserve for native mandatory parts');
const sections=parse(native('common/section_templates/battleship.txt'),'native battleship sections').filter(([,b])=>Array.isArray(b));
const artillerySections=['BATTLESHIP_BOW_M2S4','BATTLESHIP_MID_L3','BATTLESHIP_STERN_L1'].map(key=>component(sections,key));
check(artillerySections.every(Boolean),'actual native artillery sections exist');
check(artillerySections.reduce((n,b)=>n+Number(get(b,'large_utility_slots')||0),0)===6&&artillerySections.reduce((n,b)=>n+Number(get(b,'aux_utility_slots')||0),0)===2,'native six large defense and two auxiliary slots');
check(artillerySections.flatMap(b=>deep(b,'template')).filter(x=>x==='"large_turret"').length===4,'native four large artillery mounts');

const buildingLoad=manifest.buildingFamilies.filter(f=>f.id!=='factory').reduce((n,f)=>n+core(buildings.get(`building_epoch_${f.id}_${f.levels}`),'upkeep')+f.workforce.at(-1)/100*core(jobs.get('epoch_'+f.id),'upkeep'),0);
const starbase=design({EPOCH_STARBASE_REACTOR:1,EPOCH_MEDIUM_NULL_SHIELD:6,EPOCH_PHASE_M:6},'upkeep');
const factoryOutput=manifest.buildingFamilies.find(f=>f.id==='factory').workforce[1]/100*core(jobs.get('epoch_factory'),'produces');
const scenarios=[{name:'small',factories:3,ships:20,sets:1,bases:3},{name:'large',factories:14,ships:200,sets:4,bases:20}];
for(const x of scenarios){const use=x.ships*battleship+x.sets*buildingLoad+x.bases*starbase+3,production=x.factories*factoryOutput;check(production>use,'paid specialized economy can sustain '+x.name);check(production*0.5<use,'half staffing creates a real shortage '+x.name);check(production*1.25>use,'ordinary positive output bonuses retain solvency '+x.name);if(x.name==='large')check(production*0.75<use,'large economy is vulnerable to 25 percent output loss');x.use=Number(use.toFixed(5));x.production=production;x.surplus=Number((production-use).toFixed(5));}
check(24<100*battleship+buildingLoad+3,'old six-factory ceiling demonstrably fails medium fleet');
check(15000>=shipCost*20,'native stockpile can equip twenty representative battleships');
console.log('ECONOMY',JSON.stringify({battleship,shipCost,buildingLoad,starbase,factoryOutput,scenarios}));
// Verify selected native modifiers, art and localization without claiming runtime load.
const modDoc=fs.readFileSync(path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation/modifiers.log'),'utf8');
const categories=new Set(tree('common/economic_categories/epoch_era_categories.txt').map(([k])=>k));
const jobIds=new Set(jobs.keys());
const validateMods=b=>{for(const [k,v]of b){if(['ai_weight','weight','weight_modifier'].includes(k))continue;if(['modifier','ship_modifier','planet_modifier','country_modifier'].includes(k)&&Array.isArray(v)){for(const [m]of v)check(modDoc.includes('- '+m+',')||[...categories].some(c=>m.startsWith(c+'_')),'native or generated economic modifier '+m);}if(Array.isArray(v))validateMods(v);}};
for(const p of ['common/static_modifiers/epoch_era_modifiers.txt','common/buildings/epoch_era_buildings.txt','common/pop_jobs/epoch_era_jobs.txt','common/component_templates/epoch_era_utilities.txt','common/edicts/epoch_era_edicts.txt'])validateMods(tree(p));
const locales={};
for(const lang of ['english','german']){
 const p=`localisation/${lang}/epoch_era_l_${lang}.yml`,bytes=fs.readFileSync(path.join(root,p)),s=read(p);
 check(bytes[0]===239&&bytes[1]===187&&bytes[2]===191,'localization BOM '+lang);
 const entries=[...s.matchAll(/^ ([\w.]+):0 "(.*)"$/gm)];locales[lang]=new Map(entries.map(m=>[m[1],m[2]]));
 check(entries.length===locales[lang].size,'unique localization keys '+lang);
 for(const id of [...era.keys(),...buildings.keys(),...decisions.map(([k])=>k)])check(locales[lang].has(id)&&locales[lang].has(id+'_desc'),'native names/descriptions '+lang+'/'+id);
 for(const [,b]of [...hardware,...utilities]){const id=unquote(get(b,'key'));check(locales[lang].has(id)&&locales[lang].has(id+'_DESC'),'component localization '+lang+'/'+id);}
 for(const id of jobIds)for(const suffix of ['','_plural','_desc'])check(locales[lang].has('job_'+id+suffix),'job localization '+lang+'/'+id+suffix);
}
assert.deepEqual([...locales.english.keys()].sort(),[...locales.german.keys()].sort(),'DE/EN parity');checks++;
const assetExists=p=>fs.existsSync(path.join(root,p))||fs.existsSync(path.join(vanilla,p));
check(new Set([...era.values()].map(b=>get(b,'icon'))).size>=20,'visually differentiated research branches');
for(const [,b]of era)check(assetExists('gfx/interface/icons/technologies/'+get(b,'icon')+'.dds'),'existing research icon '+get(b,'icon'));
check(new Set(manifest.buildingFamilies.map(f=>f.icon)).size===8,'eight distinct building family icons');
for(const [,b]of buildings)check(assetExists('gfx/interface/icons/buildings/'+get(b,'icon')+'.dds'),'existing building icon '+get(b,'icon'));
for(const [,b]of jobs)check(assetExists('gfx/interface/icons/jobs/job_'+get(b,'icon')+'.dds'),'existing job icon '+get(b,'icon'));
for(const match of read('common/static_modifiers/epoch_era_modifiers.txt').matchAll(/icon = "([^"]+)"/g))check(assetExists(match[1]),'existing planetary modifier art '+match[1]);
for(const match of read('interface/epoch_era_resources.gfx').matchAll(/texturefile = "([^"]+)"/g))check(assetExists(match[1]),'resource sprite texture '+match[1]);
for(const p of [...parsedByPath.keys()].filter(p=>p.includes('epoch_era_')))check(!/give_technology|research_technology|set_country_flag|create_megastructure/.test(read(p)),'no free research, personal key writer or fake C unlock '+p);
// Package A and Stages I-III match merged PR #17 except the explicitly tested
// post-completion healing discount. Normalize Git's CRLF checkout.
const baseline='e9aa03d';const baselineFiles=cp.execFileSync('git',['ls-tree','-r','--name-only',baseline,'common','events'],{encoding:'utf8'}).trim().split(/\r?\n/);
for(const p of baselineFiles){const previous=cp.execFileSync('git',['show',baseline+':'+p],{encoding:'utf8'});
 if(p==='common/decisions/epoch_ascension_decisions.txt'){
  const prior=parse(previous,p),current=tree(p);
  const discounted=new Set(['decision_epoch_iv_diagnose','decision_epoch_iv_stabilize','decision_epoch_iv_invert']);
  const withoutPaidTables=b=>b.map(([k,v])=>[k,discounted.has(k)?v.filter(([field])=>field!=='resources'):v]);
  assert.deepEqual(withoutPaidTables(current),withoutPaidTables(prior),'all Package-A decision guards and effects preserved');checks++;
  for(const [id,b]of current.filter(([id])=>discounted.has(id))){
   const priorCost=get(get(new Map(prior).get(id),'resources'),'cost'),costs=get(b,'resources').filter(([k])=>k==='cost').map(([,v])=>v);
   for(const complete of [false,true])for(const researched of [false,true]){
    const owner={eligible:true,flags:new Set(complete?['epoch_iv_complete','epoch_iv_protocol_key']:[]),techs:new Set(researched?['tech_epoch_iv_restoration']:[])};
    const active=costs.filter(c=>gate(get(c,'trigger'),{owner}));check(active.length===1,'exactly one healing price '+id+'/'+complete+'/'+researched);
    for(const [resource,value]of priorCost)check(Number(get(active[0],resource))===Number(value)*(complete&&researched?0.8:1),'pre-key original price / earned 20% discount '+id+'/'+resource);
   }
  }
 }else check(read(p).replaceAll('\r\n','\n')===previous.replaceAll('\r\n','\n'),'old campaign unchanged '+p);
}
console.log(`PASS: ${checks} Package-B counts, personal research gates, class DAG reachability, production/consumption, upgrade limits, native weapon comparisons, hull roles, DE/EN and preservation assertions. Static only.`);

