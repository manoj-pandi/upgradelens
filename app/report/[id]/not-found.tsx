// Shown when someone opens /report/<id> and no report has that id.
import Link from "next/link";

const NotFound = () => {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">Report not found</h1>
      <p className="text-muted">The report you are looking for does not exist.</p>
      {/* Link (not <a>) so Next.js navigates without a full page reload */}
      <Link href="/" className="flex min-h-11 items-center text-link underline-offset-2 hover:underline">
        Go back home
      </Link>
    </main>
  );
};

export default NotFound;
