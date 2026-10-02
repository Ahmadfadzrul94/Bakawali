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

/* =========================
   BAKAWALI BILINGUAL ENGINE — EN / BM
   ========================= */
const BAK_LANGUAGE_KEY="language";
let bakawaliLanguage=profileGet(BAK_LANGUAGE_KEY,"en")==="ms"?"ms":"en";
const UI_TEXT={
  en:{
    musicTitle:"YouTube Music Camp",musicDesc:"Watch and sing along with hand-picked kids songs.",musicPlayerTitle:"Bakawali Music Player",musicPlayerDesc:"Play a kids song directly inside Bakawali.",musicNote:"More songs can be added later by changing the YouTube video or playlist.",filterAll:"All",filterLanguage:"Language",filterMath:"Math",filterExplore:"Explore",filterAnimals:"Animals",filterScience:"Science",soundOn:"Sound ON",soundOff:"Sound OFF",hear:"Hear",next:"NEXT →",readAloud:"Read aloud",correct:"🎉 Correct!",wrong:"Try again! 💪",great:"Great job!",complete:"🌟 Module complete!",chooseAnswer:"Choose an answer.",listenChoose:"Listen carefully, then choose.",languageName:"English",langButton:"🇬🇧 EN"},
  ms:{
    musicTitle:"Kem Muzik YouTube",musicDesc:"Tonton dan nyanyi bersama lagu kanak-kanak pilihan.",musicPlayerTitle:"Pemain Muzik Bakawali",musicPlayerDesc:"Mainkan lagu kanak-kanak terus dalam Bakawali.",musicNote:"Lagu lain boleh ditambah kemudian dengan menukar video atau playlist YouTube.",filterAll:"Semua",filterLanguage:"Bahasa",filterMath:"Matematik",filterExplore:"Teroka",filterAnimals:"Haiwan",filterScience:"Sains",soundOn:"Bunyi ON",soundOff:"Bunyi OFF",hear:"Dengar",next:"SETERUSNYA →",readAloud:"Baca kuat",correct:"🎉 Betul!",wrong:"Cuba lagi! 💪",great:"Syabas!",complete:"🌟 Modul selesai!",chooseAnswer:"Pilih jawapan.",listenChoose:"Dengar baik-baik, kemudian pilih.",languageName:"Bahasa Melayu",langButton:"🇲🇾 BM"}
};
const MODULE_BM={
 abc:["Jelajah Abjad","Belajar A–Z dan dengar setiap huruf."], phonics:["Bunyi Huruf","Dengar bunyi pertama dalam perkataan mudah."], spelling:["Eja Perkataan","Bina perkataan 3 huruf mudah."], sight:["Perkataan Mudah","Kenali perkataan mudah untuk membaca awal."], reading:["Baca Ayat","Baca ayat pendek dengan petunjuk gambar."], story:["Cerita Mini","Baca cerita pendek dan jawab soalan."], picture:["Padankan Gambar","Pilih perkataan yang sepadan dengan gambar."], wordmatch:["Padan Perkataan & Gambar","Padankan perkataan mudah dengan gambar."],
 count:["Kira Objek","Kira sehingga 10."], addition:["Tambah Mudah","Tambah nombor kecil bersama-sama."], subtraction:["Tolak Mudah","Tolak nombor kecil."], shapes:["Detektif Bentuk","Cari bulatan, segi empat, segi tiga dan lain-lain."], patterns:["Kuasa Corak","Cari apa yang datang seterusnya."], compare:["Lebih atau Kurang","Bandingkan kumpulan dan nombor."], time:["Jelajah Masa","Belajar masa tepat yang mudah."], money:["Kedai Kecil","Kira duit syiling dan harga mudah."],
 memory:["Padanan Memori","Ingat dan padankan pasangan gambar."], sorting:["Asingkan","Masukkan benda ke kumpulan yang betul."], sequence:["Apa Berlaku Seterusnya?","Susun tindakan mudah mengikut urutan."],
 animals:["Detektif Haiwan","50 cabaran tentang bunyi, badan, makanan, pergerakan dan tempat tinggal haiwan."], animalhabitat:["Habitat Haiwan","50 misi tentang tempat haiwan hidup dan keperluan mereka."], scientist:["Saintis Kecil","50 eksperimen mini tentang sains harian."], scienceexplorer:["Jelajah Sains","50 misi tentang cuaca, angkasa, cahaya dan alam semula jadi."]
};
const WORD_BM={
 "Dog":"Anjing","Cat":"Kucing","Cow":"Lembu","Lion":"Singa","Frog":"Katak","Duck":"Itik","Horse":"Kuda","Sheep":"Biri-biri","Goat":"Kambing","Elephant":"Gajah","Zebra":"Zebra","Tiger":"Harimau","Rabbit":"Arnab","Fish":"Ikan","Chicken":"Ayam","Butterfly":"Rama-rama","Octopus":"Sotong kurita","Crab":"Ketam","Whale":"Paus","Panda":"Panda","Koala":"Koala","Camel":"Unta","Penguin":"Penguin","Seal":"Anjing laut","Dolphin":"Ikan lumba-lumba","Shark":"Jerung","Eagle":"Helang","Bee":"Lebah","Ant":"Semut","Spider":"Labah-labah","Crocodile":"Buaya","Monkey":"Monyet","Snake":"Ular","Kangaroo":"Kanggaru","Tortoise":"Kura-kura","Cheetah":"Cheetah","Bat":"Kelawar","Snail":"Siput","Parrot":"Burung kakak tua","Fox":"Musang","Bear":"Beruang","Polar bear":"Beruang kutub","Wolf":"Serigala","Deer":"Rusa",
 "Apple":"Epal","Ball":"Bola","Sun":"Matahari","Tree":"Pokok","Grass":"Rumput","Leaves":"Daun","Bamboo":"Buluh","Meat":"Daging","Berries":"Buah beri","Pond":"Kolam","Ocean":"Laut","Garden":"Taman","Forest":"Hutan","Jungle":"Hutan rimba","Farm":"Ladang","Desert":"Gurun","Arctic":"Artik","Savanna":"Savana","Grassland":"Padang rumput","River":"Sungai","Rivers":"Sungai","Wetlands":"Tanah lembap","Water":"Air","Food":"Makanan","Shelter":"Tempat berlindung","Flowers":"Bunga","Warm water":"Air suam","Cold regions":"Kawasan sejuk","Australia":"Australia","Moon":"Bulan","Earth":"Bumi","Sunlight":"Cahaya matahari","Wind":"Angin","Rain":"Hujan","Clouds":"Awan","Ice":"Ais","Snow":"Salji","Rock":"Batu","Plant":"Tumbuhan","Roots":"Akar","Flower":"Bunga","Milk":"Susu","Juice":"Jus","Time":"Masa","Weight":"Berat","Temperature":"Suhu","Direction":"Arah",
 "The Sun":"Matahari","A ball":"Bola","A planet":"Planet","A star":"Bintang","Stars":"Bintang","Planets":"Planet","Rocket":"Roket","Spring":"Musim bunga","Summer":"Musim panas","Autumn":"Musim luruh","Winter":"Musim sejuk","Raincoat":"Baju hujan","Thunder":"Guruh","Wind":"Angin","Lava":"Lava","Mountain":"Gunung","Energy":"Tenaga","Air":"Udara","Vibrations":"Getaran","Sound":"Bunyi","Ears":"Telinga","Eyes":"Mata","Nose":"Hidung","Tongue":"Lidah","Touch":"Sentuhan","Sight":"Penglihatan","Thermometer":"Termometer","Ruler":"Pembaris","Roots":"Akar","Sponge":"Span","Wood":"Kayu","Boat":"Bot","Shadow":"Bayang-bayang","Magnet":"Magnet","Direction":"Arah"
};
function bmAnimalPhrase(s){
  let out=s;
  Object.keys(WORD_BM).sort((a,b)=>b.length-a.length).forEach(k=>{out=out.replace(new RegExp('\\b'+k.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\b','gi'),WORD_BM[k]);});
  const exact={
    "Which animal says BARK?":"Haiwan manakah berbunyi GUK GUK?","Which animal says MEOW?":"Haiwan manakah berbunyi MEOW?","Which animal says MOO?":"Haiwan manakah berbunyi MOO?","Which animal can ROAR?":"Haiwan manakah boleh MENGAUM?","Which animal says RIBBIT?":"Haiwan manakah berbunyi KROK KROK?","Which animal says QUACK?":"Haiwan manakah berbunyi KUAK KUAK?","Which animal neighs?":"Haiwan manakah meringkik?","Which animal says BAA?":"Haiwan manakah berbunyi BAA?",
    "Which animal has a long trunk?":"Haiwan manakah mempunyai belalai panjang?","Which animal has a very long neck?":"Haiwan manakah mempunyai leher yang sangat panjang?","Which animal has a shell?":"Haiwan manakah mempunyai cangkerang?","Which animal lives in water and has fins?":"Haiwan manakah hidup dalam air dan mempunyai sirip?","Which animal has colourful wings?":"Haiwan manakah mempunyai sayap berwarna-warni?","Which animal has eight arms?":"Haiwan manakah mempunyai lapan lengan?","Which animal has black and white stripes?":"Haiwan manakah mempunyai belang hitam dan putih?","Which animal has stripes and sharp claws?":"Haiwan manakah mempunyai belang dan kuku tajam?","Which animal has long ears?":"Haiwan manakah mempunyai telinga panjang?","Which animal loves to munch bamboo?":"Haiwan manakah suka makan buluh?","Which animal likes eucalyptus leaves?":"Haiwan manakah suka makan daun kayu putih?","Which animal can live in a hot desert?":"Haiwan manakah boleh hidup di gurun yang panas?","Which animal is built for cold places?":"Haiwan manakah sesuai hidup di tempat sejuk?","Which animal swims and rests on ice?":"Haiwan manakah berenang dan berehat di atas ais?","Which animal is a sea mammal?":"Haiwan manakah mamalia laut?","Which animal is the biggest here?":"Haiwan manakah paling besar di sini?","Which animal can fly high with wings?":"Haiwan manakah boleh terbang tinggi dengan sayap?","Which tiny animal makes honey?":"Haiwan kecil manakah menghasilkan madu?","Which tiny animal lives in a colony?":"Haiwan kecil manakah hidup dalam koloni?","How many legs does a spider have?":"Berapakah kaki labah-labah?","What does a chicken have?":"Ayam mempunyai apa?","What does a giraffe mostly eat?":"Apakah yang zirafah biasanya makan?","What does a cow eat?":"Apakah yang lembu makan?","What does a panda eat a lot of?":"Apakah yang panda banyak makan?","What kind of food does a lion eat?":"Apakah jenis makanan yang singa makan?","Where can a frog often be found?":"Di manakah katak biasanya ditemui?","Which animal loves to climb trees?":"Haiwan manakah suka memanjat pokok?","Where does an octopus live?":"Di manakah sotong kurita hidup?","Where does a bee find flowers?":"Di manakah lebah mencari bunga?","Which animal can run fast on a farm?":"Haiwan manakah boleh berlari laju di ladang?","Which animal has webbed feet for swimming?":"Haiwan manakah mempunyai kaki berselaput untuk berenang?","Which animal uses its trunk to grab food?":"Haiwan manakah menggunakan belalai untuk mengambil makanan?","Which animal moves by slithering?":"Haiwan manakah bergerak dengan menjalar?","Which animal can hop with strong back legs?":"Haiwan manakah boleh melompat dengan kaki belakang yang kuat?","Which animal moves slowly?":"Haiwan manakah bergerak perlahan?","Which animal is known for running very fast?":"Haiwan manakah terkenal kerana berlari sangat laju?","Which animal is active at night and can fly?":"Haiwan manakah aktif pada waktu malam dan boleh terbang?","Which animal carries its home on its back?":"Haiwan manakah membawa rumahnya di belakang?","Which animal can copy sounds and has feathers?":"Haiwan manakah boleh meniru bunyi dan mempunyai bulu?","Which animal has horns and can live on a farm?":"Haiwan manakah mempunyai tanduk dan boleh hidup di ladang?","Which animal has a bushy tail?":"Haiwan manakah mempunyai ekor lebat?"
  };
  return exact[s]||out;
}
function localizeActivityText(s){
  if(bakawaliLanguage!=="ms")return s;
  if(!s)return s;
  const exact={
    "What sound starts the word “sun”?":"Bunyi apakah yang bermula dengan perkataan “sun”?","What comes after 4?":"Apakah nombor selepas 4?","Which letter comes first?":"Huruf manakah datang dahulu?","How many fingers are on one hand?":"Berapakah jari pada satu tangan?","Which one is a colour?":"Yang manakah satu warna?","Which shape has 3 sides?":"Bentuk manakah mempunyai 3 sisi?","Which clock shows 3 o'clock?":"Jam manakah menunjukkan pukul 3?","Where does a penguin live?":"Di manakah penguin hidup?","Where does a camel live?":"Di manakah unta hidup?","Where does a dolphin live?":"Di manakah ikan lumba-lumba hidup?","Where does a monkey often live?":"Di manakah monyet biasanya hidup?","Where does a cow live?":"Di manakah lembu hidup?","Where does a lion often live?":"Di manakah singa biasanya hidup?","Where does a frog often live?":"Di manakah katak biasanya hidup?","Where does a polar bear live?":"Di manakah beruang kutub hidup?","What does a fish need?":"Apakah yang ikan perlukan?","What does a rabbit need?":"Apakah yang arnab perlukan?","Where can ducks swim?":"Di manakah itik boleh berenang?","Where can sea turtles live?":"Di manakah penyu laut boleh hidup?","What place suits a seal?":"Tempat manakah sesuai untuk anjing laut?","Why is a camel suited to desert life?":"Mengapa unta sesuai hidup di gurun?","Where can butterflies find food?":"Di manakah rama-rama mencari makanan?","Which place is best for a tropical fish?":"Tempat manakah paling sesuai untuk ikan tropika?","Where might a wolf live?":"Di manakah serigala mungkin hidup?","Where might a deer live?":"Di manakah rusa mungkin hidup?","Where might a parrot live?":"Di manakah burung kakak tua mungkin hidup?","Where is a kangaroo native to?":"Kanggaru berasal dari negara mana?","Where does a koala live?":"Di manakah koala hidup?","What does a zebra need?":"Apakah yang zebra perlukan?","Where can crocodiles live?":"Di manakah buaya boleh hidup?","Where does a shark live?":"Di manakah jerung hidup?","Where does a whale live?":"Di manakah paus hidup?","Where can an eagle build a nest?":"Di manakah helang boleh membina sarang?","Where can a spider make a web?":"Di manakah labah-labah boleh membuat sarang?","Where do ants often live?":"Di manakah semut biasanya hidup?","Why do bees need flowers?":"Mengapa lebah memerlukan bunga?","Where does a chicken usually live?":"Di manakah ayam biasanya hidup?","Where does a sheep live?":"Di manakah biri-biri hidup?","Where does a goat often live?":"Di manakah kambing biasanya hidup?",
    "What gives us light in the daytime?":"Apakah yang memberi kita cahaya pada waktu siang?","What do we wear when it rains?":"Apakah yang kita pakai apabila hujan?","What do we often see at night?":"Apakah yang sering kita lihat pada waktu malam?","Which sense helps us see?":"Deria manakah membantu kita melihat?","What colours can a rainbow have?":"Apakah warna yang boleh ada pada pelangi?","What can clouds bring?":"Apakah yang boleh dibawa oleh awan?","What sound can lightning be followed by?":"Bunyi apakah yang boleh kita dengar selepas kilat?","What is frozen water called?":"Apakah nama bagi air yang beku?","What is moving air called?":"Apakah nama bagi udara yang bergerak?","What is weather?":"Apakah maksud cuaca?","Which is brighter?":"Yang manakah lebih terang?","Does the Moon shine by making its own light?":"Adakah Bulan menghasilkan cahayanya sendiri?","What is Earth shaped roughly like?":"Bentuk Bumi lebih kurang seperti apa?","What travels into space?":"Apakah yang boleh pergi ke angkasa?","What goes around the Sun?":"Apakah yang mengelilingi Matahari?","What can we see in the night sky?":"Apakah yang boleh kita lihat di langit malam?","Why do we have day and night?":"Mengapa ada siang dan malam?","What is the Moon to Earth?":"Apakah Bulan kepada Bumi?","What can satellites do?":"Apakah yang satelit boleh lakukan?","Which season can bring new plant growth?":"Musim manakah membawa pertumbuhan tumbuhan baharu?","What can happen to leaves in autumn?":"Apakah yang boleh berlaku kepada daun pada musim luruh?","Which season is usually coldest?":"Musim manakah biasanya paling sejuk?","Which season is usually warmest?":"Musim manakah biasanya paling panas?","What happens to many plants in spring?":"Apakah yang berlaku kepada banyak tumbuhan pada musim bunga?","What is a wave?":"Apakah itu ombak?","What can wind move at a beach?":"Apakah yang angin boleh gerakkan di pantai?","What can come from a volcano?":"Apakah yang boleh keluar daripada gunung berapi?","What is a mountain?":"Apakah itu gunung?","Why are forests important?":"Mengapa hutan penting?","Why is clean water important?":"Mengapa air bersih penting?","What can recycling help with?":"Bagaimanakah kitar semula boleh membantu?","What is one way to help plants?":"Apakah satu cara membantu tumbuhan?","Why are bees helpful to plants?":"Mengapa lebah membantu tumbuhan?","What starts as a caterpillar?":"Apakah yang bermula sebagai ulat beluncas?","What can hatch from an egg?":"Apakah yang boleh menetas daripada telur?","Which part of a tree is usually underground?":"Bahagian pokok manakah biasanya berada di bawah tanah?","What do flowers attract?":"Apakah yang menarik perhatian bunga?","What happens when rain falls into rivers?":"Apakah yang berlaku apabila hujan turun ke sungai?","What can solar energy come from?":"Daripada manakah tenaga suria datang?","What does a lamp need to make light?":"Apakah yang lampu perlukan untuk menghasilkan cahaya?","What can a battery provide?":"Apakah yang bateri boleh bekalkan?","What can sound travel through?":"Melalui apakah bunyi boleh bergerak?","What makes a sound?":"Apakah yang menghasilkan bunyi?","What does observing mean?":"Apakah maksud memerhati?","What is a fair test?":"Apakah itu ujian yang adil?","What should a scientist do after a test?":"Apakah yang patut dilakukan oleh saintis selepas ujian?","What can a thermometer tell us?":"Apakah yang termometer boleh beritahu?","What can a compass help show?":"Apakah yang kompas boleh tunjukkan?","Which is part of our natural world?":"Yang manakah sebahagian daripada alam semula jadi?","What should a curious explorer do?":"Apakah yang patut dilakukan oleh penjelajah yang ingin tahu?"
  };
  return exact[s]||bmAnimalPhrase(s);
}
function localizeChoice(s){return localizeActivityText(s);}
function moduleTitle(m){return bakawaliLanguage==='ms'?(m.bmTitle||MODULE_BM[m.id]?.[0]||m.title):m.title;}
function moduleDesc(m){return bakawaliLanguage==='ms'?(m.bmDesc||MODULE_BM[m.id]?.[1]||m.desc):m.desc;}
function updateLanguageUI(){
  const isMs=bakawaliLanguage==='ms';
  document.documentElement.lang=isMs?'ms':'en';
  const b=document.getElementById('languageToggle');
  if(b){
    b.innerHTML=`🌐 <span>${isMs?'BM':'EN'}</span>`;
    b.classList.toggle('active',isMs);
    b.setAttribute('aria-label',isMs?'Tukar ke English':'Tukar ke Bahasa Melayu');
    b.setAttribute('aria-pressed',String(isMs));
    b.title=isMs?'Tukar ke English':'Tukar ke Bahasa Melayu';
  }
  const icons={filterAll:'🌟',filterLanguage:'🔤',filterMath:'🔢',filterExplore:'🌍',filterAnimals:'🐾',filterScience:'🔬'};
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.dataset.i18n;
    if(UI_TEXT[bakawaliLanguage][k]) el.textContent=(icons[k]?icons[k]+' ':'')+UI_TEXT[bakawaliLanguage][k];
  });
}
function setBakawaliLanguage(lang){
  bakawaliLanguage=lang==='ms'?'ms':'en';
  profileSet(BAK_LANGUAGE_KEY,bakawaliLanguage);
  updateLanguageUI();
  const activeFilter=document.querySelector('.training-filter.active')?.dataset.filter||'all';
  renderTrainingCards(activeFilter);
  updateMusicLanguage();
  window.bakawaliDailyQuestSync?.();
  window.renderBadges?.();
  window.bakawaliRefreshStory?.();
  window.bakawaliUpdateParent?.();
  window.bakawaliRefreshGallery?.();
}
function updateMusicLanguage(){
  const frame=document.getElementById("bakawaliYoutubePlayer");
  if(!frame)return;
  const lang=(typeof getBakawaliLanguage==='function'?getBakawaliLanguage():(localStorage.getItem(BAK_LANGUAGE_KEY)||"en"));
  const base="https://www.youtube.com/embed/TqfMHH67KJA?playsinline=1&rel=0&hl="+(lang==="ms"?"ms":"en");
  if(frame.src!==base) frame.src=base;
}

function initLanguage(){
  const b=document.getElementById('languageToggle');
  if(!b)return;
  updateLanguageUI();
  b.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    setBakawaliLanguage(bakawaliLanguage==='en'?'ms':'en');
  });
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
let trainingModules=[
  {id:"abc",cat:"language",icon:"🔤",title:"ABC Explorer",desc:"Learn letters and sounds.",bmTitle:"Jelajah Abjad",bmDesc:"Belajar huruf dan bunyi.",kind:"letters",mode:"tap"},
  {id:"phonics",cat:"language",icon:"🔊",title:"Phonics Fun",desc:"Hear beginning sounds.",bmTitle:"Seronok Fonik",bmDesc:"Dengar bunyi awal perkataan.",kind:"phonics",mode:"tap"},
  {id:"spelling",cat:"language",icon:"✏️",title:"Spell It!",desc:"Build simple words.",bmTitle:"Eja Perkataan",bmDesc:"Bina perkataan mudah.",kind:"spelling",mode:"tap"},
  {id:"sight",cat:"language",icon:"👀",title:"Sight Words",desc:"Recognise common words.",bmTitle:"Perkataan Mudah",bmDesc:"Kenali perkataan biasa.",kind:"sight",mode:"tap"},
  {id:"reading",cat:"language",icon:"📖",title:"Read & Choose",desc:"Read short sentences.",bmTitle:"Baca & Pilih",bmDesc:"Baca ayat pendek.",kind:"reading",mode:"tap"},
  {id:"story",cat:"language",icon:"📚",title:"Mini Story Quest",desc:"Read, listen and answer.",bmTitle:"Misi Cerita Mini",bmDesc:"Baca, dengar dan jawab.",kind:"story",mode:"tap"},
  {id:"picture",cat:"language",icon:"🖼️",title:"Picture Words",desc:"Match words to pictures.",bmTitle:"Perkataan Bergambar",bmDesc:"Padankan perkataan dengan gambar.",kind:"picture",mode:"tap"},
  {id:"wordmatch",cat:"language",icon:"🧩",title:"Word & Picture Match",desc:"Match words and pictures.",bmTitle:"Padan Perkataan & Gambar",bmDesc:"Padankan perkataan dan gambar.",kind:"picture",mode:"drag"},
  {id:"rhymes",cat:"language",icon:"🎵",title:"Rhyme Time",desc:"Find words that rhyme.",bmTitle:"Masa Berima",bmDesc:"Cari perkataan yang berima.",kind:"rhyme",mode:"tap"},
  {id:"syllables",cat:"language",icon:"👏",title:"Syllable Clap",desc:"Count word beats.",bmTitle:"Tepuk Suku Kata",bmDesc:"Kira suku kata.",kind:"syllable",mode:"tap"},
  {id:"vowels",cat:"language",icon:"🔤",title:"Vowel Hunt",desc:"Find A, E, I, O and U.",bmTitle:"Cari Vokal",bmDesc:"Cari A, E, I, O dan U.",kind:"vowels",mode:"tap"},
  {id:"sounds",cat:"language",icon:"🎧",title:"Sound Detective",desc:"Listen for the right sound.",bmTitle:"Detektif Bunyi",bmDesc:"Dengar dan pilih bunyi yang betul.",kind:"phonics",mode:"tap"},
  {id:"opposites",cat:"language",icon:"↔️",title:"Opposite World",desc:"Find the opposite word.",bmTitle:"Dunia Lawan",bmDesc:"Cari perkataan berlawanan.",kind:"opposites",mode:"tap"},
  {id:"actionwords",cat:"language",icon:"🏃",title:"Action Words",desc:"Spot words that show action.",bmTitle:"Kata Kerja",bmDesc:"Kenal pasti perkataan yang menunjukkan tindakan.",kind:"action",mode:"tap"},
  {id:"describing",cat:"language",icon:"🎨",title:"Describing Words",desc:"Choose the word that describes.",bmTitle:"Kata Sifat",bmDesc:"Pilih perkataan yang menerangkan.",kind:"describing",mode:"tap"},
  {id:"sentencebuilder",cat:"language",icon:"🧱",title:"Sentence Builder",desc:"Put simple words together.",bmTitle:"Bina Ayat",bmDesc:"Susun perkataan menjadi ayat mudah.",kind:"sentence",mode:"sequence"},
  {id:"plurals",cat:"language",icon:"🍎🍎",title:"One or Many",desc:"Learn simple plurals.",bmTitle:"Satu atau Banyak",bmDesc:"Belajar bentuk satu dan banyak.",kind:"plural",mode:"tap"},
  {id:"beginningending",cat:"language",icon:"🔎",title:"First & Last Sound",desc:"Find beginning and ending sounds.",bmTitle:"Bunyi Awal & Akhir",bmDesc:"Cari bunyi awal dan akhir.",kind:"phonics",mode:"tap"},
  {id:"readpicture",cat:"language",icon:"👓",title:"Picture Reading",desc:"Read clues from pictures.",bmTitle:"Baca Gambar",bmDesc:"Baca petunjuk daripada gambar.",kind:"reading",mode:"tap"},
  {id:"wordfamilies",cat:"language",icon:"🏠",title:"Word Family Fun",desc:"Explore simple word families.",bmTitle:"Keluarga Perkataan",bmDesc:"Terokai keluarga perkataan mudah.",kind:"wordfamily",mode:"tap"},

  {id:"count",cat:"math",icon:"🔢",title:"Count the Objects",desc:"Count up to 10.",bmTitle:"Kira Objek",bmDesc:"Kira sehingga 10.",kind:"count",mode:"count"},
  {id:"count20",cat:"math",icon:"🔟",title:"Number Trail 1–20",desc:"Count along a number trail.",bmTitle:"Laluan Nombor 1–20",bmDesc:"Kira sepanjang laluan nombor.",kind:"count20",mode:"count"},
  {id:"numbermatch",cat:"math",icon:"🎯",title:"Number Match",desc:"Match numbers to groups.",bmTitle:"Padan Nombor",bmDesc:"Padankan nombor dengan kumpulan.",kind:"count",mode:"drag"},
  {id:"addition",cat:"math",icon:"➕",title:"Easy Addition",desc:"Add small numbers.",bmTitle:"Tambah Mudah",bmDesc:"Tambah nombor kecil.",kind:"addition",mode:"tap"},
  {id:"subtraction",cat:"math",icon:"➖",title:"Easy Subtraction",desc:"Take away small numbers.",bmTitle:"Tolak Mudah",bmDesc:"Tolak nombor kecil.",kind:"subtraction",mode:"tap"},
  {id:"moreless",cat:"math",icon:"⚖️",title:"More or Less",desc:"Compare groups and numbers.",bmTitle:"Lebih atau Kurang",bmDesc:"Bandingkan kumpulan dan nombor.",kind:"compare",mode:"tap"},
  {id:"same",cat:"math",icon:"🟰",title:"Same or Different",desc:"Find matching amounts.",bmTitle:"Sama atau Berbeza",bmDesc:"Cari jumlah yang sama.",kind:"same",mode:"tap"},
  {id:"numberbefore",cat:"math",icon:"⬅️",title:"Before & After",desc:"Find the number before or after.",bmTitle:"Sebelum & Selepas",bmDesc:"Cari nombor sebelum atau selepas.",kind:"beforeafter",mode:"tap"},
  {id:"numberbonds",cat:"math",icon:"🌈",title:"Number Bonds",desc:"Make numbers in different ways.",bmTitle:"Ikatan Nombor",bmDesc:"Bina nombor dengan cara berbeza.",kind:"addition",mode:"drag"},
  {id:"shapes",cat:"math",icon:"🔷",title:"Shape Detective",desc:"Find basic shapes.",bmTitle:"Detektif Bentuk",bmDesc:"Cari bentuk asas.",kind:"shapes",mode:"tap"},
  {id:"shapehunt",cat:"math",icon:"🔍",title:"Shape Hunt",desc:"Spot shapes around you.",bmTitle:"Misi Cari Bentuk",bmDesc:"Cari bentuk di sekeliling.",kind:"shapes",mode:"drag"},
  {id:"patterns",cat:"math",icon:"🟡",title:"Pattern Power",desc:"Find what comes next.",bmTitle:"Kuasa Corak",bmDesc:"Cari apa yang datang seterusnya.",kind:"patterns",mode:"tap"},
  {id:"sizeorder",cat:"math",icon:"📏",title:"Big to Small",desc:"Order objects by size.",bmTitle:"Besar ke Kecil",bmDesc:"Susun objek mengikut saiz.",kind:"size",mode:"sequence"},
  {id:"length",cat:"math",icon:"📐",title:"Long or Short",desc:"Compare lengths.",bmTitle:"Panjang atau Pendek",bmDesc:"Bandingkan panjang.",kind:"length",mode:"tap"},
  {id:"height",cat:"math",icon:"📊",title:"Tall or Short",desc:"Compare heights.",bmTitle:"Tinggi atau Rendah",bmDesc:"Bandingkan ketinggian.",kind:"height",mode:"tap"},
  {id:"position",cat:"math",icon:"📍",title:"Where Is It?",desc:"Learn above, below, beside and inside.",bmTitle:"Di Mana?",bmDesc:"Belajar atas, bawah, sebelah dan dalam.",kind:"position",mode:"tap"},
  {id:"time",cat:"math",icon:"⏰",title:"Time Explorer",desc:"Learn simple o'clock times.",bmTitle:"Jelajah Masa",bmDesc:"Belajar masa tepat yang mudah.",kind:"time",mode:"tap"},
  {id:"money",cat:"math",icon:"🪙",title:"Little Shop",desc:"Count simple coins and prices.",bmTitle:"Kedai Kecil",bmDesc:"Kira duit syiling dan harga mudah.",kind:"money",mode:"tap"},
  {id:"measurement",cat:"math",icon:"📏",title:"Measure It",desc:"Measure with simple objects.",bmTitle:"Jom Mengukur",bmDesc:"Mengukur dengan objek mudah.",kind:"measurement",mode:"drag"},
  {id:"skip2",cat:"math",icon:"2️⃣",title:"Count by 2s",desc:"Jump in twos.",bmTitle:"Kira 2-2",bmDesc:"Melompat nombor dua-dua.",kind:"skip2",mode:"tap"},
  {id:"mathstories",cat:"math",icon:"🧮",title:"Math Story Quest",desc:"Solve little number stories.",bmTitle:"Misi Cerita Matematik",bmDesc:"Selesaikan cerita nombor mudah.",kind:"mathstory",mode:"tap"},

  {id:"animals",cat:"animal",icon:"🐾",title:"Animal Detective",desc:"50 animal challenges.",bmTitle:"Detektif Haiwan",bmDesc:"50 cabaran haiwan.",kind:"animals",mode:"tap"},
  {id:"animalhabitat",cat:"animal",icon:"🌎",title:"Animal Habitat",desc:"50 habitat missions.",bmTitle:"Habitat Haiwan",bmDesc:"50 misi habitat.",kind:"habitats",mode:"drag"},
  {id:"animalsounds",cat:"animal",icon:"🔊",title:"Animal Sounds",desc:"Match animals to sounds.",bmTitle:"Bunyi Haiwan",bmDesc:"Padankan haiwan dengan bunyi.",kind:"animalsounds",mode:"tap"},
  {id:"animalfood",cat:"animal",icon:"🥕",title:"Animal Food",desc:"Find what animals eat.",bmTitle:"Makanan Haiwan",bmDesc:"Cari makanan haiwan.",kind:"animalfood",mode:"drag"},
  {id:"animalbody",cat:"animal",icon:"🦴",title:"Animal Body Parts",desc:"Explore tails, wings, fins and more.",bmTitle:"Bahagian Badan Haiwan",bmDesc:"Teroka ekor, sayap, sirip dan banyak lagi.",kind:"animalbody",mode:"tap"},
  {id:"babyanimals",cat:"animal",icon:"🐣",title:"Baby Animals",desc:"Match babies to parents.",bmTitle:"Anak Haiwan",bmDesc:"Padankan anak dengan induk.",kind:"babyanimals",mode:"drag"},
  {id:"animalmovement",cat:"animal",icon:"🦘",title:"Animal Movers",desc:"Hop, crawl, swim and fly.",bmTitle:"Pergerakan Haiwan",bmDesc:"Melompat, merangkak, berenang dan terbang.",kind:"movement",mode:"tap"},
  {id:"farmlife",cat:"animal",icon:"🚜",title:"Farm Friends",desc:"Explore friendly farm animals.",bmTitle:"Kawan Ladang",bmDesc:"Teroka haiwan di ladang.",kind:"farm",mode:"tap"},
  {id:"jungle",cat:"animal",icon:"🌴",title:"Jungle Rangers",desc:"Meet jungle animals.",bmTitle:"Ranger Hutan",bmDesc:"Kenali haiwan hutan.",kind:"jungle",mode:"tap"},
  {id:"ocean",cat:"animal",icon:"🌊",title:"Ocean Explorer",desc:"Discover ocean animals.",bmTitle:"Penjelajah Laut",bmDesc:"Kenali haiwan laut.",kind:"ocean",mode:"tap"},
  {id:"arctic",cat:"animal",icon:"❄️",title:"Arctic Adventure",desc:"Meet cold-climate animals.",bmTitle:"Pengembaraan Artik",bmDesc:"Kenali haiwan kawasan sejuk.",kind:"arctic",mode:"tap"},
  {id:"insects",cat:"animal",icon:"🐞",title:"Tiny Insects",desc:"Discover tiny creatures.",bmTitle:"Serangga Kecil",bmDesc:"Kenali makhluk kecil.",kind:"insects",mode:"tap"},
  {id:"birds",cat:"animal",icon:"🦜",title:"Bird Watcher",desc:"Learn about birds.",bmTitle:"Pemerhati Burung",bmDesc:"Belajar tentang burung.",kind:"birds",mode:"tap"},
  {id:"animalgroups",cat:"animal",icon:"🐾",title:"Animal Groups",desc:"Sort animals into groups.",bmTitle:"Kumpulan Haiwan",bmDesc:"Asingkan haiwan mengikut kumpulan.",kind:"animalgroups",mode:"sort"},
  {id:"animalsafety",cat:"animal",icon:"🛡️",title:"Animal Safety",desc:"Learn how to be kind and safe around animals.",bmTitle:"Keselamatan Haiwan",bmDesc:"Belajar cara selamat dan baik bersama haiwan.",kind:"animalsafety",mode:"tap"},

  {id:"scientist",cat:"science",icon:"🔬",title:"Little Scientist",desc:"Explore everyday science.",bmTitle:"Saintis Kecil",bmDesc:"Teroka sains harian.",kind:"science",mode:"tap"},
  {id:"scienceexplorer",cat:"science",icon:"🚀",title:"Science Explorer",desc:"Discover weather, space and nature.",bmTitle:"Jelajah Sains",bmDesc:"Teroka cuaca, angkasa dan alam.",kind:"scienceexplorer",mode:"tap"},
  {id:"senses",cat:"science",icon:"👀",title:"Five Senses",desc:"See, hear, smell, taste and touch.",bmTitle:"Lima Deria",bmDesc:"Lihat, dengar, hidu, rasa dan sentuh.",kind:"senses",mode:"tap"},
  {id:"plants",cat:"science",icon:"🌱",title:"Plant Power",desc:"Discover what plants need.",bmTitle:"Kuasa Tumbuhan",bmDesc:"Ketahui apa yang tumbuhan perlukan.",kind:"plants",mode:"drag"},
  {id:"weather",cat:"science",icon:"🌦️",title:"Weather Watch",desc:"Explore sunny, rainy and windy days.",bmTitle:"Pemerhati Cuaca",bmDesc:"Teroka hari cerah, hujan dan berangin.",kind:"weather",mode:"tap"},
  {id:"space",cat:"science",icon:"🌌",title:"Space Mission",desc:"Visit the Sun, Moon and planets.",bmTitle:"Misi Angkasa",bmDesc:"Lawat Matahari, Bulan dan planet.",kind:"space",mode:"tap"},
  {id:"lightshadow",cat:"science",icon:"🔦",title:"Light & Shadow",desc:"Play with light and shadows.",bmTitle:"Cahaya & Bayang",bmDesc:"Bermain dengan cahaya dan bayang.",kind:"lightshadow",mode:"drag"},
  {id:"soundscience",cat:"science",icon:"🎵",title:"Sound Lab",desc:"Discover how sounds happen.",bmTitle:"Makmal Bunyi",bmDesc:"Ketahui bagaimana bunyi terhasil.",kind:"soundscience",mode:"tap"},
  {id:"materials",cat:"science",icon:"🧊",title:"Material World",desc:"Hard, soft, wet, dry and more.",bmTitle:"Dunia Bahan",bmDesc:"Keras, lembut, basah, kering dan banyak lagi.",kind:"materials",mode:"sort"},
  {id:"water",cat:"science",icon:"💧",title:"Water Wonder",desc:"Explore water and floating.",bmTitle:"Keajaiban Air",bmDesc:"Teroka air dan benda terapung.",kind:"water",mode:"drag"},
  {id:"forces",cat:"science",icon:"🛝",title:"Push & Pull",desc:"Explore simple forces.",bmTitle:"Tolak & Tarik",bmDesc:"Teroka daya mudah.",kind:"forces",mode:"tap"},
  {id:"living",cat:"science",icon:"🌿",title:"Living or Not?",desc:"Sort living and non-living things.",bmTitle:"Hidup atau Tidak?",bmDesc:"Asingkan benda hidup dan bukan hidup.",kind:"living",mode:"sort"},
  {id:"earth",cat:"science",icon:"🌍",title:"Our Earth",desc:"Explore land, water and nature.",bmTitle:"Bumi Kita",bmDesc:"Teroka daratan, air dan alam.",kind:"earth",mode:"tap"},
  {id:"recycle",cat:"science",icon:"♻️",title:"Eco Hero",desc:"Learn simple ways to care for Earth.",bmTitle:"Wira Alam",bmDesc:"Belajar cara mudah menjaga Bumi.",kind:"recycle",mode:"sort"},
  {id:"simpleexperiments",cat:"science",icon:"🧪",title:"Mini Experiments",desc:"Predict what happens next.",bmTitle:"Eksperimen Mini",bmDesc:"Teka apa yang berlaku seterusnya.",kind:"experiments",mode:"tap"},

  {id:"sorting",cat:"world",icon:"📦",title:"Sort It Out",desc:"Put things in the right group.",bmTitle:"Asingkan",bmDesc:"Masukkan benda ke kumpulan yang betul.",kind:"sorting",mode:"sort"},
  {id:"sequence",cat:"world",icon:"🔁",title:"What Happens Next?",desc:"Put simple actions in order.",bmTitle:"Apa Berlaku Seterusnya?",bmDesc:"Susun tindakan mudah mengikut urutan.",kind:"sequence",mode:"sequence"},
  {id:"feelings",cat:"world",icon:"😊",title:"Feelings Friend",desc:"Recognise simple feelings.",bmTitle:"Kawan Perasaan",bmDesc:"Kenali perasaan mudah.",kind:"feelings",mode:"tap"},
  {id:"healthyfood",cat:"world",icon:"🍎",title:"Healthy Food",desc:"Choose foods that help our bodies.",bmTitle:"Makanan Sihat",bmDesc:"Pilih makanan yang membantu badan.",kind:"healthyfood",mode:"sort"},
  {id:"hygiene",cat:"world",icon:"🧼",title:"Clean & Healthy",desc:"Build healthy daily habits.",bmTitle:"Bersih & Sihat",bmDesc:"Bina tabiat harian yang sihat.",kind:"hygiene",mode:"sequence"},
  {id:"safety",cat:"world",icon:"🛡️",title:"Safety Scout",desc:"Make safe choices.",bmTitle:"Pengakap Keselamatan",bmDesc:"Buat pilihan yang selamat.",kind:"safety",mode:"tap"},
  {id:"community",cat:"world",icon:"🏙️",title:"Community Helpers",desc:"Meet people who help us.",bmTitle:"Pembantu Komuniti",bmDesc:"Kenali orang yang membantu kita.",kind:"community",mode:"tap"},
  {id:"transport",cat:"world",icon:"🚗",title:"Transport Explorer",desc:"Explore ways people travel.",bmTitle:"Jelajah Pengangkutan",bmDesc:"Teroka cara manusia bergerak.",kind:"transport",mode:"tap"},
  {id:"home",cat:"world",icon:"🏠",title:"Home Helper",desc:"Find objects and jobs at home.",bmTitle:"Pembantu Rumah",bmDesc:"Kenali objek dan tugas di rumah.",kind:"home",mode:"sort"},
  {id:"school",cat:"world",icon:"🏫",title:"School Explorer",desc:"Explore school routines and places.",bmTitle:"Jelajah Sekolah",bmDesc:"Teroka rutin dan tempat di sekolah.",kind:"school",mode:"tap"},
  {id:"timeofday",cat:"world",icon:"🌅",title:"Day & Night",desc:"Explore daily routines.",bmTitle:"Siang & Malam",bmDesc:"Teroka rutin harian.",kind:"daynight",mode:"sequence"},
  {id:"seasons",cat:"world",icon:"🍂",title:"Season Quest",desc:"Explore changes in the year.",bmTitle:"Misi Musim",bmDesc:"Teroka perubahan sepanjang tahun.",kind:"seasons",mode:"tap"},
  {id:"naturewalk",cat:"world",icon:"🥾",title:"Nature Walk",desc:"Spot things in nature.",bmTitle:"Jalan Alam",bmDesc:"Cari benda di alam semula jadi.",kind:"naturewalk",mode:"tap"},
  {id:"maps",cat:"world",icon:"🗺️",title:"Little Map Maker",desc:"Learn simple directions.",bmTitle:"Pembina Peta Kecil",bmDesc:"Belajar arah mudah.",kind:"maps",mode:"drag"},
  {id:"culture",cat:"world",icon:"🌏",title:"Our World",desc:"Celebrate places, food and greetings.",bmTitle:"Dunia Kita",bmDesc:"Kenali tempat, makanan dan sapaan.",kind:"culture",mode:"tap"},
  {id:"kindness",cat:"world",icon:"💛",title:"Kindness Quest",desc:"Choose kind actions.",bmTitle:"Misi Kebaikan",bmDesc:"Pilih tindakan yang baik.",kind:"kindness",mode:"tap"},

  {id:"memory",cat:"world",icon:"🧠",title:"Memory Mission",desc:"Remember and match pictures.",bmTitle:"Misi Memori",bmDesc:"Ingat dan padankan gambar.",kind:"memory",mode:"memory"},
  {id:"oddone",cat:"world",icon:"🕵️",title:"Odd One Out",desc:"Find what does not belong.",bmTitle:"Yang Berbeza",bmDesc:"Cari yang tidak sepatutnya berada dalam kumpulan.",kind:"oddone",mode:"tap"},
  {id:"patternslogic",cat:"world",icon:"🧩",title:"Pattern Puzzle",desc:"Solve playful patterns.",bmTitle:"Teka-teki Corak",bmDesc:"Selesaikan corak dengan cara menyeronokkan.",kind:"patterns",mode:"tap"},
  {id:"matchinglogic",cat:"world",icon:"🔗",title:"Match the Pair",desc:"Find things that belong together.",bmTitle:"Padan Pasangan",bmDesc:"Cari benda yang sesuai bersama.",kind:"pairing",mode:"drag"},
  {id:"treasurelogic",cat:"world",icon:"🗝️",title:"Treasure Clues",desc:"Follow simple clues to the treasure.",bmTitle:"Petunjuk Harta Karun",bmDesc:"Ikuti petunjuk mudah menuju harta karun.",kind:"clues",mode:"tap"},
  {id:"creativecolor",cat:"world",icon:"🎨",title:"Colour Creator",desc:"Explore colours and choices.",bmTitle:"Pencipta Warna",bmDesc:"Teroka warna dan pilihan.",kind:"colors",mode:"tap"},
  {id:"musicrhythm",cat:"world",icon:"🥁",title:"Rhythm Quest",desc:"Tap simple rhythm patterns.",bmTitle:"Misi Irama",bmDesc:"Tepuk corak irama mudah.",kind:"rhythm",mode:"tap"},
  {id:"coding",cat:"world",icon:"🤖",title:"Tiny Coder",desc:"Guide a buddy with simple steps.",bmTitle:"Koder Kecil",bmDesc:"Pandu kawan dengan langkah mudah.",kind:"coding",mode:"sequence"},
  {id:"builder",cat:"world",icon:"🧱",title:"Build & Balance",desc:"Choose what makes a strong build.",bmTitle:"Bina & Seimbang",bmDesc:"Pilih cara membina yang kukuh.",kind:"builder",mode:"tap"},
  {id:"treasurecount",cat:"world",icon:"💎",title:"Treasure Counter",desc:"Count gems to unlock treasure.",bmTitle:"Kira Harta Karun",bmDesc:"Kira permata untuk membuka harta.",kind:"count",mode:"count"},
  {id:"garden",cat:"world",icon:"🌻",title:"Little Gardener",desc:"Plant, water and care for a garden.",bmTitle:"Pekebun Kecil",bmDesc:"Tanam, siram dan jaga taman.",kind:"garden",mode:"sequence"},
  {id:"petcare",cat:"world",icon:"🐾",title:"Pet Care",desc:"Learn how to care for a pet.",bmTitle:"Jaga Haiwan Peliharaan",bmDesc:"Belajar menjaga haiwan peliharaan.",kind:"petcare",mode:"sequence"},
  {id:"dressweather",cat:"world",icon:"🧥",title:"Dress for Weather",desc:"Choose clothes for the day.",bmTitle:"Pakai Ikut Cuaca",bmDesc:"Pilih pakaian mengikut cuaca.",kind:"dressweather",mode:"drag"},
  {id:"dailyplanner",cat:"world",icon:"📅",title:"My Little Day",desc:"Build a simple daily plan.",bmTitle:"Hari Kecil Saya",bmDesc:"Bina rancangan harian mudah.",kind:"dailyplanner",mode:"sequence"},
  {id:"bigquestion",cat:"world",icon:"💡",title:"Curious Questions",desc:"Ask, think and choose.",bmTitle:"Soalan Ingin Tahu",bmDesc:"Tanya, fikir dan pilih.",kind:"curious",mode:"tap"},
  {id:"adventurechallenge",cat:"world",icon:"🏕️",title:"Adventure Challenge",desc:"Mix language, math and world skills.",bmTitle:"Cabaran Pengembaraan",bmDesc:"Gabungkan kemahiran bahasa, matematik dan dunia.",kind:"mixed",mode:"tap"}
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


/* =========================
   TRAINING WORLD V6 — 100 MODULES × 50 MISSIONS
   Questions are generated from small, reusable age-appropriate banks so the
   browser stays light while every module still contains a 50-step progression.
   ========================= */
trainingModules=trainingModules.filter(m=>!['dailyplanner','bigquestion','adventurechallenge'].includes(m.id));

const W50=[
 ['cat','🐱','CAT','KUCING'],['dog','🐶','DOG','ANJING'],['sun','☀️','SUN','MATAHARI'],['bus','🚌','BUS','BAS'],['hat','🧢','HAT','TOPI'],['fish','🐟','FISH','IKAN'],['ball','⚽','BALL','BOLA'],['bed','🛏️','BED','KATIL'],['cup','🥤','CUP','CAWAN'],['map','🗺️','MAP','PETA'],['pen','🖊️','PEN','PEN'],['pig','🐷','PIG','BABI'],['hen','🐔','HEN','AYAM'],['fox','🦊','FOX','MUSANG'],['jam','🍓','JAM','JEM'],['log','🪵','LOG','KAYU'],['sun','☀️','SUN','MATAHARI'],['van','🚐','VAN','VAN'],['web','🕸️','WEB','Sarang'],['red','🔴','RED','MERAH'],['blue','🔵','BLUE','BIRU'],['green','🟢','GREEN','HIJAU'],['yellow','🟡','YELLOW','KUNING'],['pink','🩷','PINK','MERAH JAMBU'],['black','⚫','BLACK','HITAM'],['white','⚪','WHITE','PUTIH'],['big','🐘','BIG','BESAR'],['small','🐭','SMALL','KECIL'],['hot','🔥','HOT','PANAS'],['cold','🧊','COLD','SEJUK'],['fast','🐆','FAST','LAJU'],['slow','🐢','SLOW','PERLAHAN'],['happy','😊','HAPPY','GEMBIRA'],['sad','😢','SAD','SEDIH'],['up','⬆️','UP','ATAS'],['down','⬇️','DOWN','BAWAH'],['open','🚪','OPEN','BUKA'],['close','🔒','CLOSE','TUTUP'],['run','🏃','RUN','LARI'],['jump','🦘','JUMP','LOMPAT'],['eat','🍎','EAT','MAKAN'],['sleep','😴','SLEEP','TIDUR'],['read','📖','READ','BACA'],['write','✏️','WRITE','TULIS'],['wash','🧼','WASH','BASUH'],['play','🎮','PLAY','MAIN'],['look','👀','LOOK','LIHAT'],['listen','👂','LISTEN','DENGAR'],['help','🤝','HELP','BANTU'],['kind','💛','KIND','BAIK']
];
const NUM_OBJECTS=['🍎','⭐','🐟','🦋','🍪','🚀','🧸','⚽','🌸','🪙','💎','🍓'];
const SHAPES=[['circle','🔵','Circle','Bulatan'],['triangle','🔺','Triangle','Segi tiga'],['square','🟦','Square','Segi empat sama'],['rectangle','🟨','Rectangle','Segi empat tepat'],['star','⭐','Star','Bintang'],['heart','❤️','Heart','Hati']];
const COLORS=[['red','🔴','Red','Merah'],['blue','🔵','Blue','Biru'],['green','🟢','Green','Hijau'],['yellow','🟡','Yellow','Kuning'],['orange','🟠','Orange','Oren'],['purple','🟣','Purple','Ungu'],['pink','🩷','Pink','Merah jambu']];
const ANIMAL_SIMPLE=[['Dog','🐶','Anjing','bark'],['Cat','🐱','Kucing','meow'],['Cow','🐮','Lembu','moo'],['Lion','🦁','Singa','roar'],['Frog','🐸','Katak','ribbit'],['Duck','🦆','Itik','quack'],['Horse','🐴','Kuda','neigh'],['Sheep','🐑','Biri-biri','baa'],['Elephant','🐘','Gajah','trumpet'],['Giraffe','🦒','Zirafah',''],['Rabbit','🐰','Arnab',''],['Tiger','🐯','Harimau',''],['Panda','🐼','Panda',''],['Koala','🐨','Koala',''],['Camel','🐪','Unta',''],['Penguin','🐧','Penguin',''],['Dolphin','🐬','Ikan lumba-lumba',''],['Whale','🐳','Paus',''],['Eagle','🦅','Helang',''],['Bee','🐝','Lebah','buzz'],['Butterfly','🦋','Rama-rama',''],['Spider','🕷️','Labah-labah',''],['Monkey','🐒','Monyet',''],['Snake','🐍','Ular',''],['Kangaroo','🦘','Kanggaru','']];
const FOOD=[['apple','🍎','Apple','Epal'],['banana','🍌','Banana','Pisang'],['carrot','🥕','Carrot','Lobak'],['broccoli','🥦','Broccoli','Brokoli'],['fish','🐟','Fish','Ikan'],['rice','🍚','Rice','Nasi'],['milk','🥛','Milk','Susu'],['bread','🍞','Bread','Roti'],['water','💧','Water','Air'],['egg','🥚','Egg','Telur']];
const WEATHER=[['☀️','Sunny','Cerah','sun'],['🌧️','Rainy','Hujan','rain'],['🌬️','Windy','Berangin','wind'],['☁️','Cloudy','Berawan','cloud'],['⛈️','Stormy','Ribut','storm'],['❄️','Snowy','Bersalji','snow']];
const SENSES=[['👀','eyes','Mata','see'],['👂','ears','Telinga','hear'],['👃','nose','Hidung','smell'],['👅','tongue','Lidah','taste'],['✋','hands','Tangan','touch']];
const OPP=[['big','small','besar','kecil'],['hot','cold','panas','sejuk'],['up','down','atas','bawah'],['fast','slow','laju','perlahan'],['happy','sad','gembira','sedih'],['open','close','buka','tutup'],['day','night','siang','malam'],['full','empty','penuh','kosong'],['near','far','dekat','jauh'],['light','dark','cerah','gelap']];
const COMMUNITY=[['👨‍⚕️','doctor','doktor','helps sick people','membantu orang sakit'],['👩‍🏫','teacher','guru','helps children learn','membantu kanak-kanak belajar'],['👨‍🚒','firefighter','bomba','helps in fires','membantu ketika kebakaran'],['👮','police officer','polis','helps keep people safe','membantu menjaga keselamatan'],['👨‍🍳','chef','tukang masak','cooks food','memasak makanan'],['👩‍🌾','farmer','petani','grows food','menanam makanan'],['🧑‍🔧','mechanic','mekanik','fixes vehicles','membaiki kenderaan'],['📮','post worker','pekerja pos','delivers letters','menghantar surat']];
const VEHICLES=[['🚗','car','kereta','road','jalan'],['🚌','bus','bas','road','jalan'],['🚆','train','kereta api','track','landasan'],['✈️','plane','kapal terbang','sky','langit'],['🚢','boat','bot','water','air'],['🚲','bicycle','basikal','road','jalan'],['🚑','ambulance','ambulans','road','jalan'],['🚁','helicopter','helikopter','sky','langit']];
const BODY=[['👀','eyes','mata','see','melihat'],['👂','ears','telinga','hear','mendengar'],['👃','nose','hidung','smell','menghidu'],['👄','mouth','mulut','eat','makan'],['🦷','teeth','gigi','chew','mengunyah'],['🖐️','hands','tangan','hold','memegang'],['🦶','feet','kaki','walk','berjalan'],['🧠','brain','otak','think','berfikir']];
const LIVING=[['🌳','tree','tumbuhan','living'],['🐶','dog','haiwan','living'],['🌸','flower','tumbuhan','living'],['🐟','fish','haiwan','living'],['🪨','rock','batu','nonliving'],['🪑','chair','kerusi','nonliving'],['🚗','car','kereta','nonliving'],['⚽','ball','bola','nonliving']];
const SAFETY=[['🔥','A fire','Api','tell a grown-up','beritahu orang dewasa'],['🚗','A road','Jalan raya','stop and look','berhenti dan lihat'],['🔌','A socket','Soket','do not touch','jangan sentuh'],['🐕','An unknown dog','Anjing yang tidak dikenali','ask a grown-up first','tanya orang dewasa dahulu'],['🧴','Medicine','Ubat','ask a grown-up','tanya orang dewasa'],['🌊','Deep water','Air dalam','stay with a grown-up','bersama orang dewasa']];
const KINDNESS=[['🤝','Help a friend','Bantu kawan'],['😊','Say thank you','Ucap terima kasih'],['🧸','Share a toy','Kongsi mainan'],['🧹','Help tidy up','Bantu mengemas'],['💛','Use kind words','Guna kata-kata baik'],['👂','Listen when someone speaks','Dengar apabila orang bercakap']];
const SIMPLE_SCI=[
 ['🧊','What melts when it gets warm?',['Ice 🧊','Rock 🪨','Ball ⚽'],'Ice 🧊','Ais 🧊'],
 ['🎈','What happens when air goes into a balloon?',['It gets bigger 🎈','It becomes a rock 🪨','It gets smaller'],'It gets bigger 🎈','Ia jadi lebih besar 🎈'],
 ['🧽','Which can soak up water?',['Sponge 🧽','Rock 🪨','Metal spoon 🥄'],'Sponge 🧽','Span 🧽'],
 ['🪨','Which is hard?',['Rock 🪨','Cloud ☁️','Water 💧'],'Rock 🪨','Batu 🪨'],
 ['🌱','What does a plant need?',['Water 💧','Only toys 🧸','Only music 🎵'],'Water 💧','Air 💧'],
 ['🔦','What makes a shadow?',['An object blocks light 💡','A song 🎵','A smell 👃'],'An object blocks light 💡','Objek menghalang cahaya 💡'],
 ['🌈','What can help make a rainbow?',['Sunlight and water ☀️💧','Only sand 🏖️','Only rocks 🪨'],'Sunlight and water ☀️💧','Cahaya matahari dan air ☀️💧'],
 ['🧲','What can a magnet attract?',['Some metal 🧲','Paper only 📄','Water only 💧'],'Some metal 🧲','Sesetengah logam 🧲'],
 ['🚗','What can make a toy car move?',['A push 👋','A colour 🎨','A smell 👃'],'A push 👋','Tolakan 👋'],
 ['🌬️','What is moving air called?',['Wind 💨','Rock 🪨','Shadow 🌑'],'Wind 💨','Angin 💨']
];

function shuffleCopy(a){return [...a].sort(()=>Math.random()-.5);}
function choice3(answer, pool){let arr=shuffleCopy(pool.filter(x=>x!==answer));return [answer,...arr.slice(0,2)];}
function qObj(icon,prompt,opts,answer,promptMs=null,optsMs=null,answerMs=null,interaction='tap'){
  return {icon,prompt,opts,answer,promptMs:promptMs||prompt,optsMs:optsMs||opts,answerMs:answerMs||answer,interaction};
}
function qFromW(i,mode='tap'){
  const w=W50[i%W50.length], next=W50[(i+1)%W50.length], alt=W50[(i+2)%W50.length];
  return qObj(w[1],`Which word matches ${w[1]}?`,choice3(w[2],[next[2],alt[2],w[2]]),w[2],`Apakah perkataan bagi ${w[1]}?`,choice3(w[3],[next[3],alt[3],w[3]]),w[3],mode);
}
function makeQuestions(m){
  const out=[];
  for(let i=0;i<50;i++){
    const k=m.kind, n=i%50, mode=m.mode;
    let q;
    if(k==='letters'){
      const letter=String.fromCharCode(65+(i%26)), next=String.fromCharCode(65+((i+1)%26)), prev=String.fromCharCode(65+((i+25)%26));
      const bm=String.fromCharCode(65+(i%26)); q=qObj('🔤',`Which letter is ${letter}?`,shuffleCopy([letter,next,prev]),letter,`Huruf manakah ${bm}?`,shuffleCopy([bm,next,prev]),bm,mode);
    } else if(k==='phonics'){
      const w=W50[i%W50.length], letter=w[2][0], wrong1=W50[(i+7)%W50.length][2][0], wrong2=W50[(i+13)%W50.length][2][0];
      q=qObj(w[1],`What sound starts ${w[2]}?`,shuffleCopy([letter,wrong1,wrong2]),letter,`Bunyi apakah pada awal ${w[3]}?`,shuffleCopy([letter,wrong1,wrong2]),letter,mode);
    } else if(k==='spelling'){
      const spellPool=W50.filter(x=>x[2].length<=4&&!x[3].includes(' ')), w=spellPool[i%spellPool.length], letters=w[2].split(''), answer=letters.join(''), bmAnswer=w[3].toUpperCase(), bmLetters=bmAnswer.split('');
      const makeTiles=chars=>{const distractors='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(x=>!chars.includes(x));return shuffleCopy([...chars,...shuffleCopy(distractors).slice(0,Math.max(2,Math.min(3,chars.length)))]);};
      q=qObj(w[1],`Build the word: ${w[2]}`,makeTiles(letters),answer,`Bina perkataan: ${bmAnswer}`,makeTiles(bmLetters),bmAnswer,'build');
    } else if(k==='sight'){
      const w=['I','AM','THE','A','MY','SEE','CAN','LIKE','WE','GO','TO','IS','IT','YOU','ME','IN','ON','UP','BIG','RED'][i%20]; q=qObj('👀',`Find the word ${w}.`,shuffleCopy([w,['AM','THE','MY','SEE','GO','LIKE','YOU'][i%7],['A','CAN','IS','IT','ME','IN','UP'][i%7]]),w,`Cari perkataan ${w}.`,shuffleCopy([w,['AM','THE','MY','SEE','GO','LIKE','YOU'][i%7],['A','CAN','IS','IT','ME','IN','UP'][i%7]]),w,mode);
    } else if(k==='reading'||k==='story'){
      const w=W50[i%W50.length], w2=W50[(i+5)%W50.length];
      const p=`I see ${w[2].toLowerCase()}. What do I see?`, pms=`Saya nampak ${w[3].toLowerCase()}. Apakah yang saya nampak?`;
      q=qObj(w[1],p,[w[2],w2[2],W50[(i+9)%50][2]],w[2],pms,[w[3],w2[3],W50[(i+9)%50][3]],w[3],mode);
    } else if(k==='picture') q=qFromW(i,mode);
    else if(k==='rhyme'){
      const pairs=[['cat','hat','CAT','HAT','kucing','topi'],['dog','log','DOG','LOG','anjing','kayu'],['sun','run','SUN','RUN','matahari','lari'],['fish','dish','FISH','DISH','ikan','pinggan'],['bee','tree','BEE','TREE','lebah','pokok'],['fox','box','FOX','BOX','musang','kotak'],['star','car','STAR','CAR','bintang','kereta'],['cake','snake','CAKE','SNAKE','kek','ular'],['light','night','LIGHT','NIGHT','cahaya','malam'],['ball','tall','BALL','TALL','bola','tinggi']];
      const a=pairs[i%10], wrong=pairs[(i+3)%10];q=qObj('🎵',`Which word rhymes with ${a[2]}?`,shuffleCopy([a[3],wrong[3],pairs[(i+5)%10][3]]),a[3],`Perkataan manakah berima dengan ${a[2]}?`,shuffleCopy([a[5],wrong[5],pairs[(i+5)%10][5]]),a[5],mode);
    } else if(k==='syllable'){
      const words=[['apple','epal',2,'🍎'],['banana','pisang',3,'🍌'],['rabbit','arnab',2,'🐰'],['elephant','gajah',3,'🐘'],['butterfly','rama-rama',3,'🦋'],['tomato','tomato',3,'🍅'],['computer','komputer',3,'💻'],['banana','pisang',3,'🍌'],['animal','haiwan',3,'🐾'],['potato','kentang',3,'🥔']]; const a=words[i%10], opts=[a[2],a[2]===2?1:2,3];q=qObj(a[3],`How many beats are in ${a[0]}?`,shuffleCopy(opts.map(String)),String(a[2]),`Berapa suku kata dalam ${a[1]}?`,shuffleCopy(opts.map(String)),String(a[2]),mode);
    } else if(k==='vowels'){
      const a=W50[i%W50.length], vowel=a[2].match(/[AEIOU]/)?.[0]||'A';q=qObj(a[1],`Which vowel is in ${a[2]}?`,shuffleCopy(['A','E','I','O','U'].slice(0,3).concat(vowel)),vowel,`Vokal manakah ada dalam ${a[3]}?`,shuffleCopy(['A','E','I','O','U'].slice(0,3).concat(vowel)),vowel,mode);
    } else if(k==='opposites'){
      const a=OPP[i%OPP.length];q=qObj('↔️',`What is the opposite of ${a[0]}?`,shuffleCopy([a[1],OPP[(i+2)%OPP.length][1],OPP[(i+4)%OPP.length][1]]),a[1],`Apakah lawan bagi ${a[2]}?`,shuffleCopy([a[3],OPP[(i+2)%OPP.length][3],OPP[(i+4)%OPP.length][3]]),a[3],mode);
    } else if(k==='action'){
      const a=W50[(i*2)%W50.length], b=W50[(i*2+7)%W50.length], c=W50[(i*2+13)%W50.length];q=qObj(a[1],`Which is an action word?`,shuffleCopy([a[2],b[2],c[2]]),a[2],`Yang manakah kata kerja?`,shuffleCopy([a[3],b[3],c[3]]),a[3],mode);
    } else if(k==='describing'){
      const a=W50[(i+26)%W50.length], b=W50[(i+2)%W50.length], c=W50[(i+8)%W50.length];q=qObj('🎨',`Which word describes ${a[1]}?`,shuffleCopy(['big','small','red','fast','happy'].slice(i%3,i%3+3).concat('big').slice(0,3)),['big','small','red','fast','happy'][i%5],`Perkataan manakah menerangkan gambar?`,['besar','kecil','merah','laju','gembira'].slice(i%3,i%3+3),['besar','kecil','merah','laju','gembira'][i%5],mode);
    } else if(k==='sentence'){
      const a=W50[i%W50.length], b=W50[(i+1)%W50.length];q=qObj('🧱',`What comes first in: “I see ${a[2].toLowerCase()}.”`,shuffleCopy(['I','see',a[2].toLowerCase()]),'I',`Apakah perkataan pertama dalam ayat “Saya nampak ${a[3].toLowerCase()}.”`,shuffleCopy(['Saya','nampak',a[3].toLowerCase()]),'Saya',mode);
    } else if(k==='plural'){
      const a=W50[i%W50.length], plural=a[2].endsWith('S')?a[2]:a[2]+'S';q=qObj(a[1],`Which shows more than one ${a[2]}?`,shuffleCopy([plural,a[2],W50[(i+4)%50][2]]),plural,`Yang manakah menunjukkan lebih daripada satu ${a[3]}?`,shuffleCopy([plural,a[3],W50[(i+4)%50][3]]),plural,mode);
    } else if(k==='wordfamily'){
      const families=[['CAT','HAT','MAT','kucing','topi','tikar'],['DOG','LOG','FOG','anjing','kayu','kabus'],['SUN','RUN','FUN','matahari','lari','seronok'],['BEE','TREE','SEE','lebah','pokok','lihat'],['BALL','TALL','CALL','bola','tinggi','panggil']]; const a=families[i%5];q=qObj('🏠',`Which word belongs with ${a[0]}?`,shuffleCopy([a[1],a[2],'FISH']),a[1],`Yang manakah satu keluarga dengan ${a[0]}?`,shuffleCopy([a[4],a[5],'IKAN']),a[4],mode);
    } else if(k==='count'||k==='count20'||k==='treasurecount'){
      const max=k==='count20'?20:10, num=(i%max)+1, obj=NUM_OBJECTS[(i*7)%NUM_OBJECTS.length], opts=shuffleCopy([num,Math.max(1,num-1),Math.min(max,num+1)].map(String));
      const group=Array.from({length:num},()=>`<span style="display:inline-block;font-size:clamp(22px,5vw,38px);margin:3px">${obj}</span>`).join('');
      q=qObj(obj,`How many objects can you count?`,opts,String(num),`Berapakah jumlah objek?`,opts,String(num),mode);q.sceneHtml=`<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;max-width:340px;margin:auto;line-height:1.15">${group}</div>`;
    } else if(k==='addition'||k==='mathstory'){
      const a=(i%5)+1,b=((i*2)%5)+1,c=a+b;const opts=shuffleCopy([c,c+1,Math.max(0,c-1)].map(String));const obj=NUM_OBJECTS[(i*5)%NUM_OBJECTS.length];
      const groups=`<span style="font-size:clamp(22px,4.5vw,34px)">${Array.from({length:a},()=>obj).join('')}</span><b style="font-size:25px;margin:0 10px">+</b><span style="font-size:clamp(22px,4.5vw,34px)">${Array.from({length:b},()=>obj).join('')}</span>`;
      q=qObj('➕',`${a} + ${b} = ?`,opts,String(c),`Berapakah ${a} + ${b}?`,opts,String(c),mode);q.sceneHtml=`<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px">${groups}</div>`;
    } else if(k==='subtraction'){
      const a=5+(i%5),b=1+(i%4),c=a-b;const opts=shuffleCopy([c,c+1,Math.max(0,c-1)].map(String));const obj=NUM_OBJECTS[(i*3)%NUM_OBJECTS.length];
      q=qObj('➖',`${a} − ${b} = ?`,opts,String(c),`Berapakah ${a} − ${b}?`,opts,String(c),mode);q.sceneHtml=`<div style="font-size:clamp(22px,4.5vw,34px);text-align:center">${Array.from({length:a},(_,j)=>j>=c?`<span style="opacity:.35;text-decoration:line-through">${obj}</span>`:obj).join(' ')}</div>`;
    } else if(k==='compare'||k==='same'){
      const a=1+(i%8),b=(i*3)%9+1, ans=k==='same'?(a===b?'SAME':'DIFFERENT'):(a>b?'LEFT':a<b?'RIGHT':'SAME');const opts=k==='same'?['SAME','DIFFERENT','MAYBE']:['LEFT','SAME','RIGHT'];const obj=NUM_OBJECTS[(i*11)%NUM_OBJECTS.length];
      const left=Array.from({length:a},()=>obj).join(' '),right=Array.from({length:b},()=>obj).join(' ');const prompt=k==='same'?`Are these groups the same?`:`Which group has more?`;
      const promptMs=k==='same'?`Adakah kumpulan ini sama?`:`Kumpulan manakah lebih banyak?`;
      q=qObj('⚖️',prompt,opts,ans,promptMs,opts,ans,mode);q.sceneHtml=`<div style="display:flex;justify-content:space-around;align-items:center;gap:12px;text-align:center;flex-wrap:wrap"><div><b>LEFT</b><div style="max-width:145px;font-size:25px;line-height:1.5">${left}</div></div><b style="font-size:24px">VS</b><div><b>RIGHT</b><div style="max-width:145px;font-size:25px;line-height:1.5">${right}</div></div></div>`;
    } else if(k==='beforeafter'){
      const x=2+(i%8), after=x+1,before=x-1;const ans=i%2===0?after:before;const prompt=i%2===0?`What comes after ${x}?`:`What comes before ${x}?`;const promptMs=i%2===0?`Apakah nombor selepas ${x}?`:`Apakah nombor sebelum ${x}?`;q=qObj('🔢',prompt,shuffleCopy([String(ans),String(x),String(i%2===0?before:after)]),String(ans),promptMs,shuffleCopy([String(ans),String(x),String(i%2===0?before:after)]),String(ans),mode);
    } else if(k==='shapes'){
      const a=SHAPES[i%SHAPES.length], wrong=SHAPES[(i+2)%SHAPES.length];q=qObj(a[1],`Which shape is ${a[2]}?`,shuffleCopy([a[2],wrong[2],SHAPES[(i+4)%6][2]]),a[2],`Bentuk manakah ${a[3]}?`,shuffleCopy([a[3],wrong[3],SHAPES[(i+4)%6][3]]),a[3],mode);
    } else if(k==='patterns'){
      const a=COLORS[i%COLORS.length],b=COLORS[(i+1)%COLORS.length];q=qObj('🧩',`${a[2]}, ${b[2]}, ${a[2]}, ?`,[a[2],b[2],COLORS[(i+2)%COLORS.length][2]],a[2],`${a[3]}, ${b[3]}, ${a[3]}, ?`,[a[3],b[3],COLORS[(i+2)%COLORS.length][3]],a[3],mode);
    } else if(k==='size'||k==='length'||k==='height'){
      const vals=[['🐘','Elephant','Gajah','big','besar'],['🐭','Mouse','Tikus','small','kecil'],['🦒','Giraffe','Zirafah','tall','tinggi'],['🐜','Ant','Semut','small','kecil'],['🚂','Train','Kereta api','long','panjang'],['🧵','Thread','Benang','long','panjang']];const a=vals[i%vals.length];q=qObj(a[0],`Which word describes this object?`,shuffleCopy([a[3],'small','big']),a[3],`Perkataan manakah menerangkan objek ini?`,shuffleCopy([a[4],'kecil','besar']),a[4],mode);
    } else if(k==='position'){
      const a=[['⬆️','above','atas'],['⬇️','below','bawah'],['➡️','beside','sebelah'],['📦','inside','dalam']][i%4];q=qObj('📍',`Where is the arrow? ${a[0]}`,shuffleCopy([a[1],'inside','below']),a[1],`Di manakah anak panah? ${a[0]}`,shuffleCopy([a[2],'dalam','bawah']),a[2],mode);
    } else if(k==='time'){
      const h=(i%12)+1, clock=['🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'][h-1], ans=`${h}:00`;q=qObj(clock,`What time is shown?`,shuffleCopy([ans,`${(h%12)+1}:00`,`${((h+4)%12)+1}:00`]),ans,`Pukul berapakah ini?`,shuffleCopy([ans,`${(h%12)+1}:00`,`${((h+4)%12)+1}:00`]),ans,mode);
    } else if(k==='money'){
      const a=1+(i%3),b=1+((i+1)%3),c=a+b;const opts=shuffleCopy([c,c+1,c+2].map(String));q=qObj('🪙',`You have ${a} coins and get ${b} more. How many?`,opts,String(c),`Kamu ada ${a} syiling dan dapat ${b} lagi. Berapa jumlahnya?`,opts,String(c),mode);
    } else if(k==='measurement'){
      const a=1+(i%5), b=a+1; q=qObj('📏',`Which is longer: ${a} blocks or ${b} blocks?`,[` ${a} blocks`,`${b} blocks`,'Same'],`${b} blocks`,`Yang manakah lebih panjang: ${a} blok atau ${b} blok?`,[` ${a} blok`,`${b} blok`,'Sama'],`${b} blok`,mode);
    } else if(k==='skip2'){
      const x=(i%8)*2+2, ans=x+2;q=qObj('2️⃣',`What comes after ${x} when counting by 2s?`,shuffleCopy([String(ans),String(x+1),String(x+3)]),String(ans),`Apakah nombor selepas ${x} apabila kira 2-2?`,shuffleCopy([String(ans),String(x+1),String(x+3)]),String(ans),mode);
    } else if(k==='animals'||k==='habitats'){
      const arr=k==='animals'?animal50[i%animal50.length]:animalHabitat50[i%animalHabitat50.length];
      if(k==='animals'){const [,icon,prompt,opts,ans,sound]=arr;q=qObj(icon, prompt,opts,ans,localizeActivityText.call(null,prompt),opts,ans,mode);}
      else {const [icon,prompt,opts,ans]=arr;q=qObj(icon,prompt,opts,ans,localizeActivityText(prompt),opts,ans,mode);}
    } else if(['animalsounds','animalfood','animalbody','babyanimals','movement','farm','jungle','ocean','arctic','insects','birds','animalgroups','animalsafety'].includes(k)){
      const a=ANIMAL_SIMPLE[i%ANIMAL_SIMPLE.length], b=ANIMAL_SIMPLE[(i+3)%ANIMAL_SIMPLE.length], c=ANIMAL_SIMPLE[(i+7)%ANIMAL_SIMPLE.length];
      if(k==='animalsounds'){q=qObj(a[1],`Which animal says ${a[3].toUpperCase()}?`,shuffleCopy([a[0],b[0],c[0]]),a[0],`Haiwan manakah berbunyi ${a[3].toUpperCase()}?`,shuffleCopy([a[2],b[2],c[2]]),a[2],mode);}
      else if(k==='animalbody'){const body=BODY[i%BODY.length];q=qObj(a[1],`Which body part helps an animal ${body[3]}?`,shuffleCopy([body[1],BODY[(i+2)%BODY.length][1],BODY[(i+4)%BODY.length][1]]),body[1],`Bahagian badan manakah membantu haiwan ${body[4]}?`,shuffleCopy([body[2],BODY[(i+2)%BODY.length][2],BODY[(i+4)%BODY.length][2]]),body[2],mode);}
      else if(k==='babyanimals'){q=qObj(a[1],`Which animal is the parent of a baby ${a[2].toLowerCase()}?`,shuffleCopy([a[0],b[0],c[0]]),a[0],`Haiwan manakah induk kepada anak ${a[2].toLowerCase()}?`,shuffleCopy([a[2],b[2],c[2]]),a[2],mode);}
      else {q=qObj(a[1],`Which animal fits this mission?`,shuffleCopy([a[0],b[0],c[0]]),a[0],`Haiwan manakah sesuai dengan misi ini?`,shuffleCopy([a[2],b[2],c[2]]),a[2],mode);}
    } else if(k==='science'||k==='scienceexplorer'){
      const arr=k==='science'?science50[i%science50.length]:scienceExplorer50[i%scienceExplorer50.length];const [icon,prompt,opts,ans]=arr;q=qObj(icon,prompt,opts,ans,localizeActivityText(prompt),opts,ans,mode);
    } else if(['senses','plants','weather','space','lightshadow','soundscience','materials','water','forces','living','earth','recycle','experiments'].includes(k)){
      if(k==='senses'){const a=SENSES[i%SENSES.length];q=qObj(a[0],`Which sense helps us ${a[3]}?`,shuffleCopy([a[1],'eyes','ears']),a[1],`Deria manakah membantu kita ${a[3]==='see'?'melihat':a[3]==='hear'?'mendengar':a[3]==='smell'?'menghidu':a[3]==='taste'?'merasa':'menyentuh'}?`,shuffleCopy([a[2],'mata','telinga']),a[2],mode);}
      else if(k==='plants'){q=qObj('🌱','What helps a plant grow?',shuffleCopy(['Water 💧','Toy 🧸','Shoe 👟']), 'Water 💧','Apakah yang membantu tumbuhan membesar?',shuffleCopy(['Air 💧','Mainan 🧸','Kasut 👟']),'Air 💧',mode);}
      else if(k==='weather'){const a=WEATHER[i%WEATHER.length];q=qObj(a[0],`Which weather is this?`,shuffleCopy([a[1],WEATHER[(i+2)%6][1],WEATHER[(i+4)%6][1]]),a[1],`Apakah cuaca ini?`,shuffleCopy([a[2],WEATHER[(i+2)%6][2],WEATHER[(i+4)%6][2]]),a[2],mode);}
      else if(k==='space'){const qs=[['☀️','What is the Sun?',['A star ⭐','A fish 🐟','A tree 🌳'],'A star ⭐','Apakah Matahari?',['Bintang ⭐','Ikan 🐟','Pokok 🌳'],'Bintang ⭐'],['🌍','What is Earth?',['A planet 🌍','A cloud ☁️','A shoe 👟'],'A planet 🌍','Apakah Bumi?',['Planet 🌍','Awan ☁️','Kasut 👟'],'Planet 🌍'],['🌙','What is the Moon?',['A natural satellite 🌙','A car 🚗','A tree 🌳'],'A natural satellite 🌙','Apakah Bulan?',['Satelit semula jadi 🌙','Kereta 🚗','Pokok 🌳'],'Satelit semula jadi 🌙']];const a=qs[i%3];q=qObj(a[0],a[1],a[2],a[3],a[4],a[5],a[6],mode);}
      else {const a=SIMPLE_SCI[i%SIMPLE_SCI.length];q=qObj(a[0],a[1],a[2],a[3],a[4],a[2].map((x,j)=>j===0?a[4]:x),a[4],mode);}
    } else if(['sorting','feelings','healthyfood','hygiene','safety','community','transport','home','school','daynight','seasons','naturewalk','maps','culture','kindness','oddone','pairing','clues','colors','rhythm','coding','builder','garden','petcare','dressweather','memory'].includes(k)){
      if(k==='feelings'){const a=[['😊','happy','gembira'],['😢','sad','sedih'],['😡','angry','marah'],['😴','tired','letih'],['😮','surprised','terkejut'],['😌','calm','tenang']][i%6];q=qObj(a[0],`How might this face feel?`,shuffleCopy([a[1],'happy','sad']),a[1],`Apakah perasaan wajah ini?`,shuffleCopy([a[2],'gembira','sedih']),a[2],mode);}
      else if(k==='healthyfood'){const a=FOOD[i%FOOD.length];q=qObj(a[1],`Which is a healthy everyday choice?`,shuffleCopy([a[2],FOOD[(i+3)%10][2],FOOD[(i+6)%10][2]]),a[2],`Yang manakah pilihan makanan harian yang baik?`,shuffleCopy([a[3],FOOD[(i+3)%10][3],FOOD[(i+6)%10][3]]),a[3],mode);}
      else if(k==='safety'){const a=SAFETY[i%SAFETY.length];q=qObj(a[0],`What should you do near ${a[1]}?`,shuffleCopy([a[3],'run away alone','touch it']),a[3],`Apakah yang patut dilakukan dekat ${a[2]}?`,shuffleCopy([a[4],'lari seorang diri','sentuh']),a[4],mode);}
      else if(k==='community'){const a=COMMUNITY[i%COMMUNITY.length];q=qObj(a[0],`Who ${a[3]}?`,shuffleCopy([a[1],COMMUNITY[(i+2)%COMMUNITY.length][1],COMMUNITY[(i+4)%COMMUNITY.length][1]]),a[1],`Siapa yang ${a[4]}?`,shuffleCopy([a[2],COMMUNITY[(i+2)%COMMUNITY.length][2],COMMUNITY[(i+4)%COMMUNITY.length][2]]),a[2],mode);}
      else if(k==='transport'){const a=VEHICLES[i%VEHICLES.length];q=qObj(a[0],`Which vehicle travels on ${a[3]}?`,shuffleCopy([a[1],VEHICLES[(i+2)%8][1],VEHICLES[(i+4)%8][1]]),a[1],`Kenderaan manakah bergerak di ${a[4]}?`,shuffleCopy([a[2],VEHICLES[(i+2)%8][2],VEHICLES[(i+4)%8][2]]),a[2],mode);}
      else if(k==='home'||k==='school'){const things=k==='home'?[['🪥','toothbrush','berus gigi','brush teeth','memberus gigi'],['🛏️','bed','katil','sleep','tidur'],['🍽️','plate','pinggan','eat','makan'],['🧹','broom','penyapu','clean','membersih']]:[['📚','book','buku','read','membaca'],['✏️','pencil','pensel','write','menulis'],['🪑','chair','kerusi','sit','duduk'],['🎒','bag','beg','carry school things','membawa barang sekolah']];const a=things[i%4];q=qObj(a[0],`What do we use a ${a[1]} for?`,shuffleCopy([a[3],'eat ice','fly']),a[3],`Untuk apa kita guna ${a[2]}?`,shuffleCopy([a[4],'makan ais','terbang']),a[4],mode);}
      else if(k==='naturewalk'){const a=[['🌳','tree','pokok'],['🌸','flower','bunga'],['🪨','rock','batu'],['🍃','leaf','daun'],['🐦','bird','burung'],['🦋','butterfly','rama-rama']][i%6];q=qObj(a[0],`Can you spot a ${a[1]} in nature?`,['YES','NO','MAYBE'],'YES',`Bolehkah kamu nampak ${a[2]} di alam?`,['YA','TIDAK','MUNGKIN'],'YA',mode);}
      else if(k==='kindness'){const a=KINDNESS[i%KINDNESS.length];q=qObj(a[0],`Which action is kind?`,shuffleCopy([a[1],'Push someone','Take everything']),a[1],`Yang manakah tindakan yang baik?`,shuffleCopy([a[2],'Tolak orang','Ambil semua']),a[2],mode);}
      else if(k==='living'){const a=LIVING[i%LIVING.length];q=qObj(a[0],`Is a ${a[1]} living or non-living?`,['living','non-living','both'],a[3],`Adakah ${a[2]} hidup atau bukan hidup?`,['hidup','bukan hidup','kedua-duanya'],a[3]==='living'?'hidup':'bukan hidup',mode);}
      else if(k==='oddone'){const group=['🐶','🐱','🐟','🍎','🐰'];const odd='🍎';q=qObj('🕵️',`Which one does not belong with the animals?`,shuffleCopy([odd,...group.filter(x=>x!==odd).slice(0,2)]),odd,`Yang manakah tidak termasuk dalam kumpulan haiwan?`,shuffleCopy([odd,'🐶','🐱']),'🍎',mode);}
      else if(k==='colors'){const a=COLORS[i%COLORS.length];q=qObj(a[1],`Which colour is this?`,shuffleCopy([a[2],COLORS[(i+2)%7][2],COLORS[(i+4)%7][2]]),a[2],`Apakah warna ini?`,shuffleCopy([a[3],COLORS[(i+2)%7][3],COLORS[(i+4)%7][3]]),a[3],mode);}
      else if(k==='memory'){const a=NUM_OBJECTS[i%NUM_OBJECTS.length];q=qObj(a,`Remember this picture: ${a}. Which one did you see?`,shuffleCopy([a,NUM_OBJECTS[(i+3)%12],NUM_OBJECTS[(i+6)%12]]),a,`Ingat gambar ini: ${a}. Yang manakah kamu nampak?`,shuffleCopy([a,NUM_OBJECTS[(i+3)%12],NUM_OBJECTS[(i+6)%12]]),a,mode);}
      else {const a=KINDNESS[i%KINDNESS.length];q=qObj(a[0],`Choose the best next step.`,shuffleCopy([a[1],'Wait forever','Break it']),a[1],`Pilih langkah yang paling baik.`,shuffleCopy([a[2],'Tunggu selamanya','Rosakkan']),a[2],mode);}
    } else {
      q=qFromW(i,mode);
    }
    out.push(q);
  }
  return out;
}
const QUESTION_CACHE=new Map();
function getModuleQuestions(m){if(!QUESTION_CACHE.has(m.id))QUESTION_CACHE.set(m.id,makeQuestions(m));return QUESTION_CACHE.get(m.id);}

trainingModules.forEach(m=>{m.questions=getModuleQuestions(m);m.type='mission50';});

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
  const n=seriesProgress(id,total),pct=Math.round(n/total*100),label=bakawaliLanguage==='ms'?'Kemajuan Misi':'Mission Progress';
  return `<div class="series-progress"><div><b>${label}</b><span>${n}/${total}</span></div><div class="series-progress-bar"><span style="width:${pct}%"></span></div></div>`;
}

function trainingComplete(id){
  if(trainingState.has(id)) return;
  trainingState.add(id); trainingSave(); earnStar("⭐ Training module complete!");
  trainingFeedback("complete");
  renderTrainingCards();
}
let trainingViewFilter="all",trainingViewPage=1;
function renderTrainingCards(filter=trainingViewFilter,page=trainingViewPage){
  trainingViewFilter=filter; trainingViewPage=page;
  const wrap=document.getElementById("trainingModules"); if(!wrap)return;
  const all=trainingModules.filter(m=>filter==="all"||m.cat===filter), perPage=20, totalPages=Math.max(1,Math.ceil(all.length/perPage));
  trainingViewPage=Math.max(1,Math.min(page,totalPages));
  const start=(trainingViewPage-1)*perPage, shown=all.slice(start,start+perPage);
  wrap.innerHTML=shown.map(m=>{
    const done=trainingState.has(m.id), prog=seriesProgress(m.id,50);
    const progressText=done?(bakawaliLanguage==='ms'?"✓ SELESAI":"✓ DONE"):(prog?`${prog}/50`:(bakawaliLanguage==='ms'?"MAIN →":"PLAY →"));
    return `<button class="training-module ${done?"complete":""}" data-training-id="${m.id}">
      <span class="module-icon">${m.icon}</span><span class="module-copy"><b>${moduleTitle(m)}</b><small>${moduleDesc(m)}</small>${!done&&prog?`<span class="module-mini-progress"><i style="width:${prog*2}%"></i></span>`:''}</span>
      <span class="module-status">${progressText}</span>
    </button>`;
  }).join("");
  wrap.querySelectorAll("[data-training-id]").forEach(b=>b.addEventListener("click",()=>openTraining(b.dataset.trainingId)));
  const pager=document.getElementById('trainingPager');
  if(pager){pager.innerHTML=totalPages<=1?'':`<button type="button" data-page="prev" ${trainingViewPage===1?'disabled':''}>←</button><span>${start+1}–${Math.min(start+perPage,all.length)} / ${all.length}</span><button type="button" data-page="next" ${trainingViewPage===totalPages?'disabled':''}>→</button>`;
    pager.querySelector('[data-page="prev"]')?.addEventListener('click',()=>renderTrainingCards(filter,trainingViewPage-1));
    pager.querySelector('[data-page="next"]')?.addEventListener('click',()=>renderTrainingCards(filter,trainingViewPage+1));}
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
  const cat=bakawaliLanguage==="ms"?(m.cat==="language"?"BAHASA":m.cat==="math"?"MATEMATIK":m.cat==="science"?"SAINS":m.cat==="animal"?"HAIWAN":"TEROKA"):(m.cat==="language"?"LANGUAGE":m.cat==="math"?"MATH":"EXPLORER");
  const u=UI_TEXT[bakawaliLanguage];
  const head=`<div class="training-activity-head"><span class="eyebrow">${cat}</span><h3>${m.icon} ${moduleTitle(m)}</h3><p>${moduleDesc(m)}</p><button type="button" class="secondary training-sound-toggle" id="trainingSoundToggle" aria-pressed="true">🔊 ${u.soundOn}</button></div>`;
  if(m.type==="mission50") return head+`<div id="missionStage"></div>`;
  if(m.type==="flash") return head+`<div class="flash-stage" id="trainingStage"></div><div class="activity-actions"><button class="secondary" id="trainHear">🔊 ${UI_TEXT[bakawaliLanguage].hear}</button><button class="primary" id="trainNext">${UI_TEXT[bakawaliLanguage].next}</button></div>`;
  if(m.type==="quiz") return head+`<div class="activity-question">${localizeActivityText(m.q)}</div><div class="activity-options">${m.a.map(x=>`<button data-correct="${x===m.correct}">${localizeChoice(x)}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback"></p>`;
  if(m.type==="spell") return head+`<div id="spellStage"></div>`;
  if(m.type==="reading") return head+`<div class="reading-stage" id="readingStage"></div><div class="activity-actions"><button class="secondary" id="readHear">🔊 ${UI_TEXT[bakawaliLanguage].readAloud}</button><button class="primary" id="readNext">NEXT →</button></div>`;
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
  if(m.type==="dragmatch") return head+`<div id="dragMatchStage"></div>`;
  return head;
}

function doneActivity(id,feedback="🎉 Great job!"){
  const el=document.getElementById("trainFeedback");if(el)el.textContent=feedback;
  trainingComplete(id);
}

function spawnMissionConfetti(root){
  if(!root)return;
  const layer=document.createElement('div');layer.className='mission-confetti';
  for(let i=0;i<14;i++){const s=document.createElement('span');s.textContent=['⭐','✨','🎉','💫'][i%4];s.style.setProperty('--dx',`${(Math.random()*180-90).toFixed(0)}px`);s.style.setProperty('--dy',`${(Math.random()*130+40).toFixed(0)}px`);s.style.setProperty('--r',`${(Math.random()*80-40).toFixed(0)}deg`);layer.appendChild(s);}
  root.appendChild(layer);setTimeout(()=>layer.remove(),900);
}

function wireTraining(m){
  document.querySelectorAll('#trainingModalBody button').forEach(btn=>btn.addEventListener('click',()=>{if(btn.id!=='trainingSoundToggle')trainingClickSound()},{once:false}));
  if(m.type==="mission50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("missionStage");
    const qs=m.questions||getModuleQuestions(m);
    const render=(effect="")=>{
      const q=qs[i%50]; const ms=bakawaliLanguage==='ms';
      const prompt=ms?(q.promptMs||localizeActivityText(q.prompt)):q.prompt; const opts=ms?(q.optsMs||q.opts.map(localizeChoice)):q.opts; const ans=ms?(q.answerMs||localizeChoice(q.answer)):q.answer;
      const mode=q.interaction||m.mode||'tap';
      const optsShuffled=shuffleCopy(opts);
      const progress=seriesProgressMarkup(m.id,50);
      const interactionLabel=mode==='drag'?(ms?'Seret atau tekan jawapan yang betul.':'Drag or tap the correct answer.'):
        mode==='count'?(ms?'Kira dengan jari kamu!':'Count with your fingers!'):
        mode==='sequence'?(ms?'Pilih langkah yang betul.':'Choose the right step.'):
        mode==='sort'?(ms?'Masukkan ke kumpulan yang betul.':'Put it in the right group.'):
        mode==='memory'?(ms?'Ingat gambar sebelum pilih.':'Remember the picture before choosing.'):(ms?'Pilih jawapan yang betul.':'Choose the correct answer.');
      stage.innerHTML=`${progress}<div class="mission50-card ${effect}" data-mode="${mode}">
        <div class="mission50-scene"><div class="mission50-icon" id="missionIcon">${q.sceneHtml||q.icon||'🌟'}</div><div class="mission50-sparkles" aria-hidden="true">✨</div></div>
        <div class="mission50-counter">${ms?'MISI':'MISSION'} ${i+1} / 50</div>
        <h3>${prompt}</h3>
        <p class="mission50-hint">${interactionLabel}</p>
        ${mode==='drag'?`<div class="mission-drag-source" id="missionDragSource" draggable="true"><span>${q.icon||'🌟'}</span><b>${ms?'Seret saya!':'Drag me!'}</b></div>`:''}
        ${mode==='build'?`<div id="buildSlots" style="display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin:14px 0">${ans.split('').map((_,j)=>`<span data-slot="${j}" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:48px;border:2px dashed #8aa5ce;border-radius:10px;font-size:24px;background:#fff">_</span>`).join('')}</div>`:''}
        <div class="mission50-options ${mode==='drag'?'mission-dropzones':''}">${optsShuffled.map((x,j)=>`<button type="button" class="mission50-option" data-value="${String(x).replace(/"/g,'&quot;')}" data-letter="${String(x)}" data-answer="${String(x)===String(ans)}"><span>${mode==='drag'?'🎯':mode==='build'?'🔤':'◆'}</span>${x}</button>`).join('')}</div>
        <p class="activity-feedback" id="trainFeedback">${ms?'Mari cuba!':'Let’s go!'}</p>
      </div>`;
      if(mode==='drag'){
        const source=document.getElementById('missionDragSource');
        if(source){source.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain','mission'));
          source.addEventListener('touchstart',()=>source.classList.add('drag-ready'),{passive:true});}
        stage.querySelectorAll('.mission50-option').forEach(target=>{
          target.addEventListener('dragover',e=>{e.preventDefault();target.classList.add('drag-over');});
          target.addEventListener('dragleave',()=>target.classList.remove('drag-over'));
          target.addEventListener('drop',e=>{e.preventDefault();target.classList.remove('drag-over');target.click();});
        });
      }
      if(mode==='build'){
        let chosen='';
        stage.querySelectorAll('.mission50-option').forEach(btn=>btn.addEventListener('click',()=>{
          if(btn.disabled)return;
          const letter=btn.dataset.letter, expected=ans[chosen.length];
          if(letter!==expected){btn.classList.add('mission-wrong');trainingFeedback('wrong',ms?'Cuba huruf seterusnya!':'Try the next letter!');setTimeout(()=>btn.classList.remove('mission-wrong'),450);return;}
          chosen+=letter;btn.disabled=true;btn.classList.add('mission-correct');
          const slot=stage.querySelector(`[data-slot="${chosen.length-1}"]`);if(slot)slot.textContent=letter;
          if(chosen.length===ans.length){stage.querySelectorAll('.mission50-option').forEach(x=>x.disabled=true);stage.querySelector('.mission50-card')?.classList.add('mission-win');spawnMissionConfetti(stage);trainingFeedback('correct',ms?'🎉 Hebat! Perkataan betul!':'🎉 Great! You built the word!');const finished=seriesAdvance(m.id,i,50,ms?'🎉 Betul!':'🎉 Correct!');i++;if(finished){setTimeout(()=>{if(stage)stage.innerHTML=`<div class="mission-complete"><div class="mission-trophy">🏆</div><h3>${ms?'Misi Selesai!':'Mission Complete!'}</h3><p>${ms?'Kamu jawab 50 soalan!':'You completed all 50 questions!'}</p><div class="mission-reward">⭐ +1 Star &nbsp; 🎉</div></div>`;},700);}else setTimeout(()=>render(),650);}
        }));
        return;
      }
      stage.querySelectorAll('.mission50-option').forEach(btn=>{
        btn.addEventListener('click',()=>{
          if(btn.disabled)return;
          const good=btn.dataset.answer==='true';
          if(good){
            stage.querySelectorAll('.mission50-option').forEach(x=>x.disabled=true);
            btn.classList.add('mission-correct');
            stage.querySelector('.mission50-card')?.classList.add('mission-win');
            const icon=document.getElementById('missionIcon'); if(icon){icon.classList.remove('mission-bounce');void icon.offsetWidth;icon.classList.add('mission-bounce');}
            spawnMissionConfetti(stage);
            trainingFeedback('correct',ms?'🎉 Betul! Hebat!':'🎉 Correct! Great job!');
            const finished=seriesAdvance(m.id,i,50,ms?'🎉 Betul!':'🎉 Correct!');
            i++;
            if(finished){setTimeout(()=>{if(stage)stage.innerHTML=`<div class="mission-complete"><div class="mission-trophy">🏆</div><h3>${ms?'Misi Selesai!':'Mission Complete!'}</h3><p>${ms?'Kamu jawab 50 soalan!':'You completed all 50 questions!'}</p><div class="mission-reward">⭐ +1 Star &nbsp; 🎉</div></div>`;},700);}
            else setTimeout(()=>render(),650);
          }else{
            btn.classList.remove('mission-wrong');void btn.offsetWidth;btn.classList.add('mission-wrong');
            trainingFeedback('wrong',ms?'Cuba lagi!':'Try again!');
          }
        });
      });
    };
    render();
    return;
  }
  if(m.type==="flash"){
    let i=0;const stage=document.getElementById("trainingStage");
    const show=()=>{const [a,b]=m.items[i%m.items.length];stage.innerHTML=`<div class="flash-card"><strong>${a}</strong><span>${b}</span></div>`;speakTraining(a+" "+b);};
    show();document.getElementById("trainHear").onclick=show;
    document.getElementById("trainNext").onclick=()=>{i++;if(i>=m.items.length){doneActivity(m.id,"🌟 Module complete!");i=0;}show();};
  }
  if(m.type==="quiz"){
      document.querySelectorAll(".activity-options button").forEach(b=>b.onclick=()=>{
        const good=b.dataset.correct==="true";
        if(good){trainingFeedback("correct",UI_TEXT[bakawaliLanguage].correct);trainingComplete(m.id);document.querySelectorAll(".activity-options button").forEach(x=>x.disabled=true);}
        else trainingFeedback("wrong",UI_TEXT[bakawaliLanguage].wrong);
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
    let n=3;const stage=document.getElementById("countStage");const show=()=>{const opts=[n,n+1,n-1].sort(()=>Math.random()-.5);stage.innerHTML=`<div class="count-objects">${"🍎".repeat(n)}</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===n}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">How many apples?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct",UI_TEXT[bakawaliLanguage].correct);trainingComplete(m.id);n=n>=9?3:n+1;setTimeout(show,500)}else trainingFeedback("wrong","Count again ☝️");});};show();
  }
  if(m.type==="math"){
    let i=0;const stage=document.getElementById("mathStage");const show=()=>{const [a,b,c]=m.ops[i%m.ops.length];const opts=[c,c+1,Math.max(0,c-1)].sort(()=>Math.random()-.5);stage.innerHTML=`<div class="math-question">${a} + ${b} = ?</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===c}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Add the numbers.</p>`;stage.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{if(btn.dataset.c==="true"){trainingFeedback("correct",UI_TEXT[bakawaliLanguage].correct);trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Try counting the two groups.");});};show();
  }
  if(m.type==="sub"){
    const qs=[[5,2,3],[6,1,5],[7,3,4],[8,2,6],[5,1,4]];let i=0;const stage=document.getElementById("subStage");const show=()=>{const [a,b,c]=qs[i%qs.length];const opts=[c,c+1,Math.max(0,c-1)].sort(()=>Math.random()-.5);stage.innerHTML=`<div class="math-question">${a} − ${b} = ?</div><div class="activity-options">${opts.map(x=>`<button data-c="${x===c}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Take away ${b}.</p>`;stage.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{if(btn.dataset.c==="true"){trainingFeedback("correct",UI_TEXT[bakawaliLanguage].correct);trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Try again!");});};show();
  }
  if(m.type==="pattern"){
    const patterns=[["🔴","🔵","🔴","🔵",["🔴","🟢","🟡"],"🔴"],["⭐","🌙","⭐","🌙",["⭐","☀️","🌙"],"⭐"],["🍎","🍎","🍌","🍎","🍎",["🍌","🍎","🍊"],"🍌"]];let i=0;const stage=document.getElementById("patternStage");const show=()=>{const p=patterns[i%patterns.length];const answer=p[p.length-1];const opts=p[p.length-2];stage.innerHTML=`<div class="pattern-row">${p.slice(0,-2).map(x=>`<span>${x}</span>`).join("")}<span>❓</span></div><div class="activity-options">${opts.map(x=>`<button data-c="${x===answer}">${x}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">What comes next?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct","🎉 Pattern complete!");trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Look at the repeating pattern.");});};show();
  }
  if(m.type==="compare"){
    let i=0;const qs=[[3,5],[7,4],[2,6],[8,8]];const stage=document.getElementById("compareStage");const show=()=>{const [a,b]=qs[i%qs.length];const ans=a===b?"SAME":a>b?"LEFT":"RIGHT";stage.innerHTML=`<div class="compare-row"><span>${"🍎".repeat(a)}</span><span>${"🍎".repeat(b)}</span></div><div class="activity-options"><button data-a="LEFT">👈 More</button><button data-a="SAME">⚖️ Same</button><button data-a="RIGHT">More 👉</button></div><p class="activity-feedback" id="trainFeedback">Which side has more?</p>`;stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.a===ans){trainingFeedback("correct",UI_TEXT[bakawaliLanguage].correct);trainingComplete(m.id);i++;setTimeout(show,450)}else trainingFeedback("wrong","Count the apples again.");});};show();
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
  if(m.type==="dragmatch"){
    let i=0; const puzzles=[
      {item:"🐟",targets:["🌊 Water","🌳 Forest","🏜️ Desert"],answer:0},
      {item:"🐫",targets:["🌊 Ocean","🏜️ Desert","❄️ Snow"],answer:1},
      {item:"🐦",targets:["🌳 Tree","🌊 Ocean","🌋 Volcano"],answer:0},
      {item:"🧊",targets:["☀️ Hot Sun","❄️ Cold Place","🌴 Jungle"],answer:1},
      {item:"🌱",targets:["🪨 Rock","🌍 Soil","☁️ Sky"],answer:1},
      {item:"🚗",targets:["🛣️ Road","🌊 Ocean","🌳 Tree"],answer:0}
    ];
    const stage=document.getElementById("dragMatchStage");
    const show=()=>{
      const q=puzzles[i%puzzles.length];
      const ms=bakawaliLanguage==='ms';
      stage.innerHTML=`<div class="drag-match-card"><div class="drag-match-progress">${ms?'Cabaran':'Challenge'} ${i+1} / ${puzzles.length}</div><div class="drag-object" id="dragObject" draggable="true">${q.item}</div><p>${ms?'Seret objek ke tempat yang betul.':'Drag the object to the right place.'}</p><div class="drag-targets">${q.targets.map((t,j)=>`<button class="drag-target" data-index="${j}">${t}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">${ms?'Cuba!':'Have a go!'}</p></div>`;
      const obj=document.getElementById('dragObject');
      obj.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain','drag'));
      stage.querySelectorAll('.drag-target').forEach(btn=>{
        btn.addEventListener('dragover',e=>{e.preventDefault();btn.classList.add('drag-over')});
        btn.addEventListener('dragleave',()=>btn.classList.remove('drag-over'));
        btn.addEventListener('drop',e=>{e.preventDefault();btn.classList.remove('drag-over');check(Number(btn.dataset.index))});
        btn.addEventListener('click',()=>check(Number(btn.dataset.index)));
      });
      let startX=0,startY=0;
      obj.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;obj.setPointerCapture?.(e.pointerId)});
      obj.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-startX,e.clientY-startY)<12){stage.querySelectorAll('.drag-target').forEach(x=>x.classList.remove('selected'));obj.classList.add('drag-ready');}});
    };
    const check=(idx)=>{
      const q=puzzles[i%puzzles.length]; const ms=bakawaliLanguage==='ms';
      if(idx===q.answer){trainingFeedback('correct',ms?'🎉 Betul!':'🎉 Correct!');i++; if(i>=puzzles.length){trainingComplete(m.id,ms?'🖐️ Hebat! Semua padanan selesai!':'🖐️ Great! All matches complete!');i=0;return;} setTimeout(show,550);}
      else trainingFeedback('wrong',ms?'Cuba tempat lain.':'Try another place.');
    };
    show();
  }
  if(m.type==="animal50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("animalStage");
    const show=()=>{const q=animal50[i%50]; const [kind,icon,prompt,opts,ans,sound]=q; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="animal-live-card"><div class="animal-sky"><div class="animal-sun"></div><div class="animal-cloud"></div><div class="animal-ground"></div><button class="animal-character" id="animalSound" type="button" aria-label="Hear animal">${icon}</button></div><div class="animal-name">Animal Mission ${i+1}<span>${localizeActivityText(prompt)}</span></div><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${localizeChoice(x)}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Listen to the animal, then choose. ${i}/50</p></div>`;
      const sayAnimal=()=>{trainingClickSound();trainingSay(sound);};
      document.getElementById("animalSound").onclick=sayAnimal;
      setTimeout(sayAnimal,120);
      stage.querySelectorAll(".activity-options button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){b.classList.add("correct-choice");trainingFeedback("correct",UI_TEXT[bakawaliLanguage].correct+" "+sound);i++;const finished=seriesAdvance(m.id,i-1,50,"🎉 Correct!");if(!finished)setTimeout(show,650)}else{b.classList.add("wrong-choice");trainingFeedback("wrong","Wrong. Try again! 👂");}});
    }; show();
  }
  if(m.type==="animalhabitat50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("animalHabitatStage");
    const show=()=>{const [icon,q,opts,ans]=animalHabitat50[i%50]; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="habitat-live"><div class="habitat-animal">${icon}</div><h3>Mission ${i+1}: ${localizeActivityText(q)}</h3><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${localizeChoice(x)}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Choose the best answer. ${i}/50</p></div>`;
      stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct",bakawaliLanguage==="ms"?"🎉 Betul! Hebat fikir tentang habitat!":"🎉 Correct habitat thinking!");i++;const finished=seriesAdvance(m.id,i-1,50,"🎉 Correct!");if(!finished)setTimeout(show,550)}else trainingFeedback("wrong","Wrong. Try again!");});
    };show();
  }
  if(m.type==="science50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("scienceStage");
    const show=()=>{const [icon,q,opts,ans]=science50[i%50]; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="science-lab"><div class="science-object">${icon}</div><h3>Mission ${i+1}: ${localizeActivityText(q)}</h3><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${localizeChoice(x)}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Think like a little scientist. ${i}/50</p></div>`;
      stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct",bakawaliLanguage==="ms"?"🔬 Betul! Hebat berfikir seperti saintis!":"🔬 Correct! Great science thinking!");i++;const finished=seriesAdvance(m.id,i-1,50,"🔬 Correct!");if(!finished)setTimeout(show,550)}else trainingFeedback("wrong","Wrong. Test your idea again!");});
    };show();
  }
  if(m.type==="scienceexplorer50"){
    let i=seriesProgress(m.id,50); const stage=document.getElementById("scienceExplorerStage");
    const show=()=>{const [icon,q,opts,ans]=scienceExplorer50[i%50]; const shuffled=[...opts].sort(()=>Math.random()-.5);
      stage.innerHTML=`${seriesProgressMarkup(m.id)}<div class="science-explorer"><div class="space-object">${icon}</div><h3>Mission ${i+1}: ${localizeActivityText(q)}</h3><div class="activity-options">${shuffled.map(x=>`<button data-c="${x===ans}">${localizeChoice(x)}</button>`).join("")}</div><p class="activity-feedback" id="trainFeedback">Explore and choose. ${i}/50</p></div>`;
      stage.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.c==="true"){trainingFeedback("correct",bakawaliLanguage==="ms"?"🚀 Betul! Penjelajah naik tahap!":"🚀 Correct! Explorer level up!");i++;const finished=seriesAdvance(m.id,i-1,50,"🚀 Correct!");if(!finished)setTimeout(show,550)}else trainingFeedback("wrong","Wrong. Try another answer!");});
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
  initLanguage();
updateMusicLanguage();
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
    document.querySelectorAll(".training-filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTrainingCards(b.dataset.filter,1);
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

/* =========================================================
   BAKAWALI ADVENTURE WORLD EXPANSION — QUESTS / BADGES / BUDDY / STORY / CREATOR / PARENT
   ========================================================= */
(function initAdventureExpansion(){
  const dayKey=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
  const qkey=()=>"dailyQuest:"+dayKey();
  const getQuest=()=>{try{return JSON.parse(profileGet(qkey(),"{}"))||{}}catch(e){return {}}};
  const setQuest=x=>profileSet(qkey(),JSON.stringify(x));
  const quests=[
    {id:"spell",icon:"✏️",en:"Complete Spell It!",ms:"Siapkan Eja Perkataan",action:()=>openTraining("spelling"),done:()=>trainingState.has("spelling")},
    {id:"math",icon:"🔢",en:"Finish one Math mission",ms:"Siapkan satu misi Matematik",action:()=>openTraining("addition"),done:()=>trainingState.has("addition")},
    {id:"buddy",icon:"🐾",en:"Make a buddy happy",ms:"Gembirakan satu buddy",action:()=>showPage("collection"),done:()=>Number(profileGet("buddyDaily",0))>=1}
  ];
  function syncDailyQuest(){
    const q=getQuest(); let changed=false;
    quests.forEach(x=>{if(!q[x.id]&&x.done()){q[x.id]=true;changed=true;}});
    if(changed){setQuest(q); if(Object.keys(q).filter(k=>q[k]).length===quests.length && !q.rewarded){q.rewarded=true;setQuest(q);earnStar("🎉 Daily Quest complete! ⭐ +30");profileSet("dailyQuestBonus:"+dayKey(),"1");}}
    renderDailyQuest();
  }
  function renderDailyQuest(){
    const wrap=document.getElementById("dailyQuestList"); if(!wrap)return; const q=getQuest();
    wrap.innerHTML=quests.map(x=>{const done=!!q[x.id];return `<button class="daily-quest-item ${done?'done':''}" data-daily-id="${x.id}"><span>${done?'✅':x.icon}</span><b>${bakawaliLanguage==='ms'?x.ms:x.en}</b><small>${done?(bakawaliLanguage==='ms'?'SELESAI':'DONE'):(bakawaliLanguage==='ms'?'MULA →':'GO →')}</small></button>`}).join("");
    wrap.querySelectorAll("[data-daily-id]").forEach(b=>b.onclick=()=>{const x=quests.find(z=>z.id===b.dataset.dailyId);if(x&&!getQuest()[x.id])x.action();});
  }
  window.bakawaliDailyQuestSync=syncDailyQuest;

  // Wrap training completion so daily missions and badges stay in sync.
  const originalTrainingComplete=trainingComplete;
  trainingComplete=function(id){originalTrainingComplete(id);setTimeout(syncDailyQuest,50);setTimeout(renderBadges,80);setTimeout(updateParentCorner,100)};

  const badgeDefs=[
    {id:"first",icon:"🌟",en:"First Spark",ms:"Percikan Pertama",desc:"Earn your first star.",ok:()=>stars>=1},
    {id:"learner",icon:"📚",en:"Learning Ranger",ms:"Ranger Pembelajaran",desc:"Complete 3 training modules.",ok:()=>trainingState.size>=3},
    {id:"word",icon:"🔤",en:"Word Wizard",ms:"Ahli Perkataan",desc:"Complete 5 language modules.",ok:()=>trainingState.has("abc")&&trainingState.has("spelling")&&trainingState.has("reading")},
    {id:"math",icon:"🔢",en:"Number Hero",ms:"Wira Nombor",desc:"Complete 3 math modules.",ok:()=>["count","addition","subtraction"].every(x=>trainingState.has(x))},
    {id:"animal",icon:"🐾",en:"Animal Ranger",ms:"Ranger Haiwan",desc:"Complete both animal missions.",ok:()=>trainingState.has("animals")&&trainingState.has("animalhabitat")},
    {id:"science",icon:"🔬",en:"Little Scientist",ms:"Saintis Kecil",desc:"Complete both science missions.",ok:()=>trainingState.has("scientist")&&trainingState.has("scienceexplorer")},
    {id:"gamer",icon:"🎮",en:"Game Master",ms:"Juara Permainan",desc:"Play all four games.",ok:()=>Number(profileGet("gamesPlayed",0))>=4},
    {id:"creator",icon:"🎨",en:"Little Creator",ms:"Pencipta Kecil",desc:"Save a scene in Little Creator.",ok:()=>profileGet("creatorSaved","0")==="1"},
    {id:"story",icon:"📖",en:"Story Explorer",ms:"Penjelajah Cerita",desc:"Complete the Lost Star story.",ok:()=>profileGet("storyComplete","0")==="1"}
  ];
  function renderBadges(){
    const grid=document.getElementById("badgeGrid"); if(!grid)return; const unlocked=badgeDefs.filter(x=>x.ok());
    const count=document.getElementById("badgeRoomCount"); if(count)count.textContent=`${unlocked.length} / ${badgeDefs.length}`;
    grid.innerHTML=badgeDefs.map(x=>{const ok=x.ok();return `<article class="badge-tile ${ok?'unlocked':'locked'}"><div>${ok?x.icon:'🔒'}</div><b>${bakawaliLanguage==='ms'?x.ms:x.en}</b><small>${x.desc}</small></article>`}).join("");
  }
  window.renderBadges=renderBadges;

  // Buddy camp
  let activeBuddy=profileGet("activeBuddy","zapko");
  const buddyDefs={zapko:{icon:"⚡",name:"Zapko",ms:"Zapko",color:"Electric",say:"Let's explore!",happy:80,energy:80},bubblu:{icon:"💧",name:"Bubblu",ms:"Bubblu",color:"Water",say:"Splash time!",happy:82,energy:76},flammi:{icon:"🔥",name:"Flammi",ms:"Flammi",color:"Fire",say:"Let's light the trail!",happy:78,energy:84}};
  function buddyState(id){let h=Number(profileGet("buddy:"+id+":happy",buddyDefs[id].happy));let e=Number(profileGet("buddy:"+id+":energy",buddyDefs[id].energy));return {h:Math.max(0,Math.min(100,h)),e:Math.max(0,Math.min(100,e))};}
  function saveBuddy(id,st){profileSet("buddy:"+id+":happy",st.h);profileSet("buddy:"+id+":energy",st.e)}
  function renderBuddy(){const d=buddyDefs[activeBuddy],st=buddyState(activeBuddy);document.querySelectorAll("#buddyPicker button").forEach(b=>b.classList.toggle("active",b.dataset.buddy===activeBuddy));const t=document.getElementById("buddyCampTitle"),h=document.getElementById("buddyHappy"),e=document.getElementById("buddyEnergy"),m=document.getElementById("buddyMood");if(t)t.textContent=`${d.icon} ${d.name} is waiting!`;if(h)h.textContent=st.h;if(e)e.textContent=st.e;if(m)m.textContent=st.h>75?'😊':st.h>45?'🙂':'😴';}
  function buddyAction(action){const st=buddyState(activeBuddy),d=buddyDefs[activeBuddy];let msg='';if(action==='feed'){st.h=Math.min(100,st.h+10);st.e=Math.min(100,st.e+4);msg=bakawaliLanguage==='ms'?`${d.name}: "Sedap! Terima kasih!"`:`${d.name}: "Yum! Thank you!"`;}if(action==='play'){if(st.e<15){msg=bakawaliLanguage==='ms'?`${d.name} penat. Bagi dia rehat dulu.`:`${d.name} is tired. Let me rest!`;}else{st.h=Math.min(100,st.h+8);st.e=Math.max(0,st.e-15);msg=bakawaliLanguage==='ms'?`${d.name}: "Seronoknya!"`:`${d.name}: "That was fun!"`;profileSet("buddyDaily",1);}}if(action==='rest'){st.e=Math.min(100,st.e+20);st.h=Math.min(100,st.h+3);msg=bakawaliLanguage==='ms'?`${d.name}: "Ahhh... segarnya!"`:`${d.name}: "Ahhh... refreshed!"`;}saveBuddy(activeBuddy,st);const r=document.getElementById("buddyResponse");if(r)r.textContent=msg;renderBuddy();syncDailyQuest();renderBadges();}
  function talkBuddy(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){const r=document.getElementById("buddyResponse");if(r)r.textContent=bakawaliLanguage==='ms'?"🎤 Mic belum disokong oleh browser ini.":"🎤 Voice input is not supported in this browser.";return;}const r=document.getElementById("buddyResponse");if(r)r.textContent=bakawaliLanguage==='ms'?"🎤 Saya dengar... cuba sebut hello!":"🎤 I'm listening... say hello!";const rec=new SR();rec.lang=bakawaliLanguage==='ms'?'ms-MY':'en-US';rec.interimResults=false;rec.maxAlternatives=1;rec.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';if(r)r.textContent=`${buddyDefs[activeBuddy].name}: "${text}" 👋`;const st=buddyState(activeBuddy);st.h=Math.min(100,st.h+5);saveBuddy(activeBuddy,st);profileSet("buddyDaily",1);syncDailyQuest();renderBuddy()};rec.onerror=()=>{if(r)r.textContent=bakawaliLanguage==='ms'?"🎤 Cuba tekan Talk sekali lagi.":"🎤 Try the Talk button again."};rec.start();}

  // Story quest
  const storyData=[
    {scene:'🌲✨',en:{title:'The Strange Light',text:'A tiny star falls into Bakawali Forest. What should we do?'},ms:{title:'Cahaya Pelik',text:'Satu bintang kecil jatuh ke Hutan Bakawali. Apa patut kita buat?'},choices:[['🔎 Follow the light','Ikut cahaya',1],['🏠 Go home','Balik rumah',1]]},
    {scene:'🦉🌟',en:{title:'A Forest Friend',text:'An owl points toward a hidden cave. Which way should we go?'},ms:{title:'Kawan Hutan',text:'Seekor burung hantu menunjukkan gua tersembunyi. Ke mana kita pergi?'},choices:[['💎 Enter the cave','Masuk ke gua',2],['🌳 Climb the tree','Panjat pokok',2]]},
    {scene:'💎⭐',en:{title:'The Lost Star',text:'Inside the cave, the star is trapped behind a little puzzle.'},ms:{title:'Bintang Yang Hilang',text:'Di dalam gua, bintang itu terperangkap di sebalik teka-teki kecil.'},choices:[['🧩 Solve the puzzle','Selesaikan teka-teki',3],['💪 Push the rock','Tolak batu',3]]},
    {scene:'🌈⭐',en:{title:'Adventure Complete!',text:'The star flies home and paints a rainbow over Bakawali Island. Great exploring!'},ms:{title:'Pengembaraan Selesai!',text:'Bintang itu terbang pulang dan melukis pelangi di atas Pulau Bakawali. Hebatnya pengembaraan!'},choices:[]}
  ];
  let storyStep=Number(profileGet("storyStep",0))||0;
  function renderStory(){const d=storyData[Math.min(storyStep,storyData.length-1)],lang=d[bakawaliLanguage],sc=document.getElementById("storyScene"),cl=document.getElementById("storyChapterLabel"),ti=document.getElementById("storyTitle"),tx=document.getElementById("storyText"),ch=document.getElementById("storyChoices"),pt=document.getElementById("storyProgressText"),pb=document.getElementById("storyProgressBar");if(!sc)return;sc.textContent=d.scene;cl.textContent=`${bakawaliLanguage==='ms'?'BAB':'CHAPTER'} ${Math.min(storyStep+1,4)}`;ti.textContent=lang.title;tx.textContent=lang.text;pt.textContent=`${Math.min(storyStep+1,4)} / 4`;pb.style.width=((Math.min(storyStep,3)+1)/4*100)+'%';ch.innerHTML=d.choices.length?d.choices.map((c,i)=>`<button class="primary story-choice" data-next="${c[2]}">${bakawaliLanguage==='ms'?c[1]:c[0]}</button>`).join(''):`<button class="primary" id="storyFinish">⭐ ${bakawaliLanguage==='ms'?'Tamatkan cerita':'Finish Story'}</button>`;ch.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>{storyStep=Number(b.dataset.next);profileSet('storyStep',storyStep);if(storyStep>=3){profileSet('storyComplete','1');earnStar(bakawaliLanguage==='ms'?'📖 Cerita selesai!':'📖 Story complete!');}renderStory();renderBadges();updateParentCorner()});const f=document.getElementById('storyFinish');if(f)f.onclick=()=>{showPage('home');};}

  // Creator scene
  function saveCreator(){const stage=document.getElementById('creatorStage');if(!stage)return;const items=[...stage.querySelectorAll('.creator-sticker')].map(x=>({emoji:x.textContent,left:x.style.left,top:x.style.top}));profileSet('creatorScene',JSON.stringify(items));profileSet('creatorSaved','1');renderBadges();updateParentCorner();toast.textContent=bakawaliLanguage==='ms'?'🎨 Scene disimpan!':'🎨 Scene saved!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1400);}
  function loadCreator(){const stage=document.getElementById('creatorStage');if(!stage)return;stage.querySelectorAll('.creator-sticker').forEach(x=>x.remove());let arr=[];try{arr=JSON.parse(profileGet('creatorScene','[]'))||[]}catch(e){};arr.forEach(x=>addSticker(x.emoji,x.left,x.top,false));}
  function addSticker(emoji,left,top,save=true){const stage=document.getElementById('creatorStage');if(!stage)return;const el=document.createElement('button');el.type='button';el.className='creator-sticker';el.textContent=emoji;el.style.left=left||((15+Math.random()*70)+'%');el.style.top=top||((12+Math.random()*62)+'%');el.title='Drag me';stage.appendChild(el);let ox=0,oy=0,drag=false;el.addEventListener('pointerdown',e=>{drag=true;ox=e.clientX-el.getBoundingClientRect().left;oy=e.clientY-el.getBoundingClientRect().top;el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointermove',e=>{if(!drag)return;const r=stage.getBoundingClientRect();el.style.left=Math.max(2,Math.min(94,((e.clientX-r.left-ox)/r.width)*100))+'%';el.style.top=Math.max(3,Math.min(78,((e.clientY-r.top-oy)/r.height)*100))+'%'});el.addEventListener('pointerup',()=>{drag=false;if(save)saveCreator()});el.addEventListener('click',()=>{if(!drag)el.classList.add('creator-pop');setTimeout(()=>el.classList.remove('creator-pop'),250)});}

  // Photo Gallery — IndexedDB local image storage
  const galleryDBName='BakawaliGalleryDB', galleryDBVersion=1, galleryStore='photos';
  let galleryDBPromise=null, galleryObjectUrls=[];
  const galleryText={
    en:{title:'📸 Bakawali Gallery',desc:'Save your favourite Bakawali memories on this device.',add:'ADD PHOTOS',uploadTitle:'Add your photos',uploadText:'Choose photos from your phone or computer. You can add more than one.',storage:'🔒 Photos are saved privately in this browser on this device.',choose:'CHOOSE PHOTOS',clear:'CLEAR ALL',emptyTitle:'Your gallery is waiting!',emptyText:'Add a photo from your adventures and it will appear here.',hint:' · Add memories to your adventure book.',photos:'photos',photo:'photo',delete:'Delete',open:'Open photo',confirm:'Delete all saved photos from this device?',saved:'📸 Photos saved!',tooLarge:'This image is too large. Please choose an image under 12 MB.',imageOnly:'Please choose image files only.',failed:'Could not save this photo. Please try another image.'},
    ms:{title:'📸 Galeri Bakawali',desc:'Simpan kenangan Bakawali kegemaran anda pada peranti ini.',add:'TAMBAH GAMBAR',uploadTitle:'Tambah gambar anda',uploadText:'Pilih gambar dari telefon atau komputer. Anda boleh tambah lebih daripada satu.',storage:'🔒 Gambar disimpan secara peribadi dalam pelayar pada peranti ini.',choose:'PILIH GAMBAR',clear:'PADAM SEMUA',emptyTitle:'Galeri anda sedang menunggu!',emptyText:'Tambah gambar daripada pengembaraan anda dan ia akan muncul di sini.',hint:' · Tambah kenangan ke dalam buku pengembaraan.',photos:'gambar',photo:'gambar',delete:'Padam',open:'Buka gambar',confirm:'Padam semua gambar yang disimpan pada peranti ini?',saved:'📸 Gambar disimpan!',tooLarge:'Gambar ini terlalu besar. Pilih gambar di bawah 12 MB.',imageOnly:'Sila pilih fail gambar sahaja.',failed:'Gambar tidak dapat disimpan. Cuba gambar lain.'}
  };
  function galleryOpenDB(){
    if(galleryDBPromise)return galleryDBPromise;
    galleryDBPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('IndexedDB unavailable'));return;}
      const req=indexedDB.open(galleryDBName,galleryDBVersion);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(galleryStore)){const store=db.createObjectStore(galleryStore,{keyPath:'id',autoIncrement:true});store.createIndex('createdAt','createdAt');}};
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error||new Error('Database error'));
    });
    return galleryDBPromise;
  }
  async function galleryTx(mode,fn){const db=await galleryOpenDB();return new Promise((resolve,reject)=>{const tx=db.transaction(galleryStore,mode),store=tx.objectStore(galleryStore);let result;try{result=fn(store);}catch(e){reject(e);return;}tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||new Error('Storage error'));tx.onabort=()=>reject(tx.error||new Error('Storage aborted'));});}
  async function galleryGetAll(){const db=await galleryOpenDB();return new Promise((resolve,reject)=>{const req=db.transaction(galleryStore,'readonly').objectStore(galleryStore).getAll();req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>b.createdAt-a.createdAt));req.onerror=()=>reject(req.error);});}
  async function galleryAdd(record){return galleryTx('readwrite',store=>store.add(record));}
  async function galleryRemove(id){return galleryTx('readwrite',store=>store.delete(id));}
  async function galleryClear(){return galleryTx('readwrite',store=>store.clear());}
  function galleryDate(ts){return new Date(ts).toLocaleDateString(bakawaliLanguage==='ms'?'ms-MY':'en-MY',{day:'numeric',month:'short',year:'numeric'});}
  function galleryEsc(s){return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  async function galleryResize(file){
    const maxSide=1600, quality=.82;
    let bmp=null;
    try{if('createImageBitmap' in window)bmp=await createImageBitmap(file);}catch(e){}
    let w=0,h=0,source=bmp;
    if(source){w=source.width;h=source.height;}else{source=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=URL.createObjectURL(file);});w=source.naturalWidth;h=source.naturalHeight;}
    const scale=Math.min(1,maxSide/Math.max(w,h));
    const outW=Math.max(1,Math.round(w*scale)),outH=Math.max(1,Math.round(h*scale));
    const canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0,outW,outH);if(bmp?.close)bmp.close();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Compression failed')),'image/jpeg',quality));
    return {blob,width:outW,height:outH};
  }
  function gallerySetBusy(busy){const btn=document.getElementById('galleryAddBtn'),choose=document.getElementById('galleryChooseBtn');if(btn)btn.disabled=busy;if(choose)choose.disabled=busy;if(btn)btn.querySelector('span').textContent=busy?(bakawaliLanguage==='ms'?'MENYIMPAN...':'SAVING...'):galleryText[bakawaliLanguage].add;}
  async function galleryHandleFiles(files){
    const list=[...files].filter(f=>f.type.startsWith('image/'));
    if(!list.length){if(files.length)alert(galleryText[bakawaliLanguage].imageOnly);return;}
    gallerySetBusy(true);
    let saved=0;
    try{
      for(const file of list){
        if(file.size>12*1024*1024){alert(`${file.name}: ${galleryText[bakawaliLanguage].tooLarge}`);continue;}
        try{const optimized=await galleryResize(file);await galleryAdd({name:file.name,caption:file.name.replace(/\.[^.]+$/,''),blob:optimized.blob,width:optimized.width,height:optimized.height,createdAt:Date.now()+(saved||0)});saved++;}
        catch(e){console.error(e);alert(`${file.name}: ${galleryText[bakawaliLanguage].failed}`);}
      }
    }finally{gallerySetBusy(false);if(saved){toast.textContent=galleryText[bakawaliLanguage].saved;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1600);}await renderGallery();}
  }
  async function renderGallery(){
    const grid=document.getElementById('galleryGrid'),empty=document.getElementById('galleryEmpty'),countEl=document.getElementById('galleryCount'),clear=document.getElementById('galleryClearAll');if(!grid)return;
    galleryObjectUrls.forEach(u=>URL.revokeObjectURL(u));galleryObjectUrls=[];grid.innerHTML='';
    let items=[];try{items=await galleryGetAll();}catch(e){console.error(e);items=[];}
    const tx=galleryText[bakawaliLanguage];
    if(countEl)countEl.textContent=`${items.length} ${items.length===1?tx.photo:tx.photos}`;
    if(clear)clear.hidden=!items.length;
    if(empty)empty.classList.toggle('hidden',!!items.length);
    items.forEach(item=>{
      const url=URL.createObjectURL(item.blob);galleryObjectUrls.push(url);
      const card=document.createElement('article');card.className='photo-card';
      card.innerHTML=`<div class="photo-thumb"><img src="${url}" alt="${galleryEsc(item.caption)}" loading="lazy"><button class="photo-open" type="button" title="${tx.open}" aria-label="${tx.open}">↗</button></div><div class="photo-info"><div class="photo-caption" title="${galleryEsc(item.caption)}">${galleryEsc(item.caption)}</div><div class="photo-meta">${galleryDate(item.createdAt)}</div><button class="photo-delete" type="button">🗑️ ${tx.delete}</button></div>`;
      card.querySelector('.photo-thumb').addEventListener('click',e=>{if(e.target.closest('.photo-open')||e.currentTarget===e.target||e.target.tagName==='IMG')openGalleryLightbox(url,item.caption);});
      card.querySelector('.photo-open').onclick=e=>{e.stopPropagation();openGalleryLightbox(url,item.caption);};
      card.querySelector('.photo-delete').onclick=async()=>{await galleryRemove(item.id);await renderGallery();};
      grid.appendChild(card);
    });
  }
  function openGalleryLightbox(url,caption){const box=document.getElementById('galleryLightbox'),img=document.getElementById('galleryLightboxImg'),cap=document.getElementById('galleryLightboxCaption');if(!box||!img)return;img.src=url;cap.textContent=caption||'';box.classList.remove('hidden');box.setAttribute('aria-hidden','false');}
  function closeGalleryLightbox(){const box=document.getElementById('galleryLightbox');if(!box)return;box.classList.add('hidden');box.setAttribute('aria-hidden','true');}
  function renderGalleryLabels(){const t=galleryText[bakawaliLanguage];const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;};set('galleryTitle',t.title);set('galleryDesc',t.desc);set('galleryAddLabel',t.add);set('galleryUploadTitle',t.uploadTitle);set('galleryUploadText',t.uploadText);set('galleryStorageNote',t.storage);set('galleryChooseLabel',t.choose);set('galleryClearLabel',t.clear);set('galleryEmptyTitle',t.emptyTitle);set('galleryEmptyText',t.emptyText);set('galleryHint',t.hint);}
  window.bakawaliRefreshGallery=()=>{renderGalleryLabels();renderGallery();};
  async function initGallery(){
    const input=document.getElementById('galleryFileInput'),add=document.getElementById('galleryAddBtn'),choose=document.getElementById('galleryChooseBtn'),drop=document.getElementById('galleryDropZone'),clear=document.getElementById('galleryClearAll'),box=document.getElementById('galleryLightbox'),close=document.getElementById('galleryLightboxClose');if(!input)return;
    renderGalleryLabels();renderGallery();
    add.onclick=()=>input.click();choose.onclick=()=>input.click();input.addEventListener('change',()=>{if(input.files?.length)galleryHandleFiles(input.files);input.value='';});
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag-over');}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag-over');}));drop.addEventListener('drop',e=>{if(e.dataTransfer.files?.length)galleryHandleFiles(e.dataTransfer.files);});
    clear.onclick=async()=>{if(!confirm(galleryText[bakawaliLanguage].confirm))return;await galleryClear();await renderGallery();};
    close.onclick=closeGalleryLightbox;box.addEventListener('click',e=>{if(e.target===box)closeGalleryLightbox();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGalleryLightbox();});
  }

  // Parent corner
  function updateParentCorner(){const s=document.getElementById('parentStars'),b=document.getElementById('parentBadges'),t=document.getElementById('parentTraining'),g=document.getElementById('parentGames');if(!s)return;s.textContent=stars;b.textContent=badgeDefs.filter(x=>x.ok()).length;t.textContent=Math.round(trainingState.size/trainingModules.length*100)+'%';g.textContent=Number(profileGet('gamesPlayed',0));const cats={language:trainingModules.filter(x=>x.cat==='language').map(x=>x.id),math:trainingModules.filter(x=>x.cat==='math').map(x=>x.id),animal:trainingModules.filter(x=>x.cat==='animal').map(x=>x.id),science:trainingModules.filter(x=>x.cat==='science').map(x=>x.id),world:trainingModules.filter(x=>x.cat==='world').map(x=>x.id)};Object.entries(cats).forEach(([k,ids])=>{const el=document.getElementById('skill'+k.charAt(0).toUpperCase()+k.slice(1));if(el){const pct=Math.round(ids.filter(x=>trainingState.has(x)).length/ids.length*100);el.textContent=pct+'%';el.style.width=pct+'%';}});}

  window.bakawaliRefreshStory=renderStory;
  window.bakawaliUpdateParent=updateParentCorner;

  function init(){
    renderDailyQuest();renderBadges();renderBuddy();renderStory();loadCreator();updateParentCorner();initGallery();
    document.querySelectorAll('[data-buddy]').forEach(b=>b.addEventListener('click',()=>{activeBuddy=b.dataset.buddy;profileSet('activeBuddy',activeBuddy);renderBuddy();}));
    document.querySelectorAll('[data-buddy-action]').forEach(b=>b.addEventListener('click',()=>buddyAction(b.dataset.buddyAction)));
    const talk=document.getElementById('buddyTalk');if(talk)talk.onclick=talkBuddy;
    const save=document.getElementById('creatorSave');if(save)save.onclick=saveCreator;const clear=document.getElementById('creatorClear');if(clear)clear.onclick=()=>{document.querySelectorAll('#creatorStage .creator-sticker').forEach(x=>x.remove());profileSet('creatorScene','[]');};
    document.querySelectorAll('#creatorPalette [data-sticker]').forEach(b=>b.addEventListener('click',()=>addSticker(b.dataset.sticker)));
    document.querySelectorAll('.game-choice-v2').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.gamePanel||'';const played=JSON.parse(profileGet('gamesPlayedIds','[]')||'[]');if(!played.includes(id)){played.push(id);profileSet('gamesPlayedIds',JSON.stringify(played));profileSet('gamesPlayed',played.length);renderBadges();updateParentCorner();}}));
    const pm=document.getElementById('parentModal'),pb=document.getElementById('openParentCorner'),pc=document.getElementById('parentClose');if(pb)pb.onclick=()=>{updateParentCorner();pm.classList.remove('hidden');pm.setAttribute('aria-hidden','false')};if(pc)pc.onclick=()=>{pm.classList.add('hidden');pm.setAttribute('aria-hidden','true')};if(pm)pm.addEventListener('click',e=>{if(e.target===pm)pc?.click()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pm&&!pm.classList.contains('hidden'))pc?.click()});
    window.addEventListener('hashchange',()=>{if(location.hash==='#story')renderStory();if(location.hash==='#creator')loadCreator();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
