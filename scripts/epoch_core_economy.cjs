// Arithmetic projection from executable resource tables. Never evidence of a game run.
const fs=require('node:fs'),path=require('node:path');
const {parse,get}=require('./test_clausewitz_structure.cjs');
const deep=(b,k)=>(b||[]).flatMap(([key,v])=>[...(key===k?[v]:[]),...(Array.isArray(v)?deep(v,k):[])]);
const round=x=>Number(x.toFixed(5));
function economy(root){
 const tree=p=>new Map(parse(fs.readFileSync(path.join(root,p),'utf8'),p));
 const b=tree('common/buildings/epoch_era_buildings.txt'),j=tree('common/pop_jobs/epoch_era_jobs.txt');
 const c=['weapons','utilities'].flatMap(f=>parse(fs.readFileSync(path.join(root,'common/component_templates/epoch_era_'+f+'.txt'),'utf8'),f));
 const sum=(body,table,res)=>((get(body,'resources')||[]).filter(([k])=>k===table)).reduce((n,[,v])=>n+Number(get(v,res)||0),0);
 const core=(body,table)=>sum(body,table,'epoch_protocol_cores');
 const component=id=>c.find(([,v])=>get(v,'key')===`"${id}"`)?.[1];
 const design=items=>Object.entries(items).reduce((n,[id,count])=>n+count*core(component(id),'upkeep'),0);
 const ship=design({EPOCH_CAUSAL_LANCE:1,EPOCH_FRACTAL_ARTILLERY:4,EPOCH_LARGE_TRANSCENDENT_SHIELD:3,EPOCH_LARGE_PHASE_ARMOR:3,EPOCH_BATTLESHIP_REACTOR:1,EPOCH_COMPUTER_ARTILLERY:1,EPOCH_COHERENCE_DRIVE:1,EPOCH_TEMPORAL_STABILIZER:2});
 const starbase=design({EPOCH_STARBASE_REACTOR:1,EPOCH_MEDIUM_NULL_SHIELD:6,EPOCH_PHASE_M:6});
 const rows=[...b].map(([id,body])=>{
  const [,family,tier]=id.match(/^building_epoch_(\w+)_(\d)$/),job=j.get('epoch_'+family),slots=Number(deep(body,'job_epoch_'+family+'_add')[0])/100;
  return {id,family,tier:Number(tier),workforce:slots,fixedCore:core(body,'upkeep'),jobCore:round(slots*core(job,'upkeep')),totalCore:round(core(body,'upkeep')+slots*core(job,'upkeep')),grossCore:round(slots*core(job,'produces')),inputs:family==='factory'?Object.fromEntries(['minerals','alloys','energy'].map(r=>[r,round(slots*sum(job,'upkeep',r)+sum(body,'upkeep',r))])):undefined};
 });
 const levels=Object.fromEntries(rows.map(r=>[r.family,Math.max(...rows.filter(x=>x.family===r.family).map(x=>x.tier))]));
 const set=top=>round(rows.filter(r=>r.family!=='factory'&&r.tier===(top?levels[r.family]:1)).reduce((n,r)=>n+r.totalCore,0));
 const factory1=rows.find(r=>r.id==='building_epoch_factory_1'),factory2=rows.find(r=>r.id==='building_epoch_factory_2');
 const edicts=tree('common/edicts/epoch_era_edicts.txt'),edictCore=core(edicts.get('epoch_era_warden_doctrine'),'upkeep');
 const scenarios=[{name:'small',colonies:5,factories:1,tier:1,ships:20,sets:1,top:false,bases:3},{name:'medium',colonies:15,factories:2,tier:2,ships:100,sets:2,top:true,bases:8},{name:'large',colonies:30,factories:4,tier:2,ships:200,sets:4,top:true,bases:20}].map(x=>{
  const f=x.tier===1?factory1:factory2,production=x.factories*f.grossCore,use=x.ships*ship+x.sets*set(x.top)+x.bases*starbase+edictCore;
  return {...x,production,use:round(use),net:round(production-use),halfStaffedNet:round(production*.5-use),oneFactoryNet:round(f.grossCore-use),factoryInputs:Object.fromEntries(Object.entries(f.inputs).map(([k,v])=>[k,round(v*x.factories)]))};
 });
 const wild=edicts.get('epoch_era_wilderness_cores'),wi=edicts.get('epoch_era_wilderness_integration');
 const wildRows=scenarios.map(x=>{
  const nodes=Math.min(6,1+Math.floor(x.colonies/5)),production=nodes*(x.tier===1?36:core(wild,'produces')),use=x.ships*ship+x.bases*starbase+edictCore+core(wi,'upkeep');
  return {name:x.name,nodes,production,use:round(use),net:round(production-use),halfNetworkNet:round(production*.5-use),inputs:Object.fromEntries(['minerals','alloys','energy'].map(r=>[r,round(nodes*sum(wild,'upkeep',r)/(x.tier===1?2:1))]))};
 });
 return {runtimeValidated:false,ship:round(ship),starbase:round(starbase),edictCore,buildingSetI:set(false),buildingSetTop:set(true),factory1,factory2,rows,scenarios,wilderness:wildRows};
}
module.exports={economy};
