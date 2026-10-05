'use strict';
// Public functional groups only; no private workflow JSON or widget values.
const nodes = [
 {id:'image',x:40,y:100,title:'참조 이미지',sub:'Image input',ins:[],outs:['이미지'],area:'input',desc:'같은 참조 이미지를 두 VLM에 전달합니다. 영상 생성기의 참조 조건은 생성 가이드에서 따로 구성합니다.'},
 {id:'prompt1',x:40,y:330,title:'Prompt Selector · 1',sub:'Clip 01 direction',ins:[],outs:['지시 텍스트'],area:'input',desc:'첫 클립의 동작과 카메라 지시를 준비합니다. 저장한 문구를 선택하거나 현재 내용을 편집합니다.'},
 {id:'prompt2',x:40,y:570,title:'Prompt Selector · 2',sub:'Clip 02 direction',ins:[],outs:['지시 텍스트'],area:'input',desc:'다음 클립에서 이어질 연출을 준비합니다. 목록은 공유하고 선택과 편집은 각자 유지합니다.'},
 {id:'vlm1',x:340,y:160,title:'VLM · 첫 클립',sub:'Ollama / image + text',ins:['이미지','지시'],outs:['프롬프트'],area:'input',desc:'참조 이미지와 첫 클립의 지시로 프롬프트를 구성합니다. 결과 텍스트를 확인한 뒤 생성에 사용합니다.'},
 {id:'vlm2',x:340,y:490,title:'VLM · 다음 클립',sub:'Ollama / image + text',ins:['이미지','지시'],outs:['프롬프트'],area:'input',desc:'같은 이미지와 두 번째 지시로 별도 프롬프트를 구성합니다. 첫 VLM과 연결·옵션을 공유합니다.'},
 {id:'guide1',x:640,y:160,title:'첫 클립 설정',sub:'Director · LoRA · Seed',ins:['프롬프트'],outs:['생성 조건','해상도'],area:'generate',desc:'첫 클립의 가이드·LoRA·시드를 정합니다. 공통 모델·샘플러 설정을 사용하고 해상도는 다음 클립에 전달합니다.'},
 {id:'guide2',x:640,y:490,title:'다음 클립 설정',sub:'Director · LoRA · Seed',ins:['프롬프트','해상도'],outs:['생성 조건'],area:'generate',desc:'다음 클립의 지시·LoRA·시드를 따로 설정합니다. 모델 자원과 샘플링 설정은 함께 관리합니다.'},
 {id:'clip1',x:940,y:160,title:'첫 클립 생성',sub:'Sampler · Video / Audio decode',ins:['생성 조건'],outs:['프레임·오디오','latent'],area:'generate',desc:'첫 클립의 영상과 오디오를 만듭니다. 프레임은 별도 저장으로, latent는 움직임 문맥으로 전달합니다.'},
 {id:'save1',x:1240,y:100,title:'첫 클립 저장',sub:'Save + frame passthrough',ins:['프레임·오디오'],outs:['프레임'],area:'generate',desc:'첫 클립을 개별 파일로 보관하고, 저장 노드를 통과한 프레임을 다음 생성의 문맥 입력으로 전달합니다.'},
 {id:'context',x:1240,y:420,title:'움직임 문맥',sub:'Motion Context',ins:['이전 프레임','이전 latent','다음 생성 조건'],outs:['문맥 조건','제거 프레임 수'],area:'generate',desc:'이전 프레임과 latent를 다음 생성 조건에 반영합니다. 겹치는 구간을 정리할 프레임 수도 함께 전달합니다.'},
 {id:'clip2',x:1540,y:420,title:'다음 클립 생성',sub:'Sampler · Video / Audio decode',ins:['생성 조건','문맥 조건'],outs:['프레임·오디오'],area:'generate',desc:'두 번째 클립의 초기 latent·시드와 문맥이 반영된 조건으로 영상과 오디오를 생성합니다.'},
 {id:'trim',x:1840,y:420,title:'중복 구간 제거',sub:'Motion Context Trim',ins:['프레임·오디오','제거 프레임 수'],outs:['정리된 클립'],area:'finish',desc:'문맥으로 겹친 두 번째 클립의 앞부분을 영상과 오디오에서 정리합니다.'},
 {id:'join',x:1840,y:800,title:'영상 · 오디오 연결',sub:'ImageBatch / AudioConcat',ins:['첫 클립','정리된 클립'],outs:['영상','오디오'],area:'finish',reverse:true,desc:'첫 클립과 정리한 두 번째 클립을 각각 영상·오디오로 연결합니다. 오디오는 바로 최종 저장으로 보냅니다.'},
 {id:'interpolate',x:1540,y:800,title:'프레임 보간',sub:'FrameInterpolate',ins:['영상'],outs:['보간 프레임'],area:'finish',reverse:true,desc:'연결된 영상에 중간 프레임을 추가합니다. 보간 배수에 맞춰 출력 FPS도 조정합니다.'},
 {id:'enhance',x:1240,y:800,title:'크기 · 화질 처리',sub:'Resize / Upscale / RTX',ins:['보간 프레임'],outs:['최종 프레임'],area:'finish',reverse:true,desc:'RTX 화질 처리를 적용합니다. 리사이즈·모델 업스케일·워터마크는 필요한 경우에 켭니다.'},
 {id:'save',x:940,y:800,title:'최종 영상 저장',sub:'Video + audio + FPS',ins:['최종 프레임','오디오'],outs:[],area:'finish',reverse:true,desc:'후처리한 영상과 연결된 오디오를 출력 FPS에 맞춰 저장하고 재생 속도와 음성 동기를 확인합니다.'}
];
// [source node, output slot, target node, input slot, data kind]
const edges = [
 ['image',0,'vlm1',0,'image'],['image',0,'vlm2',0,'image'],['prompt1',0,'vlm1',1,'text'],['prompt2',0,'vlm2',1,'text'],
 ['vlm1',0,'guide1',0,'text'],['vlm2',0,'guide2',0,'text'],['guide1',1,'guide2',1,'context'],
 ['guide1',0,'clip1',0,'context'],['clip1',0,'save1',0,'image'],['save1',0,'context',0,'image'],['clip1',1,'context',1,'context'],
 ['guide2',0,'context',2,'context'],['guide2',0,'clip2',0,'context'],['context',0,'clip2',1,'context'],
 ['context',1,'trim',1,'context'],['clip2',0,'trim',0,'image'],['trim',0,'join',1,'image'],['clip1',0,'join',0,'image'],
 ['join',0,'interpolate',0,'image'],['interpolate',0,'enhance',0,'image'],['enhance',0,'save',0,'image'],['join',1,'save',1,'audio']
];
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
function select(n){selected=n.id;document.getElementById('detail-title').textContent=n.title;document.getElementById('detail-text').textContent=n.desc;for(const[id,g]of nodeElements)g.classList.toggle('selected',id===selected);edges.forEach((e,i)=>{const related=e[0]===selected||e[2]===selected;wireElements[i].classList.toggle('related',related);wireElements[i].classList.toggle('dim',!related);});}
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
