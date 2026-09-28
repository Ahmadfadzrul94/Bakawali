const pages=[...document.querySelectorAll(".page")];
const toast=document.getElementById("toast");
/* =========================
   BAKAWALI PROFILE PROTOTYPE
   Simple local profiles first; cloud login can be added later.
   ========================= */
const PROFILE_KEY="bakawaliProfiles";
const ACTIVE_PROFILE_KEY="bakawaliActiveProfile";
function profileLoad(){
  let profiles=[];
  try{profiles=JSON.parse(localStorage.getItem(PROFILE_KEY)||"[]")}catch(e){}
  if(!Array.isArray(profiles))profiles=[];
  if(!profiles.length){
    const migrated={id:"explorer",name:"Little Explorer",avatar:"🧢",created:Date.now(),stars:Number(localStorage.getItem("bakawaliStars")||0),badges:Number(localStorage.getItem("bakawaliBadges")||0)};
    profiles=[migrated]; localStorage.setItem(PROFILE_KEY,JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_PROFILE_KEY,migrated.id);
  }
  let active=localStorage.getItem(ACTIVE_PROFILE_KEY);
  if(!profiles.some(p=>p.id===active)){active=profiles[0].id;localStorage.setItem(ACTIVE_PROFILE_KEY,active)}
  return {profiles,active};
}
let profileState=profileLoad();
let activeProfile=profileState.profiles.find(p=>p.id===profileState.active)||profileState.profiles[0];
const profilePrefix=()=>"bakawali:"+activeProfile.id+":";
const pkey=k=>profilePrefix()+k;
function profileGet(k,fallback){const v=localStorage.getItem(pkey(k));return v===null?fallback:v;}
function profileSet(k,v){localStorage.setItem(pkey(k),String(v));}
function refreshProfileLabel(){
  document.querySelectorAll("[data-profile-name]").forEach(x=>x.textContent=activeProfile.name);
  document.querySelectorAll("[data-profile-avatar]").forEach(x=>x.textContent=activeProfile.avatar||"🧢");
}
let stars=Number(profileGet("stars",activeProfile.stars||0));
let badges=Number(profileGet("badges",activeProfile.badges||0));
const learned=new Set(JSON.parse(profileGet("learned","[]")));
refreshProfileLabel();

/* =========================
   BAKAWALI AUDIO HUB
   Three independent channels: Music / Training / Games
   Background tune is generated locally with Web Audio, so no external audio file is needed.
   ========================= */
const bakAudio={
  music: localStorage.getItem('bakawaliMusicOn')!=='0',
  training: localStorage.getItem('bakawaliTrainingSoundOn')!=='0',
  game: localStorage.getItem('bakawaliGameSoundOn')!=='0',
  ctx:null, master:null, musicTimer:null, musicStep:0, musicReady:false
};
function audioContext(){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return null;
  if(!bakAudio.ctx){bakAudio.ctx=new AC();bakAudio.master=bakAudio.ctx.createGain();bakAudio.master.gain.value=.72;bakAudio.master.connect(bakAudio.ctx.destination);}
  if(bakAudio.ctx.state==='suspended')bakAudio.ctx.resume().catch(()=>{});
  bakAudio.musicReady=true;
  return bakAudio.ctx;
}
function tone(freq,dur=.09,type='sine',gain=.045,channel='game',delay=0){
  if(channel==='music'&&!bakAudio.music || channel==='training'&&!bakAudio.training || channel==='game'&&!bakAudio.game)return;
  const c=audioContext(); if(!c||!bakAudio.master)return;
  const now=c.currentTime+delay, o=c.createOscillator(), g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(bakAudio.master);o.start(now);o.stop(now+dur+.03);
}
function trainingClickSound(){tone(560,.055,'sine',.035,'training')}
function trainingCorrectSound(){tone(523,.10,'sine',.055,'training');tone(659,.11,'sine',.055,'training',.08);tone(784,.16,'sine',.06,'training',.17)}
function trainingWrongSound(){tone(220,.13,'sawtooth',.035,'training');tone(175,.16,'sawtooth',.03,'training',.10)}
function trainingCompleteSound(){tone(523,.09,'sine',.055,'training');tone(659,.09,'sine',.055,'training',.08);tone(784,.10,'sine',.055,'training',.16);tone(1047,.22,'sine',.065,'training',.25)}
function gameClickSound(){tone(420,.045,'square',.025,'game')}
function gameCollectSound(){tone(740,.07,'triangle',.045,'game');tone(980,.11,'triangle',.05,'game',.06)}
function gameHitSound(){tone(130,.12,'square',.04,'game')}
function musicTick(){
  if(!bakAudio.music)return;
  const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25,392,349.23,293.66,261.63];
  const n=notes[bakAudio.musicStep%notes.length];
  tone(n,.22,'sine',.018,'music');
  if(bakAudio.musicStep%4===0)tone(n/2,.30,'triangle',.009,'music');
  bakAudio.musicStep++;
}
function startBakawaliMusic(){
  audioContext();
  if(!bakAudio.music)return;
  if(bakAudio.musicTimer)return;
  musicTick();bakAudio.musicTimer=setInterval(musicTick,430);
}
function stopBakawaliMusic(){if(bakAudio.musicTimer){clearInterval(bakAudio.musicTimer);bakAudio.musicTimer=null;}}
function updateAudioButtons(){
  document.querySelectorAll('[data-audio-toggle]').forEach(b=>{const k=b.dataset.audioToggle,on=!!bakAudio[k];b.classList.toggle('off',!on);b.setAttribute('aria-pressed',String(on));const labels={music:['🎵','Music'],training:['📚','Training'],game:['🎮','Games']};const [icon,label]=labels[k];b.innerHTML=on?`${icon} <span>${label}</span>`:`🔇 <span>${label}</span>`;});
}
function initAudioHub(){
  updateAudioButtons();
  document.querySelectorAll('[data-audio-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.audioToggle;audioContext();bakAudio[k]=!bakAudio[k];localStorage.setItem('bakawali'+k.charAt(0).toUpperCase()+k.slice(1)+'On',bakAudio[k]?'1':'0');
    updateAudioButtons();
    if(k==='music'){if(bakAudio.music)startBakawaliMusic();else stopBakawaliMusic();}
    else if(k==='training'&&bakAudio.training){trainingStartSound?.();trainingSay?.('Training sound on');}
    else if(k==='game'&&bakAudio.game)gameClickSound();
  }));
  const unlock=()=>{audioContext();if(bakAudio.music)startBakawaliMusic();};
  document.addEventListener('pointerdown',unlock,{once:true,passive:true});
  document.addEventListener('keydown',unlock,{once:true});
}
initAudioHub();

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
  stars++; profileSet("stars",stars);
  if(stars%3===0){badges++;profileSet("badges",badges)}
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
    learned.add(key);profileSet("learned",JSON.stringify([...learned]));
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
renderStats();

// Lightweight game UI feedback without touching game logic.
document.addEventListener('click',e=>{
  const b=e.target.closest('#games button');
  if(!b || b.matches('.audio-btn'))return;
  gameClickSound();
});



/* =========================
   TRAINING CAMP V2 — 20 MODULES
   ========================= */
const trainingModules=[
  {id:"abc",cat:"language",icon:"🔤",title:"ABC Explorer",desc:"Learn A–Z and hear each letter.",type:"flash",items:[["A","Apple 🍎"],["B","Ball ⚽"],["C","Cat 🐱"],["D","Dog 🐶"],["E","Egg 🥚"],["F","Fish 🐟"],["G","Grapes 🍇"],["H","Hat 🧢"],["I","Ice cream 🍦"],["J","Juice 🧃"],["K","Kite 🪁"],["L","Lion 🦁"],["M","Moon 🌙"],["N","Nose 👃"],["O","Orange 🍊"],["P","Pig 🐷"],["Q","Queen 👑"],["R","Rabbit 🐰"],["S","Sun ☀️"],["T","Tree 🌳"],["U","Umbrella ☂️"],["V","Van 🚐"],["W","Whale 🐳"],["X","X-ray 🩻"],["Y","Yo-yo 🪀"],["Z","Zebra 🦓"]]},
  {id:"phonics",cat:"language",icon:"🔊",title:"Phonics Fun",desc:"Hear the first sound in simple words.",type:"quiz",q:"What sound starts the word “sun”?",a:["S","M","T"],correct:"S"},
  {id:"spelling",cat:"language",icon:"✏️",title:"Spell It!",desc:"Build simple 3-letter words.",type:"spell",words:[["CAT","🐱"],["DOG","🐶"],["SUN","☀️"],["BUS","🚌"],["HAT","🧢"]]},
  {id:"sight",cat:"language",icon:"👀",title:"Sight Words",desc:"Recognise common early reading words.",type:"flash",items:[["I","I"],["AM","am"],["THE","the"],["A","a"],["MY","my"],["SEE","see"],["CAN","can"],["LIKE","like"]]},
  {id:"reading",cat:"language",icon:"📖",title:"Read a Sentence",desc:"Read short sentences with picture clues.",type:"reading",items:[["I see a cat.","🐱"],["The sun is hot.","☀️"],["I like my dog.","🐶"],["The fish can swim.","🐟"],["This is a big bus.","🚌"]]},
  {id:"story",cat:"language",icon:"📚",title:"Mini Story",desc:"Read a tiny story and answer a question.",type:"quiz",q:"Milo has a red ball. What colour is Milo's ball?",a:["Red 🔴","Blue 🔵","Green 🟢"],correct:"Red 🔴"},
  {id:"picture",cat:"language",icon:"🖼️",title:"Match Picture",desc:"Choose the word that matches the picture.",type:"picture",items:[["🐱",["CAT","DOG","SUN"],"CAT"],["🍎",["APPLE","BALL","FISH"],"APPLE"],["🚗",["CAR","HAT","TREE"],"CAR"],["🐟",["FISH","BIRD","BUS"],"FISH"],["🌳",["TREE","MOON","CAT"],"TREE"]]},
  {id:"wordmatch",cat:"language",icon:"🧩",title:"Word & Picture Match",desc:"Match a simple word to its picture.",type:"picture",items:[["DOG",["🐶","🐱","🐟"],"🐶"],["SUN",["🌙","☀️","⭐"],"☀️"],["BALL",["🍎","⚽","🧢"],"⚽"],["BIRD",["🐶","🐦","🐰"],"🐦"]]},
  {id:"count",cat:"math",icon:"🔢",title:"Count the Objects",desc:"Count up to 10.",type:"count"},
  {id:"addition",cat:"math",icon:"➕",title:"Easy Addition",desc:"Add small numbers together.",type:"math",ops:[[2,1,3],[1,3,4],[2,2,4],[3,2,5],[4,1,5],[2,3,5]]},
  {id:"subtraction",cat:"math",icon:"➖",title:"Easy Subtraction",desc:"Take away small numbers.",type:"sub"},
  {id:"shapes",cat:"math",icon:"🔷",title:"Shape Detective",desc:"Find circles, squares, triangles and more.",type:"quiz",q:"Which shape has 3 sides?",a:["🔵 Circle","🔺 Triangle","⬛ Square"],correct:"🔺 Triangle"},
  {id:"patterns",cat:"math",icon:"🟡",title:"Pattern Power",desc:"Find what comes next.",type:"pattern"},
  {id:"compare",cat:"math",icon:"⚖️",title:"More or Less",desc:"Compare groups and numbers.",type:"compare"},
  {id:"time",cat:"math",icon:"⏰",title:"Time Explorer",desc:"Learn simple o'clock times.",type:"quiz",q:"Which clock shows 3 o'clock?",a:["🕒 3:00","🕕 6:00","🕘 9:00"],correct:"🕒 3:00"},
  {id:"money",cat:"math",icon:"🪙",title:"Little Shop",desc:"Count simple coins and prices.",type:"money"},
  {id:"memory",cat:"world",icon:"🧠",title:"Memory Match",desc:"Remember and match picture pairs.",type:"memory"},
  {id:"sorting",cat:"world",icon:"📦",title:"Sort It Out",desc:"Put things into the right group.",type:"sort"},
  {id:"sequence",cat:"world",icon:"🔁",title:"What Happens Next?",desc:"Put a simple action in order.",type:"sequence"},
  {id:"animals",cat:"animal",icon:"🐾",title:"Animal Detective",desc:"50 animal challenges: sounds, bodies, food, movement and homes.",type:"animal50"},
  {id:"animalhabitat",cat:"animal",icon:"🌎",title:"Animal Habitat",desc:"50 habitat missions: where animals live and what they need.",type:"animalhabitat50"},
  {id:"scientist",cat:"science",icon:"🔬",title:"Little Scientist",desc:"50 mini experiments about everyday science.",type:"science50"},
  {id:"scienceexplorer",cat:"science",icon:"🚀",title:"Science Explorer",desc:"50 discovery missions about weather, space, light and nature.",type:"scienceexplorer50"}
];

