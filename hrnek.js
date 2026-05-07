(function(){
if(!location.pathname.includes('/test-hrnek-s-vlastnim-potiskem/'))return;

let elements=[],active=null,action=null,ox=0,oy=0,start={};

function ready(){
let h=document.querySelector('h1');
if(!h||document.querySelector('#thBtn'))return;

let btn=document.createElement('button');
btn.id='thBtn';
btn.textContent='Vytvořit vlastní návrh potisku VERZE LAYERS 1';
h.parentNode.insertBefore(btn,h.nextSibling);

document.body.insertAdjacentHTML('beforeend',`
<div id="thModal"><div id="thBox">
<div id="thTop"><h2>Konfigurátor celopotisku hrnku</h2><button id="thClose">Zavřít</button></div>
<div id="thGrid">
<canvas id="thCanvas" width="1100" height="650"></canvas>
<div id="thPanel">

<button id="thUpload" class="primary">Nahrát foto</button>
<input id="thFile" type="file" accept="image/*" style="display:none">

<button id="thAddText">Vložit text</button>

<div id="thTextTools">
<label>Text</label>
<input id="thTextInput" type="text" value="Tvůj text">

<label>Font písma</label>
<select id="thFontFamily">
<option value="Arial">Arial</option>
<option value="Georgia">Georgia</option>
<option value="Verdana">Verdana</option>
<option value="Trebuchet MS">Trebuchet MS</option>
<option value="Courier New">Courier New</option>
<option value="Impact">Impact</option>
</select>

<label>Barva písma</label>
<input id="thTextColor" type="color" value="#111111">

<label>Velikost textu</label>
<input id="thTextSize" type="range" min="20" max="180" value="70">

<label>Natočení textu</label>
<input id="thTextRotate" type="range" min="-180" max="180" value="0">
</div>

<label id="thSizeLabel">Velikost fotografie</label>
<input id="thSize" type="range" min="40" max="1000" value="320">

<div id="thLayersBox">
<h3>Vrstvy</h3>
<div id="thLayers"></div>
<div id="thLayerControls">
<button id="thLayerUp">Nahoru</button>
<button id="thLayerDown">Dolů</button>
</div>
</div>

<button id="thSave" class="save">Uložit návrh</button>

<p id="thHint">
Fotku/text posuneš tažením. Pravý dolní roh zvětšuje, levý dolní roh otáčí, pravý horní křížek maže.
</p>

</div></div></div></div>`);

const c=document.querySelector('#thCanvas'),ctx=c.getContext('2d');
const area={x:150,y:165,w:800,h:360},side=120;

function bg(){
ctx.clearRect(0,0,c.width,c.height);
ctx.fillStyle='#eee';
ctx.fillRect(0,0,c.width,c.height);

ctx.fillStyle='#d8d8d8';
ctx.fillRect(area.x-side,area.y,side,area.h);
ctx.fillRect(area.x+area.w,area.y,side,area.h);

drawHandle(area.x-side-38,area.y+area.h/2,true);
drawHandle(area.x+area.w+side+38,area.y+area.h/2,false);

ctx.fillStyle='#fff';
ctx.fillRect(area.x,area.y,area.w,area.h);

ctx.strokeStyle='#111';
ctx.lineWidth=3;
ctx.setLineDash([8,5]);
ctx.strokeRect(area.x,area.y,area.w,area.h);
ctx.setLineDash([]);

ctx.fillStyle='#777';
ctx.font='18px Arial';
ctx.textAlign='center';
ctx.fillText('Plocha potisku 20 × 9 cm',area.x+area.w/2,area.y-18);
}

function drawHandle(cx,cy,flip){
ctx.save();
ctx.translate(cx,cy);
if(flip)ctx.scale(-1,1);

ctx.strokeStyle='#bdbdbd';
ctx.lineWidth=30;
ctx.beginPath();
ctx.moveTo(0,-135);
ctx.bezierCurveTo(135,-125,135,125,0,135);
ctx.stroke();

ctx.strokeStyle='#eee';
ctx.lineWidth=18;
ctx.beginPath();
ctx.moveTo(0,-92);
ctx.bezierCurveTo(82,-82,82,82,0,92);
ctx.stroke();

ctx.restore();
}

function drawElement(el){
ctx.save();
ctx.translate(el.x,el.y);
ctx.rotate((el.r||0)*Math.PI/180);

if(el.type==='image'){
ctx.drawImage(el.img,-el.w/2,-el.h/2,el.w,el.h);
}else{
ctx.fillStyle=el.color||'#111';
ctx.font='bold '+el.size+'px '+(el.font||'Arial');
ctx.textAlign='center';
ctx.textBaseline='middle';
ctx.fillText(el.text,0,0);
}
ctx.restore();
}

function localPoint(p,el){
let a=-(el.r||0)*Math.PI/180;
let dx=p.x-el.x,dy=p.y-el.y;
return{
x:dx*Math.cos(a)-dy*Math.sin(a),
y:dx*Math.sin(a)+dy*Math.cos(a)
};
}

function bounds(el){
if(el.type==='image')return{w:el.w,h:el.h};
ctx.font='bold '+el.size+'px '+(el.font||'Arial');
return{w:Math.max(60,ctx.measureText(el.text).width+24),h:el.size+24};
}

function drawControls(el){
let b=bounds(el),w=b.w,h=b.h;
ctx.save();
ctx.translate(el.x,el.y);
ctx.rotate((el.r||0)*Math.PI/180);

ctx.strokeStyle='#06f';
ctx.lineWidth=3;
ctx.setLineDash([6,4]);
ctx.strokeRect(-w/2,-h/2,w,h);
ctx.setLineDash([]);

button(w/2,-h/2,'x');
button(w/2,h/2,'resize');
button(-w/2,h/2,'rotate');

ctx.restore();
}

function button(x,y,type){
ctx.fillStyle=type==='x'?'#d22':'#06f';
ctx.beginPath();
ctx.arc(x,y,18,0,Math.PI*2);
ctx.fill();

ctx.strokeStyle='#fff';
ctx.lineWidth=3;
ctx.beginPath();

if(type==='x'){
ctx.moveTo(x-7,y-7);ctx.lineTo(x+7,y+7);
ctx.moveTo(x+7,y-7);ctx.lineTo(x-7,y+7);
}

if(type==='resize'){
ctx.moveTo(x-8,y+7);ctx.lineTo(x+7,y-8);
ctx.moveTo(x-2,y+8);ctx.lineTo(x+8,y+8);ctx.lineTo(x+8,y-2);
}

if(type==='rotate'){
ctx.arc(x,y,8,0.8,5.2);
ctx.moveTo(x-8,y-2);ctx.lineTo(x-15,y-2);ctx.lineTo(x-12,y-9);
}

ctx.stroke();
}

function draw(){
bg();

ctx.save();
ctx.beginPath();
ctx.rect(area.x,area.y,area.w,area.h);
ctx.clip();
elements.forEach(drawElement);
ctx.restore();

if(active)drawControls(active);
}

function pos(e){
let r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;
return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)};
}

function controlHit(p,el){
let b=bounds(el),lp=localPoint(p,el);
let spots=[
{type:'delete',x:b.w/2,y:-b.h/2},
{type:'resize',x:b.w/2,y:b.h/2},
{type:'rotate',x:-b.w/2,y:b.h/2}
];

for(let s of spots){
if(Math.hypot(lp.x-s.x,lp.y-s.y)<=30)return s.type;
}
return null;
}

function objectHit(p){
for(let i=elements.length-1;i>=0;i--){
let el=elements[i],b=bounds(el),lp=localPoint(p,el);
if(lp.x>=-b.w/2&&lp.x<=b.w/2&&lp.y>=-b.h/2&&lp.y<=b.h/2)return el;
}
return null;
}

function layerName(el,index){
if(el.type==='image')return 'Fotka '+(index+1);
return 'Text: '+(el.text||'bez textu');
}

function renderLayers(){
let box=document.querySelector('#thLayers');
if(!box)return;

box.innerHTML='';

if(elements.length===0){
let empty=document.createElement('div');
empty.style.fontSize='13px';
empty.style.color='#777';
empty.textContent='Zatím nejsou vložené žádné vrstvy.';
box.appendChild(empty);
return;
}

elements.slice().reverse().forEach((el,revIndex)=>{
let realIndex=elements.length-1-revIndex;
let b=document.createElement('button');
b.className='thLayerItem'+(el===active?' active':'');
b.textContent=layerName(el,realIndex);
b.onclick=function(){
active=el;
sync();
draw();
};
box.appendChild(b);
});
}

function sync(){
renderLayers();

let tt=document.querySelector('#thTextTools');
let size=document.querySelector('#thSize');
let label=document.querySelector('#thSizeLabel');

if(!active){
tt.style.display='none';
label.style.display='block';
size.style.display='block';
return;
}

if(active.type==='text'){
tt.style.display='block';
label.style.display='none';
size.style.display='none';

document.querySelector('#thTextInput').value=active.text;
document.querySelector('#thFontFamily').value=active.font||'Arial';
document.querySelector('#thTextColor').value=active.color||'#111111';
document.querySelector('#thTextSize').value=active.size;
document.querySelector('#thTextRotate').value=active.r||0;
}else{
tt.style.display='none';
label.style.display='block';
size.style.display='block';
label.textContent='Velikost fotografie';
size.value=active.w;
}
}

c.onmousedown=c.ontouchstart=function(e){
e.preventDefault();
let p=pos(e);

if(active){
let ch=controlHit(p,active);

if(ch==='delete'){
elements=elements.filter(x=>x!==active);
active=null;
sync();
draw();
return;
}

if(ch){
action=ch;
start={p:p,x:active.x,y:active.y,w:active.w,h:active.h,size:active.size,r:active.r||0};
draw();
return;
}
}

active=objectHit(p);

if(active){
action='move';
ox=p.x-active.x;
oy=p.y-active.y;
}

sync();
draw();
};

c.onmousemove=c.ontouchmove=function(e){
if(!active||!action)return;
e.preventDefault();

let p=pos(e);

if(action==='move'){
active.x=p.x-ox;
active.y=p.y-oy;
}

if(action==='resize'){
let d0=Math.hypot(start.p.x-start.x,start.p.y-start.y);
let d1=Math.hypot(p.x-start.x,p.y-start.y);
let scale=Math.max(.15,d1/d0);

if(active.type==='image'){
active.w=Math.max(40,start.w*scale);
active.h=Math.max(20,start.h*scale);
}else{
active.size=Math.max(20,Math.min(180,start.size*scale));
}
}

if(action==='rotate'){
let a0=Math.atan2(start.p.y-start.y,start.p.x-start.x);
let a1=Math.atan2(p.y-active.y,p.x-active.x);
active.r=start.r+(a1-a0)*180/Math.PI;
}

sync();
draw();
};

c.onmouseup=c.onmouseleave=c.ontouchend=function(){
action=null;
};

document.querySelector('#thBtn').onclick=function(){
document.querySelector('#thModal').style.display='block';
sync();
draw();
};

document.querySelector('#thClose').onclick=function(){
document.querySelector('#thModal').style.display='none';
};

document.querySelector('#thUpload').onclick=function(){
document.querySelector('#thFile').click();
};

document.querySelector('#thFile').onchange=function(e){
let f=e.target.files[0];
if(!f)return;

let r=new FileReader();

r.onload=function(ev){
let img=new Image();

img.onload=function(){
let ratio=img.height/img.width;
let el={
type:'image',
img:img,
x:area.x+area.w/2,
y:area.y+area.h/2,
w:360,
h:360*ratio,
r:0
};

elements.push(el);
active=el;
sync();
draw();
};

img.src=ev.target.result;
};

r.readAsDataURL(f);
};

document.querySelector('#thAddText').onclick=function(){
let el={
type:'text',
text:'Tvůj text',
x:area.x+area.w/2,
y:area.y+area.h/2,
size:70,
font:'Arial',
color:'#111111',
r:0
};

elements.push(el);
active=el;
sync();
draw();
};

document.querySelector('#thTextInput').oninput=function(e){
if(active&&active.type==='text'){
active.text=e.target.value;
sync();
draw();
}
};

document.querySelector('#thFontFamily').onchange=function(e){
if(active&&active.type==='text'){
active.font=e.target.value;
sync();
draw();
}
};

document.querySelector('#thTextColor').oninput=function(e){
if(active&&active.type==='text'){
active.color=e.target.value;
sync();
draw();
}
};

document.querySelector('#thTextSize').oninput=function(e){
if(active&&active.type==='text'){
active.size=+e.target.value;
sync();
draw();
}
};

document.querySelector('#thTextRotate').oninput=function(e){
if(active&&active.type==='text'){
active.r=+e.target.value;
sync();
draw();
}
};

document.querySelector('#thSize').oninput=function(e){
if(active&&active.type==='image'){
let ratio=active.h/active.w;
active.w=+e.target.value;
active.h=active.w*ratio;
sync();
draw();
}
};

document.querySelector('#thLayerUp').onclick=function(){
if(!active)return;

let i=elements.indexOf(active);
if(i<elements.length-1){
let tmp=elements[i+1];
elements[i+1]=elements[i];
elements[i]=tmp;
sync();
draw();
}
};

document.querySelector('#thLayerDown').onclick=function(){
if(!active)return;

let i=elements.indexOf(active);
if(i>0){
let tmp=elements[i-1];
elements[i-1]=elements[i];
elements[i]=tmp;
sync();
draw();
}
};

document.querySelector('#thSave').onclick=function(){
alert('Další krok: export návrhu + upload na cloud + odkaz do objednávky.');
};

sync();
draw();
}

document.addEventListener('DOMContentLoaded',ready);
})();
