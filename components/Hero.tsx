// The top section of the Home page: headline, short pitch, and the scan form.
import Link from "next/link";
import Container from "./Container";
import ScanForm from "./ScanForm";

interface HeroProps {
  // Set it to a real saved report (e.g. "/report/<id>") once you have one.
  sampleReportHref?: string;
}

const Hero = ({ sampleReportHref }: HeroProps) => {
  return (
    <section>
      <Container className="flex flex-col items-start gap-5 pt-16 pb-16 sm:pt-22 sm:pb-18">
        {/* Small pill that says which upgrade we support right now */}
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-muted">
          <span className="size-2 rounded-full bg-link" aria-hidden="true" />
          Now checking: Express 4 → 5
        </span>

        <h1 className="max-w-205 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-6xl lg:tracking-[-2px]">
          See what breaks before you upgrade.
        </h1>

        <p className="max-w-160 text-lg text-muted sm:text-[19px]">
          Paste a public GitHub repo. UpgradeLens reads your code the way a compiler does and lists
          every line that breaks in Express 5, with the exact fix.
        </p>

        <div className="mt-3 w-full">
          <ScanForm />
        </div>

        {/* Only shown once a sample report exists */}
        {sampleReportHref && (
          <p className="text-[15px] text-muted">
            Not sure where to start?{" "}
            <Link href={sampleReportHref} className="text-link underline-offset-2 hover:underline">
              See a sample report
            </Link>
          </p>
        )}
      </Container>
    </section>
  );
};

export default Hero;
