(function(){
if(!location.pathname.includes('/test-hrnek-s-vlastnim-potiskem/'))return;

let elements=[],active=null,dragging=false,resizing=false,ox=0,oy=0,startW=0,startH=0,startSize=0,startDist=0;

function ready(){
let h=document.querySelector('h1');
if(!h||document.querySelector('#thBtn'))return;

let btn=document.createElement('button');
btn.id='thBtn';
btn.textContent='Vytvořit vlastní návrh potisku VERZE EXTERNI';
h.parentNode.insertBefore(btn,h.nextSibling);

document.body.insertAdjacentHTML('beforeend',`
<div id="thModal"><div id="thBox">
<div id="thTop"><h2>Konfigurátor celopotisku hrnku</h2><button id="thClose">Zavřít</button></div>
<div id="thGrid">
<canvas id="thCanvas" width="1000" height="620"></canvas>
<div id="thPanel">
<button id="thUpload" class="primary">Nahrát foto</button>
<input id="thFile" type="file" accept="image/*" style="display:none">
<button id="thAddText">Vložit text</button>
<input id="thTextInput" type="text" placeholder="Text" style="display:none">
<label id="thSizeLabel">Velikost vybraného prvku</label>
<input id="thSize" type="range" min="20" max="500" value="100">
<button id="thDelete">Smazat vybraný prvek</button>
<button id="thSave" class="save">Uložit návrh</button>
<p id="thHint">Plocha potisku má poměr 20 × 9 cm. Vybraný prvek posuneš tažením. Zvětšíš ho tažením za modrý roh.</p>
</div></div></div></div>`);

const c=document.querySelector('#thCanvas'),ctx=c.getContext('2d');
const area={x:100,y:170,w:800,h:360},side=75;

function handle(cx,cy,flip){
ctx.save();ctx.translate(cx,cy);if(flip)ctx.scale(-1,1);
ctx.strokeStyle='#c8c8c8';ctx.lineWidth=24;ctx.beginPath();ctx.moveTo(0,-105);ctx.bezierCurveTo(95,-105,105,105,0,105);ctx.stroke();
ctx.strokeStyle='#f0f0f0';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(0,-72);ctx.bezierCurveTo(58,-70,68,70,0,72);ctx.stroke();
ctx.restore();
}

function bg(){
ctx.clearRect(0,0,c.width,c.height);
ctx.fillStyle='#efefef';ctx.fillRect(0,0,c.width,c.height);
ctx.fillStyle='#ddd';ctx.fillRect(area.x-side,area.y,side,area.h);ctx.fillRect(area.x+area.w,area.y,side,area.h);
handle(area.x-side-12,area.y+area.h/2,true);handle(area.x+area.w+side+12,area.y+area.h/2,false);
ctx.fillStyle='#fff';ctx.fillRect(area.x,area.y,area.w,area.h);
ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.strokeRect(area.x,area.y,area.w,area.h);ctx.setLineDash([]);
ctx.fillStyle='#777';ctx.font='18px Arial';ctx.textAlign='center';ctx.fillText('Plocha potisku 20 × 9 cm',area.x+area.w/2,area.y-18);
}

function bounds(el){
if(el.type==='image')return{x:el.x,y:el.y,w:el.w,h:el.h};
ctx.font='bold '+el.size+'px Arial';let w=ctx.measureText(el.text).width;
return{x:el.x-w/2-10,y:el.y-el.size,w:w+20,h:el.size+18};
}

function draw(){
bg();
ctx.save();ctx.beginPath();ctx.rect(area.x,area.y,area.w,area.h);ctx.clip();
elements.forEach(el=>{
if(el.type==='image')ctx.drawImage(el.img,el.x,el.y,el.w,el.h);
else{ctx.fillStyle='#111';ctx.font='bold '+el.size+'px Arial';ctx.textAlign='center';ctx.fillText(el.text,el.x,el.y);}
});
ctx.restore();

if(active){
let b=bounds(active),s=26,x=b.x+b.w-s/2,y=b.y+b.h-s/2;
ctx.strokeStyle='#06f';ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.setLineDash([]);
ctx.fillStyle='#06f';ctx.fillRect(x,y,s,s);
ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+7,y+18);ctx.lineTo(x+18,y+7);ctx.moveTo(x+11,y+19);ctx.lineTo(x+19,y+19);ctx.lineTo(x+19,y+11);ctx.stroke();
}
}

function pos(e){let r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)}}
function hit(p){for(let i=elements.length-1;i>=0;i--){let b=bounds(elements[i]);if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)return elements[i]}return null}
function resizeHit(p,el){let b=bounds(el),s=34;return p.x>=b.x+b.w-s&&p.x<=b.x+b.w+s&&p.y>=b.y+b.h-s&&p.y<=b.y+b.h+s}
function panel(){
let l=document.querySelector('#thSizeLabel'),s=document.querySelector('#thSize'),t=document.querySelector('#thTextInput');
if(!active){l.textContent='Velikost vybraného prvku';t.style.display='none';return}
if(active.type==='image'){l.textContent='Velikost fotografie';s.min=40;s.max=900;s.value=active.w;t.style.display='none'}
else{l.textContent='Velikost textu';s.min=20;s.max=180;s.value=active.size;t.style.display='block';t.value=active.text}
}

