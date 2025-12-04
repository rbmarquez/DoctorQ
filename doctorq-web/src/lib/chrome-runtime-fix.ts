"use client";

export function applyChromeRuntimeFixes() {
  if (typeof window === "undefined") return;

  // Check if it's Chrome
  const isChrome =
    /Chrome/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor) &&
    !/Edg/.test(navigator.userAgent);

  if (!isChrome) return;

  console.log("🔧 Applying Chrome runtime fixes for DoctorQ admin...");

  // Function to fix element backgrounds
  const fixElementBackgrounds = () => {
    // Fix cards
    const cards = document.querySelectorAll('[data-slot="card"], [data-slot="card-content"], .bg-card');
    cards.forEach((card) => {
      const element = card as HTMLElement;
      const computedStyle = window.getComputedStyle(element);

      // Check if background is transparent or black
      if (
        computedStyle.backgroundColor === 'transparent' ||
        computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ||
        computedStyle.backgroundColor === 'rgb(0, 0, 0)' ||
        computedStyle.backgroundColor === ''
      ) {
        element.style.backgroundColor = '#ffffff';
        element.style.color = '#111827';
      }
    });

    // Fix buttons
    const buttons = document.querySelectorAll('[data-slot="button"], button');
    buttons.forEach((button) => {
      const element = button as HTMLElement;
      const computedStyle = window.getComputedStyle(element);

      if (
        computedStyle.backgroundColor === 'transparent' ||
        computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ||
        computedStyle.backgroundColor === 'rgb(0, 0, 0)'
      ) {
        element.style.backgroundColor = '#ffffff';
        element.style.border = '1px solid #e5e7eb';
      }
    });

    // Fix badges
    const badges = document.querySelectorAll('[data-slot="badge"]');
    badges.forEach((badge) => {
      const element = badge as HTMLElement;

      // Check classes and apply appropriate colors
      if (element.classList.contains('bg-red-100')) {
        element.style.backgroundColor = '#fee2e2';
        element.style.color = '#991b1b';
      } else if (element.classList.contains('bg-green-100')) {
        element.style.backgroundColor = '#dcfce7';
        element.style.color = '#166534';
      } else if (element.classList.contains('bg-blue-100')) {
        element.style.backgroundColor = '#dbeafe';
        element.style.color = '#1e40af';
      } else if (element.classList.contains('bg-purple-100')) {
        element.style.backgroundColor = '#f3e8ff';
        element.style.color = '#6b21a8';
      }
    });

    // Fix tabs
    const tabLists = document.querySelectorAll('[data-slot="tabs-list"], [role="tablist"]');
    tabLists.forEach((tabList) => {
      const element = tabList as HTMLElement;
      element.style.backgroundColor = '#f3f4f6';

      // Fix individual tabs
      const tabs = element.querySelectorAll('button, [role="tab"]');
      tabs.forEach((tab) => {
        const tabElement = tab as HTMLElement;
        if (tabElement.getAttribute('aria-selected') === 'true' ||
            tabElement.getAttribute('data-state') === 'active') {
          tabElement.style.backgroundColor = '#ffffff';
          tabElement.style.color = '#111827';
        } else {
          tabElement.style.backgroundColor = 'transparent';
          tabElement.style.color = '#6b7280';
        }
      });
    });

    // Fix muted backgrounds
    const mutedElements = document.querySelectorAll('.bg-muted');
    mutedElements.forEach((el) => {
      const element = el as HTMLElement;
      element.style.backgroundColor = '#f3f4f6';
    });

    const mutedTextElements = document.querySelectorAll('.text-muted-foreground');
    mutedTextElements.forEach((el) => {
      const element = el as HTMLElement;
      element.style.color = '#6b7280';
    });

    // Fix any div with suspicious backgrounds
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach((div) => {
      const element = div as HTMLElement;
      const computedStyle = window.getComputedStyle(element);

      // Only fix if element has content and background is problematic
      if (
        element.textContent?.trim() &&
        (computedStyle.backgroundColor === 'rgb(0, 0, 0)' ||
         computedStyle.backgroundColor === 'rgba(0, 0, 0, 1)')
      ) {
        element.style.backgroundColor = '#ffffff';
      }
    });
  };

  // Apply fixes immediately
  fixElementBackgrounds();

  // Apply fixes after a short delay to catch dynamically loaded content
  setTimeout(fixElementBackgrounds, 100);
  setTimeout(fixElementBackgrounds, 500);

  // Watch for DOM changes and reapply fixes
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldFix = true;
      }
    });

    if (shouldFix) {
      requestAnimationFrame(fixElementBackgrounds);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Clean up observer when page unloads
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });

  console.log("✅ Chrome runtime fixes applied successfully");
}