import type { NextConfig } from "next";

const devOrigins = [
  "192.168.1.16",
  ...(process.env.NGROK_HOST ? [process.env.NGROK_HOST] : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