c.onmousedown=c.ontouchstart=function(e){
e.preventDefault();let p=pos(e);active=hit(p);
if(active&&resizeHit(p,active)){resizing=true;let b=bounds(active);startDist=Math.hypot(p.x-b.x,p.y-b.y);startW=active.w||0;startH=active.h||0;startSize=active.size||0}
else if(active){dragging=true;ox=p.x-active.x;oy=p.y-active.y}
panel();draw();
};

c.onmousemove=c.ontouchmove=function(e){
if(!active)return;e.preventDefault();let p=pos(e);
if(resizing){let b=bounds(active),d=Math.hypot(p.x-b.x,p.y-b.y),scale=Math.max(.2,d/startDist);
if(active.type==='image'){active.w=Math.max(40,startW*scale);active.h=Math.max(20,startH*scale)}
else active.size=Math.max(20,Math.min(180,startSize*scale));
panel();draw();return}
if(dragging){active.x=p.x-ox;active.y=p.y-oy;draw()}
};

c.onmouseup=c.onmouseleave=c.ontouchend=function(){dragging=false;resizing=false};
document.querySelector('#thBtn').onclick=()=>{document.querySelector('#thModal').style.display='block';draw()};
document.querySelector('#thClose').onclick=()=>document.querySelector('#thModal').style.display='none';
document.querySelector('#thUpload').onclick=()=>document.querySelector('#thFile').click();

document.querySelector('#thFile').onchange=function(e){
let f=e.target.files[0];if(!f)return;
let r=new FileReader();
r.onload=function(ev){let img=new Image();img.onload=function(){let ratio=img.height/img.width;let el={type:'image',img:img,x:area.x+80,y:area.y+50,w:320,h:320*ratio};elements.push(el);active=el;panel();draw()};img.src=ev.target.result};
r.readAsDataURL(f);
};

document.querySelector('#thAddText').onclick=function(){let el={type:'text',text:'Tvůj text',x:area.x+area.w/2,y:area.y+area.h/2,size:70};elements.push(el);active=el;panel();draw()};
document.querySelector('#thTextInput').oninput=e=>{if(active&&active.type==='text'){active.text=e.target.value;draw()}};
document.querySelector('#thSize').oninput=e=>{if(!active)return;let v=+e.target.value;if(active.type==='image'){let r=active.h/active.w;active.w=v;active.h=v*r}else active.size=v;draw()};
document.querySelector('#thDelete').onclick=()=>{if(!active)return;elements=elements.filter(e=>e!==active);active=null;panel();draw()};
document.querySelector('#thSave').onclick=()=>alert('Další krok: export návrhu + upload na cloud + odkaz do objednávky.');

draw();
}
document.addEventListener('DOMContentLoaded',ready);
})();
