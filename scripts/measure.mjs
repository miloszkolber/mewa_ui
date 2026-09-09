import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const root = path.resolve(import.meta.dirname, '..');
const directory = path.join(root, 'dist/mewa-ui');
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
const measure = (relative) => {
  const bytes = fs.readFileSync(path.join(directory, relative));
  return { file: relative, bytes: bytes.length, gzip: gzipSync(bytes).length };
};
const controllers = manifest.components
  .filter((component) => component.controller)
  .map((component) => measure(component.controller));
const automatic = [
  'auto.js',
  ...manifest.components.filter((component) => component.auto).map((component) => component.auto)
].map(measure);
const runtime = ['runtime/core.js', 'runtime/enhancer.js'].map(measure);
const componentStyles = manifest.components.map((component) => measure(component.css));
const sum = (entries, field) => entries.reduce((total, entry) => total + entry[field], 0);
const result = {
  version: manifest.version,
  note: 'Individual gzip streams approximate separate HTTP responses. Actual transfer depends on server compression and cache state.',
  css: measure('css/all.css'),
  componentStyles,
  componentStyleResponsesGzip: sum(componentStyles, 'gzip'),
  componentStyleResponsesBytes: sum(componentStyles, 'bytes'),
  controllers,
  automatic,
  runtime,
  allControllerResponsesGzip: controllers.reduce((total, entry) => total + entry.gzip, 0),
  automaticResponsesGzip: automatic.reduce((total, entry) => total + entry.gzip, 0),
  runtimeResponsesGzip: runtime.reduce((total, entry) => total + entry.gzip, 0)
};
fs.writeFileSync(path.join(root, 'dist/size-report.json'), JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    css: result.css.gzip,
    componentStyles: result.componentStyleResponsesGzip,
    controllers: result.allControllerResponsesGzip,
    runtime: result.runtimeResponsesGzip
  })
);
