const pages=[...document.querySelectorAll(".page")];
const toast=document.getElementById("toast");
let stars=Number(localStorage.getItem("bakawaliStars")||0);
let badges=Number(localStorage.getItem("bakawaliBadges")||0);
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
 renderStats(); toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800);
}
document.querySelectorAll("[data-lesson]").forEach(b=>b.addEventListener("click",()=>{
 const lesson=b.dataset.lesson;
 const words={abc:"A says ah! B says buh! C says kuh!",numbers:"1, 2, 3, 4, 5! Great counting!",colours:"Red, blue, yellow! Colours unlocked!"};
 speak(words[lesson]); earnStar("⭐ Training complete!");
}));
document.querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>{
 const out=document.getElementById("quiz-result");
 if(b.dataset.answer==="5"){out.textContent="🎉 Correct! +1 Star";earnStar("🎉 Correct answer!")}
 else out.textContent="Try again! Hint: 4 comes before 5.";
}));
document.querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>{
 const out=document.getElementById("game-output");
 const q={letter:"🔤 Find the letter A! Say “A” out loud, then tap PLAY again to practise.",number:"🔢 What comes after 7? Answer: 8!",colour:"🎨 Find something blue around you!"}[b.dataset.game];
 out.innerHTML="<div>"+q+"<br><button class='primary small' style='margin-top:12px' onclick='earnStar(\"🏆 Game cleared!\")'>CLAIM STAR</button></div>";
}));
function speak(text){if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.85;speechSynthesis.speak(u)}}
document.querySelectorAll("[data-speak]").forEach(b=>b.addEventListener("click",()=>{speak(b.dataset.speak);earnStar("🎵 Music time!")}));
renderStats();
const hash=location.hash.replace("#","");
if(hash && document.getElementById(hash)) showPage(hash);
