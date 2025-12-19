import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    console.log('Building with mode:', mode);
    // 根据模式加载不同的环境文件
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      esbuild: {
        jsxDev: mode !== 'production',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // 构建配置
      build: {
        // 确保环境变量在构建时被正确包含
        minify: mode === 'production' ? 'terser' : 'esbuild',
        sourcemap: mode !== 'production',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              charts: ['recharts'],
              ui: ['lucide-react']
            }
          }
        }
      }
    };
});