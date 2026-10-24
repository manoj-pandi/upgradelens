// The bottom bar on every page: what's coming next and where the idea came from.
import Container from "./Container";

const Footer = () => {
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="flex flex-wrap justify-between gap-3 py-7 text-sm text-muted">
        <span>Coming next: fix diffs, pull requests, and more packages.</span>
        <span>
          Inspired by Y Combinator&apos;s{" "}
          <a href="https://www.ycombinator.com/rfs" className="text-link underline-offset-2 hover:underline">
            Self-Maintaining APIs
          </a>{" "}
          request
        </span>
      </Container>
    </footer>
  );
};

export default Footer;
