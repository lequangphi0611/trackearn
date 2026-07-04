// Stamp public/sw.js sau `next build` (chạy như postbuild trong package.json
// "build"): thay CACHE_NAME placeholder bằng BUILD_ID thật của Next (đổi mỗi
// lần build) và danh sách icon placeholder bằng src/lib/pwa-icons.json —
// tránh cache service worker tích luỹ vĩnh viễn qua các lần deploy (xem
// comment đầu public/sw.js) và tránh trùng lặp danh sách icon 3 nơi.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const distDir = process.env.NEXT_DIST_DIR || ".next";
const buildId = readFileSync(resolve(root, distDir, "BUILD_ID"), "utf-8").trim();
const pwaIcons = JSON.parse(
  readFileSync(resolve(root, "src/lib/pwa-icons.json"), "utf-8"),
);

const swPath = resolve(root, "public/sw.js");
let sw = readFileSync(swPath, "utf-8");

sw = sw.replace(
  /const CACHE_NAME = ".*";/,
  `const CACHE_NAME = "trackearn-shell-${buildId}";`,
);
sw = sw.replace(
  '"__PWA_ICON_URLS__",',
  pwaIcons.map((icon) => `"${icon.src}",`).join("\n  "),
);

writeFileSync(swPath, sw);
console.log(`Đã stamp public/sw.js với CACHE_NAME = trackearn-shell-${buildId}`);
