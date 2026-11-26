// When the "Back to top" button appears: once the reader is well below the first
// screen, so short pages never show it and long ones show it after about two screens.

export const BACK_TO_TOP_MIN_SCROLL = 600;
export const BACK_TO_TOP_VIEWPORTS = 1.5;

export function shouldShowBackToTop(scrollY: number, viewportHeight: number): boolean {
  if (!Number.isFinite(scrollY) || !Number.isFinite(viewportHeight)) return false;
  return scrollY > Math.max(BACK_TO_TOP_MIN_SCROLL, viewportHeight * BACK_TO_TOP_VIEWPORTS);
}
