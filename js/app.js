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
/* below 860px it's a phone layout: no desktop icons, windows pinned in the
   flow. style.css switches at the same width (max-width:859.98px). */
const narrow = () => innerWidth < 860;

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
   js/theme.js already put the saved theme on <html> in <head>, before first
   paint, and owns which themes share the Windows 98 chrome — the blog posts
   load the same file, so the mapping lives in one place. */
const root = document.documentElement;
const applyTheme = t => THEME.apply(t);
THEME.mark();
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
  const small = narrow();
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
  if (narrow()){                    /* no room to grow; just lay the cards out */
    spread = on;
    projWin.classList.toggle('spread', on);   /* shows the back button */
    layout(on ? 'spread' : 'stacked');
    if (projHint) projHint.textContent = on ? 'tap a project to open its repo' : HINT_STACKED;
    /* the spread is one long column of cards on a phone — coming back, put
       the window's top in view rather than leaving you halfway down it */
    if (!on) projWin.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }
  /* Maximising stashes the window's geometry in _pos and clears the inline
     values, so a maximised window has NO inline size. Reading style.width
     here used to save that emptiness as the size to come back to, and "back
     to the stack" left the window shrink-wrapped to its content. So: pull
     the real geometry back out of _pos first, and remember it was maximised. */
  if (projWin.classList.contains('max')){
    projWin.classList.remove('max');
    if (on){ Object.assign(projWin.style, projWin._pos || {}); projWin._preMax = true; }
    projWin._pos = null;            /* maximised while expanded: just drop it */
  } else if (on) projWin._preMax = false;
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
    if (projWin._preMax){           /* it was maximised before it grew */
      projWin._pos = { left: projWin.style.left, top: projWin.style.top, width: projWin.style.width };
      projWin.style.left = projWin.style.top = projWin.style.width = '';
      projWin.classList.add('max');
      projWin._preMax = false;
    }
  }
  spread = on;
  projWin.classList.toggle('spread', on);
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

/* screenshot showcase: project screenshots if there are any, else photos.
   a tile with a url is a link to the full-size image */
const tile = p => p.url
  ? `<a class="tile" href="${esc(p.url)}" target="_blank" rel="noopener" ${shot(p)}><span>${esc(p.caption||'')}</span></a>`
  : `<div class="tile" ${shot(p)}><span>${esc(p.caption||'')}</span></div>`;
$('#homeShots').innerHTML = (D.screenshots || D.photos).slice(0, 6).map(tile).join('');

/* sidebar */
const specRows = () => D.specs.map(([k,v]) => `<div class="spec"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('');
$('#specs').innerHTML  = specRows();
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
    box.innerHTML = `<div class="bd"><div class="tiles wide">${D.photos.map(tile).join('')}</div></div>`;
  } else if (view === 'bookshelf'){
    hd.textContent = 'bookshelf';
    const group = (label, arr, extra=()=>'') => `
      <div class="shelf">${label}<span>${arr.length}</span></div>
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
      <div class="show" data-key="about"><div class="hd">bio</div><div class="bd">${esc(D.profile.bio)}
        <p style="margin-top:14px"><a href="${esc(D.profile.resume)}">resume</a> · <a href="mailto:${esc(D.profile.email)}">${esc(D.profile.email)}</a></p></div></div>`;
  } else if (view === 'setup'){
    box.innerHTML = `<div class="show" data-key="about"><div class="hd">hardware</div><div class="bd">${specRows()}</div></div>`;
  } else if (view === 'tech'){
    box.innerHTML = `<div class="show" data-key="about"><div class="hd">tech i like</div>${
      D.badges.map(b => `<div class="row"><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.name)}</a>
      <span class="sub" style="white-space:normal;text-align:right">${esc(b.note||'')}</span></div>`).join('')}</div>`;
  } else {
    box.innerHTML = `<div class="show" data-key="about"><div class="hd">links</div>${
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
  keepOnScreen();
}
/* Brick dropped half under the taskbar or off the right edge was as good as
   lost. Pull him back inside the visible desktop. (page coordinates) */
function keepOnScreen(){
  const w = brick.offsetWidth, h = brick.offsetHeight;
  const maxX = scrollX + document.documentElement.clientWidth - w;
  const maxY = scrollY + innerHeight - taskbarH() - h;
  brick.style.left = Math.max(scrollX, Math.min(parseFloat(brick.style.left) || 0, maxX)) + 'px';
  brick.style.top  = Math.max(scrollY, Math.min(parseFloat(brick.style.top)  || 0, maxY)) + 'px';
}
addEventListener('resize', () => { if (docked) redock(); });

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
    keepOnScreen();
    const b = brick.getBoundingClientRect(), d = dock.getBoundingClientRect();
    if (Math.hypot(b.left - d.left, b.top - d.top) < 120){ docked = true; redock(); }
    /* dropping Brick on the cheese works as well as the other way round */
    if (brickCanEat() && cheeseIco && overlap(brick.getBoundingClientRect(),
        cheeseIco.querySelector('.g').getBoundingClientRect())) eatCheese();
  }
});

