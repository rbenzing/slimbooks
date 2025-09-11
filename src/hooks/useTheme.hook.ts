import { useState, useEffect, useCallback } from 'react';

export type ThemeType = 'light' | 'dark' | 'system';

// Global theme state to persist across navigation
let globalTheme: ThemeType = 'system';
let globalEffectiveTheme: 'light' | 'dark' = 'light';
let isThemeInitialized = false;
let initializationPromise: Promise<void> | null = null;
let isUserSetTheme = false; // Track if theme was explicitly set by user

// Only reset initialization on actual page reload, not on navigation
if (typeof window !== 'undefined') {
  // Use pageshow event instead of beforeunload to avoid navigation interference
  window.addEventListener('pageshow', (event) => {
    // Only reset if this is a real page reload (not navigation)
    if (event.persisted === false && performance.navigation.type === 1) {
      console.log('useTheme: Actual page reload detected, resetting theme initialization');
      isThemeInitialized = false;
      initializationPromise = null;
      isUserSetTheme = false; // Reset user theme flag on actual reload
    }
  });
}

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(globalTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(globalEffectiveTheme);

  // Sync local state with global state on mount
  useEffect(() => {
    if (isThemeInitialized && (theme !== globalTheme || effectiveTheme !== globalEffectiveTheme)) {
      console.log('useTheme: Syncing local state with global state', { 
        global: globalTheme, 
        local: theme,
        globalEffective: globalEffectiveTheme,
        localEffective: effectiveTheme
      });
      setTheme(globalTheme);
      setEffectiveTheme(globalEffectiveTheme);
    }
  }, []);

  const getEffectiveTheme = useCallback((selectedTheme: ThemeType): 'light' | 'dark' => {
    if (selectedTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return selectedTheme;
  }, []);

  const applyTheme = useCallback((selectedTheme: ThemeType) => {
    const root = document.documentElement;
    const effective = getEffectiveTheme(selectedTheme);
    
    root.classList.toggle('dark', effective === 'dark');
    setEffectiveTheme(effective);
    
    // Update global state
    globalTheme = selectedTheme;
    globalEffectiveTheme = effective;
  }, [getEffectiveTheme]);

  // Load theme from database only once on initial app load
  useEffect(() => {
    const loadTheme = async () => {
      if (isThemeInitialized) {
        console.log('useTheme: Already initialized, using global theme:', globalTheme);
        // Ensure local state matches global state
        setTheme(globalTheme);
        setEffectiveTheme(globalEffectiveTheme);
        return; // Don't reload if already initialized
      }
      
      // If theme was explicitly set by user, don't override with database
      if (isUserSetTheme) {
        console.log('useTheme: User has explicitly set theme, skipping database load');
        setTheme(globalTheme);
        setEffectiveTheme(globalEffectiveTheme);
        return;
      }
      
      // Use a shared initialization promise to prevent race conditions
      if (initializationPromise) {
        console.log('useTheme: Waiting for existing initialization promise');
        await initializationPromise;
        // After waiting, update local state to match global state
        setTheme(globalTheme);
        setEffectiveTheme(globalEffectiveTheme);
        return;
      }
      
      initializationPromise = (async () => {
        try {
          // Check if user is authenticated before trying to load from database
          const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          
          if (!authToken) {
            console.log('useTheme: No auth token found, using localStorage fallback');
            // Use localStorage immediately if not authenticated
            const localTheme = (localStorage.getItem('theme') as ThemeType) || 'system';
            console.log('useTheme: LocalStorage theme:', localTheme);
            
            globalTheme = localTheme;
            setTheme(localTheme);
            applyTheme(localTheme);
            isThemeInitialized = true;
            isUserSetTheme = false; // This is a database load, not user action
            console.log('useTheme: Theme initialization completed with localStorage fallback');
            return;
          }
          
          console.log('useTheme: Auth token found, loading from database');
          const { sqliteService } = await import('@/services/sqlite.svc');
          await sqliteService.initialize();
          
          const settings = await sqliteService.getAllSettings('appearance');
          const dbTheme = (settings?.theme as ThemeType) || 'system';
          
          globalTheme = dbTheme;
          setTheme(dbTheme);
          applyTheme(dbTheme);
          isThemeInitialized = true;
          isUserSetTheme = false; // This is a database load, not user action
          console.log('useTheme: Theme initialization completed successfully from database');
        } catch (error) {
          console.error('useTheme: Failed to load theme from database:', error);
          console.error('useTheme: Database error details:', {
            message: error.message,
            status: error.status,
            stack: error.stack
          });
          
          // Fallback to localStorage for migration
          console.log('useTheme: Falling back to localStorage...');
          const localTheme = (localStorage.getItem('theme') as ThemeType) || 'system';
          console.log('useTheme: LocalStorage theme:', localTheme);
          
          globalTheme = localTheme;
          setTheme(localTheme);
          applyTheme(localTheme);
          isThemeInitialized = true;
          isUserSetTheme = false; // This is a database load, not user action
          console.log('useTheme: Theme initialization completed with fallback');
        }
        initializationPromise = null;
      })();
      
      await initializationPromise;
    };

    loadTheme();
  }, [applyTheme]);

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);

  const updateTheme = useCallback(async (newTheme: ThemeType, saveToDb = true) => {
    console.log('useTheme: updateTheme called', { newTheme, saveToDb, currentGlobal: globalTheme });
    
    // Update global state first
    globalTheme = newTheme;
    setTheme(newTheme);
    applyTheme(newTheme);
    
    // Mark as initialized and user-set to prevent reloading from database
    isThemeInitialized = true;
    isUserSetTheme = true; // This theme was explicitly set by user action
    
    if (saveToDb) {
      try {
        const { sqliteService } = await import('@/services/sqlite.svc');
        console.log('useTheme: Saving theme to database:', newTheme);
        console.log('useTheme: Checking authentication token...');
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        console.log('useTheme: Auth token available:', !!token);
        if (token) {
          console.log('useTheme: Token length:', token.length);
        }
        
        await sqliteService.setMultipleSettings({
          'theme': { value: newTheme, category: 'appearance' }
        });
        console.log('useTheme: Theme saved successfully to database');
      } catch (error) {
        console.error('useTheme: Failed to save theme to database:', error);
        console.error('useTheme: Error details:', {
          message: error.message,
          status: error.status,
          stack: error.stack
        });
        // Don't throw error to prevent UI from breaking
      }
    }
  }, [applyTheme]);

  return {
    theme,
    effectiveTheme,
    setTheme: updateTheme
  };
};