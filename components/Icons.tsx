// One place for every icon in the app.
// Standard icons come from react-icons (Lucide set); the logo stays custom because it's your brand.
import type { SVGProps } from "react";
import type { IconBaseProps } from "react-icons";
import {
  LuArrowRight,
  LuGithub,
  LuLoaderCircle,
  LuLock,
  LuMonitor,
  LuMoon,
  LuSun,
} from "react-icons/lu";

// Decorative icons are hidden from screen readers; the text next to them says what they mean.
const base: IconBaseProps = { size: 16, "aria-hidden": true };

export const LockIcon = (props: IconBaseProps) => <LuLock {...base} {...props} />;

export const ArrowRightIcon = (props: IconBaseProps) => <LuArrowRight {...base} {...props} />;

export const GitHubIcon = (props: IconBaseProps) => <LuGithub {...base} {...props} />;

// Spins forever; used on the "Scanning…" button.
export const SpinnerIcon = (props: IconBaseProps) => (
  <LuLoaderCircle {...base} className="animate-spin" {...props} />
);

// Theme switcher icons: light, follow the system, dark.
export const SunIcon = (props: IconBaseProps) => <LuSun {...base} {...props} />;

export const MonitorIcon = (props: IconBaseProps) => <LuMonitor {...base} {...props} />;

export const MoonIcon = (props: IconBaseProps) => <LuMoon {...base} {...props} />;

// Custom brand logo: a lens with an "upgrade" arrow inside.
export const LogoIcon = ({ size = 26, ...props }: SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
    <path d="M10.5 13.5v-6" />
    <path d="M8 10l2.5-2.5L13 10" />
  </svg>
);