/* ---------------- squish ----------------
   plays the "mmmh yes squishy rat" clip in a little window over Brick. He
   steps out of frame while it runs — he's the one being squished — and comes
   back once it has played three times and faded. */
const SQUISH_PLAYS = 3;
let squishWin = null;
function squish(){
  if (squishWin){ squishWin._done = true; squishWin.remove(); }
  const b = brick.getBoundingClientRect();
  const w = el(`<div class="show squishwin" role="dialog" aria-label="brick, squished">
    <div class="hd">squish.gif<span class="btns"><b title="close">×</b></span></div>
    <div class="bd"><video muted playsinline autoplay preload="auto" width="198" height="250"
      aria-label="brick being squished">
      <source src="assets/brick-squish.webm" type="video/webm">
      <source src="assets/brick-squish.mp4" type="video/mp4"></video></div>
  </div>`);
  document.body.append(w);
  squishWin = w;
  const W = w.offsetWidth, H = w.offsetHeight;
  const x = Math.min(Math.max(8, b.left + b.width / 2 - W / 2), innerWidth - W - 8);
  const y = Math.min(Math.max(8, b.top + b.height / 2 - H / 2), innerHeight - taskbarH() - H - 8);
  w.style.left = (x + scrollX) + 'px';
  w.style.top  = (y + scrollY) + 'px';
  brick.classList.add('away');

  const v = w.querySelector('video');
  let plays = 0;
  const done = () => {
    if (w._done) return;
    w._done = true;
    w.classList.add('bye');
    setTimeout(() => w.remove(), 300);
    if (squishWin === w){ squishWin = null; setTimeout(() => brick.classList.remove('away'), 160); }
  };
  v.addEventListener('ended', () => {
    if (++plays < SQUISH_PLAYS){ v.currentTime = 0; v.play().catch(done); } else done();
  });
  /* with <source> children a failed load fires on the source, not the video;
     only the last one failing means nothing will play */
  w.querySelector('source:last-of-type').addEventListener('error', done);
  v.play().catch(() => {});
  /* if the clip never gets going, don't leave Brick missing */
  setTimeout(done, 1000 * SQUISH_PLAYS + 2500);
  w.querySelector('.btns b').onclick = done;
}

/* ---------------- cheese ----------------
   One block of cheese on the desktop, drawn after the piece Brick is holding
   in brick-eat.png: flat yellow, a heavy black outline, holes as outlines.
   Drag the whole block onto Brick (or Brick onto it) and he eats it. Five
   seconds later another one grows back in the same spot, and a clock face
   fills clockwise in its place while you wait. The respawn time lives out
   here, not on the icon, because renderDesk() rebuilds every icon whenever
   the taskbar changes. */
