import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const configs = [
  // Extension host (Node.js)
  {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode', '@resvg/resvg-js'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
  },
  // Webview JS (Browser)
  {
    entryPoints: ['src/webview/main.ts'],
    bundle: true,
    outfile: 'dist/webview.js',
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
  },
  // Webview CSS
  {
    entryPoints: ['src/webview/styles.css'],
    bundle: true,
    outfile: 'dist/webview.css',
  },
];

if (watch) {
  const contexts = await Promise.all(configs.map((c) => esbuild.context(c)));
  await Promise.all(contexts.map((c) => c.watch()));
  console.log('Watching for changes...');
} else {
  await Promise.all(configs.map((c) => esbuild.build(c)));
  console.log('Build complete');
}
