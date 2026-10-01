// Varre o build final (.output/chrome-mv3) e FALHA se encontrar eval(...) ou
// new Function(...). O MV3 já bloquearia isso no Chrome, mas preferimos
// descobrir no CI (inclusive se vier de alguma dependência) e não no navegador.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = '.output/chrome-mv3';

// (?<![\w$.]) = "não precedido de letra, $ ou ponto": ignora coisas como
// obj.evaluate( ou myeval(.
const FORBIDDEN = [
  { name: 'eval(...)', regex: /(?<![\w$.])eval\s*\(/ },
  { name: 'new Function(...)', regex: /new\s+Function\s*\(/ },
];

/** Lista recursivamente todos os arquivos .js de uma pasta. */
function listJsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listJsFiles(path);
    return path.endsWith('.js') ? [path] : [];
  });
}

let files;
try {
  files = listJsFiles(OUTPUT_DIR);
} catch {
  console.error(`Pasta ${OUTPUT_DIR} não encontrada. Rode "npm run build" antes.`);
  process.exit(1);
}

const problems = [];
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  for (const { name, regex } of FORBIDDEN) {
    if (regex.test(code)) problems.push(`${file}: contém ${name}`);
  }
}

if (problems.length > 0) {
  console.error('Código proibido encontrado no build:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`OK: ${files.length} arquivo(s) .js verificados, sem eval/new Function.`);
