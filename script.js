// Prompt Forge 2.0 — генератор промтов для Stable Diffusion
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const K = { favs: 'prompt_forge_favs', ui: 'pf2_ui', theme: 'prompt_forge_theme' };

// ---------- Данные ----------
const STYLES = {
  photorealistic: ['Фотореализм', 'photorealistic, ultra detailed, natural textures, 85mm lens'],
  cinematic: ['Кинематограф', 'cinematic still, dramatic lighting, film grain, anamorphic lens'],
  anime: ['Аниме', 'anime style, vibrant colors, clean line art'],
  cyberpunk: ['Киберпанк', 'cyberpunk, neon lights, rain-soaked streets, holographic signs'],
  fantasy: ['Фэнтези', 'fantasy art, magical atmosphere, ethereal lighting, intricate details'],
  oil: ['Масляная живопись', 'oil painting, thick brushstrokes, canvas texture, rich pigments'],
  watercolor: ['Акварель', 'watercolor painting, soft washes, paper texture'],
  render3d: ['3D-рендер', '3d render, octane render, subsurface scattering, soft studio light']
};
// [название, размер для SD 1.5, размер для SDXL]
const RATIOS = {
  '1:1': ['1:1 — квадрат', '512×512', '1024×1024'],
  '16:9': ['16:9 — широкий', '768×432', '1344×768'],
  '9:16': ['9:16 — вертикальный', '432×768', '768×1344'],
  '4:3': ['4:3 — классика', '640×480', '1152×864']
};
const MODS = [
  ['Мягкий свет', 'soft lighting'], ['Золотой час', 'golden hour'], ['Неон', 'neon glow'],
  ['Туман', 'volumetric fog'], ['Боке', 'shallow depth of field, bokeh'], ['Макро', 'macro shot'],
  ['Вид сверху', 'top-down view'], ['Широкий угол', 'wide angle shot']
];
const EXAMPLES = [
  ['Киберпанк-кот', 'a cyberpunk cat on a rainy neon street'],
  ['Грибной лес', 'glowing mushroom forest with drifting mist'],
  ['Космонавт на Марсе', 'an astronaut walking on Mars at sunset'],
  ['Домик в горах', 'a cozy cabin in snowy mountains at night']
];
const SUBJ = ['a lone astronaut', 'an ancient dragon', 'a samurai', 'a fox spirit', 'a steampunk inventor', 'a giant whale', 'a wandering robot'];
const PLACE = ['in a glowing mushroom forest', 'on a neon rooftop at night', 'above Victorian London', 'in an underwater library', 'on a frozen alien planet', 'in a misty mountain valley'];
const NEG = {
  sdxl: 'blurry, low quality, deformed, watermark, text',
  sd15: 'lowres, bad anatomy, extra fingers, blurry, watermark, text, jpeg artifacts'
};

// Рекомендуемые параметры генерации
const PARAMS = {
  sdxl: { steps: 30, cfg: 6, sampler: 'DPM++ 2M Karras' },
  sd15: { steps: 25, cfg: 7, sampler: 'DPM++ 2M Karras' }
};

// ---------- Утилиты ----------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = a => a[Math.floor(Math.random() * a.length)];
const newSeed = () => Math.floor(Math.random() * 4294967296);
let seed = newSeed();
const replay = (el, c) => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); };

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Скопировано');
  } catch (e) {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    toast(ok ? 'Скопировано' : 'Не удалось скопировать — выделите текст вручную');
  }
}

// ---------- Сборка промта ----------
const form = () => ({
  idea: $('#idea').value.trim(),
  style: $('#style').value,
  ratio: $('#ratio').value,
  model: $('#model').value,
  neg: $('#neg').value.trim(),
  seed,
  mods: [...$$('#mods [aria-pressed="true"]')].map(b => +b.dataset.i)
});

function build(f) {
  const xl = f.model === 'sdxl';
  const quality = xl ? 'best quality, sharp focus, high detail' : 'masterpiece, best quality, highly detailed';
  const pos = [f.idea, STYLES[f.style][1], ...f.mods.map(i => MODS[i][1]), quality].join(', ');
  return { pos, neg: f.neg || NEG[f.model], res: RATIOS[f.ratio][xl ? 2 : 1], seed: f.seed, params: PARAMS[f.model] };
}

