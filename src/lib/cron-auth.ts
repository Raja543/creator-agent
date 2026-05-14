export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret set = dev mode, allow all
  if (!secret) return true;
  // Vercel's internal cron header
  if (request.headers.get("x-vercel-cron") === "1") return true;
  // GitHub Actions / external cron header
  if (request.headers.get("x-cron-secret") === secret) return true;
  return false;
}
