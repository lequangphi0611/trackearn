import type { MetadataRoute } from "next";
import pwaIcons from "@/lib/pwa-icons.json";

// background_color quy từ --background light (oklch(0.985 0.008 95)) —
// xem globals.css. Manifest chỉ nhận 1 cặp màu tĩnh, không đổi theo dark mode.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrackEarn",
    short_name: "TrackEarn",
    description: "Sổ thu chi cho hộ kinh doanh",
    start_url: "/",
    display: "standalone",
    theme_color: "#E0A020",
    background_color: "#fcfaf4",
    // Nguồn sự thật chung cho danh sách icon (src/lib/pwa-icons.json) — cùng
    // dữ liệu này dùng bởi scripts/generate-pwa-icons.ts (sinh file PNG) và
    // scripts/generate-sw.mjs (precache trong service worker).
    icons: pwaIcons as MetadataRoute.Manifest["icons"],
  };
}
