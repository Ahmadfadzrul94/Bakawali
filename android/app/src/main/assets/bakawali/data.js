// Bakawali Educational Adventure Data Engine
// Supports 6 Adventure Worlds, 100 Modules x 50 Questions (5,000 Questions), Storybooks, Badges & Songs

const BAKAWALI_DATA = {
  worlds: [
    {
      id: "world_1",
      nameMs: "Rimba Abjad",
      nameEn: "Alphabet Jungle",
      descMs: "Kenali huruf A hingga Z, bunyi fonik dan perkataan awal!",
      descEn: "Discover letters A to Z, phonics sounds and first words!",
      icon: "🌴",
      themeColor: "#10B981",
      modulesRange: [1, 18],
      bg: "linear-gradient(135deg, #064E3B, #047857)"
    },
    {
      id: "world_2",
      nameMs: "Tasik Nombor & Bentuk",
      nameEn: "Number Lagoon & Shapes",
      descMs: "Kira nombor 1-20, kenal bentuk geometri dan saiz!",
      descEn: "Count numbers 1-20, explore geometry shapes and sizes!",
      icon: "🐠",
      themeColor: "#06B6D4",
      modulesRange: [19, 36],
      bg: "linear-gradient(135deg, #0C4A6E, #0284C7)"
    },
    {
      id: "world_3",
      nameMs: "Gunung Logik & Warna",
      nameEn: "Logic Mountain & Colors",
      descMs: "Padankan corak, susun turutan, dan bezakan warna!",
      descEn: "Match patterns, sequence objects, and identify colors!",
      icon: "🏔️",
      themeColor: "#8B5CF6",
      modulesRange: [37, 54],
      bg: "linear-gradient(135deg, #4C1D95, #7C3AED)"
    },
    {
      id: "world_4",
      nameMs: "Safari Sains & Alam",
      nameEn: "Science Safari & Nature",
      descMs: "Haiwan comel, tumbuh-tumbuhan, cuaca dan deria manusia!",
      descEn: "Cute animals, plants, weather and 5 human senses!",
      icon: "🦁",
      themeColor: "#F59E0B",
      modulesRange: [55, 72],
      bg: "linear-gradient(135deg, #78350F, #D97706)"
    },
    {
      id: "world_5",
      nameMs: "Padang Muzik & Bunyi",
      nameEn: "Music Meadow & Rhythms",
      descMs: "Kenali alatan muzik, rentak ceria dan lagu kanak-kanak!",
      descEn: "Explore musical instruments, beats and nursery rhymes!",
      icon: "🎵",
      themeColor: "#EC4899",
      modulesRange: [73, 86],
      bg: "linear-gradient(135deg, #831843, #DB2777)"
    },
    {
      id: "world_6",
      nameMs: "Kampung Budaya & Adab",
      nameEn: "Culture Kampung & Good Manners",
      descMs: "Adab harian, nilai murni, ucapan sopan dan amalan sihat!",
      descEn: "Daily good manners, values, greetings and healthy habits!",
      icon: "🏡",
      themeColor: "#E11D48",
      modulesRange: [87, 100],
      bg: "linear-gradient(135deg, #881337, #E11D48)"
    }
  ],

  // Procedural Generator for 100 Modules x 50 Questions
  getModules() {
    if (this._cachedModules) return this._cachedModules;

    const modules = [];
    const moduleThemes = [
      // 1-18 Rimba Abjad
      { titleMs: "Huruf A, B, C & Fonik", titleEn: "Letters A, B, C & Phonics", icon: "🅰️", type: "letters", base: ["A", "B", "C"] },
      { titleMs: "Huruf D, E, F & Bunyi", titleEn: "Letters D, E, F & Sounds", icon: "🅱️", type: "letters", base: ["D", "E", "F"] },
      { titleMs: "Huruf G, H, I & Objek", titleEn: "Letters G, H, I & Objects", icon: "🆎", type: "letters", base: ["G", "H", "I"] },
      { titleMs: "Huruf J, K, L & Kata", titleEn: "Letters J, K, L & Words", icon: "🔤", type: "letters", base: ["J", "K", "L"] },
      { titleMs: "Huruf M, N, O Bersuara", titleEn: "Letters M, N, O Voice", icon: "💬", type: "letters", base: ["M", "N", "O"] },
      { titleMs: "Huruf P, Q, R & Haiwan", titleEn: "Letters P, Q, R & Animals", icon: "🦜", type: "letters", base: ["P", "Q", "R"] },
      { titleMs: "Huruf S, T, U Terokai", titleEn: "Letters S, T, U Explore", icon: "⭐", type: "letters", base: ["S", "T", "U"] },
      { titleMs: "Huruf V, W, X, Y, Z Akhir", titleEn: "Letters V to Z Mastery", icon: "🏁", type: "letters", base: ["V", "W", "X", "Y", "Z"] },
      { titleMs: "Huruf Vokal (a, e, i, o, u)", titleEn: "Vowel Letters (a, e, i, o, u)", icon: "🗣️", type: "vowels", base: ["A", "E", "I", "O", "U"] },
      { titleMs: "Suku Kata Terbuka (ba, bi, bu)", titleEn: "Open Syllables (ba, bi, bu)", icon: "🧩", type: "syllables", base: ["ba", "bi", "bu", "ca", "ci", "cu"] },
      { titleMs: "Suku Kata (da, di, du, fa, fi, fu)", titleEn: "Syllables (da, di, du)", icon: "📖", type: "syllables", base: ["da", "di", "du", "fa", "fi", "fu"] },
      { titleMs: "Suku Kata (ga, gi, gu, ha, hi, hu)", titleEn: "Syllables (ga, gi, gu)", icon: "📚", type: "syllables", base: ["ga", "gi", "gu", "ha", "hi", "hu"] },
      { titleMs: "Perkataan 2 Suku Kata (Buku, Bola)", titleEn: "2-Syllable Words (Book, Ball)", icon: "⚽", type: "vocab", base: ["Buku", "Bola", "Meja", "Kaki", "Mata"] },
      { titleMs: "Perkataan Rumah (Pintu, Kerusi)", titleEn: "Home Words (Door, Chair)", icon: "🛋️", type: "vocab", base: ["Pintu", "Kerusi", "Cawan", "Sudu", "Pinggan"] },
      { titleMs: "Anggota Badan (Mata, Hidung)", titleEn: "Body Parts (Eyes, Nose)", icon: "👀", type: "body", base: ["Mata", "Hidung", "Telinga", "Mulut", "Tangan"] },
      { titleMs: "Pakaian Saya (Baju, Kasut)", titleEn: "My Clothes (Shirt, Shoes)", icon: "👕", type: "clothes", base: ["Baju", "Seluar", "Kasut", "Topi", "Stoking"] },
      { titleMs: "Makanan Lazat (Nasi, Epal, Susu)", titleEn: "Delicious Food (Rice, Apple, Milk)", icon: "🍎", type: "food", base: ["Nasi", "Epal", "Susu", "Roti", "Pisang"] },
      { titleMs: "Ujian Rimba Abjad Hebat", titleEn: "Grand Alphabet Jungle Challenge", icon: "🏆", type: "mastery_letters", base: ["A", "B", "C", "D", "E"] },

      // 19-36 Tasik Nombor
      { titleMs: "Nombor 1, 2, 3 Bilang Cepat", titleEn: "Numbers 1, 2, 3 Counting", icon: "1️⃣", type: "numbers", range: [1, 3] },
      { titleMs: "Nombor 4, 5, 6 Ceria", titleEn: "Numbers 4, 5, 6 Cheerful", icon: "2️⃣", type: "numbers", range: [4, 6] },
      { titleMs: "Nombor 7, 8, 9, 10 Sempurna", titleEn: "Numbers 7 to 10 Mastery", icon: "🔟", type: "numbers", range: [7, 10] },
      { titleMs: "Kira Bilangan Objek 1-10", titleEn: "Count Objects 1-10", icon: "🍎", type: "counting", range: [1, 10] },
      { titleMs: "Bentuk Bulatan & Segiempat", titleEn: "Circle & Square Shapes", icon: "🔴", type: "shapes", base: ["Bulatan", "Segiempat Sama", "Segitiga"] },
      { titleMs: "Bentuk Bintang & Hati", titleEn: "Star & Heart Shapes", icon: "⭐", type: "shapes", base: ["Bintang", "Hati", "Bujur", "Segiempat Tepat"] },
      { titleMs: "Nombor 11 hingga 15", titleEn: "Numbers 11 to 15", icon: "🔢", type: "numbers", range: [11, 15] },
      { titleMs: "Nombor 16 hingga 20", titleEn: "Numbers 16 to 20", icon: "🔢", type: "numbers", range: [16, 20] },
      { titleMs: "Banding Saiz: Besar vs Kecil", titleEn: "Compare Sizes: Big vs Small", icon: "🐘", type: "compare_size" },
      { titleMs: "Banding Ketinggian: Tinggi vs Rendah", titleEn: "Compare Heights: Tall vs Short", icon: "🦒", type: "compare_height" },
      { titleMs: "Banding Panjang: Panjang vs Pendek", titleEn: "Compare Lengths: Long vs Short", icon: "🐍", type: "compare_length" },
      { titleMs: "Banding Kuantiti: Banyak vs Sedikit", titleEn: "Compare Quantity: More vs Less", icon: "🍇", type: "compare_qty" },
      { titleMs: "Operasi Tambah Mudah (1+1, 2+1)", titleEn: "Simple Addition (1+1, 2+1)", icon: "➕", type: "addition_easy" },
      { titleMs: "Operasi Tambah Objek Comel", titleEn: "Object Addition Fun", icon: "➕", type: "addition_objects" },
      { titleMs: "Operasi Tolak Mudah Asas", titleEn: "Simple Subtraction Basics", icon: "➖", type: "subtraction_easy" },
      { titleMs: "Turutan Nombor 1-20 Maju", titleEn: "Number Sequences 1-20", icon: "📈", type: "sequences" },
      { titleMs: "Padanan Nombor & Ejaan", titleEn: "Number & Word Matching", icon: "🏷️", type: "num_words" },
      { titleMs: "Ujian Juara Tasik Nombor", titleEn: "Number Lagoon Grand Quiz", icon: "👑", type: "mastery_numbers" }
    ];

    // Generate full 100 modules list
    for (let i = 1; i <= 100; i++) {
      let theme;
      if (i <= moduleThemes.length) {
        theme = moduleThemes[i - 1];
      } else {
        const catIdx = Math.floor((i - 1) / 18);
        const worldNames = ["Abjad & Membaca", "Matematik & Nombor", "Logik & Corak", "Sains & Alam", "Muzik & Rentak", "Adab & Budaya"];
        const worldNamesEn = ["Reading & Phonics", "Math & Numbers", "Logic & Patterns", "Science & Nature", "Music & Rhythms", "Manners & Culture"];
        theme = {
          titleMs: `Modul ${i}: ${worldNames[catIdx % 6]} Tahap ${(i % 10) + 1}`,
          titleEn: `Module ${i}: ${worldNamesEn[catIdx % 6]} Level ${(i % 10) + 1}`,
          icon: ["🌟", "🎯", "🚀", "🎨", "🧩", "🐾", "💡", "🌈"][i % 8],
          type: "mixed"
        };
      }

      modules.push({
        id: i,
        titleMs: theme.titleMs,
        titleEn: theme.titleEn,
        icon: theme.icon,
        type: theme.type,
        totalMissions: 50,
        starsRequired: (i - 1) * 2
      });
    }

    this._cachedModules = modules;
    return modules;
  },

  // Generates 50 questions for a given module ID
  getModuleMissions(moduleId) {
    const questions = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const animalIcons = [
      { nameMs: "Kucing", nameEn: "Cat", icon: "🐱", sound: "Meow!" },
      { nameMs: "Anjing", nameEn: "Dog", icon: "🐶", sound: "Woof!" },
      { nameMs: "Gajah", nameEn: "Elephant", icon: "🐘", sound: "Trumpet!" },
      { nameMs: "Singa", nameEn: "Lion", icon: "🦁", sound: "Roar!" },
      { nameMs: "Monyet", nameEn: "Monkey", icon: "🐵", sound: "Ooh ooh!" },
      { nameMs: "Burung", nameEn: "Bird", icon: "🐦", sound: "Chirp!" },
      { nameMs: "Kuda", nameEn: "Horse", icon: "🐴", sound: "Neigh!" },
      { nameMs: "Katak", nameEn: "Frog", icon: "🐸", sound: "Ribbit!" },
      { nameMs: "Itik", nameEn: "Duck", icon: "🦆", sound: "Quack!" },
      { nameMs: "Ikan", nameEn: "Fish", icon: "🐟", sound: "Blub!" }
    ];

    const colors = [
      { nameMs: "Merah", nameEn: "Red", icon: "🔴", hex: "#EF4444" },
      { nameMs: "Biru", nameEn: "Blue", icon: "🔵", hex: "#3B82F6" },
      { nameMs: "Kuning", nameEn: "Yellow", icon: "🟡", hex: "#FBBF24" },
      { nameMs: "Hijau", nameEn: "Green", icon: "🟢", hex: "#10B981" },
      { nameMs: "Ungu", nameEn: "Purple", icon: "🟣", hex: "#8B5CF6" },
      { nameMs: "Jingga", nameEn: "Orange", icon: "🟠", hex: "#F97316" }
    ];

    const fruits = [
      { nameMs: "Epal", nameEn: "Apple", icon: "🍎" },
      { nameMs: "Pisang", nameEn: "Banana", icon: "🍌" },
      { nameMs: "Tembikai", nameEn: "Watermelon", icon: "🍉" },
      { nameMs: "Oren", nameEn: "Orange", icon: "🍊" },
      { nameMs: "Anggur", nameEn: "Grape", icon: "🍇" },
      { nameMs: "Strawberi", nameEn: "Strawberry", icon: "🍓" }
    ];

    for (let q = 1; q <= 50; q++) {
      const qType = q % 5;
      let mission = {};

      if (qType === 0) {
        // Phonics / Letter recognition
        const letter = alphabet[(moduleId * 3 + q) % alphabet.length];
        const distractors = alphabet.filter(l => l !== letter).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [letter, ...distractors].sort(() => 0.5 - Math.random());
        mission = {
          id: q,
          promptMs: `Manakah huruf besar "${letter}"?`,
          promptEn: `Which one is uppercase "${letter}"?`,
          speakText: letter,
          visual: letter,
          options: options.map(opt => ({ label: opt, correct: opt === letter }))
        };
      } else if (qType === 1) {
        // Counting items (1-10)
        const count = (q % 8) + 1;
        const fruit = fruits[q % fruits.length];
        const visual = fruit.icon.repeat(count);
        const wrongCounts = [count + 1, Math.max(1, count - 1), count + 2].filter(c => c !== count);
        const options = [count, ...wrongCounts.slice(0, 3)].sort(() => 0.5 - Math.random());
        mission = {
          id: q,
          promptMs: `Berapa banyak ${fruit.nameMs} di bawah?`,
          promptEn: `How many ${fruit.nameEn}s are below?`,
          speakText: `${count} ${fruit.nameMs}`,
          visual: visual,
          options: options.map(opt => ({ label: `${opt}`, correct: opt === count }))
        };
      } else if (qType === 2) {
        // Animal identification & sounds
        const animal = animalIcons[(q + moduleId) % animalIcons.length];
        const wrongAnimals = animalIcons.filter(a => a.nameMs !== animal.nameMs).slice(0, 3);
        const options = [animal, ...wrongAnimals].sort(() => 0.5 - Math.random());
        mission = {
          id: q,
          promptMs: `Cari gambar bagi "${animal.nameMs}"!`,
          promptEn: `Find the picture of "${animal.nameEn}"!`,
          speakText: animal.nameMs,
          visual: animal.icon,
          options: options.map(opt => ({ label: `${opt.icon} ${opt.nameMs}`, correct: opt.nameMs === animal.nameMs }))
        };
      } else if (qType === 3) {
        // Color recognition
        const color = colors[(q + moduleId) % colors.length];
        const wrongColors = colors.filter(c => c.nameMs !== color.nameMs).slice(0, 3);
        const options = [color, ...wrongColors].sort(() => 0.5 - Math.random());
        mission = {
          id: q,
          promptMs: `Pilih warna "${color.nameMs}"!`,
          promptEn: `Choose the color "${color.nameEn}"!`,
          speakText: color.nameMs,
          visual: color.icon,
          options: options.map(opt => ({ label: `${opt.icon} ${opt.nameMs}`, correct: opt.nameMs === color.nameMs }))
        };
      } else {
        // Simple Math Addition or Good Manners
        const a = (q % 4) + 1;
        const b = (q % 3) + 1;
        const ans = a + b;
        const wrongAns = [ans + 1, Math.max(1, ans - 1), ans + 2].filter(n => n !== ans);
        const options = [ans, ...wrongAns.slice(0, 3)].sort(() => 0.5 - Math.random());
        mission = {
          id: q,
          promptMs: `Berapakah ${a} + ${b}?`,
          promptEn: `What is ${a} + ${b}?`,
          speakText: `${a} tambah ${b} sama dengan ${ans}`,
          visual: `⭐`.repeat(a) + " ➕ " + `⭐`.repeat(b),
          options: options.map(opt => ({ label: `${opt}`, correct: opt === ans }))
        };
      }

      questions.push(mission);
    }
    return questions;
  },

  // Interactive Storybooks with Audio Read-Along
  storybooks: [
    {
      id: "story_1",
      titleMs: "Sang Kancil & Sang Buaya",
      titleEn: "The Mousedeer & The Crocodiles",
      cover: "🦌",
      pages: [
        {
          art: "🌳 🦌",
          textMs: "Di dalam sebuah hutan yang indah, tinggal Sang Kancil yang cerdik dan suka membantu kawan-kawan.",
          textEn: "In a beautiful green forest, lived a clever little mousedeer who loved to help his forest friends."
        },
        {
          art: "🍎 🌊",
          textMs: "Sang Kancil ingin menyeberang sungai untuk memakan buah-buahan manis di seberang sana.",
          textEn: "The mousedeer wanted to cross the river to taste the delicious sweet fruits on the other side."
        },
        {
          art: "🐊 🐊 🐊",
          textMs: "Tetapi ada banyak Sang Buaya di dalam sungai! Sang Kancil mendapat idea bernas.",
          textEn: "But there were many crocodiles in the river! The clever mousedeer got a wonderful idea."
        },
        {
          art: "🦌 🐊 🐊 🍉",
          textMs: "Sang Kancil mengira buaya satu demi satu sambil melompat ke seberang dengan selamat!",
          textEn: "The mousedeer counted the crocodiles one by one while hopping safely across to feast on yummy melons!"
        }
      ]
    },
    {
      id: "story_2",
      titleMs: "Bintang Yang Ingin Bernyanyi",
      titleEn: "The Star That Wanted to Sing",
      cover: "⭐",
      pages: [
        {
          art: "🌌 ✨",
          textMs: "Jauh di angkasa raya yang luas, ada sebutir bintang kecil bernama Kelip.",
          textEn: "Far up in the starry cosmos, there was a tiny twinkling star named Kelip."
        },
        {
          art: "🎶 🌙",
          textMs: "Kelip ingin belajar menyanyikan lagu riang untuk menerangi malam yang sunyi.",
          textEn: "Kelip wished to learn happy melodies to brighten up the quiet dark night."
        },
        {
          art: "🌟 🦉 💖",
          textMs: "Burung Hantu dan Sang Bulan mengajar Kelip rentak muzik yang penuh kasih sayang.",
          textEn: "The Wise Owl and the gentle Moon taught Kelip rhythms of love and joy."
        }
      ]
    },
    {
      id: "story_3",
      titleMs: "Hari Lahir Si Comel",
      titleEn: "Little Comel's Birthday",
      cover: "🎂",
      pages: [
        {
          art: "🐱 🎈",
          textMs: "Hari ini ialah hari lahir Si Comel! Semua kawan-kawan bersedia menyambutnya.",
          textEn: "Today is Little Comel's birthday! All friends are preparing a delightful surprise."
        },
        {
          art: "🎁 🍰 🦁 🐰",
          textMs: "Mereka membawa kek pelangi, belon warna-warni dan hadiah istimewa.",
          textEn: "They brought a rainbow cake, colorful balloons and sweet presents."
        },
        {
          art: "🥳 💖 🎉",
          textMs: "Si Comel berterima kasih dan berkongsi kek dengan semua kawannya dengan gembira.",
          textEn: "Little Comel said thank you and shared the yummy cake happily with everyone."
        }
      ]
    }
  ],

  // 36 Achievement Badges
  badges: [
    { id: "b1", nameMs: "Langkah Pertama", nameEn: "First Step", icon: "🌱", descMs: "Selesaikan misi latihan pertama", descEn: "Complete your first training mission" },
    { id: "b2", nameMs: "Jaguh Abjad", nameEn: "Alphabet Hero", icon: "🔤", descMs: "Kuasai 5 modul abjad", descEn: "Master 5 alphabet modules" },
    { id: "b3", nameMs: "Bintang Nombor", nameEn: "Number Star", icon: "🔢", descMs: "Kira hingga nombor 20", descEn: "Count up to number 20" },
    { id: "b4", nameMs: "Penerbang Langit", nameEn: "Sky Aviator", icon: "🛩️", descMs: "Kutip 50 permata dalam Sky Runner", descEn: "Collect 50 gems in Sky Runner" },
    { id: "b5", nameMs: "Pemutar Bertuah", nameEn: "Lucky Spinner", icon: "🎡", descMs: "Putar Spin Quest 3 kali", descEn: "Spin the wheel 3 times" },
    { id: "b6", nameMs: "Pahlawan Angkasa", nameEn: "Starfighter Ace", icon: "🚀", descMs: "Musnahkan 20 meteor Astraea", descEn: "Blast 20 asteroids in Astraea" },
    { id: "b7", nameMs: "Pelukis Cilik", nameEn: "Little Artist", icon: "🎨", descMs: "Simpan lukisan pertama di Galeri", descEn: "Save a painting to Photo Gallery" },
    { id: "b8", nameMs: "Sahabat Sejati", nameEn: "True Buddy", icon: "🐥", descMs: "Beri makan Buddy 5 kali", descEn: "Feed Buddy 5 times" },
    { id: "b9", nameMs: "Ulat Buku", nameEn: "Bookworm", icon: "📖", descMs: "Baca sebuah Story Quest penuh", descEn: "Read a full Story Quest" },
    { id: "b10", nameMs: "Raja Muzik", nameEn: "Music Maestro", icon: "🎵", descMs: "Dengar 3 lagu kanak-kanak", descEn: "Listen to 3 nursery rhymes" },
    { id: "b11", nameMs: "Penyusun Blok", nameEn: "Block Master", icon: "🧱", descMs: "Selesaikan 1 pusingan Block Drop", descEn: "Complete a round of Block Drop" },
    { id: "b12", nameMs: "Rajin Berbudi", nameEn: "Polite Explorer", icon: "🌺", descMs: "Amalkan ucapan terima kasih", descEn: "Practice good manners daily" }
  ],

  // Curated Child-Safe YouTube Nursery Rhymes
  youtubeMusic: [
    {
      id: "rasa_sayang",
      titleMs: "Rasa Sayang Eh",
      titleEn: "Rasa Sayang Folk Song",
      artist: "Lagu Tradisional Kanak-Kanak",
      icon: "🌺",
      synthKey: "rasa_sayang",
      videoUrl: "https://www.youtube.com/embed/videoseries?list=PLtN_0J_m-2Qv1XkX"
    },
    {
      id: "twinkle",
      titleMs: "Tanya Sama Pokok / Twinkle Star",
      titleEn: "Twinkle Twinkle Little Star",
      artist: "Nursery Rhymes",
      icon: "⭐",
      synthKey: "twinkle",
      videoUrl: "https://www.youtube.com/embed/yCjJyiqpAuU"
    },
    {
      id: "chan_mali_chan",
      titleMs: "Chan Mali Chan",
      titleEn: "Chan Mali Chan",
      artist: "Lagu Rakyat Kanak-Kanak",
      icon: "🐐",
      synthKey: "chan_mali_chan",
      videoUrl: "https://www.youtube.com/embed/videoseries?list=RD"
    }
  ]
};

window.BAKAWALI_DATA = BAKAWALI_DATA;
