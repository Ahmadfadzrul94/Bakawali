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

// Phase 4.5 Adventure Arcade
document.querySelectorAll(".game-choice").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".game-choice").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".game-panel").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");document.getElementById(btn.dataset.gamePanel).classList.add("active");
}));

const oldEarnStar=earnStar;
earnStar=function(msg="⭐ Quest complete!"){oldEarnStar(msg);const g=document.getElementById("gameStars");if(g)g.textContent=stars};
document.getElementById("gameStars").textContent=stars;

// MONSTER CHASE
let chaseRunning=false,chaseX=15,chaseScore=0,chaseTimer;
const chasePlayer=document.getElementById("chasePlayer"),chaseItem=document.getElementById("chaseItem"),chaseMessage=document.getElementById("chaseMessage");
function moveChase(dir){if(!chaseRunning)return;chaseX=Math.max(4,Math.min(82,chaseX+(dir==="left"?-5:5)));chasePlayer.style.left=chaseX+"%";checkChase();}
function spawnChase(){chaseItem.style.left=(20+Math.random()*65)+"%";chaseItem.style.top=(15+Math.random()*55)+"%"}
function checkChase(){
 const a=chasePlayer.getBoundingClientRect(),b=chaseItem.getBoundingClientRect();
 if(Math.abs((a.left+a.width/2)-(b.left+b.width/2))<55&&Math.abs((a.top+a.height/2)-(b.top+b.height/2))<65){
   chaseScore++;document.getElementById("chaseScore").textContent=chaseScore;spawnChase();
   if(chaseScore%5===0){earnStar("⚡ Energy collected!");chaseMessage.textContent="SUPER! +1 ⭐";setTimeout(()=>chaseMessage.textContent="",700)}
 }
}
document.querySelectorAll("[data-move]").forEach(b=>b.addEventListener("click",()=>moveChase(b.dataset.move)));
document.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")moveChase("left");if(e.key==="ArrowRight")moveChase("right")});
document.getElementById("chaseStart").addEventListener("click",()=>{
 if(chaseRunning)return;chaseRunning=true;chaseScore=0;chaseX=15;document.getElementById("chaseScore").textContent=0;
 chaseMessage.textContent="GO!";spawnChase();setTimeout(()=>chaseMessage.textContent="",500);
 clearInterval(chaseTimer);chaseTimer=setInterval(()=>{if(chaseRunning){spawnChase();}},1800);
 setTimeout(()=>{chaseRunning=false;clearInterval(chaseTimer);chaseMessage.textContent="RUN COMPLETE!";if(chaseScore>=3)earnStar("🏃 Monster Chase cleared!");setTimeout(()=>chaseMessage.textContent="",1200)},30000);
});

// SKY BLASTER
let blastRunning=false,blastScore=0,blastCombo=0,blastTimer;
const target=document.getElementById("skyTarget"),skyStage=document.getElementById("skyStage");
function moveTarget(){target.style.left=(8+Math.random()*78)+"%";target.style.top=(10+Math.random()*70)+"%"}
target.addEventListener("click",()=>{
 if(!blastRunning)return;blastScore++;blastCombo++;document.getElementById("blastScore").textContent=blastScore;document.getElementById("blastCombo").textContent="x"+blastCombo;
 if(blastCombo>=3){document.getElementById("skyMessage").textContent="🔥 COMBO!";setTimeout(()=>document.getElementById("skyMessage").textContent="",450)}
 if(blastScore%8===0)earnStar("🚀 Sky Blaster cleared!");
 moveTarget();
});
document.getElementById("blastStart").addEventListener("click",()=>{
 if(blastRunning)return;blastRunning=true;blastScore=0;blastCombo=0;document.getElementById("blastScore").textContent=0;document.getElementById("blastCombo").textContent="x0";
 document.getElementById("skyMessage").textContent="BLAST OFF!";moveTarget();setTimeout(()=>document.getElementById("skyMessage").textContent="",500);
 clearInterval(blastTimer);blastTimer=setInterval(()=>{moveTarget();blastCombo=0;document.getElementById("blastCombo").textContent="x0"},950);
 setTimeout(()=>{blastRunning=false;clearInterval(blastTimer);document.getElementById("skyMessage").textContent="MISSION COMPLETE!";if(blastScore>=5)earnStar("🎯 Sky mission cleared!");setTimeout(()=>document.getElementById("skyMessage").textContent="",1200)},25000);
});

// TREASURE HUNT
let hasKey=false;
document.querySelectorAll("[data-path]").forEach(btn=>btn.addEventListener("click",()=>{
 const path=btn.dataset.path;
 const messages={
  forest:["🌲 You found footprints! Follow them...","no"],
  cave:["💎 A crystal shines! You found the KEY!","yes"],
  river:["🌊 Splash! The current carried you back to camp.","no"]
 };
 document.getElementById("treasureResult").textContent=messages[path][0];
 if(messages[path][1]==="yes"){hasKey=true;document.getElementById("treasureKeys").textContent="1";document.getElementById("openChest").disabled=false;earnStar("🔑 Key found!")}
}));
document.getElementById("openChest").addEventListener("click",()=>{
 if(!hasKey)return;document.getElementById("treasureResult").textContent="🎉 TREASURE FOUND! A new adventure badge is yours!";
 document.getElementById("openChest").textContent="🏆 TREASURE CLAIMED";document.getElementById("openChest").disabled=true;earnStar("💎 Treasure Quest complete!");
});

// MONSTER BATTLE
let playerHP=100,enemyHP=100,energy=0;
function battleUI(){document.getElementById("playerHp").style.width=playerHP+"%";document.getElementById("enemyHp").style.width=enemyHP+"%";document.getElementById("energyBar").style.width=energy+"%";document.getElementById("superSpark").disabled=energy<100}
function enemyMove(){
 if(enemyHP<=0)return;
 const hit=8+Math.floor(Math.random()*9);playerHP=Math.max(0,playerHP-hit);battleUI();
 if(playerHP<=0){document.getElementById("battleStatus").textContent="💪 Zapko needs a rest! Try again.";playerHP=100;enemyHP=100;energy=0;battleUI()}
}
function battleAction(type){
 if(enemyHP<=0)return;
 if(type==="charge"){energy=Math.min(100,energy+35);document.getElementById("battleStatus").textContent="🔋 Zapko is charging!";battleUI();setTimeout(enemyMove,400);return}
 const dmg=22;enemyHP=Math.max(0,enemyHP-dmg);energy=Math.min(100,energy+20);document.getElementById("battleStatus").textContent="⚡ SPARK HIT!";battleUI();
 if(enemyHP<=0){document.getElementById("battleStatus").textContent="🏆 Victory! Wild Bot is down!";earnStar("⚔️ Battle victory!");enemyHP=100;playerHP=100;energy=0;battleUI();return}
 setTimeout(enemyMove,450)
}
document.querySelectorAll("[data-battle]").forEach(b=>b.addEventListener("click",()=>battleAction(b.dataset.battle)));
document.getElementById("superSpark").addEventListener("click",()=>{
 if(energy<100||enemyHP<=0)return;enemyHP=0;energy=0;document.getElementById("battleStatus").textContent="💥 SUPER SPARK!!!";battleUI();earnStar("💥 SUPER SPARK victory!");
 setTimeout(()=>{enemyHP=100;playerHP=100;battleUI()},900);
});
document.getElementById("battleLevel").textContent=Math.floor(stars/3)+1;
battleUI();

const hash=location.hash.replace("#","");
if(hash && document.getElementById(hash)) showPage(hash);
