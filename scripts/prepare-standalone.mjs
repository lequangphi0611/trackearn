// Copy public/ + <distDir>/static vào <distDir>/standalone/ — bước Dockerfile
// làm khi build image (COPY .../public, COPY .../.next/static), cần lặp lại
// thủ công khi chạy `node <distDir>/standalone/server.js` ngoài Docker (vd
// verify:pwa). distDir đọc từ NEXT_DIST_DIR (mặc định ".next") — phải khớp
// giá trị truyền cho `next build` (xem next.config.ts).
import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = process.env.NEXT_DIST_DIR || ".next";
const standalone = resolve(root, distDir, "standalone");

cpSync(resolve(root, "public"), resolve(standalone, "public"), {
  recursive: true,
});
mkdirSync(resolve(standalone, distDir), { recursive: true });
cpSync(resolve(root, distDir, "static"), resolve(standalone, distDir, "static"), {
  recursive: true,
});

console.log(`Đã copy public/ + ${distDir}/static vào ${distDir}/standalone/.`);
