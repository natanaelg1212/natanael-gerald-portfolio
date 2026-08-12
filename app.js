
(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const loader=$("#loader"), pct=$("#loaderPct");
let n=0; const loadTimer=setInterval(()=>{n=Math.min(100,n+Math.ceil(Math.random()*12));pct.textContent=String(n).padStart(2,"0");if(n>=100){clearInterval(loadTimer);setTimeout(()=>{loader.classList.add("done");document.querySelectorAll(".hero-title .reveal").forEach((e,i)=>setTimeout(()=>e.classList.add("show"),i*90));},300)}},55);

// Nav
const nav=$("#nav"); let lastY=0;
addEventListener("scroll",()=>{nav.classList.toggle("scrolled",scrollY>20); if(scrollY>lastY&&scrollY>140)nav.style.transform="translateY(-100%)";else nav.style.transform="translateY(0)";lastY=scrollY},{passive:true});

// Reveal
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("show")}),{threshold:.12});
$$(".reveal").forEach(e=>revealObserver.observe(e));

// Cursor
const cursor=$("#cursor"), ring=$("#cursorRing"), label=$("#cursorLabel");
let mx=innerWidth/2,my=innerHeight/2, cx=mx,cy=my, rx=mx,ry=my;
addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;});
function cursorLoop(){
 cx+=(mx-cx)*.22;cy+=(my-cy)*.22;rx+=(mx-rx)*.12;ry+=(my-ry)*.12;
 cursor.style.left=cx+"px";cursor.style.top=cy+"px";ring.style.left=rx+"px";ring.style.top=ry+"px";
 requestAnimationFrame(cursorLoop)
} cursorLoop();
function hoverCursor(on,text=""){cursor.classList.toggle("hover",on);ring.classList.toggle("hover",on);label.textContent=text}
$$("a,button,.archive-item").forEach(el=>{el.addEventListener("mouseenter",()=>hoverCursor(true,el.classList.contains("project-open")?"VIEW":""));el.addEventListener("mouseleave",()=>hoverCursor(false))});

// Mobile menu
$("#menuBtn").onclick=()=>$("#mobileMenu").classList.add("open");
$("#menuClose").onclick=()=>$("#mobileMenu").classList.remove("open");
$$(".mobile-menu a").forEach(a=>a.onclick=()=>$("#mobileMenu").classList.remove("open"));

// Liquid WebGL image distortion
const supportsHover=matchMedia("(hover:hover) and (pointer:fine)").matches;
const liquidInstances=[];
const vert=`attribute vec2 aPos;attribute vec2 aUV;varying vec2 vUV;void main(){vUV=aUV;gl_Position=vec4(aPos,0.,1.);}`;
const frag=`precision highp float;uniform sampler2D uTex;uniform vec2 uMouse;uniform vec2 uVelocity;uniform float uTime;uniform float uStrength;uniform float uActive;varying vec2 vUV;
void main(){
 vec2 uv=vUV;
 vec2 d=uv-uMouse;
 float dist=length(d);
 float influence=exp(-dist*dist*18.0)*uActive;
 vec2 dir=normalize(uVelocity+vec2(.00001));
 vec2 perp=vec2(-dir.y,dir.x);
 float wave=sin(dist*45.0-uTime*6.0)*0.012;
 float fall=max(0.0,1.0-dist*1.7);
 uv += dir*influence*0.10*uStrength*fall;
 uv += perp*influence*(wave+0.008)*uStrength*fall;
 uv += normalize(d+vec2(.00001))*influence*wave*0.55*uStrength;
 uv += vec2(sin(uv.y*18.0+uTime)*0.001,cos(uv.x*17.0-uTime)*0.001)*influence;
 gl_FragColor=texture2D(uTex,uv);
}`;
function LiquidMedia(el){
 if(!supportsHover)return;
 const src=el.dataset.image, img=el.querySelector("img"), strength=parseFloat(el.dataset.strength||"1");
 const canvas=document.createElement("canvas"); el.appendChild(canvas);
 const gl=canvas.getContext("webgl",{antialias:false,alpha:false,preserveDrawingBuffer:false});
 if(!gl)return;
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s};
 const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vert));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,frag));gl.linkProgram(p);gl.useProgram(p);
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,1,1,-1,-1,1,0,0,1,1]),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(p,"aPos");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,16,0);
 const uv=gl.getAttribLocation(p,"aUV");gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,16,8);
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const textureImg=new Image();textureImg.src=src;textureImg.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureImg);el.classList.add("ready");};
 const loc={mouse:gl.getUniformLocation(p,"uMouse"),vel:gl.getUniformLocation(p,"uVelocity"),time:gl.getUniformLocation(p,"uTime"),strength:gl.getUniformLocation(p,"uStrength"),active:gl.getUniformLocation(p,"uActive")};
 let rect, mx=.5,my=.5, tx=.5,ty=.5, vx=0,vy=0, pvx=0,pvy=0,active=0,target=0,t0=performance.now();
 function resize(){const dpr=Math.min(devicePixelRatio||1,2);rect=el.getBoundingClientRect();canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;gl.viewport(0,0,canvas.width,canvas.height)}
 new ResizeObserver(resize).observe(el);resize();
 el.addEventListener("mousemove",e=>{const r=el.getBoundingClientRect();tx=(e.clientX-r.left)/r.width;ty=1-(e.clientY-r.top)/r.height;target=1});
 el.addEventListener("mouseenter",()=>target=1);el.addEventListener("mouseleave",()=>target=0);
 function frame(now){
  mx+=(tx-mx)*.13;my+=(ty-my)*.13;vx+=(mx-pvx)*.55;vy+=(my-pvy)*.55;pvx=mx;pvy=my;
  vx*=.82;vy*=.82;active+=(target-active)*.09;
  gl.uniform2f(loc.mouse,mx,my);gl.uniform2f(loc.vel,vx,vy);gl.uniform1f(loc.time,(now-t0)/1000);gl.uniform1f(loc.strength,strength);gl.uniform1f(loc.active,active);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);requestAnimationFrame(frame)
 } requestAnimationFrame(frame);
 liquidInstances.push(el);
}
$$(".liquid-media").forEach(LiquidMedia);

