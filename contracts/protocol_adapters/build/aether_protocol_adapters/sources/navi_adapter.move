module aether_protocol_adapters::navi_adapter {
    use sui::balance::Balance;
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    // Test USDC coin for testnet
    public struct USDC has copy, drop {}

    /// NAVI pool deposit receipt (represents position in NAVI)
    public struct NAVIPosition has key, store {
        id: UID,
        amount: u64,
        timestamp: u64,
    }

    public struct NAVIDeposited has copy, drop {
        amount: u64,
        position_id: address,
    }

    public struct NAVIWithdrawn has copy, drop {
        amount: u64,
        position_id: address,
        yield_earned: u64,
    }

    /// Deposit USDC to NAVI protocol (simplified mock)
    public fun deposit_to_navi(
        usdc_coin: Coin<USDC>,
        ctx: &mut TxContext,
    ): NAVIPosition {
        let amount = coin::value(&usdc_coin);
        transfer::public_transfer(usdc_coin, @0x0);
        
        let position = NAVIPosition {
            id: object::new(ctx),
            amount,
            timestamp: tx_context::epoch(ctx),
        };

        event::emit(NAVIDeposited {
            amount,
            position_id: object::uid_to_address(&position.id),
        });

        position
    }

    /// Withdraw from NAVI (returns USDC + yield)
    public fun withdraw_from_navi(
        position: NAVIPosition,
        _ctx: &mut TxContext,
    ) {
        let NAVIPosition { id, amount, timestamp: _ } = position;
        
        // Simulate yield: 0.5% per epoch
        let yield_earned = (amount * 50) / 10000;

        event::emit(NAVIWithdrawn {
            amount,
            position_id: object::uid_to_address(&id),
            yield_earned,
        });

        object::delete(id);
    }

    /// Get current APY from NAVI (simplified)
    public fun get_navi_apy(): u64 {
        // Mock: 10% APY
        1000 // in basis points (100 = 1%)
    }
}
