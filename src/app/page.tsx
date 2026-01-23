import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL || "https://v0-farcaster-troll-box-app.vercel.app";

const frame = {
  version: "next",
  imageUrl: `${appUrl}/troll-banner.png`,
  button: {
    title: "Launch TrollBox",
    action: {
      type: "launch_frame",
      name: "TrollBox",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#9E75FF",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "TrollBox - Prediction Markets",
    description: "Bet on anything. From crypto predictions to Elon's next tweet. Powered by Farcaster.",
    metadataBase: new URL(appUrl),
    openGraph: {
      title: "TrollBox - Prediction Markets",
      description: "Bet on anything. From crypto predictions to Elon's next tweet. Powered by Farcaster.",
      images: [
        {
          url: `${appUrl}/troll-banner.png`,
          width: 1200,
          height: 630,
          alt: "TrollBox - Prediction Markets",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "TrollBox - Prediction Markets",
      description: "Bet on anything. From crypto predictions to Elon's next tweet.",
      images: [`${appUrl}/troll-banner.png`],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (
    <App />
  );
}
