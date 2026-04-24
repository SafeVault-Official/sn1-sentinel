import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/sn1-sentinel/',
  plugins: [react()],
});
