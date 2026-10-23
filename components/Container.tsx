// Centers content and keeps the same width and side padding on every page.
import type { ReactNode } from "react";

export default function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-280 px-6 ${className}`}>{children}</div>;
}