
export const isDemoMode = (): boolean => {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') {
    return true;
  }
  
  // Check localStorage
  const demoFlag = localStorage.getItem('demo-mode');
  if (demoFlag === 'true') {
    return true;
  }
  
  // Remove hostname detection to prevent accidental demo mode
  return false;
};

export const setDemoMode = (enabled: boolean): void => {
  localStorage.setItem('demo-mode', enabled.toString());
  
  // Update URL parameter
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set('demo', 'true');
  } else {
    url.searchParams.delete('demo');
  }
  window.history.replaceState({}, '', url.toString());
};

export const exitDemoMode = (): void => {
  localStorage.removeItem('demo-mode');
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  window.history.replaceState({}, '', url.toString());
  window.location.reload();
};

export const activateDemoMode = (): void => {
  console.log('[DemoConfig] Activating demo mode...');
  
  // Set both localStorage and URL parameter
  localStorage.setItem('demo-mode', 'true');
  
  // Update URL without triggering a page reload
  const url = new URL(window.location.href);
  url.searchParams.set('demo', 'true');
  window.history.replaceState({}, '', url.toString());
  
  // Force a page reload to ensure demo mode is properly activated
  window.location.reload();
};
