// D2: independent numeric acceptance of the D1 ledger and bounded source audit.
// No model here claims to execute fleet AI, staffing, deficits or upgrade scopes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {parse,get}=require('./test_clausewitz_structure.cjs'),{economy}=require('./epoch_core_economy.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tree=p=>new Map(parse(read(p),p));
let checks=0;const check=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,m)=>check(Math.abs(a-b)<0.000001,`${m}: ${a} versus ${b}`);
const ledger=economy(root);
for(const [k,n]of Object.entries({ship:.634,starbase:.26925,buildingSetI:11.18,buildingSetTop:26.64}))near(ledger[k],n,k);
for(const [i,expected]of [[0,[36,27.66775,8.33225,-9.66775]],[1,[144,121.834,22.166,-49.834]],[2,[288,241.745,46.255,-97.745]]]){
 const row=ledger.scenarios[i];
 for(const [j,key]of ['production','use','net','halfStaffedNet'].entries())near(row[key],expected[j],row.name+'/'+key);
 // Independently recompute the core budget from the reference loadout and set.
 near(row.use,row.ships*.634+row.sets*(row.top?26.64:11.18)+row.bases*.26925+3,row.name+'/independent use');
 for(const [res,n]of Object.entries({minerals:54,alloys:9,energy:28}))near(row.factoryInputs[res],n*row.tier*row.factories,row.name+'/'+res);
}
near(ledger.scenarios[2].oneFactoryNet,-169.745,'single Factory II / large');
near(36-2.18,33.82,'entry Factory I minus Lab I');
for(const [i,expected]of [[0,[2,72,19.48775,52.51225,216,36,112]],[1,[4,288,71.554,216.446,864,144,448]],[2,[6,432,138.185,293.815,1296,216,672]]]){
 const row=ledger.wilderness[i];
 const actual=[row.nodes,row.production,row.use,row.net,row.inputs.minerals,row.inputs.alloys,row.inputs.energy];
 actual.forEach((n,j)=>near(n,expected[j],row.name+'/Wilderness/'+j));
}
const megas=tree('common/megastructures/epoch_c_megastructures.txt');
const sum=(body,table,res)=>(get(body,'resources')||[]).filter(([k])=>k===table).reduce((s,[,v])=>s+Number(get(v,res)||0),0);
for(const [name,ids,expected]of [
 ['entry',['epoch_nexus_1','epoch_forge_1','epoch_uap_1'],[24,12,200,400]],
 ['ultimate',['epoch_nexus_3','epoch_forge_3','epoch_uap_4'],[72,46,700,1200]]
]){
 const totals=[['produces','epoch_protocol_cores'],['upkeep','epoch_protocol_cores'],['upkeep','energy'],['upkeep','minerals']].map(([t,r])=>ids.reduce((s,id)=>s+sum(megas.get(id),t,r),0));
 totals.forEach((n,j)=>near(n,expected[j],name+'/mega/'+j));
}
near(ledger.scenarios[2].net+72-46,72.255,'large plus ultimate');
near(ledger.scenarios[2].halfStaffedNet+72-46,-71.745,'half staffed large plus ultimate');
// Inspect actual source guards; deliberately do not infer selection frequency.
const buildings=tree('common/buildings/epoch_era_buildings.txt'),jobs=tree('common/pop_jobs/epoch_era_jobs.txt');
for(const [id,b]of buildings)check(Number(get(get(b,'ai_weight'),'weight'))===(id.includes('_factory_')?60:10),id+'/existing priority');
for(const [id,precalc]of [['epoch_factory','can_fill_specialist_job'],['epoch_factory_drone','can_fill_drone_job']]){
 check(get(jobs.get(id),'possible_precalc')===precalc,id+'/native eligibility');
 near(sum(jobs.get(id),'produces','epoch_protocol_cores'),12,id+'/unmodified output');
}
const events=new Map(parse(read('events/epoch_ascension_events.txt')).filter(([,b])=>Array.isArray(b)).map(([,b])=>[get(b,'id'),b]));
const attack=events.get('epoch_iv.82'),selection=get(get(attack,'immediate'),'random_owned_fleet');
check(get(get(attack,'trigger'),'NOT').some(([k,v])=>k==='has_country_flag'&&v==='epoch_iv_ai_attack_ordered'),'existing permanent signal gates explicit retries');
check(get(get(selection,'auto_follow_fleet'),'attack_fleet')==='yes','native attack request is explicit');
check(get(get(selection,'root'),'set_country_flag')==='epoch_iv_ai_attack_ordered','signal set only inside selected fleet');
const reset=get(get(events.get('epoch_iv.1'),'immediate'),'every_country').filter(([k,v])=>k==='if'&&get(v,'remove_country_flag')==='epoch_iv_ai_attack_ordered');
check(reset.length===1,'one monthly attack-signal cleanup');
check(JSON.stringify(get(reset[0][1],'limit')).includes('epoch_iv_ai_fleet@this'),'monthly cleanup keyed to own saved fleet, not battle result');
// D2 intentionally has no executable or localization edits. Stronger than the
// inherited D1 guard: compare against the requested, fetched main baseline.
const baseline='9dee039ff196e51e38ea743eb46ab5f85cbb7c72';
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
for(const p of git('ls-tree','-r','--name-only',baseline).trim().split(/\r?\n/).filter(p=>/^(common|events|localisation|gfx|interface)\//.test(p)||p==='descriptor.mod')){
 const prior=cp.execFileSync('git',['show',`${baseline}:${p}`],{cwd:root,maxBuffer:16*1024*1024}),now=fs.readFileSync(path.join(root,p));
 check(/\.(txt|yml|mod|gfx|svg)$/.test(p)?now.toString('utf8').replaceAll('\r\n','\n')===prior.toString('utf8').replaceAll('\r\n','\n'):now.equals(prior),p+'/D2 preserves accepted game files');
}
console.log(`PASS: ${checks} D2 numeric ledger, source audit and immutable gameplay checks. Static only; AI retry after retreat remains unresolved.`);
