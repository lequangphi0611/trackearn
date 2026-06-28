import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  // pino (+ transport pino-pretty) phải chạy ngoài bundle để worker thread
  // resolve được module lúc runtime, nếu không sẽ lỗi "unable to determine
  // transport target". Xem docs/rules/logging.md.
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default nextConfig;
