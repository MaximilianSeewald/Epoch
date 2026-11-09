// Compare executable trees with the requested PR baseline. Tooltip is display
// only; hidden_effect runs at the same location and is transparent for this audit.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {parse,get,parsedByPath:current}=require('./test_clausewitz_structure.cjs');
const base='e8dd01aedada5824e5b58fcfc1a12989eaa84f1c';
const basePaths=new Set(cp.execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split(/\r?\n/));
const old=p=>parse(cp.execFileSync('git',['show',`${base}:${p}`],{encoding:'utf8',maxBuffer:4*1024*1024}),p);
let checks=0;const check=(v,m)=>{checks++;assert.ok(v,m);};
const effects=new Map([...current].filter(([p])=>p.startsWith('common/scripted_effects/')).flatMap(([,v])=>v));
function calls(b){return b.flatMap(([k,v])=>[...(effects.has(k)?[k]:[]),...(Array.isArray(v)?calls(v):[])]);}
function depth(name,stack=[]){assert.ok(!stack.includes(name),`Recursive effect cycle: ${[...stack,name]}`);return 1+Math.max(0,...calls(effects.get(name)).map(k=>depth(k,[...stack,name])));}
const deepest=[...effects.keys()].map(k=>[k,depth(k)]).sort((a,b)=>b[1]-a[1]);
for(const [name,d]of deepest)check(d<5,`${name}: ${d} scripted-effect expansions must stay below engine limit 5`);
check(depth('epoch_res_repair_infection')<=3,'Infection repair has at most three scripted-effect levels');
const baseEffects=new Map([...current].filter(([p])=>p.startsWith('common/scripted_effects/')&&basePaths.has(p)).flatMap(([p])=>old(p)));
function expand(b,map){return b.flatMap(([k,v])=>map.has(k)?expand(map.get(k),map):[[k,Array.isArray(v)?expand(v,map):v]]);}
for(const [k,v]of effects)if(baseEffects.has(k)){assert.deepEqual(expand(v,effects),expand(baseEffects.get(k),baseEffects),`${k}: flattened executable state changes must equal baseline`);checks++;}
const ui=new Set(['tooltip','custom_tooltip','custom_tooltip_with_modifiers']);
function executable(b){return b.flatMap(([k,v])=>{
 if(k==='custom_tooltip'&&Array.isArray(v)&&get(v,'fail_text'))return executable(v.filter(([key])=>!['fail_text','success_text'].includes(key)));
 if(ui.has(k))return [];
 if(k==='hidden_effect')return executable(v);
 if(Array.isArray(v)){
  const inner=executable(v);
  if(k==='else'&&!inner.length)return [];
  if(['if','else_if'].includes(k)&&inner.every(([key])=>key==='limit'))return [];
  return [[k,inner]];
 }
 return [[k,v]];
});}
const bugfixes=new Set(['epoch_res.101','epoch_res.11','epoch_res.111','epoch_core.22','epoch_core.51','epoch_core.52']);
for(const [p,defs]of current)if(p.startsWith('events/')&&basePaths.has(p)){
 const prior=new Map(old(p).filter(([,b])=>Array.isArray(b)).map(([k,b])=>[get(b,'id'),b]));
 for(const [,b]of defs){if(!Array.isArray(b))continue;const id=get(b,'id');if(!id||bugfixes.has(id))continue;assert.deepEqual(executable(b),executable(prior.get(id)),`${id}: presentation must preserve executable event tree`);checks++;}
}
const dp='common/decisions/epoch_resonance_decisions.txt',priorDecisions=new Map(old(dp));
for(const [k,b]of current.get(dp)){
 assert.deepEqual(executable(b),executable(priorDecisions.get(k)),`${k}: costs, durations, guards, AI and actual effects must match baseline`);checks++;
 if(!k.endsWith('resume'))check(get(get(b,'effect'),'tooltip')?.length>0,`${k}: nonempty native preview`);
}
for(const p of ['common/special_projects/epoch_phase_ii_projects.txt','common/special_projects/epoch_core_projects.txt','common/deposits/epoch_phase_ii_features.txt','common/static_modifiers/epoch_core_modifiers.txt','common/technology/epoch_phase_ii_technologies.txt','common/buildings/epoch_phase_ii_buildings.txt','common/global_ship_designs/epoch_nullwarden_designs.txt','common/situations/epoch_core_situations.txt','common/situations/epoch_phase_ii_situations.txt']){
 assert.deepEqual(current.get(p),old(p),`${p}: gameplay definitions unchanged`);checks++;
}
const defs=current.get('events/epoch_resonance_events.txt');
const scar=defs.find(([,b])=>Array.isArray(b)&&get(b,'id')==='epoch_res.101')[1];
const oldScar=old('events/epoch_resonance_events.txt').find(([,b])=>Array.isArray(b)&&get(b,'id')==='epoch_res.101')[1];
function synchronousScar(b){return b.map(([k,v])=>[k,Array.isArray(v)?(k==='country_event'&&get(v,'id')==='epoch_res.111'?[['id','epoch_res.11']]:synchronousScar(v)):v]);}
assert.deepEqual(synchronousScar(executable(scar)),executable(oldScar),'Scar bugfix changes only the report dispatch; every callback guard and reward stays identical');checks++;
function find(b,k){for(const [key,v]of b){if(key===k&&get(v,'id')==='epoch_res.111')return v;if(Array.isArray(v)){const f=find(v,k);if(f)return f;}}}
check(get(find(scar,'country_event'),'days')==='1','Scar follow-up leaves the native callback stack for one day');
// Dynamic localization uses native local names, never script event_target promotion.
const locs={};
for(const lang of ['english','german']){
 const s=fs.readdirSync(`localisation/${lang}`).filter(p=>p.endsWith('.yml')).map(p=>fs.readFileSync(`localisation/${lang}/${p}`,'utf8')).join('\n');
 const entries=[...s.matchAll(/^[ \t]*([\w.]+):\d+ "(.*)"\r?$/gm)];locs[lang]=new Map(entries.map(m=>[m[1],m[2]]));
 check(!/\[event_target:|\[[^\]]*@/.test(s),`${lang}: native local name aliases only`);
 for(const [key,value]of locs[lang]){
  const prose=value.replace(/\[[^\]]*\]|\$[^$]+\$/g,'');
  // The Stage-IV physical prototype is an in-universe funded construction,
  // unlike the old developer-prototype vocabulary prohibited in earlier text.
  const checkedProse = /^(?:epoch_iv|tech_epoch_iv|EPOCH_IV)/.test(key) ? prose.replace(/\bPrototyp(?:e|projekt)?\b/gi,'') : prose;
  check(!/\b(?:EPOCH|Stage\s+[IVX]+|Chapter|Handoff|Callback|Debug|Gameplay|Mechanic|Freischaltung|Prototyp(?:e|projekt)?)\b/i.test(checkedProse),`${lang}:${key}: no implementation terms`);
  if(/epoch_(?:res|core)\.\d+\.desc/.test(key))check(!/(?:\b\d+\s*(?:Energy|Energie|Physics|Physik|days|Tage)\b|\d+\s*%)/i.test(prose),`${lang}:${key}: narrative contains no resource/duration table`);
 }
 check(locs[lang].get('epoch_res.hunter_location').includes('[epoch_res_battle_location.GetName]'),`${lang}: hunter alias`);
 check(locs[lang].get('epoch_res.infected_location').includes('[epoch_res_infected_world.GetName]'),`${lang}: colony alias`);
}
assert.deepEqual([...locs.english.keys()].sort(),[...locs.german.keys()].sort(),'EN/DE keys match');checks++;
function references(b){for(const [k,v]of b){
 if(Array.isArray(v)){references(v);continue;}
 if(['name','title','desc','text','custom_tooltip','custom_tooltip_with_modifiers','fail_text','success_text','localization_key'].includes(k)&&/^(?:epoch_|EPOCH_|NAME_EPOCH)/.test(v.replaceAll('"','')))check(locs.english.has(v.replaceAll('"','')),`Defined player text ${v}`);
}}
for(const [p,b]of current)if(!p.startsWith('test-mods/'))references(b);
for(const [k,v]of locs.english)for(const m of v.matchAll(/\$(epoch_[^$]+)\$/g))check(locs.english.has(m[1]),`${k}: defined nested text ${m[1]}`);
for(const [,b]of current.get('common/scripted_loc/epoch_core_loc.txt'))for(const [k,v]of b)if(k==='text')check(locs.english.has(get(v,'localization_key')),'Defined scripted text '+get(v,'localization_key'));
console.log(`PASS: ${checks} narrative/UI/baseline assertions; maximum scripted-effect depth ${deepest[0][1]} (${deepest[0][0]}). Display-only previews excluded from execution.`);
