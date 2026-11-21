// Revisa assets/*.svg: peso, XML bien formado, sin referencias externas, con título y con reduced-motion.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', 'assets');
const LIMITE = 150 * 1024;
const OBJETIVO = [['hero', 60], ['proof', 30], ['btn', 15]];

// Comprobador mínimo de buen formado: etiquetas anidadas, atributos entre comillas, entidades válidas.
function xmlValido(s) {
  const pila = [];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>|<|([^<]+)/g;
  let m; let raiz = 0;
  while ((m = re.exec(s))) {
    if (m[0] === '<') return 'etiqueta mal formada';
    if (m[5] !== undefined) {
      if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(m[5])) return 'entidad inválida';
      if (!pila.length && m[5].trim()) return 'texto fuera de la raíz';
      continue;
    }
    if (!m[2]) continue;
    if (m[1]) { if (pila.pop() !== m[2]) return `cierre inesperado </${m[2]}>`; } else {
      if (!pila.length && ++raiz > 1) return 'más de una raíz';
      if (!m[4]) pila.push(m[2]);
    }
  }
  return pila.length ? `sin cerrar <${pila.pop()}>` : raiz ? null : 'sin raíz';
}

let fallos = 0;
const archivos = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
for (const f of archivos) {
  const s = readFileSync(path.join(dir, f), 'utf8');
  const kb = statSync(path.join(dir, f)).size / 1024;
  const errores = [];
  if (kb * 1024 >= LIMITE) errores.push(`pesa ${kb.toFixed(1)} KB (>= 150)`);
  const xml = xmlValido(s);
  if (xml) errores.push(`XML: ${xml}`);
  const sinXmlns = s.replace(/xmlns(?::\w+)?="[^"]*"/g, '');
  if (/https?:\/\//i.test(sinXmlns)) errores.push('referencia http(s)');
  if (/(?:href|src)\s*=\s*["'](?!#)/i.test(sinXmlns)) errores.push('href/src externo');
  if (/url\(\s*["']?(?!#|data:)/i.test(sinXmlns)) errores.push('url() externo');
  if (/<script|<foreignObject|@import/i.test(s)) errores.push('script, foreignObject o @import');
  if (!/<title>[^<]+<\/title>/.test(s) || !/role="img"/.test(s)) errores.push('falta <title> o role="img"');
  if (/@keyframes|animation\s*:/.test(s) && !/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(s)) errores.push('anima sin prefers-reduced-motion');
  const meta = OBJETIVO.find(([p]) => f.startsWith(p))?.[1];
  const aviso = meta && kb > meta ? ` (sobre el objetivo de ${meta} KB)` : '';
  console.log(`${errores.length ? 'FALLA' : 'ok   '} ${f.padEnd(24)} ${kb.toFixed(1).padStart(6)} KB${aviso}${errores.length ? '  ' + errores.join('; ') : ''}`);
  if (errores.length) fallos++;
}
console.log(`${archivos.length} archivos, ${fallos} con fallos`);
process.exit(fallos ? 1 : 0);
