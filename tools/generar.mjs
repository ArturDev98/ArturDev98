// Regenera todo assets/ de forma determinista. Uso: node tools/generar.mjs [carpeta-de-fuentes]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aqui = fileURLToPath(new URL('.', import.meta.url));
const raiz = path.resolve(aqui, '..');
const dirFuentes = path.resolve(process.argv[2] ?? process.env.FUENTES_DIR ?? path.join(raiz, '..', 'arturdev98.github.io', 'fonts'));
const salida = path.join(raiz, 'assets');

// Colores del sitio (estilos.css :root); el claro usa los mismos matices oscurecidos para AA.
const TEMAS = {
  dark: { panel: '#0E161C', borde: '#24333C', celda: '#131E25', ink: '#E8EFF3', suave: '#B9CAD4', mudo: '#8A9EAA',
    cian: '#4FC7D1', verde: '#6FBE8C', ambar: '#E9B35A', sobre: '#07141A', btnTexto: '#07141A', btnRelleno: '#4FC7D1' },
  light: { panel: '#F6F9FB', borde: '#C5D3DB', celda: '#E6EEF2', ink: '#0E161C', suave: '#33485A', mudo: '#4A6070',
    cian: '#0A6B75', verde: '#1D7342', ambar: '#8A5600', sobre: '#FFFFFF', btnTexto: '#FFFFFF', btnRelleno: '#0A6B75' },
};

const FUENTES = {
  ox: { archivo: 'oxanium-latin-wght-normal.woff2', familia: 'Oxanium', peso: 700 },
  t500: { archivo: 'red-hat-text-latin-wght-normal.woff2', familia: 'Red Hat Text', peso: 500 },
  t600: { archivo: 'red-hat-text-latin-wght-normal.woff2', familia: 'Red Hat Text', peso: 600 },
  mono: { archivo: 'red-hat-mono-latin-wght-normal.woff2', familia: 'Red Hat Mono', peso: 500 },
};

// Textos tomados de index.html (data-en / data-es); la tesis se parte en 3 líneas a mano.
const TXT = {
  en: {
    sufijo: '', nombre: 'Arturo Isaza', rol: 'QA Automation · SDET · Bucaramanga, Colombia',
    tesis: [['I find ', ''], ['the bug', 'ambar'], [',', '']], tesis2: [['fix it in the code and', '']],
    tesis3: [['prove it ', ''], ['with data', 'verde'], ['.', '']],
    plano: 'I find the bug, fix it in the code and prove it with data.',
    disp: 'Available immediately', sitio: 'Website', min: ['4.9 min', '2.2 min'],
    cifras: [
      ['89', 'support cases solved by fixing the code myself'],
      ['2×', "faster: the platform's slowest process"],
      ['~1 h', 'from new task to tested code, with AI agents'],
    ],
  },
  es: {
    sufijo: '-es', nombre: 'Arturo Isaza', rol: 'QA Automation · SDET · Bucaramanga, Colombia',
    tesis: [['Encuentro ', ''], ['la falla', 'ambar'], [',', '']], tesis2: [['la corrijo en el código', '']],
    tesis3: [['y lo demuestro ', ''], ['con datos', 'verde'], ['.', '']],
    plano: 'Encuentro la falla, la corrijo en el código y lo demuestro con datos.',
    disp: 'Disponible de inmediato', sitio: 'Sitio web', min: ['4,9 min', '2,2 min'],
    cifras: [
      ['89', 'casos de soporte resueltos corrigiendo yo mismo el código'],
      ['2×', 'más rápido el proceso más lento de la plataforma'],
      ['~1 h', 'de tarea nueva a código probado, con agentes de IA'],
    ],
  },
};

// ---------- utilidades ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (x) => String(Math.round(x * 100) / 100);

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
// Falla la generación si un texto no alcanza AA sobre su fondo.
for (const [nombre, t] of Object.entries(TEMAS)) {
  const pares = [
    [t.ink, t.panel, 'ink'], [t.suave, t.panel, 'suave'], [t.mudo, t.panel, 'mudo'], [t.cian, t.panel, 'cian'],
    [t.verde, t.panel, 'verde'], [t.ambar, t.panel, 'ámbar'], [t.btnTexto, t.btnRelleno, 'botón'],
    [t.sobre, t.verde, 'glifo verde'], [t.sobre, t.ambar, 'glifo ámbar'],
  ];
  for (const [fg, bg, que] of pares) {
    const c = contraste(fg, bg);
    if (c < 4.5) throw new Error(`${nombre}: ${que} ${c.toFixed(2)}:1 < 4.5`);
  }
}

