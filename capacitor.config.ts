import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.766a42309c8b4c4da0bd3a1a1fe67567',
  appName: 'app-craft-studio-06',
  webDir: 'dist',
  server: {
    url: 'https://766a4230-9c8b-4c4d-a0bd-3a1a1fe67567.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
