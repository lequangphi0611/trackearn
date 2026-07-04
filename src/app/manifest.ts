import type { MetadataRoute } from "next";

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
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
