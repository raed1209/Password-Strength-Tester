/* public/js/main.js — frontend logic */
(function () {
  'use strict';

  // ── DOM refs ─────────────────────────────────────
  const input        = document.getElementById('passwordInput');
  const toggleBtn    = document.getElementById('toggleVisibility');
  const segs         = [1,2,3,4,5].map(i => document.getElementById('seg' + i));
  const strengthLbl  = document.getElementById('strengthLabel');
  const crackEl      = document.getElementById('crackTime');
  const resultsEl    = document.getElementById('resultsSection');
  const checklistEl  = document.getElementById('checklist');
  const verdictEl    = document.getElementById('verdictText');
  const tipsEl       = document.getElementById('tipsList');
  const copyReport   = document.getElementById('copyReport');
  const copyConfirm  = document.getElementById('copyConfirm');
  const genPhrase    = document.getElementById('genPassphrase');
  const genStrong    = document.getElementById('genStrong');
  const genOutput    = document.getElementById('genOutput');
  const genText      = document.getElementById('genText');
  const copyGen      = document.getElementById('copyGen');
  const historyList  = document.getElementById('historyList');

  const LEVEL_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'];

  // ── Show/hide password ───────────────────────────
  let showPass = localStorage.getItem('pst_show') === 'true';
  function applyVisibility() {
    input.type = showPass ? 'text' : 'password';
    toggleBtn.setAttribute('aria-pressed', String(showPass));
  }
  applyVisibility();
  toggleBtn.addEventListener('click', () => {
    showPass = !showPass;
    localStorage.setItem('pst_show', showPass);
    applyVisibility();
  });

  // ── Debounce ─────────────────────────────────────
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const pw = input.value;
    if (!pw) { resetUI(); return; }
    debounceTimer = setTimeout(() => analyze(pw), 300);
  });

  // ── API call ──────────────────────────────────────
  async function analyze(password) {
    try {
      const res  = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { console.error(data.error); return; }
      renderResponse(data);
      loadHistory();
    } catch (e) {
      console.error('Analyse error:', e);
    }
  }

  // ── Render response ───────────────────────────────
  function renderResponse(d) {
    // Meter segments
    const color = LEVEL_COLORS[d.levelIndex] || '#6366f1';
    segs.forEach((s, i) => {
      s.style.background = i < d.levelIndex ? color : 'var(--border)';
    });
    strengthLbl.textContent = d.level;
    strengthLbl.style.color = color;

    // Crack time
    crackEl.textContent = d.timeToCrack.text;
    crackEl.style.color = d.timeToCrack.color;

    // Checklist
    checklistEl.querySelectorAll('li').forEach(li => {
      const rule = li.dataset.rule;
      li.classList.toggle('pass', !!d.rules[rule]);
    });

    // Verdict
    verdictEl.className = 'verdict-text ' + d.verdict;
    const verdictMap = {
      weak:   'This password is weak. Please improve it using the tips below.',
      fair:   'This password is fair. A few more improvements would make it strong.',
      strong: 'This password is strong. Great work!',
    };
    verdictEl.textContent = verdictMap[d.verdict] || '';

    // Tips
    tipsEl.innerHTML = '';
    d.tips.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      tipsEl.appendChild(li);
    });

    resultsEl.hidden = false;

    // Copy report data attr
    copyReport.dataset.report = buildReport(d);
  }

  function buildReport(d) {
    const lines = [
      'Password Strength Report',
      '========================',
      'Level:         ' + d.level,
      'Score:         ' + d.score + '/9',
      'Entropy:       ' + d.entropy.toFixed(1) + ' bits',
      'Time to crack: ' + d.timeToCrack.text,
      '',
      'Rules passed:',
    ];
    Object.entries(d.rules).forEach(([k, v]) => {
      lines.push('  [' + (v ? 'x' : ' ') + '] ' + k);
    });
    if (d.tips.length) {
      lines.push('', 'Tips:');
      d.tips.forEach(t => lines.push('  - ' + t));
    }
    return lines.join('\n');
  }

  // ── Copy report ───────────────────────────────────
  copyReport.addEventListener('click', async () => {
    const text = copyReport.dataset.report || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyConfirm.hidden = false;
      setTimeout(() => { copyConfirm.hidden = true; }, 2000);
    } catch (e) { console.error(e); }
  });

  // ── Reset ─────────────────────────────────────────
  function resetUI() {
    segs.forEach(s => { s.style.background = 'var(--border)'; });
    strengthLbl.textContent = '—';
    strengthLbl.style.color = 'var(--muted)';
    crackEl.textContent = '—';
    crackEl.style.color = '';
    resultsEl.hidden = true;
  }

  // ── History ───────────────────────────────────────
  async function loadHistory() {
    try {
      const res  = await fetch('/api/history?limit=5');
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No evaluations yet.</p>';
        return;
      }
      historyList.innerHTML = rows.map(r => `
        <div class="history-item">
          <span class="h-pass">${escHtml(r.masked_password)}</span>
          <span class="h-level">${escHtml(r.level)}</span>
          <span class="h-time">${escHtml(r.created_at || '')}</span>
        </div>
      `).join('');
    } catch (e) {
      console.error('History error:', e);
    }
  }
  loadHistory();

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // ── Generators ────────────────────────────────────
  const WORD_LIST = [
    'apple','brave','cloud','dance','eagle','flame','grace','happy','ivory','jazzy',
    'kite','lemon','magic','noble','ocean','power','quest','river','stone','tiger',
    'ultra','vivid','waves','xenon','young','zebra','amber','blaze','coral','drift',
    'ember','frost','glide','haven','inlet','jewel','karma','lunar','maple','night',
    'orbit','pearl','quake','ridge','solar','trust','unity','valor','wheat','xylem',
    'yield','zonal'
  ];

  function randomInt(n) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % n;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  genPhrase.addEventListener('click', () => {
    const words = shuffle(WORD_LIST).slice(0, 5);
    const num   = randomInt(900) + 100;
    const sym   = '!@#$%^&*'[randomInt(8)];
    const pw    = words.join('-') + num + sym;
    showGenOutput(pw);
  });

  genStrong.addEventListener('click', () => {
    const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower   = 'abcdefghijklmnopqrstuvwxyz';
    const digits  = '0123456789';
    const special = '!@#$%^&*()-_=+';
    const pool    = upper + lower + digits + special;
    let pw = [
      upper[randomInt(upper.length)],
      lower[randomInt(lower.length)],
      digits[randomInt(digits.length)],
      special[randomInt(special.length)],
    ];
    for (let i = pw.length; i < 18; i++) pw.push(pool[randomInt(pool.length)]);
    showGenOutput(shuffle(pw).join(''));
  });

  function showGenOutput(pw) {
    genText.textContent = pw;
    genOutput.hidden = false;
  }

  copyGen.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(genText.textContent);
      copyGen.textContent = 'Copied!';
      setTimeout(() => { copyGen.textContent = 'Copy'; }, 2000);
    } catch (e) { console.error(e); }
  });

})();