// Archive
const filterMap={all:[...PORTFOLIO_ASSETS["3d"],...PORTFOLIO_ASSETS["poster"],...PORTFOLIO_ASSETS["logo"],...PORTFOLIO_ASSETS["social"]],3d:PORTFOLIO_ASSETS["3d"],poster:PORTFOLIO_ASSETS["poster"],logo:PORTFOLIO_ASSETS["logo"],social:PORTFOLIO_ASSETS["social"]};
const grid=$("#archiveGrid");
function renderArchive(filter="all"){grid.innerHTML="";filterMap[filter].forEach((src,i)=>{const f=document.createElement("figure");f.className="archive-item";f.innerHTML=`<img loading="lazy" src="${src}" alt="Portfolio work ${i+1}">`;f.onclick=()=>openLightbox(src);grid.appendChild(f)})}
renderArchive();
$$(".filter").forEach(b=>b.onclick=()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderArchive(b.dataset.filter)});

// Lightbox
const lb=document.createElement("div");lb.className="lightbox";lb.innerHTML='<button>CLOSE ×</button><img alt="">';document.body.appendChild(lb);
lb.querySelector("button").onclick=()=>lb.classList.remove("open");lb.onclick=e=>{if(e.target===lb)lb.classList.remove("open")};
function openLightbox(src){lb.querySelector("img").src=src;lb.classList.add("open")}