const CHEESE_BLOCK = `<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#050505" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
<path d="M41 29 L59 13.5 L59 30 L41 46 Z" fill="#E4C762"/>
<path d="M4 23 L41 29 L41 46 L4 39.5 Z" fill="#F3DC80"/>
<path d="M4 23 L41 29 L59 13.5 L27 9 Z" fill="#F3DC80"/>
<g stroke-width="1.7" fill="#EAD174">
<ellipse cx="13.5" cy="32" rx="3.2" ry="2.7"/>
<ellipse cx="28.5" cy="38.5" rx="3.9" ry="3"/>
<ellipse cx="33" cy="17.5" rx="3.6" ry="1.9"/>
<ellipse cx="20" cy="20.5" rx="2.3" ry="1.3"/>
<path d="M4 29 a2.6 2.6 0 0 1 0 5.4"/>
<ellipse cx="50.5" cy="27.5" rx="2" ry="2.8" fill="#D9B955"/>
</g>
</svg>`;
const RESPAWN_MS = 5000;
let cheeseIco = null;              /* the current icon; renderDesk replaces it */
let cheeseBack = 0;                /* when the next block is due; 0 = it's here */
const cheeseReady = () => !cheeseBack;
/* ...and Brick has to be there to eat it: during a squish he's hidden, and
   feeding the empty spot used to count */
