import { Navbar } from "@/components/Navbar";
import { SwapCard } from "@/components/SwapCard";
import { PointsCard } from "@/components/PointsCard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Earn Points on Every Swap
          </h2>
          <p className="text-muted-foreground max-w-xl">
            A Uniswap v4 hook demo that awards ERC1155 points equal to{" "}
            <span className="font-medium text-foreground">
              20% of ETH spent
            </span>{" "}
            on each swap. Points are pool-specific and minted directly to your
            wallet.
          </p>
        </div>

        {/* Main cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SwapCard />
          <PointsCard />
        </div>

        {/* How it works */}
        <div className="rounded-xl border p-5 space-y-3">
          <p className="text-sm font-semibold">How this hook works</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded h-fit shrink-0">
                1
              </span>
              Swap ETH → TOKEN in the hook-enabled pool (ETH is{" "}
              <code className="bg-muted px-1 rounded text-xs">
                currency0 = address(0)
              </code>
              )
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded h-fit shrink-0">
                2
              </span>
              The{" "}
              <code className="bg-muted px-1 rounded text-xs">afterSwap</code>{" "}
              hook fires and reads{" "}
              <code className="bg-muted px-1 rounded text-xs">hookData</code> to
              find the recipient address
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded h-fit shrink-0">
                3
              </span>
              Mints{" "}
              <code className="bg-muted px-1 rounded text-xs">
                ethSpent / 5
              </code>{" "}
              ERC1155 tokens (token ID = pool ID) to your wallet
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded h-fit shrink-0">
                4
              </span>
              Points accumulate and are visible in the card above
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
