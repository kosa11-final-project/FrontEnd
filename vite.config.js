import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

function reiconModularizePlugin() {
  return {
    name: 'vite-plugin-reicon-modularize',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules') || !/\.(jsx?|tsx?)$/.test(id)) return null;
      if (!code.includes('reicon-react')) return null;

      // import { A, B } from 'reicon-react'; 형태를 개별 파일 import로 자동 변환
      const transformed = code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]reicon-react['"]/g, (_, imports) => {
        const namedImports = imports
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        return namedImports
          .map((named) => {
            const parts = named.split(/\s+as\s+/);
            const importedName = parts[0].trim();
            const localName = (parts[1] || parts[0]).trim();
            return `import ${localName} from 'reicon-react/icons/${importedName}'`;
          })
          .join(';\n');
      });

      return { code: transformed, map: null };
    },
  };
}

export default defineConfig(({ mode }) => {
  const runtimeEnv = loadEnv(mode, process.cwd(), '');
  const proxyTarget = runtimeEnv.VITE_API_PROXY_TARGET?.trim();

  return {
    plugins: [reiconModularizePlugin(), react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('reicon-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@tanstack/react-table') || id.includes('@tanstack/table-core')) {
                return 'vendor-tanstack-table';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-tanstack-query';
              }
              if (id.includes('@tanstack')) {
                return 'vendor-tanstack';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      ...(proxyTarget
        ? {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
    preview: {
      port: 5173,
      strictPort: false,
      ...(proxyTarget
        ? {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
  };
});
