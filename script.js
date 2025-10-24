// =============================================
// Sustinho.js — Jump scare para trend TikTok 👻
// =============================================

const $ = (sel) => document.querySelector(sel);

// Elementos principais
const app         = $('#app');
const startBtn    = $('#start');
const monster     = $('#monster');
const flash       = $('#flash');
const blood       = $('#blood');
const glitch1     = document.querySelector('.glitch-layer');
const glitch2     = document.querySelector('.glitch-layer--2');
const cta         = $('#cta');
const copyBtn     = $('#copyLink');
const copyFeedback= $('#copyFeedback');
const audioHint   = $('#audioHint');

const soundToggle = $('#soundToggle');
const muteButton  = $('#muteButton');
const screamEl    = $('#screamEl'); // fallback <audio>

// Controle de áudio
let audioCtx, gainNode, audioBuffer;
let soundEnabled = false;
let hardMuted = true;
let audioReady = false;
let secondTapNeeded = false;

// ===========================
// ÁUDIO - WebAudio API
// ===========================
async function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.85; // volume do grito
  gainNode.connect(audioCtx.destination);

  try {
    const res = await fetch('assets/scream.mp3');
    const arr = await res.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arr);
    audioReady = true;
  } catch (e) {
    console.warn('⚠️ Falha no WebAudio, usando fallback.', e);
    audioReady = false;
  }
}

async function playScream() {
  if (!soundEnabled || hardMuted) return;

  // iOS pode bloquear sem interação
  if (audioCtx && audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch {}
  }

  if (audioCtx && audioReady && audioBuffer) {
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(gainNode);

      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.85, now + 0.03);

      src.start();
      secondTapNeeded = false;
      return;
    } catch (e) {
      console.warn('Fallback para <audio>');
    }
  }

  try {
    screamEl.currentTime = 0;
    screamEl.volume = 1.0;
    await screamEl.play();
    secondTapNeeded = false;
  } catch (err) {
    secondTapNeeded = true;
    audioHint.hidden = false;
  }
}

// ===========================
// EFEITOS VISUAIS
// ===========================
function runSequence() {
  // vibração no mobile
  if (navigator.vibrate) {
    navigator.vibrate([10, 40, 15]);
  }

  // flash rápido
  flash.classList.add('flash-on');
  setTimeout(() => flash.classList.remove('flash-on'), readCSSms('--t-flash'));

  // glitch + shake
  glitch1.classList.add('glitch-on');
  glitch2.classList.add('glitch-on');
  app.classList.add('shake');

  // entrada do monstro + grito
  setTimeout(async () => {
    monster.classList.add('reveal');
    await playScream();
  }, 120);

  setTimeout(() => app.classList.remove('shake'), readCSSms('--t-shake'));
  setTimeout(() => {
    glitch1.classList.remove('glitch-on');
    glitch2.classList.remove('glitch-on');
  }, readCSSms('--t-glitch'));

  const hold = readCSSms('--t-zoom') + readCSSms('--t-hold');
  setTimeout(() => blood.classList.add('blood-on'), hold);

  const total = hold + readCSSms('--t-blood') + 150;
  setTimeout(() => {
    cta.setAttribute('aria-hidden', 'false');
    cta.classList.add('cta-show');
    audioHint.hidden = true;
  }, total);
}

function readCSSms(varName){
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (v.endsWith('ms')) return parseFloat(v);
  if (v.endsWith('s'))  return parseFloat(v) * 1000;
  return parseFloat(v) || 0;
}

// ===========================
// EVENTOS UI
// ===========================
startBtn.addEventListener('click', async () => {
  await initAudio();
  document.activeElement?.blur?.();
  document.querySelector('.hero').style.display = 'none';
  runSequence();

  if (secondTapNeeded) {
    app.addEventListener('click', replayOnce, { once: true });
  }
});

function replayOnce(){
  audioHint.hidden = true;
  playScream();
}

soundToggle.addEventListener('click', async () => {
  await initAudio();
  soundEnabled = !soundEnabled;
  hardMuted = !soundEnabled;
  soundToggle.textContent = soundEnabled ? 'Desativar' : 'Ativar';
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  muteButton.textContent = soundEnabled ? '🔊' : '🔇';
});

muteButton.addEventListener('click', () => {
  hardMuted = !hardMuted;
  muteButton.textContent = hardMuted ? '🔇' : '🔊';
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyFeedback.textContent = 'Link copiado! 📋';
  } catch {
    copyFeedback.textContent = 'Não foi possível copiar o link.';
  }
});

// ===========================
// ANIMAÇÃO DE POEIRA
// ===========================
const dust = $('#dust');
const dctx = dust.getContext('2d', { alpha: true });
let particles = [];

function resizeCanvas() {
  dust.width = app.clientWidth;
  dust.height = app.clientHeight;
}
window.addEventListener('resize', resizeCanvas, { passive: true });
resizeCanvas();

function initParticles(n = 48) {
  particles = Array.from({ length: n }).map(() => ({
    x: Math.random() * dust.width,
    y: Math.random() * dust.height,
    r: Math.random() * 1.6 + 0.3,
    a: Math.random() * 0.35 + 0.15,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.12
  }));
}
initParticles();

function drawDust() {
  dctx.clearRect(0, 0, dust.width, dust.height);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = dust.width;
    if (p.x > dust.width) p.x = 0;
    if (p.y < 0) p.y = dust.height;
    if (p.y > dust.height) p.y = 0;
    dctx.beginPath();
    dctx.fillStyle = `rgba(255,255,255,${p.a})`;
    dctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    dctx.fill();
  }
  requestAnimationFrame(drawDust);
}
requestAnimationFrame(drawDust);

// Foco no botão inicial ao carregar
window.addEventListener('load', () => {
  startBtn?.focus?.();
});
