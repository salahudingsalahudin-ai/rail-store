(() => {
  const { garmentSVG, hangRatio } = window.Garments;
  const $ = (s, r = document) => r.querySelector(s);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + n.toFixed(2);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ------------------------------------------------------------------ data */
  const NAVY = '#1d2335', GREY = '#b9bbc0', BLACK = '#18181b', CREAM = '#e6d9bc', GREEN = '#1f4b35';
  const PRODUCTS = [
    { name: 'Harbor Blazer',    type: 'blazer', color: NAVY,  colorName: 'Navy',         price: 249 },
    { name: 'Heavy Crew',       type: 'crew',   color: GREY,  colorName: 'Heather Grey', price: 149, gfx: 'chest' },
    { name: 'Night Hoodie',     type: 'hoodie', color: BLACK, colorName: 'Black',        price: 199 },
    { name: 'Oat Hoodie',       type: 'hoodie', color: CREAM, colorName: 'Oat',          price: 199 },
    { name: 'Forest Zip',       type: 'zip',    color: GREEN, colorName: 'Forest',       price: 179 },
    { name: 'Rail Tee',         type: 'tee',    color: BLACK, colorName: 'Black',        price: 79,  gfx: 'rail' },
    { name: 'Slow Down Hoodie', type: 'hoodie', color: GREY,  colorName: 'Heather Grey', price: 199, gfx: 'slogan' },
    { name: 'Dockside Blazer',  type: 'blazer', color: NAVY,  colorName: 'Navy',         price: 249 },
    { name: 'Heather Zip',      type: 'zip',    color: GREY,  colorName: 'Heather Grey', price: 179 },
    { name: 'Oat Crew',         type: 'crew',   color: CREAM, colorName: 'Oat',          price: 149, gfx: 'chest' },
    { name: 'Midnight Hoodie',  type: 'hoodie', color: NAVY,  colorName: 'Navy',         price: 199 },
    { name: 'Sweatshirt Plus',  type: 'hoodie', color: GREEN, colorName: 'Forest',       price: 199, gfx: 'rail' },
    { name: 'Slate Crew',       type: 'crew',   color: GREY,  colorName: 'Heather Grey', price: 149 },
    { name: 'Noir Blazer',      type: 'blazer', color: BLACK, colorName: 'Black',        price: 249 },
    { name: 'Bone Tee',         type: 'tee',    color: CREAM, colorName: 'Oat',          price: 79,  gfx: 'chest' },
  ].map((p, i) => ({ ...p, id: i + 1 }));
  const N = PRODUCTS.length;
  const SIZES = ['S', 'M', 'L', 'XL'];

  const HANGER = `<svg class="hanger" viewBox="0 0 44 40" aria-hidden="true">
    <path d="M22 15 L22 10 C22 3.500 29.500 3 29.500 9" fill="none" stroke="#8d9097" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22 15 L3 33 L41 33 Z" fill="none" stroke="#7b7e85" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

  /* ------------------------------------------------------------------ rail */
  const rail = $('#rail');
  const itemsEl = $('#items');
  const root = document.documentElement;

  const state = {
    offset: 0, vel: 0, drift: reduceMotion ? 0 : -0.55,
    dragging: false, paused: false, hover: null,
    W: 0, H: 0, pitch: 170, total: 0, sag: 40, y0: 10,
  };

  const items = PRODUCTS.map((p, i) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${p.name}, ${money(p.price)}. Open product view`);
    el.style.setProperty('--hang', hangRatio(p.type));
    el.innerHTML = `<div class="swing"><div class="drop">${garmentSVG(p, 'front', 'garment')}${HANGER}<span class="tag">$${p.price}</span></div></div>`;
    itemsEl.appendChild(el);
    return {
      p, i, el, swing: $('.swing', el), drop: $('.drop', el),
      angle: 0, av: 0, x: 0, cx: 0,
      k: 0.042 + Math.random() * 0.02,      // each garment swings at its own pace
      c: 0.055 + Math.random() * 0.03,
    };
  });

  const cablePaths = ['#cableShadow', '#cablePath', '#cableShine'].map((s) => $(s));

  function layout() {
    const W = rail.clientWidth, H = rail.clientHeight;
    state.W = W; state.H = H;
    state.pitch = Math.max(104, W / 7.8);
    state.total = state.pitch * N;
    state.sag = Math.min(70, W * 0.042);
    const gw = state.pitch * 1.22;
    const block = state.sag + 30 + gw * 1.56 + 70;
    state.y0 = clamp((H - block) * 0.5, 10, 110);
    root.style.setProperty('--pitch', state.pitch + 'px');
    root.style.setProperty('--gw', gw + 'px');
    // shadow, body, highlight: same curve, nudged vertically
    const { y0, sag } = state;
    [5, 0, -1.6].forEach((dy, idx) => {
      cablePaths[idx].setAttribute('d', `M -40 ${y0 + dy} Q ${W / 2} ${y0 + dy + 2 * sag} ${W + 40} ${y0 + dy}`);
    });
  }

  const cableY = (x) => {
    const t = (x + 40) / (state.W + 80);
    return state.y0 + 4 * state.sag * t * (1 - t);
  };

  let time = 0;
  let current = null;
  const curName = $('#curName'), curPrice = $('#curPrice'), progress = $('#progress');

  function setCurrent(p) {
    if (current === p) return;
    current = p;
    curName.textContent = p.name;
    curPrice.textContent = money(p.price);
    if (!reduceMotion) gsap.fromTo([curName, curPrice], { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.35, overwrite: true });
  }

  function frame() {
    // deltaRatio() is NaN until GSAP's ticker has ticked once; one NaN would poison offset for good.
    let dr = gsap.ticker.deltaRatio(60);
    dr = Number.isFinite(dr) ? Math.min(dr, 3) : 0;
    if (!Number.isFinite(state.offset)) state.offset = 0;
    if (!Number.isFinite(state.vel)) state.vel = 0;
    time += dr / 60;
    const { W, pitch, total } = state;

    const target = state.paused ? 0 : state.hover ? state.drift * 0.28 : state.drift;
    if (!state.dragging) state.vel += (target - state.vel) * (1 - Math.pow(0.965, dr));
    state.offset += state.vel * dr;

    let nearest = null, best = Infinity;
    for (const it of items) {
      let raw = (it.i * pitch + state.offset) % total;
      if (raw < 0) raw += total;
      const x = raw - pitch;
      it.x = x;
      it.cx = x + pitch / 2;
      const d = Math.abs(it.cx - W / 2);
      if (d < best) { best = d; nearest = it; }

      if (x > W + pitch * 0.3 || x < -pitch * 1.5) {
        if (!it.hidden) { it.el.style.visibility = 'hidden'; it.hidden = true; }
        continue;
      }
      if (it.hidden) { it.el.style.visibility = ''; it.hidden = false; }

      const nx = (it.cx - W / 2) / (W / 2);
      const s = 1 - 0.07 * nx * nx;
      it.el.style.transform = `translate3d(${x}px,${cableY(it.cx)}px,0) rotateY(${(nx * 34).toFixed(2)}deg) scale(${s.toFixed(4)})`;

      if (!reduceMotion) {
        const force = -state.vel * 0.05 + Math.sin(time * 1.1 + it.i * 1.7) * 0.0045;
        it.av += (force - it.k * it.angle - it.c * it.av) * dr;
        it.angle = clamp(it.angle + it.av * dr, -15, 15);
        it.swing.style.transform = `rotate(${it.angle.toFixed(3)}deg)`;
      }
    }

    if (!state.hover && nearest) setCurrent(nearest.p);
    const frac = (((-state.offset) % total) + total) % total / total;
    progress.style.left = (frac * 62).toFixed(2) + '%';
  }

  /* --- input: drag, wheel, keys, hover --- */
  let dragStartX = 0, dragLastX = 0, dragLastT = 0, dragMoved = 0;

  rail.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || pdp.open) return;
    state.dragging = true;
    dragStartX = dragLastX = e.clientX;
    dragLastT = performance.now();
    dragMoved = 0;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onUp, { once: true });
  });

  function onMove(e) {
    const now = performance.now();
    const dx = e.clientX - dragLastX;
    state.offset += dx;
    dragMoved = Math.max(dragMoved, Math.abs(e.clientX - dragStartX));
    if (dragMoved > 5) rail.classList.add('is-dragging');
    const dt = Math.max(now - dragLastT, 1);
    state.vel = clamp(state.vel * 0.5 + (dx / dt) * 16.7 * 0.5, -45, 45);
    dragLastX = e.clientX;
    dragLastT = now;
  }

  function onUp(e) {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    state.dragging = false;
    rail.classList.remove('is-dragging');
    if (dragMoved <= 5 && e.type === 'pointerup') {
      const el = e.target.closest && e.target.closest('.item');
      if (el) openPDP(items.find((it) => it.el === el));
    }
  }

  rail.addEventListener('wheel', (e) => {
    if (pdp.open) return;
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    state.vel = clamp(state.vel - d * 0.09, -45, 45);
  }, { passive: false });

  itemsEl.addEventListener('pointerover', (e) => {
    const el = e.target.closest('.item');
    if (!el) return;
    const it = items.find((x) => x.el === el);
    state.hover = it;
    setCurrent(it.p);
  });
  rail.addEventListener('pointerleave', () => { state.hover = null; });

  itemsEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('.item');
    if (!el) return;
    e.preventDefault();
    openPDP(items.find((it) => it.el === el));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cartOpen) closeCart();
      else if (pdp.open) closePDP();
      return;
    }
    if (pdp.open || cartOpen || e.target.matches('input')) return;
    if (e.key === 'ArrowRight') state.vel = clamp(state.vel - 14, -45, 45);
    if (e.key === 'ArrowLeft') state.vel = clamp(state.vel + 14, -45, 45);
  });

  $('#shopLink').addEventListener('click', (e) => { e.preventDefault(); state.vel = -28; });

  $('#search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    items.forEach((it) => {
      const hay = `${it.p.name} ${it.p.colorName} ${it.p.type}`.toLowerCase();
      it.el.classList.toggle('is-dim', !!q && !hay.includes(q));
    });
  });

  /* ------------------------------------------------------------------ cart */
  const CART_KEY = 'rail-cart-v1';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (_) { cart = []; }
  cart = cart.filter((l) => PRODUCTS.some((p) => p.id === l.id) && SIZES.includes(l.size) && l.qty > 0);

  const badge = $('#badge'), cartEl = $('#cart'), scrim = $('#scrim');
  const linesEl = $('#lines'), emptyEl = $('#empty');
  let cartOpen = false, lastFocus = null;

  const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  function renderCart(popBadge) {
    const count = cartCount();
    badge.textContent = count;
    badge.hidden = count === 0;
    $('#cartCount').textContent = `(${count})`;
    emptyEl.hidden = count > 0;
    linesEl.hidden = count === 0;
    $('#checkout').disabled = count === 0;
    $('#checkout').style.opacity = count === 0 ? '.4' : '';
    $('#subtotal').textContent = money(cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0));
    linesEl.innerHTML = cart.map((l, idx) => {
      const p = byId(l.id);
      return `<li class="line">
        <div class="thumb">${garmentSVG(p)}</div>
        <div><h3>${p.name}</h3><p class="sub">${p.colorName} / ${l.size}</p>
          <div class="qty"><button type="button" data-act="dec" data-idx="${idx}" aria-label="Decrease quantity">−</button>
          <span>${l.qty}</span><button type="button" data-act="inc" data-idx="${idx}" aria-label="Increase quantity">+</button></div></div>
        <div class="amt">${money(p.price * l.qty)}</div></li>`;
    }).join('');
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) { /* storage can be blocked */ }
    if (popBadge && !reduceMotion) gsap.fromTo(badge, { scale: 1.7 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', overwrite: true });
  }

  function addToCart(id, size) {
    const line = cart.find((l) => l.id === id && l.size === size);
    if (line) line.qty += 1; else cart.push({ id, size, qty: 1 });
    renderCart(true);
  }

  linesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const line = cart[+btn.dataset.idx];
    line.qty += btn.dataset.act === 'inc' ? 1 : -1;
    if (line.qty <= 0) cart.splice(+btn.dataset.idx, 1);
    renderCart();
  });

  function openCart() {
    if (cartOpen) return;
    cartOpen = true;
    lastFocus = document.activeElement;
    scrim.hidden = false;
    cartEl.style.visibility = 'visible';
    cartEl.setAttribute('aria-hidden', 'false');
    gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    gsap.fromTo(cartEl, { xPercent: 105 }, { xPercent: 0, duration: reduceMotion ? 0 : 0.6, ease: 'power3.out' });
    if (!reduceMotion) gsap.from('.line', { x: 24, opacity: 0, duration: 0.5, stagger: 0.06, delay: 0.2, ease: 'power2.out' });
    $('#cartClose').focus({ preventScroll: true });
  }

  function closeCart() {
    if (!cartOpen) return;
    cartOpen = false;
    cartEl.setAttribute('aria-hidden', 'true');
    gsap.to(scrim, { opacity: 0, duration: 0.3, onComplete: () => { scrim.hidden = true; } });
    gsap.to(cartEl, { xPercent: 105, duration: reduceMotion ? 0 : 0.45, ease: 'power3.in', onComplete: () => { cartEl.style.visibility = 'hidden'; } });
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  $('#bagBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  $('#viewCart').addEventListener('click', openCart);
  $('#checkout').addEventListener('click', (e) => {
    const b = e.currentTarget;
    b.textContent = 'Demo store: checkout not connected';
    setTimeout(() => { b.textContent = 'Checkout'; }, 2200);
  });

  /* ------------------------------------------------------------ product view */
  const pdpEl = $('#pdp'), stage = $('#pdpStage'), host = $('#pdpGarment');
  const wire = $('#pdpWire'), hanger = $('#pdpHanger'), panel = $('#pdpPanel');
  const sizesEl = $('#sizes'), addBtn = $('#addBtn');
  const pdp = { open: false, busy: false, it: null, view: 'front', size: 'L' };
  const panelKids = () => [...panel.children];

  function fillPanel(p) {
    $('#pdpCount').textContent = `${p.id} / ${N}`;
    $('#pdpName').textContent = p.name;
    $('#pdpPrice').textContent = money(p.price);
    sizesEl.innerHTML = SIZES.map((s) => `<button type="button" role="radio" aria-checked="${s === pdp.size}" data-size="${s}">${s}</button>`).join('');
    panel.querySelectorAll('.tabs button').forEach((b) => {
      const on = b.dataset.view === 'front';
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on);
    });
    addBtn.textContent = 'Add to cart';
    stage.style.setProperty('--hang', hangRatio(p.type));
  }

  function openPDP(it) {
    if (pdp.open || pdp.busy || !it) return;
    Object.assign(pdp, { open: true, busy: true, it, view: 'front' });
    state.paused = true;
    fillPanel(it.p);
    host.innerHTML = garmentSVG(it.p, 'front');
    pdpEl.hidden = false;
    pdpEl.style.backgroundColor = 'rgba(252,251,252,0)';

    const svg = host.firstElementChild;
    const from = $('.garment', it.el).getBoundingClientRect();
    const to = svg.getBoundingClientRect();
    it.el.classList.add('is-open');
    gsap.set(svg, { x: from.left - to.left, y: from.top - to.top, scale: from.width / to.width });
    gsap.set([wire, hanger], { opacity: 0 });
    gsap.set(panelKids(), { opacity: 0, x: 26 });
    $('#pdpClose').focus({ preventScroll: true });

    const d = reduceMotion ? 0.01 : 1;
    gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { pdp.busy = false; } })
      .to(pdpEl, { backgroundColor: 'rgba(252,251,252,1)', duration: 0.6 * d, ease: 'none' }, 0)
      .to(svg, { x: 0, y: 0, scale: 1, duration: 0.95 * d }, 0)
      .fromTo(wire, { opacity: 1, scaleY: 0, transformOrigin: '50% 0' }, { scaleY: 1, duration: 0.7 * d, ease: 'power2.out' }, 0.45 * d)
      .to(hanger, { opacity: 1, duration: 0.4 * d, ease: 'none' }, 0.55 * d)
      .to(panelKids(), { opacity: 1, x: 0, duration: 0.7 * d, stagger: 0.06, ease: 'power3.out' }, 0.55 * d);
  }

  function closePDP() {
    if (!pdp.open || pdp.busy) return;
    pdp.busy = true;
    const it = pdp.it;
    const svg = host.firstElementChild;
    const cur = svg.getBoundingClientRect();
    const to = $('.garment', it.el).getBoundingClientRect();
    const d = reduceMotion ? 0.01 : 1;

    gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        pdpEl.hidden = true;
        pdpEl.style.backgroundColor = '';
        it.el.classList.remove('is-open');
        gsap.set(svg, { clearProps: 'all' });
        Object.assign(pdp, { open: false, busy: false, it: null });
        state.paused = false;
        it.el.focus({ preventScroll: true });
      },
    })
      .to([...panelKids(), wire, hanger], { opacity: 0, duration: 0.25 * d, ease: 'none' }, 0)
      .to(svg, { x: to.left - cur.left, y: to.top - cur.top, scale: to.width / cur.width, duration: 0.85 * d }, 0.1 * d)
      .to(pdpEl, { backgroundColor: 'rgba(252,251,252,0)', duration: 0.5 * d, ease: 'none' }, 0.4 * d);
  }

  $('#pdpClose').addEventListener('click', closePDP);

  sizesEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-size]');
    if (!b) return;
    pdp.size = b.dataset.size;
    sizesEl.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', x === b));
  });

  panel.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b || b.dataset.view === pdp.view || pdp.busy) return;
    pdp.view = b.dataset.view;
    pdp.busy = true;
    panel.querySelectorAll('.tabs button').forEach((x) => {
      x.classList.toggle('is-on', x === b);
      x.setAttribute('aria-selected', x === b);
    });
    // Turn the garment around on its hanger: swing to edge-on, swap the face, swing back.
    gsap.timeline({ onComplete: () => { pdp.busy = false; } })
      .to(host, { rotateY: reduceMotion ? 0 : 90, transformPerspective: 1100, duration: 0.28, ease: 'power2.in' })
      .add(() => { host.innerHTML = garmentSVG(pdp.it.p, pdp.view); })
      .fromTo(host, { rotateY: reduceMotion ? 0 : -90 }, { rotateY: 0, duration: 0.42, ease: 'power2.out' });
  });

  addBtn.addEventListener('click', () => {
    addToCart(pdp.it.p.id, pdp.size);
    addBtn.textContent = 'Added to cart ✓';
    addBtn.classList.add('is-done');
    gsap.fromTo(addBtn, { scale: 0.97 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    clearTimeout(addBtn._t);
    addBtn._t = setTimeout(() => { addBtn.textContent = 'Add to cart'; addBtn.classList.remove('is-done'); }, 2000);
  });

  /* ------------------------------------------------------------------ intro */
  function splitHeadline() {
    const h = $('#headline');
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', words.join(' '));
    h.innerHTML = words.map((w, i) =>
      `<span class="word${i === words.length - 1 ? ' soft' : ''}" aria-hidden="true">${w}${i < words.length - 1 ? ' ' : ''}</span>`).join('');
  }

  function intro() {
    if (reduceMotion) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.nav > *', { y: -14, opacity: 0, duration: 0.8, stagger: 0.08 }, 0)
      .from('.eyebrow', { y: 8, opacity: 0, duration: 0.7 }, 0.15)
      .from('.word', { y: 14, opacity: 0, filter: 'blur(14px)', duration: 1.1, stagger: 0.09 }, 0.25);

    cablePaths.forEach((path, i) => {
      const len = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, duration: 1.3, delay: 0.2, ease: 'power2.inOut',
        onComplete: () => gsap.set(path, { strokeDasharray: 'none' }),
      });
    });

    [...items].sort((a, b) => a.cx - b.cx).forEach((it, rank) => {
      const delay = 0.75 + rank * 0.055;
      gsap.fromTo(it.drop, { y: -110, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay, ease: 'back.out(1.5)' });
      gsap.delayedCall(delay + 0.25, () => { it.av = (Math.random() - 0.5) * 3.2; });
    });

    gsap.from('.meta > *', { y: 10, opacity: 0, duration: 0.8, stagger: 0.1, delay: 1.3, ease: 'power2.out' });
  }

  /* ------------------------------------------------------------------- boot */
  splitHeadline();
  layout();
  renderCart();
  gsap.set(cartEl, { xPercent: 105 });
  new ResizeObserver(layout).observe(rail);
  frame();             // place everything once so the intro can read positions
  intro();
  gsap.ticker.add(frame);
})();
