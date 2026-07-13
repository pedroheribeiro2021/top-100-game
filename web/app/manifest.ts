import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TOP 100 — o jogo de rankings ocultos",
    short_name: "TOP 100",
    description: "Party game multiplayer de rankings ocultos.",
    start_url: "/",
    display: "standalone",
    background_color: "#1e3a8a",
    theme_color: "#7c3aed",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
