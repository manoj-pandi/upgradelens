// Centers content and keeps the same width and side padding on every page.
import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string; // extra classes for layout, e.g. padding or flex
}

const Container = ({ children, className = "" }: ContainerProps) => {
  return <div className={`mx-auto w-full max-w-280 px-6 ${className}`}>{children}</div>;
};

export default Container;
