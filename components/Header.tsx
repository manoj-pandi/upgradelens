
import Link from "next/link";
import Container from "./Container";
import HashCleaner from "./HashCleaner";
import { GitHubIcon, LogoIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";


const NAV_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#rules", label: "What it checks" },
];

interface HeaderProps {
  githubUrl: string; 
}

const Header = ({ githubUrl }: HeaderProps) => {
  return (
    <header className="border-b border-line bg-surface">
     
      <HashCleaner />
      <Container className="flex flex-wrap items-center justify-between gap-4 py-3.5">
        
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
         
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </Container>
    </header>
  );
};

export default Header;
