/**
 * Page-exit fade
 *
 * Intercepts internal navigation links and fades the page out before
 * the browser navigates, so the exit crossfades into the next page's loader.
 */

const FADE_MS = 280;

function shouldIntercept(anchor: HTMLAnchorElement): boolean {
  // Only same-origin, non-hash, non-new-tab links
  if (anchor.origin !== location.origin) return false;
  if (anchor.pathname === location.pathname) return false;
  if (anchor.target === '_blank') return false;
  return true;
}

function initPageExit() {
  document.addEventListener('click', (e) => {
    const anchor = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor || !shouldIntercept(anchor)) return;

    e.preventDefault();
    const dest = anchor.href;

    document.documentElement.classList.add('page-exiting');

    setTimeout(() => {
      window.location.href = dest;
    }, FADE_MS);
  });
}

initPageExit();
