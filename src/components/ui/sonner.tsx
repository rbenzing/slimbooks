import React, { useEffect, useState } from "react"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    // Get theme from localStorage (matching the custom theme implementation)
    const storedTheme = localStorage.getItem('theme') || 'system';

    const getEffectiveTheme = (selectedTheme: string) => {
      if (selectedTheme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return selectedTheme as "light" | "dark";
    };

    setTheme(getEffectiveTheme(storedTheme));

    // Listen for theme changes
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'system';
      setTheme(getEffectiveTheme(currentTheme));
    };

    // Listen for localStorage changes (theme updates)
    window.addEventListener('storage', handleThemeChange);

    // Listen for system theme changes if using system theme
    if (storedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleThemeChange);

      return () => {
        window.removeEventListener('storage', handleThemeChange);
        mediaQuery.removeEventListener('change', handleThemeChange);
      };
    }

    return () => {
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
