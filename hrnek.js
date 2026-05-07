(function(){
if(!location.pathname.includes('/test-hrnek-s-vlastnim-potiskem/'))return;

let elements=[],active=null,action=null,ox=0,oy=0,start={},dragLayerId=null,history=[];
const SNAP=10;

function uid(){return 'el_'+Math.random().toString(36).slice(2,10)}
function cloneState(){return elements.map(e=>{let c={...e}; if(e.img)c.img=e.img; return c})}
function saveHistory(){history.push(cloneState()); if(history.length>30)history.shift()}
function restoreHistory(){if(!history.length)return; elements=history.pop(); active=null; sync(); draw()}

function ready(){
let h=document.querySelector('h1');
if(!h||document.querySelector('#thBtn'))return;

let btn=document.createElement('button');
btn.id='thBtn';
btn.textContent='Vytvořit vlastní návrh potisku VERZE LAYERS 3';
h.parentNode.insertBefore(btn,h.nextSibling);

document.body.insertAdjacentHTML('beforeend',`
<div id="thModal"><div id="thBox"><div id="thGrid">
<div id="thPanel">
  <div id="thActionRow">
    <button id="thAddText" class="thTopBtn">Přidat text</button>
    <button id="thUpload" class="thTopBtn">Přidat obrázek</button>
  </div>

  <div id="thEmojiRow">
    <button class="thEmojiBtn" data-emoji="❤️">❤️</button>
    <button class="thEmojiBtn" data-emoji="😊">😊</button>
    <button class="thEmojiBtn" data-emoji="⭐">⭐</button>
    <button class="thEmojiBtn" data-emoji="🔥">🔥</button>
  </div>

  <input id="thFile" type="file" accept="image/*" style="display:none">

  <div id="thTextTools">
    <small>Vlastnosti textu / smajlíku</small>
    <label>Text</label><input id="thTextInput" type="text" value="Text 1">
    <label>Velikost</label><input id="thTextSize" type="range" min="20" max="220" value="70">
    <label>Barva textu</label><input id="thTextColor" type="color" value="#111111">
    <label>Font</label>
    <select id="thFontFamily">
      <option value="Arial">Arial</option>
      <option value="Poppins">Poppins</option>
      <option value="Montserrat">Montserrat</option>
      <option value="Fredoka">Fredoka</option>
      <option value="Comfortaa">Comfortaa</option>
      <option value="Pacifico">Pacifico</option>
      <option value="Dancing Script">Dancing Script</option>
      <option value="Lobster">Lobster</option>
      <option value="Bebas Neue">Bebas Neue</option>
      <option value="Playfair Display">Playfair Display</option>
      <option value="Amatic SC">Amatic SC</option>
      <option value="Impact">Impact</option>
    </select>
    <label>Natočení</label><input id="thTextRotate" type="range" min="-180" max="180" value="0">
  </div>

  <div id="thPhotoTools">
    <small>Vlastnosti obrázku</small>
    <label>Velikost obrázku</label><input id="thPhotoSize" type="range" min="40" max="1000" value="360">
    <label>Natočení obrázku</label><input id="thPhotoRotate" type="range" min="-180" max="180" value="0">
  </div>

  <div id="thLayersBox"><h3>Vrstvy</h3><div id="thLayers"></div></div>
  <p id="thHint">Při posunu se prvky přichytávají na střed a okraje potiskové plochy. Vrstvy lze přetahovat.</p>
</div>

<div id="thCanvasWrap">
  <button id="thClose">×</button>
  <canvas id="thCanvas" width="1100" height="650"></canvas>
  <button id="thReset">Reset</button>
  <button id="thUndo">Zpět</button>
  <button id="thSave">Uložit návrh</button>
</div>
</div></div></div>`);

const c=document.querySelector('#thCanvas'),ctx=c.getContext('2d');
const area={x:150,y:165,w:800,h:360},side=120;
let guides=[];

function bg(){
ctx.clearRect(0,0,c.width,c.height);
ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
ctx.fillStyle='#f4f6fa';ctx.fillRect(area.x-side,area.y,side,area.h);ctx.fillRect(area.x+area.w,area.y,side,area.h);
drawHandle(area.x-side-38,area.y+area.h/2,true);drawHandle(area.x+area.w+side+38,area.y+area.h/2,false);
ctx.fillStyle='#fff';ctx.fillRect(area.x,area.y,area.w,area.h);
ctx.strokeStyle='#202020';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.strokeRect(area.x,area.y,area.w,area.h);ctx.setLineDash([]);
ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;ctx.beginPath();
ctx.moveTo(area.x+50,area.y+30);ctx.bezierCurveTo(area.x+55,area.y+130,area.x+90,area.y+210,area.x+70,area.y+300);
ctx.moveTo(area.x+area.w-50,area.y+30);ctx.bezierCurveTo(area.x+area.w-55,area.y+130,area.x+area.w-90,area.y+210,area.x+area.w-70,area.y+300);ctx.stroke();
ctx.fillStyle='#758096';ctx.font='18px Arial';ctx.textAlign='center';ctx.fillText('Plocha potisku 20 × 9 cm',area.x+area.w/2,area.y-18);
}

function drawHandle(cx,cy,flip){
ctx.save();ctx.translate(cx,cy);if(flip)ctx.scale(-1,1);
ctx.strokeStyle='#d2d8e2';ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(0,-135);ctx.bezierCurveTo(135,-125,135,125,0,135);ctx.stroke();
ctx.strokeStyle='#fff';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(0,-92);ctx.bezierCurveTo(82,-82,82,82,0,92);ctx.stroke();
ctx.restore();
}

function drawElement(el){
ctx.save();ctx.translate(el.x,el.y);ctx.rotate((el.r||0)*Math.PI/180);
if(el.type==='image'){ctx.drawImage(el.img,-el.w/2,-el.h/2,el.w,el.h)}
else{
ctx.fillStyle=el.color||'#111';
ctx.font='bold '+el.size+'px '+(el.font||'Arial');
ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(el.text,0,0);
}
ctx.restore();
}

function localPoint(p,el){
let a=-(el.r||0)*Math.PI/180,dx=p.x-el.x,dy=p.y-el.y;
return{x:dx*Math.cos(a)-dy*Math.sin(a),y:dx*Math.sin(a)+dy*Math.cos(a)};
}

function bounds(el){
if(el.type==='image')return{w:el.w,h:el.h};
ctx.font='bold '+el.size+'px '+(el.font||'Arial');
return{w:Math.max(70,ctx.measureText(el.text).width+24),h:el.size+24};
}

function drawGuides(){
if(!guides.length)return;
ctx.save();ctx.strokeStyle='#ff3b30';ctx.lineWidth=2;ctx.setLineDash([6,6]);
guides.forEach(g=>{
ctx.beginPath();
if(g.type==='v'){ctx.moveTo(g.x,area.y-20);ctx.lineTo(g.x,area.y+area.h+20)}
else{ctx.moveTo(area.x-20,g.y);ctx.lineTo(area.x+area.w+20,g.y)}
ctx.stroke();
});
ctx.restore();
}

function drawControls(el){
let b=bounds(el),w=b.w,h=b.h;
ctx.save();ctx.translate(el.x,el.y);ctx.rotate((el.r||0)*Math.PI/180);
ctx.strokeStyle=el.locked?'#9aa8ba':'#2488ff';ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.strokeRect(-w/2,-h/2,w,h);ctx.setLineDash([]);
if(!el.locked){button(w/2,-h/2,'x');button(w/2,h/2,'resize');button(-w/2,h/2,'rotate')}
else{ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(w/2,-h/2,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7d8ca3';ctx.font='20px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🔒',w/2,-h/2+1)}
ctx.restore();
}

function button(x,y,type){
ctx.fillStyle=type==='x'?'#ff4b4b':(type==='rotate'?'#ff9800':'#2488ff');
ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();
if(type==='x'){ctx.moveTo(x-7,y-7);ctx.lineTo(x+7,y+7);ctx.moveTo(x+7,y-7);ctx.lineTo(x-7,y+7)}
if(type==='resize'){ctx.moveTo(x-8,y+7);ctx.lineTo(x+7,y-8);ctx.moveTo(x-2,y+8);ctx.lineTo(x+8,y+8);ctx.lineTo(x+8,y-2)}
if(type==='rotate'){ctx.arc(x,y,8,0.8,5.2);ctx.moveTo(x-8,y-2);ctx.lineTo(x-15,y-2);ctx.lineTo(x-12,y-9)}
ctx.stroke();
}

function draw(){
bg();
ctx.save();ctx.beginPath();ctx.rect(area.x,area.y,area.w,area.h);ctx.clip();elements.forEach(drawElement);ctx.restore();
drawGuides();
if(active)drawControls(active);
}

function pos(e){let r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)}}

function snapMove(el){
guides=[];
let b=bounds(el),targetsX=[area.x,area.x+area.w/2,area.x+area.w],targetsY=[area.y,area.y+area.h/2,area.y+area.h];
let pointsX=[{v:el.x-b.w/2,o:b.w/2},{v:el.x,o:0},{v:el.x+b.w/2,o:-b.w/2}];
let pointsY=[{v:el.y-b.h/2,o:b.h/2},{v:el.y,o:0},{v:el.y+b.h/2,o:-b.h/2}];

for(let t of targetsX){for(let p of pointsX){if(Math.abs(p.v-t)<SNAP){el.x=t+p.o;guides.push({type:'v',x:t});break}}}
for(let t of targetsY){for(let p of pointsY){if(Math.abs(p.v-t)<SNAP){el.y=t+p.o;guides.push({type:'h',y:t});break}}}
}

function controlHit(p,el){
if(el.locked)return null;
let b=bounds(el),lp=localPoint(p,el),spots=[{type:'delete',x:b.w/2,y:-b.h/2},{type:'resize',x:b.w/2,y:b.h/2},{type:'rotate',x:-b.w/2,y:b.h/2}];
for(let s of spots){if(Math.hypot(lp.x-s.x,lp.y-s.y)<=30)return s.type}
return null;
}

function objectHit(p){
for(let i=elements.length-1;i>=0;i--){let el=elements[i],b=bounds(el),lp=localPoint(p,el);if(lp.x>=-b.w/2&&lp.x<=b.w/2&&lp.y>=-b.h/2&&lp.y<=b.h/2)return el}
return null;
}

function layerName(el,index){if(el.name)return el.name;if(el.type==='image')return 'Obrázek '+(index+1);return el.text||'Text '+(index+1)}

function renderLayers(){
let box=document.querySelector('#thLayers'); if(!box)return; box.innerHTML='';
if(elements.length===0){let empty=document.createElement('div');empty.className='thEmptyLayers';empty.textContent='Zatím nejsou vložené žádné vrstvy.';box.appendChild(empty);return}
elements.slice().reverse().forEach((el,revIndex)=>{
let realIndex=elements.length-1-revIndex,item=document.createElement('div');
item.className='thLayerItem'+(el===active?' active':'');item.draggable=true;item.dataset.id=el.id;
item.innerHTML='<span class="thDrag">☷</span><span class="thLayerName"></span><button class="thIconBtn" type="button"></button><button class="thIconBtn" type="button">×</button>';
item.querySelector('.thLayerName').textContent=layerName(el,realIndex);
let btns=item.querySelectorAll('button');btns[0].textContent=el.locked?'🔒':'🔓';
item.onclick=()=>{active=el;sync();draw()};
btns[0].onclick=ev=>{ev.stopPropagation();saveHistory();el.locked=!el.locked;active=el;sync();draw()};
btns[1].onclick=ev=>{ev.stopPropagation();saveHistory();elements=elements.filter(x=>x!==el);if(active===el)active=null;sync();draw()};
item.ondragstart=ev=>{dragLayerId=el.id;item.classList.add('dragging');ev.dataTransfer.effectAllowed='move'};
item.ondragend=()=>{dragLayerId=null;item.classList.remove('dragging')};
item.ondragover=ev=>ev.preventDefault();
item.ondrop=ev=>{ev.preventDefault();if(!dragLayerId||dragLayerId===el.id)return;saveHistory();let from=elements.findIndex(x=>x.id===dragLayerId),to=elements.findIndex(x=>x.id===el.id);let moved=elements.splice(from,1)[0];elements.splice(to,0,moved);sync();draw()};
box.appendChild(item);
});
}

function sync(){
renderLayers();
let textTools=document.querySelector('#thTextTools'),photoTools=document.querySelector('#thPhotoTools');
if(!active){textTools.style.display='none';photoTools.style.display='none';return}
if(active.type==='text'){
textTools.style.display='block';photoTools.style.display='none';
document.querySelector('#thTextInput').value=active.text;document.querySelector('#thFontFamily').value=active.font||'Arial';document.querySelector('#thTextColor').value=active.color||'#111111';document.querySelector('#thTextSize').value=active.size;document.querySelector('#thTextRotate').value=active.r||0;
}else{
textTools.style.display='none';photoTools.style.display='block';
document.querySelector('#thPhotoSize').value=active.w;document.querySelector('#thPhotoRotate').value=active.r||0;
}
}

c.onmousedown=c.ontouchstart=function(e){
e.preventDefault();let p=pos(e);
if(active){let ch=controlHit(p,active);if(ch==='delete'){saveHistory();elements=elements.filter(x=>x!==active);active=null;sync();draw();return}
if(ch){saveHistory();action=ch;start={p:p,x:active.x,y:active.y,w:active.w,h:active.h,size:active.size,r:active.r||0};draw();return}}
active=objectHit(p);
if(active&&!active.locked){saveHistory();action='move';ox=p.x-active.x;oy=p.y-active.y}else action=null;
sync();draw();
};

c.onmousemove=c.ontouchmove=function(e){
if(!active||!action||active.locked)return;e.preventDefault();let p=pos(e);
if(action==='move'){active.x=p.x-ox;active.y=p.y-oy;snapMove(active)}
if(action==='resize'){let d0=Math.hypot(start.p.x-start.x,start.p.y-start.y),d1=Math.hypot(p.x-start.x,p.y-start.y),scale=Math.max(.15,d1/d0);if(active.type==='image'){active.w=Math.max(40,start.w*scale);active.h=Math.max(20,start.h*scale)}else active.size=Math.max(20,Math.min(220,start.size*scale))}
if(action==='rotate'){let a0=Math.atan2(start.p.y-start.y,start.p.x-start.x),a1=Math.atan2(p.y-active.y,p.x-active.x);active.r=start.r+(a1-a0)*180/Math.PI}
sync();draw();
};

c.onmouseup=c.onmouseleave=c.ontouchend=function(){action=null;guides=[];draw()};

document.querySelector('#thBtn').onclick=()=>{document.querySelector('#thModal').style.display='block';sync();draw()};
document.querySelector('#thClose').onclick=()=>document.querySelector('#thModal').style.display='none';
document.querySelector('#thUpload').onclick=()=>document.querySelector('#thFile').click();

document.querySelector('#thFile').onchange=function(e){
let f=e.target.files[0];if(!f)return;saveHistory();
let r=new FileReader();
r.onload=function(ev){let img=new Image();img.onload=function(){let ratio=img.height/img.width;let el={id:uid(),type:'image',name:'Obrázek '+(elements.filter(x=>x.type==='image').length+1),img:img,x:area.x+area.w/2,y:area.y+area.h/2,w:360,h:360*ratio,r:0,locked:false};elements.push(el);active=el;sync();draw()};img.src=ev.target.result};
r.readAsDataURL(f);
};

function addText(value,isEmoji){
saveHistory();
let count=elements.filter(x=>x.type==='text').length+1;
let el={id:uid(),type:'text',name:isEmoji?'Smajlík '+count:'Text '+count,text:value,x:area.x+area.w/2,y:area.y+area.h/2,size:isEmoji?90:70,font:isEmoji?'Arial':'Poppins',color:'#111111',r:0,locked:false};
elements.push(el);active=el;sync();draw();
}

document.querySelector('#thAddText').onclick=()=>addText('Text '+(elements.filter(x=>x.type==='text').length+1),false);
document.querySelectorAll('.thEmojiBtn').forEach(b=>b.onclick=()=>addText(b.dataset.emoji,true));

document.querySelector('#thTextInput').oninput=e=>{if(active&&active.type==='text'&&!active.locked){active.text=e.target.value;active.name=e.target.value||'Text';sync();draw()}};
document.querySelector('#thFontFamily').onchange=e=>{if(active&&active.type==='text'&&!active.locked){saveHistory();active.font=e.target.value;sync();draw()}};
document.querySelector('#thTextColor').oninput=e=>{if(active&&active.type==='text'&&!active.locked){active.color=e.target.value;sync();draw()}};
document.querySelector('#thTextSize').oninput=e=>{if(active&&active.type==='text'&&!active.locked){active.size=+e.target.value;sync();draw()}};
document.querySelector('#thTextRotate').oninput=e=>{if(active&&active.type==='text'&&!active.locked){active.r=+e.target.value;sync();draw()}};
document.querySelector('#thPhotoSize').oninput=e=>{if(active&&active.type==='image'&&!active.locked){let ratio=active.h/active.w;active.w=+e.target.value;active.h=active.w*ratio;sync();draw()}};
document.querySelector('#thPhotoRotate').oninput=e=>{if(active&&active.type==='image'&&!active.locked){active.r=+e.target.value;sync();draw()}};

document.querySelector('#thReset').onclick=function(){if(!confirm('Opravdu smazat celý návrh?'))return;saveHistory();elements=[];active=null;sync();draw()};
document.querySelector('#thUndo').onclick=restoreHistory;
document.querySelector('#thSave').onclick=()=>alert('Další krok: export návrhu + upload na cloud + odkaz do objednávky.');

sync();draw();
}
document.addEventListener('DOMContentLoaded',ready);
})();
