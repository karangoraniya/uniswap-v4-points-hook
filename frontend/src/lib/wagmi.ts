import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, baseSepolia, sepolia, unichainSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Points Hook Demo",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "YOUR_WC_PROJECT_ID",
  chains: [sepolia, baseSepolia, unichainSepolia, anvil],
  ssr: true,
});
