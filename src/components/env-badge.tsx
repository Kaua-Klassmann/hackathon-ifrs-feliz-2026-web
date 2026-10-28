export function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "dev";

  if (env === "prod") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-3 right-3 z-50 rounded-md bg-warning px-2.5 py-1 font-mono font-semibold text-background text-xs tracking-wider shadow-md">
      {env.toUpperCase()}
    </div>
  );
}
