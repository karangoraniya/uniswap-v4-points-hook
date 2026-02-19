# Points Hook — Uniswap v4 Demo

A Uniswap v4 hook that awards **ERC1155 points** equal to **20% of ETH spent** on every swap. Points are pool-specific, fully on-chain, and display as a gold star badge in any ERC1155-aware wallet.

Built with Foundry (contracts) + Next.js 16 + RainbowKit (frontend).

---

## How It Works

```
User swaps ETH → DEMO token
         │
         ▼
  Uniswap v4 PoolManager executes swap
         │
         ▼
  afterSwap hook fires on PointsHook
         │
  ┌──────┴──────────────────────────────────┐
  │  1. Check currency0 == address(0) (ETH) │
  │  2. Check zeroForOne == true            │
  │  3. pointsEarned = ethSpent / 5  (20%) │
  │  4. ERC1155.mint(user, poolId, points) │
  └─────────────────────────────────────────┘
         │
         ▼
  User receives DEMO tokens + ERC1155 points
```

- The hook contract **is** the ERC1155 — points are minted directly from the hook
- Pool ID (`keccak256` of `PoolKey`) is used as the ERC1155 token ID, scoping points per pool
- `hookData` carries the recipient address encoded as `abi.encode(userAddress)`
- Token metadata is **fully on-chain SVG** — no external server needed

---

## Deployed Contracts

### Sepolia (11155111)

