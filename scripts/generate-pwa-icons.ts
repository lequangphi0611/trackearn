// Sinh icon PWA (192/512/maskable) từ src/app/icon.svg — chạy 1 lần
// (`pnpm generate:pwa-icons`), commit PNG output vào public/icons/. Chạy lại
// nếu đổi brand color/glyph trong icon.svg.
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const outDir = resolve(root, "public/icons");
mkdirSync(outDir, { recursive: true });

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
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile(resolve(outDir, "icon-192.png"));
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(resolve(outDir, "icon-512.png"));
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(resolve(outDir, "icon-maskable-512.png"));

  console.log("Đã sinh icon PWA vào public/icons/");
}

main();