function py(args) {
  return JSON.parse(execFileSync('python', [path.join(aqui, 'fuentes.py')], {
    input: JSON.stringify(args), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' }, maxBuffer: 1 << 26,
  }));
}
const specFuente = (id, texto) => ({ id, archivo: path.join(dirFuentes, FUENTES[id].archivo), peso: FUENTES[id].peso, texto });

// Tabla de avances con todos los caracteres que pueden aparecer en los textos.
const todos = new Set(' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;·×~()-áéíóúñÁÉÍÓÚ¿¡');
const tabla = py({ solo_tabla: true, fuentes: Object.keys(FUENTES).map((id) => specFuente(id, [...todos].join(''))) });
const ancho = (id, tam, texto, ls = 0) => [...texto].reduce((s, c) => s + tabla[id].adv[c] * tam, 0) + ls * texto.length;

function envolver(id, tam, texto, max) {
  const lineas = []; let act = '';
  for (const p of texto.split(' ')) {
    const prueba = act ? `${act} ${p}` : p;
    if (act && ancho(id, tam, prueba) > max) { lineas.push(act); act = p; } else act = prueba;
  }
  lineas.push(act);
  return lineas;
}

function fontFaces(usos) {
  const porFuente = {};
  for (const [id, texto] of usos) porFuente[id] = (porFuente[id] ?? '') + texto;
  const r = py({ fuentes: Object.keys(porFuente).map((id) => specFuente(id, porFuente[id])) });
  return Object.keys(porFuente).map((id) =>
    `@font-face{font-family:'${FUENTES[id].familia}';font-weight:${FUENTES[id].peso};src:url(data:font/woff2;base64,${r[id].b64}) format('woff2')}`).join('\n');
}

function envoltura({ w, h, titulo, css, cuerpo, usos }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<title>${esc(titulo)}</title>
<style>
${fontFaces(usos)}
${css}
</style>
${cuerpo}
</svg>
`;
}

const fam = {
  ox: "font-family:'Oxanium',sans-serif;font-weight:700",
  t500: "font-family:'Red Hat Text',sans-serif;font-weight:500",
  t600: "font-family:'Red Hat Text',sans-serif;font-weight:600",
  mono: "font-family:'Red Hat Mono',monospace;font-weight:500",
};
// Con reduced-motion todo queda en el estado final; los valores base ya son ese estado.
const SIN_MOVIMIENTO = '@media (prefers-reduced-motion: reduce){*{animation:none !important}}';

// ---------- hero ----------
function hero(l, tema) {
  const t = TEMAS[tema];
  const W = 1200, H = 420, X = 56, TAM = 44, LH = 52;
  const lineas = [l.tesis, l.tesis2, l.tesis3];
  const textos = lineas.map((ln) => ln.map((p) => p[0]).join(''));
  const maxLinea = Math.max(...textos.map((s) => ancho('ox', TAM, s)));
  if (maxLinea > 650) throw new Error(`hero tesis ancha: ${maxLinea}`);
  const rolTxt = l.rol.toUpperCase();
  const rolAncho = ancho('mono', 17, rolTxt, 17 * 0.12);
  if (rolAncho > 690) throw new Error(`hero rol ancho: ${rolAncho}`);

  const y0 = 182;
  let tesisSvg = '';
  lineas.forEach((ln, i) => {
    const y = y0 + i * LH;
    let x = X; let tspans = ''; let subr = '';
    for (const [txt, marca] of ln) {
      const wTxt = ancho('ox', TAM, txt);
      tspans += txt;
      if (marca) subr += `<rect x="${n(x)}" y="${y + 9}" width="${n(wTxt)}" height="4" rx="2" fill="${t[marca]}"/>`;
      x += wTxt;
    }
    tesisSvg += `<text x="${X}" y="${y}" class="tesis" xml:space="preserve">${esc(tspans)}</text>${subr}`;
  });

  const pillTxt = ancho('mono', 16, l.disp);
  const pillW = Math.ceil(pillTxt + 58), pillY = 316;
  // Matriz 8x6 a la derecha; el sitio usa la misma idea en su portada.
  const C = 8, R = 6, S = 40, G = 8, mw = C * S + (C - 1) * G, mh = R * S + (R - 1) * G;
  const mx = W - X - mw, my = Math.round((H - mh) / 2);
  const FC = 5, FR = 2;
  let celdas = '';
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const ok = (r * 5 + c * 3 + r * c) % 4 === 0 && !(r === FR && c === FC);
    const x = c * (S + G), y = r * (S + G);
    celdas += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="6" fill="${ok ? t.verde : t.celda}" fill-opacity="${ok ? 0.2 : 1}" stroke="${ok ? t.verde : t.borde}" stroke-opacity="${ok ? 0.55 : 1}"/>\n`;
  }
  const fx = FC * (S + G), fy = FR * (S + G), cx = fx + S / 2, cy = fy + S / 2;
  const marca = (color, glifo) =>
    `<rect x="${fx}" y="${fy}" width="${S}" height="${S}" rx="6" fill="${color}"/><path d="${glifo}" fill="none" stroke="${t.sobre}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const equis = `M${cx - 7} ${cy - 7}L${cx + 7} ${cy + 7}M${cx + 7} ${cy - 7}L${cx - 7} ${cy + 7}`;
  const visto = `M${cx - 8} ${cy + 1}L${cx - 2} ${cy + 7}L${cx + 8} ${cy - 6}`;

  const css = `.nombre{${fam.ox};font-size:56px;fill:${t.ink}}
