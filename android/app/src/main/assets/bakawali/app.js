// Bakawali Educational Adventure - Core Application Engine
// 100% Offline-Capable HTML/JS/CSS Frontend for Android Shell

class BakawaliApp {
  constructor() {
    this.lang = localStorage.getItem("bakawali_lang") || "ms";
    this.currentView = "adventure";
    this.stars = parseInt(localStorage.getItem("bakawali_stars") || "12");
    this.coins = parseInt(localStorage.getItem("bakawali_coins") || "50");
    this.streak = parseInt(localStorage.getItem("bakawali_streak") || "3");
    this.progress = JSON.parse(localStorage.getItem("bakawali_progress") || "{}");
    this.unlockedBadges = JSON.parse(localStorage.getItem("bakawali_badges") || '["b1"]');
    this.savedArt = JSON.parse(localStorage.getItem("bakawali_art") || "[]");
    this.activeModule = null;
    this.activeMissionIdx = 0;
    this.activeMissions = [];
    this.buddy = {
      hunger: 80,
      happiness: 90,
      level: 2,
      lastFed: Date.now()
    };
    this.games = {};
  }

  init() {
    this.bindEvents();
    this.updateTopBar();
    this.renderCurrentView();
    this.setupAndroidBridge();
  }

  setupAndroidBridge() {
    // Register back button handler for Android MainActivity
    window.onBakawaliBackPressed = () => {
      if (document.getElementById("missionModal").style.display === "flex") {
        this.closeMissionModal();
        return true;
      }
      if (document.getElementById("celebrateModal").classList.contains("show")) {
        this.closeCelebrate();
        return true;
      }
      if (this.currentView !== "adventure") {
        this.navigate("adventure");
        return true;
      }
      return false; // let Android shell handle double-tap exit
    };
  }

