var USE_BACKEND = true;
var API_BASE    = 'https://threadly-backend-zw8b.onrender.com';

// ── STORAGE ─────────────────────────────────────
var Store = {
  getUsers:     function() { try { return JSON.parse(localStorage.getItem('_tl_users') || '{}'); } catch(e) { return {}; } },
  saveUsers:    function(u){ localStorage.setItem('_tl_users', JSON.stringify(u)); },
  getSession:   function() { try { return JSON.parse(localStorage.getItem('_tl_sess')  || 'null'); } catch(e) { return null; } },
  saveSession:  function(s){ localStorage.setItem('_tl_sess',  JSON.stringify(s)); },
  clearSession: function() { localStorage.removeItem('_tl_sess'); localStorage.removeItem('_tl_tok'); },
  getPending:   function() { try { return JSON.parse(sessionStorage.getItem('_tl_pend') || 'null'); } catch(e) { return null; } },
  savePending:  function(p){ sessionStorage.setItem('_tl_pend', JSON.stringify(p)); },
  clearPending: function() { sessionStorage.removeItem('_tl_pend'); },
  getReset:     function() { try { return JSON.parse(sessionStorage.getItem('_tl_rst')  || 'null'); } catch(e) { return null; } },
  saveReset:    function(r){ sessionStorage.setItem('_tl_rst',  JSON.stringify(r)); },
  clearReset:   function() { sessionStorage.removeItem('_tl_rst'); }
};

// ── SIMPLE HASH (demo mode only) ─────────────────
function hashPw(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // keep 32-bit
  }
  return (hash >>> 0).toString(16); // unsigned
}

function genOTP() { return String(Math.floor(100000 + Math.random() * 900000)); }

// ── VALIDATION ───────────────────────────────────
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ── DELAY ────────────────────────────────────────
function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ── API POST ─────────────────────────────────────
async function apiPost(path, body) {
  var res  = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── TOAST ────────────────────────────────────────
function showToast(msg, type) {
  type = type || 'info';
  var stack = document.getElementById('toast-stack');
  if (!stack) return;
  var t = document.createElement('div');
  t.className   = 'toast ' + type;
  t.textContent = msg;
  stack.appendChild(t);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { t.classList.add('show'); });
  });
  setTimeout(function() {
    t.classList.remove('show');
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
  }, 3500);
}

// ── FIELD ERRORS ─────────────────────────────────
function setFE(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent   = msg || '';
  el.style.display = msg ? 'block' : 'none';
}
function clearFEs() {
  for (var i = 0; i < arguments.length; i++) setFE(arguments[i], '');
}

// ── BUTTON BUSY STATE ────────────────────────────
function setBusy(btnId, on) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = on;
  var lbl  = btn.querySelector('.lbl');
  var spin = btn.querySelector('.spin');
  if (lbl)  { if (on) lbl.classList.add('hidden');  else lbl.classList.remove('hidden'); }
  if (spin) { if (on) spin.classList.remove('hidden'); else spin.classList.add('hidden'); }
}

// ── TOGGLE PASSWORD VISIBILITY ───────────────────
function togglePw(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var show = (inp.type === 'password');
  inp.type = show ? 'text' : 'password';
  btn.innerHTML = show
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

// ── OTP GRID SETUP ───────────────────────────────
// Pass an array of input IDs e.g. ['o0','o1','o2','o3','o4','o5']
function setupOTP(ids) {
  var cells = ids.map(function(id) { return document.getElementById(id); }).filter(Boolean);
  cells.forEach(function(cell, i) {
    cell.addEventListener('input', function() {
      cell.value = cell.value.replace(/\D/g, '').slice(-1);
      if (cell.value) cell.classList.add('filled');
      else            cell.classList.remove('filled');
      if (cell.value && i < cells.length - 1) cells[i + 1].focus();
    });
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace') {
        cell.classList.remove('filled');
        if (!cell.value && i > 0) cells[i - 1].focus();
      }
      if (e.key === 'ArrowLeft'  && i > 0)               cells[i - 1].focus();
      if (e.key === 'ArrowRight' && i < cells.length - 1) cells[i + 1].focus();
    });
    cell.addEventListener('paste', function(e) {
      e.preventDefault();
      var txt = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      cells.forEach(function(c, j) {
        c.value = txt[j] || '';
        c.classList.toggle('filled', !!c.value);
      });
      var last = Math.min(txt.length, cells.length) - 1;
      if (last >= 0) cells[last].focus();
    });
    cell.addEventListener('focus', function() { cell.select(); });
  });
}

function getOTPValue(ids) {
  return ids.map(function(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }).join('');
}

// ── PASSWORD STRENGTH METER ──────────────────────
function initPwStrength(inputId, barId, lblId) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  inp.addEventListener('input', function() {
    var v = inp.value;
    var s = 0;
    if (v.length >= 8)          s++;
    if (/[A-Z]/.test(v))        s++;
    if (/[0-9]/.test(v))        s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    var bar  = document.getElementById(barId);
    var lbl  = document.getElementById(lblId);
    if (!bar || !lbl) return;
    var pcts  = [0, 25, 50, 75, 100];
    var clrs  = ['', '#ef4444', '#f59e0b', '#84cc16', '#16a34a'];
    var names = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    bar.style.width      = pcts[s] + '%';
    bar.style.background = clrs[s];
    lbl.textContent      = names[s];
    lbl.style.color      = clrs[s];
  });
}

// ── AUTH GUARDS ──────────────────────────────────
function requireAuth() {
  var sess = Store.getSession();
  if (!sess || !sess.email) {
    window.location.href = 'login.html';
    return null;
  }
  return sess;
}

function redirectIfLoggedIn(dest) {
  var sess = Store.getSession();
  if (sess && sess.email) {
    window.location.href = dest || 'dashboard.html';
  }
}
