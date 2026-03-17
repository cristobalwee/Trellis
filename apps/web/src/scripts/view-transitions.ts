/**
 * View Transition Controller
 *
 * Two transition modes based on route:
 *   Mode A — Loader transition: navigating to/from /generate
 *   Mode B — Simple crossfade (Astro default): all other navigation
 */

const GENERATE_PATH = '/generate';
const LOADER_DISPLAY_MS = 1350;

function isGenerateRoute(url: URL): boolean {
  const p = url.pathname;
  return p === GENERATE_PATH || p === `${GENERATE_PATH}/`;
}

function needsLoaderTransition(from: URL, to: URL): boolean {
  return isGenerateRoute(from) || isGenerateRoute(to);
}

// ---------------------------------------------------------------------------
// Loader helpers
// ---------------------------------------------------------------------------

function getLoader(): HTMLElement | null {
  return document.getElementById('trellis-loader');
}

function ensureTransitionMode(loader: HTMLElement) {
  if (loader.dataset.loaderMode === 'initial') {
    loader.getAnimations().forEach(a => a.cancel());
    const logo = loader.querySelector('.loader-logo') as HTMLElement | null;
    if (logo) logo.getAnimations().forEach(a => a.cancel());
  }
  loader.dataset.loaderMode = 'transition';
  loader.classList.remove('loader-visible');
  loader.style.removeProperty('opacity');
  loader.style.removeProperty('pointer-events');
  const logo = loader.querySelector('.loader-logo') as HTMLElement | null;
  if (logo) logo.style.removeProperty('opacity');
}

function showLoader(loader: HTMLElement) {
  ensureTransitionMode(loader);
  void loader.offsetHeight; // force reflow so transition fires
  loader.classList.add('loader-visible');
}

function hideLoader(loader: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const logo = loader.querySelector('.loader-logo') as HTMLElement | null;
    if (logo) {
      logo.getAnimations().forEach(a => a.cancel());
      logo.style.opacity = '0';
    }

    loader.classList.remove('loader-visible');

    const cleanup = () => {
      loader.style.removeProperty('opacity');
      loader.style.removeProperty('pointer-events');
      resolve();
    };

    loader.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 450); // fallback
  });
}

// ---------------------------------------------------------------------------
// Lifecycle event handlers
// ---------------------------------------------------------------------------

function init() {
  // Prevent duplicate listeners if script re-runs
  if ((window as any).__trellisTransitionsInit) return;
  (window as any).__trellisTransitionsInit = true;

  document.addEventListener('astro:before-preparation', ((e: any) => {
    const from: URL = e.from;
    const to: URL = e.to;

    if (!needsLoaderTransition(from, to)) {
      (window as any).__trellisLoaderTransition = false;
      return;
    }

    (window as any).__trellisLoaderTransition = true;
    const originalLoader = e.loader;

    e.loader = async () => {
      const loader = getLoader();
      if (loader) showLoader(loader);

      // Fetch new page in parallel with loader animation
      await Promise.all([
        originalLoader(),
        new Promise<void>(r => setTimeout(r, LOADER_DISPLAY_MS)),
      ]);
    };
  }) as EventListener);

  document.addEventListener('astro:after-swap', () => {
    if ((window as any).__trellisLoaderTransition) {
      const loader = getLoader();
      if (loader) {
        // The loader persisted via transition:persist — it's still visible.
        // Re-ensure transition mode (in case the new page's script re-initialized it)
        loader.dataset.loaderMode = 'transition';
        // Keep it visible briefly, then fade out
        loader.classList.add('loader-visible');
        loader.style.removeProperty('opacity');
        loader.style.removeProperty('pointer-events');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            hideLoader(loader);
          });
        });
      }
      (window as any).__trellisLoaderTransition = false;
    }
  });
}

init();
