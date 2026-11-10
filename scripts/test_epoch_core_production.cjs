// The third playtest requires executable base production, not numeric tooltip sightings.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {parse,get}=require('./test_clausewitz_structure.cjs'),{economy}=require('./epoch_core_economy.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..'),v=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const tree=p=>new Map(parse(fs.readFileSync(path.join(root,p),'utf8'),p));
const jobs=tree('common/pop_jobs/epoch_era_jobs.txt'),buildings=tree('common/buildings/epoch_era_buildings.txt');
let checks=0;const check=(x,m)=>{checks++;assert.ok(x,m);};
function baseOutput(job){const r=get(job,'resources'),prod=r.filter(([k])=>k==='produces');assert.equal(prod.length,1);assert.ok(!get(prod[0][1],'trigger'),'base factory output must not be gated by economic trigger context');assert.equal(Number(get(prod[0][1],'epoch_protocol_cores')),12);return 12;}
for(const id of ['epoch_factory','epoch_factory_drone']){
 const body=jobs.get(id);baseOutput(body);checks++;
 const upkeep=get(get(body,'resources'),'upkeep');for(const input of ['minerals','alloys','energy'])check(Number(get(upkeep,input))>0,'real paid input '+id+'/'+input);
 for(const tier of [1,2]){
  const b=buildings.get('building_epoch_factory_'+tier);
  // Organic/drone slots are separate native triggered modifiers.
  const workforce=b.filter(([k])=>k==='triggered_planet_modifier').flatMap(([,x])=>x).find(([k])=>k==='job_'+id+'_add')[1];
  for(const staff of [0,.5,1])check(Number(workforce)/100*baseOutput(body)*staff===tier*36*staff,'unconditional staffed factory projection '+id+'/'+tier+'/'+staff);
 }
}
assert.throws(()=>baseOutput(parse('bad = { resources = { produces = { trigger = { owner = { NOT = { has_deficit = minerals } } } epoch_protocol_cores = 12 } } }','old factory')[0][1]));checks++;
assert.throws(()=>baseOutput(parse('bad = { tooltip = { epoch_protocol_cores = 12 } resources = { produces = {} } }','tooltip only')[0][1]));checks++;
for(const [id,b]of buildings){
 if(id.includes('_factory_')){check(!get(get(get(b,'resources'),'upkeep'),'epoch_protocol_cores'),'bootstrap factory never consumes its own output '+id);continue;}
 const tier=Number(id.at(-1)),n=Number(get(get(get(b,'resources'),'upkeep'),'epoch_protocol_cores'));check(n>=({1:1,2:2,3:4})[tier]&&n<=({1:2,2:4,3:6})[tier],'tier-appropriate fixed upkeep '+id);
}
// Executable installed examples: base output is unconditional for regular/Hive jobs.
for(const [p,id,res]of [['02_specialist_jobs.txt','physicist','physics_research'],['04_gestalt_jobs.txt','technician_drone','energy']]){
 const native=new Map(parse(fs.readFileSync(path.join(v,'common/pop_jobs',p),'utf8'),p)).get(id),base=get(get(native,'resources'),'produces');
 check(!get(base,'trigger')&&Number(get(base,res))>0,'installed native unconditional base '+id);
}
const nativeResources=fs.readFileSync(path.join(v,'common/strategic_resources/00_strategic_resources.txt'),'utf8');
for(const input of ['mineral','energy','alloys'])check(nativeResources.includes('situation_'+input+'_deficit'),'paid factory input uses native deficit system '+input);
const ledger=economy(root);check(ledger.runtimeValidated===false,'arithmetic is never runtime proof');
for(const x of ledger.scenarios){check(x.net>0,'deliberately funded economy is solvent '+x.name);check(x.halfStaffedNet<0,'half staffing produces a genuine shortfall '+x.name);}
check(ledger.scenarios[2].oneFactoryNet<0,'one Factory II cannot support the large empire');
check(ledger.factory1.grossCore===36&&ledger.factory2.grossCore===72,'preserved gross reference');
console.log(`PASS: ${checks} actual-resource-table factory contracts, paid inputs, tier upkeep and signed small/medium/large projections. NO runtime production validation.`);
console.log('CORE_LEDGER '+JSON.stringify({runtimeValidated:ledger.runtimeValidated,ship:ledger.ship,buildingSetI:ledger.buildingSetI,buildingSetTop:ledger.buildingSetTop,scenarios:ledger.scenarios,wilderness:ledger.wilderness}));
