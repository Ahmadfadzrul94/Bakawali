const pages = document.querySelectorAll(".page");
const pageButtons = document.querySelectorAll("[data-page]");

function showPage(id){
  pages.forEach(p => p.classList.toggle("active", p.id === id));
  window.scrollTo({top:0, behavior:"smooth"});
}
pageButtons.forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));

const lesson = document.getElementById("lesson");
const topics = document.querySelectorAll(".topic");

const data = {
  abc: {
    title:"ABC Adventure 🔤",
    hint:"Tap a letter to hear its name.",
    cards:"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l,i)=>({big:l, small:`Letter ${l}`, speak:`Letter ${l}`}))
  },
  numbers:{
    title:"Number Garden 🔢",
    hint:"Tap a number to hear it.",
    cards:Array.from({length:10},(_,i)=>({big:String(i+1),small:`${i+1} ${i===0?"star":"stars"}`,speak:String(i+1)}))
  },
  colours:{
    title:"Colour Rainbow 🎨",
    hint:"Tap a colour to hear its name.",
    cards:[
      ["Pink","#f49ab5"],["Blue","#a9d9ee"],["Yellow","#ffe39a"],["Green","#a9d8b2"],
      ["Purple","#c9b5e8"],["Orange","#ffc38a"],["Red","#f08d8d"],["White","#ffffff"]
    ].map(([name,color])=>({color,name,speak:name}))
  },
  shapes:{
    title:"Shape Explorer 🔷",
    hint:"Tap a shape to hear its name.",
    cards:[
      ["Circle","circle"],["Square","square"],["Triangle","triangle"]
    ].map(([name,shape])=>({name,shape,speak:name}))
  }
};

function speak(text){
  if("speechSynthesis" in window){
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.rate=.82; u.pitch=1.08;
    speechSynthesis.speak(u);
  }
}

function renderTopic(topic){
  topics.forEach(t=>t.classList.toggle("active",t.dataset.topic===topic));
  if(topic==="quiz"){renderQuiz();return}
  const d=data[topic];
  lesson.innerHTML=`<h2 class="lesson-title">${d.title}</h2><p class="hint">${d.hint}</p><div class="cards"></div>`;
  const cards=lesson.querySelector(".cards");
  d.cards.forEach(item=>{
    const b=document.createElement("button");
    b.className="learn-card";
    if(item.color) b.innerHTML=`<div class="colour-dot" style="background:${item.color}"></div><b>${item.name}</b>`;
    else if(item.shape) b.innerHTML=`<div class="shape ${item.shape}"></div><b>${item.name}</b>`;
    else b.innerHTML=`<span class="big">${item.big}</span><small>${item.small}</small>`;
    b.addEventListener("click",()=>speak(item.speak));
    cards.appendChild(b);
  });
}

const quizQuestions=[
  {q:"Which letter comes first?",emoji:"🔤",options:["A","B","C","D"],answer:"A"},
  {q:"How many stars are here? ⭐⭐⭐",emoji:"⭐",options:["2","3","4","5"],answer:"3"},
  {q:"What colour is the sky?",emoji:"🌤️",options:["Blue","Pink","Green","Orange"],answer:"Blue"},
  {q:"Which one is a circle?",emoji:"🔷",options:["⚪ Circle","⬜ Square","🔺 Triangle","⭐ Star"],answer:"⚪ Circle"}
];
let quizIndex=0, score=0;

function renderQuiz(){
  const item=quizQuestions[quizIndex%quizQuestions.length];
  lesson.innerHTML=`<div class="quiz">
    <div class="quiz-emoji">${item.emoji}</div>
    <h2>${item.q}</h2>
    <div class="quiz-options">${item.options.map(o=>`<button>${o}</button>`).join("")}</div>
    <div class="feedback"></div>
    <p class="hint">Question ${(quizIndex%quizQuestions.length)+1} of ${quizQuestions.length} · ⭐ Score: ${score}</p>
  </div>`;
  lesson.querySelectorAll(".quiz-options button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const feedback=lesson.querySelector(".feedback");
      if(btn.textContent===item.answer){
        score++;
        feedback.textContent="Correct! 🌟 Well done!";
        speak("Well done!");
      }else{
        feedback.textContent=`Good try! The answer is ${item.answer}. 💛`;
        speak("Good try!");
      }
      setTimeout(()=>{quizIndex++;renderQuiz()},850);
    });
  });
}

topics.forEach(t=>t.addEventListener("click",()=>renderTopic(t.dataset.topic)));
renderTopic("abc");
