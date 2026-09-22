'use strict';
const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');
const svgNS = 'http://www.w3.org/2000/svg';
const W = 1480, H = 690, NW = 232, NH = 156;
const colors = { image:'#90c99c', text:'#93b9e8', context:'#d6aa72', audio:'#ce91bf' };
const nodes = [
  {id:'image',x:32,y:105,n:'01',title:'참조 이미지',types:['LoadImage'],input:'',output:'이미지',color:'image'},
  {id:'prompt',x:324,y:105,n:'02',title:'VLM 프롬프트',types:['OllamaGenerateV2 × 2'],input:'참조 · 한국어 지시',output:'클립별 프롬프트',color:'text'},
  {id:'clip1',x:616,y:105,n:'03',title:'첫 클립 생성',types:['Ref2V · Sampler','VAE Decode'],input:'참조 · 프롬프트',output:'영상 · 오디오 · latent',color:'image'},
  {id:'motion',x:908,y:105,n:'04',title:'Motion Context',types:['MiniMaxH3MotionContext'],input:'이전 프레임 · latent',output:'다음 생성의 문맥',color:'context'},
  {id:'clip2',x:1200,y:105,n:'05',title:'다음 클립 생성',types:['Ref2V · Sampler','VAE Decode'],input:'프롬프트 · 문맥',output:'영상 · 오디오',color:'image'},
  {id:'trim',x:1200,y:432,n:'06',title:'중복 구간 제거',types:['Motion Context Trim'],input:'두 번째 클립',output:'겹친 앞부분 제거',color:'image',reverse:true},
  {id:'join',x:908,y:432,n:'07',title:'영상 · 오디오 연결',types:['ImageBatch · AudioConcat'],input:'첫 클립 + 정리한 클립',output:'연결된 영상 · 오디오',color:'image',reverse:true},
  {id:'upscale',x:616,y:432,n:'08',title:'업스케일',types:['RTX Upscaler / Refiner'],input:'연결된 프레임',output:'해상도 보정',color:'image',reverse:true},
  {id:'rife',x:324,y:432,n:'09',title:'프레임 보간',types:['RIFE · FrameInterpolate'],input:'업스케일된 프레임',output:'중간 프레임 추가',color:'image',reverse:true},
  {id:'save',x:32,y:432,n:'10',title:'영상 저장',types:['CreateVideo · SaveVideo'],input:'프레임 · 오디오',output:'최종 비디오',color:'image',reverse:true},
];
function el(tag,attrs={},text){const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
const index=Object.fromEntries(nodes.map(n=>[n.id,n]));
const port=(id,output)=>{const n=index[id];return [n.x+(output!==!!n.reverse?NW:0),n.y+(output?126:88)];};
function wire(from,to,color,route){const a=port(from,true),b=port(to,false);let d;if(route)d=route(a,b);else{const sign=index[from].reverse?-1:1;d=`M${a} C${a[0]+sign*45},${a[1]} ${b[0]-sign*45},${b[1]} ${b}`;}document.getElementById('wires').append(el('path',{d,stroke:colors[color],class:'wire'}));}
wire('image','prompt','image');wire('prompt','clip1','text');wire('clip1','motion','context');wire('motion','clip2','context');
wire('clip2','trim','image',(a,b)=>`M${a} C1480,${a[1]} 1480,${b[1]} ${b}`);
wire('trim','join','image');wire('join','upscale','image');wire('upscale','rife','image');wire('rife','save','image');
wire('prompt','clip2','text',(a,b)=>`M${a} C${a[0]+28},${a[1]} ${a[0]+28},42 ${a[0]+52},42 L${b[0]-52},42 Q${b[0]-22},42 ${b[0]-22},74 L${b[0]-22},${b[1]-22} Q${b[0]-22},${b[1]} ${b}`);
wire('image','clip1','image',(a,b)=>`M${a} C${a[0]+24},${a[1]} ${a[0]+24},312 ${a[0]+48},312 L${b[0]-42},312 Q${b[0]-20},312 ${b[0]-20},288 L${b[0]-20},${b[1]+22} Q${b[0]-20},${b[1]} ${b}`);
wire('clip1','join','image',(a,b)=>`M${a} C${a[0]+24},${a[1]} ${a[0]+24},344 ${a[0]+48},344 L${b[0]+28},344 Q${b[0]+50},344 ${b[0]+50},368 L${b[0]+50},${b[1]-24} Q${b[0]+50},${b[1]} ${b}`);
wire('join','save','audio',(a,b)=>`M${a} C${a[0]-25},${a[1]} ${a[0]-25},640 ${a[0]-48},640 L${b[0]+45},640 Q${b[0]+20},640 ${b[0]+20},614 L${b[0]+20},${b[1]+22} Q${b[0]+20},${b[1]} ${b}`);
for(const n of nodes){const g=el('g',{class:'node'+(n.id==='motion'?' context':''),'data-node':n.id,transform:`translate(${n.x} ${n.y})`});g.append(el('rect',{width:NW,height:NH,rx:9,class:'node-body'}),el('path',{d:`M9 0 H${NW-9} Q${NW} 0 ${NW} 9 V38 H0 V9 Q0 0 9 0`,class:'node-header'}),el('text',{x:13,y:25,class:'node-title'},n.title),el('text',{x:NW-29,y:25,class:'node-number'},n.n));n.types.forEach((t,i)=>g.append(el('text',{x:13,y:57+i*15,class:'node-type'},t)));for(const output of [false,true]){const label=output?n.output:n.input;if(!label)continue;const right=output!==!!n.reverse;const y=output?126:88;g.append(el('circle',{cx:right?NW:0,cy:y,r:5,fill:colors[n.color],stroke:'#17181a','stroke-width':2}),el('text',{x:right?NW-13:13,y:y+4,'text-anchor':right?'end':'start',class:'port-label'},label));}document.getElementById('nodes').append(g);}
document.getElementById('nodes').append(el('text',{x:32,y:28,class:'lane-label'},'생성  →'),el('text',{x:32,y:405,class:'lane-label'},'←  연결 · 후처리'));
let state={x:0,y:0,scale:1}, initialized=false, userChanged=false;
function draw(){viewport.setAttribute('transform',`translate(${state.x} ${state.y}) scale(${state.scale})`);document.getElementById('zoom').value=`${Math.round(state.scale*100)}%`;canvas.style.backgroundSize=`${22*state.scale}px ${22*state.scale}px`;canvas.style.backgroundPosition=`${state.x}px ${state.y}px`;}
function fit(){const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;state.scale=Math.min((width-24)/W,(height-24)/H,1.25);state.x=(width-W*state.scale)/2;state.y=(height-H*state.scale)/2;initialized=true;userChanged=false;draw();}
function zoom(factor,cx=canvas.clientWidth/2,cy=canvas.clientHeight/2){const next=Math.min(2.5,Math.max(.12,state.scale*factor));const ratio=next/state.scale;state.x=cx-(cx-state.x)*ratio;state.y=cy-(cy-state.y)*ratio;state.scale=next;userChanged=true;draw();}
document.getElementById('fit').onclick=fit;document.getElementById('plus').onclick=()=>zoom(1.25);document.getElementById('minus').onclick=()=>zoom(.8);
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
const pointers=new Map();
const midpoint=()=>{const p=[...pointers.values()];return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};};
canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const before=pointers.size===2?midpoint():null;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(before){const after=midpoint(),r=canvas.getBoundingClientRect();state.x+=after.x-before.x;state.y+=after.y-before.y;if(before.d>0)zoom(after.d/before.d,after.x-r.left,after.y-r.top);}else{state.x+=e.clientX-old.x;state.y+=e.clientY-old.y;}userChanged=true;draw();});
function release(e){pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('keydown',e=>{if(e.key==='Home'||e.key==='0'){e.preventDefault();fit();return;}if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?.8:1.25);return;}const moves={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]};if(moves[e.key]){e.preventDefault();state.x+=moves[e.key][0];state.y+=moves[e.key][1];userChanged=true;draw();}});
new ResizeObserver(()=>{if(!initialized||!userChanged)fit();}).observe(canvas);fit();
