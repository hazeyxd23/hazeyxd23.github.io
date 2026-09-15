/* ============================================================
   app.js — rendering + interactions. You shouldn't need to edit
   this to add content; edit data.js instead.
   ============================================================ */
(() => {
const D = window.DATA;
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const el = (html) => { const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; };
const esc = (s='') => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* localStorage throws in a few browser modes; one place to not care */
const store = {
  get: (k, d = null) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  json: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
};
/* run at most once a frame — resize and scroll fire far faster than paint */
const onFrame = fn => {
  let queued = false;
  return (...a) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(...a); });
  };
};

/* ---------------- theme ----------------
   `data-chrome` decides which set of window furniture the stylesheet
   applies, so themes that look alike share one block of CSS. */
const root = document.documentElement;
const WIN_CHROME = ['win98', 'soft', 'retro'];   /* everything but matrix */
function applyTheme(t){
  root.dataset.theme = t;
  root.dataset.chrome = WIN_CHROME.includes(t) ? 'win' : 'flat';
  store.set('theme', t);
  $$('.sw').forEach(x => x.classList.toggle('on', x.dataset.t === t));
}
applyTheme(store.get('theme', root.dataset.theme));
$$('.sw').forEach(b => { b.onclick = () => applyTheme(b.dataset.t); });

/* ---------------- profile ---------------- */
$('#handle').textContent  = D.profile.handle;
$('#statusTxt').textContent = D.profile.status;
$('#blurb').textContent   = D.profile.blurb;
document.title = D.profile.handle;

/* ---------------- home ---------------- */
const shot = p => p.src
  ? `style="background-image:url('${esc(p.src)}')"`
  : `style="background:linear-gradient(135deg,${esc(p.color||'#5fd8cf')},#241238)"`;

const stack = $('#stack');
D.projects.forEach((p, i) => {
  stack.append(el(`
    <article class="pol" data-i="${i}" title="${esc(p.url && p.url !== '#' ? 'open ' + p.url : p.title + ' — no link set yet')}">
      <div class="shot" ${shot(p)}></div>
      <div class="cap">${esc(p.title)}</div>
      <div class="meta">${esc(p.meta||'')}</div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
    </article>`));
});

/* three layouts: stacked / fanned (hover) / spread (click) */
let spread = false;
function layout(mode, avail){
  const pol = $$('.pol', stack), n = pol.length;
  const small = innerWidth < 860;
  const cardW = small ? 196 : 268;
  const cardH = small ? 250 : 330;
  const step  = small ? 34 : 48;
  const fan   = small ? 62 : 92;
  const gapX  = small ? 0 : cardW + 46;
  /* how many columns fit in the width we're laying out for */
  const room  = avail || stack.clientWidth || 640;
  const cols  = small ? 1 : Math.max(1, Math.min(n, Math.floor(room / gapX)));
  let height;

  pol.forEach((c, i) => {
    const off = i - (n - 1) / 2;
    let tx, ty, rot;
    if (mode === 'spread'){
      const row = Math.floor(i / cols), col = i % cols;
      const last = (n % cols) && i === n - 1;
      tx  = last ? 0 : (col - (cols - 1) / 2) * gapX;
      ty  = row * cardH;
      rot = (i % 2 ? 1 : -1) * 1.5;
    } else if (mode === 'fan'){
      tx = off * fan; ty = -Math.abs(off) * 3; rot = off * 3.2;
    } else {
      tx = off * step; ty = Math.abs(off) * 3; rot = off * 4.4;
    }
    c.style.setProperty('--tx', tx + 'px');
    c.style.setProperty('--ty', ty + 'px');
    c.style.setProperty('--rot', rot + 'deg');
    c.style.zIndex = mode === 'spread' ? 1 : i + 1;
  });

  height = mode === 'spread'
    ? Math.ceil(n / cols) * cardH + 40
    : (small ? 300 : 380);
  stack.style.height = height + 'px';
}
layout('stacked');

if (matchMedia('(hover:hover)').matches){
  stack.addEventListener('mouseenter', () => { if (!spread) layout('fan'); });
  stack.addEventListener('mouseleave', () => { if (!spread) layout('stacked'); });
}
/* Expanding the stack grows the WINDOW, animated, so the fan has room.
   The window is absolutely positioned while floating, so left/top/width/height
   are all inline and can simply be transitioned — no position-type change, no
   scaling, so the content doesn't distort on the way out. */
const projWin = stack.closest('.show');
const taskbarH = () => parseInt(getComputedStyle(root).getPropertyValue('--taskbar')) || 46;

const backBtn = el('<button class="backstack" type="button">&larr; back to the stack</button>');
projWin.querySelector(':scope > .bd').prepend(backBtn);
/* the title-bar hint has to change with the mode — "click to spread" is wrong
   once you're already spread and a click opens a repo instead */
const projHint = projWin.querySelector(':scope > .hd .r');
const HINT_STACKED = projHint ? projHint.textContent : '';