// Формат Automatic1111: вставьте в поле промта и нажмите ↙ «Прочитать параметры»
const a1111 = c => `${c.pos}\nNegative prompt: ${c.neg}\nSteps: ${c.params.steps}, Sampler: ${c.params.sampler}, CFG scale: ${c.params.cfg}, Seed: ${c.seed}, Size: ${c.res.replace('×', 'x')}`;

let cur = null; // текущий результат или null, если идея пуста

function render() {
  const f = form();
  cur = f.idea ? { ...build(f), snap: f } : null;
  $('#pos').textContent = cur ? cur.pos : 'Введите идею или нажмите «Случайный промт»';
  $('#neg-out').textContent = cur ? cur.neg : '—';
  $('#res').innerHTML = cur ? `<span>${f.model === 'sdxl' ? 'SDXL' : 'SD 1.5'}</span><span>Размер <b>${cur.res}</b></span><span>Steps <b>${cur.params.steps}</b></span><span>CFG <b>${cur.params.cfg}</b></span><span><b>${cur.params.sampler}</b></span><span>Seed <b>${cur.seed}</b></span>` : '';
  $('#hint').hidden = !/[а-яё]/i.test(f.idea);
  $$('[data-needs]').forEach(b => { b.disabled = !cur; });
  syncStar();
  syncFab();
  save(K.ui, f);
}

function apply(f) {
  seed = Number.isInteger(f.seed) ? f.seed : newSeed();
  $('#idea').value = f.idea;
  $('#style').value = f.style;
  $('#ratio').value = f.ratio;
  $('#model').value = f.model;
  $('#neg').value = f.neg;
  $$('#mods .chip').forEach(b => b.setAttribute('aria-pressed', f.mods.includes(+b.dataset.i)));
  render();
  replay($('#pos'), 'flash');
  replay($('#neg-out'), 'flash');
}

// ---------- Избранное ----------
const stored = load(K.favs, []);
// Записи из версии 1.0 хранили только текст — приводим к новому формату
let favs = (Array.isArray(stored) ? stored : []).map(f => f.pos ? f : { id: f.id, pos: f.text || '', neg: '', res: '', snap: null });

const favIdx = () => cur ? favs.findIndex(f => f.pos === cur.pos && f.neg === cur.neg) : -1;

function syncStar() {
  const on = favIdx() > -1;
  const s = $('#star');
  s.textContent = on ? '★' : '☆';
  s.classList.toggle('on', on);
  s.title = on ? 'Убрать из избранного' : 'В избранное';
}

function saveFavs() {
  save(K.favs, favs);
  renderFavs();
  syncStar();
}

function toggleFav() {
  if (!cur) return;
  const i = favIdx();
  if (i > -1) favs.splice(i, 1);
  else favs.unshift({ id: Date.now(), pos: cur.pos, neg: cur.neg, res: cur.res, snap: cur.snap });
  saveFavs();
  if (i < 0) replay($('#star'), 'pop');
  toast(i > -1 ? 'Убрано из избранного' : 'Сохранено в избранное');
}

function renderFavs() {
  $('#favcount').textContent = favs.length;
  $('#favlist').innerHTML = favs.length ? favs.map(f => `
    <article class="fav">
      <div class="fav-top">
        <span class="tag">${esc((STYLES[f.snap && f.snap.style] || ['Stable Diffusion'])[0])}</span>
        <time>${new Date(f.id).toLocaleString('ru-RU')}</time>
      </div>
      <p>${esc(f.pos)}</p>
      ${f.neg ? `<p class="neg">Negative: ${esc(f.neg)}</p>` : ''}
      <div class="fav-actions">
        <button class="btn sm" data-act="use" data-id="${f.id}">Открыть</button>
        <button class="btn sm" data-act="copy" data-id="${f.id}">Копировать</button>
        <button class="btn sm danger" data-act="del" data-id="${f.id}">Удалить</button>
      </div>
    </article>`).join('') : '<p class="empty">Пока пусто. Нажмите ☆ у готового промта в генераторе.</p>';
  moveInk();
}

$('#favlist').addEventListener('click', e => {
  const b = e.target.closest('button');
  const f = b && favs.find(x => x.id === +b.dataset.id);
  if (!f) return;
  if (b.dataset.act === 'del') {
    b.closest('.fav').classList.add('out');
    setTimeout(() => { favs = favs.filter(x => x !== f); saveFavs(); }, 220);
  }
  else if (b.dataset.act === 'copy') copy(f.pos);
  else {
    if (f.snap) apply(f.snap);
    else { $('#idea').value = f.pos; render(); }
    tab('gen');
  }
});

