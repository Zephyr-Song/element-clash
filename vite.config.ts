import { defineConfig } from 'vite';

export default defineConfig({
  base: '/element-clash/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // 沙箱安全删除 shim 拦截 rm 且回收站不可用，emptyOutDir 会触发崩溃；
    // 改为 false，构建前用 mv 把旧 dist 移出（见 npm run build 脚本）。
    emptyOutDir: false,
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
