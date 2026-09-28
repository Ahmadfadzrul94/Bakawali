const pages=[...document.querySelectorAll(".page")];
const toast=document.getElementById("toast");
let stars=Number(localStorage.getItem("bakawaliStars")||0);
let badges=Number(localStorage.getItem("bakawaliBadges")||0);
const learned=new Set(JSON.parse(localStorage.getItem("bakawaliLearned")||"[]"));

function renderStats(){
  document.querySelectorAll("#stars").forEach(x=>x.textContent=stars);
  document.querySelectorAll("#badges").forEach(x=>x.textContent=badges);
  const level=Math.floor(stars/3)+1;
  document.querySelectorAll("#level,#level2").forEach(x=>x.textContent=level);
}
function showPage(id){
  pages.forEach(p=>p.classList.toggle("active",p.id===id));
  history.replaceState(null,"","#"+id);
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));

function earnStar(msg="⭐ Quest complete!"){
  stars++; localStorage.setItem("bakawaliStars",stars);
  if(stars%3===0){badges++;localStorage.setItem("bakawaliBadges",badges)}
  renderStats(); toast.textContent=msg;toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),1800);
}
function speak(text){
  if("speechSynthesis" in window){
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.rate=.82;u.pitch=1.05;speechSynthesis.speak(u);
  }
}
function learn(key,text,button){
  speak(text);
  if(!learned.has(key)){
    learned.add(key);localStorage.setItem("bakawaliLearned",JSON.stringify([...learned]));
    button.classList.add("done"); earnStar("⭐ New lesson learned!");
  }else{
    button.classList.add("done");
  }
  updateProgress();
}
function updateProgress(){
  const letters=[...Array(26)].map((_,i)=>String.fromCharCode(65+i));
  const nums=[...Array(10)].map((_,i)=>String(i+1));
  const lc=letters.filter(x=>learned.has("letter-"+x)).length;
  const nc=nums.filter(x=>learned.has("number-"+x)).length;
  document.getElementById("abcProgress").textContent=lc+"/26";
  document.getElementById("numberProgress").textContent=nc+"/10";
  document.querySelectorAll(".letter-grid button").forEach(b=>b.classList.toggle("done",learned.has("letter-"+b.dataset.letter)));
  document.querySelectorAll(".number-grid button").forEach(b=>b.classList.toggle("done",learned.has("number-"+b.dataset.number)));
}
function buildLearning(){
  const letters=[...Array(26)].map((_,i)=>String.fromCharCode(65+i));
  document.getElementById("letterGrid").innerHTML=letters.map(l=>`<button data-letter="${l}">${l}</button>`).join("");
  document.querySelectorAll("#letterGrid button").forEach(b=>b.addEventListener("click",()=>learn("letter-"+b.dataset.letter,b.dataset.letter,b)));

  const nums=[...Array(10)].map((_,i)=>i+1);
  document.getElementById("numberGrid").innerHTML=nums.map(n=>`<button data-number="${n}">${n}</button>`).join("");
  document.querySelectorAll("#numberGrid button").forEach(b=>b.addEventListener("click",()=>learn("number-"+b.dataset.number,String(b.dataset.number),b)));

  const colours=[
    ["RED","#ef5545"],["BLUE","#3e83d8"],["YELLOW","#e6b92f"],["GREEN","#48a85e"],
    ["ORANGE","#ef8738"],["PURPLE","#8666c7"],["PINK","#df6390"],["BROWN","#956b4a"]
  ];
  document.getElementById("colourGrid").innerHTML=colours.map(c=>`<button class="colour-card" style="background:${c[1]}" data-colour="${c[0]}"><span>●</span><span>${c[0]}</span></button>`).join("");
  document.querySelectorAll(".colour-card").forEach(b=>b.addEventListener("click",()=>{speak(b.dataset.colour);earnStar("🎨 Colour discovered!");}));

  const shapes=[["CIRCLE","shape-circle"],["SQUARE","shape-square"],["TRIANGLE","shape-triangle"],["STAR","shape-star"]];
  document.getElementById("shapeGrid").innerHTML=shapes.map(s=>`<button class="shape-card" data-shape="${s[0]}"><span class="shape ${s[1]}"></span><b>${s[0]}</b></button>`).join("");
  document.querySelectorAll(".shape-card").forEach(b=>b.addEventListener("click",()=>{speak(b.dataset.shape);earnStar("🔷 Shape discovered!");}));
  updateProgress();
}
document.querySelectorAll(".learn-tab").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(".learn-tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".learn-panel").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active");
}));

