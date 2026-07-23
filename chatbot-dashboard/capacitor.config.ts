import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.aamy.app',
  appName: 'Aamy',
  webDir: 'public',

  server: {
    url: 'https://www.aamy.ai/login',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;