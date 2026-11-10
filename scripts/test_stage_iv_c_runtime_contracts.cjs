// Semantic checks for the actual 4.5.3 failures, with deliberately broken fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {parse,get,parsedByPath}=require('./test_clausewitz_structure.cjs');
const root=process.argv[2]||path.resolve(__dirname,'..'),vanilla=process.argv[3]||'G:/Steam/steamapps/common/Stellaris';
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),native=p=>fs.readFileSync(path.join(vanilla,p),'utf8');
const tree=p=>parse(read(p),p),deep=(b,k)=>(b||[]).flatMap(([key,v])=>[...(key===k?[v]:[]),...(Array.isArray(v)?deep(v,k):[])]);
let checks=0;const check=(x,m)=>{checks++;assert.ok(x,m);};
const macros=new Map([...parsedByPath].filter(([p])=>p.startsWith('common/scripted_triggers/')).flatMap(([,b])=>b));
const docs=fs.readFileSync(path.join(process.env.USERPROFILE,'Documents/Paradox Interactive/Stellaris/logs/script_documentation/triggers.log'),'utf8');
const scopes=new Map([...docs.matchAll(/^(\w+) - [\s\S]*?Supported Scopes: ([^\r\n]+)/gm)].map(m=>[m[1],m[2].split(' ')]));
const nativePredicates=['is_wilderness_empire','is_robot_empire','is_hive_empire','is_gestalt'];
const nativeTriggerSources=fs.readdirSync(path.join(vanilla,'common/scripted_triggers')).filter(x=>x.endsWith('.txt')).map(x=>native('common/scripted_triggers/'+x)).join('\n');
function validate(b,scope,stack=[]){for(const [key,v]of b||[]){
 if(['NOT','NOR','AND','OR','hidden_trigger'].includes(key)){validate(v,scope,stack);continue;}
 if(key==='owner'){assert.ok(['planet','megastructure','pop','pop_group'].includes(scope),'owner switch is invalid from '+scope);validate(v,'country',stack);continue;}
 if(key==='owner?'){
  // Native optional links do not evaluate their children if the link is absent,
  // including country-only construction/UI economy queries (first playtest).
  if(['planet','megastructure','pop','pop_group'].includes(scope))validate(v,'country',stack);
  else assert.equal(scope,'country','unmodelled optional owner context');
  continue;
 }
 if(key==='from'){assert.ok(['galactic_object','fleet','megastructure'].includes(scope));validate(v,'country',stack);continue;}
 if(key==='any_system_planet'){assert.equal(scope,'galactic_object');validate(v,'planet',stack);continue;}
 if(key==='has_no_non_gate_megastructure'){assert.equal(scope,'galactic_object');assert.ok(nativeTriggerSources.includes('has_no_non_gate_megastructure ='));continue;}
 if(key==='count_owned_megastructure'){
  assert.equal(scope,'country');assert.ok(get(v,'limit'),'native count requires limit');
  assert.ok(v.every(([k])=>['count','limit'].includes(k)),'no triggers beside limit in count');validate(get(v,'limit'),'megastructure',stack);continue;
 }
 if(['any_owned_megastructure','any_system_megastructure'].includes(key)){
  if(key==='any_owned_megastructure')assert.equal(scope,'country');validate(v,'megastructure',stack);continue;
 }
 if(macros.has(key)){assert.ok(!stack.includes(key),'recursive trigger '+key);validate(macros.get(key),scope,[...stack,key]);continue;}
 if(nativePredicates.includes(key)&&!scopes.has(key)){
  assert.equal(scope,'country');assert.ok(new RegExp('^'+key+'\\s*=','m').test(nativeTriggerSources),'real native country predicate '+key);continue;
 }
 if(!scopes.has(key)){const n=nativeTriggerSources.match(new RegExp('^'+key+' = \\{[\\s\\S]*?^\\}','m'));if(n){assert.ok(!stack.includes(key),'recursive native macro '+key);validate(parse(n[0],'native '+key)[0][1],scope,[...stack,key]);continue;}}
 const allowed=scopes.get(key);assert.ok(allowed,'unknown trigger '+key);assert.ok(allowed.includes('all')||allowed.includes(scope),`${key} cannot run in ${scope}`);
 if(key==='exists'&&v==='owner')assert.notEqual(scope,'country','country resource table has no megastructure owner');
}}
function rejects(source,scope){checks++;assert.throws(()=>validate(parse('t = {'+source+'}','broken')[0][1],scope));}
rejects('has_megastructure_flag = epoch_c_operational','country');
rejects('epoch_iv_future_research = yes','megastructure');
rejects('epoch_c_guard = yes','megastructure');
rejects('epoch_c_free = yes','megastructure');
rejects('exists = owner owner = { epoch_iv_future_research = yes }','country');
rejects('owner = { owner = { epoch_iv_future_research = yes } }','megastructure');
rejects('has_deficit = minerals','pop_group');
rejects('count_owned_megastructure = { count < 2 OR = { is_megastructure_type = epoch_nexus_1 } }','country');
rejects('count_owned_megastructure = { count < 2 limit = { has_country_flag = x } }','country');
const mega=new Map(tree('common/megastructures/epoch_c_megastructures.txt'));
// Bind the context oracle to recorded engine errors, not the contradicted README comment.
const priorSource=cp.execFileSync('git',['show','4f8530e:common/megastructures/epoch_c_megastructures.txt'],{encoding:'utf8'});
const priorLines=priorSource.split(/\r?\n/),priorMega=new Map(parse(priorSource,'third-test mega baseline'));
const observed=read('docs/research/third-b-c-playtest-2026-11-10/scope-errors.txt');
let resourceEvidence=0,modifierEvidence=0;
for(const m of observed.matchAll(/epoch_c_megastructures\.txt line: (\d+)\r?\nCurrent Scope: (\w+)/g)){
 const line=priorLines[Number(m[1])-1].trim();
 if(line.startsWith('produces =')){check(m[2]==='megastructure','engine observed recurring resource mega context');resourceEvidence++;}
 else if(line.startsWith('triggered_country_modifier =')){check(m[2]==='country','engine observed modifier country context');modifierEvidence++;}
 else throw Error('Unmapped real scope diagnostic: '+line);
}
check(resourceEvidence>=10&&modifierEvidence>=10,'both recurring contexts have direct third-run engine evidence');
const firstObserved=read('docs/research/first-b-c-playtest-2026-11-10/error.log.txt');
const firstLines=cp.execFileSync('git',['show','cf13857:common/megastructures/epoch_c_megastructures.txt'],{encoding:'utf8'}).split(/\r?\n/);
let countryResourceQueries=0;
for(const m of firstObserved.matchAll(/Wrong scope[^\n]+has_megastructure_flag[^\n]+epoch_c_megastructures\.txt line: (\d+)\r?\nCurrent Scope: country/g))if(firstLines[Number(m[1])-1].trim().startsWith('produces ='))countryResourceQueries++;
check(countryResourceQueries>0,'first run also observed country-only resource queries; require native optional-owner pattern');
for(const [id,b]of priorMega){
 for(const [,t]of get(b,'resources').filter(([k])=>k==='produces')){checks++;assert.throws(()=>validate(get(t,'trigger'),'megastructure'),undefined,'reject actual previous broken resource condition '+id);}
 for(const potential of deep(b,'triggered_country_modifier').map(t=>get(t,'potential'))){checks++;assert.throws(()=>validate(potential,'country'),undefined,'reject actual previous broken modifier condition '+id);}
}
for(const [id,b]of mega){
 const family=id.match(/^epoch_(\w+)_/)[1];
 for(const [kind,t]of get(b,'resources').filter(([k])=>['cost','upkeep','produces'].includes(k))){
  if(kind==='upkeep')check(!get(t,'trigger'),'keep native unconditional upkeep; no unobserved conditional-upkeep scope assumption');
  else{
   validate(get(t,'trigger'),kind==='cost'?'country':'megastructure');checks++;
   if(kind==='produces'){
    validate(get(t,'trigger'),'country');checks++;
    check(get(t,'trigger').length===1&&!!get(get(t,'trigger'),'owner?'),'native optional-owner predicate only; no instance flag in recurring resource query');
   }
  }
 }
 for(const potential of deep(b,'triggered_country_modifier').map(t=>get(t,'potential'))){validate(potential,'country');checks++;}
 validate(get(b,'potential'),'country');validate(get(b,'build_menu_potential'),'fleet');validate(get(b,'possible'),'galactic_object');validate(get(get(b,'placement_rules')||[],'planet_possible'),'planet');validate(get(b,'dismantle_possible'),'megastructure');checks+=5;
 for(const field of ['potential','build_menu_potential','possible','placement_rules','upgrade_from','prerequisites','on_build_start','on_build_cancel','on_build_complete','on_dismantle_complete']){assert.deepEqual(get(b,field),get(priorMega.get(id),field),'successful construction and callbacks preserved '+id+'/'+field);checks++;}
 const resources=get(b,'resources'),oldResources=get(priorMega.get(id),'resources');
 assert.deepEqual(get(resources,'cost'),get(oldResources,'cost'));assert.deepEqual(get(resources,'upkeep'),get(oldResources,'upkeep'));checks+=2;
 const amounts=r=>r.filter(([k])=>k==='produces').map(([,x])=>x.filter(([k])=>k!=='trigger'));
 assert.deepEqual(amounts(resources),amounts(oldResources),'all ten stage resource amounts preserved '+id);checks++;
 check(get(get(b,'on_build_complete'),'fromfrom')?.some(([k,v])=>k==='set_megastructure_flag'&&v==='epoch_c_operational'),'operational marker only on completed instance '+id);
 check(!deep(get(b,'on_build_start'),'set_country_flag').length,'start cannot reserve against itself '+id);
 check(!deep(get(b,'possible'),'has_country_flag').length,'no stale/captured reservation lock '+id);
 const possible=get(b,'possible');
 check(!possible.some(([k])=>k==='has_any_megastructure'),'no generic empty-system condition that rejects own construction '+id);
 if(!get(b,'upgrade_from')){
  check(get(possible,'has_no_non_gate_megastructure')==='yes','source-verified native system placement guard '+id);
  if(family!=='forge'){
   check(!!get(b,'build_menu_potential'),'menu hides owned or constructing capped family '+id);
   const own=deep(possible,'any_owned_megastructure');
   check(own.length===1&&get(own[0],'has_megastructure_flag')==='epoch_c_operational','possible excludes own unfinished unmarked shell '+id);
  }
 }else check(!get(possible,'from'),'upgrades never reapply the first-instance country lock '+id);
 const cleanup=get(get(b,'on_dismantle_complete'),'every_system_planet');
 check(get(get(cleanup,'limit'),'has_any_megastructure')==='no','dismantle never releases a surviving structure anchor '+id);
 check(deep(get(b,'on_build_cancel'),'remove_country_flag').includes('epoch_c_'+family+'_building')||get(b,'upgrade_from'),'legacy cancellation flag cleanup '+id);
}
for(const [id,b]of tree('common/scripted_triggers/epoch_c_triggers.txt')){validate(b,'country');checks++;}
// Verify the installed native guard explicitly enumerates native major types, so an
// unfinished EPOCH shell doesn't make the system fail its own ongoing possible check.
const nativeBlock=native('common/scripted_triggers/00_scripted_triggers.txt').match(/^has_no_non_gate_megastructure = \{[\s\S]*?^\}/m)[0];
const nativeGuard=parse(nativeBlock,'native placement')[0][1];
function systemGate(b,types){return b.every(([k,v])=>{
 if(k==='OR')return v.some(x=>systemGate([x],types));
 if(k==='AND')return systemGate(v,types);
 if(k==='NOT'||k==='NOR')return !v.some(x=>systemGate([x],types));
 if(k==='has_any_megastructure')return !!types.length===(v==='yes');
 if(k==='has_star_flag')return false;
 if(k==='any_system_megastructure')return types.some(t=>systemGate(v,[t]));
 if(k==='is_megastructure_type')return types.includes(v);
 const macro=nativeTriggerSources.match(new RegExp('^'+k+' = \\{[\\s\\S]*?^\\}','m'));
 if(macro)return systemGate(parse(macro[0],'native '+k)[0][1],types)===(v==='yes');
 throw Error('Unmodelled native system guard '+k);
});}
for(const family of ['nexus','forge','uap'])for(const state of [[],['epoch_'+family+'_1']])check(systemGate(nativeGuard,state),'initial placement remains true with own construction shell '+family);
check(!systemGate(nativeGuard,['think_tank_1']),'native major structures still block initial site');
// Implicit names are part of the engine asset contract, not optional fields.
const gfx=tree('interface/epoch_c.gfx'),sprites=new Map(deep(gfx,'spriteType').map(x=>[get(x,'name')?.replaceAll('"',''),get(x,'texturefile')?.replaceAll('"','')]));
for(const [id]of mega)for(const suffix of ['build_icon','outliner_icon']){
 const p=sprites.get('GFX_'+id+'_'+suffix);check(!!p,'registered implicit sprite '+id+'/'+suffix);
 check(fs.existsSync(path.join(root,p))||fs.existsSync(path.join(vanilla,p)),'resolved implicit sprite '+id+'/'+suffix);
}
for(const lang of ['english','german']){
 const loc=new Map([...read(`localisation/${lang}/epoch_c_l_${lang}.yml`).matchAll(/^ (\w+):0 "(.*)"$/gm)].map(m=>[m[1],m[2]]));
 const names=[...mega.keys()].map(id=>loc.get(id));check(new Set(names).size===10,'ten distinct stage names '+lang);
 for(const [id]of mega)check(!/^\w+(?: \w+)? \d$/.test(loc.get(id))&&/\((Stage|Stufe) \d\/[34]\)/.test(loc.get(id)),'story name plus explicit tier '+id);
}
for(const [id,b]of tree('common/decisions/epoch_c_decisions.txt')){
 const effect=get(b,'effect'),preview=get(effect,'tooltip');check(!!preview,'native decision effect preview '+id);
 if(id.endsWith('symbiotic_world'))assert.deepEqual(get(preview,'add_modifier'),get(get(effect,'if'),'add_modifier'),'exact permanent modifier preview');
 else for(const d of deep(preview,'add_deposit'))check(read('common/scripted_effects/epoch_ascension_scripted_effects.txt').includes('add_deposit = '+d),'preview uses authenticated conversion deposit '+d);
 checks++;
}
console.log(`PASS: ${checks} C runtime-failure contracts: country/mega scopes, native count limits, own-shell placement, callbacks, implicit UI sprites and native previews. Static only.`);