function expandProjects(on){
  if (innerWidth < 860){            /* no room to grow; just lay the cards out */
    spread = on;
    layout(on ? 'spread' : 'stacked');
    return;
  }
  projWin.classList.remove('max');
  floatOut(projWin);                /* defined in the window-manager section */
  focusWin(projWin);
  projWin.classList.add('anim');

  if (on){
    projWin._pre = { left: projWin.style.left, top: projWin.style.top,
                     width: projWin.style.width, height: projWin.style.height };
    const w = document.documentElement.clientWidth - 20;
    const h = innerHeight - taskbarH() - 30;
    moveTo(projWin, scrollX + 10, scrollY + 10);
    projWin.style.width  = w + 'px';
    projWin.style.height = h + 'px';
    projWin.classList.add('expanded');
    /* lay out for the width the window is GROWING to — reading the DOM now
       would give a value part-way through the transition */
    layout('spread', w - 48);
  } else {
    Object.assign(projWin.style, projWin._pre || {});
    projWin.style.height = '';
    projWin.classList.remove('expanded');
    layout('stacked');
  }
  spread = on;
  if (projHint) projHint.textContent = on ? 'click a project to open its repo' : HINT_STACKED;
  document.body.classList.toggle('zoomed', on);
  clearTimeout(projWin._animT);
  projWin._animT = setTimeout(() => projWin.classList.remove('anim'), 520);
}

stack.addEventListener('click', e => {
  if (!spread) return expandProjects(true);
  /* in the expanded view a card opens its repo — collapsing is the back
     button's job, so a mis-click doesn't throw away the view */
  const card = e.target.closest('.pol');
  if (!card) return;
  const proj = D.projects[+card.dataset.i];
  if (proj && proj.url && proj.url !== '#') open(proj.url, '_blank', 'noopener');
});
backBtn.onclick = e => { e.stopPropagation(); expandProjects(false); };
addEventListener('keydown', e => { if (e.key === 'Escape' && spread) expandProjects(false); });

addEventListener('resize', onFrame(() => {
  if (spread && projWin.classList.contains('expanded')){
    const w = document.documentElement.clientWidth - 20;
    projWin.style.width  = w + 'px';
    projWin.style.height = (innerHeight - taskbarH() - 30) + 'px';
    layout('spread', w - 48);
  } else layout(spread ? 'spread' : 'stacked');
}));

/* latest posts (home) + full list (blog) */
const postRow = p => `<div class="row"><a href="${esc(p.url)}">${esc(p.title)}</a><span class="date">${esc(p.date)}</span></div>`;
$('#latest').innerHTML = D.posts.slice(0, 4).map(postRow).join('')
  || `<div class="row"><span class="sub">no posts yet</span></div>`;
$('#latestCount').textContent = `${Math.min(4, D.posts.length)} of ${D.posts.length}`;

/* screenshot showcase */
const tile = p => `<div class="tile" ${shot(p)}><span>${esc(p.caption||'')}</span></div>`;
$('#homeShots').innerHTML = D.photos.slice(0, 6).map(tile).join('');

