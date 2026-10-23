
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Report Not Found</h1>
      <p className="text-gray-500">
        The report you are looking for does not exist.
      </p>
      <a href="/" className="text-blue-600 hover:underline">
        Go back home
      </a>
    </div>
  );
}
