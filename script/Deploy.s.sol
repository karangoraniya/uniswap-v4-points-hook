// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

import {PointsHook} from "../src/PointsHook.sol";

/// @dev Simple ERC20 minted to the deployer for pool liquidity
contract DemoToken is ERC20 {
    constructor() ERC20("Demo Token", "DEMO") {
        _mint(msg.sender, 1_000_000 ether);
    }
}

interface IPoolModifyLiquidityTest {
    function modifyLiquidity(
        PoolKey memory key,
        ModifyLiquidityParams memory params,
        bytes memory hookData
    ) external payable returns (BalanceDelta);
}

contract Deploy is Script {
    // Standard CREATE2 deployer proxy — same address on all EVM chains
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    uint24  constant POOL_FEE       = 3000;
    int24   constant TICK_SPACING   = 60;
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    int24   constant TICK_LOWER     = -887220;
    int24   constant TICK_UPPER     =  887220;

    struct ChainConfig {
        address poolManager;
        address poolModifyLiquidityTest;
        string  name;
    }

    function getConfig() internal view returns (ChainConfig memory cfg) {
        if (block.chainid == 11155111) {
            // Ethereum Sepolia
            cfg.poolManager             = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
            cfg.poolModifyLiquidityTest = 0x0C478023803a644c94c4CE1C1e7b9A087e411B0A;
            cfg.name                    = "Sepolia";
        } else if (block.chainid == 84532) {
            // Base Sepolia
            cfg.poolManager             = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408;
            cfg.poolModifyLiquidityTest = 0x37429cD17Cb1454C34E7F50b09725202Fd533039;
            cfg.name                    = "Base Sepolia";
        } else if (block.chainid == 1301) {
            // Unichain Sepolia
            cfg.poolManager             = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC;
            cfg.poolModifyLiquidityTest = 0x5fa728C0A5cfd51BEe4B060773f50554c0C8A7AB;
            cfg.name                    = "Unichain Sepolia";
        } else {
            revert("Unsupported chain - add config to Deploy.s.sol");
        }
    }

    function run() external {
        ChainConfig memory cfg = getConfig();
        uint256 deployerPk     = vm.envUint("PRIVATE_KEY");
        address deployer       = vm.addr(deployerPk);

        console.log("=== Deploying to", cfg.name, "===");
        console.log("Deployer:             ", deployer);
        console.log("PoolManager:          ", cfg.poolManager);

        // ── 1. Mine CREATE2 salt for the correct hook address bits ────────────────
        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG);
        bytes memory constructorArgs = abi.encode(IPoolManager(cfg.poolManager));

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(PointsHook).creationCode,
            constructorArgs
        );

        console.log("Hook will deploy to:  ", hookAddress);
        console.log("CREATE2 salt:         ", uint256(salt));

        vm.startBroadcast(deployerPk);

        // ── 2. Deploy demo ERC20 ─────────────────────────────────────────────────
        DemoToken token = new DemoToken();
        console.log("DemoToken:            ", address(token));

        // ── 3. Deploy hook via CREATE2 ───────────────────────────────────────────
        PointsHook hook = new PointsHook{salt: salt}(IPoolManager(cfg.poolManager));
        require(address(hook) == hookAddress, "Hook address mismatch - re-run script");
        console.log("PointsHook:           ", address(hook));

        // ── 4. Build pool key (ETH = currency0, TOKEN = currency1) ───────────────
        PoolKey memory key = PoolKey({
            currency0:   Currency.wrap(address(0)),
            currency1:   Currency.wrap(address(token)),
            fee:         POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks:       IHooks(hookAddress)
        });

        // ── 5. Initialize pool at 1:1 price ──────────────────────────────────────
        IPoolManager(cfg.poolManager).initialize(key, SQRT_PRICE_1_1);
        console.log("Pool initialized");

        // ── 6. Add seed liquidity ─────────────────────────────────────────────────
        token.approve(cfg.poolModifyLiquidityTest, type(uint256).max);
        IPoolModifyLiquidityTest(cfg.poolModifyLiquidityTest).modifyLiquidity{value: 0.05 ether}(
            key,
            ModifyLiquidityParams({
                tickLower:      TICK_LOWER,
                tickUpper:      TICK_UPPER,
                liquidityDelta: 1e15,
                salt:           bytes32(0)
            }),
            ""
        );
        console.log("Seed liquidity added");

        vm.stopBroadcast();

        console.log("\n====== frontend/.env.local values ======");
        console.log("NEXT_PUBLIC_POINTS_HOOK_ADDRESS=", address(hook));
        console.log("NEXT_PUBLIC_TOKEN_ADDRESS=", address(token));
        console.log("NEXT_PUBLIC_POOL_FEE=3000");
        console.log("NEXT_PUBLIC_POOL_TICK_SPACING=60");
    }
}
