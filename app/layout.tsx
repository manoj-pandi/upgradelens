import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

// Load the Geist fonts and expose them as CSS variables (used in globals.css).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UpgradeLens: see what breaks before you upgrade",
  description: "Paste a GitHub repo and see every line that breaks when upgrading from Express 4 to Express 5, with the exact fix.",
};

// The shell around every page: fonts, theme, and the full-height column layout.
const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    // suppressHydrationWarning: next-themes adds class="dark" to <html> before React loads
    // (so there's no white flash). React would see that as a mismatch, so we tell it this one is expected.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
