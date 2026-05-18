import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function errResponse(error: { message: string }): Response {
  return Response.json({ error: error.message }, { status: 500 });
}

export function scoreClass(n: number | null): "high" | "mid" | "low" {
  if (!n) return "low";
  if (n >= 8) return "high";
  if (n >= 6) return "mid";
  return "low";
}
