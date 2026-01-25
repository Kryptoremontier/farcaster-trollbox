import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet } from "wagmi/connectors";

// Use private RPC from env, fallback to public
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const baseSepoliaRpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

export const config = createConfig({
  chains: [baseSepolia, base, optimism, mainnet, degen, unichain],
  transports: {
    [baseSepolia.id]: baseSepoliaRpcUrl ? http(baseSepoliaRpcUrl) : http(),
    [base.id]: baseRpcUrl ? http(baseRpcUrl) : http(),
    [optimism.id]: http(),
    [mainnet.id]: http(),
    [degen.id]: http(),
    [unichain.id]: http(),
  },
  connectors: [
    farcasterMiniApp(),
    // Coinbase Wallet is required for Farcaster mobile transactions
    coinbaseWallet({
      appName: 'TrollBox',
      preference: 'smartWalletOnly', // Critical for Farcaster Frames!
    }),
  ],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
