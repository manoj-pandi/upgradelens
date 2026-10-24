// The top bar on every page: logo, section links, GitHub link, and the theme switcher.
import Link from "next/link";
import Container from "./Container";
import { GitHubIcon, LogoIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";

// Links to sections on the Home page. "/#how" works from any page, not just Home.
const NAV_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#rules", label: "What it checks" },
];

interface HeaderProps {
  githubUrl: string; // link to this project's source code
}

const Header = ({ githubUrl }: HeaderProps) => {
  return (
    <header className="border-b border-line bg-surface">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-3.5">
        {/* Logo doubles as a "go home" link */}
        <Link href="/" className="flex min-h-11 items-center gap-2.5 text-foreground">
          <LogoIcon />
          <span className="text-lg font-bold tracking-tight">UpgradeLens</span>
        </Link>

        <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center px-3 font-medium text-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={githubUrl}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3.5 font-medium text-foreground hover:bg-subtle"
          >
            <GitHubIcon />
            GitHub
          </a>
          {/* Light / System / Dark */}
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </Container>
    </header>
  );
};

export default Header;
