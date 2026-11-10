// Deterministic vector UI mark, rasterized without external packages.
// Cyan circuit frame + amber three-blade core, intentionally unlike purple Dark Matter.
const fs=require('node:fs'),zlib=require('node:zlib');
const dir='gfx/interface/icons/resources';fs.mkdirSync(dir,{recursive:true});
const shapes=[
 ['#54e8ec',[[32,3],[57,17],[57,47],[32,61],[7,47],[7,17]]],
 ['#102f3c',[[32,8],[52,20],[52,44],[32,56],[12,44],[12,20]]],
 ['#ffba43',[[29,14],[35,14],[38,25],[49,29],[49,35],[38,39],[35,50],[29,50],[25,39],[15,35],[15,29],[25,25]]],
 ['#fff1b7',[[32,23],[41,32],[32,41],[23,32]]],
 ['#54e8ec',[[2,28],[13,28],[13,36],[2,36]]],
 ['#54e8ec',[[51,28],[62,28],[62,36],[51,36]]]
];
fs.writeFileSync(dir+'/epoch_protocol_cores.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${shapes.map(([fill,p])=>`<polygon fill="${fill}" points="${p.map(x=>x.join(',')).join(' ')}"/>`).join('')}</svg>\n`);
function inside(x,y,p){let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],c=p[j];if((a[1]>y)!==(c[1]>y)&&x<(c[0]-a[0])*(y-a[1])/(c[1]-a[1])+a[0])b=!b;}return b;}
function pixels(n,grey){const b=Buffer.alloc(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){
 let r=0,g=0,bl=0,a=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){
 let color=null;for(const [c,p]of shapes)if(inside((x+(sx+.5)/4)*64/n,(y+(sy+.5)/4)*64/n,p))color=c;
 if(color){r+=parseInt(color.slice(1,3),16);g+=parseInt(color.slice(3,5),16);bl+=parseInt(color.slice(5,7),16);a++;}}
 const i=(y*n+x)*4;if(a){if(grey)r=g=bl=(r+g+bl)/3;b[i]=r/a;b[i+1]=g/a;b[i+2]=bl/a;b[i+3]=255*a/16;}}
 return b;}
function dds(name,n,grey=false){const b=pixels(n,grey),h=Buffer.alloc(128);h.write('DDS ');h.writeUInt32LE(124,4);h.writeUInt32LE(0x100f,8);h.writeUInt32LE(n,12);h.writeUInt32LE(n,16);h.writeUInt32LE(n*4,20);h.writeUInt32LE(32,76);h.writeUInt32LE(0x41,80);h.writeUInt32LE(32,88);[0xff,0xff00,0xff0000,0xff000000].forEach((v,i)=>h.writeUInt32LE(v,92+i*4));h.writeUInt32LE(0x1000,108);fs.writeFileSync(`${dir}/${name}.dds`,Buffer.concat([h,b]));}
dds('epoch_protocol_cores',32);dds('epoch_protocol_cores_large',64);dds('epoch_protocol_cores_grey',32,true);
// PNG preview from identical vector rasterization.
const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
const chunk=(t,d)=>{const h=Buffer.alloc(4),c=Buffer.alloc(4),x=Buffer.concat([Buffer.from(t),d]);h.writeUInt32BE(d.length);c.writeUInt32BE(crc(x));return Buffer.concat([h,x,c]);};
const n=256,b=pixels(n),raw=Buffer.alloc(n*(n*4+1)),ih=Buffer.alloc(13);ih.writeUInt32BE(n);ih.writeUInt32BE(n,4);ih[8]=8;ih[9]=6;for(let y=0;y<n;y++)b.copy(raw,y*(n*4+1)+1,y*n*4,(y+1)*n*4);
fs.writeFileSync(`${dir}/epoch_protocol_cores.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
