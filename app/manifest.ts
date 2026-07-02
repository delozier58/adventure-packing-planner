import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adventure Packing Planner",
    short_name: "Packing Planner",
    description: "Generate and reuse outdoor trip packing lists for your next adventure.",
    // Always launch the installed app on the "Plan a new trip" home page,
    // regardless of which trip was open when it was added to the home screen.
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
