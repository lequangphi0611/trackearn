// Sinh icon PWA (192/512/maskable) từ src/app/icon.svg — chạy 1 lần
// (`pnpm generate:pwa-icons`), commit PNG output vào public/icons/. Chạy lại
// nếu đổi brand color/glyph trong icon.svg.
// Tên file/kích thước đọc từ src/lib/pwa-icons.json (nguồn sự thật chung, xem
// src/app/manifest.ts và scripts/generate-sw.mjs) — đổi 1 chỗ, cả 3 nơi theo.
import { mkdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import sharp from "sharp";
import pwaIcons from "../src/lib/pwa-icons.json" with { type: "json" };

const root = resolve(import.meta.dirname, "..");
const outDir = resolve(root, "public/icons");
mkdirSync(outDir, { recursive: true });

const iconFile = (src: string) => resolve(outDir, basename(src));
const sizeOf = (sizes: string) => Number(sizes.split("x")[0]);

const svg = readFileSync(resolve(root, "src/app/icon.svg"), "utf-8");

// Bản maskable: nền vuông full-bleed (không bo góc — Android tự crop hình
// dạng), glyph thu 80% và canh giữa để nằm trong vùng an toàn maskable.
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#E0A020" />
  <g transform="translate(4.8,4.8) scale(0.8)" fill="none" stroke="#232730" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="20.5" cy="30.5" r="7.5" />
    <path d="M28 11.5V38" />
    <path d="M22 15.5h12" />
  </g>
</svg>`;

async function main() {
  const [icon192, icon512, iconMaskable512] = pwaIcons;

  await sharp(Buffer.from(svg))
    .resize(sizeOf(icon192.sizes), sizeOf(icon192.sizes))
    .png()
    .toFile(iconFile(icon192.src));
  await sharp(Buffer.from(svg))
    .resize(sizeOf(icon512.sizes), sizeOf(icon512.sizes))
    .png()
    .toFile(iconFile(icon512.src));
  await sharp(Buffer.from(maskableSvg))
    .resize(sizeOf(iconMaskable512.sizes), sizeOf(iconMaskable512.sizes))
    .png()
    .toFile(iconFile(iconMaskable512.src));

  console.log("Đã sinh icon PWA vào public/icons/");
}

main();