.tesis{${fam.ox};font-size:${TAM}px;fill:${t.ink};letter-spacing:-0.01em}
.rol{${fam.mono};font-size:17px;letter-spacing:0.12em;fill:${t.mudo}}
.disp{${fam.mono};font-size:16px;fill:${t.ink}}
.halo{opacity:0;transform-box:fill-box;transform-origin:center;animation:pulso 4s ease-out infinite}
.barrido{opacity:0;animation:barrer 8s linear infinite}
.amb{opacity:0;animation:falla 8s ease-in-out infinite}
.ver{opacity:1;animation:corrige 8s ease-in-out infinite}
@keyframes pulso{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(3);opacity:0}}
@keyframes barrer{0%{transform:translateX(-90px);opacity:0}4%{opacity:1}46%{opacity:1}50%{transform:translateX(${mw + 90}px);opacity:0}100%{transform:translateX(${mw + 90}px);opacity:0}}
@keyframes falla{0%,37%{opacity:0}39%,60%{opacity:1}64%,100%{opacity:0}}
@keyframes corrige{0%,62%{opacity:0}68%,93%{opacity:1}98%,100%{opacity:0}}
${SIN_MOVIMIENTO}`;

  const cuerpo = `<defs>
<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${t.cian}" stop-opacity="0"/><stop offset="0.7" stop-color="${t.cian}" stop-opacity="0.32"/><stop offset="1" stop-color="${t.cian}" stop-opacity="0.55"/></linearGradient>
<clipPath id="m"><rect width="${mw}" height="${mh}"/></clipPath>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="${t.panel}" stroke="${t.borde}"/>
<text x="${X}" y="96" class="nombre">${esc(l.nombre)}</text>
<text x="${X}" y="128" class="rol">${esc(rolTxt)}</text>
${tesisSvg}
<rect x="${X}.5" y="${pillY}.5" width="${pillW}" height="40" rx="20" fill="none" stroke="${t.borde}"/>
<circle cx="${X + 22}" cy="${pillY + 20.5}" r="4.5" class="halo" fill="${t.verde}"/>
<circle cx="${X + 22}" cy="${pillY + 20.5}" r="4.5" fill="${t.verde}"/>
<text x="${X + 38}" y="${pillY + 26}" class="disp">${esc(l.disp)}</text>
<g transform="translate(${mx} ${my})">
${celdas}<g class="amb">${marca(t.ambar, equis)}</g>
<g class="ver">${marca(t.verde, visto)}</g>
<g clip-path="url(#m)"><rect class="barrido" x="-90" y="0" width="90" height="${mh}" fill="url(#g)"/></g>
</g>`;
  const titulo = `${l.nombre}. ${l.rol}. ${l.plano} ${l.disp}.`;
  return envoltura({ w: W, h: H, titulo, css, cuerpo, usos: [['ox', l.nombre + textos.join('')], ['mono', rolTxt + l.disp]] });
}

// ---------- cifras ----------
function prueba(l, tema, i) {
  const t = TEMAS[tema];
  const W = 380, H = 170, X = 28;
  const [valor, etq] = l.cifras[i - 1];
  const lineas = envolver('t500', 16, etq, W - 2 * X);
  const textos = lineas.map((s, k) => `<text x="${X}" y="${100 + k * 22}" class="etq">${esc(s)}</text>`).join('\n');
  let barra = '', cssBarra = '', usoMono = '';
  if (i === 2) {
    const fin = 0.449, pw = W - 2 * X, by = 128;
    usoMono = l.min.join('');
    barra = `<rect x="${X}" y="${by}" width="${pw}" height="8" rx="4" fill="${t.celda}" stroke="${t.borde}"/>