const quizBank=[
  {q:"What comes after 4?",a:["5","6","3"],correct:"5"},
  {q:"Which letter comes first?",a:["B","A","C"],correct:"A"},
  {q:"How many fingers are on one hand?",a:["3","5","8"],correct:"5"},
  {q:"Which one is a colour?",a:["RED","CAT","TREE"],correct:"RED"}
];
let quizIndex=0;
function nextQuiz(){
  const q=quizBank[quizIndex%quizBank.length];
  document.getElementById("quizQuestion").textContent=q.q;
  document.getElementById("quizOptions").innerHTML=q.a.map(a=>`<button data-answer="${a}">${a}</button>`).join("");
  document.querySelectorAll("#quizOptions button").forEach(b=>b.addEventListener("click",()=>{
    const out=document.getElementById("quiz-result");
    if(b.dataset.answer===q.correct){out.textContent="🎉 Correct! +1 Star";earnStar("🎉 Quiz cleared!");quizIndex++;setTimeout(nextQuiz,700)}
    else out.textContent="Try again! Hint: listen carefully.";
  }));
}
document.querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>{
  const out=document.getElementById("game-output");
  const q={letter:"🔤 Find the letter A! Say “A” out loud, then claim your star.",number:"🔢 What comes after 7? Answer: 8!",colour:"🎨 Find something blue around you!"}[b.dataset.game];
  out.innerHTML="<div>"+q+"<br><button class='primary small' style='margin-top:12px' onclick='earnStar(\"🏆 Game cleared!\")'>CLAIM STAR</button></div>";
}));
document.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>{speak(b.dataset.speak);earnStar("🎵 Music time!")}));
buildLearning();nextQuiz();renderStats();


