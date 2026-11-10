// Regression contracts for the failures observed on cf13857 in the 4.5.3 player run.
// This is deliberately NOT a simulation of engine construction, UI or save/load.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {parse,get}=require('./test_clausewitz_structure.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..'),vanilla=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),tree=p=>parse(read(p),p);
const native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
const deep=(b,k)=>(b||[]).flatMap(([key,v])=>[...(key===k?[v]:[]),...(Array.isArray(v)?deep(v,k):[])]);
let checks=0;function check(b,m){checks++;assert.ok(b,m);}
function expectRejected(fn,label){checks++;assert.throws(fn,undefined,label);}
const buildings=new Map(tree('common/buildings/epoch_era_buildings.txt'));
const jobs=new Map(tree('common/pop_jobs/epoch_era_jobs.txt'));
function stable(b){assert.equal(deep(get(b,'potential'),'has_building').filter(id=>id.startsWith('building_epoch_')).length,0,'EPOCH potential must not depend on self/family absence');}
// Exercise the former failure as a negative fixture rather than just asserting new numbers.
expectRejected(()=>stable(parse('bad = { potential = { NOR = { has_building = building_epoch_factory_1 } } }','bad')[0][1]),'reject disappearing factory');
function eligibility(b,e){return (b||[]).every(([k,v])=>{
 if(k==='NOT'||k==='NOR')return !v.some(p=>eligibility([p],e));
 if(k==='OR')return v.some(p=>eligibility([p],e));
 if(k==='AND')return eligibility(v,e);
 if(k==='owner')return eligibility(v,e.owner);
 if(k==='exists')return !!e[v];
 if(k==='has_building')return e.buildings.has(v);
 if(k==='has_modifier')return e.modifiers.has(v);
 if(k==='epoch_iv_future_research')return !!e.key===(v==='yes');
 if(k==='is_special_colony_type'||k==='is_wilderness_empire')return !!e[k]===(v==='yes');
 if(k==='is_ai')return !!e.ai===(v==='yes');
 throw new Error('Unmodelled building condition '+k);
});}
for(const [id,b]of buildings){
 stable(b);checks++;
 const family=id.replace(/_\d$/,''),members=[...buildings.keys()].filter(k=>k.startsWith(family+'_'));
 // Every tier remains eligible with self, with next tier and after repeated ticks / serialized state.
 for(const existing of [[],[id],members.slice(-1)]){
  const state={owner:{key:true},buildings:existing,modifiers:[]};
  for(let tick=0;tick<4;tick++){
   const restored=JSON.parse(JSON.stringify(state));restored.buildings=new Set(restored.buildings);restored.modifiers=new Set(restored.modifiers);
   check(eligibility(get(b,'potential'),restored),'persistent eligibility through model reload/ticks '+id);
   if(get(b,'can_build')==='yes'){
    const guards=(get(b,'allow')||[]).filter(([k])=>k!=='owner');
    check(eligibility(guards,restored)===!existing.length,'construction-only family lock '+id);
   }
  }
 }
 if(get(b,'can_build')==='yes')for(const other of members)check(deep(get(b,'allow'),'has_building').includes(other),'all upgrade variants block duplicate '+id+'/'+other);
 check(!get(b,'abort_trigger')&&!get(b,'abort_construction_trigger')&&!get(b,'destroy_trigger'),'no new teardown/abort trigger '+id);
}
function supportedJob(b){assert.ok(!get(b,'icon')&&!get(b,'building_icon'),'4.5 jobs do not support root icon/building_icon');}
expectRejected(()=>supportedJob(parse('job = { icon = foundry }','bad')[0][1]),'reject unsupported job icon');
const exists=p=>fs.existsSync(path.join(root,p))||fs.existsSync(path.join(vanilla,p));
function dds(p){const b=fs.readFileSync(path.join(root,p));check(b.toString('ascii',0,4)==='DDS '&&b.readUInt32LE(4)===124,'DDS header '+p);check(b.readUInt32LE(12)>0&&b.readUInt32LE(16)>0,'DDS dimensions '+p);}
for(const [id,b]of jobs){supportedJob(b);checks++;dds(`gfx/interface/icons/jobs/job_${id}.dds`);dds(`gfx/interface/icons/modifiers/mod_pop_${id}_bonus_workforce_mult.dds`);}
for(const lang of ['english','german']){
 const loc=read(`localisation/${lang}/epoch_era_l_${lang}.yml`);
 for(const k of ['epoch_protocol_cores','epoch_protocol_cores_desc',...[...jobs.keys()].map(id=>'mod_pop_'+id+'_bonus_workforce_mult'),...[...new Set([...jobs.keys()].map(id=>'planet_'+id.replace(/_drone$/,'')))].flatMap(id=>[id,'mod_'+id+'_produces_mult','mod_'+id+'_upkeep_mult'])])check(loc.includes(' '+k+':0 "'),'native resource/category/generated modifier localization '+lang+'/'+k);
 check(!loc.includes('undefined'),'no undefined localization '+lang);
}
for(const [id]of jobs){const fam=id.replace(/_drone$/,'');for(const k of ['produces_mult','upkeep_mult'])check(exists(`gfx/interface/icons/modifiers/mod_planet_${fam}_${k}.dds`),'generated category modifier asset '+fam);}
const resource=new Map(tree('common/strategic_resources/epoch_era_resources.txt')).get('epoch_protocol_cores');
check(get(resource,'category')==='rare'&&get(resource,'visibility_prerequisite').length>0,'native rare resource visibility');
const group=tree('interface/resource_groups/topbar_other_resource_groups.txt');
const nGroup=parse(native('interface/resource_groups/topbar_other_resource_groups.txt'),'native group');
const withoutCore=b=>b.map(([k,v])=>[k,Array.isArray(v)?withoutCore(v):v]).filter(([,v])=>v!=='epoch_protocol_cores');
assert.deepEqual(withoutCore(group),nGroup,'the sole native resource group delta is the new resource');checks++;
check(deep(group,'resources').some(r=>r.some(([,v])=>v==='epoch_protocol_cores')),'topbar group actually enumerates cores');
check(!fs.existsSync(path.join(root,'interface/topbar.gui')),'no whole topbar GUI override');
for(const name of ['GFX_resource_epoch_protocol_cores','GFX_text_resource_epoch_protocol_cores','GFX_resource_epoch_protocol_cores_grey','GFX_resource_epoch_protocol_cores_large'])check(read('interface/epoch_era_resources.gfx').includes('"'+name+'"'),'native resource sprite '+name);
for(const [id,b]of tree('common/decisions/epoch_era_decisions.txt')){
 const effect=get(b,'effect'),preview=get(effect,'tooltip'),actual=get(effect,'hidden_effect');
 check(!!preview&&!!actual,'native effect preview separated from execution guards '+id);
 const bonuses=deep(preview,'add_modifier');check(bonuses.length>0,'preview exposes native positive modifiers '+id);
 for(const x of bonuses)check(deep(actual,'add_modifier').some(y=>JSON.stringify(x)===JSON.stringify(y)),'preview matches awarded modifier and duration '+id);
 assert.deepEqual(get(b,'allow'),get(get(actual,'if'),'limit'),'completion safety retained '+id);checks++;
}
// Resource production must stop when any paid industrial input is in deficit.
for(const id of ['epoch_factory','epoch_factory_drone']){
 const p=get(get(jobs.get(id),'resources'),'produces');
 for(const input of ['minerals','alloys','energy'])check(deep(get(p,'trigger'),'has_deficit').includes(input),'no core production without paid input '+id+'/'+input);
}
const wild=tree('common/edicts/epoch_era_edicts.txt').find(([k])=>k==='epoch_era_wilderness_cores')[1];
for(const [k,b]of get(wild,'resources').filter(([k])=>['cost','produces','upkeep'].includes(k)))check(get(b,'multiplier')==='value:epoch_era_wilderness_network_scale','identical paid Wilderness scaling '+k);
const scale=new Map(tree('common/script_values/epoch_era_economy.txt')).get('epoch_era_wilderness_network_scale');
check(get(scale,'base')==='1'&&scale.filter(([k])=>k==='modifier').length===5,'bounded six-node Wilderness economy');
check(native('common/pop_jobs/02_specialist_jobs.txt').includes('swappable_data'),'installed 4.5.3 job pattern');
check(native('common/scripted_effects/caravaneer_scripted_effects.txt').includes('tooltip = { add_resource'),'installed native tooltip effect pattern');
console.log(`PASS: ${checks} observed-runtime regression contracts. Construction/ticks/reload above are bounded condition models, not engine evidence.`);