const animal50=[
 ["sound","🐶","Which animal says BARK?",["Dog 🐶","Cat 🐱","Cow 🐮"],"Dog 🐶","BARK!"],
 ["sound","🐱","Which animal says MEOW?",["Cat 🐱","Lion 🦁","Frog 🐸"],"Cat 🐱","MEOW!"],
 ["sound","🐮","Which animal says MOO?",["Cow 🐮","Dog 🐶","Duck 🦆"],"Cow 🐮","MOO!"],
 ["sound","🦁","Which animal can ROAR?",["Lion 🦁","Rabbit 🐰","Fish 🐟"],"Lion 🦁","ROAR!"],
 ["sound","🐸","Which animal says RIBBIT?",["Frog 🐸","Horse 🐴","Cat 🐱"],"Frog 🐸","RIBBIT!"],
 ["sound","🦆","Which animal says QUACK?",["Duck 🦆","Dog 🐶","Sheep 🐑"],"Duck 🦆","QUACK!"],
 ["sound","🐴","Which animal neighs?",["Horse 🐴","Cow 🐮","Pig 🐷"],"Horse 🐴","NEIGH!"],
 ["sound","🐑","Which animal says BAA?",["Sheep 🐑","Goat 🐐","Duck 🦆"],"Sheep 🐑","BAA!"],
 ["choose","🐘","Which animal has a long trunk?",["Elephant 🐘","Zebra 🦓","Tiger 🐯"],"Elephant 🐘"],
 ["choose","🦒","Which animal has a very long neck?",["Giraffe 🦒","Bear 🐻","Fox 🦊"],"Giraffe 🦒"],
 ["choose","🐢","Which animal has a shell?",["Turtle 🐢","Dog 🐶","Horse 🐴"],"Turtle 🐢"],
 ["choose","🐟","Which animal lives in water and has fins?",["Fish 🐟","Cat 🐱","Chicken 🐔"],"Fish 🐟"],
 ["choose","🦋","Which animal has colourful wings?",["Butterfly 🦋","Elephant 🐘","Cow 🐮"],"Butterfly 🦋"],
 ["choose","🐙","Which animal has eight arms?",["Octopus 🐙","Crab 🦀","Whale 🐳"],"Octopus 🐙"],
 ["choose","🦓","Which animal has black and white stripes?",["Zebra 🦓","Lion 🦁","Camel 🐪"],"Zebra 🦓"],
 ["choose","🐯","Which animal has stripes and sharp claws?",["Tiger 🐯","Rabbit 🐰","Cow 🐮"],"Tiger 🐯"],
 ["choose","🐰","Which animal has long ears?",["Rabbit 🐰","Hippo 🦛","Penguin 🐧"],"Rabbit 🐰"],
 ["choose","🐼","Which animal loves to munch bamboo?",["Panda 🐼","Lion 🦁","Horse 🐴"],"Panda 🐼"],
 ["choose","🐨","Which animal likes eucalyptus leaves?",["Koala 🐨","Tiger 🐯","Duck 🦆"],"Koala 🐨"],
 ["choose","🐪","Which animal can live in a hot desert?",["Camel 🐪","Penguin 🐧","Seal 🦭"],"Camel 🐪"],
 ["choose","🐧","Which animal is built for cold places?",["Penguin 🐧","Camel 🐪","Monkey 🐵"],"Penguin 🐧"],
 ["choose","🦭","Which animal swims and rests on ice?",["Seal 🦭","Giraffe 🦒","Chicken 🐔"],"Seal 🦭"],
 ["choose","🐬","Which animal is a sea mammal?",["Dolphin 🐬","Shark 🦈","Tuna 🐟"],"Dolphin 🐬"],
 ["choose","🐳","Which animal is the biggest here?",["Blue whale 🐳","Rabbit 🐰","Frog 🐸"],"Blue whale 🐳"],
 ["choose","🦅","Which animal can fly high with wings?",["Eagle 🦅","Elephant 🐘","Turtle 🐢"],"Eagle 🦅"],
 ["choose","🐝","Which tiny animal makes honey?",["Bee 🐝","Ant 🐜","Spider 🕷️"],"Bee 🐝"],
 ["choose","🐜","Which tiny animal lives in a colony?",["Ant 🐜","Giraffe 🦒","Whale 🐳"],"Ant 🐜"],
 ["choose","🕷️","How many legs does a spider have?",["8 🕷️","6 🐝","4 🐕"],"8 🕷️"],
 ["choose","🐔","What does a chicken have?",["Feathers 🪶","Fins 🐟","Scales 🐠"],"Feathers 🪶"],
 ["choose","🐊","Which animal has strong jaws and lives near water?",["Crocodile 🐊","Rabbit 🐰","Sheep 🐑"],"Crocodile 🐊"],
 ["choose","🦒","What does a giraffe mostly eat?",["Leaves 🌿","Pizza 🍕","Fish 🐟"],"Leaves 🌿"],
 ["choose","🐮","What does a cow eat?",["Grass 🌱","Chocolate 🍫","Rocks 🪨"],"Grass 🌱"],
 ["choose","🐼","What does a panda eat a lot of?",["Bamboo 🎋","Meat 🍖","Bread 🍞"],"Bamboo 🎋"],
 ["choose","🦁","What kind of food does a lion eat?",["Meat 🍖","Grass 🌱","Berries 🍓"],"Meat 🍖"],
 ["choose","🐸","Where can a frog often be found?",["Pond 💧","Desert 🌵","Iceberg 🧊"],"Pond 💧"],
 ["choose","🐒","Which animal loves to climb trees?",["Monkey 🐒","Whale 🐳","Penguin 🐧"],"Monkey 🐒"],
 ["choose","🐙","Where does an octopus live?",["Ocean 🌊","Farm 🚜","Desert 🌵"],"Ocean 🌊"],
 ["choose","🐝","Where does a bee find flowers?",["Garden 🌸","Ice cave 🧊","Ocean 🌊"],"Garden 🌸"],
 ["choose","🐴","Which animal can run fast on a farm?",["Horse 🐴","Fish 🐟","Frog 🐸"],"Horse 🐴"],
 ["choose","🦆","Which animal has webbed feet for swimming?",["Duck 🦆","Cat 🐱","Rabbit 🐰"],"Duck 🦆"],
 ["choose","🐘","Which animal uses its trunk to grab food?",["Elephant 🐘","Zebra 🦓","Fox 🦊"],"Elephant 🐘"],
 ["choose","🐍","Which animal moves by slithering?",["Snake 🐍","Horse 🐴","Penguin 🐧"],"Snake 🐍"],
 ["choose","🦘","Which animal can hop with strong back legs?",["Kangaroo 🦘","Whale 🐳","Turtle 🐢"],"Kangaroo 🦘"],
 ["choose","🐢","Which animal moves slowly?",["Tortoise 🐢","Cheetah 🐆","Eagle 🦅"],"Tortoise 🐢"],
 ["choose","🐆","Which animal is known for running very fast?",["Cheetah 🐆","Snail 🐌","Koala 🐨"],"Cheetah 🐆"],
 ["choose","🦇","Which animal is active at night and can fly?",["Bat 🦇","Chicken 🐔","Cow 🐮"],"Bat 🦇"],
 ["choose","🐌","Which animal carries its home on its back?",["Snail 🐌","Dog 🐶","Lion 🦁"],"Snail 🐌"],
 ["choose","🦜","Which animal can copy sounds and has feathers?",["Parrot 🦜","Frog 🐸","Rabbit 🐰"],"Parrot 🦜"],
 ["choose","🐐","Which animal has horns and can live on a farm?",["Goat 🐐","Dolphin 🐬","Penguin 🐧"],"Goat 🐐"],
 ["choose","🦊","Which animal has a bushy tail?",["Fox 🦊","Whale 🐳","Frog 🐸"],"Fox 🦊"],

];