/* sidebar */
$('#specs').innerHTML  = D.specs.map(([k,v]) => `<div class="spec"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('');
$('#badges').innerHTML = D.badges.map(b => `<a class="badge" href="${esc(b.url)}" target="_blank" rel="noopener"><b style="background:${esc(b.color)}"></b>${esc(b.name)}</a>`).join('');
$('#badgeCount').textContent = D.badges.length;
$('#links').innerHTML  = D.links.map(l => `<a href="${esc(l.url)}">${esc(l.name)}</a>`).join(' · ');
const booksRead = D.books.read.length;
$('#counts').innerHTML = `
  <div class="row"><span>projects</span><b>${D.projects.length}</b></div>
  <div class="row"><span>posts</span><b>${D.posts.length}</b></div>
  <div class="row"><span>books read</span><b>${booksRead}</b></div>
  <div class="row"><span>things rated</span><b>${D.ratings.length}</b></div>
  <div class="row"><span>cheese fed to brick</span><b id="cheeseCount">0</b></div>`;

/* ---------------- blog ---------------- */
const tags = ['all', ...new Set(D.posts.flatMap(p => p.tags || []))];
$('#blogChips').innerHTML = tags.map((t,i) => `<button class="chip${i?'':' on'}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
function renderPosts(tag='all'){
  const list = tag === 'all' ? D.posts : D.posts.filter(p => (p.tags||[]).includes(tag));
  $('#postList').innerHTML = list.map(postRow).join('') || `<div class="row"><span>nothing here yet</span></div>`;
  $('#postCount').textContent = list.length;
}
renderPosts();

/* ---------------- gallery ---------------- */
function renderGallery(view='photos'){
  const box = $('#galleryBody'), hd = $('#galleryHd');
  if (view === 'photos'){
    hd.textContent = 'photos';
    box.innerHTML = `<div class="bd"><div class="tiles" style="grid-template-columns:repeat(4,1fr)">${D.photos.map(tile).join('')}</div></div>`;
  } else if (view === 'bookshelf'){
    hd.textContent = 'bookshelf';
    const group = (label, arr, extra=()=>'') => `
      <div class="hd" style="margin-top:0">${label} <span class="r">${arr.length}</span></div>
      ${arr.map(b => `<div class="row"><span>${esc(b.title)}</span><span class="sub">${esc(b.author)}${extra(b)}</span></div>`).join('') || `<div class="row"><span class="sub">empty</span></div>`}`;
    box.innerHTML = group('reading now', D.books.reading)
                  + group('read', D.books.read, b => b.rating ? ` · ${'★'.repeat(b.rating)}` : '')
                  + group('want to read', D.books.want);
  } else {
    hd.textContent = view;
    const list = D.ratings.filter(r => r.kind === view);
    box.innerHTML = list.map(r => `
      <div class="row"><span>${esc(r.title)}${r.note ? ` <span class="sub">— ${esc(r.note)}</span>` : ''}</span>
      <span class="score">${r.score}/10</span></div>`).join('');
  }
}
renderGallery();

/* ---------------- about ---------------- */
function renderAbout(view='bio'){
  const box = $('#aboutBody');
  if (view === 'bio'){
    box.innerHTML = `
      <div class="show"><div class="hd">bio</div><div class="bd">${esc(D.profile.bio)}
        <p style="margin-top:14px"><a href="${esc(D.profile.resume)}">resume</a> · <a href="mailto:${esc(D.profile.email)}">${esc(D.profile.email)}</a></p></div></div>`;
  } else if (view === 'setup'){
    box.innerHTML = `<div class="show"><div class="hd">hardware</div><div class="bd">${
      D.specs.map(([k,v]) => `<div class="spec"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}</div></div>`;
  } else if (view === 'tech'){
    box.innerHTML = `<div class="show"><div class="hd">tech i like</div>${
      D.badges.map(b => `<div class="row"><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.name)}</a>
      <span class="sub" style="white-space:normal;text-align:right">${esc(b.note||'')}</span></div>`).join('')}</div>`;
  } else {
    box.innerHTML = `<div class="show"><div class="hd">links</div>${
      D.links.map(l => `<div class="row"><a href="${esc(l.url)}">${esc(l.name)}</a><span class="sub">${esc(l.url)}</span></div>`).join('')}</div>`;
  }
}
renderAbout();

/* ---------------- brick ---------------- */
const SIT='assets/brick-sit.png', EAT='assets/brick-eat.png', GRAB='assets/brick-grab.png';
const brick = $('#brick'), dock = $('#dock');
let docked = true, fed = 0, eatTimer = null;
brick.src = SIT;

function redock(){
  const r = dock.getBoundingClientRect();
  brick.style.left = (r.left + scrollX + r.width/2 - brick.offsetWidth/2) + 'px';
  /* +10 rather than -4: he was climbing out of the top of the frame */
  brick.style.top  = (r.top + scrollY + r.height - brick.offsetHeight + 10) + 'px';
  dock.classList.remove('empty');
  if (typeof placeHints === 'function') placeHints();
}
function scatterBrick(){
  docked = false; dock.classList.add('empty');
  brick.style.left = (Math.random() * (innerWidth - 160)) + 'px';
  brick.style.top  = (scrollY + 120 + Math.random() * 300) + 'px';
}
addEventListener('resize', () => { if (docked) redock(); });
addEventListener('load', redock);

function draggable(node, { onGrab, onDrop } = {}){
  let dx = 0, dy = 0;
  node.addEventListener('pointerdown', e => {
    e.preventDefault(); node.setPointerCapture(e.pointerId);
    const r = node.getBoundingClientRect();
    dx = e.clientX - r.left; dy = e.clientY - r.top;
    node.classList.add('held'); onGrab && onGrab();
  });
  node.addEventListener('pointermove', e => {
    if (!node.classList.contains('held')) return;
    node.style.left = (e.pageX - dx) + 'px';
    node.style.top  = (e.pageY - dy) + 'px';
  });
  const end = () => { if (!node.classList.contains('held')) return; node.classList.remove('held'); onDrop && onDrop(); };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
}

draggable(brick, {
  onGrab(){ clearTimeout(eatTimer); eatTimer = null; brick.src = GRAB; docked = false; dock.classList.add('empty'); },
  onDrop(){
    brick.src = SIT;
    const b = brick.getBoundingClientRect(), d = dock.getBoundingClientRect();
    if (Math.hypot(b.left - d.left, b.top - d.top) < 120){ docked = true; redock(); }
    $$('.cheese').forEach(tryFeed);
  }
});

/* ---------------- cheese ---------------- */
/* Drawn as a wheel of cheese with one wedge cut out, and the wedge itself.
   Both are generated geometry — an ellipse top face, an extruded rind, and the
   cut walls of the notch — so they read as solids rather than flat shapes even
   at 40px. Angles and depth were tuned against the icon size, not the artboard.

   cheese wheel */
const CHEESE_BLOCK = `<svg viewBox="0 0 64 54" xmlns="http://www.w3.org/2000/svg">
<path d="M 32.00 36.00 L 58.74 33.91 A 27 15 0 0 1 40.34 50.27 Z" fill="#c9921c" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<path d="M 32.00 24.00 L 40.34 38.27 L 40.34 50.27 L 32.00 36.00 Z" fill="#fbd764" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<path d="M 40.34 38.27 A 27 15 0 0 1 5.00 24.00 L 5.00 36.00 A 27 15 0 0 0 40.34 50.27 Z" fill="#e8ae2c" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<path d="M 32.00 24.00 L 58.74 21.91 A 27 15 0 1 0 40.34 38.27 Z" fill="#ffe486" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="18" cy="21" rx="3.4" ry="2" fill="#eccb58"/>
<ellipse cx="30" cy="14" rx="2.6" ry="1.5" fill="#eccb58"/>
<ellipse cx="23" cy="29" rx="3" ry="1.8" fill="#eccb58"/>
<ellipse cx="11" cy="25" rx="2.2" ry="1.4" fill="#eccb58"/>
<ellipse cx="16" cy="38" rx="2.4" ry="1.7" fill="#c9921c"/>
</svg>`;

/* one slice out of that wheel */
const CHEESE = `<svg viewBox="0 0 44 36" xmlns="http://www.w3.org/2000/svg">
<path d="M 33.58 6.50 A 33 17 0 0 1 33.58 23.50 L 33.58 33.50 A 33 17 0 0 0 33.58 16.50 Z" fill="#e8ae2c" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<path d="M 5.00 15.00 L 33.58 23.50 L 33.58 33.50 L 5.00 25.00 Z" fill="#fbd764" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<path d="M 5.00 15.00 L 33.58 6.50 A 33 17 0 0 1 33.58 23.50 Z" fill="#ffe486" stroke="#7a4c0f" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="24" cy="14" rx="2.8" ry="1.7" fill="#eccb58"/>
<ellipse cx="31" cy="18" rx="2.1" ry="1.3" fill="#eccb58"/>
<ellipse cx="18" cy="18" rx="2.2" ry="1.4" fill="#eccb58"/>
<ellipse cx="24" cy="27" rx="2.1" ry="1.4" fill="#c9921c"/>
</svg>`;

const MAX_SLICES = 14;
function cutSlice(fromRect){
  if ($$('.cheese').length >= MAX_SLICES) return;
  const c = el(`<div class="cheese fresh">${CHEESE}</div>`);
  /* land clear of the block, not on top of it — slices used to pile over
     the icon and bury the thing you click to make more */
  c.style.left = (fromRect.left + scrollX + ICO_W + 8 + Math.random() * 92) + 'px';
  c.style.top  = (fromRect.top  + scrollY - 4 + Math.random() * 84) + 'px';
  document.body.append(c);
  draggable(c, { onDrop(){ tryFeed(c); } });
  setTimeout(() => c.classList.remove('fresh'), 340);
}
function tryFeed(c){
  const a = c.getBoundingClientRect(), b = brick.getBoundingClientRect();
  if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top){ c.remove(); feed(b); }
}
function feed(b){
  fed++;
  const n1 = $('#cheeseCount'), n2 = $('#cheeseCount2'), n3 = $('#fedBig');
  [n1, n2, n3].forEach(n => n && (n.textContent = fed));
  brick.src = EAT; brick.classList.add('eating');
  const p = el(`<div class="pop">nom!</div>`);
  p.style.left = (b.left + scrollX + b.width/2) + 'px';
  p.style.top  = (b.top + scrollY - 6) + 'px';
  document.body.append(p); setTimeout(() => p.remove(), 1000);
  clearTimeout(eatTimer);
  eatTimer = setTimeout(() => { brick.src = SIT; brick.classList.remove('eating'); eatTimer = null; }, 1700);
}

/* ---------------- window manager ----------------
   every .show is a window: drag it by the title bar, minimise it to the
   taskbar, maximise it, or close it and get it back from the Start menu.
   NOTE: defined above go(), which calls into it. */
const BTNS = `<span class="btns">`
  + `<b data-w="min" title="minimise">_</b>`
  + `<b data-w="max" title="maximise">□</b>`
  + `<b data-w="close" title="close">×</b></span>`;
let zTop = 60;

const wins = () => $$('.page.on .show');
const titleOf = w => {
  const hd = w.querySelector(':scope > .hd');
  const txt = hd && [...hd.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
  return (txt ? txt.textContent : 'window').trim();
};
const floating = w => w.classList.contains('float') || w.classList.contains('max');

function focusWin(w){ if (floating(w)) w.style.zIndex = ++zTop; }

/* lift a window out of the grid, leaving a same-size placeholder behind
   so the panels around it don't jump when you pick it up */
function floatOut(w){
  if (w.classList.contains('float')) return;
  const r = w.getBoundingClientRect();
  /* left/top are resolved against the offset parent (.wrap, which is
     centred), NOT the page. Write page coordinates and the window jumps
     right by the width of .wrap's left margin. So record the parent's
     origin and work in page coordinates everywhere, converting on write. */
  const host = w.offsetParent || document.body;
  const hr = host.getBoundingClientRect();
  w._ox = hr.left + scrollX + host.clientLeft;
  w._oy = hr.top  + scrollY + host.clientTop;

  const ph = document.createElement('div');
  ph.className = 'ph';
  ph.style.height = r.height + 'px';
  w.parentNode.insertBefore(ph, w);
  w._ph = ph;
  w.style.width = r.width + 'px';
  moveTo(w, r.left + scrollX, r.top + scrollY);
  w.classList.add('float');
  focusWin(w);
}

/* x/y are page coordinates; the whole desktop is in range */
function moveTo(w, x, y){
  const maxX = Math.max(0, document.documentElement.clientWidth - 90);
  w.style.left = (Math.min(Math.max(0, x), maxX) - w._ox) + 'px';
  w.style.top  = (Math.max(0, y) - w._oy) + 'px';
}

function dockBack(w){
  if (w === projWin && w.classList.contains('expanded')) expandProjects(false);
  if (w._ph){ w._ph.remove(); w._ph = null; }
  w._pos = null; w._ox = w._oy = 0;
  w.classList.remove('float', 'max', 'min', 'dragging');
  delete w.dataset.closed;
  w.style.cssText = '';
}

function dragFrom(w, e){
  if (e.button || e.target.closest('.btns')) return;
  if (w.classList.contains('max') || innerWidth < 860) return;
  e.preventDefault();
  floatOut(w); focusWin(w);
  const r = w.getBoundingClientRect();
  const dx = e.clientX - r.left, dy = e.clientY - r.top;
  w.classList.add('dragging');
  const move = ev => moveTo(w, ev.pageX - dx, ev.pageY - dy);
  const up = () => {
    w.classList.remove('dragging');
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

function winAction(w, action){
  if (action === 'min')   w.classList.add('min');
  if (action === 'close'){ w.classList.add('min'); w.dataset.closed = '1'; }
  if (action === 'max'){
    if (w.classList.contains('max')){
      w.classList.remove('max');
      if (w._pos){ Object.assign(w.style, w._pos); w._pos = null; }
    } else {
      floatOut(w);
      /* floatOut writes left/top/width inline, and inline beats the
         stylesheet — so stash them and clear, or .show.max can't
         reach the edges of the screen */
      w._pos = { left: w.style.left, top: w.style.top, width: w.style.width };
      w.style.left = w.style.top = w.style.width = '';
      w.classList.add('max');
      focusWin(w);
    }
  }
  renderTaskbar();
}

/* idempotent: safe to re-run after gallery/about rebuild their panels */
function mountWindows(){
  document.body.classList.add('wm');
  $$('.wrap .show').forEach(w => {
    const hd = w.querySelector(':scope > .hd');
    if (!hd) return;
    hd.querySelector('.btns')?.remove();   /* normalise the hand-written sets */
    hd.insertAdjacentHTML('beforeend', BTNS);
    if (w.dataset.wm) return;
    w.dataset.wm = '1';
    hd.addEventListener('pointerdown', e => dragFrom(w, e));
    w.addEventListener('pointerdown', () => focusWin(w));
    hd.addEventListener('click', e => {
      const b = e.target.closest('.btns b');
      if (b) winAction(w, b.dataset.w);
    });
    hd.addEventListener('dblclick', e => {
      if (!e.target.closest('.btns')) winAction(w, 'max');
    });
  });
}

/* cascade: step each window down and to the right of the one above it, the
   way you'd fan a stack of paper out on a desk. STEP is the diagonal offset;
   OVERLAP is how far each window rides up over its predecessor's bottom
   edge — that's the bit that reads as depth rather than as a list. */
const STEP = 24, OVERLAP = 18;

function cascadeCol(list){
  if (!list.length) return;
  const first = list[0].getBoundingClientRect();
  let x = first.left + scrollX, y = first.top + scrollY;
  list.forEach((w, i) => {
    const h = w.getBoundingClientRect().height;
    floatOut(w);
    moveTo(w, x + i * STEP, y);
    w.style.zIndex = 60 + i;          /* later windows sit on top */
    /* shrink the placeholder by the overlap so the column — and the page —
       don't keep the height the cascade just reclaimed */
    if (w._ph) w._ph.style.height = Math.max(0, h - OVERLAP) + 'px';
    y += h - OVERLAP;
  });
}

function cascade(force){
  if (innerWidth < 860) return;
  const page = $('.page.on');
  if (!page || (page.dataset.arranged && !force)) return;
  page.dataset.arranged = '1';
  const open = root => $$('.show', root).filter(w => !w.classList.contains('min'));
  const cols = $$('.grid .col', page);
  if (cols.length) cols.forEach(c => cascadeCol(open(c)));
  else cascadeCol(open(page));
  renderTaskbar();
}

/* ---------------- desktop icons ----------------
   closed windows leave an icon on the desktop, behind everything else.
   the glyphs are drawn here in the win98 idiom — they are not Microsoft's
   icon files, which we have no licence to ship. */
const ICONS = {
  pc: `<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="4" y="6" width="24" height="16" fill="#cfcfcf" stroke="#000"/><rect x="6" y="8" width="20" height="12" fill="#1c8f8f"/><rect x="11" y="23" width="10" height="3" fill="#aaa" stroke="#000"/><rect x="6" y="26" width="20" height="3" fill="#cfcfcf" stroke="#000"/></svg>`,
  doc: `<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M7 3h13l6 6v20H7z" fill="#fff" stroke="#000"/><path d="M20 3v6h6" fill="#d6d6d6" stroke="#000"/><g stroke="#3b6ea5" fill="none"><path d="M11 14h13M11 18h13M11 22h8"/></g></svg>`,
  pic: `<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="6" width="26" height="20" fill="#fff" stroke="#000"/><rect x="5" y="8" width="22" height="16" fill="#8fd0f0"/><circle cx="11" cy="13" r="2.5" fill="#ffe06a"/><path d="M5 24l7-8 5 5 4-3 6 6z" fill="#3f9d4f"/></svg>`,
  globe: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#3d8fd1" stroke="#000"/><g fill="none" stroke="#d8ecff"><path d="M4 16h24M16 4c5.5 5 5.5 19 0 24M16 4c-5.5 5-5.5 19 0 24"/></g></svg>`,
  box: `<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M12 9V6h8v3" fill="none" stroke="#000"/><rect x="3" y="9" width="26" height="18" fill="#d8b26a" stroke="#000"/><rect x="3" y="15" width="26" height="4" fill="#b4894a" stroke="#000"/></svg>`,
  folder: `<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M2 6h11l3 3h14v18H2z" fill="#c99a2e" stroke="#000"/><path d="M2 11h28v16H2z" fill="#ffd257" stroke="#000"/></svg>`
};
const iconFor = n =>
    /spec|hardware|setup/.test(n)              ? 'pc'
  : /writing|post|blog|bio|tech/.test(n)       ? 'doc'
  : /screenshot|photo|gallery|pic/.test(n)     ? 'pic'
  : /elsewhere|link/.test(n)                   ? 'globe'
  : /badge|rating/.test(n)                     ? 'box'
  : /collection|book/.test(n)                  ? 'folder'
  : 'folder';

function reopen(w){
  delete w.dataset.closed;
  w.classList.remove('min');
  focusWin(w);
  renderTaskbar();
}

/* open it if it's closed or minimised, otherwise just bring it to the front */
function openWin(w){
  if (w.dataset.closed || w.classList.contains('min')) return reopen(w);
  focusWin(w);
  if (!floating(w)) w.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* icons can be dragged anywhere and stay put across reloads, keyed by the
   window's title so the map survives panels being re-rendered */
const ICO_W = 106, ICO_H = 106;
let icoPos = store.json('icons', {});
const saveIcoPos = () => store.set('icons', JSON.stringify(icoPos));

/* Where each icon starts: one column down the left, in this order. Anything
   not listed lands after them. These are only the DEFAULTS — anything the user
   drags is remembered in localStorage.icons and wins over this table. */
const LEFT = [
  'project showcase', 'writing showcase', 'screenshot showcase', 'elsewhere',
  'pc specs', 'badges', 'collection', 'cheese wheel'
];

function defaultIcoPos(key){
  const i = LEFT.indexOf(key);
  const slot = i > -1 ? i : LEFT.length;
  const perCol = Math.max(1, Math.floor((innerHeight - 80) / ICO_H));
  return { x: 8 + Math.floor(slot / perCol) * ICO_W, y: 12 + (slot % perCol) * ICO_H };
}

function dragIcon(ico, e){
  if (e.button) return;
  const desk = ico.parentElement;
  const r = ico.getBoundingClientRect();
  const dx = e.clientX - r.left, dy = e.clientY - r.top;
  let moved = false;
  const move = ev => {
    /* a few px of slop, or every click would count as a drag */
    if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
    if (!moved){ moved = true; ico.classList.add('dragging'); }
    const d = desk.getBoundingClientRect();
    const x = Math.min(Math.max(0, ev.clientX - dx - d.left), d.width  - ICO_W);
    const y = Math.min(Math.max(0, ev.clientY - dy - d.top),  d.height - ICO_H);
    ico.style.left = x + 'px';
    ico.style.top  = y + 'px';
  };
  const up = () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    if (!moved) return;
    ico.classList.remove('dragging');
    icoPos[ico._key] = { x: parseFloat(ico.style.left), y: parseFloat(ico.style.top) };
    saveIcoPos();
    ico._dragged = true;                  /* swallow the click that follows */
    setTimeout(() => { ico._dragged = false; }, 0);
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

function makeIcon(desk, { key, svg, label, title, extraClass, open }){
  const ico = el(`<button class="ico ${extraClass || ''}">
    <span class="g">${svg}</span><span class="l"></span></button>`);
  ico.querySelector('.l').textContent = label;
  ico.title = title;
  ico._key = key;
  const pos = icoPos[key] || defaultIcoPos(key);
  ico.style.left = pos.x + 'px';
  ico.style.top  = pos.y + 'px';
  ico.addEventListener('pointerdown', ev => dragIcon(ico, ev));
  /* a double-click fires click twice AND dblclick, so every activation
     path has to go through one guard — otherwise the cheese block cut
     three slices per double-click */
  const fire = () => {
    const now = Date.now();
    if (now - (ico._lastFire || 0) < 350) return;
    ico._lastFire = now;
    open(ico);
  };
  ico.ondblclick = fire;
  ico.onclick = () => {
    if (ico._dragged) return;
    /* double-click to open, but a second tap works too — dblclick is
       unreliable on touch */
    if (ico.classList.contains('sel')) return fire();
    $$('.ico', desk).forEach(x => x.classList.toggle('sel', x === ico));
  };
  ico.onkeydown = e => { if (e.key === 'Enter') fire(); };
  desk.append(ico);
  return ico;
}

function renderDesk(){
  const desk = $('#desk');
  if (!desk) return;
  desk.innerHTML = '';
  wins().forEach(w => {
    const name = titleOf(w);
    const shut = !!w.dataset.closed;
    const ico = makeIcon(desk, {
      key: name,
      svg: ICONS[iconFor(name)],
      label: name,
      title: (shut ? 'open ' : 'go to ') + name,
      /* an OPEN window's icon is the spent one — the closed ones are what
         you can still act on, so they stay bright */
      extraClass: shut ? '' : 'open',
      open: () => openWin(w)
    });
    ico._win = w;
  });
  /* not a window: click it and a slice drops out */
  makeIcon(desk, {
    key: 'cheese wheel', svg: CHEESE_BLOCK, label: 'cheese wheel',
    extraClass: 'block', title: 'cut a slice for brick',
    open: ico => { cutSlice(ico.getBoundingClientRect()); killHint('brick'); }
  });
}

function renderTaskbar(){
  const box = $('#tasks');
  if (!box) return;
  box.innerHTML = '';
  wins().forEach(w => {
    if (w.dataset.closed) return;
    const b = el(`<button class="task"></button>`);
    b.textContent = titleOf(w);
    const isMin = w.classList.contains('min');
    b.classList.toggle('isMin', isMin);
    b.classList.toggle('active', !isMin);
    b.onclick = () => {
      if (isMin){ w.classList.remove('min'); focusWin(w); }
      else w.classList.add('min');
      renderTaskbar();
    };
    box.append(b);
  });
  renderDesk();
}

/* ---------------- start menu ---------------- */
const startBtn = $('#start'), startMenu = $('#startmenu');
function closeStart(){
  startMenu.hidden = true;
  startBtn.setAttribute('aria-expanded', 'false');
}
function openStart(){
  const items = $('#startItems');
  items.innerHTML = '';
  const add = (label, fn) => {
    const b = el('<button></button>');
    b.textContent = label;
    b.onclick = () => { fn(); closeStart(); };
    items.append(b);
  };

  const shut = wins().filter(w => w.dataset.closed);
  if (shut.length){
    items.append(el('<div class="cap">closed windows</div>'));
    shut.forEach(w => add(titleOf(w), () => reopen(w)));
    items.append(el('<hr>'));
  }

  items.append(el('<div class="cap">go to</div>'));
  $$('.tab').forEach(t => add(t.textContent.toLowerCase(), () => go(t.dataset.page)));
  items.append(el('<hr>'));
  add('tidy windows', tidyWindows);
  add('cascade windows', () => cascade(true));
  add('shuffle brick', scatterBrick);

  startMenu.hidden = false;
  startBtn.setAttribute('aria-expanded', 'true');
}
startBtn.onclick = e => {
  e.stopPropagation();
  startMenu.hidden ? openStart() : closeStart();
};

/* ---------------- hints ----------------
   brick being draggable and the site having themes are both invisible.
   one callout each, killed for good the first time you use the thing. */
/* each hint sits to the LEFT of what it points at, where the desktop is
   empty — putting them to the right covered the name and the swatches.
   if there's no room on the left (narrow window), flip to the right. */
const leftOf = (r, n, dy) => {
  const x = r.left + scrollX - n.offsetWidth - 16;
  return x < scrollX + 8
    /* flipped: sit low so it lands on body copy rather than the heading */
    ? [r.right + scrollX + 16, r.bottom + scrollY - n.offsetHeight - 2, 'left']
    : [x, r.top + scrollY + dy, 'right'];
};
const HINTS = {
  brick: { text: '<b>drag brick</b><br>feed him cheese',
           place: n => leftOf($('#brick').getBoundingClientRect(), n, 30) },
  theme: { text: '<b>4 themes</b><br>pick one',
           place: n => leftOf($('.themes').getBoundingClientRect(), n, -4) }
};
const hintDone = k => { try { return localStorage.getItem('hint-' + k); } catch { return null; } };
const hintNodes = {};

function placeHints(){
  for (const [k, n] of Object.entries(hintNodes)){
    if (!n.isConnected) continue;
    const [x, y, dir] = HINTS[k].place(n);
    if (!Number.isFinite(x)) continue;
    n.style.left = x + 'px';
    n.style.top  = y + 'px';
    n.dataset.dir = dir;
  }
}

function killHint(k){
  const n = hintNodes[k];
  if (!n) return;
  n.remove();
  delete hintNodes[k];
  try { localStorage.setItem('hint-' + k, '1'); } catch {}
}

function showHints(){
  if (innerWidth < 860) return;           /* no room, and no hover to explain */
  for (const k of Object.keys(HINTS)){
    if (hintDone(k) || hintNodes[k]) continue;
    const n = el(`<div class="hint" data-dir="right">${HINTS[k].text}</div>`);
    n.onclick = () => killHint(k);
    document.body.append(n);
    hintNodes[k] = n;
  }
  placeHints();
}
/* one capture-phase listener does the lot: dismissing hints (using the thing
   a hint points at is what kills it) and closing the two popups */
document.addEventListener('pointerdown', e => {
  if (e.target.closest('#brick, .cheese')) killHint('brick');
  if (e.target.closest('.sw')) killHint('theme');
  if (!startMenu.hidden && !e.target.closest('#startmenu,#start')) closeStart();
  if (!ctxMenu.hidden && !e.target.closest('.ctxmenu')) hideCtx();
}, true);

const reflow = onFrame(() => { placeHints(); });
addEventListener('resize', reflow);
addEventListener('scroll', reflow, { passive: true });

/* ---------------- right-click menu ---------------- */
const ctxMenu = el('<div class="ctxmenu" hidden></div>');
document.body.append(ctxMenu);
const hideCtx = () => { ctxMenu.hidden = true; };

function showCtx(x, y, items){
  ctxMenu.innerHTML = '';
  items.filter(Boolean).forEach(it => {
    if (it === '-') return ctxMenu.append(el('<hr>'));
    const b = el('<button></button>');
    b.textContent = it.label;
    if (it.tick) b.classList.add('tick');
    b.onclick = () => { hideCtx(); it.run(); };
    ctxMenu.append(b);
  });
  ctxMenu.hidden = false;
  const r = ctxMenu.getBoundingClientRect();
  ctxMenu.style.left = Math.max(4, Math.min(x, innerWidth  - r.width  - 6)) + 'px';
  ctxMenu.style.top  = Math.max(4, Math.min(y, innerHeight - r.height - 6)) + 'px';
}

const THEME_NAME = { win98: 'windows 98', soft: 'soft blue', retro: 'retro', hacker: 'matrix' };
const setTheme = t => { applyTheme(t); killHint('theme'); };

function tidyWindows(){
  $$('.wrap .show').forEach(dockBack);
  const page = $('.page.on');
  if (page) delete page.dataset.arranged;   /* so cascade can run again */
  zTop = 60;
  renderTaskbar();
}

const windowItems = w => [
  { label: w.classList.contains('min') ? 'restore' : 'minimise',
    run: () => w.classList.contains('min') ? reopen(w) : winAction(w, 'min') },
  { label: w.classList.contains('max') ? 'un-maximise' : 'maximise',
    run: () => winAction(w, 'max') },
  '-',
  { label: 'close', run: () => winAction(w, 'close') }
];

const deskItems = () => {
  const shut = wins().filter(w => w.dataset.closed);
  return [
    { label: 'tidy windows', run: tidyWindows },
    { label: 'cascade windows', run: () => cascade(true) },
    shut.length && { label: `open all (${shut.length})`, run: () => shut.forEach(reopen) },
    { label: 'shuffle brick', run: scatterBrick },
    '-',
    ...['win98','soft','retro','hacker'].map(t => ({
      label: THEME_NAME[t], tick: root.dataset.theme === t, run: () => setTheme(t)
    }))
  ];
};

addEventListener('contextmenu', e => {
  /* leave the browser's own menu alone on links and text fields — people
     still want "open in new tab" and "copy" */
  if (e.target.closest('a, input, textarea, select')) return;
  const ico = e.target.closest('.ico');
  const hd  = e.target.closest('.show > .hd');
  e.preventDefault();
  closeStart();
  if (ico)     showCtx(e.clientX, e.clientY, windowItems(ico._win));
  else if (hd) showCtx(e.clientX, e.clientY, windowItems(hd.parentElement));
  else         showCtx(e.clientX, e.clientY, deskItems());
});
addEventListener('keydown', e => { if (e.key === 'Escape'){ hideCtx(); closeStart(); } });
addEventListener('scroll', hideCtx, { passive: true });
addEventListener('resize', hideCtx);

/* ---------------- chips + tabs ---------------- */
document.addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  $$('.chip', c.parentElement).forEach(x => x.classList.toggle('on', x === c));
  const group = c.parentElement.id;
  if (group === 'blogChips')    renderPosts(c.dataset.tag);
  if (group === 'galleryChips') renderGallery(c.dataset.view);
  if (group === 'aboutChips')   renderAbout(c.dataset.view);
  /* gallery and about rebuild their panels wholesale, so the windows
     they contain are brand new and need mounting again */
  mountWindows(); renderTaskbar();
});

const ctxTools = {
  home:    '<button class="tool" id="shuffle">shuffle brick</button>',
  blog:    '<button class="tool">search</button>',
  gallery: '<button class="tool">grid</button>',
  about:   `<a class="tool" href="${D.profile.resume}">resume</a>`
};
function go(id){
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.page === id));
  $$('.page').forEach(p => p.classList.toggle('on', p.id === id));
  $('#ctx').innerHTML = ctxTools[id] || '';
  const sh = $('#shuffle'); if (sh) sh.onclick = scatterBrick;
  if (docked) setTimeout(redock, 30);
  mountWindows();          /* idempotent; this tab may never have been shown */
  renderTaskbar();
}
$$('.tab').forEach(t => t.onclick = () => go(t.dataset.page));
go('home');
/* let blog/*.html link back to a specific tab: index.html#blog */
const fromHash = location.hash.slice(1);
if ($$('.tab').some(t => t.dataset.page === fromHash)){
  go(fromHash);
  /* the section ids double as anchors, so the browser scrolls the profile
     header off screen on load. drop the fragment and undo the jump. */
  history.replaceState(null, '', location.pathname);
  scrollTo(0, 0);
  addEventListener('load', () => scrollTo(0, 0));
}

/* ---------------- toolbar ---------------- */
$('#nowPlaying').textContent = D.toolbar.nowPlaying;
$('#visits').textContent     = D.toolbar.visits;
function tick(){
  $('#clock').textContent = new Date().toLocaleTimeString('en-GB',
    { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit' }) + ' IST';
}
tick(); setInterval(tick, 20000);
redock();
mountWindows();
renderTaskbar();
showHints();
addEventListener('load', () => { redock(); placeHints(); });
})();
