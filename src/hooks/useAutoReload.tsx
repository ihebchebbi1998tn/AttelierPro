import { useEffect } from 'react';

/**
 * Hook to automatically reload the page after 24 hours of continuous use
 * This ensures users always have the latest version of the app
 */
export const useAutoReload = () => {
  useEffect(() => {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const LAST_RELOAD_KEY = 'lastPageReloadTime';

    // Get the last reload time from localStorage
    const lastReloadTime = localStorage.getItem(LAST_RELOAD_KEY);
    const now = Date.now();

    // If no last reload time exists, set it now
    if (!lastReloadTime) {
      localStorage.setItem(LAST_RELOAD_KEY, now.toString());
      console.log('🔄 Auto-reload timer started');
      return;
    }

    // Calculate time since last reload
    const timeSinceLastReload = now - parseInt(lastReloadTime);

    // If 24 hours have passed, reload the page
    if (timeSinceLastReload >= TWENTY_FOUR_HOURS) {
      console.log('🔄 24 hours passed, reloading page to get latest version...');
      localStorage.setItem(LAST_RELOAD_KEY, now.toString());
      window.location.reload();
      return;
    }

    // Calculate remaining time until next reload
    const timeUntilReload = TWENTY_FOUR_HOURS - timeSinceLastReload;
    
    console.log(`🔄 Auto-reload scheduled in ${Math.round(timeUntilReload / (60 * 60 * 1000))} hours`);

    // Set a timeout to reload after the remaining time
    const reloadTimeout = setTimeout(() => {
      console.log('🔄 Auto-reloading page to ensure latest version...');
      localStorage.setItem(LAST_RELOAD_KEY, Date.now().toString());
      window.location.reload();
    }, timeUntilReload);

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(reloadTimeout);
    };
  }, []);
};
