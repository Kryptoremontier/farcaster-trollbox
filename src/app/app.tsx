"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ReactDOM from "react-dom";
import { TrollBoxHub } from "~/components/TrollBoxHub";

const DegenBox = dynamic(() => import("~/components/DegenBox"), {
  ssr: false,
});

export default function App(_props: { title?: string } = {}) {
  ReactDOM.preconnect('https://auth.farcaster.xyz');

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // If a market is selected, show the detail view (DegenBox)
  // Otherwise, show the Hub (market grid)
  if (selectedMarketId) {
    return (
      <DegenBox 
        marketId={selectedMarketId} 
        onBack={() => setSelectedMarketId(null)} 
      />
    );
  }

  return <TrollBoxHub onMarketSelect={(marketId) => setSelectedMarketId(marketId)} />;
}
