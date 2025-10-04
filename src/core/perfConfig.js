// Performance configuration and quality presets
// You can extend this with shadow map size, postprocessing toggles, etc.

export const QualityPresets = {
  low: {
    label: 'Low',
    maxPixelRatio: 1.25,
    anisotropy: 2,
    useShadows: false,
  },
  medium: {
    label: 'Medium',
    maxPixelRatio: 1.75,
    anisotropy: 4,
    useShadows: false,
  },
  high: {
    label: 'High',
    maxPixelRatio: 2.0,
    anisotropy: 8,
    useShadows: false,
  }
};

export function autoSelectQuality() {
  // Heuristic: prefer medium for most, low for very low memory, high for > 6 GiB memory & desktop-ish screens
  const mem = navigator.deviceMemory || 4; // in GiB (not supported everywhere)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (mem <= 3 || isMobile) return 'low';
  if (mem >= 6 && window.innerWidth > 1400) return 'high';
  return 'medium';
}