const brickCanEat = () => cheeseReady() && !brick.classList.contains('away');
const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function setCheese(ico, fresh){
  const here = cheeseReady();
  ico.querySelector('.g').innerHTML = here ? CHEESE_BLOCK : '<span class="clock"><i></i></span>';
  ico.classList.toggle('growing', !here);
  ico.title = here ? 'drag me onto brick' : 'more cheese on the way';
  if (here && fresh){
    ico.classList.add('fresh');
    setTimeout(() => ico.classList.remove('fresh'), 420);
  }
}
function cheeseTick(){
  const left = cheeseBack - Date.now();
  if (left <= 0){
    cheeseBack = 0;
    if (cheeseIco) setCheese(cheeseIco, true);
    return;
  }
  if (cheeseIco) cheeseIco.style.setProperty('--p', (1 - left / RESPAWN_MS).toFixed(4));
  requestAnimationFrame(cheeseTick);
}
function eatCheese(){
  if (!brickCanEat()) return;
  feed(brick.getBoundingClientRect());
  cheeseBack = Date.now() + RESPAWN_MS;
  if (cheeseIco){ cheeseIco.style.setProperty('--p', 0); setCheese(cheeseIco); }
  requestAnimationFrame(cheeseTick);
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

/* put a window back in its slot in the grid. Closed and minimised windows
   stay that way: tidying rearranges what's open, it doesn't reopen the
   windows the page deliberately starts closed. */
function dockBack(w){
  if (w === projWin && spread) expandProjects(false);
  if (w._ph){ w._ph.remove(); w._ph = null; }
  w._pos = null; w._ox = w._oy = 0;
  w.classList.remove('float', 'max', 'dragging');
  w.style.cssText = '';
}

function dragFrom(w, e){
  if (e.button || e.target.closest('.btns')) return;
  if (w.classList.contains('max') || narrow()) return;
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
  /* the projects window grown to fill the screen puts the page in "zoomed"
     mode, which lifts .wrap over Brick. Minimised or closed like that, the
     page stayed zoomed with nothing showing and Brick simply vanished.
     Collapse it first. */
  if ((action === 'min' || action === 'close') && w === projWin && spread) expandProjects(false);
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
  if (narrow()) return;
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

/* a little note that floats up off whatever you clicked and fades out */
function sign(anchor, text){
  if (anchor._sign) anchor._sign.remove();
  const r = anchor.getBoundingClientRect();
  const s = el('<div class="sign" role="status"></div>');
  s.textContent = text;
  document.body.append(s);
  /* above the icon, unless that's off the top of the screen — the first row
     of icons sits right against it — in which case just under the label */
  const above = r.top - s.offsetHeight - 4;
  s.style.left = (r.left + r.width / 2) + 'px';
  s.style.top  = (above >= 4 ? above : r.bottom + 2) + 'px';
  anchor._sign = s;
  s.addEventListener('animationend', () => s.remove());
}

/* Open it if it's closed or minimised. If it's already open, say so — a
   double-click that visibly does nothing reads as a broken icon, which is
   exactly what people testing the site kept running into — then bring the
   window forward and blink its title bar so you can see which one it is. */
function openWin(w, ico){
  const shut = w.dataset.closed || w.classList.contains('min');
  if (shut) reopen(w);
  else {
    if (ico) sign(ico, 'already open');
    focusWin(w);
    w.classList.remove('flash'); void w.offsetWidth; w.classList.add('flash');
  }
  if (!floating(w)) w.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* icons can be dragged anywhere and stay put across reloads, keyed by the
   window's name so the map survives panels being re-rendered. Windows whose
   title changes with a chip (gallery, about) carry a data-key instead. */
const ICO_W = 106, ICO_H = 106;
let icoPos = store.json('icons', {});
const saveIcoPos = () => store.set('icons', JSON.stringify(icoPos));
const keyOf = w => w.dataset.key || titleOf(w);

/* Where each icon starts: down the left, in this order; windows from other
   tabs take the first slots this tab leaves free. These are only DEFAULTS —
   anything the user drags is remembered in localStorage.icons and wins. */
const LEFT = [
  'project showcase', 'writing showcase', 'screenshot showcase', 'elsewhere',
  'pc specs', 'badges', 'collection', 'cheese'
];

/* How the default column is laid out. Usually ICO_H apart, wrapping into a
   second column beside the first. Where only ONE column fits between the
   screen edge and the page — 1280x720, 1024x768, most 13" laptops — the
   icons go compact and closer together so all of them fit in it. Before,
   the overflow column landed on top of the page and the icons in it got
   shoved out into the gaps between windows. */
let deskGrid = { step: ICO_H, perCol: 7, compact: false };
function deskLayout(){
  const deskH = ($('#desk')?.clientHeight || innerHeight) - 12;
  const page = $('.wrap .profile');
  const room = page ? page.getBoundingClientRect().left - 8 : ICO_W;
  const cols = Math.max(1, Math.floor(room / ICO_W));
  let step = ICO_H;
  if (Math.floor(deskH / ICO_H) * cols < LEFT.length)
    step = Math.max(80, Math.floor(deskH / Math.ceil(LEFT.length / cols)));
  return { step, perCol: Math.max(1, Math.floor(deskH / step)), compact: step < ICO_H };
}
function defaultIcoPos(slot){
  const { step, perCol } = deskGrid;
  return { x: 8 + Math.floor(slot / perCol) * ICO_W, y: 12 + (slot % perCol) * step };
}

/* ---- keeping icons where they can be clicked ----
   The desktop sits underneath everything else. Drop an icon under something
   that never moves — Brick's home, the profile, the tabs — and it could never
   be clicked again, and so never dragged back out either. So an icon may only
   land where a click on its picture and on its label would actually reach it,
   and not on top of another icon. If the spot fails, it slides to the nearest
   one that passes.

   What counts as cover depends on who's asking. "nom!" pops and signs never
   do — they're gone in a second. Hints do when YOU drop an icon (don't drop
   it under one), but not when the page checks itself on load: a hint is
   temporary, and letting it push icons out of their column on a first visit
   was how 1280x720 ended up with icons scattered over the page. */
const PASS_ALWAYS = '.pop, .sign';

/* points to test, as offsets inside the icon: a 3x3 grid over the picture
   and three points along the label. Testing only the centres let an icon sit
   half under a tab — reachable, technically, but half its name hidden. */
function probeOf(ico){
  const r = ico.getBoundingClientRect();
  const g = ico.querySelector('.g').getBoundingClientRect();
  const l = ico.querySelector('.l').getBoundingClientRect();
  const pts = [];
  for (const fx of [0.08, 0.5, 0.92]) for (const fy of [0.08, 0.5, 0.92])
    pts.push([g.left - r.left + g.width * fx, g.top - r.top + g.height * fy]);
  const ly = l.top - r.top + l.height / 2;
  pts.push([l.left - r.left + 3, ly], [l.left - r.left + l.width / 2, ly], [l.right - r.left - 3, ly]);
  return pts;
}

/* would the icon be reachable at desk position x,y? Pure arithmetic plus
   elementFromPoint — nothing is moved, so testing thousands of spots costs
   no layout. */
function spotFree(ico, x, y, desk, others, probe, pass){
  const w = ICO_W, h = ico.offsetHeight;
  if (x < 0 || y < 0 || x + w > desk.width || y + h > desk.height) return false;
  const L = desk.left + x, T = desk.top + y;
  if (others.some(o => L < o.right - 6 && L + w > o.left + 6 && T < o.bottom - 6 && T + h > o.top + 6))
    return false;
  return probe.every(([px, py]) => {
    const hit = document.elementFromPoint(L + px, T + py);
    return !hit || hit === document.documentElement || hit === document.body
        || ico.contains(hit) || !!hit.closest(pass);
  });
}

/* move the icon to the nearest reachable spot; true if it had to move.
   strict = a user drop (hints count as cover) */
function settle(ico, strict){
  const deskEl = $('#desk');
  if (!deskEl || narrow() || !ico.isConnected) return false;
  const pass = strict ? PASS_ALWAYS : PASS_ALWAYS + ', .hint';
  const desk = deskEl.getBoundingClientRect();
  const others = $$('.ico', deskEl).filter(o => o !== ico).map(o => o.getBoundingClientRect());
  const probe = probeOf(ico);
  const x0 = parseFloat(ico.style.left), y0 = parseFloat(ico.style.top);
  if (spotFree(ico, x0, y0, desk, others, probe, pass)) return false;
  const S = 12, spots = [];
  for (let y = 0; y + ico.offsetHeight <= desk.height; y += S)
    for (let x = 0; x + ICO_W <= desk.width; x += S)
      spots.push([x, y, (x - x0) ** 2 + (y - y0) ** 2]);
  spots.sort((a, b) => a[2] - b[2]);
  for (const [x, y] of spots){
    if (!spotFree(ico, x, y, desk, others, probe, pass)) continue;
    ico.style.left = x + 'px';
    ico.style.top  = y + 'px';
    return true;
  }
  return false;                           /* nowhere free at all: leave it be */
}

/* Check every icon — on load, after a resize, after a tab switch. These
   nudges are NOT saved: they answer this screen size at this moment, and the
   spot you chose should come back when the screen has room for it again. */
function settleAll(){ $$('#desk .ico').forEach(ico => settle(ico, false)); }

/* The icon being dragged rides above everything — windows, the profile,
   Brick — so you can see where it's going and drop the cheese on him.
   .lift is fixed at the viewport's corner. On a desktop .desk is too, so
   positions carry straight over; on a phone .desk scrolls with the page,
   so they're converted by the difference. */
const lift = el('<div class="lift"></div>');
document.body.append(lift);

function dragIcon(ico, e){
  if (e.button) return;
  if (ico.classList.contains('growing')) return;     /* nothing to pick up yet */
  const desk = ico.parentElement;
  const r = ico.getBoundingClientRect();
  const dx = e.clientX - r.left, dy = e.clientY - r.top;
  const from = { left: ico.style.left, top: ico.style.top };
  let moved = false, x = 0, y = 0, off = { x: 0, y: 0 };
  const move = ev => {
    /* a few px of slop, or every click would count as a drag */
    if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
    const d = desk.getBoundingClientRect();
    if (!moved){
      moved = true;
      ico.classList.add('dragging');
      const l = lift.getBoundingClientRect();
      off = { x: d.left - l.left, y: d.top - l.top };
      lift.append(ico);
    }
    x = Math.min(Math.max(0, ev.clientX - dx - d.left), d.width  - ICO_W);
    y = Math.min(Math.max(0, ev.clientY - dy - d.top),  d.height - ico.offsetHeight);
    ico.style.left = (x + off.x) + 'px';
    ico.style.top  = (y + off.y) + 'px';
  };
  const up = () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    if (!moved) return;
    ico.classList.remove('dragging');
    ico._dragged = true;                  /* swallow the click that follows */
    setTimeout(() => { ico._dragged = false; }, 0);
    /* a drop handler that takes the icon (Brick eating the cheese) sends it
       back where it came from — that's where the next one grows. On a phone
       the cheese has one spot, next to Brick's home, so it always goes back. */
    const taken = ico._drop && ico._drop(ico);
    desk.append(ico);
    if (taken || narrow()){ Object.assign(ico.style, from); return; }
    ico.style.left = x + 'px';
    ico.style.top  = y + 'px';
    settle(ico, true);
    icoPos[ico._key] = { x: parseFloat(ico.style.left), y: parseFloat(ico.style.top) };
    saveIcoPos();
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
}

function makeIcon(desk, { key, slot, svg, label, title, extraClass, open }){
  const ico = el(`<button class="ico ${extraClass || ''}" type="button">
    <span class="g">${svg}</span><span class="l"></span></button>`);
  ico.querySelector('.l').textContent = label;
  ico.title = title;
  ico._key = key;
  const pos = icoPos[key] || defaultIcoPos(slot);
  ico.style.left = pos.x + 'px';
  ico.style.top  = pos.y + 'px';
  ico.addEventListener('pointerdown', ev => dragIcon(ico, ev));
  /* a double-click fires click twice AND dblclick, so every activation
     path has to go through one guard or it fires three times */
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

/* on a phone there's no desktop, so the cheese is the only icon, parked just
   right of Brick's home. .desk scrolls with the page there, so these are
   page coordinates. */
function parkCheese(){
  if (!cheeseIco || !narrow()) return;
  const d = dock.getBoundingClientRect(), k = $('#desk').getBoundingClientRect();
  cheeseIco.style.left = (d.right - k.left + 14) + 'px';
  cheeseIco.style.top  = (d.top - k.top + 24) + 'px';
}

function renderDesk(){
  const desk = $('#desk');
  if (!desk) return;
  desk.innerHTML = '';
  lift.innerHTML = '';                    /* in case a re-render lands mid-drag */
  deskGrid = deskLayout();
  desk.classList.toggle('compact', deskGrid.compact);
  const present = narrow() ? [] : wins();
  /* windows not in LEFT (blog, gallery, about) take the first free slots */
  const taken = new Set([LEFT.indexOf('cheese'), ...present.map(w => LEFT.indexOf(keyOf(w)))]);
  let free = 0;
  present.forEach(w => {
    const name = titleOf(w), key = keyOf(w), shut = !!w.dataset.closed;
    let slot = LEFT.indexOf(key);
    if (slot < 0){ while (taken.has(free)) free++; slot = free++; }
    const ico = makeIcon(desk, {
      key, slot,
      svg: ICONS[iconFor(name)],
      label: name,
      title: (shut ? 'open ' : 'go to ') + name,
      /* an OPEN window's icon is the spent one — the closed ones are what
         you can still act on, so they stay bright */
      extraClass: shut ? '' : 'open',
      open: ico => openWin(w, ico)
    });
    ico._win = w;
  });
  /* not a window: it's food. drag it onto brick. */
  cheeseIco = makeIcon(desk, {
    key: 'cheese', slot: LEFT.indexOf('cheese'), svg: CHEESE_BLOCK, label: 'cheese',
    extraClass: 'block', title: '',
    open: ico => sign(ico, !cheeseReady() ? 'growing back…'
                         : brickCanEat() ? 'drag me onto brick' : 'brick is busy')
  });
  cheeseIco._drop = ico => {
    killHint('brick');
    if (!brickCanEat() || !overlap(ico.querySelector('.g').getBoundingClientRect(),
                                   brick.getBoundingClientRect())) return false;
    eatCheese();
    return true;
  };
  setCheese(cheeseIco);
  parkCheese();
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
    b.onclick = () => isMin ? reopen(w) : winAction(w, 'min');
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

  /* closed AND minimised: on a phone the taskbar has no window buttons, so a
     minimised window would otherwise have no way back */
  const hidden = wins().filter(w => w.classList.contains('min'));
  if (hidden.length){
    items.append(el('<div class="cap">closed &amp; minimised</div>'));
    hidden.forEach(w => add(titleOf(w), () => openWin(w)));
    items.append(el('<hr>'));
  }

  items.append(el('<div class="cap">go to</div>'));
  $$('.tab').forEach(t => add(t.textContent.toLowerCase(), () => go(t.dataset.page)));
  items.append(el('<hr>'));
  add('tidy windows', tidyWindows);
  add('cascade windows', () => cascade(true));
  add('shuffle brick', scatterBrick);
  add('squish brick', squish);

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
/* would hint n, placed at page x,y, sit on a desktop icon? */
const onIcon = (n, x, y) => $$('#desk .ico').some(i => {
  const o = i.getBoundingClientRect(), L = x - scrollX, T = y - scrollY;
  return L < o.right && L + n.offsetWidth > o.left && T < o.bottom && T + n.offsetHeight > o.top;
});
const leftOf = (r, n, dy) => {
  const x = r.left + scrollX - n.offsetWidth - 16, y = r.top + scrollY + dy;
  /* the left is also where the icon column lives, and the icons are there
     for good — so if the hint would cover one, it flips instead */
  return x < scrollX + 8 || onIcon(n, x, y)
    /* flipped: sit low so it lands on body copy rather than the heading */
    ? [r.right + scrollX + 16, r.bottom + scrollY - n.offsetHeight - 2, 'left']
    : [x, y, 'right'];
};
const HINTS = {
  brick: { text: '<b>drag brick</b><br>feed him cheese',
           place: n => leftOf($('#brick').getBoundingClientRect(), n, 92) },
  theme: { text: '<b>4 themes</b><br>pick one',
           place: n => leftOf($('.themes').getBoundingClientRect(), n, -4) }
};
const hintDone = k => store.get('hint-' + k);
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
  store.set('hint-' + k, '1');
}

function showHints(){
  if (narrow()) return;                   /* no room, and no hover to explain */
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
  if (e.target.closest('#brick, .ico.block')) killHint('brick');
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

/* the cheese isn't a window, so it gets its own menu — which is also a way to
   feed Brick without dragging, for anyone on a trackpad */
const cheeseItems = () => [
  { label: !cheeseReady() ? 'growing back…' : brickCanEat() ? 'feed to brick' : 'brick is busy',
    run: () => { eatCheese(); killHint('brick'); } },
  '-',
  ...deskItems()
];

const deskItems = () => {
  const shut = wins().filter(w => w.dataset.closed);
  return [
    { label: 'tidy windows', run: tidyWindows },
    { label: 'cascade windows', run: () => cascade(true) },
    shut.length && { label: `open all (${shut.length})`, run: () => shut.forEach(reopen) },
    { label: 'shuffle brick', run: scatterBrick },
    { label: 'squish brick', run: squish },
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
  /* .wrap only: the squish pop-up has a title bar too, but it isn't a
     managed window and minimise/maximise did odd things to it */
  const hd  = e.target.closest('.wrap .show > .hd');
  e.preventDefault();
  closeStart();
  if (ico && ico._win) showCtx(e.clientX, e.clientY, windowItems(ico._win));
  else if (ico)        showCtx(e.clientX, e.clientY, cheeseItems());
  else if (hd)         showCtx(e.clientX, e.clientY, windowItems(hd.parentElement));
  else                 showCtx(e.clientX, e.clientY, deskItems());
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
  home:    '<button class="tool" id="shuffle">shuffle brick</button>'
         + '<button class="tool" id="squish">squish brick</button>',
  about:   `<a class="tool" href="${esc(D.profile.resume)}">resume</a>`
};
function go(id){
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.page === id));
  $$('.page').forEach(p => p.classList.toggle('on', p.id === id));
  $('#ctx').innerHTML = ctxTools[id] || '';
  const sh = $('#shuffle'); if (sh) sh.onclick = scatterBrick;
  const sq = $('#squish');  if (sq) sq.onclick = squish;
  if (docked) setTimeout(redock, 30);
  mountWindows();          /* idempotent; this tab may never have been shown */
  renderTaskbar();
  setTimeout(settleAll, 60);
}
$$('.tab').forEach(t => t.onclick = () => go(t.dataset.page));

/* Only the windows that matter are open on arrival; the rest wait behind their
   desktop icons. With all seven open, every icon was already "open", so a
   double-click did nothing visible and people decided the icons were dead.
   Phones have no desktop icons, so there everything stays open. */
const START_OPEN = ['project showcase', 'writing showcase', 'elsewhere'];
if (!narrow()) $$('#home .show').forEach(w => {
  if (START_OPEN.includes(titleOf(w))) return;
  w.dataset.closed = '1';
  w.classList.add('min');
});
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
showHints();
addEventListener('load', () => { redock(); parkCheese(); placeHints(); settleAll(); });
/* default icon spots depend on the screen, and crossing the phone breakpoint
   swaps the whole desktop for a single cheese — so rebuild, then re-check */
let settleT;
addEventListener('resize', () => {
  clearTimeout(settleT);
  settleT = setTimeout(() => { renderDesk(); placeHints(); settleAll(); }, 200);
});
})();
