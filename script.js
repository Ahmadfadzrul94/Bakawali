(() => {
"use strict";

const $ = id => document.getElementById(id);
const homeScreen=$("homeScreen"), gameScreen=$("gameScreen"), winScreen=$("winScreen");
const canvas=$("game"), ctx=canvas.getContext("2d");

const WORLD_W=4200, GROUND_Y=450;
let keys={}, running=false, raf=0;
let score=0,gems=0,lives=3,cameraX=0;
let player, platforms, stars, gemItems, enemies, flag;

function resetGame(){
  score=0; gems=0; lives=3; cameraX=0;
  player={x:80,y:390,w:34,h:50,vx:0,vy:0,onGround:false,spawnX:80,spawnY:390};
  platforms=[
    {x:0,y:GROUND_Y,w:700,h:90},{x:790,y:GROUND_Y,w:600,h:90},
    {x:1480,y:GROUND_Y,w:720,h:90},{x:2290,y:GROUND_Y,w:600,h:90},
    {x:2970,y:GROUND_Y,w:520,h:90},{x:3560,y:GROUND_Y,w:640,h:90},
    {x:420,y:350,w:150,h:18},{x:960,y:350,w:150,h:18},
    {x:1210,y:300,w:150,h:18},{x:1660,y:350,w:160,h:18},
    {x:1940,y:300,w:160,h:18},{x:2450,y:340,w:160,h:18},
    {x:2730,y:285,w:160,h:18},{x:3150,y:345,w:150,h:18},
    {x:3800,y:330,w:170,h:18}
  ];
  stars=[
    {x:260,y:390,taken:false},{x:520,y:315,taken:false},{x:850,y:390,taken:false},
    {x:1260,y:265,taken:false},{x:1600,y:390,taken:false},{x:1990,y:265,taken:false},
    {x:2500,y:305,taken:false},{x:2780,y:250,taken:false},{x:3210,y:310,taken:false},
    {x:3660,y:390,taken:false},{x:3880,y:295,taken:false}
  ];
  gemItems=[
    {x:350,y:390,taken:false},{x:1050,y:390,taken:false},{x:1750,y:390,taken:false},
    {x:2380,y:390,taken:false},{x:3100,y:390,taken:false},{x:3740,y:390,taken:false}
  ];
  enemies=[
    {x:610,y:418,w:32,h:32,vx:-.8,min:500,max:660,alive:true},
    {x:1110,y:418,w:32,h:32,vx:.8,min:900,max:1320,alive:true},
    {x:1840,y:418,w:32,h:32,vx:-.9,min:1530,max:2150,alive:true},
    {x:2540,y:308,w:32,h:32,vx:.8,min:2300,max:2860,alive:true},
    {x:3300,y:418,w:32,h:32,vx:-1,min:2990,max:3450,alive:true}
  ];
  flag={x:4030,y:370,w:30,h:80};
  updateHud();
}

function show(screen){
  [homeScreen,gameScreen,winScreen].forEach(s=>s.classList.add("hidden"));
  screen.classList.remove("hidden");
}
function updateHud(){
  $("score").textContent=score;
  $("gems").textContent=gems;
  $("lives").textContent=lives;
}
function start(){
  cancelAnimationFrame(raf);
  resetGame(); running=true; show(gameScreen); loop();
}
function endGame(){
  running=false; cancelAnimationFrame(raf);
  $("finalScore").textContent=score;
  $("finalGems").textContent=gems;
  show(winScreen);
}

function rects(a,b){
 return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}
function jump(){
 if(!running)return;
 if(player.onGround){player.vy=-12;player.onGround=false;}
}
function respawn(){
 lives--;
 if(lives<=0){ start(); return; }
 player.x=player.spawnX; player.y=player.spawnY; player.vx=0; player.vy=0; cameraX=Math.max(0,player.x-250);
 updateHud();
}
function update(){
 const left=keys.ArrowLeft||keys.a, right=keys.ArrowRight||keys.d;
 if(left)player.vx-=.65;
 if(right)player.vx+=.65;
 if(!left&&!right)player.vx*=.78;
 player.vx=Math.max(-5,Math.min(5,player.vx));
 player.vy+=.55;
 player.vy=Math.min(player.vy,14);
 const oldY=player.y;
 player.x+=player.vx;
 player.x=Math.max(0,Math.min(WORLD_W-player.w,player.x));
 player.y+=player.vy;
 player.onGround=false;

 for(const p of platforms){
   if(player.x+player.w>p.x && player.x<p.x+p.w &&
      oldY+player.h<=p.y+4 && player.y+player.h>=p.y && player.vy>=0){
     player.y=p.y-player.h; player.vy=0; player.onGround=true;
   }
 }
 if(player.y>canvas.height+120){respawn();return;}

 for(const s of stars){
   if(!s.taken && Math.hypot(player.x+player.w/2-s.x,player.y+player.h/2-s.y)<30){
     s.taken=true; score+=10; updateHud();
   }
 }
 for(const g of gemItems){
   if(!g.taken && Math.hypot(player.x+player.w/2-g.x,player.y+player.h/2-g.y)<28){
     g.taken=true; gems++; score+=25; updateHud();
   }
 }
 for(const e of enemies){
   if(!e.alive)continue;
   e.x+=e.vx;
   if(e.x<e.min||e.x>e.max)e.vx*=-1;
   if(rects(player,e)){
     if(player.vy>2 && player.y+player.h-e.y<20){
       e.alive=false; player.vy=-8; score+=50; updateHud();
     }else{respawn();return;}
   }
 }
 if(rects(player,flag)){endGame();return;}
 cameraX += (player.x-cameraX-300)*.10;
 cameraX=Math.max(0,Math.min(WORLD_W-canvas.width,cameraX));
}

function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 // sky
 const grad=ctx.createLinearGradient(0,0,0,canvas.height);
 grad.addColorStop(0,"#67c7e8");grad.addColorStop(1,"#d9f3c6");
 ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);

 ctx.save();ctx.translate(-cameraX,0);
 // distant hills
 ctx.fillStyle="#74b88a";
 for(let x=-100;x<WORLD_W;x+=300){
   ctx.beginPath();ctx.arc(x+150,420,180,Math.PI,0);ctx.fill();
 }
 // clouds
 ctx.fillStyle="#ffffffaa";
 for(let x=100;x<WORLD_W;x+=650){
   ctx.beginPath();ctx.arc(x,90,30,0,Math.PI*2);ctx.arc(x+35,82,42,0,Math.PI*2);ctx.arc(x+80,95,28,0,Math.PI*2);ctx.fill();
 }
 // platforms / ground
 for(const p of platforms){
   ctx.fillStyle=p.h>30?"#80552f":"#6b4427";
   ctx.fillRect(p.x,p.y,p.w,p.h);
   ctx.fillStyle="#39a84a";ctx.fillRect(p.x,p.y,p.w,10);
 }
 // stars
 for(const s of stars)if(!s.taken)drawStar(s.x,s.y,11);
 // gems
 for(const g of gemItems)if(!g.taken){
   ctx.fillStyle="#4ce5ff";ctx.beginPath();
   ctx.moveTo(g.x,g.y-13);ctx.lineTo(g.x+10,g.y);ctx.lineTo(g.x,g.y+13);ctx.lineTo(g.x-10,g.y);ctx.closePath();ctx.fill();
 }
 // enemies
 for(const e of enemies)if(e.alive){
   ctx.fillStyle="#d85b61";ctx.beginPath();ctx.arc(e.x+16,e.y+17,16,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(e.x+10,e.y+13,4,0,Math.PI*2);ctx.arc(e.x+22,e.y+13,4,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#222";ctx.beginPath();ctx.arc(e.x+10,e.y+13,2,0,Math.PI*2);ctx.arc(e.x+22,e.y+13,2,0,Math.PI*2);ctx.fill();
 }
 // flag
 ctx.fillStyle="#555";ctx.fillRect(flag.x,flag.y,6,80);
 ctx.fillStyle="#ffd83d";ctx.beginPath();ctx.moveTo(flag.x+6,flag.y);ctx.lineTo(flag.x+48,flag.y+16);ctx.lineTo(flag.x+6,flag.y+32);ctx.closePath();ctx.fill();

 // player
 ctx.fillStyle="#ffd83d";ctx.beginPath();ctx.arc(player.x+17,player.y+16,17,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#17220e";ctx.fillRect(player.x+7,player.y+35,20,15);
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(player.x+11,player.y+14,4,0,Math.PI*2);ctx.arc(player.x+23,player.y+14,4,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#222";ctx.beginPath();ctx.arc(player.x+12,player.y+14,2,0,Math.PI*2);ctx.arc(player.x+24,player.y+14,2,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawStar(x,y,r){
 ctx.save();ctx.translate(x,y);ctx.fillStyle="#ffd83d";ctx.beginPath();
 for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:r*.45;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}
 ctx.closePath();ctx.fill();ctx.restore();
}
function loop(){
 if(!running)return;
 update();draw();raf=requestAnimationFrame(loop);
}

window.addEventListener("keydown",e=>{
 if(["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key))e.preventDefault();
 keys[e.key]=true;
 if(e.key===" "||e.key==="ArrowUp"||e.key==="w")jump();
});
window.addEventListener("keyup",e=>keys[e.key]=false);

function hold(btn,key){
 const down=e=>{e.preventDefault();keys[key]=true};
 const up=e=>{e.preventDefault();keys[key]=false};
 btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);
 btn.addEventListener("pointercancel",up);btn.addEventListener("pointerleave",up);
}
hold($("leftBtn"),"ArrowLeft");hold($("rightBtn"),"ArrowRight");
$("jumpBtn").addEventListener("pointerdown",e=>{e.preventDefault();jump()});

$("startBtn").onclick=start;
$("againBtn").onclick=start;
$("homeBtn").onclick=()=>{running=false;cancelAnimationFrame(raf);show(homeScreen)};
$("homeWinBtn").onclick=()=>{show(homeScreen)};

resetGame();
})();