const animalHabitat50=[
 ["🐧","Where does a penguin live?",["Cold regions ❄️","Desert 🌵","Farm 🚜"],"Cold regions ❄️"],["🐪","Where does a camel live?",["Desert 🌵","Arctic ❄️","Pond 💧"],"Desert 🌵"],["🐬","Where does a dolphin live?",["Ocean 🌊","Forest 🌳","Farm 🚜"],"Ocean 🌊"],["🐒","Where does a monkey often live?",["Jungle 🌴","Ice cave 🧊","Desert 🌵"],"Jungle 🌴"],["🐄","Where does a cow live?",["Farm 🚜","Ocean 🌊","Arctic ❄️"],"Farm 🚜"],["🦁","Where does a lion often live?",["Savanna 🌾","Ocean 🌊","Snowy city 🏙️"],"Savanna 🌾"],["🐸","Where does a frog often live?",["Pond 💧","Desert 🌵","Glacier 🧊"],"Pond 💧"],["🐻‍❄️","Where does a polar bear live?",["Arctic ❄️","Jungle 🌴","Farm 🚜"],"Arctic ❄️"],["🐙","Where does an octopus live?",["Ocean 🌊","Barn 🚜","Mountain top ⛰️"],"Ocean 🌊"],["🦒","Where does a giraffe live?",["Grassland 🌾","Ocean 🌊","Arctic ❄️"],"Grassland 🌾"],["🐘","Where does an elephant need?",["Water and food 💧🌿","Snow only ❄️","Candy 🍬"],"Water and food 💧🌿"],["🐟","What does a fish need?",["Water 💧","A tree 🌳","Sandwich 🥪"],"Water 💧"],["🐝","What does a bee visit?",["Flowers 🌸","Snowmen ⛄","Cars 🚗"],"Flowers 🌸"],["🐰","What does a rabbit need?",["Food and water 🌿💧","A television 📺","Ice cream 🍦"],"Food and water 🌿💧"],["🦆","Where can ducks swim?",["Pond 💧","Desert 🌵","Volcano 🌋"],"Pond 💧"],["🐢","Where can sea turtles live?",["Ocean 🌊","Farm barn 🚜","Tree top 🌳"],"Ocean 🌊"],["🦭","What place suits a seal?",["Cold ocean 🧊🌊","Hot desert 🌵","Dry farm 🚜"],"Cold ocean 🧊🌊"],["🐪","Why is a camel suited to desert life?",["It can handle dry conditions 🌵","It needs ice all day 🧊","It lives underwater 🌊"],"It can handle dry conditions 🌵"],["🦋","Where can butterflies find food?",["Flower garden 🌸","Deep ocean 🌊","Ice cave 🧊"],"Flower garden 🌸"],["🐠","Which place is best for a tropical fish?",["Warm water 🌊","Snow field ❄️","Dry sand 🌵"],"Warm water 🌊"],["🐺","Where might a wolf live?",["Forest 🌲","Aquarium 🐠","Kitchen 🍳"],"Forest 🌲"],["🦌","Where might a deer live?",["Forest 🌲","Ocean 🌊","Desert dune 🌵"],"Forest 🌲"],["🦜","Where might a parrot live?",["Tropical forest 🌴","Arctic ice ❄️","Deep cave 🪨"],"Tropical forest 🌴"],["🦘","Where is a kangaroo native to?",["Australia 🌏","Arctic ❄️","Moon 🌙"],"Australia 🌏"],["🐨","Where does a koala live?",["Australian woodland 🌿","Ocean 🌊","Desert ice ❄️"],"Australian woodland 🌿"],["🦓","What does a zebra need?",["Grass and water 🌱💧","Candy and soda 🍬🥤","Snow only ❄️"],"Grass and water 🌱💧"],["🐊","Where can crocodiles live?",["Rivers and wetlands 💧","Ice caves 🧊","Dry rooftops 🏠"],"Rivers and wetlands 💧"],["🦈","Where does a shark live?",["Ocean 🌊","Farm 🚜","Forest 🌳"],"Ocean 🌊"],["🐋","Where does a whale live?",["Ocean 🌊","Desert 🌵","Barn 🚜"],"Ocean 🌊"],["🦅","Where can an eagle build a nest?",["High trees or cliffs ⛰️🌳","Underwater 🌊","Inside a shoe 👟"],"High trees or cliffs ⛰️🌳"],["🕷️","Where can a spider make a web?",["On a plant or corner 🌿","Under the sea 🌊","Inside a cloud ☁️"],"On a plant or corner 🌿"],["🐜","Where do ants often live?",["Colony or nest 🐜","Ocean floor 🌊","Iceberg 🧊"],"Colony or nest 🐜"],["🐝","Why do bees need flowers?",["For nectar and pollen 🌸","For snow ❄️","For rocks 🪨"],"For nectar and pollen 🌸"],["🐔","Where does a chicken usually live?",["Farm or coop 🚜","Ocean 🌊","Glacier 🧊"],"Farm or coop 🚜"],["🐑","Where does a sheep live?",["Farm and grassland 🚜🌱","Deep ocean 🌊","Ice cave 🧊"],"Farm and grassland 🚜🌱"],["🐐","Where does a goat often live?",["Farm or rocky hills 🚜⛰️","Ocean 🌊","Snow cave ❄️"],"Farm or rocky hills 🚜⛰️"],["🐧","What helps a penguin in cold water?",["Warm feathers and body fat 🪶","A wool sweater 🧥","A bicycle 🚲"],"Warm feathers and body fat 🪶"],["🐻","What does a bear need in its habitat?",["Food, water and shelter 🍓💧🏕️","A television 📺","A toy car 🚗"],"Food, water and shelter 🍓💧🏕️"],["🦒","Why does a giraffe have a long neck?",["It helps reach high leaves 🌿","It helps swim underwater 🌊","It stores toys 🧸"],"It helps reach high leaves 🌿"],["🐘","Why do elephants visit water?",["To drink and cool down 💧","To fly 🚀","To make snow ❄️"],"To drink and cool down 💧"],["🐬","Why do dolphins need the ocean?",["It is their home 🌊","They grow trees there 🌳","They build nests in sand only 🏜️"],"It is their home 🌊"],["🐒","What can a jungle give monkeys?",["Trees, fruit and shelter 🌴🍌🏠","Snow and ice ❄️","Cars and roads 🚗"],"Trees, fruit and shelter 🌴🍌🏠"],["🦁","What does a savanna give lions?",["Space, water and prey 🌾💧","Ice caves 🧊","Coral reefs 🪸"],"Space, water and prey 🌾💧"],["🐢","What should we do to help wild animals?",["Keep habitats clean 🌿","Leave rubbish everywhere 🗑️","Chase them 🚗"],"Keep habitats clean 🌿"],["🐟","What happens if a pond is dirty?",["Animals can be harmed 💧","Fish get bigger instantly 📈","The pond becomes a desert 🌵"],"Animals can be harmed 💧"],["🌳","Why are trees important to animals?",["They can provide food and shelter 🌳","They make candy 🍬","They remove all water 💧"],"They can provide food and shelter 🌳"],["🌊","Which habitat has salty water?",["Ocean 🌊","Farm 🚜","Forest 🌳"],"Ocean 🌊"],["🌵","Which habitat is very dry?",["Desert 🌵","Pond 💧","Rainforest 🌴"],"Desert 🌵"],["🌴","Which habitat is warm and rainy?",["Rainforest 🌴","Arctic ❄️","Desert 🌵"],"Rainforest 🌴"],["❄️","Which habitat is very cold?",["Arctic ❄️","Savanna 🌾","Tropical reef 🪸"],"Arctic ❄️"]
];

