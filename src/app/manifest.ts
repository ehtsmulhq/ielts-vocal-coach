import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sounds Like You",
    short_name: "Sounds Like You",
    description: "Shadow a British RP model voice phrase by phrase and get accent feedback on every take.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#0f766e",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