| Contract             | Address                                      | Explorer                                                                                     |
| -------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| PointsHook (ERC1155) | `0xEFA94A4DB5c3e529af02bBF9a9cC2C1B5339c040` | [Etherscan](https://sepolia.etherscan.io/address/0xEFA94A4DB5c3e529af02bBF9a9cC2C1B5339c040) |
| DemoToken (DEMO)     | `0x9d992cA1F04f2A3c435Cc2540369c94E5803F057` | [Etherscan](https://sepolia.etherscan.io/address/0x9d992cA1F04f2A3c435Cc2540369c94E5803F057) |
| PoolSwapTest         | `0x9b6b46e2c869aa39918db7f52f5557fe577b6eee` | Uniswap deploy                                                                               |

### Base Sepolia (84532)

| Contract             | Address                                      | Explorer                                                                                    |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| PointsHook (ERC1155) | `0xC597077De2fa790A30071a24E9cC91EeCE298040` | [Basescan](https://sepolia.basescan.org/address/0xC597077De2fa790A30071a24E9cC91EeCE298040) |
| DemoToken (DEMO)     | `0x3A3862df769f11fEa748f36B18751b7b7c755302` | [Basescan](https://sepolia.basescan.org/address/0x3A3862df769f11fEa748f36B18751b7b7c755302) |
| PoolSwapTest         | `0x8b5bcc363dde2614281ad875bad385e0a785d3b9` | Uniswap deploy                                                                              |

### Unichain Sepolia (1301)

| Contract             | Address                                      | Explorer                                                                                  |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PointsHook (ERC1155) | `0x714B9A13741c4353034d1BB1Eba40856A73A4040` | [Uniscan](https://sepolia.uniscan.xyz/address/0x714B9A13741c4353034d1BB1Eba40856A73A4040) |
| DemoToken (DEMO)     | `0x9c774Ba3c07D9526c0a658D1e6FE001D0E9fF1B7` | [Uniscan](https://sepolia.uniscan.xyz/address/0x9c774Ba3c07D9526c0a658D1e6FE001D0E9fF1B7) |
| PoolSwapTest         | `0x9140a78c1a137c7ff1c151ec8231272af78a99a4` | Uniswap deploy                                                                            |

---

## Uniswap v4 Addresses

Official Uniswap v4 deployment addresses used by the deploy script:

| Network          | PoolManager         | PoolModifyLiquidityTest | PoolSwapTest        |
| ---------------- | ------------------- | ----------------------- | ------------------- |
| Sepolia          | `0xE03A1074...3543` | `0x0C478023...B0A`      | `0x9b6b46e2...eee`  |
| Base Sepolia     | `0x05E73354...408`  | `0x37429cD1...039`      | `0x8b5bcc36...3b9`  |
| Unichain Sepolia | `0x00B036B5...2AC`  | `0x5fa728C0...7AB`      | `0x9140a78c...99a4` |
| Arbitrum Sepolia | `0xFB3e0C6F...317`  | `0x9A8ca723...F7`       | `0xf3a39c86...af8`  |

---

## Hook Address Constraint

Uniswap v4 encodes hook permissions in the **lowest 14 bits** of the contract address. This hook only uses `afterSwap`:

```
AFTER_SWAP_FLAG = 1 << 6 = 0x40

Required: uint160(hookAddress) & 0x3FFF == 0x0040
```

The deploy script uses `HookMiner.find()` to brute-force a CREATE2 salt that produces an address satisfying this constraint (typically finds one in under a second).

---

## Project Structure

```
points-hook/
├── src/
│   └── PointsHook.sol         # Hook + ERC1155, on-chain SVG metadata
├── script/
│   └── Deploy.s.sol           # Chain-aware deploy (auto-detects network)
├── lib/                       # Foundry dependencies
│   ├── forge-std
│   └── v4-periphery           # Includes v4-core
├── frontend/                  # Next.js 16 UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── providers.tsx  # wagmi + RainbowKit providers
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SwapCard.tsx   # ETH -> DEMO swap interface
│   │   │   └── PointsCard.tsx # Live ERC1155 balance
│   │   └── lib/
│   │       ├── wagmi.ts       # Chain config (Sepolia + Base Sepolia)
│   │       └── contracts.ts   # ABIs + env-var addresses
│   └── .env.local             # Frontend env (not committed)
├── .env.example               # Deployment env template
└── foundry.toml
```

---

## Prerequisites

- [Foundry](https://getfoundry.sh) — `curl -L https://foundry.paradigm.xyz | bash`
- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- Testnet ETH — [sepoliafaucet.com](https://sepoliafaucet.com) or [alchemy.com/faucets](https://alchemy.com/faucets)

---

## Setup

```bash
git clone https://github.com/karangoraniya/uniswap-v4-points-hook
cd uniswap-v4-points-hook

# Install Foundry dependencies
forge install

# Install frontend dependencies
cd frontend && bun install

# Install frontend dependencies

bun dev

```

---

## Contract Development

### Build

```bash
forge build
```

### Test

```bash
forge test -vvv
```

### Deploy

The script auto-detects the chain from the RPC URL — no need to change addresses.

**1. Copy and fill the env template:**

```bash
cp .env.example .env
```

Minimum required:

```
PRIVATE_KEY=your_private_key_without_0x
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

**2. Sepolia:**

```bash
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvv
```

**3. Base Sepolia** — uses Etherscan V2 API, same key as Sepolia:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast --verify \
  --verifier etherscan \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=84532" \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvv
```

**4. Unichain Sepolia** — uses Etherscan V2 API, same key as Sepolia:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $UNICHAIN_SEPOLIA_RPC_URL \
  --broadcast --verify \
  --verifier blockscout \
  --verifier-url "https://unichain-sepolia.blockscout.com/api?" \
  -vvv
```

The script prints addresses to paste into `frontend/.env.local` at the end.

### Verify an Existing Contract

All chains use the Etherscan V2 API with the same key — just swap the `chainid`:

**Sepolia (11155111)**
```bash
forge verify-contract 0xEFA94A4DB5c3e529af02bBF9a9cC2C1B5339c040 \
  src/PointsHook.sol:PointsHook \
  --constructor-args $(cast abi-encode "constructor(address)" 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543) \
  --verifier etherscan \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=11155111" \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch
```

**Base Sepolia (84532)**
```bash
forge verify-contract 0xC597077De2fa790A30071a24E9cC91EeCE298040 \
  src/PointsHook.sol:PointsHook \
  --constructor-args $(cast abi-encode "constructor(address)" 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408) \
  --verifier etherscan \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=84532" \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch
```

**Unichain Sepolia (1301)**
```bash
forge verify-contract 0x714B9A13741c4353034d1BB1Eba40856A73A4040 \
  src/PointsHook.sol:PointsHook \
  --constructor-args $(cast abi-encode "constructor(address)" 0x00B036B58a818B1BC34d502D3fE730Db729e62AC) \
  --verifier etherscan \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=1301" \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch
```

---

## Block Explorer API Keys

**You only need one Etherscan API key** — the [Etherscan V2 API](https://docs.etherscan.io/v2-migration) supports all Etherscan-family chains via a single key using `https://api.etherscan.io/v2/api?chainid=<CHAIN_ID>`.

| Chain            | Chain ID | Verifier     | API Key Needed                 |
| ---------------- | -------- | ------------ | ------------------------------ |
| Sepolia          | 11155111 | Etherscan V2 | `ETHERSCAN_API_KEY`            |
| Base Sepolia     | 84532    | Etherscan V2 | `ETHERSCAN_API_KEY` (same key) |
| Unichain Sepolia | 1301     | Etherscan V2 | `ETHERSCAN_API_KEY` (same key) |

Get a free Etherscan API key at [etherscan.io/apidashboard](https://etherscan.io/apidashboard).

> Verification is optional — contracts are fully functional without it.

---

## Frontend

### Configure

Edit `frontend/.env.local`:

```env
# Get free at cloud.walletconnect.com
NEXT_PUBLIC_WC_PROJECT_ID=your_wc_project_id
```

Contract addresses for Sepolia and Base Sepolia are hardcoded in `frontend/src/lib/contracts.ts` — the UI automatically uses the correct addresses based on the connected chain. To add a new chain, add its entry to the `CHAIN_CONTRACTS` map in that file.

### Run

```bash
cd frontend && bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### What the UI does

- Connect any wallet via RainbowKit (MetaMask, Rainbow, Coinbase, WalletConnect)
- Enter an ETH amount and preview points earned before confirming
- Execute ETH -> DEMO swap — `hookData` automatically encodes your address so the hook knows who to mint points to
- Live ERC1155 points balance reads directly from the hook contract after each swap
- On-chain SVG metadata — points display as a gold star NFT badge in wallets

---

## License

MIT
