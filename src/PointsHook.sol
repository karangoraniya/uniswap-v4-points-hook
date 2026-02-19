// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {ERC1155} from "solmate/src/tokens/ERC1155.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

import {PoolKey} from "v4-core/types/PoolKey.sol";
import {PoolId} from "v4-core/types/PoolId.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

import {Hooks} from "v4-core/libraries/Hooks.sol";

contract PointsHook is BaseHook, ERC1155 {
    constructor(
        IPoolManager _manager
    ) BaseHook(_manager) {}

    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterAddLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: false,
                afterSwap: true,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    // On-chain SVG metadata — displays as a gold star badge in any ERC1155-aware wallet
    function uri(uint256) public pure virtual override returns (string memory) {
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">',
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#1a1a2e"/>',
            '<stop offset="100%" style="stop-color:#16213e"/>',
            '</linearGradient>',
            '<linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#f59e0b"/>',
            '<stop offset="100%" style="stop-color:#d97706"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="300" height="300" rx="24" fill="url(#bg)"/>',
            '<polygon points="150,58 164,101 210,101 174,127 188,170 150,145 112,170 126,127 90,101 136,101" fill="url(#gold)"/>',
            '<text x="150" y="218" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#f59e0b">POINTS</text>',
            '<text x="150" y="248" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#94a3b8">Points Hook</text>',
            '<text x="150" y="270" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#64748b">Uniswap v4</text>',
            '</svg>'
        ));

        string memory json = string(abi.encodePacked(
            '{"name":"Points Hook Points",',
            '"description":"Points earned by swapping ETH on a Uniswap v4 Points Hook pool. Earn 20% of ETH spent as points.",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '"}'
        ));

        return string(abi.encodePacked('data:application/json;base64,', Base64.encode(bytes(json))));
    }

    function _afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata swapParams,
        BalanceDelta delta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        // If this is not an ETH-TOKEN pool with this hook attached, ignore
        if (!key.currency0.isAddressZero()) return (this.afterSwap.selector, 0);

        // We only mint points if user is buying TOKEN with ETH
        if (!swapParams.zeroForOne) return (this.afterSwap.selector, 0);

        uint256 ethSpendAmount = uint256(int256(-delta.amount0()));
        uint256 pointsForSwap = ethSpendAmount / 5;

        _assignPoints(key.toId(), hookData, pointsForSwap);

        return (this.afterSwap.selector, 0);
    }

    function _assignPoints(
        PoolId poolId,
        bytes calldata hookData,
        uint256 points
    ) internal {
        if (hookData.length == 0) return;

        address user = abi.decode(hookData, (address));
        if (user == address(0)) return;

        uint256 poolIdUint = uint256(PoolId.unwrap(poolId));
        _mint(user, poolIdUint, points, "");
    }
}
