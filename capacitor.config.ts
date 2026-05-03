import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.173356b8214042adba57ca70a8c1df7c',
  appName: 'Cnergise',
  webDir: 'dist',
  server: {
    url: 'https://173356b8-2140-42ad-ba57-ca70a8c1df7c.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0f172a',
  },
  android: {
    backgroundColor: '#0f172a',
  },
};

export default config;
