
// Demo mode configuration for Review Rocket
// This allows the app to work with sample data when no backend is connected

const DEMO_MODE_KEY = 'reviewRocket_demoMode';

export const isDemoMode = (): boolean => {
  // Check if demo mode is explicitly set
  const stored = localStorage.getItem(DEMO_MODE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  
  // Default to false for production Review Rocket app
  return false;
};

export const setDemoMode = (enabled: boolean): void => {
  localStorage.setItem(DEMO_MODE_KEY, enabled.toString());
  console.log(`🎭 Demo mode ${enabled ? 'enabled' : 'disabled'}`);
};

export const toggleDemoMode = (): boolean => {
  const newMode = !isDemoMode();
  setDemoMode(newMode);
  return newMode;
};
