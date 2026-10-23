import React from 'react'
import Container from './Container';
import Link from 'next/link';
import { GitHubIcon, LogoIcon } from './Icons';


const NAV_LINKS = [{
    href:"/#how",label:"How it works"
},
{href:"/#rules",label:"What it checks"}];

interface props{
    githubUrl:string;
}
const Header :React.FC<props> = ({githubUrl}) => {
  return (
   <header className="border-b border-line bg-white">
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
              className="px-3 py-2.5 font-medium text-zinc-700 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={githubUrl}
            className="flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 font-medium text-foreground hover:bg-zinc-50"
          >
            <GitHubIcon />
            GitHub
          </a>
        </nav>
      </Container>
    </header>
  )
}

export default Header