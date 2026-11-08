// Source evidence from the installed target build. These checks deliberately do
// not claim to execute Stellaris, its UI, pathfinder or native project callbacks.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {parse,get,parsedByPath:parsed} = require('./test_clausewitz_structure.cjs');
const vanilla = process.argv[3] || 'G:/Steam/steamapps/common/Stellaris';
const docs = process.env.EPOCH_SCRIPT_DOCUMENTATION || path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation');
const text = p=>fs.readFileSync(p,'utf8');
const section=(file,key)=>text(path.join(docs,file)).split('\n').filter((_,i,a)=>{
 const start=a.findIndex(s=>s.startsWith(key+' -'));
 return i>=start&&i<=start+5;
}).join('\n');
let checks=0;
const check=(v,m)=>{checks++;assert.ok(v,m);};
check(section('scopes.log','planet').includes('colony')&&section('scopes.log','planet').includes('Output Scope: planet'),'Native Colony -> physical Planet promotion');
check(section('scopes.log','colony').includes('planet')&&section('scopes.log','colony').includes('Output Scope: colony'),'Native Planet -> Colony promotion');
check(section('triggers.log','has_planet_flag').includes("carrier's flags")&&section('effects.log','set_planet_flag').includes("carrier's flags"),'Native flag forwarding supports both Decision carrier identities');
check(section('triggers.log','is_same_value').includes('same thing'),'Identity does not imply Colony/Planet equivalence');
const nativeProjects=parse(text(path.join(vanilla,'common/special_projects/00_projects_2.txt')),'Vanilla projects');
const native=nativeProjects.find(([,b])=>get(b,'key')==='"AMOEBAS_PACIFICATION_PROJECT"')[1];
const ours=parsed.get('common/special_projects/epoch_phase_ii_projects.txt').find(([,b])=>get(b,'key')==='"EPOCH_RES_RECON"')[1];
for(const field of ['tech_department','event_scope','location'])check(get(native,field)===get(ours,field),`Recon ${field} follows installed AMOEBAS_PACIFICATION_PROJECT`);
check(JSON.stringify(get(native,'on_success')).replace('story.107','epoch_res.102')===JSON.stringify(get(ours,'on_success')),'Native PREV -> country completion forwarding is preserved exactly');
check(+get(ours,'cost')>0&&!get(ours,'requirements')&&!get(ours,'days_to_research'),'Physics points replace ship/day requirements');
const projectDoc=text(path.join(vanilla,'common/special_projects/documentation.txt'));
check(/PREV = country/.test(projectDoc)&&/only relevant if cost is not 0/.test(projectDoc),'Installed project documentation confirms country callback and research department semantics');
check(section('triggers.log','can_access_system').includes('fleet')&&section('triggers.log','has_access_fleet').includes('galactic_object'),'Native system and fleet path checks use supported scopes');
const gfx=text(path.join(vanilla,'interface/situation_log.gfx'));
for(const p of ['common/situations/epoch_phase_ii_situations.txt','common/situations/epoch_legacy_situations.txt']){
 const situation=parsed.get(p)[0][1];
 const approaches=situation.filter(([k])=>k==='approach');
 check(approaches.length===1,`${p}: only observation remains`);
 for(const [,a]of approaches){
  for(const f of ['icon','icon_background'])check(gfx.includes(`name = "${get(a,f)}"`),`${p}: native ${f}`);
  check(get(get(a,'on_select'),'custom_tooltip')==='epoch_res_observe_tt',`${p}: nonempty native approach tooltip`);
 }
}
const decisionIcon=path.join(vanilla,'gfx/interface/icons/decisions/decision_resources.dds');
check(fs.existsSync(decisionIcon),'Decision icon uses the installed native resources texture');
const loc=text(path.join(vanilla,'localisation/english/ancient_relics_events_l_english.yml'));
check(loc.includes('[event_target:sentinels_planet.GetName]'),'Local event-target naming syntax is demonstrated by Vanilla');
for(const lang of ['english','german']){
 const p=path.join(process.argv[2]||path.resolve(__dirname,'..'),`localisation/${lang}/epoch_core_l_${lang}.yml`);
 const bytes=fs.readFileSync(p),s=bytes.toString('utf8');
 check(bytes[0]===239&&bytes[1]===187&&bytes[2]===191,`${lang}: UTF-8 BOM`);
 check(!/\[[^\]]*@/.test(s),`${lang}: no keyed global targets in dynamic localization`);
 check(!/Planet\?s|planet\?s|\uFFFD/.test(s),`${lang}: no corrupted apostrophe or replacement character`);
}
console.log(`PASS: ${checks} installed Vanilla/script-documentation evidence checks. Native UI and callbacks require in-game acceptance.`);
