"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-500 to-purple-600 shrink-0" />
        <div>
          <p className="text-sm font-bold leading-none">Points Hook</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uniswap v4 Demo
          </p>
        </div>
      </div>
      <ConnectButton />
    </nav>
  );
}
