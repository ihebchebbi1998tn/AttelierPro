import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f3c05e0ea17c4d2ea85e6a7af87ec483',
  appName: 'hello-strt-simple',
  webDir: 'dist',
  server: {
    url: 'https://f3c05e0e-a17c-4d2e-a85e-6a7af87ec483.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;