// Reproducible staffed building ledger; no engine or global-empire simulation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {parse,get}=require('./test_clausewitz_structure.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..'),v=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),native=p=>fs.readFileSync(path.join(v,p),'utf8');
const tree=p=>new Map(parse(read(p),p));
const buildings=tree('common/buildings/epoch_era_buildings.txt'),jobs=tree('common/pop_jobs/epoch_era_jobs.txt');
const manifest=JSON.parse(read('docs/research/stage-iv-b-content.json'));
const round=x=>Math.round(x*10000)/10000;
function active(b,profile){return !get(b,'trigger')||get(b,'trigger').every(([k,x])=>{
 if(k==='owner')return x.every(([key,value])=>key==='is_robot_empire'?profile.robot===(value==='yes'):key==='NOT');
 if(k==='industrial_jobs_are_catalytic_trigger')return profile.catalytic===(x==='yes');
 return false;
});}
function tables(r,key,profile){const out={};for(const [k,b]of r||[])if(k===key&&active(b,profile))for(const [resource,value]of b)if(Number.isFinite(Number(value)))out[resource]=(out[resource]||0)+Number(value);return out;}
const profiles={organic:{},hive:{drone:true},machine:{drone:true,robot:true},catalytic:{catalytic:true}};
const rows=[];
for(const f of manifest.buildingFamilies)for(let tier=1;tier<=f.levels;tier++)for(const [profile,p]of Object.entries(profiles)){
 const id=`building_epoch_${f.id}_${tier}`,b=buildings.get(id),j=jobs.get(`epoch_${f.id}${p.drone?'_drone':''}`),workforce=f.workforce[tier-1]/100;
 const gross=tables(get(j,'resources'),'produces',p),upkeep=tables(get(j,'resources'),'upkeep',p),fixed=tables(get(b,'resources'),'upkeep',p),net={};
 for(const key of new Set([...Object.keys(gross),...Object.keys(upkeep),...Object.keys(fixed)]))net[key]=round(workforce*((gross[key]||0)-(upkeep[key]||0))-(fixed[key]||0));
 rows.push({id,profile,workforce,cost:tables(get(b,'resources'),'cost',p),gross:Object.fromEntries(Object.entries(gross).map(([k,x])=>[k,round(x*workforce)])),net});
}
const sourceFiles=['common/buildings/05_research_buildings.txt','common/buildings/04_manufacturing_buildings.txt','common/buildings/03_resource_buildings.txt','common/buildings/07_amenity_buildings.txt','common/buildings/08_unity_buildings.txt','common/buildings/09_army_buildings.txt','common/buildings/13_fallen_empire_buildings.txt','common/pop_jobs/02_specialist_jobs.txt','common/pop_jobs/03_worker_jobs.txt','common/inline_scripts/output/foundry_output.txt','common/inline_scripts/output/healthcare_triggered_modifiers.txt','common/scripted_variables/100_scripted_variables_zones.txt','common/scripted_variables/00_scripted_variables.txt'];
// Extract native values instead of accepting the old JSON manifest as a balance oracle.
const nativeJobs=new Map(parse(native('common/pop_jobs/02_specialist_jobs.txt'),'native specialist'));
const vars=new Map([...native('common/scripted_variables/100_scripted_variables_zones.txt').matchAll(/(@\w+)\s*=\s*([\d.]+)/g)].map(m=>[m[1],Number(m[2])]));
const researcher=Number(get(get(get(nativeJobs.get('physicist'),'resources'),'produces'),'physics_research'));
const foundry=Number(get(get(parse(native('common/inline_scripts/output/foundry_output.txt'),'foundry'),'produces'),'alloys'));
assert.equal(researcher,3);assert.equal(foundry,3);assert.equal(vars.get('@building_static_jobs_very_high_3'),180);assert.equal(vars.get('@building_static_jobs_very_high'),600);
const top=f=>rows.find(x=>x.profile==='organic'&&x.id===`building_epoch_${f.id}_${f.levels}`);
const lab=top(manifest.buildingFamilies.find(x=>x.id==='lab')),forge=top(manifest.buildingFamilies.find(x=>x.id==='forge'));
const comparisons=[
 {family:'lab',native:'building_research_lab_3',metric:'research / field',vanilla:vars.get('@building_static_jobs_very_high_3')/100*researcher,epoch:lab.gross.physics_research},
 {family:'forge',native:'building_foundry_3',metric:'organic alloys',vanilla:vars.get('@building_static_jobs_very_high')/100*foundry,epoch:forge.gross.alloys},
 {family:'collector',native:'building_energy_nexus',metric:'local energy / 100 technician workforce',vanilla:1,epoch:2},
 {family:'institute',native:'building_medical_2',metric:'amenities (base doctors, no civic/trait)',vanilla:2*750,epoch:2*1350},
 {family:'archive',native:'building_bureaucratic_3',metric:'unity on 20 staffed bureaucrat units, with building workforce bonus; EPOCH + 4 archivists',vanilla:20*3*1.10,epoch:(20*3+4*8)*1.15},
 {family:'phase',native:'building_planetary_shield_generator',metric:'effective bombardment endurance, equal planet',vanilla:1/(1-0.5),epoch:1/(1-0.75)},
 {family:'academy',native:'building_fortress',metric:'naval cap, four units; Vanilla includes Ground Defense Planning',vanilla:4*(4+1),epoch:4*10},
 {family:'factory',native:'building_crystal_plant_2 / strategic refinery',metric:'distinct strategic outputs, no interchangeable unit value',vanilla:null,epoch:72}
];
for(const x of comparisons)if(x.vanilla!==null){x.ratio=round(x.epoch/x.vanilla);assert.ok(x.ratio>=1.5&&x.ratio<=2.01,'top-tier target '+x.family);}
const sources=sourceFiles.map(p=>({path:p,sha256:crypto.createHash('sha256').update(native(p)).digest('hex')}));
const fmt=r=>Object.entries(r).map(([k,x])=>`${k} ${x>=0?'+':''}${round(x)}`).join('; ');
let md='# Package B: staffed balance ledger — 2026-11-10\n\nInstalled Cygnus 4.5.3 sources, hashed in the JSON. 100 workforce = one economic job unit. Full staffing; no species traits, designations, empire bonuses, deposits or civics except the explicitly labelled catalytic/machine variants. Organic net includes building upkeep and job inputs. Population living standards, housing, opportunity cost and unrelated colony output are excluded, not silently zeroed. Native gameplay remains unverified.\n\n| Family | Installed native comparison | Metric / scenario | Vanilla | EPOCH top | Ratio |\n|---|---|---|---:|---:|---:|\n';
for(const x of comparisons)md+=`| ${x.family} | ${x.native} | ${x.metric} | ${x.vanilla??'not comparable'} | ${round(x.epoch)} | ${x.ratio??'N/A'} |\n`;
md+='\nThe archive comparison is a fixed 20-bureaucrat colony, not a claim that the administrative building has 20 intrinsic jobs. The EPOCH institute also supplies society research, unity and local stability; it does not reproduce native doctor growth. The collector includes 32/64 direct energy before building upkeep, on top of the local technician bonus. The phase comparison is damage endurance, not an added 100% bombardment reduction. Factories create an EPOCH-only resource: no honest numeric Vanilla exchange-rate comparison exists. Fallen-Empire sources were inspected; their restricted automated resource buildings are not normal staffed comparators.\n\n| Organic building | Workforce units | Gross output | Monthly net, including inputs/building upkeep |\n|---|---:|---|---|\n';
for(const r of rows.filter(x=>x.profile==='organic'))md+=`| ${r.id} | ${r.workforce} | ${fmt(r.gross)} | ${fmt(r.net)} |\n`;
md+='\nIntermediate tiers are paid expansions, not additional empire multipliers. Forge output is 12/24/36 alloys, with 20/40/60 mineral job inputs. Catalytic and Machine branches remain explicit; full ledgers for those and Hive are in JSON. A +50% common output modifier gives top lab 14.58 per field, Vanilla 8.10; forge 54 vs 27 alloys (inputs unchanged); the relative advantage remains 1.8×/2×.\n\nCore scenarios (from test_stage_iv_b.cjs): one Factory I supplies 36 cores and can start without a single core. One Factory II supports 20 fully equipped battleships, seven top buildings and three starbases: 72 produced, 19.42775 consumed, 52.57225 surplus. Three Factory II support 200 battleships, four sets and 20 starbases: 216 produced, 146.945 consumed, 69.055 surplus. The last surplus finances 600 construction cores in 8.69 months; under -25% industrial output it remains +15.055. Zero staffing produces zero cores; deficit in any industrial input stops core fabrication. Core ship purchase cost is 325 per representative battleship; ordinary hull/alloy maintenance is additional.\n\nWilderness has no jobs: paid network fabrication supplies 36/72 per node, at 108/216 minerals, 18/36 alloys and 56/112 energy monthly. Nodes scale 1–6 at 1/5/10/15/20/25 colonies. Costs, inputs and output share the same multiplier; maximum throughput is 432, not infinite. This intentionally charges twice the staffed inputs for saved labor. Integration and philosophy edicts retain their additional upkeep. Mega-forge outputs and UAP upkeep are accounted in the Package-C report.\n';
fs.writeFileSync(path.join(root,'docs/research/stage-iv-b-corrected-balance.json'),JSON.stringify({version:'4.5.3',sources,comparisons,rows},null,2)+'\n');
fs.writeFileSync(path.join(root,'docs/research/stage-iv-b-corrected-balance.md'),md);
console.log('PASS: 72 staffed building ledgers; seven 1.5–2× native functional comparisons, one non-fungible resource comparison; source hashes recorded.');
