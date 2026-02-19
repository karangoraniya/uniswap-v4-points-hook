"use client";

import { useState } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, encodeAbiParameters } from "viem";
import { toast } from "sonner";
import { ArrowDown, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  POOL_SWAP_TEST_ABI,
  POOL_FEE,
  POOL_TICK_SPACING,
  ZERO_ADDRESS,
  getContracts,
} from "@/lib/contracts";

// MIN_SQRT_PRICE + 1 — used as price limit for zeroForOne swaps
const MIN_SQRT_PRICE_PLUS_ONE = BigInt("4295128740");

const EXPLORERS: Record<number, string> = {
  11155111: "https://sepolia.etherscan.io/tx",
  84532: "https://sepolia.basescan.org/tx",
  1301: "https://sepolia.uniscan.xyz/tx",
};

function explorerTxUrl(chainId: number, hash: string) {
  const base = EXPLORERS[chainId];
  return base ? `${base}/${hash}` : null;
}

export function SwapCard() {
  const [ethInput, setEthInput] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const contracts = getContracts(chainId);
  const isConfigured = contracts !== null;

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const ethAmount =
    ethInput && !isNaN(parseFloat(ethInput)) ? parseEther(ethInput) : 0n;
  const pointsEstimate = ethAmount / 5n;

  const canSwap = isConnected && isConfigured && ethAmount > 0n;

  const handleSwap = () => {
    if (!address || !ethAmount || !contracts) return;

    // hookData encodes the recipient address so the hook knows who to mint points to
    const hookData = encodeAbiParameters([{ type: "address" }], [address]);

    writeContract(
      {
        address: contracts.poolSwapTest,
        abi: POOL_SWAP_TEST_ABI,
        functionName: "swap",
        value: ethAmount,
        args: [
          {
            currency0: ZERO_ADDRESS, // ETH is address(0)
            currency1: contracts.token,
            fee: POOL_FEE,
            tickSpacing: POOL_TICK_SPACING,
            hooks: contracts.pointsHook,
          },
          {
            zeroForOne: true, // ETH → TOKEN
            amountSpecified: -ethAmount, // negative = exact input
            sqrtPriceLimitX96: MIN_SQRT_PRICE_PLUS_ONE,
          },
          {
            takeClaims: false,
            settleUsingBurn: false,
          },
          hookData,
        ],
      },
      {
        onSuccess: (hash) => {
          const url = explorerTxUrl(chainId, hash);
          toast.success("Swap submitted! Points will arrive shortly.", {
            description: url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-xs text-muted-foreground hover:text-foreground"
              >
                View on Explorer ↗
              </a>
            ) : undefined,
          });
        },
        onError: (err) => toast.error(err.message.slice(0, 100)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Swap ETH
          <Badge variant="secondary" className="text-xs">
            zeroForOne
          </Badge>
        </CardTitle>
        <CardDescription>
          Buy TOKEN with ETH and earn points automatically
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ETH input */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">You pay</label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              placeholder="0.0"
              value={ethInput}
              onChange={(e) => setEthInput(e.target.value)}
              className="pr-14 text-base"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              ETH
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Output placeholder */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">You receive</label>
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2.5">
            <span className="text-muted-foreground text-sm">
              Depends on pool price
            </span>
            <span className="text-sm font-semibold">TOKEN</span>
          </div>
        </div>

        <Separator />

        {/* Points preview */}
        <div className="flex items-center justify-between rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Points you&apos;ll earn</span>
          </div>
          <span className="text-sm font-bold text-yellow-500">
            {ethAmount > 0n ? `+${formatEther(pointsEstimate)}` : "—"}
          </span>
        </div>

        {!isConfigured && isConnected && (
          <p className="text-xs text-center text-muted-foreground">
            Switch to Sepolia or Base Sepolia to swap
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleSwap}
          disabled={!canSwap || isPending || isConfirming}
        >
          {!isConnected
            ? "Connect wallet to swap"
            : !isConfigured
              ? "Unsupported network"
              : isPending
                ? "Confirm in wallet..."
                : isConfirming
                  ? "Confirming transaction..."
                  : isSuccess
                    ? "Swap again"
                    : "Swap ETH → TOKEN"}
        </Button>
      </CardContent>
    </Card>
  );
}