const science50=[
 ["🧊","What happens to ice in a warm place?",["It melts 🫠","It grows 🌱","It flies 🚀"],"It melts 🫠"],["🪶","Which is lighter?",["Feather 🪶","Rock 🪨","Elephant 🐘"],"Feather 🪶"],["🧲","What can a magnet attract?",["Some metal 🧲","Water 💧","Sunlight ☀️"],"Some metal 🧲"],["🌱","What does a plant need to grow?",["Water 💧","A toy 🧸","A shoe 👟"],"Water 💧"],["💧","What happens when water gets very cold?",["It can freeze 🧊","It becomes fire 🔥","It becomes a rock 🪨"],"It can freeze 🧊"],["☀️","What warms Earth?",["The Sun ☀️","A snowball ❄️","A spoon 🥄"],"The Sun ☀️"],["🌧️","What falls from clouds when it rains?",["Water 💧","Sand 🏖️","Leaves 🍂"],"Water 💧"],["🌬️","Can we see air?",["Not usually 👀","Always clearly 👀","Only at night 🌙"],"Not usually 👀"],["🎈","What happens to a balloon when air goes inside?",["It gets bigger 🎈","It melts 🫠","It becomes ice 🧊"],"It gets bigger 🎈"],["🪨","Which feels hard?",["Rock 🪨","Cloud ☁️","Soap bubble 🫧"],"Rock 🪨"],["🧽","Which can soak up water?",["Sponge 🧽","Stone 🪨","Plastic ball ⚽"],"Sponge 🧽"],["🚢","Why can a boat float?",["It pushes water aside 🌊","It is always lighter than air ☁️","It has wings 🪽"],"It pushes water aside 🌊"],["🪵","Which may float in water?",["Wood 🪵","Heavy rock 🪨","Metal block 🔩"],"Wood 🪵"],["🔦","What makes a shadow?",["An object blocks light 💡","Water makes it","Sound makes it"],"An object blocks light 💡"],["🌑","When is a shadow often longest?",["When the light is low 🌅","At noon always ☀️","Inside water 💧"],"When the light is low 🌅"],["👂","Which body part helps us hear?",["Ears 👂","Eyes 👀","Feet 🦶"],"Ears 👂"],["👃","Which sense helps us smell?",["Nose 👃","Knees 🦵","Hair 💇"],"Nose 👃"],["👅","Which sense helps us taste?",["Tongue 👅","Elbow 💪","Ear 👂"],"Tongue 👅"],["✋","Which sense helps us feel texture?",["Touch ✋","Sight 👀","Hearing 👂"],"Touch ✋"],["👀","Which sense helps us see colours?",["Sight 👀","Smell 👃","Taste 👅"],"Sight 👀"],["🧊","Which is colder?",["Ice 🧊","Warm soup 🍲","Sunlight ☀️"],"Ice 🧊"],["🔥","Which is hotter?",["Fire 🔥","Ice 🧊","Snowman ⛄"],"Fire 🔥"],["🧼","Why do we wash hands?",["To remove dirt and germs 🧼","To make them glow ✨","To make them heavier"],"To remove dirt and germs 🧼"],["🦷","What helps keep teeth clean?",["Toothbrush 🪥","Paintbrush 🎨","Fork 🍴"],"Toothbrush 🪥"],["🌱","Which part of a plant grows underground?",["Roots 🌱","Flower 🌸","Fruit 🍎"],"Roots 🌱"],["🌸","Which part can make seeds?",["Flower 🌸","Rock 🪨","Cloud ☁️"],"Flower 🌸"],["☁️","What are clouds made from?",["Tiny water drops 💧","Sand grains 🏖️","Leaves 🍃"],"Tiny water drops 💧"],["🌈","What can make a rainbow appear?",["Sunlight and water 💧☀️","Only rocks 🪨","Only wind 🌬️"],"Sunlight and water 💧☀️"],["🌬️","What can wind move?",["Leaves 🍃","A mountain ⛰️","The Moon 🌙"],"Leaves 🍃"],["🧲","Do all metals stick to a magnet?",["No, only some 🧲","Yes, all","Only plastic"],"No, only some 🧲"],["⚖️","What happens when we push a toy car?",["It moves 🚗","It grows 🌱","It melts 🫠"],"It moves 🚗"],["🚪","What happens when we pull a door?",["It can open 🚪","It becomes water 💧","It flies 🚀"],"It can open 🚪"],["⚽","What can make a ball roll?",["A push 👋","A song 🎵","A colour 🎨"],"A push 👋"],["🪂","What helps a parachute slow down?",["Air 🌬️","Fire 🔥","Ice 🧊"],"Air 🌬️"],["🌙","Does the Moon make its own light?",["No, it reflects sunlight 🌙☀️","Yes, like a lamp","Only at noon"],"No, it reflects sunlight 🌙☀️"],["🌍","What is Earth?",["A planet 🌍","A star ⭐","A cloud ☁️"],"A planet 🌍"],["⭐","What is the Sun?",["A star ☀️","A planet 🪐","A moon 🌙"],"A star ☀️"],["🪐","Which is a planet?",["Saturn 🪐","Sun ☀️","Moon 🌙"],"Saturn 🪐"],["🌡️","What tool measures temperature?",["Thermometer 🌡️","Ruler 📏","Clock ⏰"],"Thermometer 🌡️"],["📏","What tool measures length?",["Ruler 📏","Spoon 🥄","Cup ☕"],"Ruler 📏"],["⏰","What does a clock measure?",["Time ⏰","Weight ⚖️","Temperature 🌡️"],"Time ⏰"],["🪴","What can happen if a plant gets no water?",["It can wilt 🥀","It grows faster","It becomes metal"],"It can wilt 🥀"],["🍎","What happens to a cut apple left in air?",["It can turn brown 🍎","It becomes ice","It starts singing"],"It can turn brown 🍎"],["🥛","Which is a liquid?",["Milk 🥛","Ice cube 🧊","Rock 🪨"],"Milk 🥛"],["🧊","Which is a solid?",["Ice 🧊","Water 💧","Juice 🧃"],"Ice 🧊"],["💨","Can air push things?",["Yes, wind can push 🌬️","No, never","Only at night"],"Yes, wind can push 🌬️"],["🌿","Which is living?",["Plant 🌿","Rock 🪨","Cup ☕"],"Plant 🌿"],["🪨","Which is non-living?",["Rock 🪨","Tree 🌳","Bird 🐦"],"Rock 🪨"],["🔍","What does a scientist do?",["Ask questions and test ideas 🔬","Only play games","Never observe"],"Ask questions and test ideas 🔬"],["🌱","Which thing can grow when it gets sunlight and water?",["A plant 🌱","A rock 🪨","A spoon 🥄"],"A plant 🌱"]
];

const scienceExplorer50=[
 ["☀️","What gives us light in the daytime?",["The Sun ☀️","A rock 🪨","A fish 🐟"],"The Sun ☀️"],["🌧️","What do we wear when it rains?",["Raincoat 🧥","Swimsuit 🩱","Helmet 🪖"],"Raincoat 🧥"],["🌙","What do we often see at night?",["Moon 🌙","Rainbow 🌈","Sunflower 🌻"],"Moon 🌙"],["👀","Which sense helps us see?",["Eyes 👀","Ears 👂","Nose 👃"],"Eyes 👀"],["🌈","What colours can a rainbow have?",["Many colours 🌈","Only black","Only white"],"Many colours 🌈"],["☁️","What can clouds bring?",["Rain 🌧️","Sand 🏖️","Apples 🍎"],"Rain 🌧️"],["⛈️","What sound can lightning be followed by?",["Thunder ⛈️","Meow 🐱","Buzz 🐝"],"Thunder ⛈️"],["❄️","What is frozen water called?",["Ice ❄️","Steam 💨","Sand 🏖️"],"Ice ❄️"],["💨","What is moving air called?",["Wind 💨","Stone 🪨","Shadow 🌑"],"Wind 💨"],["🌦️","What is weather?",["What the air and sky are like ☀️🌧️","A kind of animal 🐶","A type of food 🍎"],"What the air and sky are like ☀️🌧️"],["🌞","Which is brighter?",["Sun ☀️","Moon 🌙","Rock 🪨"],"Sun ☀️"],["🌙","Does the Moon shine by making its own light?",["No, it reflects sunlight","Yes, like the Sun","Only when cloudy"],"No, it reflects sunlight"],["🌍","What is Earth shaped roughly like?",["A ball 🌍","A flat sheet 📄","A cube 🧊"],"A ball 🌍"],["🚀","What travels into space?",["Rocket 🚀","Submarine 🚢","Tractor 🚜"],"Rocket 🚀"],["🪐","What goes around the Sun?",["Planets 🪐","Only clouds ☁️","Only birds 🐦"],"Planets 🪐"],["🌌","What can we see in the night sky?",["Stars ⭐","Grass 🌱","Fish 🐟"],"Stars ⭐"],["☀️","Why do we have day and night?",["Earth spins 🌍","The Sun turns off","Clouds move the Earth"],"Earth spins 🌍"],["🌍","What is the Moon to Earth?",["A natural satellite 🌙","A star ⭐","A cloud ☁️"],"A natural satellite 🌙"],["🛰️","What can satellites do?",["Send information from space 📡","Grow trees 🌳","Make rainbows"],"Send information from space 📡"],["🌱","Which season can bring new plant growth?",["Spring 🌸","Only winter ❄️","Only night 🌙"],"Spring 🌸"],["🍂","What can happen to leaves in autumn?",["They can change colour 🍂","They turn into fish","They become clouds"],"They can change colour 🍂"],["❄️","Which season is usually coldest?",["Winter ❄️","Summer ☀️","Spring 🌸"],"Winter ❄️"],["☀️","Which season is usually warmest?",["Summer ☀️","Winter ❄️","Autumn 🍂"],"Summer ☀️"],["🌸","What happens to many plants in spring?",["They grow and bloom 🌸","They freeze forever","They disappear"],"They grow and bloom 🌸"],["🌊","What is a wave?",["Moving water 🌊","A mountain ⛰️","A cloud ☁️"],"Moving water 🌊"],["🏖️","What can wind move at a beach?",["Sand 🏖️","A mountain ⛰️","The Sun ☀️"],"Sand 🏖️"],["🌋","What can come from a volcano?",["Lava 🌋","Snow only ❄️","Milk 🥛"],"Lava 🌋"],["⛰️","What is a mountain?",["A high landform ⛰️","A type of cloud","A fish"],"A high landform ⛰️"],["🌳","Why are forests important?",["They provide homes for many living things 🌳","They make plastic","They stop all rain"],"They provide homes for many living things 🌳"],["🌊","Why is clean water important?",["People and animals need it 💧","It makes rocks fly","It makes the Sun colder"],"People and animals need it 💧"],["♻️","What can recycling help with?",["Reducing waste ♻️","Making more rubbish","Making oceans dirty"],"Reducing waste ♻️"],["🌱","What is one way to help plants?",["Give them water 💧","Pull all leaves off","Cover them with plastic"],"Give them water 💧"],["🐝","Why are bees helpful to plants?",["They help pollinate flowers 🌸","They eat all the roots","They make clouds"],"They help pollinate flowers 🌸"],["🦋","What starts as a caterpillar?",["Butterfly 🦋","Elephant 🐘","Fish 🐟"],"Butterfly 🦋"],["🥚","What can hatch from an egg?",["A chick 🐣","A tree 🌳","A cloud ☁️"],"A chick 🐣"],["🌳","Which part of a tree is usually underground?",["Roots 🌱","Leaves 🍃","Fruit 🍎"],"Roots 🌱"],["🌼","What do flowers attract?",["Some insects 🐝","Cars 🚗","Rocks 🪨"],"Some insects 🐝"],["🌊","What happens when rain falls into rivers?",["Water flows onward 💧","The river becomes fire","The river becomes a cloud instantly"],"Water flows onward 💧"],["☀️","What can solar energy come from?",["Sunlight ☀️","Rocks 🪨","Snowballs ❄️"],"Sunlight ☀️"],["💡","What does a lamp need to make light?",["Energy ⚡","Sand 🏖️","Leaves 🍃"],"Energy ⚡"],["🔋","What can a battery provide?",["Electrical energy 🔋","Water 💧","Grass 🌱"],"Electrical energy 🔋"],["📡","What can sound travel through?",["Air 🌬️","Only empty space","Only rocks"],"Air 🌬️"],["🎵","What makes a sound?",["Vibrations 🎵","A colour 🎨","A shadow 🌑"],"Vibrations 🎵"],["🔍","What does observing mean?",["Looking carefully 👀","Closing your eyes","Guessing without looking"],"Looking carefully 👀"],["🧪","What is a fair test?",["Change one thing and compare 🔬","Change everything at once","Do not observe"],"Change one thing and compare 🔬"],["🧠","What should a scientist do after a test?",["Look at the results 📊","Hide the results","Forget the question"],"Look at the results 📊"],["🌡️","What can a thermometer tell us?",["How hot or cold it is 🌡️","How fast we run","How loud music is"],"How hot or cold it is 🌡️"],["🧭","What can a compass help show?",["Direction 🧭","Temperature 🌡️","Weight ⚖️"],"Direction 🧭"],["🌎","Which is part of our natural world?",["Rivers 🌊","Plastic toy 🧸","Computer screen 💻"],"Rivers 🌊"],["⭐","What should a curious explorer do?",["Ask questions and investigate 🔎","Never ask questions","Always guess"],"Ask questions and investigate 🔎"]
];

