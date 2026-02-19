'use client'

import { useAccount, useChainId, useReadContract } from 'wagmi'
import { keccak256, encodeAbiParameters, formatEther } from 'viem'
import { Trophy, Loader2, Info } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  POINTS_HOOK_ABI,
  POOL_FEE,
  POOL_TICK_SPACING,
  ZERO_ADDRESS,
  getContracts,
} from '@/lib/contracts'

function computePoolId(
  token: `0x${string}`,
  pointsHook: `0x${string}`,
): { bytes32: `0x${string}`; uint256: bigint } {
  // Pool ID = keccak256(abi.encode(poolKey)) — mirrors PoolIdLibrary.toId() in Solidity
  const bytes32 = keccak256(
    encodeAbiParameters(
      [
        { type: 'address' }, // currency0 (ETH = address(0))
        { type: 'address' }, // currency1 (TOKEN)
        { type: 'uint24' },  // fee
        { type: 'int24' },   // tickSpacing
        { type: 'address' }, // hooks
      ],
      [ZERO_ADDRESS, token, POOL_FEE, POOL_TICK_SPACING, pointsHook],
    ),
  )
  return { bytes32, uint256: BigInt(bytes32) }
}

function truncate(hex: string, chars = 6) {
  return `${hex.slice(0, chars + 2)}...${hex.slice(-chars)}`
}

export function PointsCard() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const contracts = getContracts(chainId)

  const poolId = contracts
    ? computePoolId(contracts.token, contracts.pointsHook)
    : null

  const { data: points, isLoading } = useReadContract({
    address: contracts?.pointsHook,
    abi: POINTS_HOOK_ABI,
    functionName: 'balanceOf',
    args: [address!, poolId?.uint256 ?? 0n],
    query: { enabled: !!address && isConnected && !!contracts },
  })

  const formattedPoints = points !== undefined ? formatEther(points) : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Points
        </CardTitle>
        <CardDescription>
          Earn 20% points on every ETH spent in this pool
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Points balance */}
        <div className="rounded-xl border bg-linear-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 p-6 text-center space-y-2">
          {!isConnected ? (
            <p className="text-muted-foreground text-sm">
              Connect wallet to view points
            </p>
          ) : !contracts ? (
            <p className="text-muted-foreground text-sm">
              Switch to Sepolia or Base Sepolia
            </p>
          ) : isLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <p className="text-4xl font-bold tabular-nums tracking-tight">
                {formattedPoints}
              </p>
              <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/30">
                POOL POINTS
              </Badge>
            </>
          )}
        </div>

        <Separator />

        {/* Pool ID */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Pool ID</p>
          <p
            className="font-mono text-xs text-foreground/70 break-all cursor-pointer hover:text-foreground transition-colors"
            title={poolId?.bytes32}
            onClick={() => poolId && navigator.clipboard.writeText(poolId.bytes32)}
          >
            {poolId ? truncate(poolId.bytes32, 8) : '—'}
          </p>
        </div>

        {/* Hook address */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Hook (ERC1155) address
          </p>
          <p
            className="font-mono text-xs text-foreground/70 break-all cursor-pointer hover:text-foreground transition-colors"
            title={contracts?.pointsHook}
            onClick={() => contracts && navigator.clipboard.writeText(contracts.pointsHook)}
          >
            {contracts ? truncate(contracts.pointsHook, 8) : '—'}
          </p>
        </div>

        <Separator />

        {/* How it works */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            The <code className="bg-muted px-0.5 rounded">afterSwap</code> hook
            mints <code className="bg-muted px-0.5 rounded">ethSpent / 5</code>{' '}
            ERC1155 tokens to the address passed in{' '}
            <code className="bg-muted px-0.5 rounded">hookData</code>.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
