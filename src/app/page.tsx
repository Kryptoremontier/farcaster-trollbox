import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

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
    openGraph: {
      title: "TrollBox - Prediction Markets",
      description: "Bet on anything. From crypto predictions to Elon's next tweet. Powered by Farcaster.",
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
