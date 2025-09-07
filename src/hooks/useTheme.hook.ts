import { useState, useEffect, useCallback } from 'react';

export type ThemeType = 'light' | 'dark' | 'system';

// Global theme state to persist across navigation
let globalTheme: ThemeType = 'system';
let globalEffectiveTheme: 'light' | 'dark' = 'light';
let isThemeInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Reset initialization on page refresh
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    isThemeInitialized = false;
    initializationPromise = null;
  });
}

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(globalTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(globalEffectiveTheme);

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
        console.log('useTheme: Already initialized, skipping theme load');
        return; // Don't reload if already initialized
      }
      
      // Use a shared initialization promise to prevent race conditions
      if (initializationPromise) {
        await initializationPromise;
        return;
      }
      
      initializationPromise = (async () => {
        try {
          const { sqliteService } = await import('@/services/sqlite.svc');
          await sqliteService.initialize();
          
          const settings = await sqliteService.getAllSettings('appearance');
          const dbTheme = (settings?.theme as ThemeType) || 'system';
          
          globalTheme = dbTheme;
          setTheme(dbTheme);
          applyTheme(dbTheme);
          isThemeInitialized = true;
          console.log('useTheme: Theme initialization completed successfully');
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
    console.log('useTheme: updateTheme called', { newTheme, saveToDb });
    
    // Update global state first
    globalTheme = newTheme;
    setTheme(newTheme);
    applyTheme(newTheme);
    
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