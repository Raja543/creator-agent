#!/usr/bin/env node
/**
 * dev tunnel — starts ngrok then Next.js dev server
 * Usage: npm run dev:tunnel
 * Requires: ngrok CLI installed + authenticated
 *   Install:  npm install -g ngrok
 *   Auth:     ngrok config add-authtoken <your-token>
 */
import { spawn } from "child_process";

const PORT = process.env.PORT ?? 3000;

// ── 1. Start ngrok ────────────────────────────────────────────────────────────
console.log(`\nStarting ngrok tunnel on port ${PORT}...`);

const ngrokProc = spawn("ngrok", ["http", String(PORT)], {
  stdio: ["ignore", "ignore", "inherit"],
});

ngrokProc.on("error", () => {
  console.error(
    "\n[tunnel] ngrok not found. Install it:\n  npm install -g ngrok\n  ngrok config add-authtoken <token>\n"
  );
  process.exit(1);
});

// ── 2. Poll ngrok local API until tunnel URL is ready ─────────────────────────
async function getNgrokUrl(attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch("http://127.0.0.1:4040/api/tunnels");
      if (!res.ok) continue;
      const { tunnels } = await res.json();
      const https = tunnels?.find((t) => t.proto === "https");
      if (https?.public_url) return https.public_url;
    } catch {
      // ngrok not ready yet — keep polling
    }
  }
  throw new Error("ngrok tunnel did not start in time");
}

let tunnelUrl;
try {
  tunnelUrl = await getNgrokUrl();
} catch (err) {
  console.error(`\n[tunnel] ${err.message}\n`);
  ngrokProc.kill();
  process.exit(1);
}

const tunnelHost = new URL(tunnelUrl).hostname;

console.log(`\n${"─".repeat(52)}`);
console.log(`  Tunnel: ${tunnelUrl}`);
console.log(`  Scan the QR or open the URL on any device`);
console.log(`${"─".repeat(52)}\n`);

// ── 3. Start Next.js dev with NGROK_HOST pre-injected ────────────────────────
const devProc = spawn("npx", ["next", "dev"], {
  env: { ...process.env, NGROK_HOST: tunnelHost },
  stdio: "inherit",
  shell: false,
});

// ── 4. Cleanup on exit ────────────────────────────────────────────────────────
function shutdown() {
  ngrokProc.kill();
  devProc.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
devProc.on("exit", (code) => {
  ngrokProc.kill();
  process.exit(code ?? 0);
});
