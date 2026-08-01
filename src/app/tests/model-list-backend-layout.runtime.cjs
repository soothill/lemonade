const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const componentPath = path.join(root, 'src/components/ModelListPanel.tsx');
const managerPath = path.join(root, 'src/components/ModelManager.tsx');
const presentationPath = path.join(root, 'src/modelPresentation.ts');
const stylesPath = path.join(root, 'src/styles/styles.css');

const component = fs.readFileSync(componentPath, 'utf8');
const manager = fs.readFileSync(managerPath, 'utf8');
const presentation = fs.readFileSync(presentationPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');

for (const [fileName, source] of [
  [componentPath, component],
  [managerPath, manager],
  [presentationPath, presentation],
]) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(
    errors.length,
    0,
    errors.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'),
  );
}

assert.match(component, /import \{ backendColor, backendCompactLabel, backendLabel \}/);
assert.match(component, /function modelListBackendLabel\(recipe: string\): string \{[\s\S]*backendCompactLabel\(recipe\)\.toUpperCase\(\)/);
assert.match(component, /export function modelBackendReadiness\(/);
for (const state of ['installed', 'update_required', 'update_available', 'installable', 'action_required', 'unsupported']) {
  assert.ok(component.includes(`state === '${state}'`), `missing backend readiness handling for ${state}`);
}
assert.match(component, /tone: 'attention',[\s\S]*backend is not installed on this server/);
assert.match(component, /model-list-item__backend-cluster\$\{hasBackendCornerStatus \? '' : ' model-list-item__backend-cluster--notched'\}/);
assert.match(component, /const hasBackendCornerStatus = status === 'running' \|\| status === 'downloaded';/);
assert.match(component, /model-list-item__backend--status-corner/);
assert.match(component, /model-list-item__backend--notched/);
assert.match(component, /model-list-item__status--corner/);
assert.match(component, /model-list-item__dot--\$\{backendReadiness\.tone\}/);
assert.match(component, /data-backend-state=\{backendReadiness\.state \|\| backendReadiness\.tone\}/);
assert.match(component, /aria-label=\{`\$\{displayName\}[\s\S]*\$\{readinessLabel \? `, \$\{readinessLabel\}` : ''\}`\}/);

const bodyPosition = component.indexOf('className="model-list-item__body"');
const clusterPosition = component.indexOf('className={`model-list-item__backend-cluster');
const backendPosition = component.indexOf('model-list-item__backend ${hasBackendCornerStatus', clusterPosition);
const statusPosition = component.indexOf('model-list-item__status--corner', clusterPosition);
const pinPosition = component.indexOf('model-list-item__pin row__pin', clusterPosition);
assert.ok(bodyPosition >= 0 && clusterPosition > bodyPosition,
  'backend assembly must render to the right of the name/capability block');
assert.ok(backendPosition > clusterPosition && statusPosition > backendPosition && pinPosition > statusPosition,
  'backend plate, corner status, and docked pin must share one ordered assembly');
assert.match(component, /model-list-item__pin row__pin[\s\S]*?<Icon name="pin" size=\{13\}/,
  'the docked pin icon must fill the enlarged 21px attachment without becoming oversized');

assert.match(manager, /const \[systemInfo, setSystemInfo\] = useState<Record<string, unknown> \| null>/);
assert.match(manager, /setSystemInfo\(info\)/);
assert.match(manager, /systemInfo=\{systemInfo\}/);

for (const expected of ['llama.cpp', 'vLLM', 'FLM', 'SD.cpp', 'Moonshine', 'OpenMOSS', 'Collection']) {
  assert.ok(presentation.includes(`compact: '${expected}'`), `missing complete compact backend label: ${expected}`);
}

assert.match(styles, /\.model-list-item\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--model-list-assembly-width\);/s);
assert.match(styles, /--model-list-rule-top-offset:\s*15px;/);
assert.match(styles, /\.model-list-item--has-backend::before\s*\{[^}]*z-index:\s*2;[^}]*top:\s*calc\(50% - var\(--model-list-rule-top-offset\)\);[^}]*right:\s*calc\([\s\S]*var\(--model-list-plate-width\)[\s\S]*var\(--model-list-notch\)\s*\)[^}]*linear-gradient\([\s\S]*transparent 0%/s);
assert.match(styles, /\.model-list-item__backend-cluster\s*\{[^}]*grid-column:\s*2;[^}]*width:\s*var\(--model-list-assembly-width\);[^}]*pointer-events:\s*none;/s);
assert.match(styles, /\.model-list-item__backend\s*\{[^}]*width:\s*var\(--model-list-plate-width\);[^}]*clip-path:\s*polygon\([\s\S]*calc\(100% - var\(--model-list-notch\)\) 0,[\s\S]*white-space:\s*nowrap;/s);
assert.match(styles, /\.model-list-item__backend-cluster--notched::after\s*\{[^}]*inset-block-start:\s*calc\(var\(--model-list-plate-y\) \+ 1px\);[^}]*inset-inline-start:\s*calc\([\s\S]*var\(--model-list-plate-width\) - var\(--model-list-notch\) \+ 1px[\s\S]*width:\s*11\.314px;[^}]*height:\s*1px;[^}]*background:\s*var\(--model-list-frame\);[^}]*transform:\s*rotate\(45deg\) scaleY\(0\.45\);[^}]*transform-origin:\s*left top;/s);
assert.match(styles, /\.model-list-item__status--corner\s*\{[^}]*inset-inline-start:\s*calc\(var\(--model-list-plate-width\) - 7px\);[^}]*width:\s*7px;[^}]*height:\s*7px;/s);
assert.match(styles, /\.model-list-item__dot--attention\s*\{[^}]*background:\s*var\(--status-warning\);/s);
assert.match(styles, /\.model-list-item__pin\s*\{[^}]*pointer-events:\s*auto;/s);
assert.match(styles, /\.model-list-item__pin\s*\{[^}]*inset-block-start:\s*calc\(var\(--model-list-plate-y\) \+ var\(--model-list-notch\)\);[^}]*width:\s*21px;[^}]*height:\s*21px;[^}]*pointer-events:\s*auto;/s);
assert.match(styles, /\.model-list-item__pin svg\s*\{[^}]*transform:\s*translateX\(-1px\) rotate\(90deg\);/s);
assert.match(styles, /\.model-list-item__pin::before\s*\{[^}]*inset-block:\s*0;[^}]*inset-inline-start:\s*5px;[^}]*border-inline-start:\s*0;/s);
assert.match(styles, /@media \(hover: none\), \(pointer: coarse\)[\s\S]*\.model-list-item__pin\s*\{[\s\S]*opacity:\s*0\.72;/s);
assert.match(styles, /@media \(max-width:\s*520px\)[\s\S]*\.model-list-item--has-backend::before\s*\{[^}]*right:\s*calc\([\s\S]*var\(--model-list-plate-width\)[\s\S]*var\(--model-list-notch\)\s*\)/s);

const backendBlock = styles.match(/\.model-list-item__backend\s*\{([\s\S]*?)\n\}/)?.[1] || '';
assert.match(backendBlock, /clip-path:/, 'the original cut-corner geometry must remain available');
assert.doesNotMatch(
  backendBlock,
  /top left\s*\/\s*calc\(100% - var\(--model-list-notch\)\) 1px no-repeat/,
  'the plate must not draw a second top rule; the row owns the single continuous line',
);
assert.doesNotMatch(
  backendBlock,
  /left bottom\s*\/\s*1px/,
  'the open backend plate must not draw a thin left frame',
);
assert.match(
  styles,
  /\.model-list-item__backend::before\s*\{[^}]*inset-block:\s*4px;/s,
  'the backend-color bar must extend slightly while retaining top and bottom gaps',
);
assert.doesNotMatch(backendBlock, /border-radius:/, 'the backend corner must not be rounded');
assert.doesNotMatch(backendBlock, /text-overflow:\s*ellipsis/);
assert.doesNotMatch(backendBlock, /overflow:\s*hidden/);

console.log('Model list backend/readiness layout contract checks passed.');
