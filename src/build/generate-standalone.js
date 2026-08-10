const pathUtil = require('path');
const fs = require('fs');
const glob = require('glob');

const dist = pathUtil.join(__dirname, '..', '..', 'dist');
console.log(`dist: ${dist}`);

const scaffoldingFiles = glob.sync('scaffolding/*.js', {
  cwd: dist
});
console.log(`scaffolding: ${scaffoldingFiles.join(', ')}`);
const scaffoldingAssets = {};
for (const path of scaffoldingFiles) {
  if (path.includes('extension-worker')) continue;
  scaffoldingAssets[path] = fs.readFileSync(pathUtil.join(dist, path), 'utf8');
}

const indexPath = pathUtil.join(dist, 'index.html');
console.log(`index.html: ${indexPath}`);
const indexContent = fs.readFileSync(indexPath, 'utf8');

const jsPath = pathUtil.join(dist, indexContent.match(/<script src="(.*)"><\/script>/)[1]);
console.log(`packager.js: ${jsPath}`);
const jsContent = fs.readFileSync(jsPath, 'utf8');

// 内联所有 webpack chunk 文件
const jsDir = pathUtil.join(dist, 'js');
const allJSFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort((a, b) => {
  // vendor chunks 排在前面
  const aIsVendor = a.startsWith('vendors~');
  const bIsVendor = b.startsWith('vendors~');
  if (aIsVendor !== bIsVendor) return aIsVendor ? -1 : 1;
  return a.localeCompare(b);
});
const chunkContents = {};
for (const file of allJSFiles) {
  const fullPath = pathUtil.join(jsDir, file);
  // 跳过主入口文件（已经单独内联）
  if (pathUtil.resolve(fullPath) === pathUtil.resolve(jsPath)) continue;
  chunkContents[file] = fs.readFileSync(fullPath, 'utf8');
  console.log(`chunk: js/${file} (${Buffer.byteLength(chunkContents[file])} bytes)`);
}

const faviconPath = pathUtil.join(__dirname, '../../static/favicon.ico');
const faviconData = fs.existsSync(faviconPath) ? fs.readFileSync(faviconPath) : null;
console.log(`favicon.ico: ${faviconData ? faviconPath : 'none'}`);

const makeSafeForInlineScript = (content) => content.replace(/<\/script>/g, '\\u003c/script>');
let standaloneJS = '';
standaloneJS += Object.entries(scaffoldingAssets).map(([name, content]) => (
  `<script type="p4-standalone-asset" data-name="${name}">${makeSafeForInlineScript(content)}</script>`
)).join('');
standaloneJS += `<script>
window.__ASSETS__ = {};
for (const el of Array.from(document.querySelectorAll('script[type="p4-standalone-asset"]'))) {
  __ASSETS__[el.dataset.name] = el.textContent;
  el.remove();
}
</script>`;
// 内联所有 webpack chunks（让动态 import 能找到它们）
standaloneJS += Object.entries(chunkContents).map(([name, content]) => (
  `<script data-webpack-chunk="${name}">${makeSafeForInlineScript(content)}</script>`
)).join('');

let newContent = indexContent;
if (faviconData) {
  newContent = newContent.replace(/<\/head>/, `<link rel="shortcut icon" href="data:image/vnd.microsoft.icon;base64,${faviconData.toString('base64')}"></head>`);
}
newContent = newContent.replace(/<script src=".*"><\/script>/, () => (
  `${standaloneJS}<script>${makeSafeForInlineScript(jsContent)}</script>`
));

const standalonePath = pathUtil.join(dist, 'standalone.html');
console.log(`standalone.html: ${standalonePath}`);
fs.writeFileSync(standalonePath, newContent);
