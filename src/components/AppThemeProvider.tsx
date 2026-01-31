import { ThemeProvider } from "next-themes";

/**
 * Theme provider that allows theme switching with light as default.
 * We use defaultTheme="light" and enableSystem={false} to prevent black screen
 * on first load while still allowing users to toggle themes.
 */
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="funnel-builder-theme"
    >
      {children}
    </ThemeProvider>
  );
}