  nativeVibrate(duration = 40) {
    if (window.BakawaliNative && typeof window.BakawaliNative.vibrate === "function") {
      window.BakawaliNative.vibrate(duration);
    } else if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  nativeToast(msg) {
    if (window.BakawaliNative && typeof window.BakawaliNative.showToast === "function") {
      window.BakawaliNative.showToast(msg);
    } else {
      console.log("[Toast]", msg);
    }
  }

  setLanguage(newLang) {
    this.lang = newLang;
    localStorage.setItem("bakawali_lang", newLang);
    document.getElementById("btnLang").textContent = newLang === "ms" ? "🇲🇾 BM" : "🇬🇧 EN";
    this.renderCurrentView();
    this.nativeVibrate(20);
  }

  toggleLanguage() {
    this.setLanguage(this.lang === "ms" ? "en" : "ms");
  }

  saveState() {
    localStorage.setItem("bakawali_stars", this.stars);
    localStorage.setItem("bakawali_coins", this.coins);
    localStorage.setItem("bakawali_streak", this.streak);
    localStorage.setItem("bakawali_progress", JSON.stringify(this.progress));
    localStorage.setItem("bakawali_badges", JSON.stringify(this.unlockedBadges));
    localStorage.setItem("bakawali_art", JSON.stringify(this.savedArt));
    this.updateTopBar();
  }

  updateTopBar() {
    document.getElementById("topStars").textContent = this.stars;
    document.getElementById("topCoins").textContent = this.coins;
    document.getElementById("topStreak").textContent = this.streak + "d";
  }

  navigate(viewName) {
    this.currentView = viewName;
    document.querySelectorAll(".view-page").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    const targetView = document.getElementById("view-" + viewName);
    if (targetView) targetView.classList.add("active");

    const navBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (navBtn) navBtn.classList.add("active");

    window.bakawaliAudio.playBeep(520, "sine", 0.08, 0.05);
    this.renderCurrentView();
  }

  renderCurrentView() {
    switch (this.currentView) {
      case "adventure":
        this.renderAdventureWorld();
        break;
      case "modules":
        this.renderModulesList();
        break;
      case "games":
        this.renderGamesHub();
        break;
      case "buddy":
        this.renderBuddyCamp();
        break;
      case "stories":
        this.renderStoryQuest();
        break;
      case "creator":
        this.renderLittleCreator();
        break;
      case "parents":
        this.renderParentCorner();
        break;
      case "gallery":
        this.renderPhotoGallery();
        break;
      case "music":
        this.renderYouTubeMusic();
        break;
      case "badges":
        this.renderBadgeCollection();
        break;
    }
  }

  // --- Adventure World ---
  renderAdventureWorld() {
    const container = document.getElementById("adventureWorldsGrid");
    if (!container) return;

    const worlds = window.BAKAWALI_DATA.worlds;
    container.innerHTML = worlds.map(w => {
      const name = this.lang === "ms" ? w.nameMs : w.nameEn;
      const desc = this.lang === "ms" ? w.descMs : w.descEn;
      const [startMod, endMod] = w.modulesRange;
      let completedInWorld = 0;
      for (let i = startMod; i <= endMod; i++) {
        if (this.progress[i] >= 10) completedInWorld++;
      }
      const totalInWorld = (endMod - startMod + 1);
      const pct = Math.round((completedInWorld / totalInWorld) * 100);

      return `
        <div class="world-card" onclick="app.openWorld(${startMod}, '${name}')">
          <div class="world-card-header">
            <div class="world-icon" style="background: ${w.themeColor}22; border: 1px solid ${w.themeColor};">${w.icon}</div>
            <div class="world-info">
              <h3>${name}</h3>
              <p>${desc}</p>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:6px; color:#94A3B8;">
            <span>Modul ${startMod}-${endMod}</span>
            <span>${pct}% ${this.lang === "ms" ? "Selesai" : "Done"}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  openWorld(moduleStart, worldName) {
    this.navigate("modules");
    this.filterModulesByRange(moduleStart, moduleStart + 17);
  }

  // --- 100 Training Modules ---
  renderModulesList() {
    const listEl = document.getElementById("modulesList");
    if (!listEl) return;

    const allModules = window.BAKAWALI_DATA.getModules();
    listEl.innerHTML = allModules.map(m => {
      const title = this.lang === "ms" ? m.titleMs : m.titleEn;
      const completedCount = this.progress[m.id] || 0;
      const isUnlocked = this.stars >= m.starsRequired;

      return `
        <div class="module-item ${isUnlocked ? '' : 'opacity-50'}" onclick="${isUnlocked ? `app.startModule(${m.id})` : `app.nativeToast('${this.lang === 'ms' ? 'Kumpul lagi bintang!' : 'Collect more stars!'}')`}">
          <div class="module-item-left">
            <div class="module-num">${m.id}</div>
            <div>
              <div class="module-title">${m.icon} ${title}</div>
              <div class="module-sub">${completedCount} / 50 ${this.lang === 'ms' ? 'misi selesai' : 'missions completed'}</div>
            </div>
          </div>
          <div>
            ${isUnlocked ? `<span style="color:#10B981; font-weight:bold;">▶ Mula</span>` : `<span style="color:#94A3B8;">🔒 ${m.starsRequired}⭐</span>`}
          </div>
        </div>
      `;
    }).join("");
  }

  filterModulesByRange(start, end) {
    const items = document.querySelectorAll(".module-item");
    items.forEach((item, idx) => {
      const id = idx + 1;
      if (id >= start && id <= end) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  }

  startModule(moduleId) {
    this.activeModule = moduleId;
    this.activeMissions = window.BAKAWALI_DATA.getModuleMissions(moduleId);
    this.activeMissionIdx = this.progress[moduleId] ? Math.min(this.progress[moduleId], 49) : 0;
    this.showMissionModal();
  }

  showMissionModal() {
    const modal = document.getElementById("missionModal");
    modal.style.display = "flex";
    this.renderCurrentMission();
  }

  closeMissionModal() {
    document.getElementById("missionModal").style.display = "none";
  }

  renderCurrentMission() {
    const mission = this.activeMissions[this.activeMissionIdx];
    if (!mission) {
      this.closeMissionModal();
      return;
    }

    document.getElementById("missionIndexText").textContent = `${this.lang === 'ms' ? 'Misi' : 'Mission'} ${this.activeMissionIdx + 1}/50`;
    document.getElementById("missionPrompt").textContent = this.lang === 'ms' ? mission.promptMs : mission.promptEn;
    document.getElementById("missionVisual").textContent = mission.visual;

    const answersGrid = document.getElementById("missionAnswersGrid");
    answersGrid.innerHTML = mission.options.map((opt, i) => `
      <button class="answer-btn" onclick="app.answerMission(${opt.correct}, this)">
        ${opt.label}
      </button>
    `).join("");

    // Read question audio out loud
    if (mission.speakText) {
      window.bakawaliAudio.speak(mission.speakText, this.lang);
    }
  }

  answerMission(isCorrect, btnElement) {
    if (isCorrect) {
      btnElement.classList.add("correct");
      window.bakawaliAudio.playCorrect();
      this.nativeVibrate(60);

      this.stars += 1;
      this.coins += 2;
      this.progress[this.activeModule] = Math.max(this.progress[this.activeModule] || 0, this.activeMissionIdx + 1);
      this.saveState();

      if (window.BakawaliNative && window.BakawaliNative.recordTrainingProgress) {
        window.BakawaliNative.recordTrainingProgress(this.activeModule, this.activeMissionIdx + 1, 3);
      }

      setTimeout(() => {
        if (this.activeMissionIdx < 49) {
          this.activeMissionIdx++;
          this.renderCurrentMission();
        } else {
          this.closeMissionModal();
          this.showCelebration(`${this.lang === 'ms' ? 'Tahniah! Modul Selesai!' : 'Awesome! Module Completed!'} +50⭐`);
        }
      }, 700);
    } else {
      btnElement.classList.add("incorrect");
      window.bakawaliAudio.playWrong();
      this.nativeVibrate(150);
      setTimeout(() => {
        btnElement.classList.remove("incorrect");
      }, 600);
    }
  }

  showCelebration(text) {
    const modal = document.getElementById("celebrateModal");
    document.getElementById("celebrateText").textContent = text;
    modal.classList.add("show");
    window.bakawaliAudio.playCorrect();
  }

  closeCelebrate() {
    document.getElementById("celebrateModal").classList.remove("show");
  }

  // --- Mini Games Hub ---
  renderGamesHub() {
    // Setup runner or spin quest
  }

  startSkyRunner() {
    const canvas = document.getElementById("skyRunnerCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let birdY = 150;
    let velocity = 0;
    let score = 0;
    let gems = [{ x: 300, y: 140 }, { x: 500, y: 100 }];
    let isRunning = true;

    canvas.onclick = () => {
      velocity = -6;
      window.bakawaliAudio.playJump();
      this.nativeVibrate(25);
    };

    const loop = () => {
      if (!isRunning) return;
      velocity += 0.35;
      birdY += velocity;
      if (birdY > 260) { birdY = 260; velocity = 0; }
      if (birdY < 20) { birdY = 20; velocity = 0; }

      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Mascot
      ctx.font = "32px sans-serif";
      ctx.fillText("🐥", 60, birdY);

      // Draw Gems
      gems.forEach(g => {
        g.x -= 3;
        ctx.fillText("💎", g.x, g.y);
        if (Math.abs(g.x - 60) < 25 && Math.abs(g.y - birdY) < 30) {
          g.x = canvas.width + Math.random() * 200;
          score += 10;
          this.coins += 1;
          window.bakawaliAudio.playGem();
          this.updateTopBar();
        }
        if (g.x < -30) {
          g.x = canvas.width + Math.random() * 200;
          g.y = 50 + Math.random() * 180;
        }
      });

      // Score
      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`Skor: ${score} 💎`, 15, 30);

      requestAnimationFrame(loop);
    };
    loop();
  }

  spinQuestWheel() {
    const canvas = document.getElementById("spinWheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let angle = 0;
    let speed = 25 + Math.random() * 15;
    window.bakawaliAudio.playBeep(600, "square", 0.1);
    this.nativeVibrate(50);

    const spin = () => {
      speed *= 0.96;
      angle += speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const slices = ["⭐ +5", "🪙 +20", "💎 +10", "🎁 Surprise", "⭐ +10", "🪙 +50", "💖 Love", "🚀 Boost"];
      const sliceAngle = (Math.PI * 2) / slices.length;

      slices.forEach((s, idx) => {
        ctx.save();
        ctx.translate(140, 140);
        ctx.rotate(angle * (Math.PI / 180) + idx * sliceAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 130, 0, sliceAngle);
        ctx.fillStyle = idx % 2 === 0 ? "#4F46E5" : "#F59E0B";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(s, 40, 20);
        ctx.restore();
      });

      // Wheel Pointer
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.moveTo(140, 5);
      ctx.lineTo(130, 30);
      ctx.lineTo(150, 30);
      ctx.fill();

      if (speed > 0.3) {
        requestAnimationFrame(spin);
      } else {
        this.coins += 25;
        this.saveState();
        this.showCelebration(this.lang === 'ms' ? 'Tahniah! Anda Memenangi +25 Syiling!' : 'Congrats! You won +25 Coins!');
      }
    };
    spin();
  }

  // --- Story Quest ---
  renderStoryQuest() {
    const list = document.getElementById("storyList");
    if (!list) return;

    const books = window.BAKAWALI_DATA.storybooks;
    list.innerHTML = books.map((b, idx) => {
      const title = this.lang === 'ms' ? b.titleMs : b.titleEn;
      return `
        <div class="world-card" style="margin-bottom:12px;" onclick="app.openStory(${idx})">
          <div class="world-card-header">
            <div class="world-icon" style="background:#EC489922; border:1px solid #EC4899;">${b.cover}</div>
            <div class="world-info">
              <h3>${title}</h3>
              <p>${b.pages.length} ${this.lang === 'ms' ? 'Halaman Bergambar' : 'Illustrated Pages'}</p>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  openStory(storyIdx) {
    const book = window.BAKAWALI_DATA.storybooks[storyIdx];
    let pageIdx = 0;

    const renderPage = () => {
      const page = book.pages[pageIdx];
      const text = this.lang === 'ms' ? page.textMs : page.textEn;
      document.getElementById("storyReaderContent").innerHTML = `
        <div class="story-page-card">
          <div class="story-art">${page.art}</div>
          <div class="story-text">${text}</div>
          <div style="display:flex; gap:10px;">
            <button class="icon-btn" onclick="bakawaliAudio.speak('${text.replace(/'/g, "\\'")}', '${this.lang}')">🔊</button>
            ${pageIdx > 0 ? `<button class="btn-primary" onclick="app.storyPrev()">◀</button>` : ''}
            ${pageIdx < book.pages.length - 1 ? `<button class="btn-primary" onclick="app.storyNext()">▶</button>` : `<button class="btn-primary" onclick="app.closeStoryReader()">${this.lang === 'ms' ? 'Tamat' : 'Finish'}</button>`}
          </div>
        </div>
      `;
      window.bakawaliAudio.speak(text, this.lang);
    };

    this.storyNext = () => { pageIdx++; renderPage(); };
    this.storyPrev = () => { pageIdx--; renderPage(); };
    this.closeStoryReader = () => {
      document.getElementById("storyReaderModal").style.display = "none";
      this.stars += 3;
      this.saveState();
    };

    document.getElementById("storyReaderModal").style.display = "flex";
    renderPage();
  }

  // --- Little Creator Drawing Canvas ---
  renderLittleCreator() {
    const canvas = document.getElementById("drawingCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let painting = false;
    let brushColor = "#EF4444";
    let brushSize = 6;

    const startPos = (e) => {
      painting = true;
      draw(e);
    };
    const endPos = () => {
      painting = false;
      ctx.beginPath();
    };
    const draw = (e) => {
      if (!painting) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.strokeStyle = brushColor;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    canvas.onmousedown = startPos;
    canvas.onmouseup = endPos;
    canvas.onmousemove = draw;
    canvas.ontouchstart = startPos;
    canvas.ontouchend = endPos;
    canvas.ontouchmove = draw;

    window.setDrawColor = (c) => { brushColor = c; };
    window.clearCanvas = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); };
    window.saveDrawing = () => {
      const dataUrl = canvas.toDataURL();
      this.savedArt.push({ id: Date.now(), data: dataUrl });
      this.saveState();
      this.nativeToast(this.lang === 'ms' ? 'Disimpan ke Galeri Foto!' : 'Saved to Photo Gallery!');
      this.nativeVibrate(40);
    };
  }

  // --- Buddy Camp ---
  renderBuddyCamp() {
    const el = document.getElementById("buddyVisual");
    if (el) el.textContent = "🐥";
  }

  feedBuddy() {
    if (this.coins < 5) {
      this.nativeToast(this.lang === 'ms' ? 'Syiling tidak mencukupi!' : 'Not enough coins!');
      return;
    }
    this.coins -= 5;
    this.buddy.happiness = Math.min(100, this.buddy.happiness + 15);
    this.saveState();
    window.bakawaliAudio.playGem();
    this.nativeVibrate(30);
    const el = document.getElementById("buddyVisual");
    if (el) {
      el.textContent = "😋 🍎";
      setTimeout(() => { el.textContent = "🐥 💖"; }, 1000);
    }
  }

  // --- Parent Corner ---
  renderParentCorner() {
    const statsEl = document.getElementById("parentStatsContent");
    if (statsEl) {
      statsEl.innerHTML = `
        <div style="background:#1E293B; padding:16px; border-radius:14px; border:1px solid #334155;">
          <h4 style="color:#FBBF24; margin-bottom:8px;">📊 Laporan Pembelajaran / Learning Report</h4>
          <p>🌟 Jumlah Bintang / Stars: <strong>${this.stars}</strong></p>
          <p>🪙 Jumlah Syiling / Coins: <strong>${this.coins}</strong></p>
          <p>🔥 Hari Berturut-turut / Streak: <strong>${this.streak} Hari</strong></p>
          <p>🎨 Lukisan Tersimpan / Artworks: <strong>${this.savedArt.length}</strong></p>
        </div>
      `;
    }
  }

  // --- YouTube Music Station ---
  renderYouTubeMusic() {
    const container = document.getElementById("musicListContainer");
    if (!container) return;

    const songs = window.BAKAWALI_DATA.youtubeMusic;
    container.innerHTML = songs.map(s => {
      const title = this.lang === 'ms' ? s.titleMs : s.titleEn;
      return `
        <div class="module-item" onclick="app.playSong('${s.synthKey}', '${title}')">
          <div class="module-item-left">
            <div class="module-num">${s.icon}</div>
            <div>
              <div class="module-title">${title}</div>
              <div class="module-sub">${s.artist}</div>
            </div>
          </div>
          <button class="icon-btn">▶</button>
        </div>
      `;
    }).join("");
  }

  playSong(synthKey, title) {
    document.getElementById("nowPlayingTitle").textContent = `🎵 ${title}`;
    window.bakawaliAudio.playNurseryMelody(synthKey);
    this.nativeVibrate(30);
  }

  stopSong() {
    window.bakawaliAudio.stopNurseryMelody();
    document.getElementById("nowPlayingTitle").textContent = "Muzik Dihentikan";
  }

  // --- Badge Collection ---
  renderBadgeCollection() {
    const grid = document.getElementById("badgesGrid");
    if (!grid) return;

    const allBadges = window.BAKAWALI_DATA.badges;
    grid.innerHTML = allBadges.map(b => {
      const isUnlocked = this.unlockedBadges.includes(b.id);
      const name = this.lang === 'ms' ? b.nameMs : b.nameEn;
      const desc = this.lang === 'ms' ? b.descMs : b.descEn;

      return `
        <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-name">${name}</div>
          <div style="font-size:9px; color:#94A3B8; margin-top:3px;">${desc}</div>
        </div>
      `;
    }).join("");
  }

  // --- Photo Gallery ---
  renderPhotoGallery() {
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;

    if (this.savedArt.length === 0) {
      grid.innerHTML = `<p style="grid-column: span 2; text-align:center; color:#94A3B8; padding:30px;">${this.lang === 'ms' ? 'Belum ada lukisan. Pergi ke Little Creator untuk melukis!' : 'No drawings yet. Head to Little Creator to start!'}</p>`;
      return;
    }

    grid.innerHTML = this.savedArt.map(art => `
      <div style="background:#1E293B; border-radius:14px; overflow:hidden; border:1px solid #334155;">
        <img src="${art.data}" style="width:100%; height:120px; object-fit:contain; background:#FFFFFF;" />
      </div>
    `).join("");
  }

  bindEvents() {
    document.getElementById("btnLang").addEventListener("click", () => this.toggleLanguage());
  }
}

window.app = new BakawaliApp();
document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
