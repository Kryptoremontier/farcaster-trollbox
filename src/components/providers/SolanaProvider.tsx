import { FarcasterSolanaProvider } from '@farcaster/mini-app-solana';

const heliusEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterSolanaProvider endpoint={heliusEndpoint}>
      {children}
    </FarcasterSolanaProvider>
  );
}
