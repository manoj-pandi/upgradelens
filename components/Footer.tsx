import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="flex flex-wrap justify-between gap-3 py-7 text-sm text-muted">
        <span>Coming next: fix diffs, pull requests, and more packages.</span>
        <span>
          Inspired by Y Combinator&apos;s{" "}
          <a href="https://www.ycombinator.com/rfs" className="text-blue-700 underline-offset-2 hover:underline">
            Self-Maintaining APIs
          </a>{" "}
          request
        </span>
      </Container>
    </footer>
  );
}