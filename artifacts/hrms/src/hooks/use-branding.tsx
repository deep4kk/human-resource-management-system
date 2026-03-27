import { useEffect } from 'react';
import { useGetBranding } from '@workspace/api-client-react';
import { hexToHslString } from '@/lib/utils';

export function useApplyBranding() {
  const { data: branding } = useGetBranding({
    query: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 mins
    }
  });

  useEffect(() => {
    if (!branding) return;

    const root = document.documentElement;

    // Apply Colors
    if (branding.primaryColor) {
      const hsl = hexToHslString(branding.primaryColor);
      if (hsl) root.style.setProperty('--primary', hsl);
    }
    if (branding.accentColor) {
      const hsl = hexToHslString(branding.accentColor);
      if (hsl) root.style.setProperty('--accent', hsl);
    }

    // Apply Theme
    if (branding.theme === 'dark') {
      root.classList.add('dark');
    } else if (branding.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [branding]);

  return branding;
}
