// D1 acceptance: fixed merged-main baseline, localization structure and prose safety.
// This never executes the game and does not certify AI or balance.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const base='12f74555756eaab2614ecea21f0f6201cfe6f9f7';let checks=0;
const check=(v,m)=>{checks++;assert.ok(v,m)};
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8',maxBuffer:16*1024*1024});
const files=git('ls-tree','-r','--name-only',base).trim().split(/\r?\n/);
const all={};
const entries=(s,p)=>{
 const result=new Map();for(const line of s.replace(/^\uFEFF/,'').split(/\r?\n/)){
  if(!line.trim()||/^\s*#/.test(line)||/^l_(english|german):$/.test(line))continue;
  const m=line.match(/^\s*([\w.]+):\d+ "((?:[^"\\]|\\[nrt"\\])*)"\s*$/);
  check(!!m,`${p}: valid quotes/escapes: ${line}`);check(!result.has(m[1]),`${p}: unique key ${m[1]}`);result.set(m[1],m[2]);
 }return result;
};
const tokens=s=>(s.match(/\[[^\]]*\]|\$[^$]+\$|§./g)||[]).sort();
for(const lang of ['english','german']){
 all[lang]=new Map();
 for(const file of fs.readdirSync(`localisation/${lang}`).filter(f=>f.endsWith('.yml'))){
  const p=`localisation/${lang}/${file}`,bytes=fs.readFileSync(p),s=bytes.toString('utf8');
  check(bytes.subarray(0,3).equals(Buffer.from([239,187,191])),p+': BOM');check(!s.includes('\ufffd'),p+': no replacement characters');
  const now=entries(s,p),old=entries(git('show',`${base}:${p}`),p+' (main)');
  assert.deepEqual([...now.keys()].sort(),[...old.keys()].sort(),p+': preserve all keys including legacy');checks++;
  for(const [k,v]of now){
   assert.deepEqual(tokens(v),tokens(old.get(k)),`${p}:${k}: preserve placeholders/references/colors`);checks++;
   check(!all[lang].has(k),`${lang}: no cross-file duplicate ${k}`);all[lang].set(k,v);
   if(v!==old.get(k)){
    const prose=v.replace(/\[[^\]]*\]|\$[^$]+\$/g,'');
    check(!/\b(?:callback|script|skript|testfall|test case|migration|debug|epoch_[a-z_]+)\b/i.test(prose),k+': no developer terms');
    if(/^(?:epoch_core|epoch_res|epoch_iii)\./.test(k))check(!/\b(?:Architects?|Architekten|UAP|assimilation|Universal Ascension Protocol)\b/i.test(v),k+': no early revelation');
   }
  }
 }
 for(const [k,v]of all[lang])for(const [,ref]of v.matchAll(/\$([\w.]+)\$/g))if(/^(?:epoch_|tr_epoch|trait_epoch|tech_epoch|NAME_EPOCH)/.test(ref))check(all[lang].has(ref),k+': defined nested reference '+ref);
 const traditions=[...all[lang]].filter(([k])=>/^(?:tradition_epoch_|tr_epoch_).+_desc$/.test(k));
 check(traditions.length===34,lang+': four complete trees and two Wilderness swaps');check(new Set(traditions.map(([,v])=>v)).size===34,lang+': every tradition description distinct');
 const megas=[...all[lang]].filter(([k])=>/^epoch_(?:nexus|forge|uap)_\d_DESC$/.test(k));check(megas.length===10&&new Set(megas.map(([,v])=>v)).size===10,lang+': ten individual stages');
 check(new Set(['living','hive','machine','guard','free'].map(k=>all[lang].get(`ap_epoch_${k}_desc`))).size===5,lang+': five distinct perks');
 for(const k of ['fabrication','nexus','uap_core','sovereignty','mandate','universal_sovereignty'])check(!/future|no .*currently unlocked|zukünftig|noch nicht|späteren/i.test(all[lang].get(`tech_epoch_iv_${k}_desc`)),k+': implemented content described');
 const restore=all[lang].get('epoch_iv.restore');check(/2[.,]000/.test(restore)&&/4[.,]000/.test(restore),lang+': actual recovery cost');
}
assert.deepEqual([...all.english.keys()].sort(),[...all.german.keys()].sort(),'EN/DE parity');checks++;
for(const p of files.filter(p=>/^(?:common|events|gfx|interface)\//.test(p)||p==='descriptor.mod')){
 const current=fs.readFileSync(p),prior=cp.execFileSync('git',['show',`${base}:${p}`],{maxBuffer:16*1024*1024});
 // Git's Windows checkout converts LF to CRLF for text; binary assets stay exact.
 const same=/\.(?:txt|mod|gfx|svg)$/.test(p)?current.toString('utf8').replaceAll('\r\n','\n')===prior.toString('utf8').replaceAll('\r\n','\n'):current.equals(prior);
 check(same,p+': unchanged executable/assets (checkout EOL normalized)');
}
// Include staged and unstaged additions as well as tracked changes.
const changed=git('diff','--name-only',base).trim().split(/\r?\n/).filter(Boolean);
// D2 and the stable-release CI infrastructure add static/documentation files;
// the executable/assets equality above remains strict.
for(const p of changed)check(/^(?:localisation\/(?:english|german)\/[^/]+\.yml|docs\/.*\.md|README\.md|\.github\/workflows\/stable-release\.yml|scripts\/(?:epoch_release|test_epoch_release|test_release_ci|test_tech_dependencies|test_clausewitz_structure)\.cjs|scripts\/test_stage_(?:iii|iv_d1|iv_d2)\.cjs|scripts\/test_epoch_regressions\.ps1)$/.test(p),p+': D1/D2 text and static-test scope');
check(git('diff','--check').trim()==='','diff whitespace');
console.log(`PASS: ${checks} D1 localization, parity, BOM, placeholder, uniqueness, reveal and immutable-gameplay checks. Static only.`);

