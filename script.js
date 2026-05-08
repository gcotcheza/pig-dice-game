'use strict';

class PigGame {
  constructor() {
    this.playerEls = [
      document.getElementById('player--0'),
      document.getElementById('player--1'),
    ];
    this.scoreEls = [
      document.getElementById('score--0'),
      document.getElementById('score--1'),
    ];
    this.progressEls = [
      document.getElementById('progress--0'),
      document.getElementById('progress--1'),
    ];
    this.historyEls = [
      document.getElementById('history--0'),
      document.getElementById('history--1'),
    ];
    this.nameEls = [
      document.getElementById('name--0'),
      document.getElementById('name--1'),
    ];
    this.ppCurrentEls = [
      document.getElementById('pp-current--0'),
      document.getElementById('pp-current--1'),
    ];

    this.diceCube = document.getElementById('dice-cube');
    this.confettiCanvas = document.getElementById('confetti-canvas');
    this.turnNameEl = document.getElementById('turn-name');
    this.currentPill = document.getElementById('current-pill');
    this.currentValueEl = document.getElementById('current-value');
    this.streakEl = document.getElementById('streak');

    // Two target inputs (desktop inline + mobile modal) — keep in sync
    this.targetInputs = [
      document.getElementById('target'),
      document.getElementById('target-modal'),
    ];

    this.btnRoll = document.querySelector('.btn--roll');
    this.btnHold = document.querySelector('.btn--hold');

    this.btnRoll.addEventListener('click', () => this.roll());
    this.btnHold.addEventListener('click', () => this.hold());

    document.getElementById('btn-new-desktop').addEventListener('click', () => this.newGame());
    document.getElementById('btn-new-modal').addEventListener('click', () => {
      this.newGame();
      this.closeSettings();
    });

    this.nameEls.forEach((el) => {
      el.addEventListener('change', () => {
        this.save();
        this.renderTurnName();
      });
      el.addEventListener('input', () => this.renderTurnName());
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') el.blur();
      });
    });

    this.targetInputs.forEach((el) => {
      el.addEventListener('change', () => {
        const val = Math.max(10, Math.min(999, parseInt(el.value, 10) || 100));
        this.targetInputs.forEach((other) => {
          other.value = val;
        });
        if (!this.gameStarted()) {
          this.targetScore = val;
          this.renderProgress();
          this.save();
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (key === 'r') this.roll();
      else if (key === 'h') this.hold();
      else if (key === 'n') this.newGame();
      else if (e.key === 'Escape') this.closeSettings();
    });

    // Settings modal — opened by gear (mobile) or Rules button (desktop)
    this.settingsOverlay = document.getElementById('settings-overlay');
    document.getElementById('btn-settings').addEventListener('click', () => this.openSettings());
    document.getElementById('btn-rules-desktop').addEventListener('click', () => this.openSettings());
    document.getElementById('settings-close').addEventListener('click', () => this.closeSettings());
    this.settingsOverlay.addEventListener('click', (e) => {
      if (e.target === this.settingsOverlay) this.closeSettings();
    });

    this.load() || this.init();
  }

  openSettings() {
    this.settingsOverlay.classList.add('modal--open');
  }

  closeSettings() {
    this.settingsOverlay.classList.remove('modal--open');
  }

  // --- Game Logic ---

  init() {
    this.scores = [0, 0];
    this.history = [[], []];
    this.currentScore = 0;
    this.currentRolls = 0;
    this.activePlayer = 0;
    this.playing = true;
    this.names = ['Player 1', 'Player 2'];
    this.targetScore = parseInt(this.targetInputs[0].value, 10) || 100;
    this.setTargetInputsDisabled(false);
    this.stopConfetti();
    this.render();
    this.save();
  }

  newGame() {
    this.targetScore = parseInt(this.targetInputs[0].value, 10) || 100;
    this.init();
  }

  gameStarted() {
    return (
      this.scores[0] > 0 ||
      this.scores[1] > 0 ||
      this.currentScore > 0 ||
      this.history[0].length > 0 ||
      this.history[1].length > 0
    );
  }

  setTargetInputsDisabled(disabled) {
    this.targetInputs.forEach((el) => {
      el.disabled = disabled;
    });
  }

  switchPlayer() {
    this.currentScore = 0;
    this.currentRolls = 0;
    this.activePlayer = 1 - this.activePlayer;
  }

  updateActionButtons() {
    const enabled = this.playing && !this.rolling;
    this.btnRoll.disabled = !enabled;
    this.btnHold.disabled = !enabled || this.currentRolls === 0;
  }

  roll() {
    if (!this.playing || this.rolling) return;

    this.setTargetInputsDisabled(true);
    this.rolling = true;
    this.updateActionButtons();

    const dice = Math.trunc(Math.random() * 6) + 1;
    this.showDice(dice, () => {
      if (dice !== 1) {
        this.currentScore += dice;
        this.currentRolls += 1;
        this.renderCurrent();
        this.popElement(this.currentValueEl, 'current--pop');
        this.popElement(this.ppCurrentEls[this.activePlayer], 'current--pop');
        this.renderStreak();
      } else {
        this.bustFlash();
        this.history[this.activePlayer].push(0);
        this.switchPlayer();
        this.renderPlayers();
        this.renderTurnName();
        this.renderCurrent();
        this.renderStreak();
      }
      this.rolling = false;
      this.updateActionButtons();
      this.save();
    });
  }

  hold() {
    if (!this.playing || this.rolling) return;
    if (this.currentRolls === 0) return;

    this.scores[this.activePlayer] += this.currentScore;
    this.history[this.activePlayer].push(this.currentScore);

    this.popElement(this.scoreEls[this.activePlayer], 'score--pop');

    if (this.scores[this.activePlayer] >= this.targetScore) {
      this.playing = false;
      this.renderPlayers();
      this.renderTurnName();
      this.renderProgress();
      this.currentPill.classList.add('is-winner');
      this.launchCelebration();
    } else {
      this.switchPlayer();
      this.renderPlayers();
      this.renderTurnName();
      this.renderCurrent();
      this.renderStreak();
    }
    this.updateActionButtons();
    this.save();
  }

  // --- UI Rendering ---

  render() {
    this.renderPlayers();
    this.renderTurnName();
    this.renderCurrent();
    this.renderStreak();
    this.renderProgress();
    this.resetDice();
    this.targetInputs.forEach((el) => {
      el.value = this.targetScore;
    });
    this.currentPill.classList.toggle('is-winner', !this.playing);
    this.updateActionButtons();
  }

  renderPlayers() {
    for (let i = 0; i < 2; i++) {
      this.scoreEls[i].textContent = this.scores[i];
      this.nameEls[i].value = this.names[i];
      this.playerEls[i].classList.toggle('player--active', i === this.activePlayer && this.playing);
      this.playerEls[i].classList.toggle('player--winner', !this.playing && i === this.activePlayer);
      this.renderHistory(i);
    }
    this.renderProgress();
    this.renderPerPlayerCurrent();
  }

  renderTurnName() {
    const name = this.nameEls[this.activePlayer].value || `Player ${this.activePlayer + 1}`;
    this.turnNameEl.textContent = this.playing ? name : `${name} wins!`;
    this.turnNameEl.classList.toggle('is-winner', !this.playing);
  }

  renderCurrent() {
    this.currentValueEl.textContent = this.currentScore;
    this.renderPerPlayerCurrent();
  }

  renderPerPlayerCurrent() {
    for (let i = 0; i < 2; i++) {
      this.ppCurrentEls[i].textContent = i === this.activePlayer ? this.currentScore : 0;
    }
  }

  renderStreak() {
    const max = 8;
    const count = Math.min(this.currentRolls, max);
    this.streakEl.innerHTML = Array.from({ length: count })
      .map((_, i) => `<span class="streak__dot" style="animation-delay:${i * 0.04}s"></span>`)
      .join('');
  }

  renderProgress() {
    for (let i = 0; i < 2; i++) {
      const pct = Math.min(100, (this.scores[i] / this.targetScore) * 100);
      this.progressEls[i].style.width = `${pct}%`;
    }
  }

  renderHistory(player) {
    const rounds = this.history[player];
    if (rounds.length === 0) {
      this.historyEls[player].innerHTML = '';
      return;
    }
    const recent = rounds.slice(-5);
    this.historyEls[player].innerHTML = recent
      .map(
        (score, i) =>
          `<span class="history-item${score === 0 ? ' history-bust' : ''}" style="animation-delay:${i * 0.05}s">${score === 0 ? 'Bust' : `+${score}`}</span>`
      )
      .join('');
  }

  // --- Dice Animation ---

  static FACE_ROTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: 180 },
    3: { x: 0, y: 90 },
    4: { x: 0, y: -90 },
    5: { x: -90, y: 0 },
    6: { x: 90, y: 0 },
  };

  static ROLL_DURATION_MS = 850;
  static ROLL_REVOLUTIONS = 2;

  resetDice() {
    const cube = this.diceCube;
    cube.classList.remove('hidden', 'dice--rolling', 'dice--landed');
    cube.style.transition = 'none';
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
    cube.style.setProperty('--land-transform', 'rotateX(0deg) rotateY(0deg)');
  }

  showDice(value, onLand) {
    const cube = this.diceCube;
    const face = PigGame.FACE_ROTATIONS[value];
    const spins = PigGame.ROLL_REVOLUTIONS * 360;
    const targetX = spins + face.x;
    const targetY = spins + face.y;
    const landTransform = `rotateX(${face.x}deg) rotateY(${face.y}deg)`;

    cube.classList.remove('hidden', 'dice--landed');
    cube.style.transition = 'none';
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
    void cube.offsetWidth;

    cube.classList.add('dice--rolling');
    cube.style.transition = `transform ${PigGame.ROLL_DURATION_MS}ms cubic-bezier(0.45, 0.05, 0.25, 1)`;
    cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;

    setTimeout(() => {
      cube.classList.remove('dice--rolling');
      cube.style.transition = 'none';
      cube.style.setProperty('--land-transform', landTransform);
      cube.style.transform = landTransform;
      void cube.offsetWidth;

      cube.classList.add('dice--landed');

      if (onLand) onLand();

      setTimeout(() => {
        cube.classList.remove('dice--landed');
      }, 450);
    }, PigGame.ROLL_DURATION_MS);
  }

  popElement(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  bustFlash() {
    const el = this.playerEls[this.activePlayer];
    el.classList.remove('player--bust');
    void el.offsetWidth;
    el.classList.add('player--bust');
    setTimeout(() => el.classList.remove('player--bust'), 600);
  }

  // --- Celebration: confetti + fireworks ---

  launchCelebration() {
    const canvas = this.confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6c3ce0', '#8b5cf6', '#d946a8', '#f0c27a', '#f0edf6', '#ffd700'];

    // Falling confetti
    const confetti = [];
    for (let i = 0; i < 120; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.trunc(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    // Fireworks state
    const shells = [];
    const sparks = [];
    const totalShells = 10;
    const launchWindowMs = 3500;
    let shellsLaunched = 0;
    const startTime = performance.now();

    const launchShell = () => {
      const x = canvas.width * (0.15 + Math.random() * 0.7);
      const startY = canvas.height + 20;
      const targetY = canvas.height * (0.1 + Math.random() * 0.3);
      const flightFrames = 45 + Math.random() * 15;
      const vy = -(startY - targetY) / flightFrames;
      shells.push({
        x,
        y: startY,
        vx: (Math.random() - 0.5) * 0.6,
        vy,
        targetY,
        color: colors[Math.trunc(Math.random() * colors.length)],
        trail: [],
      });
      shellsLaunched++;
    };

    const explode = (shell) => {
      const numSparks = 50 + Math.trunc(Math.random() * 30);
      for (let i = 0; i < numSparks; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        sparks.push({
          x: shell.x,
          y: shell.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: shell.color,
          life: 1.0,
          decay: 0.012 + Math.random() * 0.012,
          size: 1.5 + Math.random() * 2,
        });
      }
    };

    this._confettiRunning = true;

    const animate = (now) => {
      if (!this._confettiRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Schedule shell launches over the launch window
      const elapsed = now - startTime;
      const desiredShells = Math.min(
        totalShells,
        Math.floor((elapsed / launchWindowMs) * totalShells) + 1
      );
      while (shellsLaunched < desiredShells) launchShell();

      let alive = 0;

      // Confetti
      for (const p of confetti) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height) p.opacity -= 0.02;
        if (p.opacity <= 0) continue;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      // Rising shells
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.04;

        s.trail.push({ x: s.x, y: s.y, life: 1 });
        if (s.trail.length > 8) s.trail.shift();

        for (const t of s.trail) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, t.life);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          t.life -= 0.15;
        }

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = s.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        alive++;

        // Explode near apex (vy approaches zero) or at target altitude
        if (s.vy >= -0.5 || s.y <= s.targetY) {
          explode(s);
          shells.splice(i, 1);
        }
      }

      // Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.06;
        sp.vx *= 0.99;
        sp.life -= sp.decay;
        if (sp.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.shadowBlur = 8;
        ctx.shadowColor = sp.color;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (alive > 0 || shellsLaunched < totalShells) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this._confettiRunning = false;
      }
    };
    requestAnimationFrame(animate);
  }

  stopConfetti() {
    this._confettiRunning = false;
    const ctx = this.confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
  }

  // --- Local Storage ---

  save() {
    this.names = [
      this.nameEls[0].value || 'Player 1',
      this.nameEls[1].value || 'Player 2',
    ];
    const state = {
      scores: this.scores,
      history: this.history,
      currentScore: this.currentScore,
      currentRolls: this.currentRolls,
      activePlayer: this.activePlayer,
      playing: this.playing,
      targetScore: this.targetScore,
      names: this.names,
    };
    localStorage.setItem('pigGame', JSON.stringify(state));
  }

  load() {
    const data = localStorage.getItem('pigGame');
    if (!data) return false;

    try {
      const state = JSON.parse(data);
      if (!Array.isArray(state.scores) || typeof state.playing !== 'boolean') return false;
      this.scores = state.scores;
      this.history = state.history || [[], []];
      this.currentScore = state.currentScore || 0;
      this.currentRolls = state.currentRolls || 0;
      this.activePlayer = state.activePlayer || 0;
      this.playing = state.playing;
      this.targetScore = state.targetScore || 100;
      this.names = state.names || ['Player 1', 'Player 2'];
      this.setTargetInputsDisabled(this.gameStarted());
      this.render();
      return true;
    } catch {
      localStorage.removeItem('pigGame');
      return false;
    }
  }
}

new PigGame();