document.addEventListener("DOMContentLoaded",()=>{
  const safe=(fn)=>{try{fn()}catch(e){console.error("Bakawali game error:",e)}};

  safe(()=>{
    document.querySelectorAll(".game-choice").forEach(btn=>btn.addEventListener("click",()=>{
      document.querySelectorAll(".game-choice").forEach(x=>x.classList.remove("active"));
      document.querySelectorAll(".game-panel").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      const panel=document.getElementById(btn.dataset.gamePanel);
      if(panel) panel.classList.add("active");
    }));
  });

  safe(()=>{
    const g=document.getElementById("gameStars");
    if(g) g.textContent=stars;
  });

  // ---------- MONSTER CHASE ----------
  safe(()=>{
    let running=false, x=15, score=0, timer=null, endTimer=null;
    const player=document.getElementById("chasePlayer");
    const item=document.getElementById("chaseItem");
    const stage=document.getElementById("chaseStage");
    const msg=document.getElementById("chaseMessage");
    const scoreEl=document.getElementById("chaseScore");
    const start=document.getElementById("chaseStart");
    if(!player||!item||!stage||!msg||!scoreEl||!start) return;

    function spawn(){
      item.style.left=(18+Math.random()*68)+"%";
      item.style.top=(15+Math.random()*58)+"%";
    }
    function collect(){
      const a=player.getBoundingClientRect(),b=item.getBoundingClientRect();
      const dx=Math.abs((a.left+a.width/2)-(b.left+b.width/2));
      const dy=Math.abs((a.top+a.height/2)-(b.top+b.height/2));
      if(dx<58 && dy<70){
        score++;
        scoreEl.textContent=score;
        spawn();
        if(score%5===0){
          msg.textContent="SUPER! +1 ⭐";
          earnStar("⚡ Energy collected!");
          setTimeout(()=>{if(running)msg.textContent=""},700);
        }
      }
    }
    function move(dir){
      if(!running)return;
      x=Math.max(4,Math.min(82,x+(dir==="left"?-6:6)));
      player.style.left=x+"%";
      collect();
    }
    document.querySelectorAll("[data-move]").forEach(b=>{
      b.onclick=()=>move(b.dataset.move);
    });
    window.addEventListener("keydown",e=>{
      if(e.key==="ArrowLeft")move("left");
      if(e.key==="ArrowRight")move("right");
    });
    start.onclick=()=>{
      if(running)return;
      running=true;x=15;score=0;scoreEl.textContent="0";player.style.left=x+"%";
      msg.textContent="GO!";
      spawn();
      setTimeout(()=>{if(running)msg.textContent=""},500);
      clearInterval(timer);
      timer=setInterval(spawn,1800);
      clearTimeout(endTimer);
      endTimer=setTimeout(()=>{
        running=false;clearInterval(timer);
        msg.textContent="RUN COMPLETE!";
        if(score>=3)earnStar("🏃 Monster Chase cleared!");
        setTimeout(()=>msg.textContent="",1200);
      },30000);
    };
    spawn();
  });

  // ---------- SKY BLASTER ----------
  safe(()=>{
    let running=false,score=0,combo=0,timer=null,endTimer=null;
    const target=document.getElementById("skyTarget");
    const scoreEl=document.getElementById("blastScore");
    const comboEl=document.getElementById("blastCombo");
    const msg=document.getElementById("skyMessage");
    const start=document.getElementById("blastStart");
    if(!target||!scoreEl||!comboEl||!msg||!start)return;

    function move(){
      target.style.left=(8+Math.random()*78)+"%";
      target.style.top=(10+Math.random()*72)+"%";
    }
    target.onclick=()=>{
      if(!running)return;
      score++;combo++;
      scoreEl.textContent=score;comboEl.textContent="x"+combo;
      if(combo>=3){
        msg.textContent="🔥 COMBO!";
        setTimeout(()=>{if(running)msg.textContent=""},450);
      }
      if(score%8===0)earnStar("🚀 Sky Blaster cleared!");
      move();
    };
    start.onclick=()=>{
      if(running)return;
      running=true;score=0;combo=0;
      scoreEl.textContent="0";comboEl.textContent="x0";
      msg.textContent="BLAST OFF!";move();
      setTimeout(()=>{if(running)msg.textContent=""},500);
      clearInterval(timer);timer=setInterval(()=>{move();combo=0;comboEl.textContent="x0"},950);
      clearTimeout(endTimer);
      endTimer=setTimeout(()=>{
        running=false;clearInterval(timer);
        msg.textContent="MISSION COMPLETE!";
        if(score>=5)earnStar("🎯 Sky mission cleared!");
        setTimeout(()=>msg.textContent="",1200);
      },25000);
    };
    move();
  });

  // ---------- TREASURE HUNT ----------
  safe(()=>{
    let key=false;
    const result=document.getElementById("treasureResult");
    const keyEl=document.getElementById("treasureKeys");
    const chest=document.getElementById("openChest");
    if(!result||!keyEl||!chest)return;

    document.querySelectorAll("[data-path]").forEach(btn=>{
      btn.onclick=()=>{
        const path=btn.dataset.path;
        if(path==="cave"){
          if(!key){
            key=true;keyEl.textContent="1";chest.disabled=false;
            result.textContent="💎 You found the KEY! The treasure chest can be opened!";
            earnStar("🔑 Key found!");
          }
        }else if(path==="forest"){
          result.textContent="🌲 You found tiny footprints... maybe a monster was here!";
        }else{
          result.textContent="🌊 Splash! The river sends you back to camp.";
        }
      };
    });
    chest.onclick=()=>{
      if(!key)return;
      result.textContent="🎉 TREASURE FOUND! You discovered a Bakawali treasure!";
      chest.textContent="🏆 TREASURE CLAIMED";
      chest.disabled=true;
      earnStar("💎 Treasure Quest complete!");
    };
  });

  // ---------- MONSTER BATTLE ----------
  safe(()=>{
    let playerHP=100,enemyHP=100,energy=0,busy=false;
    const p=document.getElementById("playerHp"),e=document.getElementById("enemyHp"),en=document.getElementById("energyBar");
    const status=document.getElementById("battleStatus"),superBtn=document.getElementById("superSpark"),level=document.getElementById("battleLevel");
    if(!p||!e||!en||!status||!superBtn)return;

    function ui(){
      p.style.width=playerHP+"%";e.style.width=enemyHP+"%";en.style.width=energy+"%";
      superBtn.disabled=energy<100||enemyHP<=0;
      if(level)level.textContent=Math.floor(stars/3)+1;
    }
    function enemyTurn(){
      if(enemyHP<=0)return;
      setTimeout(()=>{
        const hit=8+Math.floor(Math.random()*9);
        playerHP=Math.max(0,playerHP-hit);ui();
        if(playerHP<=0){
          status.textContent="💪 Zapko needs a rest! Try again.";
          playerHP=100;enemyHP=100;energy=0;ui();
        }else{
          status.textContent="Wild Bot attacks! Your turn!";
        }
        busy=false;
      },500);
    }
    document.querySelectorAll("[data-battle]").forEach(btn=>{
      btn.onclick=()=>{
        if(busy||enemyHP<=0)return;
        busy=true;
        if(btn.dataset.battle==="charge"){
          energy=Math.min(100,energy+35);
          status.textContent="🔋 Energy charged!";
        }else{
          enemyHP=Math.max(0,enemyHP-22);
          energy=Math.min(100,energy+20);
          status.textContent="⚡ SPARK HIT!";
        }
        ui();
        if(enemyHP<=0){
          status.textContent="🏆 Victory! Wild Bot is defeated!";
          earnStar("⚔️ Battle victory!");
          setTimeout(()=>{enemyHP=100;playerHP=100;energy=0;busy=false;ui()},900);
        }else enemyTurn();
      };
    });
    superBtn.onclick=()=>{
      if(busy||energy<100||enemyHP<=0)return;
      busy=true;enemyHP=0;energy=0;status.textContent="💥 SUPER SPARK!!!";ui();
      earnStar("💥 SUPER SPARK victory!");
      setTimeout(()=>{enemyHP=100;playerHP=100;busy=false;ui();status.textContent="Ready for another battle!"},1100);
    };
    ui();
  });
});


