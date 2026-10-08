import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/gh-api/device': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gh-api\/device/, '/login/device/code'),
      },
      '/gh-api/token': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gh-api\/token/, '/login/oauth/access_token'),
      },
      '/gh-api/user': {
        target: 'https://api.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gh-api\/user/, '/user'),
      },
    },
  },
});