const trainingState=new Set(JSON.parse(profileGet("trainingDone","[]")));
let currentTraining=null;

function trainingSave(){
  profileSet("trainingDone",JSON.stringify([...trainingState]));
  const done=trainingState.size, pct=Math.round(done/trainingModules.length*100);
  const d=document.getElementById("trainingDone"), t=document.getElementById("trainingProgressText"), bar=document.getElementById("trainingProgressBar");
  if(d)d.textContent=done;if(t)t.textContent=pct+"%";if(bar)bar.style.width=pct+"%";
}
function seriesProgress(id,total=50){
  const n=Math.max(0,Math.min(total,Number(profileGet("moduleProgress:"+id,0))||0));
  return n;
}
function seriesSetProgress(id,n){profileSet("moduleProgress:"+id,Math.max(0,Math.min(50,n)));}
function seriesAdvance(id,current,total=50,message="🎉 Correct!"){
  const next=current+1;
  seriesSetProgress(id,next);
  const el=document.getElementById("trainFeedback"); if(el)el.textContent=message+`  ${next}/${total}`;
  if(next>=total){localStorage.removeItem(pkey("moduleProgress:"+id));trainingComplete(id);return true;}
  return false;
}
function seriesProgressMarkup(id,total=50){
  const n=seriesProgress(id,total),pct=Math.round(n/total*100);
  return `<div class="series-progress"><div><b>Mission Progress</b><span>${n}/${total}</span></div><div class="series-progress-bar"><span style="width:${pct}%"></span></div></div>`;
}

function trainingComplete(id){
  if(trainingState.has(id)) return;
  trainingState.add(id); trainingSave(); earnStar("⭐ Training module complete!");
  trainingFeedback("complete");
  renderTrainingCards();
}
function renderTrainingCards(filter="all"){
  const wrap=document.getElementById("trainingModules"); if(!wrap)return;
  wrap.innerHTML=trainingModules.filter(m=>filter==="all"||m.cat===filter).map((m,i)=>{
    const done=trainingState.has(m.id);
    return `<button class="training-module ${done?"complete":""}" data-training-id="${m.id}">
      <span class="module-icon">${m.icon}</span><span class="module-copy"><b>${m.title}</b><small>${m.desc}</small></span>
      <span class="module-status">${done?"✓ DONE":"PLAY →"}</span>
    </button>`;
  }).join("");
  wrap.querySelectorAll("[data-training-id]").forEach(b=>b.addEventListener("click",()=>openTraining(b.dataset.trainingId)));
}
/* =========================
   TRAINING SOUND ENGINE — robust user-gesture audio
   ========================= */
let trainingSoundOn = bakAudio.training;
let trainingAudioCtx = null;
function trainingAudio(){ if(!bakAudio.training)return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    if(!trainingAudioCtx) trainingAudioCtx=new AC();
    if(trainingAudioCtx.state==='suspended') trainingAudioCtx.resume();
    return trainingAudioCtx;
  }catch(e){return null;}
}
function trainingTone(freq=520,duration=.10,type='sine',gain=.075,delay=0){
  if(!trainingSoundOn)return;
  const ctx=trainingAudio(); if(!ctx)return;
  const now=ctx.currentTime+delay;
  const osc=ctx.createOscillator(), g=ctx.createGain();
  osc.type=type; osc.frequency.setValueAtTime(freq,now);
  g.gain.setValueAtTime(.0001,now);
  g.gain.exponentialRampToValueAtTime(gain,now+.012);
  g.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(g);g.connect(ctx.destination);
  osc.start(now);osc.stop(now+duration+.025);
}
function trainingClickSound(){if(!trainingSoundOn)return;trainingTone(720,.07,'square',.055);}
function trainingStartSound(){ if(!bakAudio.training)return;trainingTone(440,.10,'sine',.065,0);trainingTone(660,.12,'sine',.07,.10);trainingTone(880,.16,'sine',.075,.22);}
function trainingCorrectSound(){trainingTone(660,.11,'sine',.07,0);trainingTone(880,.13,'sine',.075,.11);trainingTone(1100,.20,'sine',.08,.24);}
function trainingWrongSound(){trainingTone(220,.16,'triangle',.065,0);trainingTone(165,.20,'triangle',.06,.14);}
function trainingCompleteSound(){trainingTone(523,.11,'sine',.07,0);trainingTone(659,.11,'sine',.07,.11);trainingTone(784,.13,'sine',.075,.22);trainingTone(1047,.24,'sine',.08,.35);}
function trainingSay(text){ if(!bakAudio.training)return;
  if(!trainingSoundOn || !('speechSynthesis' in window))return;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.rate=.86;u.pitch=1.08;u.volume=1;
    speechSynthesis.speak(u);
  }catch(e){}
}
function trainingFeedback(kind,text){
  if(kind==='correct'){trainingCorrectSound();trainingSay('Correct!');}
  else if(kind==='wrong'){trainingWrongSound();trainingSay('Wrong. Try again!');}
  else if(kind==='complete'){trainingCompleteSound();trainingSay('Great job! Module complete!');}
  if(text){const el=document.getElementById('trainFeedback');if(el)el.textContent=text;}
}
// Prime/resume Web Audio on the first real user interaction.
document.addEventListener('pointerdown',()=>{if(trainingSoundOn)trainingAudio();},{once:false,passive:true});
function speakTraining(text){speak(text);}

