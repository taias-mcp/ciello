/**
 * Build script for Ciello ChatGPT widgets
 * 
 * Builds each widget with JS/CSS inlined directly into HTML.
 * This eliminates the need for a separate asset server.
 */

import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Single unified widget handles all onboarding steps
const WIDGETS = [
  'ciello-onboarding',
];

async function buildWidgets() {
  console.log('🔨 Building Ciello widgets (inline mode)...\n');

  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  for (const name of WIDGETS) {
    console.log(`Building ${name}...`);

    const entryPath = path.join(__dirname, 'src', 'widgets', name, 'index.tsx');
    
    if (!fs.existsSync(entryPath)) {
      console.error(`  ❌ Entry not found: ${entryPath}`);
      continue;
    }

    try {
      // Build the widget as a standard app (not library mode)
      await build({
        configFile: false,
        root: __dirname,
        mode: 'production',
        plugins: [
          // Skip react plugin - use esbuild's JSX transform instead
          tailwindcss(),
        ],
        build: {
          outDir: `assets-temp/${name}`,
          emptyOutDir: true,
          rollupOptions: {
            input: entryPath,
            output: {
              entryFileNames: 'index.js',
              chunkFileNames: '[name].js',
              assetFileNames: '[name].[ext]',
              // Inline all chunks into single file
              manualChunks: undefined,
              inlineDynamicImports: true,
            },
          },
          cssCodeSplit: false,
          minify: true,
          sourcemap: false,
        },
        esbuild: {
          jsx: 'automatic',
          jsxImportSource: 'react',
          jsxDev: false, // Force production JSX (jsx, not jsxDEV)
        },
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
        logLevel: 'warn',
      });

      // Read the built JS and CSS files from temp directory
      const tempDir = path.join(__dirname, `assets-temp/${name}`);
      const jsPath = path.join(tempDir, 'index.js');
      
      // CSS may be named index.css or style.css depending on Vite version
      let cssContent = '';
      const cssFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.css'));
      if (cssFiles.length > 0) {
        cssContent = fs.readFileSync(path.join(tempDir, cssFiles[0]), 'utf-8');
        console.log(`    Found CSS: ${cssFiles[0]} (${(cssContent.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`    ⚠️  No CSS file found in ${tempDir}`);
      }
      
      const jsContent = fs.existsSync(jsPath) 
        ? fs.readFileSync(jsPath, 'utf-8') 
        : '';

      if (!jsContent) {
        console.error(`  ❌ No JS output for ${name}`);
        continue;
      }

      // Generate self-contained HTML with inlined assets
      // SDK provides all theming via @openai/apps-sdk-ui/css
      const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${cssContent}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module">${jsContent}</script>
</body>
</html>`;

      fs.writeFileSync(path.join(assetsDir, `${name}.html`), html, 'utf-8');
      
      const htmlSize = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
      console.log(`  ✅ ${name}.html (${htmlSize} KB, self-contained)`);
    } catch (error) {
      console.error(`  ❌ Build failed for ${name}:`, error);
    }
  }

  // Clean up temp directories
  const tempBase = path.join(__dirname, 'assets-temp');
  if (fs.existsSync(tempBase)) {
    fs.rmSync(tempBase, { recursive: true });
  }

  console.log('\n✨ Build complete!');
  console.log('\nWidgets are self-contained - no asset server needed.');
  console.log('Start the MCP server:\n  cd ../server && npm run start:http');
}

buildWidgets().catch(console.error);
