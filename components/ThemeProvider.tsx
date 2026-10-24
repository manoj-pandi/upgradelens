"use client";

// Gives every component access to the current theme (light, dark, or system).
// It must be a client component because it uses React context and localStorage.
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Wraps the whole app so ThemeToggle (and anything else) can read and change the theme.
const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NextThemesProvider
      attribute="class" // adds class="dark" to <html> in dark mode; globals.css reads it
      defaultTheme="system" // first-time visitors get their operating system's setting
      enableSystem
      disableTransitionOnChange // avoid colors fading slowly when the theme switches
    >
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