// Cases
const cases={
 cryopad:{title:"CRYOPAD X",kicker:"PRODUCT DESIGN / UX · 2026",intro:"A gaming mousepad system designed to improve gaming comfort and experience through integrated cooling, ergonomic support, RGB lighting and modular components.",gallery:["assets/p11_img01.webp","assets/p11_img02.webp","assets/p11_img03.webp","assets/p11_img04.webp","assets/p11_img05.webp","assets/p11_img06.webp"],sections:[["01 — RESEARCH","The project explores the needs of gamers around comfort, surface temperature, desk setup and prolonged use. Replace this paragraph with the exact findings from the final thesis when needed."],["02 — CONCEPT","The concept combines a large gaming surface with active cooling and an ergonomic palm-rest system, keeping the visual language clean and gaming-oriented."],["03 — DEVELOPMENT","The prototype direction uses cooling modules, heatsinks, fans, a slim power supply and modular components to turn the concept into a tangible product."],["04 — FINAL DESIGN","The final direction brings together product form, user experience, lighting and physical detailing into one gaming accessory system."]]},
 nabraks:{title:"NABRAK’S",kicker:"PRODUCT / 3D MODELING",intro:"Practical furniture that works as a bedside table while adding a hidden or lockable compartment for valuables.",gallery:["assets/p05_img02.webp","assets/p05_img03.webp","assets/p05_img04.webp","assets/p05_img05.webp"],sections:[["01 — PRODUCT IDEA","A multifunctional bedside table designed to combine everyday storage with a concealed safe-like compartment."],["02 — VISUALIZATION","3D modeling and visualization communicate the form, proportions and functional relationship between the main table and hidden storage."]]},
 booth:{title:"SEJATI BOOTH",kicker:"SPATIAL / 3D · COLLABORATION",intro:"A booth design developed collaboratively with PT. Sejati Bintang Halim, focused on presenting the company in a professional physical environment.",gallery:["assets/p07_img01.webp","assets/p07_img02.webp","assets/p07_img03.webp","assets/p07_img04.webp"],sections:[["01 — DIRECTION","The booth uses a clear spatial hierarchy to create a recognizable presentation area for the company."],["02 — VISUALIZATION","3D views were used to communicate layout, structure and visual experience before production."]]},
 iconeeds:{title:"ICONEEDS",kicker:"BRAND IDENTITY / FASHION",intro:"A fashion concept combining the words “icon” and “needs”, with a focus on simple contemporary womenswear and batik-inspired details.",gallery:["assets/p18_img01.webp","assets/p18_img02.webp","assets/p18_img03.webp","assets/p18_img04.webp","assets/p18_img05.webp"],sections:[["01 — IDENTITY","The concept positions ICONEEDS around a balance between contemporary fashion and recognizable Indonesian visual details."],["02 — APPLICATION","Brand identity, packaging and visual applications explore how the mark can work consistently across touchpoints."]]},
 poster:{title:"POSTER SERIES",kicker:"GRAPHIC DESIGN / POSTER",intro:"A selection of poster and campaign explorations from the portfolio, showing different approaches to image, typography and visual composition.",gallery:["assets/p13_img01.webp","assets/p13_img02.webp","assets/p13_img03.webp","assets/p14_img01.webp","assets/p14_img02.webp","assets/p14_img03.webp","assets/p15_img01.webp","assets/p15_img02.webp","assets/p15_img03.webp","assets/p16_img01.webp"],sections:[["01 — VISUAL LANGUAGE","Poster work explores hierarchy, contrast, image treatment and typography to create a clear visual message."],["02 — ITERATION","Different layouts and visual treatments show experimentation across campaign directions."]]},
 social:{title:"SOCIAL CONTENT",kicker:"DIGITAL CONTENT / SOCIAL MEDIA",intro:"A collection of digital content work from social media and visual communication projects, including F&B and textile-oriented content.",gallery:["assets/p22_img01.webp","assets/p22_img02.webp","assets/p22_img03.webp","assets/p22_img04.webp","assets/p23_img01.webp","assets/p23_img02.webp","assets/p23_img03.webp","assets/p23_img04.webp","assets/p23_img05.webp","assets/p23_img06.webp"],sections:[["01 — CONTENT","Social content is developed to make products and messages easy to understand while keeping a consistent visual presence."],["02 — CAMPAIGNS","Layouts, photography and graphic treatments are combined for promotional and product-focused communication."]]}
};
const overlay=$("#caseOverlay"), cc=$("#caseContent");
function openCase(id){const c=cases[id];if(!c)return;cc.innerHTML=`<div class="case-hero"><div class="case-kicker">${c.kicker}</div><h1 class="case-title">${c.title}</h1></div><div class="case-intro"><div class="section-label"><span>CASE STUDY</span></div><p>${c.intro}</p></div><div class="case-gallery">${c.gallery.map(s=>`<figure><img loading="lazy" src="${s}" alt="${c.title} project image"></figure>`).join("")}</div>${c.sections.map(s=>`<section class="case-section"><h3>${s[0]}</h3><p>${s[1]}</p></section>`).join("")}`;overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";cc.querySelectorAll("img").forEach(img=>img.onclick=()=>openLightbox(img.src))}
function closeCase(){overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");document.body.style.overflow=""}
$$(".project-open").forEach(b=>b.onclick=()=>openCase(b.dataset.project));$("#caseClose").onclick=closeCase;
addEventListener("keydown",e=>{if(e.key==="Escape"){closeCase();lb.classList.remove("open")}});

// Magnetic links
if(supportsHover){$$(".magnetic").forEach(el=>el.addEventListener("mousemove",e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-(r.left+r.width/2))*.12}px,${(e.clientY-(r.top+r.height/2))*.12}px)`}));$$(".magnetic").forEach(el=>el.addEventListener("mouseleave",()=>el.style.transform=""))}
})();
