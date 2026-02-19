export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const POOL_FEE = 3000;
export const POOL_TICK_SPACING = 60;

// Per-chain contract addresses — add more chains here as you deploy
export const CHAIN_CONTRACTS: Record<
  number,
  {
    pointsHook: `0x${string}`;
    poolSwapTest: `0x${string}`;
    token: `0x${string}`;
  }
> = {
  // ── Ethereum Sepolia (11155111) ──────────────────────────────────────────────
  11155111: {
    pointsHook: "0xEFA94A4DB5c3e529af02bBF9a9cC2C1B5339c040", // deployed (CREATE2 via HookMiner)
    poolSwapTest: "0x9b6b46e2c869aa39918db7f52f5557fe577b6eee", // official Uniswap v4 deployment
    token: "0x9d992cA1F04f2A3c435Cc2540369c94E5803F057", // deployed  (DemoToken ERC20)
  },
  // ── Base Sepolia (84532) ─────────────────────────────────────────────────────
  84532: {
    pointsHook: "0xC597077De2fa790A30071a24E9cC91EeCE298040", // deployed (CREATE2 via HookMiner)
    poolSwapTest: "0x8b5bcc363dde2614281ad875bad385e0a785d3b9", // official Uniswap v4 deployment
    token: "0x3A3862df769f11fEa748f36B18751b7b7c755302", // deployed (DemoToken ERC20)
  },
  // ── Unichain Sepolia (1301) ──────────────────────────────────────────────────
  1301: {
    pointsHook: "0x714B9A13741c4353034d1BB1Eba40856A73A4040", // deployed (CREATE2 via HookMiner)
    poolSwapTest: "0x9140a78c1a137c7ff1c151ec8231272af78a99a4", // official Uniswap v4 deployment
    token: "0x9c774Ba3c07D9526c0a658D1e6FE001D0E9fF1B7", // deployed (DemoToken ERC20)
  },
};

export function getContracts(chainId: number) {
  return CHAIN_CONTRACTS[chainId] ?? null;
}

// Minimal ABI for reading ERC1155 points balance
export const POINTS_HOOK_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// PoolSwapTest ABI for executing swaps in a v4 pool
export const POOL_SWAP_TEST_ABI = [
  {
    name: "swap",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "zeroForOne", type: "bool" },
          { name: "amountSpecified", type: "int256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
      {
        name: "testSettings",
        type: "tuple",
        components: [
          { name: "takeClaims", type: "bool" },
          { name: "settleUsingBurn", type: "bool" },
        ],
      },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [{ name: "delta", type: "int256" }],
  },
] as const;
