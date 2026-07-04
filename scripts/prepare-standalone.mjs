// Copy public/ + .next/static vào .next/standalone/ — bước Dockerfile làm khi
// build image (COPY .../public, COPY .../.next/static), cần lặp lại thủ công
// khi chạy `node .next/standalone/server.js` ngoài Docker (vd verify:pwa).
import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = resolve(root, ".next/standalone");

cpSync(resolve(root, "public"), resolve(standalone, "public"), {
  recursive: true,
});
mkdirSync(resolve(standalone, ".next"), { recursive: true });
cpSync(resolve(root, ".next/static"), resolve(standalone, ".next/static"), {
  recursive: true,
});

console.log("Đã copy public/ + .next/static vào .next/standalone/.");
