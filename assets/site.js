// Hakomi Education Center prototype. No dependencies.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

/* ---------- header and footer ----------
   ponytail: injected by JS so six static pages share one copy. Move to a real
   template (11ty, Astro, the CMS) when this stops being a prototype. */
const page = location.pathname.split('/').pop() || 'index.html';
const here = page === 'team.html' ? 'about.html' : page; // team lives under About in the nav
const NAV = [
  ['method.html', 'The Method'],
  ['about.html', 'About'],
  ['trainings.html', 'Trainings & Workshops'],
  ['faq.html', 'FAQ'],
];
const links = NAV.map(([href, label]) =>
  `<a href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`).join('');

document.body.insertAdjacentHTML('afterbegin', `
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-head">
    <a class="brand" href="index.html">Hakomi Education Center</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="site-nav" id="nav" aria-label="Main">
      ${links}
      <a class="btn" href="contact.html">Contact</a>
      <span class="lang"><b>EN</b><a href="https://www.hakomieducationcenter.com/?lang=es" lang="es">Español</a></span>
    </nav>
  </header>`);

document.body.insertAdjacentHTML('beforeend', `
  <footer class="site-foot">
    <div class="wrap">
      <div>
        <div class="mark">Hakomi Education Center</div>
        <p>A learning and practice community for the Hakomi Method and its roots in the Feldenkrais Method.</p>
      </div>
      <ul>
        ${NAV.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}
        <li><a href="contact.html">Contact</a></li>
      </ul>
      <ul>
        <li><a href="mailto:info@hakomicascadia.com">info@hakomicascadia.com</a></li>
        <li><a href="https://www.hakomieducation.net/">Hakomi Education Network</a></li>
        <li><a href="https://www.hakomieducationcenter.com/newsletter">Blog</a></li>
        <li><a href="https://www.facebook.com/hakomicascadia/">Facebook</a></li>
      </ul>
      <p class="fine">Hakomi Education Center, Cantabria, Spain. Home of Eco Somatika Somatic Education Center.<br>
        Design preview, not the live site. Forms here do not send. The current site is <a href="https://www.hakomieducationcenter.com/">hakomieducationcenter.com</a>.</p>
    </div>
  </footer>`);

const head = $('.site-head');
const menuBtn = $('.menu-btn');
menuBtn.addEventListener('click', () => {
  const open = head.toggleAttribute('data-open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.textContent = open ? 'Close' : 'Menu';
});
const onScroll = () => head.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- hero: breathing aperture that opens on scroll ---------- */
const hero = $('.hero');
if (hero && !calm) {
  const stage = $('.hero-stage', hero);
  const copy = $('.hero-copy', hero);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible) return;
    const w = innerWidth, h = innerHeight, narrow = w < 832;
    const p = clamp(scrollY / (hero.offsetHeight - h));
    const open = smooth(0.05, 0.8, p);
    // one breath is about 11 seconds, a resting pace
    const breath = Math.sin((now / 11000) * Math.PI * 2) * 0.04 * (1 - open);
    let r0 = Math.min(w * 0.2, h * 0.36), cx0 = w * 0.74, cy0 = h * 0.52;
    if (narrow) { // on phones the circle sits in whatever room is left under the copy
      const bottom = copy.offsetTop + copy.offsetHeight;
      r0 = Math.max(56, Math.min(w * 0.36, (h - bottom - 44) / 2));
      cx0 = w / 2; cy0 = bottom + 22 + r0;
    }
    const r = lerp(r0, Math.hypot(w, h), open * open) * (1 + breath);
    stage.style.setProperty('--r', r.toFixed(1) + 'px');
    stage.style.setProperty('--cx', lerp(cx0, w / 2, open).toFixed(1) + 'px');
    stage.style.setProperty('--cy', lerp(cy0, h / 2, open).toFixed(1) + 'px');
    stage.style.setProperty('--fade', 1 - smooth(0.02, 0.3, p));
    copy.style.pointerEvents = p > 0.2 ? 'none' : ''; // faded-out buttons must not take clicks
    stage.style.setProperty('--lift', p * 80 + 'px');
    stage.style.setProperty('--shade', smooth(0.55, 0.85, p));
    stage.style.setProperty('--after', smooth(0.62, 0.9, p));
  };
  requestAnimationFrame(frame);
}

/* ---------- quotes arrive word by word, like an exhale ---------- */
if (!calm) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.45 });
  $$('.quote').forEach((q) => {
    let i = 0;
    $$('p', q).forEach((p) => {
      p.innerHTML = p.textContent.trim().split(/\s+/)
        .map((w) => `<span class="w" style="--i:${i++}">${w}</span>`).join(' ');
    });
    q.classList.add('split');
    io.observe(q);
  });
}

/* ---------- water: a small WebGL surface that ripples under the pointer ---------- */
const FRAG = `
precision mediump float;
uniform vec2 u_res; uniform float u_t; uniform vec2 u_m; uniform float u_mt;
uniform vec3 u_a; uniform vec3 u_b;
void main() {
  vec2 p = gl_FragCoord.xy / u_res; float asp = u_res.x / u_res.y; p.x *= asp;
  float t = u_t * 0.1; vec2 q = p * 2.6; float hgt = 0.0;
  for (int i = 0; i < 4; i++) {
    float f = float(i);
    q += vec2(sin(q.y * 1.3 + t + f), cos(q.x * 1.1 - t * 1.2 + f * 1.7)) * 0.38;
    hgt += sin(q.x + q.y * 0.6 + t * 2.0) * 0.25;
  }
  vec2 m = u_m; m.x *= asp; float d = distance(p, m); float age = u_t - u_mt;
  hgt += sin(d * 34.0 - age * 5.0) * exp(-d * 5.0) * exp(-age * 0.9) * 0.7;
  float light = smoothstep(0.15, 0.9, hgt * 0.5 + 0.5);
  vec3 c = mix(u_b, u_a, light) + pow(light, 7.0) * 0.05;
  gl_FragColor = vec4(c, 1.0);
}`;
const TONES = {
  ice: [[0.922, 0.976, 0.98], [0.79, 0.905, 0.915]],
  deep: [[0.085, 0.25, 0.275], [0.045, 0.16, 0.18]],
};