function openTraining(id){
  currentTraining=trainingModules.find(m=>m.id===id); if(!currentTraining)return;
  const modal=document.getElementById("trainingModal"), body=document.getElementById("trainingModalBody");
  modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");
  body.innerHTML=trainingTemplate(currentTraining);
  const soundToggle=document.getElementById("trainingSoundToggle");
  if(soundToggle){
    soundToggle.onclick=(ev)=>{
      ev.stopPropagation();
      trainingSoundOn=!trainingSoundOn;
      bakAudio.training=trainingSoundOn;
      localStorage.setItem('bakawaliTrainingSoundOn',trainingSoundOn?'1':'0');
      updateAudioButtons();
      soundToggle.textContent=trainingSoundOn?"🔊 Sound ON":"🔇 Sound OFF";
      soundToggle.setAttribute("aria-pressed",String(trainingSoundOn));
      if(trainingSoundOn){trainingStartSound();trainingSay("Sound on");}else if("speechSynthesis" in window)speechSynthesis.cancel();
    };
  }
  trainingStartSound();
  setTimeout(()=>trainingSay("Let’s learn " + currentTraining.title),120);
  wireTraining(currentTraining);
}
function closeTraining(){
  const m=document.getElementById("trainingModal");if(m){m.classList.add("hidden");m.setAttribute("aria-hidden","true");}
  currentTraining=null;
}
function trainingTemplate(m){
  const head=`<div class="training-activity-head"><span class="eyebrow">${m.cat==="language"?"LANGUAGE":m.cat==="math"?"MATH":"EXPLORER"}</span><h3>${m.icon} ${m.title}</h3><p>${m.desc}</p><button type="button" class="secondary training-sound-toggle" id="trainingSoundToggle" aria-pressed="true">🔊 Sound ON</button></div>`;
  if(m.type==="flash") return head+`<div class="flash-stage" id="trainingStage"></div><div class="activity-actions"><button class="secondary" id="trainHear">🔊 Hear</button><button class="primary" id="trainNext">NEXT →</button></div>`;
  if(m.type==="quiz") return head+`<div class="activity-question">${m.q}</div><div class="activity-options">${m.a.map(x=>`<button data-correct="${x===m.correct}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback"></p>`;
  if(m.type==="spell") return head+`<div id="spellStage"></div>`;
  if(m.type==="reading") return head+`<div class="reading-stage" id="readingStage"></div><div class="activity-actions"><button class="secondary" id="readHear">🔊 Read aloud</button><button class="primary" id="readNext">NEXT →</button></div>`;
  if(m.type==="picture") return head+`<div id="pictureStage"></div>`;
  if(m.type==="count") return head+`<div id="countStage"></div>`;
  if(m.type==="math") return head+`<div id="mathStage"></div>`;
  if(m.type==="sub") return head+`<div id="subStage"></div>`;
  if(m.type==="pattern") return head+`<div id="patternStage"></div>`;
  if(m.type==="compare") return head+`<div id="compareStage"></div>`;
  if(m.type==="money") return head+`<div id="moneyStage"></div>`;
  if(m.type==="memory") return head+`<div id="memoryStage"></div>`;
  if(m.type==="sort") return head+`<div id="sortStage"></div>`;
  if(m.type==="sequence") return head+`<div id="sequenceStage"></div>`;
  if(m.type==="animal50") return head+`<div id="animalStage"></div>`;
  if(m.type==="animalhabitat50") return head+`<div id="animalHabitatStage"></div>`;
  if(m.type==="science50") return head+`<div id="scienceStage"></div>`;
  if(m.type==="scienceexplorer50") return head+`<div id="scienceExplorerStage"></div>`;
  return head;
}

function doneActivity(id,feedback="🎉 Great job!"){
  const el=document.getElementById("trainFeedback");if(el)el.textContent=feedback;
  trainingComplete(id);
}

function wireTraining(m){
  document.querySelectorAll('#trainingModalBody button').forEach(btn=>btn.addEventListener('click',()=>{if(btn.id!=='trainingSoundToggle')trainingClickSound()},{once:false}));
  if(m.type==="flash"){
    let i=0;const stage=document.getElementById("trainingStage");
    const show=()=>{const [a,b]=m.items[i%m.items.length];stage.innerHTML=`<div class="flash-card"><strong>${a}</strong><span>${b}</span></div>`;speakTraining(a+" "+b);};
    show();document.getElementById("trainHear").onclick=show;
    document.getElementById("trainNext").onclick=()=>{i++;if(i>=m.items.length){doneActivity(m.id,"🌟 Module complete!");i=0;}show();};
  }
  if(m.type==="quiz"){
      document.querySelectorAll(".activity-options button").forEach(b=>b.onclick=()=>{
        const good=b.dataset.correct==="true";
        if(good){trainingFeedback("correct","🎉 Correct!");trainingComplete(m.id);document.querySelectorAll(".activity-options button").forEach(x=>x.disabled=true);}
        else trainingFeedback("wrong","Try again! 💪");
      });
   }
   if(m.type==="spell"){
    let i=0;const stage=document.getElementById("spellStage");
    const show=()=>{
      const [word,pic]=m.words[i%m.words.length];
      const shuffled=[...word].sort(()=>Math.random()-.5);
      stage.innerHTML=`<div class="spell-picture">${pic}</div><div class="spell-word" id="spellWordDisplay">${word.split("").map(()=>"_").join(" ")}</div><div class="letter-choices">${shuffled.map((l,j)=>`<button type="button" data-letter="${l}" data-pos="${j}">${l}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Spell the word: ${word}</p>`;
      let chosen=[];
      const updateDisplay=()=>{document.getElementById("spellWordDisplay").innerHTML=word.split("").map((_,idx)=>chosen[idx]||"_").join(" ");};
      stage.querySelectorAll(".letter-choices button").forEach(b=>b.onclick=()=>{
        if(b.disabled)return;
        trainingClickSound();
        const expected=word[chosen.length];
        b.classList.add(b.dataset.letter===expected?"letter-selected":"letter-wrong");
        if(b.dataset.letter!==expected){
          trainingFeedback("wrong","❌ Wrong letter. Try again!");
          b.classList.add("wrong-choice");
          setTimeout(()=>{b.classList.remove("letter-wrong","wrong-choice");},450);
          return;
        }
        chosen.push(b.dataset.letter);
        b.disabled=true;
        updateDisplay();
        document.getElementById("trainFeedback").textContent=chosen.length===word.length?"🎉 Spelled correctly!":"Great! Keep going!";
        if(chosen.length===word.length){
          trainingFeedback("correct","🎉 Spelled correctly!");
          stage.querySelectorAll(".letter-choices button").forEach(x=>x.disabled=true);
          trainingComplete(m.id);
          setTimeout(()=>{i++;show()},700);
        }
      });
    };show();
  }
  if(m.type==="reading"){
    let i=0;const stage=document.getElementById("readingStage");
    const show=()=>{const [s,p]=m.items[i%m.items.length];stage.innerHTML=`<div class="reading-card"><span>${p}</span><strong>${s}</strong></div>`;};
    show();document.getElementById("readHear").onclick=()=>{const [s]=m.items[i%m.items.length];speakTraining(s);};
    document.getElementById("readNext").onclick=()=>{i++;if(i>=m.items.length){trainingComplete(m.id,"📖 Reading complete!");i=0;}show();};
  }
  if(m.type==="picture"){
    let i=0;const stage=document.getElementById("pictureStage");
    const show=()=>{const item=m.items[i%m.items.length];const [pic,opts,correct]=item;stage.innerHTML=`<div class="picture-big">${pic}</div><div class="activity-options">${opts.map(x=>`<button data-choice="${x}" data-correct="${x===correct}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Which word matches?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.correct==="true"){b.disabled=true;trainingFeedback("correct","🎉 Match!");trainingComplete(m.id);setTimeout(()=>{i++;show()},450)}else trainingFeedback("wrong","Look again 👀");});};show();
  }
  if(m.type==="count"){
    let n=3;const stage=document.getElementById("countStage");const show=()=>{const opts=[n,n+1,n-1].sort(()=>Math.random()-.5);stage.innerHTML=`<div class="count-objects">${"🍎".repeat(n)}</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===n}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">How many apples?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🎉 Correct!");trainingComplete(m.id);n=n>=9?3:n+1;setTimeout(show,500)}else trainingFeedback("wrong","Count again ☝️");});};show();
  }
  if(m.type==="math"){
    let i=0;const stage=document.getElementById("mathStage");const show=()=>{const [a,b,c]=m.ops[i%m.ops.length];const opts=[c,c+1,Math.max(0,c-1)].sort(()=>Math.random()-.5);stage.innerHTML=`<div class="math-question">${a} + ${b} = ?</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===c}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Add the numbers.</p>`;stage.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{if(btn.dataset.c==="true"){trainingFeedback("correct","🎉 Correct!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Try counting the two groups.");});};show();
  }
  if(m.type==="sub"){
    const qs=[[5,2,3],[6,1,5],[7,3,4],[8,2,6],[5,1,4]];let i=0;const stage=document.getElementById("subStage");const show=()=>{const [a,b,c]=qs[i%qs.length];const opts=[c,c+1,Math.max(0,c-1)].sort(()=>Math.random()-.5);stage.innerHTML=`<div class="math-question">${a} − ${b} = ?</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===c}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Take away ${b}.</p>`;stage.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{if(btn.dataset.c==="true"){trainingFeedback("correct","🎉 Correct!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Try again!");});};show();
  }
  if(m.type==="pattern"){
    const patterns=[["🔴","🔵","🔴","🔵",["🔴","🟢","🟡"],"🔴"],["⭐","🌙","⭐","🌙",["⭐","☀️","🌙"],"⭐"],["🍎","🍎","🍌","🍎","🍎",["🍌","🍎","🍊"],"🍌"]];let i=0;const stage=document.getElementById("patternStage");const show=()=>{const p=patterns[i%patterns.length];const answer=p[p.length-1];const opts=p[p.length-2];stage.innerHTML=`<div class="pattern-row">${p.slice(0,-2).map(x=>`<span>${x}</span>`).join("")}<span>❓</span></div><div class="activity-options">${opts.map(x=>`<button data-c="${x===answer}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">What comes next?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🎉 Pattern complete!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Look at the repeating pattern.");});};show();
  }
  if(m.type==="compare"){
    let i=0;const qs=[[3,5],[7,4],[2,6],[8,8]];const stage=document.getElementById("compareStage");const show=()=>{const [a,b]=qs[i%qs.length];const ans=a===b?"SAME":a>b?"LEFT":"RIGHT";stage.innerHTML=`<div class="compare-row"><span>${"🍎".repeat(a)}</span><span>${"🍎".repeat(b)}</span></div><div class="activity-options"><button data-a="LEFT">👈 More</button><button data-a="SAME">⚖️ Same</button><button data-a="RIGHT">More 👉</button></div><p class="activity-feedback" id="trainFeedback">Which side has more?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.a===ans){trainingFeedback("correct","🎉 Correct!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Count the apples again.");});};show();
  }
  if(m.type==="money"){
    const qs=[[1,2,3],[2,2,4],[1,1,2],[2,1,3]];let i=0;const stage=document.getElementById("moneyStage");const show=()=>{const [a,b,c]=qs[i%qs.length];stage.innerHTML=`<div class="money-coins">🪙 ${a} + 🪙 ${b} = ?</div><div class="activity-options">${[c,c+1,c+2].map(x=>`<button data-c="${x===c}">${x} coins</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">How many coins?</p>`;stage.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{if(btn.dataset.c==="true"){trainingFeedback("correct","🪙 Great counting!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Count the coins.");});};show();
  }
  if(m.type==="memory"){
    const cards=["🐶","🐱","🐟","🐶","🐱","🐟"].sort(()=>Math.random()-.5);let open=[],matched=0;const stage=document.getElementById("memoryStage");const draw=()=>{stage.innerHTML=`<div class="memory-grid">${cards.map((x,i)=>`<button class="memory-card" data-i="${i}">${open.includes(i)?"<span>"+x+"</span>":"❔"}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Find all 3 pairs.</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);if(open.includes(i))return;open.push(i);draw();if(open.length===2){const [a,c]=open;if(cards[a]===cards[c]){matched++;trainingFeedback("correct","🎉 Pair!");open=[];if(matched===3)trainingComplete(m.id,"🧠 Memory master!");}else setTimeout(()=>{open=[];draw()},650)}});};draw();
  }
  if(m.type==="sort"){
    const qs=[["🍎","FRUIT",["FRUIT","ANIMAL","TOY"]],["🐶","ANIMAL",["TOY","ANIMAL","FRUIT"]],["⚽","TOY",["FRUIT","TOY","ANIMAL"]]];let i=0;const stage=document.getElementById("sortStage");const show=()=>{const [item,ans,opts]=qs[i%qs.length];stage.innerHTML=`<div class="sort-item">${item}</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===ans}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Where does it belong?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🎉 Sorted!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Try another group.");});};show();
  }
  if(m.type==="sequence"){
    const qs=[["Wake up 🌞","Brush teeth 🪥","Eat breakfast 🍳","Go to bed 🛏️",1],["Plant seed 🌱","Water it 💧","It grows 🌿","Pick flower 🌸",2]];let i=0;const stage=document.getElementById("sequenceStage");const show=()=>{const q=qs[i%qs.length];const order=[q[0],q[1],q[2],q[3]];const correct=q[4];stage.innerHTML=`<div class="sequence-card"><p>What happens <b>first</b>?</p>${order.map((x,j)=>`<button data-c="${j===correct}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Choose the first step.</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🎉 Good thinking!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Think about what happens first.");});};show();
  }
  if(m.type==="animal50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("animalStage");
    const show=()=>{const q=animal50[i%50]; const [kind,icon,prompt,opts,ans,sound]=q; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="animal-live-card"><div class="animal-sky"><div class="animal-sun"></div><div class="animal-cloud"></div><div class="animal-ground"></div><button class="animal-character" id="animalSound" type="button" aria-label="Hear animal">${icon}</button></div><div class="animal-name">Animal Mission ${i+1}<span>${prompt}</span></div><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Listen to the animal, then choose. ${i}/50</p></div>`;
      const sayAnimal=()=>{trainingClickSound();trainingSay(sound);};
      document.getElementById("animalSound").onclick=sayAnimal;
      setTimeout(sayAnimal,120);
      stage.querySelectorAll(".activity-options button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){b.classList.add("correct-choice");trainingFeedback("correct","🎉 Correct! "+sound);i++;const finished=seriesAdvance(m.id,i-1,50,"🎉 Correct!");if(!finished)setTimeout(show,650)}else{b.classList.add("wrong-choice");trainingFeedback("wrong","Wrong. Try again! 👂");}});
    }; show();
  }
  if(m.type==="animalhabitat50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("animalHabitatStage");
    const show=()=>{const [icon,q,opts,ans]=animalHabitat50[i%50]; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="habitat-live"><div class="habitat-animal">${icon}</div><h3>Mission ${i+1}: ${q}</h3><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Choose the best answer. ${i}/50</p></div>`;
      stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🎉 Correct habitat thinking!");i++;const finished=seriesAdvance(m.id,i-1,50,"🎉 Correct!");if(!finished)setTimeout(show,550)}else trainingFeedback("wrong","Wrong. Try again!");});
    };show();
  }
  if(m.type==="science50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("scienceStage");
    const show=()=>{const [icon,q,opts,ans]=science50[i%50]; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="science-lab"><div class="science-object">${icon}</div><h3>Mission ${i+1}: ${q}</h3><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Think like a little scientist. ${i}/50</p></div>`;
      stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🔬 Correct! Great science thinking!");i++;const finished=seriesAdvance(m.id,i-1,50,"🔬 Correct!");if(!finished)setTimeout(show,550)}else trainingFeedback("wrong","Wrong. Test your idea again!");});
    };show();
  }
  if(m.type==="scienceexplorer50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("scienceExplorerStage");
    const show=()=>{const [icon,q,opts,ans]=scienceExplorer50[i%50]; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="science-explorer"><div class="space-object">${icon}</div><h3>Mission ${i+1}: ${q}</h3><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Explore and choose. ${i}/50</p></div>`;
      stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🚀 Correct! Explorer level up!");i++;const finished=seriesAdvance(m.id,i-1,50,"🚀 Correct!");if(!finished)setTimeout(show,550)}else trainingFeedback("wrong","Wrong. Try another answer!");});
    };show();
  }
}


function openProfilePicker(){
  const modal=document.getElementById("profileModal"); if(!modal)return;
  const list=document.getElementById("profileList");
  list.innerHTML=profileState.profiles.map(p=>`<button type="button" class="profile-card ${p.id===activeProfile.id?"active":""}" data-profile-id="${p.id}"><span class="profile-avatar">${p.avatar||"🧢"}</span><span><b>${p.name}</b><small>Level ${Math.floor(Number(profileGetFor(p,"stars",p.stars||0))/3)+1}</small></span><span>▶</span></button>`).join("");
  list.querySelectorAll("[data-profile-id]").forEach(b=>b.onclick=()=>switchProfile(b.dataset.profileId));
  modal.classList.remove("hidden");
}
function profileGetFor(p,k,fallback){const v=localStorage.getItem("bakawali:"+p.id+":"+k);return v===null?fallback:v;}
function switchProfile(id){
  const p=profileState.profiles.find(x=>x.id===id);if(!p)return;
  localStorage.setItem(ACTIVE_PROFILE_KEY,p.id); location.reload();
}
function addProfile(name,avatar="🧢"){
  const clean=String(name||"").trim().slice(0,18);if(!clean)return;
  const id="p"+Date.now().toString(36);
  profileState.profiles.push({id,name:clean,avatar,created:Date.now(),stars:0,badges:0});
  localStorage.setItem(PROFILE_KEY,JSON.stringify(profileState.profiles));localStorage.setItem(ACTIVE_PROFILE_KEY,id);location.reload();
}
function initProfiles(){
  const btn=document.getElementById("profileButton"),close=document.getElementById("profileClose"),form=document.getElementById("profileCreateForm");
  if(btn)btn.onclick=openProfilePicker;if(close)close.onclick=()=>document.getElementById("profileModal").classList.add("hidden");
  if(form)form.onsubmit=e=>{e.preventDefault();const input=document.getElementById("profileNameInput");addProfile(input.value);};
  refreshProfileLabel();
}

document.addEventListener("DOMContentLoaded",()=>{
  initProfiles();
  const trainingRoot=document.getElementById("trainingModal");
  if(trainingRoot){trainingRoot.addEventListener("click",e=>{const btn=e.target.closest("button");if(btn&&!btn.id.includes("trainingSoundToggle")){trainingClickSound();}});}

  const modal=document.getElementById("trainingModal");
  const close=document.getElementById("trainingClose");
  if(close)close.onclick=closeTraining;
  if(modal){
    modal.addEventListener("click",e=>{
      if(e.target===modal){closeTraining();return;}
      const btn=e.target.closest("button");
      if(btn && !btn.disabled) trainingClickSound();
    });
  }
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.classList.contains("hidden"))closeTraining();});
  document.querySelectorAll(".training-filter").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".training-filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTrainingCards(b.dataset.filter);
  }));
  renderTrainingCards("all");trainingSave();
});
document.addEventListener("DOMContentLoaded",()=>{
  const safe=(fn)=>{try{fn()}catch(e){console.error("Bakawali game error:",e)}};

  safe(()=>{
    const choices=document.querySelectorAll(".game-choice-v2");
    const panels=document.querySelectorAll(".game-panel-v2");
    choices.forEach(btn=>btn.addEventListener("click",()=>{
      document.body.classList.remove("runner-fullscreen");
      choices.forEach(x=>{x.classList.remove("active");x.setAttribute("aria-selected","false")});
      panels.forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      btn.setAttribute("aria-selected","true");
      const panel=document.getElementById(btn.dataset.gamePanel);
      if(panel){
        panel.classList.add("active");
        const frame = panel.querySelector("#astraeaFrame");
        if(frame && frame.src.endsWith("about:blank")){
          frame.src = frame.dataset.src;
        }
        window.dispatchEvent(new Event("resize"));
      }
    }));
    const astraeaClose = document.getElementById("astraeaClose");
    if(astraeaClose){
      astraeaClose.addEventListener("click",()=>{
        const frame=document.getElementById("astraeaFrame");
        if(frame) frame.src='about:blank';
        const first=choices[0];
        if(first) first.click();
      });
    }
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
  const fullBtn=document.getElementById('runnerFullBtn');
  let W=900,H=500,dpr=1,raf=0,state='start',score=0,best=Number(localStorage.getItem('bakawaliRunnerBest')||0),energy=100,speed=5,frame=0,obs=[],starsR=[],particles=[];
  const player={x:100,y:0,w:38,h:50,vy:0,jumps:0,dashing:0};
  if(bestEl) bestEl.textContent=Math.floor(best);
  function resize(){
    const r=wrap.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,2);
    W=Math.max(320,Math.floor(r.width));
    H=Math.max(280,Math.floor(r.height));
    canvas.width=W*dpr;
    canvas.height=H*dpr;
    canvas.style.width='100%';
    canvas.style.height='100%';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(state==='start'||state==='over')player.y=ground()-player.h;
  }
  function ground(){return H-62}
  window.addEventListener('resize',resize); resize();
  function reset(){score=0;energy=100;speed=5;frame=0;obs=[];starsR=[];particles=[];player.x=100;player.y=ground()-player.h;player.vy=0;player.jumps=0;player.dashing=0;hud();}
  function hud(){scoreEl.textContent=Math.floor(score);energyEl.textContent=Math.floor(energy)}
  function jump(){if(state!=='play')return;if(player.jumps<2){player.vy=-12;player.jumps++;tone(520,.07,'square',.03,'game');tone(760,.08,'square',.025,'game',.05)}}
  function dash(){if(state!=='play'||energy<30||player.dashing)return;energy-=30;player.dashing=18;hud();tone(180,.16,'sawtooth',.035,'game');tone(360,.12,'sawtooth',.025,'game',.08)}
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
    for(let i=obs.length-1;i>=0;i--){const o=obs[i];o.x-=speed;const b={x:o.x,y:ground()-o.h,w:o.w,h:o.h};if(rect(player,b)){if(player.dashing){gameHitSound();burst(o.x+o.w/2,ground()-o.h/2,'#ec4899',15);obs.splice(i,1);score+=20}else{return gameOver()}}if(o.x+o.w<-30)obs.splice(i,1)}
    for(let i=starsR.length-1;i>=0;i--){const s=starsR[i];s.x-=speed;s.p+=.1;if(Math.hypot(player.x+player.w/2-s.x,player.y+player.h/2-s.y)<28){score+=15;energy=Math.min(100,energy+18);gameCollectSound();burst(s.x,s.y,'#ffd83d',10);starsR.splice(i,1)}else if(s.x<-30)starsR.splice(i,1)}
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
  function enterRunnerMode(){document.body.classList.add('runner-fullscreen');setTimeout(resize,60)}
  function exitRunnerMode(){document.body.classList.remove('runner-fullscreen');setTimeout(resize,60)}
  async function toggleBrowserFullscreen(){
    try{
      if(!document.fullscreenElement){await document.documentElement.requestFullscreen()}
      else{await document.exitFullscreen()}
    }catch(e){}
  }
  function startGame(){cancelAnimationFrame(raf);reset();state='play';start.classList.add('hidden');over.classList.add('hidden');pause.classList.add('hidden');enterRunnerMode();loop()}
  function gameOver(){state='over';cancelAnimationFrame(raf);if(score>best){best=score;localStorage.setItem('bakawaliRunnerBest',best);bestEl.textContent=Math.floor(best)}finalEl.textContent=Math.floor(score);over.classList.remove('hidden');draw()}
  function togglePause(){if(state==='play'){state='pause';pause.classList.remove('hidden');cancelAnimationFrame(raf)}else if(state==='pause'){state='play';pause.classList.add('hidden');loop()}}
  document.getElementById('runnerStartBtn').onclick=startGame;
document.getElementById('runnerStartBtn').addEventListener('pointerup',()=>startGame(),{passive:true});
  document.getElementById('runnerAgain').onclick=startGame;
  document.getElementById('runnerResume').onclick=togglePause;
  document.getElementById('runnerPauseBtn').onclick=togglePause;
  document.getElementById('runnerJump').onclick=jump;
  document.getElementById('runnerDash').onclick=dash;
  if(fullBtn) fullBtn.onclick=toggleBrowserFullscreen;
  window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump()}if(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyX'){e.preventDefault();dash()}if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause()}});
  draw();
})();

// Leave runner viewport mode when another main navigation item is selected.
document.querySelectorAll('[data-go]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(btn.dataset.go !== 'games') document.body.classList.remove('runner-fullscreen');
  });
});


// ---------------- Spin Quest ----------------
(() => {
  const wheel=document.getElementById('spinWheel');
  const spinBtn=document.getElementById('spinBtn');
  const claimBtn=document.getElementById('spinClaim');
  const result=document.getElementById('spinResult');
  const challenge=document.getElementById('spinChallenge');
  const challengeText=document.getElementById('spinChallengeText');
  const spinStars=document.getElementById('spinStars');
  if(!wheel||!spinBtn||!claimBtn)return;

  const rewards=[
    {label:'⭐ +5 Stars',stars:5},
    {label:'💎 +2 Gems',gems:2},
    {label:'⚡ Energy Boost',energy:25},
    {label:'⭐ +10 Stars',stars:10},
    {label:'🛡️ Shield Reward',shield:1},
    {label:'💎 +5 Gems',gems:5},
    {label:'🎯 Mini Challenge',challenge:true},
    {label:'⭐ +3 Stars',stars:3}
  ];
  const challenges=['Jump 3 times in Sky Runner.','Collect 5 Stars in Sky Runner.','Try a Dash through one obstacle.'];
  let angle=0, selected=null, spinning=false;
  const getStars=()=>Number(localStorage.getItem('bakawaliStars')||0);
  const update=()=>spinStars.textContent=getStars();
  update();

  spinBtn.addEventListener('click',()=>{
    if(spinning)return;
    spinning=true;selected=Math.floor(Math.random()*rewards.length);gameClickSound();
    const slice=360/rewards.length;
    // Pointer is at top. Land the selected slice under the pointer.
    const target=(360-(selected*slice+slice/2))%360;
    angle += 1440 + target;
    wheel.style.transform=`rotate(${angle}deg)`;
    spinBtn.disabled=true;claimBtn.disabled=true;challenge.classList.add('hidden');
    result.textContent='🎡 Spinning...';
    setTimeout(()=>{
      const r=rewards[selected];
      result.textContent=r.label;
      claimBtn.disabled=false;spinning=false;
      if(r.challenge){challenge.classList.remove('hidden');challengeText.textContent=challenges[Math.floor(Math.random()*challenges.length)];}
    },3700);
  });

  claimBtn.addEventListener('click',()=>{
    if(selected===null)return;
    const r=rewards[selected];
    let msg='🎉 Reward collected!';
    if(r.stars){stars+=r.stars;localStorage.setItem('bakawaliStars',stars);renderStats();msg=`⭐ +${r.stars} Stars collected!`;}
    if(r.gems){const g=Number(localStorage.getItem('bakawaliGems')||0)+r.gems;localStorage.setItem('bakawaliGems',g);msg=`💎 +${r.gems} Gems collected!`;}
    if(r.energy){msg='⚡ Energy Boost unlocked for your next run!';}
    if(r.shield){msg='🛡️ Shield earned!';}
    if(r.challenge){msg='🎯 Challenge unlocked!';}
    result.textContent=msg;claimBtn.disabled=true;spinBtn.disabled=false;selected=null;update();
    if(typeof toast!=='undefined'){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);}
  });
})();

// ---------------- Bakawali Block Drop ----------------
(() => {
  const canvas=document.getElementById('blockCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const start=document.getElementById('blockStart');
  const over=document.getElementById('blockOver');
  const pause=document.getElementById('blockPause');
  const scoreEl=document.getElementById('blockScore');
  const linesEl=document.getElementById('blockLines');
  const levelEl=document.getElementById('blockLevel');
  const bestEl=document.getElementById('blockBest');
  const finalEl=document.getElementById('blockFinal');
  const nextPreview=document.getElementById('blockNextPreview');
  const COLS=10, ROWS=18;
  const colors=['#58c7e8','#ffd83d','#d67cff','#67d68a','#ff8a65','#6e8cff','#ff6fae'];
  const shapes=[
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]]
  ];
  let board=[],piece=null,next=null,state='start',score=0,lines=0,level=1,dropCounter=0,lastTime=0,raf=0;
  let best=Number(localStorage.getItem('bakawaliBlockBest')||0);bestEl.textContent=best;

  function resetBoard(){board=Array.from({length:ROWS},()=>Array(COLS).fill(0));score=0;lines=0;level=1;dropCounter=0;lastTime=performance.now();piece=makePiece();next=makePiece();updateHud();draw();}
  function makePiece(){const id=Math.floor(Math.random()*shapes.length);return {shape:shapes[id].map(r=>r.slice()),color:colors[id],x:Math.floor(COLS/2)-Math.ceil(shapes[id][0].length/2),y:0};}
  function cloneShape(s){return s.map(r=>r.slice())}
  function collide(p,dx=0,dy=0,shape=p.shape){for(let y=0;y<shape.length;y++)for(let x=0;x<shape[y].length;x++)if(shape[y][x]){const nx=p.x+x+dx,ny=p.y+y+dy;if(nx<0||nx>=COLS||ny>=ROWS)return true;if(ny>=0&&board[ny][nx])return true;}return false;}
  function merge(){piece.shape.forEach((row,y)=>row.forEach((v,x)=>{if(v&&piece.y+y>=0)board[piece.y+y][piece.x+x]=piece.color;}));}
  function clearLines(){let cleared=0;outer:for(let y=ROWS-1;y>=0;y--){for(let x=0;x<COLS;x++)if(!board[y][x])continue outer;board.splice(y,1);board.unshift(Array(COLS).fill(0));cleared++;y++;}if(cleared){lines+=cleared;score += [0,100,300,500,800][cleared]*level;level=1+Math.floor(lines/5);updateHud();}}
  function spawn(){piece=next;piece.x=Math.floor(COLS/2)-Math.ceil(piece.shape[0].length/2);piece.y=0;next=makePiece();if(collide(piece)){gameOver();}drawNext();}
  function lock(){merge();clearLines();spawn();}
  function move(dx){if(state!=='play')return;if(!collide(piece,dx,0)){piece.x+=dx;gameClickSound();draw();}}
  function soft(){if(state!=='play')return;if(!collide(piece,0,1)){piece.y++;score++;}else lock();updateHud();draw();}
  function rotate(){if(state!=='play')return;const old=piece.shape;const rotated=old[0].map((_,i)=>old.map(row=>row[i]).reverse());const oldX=piece.x;for(const kick of [0,-1,1,-2,2]){piece.shape=rotated;piece.x=oldX+kick;if(!collide(piece)){draw();return;}}piece.shape=old;piece.x=oldX;}
  function hardDrop(){if(state!=='play')return;gameClickSound();let d=0;while(!collide(piece,0,1)){piece.y++;d++;}score+=d*2;lock();updateHud();draw();}
  function updateHud(){scoreEl.textContent=score;linesEl.textContent=lines;levelEl.textContent=level;}
  function resize(){const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(r.width*dpr);canvas.height=Math.floor(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  window.addEventListener('resize',resize);
  function drawCell(x,y,color,size){ctx.fillStyle=color;ctx.fillRect(x*size,y*size,size-1,size-1);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x*size+2,y*size+2,size-5,4);}
  function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;ctx.clearRect(0,0,w,h);const size=Math.min(w/COLS,h/ROWS),ox=(w-size*COLS)/2,oy=(h-size*ROWS)/2;ctx.save();ctx.translate(ox,oy);ctx.fillStyle='#081824';ctx.fillRect(0,0,size*COLS,size*ROWS);ctx.strokeStyle='rgba(150,200,220,.07)';for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*size,0);ctx.lineTo(x*size,ROWS*size);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*size);ctx.lineTo(COLS*size,y*size);ctx.stroke()}board.forEach((row,y)=>row.forEach((c,x)=>c&&drawCell(x,y,c,size)));if(piece&&state!=='over'){piece.shape.forEach((row,y)=>row.forEach((v,x)=>v&&drawCell(piece.x+x,piece.y+y,piece.color,size)));}ctx.restore();}
  function drawNext(){nextPreview.innerHTML='';const c=document.createElement('canvas');c.width=110;c.height=80;nextPreview.appendChild(c);const nctx=c.getContext('2d'),s=18;const sh=next.shape;const ox=(110-sh[0].length*s)/2,oy=(80-sh.length*s)/2;sh.forEach((row,y)=>row.forEach((v,x)=>{if(v){nctx.fillStyle=next.color;nctx.fillRect(ox+x*s,oy+y*s,s-2,s-2);}}));}
  function startGame(){cancelAnimationFrame(raf);resetBoard();state='play';start.classList.add('hidden');over.classList.add('hidden');pause.classList.add('hidden');drawNext();raf=requestAnimationFrame(loop);}
  function gameOver(){state='over';cancelAnimationFrame(raf);if(score>best){best=score;localStorage.setItem('bakawaliBlockBest',best);bestEl.textContent=best;}finalEl.textContent=score;over.classList.remove('hidden');draw();}
  function togglePause(){if(state==='play'){state='pause';pause.classList.remove('hidden');cancelAnimationFrame(raf);}else if(state==='pause'){state='play';pause.classList.add('hidden');lastTime=performance.now();raf=requestAnimationFrame(loop);}}
  function loop(time){if(state!=='play')return;const delta=time-lastTime;lastTime=time;dropCounter+=delta;if(dropCounter>Math.max(120,800-(level-1)*70)){soft();dropCounter=0;}draw();raf=requestAnimationFrame(loop);}
  document.getElementById('blockStartBtn').onclick=startGame;document.getElementById('blockAgain').onclick=startGame;document.getElementById('blockPauseBtn').onclick=togglePause;document.getElementById('blockResume').onclick=togglePause;
  document.querySelector('[data-block-left]').onclick=()=>move(-1);document.querySelector('[data-block-right]').onclick=()=>move(1);document.querySelector('[data-block-rotate]').onclick=rotate;document.querySelector('[data-block-down]').onclick=soft;document.querySelector('[data-block-drop]').onclick=hardDrop;
  window.addEventListener('keydown',e=>{if(!document.getElementById('blockPanel')?.classList.contains('active'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')move(-1);else if(e.key==='ArrowRight')move(1);else if(e.key==='ArrowUp')rotate();else if(e.key==='ArrowDown')soft();else if(e.code==='Space')hardDrop();else if(e.key.toLowerCase()==='p')togglePause();});
  resetBoard();drawNext();
})();
