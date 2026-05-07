'use strict';

class PigGame {
  constructor() {
    this.playerEls = [
      document.querySelector('.player--0'),
      document.querySelector('.player--1'),
    ];
    this.scoreEls = [
      document.getElementById('score--0'),
      document.getElementById('score--1'),
    ];
    this.currentEls = [
      document.getElementById('current--0'),
      document.getElementById('current--1'),
    ];
    this.historyEls = [
      document.getElementById('history--0'),
      document.getElementById('history--1'),
    ];
    this.nameEls = [
      document.getElementById('name--0'),
      document.getElementById('name--1'),
    ];
    this.diceCube = document.getElementById('dice-cube');
    this.targetInput = document.getElementById('target');
    this.confettiCanvas = document.getElementById('confetti-canvas');

    // Event listeners
    document.querySelector('.btn--roll').addEventListener('click', () => this.roll());
    document.querySelector('.btn--hold').addEventListener('click', () => this.hold());
    document.querySelector('.btn--new').addEventListener('click', () => this.newGame());

    this.nameEls.forEach((el) => {
      el.addEventListener('change', () => this.save());
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') el.blur();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (key === 'r') this.roll();
      else if (key === 'h') this.hold();
      else if (key === 'n') this.newGame();
    });

    // Rules modal
    this.rulesOverlay = document.getElementById('rules-overlay');
    document.getElementById('btn-rules').addEventListener('click', () => this.openRules());
    document.getElementById('rules-close').addEventListener('click', () => this.closeRules());
    this.rulesOverlay.addEventListener('click', (e) => {
      if (e.target === this.rulesOverlay) this.closeRules();
    });

    this.load() || this.init();
  }

  openRules() {
    this.rulesOverlay.classList.add('modal--open');
  }

  closeRules() {
    this.rulesOverlay.classList.remove('modal--open');
  }

  // --- Game Logic ---

  init() {
    this.scores = [0, 0];
    this.history = [[], []];
    this.currentScore = 0;
    this.activePlayer = 0;
    this.playing = true;
    this.names = ['Player 1', 'Player 2'];
    this.targetScore = parseInt(this.targetInput.value, 10) || 100;
    this.targetInput.disabled = false;
    this.stopConfetti();
    this.render();
    this.save();
  }

  newGame() {
    this.targetScore = parseInt(this.targetInput.value, 10) || 100;
    this.init();
  }

  switchPlayer() {
    this.currentScore = 0;
    this.activePlayer = 1 - this.activePlayer;
  }

  roll() {
    if (!this.playing) return;

    this.targetInput.disabled = true;

    const dice = Math.trunc(Math.random() * 6) + 1;
    this.showDice(dice);

    if (dice !== 1) {
      this.currentScore += dice;
      this.currentEls[this.activePlayer].textContent = this.currentScore;
      this.popElement(this.currentEls[this.activePlayer], 'current--pop');
    } else {
      this.bustFlash();
      this.history[this.activePlayer].push(0);
      this.switchPlayer();
      this.renderPlayers();
    }
    this.save();
  }

  hold() {
    if (!this.playing) return;

    this.scores[this.activePlayer] += this.currentScore;
    this.history[this.activePlayer].push(this.currentScore);

    this.popElement(this.scoreEls[this.activePlayer], 'score--pop');

    if (this.scores[this.activePlayer] >= this.targetScore) {
      this.playing = false;
      this.renderPlayers();
      this.launchConfetti();
    } else {
      this.switchPlayer();
      this.renderPlayers();
    }
    this.save();
  }

  // --- UI Rendering ---

  render() {
    this.renderPlayers();
    this.diceCube.classList.add('hidden');
    this.targetInput.value = this.targetScore;
  }

  renderPlayers() {
    for (let i = 0; i < 2; i++) {
      this.scoreEls[i].textContent = this.scores[i];
      this.currentEls[i].textContent = i === this.activePlayer ? this.currentScore : 0;
      this.nameEls[i].value = this.names[i];
      this.playerEls[i].classList.toggle('player--active', i === this.activePlayer && this.playing);
      this.playerEls[i].classList.toggle('player--winner', !this.playing && i === this.activePlayer);
      this.renderHistory(i);
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
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(0deg) rotateY(180deg)',
    3: 'rotateX(0deg) rotateY(90deg)',
    4: 'rotateX(0deg) rotateY(-90deg)',
    5: 'rotateX(-90deg) rotateY(0deg)',
    6: 'rotateX(90deg) rotateY(0deg)',
  };

  showDice(value) {
    const cube = this.diceCube;

    // Reset state
    cube.classList.remove('hidden', 'dice--rolling', 'dice--landed');
    cube.style.transition = 'none';
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
    void cube.offsetWidth;

    // Start rolling animation
    cube.classList.add('dice--rolling');

    setTimeout(() => {
      // Stop rolling, snap to correct face
      cube.classList.remove('dice--rolling');
      cube.style.transition = 'none';
      const landTransform = PigGame.FACE_ROTATIONS[value];
      cube.style.setProperty('--land-transform', landTransform);
      cube.style.transform = landTransform;

      // Trigger bounce
      void cube.offsetWidth;
      cube.classList.add('dice--landed');

      setTimeout(() => {
        cube.classList.remove('dice--landed');
      }, 500);
    }, 1000);
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

  // --- Confetti ---

  launchConfetti() {
    const canvas = this.confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6c3ce0', '#8b5cf6', '#d946a8', '#f0c27a', '#f0edf6', '#ffd700'];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
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

    this._confettiRunning = true;
    const animate = () => {
      if (!this._confettiRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.rotSpeed;

        if (p.y > canvas.height) {
          p.opacity -= 0.02;
        }

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

      if (alive > 0) {
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
      this.activePlayer = state.activePlayer || 0;
      this.playing = state.playing;
      this.targetScore = state.targetScore || 100;
      this.names = state.names || ['Player 1', 'Player 2'];
      const gameStarted = this.scores[0] > 0 || this.scores[1] > 0 ||
                           this.currentScore > 0 || this.history[0].length > 0 || this.history[1].length > 0;
      this.targetInput.disabled = gameStarted;
      this.render();
      return true;
    } catch {
      localStorage.removeItem('pigGame');
      return false;
    }
  }
}

new PigGame();
