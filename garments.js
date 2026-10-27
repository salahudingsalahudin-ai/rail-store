// Garment illustrations drawn as inline SVG so the store needs no image assets.
// Every garment shares one viewBox, so any of them can be swapped into the same slot.
(() => {

const VIEWBOX = '30 16 140 218';

// Where the shoulder line sits inside the viewBox, so the hanger can be aligned to it.
const SHOULDER_Y = { hoodie: 60, zip: 60, crew: 58, tee: 54, blazer: 56 };

const hangRatio = (type) => (SHOULDER_Y[type] - 16) / 140;

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

// f in -1..1: negative mixes toward black, positive toward white.
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const target = f < 0 ? 0 : 255;
  const p = Math.abs(f);
  const ch = (v) => clamp((target - v) * p + v);
  const out = (ch(n >> 16) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255);
  return '#' + out.toString(16).padStart(6, '0');
}

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

const BODY = 'M64 60 C84 70 116 70 136 60 L140 84 L140 214 C118 219 82 219 60 214 L60 84 Z';
const SLEEVE_L = 'M64 60 L46 72 C42 110 40 160 38 206 L58 210 C60 160 62 120 66 92 Z';
const SLEEVE_R = 'M136 60 L154 72 C158 110 160 160 162 206 L142 210 C140 160 138 120 134 92 Z';
const CUFF_L = 'M38 206 L58 210 L57 221 L37 217 Z';
const CUFF_R = 'M162 206 L142 210 L143 221 L163 217 Z';
const HEM = 'M60 214 C82 219 118 219 140 214 L140 225 C118 230 82 230 60 225 Z';

const TEE_BODY = 'M72 52 L128 52 L156 68 L166 104 L138 112 L138 204 C116 210 84 210 62 204 L62 112 L34 104 L44 68 Z';

const BLAZER_BODY = 'M64 58 L100 50 L136 58 L142 84 L142 214 L58 214 L58 84 Z';

function graphic(p, view, c, u) {
  if (!p.gfx) return '';
  const ink = luminance(c) > 0.55 ? shade(c, -0.72) : '#efe6d0';
  const edge = shade(c, -0.35);
  if (view === 'back') {
    if (p.gfx === 'rail') {
      return `<text x="100" y="128" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="15" letter-spacing="3" fill="${ink}">RAIL</text>`;
    }
    return '';
  }
  if (p.gfx === 'rail') {
    return `<defs><path id="${u}a" d="M63 126 Q100 100 137 126"/></defs>
      <text font-family="Georgia,'Times New Roman',serif" font-weight="900" font-size="26" letter-spacing="1" fill="${ink}" stroke="${edge}" stroke-width=".4">
        <textPath href="#${u}a" startOffset="50%" text-anchor="middle">RAIL</textPath></text>
      <text x="100" y="141" text-anchor="middle" font-family="Georgia,serif" font-size="6" letter-spacing="2.4" fill="${ink}">ORIGINAL</text>`;
  }
  if (p.gfx === 'slogan') {
    return `<g font-family="Impact,'Arial Black',sans-serif" text-anchor="middle" fill="${ink}" opacity=".9">
      <text x="100" y="116" font-size="10">SLOW</text><text x="100" y="127" font-size="10">DOWN</text>
      <text x="100" y="137" font-size="7" letter-spacing="1.5">LAYER UP</text></g>`;
  }
  if (p.gfx === 'chest') {
    return `<g fill="none" stroke="${ink}" stroke-width="1.1" opacity=".85"><circle cx="120" cy="100" r="5.5"/>
      <text x="120" y="102.6" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="7" fill="${ink}" stroke="none">R</text></g>`;
  }
  return '';
}

// The part of the hood that sits behind the body (front view only).
function hoodBehind(c, view) {
  return view === 'front' ? `<path d="M64 58 C58 14 142 14 136 58 Z" fill="${shade(c, -0.28)}"/>` : '';
}

// The part of the hood that sits on top of the shoulders.
function hoodOver(c, view) {
  if (view === 'back') {
    return `<path d="M62 62 C54 20 146 20 138 62 C124 74 76 74 62 62 Z" fill="${c}"/>
      <path d="M100 26 L100 72" stroke="${shade(c, -0.2)}" stroke-width="1" fill="none"/>`;
  }
  return `<path d="M62 64 C54 24 146 24 138 64 C128 78 72 78 62 64 Z" fill="${c}"/>
    <path d="M76 62 C80 46 120 46 124 62 C116 74 84 74 76 62 Z" fill="${shade(c, -0.55)}"/>`;
}

function hoodie(p, view, u, zip) {
  const c = p.color;
  const d = shade(c, -0.2);
  const rib = shade(c, -0.14);
  const front = view === 'front';
  const strings = front && !zip
    ? `<g stroke="${shade(c, 0.4)}" stroke-width="1.8" stroke-linecap="round" fill="none">
        <path d="M90 72 L88 114"/><path d="M110 72 L112 114"/></g>
       <circle cx="88" cy="115" r="1.8" fill="${shade(c, 0.4)}"/><circle cx="112" cy="115" r="1.8" fill="${shade(c, 0.4)}"/>`
    : '';
  const pocket = front && !zip
    ? `<path d="M74 152 L126 152 L134 190 L66 190 Z" fill="none" stroke="${d}" stroke-width="1.3"/>
       <path d="M74 152 L66 190 M126 152 L134 190" stroke="${shade(c, -0.3)}" stroke-width="1.1"/>`
    : '';
  const zipper = front && zip
    ? `<path d="M100 74 L100 215" stroke="${shade(c, 0.35)}" stroke-width="2.2" stroke-dasharray="1.6 1.6" fill="none"/>
       <rect x="98" y="76" width="4" height="11" rx="1.4" fill="${shade(c, 0.55)}"/>
       <path d="M66 162 L76 194 M134 162 L124 194" stroke="${d}" stroke-width="1.2" fill="none"/>`
    : '';
  const backSeam = view === 'back'
    ? `<path d="M100 74 L100 214" stroke="${d}" stroke-width=".8" fill="none" opacity=".6"/>`
    : '';
  return `
    ${hoodBehind(c, view)}
    <path d="${BODY}" fill="${c}"/>
    <path d="${HEM}" fill="${rib}"/>
    <path d="${SLEEVE_L}" fill="${c}" stroke="${d}" stroke-width="1"/><path d="${SLEEVE_R}" fill="${c}" stroke="${d}" stroke-width="1"/>
    <path d="${CUFF_L}" fill="${rib}"/><path d="${CUFF_R}" fill="${rib}"/>
    ${hoodOver(c, view)}
    ${backSeam}${strings}${pocket}${zipper}
    ${graphic(p, view, c, u)}
    <g fill="url(#${u}s)"><path d="${BODY}"/><path d="${SLEEVE_L}"/><path d="${SLEEVE_R}"/></g>`;
}

function crew(p, view, u) {
  const c = p.color;
  const d = shade(c, -0.2);
  const rib = shade(c, -0.14);
  const collar = view === 'front'
    ? `<path d="M74 56 C84 78 116 78 126 56 C116 50 84 50 74 56 Z" fill="${rib}"/>
       <path d="M82 58 C88 72 112 72 118 58 C110 56 90 56 82 58 Z" fill="${shade(c, -0.5)}"/>`
    : `<path d="M76 56 C88 64 112 64 124 56 C114 50 86 50 76 56 Z" fill="${rib}"/>`;
  return `
    <path d="M70 58 C86 66 114 66 130 58 L140 84 L140 214 C118 219 82 219 60 214 L60 84 Z" fill="${c}"/>
    <path d="${HEM}" fill="${rib}"/>
    <path d="M70 58 L50 70 C44 110 40 160 38 206 L58 210 C60 160 62 120 66 92 Z" fill="${c}" stroke="${d}" stroke-width="1"/>
    <path d="M130 58 L150 70 C156 110 160 160 162 206 L142 210 C140 160 138 120 134 92 Z" fill="${c}" stroke="${d}" stroke-width="1"/>
    <path d="${CUFF_L}" fill="${rib}"/><path d="${CUFF_R}" fill="${rib}"/>
    ${collar}${graphic(p, view, c, u)}
    <g fill="url(#${u}s)"><path d="${BODY}"/><path d="${SLEEVE_L}"/><path d="${SLEEVE_R}"/></g>`;
}

function tee(p, view, u) {
  const c = p.color;
  const d = shade(c, -0.2);
  const collar = view === 'front'
    ? `<path d="M78 53 C88 76 112 76 122 53 L128 54 C118 84 82 84 72 54 Z" fill="${shade(c, -0.16)}"/>
       <path d="M80 54 C90 70 110 70 120 54 C112 61 88 61 80 54 Z" fill="${shade(c, -0.5)}"/>`
    : `<path d="M78 53 C90 62 110 62 122 53 L128 54 C116 68 84 68 72 54 Z" fill="${shade(c, -0.16)}"/>`;
  return `
    <path d="${TEE_BODY}" fill="${c}"/>
    <path d="M35 102 L61 110 M165 102 L139 110" stroke="${d}" stroke-width="1.2" fill="none"/>
    <path d="M67 114 C69 142 69 172 67 204 M133 114 C131 142 131 172 133 204" stroke="${d}" stroke-width=".8" fill="none" opacity=".5"/>
    ${collar}${graphic(p, view, c, u)}
    <g fill="url(#${u}s)"><path d="${TEE_BODY}"/></g>`;
}

function blazer(p, view, u) {
  const c = p.color;
  const d = shade(c, -0.22);
  const l = shade(c, 0.1);
  const front = view === 'front';
  const sleeves = `
    <path d="M64 58 L46 72 C42 110 40 160 38 206 L58 212 C60 160 62 120 66 92 Z" fill="${c}" stroke="${d}" stroke-width="1"/>
    <path d="M136 58 L154 72 C158 110 160 160 162 206 L142 212 C140 160 138 120 134 92 Z" fill="${c}" stroke="${d}" stroke-width="1"/>
    <path d="M39 196 L59 201 M161 196 L141 201" stroke="${d}" stroke-width="1" fill="none"/>`;
  const detail = front
    ? `<path d="M86 58 L100 54 L114 58 L100 124 Z" fill="${shade(c, -0.55)}"/>
       <path d="M100 52 L78 58 L70 84 L100 146 Z" fill="${l}" stroke="${d}" stroke-width=".8"/>
       <path d="M100 52 L122 58 L130 84 L100 146 Z" fill="${l}" stroke="${d}" stroke-width=".8"/>
       <path d="M100 146 L100 214" stroke="${d}" stroke-width="1" fill="none"/>
       <circle cx="100" cy="160" r="2.6" fill="${shade(c, -0.5)}"/><circle cx="100" cy="184" r="2.6" fill="${shade(c, -0.5)}"/>
       <path d="M66 170 L90 168 M110 168 L134 170" stroke="${d}" stroke-width="2" fill="none"/>
       <path d="M112 102 L128 101" stroke="${d}" stroke-width="1.4" fill="none"/>`
    : `<path d="M80 55 L100 52 L120 55 L120 62 L80 62 Z" fill="${l}"/>
       <path d="M100 62 L100 214 M100 176 L100 214" stroke="${d}" stroke-width="1" fill="none"/>
       <path d="M100 176 L94 214 M100 176 L106 214" stroke="${d}" stroke-width=".8" fill="none"/>`;
  return `
    <path d="${BLAZER_BODY}" fill="${c}"/>
    ${sleeves}${detail}
    <g fill="url(#${u}s)"><path d="${BLAZER_BODY}"/></g>`;
}

const BUILDERS = { hoodie: (p, v, u) => hoodie(p, v, u, false), zip: (p, v, u) => hoodie(p, v, u, true), crew, tee, blazer };

let seq = 0;

// Returns a complete <svg> string for one garment.
function garmentSVG(product, view = 'front', cls = '') {
  const u = `g${seq++}`;
  const body = BUILDERS[product.type](product, view, u);
  return `<svg class="${cls}" viewBox="${VIEWBOX}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${u}s" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".16" stop-color="#000" stop-opacity=".09"/>
        <stop offset=".3" stop-color="#fff" stop-opacity=".05"/><stop offset=".5" stop-color="#000" stop-opacity=".04"/>
        <stop offset=".68" stop-color="#fff" stop-opacity=".06"/><stop offset=".84" stop-color="#000" stop-opacity=".14"/>
        <stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <!-- woven-fabric grain, kept inside the garment's own silhouette -->
      <filter id="${u}f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="7" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 .3" result="g"/>
        <feComposite in="g" in2="SourceAlpha" operator="in" result="grain"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grain"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#${u}f)">${body}</g></svg>`;
}

window.Garments = { garmentSVG, hangRatio, shade };
})();
