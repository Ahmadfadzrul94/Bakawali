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
// Phase 4 mini-game engine
document.querySelectorAll(".game-choice").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".game-choice").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".game-panel").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(btn.dataset.gamePanel).classList.add("active");
}));

function syncGameStars(){const el=document.getElementById("gameStars");if(el)el.textContent=stars}
const originalEarnStar=earnStar;
earnStar=function(msg="⭐ Quest complete!"){originalEarnStar(msg);syncGameStars()};
syncGameStars();

// Memory Match
const memoryIcons=["🍎","🍎","⭐","⭐","🐟","🐟","⚡","⚡"];
let memoryFirst=null,memoryLock=false,memoryMatched=0;
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function buildMemory(){
  memoryFirst=null;memoryLock=false;memoryMatched=0;
  const board=document.getElementById("memoryBoard");
  board.innerHTML=shuffle(memoryIcons).map((icon,i)=>`<button class="memory-card" data-icon="${icon}" data-i="${i}">?</button>`).join("");
  document.getElementById("memoryStatus").textContent="Find a pair!";
  board.querySelectorAll(".memory-card").forEach(card=>card.addEventListener("click",memoryClick));
}
function memoryClick(){
  if(memoryLock||this.classList.contains("flipped")||this.classList.contains("matched"))return;
  this.classList.add("flipped");this.textContent=this.dataset.icon;
  if(!memoryFirst){memoryFirst=this;return}
  if(memoryFirst.dataset.icon===this.dataset.icon){
    memoryFirst.classList.add("matched");this.classList.add("matched");memoryMatched++;memoryFirst=null;
    if(memoryMatched===4){document.getElementById("memoryStatus").textContent="🎉 All pairs found!";earnStar("🧠 Memory master!")}
    else document.getElementById("memoryStatus").textContent="Nice pair! Find another.";
  }else{
    memoryLock=true;document.getElementById("memoryStatus").textContent="Try another pair!";
    const first=memoryFirst,second=this;
    setTimeout(()=>{first.classList.remove("flipped");second.classList.remove("flipped");first.textContent="?";second.textContent="?";memoryFirst=null;memoryLock=false},650);
  }
}
document.getElementById("memoryReset").addEventListener("click",buildMemory);
buildMemory();

// Number Dash
const numberQs=[{q:"Which number comes after 6?",a:["5","7","8"],c:"7"},{q:"Which number comes before 4?",a:["2","3","5"],c:"3"},{q:"How many stars? ⭐⭐⭐",a:["2","3","4"],c:"3"},{q:"What is 2 + 2?",a:["3","4","5"],c:"4"},{q:"Which is the biggest?",a:["1","9","5"],c:"9"}];
let nIndex=0,nScore=0;
function buildNumberGame(){
 const q=numberQs[nIndex%numberQs.length];
 document.getElementById("numberGameQuestion").textContent=q.q;
 document.getElementById("dashOptions").innerHTML=shuffle(q.a).map(a=>`<button>${a}</button>`).join("");
 document.querySelectorAll("#dashOptions button").forEach(b=>b.addEventListener("click",()=>{
   if(b.textContent===q.c){nScore++;document.getElementById("numberScore").textContent=nScore;document.getElementById("numberGameStatus").textContent="🎉 Correct!";if(nScore===5){earnStar("🔢 Number Dash cleared!");nScore=0;document.getElementById("numberScore").textContent=0}nIndex++;setTimeout(buildNumberGame,500)}
   else document.getElementById("numberGameStatus").textContent="Almost! Try again.";
 }));
}
buildNumberGame();

// Colour Blast
const colourSet=[["RED","#ef5545"],["BLUE","#3e83d8"],["YELLOW","#e6b92f"],["GREEN","#48a85e"]];
let cScore=0,cRound=0;
function buildColourGame(){
 const target=colourSet[Math.floor(Math.random()*colourSet.length)];
 document.getElementById("colourQuestion").textContent="Tap "+target[0]+"!";
 const options=shuffle(colourSet);
 document.getElementById("blastOptions").innerHTML=options.map(c=>`<button style="background:${c[1]}" data-col="${c[0]}">${c[0]}</button>`).join("");
 document.querySelectorAll("#blastOptions button").forEach(b=>b.addEventListener("click",()=>{
   if(b.dataset.col===target[0]){cScore++;cRound++;document.getElementById("colourScore").textContent=cScore;document.getElementById("colourGameStatus").textContent="🎨 Great match!";if(cScore===5){earnStar("🎨 Colour Blast cleared!");cScore=0;document.getElementById("colourScore").textContent=0}setTimeout(buildColourGame,450)}
   else document.getElementById("colourGameStatus").textContent="Not that one — look at the name!";
 }));
}
buildColourGame();

// Buddy Battle
let playerHP=100,enemyHP=100,battleXP=0;
function battleAction(type){
 if(enemyHP<=0)return;
 const dmg=type==="spark"?22:type==="learn"?17:12;
 enemyHP=Math.max(0,enemyHP-dmg);
 document.getElementById("enemyHp").style.width=enemyHP+"%";
 const messages={spark:"⚡ Zapko used SPARK!",learn:"📚 Zapko learned a clever move!",encourage:"👏 Zapko feels brave!"};
 document.getElementById("battleStatus").textContent=messages[type];
 if(enemyHP<=0){battleXP++;document.getElementById("battleStatus").textContent="🏆 Wild Bot is defeated! Great teamwork.";earnStar("⚔️ Battle cleared!");enemyHP=100;playerHP=100;document.getElementById("enemyHp").style.width="100%";document.getElementById("playerHp").style.width="100%";document.getElementById("battleLevel").textContent=Math.floor(stars/3)+1;return}
 setTimeout(()=>{
   const hit=10+Math.floor(Math.random()*9);playerHP=Math.max(0,playerHP-hit);
   document.getElementById("playerHp").style.width=playerHP+"%";
   document.getElementById("battleStatus").textContent="Wild Bot makes a move!";
   if(playerHP<=0){document.getElementById("battleStatus").textContent="💪 Zapko needs a rest. Try again!";playerHP=100;enemyHP=100;document.getElementById("playerHp").style.width="100%";document.getElementById("enemyHp").style.width="100%";}
 },450);
}
document.querySelectorAll("[data-battle]").forEach(b=>b.addEventListener("click",()=>battleAction(b.dataset.battle)));

const hash=location.hash.replace("#","");
if(hash && document.getElementById(hash)) showPage(hash);
