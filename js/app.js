/* Sesión 18 · Matemática para las CCSS · UTP
   Presentación sin librerías: navegación, tarjetas interactivas, quiz y gráficos SVG. */
(function () {
  'use strict';

  const GLUCOSE = [85,90,92,88,100,110,115,98,105,102,96,94,100,108,112,117,120,123,125,130,
                   87,91,89,95,97,101,104,106,109,111,103,107,113,116,118,121,122,124,126,127];

  const MOMENTS = [
    { id: 'inicio', name: 'Inicio' },
    { id: 'utilidad', name: 'Utilidad' },
    { id: 'transformacion', name: 'Transformación' },
    { id: 'practica', name: 'Práctica' },
    { id: 'cierre', name: 'Cierre' }
  ];

  /* Cada opción lleva su explicación corta, que aparece al girar la tarjeta. */
  const QUIZZES = {
    dispersion: {
      q: 'Dos grupos tienen la misma media de hemoglobina. Grupo X: desviación estándar 0,3. Grupo Y: 2,1. ¿Quién tuvo resultados más parecidos entre sí?',
      options: [
        { t: 'El grupo Y', why: 'Tiene la desviación estándar más grande: sus resultados son más variados.' },
        { t: 'Los dos por igual', why: 'La misma media no significa la misma dispersión.' },
        { t: 'El grupo X', ok: true, why: 'Menor desviación estándar: sus resultados son más parecidos.' },
        { t: 'No se puede saber', why: 'Sí se puede: la desviación estándar lo indica.' }
      ]
    },
    grafico: {
      q: 'Quieres comparar el % de mejoría entre dos grupos de pacientes. ¿Qué gráfico eliges?',
      options: [
        { t: 'Histograma', why: 'Es para datos agrupados en intervalos, no para comparar grupos.' },
        { t: 'Barras', ok: true, why: 'Permite comparar grupos lado a lado.' },
        { t: 'Pastel', why: 'Muestra partes de un total, no compara dos grupos.' },
        { t: 'Ninguno, basta la media', why: 'Un gráfico hace visible la comparación.' }
      ]
    },
    muestra: {
      q: '¿Qué resultado es más confiable?',
      options: [
        { t: 'Un estudio con 10 pacientes', why: 'Un solo caso distinto cambia mucho el resultado.' },
        { t: 'Un estudio con 50 pacientes', why: 'Mejor que 10, pero hay una opción más confiable.' },
        { t: 'Un estudio con 1 000 pacientes', ok: true, why: 'A mayor muestra, mayor confiabilidad.' },
        { t: 'Todos son igual de confiables', why: 'El tamaño de la muestra sí importa.' }
      ]
    }
  };
  const QUIZ_ORDER = ['dispersion', 'grafico', 'muestra'];

  /* ---------- Gráficos SVG ---------- */
  const C = { red: '#C41230', ink: '#17120F', amber: '#E8A33D', soft: '#8A7F72' };
  const fmt = (x, d) => x.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

  function barSVG(o) {
    const W = 520, H = 320, L = 64, R = 20, T = 28, B = 56;
    const pw = W - L - R, ph = H - T - B, max = o.max, n = o.values.length;
    const slot = pw / n, bw = slot * 0.5;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.aria || 'Gráfico de barras') + '">';
    for (let i = 0; i <= 4; i++) {
      const y = T + ph - ph * i / 4;
      s += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>';
      s += '<text x="' + (L - 8) + '" y="' + (y + 5) + '" text-anchor="end" font-size="14">' + fmt(max * i / 4, o.dec || 0) + '</text>';
    }
    o.values.forEach((v, i) => {
      const h = ph * v / max, x = L + slot * i + (slot - bw) / 2, y = T + ph - h;
      s += '<rect class="bar" style="animation-delay:' + (0.15 * i) + 's" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="6" fill="' + o.colors[i] + '"/>';
      if (o.labelsTop) s += '<text x="' + (x + bw / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-size="20" font-weight="800">' + o.labelsTop[i] + '</text>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - B + 24) + '" text-anchor="middle" font-size="15" font-weight="700">' + o.labels[i] + '</text>';
    });
    s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (T + ph) + '"/>';
    if (o.yTitle) s += '<text transform="translate(16 ' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle" font-size="14" fill="' + C.soft + '">' + o.yTitle + '</text>';
    return s + '</svg>';
  }

  function pieSVG(parts) {
    const cx = 150, cy = 150, r = 120;
    let a0 = -Math.PI / 2, s = '<svg viewBox="0 0 300 300" role="img" aria-label="Gráfico de pastel">';
    const total = parts.reduce((t, p) => t + p.v, 0);
    parts.forEach(p => {
      const a1 = a0 + 2 * Math.PI * p.v / total;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      s += '<path d="M' + cx + ' ' + cy + ' L' + x0 + ' ' + y0 + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1 + ' ' + y1 + ' Z" fill="' + p.c + '" stroke="#fff" stroke-width="3"/>';
      a0 = a1;
    });
    return s + '</svg>';
  }

  function histSVG(freqs) {
    const W = 520, H = 320, L = 30, R = 16, T = 28, B = 40;
    const pw = W - L - R, ph = H - T - B, max = Math.max.apply(null, freqs) + 1, bw = pw / freqs.length;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histograma">';
    freqs.forEach((f, i) => {
      const h = ph * f / max, x = L + bw * i;
      s += '<rect class="bar" style="animation-delay:' + (0.1 * i) + 's" x="' + x + '" y="' + (T + ph - h) + '" width="' + bw + '" height="' + h + '" fill="' + C.red + '" stroke="#fff" stroke-width="3"/>';
    });
    s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (T + ph) + '"/>';
    return s + '</svg>';
  }

  const CHARTS = {
    fever: () => barSVG({ values: [80, 40], max: 100, labels: ['A (con medicamento)', 'B (sin medicamento)'], labelsTop: ['80 %', '40 %'], colors: [C.red, C.ink], yTitle: '% que bajó la fiebre en ≤ 6 h', aria: 'Barras: 80 por ciento contra 40 por ciento' }),
    'mini-bar': () => barSVG({ values: [60, 85, 40], max: 100, labels: ['A', 'B', 'C'], colors: [C.ink, C.red, C.soft] }),
    'mini-hist': () => histSVG([2, 6, 9, 5, 2]),
    'mini-pie': () => pieSVG([{ v: 45, c: C.red }, { v: 30, c: C.ink }, { v: 25, c: C.amber }])
  };

  /* ---------- Construcción de piezas ---------- */
  function buildStatic() {
    document.querySelectorAll('[data-chart]').forEach(el => { el.innerHTML = CHARTS[el.dataset.chart](); });

    const t = document.getElementById('glucose-table');
    if (t) {
      let h = '<tbody>';
      for (let r = 0; r < 4; r++) h += '<tr>' + GLUCOSE.slice(r * 10, r * 10 + 10).map(v => '<td>' + v + '</td>').join('') + '</tr>';
      t.innerHTML = h + '</tbody>';
    }

    document.querySelectorAll('.types .flip').forEach(c => {
      const toggle = () => c.classList.toggle('is-flipped');
      c.addEventListener('click', toggle);
      c.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); toggle(); } });
    });
  }

  /* Tamaño de muestra: 10 vs 1 000 personas */
  function buildMuestra() {
    const dots = document.getElementById('dots-muestra'), out = document.getElementById('readout-muestra');
    const seg = document.getElementById('seg-muestra');
    if (!dots) return;
    function draw(n) {
      dots.className = 'dots' + (n > 100 ? ' many' : '');
      let h = '';
      for (let i = 0; i < n; i++) h += '<i' + (i === 0 ? ' class="one"' : '') + ' style="animation-delay:' + Math.min(i * 1.5, 500) + 'ms"></i>';
      dots.innerHTML = h;
      out.innerHTML = n === 10
        ? 'Un caso distinto (el punto amarillo) cambia el resultado en <b>10 %</b>.'
        : 'Un caso distinto (el punto amarillo) cambia el resultado en solo <b>0,1 %</b>.';
    }
    seg.querySelectorAll('button').forEach(b => b.onclick = () => {
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      draw(+b.dataset.n); fit();
    });
    draw(10);
  }

  /* Dispersión: mismos promedios, distinta dispersión */
  function buildDisp() {
    const box = document.getElementById('disp-chart'), out = document.getElementById('readout-disp');
    const seg = document.getElementById('seg-disp');
    if (!box) return;
    const W = 700, H = 230, L = 30, R = 30, y0 = 175;
    const sx = v => L + (v - 20) / 60 * (W - L - R);
    const low = [47, 48, 49, 49.5, 50, 50, 50.5, 51, 51.5, 52, 53, 50];
    const high = [26, 33, 39, 44, 48, 50, 52, 56, 61, 67, 74, 50];
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Puntos de pacientes sobre una recta numérica">';
    s += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + y0 + '" y2="' + y0 + '"/>';
    s += '<line x1="' + sx(50) + '" x2="' + sx(50) + '" y1="28" y2="' + (y0 + 12) + '" stroke="' + C.ink + '" stroke-width="3" stroke-dasharray="7 6"/>';
    s += '<text x="' + sx(50) + '" y="' + (y0 + 38) + '" text-anchor="middle" font-size="20" font-weight="800">Mismo promedio</text>';
    low.forEach((v, i) => {
      s += '<circle class="disp-dot" cx="0" cy="' + (y0 - 18 - (i % 4) * 28) + '" r="12" fill="' + C.red + '" style="transform:translateX(' + sx(v) + 'px)"/>';
    });
    box.innerHTML = s + '</svg>';
    const circles = box.querySelectorAll('.disp-dot');
    const texts = {
      low: 'Desviación estándar <b>pequeña</b>: los pacientes respondieron de forma parecida.',
      high: 'Desviación estándar <b>grande</b>: los pacientes respondieron de forma muy distinta.'
    };
    function set(k) {
      const arr = k === 'low' ? low : high;
      circles.forEach((c, i) => { c.style.transform = 'translateX(' + sx(arr[i]) + 'px)'; });
      out.innerHTML = texts[k];
    }
    seg.querySelectorAll('button').forEach(b => b.onclick = () => {
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      set(b.dataset.k);
    });
    set('low');
  }

  /* ---------- Quiz con tarjetas que giran ---------- */
  const ICON_OK = '<svg class="icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="#fff" stroke-width="3"/><path d="M13 25l8 8 14-17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_BAD = '<svg class="icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="#fff" stroke-width="3"/><path d="M16 16l16 16M32 16L16 32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>';

  function renderQuiz(slide) {
    const id = slide.dataset.quiz, quiz = QUIZZES[id];
    const num = QUIZ_ORDER.indexOf(id) + 1;
    slide.innerHTML = '<div class="wrap"><div class="qhead"><span class="qbadge">Quiz interactivo · ' + num + '/' + QUIZ_ORDER.length + '</span></div>' +
      '<h2 class="qtext">' + quiz.q + '</h2>' +
      '<div class="opts">' + quiz.options.map((o, k) =>
        '<div class="flip" tabindex="0" role="button" data-k="' + k + '"><div class="flip-inner">' +
        '<div class="face front"><span class="letter">' + 'ABCD'[k] + '</span><span class="otext">' + o.t + '</span></div>' +
        '<div class="face back ' + (o.ok ? 'ok' : 'bad') + '">' + (o.ok ? ICON_OK : ICON_BAD) +
        '<div><b>' + (o.ok ? '¡Correcto!' : 'Incorrecto') + '</b><span>' + o.why + '</span></div></div>' +
        '</div></div>').join('') + '</div></div>';
    slide.classList.remove('solved');
    slide.querySelectorAll('.flip').forEach(card => {
      const flip = () => {
        card.classList.toggle('is-flipped');
        const k = +card.dataset.k;
        if (quiz.options[k].ok && card.classList.contains('is-flipped')) slide.classList.add('solved');
      };
      card.addEventListener('click', flip);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') { e.stopPropagation(); flip(); } });
    });
  }

  /* ---------- Navegación ---------- */
  const slides = Array.from(document.querySelectorAll('.slide'));
  let cur = 0;
  const $ = id => document.getElementById(id);

  function buildMoments() {
    const nav = $('moments');
    nav.innerHTML = MOMENTS.map(m => '<button class="moment" data-m="' + m.id + '" type="button">' + m.name + '</button>').join('');
    nav.querySelectorAll('.moment').forEach(b => b.onclick = () => {
      const idx = slides.findIndex(s => s.dataset.moment === b.dataset.m);
      if (idx >= 0) go(idx);
    });
  }

  const stepsOf = slide => Array.from(slide.querySelectorAll('[data-step]'));

  function go(i, fromEnd) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(s => s.classList.remove('active'));
    cur = i;
    const s = slides[i];
    s.classList.add('active');
    s.scrollTop = 0;
    stepsOf(s).forEach(el => el.classList.toggle('shown', !!fromEnd));
    if (s.dataset.quiz) renderQuiz(s);
    updateUI();
    fit();
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { /* abierto como archivo */ }
  }

  function updateUI() {
    const n = slides.length, cm = slides[cur].dataset.moment;
    $('counter').textContent = (cur + 1) + ' / ' + n;
    $('pos').textContent = (cur + 1) + ' / ' + n;
    $('btn-prev').disabled = cur === 0;
    $('btn-next').disabled = cur === n - 1;
    const ci = MOMENTS.findIndex(m => m.id === cm);
    document.querySelectorAll('.moment').forEach((b, k) => {
      b.classList.toggle('active', k === ci);
      b.classList.toggle('done', k < ci);
    });
    document.title = slides[cur].dataset.title + ' · Sesión 18';
  }

  function next() {
    const hidden = stepsOf(slides[cur]).filter(el => !el.classList.contains('shown'));
    if (hidden.length) { hidden[0].classList.add('shown'); return; }
    go(cur + 1);
  }
  function prev() {
    const shown = stepsOf(slides[cur]).filter(el => el.classList.contains('shown'));
    if (shown.length) { shown[shown.length - 1].classList.remove('shown'); return; }
    go(cur - 1, true);
  }
  /* Ajuste automático: en escritorio todo debe caber sin scroll vertical. */
  function fit() {
    const s = slides[cur], w = s.querySelector(':scope > .wrap');
    if (!w) return;
    w.style.zoom = ''; w.style.maxWidth = '';
    if (window.innerWidth < 900) return;
    const steps = stepsOf(s), was = steps.map(e => e.classList.contains('shown'));
    steps.forEach(e => e.classList.add('shown'));
    const cs = getComputedStyle(s);
    const avail = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let z = 1;
    for (let k = 0; k < 4; k++) {
      w.style.zoom = z; w.style.maxWidth = (1240 / z) + 'px';
      const h = w.getBoundingClientRect().height;
      if (h <= avail + 0.5) break;
      z = Math.max(0.5, z * (avail / h) * 0.995);
    }
    if (z >= 0.999) { w.style.zoom = ''; w.style.maxWidth = ''; }
    steps.forEach((e, i) => e.classList.toggle('shown', was[i]));
  }

  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }

  function bind() {
    $('btn-next').onclick = next;
    $('btn-prev').onclick = prev;
    $('btn-full').onclick = toggleFull;
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', () => { fit(); document.body.classList.toggle('hide-controls', !!document.fullscreenElement); });

    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
      else if (k === 'Home') go(0);
      else if (k === 'End') go(slides.length - 1);
      else if (k === 'f' || k === 'F') toggleFull();
      else if (slides[cur].dataset.quiz) {
        const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k.toLowerCase());
        const cards = slides[cur].querySelectorAll('.flip');
        if (idx >= 0 && cards[idx]) cards[idx].click();
      }
    });

    let x0 = null, y0 = null;
    const stage = $('stage');
    stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : prev(); }
      x0 = null;
    }, { passive: true });

    let idle;
    document.addEventListener('mousemove', () => {
      document.body.classList.remove('hide-controls');
      clearTimeout(idle);
      if (document.fullscreenElement) idle = setTimeout(() => document.body.classList.add('hide-controls'), 2500);
    });
  }

  buildMoments();
  buildStatic();
  buildMuestra();
  buildDisp();
  bind();
  window.deck = { go: i => go(i, true), count: slides.length };
  const start = parseInt((location.hash || '').replace('#', ''), 10);
  go(isNaN(start) ? 0 : start - 1);
})();