<g class="barra"><rect x="${X}" y="${by}" width="${pw}" height="8" rx="4" fill="${t.verde}"/><rect class="viejo" x="${X}" y="${by}" width="${pw}" height="8" rx="4" fill="${t.ambar}"/></g>
<text x="${X}" y="158" class="min" fill="${t.verde}">${esc(l.min[1])}</text>
<text x="${W - X}" y="158" class="min" text-anchor="end" fill="${t.ambar}">${esc(l.min[0])}</text>`;
    cssBarra = `
.barra{transform-box:fill-box;transform-origin:left center;transform:scaleX(${fin});animation:encoge 9s ease-in-out infinite}
.viejo{opacity:0;animation:envejece 9s ease-in-out infinite}
@keyframes encoge{0%,20%{transform:scaleX(1);opacity:1}45%{transform:scaleX(${fin});opacity:1}92%{transform:scaleX(${fin});opacity:1}96%{transform:scaleX(${fin});opacity:0}96.01%{transform:scaleX(1);opacity:0}100%{transform:scaleX(1);opacity:1}}
@keyframes envejece{0%,20%{opacity:1}45%,96%{opacity:0}96.01%,100%{opacity:1}}`;
  }
  const css = `.num{${fam.ox};font-size:60px;fill:${t.cian}}
.etq{${fam.t500};font-size:16px;fill:${t.suave}}
.min{${fam.mono};font-size:13px}${cssBarra}
${SIN_MOVIMIENTO}`;
  const cuerpo = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.panel}" stroke="${t.borde}"/>
<text x="${X}" y="68" class="num">${esc(valor)}</text>
${textos}
${barra}`;
  return envoltura({ w: W, h: H, titulo: `${valor} ${etq}`, css, cuerpo,
    usos: [['ox', valor], ['t500', lineas.join('')], ...(usoMono ? [['mono', usoMono]] : [])] });
}

// ---------- botones ----------
function boton(texto, tema, primario) {
  const t = TEMAS[tema];
  const W = 220, H = 56;
  const css = `.${primario ? "bp" : "bs"}{${fam.t600};font-size:18px;fill:${primario ? t.btnTexto : t.ink}}`;
  const rect = primario
    ? `<rect width="${W}" height="${H}" rx="28" fill="${t.btnRelleno}"/>`
    : `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="27" fill="${t.panel}" stroke="${t.cian}" stroke-width="2"/>`;
  const cuerpo = `${rect}\n<text x="${W / 2}" y="34.5" class="${primario ? "bp" : "bs"}" text-anchor="middle">${esc(texto)}</text>`;
  return envoltura({ w: W, h: H, titulo: texto, css, cuerpo, usos: [['t600', texto]] });
}

// ---------- salida ----------
rmSync(salida, { recursive: true, force: true });
mkdirSync(salida, { recursive: true });
const escribir = (nombre, svg) => writeFileSync(path.join(salida, nombre), svg);
for (const tema of Object.keys(TEMAS)) {
  for (const l of Object.values(TXT)) {
    escribir(`hero${l.sufijo}-${tema}.svg`, hero(l, tema));
    for (const i of [1, 2, 3]) escribir(`proof-${i}${l.sufijo}-${tema}.svg`, prueba(l, tema, i));
    escribir(`btn-sitio${l.sufijo}-${tema}.svg`, boton(l.sitio, tema, true));
  }
  escribir(`btn-cv-${tema}.svg`, boton('CV', tema, false));
  escribir(`btn-linkedin-${tema}.svg`, boton('LinkedIn', tema, false));
}
console.log(`${readdirSync(salida).length} SVG en ${salida}`);
