'use strict';
// Actual workflow groups are defined separately from the interactive viewer.
const { nodes, edges } = window.longTakeGraph;
const colors={image:'#8ccfa1',text:'#8fbbef',context:'#e1ae70',audio:'#d598d1'};
const canvas=document.getElementById('canvas'), viewport=document.getElementById('viewport');
const NS='http://www.w3.org/2000/svg', W=240;
const lookup=Object.fromEntries(nodes.map(n=>[n.id,n]));
const initial=nodes.map(n=>({x:n.x,y:n.y}));
function el(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
const height=n=>92+(n.ins.length+n.outs.length)*24;
function port(n,slot,out){return [n.x+((out!==!!n.reverse)?W:0),n.y+85+(slot+(out?n.ins.length:0))*24];}
const nodeElements=new Map(), wireElements=[];
let selected=null;
function select(n){selected=n.id;document.getElementById('detail-title').textContent=n.title;document.getElementById('detail-text').textContent=n.desc;document.getElementById('detail-nodes').textContent=`원본 노드: ${n.source}`;for(const[id,g]of nodeElements)g.classList.toggle('selected',id===selected);edges.forEach((e,i)=>{const related=e[0]===selected||e[2]===selected;wireElements[i].classList.toggle('related',related);wireElements[i].classList.toggle('dim',!related);});}
for(const [i,edge]of edges.entries()){const path=el('path',{class:'wire',stroke:colors[edge[4]],'data-edge':i});wireElements.push(path);document.getElementById('wires').append(path);}
for(const n of nodes){
 const g=el('g',{class:'node','data-node':n.id,tabindex:0,role:'button','aria-label':n.title});
 g.append(el('rect',{width:W,height:height(n),rx:8,class:'node-body'}),el('path',{d:`M8 0 H232 Q240 0 240 8 V35 H0 V8 Q0 0 8 0`,class:'node-header'}),el('text',{x:12,y:24,class:'node-title'},n.title),el('text',{x:12,y:57,class:'node-subtitle'},n.sub));
 for(const out of [false,true]){const labels=out?n.outs:n.ins;labels.forEach((label,i)=>{const right=out!==!!n.reverse;const y=85+(i+(out?n.ins.length:0))*24;const edge=edges.find(e=>out?e[0]===n.id&&e[1]===i:e[2]===n.id&&e[3]===i);g.append(el('circle',{cx:right?W:0,cy:y,r:5,fill:colors[edge?.[4]||'image']}),el('text',{x:right?W-12:12,y:y+4,'text-anchor':right?'end':'start',class:'port-label'},label));});}
 g.addEventListener('click',()=>select(n));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n);}});g.addEventListener('focus',()=>select(n));
 nodeElements.set(n.id,g);document.getElementById('nodes').append(g);
}
function layout(){
 for(const n of nodes)nodeElements.get(n.id).setAttribute('transform',`translate(${n.x} ${n.y})`);
 edges.forEach((e,i)=>{const a=port(lookup[e[0]],e[1],true),b=port(lookup[e[2]],e[3],false),s=lookup[e[0]].reverse?-1:1,t=lookup[e[2]].reverse?-1:1;const d=Math.max(65,Math.abs(b[0]-a[0])*.45);let path=`M${a} C${a[0]+s*d},${a[1]} ${b[0]-t*d},${b[1]} ${b}`;
 // Long bypasses travel above or below the main node lanes.
 if(e[0]==='clip1'&&e[2]==='join')path=`M${a} C${a[0]+70},${a[1]} ${a[0]+70},40 ${a[0]+130},40 L2180,40 Q2220,40 2220,100 L2220,${b[1]-60} Q2220,${b[1]} ${b}`;
 if(e[4]==='audio')path=`M${a} C${a[0]-55},${a[1]} ${a[0]-55},1080 ${a[0]-110},1080 L${b[0]+95},1080 Q${b[0]+45},1080 ${b[0]+45},${b[1]+55} Q${b[0]+45},${b[1]} ${b}`;
 wireElements[i].setAttribute('d',path);});
}
let state={x:0,y:0,scale:1}, currentView=innerWidth<600?'input':'all', initialized=false, userChanged=false;
function draw(){viewport.setAttribute('transform',`translate(${state.x} ${state.y}) scale(${state.scale})`);document.getElementById('zoom').value=`${Math.round(state.scale*100)}%`;canvas.style.backgroundSize=`${22*state.scale}px ${22*state.scale}px`;canvas.style.backgroundPosition=`${state.x}px ${state.y}px`;}
function fit(area='all'){const list=area==='all'?nodes:nodes.filter(n=>n.area===area);const box={left:Math.min(...list.map(n=>n.x))-35,top:Math.min(...list.map(n=>n.y))-45,right:Math.max(...list.map(n=>n.x+W))+35,bottom:Math.max(...list.map(n=>n.y+height(n)))+45};if(area==='all'){box.right+=140;box.bottom+=100;box.top=0;}const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;state.scale=Math.min((r.width-24)/(box.right-box.left),(r.height-24)/(box.bottom-box.top),1.3);state.x=r.width/2-(box.left+box.right)/2*state.scale;state.y=r.height/2-(box.top+box.bottom)/2*state.scale;currentView=area;initialized=true;userChanged=false;draw();}
function zoom(factor,x=canvas.clientWidth/2,y=canvas.clientHeight/2){const next=Math.min(2.5,Math.max(.1,state.scale*factor)),ratio=next/state.scale;state.x=x-(x-state.x)*ratio;state.y=y-(y-state.y)*ratio;state.scale=next;userChanged=true;draw();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>fit(b.dataset.view)));
document.getElementById('plus').onclick=()=>zoom(1.25);document.getElementById('minus').onclick=()=>zoom(.8);
document.getElementById('reset').onclick=()=>{nodes.forEach((n,i)=>Object.assign(n,initial[i]));layout();fit();};
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
const pointers=new Map();let draggingNode=null;
const mid=()=>{const p=[...pointers.values()];return{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};};
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const target=e.target.closest('[data-node]');draggingNode=pointers.size===0&&target?lookup[target.dataset.node]:null;if(draggingNode)select(draggingNode);canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const before=pointers.size===2?mid():null;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(before){const after=mid(),r=canvas.getBoundingClientRect();state.x+=after.x-before.x;state.y+=after.y-before.y;if(before.d>0)zoom(after.d/before.d,after.x-r.left,after.y-r.top);}else if(draggingNode){draggingNode.x+=(e.clientX-old.x)/state.scale;draggingNode.y+=(e.clientY-old.y)/state.scale;layout();}else{state.x+=e.clientX-old.x;state.y+=e.clientY-old.y;}userChanged=true;draw();});
function release(e){pointers.delete(e.pointerId);draggingNode=null;if(!pointers.size)canvas.classList.remove('dragging');}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
canvas.addEventListener('keydown',e=>{if(e.target!==canvas)return;if(e.key==='Home'||e.key==='0'){e.preventDefault();fit();}else if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?.8:1.25);}else{const moves={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]};if(moves[e.key]){e.preventDefault();state.x+=moves[e.key][0];state.y+=moves[e.key][1];userChanged=true;draw();}}});
new ResizeObserver(()=>{if(!initialized||!userChanged)fit(currentView);}).observe(canvas);layout();fit(currentView);
