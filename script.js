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

// ---------- BAKAWALI PLATFORM ADVENTURE ----------
document.addEventListener("DOMContentLoaded",()=>{
  const canvas=document.getElementById("platformCanvas");
  const start=document.getElementById("platformStart");
  const overlay=document.getElementById("platformMessage");
  if(!canvas||!start||!overlay)return;
  const ctx=canvas.getContext("2d");
  const W=canvas.width,H=canvas.height;
  const keys={left:false,right:false};
  let raf=0,running=false,last=0,score=0,gems=0,lives=3,camera=0,win=false;
  const worldW=4300, groundY=470;
  const player={x:100,y:380,w:38,h:48,vx:0,vy:0,onGround:false,inv:0};
  const stars=[
    [420,365],[700,300],[940,390],[1220,330],[1510,265],[1810,365],[2080,305],
    [2380,390],[2670,320],[2960,260],[3240,380],[3540,310],[3830,365],[4100,280]
  ];
  const gemsList=[[560,345],[1080,270],[1380,390],[1710,320],[2260,345],[2810,370],[3380,330],[3970,340]];
  const enemies=[
    {x:820,y:421,w:38,h:34,vx:-.7,alive:true},
    {x:1320,y:421,w:38,h:34,vx:.8,alive:true},
    {x:1940,y:421,w:38,h:34,vx:-.8,alive:true},
    {x:2480,y:421,w:38,h:34,vx:.9,alive:true},
    {x:3150,y:421,w:38,h:34,vx:-.9,alive:true},
    {x:3680,y:421,w:38,h:34,vx:.8,alive:true}
  ];
  const platforms=[
    [0,470,700,70],[780,470,520,70],[1370,470,620,70],[2050,470,540,70],
    [2680,470,520,70],[3310,470,470,70],[3900,470,400,70],
    [320,390,150,22],[600,330,150,22],[1010,350,160,22],[1210,290,150,22],
    [1510,345,160,22],[1770,300,150,22],[2150,365,150,22],[2380,315,170,22],
    [2730,350,160,22],[2940,290,160,22],[3250,350,150,22],[3480,285,170,22],
    [3750,340,150,22]
  ];
  const flag={x:4180,y:330,w:35,h:140};

  function reset(){
    player.x=100;player.y=380;player.vx=0;player.vy=0;player.onGround=false;player.inv=0;
    score=0;gems=0;lives=3;camera=0;win=false;
    enemies.forEach((e,i)=>{e.alive=true;e.x=[820,1320,1940,2480,3150,3680][i];e.vx=i%2?0.8:-0.8});
    updateHud();draw();
  }
  function updateHud(){
    const s=document.getElementById("platformScore"),g=document.getElementById("platformGems"),l=document.getElementById("platformLives");
    if(s)s.textContent=score;if(g)g.textContent=gems;if(l)l.textContent=lives;
  }
  function rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
  function jump(){if(!running)return;if(player.onGround){player.vy=-12;player.onGround=false}}
  function inputDown(dir){keys[dir]=true}
  function inputUp(dir){keys[dir]=false}

  ["left","right"].forEach(dir=>{
    const b=document.getElementById("platform"+dir[0].toUpperCase()+dir.slice(1));
    if(!b)return;
    b.addEventListener("pointerdown",e=>{e.preventDefault();inputDown(dir)});
    ["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();inputUp(dir)}));
  });
  document.getElementById("platformJump").addEventListener("pointerdown",e=>{e.preventDefault();jump()});
  window.addEventListener("keydown",e=>{
    if(!document.getElementById("games").classList.contains("active"))return;
    if(e.key==="ArrowLeft")keys.left=true;
    if(e.key==="ArrowRight")keys.right=true;
    if(e.key==="ArrowUp"||e.key===" ") {e.preventDefault();jump()}
  });
  window.addEventListener("keyup",e=>{
    if(e.key==="ArrowLeft")keys.left=false;
    if(e.key==="ArrowRight")keys.right=false;
  });

  function loseLife(){
    lives--;updateHud();
    if(lives<=0){
      running=false;overlay.style.display="flex";
      overlay.querySelector("strong").textContent="💫 TRY AGAIN!";
      overlay.querySelector("span").textContent="The forest is waiting. Collect some stars and try again!";
      start.textContent="PLAY AGAIN";
      return;
    }
    player.x=Math.max(80,player.x-180);player.y=300;player.vx=0;player.vy=0;player.inv=100;
  }

  function update(dt){
    const accel=keys.left?-0.75:keys.right?0.75:0;
    player.vx+=accel;
    if(!accel)player.vx*=0.82;
    player.vx=Math.max(-5,Math.min(5,player.vx));
    player.vy+=0.58;
    if(player.vy>14)player.vy=14;
    const oldY=player.y;
    player.x+=player.vx;
    player.x=Math.max(0,Math.min(worldW-player.w,player.x));
    player.y+=player.vy;
    player.onGround=false;

    for(const p of platforms){
      const r={x:p[0],y:p[1],w:p[2],h:p[3]};
      if(player.x+player.w>r.x&&player.x<r.x+r.w){
        if(oldY+player.h<=r.y+8&&player.y+player.h>=r.y&&player.vy>=0){
          player.y=r.y-player.h;player.vy=0;player.onGround=true;
        }
      }
    }
    if(player.y>H+80){loseLife();return}
    if(player.inv>0)player.inv--;

    // Collect stars and gems.
    for(let i=stars.length-1;i>=0;i--){
      const s=stars[i],r={x:s[0]-13,y:s[1]-13,w:26,h:26};
      if(rects(player,r)){stars.splice(i,1);score++;updateHud();if(score%5===0)earnStar("⭐ Star collector!")}
    }
    for(let i=gemsList.length-1;i>=0;i--){
      const g=gemsList[i],r={x:g[0]-12,y:g[1]-12,w:24,h:24};
      if(rects(player,r)){gemsList.splice(i,1);gems++;score+=2;updateHud()}
    }

    for(const e of enemies){
      if(!e.alive)continue;
      e.x+=e.vx;
      if(e.x<30||e.x>worldW-80)e.vx*=-1;
      if(rects(player,e)){
        if(player.vy>2 && player.y+player.h-e.y<18){
          e.alive=false;player.vy=-8;score+=3;updateHud();earnStar("🐾 Monster defeated!");
        }else if(player.inv<=0){loseLife();return}
      }
    }

    if(rects(player,flag)){
      running=false;win=true;
      score+=10;updateHud();
      earnStar("🏆 World 1-1 complete!");
      overlay.style.display="flex";
      overlay.querySelector("strong").textContent="🏆 LEVEL COMPLETE!";
      overlay.querySelector("span").textContent="You reached the Bakawali flag! +10 score";
      start.textContent="PLAY AGAIN";
    }

    camera=player.x-W*0.38;
    camera=Math.max(0,Math.min(worldW-W,camera));
  }

  function roundRect(x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function drawStar(x,y,outer,inner){
    ctx.beginPath();
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?inner:outer;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}
    ctx.closePath();ctx.fill();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#83d9ff");grad.addColorStop(.65,"#c8efff");grad.addColorStop(.651,"#78ca64");grad.addColorStop(1,"#4fae4e");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    // distant hills
    ctx.fillStyle="#72b8a1";for(let x=-500-(camera*.15)%500;x<worldW;x+=430){ctx.beginPath();ctx.arc(x,455,180,Math.PI,0);ctx.fill()}
    ctx.save();ctx.translate(-camera,0);
    // clouds
    ctx.fillStyle="#fff9";for(let x=120;x<worldW;x+=700){ctx.beginPath();ctx.arc(x,95,35,0,Math.PI*2);ctx.arc(x+40,90,48,0,Math.PI*2);ctx.arc(x+85,100,30,0,Math.PI*2);ctx.fill()}
    // platforms
    for(const p of platforms){
      ctx.fillStyle=p[3]>30?"#7a5334":"#d7a64b";ctx.fillRect(p[0],p[1],p[2],p[3]);
      ctx.fillStyle=p[3]>30?"#5db95b":"#75ca63";ctx.fillRect(p[0],p[1],p[2],8);
      if(p[3]>30){ctx.fillStyle="#6a472f";for(let x=p[0]+18;x<p[0]+p[2]-10;x+=35)ctx.fillRect(x,p[1]+24,10,10)}
    }
    // stars
    ctx.fillStyle="#ffd34f";for(const s of stars){drawStar(s[0],s[1],14,6)}
    // gems
    for(const g of gemsList){ctx.fillStyle="#72e6ff";ctx.beginPath();ctx.moveTo(g[0],g[1]-15);ctx.lineTo(g[0]+12,g[1]);ctx.lineTo(g[0],g[1]+15);ctx.lineTo(g[0]-12,g[1]);ctx.closePath();ctx.fill();ctx.strokeStyle="#fff";ctx.stroke()}
    // enemies
    for(const e of enemies)if(e.alive){
      ctx.fillStyle="#8d66c8";roundRect(e.x,e.y,e.w,e.h,13);ctx.fill();
      ctx.fillStyle="#17213d";ctx.beginPath();ctx.arc(e.x+11,e.y+12,4,0,Math.PI*2);ctx.arc(e.x+27,e.y+12,4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#17213d";ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x+19,e.y+19,9,0,Math.PI);ctx.stroke();
    }
    // flag
    ctx.fillStyle="#68452c";ctx.fillRect(flag.x,flag.y,7,flag.h);
    ctx.fillStyle="#ff5c39";ctx.beginPath();ctx.moveTo(flag.x+7,flag.y);ctx.lineTo(flag.x+70,flag.y+22);ctx.lineTo(flag.x+7,flag.y+44);ctx.closePath();ctx.fill();
    // player original mascot
    if(player.inv%8<5){
      ctx.fillStyle="#ffc52f";roundRect(player.x,player.y,player.w,player.h,13);ctx.fill();
      ctx.fillStyle="#17213d";ctx.beginPath();ctx.arc(player.x+12,player.y+18,4,0,Math.PI*2);ctx.arc(player.x+27,player.y+18,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#e39d19";ctx.fillRect(player.x+8,player.y-7,22,7);
      ctx.fillStyle="#17213d";ctx.fillRect(player.x+7,player.y+player.h-5,10,5);ctx.fillRect(player.x+23,player.y+player.h-5,10,5);
    }
    ctx.restore();
  }

  function loop(t){
    if(!running)return;
    const dt=Math.min(.032,(t-last)/1000||.016);last=t;update(dt);draw();raf=requestAnimationFrame(loop);
  }
  start.addEventListener("click",()=>{
    cancelAnimationFrame(raf);clearTimeout(0);reset();running=true;overlay.style.display="none";last=performance.now();raf=requestAnimationFrame(loop);
  });
  reset();
});

