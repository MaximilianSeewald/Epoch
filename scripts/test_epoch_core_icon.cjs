// Compare physical alpha coverage, not just DDS dimensions or percentage of canvas.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const args=process.argv.slice(2).filter(x=>!x.startsWith('--'));
const root=args[0]||path.resolve(__dirname,'..'),v=args[1]||'G:/Steam/steamapps/common/Stellaris';
const base='gfx/interface/icons/resources/';
function decode(b){
 assert.equal(b.toString('ascii',0,4),'DDS ');assert.equal(b.readUInt32LE(88),32);assert.ok(b.readUInt32LE(80)&0x40,'RGBA DDS source');
 const w=b.readUInt32LE(16),h=b.readUInt32LE(12),rgba=Buffer.alloc(w*h*4);
 const shifts=[92,96,100,104].map(i=>{const mask=b.readUInt32LE(i);assert.ok(mask);return Math.log2((mask&-mask)>>>0);});
 for(let i=0;i<w*h;i++){const x=b.readUInt32LE(128+i*4);for(let c=0;c<4;c++)rgba[i*4+c]=(x>>>shifts[c])&255;}
 return {w,h,rgba};
}
function metrics(im){let area=0,minX=im.w,minY=im.h,maxX=-1,maxY=-1;for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){
 const a=im.rgba[(y*im.w+x)*4+3];area+=a/255;if(a>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
 return {canvas:[im.w,im.h],alphaArea:Number(area.toFixed(3)),bbox:[minX,minY,maxX,maxY],visibleSize:[maxX-minX+1,maxY-minY+1]};
}
const sources=['sr_dark_matter','rare_crystals','exotic_gases'].map(id=>({id,image:decode(fs.readFileSync(path.join(v,base+id+'.dds')))}));
const old=decode(cp.execFileSync('git',['show','944c3c2:'+base+'epoch_protocol_cores.dds'],{cwd:root,maxBuffer:1024*1024}));
const current=decode(fs.readFileSync(path.join(root,base+'epoch_protocol_cores.dds')));
const data=sources.concat([{id:'epoch_before',image:old},{id:'epoch_after',image:current}]).map(x=>({id:x.id,...metrics(x.image)}));
const after=data.at(-1);assert.deepEqual(after.canvas,[32,32],'keep existing small DDS canvas');
assert.ok(after.alphaArea>=95&&after.alphaArea<=155,'match installed native physical alpha area');
assert.ok(after.visibleSize.every(x=>x>=12&&x<=17),'match native visible physical dimensions');
assert.ok(after.bbox[0]>=7&&after.bbox[1]>=7,'real transparent inset');
assert.ok(after.alphaArea<data.at(-2).alphaArea*.3,'reduce actual shape, not just header dimensions');
const large=metrics(decode(fs.readFileSync(path.join(root,base+'epoch_protocol_cores_large.dds'))));
assert.deepEqual(large.canvas,[64,64]);assert.ok(Math.abs(large.alphaArea/after.alphaArea-4)<.15,'large variant same geometry');
for(const p of fs.readdirSync(path.join(root,'gfx/interface/icons/modifiers')).filter(x=>x.includes('epoch_protocol_cores')))assert.deepEqual(fs.readFileSync(path.join(root,'gfx/interface/icons/modifiers',p)),fs.readFileSync(path.join(root,base+'epoch_protocol_cores.dds')),'modifier art stays synchronized '+p);
if(process.argv.includes('--report')){
 // Five equal 32px cells enlarged 6x: native dark matter, crystals, gases, old, new.
 const images=sources.map(x=>x.image).concat([old,current]),scale=6,w=32*scale*5,h=32*scale,out=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const col=Math.floor(x/(32*scale)),im=images[col],px=Math.floor((x%(32*scale))/scale)-(32-im.w)/2,py=Math.floor(y/scale)-(32-im.h)/2;
  const ix=Math.floor(px),iy=Math.floor(py),i=(y*w+x)*4,src=(iy*im.w+ix)*4,valid=ix>=0&&iy>=0&&ix<im.w&&iy<im.h,a=valid?im.rgba[src+3]/255:0;
  for(let c=0;c<3;c++)out[i+c]=Math.round((valid?im.rgba[src+c]:0)*a+[19,29,37][c]*(1-a));out[i+3]=255;
 }
 const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const chunk=(t,d)=>{const h=Buffer.alloc(4),c=Buffer.alloc(4),x=Buffer.concat([Buffer.from(t),d]);h.writeUInt32BE(d.length);c.writeUInt32BE(crc(x));return Buffer.concat([h,x,c]);};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;const raw=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)out.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);
 const dir=path.join(root,'docs/research/third-b-c-playtest-2026-11-10');
 fs.writeFileSync(path.join(dir,'core-icon-comparison.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
 fs.writeFileSync(path.join(dir,'core-icon-alpha.json'),JSON.stringify({order:'Dark Matter / Rare Crystals / Exotic Gases / EPOCH before / EPOCH after; equal physical pixel scale',data},null,2)+'\n');
}
console.log('PASS: native alpha-area comparison, transparent inset, unchanged canvases and synchronized modifier DDS. '+JSON.stringify(data));
