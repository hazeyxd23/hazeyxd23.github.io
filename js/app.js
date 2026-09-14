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

/* ---------------- theme ---------------- */
const root = document.documentElement;
try { const saved = localStorage.getItem('theme'); if (saved) root.dataset.theme = saved; } catch {}
$$('.sw').forEach(b => {
  b.classList.toggle('on', b.dataset.t === root.dataset.theme);
  b.onclick = () => {
    root.dataset.theme = b.dataset.t;
    try { localStorage.setItem('theme', b.dataset.t); } catch {}
    $$('.sw').forEach(x => x.classList.toggle('on', x === b));
  };
});

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
    <article class="pol" data-i="${i}">
      <div class="shot" ${shot(p)}></div>
      <div class="cap">${esc(p.title)}</div>
      <div class="meta">${esc(p.meta||'')}</div>
      ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
    </article>`));
});

/* three layouts: stacked / fanned (hover) / spread (click) */
let spread = false;
function layout(mode){
  const pol = $$('.pol', stack), n = pol.length;
  const small = innerWidth < 860;
  const cardW = small ? 196 : 268;
  const cardH = small ? 250 : 330;
  const step  = small ? 34 : 48;
  const fan   = small ? 62 : 92;
  const cols  = small ? 1 : 2;
  const gapX  = small ? 0 : cardW + 46;
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
stack.addEventListener('click', () => { spread = !spread; layout(spread ? 'spread' : 'stacked'); });
addEventListener('resize', () => layout(spread ? 'spread' : 'stacked'));

/* latest posts (home) + full list (blog) */
const postRow = p => `<div class="row"><a href="${esc(p.url)}">${esc(p.title)}</a><span class="date">${esc(p.date)}</span></div>`;
$('#latest').innerHTML = D.posts.slice(0, 4).map(postRow).join('');
$('#latestCount').textContent = `4 of ${D.posts.length}`;

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
  brick.style.top  = (r.top + scrollY + r.height - brick.offsetHeight - 4) + 'px';
  dock.classList.remove('empty');
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
const CHEESE = `<svg viewBox="0 0 40 34" xmlns="http://www.w3.org/2000/svg">
<path d="M2 12 L34 2 L38 26 L6 32 Z" fill="#f7e08c" stroke="#2b1140" stroke-width="2.5" stroke-linejoin="round"/>
<circle cx="14" cy="18" r="3.2" fill="#d9a92f"/><circle cx="27" cy="13" r="2.4" fill="#d9a92f"/>
<circle cx="24" cy="25" r="2.8" fill="#d9a92f"/></svg>`;
[[6,26],[90,44],[11,74],[82,82],[47,95]].forEach(([xp, yp]) => {
  const c = el(`<div class="cheese">${CHEESE}</div>`);
  c.style.left = `calc(${xp}vw - 17px)`;
  c.style.top  = (440 + yp * 7) + 'px';
  document.body.append(c);
  draggable(c, { onDrop(){ tryFeed(c); } });
});
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

/* ---------------- chips + tabs ---------------- */
document.addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  $$('.chip', c.parentElement).forEach(x => x.classList.toggle('on', x === c));
  const group = c.parentElement.id;
  if (group === 'blogChips')    renderPosts(c.dataset.tag);
  if (group === 'galleryChips') renderGallery(c.dataset.view);
  if (group === 'aboutChips')   renderAbout(c.dataset.view);
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
}
$$('.tab').forEach(t => t.onclick = () => go(t.dataset.page));
go('home');

/* ---------------- toolbar ---------------- */
$('#nowPlaying').textContent = D.toolbar.nowPlaying;
$('#visits').textContent     = D.toolbar.visits;
function tick(){
  $('#clock').textContent = new Date().toLocaleTimeString('en-GB',
    { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit' }) + ' IST';
}
tick(); setInterval(tick, 20000);
redock();
})();