function water(el) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) return; // the CSS background colour is the fallback
  el.prepend(canvas);

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.bindAttribLocation(prog, 0, 'a');
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const [a, b] = TONES[el.dataset.water] || TONES.ice;
  gl.uniform3fv(u('u_a'), a);
  gl.uniform3fv(u('u_b'), b);

  let mouse = [0.5, 0.5], mouseAt = -10, on = false;
  const size = () => {
    // soft image, so half resolution is plenty
    canvas.width = Math.max(2, el.clientWidth * 0.5);
    canvas.height = Math.max(2, el.clientHeight * 0.5);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u('u_res'), canvas.width, canvas.height);
  };
  const draw = (now) => {
    const t = now / 1000;
    gl.uniform1f(u('u_t'), t);
    gl.uniform2fv(u('u_m'), mouse);
    gl.uniform1f(u('u_mt'), mouseAt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (on && !calm) requestAnimationFrame(draw);
  };
  new ResizeObserver(() => { size(); if (!on || calm) draw(performance.now()); }).observe(el);
  new IntersectionObserver(([e]) => {
    const was = on; on = e.isIntersecting;
    if (on && !was && !calm) requestAnimationFrame(draw);
  }).observe(el);
  let last = 0;
  el.addEventListener('pointermove', (e) => {
    if (e.timeStamp - last < 450) return; // one ripple at a time, not a wake
    last = e.timeStamp;
    const r = el.getBoundingClientRect();
    mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    mouseAt = performance.now() / 1000;
  });
}
$$('[data-water]').forEach(water);

/* ---------- gatherings: computed from the real recurring groups ---------- */
const GROUPS = [
  { name: 'Hakomi Breakfast Club', time: '8–9am Central European Time', on: (d) => d.getDay() === 1 },
  { name: 'Hakomi Weekend Reset', time: '8–9:30pm Central European Time', on: (d) => d.getDay() === 5 && d.getDate() > 7 && d.getDate() < 15 },
];
function sessions(year, month) {
  const out = [];
  for (const d = new Date(year, month, 1); d.getMonth() === ((month % 12) + 12) % 12; d.setDate(d.getDate() + 1)) {
    GROUPS.forEach((g) => g.on(d) && out.push({ ...g, date: new Date(d) }));
  }
  return out;
}
// self-check: November 2026 has Mondays on 2, 9, 16, 23, 30 and its second Friday on the 13th
console.assert(sessions(2026, 10).map((s) => s.date.getDate()).join() === '2,9,13,16,23,30', 'sessions() is wrong');

const dateItem = (s) => `
  <li>
    <div class="day">${s.date.getDate()}<small>${s.date.toLocaleDateString('en-GB', { weekday: 'short' })}, ${s.date.toLocaleDateString('en-GB', { month: 'short' })}</small></div>
    <div><strong>${s.name}</strong><span>${s.time}</span></div>
  </li>`;
const today = new Date(); today.setHours(0, 0, 0, 0);

const next = $('[data-next]');
if (next) {
  const y = today.getFullYear(), m = today.getMonth();
  next.innerHTML = [...sessions(y, m), ...sessions(y, m + 1)]
    .filter((s) => s.date >= today).slice(0, +next.dataset.next).map(dateItem).join('');
}

const cal = $('[data-cal]');
if (cal) {
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  const render = () => {
    const y = view.getFullYear(), m = view.getMonth();
    const list = sessions(y, m);
    const busy = new Set(list.map((s) => s.date.getDate()));
    const offset = (view.getDay() + 6) % 7; // weeks start on Monday
    const days = new Date(y, m + 1, 0).getDate();
    let cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<b>${d}</b>`).join('') + '<i></i>'.repeat(offset);
    for (let d = 1; d <= days; d++) {
      const cls = [busy.has(d) && 'has', +new Date(y, m, d) === +today && 'today'].filter(Boolean).join(' ');
      cells += `<span class="${cls}">${d}</span>`;
    }
    $('.cal', cal).innerHTML = cells;
    $('[data-month]', cal).textContent = view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    $('[data-list]', cal).innerHTML = list.map(dateItem).join('');
  };
  $$('[data-step]', cal).forEach((b) => b.addEventListener('click', () => {
    view = +b.dataset.step ? new Date(view.getFullYear(), view.getMonth() + +b.dataset.step, 1) : new Date(today.getFullYear(), today.getMonth(), 1);
    render();
  }));
  render();
}

/* ---------- dialogs and demo forms ---------- */
$$('[data-dialog]').forEach((b) => b.addEventListener('click', () => $('#' + b.dataset.dialog).showModal()));
$$('form[data-demo]').forEach((f) => f.addEventListener('submit', (e) => {
  e.preventDefault(); // prototype: nothing is sent anywhere
  const done = f.nextElementSibling;
  f.hidden = true; done.hidden = false;
  done.setAttribute('tabindex', '-1'); done.focus();
}));
