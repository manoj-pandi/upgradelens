import Container from "./Container";

const STEPS = [
  {
    title: "Paste a repo",
    text: "UpgradeLens downloads the JavaScript and TypeScript files at the latest commit. node_modules and build folders are skipped.",
  },
  {
    title: "Every file becomes a syntax tree",
    text: "Rules match real function calls, not text, so comments, strings, and look-alike code don't trigger false alarms.",
  },
  {
    title: "Get a fix list you can share",
    text: "Each finding shows the file, the line, the old code, the fix, and why it breaks. Same commit, same report, instantly.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-4 border-t border-line bg-white">
      <Container className="flex flex-col gap-8 py-18">
        <h2 id="how-title" className="text-3xl font-bold tracking-tight">How it works</h2>

        <ol className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-5.5">
              <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[19px] font-semibold">{step.title}</h3>
              <p className="text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}