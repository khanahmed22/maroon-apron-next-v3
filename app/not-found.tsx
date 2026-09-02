export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>

      <h2 className="text-2xl font-semibold">
        Page Not Found
      </h2>

      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>

      <a
        href="/"
        className="rounded-xl bg-primary px-5 py-2 text-white"
      >
        Go Home
      </a>
    </div>
  );
}