$('#clear').addEventListener('click', () => {
  if (favs.length && confirm('Удалить всё избранное?')) { favs = []; saveFavs(); }
});

// ---------- Вкладки и тема ----------
let tabIdx = 0;
function tab(id) {
  const btns = [...$$('.tab')];
  const next = btns.findIndex(b => b.dataset.tab === id);
  const dir = Math.sign(next - tabIdx);
  btns.forEach((b, i) => {
    b.classList.toggle('active', i === next);
    b.setAttribute('aria-selected', i === next);
  });
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === id));
  if (next !== tabIdx) {
    const p = $('#' + id);
    p.style.setProperty('--dx', `${dir * 28}px`);
    replay(p, 'enter');
    tabIdx = next;
  }
  moveInk();
  syncFab();
}
function moveInk() {
  const b = $('.tab.active'), ink = $('.ink');
  ink.style.width = b.offsetWidth + 'px';
  ink.style.transform = `translateX(${b.offsetLeft}px)`;
}
// Плавающая кнопка копирования для телефона (в CSS показывается только на узких экранах)
function syncFab() { $('#fab').hidden = !cur || !$('#gen').classList.contains('active'); }
$$('.tab').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));

const themeIcon = () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('#theme').textContent = dark ? '🌙' : '☀️';
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = dark ? '#0a0a0f' : '#f5f3ff';
};
$('#theme').addEventListener('click', () => {
  const root = document.documentElement;
  root.classList.add('theme-anim');
  setTimeout(() => root.classList.remove('theme-anim'), 450);
  replay($('#theme'), 'spin');
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(K.theme, t); } catch (e) {}
  themeIcon();
});

// ---------- Инициализация ----------
$('#style').innerHTML = Object.entries(STYLES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
$('#ratio').innerHTML = Object.entries(RATIOS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
$('#mods').innerHTML = MODS.map((m, i) => `<button type="button" class="chip" data-i="${i}" aria-pressed="false">${m[0]}</button>`).join('');
$('#examples').innerHTML = EXAMPLES.map(([l, v]) => `<button type="button" class="chip" data-v="${esc(v)}">${l}</button>`).join('');

['#idea', '#neg'].forEach(s => $(s).addEventListener('input', render));
['#style', '#ratio', '#model'].forEach(s => $(s).addEventListener('change', render));

$('#mods').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
  render();
});
$('#examples').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  $('#idea').value = b.dataset.v;
  render();
  replay($('#pos'), 'flash');
});

$('#rand').addEventListener('click', () => {
  const mods = MODS.map((_, i) => i).sort(() => Math.random() - .5).slice(0, 2);
  apply({ ...form(), seed: newSeed(), idea: `${pick(SUBJ)} ${pick(PLACE)}`, style: pick(Object.keys(STYLES)), mods });
});

$('#copy-pos').addEventListener('click', () => cur && copy(cur.pos));
$('#copy-neg').addEventListener('click', () => cur && copy(cur.neg));
$('#star').addEventListener('click', toggleFav);

$('#export').addEventListener('click', () => {
  if (!cur) return;
  const text = a1111(cur);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = `prompt_${Date.now()}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#translate').addEventListener('click', () => {
  copy(`Переведи на английский и оформи как промт для Stable Diffusion (только текст, через запятую): ${$('#idea').value.trim()}`);
  window.open('https://duck.ai/', '_blank', 'noopener');
});

$('#copy-all').addEventListener('click', () => cur && copy(a1111(cur)));
$('#fab').addEventListener('click', () => cur && copy(cur.pos));
$('#seed-btn').addEventListener('click', () => { seed = newSeed(); render(); });
if (navigator.share) $('#share').hidden = false;
$('#share').addEventListener('click', () => cur && navigator.share({ title: 'Prompt Forge', text: a1111(cur) }).catch(() => {}));

// Восстанавливаем последние настройки (с проверкой, что данные не повреждены)
const last = load(K.ui, null);
const valid = last && STYLES[last.style] && RATIOS[last.ratio] && NEG[last.model] && Array.isArray(last.mods);
themeIcon();
renderFavs();
if (valid) apply(last); else render();
moveInk();
addEventListener('resize', moveInk);
if (document.fonts) document.fonts.ready.then(moveInk);
setTimeout(() => document.documentElement.classList.remove('boot'), 1500);

// PWA: serviceWorker для офлайн-режима (работает на https:// и localhost)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