/* ---------- BAKAWALI SKY RUNNER ---------- */
(function initBakawaliRunner(){
  const canvas=document.getElementById('runnerCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const wrap=canvas.parentElement;
  const start=document.getElementById('runnerStart'), over=document.getElementById('runnerOver'), pause=document.getElementById('runnerPause');
  const scoreEl=document.getElementById('runnerScore'), energyEl=document.getElementById('runnerEnergy'), bestEl=document.getElementById('runnerBest'), finalEl=document.getElementById('runnerFinal');
  let W=900,H=500,dpr=1,raf=0,state='start',score=0,best=Number(localStorage.getItem('bakawaliRunnerBest')||0),energy=100,speed=5,frame=0,obs=[],starsR=[],particles=[];
  const player={x:100,y:0,w:38,h:50,vy:0,jumps:0,dashing:0};
  bestEl.textContent=Math.floor(best);
  function resize(){const r=wrap.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=Math.max(320,r.width);H=Math.max(280,r.height);canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);if(state==='start')player.y=ground()-player.h}
  function ground(){return H-62}
  window.addEventListener('resize',resize); resize();
  function reset(){score=0;energy=100;speed=5;frame=0;obs=[];starsR=[];particles=[];player.x=100;player.y=ground()-player.h;player.vy=0;player.jumps=0;player.dashing=0;hud();}
  function hud(){scoreEl.textContent=Math.floor(score);energyEl.textContent=Math.floor(energy)}
  function jump(){if(state!=='play')return;if(player.jumps<2){player.vy=-12;player.jumps++;}}
  function dash(){if(state!=='play'||energy<30||player.dashing)return;energy-=30;player.dashing=18;hud()}
  function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
  function spawn(){
    if(frame%Math.max(48,90-Math.floor(score/100)*4)===0)obs.push({x:W+30,w:26+Math.random()*20,h:35+Math.random()*35});
    if(frame%65===20)starsR.push({x:W+30,y:ground()-70-Math.random()*100,r:9,p:0});
  }
  function burst(x,y,c,n=10){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7,l:1,c})}
  function update(){
    frame++; score+=.15; speed=Math.min(10,5+Math.floor(score/150)*.5); energy=Math.min(100,energy+.10);
    if(player.dashing)player.dashing--;
    else {player.vy+=.62;player.y+=player.vy}
    const gy=ground()-player.h;if(player.y>=gy){player.y=gy;player.vy=0;player.jumps=0}
    spawn();
    for(let i=obs.length-1;i>=0;i--){const o=obs[i];o.x-=speed;const b={x:o.x,y:ground()-o.h,w:o.w,h:o.h};if(rect(player,b)){if(player.dashing){burst(o.x+o.w/2,ground()-o.h/2,'#ec4899',15);obs.splice(i,1);score+=20}else{return gameOver()}}if(o.x+o.w<-30)obs.splice(i,1)}
    for(let i=starsR.length-1;i>=0;i--){const s=starsR[i];s.x-=speed;s.p+=.1;if(Math.hypot(player.x+player.w/2-s.x,player.y+player.h/2-s.y)<28){score+=15;energy=Math.min(100,energy+18);burst(s.x,s.y,'#ffd83d',10);starsR.splice(i,1)}else if(s.x<-30)starsR.splice(i,1)}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.l-=.035;if(p.l<=0)particles.splice(i,1)}
    hud();
  }
  function draw(){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#58bfe1');g.addColorStop(1,'#d9f1c7');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // hills
    ctx.fillStyle='#69ad82';for(let x=-100;x<W+300;x+=260){ctx.beginPath();ctx.arc(x+130,ground()+10,160,Math.PI,0);ctx.fill()}
    // clouds
    ctx.fillStyle='rgba(255,255,255,.72)';for(let x=(frame*-.15)%500-100;x<W+500;x+=500){ctx.beginPath();ctx.arc(x,80,25,0,Math.PI*2);ctx.arc(x+32,72,35,0,Math.PI*2);ctx.arc(x+70,84,24,0,Math.PI*2);ctx.fill()}
    ctx.fillStyle='#73492a';ctx.fillRect(0,ground(),W,H-ground());ctx.fillStyle='#38a34a';ctx.fillRect(0,ground(),W,9);
    starsR.forEach(s=>{ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.p);ctx.fillStyle='#ffd83d';ctx.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?s.r:s.r*.45;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.restore()});
    obs.forEach(o=>{ctx.fillStyle='#d85b61';ctx.fillRect(o.x,ground()-o.h,o.w,o.h);ctx.fillStyle='#fff';ctx.fillRect(o.x+5,ground()-o.h+5,o.w-10,7)});
    particles.forEach(p=>{ctx.globalAlpha=p.l;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,4,4)});ctx.globalAlpha=1;
    // Baku
    ctx.save();ctx.shadowBlur=player.dashing?22:8;ctx.shadowColor=player.dashing?'#ec4899':'#ffd83d';ctx.fillStyle=player.dashing?'#ec4899':'#ffd83d';ctx.beginPath();ctx.arc(player.x+19,player.y+18,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#18344a';ctx.fillRect(player.x+8,player.y+36,22,14);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(player.x+12,player.y+17,4,0,Math.PI*2);ctx.arc(player.x+25,player.y+17,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(player.x+13,player.y+17,2,0,Math.PI*2);ctx.arc(player.x+26,player.y+17,2,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function loop(){if(state!=='play')return;update();draw();raf=requestAnimationFrame(loop)}
  function startGame(){cancelAnimationFrame(raf);reset();state='play';start.classList.add('hidden');over.classList.add('hidden');pause.classList.add('hidden');loop()}
  function gameOver(){state='over';cancelAnimationFrame(raf);if(score>best){best=score;localStorage.setItem('bakawaliRunnerBest',best);bestEl.textContent=Math.floor(best)}finalEl.textContent=Math.floor(score);over.classList.remove('hidden');draw()}
  function togglePause(){if(state==='play'){state='pause';pause.classList.remove('hidden');cancelAnimationFrame(raf)}else if(state==='pause'){state='play';pause.classList.add('hidden');loop()}}
  document.getElementById('runnerStartBtn').onclick=startGame;document.getElementById('runnerAgain').onclick=startGame;document.getElementById('runnerResume').onclick=togglePause;document.getElementById('runnerPauseBtn').onclick=togglePause;document.getElementById('runnerJump').onclick=jump;document.getElementById('runnerDash').onclick=dash;
  window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump()}if(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyX'){e.preventDefault();dash()}if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause()}});
  draw();
})();
