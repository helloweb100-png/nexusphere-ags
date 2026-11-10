/* =====================================================================
   NEXUSPHERE AGS · Conectando el futuro
   JavaScript sin dependencias. Todo lo visual tiene respaldo: si algo
   falla, el contenido se ve completo y estático.
   ===================================================================== */
'use strict';

/* ---------- CONFIGURACIÓN (único lugar donde vive el número) ---------- */
// WhatsApp en formato internacional: 52 + 10 dígitos. Si queda vacío (''), los botones y el envío de WhatsApp se ocultan.
const WHATSAPP_NUMERO = '524491808922';
// false = oculta la sección, el aviso y los enlaces del Buen Fin cuando termine la campaña.
const PROMO_BUEN_FIN = true;
const NEGOCIO = 'Nexusphere AGS';

(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = window.matchMedia('(max-width: 759px)').matches;

  /* ================= WhatsApp y promoción ================= */
  const waUrl = (texto) => 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(texto);
  if (!WHATSAPP_NUMERO) {
    root.classList.add('no-wa');
  } else {
    $$('[data-wa]').forEach((a) => {
      a.href = waUrl(a.dataset.waText || 'Hola ' + NEGOCIO + ', quiero más información.');
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }
  if (!PROMO_BUEN_FIN) root.classList.add('promo-off');

  /* ================= Cargador (máx. ~2 s, con respaldo en CSS) ================= */
  const loader = $('#loader');
  const pct = $('#loader-pct');
  const LOADER_MS = reduce ? 350 : 1500;
  const t0 = performance.now();
  function tickPct(now) {
    const p = clamp((now - t0) / (LOADER_MS - 100), 0, 1);
    if (pct) pct.textContent = Math.round(1 - Math.pow(1 - p, 3) === 1 ? 100 : (1 - Math.pow(1 - p, 3)) * 100);
    if (p < 1) requestAnimationFrame(tickPct);
  }
  requestAnimationFrame(tickPct);
  setTimeout(() => {
    if (!loader) return;
    if (pct) pct.textContent = '100';
    loader.classList.add('is-done');
    setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
  }, LOADER_MS);

  /* ================= Menú móvil ================= */
  const header = $('.site-header');
  const burger = $('#burger');
  const menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    root.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ================= Revelado al hacer scroll (con respaldo por geometría) ================= */
  const rvEls = $$('.rv');
  const reveal = (el) => el.classList.add('in');
  let rvObserver = null;
  if ('IntersectionObserver' in window) {
    rvObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { reveal(en.target); rvObserver.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rvEls.forEach((el) => rvObserver.observe(el));
  } else {
    rvEls.forEach(reveal);
  }
  function sweepReveal() {
    const vh = window.innerHeight;
    for (let i = 0; i < rvEls.length; i++) {
      const el = rvEls[i];
      if (el.classList.contains('in')) continue;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.97 && r.bottom > 0) {
        reveal(el);
        if (rvObserver) rvObserver.unobserve(el);
      }
    }
  }

  /* ================= Manifiesto: las palabras se encienden con el scroll ================= */
  const manifestEl = $('#manifest-text');
  const words = [];
  function wrapWords(node, key) {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w' + (key ? ' key' : '');
          s.textContent = t;
          frag.appendChild(s);
          words.push(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        wrapWords(n, key || n.tagName === 'MARK');
      }
    });
  }
  if (manifestEl) wrapWords(manifestEl, false);
  let litCount = -1;
  function manifestUpdate(vh) {
    if (!manifestEl || !words.length) return;
    const r = manifestEl.getBoundingClientRect();
    const p = reduce ? 1 : clamp((vh * 0.85 - r.top) / (vh * 0.3 + r.height), 0, 1);
    const n = Math.round(p * words.length);
    if (n === litCount) return;
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    litCount = n;
  }

  /* ================= Portal: la imagen se abre con el scroll ================= */
  const portalTrack = $('#portal-track');
  let lastP = -1;
  function portalUpdate(vh) {
    if (!portalTrack) return;
    const r = portalTrack.getBoundingClientRect();
    const total = Math.max(1, r.height - vh);
    const raw = clamp(-r.top / total, 0, 1);
    const p = reduce ? 1 : smooth(clamp(raw / 0.7, 0, 1));
    if (Math.abs(p - lastP) > 0.001) {
      portalTrack.style.setProperty('--p', p.toFixed(4));
      lastP = p;
    }
  }

  /* ================= Parallax suave de fotos ================= */
  const parallaxImgs = $$('[data-parallax]');
  function parallaxUpdate(vh) {
    if (reduce) return;
    parallaxImgs.forEach((img) => {
      const host = img.parentElement;
      const r = host.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      const c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      img.style.setProperty('--py', (c * -18).toFixed(1) + 'px');
    });
  }

  /* ================= Tarjetas apiladas: la anterior se hunde al llegar la siguiente ================= */
  const cards = $$('.stack__card');
  const mqStack = window.matchMedia('(min-width: 900px)');
  let stickTops = [];
  function measureStack() {
    stickTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
  }
  function stackUpdate() {
    if (!mqStack.matches || reduce) {
      cards.forEach((c) => c.style.removeProperty('--sc'));
      return;
    }
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const rn = next.getBoundingClientRect();
      const rc = c.getBoundingClientRect();
      const dist = rn.top - (stickTops[i + 1] || 0);
      const p = clamp(1 - dist / (rc.height * 0.9), 0, 1);
      c.style.setProperty('--sc', (1 - p * 0.05).toFixed(4));
    });
  }

  /* ================= Proceso: la línea se dibuja y los nodos se encienden ================= */
  const stepsEl = $('#steps');
  const stepEls = $$('.step');
  function stepsUpdate(vh) {
    if (!stepsEl) return;
    const r = stepsEl.getBoundingClientRect();
    const p = reduce ? 1 : clamp((vh * 0.74 - r.top) / Math.max(1, r.height), 0, 1);
    stepsEl.style.setProperty('--prog', p.toFixed(3));
    stepEls.forEach((s, i) => s.classList.toggle('on', p >= (i + 0.1) / stepEls.length));
  }

  /* ================= Navegación: enlace activo ================= */
  const navLinks = $$('.nav a');
  const navSections = navLinks.map((a) => document.getElementById((a.getAttribute('href') || '').slice(1)));
  function navUpdate(vh) {
    let current = -1;
    navSections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top < vh * 0.4) current = i;
    });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === current));
  }

  /* ================= Bucle de scroll (una sola vez por cuadro) ================= */
  let ticking = false;
  let lastY = window.scrollY;
  let scrollBoost = 0;
  const bar = $('#progress-bar');
  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    scrollBoost = clamp(scrollBoost + Math.abs(y - lastY) * 0.0006, 0, 0.03);
    lastY = y;
    if (header) header.classList.toggle('is-scrolled', y > 20);
    if (bar) {
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
    manifestUpdate(vh);
    portalUpdate(vh);
    parallaxUpdate(vh);
    stackUpdate();
    stepsUpdate(vh);
    navUpdate(vh);
    sweepReveal();
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measureStack(); onScroll(); });
  measureStack();
  update();
  window.addEventListener('load', () => { measureStack(); update(); });
  setTimeout(() => { measureStack(); update(); }, 2000); // respaldo: revela lo que ya esté a la vista
  setTimeout(update, 4500);

  /* ================= Esfera de red 3D (canvas): hero y cierre ================= */
  const pointer = { x: 0, y: 0, on: false };
  window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; }, { passive: true });

  function glowSprite(core, mid) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, core);
    gr.addColorStop(0.24, mid);
    gr.addColorStop(1, 'rgba(74,131,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  function createSphere(canvas, opt) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const o = Object.assign({ n: 130, k: 3, speed: 0.0026, tilt: 0.45, dark: false, dpr: 2, pulses: 14, scale: 0.29 }, opt);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < o.n; i++) {
      const y = 1 - (i / (o.n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      pts.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, blue: i % 6 === 0, s: 0.7 + ((i * 53) % 10) / 14 });
    }
    const proj = pts.map(() => ({ x: 0, y: 0, z: 0 }));
    const edges = [];
    const seen = new Set();
    const adj = pts.map(() => []);
    pts.forEach((p, i) => {
      const d = [];
      pts.forEach((q, j) => {
        if (i === j) return;
        const dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z;
        d.push([dx * dx + dy * dy + dz * dz, j]);
      });
      d.sort((a, b) => a[0] - b[0]);
      for (let m = 0; m < o.k; m++) {
        const j = d[m][1];
        const key = i < j ? i + '-' + j : j + '-' + i;
        if (seen.has(key)) continue;
        seen.add(key);
        const idx = edges.length;
        edges.push([i, j]);
        adj[i].push(idx);
        adj[j].push(idx);
      }
    });
    const pulses = [];
    for (let i = 0; i < o.pulses; i++) {
      pulses.push({ e: Math.floor(Math.random() * edges.length), t: Math.random(), dir: Math.random() < 0.5 ? 1 : -1, v: 0.006 + Math.random() * 0.008 });
    }
    const sBlue = glowSprite('rgba(255,255,255,1)', 'rgba(74,131,255,.9)');
    const sGold = glowSprite('rgba(255,248,214,1)', 'rgba(217,178,90,.9)');
    const lineRGB = o.dark ? '243,220,154' : '168,121,34';
    const alphas = o.dark ? [0.1, 0.2, 0.32, 0.5] : [0.14, 0.26, 0.4, 0.6];
    const dotColor = o.dark ? '#F3DC9A' : '#B98A2E';

    let w = 1, h = 1, dpr = 1, cx = 0, cy = 0, R = 1;
    let ay = Math.random() * 6, ax = o.tilt, tx = 0, ty = 0;
    let raf = 0, running = false, last = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, o.dpr);
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      R = Math.min(w, h) * o.scale;
      render(performance.now(), 0);
    }

    function render(time, dt) {
      ctx.clearRect(0, 0, w, h);
      const k = R / 140;
      const cyA = Math.cos(ay), syA = Math.sin(ay), cxA = Math.cos(ax), sxA = Math.sin(ax);

      for (let i = 0; i < o.n; i++) {
        const p = pts[i];
        const x1 = p.x * cyA + p.z * syA;
        const z1 = -p.x * syA + p.z * cyA;
        const y2 = p.y * cxA - z1 * sxA;
        const z2 = p.y * sxA + z1 * cxA;
        const s = 1 / (1 - z2 * 0.22);
        const q = proj[i];
        q.x = cx + x1 * R * s; q.y = cy + y2 * R * s; q.z = z2;
      }

      // anillo orbital inclinado
      const RING = 1.22, tz = 0.5, cz = Math.cos(tz), sz = Math.sin(tz);
      const ringAt = (a) => {
        let x = Math.cos(a) * RING, y = 0, z = Math.sin(a) * RING;
        const x1 = x * cz - y * sz, y1 = x * sz + y * cz;
        const ar = ay * 0.45;
        const x2 = x1 * Math.cos(ar) + z * Math.sin(ar), z2 = -x1 * Math.sin(ar) + z * Math.cos(ar);
        const y3 = y1 * cxA - z2 * sxA, z3 = y1 * sxA + z2 * cxA;
        const s = 1 / (1 - z3 * 0.22);
        return { x: cx + x2 * R * s, y: cy + y3 * R * s, z: z3 };
      };
      ctx.save();
      ctx.setLineDash([2, 7]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(' + lineRGB + ',' + (o.dark ? 0.5 : 0.55) + ')';
      ctx.beginPath();
      for (let a = 0; a <= 64; a++) {
        const p = ringAt((a / 64) * Math.PI * 2);
        if (a === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();

      // aristas por profundidad (4 grupos = 4 trazos)
      ctx.lineWidth = 1;
      for (let b = 0; b < 4; b++) {
        ctx.strokeStyle = 'rgba(' + lineRGB + ',' + alphas[b] + ')';
        ctx.beginPath();
        for (let i = 0; i < edges.length; i++) {
          const A = proj[edges[i][0]], B = proj[edges[i][1]];
          const bi = clamp(Math.floor(((A.z + B.z) / 2 + 1) / 2 * 4), 0, 3);
          if (bi !== b) continue;
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
        }
        ctx.stroke();
      }

      // nodos
      ctx.globalCompositeOperation = o.dark ? 'lighter' : 'source-over';
      for (let i = 0; i < o.n; i++) {
        const q = proj[i], p = pts[i];
        const d = (q.z + 1) / 2;
        if (p.blue) {
          const size = (11 + 13 * d) * k * p.s;
          ctx.globalAlpha = 0.45 + 0.55 * d;
          ctx.drawImage(sBlue, q.x - size, q.y - size, size * 2, size * 2);
        } else {
          ctx.globalAlpha = 0.35 + 0.65 * d;
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(q.x, q.y, (1 + 1.7 * d) * k * p.s, 0, 6.2832);
          ctx.fill();
        }
      }

      // paquetes de datos viajando por la red
      for (let i = 0; i < pulses.length; i++) {
        const pu = pulses[i];
        pu.t += pu.v * (dt || 0);
        if (pu.t >= 1) {
          const node = pu.dir > 0 ? edges[pu.e][1] : edges[pu.e][0];
          const options = adj[node];
          pu.e = options[Math.floor(Math.random() * options.length)];
          pu.dir = edges[pu.e][0] === node ? 1 : -1;
          pu.t = 0;
        }
        const ed = edges[pu.e];
        const A = proj[pu.dir > 0 ? ed[0] : ed[1]], B = proj[pu.dir > 0 ? ed[1] : ed[0]];
        const px = lerp(A.x, B.x, pu.t), py = lerp(A.y, B.y, pu.t);
        const dz = (lerp(A.z, B.z, pu.t) + 1) / 2;
        const size = (13 + 9 * dz) * k;
        ctx.globalAlpha = 0.4 + 0.6 * dz;
        ctx.drawImage(sBlue, px - size, py - size, size * 2, size * 2);
        const tx2 = lerp(A.x, B.x, Math.max(0, pu.t - 0.12)), ty2 = lerp(A.y, B.y, Math.max(0, pu.t - 0.12));
        ctx.globalAlpha *= 0.5;
        ctx.drawImage(sBlue, tx2 - size * 0.5, ty2 - size * 0.5, size, size);
      }

      // satélites sobre el anillo
      for (let s = 0; s < 3; s++) {
        const p = ringAt(time * 0.0006 + s * 2.09);
        const d = (p.z + 1) / 2;
        const size = (11 + 8 * d) * k;
        ctx.globalAlpha = 0.6 + 0.4 * d;
        ctx.drawImage(s === 1 ? sGold : sBlue, p.x - size, p.y - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop(t) {
      if (!running) return;
      const dt = Math.min(2.5, (t - last) / 16.67 || 1);
      last = t;
      if (finePointer && pointer.on) {
        const r = canvas.getBoundingClientRect();
        tx = clamp((pointer.x - (r.left + r.width / 2)) / window.innerWidth * 2, -1, 1);
        ty = clamp((pointer.y - (r.top + r.height / 2)) / window.innerHeight * 2, -1, 1);
      }
      scrollBoost *= 0.94;
      ay += (o.speed + (o.speed < 0 ? -scrollBoost : scrollBoost) + tx * 0.0005) * dt;
      ax = lerp(ax, o.tilt + ty * 0.3, 0.05);
      render(t, dt);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || reduce) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { if (es[0].isIntersecting) start(); else stop(); }, { threshold: 0 }).observe(canvas);
    } else {
      start();
    }
  }

  try {
    const heroCanvas = $('#sphere-hero');
    if (heroCanvas) createSphere(heroCanvas, { n: isMobile ? 92 : 140, speed: 0.0026, scale: 0.31, dark: false });
    const finalCanvas = $('#sphere-final');
    if (finalCanvas) createSphere(finalCanvas, { n: isMobile ? 70 : 110, speed: -0.0018, scale: 0.3, dark: true, dpr: 1.5, pulses: 10 });
  } catch (err) {
    /* si el canvas falla, la página se ve igual: el fondo y el monograma ya son CSS */
  }

  /* ================= Interacciones de escritorio ================= */
  if (finePointer && !reduce) {
    // Inclinación 3D (boleto y teléfono)
    $$('[data-tilt]').forEach((el) => {
      const max = 9;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * max * 2).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // Foco de luz que sigue al cursor en las tarjetas
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // Botones magnéticos
    $$('.mag').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });

    // Aura de luz que sigue al cursor
    const aura = document.createElement('div');
    aura.className = 'aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.appendChild(aura);
    let axp = window.innerWidth / 2, ayp = window.innerHeight / 2, txp = axp, typ = ayp, rafA = 0;
    const auraLoop = () => {
      axp = lerp(axp, txp, 0.12);
      ayp = lerp(ayp, typ, 0.12);
      aura.style.transform = 'translate3d(' + axp.toFixed(1) + 'px,' + ayp.toFixed(1) + 'px,0)';
      rafA = (Math.abs(txp - axp) > 0.5 || Math.abs(typ - ayp) > 0.5) ? requestAnimationFrame(auraLoop) : 0;
    };
    window.addEventListener('pointermove', (e) => {
      txp = e.clientX; typ = e.clientY;
      if (!rafA) rafA = requestAnimationFrame(auraLoop);
    }, { passive: true });
  }

  /* ================= Fotos de stock: respaldo si alguna no carga ================= */
  $$('.stack__media img, .portal__img').forEach((img) => {
    img.addEventListener('error', () => {
      const host = img.closest('.stack__media, .portal__frame');
      if (host) host.classList.add('is-broken');
      img.style.display = 'none';
    });
  });

  /* ================= Formulario de contacto → WhatsApp ================= */
  const form = $('#form-contacto');
  const note = $('#form-note');
  if (form && note) {
    if (!WHATSAPP_NUMERO) {
      note.textContent = 'Por ahora puedes contactarnos por teléfono, correo o visitándonos en la tienda.';
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!WHATSAPP_NUMERO) return;
      const nombreEl = form.elements.nombre;
      const nombre = (nombreEl.value || '').trim();
      if (!nombre) {
        nombreEl.setAttribute('aria-invalid', 'true');
        note.textContent = 'Cuéntanos tu nombre para saludarte como mereces.';
        note.classList.add('is-error');
        nombreEl.focus();
        return;
      }
      nombreEl.removeAttribute('aria-invalid');
      note.classList.remove('is-error');
      const interes = form.elements.interes.value;
      const msg = (form.elements.mensaje.value || '').trim();
      const texto = 'Hola ' + NEGOCIO + ', soy ' + nombre + '. Me interesa: ' + interes + '.' + (msg ? ' ' + msg : '') + ' (Mensaje enviado desde su página web)';
      const url = waUrl(texto);
      const win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
      note.textContent = '¡Listo! Se abrió WhatsApp con tu mensaje. Si no ves la ventana, revisa que tu navegador no la haya bloqueado.';
    });
    form.elements.nombre.addEventListener('input', () => {
      form.elements.nombre.removeAttribute('aria-invalid');
      note.classList.remove('is-error');
    });
  }
})();
